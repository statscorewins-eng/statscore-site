/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-runtime-state-engine.js

Asset Type:
JavaScript Infrastructure / Runtime State Engine

Owner Stream:
Master Integration

Primary Operational Authority:
Master Integration

Layer:
Runtime / State Management

Runtime Owner:
Master Integration Runtime

Primary Consumers:
- all governed page runtimes
- statscore-routing.js
- statscore-engine-loader.js
- statscore-engine-execution.js
- system.html

Purpose:
Maintains active runtime context for STATS-CORE,
including current snapshot, athlete, role, page,
and system execution state.

Consumes:
- URL parameters
- localStorage
- sessionStorage
- Supabase context
- role context

Provides:
- runtime_state
- active snapshot_id
- active athlete_id
- active role
- active role_id
- page context

Primary IDs:
- snapshot_id
- athlete_id
- role
- role_id
- page_id
- system_state

Cross-Stream Dependencies:
May provide runtime context to all Streams.
May not own Stream-specific business logic.

Does NOT:
- Calculate scores
- Generate recommendations
- Render HTML
- Create snapshots
- Modify production records
- Execute communications

Status:
CANON LOCKED

Last Governance Review:
2026-06-27

==========================================================
*/ 

   STATScore™ Runtime State Engine
   FULL PRODUCTION FILE
   Version: v1.1
   Purpose:
   Live Runtime State Authority → Hydration → Sync → Heartbeat
   Runtime state is the authority. Engines contribute state; they do not own it.
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "sc-runtime-state-engine";
  const VERSION = "v1.1-runtime-authority";

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
    visibility: null,

    crystal_report: null,
    program_intelligence: null,
    phnx_ranking_board: null,

    multibox_context: null,
    multibox_evaluation: null,

    camp_combine_matches: null,
    recruiter_verification: null,

    registered_engines: {},
    receipts: [],
    errors: [],
    warnings: [],

    governance_locks: {
      recruiter_visibility_locked: true,
      media_visibility_locked: true,
      public_profile_locked: true,
      messaging_locked: true
    },

    heartbeat: {
      status: "IDLE",
      count: 0,
      last_beat_at: null
    }
  };

  let STATE = clone(DEFAULT_STATE);

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function log(message, payload) {
    console.log(`[STATScore Runtime State] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Runtime State] ${message}`, payload || "");
    STATE.warnings.push({ message, payload: payload || null, created_at: now() });
  }

  function recordError(message, payload) {
    console.error(`[STATScore Runtime State] ${message}`, payload || "");
    STATE.errors.push({ message, payload: payload || null, created_at: now() });
  }

  function getSupabase() {
    return (
      window.STATScoreSupabase ||
      window.STATScoreSupabaseClient ||
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

  function snapshot() {
    return clone(STATE);
  }

  function publishState() {
    window.STATScoreRuntimeState = STATE;

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.RuntimeState = STATE;

    return STATE;
  }

  function emit(eventName, payload) {
    window.dispatchEvent(
      new CustomEvent("statscore:runtime:" + eventName, {
        detail: Object.assign(
          {
            engine: ENGINE_ID,
            version: VERSION,
            timestamp: now()
          },
          payload || {}
        )
      })
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("runtime_" + eventName, payload || {});
    }
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
    emit("receipt_created", { receipt });

    return receipt;
  }

  function setState(patch = {}, meta = {}) {
    const previous = snapshot();

    STATE = Object.assign({}, STATE, patch, {
      updated_at: now()
    });

    applyGovernanceLocks();
    publishState();

    createRuntimeReceipt("RUNTIME_STATE_MUTATION", {
      action: meta.action || "setState",
      patch_keys: Object.keys(patch),
      previous_updated_at: previous.updated_at,
      next_updated_at: STATE.updated_at
    });

    emit("state_updated", {
      meta,
      state: snapshot()
    });

    return STATE;
  }

  function resetState() {
    STATE = clone(DEFAULT_STATE);
    STATE.initialized = true;
    STATE.booted_at = now();
    STATE.updated_at = now();

    publishState();

    createRuntimeReceipt("RUNTIME_STATE_RESET", {
      booted_at: STATE.booted_at
    });

    return STATE;
  }

  function heartbeat() {
    STATE.heartbeat.count += 1;
    STATE.heartbeat.status = "ONLINE";
    STATE.heartbeat.last_beat_at = now();
    STATE.updated_at = now();

    publishState();

    return STATE.heartbeat;
  }

  function registerEngine(engineId, payload = {}) {
    if (!engineId) return null;

    STATE.registered_engines[engineId] = Object.assign(
      {},
      STATE.registered_engines[engineId] || {},
      {
        engine_id: engineId,
        status: payload.status || "ONLINE",
        version: payload.version || null,
        last_ping: now(),
        payload
      }
    );

    STATE.updated_at = now();
    publishState();

    createRuntimeReceipt("ENGINE_REGISTERED", {
      engine_id: engineId,
      version: payload.version || null
    });

    return STATE.registered_engines[engineId];
  }

  function pingEngine(engineId, payload = {}) {
    if (!engineId) return null;

    if (!STATE.registered_engines[engineId]) {
      registerEngine(engineId, payload);
    }

    STATE.registered_engines[engineId].status = payload.status || "ONLINE";
    STATE.registered_engines[engineId].last_ping = now();
    STATE.registered_engines[engineId].payload = payload;

    STATE.updated_at = now();
    publishState();

    return STATE.registered_engines[engineId];
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

    const { data, error } = await client
      .from(table)
      .select("*")
      .eq(column, value)
      .limit(1)
      .maybeSingle();

    if (error) {
      recordError("Supabase fetch failed.", { table, column, value, error });
      return null;
    }

    return data || null;
  }

  async function hydrateAthleteFromSnapshot(snapshotId) {
    const snapshot_id = normalize(snapshotId) || normalize(getQueryParam("snapshot_id"));

    if (!snapshot_id) {
      warn("No snapshot_id supplied for athlete hydration.");
      return null;
    }

    const candidateTables = [
      "athlete_profile_snapshots",
      "statscore_athlete_snapshots",
      "athlete_snapshots",
      "player_profile_snapshots"
    ];

    let athlete = null;

    for (const table of candidateTables) {
      athlete = await fetchSingleFromSupabase(table, "snapshot_id", snapshot_id);
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
      { action: "hydrate_athlete_from_snapshot" }
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

      athlete_intelligence: window.STATScoreCurrentFootballScore || STATE.athlete_intelligence,
      verification: window.STATScoreCurrentVerification || STATE.verification,
      evidence: window.STATScoreCurrentEvidence || STATE.evidence,
      readiness: window.STATScoreCurrentReadiness || STATE.readiness,
      pathway: window.STATScoreCurrentPathway || STATE.pathway,
      eligibility: window.STATScoreCurrentNCAAEligibility || STATE.eligibility,
      visibility: window.STATScoreCurrentVisibility || STATE.visibility,

      crystal_report: window.STATScoreCurrentCrystalReportHTML || STATE.crystal_report,
      program_intelligence: window.STATScoreCurrentProgramIntelligence || STATE.program_intelligence,
      phnx_ranking_board: window.STATScoreCurrentPHNXRankingBoard || STATE.phnx_ranking_board,

      multibox_context: window.STATScoreCurrentMultiBoxContext || STATE.multibox_context,
      multibox_evaluation: window.STATScoreLastMultiBoxEvaluation || STATE.multibox_evaluation,

      camp_combine_matches: window.STATScoreCurrentCampCombineMatches || STATE.camp_combine_matches,
      recruiter_verification: window.STATScoreCurrentRecruiterVerification || STATE.recruiter_verification,

      active_program: window.STATScoreCurrentProgram || STATE.active_program,
      active_recruiter: window.STATScoreCurrentRecruiter || STATE.active_recruiter,
      active_event: window.STATScoreCurrentEvent || STATE.active_event
    };

    setState(patch, { action: "absorb_window_state" });

    return STATE;
  }

  function pushStateToWindow() {
    if (STATE.active_athlete) {
      window.STATScoreCurrentAthlete = STATE.active_athlete;
      window.STATScoreCurrentSnapshot = STATE.active_athlete;
      window.__STATSCORE_CURRENT_ATHLETE__ = STATE.active_athlete;
    }

    window.STATScoreCurrentFootballScore = STATE.athlete_intelligence || null;
    window.STATScoreCurrentVerification = STATE.verification || null;
    window.STATScoreCurrentEvidence = STATE.evidence || null;
    window.STATScoreCurrentReadiness = STATE.readiness || null;
    window.STATScoreCurrentPathway = STATE.pathway || null;
    window.STATScoreCurrentNCAAEligibility = STATE.eligibility || null;
    window.STATScoreCurrentVisibility = STATE.visibility || null;
    window.STATScoreCurrentProgram = STATE.active_program || null;
    window.STATScoreCurrentRecruiter = STATE.active_recruiter || null;

    return true;
  }

  function applyGovernanceLocks() {
    const eligibilityStatus = String(
      STATE.eligibility?.status ||
      STATE.eligibility?.standing ||
      ""
    ).toLowerCase();

    const readinessStatus = String(
      STATE.readiness?.status ||
      STATE.readiness?.level ||
      ""
    ).toLowerCase();

    const verificationStatus = String(
      STATE.verification?.status ||
      STATE.verification?.trust_status ||
      ""
    ).toLowerCase();

    const parentApprovalStatus = String(
      STATE.multibox_context?.parent_approval_status ||
      STATE.visibility?.parent_approval_status ||
      ""
    ).toLowerCase();

    const verified =
      verificationStatus.includes("verified") ||
      verificationStatus.includes("approved");

    const eligible =
      eligibilityStatus.includes("good") ||
      eligibilityStatus.includes("eligible") ||
      eligibilityStatus.includes("active");

    const ready =
      readinessStatus.includes("ready") ||
      readinessStatus.includes("active") ||
      readinessStatus.includes("strong");

    const parentApproved =
      parentApprovalStatus === "approved" ||
      parentApprovalStatus === "modified";

    STATE.governance_locks = {
      recruiter_visibility_locked: !(verified && eligible && ready && parentApproved),
      media_visibility_locked: !(verified && parentApproved),
      public_profile_locked: !(verified && parentApproved),
      messaging_locked: !parentApproved
    };

    return STATE.governance_locks;
  }

  function runAvailableCorridors() {
    pushStateToWindow();

    const results = {};

    const runners = [
      ["football_score", window.STATScoreFootballScoringEngine?.renderScoreToWindowAthlete],
      ["verification", window.STATScoreVerificationEngine?.runCurrentVerification],
      ["evidence", window.STATScoreEvidenceEngine?.runCurrentEvidenceAnalysis],
      ["readiness", window.STATScoreReadinessEngine?.runCurrentReadiness],
      ["pathway", window.STATScorePathwayIntelligenceEngine?.runCurrentPathway],
      ["eligibility", window.STATScoreNCAAEligibilityIntelligenceEngine?.runCurrentEligibility]
    ];

    runners.forEach(([key, fn]) => {
      try {
        if (typeof fn === "function") {
          results[key] = fn();
        }
      } catch (err) {
        recordError(`${key} corridor failed.`, err);
      }
    });

    absorbWindowState();

    createRuntimeReceipt("AVAILABLE_CORRIDORS_EXECUTED", {
      result_keys: Object.keys(results)
    });

    return results;
  }

  async function hydrateRuntime(options = {}) {
    heartbeat();

    const snapshotId = options.snapshot_id || getQueryParam("snapshot_id");

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
          { action: "hydrate_runtime_existing_window_athlete" }
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
    window.addEventListener("storage", absorbWindowState);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        heartbeat();
        absorbWindowState();
      }
    });

    window.addEventListener("statscore:engine:online", (event) => {
      registerEngine(event.detail?.engine || "unknown_engine", event.detail || {});
    });

    if (window.STATScoreEngineBus?.on) {
      window.STATScoreEngineBus.on("engine_online", (payload) => {
        registerEngine(payload?.engine || payload?.engine_id || "unknown_engine", payload);
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

      registerEngine,
      pingEngine,

      hydrateRuntime,
      hydrateAthleteFromSnapshot,
      absorbWindowState,
      pushStateToWindow,
      runAvailableCorridors,

      applyGovernanceLocks,
      createRuntimeReceipt
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.RuntimeStateEngine = window.STATScoreRuntimeStateEngine;

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

    registerEngine(ENGINE_ID, {
      version: VERSION,
      status: "ONLINE"
    });

    createRuntimeReceipt("RUNTIME_STATE_ENGINE_ONLINE", {
      engine_id: ENGINE_ID,
      version: VERSION
    });

    emit("engine_online", {
      engine: ENGINE_ID,
      version: VERSION,
      status: "ONLINE"
    });

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
