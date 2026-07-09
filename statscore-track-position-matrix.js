/* ============================================================
   STATScore™ Track Position Matrix Engine
   Stream 9 — Intelligence Matrix & Composite Scoring Authority
   File: statscore-track-position-matrix.js
   Version: v1.0
   Purpose:
   Track → Event Group → Event Archetype → Performance Traits
============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-track-position-matrix";
  const VERSION = "v1.0";

  const TRACK_MATRICES = {

    SPRINT: {

      default_archetype: "POWER_SPRINTER",

      archetypes: {

        POWER_SPRINTER: {
          label: "Power Sprinter",
          matrix_code: "TRACK_SPRINT_POWER_V1",

          traits: [
            "Acceleration",
            "Top-End Speed",
            "Stride Frequency",
            "Stride Length",
            "Start Reaction",
            "Power Output",
            "Speed Endurance",
            "Competitive Finish"
          ]
        },

        TECHNICAL_SPRINTER: {
          label: "Technical Sprinter",
          matrix_code: "TRACK_SPRINT_TECHNICAL_V1",

          traits: [
            "Block Technique",
            "Running Mechanics",
            "Efficiency",
            "Acceleration",
            "Transition Phase",
            "Top-End Speed",
            "Race Discipline",
            "Finish Mechanics"
          ]
        }

      }
    },

    DISTANCE: {

      default_archetype: "ENDURANCE_RUNNER",

      archetypes: {

        ENDURANCE_RUNNER: {

          label: "Endurance Runner",

          matrix_code: "TRACK_DISTANCE_ENDURANCE_V1",

          traits: [
            "Aerobic Capacity",
            "Running Economy",
            "Race Strategy",
            "Mental Toughness",
            "Consistency",
            "Closing Speed",
            "Pacing",
            "Competitive Finish"
          ]
        },

        TACTICAL_RUNNER: {

          label: "Tactical Runner",

          matrix_code: "TRACK_DISTANCE_TACTICAL_V1",

          traits: [
            "Race IQ",
            "Pack Awareness",
            "Acceleration",
            "Kick Finish",
            "Consistency",
            "Endurance",
            "Positioning",
            "Adaptability"
          ]
        }

      }
    },

    RELAY: {

      default_archetype: "RELAY_SPECIALIST",

      archetypes: {

        RELAY_SPECIALIST: {

          label: "Relay Specialist",

          matrix_code: "TRACK_RELAY_SPECIALIST_V1",

          traits: [
            "Exchange Technique",
            "Acceleration",
            "Top-End Speed",
            "Communication",
            "Timing",
            "Race Awareness",
            "Finish",
            "Team Reliability"
          ]
        }

      }
    },

    JUMPS: {

      default_archetype: "EXPLOSIVE_JUMPER",

      archetypes: {

        EXPLOSIVE_JUMPER: {

          label: "Explosive Jumper",

          matrix_code: "TRACK_JUMPS_EXPLOSIVE_V1",

          traits: [
            "Explosiveness",
            "Approach Speed",
            "Takeoff Technique",
            "Body Control",
            "Flight Mechanics",
            "Landing",
            "Consistency",
            "Competitive Execution"
          ]
        }

      }
    },

    THROWS: {

      default_archetype: "POWER_THROWER",

      archetypes: {

        POWER_THROWER: {

          label: "Power Thrower",

          matrix_code: "TRACK_THROWS_POWER_V1",

          traits: [
            "Power",
            "Explosiveness",
            "Technique",
            "Balance",
            "Release Mechanics",
            "Footwork",
            "Consistency",
            "Competitive Execution"
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

  function normalizeEvent(event) {

    const e = normalize(event);

    const aliases = {

      "100M":"SPRINT",
      "200M":"SPRINT",
      "400M":"SPRINT",

      "800M":"DISTANCE",
      "1600M":"DISTANCE",
      "3200M":"DISTANCE",
      "CROSS_COUNTRY":"DISTANCE",

      "4X100":"RELAY",
      "4X200":"RELAY",
      "4X400":"RELAY",

      "LONG_JUMP":"JUMPS",
      "HIGH_JUMP":"JUMPS",
      "TRIPLE_JUMP":"JUMPS",
      "POLE_VAULT":"JUMPS",

      "SHOT_PUT":"THROWS",
      "DISCUS":"THROWS",
      "JAVELIN":"THROWS"

    };

    return aliases[e] || e || "SPRINT";

  }

  function getMatrix(athlete){

    const group = normalizeEvent(

      athlete.primary_event ||
      athlete.event ||
      athlete.track_event ||
      athlete.position

    );

    const matrixGroup = TRACK_MATRICES[group];

    if(!matrixGroup){

      return {

        sport:"TRACK",

        position:group,

        archetype:"General",

        archetype_code:"GENERAL",

        matrix_code:"TRACK_GENERAL_V1",

        traits:[
          "Athleticism",
          "Technique",
          "Consistency",
          "Competitive Performance",
          "Coachability",
          "Development"
        ].map(name=>({

          name,
          status:"PENDING_VERIFICATION",
          value:null,
          evidence:[]

        }))

      };

    }

    const archetypeCode = matrixGroup.default_archetype;

    const archetype = matrixGroup.archetypes[archetypeCode];

    return {

      sport:"TRACK",

      position:group,

      archetype:archetype.label,

      archetype_code:archetypeCode,

      matrix_code:archetype.matrix_code,

      traits:archetype.traits.map(name=>({

        name,

        status:"PENDING_VERIFICATION",

        value:null,

        evidence:[]

      }))

    };

  }

  window.STATScoreTrackPositionMatrixEngine={

    engine_id:ENGINE_ID,

    version:VERSION,

    matrices:TRACK_MATRICES,

    getMatrix

  };

  window.STATScore=window.STATScore||{};

  window.STATScore.TrackPositionMatrixEngine=
    window.STATScoreTrackPositionMatrixEngine;

  console.info(
    "[STATScore] Track Position Matrix Engine Online",
    VERSION
  );

})(); 
