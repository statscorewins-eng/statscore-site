/* ============================================================
   STATScore™ Football Scoring Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Football Athlete Snapshot → Trait Scores → Explainable Football Signal
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-football-scoring-engine";
  const VERSION = "v1.0-football-foundation";

  const TRAIT_DEFAULT_STATUS = "PROJECTED";
  const VERIFIED_STATUS = "VERIFIED";
  const PENDING_STATUS = "PENDING_VERIFICATION";

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
    return normalize(value).toUpperCase().replace(/\s+/g, "_");
  }

  function clamp(value, min = 0, max = 100) {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, n));
  }

  function numberOrNull(value) {
    const n = Number(String(value || "").replace(/[^\d.]/g, ""));
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

    const numeric = numberOrNull(raw);
    return numeric || null;
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
      DL: [5.45, 4.70]
    };

    const [slow, elite] = ranges[pos] || [5.2, 4.45];

    const score = ((slow - dash) / (slow - elite)) * 100;
    return clamp(Math.round(score));
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
      DL: { h: [72, 79], w: [225, 315] }
    };

    const target = targets[pos] || { h: [68, 78], w: [160, 260] };

    let hScore = null;
    let wScore = null;

    if (heightInches) {
      const [minH, maxH] = target.h;
      if (heightInches >= minH && heightInches <= maxH) hScore = 88;
      else hScore = clamp(88 - Math.abs(heightInches - ((minH + maxH) / 2)) * 7);
    }

    if (weight) {
      const [minW, maxW] = target.w;
      if (weight >= minW && weight <= maxW) wScore = 88;
      else wScore = clamp(88 - Math.abs(weight - ((minW + maxW) / 2)) * 0.9);
    }

    const scores = [hScore, wScore].filter((v) => v !== null);
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
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (!text) return null;

    let hits = 0;

    keywords.forEach((word) => {
      if (text.includes(String(word).toLowerCase())) hits += 1;
    });

    if (!hits) return null;

    return clamp(62 + hits * 8);
  }

  function evidenceStatus(athlete) {
    const hasFilm = !!(athlete?.highlight_url || athlete?.game_film_url || athlete?.recruiting_profile_url);
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

  function baseTraitValue(traitName, athlete, matrix) {
    const position = matrix?.position || athlete?.primary_position || athlete?.position;
    const dash = parseDash40(athlete?.dash40);
    const height = parseHeightToInches(athlete?.height);
    const weight = parseWeight(athlete?.weight);

    const speedScore = scoreDash40(position, dash);
    const frameScore = scoreFrame(position, height, weight);

    const trait = normalizeUpper(traitName);

    const keywordScores = {
      PROCESSING: ["processing", "reads", "progression", "decision", "iq"],
      DECISION_SPEED: ["quick decision", "fast read", "decisive", "anticipation"],
      ARM_TALENT: ["arm strength", "velocity", "deep ball", "drive throws"],
      BALL_PLACEMENT: ["accuracy", "placement", "touch", "catchable"],
      FIELD_VISION: ["vision", "reads field", "sees field", "anticipation"],
      POCKET_PRESENCE: ["pocket", "climb", "pressure", "composure"],
      PRESSURE_RESPONSE: ["pressure", "escape", "composure", "blitz"],
      LEADERSHIP: ["leader", "captain", "command", "communication"],
      ESCAPE_ABILITY: ["escape", "mobile", "scramble", "extend"],
      DESIGNED_RUN_VALUE: ["designed run", "read option", "rpo", "run threat"],
      OPEN_FIELD_THREAT: ["open field", "explosive", "breakaway", "elusive"],
      SCRAMBLE_TO_THROW_ABILITY: ["scramble to throw", "off platform", "extend play"],
      BALL_SECURITY: ["ball security", "protects ball", "low turnover"],
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
      trait.includes("RECOVERY")
    ) {
      return speedScore ?? keywordScore ?? null;
    }

    if (
      trait.includes("FRAME") ||
      trait.includes("POWER") ||
      trait.includes("ANCHOR") ||
      trait.includes("PHYSICAL") ||
      trait.includes("CONTACT")
    ) {
      return frameScore ?? keywordScore ?? null;
    }

    return keywordScore ?? null;
  }

  function applyProjectionFallback(traitName, athlete, matrix) {
    const pos = normalizeUpper(matrix?.position || athlete?.primary_position);
    const archetype = normalizeUpper(matrix?.archetype_code || matrix?.archetype);

    const baseline = {
      QB: 64,
      WR: 66,
      RB: 66,
      DB: 65,
      LB: 64,
      OL: 62,
      DL: 63
    };

    let value = baseline[pos] || 60;

    if (archetype.includes("DUAL_THREAT")) {
      const mobileTraits = [
        "ESCAPE",
        "RUN",
        "OPEN_FIELD",
        "SCRAMBLE",
        "BURST",
        "IMPROVISATION"
      ];

      if (mobileTraits.some((key) => normalizeUpper(traitName).includes(key))) {
        value += 8;
      }
    }

    if (athlete?.verification_status && normalizeUpper(athlete.verification_status).includes("VERIFIED")) {
      value += 3;
    }

    return clamp(value);
  }

  function scoreTrait(trait, athlete, matrix) {
    const direct =
      trait.value ??
      trait.score ??
      trait.rating ??
      athlete?.trait_scores?.[trait.name] ??
      athlete?.raw_payload?.trait_scores?.[trait.name] ??
      null;

    let value = clamp(direct);

    let source = "DIRECT";

    if (value === null) {
      value = baseTraitValue(trait.name, athlete, matrix);
      source = value === null ? "PROJECTED_BASELINE" : "EVIDENCE_INFERRED";
    }

    if (value === null) {
      value = applyProjectionFallback(trait.name, athlete, matrix);
      source = "ARCHETYPE_PROJECTION";
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
    const valid = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
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
      summary: `${name} is evaluated under ${matrix.matrix_code} as ${matrix.archetype}. Current football signal is ${band} based on available profile, metric, film, and verification data.`,
      factors: [
        "Sport-specific football matrix applied",
        "Position and archetype context applied",
        "Trait stack scored through available verified or projected evidence",
        "Official score remains subject to verification, evaluator review, and film validation"
      ],
      limitations: [
        "Trait values are provisional until verified evidence is attached",
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

    const scoredTraits = matrix.traits.map((trait) => scoreTrait(trait, athlete, matrix));

    const scoreFinal = average(scoredTraits.map((trait) => trait.value));
    const band = calculateBand(scoreFinal);
    const stars = calculateStarProjection(scoreFinal);

    const result = {
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
      matrix_code: matrix.matrix_code,
      score_final: scoreFinal,
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

    return result;
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

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.FootballScoringEngine = window.STATScoreFootballScoringEngine;

    const result = renderScoreToWindowAthlete();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        scored: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      scored: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
