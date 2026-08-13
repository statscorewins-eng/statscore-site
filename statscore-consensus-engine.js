/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-consensus-engine.js
*
* Classification:
*     SUPPORTING CONSENSUS / AGREEMENT INTELLIGENCE AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-CONSENSUS-ENGINE-V2
*
* Contract Version:
*     STATSCORE-CONSENSUS-CONTRACT-V1
*
* Status:
*     RECONSTRUCTED — NON-SCORING CONSENSUS AUTHORITY
*
* Purpose:
*     Evaluate agreement, disagreement, volatility, source composition,
*     attribution completeness, and conflict among already-governed signals.
*
* Constitutional Chain:
*
*     Governed Source Signals
*              ↓
*     Professional Attribution / Provenance
*              ↓
*     Verification Standing
*              ↓
*     Consensus Engine
*              ↓
*     Agreement / Volatility / Conflict Intelligence
*              ↓
*     Confidence Authority / Review Logic / Downstream Intelligence
*
* This file DOES:
*     - measure agreement among governed signals;
*     - calculate a consensus center from supplied signal values;
*     - calculate variance and volatility;
*     - detect signal conflicts;
*     - summarize attribution completeness;
*     - summarize governed / unverified / conflicted source quality;
*     - identify whether manual review is required;
*     - expose explainability and diagnostics.
*
* This file DOES NOT:
*     - calculate Athletic Score;
*     - calculate Production Score;
*     - calculate Academic Score;
*     - calculate Verification Score;
*     - calculate Confidence Score;
*     - calculate Readiness Score;
*     - calculate Composite Score;
*     - assign athlete trajectory;
*     - manufacture professional authority from a role label;
*     - treat certification as athlete ability;
*     - hardcode evaluator / coach / trainer prestige weights;
*     - treat signal magnitude as confidence;
*     - certify evidence;
*     - replace Stream 10 certification;
*     - render DOM.
*
* Permanent Rules:
*
*     Signal Value ≠ Confidence
*     Consensus ≠ Verification
*     Consensus ≠ Certification
*     Consensus ≠ Athlete Score
*     Role Label ≠ Governed Authority
*     Agreement ≠ Performance Magnitude
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-consensus-engine";

    const VERSION =
        "STATSCORE-CONSENSUS-ENGINE-V2";

    const CONTRACT_VERSION =
        "STATSCORE-CONSENSUS-CONTRACT-V1";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const STATUS = Object.freeze({
        CONSENSUS_READY:
            "CONSENSUS_READY",

        INSUFFICIENT_SIGNALS:
            "INSUFFICIENT_SIGNALS",

        PARTIAL_ATTRIBUTION:
            "PARTIAL_ATTRIBUTION",

        SOURCE_CONFLICT:
            "SOURCE_CONFLICT",

        HIGH_VOLATILITY:
            "HIGH_VOLATILITY",

        AUTHORITY_CONTEXT_MISSING:
            "AUTHORITY_CONTEXT_MISSING",

        INVALID_SIGNAL:
            "INVALID_SIGNAL",

        REVIEW_REQUIRED:
            "REVIEW_REQUIRED",

        ERROR:
            "ERROR"
    });

    const VOLATILITY = Object.freeze({
        LOW:
            "LOW",

        MEDIUM:
            "MEDIUM",

        HIGH:
            "HIGH",

        UNKNOWN:
            "UNKNOWN"
    });

    const AGREEMENT_LEVELS = Object.freeze({
        HIGH:
            "HIGH",

        MODERATE:
            "MODERATE",

        LOW:
            "LOW",

        UNKNOWN:
            "UNKNOWN"
    });

    const SOURCE_QUALITY_STATES = Object.freeze({
        GOVERNED:
            "GOVERNED",

        UNVERIFIED:
            "UNVERIFIED",

        CONFLICTED:
            "CONFLICTED",

        ATTRIBUTION_INCOMPLETE:
            "ATTRIBUTION_INCOMPLETE",

        EXPIRED_AUTHORITY:
            "EXPIRED_AUTHORITY",

        REVOKED_AUTHORITY:
            "REVOKED_AUTHORITY",

        UNKNOWN:
            "UNKNOWN"
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
            .replace(/-/g, "_");
    }

    function lower(value) {
        return normalize(value)
            .toLowerCase();
    }

    function safeArray(value) {
        return Array.isArray(value)
            ? value
            : [];
    }

    function numberOrNull(value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        const n =
            Number(value);

        return Number.isFinite(n)
            ? n
            : null;
    }

    function clamp(
        value,
        min = 0,
        max = 100
    ) {
        const n =
            numberOrNull(
                value
            );

        if (
            n === null
        ) {
            return null;
        }

        return Math.max(
            min,
            Math.min(
                max,
                n
            )
        );
    }

    function validateStream9Authority() {
        return Boolean(
            global.STATScoreStream9Authority &&
            global.STATScoreStream9Authority.stream_number === 9 &&
            global.STATScoreStream9Authority.operational_state === "ACTIVE"
        );
    }

    function normalizeSignalValue(
        signal
    ) {
        if (
            !signal ||
            typeof signal !== "object"
        ) {
            return null;
        }

        const direct =
            numberOrNull(
                signal.signal_value ??
                signal.value ??
                signal.score ??
                signal.rating
            );

        if (
            direct !== null
        ) {
            return clamp(
                direct
            );
        }

        return null;
    }

    function hasIdentityAttribution(
        signal
    ) {
        return Boolean(
            signal?.signal_id &&
            (
                signal?.source_record_id ||
                signal?.evidence_id ||
                signal?.receipt_id
            )
        );
    }

    function hasProfessionalAttribution(
        signal
    ) {
        const role =
            upper(
                signal?.role ||
                signal?.source_role
            );

        const professionalRole =
            [
                "EVALUATOR",
                "HEAD_COACH",
                "POSITION_COACH",
                "COACH",
                "TRAINER",
                "COUNSELOR",
                "RECRUITER",
                "VERIFIER",
                "PROGRAM_ADMIN",
                "ADMIN"
            ].includes(
                role
            );

        if (
            !professionalRole
        ) {
            return true;
        }

        return Boolean(
            signal?.professional_id
        );
    }

    function hasCredentialContext(
        signal
    ) {
        const role =
            upper(
                signal?.role ||
                signal?.source_role
            );

        const professionalRole =
            [
                "EVALUATOR",
                "HEAD_COACH",
                "POSITION_COACH",
                "COACH",
                "TRAINER",
                "COUNSELOR",
                "RECRUITER",
                "VERIFIER",
                "PROGRAM_ADMIN",
                "ADMIN"
            ].includes(
                role
            );

        if (
            !professionalRole
        ) {
            return true;
        }

        return Boolean(
            signal?.certification_id ||
            signal?.credential_id ||
            signal?.professional_authority
        );
    }

    function resolveSourceQuality(
        signal
    ) {
        if (
            !signal ||
            typeof signal !==
                "object"
        ) {
            return SOURCE_QUALITY_STATES.UNKNOWN;
        }

        const certificationStatus =
            upper(
                signal.certification_status ||
                signal.credential_status ||
                ""
            );

        const verificationStatus =
            upper(
                signal.verification_status ||
                signal.evidence_verification_status ||
                ""
            );

        const conflictStatus =
            upper(
                signal.conflict_status ||
                ""
            );

        if (
            certificationStatus.includes(
                "REVOKED"
            )
        ) {
            return SOURCE_QUALITY_STATES.REVOKED_AUTHORITY;
        }

        if (
            certificationStatus.includes(
                "EXPIRED"
            ) ||
            certificationStatus.includes(
                "SUSPENDED"
            )
        ) {
            return SOURCE_QUALITY_STATES.EXPIRED_AUTHORITY;
        }

        if (
            conflictStatus.includes(
                "CONFLICT"
            ) ||
            verificationStatus.includes(
                "CONFLICT"
            )
        ) {
            return SOURCE_QUALITY_STATES.CONFLICTED;
        }

        if (
            !hasIdentityAttribution(
                signal
            ) ||
            !hasProfessionalAttribution(
                signal
            )
        ) {
            return SOURCE_QUALITY_STATES.ATTRIBUTION_INCOMPLETE;
        }

        if (
            verificationStatus === "VERIFIED" ||
            verificationStatus === "GOVERNED" ||
            verificationStatus === "CONFIRMED"
        ) {
            return SOURCE_QUALITY_STATES.GOVERNED;
        }

        if (
            verificationStatus === "UNVERIFIED" ||
            verificationStatus === "SELF_REPORTED" ||
            verificationStatus === "PENDING_VERIFICATION"
        ) {
            return SOURCE_QUALITY_STATES.UNVERIFIED;
        }

        return SOURCE_QUALITY_STATES.UNKNOWN;
    }

    function getGovernedAuthorityFactor(
        signal
    ) {
        /*
         * No role-derived weighting is permitted.
         *
         * A bounded authority factor may be consumed ONLY when it is already
         * supplied by a governed upstream authority.
         */

        const raw =
            numberOrNull(
                signal?.authority_factor ??
                signal?.governed_authority_factor
            );

        if (
            raw === null
        ) {
            return null;
        }

        return Math.max(
            0,
            Math.min(
                1,
                raw
            )
        );
    }

    function calculateConsensusCenter(
        validSignals
    ) {
        if (
            !validSignals.length
        ) {
            return {
                value:
                    null,

                weighted:
                    false,

                authority_factor_count:
                    0
            };
        }

        let weightedTotal =
            0;

        let weightedDenominator =
            0;

        let authorityFactorCount =
            0;

        validSignals.forEach(
            function (
                entry
            ) {
                const factor =
                    getGovernedAuthorityFactor(
                        entry.signal
                    );

                if (
                    factor !== null
                ) {
                    weightedTotal +=
                        entry.value *
                        factor;

                    weightedDenominator +=
                        factor;

                    authorityFactorCount +=
                        1;
                }
            }
        );

        if (
            weightedDenominator > 0
        ) {
            return {
                value:
                    Number(
                        (
                            weightedTotal /
                            weightedDenominator
                        ).toFixed(2)
                    ),

                weighted:
                    true,

                authority_factor_count:
                    authorityFactorCount
            };
        }

        const arithmetic =
            validSignals.reduce(
                function (
                    sum,
                    entry
                ) {
                    return (
                        sum +
                        entry.value
                    );
                },
                0
            ) /
            validSignals.length;

        return {
            value:
                Number(
                    arithmetic.toFixed(
                        2
                    )
                ),

            weighted:
                false,

            authority_factor_count:
                0
        };
    }

    function calculateVariance(
        validSignals,
        center
    ) {
        if (
            !validSignals.length ||
            center === null
        ) {
            return null;
        }

        const variance =
            validSignals.reduce(
                function (
                    total,
                    entry
                ) {
                    const delta =
                        entry.value -
                        center;

                    return (
                        total +
                        (
                            delta *
                            delta
                        )
                    );
                },
                0
            ) /
            validSignals.length;

        return Number(
            variance.toFixed(
                2
            )
        );
    }

    function classifyVolatility(
        variance
    ) {
        if (
            variance === null
        ) {
            return VOLATILITY.UNKNOWN;
        }

        if (
            variance <= 100
        ) {
            return VOLATILITY.LOW;
        }

        if (
            variance <= 400
        ) {
            return VOLATILITY.MEDIUM;
        }

        return VOLATILITY.HIGH;
    }

    function determineAgreement(
        validSignals
    ) {
        if (
            validSignals.length === 0
        ) {
            return {
                score:
                    null,

                level:
                    AGREEMENT_LEVELS.UNKNOWN,

                comparisons:
                    0,

                aligned:
                    0
            };
        }

        if (
            validSignals.length === 1
        ) {
            return {
                score:
                    null,

                level:
                    AGREEMENT_LEVELS.UNKNOWN,

                comparisons:
                    0,

                aligned:
                    0
            };
        }

        let aligned =
            0;

        let comparisons =
            0;

        for (
            let i = 0;
            i < validSignals.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < validSignals.length;
                j++
            ) {
                const difference =
                    Math.abs(
                        validSignals[
                            i
                        ].value -
                        validSignals[
                            j
                        ].value
                    );

                comparisons +=
                    1;

                if (
                    difference <= 15
                ) {
                    aligned +=
                        1;
                }
            }
        }

        const score =
            comparisons > 0
                ? aligned /
                    comparisons
                : null;

        let level =
            AGREEMENT_LEVELS.UNKNOWN;

        if (
            score !== null
        ) {
            if (
                score >= 0.80
            ) {
                level =
                    AGREEMENT_LEVELS.HIGH;
            } else if (
                score >= 0.50
            ) {
                level =
                    AGREEMENT_LEVELS.MODERATE;
            } else {
                level =
                    AGREEMENT_LEVELS.LOW;
            }
        }

        return {
            score:
                score === null
                    ? null
                    : Number(
                        score.toFixed(
                            2
                        )
                    ),

            level,

            comparisons,

            aligned
        };
    }

    function detectConflicts(
        validSignals
    ) {
        const conflicts =
            [];

        for (
            let i = 0;
            i < validSignals.length;
            i++
        ) {
            for (
                let j = i + 1;
                j < validSignals.length;
                j++
            ) {
                const a =
                    validSignals[
                        i
                    ];

                const b =
                    validSignals[
                        j
                    ];

                const difference =
                    Math.abs(
                        a.value -
                        b.value
                    );

                if (
                    difference >= 40
                ) {
                    conflicts.push({
                        signal_a_id:
                            a.signal
                                .signal_id ||
                            null,

                        signal_b_id:
                            b.signal
                                .signal_id ||
                            null,

                        signal_a_value:
                            a.value,

                        signal_b_value:
                            b.value,

                        difference:
                            Number(
                                difference.toFixed(
                                    2
                                )
                            ),

                        severity:
                            difference >= 70
                                ? "CRITICAL"
                                : "WARNING",

                        source_a: {
                            professional_id:
                                a.signal
                                    .professional_id ||
                                null,

                            role:
                                a.signal
                                    .role ||
                                a.signal
                                    .source_role ||
                                null,

                            verification_status:
                                a.signal
                                    .verification_status ||
                                null,

                            receipt_id:
                                a.signal
                                    .receipt_id ||
                                null
                        },

                        source_b: {
                            professional_id:
                                b.signal
                                    .professional_id ||
                                null,

                            role:
                                b.signal
                                    .role ||
                                b.signal
                                    .source_role ||
                                null,

                            verification_status:
                                b.signal
                                    .verification_status ||
                                null,

                            receipt_id:
                                b.signal
                                    .receipt_id ||
                                null
                        }
                    });
                }
            }
        }

        return conflicts;
    }

    function buildSourceQualitySummary(
        signals
    ) {
        const summary = {
            governed:
                0,

            unverified:
                0,

            conflicted:
                0,

            attribution_incomplete:
                0,

            expired_authority:
                0,

            revoked_authority:
                0,

            unknown:
                0
        };

        signals.forEach(
            function (
                signal
            ) {
                const quality =
                    resolveSourceQuality(
                        signal
                    );

                switch (
                    quality
                ) {
                    case SOURCE_QUALITY_STATES.GOVERNED:
                        summary.governed +=
                            1;
                        break;

                    case SOURCE_QUALITY_STATES.UNVERIFIED:
                        summary.unverified +=
                            1;
                        break;

                    case SOURCE_QUALITY_STATES.CONFLICTED:
                        summary.conflicted +=
                            1;
                        break;

                    case SOURCE_QUALITY_STATES.ATTRIBUTION_INCOMPLETE:
                        summary.attribution_incomplete +=
                            1;
                        break;

                    case SOURCE_QUALITY_STATES.EXPIRED_AUTHORITY:
                        summary.expired_authority +=
                            1;
                        break;

                    case SOURCE_QUALITY_STATES.REVOKED_AUTHORITY:
                        summary.revoked_authority +=
                            1;
                        break;

                    default:
                        summary.unknown +=
                            1;
                        break;
                }
            }
        );

        return summary;
    }

    function buildAuthorityDistribution(
        signals
    ) {
        const map =
            {};

        signals.forEach(
            function (
                signal
            ) {
                const role =
                    upper(
                        signal.role ||
                        signal.source_role ||
                        "UNKNOWN"
                    );

                if (
                    !map[
                        role
                    ]
                ) {
                    map[
                        role
                    ] = {
                        count:
                            0,

                        governed_authority_factor_count:
                            0
                    };
                }

                map[
                    role
                ].count +=
                    1;

                if (
                    getGovernedAuthorityFactor(
                        signal
                    ) !==
                    null
                ) {
                    map[
                        role
                    ].governed_authority_factor_count +=
                        1;
                }
            }
        );

        return map;
    }

    function buildAttributionSummary(
        signals
    ) {
        let attributed =
            0;

        let professionalContext =
            0;

        let credentialContext =
            0;

        signals.forEach(
            function (
                signal
            ) {
                if (
                    hasIdentityAttribution(
                        signal
                    )
                ) {
                    attributed +=
                        1;
                }

                if (
                    hasProfessionalAttribution(
                        signal
                    )
                ) {
                    professionalContext +=
                        1;
                }

                if (
                    hasCredentialContext(
                        signal
                    )
                ) {
                    credentialContext +=
                        1;
                }
            }
        );

        return {
            total_signals:
                signals.length,

            identity_attributed:
                attributed,

            professional_context_present:
                professionalContext,

            credential_context_present:
                credentialContext,

            complete:
                signals.length > 0 &&
                attributed ===
                    signals.length &&
                professionalContext ===
                    signals.length
        };
    }

    function buildConfidenceSupport(
        agreement,
        volatility,
        sourceQuality,
        conflicts
    ) {
        /*
         * This is intentionally qualitative.
         *
         * File 16 is NOT Confidence Authority.
         * It supplies support signals only.
         */

        let level =
            "UNKNOWN";

        const criticalConflict =
            conflicts.some(
                function (
                    conflict
                ) {
                    return (
                        conflict.severity ===
                        "CRITICAL"
                    );
                }
            );

        if (
            criticalConflict ||
            sourceQuality.revoked_authority >
                0
        ) {
            level =
                "BLOCKED";
        } else if (
            agreement.level ===
                AGREEMENT_LEVELS.HIGH &&
            volatility ===
                VOLATILITY.LOW &&
            sourceQuality.conflicted ===
                0
        ) {
            level =
                "HIGH_SUPPORT";
        } else if (
            agreement.level ===
                AGREEMENT_LEVELS.MODERATE &&
            volatility !==
                VOLATILITY.HIGH
        ) {
            level =
                "MODERATE_SUPPORT";
        } else if (
            agreement.level ===
                AGREEMENT_LEVELS.LOW ||
            volatility ===
                VOLATILITY.HIGH
        ) {
            level =
                "LOW_SUPPORT";
        }

        return {
            level,

            score:
                null,

            official_confidence:
                false,

            authority:
                "UPSTREAM_CONFIDENCE_AUTHORITY_REQUIRED",

            factors: {
                agreement:
                    agreement.level,

                volatility,

                governed_sources:
                    sourceQuality.governed,

                unverified_sources:
                    sourceQuality.unverified,

                conflicted_sources:
                    sourceQuality.conflicted,

                expired_authority_sources:
                    sourceQuality.expired_authority,

                revoked_authority_sources:
                    sourceQuality.revoked_authority,

                critical_conflict:
                    criticalConflict
            }
        };
    }

    function determineStatus(
        validSignals,
        attribution,
        volatility,
        conflicts,
        sourceQuality
    ) {
        if (
            validSignals.length === 0
        ) {
            return STATUS
                .INSUFFICIENT_SIGNALS;
        }

        if (
            conflicts.some(
                function (
                    item
                ) {
                    return (
                        item.severity ===
                        "CRITICAL"
                    );
                }
            )
        ) {
            return STATUS
                .REVIEW_REQUIRED;
        }

        if (
            sourceQuality.revoked_authority >
                0 ||
            sourceQuality.expired_authority >
                0
        ) {
            return STATUS
                .REVIEW_REQUIRED;
        }

        if (
            volatility ===
            VOLATILITY.HIGH
        ) {
            return STATUS
                .HIGH_VOLATILITY;
        }

        if (
            conflicts.length >
            0
        ) {
            return STATUS
                .SOURCE_CONFLICT;
        }

        if (
            !attribution.complete
        ) {
            return STATUS
                .PARTIAL_ATTRIBUTION;
        }

        return STATUS
            .CONSENSUS_READY;
    }

    function buildConsensus(
        signals = [],
        trait = "UNKNOWN"
    ) {
        lastError =
            null;

        try {
            if (
                !validateStream9Authority()
            ) {
                const result = {
                    ok:
                        false,

                    engine_id:
                        ENGINE_ID,

                    version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    stream_owner:
                        STREAM_OWNER,

                    trait:
                        upper(
                            trait
                        ),

                    consensus_value:
                        null,

                    status:
                        STATUS.AUTHORITY_CONTEXT_MISSING,

                    official_domain_score:
                        false,

                    flags: [
                        "STREAM_9_AUTHORITY_UNAVAILABLE"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            const normalizedSignals =
                safeArray(
                    signals
                );

            const validSignals =
                [];

            const invalidSignals =
                [];

            normalizedSignals.forEach(
                function (
                    signal
                ) {
                    const value =
                        normalizeSignalValue(
                            signal
                        );

                    if (
                        value ===
                        null
                    ) {
                        invalidSignals.push(
                            signal
                        );

                        return;
                    }

                    validSignals.push({
                        signal,

                        value
                    });
                }
            );

            const center =
                calculateConsensusCenter(
                    validSignals
                );

            const variance =
                calculateVariance(
                    validSignals,
                    center.value
                );

            const volatility =
                classifyVolatility(
                    variance
                );

            const agreement =
                determineAgreement(
                    validSignals
                );

            const conflicts =
                detectConflicts(
                    validSignals
                );

            const sourceQuality =
                buildSourceQualitySummary(
                    normalizedSignals
                );

            const attribution =
                buildAttributionSummary(
                    normalizedSignals
                );

            const authorityDistribution =
                buildAuthorityDistribution(
                    normalizedSignals
                );

            const confidenceSupport =
                buildConfidenceSupport(
                    agreement,
                    volatility,
                    sourceQuality,
                    conflicts
                );

            const status =
                determineStatus(
                    validSignals,
                    attribution,
                    volatility,
                    conflicts,
                    sourceQuality
                );

            const flags =
                [];

            if (
                invalidSignals.length >
                0
            ) {
                flags.push(
                    "INVALID_SIGNAL_PRESENT"
                );
            }

            if (
                !attribution.complete
            ) {
                flags.push(
                    "PARTIAL_ATTRIBUTION"
                );
            }

            if (
                volatility ===
                VOLATILITY.HIGH
            ) {
                flags.push(
                    "HIGH_VOLATILITY"
                );
            }

            if (
                conflicts.length >
                0
            ) {
                flags.push(
                    "SOURCE_CONFLICT"
                );
            }

            if (
                sourceQuality.revoked_authority >
                0
            ) {
                flags.push(
                    "REVOKED_AUTHORITY_SOURCE"
                );
            }

            if (
                sourceQuality.expired_authority >
                0
            ) {
                flags.push(
                    "EXPIRED_AUTHORITY_SOURCE"
                );
            }

            const result = {
                ok:
                    true,

                engine_id:
                    ENGINE_ID,

                version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                trait:
                    upper(
                        trait
                    ),

                signal_count:
                    normalizedSignals.length,

                valid_signal_count:
                    validSignals.length,

                invalid_signal_count:
                    invalidSignals.length,

                consensus_value:
                    center.value,

                consensus_method:
                    center.weighted
                        ? "GOVERNED_AUTHORITY_FACTOR_WEIGHTED"
                        : (
                            validSignals.length >
                            0
                                ? "UNWEIGHTED_SIGNAL_CENTER"
                                : "NO_VALUE"
                        ),

                authority_factor_count:
                    center
                        .authority_factor_count,

                agreement: {
                    score:
                        agreement.score,

                    level:
                        agreement.level,

                    comparisons:
                        agreement.comparisons,

                    aligned:
                        agreement.aligned
                },

                variance,

                volatility,

                source_quality:
                    sourceQuality,

                attribution,

                authority_distribution:
                    authorityDistribution,

                conflicts,

                confidence_support:
                    confidenceSupport,

                official_confidence:
                    false,

                official_domain_score:
                    false,

                projection:
                    null,

                review_required:
                    status ===
                        STATUS.REVIEW_REQUIRED ||
                    status ===
                        STATUS.HIGH_VOLATILITY ||
                    status ===
                        STATUS.SOURCE_CONFLICT,

                flags:
                    Array.from(
                        new Set(
                            flags
                        )
                    ),

                explanation: {
                    summary:
                        validSignals.length > 0
                            ? `Consensus center for ${upper(trait)} is ${center.value}. Agreement is ${agreement.level}; volatility is ${volatility}.`
                            : `Consensus for ${upper(trait)} could not be established because no valid signal values were supplied.`,

                    rule:
                        "Consensus measures alignment among governed signals. It is not an athlete domain score, Verification Authority, Certification Authority, or Confidence Authority.",

                    weighting:
                        center.weighted
                            ? "Only governed upstream authority factors explicitly supplied with signals were consumed."
                            : "No hardcoded role prestige weights were used.",

                    confidence:
                        "Confidence support is qualitative only. Official confidence must come from the governed Confidence Authority."
                },

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

                engine_id:
                    ENGINE_ID,

                version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                trait:
                    upper(
                        trait
                    ),

                consensus_value:
                    null,

                agreement:
                    {
                        score:
                            null,

                        level:
                            AGREEMENT_LEVELS.UNKNOWN
                    },

                variance:
                    null,

                volatility:
                    VOLATILITY.UNKNOWN,

                conflicts:
                    [],

                confidence_support: {
                    level:
                        "UNKNOWN",

                    score:
                        null,

                    official_confidence:
                        false,

                    authority:
                        "UPSTREAM_CONFIDENCE_AUTHORITY_REQUIRED"
                },

                official_confidence:
                    false,

                official_domain_score:
                    false,

                projection:
                    null,

                flags: [
                    "CONSENSUS_EXECUTION_ERROR"
                ],

                status:
                    STATUS.ERROR,

                error:
                    lastError.message,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }
    }

    function processTraitConsensus(
        trait,
        signals = []
    ) {
        return buildConsensus(
            signals,
            trait
        );
    }

    function explain(
        result
    ) {
        if (
            !result ||
            typeof result !==
                "object"
        ) {
            return {
                summary:
                    "No consensus result available.",

                rule:
                    "Consensus cannot be inferred without governed signal input."
            };
        }

        return {
            summary:
                result
                    .explanation
                    ?.summary ||
                "Consensus result available.",

            trait:
                result.trait ||
                null,

            consensus_value:
                result.consensus_value ??
                null,

            agreement:
                result.agreement ||
                null,

            volatility:
                result.volatility ||
                null,

            source_quality:
                result.source_quality ||
                null,

            conflicts:
                safeArray(
                    result.conflicts
                ),

            confidence_support:
                result.confidence_support ||
                null,

            review_required:
                Boolean(
                    result.review_required
                ),

            rule:
                "Consensus measures how governed sources align or disagree. It does not create athlete performance, Verification, Certification, or official Confidence."
        };
    }

    function getContract() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                "SUPPORTING_CONSENSUS_AGREEMENT_INTELLIGENCE_AUTHORITY",

            canonical_input_signal: {
                signal_id:
                    true,

                trait:
                    false,

                signal_value:
                    true,

                source_type:
                    false,

                professional_id:
                    false,

                certification_id:
                    false,

                role:
                    false,

                specialization:
                    false,

                certification_status:
                    false,

                authorized_scope:
                    false,

                authority_factor:
                    false,

                evidence_id:
                    false,

                source_record_id:
                    false,

                verification_status:
                    false,

                receipt_id:
                    false,

                occurred_at:
                    false
            },

            canonical_output: {
                trait:
                    true,

                consensus_value:
                    true,

                agreement:
                    true,

                variance:
                    true,

                volatility:
                    true,

                source_quality:
                    true,

                attribution:
                    true,

                conflicts:
                    true,

                confidence_support:
                    true,

                review_required:
                    true,

                status:
                    true,

                generated_at:
                    true
            },

            hardcoded_role_weights:
                false,

            certification_used_as_athlete_score:
                false,

            signal_value_used_as_confidence:
                false,

            verified_used_as_confidence_level:
                false,

            official_domain_score:
                false,

            official_confidence:
                false,

            trajectory_projection:
                false,

            weighting_rule:
                "The engine may consume an upstream governed authority_factor only when explicitly supplied. It may not derive authority from role prestige.",

            confidence_rule:
                "Consensus produces confidence-support signals only. It does not publish official confidence.",

            verification_rule:
                "Verification establishes provenance. Consensus consumes verification context but does not replace Verification Authority.",

            certification_rule:
                "Certification establishes professional authority under Stream 10 and may not be inferred from a role label."
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

            hardcoded_role_weights_enabled:
                false,

            evaluator_weight:
                null,

            head_coach_weight:
                null,

            position_coach_weight:
                null,

            trainer_weight:
                null,

            counselor_weight:
                null,

            recruiter_weight:
                null,

            parent_weight:
                null,

            athlete_weight:
                null,

            system_weight:
                null,

            governed_authority_factor_consumption:
                true,

            role_label_creates_authority:
                false,

            signal_magnitude_creates_confidence:
                false,

            consensus_creates_projection:
                false,

            consensus_creates_official_score:
                false,

            consensus_creates_official_confidence:
                false,

            conflict_detection:
                true,

            volatility_detection:
                true,

            attribution_preserved:
                true
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

        const healthy =
            stream9 === true;

        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                healthy
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_9_authority_verified:
                stream9,

            hardcoded_role_weights_enabled:
                false,

            certification_interpreted_as_performance:
                false,

            signal_value_used_as_confidence:
                false,

            verified_used_as_confidence_level:
                false,

            official_domain_score_publication:
                false,

            official_confidence_publication:
                false,

            projection_authority_enabled:
                false,

            role_label_creates_authority:
                false,

            governed_authority_factor_supported:
                true,

            identity_attribution_preserved:
                true,

            conflict_detection_active:
                true,

            volatility_detection_active:
                true,

            agreement_detection_active:
                true,

            missing_signal_value_becomes_zero:
                false,

            generated_at:
                nowISO()
        };
    }

    const ConsensusEngine =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                "SUPPORTING_CONSENSUS_AGREEMENT_INTELLIGENCE_AUTHORITY",

            status:
                "ACTIVE",

            statuses:
                STATUS,

            volatility_levels:
                VOLATILITY,

            agreement_levels:
                AGREEMENT_LEVELS,

            source_quality_states:
                SOURCE_QUALITY_STATES,

            buildConsensus,

            processTraitConsensus,

            explain,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScore =
        global.STATScore || {};

    global.STATScore.ConsensusEngine =
        ConsensusEngine;

    global.STATScoreConsensusEngine =
        ConsensusEngine;

    console.info(
        "[STATS-CORE] Consensus Engine loaded:",
        VERSION,
        "| role weights removed | signal value ≠ confidence | non-scoring authority"
    );

})(window); 
