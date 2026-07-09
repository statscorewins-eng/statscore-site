/* ============================================================
   STATS-CORE™ BASKETBALL POSITION MATRIX
   File: statscore-basketball-position-matrix.js
   Version: STATSCORE-BASKETBALL-POSITION-MATRIX-V1

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Basketball → Position → Archetype → Matrix → Performance Traits

   Canon:
   Each sport has its own scoring science.
   Each position has its own matrix.
============================================================ */

(function(){
  "use strict";

  const ENGINE_ID = "statscore-basketball-position-matrix";
  const VERSION = "STATSCORE-BASKETBALL-POSITION-MATRIX-V1";

  const BASKETBALL_MATRICES = {
    PG: {
      default_archetype: "FLOOR_GENERAL",
      archetypes: {
        FLOOR_GENERAL: {
          label: "Floor General",
          matrix_code: "BB_PG_FLOOR_GENERAL_MATRIX_V1",
          traits: [
            "Court Vision",
            "Ball Handling",
            "Decision Making",
            "Pick-and-Roll IQ",
            "Passing",
            "Leadership",
            "Pace Control",
            "Defensive Pressure"
          ]
        },
        SCORING_POINT_GUARD: {
          label: "Scoring Point Guard",
          matrix_code: "BB_PG_SCORING_MATRIX_V1",
          traits: [
            "Shot Creation",
            "Ball Handling",
            "Three-Level Scoring",
            "Burst",
            "Finishing",
            "Pull-Up Shooting",
            "Pace Change",
            "Defensive Pressure"
          ]
        },
        DEFENSIVE_POINT_GUARD: {
          label: "Defensive Point Guard",
          matrix_code: "BB_PG_DEFENSIVE_MATRIX_V1",
          traits: [
            "On-Ball Defense",
            "Defensive Pressure",
            "Lateral Quickness",
            "Ball Disruption",
            "Communication",
            "Transition Control",
            "Decision Making",
            "Leadership"
          ]
        }
      }
    },

    SG: {
      default_archetype: "SHOT_CREATOR",
      archetypes: {
        SHOT_CREATOR: {
          label: "Shot Creator",
          matrix_code: "BB_SG_SHOT_CREATOR_MATRIX_V1",
          traits: [
            "Shot Creation",
            "Perimeter Shooting",
            "Off-Ball Movement",
            "Scoring Efficiency",
            "Ball Handling",
            "Defensive Versatility",
            "Transition",
            "Clutch Scoring"
          ]
        },
        THREE_AND_D: {
          label: "Three-and-D Guard",
          matrix_code: "BB_SG_THREE_AND_D_MATRIX_V1",
          traits: [
            "Perimeter Shooting",
            "Catch-and-Shoot",
            "Defensive Versatility",
            "On-Ball Defense",
            "Off-Ball Awareness",
            "Transition",
            "Shot Discipline",
            "Team Fit"
          ]
        },
        SLASHING_GUARD: {
          label: "Slashing Guard",
          matrix_code: "BB_SG_SLASHING_MATRIX_V1",
          traits: [
            "First Step",
            "Finishing",
            "Contact Balance",
            "Transition",
            "Rim Pressure",
            "Ball Handling",
            "Free Throw Pressure",
            "Defensive Activity"
          ]
        }
      }
    },

    SF: {
      default_archetype: "TWO_WAY_WING",
      archetypes: {
        TWO_WAY_WING: {
          label: "Two-Way Wing",
          matrix_code: "BB_SF_TWO_WAY_WING_MATRIX_V1",
          traits: [
            "Athleticism",
            "Two-Way Value",
            "Finishing",
            "Defensive Switchability",
            "Rebounding",
            "Shot Creation",
            "Basketball IQ",
            "Versatility"
          ]
        },
        SCORING_WING: {
          label: "Scoring Wing",
          matrix_code: "BB_SF_SCORING_WING_MATRIX_V1",
          traits: [
            "Shot Creation",
            "Three-Level Scoring",
            "Perimeter Shooting",
            "Finishing",
            "Off-Ball Movement",
            "Transition",
            "Mismatch Value",
            "Scoring Efficiency"
          ]
        },
        DEFENSIVE_WING: {
          label: "Defensive Wing",
          matrix_code: "BB_SF_DEFENSIVE_WING_MATRIX_V1",
          traits: [
            "Defensive Switchability",
            "Length Usage",
            "On-Ball Defense",
            "Help Defense",
            "Rebounding",
            "Transition Defense",
            "Physicality",
            "Basketball IQ"
          ]
        }
      }
    },

    PF: {
      default_archetype: "MODERN_FORWARD",
      archetypes: {
        MODERN_FORWARD: {
          label: "Modern Forward",
          matrix_code: "BB_PF_MODERN_FORWARD_MATRIX_V1",
          traits: [
            "Interior Scoring",
            "Midrange",
            "Physicality",
            "Rebounding",
            "Screen Setting",
            "Defensive Presence",
            "Motor",
            "Post Play"
          ]
        },
        STRETCH_FOUR: {
          label: "Stretch Four",
          matrix_code: "BB_PF_STRETCH_FOUR_MATRIX_V1",
          traits: [
            "Perimeter Shooting",
            "Pick-and-Pop Value",
            "Spacing",
            "Rebounding",
            "Defensive Presence",
            "Passing",
            "Screen Setting",
            "Basketball IQ"
          ]
        },
        ENERGY_FORWARD: {
          label: "Energy Forward",
          matrix_code: "BB_PF_ENERGY_FORWARD_MATRIX_V1",
          traits: [
            "Motor",
            "Rebounding",
            "Physicality",
            "Screen Setting",
            "Interior Defense",
            "Transition",
            "Finishing",
            "Second-Chance Value"
          ]
        }
      }
    },

    C: {
      default_archetype: "RIM_PROTECTOR",
      archetypes: {
        RIM_PROTECTOR: {
          label: "Rim Protector",
          matrix_code: "BB_C_RIM_PROTECTOR_MATRIX_V1",
          traits: [
            "Rim Protection",
            "Interior Defense",
            "Rebounding",
            "Post Scoring",
            "Hands",
            "Physical Presence",
            "Pick-and-Roll Defense",
            "Shot Blocking"
          ]
        },
        POST_SCORER: {
          label: "Post Scorer",
          matrix_code: "BB_C_POST_SCORER_MATRIX_V1",
          traits: [
            "Post Scoring",
            "Footwork",
            "Hands",
            "Interior Touch",
            "Physical Presence",
            "Rebounding",
            "Passing",
            "Screen Setting"
          ]
        },
        MOBILE_BIG: {
          label: "Mobile Big",
          matrix_code: "BB_C_MOBILE_BIG_MATRIX_V1",
          traits: [
            "Mobility",
            "Pick-and-Roll Defense",
            "Rim Running",
            "Rebounding",
            "Finishing",
            "Shot Blocking",
            "Defensive Range",
            "Motor"
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
      BB: "BASKETBALL",
      HOOPS: "BASKETBALL",
      BASKETBALL: "BASKETBALL"
    };

    return aliases[sport] || sport || "BASKETBALL";
  }

  function normalizePosition(value){
    const position = normalize(value);

    const aliases = {
      POINT_GUARD: "PG",
      PG: "PG",

      SHOOTING_GUARD: "SG",
      TWO_GUARD: "SG",
      COMBO_GUARD: "SG",
      SG: "SG",

      SMALL_FORWARD: "SF",
      WING: "SF",
      SF: "SF",

      POWER_FORWARD: "PF",
      FORWARD: "PF",
      PF: "PF",

      CENTER: "C",
      BIG: "C",
      POST: "C",
      C: "C"
    };

    return aliases[position] || position || "PG";
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

    if(pos === "PG"){
      if(notes.includes("score") || notes.includes("scoring")) return "SCORING_POINT_GUARD";
      if(notes.includes("defense") || notes.includes("defensive")) return "DEFENSIVE_POINT_GUARD";
      return "FLOOR_GENERAL";
    }

    if(pos === "SG"){
      if(notes.includes("3") || notes.includes("three") || notes.includes("defense")) return "THREE_AND_D";
      if(notes.includes("slash") || notes.includes("rim")) return "SLASHING_GUARD";
      return "SHOT_CREATOR";
    }

    if(pos === "SF"){
      if(notes.includes("score") || notes.includes("scoring")) return "SCORING_WING";
      if(notes.includes("defense") || notes.includes("defensive")) return "DEFENSIVE_WING";
      return "TWO_WAY_WING";
    }

    if(pos === "PF"){
      if(notes.includes("shoot") || notes.includes("stretch")) return "STRETCH_FOUR";
      if(notes.includes("energy") || notes.includes("motor")) return "ENERGY_FORWARD";
      return "MODERN_FORWARD";
    }

    if(pos === "C"){
      if(notes.includes("post")) return "POST_SCORER";
      if(notes.includes("mobile") || notes.includes("run")) return "MOBILE_BIG";
      return "RIM_PROTECTOR";
    }

    return BASKETBALL_MATRICES[pos]?.default_archetype || "GENERAL";
  }

  function fallbackMatrix(sport, position, archetype){
    return {
      sport: sport || "BASKETBALL",
      position: position || "ATH",
      archetype: archetype || "General Basketball Athlete",
      archetype_code: normalize(archetype) || "GENERAL",
      matrix_code: `${position || "ATH"}_BASKETBALL_GENERAL_MATRIX_V1`,
      traits: [
        "Athleticism",
        "Skill",
        "Basketball IQ",
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

  function getBasketballMatrix(position, archetype, athlete){
    const pos = normalizePosition(position);
    const positionGroup = BASKETBALL_MATRICES[pos];

    if(!positionGroup){
      return fallbackMatrix("BASKETBALL", pos, archetype);
    }

    const inferred = normalize(archetype) || inferArchetype(pos, athlete);

    const selected =
      positionGroup.archetypes[inferred] ||
      positionGroup.archetypes[positionGroup.default_archetype];

    return {
      sport: "BASKETBALL",
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

    if(sport === "BASKETBALL"){
      return getBasketballMatrix(position, archetype, athlete);
    }

    return fallbackMatrix(sport, position, archetype);
  }

  function renderTraits(container, matrix){
    if(!container || !matrix) return;

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "sc-basketball-matrix-header";
    header.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:18px;">
        <div>
          <div style="color:#ff3434;font-weight:900;letter-spacing:.18em;text-transform:uppercase;font-size:13px;">
            Basketball Position Breakdown
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

    if(sport !== "BASKETBALL") return null;

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
    if(window.__STATSCORE_BASKETBALL_POSITION_MATRIX__) return;

    window.__STATSCORE_BASKETBALL_POSITION_MATRIX__ = true;

    window.STATScoreBasketballPositionMatrix = {
      engine_id: ENGINE_ID,
      version: VERSION,
      matrices: BASKETBALL_MATRICES,

      normalize,
      normalizeSport,
      normalizePosition,
      inferArchetype,
      getMatrix,
      getBasketballMatrix,
      renderTraits
    };

    window.STATScore = window.STATScore || {};
    window.STATScore.BasketballPositionMatrix = window.STATScoreBasketballPositionMatrix;

    const matrix = autoRenderFromWindowAthlete();

    if(window.STATScoreEngineBus?.emit){
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        matrix_loaded: Boolean(matrix)
      });
    }

    console.info("[STATS-CORE] Basketball Position Matrix loaded:", VERSION);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})(); 
