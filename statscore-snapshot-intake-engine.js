/*
==========================================================
STATS-CORE™ SNAPSHOT / ATHLETE RECORD INTAKE ENGINE
==========================================================

File:
statscore-snapshot-intake-engine.js

Asset Type:
JavaScript Transaction Authority /
Athlete Source Record Manufacturing Engine

Owner Stream:
Stream 2 — Athlete Source Record / Evidence Provenance

Primary Operational Authority:
Stream 2 — Governed Athlete Source Record Manufacturing

System Layer:
Athlete Identity /
Snapshot Manufacturing /
Evidence Provenance /
Headshot Ingest /
Parent Approval Handoff /
PHNX Sports Media Handoff /
Runtime Continuity

Version:
STATSCORE-SNAPSHOT-INTAKE-ENGINE-V2.2-PRODUCTION-HARDENED

Status:
CONTROLLED FULL REPLACEMENT —
PHYSICAL EXECUTION HARDENING

==========================================================

CANONICAL RESPONSIBILITY

- Initialize and maintain permanent athlete identity.
- Create and update governed athlete snapshots.
- Capture source claims and evidence provenance.
- Generate and preserve athlete_id / snapshot_id.
- Upload and verify the canonical athlete headshot.
- Persist canonical headshot metadata.
- Create or reuse Parent Approval requests.
- Build and persist the canonical PHNX Sports Media handoff.
- Attempt PHNX Media queue handoff using the governed packet.
- Persist governed snapshot receipts.
- Preserve idempotency and transaction continuity.
- Establish athlete/snapshot runtime continuity after completion.
- Release downstream Athlete Workspace only when governed
  source-record manufacturing has succeeded.

==========================================================

CANONICAL DATA AUTHORITIES

public.statscore_athletes

Permanent athlete identity authority.

public.statscore_snapshots

Governed athlete snapshot / source-record authority.

public.statscore_snapshot_receipts

Governed Stream 2 snapshot receipt authority.

Physical receipt contract:

- receipt_id
- snapshot_id
- athlete_id
- event_type
- event_status
- event_message
- payload
- created_at

public.sc_parent_approval_requests

Parent / Guardian approval request authority.

public.phnx_media_handoff_packets

Governed Stream 2 → PHNX Sports Media handoff authority.

==========================================================

CRITICAL MANUFACTURING LAW

A receipt carrying snapshot_id MUST NOT be written before the
corresponding row physically exists in public.statscore_snapshots.

Required sequence:

PROPOSE athlete_id + snapshot_id
        ↓
PERSIST ATHLETE
        ↓
PERSIST SNAPSHOT
        ↓
READ BACK SNAPSHOT
        ↓
VERIFY athlete_id ↔ snapshot_id
        ↓
WRITE LIFECYCLE RECEIPTS
        ↓
HEADSHOT UPLOAD
        ↓
STORAGE VERIFICATION
        ↓
HEADSHOT METADATA PERSISTENCE
        ↓
DATABASE READ-BACK
        ↓
PARENT APPROVAL
        ↓
PHNX MEDIA HANDOFF
        ↓
FINAL READ-BACK
        ↓
COMPLETION RECEIPT
        ↓
RUNTIME CONTINUITY
        ↓
ATHLETE WORKSPACE RELEASE

==========================================================

HEADSHOT RELIABILITY LAW

Once a user selects a valid headshot, the interface MUST show
one of these states:

1. Local image preview.
2. Explicit processing state.
3. Verified persisted image.
4. Explicit recoverable failure state.

A selected file may NEVER silently disappear.

Local preview does NOT depend on:

- athlete_id
- snapshot_id
- Supabase database
- Supabase Storage
- RLS
- receipt persistence
- Parent Approval
- PHNX Media
- Athlete Dashboard

==========================================================

STREAM 2 DOES NOT

- Score athletes.
- Generate Athlete Intelligence.
- Edit media.
- Select music.
- Render player cards.
- Publish YouTube content.
- Execute Spider distribution.
- Send Multi-Box publication notifications.
- Manufacture Stream 3 Athlete Intelligence.
- Bypass Parent Approval authority.

==========================================================
*/

(() => {
  "use strict";

  /* ======================================================
     ENGINE IDENTITY
  ====================================================== */

  const ENGINE_ID =
    "statscore-snapshot-intake-engine";

  const ENGINE_VERSION =
    "STATSCORE-SNAPSHOT-INTAKE-ENGINE-V2.2-PRODUCTION-HARDENED";

  const RECEIPT_VERSION =
    "2.2";

  /* ======================================================
     DATABASE TABLES
  ====================================================== */

  const ATHLETE_TABLE =
    "statscore_athletes";

  const SNAPSHOT_TABLE =
    "statscore_snapshots";

  const AUDIT_TABLE =
    "statscore_snapshot_receipts";

  const PARENT_APPROVAL_TABLE =
    "sc_parent_approval_requests";

  const PHNX_HANDOFF_TABLE =
    "phnx_media_handoff_packets";

  /* ======================================================
     STORAGE CONTRACT
  ====================================================== */

  const HEADSHOT_BUCKET =
    "statscore-headshots";

  const HEADSHOT_MAX_BYTES =
    10 * 1024 * 1024;

  const HEADSHOT_ALLOWED_MIME_TYPES =
    new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif"
    ]);

  const HEADSHOT_ALLOWED_EXTENSIONS =
    new Set([
      "jpg",
      "jpeg",
      "png",
      "webp",
      "heic",
      "heif"
    ]);

  const HEADSHOT_UPLOAD_ATTEMPTS =
    3;

  const HEADSHOT_RETRY_DELAYS =
    Object.freeze([
      750,
      1500,
      3000
    ]);

  const HEADSHOT_PREVIEW_TIMEOUT_MS =
    5000;

  /* ======================================================
     PHNX MEDIA CONTRACT
  ====================================================== */

  const PHNX_CONTRACT_NAME =
    "PHNX_SPORTS_MEDIA_HANDOFF";

  const PHNX_CONTRACT_VERSION =
    "1.0";

  const PHNX_SOURCE_SYSTEM =
    "STATS_CORE";

  const PHNX_SOURCE_STREAM =
    "STREAM_2";

  const PHNX_TARGET_SYSTEM =
    "PHNX_SPORTS_MEDIA";

  /* ======================================================
     MEDIA STATUS
  ====================================================== */

  const MEDIA_STATUS =
    Object.freeze({
      NOT_READY:
        "NOT_READY",

      HEADSHOT_PENDING:
        "HEADSHOT_PENDING",

      HEADSHOT_UPLOADING:
        "HEADSHOT_UPLOADING",

      HEADSHOT_VERIFIED:
        "HEADSHOT_VERIFIED",

      HANDOFF_READY:
        "HANDOFF_READY",

      HANDOFF_QUEUED:
        "HANDOFF_QUEUED",

      HANDOFF_QUEUE_FAILED:
        "HANDOFF_QUEUE_FAILED"
    });

  const HEADSHOT_UI_STATE =
    Object.freeze({
      MISSING:
        "MISSING",

      SELECTED:
        "SELECTED",

      VALIDATING:
        "VALIDATING",

      UPLOADING:
        "UPLOADING",

      VERIFYING:
        "VERIFYING",

      PERSISTING:
        "PERSISTING",

      VERIFIED:
        "VERIFIED",

      FAILED:
        "FAILED"
    });

  /* ======================================================
     ACTIVE RUNTIME KEYS
  ====================================================== */

  const ACTIVE_SNAPSHOT_KEY =
    "STATSCORE_ACTIVE_SNAPSHOT_ID";

  const ACTIVE_ATHLETE_KEY =
    "STATSCORE_ACTIVE_ATHLETE_ID";

  const SECONDARY_SNAPSHOT_KEY =
    "statscore_active_snapshot_id";

  const SECONDARY_ATHLETE_KEY =
    "statscore_active_athlete_id";

  const LEGACY_SNAPSHOT_KEY =
    "statscore_snapshot_id";

  const LEGACY_ATHLETE_KEY =
    "statscore_athlete_id";

  /* ======================================================
     HTML CONTRACT
  ====================================================== */

  const REQUIRED_HTML_IDS =
    Object.freeze([
      "snapshotForm",

      "athleteId",
      "snapshotId",
      "sportMetricPayload",
      "sourceClaimsPayload",

      "athleteHeadshotUpload",

      "headshotUrl",
      "headshotPath",
      "headshotFileName",

      "headshotPreview",
      "headshotUploadBox",
      "headshotUploadText",
      "headshotUploadHint",

      "addHeadshotBtn",
      "removeHeadshotBtn",

      "submitSnapshotBtn",
      "saveDraftBtn",
      "requestVerificationBtn",
      "viewProfileBtn",

      "recordBadge",

      "statusProfile",
      "statusSource",
      "statusTrust",
      "statusMetrics",
      "statusVerification",
      "statusPhnxMedia",

      "mediaQueueBadge",
      "mediaStatusHeadshot",
      "mediaStatusCard",
      "mediaStatusFilm",
      "mediaStatusRouting",

      "systemMessage"
    ]);

  /* ======================================================
     RUNTIME STATE
  ====================================================== */

  let selectedHeadshotFile =
    null;

  let selectedHeadshotPreviewUrl =
    "";

  let selectedHeadshotPreviewMode =
    null;

  let activeTransactionPromise =
    null;

  let bootCompleted =
    false;

  let runtimePreflightComplete =
    false;

  let runtimePreflightResult =
    null;

  let currentIntakeMode = {
    mode:
      "create",

    snapshot_id:
      null,

    forced_new:
      false
  };

  /* ======================================================
     GENERAL UTILITIES
  ====================================================== */

  function nowISO() {
    return new Date()
      .toISOString();
  }

  function clean(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .trim();
  }

  function safeObject(value) {
    if (!value) {
      return {};
    }

    if (
      typeof value ===
      "object"
    ) {
      return value;
    }

    try {
      const parsed =
        JSON.parse(value);

      return (
        parsed &&
        typeof parsed ===
          "object"
      )
        ? parsed
        : {};
    } catch (_error) {
      return {};
    }
  }

  function serializeError(error) {
    if (!error) {
      return null;
    }

    return {
      name:
        error.name ||
        "Error",

      message:
        error.message ||
        String(error),

      code:
        error.code ||
        null,

      status:
        error.status ||
        error.statusCode ||
        null,

      details:
        error.details ||
        null,

      hint:
        error.hint ||
        null
    };
  }

  function readableStatus(value) {
    const text =
      clean(value);

    if (!text) {
      return "Pending";
    }

    return text
      .replace(
        /[_-]+/g,
        " "
      )
      .replace(
        /\b\w/g,
        letter =>
          letter.toUpperCase()
      );
  }

  function sleep(milliseconds) {
    return new Promise(
      resolve => {
        window.setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }

  function formatBytes(bytes) {
    const value =
      Number(bytes);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return "0 B";
    }

    const units = [
      "B",
      "KB",
      "MB",
      "GB"
    ];

    const index =
      Math.min(
        Math.floor(
          Math.log(value) /
          Math.log(1024)
        ),
        units.length - 1
      );

    const amount =
      value /
      Math.pow(
        1024,
        index
      );

    return (
      amount.toFixed(
        index === 0
          ? 0
          : 1
      ) +
      " " +
      units[index]
    );
  }

  function generateUuid() {
    if (
      window.crypto &&
      typeof window.crypto
        .randomUUID ===
        "function"
    ) {
      return window.crypto
        .randomUUID();
    }

    return (
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    ).replace(
      /[xy]/g,
      character => {
        const random =
          Math.random() *
          16 |
          0;

        const value =
          character === "x"
            ? random
            : (
                random &
                0x3
              ) |
              0x8;

        return value
          .toString(16);
      }
    );
  }

  function generateAthleteId() {
    return generateUuid();
  }

  function generateSnapshotId() {
    return generateUuid();
  }

  /* ======================================================
     DOM UTILITIES
  ====================================================== */

  function val(id) {
    const element =
      document.getElementById(id);

    if (!element) {
      return "";
    }

    return clean(
      element.value
    );
  }

  function setVal(
    id,
    value
  ) {
    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    element.value =
      value ??
      "";
  }

  function setText(
    id,
    value
  ) {
    const element =
      document.getElementById(id);

    if (!element) {
      return;
    }

    element.textContent =
      value ??
      "";
  }

  function setFormControlValue(
    nameOrId,
    value
  ) {
    const byId =
      document.getElementById(
        nameOrId
      );

    const byName =
      document.querySelector(
        `[name="${nameOrId}"]`
      );

    const element =
      byId ||
      byName;

    if (!element) {
      return;
    }

    if (
      element.type ===
      "checkbox"
    ) {
      element.checked =
        Boolean(value);

      return;
    }

    if (
      element.type ===
      "radio"
    ) {
      const radios =
        document.querySelectorAll(
          `[name="${nameOrId}"]`
        );

      radios.forEach(
        radio => {
          radio.checked =
            String(radio.value) ===
            String(value);
        }
      );

      return;
    }

    element.value =
      value ??
      "";
  }

  /* ======================================================
     DATABASE RESOLUTION
  ====================================================== */

  function getDb() {
    const db =
      window.STATScoreData
        ?.getClient?.() ||
      window.supabaseClient ||
      window.STATSCORE_SUPABASE ||
      window.STATScoreSupabase ||
      null;

    if (
      !db ||
      typeof db.from !==
        "function"
    ) {
      throw new Error(
        "Supabase database client is not loaded. Snapshot Intake cannot execute."
      );
    }

    if (
      !db.storage ||
      typeof db.storage.from !==
        "function"
    ) {
      throw new Error(
        "Supabase Storage is not available. Headshot ingest cannot execute."
      );
    }

    return db;
  }

  async function awaitDbReady() {
    if (
      window.STATSCORE_DB_READY
    ) {
      try {
        await Promise.resolve(
          window.STATSCORE_DB_READY
        );
      } catch (error) {
        throw new Error(
          "STATS-CORE database initialization failed: " +
          (
            error?.message ||
            String(error)
          )
        );
      }
    }

    return getDb();
  }

  /* ======================================================
     HTML CONTRACT VALIDATION
  ====================================================== */

  function validateHtmlContract() {
    const missingIds =
      REQUIRED_HTML_IDS
        .filter(
          id =>
            !document
              .getElementById(id)
        );

    if (
      missingIds.length
    ) {
      throw new Error(
        "Snapshot Intake HTML contract is incomplete. Missing IDs: " +
        missingIds.join(", ")
      );
    }

    [
      "submitSnapshotBtn",
      "saveDraftBtn",
      "requestVerificationBtn",
      "addHeadshotBtn",
      "removeHeadshotBtn"
    ].forEach(
      id => {
        const button =
          document.getElementById(
            id
          );

        if (
          button &&
          button.tagName ===
            "BUTTON"
        ) {
          button.type =
            "button";
        }
      }
    );

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    fileInput.accept =
      ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";

    return true;
  }

  /* ======================================================
     RUNTIME PREFLIGHT

     This is intentionally non-destructive.

     It verifies browser/runtime authority before enabling
     user transactions.
  ====================================================== */

  async function runRuntimePreflight() {
    const findings = [];

    let db =
      null;

    try {
      db =
        getDb();
    } catch (error) {
      findings.push({
        authority:
          "DATABASE_CLIENT",

        ok:
          false,

        message:
          error.message
      });
    }

    if (db) {
      if (
        !db.auth ||
        typeof db.auth
          .getSession !==
          "function"
      ) {
        findings.push({
          authority:
            "AUTHENTICATION_SESSION",

          ok:
            false,

          message:
            "Supabase authentication session authority is unavailable."
        });
      } else {
        try {
          const sessionResult =
            await db.auth
              .getSession();

          if (
            sessionResult.error
          ) {
            findings.push({
              authority:
                "AUTHENTICATION_SESSION",

              ok:
                false,

              message:
                sessionResult
                  .error
                  .message ||
                "Authentication session inspection failed."
            });
          } else if (
            !sessionResult
              ?.data
              ?.session
              ?.user
          ) {
            findings.push({
              authority:
                "AUTHENTICATION_SESSION",

              ok:
                false,

              message:
                "No authenticated STATS-CORE session is available."
            });
          } else {
            findings.push({
              authority:
                "AUTHENTICATION_SESSION",

              ok:
                true,

              message:
                "Authenticated session available.",

              user_id:
                sessionResult
                  .data
                  .session
                  .user
                  .id ||
                null
            });
          }
        } catch (error) {
          findings.push({
            authority:
              "AUTHENTICATION_SESSION",

            ok:
              false,

            message:
              error?.message ||
              "Authentication session inspection failed."
          });
        }
      }
    }

    const ok =
      findings.every(
        finding =>
          finding.ok !==
          false
      );

    runtimePreflightResult = {
      ok,

      findings,

      checked_at:
        nowISO()
    };

    runtimePreflightComplete =
      true;

    return runtimePreflightResult;
  }

  /* ======================================================
     BOOT
  ====================================================== */

  document.addEventListener(
    "DOMContentLoaded",
    async () => {
      try {
        await awaitDbReady();

        validateHtmlContract();

        currentIntakeMode =
          resolveSnapshotIntakeMode();

        bindSnapshotIntakeEvents();

        if (
          currentIntakeMode.mode ===
          "edit"
        ) {
          await loadExistingSnapshot(
            currentIntakeMode
              .snapshot_id
          );
        } else {
          resetCreateMode();
        }

        updateSportEvidenceBlocks();

        updateSourceTrustFromInputs();

        updateMediaStatus();

        exposeDebugGlobals();

        const preflight =
          await runRuntimePreflight();

        if (
          !preflight.ok
        ) {
          throw new Error(
            "Snapshot Intake runtime preflight did not pass. Governed submission remains unavailable."
          );
        }

        bootCompleted =
          true;

        setTransactionButtonsDisabled(
          false
        );

        console.info(
          "[Stream 2] Snapshot Intake Engine initialized.",
          {
            version:
              ENGINE_VERSION,

            mode:
              currentIntakeMode,

            preflight
          }
        );
      } catch (error) {
        console.error(
          "[Stream 2] Snapshot Intake boot failed:",
          error
        );

        setSystemMessage(
          error?.message ||
          "Snapshot Intake failed to initialize.",
          "error"
        );

        setTransactionButtonsDisabled(
          true
        );
      }
    }
  );

  /* ======================================================
     MODE RESOLUTION
  ====================================================== */

  function resolveSnapshotIntakeMode() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const forcedNew =
      params.get("new") ===
      "1";

    const urlSnapshotId =
      clean(
        params.get(
          "snapshot_id"
        )
      );

    if (forcedNew) {
      clearActiveRecordContext();

      return {
        mode:
          "create",

        snapshot_id:
          null,

        forced_new:
          true
      };
    }

    if (urlSnapshotId) {
      setActiveSnapshotId(
        urlSnapshotId
      );

      return {
        mode:
          "edit",

        snapshot_id:
          urlSnapshotId,

        forced_new:
          false
      };
    }

    clearActiveRecordContext();

    return {
      mode:
        "create",

      snapshot_id:
        null,

      forced_new:
        false
    };
  }

  function clearActiveRecordContext() {
    [
      ACTIVE_SNAPSHOT_KEY,
      ACTIVE_ATHLETE_KEY,
      SECONDARY_SNAPSHOT_KEY,
      SECONDARY_ATHLETE_KEY,
      LEGACY_SNAPSHOT_KEY,
      LEGACY_ATHLETE_KEY
    ].forEach(
      key => {
        try {
          localStorage
            .removeItem(key);
        } catch (_error) {}

        try {
          sessionStorage
            .removeItem(key);
        } catch (_error) {}
      }
    );
  }

  /* ======================================================
     CREATE MODE RESET
  ====================================================== */

  function resetCreateMode() {
    const form =
      document.getElementById(
        "snapshotForm"
      );

    if (form) {
      form.reset();
    }

    selectedHeadshotFile =
      null;

    releaseSelectedPreviewUrl();

    clearHeadshotPreviewElement();

    setVal(
      "athleteId",
      ""
    );

    setVal(
      "snapshotId",
      ""
    );

    setVal(
      "sportMetricPayload",
      ""
    );

    setVal(
      "sourceClaimsPayload",
      ""
    );

    setVal(
      "headshotUrl",
      ""
    );

    setVal(
      "headshotPath",
      ""
    );

    setVal(
      "headshotFileName",
      ""
    );

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    if (fileInput) {
      fileInput.value =
        "";
    }

    const removeButton =
      document.getElementById(
        "removeHeadshotBtn"
      );

    if (removeButton) {
      removeButton.style.display =
        "none";
    }

    setText(
      "recordBadge",
      "Record Pending"
    );

    setText(
      "statusProfile",
      "Pending"
    );

    setText(
      "statusSource",
      "Self-Reported"
    );

    setText(
      "statusTrust",
      "Pending"
    );

    setText(
      "statusMetrics",
      "Pending"
    );

    setText(
      "statusVerification",
      "Pending"
    );

    setHeadshotUiState(
      HEADSHOT_UI_STATE.MISSING
    );

    setPhnxUiState(
      MEDIA_STATUS.NOT_READY
    );

    setSystemMessage(
      "",
      "neutral"
    );

    updateContinueRoute("");
  }

  /* ======================================================
     EVENT BINDING
  ====================================================== */

  function bindSnapshotIntakeEvents() {
    const sport =
      document.getElementById(
        "primarySport"
      );

    sport?.addEventListener(
      "change",
      updateSportEvidenceBlocks
    );

    [
      "sourceOrigin",
      "submittedByRole",
      "trustClassification",
      "phnxCertificationStatus",
      "phnxCertifiedId"
    ].forEach(
      id => {
        const element =
          document.getElementById(
            id
          );

        if (!element) {
          return;
        }

        element.addEventListener(
          "change",
          updateSourceTrustFromInputs
        );

        element.addEventListener(
          "input",
          updateSourceTrustFromInputs
        );
      }
    );

    [
      "highlightUrl",
      "gameFilmUrl",
      "socialProfileUrl",
      "recruitingProfileUrl"
    ].forEach(
      name => {
        const element =
          document.querySelector(
            `[name="${name}"]`
          );

        if (!element) {
          return;
        }

        element.addEventListener(
          "input",
          updateMediaStatus
        );

        element.addEventListener(
          "change",
          updateMediaStatus
        );
      }
    );

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    if (!fileInput) {
      throw new Error(
        "Snapshot Intake cannot bind headshot selection because #athleteHeadshotUpload is missing."
      );
    }

    fileInput.addEventListener(
      "change",
      handleHeadshotSelection
    );

    document
      .getElementById(
        "addHeadshotBtn"
      )
      ?.addEventListener(
        "click",
        event => {
          event.preventDefault();

          /*
          Allows re-selecting the same filename and still
          receiving a change event.
          */

          try {
            fileInput.value = "";
          } catch (_error) {}

          fileInput.click();
        }
      );

    document
      .getElementById(
        "removeHeadshotBtn"
      )
      ?.addEventListener(
        "click",
        event => {
          event.preventDefault();

          removeSelectedHeadshot();
        }
      );

    document
      .getElementById(
        "submitSnapshotBtn"
      )
      ?.addEventListener(
        "click",
        submitSnapshot
      );

    document
      .getElementById(
        "saveDraftBtn"
      )
      ?.addEventListener(
        "click",
        saveDraftSnapshot
      );

    document
      .getElementById(
        "requestVerificationBtn"
      )
      ?.addEventListener(
        "click",
        requestSnapshotVerification
      );

    document
      .getElementById(
        "viewProfileBtn"
      )
      ?.addEventListener(
        "click",
        event => {
          const snapshotId =
            clean(
              val(
                "snapshotId"
              )
            ) ||
            getActiveSnapshotId();

          if (!snapshotId) {
            event.preventDefault();

            setSystemMessage(
              "Submit or save the athlete record before continuing.",
              "warning"
            );

            return;
          }

          event.preventDefault();

          window.location.href =
            (
              "athlete-dashboard.html" +
              "?snapshot_id=" +
              encodeURIComponent(
                snapshotId
              ) +
              "&from=athlete-record-intake"
            );
        }
      );

    console.info(
      "[Stream 2][Headshot] File-input listener bound."
    );
  }

  /* ======================================================
     TRANSACTION BUTTON CONTROL
  ====================================================== */

  function setTransactionButtonsDisabled(
    disabled
  ) {
    [
      "submitSnapshotBtn",
      "saveDraftBtn",
      "requestVerificationBtn"
    ].forEach(
      id => {
        const element =
          document.getElementById(
            id
          );

        if (element) {
          element.disabled =
            Boolean(disabled);
        }
      }
    );

    /*
    Headshot selection/removal remains available while
    ordinary form editing is available, except during the
    active manufacturing transaction.
    */

    [
      "addHeadshotBtn",
      "removeHeadshotBtn",
      "athleteHeadshotUpload"
    ].forEach(
      id => {
        const element =
          document.getElementById(
            id
          );

        if (element) {
          element.disabled =
            Boolean(disabled);
        }
      }
    );
  }

  /* ======================================================
     SYSTEM MESSAGE
  ====================================================== */

  function setSystemMessage(
    message,
    state = "neutral"
  ) {
    const element =
      document.getElementById(
        "systemMessage"
      );

    if (!element) {
      return;
    }

    element.textContent =
      message ||
      "";

    element.dataset.state =
      state;

    switch (state) {
      case "error":
        element.style.color =
          "#ff2b1f";
        break;

      case "warning":
        element.style.color =
          "#f4c542";
        break;

      case "success":
        element.style.color =
          "#25d366";
        break;

      default:
        element.style.color =
          "";
    }
  }

  /* ======================================================
     HEADSHOT UI STATE
  ====================================================== */

  function setHeadshotUiState(
    state,
    detail = ""
  ) {
    const uploadBox =
      document.getElementById(
        "headshotUploadBox"
      );

    if (uploadBox) {
      uploadBox.dataset.headshotState =
        state;

      uploadBox.classList.remove(
        "ready",
        "error",
        "uploading",
        "verified"
      );
    }

    switch (state) {
      case HEADSHOT_UI_STATE.SELECTED:
        uploadBox?.classList.add(
          "ready"
        );

        setText(
          "mediaStatusHeadshot",
          "Selected"
        );

        setText(
          "mediaStatusCard",
          "Pending Upload"
        );

        setText(
          "headshotUploadText",
          "Headshot Selected"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Ready for secure upload"
        );
        break;

      case HEADSHOT_UI_STATE.VALIDATING:
        uploadBox?.classList.add(
          "uploading"
        );

        setText(
          "mediaStatusHeadshot",
          "Validating"
        );

        setText(
          "mediaStatusCard",
          "Pending"
        );

        setText(
          "headshotUploadText",
          "Validating Headshot"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Checking image file"
        );
        break;

      case HEADSHOT_UI_STATE.UPLOADING:
        uploadBox?.classList.add(
          "uploading"
        );

        setText(
          "mediaStatusHeadshot",
          "Uploading"
        );

        setText(
          "mediaStatusCard",
          "Pending"
        );

        setText(
          "headshotUploadText",
          "Uploading Headshot"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Uploading secure athlete image"
        );
        break;

      case HEADSHOT_UI_STATE.VERIFYING:
        uploadBox?.classList.add(
          "uploading"
        );

        setText(
          "mediaStatusHeadshot",
          "Verifying"
        );

        setText(
          "mediaStatusCard",
          "Pending"
        );

        setText(
          "headshotUploadText",
          "Verifying Headshot"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Confirming uploaded image"
        );
        break;

      case HEADSHOT_UI_STATE.PERSISTING:
        uploadBox?.classList.add(
          "uploading"
        );

        setText(
          "mediaStatusHeadshot",
          "Saving"
        );

        setText(
          "mediaStatusCard",
          "Pending"
        );

        setText(
          "headshotUploadText",
          "Saving Headshot"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Saving verified athlete image"
        );
        break;

      case HEADSHOT_UI_STATE.VERIFIED:
        uploadBox?.classList.add(
          "verified",
          "ready"
        );

        setText(
          "mediaStatusHeadshot",
          "Verified"
        );

        setText(
          "mediaStatusCard",
          "Ready"
        );

        setText(
          "headshotUploadText",
          "Headshot Verified"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Athlete image saved"
        );
        break;

      case HEADSHOT_UI_STATE.FAILED:
        uploadBox?.classList.add(
          "error"
        );

        setText(
          "mediaStatusHeadshot",
          "Needs Attention"
        );

        setText(
          "mediaStatusCard",
          "Not Ready"
        );

        setText(
          "headshotUploadText",
          "Headshot Needs Attention"
        );

        setText(
          "headshotUploadHint",
          detail ||
          "Choose another image or retry"
        );
        break;

      case HEADSHOT_UI_STATE.MISSING:
      default:
        setText(
          "mediaStatusHeadshot",
          "Required"
        );

        setText(
          "mediaStatusCard",
          "Not Ready"
        );

        setText(
          "headshotUploadText",
          "ADD ATHLETE HEADSHOT"
        );

        setText(
          "headshotUploadHint",
          "Choose JPG, PNG, WEBP, HEIC, or HEIF"
        );
        break;
    }
  }

  /* ======================================================
     PHNX MEDIA UI
  ====================================================== */

  function setPhnxUiState(
    status,
    detail = ""
  ) {
    setText(
      "statusPhnxMedia",
      readableStatus(status)
    );

    switch (status) {
      case MEDIA_STATUS.HEADSHOT_PENDING:
        setText(
          "mediaQueueBadge",
          "Media Handoff Pending"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Headshot selected"
        );
        break;

      case MEDIA_STATUS.HEADSHOT_UPLOADING:
        setText(
          "mediaQueueBadge",
          "Headshot Uploading"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Secure upload in progress"
        );
        break;

      case MEDIA_STATUS.HEADSHOT_VERIFIED:
        setText(
          "mediaQueueBadge",
          "Headshot Verified"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Media package preparation available"
        );
        break;

      case MEDIA_STATUS.HANDOFF_READY:
        setText(
          "mediaQueueBadge",
          "Media Handoff Ready"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Media packet ready"
        );
        break;

      case MEDIA_STATUS.HANDOFF_QUEUED:
        setText(
          "mediaQueueBadge",
          "PHNX Media Queued"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Media packet queued"
        );
        break;

      case MEDIA_STATUS.HANDOFF_QUEUE_FAILED:
        setText(
          "mediaQueueBadge",
          "Media Retry Pending"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Media packet preserved for retry"
        );
        break;

      case MEDIA_STATUS.NOT_READY:
      default:
        setText(
          "statusPhnxMedia",
          "Not Ready"
        );

        setText(
          "mediaQueueBadge",
          "Media Queue Pending"
        );

        setText(
          "mediaStatusRouting",
          detail ||
          "Headshot required"
        );
        break;
    }
  }

  /* ======================================================
     HEADSHOT SELECTION
     CRITICAL USER-TRUST PATH
  ====================================================== */

  async function handleHeadshotSelection(
    event
  ) {
    const input =
      event?.currentTarget ||
      event?.target ||
      document.getElementById(
        "athleteHeadshotUpload"
      );

    const file =
      input?.files?.[0] ||
      null;

    if (!file) {
      console.warn(
        "[Stream 2][Headshot] File chooser returned no file."
      );

      return {
        valid:
          false,

        reason:
          "NO_FILE"
      };
    }

    /*
    Preserve immediately.

    A valid user selection must never disappear because a
    later preview operation fails.
    */

    selectedHeadshotFile =
      file;

    console.info(
      "[Stream 2][Headshot] File captured.",
      {
        name:
          file.name,

        type:
          file.type,

        size:
          file.size
      }
    );

    try {
      setHeadshotUiState(
        HEADSHOT_UI_STATE.VALIDATING,
        `Checking ${file.name}`
      );

      const validation =
        validateHeadshotFile(
          file
        );

      setVal(
        "headshotFileName",
        file.name
      );

      const removeButton =
        document.getElementById(
          "removeHeadshotBtn"
        );

      if (removeButton) {
        removeButton.style.display =
          "flex";
      }

      const previewResult =
        await renderSelectedHeadshotPreview(
          file
        );

      if (
        previewResult.rendered
      ) {
        setHeadshotUiState(
          HEADSHOT_UI_STATE.SELECTED,
          (
            file.name +
            " · " +
            formatBytes(
              file.size
            )
          )
        );

        setSystemMessage(
          "Athlete headshot selected and ready for secure upload.",
          "success"
        );
      } else {
        /*
        Browser decode limitation is not file loss.
        */

        setHeadshotUiState(
          HEADSHOT_UI_STATE.SELECTED,
          (
            file.name +
            " · " +
            formatBytes(
              file.size
            ) +
            " · File retained"
          )
        );

        setSystemMessage(
          "Headshot selected. This browser could not display the local preview, but the image has been retained for secure upload.",
          "warning"
        );
      }

      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_PENDING,
        previewResult.rendered
          ? "Headshot selected — secure upload pending"
          : "Headshot retained — secure upload pending"
      );

      updateMediaStatus();

      console.info(
        "[Stream 2][Headshot] Selection accepted.",
        {
          filename:
            file.name,

          extension:
            validation.extension,

          mime_type:
            validation.mime_type,

          size_bytes:
            validation.size_bytes,

          preview_rendered:
            previewResult.rendered,

          preview_method:
            previewResult.method,

          file_retained:
            selectedHeadshotFile ===
            file
        }
      );

      return {
        valid:
          true,

        file,

        validation,

        preview:
          previewResult
      };
    } catch (error) {
      /*
      Actual validation failure means the file itself does
      not satisfy the governed image contract.
      */

      console.error(
        "[Stream 2][Headshot] Selection rejected:",
        error
      );

      selectedHeadshotFile =
        null;

      releaseSelectedPreviewUrl();

      clearHeadshotPreviewElement();

      setVal(
        "headshotFileName",
        ""
      );

      if (input) {
        try {
          input.value = "";
        } catch (_error) {}
      }

      const removeButton =
        document.getElementById(
          "removeHeadshotBtn"
        );

      if (removeButton) {
        removeButton.style.display =
          "none";
      }

      setHeadshotUiState(
        HEADSHOT_UI_STATE.FAILED,
        (
          error?.message ||
          "Selected image could not be accepted."
        )
      );

      setPhnxUiState(
        MEDIA_STATUS.NOT_READY,
        "Choose another headshot"
      );

      setSystemMessage(
        (
          error?.message ||
          "Headshot selection failed."
        ) +
        " Choose another image to retry.",
        "error"
      );

      return {
        valid:
          false,

        error
      };
    }
  }

  /* ======================================================
     LOCAL HEADSHOT PREVIEW
  ====================================================== */

  async function renderSelectedHeadshotPreview(
    file
  ) {
    const preview =
      document.getElementById(
        "headshotPreview"
      );

    if (!preview) {
      throw new Error(
        "Critical headshot preview element #headshotPreview was not found."
      );
    }

    /*
    Clear only visual preview state.
    Do NOT clear selectedHeadshotFile.
    */

    releaseSelectedPreviewUrl();

    clearHeadshotPreviewElement();

    /*
    Method 1:
    Local blob URL.
    */

    try {
      const objectUrl =
        URL.createObjectURL(
          file
        );

      selectedHeadshotPreviewUrl =
        objectUrl;

      selectedHeadshotPreviewMode =
        "OBJECT_URL";

      const rendered =
        await loadPreviewImage(
          preview,
          objectUrl,
          HEADSHOT_PREVIEW_TIMEOUT_MS
        );

      if (rendered) {
        showHeadshotPreview(
          preview
        );

        return {
          rendered:
            true,

          method:
            "OBJECT_URL"
        };
      }

      releaseSelectedPreviewUrl();
    } catch (error) {
      console.warn(
        "[Stream 2][Headshot] Object URL preview failed:",
        error
      );

      releaseSelectedPreviewUrl();
    }

    /*
    Method 2:
    FileReader Data URL fallback.
    */

    try {
      const dataUrl =
        await readFileAsDataUrl(
          file
        );

      if (dataUrl) {
        selectedHeadshotPreviewMode =
          "DATA_URL";

        const rendered =
          await loadPreviewImage(
            preview,
            dataUrl,
            HEADSHOT_PREVIEW_TIMEOUT_MS
          );

        if (rendered) {
          showHeadshotPreview(
            preview
          );

          return {
            rendered:
              true,

            method:
              "DATA_URL"
          };
        }
      }
    } catch (error) {
      console.warn(
        "[Stream 2][Headshot] FileReader preview fallback failed:",
        error
      );
    }

    /*
    Browser could not decode the image.

    The selected File remains retained.
    */

    clearHeadshotPreviewElement();

    selectedHeadshotPreviewMode =
      "BROWSER_DECODE_UNAVAILABLE";

    return {
      rendered:
        false,

      method:
        "BROWSER_DECODE_UNAVAILABLE"
    };
  }

  function loadPreviewImage(
    preview,
    source,
    timeoutMs
  ) {
    return new Promise(
      resolve => {
        if (
          !preview ||
          !source
        ) {
          resolve(false);

          return;
        }

        let settled =
          false;

        let timer =
          null;

        const finish =
          success => {
            if (settled) {
              return;
            }

            settled =
              true;

            if (timer) {
              window.clearTimeout(
                timer
              );
            }

            preview.onload =
              null;

            preview.onerror =
              null;

            resolve(
              Boolean(success)
            );
          };

        preview.onload =
          () => {
            finish(true);
          };

        preview.onerror =
          () => {
            finish(false);
          };

        timer =
          window.setTimeout(
            () => {
              console.warn(
                "[Stream 2][Headshot] Local preview timed out."
              );

              finish(false);
            },
            timeoutMs
          );

        preview.src =
          source;

        if (
          preview.complete &&
          Number(
            preview.naturalWidth ||
            0
          ) > 0
        ) {
          finish(true);
        }
      }
    );
  }

  function readFileAsDataUrl(
    file
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader();

        reader.onload =
          () => {
            resolve(
              typeof reader.result ===
                "string"
                ? reader.result
                : ""
            );
          };

        reader.onerror =
          () => {
            reject(
              reader.error ||
              new Error(
                "Browser FileReader could not read the selected headshot."
              )
            );
          };

        reader.onabort =
          () => {
            reject(
              new Error(
                "Headshot preview reading was interrupted."
              )
            );
          };

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  function showHeadshotPreview(
    preview
  ) {
    if (!preview) {
      return;
    }

    preview.hidden =
      false;

    preview.removeAttribute(
      "hidden"
    );

    preview.style.display =
      "block";

    preview.style.visibility =
      "visible";

    preview.style.opacity =
      "1";

    preview.style.maxWidth =
      "100%";

    preview.style.width =
      "100%";

    preview.style.height =
      "100%";

    preview.style.objectFit =
      "cover";

    preview.style.objectPosition =
      "center top";
  }

  function clearHeadshotPreviewElement() {
    const preview =
      document.getElementById(
        "headshotPreview"
      );

    if (!preview) {
      return;
    }

    preview.onload =
      null;

    preview.onerror =
      null;

    preview.removeAttribute(
      "src"
    );

    preview.style.display =
      "none";
  }

  function releaseSelectedPreviewUrl() {
    if (
      selectedHeadshotPreviewUrl &&
      selectedHeadshotPreviewUrl
        .startsWith("blob:")
    ) {
      try {
        URL.revokeObjectURL(
          selectedHeadshotPreviewUrl
        );
      } catch (error) {
        console.warn(
          "[Stream 2][Headshot] Preview URL release warning:",
          error
        );
      }
    }

    selectedHeadshotPreviewUrl =
      "";

    selectedHeadshotPreviewMode =
      null;
  }

  function removeSelectedHeadshot() {
    selectedHeadshotFile =
      null;

    releaseSelectedPreviewUrl();

    clearHeadshotPreviewElement();

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    if (fileInput) {
      try {
        fileInput.value =
          "";
      } catch (_error) {}
    }

    /*
    Important:
    In edit mode, removal of an already-persisted canonical
    headshot is a separate governed operation.

    Therefore this ordinary selection control only clears
    local uncommitted replacement state unless the page is
    still in create mode.
    */

    if (
      currentIntakeMode.mode ===
      "create"
    ) {
      setVal(
        "headshotUrl",
        ""
      );

      setVal(
        "headshotPath",
        ""
      );

      setVal(
        "headshotFileName",
        ""
      );
    }

    const removeButton =
      document.getElementById(
        "removeHeadshotBtn"
      );

    if (removeButton) {
      removeButton.style.display =
        "none";
    }

    if (
      currentIntakeMode.mode ===
      "edit" &&
      clean(
        val("headshotUrl")
      )
    ) {
      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFIED,
        clean(
          val(
            "headshotFileName"
          )
        ) ||
        "Saved athlete headshot"
      );

      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_VERIFIED,
        "Saved athlete headshot retained"
      );

      setSystemMessage(
        "Selected replacement removed. The saved athlete headshot was not changed.",
        "neutral"
      );
    } else {
      setHeadshotUiState(
        HEADSHOT_UI_STATE.MISSING
      );

      setPhnxUiState(
        MEDIA_STATUS.NOT_READY
      );

      setSystemMessage(
        "Headshot removed. Choose an athlete headshot to continue.",
        "neutral"
      );
    }

    updateMediaStatus();
  }

  /* ======================================================
     HEADSHOT FILE VALIDATION
  ====================================================== */

  function validateHeadshotFile(
    file
  ) {
    if (
      !(file instanceof File)
    ) {
      throw new Error(
        "A valid athlete image file is required."
      );
    }

    if (
      !file.size ||
      file.size <= 0
    ) {
      throw new Error(
        "The selected headshot is empty."
      );
    }

    if (
      file.size >
      HEADSHOT_MAX_BYTES
    ) {
      throw new Error(
        "Headshot exceeds the " +
        formatBytes(
          HEADSHOT_MAX_BYTES
        ) +
        " maximum."
      );
    }

    const extension =
      getFileExtension(
        file.name
      );

    if (
      !HEADSHOT_ALLOWED_EXTENSIONS
        .has(extension)
    ) {
      throw new Error(
        "Unsupported headshot extension: ." +
        (
          extension ||
          "unknown"
        )
      );
    }

    const mimeType =
      normalizeMimeType(
        file.type,
        extension
      );

    if (
      !HEADSHOT_ALLOWED_MIME_TYPES
        .has(mimeType)
    ) {
      throw new Error(
        "Unsupported headshot MIME type: " +
        (
          mimeType ||
          "unknown"
        )
      );
    }

    return {
      valid:
        true,

      extension,

      mime_type:
        mimeType,

      size_bytes:
        file.size,

      original_filename:
        file.name
    };
  }

  function normalizeMimeType(
    type,
    extension
  ) {
    const normalized =
      clean(type)
        .toLowerCase();

    if (normalized) {
      return normalized;
    }

    const fallback = {
      jpg:
        "image/jpeg",

      jpeg:
        "image/jpeg",

      png:
        "image/png",

      webp:
        "image/webp",

      heic:
        "image/heic",

      heif:
        "image/heif"
    };

    return (
      fallback[
        extension
      ] ||
      ""
    );
  }

  function getFileExtension(
    filename
  ) {
    const value =
      clean(filename)
        .toLowerCase();

    const parts =
      value.split(".");

    if (
      parts.length <
      2
    ) {
      return "";
    }

    return (
      parts.pop() ||
      ""
    );
  }

  function sanitizeFilename(
    filename
  ) {
    return clean(filename)
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      )
      .slice(
        0,
        180
      );
  }

  function buildCanonicalHeadshotPath({
    athleteId,
    snapshotId,
    extension
  }) {
    if (
      !athleteId ||
      !snapshotId ||
      !extension
    ) {
      throw new Error(
        "athlete_id, snapshot_id, and extension are required for headshot storage."
      );
    }

    return (
      "athletes/" +
      athleteId +
      "/snapshots/" +
      snapshotId +
      "/headshots/current." +
      extension
    );
  }

  /* ======================================================
     FORM ROW CONSTRUCTION
  ====================================================== */

  async function buildSnapshotRow(
    status
  ) {
    const form =
      document.getElementById(
        "snapshotForm"
      );

    if (!form) {
      throw new Error(
        "snapshotForm was not found."
      );
    }

    const formData =
      new FormData(form);

    const sourceClaims =
      buildSourceClaimsPayload(
        formData
      );

    const sportMetrics =
      buildSportMetricPayload(
        formData
      );

    const firstName =
      clean(
        formData.get(
          "firstName"
        )
      );

    const lastName =
      clean(
        formData.get(
          "lastName"
        )
      );

    if (
      !firstName ||
      !lastName
    ) {
      throw new Error(
        "Athlete first name and last name are required."
      );
    }

    const primarySport =
      clean(
        formData.get(
          "primarySport"
        )
      );

    if (!primarySport) {
      throw new Error(
        "Primary sport is required."
      );
    }

    let athleteId =
      clean(
        val(
          "athleteId"
        )
      );

    let snapshotId =
      clean(
        val(
          "snapshotId"
        )
      );

    if (
      currentIntakeMode.mode ===
      "edit"
    ) {
      athleteId =
        athleteId ||
        getActiveAthleteId();

      snapshotId =
        snapshotId ||
        currentIntakeMode
          .snapshot_id ||
        getActiveSnapshotId();
    } else {
      /*
      Generate once per active create-mode page transaction.

      Hidden form state retains these values across a retry.
      */

      athleteId =
        athleteId ||
        generateAthleteId();

      snapshotId =
        snapshotId ||
        generateSnapshotId();
    }

    if (!athleteId) {
      throw new Error(
        "Unable to initialize athlete_id."
      );
    }

    if (!snapshotId) {
      throw new Error(
        "Unable to initialize snapshot_id."
      );
    }

    setVal(
      "athleteId",
      athleteId
    );

    setVal(
      "snapshotId",
      snapshotId
    );

    const submittedAt =
      status === "draft"
        ? null
        : nowISO();

    const mediaStatus =
      (
        selectedHeadshotFile ||
        clean(
          val(
            "headshotUrl"
          )
        )
      )
        ? MEDIA_STATUS
            .HEADSHOT_PENDING
        : MEDIA_STATUS
            .NOT_READY;

    const row = {
      snapshot_id:
        snapshotId,

      athlete_id:
        athleteId,

      snapshot_status:
        status,

      source_record_status:
        status === "draft"
          ? "draft"
          : "submitted",

      verification_status:
        status === "draft"
          ? "pending"
          : "UNVERIFIED",

      score_status:
        "not_issued",

      first_name:
        firstName,

      last_name:
        lastName,

      athlete_display_name:
        (
          firstName +
          " " +
          lastName
        ).trim(),

      graduation_class:
        clean(
          formData.get(
            "graduationClass"
          )
        ),

      city_state:
        clean(
          formData.get(
            "cityState"
          )
        ),

      school_program:
        clean(
          formData.get(
            "schoolProgram"
          )
        ),

      primary_sport:
        primarySport,

      height:
        clean(
          formData.get(
            "height"
          )
        ),

      weight:
        clean(
          formData.get(
            "weight"
          )
        ),

      primary_position:
        clean(
          formData.get(
            "primaryPosition"
          )
        ),

      secondary_position:
        clean(
          formData.get(
            "secondaryPosition"
          )
        ),

      dominant_hand_foot:
        clean(
          formData.get(
            "dominantHandFoot"
          )
        ),

      jersey_number:
        clean(
          formData.get(
            "jerseyNumber"
          )
        ),

      current_gpa:
        clean(
          formData.get(
            "currentGpa"
          )
        ),

      ncaa_eligibility_status:
        clean(
          formData.get(
            "ncaaEligibilityStatus"
          )
        ),

      transcript_available:
        clean(
          formData.get(
            "transcriptAvailable"
          )
        ),

      counselor_contact_available:
        clean(
          formData.get(
            "counselorContactAvailable"
          )
        ),

      academic_notes:
        clean(
          formData.get(
            "academicNotes"
          )
        ),

      highlight_url:
        clean(
          formData.get(
            "highlightUrl"
          )
        ),

      game_film_url:
        clean(
          formData.get(
            "gameFilmUrl"
          )
        ),

      social_profile_url:
        clean(
          formData.get(
            "socialProfileUrl"
          )
        ),

      recruiting_profile_url:
        clean(
          formData.get(
            "recruitingProfileUrl"
          )
        ),

      guardian_name:
        clean(
          formData.get(
            "guardianName"
          )
        ),

      guardian_email:
        clean(
          formData.get(
            "guardianEmail"
          )
        ),

      guardian_phone:
        clean(
          formData.get(
            "guardianPhone"
          )
        ),

      coach_name:
        clean(
          formData.get(
            "coachName"
          )
        ),

      coach_email:
        clean(
          formData.get(
            "coachEmail"
          )
        ),

      verification_permission:
        clean(
          formData.get(
            "verificationPermission"
          )
        ),

      source_origin:
        sourceClaims
          .source_origin,

      submitted_by_role:
        sourceClaims
          .submitted_by_role,

      submitted_by_name:
        sourceClaims
          .submitted_by_name,

      submitted_by_email:
        sourceClaims
          .submitted_by_email,

      submitted_by_user_id:
        sourceClaims
          .submitted_by_user_id,

      submitted_by_professional_id:
        sourceClaims
          .submitted_by_professional_id,

      phnx_certified_id:
        sourceClaims
          .phnx_certified_id,

      phnx_certification_status:
        sourceClaims
          .phnx_certification_status,

      trust_classification:
        sourceClaims
          .trust_classification,

      source_organization:
        sourceClaims
          .source_organization,

      submission_source:
        sourceClaims
          .submission_source,

      submission_timestamp:
        sourceClaims
          .captured_at,

      sport_metric_payload:
        sportMetrics,

      source_claims_payload:
        sourceClaims,

      headshot_url:
        clean(
          val(
            "headshotUrl"
          )
        ),

      headshot_public_url:
        clean(
          val(
            "headshotUrl"
          )
        ),

      headshot_path:
        clean(
          val(
            "headshotPath"
          )
        ),

      headshot_filename:
        clean(
          val(
            "headshotFileName"
          )
        ),

      media_status:
        mediaStatus,

      phnx_media_handoff_status:
        MEDIA_STATUS
          .NOT_READY,

      raw_payload: {
        ...Object.fromEntries(
          formData.entries()
        ),

        sport_metric_payload:
          sportMetrics,

        source_claims_payload:
          sourceClaims,

        intake_engine_version:
          ENGINE_VERSION,

        intake_mode:
          currentIntakeMode
            .mode,

        captured_at:
          nowISO()
      },

      submitted_at:
        submittedAt,

      updated_at:
        nowISO(),

      last_source_update_at:
        nowISO()
    };

    setVal(
      "sportMetricPayload",
      JSON.stringify(
        sportMetrics
      )
    );

    setVal(
      "sourceClaimsPayload",
      JSON.stringify(
        sourceClaims
      )
    );

    return row;
  }

  /* ======================================================
     SOURCE PROVENANCE
  ====================================================== */

  function buildSourceClaimsPayload(
    formData
  ) {
    return {
      source_origin:
        clean(
          formData.get(
            "sourceOrigin"
          )
        ),

      submission_source:
        clean(
          formData.get(
            "submissionSource"
          )
        ) ||
        "snapshot-intake.html",

      submitted_by_role:
        clean(
          formData.get(
            "submittedByRole"
          )
        ),

      submitted_by_name:
        clean(
          formData.get(
            "submittedByName"
          )
        ),

      submitted_by_email:
        clean(
          formData.get(
            "submittedByEmail"
          )
        ),

      submitted_by_user_id:
        null,

      submitted_by_professional_id:
        clean(
          formData.get(
            "phnxCertifiedId"
          )
        ) ||
        null,

      phnx_certified_id:
        clean(
          formData.get(
            "phnxCertifiedId"
          )
        ),

      phnx_certification_status:
        clean(
          formData.get(
            "phnxCertificationStatus"
          )
        ),

      trust_classification:
        clean(
          formData.get(
            "trustClassification"
          )
        ) ||
        "SELF_REPORTED",

      source_organization:
        clean(
          formData.get(
            "sourceOrganization"
          )
        ),

      captured_at:
        nowISO()
    };
  }

  /* ======================================================
     SPORT METRIC PAYLOAD
  ====================================================== */

  function buildSportMetricPayload(
    formData
  ) {
    const sport =
      clean(
        formData.get(
          "primarySport"
        )
      ).toLowerCase();

    const universal = {
      sport,

      primaryPosition:
        clean(
          formData.get(
            "primaryPosition"
          )
        ),

      secondaryPosition:
        clean(
          formData.get(
            "secondaryPosition"
          )
        ),

      height:
        clean(
          formData.get(
            "height"
          )
        ),

      weight:
        clean(
          formData.get(
            "weight"
          )
        ),

      dominantHandFoot:
        clean(
          formData.get(
            "dominantHandFoot"
          )
        ),

      jerseyNumber:
        clean(
          formData.get(
            "jerseyNumber"
          )
        )
    };

    if (
      sport ===
      "football"
    ) {
      return {
        ...universal,

        footballDash40:
          clean(
            formData.get(
              "footballDash40"
            )
          ),

        footballVerticalJump:
          clean(
            formData.get(
              "footballVerticalJump"
            )
          ),

        footballShuttle:
          clean(
            formData.get(
              "footballShuttle"
            )
          ),

        footballBroadJump:
          clean(
            formData.get(
              "footballBroadJump"
            )
          ),

        footballStrengthMarker:
          clean(
            formData.get(
              "footballStrengthMarker"
            )
          ),

        footballVerifiedEventSource:
          clean(
            formData.get(
              "footballVerifiedEventSource"
            )
          ),

        footballNotes:
          clean(
            formData.get(
              "footballNotes"
            )
          )
      };
    }

    if (
      sport ===
      "basketball"
    ) {
      return {
        ...universal,

        basketballWingspan:
          clean(
            formData.get(
              "basketballWingspan"
            )
          ),

        basketballVerticalJump:
          clean(
            formData.get(
              "basketballVerticalJump"
            )
          ),

        basketballLaneAgility:
          clean(
            formData.get(
              "basketballLaneAgility"
            )
          ),

        basketballCourtSprint:
          clean(
            formData.get(
              "basketballCourtSprint"
            )
          ),

        basketballSkillMarker:
          clean(
            formData.get(
              "basketballSkillMarker"
            )
          ),

        basketballVerifiedEventSource:
          clean(
            formData.get(
              "basketballVerifiedEventSource"
            )
          ),

        basketballNotes:
          clean(
            formData.get(
              "basketballNotes"
            )
          )
      };
    }

    if (
      sport ===
      "baseball"
    ) {
      return {
        ...universal,

        baseballDash60:
          clean(
            formData.get(
              "baseballDash60"
            )
          ),

        baseballExitVelocity:
          clean(
            formData.get(
              "baseballExitVelocity"
            )
          ),

        baseballThrowingVelocity:
          clean(
            formData.get(
              "baseballThrowingVelocity"
            )
          ),

        baseballPopTime:
          clean(
            formData.get(
              "baseballPopTime"
            )
          ),

        baseballBatThrowSide:
          clean(
            formData.get(
              "baseballBatThrowSide"
            )
          ),

        baseballVerifiedEventSource:
          clean(
            formData.get(
              "baseballVerifiedEventSource"
            )
          ),

        baseballNotes:
          clean(
            formData.get(
              "baseballNotes"
            )
          )
      };
    }

    if (
      sport ===
      "track"
    ) {
      return {
        ...universal,

        trackPrimaryEvent:
          clean(
            formData.get(
              "trackPrimaryEvent"
            )
          ),

        trackBestMark:
          clean(
            formData.get(
              "trackBestMark"
            )
          ),

        trackTimingType:
          clean(
            formData.get(
              "trackTimingType"
            )
          ),

        trackMeetSource:
          clean(
            formData.get(
              "trackMeetSource"
            )
          ),

        trackSplitData:
          clean(
            formData.get(
              "trackSplitData"
            )
          ),

        trackVerifiedEventSource:
          clean(
            formData.get(
              "trackVerifiedEventSource"
            )
          ),

        trackNotes:
          clean(
            formData.get(
              "trackNotes"
            )
          )
      };
    }

    return universal;
  }

  /* ======================================================
     ATHLETE SCHEMA FILTER
  ====================================================== */

  function filterAthleteSchema(
    row
  ) {
    const allowed =
      new Set([
        "athlete_id",
        "first_name",
        "last_name",
        "athlete_display_name",
        "graduation_class",
        "city_state",
        "school_program",
        "primary_sport",
        "created_at",
        "updated_at"
      ]);

    const filtered =
      {};

    Object.entries(
      row ||
      {}
    ).forEach(
      (
        [
          key,
          value
        ]
      ) => {
        if (
          allowed.has(key)
        ) {
          filtered[key] =
            value;
        }
      }
    );

    return filtered;
  }

  /* ======================================================
     SNAPSHOT SCHEMA FILTER
  ====================================================== */

  function filterSnapshotSchema(
    row
  ) {
    const allowed =
      new Set([
        "snapshot_id",
        "athlete_id",

        "snapshot_status",
        "source_record_status",
        "verification_status",
        "score_status",

        "first_name",
        "last_name",
        "athlete_display_name",

        "graduation_class",
        "city_state",
        "school_program",
        "primary_sport",

        "height",
        "weight",
        "primary_position",
        "secondary_position",
        "dominant_hand_foot",
        "jersey_number",

        "current_gpa",
        "ncaa_eligibility_status",
        "transcript_available",
        "counselor_contact_available",
        "academic_notes",

        "highlight_url",
        "game_film_url",
        "social_profile_url",
        "recruiting_profile_url",

        "guardian_name",
        "guardian_email",
        "guardian_phone",

        "coach_name",
        "coach_email",

        "verification_permission",

        "source_origin",
        "submitted_by_role",
        "submitted_by_name",
        "submitted_by_email",
        "submitted_by_user_id",
        "submitted_by_professional_id",

        "phnx_certified_id",
        "phnx_certification_status",
        "trust_classification",

        "source_organization",
        "submission_source",
        "submission_timestamp",

        "sport_metric_payload",
        "source_claims_payload",
        "raw_payload",

        "headshot_url",
        "headshot_public_url",
        "headshot_path",
        "headshot_filename",
        "headshot_bucket",
        "headshot_uploaded_at",
        "headshot_uploaded_by",
        "headshot_receipt",

        "media_status",

        "phnx_media_handoff_status",
        "phnx_media_handoff_id",
        "phnx_media_handoff_at",
        "phnx_media_handoff_receipt",

        "submitted_at",
        "created_at",
        "updated_at",
        "last_source_update_at"
      ]);

    const filtered =
      {};

    Object.entries(
      row ||
      {}
    ).forEach(
      (
        [
          key,
          value
        ]
      ) => {
        if (
          allowed.has(key)
        ) {
          filtered[key] =
            value;
        }
      }
    );

    return filtered;
  }

  /* ======================================================
     ATHLETE IDENTITY PERSISTENCE

     CRITICAL:
     NO snapshot receipt is written here.

     The snapshot FK target may not yet exist.
  ====================================================== */

  async function ensureAthleteExists(
    snapshotRow
  ) {
    const db =
      getDb();

    if (
      !snapshotRow
        ?.athlete_id
    ) {
      throw new Error(
        "athlete_id is required before athlete identity persistence."
      );
    }

    const athletePayload =
      filterAthleteSchema({
        athlete_id:
          snapshotRow
            .athlete_id,

        first_name:
          snapshotRow
            .first_name,

        last_name:
          snapshotRow
            .last_name,

        athlete_display_name:
          snapshotRow
            .athlete_display_name,

        graduation_class:
          snapshotRow
            .graduation_class,

        city_state:
          snapshotRow
            .city_state,

        school_program:
          snapshotRow
            .school_program,

        primary_sport:
          snapshotRow
            .primary_sport,

        updated_at:
          nowISO()
      });

    const existingResult =
      await db
        .from(
          ATHLETE_TABLE
        )
        .select("*")
        .eq(
          "athlete_id",
          snapshotRow
            .athlete_id
        )
        .maybeSingle();

    if (
      existingResult.error
    ) {
      throw existingResult
        .error;
    }

    if (
      existingResult.data
    ) {
      const beforeRecord =
        existingResult.data;

      const updatePayload = {
        ...athletePayload,

        athlete_id:
          beforeRecord
            .athlete_id,

        updated_at:
          nowISO()
      };

      const updatedResult =
        await db
          .from(
            ATHLETE_TABLE
          )
          .update(
            updatePayload
          )
          .eq(
            "athlete_id",
            beforeRecord
              .athlete_id
          )
          .select("*")
          .single();

      if (
        updatedResult.error
      ) {
        throw updatedResult
          .error;
      }

      return {
        action:
          "updated",

        receipt_action:
          "ATHLETE_IDENTITY_UPDATED",

        athlete:
          updatedResult.data,

        before_record:
          beforeRecord,

        after_record:
          updatedResult.data
      };
    }

    const createPayload = {
      ...athletePayload,

      created_at:
        nowISO(),

      updated_at:
        nowISO()
    };

    const createdResult =
      await db
        .from(
          ATHLETE_TABLE
        )
        .insert(
          createPayload
        )
        .select("*")
        .single();

    if (
      createdResult.error
    ) {
      throw createdResult
        .error;
    }

    return {
      action:
        "created",

      receipt_action:
        "ATHLETE_IDENTITY_CREATED",

      athlete:
        createdResult.data,

      before_record:
        null,

      after_record:
        createdResult.data
    };
  }

  /* ======================================================
     SNAPSHOT INSERT / UPDATE

     CRITICAL:
     Establish governed snapshot first.
     Receipt occurs only after physical read-back.
  ====================================================== */

  async function insertOrUpdateSnapshot(
    snapshotRow
  ) {
    const db =
      getDb();

    const cleanRow =
      filterSnapshotSchema(
        snapshotRow ||
        {}
      );

    if (
      !cleanRow
        .snapshot_id
    ) {
      throw new Error(
        "snapshot_id is required before snapshot persistence."
      );
    }

    if (
      !cleanRow
        .athlete_id
    ) {
      throw new Error(
        "athlete_id is required before snapshot persistence."
      );
    }

    const existingResult =
      await db
        .from(
          SNAPSHOT_TABLE
        )
        .select("*")
        .eq(
          "snapshot_id",
          cleanRow
            .snapshot_id
        )
        .maybeSingle();

    if (
      existingResult.error
    ) {
      throw existingResult
        .error;
    }

    if (
      existingResult.data
    ) {
      const beforeRecord =
        existingResult.data;

      const updatePayload = {
        ...cleanRow,

        snapshot_id:
          beforeRecord
            .snapshot_id,

        athlete_id:
          beforeRecord
            .athlete_id ||
          cleanRow
            .athlete_id,

        created_at:
          beforeRecord
            .created_at ||
          cleanRow
            .created_at ||
          nowISO(),

        updated_at:
          nowISO(),

        last_source_update_at:
          nowISO()
      };

      const updatedResult =
        await db
          .from(
            SNAPSHOT_TABLE
          )
          .update(
            updatePayload
          )
          .eq(
            "snapshot_id",
            beforeRecord
              .snapshot_id
          )
          .select("*")
          .single();

      if (
        updatedResult.error
      ) {
        throw updatedResult
          .error;
      }

      return {
        action:
          "updated",

        receipt_action:
          "SNAPSHOT_SOURCE_UPDATED",

        snapshot:
          updatedResult.data,

        before_record:
          beforeRecord,

        after_record:
          updatedResult.data
      };
    }

    const createPayload = {
      ...cleanRow,

      created_at:
        cleanRow
          .created_at ||
        nowISO(),

      updated_at:
        nowISO(),

      last_source_update_at:
        nowISO()
    };

    const createdResult =
      await db
        .from(
          SNAPSHOT_TABLE
        )
        .insert(
          createPayload
        )
        .select("*")
        .single();

    if (
      createdResult.error
    ) {
      throw createdResult
        .error;
    }

    return {
      action:
        "created",

      receipt_action:
        "SNAPSHOT_SOURCE_CREATED",

      snapshot:
        createdResult.data,

      before_record:
        null,

      after_record:
        createdResult.data
    };
  }

   /* ======================================================
     SNAPSHOT READ-BACK
  ====================================================== */

  async function readBackSnapshot(
    snapshotId
  ) {
    const id =
      clean(
        snapshotId
      );

    if (!id) {
      throw new Error(
        "Snapshot read-back requires snapshot_id."
      );
    }

    const db =
      getDb();

    const result =
      await db
        .from(SNAPSHOT_TABLE)
        .select("*")
        .eq(
          "snapshot_id",
          id
        )
        .maybeSingle();

    if (result.error) {
      throw new Error(
        `Snapshot read-back failed for ${id}: ${
          result.error.message ||
          String(result.error)
        }`
      );
    }

    if (!result.data) {
      throw new Error(
        `Snapshot read-back returned no record for snapshot_id ${id}.`
      );
    }

    if (
      clean(
        result.data.snapshot_id
      ) !== id
    ) {
      throw new Error(
        `Snapshot read-back identity mismatch. Expected ${id}, received ${
          result.data.snapshot_id ||
          "NULL"
        }.`
      );
    }

    return result.data;
  }


  /* ======================================================
     SNAPSHOT / ATHLETE RELATIONSHIP VERIFICATION
  ====================================================== */

  function verifySnapshotIdentity({
    snapshot,
    expectedSnapshotId,
    expectedAthleteId
  }) {
    if (!snapshot) {
      throw new Error(
        "Snapshot identity verification requires a snapshot record."
      );
    }

    const actualSnapshotId =
      clean(
        snapshot.snapshot_id
      );

    const actualAthleteId =
      clean(
        snapshot.athlete_id
      );

    const expectedSnapshot =
      clean(
        expectedSnapshotId
      );

    const expectedAthlete =
      clean(
        expectedAthleteId
      );

    if (
      expectedSnapshot &&
      actualSnapshotId !== expectedSnapshot
    ) {
      throw new Error(
        `Snapshot identity verification failed. Expected snapshot_id ${expectedSnapshot}, received ${
          actualSnapshotId ||
          "NULL"
        }.`
      );
    }

    if (
      expectedAthlete &&
      actualAthleteId !== expectedAthlete
    ) {
      throw new Error(
        `Athlete identity verification failed. Expected athlete_id ${expectedAthlete}, received ${
          actualAthleteId ||
          "NULL"
        }.`
      );
    }

    if (
      !actualSnapshotId ||
      !actualAthleteId
    ) {
      throw new Error(
        "Snapshot read-back is incomplete. Both snapshot_id and athlete_id are required."
      );
    }

    return {
      ok:
        true,

      snapshot_id:
        actualSnapshotId,

      athlete_id:
        actualAthleteId,

      verified_at:
        nowISO()
    };
  }


  /* ======================================================
     ACTIVE RUNTIME CONTEXT
  ====================================================== */

  function setActiveSnapshotId(
    snapshotId
  ) {
    const id =
      clean(
        snapshotId
      );

    if (!id) {
      return;
    }

    localStorage.setItem(
      ACTIVE_SNAPSHOT_KEY,
      id
    );

    sessionStorage.setItem(
      ACTIVE_SNAPSHOT_KEY,
      id
    );

    localStorage.setItem(
      LEGACY_SNAPSHOT_KEY,
      id
    );

    sessionStorage.setItem(
      LEGACY_SNAPSHOT_KEY,
      id
    );

    localStorage.setItem(
      SECONDARY_SNAPSHOT_KEY,
      id
    );

    sessionStorage.setItem(
      SECONDARY_SNAPSHOT_KEY,
      id
    );
  }


  function setActiveAthleteId(
    athleteId
  ) {
    const id =
      clean(
        athleteId
      );

    if (!id) {
      return;
    }

    localStorage.setItem(
      ACTIVE_ATHLETE_KEY,
      id
    );

    sessionStorage.setItem(
      ACTIVE_ATHLETE_KEY,
      id
    );

    localStorage.setItem(
      LEGACY_ATHLETE_KEY,
      id
    );

    sessionStorage.setItem(
      LEGACY_ATHLETE_KEY,
      id
    );

    localStorage.setItem(
      SECONDARY_ATHLETE_KEY,
      id
    );

    sessionStorage.setItem(
      SECONDARY_ATHLETE_KEY,
      id
    );
  }


  function getActiveSnapshotId() {
    return clean(
      sessionStorage.getItem(
        ACTIVE_SNAPSHOT_KEY
      ) ||
      localStorage.getItem(
        ACTIVE_SNAPSHOT_KEY
      ) ||
      sessionStorage.getItem(
        SECONDARY_SNAPSHOT_KEY
      ) ||
      localStorage.getItem(
        SECONDARY_SNAPSHOT_KEY
      ) ||
      sessionStorage.getItem(
        LEGACY_SNAPSHOT_KEY
      ) ||
      localStorage.getItem(
        LEGACY_SNAPSHOT_KEY
      )
    );
  }


  function getActiveAthleteId() {
    return clean(
      sessionStorage.getItem(
        ACTIVE_ATHLETE_KEY
      ) ||
      localStorage.getItem(
        ACTIVE_ATHLETE_KEY
      ) ||
      sessionStorage.getItem(
        SECONDARY_ATHLETE_KEY
      ) ||
      localStorage.getItem(
        SECONDARY_ATHLETE_KEY
      ) ||
      sessionStorage.getItem(
        LEGACY_ATHLETE_KEY
      ) ||
      localStorage.getItem(
        LEGACY_ATHLETE_KEY
      )
    );
  }


  function commitRuntimeContext({
    athleteId,
    snapshotId
  }) {
    const athlete =
      clean(
        athleteId
      );

    const snapshot =
      clean(
        snapshotId
      );

    if (
      !athlete ||
      !snapshot
    ) {
      throw new Error(
        "Runtime context cannot be committed without athlete_id and snapshot_id."
      );
    }

    setActiveAthleteId(
      athlete
    );

    setActiveSnapshotId(
      snapshot
    );

    setVal(
      "athleteId",
      athlete
    );

    setVal(
      "snapshotId",
      snapshot
    );

    return {
      athlete_id:
        athlete,

      snapshot_id:
        snapshot
    };
  }


  /* ======================================================
     DASHBOARD CONTINUATION ROUTE
  ====================================================== */

  function updateContinueRoute(
    snapshotId
  ) {
    const button =
      document.getElementById(
        "viewProfileBtn"
      );

    if (!button) {
      return;
    }

    const id =
      clean(
        snapshotId
      );

    if (!id) {
      button.removeAttribute(
        "href"
      );

      button.setAttribute(
        "aria-disabled",
        "true"
      );

      button.classList.add(
        "disabled"
      );

      return;
    }

    button.href =
      `athlete-dashboard.html?snapshot_id=${encodeURIComponent(
        id
      )}&from=athlete-record-intake`;

    button.removeAttribute(
      "aria-disabled"
    );

    button.classList.remove(
      "disabled"
    );
  } 
