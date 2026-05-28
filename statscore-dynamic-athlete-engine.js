/* ============================================================
   STATScore™ Dynamic Athlete Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Live Athlete Hydration → Intelligence Injection → Profile Rendering
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "sc-dynamic-athlete-engine";
  const VERSION = "v1.0-live-athlete-orchestrator";

  const ATHLETE_STATE = {
    initialized: false,
    booted_at: null,
    updated_at: null,

    active_athlete: null,
    active_snapshot_id: null,
    active_athlete_id: null,

    hydration_status: "IDLE",
    render_status: "IDLE",

    intelligence: {
      score: null,
      verification: null,
      evidence: null,
      readiness: null,
      pathway: null,
      eligibility: null,
      crystal_report: null
    },

    receipts: [],
    warnings: [],
    errors: []
  };

  function now() {
    return new Date().toISOString();
  }

  function log(message, payload) {
    console.log(`[STATScore Dynamic Athlete] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Dynamic Athlete] ${message}`, payload || "");

    ATHLETE_STATE.warnings.push({
      message,
      payload: payload || null,
      created_at: now()
    });
  }

  function error(message, payload) {
    console.error(`[STATScore Dynamic Athlete] ${message}`, payload || "");

    ATHLETE_STATE.errors.push({
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

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_");
  }

  function safe(value, fallback = "N/A") {
    return value === undefined || value === null || value === ""
      ? fallback
      : value;
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getSupabase() {
    return (
      window.STATScoreSupabase ||
      window.supabaseClient ||
      null
    );
  }

  function getRuntimeEngine() {
    return (
      window.STATScoreRuntimeStateEngine ||
      window.STATScore?.RuntimeStateEngine ||
      null
    );
  }

  function getLedgerEngine() {
    return (
      window.STATScoreReceiptLedgerEngine ||
      window.STATScore?.ReceiptLedgerEngine ||
      null
    );
  }

  function publishAthleteState() {
    window.STATScoreDynamicAthleteState = ATHLETE_STATE;

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.DynamicAthleteState = ATHLETE_STATE;

    return ATHLETE_STATE;
  }

  async function createAthleteReceipt(type, payload = {}, options = {}) {
    const ledger = getLedgerEngine();

    let receipt = null;

    if (ledger?.createReceipt) {
      receipt = await ledger.createReceipt(
        type,
        {
          ...payload,
          dynamic_athlete_engine: ENGINE_ID,
          dynamic_athlete_version: VERSION
        },
        {
          status: options.status || payload.status || "RECORDED",
          athlete_id:
            options.athlete_id ||
            payload.athlete_id ||
            ATHLETE_STATE.active_athlete_id ||
            null,
          snapshot_id:
            options.snapshot_id ||
            payload.snapshot_id ||
            ATHLETE_STATE.active_snapshot_id ||
            null,
          actor_role:
            options.actor_role ||
            payload.actor_role ||
            "SYSTEM"
        }
      );
    } else if (getRuntimeEngine()?.createRuntimeReceipt) {
      receipt = getRuntimeEngine().createRuntimeReceipt(type, payload);
    } else {
      receipt = {
        receipt_id:
          "dyn_ath_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).slice(2, 8),
        receipt_type: upper(type),
        payload,
        created_at: now()
      };
    }

    ATHLETE_STATE.receipts.push(receipt);
    ATHLETE_STATE.updated_at = now();
    publishAthleteState();

    return receipt;
  }

  function setActiveAthlete(athlete) {
    if (!athlete) {
      warn("Attempted to set empty athlete.");
      return null;
    }

    ATHLETE_STATE.active_athlete = athlete;
    ATHLETE_STATE.active_snapshot_id = athlete.snapshot_id || null;
    ATHLETE_STATE.active_athlete_id = athlete.athlete_id || null;
    ATHLETE_STATE.updated_at = now();

    window.STATScoreCurrentAthlete = athlete;
    window.STATScoreCurrentSnapshot = athlete;
    window.__STATSCORE_CURRENT_ATHLETE__ = athlete;

    const runtime = getRuntimeEngine();

    if (runtime?.setState) {
      runtime.setState(
        {
          active_athlete: athlete,
          active_snapshot_id: athlete.snapshot_id || null,
          active_athlete_id: athlete.athlete_id || null
        },
        {
          action: "dynamic_athlete_set_active"
        }
      );
    }

    publishAthleteState();

    return athlete;
  }

  async function fetchSingle(table, column, value) {
    const client = getSupabase();

    if (!client) {
      warn("Supabase client unavailable.");
      return null;
    }

    const { data, error: sbError } = await client
      .from(table)
      .select("*")
      .eq(column, value)
      .maybeSingle();

    if (sbError) {
      warn("Supabase lookup failed.", {
        table,
        column,
        value,
        error: sbError
      });

      return null;
    }

    return data || null;
  }

  async function hydrateBySnapshot(snapshotId) {
    const snapshot_id =
      normalize(snapshotId) ||
      normalize(getQueryParam("snapshot_id"));

    if (!snapshot_id) {
      warn("No snapshot_id supplied.");
      return null;
    }

    ATHLETE_STATE.hydration_status = "LOADING";
    ATHLETE_STATE.updated_at = now();
    publishAthleteState();

    const runtime = getRuntimeEngine();

    let athlete = null;

    if (runtime?.hydrateAthleteFromSnapshot) {
      athlete = await runtime.hydrateAthleteFromSnapshot(snapshot_id);
    }

    if (!athlete) {
      const candidateTables = [
        "athlete_profile_snapshots",
        "statscore_athlete_snapshots",
        "athlete_snapshots",
        "player_profile_snapshots"
      ];

      for (const table of candidateTables) {
        athlete = await fetchSingle(table, "snapshot_id", snapshot_id);

        if (athlete) break;
      }
    }

    if (!athlete) {
      ATHLETE_STATE.hydration_status = "NOT_FOUND";
      ATHLETE_STATE.updated_at = now();

      publishAthleteState();

      await createAthleteReceipt(
        "DYNAMIC_ATHLETE_HYDRATION_FAILED",
        {
          snapshot_id,
          reason: "ATHLETE_NOT_FOUND"
        },
        {
          status: "FAILED",
          snapshot_id
        }
      );

      return null;
    }

    setActiveAthlete(athlete);

    ATHLETE_STATE.hydration_status = "HYDRATED";
    ATHLETE_STATE.updated_at = now();

    publishAthleteState();

    await createAthleteReceipt(
      "DYNAMIC_ATHLETE_HYDRATED",
      {
        snapshot_id,
        athlete_id: athlete.athlete_id || null
      },
      {
        status: "HYDRATED",
        snapshot_id,
        athlete_id: athlete.athlete_id || null
      }
    );

    return athlete;
  }

  async function hydrateByAthleteId(athleteId) {
    const athlete_id =
      normalize(athleteId) ||
      normalize(getQueryParam("athlete_id"));

    if (!athlete_id) {
      warn("No athlete_id supplied.");
      return null;
    }

    ATHLETE_STATE.hydration_status = "LOADING";
    ATHLETE_STATE.updated_at = now();
    publishAthleteState();

    const candidateTables = [
      "athlete_profile_snapshots",
      "statscore_athlete_snapshots",
      "athlete_snapshots",
      "player_profile_snapshots"
    ];

    let athlete = null;

    for (const table of candidateTables) {
      athlete = await fetchSingle(table, "athlete_id", athlete_id);

      if (athlete) break;
    }

    if (!athlete) {
      ATHLETE_STATE.hydration_status = "NOT_FOUND";
      ATHLETE_STATE.updated_at = now();
      publishAthleteState();

      await createAthleteReceipt(
        "DYNAMIC_ATHLETE_LOOKUP_FAILED",
        {
          athlete_id,
          reason: "ATHLETE_NOT_FOUND"
        },
        {
          status: "FAILED",
          athlete_id
        }
      );

      return null;
    }

    setActiveAthlete(athlete);

    ATHLETE_STATE.hydration_status = "HYDRATED";
    ATHLETE_STATE.updated_at = now();

    publishAthleteState();

    await createAthleteReceipt(
      "DYNAMIC_ATHLETE_HYDRATED_BY_ID",
      {
        athlete_id,
        snapshot_id: athlete.snapshot_id || null
      },
      {
        status: "HYDRATED",
        athlete_id,
        snapshot_id: athlete.snapshot_id || null
      }
    );

    return athlete;
  }

  function runIntelligenceCorridors() {
    const athlete = ATHLETE_STATE.active_athlete;

    if (!athlete) {
      warn("No active athlete available for intelligence corridors.");
      return null;
    }

    window.STATScoreCurrentAthlete = athlete;
    window.STATScoreCurrentSnapshot = athlete;
    window.__STATSCORE_CURRENT_ATHLETE__ = athlete;

    const results = {};

    try {
      if (window.STATScoreFootballScoringEngine?.scoreAthlete) {
        results.score =
          window.STATScoreFootballScoringEngine.scoreAthlete(athlete);
      } else if (window.STATScoreFootballScoringEngine?.runCurrentFootballScore) {
        results.score =
          window.STATScoreFootballScoringEngine.runCurrentFootballScore();
      } else if (window.STATScoreFootballScoringEngine?.renderScoreToWindowAthlete) {
        results.score =
          window.STATScoreFootballScoringEngine.renderScoreToWindowAthlete();
      }
    } catch (err) {
      error("Football scoring failed.", err);
    }

    if (results.score) {
      window.STATScoreCurrentFootballScore = results.score;
    }

    try {
      if (window.STATScoreVerificationEngine?.verifyAthlete) {
        results.verification =
          window.STATScoreVerificationEngine.verifyAthlete(athlete);
      } else if (window.STATScoreVerificationEngine?.runCurrentVerification) {
        results.verification =
          window.STATScoreVerificationEngine.runCurrentVerification();
      }
    } catch (err) {
      error("Verification failed.", err);
    }

    if (results.verification) {
      window.STATScoreCurrentVerification = results.verification;
    }

    try {
      if (window.STATScoreEvidenceEngine?.analyzeEvidence) {
        results.evidence =
          window.STATScoreEvidenceEngine.analyzeEvidence(
            athlete,
            results.score || window.STATScoreCurrentFootballScore || null
          );
      } else if (window.STATScoreEvidenceEngine?.runCurrentEvidenceAnalysis) {
        results.evidence =
          window.STATScoreEvidenceEngine.runCurrentEvidenceAnalysis();
      }
    } catch (err) {
      error("Evidence analysis failed.", err);
    }

    if (results.evidence) {
      window.STATScoreCurrentEvidence = results.evidence;
    }

    try {
      if (window.STATScoreReadinessEngine?.calculateReadiness) {
        results.readiness =
          window.STATScoreReadinessEngine.calculateReadiness(
            results.score || window.STATScoreCurrentFootballScore,
            results.verification || window.STATScoreCurrentVerification,
            results.evidence || window.STATScoreCurrentEvidence
          );
      } else if (window.STATScoreReadinessEngine?.runCurrentReadiness) {
        results.readiness =
          window.STATScoreReadinessEngine.runCurrentReadiness();
      }
    } catch (err) {
      error("Readiness calculation failed.", err);
    }

    if (results.readiness) {
      window.STATScoreCurrentReadiness = results.readiness;
    }

    try {
      if (window.STATScoreNCAAEligibilityIntelligenceEngine?.calculateEligibility) {
        results.eligibility =
          window.STATScoreNCAAEligibilityIntelligenceEngine.calculateEligibility(athlete);
      } else if (window.STATScoreNCAAEligibilityIntelligenceEngine?.runCurrentEligibility) {
        results.eligibility =
          window.STATScoreNCAAEligibilityIntelligenceEngine.runCurrentEligibility();
      }
    } catch (err) {
      error("NCAA eligibility calculation failed.", err);
    }

    if (results.eligibility) {
      window.STATScoreCurrentNCAAEligibility = results.eligibility;
    }

    try {
      if (window.STATScorePathwayIntelligenceEngine?.calculatePathway) {
        results.pathway =
          window.STATScorePathwayIntelligenceEngine.calculatePathway(
            athlete,
            results.score || window.STATScoreCurrentFootballScore,
            results.readiness || window.STATScoreCurrentReadiness,
            results.verification || window.STATScoreCurrentVerification,
            results.evidence || window.STATScoreCurrentEvidence
          );
      } else if (window.STATScorePathwayIntelligenceEngine?.runCurrentPathway) {
        results.pathway =
          window.STATScorePathwayIntelligenceEngine.runCurrentPathway();
      }
    } catch (err) {
      error("Pathway calculation failed.", err);
    }

    if (results.pathway) {
      window.STATScoreCurrentPathway = results.pathway;
    }

    try {
      if (window.STATScoreCrystalReportEngine?.generateAthleteCrystalReport) {
        results.crystal_report =
          window.STATScoreCrystalReportEngine.generateAthleteCrystalReport();
      }
    } catch (err) {
      error("Crystal report generation failed.", err);
    }

    ATHLETE_STATE.intelligence = {
      score: results.score || window.STATScoreCurrentFootballScore || null,
      verification: results.verification || window.STATScoreCurrentVerification || null,
      evidence: results.evidence || window.STATScoreCurrentEvidence || null,
      readiness: results.readiness || window.STATScoreCurrentReadiness || null,
      pathway: results.pathway || window.STATScoreCurrentPathway || null,
      eligibility: results.eligibility || window.STATScoreCurrentNCAAEligibility || null,
      crystal_report: results.crystal_report || null
    };

    ATHLETE_STATE.updated_at = now();

    publishAthleteState();

    const runtime = getRuntimeEngine();

    if (runtime?.absorbWindowState) {
      runtime.absorbWindowState();
    }

    createAthleteReceipt(
      "DYNAMIC_ATHLETE_INTELLIGENCE_GENERATED",
      {
        athlete_id: athlete.athlete_id || null,
        snapshot_id: athlete.snapshot_id || null,
        generated_keys: Object.keys(results)
      },
      {
        status: "GENERATED"
      }
    );

    return ATHLETE_STATE.intelligence;
  }

  function text(selector, value) {
    const el = document.querySelector(selector);

    if (el) {
      el.textContent = safe(value);
      return true;
    }

    return false;
  }

  function html(selector, value) {
    const el = document.querySelector(selector);

    if (el) {
      el.innerHTML = value || "";
      return true;
    }

    return false;
  }

  function image(selector, src) {
    const el = document.querySelector(selector);

    if (el && src) {
      el.src = src;
      return true;
    }

    return false;
  }

  function renderIdentity() {
    const athlete = ATHLETE_STATE.active_athlete;

    if (!athlete) return false;

    const displayName =
      athlete.athlete_display_name ||
      [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
      "Athlete";

    const sport =
      athlete.primary_sport ||
      athlete.sport ||
      "Sport Pending";

    const position =
      athlete.primary_position ||
      athlete.position ||
      "Position Pending";

    text("[data-athlete-name]", displayName);
    text("#athleteName", displayName);
    text(".athlete-name", displayName);

    text("[data-athlete-sport]", sport);
    text("[data-athlete-position]", position);
    text("[data-athlete-school]", athlete.school_name || athlete.school || "School Pending");
    text("[data-athlete-class]", athlete.graduation_class || "Class Pending");
    text("[data-athlete-city-state]", athlete.city_state || athlete.state || "Location Pending");

    image(
      "[data-athlete-headshot]",
      athlete.headshot_public_url ||
      athlete.headshot_url ||
      athlete.image_url ||
      null
    );

    html(
      "[data-athlete-identity-card]",
      `
        <div style="
          border:1px solid rgba(255,255,255,.12);
          background:rgba(0,0,0,.28);
          padding:16px;
          color:#f4f4ef;
        ">
          <div style="
            color:#ff1f2d;
            font-size:11px;
            font-weight:1000;
            letter-spacing:.16em;
            text-transform:uppercase;
          ">
            Active Athlete
          </div>

          <div style="
            margin-top:8px;
            font-size:28px;
            font-weight:1000;
            line-height:1;
            text-transform:uppercase;
          ">
            ${displayName}
          </div>

          <div style="
            margin-top:8px;
            color:#9fe7ff;
            font-size:12px;
            font-weight:900;
            letter-spacing:.1em;
            text-transform:uppercase;
          ">
            ${sport} · ${position} · Class ${safe(athlete.graduation_class)}
          </div>

          <div style="
            margin-top:10px;
            color:#9ea4ad;
            font-size:12px;
            line-height:1.45;
          ">
            ${safe(athlete.school_name || athlete.school, "School Pending")}
            ·
            ${safe(athlete.city_state || athlete.state, "Location Pending")}
          </div>
        </div>
      `
    );

    return true;
  }

  function renderIntelligenceSummary() {
    const intel = ATHLETE_STATE.intelligence;

    const score = intel.score || {};
    const verification = intel.verification || {};
    const evidence = intel.evidence || {};
    const readiness = intel.readiness || {};
    const pathway = intel.pathway || {};
    const eligibility = intel.eligibility || {};

    text("[data-score-final]", score.score_final || score.final_score || "--");
    text("[data-verification-confidence]", verification.confidence_score || "--");
    text("[data-evidence-score]", evidence.evidence_score || "--");
    text("[data-readiness-score]", readiness.readiness_score || "--");
    text("[data-pathway-fit]", pathway.pathway_fit_score || "--");
    text("[data-eligibility-score]", eligibility.eligibility_score || "--");

    html(
      "[data-athlete-live-summary]",
      `
        <div style="
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
          gap:10px;
        ">
          ${[
            ["Athletic Signal", score.score_final || score.final_score || "--"],
            ["Confidence", verification.confidence_score || "--"],
            ["Evidence", evidence.evidence_score || "--"],
            ["Readiness", readiness.readiness_score || "--"],
            ["Pathway", pathway.primary_pathway || "--"],
            ["Academic", eligibility.eligibility_label || eligibility.eligibility_status || "--"]
          ].map(([label, value]) => `
            <div style="
              border:1px solid rgba(255,255,255,.1);
              background:rgba(0,0,0,.24);
              padding:12px;
            ">
              <div style="
                color:#9ea4ad;
                font-size:10px;
                letter-spacing:.12em;
                text-transform:uppercase;
                font-weight:900;
              ">
                ${label}
              </div>

              <div style="
                margin-top:8px;
                color:#ffb100;
                font-size:22px;
                font-weight:1000;
              ">
                ${value}
              </div>
            </div>
          `).join("")}
        </div>
      `
    );

    return true;
  }

  function renderTraits() {
    const traits =
      ATHLETE_STATE.intelligence.score?.traits ||
      [];

    const container =
      document.querySelector("[data-athlete-traits]") ||
      document.querySelector("[data-statscore-performance-traits]") ||
      document.querySelector("#scPerformanceTraits");

    if (!container || !Array.isArray(traits)) {
      return false;
    }

    if (window.STATScoreTraitRenderEngine?.renderTraits) {
      window.STATScoreTraitRenderEngine.renderTraits(container, {
        sport:
          ATHLETE_STATE.active_athlete?.primary_sport ||
          ATHLETE_STATE.active_athlete?.sport ||
          "football",
        position:
          ATHLETE_STATE.active_athlete?.primary_position ||
          ATHLETE_STATE.active_athlete?.position ||
          null,
        traits
      });

      return true;
    }

    container.innerHTML = `
      <div style="display:grid;gap:10px;">
        ${traits.map((trait) => `
          <div style="
            border:1px solid rgba(255,255,255,.1);
            background:rgba(0,0,0,.24);
            padding:12px;
            color:#f4f4ef;
          ">
            <div style="
              color:#9fe7ff;
              font-size:11px;
              font-weight:1000;
              letter-spacing:.12em;
              text-transform:uppercase;
            ">
              ${safe(trait.name)}
            </div>

            <div style="
              margin-top:8px;
              color:#ffb100;
              font-size:24px;
              font-weight:1000;
            ">
              ${safe(trait.value)}
            </div>
          </div>
        `).join("")}
      </div>
    `;

    return true;
  }

  function renderPanels() {
    const intel = ATHLETE_STATE.intelligence;

    try {
      if (window.STATScoreVerificationEngine?.renderVerificationBadge) {
        const panel =
          document.querySelector("[data-statscore-verification-badge]") ||
          document.querySelector("#scVerificationBadge");

        if (panel && intel.verification) {
          window.STATScoreVerificationEngine.renderVerificationBadge(
            panel,
            intel.verification
          );
        }
      }
    } catch (err) {
      error("Verification panel render failed.", err);
    }

    try {
      if (window.STATScoreEvidenceEngine?.renderEvidencePanel) {
        const panel =
          document.querySelector("[data-statscore-evidence-panel]") ||
          document.querySelector("#scEvidencePanel");

        if (panel && intel.evidence) {
          window.STATScoreEvidenceEngine.renderEvidencePanel(
            panel,
            intel.evidence
          );
        }
      }
    } catch (err) {
      error("Evidence panel render failed.", err);
    }

    try {
      if (window.STATScoreReadinessEngine?.renderReadiness) {
        const panel =
          document.querySelector("[data-statscore-readiness-panel]") ||
          document.querySelector("#scReadinessPanel");

        if (panel && intel.readiness) {
          window.STATScoreReadinessEngine.renderReadiness(
            panel,
            intel.readiness
          );
        }
      }
    } catch (err) {
      error("Readiness panel render failed.", err);
    }

    try {
      if (window.STATScorePathwayIntelligenceEngine?.renderPathway) {
        const panel =
          document.querySelector("[data-statscore-pathway-panel]") ||
          document.querySelector("#scPathwayPanel");

        if (panel && intel.pathway) {
          window.STATScorePathwayIntelligenceEngine.renderPathway(
            panel,
            intel.pathway
          );
        }
      }
    } catch (err) {
      error("Pathway panel render failed.", err);
    }

    try {
      if (window.STATScoreNCAAEligibilityIntelligenceEngine?.renderEligibility) {
        const panel =
          document.querySelector("[data-statscore-ncaa-eligibility-panel]") ||
          document.querySelector("#scNCAAEligibilityPanel");

        if (panel && intel.eligibility) {
          window.STATScoreNCAAEligibilityIntelligenceEngine.renderEligibility(
            panel,
            intel.eligibility
          );
        }
      }
    } catch (err) {
      error("Eligibility panel render failed.", err);
    }

    return true;
  }

  function renderAthleteProfile() {
    ATHLETE_STATE.render_status = "RENDERING";
    ATHLETE_STATE.updated_at = now();
    publishAthleteState();

    const identityRendered = renderIdentity();
    const summaryRendered = renderIntelligenceSummary();
    const traitsRendered = renderTraits();
    const panelsRendered = renderPanels();

    ATHLETE_STATE.render_status = "RENDERED";
    ATHLETE_STATE.updated_at = now();

    publishAthleteState();

    createAthleteReceipt(
      "DYNAMIC_ATHLETE_PROFILE_RENDERED",
      {
        athlete_id: ATHLETE_STATE.active_athlete_id,
        snapshot_id: ATHLETE_STATE.active_snapshot_id,
        identity_rendered: identityRendered,
        summary_rendered: summaryRendered,
        traits_rendered: traitsRendered,
        panels_rendered: panelsRendered
      },
      {
        status: "RENDERED"
      }
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("dynamic_athlete_profile_rendered", {
        athlete_id: ATHLETE_STATE.active_athlete_id,
        snapshot_id: ATHLETE_STATE.active_snapshot_id
      });
    }

    return {
      ok: true,
      identity_rendered: identityRendered,
      summary_rendered: summaryRendered,
      traits_rendered: traitsRendered,
      panels_rendered: panelsRendered
    };
  }

  async function loadAndRender(options = {}) {
    const snapshotId =
      options.snapshot_id ||
      getQueryParam("snapshot_id");

    const athleteId =
      options.athlete_id ||
      getQueryParam("athlete_id");

    let athlete =
      options.athlete ||
      ATHLETE_STATE.active_athlete ||
      null;

    if (!athlete && snapshotId) {
      athlete = await hydrateBySnapshot(snapshotId);
    }

    if (!athlete && athleteId) {
      athlete = await hydrateByAthleteId(athleteId);
    }

    if (!athlete) {
      athlete =
        window.STATScoreCurrentAthlete ||
        window.STATScoreCurrentSnapshot ||
        window.__STATSCORE_CURRENT_ATHLETE__ ||
        null;

      if (athlete) {
        setActiveAthlete(athlete);
      }
    }

    if (!athlete) {
      warn("No athlete available for loadAndRender.");
      return {
        ok: false,
        status: "NO_ATHLETE"
      };
    }

    if (options.run_intelligence !== false) {
      runIntelligenceCorridors();
    }

    const renderResult =
      renderAthleteProfile();

    return {
      ok: true,
      athlete,
      intelligence: clone(ATHLETE_STATE.intelligence),
      render: renderResult
    };
  }

  function refreshAthlete() {
    if (!ATHLETE_STATE.active_athlete) {
      return loadAndRender();
    }

    runIntelligenceCorridors();
    return renderAthleteProfile();
  }

  function bindEngineBus() {
    if (!window.STATScoreEngineBus?.on) return;

    window.STATScoreEngineBus.on("runtime_state_updated", () => {
      const runtime =
        window.STATScoreRuntimeState ||
        window.STATScore?.RuntimeState ||
        null;

      if (runtime?.active_athlete) {
        setActiveAthlete(runtime.active_athlete);
      }
    });

    window.STATScoreEngineBus.on("athlete_snapshot_hydrated", (payload) => {
      if (payload?.athlete) {
        setActiveAthlete(payload.athlete);
        loadAndRender({ athlete: payload.athlete });
      }
    });

    window.STATScoreEngineBus.on("governance_sync_completed", () => {
      publishAthleteState();
    });
  }

  function expose() {
    window.STATScoreDynamicAthleteEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      getState: () => clone(ATHLETE_STATE),
      publishAthleteState,

      setActiveAthlete,
      hydrateBySnapshot,
      hydrateByAthleteId,

      runIntelligenceCorridors,
      renderIdentity,
      renderIntelligenceSummary,
      renderTraits,
      renderPanels,
      renderAthleteProfile,

      loadAndRender,
      refreshAthlete,

      createAthleteReceipt
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.DynamicAthleteEngine =
      window.STATScoreDynamicAthleteEngine;

    publishAthleteState();
  }

  async function init() {
    if (window.__SC_DYNAMIC_ATHLETE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__SC_DYNAMIC_ATHLETE_ENGINE__ = true;

    ATHLETE_STATE.initialized = true;
    ATHLETE_STATE.booted_at = now();
    ATHLETE_STATE.updated_at = now();

    expose();
    bindEngineBus();

    await createAthleteReceipt(
      "DYNAMIC_ATHLETE_ENGINE_ONLINE",
      {
        engine_id: ENGINE_ID,
        version: VERSION
      },
      {
        status: "ONLINE"
      }
    );

    const shouldAutoLoad =
      getQueryParam("snapshot_id") ||
      getQueryParam("athlete_id") ||
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__;

    if (shouldAutoLoad) {
      loadAndRender({
        run_intelligence: true
      });
    }

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
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
