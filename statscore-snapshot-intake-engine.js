/*
==========================================================
STATS-CORE™ SNAPSHOT / ATHLETE RECORD INTAKE ENGINE
Version: 2.0
Owner Stream:
Stream 2 — Athlete Source Record / Evidence Provenance

CANONICAL RESPONSIBILITY:
- Initialize and maintain athlete identity.
- Create and update governed athlete snapshots.
- Capture evidence and source provenance.
- Upload and verify the canonical athlete headshot.
- Persist canonical headshot metadata.
- Create or reuse parent approval requests.
- Build and persist the canonical PHNX Sports Media handoff.
- Attempt the PHNX Media queue using the governed packet only.
- Preserve receipts, idempotency, and runtime context.

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
     DATABASE TABLES
  ====================================================== */

  const ATHLETE_TABLE = "statscore_athletes";
  const SNAPSHOT_TABLE = "statscore_snapshots";
  const AUDIT_TABLE = "sc_snapshot_audit_receipts";
  const PARENT_APPROVAL_TABLE = "sc_parent_approval_requests";
  const PHNX_HANDOFF_TABLE = "phnx_media_handoff_packets";

  /* ======================================================
     STORAGE CONTRACT
  ====================================================== */

  const HEADSHOT_BUCKET = "statscore-headshots";
  const HEADSHOT_MAX_BYTES = 10 * 1024 * 1024;

  const HEADSHOT_ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif"
  ]);

  const HEADSHOT_ALLOWED_EXTENSIONS = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
    "heic",
    "heif"
  ]);

  const HEADSHOT_UPLOAD_ATTEMPTS = 3;
  const HEADSHOT_RETRY_DELAYS = [750, 1500, 3000];

  /* ======================================================
     PHNX MEDIA CONTRACT
  ====================================================== */

  const PHNX_CONTRACT_NAME = "PHNX_SPORTS_MEDIA_HANDOFF";
  const PHNX_CONTRACT_VERSION = "1.0";

  const PHNX_SOURCE_SYSTEM = "STATS_CORE";
  const PHNX_SOURCE_STREAM = "STREAM_2";
  const PHNX_TARGET_SYSTEM = "PHNX_SPORTS_MEDIA";

  const MEDIA_STATUS = Object.freeze({
    NOT_READY: "NOT_READY",
    HEADSHOT_PENDING: "HEADSHOT_PENDING",
    HEADSHOT_UPLOADING: "HEADSHOT_UPLOADING",
    HEADSHOT_VERIFIED: "HEADSHOT_VERIFIED",
    HANDOFF_READY: "HANDOFF_READY",
    HANDOFF_QUEUED: "HANDOFF_QUEUED",
    HANDOFF_QUEUE_FAILED: "HANDOFF_QUEUE_FAILED"
  });

  const HEADSHOT_UI_STATE = Object.freeze({
    MISSING: "MISSING",
    SELECTED: "SELECTED",
    VALIDATING: "VALIDATING",
    UPLOADING: "UPLOADING",
    VERIFYING: "VERIFYING",
    PERSISTING: "PERSISTING",
    VERIFIED: "VERIFIED",
    FAILED: "FAILED"
  });

  /* ======================================================
     ACTIVE RUNTIME KEYS
  ====================================================== */

  const ACTIVE_SNAPSHOT_KEY = "STATSCORE_ACTIVE_SNAPSHOT_ID";
  const ACTIVE_ATHLETE_KEY = "STATSCORE_ACTIVE_ATHLETE_ID";

  const LEGACY_SNAPSHOT_KEY = "statscore_snapshot_id";
  const LEGACY_ATHLETE_KEY = "statscore_athlete_id";

  const SECONDARY_SNAPSHOT_KEY = "statscore_active_snapshot_id";
  const SECONDARY_ATHLETE_KEY = "statscore_active_athlete_id";

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

  let currentIntakeMode = {
    mode: "create",
    snapshot_id: null,
    forced_new: false
  };

  let activeTransactionPromise = null;
  let bootCompleted = false;

  /* ======================================================
     DATABASE RESOLUTION
  ====================================================== */

  function getDb() {
    const db =
      window.STATScoreData?.getClient?.() ||
      window.supabaseClient ||
      window.STATSCORE_SUPABASE ||
      window.STATScoreSupabase ||
      window.supabase ||
      null;

    if (!db || typeof db.from !== "function") {
      throw new Error(
        "Supabase database client is not loaded. Snapshot Intake cannot execute."
      );
    }

    if (!db.storage || typeof db.storage.from !== "function") {
      throw new Error(
        "Supabase Storage is not loaded. Native headshot upload cannot execute."
      );
    }

    return db;
  }

  async function awaitDbReady() {
    if (window.STATSCORE_DB_READY) {
      try {
        await Promise.resolve(window.STATSCORE_DB_READY);
      } catch (error) {
        throw new Error(
          `STATS-CORE database initialization failed: ${
            error?.message || String(error)
          }`
        );
      }
    }

    return getDb();
  }

  /* ======================================================
     BOOT
  ====================================================== */

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await awaitDbReady();

      validateHtmlContract();

      currentIntakeMode = resolveSnapshotIntakeMode();

      bindSnapshotIntakeEvents();

      if (currentIntakeMode.mode === "edit") {
        await loadExistingSnapshot(currentIntakeMode.snapshot_id);
      } else {
        resetCreateMode();
      }

      updateSportEvidenceBlocks();
      updateSourceTrustFromInputs();
      updateMediaStatus();

      exposeDebugGlobals();

      bootCompleted = true;

      console.info(
        "[Stream 2] Snapshot Intake Engine v2.0 initialized.",
        currentIntakeMode
      );
    } catch (error) {
      console.error("[Stream 2] Snapshot Intake boot failed:", error);

      setSystemMessage(
        error?.message || "Snapshot Intake failed to initialize.",
        "error"
      );

      setTransactionButtonsDisabled(true);
    }
  });

  /* ======================================================
     HTML CONTRACT VALIDATION
  ====================================================== */

  function validateHtmlContract() {
    const missingIds = REQUIRED_HTML_IDS.filter(
      id => !document.getElementById(id)
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
      const button = document.getElementById(id);

      if (button && button.tagName === "BUTTON") {
        button.type = "button";
      }
    });

    const fileInput = document.getElementById("athleteHeadshotUpload");

    if (fileInput) {
      fileInput.accept =
        ".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif";
    }
  }

  /* ======================================================
     MODE RESOLUTION
  ====================================================== */

  function resolveSnapshotIntakeMode() {
    const params = new URLSearchParams(window.location.search);

    const forcedNew = params.get("new") === "1";
    const urlSnapshotId = clean(params.get("snapshot_id"));

    if (forcedNew) {
      clearActiveRecordContext();

      return {
        mode: "create",
        snapshot_id: null,
        forced_new: true
      };
    }

    if (urlSnapshotId) {
      setActiveSnapshotId(urlSnapshotId);

      return {
        mode: "edit",
        snapshot_id: urlSnapshotId,
        forced_new: false
      };
    }

    clearActiveRecordContext();

    return {
      mode: "create",
      snapshot_id: null,
      forced_new: false
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
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  /* ======================================================
     CREATE MODE RESET
  ====================================================== */

  function resetCreateMode() {
    const form = document.getElementById("snapshotForm");

    if (form) {
      form.reset();
    }

    releaseSelectedPreviewUrl();

    selectedHeadshotFile = null;

    setVal("athleteId", "");
    setVal("snapshotId", "");
    setVal("sportMetricPayload", "");
    setVal("sourceClaimsPayload", "");

    setVal("headshotUrl", "");
    setVal("headshotPath", "");
    setVal("headshotFileName", "");

    const fileInput = document.getElementById("athleteHeadshotUpload");

    if (fileInput) {
      fileInput.value = "";
    }

    const preview = document.getElementById("headshotPreview");

    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }

    const uploadBox = document.getElementById("headshotUploadBox");

    if (uploadBox) {
      uploadBox.classList.remove(
        "ready",
        "error",
        "uploading",
        "verified"
      );
    }

    const removeButton = document.getElementById("removeHeadshotBtn");

    if (removeButton) {
      removeButton.style.display = "none";
    }

    setText("recordBadge", "Record Pending");
    setText("statusProfile", "Pending");
    setText("statusSource", "Self-Reported");
    setText("statusTrust", "Pending");
    setText("statusMetrics", "Pending");
    setText("statusVerification", "Pending");

    setHeadshotUiState(HEADSHOT_UI_STATE.MISSING);
    setPhnxUiState(MEDIA_STATUS.NOT_READY);

    setSystemMessage("", "neutral");
    updateContinueRoute("");
  }

  /* ======================================================
     EVENT BINDING
  ====================================================== */

  function bindSnapshotIntakeEvents() {
    const sport = document.getElementById("primarySport");

    if (sport) {
      sport.addEventListener("change", updateSportEvidenceBlocks);
    }

    [
      "sourceOrigin",
      "submittedByRole",
      "trustClassification",
      "phnxCertificationStatus",
      "phnxCertifiedId"
    ].forEach(id => {
      const element = document.getElementById(id);

      if (!element) return;

      element.addEventListener("change", updateSourceTrustFromInputs);
      element.addEventListener("input", updateSourceTrustFromInputs);
    });

    [
      "highlightUrl",
      "gameFilmUrl",
      "socialProfileUrl",
      "recruitingProfileUrl"
    ].forEach(name => {
      const element = document.querySelector(`[name="${name}"]`);

      if (!element) return;

      element.addEventListener("input", updateMediaStatus);
      element.addEventListener("change", updateMediaStatus);
    });

    const fileInput = document.getElementById("athleteHeadshotUpload");

    if (fileInput) {
      fileInput.addEventListener("change", handleHeadshotSelection);
    }

    const addHeadshotButton = document.getElementById("addHeadshotBtn");

    if (addHeadshotButton) {
      addHeadshotButton.addEventListener("click", () => {
        document.getElementById("athleteHeadshotUpload")?.click();
      });
    }

    const removeHeadshotButton =
      document.getElementById("removeHeadshotBtn");

    if (removeHeadshotButton) {
      removeHeadshotButton.addEventListener(
        "click",
        removeSelectedHeadshot
      );
    }

    const submitButton = document.getElementById("submitSnapshotBtn");

    if (submitButton) {
      submitButton.addEventListener("click", () => {
        submitSnapshot();
      });
    }

    const saveDraftButton = document.getElementById("saveDraftBtn");

    if (saveDraftButton) {
      saveDraftButton.addEventListener("click", () => {
        saveDraftSnapshot();
      });
    }

    const verificationButton =
      document.getElementById("requestVerificationBtn");

    if (verificationButton) {
      verificationButton.addEventListener(
        "click",
        requestSnapshotVerification
      );
    }

    const viewButton = document.getElementById("viewProfileBtn");

    if (viewButton) {
      viewButton.addEventListener("click", event => {
        const snapshotId =
          val("snapshotId") || getActiveSnapshotId();

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
          `athlete-dashboard.html?snapshot_id=` +
          encodeURIComponent(snapshotId) +
          "&from=athlete-record-intake";
      });
    }
  }

  /* ======================================================
     TRANSACTION BUTTON CONTROL
  ====================================================== */

  function setTransactionButtonsDisabled(disabled) {
    [
      "submitSnapshotBtn",
      "saveDraftBtn",
      "requestVerificationBtn",
      "addHeadshotBtn",
      "removeHeadshotBtn"
    ].forEach(id => {
      const element = document.getElementById(id);

      if (element) {
        element.disabled = Boolean(disabled);
      }
    });
  }

  /* ======================================================
     SYSTEM MESSAGE
  ====================================================== */

  function setSystemMessage(message, state = "neutral") {
    const element = document.getElementById("systemMessage");

    if (!element) return;

    element.textContent = message || "";
    element.dataset.state = state;

    if (state === "error") {
      element.style.color = "#ff2b1f";
    } else if (state === "warning") {
      element.style.color = "#f4c542";
    } else if (state === "success") {
      element.style.color = "#25d366";
    } else {
      element.style.color = "";
    }
  }

  /* ======================================================
     UI STATE — HEADSHOT
  ====================================================== */

  function setHeadshotUiState(state, detail = "") {
    const uploadBox = document.getElementById("headshotUploadBox");

    if (uploadBox) {
      uploadBox.dataset.headshotState = state;

      uploadBox.classList.remove(
        "ready",
        "error",
        "uploading",
        "verified"
      );
    }

    switch (state) {
      case HEADSHOT_UI_STATE.SELECTED:
        uploadBox?.classList.add("ready");

        setText("mediaStatusHeadshot", "Selected");
        setText("mediaStatusCard", "Pending Upload");
        setText("headshotUploadText", "Headshot Selected");
        setText(
          "headshotUploadHint",
          detail || "Ready for verified upload"
        );
        break;

      case HEADSHOT_UI_STATE.VALIDATING:
        uploadBox?.classList.add("uploading");

        setText("mediaStatusHeadshot", "Validating");
        setText("mediaStatusCard", "Pending");
        setText("headshotUploadText", "Validating Headshot");
        setText(
          "headshotUploadHint",
          detail || "Checking file contract"
        );
        break;

      case HEADSHOT_UI_STATE.UPLOADING:
        uploadBox?.classList.add("uploading");

        setText("mediaStatusHeadshot", "Uploading");
        setText("mediaStatusCard", "Pending");
        setText("headshotUploadText", "Uploading Headshot");
        setText(
          "headshotUploadHint",
          detail || "Uploading to canonical storage"
        );
        break;

      case HEADSHOT_UI_STATE.VERIFYING:
        uploadBox?.classList.add("uploading");

        setText("mediaStatusHeadshot", "Verifying");
        setText("mediaStatusCard", "Pending");
        setText("headshotUploadText", "Verifying Upload");
        setText(
          "headshotUploadHint",
          detail || "Confirming storage object"
        );
        break;

      case HEADSHOT_UI_STATE.PERSISTING:
        uploadBox?.classList.add("uploading");

        setText("mediaStatusHeadshot", "Persisting");
        setText("mediaStatusCard", "Pending");
        setText("headshotUploadText", "Saving Canonical Image");
        setText(
          "headshotUploadHint",
          detail || "Updating athlete source record"
        );
        break;

      case HEADSHOT_UI_STATE.VERIFIED:
        uploadBox?.classList.add("verified", "ready");

        setText("mediaStatusHeadshot", "Verified");
        setText("mediaStatusCard", "Ready");
        setText("headshotUploadText", "Headshot Verified");
        setText(
          "headshotUploadHint",
          detail || "Canonical image persisted"
        );
        break;

      case HEADSHOT_UI_STATE.FAILED:
        uploadBox?.classList.add("error");

        setText("mediaStatusHeadshot", "Failed");
        setText("mediaStatusCard", "Not Ready");
        setText("headshotUploadText", "Headshot Upload Failed");
        setText(
          "headshotUploadHint",
          detail || "Retry is required"
        );
        break;

      case HEADSHOT_UI_STATE.MISSING:
      default:
        setText("mediaStatusHeadshot", "Required");
        setText("mediaStatusCard", "Not Ready");
        setText("headshotUploadText", "PHNX SPORTS MEDIA INGEST");
        setText(
          "headshotUploadHint",
          "Click to upload JPG, PNG, WEBP, HEIC, or HEIF"
        );
        break;
    }
  }

  /* ======================================================
     UI STATE — PHNX MEDIA
  ====================================================== */

  function setPhnxUiState(status, detail = "") {
    setText("statusPhnxMedia", readableStatus(status));

    switch (status) {
      case MEDIA_STATUS.HEADSHOT_PENDING:
        setText("mediaQueueBadge", "Media Handoff Pending");
        setText(
          "mediaStatusRouting",
          detail || "Waiting for verified headshot"
        );
        break;

      case MEDIA_STATUS.HEADSHOT_UPLOADING:
        setText("mediaQueueBadge", "Headshot Uploading");
        setText(
          "mediaStatusRouting",
          detail || "Handoff not yet ready"
        );
        break;

      case MEDIA_STATUS.HEADSHOT_VERIFIED:
        setText("mediaQueueBadge", "Headshot Verified");
        setText(
          "mediaStatusRouting",
          detail || "Building media handoff"
        );
        break;

      case MEDIA_STATUS.HANDOFF_READY:
        setText("mediaQueueBadge", "Media Handoff Ready");
        setText(
          "mediaStatusRouting",
          detail || "Packet persisted"
        );
        break;

      case MEDIA_STATUS.HANDOFF_QUEUED:
        setText("mediaQueueBadge", "PHNX Media Queued");
        setText(
          "mediaStatusRouting",
          detail || "Assets captured"
        );
        break;

      case MEDIA_STATUS.HANDOFF_QUEUE_FAILED:
        setText("mediaQueueBadge", "Media Retry Pending");
        setText(
          "mediaStatusRouting",
          detail || "Queue failed — packet preserved"
        );
        break;

      case MEDIA_STATUS.NOT_READY:
      default:
        setText("statusPhnxMedia", "Not Ready");
        setText("mediaQueueBadge", "Media Queue Pending");
        setText(
          "mediaStatusRouting",
          detail || "Waiting for required media"
        );
        break;
    }
  } 
/* ======================================================
     FORM ROW CONSTRUCTION
  ====================================================== */

  async function buildSnapshotRow(status) {
    const form = document.getElementById("snapshotForm");

    if (!form) {
      throw new Error("snapshotForm was not found.");
    }

    const formData = new FormData(form);

    const sourceClaims = buildSourceClaimsPayload(formData);
    const sportMetrics = buildSportMetricPayload(formData);

    const firstName = clean(formData.get("firstName"));
    const lastName = clean(formData.get("lastName"));

    if (!firstName || !lastName) {
      throw new Error(
        "Athlete first name and last name are required."
      );
    }

    const primarySport = clean(formData.get("primarySport"));

    if (!primarySport) {
      throw new Error("Primary sport is required.");
    }

    let athleteId = clean(val("athleteId"));
    let snapshotId = clean(val("snapshotId"));

    if (currentIntakeMode.mode === "edit") {
      athleteId =
        athleteId ||
        getActiveAthleteId();

      snapshotId =
        snapshotId ||
        currentIntakeMode.snapshot_id ||
        getActiveSnapshotId();
    } else {
      athleteId = athleteId || generateAthleteId();
      snapshotId = snapshotId || generateSnapshotId();
    }

    if (!athleteId) {
      throw new Error("Unable to initialize athlete_id.");
    }

    if (!snapshotId) {
      throw new Error("Unable to initialize snapshot_id.");
    }

    const submittedAt =
      status === "draft"
        ? null
        : nowISO();

    const mediaStatus =
      selectedHeadshotFile || val("headshotUrl")
        ? MEDIA_STATUS.HEADSHOT_PENDING
        : MEDIA_STATUS.NOT_READY;

    const row = {
      snapshot_id: snapshotId,
      athlete_id: athleteId,

      snapshot_status: status,
      source_record_status:
        status === "draft"
          ? "draft"
          : "submitted",

      verification_status:
        status === "draft"
          ? "pending"
          : "UNVERIFIED",

      score_status: "not_issued",

      first_name: firstName,
      last_name: lastName,
      athlete_display_name:
        `${firstName} ${lastName}`.trim(),

      graduation_class:
        clean(formData.get("graduationClass")),

      city_state:
        clean(formData.get("cityState")),

      school_program:
        clean(formData.get("schoolProgram")),

      primary_sport:
        primarySport,

      height:
        clean(formData.get("height")),

      weight:
        clean(formData.get("weight")),

      primary_position:
        clean(formData.get("primaryPosition")),

      secondary_position:
        clean(formData.get("secondaryPosition")),

      dominant_hand_foot:
        clean(formData.get("dominantHandFoot")),

      jersey_number:
        clean(formData.get("jerseyNumber")),

      current_gpa:
        clean(formData.get("currentGpa")),

      ncaa_eligibility_status:
        clean(formData.get("ncaaEligibilityStatus")),

      transcript_available:
        clean(formData.get("transcriptAvailable")),

      counselor_contact_available:
        clean(formData.get("counselorContactAvailable")),

      academic_notes:
        clean(formData.get("academicNotes")),

      highlight_url:
        clean(formData.get("highlightUrl")),

      game_film_url:
        clean(formData.get("gameFilmUrl")),

      social_profile_url:
        clean(formData.get("socialProfileUrl")),

      recruiting_profile_url:
        clean(formData.get("recruitingProfileUrl")),

      guardian_name:
        clean(formData.get("guardianName")),

      guardian_email:
        clean(formData.get("guardianEmail")),

      guardian_phone:
        clean(formData.get("guardianPhone")),

      coach_name:
        clean(formData.get("coachName")),

      coach_email:
        clean(formData.get("coachEmail")),

      verification_permission:
        clean(formData.get("verificationPermission")),

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
        clean(val("headshotUrl")),

      headshot_public_url:
        clean(val("headshotUrl")),

      headshot_path:
        clean(val("headshotPath")),

      headshot_filename:
        clean(val("headshotFileName")),

      media_status:
        mediaStatus,

      phnx_media_handoff_status:
        MEDIA_STATUS.NOT_READY,

      raw_payload: {
        ...Object.fromEntries(formData.entries()),

        sport_metric_payload:
          sportMetrics,

        source_claims_payload:
          sourceClaims,

        intake_engine_version:
          "2.0",

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

    setVal("athleteId", athleteId);
    setVal("snapshotId", snapshotId);

    setVal(
      "sportMetricPayload",
      JSON.stringify(sportMetrics)
    );

    setVal(
      "sourceClaimsPayload",
      JSON.stringify(sourceClaims)
    );

    return row;
  }

  /* ======================================================
     SOURCE PROVENANCE PAYLOAD
  ====================================================== */

  function buildSourceClaimsPayload(formData) {
    return {
      source_origin:
        clean(formData.get("sourceOrigin")),

      submission_source:
        clean(formData.get("submissionSource")) ||
        "snapshot-intake.html",

      submitted_by_role:
        clean(formData.get("submittedByRole")),

      submitted_by_name:
        clean(formData.get("submittedByName")),

      submitted_by_email:
        clean(formData.get("submittedByEmail")),

      submitted_by_user_id:
        null,

      submitted_by_professional_id:
        clean(formData.get("phnxCertifiedId")) ||
        null,

      phnx_certified_id:
        clean(formData.get("phnxCertifiedId")),

      phnx_certification_status:
        clean(formData.get("phnxCertificationStatus")),

      trust_classification:
        clean(formData.get("trustClassification")) ||
        "SELF_REPORTED",

      source_organization:
        clean(formData.get("sourceOrganization")),

      captured_at:
        nowISO()
    };
  }

  /* ======================================================
     SPORT METRIC PAYLOAD
  ====================================================== */

  function buildSportMetricPayload(formData) {
    const sport =
      clean(formData.get("primarySport")).toLowerCase();

    const universal = {
      sport,

      primaryPosition:
        clean(formData.get("primaryPosition")),

      secondaryPosition:
        clean(formData.get("secondaryPosition")),

      height:
        clean(formData.get("height")),

      weight:
        clean(formData.get("weight")),

      dominantHandFoot:
        clean(formData.get("dominantHandFoot")),

      jerseyNumber:
        clean(formData.get("jerseyNumber"))
    };

    if (sport === "football") {
      return {
        ...universal,

        footballDash40:
          clean(formData.get("footballDash40")),

        footballVerticalJump:
          clean(formData.get("footballVerticalJump")),

        footballShuttle:
          clean(formData.get("footballShuttle")),

        footballBroadJump:
          clean(formData.get("footballBroadJump")),

        footballStrengthMarker:
          clean(formData.get("footballStrengthMarker")),

        footballVerifiedEventSource:
          clean(formData.get("footballVerifiedEventSource")),

        footballNotes:
          clean(formData.get("footballNotes"))
      };
    }

    if (sport === "basketball") {
      return {
        ...universal,

        basketballWingspan:
          clean(formData.get("basketballWingspan")),

        basketballVerticalJump:
          clean(formData.get("basketballVerticalJump")),

        basketballLaneAgility:
          clean(formData.get("basketballLaneAgility")),

        basketballCourtSprint:
          clean(formData.get("basketballCourtSprint")),

        basketballSkillMarker:
          clean(formData.get("basketballSkillMarker")),

        basketballVerifiedEventSource:
          clean(
            formData.get("basketballVerifiedEventSource")
          ),

        basketballNotes:
          clean(formData.get("basketballNotes"))
      };
    }

    if (sport === "baseball") {
      return {
        ...universal,

        baseballDash60:
          clean(formData.get("baseballDash60")),

        baseballExitVelocity:
          clean(formData.get("baseballExitVelocity")),

        baseballThrowingVelocity:
          clean(formData.get("baseballThrowingVelocity")),

        baseballPopTime:
          clean(formData.get("baseballPopTime")),

        baseballBatThrowSide:
          clean(formData.get("baseballBatThrowSide")),

        baseballVerifiedEventSource:
          clean(formData.get("baseballVerifiedEventSource")),

        baseballNotes:
          clean(formData.get("baseballNotes"))
      };
    }

    if (sport === "track") {
      return {
        ...universal,

        trackPrimaryEvent:
          clean(formData.get("trackPrimaryEvent")),

        trackBestMark:
          clean(formData.get("trackBestMark")),

        trackTimingType:
          clean(formData.get("trackTimingType")),

        trackMeetSource:
          clean(formData.get("trackMeetSource")),

        trackSplitData:
          clean(formData.get("trackSplitData")),

        trackVerifiedEventSource:
          clean(formData.get("trackVerifiedEventSource")),

        trackNotes:
          clean(formData.get("trackNotes"))
      };
    }

    return universal;
  }

  /* ======================================================
     ATHLETE IDENTITY PERSISTENCE
  ====================================================== */

  async function ensureAthleteExists(snapshotRow) {
    const db = getDb();

    if (!snapshotRow?.athlete_id) {
      throw new Error(
        "athlete_id is required before athlete identity persistence."
      );
    }

    const athletePayload = filterAthleteSchema({
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

    const existingResult = await db
      .from(ATHLETE_TABLE)
      .select("*")
      .eq("athlete_id", snapshotRow.athlete_id)
      .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
      const beforeRecord = existingResult.data;

      const updatePayload = {
        ...athletePayload,
        athlete_id:
          beforeRecord.athlete_id,
        updated_at:
          nowISO()
      };

      const updatedResult = await db
        .from(ATHLETE_TABLE)
        .update(updatePayload)
        .eq("athlete_id", beforeRecord.athlete_id)
        .select("*")
        .single();

      if (updatedResult.error) {
        throw updatedResult.error;
      }

      await writeSnapshotAuditReceipt({
        action:
          "ATHLETE_IDENTITY_UPDATED",

        snapshot_id:
          snapshotRow.snapshot_id,

        athlete_id:
          updatedResult.data.athlete_id,

        before_record:
          beforeRecord,

        after_record:
          updatedResult.data
      });

      return {
        action:
          "updated",

        athlete:
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

    const createdResult = await db
      .from(ATHLETE_TABLE)
      .insert(createPayload)
      .select("*")
      .single();

    if (createdResult.error) {
      throw createdResult.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        "ATHLETE_IDENTITY_CREATED",

      snapshot_id:
        snapshotRow.snapshot_id,

      athlete_id:
        createdResult.data.athlete_id,

      before_record:
        null,

      after_record:
        createdResult.data
    });

    return {
      action:
        "created",

      athlete:
        createdResult.data
    };
  }

  /* ======================================================
     SNAPSHOT INSERT / UPDATE
  ====================================================== */

  async function insertOrUpdateSnapshot(snapshotRow) {
    const db = getDb();

    const cleanRow =
      filterSnapshotSchema(snapshotRow || {});

    if (!cleanRow.snapshot_id) {
      throw new Error(
        "snapshot_id is required before snapshot persistence."
      );
    }

    if (!cleanRow.athlete_id) {
      throw new Error(
        "athlete_id is required before snapshot persistence."
      );
    }

    const existingResult = await db
      .from(SNAPSHOT_TABLE)
      .select("*")
      .eq("snapshot_id", cleanRow.snapshot_id)
      .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
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

      const updatedResult = await db
        .from(SNAPSHOT_TABLE)
        .update(updatePayload)
        .eq("snapshot_id", beforeRecord.snapshot_id)
        .select("*")
        .single();

      if (updatedResult.error) {
        throw updatedResult.error;
      }

      await writeSnapshotAuditReceipt({
        action:
          "SNAPSHOT_SOURCE_UPDATED",

        snapshot_id:
          updatedResult.data.snapshot_id,

        athlete_id:
          updatedResult.data.athlete_id,

        before_record:
          beforeRecord,

        after_record:
          updatedResult.data
      });

      return {
        action:
          "updated",

        snapshot:
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

    const createdResult = await db
      .from(SNAPSHOT_TABLE)
      .insert(createPayload)
      .select("*")
      .single();

    if (createdResult.error) {
      throw createdResult.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        "SNAPSHOT_SOURCE_CREATED",

      snapshot_id:
        createdResult.data.snapshot_id,

      athlete_id:
        createdResult.data.athlete_id,

      before_record:
        null,

      after_record:
        createdResult.data
    });

    return {
      action:
        "created",

      snapshot:
        createdResult.data
    };
  }

  /* ======================================================
     ATHLETE SCHEMA FILTER
  ====================================================== */

  function filterAthleteSchema(row) {
    const allowed = new Set([
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

    Object.entries(row || {}).forEach(([key, value]) => {
      if (allowed.has(key)) {
        filtered[key] = value;
      }
    });

    return filtered;
  }

  /* ======================================================
     SNAPSHOT SCHEMA FILTER
  ====================================================== */

  function filterSnapshotSchema(row) {
    const allowed = new Set([
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

    Object.entries(row || {}).forEach(([key, value]) => {
      if (allowed.has(key)) {
        filtered[key] = value;
      }
    });

    return filtered;
  } 
 /* ======================================================
     HEADSHOT SELECTION
  ====================================================== */

  async function handleHeadshotSelection(event) {
    const file =
      event?.target?.files?.[0] ||
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
        validateHeadshotFile(file);

      selectedHeadshotFile =
        file;

      releaseSelectedPreviewUrl();

      selectedHeadshotPreviewUrl =
        URL.createObjectURL(file);

      const preview =
        document.getElementById("headshotPreview");

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
        document.getElementById("removeHeadshotBtn");

      if (removeButton) {
        removeButton.style.display =
          "flex";
      }

      setHeadshotUiState(
        HEADSHOT_UI_STATE.SELECTED,
        `${file.name} · ${formatBytes(file.size)}`
      );

      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_PENDING,
        "Selected — upload required"
      );

      updateMediaStatus();

      return validation;
    } catch (error) {
      selectedHeadshotFile = null;

      const fileInput =
        document.getElementById("athleteHeadshotUpload");

      if (fileInput) {
        fileInput.value = "";
      }

      setHeadshotUiState(
        HEADSHOT_UI_STATE.FAILED,
        error?.message || "Invalid headshot"
      );

      setPhnxUiState(
        MEDIA_STATUS.NOT_READY,
        "Valid headshot required"
      );

      setSystemMessage(
        error?.message || "Headshot validation failed.",
        "error"
      );

      throw error;
    }
  }

  function removeSelectedHeadshot() {
    selectedHeadshotFile = null;

    releaseSelectedPreviewUrl();

    const fileInput =
      document.getElementById("athleteHeadshotUpload");

    if (fileInput) {
      fileInput.value = "";
    }

    setVal("headshotUrl", "");
    setVal("headshotPath", "");
    setVal("headshotFileName", "");

    const preview =
      document.getElementById("headshotPreview");

    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }

    const removeButton =
      document.getElementById("removeHeadshotBtn");

    if (removeButton) {
      removeButton.style.display = "none";
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
    if (selectedHeadshotPreviewUrl) {
      try {
        URL.revokeObjectURL(
          selectedHeadshotPreviewUrl
        );
      } catch (_error) {
        // No action required.
      }
    }

    selectedHeadshotPreviewUrl = "";
  }

  /* ======================================================
     HEADSHOT VALIDATION
  ====================================================== */

  function validateHeadshotFile(file) {
    if (!(file instanceof File)) {
      throw new Error(
        "A valid athlete image file is required."
      );
    }

    if (!file.size || file.size <= 0) {
      throw new Error(
        "The selected headshot is empty."
      );
    }

    if (file.size > HEADSHOT_MAX_BYTES) {
      throw new Error(
        `Headshot exceeds the ${formatBytes(
          HEADSHOT_MAX_BYTES
        )} maximum.`
      );
    }

    const extension =
      getFileExtension(file.name);

    if (!HEADSHOT_ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error(
        `Unsupported headshot extension: .${
          extension || "unknown"
        }.`
      );
    }

    const normalizedMimeType =
      normalizeMimeType(file.type, extension);

    if (
      !HEADSHOT_ALLOWED_MIME_TYPES.has(
        normalizedMimeType
      )
    ) {
      throw new Error(
        `Unsupported headshot MIME type: ${
          normalizedMimeType || "unknown"
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

  function normalizeMimeType(type, extension) {
    const cleanType =
      clean(type).toLowerCase();

    if (cleanType) {
      return cleanType;
    }

    const map = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif"
    };

    return map[extension] || "";
  }

  function getFileExtension(filename) {
    const value =
      clean(filename).toLowerCase();

    const parts =
      value.split(".");

    if (parts.length < 2) {
      return "";
    }

    return parts.pop();
  }

  function sanitizeFilename(filename) {
    return clean(filename)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 180);
  }

  function buildCanonicalHeadshotPath({
    athleteId,
    snapshotId,
    extension
  }) {
    if (!athleteId || !snapshotId || !extension) {
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
     NATIVE HEADSHOT UPLOAD
  ====================================================== */

  async function uploadAndVerifyHeadshot({
    snapshot,
    required
  }) {
    const existingVerification =
      verifyCanonicalHeadshotContract(snapshot, {
        throwOnFailure: false
      });

    if (!selectedHeadshotFile) {
      if (existingVerification.ok) {
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
        const error = new Error(
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
      clean(snapshot?.athlete_id);

    const snapshotId =
      clean(snapshot?.snapshot_id);

    if (!athleteId || !snapshotId) {
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

      before_record:
        {
          headshot_path:
            snapshot.headshot_path || null,

          headshot_public_url:
            snapshot.headshot_public_url ||
            snapshot.headshot_url ||
            null
        },

      after_record:
        {
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
        }
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

      if (!objectVerification.ok) {
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
        clean(snapshot.submitted_by_name) ||
        clean(snapshot.submitted_by_email) ||
        clean(snapshot.submitted_by_role) ||
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
          uploadResult.data || null,

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

      const persistedSnapshot =
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
        await readBackSnapshot(snapshotId);

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
        verifiedSnapshot.headshot_public_url ||
        verifiedSnapshot.headshot_url
      );

      setVal(
        "headshotPath",
        verifiedSnapshot.headshot_path
      );

      setVal(
        "headshotFileName",
        verifiedSnapshot.headshot_filename
      );

      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFIED,
        verifiedSnapshot.headshot_filename
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

        after_record:
          {
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
          }
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

        persisted_snapshot:
          persistedSnapshot,

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

      await writeSnapshotAuditReceipt({
        action:
          "HEADSHOT_UPLOAD_FAILED",

        snapshot_id:
          snapshotId,

        athlete_id:
          athleteId,

        before_record:
          snapshot,

        after_record:
          {
            error:
              serializeError(error),

            failed_at:
              nowISO()
          }
      });

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
    const db = getDb();

    let lastError = null;

    for (
      let attempt = 1;
      attempt <= HEADSHOT_UPLOAD_ATTEMPTS;
      attempt += 1
    ) {
      const uploadResult =
        await db.storage
          .from(HEADSHOT_BUCKET)
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

      if (!uploadResult.error) {
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
        attempt >= HEADSHOT_UPLOAD_ATTEMPTS ||
        !isTransientStorageError(lastError)
      ) {
        break;
      }

      await sleep(
        HEADSHOT_RETRY_DELAYS[
          attempt - 1
        ] || 3000
      );
    }

    const error = new Error(
      lastError?.message ||
      "Headshot upload failed."
    );

    error.original_error =
      lastError;

    throw error;
  }

  function isTransientStorageError(error) {
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
    ].some(fragment =>
      message.includes(fragment)
    );
  }

  async function verifyStorageObject({
    storagePath
  }) {
    const db = getDb();

    const pathParts =
      storagePath.split("/");

    const filename =
      pathParts.pop();

    const folder =
      pathParts.join("/");

    const listResult =
      await db.storage
        .from(HEADSHOT_BUCKET)
        .list(
          folder,
          {
            limit:
              100,

            search:
              filename
          }
        );

    if (listResult.error) {
      throw listResult.error;
    }

    const match =
      Array.isArray(listResult.data)
        ? listResult.data.find(
            item =>
              item?.name === filename
          )
        : null;

    return {
      ok:
        Boolean(match),

      filename,

      folder,

      object:
        match || null,

      verified_at:
        nowISO()
    };
  }

  function getPublicHeadshotUrl(storagePath) {
    const db = getDb();

    const result =
      db.storage
        .from(HEADSHOT_BUCKET)
        .getPublicUrl(storagePath);

    return clean(
      result?.data?.publicUrl ||
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
    const db = getDb();

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
        MEDIA_STATUS.HEADSHOT_VERIFIED,

      phnx_media_handoff_status:
        MEDIA_STATUS.NOT_READY,

      updated_at:
        nowISO(),

      last_source_update_at:
        nowISO()
    };

    const updateResult =
      await db
        .from(SNAPSHOT_TABLE)
        .update(updatePayload)
        .eq("snapshot_id", snapshotId)
        .select("*")
        .single();

    if (updateResult.error) {
      throw updateResult.error;
    }

    return updateResult.data;
  }

  async function readBackSnapshot(snapshotId) {
    const db = getDb();

    const result =
      await db
        .from(SNAPSHOT_TABLE)
        .select("*")
        .eq("snapshot_id", snapshotId)
        .single();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error(
        "Snapshot read-back returned no record."
      );
    }

    return result.data;
  }

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
      clean(snapshot?.headshot_bucket);

    const path =
      clean(snapshot?.headshot_path);

    const filename =
      clean(snapshot?.headshot_filename);

    const receipt =
      safeObject(snapshot?.headshot_receipt);

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
      !snapshot?.headshot_uploaded_at
    ) {
      failures.push(
        "headshot_uploaded_at"
      );
    }

    if (
      !receipt ||
      Object.keys(receipt).length === 0
    ) {
      failures.push(
        "headshot_receipt"
      );
    }

    if (
      receipt?.verified !== true
    ) {
      failures.push(
        "headshot_receipt.verified"
      );
    }

    if (
      snapshot?.media_status !==
      MEDIA_STATUS.HEADSHOT_VERIFIED &&
      snapshot?.media_status !==
      MEDIA_STATUS.HANDOFF_READY &&
      snapshot?.media_status !==
      MEDIA_STATUS.HANDOFF_QUEUED &&
      snapshot?.media_status !==
      MEDIA_STATUS.HANDOFF_QUEUE_FAILED
    ) {
      failures.push(
        "media_status"
      );
    }

    if (expected) {
      if (
        expected.public_url &&
        publicUrl !== expected.public_url
      ) {
        failures.push(
          "headshot_public_url_mismatch"
        );
      }

      if (
        expected.bucket &&
        bucket !== expected.bucket
      ) {
        failures.push(
          "headshot_bucket_mismatch"
        );
      }

      if (
        expected.path &&
        path !== expected.path
      ) {
        failures.push(
          "headshot_path_mismatch"
        );
      }

      if (
        expected.filename &&
        filename !== expected.filename
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
      const error = new Error(
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

  async function readImageDimensions(file) {
    try {
      if (
        typeof createImageBitmap ===
        "function"
      ) {
        const bitmap =
          await createImageBitmap(file);

        const dimensions = {
          width:
            bitmap.width || null,

          height:
            bitmap.height || null
        };

        bitmap.close?.();

        return dimensions;
      }
    } catch (_error) {
      // Some browsers cannot decode HEIC/HEIF locally.
    }

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
        verifiedSnapshot?.guardian_email
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

    const db = getDb();

    const existingResult =
      await db
        .from(PARENT_APPROVAL_TABLE)
        .select("*")
        .eq(
          "snapshot_id",
          verifiedSnapshot.snapshot_id
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
      throw existingResult.error;
    }

    const basePayload = {
      snapshot_id:
        verifiedSnapshot.snapshot_id,

      athlete_id:
        verifiedSnapshot.athlete_id,

      athlete_name:
        verifiedSnapshot.athlete_display_name ||
        `${verifiedSnapshot.first_name || ""} ${
          verifiedSnapshot.last_name || ""
        }`.trim(),

      guardian_name:
        clean(
          verifiedSnapshot.guardian_name
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
        existingResult.data?.status ||
        "pending",

      requested_at:
        existingResult.data?.requested_at ||
        nowISO(),

      updated_at:
        nowISO()
    };

    if (existingResult.data) {
      const updatedResult =
        await db
          .from(PARENT_APPROVAL_TABLE)
          .update(basePayload)
          .eq(
            "id",
            existingResult.data.id
          )
          .select("*")
          .single();

      if (updatedResult.error) {
        throw updatedResult.error;
      }

      await writeSnapshotAuditReceipt({
        action:
          "PARENT_APPROVAL_REQUEST_REUSED",

        snapshot_id:
          verifiedSnapshot.snapshot_id,

        athlete_id:
          verifiedSnapshot.athlete_id,

        before_record:
          existingResult.data,

        after_record:
          updatedResult.data
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
        .from(PARENT_APPROVAL_TABLE)
        .insert(createPayload)
        .select("*")
        .single();

    if (createdResult.error) {
      throw createdResult.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        "PARENT_APPROVAL_REQUEST_CREATED",

      snapshot_id:
        verifiedSnapshot.snapshot_id,

      athlete_id:
        verifiedSnapshot.athlete_id,

      before_record:
        null,

      after_record:
        createdResult.data
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

  function normalizeApprovalStatus(approval) {
    return clean(
      approval?.status ||
      approval?.approval_status ||
      approval?.request_status ||
      "pending"
    ).toLowerCase();
  }

  /* ======================================================
     HANDOFF IDENTITY
  ====================================================== */

  async function resolveHandoffIdentity(
    verifiedSnapshot
  ) {
    const db = getDb();

    const athleteId =
      verifiedSnapshot.athlete_id;

    const snapshotId =
      verifiedSnapshot.snapshot_id;

    const idempotencyKey =
      `PHNX_MEDIA:${athleteId}:${snapshotId}:V1`;

    const existingResult =
      await db
        .from(PHNX_HANDOFF_TABLE)
        .select("*")
        .eq(
          "idempotency_key",
          idempotencyKey
        )
        .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
      const existingPayload =
        safeObject(
          existingResult.data.payload
        );

      return {
        existing:
          true,

        handoff_id:
          existingResult.data.handoff_id,

        correlation_id:
          existingResult.data.correlation_id ||
          existingPayload.correlation_id ||
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
     COMPLETE PHNX MEDIA HANDOFF
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
        snapshot.source_claims_payload
      );

    const sportMetrics =
      safeObject(
        snapshot.sport_metric_payload
      );

    const approval =
      parentApprovalResult?.approval ||
      null;

    const approvalStatus =
      normalizeApprovalStatus(
        approval
      );

    const assets =
      buildCanonicalAssetManifest({
        snapshot,
        sourceClaims
      });

    const hasHeadshot =
      assets.some(
        asset =>
          asset.asset_key ===
          "HEADSHOT_PRIMARY"
      );

    const hasHighlight =
      assets.some(
        asset =>
          asset.asset_key ===
          "HIGHLIGHT_REEL_PRIMARY"
      );

    const hasGameFilm =
      assets.some(
        asset =>
          asset.asset_key ===
          "GAME_FILM_PRIMARY"
      );

    const hasSocialProfile =
      assets.some(
        asset =>
          asset.asset_key ===
          "SOCIAL_PROFILE_PRIMARY"
      );

    const hasRecruitingProfile =
      assets.some(
        asset =>
          asset.asset_key ===
          "RECRUITING_PROFILE_PRIMARY"
      );

    const permissions =
      buildPermissionContract({
        snapshot,
        approval,
        approvalStatus
      });

    const now =
      nowISO();

    const packet = {
      contract_name:
        PHNX_CONTRACT_NAME,

      contract_version:
        PHNX_CONTRACT_VERSION,

      handoff_id:
        handoffIdentity.handoff_id,

      idempotency_key:
        handoffIdentity.idempotency_key,

      correlation_id:
        handoffIdentity.correlation_id,

      source_system:
        PHNX_SOURCE_SYSTEM,

      source_stream:
        PHNX_SOURCE_STREAM,

      target_system:
        PHNX_TARGET_SYSTEM,

      handoff_status:
        MEDIA_STATUS.HANDOFF_READY,

      created_at:
        handoffIdentity.row?.created_at ||
        now,

      updated_at:
        now,

      athlete: {
        athlete_id:
          snapshot.athlete_id,

        snapshot_id:
          snapshot.snapshot_id,

        first_name:
          snapshot.first_name || "",

        last_name:
          snapshot.last_name || "",

        display_name:
          snapshot.athlete_display_name ||
          `${snapshot.first_name || ""} ${
            snapshot.last_name || ""
          }`.trim(),

        graduation_class:
          snapshot.graduation_class || "",

        city_state:
          snapshot.city_state || "",

        school_program:
          snapshot.school_program || "",

        primary_sport:
          snapshot.primary_sport || "",

        primary_position:
          snapshot.primary_position || "",

        secondary_position:
          snapshot.secondary_position || "",

        jersey_number:
          snapshot.jersey_number || "",

        height:
          snapshot.height || "",

        weight:
          snapshot.weight || "",

        dominant_hand_foot:
          snapshot.dominant_hand_foot || ""
      },

      snapshot: {
        snapshot_status:
          snapshot.snapshot_status || "",

        source_record_status:
          snapshot.source_record_status || "",

        verification_status:
          snapshot.verification_status || "UNVERIFIED",

        trust_classification:
          snapshot.trust_classification ||
          sourceClaims.trust_classification ||
          "SELF_REPORTED",

        submitted_at:
          snapshot.submitted_at || null,

        last_source_update_at:
          snapshot.last_source_update_at ||
          snapshot.updated_at ||
          null,

        academic_context: {
          current_gpa:
            snapshot.current_gpa || "",

          ncaa_eligibility_status:
            snapshot.ncaa_eligibility_status || ""
        },

        sport_metric_payload:
          sportMetrics,

        source_claims_payload:
          sourceClaims
      },

      source_provenance: {
        source_origin:
          snapshot.source_origin ||
          sourceClaims.source_origin ||
          "",

        submission_source:
          snapshot.submission_source ||
          sourceClaims.submission_source ||
          "snapshot-intake.html",

        submitted_by_role:
          snapshot.submitted_by_role ||
          sourceClaims.submitted_by_role ||
          "",

        submitted_by_name:
          snapshot.submitted_by_name ||
          sourceClaims.submitted_by_name ||
          "",

        submitted_by_email:
          snapshot.submitted_by_email ||
          sourceClaims.submitted_by_email ||
          "",

        submitted_by_user_id:
          snapshot.submitted_by_user_id ||
          sourceClaims.submitted_by_user_id ||
          null,

        submitted_by_professional_id:
          snapshot.submitted_by_professional_id ||
          sourceClaims.submitted_by_professional_id ||
          null,

        phnx_certified_id:
          snapshot.phnx_certified_id ||
          sourceClaims.phnx_certified_id ||
          "",

        phnx_certification_status:
          snapshot.phnx_certification_status ||
          sourceClaims.phnx_certification_status ||
          "",

        trust_classification:
          snapshot.trust_classification ||
          sourceClaims.trust_classification ||
          "SELF_REPORTED",

        source_organization:
          snapshot.source_organization ||
          sourceClaims.source_organization ||
          "",

        captured_at:
          snapshot.submission_timestamp ||
          sourceClaims.captured_at ||
          snapshot.created_at ||
          now
      },

      permissions,

      assets,

      production_request: {
        production_profile:
          "PHNX_ATHLETE_STANDARD_V1",

        requested_outputs:
          [
            "PLAYER_CARD",
            "HEADSHOT_PACKAGE",
            "HIGHLIGHT_FILM_PACKAGE",
            "YOUTUBE_LONG_FORM",
            "YOUTUBE_SHORT"
          ],

        available_inputs: {
          headshot:
            hasHeadshot,

          highlight_reel:
            hasHighlight,

          game_film:
            hasGameFilm,

          social_profile:
            hasSocialProfile,

          recruiting_profile:
            hasRecruitingProfile
        },

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

        requested_player_card_fields: [
          "display_name",
          "sport",
          "primary_position",
          "graduation_class",
          "school_program",
          "city_state",
          "jersey_number"
        ],

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
          buildPlaylistHints(snapshot),

        title_seed: {
          athlete_name:
            snapshot.athlete_display_name ||
            `${snapshot.first_name || ""} ${
              snapshot.last_name || ""
            }`.trim(),

          position:
            snapshot.primary_position || "",

          sport:
            snapshot.primary_sport || "",

          graduation_class:
            snapshot.graduation_class || "",

          school_program:
            snapshot.school_program || ""
        },

        description_seed: {
          athlete_record_url:
            `player-profile.html?snapshot_id=${encodeURIComponent(
              snapshot.snapshot_id
            )}`,

          media_room_url:
            `phnx-sports-media.html?snapshot_id=${encodeURIComponent(
              snapshot.snapshot_id
            )}`
        },

        thumbnail_required:
          true,

        captions_required:
          true,

        child_directed_status:
          "REQUIRES_REVIEW",

        publish_gate_status:
          permissions.public_release_blocked
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
          snapshot.athlete_id,

        snapshot_id:
          snapshot.snapshot_id,

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
          permissions.public_release_blocked
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
          handoffIdentity.idempotency_key,

        receipt_required:
          true,

        callback_required:
          true,

        callback_context: {
          athlete_id:
            snapshot.athlete_id,

          snapshot_id:
            snapshot.snapshot_id,

          handoff_id:
            handoffIdentity.handoff_id,

          correlation_id:
            handoffIdentity.correlation_id
        }
      },

      verification: {
        athlete_record_verified:
          Boolean(snapshot.athlete_id),

        snapshot_record_verified:
          Boolean(snapshot.snapshot_id),

        headshot_storage_verified:
          Boolean(
            snapshot.headshot_path &&
            snapshot.headshot_bucket
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

        provenance_present:
          Boolean(
            snapshot.source_origin ||
            sourceClaims.source_origin
          ),

        permission_context_present:
          true,

        handoff_ready:
          hasHeadshot,

        queue_eligible:
          hasHeadshot,

        verified_at:
          now,

        verification_receipt: {
          receipt_type:
            "PHNX_MEDIA_HANDOFF_VERIFICATION",

          contract_version:
            PHNX_CONTRACT_VERSION,

          snapshot_id:
            snapshot.snapshot_id,

          athlete_id:
            snapshot.athlete_id,

          headshot_receipt:
            snapshot.headshot_receipt ||
            null,

          verified_at:
            now
        }
      }
    };

    if (!packet.verification.handoff_ready) {
      packet.handoff_status =
        MEDIA_STATUS.NOT_READY;
    }

    return packet;
  }

  /* ======================================================
     ASSET MANIFEST
  ====================================================== */

  function buildCanonicalAssetManifest({
    snapshot,
    sourceClaims
  }) {
    const assets = [];

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
          snapshot.headshot_receipt
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
          snapshot.headshot_public_url ||
          snapshot.headshot_url,

        bucket:
          snapshot.headshot_bucket,

        storage_path:
          snapshot.headshot_path,

        original_filename:
          snapshot.headshot_filename,

        mime_type:
          receipt.mime_type ||
          "",

        extension:
          receipt.extension ||
          getFileExtension(
            snapshot.headshot_filename
          ),

        size_bytes:
          Number(
            receipt.size_bytes ||
            0
          ),

        checksum:
          receipt.checksum ||
          null,

        width:
          receipt.width ||
          null,

        height:
          receipt.height ||
          null,

        duration_seconds:
          null,

        upload_status:
          "VERIFIED",

        verification_status:
          "VERIFIED",

        uploaded_at:
          snapshot.headshot_uploaded_at ||
          receipt.uploaded_at ||
          null,

        verified_at:
          receipt.verified_at ||
          snapshot.updated_at ||
          null,

        provenance: {
          submitted_by_role:
            snapshot.submitted_by_role ||
            sourceClaims.submitted_by_role ||
            "",

          submitted_by_name:
            snapshot.submitted_by_name ||
            sourceClaims.submitted_by_name ||
            "",

          trust_classification:
            snapshot.trust_classification ||
            sourceClaims.trust_classification ||
            "SELF_REPORTED"
        },

        receipt
      });
    }

    pushExternalAsset(
      assets,
      {
        sourceUrl:
          snapshot.highlight_url,

        assetKey:
          "HIGHLIGHT_REEL_PRIMARY",

        assetType:
          "VIDEO_LINK",

        assetRole:
          "HIGHLIGHT_REEL"
      }
    );

    pushExternalAsset(
      assets,
      {
        sourceUrl:
          snapshot.game_film_url,

        assetKey:
          "GAME_FILM_PRIMARY",

        assetType:
          "VIDEO_LINK",

        assetRole:
          "GAME_FILM"
      }
    );

    pushExternalAsset(
      assets,
      {
        sourceUrl:
          snapshot.social_profile_url,

        assetKey:
          "SOCIAL_PROFILE_PRIMARY",

        assetType:
          "PROFILE_LINK",

        assetRole:
          "SOCIAL_PROFILE"
      }
    );

    pushExternalAsset(
      assets,
      {
        sourceUrl:
          snapshot.recruiting_profile_url,

        assetKey:
          "RECRUITING_PROFILE_PRIMARY",

        assetType:
          "PROFILE_LINK",

        assetRole:
          "RECRUITING_PROFILE"
      }
    );

    return assets;
  }

  function pushExternalAsset(
    assets,
    {
      sourceUrl,
      assetKey,
      assetType,
      assetRole
    }
  ) {
    const url =
      clean(sourceUrl);

    if (!url) {
      return;
    }

    assets.push({
      asset_key:
        assetKey,

      asset_type:
        assetType,

      asset_role:
        assetRole,

      source_kind:
        "EXTERNAL_URL",

      source_url:
        url,

      upload_status:
        "CAPTURED",

      verification_status:
        "PENDING"
    });
  }

  /* ======================================================
     PERMISSION CONTRACT
  ====================================================== */

  function buildPermissionContract({
    snapshot,
    approval,
    approvalStatus
  }) {
    const approved =
      approvalStatus === "approved";

    const profileParticipationAllowed =
      approved &&
      approval?.profile_participation === true;

    const publicVisibilityAllowed =
      approved &&
      approval?.public_visibility === true;

    const mediaExposureAllowed =
      approved &&
      approval?.media_exposure === true;

    const youtubePublicationAllowed =
      approved &&
      (
        approval?.youtube_publication === true ||
        approval?.youtube_publication_allowed === true
      );

    const socialDistributionAllowed =
      approved &&
      (
        approval?.social_distribution === true ||
        approval?.social_distribution_allowed === true
      );

    const blockingReasons = [];

    if (!approved) {
      blockingReasons.push(
        "PARENT_MEDIA_APPROVAL_PENDING"
      );
    }

    if (!mediaExposureAllowed) {
      blockingReasons.push(
        "MEDIA_EXPOSURE_NOT_AUTHORIZED"
      );
    }

    if (!publicVisibilityAllowed) {
      blockingReasons.push(
        "PUBLIC_VISIBILITY_NOT_AUTHORIZED"
      );
    }

    if (!youtubePublicationAllowed) {
      blockingReasons.push(
        "YOUTUBE_PUBLICATION_NOT_AUTHORIZED"
      );
    }

    return {
      athlete_is_minor:
        null,

      guardian_name:
        snapshot.guardian_name || "",

      guardian_email:
        snapshot.guardian_email || "",

      parent_approval_request_id:
        approval?.id ||
        approval?.request_id ||
        null,

      parent_approval_status:
        approvalStatus ||
        "pending",

      profile_participation_allowed:
        profileParticipationAllowed,

      public_visibility_allowed:
        publicVisibilityAllowed,

      media_exposure_allowed:
        mediaExposureAllowed,

      youtube_publication_allowed:
        youtubePublicationAllowed,

      social_distribution_allowed:
        socialDistributionAllowed,

      preparation_allowed:
        true,

      public_release_blocked:
        blockingReasons.length > 0,

      blocking_reasons:
        [...new Set(blockingReasons)],

      verification_permission:
        snapshot.verification_permission ||
        ""
    };
  }

  function buildPlaylistHints(snapshot) {
    const hints = [];

    const sport =
      clean(
        snapshot.primary_sport
      ).toUpperCase();

    const position =
      clean(
        snapshot.primary_position
      ).toUpperCase();

    const classYear =
      clean(
        snapshot.graduation_class
      );

    if (sport) {
      hints.push(sport);
    }

    if (position) {
      hints.push(
        position.endsWith("S")
          ? position
          : `${position}S`
      );
    }

    if (classYear) {
      hints.push(
        `CLASS_OF_${classYear}`
      );
    }

    hints.push(
      "PLAYER_CARDS",
      "ATHLETE_HIGHLIGHTS"
    );

    return [...new Set(hints)];
  }

  /* ======================================================
     HANDOFF PERSISTENCE
  ====================================================== */

  async function persistPhnxMediaHandoff(
    handoffPacket
  ) {
    if (
      !handoffPacket?.verification?.handoff_ready
    ) {
      const error = new Error(
        "PHNX Media handoff is not ready and cannot be persisted as queue eligible."
      );

      error.code =
        "PHNX_HANDOFF_NOT_READY";

      throw error;
    }

    const db = getDb();

    const existingResult =
      await db
        .from(PHNX_HANDOFF_TABLE)
        .select("*")
        .eq(
          "idempotency_key",
          handoffPacket.idempotency_key
        )
        .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    const now =
      nowISO();

    const attemptCount =
      Number(
        existingResult.data?.attempt_count ||
        0
      );

    const payload = {
      handoff_id:
        handoffPacket.handoff_id,

      idempotency_key:
        handoffPacket.idempotency_key,

      correlation_id:
        handoffPacket.correlation_id,

      athlete_id:
        handoffPacket.athlete.athlete_id,

      snapshot_id:
        handoffPacket.athlete.snapshot_id,

      contract_name:
        handoffPacket.contract_name,

      contract_version:
        handoffPacket.contract_version,

      handoff_status:
        MEDIA_STATUS.HANDOFF_READY,

      payload:
        {
          ...handoffPacket,

          handoff_status:
            MEDIA_STATUS.HANDOFF_READY,

          updated_at:
            now
        },

      source_stream:
        PHNX_SOURCE_STREAM,

      target_system:
        PHNX_TARGET_SYSTEM,

      attempt_count:
        attemptCount,

      last_error:
        null,

      updated_at:
        now
    };

    let persistedRow = null;
    let action = "created";

    if (existingResult.data) {
      action = "updated";

      const updatedResult =
        await db
          .from(PHNX_HANDOFF_TABLE)
          .update(payload)
          .eq(
            "handoff_id",
            existingResult.data.handoff_id
          )
          .select("*")
          .single();

      if (updatedResult.error) {
        throw updatedResult.error;
      }

      persistedRow =
        updatedResult.data;
    } else {
      const createdResult =
        await db
          .from(PHNX_HANDOFF_TABLE)
          .insert({
            ...payload,

            created_at:
              handoffPacket.created_at ||
              now
          })
          .select("*")
          .single();

      if (createdResult.error) {
        throw createdResult.error;
      }

      persistedRow =
        createdResult.data;
    }

    const snapshotUpdateResult =
      await db
        .from(SNAPSHOT_TABLE)
        .update({
          media_status:
            MEDIA_STATUS.HANDOFF_READY,

          phnx_media_handoff_status:
            MEDIA_STATUS.HANDOFF_READY,

          phnx_media_handoff_id:
            persistedRow.handoff_id,

          phnx_media_handoff_at:
            now,

          phnx_media_handoff_receipt: {
            receipt_type:
              "PHNX_MEDIA_HANDOFF_CREATED",

            handoff_id:
              persistedRow.handoff_id,

            idempotency_key:
              persistedRow.idempotency_key,

            correlation_id:
              persistedRow.correlation_id,

            contract_name:
              persistedRow.contract_name,

            contract_version:
              persistedRow.contract_version,

            persisted_at:
              now,

            persisted:
              true
          },

          updated_at:
            now,

          last_source_update_at:
            now
        })
        .eq(
          "snapshot_id",
          handoffPacket.athlete.snapshot_id
        )
        .select("*")
        .single();

    if (snapshotUpdateResult.error) {
      throw snapshotUpdateResult.error;
    }

    await writeSnapshotAuditReceipt({
      action:
        "PHNX_MEDIA_HANDOFF_CREATED",

      snapshot_id:
        handoffPacket.athlete.snapshot_id,

      athlete_id:
        handoffPacket.athlete.athlete_id,

      before_record:
        existingResult.data,

      after_record:
        persistedRow
    });

    setPhnxUiState(
      MEDIA_STATUS.HANDOFF_READY,
      "Canonical packet persisted"
    );

    return {
      action,

      row:
        persistedRow,

      snapshot:
        snapshotUpdateResult.data,

      packet:
        persistedRow.payload
    };
  } 
 /* ======================================================
     PHNX MEDIA QUEUE
  ====================================================== */

  async function attemptPhnxMediaQueue({
    handoffRow,
    handoffPacket
  }) {
    const db = getDb();

    const now =
      nowISO();

    const currentAttempts =
      Number(
        handoffRow?.attempt_count ||
        0
      );

    const nextAttempt =
      currentAttempts + 1;

    if (
      !handoffPacket?.verification?.handoff_ready ||
      !handoffPacket?.verification?.queue_eligible
    ) {
      const error = new Error(
        "PHNX Media handoff packet is not queue eligible."
      );

      error.code =
        "PHNX_HANDOFF_NOT_QUEUE_ELIGIBLE";

      throw error;
    }

    if (
      !window.STATScorePHNXMediaEngine ||
      typeof window.STATScorePHNXMediaEngine
        .queueSnapshotMediaPackage !== "function"
    ) {
      const queueError = {
        code:
          "PHNX_MEDIA_ENGINE_NOT_LOADED",

        message:
          "PHNX Media engine is not loaded.",

        recorded_at:
          now
      };

      const failedPacket = {
        ...handoffPacket,

        handoff_status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        updated_at:
          now
      };

      await db
        .from(PHNX_HANDOFF_TABLE)
        .update({
          handoff_status:
            MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

          payload:
            failedPacket,

          attempt_count:
            nextAttempt,

          last_error:
            queueError,

          updated_at:
            now
        })
        .eq(
          "handoff_id",
          handoffRow.handoff_id
        );

      await updateSnapshotQueueState({
        snapshotId:
          handoffPacket.athlete.snapshot_id,

        status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        handoffId:
          handoffPacket.handoff_id,

        receipt: {
          receipt_type:
            "PHNX_MEDIA_HANDOFF_QUEUE_FAILED",

          handoff_id:
            handoffPacket.handoff_id,

          idempotency_key:
            handoffPacket.idempotency_key,

          error:
            queueError,

          queue_retry_required:
            true,

          recorded_at:
            now
        }
      });

      await writeSnapshotAuditReceipt({
        action:
          "PHNX_MEDIA_HANDOFF_QUEUE_FAILED",

        snapshot_id:
          handoffPacket.athlete.snapshot_id,

        athlete_id:
          handoffPacket.athlete.athlete_id,

        before_record:
          handoffRow,

        after_record:
          queueError
      });

      setPhnxUiState(
        MEDIA_STATUS.HANDOFF_QUEUE_FAILED,
        "PHNX Media engine unavailable"
      );

      return {
        ok:
          false,

        queue_status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        queue_retry_required:
          true,

        error:
          queueError
      };
    }

    try {
      const result =
        await window
          .STATScorePHNXMediaEngine
          .queueSnapshotMediaPackage(
            handoffPacket
          );

      if (
        !result ||
        result.ok !== true
      ) {
        const error = new Error(
          result?.error?.message ||
          result?.message ||
          "PHNX Media queue rejected the handoff."
        );

        error.queue_result =
          result;

        throw error;
      }

      const queuedAt =
        nowISO();

      const queuedPacket = {
        ...handoffPacket,

        handoff_status:
          MEDIA_STATUS.HANDOFF_QUEUED,

        updated_at:
          queuedAt
      };

      const queueReceipt = {
        receipt_type:
          "PHNX_MEDIA_HANDOFF_QUEUED",

        handoff_id:
          handoffPacket.handoff_id,

        idempotency_key:
          handoffPacket.idempotency_key,

        correlation_id:
          handoffPacket.correlation_id,

        attempt_count:
          nextAttempt,

        queue_result:
          result,

        queued_at:
          queuedAt
      };

      const handoffUpdate =
        await db
          .from(PHNX_HANDOFF_TABLE)
          .update({
            handoff_status:
              MEDIA_STATUS.HANDOFF_QUEUED,

            payload:
              queuedPacket,

            attempt_count:
              nextAttempt,

            last_error:
              null,

            queued_at:
              queuedAt,

            updated_at:
              queuedAt
          })
          .eq(
            "handoff_id",
            handoffRow.handoff_id
          )
          .select("*")
          .single();

      if (handoffUpdate.error) {
        throw handoffUpdate.error;
      }

      await updateSnapshotQueueState({
        snapshotId:
          handoffPacket.athlete.snapshot_id,

        status:
          MEDIA_STATUS.HANDOFF_QUEUED,

        handoffId:
          handoffPacket.handoff_id,

        receipt:
          queueReceipt
      });

      await writeSnapshotAuditReceipt({
        action:
          "PHNX_MEDIA_HANDOFF_QUEUED",

        snapshot_id:
          handoffPacket.athlete.snapshot_id,

        athlete_id:
          handoffPacket.athlete.athlete_id,

        before_record:
          handoffRow,

        after_record:
          handoffUpdate.data
      });

      setPhnxUiState(
        MEDIA_STATUS.HANDOFF_QUEUED,
        result?.job?.job_status ||
        "Assets captured"
      );

      return {
        ok:
          true,

        queue_status:
          MEDIA_STATUS.HANDOFF_QUEUED,

        queue_retry_required:
          false,

        queue_result:
          result,

        handoff:
          handoffUpdate.data,

        receipt:
          queueReceipt
      };
    } catch (error) {
      const failedAt =
        nowISO();

      const serializedError =
        serializeError(error);

      const failedPacket = {
        ...handoffPacket,

        handoff_status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        updated_at:
          failedAt
      };

      await db
        .from(PHNX_HANDOFF_TABLE)
        .update({
          handoff_status:
            MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

          payload:
            failedPacket,

          attempt_count:
            nextAttempt,

          last_error:
            serializedError,

          updated_at:
            failedAt
        })
        .eq(
          "handoff_id",
          handoffRow.handoff_id
        );

      await updateSnapshotQueueState({
        snapshotId:
          handoffPacket.athlete.snapshot_id,

        status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        handoffId:
          handoffPacket.handoff_id,

        receipt: {
          receipt_type:
            "PHNX_MEDIA_HANDOFF_QUEUE_FAILED",

          handoff_id:
            handoffPacket.handoff_id,

          idempotency_key:
            handoffPacket.idempotency_key,

          attempt_count:
            nextAttempt,

          error:
            serializedError,

          queue_retry_required:
            true,

          failed_at:
            failedAt
        }
      });

      await writeSnapshotAuditReceipt({
        action:
          "PHNX_MEDIA_HANDOFF_QUEUE_FAILED",

        snapshot_id:
          handoffPacket.athlete.snapshot_id,

        athlete_id:
          handoffPacket.athlete.athlete_id,

        before_record:
          handoffRow,

        after_record:
          serializedError
      });

      setPhnxUiState(
        MEDIA_STATUS.HANDOFF_QUEUE_FAILED,
        "Packet preserved — retry pending"
      );

      return {
        ok:
          false,

        queue_status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        queue_retry_required:
          true,

        error:
          serializedError
      };
    }
  }

  async function updateSnapshotQueueState({
    snapshotId,
    status,
    handoffId,
    receipt
  }) {
    const db = getDb();

    const result =
      await db
        .from(SNAPSHOT_TABLE)
        .update({
          media_status:
            status,

          phnx_media_handoff_status:
            status,

          phnx_media_handoff_id:
            handoffId,

          phnx_media_handoff_at:
            nowISO(),

          phnx_media_handoff_receipt:
            receipt,

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

    return result.data;
  }

  /* ======================================================
     COMPLETE TRANSACTION
  ====================================================== */

  async function runSnapshotTransaction({
    mode
  }) {
    if (
      mode !== "submitted" &&
      mode !== "draft"
    ) {
      throw new Error(
        `Unsupported Snapshot Intake transaction mode: ${mode}`
      );
    }

    const isFinalSubmission =
      mode === "submitted";

    setTransactionButtonsDisabled(true);

    setSystemMessage(
      isFinalSubmission
        ? "Submitting governed athlete record..."
        : "Saving governed athlete draft...",
      "neutral"
    );

    try {
      const row =
        await buildSnapshotRow(mode);

      const athleteResult =
        await ensureAthleteExists(row);

      row.athlete_id =
        athleteResult.athlete.athlete_id;

      setVal(
        "athleteId",
        row.athlete_id
      );

      setActiveAthleteId(
        row.athlete_id
      );

      const snapshotResult =
        await insertOrUpdateSnapshot(row);

      let persistedSnapshot =
        snapshotResult.snapshot;

      setVal(
        "snapshotId",
        persistedSnapshot.snapshot_id
      );

      setActiveSnapshotId(
        persistedSnapshot.snapshot_id
      );

      updateContinueRoute(
        persistedSnapshot.snapshot_id
      );

      const headshotResult =
        await uploadAndVerifyHeadshot({
          snapshot:
            persistedSnapshot,

          required:
            isFinalSubmission
        });

      persistedSnapshot =
        headshotResult.verified_snapshot ||
        persistedSnapshot;

      if (
        isFinalSubmission &&
        !headshotResult.verification?.ok
      ) {
        return {
          ok:
            false,

          intake_status:
            "INTAKE_INCOMPLETE_HEADSHOT_FAILED",

          athlete_id:
            persistedSnapshot.athlete_id,

          snapshot_id:
            persistedSnapshot.snapshot_id,

          athlete_persisted:
            true,

          snapshot_persisted:
            true,

          headshot_verified:
            false,

          handoff_persisted:
            false,

          queue_retry_required:
            false
        };
      }

      if (!isFinalSubmission) {
        if (headshotResult.verification?.ok) {
          persistedSnapshot =
            await readBackSnapshot(
              persistedSnapshot.snapshot_id
            );
        }

        setText(
          "recordBadge",
          "Draft Saved"
        );

        setText(
          "statusProfile",
          "Draft"
        );

        setSystemMessage(
          "Athlete draft saved.",
          "success"
        );

        return {
          ok:
            true,

          intake_status:
            "DRAFT_SAVED",

          athlete_id:
            persistedSnapshot.athlete_id,

          snapshot_id:
            persistedSnapshot.snapshot_id,

          athlete_persisted:
            true,

          snapshot_persisted:
            true,

          headshot_verified:
            Boolean(
              headshotResult.verification?.ok
            )
        };
      }

      persistedSnapshot =
        await readBackSnapshot(
          persistedSnapshot.snapshot_id
        );

      const canonicalVerification =
        verifyCanonicalHeadshotContract(
          persistedSnapshot,
          {
            throwOnFailure:
              true
          }
        );

      const parentApprovalResult =
        await ensureParentApprovalRequest(
          persistedSnapshot
        );

      const handoffIdentity =
        await resolveHandoffIdentity(
          persistedSnapshot
        );

      const handoffPacket =
        buildCanonicalPhnxHandoff({
          verifiedSnapshot:
            persistedSnapshot,

          parentApprovalResult,

          handoffIdentity
        });

      if (
        !handoffPacket.verification
          .handoff_ready
      ) {
        throw new Error(
          "Canonical PHNX Media handoff did not pass readiness verification."
        );
      }

      const handoffPersistence =
        await persistPhnxMediaHandoff(
          handoffPacket
        );

      const queueResult =
        await attemptPhnxMediaQueue({
          handoffRow:
            handoffPersistence.row,

          handoffPacket:
            handoffPersistence.packet ||
            handoffPacket
        });

      setText(
        "recordBadge",
        "Record Submitted"
      );

      setText(
        "statusProfile",
        "Submitted"
      );

      setText(
        "statusMetrics",
        "Captured"
      );

      if (queueResult.ok) {
        setSystemMessage(
          "Athlete record, verified headshot, and PHNX Sports Media handoff were saved successfully.",
          "success"
        );

        return {
          ok:
            true,

          intake_status:
            "INTAKE_COMPLETE",

          athlete_id:
            persistedSnapshot.athlete_id,

          snapshot_id:
            persistedSnapshot.snapshot_id,

          athlete_persisted:
            true,

          snapshot_persisted:
            true,

          headshot_verified:
            canonicalVerification.ok,

          parent_approval_resolved:
            true,

          handoff_persisted:
            true,

          phnx_queue_status:
            MEDIA_STATUS.HANDOFF_QUEUED,

          queue_retry_required:
            false,

          handoff_id:
            handoffPacket.handoff_id,

          correlation_id:
            handoffPacket.correlation_id,

          idempotency_key:
            handoffPacket.idempotency_key,

          packet:
            handoffPacket,

          queue_result:
            queueResult
        };
      }

      setSystemMessage(
        "Athlete record and media evidence were saved. PHNX Sports Media handoff is pending retry.",
        "warning"
      );

      return {
        ok:
          true,

        intake_status:
          "INTAKE_COMPLETE_MEDIA_RETRY_PENDING",

        athlete_id:
          persistedSnapshot.athlete_id,

        snapshot_id:
          persistedSnapshot.snapshot_id,

        athlete_persisted:
          true,

        snapshot_persisted:
          true,

        headshot_verified:
          canonicalVerification.ok,

        parent_approval_resolved:
          true,

        handoff_persisted:
          true,

        phnx_queue_status:
          MEDIA_STATUS.HANDOFF_QUEUE_FAILED,

        queue_retry_required:
          true,

        handoff_id:
          handoffPacket.handoff_id,

        correlation_id:
          handoffPacket.correlation_id,

        idempotency_key:
          handoffPacket.idempotency_key,

        packet:
          handoffPacket,

        queue_result:
          queueResult
      };
    } catch (error) {
      console.error(
        "[Stream 2] Snapshot Intake transaction failed:",
        error
      );

      const headshotFailure =
        [
          "INTAKE_INCOMPLETE_HEADSHOT_REQUIRED",
          "INTAKE_INCOMPLETE_HEADSHOT_FAILED",
          "HEADSHOT_DATABASE_VERIFICATION_FAILED"
        ].includes(error?.code);

      if (headshotFailure) {
        setSystemMessage(
          `Athlete source record was preserved, but the required headshot transaction failed. ${error.message}`,
          "error"
        );

        return {
          ok:
            false,

          intake_status:
            "INTAKE_INCOMPLETE_HEADSHOT_FAILED",

          athlete_id:
            val("athleteId") ||
            getActiveAthleteId(),

          snapshot_id:
            val("snapshotId") ||
            getActiveSnapshotId(),

          athlete_persisted:
            Boolean(
              val("athleteId") ||
              getActiveAthleteId()
            ),

          snapshot_persisted:
            Boolean(
              val("snapshotId") ||
              getActiveSnapshotId()
            ),

          headshot_verified:
            false,

          handoff_persisted:
            false,

          queue_retry_required:
            false,

          error:
            serializeError(error)
        };
      }

      setSystemMessage(
        error?.message ||
        "Snapshot Intake transaction failed.",
        "error"
      );

      return {
        ok:
          false,

        intake_status:
          "INTAKE_TRANSACTION_FAILED",

        athlete_id:
          val("athleteId") ||
          getActiveAthleteId(),

        snapshot_id:
          val("snapshotId") ||
          getActiveSnapshotId(),

        error:
          serializeError(error)
      };
    } finally {
      setTransactionButtonsDisabled(false);
    }
  }

  /* ======================================================
     PUBLIC SUBMIT / SAVE
  ====================================================== */

  function submitSnapshot() {
    if (activeTransactionPromise) {
      return activeTransactionPromise;
    }

    activeTransactionPromise =
      runSnapshotTransaction({
        mode:
          "submitted"
      }).finally(() => {
        activeTransactionPromise =
          null;
      });

    return activeTransactionPromise;
  }

  function saveDraftSnapshot() {
    if (activeTransactionPromise) {
      return activeTransactionPromise;
    }

    activeTransactionPromise =
      runSnapshotTransaction({
        mode:
          "draft"
      }).finally(() => {
        activeTransactionPromise =
          null;
      });

    return activeTransactionPromise;
  }

  /* ======================================================
     VERIFICATION ROUTING
  ====================================================== */

  function requestSnapshotVerification() {
    const snapshotId =
      val("snapshotId") ||
      getActiveSnapshotId();

    if (!snapshotId) {
      setSystemMessage(
        "Submit or save the athlete record before requesting verification.",
        "warning"
      );

      return;
    }

    window.location.href =
      `verification-request.html?snapshot_id=${encodeURIComponent(
        snapshotId
      )}`;
  }

  /* ======================================================
     AUDIT RECEIPTS
  ====================================================== */

  async function writeSnapshotAuditReceipt({
    action,
    snapshot_id,
    athlete_id,
    before_record,
    after_record
  }) {
    if (!snapshot_id && !athlete_id) {
      return null;
    }

    const db = getDb();

    const payload = {
      receipt_type:
        action ||
        "STREAM_2_EVENT",

      snapshot_id:
        snapshot_id ||
        null,

      athlete_id:
        athlete_id ||
        null,

      before_record:
        before_record ||
        null,

      after_record:
        after_record ||
        null,

      created_at:
        nowISO()
    };

    const result =
      await db
        .from(AUDIT_TABLE)
        .insert(payload)
        .select("*")
        .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data ||
      payload;
  }

  /* ======================================================
     LOAD EXISTING SNAPSHOT
  ====================================================== */

  async function loadExistingSnapshot(snapshotId) {
    if (!snapshotId) {
      return null;
    }

    setSystemMessage(
      "Loading athlete record...",
      "neutral"
    );

    const snapshot =
      await readBackSnapshot(snapshotId);

    hydrateFormFromSnapshot(snapshot);

    setActiveSnapshotId(
      snapshot.snapshot_id
    );

    if (snapshot.athlete_id) {
      setActiveAthleteId(
        snapshot.athlete_id
      );
    }

    setText(
      "recordBadge",
      "Record Loaded"
    );

    setText(
      "statusProfile",
      "Loaded"
    );

    updateContinueRoute(
      snapshot.snapshot_id
    );

    const headshotVerification =
      verifyCanonicalHeadshotContract(
        snapshot,
        {
          throwOnFailure:
            false
        }
      );

    if (headshotVerification.ok) {
      setHeadshotUiState(
        HEADSHOT_UI_STATE.VERIFIED,
        snapshot.headshot_filename
      );

      const preview =
        document.getElementById(
          "headshotPreview"
        );

      if (preview) {
        preview.src =
          snapshot.headshot_public_url ||
          snapshot.headshot_url;

        preview.style.display =
          "block";
      }

      document.getElementById(
        "removeHeadshotBtn"
      ).style.display =
        "flex";
    }

    setPhnxUiState(
      snapshot.phnx_media_handoff_status ||
      snapshot.media_status ||
      (
        headshotVerification.ok
          ? MEDIA_STATUS.HEADSHOT_VERIFIED
          : MEDIA_STATUS.NOT_READY
      )
    );

    setSystemMessage(
      "Existing athlete record loaded.",
      "success"
    );

    return snapshot;
  }

  function hydrateFormFromSnapshot(snapshot) {
    const raw =
      safeObject(
        snapshot.raw_payload
      );

    const sourceClaims =
      safeObject(
        snapshot.source_claims_payload
      );

    const sportMetrics =
      safeObject(
        snapshot.sport_metric_payload
      );

    setVal(
      "athleteId",
      snapshot.athlete_id ||
      ""
    );

    setVal(
      "snapshotId",
      snapshot.snapshot_id ||
      ""
    );

    setVal(
      "sourceOrigin",
      snapshot.source_origin ||
      sourceClaims.source_origin ||
      "athlete_self"
    );

    setVal(
      "submittedByRole",
      snapshot.submitted_by_role ||
      sourceClaims.submitted_by_role ||
      "athlete"
    );

    setVal(
      "trustClassification",
      snapshot.trust_classification ||
      sourceClaims.trust_classification ||
      "SELF_REPORTED"
    );

    setVal(
      "submittedByName",
      snapshot.submitted_by_name ||
      sourceClaims.submitted_by_name ||
      ""
    );

    setVal(
      "submittedByEmail",
      snapshot.submitted_by_email ||
      sourceClaims.submitted_by_email ||
      ""
    );

    setVal(
      "phnxCertifiedId",
      snapshot.phnx_certified_id ||
      sourceClaims.phnx_certified_id ||
      ""
    );

    setVal(
      "phnxCertificationStatus",
      snapshot.phnx_certification_status ||
      sourceClaims.phnx_certification_status ||
      "not_provided"
    );

    setVal(
      "sourceOrganization",
      snapshot.source_organization ||
      sourceClaims.source_organization ||
      ""
    );

    setVal(
      "submissionSource",
      snapshot.submission_source ||
      sourceClaims.submission_source ||
      "snapshot-intake.html"
    );

    setByName(
      "firstName",
      snapshot.first_name ||
      raw.firstName ||
      ""
    );

    setByName(
      "lastName",
      snapshot.last_name ||
      raw.lastName ||
      ""
    );

    setByName(
      "graduationClass",
      snapshot.graduation_class ||
      raw.graduationClass ||
      ""
    );

    setByName(
      "cityState",
      snapshot.city_state ||
      raw.cityState ||
      ""
    );

    setByName(
      "schoolProgram",
      snapshot.school_program ||
      raw.schoolProgram ||
      ""
    );

    setByName(
      "primarySport",
      normalizeSport(
        snapshot.primary_sport ||
        raw.primarySport ||
        ""
      )
    );

    setByName(
      "height",
      snapshot.height ||
      raw.height ||
      ""
    );

    setByName(
      "weight",
      snapshot.weight ||
      raw.weight ||
      ""
    );

    setByName(
      "primaryPosition",
      snapshot.primary_position ||
      raw.primaryPosition ||
      ""
    );

    setByName(
      "secondaryPosition",
      snapshot.secondary_position ||
      raw.secondaryPosition ||
      ""
    );

    setByName(
      "dominantHandFoot",
      snapshot.dominant_hand_foot ||
      raw.dominantHandFoot ||
      ""
    );

    setByName(
      "jerseyNumber",
      snapshot.jersey_number ||
      raw.jerseyNumber ||
      ""
    );

    setByName(
      "currentGpa",
      snapshot.current_gpa ||
      raw.currentGpa ||
      ""
    );

    setByName(
      "ncaaEligibilityStatus",
      snapshot.ncaa_eligibility_status ||
      raw.ncaaEligibilityStatus ||
      ""
    );

    setByName(
      "transcriptAvailable",
      snapshot.transcript_available ||
      raw.transcriptAvailable ||
      ""
    );

    setByName(
      "counselorContactAvailable",
      snapshot.counselor_contact_available ||
      raw.counselorContactAvailable ||
      ""
    );

    setByName(
      "academicNotes",
      snapshot.academic_notes ||
      raw.academicNotes ||
      ""
    );

    setByName(
      "highlightUrl",
      snapshot.highlight_url ||
      raw.highlightUrl ||
      ""
    );

    setByName(
      "gameFilmUrl",
      snapshot.game_film_url ||
      raw.gameFilmUrl ||
      ""
    );

    setByName(
      "socialProfileUrl",
      snapshot.social_profile_url ||
      raw.socialProfileUrl ||
      ""
    );

    setByName(
      "recruitingProfileUrl",
      snapshot.recruiting_profile_url ||
      raw.recruitingProfileUrl ||
      ""
    );

    setByName(
      "guardianName",
      snapshot.guardian_name ||
      raw.guardianName ||
      ""
    );

    setByName(
      "guardianEmail",
      snapshot.guardian_email ||
      raw.guardianEmail ||
      ""
    );

    setByName(
      "guardianPhone",
      snapshot.guardian_phone ||
      raw.guardianPhone ||
      ""
    );

    setByName(
      "coachName",
      snapshot.coach_name ||
      raw.coachName ||
      ""
    );

    setByName(
      "coachEmail",
      snapshot.coach_email ||
      raw.coachEmail ||
      ""
    );

    setByName(
      "verificationPermission",
      snapshot.verification_permission ||
      raw.verificationPermission ||
      ""
    );

    Object.entries(
      sportMetrics
    ).forEach(([key, value]) => {
      setByName(
        key,
        value
      );
    });

    setVal(
      "headshotUrl",
      snapshot.headshot_public_url ||
      snapshot.headshot_url ||
      ""
    );

    setVal(
      "headshotPath",
      snapshot.headshot_path ||
      ""
    );

    setVal(
      "headshotFileName",
      snapshot.headshot_filename ||
      ""
    );
  }

  /* ======================================================
     STATUS UI
  ====================================================== */

  function updateSourceTrustFromInputs() {
    const role =
      val("submittedByRole");

    const certification =
      val("phnxCertificationStatus");

    const selectedTrust =
      val("trustClassification");

    const trust =
      selectedTrust ||
      inferTrustClassification(
        role,
        certification
      );

    const sourceOrigin =
      val("sourceOrigin");

    setText(
      "statusSource",
      readableStatus(
        sourceOrigin ||
        role ||
        "SELF_REPORTED"
      )
    );

    setText(
      "statusTrust",
      readableStatus(
        trust ||
        "PENDING"
      )
    );

    if (
      certification === "valid" ||
      certification === "active"
    ) {
      setText(
        "statusVerification",
        "PHNX Valid"
      );
    } else if (
      certification === "pending_validation"
    ) {
      setText(
        "statusVerification",
        "Pending"
      );
    } else {
      setText(
        "statusVerification",
        "Unverified"
      );
    }
  }

  function inferTrustClassification(
    role,
    certification
  ) {
    if (
      certification === "valid" ||
      certification === "active"
    ) {
      if (role === "coach") {
        return "PHNX_CERTIFIED_COACH";
      }

      if (role === "evaluator") {
        return "PHNX_CERTIFIED_EVALUATOR";
      }

      if (role === "trainer") {
        return "PHNX_CERTIFIED_TRAINER";
      }

      if (role === "camp_operator") {
        return "PHNX_SPORTS_COMBINE";
      }
    }

    if (role === "parent_guardian") {
      return "PARENT_REPORTED";
    }

    if (role === "coach") {
      return "COACH_SUBMITTED";
    }

    if (role === "evaluator") {
      return "EVALUATOR_SUBMITTED";
    }

    if (role === "trainer") {
      return "TRAINER_SUBMITTED";
    }

    return "SELF_REPORTED";
  }

  function updateSportEvidenceBlocks() {
    const sport =
      valByName("primarySport")
        .toLowerCase();

    [
      "football",
      "basketball",
      "baseball",
      "track"
    ].forEach(name => {
      const block =
        document.getElementById(
          `${name}Metrics`
        );

      if (block) {
        block.classList.toggle(
          "active",
          sport === name
        );
      }
    });

    setText(
      "statusMetrics",
      sport
        ? "Ready"
        : "Pending"
    );
  }

  function updateMediaStatus() {
    const hasExistingCanonicalHeadshot =
      Boolean(
        val("headshotUrl") &&
        val("headshotPath")
      );

    const hasSelectedHeadshot =
      Boolean(
        selectedHeadshotFile
      );

    const hasFilm =
      Boolean(
        valByName("highlightUrl") ||
        valByName("gameFilmUrl")
      );

    if (hasFilm) {
      setText(
        "mediaStatusFilm",
        "Ready"
      );
    } else {
      setText(
        "mediaStatusFilm",
        "Pending"
      );
    }

    if (hasSelectedHeadshot) {
      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_PENDING,
        "Headshot selected — upload required"
      );

      return;
    }

    if (hasExistingCanonicalHeadshot) {
      setPhnxUiState(
        MEDIA_STATUS.HEADSHOT_VERIFIED,
        "Canonical media available"
      );

      return;
    }

    setPhnxUiState(
      MEDIA_STATUS.NOT_READY,
      "Required headshot missing"
    );
  }

  /* ======================================================
     ACTIVE CONTEXT
  ====================================================== */

  function getActiveSnapshotId() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      clean(params.get("snapshot_id")) ||
      clean(
        sessionStorage.getItem(
          ACTIVE_SNAPSHOT_KEY
        )
      ) ||
      clean(
        localStorage.getItem(
          ACTIVE_SNAPSHOT_KEY
        )
      ) ||
      clean(
        sessionStorage.getItem(
          LEGACY_SNAPSHOT_KEY
        )
      ) ||
      clean(
        localStorage.getItem(
          LEGACY_SNAPSHOT_KEY
        )
      ) ||
      ""
    );
  }

  function getActiveAthleteId() {
    return (
      clean(
        sessionStorage.getItem(
          ACTIVE_ATHLETE_KEY
        )
      ) ||
      clean(
        localStorage.getItem(
          ACTIVE_ATHLETE_KEY
        )
      ) ||
      clean(
        sessionStorage.getItem(
          LEGACY_ATHLETE_KEY
        )
      ) ||
      clean(
        localStorage.getItem(
          LEGACY_ATHLETE_KEY
        )
      ) ||
      ""
    );
  }

  function setActiveSnapshotId(snapshotId) {
    if (!snapshotId) return;

    [
      ACTIVE_SNAPSHOT_KEY,
      LEGACY_SNAPSHOT_KEY,
      SECONDARY_SNAPSHOT_KEY
    ].forEach(key => {
      localStorage.setItem(
        key,
        snapshotId
      );

      sessionStorage.setItem(
        key,
        snapshotId
      );
    });
  }

  function setActiveAthleteId(athleteId) {
    if (!athleteId) return;

    [
      ACTIVE_ATHLETE_KEY,
      LEGACY_ATHLETE_KEY,
      SECONDARY_ATHLETE_KEY
    ].forEach(key => {
      localStorage.setItem(
        key,
        athleteId
      );

      sessionStorage.setItem(
        key,
        athleteId
      );
    });
  }

  function updateContinueRoute(snapshotId) {
    const button =
      document.getElementById(
        "viewProfileBtn"
      );

    if (!button) return;

    button.href =
      snapshotId
        ? `athlete-dashboard.html?snapshot_id=${encodeURIComponent(
            snapshotId
          )}&from=athlete-record-intake`
        : "athlete-dashboard.html?from=athlete-record-intake";
  }

  /* ======================================================
     GENERAL HELPERS
  ====================================================== */

  function generateSnapshotId() {
    return generateUuid();
  }

  function generateAthleteId() {
    return generateUuid();
  }

  function generateUuid() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    ).replace(
      /[xy]/g,
      character => {
        const random =
          Math.random() * 16 | 0;

        const value =
          character === "x"
            ? random
            : random & 0x3 | 0x8;

        return value.toString(16);
      }
    );
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  }

  function normalizeSport(value) {
    return clean(value).toLowerCase();
  }

  function safeObject(value) {
    return (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};
  }

  function val(id) {
    return clean(
      document.getElementById(id)?.value
    );
  }

  function setVal(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.value =
        value ?? "";
    }
  }

  function valByName(name) {
    return clean(
      document.querySelector(
        `[name="${name}"]`
      )?.value
    );
  }

  function setByName(name, value) {
    const element =
      document.querySelector(
        `[name="${name}"]`
      );

    if (element) {
      element.value =
        value ?? "";
    }
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        value ?? "";
    }
  }

  function readableStatus(value) {
    return clean(value)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  function formatBytes(bytes) {
    const value =
      Number(bytes || 0);

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(
        value / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      value /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function sleep(milliseconds) {
    return new Promise(resolve => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    });
  }

  function serializeError(error) {
    return {
      name:
        error?.name ||
        "Error",

      code:
        error?.code ||
        null,

      message:
        error?.message ||
        String(error),

      status:
        error?.status ||
        error?.statusCode ||
        null,

      details:
        error?.details ||
        null,

      hint:
        error?.hint ||
        null,

      recorded_at:
        nowISO()
    };
  }

  /* ======================================================
     DEBUG / COMPATIBILITY EXPORTS
  ====================================================== */

  function exposeDebugGlobals() {
    window.STATSCORE_SNAPSHOT_INTAKE_ENGINE = {
      version:
        "2.0",

      status:
        "ACTIVE",

      bootCompleted:
        () => bootCompleted,

      getDb,

      awaitDbReady,

      validateHtmlContract,

      resolveSnapshotIntakeMode,

      clearActiveRecordContext,

      buildSnapshotRow,

      buildSourceClaimsPayload,

      buildSportMetricPayload,

      ensureAthleteExists,

      insertOrUpdateSnapshot,

      uploadAndVerifyHeadshot,

      uploadHeadshotWithRetry,

      persistHeadshotMetadata,

      readBackSnapshot,

      verifyCanonicalHeadshotContract,

      ensureParentApprovalRequest,

      resolveHandoffIdentity,

      buildCanonicalPhnxHandoff,

      buildCanonicalAssetManifest,

      persistPhnxMediaHandoff,

      attemptPhnxMediaQueue,

      runSnapshotTransaction,

      submitSnapshot,

      saveDraftSnapshot,

      loadExistingSnapshot,

      filterAthleteSchema,

      filterSnapshotSchema,

      getActiveSnapshotId,

      getActiveAthleteId,

      setActiveSnapshotId,

      setActiveAthleteId,

      MEDIA_STATUS,

      HEADSHOT_UI_STATE
    };

    window.submitSnapshot =
      submitSnapshot;

    window.saveDraftSnapshot =
      saveDraftSnapshot;

    window.runSnapshotTransaction =
      runSnapshotTransaction;

    window.uploadAndVerifyHeadshot =
      uploadAndVerifyHeadshot;

    window.buildCanonicalPhnxHandoff =
      buildCanonicalPhnxHandoff;

    window.persistPhnxMediaHandoff =
      persistPhnxMediaHandoff;

    window.getDb =
      getDb;
  }
})(); 
