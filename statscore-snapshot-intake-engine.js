/*
==========================================================
STATS-CORE™ SNAPSHOT / ATHLETE RECORD INTAKE ENGINE
Stream 2 — Athlete Source Record / Evidence Provenance
CANON: Sports-Agnostic + PHNX Evidence Trust
==========================================================
*/

const SNAPSHOT_TABLE = "statscore_snapshots";
const AUDIT_TABLE = "sc_snapshot_audit_receipts";
const PARENT_APPROVAL_TABLE = "sc_parent_approval_requests";

const ACTIVE_SNAPSHOT_KEY = "STATSCORE_ACTIVE_SNAPSHOT_ID";
const ACTIVE_ATHLETE_KEY = "STATSCORE_ACTIVE_ATHLETE_ID";

let selectedHeadshotFile = null;
let currentIntakeMode = { mode: "create", snapshot_id: null };

/* ======================================================
   BOOT
====================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  currentIntakeMode = resolveSnapshotIntakeMode();

  bindSnapshotIntakeEvents();
  updateSportEvidenceBlocks();
  updateSourceTrustFromInputs();
  updateMediaStatus();

  if (currentIntakeMode.mode === "edit") {
    await loadExistingSnapshot(currentIntakeMode.snapshot_id);
  } else {
    resetCreateMode();
  }
});

/* ======================================================
   MODE RESOLUTION — THIS FIXES HARDLOAD ISSUE
====================================================== */

function resolveSnapshotIntakeMode() {
  const params = new URLSearchParams(window.location.search);
  const urlSnapshotId = params.get("snapshot_id");

  if (urlSnapshotId) {
    setActiveSnapshotId(urlSnapshotId);
    return { mode: "edit", snapshot_id: urlSnapshotId };
  }

  clearActiveSnapshotContext();
  return { mode: "create", snapshot_id: null };
}

function resetCreateMode() {
  const form = document.getElementById("snapshotForm");
  if (form) form.reset();

  selectedHeadshotFile = null;

  setVal("athleteId", "");
  setVal("snapshotId", "");
  setVal("sportMetricPayload", "");
  setVal("sourceClaimsPayload", "");
  setVal("headshotUrl", "");
  setVal("headshotPath", "");
  setVal("headshotFileName", "");

  setText("recordBadge", "Record Pending");
  setText("statusProfile", "Pending");
  setText("statusSource", "Self-Reported");
  setText("statusTrust", "Pending");
  setText("statusMetrics", "Pending");
  setText("statusVerification", "Pending");
  setText("statusPhnxMedia", "Not Queued");
  setText("mediaQueueBadge", "Media Queue Pending");
  setText("systemMessage", "");

  const preview = document.getElementById("headshotPreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  const removeBtn = document.getElementById("removeHeadshotBtn");
  if (removeBtn) removeBtn.style.display = "none";

  const uploadBox = document.getElementById("headshotUploadBox");
  if (uploadBox) uploadBox.classList.remove("ready", "error");

  setText("headshotUploadText", "PHNX SPORTS MEDIA INGEST");
  setText("headshotUploadHint", "Click to upload JPG, PNG, WEBP, HEIC, or HEIF");

  updateSportEvidenceBlocks();
  updateSourceTrustFromInputs();
  updateMediaStatus();
}

/* ======================================================
   EVENTS
====================================================== */

function bindSnapshotIntakeEvents() {
  const sport = document.getElementById("primarySport");
  if (sport) sport.addEventListener("change", updateSportEvidenceBlocks);

  [
    "sourceOrigin",
    "submittedByRole",
    "trustClassification",
    "phnxCertificationStatus",
    "phnxCertifiedId"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateSourceTrustFromInputs);
    if (el) el.addEventListener("input", updateSourceTrustFromInputs);
  });

  const uploadInput = document.getElementById("athleteHeadshotUpload");
  if (uploadInput) uploadInput.addEventListener("change", handleHeadshotSelection);

  const addBtn = document.getElementById("addHeadshotBtn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      document.getElementById("athleteHeadshotUpload")?.click();
    });
  }

  const removeBtn = document.getElementById("removeHeadshotBtn");
  if (removeBtn) removeBtn.addEventListener("click", removeSelectedHeadshot);

  const submitBtn = document.getElementById("submitSnapshotBtn");
  if (submitBtn) submitBtn.addEventListener("click", submitSnapshot);

  const saveBtn = document.getElementById("saveDraftBtn");
  if (saveBtn) saveBtn.addEventListener("click", saveDraftSnapshot);

  const verifyBtn = document.getElementById("requestVerificationBtn");
  if (verifyBtn) verifyBtn.addEventListener("click", requestSnapshotVerification);
}

/* ======================================================
   LOAD EXISTING SNAPSHOT — ONLY WITH URL snapshot_id
====================================================== */

async function loadExistingSnapshot(snapshotId) {
  if (!snapshotId) return;

  try {
    setText("systemMessage", "Loading athlete record...");

    const db = getDb();
    const { data, error } = await db
      .from(SNAPSHOT_TABLE)
      .select("*")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No athlete record found for this snapshot_id.");

    hydrateFormFromSnapshot(data);

    setActiveSnapshotId(data.snapshot_id);
    if (data.athlete_id) setActiveAthleteId(data.athlete_id);

    setText("recordBadge", "Record Loaded");
    setText("statusProfile", "Loaded");
    setText("systemMessage", "Existing athlete record loaded.");

    updateSportEvidenceBlocks();
    updateSourceTrustFromInputs();
    updateMediaStatus();
  } catch (err) {
    console.error("Snapshot load failed:", err);
    setText("systemMessage", err.message || "Snapshot load failed.");
  }
}

function hydrateFormFromSnapshot(data) {
  const raw = data.raw_payload || {};
  const sportPayload = data.sport_metric_payload || raw.sport_metric_payload || {};
  const sourcePayload = data.source_claims_payload || raw.source_claims_payload || {};

  setVal("snapshotId", data.snapshot_id || "");
  setVal("athleteId", data.athlete_id || "");

  setVal("sourceOrigin", data.source_origin || sourcePayload.source_origin || "athlete_self");
  setVal("submittedByRole", data.submitted_by_role || sourcePayload.submitted_by_role || "athlete");
  setVal("trustClassification", data.trust_classification || sourcePayload.trust_classification || "SELF_REPORTED");
  setVal("submittedByName", data.submitted_by_name || sourcePayload.submitted_by_name || "");
  setVal("submittedByEmail", data.submitted_by_email || sourcePayload.submitted_by_email || "");
  setVal("phnxCertifiedId", data.phnx_certified_id || sourcePayload.phnx_certified_id || "");
  setVal("phnxCertificationStatus", data.phnx_certification_status || sourcePayload.phnx_certification_status || "not_provided");
  setVal("sourceOrganization", data.source_organization || sourcePayload.source_organization || "");
  setVal("submissionSource", data.submission_source || sourcePayload.submission_source || "snapshot-intake.html");

  setByName("firstName", data.first_name || raw.firstName || "");
  setByName("lastName", data.last_name || raw.lastName || "");
  setByName("graduationClass", data.graduation_class || raw.graduationClass || "");
  setByName("cityState", data.city_state || raw.cityState || "");
  setByName("schoolProgram", data.school_program || raw.schoolProgram || "");
  setByName("primarySport", normalizeSport(data.primary_sport || raw.primarySport || ""));

  setByName("height", data.height || raw.height || "");
  setByName("weight", data.weight || raw.weight || "");
  setByName("primaryPosition", data.primary_position || raw.primaryPosition || "");
  setByName("secondaryPosition", data.secondary_position || raw.secondaryPosition || "");
  setByName("dominantHandFoot", data.dominant_hand_foot || raw.dominantHandFoot || "");
  setByName("jerseyNumber", data.jersey_number || raw.jerseyNumber || "");

  setByName("currentGpa", data.current_gpa || raw.currentGpa || "");
  setByName("ncaaEligibilityStatus", data.ncaa_eligibility_status || raw.ncaaEligibilityStatus || "");
  setByName("transcriptAvailable", data.transcript_available || raw.transcriptAvailable || "");
  setByName("counselorContactAvailable", data.counselor_contact_available || raw.counselorContactAvailable || "");
  setByName("academicNotes", data.academic_notes || raw.academicNotes || "");

  setByName("highlightUrl", data.highlight_url || raw.highlightUrl || "");
  setByName("socialProfileUrl", data.social_profile_url || raw.socialProfileUrl || "");
  setByName("gameFilmUrl", data.game_film_url || raw.gameFilmUrl || "");
  setByName("recruitingProfileUrl", data.recruiting_profile_url || raw.recruitingProfileUrl || "");

  setByName("guardianName", data.guardian_name || raw.guardianName || "");
  setByName("guardianEmail", data.guardian_email || raw.guardianEmail || "");
  setByName("guardianPhone", data.guardian_phone || raw.guardianPhone || "");
  setByName("coachName", data.coach_name || raw.coachName || "");
  setByName("coachEmail", data.coach_email || raw.coachEmail || "");
  setByName("verificationPermission", data.verification_permission || raw.verificationPermission || "");

  hydrateSportPayload(sportPayload);

  setVal("headshotUrl", data.headshot_public_url || data.headshot_url || raw.headshotUrl || "");
  setVal("headshotPath", data.headshot_path || raw.headshotPath || "");
  setVal("headshotFileName", data.headshot_filename || raw.headshotFileName || "");

  const headshot = data.headshot_public_url || data.headshot_url || raw.headshotUrl;
  if (headshot) {
    const preview = document.getElementById("headshotPreview");
    if (preview) {
      preview.src = headshot;
      preview.style.display = "block";
    }
    setText("mediaStatusHeadshot", "Uploaded");
    setText("headshotUploadText", "Headshot Loaded");
    setText("headshotUploadHint", "Existing athlete media attached");
    document.getElementById("headshotUploadBox")?.classList.add("ready");
    const removeBtn = document.getElementById("removeHeadshotBtn");
    if (removeBtn) removeBtn.style.display = "flex";
  }
}

function hydrateSportPayload(payload) {
  if (!payload || typeof payload !== "object") return;

  Object.entries(payload).forEach(([key, value]) => {
    setByName(key, value ?? "");
  });
}

/* ======================================================
   SUBMIT / SAVE
====================================================== */

async function submitSnapshot() {
  try {
    setText("systemMessage", "Submitting athlete record...");

    const row = await buildSnapshotRow("submitted");
    const saved = await insertSnapshot(row);

    await maybeCreateParentApproval(saved);
    await maybeUploadHeadshot(saved);

    setActiveSnapshotId(saved.snapshot_id);
    if (saved.athlete_id) setActiveAthleteId(saved.athlete_id);

    setText("recordBadge", "Record Submitted");
    setText("statusProfile", "Submitted");
    setText("statusMetrics", "Captured");
    setText("systemMessage", "Athlete record submitted.");

    updateContinueRoute(saved.snapshot_id);
  } catch (err) {
    console.error("Submit snapshot failed:", err);
    setText("systemMessage", err.message || "Submit failed.");
  }
}

async function saveDraftSnapshot() {
  try {
    setText("systemMessage", "Saving draft...");

    const row = await buildSnapshotRow("draft");
    const saved = await insertSnapshot(row);

    setActiveSnapshotId(saved.snapshot_id);
    if (saved.athlete_id) setActiveAthleteId(saved.athlete_id);

    setText("recordBadge", "Draft Saved");
    setText("statusProfile", "Draft");
    setText("systemMessage", "Draft saved.");
    updateContinueRoute(saved.snapshot_id);
  } catch (err) {
    console.error("Save draft failed:", err);
    setText("systemMessage", err.message || "Draft save failed.");
  }
}

async function buildSnapshotRow(status) {
  const form = document.getElementById("snapshotForm");
  const fd = new FormData(form);

  const sourceClaims = buildSourceClaimsPayload(fd);
  const sportMetrics = buildSportMetricPayload(fd);

  const athleteId = val("athleteId") || generateAthleteId();
  const snapshotId = val("snapshotId") || getActiveSnapshotId() || generateSnapshotId();

  const firstName = clean(fd.get("firstName"));
  const lastName = clean(fd.get("lastName"));

  if (!firstName || !lastName) {
    throw new Error("Athlete first and last name are required.");
  }

  const row = {
    snapshot_id: snapshotId,
    athlete_id: athleteId,

    snapshot_status: status,
    source_record_status: status === "draft" ? "draft" : "submitted",
    verification_status: status === "draft" ? "pending" : "UNVERIFIED",
    score_status: "not_issued",

    first_name: firstName,
    last_name: lastName,
    athlete_display_name: `${firstName} ${lastName}`.trim(),
    graduation_class: clean(fd.get("graduationClass")),
    city_state: clean(fd.get("cityState")),
    school_program: clean(fd.get("schoolProgram")),
    primary_sport: clean(fd.get("primarySport")),

    height: clean(fd.get("height")),
    weight: clean(fd.get("weight")),
    primary_position: clean(fd.get("primaryPosition")),
    secondary_position: clean(fd.get("secondaryPosition")),
    dominant_hand_foot: clean(fd.get("dominantHandFoot")),
    jersey_number: clean(fd.get("jerseyNumber")),

    current_gpa: clean(fd.get("currentGpa")),
    ncaa_eligibility_status: clean(fd.get("ncaaEligibilityStatus")),
    transcript_available: clean(fd.get("transcriptAvailable")),
    counselor_contact_available: clean(fd.get("counselorContactAvailable")),
    academic_notes: clean(fd.get("academicNotes")),

    highlight_url: clean(fd.get("highlightUrl")),
    social_profile_url: clean(fd.get("socialProfileUrl")),
    game_film_url: clean(fd.get("gameFilmUrl")),
    recruiting_profile_url: clean(fd.get("recruitingProfileUrl")),

    guardian_name: clean(fd.get("guardianName")),
    guardian_email: clean(fd.get("guardianEmail")),
    guardian_phone: clean(fd.get("guardianPhone")),
    coach_name: clean(fd.get("coachName")),
    coach_email: clean(fd.get("coachEmail")),
    verification_permission: clean(fd.get("verificationPermission")),

    source_origin: sourceClaims.source_origin,
    submitted_by_role: sourceClaims.submitted_by_role,
    submitted_by_name: sourceClaims.submitted_by_name,
    submitted_by_email: sourceClaims.submitted_by_email,
    submitted_by_professional_id: sourceClaims.submitted_by_professional_id,
    phnx_certified_id: sourceClaims.phnx_certified_id,
    phnx_certification_status: sourceClaims.phnx_certification_status,
    trust_classification: sourceClaims.trust_classification,
    source_organization: sourceClaims.source_organization,
    submission_source: sourceClaims.submission_source,

    sport_metric_payload: sportMetrics,
    source_claims_payload: sourceClaims,

    headshot_url: val("headshotUrl"),
    headshot_path: val("headshotPath"),
    headshot_filename: val("headshotFileName"),

    raw_payload: Object.fromEntries(fd.entries()),

    submitted_at: nowISO(),
    updated_at: nowISO(),
    last_source_update_at: nowISO()
  };

  setVal("snapshotId", snapshotId);
  setVal("athleteId", athleteId);
  setVal("sportMetricPayload", JSON.stringify(sportMetrics));
  setVal("sourceClaimsPayload", JSON.stringify(sourceClaims));

  return row;
}

/* ======================================================
   DATABASE INSERT / UPDATE
====================================================== */

async function insertSnapshot(row) {
  const db = getDb();
  const cleanRow = filterSnapshotSchema(row || {});
  const incomingSnapshotId = cleanRow.snapshot_id || row?.snapshot_id || getActiveSnapshotId();

  if (incomingSnapshotId) {
    const { data: existingData, error: existingError } = await db
      .from(SNAPSHOT_TABLE)
      .select("*")
      .eq("snapshot_id", incomingSnapshotId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingData) {
      const updatePayload = {
        ...cleanRow,
        snapshot_id: existingData.snapshot_id,
        athlete_id: existingData.athlete_id || cleanRow.athlete_id || row?.athlete_id || generateAthleteId(),
        updated_at: nowISO(),
        last_source_update_at: nowISO(),
        source_record_status: cleanRow.source_record_status || existingData.source_record_status || "updated"
      };

      await writeSnapshotAuditReceipt({
        action: "SNAPSHOT_SOURCE_UPDATE",
        snapshot_id: existingData.snapshot_id,
        athlete_id: updatePayload.athlete_id,
        before_record: existingData,
        after_record: updatePayload
      });

      const { data, error } = await db
        .from(SNAPSHOT_TABLE)
        .update(updatePayload)
        .eq("snapshot_id", existingData.snapshot_id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    }
  }

  const createPayload = {
    ...cleanRow,
    snapshot_id: cleanRow.snapshot_id || generateSnapshotId(),
    athlete_id: cleanRow.athlete_id || generateAthleteId(),
    source_record_status: cleanRow.source_record_status || "created",
    created_at: cleanRow.created_at || nowISO(),
    updated_at: nowISO(),
    last_source_update_at: nowISO()
  };

  const { data, error } = await db
    .from(SNAPSHOT_TABLE)
    .insert(createPayload)
    .select("*")
    .single();

  if (error) throw error;

  await writeSnapshotAuditReceipt({
    action: "SNAPSHOT_SOURCE_CREATE",
    snapshot_id: data.snapshot_id,
    athlete_id: data.athlete_id,
    before_record: null,
    after_record: data
  });

  return data;
}

/* ======================================================
   PAYLOAD BUILDERS
====================================================== */

function buildSourceClaimsPayload(fd) {
  return {
    source_origin: clean(fd.get("sourceOrigin")),
    submitted_by_role: clean(fd.get("submittedByRole")),
    submitted_by_name: clean(fd.get("submittedByName")),
    submitted_by_email: clean(fd.get("submittedByEmail")),
    submitted_by_professional_id: clean(fd.get("phnxCertifiedId")),
    phnx_certified_id: clean(fd.get("phnxCertifiedId")),
    phnx_certification_status: clean(fd.get("phnxCertificationStatus")),
    trust_classification: clean(fd.get("trustClassification")) || "SELF_REPORTED",
    source_organization: clean(fd.get("sourceOrganization")),
    submission_source: clean(fd.get("submissionSource")) || "snapshot-intake.html",
    captured_at: nowISO()
  };
}

function buildSportMetricPayload(fd) {
  const sport = clean(fd.get("primarySport"));

  const universal = {
    sport,
    primaryPosition: clean(fd.get("primaryPosition")),
    secondaryPosition: clean(fd.get("secondaryPosition")),
    height: clean(fd.get("height")),
    weight: clean(fd.get("weight")),
    dominantHandFoot: clean(fd.get("dominantHandFoot")),
    jerseyNumber: clean(fd.get("jerseyNumber"))
  };

  if (sport === "football") {
    return {
      ...universal,
      footballDash40: clean(fd.get("footballDash40")),
      footballVerticalJump: clean(fd.get("footballVerticalJump")),
      footballShuttle: clean(fd.get("footballShuttle")),
      footballBroadJump: clean(fd.get("footballBroadJump")),
      footballStrengthMarker: clean(fd.get("footballStrengthMarker")),
      footballVerifiedEventSource: clean(fd.get("footballVerifiedEventSource")),
      footballNotes: clean(fd.get("footballNotes"))
    };
  }

  if (sport === "basketball") {
    return {
      ...universal,
      basketballWingspan: clean(fd.get("basketballWingspan")),
      basketballVerticalJump: clean(fd.get("basketballVerticalJump")),
      basketballLaneAgility: clean(fd.get("basketballLaneAgility")),
      basketballCourtSprint: clean(fd.get("basketballCourtSprint")),
      basketballSkillMarker: clean(fd.get("basketballSkillMarker")),
      basketballVerifiedEventSource: clean(fd.get("basketballVerifiedEventSource")),
      basketballNotes: clean(fd.get("basketballNotes"))
    };
  }

  if (sport === "baseball") {
    return {
      ...universal,
      baseballDash60: clean(fd.get("baseballDash60")),
      baseballExitVelocity: clean(fd.get("baseballExitVelocity")),
      baseballThrowingVelocity: clean(fd.get("baseballThrowingVelocity")),
      baseballPopTime: clean(fd.get("baseballPopTime")),
      baseballBatThrowSide: clean(fd.get("baseballBatThrowSide")),
      baseballVerifiedEventSource: clean(fd.get("baseballVerifiedEventSource")),
      baseballNotes: clean(fd.get("baseballNotes"))
    };
  }

  if (sport === "track") {
    return {
      ...universal,
      trackPrimaryEvent: clean(fd.get("trackPrimaryEvent")),
      trackBestMark: clean(fd.get("trackBestMark")),
      trackTimingType: clean(fd.get("trackTimingType")),
      trackMeetSource: clean(fd.get("trackMeetSource")),
      trackSplitData: clean(fd.get("trackSplitData")),
      trackVerifiedEventSource: clean(fd.get("trackVerifiedEventSource")),
      trackNotes: clean(fd.get("trackNotes"))
    };
  }

  return universal;
}

/* ======================================================
   TRUST / STATUS UI
====================================================== */

function updateSourceTrustFromInputs() {
  const role = val("submittedByRole");
  const certification = val("phnxCertificationStatus");
  const trust = val("trustClassification") || inferTrustClassification(role, certification);
  const sourceOrigin = val("sourceOrigin");

  setText("statusSource", readableSource(sourceOrigin || role));
  setText("statusTrust", readableTrust(trust));

  if (certification === "valid") {
    setText("statusVerification", "PHNX Valid");
  } else if (certification === "pending_validation") {
    setText("statusVerification", "Pending");
  } else {
    setText("statusVerification", "Unverified");
  }
}

function inferTrustClassification(role, certification) {
  if (certification === "valid") {
    if (role === "coach") return "PHNX_CERTIFIED_COACH";
    if (role === "evaluator") return "PHNX_CERTIFIED_EVALUATOR";
    if (role === "trainer") return "PHNX_CERTIFIED_TRAINER";
    if (role === "camp_operator") return "PHNX_SPORTS_COMBINE";
  }

  if (role === "parent_guardian") return "PARENT_REPORTED";
  if (role === "coach") return "COACH_SUBMITTED";
  if (role === "evaluator") return "EVALUATOR_SUBMITTED";
  if (role === "trainer") return "TRAINER_SUBMITTED";

  return "SELF_REPORTED";
}

function readableTrust(v) {
  return String(v || "Pending")
    .replaceAll("_", " ")
    .toUpperCase();
}

function readableSource(v) {
  return String(v || "Self-Reported")
    .replaceAll("_", " ")
    .toUpperCase();
}

/* ======================================================
   SPORT BLOCKS
====================================================== */

function updateSportEvidenceBlocks() {
  const sport = valByName("primarySport");

  ["football", "basketball", "baseball", "track"].forEach(s => {
    const block = document.getElementById(`${s}Metrics`);
    if (block) block.classList.toggle("active", sport === s);
  });

  setText("statusMetrics", sport ? "Ready" : "Pending");
}

/* ======================================================
   MEDIA
====================================================== */

function handleHeadshotSelection(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  selectedHeadshotFile = file;

  setVal("headshotFileName", file.name);

  const preview = document.getElementById("headshotPreview");
  if (preview) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }

  document.getElementById("headshotUploadBox")?.classList.add("ready");
  setText("headshotUploadText", "Headshot Selected");
  setText("headshotUploadHint", file.name);
  setText("mediaStatusHeadshot", "Ready");
  setText("mediaStatusCard", "Ready");
  setText("statusPhnxMedia", "Queued");

  const removeBtn = document.getElementById("removeHeadshotBtn");
  if (removeBtn) removeBtn.style.display = "flex";

  updateMediaStatus();
}

function removeSelectedHeadshot() {
  selectedHeadshotFile = null;

  const input = document.getElementById("athleteHeadshotUpload");
  if (input) input.value = "";

  setVal("headshotUrl", "");
  setVal("headshotPath", "");
  setVal("headshotFileName", "");

  const preview = document.getElementById("headshotPreview");
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }

  const box = document.getElementById("headshotUploadBox");
  if (box) box.classList.remove("ready", "error");

  setText("headshotUploadText", "PHNX SPORTS MEDIA INGEST");
  setText("headshotUploadHint", "Click to upload JPG, PNG, WEBP, HEIC, or HEIF");
  setText("mediaStatusHeadshot", "Required");
  setText("mediaStatusCard", "Not Ready");
  setText("statusPhnxMedia", "Not Queued");

  const removeBtn = document.getElementById("removeHeadshotBtn");
  if (removeBtn) removeBtn.style.display = "none";

  updateMediaStatus();
}

async function maybeUploadHeadshot(saved) {
  if (!selectedHeadshotFile || !saved?.snapshot_id) return;

  try {
    if (!window.STATSCORE_UPLOAD_HEADSHOT) {
      return;
    }

    const result = await window.STATSCORE_UPLOAD_HEADSHOT({
      file: selectedHeadshotFile,
      snapshot_id: saved.snapshot_id,
      athlete_id: saved.athlete_id
    });

    if (result?.publicUrl || result?.public_url) {
      setVal("headshotUrl", result.publicUrl || result.public_url);
      setVal("headshotPath", result.path || "");
      setVal("headshotFileName", selectedHeadshotFile.name);
    }
  } catch (err) {
    console.warn("Headshot upload skipped/failed:", err);
  }
}

function updateMediaStatus() {
  const hasMedia =
    !!selectedHeadshotFile ||
    !!val("headshotUrl") ||
    !!valByName("highlightUrl") ||
    !!valByName("gameFilmUrl") ||
    !!valByName("socialProfileUrl") ||
    !!valByName("recruitingProfileUrl");

  setText("mediaQueueBadge", hasMedia ? "Media Queue Ready" : "Media Queue Pending");
  setText("statusPhnxMedia", hasMedia ? "Queued" : "Not Queued");
}

/* ======================================================
   PARENT APPROVAL / VERIFICATION
====================================================== */

async function maybeCreateParentApproval(saved) {
  const guardianEmail = valByName("guardianEmail");
  if (!guardianEmail || !saved?.snapshot_id) return;

  try {
    const db = getDb();

    const payload = {
      snapshot_id: saved.snapshot_id,
      athlete_id: saved.athlete_id || null,
      athlete_name: saved.athlete_display_name || `${saved.first_name || ""} ${saved.last_name || ""}`.trim(),
      guardian_name: valByName("guardianName") || "Parent / Guardian",
      guardian_email: guardianEmail,
      requester_name: "STATSCore System",
      requester_role: "system",
      request_type: "parent_permission_scope",
      profile_participation: true,
      public_visibility: false,
      recruiter_access: false,
      messaging_access: false,
      media_exposure: false,
      counselor_access: false,
      status: "pending",
      requested_at: nowISO(),
      created_at: nowISO(),
      updated_at: nowISO()
    };

    await db.from(PARENT_APPROVAL_TABLE).insert(payload);
  } catch (err) {
    console.warn("Parent approval request skipped:", err);
  }
}

async function requestSnapshotVerification() {
  setText("systemMessage", "Verification request route pending.");
}

/* ======================================================
   AUDIT
====================================================== */

async function writeSnapshotAuditReceipt(receipt) {
  try {
    if (!receipt?.snapshot_id) return;

    const db = getDb();

    const payload = {
      receipt_type: receipt.action || "SNAPSHOT_SOURCE_EVENT",
      snapshot_id: receipt.snapshot_id,
      athlete_id: receipt.athlete_id || null,
      before_record: receipt.before_record || null,
      after_record: receipt.after_record || null,
      created_at: nowISO()
    };

    await db.from(AUDIT_TABLE).insert(payload);
  } catch (err) {
    if (window.STATSCORE_DEBUG) {
      console.warn("Snapshot audit receipt skipped:", err);
    }
  }
}

/* ======================================================
   HELPERS
====================================================== */

function getActiveSnapshotId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("snapshot_id") || null;
}

function setActiveSnapshotId(snapshotId) {
  if (!snapshotId) return;
  localStorage.setItem(ACTIVE_SNAPSHOT_KEY, snapshotId);
  sessionStorage.setItem(ACTIVE_SNAPSHOT_KEY, snapshotId);
}

function setActiveAthleteId(athleteId) {
  if (!athleteId) return;
  localStorage.setItem(ACTIVE_ATHLETE_KEY, athleteId);
  sessionStorage.setItem(ACTIVE_ATHLETE_KEY, athleteId);
}

function clearActiveSnapshotContext() {
  localStorage.removeItem(ACTIVE_SNAPSHOT_KEY);
  sessionStorage.removeItem(ACTIVE_SNAPSHOT_KEY);
}

function generateSnapshotId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "snapshot_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

function generateAthleteId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "athlete_" + Date.now() + "_" + Math.random().toString(36).slice(2);
}

function nowISO() {
  return new Date().toISOString();
}

function clean(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function normalizeSport(v) {
  return clean(v).toLowerCase();
}

function val(id) {
  return clean(document.getElementById(id)?.value);
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function valByName(name) {
  return clean(document.querySelector(`[name="${name}"]`)?.value);
}

function setByName(name, value) {
  const el = document.querySelector(`[name="${name}"]`);
  if (el) el.value = value ?? "";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function updateContinueRoute(snapshotId) {
  const btn = document.getElementById("viewProfileBtn");
  if (!btn) return;

  btn.href = snapshotId
    ? `athlete-dashboard.html?snapshot_id=${encodeURIComponent(snapshotId)}&from=athlete-record-intake`
    : "athlete-dashboard.html?from=athlete-record-intake";
}

/*
==========================================================
SCHEMA FILTER
Only sends columns known/expected by current STATS-CORE schema.
Extra fields remain protected inside raw_payload / JSONB payloads.
==========================================================
*/

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
    "social_profile_url",
    "game_film_url",
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
    "submitted_by_professional_id",
    "phnx_certified_id",
    "phnx_certification_status",
    "trust_classification",
    "source_organization",
    "submission_source",

    "sport_metric_payload",
    "source_claims_payload",
    "raw_payload",

    "headshot_url",
    "headshot_path",
    "headshot_filename",

    "submitted_at",
    "created_at",
    "updated_at",
    "last_source_update_at"
  ]);

  const cleanRow = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    if (allowed.has(key)) cleanRow[key] = value;
  });

  return cleanRow;
} 
