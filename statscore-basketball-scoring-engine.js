/* ============================================================
   STATS-CORE™ BASKETBALL SCORING ENGINE
   File: statscore-basketball-scoring-engine.js
   Version: STATSCORE-BASKETBALL-SCORING-ENGINE-V1

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Basketball Athlete Snapshot → Trait Scores → Explainable Basketball Signal

   Canon:
   Each sport has its own scoring science.
   Each position has its own matrix.
   Outputs normalize into universal STATScore™ contract.
============================================================ */

(function(){
  "use strict";

  const ENGINE_ID = "statscore-basketball-scoring-engine";
  const VERSION = "STATSCORE-BASKETBALL-SCORING-ENGINE-V1";

  const TRAIT_DEFAULT_STATUS = "PROJECTED";
  const VERIFIED_STATUS = "VERIFIED";
  const PENDING_STATUS = "PENDING_VERIFICATION";

  const POSITION_BASELINE = {
    PG: 64,
    SG: 65,
    SF: 65,
    PF: 64,
    C: 64,
    ATH: 63
  };

  const BASKETBALL_TRAIT_BASELINES = {
    PG: {
      COURT_VISION: 66,
      BALL_HANDLING: 67,
      DECISION_MAKING: 65,
      PICK_AND_ROLL_IQ: 64,
      PASSING: 66,
      LEADERSHIP: 65,
      PACE_CONTROL: 64,
      DEFENSIVE_PRESSURE: 63,
      SHOT_CREATION: 65,
      THREE_LEVEL_SCORING: 64,
      BURST: 66,
      FINISHING: 63,
      PULL_UP_SHOOTING: 64,
      PACE_CHANGE: 65
    },

    SG: {
      SHOT_CREATION: 66,
      PERIMETER_SHOOTING: 66,
      OFF_BALL_MOVEMENT: 64,
      SCORING_EFFICIENCY: 65,
      BALL_HANDLING: 64,
      DEFENSIVE_VERSATILITY: 63,
      TRANSITION: 65,
      CLUTCH_SCORING: 64,
      CATCH_AND_SHOOT: 66,
      ON_BALL_DEFENSE: 63,
      SHOT_DISCIPLINE: 64,
      TEAM_FIT: 64
    },

    SF: {
      ATHLETICISM: 66,
      TWO_WAY_VALUE: 65,
      FINISHING: 65,
      DEFENSIVE_SWITCHABILITY: 65,
      REBOUNDING: 63,
      SHOT_CREATION: 64,
      BASKETBALL_IQ: 64,
      VERSATILITY: 66,
      LENGTH_USAGE: 65,
      HELP_DEFENSE: 64,
      PHYSICALITY: 64
    },

    PF: {
      INTERIOR_SCORING: 65,
      MIDRANGE: 63,
      PHYSICALITY: 66,
      REBOUNDING: 66,
      SCREEN_SETTING: 64,
      DEFENSIVE_PRESENCE: 65,
      MOTOR: 66,
      POST_PLAY: 64,
      PERIMETER_SHOOTING: 62,
      PICK_AND_POP_VALUE: 62,
      SPACING: 62,
      SECOND_CHANCE_VALUE: 65
    },

    C: {
      RIM_PROTECTION: 66,
      INTERIOR_DEFENSE: 66,
      REBOUNDING: 67,
      POST_SCORING: 65,
      HANDS: 64,
      PHYSICAL_PRESENCE: 66,
      PICK_AND_ROLL_DEFENSE: 64,
      SHOT_BLOCKING: 66,
      FOOTWORK: 63,
      INTERIOR_TOUCH: 64,
      RIM_RUNNING: 65,
      DEFENSIVE_RANGE: 63
    }
  };

  function log(message, payload){
    console.log(`[STATS-CORE Basketball Scoring] ${message}`, payload || "");
  }

  function warn(message, payload){
    console.warn(`[STATS-CORE Basketball Scoring] ${message}`, payload || "");
  }

  function normalize(value){
    return String(value || "").trim();
  }

  function upper(value){
    return normalize(value).toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  }

  function clamp(value, min = 0, max = 100){
    const num = Number(value);
    if(Number.isNaN(num)) return null;
    return Math.max(min, Math.min(max, Math.round(num)));
  }

  function n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function evidenceStatus(athlete){
    const hasEvidence = Boolean(
      athlete?.highlight_url ||
      athlete?.game_film_url ||
      athlete?.recruiting_profile_url ||
      athlete?.verified_event_source
    );

    const verified = upper(athlete?.verification_status).includes("VERIFIED");

    if(verified && hasEvidence) return VERIFIED_STATUS;
    if(hasEvidence) return TRAIT_DEFAULT_STATUS;

    return PENDING_STATUS;
  }

  function traitEvidence(athlete){
    const evidence = [];

    if(athlete?.highlight_url){
      evidence.push({
        type: "HIGHLIGHT",
        label: "Highlight Film",
        url: athlete.highlight_url
      });
    }

    if(athlete?.game_film_url){
      evidence.push({
        type: "GAME_FILM",
        label: "Game Film",
        url: athlete.game_film_url
      });
    }

    if(athlete?.verified_event_source){
      evidence.push({
        type: "EVENT",
        label: athlete.verified_event_source
      });
    }

    return evidence;
  }

  function getMetricScore(athlete, traitName){
    const trait = upper(traitName);

    const vertical =
      n(athlete.vertical_jump) ??
      n(athlete.raw_payload?.verticalJump) ??
      n(athlete.raw_payload?.vertical);

    const shuttle =
      n(athlete.shuttle) ??
      n(athlete.raw_payload?.shuttle);

    const broad =
      n(athlete.broad_jump) ??
      n(athlete.raw_payload?.broadJump) ??
      n(athlete.raw_payload?.broad_jump);

    if(trait.includes("ATHLETICISM") || trait.includes("BURST") || trait.includes("TRANSITION") || trait.includes("MOBILITY")){
      if(vertical !== null) return clamp(45 + vertical * 1.15);
      if(broad !== null) return clamp(40 + broad * 0.38);
    }

    if(trait.includes("DEFENSIVE") || trait.includes("LATERAL") || trait.includes("PRESSURE") || trait.includes("SWITCHABILITY")){
      if(shuttle !== null) return clamp(100 - ((shuttle - 4.0) * 30));
    }

    return null;
  }

  function keywordSignal(athlete, keywords){
    const text = [
      athlete?.position_notes,
      athlete?.academic_notes,
      athlete?.verified_event_source,
      athlete?.raw_payload?.notes,
      athlete?.raw_payload?.style,
      athlete?.raw_payload?.strengths,
      athlete?.raw_payload?.weaknesses
    ].filter(Boolean).join(" ").toLowerCase();

    if(!text) return null;

    let hits = 0;

    keywords.forEach(word => {
      if(text.includes(String(word).toLowerCase())) hits += 1;
    });

    if(!hits) return null;

    return clamp(62 + hits * 8);
  }

  function getTraitScoreFromPayload(traitName, athlete){
    const key = upper(traitName);

    const sources = [
      athlete?.trait_scores,
      athlete?.raw_payload?.trait_scores,
      athlete?.raw_payload?.basketball_trait_scores,
      athlete?.raw_payload?.position_trait_scores
    ];

    for(const source of sources){
      if(!source || typeof source !== "object") continue;

      if(source[traitName] !== undefined) return source[traitName];
      if(source[key] !== undefined) return source[key];

      const matchKey = Object.keys(source).find(k => upper(k) === key);
      if(matchKey) return source[matchKey];
    }

    return null;
  }

  function keywordTraitScore(traitName, athlete){
    const trait = upper(traitName);

    const keywords = {
      COURT_VISION: ["vision", "sees floor", "floor general", "passing"],
      BALL_HANDLING: ["handle", "ball handling", "dribble", "pressure"],
      DECISION_MAKING: ["decision", "iq", "smart", "reads"],
      PICK_AND_ROLL_IQ: ["pick and roll", "pnr", "screen read"],
      PASSING: ["passing", "assist", "facilitator"],
      LEADERSHIP: ["leader", "captain", "command"],
      PACE_CONTROL: ["pace", "tempo", "control"],
      DEFENSIVE_PRESSURE: ["pressure", "defense", "pesky"],
      SHOT_CREATION: ["shot creator", "create", "isolation"],
      PERIMETER_SHOOTING: ["shooting", "three", "perimeter"],
      OFF_BALL_MOVEMENT: ["off ball", "movement", "cut"],
      SCORING_EFFICIENCY: ["efficient", "efficiency", "shot selection"],
      FINISHING: ["finish", "rim", "layup"],
      REBOUNDING: ["rebound", "boards"],
      RIM_PROTECTION: ["rim protection", "block", "shot blocker"],
      POST_SCORING: ["post", "low block"],
      MOTOR: ["motor", "energy", "effort"],
      PHYSICALITY: ["physical", "strong", "contact"]
    };

    return keywordSignal(athlete, keywords[trait] || []);
  }

  function resolveMatrix(athlete){
    if(window.STATScoreBasketballPositionMatrix?.getMatrix){
      return window.STATScoreBasketballPositionMatrix.getMatrix(athlete);
    }

    if(window.STATScore?.BasketballPositionMatrix?.getMatrix){
      return window.STATScore.BasketballPositionMatrix.getMatrix(athlete);
    }

    return null;
  }

  function resolveTraitBaseline(traitName, athlete, matrix){
    const position = upper(matrix?.position || athlete?.primary_position || athlete?.position || "ATH");
    const trait = upper(traitName);

    const map = BASKETBALL_TRAIT_BASELINES[position] || {};
    if(map[trait] !== undefined) return map[trait];

    const base = POSITION_BASELINE[position] ?? POSITION_BASELINE.ATH ?? 63;

    const adjustments = {
      ATHLETICISM: 2,
      SKILL: 1,
      BASKETBALL_IQ: 1,
      DEFENSE: 0,
      PRODUCTION: 0,
      READINESS: -1,
      FINISHING: 1,
      PASSING: 1,
      SHOOTING: 2,
      REBOUNDING: 1,
      MOTOR: 2,
      VERSATILITY: 2,
      PHYSICALITY: 1
    };

    return clamp(base + (adjustments[trait] || 0));
  }

  function scoreTrait(trait, athlete, matrix){
    const direct =
      trait.value ??
      trait.score ??
      trait.rating ??
      getTraitScoreFromPayload(trait.name, athlete) ??
      null;

    let value = direct !== null && direct !== undefined && direct !== ""
      ? clamp(direct)
      : null;

    let source = "DIRECT";

    if(value === null){
      value = getMetricScore(athlete, trait.name);
      source = value === null ? "KEYWORD_OR_BASELINE" : "METRIC_INFERRED";
    }

    if(value === null){
      value = keywordTraitScore(trait.name, athlete);
      source = value === null ? "TRAIT_SPECIFIC_PROJECTION" : "EVIDENCE_INFERRED";
    }

    if(value === null){
      value = resolveTraitBaseline(trait.name, athlete, matrix);
      source = "TRAIT_SPECIFIC_PROJECTION";
    }

    return {
      ...trait,
      value,
      score: value,
      status: evidenceStatus(athlete),
      evidence: traitEvidence(athlete),
      scoring_source: source
    };
  }

  function average(values){
    const valid = values.filter(value => typeof value === "number" && !Number.isNaN(value));
    if(!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  function calculateBand(score){
    if(score === null) return "UNSCORED";
    if(score >= 90) return "ELITE";
    if(score >= 82) return "HIGH_MAJOR";
    if(score >= 74) return "COLLEGE_READY";
    if(score >= 66) return "DEVELOPING";
    if(score >= 58) return "WATCHLIST";
    return "FOUNDATIONAL";
  }

  function calculateStarProjection(score){
    if(score === null) return "UNRATED";
    if(score >= 92) return "★★★★★";
    if(score >= 84) return "★★★★";
    if(score >= 74) return "★★★";
    if(score >= 64) return "★★";
    return "★";
  }

  function generateExplanation(athlete, matrix, score, band){
    const name =
      athlete?.athlete_display_name ||
      [athlete?.first_name, athlete?.last_name].filter(Boolean).join(" ") ||
      "This athlete";

    return {
      summary:
        `${name} is evaluated under ${matrix.matrix_code} as ${matrix.archetype}. Current basketball signal is ${band} based on available profile, athletic metrics, film, production context, and verification data.`,
      factors: [
        "Sport-specific basketball matrix applied",
        "Position and archetype context applied",
        "Trait stack scored through available verified, inferred, or projected evidence",
        "Official score remains subject to verification, evaluator review, production history, and film validation"
      ],
      limitations: [
        "Projected trait values are provisional until verified basketball evidence is attached",
        "Full official STATScore requires evaluator-confirmed film, production, and competition context",
        "Academic and eligibility scores remain separate from athletic basketball score"
      ]
    };
  }

  function scoreAthlete(athlete){
    if(!athlete){
      return {
        ok: false,
        status: "NO_ATHLETE",
        message: "No athlete supplied to basketball scoring engine."
      };
    }

    const sport = upper(
      athlete.primary_sport ||
      athlete.sport ||
      athlete.raw_payload?.primarySport ||
      athlete.raw_payload?.sport
    );

    if(sport && sport !== "BASKETBALL" && sport !== "BB" && sport !== "HOOPS"){
      return {
        ok: false,
        status: "NON_BASKETBALL_ATHLETE",
        message: "Basketball scoring engine only handles basketball athletes."
      };
    }

    const matrix = resolveMatrix(athlete);

    if(!matrix || !Array.isArray(matrix.traits)){
      return {
        ok: false,
        status: "MATRIX_UNAVAILABLE",
        message: "Position matrix unavailable for basketball scoring."
      };
    }

    const scoredTraits = matrix.traits.map(trait => scoreTrait(trait, athlete, matrix));
    const scoreFinal = average(scoredTraits.map(trait => trait.value));
    const band = calculateBand(scoreFinal);
    const stars = calculateStarProjection(scoreFinal);

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,
      sport: "BASKETBALL",
      athlete_id: athlete.athlete_id || null,
      snapshot_id: athlete.snapshot_id || null,
      athlete_display_name:
        athlete.athlete_display_name ||
        [athlete.first_name, athlete.last_name].filter(Boolean).join(" "),
      position: matrix.position,
      archetype: matrix.archetype,
      archetype_code: matrix.archetype_code,
      matrix_code: matrix.matrix_code,
      score_final: scoreFinal,
      final_score: scoreFinal,
      score_band: band,
      star_projection: stars,
      official_status:
        upper(athlete.verification_status).includes("VERIFIED")
          ? "VERIFIED_PROFILE_SIGNAL"
          : "UNVERIFIED_PROFILE_SIGNAL",
      traits: scoredTraits,
      explanation: generateExplanation(athlete, matrix, scoreFinal, band),
      created_at: new Date().toISOString()
    };
  }

  function renderScoreToWindowAthlete(){
    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null;

    if(!athlete){
      warn("No current athlete found for basketball scoring.");
      return null;
    }

    const result = scoreAthlete(athlete);

    if(!result.ok){
      warn("Basketball scoring did not complete.", result);
      return result;
    }

    window.STATScoreCurrentBasketballScore = result;

    const matrixWithScores = {
      sport: result.sport,
      position: result.position,
      archetype: result.archetype,
      matrix_code: result.matrix_code,
      traits: result.traits
    };

    if(window.STATScoreBasketballPositionMatrix?.renderTraits){
      const container =
        document.querySelector("[data-statscore-performance-traits]") ||
        document.querySelector("#statscore-performance-traits") ||
        document.querySelector("#scPerformanceTraits") ||
        document.querySelector(".sc-performance-traits");

      if(container){
        window.STATScoreBasketballPositionMatrix.renderTraits(container, matrixWithScores);
      }
    }

    return result;
  }

  function init(){
    if(window.__STATSCORE_BASKETBALL_SCORING_ENGINE__) return;

    window.__STATSCORE_BASKETBALL_SCORING_ENGINE__ = true;

    window.STATScoreBasketballScoringEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      scoreAthlete,
      renderScoreToWindowAthlete,
      calculateBand,
      calculateStarProjection
    };

    window.STATScore = window.STATScore || {};
    window.STATScore.BasketballScoringEngine = window.STATScoreBasketballScoringEngine;

    const result = renderScoreToWindowAthlete();

    if(window.STATScoreEngineBus?.emit){
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        scored: Boolean(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      scored: Boolean(result && result.ok)
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})(); 
