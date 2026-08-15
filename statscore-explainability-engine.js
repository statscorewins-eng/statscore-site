/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Explainability Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-explainability-engine.js
*
* Classification:
*     SUPPORTING EXPLAINABILITY / REPORT-CARD AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Purpose:
*     Convert already-governed STATS-CORE intelligence into clear,
*     audience-appropriate explanations while preserving the exact
*     intelligence, confidence, evidence state, authority lineage,
*     limitations, flags, recommendations, and receipts produced by
*     the governing Stream 9 authorities.
*
* Supported Governed Subjects:
*
*     ATHLETE INTELLIGENCE
*       athlete_id
*       snapshot_id
*
*     PROGRAM / ORGANIZATION HEALTH INTELLIGENCE
*       program_id and/or organization_id
*       program_intelligence_id
*       intelligence_receipt_id
*
* Constitutional Role:
*
*     Registered Domain Authorities
*               ↓
*     Score / Intelligence Authorities
*               ↓
*     Governed Intelligence Package
*               ↓
*     Explainability Authority
*               ↓
*     Consumer / Report Card / Presentation / Publication
*
* Core Doctrine:
*
*     Explainability may change how governed intelligence is communicated.
*     It may never change what the intelligence is.
*
*     Explainability MUST NOT:
*
*       - calculate an athlete score;
*       - calculate a Program Health score;
*       - recalculate a domain score;
*       - calculate a composite score;
*       - calculate confidence;
*       - establish scoring thresholds;
*       - manufacture missing intelligence;
*       - infer an official ranking;
*       - create recruiting interest;
*       - create an offer or commitment;
*       - create a Crystal match;
*       - create pathway authority;
*       - override confidence;
*       - independently prioritize recommendations;
*       - convert missing evidence into athlete performance;
*       - convert missing evidence into Program Health;
*       - treat arbitrary page values as official intelligence;
*       - authorize publication.
*
*     Missing Authority ≠ Permission to Reconstruct Authority.
*
*     Explainability Authority ≠ Publication Authority.
*
*     Program Health Explainability SHALL consume Program Health
*     Intelligence. It SHALL NOT manufacture Program Health Intelligence.
*
* Version:
*     STATSCORE-EXPLAINABILITY-ENGINE-V2.1-PROGRAM-COMPAT
*
* Status:
*     STREAM 9 GOVERNED — PROGRAM COMPATIBILITY EXTENSION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE =
        "statscore-explainability-engine.js";

    const VERSION =
        "STATSCORE-EXPLAINABILITY-ENGINE-V2.1-PROGRAM-COMPAT";

    const OWNER_STREAM =
        "STREAM_9_ENTERPRISE_INTELLIGENCE_AUTHORITY";


    //----------------------------------------------------------------------
    // Governed Subject Types
    //----------------------------------------------------------------------

    const SUBJECT_TYPES = Object.freeze({
        ATHLETE:
            "ATHLETE",

        PROGRAM:
            "PROGRAM"
    });


    //----------------------------------------------------------------------
    // Status
    //----------------------------------------------------------------------

    const STATUS = Object.freeze({
        EXPLAINED:
            "EXPLAINED",

        PARTIAL_EXPLANATION:
            "PARTIAL_EXPLANATION",

        INTELLIGENCE_PACKAGE_REQUIRED:
            "INTELLIGENCE_PACKAGE_REQUIRED",

        DOMAIN_UNAVAILABLE:
            "DOMAIN_UNAVAILABLE",

        AUTHORITY_LINEAGE_MISSING:
            "AUTHORITY_LINEAGE_MISSING",

        UNOFFICIAL_INPUT_REJECTED:
            "UNOFFICIAL_INPUT_REJECTED",

        COMPOSITE_PENDING:
            "COMPOSITE_PENDING",

        EXPLANATION_BLOCKED:
            "EXPLANATION_BLOCKED",

        SUBJECT_IDENTITY_REQUIRED:
            "SUBJECT_IDENTITY_REQUIRED",

        PROGRAM_INTELLIGENCE_RECEIPT_REQUIRED:
            "PROGRAM_INTELLIGENCE_RECEIPT_REQUIRED",

        PROGRAM_INTELLIGENCE_ID_REQUIRED:
            "PROGRAM_INTELLIGENCE_ID_REQUIRED"
    });


    //----------------------------------------------------------------------
    // Audiences
    //----------------------------------------------------------------------

    const AUDIENCES = Object.freeze({
        ATHLETE:
            "ATHLETE",

        PARENT:
            "PARENT",

        COACH:
            "COACH",

        COUNSELOR:
            "COUNSELOR",

        RECRUITER:
            "RECRUITER",

        EVALUATOR:
            "EVALUATOR",

        TRAINER:
            "TRAINER",

        PROGRAM:
            "PROGRAM",

        ADMIN:
            "ADMIN"
    });


    //----------------------------------------------------------------------
    // Athlete Domain Registry
    //----------------------------------------------------------------------

    const ATHLETE_DOMAIN_KEYS = Object.freeze([
        "athletic",
        "production",
        "academic",
        "evaluation",
        "training",
        "competition",
        "verification",
        "exposure",
        "readiness",
        "pathway",
        "crystal"
    ]);


    //----------------------------------------------------------------------
    // Program Health Domain Registry
    //----------------------------------------------------------------------

    const PROGRAM_DOMAIN_KEYS = Object.freeze([
        "roster",
        "academic",
        "development",
        "recruiting",
        "exposure",
        "pathway",
        "professional_effectiveness"
    ]);


    //----------------------------------------------------------------------
    // Basic Utilities
    //----------------------------------------------------------------------

    function nowISO() {
        return new Date().toISOString();
    }


    function normalize(value) {
        return String(value ?? "").trim();
    }


    function upper(value) {
        return normalize(value).toUpperCase();
    }


    function safeArray(value) {
        return Array.isArray(value)
            ? value.filter(
                item =>
                    item !== null &&
                    item !== undefined
            )
            : [];
    }


    function uniqueArray(value) {
        return Array.from(
            new Set(
                safeArray(value)
                    .map(item => {
                        if (typeof item === "string") {
                            return item.trim();
                        }

                        return item;
                    })
                    .filter(Boolean)
            )
        );
    }


    function clone(value) {
        if (value === undefined) {
            return undefined;
        }

        try {
            return JSON.parse(
                JSON.stringify(value)
            );
        } catch (_) {
            return value;
        }
    }


    function firstDefined(...values) {
        for (const value of values) {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }
        }

        return null;
    }


    function hasObject(value) {
        return Boolean(
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }


    function normalizeAudience(value) {
        const audience =
            upper(
                value ||
                "ATHLETE"
            );

        return AUDIENCES[audience]
            ? audience
            : AUDIENCES.ATHLETE;
    }


    //----------------------------------------------------------------------
    // Stream 9 Authority Validation
    //----------------------------------------------------------------------

    function getStream9Authority() {
        return (
            global.STATScoreStream9Authority ||
            null
        );
    }


    function getScoreDoctrine() {
        return (
            global.STATScoreScoreDoctrine ||
            null
        );
    }


    function getIntelligenceDoctrine() {
        return (
            global.STATScoreIntelligenceDoctrine ||
            null
        );
    }


    function validateStream9Authority() {
        const authority =
            getStream9Authority();

        return Boolean(
            authority &&
            authority.stream_number === 9 &&
            authority.operational_state ===
                "ACTIVE"
        );
    }


    function validateDoctrineChain() {
        const scoreDoctrine =
            getScoreDoctrine();

        const intelligenceDoctrine =
            getIntelligenceDoctrine();

        return {
            stream_9_authority:
                validateStream9Authority(),

            score_doctrine:
                Boolean(
                    scoreDoctrine &&
                    scoreDoctrine.doctrine_key ===
                        "STATSCORE_SCORE_DOCTRINE"
                ),

            intelligence_doctrine:
                Boolean(
                    intelligenceDoctrine &&
                    intelligenceDoctrine.doctrine_key ===
                        "STATSCORE_INTELLIGENCE_DOCTRINE"
                )
        };
    }


    //----------------------------------------------------------------------
    // Subject Detection
    //----------------------------------------------------------------------

    function detectSubjectType(input = {}) {
        const packageInput =
            hasObject(input.intelligence_package)
                ? input.intelligence_package
                : input;

        const explicit =
            upper(
                firstDefined(
                    packageInput.subject_type,
                    input.subject_type
                )
            );

        if (
            explicit ===
            SUBJECT_TYPES.PROGRAM
        ) {
            return SUBJECT_TYPES.PROGRAM;
        }

        if (
            explicit ===
            SUBJECT_TYPES.ATHLETE
        ) {
            return SUBJECT_TYPES.ATHLETE;
        }


        const hasProgramIdentity =
            Boolean(
                packageInput.program_id ||
                packageInput.organization_id ||
                packageInput.program_intelligence_id ||
                packageInput.intelligence_id
            );


        const hasAthleteIdentity =
            Boolean(
                packageInput.athlete_id ||
                packageInput.snapshot_id
            );


        if (
            hasProgramIdentity &&
            !hasAthleteIdentity
        ) {
            return SUBJECT_TYPES.PROGRAM;
        }

        return SUBJECT_TYPES.ATHLETE;
    }


    //----------------------------------------------------------------------
    // Governed Input Contract
    //----------------------------------------------------------------------

    function normalizePackage(input = {}) {
        if (!hasObject(input)) {
            return null;
        }

        const packageInput =
            hasObject(input.intelligence_package)
                ? input.intelligence_package
                : input;


        const subjectType =
            detectSubjectType(input);


        const domains =
            hasObject(packageInput.domains)
                ? packageInput.domains
                : {};


        return {
            subject_type:
                subjectType,


            //--------------------------------------------------------------
            // Athlete Identity
            //--------------------------------------------------------------

            athlete_id:
                firstDefined(
                    packageInput.athlete_id,
                    input.athlete_id
                ),

            snapshot_id:
                firstDefined(
                    packageInput.snapshot_id,
                    input.snapshot_id
                ),

            athlete_name:
                firstDefined(
                    packageInput.athlete_name,
                    packageInput.athlete_display_name,
                    input.athlete_name,
                    input.athlete_display_name
                ),


            //--------------------------------------------------------------
            // Program / Organization Identity
            //--------------------------------------------------------------

            program_id:
                firstDefined(
                    packageInput.program_id,
                    input.program_id
                ),

            organization_id:
                firstDefined(
                    packageInput.organization_id,
                    input.organization_id
                ),

            program_name:
                firstDefined(
                    packageInput.program_name,
                    packageInput.organization_name,
                    input.program_name,
                    input.organization_name
                ),

            program_intelligence_id:
                firstDefined(
                    packageInput.program_intelligence_id,
                    packageInput.intelligence_id,
                    input.program_intelligence_id,
                    input.intelligence_id
                ),

            intelligence_receipt_id:
                firstDefined(
                    packageInput.intelligence_receipt_id,
                    packageInput.receipt_id,
                    input.intelligence_receipt_id,
                    input.receipt_id
                ),


            //--------------------------------------------------------------
            // Intelligence Metadata
            //--------------------------------------------------------------

            intelligence_version:
                firstDefined(
                    packageInput.intelligence_version,
                    packageInput.version
                ),

            doctrine_version:
                firstDefined(
                    packageInput.doctrine_version,
                    packageInput.score_doctrine_version
                ),

            generated_at:
                firstDefined(
                    packageInput.generated_at,
                    packageInput.effective_at
                ),

            publisher:
                firstDefined(
                    packageInput.publisher,
                    packageInput.authority,
                    packageInput.intelligence_authority,
                    packageInput.authority_key
                ),

            publication_status:
                firstDefined(
                    packageInput.publication_status,
                    packageInput.status
                ),


            //--------------------------------------------------------------
            // Governed State
            //--------------------------------------------------------------

            domains,

            composite:
                hasObject(packageInput.composite)
                    ? packageInput.composite
                    : null,

            synthesis:
                hasObject(packageInput.synthesis)
                    ? packageInput.synthesis
                    : null,

            recommendations:
                packageInput.recommendations ||
                null,

            report_card:
                hasObject(packageInput.report_card)
                    ? packageInput.report_card
                    : null,

            authority_lineage:
                safeArray(
                    packageInput.authority_lineage
                ),

            flags:
                safeArray(
                    packageInput.flags
                ),


            //--------------------------------------------------------------
            // Program Health Governed Outputs
            //--------------------------------------------------------------

            health_score:
                firstDefined(
                    packageInput.health_score,
                    packageInput.program_health_score
                ),

            health_state:
                firstDefined(
                    packageInput.health_state,
                    packageInput.health_signal
                ),

            confidence:
                firstDefined(
                    packageInput.confidence,
                    packageInput.confidence_score
                ),

            evidence_sufficiency:
                hasObject(
                    packageInput.evidence_sufficiency
                )
                    ? packageInput.evidence_sufficiency
                    : null,

            priority_state:
                firstDefined(
                    packageInput.priority_state,
                    packageInput.priority
                ),

            longitudinal:
                hasObject(
                    packageInput.longitudinal
                )
                    ? packageInput.longitudinal
                    : null,

            explainability_reference:
                firstDefined(
                    packageInput.explainability_reference,
                    packageInput.explainability_receipt_id
                ),

            raw:
                packageInput
        };
    }


    //----------------------------------------------------------------------
    // Subject Identity Validation
    //----------------------------------------------------------------------

    function hasAthleteIdentity(model) {
        return Boolean(
            model &&
            model.athlete_id &&
            model.snapshot_id
        );
    }


    function hasProgramIdentity(model) {
        return Boolean(
            model &&
            (
                model.program_id ||
                model.organization_id
            )
        );
    }


    function hasProgramIntelligenceAuthority(model) {
        return Boolean(
            model &&
            model.program_intelligence_id &&
            model.intelligence_receipt_id
        );
    }


    //----------------------------------------------------------------------
    // Governed Structure Validation
    //----------------------------------------------------------------------

    function hasGovernedStructure(model) {
        if (!model) {
            return false;
        }

        if (
            model.subject_type ===
            SUBJECT_TYPES.PROGRAM
        ) {
            return Boolean(
                hasObject(model.domains) ||
                model.health_score !== null ||
                model.health_state ||
                hasObject(model.report_card)
            );
        }

        return Boolean(
            hasObject(model.domains) ||
            hasObject(model.composite) ||
            hasObject(model.report_card)
        );
    }


    function isExplicitlyUnofficial(model) {
        if (!model) {
            return false;
        }

        const status =
            upper(
                model.publication_status
            );

        return (
            status === "UNOFFICIAL" ||
            status === "INVALID" ||
            status === "REJECTED"
        );
    }


    //----------------------------------------------------------------------
    // Subject-Specific Domain Registry
    //----------------------------------------------------------------------

    function getDomainKeysForModel(model) {
        if (
            model?.subject_type ===
            SUBJECT_TYPES.PROGRAM
        ) {
            return PROGRAM_DOMAIN_KEYS;
        }

        return ATHLETE_DOMAIN_KEYS;
    }


    //----------------------------------------------------------------------
    // Authority Lineage
    //----------------------------------------------------------------------

    function normalizeLineageEntry(
        entry,
        fallbackDomain = null
    ) {
        if (!hasObject(entry)) {
            return null;
        }

        return {
            domain:
                firstDefined(
                    entry.domain,
                    fallbackDomain
                ),

            authority:
                firstDefined(
                    entry.authority,
                    entry.intelligence_authority,
                    entry.authority_key,
                    entry.engine,
                    entry.publisher
                ),

            authority_version:
                firstDefined(
                    entry.authority_version,
                    entry.engine_version,
                    entry.version
                ),

            matrix_key:
                firstDefined(
                    entry.matrix_key,
                    entry.matrix_id,
                    entry.matrix_code
                ),

            matrix_version:
                firstDefined(
                    entry.matrix_version,
                    entry.version
                ),

            doctrine_version:
                entry.doctrine_version ||
                null,

            source_generated_at:
                firstDefined(
                    entry.source_generated_at,
                    entry.generated_at,
                    entry.effective_at
                ),

            intelligence_receipt_id:
                firstDefined(
                    entry.intelligence_receipt_id,
                    entry.receipt_id
                )
        };
    }


    function getDomainLineage(
        domainKey,
        domain
    ) {
        const entries = [];

        if (!domain) {
            return entries;
        }

        const direct =
            normalizeLineageEntry(
                domain,
                domainKey
            );

        if (
            direct &&
            (
                direct.authority ||
                direct.matrix_key ||
                direct.matrix_version ||
                direct.intelligence_receipt_id
            )
        ) {
            entries.push(direct);
        }


        safeArray(
            domain.authority_lineage
        )
            .forEach(entry => {
                const normalized =
                    normalizeLineageEntry(
                        entry,
                        domainKey
                    );

                if (normalized) {
                    entries.push(
                        normalized
                    );
                }
            });

        return entries;
    }


    function collectAuthorityLineage(model) {
        const lineage = [];

        safeArray(
            model?.authority_lineage
        )
            .forEach(entry => {
                const normalized =
                    normalizeLineageEntry(
                        entry
                    );

                if (normalized) {
                    lineage.push(
                        normalized
                    );
                }
            });


        getDomainKeysForModel(model)
            .forEach(domainKey => {
                const domain =
                    model?.domains?.[domainKey];

                getDomainLineage(
                    domainKey,
                    domain
                )
                    .forEach(entry => {
                        lineage.push(
                            entry
                        );
                    });
            });


        if (model?.composite) {
            const compositeLineage =
                normalizeLineageEntry(
                    model.composite,
                    "composite"
                );

            if (compositeLineage) {
                lineage.push(
                    compositeLineage
                );
            }
        }


        if (
            model?.subject_type ===
            SUBJECT_TYPES.PROGRAM
        ) {
            lineage.push({
                domain:
                    "program_health",

                authority:
                    model.publisher ||
                    "Stream 9 — Enterprise Intelligence Authority",

                authority_version:
                    model.intelligence_version ||
                    null,

                matrix_key:
                    null,

                matrix_version:
                    null,

                doctrine_version:
                    model.doctrine_version ||
                    null,

                source_generated_at:
                    model.generated_at ||
                    null,

                intelligence_receipt_id:
                    model.intelligence_receipt_id ||
                    null
            });
        }

        return lineage;
    }


    //----------------------------------------------------------------------
    // Domain Contract Helpers
    //----------------------------------------------------------------------

    function getDomain(
        model,
        domainKey
    ) {
        const domain =
            model?.domains?.[domainKey];

        return hasObject(domain)
            ? domain
            : null;
    }


    function getDomainStatus(domain) {
        if (!domain) {
            return STATUS.DOMAIN_UNAVAILABLE;
        }

        return (
            firstDefined(
                domain.status,
                domain.state,
                domain.score_status,
                domain.official_status,
                domain.publication_status
            ) ||
            "AVAILABLE"
        );
    }


    function getDomainScore(domain) {
        if (!domain) {
            return null;
        }

        return firstDefined(
            domain.score,
            domain.domain_score
        );
    }


    function getDomainConfidence(domain) {
        if (!domain) {
            return null;
        }

        return firstDefined(
            domain.confidence,
            domain.confidence_score,
            domain.confidence_level
        );
    }


    function getDomainEvidence(domain) {
        if (!domain) {
            return [];
        }

        return uniqueArray(
            firstDefined(
                domain.evidence_used,
                domain.evidence_references,
                domain.evidence_receipt_ids,
                domain.evidence
            ) || []
        );
    }


    function getMissingEvidence(domain) {
        if (!domain) {
            return [];
        }

        return uniqueArray(
            firstDefined(
                domain.missing_evidence,
                domain.evidence_missing
            ) || []
        );
    }


    function getDomainFlags(domain) {
        if (!domain) {
            return [];
        }

        return uniqueArray(
            firstDefined(
                domain.flags,
                domain.risk_flags
            ) || []
        );
    }


    function getDomainExplanation(domain) {
        if (!domain) {
            return null;
        }

        return firstDefined(
            domain.explanation,
            domain.explainability,
            domain.why_this_signal,
            domain.why
        );
    }


    function getDomainRecommendations(domain) {
        if (!domain) {
            return [];
        }

        return uniqueArray(
            firstDefined(
                domain.recommended_actions,
                domain.recommendations,
                domain.next_actions
            ) || []
        );
    }


    //----------------------------------------------------------------------
    // Availability vs Risk Separation
    //----------------------------------------------------------------------

    function buildAvailabilityFlag(
        domainKey,
        reason,
        subjectType
    ) {
        return {
            type:
                "EXPLAINABILITY_AVAILABILITY_FLAG",

            subject_type:
                subjectType,

            domain:
                domainKey,

            status:
                "UNAVAILABLE",

            reason:
                reason ||
                `${domainKey} intelligence is unavailable.`,

            performance_inference:
                false,

            program_health_inference:
                false
        };
    }


    function collectAvailabilityFlags(model) {
        const flags = [];

        getDomainKeysForModel(model)
            .forEach(domainKey => {
                const domain =
                    getDomain(
                        model,
                        domainKey
                    );

                if (!domain) {
                    flags.push(
                        buildAvailabilityFlag(
                            domainKey,
                            `${domainKey} domain intelligence was not supplied by the governed intelligence package.`,
                            model.subject_type
                        )
                    );

                    return;
                }

                const status =
                    upper(
                        getDomainStatus(
                            domain
                        )
                    );

                if (
                    status === "UNAVAILABLE" ||
                    status === "NOT_RUN" ||
                    status === "MISSING" ||
                    status ===
                        "INSUFFICIENT_EVIDENCE" ||
                    status === "NOT_MEASURED"
                ) {
                    flags.push(
                        buildAvailabilityFlag(
                            domainKey,
                            domain.message ||
                            domain.explanation ||
                            `${domainKey} intelligence is not currently available.`,
                            model.subject_type
                        )
                    );
                }
            });

        return flags;
    }


    function collectDomainRiskFlags(model) {
        const risks = [];

        getDomainKeysForModel(model)
            .forEach(domainKey => {
                const domain =
                    getDomain(
                        model,
                        domainKey
                    );

                getDomainFlags(domain)
                    .forEach(flag => {
                        risks.push({
                            type:
                                "DOMAIN_RISK_FLAG",

                            subject_type:
                                model.subject_type,

                            domain:
                                domainKey,

                            flag:
                                clone(flag),

                            authority_preserved:
                                true
                        });
                    });
            });

        return risks;
    }


    function collectConfidenceLimiters(model) {
        const limiters = [];

        getDomainKeysForModel(model)
            .forEach(domainKey => {
                const domain =
                    getDomain(
                        model,
                        domainKey
                    );

                if (!domain) {
                    return;
                }

                safeArray(
                    domain.confidence_limiters
                )
                    .forEach(limiter => {
                        limiters.push({
                            subject_type:
                                model.subject_type,

                            domain:
                                domainKey,

                            limiter:
                                clone(
                                    limiter
                                )
                        });
                    });


                getMissingEvidence(domain)
                    .forEach(item => {
                        limiters.push({
                            subject_type:
                                model.subject_type,

                            domain:
                                domainKey,

                            limiter: {
                                type:
                                    "MISSING_EVIDENCE",

                                evidence:
                                    clone(item)
                            }
                        });
                    });
            });


        if (
            model.subject_type ===
                SUBJECT_TYPES.PROGRAM &&
            hasObject(
                model.evidence_sufficiency
            )
        ) {
            limiters.push({
                subject_type:
                    SUBJECT_TYPES.PROGRAM,

                domain:
                    "program_health",

                limiter: {
                    type:
                        "EVIDENCE_SUFFICIENCY",

                    evidence_sufficiency:
                        clone(
                            model.evidence_sufficiency
                        )
                }
            });
        }

        return limiters;
    }


    //----------------------------------------------------------------------
    // Audience Language
    //----------------------------------------------------------------------

    function audienceLead(
        audience,
        domainLabel,
        subjectType
    ) {
        if (
            subjectType ===
            SUBJECT_TYPES.PROGRAM
        ) {
            switch (audience) {
                case AUDIENCES.PROGRAM:
                    return `This explains the governed ${domainLabel} intelligence currently available for this program.`;

                case AUDIENCES.ADMIN:
                    return `This summarizes governed ${domainLabel} intelligence and authority lineage for program-level administrative review.`;

                case AUDIENCES.COACH:
                    return `This summarizes the governed ${domainLabel} intelligence available for authorized program coaching review.`;

                case AUDIENCES.COUNSELOR:
                    return `This summarizes the governed ${domainLabel} intelligence available for authorized program academic and pathway review.`;

                case AUDIENCES.RECRUITER:
                    return `This summarizes the governed ${domainLabel} intelligence lawfully available for authorized recruiting review.`;

                case AUDIENCES.EVALUATOR:
                    return `This summarizes the governed ${domainLabel} evidence, confidence, and authority state for authorized program evaluation review.`;

                case AUDIENCES.TRAINER:
                    return `This summarizes the governed ${domainLabel} intelligence available for authorized program development review.`;

                default:
                    return `This explains the governed ${domainLabel} intelligence currently available for this program.`;
            }
        }


        switch (audience) {
            case AUDIENCES.PARENT:
                return `This explains the governed ${domainLabel} information currently available for the athlete.`;

            case AUDIENCES.COACH:
                return `This summarizes the governed ${domainLabel} intelligence available for coaching review.`;

            case AUDIENCES.COUNSELOR:
                return `This summarizes the governed ${domainLabel} intelligence relevant to academic and pathway review.`;

            case AUDIENCES.RECRUITER:
                return `This summarizes the governed ${domainLabel} intelligence available for recruiting evaluation.`;

            case AUDIENCES.EVALUATOR:
                return `This summarizes the governed ${domainLabel} evidence, confidence, and authority state.`;

            case AUDIENCES.TRAINER:
                return `This summarizes the governed ${domainLabel} intelligence available for development review.`;

            case AUDIENCES.PROGRAM:
                return `This summarizes the governed ${domainLabel} intelligence available for program-level review.`;

            case AUDIENCES.ADMIN:
                return `This summarizes the governed ${domainLabel} intelligence and its authority lineage.`;

            case AUDIENCES.ATHLETE:
            default:
                return `This explains your current governed ${domainLabel} information.`;
        }
    }


    //----------------------------------------------------------------------
    // Generic Domain Explanation
    //----------------------------------------------------------------------

    function explainDomain(
        model,
        domainKey,
        audience
    ) {
        const domain =
            getDomain(
                model,
                domainKey
            );

        const domainLabel =
            domainKey
                .replace(/_/g, " ")
                .replace(
                    /\b\w/g,
                    char =>
                        char.toUpperCase()
                );


        if (!domain) {
            return {
                subject_type:
                    model.subject_type,

                domain:
                    domainKey,

                label:
                    `${domainLabel} Explanation`,

                status:
                    STATUS.DOMAIN_UNAVAILABLE,

                score:
                    null,

                confidence:
                    null,

                summary:
                    `${domainLabel} intelligence is not available in the governed intelligence package.`,

                evidence_used:
                    [],

                missing_evidence:
                    [],

                flags:
                    [],

                recommendations:
                    [],

                explanation:
                    null,

                authority_lineage:
                    [],

                performance_inference:
                    false,

                program_health_inference:
                    false
            };
        }


        return {
            subject_type:
                model.subject_type,

            domain:
                domainKey,

            label:
                `${domainLabel} Explanation`,

            status:
                getDomainStatus(
                    domain
                ),

            score:
                clone(
                    getDomainScore(
                        domain
                    )
                ),

            confidence:
                clone(
                    getDomainConfidence(
                        domain
                    )
                ),

            summary:
                audienceLead(
                    audience,
                    domainLabel,
                    model.subject_type
                ),

            evidence_used:
                clone(
                    getDomainEvidence(
                        domain
                    )
                ),

            missing_evidence:
                clone(
                    getMissingEvidence(
                        domain
                    )
                ),

            flags:
                clone(
                    getDomainFlags(
                        domain
                    )
                ),

            recommendations:
                clone(
                    getDomainRecommendations(
                        domain
                    )
                ),

            explanation:
                clone(
                    getDomainExplanation(
                        domain
                    )
                ),

            authority_lineage:
                getDomainLineage(
                    domainKey,
                    domain
                ),

            source_status:
                getDomainStatus(
                    domain
                ),

            performance_inference:
                false,

            program_health_inference:
                false
        };
    }


    //----------------------------------------------------------------------
    // Composite Explanation — Athlete Only
    //----------------------------------------------------------------------

    function explainComposite(
        model,
        audience
    ) {
        if (
            model.subject_type ===
            SUBJECT_TYPES.PROGRAM
        ) {
            return {
                subject_type:
                    SUBJECT_TYPES.PROGRAM,

                domain:
                    "composite",

                label:
                    "Composite Intelligence Explanation",

                status:
                    STATUS.DOMAIN_UNAVAILABLE,

                score:
                    null,

                confidence:
                    null,

                summary:
                    "Athlete composite intelligence is not applicable to Program Health explainability.",

                calculated_here:
                    false
            };
        }


        const composite =
            model?.composite;


        if (!composite) {
            return {
                subject_type:
                    SUBJECT_TYPES.ATHLETE,

                domain:
                    "composite",

                label:
                    "Composite Intelligence Explanation",

                status:
                    STATUS.COMPOSITE_PENDING,

                score:
                    null,

                confidence:
                    null,

                summary:
                    "Official composite intelligence has not been supplied by Composite Authority.",

                evidence_used:
                    [],

                missing_evidence:
                    [],

                flags:
                    [],

                recommendations:
                    [],

                explanation:
                    null,

                authority_lineage:
                    [],

                calculated_here:
                    false
            };
        }


        const status =
            firstDefined(
                composite.status,
                composite.composite_status,
                composite.publication_status
            ) ||
            STATUS.COMPOSITE_PENDING;


        return {
            subject_type:
                SUBJECT_TYPES.ATHLETE,

            domain:
                "composite",

            label:
                "Composite Intelligence Explanation",

            status,

            score:
                clone(
                    firstDefined(
                        composite.score,
                        composite.composite_score,
                        composite.value
                    )
                ),

            confidence:
                clone(
                    firstDefined(
                        composite.confidence,
                        composite.confidence_score
                    )
                ),

            summary:
                audienceLead(
                    audience,
                    "composite intelligence",
                    SUBJECT_TYPES.ATHLETE
                ),

            evidence_used:
                clone(
                    safeArray(
                        composite.evidence_used
                    )
                ),

            missing_evidence:
                clone(
                    safeArray(
                        composite.missing_evidence
                    )
                ),

            flags:
                clone(
                    safeArray(
                        composite.flags ||
                        composite.risk_flags
                    )
                ),

            recommendations:
                clone(
                    safeArray(
                        composite.recommended_actions
                    )
                ),

            explanation:
                clone(
                    firstDefined(
                        composite.explanation,
                        composite.why_this_signal,
                        composite.why
                    )
                ),

            authority_lineage:
                [
                    normalizeLineageEntry(
                        composite,
                        "composite"
                    )
                ].filter(Boolean),

            calculated_here:
                false
        };
    }


    //----------------------------------------------------------------------
    // Program Health Explanation
    //----------------------------------------------------------------------

    function explainProgramHealth(
        model,
        audience
    ) {
        if (
            !model ||
            model.subject_type !==
                SUBJECT_TYPES.PROGRAM
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.EXPLANATION_BLOCKED,

                message:
                    "A governed Program Health intelligence package is required.",

                generated_at:
                    nowISO()
            };
        }


        if (
            !hasProgramIdentity(model)
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.SUBJECT_IDENTITY_REQUIRED,

                message:
                    "program_id or organization_id is required for Program Health explainability.",

                generated_at:
                    nowISO()
            };
        }


        if (
            !model.program_intelligence_id
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.PROGRAM_INTELLIGENCE_ID_REQUIRED,

                message:
                    "program_intelligence_id is required. Explainability will not reconstruct Program Health authority.",

                generated_at:
                    nowISO()
            };
        }


        if (
            !model.intelligence_receipt_id
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.PROGRAM_INTELLIGENCE_RECEIPT_REQUIRED,

                message:
                    "intelligence_receipt_id is required. Program Health explainability must trace to governed intelligence.",

                generated_at:
                    nowISO()
            };
        }


        const explanations = {};


        PROGRAM_DOMAIN_KEYS
            .forEach(domainKey => {
                explanations[domainKey] =
                    explainDomain(
                        model,
                        domainKey,
                        audience
                    );
            });


        const availableDomains =
            PROGRAM_DOMAIN_KEYS.filter(
                domainKey =>
                    explanations[domainKey].status !==
                        STATUS.DOMAIN_UNAVAILABLE
            );


        return {
            ok:
                true,

            subject_type:
                SUBJECT_TYPES.PROGRAM,

            domain:
                "program_health",

            label:
                "Program Health Explanation",

            status:
                availableDomains.length ===
                    PROGRAM_DOMAIN_KEYS.length
                    ? STATUS.EXPLAINED
                    : STATUS.PARTIAL_EXPLANATION,

            program_id:
                model.program_id,

            organization_id:
                model.organization_id,

            program_name:
                model.program_name,

            program_intelligence_id:
                model.program_intelligence_id,

            intelligence_receipt_id:
                model.intelligence_receipt_id,

            intelligence_version:
                model.intelligence_version,

            intelligence_authority:
                model.publisher,

            health_score:
                clone(
                    model.health_score
                ),

            health_state:
                clone(
                    model.health_state
                ),

            confidence:
                clone(
                    model.confidence
                ),

            evidence_sufficiency:
                clone(
                    model.evidence_sufficiency
                ),

            priority_state:
                clone(
                    model.priority_state
                ),

            longitudinal:
                clone(
                    model.longitudinal
                ),

            explanations,

            availability_flags:
                collectAvailabilityFlags(
                    model
                ),

            risk_flags:
                collectDomainRiskFlags(
                    model
                ),

            confidence_limiters:
                collectConfidenceLimiters(
                    model
                ),

            recommended_actions:
                collectGovernedRecommendations(
                    model
                ),

            next_best_action:
                getGovernedNextBestAction(
                    model
                ),

            authority_lineage:
                collectAuthorityLineage(
                    model
                ),

            summary:
                buildProgramHumanSummary(
                    model,
                    explanations
                ),

            constitutional_guards: {
                calculates_program_health:
                    false,

                recalculates_program_health:
                    false,

                calculates_domain_scores:
                    false,

                calculates_confidence:
                    false,

                creates_recommendations:
                    false,

                prioritizes_recommendations:
                    false,

                creates_rankings:
                    false,

                authorizes_publication:
                    false,

                manufactures_missing_intelligence:
                    false,

                missing_data_equals_program_failure:
                    false,

                presentation_only_transformation:
                    true
            },

            generated_at:
                nowISO(),

            locked:
                true
        };
    }


    //----------------------------------------------------------------------
    // Recommendations
    //----------------------------------------------------------------------

    function normalizeRecommendationEntry(entry) {
        if (typeof entry === "string") {
            return {
                action:
                    entry,

                priority:
                    null,

                reason:
                    null,

                authority:
                    null
            };
        }

        if (!hasObject(entry)) {
            return null;
        }

        return {
            recommendation_id:
                firstDefined(
                    entry.recommendation_id,
                    entry.id
                ),

            action:
                firstDefined(
                    entry.action,
                    entry.recommendation,
                    entry.label
                ),

            priority:
                entry.priority ??
                null,

            reason:
                entry.reason ??
                null,

            authority:
                firstDefined(
                    entry.authority,
                    entry.authority_key,
                    entry.engine
                ),

            authority_version:
                firstDefined(
                    entry.authority_version,
                    entry.engine_version,
                    entry.version
                ),

            domain:
                entry.domain ??
                null
        };
    }


    function collectGovernedRecommendations(model) {
        const recommendations = [];

        const root =
            model?.recommendations;


        if (Array.isArray(root)) {
            root.forEach(entry => {
                const normalized =
                    normalizeRecommendationEntry(
                        entry
                    );

                if (normalized) {
                    recommendations.push(
                        normalized
                    );
                }
            });
        }


        if (
            hasObject(root) &&
            Array.isArray(
                root.actions
            )
        ) {
            root.actions
                .forEach(entry => {
                    const normalized =
                        normalizeRecommendationEntry(
                            entry
                        );

                    if (normalized) {
                        recommendations.push(
                            normalized
                        );
                    }
                });
        }


        getDomainKeysForModel(model)
            .forEach(domainKey => {
                const domain =
                    getDomain(
                        model,
                        domainKey
                    );

                getDomainRecommendations(domain)
                    .forEach(entry => {
                        const normalized =
                            normalizeRecommendationEntry(
                                entry
                            );

                        if (!normalized) {
                            return;
                        }

                        if (!normalized.domain) {
                            normalized.domain =
                                domainKey;
                        }

                        recommendations.push(
                            normalized
                        );
                    });
            });

        return recommendations;
    }


    function getGovernedNextBestAction(model) {
        const root =
            model?.recommendations;


        if (hasObject(root)) {
            const next =
                firstDefined(
                    root.next_best_action,
                    root.next_action
                );

            if (next) {
                return clone(next);
            }
        }


        const reportCardNext =
            firstDefined(
                model?.report_card?.next_best_action,
                model?.report_card?.next_action
            );

        return reportCardNext
            ? clone(
                reportCardNext
            )
            : null;
    }


    //----------------------------------------------------------------------
    // Human Summaries
    //----------------------------------------------------------------------

    function buildAthleteHumanSummary(
        model,
        audience,
        explanations
    ) {
        const athleteName =
            model.athlete_name ||
            (
                audience ===
                AUDIENCES.ATHLETE
                    ? "You"
                    : "The athlete"
            );


        const availableDomains =
            ATHLETE_DOMAIN_KEYS.filter(
                key =>
                    explanations[key] &&
                    explanations[key].status !==
                        STATUS.DOMAIN_UNAVAILABLE
            );


        const compositeStatus =
            explanations.composite?.status ||
            STATUS.COMPOSITE_PENDING;


        if (
            compositeStatus ===
            STATUS.COMPOSITE_PENDING
        ) {
            return (
                `${athleteName} currently has governed intelligence available across ` +
                `${availableDomains.length} domain(s). ` +
                `Official composite intelligence remains pending Composite Authority.`
            );
        }


        return (
            `${athleteName} has governed Stream 9 intelligence available across ` +
            `${availableDomains.length} domain(s). ` +
            `This explanation preserves the published intelligence and does not recalculate it.`
        );
    }


    function buildProgramHumanSummary(
        model,
        explanations
    ) {
        const programName =
            model.program_name ||
            "The program";


        const availableDomains =
            PROGRAM_DOMAIN_KEYS.filter(
                key =>
                    explanations[key] &&
                    explanations[key].status !==
                        STATUS.DOMAIN_UNAVAILABLE
            );


        const healthState =
            firstDefined(
                model.health_state,
                "PENDING"
            );


        return (
            `${programName} currently has governed Program Health intelligence available across ` +
            `${availableDomains.length} domain(s). ` +
            `The governed Program Health state is ${healthState}. ` +
            `This explanation preserves Stream 9 intelligence and does not recalculate Program Health.`
        );
    }


    //----------------------------------------------------------------------
    // Input Validation
    //----------------------------------------------------------------------

    function validateInput(model) {
        if (!model) {
            return {
                ok:
                    false,

                status:
                    STATUS.INTELLIGENCE_PACKAGE_REQUIRED,

                message:
                    "A governed Stream 9 intelligence package is required."
            };
        }


        if (
            model.subject_type ===
            SUBJECT_TYPES.PROGRAM
        ) {
            if (
                !hasProgramIdentity(model)
            ) {
                return {
                    ok:
                        false,

                    status:
                        STATUS.SUBJECT_IDENTITY_REQUIRED,

                    message:
                        "Program explainability requires program_id or organization_id."
                };
            }


            if (
                !model.program_intelligence_id
            ) {
                return {
                    ok:
                        false,

                    status:
                        STATUS.PROGRAM_INTELLIGENCE_ID_REQUIRED,

                    message:
                        "Program explainability requires program_intelligence_id."
                };
            }


            if (
                !model.intelligence_receipt_id
            ) {
                return {
                    ok:
                        false,

                    status:
                        STATUS.PROGRAM_INTELLIGENCE_RECEIPT_REQUIRED,

                    message:
                        "Program explainability requires intelligence_receipt_id."
                };
            }

        } else if (
            !hasAthleteIdentity(model)
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.SUBJECT_IDENTITY_REQUIRED,

                message:
                    "Athlete explainability requires athlete_id and snapshot_id."
            };
        }


        if (
            !hasGovernedStructure(model)
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.UNOFFICIAL_INPUT_REJECTED,

                message:
                    "Explainability requires normalized governed intelligence. Arbitrary page values are not accepted as official intelligence."
            };
        }


        if (
            isExplicitlyUnofficial(model)
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.UNOFFICIAL_INPUT_REJECTED,

                message:
                    "The supplied intelligence package is explicitly marked unofficial."
            };
        }


        return {
            ok:
                true,

            status:
                "VALID"
        };
    }


    //----------------------------------------------------------------------
    // Main Explainability Operation
    //----------------------------------------------------------------------

    function explain(input = {}) {
        const audience =
            normalizeAudience(
                input.audience
            );


        const model =
            normalizePackage(
                input
            );


        const validation =
            validateInput(
                model
            );


        const doctrine =
            validateDoctrineChain();


        if (!validation.ok) {
            return {
                ok:
                    false,

                engine:
                    ENGINE,

                engine_version:
                    VERSION,

                owner_stream:
                    OWNER_STREAM,

                subject_type:
                    model?.subject_type ||
                    null,

                status:
                    validation.status,

                message:
                    validation.message,

                audience,

                athlete_id:
                    model?.athlete_id ||
                    null,

                snapshot_id:
                    model?.snapshot_id ||
                    null,

                program_id:
                    model?.program_id ||
                    null,

                organization_id:
                    model?.organization_id ||
                    null,

                program_intelligence_id:
                    model?.program_intelligence_id ||
                    null,

                intelligence_receipt_id:
                    model?.intelligence_receipt_id ||
                    null,

                doctrine_validation:
                    doctrine,

                calculated_intelligence:
                    false,

                generated_at:
                    nowISO()
            };
        }


        //--------------------------------------------------------------
        // Program Health Explainability
        //--------------------------------------------------------------

        if (
            model.subject_type ===
            SUBJECT_TYPES.PROGRAM
        ) {
            const result =
                explainProgramHealth(
                    model,
                    audience
                );

            return {
                ...result,

                engine:
                    ENGINE,

                engine_version:
                    VERSION,

                owner_stream:
                    OWNER_STREAM,

                audience,

                doctrine_validation:
                    doctrine
            };
        }


        //--------------------------------------------------------------
        // Athlete Explainability
        //--------------------------------------------------------------

        const explanations = {};


        ATHLETE_DOMAIN_KEYS
            .forEach(domainKey => {
                explanations[domainKey] =
                    explainDomain(
                        model,
                        domainKey,
                        audience
                    );
            });


        explanations.composite =
            explainComposite(
                model,
                audience
            );


        const availabilityFlags =
            collectAvailabilityFlags(
                model
            );


        const riskFlags =
            collectDomainRiskFlags(
                model
            );


        const confidenceLimiters =
            collectConfidenceLimiters(
                model
            );


        const recommendations =
            collectGovernedRecommendations(
                model
            );


        const nextBestAction =
            getGovernedNextBestAction(
                model
            );


        const authorityLineage =
            collectAuthorityLineage(
                model
            );


        const lineageMissing =
            authorityLineage.length ===
            0;


        const availableCount =
            ATHLETE_DOMAIN_KEYS.filter(
                domainKey =>
                    explanations[domainKey].status !==
                        STATUS.DOMAIN_UNAVAILABLE
            ).length;


        let resultStatus =
            STATUS.EXPLAINED;


        if (
            availableCount <
            ATHLETE_DOMAIN_KEYS.length
        ) {
            resultStatus =
                STATUS.PARTIAL_EXPLANATION;
        }


        if (
            lineageMissing &&
            resultStatus ===
                STATUS.EXPLAINED
        ) {
            resultStatus =
                STATUS.AUTHORITY_LINEAGE_MISSING;
        }


        return {
            ok:
                true,

            engine:
                ENGINE,

            engine_version:
                VERSION,

            owner_stream:
                OWNER_STREAM,

            subject_type:
                SUBJECT_TYPES.ATHLETE,

            status:
                resultStatus,

            audience,

            athlete_id:
                model.athlete_id,

            snapshot_id:
                model.snapshot_id,

            intelligence_version:
                model.intelligence_version,

            doctrine_version:
                model.doctrine_version,

            source_generated_at:
                model.generated_at,

            source_publisher:
                model.publisher,

            source_publication_status:
                model.publication_status,

            doctrine_validation:
                doctrine,

            explanations,

            availability_flags:
                availabilityFlags,

            risk_flags:
                riskFlags,

            confidence_limiters:
                confidenceLimiters,

            recommended_actions:
                recommendations,

            next_best_action:
                nextBestAction,

            authority_lineage:
                authorityLineage,

            authority_lineage_complete:
                !lineageMissing,

            report_card:
                clone(
                    model.report_card
                ),

            synthesis:
                clone(
                    model.synthesis
                ),

            summary:
                buildAthleteHumanSummary(
                    model,
                    audience,
                    explanations
                ),

            constitutional_guards: {
                calculates_scores:
                    false,

                recalculates_domain_scores:
                    false,

                calculates_composite:
                    false,

                calculates_program_health:
                    false,

                creates_thresholds:
                    false,

                creates_rankings:
                    false,

                creates_crystal_matches:
                    false,

                creates_recruiting_interest:
                    false,

                creates_offers:
                    false,

                creates_commitments:
                    false,

                creates_pathway_authority:
                    false,

                overrides_confidence:
                    false,

                prioritizes_recommendations:
                    false,

                manufactures_missing_intelligence:
                    false,

                missing_data_equals_negative_performance:
                    false,

                authorizes_publication:
                    false,

                presentation_only_transformation:
                    true
            },

            generated_at:
                nowISO(),

            locked:
                true
        };
    }


    //----------------------------------------------------------------------
    // Focused Domain Explanation
    //----------------------------------------------------------------------

    function explainDomainOnly(
        input = {},
        domainKey
    ) {
        const audience =
            normalizeAudience(
                input.audience
            );


        const model =
            normalizePackage(
                input
            );


        const validation =
            validateInput(
                model
            );


        if (!validation.ok) {
            return {
                ok:
                    false,

                status:
                    validation.status,

                message:
                    validation.message,

                subject_type:
                    model?.subject_type ||
                    null,

                domain:
                    domainKey ||
                    null,

                generated_at:
                    nowISO()
            };
        }


        const normalizedDomain =
            normalize(
                domainKey
            )
                .toLowerCase();


        if (
            normalizedDomain ===
            "program_health"
        ) {
            return explainProgramHealth(
                model,
                audience
            );
        }


        if (
            normalizedDomain ===
            "composite"
        ) {
            return {
                ok:
                    true,

                ...explainComposite(
                    model,
                    audience
                ),

                generated_at:
                    nowISO()
            };
        }


        const domainKeys =
            getDomainKeysForModel(
                model
            );


        if (
            !domainKeys.includes(
                normalizedDomain
            )
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.EXPLANATION_BLOCKED,

                subject_type:
                    model.subject_type,

                domain:
                    normalizedDomain ||
                    null,

                message:
                    "Requested intelligence domain is not registered with this explainability authority for the supplied subject type.",

                generated_at:
                    nowISO()
            };
        }


        return {
            ok:
                true,

            ...explainDomain(
                model,
                normalizedDomain,
                audience
            ),

            generated_at:
                nowISO()
        };
    }


    //----------------------------------------------------------------------
    // Compatibility Accessors
    //----------------------------------------------------------------------

    function explainRanking(input = {}) {
        const model =
            normalizePackage(
                input
            );


        if (!model) {
            return {
                ok:
                    false,

                status:
                    STATUS.INTELLIGENCE_PACKAGE_REQUIRED,

                generated_at:
                    nowISO()
            };
        }


        const ranking =
            model.report_card?.ranking ||
            model.raw?.ranking ||
            null;


        if (!hasObject(ranking)) {
            return {
                ok:
                    false,

                status:
                    STATUS.DOMAIN_UNAVAILABLE,

                domain:
                    "ranking",

                message:
                    "Governed ranking intelligence was not supplied. Explainability will not derive ranking from scores or Program Health.",

                calculated_here:
                    false,

                generated_at:
                    nowISO()
            };
        }


        return {
            ok:
                true,

            domain:
                "ranking",

            status:
                ranking.status ||
                "AVAILABLE",

            ranking:
                clone(
                    ranking
                ),

            explanation:
                clone(
                    ranking.explanation ||
                    ranking.why ||
                    null
                ),

            authority_lineage:
                [
                    normalizeLineageEntry(
                        ranking,
                        "ranking"
                    )
                ].filter(Boolean),

            calculated_here:
                false,

            generated_at:
                nowISO()
        };
    }


    function explainAcademics(input = {}) {
        return explainDomainOnly(
            input,
            "academic"
        );
    }


    function explainPathway(input = {}) {
        return explainDomainOnly(
            input,
            "pathway"
        );
    }


    function explainCrystalMatch(input = {}) {
        return explainDomainOnly(
            input,
            "crystal"
        );
    }


    function explainProgram(input = {}) {
        const normalizedInput = {
            ...input,
            subject_type:
                SUBJECT_TYPES.PROGRAM
        };

        return explain(
            normalizedInput
        );
    }


    function explainRecruitingInterest(input = {}) {
        const model =
            normalizePackage(
                input
            );


        if (!model) {
            return {
                ok:
                    false,

                status:
                    STATUS.INTELLIGENCE_PACKAGE_REQUIRED,

                generated_at:
                    nowISO()
            };
        }


        const recruiting =
            model.raw?.recruiting ||
            model.raw?.recruiting_interest ||
            model.report_card?.recruiting ||
            null;


        if (!hasObject(recruiting)) {
            return {
                ok:
                    false,

                status:
                    STATUS.DOMAIN_UNAVAILABLE,

                domain:
                    "recruiting",

                message:
                    "Governed recruiting-interest intelligence was not supplied. Profile views or exposure will not be converted into recruiting interest.",

                creates_interest:
                    false,

                creates_offer:
                    false,

                creates_commitment:
                    false,

                calculated_here:
                    false,

                generated_at:
                    nowISO()
            };
        }


        return {
            ok:
                true,

            domain:
                "recruiting",

            status:
                recruiting.status ||
                "AVAILABLE",

            recruiting:
                clone(
                    recruiting
                ),

            explanation:
                clone(
                    recruiting.explanation ||
                    recruiting.why ||
                    null
                ),

            authority_lineage:
                [
                    normalizeLineageEntry(
                        recruiting,
                        "recruiting"
                    )
                ].filter(Boolean),

            calculated_here:
                false,

            generated_at:
                nowISO()
        };
    }


    //----------------------------------------------------------------------
    // Public Authority
    //----------------------------------------------------------------------

    const ExplainabilityEngine =
        Object.freeze({

            engine:
                ENGINE,

            version:
                VERSION,

            owner_stream:
                OWNER_STREAM,

            status:
                "ACTIVE",

            classification:
                "SUPPORTING_EXPLAINABILITY_REPORT_CARD_AUTHORITY",

            SUBJECT_TYPES,
            AUDIENCES,

            ATHLETE_DOMAIN_KEYS,
            PROGRAM_DOMAIN_KEYS,

            DOMAIN_KEYS:
                ATHLETE_DOMAIN_KEYS,

            STATUS,


            doctrine: Object.freeze({
                explains_governed_intelligence:
                    true,

                supports_athlete_intelligence:
                    true,

                supports_program_health_intelligence:
                    true,

                calculates_scores:
                    false,

                recalculates_scores:
                    false,

                calculates_program_health:
                    false,

                recalculates_program_health:
                    false,

                calculates_confidence:
                    false,

                creates_thresholds:
                    false,

                creates_rankings:
                    false,

                creates_recommendations:
                    false,

                prioritizes_recommendations:
                    false,

                creates_crystal_matches:
                    false,

                creates_recruiting_interest:
                    false,

                creates_offers:
                    false,

                creates_commitments:
                    false,

                overrides_confidence:
                    false,

                manufactures_missing_intelligence:
                    false,

                missing_authority_allows_reconstruction:
                    false,

                audience_changes_language_not_facts:
                    true,

                authority_lineage_required:
                    true,

                authorizes_publication:
                    false,

                publication_authority:
                    false
            }),


            explain,

            explainDecision:
                explain,

            explainDomain:
                explainDomainOnly,

            explainRanking,

            explainAcademics,

            explainPathway,

            explainCrystalMatch,

            explainRecruitingInterest,

            explainProgram,

            explainProgramHealth:
                explainProgram,

            collectAvailabilityFlags,

            collectDomainRiskFlags,

            collectConfidenceLimiters,

            collectGovernedRecommendations,

            getGovernedNextBestAction,

            collectAuthorityLineage,

            validateStream9Authority,

            validateDoctrineChain,


            getStatus() {
                return {
                    engine:
                        ENGINE,

                    version:
                        VERSION,

                    owner_stream:
                        OWNER_STREAM,

                    status:
                        "ACTIVE",

                    supported_subjects: [
                        SUBJECT_TYPES.ATHLETE,
                        SUBJECT_TYPES.PROGRAM
                    ],

                    stream_9_authority_verified:
                        validateStream9Authority(),

                    doctrine_validation:
                        validateDoctrineChain(),

                    calculates_scores:
                        false,

                    calculates_program_health:
                        false,

                    calculates_composite:
                        false,

                    creates_recommendations:
                        false,

                    creates_rankings:
                        false,

                    creates_crystal_matches:
                        false,

                    creates_recruiting_interest:
                        false,

                    authorizes_publication:
                        false
                };
            }
        });


    //----------------------------------------------------------------------
    // Namespace Publication
    //----------------------------------------------------------------------

    global.STATSCORE_EXPLAINABILITY_ENGINE =
        ExplainabilityEngine;


    global.STATSCORE_EXPLAIN_DECISION =
        function (input) {
            return ExplainabilityEngine.explain(
                input
            );
        };


    global.STATSCORE_EXPLAIN_PROGRAM_HEALTH =
        function (input) {
            return ExplainabilityEngine.explainProgram(
                input
            );
        };


    global.STATScore =
        global.STATScore ||
        {};


    global.STATScore.ExplainabilityEngine =
        ExplainabilityEngine;


    global.STATScore.Explainability =
        ExplainabilityEngine;


    console.info(
        "[STATS-CORE] Explainability Authority loaded:",
        VERSION
    );

})(window); 
