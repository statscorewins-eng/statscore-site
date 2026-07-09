/* ============================================================
   STATScore™ Football Scoring Engine
   File: statscore-football-scoring-engine.js
   Version: v1.1-trait-specific-football-matrix

   Purpose:
   Football Athlete Snapshot → Trait Scores → Explainable Football Signal

   Canon:
   Stream 9 owns football scoring interpretation.
   Stream 3 consumes/render outputs.
   This engine does not publish final composite authority.
============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-football-scoring-engine";
  const VERSION = "v1.1-trait-specific-football-matrix";

  const TRAIT_DEFAULT_STATUS = "PROJECTED";
  const VERIFIED_STATUS = "VERIFIED";
  const PENDING_STATUS = "PENDING_VERIFICATION";

  const POSITION_BASELINE = {
    QB: 63,
    WR: 66,
    RB: 66,
    DB: 65,
    LB: 64,
    OL: 62,
    DL: 63,
    ATH: 62
  };

  const QB_TRAIT_BASELINES = {
    PRO_STYLE_QB: {
      PROCESSING: 62,
      DECISION_SPEED: 61,
      ARM_TALENT: 65,
      BALL_PLACEMENT: 63,
      POCKET_PRESENCE: 62,
      FIELD_VISION: 61,
      PRESSURE_RESPONSE: 60,
      LEADERSHIP: 64,
      TIMING: 62,
      SHORT_INTERMEDIATE_ACCURACY: 63,
      POCKET_DISCIPLINE: 62,
      PROGRESSION_CONTROL: 61,
      PRE_SNAP_RECOGNITION: 60
    },

    DUAL_THREAT_QB: {
      PROCESSING: 61,
      DECISION_SPEED: 62,
      BALL_PLACEMENT: 62,
      ARM_TALENT: 65,
      FIELD_VISION: 61,
      POCKET_PRESENCE: 60,
      ESCAPE_ABILITY: 70,
      DESIGNED_RUN_VALUE: 69,
      OPEN_FIELD_THREAT: 70,
      SCRAMBLE_TO_THROW_ABILITY: 66,
      BALL_SECURITY: 62,
      PRESSURE_RESPONSE: 65
    },

    POCKET_DISTRIBUTOR_QB: {
      PROCESSING: 64,
      TIMING: 65,
      BALL_PLACEMENT: 64,
      SHORT_INTERMEDIATE_ACCURACY: 65,
      POCKET_DISCIPLINE: 63,
      PROGRESSION_CONTROL: 64,
      PRE_SNAP_RECOGNITION: 63,
      LEADERSHIP: 64
    },

    DEVELOPMENTAL_ATHLETE_QB: {
      RAW_ATHLETICISM: 67,
      ARM_STRENGTH: 65,
      IMPROVISATION: 66,
      PROCESSING_GROWTH: 58,
      MECHANICS_DEVELOPMENT: 57,
      COACHABILITY: 64,
      OPEN_FIELD_THREAT: 67,
      PROJECTION_UPSIDE: 66
    }
  };

  const FOOTBALL_TRAIT_BASELINES = {
    QB: QB_TRAIT_BASELINES,

    WR: {
      DEFAULT: {
        RELEASE_PACKAGE: 63,
        SEPARATION: 64,
        HANDS: 65,
        BALL_TRACKING: 64,
        BODY_CONTROL: 64,
        CONTESTED_CATCH: 63,
        ROUTE_IQ: 62,
        BOUNDARY_AWARENESS: 62,
        SHORT_AREA_QUICKNESS: 65,
        YAC: 65,
        TOP_END_SPEED: 66,
        ACCELERATION: 66
      }
    },

    RB: {
      DEFAULT: {
        VISION: 64,
        BURST: 66,
        CONTACT_BALANCE: 65,
        RECEIVING_ABILITY: 62,
        BALL_SECURITY: 63,
        OPEN_FIELD_ABILITY: 66,
        PASS_PROTECTION: 60,
        EXPLOSIVE_VALUE: 65,
        PAD_LEVEL: 63,
        LEG_DRIVE: 64
      }
    },

    DB: {
      DEFAULT: {
        HIP_FLUIDITY: 64,
        MIRROR_ABILITY: 63,
        PRESS_COVERAGE: 62,
        RECOVERY_SPEED: 65,
        BALL_SKILLS: 63,
        ROUTE_RECOGNITION: 62,
        CLOSING_BURST: 65,
        COMPETITIVE_TOUGHNESS: 64,
        ZONE_IQ: 62,
        TACKLING: 63
      }
    },

    LB: {
      DEFAULT: {
        RUN_FIT_IQ: 63,
        COMMUNICATION: 63,
        TACKLING: 65,
        BLOCK_SHEDDING: 63,
        PLAY_RECOGNITION: 62,
        LEADERSHIP: 64,
        INSIDE_RANGE: 64,
        GAP_DISCIPLINE: 63,
        COVERAGE_ABILITY: 61,
        CLOSING_SPEED: 64
      }
    },

    OL: {
      DEFAULT: {
        PASS_SET: 61,
        FOOTWORK: 61,
        ANCHOR: 63,
        HAND_PLACEMENT: 62,
        RECOVERY: 60,
        BALANCE: 62,
        LENGTH_USAGE: 63,
        PROCESSING: 62,
        DRIVE_POWER: 63,
        LEVERAGE: 62
      }
    },

    DL: {
      DEFAULT: {
        FIRST_STEP: 64,
        BEND: 62,
        HAND_VIOLENCE: 63,
        CLOSING_SPEED: 64,
        RUSH_PLAN: 61,
        EDGE_PRESSURE: 63,
        MOTOR: 65,
        DISRUPTION_RATE: 63,
        GET_OFF: 64,
        POWER: 63
      }
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Football Scoring] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Football Scoring] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function normalizeUpper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  }

  function clamp(value, min = 0, max = 100) {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function numberOrNull(value) {
    const n = Number(String(value ?? "").replace(/[^\d.]/g, ""));
    return Number.isNaN(n) ? null : n;
  }

  function parseHeightToInches(height) {
    const raw = String(height || "").trim();
    if (!raw) return null;

    const feetInches = raw.match(/(\d+)\s*['’]\s*(\d+)?/);
    if (feetInches) {
      const feet = Number(feetInches[1]);
      const inches = Number(feetInches[2] || 0);
      return feet * 12 + inches;
    }

    return numberOrNull(raw);
  }

  function parseWeight(weight) {
    return numberOrNull(weight);
  }

  function parseDash40(value) {
    return numberOrNull(value);
  }

  function scoreDash40(position, dash) {
    if (!dash) return null;

    const pos = normalizeUpper(position);

    const ranges = {
      QB: [5.05, 4.45],
      WR: [4.85, 4.35],
      RB: [4.85, 4.35],
      DB: [4.85, 4.35],
      LB: [5.05, 4.50],
      OL: [5.65, 4.95],
      DL: [5.45, 4.70],
      ATH: [5.10, 4.40]
    };

    const [slow, elite] = ranges[pos] || [5.2, 4.45];
    return clamp(((slow - dash) / (slow - elite)) * 100);
  }

  function scoreFrame(position, heightInches, weight) {
    if (!heightInches && !weight) return null;

    const pos = normalizeUpper(position);

    const targets = {
      QB: { h: [72, 78], w: [180, 230] },
      WR: { h: [68, 76], w: [160, 215] },
      RB: { h: [66, 73], w: [170, 225] },
      DB: { h: [68, 75], w: [160, 210] },
      LB: { h: [70, 76], w: [195, 245] },
      OL: { h: [73, 80], w: [250, 330] },
      DL: { h: [72, 79], w: [225, 315] },
      ATH: { h: [68, 78], w: [160, 245] }
    };

    const target = targets[pos] || targets.ATH;

    let hScore = null;
    let wScore = null;

    if (heightInches) {
      const [minH, maxH] = target.h;
      const midpoint = (minH + maxH) / 2;
      hScore = heightInches >= minH && heightInches <= maxH
        ? 88
        : clamp(88 - Math.abs(heightInches - midpoint) * 7);
    }

    if (weight) {
      const [minW, maxW] = target.w;
      const midpoint = (minW + maxW) / 2;
      wScore = weight >= minW && weight <= maxW
        ? 88
        : clamp(88 - Math.abs(weight - midpoint) * 0.9);
    }

    const scores = [hScore, wScore].filter(v => v !== null);
    if (!scores.length) return null;

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  function keywordSignal(athlete, keywords) {
    const text = [
      athlete?.position_notes,
      athlete?.academic_notes,
      athlete?.verified_event_source,
      athlete?.raw_payload?.notes,
      athlete?.raw_payload?.style,
      athlete?.raw_payload?.strengths,
      athlete?.raw_payload?.weaknesses
    ].filter(Boolean).join(" ").toLowerCase();

    if (!text) return null;

    let hits = 0;

    keywords.forEach(word => {
      if (text.includes(String(word).toLowerCase())) hits += 1;
    });

    if (!hits) return null;

    return clamp(62 + hits * 8);
  }

  function evidenceStatus(athlete) {
    const hasFilm = Boolean(
      athlete?.highlight_url ||
      athlete?.game_film_url ||
      athlete?.recruiting_profile_url
    );

    const verified = normalizeUpper(athlete?.verification_status).includes("VERIFIED");

    if (verified && hasFilm) return VERIFIED_STATUS;
    if (hasFilm) return TRAIT_DEFAULT_STATUS;

    return PENDING_STATUS;
  }

  function traitEvidence(athlete) {
    const evidence = [];

    if (athlete?.highlight_url) {
      evidence.push({
        type: "HIGHLIGHT",
        label: "Highlight Film",
        url: athlete.highlight_url
      });
    }

    if (athlete?.game_film_url) {
      evidence.push({
        type: "GAME_FILM",
        label: "Game Film",
        url: athlete.game_film_url
      });
    }

    if (athlete?.verified_event_source) {
      evidence.push({
        type: "EVENT",
        label: athlete.verified_event_source
      });
    }

    return evidence;
  }

  function getTraitScoreFromPayload(traitName, athlete) {
    const key = normalizeUpper(traitName);

    const sources = [
      athlete?.trait_scores,
      athlete?.raw_payload?.trait_scores,
      athlete?.raw_payload?.football_trait_scores,
      athlete?.raw_payload?.position_trait_scores
    ];

    for (const source of sources) {
      if (!source || typeof source !== "object") continue;

      if (source[traitName] !== undefined) return source[traitName];
      if (source[key] !== undefined) return source[key];

      const matchKey = Object.keys(source).find(k => normalizeUpper(k) === key);
      if (matchKey) return source[matchKey];
    }

    return null;
  }

  function baseTraitValue(traitName, athlete, matrix) {
    const position = matrix?.position || athlete?.primary_position || athlete?.position;
    const dash = parseDash40(athlete?.dash40 || athlete?.dash_40 || athlete?.forty);
    const height = parseHeightToInches(athlete?.height);
    const weight = parseWeight(athlete?.weight);

    const speedScore = scoreDash40(position, dash);
    const frameScore = scoreFrame(position, height, weight);

    const trait = normalizeUpper(traitName);

    const keywordScores = {
      PROCESSING: ["processing", "reads", "progression", "decision", "iq"],
      DECISION_SPEED: ["quick decision", "fast read", "decisive", "anticipation"],
      ARM_TALENT: ["arm strength", "velocity", "deep ball", "drive throws"],
      ARM_STRENGTH: ["arm strength", "velocity", "deep ball", "drive throws"],
      BALL_PLACEMENT: ["accuracy", "placement", "touch", "catchable"],
      SHORT_INTERMEDIATE_ACCURACY: ["accuracy", "placement", "short", "intermediate"],
      FIELD_VISION: ["vision", "reads field", "sees field", "anticipation"],
      POCKET_PRESENCE: ["pocket", "climb", "pressure", "composure"],
      POCKET_DISCIPLINE: ["pocket discipline", "climb", "structure", "timing"],
      PRESSURE_RESPONSE: ["pressure", "escape", "composure", "blitz"],
      LEADERSHIP: ["leader", "captain", "command", "communication"],
      ESCAPE_ABILITY: ["escape", "mobile", "scramble", "extend"],
      DESIGNED_RUN_VALUE: ["designed run", "read option", "rpo", "run threat"],
      OPEN_FIELD_THREAT: ["open field", "explosive", "breakaway", "elusive"],
      SCRAMBLE_TO_THROW_ABILITY: ["scramble to throw", "off platform", "extend play"],
      BALL_SECURITY: ["ball security", "protects ball", "low turnover"],
      TIMING: ["timing", "rhythm", "anticipation"],
      PROGRESSION_CONTROL: ["progression", "reads", "control"],
      PRE_SNAP_RECOGNITION: ["pre snap", "recognition", "coverage"],
      SEPARATION: ["separation", "route", "release"],
      HANDS: ["hands", "catch", "reliable"],
      ROUTE_IQ: ["route iq", "route discipline", "route"],
      CONTACT_BALANCE: ["contact balance", "balance", "yards after contact"],
      VISION: ["vision", "patience", "lane"],
      BURST: ["burst", "explosive", "acceleration"]
    };

    const keywordScore = keywordSignal(athlete, keywordScores[trait] || []);

    if (
      trait.includes("SPEED") ||
      trait.includes("BURST") ||
      trait.includes("ACCELERATION") ||
      trait.includes("OPEN_FIELD") ||
      trait.includes("ESCAPE") ||
      trait.includes("RECOVERY") ||
      trait.includes("FIRST_STEP") ||
      trait.includes("GET_OFF")
    ) {
      return speedScore ?? keywordScore ?? null;
    }

    if (
      trait.includes("FRAME") ||
      trait.includes("POWER") ||
      trait.includes("ANCHOR") ||
      trait.includes("PHYSICAL") ||
      trait.includes("CONTACT") ||
      trait.includes("STRENGTH") ||
      trait.includes("DRIVE")
    ) {
      return frameScore ?? keywordScore ?? null;
    }

    return keywordScore ?? null;
  }

  function resolveTraitBaseline(traitName, athlete, matrix) {
    const position = normalizeUpper(matrix?.position || athlete?.primary_position || athlete?.position || "ATH");
    const traitKey = normalizeUpper(traitName);

    const archetypeCode =
      normalizeUpper(matrix?.archetype_code) ||
      normalizeUpper(matrix?.archetype) ||
      "DEFAULT";

    const positionMap = FOOTBALL_TRAIT_BASELINES[position];
    const archetypeMap =
      positionMap?.[archetypeCode] ||
      positionMap?.DEFAULT ||
      null;

    if (archetypeMap && archetypeMap[traitKey] !== undefined) {
      return archetypeMap[traitKey];
    }

    const base = POSITION_BASELINE[position] ?? POSITION_BASELINE.ATH ?? 60;

    const traitAdjustments = {
      PROCESSING: -1,
      DECISION_SPEED: -2,
      TIMING: -1,
      ACCURACY: 0,
      SHORT_INTERMEDIATE_ACCURACY: 0,
      BALL_PLACEMENT: 0,
      ARM_TALENT: 2,
      ARM_STRENGTH: 2,
      FIELD_VISION: -2,
      POCKET_PRESENCE: -1,
      POCKET_DISCIPLINE: -1,
      PRESSURE_RESPONSE: -3,
      LEADERSHIP: 1,
      ESCAPE_ABILITY: 4,
      DESIGNED_RUN_VALUE: 4,
      OPEN_FIELD_THREAT: 5,
      SCRAMBLE_TO_THROW_ABILITY: 3,
      BALL_SECURITY: -1,
      RAW_ATHLETICISM: 4,
      IMPROVISATION: 3,
      COACHABILITY: 2,
      PROJECTION_UPSIDE: 3
    };

    return clamp(base + (traitAdjustments[traitKey] || 0));
  }

  function applyProjectionFallback(traitName, athlete, matrix) {
    let value = resolveTraitBaseline(traitName, athlete, matrix);

    const traitKey = normalizeUpper(traitName);
    const archetype = normalizeUpper(matrix?.archetype_code || matrix?.archetype);
    const verified = normalizeUpper(athlete?.verification_status).includes("VERIFIED");

    if (archetype.includes("DUAL_THREAT")) {
      const mobileTraits = [
        "ESCAPE",
        "RUN",
        "OPEN_FIELD",
        "SCRAMBLE",
        "BURST",
        "IMPROVISATION",
        "ATHLETICISM"
      ];

      if (mobileTraits.some(key => traitKey.includes(key))) {
        value += 3;
      }
    }

    if (verified) value += 2;

    return clamp(value);
  }

  function scoreTrait(trait, athlete, matrix) {
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

    if (value === null) {
      value = baseTraitValue(trait.name, athlete, matrix);
      source = value === null ? "TRAIT_SPECIFIC_PROJECTION" : "EVIDENCE_INFERRED";
    }

    if (value === null) {
      value = applyProjectionFallback(trait.name, athlete, matrix);
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

  function average(values) {
    const valid = values.filter(v => typeof v === "number" && !Number.isNaN(v));
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  function calculateBand(score) {
    if (score === null) return "UNSCORED";
    if (score >= 90) return "ELITE";
    if (score >= 82) return "HIGH_MAJOR";
    if (score >= 74) return "COLLEGE_READY";
    if (score >= 66) return "DEVELOPING";
    if (score >= 58) return "WATCHLIST";
    return "FOUNDATIONAL";
  }

  function calculateStarProjection(score) {
    if (score === null) return "UNRATED";
    if (score >= 92) return "★★★★★";
    if (score >= 84) return "★★★★";
    if (score >= 74) return "★★★";
    if (score >= 64) return "★★";
    return "★";
  }

  function generateExplanation(athlete, matrix, score, band) {
    const name =
      athlete?.athlete_display_name ||
      [athlete?.first_name, athlete?.last_name].filter(Boolean).join(" ") ||
      "This athlete";

    return {
      summary:
        `${name} is evaluated under ${matrix.matrix_code} as ${matrix.archetype}. Current football signal is ${band} based on available profile, metric, film, and verification data.`,
      factors: [
        "Sport-specific football matrix applied",
        "Position and archetype context applied",
        "Trait stack scored through available verified, inferred, or trait-specific projected evidence",
        "Official score remains subject to verification, evaluator review, and film validation"
      ],
      limitations: [
        "Projected trait values are provisional until verified evidence is attached",
        "Full official STATScore requires evaluator-confirmed metrics and film review",
        "Academic and NCAA eligibility scores are separate from athletic score"
      ]
    };
  }

  function resolveMatrix(athlete) {
    if (window.STATScorePositionMatrixEngine?.getMatrix) {
      return window.STATScorePositionMatrixEngine.getMatrix(athlete);
    }

    if (window.STATScore?.PositionMatrixEngine?.getMatrix) {
      return window.STATScore.PositionMatrixEngine.getMatrix(athlete);
    }

    return null;
  }

  function scoreAthlete(athlete) {
    if (!athlete) {
      return {
        ok: false,
        status: "NO_ATHLETE",
        message: "No athlete supplied to football scoring engine."
      };
    }

    const sport = normalizeUpper(athlete.primary_sport || athlete.sport);

    if (sport && sport !== "FOOTBALL") {
      return {
        ok: false,
        status: "NON_FOOTBALL_ATHLETE",
        message: "Football scoring engine only handles football athletes."
      };
    }

    const matrix = resolveMatrix(athlete);

    if (!matrix || !Array.isArray(matrix.traits)) {
      return {
        ok: false,
        status: "MATRIX_UNAVAILABLE",
        message: "Position matrix unavailable for football scoring."
      };
    }

    const scoredTraits = matrix.traits.map(trait =>
      scoreTrait(trait, athlete, matrix)
    );

    const scoreFinal = average(scoredTraits.map(trait => trait.value));
    const band = calculateBand(scoreFinal);
    const stars = calculateStarProjection(scoreFinal);

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,
      sport: "FOOTBALL",
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
        normalizeUpper(athlete.verification_status).includes("VERIFIED")
          ? "VERIFIED_PROFILE_SIGNAL"
          : "UNVERIFIED_PROFILE_SIGNAL",
      traits: scoredTraits,
      explanation: generateExplanation(athlete, matrix, scoreFinal, band),
      created_at: new Date().toISOString()
    };
  }

  function renderScoreToWindowAthlete() {
    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null;

    if (!athlete) {
      warn("No current athlete found for football scoring.");
      return null;
    }

    const result = scoreAthlete(athlete);

    if (!result.ok) {
      warn("Football scoring did not complete.", result);
      return result;
    }

    window.STATScoreCurrentFootballScore = result;

    const matrixWithScores = {
      sport: result.sport,
      position: result.position,
      archetype: result.archetype,
      matrix_code: result.matrix_code,
      traits: result.traits
    };

    if (window.STATScoreTraitRenderEngine?.renderTraits) {
      const container =
        document.querySelector("[data-statscore-performance-traits]") ||
        document.querySelector("#statscore-performance-traits") ||
        document.querySelector("#scPerformanceTraits") ||
        document.querySelector(".sc-performance-traits");

      if (container) {
        window.STATScoreTraitRenderEngine.renderTraits(container, matrixWithScores);
      }
    }

    return result;
  }

  function init() {
    if (window.__STATSCORE_FOOTBALL_SCORING_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_FOOTBALL_SCORING_ENGINE__ = true;

    window.STATScoreFootballScoringEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      scoreAthlete,
      renderScoreToWindowAthlete,
      calculateBand,
      calculateStarProjection
    };

    window.STATScore = window.STATScore || {};
    window.STATScore.FootballScoringEngine = window.STATScoreFootballScoringEngine;

    const result = renderScoreToWindowAthlete();

    if (window.STATScoreEngineBus?.emit) {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
