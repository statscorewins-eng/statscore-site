/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-football-scoring-engine.js
*
* Canonical Classification:
*     SUPPORTING SPORT INTELLIGENCE AUTHORITY
*
* Production Role:
*     Football sport / position / archetype interpretation authority.
*
*     This authority interprets governed football evidence into structured
*     football trait intelligence for downstream Stream 9 authorities.
*
*     It DOES NOT publish:
*       - Official Athletic Score
*       - Official Production Score
*       - Official Position Score
*       - Official STATScore™
*       - Composite Intelligence
*       - Official star ratings
*
* Constitutional Chain:
*
*     Governed Football Evidence
*              ↓
*     Football Sport / Position Interpretation
*              ↓
*     Football Trait Intelligence
*              ↓
*     Registered Stream 9 Domain Matrices
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*
* Governing Doctrine:
*     Evidence ≠ Intelligence
*     Score ≠ Confidence
*     Verification ≠ Confidence
*     Confidence ≠ Certification
*     PROJECTED ≠ OFFICIAL
*     Missing ≠ Zero
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
*
* Runtime:
*     Loading this file DOES NOT score an athlete.
*     Execution occurs only through explicit invocation.
*
* Presentation:
*     This file DOES NOT render DOM/UI.
*
* Version:
*     STATSCORE-FOOTBALL-INTELLIGENCE-V2
*
* Status:
*     PRODUCTION RECONSTRUCTION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID = "statscore-football-scoring-engine";
    const VERSION = "STATSCORE-FOOTBALL-INTELLIGENCE-V2";
    const CONTRACT_VERSION = "STATSCORE-FOOTBALL-INTELLIGENCE-CONTRACT-V1";
    const BENCHMARK_VERSION = "STATSCORE-FOOTBALL-BENCHMARK-SCIENCE-V1";

    const STREAM_OWNER = "STATSCORE_STREAM_9";
    const SPORT = "FOOTBALL";

    const STATUS = Object.freeze({
        AVAILABLE: "AVAILABLE",
        PARTIAL: "PARTIAL",
        INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
        PROJECTED: "PROJECTED",
        MATRIX_UNAVAILABLE: "MATRIX_UNAVAILABLE",
        AUTHORITY_UNAVAILABLE: "AUTHORITY_UNAVAILABLE",
        AUTHORITY_UNAUTHORIZED: "AUTHORITY_UNAUTHORIZED",
        INVALID_INPUT: "INVALID_INPUT",
        UNSUPPORTED_SPORT: "UNSUPPORTED_SPORT",
        UNSUPPORTED_POSITION: "UNSUPPORTED_POSITION",
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
    FOOTBALL POSITION / ARCHETYPE SCIENCE
    ----------------------------------------------------------------------------
    These definitions establish football-specific trait vocabulary and
    archetype interpretation only.

    They DO NOT establish official Stream 9 domain weights.
    They DO NOT establish official STATScore™ weights.
    ============================================================================
    */

    const FOOTBALL_PROFILES = Object.freeze({

        QB: Object.freeze({
            default_archetype: "PRO_STYLE_QB",

            archetypes: Object.freeze({

                PRO_STYLE_QB: Object.freeze({
                    label: "Pro-Style Quarterback",
                    matrix_code: "FB_QB_PRO_STYLE_TRAITS_V2",
                    traits: Object.freeze([
                        "PROCESSING",
                        "DECISION_SPEED",
                        "ARM_TALENT",
                        "BALL_PLACEMENT",
                        "POCKET_PRESENCE",
                        "FIELD_VISION",
                        "PRESSURE_RESPONSE",
                        "LEADERSHIP",
                        "TIMING",
                        "SHORT_INTERMEDIATE_ACCURACY",
                        "POCKET_DISCIPLINE",
                        "PROGRESSION_CONTROL",
                        "PRE_SNAP_RECOGNITION"
                    ])
                }),

                DUAL_THREAT_QB: Object.freeze({
                    label: "Dual-Threat Quarterback",
                    matrix_code: "FB_QB_DUAL_THREAT_TRAITS_V2",
                    traits: Object.freeze([
                        "PROCESSING",
                        "DECISION_SPEED",
                        "BALL_PLACEMENT",
                        "ARM_TALENT",
                        "FIELD_VISION",
                        "POCKET_PRESENCE",
                        "ESCAPE_ABILITY",
                        "DESIGNED_RUN_VALUE",
                        "OPEN_FIELD_THREAT",
                        "SCRAMBLE_TO_THROW_ABILITY",
                        "BALL_SECURITY",
                        "PRESSURE_RESPONSE"
                    ])
                }),

                POCKET_DISTRIBUTOR_QB: Object.freeze({
                    label: "Pocket Distributor Quarterback",
                    matrix_code: "FB_QB_POCKET_DISTRIBUTOR_TRAITS_V2",
                    traits: Object.freeze([
                        "PROCESSING",
                        "TIMING",
                        "BALL_PLACEMENT",
                        "SHORT_INTERMEDIATE_ACCURACY",
                        "POCKET_DISCIPLINE",
                        "PROGRESSION_CONTROL",
                        "PRE_SNAP_RECOGNITION",
                        "LEADERSHIP"
                    ])
                }),

                DEVELOPMENTAL_ATHLETE_QB: Object.freeze({
                    label: "Developmental Athlete Quarterback",
                    matrix_code: "FB_QB_DEVELOPMENTAL_ATHLETE_TRAITS_V2",
                    traits: Object.freeze([
                        "RAW_ATHLETICISM",
                        "ARM_STRENGTH",
                        "IMPROVISATION",
                        "PROCESSING_GROWTH",
                        "MECHANICS_DEVELOPMENT",
                        "COACHABILITY",
                        "OPEN_FIELD_THREAT",
                        "PROJECTION_UPSIDE"
                    ])
                })

            })
        }),

        WR: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Wide Receiver",
                    matrix_code: "FB_WR_TRAITS_V2",
                    traits: Object.freeze([
                        "RELEASE_PACKAGE",
                        "SEPARATION",
                        "HANDS",
                        "BALL_TRACKING",
                        "BODY_CONTROL",
                        "CONTESTED_CATCH",
                        "ROUTE_IQ",
                        "BOUNDARY_AWARENESS",
                        "SHORT_AREA_QUICKNESS",
                        "YAC",
                        "TOP_END_SPEED",
                        "ACCELERATION"
                    ])
                })
            })
        }),

        RB: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Running Back",
                    matrix_code: "FB_RB_TRAITS_V2",
                    traits: Object.freeze([
                        "VISION",
                        "BURST",
                        "CONTACT_BALANCE",
                        "RECEIVING_ABILITY",
                        "BALL_SECURITY",
                        "OPEN_FIELD_ABILITY",
                        "PASS_PROTECTION",
                        "EXPLOSIVE_VALUE",
                        "PAD_LEVEL",
                        "LEG_DRIVE"
                    ])
                })
            })
        }),

        DB: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Defensive Back",
                    matrix_code: "FB_DB_TRAITS_V2",
                    traits: Object.freeze([
                        "HIP_FLUIDITY",
                        "MIRROR_ABILITY",
                        "PRESS_COVERAGE",
                        "RECOVERY_SPEED",
                        "BALL_SKILLS",
                        "ROUTE_RECOGNITION",
                        "CLOSING_BURST",
                        "COMPETITIVE_TOUGHNESS",
                        "ZONE_IQ",
                        "TACKLING"
                    ])
                })
            })
        }),

        LB: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Linebacker",
                    matrix_code: "FB_LB_TRAITS_V2",
                    traits: Object.freeze([
                        "RUN_FIT_IQ",
                        "COMMUNICATION",
                        "TACKLING",
                        "BLOCK_SHEDDING",
                        "PLAY_RECOGNITION",
                        "LEADERSHIP",
                        "INSIDE_RANGE",
                        "GAP_DISCIPLINE",
                        "COVERAGE_ABILITY",
                        "CLOSING_SPEED"
                    ])
                })
            })
        }),

        OL: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Offensive Lineman",
                    matrix_code: "FB_OL_TRAITS_V2",
                    traits: Object.freeze([
                        "PASS_SET",
                        "FOOTWORK",
                        "ANCHOR",
                        "HAND_PLACEMENT",
                        "RECOVERY",
                        "BALANCE",
                        "LENGTH_USAGE",
                        "PROCESSING",
                        "DRIVE_POWER",
                        "LEVERAGE"
                    ])
                })
            })
        }),

        DL: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Defensive Lineman",
                    matrix_code: "FB_DL_TRAITS_V2",
                    traits: Object.freeze([
                        "FIRST_STEP",
                        "BEND",
                        "HAND_VIOLENCE",
                        "CLOSING_SPEED",
                        "RUSH_PLAN",
                        "EDGE_PRESSURE",
                        "MOTOR",
                        "DISRUPTION_RATE",
                        "GET_OFF",
                        "POWER"
                    ])
                })
            })
        }),

        ATH: Object.freeze({
            default_archetype: "DEFAULT",

            archetypes: Object.freeze({
                DEFAULT: Object.freeze({
                    label: "Football Athlete",
                    matrix_code: "FB_ATH_TRAITS_V2",
                    traits: Object.freeze([
                        "ATHLETICISM",
                        "SPEED",
                        "EXPLOSIVENESS",
                        "MOVEMENT",
                        "VERSATILITY",
                        "COMPETITIVE_TRAITS"
                    ])
                })
            })
        })

    });

    /*
    ============================================================================
    PROJECTED BENCHMARK SCIENCE
    ----------------------------------------------------------------------------
    These benchmarks are supporting football science only.

    Any numeric output from these helpers is:
        PROJECTED
        OFFICIAL: false

    No downstream authority may silently convert these projected benchmark
    signals into official intelligence unless its own governed contract
    explicitly authorizes projected evidence.
    ============================================================================
    */

    const DASH_40_BENCHMARKS = Object.freeze({
        QB: Object.freeze({ slow: 5.05, elite: 4.45 }),
        WR: Object.freeze({ slow: 4.85, elite: 4.35 }),
        RB: Object.freeze({ slow: 4.85, elite: 4.35 }),
        DB: Object.freeze({ slow: 4.85, elite: 4.35 }),
        LB: Object.freeze({ slow: 5.05, elite: 4.50 }),
        OL: Object.freeze({ slow: 5.65, elite: 4.95 }),
        DL: Object.freeze({ slow: 5.45, elite: 4.70 }),
        ATH: Object.freeze({ slow: 5.10, elite: 4.40 })
    });

    const FRAME_BENCHMARKS = Object.freeze({
        QB: Object.freeze({ height: Object.freeze([72, 78]), weight: Object.freeze([180, 230]) }),
        WR: Object.freeze({ height: Object.freeze([68, 76]), weight: Object.freeze([160, 215]) }),
        RB: Object.freeze({ height: Object.freeze([66, 73]), weight: Object.freeze([170, 225]) }),
        DB: Object.freeze({ height: Object.freeze([68, 75]), weight: Object.freeze([160, 210]) }),
        LB: Object.freeze({ height: Object.freeze([70, 76]), weight: Object.freeze([195, 245]) }),
        OL: Object.freeze({ height: Object.freeze([73, 80]), weight: Object.freeze([250, 330]) }),
        DL: Object.freeze({ height: Object.freeze([72, 79]), weight: Object.freeze([225, 315]) }),
        ATH: Object.freeze({ height: Object.freeze([68, 78]), weight: Object.freeze([160, 245]) })
    });

    const KEYWORD_EVIDENCE_MAP = Object.freeze({

        PROCESSING: Object.freeze([
            "processing",
            "reads",
            "progression",
            "decision",
            "football iq"
        ]),

        DECISION_SPEED: Object.freeze([
            "quick decision",
            "fast read",
            "decisive",
            "anticipation"
        ]),

        ARM_TALENT: Object.freeze([
            "arm talent",
            "arm strength",
            "velocity",
            "deep ball",
            "drive throws"
        ]),

        ARM_STRENGTH: Object.freeze([
            "arm strength",
            "velocity",
            "deep ball",
            "drive throws"
        ]),

        BALL_PLACEMENT: Object.freeze([
            "accuracy",
            "placement",
            "touch",
            "catchable"
        ]),

        SHORT_INTERMEDIATE_ACCURACY: Object.freeze([
            "accuracy",
            "placement",
            "short",
            "intermediate"
        ]),

        FIELD_VISION: Object.freeze([
            "vision",
            "reads field",
            "sees field",
            "anticipation"
        ]),

        POCKET_PRESENCE: Object.freeze([
            "pocket",
            "climb",
            "pressure",
            "composure"
        ]),

        POCKET_DISCIPLINE: Object.freeze([
            "pocket discipline",
            "climb",
            "structure",
            "timing"
        ]),

        PRESSURE_RESPONSE: Object.freeze([
            "pressure",
            "escape",
            "composure",
            "blitz"
        ]),

        LEADERSHIP: Object.freeze([
            "leader",
            "captain",
            "command",
            "communication"
        ]),

        ESCAPE_ABILITY: Object.freeze([
            "escape",
            "mobile",
            "scramble",
            "extend"
        ]),

        DESIGNED_RUN_VALUE: Object.freeze([
            "designed run",
            "read option",
            "rpo",
            "run threat"
        ]),

        OPEN_FIELD_THREAT: Object.freeze([
            "open field",
            "explosive",
            "breakaway",
            "elusive"
        ]),

        SCRAMBLE_TO_THROW_ABILITY: Object.freeze([
            "scramble to throw",
            "off platform",
            "extend play"
        ]),

        BALL_SECURITY: Object.freeze([
            "ball security",
            "protects ball",
            "low turnover"
        ]),

        TIMING: Object.freeze([
            "timing",
            "rhythm",
            "anticipation"
        ]),

        PROGRESSION_CONTROL: Object.freeze([
            "progression",
            "reads",
            "control"
        ]),

        PRE_SNAP_RECOGNITION: Object.freeze([
            "pre snap",
            "recognition",
            "coverage"
        ]),

        SEPARATION: Object.freeze([
            "separation",
            "route",
            "release"
        ]),

        HANDS: Object.freeze([
            "hands",
            "catch",
            "reliable"
        ]),

        ROUTE_IQ: Object.freeze([
            "route iq",
            "route discipline",
            "route"
        ]),

        CONTACT_BALANCE: Object.freeze([
            "contact balance",
            "balance",
            "yards after contact"
        ]),

        VISION: Object.freeze([
            "vision",
            "patience",
            "lane"
        ]),

        BURST: Object.freeze([
            "burst",
            "explosive",
            "acceleration"
        ]),

        TOP_END_SPEED: Object.freeze([
            "top speed",
            "speed",
            "vertical threat"
        ]),

        ACCELERATION: Object.freeze([
            "acceleration",
            "burst",
            "explosive"
        ]),

        RECOVERY_SPEED: Object.freeze([
            "recovery speed",
            "closing speed",
            "makeup speed"
        ]),

        CLOSING_SPEED: Object.freeze([
            "closing speed",
            "burst",
            "pursuit"
        ]),

        FIRST_STEP: Object.freeze([
            "first step",
            "get off",
            "explosion"
        ]),

        GET_OFF: Object.freeze([
            "get off",
            "first step",
            "snap anticipation"
        ]),

        POWER: Object.freeze([
            "power",
            "strength",
            "drive"
        ]),

        DRIVE_POWER: Object.freeze([
            "drive power",
            "movement",
            "strength"
        ]),

        ANCHOR: Object.freeze([
            "anchor",
            "base strength",
            "balance"
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

    function normalizeUpper(value) {
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

        const valueNumber = Number(normalized);

        return Number.isFinite(valueNumber)
            ? valueNumber
            : null;
    }

    function clamp(value, min, max) {
        const numeric = Number(value);

        if (!Number.isFinite(numeric)) {
            return null;
        }

        return Math.max(
            min,
            Math.min(max, numeric)
        );
    }

    function normalizeScore(value) {
        const numeric = numberOrNull(value);

        if (numeric === null) {
            return null;
        }

        return Number(
            clamp(numeric, 0, 100).toFixed(2)
        );
    }

    function parseHeightToInches(value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        const raw = String(value).trim();

        const match = raw.match(
            /^(\d+)\s*['’]\s*(\d{1,2})?\s*(?:"|”)?$/
        );

        if (match) {
            const feet = Number(match[1]);
            const inches = Number(match[2] || 0);

            if (
                Number.isFinite(feet) &&
                Number.isFinite(inches)
            ) {
                return feet * 12 + inches;
            }
        }

        return numberOrNull(raw);
    }

    function normalizeSport(value) {
        const sport = normalizeUpper(value);

        const aliases = Object.freeze({
            FOOTBALL: "FOOTBALL",
            FB: "FOOTBALL"
        });

        return aliases[sport] || sport || "UNKNOWN";
    }

    function normalizePosition(value) {
        const position = normalizeUpper(value);

        const aliases = Object.freeze({
            QUARTERBACK: "QB",
            QB: "QB",

            WIDE_RECEIVER: "WR",
            RECEIVER: "WR",
            WR: "WR",

            RUNNING_BACK: "RB",
            HALF_BACK: "RB",
            TAILBACK: "RB",
            RB: "RB",

            DEFENSIVE_BACK: "DB",
            CORNERBACK: "DB",
            CORNER: "DB",
            CB: "DB",
            SAFETY: "DB",
            FS: "DB",
            SS: "DB",
            DB: "DB",

            LINEBACKER: "LB",
            LB: "LB",

            OFFENSIVE_LINE: "OL",
            OFFENSIVE_LINEMAN: "OL",
            TACKLE: "OL",
            GUARD: "OL",
            CENTER: "OL",
            OL: "OL",

            DEFENSIVE_LINE: "DL",
            DEFENSIVE_LINEMAN: "DL",
            DEFENSIVE_END: "DL",
            DEFENSIVE_TACKLE: "DL",
            EDGE: "DL",
            DE: "DL",
            DT: "DL",
            DL: "DL",

            ATHLETE: "ATH",
            ATH: "ATH"
        });

        return aliases[position] || position || "ATH";
    }

    function normalizeVerificationStatus(value) {
        const status = normalizeUpper(value);

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

    function validateScoringScienceDoctrine() {
        const doctrine = global.STATScoreScoringScienceDoctrine;

        if (!doctrine) {
            return {
                valid: false,
                status: "SCORING_SCIENCE_DOCTRINE_UNAVAILABLE"
            };
        }

        const valid =
            doctrine.doctrine_key ===
                "STATSCORE_SCORING_SCIENCE_DOCTRINE" &&
            (
                doctrine.status === "CANON_LOCKED" ||
                doctrine.doctrine_status === "CANON_LOCKED"
            );

        return {
            valid,
            status:
                valid
                    ? "SCORING_SCIENCE_DOCTRINE_VALID"
                    : "SCORING_SCIENCE_DOCTRINE_INVALID"
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

    function getInputPosition(athlete) {
        return normalizePosition(
            athlete?.primary_position ||
            athlete?.position ||
            athlete?.verified_position ||
            athlete?.raw_payload?.primaryPosition ||
            athlete?.raw_payload?.primary_position ||
            athlete?.raw_payload?.position
        );
    }

    function getRequestedArchetype(athlete) {
        return normalizeUpper(
            athlete?.archetype ||
            athlete?.position_archetype ||
            athlete?.player_archetype ||
            athlete?.raw_payload?.archetype
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

    function inferQBArchetype(athlete) {
        const requested = getRequestedArchetype(athlete);

        if (
            requested &&
            FOOTBALL_PROFILES.QB.archetypes[requested]
        ) {
            return {
                code: requested,
                source: "EXPLICIT"
            };
        }

        const text = buildSearchableText(athlete);

        if (
            text.includes("dual threat") ||
            text.includes("dual-threat") ||
            text.includes("run threat") ||
            text.includes("mobile quarterback") ||
            text.includes("scramble")
        ) {
            return {
                code: "DUAL_THREAT_QB",
                source: "TEXT_INFERRED"
            };
        }

        if (
            text.includes("pocket distributor") ||
            text.includes("timing passer") ||
            text.includes("rhythm passer")
        ) {
            return {
                code: "POCKET_DISTRIBUTOR_QB",
                source: "TEXT_INFERRED"
            };
        }

        if (
            text.includes("developmental quarterback") ||
            text.includes("raw athlete") ||
            text.includes("developmental athlete")
        ) {
            return {
                code: "DEVELOPMENTAL_ATHLETE_QB",
                source: "TEXT_INFERRED"
            };
        }

        return {
            code: "PRO_STYLE_QB",
            source: "DEFAULT_ARCHETYPE_CLASSIFICATION"
        };
    }

    function resolveProfile(athlete) {
        const position = getInputPosition(athlete);
        const positionProfile = FOOTBALL_PROFILES[position];

        if (!positionProfile) {
            return null;
        }

        let archetypeCode = positionProfile.default_archetype;
        let archetypeSource = "DEFAULT_ARCHETYPE_CLASSIFICATION";

        if (position === "QB") {
            const qbArchetype = inferQBArchetype(athlete);

            archetypeCode = qbArchetype.code;
            archetypeSource = qbArchetype.source;
        } else {
            const requested = getRequestedArchetype(athlete);

            if (
                requested &&
                positionProfile.archetypes[requested]
            ) {
                archetypeCode = requested;
                archetypeSource = "EXPLICIT";
            }
        }

        const archetype =
            positionProfile.archetypes[archetypeCode] ||
            positionProfile.archetypes[positionProfile.default_archetype];

        if (!archetype) {
            return null;
        }

        return {
            sport: SPORT,
            position,
            archetype: archetype.label,
            archetype_code: archetypeCode,
            archetype_source: archetypeSource,
            matrix_code: archetype.matrix_code,
            traits: Array.from(archetype.traits)
        };
    }

    function collectGlobalEvidence(athlete) {
        const evidence = [];

        if (athlete?.highlight_url) {
            evidence.push({
                evidence_type: "HIGHLIGHT_FILM",
                value: athlete.highlight_url,
                source: "ATHLETE_SNAPSHOT"
            });
        }

        if (athlete?.game_film_url) {
            evidence.push({
                evidence_type: "GAME_FILM",
                value: athlete.game_film_url,
                source: "ATHLETE_SNAPSHOT"
            });
        }

        if (athlete?.recruiting_profile_url) {
            evidence.push({
                evidence_type: "RECRUITING_PROFILE",
                value: athlete.recruiting_profile_url,
                source: "ATHLETE_SNAPSHOT"
            });
        }

        if (athlete?.verified_event_source) {
            evidence.push({
                evidence_type: "EVENT_SOURCE",
                value: athlete.verified_event_source,
                source: "ATHLETE_SNAPSHOT"
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
                source_name: "raw_payload.football_trait_scores",
                source: athlete?.raw_payload?.football_trait_scores
            },

            {
                source_name: "raw_payload.position_trait_scores",
                source: athlete?.raw_payload?.position_trait_scores
            }
        ];
    }

    function findDirectTraitEvidence(traitName, athlete) {
        const traitKey = normalizeUpper(traitName);

        const sources = getTraitSourceObjects(athlete);

        for (const entry of sources) {
            const source = entry.source;

            if (!source || typeof source !== "object") {
                continue;
            }

            const matchingKey = Object.keys(source).find(function (key) {
                return normalizeUpper(key) === traitKey;
            });

            if (!matchingKey) {
                continue;
            }

            const rawValue = source[matchingKey];

            if (
                rawValue &&
                typeof rawValue === "object" &&
                !Array.isArray(rawValue)
            ) {
                const value = normalizeScore(
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
                        normalizeUpper(rawValue.status) ||
                        TRAIT_STATUS.EVIDENCE_AVAILABLE,

                    official:
                        rawValue.official === true,

                    confidence:
                        normalizeScore(rawValue.confidence),

                    verification_status:
                        normalizeVerificationStatus(
                            rawValue.verification_status
                        ),

                    evidence: Array.isArray(rawValue.evidence)
                        ? rawValue.evidence
                        : [],

                    source: entry.source_name
                };
            }

            const value = normalizeScore(rawValue);

            if (value === null) {
                continue;
            }

            return {
                value,
                status: TRAIT_STATUS.EVIDENCE_AVAILABLE,
                official: false,
                confidence: null,
                verification_status: VERIFICATION_STATUS.UNKNOWN,
                evidence: [],
                source: entry.source_name
            };
        }

        return null;
    }

    function findTraitVerificationContext(
        traitName,
        athlete,
        options
    ) {
        const traitKey = normalizeUpper(traitName);

        const contexts = [
            options?.verification_by_trait,
            athlete?.verification_by_trait,
            athlete?.raw_payload?.verification_by_trait
        ];

        for (const context of contexts) {
            if (!context || typeof context !== "object") {
                continue;
            }

            const matchingKey = Object.keys(context).find(function (key) {
                return normalizeUpper(key) === traitKey;
            });

            if (!matchingKey) {
                continue;
            }

            const record = context[matchingKey];

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
                        normalizeScore(record.confidence),

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

            evidence_id: null,
            source_record_id: null,
            receipt_id: null,
            professional_id: null,
            certification_id: null
        };
    }

    function getDash40(athlete) {
        return (
            numberOrNull(athlete?.dash40) ??
            numberOrNull(athlete?.dash_40) ??
            numberOrNull(athlete?.forty) ??
            numberOrNull(athlete?.raw_payload?.dash40) ??
            numberOrNull(athlete?.raw_payload?.dash_40) ??
            numberOrNull(athlete?.raw_payload?.forty)
        );
    }

    function getHeight(athlete) {
        return parseHeightToInches(
            athlete?.height ??
            athlete?.raw_payload?.height
        );
    }

    function getWeight(athlete) {
        return (
            numberOrNull(athlete?.weight) ??
            numberOrNull(athlete?.raw_payload?.weight)
        );
    }

    function projectDash40Signal(position, dash40) {
        const benchmark =
            DASH_40_BENCHMARKS[position] ||
            DASH_40_BENCHMARKS.ATH;

        if (
            !benchmark ||
            dash40 === null
        ) {
            return null;
        }

        const denominator =
            benchmark.slow - benchmark.elite;

        if (!denominator) {
            return null;
        }

        const score =
            (
                (benchmark.slow - dash40) /
                denominator
            ) * 100;

        return Number(
            clamp(score, 0, 100).toFixed(2)
        );
    }

    function projectFrameSignal(position, height, weight) {
        const benchmark =
            FRAME_BENCHMARKS[position] ||
            FRAME_BENCHMARKS.ATH;

        if (!benchmark) {
            return null;
        }

        const componentSignals = [];

        if (height !== null) {
            const min = benchmark.height[0];
            const max = benchmark.height[1];

            let signal;

            if (
                height >= min &&
                height <= max
            ) {
                signal = 88;
            } else {
                const midpoint = (min + max) / 2;

                signal =
                    88 -
                    Math.abs(height - midpoint) * 7;
            }

            componentSignals.push(
                clamp(signal, 0, 100)
            );
        }

        if (weight !== null) {
            const min = benchmark.weight[0];
            const max = benchmark.weight[1];

            let signal;

            if (
                weight >= min &&
                weight <= max
            ) {
                signal = 88;
            } else {
                const midpoint = (min + max) / 2;

                signal =
                    88 -
                    Math.abs(weight - midpoint) * 0.9;
            }

            componentSignals.push(
                clamp(signal, 0, 100)
            );
        }

        if (!componentSignals.length) {
            return null;
        }

        const average =
            componentSignals.reduce(
                function (sum, value) {
                    return sum + value;
                },
                0
            ) /
            componentSignals.length;

        return Number(
            clamp(average, 0, 100).toFixed(2)
        );
    }

    function isSpeedTrait(traitName) {
        const trait = normalizeUpper(traitName);

        return [
            "SPEED",
            "BURST",
            "ACCELERATION",
            "OPEN_FIELD",
            "ESCAPE",
            "RECOVERY",
            "FIRST_STEP",
            "GET_OFF"
        ].some(function (token) {
            return trait.includes(token);
        });
    }

    function isFrameTrait(traitName) {
        const trait = normalizeUpper(traitName);

        return [
            "FRAME",
            "POWER",
            "ANCHOR",
            "PHYSICAL",
            "CONTACT",
            "STRENGTH",
            "DRIVE"
        ].some(function (token) {
            return trait.includes(token);
        });
    }

    function collectKeywordEvidence(
        traitName,
        athlete
    ) {
        const traitKey = normalizeUpper(traitName);
        const keywords =
            KEYWORD_EVIDENCE_MAP[traitKey] || [];

        if (!keywords.length) {
            return [];
        }

        const text = buildSearchableText(athlete);

        if (!text) {
            return [];
        }

        return keywords
            .filter(function (keyword) {
                return text.includes(
                    String(keyword).toLowerCase()
                );
            })
            .map(function (keyword) {
                return {
                    evidence_type: "TEXT_SIGNAL",
                    trait_key: traitKey,
                    matched_term: keyword,
                    source:
                        "POSITION_NOTES_OR_RAW_PAYLOAD"
                };
            });
    }

    function buildProjectedBenchmark(
        traitName,
        athlete,
        profile
    ) {
        const dash40 = getDash40(athlete);
        const height = getHeight(athlete);
        const weight = getWeight(athlete);

        if (
            isSpeedTrait(traitName) &&
            dash40 !== null
        ) {
            return {
                value:
                    projectDash40Signal(
                        profile.position,
                        dash40
                    ),

                benchmark_type:
                    "FORTY_YARD_DASH",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    {
                        evidence_type:
                            "MEASURABLE",

                        measurable:
                            "FORTY_YARD_DASH",

                        raw_value:
                            dash40,

                        source:
                            "ATHLETE_EVIDENCE"
                    }
                ]
            };
        }

        if (
            isFrameTrait(traitName) &&
            (
                height !== null ||
                weight !== null
            )
        ) {
            return {
                value:
                    projectFrameSignal(
                        profile.position,
                        height,
                        weight
                    ),

                benchmark_type:
                    "POSITION_FRAME",

                benchmark_version:
                    BENCHMARK_VERSION,

                evidence: [
                    height !== null
                        ? {
                            evidence_type:
                                "MEASURABLE",

                            measurable:
                                "HEIGHT_INCHES",

                            raw_value:
                                height,

                            source:
                                "ATHLETE_EVIDENCE"
                        }
                        : null,

                    weight !== null
                        ? {
                            evidence_type:
                                "MEASURABLE",

                            measurable:
                                "WEIGHT",

                            raw_value:
                                weight,

                            source:
                                "ATHLETE_EVIDENCE"
                        }
                        : null
                ].filter(Boolean)
            };
        }

        return null;
    }

    function buildTraitIntelligence(
        traitName,
        athlete,
        profile,
        options
    ) {
        const direct =
            findDirectTraitEvidence(
                traitName,
                athlete
            );

        const verification =
            findTraitVerificationContext(
                traitName,
                athlete,
                options
            );

        const keywordEvidence =
            collectKeywordEvidence(
                traitName,
                athlete
            );

        if (direct) {
            const combinedEvidence = [
                ...direct.evidence,
                ...keywordEvidence
            ];

            return {
                trait_key:
                    normalizeUpper(traitName),

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

                evidence_used:
                    combinedEvidence,

                missing_evidence:
                    [],

                flags:
                    direct.confidence === null &&
                    verification.confidence === null
                        ? ["CONFIDENCE_UNAVAILABLE"]
                        : [],

                scoring_source:
                    "DIRECT_GOVERNED_TRAIT_EVIDENCE",

                projection:
                    null
            };
        }

        if (
            options?.include_projected_benchmarks === true
        ) {
            const projection =
                buildProjectedBenchmark(
                    traitName,
                    athlete,
                    profile
                );

            if (
                projection &&
                projection.value !== null
            ) {
                return {
                    trait_key:
                        normalizeUpper(traitName),

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

                    missing_evidence: [],

                    flags: [
                        "PROJECTED_BENCHMARK_SIGNAL",
                        "PROJECTED_NOT_OFFICIAL",
                        verification.confidence === null
                            ? "CONFIDENCE_UNAVAILABLE"
                            : null
                    ].filter(Boolean),

                    scoring_source:
                        "PROJECTED_FOOTBALL_BENCHMARK",

                    projection: {
                        benchmark_type:
                            projection.benchmark_type,

                        benchmark_version:
                            projection.benchmark_version,

                        official:
                            false,

                        downstream_rule:
                            "Projected benchmark intelligence may not become official domain intelligence unless the receiving authority explicitly authorizes projected evidence."
                    }
                };
            }
        }

        return {
            trait_key:
                normalizeUpper(traitName),

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

            scoring_source:
                null,

            projection:
                null
        };
    }

    function determineOverallStatus(traits) {
        const values =
            Object.values(traits);

        const evidenceAvailable =
            values.filter(function (trait) {
                return (
                    trait.status ===
                    TRAIT_STATUS.EVIDENCE_AVAILABLE
                );
            }).length;

        const projected =
            values.filter(function (trait) {
                return (
                    trait.status ===
                    TRAIT_STATUS.PROJECTED
                );
            }).length;

        const insufficient =
            values.filter(function (trait) {
                return (
                    trait.status ===
                    TRAIT_STATUS.INSUFFICIENT_EVIDENCE
                );
            }).length;

        if (
            evidenceAvailable === 0 &&
            projected === 0
        ) {
            return STATUS.INSUFFICIENT_EVIDENCE;
        }

        if (
            insufficient === 0 &&
            projected === 0
        ) {
            return STATUS.AVAILABLE;
        }

        return STATUS.PARTIAL;
    }

    function buildExplanation(
        athlete,
        profile,
        traits,
        status
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
                        trait.value !== null &&
                        trait.status !==
                            TRAIT_STATUS.INSUFFICIENT_EVIDENCE
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

        return {
            summary:
                `${athleteName} was interpreted under ${profile.matrix_code} for ${profile.position} / ${profile.archetype}. This result is football trait intelligence only and is not an official Athletic Score, Production Score, Composite Score, or STATScore™.`,

            status,

            factors: [
                "Football-specific position and archetype science applied.",
                "Available trait evidence preserved without manufacturing missing trait performance.",
                "Verification standing is preserved separately from trait value.",
                "Projected benchmark intelligence, when requested, remains explicitly non-official."
            ],

            available_traits:
                availableTraits,

            missing_traits:
                missingTraits,

            projected_traits:
                projectedTraits,

            limitations: [
                "No arithmetic average of football traits is published as an official score.",
                "No verification status adds or subtracts football performance points.",
                "No projected trait may silently become official intelligence.",
                "Official Athletic Intelligence must be published by the registered Athletic Matrix.",
                "Official Production Intelligence must be published by the registered Production Matrix."
            ],

            downstream_authorities: {
                athletic:
                    "ATHLETIC_MATRIX",

                production:
                    "PRODUCTION_MATRIX",

                verification:
                    "VERIFICATION_MATRIX",

                score_publisher:
                    "SCORE_AUTHORITY",

                composite:
                    "COMPOSITE_AUTHORITY"
            }
        };
    }

    function collectResultEvidence(traits) {
        const evidence = [];

        Object.values(traits)
            .forEach(function (trait) {
                trait.evidence_used
                    .forEach(function (item) {
                        evidence.push({
                            trait_key:
                                trait.trait_key,
                            ...item
                        });
                    });
            });

        return evidence;
    }

    function collectMissingEvidence(traits) {
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

    function collectFlags(traits) {
        const flags = [];

        Object.values(traits)
            .forEach(function (trait) {
                trait.flags.forEach(function (flag) {
                    if (!flags.includes(flag)) {
                        flags.push(flag);
                    }
                });
            });

        return flags;
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
                    authority: ENGINE_ID,
                    authority_version: VERSION,
                    contract_version: CONTRACT_VERSION,
                    status: STATUS.INVALID_INPUT,
                    official: false,
                    athlete_id: null,
                    snapshot_id: null,
                    sport: SPORT,
                    generated_at: nowISO(),
                    flags: ["ATHLETE_INPUT_REQUIRED"]
                };

                lastResult = result;
                return result;
            }

            const authorityValidation =
                validateStream9Authority();

            if (!authorityValidation.valid) {
                const result = {
                    ok: false,
                    authority: ENGINE_ID,
                    authority_version: VERSION,
                    contract_version: CONTRACT_VERSION,
                    status:
                        authorityValidation.status,
                    official: false,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    sport:
                        getInputSport(athlete),
                    generated_at:
                        nowISO(),
                    flags: [
                        authorityValidation.status
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
                    authority: ENGINE_ID,
                    authority_version: VERSION,
                    contract_version: CONTRACT_VERSION,
                    status: STATUS.UNSUPPORTED_SPORT,
                    official: false,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    sport,
                    generated_at:
                        nowISO(),
                    flags: [
                        "FOOTBALL_AUTHORITY_REQUIRES_FOOTBALL_SPORT"
                    ]
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
                    authority: ENGINE_ID,
                    authority_version: VERSION,
                    contract_version: CONTRACT_VERSION,
                    status: STATUS.INVALID_INPUT,
                    official: false,
                    athlete_id:
                        athlete.athlete_id || null,
                    snapshot_id:
                        athlete.snapshot_id || null,
                    sport,
                    generated_at:
                        nowISO(),
                    missing_evidence:
                        missingIdentity,
                    flags: [
                        "REQUIRED_IDENTITY_MISSING"
                    ]
                };

                lastResult = result;
                return result;
            }

            const profile =
                resolveProfile(athlete);

            if (!profile) {
                const result = {
                    ok: false,
                    authority: ENGINE_ID,
                    authority_version: VERSION,
                    contract_version: CONTRACT_VERSION,
                    status:
                        STATUS.UNSUPPORTED_POSITION,
                    official: false,
                    athlete_id:
                        athlete.athlete_id,
                    snapshot_id:
                        athlete.snapshot_id,
                    sport,
                    position:
                        getInputPosition(athlete),
                    generated_at:
                        nowISO(),
                    flags: [
                        "FOOTBALL_POSITION_PROFILE_UNAVAILABLE"
                    ]
                };

                lastResult = result;
                return result;
            }

            const traits = {};

            profile.traits.forEach(
                function (traitName) {
                    traits[traitName] =
                        buildTraitIntelligence(
                            traitName,
                            athlete,
                            profile,
                            options
                        );
                }
            );

            const status =
                determineOverallStatus(
                    traits
                );

            const evidenceUsed =
                collectResultEvidence(
                    traits
                );

            const missingEvidence =
                collectMissingEvidence(
                    traits
                );

            const flags =
                collectFlags(
                    traits
                );

            if (
                profile.archetype_source !==
                "EXPLICIT"
            ) {
                flags.push(
                    "ARCHETYPE_CLASSIFICATION_NOT_EXPLICIT"
                );
            }

            if (
                options.include_projected_benchmarks === true
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
                    "FOOTBALL_SPORT_INTELLIGENCE",

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

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

                position:
                    profile.position,

                archetype: {
                    code:
                        profile.archetype_code,

                    label:
                        profile.archetype,

                    source:
                        profile.archetype_source,

                    confidence:
                        null,

                    confidence_status:
                        "CONFIDENCE_AUTHORITY_REQUIRED"
                },

                sport_trait_matrix: {
                    matrix_code:
                        profile.matrix_code,

                    matrix_version:
                        VERSION,

                    role:
                        "FOOTBALL_TRAIT_INTERPRETATION_ONLY"
                },

                traits,

                evidence_used:
                    evidenceUsed,

                global_evidence:
                    collectGlobalEvidence(
                        athlete
                    ),

                missing_evidence:
                    missingEvidence,

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

                    position_score:
                        "NOT_PUBLISHED",

                    final_score:
                        "NOT_PUBLISHED",

                    statscore:
                        "NOT_PUBLISHED",

                    composite:
                        "NOT_PUBLISHED"
                },

                explanation:
                    buildExplanation(
                        athlete,
                        profile,
                        traits,
                        status
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
                    "FOOTBALL_INTELLIGENCE_EXECUTION_ERROR"
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

    function getTraitVocabulary(
        position,
        archetype
    ) {
        const normalizedPosition =
            normalizePosition(position);

        const positionProfile =
            FOOTBALL_PROFILES[
                normalizedPosition
            ];

        if (!positionProfile) {
            return null;
        }

        const requestedArchetype =
            normalizeUpper(archetype);

        const archetypeCode =
            requestedArchetype &&
            positionProfile.archetypes[
                requestedArchetype
            ]
                ? requestedArchetype
                : positionProfile.default_archetype;

        const selected =
            positionProfile.archetypes[
                archetypeCode
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
                archetypeCode,

            archetype:
                selected.label,

            matrix_code:
                selected.matrix_code,

            traits:
                Array.from(
                    selected.traits
                )
        };
    }

    function getContract() {
        return {
            authority_key:
                "FOOTBALL_SPORT_INTELLIGENCE",

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
                "SUPPORTING_SPORT_INTELLIGENCE",

            official_score_publisher:
                false,

            required_input:
                [
                    "athlete_id",
                    "snapshot_id",
                    "sport",
                    "position"
                ],

            optional_input:
                [
                    "archetype",
                    "trait_scores",
                    "measurables",
                    "film",
                    "event_evidence",
                    "verification_by_trait",
                    "confidence"
                ],

            output:
                [
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
                    "status",
                    "explanation",
                    "generated_at"
                ],

            prohibited_output:
                [
                    "official_athletic_score",
                    "official_production_score",
                    "official_position_score",
                    "official_final_score",
                    "official_statscore",
                    "official_composite"
                ],

            execution_rule:
                "Explicit invocation only. File load does not execute athlete interpretation.",

            presentation_rule:
                "Structured intelligence only. No DOM rendering.",

            projection_rule:
                "Projected benchmark intelligence is non-official and must remain isolated from official domain scoring unless explicitly authorized by the receiving authority."
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            benchmark_version:
                BENCHMARK_VERSION,

            stream_owner:
                STREAM_OWNER,

            sport:
                SPORT,

            positions:
                Object.keys(
                    FOOTBALL_PROFILES
                ),

            qb_archetypes:
                Object.keys(
                    FOOTBALL_PROFILES.QB
                        .archetypes
                ),

            dash_40_benchmarks:
                DASH_40_BENCHMARKS,

            frame_benchmarks:
                FRAME_BENCHMARKS,

            projected_benchmark_default:
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

        const scoringScience =
            validateScoringScienceDoctrine();

        const positionProfiles =
            Object.keys(
                FOOTBALL_PROFILES
            );

        const missingProfiles =
            positionProfiles.filter(
                function (position) {
                    const profile =
                        FOOTBALL_PROFILES[
                            position
                        ];

                    return (
                        !profile ||
                        !profile.default_archetype ||
                        !profile.archetypes ||
                        !profile.archetypes[
                            profile.default_archetype
                        ]
                    );
                }
            );

        return {
            authority:
                ENGINE_ID,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                authority.valid &&
                missingProfiles.length === 0
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_9_authority:
                authority,

            scoring_science_doctrine:
                scoringScience,

            position_profiles_valid:
                missingProfiles.length === 0,

            missing_position_profiles:
                missingProfiles,

            auto_execution:
                false,

            dom_rendering:
                false,

            official_score_publication:
                false,

            projected_benchmark_default:
                false,

            verification_changes_performance:
                false,

            trait_average_published_as_final_score:
                false,

            generated_at:
                nowISO()
        };
    }

    const FootballIntelligenceAuthority = Object.freeze({

        engine_id:
            ENGINE_ID,

        authority_key:
            "FOOTBALL_SPORT_INTELLIGENCE",

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
            "SUPPORTING_SPORT_INTELLIGENCE_AUTHORITY",

        official_score_publisher:
            false,

        profiles:
            FOOTBALL_PROFILES,

        interpretAthlete,

        /*
        ------------------------------------------------------------------------
        Compatibility Alias
        ------------------------------------------------------------------------
        Legacy consumers may still call scoreAthlete().
        The alias intentionally returns supporting football intelligence only.
        It DOES NOT restore legacy final_score behavior.
        ------------------------------------------------------------------------
        */
        scoreAthlete:
            interpretAthlete,

        getTraitVocabulary,

        getContract,

        getConfiguration,

        getLastResult,

        getLastError,

        runHealthCheck

    });

    global.STATScoreFootballScoringEngine =
        FootballIntelligenceAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.FootballScoringEngine =
        FootballIntelligenceAuthority;

    console.info(
        "[STATS-CORE] Football Sport Intelligence Authority loaded:",
        VERSION,
        "| explicit invocation required | official score publication disabled"
    );

})(window); 
