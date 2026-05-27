/* ============================================================
   STATScore™ Pathway Intelligence Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Athlete Intelligence → Division Fit → Development Pathway
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-pathway-intelligence-engine";
  const VERSION = "v1.0-division-fit-foundation";

  const PATHWAY_LEVELS = {
    D1: {
      label: "NCAA Division I",
      min_score: 86,
      min_readiness: 82,
      min_confidence: 75,
      academic_requirement: "High NCAA alignment required",
      description: "Highest competitive and exposure environment."
    },
    D2: {
      label: "NCAA Division II",
      min_score: 76,
      min_readiness: 72,
      min_confidence: 60,
      academic_requirement: "Strong NCAA alignment required",
      description: "High-level collegiate pathway with balanced athletic and academic opportunity."
    },
    D3: {
      label: "NCAA Division III",
      min_score: 66,
      min_readiness: 64,
      min_confidence: 50,
      academic_requirement: "Institution-specific academic fit required",
      description: "Academic-fit driven collegiate pathway with competitive athletics."
    },
    NAIA: {
      label: "NAIA",
      min_score: 60,
      min_readiness: 58,
      min_confidence: 45,
      academic_requirement: "NAIA eligibility alignment required",
      description: "Flexible collegiate pathway with strong development and opportunity fit."
    },
    JUCO: {
      label: "JUCO",
      min_score: 50,
      min_readiness: 45,
      min_confidence: 30,
      academic_requirement: "Developmental academic/athletic bridge pathway",
      description: "Bridge pathway for development, exposure, academics, or opportunity rebuilding."
    },
    DEVELOPMENTAL: {
      label: "Developmental Track",
      min_score: 0,
      min_readiness: 0,
      min_confidence: 0,
      academic_requirement: "Foundational correction and development required",
      description: "Athlete needs targeted development before reliable collegiate pathway alignment."
    }
  };

  const SPORT_PATHWAY_NOTES = {
    FOOTBALL: {
      QB: {
        D1: "Requires strong processing, verified film, arm talent, decision speed, leadership, and game impact.",
        D2: "Requires functional collegiate tools, coachability, verified production, and development upside.",
        D3: "Strong option for academic-fit athletes with reliable mechanics and leadership.",
        NAIA: "Strong pathway for athletes with upside, late development, or regional opportunity fit.",
        JUCO: "Useful for physical development, exposure rebuilding, academic correction, or late bloomers."
      },
      WR: {
        D1: "Requires separation, verified speed, route value, ball skills, and explosive play evidence.",
        D2: "Requires reliable production, measurable traits, and verified film.",
        D3: "Strong fit for skilled, reliable receivers with academic alignment.",
        NAIA: "Useful for production-driven receivers needing exposure or physical development.",
        JUCO: "Useful for late bloomers, speed development, or film/academic rebuilding."
      },
      RB: {
        D1: "Requires verified explosiveness, contact balance, production, durability, and pass-game value.",
        D2: "Requires strong production and reliable verified traits.",
        D3: "Good pathway for high-character, productive backs with academic alignment.",
        NAIA: "Strong option for versatile or underexposed backs.",
        JUCO: "Useful for physical maturity, production building, or academic recovery."
      },
      DB: {
        D1: "Requires verified speed, coverage ability, ball skills, and competitive film evidence.",
        D2: "Requires strong coverage traits and reliable game film.",
        D3: "Good pathway for technically sound defensive backs with academic fit.",
        NAIA: "Strong regional exposure and development pathway.",
        JUCO: "Useful for speed development, physical maturity, or film rebuilding."
      }
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Pathway] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Pathway] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_");
  }

  function clamp(value, min = 0, max = 100) {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, n));
  }

  function academicStatusScore(athlete) {
    const status = upper(athlete?.ncaa_eligibility_status);

    if (status.includes("ON_TRACK") || status.includes("ON TRACK")) return 90;
    if (status.includes("PARTIAL")) return 65;
    if (status.includes("OFF_TRACK") || status.includes("OFF TRACK")) return 35;
    if (status.includes("PENDING")) return 50;

    if (athlete?.current_gpa) {
      const gpa = Number(athlete.current_gpa);
      if (!Number.isNaN(gpa)) {
        if (gpa >= 3.5) return 88;
        if (gpa >= 3.0) return 78;
        if (gpa >= 2.5) return 66;
        if (gpa >= 2.0) return 52;
        return 35;
      }
    }

    return 50;
  }

  function calculateFitScore(score, readiness, verification, evidence, athlete) {
    const athletic = clamp(score?.score_final || 0) || 0;
    const ready = clamp(readiness?.readiness_score || 0) || 0;
    const confidence = clamp(verification?.confidence_score || 0) || 0;
    const proof = clamp(evidence?.evidence_score || 0) || 0;
    const academic = academicStatusScore(athlete);

    const fit = Math.round(
      athletic * 0.36 +
      ready * 0.24 +
      confidence * 0.14 +
      proof * 0.12 +
      academic * 0.14
    );

    return clamp(fit);
  }

  function choosePrimaryPathway(fitScore, score, readiness, verification) {
    const athletic = clamp(score?.score_final || 0) || 0;
    const ready = clamp(readiness?.readiness_score || 0) || 0;
    const confidence = clamp(verification?.confidence_score || 0) || 0;

    const ordered = ["D1", "D2", "D3", "NAIA", "JUCO", "DEVELOPMENTAL"];

    for (const key of ordered) {
      const level = PATHWAY_LEVELS[key];

      if (
        fitScore >= level.min_score &&
        athletic >= level.min_score - 4 &&
        ready >= level.min_readiness &&
        confidence >= level.min_confidence
      ) {
        return key;
      }
    }

    return "DEVELOPMENTAL";
  }

  function generateAlternatePathways(primaryKey, fitScore) {
    const keys = ["D1", "D2", "D3", "NAIA", "JUCO", "DEVELOPMENTAL"];
    const index = keys.indexOf(primaryKey);

    const alternates = [];

    if (index > 0) alternates.push(keys[index - 1]);
    if (index >= 0 && index < keys.length - 1) alternates.push(keys[index + 1]);

    if (primaryKey === "DEVELOPMENTAL" && fitScore >= 45) {
      alternates.push("JUCO", "NAIA");
    }

    return Array.from(new Set(alternates)).map((key) => ({
      pathway: key,
      ...PATHWAY_LEVELS[key]
    }));
  }

  function getSportPathwayNote(athlete, pathwayKey) {
    const sport = upper(athlete?.primary_sport || athlete?.sport || "FOOTBALL");
    const position = upper(athlete?.primary_position || athlete?.position || "ATH");

    const sportNotes = SPORT_PATHWAY_NOTES[sport] || {};
    const positionNotes =
      sportNotes[position] ||
      sportNotes.QB ||
      {};

    return (
      positionNotes[pathwayKey] ||
      PATHWAY_LEVELS[pathwayKey]?.description ||
      "Pathway note pending."
    );
  }

  function generatePathwayActions(primaryKey, athlete, readiness) {
    const actions = [];

    const academic = upper(athlete?.ncaa_eligibility_status);

    if (!academic.includes("ON_TRACK") && !academic.includes("ON TRACK")) {
      actions.push({
        category: "Academic Alignment",
        action: "Review NCAA course-load and eligibility status with counselor.",
        priority: "HIGH"
      });
    }

    if (primaryKey === "D1" || primaryKey === "D2") {
      actions.push({
        category: "Verification",
        action: "Prioritize verified film, camp/combine metrics, and evaluator confirmation.",
        priority: "HIGH"
      });

      actions.push({
        category: "Exposure",
        action: "Route athlete toward exposure camps with confirmed college recruiter attendance.",
        priority: "HIGH"
      });
    }

    if (primaryKey === "D3") {
      actions.push({
        category: "Academic Fit",
        action: "Build academic-fit school list and align athletics with admissions profile.",
        priority: "HIGH"
      });
    }

    if (primaryKey === "NAIA") {
      actions.push({
        category: "Opportunity Fit",
        action: "Identify regional NAIA programs matching athlete development and playing style.",
        priority: "MEDIUM"
      });
    }

    if (primaryKey === "JUCO") {
      actions.push({
        category: "Bridge Pathway",
        action: "Build JUCO bridge plan for development, academic progress, and renewed exposure.",
        priority: "HIGH"
      });
    }

    if (primaryKey === "DEVELOPMENTAL") {
      actions.push({
        category: "Development",
        action: "Complete readiness development priorities before major exposure push.",
        priority: "HIGH"
      });
    }

    if (readiness?.development_plan?.length) {
      readiness.development_plan.slice(0, 2).forEach((item) => {
        actions.push({
          category: "Readiness Development",
          action: item.recommendation,
          priority: "MEDIUM",
          trait: item.trait
        });
      });
    }

    return actions;
  }

  function generateCampCombineGuidance(primaryKey, athlete) {
    if (primaryKey === "D1" || primaryKey === "D2") {
      return {
        recommended_event_type: "HYBRID",
        guidance:
          "Prioritize camps/combines that provide both development and verified recruiter exposure."
      };
    }

    if (primaryKey === "D3" || primaryKey === "NAIA") {
      return {
        recommended_event_type: "DEVELOPMENTAL + TARGETED EXPOSURE",
        guidance:
          "Prioritize fit-specific school camps and regional evaluation opportunities."
      };
    }

    if (primaryKey === "JUCO") {
      return {
        recommended_event_type: "DEVELOPMENTAL",
        guidance:
          "Prioritize development, verified metrics, and film-building events."
      };
    }

    return {
      recommended_event_type: "DEVELOPMENTAL",
      guidance:
        "Build foundational readiness before expensive exposure events."
    };
  }

  function calculatePathway(athlete, score, readiness, verification, evidence) {
    if (!athlete) {
      return {
        ok: false,
        status: "NO_ATHLETE",
        message: "No athlete supplied."
      };
    }

    const fitScore = calculateFitScore(
      score,
      readiness,
      verification,
      evidence,
      athlete
    );

    const primaryKey = choosePrimaryPathway(
      fitScore,
      score,
      readiness,
      verification
    );

    const primary = PATHWAY_LEVELS[primaryKey];

    const result = {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      athlete_id: athlete.athlete_id || null,
      snapshot_id: athlete.snapshot_id || null,

      primary_pathway: primaryKey,
      primary_pathway_label: primary.label,
      pathway_fit_score: fitScore,

      academic_fit_score: academicStatusScore(athlete),
      athletic_signal_score: score?.score_final || null,
      readiness_score: readiness?.readiness_score || null,
      confidence_score: verification?.confidence_score || null,
      evidence_score: evidence?.evidence_score || null,

      division_fit: {
        level: primaryKey,
        label: primary.label,
        description: primary.description,
        academic_requirement: primary.academic_requirement,
        sport_note: getSportPathwayNote(athlete, primaryKey)
      },

      alternate_pathways: generateAlternatePathways(primaryKey, fitScore),

      recommended_actions: generatePathwayActions(
        primaryKey,
        athlete,
        readiness
      ),

      camp_combine_guidance: generateCampCombineGuidance(primaryKey, athlete),

      explanation: {
        summary:
          `STATScore currently identifies ${primary.label} as the best-fit pathway based on athletic signal, readiness, verification confidence, evidence strength, and academic alignment.`,
        rule:
          "Pathway is determined by realistic success probability, not prestige preference.",
        limitation:
          "Pathway recommendation should update as verified metrics, film, academic status, and recruiter feedback improve."
      },

      created_at: new Date().toISOString()
    };

    return result;
  }

  function renderPathway(container, pathway) {
    if (!container || !pathway) return null;

    const color =
      pathway.primary_pathway === "D1"
        ? "#37d67a"
        : pathway.primary_pathway === "D2"
          ? "#9fe7ff"
          : pathway.primary_pathway === "D3"
            ? "#ffb100"
            : pathway.primary_pathway === "NAIA"
              ? "#d6deea"
              : pathway.primary_pathway === "JUCO"
                ? "#ff8c42"
                : "#ff3434";

    container.innerHTML = `
      <div style="
        border:1px solid ${color};
        background:rgba(255,255,255,.035);
        padding:18px;
        color:#f4f2ef;
        box-shadow:0 12px 28px rgba(0,0,0,.38);
      ">

        <div style="
          color:${color};
          font-weight:950;
          letter-spacing:.18em;
          text-transform:uppercase;
          font-size:12px;
        ">
          Pathway Intelligence
        </div>

        <div style="
          margin-top:10px;
          font-size:32px;
          font-weight:950;
          color:${color};
        ">
          ${pathway.primary_pathway_label}
        </div>

        <div style="
          margin-top:6px;
          color:#9fe7ff;
          font-size:13px;
          font-weight:900;
          letter-spacing:.12em;
          text-transform:uppercase;
        ">
          Fit Score ${pathway.pathway_fit_score}
        </div>

        <div style="
          margin-top:14px;
          color:#b9c4d6;
          font-size:12px;
          line-height:1.5;
        ">
          ${pathway.division_fit.sport_note}
        </div>

        <div style="
          margin-top:18px;
          display:grid;
          gap:10px;
        ">
          ${pathway.recommended_actions.slice(0, 4).map((item) => `
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
                color:#d6deea;
                font-size:12px;
                line-height:1.45;
              ">
                ${item.action}
              </div>
            </div>
          `).join("")}
        </div>

        <div style="
          margin-top:16px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:12px;
          color:#aab4c3;
          font-size:12px;
          line-height:1.45;
        ">
          ${pathway.camp_combine_guidance.guidance}
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

      footballScore:
        window.STATScoreCurrentFootballScore ||
        null,

      readiness:
        window.STATScoreCurrentReadiness ||
        null,

      verification:
        window.STATScoreCurrentVerification ||
        null,

      evidence:
        window.STATScoreCurrentEvidence ||
        null
    };
  }

  function runCurrentPathway() {
    const systems = resolveCurrentSystems();

    if (!systems.athlete) {
      warn("No current athlete found.");
      return null;
    }

    const pathway = calculatePathway(
      systems.athlete,
      systems.footballScore,
      systems.readiness,
      systems.verification,
      systems.evidence
    );

    window.STATScoreCurrentPathway = pathway;

    const panel =
      document.querySelector("[data-statscore-pathway-panel]") ||
      document.querySelector("#statscore-pathway-panel") ||
      document.querySelector("#scPathwayPanel");

    if (panel) {
      renderPathway(panel, pathway);
    }

    return pathway;
  }

  function init() {
    if (window.__STATSCORE_PATHWAY_INTELLIGENCE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_PATHWAY_INTELLIGENCE_ENGINE__ = true;

    window.STATScorePathwayIntelligenceEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      pathway_levels: PATHWAY_LEVELS,

      calculatePathway,
      renderPathway,
      runCurrentPathway
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.PathwayIntelligenceEngine =
      window.STATScorePathwayIntelligenceEngine;

    const result = runCurrentPathway();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        pathway_generated: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      pathway_generated: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
