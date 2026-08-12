/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-baseball-scoring-engine.js
*
* Canonical Classification:
*     SUPPORTING BASEBALL SPORT INTELLIGENCE AUTHORITY
*
* Production Role:
*     Interpret governed baseball evidence into structured baseball trait
*     intelligence for downstream Stream 9 domain authorities.
*
* Constitutional Chain:
*
*     Governed Baseball Evidence
*              ↓
*     Baseball Position / Archetype Authority
*              ↓
*     Baseball Trait Interpretation
*              ↓
*     Registered Stream 9 Domain Matrices
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*
* This authority DOES:
*     - consume baseball position/archetype definitions;
*     - interpret direct governed baseball trait evidence;
*     - interpret baseball measurables;
*     - preserve raw measurement meaning;
*     - expose evidence used and evidence missing;
*     - preserve verification separately from performance;
*     - optionally generate explicitly PROJECTED benchmark intelligence;
*     - produce explainable supporting baseball intelligence.
*
* This authority DOES NOT:
*     - manufacture missing trait values;
*     - use baseline athlete scores;
*     - increase performance because evidence is verified;
*     - average traits into an official Baseball Score;
*     - publish Athletic Score;
*     - publish Production Score;
*     - publish Competition Score;
*     - publish Verification Score;
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
*     STATSCORE-BASEBALL-INTELLIGENCE-V2
*
* Contract Version:
*     STATSCORE-BASEBALL-INTELLIGENCE-CONTRACT-V1
*
* Status:
*     PRODUCTION RECONSTRUCTION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID = "statscore-baseball-scoring-engine";
    const AUTHORITY_KEY = "BASEBALL_SPORT_INTELLIGENCE";
    const VERSION = "STATSCORE-BASEBALL-INTELLIGENCE-V2";
    const CONTRACT_VERSION = "STATSCORE-BASEBALL-INTELLIGENCE-CONTRACT-V1";
    const BENCHMARK_VERSION = "STATSCORE-BASEBALL-BENCHMARK-SCIENCE-V1";

    const STREAM_OWNER = "STATSCORE_STREAM_9";
    const SPORT = "BASEBALL";

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
    BASEBALL MEASURABLE SCIENCE
    ----------------------------------------------------------------------------
    These are supporting interpretation functions.

    Any normalized 0–100 values produced from the benchmark functions below are
    PROJECTED baseball benchmark signals only.

    They are NOT official Athletic Scores, Production Scores, or STATScore™.
    ============================================================================
    */

    const BASEBALL_BENCHMARKS = Object.freeze({

        PITCH_VELOCITY: Object.freeze({
            unit: "MPH",
            floor_value: 70,
            ceiling_value: 100,
            projected_floor_signal: 55,
            projected_slope: 3
        }),

        EXIT_VELOCITY: Object.freeze({
            unit: "MPH",
            floor_value: 70,
            ceiling_value: 115,
            projected_floor_signal: 55,
            projected_slope: 2.5
        }),

        POP_TIME: Object.freeze({
            unit: "SECONDS",
            reference_value: 1.75,
            projected_slope: 80,
            lower_is_better: true
        }),

        SIXTY_YARD_DASH: Object.freeze({
            unit: "SECONDS",
            reference_value: 6.4,
            projected_slope: 28,
            lower_is_better: true
        })

    });

    const KEYWORD_EVIDENCE_MAP = Object.freeze({

        VELOCITY: Object.freeze([
            "velocity",
            "velo",
            "fastball"
        ]),

        FASTBALL_LIFE: Object.freeze([
            "ride",
            "life",
            "fastball"
        ]),

        STRIKE_THROWING: Object.freeze([
            "strike throwing",
            "strike",
            "control",
            "zone"
        ]),

        COMMAND: Object.freeze([
            "command",
            "spot",
            "locate"
        ]),

        SECONDARY_STUFF: Object.freeze([
            "secondary",
            "curve",
            "slider",
            "changeup"
        ]),

        SECONDARY_CONTROL: Object.freeze([
            "secondary command",
            "secondary control",
            "changeup command",
            "breaking ball command"
        ]),

        BREAKING_BALL_QUALITY: Object.freeze([
            "breaking ball",
            "slider",
            "curve",
            "spin"
        ]),

        SPIN_PROFILE: Object.freeze([
            "spin profile",
            "spin rate",
            "spin"
        ]),

        PITCH_SEQUENCING: Object.freeze([
            "sequencing",
            "pitch sequence",
            "changes eye level"
        ]),

        SWING_AND_MISS_ABILITY: Object.freeze([
            "swing and miss",
            "strikeout",
            "whiff"
        ]),

        DECEPTION: Object.freeze([
            "deception",
            "hides ball",
            "tunneling"
        ]),

        PITCHABILITY: Object.freeze([
            "pitchability",
            "pitch iq",
            "feel for pitching"
        ]),

        MOUND_PRESENCE: Object.freeze([
            "mound presence",
            "presence",
            "poise"
        ]),

        COMPOSURE: Object.freeze([
            "composure",
            "poise",
            "calm"
        ]),

        RECEIVING: Object.freeze([
            "receiving",
            "framing",
            "quiet hands"
        ]),

        BLOCKING: Object.freeze([
            "blocking",
            "block"
        ]),

        THROWING_ARM: Object.freeze([
            "throwing arm",
            "arm strength",
            "carry"
        ]),

        POP_TIME: Object.freeze([
            "pop time",
            "quick release"
        ]),

        GAME_MANAGEMENT: Object.freeze([
            "game management",
            "calls game",
            "game caller"
        ]),

        PITCHER_HANDLING: Object.freeze([
            "pitcher handling",
            "handles staff",
            "pitching staff"
        ]),

        LEADERSHIP: Object.freeze([
            "leader",
            "leadership",
            "captain"
        ]),

        HANDS: Object.freeze([
            "hands",
            "soft hands",
            "fielding"
        ]),

        FOOTWORK: Object.freeze([
            "footwork",
            "feet"
        ]),

        ARM_STRENGTH: Object.freeze([
            "arm strength",
            "strong arm"
        ]),

        ARM_ACCURACY: Object.freeze([
            "arm accuracy",
            "accurate throws"
        ]),

        RANGE: Object.freeze([
            "range",
            "cover ground"
        ]),

        TRANSFER: Object.freeze([
            "transfer",
            "quick exchange"
        ]),

        BASEBALL_IQ: Object.freeze([
            "baseball iq",
            "instincts",
            "smart player"
        ]),

        DEFENSIVE_RELIABILITY: Object.freeze([
            "defensive reliability",
            "steady defender",
            "reliable defender"
        ]),

        DOUBLE_PLAY_ABILITY: Object.freeze([
            "double play",
            "turn two"
        ]),

        REACTION: Object.freeze([
            "reaction",
            "quick reaction",
            "reaction time"
        ]),

        HIT_TOOL: Object.freeze([
            "hit tool",
            "hitter",
            "bat"
        ]),

        CONTACT_ABILITY: Object.freeze([
            "contact",
            "bat to ball"
        ]),

        BAT_TO_BALL_SKILL: Object.freeze([
            "bat to ball",
            "contact skill"
        ]),

        POWER: Object.freeze([
            "power",
            "slug",
            "extra base",
            "home run"
        ]),

        EXIT_VELOCITY: Object.freeze([
            "exit velocity",
            "exit velo",
            "hard contact"
        ]),

        PLATE_DISCIPLINE: Object.freeze([
            "plate discipline",
            "discipline",
            "walk",
            "strike zone"
        ]),

        CONTACT_QUALITY: Object.freeze([
            "barrel",
            "quality contact",
            "hard contact"
        ]),

        APPROACH: Object.freeze([
            "approach",
            "hitting approach",
            "plan at plate"
        ]),

        SITUATIONAL_HITTING: Object.freeze([
            "situational hitting",
            "situational",
            "productive out"
        ]),

        RUN_PRODUCTION: Object.freeze([
            "run production",
            "rbi",
            "drives in runs"
        ]),

        CONSISTENCY: Object.freeze([
            "consistent",
            "consistency",
            "repeatable"
        ]),

        ON_BASE_VALUE: Object.freeze([
            "on base",
            "on-base",
            "obp"
        ]),

        LAUNCH_PROFILE: Object.freeze([
            "launch",
            "launch angle",
            "trajectory"
        ]),

        PITCH_RECOGNITION: Object.freeze([
            "pitch recognition",
            "recognizes pitches"
        ]),

        DAMAGE_POTENTIAL: Object.freeze([
            "damage",
            "impact contact",
            "extra base damage"
        ]),

        ROUTE_EFFICIENCY: Object.freeze([
            "route",
            "efficient route"
        ]),

        FIRST_STEP: Object.freeze([
            "first step",
            "jump on ball"
        ]),

        BALL_TRACKING: Object.freeze([
            "tracking",
            "reads ball",
            "ball tracking"
        ]),

        SPEED: Object.freeze([
            "speed",
            "fast",
            "runner"
        ]),

        COMMUNICATION: Object.freeze([
            "communication",
            "communicator"
        ]),

        TOP_OF_ORDER_VALUE: Object.freeze([
            "top of order",
            "leadoff",
            "table setter"
        ]),

        VERSATILITY: Object.freeze([
            "versatile",
            "utility",
            "multiple positions"
        ]),

        ARM_UTILITY: Object.freeze([
            "arm utility",
            "throws from multiple positions"
        ]),

        ROLE_ADAPTABILITY: Object.freeze([
            "adaptable",
            "role flexibility",
            "role adaptability"
        ]),

        ATHLETICISM: Object.freeze([
            "athletic",
            "athleticism",
            "explosive"
        ])

    });

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(value == null ? "" : value).trim();
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

        const normalized = String(value)
            .trim()
            .replace(/,/g, "")
            .replace(/[^\d.-]/g, "");

        if (!normalized) {
            return null;
        }

        const numeric = Number(normalized);

        return Number.isFinite(numeric)
            ? numeric
            : null;
    }

    function normalizeScore(value) {
        const numeric = numberOrNull(value);

        if (numeric === null) {
            return null;
        }

        return Number(
            Math.max(
                0,
                Math.min(100, numeric)
            ).toFixed(2)
        );
    }

    function clamp(value, min = 0, max = 100) {
        const numeric = Number(value);

        if (!Number.isFinite(numeric)) {
            return null;
        }

        return Math.max(
            min,
            Math.min(max, numeric)
        );
    }

    function normalizeSport(value) {
        const sport = upper(value);

        const aliases = Object.freeze({
            BASEBALL: "BASEBALL",
            BASE_BALL: "BASEBALL",
            BB: "BASEBALL"
        });

        return aliases[sport] || sport || "UNKNOWN";
    }

    function normalizeVerificationStatus(value) {
        const status = upper(value);

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

    function getPositionAuthority() {
        return (
            global.STATScoreBaseballPositionMatrix ||
            global.STATScore?.BaseballPositionMatrix ||
            null
        );
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

    function buildSearchableText(athlete) {
        return [
            athlete?.position_notes,
            athlete?.verified_event_source,
            athlete?.raw_payload?.notes,
            athlete?.raw_payload?.style,
            athlete?.raw_payload?.strengths,
            athlete?.raw_payload?.weaknesses
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    }

    function collectGlobalEvidence(athlete) {
        const evidence = [];

        if (athlete?.highlight_url) {
            evidence.push({
                evidence_type: "HIGHLIGHT_FILM",
                value: athlete.highlight_url,
                source: "ATHLETE_SOURCE_RECORD"
            });
        }

        if (athlete?.game_film_url) {
            evidence.push({
                evidence_type: "GAME_FILM",
                value: athlete.game_film_url,
                source: "ATHLETE_SOURCE_RECORD"
            });
        }

        if (athlete?.recruiting_profile_url) {
            evidence.push({
                evidence_type: "RECRUITING_PROFILE",
                value: athlete.recruiting_profile_url,
                source: "ATHLETE_SOURCE_RECORD"
            });
        }

        if (athlete?.verified_event_source) {
            evidence.push({
                evidence_type: "EVENT_SOURCE",
                value: athlete.verified_event_source,
                source: "ATHLETE_SOURCE_RECORD"
            });
        }

        return evidence;
    }

    function getTraitSourceObjects(athlete) {
        return [
            {
                source_name: "trait_scores",
                source: athlete?.trait_scores
            },
            {
                source_name: "raw_payload.trait_scores",
                source: athlete?.raw_payload?.trait_scores
            },
            {
                source_name: "raw_payload.baseball_trait_scores",
                source: athlete?.raw_payload?.baseball_trait_scores
            },
            {
                source_name: "raw_payload.position_trait_scores",
                source: athlete?.raw_payload?.position_trait_scores
            }
        ];
    }

    function findDirectTraitEvidence(
        traitName,
        athlete
    ) {
        const traitKey = upper(traitName);

        const sources =
            getTraitSourceObjects(athlete);

        for (const entry of sources) {
            const source = entry.source;

            if (
                !source ||
                typeof source !== "object"
            ) {
                continue;
            }

            const matchingKey =
                Object.keys(source).find(
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
                source[matchingKey];

            if (
                rawValue &&
                typeof rawValue === "object" &&
                !Array.isArray(rawValue)
            ) {
                const value =
                    normalizeScore(
                        rawValue.value ??
                        rawValue.score ??
                        rawValue.rating
                    );

                if (value === null) {
                    continue;
                }

                return {
                    value,

                    status:
                        upper(rawValue.status) ||
                        TRAIT_STATUS.EVIDENCE_AVAILABLE,

                    official:
                        rawValue.official === true,

                    confidence:
                        normalizeScore(
                            rawValue.confidence
                        ),

                    verification_status:
                        normalizeVerificationStatus(
                            rawValue.verification_status
                        ),

                    evidence:
                        Array.isArray(
                            rawValue.evidence
                        )
                            ? rawValue.evidence
                            : [],

                    source:
                        entry.source_name
                };
            }

            const value =
                normalizeScore(rawValue);

            if (value === null) {
                continue;
            }

            return {
                value,
                status:
                    TRAIT_STATUS.EVIDENCE_AVAILABLE,
                official:
                    false,
                confidence:
                    null,
                verification_status:
                    VERIFICATION_STATUS.UNKNOWN,
                evidence:
                    [],
                source:
                    entry.source_name
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
            options?.verification_by_trait,
            athlete?.verification_by_trait,
            athlete?.raw_payload?.verification_by_trait
        ];

        for (const context of contexts) {
            if (
                !context ||
                typeof context !== "object"
            ) {
                continue;
            }

            const matchingKey =
                Object.keys(context).find(
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
                context[matchingKey];

            if (
                record &&
                typeof record === "object"
            ) {
                return {
                    verification_status:
                        normalizeVerificationStatus(
                            record.verification_status ||
                            record.status
                        ),

                    confidence:
                        normalizeScore(
                            record.confidence
                        ),

                    evidence_id:
                        record.evidence_id || null,

                    source_record_id:
                        record.source_record_id || null,

                    receipt_id:
                        record.receipt_id || null,

                    professional_id:
                        record.professional_id || null,

                    certification_id:
                        record.certification_id || null
                };
            }
        }

        return {
            verification_status:
                normalizeVerificationStatus(
                    options?.verification_status ||
                    athlete?.verification_status
                ),

            confidence:
                normalizeScore(
                    options?.confidence
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

        if (!keywords.length) {
            return [];
        }

        const text =
            buildSearchableText(athlete);

        if (!text) {
            return [];
        }

        return keywords
            .filter(function (keyword) {
                return text.includes(
                    String(keyword)
                        .toLowerCase()
                );
            })
            .map(function (keyword) {
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
            });
    }

    /*
    ============================================================================
    RAW BASEBALL MEASURABLE EXTRACTION
    ============================================================================
    */

    function getPitchVelocity(athlete) {
        return (
            numberOrNull(
                athlete?.pitch_velocity
            ) ??
            numberOrNull(
                athlete?.velocity
            ) ??
            numberOrNull(
                athlete?.raw_payload?.pitchVelocity
            ) ??
            numberOrNull(
                athlete?.raw_payload?.pitch_velocity
            ) ??
            numberOrNull(
                athlete?.raw_payload?.velocity
            )
        );
    }

    function getExitVelocity(athlete) {
        return (
            numberOrNull(
                athlete?.exit_velocity
            ) ??
            numberOrNull(
                athlete?.raw_payload?.exitVelocity
            ) ??
            numberOrNull(
                athlete?.raw_payload?.exit_velocity
            )
        );
    }

    function getPopTime(athlete) {
        return (
            numberOrNull(
                athlete?.pop_time
            ) ??
            numberOrNull(
                athlete?.raw_payload?.popTime
            ) ??
            numberOrNull(
                athlete?.raw_payload?.pop_time
            )
        );
    }

    function getSixtyYardDash(athlete) {
        return (
            numberOrNull(
                athlete?.sixty_yard_dash
            ) ??
            numberOrNull(
                athlete?.raw_payload?.sixtyYardDash
            ) ??
            numberOrNull(
                athlete?.raw_payload?.sixty_yard_dash
            )
        );
    }

    /*
    ============================================================================
    PROJECTED BENCHMARK INTERPRETATION
    ----------------------------------------------------------------------------
    Projection is optional and disabled by default.

    A projected benchmark value is:
        - supporting intelligence;
        - explicitly PROJECTED;
        - official: false;
        - excluded from official scoring unless a downstream authority explicitly
          authorizes projected evidence.
    ============================================================================
    */

    function projectPitchVelocitySignal(
        velocity
    ) {
        if (velocity === null) {
            return null;
        }

        const benchmark =
            BASEBALL_BENCHMARKS.PITCH_VELOCITY;

        const raw =
            (
                velocity -
                benchmark.floor_value
            ) *
            benchmark.projected_slope +
            benchmark.projected_floor_signal;

        return Number(
            clamp(raw, 0, 100)
                .toFixed(2)
        );
    }

    function projectExitVelocitySignal(
        exitVelocity
    ) {
        if (exitVelocity === null) {
            return null;
        }

        const benchmark =
            BASEBALL_BENCHMARKS.EXIT_VELOCITY;

        const raw =
            (
                exitVelocity -
                benchmark.floor_value
            ) *
            benchmark.projected_slope +
            benchmark.projected_floor_signal;

        return Number(
            clamp(raw, 0, 100)
                .toFixed(2)
        );
    }

    function projectPopTimeSignal(
        popTime
    ) {
        if (popTime === null) {
            return null;
        }

        const benchmark =
            BASEBALL_BENCHMARKS.POP_TIME;

        const raw =
            100 -
            (
                (
                    popTime -
                    benchmark.reference_value
                ) *
                benchmark.projected_slope
            );

        return Number(
            clamp(raw, 0, 100)
                .toFixed(2)
        );
    }

    function projectSixtyYardSignal(
        sixty
    ) {
        if (sixty === null) {
            return null;
        }

        const benchmark =
            BASEBALL_BENCHMARKS.SIXTY_YARD_DASH;

        const raw =
            100 -
            (
                (
                    sixty -
                    benchmark.reference_value
                ) *
                benchmark.projected_slope
            );

        return Number(
            clamp(raw, 0, 100)
                .toFixed(2)
        );
    }

    function buildMetricProjection(
        traitName,
        athlete
    ) {
        const trait =
            upper(traitName);

        const pitchVelocity =
            getPitchVelocity(athlete);

        const exitVelocity =
            getExitVelocity(athlete);

        const popTime =
            getPopTime(athlete);

        const sixty =
            getSixtyYardDash(athlete);

        if (
            (
                trait === "VELOCITY" ||
                trait === "FASTBALL_LIFE"
            ) &&
            pitchVelocity !== null
        ) {
            return {
                value:
                    projectPitchVelocitySignal(
                        pitchVelocity
                    ),

                benchmark_type:
                    "PITCH_VELOCITY",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    {
                        evidence_type:
                            "MEASURABLE",

                        measurable:
                            "PITCH_VELOCITY",

                        raw_value:
                            pitchVelocity,

                        unit:
                            "MPH",

                        source:
                            "ATHLETE_EVIDENCE"
                    }
                ]
            };
        }

        if (
            (
                trait === "EXIT_VELOCITY" ||
                trait === "POWER" ||
                trait === "DAMAGE_POTENTIAL" ||
                trait === "CONTACT_QUALITY"
            ) &&
            exitVelocity !== null
        ) {
            return {
                value:
                    projectExitVelocitySignal(
                        exitVelocity
                    ),

                benchmark_type:
                    "EXIT_VELOCITY",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    {
                        evidence_type:
                            "MEASURABLE",

                        measurable:
                            "EXIT_VELOCITY",

                        raw_value:
                            exitVelocity,

                        unit:
                            "MPH",

                        source:
                            "ATHLETE_EVIDENCE"
                    }
                ]
            };
        }

        if (
            trait === "POP_TIME" &&
            popTime !== null
        ) {
            return {
                value:
                    projectPopTimeSignal(
                        popTime
                    ),

                benchmark_type:
                    "POP_TIME",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    {
                        evidence_type:
                            "MEASURABLE",

                        measurable:
                            "POP_TIME",

                        raw_value:
                            popTime,

                        unit:
                            "SECONDS",

                        source:
                            "ATHLETE_EVIDENCE"
                    }
                ]
            };
        }

        if (
            (
                trait === "SPEED" ||
                trait === "RANGE" ||
                trait === "FIRST_STEP" ||
                trait === "ATHLETICISM"
            ) &&
            sixty !== null
        ) {
            return {
                value:
                    projectSixtyYardSignal(
                        sixty
                    ),

                benchmark_type:
                    "SIXTY_YARD_DASH",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    {
                        evidence_type:
                            "MEASURABLE",

                        measurable:
                            "SIXTY_YARD_DASH",

                        raw_value:
                            sixty,

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
            upper(traitName);

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
        Direct governed trait evidence
        ------------------------------------------------------------------------
        Performance value is preserved exactly as supplied by the governed
        trait source. Verification may affect confidence/status, but never
        changes the trait value.
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
                    verification.confidence ??
                    null,

                verification_status:
                    direct.verification_status !==
                        VERIFICATION_STATUS.UNKNOWN
                        ? direct.verification_status
                        : verification.verification_status,

                status:
                    direct.status ||
                    TRAIT_STATUS.EVIDENCE_AVAILABLE,

                official:
                    direct.official === true,

                evidence_used: [
                    ...direct.evidence,
                    ...keywordEvidence
                ],

                missing_evidence:
                    [],

                flags: [
                    direct.confidence === null &&
                    verification.confidence === null
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
        Optional projected benchmark intelligence
        ------------------------------------------------------------------------
        No baseline fallback exists.

        If the measurable is absent, the trait remains null.
        ------------------------------------------------------------------------
        */

        if (
            options?.include_projected_benchmarks === true
        ) {
            const projection =
                buildMetricProjection(
                    traitKey,
                    athlete
                );

            if (
                projection &&
                projection.value !== null
            ) {
                return {
                    trait_key:
                        traitKey,

                    value:
                        projection.value,

                    confidence:
                        verification.confidence,

                    verification_status:
                        verification.verification_status,

                    status:
                        TRAIT_STATUS.PROJECTED,

                    official:
                        false,

                    evidence_used: [
                        ...projection.evidence,
                        ...keywordEvidence
                    ],

                    missing_evidence:
                        [],

                    flags: [
                        "PROJECTED_BENCHMARK_SIGNAL",
                        "PROJECTED_NOT_OFFICIAL",
                        verification.confidence === null
                            ? "CONFIDENCE_UNAVAILABLE"
                            : null
                    ].filter(Boolean),

                    interpretation_source:
                        "PROJECTED_BASEBALL_BENCHMARK",

                    projection: {
                        benchmark_type:
                            projection.benchmark_type,

                        benchmark_version:
                            projection.benchmark_version,

                        official:
                            false,

                        downstream_rule:
                            "Projected baseball benchmark intelligence may not become official domain intelligence unless the receiving Stream 9 authority explicitly authorizes projected evidence."
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
                verification.confidence,

            verification_status:
                verification.verification_status,

            status:
                TRAIT_STATUS.INSUFFICIENT_EVIDENCE,

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
            result.sport !== SPORT
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
                result.trait_keys
            )
        ) {
            return false;
        }

        return true;
    }

    function resolveBaseballPositionModel(
        athlete,
        options
    ) {
        const authority =
            getPositionAuthority();

        if (
            !authority ||
            typeof authority.resolveMatrix !==
                "function"
        ) {
            return {
                ok: false,
                status:
                    STATUS.POSITION_AUTHORITY_UNAVAILABLE
            };
        }

        const result =
            authority.resolveMatrix(
                athlete,
                {
                    archetype:
                        options?.archetype
                }
            );

        if (
            !validatePositionAuthorityResult(
                result
            )
        ) {
            return {
                ok: false,
                status:
                    STATUS.POSITION_CONTRACT_INVALID,
                source_result:
                    result || null
            };
        }

        return result;
    }

    function determineOverallStatus(
        traits
    ) {
        const values =
            Object.values(traits);

        const availableCount =
            values.filter(
                function (trait) {
                    return (
                        trait.status ===
                        TRAIT_STATUS.EVIDENCE_AVAILABLE
                    );
                }
            ).length;

        const projectedCount =
            values.filter(
                function (trait) {
                    return (
                        trait.status ===
                        TRAIT_STATUS.PROJECTED
                    );
                }
            ).length;

        const insufficientCount =
            values.filter(
                function (trait) {
                    return (
                        trait.status ===
                        TRAIT_STATUS.INSUFFICIENT_EVIDENCE
                    );
                }
            ).length;

        if (
            availableCount === 0 &&
            projectedCount === 0
        ) {
            return STATUS.INSUFFICIENT_EVIDENCE;
        }

        if (
            projectedCount > 0 &&
            availableCount === 0 &&
            insufficientCount === 0
        ) {
            return STATUS.PROJECTED;
        }

        if (
            insufficientCount === 0 &&
            projectedCount === 0
        ) {
            return STATUS.AVAILABLE;
        }

        return STATUS.PARTIAL;
    }

    function collectEvidenceUsed(
        traits
    ) {
        const evidence = [];

        Object.values(traits)
            .forEach(function (trait) {
                trait.evidence_used
                    .forEach(
                        function (entry) {
                            evidence.push({
                                trait_key:
                                    trait.trait_key,
                                ...entry
                            });
                        }
                    );
            });

        return evidence;
    }

    function collectMissingEvidence(
        traits
    ) {
        return Object.values(traits)
            .filter(function (trait) {
                return (
                    trait.status ===
                    TRAIT_STATUS.INSUFFICIENT_EVIDENCE
                );
            })
            .map(function (trait) {
                return {
                    trait_key:
                        trait.trait_key,

                    missing:
                        Array.from(
                            trait.missing_evidence
                        )
                };
            });
    }

    function collectFlags(
        traits
    ) {
        const flags = [];

        Object.values(traits)
            .forEach(function (trait) {
                trait.flags.forEach(
                    function (flag) {
                        if (
                            !flags.includes(
                                flag
                            )
                        ) {
                            flags.push(flag);
                        }
                    }
                );
            });

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
            athlete?.athlete_display_name ||
            [
                athlete?.first_name,
                athlete?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            "Athlete";

        const availableTraits =
            Object.values(traits)
                .filter(function (trait) {
                    return (
                        trait.status ===
                        TRAIT_STATUS.EVIDENCE_AVAILABLE
                    );
                })
                .map(function (trait) {
                    return trait.trait_key;
                });

        const projectedTraits =
            Object.values(traits)
                .filter(function (trait) {
                    return (
                        trait.status ===
                        TRAIT_STATUS.PROJECTED
                    );
                })
                .map(function (trait) {
                    return trait.trait_key;
                });

        const missingTraits =
            Object.values(traits)
                .filter(function (trait) {
                    return (
                        trait.status ===
                        TRAIT_STATUS.INSUFFICIENT_EVIDENCE
                    );
                })
                .map(function (trait) {
                    return trait.trait_key;
                });

        return {
            summary:
                `${athleteName} was interpreted through the Baseball Sport Intelligence Authority using ${positionModel.matrix.matrix_code} for ${positionModel.position.label} / ${positionModel.archetype.label}. This output is supporting baseball trait intelligence only and is not an official Athletic Score, Production Score, Composite Score, or STATScore™.`,

            status,

            factors: [
                "Canonical Baseball Position Matrix Authority consumed.",
                "Baseball position and archetype context preserved.",
                "Direct trait evidence interpreted where available.",
                "Baseball measurable evidence preserved independently from verification standing.",
                options?.include_projected_benchmarks === true
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
                "No baseline baseball performance values are manufactured.",
                "No trait average is published as an official score.",
                "Verification does not increase or decrease the underlying baseball measurement.",
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
                typeof athlete !== "object"
            ) {
                const result = {
                    ok: false,
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

                lastResult = result;
                return result;
            }

            const authorityValidation =
                validateStream9Authority();

            if (!authorityValidation.valid) {
                const result = {
                    ok: false,
                    authority:
                        ENGINE_ID,
                    authority_key:
                        AUTHORITY_KEY,
                    authority_version:
                        VERSION,
                    contract_version:
                        CONTRACT_VERSION,
                    status:
                        authorityValidation.status,
                    official:
                        false,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    sport:
                        getInputSport(athlete),
                    flags: [
                        authorityValidation.status
                    ],
                    generated_at:
                        nowISO()
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
                    authority_key:
                        AUTHORITY_KEY,
                    authority_version:
                        VERSION,
                    contract_version:
                        CONTRACT_VERSION,
                    status:
                        STATUS.UNSUPPORTED_SPORT,
                    official:
                        false,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    sport,
                    flags: [
                        "BASEBALL_AUTHORITY_REQUIRES_BASEBALL_SPORT"
                    ],
                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            if (
                !athlete.athlete_id ||
                !athlete.snapshot_id
            ) {
                const missingIdentity = [];

                if (!athlete.athlete_id) {
                    missingIdentity.push(
                        "athlete_id"
                    );
                }

                if (!athlete.snapshot_id) {
                    missingIdentity.push(
                        "snapshot_id"
                    );
                }

                const result = {
                    ok: false,
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
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
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
                resolveBaseballPositionModel(
                    athlete,
                    options
                );

            if (
                !positionModel ||
                positionModel.ok !== true
            ) {
                const result = {
                    ok: false,
                    authority:
                        ENGINE_ID,
                    authority_key:
                        AUTHORITY_KEY,
                    authority_version:
                        VERSION,
                    contract_version:
                        CONTRACT_VERSION,
                    status:
                        positionModel?.status ||
                        STATUS.POSITION_AUTHORITY_UNAVAILABLE,
                    official:
                        false,
                    athlete_id:
                        athlete.athlete_id,
                    snapshot_id:
                        athlete.snapshot_id,
                    sport,
                    flags: [
                        positionModel?.status ||
                        STATUS.POSITION_AUTHORITY_UNAVAILABLE
                    ],
                    source_position_result:
                        positionModel?.source_result ||
                        null,
                    generated_at:
                        nowISO()
                };

                lastResult = result;
                return result;
            }

            const traits = {};

            positionModel.trait_keys
                .forEach(function (traitName) {
                    traits[traitName] =
                        buildTraitIntelligence(
                            traitName,
                            athlete,
                            options
                        );
                });

            const status =
                determineOverallStatus(
                    traits
                );

            const flags =
                collectFlags(
                    traits
                );

            if (
                positionModel.archetype
                    .source !== "EXPLICIT"
            ) {
                flags.push(
                    "ARCHETYPE_CLASSIFICATION_NOT_EXPLICIT"
                );
            }

            if (
                options
                    .include_projected_benchmarks === true
            ) {
                flags.push(
                    "PROJECTED_BENCHMARK_MODE_ENABLED"
                );
            }

            const result = {
                ok: true,

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
                    athlete.athlete_id,

                snapshot_id:
                    athlete.snapshot_id,

                sport:
                    SPORT,

                position: {
                    code:
                        positionModel.position.code,

                    label:
                        positionModel.position.label,

                    source_value:
                        positionModel.position.source_value
                },

                archetype: {
                    code:
                        positionModel.archetype.code,

                    label:
                        positionModel.archetype.label,

                    source:
                        positionModel.archetype.source,

                    confidence:
                        positionModel.archetype.confidence ??
                        null,

                    confidence_status:
                        positionModel.archetype
                            .confidence_status ||
                        "CONFIDENCE_AUTHORITY_REQUIRED"
                },

                sport_trait_matrix: {
                    matrix_code:
                        positionModel.matrix.matrix_code,

                    matrix_version:
                        positionModel.matrix.matrix_version,

                    source_authority:
                        "BASEBALL_POSITION_MATRIX_AUTHORITY",

                    role:
                        "BASEBALL_TRAIT_INTERPRETATION"
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
                        new Set(flags)
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
                ok: false,

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
                    athlete?.athlete_id || null,

                snapshot_id:
                    athlete?.snapshot_id || null,

                sport:
                    SPORT,

                flags: [
                    "BASEBALL_INTELLIGENCE_EXECUTION_ERROR"
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
    COMPATIBILITY ALIAS
    ----------------------------------------------------------------------------
    Legacy callers may still invoke scoreAthlete().

    The method now returns SUPPORTING BASEBALL INTELLIGENCE ONLY.

    It intentionally does NOT provide:
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
            pitch_velocity: {
                value:
                    getPitchVelocity(
                        athlete
                    ),
                unit:
                    "MPH"
            },

            exit_velocity: {
                value:
                    getExitVelocity(
                        athlete
                    ),
                unit:
                    "MPH"
            },

            pop_time: {
                value:
                    getPopTime(
                        athlete
                    ),
                unit:
                    "SECONDS"
            },

            sixty_yard_dash: {
                value:
                    getSixtyYardDash(
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
                "STATScoreBaseballPositionMatrix"
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
                "pitch_velocity",
                "exit_velocity",
                "pop_time",
                "sixty_yard_dash",
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
                "Projected baseball benchmark intelligence is disabled by default, always non-official, and may enter official scoring only when a receiving governed Stream 9 authority explicitly authorizes projected evidence.",

            verification_rule:
                "Verification standing may affect confidence and provenance but never changes the underlying baseball measurement or trait performance value.",

            missing_evidence_rule:
                "Missing trait evidence remains null with INSUFFICIENT_EVIDENCE. No baseline performance value may be manufactured.",

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
                BASEBALL_BENCHMARKS,

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
                typeof positionAuthority.resolveMatrix ===
                    "function"
            );

        const positionAuthorityHealth =
            typeof positionAuthority?.runHealthCheck ===
                "function"
                ? positionAuthority.runHealthCheck()
                : null;

        const healthy =
            stream9.valid &&
            positionAuthorityAvailable &&
            (
                !positionAuthorityHealth ||
                positionAuthorityHealth.status ===
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

            baseball_position_authority_available:
                positionAuthorityAvailable,

            baseball_position_authority_health:
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

    const BaseballSportIntelligenceAuthority =
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
                "SUPPORTING_BASEBALL_SPORT_INTELLIGENCE_AUTHORITY",

            official_score_publisher:
                false,

            interpretAthlete,

            /*
            Compatibility alias only.
            This no longer returns an official baseball score.
            */
            scoreAthlete,

            getRawMeasurableModel,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScoreBaseballScoringEngine =
        BaseballSportIntelligenceAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.BaseballScoringEngine =
        BaseballSportIntelligenceAuthority;

    console.info(
        "[STATS-CORE] Baseball Sport Intelligence Authority loaded:",
        VERSION,
        "| explicit invocation required | baseline scoring removed | official scoring disabled"
    );

})(window); 
