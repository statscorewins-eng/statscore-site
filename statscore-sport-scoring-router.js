/* ============================================================
   STATS-CORE™ SPORT SCORING ROUTER
   File: statscore-sport-scoring-router.js
   Version: STATSCORE-SPORT-SCORING-ROUTER-V1

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Routes athlete scoring requests to the correct sport-specific
   scoring engine and normalizes the returned score contract.

   Canon:
   One universal STATScore™.
   Multiple sport-specific scoring sciences.
   Multiple position/event matrices.
   Score Authority consumes this router.
============================================================ */

(function(){
  "use strict";

  const ENGINE = "statscore-sport-scoring-router.js";
  const VERSION = "STATSCORE-SPORT-SCORING-ROUTER-V1";

  const SUPPORTED_SPORTS = Object.freeze({
    FOOTBALL: {
      label: "Football",
      engine_key: "STATScoreFootballScoringEngine",
      namespace_key: "FootballScoringEngine",
      method: "scoreAthlete",
      status: "ACTIVE"
    },

    BASKETBALL: {
      label: "Basketball",
      engine_key: "STATScoreBasketballScoringEngine",
      namespace_key: "BasketballScoringEngine",
      method: "scoreAthlete",
      status: "PENDING"
    },

    BASEBALL: {
      label: "Baseball",
      engine_key: "STATScoreBaseballScoringEngine",
      namespace_key: "BaseballScoringEngine",
      method: "scoreAthlete",
      status: "PENDING"
    },

    TRACK: {
      label: "Track",
      engine_key: "STATScoreTrackScoringEngine",
      namespace_key: "TrackScoringEngine",
      method: "scoreAthlete",
      status: "PENDING"
    }
  });

  function n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function upper(value){
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  }

  function normalizeSport(value){
    const sport = upper(value);

    const aliases = {
      FB: "FOOTBALL",
      FOOTBALL: "FOOTBALL",

      BB: "BASKETBALL",
      BASKETBALL: "BASKETBALL",
      HOOPS: "BASKETBALL",

      BASEBALL: "BASEBALL",
      BASE_BALL: "BASEBALL",

      TRACK: "TRACK",
      TRACK_FIELD: "TRACK",
      TRACK_AND_FIELD: "TRACK",
      TRACK_AMP_FIELD: "TRACK"
    };

    return aliases[sport] || sport || "UNKNOWN";
  }

  function getSport(snapshot = {}){
    return normalizeSport(
      snapshot.primary_sport ||
      snapshot.sport ||
      snapshot.raw_payload?.primarySport ||
      snapshot.raw_payload?.primary_sport ||
      snapshot.raw_payload?.sport ||
      ""
    );
  }

  function getSportConfig(sport){
    return SUPPORTED_SPORTS[normalizeSport(sport)] || null;
  }

  function getEngineForSport(sport){
    const config = getSportConfig(sport);

    if(!config) return null;

    return (
      window[config.engine_key] ||
      window.STATScore?.[config.namespace_key] ||
      null
    );
  }

  function normalizeScoreOutput(output, snapshot, sport){
    if(!output){
      return {
        ok: false,
        status: "NO_SCORE_OUTPUT",
        message: "No sport scoring output returned.",
        sport,
        snapshot_id: snapshot?.snapshot_id || null,
        athlete_id: snapshot?.athlete_id || null
      };
    }

    if(output.ok === false){
      return {
        ...output,
        sport,
        snapshot_id: output.snapshot_id || snapshot?.snapshot_id || null,
        athlete_id: output.athlete_id || snapshot?.athlete_id || null
      };
    }

    const finalScore =
      n(output.final_score) ??
      n(output.score_final) ??
      n(output.score) ??
      null;

    return {
      ...output,

      ok: output.ok !== false,
      status: output.status || "SCORED",

      router_engine: ENGINE,
      router_version: VERSION,

      sport,
      athlete_id: output.athlete_id || snapshot?.athlete_id || null,
      snapshot_id: output.snapshot_id || snapshot?.snapshot_id || null,

      final_score: finalScore,
      score_final: finalScore,

      matrix_id:
        output.matrix_id ||
        output.matrix_code ||
        "MATRIX_PENDING",

      matrix_code:
        output.matrix_code ||
        output.matrix_id ||
        "MATRIX_PENDING",

      score_band:
        output.score_band ||
        output.band ||
        "PENDING",

      star_signal:
        output.star_signal ||
        output.star_projection ||
        null,

      traits:
        Array.isArray(output.traits)
          ? output.traits
          : [],

      risk_flags:
        Array.isArray(output.risk_flags)
          ? output.risk_flags
          : [],

      why_this_signal:
        Array.isArray(output.why_this_signal)
          ? output.why_this_signal
          : Array.isArray(output.explanation?.factors)
            ? output.explanation.factors
            : []
    };
  }

  function unsupportedSportResult(snapshot, sport){
    return {
      ok: false,
      status: "UNSUPPORTED_SPORT",
      router_engine: ENGINE,
      router_version: VERSION,
      sport,
      athlete_id: snapshot?.athlete_id || null,
      snapshot_id: snapshot?.snapshot_id || null,
      final_score: null,
      score_final: null,
      matrix_id: "UNSUPPORTED_SPORT_MATRIX",
      matrix_code: "UNSUPPORTED_SPORT_MATRIX",
      traits: [],
      risk_flags: [
        `Sport scoring engine unavailable for ${sport || "UNKNOWN"}.`
      ],
      why_this_signal: [
        "Sport-specific scoring science is required before official intelligence can be generated."
      ],
      message: "No registered sport scoring engine is available for this athlete sport."
    };
  }

  function pendingSportResult(snapshot, sport, config){
    return {
      ok: false,
      status: "SPORT_ENGINE_PENDING",
      router_engine: ENGINE,
      router_version: VERSION,
      sport,
      athlete_id: snapshot?.athlete_id || null,
      snapshot_id: snapshot?.snapshot_id || null,
      final_score: null,
      score_final: null,
      matrix_id: `${sport}_MATRIX_PENDING`,
      matrix_code: `${sport}_MATRIX_PENDING`,
      traits: [],
      risk_flags: [
        `${config?.label || sport} scoring engine is registered but not active.`
      ],
      why_this_signal: [
        "The sport is part of the Phoenix Multi-Sport Scoring Framework™ but the scoring engine is not active yet."
      ],
      message: `${config?.label || sport} scoring engine pending activation.`
    };
  }

  function score(snapshot = {}){
    const sport = getSport(snapshot);
    const config = getSportConfig(sport);

    if(!config){
      return unsupportedSportResult(snapshot, sport);
    }

    const engine = getEngineForSport(sport);

    if(!engine || !engine[config.method]){
      return pendingSportResult(snapshot, sport, config);
    }

    try{
      const output = engine[config.method](snapshot);
      return normalizeScoreOutput(output, snapshot, sport);
    }catch(error){
      console.error("[STATS-CORE Sport Scoring Router] Sport scoring failed:", {
        sport,
        error
      });

      return {
        ok: false,
        status: "SPORT_ENGINE_ERROR",
        router_engine: ENGINE,
        router_version: VERSION,
        sport,
        athlete_id: snapshot?.athlete_id || null,
        snapshot_id: snapshot?.snapshot_id || null,
        final_score: null,
        score_final: null,
        matrix_id: `${sport}_ENGINE_ERROR`,
        matrix_code: `${sport}_ENGINE_ERROR`,
        traits: [],
        risk_flags: [
          `${sport} scoring engine failed during execution.`
        ],
        why_this_signal: [
          "Sport scoring could not complete because the registered engine threw an error."
        ],
        error
      };
    }
  }

  function isSupportedSport(sport){
    return Boolean(getSportConfig(sport));
  }

  function isActiveSport(sport){
    const config = getSportConfig(sport);
    if(!config) return false;

    const engine = getEngineForSport(sport);
    return Boolean(config.status === "ACTIVE" && engine?.[config.method]);
  }

  function getRegisteredSports(){
    return Object.entries(SUPPORTED_SPORTS).map(([sport, config]) => ({
      sport,
      ...config,
      engine_loaded: Boolean(getEngineForSport(sport)),
      active: isActiveSport(sport)
    }));
  }

  window.STATSCORE_SPORT_SCORING_ROUTER = {
    engine: ENGINE,
    version: VERSION,
    status: "ACTIVE",

    supported_sports: SUPPORTED_SPORTS,

    normalizeSport,
    getSport,
    getSportConfig,
    getEngineForSport,

    score,
    isSupportedSport,
    isActiveSport,
    getRegisteredSports
  };

  window.STATScore = window.STATScore || {};
  window.STATScore.SportScoringRouter = window.STATSCORE_SPORT_SCORING_ROUTER;

  console.info("[STATS-CORE] Sport Scoring Router loaded:", VERSION);
})(); 
