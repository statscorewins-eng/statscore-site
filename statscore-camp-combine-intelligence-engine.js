/* ============================================================
   STATScore™ Camp / Combine Intelligence Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Athlete Readiness + Pathway + Recruiter Fit → Event Routing
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-camp-combine-intelligence-engine";
  const VERSION = "v1.0-exposure-routing";

  const EVENT_TYPES = {
    DEVELOPMENTAL: {
      label: "Developmental",
      color: "#9fe7ff",
      description: "Best for skill growth, readiness improvement, and foundational development."
    },
    EXPOSURE: {
      label: "Exposure",
      color: "#37d67a",
      description: "Best for verified visibility, recruiter interaction, and pathway movement."
    },
    HYBRID: {
      label: "Hybrid",
      color: "#ffb100",
      description: "Combines development, evaluation, and verified exposure opportunity."
    }
  };

  const MATCH_LEVELS = {
    STRONG_MATCH: {
      label: "Strong Match",
      color: "#37d67a",
      min: 84
    },
    GOOD_MATCH: {
      label: "Good Match",
      color: "#9fe7ff",
      min: 70
    },
    DEVELOPMENT_MATCH: {
      label: "Development Match",
      color: "#ffb100",
      min: 54
    },
    LOW_MATCH: {
      label: "Low Match",
      color: "#ff3434",
      min: 0
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Camp/Combine Intelligence] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Camp/Combine Intelligence] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function resolveEventType(event) {
    const explicit = upper(event?.event_type || event?.type || event?.classification);

    if (EVENT_TYPES[explicit]) return explicit;

    const hasRecruiters =
      Array.isArray(event?.attending_recruiters) &&
      event.attending_recruiters.length > 0;

    const hasDevelopment =
      !!event?.development_focus ||
      !!event?.skill_training ||
      !!event?.position_training;

    if (hasRecruiters && hasDevelopment) return "HYBRID";
    if (hasRecruiters) return "EXPOSURE";

    return "DEVELOPMENTAL";
  }

  function divisionValue(level) {
    const key = upper(level);

    const values = {
      D1: 100,
      NCAA_DIVISION_I: 100,
      DIVISION_I: 100,
      D2: 84,
      NCAA_DIVISION_II: 84,
      DIVISION_II: 84,
      D3: 70,
      NCAA_DIVISION_III: 70,
      DIVISION_III: 70,
      NAIA: 64,
      JUCO: 58,
      DEVELOPMENTAL: 45
    };

    return values[key] || 50;
  }

  function pathwayFit(event, pathway) {
    const target = upper(event?.target_pathway || event?.division_focus || event?.division_level);
    const athletePath = upper(pathway?.primary_pathway);

    if (!target || !athletePath) return 55;

    if (target === athletePath) return 100;

    const diff =
      Math.abs(divisionValue(target) - divisionValue(athletePath));

    return clamp(100 - diff);
  }

  function sportFit(event, athlete) {
    const eventSport = upper(event?.sport || event?.primary_sport);
    const athleteSport = upper(athlete?.primary_sport || athlete?.sport);

    if (!eventSport || !athleteSport) return 60;
    return eventSport === athleteSport ? 100 : 25;
  }

  function positionFit(event, athlete) {
    const athletePosition =
      upper(athlete?.primary_position || athlete?.position);

    const positions =
      event?.positions ||
      event?.position_groups ||
      event?.target_positions ||
      [];

    if (!athletePosition) return 55;

    if (!Array.isArray(positions) || !positions.length) return 70;

    const normalized =
      positions.map(upper);

    if (normalized.includes(athletePosition)) return 100;

    const familyMap = {
      QB: ["QB", "QUARTERBACK"],
      WR: ["WR", "WIDE_RECEIVER", "RECEIVER"],
      RB: ["RB", "RUNNING_BACK"],
      DB: ["DB", "CB", "FS", "SS", "SAFETY", "CORNERBACK"],
      LB: ["LB", "LINEBACKER"],
      OL: ["OL", "LT", "RT", "LG", "RG", "C", "CENTER", "OFFENSIVE_LINE"],
      DL: ["DL", "EDGE", "DE", "DT", "NOSE", "DEFENSIVE_LINE"]
    };

    const family =
      Object.entries(familyMap).find(([_, aliases]) =>
        aliases.includes(athletePosition)
      );

    if (family) {
      const aliases = family[1];
      if (normalized.some(pos => aliases.includes(pos))) return 88;
    }

    return 35;
  }

  function readinessFit(eventType, readiness) {
    const score =
      safeNumber(readiness?.readiness_score);

    if (!score) return 50;

    if (eventType === "EXPOSURE") {
      if (score >= 82) return 100;
      if (score >= 70) return 78;
      if (score >= 60) return 52;
      return 25;
    }

    if (eventType === "HYBRID") {
      if (score >= 75) return 94;
      if (score >= 62) return 82;
      if (score >= 50) return 65;
      return 45;
    }

    if (eventType === "DEVELOPMENTAL") {
      if (score < 62) return 95;
      if (score < 76) return 82;
      return 60;
    }

    return 50;
  }

  function academicFit(event, eligibility) {
    const requiresOnTrack =
      !!event?.requires_ncaa_on_track ||
      upper(event?.academic_requirement).includes("ON_TRACK");

    const status =
      upper(eligibility?.eligibility_status || eligibility?.academic_pathway_status);

    if (!requiresOnTrack) return 75;

    if (status === "ON_TRACK") return 100;
    if (status === "PARTIAL_TRACK") return 55;
    if (status === "PENDING_REVIEW") return 45;

    return 20;
  }

  function recruiterFit(event, athlete, pathway) {
    const recruiters =
      Array.isArray(event?.attending_recruiters)
        ? event.attending_recruiters
        : [];

    if (!recruiters.length) return 35;

    const athleteSport =
      upper(athlete?.primary_sport || athlete?.sport);

    const athletePosition =
      upper(athlete?.primary_position || athlete?.position);

    const athletePathway =
      upper(pathway?.primary_pathway);

    let best = 35;

    recruiters.forEach((recruiter) => {
      let score = 40;

      const sports =
        Array.isArray(recruiter.sports)
          ? recruiter.sports.map(upper)
          : [];

      const positions =
        Array.isArray(recruiter.positions)
          ? recruiter.positions.map(upper)
          : [];

      const divisions =
        Array.isArray(recruiter.division_focus)
          ? recruiter.division_focus.map(upper)
          : [];

      if (sports.includes(athleteSport)) score += 20;
      if (positions.includes(athletePosition)) score += 20;
      if (divisions.includes(athletePathway)) score += 20;

      if (recruiter.verified_recruiter_id || recruiter.recruiter_id) {
        score += 8;
      }

      best = Math.max(best, clamp(score));
    });

    return best;
  }

  function geographyFit(event, athlete) {
    const eventRegion = upper(event?.region || event?.city_state || event?.state);
    const athleteRegion = upper(athlete?.city_state || athlete?.state);

    if (!eventRegion || !athleteRegion) return 60;

    if (athleteRegion.includes(eventRegion) || eventRegion.includes(athleteRegion)) {
      return 100;
    }

    const athleteState = athleteRegion.split(",").pop()?.trim();
    const eventState = eventRegion.split(",").pop()?.trim();

    if (athleteState && eventState && athleteState === eventState) return 84;

    return 55;
  }

  function determineMatchLevel(score) {
    if (score >= MATCH_LEVELS.STRONG_MATCH.min) return "STRONG_MATCH";
    if (score >= MATCH_LEVELS.GOOD_MATCH.min) return "GOOD_MATCH";
    if (score >= MATCH_LEVELS.DEVELOPMENT_MATCH.min) return "DEVELOPMENT_MATCH";
    return "LOW_MATCH";
  }

  function calculateEventMatch(event, systems = {}) {
    const athlete = systems.athlete || {};
    const readiness = systems.readiness || {};
    const pathway = systems.pathway || {};
    const eligibility = systems.eligibility || {};

    const eventType = resolveEventType(event);

    const scores = {
      sport_fit: sportFit(event, athlete),
      position_fit: positionFit(event, athlete),
      readiness_fit: readinessFit(eventType, readiness),
      pathway_fit: pathwayFit(event, pathway),
      academic_fit: academicFit(event, eligibility),
      recruiter_fit: recruiterFit(event, athlete, pathway),
      geography_fit: geographyFit(event, athlete)
    };

    const finalScore = Math.round(
      scores.sport_fit * 0.18 +
      scores.position_fit * 0.16 +
      scores.readiness_fit * 0.18 +
      scores.pathway_fit * 0.14 +
      scores.academic_fit * 0.12 +
      scores.recruiter_fit * 0.14 +
      scores.geography_fit * 0.08
    );

    const matchLevel = determineMatchLevel(finalScore);
    const typeMeta = EVENT_TYPES[eventType];
    const levelMeta = MATCH_LEVELS[matchLevel];

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      event_id: event.event_id || event.id || null,
      event_name: event.event_name || event.name || "Unnamed Event",

      event_type: eventType,
      event_label: typeMeta.label,
      event_color: typeMeta.color,
      event_description: typeMeta.description,

      match_score: clamp(finalScore),
      match_level: matchLevel,
      match_label: levelMeta.label,
      match_color: levelMeta.color,

      scores,

      recommended:
        finalScore >= 70,

      priority:
        finalScore >= 84
          ? "HIGH"
          : finalScore >= 70
            ? "MEDIUM"
            : finalScore >= 54
              ? "DEVELOPMENTAL"
              : "LOW",

      notifications:
        buildNotifications(event, systems, eventType, finalScore),

      meeting_targets:
        buildMeetingTargets(event, athlete, pathway),

      explanation:
        generateExplanation(event, systems, eventType, finalScore, scores),

      created_at:
        new Date().toISOString()
    };
  }

  function generateExplanation(event, systems, eventType, finalScore, scores) {
    const pathway =
      systems.pathway?.primary_pathway_label ||
      systems.pathway?.primary_pathway ||
      "pathway pending";

    return {
      summary:
        `${event.event_name || event.name || "This event"} is classified as ${EVENT_TYPES[eventType].label} and scored ${finalScore} for this athlete based on sport, position, readiness, pathway, academic, recruiter, and geography fit.`,

      pathway_context:
        `Current pathway context: ${pathway}.`,

      strongest_factors:
        Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([key]) => key.replace(/_/g, " ")),

      weakest_factors:
        Object.entries(scores)
          .sort((a, b) => a[1] - b[1])
          .slice(0, 2)
          .map(([key]) => key.replace(/_/g, " ")),

      rule:
        "Event routing is based on developmental value, exposure value, verified recruiter attendance, athlete readiness, pathway fit, academic status, and geographic practicality."
    };
  }

  function buildMeetingTargets(event, athlete, pathway) {
    const recruiters =
      Array.isArray(event?.attending_recruiters)
        ? event.attending_recruiters
        : [];

    const athleteSport = upper(athlete?.primary_sport || athlete?.sport);
    const athletePosition = upper(athlete?.primary_position || athlete?.position);
    const athletePathway = upper(pathway?.primary_pathway);

    return recruiters
      .filter((recruiter) => {
        const sports = Array.isArray(recruiter.sports) ? recruiter.sports.map(upper) : [];
        const positions = Array.isArray(recruiter.positions) ? recruiter.positions.map(upper) : [];
        const divisions = Array.isArray(recruiter.division_focus) ? recruiter.division_focus.map(upper) : [];

        return (
          sports.includes(athleteSport) ||
          positions.includes(athletePosition) ||
          divisions.includes(athletePathway)
        );
      })
      .map((recruiter) => ({
        recruiter_id: recruiter.recruiter_id || null,
        verified_recruiter_id: recruiter.verified_recruiter_id || null,
        recruiter_name: recruiter.recruiter_name || recruiter.name || "Recruiter",
        school_program: recruiter.school_program || recruiter.school || null,
        fit_reason: "Recruiter profile aligns with athlete sport, position, or pathway.",
        meeting_status: "RECOMMENDED"
      }));
  }

  function buildNotifications(event, systems, eventType, finalScore) {
    const athlete = systems.athlete || {};
    const eventName = event.event_name || event.name || "selected camp/combine";

    const base = [];

    base.push({
      role: "ATHLETE",
      priority: finalScore >= 84 ? "HIGH" : "MEDIUM",
      message:
        `${eventName} has been identified as a ${EVENT_TYPES[eventType].label} opportunity for your current pathway.`
    });

    if (hasValue(athlete.guardian_email) || hasValue(athlete.guardian_name)) {
      base.push({
        role: "PARENT",
        priority: "HIGH",
        message:
          `${eventName} may support your athlete's development, exposure, or pathway progress. Review event fit before registration.`
      });
    }

    if (hasValue(athlete.coach_email) || hasValue(athlete.coach_name)) {
      base.push({
        role: "COACH",
        priority: "MEDIUM",
        message:
          `${athlete.athlete_display_name || "Athlete"} is matched to ${eventName}. Coach visibility recommended.`
      });
    }

    const meetingTargets = buildMeetingTargets(event, athlete, systems.pathway || {});

    meetingTargets.forEach((target) => {
      base.push({
        role: "RECRUITER",
        recruiter_id: target.recruiter_id,
        verified_recruiter_id: target.verified_recruiter_id,
        priority: "MEDIUM",
        message:
          `${athlete.athlete_display_name || "Athlete"} matches your listed attendance profile for ${eventName}.`
      });
    });

    return base;
  }

  function rankEvents(events = [], systems = {}) {
    return events
      .map((event) => calculateEventMatch(event, systems))
      .filter((item) => item.ok)
      .sort((a, b) => b.match_score - a.match_score);
  }

  function createEventRoutingReceipt(match, systems = {}) {
    return {
      receipt_id:
        "event_route_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      engine_id: ENGINE_ID,
      version: VERSION,

      athlete_id: systems.athlete?.athlete_id || null,
      snapshot_id: systems.athlete?.snapshot_id || null,

      event_id: match.event_id,
      event_name: match.event_name,

      event_type: match.event_type,
      match_score: match.match_score,
      match_level: match.match_level,

      recommended: match.recommended,
      priority: match.priority,

      meeting_targets: match.meeting_targets || [],
      notifications: match.notifications || [],

      created_at: new Date().toISOString()
    };
  }

  function renderEventMatches(container, rankingResult = []) {
    if (!container || !Array.isArray(rankingResult)) return false;

    container.innerHTML = `
      <div style="
        border:1px solid rgba(255,52,52,.45);
        background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(0,0,0,.32));
        color:#f4f2ef;
        padding:22px;
        box-shadow:0 18px 42px rgba(0,0,0,.45);
      ">

        <div style="
          color:#ff3434;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          Camp / Combine Intelligence
        </div>

        <div style="
          margin-top:10px;
          font-size:32px;
          font-weight:1000;
          line-height:1;
        ">
          Matched Event Pathways
        </div>

        <div style="
          margin-top:10px;
          color:#9fe7ff;
          font-size:12px;
          line-height:1.5;
        ">
          Events are ranked by development value, exposure value, pathway fit,
          recruiter attendance, academic status, and athlete readiness.
        </div>

        <div style="
          margin-top:22px;
          display:grid;
          gap:12px;
        ">
          ${rankingResult.slice(0, 5).map((item) => `
            <div style="
              border:1px solid ${item.match_color};
              background:rgba(0,0,0,.25);
              padding:16px;
            ">

              <div style="
                display:flex;
                justify-content:space-between;
                gap:16px;
                align-items:flex-start;
              ">
                <div>
                  <div style="
                    color:${item.match_color};
                    font-size:11px;
                    letter-spacing:.14em;
                    text-transform:uppercase;
                    font-weight:1000;
                  ">
                    ${item.event_label} · ${item.match_label}
                  </div>

                  <div style="
                    margin-top:8px;
                    font-size:22px;
                    font-weight:1000;
                    text-transform:uppercase;
                  ">
                    ${item.event_name}
                  </div>

                  <div style="
                    margin-top:8px;
                    color:#b9c4d6;
                    font-size:12px;
                    line-height:1.45;
                  ">
                    ${item.explanation.summary}
                  </div>
                </div>

                <div style="
                  text-align:right;
                  min-width:80px;
                ">
                  <div style="
                    color:${item.match_color};
                    font-size:34px;
                    font-weight:1000;
                  ">
                    ${item.match_score}
                  </div>

                  <div style="
                    margin-top:4px;
                    color:#9ea7b5;
                    font-size:10px;
                    letter-spacing:.1em;
                    text-transform:uppercase;
                  ">
                    Match
                  </div>
                </div>
              </div>

              ${item.meeting_targets.length ? `
                <div style="
                  margin-top:14px;
                  border-top:1px solid rgba(255,255,255,.1);
                  padding-top:12px;
                  color:#9fe7ff;
                  font-size:11px;
                  letter-spacing:.08em;
                  text-transform:uppercase;
                ">
                  Recruiter Meeting Targets: ${item.meeting_targets.length}
                </div>
              ` : ""}

            </div>
          `).join("")}
        </div>

      </div>
    `;

    return true;
  }

  function resolveCurrentSystems() {
    return {
      athlete:
        window.STATScoreCurrentAthlete ||
        window.STATScoreCurrentSnapshot ||
        window.__STATSCORE_CURRENT_ATHLETE__ ||
        null,

      readiness:
        window.STATScoreCurrentReadiness ||
        null,

      pathway:
        window.STATScoreCurrentPathway ||
        null,

      eligibility:
        window.STATScoreCurrentNCAAEligibility ||
        null,

      verification:
        window.STATScoreCurrentVerification ||
        null,

      evidence:
        window.STATScoreCurrentEvidence ||
        null
    };
  }

  function runCurrentCampCombineMatches() {
    const systems = resolveCurrentSystems();

    const events =
      window.STATScoreCurrentEvents ||
      window.__STATSCORE_EVENT_LIST__ ||
      [];

    if (!systems.athlete) {
      warn("No current athlete found.");
      return null;
    }

    if (!Array.isArray(events) || !events.length) {
      warn("No camp/combine event list found.");
      return null;
    }

    const ranked =
      rankEvents(events, systems);

    window.STATScoreCurrentCampCombineMatches = ranked;

    if (ranked[0]) {
      window.STATScoreCurrentCampCombineReceipt =
        createEventRoutingReceipt(ranked[0], systems);
    }

    const panel =
      document.querySelector("#scCampCombineIntelligencePanel") ||
      document.querySelector("[data-camp-combine-intelligence]");

    if (panel) {
      renderEventMatches(panel, ranked);
    }

    return ranked;
  }

  function init() {
    if (window.__STATSCORE_CAMP_COMBINE_INTELLIGENCE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_CAMP_COMBINE_INTELLIGENCE_ENGINE__ = true;

    window.STATScoreCampCombineIntelligenceEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      event_types: EVENT_TYPES,
      match_levels: MATCH_LEVELS,

      calculateEventMatch,
      rankEvents,
      createEventRoutingReceipt,
      renderEventMatches,
      runCurrentCampCombineMatches
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.CampCombineIntelligenceEngine =
      window.STATScoreCampCombineIntelligenceEngine;

    const result = runCurrentCampCombineMatches();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        matches_generated: Array.isArray(result) && result.length > 0
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      matches_generated: Array.isArray(result) && result.length > 0
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
