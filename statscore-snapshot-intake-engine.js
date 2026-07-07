/*
==========================================================
STATS-CORE™ SNAPSHOT INTAKE ENGINE
File: statscore-snapshot-intake-engine.js
Stream 2 — Athlete Record Intake & Evidence Provenance
==========================================================
*/

(function(){
  "use strict";

  const SNAPSHOT_TABLE = "statscore_snapshots";
  const PARENT_APPROVAL_TABLE = "sc_parent_approval_requests";
  const AUDIT_TABLE = "sc_snapshot_audit_receipts";

  const ACTIVE_SNAPSHOT_KEY = "STATSCORE_ACTIVE_SNAPSHOT_ID";

  let selectedHeadshotFile = null;
  let headshotState = {
    selected:false,
    uploaded:false,
    file_name:null,
    file_type:null,
    file_size:null,
    preview_url:null,
    storage_path:null,
    public_url:null,
    error:null
  };

  const SNAPSHOT_COLUMNS = [
    "athlete_id","snapshot_id",

    "first_name","last_name","graduation_class","city_state","school_program",
    "primary_sport","height","weight","primary_position","secondary_position",
    "dominant_hand_foot","jersey_number",

    "dash40","vertical_jump","shuttle","broad_jump","strength_marker",
    "verified_event_source","position_notes",

    "current_gpa","ncaa_eligibility_status","transcript_available",
    "counselor_contact_available","academic_notes",

    "highlight_url","social_profile_url","game_film_url","recruiting_profile_url",
    "headshot_url","headshot_path","headshot_file_name",

    "guardian_name","guardian_email","guardian_phone",
    "coach_name","coach_email","verification_permission",

    "verification_status","snapshot_status","score_status",
    "snapshot_stage","snapshot_year",

    "source_origin","submitted_by_role","submitted_by_name","submitted_by_email",
    "submitted_by_user_id","submitted_by_professional_id",
    "phnx_certified_id","phnx_certification_status",
    "source_organization","submission_source","trust_classification",

    "sport_metric_payload","source_claims_payload","raw_payload",

    "source_record_status","created_at","updated_at","last_source_update_at"
  ];

  function $(id){ return document.getElementById(id); }

  function nowISO(){ return new Date().toISOString(); }

  function msg(text, color){
    const el = $("systemMessage");
    if(!el) return;
    el.textContent = text || "";
    el.style.color = color || "#25d366";
  }

  function val(name){
    const el = document.querySelector(`[name="${name}"]`);
    return el ? String(el.value || "").trim() : "";
  }

  function setVal(name, value){
    const el = document.querySelector(`[name="${name}"]`);
    if(el) el.value = value || "";
  }

  function text(id, value){
    const el = $(id);
    if(el) el.textContent = value || "";
  }

  function getDbSafe(){
    if(typeof getDb === "function") return getDb();
    if(window.STATSCORE_DB) return window.STATSCORE_DB;
    if(window.supabaseClient) return window.supabaseClient;
    if(window.db) return window.db;
    throw new Error("Supabase client unavailable.");
  }

  function generateSnapshotId(){
    return window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : "snapshot_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  }

  function generateAthleteId(){
    return window.crypto?.randomUUID
      ? "athlete_" + window.crypto.randomUUID()
      : "athlete_" + Date.now() + "_" + Math.random().toString(36).slice(2);
  }

  function getActiveSnapshotId(){
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("snapshot_id") ||
      localStorage.getItem(ACTIVE_SNAPSHOT_KEY) ||
      sessionStorage.getItem(ACTIVE_SNAPSHOT_KEY) ||
      null
    );
  }

  function setActiveSnapshotId(snapshotId){
    if(!snapshotId) return;
    localStorage.setItem(ACTIVE_SNAPSHOT_KEY, snapshotId);
    sessionStorage.setItem(ACTIVE_SNAPSHOT_KEY, snapshotId);
    setVal("snapshotId", snapshotId);
  }

  function setActiveAthleteId(athleteId){
    if(!athleteId) return;
    setVal("athleteId", athleteId);
    localStorage.setItem("STATSCORE_ACTIVE_ATHLETE_ID", athleteId);
    sessionStorage.setItem("STATSCORE_ACTIVE_ATHLETE_ID", athleteId);
  }

  function filterSnapshotSchema(row){
    const clean = {};
    SNAPSHOT_COLUMNS.forEach(col => {
      if(row[col] !== undefined) clean[col] = row[col];
    });
    return clean;
  }

  function autoTrustFromSource(){
    const role = val("submittedByRole");
    const cert = val("phnxCertificationStatus");
    const origin = val("sourceOrigin");

    if(origin === "camp_combine") return "PHNX_SPORTS_COMBINE";
    if(cert === "valid" && role === "coach") return "PHNX_CERTIFIED_COACH";
    if(cert === "valid" && role === "evaluator") return "PHNX_CERTIFIED_EVALUATOR";
    if(cert === "valid" && role === "trainer") return "PHNX_CERTIFIED_TRAINER";
    if(role === "parent_guardian") return "PARENT_REPORTED";
    if(role === "coach") return "COACH_SUBMITTED";
    if(role === "evaluator") return "EVALUATOR_SUBMITTED";
    if(role === "trainer") return "TRAINER_SUBMITTED";
    return "SELF_REPORTED";
  }

  function syncTrustStatus(){
    const trust = val("trustClassification") || autoTrustFromSource();
    setVal("trustClassification", trust);

    text("statusTrust", trust.replaceAll("_"," "));
    text("statusSource", val("submittedByRole").replaceAll("_"," ") || "Self-Reported");
  }

  function updateSportBlocks(){
    const sport = val("primarySport");
    ["football","basketball","baseball","track"].forEach(s => {
      const block = $(`${s}Metrics`);
      if(block) block.classList.toggle("active", sport === s);
    });
  }

  function buildSportMetricPayload(){
    const sport = val("primarySport");

    const common = {
      sport,
      primary_position_or_event: val("primaryPosition"),
      secondary_position_or_event: val("secondaryPosition"),
      captured_at: nowISO(),
      trust_classification: val("trustClassification") || autoTrustFromSource(),
      source_origin: val("sourceOrigin"),
      submitted_by_role: val("submittedByRole")
    };

    const payloads = {
      football:{
        ...common,
        dash40: val("footballDash40"),
        vertical_jump: val("footballVerticalJump"),
        shuttle: val("footballShuttle"),
        broad_jump: val("footballBroadJump"),
        strength_marker: val("footballStrengthMarker"),
        verified_event_source: val("footballVerifiedEventSource"),
        notes: val("footballNotes")
      },
      basketball:{
        ...common,
        wingspan: val("basketballWingspan"),
        vertical_jump: val("basketballVerticalJump"),
        lane_agility: val("basketballLaneAgility"),
        court_sprint: val("basketballCourtSprint"),
        skill_marker: val("basketballSkillMarker"),
        verified_event_source: val("basketballVerifiedEventSource"),
        notes: val("basketballNotes")
      },
      baseball:{
        ...common,
        dash60: val("baseballDash60"),
        exit_velocity: val("baseballExitVelocity"),
        throwing_velocity: val("baseballThrowingVelocity"),
        pop_time: val("baseballPopTime"),
        bat_throw_side: val("baseballBatThrowSide"),
        verified_event_source: val("baseballVerifiedEventSource"),
        notes: val("baseballNotes")
      },
      track:{
        ...common,
        primary_event: val("trackPrimaryEvent"),
        best_time_or_mark: val("trackBestMark"),
        timing_type: val("trackTimingType"),
        meet_source: val("trackMeetSource"),
        split_data: val("trackSplitData"),
        verified_event_source: val("trackVerifiedEventSource"),
        notes: val("trackNotes")
      }
    };

    return payloads[sport] || common;
  }

  function buildSourceClaimsPayload(){
    return {
      source_origin: val("sourceOrigin"),
      submitted_by_role: val("submittedByRole"),
      submitted_by_name: val("submittedByName"),
      submitted_by_email: val("submittedByEmail"),
      phnx_certified_id: val("phnxCertifiedId"),
      phnx_certification_status: val("phnxCertificationStatus"),
      source_organization: val("sourceOrganization"),
      submission_source: val("submissionSource"),
      trust_classification: val("trustClassification") || autoTrustFromSource(),
      captured_at: nowISO()
    };
  }

  function buildSnapshotPayload(status){
    syncTrustStatus();

    const sportMetricPayload = buildSportMetricPayload();
    const sourceClaimsPayload = buildSourceClaimsPayload();

    setVal("sportMetricPayload", JSON.stringify(sportMetricPayload));
    setVal("sourceClaimsPayload", JSON.stringify(sourceClaimsPayload));

    const payload = {
      athlete_id: val("athleteId") || null,
      snapshot_id: val("snapshotId") || getActiveSnapshotId() || null,

      first_name: val("firstName"),
      last_name: val("lastName"),
      graduation_class: val("graduationClass"),
      city_state: val("cityState"),
      school_program: val("schoolProgram"),
      primary_sport: val("primarySport"),

      height: val("height"),
      weight: val("weight"),
      primary_position: val("primaryPosition"),
      secondary_position: val("secondaryPosition"),
      dominant_hand_foot: val("dominantHandFoot"),
      jersey_number: val("jerseyNumber"),

      dash40: sportMetricPayload.dash40 || "",
      vertical_jump: sportMetricPayload.vertical_jump || "",
      shuttle: sportMetricPayload.shuttle || "",
      broad_jump: sportMetricPayload.broad_jump || "",
      strength_marker: sportMetricPayload.strength_marker || "",
      verified_event_source: sportMetricPayload.verified_event_source || "",
      position_notes: sportMetricPayload.notes || "",

      current_gpa: val("currentGpa"),
      ncaa_eligibility_status: val("ncaaEligibilityStatus"),
      transcript_available: val("transcriptAvailable"),
      counselor_contact_available: val("counselorContactAvailable"),
      academic_notes: val("academicNotes"),

      highlight_url: val("highlightUrl"),
      social_profile_url: val("socialProfileUrl"),
      game_film_url: val("gameFilmUrl"),
      recruiting_profile_url: val("recruitingProfileUrl"),
      headshot_url: val("headshotUrl"),
      headshot_path: val("headshotPath"),
      headshot_file_name: val("headshotFileName"),

      guardian_name: val("guardianName"),
      guardian_email: val("guardianEmail"),
      guardian_phone: val("guardianPhone"),
      coach_name: val("coachName"),
      coach_email: val("coachEmail"),
      verification_permission: val("verificationPermission"),

      source_origin: val("sourceOrigin"),
      submitted_by_role: val("submittedByRole"),
      submitted_by_name: val("submittedByName"),
      submitted_by_email: val("submittedByEmail"),
      phnx_certified_id: val("phnxCertifiedId"),
      phnx_certification_status: val("phnxCertificationStatus"),
      source_organization: val("sourceOrganization"),
      submission_source: val("submissionSource"),
      trust_classification: val("trustClassification") || autoTrustFromSource(),

      sport_metric_payload: sportMetricPayload,
      source_claims_payload: sourceClaimsPayload,
      raw_payload: {
        form_version:"athlete-record-intake-v2",
        sport_metric_payload: sportMetricPayload,
        source_claims_payload: sourceClaimsPayload,
        headshot_state: headshotState
      },

      verification_status: "pending",
      snapshot_status: status || "submitted",
      score_status: "not_issued",
      source_record_status: status || "submitted",
      updated_at: nowISO(),
      last_source_update_at: nowISO()
    };

    return payload;
  }

  async function writeSnapshotAuditReceipt(receipt){
    try{
      if(!receipt?.snapshot_id) return;
      const db = getDbSafe();

      const payload = {
        receipt_type: receipt.action || "SNAPSHOT_SOURCE_EVENT",
        snapshot_id: receipt.snapshot_id,
        athlete_id: receipt.athlete_id || null,
        before_record: receipt.before_record || null,
        after_record: receipt.after_record || null,
        created_at: nowISO()
      };

      const { error } = await db.from(AUDIT_TABLE).insert(payload);
      if(error && window.STATSCORE_DEBUG){
        console.warn("Snapshot audit receipt not written:", error);
      }
    }catch(err){
      if(window.STATSCORE_DEBUG) console.warn("Snapshot audit receipt skipped:", err);
    }
  }

  async function insertSnapshot(row){
    const db = getDbSafe();
    const cleanRow = filterSnapshotSchema(row || {});
    const incomingSnapshotId =
      cleanRow.snapshot_id ||
      row?.snapshot_id ||
      getActiveSnapshotId();

    if(window.STATSCORE_DEBUG){
      console.log("SNAPSHOT INSERT ROW:", row);
      console.log("SNAPSHOT CLEAN ROW:", cleanRow);
      console.log("SNAPSHOT RESOLVED ID:", incomingSnapshotId);
    }

    if(incomingSnapshotId){
      const { data: existingData, error: existingError } = await db
        .from(SNAPSHOT_TABLE)
        .select("*")
        .eq("snapshot_id", incomingSnapshotId)
        .maybeSingle();

      if(existingError){
        throw new Error(existingError.message || "Snapshot lookup failed.");
      }

      if(existingData){
        const updatePayload = {
          ...cleanRow,
          snapshot_id: existingData.snapshot_id,
          athlete_id: existingData.athlete_id || cleanRow.athlete_id || row?.athlete_id || generateAthleteId(),
          updated_at: nowISO(),
          last_source_update_at: nowISO()
        };

        await writeSnapshotAuditReceipt({
          action:"SNAPSHOT_SOURCE_UPDATE",
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

        if(error) throw new Error(error.message || "Snapshot update failed.");

        setActiveSnapshotId(data.snapshot_id);
        setActiveAthleteId(data.athlete_id);
        return data;
      }
    }

    const createPayload = {
      ...cleanRow,
      snapshot_id: cleanRow.snapshot_id || generateSnapshotId(),
      athlete_id: cleanRow.athlete_id || generateAthleteId(),
      created_at: cleanRow.created_at || nowISO(),
      updated_at: nowISO(),
      last_source_update_at: nowISO()
    };

    const { data, error } = await db
      .from(SNAPSHOT_TABLE)
      .insert(createPayload)
      .select("*")
      .single();

    if(error) throw new Error(error.message || "Snapshot insert failed.");

    await writeSnapshotAuditReceipt({
      action:"SNAPSHOT_SOURCE_CREATE",
      snapshot_id:data.snapshot_id,
      athlete_id:data.athlete_id,
      before_record:null,
      after_record:data
    });

    setActiveSnapshotId(data.snapshot_id);
    setActiveAthleteId(data.athlete_id);
    return data;
  }

  function setHeadshotVisual(state, fileName){
    const box = $("headshotUploadBox");
    if(box){
      box.classList.remove("ready","error");
      if(state) box.classList.add(state);
    }

    if(state === "ready"){
      text("headshotUploadText","HEADSHOT READY");
      text("headshotUploadHint", fileName || "Selected image ready");
      text("mediaStatusHeadshot","Ready");
      text("statusPhnxMedia","Ready");
      text("mediaQueueBadge","Media Ready");
    }

    if(state === "error"){
      text("mediaStatusHeadshot","Error");
      text("statusPhnxMedia","Error");
      text("mediaQueueBadge","Media Error");
    }
  }

  function initHeadshotIngest(){
    const input = $("athleteHeadshotUpload");
    const box = $("headshotUploadBox");
    const add = $("addHeadshotBtn");
    const remove = $("removeHeadshotBtn");
    const preview = $("headshotPreview");

    if(!input || !box) return;

    const openPicker = e => {
      if(e){ e.preventDefault(); e.stopPropagation(); }
      input.click();
    };

    box.addEventListener("click", openPicker);
    if(add) add.addEventListener("click", openPicker);

    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if(!file) return;

      const name = String(file.name || "").toLowerCase();
      const allowed =
        ["image/png","image/jpeg","image/jpg","image/webp","image/heic","image/heif"].includes(file.type) ||
        [".png",".jpg",".jpeg",".webp",".heic",".heif"].some(ext => name.endsWith(ext));

      if(!allowed){
        selectedHeadshotFile = null;
        input.value = "";
        setHeadshotVisual("error");
        msg("Unsupported headshot format. Use JPG, PNG, WEBP, HEIC, or HEIF.", "#ff2b1f");
        return;
      }

      selectedHeadshotFile = file;

      const reader = new FileReader();
      reader.onload = evt => {
        const previewUrl = evt.target.result;

        if(preview){
          preview.src = previewUrl;
          preview.style.display = "block";
        }

        if(remove) remove.style.display = "flex";

        headshotState = {
          selected:true,
          uploaded:false,
          file_name:file.name,
          file_type:file.type || "unknown",
          file_size:file.size || 0,
          preview_url:previewUrl,
          storage_path:null,
          public_url:null,
          error:null
        };

        setVal("headshotFileName", file.name);
        setHeadshotVisual("ready", file.name);
        msg("Headshot selected and ready for upload.", "#25d366");
      };

      reader.onerror = () => {
        selectedHeadshotFile = null;
        setHeadshotVisual("error");
        msg("Headshot preview failed. Try another image.", "#ff2b1f");
      };

      reader.readAsDataURL(file);
    });

    if(remove){
      remove.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        selectedHeadshotFile = null;
        input.value = "";
        if(preview){
          preview.removeAttribute("src");
          preview.style.display = "none";
        }

        remove.style.display = "none";
        headshotState = {
          selected:false,
          uploaded:false,
          file_name:null,
          file_type:null,
          file_size:null,
          preview_url:null,
          storage_path:null,
          public_url:null,
          error:null
        };

        setVal("headshotUrl","");
        setVal("headshotPath","");
        setVal("headshotFileName","");
        text("headshotUploadText","PHNX SPORTS MEDIA INGEST");
        text("headshotUploadHint","Click to upload JPG, PNG, WEBP, HEIC, or HEIF");
        text("mediaStatusHeadshot","Required");
        text("statusPhnxMedia","Not Queued");
        text("mediaQueueBadge","Media Queue Pending");
        msg("Headshot removed.", "#f4c542");
      });
    }
  }

  function cleanFilePart(value){
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g,"-")
      .replace(/-+/g,"-")
      .replace(/^-|-$/g,"")
      .slice(0,80);
  }

  async function uploadHeadshotForSnapshot(snapshotId, athleteId){
    if(!selectedHeadshotFile){
      return { uploaded:false, skipped:true, reason:"No headshot selected." };
    }

    const db = getDbSafe();
    const bucketCandidates = [
      window.STATSCORE_HEADSHOT_BUCKET || "athlete-headshots",
      window.STATSCORE_MEDIA_BUCKET || "statscore-media",
      "headshots",
      "athlete-media"
    ];

    const file = selectedHeadshotFile;
    const safeSnapshot = cleanFilePart(snapshotId);
    const safeAthlete = cleanFilePart(athleteId || "athlete");
    const safeName = cleanFilePart(file.name || "headshot");
    const path = `${safeSnapshot}/${safeAthlete}-${Date.now()}-${safeName}`;

    let lastError = null;

    for(const bucket of bucketCandidates){
      try{
        const { data, error } = await db.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl:"3600",
            upsert:true,
            contentType:file.type || undefined
          });

        if(error) throw error;

        const publicResult = db.storage.from(bucket).getPublicUrl(path);
        const publicUrl = publicResult?.data?.publicUrl || null;

        headshotState.uploaded = true;
        headshotState.storage_path = path;
        headshotState.public_url = publicUrl;

        setVal("headshotUrl", publicUrl);
        setVal("headshotPath", path);
        text("mediaStatusHeadshot","Uploaded");
        text("statusPhnxMedia","Queued");
        text("mediaQueueBadge","Media Uploaded");

        return {
          uploaded:true,
          bucket,
          storage_path:path,
          public_url:publicUrl,
          upload_data:data
        };

      }catch(err){
        lastError = err;
        if(window.STATSCORE_DEBUG){
          console.warn("Headshot upload failed for bucket:", bucket, err);
        }
      }
    }

    throw new Error(lastError?.message || "Headshot upload failed. Check Supabase Storage bucket/policies.");
  }

  async function createParentApprovalRequest(snapshot){
    try{
      if(!snapshot?.snapshot_id || !snapshot?.guardian_email) return;

      const db = getDbSafe();

      const payload = {
        snapshot_id:snapshot.snapshot_id,
        athlete_id:snapshot.athlete_id || null,
        athlete_name:[snapshot.first_name, snapshot.last_name].filter(Boolean).join(" "),
        guardian_name:snapshot.guardian_name || null,
        guardian_email:snapshot.guardian_email || null,
        guardian_phone:snapshot.guardian_phone || null,
        request_status:"pending",
        requested_at:nowISO(),
        created_at:nowISO(),
        updated_at:nowISO()
      };

      const { error } = await db.from(PARENT_APPROVAL_TABLE).insert(payload);
      if(error && window.STATSCORE_DEBUG){
        console.warn("Parent approval request not created:", error);
      }
    }catch(err){
      if(window.STATSCORE_DEBUG){
        console.warn("Parent approval request skipped:", err);
      }
    }
  }

  function validateRequired(){
    if(!val("firstName")) throw new Error("First name is required.");
    if(!val("lastName")) throw new Error("Last name is required.");
    if(!val("primarySport")) throw new Error("Primary sport is required.");
    if(!val("sourceOrigin")) throw new Error("Source origin is required.");
    if(!val("submittedByRole")) throw new Error("Submitted by role is required.");
  }

  async function submitSnapshot(status, routeAfter){
    const btn = $("submitSnapshotBtn");

    try{
      if(btn) btn.disabled = true;

      validateRequired();

      msg(status === "draft" ? "Saving draft..." : "Creating athlete record...", "#f4c542");

      let payload = buildSnapshotPayload(status);
      let saved = await insertSnapshot(payload);

      if(selectedHeadshotFile){
        msg("Uploading headshot...", "#f4c542");

        const upload = await uploadHeadshotForSnapshot(saved.snapshot_id, saved.athlete_id);

        if(upload?.uploaded){
          payload = {
            ...saved,
            headshot_url:upload.public_url || saved.headshot_url || null,
            headshot_path:upload.storage_path || saved.headshot_path || null,
            headshot_file_name:headshotState.file_name || saved.headshot_file_name || null,
            raw_payload:{
              ...(saved.raw_payload || {}),
              headshot_state:headshotState
            }
          };

          saved = await insertSnapshot(payload);
        }
      }

      setActiveSnapshotId(saved.snapshot_id);
      setActiveAthleteId(saved.athlete_id);

      if(status !== "draft"){
        await createParentApprovalRequest(saved);
      }

      text("statusProfile", status === "draft" ? "Draft Saved" : "Created");
      text("statusVerification", saved.verification_status || "Pending");
      text("recordBadge", status === "draft" ? "Draft Saved" : "Record Created");

      msg(status === "draft" ? "Draft saved." : "Athlete Record submitted.", "#25d366");

      if(routeAfter){
        setTimeout(() => {
          window.location.href = `${routeAfter}?snapshot_id=${encodeURIComponent(saved.snapshot_id)}`;
        }, 700);
      }

      return saved;

    }catch(err){
      console.error("Athlete Record Intake failed:", err);
      msg(err.message || "Athlete Record Intake failed.", "#ff2b1f");
      if(btn) btn.disabled = false;
      throw err;
    }
  }

  async function loadSnapshot(snapshotId){
    if(!snapshotId) return;

    const db = getDbSafe();

    const { data, error } = await db
      .from(SNAPSHOT_TABLE)
      .select("*")
      .eq("snapshot_id", snapshotId)
      .maybeSingle();

    if(error) throw new Error(error.message || "Snapshot load failed.");
    if(!data) return;

    setActiveSnapshotId(data.snapshot_id);
    setActiveAthleteId(data.athlete_id);

    setVal("athleteId", data.athlete_id);
    setVal("snapshotId", data.snapshot_id);

    setVal("firstName", data.first_name);
    setVal("lastName", data.last_name);
    setVal("graduationClass", data.graduation_class);
    setVal("cityState", data.city_state);
    setVal("schoolProgram", data.school_program);
    setVal("primarySport", data.primary_sport);

    setVal("height", data.height);
    setVal("weight", data.weight);
    setVal("primaryPosition", data.primary_position);
    setVal("secondaryPosition", data.secondary_position);
    setVal("dominantHandFoot", data.dominant_hand_foot);
    setVal("jerseyNumber", data.jersey_number);

    setVal("currentGpa", data.current_gpa);
    setVal("ncaaEligibilityStatus", data.ncaa_eligibility_status);
    setVal("transcriptAvailable", data.transcript_available);
    setVal("counselorContactAvailable", data.counselor_contact_available);
    setVal("academicNotes", data.academic_notes);

    setVal("highlightUrl", data.highlight_url);
    setVal("socialProfileUrl", data.social_profile_url);
    setVal("gameFilmUrl", data.game_film_url);
    setVal("recruitingProfileUrl", data.recruiting_profile_url);
    setVal("headshotUrl", data.headshot_url);
    setVal("headshotPath", data.headshot_path);
    setVal("headshotFileName", data.headshot_file_name);

    setVal("guardianName", data.guardian_name);
    setVal("guardianEmail", data.guardian_email);
    setVal("guardianPhone", data.guardian_phone);
    setVal("coachName", data.coach_name);
    setVal("coachEmail", data.coach_email);
    setVal("verificationPermission", data.verification_permission);

    setVal("sourceOrigin", data.source_origin || "athlete_self");
    setVal("submittedByRole", data.submitted_by_role || "athlete");
    setVal("submittedByName", data.submitted_by_name);
    setVal("submittedByEmail", data.submitted_by_email);
    setVal("phnxCertifiedId", data.phnx_certified_id);
    setVal("phnxCertificationStatus", data.phnx_certification_status || "not_provided");
    setVal("sourceOrganization", data.source_organization);
    setVal("submissionSource", data.submission_source || "snapshot-intake.html");
    setVal("trustClassification", data.trust_classification || autoTrustFromSource());

    const sportPayload = data.sport_metric_payload || {};

    Object.entries(sportPayload).forEach(([key,value]) => {
      const sport = data.primary_sport || "";
      const fieldName = sport + key.charAt(0).toUpperCase() + key.slice(1);
      setVal(fieldName, value);
    });

    if(data.headshot_url){
      const preview = $("headshotPreview");
      if(preview){
        preview.src = data.headshot_url;
        preview.style.display = "block";
      }
      setHeadshotVisual("ready", data.headshot_file_name || "Existing headshot");
    }

    updateSportBlocks();
    syncTrustStatus();

    text("statusProfile","Loaded");
    text("recordBadge","Record Loaded");
    msg("Existing Athlete Record loaded.", "#25d366");
  }

  function bindRuntime(){
    const sport = $("primarySport");
    const source = $("sourceOrigin");
    const role = $("submittedByRole");
    const cert = $("phnxCertificationStatus");
    const trust = $("trustClassification");

    if(sport) sport.addEventListener("change", updateSportBlocks);
    [source, role, cert, trust].forEach(el => {
      if(el) el.addEventListener("change", syncTrustStatus);
    });

    const submitBtn = $("submitSnapshotBtn");
    const draftBtn = $("saveDraftBtn");
    const verifyBtn = $("requestVerificationBtn");
    const dashBtn = $("viewProfileBtn");

    if(submitBtn){
      submitBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        submitSnapshot("submitted", "parent-approval.html");
      });
    }

    if(draftBtn){
      draftBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        submitSnapshot("draft", null);
      });
    }

    if(verifyBtn){
      verifyBtn.addEventListener("click", async e => {
        e.preventDefault();
        e.stopPropagation();

        const snapshotId = getActiveSnapshotId();
        if(!snapshotId){
          msg("Save or submit the Athlete Record before requesting verification.", "#ff2b1f");
          return;
        }

        window.location.href = `verification-request.html?snapshot_id=${encodeURIComponent(snapshotId)}`;
      });
    }

    if(dashBtn){
      dashBtn.addEventListener("click", e => {
        const snapshotId = getActiveSnapshotId();
        if(!snapshotId) return;
        e.preventDefault();
        window.location.href = `athlete-dashboard.html?snapshot_id=${encodeURIComponent(snapshotId)}`;
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async function(){
    try{
      initHeadshotIngest();
      bindRuntime();
      updateSportBlocks();
      syncTrustStatus();

      const snapshotId = getActiveSnapshotId();
      if(snapshotId){
        await loadSnapshot(snapshotId);
      }else{
        msg("Athlete Record Intake ready.", "#25d366");
      }

      if(window.STATSCORE_DEBUG){
        console.log("STATS-CORE Athlete Record Intake Engine ready.");
      }

    }catch(err){
      console.error("Snapshot Intake Engine initialization failed:", err);
      msg(err.message || "Snapshot Intake Engine failed to initialize.", "#ff2b1f");
    }
  });

  window.insertSnapshot = insertSnapshot;
  window.submitSnapshot = submitSnapshot;
  window.loadSnapshot = loadSnapshot;
  window.filterSnapshotSchema = filterSnapshotSchema;
  window.getActiveSnapshotId = getActiveSnapshotId;
  window.setActiveSnapshotId = setActiveSnapshotId;
  window.uploadHeadshotForSnapshot = uploadHeadshotForSnapshot;
  window.getSelectedHeadshotFile = () => selectedHeadshotFile;
  window.getHeadshotIngestState = () => ({...headshotState});

})(); 
