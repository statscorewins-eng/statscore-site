/* ============================================================
   STATScore™ Program Intelligence Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Program Intelligence → Program Ratings → Ranking Infrastructure
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-program-intelligence-engine";
  const VERSION = "v1.0-program-governance";

  const PROGRAM_STATUS = {
    ELITE: {
      label: "Elite Program",
      color: "#37d67a",
      min: 90
    },

    VERIFIED_ACTIVE: {
      label: "Verified Active Program",
      color: "#9fe7ff",
      min: 78
    },

    DEVELOPING: {
      label: "Developing Program",
      color: "#ffb100",
      min: 62
    },

    LIMITED_ACTIVITY: {
      label: "Limited Activity",
      color: "#ff3434",
      min: 0
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Program Intelligence] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Program Intelligence] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function safe(value, fallback = 0) {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  function average(values = []) {
    const valid = values.filter(v => typeof v === "number");

    if (!valid.length) return 0;

    return Math.round(
      valid.reduce((a, b) => a + b, 0) / valid.length
    );
  }

  function resolveStatus(score) {

    if (score >= PROGRAM_STATUS.ELITE.min) {
      return "ELITE";
    }

    if (score >= PROGRAM_STATUS.VERIFIED_ACTIVE.min) {
      return "VERIFIED_ACTIVE";
    }

    if (score >= PROGRAM_STATUS.DEVELOPING.min) {
      return "DEVELOPING";
    }

    return "LIMITED_ACTIVITY";
  }

  /* ============================================================
     CORE CATEGORY SCORING
     ============================================================ */

  function calculateAthleteParticipation(program) {

    const totalAthletes =
      safe(program.total_athletes);

    const activeAthletes =
      safe(program.active_athletes);

    const verifiedAthletes =
      safe(program.verified_athletes);

    const updatedProfiles =
      safe(program.updated_profiles);

    if (!totalAthletes) {
      return {
        score: 0,
        explanation: "No athlete participation data available."
      };
    }

    const activeRatio =
      (activeAthletes / totalAthletes) * 100;

    const verifiedRatio =
      (verifiedAthletes / totalAthletes) * 100;

    const updatedRatio =
      (updatedProfiles / totalAthletes) * 100;

    const score = average([
      activeRatio,
      verifiedRatio,
      updatedRatio
    ]);

    return {
      score: clamp(score),
      explanation:
        "Measures athlete activity, verified participation, and profile engagement."
    };
  }

  function calculateCoachParticipation(program) {

    const totalCoaches =
      safe(program.total_coaches);

    const activeEvaluators =
      safe(program.active_coach_evaluators);

    const evaluations =
      safe(program.total_evaluations_submitted);

    if (!totalCoaches) {
      return {
        score: 0,
        explanation: "No coach participation data available."
      };
    }

    const evaluatorRatio =
      (activeEvaluators / totalCoaches) * 100;

    const evaluationDensity =
      Math.min(100, evaluations * 4);

    const score = average([
      evaluatorRatio,
      evaluationDensity
    ]);

    return {
      score: clamp(score),
      explanation:
        "Measures coaching participation, evaluations, and organizational engagement."
    };
  }

  function calculateRecruiterEngagement(program) {

    const recruiterVisits =
      safe(program.recruiter_visits);

    const verifiedInteractions =
      safe(program.verified_recruiter_interactions);

    const eventAttendance =
      safe(program.recruiting_event_attendance);

    const score = average([
      Math.min(100, recruiterVisits * 8),
      Math.min(100, verifiedInteractions * 6),
      Math.min(100, eventAttendance * 10)
    ]);

    return {
      score: clamp(score),
      explanation:
        "Measures recruiter visibility, verified interactions, and event activity."
    };
  }

  function calculateAcademicAlignment(program) {

    const onTrack =
      safe(program.on_track_athletes);

    const partialTrack =
      safe(program.partial_track_athletes);

    const offTrack =
      safe(program.off_track_athletes);

    const total =
      onTrack + partialTrack + offTrack;

    if (!total) {
      return {
        score: 50,
        explanation: "Academic alignment data unavailable."
      };
    }

    const weighted =
      (
        (onTrack * 1.0) +
        (partialTrack * 0.55) +
        (offTrack * 0.15)
      ) / total;

    return {
      score: clamp(Math.round(weighted * 100)),
      explanation:
        "Measures NCAA academic readiness alignment across athlete base."
    };
  }

  function calculatePlacementOutcomes(program) {

    const d1 =
      safe(program.d1_placements);

    const d2 =
      safe(program.d2_placements);

    const naia =
      safe(program.naia_placements);

    const juco =
      safe(program.juco_placements);

    const total =
      d1 + d2 + naia + juco;

    if (!total) {
      return {
        score: 40,
        explanation: "No verified placement outcomes available."
      };
    }

    const weighted =
      (
        (d1 * 1.0) +
        (d2 * 0.82) +
        (naia * 0.65) +
        (juco * 0.58)
      ) / total;

    return {
      score: clamp(Math.round(weighted * 100)),
      explanation:
        "Measures verified athlete placement outcomes and pathway success."
    };
  }

  function calculateEvaluatorParticipation(program) {

    const evaluatorCount =
      safe(program.verified_evaluators);

    const evidenceUploads =
      safe(program.evidence_uploads);

    const confidenceReviews =
      safe(program.confidence_reviews);

    const score = average([
      Math.min(100, evaluatorCount * 10),
      Math.min(100, evidenceUploads * 3),
      Math.min(100, confidenceReviews * 5)
    ]);

    return {
      score: clamp(score),
      explanation:
        "Measures evaluator density, evidence support, and intelligence participation."
    };
  }

  /* ============================================================
     MAIN ENGINE
     ============================================================ */

  function calculateProgramIntelligence(program) {

    if (!program) {
      return {
        ok: false,
        status: "NO_PROGRAM"
      };
    }

    const athleteParticipation =
      calculateAthleteParticipation(program);

    const coachParticipation =
      calculateCoachParticipation(program);

    const recruiterEngagement =
      calculateRecruiterEngagement(program);

    const academicAlignment =
      calculateAcademicAlignment(program);

    const placementOutcomes =
      calculatePlacementOutcomes(program);

    const evaluatorParticipation =
      calculateEvaluatorParticipation(program);

    const finalScore = average([
      athleteParticipation.score,
      coachParticipation.score,
      recruiterEngagement.score,
      academicAlignment.score,
      placementOutcomes.score,
      evaluatorParticipation.score
    ]);

    const statusKey =
      resolveStatus(finalScore);

    const status =
      PROGRAM_STATUS[statusKey];

    return {

      ok: true,

      engine_id: ENGINE_ID,
      version: VERSION,

      program_name:
        normalize(program.program_name),

      organization_id:
        program.organization_id || null,

      program_score:
        finalScore,

      program_status:
        statusKey,

      status_label:
        status.label,

      status_color:
        status.color,

      category_scores: {

        athlete_participation:
          athleteParticipation,

        coach_participation:
          coachParticipation,

        recruiter_engagement:
          recruiterEngagement,

        academic_alignment:
          academicAlignment,

        placement_outcomes:
          placementOutcomes,

        evaluator_participation:
          evaluatorParticipation

      },

      strengths:
        determineStrengths({

          athleteParticipation,
          coachParticipation,
          recruiterEngagement,
          academicAlignment,
          placementOutcomes,
          evaluatorParticipation

        }),

      weaknesses:
        determineWeaknesses({

          athleteParticipation,
          coachParticipation,
          recruiterEngagement,
          academicAlignment,
          placementOutcomes,
          evaluatorParticipation

        }),

      ranking_projection:
        determineRankingProjection(finalScore),

      phnx_shoutout_eligible:
        finalScore >= 84,

      transparency_status:
        determineTransparency(program),

      generated_at:
        new Date().toISOString()

    };
  }

  /* ============================================================
     ANALYSIS HELPERS
     ============================================================ */

  function determineStrengths(scores) {

    return Object.entries(scores)
      .filter(([_, value]) => value.score >= 80)
      .map(([key]) =>
        key
          .replace(/_/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase())
      );
  }

  function determineWeaknesses(scores) {

    return Object.entries(scores)
      .filter(([_, value]) => value.score < 60)
      .map(([key]) =>
        key
          .replace(/_/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase())
      );
  }

  function determineRankingProjection(score) {

    if (score >= 92) {
      return "National Visibility";
    }

    if (score >= 84) {
      return "Regional Top Tier";
    }

    if (score >= 72) {
      return "Competitive Regional";
    }

    if (score >= 60) {
      return "Developing Program";
    }

    return "Limited Competitive Visibility";
  }

  function determineTransparency(program) {

    const updated =
      safe(program.updated_profiles);

    const athletes =
      safe(program.total_athletes);

    if (!athletes) {
      return "LIMITED";
    }

    const ratio =
      (updated / athletes) * 100;

    if (ratio >= 82) {
      return "HIGH";
    }

    if (ratio >= 58) {
      return "MODERATE";
    }

    return "LIMITED";
  }

  /* ============================================================
     PHNX SPORTS TOP 10
     ============================================================ */

  function buildTop10Programs(programs = []) {

    const calculated = programs
      .map(program =>
        calculateProgramIntelligence(program)
      )
      .filter(item => item.ok)
      .sort((a, b) =>
        b.program_score - a.program_score
      )
      .slice(0, 10);

    return calculated.map((program, index) => ({

      rank:
        index + 1,

      program_name:
        program.program_name,

      score:
        program.program_score,

      status:
        program.status_label,

      strengths:
        program.strengths,

      shoutout:
        program.phnx_shoutout_eligible,

      ranking_projection:
        program.ranking_projection

    }));
  }

  /* ============================================================
     RENDERING
     ============================================================ */

  function renderProgramPanel(container, result) {

    if (!container || !result) {
      return false;
    }

    container.innerHTML = `

      <div style="
        border:1px solid ${result.status_color};
        background:rgba(255,255,255,.03);
        padding:20px;
        color:#f4f2ef;
      ">

        <div style="
          color:${result.status_color};
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          Program Intelligence
        </div>

        <div style="
          margin-top:12px;
          font-size:34px;
          font-weight:1000;
        ">
          ${result.program_name}
        </div>

        <div style="
          margin-top:10px;
          display:flex;
          gap:20px;
          flex-wrap:wrap;
        ">

          <div>
            <div style="
              color:#9ea7b5;
              font-size:11px;
              letter-spacing:.12em;
              text-transform:uppercase;
            ">
              Program Rating
            </div>

            <div style="
              margin-top:6px;
              font-size:40px;
              font-weight:1000;
              color:${result.status_color};
            ">
              ${result.program_score}
            </div>
          </div>

          <div>
            <div style="
              color:#9ea7b5;
              font-size:11px;
              letter-spacing:.12em;
              text-transform:uppercase;
            ">
              Status
            </div>

            <div style="
              margin-top:8px;
              font-size:16px;
              font-weight:900;
              color:#9fe7ff;
            ">
              ${result.status_label}
            </div>
          </div>

        </div>

        <div style="
          margin-top:20px;
          display:grid;
          gap:12px;
        ">

          ${Object.entries(result.category_scores).map(([key, value]) => `
            <div style="
              border:1px solid rgba(255,255,255,.08);
              background:rgba(0,0,0,.22);
              padding:14px;
            ">

              <div style="
                color:#ff3434;
                font-size:11px;
                letter-spacing:.12em;
                text-transform:uppercase;
                font-weight:1000;
              ">
                ${key.replace(/_/g, " ")}
              </div>

              <div style="
                margin-top:8px;
                font-size:28px;
                font-weight:1000;
              ">
                ${value.score}
              </div>

              <div style="
                margin-top:8px;
                color:#d6deea;
                font-size:12px;
                line-height:1.5;
              ">
                ${value.explanation}
              </div>

            </div>
          `).join("")}

        </div>

      </div>

    `;

    return true;
  }

  /* ============================================================
     CURRENT PROGRAM
     ============================================================ */

  function runCurrentProgram() {

    const current =
      window.STATScoreCurrentProgram ||
      null;

    if (!current) {
      warn("No current program found.");
      return null;
    }

    const result =
      calculateProgramIntelligence(current);

    window.STATScoreCurrentProgramIntelligence =
      result;

    const panel =
      document.querySelector(
        "#scProgramIntelligencePanel"
      ) ||
      document.querySelector(
        "[data-program-intelligence]"
      );

    if (panel) {
      renderProgramPanel(panel, result);
    }

    return result;
  }

  /* ============================================================
     INIT
     ============================================================ */

  function init() {

    if (window.__STATSCORE_PROGRAM_INTELLIGENCE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_PROGRAM_INTELLIGENCE_ENGINE__ =
      true;

    window.STATScoreProgramIntelligenceEngine = {

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      calculateProgramIntelligence,
      buildTop10Programs,
      renderProgramPanel,
      runCurrentProgram

    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.ProgramIntelligenceEngine =
      window.STATScoreProgramIntelligenceEngine;

    const result =
      runCurrentProgram();

    if (window.STATScoreEngineBus?.emit) {

      window.STATScoreEngineBus.emit(
        "engine_online",
        {

          engine:
            ENGINE_ID,

          version:
            VERSION,

          status:
            "ONLINE",

          program_generated:
            !!(result && result.ok)

        }
      );
    }

    log("Engine online.", {

      engine:
        ENGINE_ID,

      version:
        VERSION

    });
  }

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})(); 
