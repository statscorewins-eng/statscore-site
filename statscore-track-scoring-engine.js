/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-track-scoring-engine.js
*
* Classification:
*     SUPPORTING TRACK SPORT INTELLIGENCE AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-TRACK-SPORT-INTELLIGENCE-V2
*
* Contract Version:
*     STATSCORE-TRACK-SPORT-INTELLIGENCE-CONTRACT-V1
*
* Status:
*     RECONSTRUCTED — GOVERNED SUPPORTING AUTHORITY
*
* Purpose:
*     Interpret governed Track & Field evidence into structured Track-specific
*     trait intelligence for downstream Stream 9 domain matrices.
*
* Constitutional Chain:
*
*     Governed Track Evidence
*              ↓
*     Track Event / Position Matrix Authority
*              ↓
*     Track Trait Interpretation
*              ↓
*     Registered Stream 9 Domain Matrices
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*
* This authority DOES:
*     - consume the canonical Track Event / Position Matrix Authority;
*     - interpret governed Track times, marks, splits, and trait evidence;
*     - preserve raw event measurements;
*     - expose trait-level evidence used;
*     - expose missing evidence;
*     - preserve verification independently from measured performance;
*     - optionally expose explicitly PROJECTED benchmark signals;
*     - explain Track-specific interpretation;
*     - fail closed when evidence or event authority is unavailable.
*
* This authority DOES NOT:
*     - manufacture baseline Track performance;
*     - manufacture missing trait values;
*     - default an unknown event to SPRINT;
*     - alter measured performance because it is verified;
*     - average traits into an official Track score;
*     - publish Athletic Score;
*     - publish Production Score;
*     - publish Competition Score;
*     - publish Verification Score;
*     - publish Academic Score;
*     - publish Position Score;
*     - publish official stars;
*     - publish STATScore™;
*     - publish Composite Intelligence;
*     - render UI;
*     - manipulate the DOM;
*     - auto-execute when loaded.
*
* Governing Doctrine:
*     Evidence ≠ Intelligence
*     Intelligence ≠ Presentation
*     Score ≠ Confidence
*     Verification ≠ Performance
*     Confidence ≠ Certification
*     PROJECTED ≠ OFFICIAL
*     Missing ≠ Zero
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-track-scoring-engine";

    const AUTHORITY_KEY =
        "TRACK_SPORT_INTELLIGENCE";

    const VERSION =
        "STATSCORE-TRACK-SPORT-INTELLIGENCE-V2";

    const CONTRACT_VERSION =
        "STATSCORE-TRACK-SPORT-INTELLIGENCE-CONTRACT-V1";

    const BENCHMARK_VERSION =
        "STATSCORE-TRACK-BENCHMARK-SCIENCE-V1";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const SPORT =
        "TRACK";

    const STATUS = Object.freeze({
        AVAILABLE:
            "AVAILABLE",

        PARTIAL:
            "PARTIAL",

        PROJECTED:
            "PROJECTED",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE",

        INVALID_INPUT:
            "INVALID_INPUT",

        UNSUPPORTED_SPORT:
            "UNSUPPORTED_SPORT",

        EVENT_AUTHORITY_UNAVAILABLE:
            "EVENT_AUTHORITY_UNAVAILABLE",

        EVENT_AUTHORITY_INVALID:
            "EVENT_AUTHORITY_INVALID",

        AUTHORITY_UNAVAILABLE:
            "AUTHORITY_UNAVAILABLE",

        AUTHORITY_UNAUTHORIZED:
            "AUTHORITY_UNAUTHORIZED",

        ERROR:
            "ERROR"
    });

    const TRAIT_STATUS = Object.freeze({
        EVIDENCE_AVAILABLE:
            "EVIDENCE_AVAILABLE",

        PROJECTED:
            "PROJECTED",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE"
    });

    const VERIFICATION_STATUS = Object.freeze({
        VERIFIED:
            "VERIFIED",

        PARTIAL:
            "PARTIAL",

        SELF_REPORTED:
            "SELF_REPORTED",

        UNVERIFIED:
            "UNVERIFIED",

        PENDING_VERIFICATION:
            "PENDING_VERIFICATION",

        UNKNOWN:
            "UNKNOWN"
    });

    /*
     * =========================================================================
     * TRACK BENCHMARK SCIENCE
     * -------------------------------------------------------------------------
     *
     * These transforms may support PROJECTED intelligence only.
     *
     * They are NOT official domain scoring formulas.
     *
     * No projected signal may silently become:
     *     - Athletic Score
     *     - Production Score
     *     - Competition Score
     *     - STATScore™
     *     - Composite Intelligence
     * =========================================================================
     */

    const TRACK_BENCHMARKS = Object.freeze({

        SPRINT_TIME_SIGNAL: Object.freeze({
            benchmark_key:
                "TRACK_SPRINT_TIME_SIGNAL",

            benchmark_version:
                BENCHMARK_VERSION,

            type:
                "PROJECTED",

            official:
                false
        }),

        DISTANCE_TIME_SIGNAL: Object.freeze({
            benchmark_key:
                "TRACK_DISTANCE_TIME_SIGNAL",

            benchmark_version:
                BENCHMARK_VERSION,

            type:
                "PROJECTED",

            official:
                false
        }),

        JUMP_MARK_SIGNAL: Object.freeze({
            benchmark_key:
                "TRACK_JUMP_MARK_SIGNAL",

            benchmark_version:
                BENCHMARK_VERSION,

            type:
                "PROJECTED",

            official:
                false
        }),

        THROW_MARK_SIGNAL: Object.freeze({
            benchmark_key:
                "TRACK_THROW_MARK_SIGNAL",

            benchmark_version:
                BENCHMARK_VERSION,

            type:
                "PROJECTED",

            official:
                false
        })

    });

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(
            value == null
                ? ""
                : value
        ).trim();
    }

    function upper(value) {
        return normalize(value)
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/-/g, "_")
            .replace(/&/g, "AND");
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

    function clamp(value, min = 0, max = 100) {
        const numeric =
            Number(value);

        if (!Number.isFinite(numeric)) {
            return null;
        }

        return Number(
            Math.max(
                min,
                Math.min(max, numeric)
            ).toFixed(2)
        );
    }

    function normalizeSport(value) {
        const sport =
            upper(value);

        const aliases =
            Object.freeze({
                TRACK:
                    "TRACK",

                TRACK_FIELD:
                    "TRACK",

                TRACK_AND_FIELD:
                    "TRACK",

                TRACKANDFIELD:
                    "TRACK"
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
            return VERIFICATION_STATUS.UNKNOWN;
        }

        if (status === "VERIFIED") {
            return VERIFICATION_STATUS.VERIFIED;
        }

        if (
            status === "PARTIAL" ||
            status === "PARTIALLY_VERIFIED"
        ) {
            return VERIFICATION_STATUS.PARTIAL;
        }

        if (
            status === "SELF_REPORTED" ||
            status === "SELF_REPORTED_ONLY"
        ) {
            return VERIFICATION_STATUS.SELF_REPORTED;
        }

        if (
            status === "PENDING" ||
            status === "PENDING_VERIFICATION" ||
            status === "IN_REVIEW"
        ) {
            return VERIFICATION_STATUS.PENDING_VERIFICATION;
        }

        if (status === "UNVERIFIED") {
            return VERIFICATION_STATUS.UNVERIFIED;
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

    function getTrackPositionAuthority() {
        return (
            global.STATScoreTrackPositionMatrix ||
            global.STATScore
                ?.TrackPositionMatrix ||
            null
        );
    }

    function getInputSport(athlete) {
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

    function getOfficialTime(
        athlete
    ) {
        return (
            numberOrNull(
                athlete
                    ?.official_time
            ) ??
            numberOrNull(
                athlete
                    ?.verified_time
            ) ??
            numberOrNull(
                athlete
                    ?.event_time
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.officialTime
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.official_time
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.verifiedTime
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.verified_time
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.eventTime
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.event_time
            )
        );
    }

    function getOfficialMark(
        athlete
    ) {
        return (
            numberOrNull(
                athlete
                    ?.official_mark
            ) ??
            numberOrNull(
                athlete
                    ?.verified_mark
            ) ??
            numberOrNull(
                athlete
                    ?.event_mark
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.officialMark
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.official_mark
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.verifiedMark
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.verified_mark
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.eventMark
            ) ??
            numberOrNull(
                athlete
                    ?.raw_payload
                    ?.event_mark
            )
        );
    }

    function getSplitData(
        athlete
    ) {
        return (
            athlete?.split_data ||
            athlete?.splits ||
            athlete
                ?.raw_payload
                ?.splitData ||
            athlete
                ?.raw_payload
                ?.split_data ||
            athlete
                ?.raw_payload
                ?.splits ||
            null
        );
    }

    function getDirectTraitSources(
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
                    "raw_payload.track_trait_scores",

                source:
                    athlete
                        ?.raw_payload
                        ?.track_trait_scores
            },
            {
                source_name:
                    "raw_payload.event_trait_scores",

                source:
                    athlete
                        ?.raw_payload
                        ?.event_trait_scores
            }
        ];
    }

    function findDirectTraitEvidence(
        traitKey,
        athlete
    ) {
        const sources =
            getDirectTraitSources(
                athlete
            );

        for (
            const sourceEntry
            of sources
        ) {
            const source =
                sourceEntry.source;

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

            const raw =
                source[
                    matchingKey
                ];

            if (
                raw &&
                typeof raw ===
                    "object" &&
                !Array.isArray(raw)
            ) {
                const value =
                    numberOrNull(
                        raw.value ??
                        raw.score ??
                        raw.rating
                    );

                if (value === null) {
                    continue;
                }

                return {
                    value:
                        clamp(value),

                    confidence:
                        clamp(
                            raw.confidence
                        ),

                    official:
                        raw.official ===
                            true,

                    verification_status:
                        normalizeVerificationStatus(
                            raw.verification_status
                        ),

                    status:
                        upper(
                            raw.status
                        ) ||
                        TRAIT_STATUS
                            .EVIDENCE_AVAILABLE,

                    evidence:
                        Array.isArray(
                            raw.evidence
                        )
                            ? raw.evidence
                            : [],

                    source:
                        sourceEntry
                            .source_name
                };
            }

            const numeric =
                numberOrNull(raw);

            if (numeric !== null) {
                return {
                    value:
                        clamp(numeric),

                    confidence:
                        null,

                    official:
                        false,

                    verification_status:
                        VERIFICATION_STATUS
                            .UNKNOWN,

                    status:
                        TRAIT_STATUS
                            .EVIDENCE_AVAILABLE,

                    evidence:
                        [],

                    source:
                        sourceEntry
                            .source_name
                };
            }
        }

        return null;
    }

    function getTraitVerificationContext(
        traitKey,
        athlete,
        options
    ) {
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
                        clamp(
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
                clamp(
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

    function buildSearchableText(
        athlete
    ) {
        return [
            athlete
                ?.position_notes,
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

    const KEYWORD_MAP =
        Object.freeze({

            START: Object.freeze([
                "start",
                "blocks",
                "reaction"
            ]),

            ACCELERATION: Object.freeze([
                "acceleration",
                "drive phase",
                "explosive start"
            ]),

            MAX_VELOCITY: Object.freeze([
                "top speed",
                "max velocity",
                "speed"
            ]),

            SPEED_ENDURANCE: Object.freeze([
                "speed endurance",
                "holds speed",
                "finish"
            ]),

            SPRINT_MECHANICS: Object.freeze([
                "mechanics",
                "sprint form",
                "running form"
            ]),

            AEROBIC_CAPACITY: Object.freeze([
                "aerobic",
                "endurance",
                "engine"
            ]),

            PACE_CONTROL: Object.freeze([
                "pace",
                "pacing",
                "tempo"
            ]),

            ENDURANCE: Object.freeze([
                "endurance",
                "stamina"
            ]),

            RACE_STRATEGY: Object.freeze([
                "strategy",
                "race iq",
                "tactical"
            ]),

            FINISHING_STRENGTH: Object.freeze([
                "finish",
                "kick",
                "closing"
            ]),

            SPLIT_PERFORMANCE: Object.freeze([
                "split",
                "relay split"
            ]),

            EXCHANGE_EXECUTION: Object.freeze([
                "exchange",
                "handoff",
                "baton"
            ]),

            TEAM_EXECUTION: Object.freeze([
                "relay team",
                "communication",
                "team execution"
            ]),

            APPROACH: Object.freeze([
                "approach",
                "runway"
            ]),

            EXPLOSIVENESS: Object.freeze([
                "explosive",
                "bounce",
                "power"
            ]),

            TAKEOFF: Object.freeze([
                "takeoff",
                "plant"
            ]),

            TECHNIQUE: Object.freeze([
                "technique",
                "technical"
            ]),

            BODY_CONTROL: Object.freeze([
                "body control",
                "air control"
            ]),

            POWER: Object.freeze([
                "power",
                "strength",
                "explosive"
            ]),

            RELEASE_EXECUTION: Object.freeze([
                "release",
                "release mechanics"
            ]),

            IMPLEMENT_CONTROL: Object.freeze([
                "implement control",
                "control"
            ]),

            CONSISTENCY: Object.freeze([
                "consistent",
                "repeatable"
            ]),

            COMPETITION_EXECUTION: Object.freeze([
                "competitive",
                "championship",
                "competition"
            ])

        });

    function collectKeywordEvidence(
        traitKey,
        athlete
    ) {
        const terms =
            KEYWORD_MAP[
                traitKey
            ] || [];

        if (!terms.length) {
            return [];
        }

        const text =
            buildSearchableText(
                athlete
            );

        if (!text) {
            return [];
        }

        return terms
            .filter(
                function (term) {
                    return text.includes(
                        String(term)
                            .toLowerCase()
                    );
                }
            )
            .map(
                function (term) {
                    return {
                        evidence_type:
                            "TEXT_SIGNAL",

                        trait_key:
                            traitKey,

                        matched_term:
                            term,

                        source:
                            "ATHLETE_NOTES_OR_RAW_PAYLOAD"
                    };
                }
            );
    }

    /*
     * =========================================================================
     * PROJECTED BENCHMARK SIGNALS
     * -------------------------------------------------------------------------
     *
     * These are deliberately isolated.
     *
     * No fallback is ever automatic.
     * include_projected_benchmarks must be explicitly true.
     * =========================================================================
     */

    function projectSprintSignal(
        officialTime
    ) {
        if (officialTime === null) {
            return null;
        }

        /*
         * This retains the previous mathematical interpretation only as
         * non-official projection science.
         */

        const projected =
            100 -
            (
                (
                    officialTime -
                    10.8
                ) *
                18
            );

        return clamp(
            projected
        );
    }

    function projectDistanceSignal(
        officialTime
    ) {
        if (officialTime === null) {
            return null;
        }

        const projected =
            100 -
            (
                (
                    officialTime -
                    120
                ) *
                0.16
            );

        return clamp(
            projected
        );
    }

    function projectJumpSignal(
        officialMark
    ) {
        if (officialMark === null) {
            return null;
        }

        return clamp(
            45 +
            (
                officialMark *
                2.2
            )
        );
    }

    function projectThrowSignal(
        officialMark
    ) {
        if (officialMark === null) {
            return null;
        }

        return clamp(
            45 +
            (
                officialMark *
                1.1
            )
        );
    }

    function buildProjectedTraitSignal(
        traitKey,
        eventGroup,
        athlete
    ) {
        const officialTime =
            getOfficialTime(
                athlete
            );

        const officialMark =
            getOfficialMark(
                athlete
            );

        if (
            eventGroup ===
            "SPRINT"
        ) {
            const eligibleTraits = [
                "ACCELERATION",
                "MAX_VELOCITY",
                "SPEED_ENDURANCE",
                "COMPETITION_EXECUTION"
            ];

            if (
                eligibleTraits
                    .includes(
                        traitKey
                    )
            ) {
                const value =
                    projectSprintSignal(
                        officialTime
                    );

                if (value !== null) {
                    return {
                        value,

                        benchmark:
                            TRACK_BENCHMARKS
                                .SPRINT_TIME_SIGNAL,

                        evidence: [
                            {
                                evidence_type:
                                    "OFFICIAL_TIME",

                                raw_value:
                                    officialTime,

                                source:
                                    "ATHLETE_EVIDENCE"
                            }
                        ]
                    };
                }
            }
        }

        if (
            eventGroup ===
            "DISTANCE"
        ) {
            const eligibleTraits = [
                "AEROBIC_CAPACITY",
                "PACE_CONTROL",
                "ENDURANCE",
                "FINISHING_STRENGTH",
                "COMPETITION_EXECUTION"
            ];

            if (
                eligibleTraits
                    .includes(
                        traitKey
                    )
            ) {
                const value =
                    projectDistanceSignal(
                        officialTime
                    );

                if (value !== null) {
                    return {
                        value,

                        benchmark:
                            TRACK_BENCHMARKS
                                .DISTANCE_TIME_SIGNAL,

                        evidence: [
                            {
                                evidence_type:
                                    "OFFICIAL_TIME",

                                raw_value:
                                    officialTime,

                                source:
                                    "ATHLETE_EVIDENCE"
                            }
                        ]
                    };
                }
            }
        }

        if (
            eventGroup ===
            "JUMPS"
        ) {
            const eligibleTraits = [
                "EXPLOSIVENESS",
                "COMPETITION_EXECUTION"
            ];

            if (
                eligibleTraits
                    .includes(
                        traitKey
                    )
            ) {
                const value =
                    projectJumpSignal(
                        officialMark
                    );

                if (value !== null) {
                    return {
                        value,

                        benchmark:
                            TRACK_BENCHMARKS
                                .JUMP_MARK_SIGNAL,

                        evidence: [
                            {
                                evidence_type:
                                    "OFFICIAL_MARK",

                                raw_value:
                                    officialMark,

                                source:
                                    "ATHLETE_EVIDENCE"
                            }
                        ]
                    };
                }
            }
        }

        if (
            eventGroup ===
            "THROWS"
        ) {
            const eligibleTraits = [
                "POWER",
                "RELEASE_EXECUTION",
                "COMPETITION_EXECUTION"
            ];

            if (
                eligibleTraits
                    .includes(
                        traitKey
                    )
            ) {
                const value =
                    projectThrowSignal(
                        officialMark
                    );

                if (value !== null) {
                    return {
                        value,

                        benchmark:
                            TRACK_BENCHMARKS
                                .THROW_MARK_SIGNAL,

                        evidence: [
                            {
                                evidence_type:
                                    "OFFICIAL_MARK",

                                raw_value:
                                    officialMark,

                                source:
                                    "ATHLETE_EVIDENCE"
                            }
                        ]
                    };
                }
            }
        }

        return null;
    }

    function buildTraitIntelligence(
        traitKey,
        eventGroup,
        athlete,
        options
    ) {
        const direct =
            findDirectTraitEvidence(
                traitKey,
                athlete
            );

        const verification =
            getTraitVerificationContext(
                traitKey,
                athlete,
                options
            );

        const keywordEvidence =
            collectKeywordEvidence(
                traitKey,
                athlete
            );

        if (direct) {
            return {
                trait_key:
                    traitKey,

                value:
                    direct.value,

                confidence:
                    direct.confidence ??
                    verification.confidence ??
                    null,

                verification_status:
                    direct.verification_status !==
                        VERIFICATION_STATUS.UNKNOWN
                        ? direct.verification_status
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
                    ...direct.evidence,
                    ...keywordEvidence
                ],

                missing_evidence:
                    [],

                flags: [
                    direct.confidence ===
                        null &&
                    verification.confidence ===
                        null
                        ? "CONFIDENCE_UNAVAILABLE"
                        : null
                ].filter(Boolean),

                interpretation_source:
                    "DIRECT_GOVERNED_TRACK_TRAIT_EVIDENCE",

                projection:
                    null
            };
        }

        if (
            options
                ?.include_projected_benchmarks ===
            true
        ) {
            const projection =
                buildProjectedTraitSignal(
                    traitKey,
                    eventGroup,
                    athlete
                );

            if (
                projection &&
                projection.value !==
                    null
            ) {
                return {
                    trait_key:
                        traitKey,

                    value:
                        projection.value,

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
                        "PROJECTED_TRACK_BENCHMARK_SIGNAL",
                        "PROJECTED_NOT_OFFICIAL",
                        verification
                            .confidence ===
                            null
                            ? "CONFIDENCE_UNAVAILABLE"
                            : null
                    ].filter(Boolean),

                    interpretation_source:
                        "PROJECTED_TRACK_BENCHMARK",

                    projection: {
                        benchmark_key:
                            projection
                                .benchmark
                                .benchmark_key,

                        benchmark_version:
                            projection
                                .benchmark
                                .benchmark_version,

                        official:
                            false,

                        downstream_rule:
                            "Projected Track benchmark intelligence may not become official domain intelligence unless a governed receiving Stream 9 authority explicitly authorizes projected evidence."
                    }
                };
            }
        }

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

    function resolveEventModel(
        athlete
    ) {
        const authority =
            getTrackPositionAuthority();

        if (
            !authority ||
            typeof authority
                .interpretAthlete !==
                "function"
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .EVENT_AUTHORITY_UNAVAILABLE
            };
        }

        const result =
            authority
                .interpretAthlete(
                    athlete
                );

        if (
            !result ||
            (
                result.status ===
                    "UNSUPPORTED_EVENT" ||
                result.status ===
                    "EVENT_REQUIRED" ||
                result.status ===
                    "INVALID_INPUT"
            )
        ) {
            return {
                ok:
                    false,

                status:
                    result
                        ?.status ||
                    STATUS
                        .EVENT_AUTHORITY_INVALID,

                source_result:
                    result ||
                    null
            };
        }

        if (
            !result.event ||
            !result.event_group ||
            !result.traits
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .EVENT_AUTHORITY_INVALID,

                source_result:
                    result
            };
        }

        return {
            ok:
                true,

            status:
                "EVENT_AUTHORITY_READY",

            source_result:
                result
        };
    }

    function determineOverallStatus(
        traits
    ) {
        const values =
            Object.values(
                traits
            );

        const directCount =
            values.filter(
                function (
                    trait
                ) {
                    return (
                        trait.status ===
                        TRAIT_STATUS
                            .EVIDENCE_AVAILABLE
                    );
                }
            ).length;

        const projectedCount =
            values.filter(
                function (
                    trait
                ) {
                    return (
                        trait.status ===
                        TRAIT_STATUS
                            .PROJECTED
                    );
                }
            ).length;

        const missingCount =
            values.filter(
                function (
                    trait
                ) {
                    return (
                        trait.status ===
                        TRAIT_STATUS
                            .INSUFFICIENT_EVIDENCE
                    );
                }
            ).length;

        if (
            directCount === 0 &&
            projectedCount === 0
        ) {
            return STATUS.INSUFFICIENT_EVIDENCE;
        }

        if (
            directCount === 0 &&
            projectedCount > 0 &&
            missingCount === 0
        ) {
            return STATUS.PROJECTED;
        }

        if (
            missingCount > 0 ||
            projectedCount > 0
        ) {
            return STATUS.PARTIAL;
        }

        return STATUS.AVAILABLE;
    }

    function collectEvidenceUsed(
        traits
    ) {
        const evidence = [];

        Object.values(
            traits
        ).forEach(
            function (
                trait
            ) {
                trait
                    .evidence_used
                    .forEach(
                        function (
                            item
                        ) {
                            evidence.push({
                                trait_key:
                                    trait.trait_key,

                                ...item
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
                function (
                    trait
                ) {
                    return (
                        trait.status ===
                        TRAIT_STATUS
                            .INSUFFICIENT_EVIDENCE
                    );
                }
            )
            .map(
                function (
                    trait
                ) {
                    return {
                        trait_key:
                            trait.trait_key,

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
        ).forEach(
            function (
                trait
            ) {
                trait.flags
                    .forEach(
                        function (
                            flag
                        ) {
                            if (
                                !flags
                                    .includes(flag)
                            ) {
                                flags
                                    .push(flag);
                            }
                        }
                    );
            }
        );

        return flags;
    }

    function buildExplanation(
        athlete,
        eventModel,
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
                    function (
                        trait
                    ) {
                        return (
                            trait.status ===
                            TRAIT_STATUS
                                .EVIDENCE_AVAILABLE
                        );
                    }
                )
                .map(
                    function (
                        trait
                    ) {
                        return trait
                            .trait_key;
                    }
                );

        const projectedTraits =
            Object.values(
                traits
            )
                .filter(
                    function (
                        trait
                    ) {
                        return (
                            trait.status ===
                            TRAIT_STATUS
                                .PROJECTED
                        );
                    }
                )
                .map(
                    function (
                        trait
                    ) {
                        return trait
                            .trait_key;
                    }
                );

        const missingTraits =
            Object.values(
                traits
            )
                .filter(
                    function (
                        trait
                    ) {
                        return (
                            trait.status ===
                            TRAIT_STATUS
                                .INSUFFICIENT_EVIDENCE
                        );
                    }
                )
                .map(
                    function (
                        trait
                    ) {
                        return trait
                            .trait_key;
                    }
                );

        return {
            summary:
                `${athleteName} was interpreted through the Track Sport Intelligence Authority for ${eventModel.event.label} / ${eventModel.event_group.label}. This is supporting Track trait intelligence only and is not an official Athletic Score, Production Score, Competition Score, STATScore™, or Composite score.`,

            status,

            factors: [
                "Canonical Track Event / Position Matrix Authority consumed.",
                "Track event and event-group context preserved.",
                "Direct governed Track trait evidence interpreted where available.",
                "Raw Track time/mark evidence preserved independently from verification standing.",
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
                "No baseline Track performance values are manufactured.",
                "Unknown events do not default to SPRINT.",
                "No arithmetic average of Track traits is published as an official score.",
                "Verification does not alter the underlying Track time, mark, split, or trait value.",
                "Projected benchmark signals are not official intelligence.",
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
                    "object" ||
                Array.isArray(athlete)
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

                lastResult =
                    result;

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

                lastResult =
                    result;

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
                        "TRACK_AUTHORITY_REQUIRES_TRACK_SPORT"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            if (
                !athlete
                    .athlete_id ||
                !athlete
                    .snapshot_id
            ) {
                const missing =
                    [];

                if (
                    !athlete
                        .athlete_id
                ) {
                    missing.push(
                        "athlete_id"
                    );
                }

                if (
                    !athlete
                        .snapshot_id
                ) {
                    missing.push(
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
                        STATUS.INVALID_INPUT,

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
                        missing,

                    flags: [
                        "REQUIRED_IDENTITY_MISSING"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            const eventAuthority =
                resolveEventModel(
                    athlete
                );

            if (
                !eventAuthority.ok
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
                        eventAuthority
                            .status,

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
                        eventAuthority
                            .status
                    ],

                    event_authority_result:
                        eventAuthority
                            .source_result ||
                        null,

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            const eventModel =
                eventAuthority
                    .source_result;

            const eventGroup =
                eventModel
                    .event_group
                    .code;

            const traitKeys =
                Object.keys(
                    eventModel
                        .traits
                );

            const traits = {};

            traitKeys
                .forEach(
                    function (
                        traitKey
                    ) {
                        traits[
                            traitKey
                        ] =
                            buildTraitIntelligence(
                                traitKey,
                                eventGroup,
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

                event: {
                    code:
                        eventModel
                            .event
                            .code,

                    label:
                        eventModel
                            .event
                            .label
                },

                event_group: {
                    code:
                        eventModel
                            .event_group
                            .code,

                    label:
                        eventModel
                            .event_group
                            .label
                },

                archetype_candidates:
                    Array.isArray(
                        eventModel
                            .archetypes
                    )
                        ? eventModel
                            .archetypes
                        : [],

                traits,

                raw_measurements: {
                    official_time:
                        getOfficialTime(
                            athlete
                        ),

                    official_mark:
                        getOfficialMark(
                            athlete
                        ),

                    split_data:
                        getSplitData(
                            athlete
                        )
                },

                evidence_used:
                    collectEvidenceUsed(
                        traits
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
                        eventModel,
                        traits,
                        status,
                        options
                    ),

                status,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

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
                    "TRACK_INTELLIGENCE_EXECUTION_ERROR"
                ],

                error:
                    lastError
                        .message,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }
    }

    /*
     * =========================================================================
     * COMPATIBILITY ALIAS
     * -------------------------------------------------------------------------
     *
     * Legacy callers may invoke scoreAthlete().
     *
     * It now returns supporting Track intelligence only.
     *
     * It intentionally DOES NOT return:
     *     final_score
     *     score_final
     *     score_band
     *     star_projection
     * =========================================================================
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

    function getRawMeasurementModel(
        athlete = {}
    ) {
        return {
            official_time: {
                value:
                    getOfficialTime(
                        athlete
                    ),

                meaning:
                    "Raw Track time preserved without verification-based mutation."
            },

            official_mark: {
                value:
                    getOfficialMark(
                        athlete
                    ),

                meaning:
                    "Raw Track mark preserved without verification-based mutation."
            },

            split_data: {
                value:
                    getSplitData(
                        athlete
                    ),

                meaning:
                    "Raw split evidence preserved for downstream interpretation."
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
                "STATScoreTrackPositionMatrix"
            ],

            required_input: [
                "athlete_id",
                "snapshot_id",
                "sport",
                "track event"
            ],

            optional_input: [
                "trait_scores",
                "official_time",
                "official_mark",
                "split_data",
                "event film",
                "verification_by_trait",
                "confidence"
            ],

            output: [
                "athlete_id",
                "snapshot_id",
                "sport",
                "event",
                "event_group",
                "archetype_candidates",
                "traits",
                "raw_measurements",
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

            missing_evidence_rule:
                "Missing Track evidence remains null with INSUFFICIENT_EVIDENCE. No baseline performance value may be manufactured.",

            event_rule:
                "Unknown or unsupported Track events fail closed and are never defaulted to SPRINT.",

            verification_rule:
                "Verification may affect confidence/provenance only. It never modifies the underlying time, mark, split, or trait performance value.",

            projection_rule:
                "Projected Track benchmark intelligence is disabled by default and always non-official.",

            downstream_rule:
                "Official Track-related domain scores must be generated by the applicable registered Stream 9 matrices.",

            presentation_rule:
                "No DOM rendering or page manipulation is permitted.",

            execution_rule:
                "Explicit invocation only. Loading this authority does not interpret an athlete."
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
                TRACK_BENCHMARKS,

            projected_benchmark_default:
                false,

            fabricated_baselines:
                false,

            unknown_event_fallback:
                false,

            official_score_publication:
                false,

            official_star_publication:
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

        const eventAuthority =
            getTrackPositionAuthority();

        const eventAuthorityAvailable =
            Boolean(
                eventAuthority &&
                typeof eventAuthority
                    .interpretAthlete ===
                    "function"
            );

        const healthy =
            stream9.valid &&
            eventAuthorityAvailable;

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

            track_event_authority_available:
                eventAuthorityAvailable,

            projected_benchmark_default:
                false,

            fabricated_baseline_scoring:
                false,

            unknown_event_defaults_to_sprint:
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

    const TrackSportIntelligenceAuthority =
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
                "SUPPORTING_TRACK_SPORT_INTELLIGENCE_AUTHORITY",

            official_score_publisher:
                false,

            interpretAthlete,

            /*
             * Compatibility alias only.
             * No official score is returned.
             */
            scoreAthlete,

            getRawMeasurementModel,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScoreTrackScoringEngine =
        TrackSportIntelligenceAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.TrackScoringEngine =
        TrackSportIntelligenceAuthority;

    console.info(
        "[STATS-CORE] Track Sport Intelligence Authority loaded:",
        VERSION,
        "| explicit invocation required | baseline scoring removed | official scoring disabled"
    );

})(window); 
