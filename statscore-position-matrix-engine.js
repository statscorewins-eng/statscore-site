/* ============================================================
   STATScore™ Position Matrix Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Sport → Position → Archetype → Matrix → Performance Traits
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-position-matrix-engine";
  const VERSION = "v1.0-football-foundation";

  const FOOTBALL_MATRICES = {
    QB: {
      default_archetype: "PRO_STYLE_QB",
      archetypes: {
        PRO_STYLE_QB: {
          label: "Pro-Style QB",
          matrix_code: "QB_PRO_STYLE_MATRIX_V1",
          traits: [
            "Processing",
            "Decision Speed",
            "Arm Talent",
            "Ball Placement",
            "Pocket Presence",
            "Field Vision",
            "Pressure Response",
            "Leadership"
          ]
        },
        DUAL_THREAT_QB: {
          label: "Dual-Threat QB",
          matrix_code: "DUAL_THREAT_QB_MATRIX_V1",
          traits: [
            "Processing",
            "Decision Speed",
            "Ball Placement",
            "Arm Talent",
            "Field Vision",
            "Pocket Presence",
            "Escape Ability",
            "Designed Run Value",
            "Open-Field Threat",
            "Scramble-to-Throw Ability",
            "Ball Security",
            "Pressure Response"
          ]
        },
        POCKET_DISTRIBUTOR_QB: {
          label: "Pocket Distributor QB",
          matrix_code: "QB_POCKET_DISTRIBUTOR_MATRIX_V1",
          traits: [
            "Processing",
            "Timing",
            "Ball Placement",
            "Short-Intermediate Accuracy",
            "Pocket Discipline",
            "Progression Control",
            "Pre-Snap Recognition",
            "Leadership"
          ]
        },
        DEVELOPMENTAL_ATHLETE_QB: {
          label: "Developmental Athlete-QB",
          matrix_code: "QB_DEVELOPMENTAL_ATHLETE_MATRIX_V1",
          traits: [
            "Raw Athleticism",
            "Arm Strength",
            "Improvisation",
            "Processing Growth",
            "Mechanics Development",
            "Coachability",
            "Open-Field Threat",
            "Projection Upside"
          ]
        }
      }
    },

    WR: {
      default_archetype: "X_RECEIVER",
      archetypes: {
        X_RECEIVER: {
          label: "X Receiver",
          matrix_code: "WR_X_MATRIX_V1",
          traits: [
            "Release Package",
            "Separation",
            "Hands",
            "Ball Tracking",
            "Body Control",
            "Contested Catch",
            "Route IQ",
            "Boundary Awareness"
          ]
        },
        SLOT_RECEIVER: {
          label: "Slot Receiver",
          matrix_code: "WR_SLOT_MATRIX_V1",
          traits: [
            "Short-Area Quickness",
            "Route IQ",
            "Hands",
            "Zone Awareness",
            "YAC",
            "Change of Direction",
            "Contact Balance",
            "Third-Down Reliability"
          ]
        },
        DEEP_THREAT: {
          label: "Deep Threat",
          matrix_code: "WR_DEEP_THREAT_MATRIX_V1",
          traits: [
            "Top-End Speed",
            "Acceleration",
            "Ball Tracking",
            "Vertical Separation",
            "Release Timing",
            "Body Control",
            "Explosive Play Rate",
            "Field-Stretch Value"
          ]
        },
        POSSESSION_RECEIVER: {
          label: "Possession Receiver",
          matrix_code: "WR_POSSESSION_MATRIX_V1",
          traits: [
            "Hands",
            "Route Discipline",
            "Contested Catch",
            "Traffic Catching",
            "Body Positioning",
            "Reliability",
            "Awareness",
            "Chain-Moving Value"
          ]
        },
        YAC_CREATOR: {
          label: "YAC Creator",
          matrix_code: "WR_YAC_CREATOR_MATRIX_V1",
          traits: [
            "Open-Field Ability",
            "Contact Balance",
            "Burst",
            "Vision",
            "Short-Area Quickness",
            "Play Strength",
            "Creativity",
            "Explosive Extension"
          ]
        }
      }
    },

    RB: {
      default_archetype: "ALL_PURPOSE_BACK",
      archetypes: {
        POWER_BACK: {
          label: "Power Back",
          matrix_code: "RB_POWER_MATRIX_V1",
          traits: [
            "Contact Balance",
            "Pad Level",
            "Leg Drive",
            "Inside Vision",
            "Ball Security",
            "Short-Yardage Value",
            "Durability",
            "Finishing Power"
          ]
        },
        SLASHER: {
          label: "Slasher",
          matrix_code: "RB_SLASHER_MATRIX_V1",
          traits: [
            "Cut Speed",
            "Burst",
            "Vision",
            "Acceleration",
            "Open-Field Ability",
            "Change of Direction",
            "Crease Recognition",
            "Explosive Run Value"
          ]
        },
        THIRD_DOWN_BACK: {
          label: "Third-Down Back",
          matrix_code: "RB_THIRD_DOWN_MATRIX_V1",
          traits: [
            "Receiving Ability",
            "Pass Protection",
            "Route Feel",
            "Hands",
            "Space Awareness",
            "Blitz Recognition",
            "Ball Security",
            "Situational Value"
          ]
        },
        ALL_PURPOSE_BACK: {
          label: "All-Purpose Back",
          matrix_code: "RB_ALL_PURPOSE_MATRIX_V1",
          traits: [
            "Vision",
            "Burst",
            "Contact Balance",
            "Receiving Ability",
            "Ball Security",
            "Open-Field Ability",
            "Pass Protection",
            "Explosive Value"
          ]
        }
      }
    },

    DB: {
      default_archetype: "MAN_CORNER",
      archetypes: {
        MAN_CORNER: {
          label: "Man Corner",
          matrix_code: "DB_MAN_CORNER_MATRIX_V1",
          traits: [
            "Hip Fluidity",
            "Mirror Ability",
            "Press Coverage",
            "Recovery Speed",
            "Ball Skills",
            "Route Recognition",
            "Closing Burst",
            "Competitive Toughness"
          ]
        },
        ZONE_CORNER: {
          label: "Zone Corner",
          matrix_code: "DB_ZONE_CORNER_MATRIX_V1",
          traits: [
            "Zone IQ",
            "Route Pattern Recognition",
            "Eyes Discipline",
            "Break Timing",
            "Communication",
            "Ball Skills",
            "Angle Discipline",
            "Tackling"
          ]
        },
        NICKEL: {
          label: "Nickel",
          matrix_code: "DB_NICKEL_MATRIX_V1",
          traits: [
            "Short-Area Quickness",
            "Slot Coverage",
            "Run Support",
            "Blitz Timing",
            "Route Recognition",
            "Tackling",
            "Change of Direction",
            "Competitive Toughness"
          ]
        },
        SAFETY_HYBRID: {
          label: "Safety Hybrid",
          matrix_code: "DB_SAFETY_HYBRID_MATRIX_V1",
          traits: [
            "Range",
            "Run Support",
            "Coverage Flexibility",
            "Communication",
            "Tackling",
            "Ball Skills",
            "Angle Discipline",
            "Physicality"
          ]
        },
        BALL_HAWK_SAFETY: {
          label: "Ball-Hawk Safety",
          matrix_code: "DB_BALL_HAWK_MATRIX_V1",
          traits: [
            "Range",
            "Ball Tracking",
            "Route Anticipation",
            "Turnover Creation",
            "Instincts",
            "Zone IQ",
            "Break Timing",
            "Field Awareness"
          ]
        }
      }
    },

    LB: {
      default_archetype: "MIKE",
      archetypes: {
        MIKE: {
          label: "Mike Linebacker",
          matrix_code: "LB_MIKE_MATRIX_V1",
          traits: [
            "Run Fit IQ",
            "Communication",
            "Tackling",
            "Block Shedding",
            "Play Recognition",
            "Leadership",
            "Inside Range",
            "Gap Discipline"
          ]
        },
        WILL: {
          label: "Will Linebacker",
          matrix_code: "LB_WILL_MATRIX_V1",
          traits: [
            "Range",
            "Coverage Ability",
            "Pursuit",
            "Change of Direction",
            "Tackling",
            "Play Recognition",
            "Space Defense",
            "Closing Speed"
          ]
        },
        SAM: {
          label: "Sam Linebacker",
          matrix_code: "LB_SAM_MATRIX_V1",
          traits: [
            "Edge Setting",
            "Physicality",
            "Block Shedding",
            "Tackling",
            "Coverage Flexibility",
            "Run Support",
            "Strength",
            "Gap Control"
          ]
        },
        EDGE_HYBRID: {
          label: "Edge Hybrid",
          matrix_code: "LB_EDGE_HYBRID_MATRIX_V1",
          traits: [
            "Pass Rush Burst",
            "Edge Bend",
            "Run Contain",
            "Power",
            "Closing Speed",
            "Coverage Drop Ability",
            "Motor",
            "Disruption"
          ]
        },
        COVERAGE_LINEBACKER: {
          label: "Coverage Linebacker",
          matrix_code: "LB_COVERAGE_MATRIX_V1",
          traits: [
            "Zone Awareness",
            "Man Match Ability",
            "Change of Direction",
            "Route Recognition",
            "Space Range",
            "Ball Skills",
            "Communication",
            "Tackling"
          ]
        }
      }
    },

    OL: {
      default_archetype: "PASS_PROTECTOR",
      archetypes: {
        PASS_PROTECTOR: {
          label: "Pass Protector",
          matrix_code: "OL_PASS_PROTECTOR_MATRIX_V1",
          traits: [
            "Pass Set",
            "Footwork",
            "Anchor",
            "Hand Placement",
            "Recovery",
            "Balance",
            "Length Usage",
            "Processing"
          ]
        },
        RUN_MAULER: {
          label: "Run Mauler",
          matrix_code: "OL_RUN_MAULER_MATRIX_V1",
          traits: [
            "Drive Power",
            "Leverage",
            "Finish",
            "Grip Strength",
            "Run Fit Understanding",
            "Physicality",
            "Pad Level",
            "Sustain"
          ]
        },
        PULLING_GUARD: {
          label: "Pulling Guard",
          matrix_code: "OL_PULLING_GUARD_MATRIX_V1",
          traits: [
            "Movement Skill",
            "Targeting",
            "Balance",
            "Space Blocking",
            "Timing",
            "Power on Contact",
            "Agility",
            "Awareness"
          ]
        },
        CENTER_IQ_ANCHOR: {
          label: "Center/IQ Anchor",
          matrix_code: "OL_CENTER_IQ_MATRIX_V1",
          traits: [
            "Line Calls",
            "Snap Consistency",
            "Anchor",
            "Processing",
            "Communication",
            "Leverage",
            "Balance",
            "Interior Control"
          ]
        },
        DEVELOPMENTAL_TACKLE: {
          label: "Developmental Tackle",
          matrix_code: "OL_DEVELOPMENTAL_TACKLE_MATRIX_V1",
          traits: [
            "Frame",
            "Length",
            "Footwork Growth",
            "Anchor Development",
            "Hand Timing",
            "Coachability",
            "Projection Upside",
            "Strength Development"
          ]
        }
      }
    },

    DL: {
      default_archetype: "INTERIOR_DISRUPTOR",
      archetypes: {
        SPEED_RUSHER: {
          label: "Speed Rusher",
          matrix_code: "DL_SPEED_RUSHER_MATRIX_V1",
          traits: [
            "First Step",
            "Bend",
            "Hand Violence",
            "Closing Speed",
            "Rush Plan",
            "Edge Pressure",
            "Motor",
            "Disruption Rate"
          ]
        },
        POWER_RUSHER: {
          label: "Power Rusher",
          matrix_code: "DL_POWER_RUSHER_MATRIX_V1",
          traits: [
            "Bull Rush",
            "Leverage",
            "Hand Power",
            "Anchor Disruption",
            "Run Defense",
            "Physicality",
            "Finish",
            "Pocket Compression"
          ]
        },
        INTERIOR_DISRUPTOR: {
          label: "Interior Disruptor",
          matrix_code: "DL_INTERIOR_DISRUPTOR_MATRIX_V1",
          traits: [
            "Get-Off",
            "Gap Penetration",
            "Hand Usage",
            "Leverage",
            "Power",
            "Block Defeat",
            "Run Disruption",
            "Interior Pressure"
          ]
        },
        RUN_ANCHOR: {
          label: "Run Anchor",
          matrix_code: "DL_RUN_ANCHOR_MATRIX_V1",
          traits: [
            "Point-of-Attack Strength",
            "Gap Control",
            "Block Resistance",
            "Pad Level",
            "Tackling",
            "Physicality",
            "Run Fit Discipline",
            "Anchor"
          ]
        },
        HYBRID_EDGE: {
          label: "Hybrid Edge",
          matrix_code: "DL_HYBRID_EDGE_MATRIX_V1",
          traits: [
            "Edge Burst",
            "Run Contain",
            "Rush Flexibility",
            "Coverage Drop Potential",
            "Power",
            "Bend",
            "Motor",
            "Scheme Versatility"
          ]
        }
      }
    }
  };

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  }

  function normalizeSport(value) {
    const sport = normalize(value);
    if (sport === "FB") return "FOOTBALL";
    return sport || "FOOTBALL";
  }

  function normalizePosition(value) {
    const position = normalize(value);

    const aliases = {
      QUARTERBACK: "QB",
      WIDE_RECEIVER: "WR",
      RECEIVER: "WR",
      RUNNING_BACK: "RB",
      HALF_BACK: "RB",
      CORNER: "DB",
      CORNERBACK: "DB",
      SAFETY: "DB",
      DEFENSIVE_BACK: "DB",
      LINEBACKER: "LB",
      OFFENSIVE_LINE: "OL",
      OFFENSIVE_LINEMAN: "OL",
      TACKLE: "OL",
      GUARD: "OL",
      CENTER: "OL",
      DEFENSIVE_LINE: "DL",
      DEFENSIVE_LINEMAN: "DL",
      EDGE: "DL",
      DEFENSIVE_END: "DL",
      DEFENSIVE_TACKLE: "DL"
    };

    return aliases[position] || position || "ATH";
  }

  function inferArchetype(position, athlete) {
    const pos = normalizePosition(position);
    const raw =
      normalize(athlete?.archetype) ||
      normalize(athlete?.position_archetype) ||
      normalize(athlete?.player_archetype) ||
      normalize(athlete?.raw_payload?.archetype);

    if (raw) return raw;

    if (pos === "QB") {
      const notes = [
        athlete?.position_notes,
        athlete?.raw_payload?.notes,
        athlete?.raw_payload?.style,
        athlete?.raw_payload?.qb_style
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        notes.includes("dual") ||
        notes.includes("run") ||
        notes.includes("scramble") ||
        notes.includes("mobile")
      ) {
        return "DUAL_THREAT_QB";
      }

      return "PRO_STYLE_QB";
    }

    const sportMatrix = FOOTBALL_MATRICES[pos];
    return sportMatrix?.default_archetype || "GENERAL";
  }

  function getFootballMatrix(position, archetype, athlete) {
    const pos = normalizePosition(position);
    const positionGroup = FOOTBALL_MATRICES[pos];

    if (!positionGroup) {
      return fallbackMatrix("FOOTBALL", pos, archetype);
    }

    const inferred = normalize(archetype) || inferArchetype(pos, athlete);
    const selected =
      positionGroup.archetypes[inferred] ||
      positionGroup.archetypes[positionGroup.default_archetype];

    return {
      sport: "FOOTBALL",
      position: pos,
      archetype: selected.label,
      archetype_code: inferred,
      matrix_code: selected.matrix_code,
      traits: selected.traits.map((trait) => ({
        name: trait,
        status: "PENDING_VERIFICATION",
        value: null,
        evidence: []
      }))
    };
  }

  function fallbackMatrix(sport, position, archetype) {
    return {
      sport: sport || "UNKNOWN",
      position: position || "ATH",
      archetype: archetype || "General Athlete",
      archetype_code: normalize(archetype) || "GENERAL",
      matrix_code: `${position || "ATH"}_GENERAL_MATRIX_V1`,
      traits: [
        "Athleticism",
        "Skill",
        "Processing",
        "Production",
        "Coachability",
        "Readiness"
      ].map((trait) => ({
        name: trait,
        status: "PENDING_VERIFICATION",
        value: null,
        evidence: []
      }))
    };
  }

  function getMatrix(athlete) {
    const sport = normalizeSport(athlete?.primary_sport || athlete?.sport);
    const position = normalizePosition(
      athlete?.primary_position ||
      athlete?.position ||
      athlete?.verified_position
    );

    const archetype =
      athlete?.archetype ||
      athlete?.position_archetype ||
      athlete?.player_archetype ||
      athlete?.raw_payload?.archetype ||
      "";

    if (sport === "FOOTBALL") {
      return getFootballMatrix(position, archetype, athlete);
    }

    return fallbackMatrix(sport, position, archetype);
  }

  function renderTraits(container, matrix) {
    if (!container || !matrix) return;

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "sc-matrix-header";
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:18px;">
        <div>
          <div style="color:#ff3434;font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:13px;">
            Position Breakdown
          </div>
          <div style="font-size:34px;font-weight:900;text-transform:uppercase;letter-spacing:.03em;color:#f4f2ef;">
            Performance Traits
          </div>
          <div style="margin-top:8px;color:#9fe7ff;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">
            ${matrix.position} · ${matrix.archetype}
          </div>
        </div>

        <div style="border:1px solid rgba(255,177,0,.55);padding:12px 18px;color:#ffb100;font-weight:900;letter-spacing:.1em;">
          ${matrix.matrix_code}
        </div>
      </div>
    `;

    container.appendChild(header);

    matrix.traits.forEach((trait) => {
      const row = document.createElement("div");
      row.className = "sc-performance-trait-row";
      row.style.display = "grid";
      row.style.gridTemplateColumns = "180px 1fr 42px";
      row.style.alignItems = "center";
      row.style.gap = "14px";
      row.style.margin = "10px 0";

      row.innerHTML = `
        <div style="font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#f4f2ef;">
          ${trait.name}
        </div>

        <div style="height:8px;border:1px solid rgba(120,160,255,.28);background:rgba(255,255,255,.03);position:relative;">
          <div style="height:100%;width:${trait.value ? Math.max(0, Math.min(100, trait.value)) : 0}%;background:rgba(255,177,0,.85);"></div>
        </div>

        <div style="color:#ffb100;font-weight:900;text-align:right;">
          ${trait.value ?? "--"}
        </div>
      `;

      container.appendChild(row);
    });
  }

  function autoRenderFromWindowAthlete() {
    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null;

    if (!athlete) return null;

    const matrix = getMatrix(athlete);

    const container =
      document.querySelector("[data-statscore-performance-traits]") ||
      document.querySelector("#statscore-performance-traits") ||
      document.querySelector("#scPerformanceTraits");

    if (container) renderTraits(container, matrix);

    return matrix;
  }

  function init() {
    if (window.__STATSCORE_POSITION_MATRIX_ENGINE__) return;

    window.__STATSCORE_POSITION_MATRIX_ENGINE__ = true;

    window.STATScorePositionMatrixEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      matrices: {
        football: FOOTBALL_MATRICES
      },
      getMatrix,
      renderTraits,
      inferArchetype,
      normalizePosition
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.PositionMatrixEngine = window.STATScorePositionMatrixEngine;

    const matrix = autoRenderFromWindowAthlete();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        matrix_loaded: !!matrix
      });
    }

    console.log("[STATScore Position Matrix] Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      matrix_loaded: !!matrix
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
