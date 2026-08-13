/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Intelligence Doctrine
* -----------------------------------------------------------------------------
* File:
*     statscore-intelligence-doctrine.js
*
* Classification:
*     CANONICAL STREAM 9 INTELLIGENCE DOCTRINE
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-INTELLIGENCE-DOCTRINE-V2
*
* Doctrine Status:
*     CANON LOCKED
*
* Purpose:
*     Define what official STATS-CORE intelligence is, what it is not,
*     how domain intelligence differs from Composite Intelligence,
*     how confidence, verification, consensus, projection, certification,
*     explainability, Program Health, and consumer behavior are governed.
*
* Core Constitutional Rule:
*
*     STATS-CORE intelligence is official only when it originates from
*     a governed Stream 9 authority, preserves evidence and confidence
*     lineage, remains within its domain contract, and is published
*     through the authorized Stream 9 path.
*
*     Domain Intelligence ≠ Composite Intelligence
*     Projection ≠ Official Score
*     Verification ≠ Performance
*     Consensus ≠ Confidence
*     Certification ≠ Athlete Ability
*     Program Health ≠ Athlete Score
*     Consumer Presentation ≠ Intelligence Authority
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const DOCTRINE_KEY =
        "STATSCORE_INTELLIGENCE_DOCTRINE";

    const VERSION =
        "STATSCORE-INTELLIGENCE-DOCTRINE-V2";

    const STREAM_KEY =
        "STATSCORE_STREAM_9";

    const DOCTRINE_STATUS =
        "CANON_LOCKED";

    const ACTIVE_INTELLIGENCE_DOMAINS =
        Object.freeze([
            "ATHLETIC",
            "PRODUCTION",
            "ACADEMIC",
            "EVALUATION",
            "TRAINING",
            "COMPETITION",
            "VERIFICATION",
            "EXPOSURE",
            "READINESS",
            "PATHWAY",
            "CRYSTAL"
        ]);

    const INACTIVE_INTELLIGENCE_DOMAINS =
        Object.freeze([
            "CHARACTER"
        ]);

    const OFFICIAL_OUTPUT_TYPES =
        Object.freeze({
            DOMAIN_SCORE:
                true,

            DOMAIN_INTELLIGENCE:
                true,

            CONFIDENCE_SIGNAL:
                true,

            RECOMMENDATION_SIGNAL:
                true,

            PATHWAY_SIGNAL:
                true,

            RANKING_SUPPORT_SIGNAL:
                true,

            PROGRAM_FIT_SIGNAL:
                true,

            ORGANIZATIONAL_INTELLIGENCE:
                true,

            COMPOSITE_INTELLIGENCE:
                true,

            REPORT_CARD:
                true
        });

    const PUBLICATION_STATES =
        Object.freeze({
            OFFICIAL:
                "OFFICIAL",

            PROJECTED:
                "PROJECTED",

            PROVISIONAL:
                "PROVISIONAL",

            UNVERIFIED:
                "UNVERIFIED",

            PENDING_VERIFICATION:
                "PENDING_VERIFICATION",

            INSUFFICIENT_EVIDENCE:
                "INSUFFICIENT_EVIDENCE",

            AUTHORITY_UNAVAILABLE:
                "AUTHORITY_UNAVAILABLE",

            UNAUTHORIZED:
                "UNAUTHORIZED",

            BLOCKED:
                "BLOCKED"
        });

    const STATScoreIntelligenceDoctrine =
        Object.freeze({

            doctrine_key:
                DOCTRINE_KEY,

            stream_key:
                STREAM_KEY,

            doctrine_name:
                "STATS-CORE Intelligence Doctrine",

            version:
                VERSION,

            doctrine_status:
                DOCTRINE_STATUS,

            requires_authority:
                "STATScoreStream9Authority",

            requires_score_doctrine:
                "STATScoreScoreDoctrine",

            //------------------------------------------------------------------
            // Intelligence Definition
            //------------------------------------------------------------------

            intelligence_definition:
                "STATS-CORE intelligence is governed interpretation of evidence produced by an authorized Stream 9 domain or intelligence authority, versioned, confidence-aware where applicable, explainable, auditable, and published through the authorized Stream 9 publication path.",

            intelligence_is:
                Object.freeze({

                    evidence_based:
                        true,

                    authority_governed:
                        true,

                    domain_bounded:
                        true,

                    versioned:
                        true,

                    confidence_aware_where_applicable:
                        true,

                    explainable:
                        true,

                    auditable:
                        true,

                    publication_controlled:
                        true,

                    consumer_readable:
                        true
                }),

            intelligence_is_not:
                Object.freeze({

                    raw_data_only:
                        true,

                    dashboard_opinion:
                        true,

                    page_generated_score:
                        true,

                    recruiter_preference_only:
                        true,

                    coach_opinion_only:
                        true,

                    unverified_claim_as_official_truth:
                        true,

                    generic_average:
                        true,

                    hidden_weighting:
                        true,

                    consumer_recalculation:
                        true,

                    arbitrary_projection:
                        true
                }),

            //------------------------------------------------------------------
            // Domain Architecture
            //------------------------------------------------------------------

            active_intelligence_domains:
                ACTIVE_INTELLIGENCE_DOMAINS,

            inactive_intelligence_domains:
                INACTIVE_INTELLIGENCE_DOMAINS,

            domain_rules:
                Object.freeze({

                    character_active:
                        false,

                    every_active_domain_requires_declared_authority:
                        true,

                    every_active_domain_requires_input_contract:
                        true,

                    every_active_domain_requires_output_contract:
                        true,

                    every_active_domain_requires_version:
                        true,

                    every_active_domain_requires_evidence_rules:
                        true,

                    every_active_domain_requires_confidence_behavior:
                        true,

                    every_active_domain_requires_publication_status:
                        true,

                    every_domain_must_be_numeric:
                        false,

                    domain_output_may_be_non_numeric:
                        true
                }),

            //------------------------------------------------------------------
            // Domain vs Composite Doctrine
            //------------------------------------------------------------------

            domain_composite_doctrine:
                Object.freeze({

                    domain_intelligence_may_be_official_before_composite:
                        true,

                    composite_required_for_domain_officiality:
                        false,

                    composite_authority_exclusive_for_composite_publication:
                        true,

                    domain_authority_may_publish_official_domain_output:
                        true,

                    composite_may_not_reconstruct_missing_domain_authority:
                        true,

                    domain_output_may_not_claim_composite_status:
                        true,

                    composite_pending_does_not_invalidate_official_domain_output:
                        true,

                    missing_domain_may_block_composite:
                        true
                }),

            //------------------------------------------------------------------
            // Required Intelligence Components
            //------------------------------------------------------------------

            required_components:
                Object.freeze({

                    athlete_id:
                        true,

                    snapshot_id:
                        true,

                    authority_identity:
                        true,

                    authority_version:
                        true,

                    domain_outputs:
                        true,

                    evidence_inputs_or_references:
                        true,

                    confidence_context_where_applicable:
                        true,

                    explainability:
                        true,

                    generated_at:
                        true,

                    publication_status:
                        true,

                    intelligence_version:
                        true
                }),

            conditional_components:
                Object.freeze({

                    numeric_score:
                        "Required only when the governing authority output contract defines a numeric score.",

                    recommendations:
                        "Required only when the governing authority produces recommendation intelligence.",

                    composite:
                        "Required only when Composite Authority has released a composite result.",

                    program_health:
                        "Required only for organizational intelligence products governed by Program Health authority."
                }),

            //------------------------------------------------------------------
            // Evidence Doctrine
            //------------------------------------------------------------------

            evidence_doctrine:
                Object.freeze({

                    source_record_required:
                        true,

                    snapshot_context_required:
                        true,

                    evidence_provenance_required_for_official_use:
                        true,

                    unverifiable_claims_may_exist:
                        true,

                    unverifiable_claims_must_be_flagged:
                        true,

                    missing_evidence_must_be_declared:
                        true,

                    conflicting_evidence_must_be_flagged:
                        true,

                    stale_evidence_must_be_flagged:
                        true,

                    stale_evidence_must_affect_confidence_not_raw_measurement:
                        true,

                    evidence_value_may_not_be_changed_by_verification_status:
                        true
                }),

            //------------------------------------------------------------------
            // Confidence Doctrine
            //------------------------------------------------------------------

            confidence_doctrine:
                Object.freeze({

                    confidence_is_independent_from_score:
                        true,

                    high_score_low_confidence_allowed:
                        true,

                    low_score_high_confidence_allowed:
                        true,

                    confidence_may_not_be_derived_from_signal_magnitude:
                        true,

                    confidence_may_not_be_replaced_by_verification_status:
                        true,

                    consensus_may_support_confidence:
                        true,

                    consensus_equals_confidence:
                        false,

                    verification_may_support_confidence:
                        true,

                    verification_equals_confidence:
                        false,

                    confidence_must_come_from_governed_contract:
                        true,

                    confidence_may_be_null_when_authority_unavailable:
                        true
                }),

            //------------------------------------------------------------------
            // Verification Doctrine
            //------------------------------------------------------------------

            verification_doctrine:
                Object.freeze({

                    verification_is_provenance_intelligence:
                        true,

                    verification_may_affect_confidence:
                        true,

                    verification_may_affect_publication_eligibility:
                        true,

                    verification_may_not_change_underlying_measurement:
                        true,

                    verification_may_not_increase_athletic_ability:
                        true,

                    verification_may_not_increase_academic_performance:
                        true,

                    verification_may_not_increase_production:
                        true
                }),

            //------------------------------------------------------------------
            // Consensus Doctrine
            //------------------------------------------------------------------

            consensus_doctrine:
                Object.freeze({

                    consensus_measures_alignment:
                        true,

                    consensus_measures_disagreement:
                        true,

                    consensus_measures_volatility:
                        true,

                    consensus_may_detect_conflict:
                        true,

                    consensus_is_not_verification:
                        true,

                    consensus_is_not_certification:
                        true,

                    consensus_is_not_confidence:
                        true,

                    consensus_is_not_domain_score:
                        true,

                    role_label_may_not_create_authority:
                        true,

                    signal_value_may_not_create_confidence:
                        true
                }),

            //------------------------------------------------------------------
            // Projection Doctrine
            //------------------------------------------------------------------

            projection_doctrine:
                Object.freeze({

                    projected_intelligence_allowed:
                        true,

                    projection_must_be_explicit:
                        true,

                    projected_output_must_be_marked_projected:
                        true,

                    projected_output_must_be_marked_provisional_or_unverified_where_applicable:
                        true,

                    projected_output_is_official_score_by_default:
                        false,

                    projected_value_may_not_silently_become_official:
                        true,

                    projected_evidence_may_only_enter_official_scoring_when_receiving_contract_explicitly_authorizes_it:
                        true
                }),

            //------------------------------------------------------------------
            // PHNX Certification Doctrine
            //------------------------------------------------------------------

            certification_doctrine:
                Object.freeze({

                    certification_authority:
                        "STATSCORE_STREAM_10",

                    certification_may_influence_professional_authority:
                        true,

                    certification_may_influence_provenance:
                        true,

                    certification_may_influence_verification:
                        true,

                    certification_may_influence_confidence:
                        true,

                    certification_may_influence_publication_eligibility:
                        true,

                    certification_may_influence_program_health:
                        true,

                    certification_may_not_increase_athletic_score:
                        true,

                    certification_may_not_increase_production_score:
                        true,

                    certification_may_not_increase_academic_score:
                        true,

                    certification_may_not_increase_competition_score:
                        true,

                    certification_may_not_manufacture_athlete_ability:
                        true,

                    certification_id_may_not_replace_professional_id:
                        true
                }),

            //------------------------------------------------------------------
            // Program Health Doctrine
            //------------------------------------------------------------------

            program_health_doctrine:
                Object.freeze({

                    program_health_is_organizational_intelligence:
                        true,

                    program_health_is_not_athlete_score:
                        true,

                    program_health_may_consume_professional_activity:
                        true,

                    program_health_may_consume_certification_standing:
                        true,

                    program_health_may_consume_receipts:
                        true,

                    program_health_may_consume_timeliness:
                        true,

                    program_health_may_consume_completion:
                        true,

                    program_health_may_consume_compliance:
                        true,

                    poor_program_health_may_not_reduce_athlete_ability:
                        true,

                    strong_program_health_may_not_increase_athlete_ability:
                        true,

                    organizational_intelligence_and_athlete_intelligence_must_remain_separate:
                        true
                }),

            //------------------------------------------------------------------
            // Explainability Doctrine
            //------------------------------------------------------------------

            explainability_doctrine:
                Object.freeze({

                    official_intelligence_requires_explainability:
                        true,

                    explanation_must_preserve_authority_lineage:
                        true,

                    explanation_must_preserve_evidence_used:
                        true,

                    explanation_must_preserve_missing_evidence:
                        true,

                    explanation_must_preserve_confidence_context:
                        true,

                    explanation_must_preserve_flags:
                        true,

                    explanation_may_adapt_language_by_audience:
                        true,

                    explanation_may_change_underlying_fact:
                        false,

                    explanation_may_create_threshold:
                        false,

                    explanation_may_create_recommendation:
                        false,

                    explanation_may_recalculate_score:
                        false,

                    explanation_may_reconstruct_missing_domain:
                        false
                }),

            //------------------------------------------------------------------
            // Publication Doctrine
            //------------------------------------------------------------------

            publication_doctrine:
                Object.freeze({

                    official_domain_outputs_must_publish_through_stream_9:
                        true,

                    official_composite_must_publish_through_composite_authority:
                        true,

                    official_organizational_intelligence_must_publish_through_governed_stream_9_authority:
                        true,

                    projected_outputs_must_not_be_mislabeled_official:
                        true,

                    unauthorized_output_status:
                        "UNOFFICIAL",

                    missing_authority_status:
                        "AUTHORITY_UNAVAILABLE",

                    insufficient_evidence_status:
                        "INSUFFICIENT_EVIDENCE",

                    composite_pending_status:
                        "COMPOSITE_PENDING"
                }),

            //------------------------------------------------------------------
            // Consumer Doctrine
            //------------------------------------------------------------------

            consumer_doctrine:
                Object.freeze({

                    stream3:
                        Object.freeze({

                            owns_workspace_presentation:
                                true,

                            owns_navigation:
                                true,

                            may_display_intelligence:
                                true,

                            may_display_explanations:
                                true,

                            may_show_warnings:
                                true,

                            may_show_state:
                                true,

                            may_recalculate_scores:
                                false,

                            may_override_confidence:
                                false,

                            may_manufacture_composite:
                                false,

                            may_invent_missing_domain:
                                false
                        }),

                    stream5:
                        Object.freeze({

                            may_operationalize_governed_intelligence:
                                true,

                            may_display_professional_intelligence:
                                true,

                            may_recalculate_scores:
                                false
                        }),

                    stream6:
                        Object.freeze({

                            may_communicate_governed_intelligence_context:
                                true,

                            may_recalculate_scores:
                                false
                        }),

                    stream7:
                        Object.freeze({

                            may_consume_crystal_intelligence:
                                true,

                            may_consume_exposure_intelligence:
                                true,

                            may_publish_governed_downstream_outputs:
                                true,

                            may_recalculate_athlete_scores:
                                false
                        }),

                    stream8:
                        Object.freeze({

                            may_monitor_runtime_integrity:
                                true,

                            may_monitor_authority_availability:
                                true,

                            may_recalculate_scores:
                                false
                        }),

                    master_integration:
                        Object.freeze({

                            may_synchronize_governed_outputs:
                                true,

                            may_modify_scoring_science:
                                false
                        })
                }),

            //------------------------------------------------------------------
            // Identity Doctrine
            //------------------------------------------------------------------

            identity_doctrine:
                Object.freeze({

                    auth_user_id_is_distinct:
                        true,

                    sc_user_id_is_distinct:
                        true,

                    professional_id_is_distinct:
                        true,

                    certification_id_is_distinct:
                        true,

                    athlete_id_is_distinct:
                        true,

                    snapshot_id_is_distinct:
                        true,

                    workspace_id_is_distinct:
                        true,

                    runtime_id_is_distinct:
                        true,

                    session_id_is_distinct:
                        true,

                    receipt_id_is_distinct:
                        true,

                    identity_collapse_allowed:
                        false
                }),

            //------------------------------------------------------------------
            // Failure Doctrine
            //------------------------------------------------------------------

            failure_doctrine:
                Object.freeze({

                    fail_closed_on_missing_authority:
                        true,

                    fail_closed_on_missing_required_identity:
                        true,

                    fail_closed_on_invalid_contract:
                        true,

                    missing_score_may_not_become_zero:
                        true,

                    missing_domain_may_not_be_inferred:
                        true,

                    missing_matrix_may_not_be_simulated_by_consumer:
                        true,

                    missing_composite_weighting_may_not_be_guessed:
                        true,

                    legacy_fallback_may_not_become_official:
                        true
                }),

            //------------------------------------------------------------------
            // Output Type Doctrine
            //------------------------------------------------------------------

            allowed_output_types:
                OFFICIAL_OUTPUT_TYPES,

            publication_states:
                PUBLICATION_STATES,

            //------------------------------------------------------------------
            // Validation Helpers
            //------------------------------------------------------------------

            validateAuthority:
                function () {

                    return Boolean(
                        global.STATScoreStream9Authority &&
                        global.STATScoreStream9Authority.stream_number === 9 &&
                        global.STATScoreStream9Authority.operational_state === "ACTIVE"
                    );
                },

            validateScoreDoctrine:
                function () {

                    return Boolean(
                        global.STATScoreScoreDoctrine &&
                        global.STATScoreScoreDoctrine.doctrine_key ===
                            "STATSCORE_SCORE_DOCTRINE" &&
                        global.STATScoreScoreDoctrine.doctrine_status ===
                            "CANON_LOCKED"
                    );
                },

            isActiveDomain:
                function (
                    domain
                ) {

                    const key =
                        String(
                            domain ||
                            ""
                        )
                            .trim()
                            .toUpperCase();

                    return ACTIVE_INTELLIGENCE_DOMAINS.includes(
                        key
                    );
                },

            isInactiveDomain:
                function (
                    domain
                ) {

                    const key =
                        String(
                            domain ||
                            ""
                        )
                            .trim()
                            .toUpperCase();

                    return INACTIVE_INTELLIGENCE_DOMAINS.includes(
                        key
                    );
                },

            isAllowedOutputType:
                function (
                    outputType
                ) {

                    const key =
                        String(
                            outputType ||
                            ""
                        )
                            .trim()
                            .toUpperCase();

                    return Boolean(
                        OFFICIAL_OUTPUT_TYPES[
                            key
                        ]
                    );
                },

            validateDomainOutput:
                function (
                    output
                ) {

                    if (
                        !output ||
                        typeof output !==
                            "object"
                    ) {
                        return {
                            valid:
                                false,

                            status:
                                "INVALID_DOMAIN_OUTPUT",

                            missing: [
                                "output_object"
                            ]
                        };
                    }

                    const missing =
                        [];

                    [
                        "athlete_id",
                        "snapshot_id",
                        "domain",
                        "status",
                        "generated_at"
                    ].forEach(
                        function (
                            key
                        ) {
                            if (
                                output[
                                    key
                                ] === undefined ||
                                output[
                                    key
                                ] === null
                            ) {
                                missing.push(
                                    key
                                );
                            }
                        }
                    );

                    if (
                        !this.isActiveDomain(
                            output.domain
                        )
                    ) {
                        missing.push(
                            "active_domain"
                        );
                    }

                    if (
                        output.output_type &&
                        !this.isAllowedOutputType(
                            output.output_type
                        )
                    ) {
                        missing.push(
                            "allowed_output_type"
                        );
                    }

                    return {
                        valid:
                            missing.length ===
                            0,

                        status:
                            missing.length ===
                                0
                                ? "VALID_DOMAIN_OUTPUT"
                                : "INVALID_DOMAIN_OUTPUT",

                        missing
                    };
                },

            validateCompositeBoundary:
                function (
                    domainOutput,
                    compositeOutput
                ) {

                    return {
                        valid:
                            Boolean(
                                domainOutput &&
                                (
                                    !compositeOutput ||
                                    compositeOutput.status !==
                                        "OFFICIAL" ||
                                    compositeOutput.authority ===
                                        "COMPOSITE_AUTHORITY"
                                )
                            ),

                        rule:
                            "Official domain intelligence may exist before Composite Intelligence. Only Composite Authority may publish official composite intelligence."
                    };
                },

            getDoctrineStatus:
                function () {

                    return {
                        doctrine_key:
                            this.doctrine_key,

                        version:
                            this.version,

                        doctrine_status:
                            this.doctrine_status,

                        stream_key:
                            this.stream_key,

                        authority_verified:
                            this.validateAuthority(),

                        score_doctrine_verified:
                            this.validateScoreDoctrine(),

                        active_domains:
                            Array.from(
                                ACTIVE_INTELLIGENCE_DOMAINS
                            ),

                        inactive_domains:
                            Array.from(
                                INACTIVE_INTELLIGENCE_DOMAINS
                            ),

                        character_active:
                            false,

                        domain_may_be_official_before_composite:
                            this
                                .domain_composite_doctrine
                                .domain_intelligence_may_be_official_before_composite,

                        composite_authority_exclusive:
                            this
                                .domain_composite_doctrine
                                .composite_authority_exclusive_for_composite_publication,

                        certification_may_manufacture_athlete_ability:
                            false,

                        program_health_is_athlete_score:
                            false,

                        consumers_may_recalculate:
                            false
                    };
                }

        });

    global.STATScoreIntelligenceDoctrine =
        STATScoreIntelligenceDoctrine;

    global.STATScore =
        global.STATScore ||
        {};

    global.STATScore.IntelligenceDoctrine =
        STATScoreIntelligenceDoctrine;

    console.info(
        "[STATS-CORE] Intelligence Doctrine loaded:",
        VERSION,
        "| Domain ≠ Composite | Projection ≠ Official | Certification ≠ Ability"
    );

})(window); 
