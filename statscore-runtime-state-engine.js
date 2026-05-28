/* ============================================================
   STATScore™ Runtime State Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Live Runtime State Authority → Hydration → Sync → System Heartbeat
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "sc-runtime-state-engine";
  const VERSION = "v1.0-live-state-authority";

  const DEFAULT_STATE = {
    initialized: false,
    booted_at: null,
    updated_at: null,

    active_role: "SYSTEM",
    active_user: null,

    active_athlete: null,
    active_snapshot_id: null,
    active_athlete_id: null,

    active_program: null,
    active_recruiter: null,
    active_event: null,

    athlete_intelligence: null,
    verification: null,
    evidence: null,
    readiness: null,
    pathway: null,
    eligibility: null,

    crystal_report: null,
    program_intelligence: null,
    phnx_ranking_board: null,

    multibox_context: null,
    multibox_evaluation: null,

    camp_combine_matches: null,
    recruiter_verification: null,

    receipts: [],
    errors: [],
    warnings: [],

    heartbeat: {
      status: "IDLE",
      count: 0,
      last_beat_at: null
    }
  };

  let STATE = structuredClone(DEFAULT_STATE);

  function now() {
    return new Date().toISOString();
  }

  function log(message, payload) {
    console.log(`[STATScore Runtime State] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Runtime State] ${message}`, payload || "");

    STATE.warnings.push({
      message,
      payload: payload || null,
      created_at: now()
    });
  }

  function error(message, payload) {
    console.error(`[STATScore Runtime State] ${message}`, payload || "");

    STATE.errors.push({
      message,
      payload: payload || null,
      created_at: now()
    });
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function getSupabase() {
    return (
      window.STATScoreSupabase ||
      window.supabaseClient ||
      null
    );
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function publishState() {
    window.STATScoreRuntimeState = STATE;

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.RuntimeState = STATE;

    return STATE;
  }

  function setState(patch = {}, meta = {}) {
    STATE = {
      ...STATE,
      ...patch,
      updated_at: now()
    };

    publishState();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("runtime_state_updated", {
        engine: ENGINE_ID,
        version: VERSION,
        meta,
        state: snapshot()
      });
    }

    return STATE;
  }

  function snapshot() {
    return clone(STATE);
  }

  function resetState() {
    STATE = structuredClone(DEFAULT_STATE);
    STATE.initialized = true;
    STATE.booted_at = now();
    STATE.updated_at = now();

    publishState();

    return STATE;
  }

  function createRuntimeReceipt(type, payload = {}) {
    const receipt = {
      receipt_id:
        "sc_runtime_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      engine_id: ENGINE_ID,
      version: VERSION,

      receipt_type: type || "RUNTIME_EVENT",

      payload,

      created_at: now()
    };

    STATE.receipts.push(receipt);
    STATE.updated_at = now();

    publishState();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("runtime_receipt_created", receipt);
    }

    return receipt;
  }

  function heartbeat() {
    STATE.heartbeat.count += 1;
    STATE.heartbeat.status = "ONLINE";
    STATE.heartbeat.last_beat_at = now();
    STATE.updated_at = now();

    publishState();

    return STATE.heartbeat;
  }

  async function fetchSingleFromSupabase(table, column, value) {
    const client = getSupabase();

    if (!client) {
      warn("Supabase client unavailable.");
      return null;
    }

    if (!table || !column || !value) {
      warn("Invalid Supabase fetch request.", { table, column, value });
      return null;
    }

    const { data, error: sbError } = await client
      .from(table)
      .select("*")
      .eq(column, value)
      .maybeSingle();

    if (sbError) {
      error("Supabase fetch failed.", {
        table,
        column,
        value,
        error: sbError
      });

      return null;
    }

    return data || null;
  }

  async function hydrateAthleteFromSnapshot(snapshotId) {
    const snapshot_id =
      normalize(snapshotId) ||
      normalize(getQueryParam("snapshot_id"));

    if (!snapshot_id) {
      warn("No snapshot_id supplied for athlete hydration.");
      return null;
    }

    let athlete = null;

    const candidateTables = [
      "athlete_profile_snapshots",
      "statscore_athlete_snapshots",
      "athlete_snapshots",
      "player_profile_snapshots"
    ];

    for (const table of candidateTables) {
      athlete = await fetchSingleFromSupabase(
        table,
        "snapshot_id",
        snapshot_id
      );

      if (athlete) break;
    }

    if (!athlete) {
      warn("No athlete snapshot found.", { snapshot_id });
      return null;
    }

    window.STATScoreCurrentAthlete = athlete;
    window.STATScoreCurrentSnapshot = athlete;
    window.__STATSCORE_CURRENT_ATHLETE__ = athlete;

    setState(
      {
        active_athlete: athlete,
        active_snapshot_id: snapshot_id,
        active_athlete_id: athlete.athlete_id || null
      },
      {
        action: "hydrate_athlete_from_snapshot"
      }
    );

    createRuntimeReceipt("ATHLETE_SNAPSHOT_HYDRATED", {
      snapshot_id,
      athlete_id: athlete.athlete_id || null
    });

    return athlete;
  }

  function absorbWindowState() {
    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null;

    const patch = {
      active_athlete: athlete,
      active_snapshot_id: athlete?.snapshot_id || STATE.active_snapshot_id || null,
      active_athlete_id: athlete?.athlete_id || STATE.active_athlete_id || null,

      athlete_intelligence: window.STATScoreCurrentFootballScore || null,
      verification: window.STATScoreCurrentVerification || null,
      evidence: window.STATScoreCurrentEvidence || null,
      readiness: window.STATScoreCurrentReadiness || null,
      pathway: window.STATScoreCurrentPathway || null,
      eligibility: window.STATScoreCurrentNCAAEligibility || null,

      crystal_report: window.STATScoreCurrentCrystalReportHTML || null,
      program_intelligence: window.STATScoreCurrentProgramIntelligence || null,
      phnx_ranking_board: window.STATScoreCurrentPHNXRankingBoard || null,

      multibox_context: window.STATScoreCurrentMultiBoxContext || null,
      multibox_evaluation: window.STATScoreLastMultiBoxEvaluation || null,

      camp_combine_matches: window.STATScoreCurrentCampCombineMatches || null,
      recruiter_verification: window.STATScoreCurrentRecruiterVerification || null,

      active_program: window.STATScoreCurrentProgram || null,
      active_recruiter: window.STATScoreCurrentRecruiter || null,
      active_event: window.STATScoreCurrentEvent || null
    };

    setState(patch, {
      action: "absorb_window_state"
    });

    return STATE;
  }

  function pushStateToWindow() {
    if (STATE.active_athlete) {
      window.STATScoreCurrentAthlete = STATE.active_athlete;
      window.STATScoreCurrentSnapshot = STATE.active_athlete;
      window.__STATSCORE_CURRENT_ATHLETE__ = STATE.active_athlete;
    }

    if (STATE.athlete_intelligence) {
      window.STATScoreCurrentFootballScore = STATE.athlete_intelligence;
    }

    if (STATE.verification) {
      window.STATScoreCurrentVerification = STATE.verification;
    }

    if (STATE.evidence) {
      window.STATScoreCurrentEvidence = STATE.evidence;
    }

    if (STATE.readiness) {
      window.STATScoreCurrentReadiness = STATE.readiness;
    }

    if (STATE.pathway) {
      window.STATScoreCurrentPathway = STATE.pathway;
    }

    if (STATE.eligibility) {
      window.STATScoreCurrentNCAAEligibility = STATE.eligibility;
    }

    if (STATE.active_program) {
      window.STATScoreCurrentProgram = STATE.active_program;
    }

    if (STATE.active_recruiter) {
      window.STATScoreCurrentRecruiter = STATE.active_recruiter;
    }

    return true;
  }

  function runAvailableCorridors() {
    pushStateToWindow();

    const results = {};

    try {
      if (window.STATScoreFootballScoringEngine?.renderScoreToWindowAthlete) {
        results.football_score =
          window.STATScoreFootballScoringEngine.renderScoreToWindowAthlete();
      }
    } catch (err) {
      error("Football scoring corridor failed.", err);
    }

    try {
      if (window.STATScoreVerificationEngine?.runCurrentVerification) {
        results.verification =
          window.STATScoreVerificationEngine.runCurrentVerification();
      }
    } catch (err) {
      error("Verification corridor failed.", err);
    }

    try {
      if (window.STATScoreEvidenceEngine?.runCurrentEvidenceAnalysis) {
        results.evidence =
          window.STATScoreEvidenceEngine.runCurrentEvidenceAnalysis();
      }
    } catch (err) {
      error("Evidence corridor failed.", err);
    }

    try {
      if (window.STATScoreReadinessEngine?.runCurrentReadiness) {
        results.readiness =
          window.STATScoreReadinessEngine.runCurrentReadiness();
      }
    } catch (err) {
      error("Readiness corridor failed.", err);
    }

    try {
      if (window.STATScorePathwayIntelligenceEngine?.runCurrentPathway) {
        results.pathway =
          window.STATScorePathwayIntelligenceEngine.runCurrentPathway();
      }
    } catch (err) {
      error("Pathway corridor failed.", err);
    }

    try {
      if (window.STATScoreNCAAEligibilityIntelligenceEngine?.runCurrentEligibility) {
        results.eligibility =
          window.STATScoreNCAAEligibilityIntelligenceEngine.runCurrentEligibility();
      }
    } catch (err) {
      error("Eligibility corridor failed.", err);
    }

    absorbWindowState();

    createRuntimeReceipt("AVAILABLE_CORRIDORS_EXECUTED", {
      result_keys: Object.keys(results)
    });

    return results;
  }

  async function hydrateRuntime(options = {}) {
    heartbeat();

    const snapshotId =
      options.snapshot_id ||
      getQueryParam("snapshot_id");

    let athlete = null;

    if (snapshotId) {
      athlete = await hydrateAthleteFromSnapshot(snapshotId);
    } else {
      athlete =
        window.STATScoreCurrentAthlete ||
        window.STATScoreCurrentSnapshot ||
        window.__STATSCORE_CURRENT_ATHLETE__ ||
        null;

      if (athlete) {
        setState(
          {
            active_athlete: athlete,
            active_snapshot_id: athlete.snapshot_id || null,
            active_athlete_id: athlete.athlete_id || null
          },
          {
            action: "hydrate_runtime_existing_window_athlete"
          }
        );
      }
    }

    absorbWindowState();

    if (options.run_corridors !== false) {
      runAvailableCorridors();
    }

    createRuntimeReceipt("RUNTIME_HYDRATED", {
      snapshot_id: snapshotId || null,
      athlete_loaded: !!athlete
    });

    return snapshot();
  }

  function bindRuntimeEvents() {
    window.addEventListener("storage", () => {
      absorbWindowState();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        heartbeat();
        absorbWindowState();
      }
    });

    if (window.STATScoreEngineBus?.on) {
      window.STATScoreEngineBus.on("engine_online", (payload) => {
        createRuntimeReceipt("ENGINE_ONLINE_SIGNAL", payload);
      });

      window.STATScoreEngineBus.on("runtime_state_request", () => {
        publishState();
      });
    }
  }

  function expose() {
    window.STATScoreRuntimeStateEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      getState: snapshot,
      setState,
      resetState,
      publishState,
      heartbeat,

      hydrateRuntime,
      hydrateAthleteFromSnapshot,
      absorbWindowState,
      pushStateToWindow,
      runAvailableCorridors,

      createRuntimeReceipt
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.RuntimeStateEngine =
      window.STATScoreRuntimeStateEngine;

    publishState();
  }

  function init() {
    if (window.__SC_RUNTIME_STATE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__SC_RUNTIME_STATE_ENGINE__ = true;

    STATE.initialized = true;
    STATE.booted_at = now();
    STATE.updated_at = now();

    expose();
    bindRuntimeEvents();

    heartbeat();

    createRuntimeReceipt("RUNTIME_STATE_ENGINE_ONLINE", {
      engine_id: ENGINE_ID,
      version: VERSION
    });

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
    }

    const snapshotId = getQueryParam("snapshot_id");

    if (snapshotId) {
      hydrateRuntime({
        snapshot_id: snapshotId,
        run_corridors: true
      });
    } else {
      absorbWindowState();
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
