/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-basketball-position-matrix.js
*
* Canonical Classification:
*     SUPPORTING SPORT / POSITION INTELLIGENCE AUTHORITY
*
* Production Role:
*     Basketball position and archetype interpretation authority.
*
* Purpose:
*     Basketball
*         ↓
*     Governed Position Classification
*         ↓
*     Governed Archetype Classification
*         ↓
*     Basketball Trait Vocabulary
*         ↓
*     Basketball Sport Intelligence
*         ↓
*     Registered Stream 9 Domain Matrices
*
* Constitutional Boundaries:
*     This authority DOES:
*       - normalize basketball positions;
*       - preserve position aliases;
*       - resolve basketball position groups;
*       - resolve supported basketball archetypes;
*       - expose position/archetype trait vocabulary;
*       - expose versioned supporting basketball matrix definitions;
*       - identify unavailable position/archetype authority;
*       - return structured interpretation contracts.
*
*     This authority DOES NOT:
*       - calculate official Athletic Score;
*       - calculate official Production Score;
*       - calculate official Competition Score;
*       - calculate official Verification Score;
*       - calculate official Academic Score;
*       - calculate official STATScore™;
*       - calculate Composite Intelligence;
*       - fabricate trait values;
*       - fabricate baseline scores;
*       - infer missing evidence into performance;
*       - alter confidence;
*       - certify evidence;
*       - render UI;
*       - manipulate DOM;
*       - execute automatically on page load.
*
* Governing Doctrine:
*     Evidence ≠ Intelligence
*     Intelligence ≠ Presentation
*     Score ≠ Confidence
*     Verification ≠ Confidence
*     Confidence ≠ Certification
*     Missing ≠ Zero
*     PROJECTED ≠ OFFICIAL
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
*
* Version:
*     STATSCORE-BASKETBALL-POSITION-MATRIX-V2
*
* Contract Version:
*     STATSCORE-BASKETBALL-POSITION-MATRIX-CONTRACT-V1
*
* Status:
*     PRODUCTION RECONSTRUCTION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID = "statscore-basketball-position-matrix";
    const VERSION = "STATSCORE-BASKETBALL-POSITION-MATRIX-V2";
    const CONTRACT_VERSION = "STATSCORE-BASKETBALL-POSITION-MATRIX-CONTRACT-V1";

    const STREAM_OWNER = "STATSCORE_STREAM_9";
    const SPORT = "BASKETBALL";

    const STATUS = Object.freeze({
        AVAILABLE: "AVAILABLE",
        AUTHORITY_UNAVAILABLE: "AUTHORITY_UNAVAILABLE",
        AUTHORITY_UNAUTHORIZED: "AUTHORITY_UNAUTHORIZED",
        INVALID_INPUT: "INVALID_INPUT",
        UNSUPPORTED_SPORT: "UNSUPPORTED_SPORT",
        UNSUPPORTED_POSITION: "UNSUPPORTED_POSITION",
        UNSUPPORTED_ARCHETYPE: "UNSUPPORTED_ARCHETYPE",
        POSITION_REQUIRED: "POSITION_REQUIRED",
        ERROR: "ERROR"
    });

    /*
    ============================================================================
    CANONICAL BASKETBALL POSITION / ARCHETYPE SCIENCE
    ----------------------------------------------------------------------------
    These definitions establish basketball-specific position interpretation and
    trait vocabulary only.

    They do NOT create official athlete scores.
    They do NOT supply missing trait values.
    They do NOT manufacture performance baselines.
    ============================================================================
    */

    const BASKETBALL_MATRICES = Object.freeze({

        PG: Object.freeze({
            position_code: "PG",
            position_label: "Point Guard",
            default_archetype: "FLOOR_GENERAL",

            archetypes: Object.freeze({

                FLOOR_GENERAL: Object.freeze({
                    label: "Floor General",
                    matrix_code: "BK_PG_FLOOR_GENERAL_MATRIX_V2",

                    traits: Object.freeze([
                        "COURT_VISION",
                        "BALL_HANDLING",
                        "DECISION_MAKING",
                        "PICK_AND_ROLL_IQ",
                        "PASSING",
                        "LEADERSHIP",
                        "PACE_CONTROL",
                        "DEFENSIVE_PRESSURE"
                    ])
                }),

                SCORING_POINT_GUARD: Object.freeze({
                    label: "Scoring Point Guard",
                    matrix_code: "BK_PG_SCORING_MATRIX_V2",

                    traits: Object.freeze([
                        "SHOT_CREATION",
                        "BALL_HANDLING",
                        "THREE_LEVEL_SCORING",
                        "BURST",
                        "FINISHING",
                        "PULL_UP_SHOOTING",
                        "PACE_CHANGE",
                        "DEFENSIVE_PRESSURE"
                    ])
                }),

                DEFENSIVE_POINT_GUARD: Object.freeze({
                    label: "Defensive Point Guard",
                    matrix_code: "BK_PG_DEFENSIVE_MATRIX_V2",

                    traits: Object.freeze([
                        "ON_BALL_DEFENSE",
                        "DEFENSIVE_PRESSURE",
                        "LATERAL_QUICKNESS",
                        "BALL_DISRUPTION",
                        "COMMUNICATION",
                        "TRANSITION_CONTROL",
                        "DECISION_MAKING",
                        "LEADERSHIP"
                    ])
                })

            })
        }),

        SG: Object.freeze({
            position_code: "SG",
            position_label: "Shooting Guard",
            default_archetype: "SHOT_CREATOR",

            archetypes: Object.freeze({

                SHOT_CREATOR: Object.freeze({
                    label: "Shot Creator",
                    matrix_code: "BK_SG_SHOT_CREATOR_MATRIX_V2",

                    traits: Object.freeze([
                        "SHOT_CREATION",
                        "PERIMETER_SHOOTING",
                        "OFF_BALL_MOVEMENT",
                        "SCORING_EFFICIENCY",
                        "BALL_HANDLING",
                        "DEFENSIVE_VERSATILITY",
                        "TRANSITION",
                        "CLUTCH_SCORING"
                    ])
                }),

                THREE_AND_D: Object.freeze({
                    label: "Three-and-D Guard",
                    matrix_code: "BK_SG_THREE_AND_D_MATRIX_V2",

                    traits: Object.freeze([
                        "PERIMETER_SHOOTING",
                        "CATCH_AND_SHOOT",
                        "DEFENSIVE_VERSATILITY",
                        "ON_BALL_DEFENSE",
                        "OFF_BALL_AWARENESS",
                        "TRANSITION",
                        "SHOT_DISCIPLINE",
                        "TEAM_FIT"
                    ])
                }),

                SLASHING_GUARD: Object.freeze({
                    label: "Slashing Guard",
                    matrix_code: "BK_SG_SLASHING_MATRIX_V2",

                    traits: Object.freeze([
                        "FIRST_STEP",
                        "FINISHING",
                        "CONTACT_BALANCE",
                        "TRANSITION",
                        "RIM_PRESSURE",
                        "BALL_HANDLING",
                        "FREE_THROW_PRESSURE",
                        "DEFENSIVE_ACTIVITY"
                    ])
                })

            })
        }),

        SF: Object.freeze({
            position_code: "SF",
            position_label: "Small Forward",
            default_archetype: "TWO_WAY_WING",

            archetypes: Object.freeze({

                TWO_WAY_WING: Object.freeze({
                    label: "Two-Way Wing",
                    matrix_code: "BK_SF_TWO_WAY_WING_MATRIX_V2",

                    traits: Object.freeze([
                        "ATHLETICISM",
                        "TWO_WAY_VALUE",
                        "FINISHING",
                        "DEFENSIVE_SWITCHABILITY",
                        "REBOUNDING",
                        "SHOT_CREATION",
                        "BASKETBALL_IQ",
                        "VERSATILITY"
                    ])
                }),

                SCORING_WING: Object.freeze({
                    label: "Scoring Wing",
                    matrix_code: "BK_SF_SCORING_WING_MATRIX_V2",

                    traits: Object.freeze([
                        "SHOT_CREATION",
                        "THREE_LEVEL_SCORING",
                        "PERIMETER_SHOOTING",
                        "FINISHING",
                        "OFF_BALL_MOVEMENT",
                        "TRANSITION",
                        "MISMATCH_VALUE",
                        "SCORING_EFFICIENCY"
                    ])
                }),

                DEFENSIVE_WING: Object.freeze({
                    label: "Defensive Wing",
                    matrix_code: "BK_SF_DEFENSIVE_WING_MATRIX_V2",

                    traits: Object.freeze([
                        "DEFENSIVE_SWITCHABILITY",
                        "LENGTH_USAGE",
                        "ON_BALL_DEFENSE",
                        "HELP_DEFENSE",
                        "REBOUNDING",
                        "TRANSITION_DEFENSE",
                        "PHYSICALITY",
                        "BASKETBALL_IQ"
                    ])
                })

            })
        }),

        PF: Object.freeze({
            position_code: "PF",
            position_label: "Power Forward",
            default_archetype: "MODERN_FORWARD",

            archetypes: Object.freeze({

                MODERN_FORWARD: Object.freeze({
                    label: "Modern Forward",
                    matrix_code: "BK_PF_MODERN_FORWARD_MATRIX_V2",

                    traits: Object.freeze([
                        "INTERIOR_SCORING",
                        "MIDRANGE",
                        "PHYSICALITY",
                        "REBOUNDING",
                        "SCREEN_SETTING",
                        "DEFENSIVE_PRESENCE",
                        "MOTOR",
                        "POST_PLAY"
                    ])
                }),

                STRETCH_FOUR: Object.freeze({
                    label: "Stretch Four",
                    matrix_code: "BK_PF_STRETCH_FOUR_MATRIX_V2",

                    traits: Object.freeze([
                        "PERIMETER_SHOOTING",
                        "PICK_AND_POP_VALUE",
                        "SPACING",
                        "REBOUNDING",
                        "DEFENSIVE_PRESENCE",
                        "PASSING",
                        "SCREEN_SETTING",
                        "BASKETBALL_IQ"
                    ])
                }),

                ENERGY_FORWARD: Object.freeze({
                    label: "Energy Forward",
                    matrix_code: "BK_PF_ENERGY_FORWARD_MATRIX_V2",

                    traits: Object.freeze([
                        "MOTOR",
                        "REBOUNDING",
                        "PHYSICALITY",
                        "SCREEN_SETTING",
                        "INTERIOR_DEFENSE",
                        "TRANSITION",
                        "FINISHING",
                        "SECOND_CHANCE_VALUE"
                    ])
                })

            })
        }),

        C: Object.freeze({
            position_code: "C",
            position_label: "Center",
            default_archetype: "RIM_PROTECTOR",

            archetypes: Object.freeze({

                RIM_PROTECTOR: Object.freeze({
                    label: "Rim Protector",
                    matrix_code: "BK_C_RIM_PROTECTOR_MATRIX_V2",

                    traits: Object.freeze([
                        "RIM_PROTECTION",
                        "INTERIOR_DEFENSE",
                        "REBOUNDING",
                        "POST_SCORING",
                        "HANDS",
                        "PHYSICAL_PRESENCE",
                        "PICK_AND_ROLL_DEFENSE",
                        "SHOT_BLOCKING"
                    ])
                }),

                POST_SCORER: Object.freeze({
                    label: "Post Scorer",
                    matrix_code: "BK_C_POST_SCORER_MATRIX_V2",

                    traits: Object.freeze([
                        "POST_SCORING",
                        "FOOTWORK",
                        "HANDS",
                        "INTERIOR_TOUCH",
                        "PHYSICAL_PRESENCE",
                        "REBOUNDING",
                        "PASSING",
                        "SCREEN_SETTING"
                    ])
                }),

                MOBILE_BIG: Object.freeze({
                    label: "Mobile Big",
                    matrix_code: "BK_C_MOBILE_BIG_MATRIX_V2",

                    traits: Object.freeze([
                        "MOBILITY",
                        "PICK_AND_ROLL_DEFENSE",
                        "RIM_RUNNING",
                        "REBOUNDING",
                        "FINISHING",
                        "SHOT_BLOCKING",
                        "DEFENSIVE_RANGE",
                        "MOTOR"
                    ])
                })

            })
        })

    });

    /*
    ============================================================================
    POSITION ALIASES
    ----------------------------------------------------------------------------
    Unknown positions DO NOT silently become Point Guard.
    ============================================================================
    */

    const POSITION_ALIASES = Object.freeze({

        POINT_GUARD: "PG",
        PG: "PG",

        SHOOTING_GUARD: "SG",
        TWO_GUARD: "SG",
        "2_GUARD": "SG",
        SG: "SG",

        SMALL_FORWARD: "SF",
        WING: "SF",
        SF: "SF",

        POWER_FORWARD: "PF",
        FOUR: "PF",
        "4": "PF",
        PF: "PF",

        CENTER: "C",
        FIVE: "C",
        "5": "C",
        POST: "C",
        BIG: "C",
        C: "C"

    });

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(
            value == null ? "" : value
        )
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/-/g, "_");
    }

    function normalizeSport(value) {
        const sport = normalize(value);

        const aliases = Object.freeze({
            BASKETBALL: "BASKETBALL",
            BASKET_BALL: "BASKETBALL",
            BBALL: "BASKETBALL",
            HOOPS: "BASKETBALL"
        });

        return (
            aliases[sport] ||
            sport ||
            "UNKNOWN"
        );
    }

    function normalizePosition(value) {
        const position = normalize(value);

        if (!position) {
            return null;
        }

        return (
            POSITION_ALIASES[position] ||
            null
        );
    }

    function validateStream9Authority() {
        const authority =
            global.STATScoreStream9Authority;

        if (!authority) {
            return {
                valid: false,
                status:
                    STATUS.AUTHORITY_UNAVAILABLE
            };
        }

        const valid =
            authority.stream_number === 9 &&
            authority.operational_state ===
                "ACTIVE";

        return {
            valid,
            status:
                valid
                    ? "AUTHORIZED"
                    : STATUS.AUTHORITY_UNAUTHORIZED
        };
    }

    function getInputSport(athlete) {
        return normalizeSport(
            athlete?.primary_sport ||
            athlete?.sport ||
            athlete?.raw_payload?.primarySport ||
            athlete?.raw_payload?.primary_sport ||
            athlete?.raw_payload?.sport
        );
    }

    function getRawPosition(athlete) {
        return (
            athlete?.primary_position ||
            athlete?.position ||
            athlete?.verified_position ||
            athlete?.raw_payload?.primaryPosition ||
            athlete?.raw_payload?.primary_position ||
            athlete?.raw_payload?.position ||
            null
        );
    }

    function getInputPosition(athlete) {
        return normalizePosition(
            getRawPosition(athlete)
        );
    }

    function getExplicitArchetype(athlete) {
        return normalize(
            athlete?.archetype ||
            athlete?.position_archetype ||
            athlete?.player_archetype ||
            athlete?.raw_payload?.archetype
        );
    }

    function buildSearchableText(athlete) {
        return [
            athlete?.position_notes,
            athlete?.raw_payload?.notes,
            athlete?.raw_payload?.style,
            athlete?.raw_payload?.strengths,
            athlete?.raw_payload?.weaknesses
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    }

    /*
    ============================================================================
    ARCHETYPE CLASSIFICATION
    ----------------------------------------------------------------------------
    Classification helps choose a basketball interpretation profile.

    Classification itself does NOT create a score.
    ============================================================================
    */

    function inferPointGuardArchetype(text) {
        if (
            text.includes("scoring point guard") ||
            text.includes("score first") ||
            text.includes("scoring guard") ||
            text.includes("shot creator")
        ) {
            return "SCORING_POINT_GUARD";
        }

        if (
            text.includes("defensive point guard") ||
            text.includes("defensive guard") ||
            text.includes("on ball defense") ||
            text.includes("ball pressure")
        ) {
            return "DEFENSIVE_POINT_GUARD";
        }

        return "FLOOR_GENERAL";
    }

    function inferShootingGuardArchetype(text) {
        if (
            text.includes("three and d") ||
            text.includes("3 and d") ||
            text.includes("3-and-d") ||
            text.includes("catch and shoot")
        ) {
            return "THREE_AND_D";
        }

        if (
            text.includes("slashing guard") ||
            text.includes("slasher") ||
            text.includes("rim pressure") ||
            text.includes("downhill")
        ) {
            return "SLASHING_GUARD";
        }

        return "SHOT_CREATOR";
    }

    function inferSmallForwardArchetype(text) {
        if (
            text.includes("scoring wing") ||
            text.includes("three level scorer") ||
            text.includes("three-level scorer")
        ) {
            return "SCORING_WING";
        }

        if (
            text.includes("defensive wing") ||
            text.includes("lockdown wing") ||
            text.includes("defensive specialist")
        ) {
            return "DEFENSIVE_WING";
        }

        return "TWO_WAY_WING";
    }

    function inferPowerForwardArchetype(text) {
        if (
            text.includes("stretch four") ||
            text.includes("stretch 4") ||
            text.includes("pick and pop") ||
            text.includes("floor spacer")
        ) {
            return "STRETCH_FOUR";
        }

        if (
            text.includes("energy forward") ||
            text.includes("energy big") ||
            text.includes("high motor") ||
            text.includes("second chance")
        ) {
            return "ENERGY_FORWARD";
        }

        return "MODERN_FORWARD";
    }

    function inferCenterArchetype(text) {
        if (
            text.includes("post scorer") ||
            text.includes("low post") ||
            text.includes("post offense")
        ) {
            return "POST_SCORER";
        }

        if (
            text.includes("mobile big") ||
            text.includes("rim runner") ||
            text.includes("switch big") ||
            text.includes("mobile center")
        ) {
            return "MOBILE_BIG";
        }

        return "RIM_PROTECTOR";
    }

    function inferArchetype(
        position,
        athlete
    ) {
        const positionProfile =
            BASKETBALL_MATRICES[
                position
            ];

        if (!positionProfile) {
            return null;
        }

        const explicit =
            getExplicitArchetype(
                athlete
            );

        if (
            explicit &&
            positionProfile
                .archetypes[
                    explicit
                ]
        ) {
            return {
                code:
                    explicit,

                source:
                    "EXPLICIT"
            };
        }

        const text =
            buildSearchableText(
                athlete
            );

        let code =
            positionProfile
                .default_archetype;

        if (position === "PG") {
            code =
                inferPointGuardArchetype(
                    text
                );
        }

        if (position === "SG") {
            code =
                inferShootingGuardArchetype(
                    text
                );
        }

        if (position === "SF") {
            code =
                inferSmallForwardArchetype(
                    text
                );
        }

        if (position === "PF") {
            code =
                inferPowerForwardArchetype(
                    text
                );
        }

        if (position === "C") {
            code =
                inferCenterArchetype(
                    text
                );
        }

        return {
            code,

            source:
                text
                    ? "TEXT_INFERRED"
                    : "DEFAULT_ARCHETYPE_CLASSIFICATION"
        };
    }

    function getArchetypeDefinition(
        position,
        archetypeCode
    ) {
        const profile =
            BASKETBALL_MATRICES[
                position
            ];

        if (!profile) {
            return null;
        }

        return (
            profile.archetypes[
                archetypeCode
            ] ||
            null
        );
    }

    function buildTraitContract(
        traitName
    ) {
        return {
            trait_key:
                traitName,

            value:
                null,

            confidence:
                null,

            verification_status:
                "UNKNOWN",

            status:
                "EVIDENCE_REQUIRED",

            official:
                false,

            evidence_used:
                [],

            missing_evidence: [
                "TRAIT_EVIDENCE"
            ],

            flags:
                []
        };
    }

    function resolveMatrix(
        athlete = {},
        options = {}
    ) {
        lastError = null;

        try {
            if (
                !athlete ||
                typeof athlete !==
                    "object"
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.INVALID_INPUT,

                    official:
                        false,

                    athlete_id:
                        null,

                    snapshot_id:
                        null,

                    sport:
                        SPORT,

                    flags: [
                        "ATHLETE_INPUT_REQUIRED"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const authority =
                validateStream9Authority();

            if (!authority.valid) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        authority.status,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport:
                        getInputSport(
                            athlete
                        ),

                    flags: [
                        authority.status
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const sport =
                getInputSport(
                    athlete
                );

            if (
                sport !== SPORT
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.UNSUPPORTED_SPORT,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport,

                    flags: [
                        "BASKETBALL_POSITION_AUTHORITY_REQUIRES_BASKETBALL_SPORT"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const rawPosition =
                getRawPosition(
                    athlete
                );

            if (!rawPosition) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.POSITION_REQUIRED,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport:
                        SPORT,

                    position:
                        null,

                    missing_evidence: [
                        "position"
                    ],

                    flags: [
                        "BASKETBALL_POSITION_REQUIRED"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const position =
                getInputPosition(
                    athlete
                );

            if (!position) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.UNSUPPORTED_POSITION,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport:
                        SPORT,

                    position:
                        normalize(
                            rawPosition
                        ),

                    flags: [
                        "BASKETBALL_POSITION_NOT_REGISTERED"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const positionProfile =
                BASKETBALL_MATRICES[
                    position
                ];

            if (!positionProfile) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.UNSUPPORTED_POSITION,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport:
                        SPORT,

                    position,

                    flags: [
                        "BASKETBALL_POSITION_PROFILE_UNAVAILABLE"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const requestedArchetype =
                normalize(
                    options.archetype ||
                    getExplicitArchetype(
                        athlete
                    )
                );

            let archetypeResolution;

            if (requestedArchetype) {
                if (
                    positionProfile
                        .archetypes[
                            requestedArchetype
                        ]
                ) {
                    archetypeResolution = {
                        code:
                            requestedArchetype,

                        source:
                            "EXPLICIT"
                    };
                } else {
                    archetypeResolution =
                        inferArchetype(
                            position,
                            athlete
                        );
                }
            } else {
                archetypeResolution =
                    inferArchetype(
                        position,
                        athlete
                    );
            }

            if (
                !archetypeResolution ||
                !archetypeResolution.code
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.UNSUPPORTED_ARCHETYPE,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport:
                        SPORT,

                    position,

                    flags: [
                        "BASKETBALL_ARCHETYPE_UNAVAILABLE"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const archetype =
                getArchetypeDefinition(
                    position,
                    archetypeResolution.code
                );

            if (!archetype) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS.UNSUPPORTED_ARCHETYPE,

                    official:
                        false,

                    athlete_id:
                        athlete.athlete_id ||
                        null,

                    snapshot_id:
                        athlete.snapshot_id ||
                        null,

                    sport:
                        SPORT,

                    position,

                    archetype_code:
                        archetypeResolution.code,

                    flags: [
                        "BASKETBALL_ARCHETYPE_NOT_REGISTERED"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const traits = {};

            archetype.traits
                .forEach(
                    function (traitName) {
                        traits[traitName] =
                            buildTraitContract(
                                traitName
                            );
                    }
                );

            const flags = [];

            if (
                archetypeResolution.source !==
                "EXPLICIT"
            ) {
                flags.push(
                    "ARCHETYPE_CLASSIFICATION_NOT_EXPLICIT"
                );
            }

            const result = {
                ok:
                    true,

                authority:
                    ENGINE_ID,

                authority_key:
                    "BASKETBALL_POSITION_MATRIX_AUTHORITY",

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SUPPORTING_SPORT_POSITION_INTELLIGENCE",

                official:
                    false,

                athlete_id:
                    athlete.athlete_id ||
                    null,

                snapshot_id:
                    athlete.snapshot_id ||
                    null,

                sport:
                    SPORT,

                position: {
                    code:
                        position,

                    label:
                        positionProfile
                            .position_label,

                    source_value:
                        rawPosition
                },

                archetype: {
                    code:
                        archetypeResolution
                            .code,

                    label:
                        archetype.label,

                    source:
                        archetypeResolution
                            .source,

                    confidence:
                        null,

                    confidence_status:
                        "CONFIDENCE_AUTHORITY_REQUIRED"
                },

                matrix: {
                    matrix_code:
                        archetype.matrix_code,

                    matrix_version:
                        VERSION,

                    role:
                        "BASKETBALL_POSITION_TRAIT_VOCABULARY",

                    official_domain_matrix:
                        false
                },

                trait_keys:
                    Array.from(
                        archetype.traits
                    ),

                traits,

                status:
                    STATUS.AVAILABLE,

                flags,

                downstream_release: {
                    athletic_score:
                        "NOT_PUBLISHED",

                    production_score:
                        "NOT_PUBLISHED",

                    competition_score:
                        "NOT_PUBLISHED",

                    verification_score:
                        "NOT_PUBLISHED",

                    academic_score:
                        "NOT_PUBLISHED",

                    position_score:
                        "NOT_PUBLISHED",

                    final_score:
                        "NOT_PUBLISHED",

                    star_rating:
                        "NOT_PUBLISHED",

                    statscore:
                        "NOT_PUBLISHED",

                    composite:
                        "NOT_PUBLISHED"
                },

                explanation: {
                    summary:
                        `Basketball position authority resolved ${positionProfile.position_label} / ${archetype.label} using ${archetype.matrix_code}. This authority defines basketball position/archetype trait science only and does not publish official athlete scoring.`,

                    factors: [
                        "Basketball sport context confirmed.",
                        "Basketball position normalized to governed position authority.",
                        "Supported basketball archetype resolved.",
                        "Basketball trait vocabulary exposed without manufacturing trait values."
                    ],

                    limitations: [
                        "Trait values remain null until governed evidence is interpreted by the Basketball Sport Intelligence Authority.",
                        "Position or archetype classification does not create Athletic Score.",
                        "Position or archetype classification does not create Production Score.",
                        "Position or archetype classification does not create STATScore™.",
                        "Verification and confidence remain separate downstream authorities.",
                        "Composite Intelligence remains subordinate to independent domain intelligence."
                    ],

                    downstream_authorities: {
                        basketball_sport_intelligence:
                            "BASKETBALL_SPORT_INTELLIGENCE",

                        athletic:
                            "ATHLETIC_MATRIX",

                        production:
                            "PRODUCTION_MATRIX",

                        competition:
                            "COMPETITION_MATRIX",

                        verification:
                            "VERIFICATION_MATRIX",

                        score_publisher:
                            "SCORE_AUTHORITY",

                        composite:
                            "COMPOSITE_AUTHORITY"
                    }
                },

                generated_at:
                    nowISO()
            };

            lastResult = result;
            return result;

        } catch (error) {
            lastError = {
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),

                generated_at:
                    nowISO()
            };

            const result = {
                ok:
                    false,

                authority:
                    ENGINE_ID,

                authority_key:
                    "BASKETBALL_POSITION_MATRIX_AUTHORITY",

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                status:
                    STATUS.ERROR,

                official:
                    false,

                athlete_id:
                    athlete?.athlete_id ||
                    null,

                snapshot_id:
                    athlete?.snapshot_id ||
                    null,

                sport:
                    SPORT,

                flags: [
                    "BASKETBALL_POSITION_MATRIX_EXECUTION_ERROR"
                ],

                error:
                    lastError.message,

                generated_at:
                    nowISO()
            };

            lastResult = result;
            return result;
        }
    }

    /*
    ============================================================================
    COMPATIBILITY METHOD
    ----------------------------------------------------------------------------
    Historical consumers may still call getMatrix().

    This method now returns the governed V2 structured position/archetype
    authority result. It does not restore DOM rendering or hidden scoring.
    ============================================================================
    */

    function getMatrix(
        athlete = {}
    ) {
        return resolveMatrix(
            athlete
        );
    }

    function getPositionDefinition(
        position
    ) {
        const normalizedPosition =
            normalizePosition(
                position
            );

        if (!normalizedPosition) {
            return null;
        }

        const definition =
            BASKETBALL_MATRICES[
                normalizedPosition
            ];

        if (!definition) {
            return null;
        }

        return {
            position_code:
                definition
                    .position_code,

            position_label:
                definition
                    .position_label,

            default_archetype:
                definition
                    .default_archetype,

            archetypes:
                Object.keys(
                    definition
                        .archetypes
                )
        };
    }

    function getArchetype(
        position,
        archetypeCode
    ) {
        const normalizedPosition =
            normalizePosition(
                position
            );

        if (!normalizedPosition) {
            return null;
        }

        const profile =
            BASKETBALL_MATRICES[
                normalizedPosition
            ];

        if (!profile) {
            return null;
        }

        const normalizedArchetype =
            normalize(
                archetypeCode
            );

        const selected =
            profile.archetypes[
                normalizedArchetype
            ];

        if (!selected) {
            return null;
        }

        return {
            sport:
                SPORT,

            position:
                normalizedPosition,

            archetype_code:
                normalizedArchetype,

            archetype:
                selected.label,

            matrix_code:
                selected.matrix_code,

            matrix_version:
                VERSION,

            traits:
                Array.from(
                    selected.traits
                )
        };
    }

    function listPositions() {
        return Object.keys(
            BASKETBALL_MATRICES
        )
            .map(
                function (position) {
                    const definition =
                        BASKETBALL_MATRICES[
                            position
                        ];

                    return {
                        position_code:
                            position,

                        position_label:
                            definition
                                .position_label,

                        default_archetype:
                            definition
                                .default_archetype,

                        archetypes:
                            Object.keys(
                                definition
                                    .archetypes
                            )
                    };
                }
            );
    }

    function listArchetypes(
        position
    ) {
        const normalizedPosition =
            normalizePosition(
                position
            );

        if (!normalizedPosition) {
            return [];
        }

        const profile =
            BASKETBALL_MATRICES[
                normalizedPosition
            ];

        if (!profile) {
            return [];
        }

        return Object.keys(
            profile.archetypes
        )
            .map(
                function (code) {
                    const archetype =
                        profile.archetypes[
                            code
                        ];

                    return {
                        archetype_code:
                            code,

                        label:
                            archetype.label,

                        matrix_code:
                            archetype
                                .matrix_code,

                        traits:
                            Array.from(
                                archetype
                                    .traits
                            )
                    };
                }
            );
    }

    function getContract() {
        return {
            authority_key:
                "BASKETBALL_POSITION_MATRIX_AUTHORITY",

            authority:
                ENGINE_ID,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            classification:
                "SUPPORTING_SPORT_POSITION_INTELLIGENCE",

            official_score_publisher:
                false,

            responsibilities: [
                "Normalize basketball position.",
                "Resolve supported basketball position authority.",
                "Resolve supported basketball archetype.",
                "Expose versioned basketball trait vocabulary.",
                "Return structured position/archetype interpretation."
            ],

            prohibited_responsibilities: [
                "Official Athletic Score calculation.",
                "Official Production Score calculation.",
                "Official Competition Score calculation.",
                "Official Verification Score calculation.",
                "Official Academic Score calculation.",
                "Official Position Score calculation.",
                "Official STATScore calculation.",
                "Composite calculation.",
                "Trait baseline generation.",
                "Missing evidence fabrication.",
                "Confidence calculation.",
                "Verification authority.",
                "Star rating publication.",
                "DOM rendering.",
                "Automatic page-load execution."
            ],

            required_input: [
                "sport",
                "position"
            ],

            optional_input: [
                "athlete_id",
                "snapshot_id",
                "archetype",
                "position_notes",
                "raw_payload"
            ],

            output: [
                "sport",
                "position",
                "archetype",
                "matrix",
                "trait_keys",
                "traits",
                "status",
                "flags",
                "explanation",
                "generated_at"
            ],

            execution_rule:
                "Explicit invocation only. Loading this file performs no athlete interpretation.",

            presentation_rule:
                "No DOM or UI rendering is permitted inside this authority.",

            missing_authority_rule:
                "Unknown basketball positions or archetypes may not be silently replaced with a default position authority."
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            positions:
                listPositions(),

            position_aliases:
                POSITION_ALIASES,

            automatic_execution:
                false,

            dom_rendering:
                false,

            official_score_publication:
                false
        };
    }

    function getLastResult() {
        return lastResult;
    }

    function getLastError() {
        return lastError;
    }

    function runHealthCheck() {
        const authority =
            validateStream9Authority();

        const missingDefaultArchetypes =
            [];

        const emptyTraitMatrices =
            [];

        const duplicateMatrixCodes =
            [];

        const matrixCodes =
            [];

        Object.keys(
            BASKETBALL_MATRICES
        )
            .forEach(
                function (position) {
                    const profile =
                        BASKETBALL_MATRICES[
                            position
                        ];

                    if (
                        !profile
                            .default_archetype ||
                        !profile
                            .archetypes[
                                profile
                                    .default_archetype
                            ]
                    ) {
                        missingDefaultArchetypes
                            .push(
                                position
                            );
                    }

                    Object.keys(
                        profile.archetypes
                    )
                        .forEach(
                            function (code) {
                                const archetype =
                                    profile
                                        .archetypes[
                                            code
                                        ];

                                if (
                                    !Array.isArray(
                                        archetype
                                            .traits
                                    ) ||
                                    archetype
                                        .traits
                                        .length ===
                                        0
                                ) {
                                    emptyTraitMatrices
                                        .push(
                                            `${position}:${code}`
                                        );
                                }

                                if (
                                    matrixCodes
                                        .includes(
                                            archetype
                                                .matrix_code
                                        )
                                ) {
                                    duplicateMatrixCodes
                                        .push(
                                            archetype
                                                .matrix_code
                                        );
                                } else {
                                    matrixCodes
                                        .push(
                                            archetype
                                                .matrix_code
                                        );
                                }
                            }
                        );
                }
            );

        const healthy =
            authority.valid &&
            missingDefaultArchetypes
                .length === 0 &&
            emptyTraitMatrices
                .length === 0 &&
            duplicateMatrixCodes
                .length === 0;

        return {
            authority:
                ENGINE_ID,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                healthy
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_9_authority:
                authority,

            positions_registered:
                Object.keys(
                    BASKETBALL_MATRICES
                ).length,

            matrix_codes_registered:
                matrixCodes.length,

            missing_default_archetypes:
                missingDefaultArchetypes,

            empty_trait_matrices:
                emptyTraitMatrices,

            duplicate_matrix_codes:
                duplicateMatrixCodes,

            auto_execution:
                false,

            dom_rendering:
                false,

            trait_value_fabrication:
                false,

            silent_position_fallback:
                false,

            official_score_publication:
                false,

            generated_at:
                nowISO()
        };
    }

    const BasketballPositionMatrixAuthority =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            authority_key:
                "BASKETBALL_POSITION_MATRIX_AUTHORITY",

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            status:
                "ACTIVE",

            classification:
                "SUPPORTING_SPORT_POSITION_INTELLIGENCE_AUTHORITY",

            official_score_publisher:
                false,

            matrices:
                BASKETBALL_MATRICES,

            normalize,

            normalizeSport,

            normalizePosition,

            inferArchetype,

            resolveMatrix,

            getMatrix,

            getPositionDefinition,

            getArchetype,

            listPositions,

            listArchetypes,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScoreBasketballPositionMatrix =
        BasketballPositionMatrixAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.BasketballPositionMatrix =
        BasketballPositionMatrixAuthority;

    console.info(
        "[STATS-CORE] Basketball Position Matrix Authority loaded:",
        VERSION,
        "| explicit invocation required | DOM rendering disabled | official scoring disabled"
    );

})(window); 
