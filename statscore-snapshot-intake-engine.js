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

 /* ======================================================
     SNAPSHOT EXISTENCE ASSERTION
  ====================================================== */

  async function assertSnapshotExists(
    snapshotId,
    athleteId = null
  ) {
    const snapshot =
      await readBackSnapshot(
        snapshotId
      );

    const expectedAthleteId =
      clean(
        athleteId
      );

    verifySnapshotIdentity({
      snapshot,

      expectedSnapshotId:
        snapshotId,

      expectedAthleteId:
        expectedAthleteId ||
        snapshot.athlete_id
    });

    return snapshot;
  }


  /* ======================================================
     RECEIPT AUTHORITY

     CANONICAL TABLE:
     public.statscore_snapshot_receipts

     PHYSICAL CONTRACT:
     - receipt_id
     - snapshot_id
     - athlete_id
     - event_type
     - event_status
     - event_message
     - payload
     - created_at

     CRITICAL:
     No receipt carrying snapshot_id may be written until
     that snapshot physically exists and has been read back.
  ====================================================== */

  async function writeSnapshotAuditReceipt({
    action,
    snapshot_id,
    athlete_id,
    before_record,
    after_record,
    event_status = "success",
    event_message = ""
  }) {
    const normalizedAction =
      clean(
        action
      ) ||
      "STREAM_2_EVENT";

    const snapshotId =
      clean(
        snapshot_id
      );

    const athleteId =
      clean(
        athlete_id
      );

    if (!snapshotId) {
      throw new Error(
        (
          "Stream 2 snapshot receipt blocked for " +
          normalizedAction +
          ": snapshot_id is required."
        )
      );
    }

    /*
    ------------------------------------------------------
    FOREIGN KEY PROTECTION

    Verify the governed snapshot before attempting receipt
    persistence.
    ------------------------------------------------------
    */

    const governedSnapshot =
      await assertSnapshotExists(
        snapshotId,
        athleteId ||
        null
      );

    const resolvedAthleteId =
      athleteId ||
      clean(
        governedSnapshot
          .athlete_id
      );

    if (!resolvedAthleteId) {
      throw new Error(
        (
          "Stream 2 snapshot receipt blocked for " +
          normalizedAction +
          ": athlete_id could not be resolved."
        )
      );
    }

    const payload = {
      snapshot_id:
        snapshotId,

      athlete_id:
        resolvedAthleteId,

      event_type:
        normalizedAction,

      event_status:
        clean(
          event_status
        ) ||
        "success",

      event_message:
        clean(
          event_message
        ) ||
        buildReceiptMessage(
          normalizedAction
        ),

      payload: {
        receipt_version:
          RECEIPT_VERSION,

        engine_id:
          ENGINE_ID,

        engine_version:
          ENGINE_VERSION,

        owner_stream:
          "STREAM_2",

        snapshot_id:
          snapshotId,

        athlete_id:
          resolvedAthleteId,

        event_type:
          normalizedAction,

        before_record:
          before_record ||
          null,

        after_record:
          after_record ||
          null,

        recorded_at:
          nowISO()
      },

      created_at:
        nowISO()
    };

    const db =
      getDb();

    const result =
      await db
        .from(
          AUDIT_TABLE
        )
        .insert(
          payload
        )
        .select("*")
        .single();

    if (result.error) {
      const error =
        new Error(
          (
            "Stream 2 receipt persistence failed for " +
            normalizedAction +
            ": " +
            (
              result.error
                .message ||
              String(
                result.error
              )
            )
          )
        );

      error.code =
        "STREAM_2_SNAPSHOT_RECEIPT_PERSISTENCE_FAILED";

      error.original_error =
        result.error;

      error.snapshot_id =
        snapshotId;

      error.athlete_id =
        resolvedAthleteId;

      throw error;
    }

    if (!result.data) {
      throw new Error(
        (
          "Stream 2 receipt read-back returned no row for " +
          normalizedAction +
          "."
        )
      );
    }

    return result.data;
  }


  function buildReceiptMessage(
    action
  ) {
    const messages = {
      ATHLETE_IDENTITY_CREATED:
        "Athlete identity created and linked to governed snapshot.",

      ATHLETE_IDENTITY_UPDATED:
        "Athlete identity updated and linked to governed snapshot.",

      SNAPSHOT_SOURCE_CREATED:
        "Governed athlete source snapshot created.",

      SNAPSHOT_SOURCE_UPDATED:
        "Governed athlete source snapshot updated.",

      HEADSHOT_UPLOAD_STARTED:
        "Canonical athlete headshot upload started.",

      HEADSHOT_UPLOAD_VERIFIED:
        "Canonical athlete headshot upload verified.",

      HEADSHOT_UPLOAD_FAILED:
        "Canonical athlete headshot upload failed.",

      PARENT_APPROVAL_REQUEST_CREATED:
        "Parent Approval request created.",

      PARENT_APPROVAL_REQUEST_REUSED:
        "Parent Approval request reused.",

      PHNX_MEDIA_HANDOFF_CREATED:
        "PHNX Sports Media handoff created.",

      PHNX_MEDIA_HANDOFF_UPDATED:
        "PHNX Sports Media handoff updated.",

      PHNX_MEDIA_HANDOFF_READY:
        "PHNX Sports Media handoff ready.",

      PHNX_MEDIA_HANDOFF_QUEUED:
        "PHNX Sports Media handoff queued.",

      PHNX_MEDIA_HANDOFF_QUEUE_FAILED:
        "PHNX Sports Media handoff queue attempt failed.",

      SNAPSHOT_TRANSACTION_COMPLETED:
        "Stream 2 governed athlete source transaction completed.",

      SNAPSHOT_DRAFT_SAVED:
        "Stream 2 governed athlete source draft saved.",

      VERIFICATION_REQUESTED:
        "Athlete source-record verification requested."
    };

    return (
      messages[action] ||
      action ||
      "Stream 2 governed event"
    );
  }


  /* ======================================================
     POST-SNAPSHOT LIFECYCLE RECEIPTS
  ====================================================== */

  async function persistLifecycleReceiptsAfterSnapshot({
    athleteResult,
    snapshotResult,
    verifiedSnapshot
  }) {
    if (
      !verifiedSnapshot
        ?.snapshot_id ||
      !verifiedSnapshot
        ?.athlete_id
    ) {
      throw new Error(
        "Lifecycle receipt persistence requires verified athlete_id and snapshot_id."
      );
    }

    const athleteReceipt =
      await writeSnapshotAuditReceipt({
        action:
          athleteResult
            ?.receipt_action ||
          "ATHLETE_IDENTITY_CONFIRMED",

        snapshot_id:
          verifiedSnapshot
            .snapshot_id,

        athlete_id:
          verifiedSnapshot
            .athlete_id,

        before_record:
          athleteResult
            ?.before_record ||
          null,

        after_record:
          athleteResult
            ?.after_record ||
          athleteResult
            ?.athlete ||
          null,

        event_status:
          "success",

        event_message:
          athleteResult
            ?.action ===
          "created"
            ? "Athlete identity created and linked to the governed source snapshot."
            : "Athlete identity confirmed and linked to the governed source snapshot."
      });

    const snapshotReceipt =
      await writeSnapshotAuditReceipt({
        action:
          snapshotResult
            ?.receipt_action ||
          "SNAPSHOT_SOURCE_CONFIRMED",

        snapshot_id:
          verifiedSnapshot
            .snapshot_id,

        athlete_id:
          verifiedSnapshot
            .athlete_id,

        before_record:
          snapshotResult
            ?.before_record ||
          null,

        after_record:
          snapshotResult
            ?.after_record ||
          verifiedSnapshot,

        event_status:
          "success",

        event_message:
          snapshotResult
            ?.action ===
          "created"
            ? "Governed athlete source snapshot created and verified."
            : "Governed athlete source snapshot updated and verified."
      });

    return {
      athlete_receipt:
        athleteReceipt,

      snapshot_receipt:
        snapshotReceipt
    };
  }


  /* ======================================================
     NATIVE HEADSHOT UPLOAD
  ====================================================== */

  async function uploadAndVerifyHeadshot({
    snapshot,
    required
  }) {
    const verifiedBaseSnapshot =
      await assertSnapshotExists(
        snapshot
          ?.snapshot_id,
        snapshot
          ?.athlete_id
      );

    const existingVerification =
      verifyCanonicalHeadshotContract(
        verifiedBaseSnapshot,
        {
          throwOnFailure:
            false
        }
      );

    /*
    ------------------------------------------------------
    EXISTING CANONICAL HEADSHOT

    If no new file was selected, reuse the saved canonical
    image if it passes verification.
    ------------------------------------------------------
    */

    if (!selectedHeadshotFile) {
      if (
        existingVerification.ok
      ) {
        renderPersistedHeadshot(
          verifiedBaseSnapshot
        );

        setHeadshotUiState(
          HEADSHOT_UI_STATE.VERIFIED,
          verifiedBaseSnapshot
            .headshot_filename ||
          "Saved athlete headshot"
        );

        setPhnxUiState(
          MEDIA_STATUS
            .HEADSHOT_VERIFIED,
          "Saved athlete headshot verified"
        );

        return {
          ok:
            true,

          reused:
            true,

          uploaded:
            false,

          verified_snapshot:
            verifiedBaseSnapshot,

          verification:
            existingVerification
        };
      }

      if (required) {
        const error =
          new Error(
            "A verified athlete headshot is required before final submission."
          );

        error.code =
          "INTAKE_INCOMPLETE_HEADSHOT_REQUIRED";

        setHeadshotUiState(
          HEADSHOT_UI_STATE.FAILED,
          error.message
        );

        setPhnxUiState(
          MEDIA_STATUS.NOT_READY,
          "Headshot required"
        );

        throw error;
      }

      return {
        ok:
          true,

        reused:
          false,

        uploaded:
          false,

        verified_snapshot:
          verifiedBaseSnapshot,

        verification: {
          ok:
            false,

          reason:
            "HEADSHOT_NOT_REQUIRED_FOR_DRAFT"
        }
      };
    }

    const validation =
      validateHeadshotFile(
        selectedHeadshotFile
      );

    const athleteId =
      clean(
        verifiedBaseSnapshot
          .athlete_id
      );

    const snapshotId =
      clean(
        verifiedBaseSnapshot
          .snapshot_id
      );

    if (
      !athleteId ||
      !snapshotId
    ) {
      throw new Error(
        "Headshot upload requires verified athlete_id and snapshot_id."
      );
    }

    const storagePath =
      buildCanonicalHeadshotPath({
        athleteId,

        snapshotId,

        extension:
          validation
            .extension
      });

    await writeSnapshotAuditReceipt({
      action:
        "HEADSHOT_UPLOAD_STARTED",

      snapshot_id:
        snapshotId,

      athlete_id:
        athleteId,

      before_record: {
        headshot_path:
          verifiedBaseSnapshot
            .headshot_path ||
          null,

        headshot_public_url:
          verifiedBaseSnapshot
            .headshot_public_url ||
          verifiedBaseSnapshot
            .headshot_url ||
          null
      },

      after_record: {
        bucket:
          HEADSHOT_BUCKET,

        path:
          storagePath,

        filename:
          selectedHeadshotFile
            .name,

        mime_type:
          validation
            .mime_type,

        size_bytes:
          validation
            .size_bytes,

        started_at:
          nowISO()
      },

      event_status:
        "started",

      event_message:
        "Canonical athlete headshot upload started."
    });

    setHeadshotUiState(
      HEADSHOT_UI_STATE.UPLOADING,
      "Secure athlete-image upload in progress"
    );

    setPhnxUiState(
      MEDIA_STATUS
        .HEADSHOT_UPLOADING,
      "Uploading athlete headshot"
    );

    try {
      const uploadResult =
        await uploadHeadshotWithRetry({
          file:
            selectedHeadshotFile,

          storagePath,

          contentType:
            validation
              .mime_type
        });

      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFYING,
        "Confirming uploaded image"
      );

      const storageVerification =
        await verifyStorageObject({
          storagePath
        });

      if (
        !storageVerification.ok
      ) {
        throw new Error(
          "Headshot object could not be verified in Supabase Storage."
        );
      }

      const publicUrl =
        getPublicHeadshotUrl(
          storagePath
        );

      if (!publicUrl) {
        throw new Error(
          "Supabase did not return the canonical athlete headshot URL."
        );
      }

      const dimensions =
        await readImageDimensions(
          selectedHeadshotFile
        );

      const uploadedAt =
        nowISO();

      const uploadedBy =
        clean(
          verifiedBaseSnapshot
            .submitted_by_name
        ) ||
        clean(
          verifiedBaseSnapshot
            .submitted_by_email
        ) ||
        clean(
          verifiedBaseSnapshot
            .submitted_by_role
        ) ||
        "STREAM_2";

      const headshotReceipt = {
        receipt_type:
          "HEADSHOT_UPLOAD_VERIFIED",

        receipt_version:
          "1.0",

        bucket:
          HEADSHOT_BUCKET,

        path:
          storagePath,

        public_url:
          publicUrl,

        original_filename:
          selectedHeadshotFile
            .name,

        sanitized_filename:
          sanitizeFilename(
            selectedHeadshotFile
              .name
          ),

        mime_type:
          validation
            .mime_type,

        extension:
          validation
            .extension,

        size_bytes:
          validation
            .size_bytes,

        width:
          dimensions
            .width,

        height:
          dimensions
            .height,

        upload_attempt_count:
          uploadResult
            .attempt_count,

        storage_verification:
          storageVerification,

        uploaded_at:
          uploadedAt,

        verified_at:
          nowISO(),

        verified:
          true
      };

      setHeadshotUiState(
        HEADSHOT_UI_STATE.PERSISTING,
        "Saving verified athlete headshot"
      );

      await persistHeadshotMetadata({
        snapshotId,

        publicUrl,

        storagePath,

        filename:
          selectedHeadshotFile
            .name,

        bucket:
          HEADSHOT_BUCKET,

        uploadedAt,

        uploadedBy,

        receipt:
          headshotReceipt
      });

      const verifiedSnapshot =
        await readBackSnapshot(
          snapshotId
        );

      verifySnapshotIdentity({
        snapshot:
          verifiedSnapshot,

        expectedSnapshotId:
          snapshotId,

        expectedAthleteId:
          athleteId
      });

      const databaseVerification =
        verifyCanonicalHeadshotContract(
          verifiedSnapshot,
          {
            expected: {
              public_url:
                publicUrl,

              bucket:
                HEADSHOT_BUCKET,

              path:
                storagePath,

              filename:
                selectedHeadshotFile
                  .name
            },

            throwOnFailure:
              true
          }
        );

      setVal(
        "headshotUrl",
        verifiedSnapshot
          .headshot_public_url ||
        verifiedSnapshot
          .headshot_url
      );

      setVal(
        "headshotPath",
        verifiedSnapshot
          .headshot_path
      );

      setVal(
        "headshotFileName",
        verifiedSnapshot
          .headshot_filename
      );

      renderPersistedHeadshot(
        verifiedSnapshot
      );

      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFIED,
        verifiedSnapshot
          .headshot_filename
      );

      setPhnxUiState(
        MEDIA_STATUS
          .HEADSHOT_VERIFIED,
        "Athlete headshot verified"
      );

      await writeSnapshotAuditReceipt({
        action:
          "HEADSHOT_UPLOAD_VERIFIED",

        snapshot_id:
          snapshotId,

        athlete_id:
          athleteId,

        before_record:
          verifiedBaseSnapshot,

        after_record: {
          headshot_url:
            verifiedSnapshot
              .headshot_url,

          headshot_public_url:
            verifiedSnapshot
              .headshot_public_url,

          headshot_path:
            verifiedSnapshot
              .headshot_path,

          headshot_filename:
            verifiedSnapshot
              .headshot_filename,

          headshot_bucket:
            verifiedSnapshot
              .headshot_bucket,

          headshot_uploaded_at:
            verifiedSnapshot
              .headshot_uploaded_at,

          headshot_uploaded_by:
            verifiedSnapshot
              .headshot_uploaded_by,

          headshot_receipt:
            verifiedSnapshot
              .headshot_receipt,

          media_status:
            verifiedSnapshot
              .media_status
        },

        event_status:
          "success",

        event_message:
          "Canonical athlete headshot uploaded, persisted, read back, and verified."
      });

      return {
        ok:
          true,

        reused:
          false,

        uploaded:
          true,

        upload_result:
          uploadResult,

        verified_snapshot:
          verifiedSnapshot,

        verification:
          databaseVerification
      };
    } catch (error) {
      /*
      ----------------------------------------------------
      DO NOT DESTROY LOCAL HEADSHOT STATE.

      Upload failure must remain recoverable.
      ----------------------------------------------------
      */

      setHeadshotUiState(
        HEADSHOT_UI_STATE.FAILED,
        (
          error?.message ||
          "Headshot upload requires retry."
        )
      );

      setPhnxUiState(
        MEDIA_STATUS.NOT_READY,
        "Headshot upload retry required"
      );

      try {
        await writeSnapshotAuditReceipt({
          action:
            "HEADSHOT_UPLOAD_FAILED",

          snapshot_id:
            snapshotId,

          athlete_id:
            athleteId,

          before_record:
            verifiedBaseSnapshot,

          after_record: {
            error:
              serializeError(
                error
              ),

            failed_at:
              nowISO()
          },

          event_status:
            "failed",

          event_message:
            error?.message ||
            "Canonical athlete headshot upload failed."
        });
      } catch (
        receiptError
      ) {
        console.error(
          "[Stream 2] Headshot failure receipt could not be persisted:",
          receiptError
        );
      }

      error.code =
        error.code ||
        "INTAKE_INCOMPLETE_HEADSHOT_FAILED";

      throw error;
    }
  }


  /* ======================================================
     STORAGE UPLOAD RETRY
  ====================================================== */

  async function uploadHeadshotWithRetry({
    file,
    storagePath,
    contentType
  }) {
    const db =
      getDb();

    let lastError =
      null;

    for (
      let attempt = 1;
      attempt <=
      HEADSHOT_UPLOAD_ATTEMPTS;
      attempt += 1
    ) {
      const result =
        await db.storage
          .from(
            HEADSHOT_BUCKET
          )
          .upload(
            storagePath,
            file,
            {
              upsert:
                true,

              contentType,

              cacheControl:
                "3600"
            }
          );

      if (!result.error) {
        return {
          ok:
            true,

          data:
            result.data,

          attempt_count:
            attempt
        };
      }

      lastError =
        result.error;

      if (
        attempt >=
          HEADSHOT_UPLOAD_ATTEMPTS ||
        !isTransientStorageError(
          lastError
        )
      ) {
        break;
      }

      await sleep(
        HEADSHOT_RETRY_DELAYS[
          attempt - 1
        ] ||
        3000
      );
    }

    const error =
      new Error(
        lastError
          ?.message ||
        "Headshot upload failed."
      );

    error.original_error =
      lastError;

    throw error;
  }


  function isTransientStorageError(
    error
  ) {
    const status =
      Number(
        error?.status ||
        error?.statusCode ||
        0
      );

    const message =
      String(
        error?.message ||
        ""
      ).toLowerCase();

    if (
      status === 408 ||
      status === 409 ||
      status === 425 ||
      status === 429 ||
      status >= 500
    ) {
      return true;
    }

    return [
      "timeout",
      "timed out",
      "network",
      "temporarily",
      "connection",
      "fetch failed",
      "service unavailable",
      "gateway"
    ].some(
      fragment =>
        message.includes(
          fragment
        )
    );
  }


  /* ======================================================
     STORAGE OBJECT VERIFICATION
  ====================================================== */

  async function verifyStorageObject({
    storagePath
  }) {
    const db =
      getDb();

    const pathParts =
      storagePath
        .split("/");

    const filename =
      pathParts.pop();

    const folder =
      pathParts.join("/");

    const result =
      await db.storage
        .from(
          HEADSHOT_BUCKET
        )
        .list(
          folder,
          {
            limit:
              100,

            search:
              filename
          }
        );

    if (result.error) {
      throw result.error;
    }

    const match =
      Array.isArray(
        result.data
      )
        ? result.data.find(
            item =>
              item?.name ===
              filename
          )
        : null;

    return {
      ok:
        Boolean(match),

      filename,

      folder,

      object:
        match ||
        null,

      verified_at:
        nowISO()
    };
  }


  function getPublicHeadshotUrl(
    storagePath
  ) {
    const db =
      getDb();

    const result =
      db.storage
        .from(
          HEADSHOT_BUCKET
        )
        .getPublicUrl(
          storagePath
        );

    return clean(
      result
        ?.data
        ?.publicUrl ||
      result
        ?.publicURL ||
      ""
    );
  }


  /* ======================================================
     HEADSHOT METADATA PERSISTENCE
  ====================================================== */

  async function persistHeadshotMetadata({
    snapshotId,
    publicUrl,
    storagePath,
    filename,
    bucket,
    uploadedAt,
    uploadedBy,
    receipt
  }) {
    const db =
      getDb();

    const updateResult =
      await db
        .from(
          SNAPSHOT_TABLE
        )
        .update({
          headshot_url:
            publicUrl,

          headshot_public_url:
            publicUrl,

          headshot_path:
            storagePath,

          headshot_filename:
            filename,

          headshot_bucket:
            bucket,

          headshot_uploaded_at:
            uploadedAt,

          headshot_uploaded_by:
            uploadedBy,

          headshot_receipt:
            receipt,

          media_status:
            MEDIA_STATUS
              .HEADSHOT_VERIFIED,

          phnx_media_handoff_status:
            MEDIA_STATUS
              .NOT_READY,

          updated_at:
            nowISO(),

          last_source_update_at:
            nowISO()
        })
        .eq(
          "snapshot_id",
          snapshotId
        )
        .select("*")
        .single();

    if (updateResult.error) {
      throw updateResult
        .error;
    }

    if (!updateResult.data) {
      throw new Error(
        "Headshot metadata persistence returned no snapshot record."
      );
    }

    return updateResult
      .data;
  }


  /* ======================================================
     PERSISTED HEADSHOT RENDER
  ====================================================== */

  function renderPersistedHeadshot(
    snapshot
  ) {
    const url =
      clean(
        snapshot
          ?.headshot_public_url ||
        snapshot
          ?.headshot_url
      );

    if (!url) {
      return false;
    }

    const preview =
      document.getElementById(
        "headshotPreview"
      );

    if (!preview) {
      return false;
    }

    preview.src =
      url;

    showHeadshotPreview(
      preview
    );

    return true;
  }


  /* ======================================================
     IMAGE DIMENSIONS
  ====================================================== */

  async function readImageDimensions(
    file
  ) {
    try {
      if (
        typeof createImageBitmap ===
        "function"
      ) {
        const bitmap =
          await createImageBitmap(
            file
          );

        const dimensions = {
          width:
            bitmap.width ||
            null,

          height:
            bitmap.height ||
            null
        };

        bitmap.close?.();

        return dimensions;
      }
    } catch (_error) {
      /*
      Some browsers cannot locally decode HEIC / HEIF.
      The upload path remains independent.
      */
    }

    return {
      width:
        null,

      height:
        null
    };
  }


  /* ======================================================
     CANONICAL HEADSHOT VERIFICATION
  ====================================================== */

  function verifyCanonicalHeadshotContract(
    snapshot,
    {
      expected = null,
      throwOnFailure = false
    } = {}
  ) {
    const failures =
      [];

    const publicUrl =
      clean(
        snapshot
          ?.headshot_public_url ||
        snapshot
          ?.headshot_url
      );

    const bucket =
      clean(
        snapshot
          ?.headshot_bucket
      );

    const path =
      clean(
        snapshot
          ?.headshot_path
      );

    const filename =
      clean(
        snapshot
          ?.headshot_filename
      );

    const receipt =
      safeObject(
        snapshot
          ?.headshot_receipt
      );

    if (!publicUrl) {
      failures.push(
        "headshot_public_url"
      );
    }

    if (!bucket) {
      failures.push(
        "headshot_bucket"
      );
    }

    if (!path) {
      failures.push(
        "headshot_path"
      );
    }

    if (!filename) {
      failures.push(
        "headshot_filename"
      );
    }

    if (
      !snapshot
        ?.headshot_uploaded_at
    ) {
      failures.push(
        "headshot_uploaded_at"
      );
    }

    if (
      !receipt ||
      Object.keys(receipt)
        .length ===
      0
    ) {
      failures.push(
        "headshot_receipt"
      );
    }

    if (
      receipt
        ?.verified !==
      true
    ) {
      failures.push(
        "headshot_receipt.verified"
      );
    }

    if (
      ![
        MEDIA_STATUS
          .HEADSHOT_VERIFIED,

        MEDIA_STATUS
          .HANDOFF_READY,

        MEDIA_STATUS
          .HANDOFF_QUEUED,

        MEDIA_STATUS
          .HANDOFF_QUEUE_FAILED
      ].includes(
        snapshot
          ?.media_status
      )
    ) {
      failures.push(
        "media_status"
      );
    }

    if (expected) {
      if (
        expected
          .public_url &&
        publicUrl !==
        expected
          .public_url
      ) {
        failures.push(
          "headshot_public_url_mismatch"
        );
      }

      if (
        expected
          .bucket &&
        bucket !==
        expected
          .bucket
      ) {
        failures.push(
          "headshot_bucket_mismatch"
        );
      }

      if (
        expected
          .path &&
        path !==
        expected
          .path
      ) {
        failures.push(
          "headshot_path_mismatch"
        );
      }

      if (
        expected
          .filename &&
        filename !==
        expected
          .filename
      ) {
        failures.push(
          "headshot_filename_mismatch"
        );
      }
    }

    const result = {
      ok:
        failures.length ===
        0,

      failures,

      public_url:
        publicUrl,

      bucket,

      path,

      filename,

      receipt,

      verified_at:
        nowISO()
    };

    if (
      !result.ok &&
      throwOnFailure
    ) {
      const error =
        new Error(
          (
            "Canonical headshot verification failed: " +
            failures.join(", ")
          )
        );

      error.code =
        "HEADSHOT_DATABASE_VERIFICATION_FAILED";

      error.verification =
        result;

      throw error;
    }

    return result;
  }


  /* ======================================================
     PARENT APPROVAL — IDEMPOTENT
  ====================================================== */

  async function ensureParentApprovalRequest(
    verifiedSnapshot
  ) {
    const guardianEmail =
      clean(
        verifiedSnapshot
          ?.guardian_email
      );

    if (!guardianEmail) {
      return {
        required:
          false,

        action:
          "not_required",

        approval:
          null,

        status:
          "not_requested"
      };
    }

    const db =
      getDb();

    const existingResult =
      await db
        .from(
          PARENT_APPROVAL_TABLE
        )
        .select("*")
        .eq(
          "snapshot_id",
          verifiedSnapshot
            .snapshot_id
        )
        .eq(
          "request_type",
          "parent_permission_scope"
        )
        .eq(
          "guardian_email",
          guardianEmail
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .limit(1)
        .maybeSingle();

    if (existingResult.error) {
      throw existingResult
        .error;
    }

    const basePayload = {
      snapshot_id:
        verifiedSnapshot
          .snapshot_id,

      athlete_id:
        verifiedSnapshot
          .athlete_id,

      athlete_name:
        verifiedSnapshot
          .athlete_display_name ||
        (
          (
            verifiedSnapshot
              .first_name ||
            ""
          ) +
          " " +
          (
            verifiedSnapshot
              .last_name ||
            ""
          )
        ).trim(),

      guardian_name:
        clean(
          verifiedSnapshot
            .guardian_name
        ) ||
        "Parent / Guardian",

      guardian_email:
        guardianEmail,

      requester_name:
        "STATS-CORE System",

      requester_role:
        "system",

      request_type:
        "parent_permission_scope",

      profile_participation:
        true,

      public_visibility:
        false,

      recruiter_access:
        false,

      messaging_access:
        false,

      media_exposure:
        false,

      counselor_access:
        false,

      status:
        existingResult
          .data
          ?.status ||
        "pending",

      requested_at:
        existingResult
          .data
          ?.requested_at ||
        nowISO(),

      updated_at:
        nowISO()
    };

    if (existingResult.data) {
      const updatedResult =
        await db
          .from(
            PARENT_APPROVAL_TABLE
          )
          .update(
            basePayload
          )
          .eq(
            "id",
            existingResult
              .data
              .id
          )
          .select("*")
          .single();

      if (updatedResult.error) {
        throw updatedResult
          .error;
      }

      await writeSnapshotAuditReceipt({
        action:
          "PARENT_APPROVAL_REQUEST_REUSED",

        snapshot_id:
          verifiedSnapshot
            .snapshot_id,

        athlete_id:
          verifiedSnapshot
            .athlete_id,

        before_record:
          existingResult.data,

        after_record:
          updatedResult.data,

        event_status:
          "success"
      });

      return {
        required:
          true,

        action:
          "reused",

        approval:
          updatedResult.data,

        status:
          normalizeApprovalStatus(
            updatedResult.data
          )
      };
    }

    const createdResult =
      await db
        .from(
          PARENT_APPROVAL_TABLE
        )
        .insert({
          ...basePayload,

          created_at:
            nowISO()
        })
        .select("*")
        .single();

    if (createdResult.error) {
      throw createdResult
        .error;
    }

    await writeSnapshotAuditReceipt({
      action:
        "PARENT_APPROVAL_REQUEST_CREATED",

      snapshot_id:
        verifiedSnapshot
          .snapshot_id,

      athlete_id:
        verifiedSnapshot
          .athlete_id,

      before_record:
        null,

      after_record:
        createdResult.data,

      event_status:
        "success"
    });

    return {
      required:
        true,

      action:
        "created",

      approval:
        createdResult.data,

      status:
        normalizeApprovalStatus(
          createdResult.data
        )
    };
  }


  function normalizeApprovalStatus(
    approval
  ) {
    return clean(
      approval
        ?.status ||
      approval
        ?.approval_status ||
      approval
        ?.request_status ||
      "pending"
    ).toLowerCase();
  }


  /* ======================================================
     PHNX HANDOFF IDENTITY
  ====================================================== */

  async function resolveHandoffIdentity(
    verifiedSnapshot
  ) {
    const db =
      getDb();

    const athleteId =
      verifiedSnapshot
        .athlete_id;

    const snapshotId =
      verifiedSnapshot
        .snapshot_id;

    const idempotencyKey =
      (
        "PHNX_MEDIA:" +
        athleteId +
        ":" +
        snapshotId +
        ":V1"
      );

    const existingResult =
      await db
        .from(
          PHNX_HANDOFF_TABLE
        )
        .select("*")
        .eq(
          "idempotency_key",
          idempotencyKey
        )
        .maybeSingle();

    if (existingResult.error) {
      throw existingResult
        .error;
    }

    if (existingResult.data) {
      const existingPayload =
        safeObject(
          existingResult
            .data
            .payload
        );

      return {
        existing:
          true,

        handoff_id:
          existingResult
            .data
            .handoff_id,

        correlation_id:
          existingResult
            .data
            .correlation_id ||
          existingPayload
            .correlation_id ||
          generateUuid(),

        idempotency_key:
          idempotencyKey,

        row:
          existingResult.data
      };
    }

    return {
      existing:
        false,

      handoff_id:
        generateUuid(),

      correlation_id:
        generateUuid(),

      idempotency_key:
        idempotencyKey,

      row:
        null
    };
  }


  /* ======================================================
     PHNX ASSET MANIFEST
  ====================================================== */

  function buildCanonicalAssetManifest({
    snapshot
  }) {
    const assets =
      [];

    const headshotVerification =
      verifyCanonicalHeadshotContract(
        snapshot,
        {
          throwOnFailure:
            false
        }
      );

    if (headshotVerification.ok) {
      const receipt =
        safeObject(
          snapshot
            .headshot_receipt
        );

      assets.push({
        asset_key:
          "HEADSHOT_PRIMARY",

        asset_type:
          "HEADSHOT",

        asset_role:
          "PRIMARY_ATHLETE_IMAGE",

        source_kind:
          "SUPABASE_STORAGE",

        source_url:
          snapshot
            .headshot_public_url ||
          snapshot
            .headshot_url,

        bucket:
          snapshot
            .headshot_bucket,

        storage_path:
          snapshot
            .headshot_path,

        original_filename:
          snapshot
            .headshot_filename,

        mime_type:
          receipt
            .mime_type ||
          "",

        extension:
          receipt
            .extension ||
          getFileExtension(
            snapshot
              .headshot_filename
          ),

        size_bytes:
          Number(
            receipt
              .size_bytes ||
            0
          ),

        verified:
          true
      });
    }

    [
      [
        "HIGHLIGHT_REEL_PRIMARY",
        "HIGHLIGHT_REEL",
        snapshot
          .highlight_url
      ],

      [
        "GAME_FILM_PRIMARY",
        "GAME_FILM",
        snapshot
          .game_film_url
      ],

      [
        "SOCIAL_PROFILE_PRIMARY",
        "SOCIAL_PROFILE",
        snapshot
          .social_profile_url
      ],

      [
        "RECRUITING_PROFILE_PRIMARY",
        "RECRUITING_PROFILE",
        snapshot
          .recruiting_profile_url
      ]
    ].forEach(
      (
        [
          key,
          type,
          sourceUrl
        ]
      ) => {
        const url =
          clean(
            sourceUrl
          );

        if (!url) {
          return;
        }

        assets.push({
          asset_key:
            key,

          asset_type:
            type,

          source_kind:
            "EXTERNAL_URL",

          source_url:
            url,

          verified:
            false
        });
      }
    );

    return assets;
  }


  /* ======================================================
     PARENT / PUBLICATION PERMISSION CONTRACT
  ====================================================== */

  function buildPermissionContract({
    snapshot,
    approval,
    approvalStatus
  }) {
    const guardianPresent =
      Boolean(
        clean(
          snapshot
            ?.guardian_email
        )
      );

    const approved =
      [
        "approved",
        "granted",
        "complete",
        "completed"
      ].includes(
        clean(
          approvalStatus
        ).toLowerCase()
      );

    return {
      guardian_context_present:
        guardianPresent,

      approval_request_present:
        Boolean(approval),

      approval_status:
        approvalStatus ||
        "not_requested",

      profile_participation:
        approval
          ?.profile_participation ??
        true,

      public_visibility:
        Boolean(
          approval
            ?.public_visibility
        ),

      recruiter_access:
        Boolean(
          approval
            ?.recruiter_access
        ),

      messaging_access:
        Boolean(
          approval
            ?.messaging_access
        ),

      media_exposure:
        Boolean(
          approval
            ?.media_exposure
        ),

      counselor_access:
        Boolean(
          approval
            ?.counselor_access
        ),

      parent_approval_satisfied:
        guardianPresent
          ? approved
          : true,

      public_release_blocked:
        guardianPresent
          ? (
              !approved ||
              !Boolean(
                approval
                  ?.public_visibility
              ) ||
              !Boolean(
                approval
                  ?.media_exposure
              )
            )
          : false
    };
  }


  function buildPlaylistHints(
    snapshot
  ) {
    return [
      clean(
        snapshot
          ?.primary_sport
      ),

      clean(
        snapshot
          ?.primary_position
      ),

      clean(
        snapshot
          ?.graduation_class
      )
        ? (
            "Class of " +
            clean(
              snapshot
                .graduation_class
            )
          )
        : ""
    ].filter(Boolean);
  }


  /* ======================================================
     PHNX SPORTS MEDIA HANDOFF PACKET
  ====================================================== */

  function buildCanonicalPhnxHandoff({
    verifiedSnapshot,
    parentApprovalResult,
    handoffIdentity
  }) {
    const snapshot =
      verifiedSnapshot;

    const sourceClaims =
      safeObject(
        snapshot
          .source_claims_payload
      );

    const sportMetrics =
      safeObject(
        snapshot
          .sport_metric_payload
      );

    const approval =
      parentApprovalResult
        ?.approval ||
      null;

    const approvalStatus =
      normalizeApprovalStatus(
        approval
      );

    const assets =
      buildCanonicalAssetManifest({
        snapshot
      });

    const hasHeadshot =
      assets.some(
        asset =>
          asset.asset_key ===
          "HEADSHOT_PRIMARY"
      );

    const permissions =
      buildPermissionContract({
        snapshot,

        approval,

        approvalStatus
      });

    const now =
      nowISO();

    return {
      contract_name:
        PHNX_CONTRACT_NAME,

      contract_version:
        PHNX_CONTRACT_VERSION,

      handoff_id:
        handoffIdentity
          .handoff_id,

      idempotency_key:
        handoffIdentity
          .idempotency_key,

      correlation_id:
        handoffIdentity
          .correlation_id,

      source_system:
        PHNX_SOURCE_SYSTEM,

      source_stream:
        PHNX_SOURCE_STREAM,

      target_system:
        PHNX_TARGET_SYSTEM,

      handoff_status:
        hasHeadshot
          ? MEDIA_STATUS
              .HANDOFF_READY
          : MEDIA_STATUS
              .NOT_READY,

      created_at:
        handoffIdentity
          .row
          ?.created_at ||
        now,

      updated_at:
        now,

      athlete: {
        athlete_id:
          snapshot
            .athlete_id,

        snapshot_id:
          snapshot
            .snapshot_id,

        first_name:
          snapshot
            .first_name ||
          "",

        last_name:
          snapshot
            .last_name ||
          "",

        display_name:
          snapshot
            .athlete_display_name ||
          (
            (
              snapshot
                .first_name ||
              ""
            ) +
            " " +
            (
              snapshot
                .last_name ||
              ""
            )
          ).trim(),

        graduation_class:
          snapshot
            .graduation_class ||
          "",

        city_state:
          snapshot
            .city_state ||
          "",

        school_program:
          snapshot
            .school_program ||
          "",

        primary_sport:
          snapshot
            .primary_sport ||
          "",

        primary_position:
          snapshot
            .primary_position ||
          "",

        secondary_position:
          snapshot
            .secondary_position ||
          "",

        jersey_number:
          snapshot
            .jersey_number ||
          "",

        height:
          snapshot
            .height ||
          "",

        weight:
          snapshot
            .weight ||
          "",

        dominant_hand_foot:
          snapshot
            .dominant_hand_foot ||
          ""
      },

      snapshot: {
        snapshot_status:
          snapshot
            .snapshot_status ||
          "",

        source_record_status:
          snapshot
            .source_record_status ||
          "",

        verification_status:
          snapshot
            .verification_status ||
          "UNVERIFIED",

        trust_classification:
          snapshot
            .trust_classification ||
          sourceClaims
            .trust_classification ||
          "SELF_REPORTED",

        submitted_at:
          snapshot
            .submitted_at ||
          null,

        last_source_update_at:
          snapshot
            .last_source_update_at ||
          snapshot
            .updated_at ||
          null,

        academic_context: {
          current_gpa:
            snapshot
              .current_gpa ||
            "",

          ncaa_eligibility_status:
            snapshot
              .ncaa_eligibility_status ||
            ""
        },

        sport_metric_payload:
          sportMetrics,

        source_claims_payload:
          sourceClaims
      },

      source_provenance: {
        source_origin:
          snapshot
            .source_origin ||
          sourceClaims
            .source_origin ||
          "",

        submission_source:
          snapshot
            .submission_source ||
          sourceClaims
            .submission_source ||
          "snapshot-intake.html",

        submitted_by_role:
          snapshot
            .submitted_by_role ||
          sourceClaims
            .submitted_by_role ||
          "",

        submitted_by_name:
          snapshot
            .submitted_by_name ||
          sourceClaims
            .submitted_by_name ||
          "",

        submitted_by_email:
          snapshot
            .submitted_by_email ||
          sourceClaims
            .submitted_by_email ||
          "",

        submitted_by_user_id:
          snapshot
            .submitted_by_user_id ||
          sourceClaims
            .submitted_by_user_id ||
          null,

        submitted_by_professional_id:
          snapshot
            .submitted_by_professional_id ||
          sourceClaims
            .submitted_by_professional_id ||
          null,

        phnx_certified_id:
          snapshot
            .phnx_certified_id ||
          sourceClaims
            .phnx_certified_id ||
          "",

        phnx_certification_status:
          snapshot
            .phnx_certification_status ||
          sourceClaims
            .phnx_certification_status ||
          "",

        trust_classification:
          snapshot
            .trust_classification ||
          sourceClaims
            .trust_classification ||
          "SELF_REPORTED",

        source_organization:
          snapshot
            .source_organization ||
          sourceClaims
            .source_organization ||
          "",

        captured_at:
          snapshot
            .submission_timestamp ||
          sourceClaims
            .captured_at ||
          snapshot
            .created_at ||
          now
      },

      permissions,

      assets,

      production_request: {
        production_profile:
          "PHNX_ATHLETE_STANDARD_V1",

        requested_outputs: [
          "PLAYER_CARD",
          "HEADSHOT_PACKAGE",
          "HIGHLIGHT_FILM_PACKAGE",
          "YOUTUBE_LONG_FORM",
          "YOUTUBE_SHORT"
        ],

        editing_required:
          true,

        branding_required:
          true,

        music_selection_required:
          true,

        athlete_music_selection_allowed:
          false,

        athlete_editing_control_allowed:
          false,

        brand_authority:
          "PHNX_SPORTS",

        editorial_authority:
          "PHNX_SPORTS_MEDIA",

        requested_at:
          now
      },

      publishing_request: {
        channel_key:
          "PHNX_SPORTS_YOUTUBE",

        platform:
          "YOUTUBE",

        publication_mode:
          "HOLD_UNTIL_APPROVED",

        visibility_requested:
          "PUBLIC",

        scheduling_mode:
          "PHNX_EDITORIAL_SCHEDULE",

        content_family:
          "ATHLETE_SPOTLIGHT",

        playlist_hints:
          buildPlaylistHints(
            snapshot
          ),

        title_seed: {
          athlete_name:
            snapshot
              .athlete_display_name ||
            (
              (
                snapshot
                  .first_name ||
                ""
              ) +
              " " +
              (
                snapshot
                  .last_name ||
                ""
              )
            ).trim(),

          position:
            snapshot
              .primary_position ||
            "",

          sport:
            snapshot
              .primary_sport ||
            "",

          graduation_class:
            snapshot
              .graduation_class ||
            "",

          school_program:
            snapshot
              .school_program ||
            ""
        },

        description_seed: {
          athlete_record_url:
            (
              "player-profile.html?snapshot_id=" +
              encodeURIComponent(
                snapshot
                  .snapshot_id
              )
            ),

          media_room_url:
            (
              "phnx-sports-media.html?snapshot_id=" +
              encodeURIComponent(
                snapshot
                  .snapshot_id
              )
            )
        },

        thumbnail_required:
          true,

        captions_required:
          true,

        child_directed_status:
          "REQUIRES_REVIEW",

        publish_gate_status:
          permissions
            .public_release_blocked
            ? "BLOCKED_PENDING_APPROVAL"
            : "ELIGIBLE_FOR_EDITORIAL_REVIEW"
      },

      notification_request: {
        notify_after_publish:
          true,

        notification_system:
          "STATS_CORE_MULTI_BOX",

        recipient_role:
          "athlete",

        athlete_id:
          snapshot
            .athlete_id,

        snapshot_id:
          snapshot
            .snapshot_id,

        message_type:
          "phnx_media_published",

        priority:
          "standard",

        subject_template:
          "Your PHNX Sports media package has been published",

        required_receipt_data: [
          "youtube_video_url",
          "youtube_video_id",
          "published_at",
          "publication_receipt_id"
        ]
      },

      execution_controls: {
        spider_execution_requested:
          true,

        allowed_destinations: [
          "PHNX_SPORTS_YOUTUBE"
        ],

        blocked_destinations:
          permissions
            .public_release_blocked
            ? [
                "PHNX_SPORTS_YOUTUBE_PUBLIC_RELEASE"
              ]
            : [],

        require_media_job_completion:
          true,

        require_editorial_approval:
          true,

        require_parent_media_approval:
          true,

        require_public_visibility_approval:
          true,

        allow_retry:
          true,

        maximum_attempts:
          5,

        deduplication_required:
          true,

        idempotency_key:
          handoffIdentity
            .idempotency_key,

        receipt_required:
          true,

        callback_required:
          true,

        callback_context: {
          athlete_id:
            snapshot
              .athlete_id,

          snapshot_id:
            snapshot
              .snapshot_id,

          handoff_id:
            handoffIdentity
              .handoff_id,

          correlation_id:
            handoffIdentity
              .correlation_id
        }
      },

      verification: {
        athlete_record_verified:
          Boolean(
            snapshot
              .athlete_id
          ),

        snapshot_record_verified:
          Boolean(
            snapshot
              .snapshot_id
          ),

        headshot_storage_verified:
          Boolean(
            snapshot
              .headshot_path &&
            snapshot
              .headshot_bucket
          ),

        headshot_database_verified:
          verifyCanonicalHeadshotContract(
            snapshot,
            {
              throwOnFailure:
                false
            }
          ).ok,

        asset_manifest_valid:
          hasHeadshot,

        permission_context_present:
          true,

        handoff_ready:
          hasHeadshot,

        queue_eligible:
          hasHeadshot,

        verified_at:
          now
      }
    };
  }


  /* ======================================================
     PHNX HANDOFF PERSISTENCE
  ====================================================== */

  async function persistCanonicalPhnxHandoff({
    verifiedSnapshot,
    parentApprovalResult
  }) {
    const db =
      getDb();

    const handoffIdentity =
      await resolveHandoffIdentity(
        verifiedSnapshot
      );

    const packet =
      buildCanonicalPhnxHandoff({
        verifiedSnapshot,

        parentApprovalResult,

        handoffIdentity
      });

    const payload = {
      handoff_id:
        handoffIdentity
          .handoff_id,

      idempotency_key:
        handoffIdentity
          .idempotency_key,

      correlation_id:
        handoffIdentity
          .correlation_id,

      athlete_id:
        verifiedSnapshot
          .athlete_id,

      snapshot_id:
        verifiedSnapshot
          .snapshot_id,

      source_system:
        PHNX_SOURCE_SYSTEM,

      source_stream:
        PHNX_SOURCE_STREAM,

      target_system:
        PHNX_TARGET_SYSTEM,

      contract_name:
        PHNX_CONTRACT_NAME,

      contract_version:
        PHNX_CONTRACT_VERSION,

      status:
        packet
          .handoff_status,

      payload:
        packet,

      updated_at:
        nowISO()
    };

    let result =
      null;

    if (
      handoffIdentity
        .existing
    ) {
      result =
        await db
          .from(
            PHNX_HANDOFF_TABLE
          )
          .update(
            payload
          )
          .eq(
            "idempotency_key",
            handoffIdentity
              .idempotency_key
          )
          .select("*")
          .single();
    } else {
      result =
        await db
          .from(
            PHNX_HANDOFF_TABLE
          )
          .insert({
            ...payload,

            created_at:
              nowISO()
          })
          .select("*")
          .single();
    }

    if (result.error) {
      throw result.error;
    }

    const readBack =
      await db
        .from(
          PHNX_HANDOFF_TABLE
        )
        .select("*")
        .eq(
          "idempotency_key",
          handoffIdentity
            .idempotency_key
        )
        .single();

    if (readBack.error) {
      throw readBack.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        handoffIdentity
          .existing
          ? "PHNX_MEDIA_HANDOFF_UPDATED"
          : "PHNX_MEDIA_HANDOFF_CREATED",

      snapshot_id:
        verifiedSnapshot
          .snapshot_id,

      athlete_id:
        verifiedSnapshot
          .athlete_id,

      before_record:
        handoffIdentity
          .row ||
        null,

      after_record:
        readBack.data,

      event_status:
        "success"
    });

    return {
      packet,

      handoff:
        readBack.data,

      identity:
        handoffIdentity
    };
  }


  /* ======================================================
     OPTIONAL PHNX MEDIA QUEUE
  ====================================================== */

  async function attemptPhnxMediaQueue({
    handoffResult
  }) {
    const packet =
      handoffResult
        ?.packet;

    if (
      !packet ||
      packet
        ?.verification
        ?.queue_eligible !==
      true
    ) {
      return {
        attempted:
          false,

        queued:
          false,

        status:
          MEDIA_STATUS
            .HANDOFF_READY,

        reason:
          "HANDOFF_NOT_QUEUE_ELIGIBLE"
      };
    }

    const bridge =
      window
        .STATScorePhnxMediaEngine ||
      window
        .STATSCORE_PHNX_MEDIA_ENGINE ||
      window
        .PHNXSportsMediaEngine ||
      null;

    const enqueue =
      bridge
        ?.enqueueHandoff ||
      bridge
        ?.queueHandoff ||
      bridge
        ?.submitHandoff ||
      null;

    if (
      typeof enqueue !==
      "function"
    ) {
      /*
      The persisted handoff is still valid.
      Queue execution is downstream.
      */

      return {
        attempted:
          false,

        queued:
          false,

        status:
          MEDIA_STATUS
            .HANDOFF_READY,

        reason:
          "PHNX_QUEUE_BRIDGE_NOT_AVAILABLE"
      };
    }

    try {
      const response =
        await enqueue.call(
          bridge,
          packet
        );

      const queued =
        response
          ?.queued ===
        true ||
        response
          ?.ok ===
        true ||
        response
          ?.status ===
        "queued" ||
        response
          ?.status ===
        "success";

      return {
        attempted:
          true,

        queued,

        status:
          queued
            ? MEDIA_STATUS
                .HANDOFF_QUEUED
            : MEDIA_STATUS
                .HANDOFF_QUEUE_FAILED,

        response:
          response ||
          null
      };
    } catch (error) {
      return {
        attempted:
          true,

        queued:
          false,

        status:
          MEDIA_STATUS
            .HANDOFF_QUEUE_FAILED,

        error:
          serializeError(
            error
          )
      };
    }
  }


  /* ======================================================
     PHNX HANDOFF STATE PERSISTENCE
  ====================================================== */

  async function persistPhnxHandoffState({
    snapshotId,
    handoffResult,
    queueResult
  }) {
    const db =
      getDb();

    const status =
      queueResult
        ?.status ||
      handoffResult
        ?.packet
        ?.handoff_status ||
      MEDIA_STATUS
        .NOT_READY;

    const receipt = {
      handoff_id:
        handoffResult
          ?.identity
          ?.handoff_id ||
        null,

      idempotency_key:
        handoffResult
          ?.identity
          ?.idempotency_key ||
        null,

      correlation_id:
        handoffResult
          ?.identity
          ?.correlation_id ||
        null,

      queue_status:
        status,

      queue_result:
        queueResult ||
        null,

      recorded_at:
        nowISO()
    };

    const result =
      await db
        .from(
          SNAPSHOT_TABLE
        )
        .update({
          phnx_media_handoff_status:
            status,

          phnx_media_handoff_id:
            handoffResult
              ?.identity
              ?.handoff_id ||
            null,

          phnx_media_handoff_at:
            nowISO(),

          phnx_media_handoff_receipt:
            receipt,

          media_status:
            status,

          updated_at:
            nowISO(),

          last_source_update_at:
            nowISO()
        })
        .eq(
          "snapshot_id",
          snapshotId
        )
        .select("*")
        .single();

    if (result.error) {
      throw result.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        queueResult
          ?.queued
          ? "PHNX_MEDIA_HANDOFF_QUEUED"
          : queueResult
              ?.attempted
            ? "PHNX_MEDIA_HANDOFF_QUEUE_FAILED"
            : "PHNX_MEDIA_HANDOFF_READY",

      snapshot_id:
        result
          .data
          .snapshot_id,

      athlete_id:
        result
          .data
          .athlete_id,

      before_record:
        null,

      after_record:
        receipt,

      event_status:
        queueResult
          ?.queued
          ? "success"
          : queueResult
              ?.attempted
            ? "warning"
            : "ready"
    });

    return result.data;
  }


  /* ======================================================
     MAIN GOVERNED SOURCE-RECORD TRANSACTION
  ====================================================== */

  async function runSnapshotTransaction({
    status,
    requireHeadshot,
    reason
  }) {
    /*
    ------------------------------------------------------
    DUPLICATE SUBMISSION LOCK

    A second click receives the same active Promise.
    ------------------------------------------------------
    */

    if (
      activeTransactionPromise
    ) {
      return activeTransactionPromise;
    }

    if (
      !bootCompleted ||
      !runtimePreflightComplete ||
      !runtimePreflightResult
        ?.ok
    ) {
      const error =
        new Error(
          "Snapshot Intake runtime is not ready for governed submission."
        );

      setSystemMessage(
        error.message,
        "error"
      );

      throw error;
    }

    activeTransactionPromise =
      (async () => {
        setTransactionButtonsDisabled(
          true
        );

        setSystemMessage(
          status === "draft"
            ? "SAVING GOVERNED ATHLETE RECORD..."
            : "SUBMITTING GOVERNED ATHLETE RECORD...",
          "warning"
        );

        try {
          /* ==============================================
             STAGE 1
             BUILD PROPOSED RECORD
          ============================================== */

          const proposedRow =
            await buildSnapshotRow(
              status
            );

          /*
          Final submission requires either:
          - newly selected file, OR
          - already-persisted headshot URL.
          */

          if (
            requireHeadshot &&
            !selectedHeadshotFile &&
            !clean(
              proposedRow
                .headshot_public_url ||
              proposedRow
                .headshot_url
            )
          ) {
            throw new Error(
              "Choose an athlete headshot before submitting the athlete record."
            );
          }

          /* ==============================================
             STAGE 2
             PERSIST ATHLETE IDENTITY
          ============================================== */

          const athleteResult =
            await ensureAthleteExists(
              proposedRow
            );

          if (
            !athleteResult
              ?.athlete
              ?.athlete_id
          ) {
            throw new Error(
              "Athlete identity persistence did not return athlete_id."
            );
          }

          /* ==============================================
             STAGE 3
             PERSIST GOVERNED SNAPSHOT
          ============================================== */

          const snapshotResult =
            await insertOrUpdateSnapshot({
              ...proposedRow,

              athlete_id:
                athleteResult
                  .athlete
                  .athlete_id
            });

          if (
            !snapshotResult
              ?.snapshot
              ?.snapshot_id
          ) {
            throw new Error(
              "Snapshot persistence did not return snapshot_id."
            );
          }

          /* ==============================================
             STAGE 4
             PHYSICAL SNAPSHOT READ-BACK
          ============================================== */

          let verifiedSnapshot =
            await readBackSnapshot(
              snapshotResult
                .snapshot
                .snapshot_id
            );

          verifySnapshotIdentity({
            snapshot:
              verifiedSnapshot,

            expectedSnapshotId:
              snapshotResult
                .snapshot
                .snapshot_id,

            expectedAthleteId:
              athleteResult
                .athlete
                .athlete_id
          });

          /* ==============================================
             STAGE 5
             LIFECYCLE RECEIPTS
          ============================================== */

          const lifecycleReceipts =
            await persistLifecycleReceiptsAfterSnapshot({
              athleteResult,

              snapshotResult,

              verifiedSnapshot
            });

          /* ==============================================
             STAGE 6
             HEADSHOT MANUFACTURING
          ============================================== */

          const headshotResult =
            await uploadAndVerifyHeadshot({
              snapshot:
                verifiedSnapshot,

              required:
                Boolean(
                  requireHeadshot
                )
            });

          verifiedSnapshot =
            headshotResult
              ?.verified_snapshot ||
            await readBackSnapshot(
              verifiedSnapshot
                .snapshot_id
            );

          verifySnapshotIdentity({
            snapshot:
              verifiedSnapshot,

            expectedSnapshotId:
              snapshotResult
                .snapshot
                .snapshot_id,

            expectedAthleteId:
              athleteResult
                .athlete
                .athlete_id
          });

          /* ==============================================
             STAGE 7
             PARENT APPROVAL AUTHORITY
          ============================================== */

          const parentApprovalResult =
            await ensureParentApprovalRequest(
              verifiedSnapshot
            );

          /* ==============================================
             STAGE 8
             PHNX SPORTS MEDIA HANDOFF
          ============================================== */

          let handoffResult =
            null;

          let queueResult =
            null;

          if (
            status !== "draft" &&
            verifyCanonicalHeadshotContract(
              verifiedSnapshot,
              {
                throwOnFailure:
                  false
              }
            ).ok
          ) {
            handoffResult =
              await persistCanonicalPhnxHandoff({
                verifiedSnapshot,

                parentApprovalResult
              });

            queueResult =
              await attemptPhnxMediaQueue({
                handoffResult
              });

            verifiedSnapshot =
              await persistPhnxHandoffState({
                snapshotId:
                  verifiedSnapshot
                    .snapshot_id,

                handoffResult,

                queueResult
              });
          }

          /* ==============================================
             STAGE 9
             FINAL SOURCE RECORD READ-BACK
          ============================================== */

          verifiedSnapshot =
            await readBackSnapshot(
              verifiedSnapshot
                .snapshot_id
            );

          verifySnapshotIdentity({
            snapshot:
              verifiedSnapshot,

            expectedSnapshotId:
              snapshotResult
                .snapshot
                .snapshot_id,

            expectedAthleteId:
              athleteResult
                .athlete
                .athlete_id
          });

          /* ==============================================
             STAGE 10
             COMPLETION RECEIPT
          ============================================== */

          const completionReceipt =
            await writeSnapshotAuditReceipt({
              action:
                status === "draft"
                  ? "SNAPSHOT_DRAFT_SAVED"
                  : "SNAPSHOT_TRANSACTION_COMPLETED",

              snapshot_id:
                verifiedSnapshot
                  .snapshot_id,

              athlete_id:
                verifiedSnapshot
                  .athlete_id,

              before_record:
                null,

              after_record: {
                snapshot_status:
                  verifiedSnapshot
                    .snapshot_status,

                source_record_status:
                  verifiedSnapshot
                    .source_record_status,

                verification_status:
                  verifiedSnapshot
                    .verification_status,

                media_status:
                  verifiedSnapshot
                    .media_status,

                phnx_media_handoff_status:
                  verifiedSnapshot
                    .phnx_media_handoff_status,

                parent_approval_status:
                  parentApprovalResult
                    ?.status ||
                  "not_requested",

                reason:
                  reason ||
                  null,

                completed_at:
                  nowISO()
              },

              event_status:
                "success"
            });

          /* ==============================================
             STAGE 11
             RUNTIME CONTINUITY
          ============================================== */

          commitRuntimeContext({
            athleteId:
              verifiedSnapshot
                .athlete_id,

            snapshotId:
              verifiedSnapshot
                .snapshot_id
          });

          /* ==============================================
             STAGE 12
             DOWNSTREAM WORKSPACE RELEASE
          ============================================== */

          setText(
            "recordBadge",
            status === "draft"
              ? "Draft Saved"
              : "Record Submitted"
          );

          setText(
            "statusProfile",
            status === "draft"
              ? "Draft"
              : "Submitted"
          );

          setText(
            "statusVerification",
            readableStatus(
              verifiedSnapshot
                .verification_status
            )
          );

          updateContinueRoute(
            verifiedSnapshot
              .snapshot_id
          );

          currentIntakeMode = {
            mode:
              "edit",

            snapshot_id:
              verifiedSnapshot
                .snapshot_id,

            forced_new:
              false
          };

          if (
            status === "draft"
          ) {
            setSystemMessage(
              (
                "Draft saved successfully. Snapshot ID: " +
                verifiedSnapshot
                  .snapshot_id
              ),
              "success"
            );
          } else {
            setSystemMessage(
              (
                "ATHLETE RECORD SUBMITTED. Snapshot ID: " +
                verifiedSnapshot
                  .snapshot_id
              ),
              "success"
            );
          }

          return {
            ok:
              true,

            status,

            athlete:
              athleteResult
                .athlete,

            snapshot:
              verifiedSnapshot,

            lifecycle_receipts:
              lifecycleReceipts,

            completion_receipt:
              completionReceipt,

            headshot:
              headshotResult,

            parent_approval:
              parentApprovalResult,

            phnx_handoff:
              handoffResult,

            phnx_queue:
              queueResult
          };
        } catch (error) {
          console.error(
            "[Stream 2] Governed athlete source transaction failed:",
            error
          );

          /*
          ------------------------------------------------
          FAILURE TRUTH

          Preserve form contents, generated IDs, and local
          headshot state so a recoverable retry does not
          silently manufacture an unrelated transaction.
          ------------------------------------------------
          */

          setSystemMessage(
            error?.message ||
            "Athlete source-record transaction failed.",
            "error"
          );

          throw error;
        } finally {
          activeTransactionPromise =
            null;

          setTransactionButtonsDisabled(
            false
          );
        }
      })();

    return activeTransactionPromise;
  }


  /* ======================================================
     FINAL SUBMISSION
  ====================================================== */

  async function submitSnapshot(
    event
  ) {
    event?.preventDefault?.();

    try {
      return await runSnapshotTransaction({
        status:
          "submitted",

        requireHeadshot:
          true,

        reason:
          "FINAL_ATHLETE_PROFILE_SUBMISSION"
      });
    } catch (error) {
      /*
      Error already rendered by transaction authority.
      */

      return {
        ok:
          false,

        error
      };
    }
  }


  /* ======================================================
     DRAFT SAVE
  ====================================================== */

  async function saveDraftSnapshot(
    event
  ) {
    event?.preventDefault?.();

    try {
      return await runSnapshotTransaction({
        status:
          "draft",

        requireHeadshot:
          false,

        reason:
          "ATHLETE_PROFILE_DRAFT_SAVE"
      });
    } catch (error) {
      return {
        ok:
          false,

        error
      };
    }
  }


  /* ======================================================
     VERIFICATION REQUEST
  ====================================================== */

  async function requestSnapshotVerification(
    event
  ) {
    event?.preventDefault?.();

    try {
      const snapshotId =
        clean(
          val(
            "snapshotId"
          )
        ) ||
        getActiveSnapshotId();

      if (!snapshotId) {
        setSystemMessage(
          "Save or submit the athlete record before requesting review.",
          "warning"
        );

        return {
          ok:
            false,

          reason:
            "SNAPSHOT_REQUIRED"
        };
      }

      const snapshot =
        await readBackSnapshot(
          snapshotId
        );

      const db =
        getDb();

      const updateResult =
        await db
          .from(
            SNAPSHOT_TABLE
          )
          .update({
            verification_status:
              "REQUESTED",

            updated_at:
              nowISO(),

            last_source_update_at:
              nowISO()
          })
          .eq(
            "snapshot_id",
            snapshotId
          )
          .select("*")
          .single();

      if (updateResult.error) {
        throw updateResult
          .error;
      }

      verifySnapshotIdentity({
        snapshot:
          updateResult.data,

        expectedSnapshotId:
          snapshot
            .snapshot_id,

        expectedAthleteId:
          snapshot
            .athlete_id
      });

      const receipt =
        await writeSnapshotAuditReceipt({
          action:
            "VERIFICATION_REQUESTED",

          snapshot_id:
            snapshot
              .snapshot_id,

          athlete_id:
            snapshot
              .athlete_id,

          before_record: {
            verification_status:
              snapshot
                .verification_status
          },

          after_record: {
            verification_status:
              updateResult
                .data
                .verification_status,

            requested_at:
              nowISO()
          },

          event_status:
            "success"
        });

      setText(
        "statusVerification",
        "Requested"
      );

      setSystemMessage(
        "Record review requested.",
        "success"
      );

      return {
        ok:
          true,

        snapshot:
          updateResult.data,

        receipt
      };
    } catch (error) {
      console.error(
        "[Stream 2] Verification request failed:",
        error
      );

      setSystemMessage(
        error?.message ||
        "Record review request failed.",
        "error"
      );

      return {
        ok:
          false,

        error
      };
    }
  }


  /* ======================================================
     LOAD EXISTING SNAPSHOT
  ====================================================== */

  async function loadExistingSnapshot(
    snapshotId
  ) {
    const snapshot =
      await readBackSnapshot(
        snapshotId
      );

    verifySnapshotIdentity({
      snapshot,

      expectedSnapshotId:
        snapshotId,

      expectedAthleteId:
        snapshot
          .athlete_id
    });

    setVal(
      "snapshotId",
      snapshot
        .snapshot_id
    );

    setVal(
      "athleteId",
      snapshot
        .athlete_id
    );

    setActiveSnapshotId(
      snapshot
        .snapshot_id
    );

    setActiveAthleteId(
      snapshot
        .athlete_id
    );

    const fieldMap = {
      firstName:
        snapshot.first_name,

      lastName:
        snapshot.last_name,

      graduationClass:
        snapshot.graduation_class,

      cityState:
        snapshot.city_state,

      schoolProgram:
        snapshot.school_program,

      primarySport:
        snapshot.primary_sport,

      height:
        snapshot.height,

      weight:
        snapshot.weight,

      primaryPosition:
        snapshot.primary_position,

      secondaryPosition:
        snapshot.secondary_position,

      dominantHandFoot:
        snapshot.dominant_hand_foot,

      jerseyNumber:
        snapshot.jersey_number,

      currentGpa:
        snapshot.current_gpa,

      ncaaEligibilityStatus:
        snapshot.ncaa_eligibility_status,

      transcriptAvailable:
        snapshot.transcript_available,

      counselorContactAvailable:
        snapshot.counselor_contact_available,

      academicNotes:
        snapshot.academic_notes,

      highlightUrl:
        snapshot.highlight_url,

      gameFilmUrl:
        snapshot.game_film_url,

      socialProfileUrl:
        snapshot.social_profile_url,

      recruitingProfileUrl:
        snapshot.recruiting_profile_url,

      guardianName:
        snapshot.guardian_name,

      guardianEmail:
        snapshot.guardian_email,

      guardianPhone:
        snapshot.guardian_phone,

      coachName:
        snapshot.coach_name,

      coachEmail:
        snapshot.coach_email,

      verificationPermission:
        snapshot.verification_permission,

      sourceOrigin:
        snapshot.source_origin,

      submittedByRole:
        snapshot.submitted_by_role,

      submittedByName:
        snapshot.submitted_by_name,

      submittedByEmail:
        snapshot.submitted_by_email,

      phnxCertifiedId:
        snapshot.phnx_certified_id,

      phnxCertificationStatus:
        snapshot.phnx_certification_status,

      trustClassification:
        snapshot.trust_classification,

      sourceOrganization:
        snapshot.source_organization
    };

    Object.entries(
      fieldMap
    ).forEach(
      (
        [
          key,
          value
        ]
      ) => {
        setFormControlValue(
          key,
          value
        );
      }
    );

    populateSportMetricInputs(
      snapshot
        .sport_metric_payload
    );

    setVal(
      "sportMetricPayload",
      JSON.stringify(
        safeObject(
          snapshot
            .sport_metric_payload
        )
      )
    );

    setVal(
      "sourceClaimsPayload",
      JSON.stringify(
        safeObject(
          snapshot
            .source_claims_payload
        )
      )
    );

    setVal(
      "headshotUrl",
      snapshot
        .headshot_public_url ||
      snapshot
        .headshot_url ||
      ""
    );

    setVal(
      "headshotPath",
      snapshot
        .headshot_path ||
      ""
    );

    setVal(
      "headshotFileName",
      snapshot
        .headshot_filename ||
      ""
    );

    const headshotVerification =
      verifyCanonicalHeadshotContract(
        snapshot,
        {
          throwOnFailure:
            false
        }
      );

    if (
      headshotVerification.ok
    ) {
      renderPersistedHeadshot(
        snapshot
      );

      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFIED,
        snapshot
          .headshot_filename ||
        "Saved athlete headshot"
      );
    } else {
      setHeadshotUiState(
        HEADSHOT_UI_STATE.MISSING
      );
    }

    setText(
      "recordBadge",
      readableStatus(
        snapshot
          .snapshot_status ||
        "Record Loaded"
      )
    );

    setText(
      "statusProfile",
      readableStatus(
        snapshot
          .source_record_status ||
        snapshot
          .snapshot_status
      )
    );

    setText(
      "statusTrust",
      readableStatus(
        snapshot
          .trust_classification ||
        "Pending"
      )
    );

    setText(
      "statusVerification",
      readableStatus(
        snapshot
          .verification_status ||
        "Pending"
      )
    );

    setPhnxUiState(
      snapshot
        .phnx_media_handoff_status ||
      snapshot
        .media_status ||
      MEDIA_STATUS
        .NOT_READY
    );

    updateContinueRoute(
      snapshot
        .snapshot_id
    );

    return snapshot;
  }


  function populateSportMetricInputs(
    payload
  ) {
    const metrics =
      safeObject(
        payload
      );

    Object.entries(
      metrics
    ).forEach(
      (
        [
          key,
          value
        ]
      ) => {
        setFormControlValue(
          key,
          value
        );
      }
    );
  }


  /* ======================================================
     SPORT-SPECIFIC UI
  ====================================================== */

  function updateSportEvidenceBlocks() {
    const sport =
      clean(
        document
          .getElementById(
            "primarySport"
          )
          ?.value
      ).toLowerCase();

    [
      "football",
      "basketball",
      "baseball",
      "track"
    ].forEach(
      name => {
        [
          `${name}Metrics`,
          `${name}Evidence`,
          `${name}MetricBlock`,
          `${name}MetricsBlock`
        ].forEach(
          id => {
            const element =
              document.getElementById(
                id
              );

            if (!element) {
              return;
            }

            element.style.display =
              name === sport
                ? ""
                : "none";
          }
        );
      }
    );

    setText(
      "statusMetrics",
      sport
        ? "Ready"
        : "Pending"
    );
  }


  /* ======================================================
     SOURCE TRUST UI
  ====================================================== */

  function updateSourceTrustFromInputs() {
    const sourceOrigin =
      clean(
        document
          .getElementById(
            "sourceOrigin"
          )
          ?.value
      );

    const submittedByRole =
      clean(
        document
          .getElementById(
            "submittedByRole"
          )
          ?.value
      );

    const trust =
      clean(
        document
          .getElementById(
            "trustClassification"
          )
          ?.value
      );

    const certification =
      clean(
        document
          .getElementById(
            "phnxCertificationStatus"
          )
          ?.value
      );

    setText(
      "statusSource",
      readableStatus(
        sourceOrigin ||
        submittedByRole ||
        "Self-Reported"
      )
    );

    setText(
      "statusTrust",
      readableStatus(
        trust ||
        certification ||
        "Pending"
      )
    );
  }


  /* ======================================================
     MEDIA STATUS UI
  ====================================================== */

  function updateMediaStatus() {
    const hasSelectedFile =
      Boolean(
        selectedHeadshotFile
      );

    const hasSavedHeadshot =
      Boolean(
        clean(
          val(
            "headshotUrl"
          )
        )
      );

    const hasOptionalFilm =
      [
        "highlightUrl",
        "gameFilmUrl",
        "socialProfileUrl",
    "recruitingProfileUrl"
      ].some(
        name => {
          const element =
            document.querySelector(
              `[name="${name}"]`
            );

          return Boolean(
            clean(
              element
                ?.value
            )
          );
        }
      );

    setText(
      "mediaStatusFilm",
      hasOptionalFilm
        ? "Added"
        : "Pending"
    );

    if (
      hasSelectedFile
    ) {
      setPhnxUiState(
        MEDIA_STATUS
          .HEADSHOT_PENDING,
        "Headshot selected — secure upload pending"
      );

      return;
    }

    if (
      hasSavedHeadshot
    ) {
      setPhnxUiState(
        MEDIA_STATUS
          .HEADSHOT_VERIFIED,
        "Saved athlete headshot available"
      );

      return;
    }

    setPhnxUiState(
      MEDIA_STATUS
        .NOT_READY,
      "Athlete headshot required"
    );
  }


  /* ======================================================
     PHYSICAL EVIDENCE / DEBUG API
  ====================================================== */

  function exposeDebugGlobals() {
    const api =
      Object.freeze({
        engine_id:
          ENGINE_ID,

        version:
          ENGINE_VERSION,

        receipt_table:
          AUDIT_TABLE,

        athlete_table:
          ATHLETE_TABLE,

        snapshot_table:
          SNAPSHOT_TABLE,

        headshot_bucket:
          HEADSHOT_BUCKET,

        getMode:
          () => ({
            ...currentIntakeMode
          }),

        getRuntimeState:
          () => ({
            boot_completed:
              bootCompleted,

            preflight_complete:
              runtimePreflightComplete,

            preflight_ok:
              Boolean(
                runtimePreflightResult
                  ?.ok
              ),

            transaction_active:
              Boolean(
                activeTransactionPromise
              ),

            selected_headshot:
              selectedHeadshotFile
                ?.name ||
              null,

            selected_headshot_size:
              selectedHeadshotFile
                ?.size ||
              null,

            preview_mode:
              selectedHeadshotPreviewMode,

            athlete_id:
              clean(
                val(
                  "athleteId"
                )
              ) ||
              getActiveAthleteId(),

            snapshot_id:
              clean(
                val(
                  "snapshotId"
                )
              ) ||
              getActiveSnapshotId()
          }),

        getPreflight:
          () =>
            runtimePreflightResult
              ? {
                  ...runtimePreflightResult
                }
              : null,

        getActiveAthleteId,

        getActiveSnapshotId,

        readBackSnapshot,

        verifySnapshotIdentity,

        assertSnapshotExists,

        verifyCanonicalHeadshotContract,

        writeSnapshotAuditReceipt,

        runSnapshotTransaction
      });

    window
      .STATSCORE_STREAM_2_INTAKE =
      api;

    window.STATScore =
      window.STATScore ||
      {};

    window.STATScore
      .SnapshotIntakeEngine =
      api;

    console.info(
      "[Stream 2] Debug / physical evidence API exposed.",
      {
        engine:
          ENGINE_VERSION,

        receipt_table:
          AUDIT_TABLE
      }
    );
  }


  /* ======================================================
     ENGINE END
  ====================================================== */

})(); 

