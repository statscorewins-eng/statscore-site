/*!
* =============================================================================
* STATS-CORE™
* Stream 3 — Athlete Workspace Intelligence Presentation Adapter
* -----------------------------------------------------------------------------
* File:
*     statscore-intelligence-explainer-engine.js
*
* Classification:
*     STREAM 3 ATHLETE WORKSPACE EXPLAINABILITY CONSUMER /
*     PRESENTATION ADAPTER
*
* Owner:
*     Stream 3 — Athlete Workspace / Athlete Dashboard Authority
*
* Upstream Intelligence Authority:
*     Stream 9 — Enterprise Intelligence Authority
*
* Canonical Explainability Authority:
*     statscore-explainability-engine.js
*
* Version:
*     STATSCORE-INTELLIGENCE-EXPLAINER-ADAPTER-V2
*
* Status:
*     RECONSTRUCTED — PRESENTATION CONSUMER ONLY
*
* Purpose:
*     Consume governed Stream 9 explainability output and transform it into
*     Athlete Workspace presentation/navigation models.
*
* Constitutional Relationship:
*
*     Stream 9 Domain Authorities
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*              ↓
*     Stream 9 Explainability Authority
*              ↓
*     THIS FILE
*              ↓
*     Athlete Workspace / Dashboard / Intelligence Centers
*
* This file DOES:
*     - consume governed explainability;
*     - preserve athlete_id and snapshot_id;
*     - create Athlete Workspace presentation models;
*     - create navigation metadata;
*     - create card/subject-window presentation structures;
*     - preserve evidence, confidence, flags, recommendations, and lineage
*       exactly as supplied upstream;
*     - provide compatibility wrappers for legacy explain* calls;
*     - fail closed when Stream 9 explainability is unavailable.
*
* This file DOES NOT:
*     - calculate scores;
*     - explain scores independently;
*     - create score breakdowns;
*     - invent evidence;
*     - calculate verification;
*     - calculate confidence;
*     - create risk intelligence;
*     - create opportunities;
*     - create recommendations;
*     - prioritize next actions;
*     - create rankings;
*     - create pathway intelligence;
*     - create recruiting readiness;
*     - create exposure intelligence;
*     - create eligibility intelligence;
*     - override Stream 9 output.
*
* Permanent Rule:
*
*     Stream 9 explains what the intelligence means.
*     Stream 3 determines how that explanation is surfaced and navigated
*     inside the Athlete Workspace.
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-intelligence-explainer-engine";

    const VERSION =
        "STATSCORE-INTELLIGENCE-EXPLAINER-ADAPTER-V2";

    const STREAM_OWNER =
        "STATSCORE_STREAM_3";

    const UPSTREAM_AUTHORITY =
        "STATSCORE_STREAM_9";

    const STATUS = Object.freeze({
        READY:
            "READY",

        PARTIAL:
            "PARTIAL",

        INTELLIGENCE_MODEL_REQUIRED:
            "INTELLIGENCE_MODEL_REQUIRED",

        STREAM_9_EXPLAINABILITY_UNAVAILABLE:
            "STREAM_9_EXPLAINABILITY_UNAVAILABLE",

        EXPLANATION_UNAVAILABLE:
            "EXPLANATION_UNAVAILABLE",

        DOMAIN_UNAVAILABLE:
            "DOMAIN_UNAVAILABLE",

        IDENTITY_MISMATCH:
            "IDENTITY_MISMATCH",

        INVALID_PRESENTATION_REQUEST:
            "INVALID_PRESENTATION_REQUEST"
    });

    const DOMAIN_ROUTE_MAP = Object.freeze({
        athletic: Object.freeze({
            subject_key:
                "ATHLETIC_INTELLIGENCE",

            label:
                "Athletic Intelligence",

            default_route:
                "athletic-snapshot.html"
        }),

        production: Object.freeze({
            subject_key:
                "PRODUCTION_INTELLIGENCE",

            label:
                "Production Intelligence",

            default_route:
                "player-profile.html"
        }),

        academic: Object.freeze({
            subject_key:
                "ACADEMIC_INTELLIGENCE",

            label:
                "Academic Intelligence",

            default_route:
                "academic-intelligence.html"
        }),

        evaluation: Object.freeze({
            subject_key:
                "EVALUATION_INTELLIGENCE",

            label:
                "Evaluation Intelligence",

            default_route:
                "evaluation-intelligence.html"
        }),

        training: Object.freeze({
            subject_key:
                "TRAINING_INTELLIGENCE",

            label:
                "Training Intelligence",

            default_route:
                "training-intelligence.html"
        }),

        competition: Object.freeze({
            subject_key:
                "COMPETITION_INTELLIGENCE",

            label:
                "Competition Intelligence",

            default_route:
                "competition-intelligence.html"
        }),

        verification: Object.freeze({
            subject_key:
                "VERIFICATION_INTELLIGENCE",

            label:
                "Verification Intelligence",

            default_route:
                "verification-intelligence.html"
        }),

        exposure: Object.freeze({
            subject_key:
                "EXPOSURE_INTELLIGENCE",

            label:
                "Exposure Intelligence",

            default_route:
                "exposure-intelligence.html"
        }),

        readiness: Object.freeze({
            subject_key:
                "READINESS_INTELLIGENCE",

            label:
                "Readiness Intelligence",

            default_route:
                "recruiting-readiness.html"
        }),

        pathway: Object.freeze({
            subject_key:
                "PATHWAY_INTELLIGENCE",

            label:
                "Pathway Intelligence",

            default_route:
                "pathway-intelligence.html"
        }),

        crystal: Object.freeze({
            subject_key:
                "CRYSTAL_INTELLIGENCE",

            label:
                "Crystal Intelligence",

            default_route:
                "crystal-intelligence.html"
        }),

        composite: Object.freeze({
            subject_key:
                "COMPOSITE_INTELLIGENCE",

            label:
                "Composite Intelligence",

            default_route:
                "snapshot-report-card.html"
        })
    });

    let lastModel =
        null;

    let lastError =
        null;

    //----------------------------------------------------------------------
    // Utilities
    //----------------------------------------------------------------------

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

    function lower(value) {
        return normalize(value)
            .toLowerCase();
    }

    function safeArray(value) {
        return Array.isArray(value)
            ? value
            : [];
    }

    function safeObject(value) {
        return (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        )
            ? value
            : {};
    }

    function clone(value) {
        if (
            value === undefined
        ) {
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

    //----------------------------------------------------------------------
    // Presentation Context Discovery
    //
    // IMPORTANT:
    // This is not authority identity resolution.
    // It is convenience-only context discovery for Stream 3 presentation.
    //----------------------------------------------------------------------

    function discoverSnapshotId() {
        try {
            const query =
                new URLSearchParams(
                    global.location?.search ||
                    ""
                );

            return (
                query.get("snapshot_id") ||
                global.localStorage?.getItem(
                    "STATSCORE_ACTIVE_SNAPSHOT_ID"
                ) ||
                null
            );
        } catch (_) {
            return null;
        }
    }

    function discoverAthleteId() {
        try {
            return (
                global.localStorage?.getItem(
                    "STATSCORE_ACTIVE_ATHLETE_ID"
                ) ||
                null
            );
        } catch (_) {
            return null;
        }
    }

    //----------------------------------------------------------------------
    // Stream 9 Explainability Authority
    //----------------------------------------------------------------------

    function getExplainabilityAuthority() {
        return (
            global.STATSCORE_EXPLAINABILITY_ENGINE ||
            global.STATScore?.Explainability ||
            global.STATScore?.ExplainabilityEngine ||
            null
        );
    }

    function hasExplainabilityAuthority() {
        const authority =
            getExplainabilityAuthority();

        return Boolean(
            authority &&
            typeof authority.explain ===
                "function"
        );
    }

    //----------------------------------------------------------------------
    // Input Normalization
    //----------------------------------------------------------------------

    function normalizeInput(input = {}) {
        if (
            !input ||
            typeof input !== "object" ||
            Array.isArray(input)
        ) {
            return {};
        }

        return input;
    }

    function extractIntelligencePackage(input) {
        const normalized =
            normalizeInput(input);

        return (
            safeObject(
                normalized.intelligence_package
            ) ||
            safeObject(
                normalized.model
            ) ||
            safeObject(
                normalized.score_model
            ) ||
            normalized
        );
    }

    function validateIdentity(
        requested,
        explained
    ) {
        const requestedAthleteId =
            requested.athlete_id ||
            discoverAthleteId();

        const requestedSnapshotId =
            requested.snapshot_id ||
            discoverSnapshotId();

        const explainedAthleteId =
            explained?.athlete_id ||
            null;

        const explainedSnapshotId =
            explained?.snapshot_id ||
            null;

        const athleteMismatch =
            requestedAthleteId &&
            explainedAthleteId &&
            requestedAthleteId !==
                explainedAthleteId;

        const snapshotMismatch =
            requestedSnapshotId &&
            explainedSnapshotId &&
            requestedSnapshotId !==
                explainedSnapshotId;

        return {
            valid:
                !athleteMismatch &&
                !snapshotMismatch,

            requested_athlete_id:
                requestedAthleteId ||
                null,

            requested_snapshot_id:
                requestedSnapshotId ||
                null,

            explained_athlete_id:
                explainedAthleteId,

            explained_snapshot_id:
                explainedSnapshotId,

            athlete_mismatch:
                Boolean(
                    athleteMismatch
                ),

            snapshot_mismatch:
                Boolean(
                    snapshotMismatch
                )
        };
    }

    //----------------------------------------------------------------------
    // Stream 9 Delegation
    //----------------------------------------------------------------------

    function requestGovernedExplanation(
        input = {},
        audience = "ATHLETE"
    ) {
        const authority =
            getExplainabilityAuthority();

        if (
            !authority ||
            typeof authority.explain !==
                "function"
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.STREAM_9_EXPLAINABILITY_UNAVAILABLE,

                message:
                    "Stream 9 Explainability Authority is unavailable.",

                generated_at:
                    nowISO()
            };
        }

        const packageInput =
            extractIntelligencePackage(
                input
            );

        try {
            return authority.explain({
                intelligence_package:
                    packageInput,

                audience:
                    audience ||
                    "ATHLETE"
            });

        } catch (error) {
            lastError = {
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),

                generated_at:
                    nowISO()
            };

            return {
                ok:
                    false,

                status:
                    STATUS.EXPLANATION_UNAVAILABLE,

                message:
                    "Stream 9 explainability execution failed.",

                error:
                    lastError.message,

                generated_at:
                    nowISO()
            };
        }
    }

    //----------------------------------------------------------------------
    // Workspace Route Model
    //----------------------------------------------------------------------

    function buildRoute(
        domainKey,
        snapshotId,
        athleteId
    ) {
        const config =
            DOMAIN_ROUTE_MAP[
                domainKey
            ] ||
            null;

        if (!config) {
            return null;
        }

        const params =
            new URLSearchParams();

        if (snapshotId) {
            params.set(
                "snapshot_id",
                snapshotId
            );
        }

        if (athleteId) {
            params.set(
                "athlete_id",
                athleteId
            );
        }

        const query =
            params.toString();

        return {
            subject_key:
                config.subject_key,

            label:
                config.label,

            route:
                query
                    ? `${config.default_route}?${query}`
                    : config.default_route,

            route_authority:
                "STREAM_3_PRESENTATION_NAVIGATION",

            intelligence_authority:
                "STREAM_9",

            calculated_here:
                false
        };
    }

    //----------------------------------------------------------------------
    // Card / Subject Window Model
    //----------------------------------------------------------------------

    function buildDomainCard(
        domainKey,
        explanation,
        identity
    ) {
        const config =
            DOMAIN_ROUTE_MAP[
                domainKey
            ] ||
            null;

        if (!config) {
            return null;
        }

        if (!explanation) {
            return {
                domain:
                    domainKey,

                subject_key:
                    config.subject_key,

                label:
                    config.label,

                status:
                    STATUS.DOMAIN_UNAVAILABLE,

                score:
                    null,

                confidence:
                    null,

                summary:
                    "Governed explanation unavailable.",

                evidence_used:
                    [],

                missing_evidence:
                    [],

                flags:
                    [],

                recommendations:
                    [],

                next_action:
                    null,

                authority_lineage:
                    [],

                route:
                    buildRoute(
                        domainKey,
                        identity.snapshot_id,
                        identity.athlete_id
                    )
            };
        }

        return {
            domain:
                domainKey,

            subject_key:
                config.subject_key,

            label:
                config.label,

            status:
                explanation.status ||
                STATUS.READY,

            score:
                clone(
                    explanation.score
                ),

            confidence:
                clone(
                    explanation.confidence
                ),

            summary:
                explanation.summary ||
                null,

            explanation:
                clone(
                    explanation.explanation
                ),

            evidence_used:
                clone(
                    safeArray(
                        explanation.evidence_used
                    )
                ),

            missing_evidence:
                clone(
                    safeArray(
                        explanation.missing_evidence
                    )
                ),

            flags:
                clone(
                    safeArray(
                        explanation.flags
                    )
                ),

            recommendations:
                clone(
                    safeArray(
                        explanation.recommendations
                    )
                ),

            next_action:
                null,

            authority_lineage:
                clone(
                    safeArray(
                        explanation.authority_lineage
                    )
                ),

            source_status:
                explanation.source_status ||
                explanation.status ||
                null,

            calculated_here:
                false,

            route:
                buildRoute(
                    domainKey,
                    identity.snapshot_id,
                    identity.athlete_id
                )
        };
    }

    //----------------------------------------------------------------------
    // Workspace Explainability Model
    //----------------------------------------------------------------------

    function buildWorkspaceModel(
        input = {},
        audience = "ATHLETE"
    ) {
        lastError =
            null;

        const normalized =
            normalizeInput(input);

        const governed =
            requestGovernedExplanation(
                normalized,
                audience
            );

        if (
            !governed?.ok
        ) {
            const failed = {
                ok:
                    false,

                engine_id:
                    ENGINE_ID,

                version:
                    VERSION,

                stream_owner:
                    STREAM_OWNER,

                upstream_authority:
                    UPSTREAM_AUTHORITY,

                status:
                    governed?.status ||
                    STATUS.EXPLANATION_UNAVAILABLE,

                message:
                    governed?.message ||
                    "Governed explainability unavailable.",

                cards:
                    {},

                route_spine: [
                    "Athlete Workspace",
                    "Subject Window",
                    "Stream 9 Explainability",
                    "Evidence",
                    "Next Action"
                ],

                calculated_intelligence:
                    false,

                generated_at:
                    nowISO()
            };

            lastModel =
                failed;

            return failed;
        }

        const identity =
            validateIdentity(
                normalized,
                governed
            );

        if (
            !identity.valid
        ) {
            const mismatch = {
                ok:
                    false,

                engine_id:
                    ENGINE_ID,

                version:
                    VERSION,

                stream_owner:
                    STREAM_OWNER,

                upstream_authority:
                    UPSTREAM_AUTHORITY,

                status:
                    STATUS.IDENTITY_MISMATCH,

                identity,

                message:
                    "Presentation context identity does not match the governed Stream 9 explanation package.",

                cards:
                    {},

                calculated_intelligence:
                    false,

                generated_at:
                    nowISO()
            };

            lastModel =
                mismatch;

            return mismatch;
        }

        const cards =
            {};

        Object.keys(
            DOMAIN_ROUTE_MAP
        ).forEach(
            function (
                domainKey
            ) {
                const explanation =
                    governed
                        .explanations
                        ?.[
                            domainKey
                        ] ||
                    null;

                cards[
                    domainKey
                ] =
                    buildDomainCard(
                        domainKey,
                        explanation,
                        {
                            athlete_id:
                                governed.athlete_id,

                            snapshot_id:
                                governed.snapshot_id
                        }
                    );
            }
        );

        const nextBestAction =
            governed
                .next_best_action ||
            null;

        /*
         * Stream 3 does not choose the next action.
         * It attaches the already-governed action to presentation metadata.
         */

        if (
            nextBestAction &&
            typeof nextBestAction ===
                "object"
        ) {
            const targetDomain =
                lower(
                    nextBestAction.domain
                );

            if (
                cards[
                    targetDomain
                ]
            ) {
                cards[
                    targetDomain
                ].next_action =
                    clone(
                        nextBestAction
                    );
            }
        }

        const availableCards =
            Object.values(
                cards
            ).filter(
                function (
                    card
                ) {
                    return (
                        card &&
                        card.status !==
                        STATUS.DOMAIN_UNAVAILABLE &&
                        card.status !==
                        "DOMAIN_UNAVAILABLE"
                    );
                }
            );

        const model = {
            ok:
                true,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            upstream_authority:
                UPSTREAM_AUTHORITY,

            classification:
                "ATHLETE_WORKSPACE_EXPLAINABILITY_PRESENTATION_ADAPTER",

            page:
                "athlete-dashboard.html",

            audience:
                governed.audience ||
                audience,

            athlete_id:
                governed.athlete_id,

            snapshot_id:
                governed.snapshot_id,

            status:
                availableCards.length > 0
                    ? (
                        governed.status ===
                            "EXPLAINED"
                            ? STATUS.READY
                            : STATUS.PARTIAL
                    )
                    : STATUS.EXPLANATION_UNAVAILABLE,

            route_spine: [
                "Athlete Workspace / Athlete Dashboard",
                "Dashboard Subject Window",
                "Connected Intelligence Page",
                "Stream 9 Explainability",
                "Evidence Layer",
                "Next Action Layer"
            ],

            cards,

            availability_flags:
                clone(
                    safeArray(
                        governed.availability_flags
                    )
                ),

            risk_flags:
                clone(
                    safeArray(
                        governed.risk_flags
                    )
                ),

            confidence_limiters:
                clone(
                    safeArray(
                        governed.confidence_limiters
                    )
                ),

            recommended_actions:
                clone(
                    safeArray(
                        governed.recommended_actions
                    )
                ),

            next_best_action:
                clone(
                    governed.next_best_action
                ),

            authority_lineage:
                clone(
                    safeArray(
                        governed.authority_lineage
                    )
                ),

            report_card:
                clone(
                    governed.report_card
                ),

            synthesis:
                clone(
                    governed.synthesis
                ),

            summary:
                governed.summary ||
                null,

            presentation_contract: {
                stream_3_owns_workspace:
                    true,

                stream_3_owns_navigation:
                    true,

                stream_3_calculates_intelligence:
                    false,

                stream_3_explains_intelligence_independently:
                    false,

                stream_9_owns_intelligence:
                    true,

                stream_9_owns_explainability:
                    true,

                calculated_here:
                    false
            },

            generated_at:
                nowISO()
        };

        lastModel =
            model;

        return model;
    }

    //----------------------------------------------------------------------
    // Domain Wrapper
    //
    // Legacy compatibility only.
    // No local explanation construction.
    //----------------------------------------------------------------------

    function getGovernedDomainExplanation(
        input,
        domainKey,
        audience = "ATHLETE"
    ) {
        const authority =
            getExplainabilityAuthority();

        if (
            !authority
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS.STREAM_9_EXPLAINABILITY_UNAVAILABLE,

                domain:
                    domainKey,

                generated_at:
                    nowISO()
            };
        }

        const packageInput =
            extractIntelligencePackage(
                input
            );

        try {
            if (
                typeof authority
                    .explainDomain ===
                    "function"
            ) {
                return authority.explainDomain(
                    {
                        intelligence_package:
                            packageInput,

                        audience
                    },
                    domainKey
                );
            }

            const complete =
                authority.explain({
                    intelligence_package:
                        packageInput,

                    audience
                });

            if (
                !complete?.ok
            ) {
                return complete;
            }

            return {
                ok:
                    true,

                ...clone(
                    complete
                        .explanations
                        ?.[
                            domainKey
                        ]
                ),

                generated_at:
                    nowISO()
            };

        } catch (error) {
            lastError = {
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),

                generated_at:
                    nowISO()
            };

            return {
                ok:
                    false,

                status:
                    STATUS.EXPLANATION_UNAVAILABLE,

                domain:
                    domainKey,

                error:
                    lastError.message,

                generated_at:
                    nowISO()
            };
        }
    }

    //----------------------------------------------------------------------
    // Legacy Method Compatibility
    //----------------------------------------------------------------------

    function explainAthleticScore(
        input = {},
        context = {}
    ) {
        return getGovernedDomainExplanation(
            context.intelligence_package ||
            input,
            "athletic",
            context.audience ||
            "ATHLETE"
        );
    }

    function explainProductionScore(
        input = {},
        context = {}
    ) {
        return getGovernedDomainExplanation(
            context.intelligence_package ||
            input,
            "production",
            context.audience ||
            "ATHLETE"
        );
    }

    function explainAcademicScore(
        input = {},
        context = {}
    ) {
        return getGovernedDomainExplanation(
            context.intelligence_package ||
            input,
            "academic",
            context.audience ||
            "ATHLETE"
        );
    }

    function explainEligibilityScore(
        input = {},
        context = {}
    ) {
        /*
         * Eligibility is not a standalone active scored domain in the
         * Stream 9 eleven-domain architecture.
         *
         * Compatibility behavior:
         * consume governed Academic explanation and preserve any
         * eligibility context already published there.
         */

        const academic =
            getGovernedDomainExplanation(
                context.intelligence_package ||
                input,
                "academic",
                context.audience ||
                "ATHLETE"
            );

        if (
            !academic?.ok
        ) {
            return academic;
        }

        return {
            ...academic,

            compatibility_layer:
                "ELIGIBILITY_PRESENTATION_FROM_GOVERNED_ACADEMIC_INTELLIGENCE",

            official_eligibility_score:
                false,

            calculated_here:
                false
        };
    }

    function explainExposureSignal(
        input = {},
        context = {}
    ) {
        return getGovernedDomainExplanation(
            context.intelligence_package ||
            input,
            "exposure",
            context.audience ||
            "ATHLETE"
        );
    }

    function explainRecruitingReadiness(
        input = {},
        context = {}
    ) {
        return getGovernedDomainExplanation(
            context.intelligence_package ||
            input,
            "readiness",
            context.audience ||
            "ATHLETE"
        );
    }

    function explainProfileCompleteness(
        input = {},
        context = {}
    ) {
        const model =
            buildWorkspaceModel(
                context.intelligence_package ||
                input,
                context.audience ||
                "ATHLETE"
            );

        if (
            !model?.ok
        ) {
            return model;
        }

        return {
            ok:
                true,

            layer_key:
                "PROFILE_COMPLETENESS",

            label:
                "Profile Completeness",

            status:
                "PRESENTATION_SUPPORT_ONLY",

            operational_completion:
                clone(
                    model.synthesis
                        ?.operational_completion ||
                    null
                ),

            availability_flags:
                clone(
                    model.availability_flags
                ),

            summary:
                "Profile completeness is presented from governed upstream synthesis and availability state. Stream 3 does not calculate athlete ability or official intelligence from profile completion.",

            calculated_here:
                false,

            generated_at:
                nowISO()
        };
    }

    function explainLayer(
        input = {},
        layerKey,
        context = {}
    ) {
        const key =
            String(
                layerKey ||
                ""
            )
                .trim()
                .toUpperCase();

        switch (key) {
            case "ATHLETIC_SCORE":
                return explainAthleticScore(
                    input,
                    context
                );

            case "PRODUCTION_SCORE":
            case "PRODUCTION_INDEX":
                return explainProductionScore(
                    input,
                    context
                );

            case "ACADEMIC_SCORE":
                return explainAcademicScore(
                    input,
                    context
                );

            case "ELIGIBILITY_SCORE":
                return explainEligibilityScore(
                    input,
                    context
                );

            case "EXPOSURE_SIGNAL":
                return explainExposureSignal(
                    input,
                    context
                );

            case "RECRUITING_READINESS":
                return explainRecruitingReadiness(
                    input,
                    context
                );

            case "PROFILE_COMPLETENESS":
                return explainProfileCompleteness(
                    input,
                    context
                );

            default:
                return {
                    ok:
                        false,

                    status:
                        STATUS.EXPLANATION_UNAVAILABLE,

                    layer_key:
                        key ||
                        null,

                    message:
                        "Requested presentation layer does not map to a governed Stream 9 explainability domain.",

                    calculated_here:
                        false,

                    generated_at:
                        nowISO()
                };
        }
    }

    //----------------------------------------------------------------------
    // Dashboard Compatibility
    //----------------------------------------------------------------------

    function getDashboardExplainabilityModel(
        input = {},
        context = {}
    ) {
        const modelInput =
            context.intelligence_package ||
            input;

        return buildWorkspaceModel(
            modelInput,
            context.audience ||
            "ATHLETE"
        );
    }

    //----------------------------------------------------------------------
    // Diagnostics
    //----------------------------------------------------------------------

    function getContract() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            upstream_authority:
                UPSTREAM_AUTHORITY,

            classification:
                "ATHLETE_WORKSPACE_EXPLAINABILITY_PRESENTATION_ADAPTER",

            workspace_rule:
                "The Dashboard is the Workspace.",

            authority_rule:
                "Stream 9 explains what intelligence means; Stream 3 surfaces and navigates that explanation.",

            canonical_input:
                "Governed Stream 9 intelligence package",

            canonical_output:
                "Athlete Workspace presentation/navigation model",

            calculates_scores:
                false,

            calculates_confidence:
                false,

            calculates_verification:
                false,

            creates_risk:
                false,

            creates_recommendations:
                false,

            prioritizes_next_action:
                false,

            invents_evidence:
                false,

            creates_score_breakdown:
                false,

            owns_navigation:
                true,

            owns_workspace_presentation:
                true,

            owns_intelligence:
                false,

            owns_explainability_science:
                false
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            explainability_authority_loaded:
                hasExplainabilityAuthority(),

            local_explanation_generation:
                false,

            local_score_breakdowns:
                false,

            local_evidence_lists:
                false,

            local_risk_generation:
                false,

            local_opportunity_generation:
                false,

            local_recommendation_generation:
                false,

            local_confidence_interpretation:
                false,

            url_snapshot_discovery_is_authority:
                false,

            local_storage_identity_is_authority:
                false,

            identity_match_enforced:
                true
        };
    }

    function getLastModel() {
        return lastModel;
    }

    function getLastError() {
        return lastError;
    }

    function runHealthCheck() {
        const upstreamLoaded =
            hasExplainabilityAuthority();

        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            status:
                upstreamLoaded
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_3_workspace_owner:
                true,

            stream_9_intelligence_owner:
                true,

            stream_9_explainability_loaded:
                upstreamLoaded,

            local_score_calculation:
                false,

            duplicate_explainability_authority:
                false,

            local_confidence_calculation:
                false,

            local_verification_calculation:
                false,

            local_risk_generation:
                false,

            local_recommendation_generation:
                false,

            local_evidence_invention:
                false,

            identity_mismatch_detection:
                true,

            presentation_context_is_authority:
                false,

            generated_at:
                nowISO()
        };
    }

    //----------------------------------------------------------------------
    // Public API
    //----------------------------------------------------------------------

    const IntelligenceExplainerAdapter =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            upstream_authority:
                UPSTREAM_AUTHORITY,

            classification:
                "ATHLETE_WORKSPACE_EXPLAINABILITY_PRESENTATION_ADAPTER",

            status:
                "ACTIVE",

            route_map:
                DOMAIN_ROUTE_MAP,

            statuses:
                STATUS,

            buildWorkspaceModel,

            getDashboardExplainabilityModel,

            explainLayer,

            explainAthleticScore,

            explainProductionScore,

            explainAcademicScore,

            explainEligibilityScore,

            explainExposureSignal,

            explainRecruitingReadiness,

            explainProfileCompleteness,

            getGovernedDomainExplanation,

            getContract,

            getConfiguration,

            getLastModel,

            getLastError,

            runHealthCheck
        });

    //----------------------------------------------------------------------
    // Namespace Publication
    //----------------------------------------------------------------------

    global.STATSCORE_INTELLIGENCE_EXPLAINER_ENGINE =
        IntelligenceExplainerAdapter;

    global.STATScore =
        global.STATScore ||
        {};

    global.STATScore.IntelligenceExplainerAdapter =
        IntelligenceExplainerAdapter;

    console.info(
        "[STATS-CORE] Stream 3 Intelligence Explainer Adapter loaded:",
        VERSION,
        "| Stream 9 explainability consumer | no duplicate intelligence authority"
    );

})(window); 
