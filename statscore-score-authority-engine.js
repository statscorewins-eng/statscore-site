/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-score-authority-engine.js
*
* Classification:
*     CANONICAL CONSUMER-FACING SCORE AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-SCORE-AUTHORITY-V5
*
* Contract Version:
*     STATSCORE-ATHLETE-INTELLIGENCE-MODEL-V1
*
* Status:
*     RECONSTRUCTED — GOVERNED SCORE MODEL PUBLISHER
*
* Purpose:
*     Assemble, validate, normalize, and publish the single governed
*     consumer-facing athlete intelligence model produced by Stream 9.
*
* Constitutional Chain:
*
*     Governed Athlete / Snapshot Context
*              ↓
*     Sport Intelligence Router
*              ↓
*     Registered Stream 9 Domain Authorities
*              ↓
*     Athletic Matrix
*     Production Matrix
*     Academic Matrix
*     Competition Matrix
*     Verification Matrix
*     + Approved Additional Domain Authorities
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*              ↓
*     Report Card / Explainability Authority
*              ↓
*     Authorized Consumers
*
* Constitutional Role:
*
*     The Score Authority is the single governed consumer-facing publisher
*     of Stream 9 athlete intelligence.
*
*     It DOES NOT invent scores.
*     It DOES NOT substitute one domain for another.
*     It DOES NOT calculate Composite Intelligence.
*     It DOES NOT convert raw GPA directly into Academic Score.
*     It DOES NOT create Verification Score from local status shortcuts.
*     It DOES NOT fall back to the legacy generic scoring engine.
*     It DOES NOT bypass the governed Sport Intelligence Router.
*
* Permanent Doctrine:
*
*     Evidence ≠ Intelligence
*     Intelligence ≠ Presentation
*     Intelligence ≠ Publication Execution
*     Score ≠ Confidence
*     Confidence ≠ Certification
*     Recommendation ≠ Action
*     Pathway Intelligence ≠ Placement
*     Composite Intelligence Consumes Domain Intelligence
*     Composite Intelligence Never Replaces Domain Intelligence
*     Missing ≠ Zero
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-score-authority-engine";

    const AUTHORITY_KEY =
        "STATSCORE_SCORE_AUTHORITY";

    const VERSION =
        "STATSCORE-SCORE-AUTHORITY-V5";

    const CONTRACT_VERSION =
        "STATSCORE-ATHLETE-INTELLIGENCE-MODEL-V1";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const STATUS = Object.freeze({
        READY:
            "READY",

        PARTIAL:
            "PARTIAL",

        SCORED:
            "SCORED",

        PROJECTED:
            "PROJECTED",

        UNVERIFIED:
            "UNVERIFIED",

        PENDING_VERIFICATION:
            "PENDING_VERIFICATION",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE",

        MATRIX_UNAVAILABLE:
            "MATRIX_UNAVAILABLE",

        MATRIX_UNAUTHORIZED:
            "MATRIX_UNAUTHORIZED",

        MATRIX_CONTRACT_INVALID:
            "MATRIX_CONTRACT_INVALID",

        SOURCE_EVIDENCE_CONFLICT:
            "SOURCE_EVIDENCE_CONFLICT",

        STALE_EVIDENCE:
            "STALE_EVIDENCE",

        DOMAIN_UNAVAILABLE:
            "DOMAIN_UNAVAILABLE",

        AUTHORITY_UNAVAILABLE:
            "AUTHORITY_UNAVAILABLE",

        AUTHORITY_UNAUTHORIZED:
            "AUTHORITY_UNAUTHORIZED",

        COMPOSITE_PENDING:
            "COMPOSITE_PENDING",

        COMPOSITE_BLOCKED:
            "COMPOSITE_BLOCKED",

        INVALID_INPUT:
            "INVALID_INPUT",

        ERROR:
            "ERROR"
    });

    const DOMAIN_KEYS = Object.freeze([
        "athletic",
        "production",
        "academic",
        "competition",
        "verification",
        "evaluation",
        "training",
        "exposure",
        "readiness",
        "pathway",
        "crystal"
    ]);

    const REGISTERED_MATRIX_DOMAINS = Object.freeze({
        athletic:
            "ATHLETIC_MATRIX",

        production:
            "PRODUCTION_MATRIX",

        academic:
            "ACADEMIC_MATRIX",

        competition:
            "COMPETITION_MATRIX",

        verification:
            "VERIFICATION_MATRIX"
    });

    /*
     * -------------------------------------------------------------------------
     * Additional domain authority lookup.
     * -------------------------------------------------------------------------
     *
     * These domains are active Stream 9 intelligence lanes but are not assumed
     * to be scored matrices merely to create symmetry with the five registered
     * Matrix Registry authorities.
     */

    const ADDITIONAL_DOMAIN_AUTHORITIES = Object.freeze({

        evaluation: Object.freeze([
            "STATScoreEvaluationIntelligenceEngine",
            "STATSCORE_EVALUATION_INTELLIGENCE_ENGINE"
        ]),

        training: Object.freeze([
            "STATScoreTrainingIntelligenceEngine",
            "STATSCORE_TRAINING_INTELLIGENCE_ENGINE"
        ]),

        exposure: Object.freeze([
            "STATScoreExposureIntelligenceEngine",
            "STATSCORE_EXPOSURE_INTELLIGENCE_ENGINE"
        ]),

        readiness: Object.freeze([
            "STATScoreReadinessEngine",
            "STATSCORE_READINESS_ENGINE"
        ]),

        pathway: Object.freeze([
            "STATScorePathwayIntelligenceEngine",
            "STATSCORE_PATHWAY_INTELLIGENCE_ENGINE"
        ]),

        crystal: Object.freeze([
            "STATScoreCrystalEngine",
            "STATSCORE_CRYSTAL_ENGINE"
        ])

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

    function numberOrNull(value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return null;
        }

        if (
            typeof value === "number" &&
            Number.isFinite(value)
        ) {
            return value;
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

    function normalizeInput(input) {
        if (
            !input ||
            typeof input !== "object" ||
            Array.isArray(input)
        ) {
            return {};
        }

        /*
         * Canonical caller may provide:
         *
         * {
         *   athlete_id,
         *   snapshot_id,
         *   snapshot,
         *   domain_inputs,
         *   options
         * }
         *
         * Or may pass the snapshot object directly.
         */

        if (
            input.snapshot &&
            typeof input.snapshot === "object"
        ) {
            return {
                request:
                    input,

                snapshot:
                    input.snapshot,

                domain_inputs:
                    input.domain_inputs ||
                    {},

                options:
                    input.options ||
                    {}
            };
        }

        return {
            request:
                input,

            snapshot:
                input,

            domain_inputs:
                input.domain_inputs ||
                {},

            options:
                input.options ||
                {}
        };
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

    function getSportRouter() {
        return (
            global.STATSCORE_SPORT_SCORING_ROUTER ||
            global.STATScoreSportScoringRouter ||
            global.STATScore
                ?.SportIntelligenceRouter ||
            global.STATScore
                ?.SportScoringRouter ||
            null
        );
    }

    function getMatrixRegistry() {
        return (
            global.STATScoreMatrixRegistry ||
            global.STATScore
                ?.MatrixRegistry ||
            null
        );
    }

    function getCompositeAuthority() {
        return (
            global.STATSCORE_COMPOSITE_AUTHORITY_ENGINE ||
            global.STATScoreCompositeAuthorityEngine ||
            global.STATScore
                ?.CompositeAuthorityEngine ||
            null
        );
    }

    function getExplainabilityAuthority() {
        return (
            global.STATSCORE_EXPLAINABILITY_ENGINE ||
            global.STATScoreExplainabilityEngine ||
            global.STATScore
                ?.ExplainabilityEngine ||
            null
        );
    }

    function getReportCardAuthority() {
        return (
            global.STATSCORE_REPORT_CARD_AUTHORITY ||
            global.STATScoreReportCardAuthority ||
            global.STATScore
                ?.ReportCardAuthority ||
            null
        );
    }

    function getMatrixAuthorityByDomain(
        domainKey
    ) {
        const normalizedDomain =
            lower(domainKey);

        const matrixKey =
            REGISTERED_MATRIX_DOMAINS[
                normalizedDomain
            ];

        if (!matrixKey) {
            return null;
        }

        const candidates = {

            ATHLETIC_MATRIX: [
                global.STATScoreAthleticMatrix,
                global.STATSCORE_ATHLETIC_MATRIX,
                global.STATScore
                    ?.AthleticMatrix
            ],

            PRODUCTION_MATRIX: [
                global.STATScoreProductionMatrix,
                global.STATSCORE_PRODUCTION_MATRIX_AUTHORITY,
                global.STATScore
                    ?.ProductionMatrix
            ],

            ACADEMIC_MATRIX: [
                global.STATScoreAcademicMatrix,
                global.STATSCORE_ACADEMIC_MATRIX_AUTHORITY,
                global.STATScore
                    ?.AcademicMatrix
            ],

            COMPETITION_MATRIX: [
                global.STATScoreCompetitionMatrix,
                global.STATSCORE_COMPETITION_MATRIX,
                global.STATScore
                    ?.CompetitionMatrix
            ],

            VERIFICATION_MATRIX: [
                global.STATScoreVerificationMatrix,
                global.STATSCORE_VERIFICATION_MATRIX,
                global.STATScore
                    ?.VerificationMatrix
            ]

        };

        const list =
            candidates[
                matrixKey
            ] || [];

        return (
            list.find(Boolean) ||
            null
        );
    }

    function getAdditionalDomainAuthority(
        domainKey
    ) {
        const normalizedDomain =
            lower(domainKey);

        const candidateKeys =
            ADDITIONAL_DOMAIN_AUTHORITIES[
                normalizedDomain
            ] || [];

        for (
            const key
            of candidateKeys
        ) {
            if (
                global[
                    key
                ]
            ) {
                return global[
                    key
                ];
            }
        }

        return null;
    }

    function findExecutableMethod(
        authority,
        preferredMethods
    ) {
        if (!authority) {
            return null;
        }

        for (
            const method
            of preferredMethods
        ) {
            if (
                typeof authority[
                    method
                ] === "function"
            ) {
                return method;
            }
        }

        return null;
    }

    function validateMatrixRegistration(
        matrixKey
    ) {
        const registry =
            getMatrixRegistry();

        if (!registry) {
            return {
                valid:
                    false,

                authorized:
                    false,

                status:
                    STATUS.MATRIX_UNAVAILABLE
            };
        }

        if (
            typeof registry
                .validateRegisteredMatrix ===
                "function"
        ) {
            const validation =
                registry
                    .validateRegisteredMatrix(
                        matrixKey
                    );

            if (!validation) {
                return {
                    valid:
                        false,

                    authorized:
                        false,

                    status:
                        STATUS
                            .MATRIX_CONTRACT_INVALID
                };
            }

            if (
                validation.valid !== true
            ) {
                return {
                    valid:
                        false,

                    authorized:
                        validation
                            .authorized ===
                        true,

                    status:
                        STATUS
                            .MATRIX_CONTRACT_INVALID,

                    detail:
                        validation
                };
            }

            if (
                validation.authorized !==
                true
            ) {
                return {
                    valid:
                        false,

                    authorized:
                        false,

                    status:
                        STATUS
                            .MATRIX_UNAUTHORIZED,

                    detail:
                        validation
                };
            }

            return {
                valid:
                    true,

                authorized:
                    true,

                status:
                    "REGISTERED_MATRIX_VALID",

                detail:
                    validation
            };
        }

        if (
            typeof registry
                .isAuthorized ===
                "function"
        ) {
            const authorized =
                registry
                    .isAuthorized(
                        matrixKey
                    );

            return {
                valid:
                    authorized,

                authorized,

                status:
                    authorized
                        ? "REGISTERED_MATRIX_VALID"
                        : STATUS.MATRIX_UNAUTHORIZED
            };
        }

        return {
            valid:
                false,

            authorized:
                false,

            status:
                STATUS
                    .MATRIX_CONTRACT_INVALID
        };
    }

    function normalizeDomainResult(
        domainKey,
        result,
        fallbackStatus
    ) {
        const domain =
            upper(
                result
                    ?.domain ||
                domainKey
            );

        if (!result) {
            return {
                domain,

                authority:
                    null,

                authority_version:
                    null,

                matrix_key:
                    null,

                matrix_version:
                    null,

                doctrine_version:
                    null,

                score:
                    null,

                confidence:
                    null,

                evidence_used:
                    [],

                missing_evidence:
                    [],

                flags: [
                    "DOMAIN_AUTHORITY_UNAVAILABLE"
                ],

                explanation:
                    null,

                official:
                    false,

                status:
                    fallbackStatus ||
                    STATUS.DOMAIN_UNAVAILABLE,

                generated_at:
                    nowISO()
            };
        }

        const rawScore =
            numberOrNull(
                result.score
            );

        return {
            domain,

            authority:
                result.authority ||
                result.engine ||
                result.engine_id ||
                result.matrix_key ||
                null,

            authority_version:
                result.authority_version ||
                result.version ||
                null,

            matrix_key:
                result.matrix_key ||
                null,

            matrix_version:
                result.matrix_version ||
                null,

            doctrine_version:
                result.doctrine_version ||
                null,

            score:
                rawScore,

            confidence:
                numberOrNull(
                    result.confidence
                ),

            evidence_used:
                Array.isArray(
                    result.evidence_used
                )
                    ? result.evidence_used
                    : [],

            missing_evidence:
                Array.isArray(
                    result.missing_evidence
                )
                    ? result.missing_evidence
                    : [],

            flags:
                Array.isArray(
                    result.flags
                )
                    ? result.flags
                    : [],

            explanation:
                result.explanation ||
                null,

            official:
                result.official ===
                    true ||
                result.status ===
                    "SCORED",

            status:
                result.status ||
                fallbackStatus ||
                (
                    rawScore === null
                        ? STATUS
                            .INSUFFICIENT_EVIDENCE
                        : STATUS.SCORED
                ),

            generated_at:
                result.generated_at ||
                result.created_at ||
                nowISO()
        };
    }

    function buildUnavailableDomain(
        domainKey,
        status,
        flag,
        explanation
    ) {
        return {
            domain:
                upper(
                    domainKey
                ),

            authority:
                null,

            authority_version:
                null,

            matrix_key:
                REGISTERED_MATRIX_DOMAINS[
                    lower(domainKey)
                ] ||
                null,

            matrix_version:
                null,

            doctrine_version:
                null,

            score:
                null,

            confidence:
                null,

            evidence_used:
                [],

            missing_evidence:
                [],

            flags:
                flag
                    ? [flag]
                    : [],

            explanation:
                explanation ||
                null,

            official:
                false,

            status:
                status ||
                STATUS
                    .DOMAIN_UNAVAILABLE,

            generated_at:
                nowISO()
        };
    }

    function executeRegisteredMatrixDomain(
        domainKey,
        context
    ) {
        const matrixKey =
            REGISTERED_MATRIX_DOMAINS[
                domainKey
            ];

        if (!matrixKey) {
            return buildUnavailableDomain(
                domainKey,
                STATUS.DOMAIN_UNAVAILABLE,
                "NO_REGISTERED_MATRIX_DOMAIN"
            );
        }

        const registration =
            validateMatrixRegistration(
                matrixKey
            );

        if (
            !registration.valid
        ) {
            return buildUnavailableDomain(
                domainKey,
                registration.status,
                registration.status,
                {
                    summary:
                        `${matrixKey} is not available as an authorized registered Stream 9 matrix.`,

                    registration
                }
            );
        }

        const authority =
            getMatrixAuthorityByDomain(
                domainKey
            );

        if (!authority) {
            return buildUnavailableDomain(
                domainKey,
                STATUS.MATRIX_UNAVAILABLE,
                `${matrixKey}_AUTHORITY_UNAVAILABLE`,
                {
                    summary:
                        `${matrixKey} is registered but its physical authority is unavailable.`
                }
            );
        }

        const method =
            findExecutableMethod(
                authority,
                [
                    "evaluate",
                    "calculate",
                    "score",
                    "run",
                    "evaluateAthlete",
                    "evaluateDomain"
                ]
            );

        if (!method) {
            return buildUnavailableDomain(
                domainKey,
                STATUS.MATRIX_CONTRACT_INVALID,
                `${matrixKey}_EXECUTION_METHOD_UNAVAILABLE`,
                {
                    summary:
                        `${matrixKey} does not expose a recognized governed execution method.`
                }
            );
        }

        try {
            const payload = {
                ...context.snapshot,

                sport_intelligence:
                    context
                        .sport_intelligence,

                domain_input:
                    context
                        .domain_inputs[
                            domainKey
                        ] ||
                    null,

                professional_attribution:
                    context
                        .professional_attribution ||
                    null,

                certification_context:
                    context
                        .certification_context ||
                    null,

                verification_context:
                    context
                        .verification_context ||
                    null
            };

            const result =
                authority[
                    method
                ](
                    payload
                );

            return normalizeDomainResult(
                domainKey,
                result,
                STATUS
                    .INSUFFICIENT_EVIDENCE
            );

        } catch (error) {
            return buildUnavailableDomain(
                domainKey,
                STATUS.ERROR,
                `${matrixKey}_EXECUTION_ERROR`,
                {
                    summary:
                        `${matrixKey} failed during execution.`,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error)
                }
            );
        }
    }

    function executeAdditionalDomain(
        domainKey,
        context
    ) {
        const authority =
            getAdditionalDomainAuthority(
                domainKey
            );

        if (!authority) {
            return buildUnavailableDomain(
                domainKey,
                STATUS
                    .DOMAIN_UNAVAILABLE,
                `${upper(domainKey)}_AUTHORITY_UNAVAILABLE`
            );
        }

        const method =
            findExecutableMethod(
                authority,
                [
                    "evaluate",
                    "calculate",
                    "analyze",
                    "interpret",
                    "getIntelligence",
                    "evaluateAthlete",
                    "run"
                ]
            );

        if (!method) {
            return buildUnavailableDomain(
                domainKey,
                STATUS
                    .DOMAIN_UNAVAILABLE,
                `${upper(domainKey)}_AUTHORITY_METHOD_UNAVAILABLE`
            );
        }

        try {
            const payload = {
                athlete_id:
                    context
                        .snapshot
                        .athlete_id,

                snapshot_id:
                    context
                        .snapshot
                        .snapshot_id,

                snapshot:
                    context
                        .snapshot,

                sport_intelligence:
                    context
                        .sport_intelligence,

                domains:
                    context
                        .domains,

                domain_input:
                    context
                        .domain_inputs[
                            domainKey
                        ] ||
                    null
            };

            const result =
                authority[
                    method
                ](
                    payload
                );

            return normalizeDomainResult(
                domainKey,
                result,
                STATUS
                    .DOMAIN_UNAVAILABLE
            );

        } catch (error) {
            return buildUnavailableDomain(
                domainKey,
                STATUS.ERROR,
                `${upper(domainKey)}_AUTHORITY_EXECUTION_ERROR`,
                {
                    summary:
                        `${upper(domainKey)} authority failed during execution.`,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error)
                }
            );
        }
    }

    function deriveSportIntelligence(
        snapshot,
        options
    ) {
        const router =
            getSportRouter();

        if (
            !router ||
            typeof router.route !==
                "function"
        ) {
            return {
                ok:
                    false,

                authority:
                    "SPORT_INTELLIGENCE_ROUTER",

                status:
                    STATUS
                        .AUTHORITY_UNAVAILABLE,

                sport:
                    null,

                athlete_id:
                    snapshot
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    snapshot
                        ?.snapshot_id ||
                    null,

                traits:
                    {},

                evidence_used:
                    [],

                missing_evidence:
                    [],

                flags: [
                    "SPORT_INTELLIGENCE_ROUTER_UNAVAILABLE"
                ],

                official:
                    false,

                generated_at:
                    nowISO()
            };
        }

        try {
            return router.route(
                snapshot,
                options
                    ?.sport_intelligence ||
                {}
            );

        } catch (error) {
            return {
                ok:
                    false,

                authority:
                    "SPORT_INTELLIGENCE_ROUTER",

                status:
                    STATUS.ERROR,

                sport:
                    null,

                athlete_id:
                    snapshot
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    snapshot
                        ?.snapshot_id ||
                    null,

                traits:
                    {},

                evidence_used:
                    [],

                missing_evidence:
                    [],

                flags: [
                    "SPORT_INTELLIGENCE_ROUTER_ERROR"
                ],

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),

                official:
                    false,

                generated_at:
                    nowISO()
            };
        }
    }

    function buildCompositePending(
        domains,
        reason
    ) {
        return {
            authority:
                "STATSCORE_COMPOSITE_AUTHORITY",

            composite_version:
                null,

            score:
                null,

            confidence:
                null,

            domains_consumed:
                [],

            domains_excluded:
                Object.keys(
                    domains
                ),

            missing_domains:
                Object.entries(
                    domains
                )
                    .filter(
                        function (
                            [, domain]
                        ) {
                            return (
                                domain
                                    .score ===
                                null
                            );
                        }
                    )
                    .map(
                        function (
                            [key]
                        ) {
                            return key;
                        }
                    ),

            flags: [
                reason ||
                "COMPOSITE_AUTHORITY_NOT_AVAILABLE"
            ],

            score_drivers:
                [],

            score_limiters:
                [],

            explanation: {
                summary:
                    "Composite Intelligence has not been published. No proprietary weighting has been guessed."
            },

            official:
                false,

            status:
                STATUS
                    .COMPOSITE_PENDING,

            generated_at:
                nowISO()
        };
    }

    function executeComposite(
        context
    ) {
        const authority =
            getCompositeAuthority();

        if (!authority) {
            return buildCompositePending(
                context.domains,
                "COMPOSITE_AUTHORITY_UNAVAILABLE"
            );
        }

        const method =
            findExecutableMethod(
                authority,
                [
                    "compose",
                    "calculateComposite",
                    "evaluate",
                    "buildComposite",
                    "run"
                ]
            );

        if (!method) {
            return buildCompositePending(
                context.domains,
                "COMPOSITE_AUTHORITY_METHOD_UNAVAILABLE"
            );
        }

        try {
            const result =
                authority[
                    method
                ]({
                    athlete_id:
                        context
                            .snapshot
                            .athlete_id,

                    snapshot_id:
                        context
                            .snapshot
                            .snapshot_id,

                    domains:
                        context
                            .domains
                });

            if (!result) {
                return buildCompositePending(
                    context.domains,
                    "COMPOSITE_AUTHORITY_RETURNED_NO_RESULT"
                );
            }

            return {
                authority:
                    result.authority ||
                    result.engine ||
                    "STATSCORE_COMPOSITE_AUTHORITY",

                composite_version:
                    result.composite_version ||
                    result.version ||
                    null,

                score:
                    numberOrNull(
                        result.score
                    ),

                confidence:
                    numberOrNull(
                        result.confidence
                    ),

                domains_consumed:
                    Array.isArray(
                        result
                            .domains_consumed
                    )
                        ? result
                            .domains_consumed
                        : [],

                domains_excluded:
                    Array.isArray(
                        result
                            .domains_excluded
                    )
                        ? result
                            .domains_excluded
                        : [],

                missing_domains:
                    Array.isArray(
                        result
                            .missing_domains
                    )
                        ? result
                            .missing_domains
                        : [],

                flags:
                    Array.isArray(
                        result.flags
                    )
                        ? result.flags
                        : [],

                score_drivers:
                    Array.isArray(
                        result
                            .score_drivers
                    )
                        ? result
                            .score_drivers
                        : [],

                score_limiters:
                    Array.isArray(
                        result
                            .score_limiters
                    )
                        ? result
                            .score_limiters
                        : [],

                explanation:
                    result.explanation ||
                    null,

                official:
                    result.official ===
                        true ||
                    result.status ===
                        "SCORED",

                status:
                    result.status ||
                    (
                        numberOrNull(
                            result.score
                        ) === null
                            ? STATUS
                                .COMPOSITE_PENDING
                            : STATUS.SCORED
                    ),

                generated_at:
                    result.generated_at ||
                    nowISO()
            };

        } catch (error) {
            return {
                ...buildCompositePending(
                    context.domains,
                    "COMPOSITE_AUTHORITY_ERROR"
                ),

                status:
                    STATUS
                        .COMPOSITE_BLOCKED,

                explanation: {
                    summary:
                        "Composite Authority failed during execution. Composite remains blocked.",

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error)
                }
            };
        }
    }

    function buildReportCardFallback(
        context
    ) {
        const domainSummary =
            Object.entries(
                context.domains
            ).map(
                function (
                    [key, domain]
                ) {
                    return {
                        domain:
                            key,

                        score:
                            domain.score,

                        confidence:
                            domain.confidence,

                        status:
                            domain.status,

                        evidence_used:
                            domain.evidence_used,

                        missing_evidence:
                            domain.missing_evidence,

                        flags:
                            domain.flags
                    };
                }
            );

        return {
            authority:
                "REPORT_CARD_PENDING",

            version:
                null,

            status:
                "REPORT_CARD_AUTHORITY_PENDING",

            official:
                false,

            athlete_id:
                context
                    .snapshot
                    .athlete_id,

            snapshot_id:
                context
                    .snapshot
                    .snapshot_id,

            domains:
                domainSummary,

            composite: {
                score:
                    context
                        .composite
                        .score,

                confidence:
                    context
                        .composite
                        .confidence,

                status:
                    context
                        .composite
                        .status
            },

            explanation: {
                summary:
                    "Formal Snapshot Report Card authority is unavailable. This fallback contains no additional scoring logic."
            },

            generated_at:
                nowISO()
        };
    }

    function executeReportCard(
        context
    ) {
        const authority =
            getReportCardAuthority();

        if (!authority) {
            return buildReportCardFallback(
                context
            );
        }

        const method =
            findExecutableMethod(
                authority,
                [
                    "buildReportCard",
                    "build",
                    "generate",
                    "evaluate"
                ]
            );

        if (!method) {
            return buildReportCardFallback(
                context
            );
        }

        try {
            const result =
                authority[
                    method
                ]({
                    athlete_id:
                        context
                            .snapshot
                            .athlete_id,

                    snapshot_id:
                        context
                            .snapshot
                            .snapshot_id,

                    domains:
                        context
                            .domains,

                    composite:
                        context
                            .composite
                });

            return (
                result ||
                buildReportCardFallback(
                    context
                )
            );

        } catch (error) {
            return {
                ...buildReportCardFallback(
                    context
                ),

                status:
                    "REPORT_CARD_AUTHORITY_ERROR",

                explanation: {
                    summary:
                        "Formal Snapshot Report Card authority failed. No substitute score was created.",

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error)
                }
            };
        }
    }

    function executeExplainability(
        context
    ) {
        const authority =
            getExplainabilityAuthority();

        if (!authority) {
            return {
                authority:
                    "EXPLAINABILITY_AUTHORITY_PENDING",

                status:
                    "EXPLAINABILITY_PENDING",

                official:
                    false,

                generated_at:
                    nowISO()
            };
        }

        const method =
            findExecutableMethod(
                authority,
                [
                    "explainDecision",
                    "explain",
                    "buildExplanation"
                ]
            );

        if (!method) {
            return {
                authority:
                    "EXPLAINABILITY_AUTHORITY_PENDING",

                status:
                    "EXPLAINABILITY_PENDING",

                official:
                    false,

                generated_at:
                    nowISO()
            };
        }

        try {
            return (
                authority[
                    method
                ]({
                    athlete_id:
                        context
                            .snapshot
                            .athlete_id,

                    snapshot_id:
                        context
                            .snapshot
                            .snapshot_id,

                    sport_intelligence:
                        context
                            .sport_intelligence,

                    domains:
                        context
                            .domains,

                    composite:
                        context
                            .composite,

                    report_card:
                        context
                            .report_card
                }) ||
                {
                    authority:
                        "EXPLAINABILITY_AUTHORITY",

                    status:
                        "EXPLAINABILITY_PENDING",

                    official:
                        false,

                    generated_at:
                        nowISO()
                }
            );

        } catch (error) {
            return {
                authority:
                    "EXPLAINABILITY_AUTHORITY",

                status:
                    "EXPLAINABILITY_ERROR",

                official:
                    false,

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),

                generated_at:
                    nowISO()
            };
        }
    }

    function collectModelFlags(
        sportIntelligence,
        domains,
        composite
    ) {
        const flags =
            [];

        if (
            Array.isArray(
                sportIntelligence
                    ?.flags
            )
        ) {
            flags.push(
                ...sportIntelligence
                    .flags
            );
        }

        Object.values(
            domains
        ).forEach(
            function (
                domain
            ) {
                if (
                    Array.isArray(
                        domain
                            .flags
                    )
                ) {
                    flags.push(
                        ...domain
                            .flags
                    );
                }
            }
        );

        if (
            Array.isArray(
                composite
                    ?.flags
            )
        ) {
            flags.push(
                ...composite
                    .flags
            );
        }

        return Array.from(
            new Set(
                flags.filter(Boolean)
            )
        );
    }

    function determineModelStatus(
        domains,
        composite
    ) {
        const domainValues =
            Object.values(
                domains
            );

        const scored =
            domainValues.filter(
                function (
                    domain
                ) {
                    return (
                        domain.score !==
                        null
                    );
                }
            ).length;

        const unavailable =
            domainValues.filter(
                function (
                    domain
                ) {
                    return (
                        domain.status ===
                            STATUS.DOMAIN_UNAVAILABLE ||
                        domain.status ===
                            STATUS.MATRIX_UNAVAILABLE ||
                        domain.status ===
                            STATUS.AUTHORITY_UNAVAILABLE
                    );
                }
            ).length;

        if (
            scored === 0
        ) {
            return STATUS
                .INSUFFICIENT_EVIDENCE;
        }

        if (
            unavailable > 0 ||
            composite
                ?.status ===
                STATUS
                    .COMPOSITE_PENDING ||
            composite
                ?.status ===
                STATUS
                    .COMPOSITE_BLOCKED
        ) {
            return STATUS.PARTIAL;
        }

        return STATUS.READY;
    }

    function buildDomains(
        context
    ) {
        const domains =
            {};

        /*
         * Registered matrices
         */

        [
            "athletic",
            "production",
            "academic",
            "competition",
            "verification"
        ].forEach(
            function (
                domainKey
            ) {
                domains[
                    domainKey
                ] =
                    executeRegisteredMatrixDomain(
                        domainKey,
                        {
                            ...context,
                            domains
                        }
                    );
            }
        );

        /*
         * Additional active intelligence lanes
         *
         * These are deliberately not fabricated as numeric matrices.
         */

        [
            "evaluation",
            "training",
            "exposure",
            "readiness",
            "pathway",
            "crystal"
        ].forEach(
            function (
                domainKey
            ) {
                domains[
                    domainKey
                ] =
                    executeAdditionalDomain(
                        domainKey,
                        {
                            ...context,
                            domains
                        }
                    );
            }
        );

        return domains;
    }

    function buildAthleteIntelligenceModel(
        input
    ) {
        lastError =
            null;

        try {
            const normalized =
                normalizeInput(
                    input
                );

            const snapshot =
                normalized
                    .snapshot;

            if (
                !snapshot ||
                typeof snapshot !==
                    "object" ||
                Array.isArray(
                    snapshot
                )
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    stream_owner:
                        STREAM_OWNER,

                    athlete_id:
                        null,

                    snapshot_id:
                        null,

                    domains:
                        {},

                    composite:
                        null,

                    report_card:
                        null,

                    explainability:
                        null,

                    flags: [
                        "ATHLETE_SNAPSHOT_REQUIRED"
                    ],

                    status:
                        STATUS.INVALID_INPUT,

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
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    stream_owner:
                        STREAM_OWNER,

                    athlete_id:
                        snapshot
                            .athlete_id ||
                        null,

                    snapshot_id:
                        snapshot
                            .snapshot_id ||
                        null,

                    domains:
                        {},

                    composite:
                        null,

                    report_card:
                        null,

                    explainability:
                        null,

                    flags: [
                        authorityValidation
                            .status
                    ],

                    status:
                        authorityValidation
                            .status,

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            if (
                !snapshot
                    .athlete_id ||
                !snapshot
                    .snapshot_id
            ) {
                const missing =
                    [];

                if (
                    !snapshot
                        .athlete_id
                ) {
                    missing.push(
                        "athlete_id"
                    );
                }

                if (
                    !snapshot
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
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    stream_owner:
                        STREAM_OWNER,

                    athlete_id:
                        snapshot
                            .athlete_id ||
                        null,

                    snapshot_id:
                        snapshot
                            .snapshot_id ||
                        null,

                    domains:
                        {},

                    composite:
                        null,

                    report_card:
                        null,

                    explainability:
                        null,

                    missing_evidence:
                        missing,

                    flags: [
                        "REQUIRED_IDENTITY_MISSING"
                    ],

                    status:
                        STATUS.INVALID_INPUT,

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            const sportIntelligence =
                deriveSportIntelligence(
                    snapshot,
                    normalized
                        .options
                );

            const baseContext = {
                snapshot,

                sport_intelligence:
                    sportIntelligence,

                domain_inputs:
                    normalized
                        .domain_inputs,

                professional_attribution:
                    normalized
                        .request
                        ?.professional_attribution ||
                    null,

                certification_context:
                    normalized
                        .request
                        ?.certification_context ||
                    null,

                verification_context:
                    normalized
                        .request
                        ?.verification_context ||
                    null,

                options:
                    normalized
                        .options
            };

            const domains =
                buildDomains(
                    baseContext
                );

            const composite =
                executeComposite({
                    ...baseContext,
                    domains
                });

            const reportCard =
                executeReportCard({
                    ...baseContext,
                    domains,
                    composite
                });

            const explainability =
                executeExplainability({
                    ...baseContext,
                    domains,
                    composite,
                    report_card:
                        reportCard
                });

            const flags =
                collectModelFlags(
                    sportIntelligence,
                    domains,
                    composite
                );

            const status =
                determineModelStatus(
                    domains,
                    composite
                );

            const result = {
                ok:
                    true,

                authority:
                    AUTHORITY_KEY,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "OFFICIAL_STREAM_9_CONSUMER_INTELLIGENCE_MODEL",

                athlete_id:
                    snapshot
                        .athlete_id,

                snapshot_id:
                    snapshot
                        .snapshot_id,

                sport_context: {
                    sport:
                        sportIntelligence
                            ?.sport ||
                        null,

                    authority:
                        sportIntelligence
                            ?.sport_authority ||
                        sportIntelligence
                            ?.authority ||
                        null,

                    position_or_event:
                        sportIntelligence
                            ?.position_or_event ||
                        null,

                    archetype_context:
                        sportIntelligence
                            ?.archetype_context ||
                        null,

                    status:
                        sportIntelligence
                            ?.status ||
                        STATUS
                            .DOMAIN_UNAVAILABLE
                },

                sport_intelligence:
                    sportIntelligence,

                domains,

                composite,

                report_card:
                    reportCard,

                explainability,

                flags,

                /*
                 * Explicitly absent by doctrine:
                 *
                 * position_score
                 * character_score
                 * locally derived academic_score
                 * locally derived verification_score
                 * generic final_score
                 *
                 * Consumers must read the appropriate domain object.
                 */

                publication: {
                    domain_source_rule:
                        "ONE_DOMAIN_ONE_SOURCE_AUTHORITY",

                    composite_source_rule:
                        "COMPOSITE_AUTHORITY_ONLY",

                    consumer_recalculation_allowed:
                        false,

                    consumer_reweighting_allowed:
                        false,

                    consumer_null_substitution_allowed:
                        false,

                    consumer_confidence_override_allowed:
                        false
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

                authority:
                    AUTHORITY_KEY,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                athlete_id:
                    input
                        ?.athlete_id ||
                    input
                        ?.snapshot
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    input
                        ?.snapshot_id ||
                    input
                        ?.snapshot
                        ?.snapshot_id ||
                    null,

                domains:
                    {},

                composite:
                    null,

                report_card:
                    null,

                explainability:
                    null,

                flags: [
                    "SCORE_AUTHORITY_EXECUTION_ERROR"
                ],

                error:
                    lastError
                        .message,

                status:
                    STATUS.ERROR,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }
    }

    /*
     * -------------------------------------------------------------------------
     * Canonical Public API
     * -------------------------------------------------------------------------
     */

    function getAthleteIntelligence(
        input
    ) {
        return buildAthleteIntelligenceModel(
            input
        );
    }

    /*
     * -------------------------------------------------------------------------
     * Compatibility APIs
     * -------------------------------------------------------------------------
     *
     * Dashboard and Profile now consume the same authority model.
     *
     * There is no separate dashboard scoring path.
     * There is no separate profile scoring path.
     */

    function getDashboardScoreModel(
        input
    ) {
        return getAthleteIntelligence(
            input
        );
    }

    function getProfileScoreModel(
        input
    ) {
        return getAthleteIntelligence(
            input
        );
    }

    function explain(
        input
    ) {
        return getAthleteIntelligence(
            input
        );
    }

    function getContract() {
        return {
            authority:
                AUTHORITY_KEY,

            engine_id:
                ENGINE_ID,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                "CANONICAL_SCORE_MODEL_PUBLISHER",

            required_identity: [
                "athlete_id",
                "snapshot_id"
            ],

            canonical_method:
                "getAthleteIntelligence",

            compatibility_methods: [
                "getDashboardScoreModel",
                "getProfileScoreModel",
                "explain"
            ],

            registered_matrix_domains:
                {
                    ...REGISTERED_MATRIX_DOMAINS
                },

            active_domain_keys:
                Array.from(
                    DOMAIN_KEYS
                ),

            required_consumer_model: {
                athlete_id:
                    true,

                snapshot_id:
                    true,

                sport_context:
                    true,

                domains:
                    true,

                composite:
                    true,

                report_card:
                    true,

                explainability:
                    true,

                flags:
                    true,

                generated_at:
                    true
            },

            domain_rule:
                "Each domain must originate from its own governed authority.",

            score_rule:
                "The Score Authority publishes domain intelligence; it does not invent missing domain scores.",

            academic_rule:
                "GPA may not be directly converted into official Academic Score.",

            verification_rule:
                "Verification Score may not be manufactured from local status shortcuts.",

            production_rule:
                "Production Score may never fall back to Athletic or sport intelligence.",

            position_rule:
                "Position/event context does not create an independent Position Score unless a future certified authority explicitly establishes one.",

            character_rule:
                "Character Intelligence is inactive and no character_score compatibility field may be published.",

            generic_fallback_rule:
                "Legacy generic scoring fallback is prohibited.",

            sport_bypass_rule:
                "Direct sport-engine bypass is prohibited. Sport intelligence must enter through the governed Sport Intelligence Router.",

            composite_rule:
                "Composite Intelligence is calculated only by Composite Authority.",

            missing_rule:
                "Missing domain intelligence remains null or unavailable. Missing does not become zero or another domain's value.",

            presentation_rule:
                "Authority output contains semantic null/state values only. Presentation glyphs belong downstream.",

            consumer_rule:
                "Consumers may display and explain governed intelligence but may not recalculate, reweight, infer, or override it."
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

            stream_owner:
                STREAM_OWNER,

            domains:
                Array.from(
                    DOMAIN_KEYS
                ),

            registered_matrix_domains:
                {
                    ...REGISTERED_MATRIX_DOMAINS
                },

            legacy_generic_fallback:
                false,

            direct_sport_engine_bypass:
                false,

            domain_substitution:
                false,

            athletic_equals_position:
                false,

            production_falls_back_to_athletic:
                false,

            academic_gpa_direct_conversion:
                false,

            local_verification_scoring:
                false,

            synthesis_confidence_as_official:
                false,

            character_intelligence_active:
                false,

            ui_glyphs_in_authority_output:
                false,

            composite_calculated_locally:
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

        const router =
            getSportRouter();

        const registry =
            getMatrixRegistry();

        const matrixStatus =
            {};

        Object.entries(
            REGISTERED_MATRIX_DOMAINS
        ).forEach(
            function (
                [domain, matrixKey]
            ) {
                const registration =
                    validateMatrixRegistration(
                        matrixKey
                    );

                const authority =
                    getMatrixAuthorityByDomain(
                        domain
                    );

                matrixStatus[
                    domain
                ] = {
                    matrix_key:
                        matrixKey,

                    registered:
                        Boolean(
                            registration
                                .valid
                        ),

                    authorized:
                        Boolean(
                            registration
                                .authorized
                        ),

                    authority_loaded:
                        Boolean(
                            authority
                        ),

                    status:
                        registration
                            .status
                };
            }
        );

        const requiredMatrixHealthy =
            Object.values(
                matrixStatus
            ).every(
                function (
                    status
                ) {
                    return (
                        status.registered &&
                        status.authorized &&
                        status
                            .authority_loaded
                    );
                }
            );

        const composite =
            getCompositeAuthority();

        const explainability =
            getExplainabilityAuthority();

        const reportCard =
            getReportCardAuthority();

        const healthy =
            stream9.valid &&
            Boolean(
                router &&
                typeof router.route ===
                    "function"
            ) &&
            Boolean(
                registry
            ) &&
            requiredMatrixHealthy;

        return {
            authority:
                AUTHORITY_KEY,

            engine_id:
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
                stream9,

            sport_intelligence_router_loaded:
                Boolean(
                    router &&
                    typeof router.route ===
                        "function"
                ),

            matrix_registry_loaded:
                Boolean(
                    registry
                ),

            registered_matrix_domains:
                matrixStatus,

            athletic_matrix_loaded:
                matrixStatus
                    .athletic
                    ?.authority_loaded ===
                true,

            production_matrix_loaded:
                matrixStatus
                    .production
                    ?.authority_loaded ===
                true,

            academic_matrix_loaded:
                matrixStatus
                    .academic
                    ?.authority_loaded ===
                true,

            competition_matrix_loaded:
                matrixStatus
                    .competition
                    ?.authority_loaded ===
                true,

            verification_matrix_loaded:
                matrixStatus
                    .verification
                    ?.authority_loaded ===
                true,

            composite_authority_loaded:
                Boolean(
                    composite
                ),

            explainability_authority_loaded:
                Boolean(
                    explainability
                ),

            report_card_authority_loaded:
                Boolean(
                    reportCard
                ),

            legacy_generic_fallback_enabled:
                false,

            direct_sport_engine_bypass_enabled:
                false,

            domain_substitution_enabled:
                false,

            athletic_equals_position:
                false,

            production_falls_back_to_athletic:
                false,

            academic_gpa_direct_conversion:
                false,

            local_verification_score_shortcut:
                false,

            synthesis_confidence_used_as_official:
                false,

            character_intelligence_active:
                false,

            composite_calculated_locally:
                false,

            missing_scores_coerced_to_zero:
                false,

            generated_at:
                nowISO()
        };
    }

    const ScoreAuthority =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            status:
                "ACTIVE",

            classification:
                "CANONICAL_CONSUMER_FACING_SCORE_AUTHORITY",

            official_consumer_publisher:
                true,

            getAthleteIntelligence,

            getDashboardScoreModel,

            getProfileScoreModel,

            explain,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATSCORE_SCORE_AUTHORITY_ENGINE =
        ScoreAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.ScoreAuthority =
        ScoreAuthority;

    global.STATScore.ScoreAuthorityEngine =
        ScoreAuthority;

    console.info(
        "[STATS-CORE] Score Authority Engine loaded:",
        VERSION,
        "| one-domain-one-source | generic fallback disabled | composite delegated"
    );

})(window); 
