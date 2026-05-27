/* ============================================================
   STATScore™ Readiness Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Athlete Intelligence → Development Priorities → Readiness Path
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-readiness-engine";
  const VERSION = "v1.0-development-pathways";

  const READINESS_LEVELS = {
    ELITE_READY: {
      label: "Elite Ready",
      color: "#37d67a",
      priority: 1
    },
    COLLEGE_READY: {
      label: "College Ready",
      color: "#9fe7ff",
      priority: 2
    },
    DEVELOPING: {
      label: "Developing",
      color: "#ffb100",
      priority: 3
    },
    FOUNDATIONAL: {
      label: "Foundational",
      color: "#ff3434",
      priority: 4
    }
  };

  const DEVELOPMENT_LIBRARY = {
    QB: {
      Processing: {
        category: "Film + Decision Development",
        drills: [
          "Coverage recognition sessions",
          "Pressure identification walkthroughs",
          "Progression sequencing drills"
        ],
        recommendation:
          "Increase defensive recognition speed and progression consistency."
      },

      "Decision Speed": {
        category: "Reaction Processing",
        drills: [
          "Rapid progression drills",
          "Timed throw windows",
          "Pressure-trigger reads"
        ],
        recommendation:
          "Improve trigger speed while maintaining decision quality."
      },

      "Ball Placement": {
        category: "Throw Accuracy",
        drills: [
          "Intermediate route accuracy",
          "Layered touch throws",
          "Boundary placement sessions"
        ],
        recommendation:
          "Increase consistent placement under movement and pressure."
      },

      "Pocket Presence": {
        category: "Pocket Mechanics",
        drills: [
          "Pocket climb drills",
          "Pressure reset movement",
          "Internal clock development"
        ],
        recommendation:
          "Improve movement discipline inside collapsing pocket structure."
      },

      "Escape Ability": {
        category: "Mobility Development",
        drills: [
          "Scramble extension work",
          "Off-platform movement",
          "Contain escape mechanics"
        ],
        recommendation:
          "Develop controlled mobility without abandoning progression reads."
      },

      "Open-Field Threat": {
        category: "Explosive Play Development",
        drills: [
          "Acceleration work",
          "Open-field angle training",
          "Burst transition drills"
        ],
        recommendation:
          "Improve explosive threat once outside pocket structure."
      }
    },

    WR: {
      Separation: {
        category: "Route Separation",
        drills: [
          "Release package work",
          "Top-of-route transitions",
          "Leverage manipulation"
        ],
        recommendation:
          "Increase separation consistency against press and off coverage."
      },

      Hands: {
        category: "Catch Reliability",
        drills: [
          "Traffic catches",
          "Late hands training",
          "High-point control"
        ],
        recommendation:
          "Improve catch consistency through contact and contested situations."
      },

      "Route IQ": {
        category: "Route Intelligence",
        drills: [
          "Coverage recognition",
          "Option route timing",
          "Spacing discipline"
        ],
        recommendation:
          "Improve understanding of leverage, spacing, and timing."
      },

      "Open-Field Ability": {
        category: "YAC Development",
        drills: [
          "Open-field cuts",
          "Acceleration transitions",
          "Contact balance work"
        ],
        recommendation:
          "Increase yards-after-catch creation potential."
      }
    },

    RB: {
      Vision: {
        category: "Run Vision",
        drills: [
          "Gap recognition",
          "Patience pacing",
          "Second-level anticipation"
        ],
        recommendation:
          "Improve lane recognition and timing through traffic."
      },

      Burst: {
        category: "Explosive Acceleration",
        drills: [
          "First-step acceleration",
          "Short-area burst",
          "Reaction starts"
        ],
        recommendation:
          "Increase explosive acceleration through transition points."
      },

      "Contact Balance": {
        category: "Balance Through Contact",
        drills: [
          "Balance resistance work",
          "Low-pad finish drills",
          "Core stability work"
        ],
        recommendation:
          "Improve ability to stay productive through contact."
      },

      "Ball Security": {
        category: "Possession Control",
        drills: [
          "High-and-tight carry drills",
          "Traffic carry work",
          "Strip-reaction training"
        ],
        recommendation:
          "Reduce turnover risk through improved carry discipline."
      }
    },

    DB: {
      "Hip Fluidity": {
        category: "Coverage Mobility",
        drills: [
          "Hip transition work",
          "Mirror movement drills",
          "Recovery flips"
        ],
        recommendation:
          "Improve transition smoothness and recovery movement."
      },

      "Ball Skills": {
        category: "Turnover Creation",
        drills: [
          "Ball tracking",
          "Late hands reaction",
          "High-point interception drills"
        ],
        recommendation:
          "Increase ability to locate and attack football in coverage."
      },

      "Press Coverage": {
        category: "Press Technique",
        drills: [
          "Jam timing",
          "Hand placement",
          "Leverage control"
        ],
        recommendation:
          "Improve control and disruption at line of scrimmage."
      },

      Reaction: {
        category: "Reaction Processing",
        drills: [
          "Break reaction drills",
          "Route anticipation",
          "Pattern recognition"
        ],
        recommendation:
          "Improve reaction timing against route development."
      }
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Readiness] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Readiness] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase();
  }

  function clamp(value, min = 0, max = 100) {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, n));
  }

  function readinessBand(score) {
    const s = clamp(score);

    if (s === null) return "FOUNDATIONAL";
    if (s >= 88) return "ELITE_READY";
    if (s >= 74) return "COLLEGE_READY";
    if (s >= 62) return "DEVELOPING";

    return "FOUNDATIONAL";
  }

  function determineWeakestTraits(traits) {
    if (!Array.isArray(traits)) return [];

    return traits
      .filter((trait) => typeof trait.value === "number")
      .sort((a, b) => a.value - b.value)
      .slice(0, 3);
  }

  function determineStrongestTraits(traits) {
    if (!Array.isArray(traits)) return [];

    return traits
      .filter((trait) => typeof trait.value === "number")
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }

  function generateDevelopmentPlan(position, weakTraits) {
    const pos = upper(position);
    const library = DEVELOPMENT_LIBRARY[pos] || {};

    return weakTraits.map((trait) => {
      const lookup =
        library[trait.name] ||
        library[normalize(trait.name)] ||
        null;

      if (!lookup) {
        return {
          trait: trait.name,
          current_score: trait.value,
          category: "General Athletic Development",
          recommendation:
            "Continue position-specific development and verified training progression.",
          drills: [
            "Position-specific technical refinement",
            "Film review",
            "Explosive movement training"
          ]
        };
      }

      return {
        trait: trait.name,
        current_score: trait.value,
        category: lookup.category,
        recommendation: lookup.recommendation,
        drills: lookup.drills
      };
    });
  }

  function calculateReadiness(scoreResult, verification, evidence) {
    if (!scoreResult || !scoreResult.ok) {
      return {
        ok: false,
        readiness_level: "FOUNDATIONAL",
        message: "Scoring result unavailable."
      };
    }

    const score = scoreResult.score_final || 0;
    const bandKey = readinessBand(score);
    const band = READINESS_LEVELS[bandKey];

    let readinessScore = score;

    if (verification?.confidence_score) {
      readinessScore += verification.confidence_score * 0.12;
    }

    if (evidence?.evidence_score) {
      readinessScore += evidence.evidence_score * 0.08;
    }

    readinessScore = clamp(Math.round(readinessScore));

    const weakTraits = determineWeakestTraits(scoreResult.traits);
    const strongTraits = determineStrongestTraits(scoreResult.traits);

    const developmentPlan = generateDevelopmentPlan(
      scoreResult.position,
      weakTraits
    );

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      athlete_id: scoreResult.athlete_id || null,
      snapshot_id: scoreResult.snapshot_id || null,

      readiness_level: bandKey,
      readiness_label: band.label,
      readiness_color: band.color,

      readiness_score: readinessScore,

      development_priority_count: developmentPlan.length,

      strongest_traits: strongTraits,
      weakest_traits: weakTraits,

      development_plan: developmentPlan,

      trajectory: {
        current_status: band.label,
        projection:
          readinessScore >= 82
            ? "High-level collegiate projection"
            : readinessScore >= 70
              ? "Developing collegiate projection"
              : "Development required before collegiate readiness",

        next_phase:
          readinessScore >= 82
            ? "Verification and exposure optimization"
            : readinessScore >= 70
              ? "Targeted trait development"
              : "Foundational trait and athletic development"
      },

      explanation: {
        summary:
          `Readiness evaluated as ${band.label} based on scoring, verification confidence, evidence strength, and developmental trait analysis.`,

        strengths:
          strongTraits.map((trait) => trait.name),

        development_focus:
          weakTraits.map((trait) => trait.name),

        rule:
          "Readiness is determined by athletic intelligence, evidence quality, verification confidence, and developmental progression requirements."
      },

      created_at: new Date().toISOString()
    };
  }

  function renderReadiness(container, readiness) {
    if (!container || !readiness) return null;

    container.innerHTML = `
      <div style="
        border:1px solid ${readiness.readiness_color};
        background:rgba(255,255,255,.035);
        padding:18px;
        color:#f4f2ef;
        box-shadow:0 12px 28px rgba(0,0,0,.38);
      ">

        <div style="
          color:${readiness.readiness_color};
          font-weight:950;
          letter-spacing:.18em;
          text-transform:uppercase;
          font-size:12px;
        ">
          Athlete Readiness
        </div>

        <div style="
          margin-top:10px;
          font-size:34px;
          font-weight:950;
          color:${readiness.readiness_color};
        ">
          ${readiness.readiness_score}
        </div>

        <div style="
          margin-top:6px;
          color:#9fe7ff;
          font-size:13px;
          font-weight:900;
          letter-spacing:.12em;
          text-transform:uppercase;
        ">
          ${readiness.readiness_label}
        </div>

        <div style="
          margin-top:16px;
          display:grid;
          gap:12px;
        ">

          ${readiness.development_plan.map((item, index) => `
            <div style="
              border:1px solid rgba(255,255,255,.12);
              background:rgba(0,0,0,.22);
              padding:14px;
            ">

              <div style="
                color:#ff3434;
                font-weight:950;
                letter-spacing:.12em;
                text-transform:uppercase;
                font-size:11px;
              ">
                Development Priority ${index + 1}
              </div>

              <div style="
                margin-top:6px;
                color:#f4f2ef;
                font-size:18px;
                font-weight:900;
              ">
                ${item.trait}
              </div>

              <div style="
                margin-top:6px;
                color:#9fe7ff;
                font-size:11px;
                letter-spacing:.08em;
                text-transform:uppercase;
              ">
                ${item.category}
              </div>

              <div style="
                margin-top:10px;
                color:#b9c4d6;
                font-size:12px;
                line-height:1.5;
              ">
                ${item.recommendation}
              </div>

              <div style="
                margin-top:12px;
                display:grid;
                gap:6px;
              ">
                ${item.drills.map(drill => `
                  <div style="
                    border-left:2px solid #ffb100;
                    padding-left:10px;
                    color:#d6deea;
                    font-size:11px;
                  ">
                    ${drill}
                  </div>
                `).join("")}
              </div>

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

      footballScore:
        window.STATScoreCurrentFootballScore ||
        null,

      verification:
        window.STATScoreCurrentVerification ||
        null,

      evidence:
        window.STATScoreCurrentEvidence ||
        null
    };
  }

  function runCurrentReadiness() {
    const systems = resolveCurrentSystems();

    if (!systems.footballScore) {
      warn("Football scoring unavailable.");
      return null;
    }

    const readiness = calculateReadiness(
      systems.footballScore,
      systems.verification,
      systems.evidence
    );

    window.STATScoreCurrentReadiness = readiness;

    const panel =
      document.querySelector("[data-statscore-readiness-panel]") ||
      document.querySelector("#statscore-readiness-panel") ||
      document.querySelector("#scReadinessPanel");

    if (panel) {
      renderReadiness(panel, readiness);
    }

    return readiness;
  }

  function init() {
    if (window.__STATSCORE_READINESS_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_READINESS_ENGINE__ = true;

    window.STATScoreReadinessEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      readiness_levels: READINESS_LEVELS,
      development_library: DEVELOPMENT_LIBRARY,

      calculateReadiness,
      renderReadiness,
      runCurrentReadiness
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.ReadinessEngine =
      window.STATScoreReadinessEngine;

    const result = runCurrentReadiness();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        readiness_generated: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      readiness_generated: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
