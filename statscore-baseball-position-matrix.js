/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-baseball-position-matrix.js
*
* Canonical Classification:
*     SUPPORTING SPORT / POSITION INTELLIGENCE AUTHORITY
*
* Production Role:
*     Baseball position and archetype interpretation authority.
*
* Purpose:
*     Baseball
*         ↓
*     Governed Position Classification
*         ↓
*     Governed Archetype Classification
*         ↓
*     Baseball Trait Vocabulary
*         ↓
*     Baseball Sport Intelligence
*         ↓
*     Registered Stream 9 Domain Matrices
*
* Constitutional Boundaries:
*     This authority DOES:
*       - normalize baseball positions;
*       - preserve position aliases;
*       - resolve baseball position groups;
*       - resolve supported baseball archetypes;
*       - expose position/archetype trait vocabulary;
*       - expose versioned supporting baseball matrix definitions;
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
*     STATSCORE-BASEBALL-POSITION-MATRIX-V2
*
* Contract Version:
*     STATSCORE-BASEBALL-POSITION-MATRIX-CONTRACT-V1
*
* Status:
*     PRODUCTION RECONSTRUCTION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID = "statscore-baseball-position-matrix";
    const VERSION = "STATSCORE-BASEBALL-POSITION-MATRIX-V2";
    const CONTRACT_VERSION = "STATSCORE-BASEBALL-POSITION-MATRIX-CONTRACT-V1";

    const STREAM_OWNER = "STATSCORE_STREAM_9";
    const SPORT = "BASEBALL";

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
    CANONICAL BASEBALL POSITION / ARCHETYPE SCIENCE
    ----------------------------------------------------------------------------
    These definitions establish baseball-specific position interpretation and
    trait vocabulary only.

    They do NOT create official athlete scores.
    They do NOT supply missing trait values.
    They do NOT manufacture performance baselines.
    ============================================================================
    */

    const BASEBALL_MATRICES = Object.freeze({

        P: Object.freeze({
            position_code: "P",
            position_label: "Pitcher",
            default_archetype: "COMMAND_PITCHER",

            archetypes: Object.freeze({

                POWER_PITCHER: Object.freeze({
                    label: "Power Pitcher",
                    matrix_code: "BB_P_POWER_PITCHER_MATRIX_V2",

                    traits: Object.freeze([
                        "VELOCITY",
                        "FASTBALL_LIFE",
                        "STRIKE_THROWING",
                        "SECONDARY_STUFF",
                        "COMMAND",
                        "MOUND_PRESENCE",
                        "DURABILITY",
                        "SWING_AND_MISS_ABILITY"
                    ])
                }),

                COMMAND_PITCHER: Object.freeze({
                    label: "Command Pitcher",
                    matrix_code: "BB_P_COMMAND_MATRIX_V2",

                    traits: Object.freeze([
                        "COMMAND",
                        "PITCHABILITY",
                        "STRIKE_THROWING",
                        "SECONDARY_CONTROL",
                        "TEMPO",
                        "FIELDING_POSITION",
                        "MOUND_PRESENCE",
                        "RUN_PREVENTION"
                    ])
                }),

                BREAKING_BALL_SPECIALIST: Object.freeze({
                    label: "Breaking Ball Specialist",
                    matrix_code: "BB_P_BREAKING_BALL_MATRIX_V2",

                    traits: Object.freeze([
                        "BREAKING_BALL_QUALITY",
                        "SPIN_PROFILE",
                        "PITCH_SEQUENCING",
                        "COMMAND",
                        "SWING_AND_MISS_ABILITY",
                        "DECEPTION",
                        "SECONDARY_STUFF",
                        "COMPOSURE"
                    ])
                })

            })
        }),

        C: Object.freeze({
            position_code: "C",
            position_label: "Catcher",
            default_archetype: "DEFENSIVE_CATCHER",

            archetypes: Object.freeze({

                DEFENSIVE_CATCHER: Object.freeze({
                    label: "Defensive Catcher",
                    matrix_code: "BB_C_DEFENSIVE_MATRIX_V2",

                    traits: Object.freeze([
                        "RECEIVING",
                        "BLOCKING",
                        "THROWING_ARM",
                        "POP_TIME",
                        "GAME_MANAGEMENT",
                        "PITCHER_HANDLING",
                        "LEADERSHIP",
                        "DURABILITY"
                    ])
                }),

                OFFENSIVE_CATCHER: Object.freeze({
                    label: "Offensive Catcher",
                    matrix_code: "BB_C_OFFENSIVE_MATRIX_V2",

                    traits: Object.freeze([
                        "HIT_TOOL",
                        "POWER",
                        "PLATE_DISCIPLINE",
                        "CONTACT_QUALITY",
                        "RECEIVING",
                        "THROWING_ARM",
                        "GAME_MANAGEMENT",
                        "DURABILITY"
                    ])
                })

            })
        }),

        INF: Object.freeze({
            position_code: "INF",
            position_label: "Infielder",
            default_archetype: "COMPLETE_INFIELDER",

            archetypes: Object.freeze({

                COMPLETE_INFIELDER: Object.freeze({
                    label: "Complete Infielder",
                    matrix_code: "BB_INF_COMPLETE_MATRIX_V2",

                    traits: Object.freeze([
                        "HANDS",
                        "FOOTWORK",
                        "ARM_STRENGTH",
                        "RANGE",
                        "TRANSFER",
                        "BASEBALL_IQ",
                        "CONTACT_ABILITY",
                        "DEFENSIVE_RELIABILITY"
                    ])
                }),

                MIDDLE_INFIELDER: Object.freeze({
                    label: "Middle Infielder",
                    matrix_code: "BB_INF_MIDDLE_MATRIX_V2",

                    traits: Object.freeze([
                        "RANGE",
                        "HANDS",
                        "FOOTWORK",
                        "TRANSFER",
                        "ARM_ACCURACY",
                        "DOUBLE_PLAY_ABILITY",
                        "BASEBALL_IQ",
                        "CONTACT_ABILITY"
                    ])
                }),

                CORNER_INFIELDER: Object.freeze({
                    label: "Corner Infielder",
                    matrix_code: "BB_INF_CORNER_MATRIX_V2",

                    traits: Object.freeze([
                        "REACTION",
                        "ARM_STRENGTH",
                        "HANDS",
                        "POWER",
                        "CONTACT_QUALITY",
                        "DEFENSIVE_RELIABILITY",
                        "FOOTWORK",
                        "RUN_PRODUCTION"
                    ])
                })

            })
        }),

        OF: Object.freeze({
            position_code: "OF",
            position_label: "Outfielder",
            default_archetype: "COMPLETE_OUTFIELDER",

            archetypes: Object.freeze({

                COMPLETE_OUTFIELDER: Object.freeze({
                    label: "Complete Outfielder",
                    matrix_code: "BB_OF_COMPLETE_MATRIX_V2",

                    traits: Object.freeze([
                        "ROUTE_EFFICIENCY",
                        "FIRST_STEP",
                        "RANGE",
                        "ARM_STRENGTH",
                        "BALL_TRACKING",
                        "SPEED",
                        "CONTACT_ABILITY",
                        "DEFENSIVE_RELIABILITY"
                    ])
                }),

                CENTER_FIELDER: Object.freeze({
                    label: "Center Fielder",
                    matrix_code: "BB_OF_CENTER_FIELD_MATRIX_V2",

                    traits: Object.freeze([
                        "RANGE",
                        "FIRST_STEP",
                        "ROUTE_EFFICIENCY",
                        "SPEED",
                        "BALL_TRACKING",
                        "COMMUNICATION",
                        "ARM_ACCURACY",
                        "TOP_OF_ORDER_VALUE"
                    ])
                }),

                POWER_CORNER_OF: Object.freeze({
                    label: "Power Corner Outfielder",
                    matrix_code: "BB_OF_POWER_CORNER_MATRIX_V2",

                    traits: Object.freeze([
                        "POWER",
                        "ARM_STRENGTH",
                        "CONTACT_QUALITY",
                        "RUN_PRODUCTION",
                        "ROUTE_EFFICIENCY",
                        "BALL_TRACKING",
                        "DEFENSIVE_RELIABILITY",
                        "PLATE_DISCIPLINE"
                    ])
                })

            })
        }),

        HITTER: Object.freeze({
            position_code: "HITTER",
            position_label: "Hitter",
            default_archetype: "COMPLETE_HITTER",

            archetypes: Object.freeze({

                COMPLETE_HITTER: Object.freeze({
                    label: "Complete Hitter",
                    matrix_code: "BB_HITTER_COMPLETE_MATRIX_V2",

                    traits: Object.freeze([
                        "HIT_TOOL",
                        "POWER",
                        "PLATE_DISCIPLINE",
                        "CONTACT_QUALITY",
                        "APPROACH",
                        "SITUATIONAL_HITTING",
                        "RUN_PRODUCTION",
                        "CONSISTENCY"
                    ])
                }),

                CONTACT_HITTER: Object.freeze({
                    label: "Contact Hitter",
                    matrix_code: "BB_HITTER_CONTACT_MATRIX_V2",

                    traits: Object.freeze([
                        "CONTACT_ABILITY",
                        "BAT_TO_BALL_SKILL",
                        "PLATE_DISCIPLINE",
                        "APPROACH",
                        "SITUATIONAL_HITTING",
                        "SPEED",
                        "CONSISTENCY",
                        "ON_BASE_VALUE"
                    ])
                }),

                POWER_HITTER: Object.freeze({
                    label: "Power Hitter",
                    matrix_code: "BB_HITTER_POWER_MATRIX_V2",

                    traits: Object.freeze([
                        "POWER",
                        "EXIT_VELOCITY",
                        "LAUNCH_PROFILE",
                        "CONTACT_QUALITY",
                        "RUN_PRODUCTION",
                        "PLATE_DISCIPLINE",
                        "PITCH_RECOGNITION",
                        "DAMAGE_POTENTIAL"
                    ])
                })

            })
        }),

        UTIL: Object.freeze({
            position_code: "UTIL",
            position_label: "Utility Player",
            default_archetype: "UTILITY_PLAYER",

            archetypes: Object.freeze({

                UTILITY_PLAYER: Object.freeze({
                    label: "Utility Player",
                    matrix_code: "BB_UTIL_MATRIX_V2",

                    traits: Object.freeze([
                        "VERSATILITY",
                        "BASEBALL_IQ",
                        "DEFENSIVE_RELIABILITY",
                        "CONTACT_ABILITY",
                        "ATHLETICISM",
                        "ARM_UTILITY",
                        "SPEED",
                        "ROLE_ADAPTABILITY"
                    ])
                })

            })
        })

    });

    /*
    ============================================================================
    POSITION ALIASES
    ============================================================================
    */

    const POSITION_ALIASES = Object.freeze({

        PITCHER: "P",
        P: "P",

        CATCHER: "C",
        C: "C",

        FIRST_BASE: "INF",
        FIRST_BASEMAN: "INF",
        "1B": "INF",

        SECOND_BASE: "INF",
        SECOND_BASEMAN: "INF",
        "2B": "INF",

        THIRD_BASE: "INF",
        THIRD_BASEMAN: "INF",
        "3B": "INF",

        SHORTSTOP: "INF",
        SS: "INF",

        INFIELDER: "INF",
        INFIELD: "INF",
        INF: "INF",

        LEFT_FIELD: "OF",
        LF: "OF",

        CENTER_FIELD: "OF",
        CENTER_FIELDER: "OF",
        CF: "OF",

        RIGHT_FIELD: "OF",
        RF: "OF",

        OUTFIELDER: "OF",
        OUTFIELD: "OF",
        OF: "OF",

        DESIGNATED_HITTER: "HITTER",
        DH: "HITTER",

        HITTER: "HITTER",

        UTILITY: "UTIL",
        UTILITY_PLAYER: "UTIL",
        UTIL: "UTIL"

    });

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(value == null ? "" : value)
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/-/g, "_");
    }

    function normalizeSport(value) {
        const sport = normalize(value);

        const aliases = Object.freeze({
            BASEBALL: "BASEBALL",
            BASE_BALL: "BASEBALL",
            BB: "BASEBALL"
        });

        return aliases[sport] || sport || "UNKNOWN";
    }

    function normalizePosition(value) {
        const position = normalize(value);

        if (!position) {
            return null;
        }

        return POSITION_ALIASES[position] || null;
    }

    function validateStream9Authority() {
        const authority = global.STATScoreStream9Authority;

        if (!authority) {
            return {
                valid: false,
                status: STATUS.AUTHORITY_UNAVAILABLE
            };
        }

        const valid =
            authority.stream_number === 9 &&
            authority.operational_state === "ACTIVE";

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
    ARCHETYPE INFERENCE
    ----------------------------------------------------------------------------
    Archetype inference classifies the athlete into a supported baseball
    interpretation profile.

    It does not score the athlete.

    Inferred archetypes are explicitly identified as inferred rather than
    authoritative facts.
    ============================================================================
    */

    function inferPitcherArchetype(text) {
        if (
            text.includes("velocity") ||
            text.includes("power arm") ||
            text.includes("power pitcher") ||
            text.includes("high velo")
        ) {
            return "POWER_PITCHER";
        }

        if (
            text.includes("breaking ball") ||
            text.includes("slider") ||
            text.includes("curveball") ||
            text.includes("spin")
        ) {
            return "BREAKING_BALL_SPECIALIST";
        }

        return "COMMAND_PITCHER";
    }

    function inferCatcherArchetype(text) {
        if (
            text.includes("offensive catcher") ||
            text.includes("power bat") ||
            text.includes("hit tool") ||
            text.includes("offense")
        ) {
            return "OFFENSIVE_CATCHER";
        }

        return "DEFENSIVE_CATCHER";
    }

    function inferInfielderArchetype(text) {
        if (
            text.includes("shortstop") ||
            text.includes("second base") ||
            text.includes("middle infield") ||
            text.includes("middle infielder")
        ) {
            return "MIDDLE_INFIELDER";
        }

        if (
            text.includes("first base") ||
            text.includes("third base") ||
            text.includes("corner infield") ||
            text.includes("corner infielder")
        ) {
            return "CORNER_INFIELDER";
        }

        return "COMPLETE_INFIELDER";
    }

    function inferOutfielderArchetype(text) {
        if (
            text.includes("center field") ||
            text.includes("centerfielder") ||
            text.includes("center fielder")
        ) {
            return "CENTER_FIELDER";
        }

        if (
            text.includes("corner outfield") ||
            text.includes("power corner") ||
            text.includes("power bat")
        ) {
            return "POWER_CORNER_OF";
        }

        return "COMPLETE_OUTFIELDER";
    }

    function inferHitterArchetype(text) {
        if (
            text.includes("contact hitter") ||
            text.includes("bat to ball") ||
            text.includes("contact-oriented")
        ) {
            return "CONTACT_HITTER";
        }

        if (
            text.includes("power hitter") ||
            text.includes("slugger") ||
            text.includes("home run power")
        ) {
            return "POWER_HITTER";
        }

        return "COMPLETE_HITTER";
    }

    function inferArchetype(position, athlete) {
        const profile = BASEBALL_MATRICES[position];

        if (!profile) {
            return null;
        }

        const explicit = getExplicitArchetype(athlete);

        if (
            explicit &&
            profile.archetypes[explicit]
        ) {
            return {
                code: explicit,
                source: "EXPLICIT"
            };
        }

        const text = buildSearchableText(athlete);

        let code = profile.default_archetype;

        if (position === "P") {
            code = inferPitcherArchetype(text);
        }

        if (position === "C") {
            code = inferCatcherArchetype(text);
        }

        if (position === "INF") {
            code = inferInfielderArchetype(text);
        }

        if (position === "OF") {
            code = inferOutfielderArchetype(text);
        }

        if (position === "HITTER") {
            code = inferHitterArchetype(text);
        }

        if (position === "UTIL") {
            code = "UTILITY_PLAYER";
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
            BASEBALL_MATRICES[position];

        if (!profile) {
            return null;
        }

        return (
            profile.archetypes[archetypeCode] ||
            null
        );
    }

    function buildTraitContract(traitName) {
        return {
            trait_key: traitName,
            value: null,
            confidence: null,
            verification_status: "UNKNOWN",
            status: "EVIDENCE_REQUIRED",
            official: false,
            evidence_used: [],
            missing_evidence: [
                "TRAIT_EVIDENCE"
            ],
            flags: []
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
                typeof athlete !== "object"
            ) {
                const result = {
                    ok: false,
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
                    sport:
                        SPORT,
                    athlete_id:
                        null,
                    snapshot_id:
                        null,
                    generated_at:
                        nowISO(),
                    flags: [
                        "ATHLETE_INPUT_REQUIRED"
                    ]
                };

                lastResult = result;

                return result;
            }

            const authority =
                validateStream9Authority();

            if (!authority.valid) {
                const result = {
                    ok: false,
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
                    sport:
                        getInputSport(athlete),
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    generated_at:
                        nowISO(),
                    flags: [
                        authority.status
                    ]
                };

                lastResult = result;

                return result;
            }

            const sport =
                getInputSport(athlete);

            if (sport !== SPORT) {
                const result = {
                    ok: false,
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
                    sport,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    generated_at:
                        nowISO(),
                    flags: [
                        "BASEBALL_POSITION_AUTHORITY_REQUIRES_BASEBALL_SPORT"
                    ]
                };

                lastResult = result;

                return result;
            }

            const rawPosition =
                getRawPosition(athlete);

            if (!rawPosition) {
                const result = {
                    ok: false,
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
                    sport:
                        SPORT,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    position:
                        null,
                    generated_at:
                        nowISO(),
                    missing_evidence: [
                        "position"
                    ],
                    flags: [
                        "BASEBALL_POSITION_REQUIRED"
                    ]
                };

                lastResult = result;

                return result;
            }

            const position =
                getInputPosition(athlete);

            if (!position) {
                const result = {
                    ok: false,
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
                    sport:
                        SPORT,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    position:
                        normalize(rawPosition),
                    generated_at:
                        nowISO(),
                    flags: [
                        "BASEBALL_POSITION_NOT_REGISTERED"
                    ]
                };

                lastResult = result;

                return result;
            }

            const positionProfile =
                BASEBALL_MATRICES[position];

            if (!positionProfile) {
                const result = {
                    ok: false,
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
                    sport:
                        SPORT,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    position,
                    generated_at:
                        nowISO(),
                    flags: [
                        "BASEBALL_POSITION_PROFILE_UNAVAILABLE"
                    ]
                };

                lastResult = result;

                return result;
            }

            let archetypeResolution;

            const requestedArchetype =
                normalize(
                    options.archetype ||
                    getExplicitArchetype(athlete)
                );

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
                    ok: false,
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
                    sport:
                        SPORT,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    position,
                    generated_at:
                        nowISO(),
                    flags: [
                        "BASEBALL_ARCHETYPE_UNAVAILABLE"
                    ]
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
                    ok: false,
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
                    sport:
                        SPORT,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    position,
                    archetype_code:
                        archetypeResolution.code,
                    generated_at:
                        nowISO(),
                    flags: [
                        "BASEBALL_ARCHETYPE_NOT_REGISTERED"
                    ]
                };

                lastResult = result;

                return result;
            }

            const traits = {};

            archetype.traits.forEach(
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
                ok: true,

                authority:
                    ENGINE_ID,

                authority_key:
                    "BASEBALL_POSITION_MATRIX_AUTHORITY",

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
                    athlete.athlete_id || null,

                snapshot_id:
                    athlete.snapshot_id || null,

                sport:
                    SPORT,

                position: {
                    code:
                        position,

                    label:
                        positionProfile.position_label,

                    source_value:
                        rawPosition
                },

                archetype: {
                    code:
                        archetypeResolution.code,

                    label:
                        archetype.label,

                    source:
                        archetypeResolution.source,

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
                        "BASEBALL_POSITION_TRAIT_VOCABULARY",

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

                    statscore:
                        "NOT_PUBLISHED",

                    composite:
                        "NOT_PUBLISHED"
                },

                explanation: {
                    summary:
                        `Baseball position authority resolved ${positionProfile.position_label} / ${archetype.label} using ${archetype.matrix_code}. This authority defines baseball position/archetype trait science only and does not publish official athlete scoring.`,

                    factors: [
                        "Baseball sport context confirmed.",
                        "Baseball position normalized to governed position group.",
                        "Supported baseball archetype resolved.",
                        "Trait vocabulary exposed without manufacturing trait values."
                    ],

                    limitations: [
                        "Trait values remain null until governed evidence is interpreted by the proper baseball sport intelligence authority.",
                        "Position/archetype classification does not create Athletic Score.",
                        "Position/archetype classification does not create Production Score.",
                        "Position/archetype classification does not create STATScore™.",
                        "Verification and confidence remain separate downstream authorities."
                    ]
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
                ok: false,

                authority:
                    ENGINE_ID,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                status:
                    STATUS.ERROR,

                official:
                    false,

                athlete_id:
                    athlete?.athlete_id || null,

                snapshot_id:
                    athlete?.snapshot_id || null,

                sport:
                    SPORT,

                flags: [
                    "BASEBALL_POSITION_MATRIX_EXECUTION_ERROR"
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
    Historical consumers may call getMatrix().

    The compatibility method returns the governed V2 structured matrix result.
    It does NOT restore DOM behavior or hidden score generation.
    ============================================================================
    */

    function getMatrix(athlete = {}) {
        return resolveMatrix(
            athlete
        );
    }

    function getPositionDefinition(position) {
        const normalizedPosition =
            normalizePosition(position);

        if (!normalizedPosition) {
            return null;
        }

        const definition =
            BASEBALL_MATRICES[
                normalizedPosition
            ];

        if (!definition) {
            return null;
        }

        return {
            position_code:
                definition.position_code,

            position_label:
                definition.position_label,

            default_archetype:
                definition.default_archetype,

            archetypes:
                Object.keys(
                    definition.archetypes
                )
        };
    }

    function getArchetype(
        position,
        archetypeCode
    ) {
        const normalizedPosition =
            normalizePosition(position);

        if (!normalizedPosition) {
            return null;
        }

        const profile =
            BASEBALL_MATRICES[
                normalizedPosition
            ];

        if (!profile) {
            return null;
        }

        const normalizedArchetype =
            normalize(archetypeCode);

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
            BASEBALL_MATRICES
        ).map(function (position) {
            const definition =
                BASEBALL_MATRICES[position];

            return {
                position_code:
                    position,

                position_label:
                    definition.position_label,

                default_archetype:
                    definition.default_archetype,

                archetypes:
                    Object.keys(
                        definition.archetypes
                    )
            };
        });
    }

    function listArchetypes(position) {
        const normalizedPosition =
            normalizePosition(position);

        if (!normalizedPosition) {
            return [];
        }

        const profile =
            BASEBALL_MATRICES[
                normalizedPosition
            ];

        if (!profile) {
            return [];
        }

        return Object.keys(
            profile.archetypes
        ).map(function (code) {
            const archetype =
                profile.archetypes[code];

            return {
                archetype_code:
                    code,

                label:
                    archetype.label,

                matrix_code:
                    archetype.matrix_code,

                traits:
                    Array.from(
                        archetype.traits
                    )
            };
        });
    }

    function getContract() {
        return {
            authority_key:
                "BASEBALL_POSITION_MATRIX_AUTHORITY",

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
                "Normalize baseball position.",
                "Resolve supported baseball position group.",
                "Resolve supported baseball archetype.",
                "Expose versioned baseball trait vocabulary.",
                "Return structured position/archetype interpretation."
            ],

            prohibited_responsibilities: [
                "Official Athletic Score calculation.",
                "Official Production Score calculation.",
                "Official Competition Score calculation.",
                "Official Verification Score calculation.",
                "Official Academic Score calculation.",
                "Official STATScore calculation.",
                "Composite calculation.",
                "Trait baseline generation.",
                "Missing evidence fabrication.",
                "Confidence calculation.",
                "Verification authority.",
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
                "No DOM or UI rendering is permitted inside this authority."
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

        const missingDefaultArchetypes = [];
        const emptyTraitMatrices = [];
        const duplicateMatrixCodes = [];
        const matrixCodes = [];

        Object.keys(
            BASEBALL_MATRICES
        ).forEach(function (position) {
            const profile =
                BASEBALL_MATRICES[position];

            if (
                !profile.default_archetype ||
                !profile.archetypes[
                    profile.default_archetype
                ]
            ) {
                missingDefaultArchetypes.push(
                    position
                );
            }

            Object.keys(
                profile.archetypes
            ).forEach(function (code) {
                const archetype =
                    profile.archetypes[code];

                if (
                    !Array.isArray(
                        archetype.traits
                    ) ||
                    archetype.traits.length === 0
                ) {
                    emptyTraitMatrices.push(
                        `${position}:${code}`
                    );
                }

                if (
                    matrixCodes.includes(
                        archetype.matrix_code
                    )
                ) {
                    duplicateMatrixCodes.push(
                        archetype.matrix_code
                    );
                } else {
                    matrixCodes.push(
                        archetype.matrix_code
                    );
                }
            });
        });

        const healthy =
            authority.valid &&
            missingDefaultArchetypes.length === 0 &&
            emptyTraitMatrices.length === 0 &&
            duplicateMatrixCodes.length === 0;

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
                    BASEBALL_MATRICES
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

            official_score_publication:
                false,

            generated_at:
                nowISO()
        };
    }

    const BaseballPositionMatrixAuthority = Object.freeze({

        engine_id:
            ENGINE_ID,

        authority_key:
            "BASEBALL_POSITION_MATRIX_AUTHORITY",

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
            BASEBALL_MATRICES,

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

    global.STATScoreBaseballPositionMatrix =
        BaseballPositionMatrixAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.BaseballPositionMatrix =
        BaseballPositionMatrixAuthority;

    console.info(
        "[STATS-CORE] Baseball Position Matrix Authority loaded:",
        VERSION,
        "| explicit invocation required | DOM rendering disabled | official scoring disabled"
    );

})(window); 
