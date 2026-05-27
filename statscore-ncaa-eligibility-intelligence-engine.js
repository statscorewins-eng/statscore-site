/* ============================================================
   STATScore™ NCAA Eligibility Intelligence Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Academic Snapshot → NCAA Track Status → Correction Path
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-ncaa-eligibility-intelligence-engine";
  const VERSION = "v1.0-academic-track-foundation";

  const ELIGIBILITY_STATUS = {
    ON_TRACK: {
      label: "On Track",
      color: "#37d67a",
      score: 90
    },
    PARTIAL_TRACK: {
      label: "Partially On Track",
      color: "#ffb100",
      score: 62
    },
    OFF_TRACK: {
      label: "Off Track",
      color: "#ff3434",
      score: 35
    },
    PENDING_REVIEW: {
      label: "Pending Review",
      color: "#9fe7ff",
      score: 50
    }
  };

  const NCAA_CORE_AREAS = [
    "English",
    "Math",
    "Science",
    "Social Science",
    "Additional Core",
    "World Language / Philosophy / Comparative Religion"
  ];

  const BASELINE_CORE_REQUIREMENTS = {
    english: {
      label: "English",
      recommended_units: 4
    },
    math: {
      label: "Math",
      recommended_units: 3
    },
    science: {
      label: "Science",
      recommended_units: 2
    },
    social_science: {
      label: "Social Science",
      recommended_units: 2
    },
    additional_core: {
      label: "Additional Core",
      recommended_units: 4
    },
    world_language: {
      label: "World Language / Philosophy / Comparative Religion",
      recommended_units: 1
    }
  };

  function log(message, payload) {
    console.log(`[STATScore NCAA Eligibility] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore NCAA Eligibility] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_");
  }

  function numberOrNull(value) {
    const n = Number(String(value || "").replace(/[^\d.]/g, ""));
    return Number.isNaN(n) ? null : n;
  }

  function clamp(value, min = 0, max = 100) {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, n));
  }

  function readRawPayload(athlete) {
    if (!athlete || !athlete.raw_payload) return {};

    if (typeof athlete.raw_payload === "object") {
      return athlete.raw_payload;
    }

    try {
      return JSON.parse(athlete.raw_payload);
    } catch (error) {
      warn("raw_payload could not be parsed.", error);
      return {};
    }
  }

  function resolveCoreUnits(athlete) {
    const raw = readRawPayload(athlete);
    const academics = raw.academics || raw.academic || {};

    return {
      english:
        numberOrNull(athlete?.english_core_units) ??
        numberOrNull(academics.english_core_units) ??
        numberOrNull(academics.english) ??
        null,

      math:
        numberOrNull(athlete?.math_core_units) ??
        numberOrNull(academics.math_core_units) ??
        numberOrNull(academics.math) ??
        null,

      science:
        numberOrNull(athlete?.science_core_units) ??
        numberOrNull(academics.science_core_units) ??
        numberOrNull(academics.science) ??
        null,

      social_science:
        numberOrNull(athlete?.social_science_core_units) ??
        numberOrNull(academics.social_science_core_units) ??
        numberOrNull(academics.social_science) ??
        null,

      additional_core:
        numberOrNull(athlete?.additional_core_units) ??
        numberOrNull(academics.additional_core_units) ??
        numberOrNull(academics.additional_core) ??
        null,

      world_language:
        numberOrNull(athlete?.world_language_core_units) ??
        numberOrNull(academics.world_language_core_units) ??
        numberOrNull(academics.world_language) ??
        null
    };
  }

  function evaluateCoreArea(key, completedUnits) {
    const requirement = BASELINE_CORE_REQUIREMENTS[key];

    if (!requirement) {
      return {
        key,
        label: key,
        status: "PENDING_REVIEW",
        completed_units: completedUnits,
        recommended_units: null,
        missing_units: null
      };
    }

    if (completedUnits === null) {
      return {
        key,
        label: requirement.label,
        status: "PENDING_REVIEW",
        completed_units: null,
        recommended_units: requirement.recommended_units,
        missing_units: requirement.recommended_units
      };
    }

    const missing = Math.max(0, requirement.recommended_units - completedUnits);

    return {
      key,
      label: requirement.label,
      status: missing <= 0 ? "ON_TRACK" : missing <= 1 ? "PARTIAL_TRACK" : "OFF_TRACK",
      completed_units: completedUnits,
      recommended_units: requirement.recommended_units,
      missing_units: missing
    };
  }

  function evaluateCoreCourses(athlete) {
    const units = resolveCoreUnits(athlete);

    return Object.keys(BASELINE_CORE_REQUIREMENTS).map((key) => {
      return evaluateCoreArea(key, units[key]);
    });
  }

  function resolveGpaStatus(athlete) {
    const gpa = numberOrNull(athlete?.current_gpa);

    if (gpa === null) {
      return {
        status: "PENDING_REVIEW",
        score: 50,
        gpa: null,
        note: "Current GPA unavailable."
      };
    }

    if (gpa >= 3.0) {
      return {
        status: "ON_TRACK",
        score: 90,
        gpa,
        note: "Current GPA shows strong eligibility alignment."
      };
    }

    if (gpa >= 2.3) {
      return {
        status: "ON_TRACK",
        score: 78,
        gpa,
        note: "Current GPA appears eligibility-aligned, pending full NCAA review."
      };
    }

    if (gpa >= 2.0) {
      return {
        status: "PARTIAL_TRACK",
        score: 60,
        gpa,
        note: "Current GPA is near risk range and should be reviewed immediately."
      };
    }

    return {
      status: "OFF_TRACK",
      score: 35,
      gpa,
      note: "Current GPA indicates high academic eligibility risk."
    };
  }

  function resolveTranscriptStatus(athlete) {
    const transcript = upper(athlete?.transcript_available);
    const counselor = upper(athlete?.counselor_contact_available);

    const transcriptYes =
      transcript.includes("YES") ||
      transcript.includes("TRUE") ||
      transcript.includes("AVAILABLE");

    const counselorYes =
      counselor.includes("YES") ||
      counselor.includes("TRUE") ||
      counselor.includes("AVAILABLE");

    if (transcriptYes && counselorYes) {
      return {
        status: "ON_TRACK",
        score: 90,
        note: "Transcript and counselor contact are available."
      };
    }

    if (transcriptYes || counselorYes) {
      return {
        status: "PARTIAL_TRACK",
        score: 62,
        note: "Partial academic verification available."
      };
    }

    return {
      status: "PENDING_REVIEW",
      score: 45,
      note: "Transcript and counselor verification are not yet confirmed."
    };
  }

  function deriveStatusFromExistingField(athlete) {
    const existing = upper(athlete?.ncaa_eligibility_status);

    if (!existing) return null;

    if (existing.includes("ON_TRACK") || existing.includes("ON_TRACK") || existing.includes("ONTRACK")) {
      return "ON_TRACK";
    }

    if (existing.includes("PARTIAL")) {
      return "PARTIAL_TRACK";
    }

    if (existing.includes("OFF_TRACK") || existing.includes("OFFTRACK")) {
      return "OFF_TRACK";
    }

    if (existing.includes("PENDING")) {
      return "PENDING_REVIEW";
    }

    return null;
  }

  function average(values) {
    const valid = values.filter((value) => typeof value === "number" && !Number.isNaN(value));
    if (!valid.length) return null;

    return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
  }

  function determineOverallStatus(existingStatus, coreResults, gpaStatus, transcriptStatus) {
    if (existingStatus === "OFF_TRACK") return "OFF_TRACK";

    const statuses = [
      ...coreResults.map((item) => item.status),
      gpaStatus.status,
      transcriptStatus.status
    ];

    const offCount = statuses.filter((status) => status === "OFF_TRACK").length;
    const partialCount = statuses.filter((status) => status === "PARTIAL_TRACK").length;
    const pendingCount = statuses.filter((status) => status === "PENDING_REVIEW").length;

    if (offCount >= 2) return "OFF_TRACK";
    if (offCount === 1 || partialCount >= 2) return "PARTIAL_TRACK";
    if (pendingCount >= 3) return "PENDING_REVIEW";
    if (partialCount === 1 || pendingCount > 0) return "PARTIAL_TRACK";

    return existingStatus || "ON_TRACK";
  }

  function generateCorrectionPlan(coreResults, gpaStatus, transcriptStatus) {
    const actions = [];

    coreResults.forEach((area) => {
      if (area.status === "OFF_TRACK" || area.status === "PARTIAL_TRACK") {
        actions.push({
          category: "Core Course Alignment",
          priority: area.status === "OFF_TRACK" ? "HIGH" : "MEDIUM",
          issue: `${area.label} core units incomplete`,
          action: `Review ${area.label} course history and schedule missing NCAA-aligned core unit(s).`,
          missing_units: area.missing_units
        });
      }

      if (area.status === "PENDING_REVIEW") {
        actions.push({
          category: "Core Course Verification",
          priority: "MEDIUM",
          issue: `${area.label} units unavailable`,
          action: `Confirm completed ${area.label} NCAA core units with counselor/transcript review.`,
          missing_units: area.missing_units
        });
      }
    });

    if (gpaStatus.status === "OFF_TRACK" || gpaStatus.status === "PARTIAL_TRACK") {
      actions.push({
        category: "GPA Recovery",
        priority: gpaStatus.status === "OFF_TRACK" ? "HIGH" : "MEDIUM",
        issue: "GPA eligibility risk",
        action: "Create GPA recovery plan with counselor and prioritize eligible core-course grade improvement.",
        current_gpa: gpaStatus.gpa
      });
    }

    if (transcriptStatus.status !== "ON_TRACK") {
      actions.push({
        category: "Academic Verification",
        priority: "HIGH",
        issue: "Transcript/counselor verification incomplete",
        action: "Upload transcript or confirm counselor contact so NCAA alignment can be reviewed."
      });
    }

    return actions.slice(0, 8);
  }

  function calculateEligibility(athlete) {
    if (!athlete) {
      return {
        ok: false,
        status: "NO_ATHLETE",
        eligibility_status: "PENDING_REVIEW",
        eligibility_score: 0,
        correction_plan: []
      };
    }

    const existingStatus = deriveStatusFromExistingField(athlete);
    const coreResults = evaluateCoreCourses(athlete);
    const gpaStatus = resolveGpaStatus(athlete);
    const transcriptStatus = resolveTranscriptStatus(athlete);

    const coreScores = coreResults.map((item) => {
      if (item.status === "ON_TRACK") return 90;
      if (item.status === "PARTIAL_TRACK") return 62;
      if (item.status === "OFF_TRACK") return 35;
      return 50;
    });

    const overallStatus = determineOverallStatus(
      existingStatus,
      coreResults,
      gpaStatus,
      transcriptStatus
    );

    const statusMeta = ELIGIBILITY_STATUS[overallStatus] || ELIGIBILITY_STATUS.PENDING_REVIEW;

    const calculatedScore = average([
      ...coreScores,
      gpaStatus.score,
      transcriptStatus.score,
      statusMeta.score
    ]);

    const correctionPlan = generateCorrectionPlan(
      coreResults,
      gpaStatus,
      transcriptStatus
    );

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      athlete_id: athlete.athlete_id || null,
      snapshot_id: athlete.snapshot_id || null,

      eligibility_status: overallStatus,
      eligibility_label: statusMeta.label,
      eligibility_color: statusMeta.color,
      eligibility_score: calculatedScore,

      existing_status_source: existingStatus || "CALCULATED",
      current_gpa: gpaStatus.gpa,

      core_course_results: coreResults,
      gpa_status: gpaStatus,
      transcript_status: transcriptStatus,

      correction_plan: correctionPlan,

      readiness_feed: {
        academic_readiness_score: calculatedScore,
        academic_risk:
          overallStatus === "ON_TRACK"
            ? "LOW"
            : overallStatus === "PARTIAL_TRACK"
              ? "MEDIUM"
              : overallStatus === "OFF_TRACK"
                ? "HIGH"
                : "REVIEW_REQUIRED"
      },

      pathway_feed: {
        academic_pathway_status: overallStatus,
        academic_fit_modifier:
          overallStatus === "ON_TRACK"
            ? "POSITIVE"
            : overallStatus === "PARTIAL_TRACK"
              ? "CAUTION"
              : overallStatus === "OFF_TRACK"
                ? "RESTRICTED"
                : "UNKNOWN"
      },

      explanation: {
        summary:
          `NCAA academic track is currently classified as ${statusMeta.label}.`,
        rule:
          "Eligibility track is based on available course-unit data, GPA status, transcript/counselor verification, and any existing NCAA eligibility status field.",
        limitation:
          "This is a STATScore readiness aid and does not certify NCAA eligibility. Official eligibility must be confirmed through authorized NCAA/academic processes."
      },

      created_at: new Date().toISOString()
    };
  }

  function renderEligibility(container, eligibility) {
    if (!container || !eligibility) return null;

    container.innerHTML = `
      <div style="
        border:1px solid ${eligibility.eligibility_color};
        background:rgba(255,255,255,.035);
        padding:18px;
        color:#f4f2ef;
        box-shadow:0 12px 28px rgba(0,0,0,.38);
      ">

        <div style="
          color:${eligibility.eligibility_color};
          font-weight:950;
          letter-spacing:.18em;
          text-transform:uppercase;
          font-size:12px;
        ">
          NCAA Academic Track
        </div>

        <div style="
          margin-top:10px;
          font-size:32px;
          font-weight:950;
          color:${eligibility.eligibility_color};
        ">
          ${eligibility.eligibility_label}
        </div>

        <div style="
          margin-top:6px;
          color:#9fe7ff;
          font-size:13px;
          font-weight:900;
          letter-spacing:.12em;
          text-transform:uppercase;
        ">
          Academic Readiness Score ${eligibility.eligibility_score}
        </div>

        <div style="
          margin-top:14px;
          color:#b9c4d6;
          font-size:12px;
          line-height:1.5;
        ">
          ${eligibility.explanation.summary}
        </div>

        <div style="
          margin-top:18px;
          display:grid;
          gap:10px;
        ">
          ${eligibility.correction_plan.length ? eligibility.correction_plan.slice(0, 5).map((item) => `
            <div style="
              border:1px solid rgba(255,255,255,.12);
              background:rgba(0,0,0,.22);
              padding:12px;
            ">
              <div style="
                color:#ff3434;
                font-weight:950;
                letter-spacing:.12em;
                text-transform:uppercase;
                font-size:11px;
              ">
                ${item.category} · ${item.priority}
              </div>

              <div style="
                margin-top:7px;
                color:#f4f2ef;
                font-weight:900;
                font-size:13px;
              ">
                ${item.issue}
              </div>

              <div style="
                margin-top:6px;
                color:#d6deea;
                font-size:12px;
                line-height:1.45;
              ">
                ${item.action}
              </div>
            </div>
          `).join("") : `
            <div style="
              border:1px solid rgba(55,214,122,.35);
              background:rgba(55,214,122,.06);
              padding:12px;
              color:#d6deea;
              font-size:12px;
            ">
              No immediate academic correction actions detected from available data.
            </div>
          `}
        </div>

        <div style="
          margin-top:16px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:12px;
          color:#aab4c3;
          font-size:11px;
          line-height:1.45;
        ">
          STATScore does not certify NCAA eligibility. This layer supports athlete, parent,
          coach, and counselor readiness review.
        </div>

      </div>
    `;

    return true;
  }

  function resolveCurrentAthlete() {
    return (
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null
    );
  }

  function runCurrentEligibility() {
    const athlete = resolveCurrentAthlete();

    if (!athlete) {
      warn("No current athlete found.");
      return null;
    }

    const eligibility = calculateEligibility(athlete);

    window.STATScoreCurrentNCAAEligibility = eligibility;

    const panel =
      document.querySelector("[data-statscore-ncaa-eligibility-panel]") ||
      document.querySelector("#statscore-ncaa-eligibility-panel") ||
      document.querySelector("#scNCAAEligibilityPanel");

    if (panel) {
      renderEligibility(panel, eligibility);
    }

    return eligibility;
  }

  function init() {
    if (window.__STATSCORE_NCAA_ELIGIBILITY_INTELLIGENCE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_NCAA_ELIGIBILITY_INTELLIGENCE_ENGINE__ = true;

    window.STATScoreNCAAEligibilityIntelligenceEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      eligibility_status: ELIGIBILITY_STATUS,
      baseline_core_requirements: BASELINE_CORE_REQUIREMENTS,

      calculateEligibility,
      renderEligibility,
      runCurrentEligibility
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.NCAAEligibilityIntelligenceEngine =
      window.STATScoreNCAAEligibilityIntelligenceEngine;

    const result = runCurrentEligibility();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        eligibility_generated: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      eligibility_generated: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
