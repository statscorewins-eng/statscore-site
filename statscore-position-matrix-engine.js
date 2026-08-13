/* ============================================================
   STATS-CORE™
   STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY

   File:
   statscore-position-matrix-engine.js

   Authority:
   SPORT_POSITION_MATRIX_COORDINATION_AUTHORITY

   Version:
   STATSCORE-POSITION-MATRIX-ENGINE-V2

   Stream Owner:
   STATSCORE_STREAM_9

   Purpose:
   Resolve governed Sport → Position/Event → Archetype →
   Trait-Schema authority for downstream Stream 9 matrices.

   Constitutional Doctrine:
   ------------------------------------------------------------

   SPORT / POSITION SCIENCE
   ≠
   DOMAIN SCORING
   ≠
   VERIFICATION
   ≠
   PRESENTATION
   ≠
   COMPOSITE AUTHORITY

   This authority answers:

   "Which governed sport/position/archetype interpretation
   contract applies to this athlete?"

   It does NOT:

   - calculate an Athletic domain score;
   - calculate Production;
   - calculate Composite STATScore™;
   - infer missing sport as Football;
   - manufacture generic matrices when authority is missing;
   - manufacture Verification state;
   - render HTML;
   - inspect DOM;
   - auto-score athletes on page load;
   - publish official athlete intelligence.

   Missing Authority ≠ Permission to Reconstruct Authority.

   Load Authority ≠ Execute Authority.

   Intelligence Authority ≠ Presentation.
   ============================================================ */

(function (root) {
  "use strict";

  /*
  ============================================================
  AUTHORITY IDENTITY
  ============================================================
  */

  const ENGINE_ID =
    "statscore-position-matrix-engine";

  const VERSION =
    "STATSCORE-POSITION-MATRIX-ENGINE-V2";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const AUTHORITY_KEY =
    "SPORT_POSITION_MATRIX_COORDINATION_AUTHORITY";

  /*
  ============================================================
  GOVERNED RESOLUTION STATES
  ============================================================
  */

  const STATUS =
    Object.freeze({

      RESOLVED:
        "RESOLVED",

      PARTIAL:
        "PARTIAL",

      INSUFFICIENT_EVIDENCE:
        "INSUFFICIENT_EVIDENCE",

      SPORT_UNSUPPORTED:
        "SPORT_UNSUPPORTED",

      POSITION_UNSUPPORTED:
        "POSITION_UNSUPPORTED",

      SPORT_AUTHORITY_UNAVAILABLE:
        "SPORT_AUTHORITY_UNAVAILABLE",

      ARCHETYPE_UNRESOLVED:
        "ARCHETYPE_UNRESOLVED",

      AUTHORITY_UNAUTHORIZED:
        "AUTHORITY_UNAUTHORIZED",

      CONTRACT_INVALID:
        "CONTRACT_INVALID"

    });

  /*
  ============================================================
  ARCHETYPE SOURCE STATES
  ============================================================

  An archetype may be:

  DECLARED
      explicitly supplied by governed source data

  VERIFIED
      explicitly supplied and supported by governed evidence

  INFERRED
      interpreted from supporting context

  PROJECTED
      provisional hypothesis only

  UNRESOLVED
      insufficient basis to assign one

  Inference / projection may guide supporting intelligence.
  They may not silently become verified truth.
  ============================================================
  */

  const ARCHETYPE_STATUS =
    Object.freeze({

      DECLARED:
        "DECLARED",

      VERIFIED:
        "VERIFIED",

      INFERRED:
        "INFERRED",

      PROJECTED:
        "PROJECTED",

      UNRESOLVED:
        "UNRESOLVED"

    });

  /*
  ============================================================
  FOOTBALL POSITION / ARCHETYPE SCIENCE
  ============================================================

  This is supporting sport/position science.

  These definitions describe:
  - position families;
  - archetype vocabulary;
  - matrix codes;
  - required trait schema.

  They DO NOT score the athlete.
  ============================================================
  */

  const FOOTBALL_MATRICES =
    Object.freeze({

      QB: Object.freeze({

        default_archetype:
          "PRO_STYLE_QB",

        archetypes:
          Object.freeze({

            PRO_STYLE_QB:
              Object.freeze({

                label:
                  "Pro-Style QB",

                matrix_code:
                  "QB_PRO_STYLE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Processing",
                    "Decision Speed",
                    "Arm Talent",
                    "Ball Placement",
                    "Pocket Presence",
                    "Field Vision",
                    "Pressure Response",
                    "Leadership"
                  ])

              }),

            DUAL_THREAT_QB:
              Object.freeze({

                label:
                  "Dual-Threat QB",

                matrix_code:
                  "DUAL_THREAT_QB_MATRIX_V1",

                traits:
                  Object.freeze([
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
                  ])

              }),

            POCKET_DISTRIBUTOR_QB:
              Object.freeze({

                label:
                  "Pocket Distributor QB",

                matrix_code:
                  "QB_POCKET_DISTRIBUTOR_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Processing",
                    "Timing",
                    "Ball Placement",
                    "Short-Intermediate Accuracy",
                    "Pocket Discipline",
                    "Progression Control",
                    "Pre-Snap Recognition",
                    "Leadership"
                  ])

              }),

            DEVELOPMENTAL_ATHLETE_QB:
              Object.freeze({

                label:
                  "Developmental Athlete-QB",

                matrix_code:
                  "QB_DEVELOPMENTAL_ATHLETE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Raw Athleticism",
                    "Arm Strength",
                    "Improvisation",
                    "Processing Growth",
                    "Mechanics Development",
                    "Coachability",
                    "Open-Field Threat",
                    "Projection Upside"
                  ])

              })

          })

      }),

      WR: Object.freeze({

        default_archetype:
          "X_RECEIVER",

        archetypes:
          Object.freeze({

            X_RECEIVER:
              Object.freeze({

                label:
                  "X Receiver",

                matrix_code:
                  "WR_X_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Release Package",
                    "Separation",
                    "Hands",
                    "Ball Tracking",
                    "Body Control",
                    "Contested Catch",
                    "Route IQ",
                    "Boundary Awareness"
                  ])

              }),

            SLOT_RECEIVER:
              Object.freeze({

                label:
                  "Slot Receiver",

                matrix_code:
                  "WR_SLOT_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Short-Area Quickness",
                    "Route IQ",
                    "Hands",
                    "Zone Awareness",
                    "YAC",
                    "Change of Direction",
                    "Contact Balance",
                    "Third-Down Reliability"
                  ])

              }),

            DEEP_THREAT:
              Object.freeze({

                label:
                  "Deep Threat",

                matrix_code:
                  "WR_DEEP_THREAT_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Top-End Speed",
                    "Acceleration",
                    "Ball Tracking",
                    "Vertical Separation",
                    "Release Timing",
                    "Body Control",
                    "Explosive Play Rate",
                    "Field-Stretch Value"
                  ])

              }),

            POSSESSION_RECEIVER:
              Object.freeze({

                label:
                  "Possession Receiver",

                matrix_code:
                  "WR_POSSESSION_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Hands",
                    "Route Discipline",
                    "Contested Catch",
                    "Traffic Catching",
                    "Body Positioning",
                    "Reliability",
                    "Awareness",
                    "Chain-Moving Value"
                  ])

              }),

            YAC_CREATOR:
              Object.freeze({

                label:
                  "YAC Creator",

                matrix_code:
                  "WR_YAC_CREATOR_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Open-Field Ability",
                    "Contact Balance",
                    "Burst",
                    "Vision",
                    "Short-Area Quickness",
                    "Play Strength",
                    "Creativity",
                    "Explosive Extension"
                  ])

              })

          })

      }),

      RB: Object.freeze({

        default_archetype:
          "ALL_PURPOSE_BACK",

        archetypes:
          Object.freeze({

            POWER_BACK:
              Object.freeze({

                label:
                  "Power Back",

                matrix_code:
                  "RB_POWER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Contact Balance",
                    "Pad Level",
                    "Leg Drive",
                    "Inside Vision",
                    "Ball Security",
                    "Short-Yardage Value",
                    "Durability",
                    "Finishing Power"
                  ])

              }),

            SLASHER:
              Object.freeze({

                label:
                  "Slasher",

                matrix_code:
                  "RB_SLASHER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Cut Speed",
                    "Burst",
                    "Vision",
                    "Acceleration",
                    "Open-Field Ability",
                    "Change of Direction",
                    "Crease Recognition",
                    "Explosive Run Value"
                  ])

              }),

            THIRD_DOWN_BACK:
              Object.freeze({

                label:
                  "Third-Down Back",

                matrix_code:
                  "RB_THIRD_DOWN_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Receiving Ability",
                    "Pass Protection",
                    "Route Feel",
                    "Hands",
                    "Space Awareness",
                    "Blitz Recognition",
                    "Ball Security",
                    "Situational Value"
                  ])

              }),

            ALL_PURPOSE_BACK:
              Object.freeze({

                label:
                  "All-Purpose Back",

                matrix_code:
                  "RB_ALL_PURPOSE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Vision",
                    "Burst",
                    "Contact Balance",
                    "Receiving Ability",
                    "Ball Security",
                    "Open-Field Ability",
                    "Pass Protection",
                    "Explosive Value"
                  ])

              })

          })

      }),

      DB: Object.freeze({

        default_archetype:
          "MAN_CORNER",

        archetypes:
          Object.freeze({

            MAN_CORNER:
              Object.freeze({

                label:
                  "Man Corner",

                matrix_code:
                  "DB_MAN_CORNER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Hip Fluidity",
                    "Mirror Ability",
                    "Press Coverage",
                    "Recovery Speed",
                    "Ball Skills",
                    "Route Recognition",
                    "Closing Burst",
                    "Competitive Toughness"
                  ])

              }),

            ZONE_CORNER:
              Object.freeze({

                label:
                  "Zone Corner",

                matrix_code:
                  "DB_ZONE_CORNER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Zone IQ",
                    "Route Pattern Recognition",
                    "Eyes Discipline",
                    "Break Timing",
                    "Communication",
                    "Ball Skills",
                    "Angle Discipline",
                    "Tackling"
                  ])

              }),

            NICKEL:
              Object.freeze({

                label:
                  "Nickel",

                matrix_code:
                  "DB_NICKEL_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Short-Area Quickness",
                    "Slot Coverage",
                    "Run Support",
                    "Blitz Timing",
                    "Route Recognition",
                    "Tackling",
                    "Change of Direction",
                    "Competitive Toughness"
                  ])

              }),

            SAFETY_HYBRID:
              Object.freeze({

                label:
                  "Safety Hybrid",

                matrix_code:
                  "DB_SAFETY_HYBRID_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Range",
                    "Run Support",
                    "Coverage Flexibility",
                    "Communication",
                    "Tackling",
                    "Ball Skills",
                    "Angle Discipline",
                    "Physicality"
                  ])

              }),

            BALL_HAWK_SAFETY:
              Object.freeze({

                label:
                  "Ball-Hawk Safety",

                matrix_code:
                  "DB_BALL_HAWK_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Range",
                    "Ball Tracking",
                    "Route Anticipation",
                    "Turnover Creation",
                    "Instincts",
                    "Zone IQ",
                    "Break Timing",
                    "Field Awareness"
                  ])

              })

          })

      }),

      LB: Object.freeze({

        default_archetype:
          "MIKE",

        archetypes:
          Object.freeze({

            MIKE:
              Object.freeze({

                label:
                  "Mike Linebacker",

                matrix_code:
                  "LB_MIKE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Run Fit IQ",
                    "Communication",
                    "Tackling",
                    "Block Shedding",
                    "Play Recognition",
                    "Leadership",
                    "Inside Range",
                    "Gap Discipline"
                  ])

              }),

            WILL:
              Object.freeze({

                label:
                  "Will Linebacker",

                matrix_code:
                  "LB_WILL_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Range",
                    "Coverage Ability",
                    "Pursuit",
                    "Change of Direction",
                    "Tackling",
                    "Play Recognition",
                    "Space Defense",
                    "Closing Speed"
                  ])

              }),

            SAM:
              Object.freeze({

                label:
                  "Sam Linebacker",

                matrix_code:
                  "LB_SAM_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Edge Setting",
                    "Physicality",
                    "Block Shedding",
                    "Tackling",
                    "Coverage Flexibility",
                    "Run Support",
                    "Strength",
                    "Gap Control"
                  ])

              }),

            EDGE_HYBRID:
              Object.freeze({

                label:
                  "Edge Hybrid",

                matrix_code:
                  "LB_EDGE_HYBRID_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Pass Rush Burst",
                    "Edge Bend",
                    "Run Contain",
                    "Power",
                    "Closing Speed",
                    "Coverage Drop Ability",
                    "Motor",
                    "Disruption"
                  ])

              }),

            COVERAGE_LINEBACKER:
              Object.freeze({

                label:
                  "Coverage Linebacker",

                matrix_code:
                  "LB_COVERAGE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Zone Awareness",
                    "Man Match Ability",
                    "Change of Direction",
                    "Route Recognition",
                    "Space Range",
                    "Ball Skills",
                    "Communication",
                    "Tackling"
                  ])

              })

          })

      }),

      OL: Object.freeze({

        default_archetype:
          "PASS_PROTECTOR",

        archetypes:
          Object.freeze({

            PASS_PROTECTOR:
              Object.freeze({

                label:
                  "Pass Protector",

                matrix_code:
                  "OL_PASS_PROTECTOR_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Pass Set",
                    "Footwork",
                    "Anchor",
                    "Hand Placement",
                    "Recovery",
                    "Balance",
                    "Length Usage",
                    "Processing"
                  ])

              }),

            RUN_MAULER:
              Object.freeze({

                label:
                  "Run Mauler",

                matrix_code:
                  "OL_RUN_MAULER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Drive Power",
                    "Leverage",
                    "Finish",
                    "Grip Strength",
                    "Run Fit Understanding",
                    "Physicality",
                    "Pad Level",
                    "Sustain"
                  ])

              }),

            PULLING_GUARD:
              Object.freeze({

                label:
                  "Pulling Guard",

                matrix_code:
                  "OL_PULLING_GUARD_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Movement Skill",
                    "Targeting",
                    "Balance",
                    "Space Blocking",
                    "Timing",
                    "Power on Contact",
                    "Agility",
                    "Awareness"
                  ])

              }),

            CENTER_IQ_ANCHOR:
              Object.freeze({

                label:
                  "Center/IQ Anchor",

                matrix_code:
                  "OL_CENTER_IQ_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Line Calls",
                    "Snap Consistency",
                    "Anchor",
                    "Processing",
                    "Communication",
                    "Leverage",
                    "Balance",
                    "Interior Control"
                  ])

              }),

            DEVELOPMENTAL_TACKLE:
              Object.freeze({

                label:
                  "Developmental Tackle",

                matrix_code:
                  "OL_DEVELOPMENTAL_TACKLE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Frame",
                    "Length",
                    "Footwork Growth",
                    "Anchor Development",
                    "Hand Timing",
                    "Coachability",
                    "Projection Upside",
                    "Strength Development"
                  ])

              })

          })

      }),

      DL: Object.freeze({

        default_archetype:
          "INTERIOR_DISRUPTOR",

        archetypes:
          Object.freeze({

            SPEED_RUSHER:
              Object.freeze({

                label:
                  "Speed Rusher",

                matrix_code:
                  "DL_SPEED_RUSHER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "First Step",
                    "Bend",
                    "Hand Violence",
                    "Closing Speed",
                    "Rush Plan",
                    "Edge Pressure",
                    "Motor",
                    "Disruption Rate"
                  ])

              }),

            POWER_RUSHER:
              Object.freeze({

                label:
                  "Power Rusher",

                matrix_code:
                  "DL_POWER_RUSHER_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Bull Rush",
                    "Leverage",
                    "Hand Power",
                    "Anchor Disruption",
                    "Run Defense",
                    "Physicality",
                    "Finish",
                    "Pocket Compression"
                  ])

              }),

            INTERIOR_DISRUPTOR:
              Object.freeze({

                label:
                  "Interior Disruptor",

                matrix_code:
                  "DL_INTERIOR_DISRUPTOR_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Get-Off",
                    "Gap Penetration",
                    "Hand Usage",
                    "Leverage",
                    "Power",
                    "Block Defeat",
                    "Run Disruption",
                    "Interior Pressure"
                  ])

              }),

            RUN_ANCHOR:
              Object.freeze({

                label:
                  "Run Anchor",

                matrix_code:
                  "DL_RUN_ANCHOR_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Point-of-Attack Strength",
                    "Gap Control",
                    "Block Resistance",
                    "Pad Level",
                    "Tackling",
                    "Physicality",
                    "Run Fit Discipline",
                    "Anchor"
                  ])

              }),

            HYBRID_EDGE:
              Object.freeze({

                label:
                  "Hybrid Edge",

                matrix_code:
                  "DL_HYBRID_EDGE_MATRIX_V1",

                traits:
                  Object.freeze([
                    "Edge Burst",
                    "Run Contain",
                    "Rush Flexibility",
                    "Coverage Drop Potential",
                    "Power",
                    "Bend",
                    "Motor",
                    "Scheme Versatility"
                  ])

              })

          })

      })

    });

  /*
  ============================================================
  NORMALIZATION
  ============================================================
  */

  function normalize(
    value
  ) {
    return String(
      value == null
        ? ""
        : value
    )
      .trim()
      .toUpperCase()
      .replace(
        /\s+/g,
        "_"
      )
      .replace(
        /-/g,
        "_"
      );
  }

  function normalizeSport(
    value
  ) {
    const sport =
      normalize(
        value
      );

    const aliases = {

      FB:
        "FOOTBALL",

      FOOTBALL:
        "FOOTBALL",

      BB:
        "BASKETBALL",

      BASKETBALL:
        "BASKETBALL",

      HOOPS:
        "BASKETBALL",

      BASEBALL:
        "BASEBALL",

      BASE_BALL:
        "BASEBALL",

      TRACK:
        "TRACK",

      TRACK_FIELD:
        "TRACK",

      TRACK_AND_FIELD:
        "TRACK"

    };

    return (
      aliases[
        sport
      ] ||
      sport ||
      null
    );
  }

  function normalizeFootballPosition(
    value
  ) {
    const position =
      normalize(
        value
      );

    const aliases = {

      QUARTERBACK:
        "QB",

      WIDE_RECEIVER:
        "WR",

      RECEIVER:
        "WR",

      RUNNING_BACK:
        "RB",

      HALF_BACK:
        "RB",

      CORNER:
        "DB",

      CORNERBACK:
        "DB",

      SAFETY:
        "DB",

      DEFENSIVE_BACK:
        "DB",

      LINEBACKER:
        "LB",

      OFFENSIVE_LINE:
        "OL",

      OFFENSIVE_LINEMAN:
        "OL",

      TACKLE:
        "OL",

      GUARD:
        "OL",

      CENTER:
        "OL",

      DEFENSIVE_LINE:
        "DL",

      DEFENSIVE_LINEMAN:
        "DL",

      EDGE:
        "DL",

      DEFENSIVE_END:
        "DL",

      DEFENSIVE_TACKLE:
        "DL"

    };

    return (
      aliases[
        position
      ] ||
      position ||
      null
    );
  }

  /*
  ============================================================
  TRAIT CONTRACT NORMALIZATION
  ============================================================
  */

  function normalizeTraitKey(
    value
  ) {
    return normalize(
      value
    );
  }

  function buildTraitSchema(
    traits
  ) {
    return (
      Array.isArray(
        traits
      )
        ? traits
        : []
    ).map(
      (
        label
      ) =>
        Object.freeze({

          trait_key:
            normalizeTraitKey(
              label
            ),

          label,

          value:
            null,

          score:
            null,

          confidence:
            null,

          verification_status:
            null,

          evidence_used:
            [],

          status:
            "UNASSESSED"

        })
    );
  }

  /*
  ============================================================
  RESULT HELPERS
  ============================================================
  */

  function buildFailure(
    input,
    status,
    explanation,
    flags = []
  ) {
    return {

      ok:
        false,

      authority:
        AUTHORITY_KEY,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      athlete_id:
        input?.athlete_id ??
        null,

      snapshot_id:
        input?.snapshot_id ??
        null,

      sport:
        normalizeSport(
          input?.sport ||
          input?.primary_sport
        ),

      position:
        null,

      archetype:
        null,

      matrix_code:
        null,

      traits:
        [],

      flags:
        Array.isArray(
          flags
        )
          ? flags
          : [],

      explanation,

      status,

      generated_at:
        new Date()
          .toISOString()

    };
  }

  /*
  ============================================================
  ARCHETYPE RESOLUTION
  ============================================================

  Explicit governed source data takes precedence.

  Text inference is SUPPORTING only and is never represented
  as VERIFIED truth.
  ============================================================
  */

  function getDeclaredArchetype(
    athlete
  ) {
    const candidate =
      athlete?.archetype ||
      athlete?.position_archetype ||
      athlete?.player_archetype ||
      athlete?.raw_payload
        ?.archetype ||
      null;

    if (!candidate) {
      return null;
    }

    return {
      code:
        normalize(
          candidate
        ),

      status:
        normalize(
          athlete
            ?.archetype_status
        ) ===
          "VERIFIED"
          ? ARCHETYPE_STATUS
              .VERIFIED
          : ARCHETYPE_STATUS
              .DECLARED,

      confidence:
        normalize(
          athlete
            ?.archetype_status
        ) ===
          "VERIFIED"
          ? 100
          : null,

      source:
        "ATHLETE_CONTEXT"
    };
  }

  function inferFootballArchetype(
    position,
    athlete
  ) {
    const pos =
      normalizeFootballPosition(
        position
      );

    /*
    ----------------------------------------------------------
    QB inference retained only as provisional supporting
    interpretation.

    No other position is inferred from free text here.
    ----------------------------------------------------------
    */

    if (
      pos !==
      "QB"
    ) {
      return null;
    }

    const notes = [
      athlete
        ?.position_notes,

      athlete
        ?.raw_payload
        ?.notes,

      athlete
        ?.raw_payload
        ?.style,

      athlete
        ?.raw_payload
        ?.qb_style

    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
      .toLowerCase();

    if (!notes) {
      return null;
    }

    const dualThreatSignals = [
      "dual",
      "scramble",
      "mobile",
      "designed run",
      "open field",
      "runner"
    ];

    const matches =
      dualThreatSignals.filter(
        (
          signal
        ) =>
          notes.includes(
            signal
          )
      );

    if (
      !matches.length
    ) {
      return null;
    }

    return {

      code:
        "DUAL_THREAT_QB",

      status:
        ARCHETYPE_STATUS
          .INFERRED,

      confidence:
        Math.min(
          50,
          25 +
            (
              matches.length *
              5
            )
        ),

      source:
        "SUPPORTING_TEXT_INFERENCE",

      evidence:
        matches

    };
  }

  /*
  ============================================================
  FOOTBALL AUTHORITY
  ============================================================
  */

  function resolveFootballMatrix(
    athlete
  ) {
    const position =
      normalizeFootballPosition(
        athlete
          ?.primary_position ||
        athlete
          ?.position ||
        athlete
          ?.verified_position
      );

    if (!position) {
      return buildFailure(
        athlete,

        STATUS
          .INSUFFICIENT_EVIDENCE,

        "Football position is required before position matrix authority can be resolved.",

        [
          "POSITION_MISSING"
        ]
      );
    }

    const positionGroup =
      FOOTBALL_MATRICES[
        position
      ];

    if (
      !positionGroup
    ) {
      return buildFailure(
        athlete,

        STATUS
          .POSITION_UNSUPPORTED,

        `No governed Football position authority is registered for ${position}.`,

        [
          "POSITION_AUTHORITY_UNAVAILABLE"
        ]
      );
    }

    const declared =
      getDeclaredArchetype(
        athlete
      );

    const inferred =
      declared
        ? null
        : inferFootballArchetype(
            position,
            athlete
          );

    let archetype =
      declared ||
      inferred;

    /*
    ----------------------------------------------------------
    Default archetype may identify the position's baseline
    interpretation schema, but MUST be labeled PROJECTED.

    It is not athlete truth.
    ----------------------------------------------------------
    */

    if (!archetype) {
      archetype = {

        code:
          positionGroup
            .default_archetype,

        status:
          ARCHETYPE_STATUS
            .PROJECTED,

        confidence:
          0,

        source:
          "POSITION_DEFAULT_SCHEMA"

      };
    }

    let selected =
      positionGroup
        .archetypes[
          archetype.code
        ];

    /*
    ----------------------------------------------------------
    If an explicit/inferred archetype is not registered for the
    position, do not silently substitute another archetype.
    ----------------------------------------------------------
    */

    if (
      !selected
    ) {
      return buildFailure(
        athlete,

        STATUS
          .ARCHETYPE_UNRESOLVED,

        `Archetype ${archetype.code} is not registered for Football position ${position}.`,

        [
          "ARCHETYPE_NOT_REGISTERED"
        ]
      );
    }

    return {

      ok:
        true,

      authority:
        AUTHORITY_KEY,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      athlete_id:
        athlete
          ?.athlete_id ??
        null,

      snapshot_id:
        athlete
          ?.snapshot_id ??
        null,

      sport:
        "FOOTBALL",

      position,

      sport_authority:
        "FOOTBALL_POSITION_SCIENCE",

      archetype: {

        code:
          archetype.code,

        label:
          selected.label,

        status:
          archetype.status,

        confidence:
          archetype.confidence,

        source:
          archetype.source,

        evidence:
          archetype.evidence ||
          []

      },

      matrix_code:
        selected
          .matrix_code,

      traits:
        buildTraitSchema(
          selected.traits
        ),

      flags:
        archetype.status ===
          ARCHETYPE_STATUS
            .PROJECTED
          ? [
              "ARCHETYPE_PROJECTED"
            ]
          : archetype.status ===
              ARCHETYPE_STATUS
                .INFERRED
            ? [
                "ARCHETYPE_INFERRED"
              ]
            : [],

      explanation: {

        summary:
          "Football sport/position authority resolved the applicable position and archetype trait schema. This output defines interpretation science only and does not calculate an Athletic, Production, Verification, or Composite score.",

        archetype_status:
          archetype.status,

        scoring_authority:
          false,

        composite_authority:
          false,

        verification_authority:
          false,

        presentation_authority:
          false

      },

      status:
        archetype.status ===
          ARCHETYPE_STATUS
            .PROJECTED
          ? STATUS
              .PARTIAL
          : STATUS
              .RESOLVED,

      generated_at:
        new Date()
          .toISOString()

    };
  }

  /*
  ============================================================
  EXTERNAL SPORT POSITION AUTHORITIES
  ============================================================

  Basketball / Baseball / Track already possess dedicated
  sport-specific matrix authorities.

  This engine coordinates them. It does not recreate them.
  ============================================================
  */

  function getExternalSportAuthority(
    sport,
    context = {}
  ) {
    const explicit =
      context
        .sport_authorities
        ?.[sport];

    if (explicit) {
      return explicit;
    }

    switch (
      sport
    ) {

      case "BASKETBALL":
        return (
          root
            .STATScoreBasketballPositionMatrix ||
          root
            .STATScore
            ?.BasketballPositionMatrix ||
          null
        );

      case "BASEBALL":
        return (
          root
            .STATScoreBaseballPositionMatrix ||
          root
            .STATScore
            ?.BaseballPositionMatrix ||
          null
        );

      case "TRACK":
        return (
          root
            .STATScoreTrackPositionMatrixEngine ||
          root
            .STATScore
            ?.TrackPositionMatrixEngine ||
          null
        );

      default:
        return null;

    }
  }

  function executeExternalAuthority(
    authority,
    athlete
  ) {
    if (!authority) {
      return null;
    }

    const methods = [
      "resolve",
      "resolveMatrix",
      "getMatrix"
    ];

    for (
      const method of methods
    ) {
      if (
        typeof authority[
          method
        ] ===
        "function"
      ) {
        const result =
          authority[
            method
          ](
            athlete
          );

        if (
          result &&
          typeof result
            .then ===
            "function"
        ) {
          throw new Error(
            "Position Matrix coordination requires synchronous sport-position authority at this boundary."
          );
        }

        return result;
      }
    }

    return null;
  }

  function normalizeExternalResult(
    sport,
    athlete,
    result
  ) {
    if (
      !result ||
      typeof result !==
        "object"
    ) {
      return buildFailure(
        athlete,

        STATUS
          .SPORT_AUTHORITY_UNAVAILABLE,

        `${sport} position authority did not return a governed matrix contract.`,

        [
          "SPORT_AUTHORITY_NO_RESULT"
        ]
      );
    }

    const position =
      normalize(
        result.position ||
        result.event_group ||
        result.event ||
        athlete
          ?.position ||
        athlete
          ?.primary_position ||
        athlete
          ?.primary_event
      ) ||
      null;

    const archetypeCode =
      normalize(
        result
          .archetype_code ||
        result
          ?.archetype
          ?.code ||
        ""
      );

    const archetypeLabel =
      typeof result
        .archetype ===
        "string"
        ? result
            .archetype
        : result
            ?.archetype
            ?.label ||
          null;

    const matrixCode =
      result
        .matrix_code ||
      result
        .matrix_id ||
      null;

    const sourceTraits =
      Array.isArray(
        result.traits
      )
        ? result.traits
        : [];

    const traits =
      sourceTraits.map(
        (
          trait
        ) => {

          if (
            typeof trait ===
              "string"
          ) {
            return {

              trait_key:
                normalizeTraitKey(
                  trait
                ),

              label:
                trait,

              value:
                null,

              score:
                null,

              confidence:
                null,

              verification_status:
                null,

              evidence_used:
                [],

              status:
                "UNASSESSED"

            };
          }

          const label =
            trait
              ?.label ||
            trait
              ?.name ||
            trait
              ?.trait_key ||
            "Unknown Trait";

          return {

            trait_key:
              normalizeTraitKey(
                trait
                  ?.trait_key ||
                trait
                  ?.name ||
                label
              ),

            label,

            /*
            --------------------------------------------------
            Preserve no locally-created verification state.

            If upstream sport authority has already interpreted
            a value, it may remain as supporting sport science.
            This coordinator does not alter it.
            --------------------------------------------------
            */

            value:
              trait
                ?.value ??
              null,

            score:
              trait
                ?.score ??
              null,

            confidence:
              trait
                ?.confidence ??
              null,

            verification_status:
              trait
                ?.verification_status ??
              null,

            evidence_used:
              Array.isArray(
                trait
                  ?.evidence_used
              )
                ? trait
                    .evidence_used
                : Array.isArray(
                    trait
                      ?.evidence
                  )
                  ? trait
                      .evidence
                  : [],

            status:
              trait
                ?.status ||
              "UNASSESSED"

          };

        }
      );

    if (
      !matrixCode ||
      !position ||
      !traits.length
    ) {
      return buildFailure(
        athlete,

        STATUS
          .CONTRACT_INVALID,

        `${sport} position authority returned an incomplete matrix contract.`,

        [
          "SPORT_MATRIX_CONTRACT_INCOMPLETE"
        ]
      );
    }

    return {

      ok:
        true,

      authority:
        AUTHORITY_KEY,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      athlete_id:
        athlete
          ?.athlete_id ??
        null,

      snapshot_id:
        athlete
          ?.snapshot_id ??
        null,

      sport,

      position,

      sport_authority:
        `${sport}_POSITION_SCIENCE`,

      archetype: {

        code:
          archetypeCode ||
          null,

        label:
          archetypeLabel,

        status:
          result
            ?.archetype
            ?.status ||
          (
            archetypeCode
              ? ARCHETYPE_STATUS
                  .DECLARED
              : ARCHETYPE_STATUS
                  .UNRESOLVED
          ),

        confidence:
          result
            ?.archetype
            ?.confidence ??
          null,

        source:
          result
            ?.archetype
            ?.source ||
          "SPORT_AUTHORITY",

        evidence:
          result
            ?.archetype
            ?.evidence ||
          []

      },

      matrix_code:
        matrixCode,

      traits,

      flags:
        Array.isArray(
          result.flags
        )
          ? result.flags
          : [],

      explanation: {

        summary:
          `${sport} position authority contract coordinated successfully. The Position Matrix Engine does not recalculate sport science or domain scores.`,

        source_authority:
          result.engine_id ||
          result.authority ||
          "SPORT_POSITION_AUTHORITY",

        scoring_authority:
          false,

        composite_authority:
          false,

        verification_authority:
          false,

        presentation_authority:
          false

      },

      status:
        STATUS
          .RESOLVED,

      generated_at:
        new Date()
          .toISOString()

    };
  }

  /*
  ============================================================
  PRIMARY RESOLUTION
  ============================================================
  */

  function resolve(
    athlete,
    context = {}
  ) {
    try {

      /*
      ----------------------------------------------------------
      IDENTITY
      ----------------------------------------------------------
      */

      if (
        !athlete ||
        typeof athlete !==
          "object"
      ) {
        return buildFailure(
          athlete,

          STATUS
            .INSUFFICIENT_EVIDENCE,

          "Athlete context is required before sport/position authority may be resolved.",

          [
            "ATHLETE_CONTEXT_MISSING"
          ]
        );
      }

      /*
      ----------------------------------------------------------
      STREAM AUTHORITY
      ----------------------------------------------------------
      */

      if (
        context
          .stream_owner &&
        context
          .stream_owner !==
          STREAM_OWNER
      ) {
        return buildFailure(
          athlete,

          STATUS
            .AUTHORITY_UNAUTHORIZED,

          "Sport/Position Matrix coordination may only execute under Stream 9 authority.",

          [
            "STREAM_9_AUTHORITY_REQUIRED"
          ]
        );
      }

      /*
      ----------------------------------------------------------
      SPORT
      ----------------------------------------------------------
      */

      const sport =
        normalizeSport(

          athlete
            .primary_sport ||

          athlete
            .sport ||

          athlete
            .raw_payload
            ?.primarySport ||

          athlete
            .raw_payload
            ?.primary_sport ||

          athlete
            .raw_payload
            ?.sport

        );

      if (!sport) {
        return buildFailure(
          athlete,

          STATUS
            .INSUFFICIENT_EVIDENCE,

          "Sport is required before position matrix authority can be resolved.",

          [
            "SPORT_MISSING"
          ]
        );
      }

      /*
      ----------------------------------------------------------
      FOOTBALL
      ----------------------------------------------------------
      */

      if (
        sport ===
        "FOOTBALL"
      ) {
        return resolveFootballMatrix(
          athlete
        );
      }

      /*
      ----------------------------------------------------------
      OTHER GOVERNED SPORTS
      ----------------------------------------------------------
      */

      if (
        [
          "BASKETBALL",
          "BASEBALL",
          "TRACK"
        ].includes(
          sport
        )
      ) {

        const authority =
          getExternalSportAuthority(
            sport,
            context
          );

        if (
          !authority
        ) {
          return buildFailure(
            athlete,

            STATUS
              .SPORT_AUTHORITY_UNAVAILABLE,

            `${sport} position authority is not loaded. This engine will not manufacture a generic replacement matrix.`,

            [
              "SPORT_AUTHORITY_UNAVAILABLE"
            ]
          );
        }

        const result =
          executeExternalAuthority(
            authority,
            athlete
          );

        return normalizeExternalResult(
          sport,
          athlete,
          result
        );
      }

      /*
      ----------------------------------------------------------
      UNSUPPORTED SPORT
      ----------------------------------------------------------
      */

      return buildFailure(
        athlete,

        STATUS
          .SPORT_UNSUPPORTED,

        `No governed sport/position authority is registered for ${sport}.`,

        [
          "SPORT_UNSUPPORTED"
        ]
      );

    } catch (
      error
    ) {
      return buildFailure(
        athlete,

        STATUS
          .CONTRACT_INVALID,

        String(
          error
            ?.message ||
          error
        ),

        [
          "POSITION_MATRIX_COORDINATION_ERROR"
        ]
      );
    }
  }

  /*
  ============================================================
  COMPATIBILITY ENTRYPOINT
  ============================================================

  Existing Stream 9 consumers may still call getMatrix().

  It forwards to resolve().

  It does NOT create a second authority path.
  ============================================================
  */

  function getMatrix(
    athlete,
    context = {}
  ) {
    return resolve(
      athlete,
      context
    );
  }

  /*
  ============================================================
  CONTRACT
  ============================================================
  */

  function getContract() {
    return {

      authority:
        AUTHORITY_KEY,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      authority_type:
        "SPORT_POSITION_COORDINATION",

      supported_sports:
        [
          "FOOTBALL",
          "BASKETBALL",
          "BASEBALL",
          "TRACK"
        ],

      football_positions:
        Object.keys(
          FOOTBALL_MATRICES
        ),

      score_authority:
        false,

      domain_matrix_authority:
        false,

      composite_authority:
        false,

      verification_authority:
        false,

      presentation_authority:
        false,

      runtime_authority:
        false,

      auto_execution:
        false,

      generic_fallback_matrix_allowed:
        false,

      missing_sport_defaults_to_football:
        false

    };
  }

  /*
  ============================================================
  HEALTH CHECK
  ============================================================
  */

  function runHealthCheck() {
    return {

      authority_loaded:
        true,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      football_authority_loaded:
        Boolean(
          FOOTBALL_MATRICES
        ),

      basketball_authority_loaded:
        Boolean(
          getExternalSportAuthority(
            "BASKETBALL"
          )
        ),

      baseball_authority_loaded:
        Boolean(
          getExternalSportAuthority(
            "BASEBALL"
          )
        ),

      track_authority_loaded:
        Boolean(
          getExternalSportAuthority(
            "TRACK"
          )
        ),

      generic_fallback_enabled:
        false,

      dom_rendering_enabled:
        false,

      auto_execution_enabled:
        false,

      local_scoring_enabled:
        false,

      missing_sport_defaults_to_football:
        false,

      healthy:
        true

    };
  }

  /*
  ============================================================
  CANONICAL API
  ============================================================
  */

  const api =
    Object.freeze({

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      authority:
        AUTHORITY_KEY,

      status:
        "ACTIVE",

      football_matrices:
        FOOTBALL_MATRICES,

      statuses:
        STATUS,

      archetype_statuses:
        ARCHETYPE_STATUS,

      normalizeSport,

      normalizeFootballPosition,

      inferFootballArchetype,

      resolve,

      getMatrix,

      getContract,

      runHealthCheck

    });

  /*
  ============================================================
  PUBLIC AUTHORITY
  ============================================================
  */

  root.STATScorePositionMatrixEngine =
    api;

  root.STATScore =
    root.STATScore ||
    {};

  root.STATScore.PositionMatrixEngine =
    api;

  /*
  ============================================================
  LOAD RECEIPT
  ============================================================

  Loading this file registers authority only.

  It does not:
  - resolve an athlete;
  - inspect window athlete globals;
  - query the DOM;
  - render traits;
  - emit score results.
  ============================================================
  */

  console.info(
    "[STATS-CORE][STREAM 9] Position Matrix Coordination Authority loaded:",
    VERSION
  );

})(
  typeof window !==
    "undefined"
    ? window
    : globalThis
); 
