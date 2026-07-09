/* ============================================================
   STATS-CORE™ BASEBALL POSITION MATRIX
   File: statscore-baseball-position-matrix.js
   Version: STATSCORE-BASEBALL-POSITION-MATRIX-V1

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Baseball → Position → Archetype → Matrix → Performance Traits

   Canon:
   Each sport has its own scoring science.
   Each position has its own matrix.
============================================================ */

(function(){
  "use strict";

  const ENGINE_ID = "statscore-baseball-position-matrix";
  const VERSION = "STATSCORE-BASEBALL-POSITION-MATRIX-V1";

  const BASEBALL_MATRICES = {
    P: {
      default_archetype: "COMMAND_PITCHER",
      archetypes: {
        POWER_PITCHER: {
          label: "Power Pitcher",
          matrix_code: "BB_P_POWER_PITCHER_MATRIX_V1",
          traits: [
            "Velocity",
            "Fastball Life",
            "Strike Throwing",
            "Secondary Stuff",
            "Command",
            "Mound Presence",
            "Durability",
            "Swing-and-Miss Ability"
          ]
        },
        COMMAND_PITCHER: {
          label: "Command Pitcher",
          matrix_code: "BB_P_COMMAND_MATRIX_V1",
          traits: [
            "Command",
            "Pitchability",
            "Strike Throwing",
            "Secondary Control",
            "Tempo",
            "Fielding Position",
            "Mound Presence",
            "Run Prevention"
          ]
        },
        BREAKING_BALL_SPECIALIST: {
          label: "Breaking Ball Specialist",
          matrix_code: "BB_P_BREAKING_BALL_MATRIX_V1",
          traits: [
            "Breaking Ball Quality",
            "Spin Profile",
            "Pitch Sequencing",
            "Command",
            "Swing-and-Miss Ability",
            "Deception",
            "Secondary Stuff",
            "Composure"
          ]
        }
      }
    },

    C: {
      default_archetype: "DEFENSIVE_CATCHER",
      archetypes: {
        DEFENSIVE_CATCHER: {
          label: "Defensive Catcher",
          matrix_code: "BB_C_DEFENSIVE_MATRIX_V1",
          traits: [
            "Receiving",
            "Blocking",
            "Throwing Arm",
            "Pop Time",
            "Game Management",
            "Pitcher Handling",
            "Leadership",
            "Durability"
          ]
        },
        OFFENSIVE_CATCHER: {
          label: "Offensive Catcher",
          matrix_code: "BB_C_OFFENSIVE_MATRIX_V1",
          traits: [
            "Hit Tool",
            "Power",
            "Plate Discipline",
            "Contact Quality",
            "Receiving",
            "Throwing Arm",
            "Game Management",
            "Durability"
          ]
        }
      }
    },

    INF: {
      default_archetype: "COMPLETE_INFIELDER",
      archetypes: {
        COMPLETE_INFIELDER: {
          label: "Complete Infielder",
          matrix_code: "BB_INF_COMPLETE_MATRIX_V1",
          traits: [
            "Hands",
            "Footwork",
            "Arm Strength",
            "Range",
            "Transfer",
            "Baseball IQ",
            "Contact Ability",
            "Defensive Reliability"
          ]
        },
        MIDDLE_INFIELDER: {
          label: "Middle Infielder",
          matrix_code: "BB_INF_MIDDLE_MATRIX_V1",
          traits: [
            "Range",
            "Hands",
            "Footwork",
            "Transfer",
            "Arm Accuracy",
            "Double-Play Ability",
            "Baseball IQ",
            "Contact Ability"
          ]
        },
        CORNER_INFIELDER: {
          label: "Corner Infielder",
          matrix_code: "BB_INF_CORNER_MATRIX_V1",
          traits: [
            "Reaction",
            "Arm Strength",
            "Hands",
            "Power",
            "Contact Quality",
            "Defensive Reliability",
            "Footwork",
            "Run Production"
          ]
        }
      }
    },

    OF: {
      default_archetype: "COMPLETE_OUTFIELDER",
      archetypes: {
        COMPLETE_OUTFIELDER: {
          label: "Complete Outfielder",
          matrix_code: "BB_OF_COMPLETE_MATRIX_V1",
          traits: [
            "Route Efficiency",
            "First Step",
            "Range",
            "Arm Strength",
            "Ball Tracking",
            "Speed",
            "Contact Ability",
            "Defensive Reliability"
          ]
        },
        CENTER_FIELDER: {
          label: "Center Fielder",
          matrix_code: "BB_OF_CENTER_FIELD_MATRIX_V1",
          traits: [
            "Range",
            "First Step",
            "Route Efficiency",
            "Speed",
            "Ball Tracking",
            "Communication",
            "Arm Accuracy",
            "Top-of-Order Value"
          ]
        },
        POWER_CORNER_OF: {
          label: "Power Corner Outfielder",
          matrix_code: "BB_OF_POWER_CORNER_MATRIX_V1",
          traits: [
            "Power",
            "Arm Strength",
            "Contact Quality",
            "Run Production",
            "Route Efficiency",
            "Ball Tracking",
            "Defensive Reliability",
            "Plate Discipline"
          ]
        }
      }
    },

    HITTER: {
      default_archetype: "COMPLETE_HITTER",
      archetypes: {
        COMPLETE_HITTER: {
          label: "Complete Hitter",
          matrix_code: "BB_HITTER_COMPLETE_MATRIX_V1",
          traits: [
            "Hit Tool",
            "Power",
            "Plate Discipline",
            "Contact Quality",
            "Approach",
            "Situational Hitting",
            "Run Production",
            "Consistency"
          ]
        },
        CONTACT_HITTER: {
          label: "Contact Hitter",
          matrix_code: "BB_HITTER_CONTACT_MATRIX_V1",
          traits: [
            "Contact Ability",
            "Bat-to-Ball Skill",
            "Plate Discipline",
            "Approach",
            "Situational Hitting",
            "Speed",
            "Consistency",
            "On-Base Value"
          ]
        },
        POWER_HITTER: {
          label: "Power Hitter",
          matrix_code: "BB_HITTER_POWER_MATRIX_V1",
          traits: [
            "Power",
            "Exit Velocity",
            "Launch Profile",
            "Contact Quality",
            "Run Production",
            "Plate Discipline",
            "Pitch Recognition",
            "Damage Potential"
          ]
        }
      }
    },

    UTIL: {
      default_archetype: "UTILITY_PLAYER",
      archetypes: {
        UTILITY_PLAYER: {
          label: "Utility Player",
          matrix_code: "BB_UTIL_MATRIX_V1",
          traits: [
            "Versatility",
            "Baseball IQ",
            "Defensive Reliability",
            "Contact Ability",
            "Athleticism",
            "Arm Utility",
            "Speed",
            "Role Adaptability"
          ]
        }
      }
    }
  };

  function normalize(value){
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  }

  function normalizeSport(value){
    const sport = normalize(value);

    const aliases = {
      BASEBALL: "BASEBALL",
      BASE_BALL: "BASEBALL",
      BB: "BASEBALL"
    };

    return aliases[sport] || sport || "BASEBALL";
  }

  function normalizePosition(value){
    const position = normalize(value);

    const aliases = {
      PITCHER: "P",
      P: "P",

      CATCHER: "C",
      C: "C",

      FIRST_BASE: "INF",
      FIRST_BASEMAN: "INF",
      SECOND_BASE: "INF",
      SECOND_BASEMAN: "INF",
      THIRD_BASE: "INF",
      THIRD_BASEMAN: "INF",
      SHORTSTOP: "INF",
      SS: "INF",
      INFIELDER: "INF",
      INFIELD: "INF",
      INF: "INF",

      LEFT_FIELD: "OF",
      CENTER_FIELD: "OF",
      RIGHT_FIELD: "OF",
      OUTFIELDER: "OF",
      OUTFIELD: "OF",
      OF: "OF",

      DESIGNATED_HITTER: "HITTER",
      DH: "HITTER",
      HITTER: "HITTER",

      UTILITY: "UTIL",
      UTIL: "UTIL"
    };

    return aliases[position] || position || "UTIL";
  }

  function inferArchetype(position, athlete){
    const pos = normalizePosition(position);

    const raw =
      normalize(athlete?.archetype) ||
      normalize(athlete?.position_archetype) ||
      normalize(athlete?.player_archetype) ||
      normalize(athlete?.raw_payload?.archetype);

    if(raw) return raw;

    const notes = [
      athlete?.position_notes,
      athlete?.raw_payload?.notes,
      athlete?.raw_payload?.style,
      athlete?.raw_payload?.strengths
    ].filter(Boolean).join(" ").toLowerCase();

    if(pos === "P"){
      if(notes.includes("velocity") || notes.includes("power")) return "POWER_PITCHER";
      if(notes.includes("breaking") || notes.includes("spin")) return "BREAKING_BALL_SPECIALIST";
      return "COMMAND_PITCHER";
    }

    if(pos === "C"){
      if(notes.includes("bat") || notes.includes("power") || notes.includes("offense")) return "OFFENSIVE_CATCHER";
      return "DEFENSIVE_CATCHER";
    }

    if(pos === "INF"){
      if(notes.includes("middle") || notes.includes("shortstop") || notes.includes("second")) return "MIDDLE_INFIELDER";
      if(notes.includes("corner") || notes.includes("third") || notes.includes("first")) return "CORNER_INFIELDER";
      return "COMPLETE_INFIELDER";
    }

    if(pos === "OF"){
      if(notes.includes("center")) return "CENTER_FIELDER";
      if(notes.includes("power") || notes.includes("corner")) return "POWER_CORNER_OF";
      return "COMPLETE_OUTFIELDER";
    }

    if(pos === "HITTER"){
      if(notes.includes("contact")) return "CONTACT_HITTER";
      if(notes.includes("power")) return "POWER_HITTER";
      return "COMPLETE_HITTER";
    }

    return BASEBALL_MATRICES[pos]?.default_archetype || "UTILITY_PLAYER";
  }

  function fallbackMatrix(sport, position, archetype){
    return {
      sport: sport || "BASEBALL",
      position: position || "UTIL",
      archetype: archetype || "General Baseball Athlete",
      archetype_code: normalize(archetype) || "GENERAL",
      matrix_code: `${position || "UTIL"}_BASEBALL_GENERAL_MATRIX_V1`,
      traits: [
        "Athleticism",
        "Baseball IQ",
        "Skill",
        "Production",
        "Defense",
        "Readiness"
      ].map(trait => ({
        name: trait,
        status: "PENDING_VERIFICATION",
        value: null,
        evidence: []
      }))
    };
  }

  function getBaseballMatrix(position, archetype, athlete){
    const pos = normalizePosition(position);
    const positionGroup = BASEBALL_MATRICES[pos];

    if(!positionGroup){
      return fallbackMatrix("BASEBALL", pos, archetype);
    }

    const inferred = normalize(archetype) || inferArchetype(pos, athlete);

    const selected =
      positionGroup.archetypes[inferred] ||
      positionGroup.archetypes[positionGroup.default_archetype];

    return {
      sport: "BASEBALL",
      position: pos,
      archetype: selected.label,
      archetype_code: inferred,
      matrix_code: selected.matrix_code,
      traits: selected.traits.map(trait => ({
        name: trait,
        status: "PENDING_VERIFICATION",
        value: null,
        evidence: []
      }))
    };
  }

  function getMatrix(athlete = {}){
    const sport = normalizeSport(
      athlete.primary_sport ||
      athlete.sport ||
      athlete.raw_payload?.primarySport ||
      athlete.raw_payload?.sport
    );

    const position = normalizePosition(
      athlete.primary_position ||
      athlete.position ||
      athlete.verified_position ||
      athlete.raw_payload?.primaryPosition ||
      athlete.raw_payload?.position
    );

    const archetype =
      athlete.archetype ||
      athlete.position_archetype ||
      athlete.player_archetype ||
      athlete.raw_payload?.archetype ||
      "";

    if(sport === "BASEBALL"){
      return getBaseballMatrix(position, archetype, athlete);
    }

    return fallbackMatrix(sport, position, archetype);
  }

  function renderTraits(container, matrix){
    if(!container || !matrix) return;

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "sc-baseball-matrix-header";
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:18px;">
        <div>
          <div style="color:#ff3434;font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:13px;">
            Baseball Position Breakdown
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

    matrix.traits.forEach(trait => {
      const value = Number(trait.value || 0);

      const row = document.createElement("div");
      row.className = "sc-performance-trait-row";
      row.style.display = "grid";
      row.style.gridTemplateColumns = "220px 1fr 42px";
      row.style.alignItems = "center";
      row.style.gap = "14px";
      row.style.margin = "10px 0";

      row.innerHTML = `
        <div style="font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#f4f2ef;">
          ${trait.name}
        </div>

        <div style="height:8px;border:1px solid rgba(120,160,255,.28);background:rgba(255,255,255,.03);position:relative;">
          <div style="height:100%;width:${value ? Math.max(0, Math.min(100, value)) : 0}%;background:rgba(255,177,0,.85);"></div>
        </div>

        <div style="color:#ffb100;font-weight:900;text-align:right;">
          ${trait.value ?? "--"}
        </div>
      `;

      container.appendChild(row);
    });
  }

  function autoRenderFromWindowAthlete(){
    const athlete =
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null;

    if(!athlete) return null;

    const sport = normalizeSport(
      athlete.primary_sport ||
      athlete.sport ||
      athlete.raw_payload?.primarySport ||
      athlete.raw_payload?.sport
    );

    if(sport !== "BASEBALL") return null;

    const matrix = getMatrix(athlete);

    const container =
      document.querySelector("[data-statscore-performance-traits]") ||
      document.querySelector("#statscore-performance-traits") ||
      document.querySelector("#scPerformanceTraits") ||
      document.querySelector(".sc-performance-traits");

    if(container) renderTraits(container, matrix);

    return matrix;
  }

  function init(){
    if(window.__STATSCORE_BASEBALL_POSITION_MATRIX__) return;

    window.__STATSCORE_BASEBALL_POSITION_MATRIX__ = true;

    window.STATScoreBaseballPositionMatrix = {
      engine_id: ENGINE_ID,
      version: VERSION,
      matrices: BASEBALL_MATRICES,

      normalize,
      normalizeSport,
      normalizePosition,
      inferArchetype,
      getMatrix,
      getBaseballMatrix,
      renderTraits
    };

    window.STATScore = window.STATScore || {};
    window.STATScore.BaseballPositionMatrix = window.STATScoreBaseballPositionMatrix;

    const matrix = autoRenderFromWindowAthlete();

    if(window.STATScoreEngineBus?.emit){
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        matrix_loaded: Boolean(matrix)
      });
    }

    console.info("[STATS-CORE] Baseball Position Matrix loaded:", VERSION);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})(); 
