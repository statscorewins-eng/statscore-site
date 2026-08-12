/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-basketball-scoring-engine.js
*
* Canonical Classification:
*     SUPPORTING BASKETBALL SPORT INTELLIGENCE AUTHORITY
*
* Production Role:
*     Interpret governed basketball evidence into structured basketball trait
*     intelligence for downstream Stream 9 domain authorities.
*
* Constitutional Chain:
*
*     Governed Basketball Evidence
*              ↓
*     Basketball Position / Archetype Authority
*              ↓
*     Basketball Trait Interpretation
*              ↓
*     Registered Stream 9 Domain Matrices
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*
* This authority DOES:
*     - consume basketball position/archetype definitions;
*     - interpret direct governed basketball trait evidence;
*     - interpret governed basketball measurables;
*     - preserve raw measurement meaning;
*     - expose evidence used and evidence missing;
*     - preserve verification separately from performance;
*     - optionally generate explicitly PROJECTED benchmark intelligence;
*     - produce explainable supporting basketball intelligence.
*
* This authority DOES NOT:
*     - manufacture missing trait values;
*     - use baseline athlete scores;
*     - increase performance because evidence is verified;
*     - average traits into an official Basketball Score;
*     - publish Athletic Score;
*     - publish Production Score;
*     - publish Competition Score;
*     - publish Verification Score;
*     - publish Academic Score;
*     - publish STATScore™;
*     - publish Composite Intelligence;
*     - publish official stars;
*     - render UI;
*     - manipulate DOM;
*     - execute automatically when loaded.
*
* Governing Doctrine:
*     Evidence ≠ Intelligence
*     Intelligence ≠ Presentation
*     Score ≠ Confidence
*     Verification ≠ Confidence
*     Confidence ≠ Certification
*     PROJECTED ≠ OFFICIAL
*     Missing ≠ Zero
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
*
* Version:
*     STATSCORE-BASKETBALL-INTELLIGENCE-V2
*
* Contract Version:
*     STATSCORE-BASKETBALL-INTELLIGENCE-CONTRACT-V1
*
* Status:
*     PRODUCTION RECONSTRUCTION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID = "statscore-basketball-scoring-engine";
    const AUTHORITY_KEY = "BASKETBALL_SPORT_INTELLIGENCE";
    const VERSION = "STATSCORE-BASKETBALL-INTELLIGENCE-V2";
    const CONTRACT_VERSION = "STATSCORE-BASKETBALL-INTELLIGENCE-CONTRACT-V1";
    const BENCHMARK_VERSION = "STATSCORE-BASKETBALL-BENCHMARK-SCIENCE-V1";

    const STREAM_OWNER = "STATSCORE_STREAM_9";
    const SPORT = "BASKETBALL";

    const STATUS = Object.freeze({
        AVAILABLE: "AVAILABLE",
        PARTIAL: "PARTIAL",
        INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
        PROJECTED: "PROJECTED",
        INVALID_INPUT: "INVALID_INPUT",
        AUTHORITY_UNAVAILABLE: "AUTHORITY_UNAVAILABLE",
        AUTHORITY_UNAUTHORIZED: "AUTHORITY_UNAUTHORIZED",
        POSITION_AUTHORITY_UNAVAILABLE: "POSITION_AUTHORITY_UNAVAILABLE",
        POSITION_CONTRACT_INVALID: "POSITION_CONTRACT_INVALID",
        UNSUPPORTED_SPORT: "UNSUPPORTED_SPORT",
        ERROR: "ERROR"
    });

    const TRAIT_STATUS = Object.freeze({
        EVIDENCE_AVAILABLE: "EVIDENCE_AVAILABLE",
        PROJECTED: "PROJECTED",
        INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE"
    });

    const VERIFICATION_STATUS = Object.freeze({
        VERIFIED: "VERIFIED",
        PARTIAL: "PARTIAL",
        SELF_REPORTED: "SELF_REPORTED",
        UNVERIFIED: "UNVERIFIED",
        PENDING_VERIFICATION: "PENDING_VERIFICATION",
        UNKNOWN: "UNKNOWN"
    });

    /*
    ============================================================================
    BASKETBALL BENCHMARK SCIENCE
    ----------------------------------------------------------------------------
    These benchmark transforms may produce PROJECTED supporting intelligence.

    They do NOT produce official Athletic Score or STATScore™.
    ============================================================================
    */

    const BASKETBALL_BENCHMARKS = Object.freeze({

        VERTICAL_JUMP: Object.freeze({
            unit: "INCHES",
            reference_value: 20,
            projected_floor_signal: 45,
            projected_slope: 1.15
        }),

        BROAD_JUMP: Object.freeze({
            unit: "INCHES",
            reference_value: 60,
            projected_floor_signal: 40,
            projected_slope: 0.38
        }),

        SHUTTLE: Object.freeze({
            unit: "SECONDS",
            reference_value: 4.0,
            projected_slope: 30,
            lower_is_better: true
        })

    });

    const KEYWORD_EVIDENCE_MAP = Object.freeze({

        COURT_VISION: Object.freeze([
            "court vision",
            "vision",
            "sees floor",
            "floor general"
        ]),

        BALL_HANDLING: Object.freeze([
            "ball handling",
            "handle",
            "dribble",
            "pressure handle"
        ]),

        DECISION_MAKING: Object.freeze([
            "decision",
            "decision making",
            "reads",
            "basketball iq"
        ]),

        PICK_AND_ROLL_IQ: Object.freeze([
            "pick and roll",
            "pnr",
            "screen read"
        ]),

        PASSING: Object.freeze([
            "passing",
            "facilitator",
            "assist",
            "playmaker"
        ]),

        LEADERSHIP: Object.freeze([
            "leader",
            "leadership",
            "captain",
            "command"
        ]),

        PACE_CONTROL: Object.freeze([
            "pace",
            "tempo",
            "controls game"
        ]),

        DEFENSIVE_PRESSURE: Object.freeze([
            "defensive pressure",
            "ball pressure",
            "pressure defense"
        ]),

        SHOT_CREATION: Object.freeze([
            "shot creation",
            "shot creator",
            "create off dribble",
            "isolation"
        ]),

        THREE_LEVEL_SCORING: Object.freeze([
            "three level",
            "three-level",
            "scores at all three levels"
        ]),

        BURST: Object.freeze([
            "burst",
            "explosive first step",
            "quick burst"
        ]),

        FINISHING: Object.freeze([
            "finishing",
            "finish",
            "rim finishing",
            "at rim"
        ]),

        PULL_UP_SHOOTING: Object.freeze([
            "pull up",
            "pull-up",
            "off dribble jumper"
        ]),

        PACE_CHANGE: Object.freeze([
            "change of pace",
            "pace change",
            "hesitation"
        ]),

        ON_BALL_DEFENSE: Object.freeze([
            "on ball defense",
            "on-ball defense",
            "point of attack"
        ]),

        LATERAL_QUICKNESS: Object.freeze([
            "lateral quickness",
            "lateral",
            "slides"
        ]),

        BALL_DISRUPTION: Object.freeze([
            "steals",
            "deflections",
            "ball disruption"
        ]),

        COMMUNICATION: Object.freeze([
            "communication",
            "communicator",
            "talks on defense"
        ]),

        TRANSITION_CONTROL: Object.freeze([
            "transition control",
            "transition decision",
            "controls break"
        ]),

        PERIMETER_SHOOTING: Object.freeze([
            "perimeter shooting",
            "three point",
            "3 point",
            "shooter"
        ]),

        OFF_BALL_MOVEMENT: Object.freeze([
            "off ball",
            "off-ball",
            "movement",
            "cutting"
        ]),

        SCORING_EFFICIENCY: Object.freeze([
            "efficient scorer",
            "efficiency",
            "shot selection"
        ]),

        DEFENSIVE_VERSATILITY: Object.freeze([
            "defensive versatility",
            "guards multiple positions",
            "switchable"
        ]),

        TRANSITION: Object.freeze([
            "transition",
            "fast break",
            "open floor"
        ]),

        CLUTCH_SCORING: Object.freeze([
            "clutch",
            "late game",
            "big shot"
        ]),

        CATCH_AND_SHOOT: Object.freeze([
            "catch and shoot",
            "catch-and-shoot",
            "spot up"
        ]),

        OFF_BALL_AWARENESS: Object.freeze([
            "off ball awareness",
            "help positioning",
            "rotation awareness"
        ]),

        SHOT_DISCIPLINE: Object.freeze([
            "shot discipline",
            "good shots",
            "shot selection"
        ]),

        TEAM_FIT: Object.freeze([
            "team fit",
            "role fit",
            "system fit"
        ]),

        FIRST_STEP: Object.freeze([
            "first step",
            "quick first step",
            "explosive first step"
        ]),

        CONTACT_BALANCE: Object.freeze([
            "contact balance",
            "finishes through contact",
            "balance through contact"
        ]),

        RIM_PRESSURE: Object.freeze([
            "rim pressure",
            "gets downhill",
            "attacks rim"
        ]),

        FREE_THROW_PRESSURE: Object.freeze([
            "draws fouls",
            "free throw",
            "gets to line"
        ]),

        DEFENSIVE_ACTIVITY: Object.freeze([
            "defensive activity",
            "active hands",
            "deflections"
        ]),

        ATHLETICISM: Object.freeze([
            "athletic",
            "athleticism",
            "explosive"
        ]),

        TWO_WAY_VALUE: Object.freeze([
            "two way",
            "two-way",
            "impact both ends"
        ]),

        DEFENSIVE_SWITCHABILITY: Object.freeze([
            "switchable",
            "switchability",
            "guards multiple positions"
        ]),

        REBOUNDING: Object.freeze([
            "rebound",
            "rebounding",
            "boards"
        ]),

        BASKETBALL_IQ: Object.freeze([
            "basketball iq",
            "iq",
            "smart player",
            "reads game"
        ]),

        VERSATILITY: Object.freeze([
            "versatile",
            "versatility",
            "multiple roles"
        ]),

        LENGTH_USAGE: Object.freeze([
            "length",
            "uses length",
            "wingspan"
        ]),

        HELP_DEFENSE: Object.freeze([
            "help defense",
            "rim help",
            "rotation"
        ]),

        TRANSITION_DEFENSE: Object.freeze([
            "transition defense",
            "gets back",
            "stops break"
        ]),

        PHYSICALITY: Object.freeze([
            "physical",
            "physicality",
            "strong"
        ]),

        INTERIOR_SCORING: Object.freeze([
            "interior scoring",
            "inside scoring",
            "paint scorer"
        ]),

        MIDRANGE: Object.freeze([
            "midrange",
            "mid range",
            "pull up two"
        ]),

        SCREEN_SETTING: Object.freeze([
            "screen",
            "screen setting",
            "sets screens"
        ]),

        DEFENSIVE_PRESENCE: Object.freeze([
            "defensive presence",
            "paint presence",
            "interior presence"
        ]),

        MOTOR: Object.freeze([
            "motor",
            "energy",
            "effort"
        ]),

        POST_PLAY: Object.freeze([
            "post play",
            "post game",
            "low post"
        ]),

        PICK_AND_POP_VALUE: Object.freeze([
            "pick and pop",
            "pick-and-pop"
        ]),

        SPACING: Object.freeze([
            "spacing",
            "floor spacing",
            "stretches floor"
        ]),

        INTERIOR_DEFENSE: Object.freeze([
            "interior defense",
            "paint defense",
            "post defense"
        ]),

        SECOND_CHANCE_VALUE: Object.freeze([
            "second chance",
            "offensive rebound",
            "putback"
        ]),

        RIM_PROTECTION: Object.freeze([
            "rim protection",
            "protects rim",
            "shot blocker"
        ]),

        POST_SCORING: Object.freeze([
            "post scoring",
            "post scorer",
            "low block"
        ]),

        HANDS: Object.freeze([
            "hands",
            "catches",
            "soft hands"
        ]),

        PHYSICAL_PRESENCE: Object.freeze([
            "physical presence",
            "size",
            "strength"
        ]),

        PICK_AND_ROLL_DEFENSE: Object.freeze([
            "pick and roll defense",
            "pnr defense",
            "screen defense"
        ]),

        SHOT_BLOCKING: Object.freeze([
            "shot blocking",
            "blocks",
            "block shots"
        ]),

        FOOTWORK: Object.freeze([
            "footwork",
            "feet",
            "post footwork"
        ]),

        INTERIOR_TOUCH: Object.freeze([
            "touch",
            "interior touch",
            "soft touch"
        ]),

        MOBILITY: Object.freeze([
            "mobility",
            "mobile",
            "moves well"
        ]),

        RIM_RUNNING: Object.freeze([
            "rim running",
            "rim runner",
            "runs floor"
        ]),

        DEFENSIVE_RANGE: Object.freeze([
            "defensive range",
            "covers ground",
            "range defensively"
        ])

    });

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(
            value == null ? "" : value
        ).trim();
    }

    function upper(value) {
        return normalize(value)
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/-/g, "_");
    }

    function numberOrNull(value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        const cleaned =
            String(value)
                .trim()
                .replace(/,/g, "")
                .replace(/[^\d.-]/g, "");

        if (!cleaned) {
            return null;
        }

        const numeric =
            Number(cleaned);

        return Number.isFinite(numeric)
            ? numeric
            : null;
    }

    function normalizeScore(value) {
        const numeric =
            numberOrNull(value);

        if (numeric === null) {
            return null;
        }

        return Number(
            Math.max(
                0,
                Math.min(
                    100,
                    numeric
                )
            ).toFixed(2)
        );
    }

    function clamp(
        value,
        min = 0,
        max = 100
    ) {
        const numeric =
            Number(value);

        if (
            !Number.isFinite(
                numeric
            )
        ) {
            return null;
        }

        return Math.max(
            min,
            Math.min(
                max,
                numeric
            )
        );
    }

    function normalizeSport(value) {
        const sport =
            upper(value);

        const aliases =
            Object.freeze({
                BASKETBALL:
                    "BASKETBALL",
                BASKET_BALL:
                    "BASKETBALL",
                BBALL:
                    "BASKETBALL",
                HOOPS:
                    "BASKETBALL"
            });

        return (
            aliases[sport] ||
            sport ||
            "UNKNOWN"
        );
    }

    function normalizeVerificationStatus(
        value
    ) {
        const status =
            upper(value);

        if (!status) {
            return (
                VERIFICATION_STATUS
                    .UNKNOWN
            );
        }

        if (
            status ===
            "VERIFIED"
        ) {
            return (
                VERIFICATION_STATUS
                    .VERIFIED
            );
        }

        if (
            status ===
                "PARTIAL" ||
            status ===
                "PARTIALLY_VERIFIED"
        ) {
            return (
                VERIFICATION_STATUS
                    .PARTIAL
            );
        }

        if (
            status ===
                "SELF_REPORTED" ||
            status ===
                "SELF_REPORTED_ONLY"
        ) {
            return (
                VERIFICATION_STATUS
                    .SELF_REPORTED
            );
        }

        if (
            status ===
                "PENDING" ||
            status ===
                "PENDING_VERIFICATION" ||
            status ===
                "IN_REVIEW"
        ) {
            return (
                VERIFICATION_STATUS
                    .PENDING_VERIFICATION
            );
        }

        if (
            status ===
            "UNVERIFIED"
        ) {
            return (
                VERIFICATION_STATUS
                    .UNVERIFIED
            );
        }

        return status;
    }

    function validateStream9Authority() {
        const authority =
            global.STATScoreStream9Authority;

        if (!authority) {
            return {
                valid:
                    false,

                status:
                    STATUS
                        .AUTHORITY_UNAVAILABLE
            };
        }

        const valid =
            authority.stream_number ===
                9 &&
            authority
                .operational_state ===
                "ACTIVE";

        return {
            valid,

            status:
                valid
                    ? "AUTHORIZED"
                    : STATUS
                        .AUTHORITY_UNAUTHORIZED
        };
    }

    function getPositionAuthority() {
        return (
            global
                .STATScoreBasketballPositionMatrix ||
            global
                .STATScore
                ?.BasketballPositionMatrix ||
            null
        );
    }

    function getInputSport(
        athlete
    ) {
        return normalizeSport(
            athlete?.primary_sport ||
            athlete?.sport ||
            athlete
                ?.raw_payload
                ?.primarySport ||
            athlete
                ?.raw_payload
                ?.primary_sport ||
            athlete
                ?.raw_payload
                ?.sport
        );
    }

    function buildSearchableText(
        athlete
    ) {
        return [
            athlete?.position_notes,
            athlete
                ?.verified_event_source,
            athlete
                ?.raw_payload
                ?.notes,
            athlete
                ?.raw_payload
                ?.style,
            athlete
                ?.raw_payload
                ?.strengths,
            athlete
                ?.raw_payload
                ?.weaknesses
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    }

    function collectGlobalEvidence(
        athlete
    ) {
        const evidence = [];

        if (
            athlete
                ?.highlight_url
        ) {
            evidence.push({
                evidence_type:
                    "HIGHLIGHT_FILM",

                value:
                    athlete
                        .highlight_url,

                source:
                    "ATHLETE_SOURCE_RECORD"
            });
        }

        if (
            athlete
                ?.game_film_url
        ) {
            evidence.push({
                evidence_type:
                    "GAME_FILM",

                value:
                    athlete
                        .game_film_url,

                source:
                    "ATHLETE_SOURCE_RECORD"
            });
        }

        if (
            athlete
                ?.recruiting_profile_url
        ) {
            evidence.push({
                evidence_type:
                    "RECRUITING_PROFILE",

                value:
                    athlete
                        .recruiting_profile_url,

                source:
                    "ATHLETE_SOURCE_RECORD"
            });
        }

        if (
            athlete
                ?.verified_event_source
        ) {
            evidence.push({
                evidence_type:
                    "EVENT_SOURCE",

                value:
                    athlete
                        .verified_event_source,

                source:
                    "ATHLETE_SOURCE_RECORD"
            });
        }

        return evidence;
    }

    function getTraitSourceObjects(
        athlete
    ) {
        return [
            {
                source_name:
                    "trait_scores",

                source:
                    athlete
                        ?.trait_scores
            },
            {
                source_name:
                    "raw_payload.trait_scores",

                source:
                    athlete
                        ?.raw_payload
                        ?.trait_scores
            },
            {
                source_name:
                    "raw_payload.basketball_trait_scores",

                source:
                    athlete
                        ?.raw_payload
                        ?.basketball_trait_scores
            },
            {
                source_name:
                    "raw_payload.position_trait_scores",

                source:
                    athlete
                        ?.raw_payload
                        ?.position_trait_scores
            }
        ];
    }

    function findDirectTraitEvidence(
        traitName,
        athlete
    ) {
        const traitKey =
            upper(traitName);

        const sources =
            getTraitSourceObjects(
                athlete
            );

        for (
            const entry
            of sources
        ) {
            const source =
                entry.source;

            if (
                !source ||
                typeof source !==
                    "object"
            ) {
                continue;
            }

            const matchingKey =
                Object.keys(
                    source
                ).find(
                    function (key) {
                        return (
                            upper(key) ===
                            traitKey
                        );
                    }
                );

            if (!matchingKey) {
                continue;
            }

            const rawValue =
                source[
                    matchingKey
                ];

            if (
                rawValue &&
                typeof rawValue ===
                    "object" &&
                !Array.isArray(
                    rawValue
                )
            ) {
                const value =
                    normalizeScore(
                        rawValue
                            .value ??
                        rawValue
                            .score ??
                        rawValue
                            .rating
                    );

                if (
                    value === null
                ) {
                    continue;
                }

                return {
                    value,

                    status:
                        upper(
                            rawValue
                                .status
                        ) ||
                        TRAIT_STATUS
                            .EVIDENCE_AVAILABLE,

                    official:
                        rawValue
                            .official ===
                        true,

                    confidence:
                        normalizeScore(
                            rawValue
                                .confidence
                        ),

                    verification_status:
                        normalizeVerificationStatus(
                            rawValue
                                .verification_status
                        ),

                    evidence:
                        Array.isArray(
                            rawValue
                                .evidence
                        )
                            ? rawValue
                                .evidence
                            : [],

                    source:
                        entry
                            .source_name
                };
            }

            const value =
                normalizeScore(
                    rawValue
                );

            if (
                value === null
            ) {
                continue;
            }

            return {
                value,

                status:
                    TRAIT_STATUS
                        .EVIDENCE_AVAILABLE,

                official:
                    false,

                confidence:
                    null,

                verification_status:
                    VERIFICATION_STATUS
                        .UNKNOWN,

                evidence:
                    [],

                source:
                    entry
                        .source_name
            };
        }

        return null;
    }

    function findTraitVerificationContext(
        traitName,
        athlete,
        options
    ) {
        const traitKey =
            upper(traitName);

        const contexts = [
            options
                ?.verification_by_trait,

            athlete
                ?.verification_by_trait,

            athlete
                ?.raw_payload
                ?.verification_by_trait
        ];

        for (
            const context
            of contexts
        ) {
            if (
                !context ||
                typeof context !==
                    "object"
            ) {
                continue;
            }

            const matchingKey =
                Object.keys(
                    context
                ).find(
                    function (key) {
                        return (
                            upper(key) ===
                            traitKey
                        );
                    }
                );

            if (!matchingKey) {
                continue;
            }

            const record =
                context[
                    matchingKey
                ];

            if (
                record &&
                typeof record ===
                    "object"
            ) {
                return {
                    verification_status:
                        normalizeVerificationStatus(
                            record
                                .verification_status ||
                            record
                                .status
                        ),

                    confidence:
                        normalizeScore(
                            record
                                .confidence
                        ),

                    evidence_id:
                        record
                            .evidence_id ||
                        null,

                    source_record_id:
                        record
                            .source_record_id ||
                        null,

                    receipt_id:
                        record
                            .receipt_id ||
                        null,

                    professional_id:
                        record
                            .professional_id ||
                        null,

                    certification_id:
                        record
                            .certification_id ||
                        null
                };
            }
        }

        return {
            verification_status:
                normalizeVerificationStatus(
                    options
                        ?.verification_status ||
                    athlete
                        ?.verification_status
                ),

            confidence:
                normalizeScore(
                    options
                        ?.confidence
                ),

            evidence_id:
                null,

            source_record_id:
                null,

            receipt_id:
                null,

            professional_id:
                null,

            certification_id:
                null
        };
    }

    function collectKeywordEvidence(
        traitName,
        athlete
    ) {
        const traitKey =
            upper(traitName);

        const keywords =
            KEYWORD_EVIDENCE_MAP[
                traitKey
            ] || [];

        if (
            !keywords.length
        ) {
            return [];
        }

        const text =
            buildSearchableText(
                athlete
            );

        if (!text) {
            return [];
        }

        return keywords
            .filter(
                function (keyword) {
                    return text
                        .includes(
                            String(
                                keyword
                            )
                                .toLowerCase()
                        );
                }
            )
            .map(
                function (keyword) {
                    return {
                        evidence_type:
                            "TEXT_SIGNAL",

                        trait_key:
                            traitKey,

                        matched_term:
                            keyword,

                        source:
                            "POSITION_NOTES_OR_RAW_PAYLOAD"
                    };
                }
            );
    }

    /*
    ============================================================================
    RAW BASKETBALL MEASURABLE EXTRACTION
    ============================================================================
    */

    function getVerticalJump(
        athlete
    ) {
        return (
            numberOrNull(
                athlete
                    ?.vertical_jump
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.verticalJump
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.vertical_jump
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.vertical
            )
        );
    }

    function getBroadJump(
        athlete
    ) {
        return (
            numberOrNull(
                athlete
                    ?.broad_jump
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.broadJump
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.broad_jump
            )
        );
    }

    function getShuttle(
        athlete
    ) {
        return (
            numberOrNull(
                athlete
                    ?.shuttle
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.shuttle
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.shuttle_time
            )
        );
    }

    /*
    ============================================================================
    PROJECTED BENCHMARK INTERPRETATION
    ============================================================================
    */

    function projectVerticalSignal(
        vertical
    ) {
        if (
            vertical === null
        ) {
            return null;
        }

        const benchmark =
            BASKETBALL_BENCHMARKS
                .VERTICAL_JUMP;

        const raw =
            benchmark
                .projected_floor_signal +
            (
                vertical -
                benchmark
                    .reference_value
            ) *
            benchmark
                .projected_slope;

        return Number(
            clamp(
                raw,
                0,
                100
            ).toFixed(2)
        );
    }

    function projectBroadJumpSignal(
        broad
    ) {
        if (
            broad === null
        ) {
            return null;
        }

        const benchmark =
            BASKETBALL_BENCHMARKS
                .BROAD_JUMP;

        const raw =
            benchmark
                .projected_floor_signal +
            (
                broad -
                benchmark
                    .reference_value
            ) *
            benchmark
                .projected_slope;

        return Number(
            clamp(
                raw,
                0,
                100
            ).toFixed(2)
        );
    }

    function projectShuttleSignal(
        shuttle
    ) {
        if (
            shuttle === null
        ) {
            return null;
        }

        const benchmark =
            BASKETBALL_BENCHMARKS
                .SHUTTLE;

        const raw =
            100 -
            (
                (
                    shuttle -
                    benchmark
                        .reference_value
                ) *
                benchmark
                    .projected_slope
            );

        return Number(
            clamp(
                raw,
                0,
                100
            ).toFixed(2)
        );
    }

    function buildMetricProjection(
        traitName,
        athlete
    ) {
        const trait =
            upper(traitName);

        const vertical =
            getVerticalJump(
                athlete
            );

        const broad =
            getBroadJump(
                athlete
            );

        const shuttle =
            getShuttle(
                athlete
            );

        const explosiveTraits = [
            "ATHLETICISM",
            "BURST",
            "FIRST_STEP",
            "FINISHING",
            "RIM_RUNNING",
            "MOBILITY",
            "TRANSITION"
        ];

        if (
            explosiveTraits
                .includes(
                    trait
                )
        ) {
            if (
                vertical !== null
            ) {
                return {
                    value:
                        projectVerticalSignal(
                            vertical
                        ),

                    benchmark_type:
                        "VERTICAL_JUMP",

                    benchmark_version:
                        BENCHMARK_VERSION,

                    evidence: [
                        {
                            evidence_type:
                                "MEASURABLE",

                            measurable:
                                "VERTICAL_JUMP",

                            raw_value:
                                vertical,

                            unit:
                                "INCHES",

                            source:
                                "ATHLETE_EVIDENCE"
                        }
                    ]
                };
            }

            if (
                broad !== null
            ) {
                return {
                    value:
                        projectBroadJumpSignal(
                            broad
                        ),

                    benchmark_type:
                        "BROAD_JUMP",

                    benchmark_version:
                        BENCHMARK_VERSION,

                    evidence: [
                        {
                            evidence_type:
                                "MEASURABLE",

                            measurable:
                                "BROAD_JUMP",

                            raw_value:
                                broad,

                            unit:
                                "INCHES",

                            source:
                                "ATHLETE_EVIDENCE"
                        }
                    ]
                };
            }
        }

        const lateralTraits = [
            "DEFENSIVE_PRESSURE",
            "LATERAL_QUICKNESS",
            "ON_BALL_DEFENSE",
            "DEFENSIVE_SWITCHABILITY",
            "DEFENSIVE_VERSATILITY",
            "PICK_AND_ROLL_DEFENSE",
            "DEFENSIVE_RANGE",
            "DEFENSIVE_ACTIVITY"
        ];

        if (
            lateralTraits
                .includes(
                    trait
                ) &&
            shuttle !== null
        ) {
            return {
                value:
                    projectShuttleSignal(
                        shuttle
                    ),

                benchmark_type:
                    "SHUTTLE",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    {
                        evidence_type:
                            "MEASURABLE",

                        measurable:
                            "SHUTTLE",

                        raw_value:
                            shuttle,

                        unit:
                            "SECONDS",

                        source:
                            "ATHLETE_EVIDENCE"
                    }
                ]
            };
        }

        return null;
    }

    function buildTraitIntelligence(
        traitName,
        athlete,
        options
    ) {
        const traitKey =
            upper(
                traitName
            );

        const direct =
            findDirectTraitEvidence(
                traitKey,
                athlete
            );

        const verification =
            findTraitVerificationContext(
                traitKey,
                athlete,
                options
            );

        const keywordEvidence =
            collectKeywordEvidence(
                traitKey,
                athlete
            );

        /*
        ------------------------------------------------------------------------
        Direct governed trait evidence.
        ------------------------------------------------------------------------
        */

        if (direct) {
            return {
                trait_key:
                    traitKey,

                value:
                    direct.value,

                confidence:
                    direct.confidence ??
                    verification
                        .confidence ??
                    null,

                verification_status:
                    direct
                        .verification_status !==
                    VERIFICATION_STATUS
                        .UNKNOWN
                        ? direct
                            .verification_status
                        : verification
                            .verification_status,

                status:
                    direct.status ||
                    TRAIT_STATUS
                        .EVIDENCE_AVAILABLE,

                official:
                    direct.official ===
                    true,

                evidence_used: [
                    ...direct
                        .evidence,
                    ...keywordEvidence
                ],

                missing_evidence:
                    [],

                flags: [
                    direct
                        .confidence ===
                        null &&
                    verification
                        .confidence ===
                        null
                        ? "CONFIDENCE_UNAVAILABLE"
                        : null
                ].filter(Boolean),

                interpretation_source:
                    "DIRECT_GOVERNED_TRAIT_EVIDENCE",

                projection:
                    null
            };
        }

        /*
        ------------------------------------------------------------------------
        Optional projected benchmark intelligence.
        ------------------------------------------------------------------------
        */

        if (
            options
                ?.include_projected_benchmarks ===
            true
        ) {
            const projection =
                buildMetricProjection(
                    traitKey,
                    athlete
                );

            if (
                projection &&
                projection
                    .value !== null
            ) {
                return {
                    trait_key:
                        traitKey,

                    value:
                        projection
                            .value,

                    confidence:
                        verification
                            .confidence,

                    verification_status:
                        verification
                            .verification_status,

                    status:
                        TRAIT_STATUS
                            .PROJECTED,

                    official:
                        false,

                    evidence_used: [
                        ...projection
                            .evidence,
                        ...keywordEvidence
                    ],

                    missing_evidence:
                        [],

                    flags: [
                        "PROJECTED_BENCHMARK_SIGNAL",
                        "PROJECTED_NOT_OFFICIAL",
                        verification
                            .confidence ===
                            null
                            ? "CONFIDENCE_UNAVAILABLE"
                            : null
                    ].filter(Boolean),

                    interpretation_source:
                        "PROJECTED_BASKETBALL_BENCHMARK",

                    projection: {
                        benchmark_type:
                            projection
                                .benchmark_type,

                        benchmark_version:
                            projection
                                .benchmark_version,

                        official:
                            false,

                        downstream_rule:
                            "Projected basketball benchmark intelligence may not become official domain intelligence unless the receiving Stream 9 authority explicitly authorizes projected evidence."
                    }
                };
            }
        }

        /*
        ------------------------------------------------------------------------
        Missing evidence fails closed.
        ------------------------------------------------------------------------
        */

        return {
            trait_key:
                traitKey,

            value:
                null,

            confidence:
                verification
                    .confidence,

            verification_status:
                verification
                    .verification_status,

            status:
                TRAIT_STATUS
                    .INSUFFICIENT_EVIDENCE,

            official:
                false,

            evidence_used:
                keywordEvidence,

            missing_evidence: [
                "TRAIT_EVIDENCE"
            ],

            flags: [
                "INSUFFICIENT_TRAIT_EVIDENCE"
            ],

            interpretation_source:
                null,

            projection:
                null
        };
    }

    function validatePositionAuthorityResult(
        result
    ) {
        if (
            !result ||
            result.ok !== true
        ) {
            return false;
        }

        if (
            result.sport !==
            SPORT
        ) {
            return false;
        }

        if (
            !result.position ||
            !result.archetype ||
            !result.matrix
        ) {
            return false;
        }

        if (
            !Array.isArray(
                result
                    .trait_keys
            )
        ) {
            return false;
        }

        return true;
    }

    function resolveBasketballPositionModel(
        athlete,
        options
    ) {
        const authority =
            getPositionAuthority();

        if (
            !authority ||
            typeof authority
                .resolveMatrix !==
                "function"
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .POSITION_AUTHORITY_UNAVAILABLE
            };
        }

        const result =
            authority.resolveMatrix(
                athlete,
                {
                    archetype:
                        options
                            ?.archetype
                }
            );

        if (
            !validatePositionAuthorityResult(
                result
            )
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .POSITION_CONTRACT_INVALID,

                source_result:
                    result ||
                    null
            };
        }

        return result;
    }

    function determineOverallStatus(
        traits
    ) {
        const values =
            Object.values(
                traits
            );

        const availableCount =
            values.filter(
                function (trait) {
                    return (
                        trait
                            .status ===
                        TRAIT_STATUS
                            .EVIDENCE_AVAILABLE
                    );
                }
            ).length;

        const projectedCount =
            values.filter(
                function (trait) {
                    return (
                        trait
                            .status ===
                        TRAIT_STATUS
                            .PROJECTED
                    );
                }
            ).length;

        const insufficientCount =
            values.filter(
                function (trait) {
                    return (
                        trait
                            .status ===
                        TRAIT_STATUS
                            .INSUFFICIENT_EVIDENCE
                    );
                }
            ).length;

        if (
            availableCount === 0 &&
            projectedCount === 0
        ) {
            return (
                STATUS
                    .INSUFFICIENT_EVIDENCE
            );
        }

        if (
            projectedCount > 0 &&
            availableCount === 0 &&
            insufficientCount === 0
        ) {
            return (
                STATUS
                    .PROJECTED
            );
        }

        if (
            insufficientCount === 0 &&
            projectedCount === 0
        ) {
            return (
                STATUS
                    .AVAILABLE
            );
        }

        return (
            STATUS
                .PARTIAL
        );
    }

    function collectEvidenceUsed(
        traits
    ) {
        const evidence = [];

        Object.values(
            traits
        ).forEach(
            function (trait) {
                trait
                    .evidence_used
                    .forEach(
                        function (entry) {
                            evidence.push({
                                trait_key:
                                    trait
                                        .trait_key,
                                ...entry
                            });
                        }
                    );
            }
        );

        return evidence;
    }

    function collectMissingEvidence(
        traits
    ) {
        return Object.values(
            traits
        )
            .filter(
                function (trait) {
                    return (
                        trait
                            .status ===
                        TRAIT_STATUS
                            .INSUFFICIENT_EVIDENCE
                    );
                }
            )
            .map(
                function (trait) {
                    return {
                        trait_key:
                            trait
                                .trait_key,

                        missing:
                            Array.from(
                                trait
                                    .missing_evidence
                            )
                    };
                }
            );
    }

    function collectFlags(
        traits
    ) {
        const flags = [];

        Object.values(
            traits
        )
            .forEach(
                function (trait) {
                    trait
                        .flags
                        .forEach(
                            function (flag) {
                                if (
                                    !flags
                                        .includes(
                                            flag
                                        )
                                ) {
                                    flags.push(
                                        flag
                                    );
                                }
                            }
                        );
                }
            );

        return flags;
    }

    function buildExplanation(
        athlete,
        positionModel,
        traits,
        status,
        options
    ) {
        const athleteName =
            athlete
                ?.athlete_display_name ||
            [
                athlete
                    ?.first_name,
                athlete
                    ?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            "Athlete";

        const availableTraits =
            Object.values(
                traits
            )
                .filter(
                    function (trait) {
                        return (
                            trait
                                .status ===
                            TRAIT_STATUS
                                .EVIDENCE_AVAILABLE
                        );
                    }
                )
                .map(
                    function (trait) {
                        return (
                            trait
                                .trait_key
                        );
                    }
                );

        const projectedTraits =
            Object.values(
                traits
            )
                .filter(
                    function (trait) {
                        return (
                            trait
                                .status ===
                            TRAIT_STATUS
                                .PROJECTED
                        );
                    }
                )
                .map(
                    function (trait) {
                        return (
                            trait
                                .trait_key
                        );
                    }
                );

        const missingTraits =
            Object.values(
                traits
            )
                .filter(
                    function (trait) {
                        return (
                            trait
                                .status ===
                            TRAIT_STATUS
                                .INSUFFICIENT_EVIDENCE
                        );
                    }
                )
                .map(
                    function (trait) {
                        return (
                            trait
                                .trait_key
                        );
                    }
                );

        return {
            summary:
                `${athleteName} was interpreted through the Basketball Sport Intelligence Authority using ${positionModel.matrix.matrix_code} for ${positionModel.position.label} / ${positionModel.archetype.label}. This output is supporting basketball trait intelligence only and is not an official Athletic Score, Production Score, Composite Score, or STATScore™.`,

            status,

            factors: [
                "Canonical Basketball Position Matrix Authority consumed.",
                "Basketball position and archetype context preserved.",
                "Direct governed trait evidence interpreted where available.",
                "Basketball measurable evidence preserved independently from verification standing.",
                options
                    ?.include_projected_benchmarks ===
                    true
                    ? "Projected benchmark mode was explicitly enabled; projected traits remain non-official."
                    : "Projected benchmark mode was not enabled; missing trait evidence remained null."
            ],

            available_traits:
                availableTraits,

            projected_traits:
                projectedTraits,

            missing_traits:
                missingTraits,

            limitations: [
                "No baseline basketball performance values are manufactured.",
                "No arithmetic average of basketball traits is published as an official score.",
                "Verification does not increase or decrease the underlying basketball measurement.",
                "Projected benchmark values are not official intelligence.",
                "Official Athletic domain scoring belongs to ATHLETIC_MATRIX.",
                "Official Production domain scoring belongs to PRODUCTION_MATRIX.",
                "Official Competition domain scoring belongs to COMPETITION_MATRIX.",
                "Official Verification domain scoring belongs to VERIFICATION_MATRIX.",
                "Official Composite Intelligence belongs to Composite Authority."
            ],

            downstream_authorities: {
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
        };
    }

    function interpretAthlete(
        athlete,
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

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS
                            .INVALID_INPUT,

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

            const authorityValidation =
                validateStream9Authority();

            if (
                !authorityValidation
                    .valid
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        authorityValidation
                            .status,

                    official:
                        false,

                    athlete_id:
                        athlete
                            .athlete_id ||
                        null,

                    snapshot_id:
                        athlete
                            .snapshot_id ||
                        null,

                    sport:
                        getInputSport(
                            athlete
                        ),

                    flags: [
                        authorityValidation
                            .status
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
                sport !==
                SPORT
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS
                            .UNSUPPORTED_SPORT,

                    official:
                        false,

                    athlete_id:
                        athlete
                            .athlete_id ||
                        null,

                    snapshot_id:
                        athlete
                            .snapshot_id ||
                        null,

                    sport,

                    flags: [
                        "BASKETBALL_AUTHORITY_REQUIRES_BASKETBALL_SPORT"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            if (
                !athlete
                    .athlete_id ||
                !athlete
                    .snapshot_id
            ) {
                const missingIdentity =
                    [];

                if (
                    !athlete
                        .athlete_id
                ) {
                    missingIdentity
                        .push(
                            "athlete_id"
                        );
                }

                if (
                    !athlete
                        .snapshot_id
                ) {
                    missingIdentity
                        .push(
                            "snapshot_id"
                        );
                }

                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS
                            .INVALID_INPUT,

                    official:
                        false,

                    athlete_id:
                        athlete
                            .athlete_id ||
                        null,

                    snapshot_id:
                        athlete
                            .snapshot_id ||
                        null,

                    sport,

                    missing_evidence:
                        missingIdentity,

                    flags: [
                        "REQUIRED_IDENTITY_MISSING"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const positionModel =
                resolveBasketballPositionModel(
                    athlete,
                    options
                );

            if (
                !positionModel ||
                positionModel
                    .ok !== true
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        positionModel
                            ?.status ||
                        STATUS
                            .POSITION_AUTHORITY_UNAVAILABLE,

                    official:
                        false,

                    athlete_id:
                        athlete
                            .athlete_id,

                    snapshot_id:
                        athlete
                            .snapshot_id,

                    sport,

                    flags: [
                        positionModel
                            ?.status ||
                        STATUS
                            .POSITION_AUTHORITY_UNAVAILABLE
                    ],

                    source_position_result:
                        positionModel
                            ?.source_result ||
                        null,

                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const traits = {};

            positionModel
                .trait_keys
                .forEach(
                    function (
                        traitName
                    ) {
                        traits[
                            traitName
                        ] =
                            buildTraitIntelligence(
                                traitName,
                                athlete,
                                options
                            );
                    }
                );

            const status =
                determineOverallStatus(
                    traits
                );

            const flags =
                collectFlags(
                    traits
                );

            if (
                positionModel
                    .archetype
                    .source !==
                "EXPLICIT"
            ) {
                flags.push(
                    "ARCHETYPE_CLASSIFICATION_NOT_EXPLICIT"
                );
            }

            if (
                options
                    .include_projected_benchmarks ===
                true
            ) {
                flags.push(
                    "PROJECTED_BENCHMARK_MODE_ENABLED"
                );
            }

            const result = {
                ok:
                    true,

                authority:
                    ENGINE_ID,

                authority_key:
                    AUTHORITY_KEY,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                benchmark_version:
                    BENCHMARK_VERSION,

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SUPPORTING_SPORT_INTELLIGENCE",

                official:
                    false,

                athlete_id:
                    athlete
                        .athlete_id,

                snapshot_id:
                    athlete
                        .snapshot_id,

                sport:
                    SPORT,

                position: {
                    code:
                        positionModel
                            .position
                            .code,

                    label:
                        positionModel
                            .position
                            .label,

                    source_value:
                        positionModel
                            .position
                            .source_value
                },

                archetype: {
                    code:
                        positionModel
                            .archetype
                            .code,

                    label:
                        positionModel
                            .archetype
                            .label,

                    source:
                        positionModel
                            .archetype
                            .source,

                    confidence:
                        positionModel
                            .archetype
                            .confidence ??
                        null,

                    confidence_status:
                        positionModel
                            .archetype
                            .confidence_status ||
                        "CONFIDENCE_AUTHORITY_REQUIRED"
                },

                sport_trait_matrix: {
                    matrix_code:
                        positionModel
                            .matrix
                            .matrix_code,

                    matrix_version:
                        positionModel
                            .matrix
                            .matrix_version,

                    source_authority:
                        "BASKETBALL_POSITION_MATRIX_AUTHORITY",

                    role:
                        "BASKETBALL_TRAIT_INTERPRETATION"
                },

                traits,

                evidence_used:
                    collectEvidenceUsed(
                        traits
                    ),

                global_evidence:
                    collectGlobalEvidence(
                        athlete
                    ),

                missing_evidence:
                    collectMissingEvidence(
                        traits
                    ),

                flags:
                    Array.from(
                        new Set(
                            flags
                        )
                    ),

                status,

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

                explanation:
                    buildExplanation(
                        athlete,
                        positionModel,
                        traits,
                        status,
                        options
                    ),

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
                    AUTHORITY_KEY,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                status:
                    STATUS.ERROR,

                official:
                    false,

                athlete_id:
                    athlete
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    athlete
                        ?.snapshot_id ||
                    null,

                sport:
                    SPORT,

                flags: [
                    "BASKETBALL_INTELLIGENCE_EXECUTION_ERROR"
                ],

                error:
                    lastError
                        .message,

                generated_at:
                    nowISO()
            };

            lastResult = result;
            return result;
        }
    }

    /*
    ============================================================================
    COMPATIBILITY ALIAS
    ----------------------------------------------------------------------------
    Legacy callers may still invoke scoreAthlete().

    This method now returns SUPPORTING BASKETBALL INTELLIGENCE ONLY.

    It intentionally does NOT return:
        final_score
        score_final
        score_band
        star_projection
    ============================================================================
    */

    function scoreAthlete(
        athlete,
        options
    ) {
        return interpretAthlete(
            athlete,
            options
        );
    }

    function getRawMeasurableModel(
        athlete = {}
    ) {
        return {
            vertical_jump: {
                value:
                    getVerticalJump(
                        athlete
                    ),

                unit:
                    "INCHES"
            },

            broad_jump: {
                value:
                    getBroadJump(
                        athlete
                    ),

                unit:
                    "INCHES"
            },

            shuttle: {
                value:
                    getShuttle(
                        athlete
                    ),

                unit:
                    "SECONDS"
            }
        };
    }

    function getContract() {
        return {
            authority_key:
                AUTHORITY_KEY,

            authority:
                ENGINE_ID,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            benchmark_version:
                BENCHMARK_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            classification:
                "SUPPORTING_SPORT_INTELLIGENCE",

            official_score_publisher:
                false,

            dependencies: [
                "STATScoreStream9Authority",
                "STATScoreBasketballPositionMatrix"
            ],

            required_input: [
                "athlete_id",
                "snapshot_id",
                "sport",
                "position"
            ],

            optional_input: [
                "archetype",
                "trait_scores",
                "vertical_jump",
                "broad_jump",
                "shuttle",
                "film",
                "event_evidence",
                "verification_by_trait",
                "confidence"
            ],

            output: [
                "athlete_id",
                "snapshot_id",
                "sport",
                "position",
                "archetype",
                "sport_trait_matrix",
                "traits",
                "evidence_used",
                "missing_evidence",
                "flags",
                "explanation",
                "status",
                "generated_at"
            ],

            prohibited_output: [
                "official_athletic_score",
                "official_production_score",
                "official_competition_score",
                "official_verification_score",
                "official_academic_score",
                "official_position_score",
                "official_final_score",
                "official_star_rating",
                "official_statscore",
                "official_composite"
            ],

            projection_rule:
                "Projected basketball benchmark intelligence is disabled by default, always non-official, and may enter official scoring only when a receiving governed Stream 9 authority explicitly authorizes projected evidence.",

            verification_rule:
                "Verification standing may affect confidence and provenance but never changes the underlying basketball measurement or trait performance value.",

            missing_evidence_rule:
                "Missing basketball trait evidence remains null with INSUFFICIENT_EVIDENCE. No baseline athlete value may be manufactured.",

            execution_rule:
                "Explicit invocation only. Loading this file does not execute athlete interpretation.",

            presentation_rule:
                "No DOM rendering or page manipulation is permitted."
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            benchmark_version:
                BENCHMARK_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            benchmark_science:
                BASKETBALL_BENCHMARKS,

            projected_benchmark_default:
                false,

            official_score_publication:
                false,

            dom_rendering:
                false,

            automatic_execution:
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
        const stream9 =
            validateStream9Authority();

        const positionAuthority =
            getPositionAuthority();

        const positionAuthorityAvailable =
            Boolean(
                positionAuthority &&
                typeof positionAuthority
                    .resolveMatrix ===
                    "function"
            );

        const positionAuthorityHealth =
            typeof positionAuthority
                ?.runHealthCheck ===
                "function"
                ? positionAuthority
                    .runHealthCheck()
                : null;

        const healthy =
            stream9.valid &&
            positionAuthorityAvailable &&
            (
                !positionAuthorityHealth ||
                positionAuthorityHealth
                    .status ===
                    "HEALTHY"
            );

        return {
            authority:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                healthy
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_9_authority:
                stream9,

            basketball_position_authority_available:
                positionAuthorityAvailable,

            basketball_position_authority_health:
                positionAuthorityHealth,

            projected_benchmark_default:
                false,

            fabricated_baseline_scoring:
                false,

            verification_changes_performance:
                false,

            trait_average_published:
                false,

            official_score_publication:
                false,

            official_star_publication:
                false,

            dom_rendering:
                false,

            automatic_execution:
                false,

            generated_at:
                nowISO()
        };
    }

    const BasketballSportIntelligenceAuthority =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            benchmark_version:
                BENCHMARK_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            status:
                "ACTIVE",

            classification:
                "SUPPORTING_BASKETBALL_SPORT_INTELLIGENCE_AUTHORITY",

            official_score_publisher:
                false,

            interpretAthlete,

            /*
            Compatibility alias only.
            This no longer returns an official basketball score.
            */
            scoreAthlete,

            getRawMeasurableModel,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScoreBasketballScoringEngine =
        BasketballSportIntelligenceAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.BasketballScoringEngine =
        BasketballSportIntelligenceAuthority;

    console.info(
        "[STATS-CORE] Basketball Sport Intelligence Authority loaded:",
        VERSION,
        "| explicit invocation required | baseline scoring removed | official scoring disabled"
    );

})(window); 
