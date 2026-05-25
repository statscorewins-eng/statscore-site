/* ============================================================
   STATScore™ Core Spine
   File: statscore-core.js
   Version: STATSCORE-CORE-V1
   Purpose:
   Shared athlete intelligence, normalization,
   completion logic, competition weighting,
   role intelligence, and system-state utilities.
============================================================ */

window.STATScoreCore = (() => {

  /* ============================================================
     STORAGE KEYS
  ============================================================ */

  const KEYS = {

    SNAPSHOT_RECEIPT:
      "statscore_latest_snapshot_receipt_v1",

    SESSION:
      "statscore_session_v1",

    ROLE:
      "statscore_active_role_v1",

    ATHLETE:
      "statscore_active_athlete_v1"

  };

  /* ============================================================
     SUPPORTED SPORTS
  ============================================================ */

  const SUPPORTED_SPORTS = [
    "football",
    "basketball",
    "baseball",
    "track"
  ];

  /* ============================================================
     COMPETITION LEVEL INTELLIGENCE
  ============================================================ */

  const COMPETITION_LEVELS = {

    ELITE_NATIONAL:{
      label:"Elite National",
      weight:1.40,
      exposure:"HIGH"
    },

    ELITE_REGIONAL:{
      label:"Elite Regional",
      weight:1.28,
      exposure:"HIGH"
    },

    VERIFIED_VARSITY:{
      label:"Verified Varsity",
      weight:1.16,
      exposure:"ELEVATED"
    },

    STANDARD_VARSITY:{
      label:"Standard Varsity",
      weight:1.0,
      exposure:"NORMAL"
    },

    JV:{
      label:"Junior Varsity",
      weight:.82,
      exposure:"LIMITED"
    },

    REC_LEAGUE:{
      label:"Recreation",
      weight:.65,
      exposure:"LOW"
    }

  };

  /* ============================================================
     BASIC UTILITIES
  ============================================================ */

  function $(id){
    return document.getElementById(id);
  }

  function safe(value, fallback = ""){
    return (
      value === null ||
      value === undefined ||
      value === ""
    )
      ? fallback
      : value;
  }

  function text(id, value, fallback = "--"){
    const el = $(id);

    if (!el) return;

    el.textContent = safe(value, fallback);
  }

  function html(id, value = ""){
    const el = $(id);

    if (!el) return;

    el.innerHTML = value;
  }

  function getParam(name){
    return new URLSearchParams(
      window.location.search
    ).get(name);
  }

  function escapeHTML(value){

    return String(value || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");

  }

  /* ============================================================
     DATABASE CLIENT
  ============================================================ */

  function getClient(){

    const db =
      window.STATScoreData?.getClient?.();

    if (!db) {
      console.error(
        "STATScoreData client unavailable."
      );
      return null;
    }

    return db;

  }

  /* ============================================================
     SESSION + ROLE STATE
  ============================================================ */

  function setSession(session = {}){

    localStorage.setItem(
      KEYS.SESSION,
      JSON.stringify({
        ...session,
        updated_at:new Date().toISOString()
      })
    );

  }

  function getSession(){

    try {

      return JSON.parse(
        localStorage.getItem(KEYS.SESSION) || "{}"
      );

    } catch {

      return {};

    }

  }

  function setRole(role){

    if (!role) return;

    const normalized =
      String(role)
        .trim()
        .toLowerCase();

    localStorage.setItem(
      KEYS.ROLE,
      normalized
    );

    setSession({
      ...getSession(),
      role:normalized
    });

  }

  function getRole(){

    return (
      getParam("role") ||
      localStorage.getItem(KEYS.ROLE) ||
      getSession()?.role ||
      ""
    )
      .trim()
      .toLowerCase();

  }

  function roleLabel(role = getRole()){

    const labels = {

      athlete:"Athlete",
      parent:"Parent / Guardian",
      coach:"Coach",
      counselor:"Counselor",
      recruiter:"Recruiter",
      evaluator:"Evaluator",
      program:"Program",
      admin:"Admin"

    };

    return labels[role] || "Guest";

  }

  /* ============================================================
     SPORT HELPERS
  ============================================================ */

  function normalizeSport(value){

    return String(value || "")
      .trim()
      .toLowerCase();

  }

  function isSupportedSport(value){

    return SUPPORTED_SPORTS.includes(
      normalizeSport(value)
    );

  }

  /* ============================================================
     SNAPSHOT HELPERS
  ============================================================ */

  function getSnapshotId(){

    const direct =
      getParam("snapshot_id");

    if (direct) return direct;

    try {

      const receipt = JSON.parse(
        localStorage.getItem(
          KEYS.SNAPSHOT_RECEIPT
        ) || "{}"
      );

      return (
        receipt.snapshot_id ||
        receipt.id ||
        ""
      );

    } catch {

      return "";

    }

  }

  function splitName(fullName){

    const parts = String(
      fullName || "Athlete Profile"
    )
      .trim()
      .split(/\s+/);

    return {

      first:
        parts[0] || "Athlete",

      last:
        parts.slice(1).join(" ") ||
        "Profile"

    };

  }

  /* ============================================================
     SNAPSHOT NORMALIZATION
  ============================================================ */

  function normalizeSnapshot(row){

    if (!row) return null;

    const p =
      row.raw_payload ||
      row.payload ||
      row.profile_payload ||
      row.snapshot_payload ||
      row.data ||
      row;

    const firstName =
      p.firstName ||
      p.first_name ||
      row.first_name ||
      "";

    const lastName =
      p.lastName ||
      p.last_name ||
      row.last_name ||
      "";

    const displayName =

      p.athlete_display_name ||

      row.athlete_display_name ||

      [firstName,lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {

      snapshot_id:
        row.snapshot_id ||
        p.snapshot_id ||
        row.id ||
        p.id ||
        "",

      athlete_id:
        row.athlete_id ||
        p.athlete_id ||
        "",

      athlete_display_name:
        displayName,

      first_name:
        firstName,

      last_name:
        lastName,

      sport:
        p.primarySport ||
        p.primary_sport ||
        p.sport ||
        row.primary_sport ||
        "",

      position:
        p.primaryPosition ||
        p.primary_position ||
        p.position ||
        row.primary_position ||
        "",

      secondary_position:
        p.secondaryPosition ||
        p.secondary_position ||
        row.secondary_position ||
        "",

      graduation_class:
        p.graduationClass ||
        p.graduation_class ||
        row.graduation_class ||
        "",

      school:
        p.schoolProgram ||
        p.school_program ||
        p.school ||
        row.school_program ||
        "",

      city_state:
        p.cityState ||
        p.city_state ||
        row.city_state ||
        "",

      height:
        p.height ||
        row.height ||
        "",

      weight:
        p.weight ||
        row.weight ||
        "",

      jersey_number:
        p.jerseyNumber ||
        p.jersey_number ||
        row.jersey_number ||
        "",

      dash40:
        p.dash40 ||
        p.dash_40 ||
        row.dash40 ||
        "",

      vertical_jump:
        p.verticalJump ||
        p.vertical_jump ||
        row.vertical_jump ||
        "",

      shuttle:
        p.shuttle ||
        row.shuttle ||
        "",

      broad_jump:
        p.broadJump ||
        p.broad_jump ||
        row.broad_jump ||
        "",

      current_gpa:
        p.currentGpa ||
        p.current_gpa ||
        row.current_gpa ||
        "",

      ncaa_status:
        p.ncaaEligibilityStatus ||
        p.ncaa_eligibility_status ||
        row.ncaa_eligibility_status ||
        "",

      transcript_available:
        p.transcriptAvailable ||
        p.transcript_available ||
        row.transcript_available ||
        "",

      guardian_name:
        p.guardianName ||
        p.guardian_name ||
        row.guardian_name ||
        "",

      guardian_email:
        p.guardianEmail ||
        p.guardian_email ||
        row.guardian_email ||
        "",

      coach_name:
        p.coachName ||
        p.coach_name ||
        row.coach_name ||
        "",

      coach_email:
        p.coachEmail ||
        p.coach_email ||
        row.coach_email ||
        "",

      highlight_url:
        p.highlightUrl ||
        p.highlight_url ||
        row.highlight_url ||
        "",

      game_film_url:
        p.gameFilmUrl ||
        p.game_film_url ||
        row.game_film_url ||
        "",

      social_profile_url:
        p.socialProfileUrl ||
        p.social_profile_url ||
        row.social_profile_url ||
        "",

      recruiting_profile_url:
        p.recruitingProfileUrl ||
        p.recruiting_profile_url ||
        row.recruiting_profile_url ||
        "",

      headshot_public_url:

        p.headshotPublicUrl ||

        p.headshot_public_url ||

        row.headshot_public_url ||

        "",

      verification_status:
        row.verification_status ||
        p.verificationStatus ||
        p.verification_status ||
        "UNVERIFIED",

      score_status:
        row.score_status ||
        p.scoreStatus ||
        p.score_status ||
        "UNVERIFIED",

      snapshot_status:
        row.snapshot_status ||
        p.snapshotStatus ||
        p.snapshot_status ||
        "SUBMITTED",

      raw:p

    };

  }

  /* ============================================================
     LOAD SNAPSHOT
  ============================================================ */

  async function loadSnapshot(
    snapshotId = getSnapshotId()
  ){

    const db = getClient();

    if (!db || !snapshotId) {

      return {
        ok:false,
        status:"NO_CLIENT_OR_ID",
        snapshot:null
      };

    }

    /* ============================================
       RPC LOAD
    ============================================ */

    if (typeof db.rpc === "function") {

      const rpc = await db.rpc(
        "get_statscore_snapshot",
        {
          p_snapshot_id:snapshotId
        }
      );

      if (
        !rpc.error &&
        rpc.data?.success &&
        rpc.data?.snapshot
      ) {

        return {

          ok:true,

          status:"LOADED_RPC",

          snapshot:normalizeSnapshot(
            rpc.data.snapshot
          )

        };

      }

    }

    /* ============================================
       TABLE FALLBACK
    ============================================ */

    const { data, error } =
      await db
        .from("statscore_snapshots")
        .select("*")
        .or(
          `snapshot_id.eq.${snapshotId},id.eq.${snapshotId}`
        )
        .limit(1)
        .maybeSingle();

    if (error || !data) {

      return {

        ok:false,
        status:"NOT_FOUND",
        error,
        snapshot:null

      };

    }

    return {

      ok:true,

      status:"LOADED_TABLE",

      snapshot:
        normalizeSnapshot(data)

    };

  }

  /* ============================================================
     PROFILE COMPLETION
  ============================================================ */

  function profileCompletion(snapshot){

    if (!snapshot) {

      return {
        percent:0,
        missing:["snapshot"]
      };

    }

    const checks = [

      ["identity",
        snapshot.athlete_display_name],

      ["sport",
        snapshot.sport],

      ["position",
        snapshot.position],

      ["class",
        snapshot.graduation_class],

      ["school",
        snapshot.school],

      ["headshot",
        snapshot.headshot_public_url],

      ["metrics",
        snapshot.dash40 ||
        snapshot.vertical_jump ||
        snapshot.shuttle],

      ["film",
        snapshot.highlight_url ||
        snapshot.game_film_url],

      ["academics",
        snapshot.current_gpa ||
        snapshot.ncaa_status],

      ["guardian",
        snapshot.guardian_name ||
        snapshot.guardian_email],

      ["coach",
        snapshot.coach_name ||
        snapshot.coach_email]

    ];

    const complete =
      checks.filter(
        ([, value]) => !!value
      ).length;

    const missing =
      checks
        .filter(
          ([, value]) => !value
        )
        .map(
          ([key]) => key
        );

    return {

      percent:
        Math.round(
          (complete / checks.length) * 100
        ),

      complete,

      total:
        checks.length,

      missing

    };

  }

  function explainCompletion(snapshot){

    const c =
      profileCompletion(snapshot);

    if (!snapshot) {

      return "No athlete snapshot loaded.";

    }

    if (c.percent >= 90) {

      return `Profile is ${c.percent}% complete. Athlete record is near operational readiness.`;

    }

    return `Profile is ${c.percent}% complete. Missing lanes: ${c.missing.join(", ")}.`;

  }

  /* ============================================================
     COMPETITION INTELLIGENCE
  ============================================================ */

  function resolveCompetitionLevel(level){

    const key =
      String(level || "STANDARD_VARSITY")
        .trim()
        .toUpperCase();

    return (
      COMPETITION_LEVELS[key] ||
      COMPETITION_LEVELS.STANDARD_VARSITY
    );

  }

  function weightedScore(
    baseScore,
    competitionLevel
  ){

    const comp =
      resolveCompetitionLevel(
        competitionLevel
      );

    const score =
      Number(baseScore || 0);

    return Math.round(
      score * comp.weight
    );

  }

  /* ============================================================
     ROLE ACCESS
  ============================================================ */

  function canViewAcademics(role){

    return [

      "admin",
      "counselor",
      "parent"

    ].includes(
      String(role || "")
        .toLowerCase()
    );

  }

  function canViewRecruiting(role){

    return [

      "admin",
      "recruiter",
      "coach",
      "athlete",
      "parent"

    ].includes(
      String(role || "")
        .toLowerCase()
    );

  }

  function canEditEvaluation(role){

    return [

      "admin",
      "evaluator"

    ].includes(
      String(role || "")
        .toLowerCase()
    );

  }

  function canAccessFullProfile(role){

    return [

      "admin"

    ].includes(
      String(role || "")
        .toLowerCase()
    );

  }

  /* ============================================================
     SYSTEM STATE
  ============================================================ */

  function buildSystemState(snapshot){

    const completion =
      profileCompletion(snapshot);

    return {

      snapshot_loaded:
        !!snapshot,

      profile_completion:
        completion.percent,

      competition_weighting_active:
        true,

      supported_sport:
        isSupportedSport(
          snapshot?.sport
        ),

      media_ready:
        !!(
          snapshot?.headshot_public_url &&
          (
            snapshot?.highlight_url ||
            snapshot?.game_film_url
          )
        ),

      verification_ready:
        !!(
          snapshot?.guardian_name &&
          snapshot?.coach_name
        ),

      recruiting_ready:
        completion.percent >= 70,

      scoring_ready:
        completion.percent >= 80,

      exposure_ready:
        completion.percent >= 85

    };

  }

  /* ============================================================
     PUBLIC EXPORTS
  ============================================================ */

  return {

    KEYS,

    SUPPORTED_SPORTS,
    COMPETITION_LEVELS,

    $,
    safe,
    text,
    html,
    escapeHTML,

    getParam,
    getClient,

    setSession,
    getSession,

    setRole,
    getRole,
    roleLabel,

    normalizeSport,
    isSupportedSport,

    getSnapshotId,
    splitName,

    normalizeSnapshot,
    loadSnapshot,

    profileCompletion,
    explainCompletion,

    resolveCompetitionLevel,
    weightedScore,

    canViewAcademics,
    canViewRecruiting,
    canEditEvaluation,
    canAccessFullProfile,

    buildSystemState

  };

})(); 
