/* ============================================================
   STATScore™ Intelligence Spine
   File: statscore-intelligence.js
   Version: STATSCORE-INTELLIGENCE-V1
   Purpose:
   Shared athlete intelligence engine for completion, readiness,
   competition weighting, exposure gaps, pathway logic,
   sport/position intelligence, and recommendations.
============================================================ */

window.STATScoreIntelligence = (() => {

  const SPORTS = ["football", "basketball", "baseball", "track"];

  const SPORT_POSITION_MAP = {
    football: ["QB","RB","WR","TE","OL","DL","LB","DB","ATH","K","P"],
    basketball: ["PG","SG","SF","PF","C","G","F","Wing"],
    baseball: ["P","C","1B","2B","3B","SS","OF","UTIL"],
    track: ["Sprints","Distance","Hurdles","Jumps","Throws","Relays","Multi"]
  };

  const POSITION_RECOMMENDATIONS = {
    football: {
      QB: ["QB-specific camp", "7v7 verified reps", "full-game film review", "throwing mechanics evaluation"],
      WR: ["route-running camp", "verified 40-yard dash", "1-on-1 showcase", "full-game target film"],
      RB: ["combine testing", "contact-balance review", "short-area burst testing", "full-game carry film"],
      DB: ["coverage showcase", "verified shuttle", "1-on-1 defensive reps", "ball-skills review"],
      LB: ["combine testing", "pursuit-angle film", "tackling form review", "verified strength marker"],
      DL: ["line camp", "explosion testing", "hand-placement evaluation", "game-film trench review"],
      OL: ["line camp", "footwork evaluation", "strength marker", "pass-protection film review"],
      ATH: ["multi-position evaluation", "verified speed testing", "position-fit review", "full-game film"]
    },
    basketball: {
      PG: ["guard skills camp", "decision-making film", "assist/turnover review", "pace-control evaluation"],
      SG: ["shooting showcase", "shot-profile review", "defensive lateral testing", "off-ball movement film"],
      SF: ["wing skills camp", "defensive versatility review", "transition film", "finishing evaluation"],
      PF: ["frontcourt skills camp", "rebounding review", "rim finishing film", "strength/mobility check"],
      C: ["post/paint evaluation", "rim protection film", "rebounding metrics", "mobility assessment"],
      G: ["guard skills camp", "ball-handling film", "shooting review", "defensive movement test"],
      F: ["versatility camp", "rebounding/finishing review", "switchability film", "athletic testing"]
    },
    baseball: {
      P: ["pitching showcase", "velocity verification", "command charting", "mechanics review"],
      C: ["catcher pop-time verification", "receiving/blocking review", "arm-strength testing", "game-management film"],
      "1B": ["bat-speed review", "fielding footwork", "power metrics", "game at-bat film"],
      "2B": ["middle-infield showcase", "range review", "transfer speed", "game defensive film"],
      "3B": ["corner infield showcase", "arm-strength testing", "reaction film", "bat profile review"],
      SS: ["middle-infield showcase", "range/arm review", "defensive actions film", "bat profile review"],
      OF: ["outfield showcase", "60-yard dash", "throwing velocity", "route-efficiency film"],
      UTIL: ["multi-position showcase", "bat profile review", "defensive flexibility film", "athletic testing"]
    },
    track: {
      Sprints: ["FAT-timed meet", "block start review", "acceleration mechanics", "regional invitational"],
      Distance: ["verified meet results", "training load review", "race strategy film", "regional competition"],
      Hurdles: ["hurdle mechanics review", "FAT-timed meet", "rhythm analysis", "technical camp"],
      Jumps: ["verified meet marks", "approach mechanics review", "power testing", "regional invitational"],
      Throws: ["verified meet marks", "technique review", "strength marker", "throws clinic"],
      Relays: ["split verification", "exchange review", "team meet performance", "regional invitational"],
      Multi: ["event spread review", "verified meet marks", "technical event camp", "regional competition"]
    }
  };

  function core(){ return window.STATScoreCore || null; }

  function normalize(value){
    return String(value || "").trim();
  }

  function lower(value){
    return normalize(value).toLowerCase();
  }

  function normalizeSport(value){
    return lower(value);
  }

  function normalizePosition(value){
    return normalize(value).toUpperCase();
  }

  function getSupportedPositions(sport){
    return SPORT_POSITION_MAP[normalizeSport(sport)] || [];
  }

  function isKnownSport(sport){
    return SPORTS.includes(normalizeSport(sport));
  }

  function isKnownPosition(sport, position){
    const positions = getSupportedPositions(sport).map(p => p.toUpperCase());
    return positions.includes(normalizePosition(position));
  }

  function completion(snapshot){
    return core()?.profileCompletion?.(snapshot) || {
      percent: 0,
      missing: ["core unavailable"]
    };
  }

  function completionNarrative(snapshot){
    const c = completion(snapshot);

    if (!snapshot) return "No athlete record is loaded.";

    if (c.percent >= 90) {
      return `Athlete record is ${c.percent}% complete. Profile is near operational readiness.`;
    }

    if (c.percent >= 70) {
      return `Athlete record is ${c.percent}% complete. Profile is usable but still has important missing lanes: ${c.missing.join(", ")}.`;
    }

    return `Athlete record is ${c.percent}% complete. Recruiting visibility should remain controlled until these lanes improve: ${c.missing.join(", ")}.`;
  }

  function competitionLevel(snapshot){
    const raw =
      snapshot?.raw?.competitionLevel ||
      snapshot?.raw?.competition_level ||
      snapshot?.competition_level ||
      "STANDARD_VARSITY";

    return core()?.resolveCompetitionLevel?.(raw) || {
      label: "Standard Varsity",
      weight: 1,
      exposure: "NORMAL"
    };
  }

  function competitionNarrative(snapshot){
    const comp = competitionLevel(snapshot);

    return `Competition level is weighted as ${comp.label}. Stats are evidence, but competition context controls how much weight those stats carry.`;
  }

  function readinessState(snapshot){
    const c = completion(snapshot);
    const hasFilm = !!(snapshot?.highlight_url || snapshot?.game_film_url);
    const hasGuardian = !!(snapshot?.guardian_name || snapshot?.guardian_email);
    const hasCoach = !!(snapshot?.coach_name || snapshot?.coach_email);
    const hasMetrics = !!(snapshot?.dash40 || snapshot?.vertical_jump || snapshot?.shuttle || snapshot?.broad_jump);
    const hasAcademics = !!(snapshot?.current_gpa || snapshot?.ncaa_status);

    if (c.percent >= 90 && hasFilm && hasGuardian && hasCoach && hasMetrics) {
      return {
        status: "OPERATIONAL_READY",
        label: "Operational Ready",
        color: "green",
        explanation: "Athlete record is near complete and ready for higher-level verification, scoring, and visibility routing."
      };
    }

    if (hasFilm && hasMetrics && (hasGuardian || hasCoach)) {
      return {
        status: "REVIEW_READY",
        label: "Review Ready",
        color: "yellow",
        explanation: "Athlete has enough evidence for review, but verification and completion gaps still remain."
      };
    }

    if (!hasAcademics) {
      return {
        status: "ACADEMIC_REVIEW_REQUIRED",
        label: "Academic Review Required",
        color: "yellow",
        explanation: "Athletic information exists, but academic readiness and eligibility context are incomplete."
      };
    }

    return {
      status: "PREPARATION_REQUIRED",
      label: "Preparation Plan Required",
      color: "red",
      explanation: "Athlete should remain in controlled development until evidence, permissions, and verification improve."
    };
  }

  function exposureGap(snapshot){
    const c = completion(snapshot);
    const hasFilm = !!(snapshot?.highlight_url || snapshot?.game_film_url);
    const verified = lower(snapshot?.verification_status) === "verified";
    const comp = competitionLevel(snapshot);

    if (!hasFilm) {
      return {
        status: "FILM_GAP",
        label: "Film Gap",
        explanation: "Exposure is limited because verified highlight or game film is missing."
      };
    }

    if (!verified) {
      return {
        status: "TRUST_GAP",
        label: "Trust Gap",
        explanation: "Exposure should remain controlled until verification is complete."
      };
    }

    if (c.percent < 80) {
      return {
        status: "COMPLETION_GAP",
        label: "Completion Gap",
        explanation: "Athlete has media evidence, but profile completion is not yet strong enough for full visibility."
      };
    }

    if (comp.exposure === "HIGH") {
      return {
        status: "HIGH_VALUE_EXPOSURE",
        label: "High-Value Exposure",
        explanation: "Athlete evidence is supported by strong competition context."
      };
    }

    return {
      status: "STANDARD_EXPOSURE",
      label: "Standard Exposure",
      explanation: "Athlete is eligible for controlled exposure with current evidence and competition context."
    };
  }

  function pathwayRecommendation(snapshot){
    const ready = readinessState(snapshot);
    const sport = normalizeSport(snapshot?.sport);
    const verified = lower(snapshot?.verification_status) === "verified";

    if (!isKnownSport(sport)) {
      return {
        lane: "SPORT_REVIEW",
        label: "Sport Review Required",
        explanation: "Sport is not currently mapped to the active STATScore four-sport intelligence layer."
      };
    }

    if (!verified) {
      return {
        lane: "VERIFY_FIRST",
        label: "Verification First",
        explanation: "Best route is to complete verification before expanding recruiting visibility."
      };
    }

    if (ready.status === "OPERATIONAL_READY") {
      return {
        lane: "VISIBILITY_EXPANSION",
        label: "Visibility Expansion",
        explanation: "Athlete may be ready for expanded exposure, recruiter visibility, and PHNX Sports media packaging."
      };
    }

    if (ready.status === "ACADEMIC_REVIEW_REQUIRED") {
      return {
        lane: "ACADEMIC_PATHWAY",
        label: "Academic Pathway Review",
        explanation: "Counselor review should occur before recruiting expansion."
      };
    }

    return {
      lane: "DEVELOPMENT_TRACK",
      label: "Development Track",
      explanation: "Athlete should improve evidence, metrics, film, and readiness before major exposure."
    };
  }

  function campCombineRecommendations(snapshot){
    const sport = normalizeSport(snapshot?.sport);
    const pos = normalizePosition(snapshot?.position);

    const sportMap = POSITION_RECOMMENDATIONS[sport] || {};
    const direct = sportMap[pos];

    if (direct) return direct;

    if (sport === "football") return POSITION_RECOMMENDATIONS.football.ATH;
    if (sport === "basketball") return POSITION_RECOMMENDATIONS.basketball.G;
    if (sport === "baseball") return POSITION_RECOMMENDATIONS.baseball.UTIL;
    if (sport === "track") return ["verified meet results", "regional invitational", "technical event review", "performance progression tracking"];

    return ["verified evaluation event", "film review", "position-specific assessment", "development planning session"];
  }

  function nextActions(snapshot){
    const actions = [];
    const c = completion(snapshot);
    const exposure = exposureGap(snapshot);
    const pathway = pathwayRecommendation(snapshot);

    if (!snapshot?.headshot_public_url) actions.push("Upload official athlete image/headshot.");
    if (!(snapshot?.highlight_url || snapshot?.game_film_url)) actions.push("Attach highlight or full-game film.");
    if (!(snapshot?.guardian_name || snapshot?.guardian_email)) actions.push("Complete parent/guardian permission lane.");
    if (!(snapshot?.coach_name || snapshot?.coach_email)) actions.push("Add coach confirmation contact.");
    if (!(snapshot?.current_gpa || snapshot?.ncaa_status)) actions.push("Complete academic readiness lane.");
    if (lower(snapshot?.verification_status) !== "verified") actions.push("Submit verification request.");
    if (c.percent >= 70 && exposure.status !== "FILM_GAP") actions.push("Prepare PHNX Sports media package.");
    actions.push(`Recommended pathway: ${pathway.label}.`);

    return actions;
  }

  function explainAthlete(snapshot){
    if (!snapshot) {
      return {
        status: "NO_SNAPSHOT",
        summary: "No athlete record is loaded.",
        completion: "No completion intelligence available.",
        readiness: null,
        exposure: null,
        pathway: null,
        recommendations: []
      };
    }

    const ready = readinessState(snapshot);
    const exposure = exposureGap(snapshot);
    const pathway = pathwayRecommendation(snapshot);

    return {
      status: "READY",
      summary: `${snapshot.athlete_display_name || "Athlete"} is a ${snapshot.graduation_class || ""} ${snapshot.sport || "sport"} athlete listed at ${snapshot.position || "position pending"}.`,
      completion: completionNarrative(snapshot),
      competition: competitionNarrative(snapshot),
      readiness: ready,
      exposure,
      pathway,
      camp_combine_recommendations: campCombineRecommendations(snapshot),
      next_actions: nextActions(snapshot)
    };
  }

  function buildRoomIntelligence(role, snapshot){
    const athlete = explainAthlete(snapshot);
    const r = lower(role);

    const roomFocus = {
      athlete: "Complete your record, understand your readiness, and prepare for verified exposure.",
      parent: "Control permissions, media approval, communication access, and youth protection.",
      coach: "Contribute development context, film evidence, and performance confirmation.",
      counselor: "Review academic readiness, NCAA pathway, transcript status, and eligibility risk.",
      recruiter: "Review approved athlete visibility, fit, readiness, competition level, and program match.",
      evaluator: "Verify traits, metrics, film evidence, confidence level, and performance legitimacy.",
      program: "Review roster fit, athlete grouping, event participation, and organizational readiness.",
      admin: "Govern full system access, verification, intelligence, routing, and receipts."
    };

    return {
      role: r,
      room_focus: roomFocus[r] || "Role context unavailable.",
      athlete_intelligence: athlete,
      can_proceed: !!snapshot,
      warning: !snapshot ? "No athlete snapshot loaded." : ""
    };
  }

  function renderIntelligencePanel(targetId, role, snapshot){
    const el = document.getElementById(targetId);
    if (!el) return;

    const intel = buildRoomIntelligence(role, snapshot);
    const a = intel.athlete_intelligence;

    el.innerHTML = `
      <div class="intel-kicker">STATScore Intelligence</div>
      <h2>${core()?.escapeHTML?.(intel.room_focus) || intel.room_focus}</h2>
      <p>${core()?.escapeHTML?.(a.completion || "") || a.completion || ""}</p>
      <p>${core()?.escapeHTML?.(a.competition || "") || a.competition || ""}</p>
      <p><strong>Readiness:</strong> ${core()?.escapeHTML?.(a.readiness?.label || "--") || a.readiness?.label || "--"}</p>
      <p><strong>Exposure:</strong> ${core()?.escapeHTML?.(a.exposure?.label || "--") || a.exposure?.label || "--"}</p>
      <p><strong>Pathway:</strong> ${core()?.escapeHTML?.(a.pathway?.label || "--") || a.pathway?.label || "--"}</p>
      <ul>
        ${(a.next_actions || []).map(action => `<li>${core()?.escapeHTML?.(action) || action}</li>`).join("")}
      </ul>
    `;
  }

  return {
    SPORTS,
    SPORT_POSITION_MAP,
    POSITION_RECOMMENDATIONS,

    normalizeSport,
    normalizePosition,
    getSupportedPositions,
    isKnownSport,
    isKnownPosition,

    completion,
    completionNarrative,

    competitionLevel,
    competitionNarrative,

    readinessState,
    exposureGap,
    pathwayRecommendation,
    campCombineRecommendations,
    nextActions,

    explainAthlete,
    buildRoomIntelligence,
    renderIntelligencePanel
  };

})(); 
