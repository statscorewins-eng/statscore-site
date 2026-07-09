/* ============================================================
   STATS-CORE™ TRACK SCORING ENGINE
   File: statscore-track-scoring-engine.js
   Version: STATSCORE-TRACK-SCORING-ENGINE-V1

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Track Athlete Snapshot → Event Trait Scores → Explainable Track Signal
============================================================ */

(function(){
  "use strict";

  const ENGINE_ID = "statscore-track-scoring-engine";
  const VERSION = "STATSCORE-TRACK-SCORING-ENGINE-V1";

  const TRAIT_DEFAULT_STATUS = "PROJECTED";
  const VERIFIED_STATUS = "VERIFIED";
  const PENDING_STATUS = "PENDING_VERIFICATION";

  const EVENT_BASELINES = {
    SPRINT: 65,
    DISTANCE: 64,
    RELAY: 64,
    JUMPS: 65,
    THROWS: 64,
    GENERAL: 63
  };

  const TRACK_TRAIT_BASELINES = {
    SPRINT: {
      ACCELERATION: 67,
      TOP_END_SPEED: 68,
      STRIDE_FREQUENCY: 65,
      STRIDE_LENGTH: 65,
      START_REACTION: 64,
      POWER_OUTPUT: 66,
      SPEED_ENDURANCE: 65,
      COMPETITIVE_FINISH: 65,
      BLOCK_TECHNIQUE: 64,
      RUNNING_MECHANICS: 65,
      EFFICIENCY: 64,
      TRANSITION_PHASE: 64,
      RACE_DISCIPLINE: 64,
      FINISH_MECHANICS: 64
    },

    DISTANCE: {
      AEROBIC_CAPACITY: 66,
      RUNNING_ECONOMY: 65,
      RACE_STRATEGY: 64,
      MENTAL_TOUGHNESS: 65,
      CONSISTENCY: 65,
      CLOSING_SPEED: 64,
      PACING: 66,
      COMPETITIVE_FINISH: 64,
      RACE_IQ: 64,
      PACK_AWARENESS: 63,
      KICK_FINISH: 64,
      ENDURANCE: 66,
      POSITIONING: 63,
      ADAPTABILITY: 63
    },

    RELAY: {
      EXCHANGE_TECHNIQUE: 66,
      ACCELERATION: 66,
      TOP_END_SPEED: 67,
      COMMUNICATION: 64,
      TIMING: 65,
      RACE_AWARENESS: 64,
      FINISH: 65,
      TEAM_RELIABILITY: 65
    },

    JUMPS: {
      EXPLOSIVENESS: 67,
      APPROACH_SPEED: 66,
      TAKEOFF_TECHNIQUE: 65,
      BODY_CONTROL: 65,
      FLIGHT_MECHANICS: 64,
      LANDING: 64,
      CONSISTENCY: 64,
      COMPETITIVE_EXECUTION: 65
    },

    THROWS: {
      POWER: 67,
      EXPLOSIVENESS: 66,
      TECHNIQUE: 65,
      BALANCE: 64,
      RELEASE_MECHANICS: 65,
      FOOTWORK: 64,
      CONSISTENCY: 64,
      COMPETITIVE_EXECUTION: 65
    }
  };

  function log(message, payload){
    console.log(`[STATS-CORE Track Scoring] ${message}`, payload || "");
  }

  function warn(message, payload){
    console.warn(`[STATS-CORE Track Scoring] ${message}`, payload || "");
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
      athlete?.verified_event_source ||
      athlete?.official_time ||
      athlete?.official_mark
    );

    const verified = upper(athlete?.verification_status).includes("VERIFIED");

    if(verified && hasEvidence) return VERIFIED_STATUS;
    if(hasEvidence) return TRAIT_DEFAULT_STATUS;

    return PENDING_STATUS;
  }

  function traitEvidence(athlete){
    const evidence = [];

    if(athlete?.verified_event_source){
      evidence.push({
        type: "EVENT",
        label: athlete.verified_event_source
      });
    }

    if(athlete?.official_time){
      evidence.push({
        type: "OFFICIAL_TIME",
        label: "Official Time",
        value: athlete.official_time
      });
    }

    if(athlete?.official_mark){
      evidence.push({
        type: "OFFICIAL_MARK",
        label: "Official Mark",
        value: athlete.official_mark
      });
    }

    if(athlete?.highlight_url){
      evidence.push({
        type: "HIGHLIGHT",
        label: "Highlight Film",
        url: athlete.highlight_url
      });
    }

    return evidence;
  }

  function normalizeEvent(value){
    const e = upper(value);

    const aliases = {
      "100M": "SPRINT",
      "200M": "SPRINT",
      "400M": "SPRINT",
      "SPRINTS": "SPRINT",

      "800M": "DISTANCE",
      "1600M": "DISTANCE",
      "3200M": "DISTANCE",
      "CROSS_COUNTRY": "DISTANCE",

      "4X100": "RELAY",
      "4X200": "RELAY",
      "4X400": "RELAY",

      "LONG_JUMP": "JUMPS",
      "HIGH_JUMP": "JUMPS",
      "TRIPLE_JUMP": "JUMPS",
      "POLE_VAULT": "JUMPS",

      "SHOT_PUT": "THROWS",
      "DISCUS": "THROWS",
      "JAVELIN": "THROWS"
    };

    return aliases[e] || e || "GENERAL";
  }

  function getEventGroup(athlete, matrix){
    return normalizeEvent(
      matrix?.position ||
      athlete?.primary_event ||
      athlete?.event ||
      athlete?.track_event ||
      athlete?.position ||
      athlete?.raw_payload?.primaryEvent ||
      athlete?.raw_payload?.event ||
      "GENERAL"
    );
  }

  function getTrackMetricScore(athlete, traitName, matrix){
    const trait = upper(traitName);
    const raw = athlete.raw_payload || {};
    const eventGroup = getEventGroup(athlete, matrix);

    const officialTime =
      n(athlete.official_time) ??
      n(raw.officialTime) ??
      n(raw.official_time) ??
      n(raw.trackTime);

    const officialMark =
      n(athlete.official_mark) ??
      n(raw.officialMark) ??
      n(raw.official_mark) ??
      n(raw.trackMark);

    const vertical =
      n(athlete.vertical_jump) ??
      n(raw.verticalJump) ??
      n(raw.vertical);

    const broad =
      n(athlete.broad_jump) ??
      n(raw.broadJump) ??
      n(raw.broad_jump);

    if(eventGroup === "SPRINT" && officialTime !== null){
      if(trait.includes("TOP_END") || trait.includes("ACCELERATION") || trait.includes("SPEED")){
        return clamp(100 - ((officialTime - 10.8) * 18));
      }
      if(trait.includes("SPEED_ENDURANCE") || trait.includes("FINISH")){
        return clamp(100 - ((officialTime - 11.2) * 16));
      }
    }

    if(eventGroup === "DISTANCE" && officialTime !== null){
      if(trait.includes("ENDURANCE") || trait.includes("AEROBIC") || trait.includes("PACING")){
        return clamp(100 - ((officialTime - 120) * 0.16));
      }
    }

    if(eventGroup === "JUMPS"){
      if(officialMark !== null){
        return clamp(45 + officialMark * 2.2);
      }
      if(vertical !== null){
        return clamp(45 + vertical * 1.15);
      }
      if(broad !== null){
        return clamp(40 + broad * 0.38);
      }
    }

    if(eventGroup === "THROWS" && officialMark !== null){
      if(trait.includes("POWER") || trait.includes("EXPLOSIVENESS") || trait.includes("RELEASE")){
        return clamp(45 + officialMark * 1.1);
      }
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
      athlete?.raw_payload?.track_trait_scores,
      athlete?.raw_payload?.event_trait_scores
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
      ACCELERATION: ["acceleration", "drive phase", "explosive start"],
      TOP_END_SPEED: ["top speed", "speed", "fast"],
      STRIDE_FREQUENCY: ["cadence", "turnover", "frequency"],
      STRIDE_LENGTH: ["stride length", "length"],
      START_REACTION: ["start", "blocks", "reaction"],
      POWER_OUTPUT: ["power", "explosive"],
      SPEED_ENDURANCE: ["speed endurance", "finish"],
      COMPETITIVE_FINISH: ["finish", "kick", "close"],
      RUNNING_MECHANICS: ["mechanics", "form", "technique"],
      AEROBIC_CAPACITY: ["endurance", "aerobic"],
      RUNNING_ECONOMY: ["economy", "efficient"],
      RACE_STRATEGY: ["strategy", "tactical"],
      MENTAL_TOUGHNESS: ["mental", "tough", "grit"],
      PACING: ["pace", "pacing"],
      EXCHANGE_TECHNIQUE: ["exchange", "handoff"],
      COMMUNICATION: ["communication", "relay"],
      EXPLOSIVENESS: ["explosive", "bounce"],
      APPROACH_SPEED: ["approach", "speed"],
      TAKEOFF_TECHNIQUE: ["takeoff", "jump technique"],
      POWER: ["power", "strength"],
      RELEASE_MECHANICS: ["release", "throwing mechanics"],
      FOOTWORK: ["footwork", "feet"],
      CONSISTENCY: ["consistent", "repeatable"]
    };

    return keywordSignal(athlete, keywords[trait] || []);
  }

  function resolveMatrix(athlete){
    if(window.STATScoreTrackPositionMatrixEngine?.getMatrix){
      return window.STATScoreTrackPositionMatrixEngine.getMatrix(athlete);
    }

    if(window.STATScore?.TrackPositionMatrixEngine?.getMatrix){
      return window.STATScore.TrackPositionMatrixEngine.getMatrix(athlete);
    }

    return null;
  }

  function resolveTraitBaseline(traitName, athlete, matrix){
    const group = getEventGroup(athlete, matrix);
    const trait = upper(traitName);

    const map = TRACK_TRAIT_BASELINES[group] || {};
    if(map[trait] !== undefined) return map[trait];

    const base = EVENT_BASELINES[group] ?? EVENT_BASELINES.GENERAL ?? 63;

    const adjustments = {
      ATHLETICISM: 2,
      TECHNIQUE: 1,
      CONSISTENCY: 1,
      COMPETITIVE_PERFORMANCE: 1,
      COACHABILITY: 1,
      DEVELOPMENT: 0,
      POWER: 2,
      SPEED: 2,
      ENDURANCE: 2,
      BALANCE: 1,
      MECHANICS: 1,
      EXECUTION: 1
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
      value = getTrackMetricScore(athlete, trait.name, matrix);
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
        `${name} is evaluated under ${matrix.matrix_code} as ${matrix.archetype}. Current track signal is ${band} based on available profile, event traits, official marks/times, competition context, and verification data.`,
      factors: [
        "Sport-specific track matrix applied",
        "Event group and archetype context applied",
        "Trait stack scored through available verified, inferred, or projected evidence",
        "Official score remains subject to verification, event result validation, and competition context"
      ],
      limitations: [
        "Projected trait values are provisional until verified event evidence is attached",
        "Full official STATScore requires verified times/marks and competition context",
        "Academic and eligibility scores remain separate from athletic track score"
      ]
    };
  }

  function scoreAthlete(athlete){
    if(!athlete){
      return {
        ok: false,
        status: "NO_ATHLETE",
        message: "No athlete supplied to track scoring engine."
      };
    }

    const sport = upper(
      athlete.primary_sport ||
      athlete.sport ||
      athlete.raw_payload?.primarySport ||
      athlete.raw_payload?.sport
    );

    if(sport && sport !== "TRACK" && sport !== "TRACK_FIELD" && sport !== "TRACK_AND_FIELD"){
      return {
        ok: false,
        status: "NON_TRACK_ATHLETE",
        message: "Track scoring engine only handles track athletes."
      };
    }

    const matrix = resolveMatrix(athlete);

    if(!matrix || !Array.isArray(matrix.traits)){
      return {
        ok: false,
        status: "MATRIX_UNAVAILABLE",
        message: "Event matrix unavailable for track scoring."
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
      sport: "TRACK",
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
      warn("No current athlete found for track scoring.");
      return null;
    }

    const result = scoreAthlete(athlete);

    if(!result.ok){
      warn("Track scoring did not complete.", result);
      return result;
    }

    window.STATScoreCurrentTrackScore = result;

    return result;
  }

  function init(){
    if(window.__STATSCORE_TRACK_SCORING_ENGINE__) return;

    window.__STATSCORE_TRACK_SCORING_ENGINE__ = true;

    window.STATScoreTrackScoringEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      scoreAthlete,
      renderScoreToWindowAthlete,
      calculateBand,
      calculateStarProjection
    };

    window.STATScore = window.STATScore || {};
    window.STATScore.TrackScoringEngine = window.STATScoreTrackScoringEngine;

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
