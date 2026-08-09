/*
==========================================================
STATS-CORE™ SNAPSHOT / ATHLETE RECORD INTAKE ENGINE
Version: 2.1
Owner Stream:
Stream 2 — Athlete Source Record / Evidence Provenance

CANONICAL RESPONSIBILITY:
- Initialize permanent athlete identity.
- Create and update governed athlete snapshots.
- Capture source claims and provenance.
- Upload and verify the canonical athlete headshot.
- Persist canonical headshot metadata.
- Create or reuse Parent Approval requests.
- Build and persist the canonical PHNX Sports Media handoff.
- Attempt PHNX Media queue handoff using governed packet only.
- Preserve receipts, idempotency, and runtime continuity.
- Release downstream Athlete Workspace only after the
  governed source transaction is materially established.

CANONICAL DATA AUTHORITIES:
- public.statscore_athletes
- public.statscore_snapshots
- public.statscore_snapshot_receipts
- public.sc_parent_approval_requests
- public.phnx_media_handoff_packets

CRITICAL TRANSACTION LAW:
A statscore_snapshot_receipts row MUST NOT reference a
snapshot_id until the corresponding statscore_snapshots row
physically exists.

Therefore:

PROPOSE IDS
   ↓
PERSIST ATHLETE
   ↓
PERSIST SNAPSHOT
   ↓
READ BACK SNAPSHOT
   ↓
WRITE ATHLETE/SNAPSHOT RECEIPTS
   ↓
HEADSHOT
   ↓
PARENT APPROVAL
   ↓
PHNX HANDOFF
   ↓
FINAL READ-BACK
   ↓
RUNTIME CONTEXT
   ↓
ATHLETE WORKSPACE RELEASE

STREAM 2 DOES NOT:
- Score athletes.
- Generate Athlete Intelligence.
- Edit media.
- Select music.
- Render player cards.
- Publish YouTube content.
- Execute Spider distribution.
- Send Multi-Box publication notifications.

==========================================================
*/

(() => {
  "use strict";

  /* ======================================================
     ENGINE IDENTITY
  ====================================================== */

  const ENGINE_NAME =
    "STATSCORE_SNAPSHOT_ATHLETE_RECORD_INTAKE_ENGINE";

  const ENGINE_VERSION = "2.1";

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

  const HEADSHOT_UPLOAD_ATTEMPTS = 3;

  const HEADSHOT_RETRY_DELAYS = [
    750,
    1500,
    3000
  ];

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
     MEDIA STATES
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

  const LEGACY_SNAPSHOT_KEY =
    "statscore_snapshot_id";

  const LEGACY_ATHLETE_KEY =
    "statscore_athlete_id";

  const SECONDARY_SNAPSHOT_KEY =
    "statscore_active_snapshot_id";

  const SECONDARY_ATHLETE_KEY =
    "statscore_active_athlete_id";

  /* ======================================================
     HTML CONTRACT
  ====================================================== */

  const REQUIRED_HTML_IDS = [
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
  ];

  /* ======================================================
     RUNTIME STATE
  ====================================================== */

  let selectedHeadshotFile = null;

  let selectedHeadshotPreviewUrl = "";

  let activeTransactionPromise = null;

  let bootCompleted = false;

  let currentIntakeMode = {
    mode:
      "create",

    snapshot_id:
      null,

    forced_new:
      false
  };

  /* ======================================================
     DATABASE RESOLUTION
  ====================================================== */

  function getDb() {
    const db =
      window.STATScoreData?.getClient?.() ||
      window.supabaseClient ||
      window.STATSCORE_SUPABASE ||
      window.STATScoreSupabase ||
      null;

    if (
      !db ||
      typeof db.from !== "function"
    ) {
      throw new Error(
        "Supabase database client is not loaded. Snapshot Intake cannot execute."
      );
    }

    if (
      !db.storage ||
      typeof db.storage.from !== "function"
    ) {
      throw new Error(
        "Supabase Storage is not loaded. Native headshot upload cannot execute."
      );
    }

    return db;
  }

  async function awaitDbReady() {
    if (window.STATSCORE_DB_READY) {
      try {
        await Promise.resolve(
          window.STATSCORE_DB_READY
        );
      } catch (error) {
        throw new Error(
          `STATS-CORE database initialization failed: ${
            error?.message ||
            String(error)
          }`
        );
      }
    }

    return getDb();
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
            currentIntakeMode.snapshot_id
          );
        } else {
          resetCreateMode();
        }

        updateSportEvidenceBlocks();

        updateSourceTrustFromInputs();

        updateMediaStatus();

        exposeDebugGlobals();

        bootCompleted = true;

        console.info(
          `[Stream 2] Snapshot Intake Engine v${ENGINE_VERSION} initialized.`,
          currentIntakeMode
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
     HTML CONTRACT VALIDATION
  ====================================================== */

  function validateHtmlContract() {
    const missingIds =
      REQUIRED_HTML_IDS.filter(
        id =>
          !document.getElementById(id)
      );

    if (missingIds.length) {
      throw new Error(
        `Snapshot Intake HTML contract is incomplete. Missing IDs: ${missingIds.join(
          ", "
        )}`
      );
    }

    [
      "submitSnapshotBtn",
      "saveDraftBtn",
      "requestVerificationBtn",
      "addHeadshotBtn",
      "removeHeadshotBtn"
    ].forEach(id => {
      const button =
        document.getElementById(id);

      if (
        button &&
        button.tagName === "BUTTON"
      ) {
        button.type = "button";
      }
    });

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    if (fileInput) {
      fileInput.accept =
        ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";
    }
  }

  /* ======================================================
     MODE RESOLUTION
  ====================================================== */

  function resolveSnapshotIntakeMode() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const forcedNew =
      params.get("new") === "1";

    const urlSnapshotId =
      clean(
        params.get("snapshot_id")
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
      LEGACY_SNAPSHOT_KEY,
      LEGACY_ATHLETE_KEY,
      SECONDARY_SNAPSHOT_KEY,
      SECONDARY_ATHLETE_KEY
    ].forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (_error) {}

      try {
        sessionStorage.removeItem(key);
      } catch (_error) {}
    });
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

    releaseSelectedPreviewUrl();

    selectedHeadshotFile =
      null;

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
      fileInput.value = "";
    }

    const preview =
      document.getElementById(
        "headshotPreview"
      );

    if (preview) {
      preview.removeAttribute(
        "src"
      );

      preview.style.display =
        "none";
    }

    const uploadBox =
      document.getElementById(
        "headshotUploadBox"
      );

    uploadBox?.classList.remove(
      "ready",
      "error",
      "uploading",
      "verified"
    );

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
    ].forEach(id => {
      const element =
        document.getElementById(id);

      if (!element) return;

      element.addEventListener(
        "change",
        updateSourceTrustFromInputs
      );

      element.addEventListener(
        "input",
        updateSourceTrustFromInputs
      );
    });

    [
      "highlightUrl",
      "gameFilmUrl",
      "socialProfileUrl",
      "recruitingProfileUrl"
    ].forEach(name => {
      const element =
        document.querySelector(
          `[name="${name}"]`
        );

      if (!element) return;

      element.addEventListener(
        "input",
        updateMediaStatus
      );

      element.addEventListener(
        "change",
        updateMediaStatus
      );
    });

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    fileInput?.addEventListener(
      "change",
      handleHeadshotSelection
    );

    document
      .getElementById(
        "addHeadshotBtn"
      )
      ?.addEventListener(
        "click",
        () => {
          document
            .getElementById(
              "athleteHeadshotUpload"
            )
            ?.click();
        }
      );

    document
      .getElementById(
        "removeHeadshotBtn"
      )
      ?.addEventListener(
        "click",
        removeSelectedHeadshot
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
              val("snapshotId")
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
            `athlete-dashboard.html?snapshot_id=${encodeURIComponent(
              snapshotId
            )}&from=athlete-record-intake`;
        }
      );
  }

  /* ======================================================
     BUTTON CONTROL
  ====================================================== */

  function setTransactionButtonsDisabled(
    disabled
  ) {
    [
      "submitSnapshotBtn",
      "saveDraftBtn",
      "requestVerificationBtn",
      "addHeadshotBtn",
      "removeHeadshotBtn"
    ].forEach(id => {
      const element =
        document.getElementById(id);

      if (element) {
        element.disabled =
          Boolean(disabled);
      }
    });
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

    if (!element) return;

    element.textContent =
      message || "";

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
            "Ready for verified upload"
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
            "Checking file contract"
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
            "Uploading to canonical storage"
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
          "Verifying Upload"
        );

        setText(
          "headshotUploadHint",
          detail ||
            "Confirming storage object"
        );
        break;

      case HEADSHOT_UI_STATE.PERSISTING:
        uploadBox?.classList.add(
          "uploading"
        );

        setText(
          "mediaStatusHeadshot",
          "Persisting"
        );

        setText(
          "mediaStatusCard",
          "Pending"
        );

        setText(
          "headshotUploadText",
          "Saving Canonical Image"
        );

        setText(
          "headshotUploadHint",
          detail ||
            "Updating athlete source record"
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
            "Canonical image persisted"
        );
        break;

      case HEADSHOT_UI_STATE.FAILED:
        uploadBox?.classList.add(
          "error"
        );

        setText(
          "mediaStatusHeadshot",
          "Failed"
        );

        setText(
          "mediaStatusCard",
          "Not Ready"
        );

        setText(
          "headshotUploadText",
          "Headshot Upload Failed"
        );

        setText(
          "headshotUploadHint",
          detail ||
            "Retry is required"
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
          "PHNX SPORTS MEDIA INGEST"
        );

        setText(
          "headshotUploadHint",
          "Click to upload JPG, PNG, WEBP, HEIC, or HEIF"
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
            "Waiting for verified headshot"
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
            "Handoff not yet ready"
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
            "Building media handoff"
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
            "Packet persisted"
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
            "Assets captured"
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
            "Queue failed — packet preserved"
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
            "Waiting for required media"
        );
        break;
    }
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
        formData.get("firstName")
      );

    const lastName =
      clean(
        formData.get("lastName")
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
        val("athleteId")
      );

    let snapshotId =
      clean(
        val("snapshotId")
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
        currentIntakeMode.snapshot_id ||
        getActiveSnapshotId();
    } else {
      /*
      ------------------------------------------------------
      IMPORTANT:
      Generate exactly once for this browser transaction.

      After generation the IDs are immediately written to
      hidden form state below. Subsequent clicks during the
      same intake reuse them rather than manufacturing new
      IDs.
      ------------------------------------------------------
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

    /*
    Preserve IDs immediately in page state before any write.
    */

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
      selectedHeadshotFile ||
      val("headshotUrl")
        ? MEDIA_STATUS.HEADSHOT_PENDING
        : MEDIA_STATUS.NOT_READY;

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
        `${firstName} ${lastName}`.trim(),

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
          formData.get("height")
        ),

      weight:
        clean(
          formData.get("weight")
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
        sourceClaims.source_origin,

      submitted_by_role:
        sourceClaims.submitted_by_role,

      submitted_by_name:
        sourceClaims.submitted_by_name,

      submitted_by_email:
        sourceClaims.submitted_by_email,

      submitted_by_user_id:
        sourceClaims.submitted_by_user_id,

      submitted_by_professional_id:
        sourceClaims.submitted_by_professional_id,

      phnx_certified_id:
        sourceClaims.phnx_certified_id,

      phnx_certification_status:
        sourceClaims.phnx_certification_status,

      trust_classification:
        sourceClaims.trust_classification,

      source_organization:
        sourceClaims.source_organization,

      submission_source:
        sourceClaims.submission_source,

      submission_timestamp:
        sourceClaims.captured_at,

      sport_metric_payload:
        sportMetrics,

      source_claims_payload:
        sourceClaims,

      headshot_url:
        clean(
          val("headshotUrl")
        ),

      headshot_public_url:
        clean(
          val("headshotUrl")
        ),

      headshot_path:
        clean(
          val("headshotPath")
        ),

      headshot_filename:
        clean(
          val("headshotFileName")
        ),

      media_status:
        mediaStatus,

      phnx_media_handoff_status:
        MEDIA_STATUS.NOT_READY,

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
          currentIntakeMode.mode,

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

      /*
      This remains null unless an authenticated-identity
      integration explicitly supplies it.
      */

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

    if (sport === "football") {
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

    if (sport === "baseball") {
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

    if (sport === "track") {
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
     ATHLETE IDENTITY PERSISTENCE

     IMPORTANT:
     THIS FUNCTION DOES NOT WRITE A SNAPSHOT RECEIPT.

     The snapshot may not exist yet.

     Receipt creation is deferred to
     persistLifecycleReceiptsAfterSnapshot().
  ====================================================== */

  async function ensureAthleteExists(
    snapshotRow
  ) {
    const db =
      getDb();

    if (
      !snapshotRow?.athlete_id
    ) {
      throw new Error(
        "athlete_id is required before athlete identity persistence."
      );
    }

    const athletePayload =
      filterAthleteSchema({
        athlete_id:
          snapshotRow.athlete_id,

        first_name:
          snapshotRow.first_name,

        last_name:
          snapshotRow.last_name,

        athlete_display_name:
          snapshotRow.athlete_display_name,

        graduation_class:
          snapshotRow.graduation_class,

        city_state:
          snapshotRow.city_state,

        school_program:
          snapshotRow.school_program,

        primary_sport:
          snapshotRow.primary_sport,

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
          snapshotRow.athlete_id
        )
        .maybeSingle();

    if (
      existingResult.error
    ) {
      throw existingResult.error;
    }

    if (
      existingResult.data
    ) {
      const beforeRecord =
        existingResult.data;

      const updatePayload = {
        ...athletePayload,

        athlete_id:
          beforeRecord.athlete_id,

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
            beforeRecord.athlete_id
          )
          .select("*")
          .single();

      if (
        updatedResult.error
      ) {
        throw updatedResult.error;
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
      throw createdResult.error;
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

     IMPORTANT:
     THIS FUNCTION ALSO DOES NOT WRITE ITS RECEIPT.

     It first establishes the governed snapshot.
  ====================================================== */

  async function insertOrUpdateSnapshot(
    snapshotRow
  ) {
    const db =
      getDb();

    const cleanRow =
      filterSnapshotSchema(
        snapshotRow || {}
      );

    if (
      !cleanRow.snapshot_id
    ) {
      throw new Error(
        "snapshot_id is required before snapshot persistence."
      );
    }

    if (
      !cleanRow.athlete_id
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
          cleanRow.snapshot_id
        )
        .maybeSingle();

    if (
      existingResult.error
    ) {
      throw existingResult.error;
    }

    if (
      existingResult.data
    ) {
      const beforeRecord =
        existingResult.data;

      const updatePayload = {
        ...cleanRow,

        snapshot_id:
          beforeRecord.snapshot_id,

        athlete_id:
          beforeRecord.athlete_id ||
          cleanRow.athlete_id,

        created_at:
          beforeRecord.created_at ||
          cleanRow.created_at ||
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
            beforeRecord.snapshot_id
          )
          .select("*")
          .single();

      if (
        updatedResult.error
      ) {
        throw updatedResult.error;
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
        cleanRow.created_at ||
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
      throw createdResult.error;
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
     POST-SNAPSHOT LIFECYCLE RECEIPTS

     Both athlete and snapshot receipts are written ONLY
     AFTER snapshot read-back confirms the FK target exists.
  ====================================================== */

  async function persistLifecycleReceiptsAfterSnapshot({
    athleteResult,
    snapshotResult,
    verifiedSnapshot
  }) {
    if (
      !verifiedSnapshot?.snapshot_id
    ) {
      throw new Error(
        "Snapshot receipt persistence blocked: governed snapshot does not exist."
      );
    }

    if (
      !verifiedSnapshot?.athlete_id
    ) {
      throw new Error(
        "Snapshot receipt persistence blocked: athlete_id is missing."
      );
    }

    const athleteReceipt =
      await writeSnapshotAuditReceipt({
        action:
          athleteResult
            ?.receipt_action ||
          "ATHLETE_IDENTITY_CONFIRMED",

        snapshot_id:
          verifiedSnapshot.snapshot_id,

        athlete_id:
          verifiedSnapshot.athlete_id,

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
          athleteResult?.action ===
          "created"
            ? "Athlete identity created and linked to governed snapshot."
            : "Athlete identity confirmed or updated and linked to governed snapshot."
      });

    const snapshotReceipt =
      await writeSnapshotAuditReceipt({
        action:
          snapshotResult
            ?.receipt_action ||
          "SNAPSHOT_SOURCE_CONFIRMED",

        snapshot_id:
          verifiedSnapshot.snapshot_id,

        athlete_id:
          verifiedSnapshot.athlete_id,

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
          snapshotResult?.action ===
          "created"
            ? "Governed athlete snapshot created and verified by read-back."
            : "Governed athlete snapshot updated and verified by read-back."
      });

    return {
      athlete_receipt:
        athleteReceipt,

      snapshot_receipt:
        snapshotReceipt
    };
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

    const filtered = {};

    Object.entries(
      row || {}
    ).forEach(
      ([key, value]) => {
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

    const filtered = {};

    Object.entries(
      row || {}
    ).forEach(
      ([key, value]) => {
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
     HEADSHOT SELECTION
  ====================================================== */

  async function handleHeadshotSelection(
    event
  ) {
    const file =
      event?.target
        ?.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    try {
      setHeadshotUiState(
        HEADSHOT_UI_STATE.VALIDATING,
        file.name
      );

      const validation =
        validateHeadshotFile(
          file
        );

      selectedHeadshotFile =
        file;

      releaseSelectedPreviewUrl();

      selectedHeadshotPreviewUrl =
        URL.createObjectURL(
          file
        );

      const preview =
        document.getElementById(
          "headshotPreview"
        );

      if (preview) {
        preview.src =
          selectedHeadshotPreviewUrl;

        preview.style.display =
          "block";
      }

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

      setHeadshotUiState(
        HEADSHOT_UI_STATE.SELECTED,
        `${file.name} · ${formatBytes(
          file.size
        )}`
      );

      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_PENDING,
        "Selected — upload required"
      );

      updateMediaStatus();

      return validation;
    } catch (error) {
      selectedHeadshotFile =
        null;

      const fileInput =
        document.getElementById(
          "athleteHeadshotUpload"
        );

      if (fileInput) {
        fileInput.value = "";
      }

      setHeadshotUiState(
        HEADSHOT_UI_STATE.FAILED,
        error?.message ||
          "Invalid headshot"
      );

      setPhnxUiState(
        MEDIA_STATUS.NOT_READY,
        "Valid headshot required"
      );

      setSystemMessage(
        error?.message ||
          "Headshot validation failed.",
        "error"
      );

      throw error;
    }
  }

  function removeSelectedHeadshot() {
    selectedHeadshotFile =
      null;

    releaseSelectedPreviewUrl();

    const fileInput =
      document.getElementById(
        "athleteHeadshotUpload"
      );

    if (fileInput) {
      fileInput.value = "";
    }

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

    const preview =
      document.getElementById(
        "headshotPreview"
      );

    if (preview) {
      preview.removeAttribute(
        "src"
      );

      preview.style.display =
        "none";
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
      HEADSHOT_UI_STATE.MISSING
    );

    setPhnxUiState(
      MEDIA_STATUS.NOT_READY
    );

    updateMediaStatus();
  }

  function releaseSelectedPreviewUrl() {
    if (
      selectedHeadshotPreviewUrl
    ) {
      try {
        URL.revokeObjectURL(
          selectedHeadshotPreviewUrl
        );
      } catch (_error) {}
    }

    selectedHeadshotPreviewUrl =
      "";
  }

  /* ======================================================
     HEADSHOT VALIDATION
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
        `Headshot exceeds the ${formatBytes(
          HEADSHOT_MAX_BYTES
        )} maximum.`
      );
    }

    const extension =
      getFileExtension(
        file.name
      );

    if (
      !HEADSHOT_ALLOWED_EXTENSIONS.has(
        extension
      )
    ) {
      throw new Error(
        `Unsupported headshot extension: .${
          extension ||
          "unknown"
        }.`
      );
    }

    const normalizedMimeType =
      normalizeMimeType(
        file.type,
        extension
      );

    if (
      !HEADSHOT_ALLOWED_MIME_TYPES.has(
        normalizedMimeType
      )
    ) {
      throw new Error(
        `Unsupported headshot MIME type: ${
          normalizedMimeType ||
          "unknown"
        }.`
      );
    }

    return {
      valid:
        true,

      extension,

      mime_type:
        normalizedMimeType,

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
    const cleanType =
      clean(type)
        .toLowerCase();

    if (cleanType) {
      return cleanType;
    }

    const map = {
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
      map[extension] ||
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
      parts.length < 2
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
      `athletes/${athleteId}` +
      `/snapshots/${snapshotId}` +
      `/headshots/current.${extension}`
    );
  }

  /* ======================================================
     HEADSHOT UPLOAD + READ-BACK
  ====================================================== */

  async function uploadAndVerifyHeadshot({
    snapshot,
    required
  }) {
    /*
    At this stage snapshot MUST already physically exist.
    */

    await assertSnapshotExists(
      snapshot?.snapshot_id,
      snapshot?.athlete_id
    );

    const existingVerification =
      verifyCanonicalHeadshotContract(
        snapshot,
        {
          throwOnFailure:
            false
        }
      );

    if (
      !selectedHeadshotFile
    ) {
      if (
        existingVerification.ok
      ) {
        setHeadshotUiState(
          HEADSHOT_UI_STATE.VERIFIED,
          snapshot.headshot_filename ||
            "Existing canonical headshot"
        );

        setPhnxUiState(
          MEDIA_STATUS.HEADSHOT_VERIFIED,
          "Existing headshot verified"
        );

        return {
          ok:
            true,

          reused:
            true,

          uploaded:
            false,

          verified_snapshot:
            snapshot,

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
          "Required headshot missing"
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
          snapshot,

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
        snapshot?.athlete_id
      );

    const snapshotId =
      clean(
        snapshot?.snapshot_id
      );

    if (
      !athleteId ||
      !snapshotId
    ) {
      throw new Error(
        "Canonical athlete_id and snapshot_id are required before upload."
      );
    }

    const storagePath =
      buildCanonicalHeadshotPath({
        athleteId,
        snapshotId,

        extension:
          validation.extension
      });

    const uploadStartedAt =
      nowISO();

    await writeSnapshotAuditReceipt({
      action:
        "HEADSHOT_UPLOAD_STARTED",

      snapshot_id:
        snapshotId,

      athlete_id:
        athleteId,

      before_record: {
        headshot_path:
          snapshot.headshot_path ||
          null,

        headshot_public_url:
          snapshot.headshot_public_url ||
          snapshot.headshot_url ||
          null
      },

      after_record: {
        bucket:
          HEADSHOT_BUCKET,

        path:
          storagePath,

        filename:
          selectedHeadshotFile.name,

        mime_type:
          validation.mime_type,

        size_bytes:
          validation.size_bytes,

        started_at:
          uploadStartedAt
      },

      event_status:
        "started",

      event_message:
        "Canonical athlete headshot upload started."
    });

    setHeadshotUiState(
      HEADSHOT_UI_STATE.UPLOADING,
      "Attempting canonical upload"
    );

    setPhnxUiState(
      MEDIA_STATUS.HEADSHOT_UPLOADING,
      "Uploading canonical athlete image"
    );

    try {
      const uploadResult =
        await uploadHeadshotWithRetry({
          file:
            selectedHeadshotFile,

          storagePath,

          contentType:
            validation.mime_type
        });

      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFYING,
        "Confirming Storage object"
      );

      const objectVerification =
        await verifyStorageObject({
          storagePath
        });

      if (
        !objectVerification.ok
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
          "Supabase did not return a canonical public headshot URL."
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
          snapshot.submitted_by_name
        ) ||
        clean(
          snapshot.submitted_by_email
        ) ||
        clean(
          snapshot.submitted_by_role
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
          selectedHeadshotFile.name,

        sanitized_filename:
          sanitizeFilename(
            selectedHeadshotFile.name
          ),

        mime_type:
          validation.mime_type,

        extension:
          validation.extension,

        size_bytes:
          validation.size_bytes,

        width:
          dimensions.width,

        height:
          dimensions.height,

        upload_attempt_count:
          uploadResult.attempt_count,

        upload_response:
          uploadResult.data ||
          null,

        storage_verification:
          objectVerification,

        uploaded_at:
          uploadedAt,

        verified_at:
          nowISO(),

        verified:
          true
      };

      setHeadshotUiState(
        HEADSHOT_UI_STATE.PERSISTING,
        "Saving canonical metadata"
      );

      await persistHeadshotMetadata({
        snapshotId,
        publicUrl,
        storagePath,

        filename:
          selectedHeadshotFile.name,

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
                selectedHeadshotFile.name
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

      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFIED,
        verifiedSnapshot
          .headshot_filename
      );

      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_VERIFIED,
        "Canonical headshot verified"
      );

      await writeSnapshotAuditReceipt({
        action:
          "HEADSHOT_UPLOAD_VERIFIED",

        snapshot_id:
          snapshotId,

        athlete_id:
          athleteId,

        before_record:
          snapshot,

        after_record: {
          headshot_url:
            verifiedSnapshot.headshot_url,

          headshot_public_url:
            verifiedSnapshot.headshot_public_url,

          headshot_path:
            verifiedSnapshot.headshot_path,

          headshot_filename:
            verifiedSnapshot.headshot_filename,

          headshot_bucket:
            verifiedSnapshot.headshot_bucket,

          headshot_uploaded_at:
            verifiedSnapshot.headshot_uploaded_at,

          headshot_uploaded_by:
            verifiedSnapshot.headshot_uploaded_by,

          headshot_receipt:
            verifiedSnapshot.headshot_receipt,

          media_status:
            verifiedSnapshot.media_status
        },

        event_status:
          "success",

        event_message:
          "Canonical athlete headshot uploaded, persisted, and verified."
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
      setHeadshotUiState(
        HEADSHOT_UI_STATE.FAILED,
        error?.message ||
          "Headshot upload failed"
      );

      setPhnxUiState(
        MEDIA_STATUS.NOT_READY,
        "Headshot retry required"
      );

      /*
      Snapshot already exists here, so failure receipt
      is FK-safe.
      */

      try {
        await writeSnapshotAuditReceipt({
          action:
            "HEADSHOT_UPLOAD_FAILED",

          snapshot_id:
            snapshotId,

          athlete_id:
            athleteId,

          before_record:
            snapshot,

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
          "[Stream 2] Could not persist headshot failure receipt:",
          receiptError
        );
      }

      error.code =
        error.code ||
        "INTAKE_INCOMPLETE_HEADSHOT_FAILED";

      throw error;
    }
  }

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
      const uploadResult =
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

      if (
        !uploadResult.error
      ) {
        return {
          ok:
            true,

          data:
            uploadResult.data,

          attempt_count:
            attempt
        };
      }

      lastError =
        uploadResult.error;

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
        lastError?.message ||
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

  async function verifyStorageObject({
    storagePath
  }) {
    const db =
      getDb();

    const pathParts =
      storagePath.split("/");

    const filename =
      pathParts.pop();

    const folder =
      pathParts.join("/");

    const listResult =
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

    if (
      listResult.error
    ) {
      throw listResult.error;
    }

    const match =
      Array.isArray(
        listResult.data
      )
        ? listResult.data.find(
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
      result?.data
        ?.publicUrl ||
      result?.publicURL ||
      ""
    );
  }

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

    const updatePayload = {
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
    };

    const updateResult =
      await db
        .from(
          SNAPSHOT_TABLE
        )
        .update(
          updatePayload
        )
        .eq(
          "snapshot_id",
          snapshotId
        )
        .select("*")
        .single();

    if (
      updateResult.error
    ) {
      throw updateResult.error;
    }

    return updateResult.data;
  }

  /* ======================================================
     SNAPSHOT READ-BACK / EXISTENCE
  ====================================================== */

  async function readBackSnapshot(
    snapshotId
  ) {
    const db =
      getDb();

    const result =
      await db
        .from(
          SNAPSHOT_TABLE
        )
        .select("*")
        .eq(
          "snapshot_id",
          snapshotId
        )
        .single();

    if (
      result.error
    ) {
      throw result.error;
    }

    if (
      !result.data
    ) {
      throw new Error(
        "Snapshot read-back returned no record."
      );
    }

    return result.data;
  }

  async function assertSnapshotExists(
    snapshotId,
    athleteId = null
  ) {
    const snapshot =
      await readBackSnapshot(
        snapshotId
      );

    if (
      athleteId &&
      clean(
        snapshot.athlete_id
      ) !==
        clean(athleteId)
    ) {
      throw new Error(
        "Snapshot read-back athlete_id does not match active athlete identity."
      );
    }

    return snapshot;
  }

  /* ======================================================
     HEADSHOT CONTRACT VERIFICATION
  ====================================================== */

  function verifyCanonicalHeadshotContract(
    snapshot,
    {
      expected = null,
      throwOnFailure = false
    } = {}
  ) {
    const failures = [];

    const publicUrl =
      clean(
        snapshot?.headshot_public_url ||
        snapshot?.headshot_url
      );

    const bucket =
      clean(
        snapshot?.headshot_bucket
      );

    const path =
      clean(
        snapshot?.headshot_path
      );

    const filename =
      clean(
        snapshot?.headshot_filename
      );

    const receipt =
      safeObject(
        snapshot?.headshot_receipt
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
        .length === 0
    ) {
      failures.push(
        "headshot_receipt"
      );
    }

    if (
      receipt?.verified !==
      true
    ) {
      failures.push(
        "headshot_receipt.verified"
      );
    }

    if (
      snapshot?.media_status !==
        MEDIA_STATUS
          .HEADSHOT_VERIFIED &&
      snapshot?.media_status !==
        MEDIA_STATUS
          .HANDOFF_READY &&
      snapshot?.media_status !==
        MEDIA_STATUS
          .HANDOFF_QUEUED &&
      snapshot?.media_status !==
        MEDIA_STATUS
          .HANDOFF_QUEUE_FAILED
    ) {
      failures.push(
        "media_status"
      );
    }

    if (expected) {
      if (
        expected.public_url &&
        publicUrl !==
          expected.public_url
      ) {
        failures.push(
          "headshot_public_url_mismatch"
        );
      }

      if (
        expected.bucket &&
        bucket !==
          expected.bucket
      ) {
        failures.push(
          "headshot_bucket_mismatch"
        );
      }

      if (
        expected.path &&
        path !==
          expected.path
      ) {
        failures.push(
          "headshot_path_mismatch"
        );
      }

      if (
        expected.filename &&
        filename !==
          expected.filename
      ) {
        failures.push(
          "headshot_filename_mismatch"
        );
      }
    }

    const result = {
      ok:
        failures.length === 0,

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
          `Canonical headshot verification failed: ${failures.join(
            ", "
          )}`
        );

      error.code =
        "HEADSHOT_DATABASE_VERIFICATION_FAILED";

      error.verification =
        result;

      throw error;
    }

    return result;
  }

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
    } catch (_error) {}

    return {
      width:
        null,

      height:
        null
    };
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

    if (
      !guardianEmail
    ) {
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

    if (
      existingResult.error
    ) {
      throw existingResult.error;
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
        `${verifiedSnapshot.first_name || ""} ${
          verifiedSnapshot.last_name || ""
        }`.trim(),

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
        existingResult.data
          ?.status ||
        "pending",

      requested_at:
        existingResult.data
          ?.requested_at ||
        nowISO(),

      updated_at:
        nowISO()
    };

    if (
      existingResult.data
    ) {
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
            existingResult.data.id
          )
          .select("*")
          .single();

      if (
        updatedResult.error
      ) {
        throw updatedResult.error;
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
          "success",

        event_message:
          "Existing Parent Approval request reused for governed athlete snapshot."
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

    const createPayload = {
      ...basePayload,

      created_at:
        nowISO()
    };

    const createdResult =
      await db
        .from(
          PARENT_APPROVAL_TABLE
        )
        .insert(
          createPayload
        )
        .select("*")
        .single();

    if (
      createdResult.error
    ) {
      throw createdResult.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        "PARENT_APPROVAL_REQUEST_CREATED",

      snapshot_id:
...

[Message clipped]  View entire message
