/* ============================================================
   STATS-CORE™ BASEBALL SCORING ENGINE
   File: statscore-baseball-scoring-engine.js
   Version: STATSCORE-BASEBALL-SCORING-ENGINE-V1

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Baseball Athlete Snapshot → Trait Scores → Explainable Baseball Signal

   Canon:
   Each sport has its own scoring science.
   Each position has its own matrix.
   Outputs normalize into universal STATScore™ contract.
============================================================ */

(function(){
  "use strict";

  const ENGINE_ID = "statscore-baseball-scoring-engine";
  const VERSION = "STATSCORE-BASEBALL-SCORING-ENGINE-V1";

  const TRAIT_DEFAULT_STATUS = "PROJECTED";
  const VERIFIED_STATUS = "VERIFIED";
  const PENDING_STATUS = "PENDING_VERIFICATION";

  const POSITION_BASELINE = {
    P: 64,
    C: 64,
    INF: 65,
    OF: 65,
    HITTER: 65,
    UTIL: 63
  };

  const BASEBALL_TRAIT_BASELINES = {
    P: {
      VELOCITY: 66,
      FASTBALL_LIFE: 65,
      STRIKE_THROWING: 65,
      SECONDARY_STUFF: 64,
      COMMAND: 66,
      MOUND_PRESENCE: 64,
      DURABILITY: 63,
      SWING_AND_MISS_ABILITY: 65,
      PITCHABILITY: 65,
      SECONDARY_CONTROL: 64,
      TEMPO: 63,
      FIELDING_POSITION: 62,
      RUN_PREVENTION: 65,
      BREAKING_BALL_QUALITY: 65,
      SPIN_PROFILE: 64,
      PITCH_SEQUENCING: 64,
      DECEPTION: 63,
      COMPOSURE: 64
    },

    C: {
      RECEIVING: 66,
      BLOCKING: 65,
      THROWING_ARM: 65,
      POP_TIME: 65,
      GAME_MANAGEMENT: 66,
      PITCHER_HANDLING: 65,
      LEADERSHIP: 65,
      DURABILITY: 64,
      HIT_TOOL: 63,
      POWER: 63,
      PLATE_DISCIPLINE: 64,
      CONTACT_QUALITY: 63
    },

    INF: {
      HANDS: 66,
      FOOTWORK: 65,
      ARM_STRENGTH: 64,
      RANGE: 65,
      TRANSFER: 65,
      BASEBALL_IQ: 65,
      CONTACT_ABILITY: 64,
      DEFENSIVE_RELIABILITY: 66,
      ARM_ACCURACY: 64,
      DOUBLE_PLAY_ABILITY: 64,
      REACTION: 64,
      POWER: 63,
      CONTACT_QUALITY: 64,
      RUN_PRODUCTION: 63
    },

    OF: {
      ROUTE_EFFICIENCY: 65,
      FIRST_STEP: 65,
      RANGE: 66,
      ARM_STRENGTH: 65,
      BALL_TRACKING: 66,
      SPEED: 65,
      CONTACT_ABILITY: 64,
      DEFENSIVE_RELIABILITY: 65,
      COMMUNICATION: 63,
      ARM_ACCURACY: 64,
      TOP_OF_ORDER_VALUE: 64,
      POWER: 64,
      CONTACT_QUALITY: 64,
      RUN_PRODUCTION: 64,
      PLATE_DISCIPLINE: 64
    },

    HITTER: {
      HIT_TOOL: 66,
      POWER: 65,
      PLATE_DISCIPLINE: 65,
      CONTACT_QUALITY: 66,
      APPROACH: 65,
      SITUATIONAL_HITTING: 64,
      RUN_PRODUCTION: 65,
      CONSISTENCY: 64,
      CONTACT_ABILITY: 66,
      BAT_TO_BALL_SKILL: 66,
      SPEED: 63,
      ON_BASE_VALUE: 65,
      EXIT_VELOCITY: 65,
      LAUNCH_PROFILE: 64,
      PITCH_RECOGNITION: 65,
      DAMAGE_POTENTIAL: 65
    },

    UTIL: {
      VERSATILITY: 66,
      BASEBALL_IQ: 65,
      DEFENSIVE_RELIABILITY: 64,
      CONTACT_ABILITY: 64,
      ATHLETICISM: 64,
      ARM_UTILITY: 63,
      SPEED: 64,
      ROLE_ADAPTABILITY: 65
    }
  };

  function log(message, payload){
    console.log(`[STATS-CORE Baseball Scoring] ${message}`, payload || "");
  }

  function warn(message, payload){
    console.warn(`[STATS-CORE Baseball Scoring] ${message}`, payload || "");
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
    const raw = athlete.raw_payload || {};

    const velocity =
      n(athlete.pitch_velocity) ??
      n(athlete.velocity) ??
      n(raw.pitchVelocity) ??
      n(raw.velocity);

    const exitVelocity =
      n(athlete.exit_velocity) ??
      n(raw.exitVelocity) ??
      n(raw.exit_velocity);

    const popTime =
      n(athlete.pop_time) ??
      n(raw.popTime) ??
      n(raw.pop_time);

    const sixty =
      n(athlete.sixty_yard_dash) ??
      n(raw.sixtyYardDash) ??
      n(raw.sixty_yard_dash);

    if(trait.includes("VELOCITY") || trait.includes("FASTBALL")){
      if(velocity !== null) return clamp((velocity - 70) * 3 + 55);
    }

    if(trait.includes("EXIT_VELOCITY") || trait.includes("POWER") || trait.includes("DAMAGE")){
      if(exitVelocity !== null) return clamp((exitVelocity - 70) * 2.5 + 55);
    }

    if(trait.includes("POP_TIME")){
      if(popTime !== null) return clamp(100 - ((popTime - 1.75) * 80));
    }

    if(trait.includes("SPEED") || trait.includes("RANGE") || trait.includes("FIRST_STEP")){
      if(sixty !== null) return clamp(100 - ((sixty - 6.4) * 28));
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
      athlete?.raw_payload?.baseball_trait_scores,
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
      VELOCITY: ["velocity", "velo", "fastball"],
      FASTBALL_LIFE: ["ride", "life", "fastball"],
      STRIKE_THROWING: ["strike", "control", "zone"],
      COMMAND: ["command", "spot", "locate"],
      SECONDARY_STUFF: ["secondary", "curve", "slider", "changeup"],
      BREAKING_BALL_QUALITY: ["breaking", "slider", "curve", "spin"],
      RECEIVING: ["receiving", "framing", "quiet hands"],
      BLOCKING: ["blocking", "block"],
      THROWING_ARM: ["arm", "throwing", "carry"],
      POP_TIME: ["pop time", "quick release"],
      GAME_MANAGEMENT: ["game management", "calls game", "pitcher handling"],
      HANDS: ["hands", "soft hands", "fielding"],
      FOOTWORK: ["footwork", "feet"],
      RANGE: ["range", "cover ground"],
      TRANSFER: ["transfer", "quick exchange"],
      BASEBALL_IQ: ["iq", "instincts", "smart"],
      HIT_TOOL: ["hit tool", "hitter", "contact"],
      CONTACT_ABILITY: ["contact", "bat to ball"],
      POWER: ["power", "slug", "extra base"],
      PLATE_DISCIPLINE: ["discipline", "walk", "zone"],
      CONTACT_QUALITY: ["barrel", "quality contact", "hard contact"],
      ROUTE_EFFICIENCY: ["route", "efficient"],
      BALL_TRACKING: ["tracking", "reads ball"],
      VERSATILITY: ["versatile", "utility", "multiple positions"]
    };

    return keywordSignal(athlete, keywords[trait] || []);
  }

  function resolveMatrix(athlete){
    if(window.STATScoreBaseballPositionMatrix?.getMatrix){
      return window.STATScoreBaseballPositionMatrix.getMatrix(athlete);
    }

    if(window.STATScore?.BaseballPositionMatrix?.getMatrix){
      return window.STATScore.BaseballPositionMatrix.getMatrix(athlete);
    }

    return null;
  }

  function resolveTraitBaseline(traitName, athlete, matrix){
    const position = upper(matrix?.position || athlete?.primary_position || athlete?.position || "UTIL");
    const trait = upper(traitName);

    const map = BASEBALL_TRAIT_BASELINES[position] || {};
    if(map[trait] !== undefined) return map[trait];

    const base = POSITION_BASELINE[position] ?? POSITION_BASELINE.UTIL ?? 63;

    const adjustments = {
      ATHLETICISM: 1,
      BASEBALL_IQ: 2,
      SKILL: 1,
      PRODUCTION: 0,
      DEFENSE: 1,
      READINESS: -1,
      SPEED: 1,
      POWER: 1,
      CONTACT: 1,
      ARM_STRENGTH: 1,
      DEFENSIVE_RELIABILITY: 1,
      CONSISTENCY: 1,
      LEADERSHIP: 1,
      DURABILITY: 0
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
        `${name} is evaluated under ${matrix.matrix_code} as ${matrix.archetype}. Current baseball signal is ${band} based on available profile, position traits, baseball metrics, production context, and verification data.`,
      factors: [
        "Sport-specific baseball matrix applied",
        "Position and archetype context applied",
        "Trait stack scored through available verified, inferred, or projected evidence",
        "Official score remains subject to verification, evaluator review, production history, and film/event validation"
      ],
      limitations: [
        "Projected trait values are provisional until verified baseball evidence is attached",
        "Full official STATScore requires evaluator-confirmed production, measurements, and competition context",
        "Academic and eligibility scores remain separate from athletic baseball score"
      ]
    };
  }

  function scoreAthlete(athlete){
    if(!athlete){
      return {
        ok: false,
        status: "NO_ATHLETE",
        message: "No athlete supplied to baseball scoring engine."
      };
    }

    const sport = upper(
      athlete.primary_sport ||
      athlete.sport ||
      athlete.raw_payload?.primarySport ||
      athlete.raw_payload?.sport
    );

    if(sport && sport !== "BASEBALL" && sport !== "BASE_BALL" && sport !== "BB"){
      return {
        ok: false,
        status: "NON_BASEBALL_ATHLETE",
        message: "Baseball scoring engine only handles baseball athletes."
      };
    }

    const matrix = resolveMatrix(athlete);

    if(!matrix || !Array.isArray(matrix.traits)){
      return {
        ok: false,
        status: "MATRIX_UNAVAILABLE",
        message: "Position matrix unavailable for baseball scoring."
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
      sport: "BASEBALL",
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
      warn("No current athlete found for baseball scoring.");
      return null;
    }

    const result = scoreAthlete(athlete);

    if(!result.ok){
      warn("Baseball scoring did not complete.", result);
      return result;
    }

    window.STATScoreCurrentBaseballScore = result;

    const matrixWithScores = {
      sport: result.sport,
      position: result.position,
      archetype: result.archetype,
      matrix_code: result.matrix_code,
      traits: result.traits
    };

    if(window.STATScoreBaseballPositionMatrix?.renderTraits){
      const container =
        document.querySelector("[data-statscore-performance-traits]") ||
        document.querySelector("#statscore-performance-traits") ||
        document.querySelector("#scPerformanceTraits") ||
        document.querySelector(".sc-performance-traits");

      if(container){
        window.STATScoreBaseballPositionMatrix.renderTraits(container, matrixWithScores);
      }
    }

    return result;
  }

  function init(){
    if(window.__STATSCORE_BASEBALL_SCORING_ENGINE__) return;

    window.__STATSCORE_BASEBALL_SCORING_ENGINE__ = true;

    window.STATScoreBaseballScoringEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      scoreAthlete,
      renderScoreToWindowAthlete,
      calculateBand,
      calculateStarProjection
    };

    window.STATScore = window.STATScore || {};
    window.STATScore.BaseballScoringEngine = window.STATScoreBaseballScoringEngine;

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
