/* ============================================================
   STATS-CORE™ PLAYER PROFILE RUNTIME
   File: statscore-player-profile-runtime.js
   Version: STATSCORE-PLAYER-PROFILE-RUNTIME-V2
   Owner: Stream 3 — Athlete Intelligence Presentation

   Purpose:
   Loads active snapshot_id, renders Player Profile identity/metrics,
   and consumes Stream 9 Score Authority intelligence.

   Canon:
   Stream 3 displays intelligence.
   Stream 9 produces governed intelligence.
============================================================ */

(function(){
  "use strict";

  const ENGINE = "statscore-player-profile-runtime.js";
  const VERSION = "STATSCORE-PLAYER-PROFILE-RUNTIME-V2";

  const SUPABASE_URL = "https://oyjmpbuxvfxusmbouldi.supabase.co";
  const SUPABASE_ANON_KEY = "PASTE_YOUR_EXISTING_SUPABASE_ANON_KEY_HERE";

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

  function safe(value, fallback = "—"){
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  function n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function setText(selectors, value, fallback = "—"){
    selectors.forEach(function(sel){
      const el = qs(sel);
      if(el) el.textContent = safe(value, fallback);
    });
  }

  function getSnapshotId(){
    const params = new URLSearchParams(window.location.search);

    return String(
      params.get("snapshot_id") ||
      params.get("snapshot") ||
      params.get("id") ||
      localStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      localStorage.getItem("statscore_active_snapshot_id") ||
      localStorage.getItem("statscore_current_snapshot_id") ||
      localStorage.getItem("statscore_snapshot_id") ||
      sessionStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      sessionStorage.getItem("statscore_active_snapshot_id") ||
      ""
    ).trim();
  }

  function getDb(){
    return (
      window.STATScoreData?.getClient?.() ||
      window.STATScoreSupabase ||
      window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY) ||
      null
    );
  }

  function scoreAuthority(){
    return window.STATSCORE_SCORE_AUTHORITY_ENGINE || null;
  }

  function normalizePayload(row){
    let payload = row?.intake_payload || row?.raw_payload || {};

    if(typeof payload === "string"){
      try{ payload = JSON.parse(payload); }
      catch(e){ payload = {}; }
    }

    const first = row?.first_name || payload.firstName || payload.first_name || "";
    const last = row?.last_name || payload.lastName || payload.last_name || "";

    return {
      raw_row: row,
      raw_payload: payload,

      snapshot_id: row?.snapshot_id || payload.snapshot_id || "",
      athlete_id: row?.athlete_id || payload.athlete_id || "",

      athlete_name:
        row?.athlete_display_name ||
        row?.athlete_name ||
        payload.athlete_display_name ||
        `${first} ${last}`.trim() ||
        "Athlete",

      first_name: first,
      last_name: last,

      sport:
        row?.primary_sport ||
        row?.sport ||
        payload.primarySport ||
        payload.primary_sport ||
        payload.sport ||
        "",

      position:
        row?.primary_position ||
        row?.position ||
        payload.primaryPosition ||
        payload.primary_position ||
        payload.position ||
        "",

      secondary_position:
        row?.secondary_position ||
        payload.secondaryPosition ||
        payload.secondary_position ||
        "",

      height: row?.height || payload.height || "",
      weight: row?.weight || payload.weight || "",

      graduation_class:
        row?.graduation_class ||
        row?.class_year ||
        payload.graduationClass ||
        payload.graduation_year ||
        payload.gradYear ||
        payload.classYear ||
        "",

      city:
        row?.city ||
        payload.city ||
        "",

      state:
        row?.state ||
        payload.state ||
        "",

      city_state:
        row?.city_state ||
        payload.cityState ||
        payload.city_state ||
        [payload.city, payload.state].filter(Boolean).join(", ") ||
        "",

      school:
        row?.school_program ||
        row?.school ||
        payload.schoolProgram ||
        payload.school ||
        "",

      gpa:
        row?.current_gpa ||
        row?.gpa ||
        payload.currentGpa ||
        payload.current_gpa ||
        payload.gpa ||
        payload.coreGpa ||
        "",

      sat:
        row?.sat ||
        row?.sat_score ||
        payload.sat ||
        payload.satScore ||
        "",

      act:
        row?.act ||
        row?.act_score ||
        payload.act ||
        payload.actScore ||
        "",

      class_rank:
        row?.class_rank ||
        payload.classRank ||
        payload.class_rank ||
        "",

      ncaa_status:
        row?.ncaa_eligibility_status ||
        row?.ncaa_status ||
        payload.ncaaEligibilityStatus ||
        payload.ncaa_status ||
        "",

      transcript_available:
        payload.transcriptAvailable ||
        payload.transcript_available ||
        "",

      counselor_contact:
        payload.counselorContact ||
        payload.counselor_contact ||
        "",

      forty:
        row?.dash40 ||
        row?.dash_40 ||
        payload.dash40 ||
        payload.fortyDash ||
        payload.forty ||
        "",

      vertical:
        row?.vertical_jump ||
        payload.verticalJump ||
        payload.vertical ||
        "",

      shuttle:
        row?.shuttle ||
        payload.shuttle ||
        "",

      broad_jump:
        row?.broad_jump ||
        payload.broadJump ||
        payload.broad_jump ||
        "",

      strength_marker:
        row?.strength_marker ||
        payload.strengthMarker ||
        payload.strength_marker ||
        "",

      highlight_url:
        row?.highlight_url ||
        payload.highlightUrl ||
        payload.highlight_url ||
        "",

      game_film_url:
        row?.game_film_url ||
        payload.gameFilmUrl ||
        payload.game_film_url ||
        "",

      recruiting_profile_url:
        row?.recruiting_profile_url ||
        payload.recruitingProfileUrl ||
        payload.recruiting_profile_url ||
        "",

      social_url:
        row?.social_profile_url ||
        payload.socialProfileUrl ||
        payload.social_url ||
        "",

      headshot_url:
        row?.headshot_public_url ||
        row?.headshot_url ||
        payload.headshot_public_url ||
        payload.headshotUrl ||
        payload.headshot_url ||
        payload.athleteHeadshotUrl ||
        payload.photo_url ||
        payload.photo ||
        "",

      guardian_name:
        row?.guardian_name ||
        payload.guardianName ||
        payload.guardian_name ||
        "",

      guardian_email:
        row?.guardian_email ||
        payload.guardianEmail ||
        payload.guardian_email ||
        "",

      coach_name:
        row?.coach_name ||
        payload.coachName ||
        payload.coach_name ||
        "",

      coach_email:
        row?.coach_email ||
        payload.coachEmail ||
        payload.coach_email ||
        "",

      competition_level:
        row?.competition_level ||
        payload.competitionLevel ||
        payload.competition_level ||
        "",

      verification_status:
        row?.verification_status ||
        payload.verificationStatus ||
        payload.verification_status ||
        "UNVERIFIED",

      verification_authority:
        row?.verification_authority ||
        payload.verification_authority ||
        "SELF_REPORTED",

      position_score:
        row?.position_score ||
        payload.positionScore ||
        payload.position_score ||
        "",

      athletic_score:
        row?.athletic_score ||
        payload.athleticScore ||
        payload.athletic_score ||
        "",

      production_score:
        row?.production_score ||
        payload.productionScore ||
        payload.production_score ||
        "",

      academic_score:
        row?.academic_score ||
        payload.academicScore ||
        payload.academic_score ||
        "",

      character_score:
        row?.character_score ||
        payload.characterScore ||
        payload.character_score ||
        "",

      created_at: row?.created_at || ""
    };
  }

  async function loadSnapshot(){
    const snapshotId = getSnapshotId();
    const db = getDb();

    if(!db){
      console.error("STATS-CORE Player Profile: Supabase client unavailable.");
      return null;
    }

    if(snapshotId){
      const primary = await db
        .from("statscore_snapshots")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .maybeSingle();

      if(primary?.error){
        console.warn("Player Profile primary snapshot load failed:", primary.error);
      }

      if(primary?.data){
        localStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", primary.data.snapshot_id);
        localStorage.setItem("statscore_active_snapshot_id", primary.data.snapshot_id);
        localStorage.setItem("statscore_current_snapshot_id", primary.data.snapshot_id);
        sessionStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", primary.data.snapshot_id);

        return normalizePayload({
          __source_table: "statscore_snapshots",
          ...primary.data
        });
      }

      const fallback = await db
        .from("sc_snapshot_intakes")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .maybeSingle();

      if(fallback?.error){
        console.error("Player Profile fallback snapshot load failed:", fallback.error);
        return null;
      }

      if(fallback?.data){
        localStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", fallback.data.snapshot_id);
        localStorage.setItem("statscore_active_snapshot_id", fallback.data.snapshot_id);
        localStorage.setItem("statscore_current_snapshot_id", fallback.data.snapshot_id);
        sessionStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", fallback.data.snapshot_id);

        return normalizePayload({
          __source_table: "sc_snapshot_intakes",
          ...fallback.data
        });
      }

      return null;
    }

    const latest = await db
      .from("sc_snapshot_intakes")
      .select("*")
      .order("created_at", { ascending:false })
      .limit(1);

    if(latest?.error || !latest?.data?.length){
      console.error("STATS-CORE Player Profile: No snapshot found.", latest?.error);
      return null;
    }

    localStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", latest.data[0].snapshot_id);
    localStorage.setItem("statscore_active_snapshot_id", latest.data[0].snapshot_id);
    localStorage.setItem("statscore_current_snapshot_id", latest.data[0].snapshot_id);
    sessionStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", latest.data[0].snapshot_id);

    return normalizePayload({
      __source_table: "sc_snapshot_intakes",
      ...latest.data[0]
    });
  }

  function getScoreModel(snapshot){
    const engine = scoreAuthority();

    if(engine?.getProfileScoreModel){
      return engine.getProfileScoreModel(snapshot);
    }

    if(engine?.getDashboardScoreModel){
      return engine.getDashboardScoreModel(snapshot);
    }

    return {
      engine: ENGINE,
      version: VERSION,
      composite_status: "PENDING",
      composite_display_allowed: false,
      composite_value: "🔒",
      composite_state: "COMPOSITE SCORE PENDING",
      position_score: n(snapshot.position_score) ?? "—",
      athletic_score: n(snapshot.athletic_score) ?? "—",
      production_score: n(snapshot.production_score) ?? "—",
      academic_score: n(snapshot.academic_score) ?? "—",
      character_score: n(snapshot.character_score) ?? "—",
      score_status: snapshot.verification_status || "UNVERIFIED",
      final_score: n(snapshot.position_score) ?? n(snapshot.athletic_score) ?? null,
      matrix_id: "AUTHORITY_PENDING",
      risk_flags: [],
      why_this_signal: [],
      display_rule: "Stream 9 Score Authority unavailable."
    };
  }

  function renderIdentity(snapshot){
    setText([
      "[data-sc='athlete-name']",
      ".athlete-name",
      "#athleteName"
    ], snapshot.athlete_name);

    setText([
      "[data-sc='position']",
      "#primaryPosition"
    ], snapshot.position);

    setText([
      "[data-sc='school']",
      "#schoolName"
    ], snapshot.school);

    setText([
      "[data-sc='class']",
      "#gradClass"
    ], snapshot.graduation_class ? "Class of " + snapshot.graduation_class : "");

    setText(["[data-sc='height']"], snapshot.height);
    setText(["[data-sc='weight']"], snapshot.weight ? snapshot.weight + " lbs" : "");
    setText(["[data-sc='snapshot-id']", "#snapshotId"], snapshot.snapshot_id);
    setText(["[data-sc='location']"], snapshot.city_state || [snapshot.city, snapshot.state].filter(Boolean).join(", "));

    const photo = qs("[data-sc='headshot']") || qs(".profile-photo img") || qs(".athlete-photo img") || qs(".photo-box img");

    if(photo && snapshot.headshot_url){
      photo.src = snapshot.headshot_url;
      photo.alt = snapshot.athlete_name;
      photo.style.display = "block";
      photo.style.objectFit = "cover";
      photo.style.objectPosition = "center top";
    }
  }

  function renderMetrics(snapshot){
    const map = {
      "forty": snapshot.forty,
      "vertical": snapshot.vertical,
      "shuttle": snapshot.shuttle,
      "broad-jump": snapshot.broad_jump,
      "strength-marker": snapshot.strength_marker,
      "gpa": snapshot.gpa,
      "sat": snapshot.sat,
      "act": snapshot.act,
      "class-rank": snapshot.class_rank,
      "ncaa-status": snapshot.ncaa_status,
      "transcript": snapshot.transcript_available,
      "counselor": snapshot.counselor_contact
    };

    Object.keys(map).forEach(function(key){
      setText([`[data-sc='${key}']`], map[key]);
    });
  }

  function renderScoreFields(scoreModel){
    setText([
      "[data-sc='score']",
      "[data-sc='final-score']",
      "#scoreValue",
      "#scFinalScore"
    ], scoreModel.final_score ?? scoreModel.position_score ?? "—");

    setText([
      "[data-sc='score-status']",
      "#scoreStatus",
      "#signalText"
    ], scoreModel.score_status || scoreModel.star_signal?.label || "UNVERIFIED");

    setText([
      "[data-sc='matrix-version']",
      "#scMatrixVersion"
    ], scoreModel.matrix_id || "MATRIX_PENDING");

    setText([
      "[data-sc='star-signal']",
      "#scStarSignal"
    ], scoreModel.star_signal?.label || "Signal Pending");

    setText([
      "[data-sc='projection-lane']",
      "#scProjectionLane",
      "#evaluationStatus"
    ], scoreModel.projection_lane?.label || "Verification First");

    setText([
      "[data-sc='confidence']",
      "#scConfidence"
    ], scoreModel.confidence_score !== undefined ? scoreModel.confidence_score : "—");

    setText([
      "[data-sc='composite']",
      "[data-sc='composite-score']"
    ], scoreModel.composite_value || "🔒");

    setText([
      "[data-sc='composite-state']"
    ], scoreModel.composite_state || "COMPOSITE SCORE PENDING");

    setText(["[data-sc='athletic-score']"], scoreModel.athletic_score);
    setText(["[data-sc='production-score']"], scoreModel.production_score);
    setText(["[data-sc='academic-score']"], scoreModel.academic_score);
    setText(["[data-sc='character-score']"], scoreModel.character_score);
  }

  function renderWhyList(scoreModel){
    const whyList = qs("#scWhyList") || qs("[data-sc='why-list']");
    if(!whyList) return;

    const reasons = Array.isArray(scoreModel.why_this_signal)
      ? scoreModel.why_this_signal
      : [];

    if(!reasons.length){
      whyList.innerHTML = "<li>Explainability pending additional governed evidence.</li>";
      return;
    }

    whyList.innerHTML = reasons
      .map(reason => `<li>${String(reason)}</li>`)
      .join("");
  }

  function renderRiskFlags(scoreModel){
    const riskList = qs("#scRiskFlags") || qs("[data-sc='risk-flags']");
    if(!riskList) return;

    const flags = Array.isArray(scoreModel.risk_flags)
      ? scoreModel.risk_flags
      : [];

    if(!flags.length){
      riskList.innerHTML = "<li>No active risk flags generated.</li>";
      return;
    }

    riskList.innerHTML = flags
      .map(flag => `<li>${String(flag)}</li>`)
      .join("");
  }

  function renderStatscoreSnapshot(snapshot, scoreModel){
    const scoreSection = qs("#statscore-snapshot") || qs("[data-sc-section='statscore-snapshot']");
    if(!scoreSection) return;

    const status =
      scoreModel.score_status ||
      snapshot.verification_status ||
      "UNVERIFIED";

    const scoreDisplay =
      scoreModel.final_score ??
      scoreModel.position_score ??
      "—";

    const matrix =
      scoreModel.matrix_id ||
      "MATRIX_PENDING";

    const projection =
      scoreModel.projection_lane?.label ||
      "Verification First";

    const confidence =
      scoreModel.confidence_score !== undefined
        ? scoreModel.confidence_score
        : "—";

    scoreSection.innerHTML = `
      <div class="section-title">STATS-CORE / SNAPSHOT</div>

      <p><b>Current Signal:</b> ${safe(scoreDisplay)}</p>
      <p><b>Status:</b> ${safe(status).toUpperCase()}</p>
      <p><b>Matrix:</b> ${safe(matrix)}</p>
      <p><b>Projection Lane:</b> ${safe(projection)}</p>
      <p><b>Confidence:</b> ${safe(confidence)}</p>
      <p><b>Snapshot ID:</b> ${safe(snapshot.snapshot_id)}</p>

      <p><b>What it is:</b> The athlete’s current governed intelligence signal generated from submitted snapshot data, evidence quality, performance indicators, academic readiness, verification status, and governance status.</p>

      <p><b>Composite Status:</b> ${safe(scoreModel.composite_state || "COMPOSITE SCORE PENDING")}</p>

      <p><b>Why it matters:</b> STATS-CORE gives athletes, families, coaches, evaluators, recruiters, and programs a fast but explainable view of current athlete readiness while protecting the athlete from incomplete final composite judgment.</p>
    `;
  }

  function wireSnapshotLinks(snapshot){
    if(!snapshot.snapshot_id) return;

    qsa("a[href]").forEach(function(a){
      const href = a.getAttribute("href");
      if(!href) return;
      if(href.startsWith("#")) return;
      if(href.startsWith("mailto:")) return;
      if(href.startsWith("tel:")) return;

      const internalTargets = [
        "athlete-dashboard.html",
        "player-profile.html",
        "athlete-production-record.html",
        "athletic-snapshot.html",
        "academic-intelligence.html",
        "eligibility.html",
        "readiness.html",
        "pathway.html",
        "crystal-report.html",
        "crystal-registry.html",
        "phnx-sports-media.html",
        "recruiting-readiness.html",
        "recruiting-activity.html",
        "activity-feed.html",
        "media.html",
        "recruiter-access.html",
        "multi-box.html",
        "profile-access.html",
        "verification-request.html",
        "parent-approval.html",
        "athlete-intelligence.html"
      ];

      if(!internalTargets.some(target => href.includes(target))) return;

      const url = new URL(href, window.location.href);
      url.searchParams.set("snapshot_id", snapshot.snapshot_id);

      a.setAttribute("href", url.pathname.replace(/^\//, "") + url.search + url.hash);
      a.removeAttribute("aria-disabled");
      a.classList.remove("disabled");
    });
  }

  async function init(){
    console.log("STATS-CORE Player Profile Runtime Loaded:", VERSION);

    const snapshot = await loadSnapshot();

    if(!snapshot){
      console.warn("STATS-CORE Player Profile: snapshot unavailable.");
      return;
    }

    const scoreModel = getScoreModel(snapshot);

    renderIdentity(snapshot);
    renderMetrics(snapshot);
    renderScoreFields(scoreModel);
    renderWhyList(scoreModel);
    renderRiskFlags(scoreModel);
    renderStatscoreSnapshot(snapshot, scoreModel);
    wireSnapshotLinks(snapshot);

    console.log("PLAYER PROFILE SNAPSHOT:", snapshot);
    console.log("STREAM 9 SCORE MODEL:", scoreModel);
  }

  document.addEventListener("DOMContentLoaded", init);

})(); 
