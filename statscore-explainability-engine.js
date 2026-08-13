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
*     limitations, flags, and recommendations produced by the
*     governing Stream 9 authorities.
*
* Constitutional Role:
*
*     Registered Domain Authorities
*               ↓
*     Score Authority
*               ↓
*     Composite Authority
*               ↓
*     Governed Intelligence Package
*               ↓
*     Explainability Authority
*               ↓
*     Consumer / Report Card / Presentation
*
* Core Doctrine:
*
*     Explainability may change how governed intelligence is communicated.
*     It may never change what the intelligence is.
*
*     Explainability MUST NOT:
*
*       - calculate an athlete score;
*       - recalculate a domain score;
*       - calculate a composite score;
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
*       - treat arbitrary page values as official intelligence.
*
*     Missing Authority ≠ Permission to Reconstruct Authority.
*
* Version:
*     STATSCORE-EXPLAINABILITY-ENGINE-V2
*
* Status:
*     RECONSTRUCTED — STREAM 9 GOVERNED
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE =
        "statscore-explainability-engine.js";

    const VERSION =
        "STATSCORE-EXPLAINABILITY-ENGINE-V2";

    const OWNER_STREAM =
        "STREAM_9_ENTERPRISE_INTELLIGENCE_AUTHORITY";

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
            "EXPLANATION_BLOCKED"
    });

    const AUDIENCES = Object.freeze({
        ATHLETE: "ATHLETE",
        PARENT: "PARENT",
        COACH: "COACH",
        COUNSELOR: "COUNSELOR",
        RECRUITER: "RECRUITER",
        EVALUATOR: "EVALUATOR",
        TRAINER: "TRAINER",
        PROGRAM: "PROGRAM",
        ADMIN: "ADMIN"
    });

    const DOMAIN_KEYS = Object.freeze([
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

    const OFFICIAL_STATUS_VALUES = Object.freeze([
        "OFFICIAL",
        "PUBLISHED",
        "AUTHORIZED",
        "VALID",
        "SCORED",
        "COMPLETE",
        "PARTIAL",
        "PENDING",
        "INSUFFICIENT_EVIDENCE",
        "UNAVAILABLE",
        "UNVERIFIED",
        "VERIFIED"
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
            ? value.filter(item => item !== null && item !== undefined)
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
            return JSON.parse(JSON.stringify(value));
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
        const audience = upper(value || "ATHLETE");

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
        const authority = getStream9Authority();

        return Boolean(
            authority &&
            authority.stream_number === 9 &&
            authority.operational_state === "ACTIVE"
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

        const domains =
            hasObject(packageInput.domains)
                ? packageInput.domains
                : {};

        return {
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
                packageInput.generated_at || null,

            publisher:
                firstDefined(
                    packageInput.publisher,
                    packageInput.authority,
                    packageInput.authority_key
                ),

            publication_status:
                firstDefined(
                    packageInput.publication_status,
                    packageInput.status
                ),

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
                packageInput.recommendations || null,

            report_card:
                hasObject(packageInput.report_card)
                    ? packageInput.report_card
                    : null,

            authority_lineage:
                safeArray(
                    packageInput.authority_lineage
                ),

            flags:
                safeArray(packageInput.flags),

            raw:
                packageInput
        };
    }

    function hasIdentity(model) {
        return Boolean(
            model &&
            model.athlete_id &&
            model.snapshot_id
        );
    }

    function hasGovernedStructure(model) {
        if (!model) {
            return false;
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
            upper(model.publication_status);

        return (
            status === "UNOFFICIAL" ||
            status === "INVALID" ||
            status === "REJECTED"
        );
    }

    //----------------------------------------------------------------------
    // Authority Lineage
    //----------------------------------------------------------------------

    function normalizeLineageEntry(entry, fallbackDomain = null) {
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
                entry.doctrine_version || null,

            source_generated_at:
                firstDefined(
                    entry.source_generated_at,
                    entry.generated_at
                )
        };
    }

    function getDomainLineage(domainKey, domain) {
        const entries = [];

        if (!domain) {
            return entries;
        }

        const direct = normalizeLineageEntry(
            domain,
            domainKey
        );

        if (
            direct &&
            (
                direct.authority ||
                direct.matrix_key ||
                direct.matrix_version
            )
        ) {
            entries.push(direct);
        }

        safeArray(domain.authority_lineage)
            .forEach(entry => {
                const normalized =
                    normalizeLineageEntry(
                        entry,
                        domainKey
                    );

                if (normalized) {
                    entries.push(normalized);
                }
            });

        return entries;
    }

    function collectAuthorityLineage(model) {
        const lineage = [];

        safeArray(model?.authority_lineage)
            .forEach(entry => {
                const normalized =
                    normalizeLineageEntry(entry);

                if (normalized) {
                    lineage.push(normalized);
                }
            });

        DOMAIN_KEYS.forEach(domainKey => {
            const domain =
                model?.domains?.[domainKey];

            getDomainLineage(
                domainKey,
                domain
            ).forEach(entry => {
                lineage.push(entry);
            });
        });

        if (model?.composite) {
            const compositeLineage =
                normalizeLineageEntry(
                    model.composite,
                    "composite"
                );

            if (compositeLineage) {
                lineage.push(compositeLineage);
            }
        }

        return lineage;
    }

    //----------------------------------------------------------------------
    // Domain Contract Helpers
    //----------------------------------------------------------------------

    function getDomain(model, domainKey) {
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

    function buildAvailabilityFlag(domainKey, reason) {
        return {
            type:
                "EXPLAINABILITY_AVAILABILITY_FLAG",

            domain:
                domainKey,

            status:
                "UNAVAILABLE",

            reason:
                reason ||
                `${domainKey} intelligence is unavailable.`,

            performance_inference:
                false
        };
    }

    function collectAvailabilityFlags(model) {
        const flags = [];

        DOMAIN_KEYS.forEach(domainKey => {
            const domain =
                getDomain(model, domainKey);

            if (!domain) {
                flags.push(
                    buildAvailabilityFlag(
                        domainKey,
                        `${domainKey} domain intelligence was not supplied by the governed intelligence package.`
                    )
                );

                return;
            }

            const status =
                upper(getDomainStatus(domain));

            if (
                status === "UNAVAILABLE" ||
                status === "NOT_RUN" ||
                status === "MISSING" ||
                status === "INSUFFICIENT_EVIDENCE"
            ) {
                flags.push(
                    buildAvailabilityFlag(
                        domainKey,
                        domain.message ||
                        domain.explanation ||
                        `${domainKey} intelligence is not currently available.`
                    )
                );
            }
        });

        return flags;
    }

    function collectDomainRiskFlags(model) {
        const risks = [];

        DOMAIN_KEYS.forEach(domainKey => {
            const domain =
                getDomain(model, domainKey);

            getDomainFlags(domain)
                .forEach(flag => {
                    risks.push({
                        type:
                            "DOMAIN_RISK_FLAG",

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

        DOMAIN_KEYS.forEach(domainKey => {
            const domain =
                getDomain(model, domainKey);

            if (!domain) {
                return;
            }

            safeArray(domain.confidence_limiters)
                .forEach(limiter => {
                    limiters.push({
                        domain:
                            domainKey,

                        limiter:
                            clone(limiter)
                    });
                });

            getMissingEvidence(domain)
                .forEach(item => {
                    limiters.push({
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

        return limiters;
    }

    //----------------------------------------------------------------------
    // Audience Language
    //----------------------------------------------------------------------

    function audienceLead(audience, domainLabel) {
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
            getDomain(model, domainKey);

        const domainLabel =
            domainKey
                .replace(/_/g, " ")
                .replace(/\b\w/g, char =>
                    char.toUpperCase()
                );

        if (!domain) {
            return {
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
                    false
            };
        }

        return {
            domain:
                domainKey,

            label:
                `${domainLabel} Explanation`,

            status:
                getDomainStatus(domain),

            score:
                clone(
                    getDomainScore(domain)
                ),

            confidence:
                clone(
                    getDomainConfidence(domain)
                ),

            summary:
                audienceLead(
                    audience,
                    domainLabel
                ),

            evidence_used:
                clone(
                    getDomainEvidence(domain)
                ),

            missing_evidence:
                clone(
                    getMissingEvidence(domain)
                ),

            flags:
                clone(
                    getDomainFlags(domain)
                ),

            recommendations:
                clone(
                    getDomainRecommendations(domain)
                ),

            explanation:
                clone(
                    getDomainExplanation(domain)
                ),

            authority_lineage:
                getDomainLineage(
                    domainKey,
                    domain
                ),

            source_status:
                getDomainStatus(domain),

            performance_inference:
                false
        };
    }

    //----------------------------------------------------------------------
    // Composite Explanation
    //----------------------------------------------------------------------

    function explainComposite(model, audience) {
        const composite =
            model?.composite;

        if (!composite) {
            return {
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
                    "composite intelligence"
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
            action:
                firstDefined(
                    entry.action,
                    entry.recommendation,
                    entry.label
                ),

            priority:
                entry.priority ?? null,

            reason:
                entry.reason ?? null,

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
                entry.domain ?? null
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
            Array.isArray(root.actions)
        ) {
            root.actions.forEach(entry => {
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

        DOMAIN_KEYS.forEach(domainKey => {
            const domain =
                getDomain(model, domainKey);

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
            ? clone(reportCardNext)
            : null;
    }

    //----------------------------------------------------------------------
    // Human Summary
    //----------------------------------------------------------------------

    function buildHumanSummary(
        model,
        audience,
        explanations
    ) {
        const athleteName =
            model.athlete_name ||
            (
                audience === AUDIENCES.ATHLETE
                    ? "You"
                    : "The athlete"
            );

        const availableDomains =
            DOMAIN_KEYS.filter(
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

    //----------------------------------------------------------------------
    // Input Validation
    //----------------------------------------------------------------------

    function validateInput(model) {
        if (!model) {
            return {
                ok: false,
                status:
                    STATUS.INTELLIGENCE_PACKAGE_REQUIRED,

                message:
                    "A governed Stream 9 intelligence package is required."
            };
        }

        if (!hasIdentity(model)) {
            return {
                ok: false,
                status:
                    STATUS.INTELLIGENCE_PACKAGE_REQUIRED,

                message:
                    "athlete_id and snapshot_id are required for governed explainability."
            };
        }

        if (!hasGovernedStructure(model)) {
            return {
                ok: false,
                status:
                    STATUS.UNOFFICIAL_INPUT_REJECTED,

                message:
                    "Explainability requires normalized governed domain, composite, or report-card intelligence. Arbitrary page values are not accepted as official intelligence."
            };
        }

        if (isExplicitlyUnofficial(model)) {
            return {
                ok: false,
                status:
                    STATUS.UNOFFICIAL_INPUT_REJECTED,

                message:
                    "The supplied intelligence package is explicitly marked unofficial."
            };
        }

        return {
            ok: true,
            status: "VALID"
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
            normalizePackage(input);

        const validation =
            validateInput(model);

        const doctrine =
            validateDoctrineChain();

        if (!validation.ok) {
            return {
                ok: false,

                engine:
                    ENGINE,

                engine_version:
                    VERSION,

                owner_stream:
                    OWNER_STREAM,

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

                doctrine_validation:
                    doctrine,

                calculated_intelligence:
                    false,

                generated_at:
                    nowISO()
            };
        }

        const explanations = {};

        DOMAIN_KEYS.forEach(domainKey => {
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
            collectAvailabilityFlags(model);

        const riskFlags =
            collectDomainRiskFlags(model);

        const confidenceLimiters =
            collectConfidenceLimiters(model);

        const recommendations =
            collectGovernedRecommendations(model);

        const nextBestAction =
            getGovernedNextBestAction(model);

        const authorityLineage =
            collectAuthorityLineage(model);

        const lineageMissing =
            authorityLineage.length === 0;

        const availableCount =
            DOMAIN_KEYS.filter(
                domainKey =>
                    explanations[domainKey].status !==
                        STATUS.DOMAIN_UNAVAILABLE
            ).length;

        let resultStatus =
            STATUS.EXPLAINED;

        if (
            availableCount <
            DOMAIN_KEYS.length
        ) {
            resultStatus =
                STATUS.PARTIAL_EXPLANATION;
        }

        if (
            lineageMissing &&
            resultStatus === STATUS.EXPLAINED
        ) {
            resultStatus =
                STATUS.AUTHORITY_LINEAGE_MISSING;
        }

        return {
            ok: true,

            engine:
                ENGINE,

            engine_version:
                VERSION,

            owner_stream:
                OWNER_STREAM,

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
                clone(model.report_card),

            synthesis:
                clone(model.synthesis),

            summary:
                buildHumanSummary(
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
            normalizePackage(input);

        const validation =
            validateInput(model);

        if (!validation.ok) {
            return {
                ok: false,
                status:
                    validation.status,
                message:
                    validation.message,
                domain:
                    domainKey || null,
                generated_at:
                    nowISO()
            };
        }

        const normalizedDomain =
            normalize(domainKey)
                .toLowerCase();

        if (
            normalizedDomain ===
            "composite"
        ) {
            return {
                ok: true,
                ...explainComposite(
                    model,
                    audience
                ),
                generated_at:
                    nowISO()
            };
        }

        if (
            !DOMAIN_KEYS.includes(
                normalizedDomain
            )
        ) {
            return {
                ok: false,

                status:
                    STATUS.EXPLANATION_BLOCKED,

                domain:
                    normalizedDomain ||
                    null,

                message:
                    "Requested intelligence domain is not registered with this explainability authority.",

                generated_at:
                    nowISO()
            };
        }

        return {
            ok: true,

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
    //
    // These preserve callable names without restoring legacy authority.
    // They explain only governed domain packages.
    //----------------------------------------------------------------------

    function explainRanking(input = {}) {
        /*
         * Ranking is not calculated here.
         *
         * If a governed ranking authority publishes ranking intelligence,
         * it should be supplied through report_card or a governed domain
         * extension. Production score is not automatically converted into
         * ranking authority.
         */

        const model =
            normalizePackage(input);

        if (!model) {
            return {
                ok: false,
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
                ok: false,

                status:
                    STATUS.DOMAIN_UNAVAILABLE,

                domain:
                    "ranking",

                message:
                    "Governed ranking intelligence was not supplied. Explainability will not derive ranking from production or other scores.",

                calculated_here:
                    false,

                generated_at:
                    nowISO()
            };
        }

        return {
            ok: true,

            domain:
                "ranking",

            status:
                ranking.status ||
                "AVAILABLE",

            ranking:
                clone(ranking),

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

    function explainRecruitingInterest(input = {}) {
        const model =
            normalizePackage(input);

        if (!model) {
            return {
                ok: false,
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
                ok: false,

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
            ok: true,

            domain:
                "recruiting",

            status:
                recruiting.status ||
                "AVAILABLE",

            recruiting:
                clone(recruiting),

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

            AUDIENCES,
            DOMAIN_KEYS,
            STATUS,

            doctrine: Object.freeze({
                explains_governed_intelligence:
                    true,

                calculates_scores:
                    false,

                recalculates_scores:
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
                    true
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

                    stream_9_authority_verified:
                        validateStream9Authority(),

                    doctrine_validation:
                        validateDoctrineChain(),

                    calculates_scores:
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

    global.STATScore =
        global.STATScore || {};

    global.STATScore.ExplainabilityEngine =
        ExplainabilityEngine;

    global.STATScore.Explainability =
        ExplainabilityEngine;

    console.info(
        "[STATS-CORE] Explainability Authority loaded:",
        VERSION
    );

})(window); 
