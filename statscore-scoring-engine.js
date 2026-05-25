/* ============================================================
   STATScore™ Scoring Engine Spine
   File: statscore-scoring-engine.js
   Version: STATSCORE-SCORING-ENGINE-V1
   Purpose:
   Protected sport/position scoring foundation for Football,
   Basketball, Baseball, and Track using completion,
   competition level, verification, readiness, evidence,
   and explainable athlete intelligence.
============================================================ */

window.STATScoreScoringEngine = (() => {

  const SCORE_VERSION = "STATSCORE-SCORING-V1";
  const MIN_SCORE = 0;
  const MAX_SCORE = 100;

  const STAR_THRESHOLDS = [
    { stars: 5, min: 92, label: "Elite National Signal" },
    { stars: 4, min: 84, label: "High-Level Regional Signal" },
    { stars: 3, min: 74, label: "Verified Development Signal" },
    { stars: 2, min: 62, label: "Emerging Athlete Signal" },
    { stars: 1, min: 1,  label: "Profile Building Signal" },
    { stars: 0, min: 0,  label: "Insufficient Verified Signal" }
  ];

  const SPORT_BASELINES = {
    football: {
      default_matrix: "FOOTBALL_MATRIX_V1",
      traits: ["athleticism", "position_skill", "film", "competition", "readiness", "verification"],
      positions: {
        QB: ["arm", "accuracy", "decision_making", "mobility", "film", "competition"],
        RB: ["burst", "vision", "contact_balance", "ball_security", "film", "competition"],
        WR: ["speed", "hands", "route_running", "separation", "film", "competition"],
        DB: ["speed", "hips", "coverage", "ball_skills", "film", "competition"],
        LB: ["pursuit", "physicality", "instincts", "coverage", "film", "competition"],
        DL: ["explosion", "hands", "leverage", "motor", "film", "competition"],
        OL: ["feet", "strength", "leverage", "pass_protection", "film", "competition"],
        ATH: ["speed", "versatility", "film", "competition", "readiness", "verification"]
      }
    },

    basketball: {
      default_matrix: "BASKETBALL_MATRIX_V1",
      traits: ["athleticism", "skill", "iq", "competition", "readiness", "verification"],
      positions: {
        PG: ["handle", "decision_making", "pace", "shooting", "defense", "competition"],
        SG: ["shooting", "scoring", "movement", "defense", "athleticism", "competition"],
        SF: ["versatility", "finishing", "defense", "transition", "shooting", "competition"],
        PF: ["rebounding", "finishing", "strength", "mobility", "defense", "competition"],
        C: ["rim_protection", "rebounding", "post_play", "mobility", "finishing", "competition"],
        G: ["handle", "shooting", "decision_making", "defense", "athleticism", "competition"],
        F: ["versatility", "rebounding", "finishing", "defense", "mobility", "competition"]
      }
    },

    baseball: {
      default_matrix: "BASEBALL_MATRIX_V1",
      traits: ["tools", "skill", "production", "competition", "readiness", "verification"],
      positions: {
        P: ["velocity", "command", "movement", "mechanics", "durability", "competition"],
        C: ["arm_strength", "receiving", "blocking", "pop_time", "game_management", "competition"],
        "1B": ["bat", "power", "fielding", "footwork", "production", "competition"],
        "2B": ["range", "hands", "transfer", "bat", "iq", "competition"],
        "3B": ["arm_strength", "reaction", "bat", "power", "fielding", "competition"],
        SS: ["range", "arm_strength", "hands", "actions", "bat", "competition"],
        OF: ["speed", "routes", "arm_strength", "bat", "range", "competition"],
        UTIL: ["versatility", "bat", "fielding", "athleticism", "production", "competition"]
      }
    },

    track: {
      default_matrix: "TRACK_MATRIX_V1",
      traits: ["verified_time_mark", "event_quality", "competition", "progression", "readiness", "verification"],
      positions: {
        SPRINTS: ["verified_time", "start", "acceleration", "top_speed", "competition", "progression"],
        DISTANCE: ["verified_time", "pace", "endurance", "race_strategy", "competition", "progression"],
        HURDLES: ["verified_time", "rhythm", "technique", "speed", "competition", "progression"],
        JUMPS: ["verified_mark", "approach", "explosion", "technique", "competition", "progression"],
        THROWS: ["verified_mark", "power", "technique", "consistency", "competition", "progression"],
        RELAYS: ["split", "exchange", "speed", "team_context", "competition", "progression"],
        MULTI: ["event_spread", "verified_marks", "technical_balance", "competition", "progression", "readiness"]
      }
    }
  };

  function core(){ return window.STATScoreCore || null; }
  function intel(){ return window.STATScoreIntelligence || null; }

  function clamp(value, min = MIN_SCORE, max = MAX_SCORE){
    const n = Number(value || 0);
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function lower(value){
    return String(value || "").trim().toLowerCase();
  }

  function upper(value){
    return String(value || "").trim().toUpperCase();
  }

  function normalizeSport(sport){
    return core()?.normalizeSport?.(sport) || lower(sport);
  }

  function normalizePosition(position){
    return upper(position);
  }

  function getMatrix(snapshot){
    const sport = normalizeSport(snapshot?.sport);
    const position = normalizePosition(snapshot?.position);
    const sportMatrix = SPORT_BASELINES[sport];

    if (!sportMatrix) {
      return {
        sport,
        position,
        matrix_id: "UNSUPPORTED_SPORT_MATRIX",
        traits: [],
        supported: false
      };
    }

    const traits =
      sportMatrix.positions[position] ||
      sportMatrix.traits ||
      [];

    return {
      sport,
      position,
      matrix_id: sportMatrix.default_matrix,
      traits,
      supported: true
    };
  }

  function evidenceScore(snapshot){
    let score = 0;
    const reasons = [];

    if (snapshot?.headshot_public_url) {
      score += 10;
      reasons.push("official athlete image present");
    }

    if (snapshot?.highlight_url) {
      score += 18;
      reasons.push("highlight reel submitted");
    }

    if (snapshot?.game_film_url) {
      score += 22;
      reasons.push("game film submitted");
    }

    if (snapshot?.dash40 || snapshot?.vertical_jump || snapshot?.shuttle || snapshot?.broad_jump) {
      score += 18;
      reasons.push("performance metrics present");
    }

    if (snapshot?.coach_name || snapshot?.coach_email) {
      score += 14;
      reasons.push("coach contact available");
    }

    if (snapshot?.guardian_name || snapshot?.guardian_email) {
      score += 10;
      reasons.push("guardian lane present");
    }

    if (snapshot?.current_gpa || snapshot?.ncaa_status) {
      score += 8;
      reasons.push("academic readiness data present");
    }

    return {
      score: clamp(score),
      reasons
    };
  }

  function verificationScore(snapshot){
    const status = lower(snapshot?.verification_status);

    if (status === "verified") {
      return {
        score: 100,
        label: "Verified",
        reasons: ["athlete record is verified"]
      };
    }

    if (status === "pending" || status === "in review") {
      return {
        score: 65,
        label: "In Review",
        reasons: ["verification is in progress"]
      };
    }

    return {
      score: 35,
      label: "Unverified",
      reasons: ["verification is incomplete"]
    };
  }

  function readinessScore(snapshot){
    const state = intel()?.readinessState?.(snapshot);

    if (!state) {
      return {
        score: 0,
        label: "No Readiness State",
        reasons: ["readiness engine unavailable"]
      };
    }

    const map = {
      OPERATIONAL_READY: 95,
      REVIEW_READY: 78,
      ACADEMIC_REVIEW_REQUIRED: 62,
      PREPARATION_REQUIRED: 45
    };

    return {
      score: map[state.status] || 50,
      label: state.label,
      reasons: [state.explanation]
    };
  }

  function competitionScore(snapshot){
    const comp =
      intel()?.competitionLevel?.(snapshot) ||
      core()?.resolveCompetitionLevel?.(snapshot?.competition_level);

    const base = 70;
    const weighted = core()?.weightedScore?.(base, snapshot?.competition_level) || Math.round(base * (comp?.weight || 1));

    return {
      score: clamp(weighted),
      label: comp?.label || "Standard Varsity",
      weight: comp?.weight || 1,
      reasons: [
        `competition level weighted as ${comp?.label || "Standard Varsity"}`,
        "stats are evidence, competition level determines weight"
      ]
    };
  }

  function completionScore(snapshot){
    const c = core()?.profileCompletion?.(snapshot) || { percent: 0, missing: [] };

    return {
      score: clamp(c.percent),
      label: `${c.percent}% Complete`,
      missing: c.missing || [],
      reasons: c.missing?.length
        ? [`missing lanes: ${c.missing.join(", ")}`]
        : ["profile lanes are complete"]
    };
  }

  function sportContextScore(snapshot){
    const matrix = getMatrix(snapshot);

    if (!matrix.supported) {
      return {
        score: 0,
        label: "Unsupported Sport",
        reasons: ["sport is not currently active in STATScore V1"]
      };
    }

    const knownPosition =
      intel()?.isKnownPosition?.(snapshot?.sport, snapshot?.position);

    return {
      score: knownPosition ? 90 : 70,
      label: knownPosition ? "Position Matrix Active" : "General Matrix Active",
      reasons: [
        knownPosition
          ? `${matrix.position} position matrix active`
          : "general sport matrix used because position is not fully mapped"
      ]
    };
  }

  function calculateRawScore(snapshot){
    const evidence = evidenceScore(snapshot);
    const verification = verificationScore(snapshot);
    const readiness = readinessScore(snapshot);
    const competition = competitionScore(snapshot);
    const completion = completionScore(snapshot);
    const sportContext = sportContextScore(snapshot);

    const weighted =
      evidence.score * 0.24 +
      verification.score * 0.18 +
      readiness.score * 0.18 +
      competition.score * 0.18 +
      completion.score * 0.12 +
      sportContext.score * 0.10;

    return {
      score: clamp(weighted),
      components: {
        evidence,
        verification,
        readiness,
        competition,
        completion,
        sport_context: sportContext
      }
    };
  }

  function starSignal(score){
    const value = clamp(score);

    const threshold =
      STAR_THRESHOLDS.find(t => value >= t.min) ||
      STAR_THRESHOLDS[STAR_THRESHOLDS.length - 1];

    return {
      stars: threshold.stars,
      label: threshold.label,
      display: "★".repeat(threshold.stars) + "☆".repeat(5 - threshold.stars)
    };
  }

  function projectionLane(snapshot, score){
    const ready = readinessScore(snapshot);
    const comp = competitionScore(snapshot);
    const verified = lower(snapshot?.verification_status) === "verified";

    if (!verified) {
      return {
        lane: "VERIFY_FIRST",
        label: "Verification First",
        explanation: "Projection is restricted until athlete evidence is verified."
      };
    }

    if (score >= 90 && comp.weight >= 1.16) {
      return {
        lane: "NATIONAL_VISIBILITY",
        label: "National Visibility Lane",
        explanation: "High score with strong competition context supports broader visibility."
      };
    }

    if (score >= 82) {
      return {
        lane: "REGIONAL_RECRUITING",
        label: "Regional Recruiting Lane",
        explanation: "Athlete shows meaningful signal and should be evaluated for regional exposure."
      };
    }

    if (ready.score >= 70) {
      return {
        lane: "DEVELOPMENT_PLUS_EXPOSURE",
        label: "Development + Controlled Exposure",
        explanation: "Athlete may receive controlled exposure while development gaps are addressed."
      };
    }

    return {
      lane: "DEVELOPMENT_TRACK",
      label: "Development Track",
      explanation: "Athlete should remain in development before major exposure escalation."
    };
  }

  function riskFlags(snapshot, finalScore){
    const flags = [];
    const completion = completionScore(snapshot);

    if (lower(snapshot?.verification_status) !== "verified") {
      flags.push("Verification incomplete.");
    }

    if (!snapshot?.highlight_url && !snapshot?.game_film_url) {
      flags.push("Film evidence missing.");
    }

    if (completion.score < 70) {
      flags.push("Profile completion below recruiting readiness threshold.");
    }

    if (!snapshot?.guardian_name && !snapshot?.guardian_email) {
      flags.push("Guardian permission lane incomplete.");
    }

    if (finalScore >= 85 && lower(snapshot?.verification_status) !== "verified") {
      flags.push("High signal cannot be fully released until verification is complete.");
    }

    return flags;
  }

  function explainScore(snapshot){
    if (!snapshot) {
      return {
        ok: false,
        status: "NO_SNAPSHOT",
        message: "No athlete snapshot loaded."
      };
    }

    const raw = calculateRawScore(snapshot);
    const score = raw.score;
    const stars = starSignal(score);
    const projection = projectionLane(snapshot, score);
    const flags = riskFlags(snapshot, score);
    const matrix = getMatrix(snapshot);

    const why = [
      ...raw.components.evidence.reasons,
      ...raw.components.verification.reasons,
      ...raw.components.readiness.reasons,
      ...raw.components.competition.reasons,
      ...raw.components.completion.reasons,
      ...raw.components.sport_context.reasons
    ];

    return {
      ok: true,
      status: "SCORED",
      version: SCORE_VERSION,
      matrix_id: matrix.matrix_id,
      sport: matrix.sport,
      position: matrix.position,

      final_score: score,
      star_signal: stars,
      projection_lane: projection,
      risk_flags: flags,

      components: raw.components,
      why_this_signal: why,

      summary:
        `${snapshot.athlete_display_name || "Athlete"} currently carries a ${stars.label} with a ${score} STATScore signal. ${projection.explanation}`
    };
  }

  function renderScoreToProfile(scoreOutput){
    if (!scoreOutput?.ok) return;

    const c = core();

    c?.text?.("scoreValue", scoreOutput.final_score);
    c?.text?.("scoreStatus", scoreOutput.star_signal.label);
    c?.text?.("starDisplay", scoreOutput.star_signal.display);
    c?.text?.("signalText", scoreOutput.star_signal.label);
    c?.text?.("evaluationStatus", scoreOutput.projection_lane.label);

    c?.text?.("scMatrixVersion", scoreOutput.matrix_id);
    c?.text?.("scStarSignal", scoreOutput.star_signal.label);
    c?.text?.("scFinalScore", String(scoreOutput.final_score));
    c?.text?.("scProjectionLane", scoreOutput.projection_lane.label);
    c?.text?.("scConfidence", scoreOutput.components.verification.label);

    const whyList = document.getElementById("scWhyList");

    if (whyList) {
      whyList.innerHTML = scoreOutput.why_this_signal
        .map(reason => `<li>${c?.escapeHTML?.(reason) || reason}</li>`)
        .join("");
    }
  }

  return {
    SCORE_VERSION,
    STAR_THRESHOLDS,
    SPORT_BASELINES,

    clamp,
    getMatrix,

    evidenceScore,
    verificationScore,
    readinessScore,
    competitionScore,
    completionScore,
    sportContextScore,

    calculateRawScore,
    starSignal,
    projectionLane,
    riskFlags,
    explainScore,
    renderScoreToProfile
  };

})(); 
