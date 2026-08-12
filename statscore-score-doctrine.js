/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-score-doctrine.js
*
* Classification:
*     CANONICAL SCORE GOVERNANCE DOCTRINE
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-SCORE-DOCTRINE-V2
*
* Doctrine Version:
*     2.0.0
*
* Status:
*     CANON LOCKED
*
* Purpose:
*     Define the constitutional laws, boundaries, terminology, evidence
*     requirements, confidence rules, explainability rules, versioning rules,
*     publication rules, failure rules, and consumer restrictions governing
*     all official STATS-CORE™ scores.
*
* Doctrine:
*     This file DOES NOT calculate scores.
*     This file DOES NOT execute matrices.
*     This file DOES NOT calculate Composite Intelligence.
*     This file DOES NOT render pages.
*
*     This file defines what an official score IS, what it IS NOT,
*     which authority may produce it, how it must fail, and how all
*     downstream consumers must treat it.
*
* Permanent Constitutional Rules:
*
*     Evidence ≠ Intelligence
*     Score ≠ Confidence
*     Verification ≠ Performance
*     Confidence ≠ Certification
*     Certification ≠ Athlete Ability
*     PROJECTED ≠ OFFICIAL
*     Missing ≠ Zero
*     Recommendation ≠ Action
*     Composite Intelligence Consumes Domain Intelligence
*     Composite Intelligence Never Replaces Domain Intelligence
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const DOCTRINE_KEY =
        "STATSCORE_SCORE_DOCTRINE";

    const STREAM_KEY =
        "STATSCORE_STREAM_9";

    const VERSION =
        "2.0.0";

    const DOCTRINE_STATUS =
        "CANON_LOCKED";

    /*
     * =========================================================================
     * CONSTITUTIONAL INVARIANTS
     * =========================================================================
     */

    const CONSTITUTIONAL_INVARIANTS = Object.freeze({

        evidence_ne_intelligence:
            "Evidence ≠ Intelligence",

        score_ne_confidence:
            "Score ≠ Confidence",

        verification_ne_performance:
            "Verification ≠ Performance",

        confidence_ne_certification:
            "Confidence ≠ Certification",

        certification_ne_athlete_ability:
            "Certification ≠ Athlete Ability",

        projected_ne_official:
            "PROJECTED ≠ OFFICIAL",

        missing_ne_zero:
            "Missing ≠ Zero",

        recommendation_ne_action:
            "Recommendation ≠ Action",

        composite_consumes_domains:
            "Composite Intelligence Consumes Domain Intelligence",

        composite_never_replaces_domains:
            "Composite Intelligence Never Replaces Domain Intelligence",

        missing_authority_ne_reconstruction:
            "Missing Authority ≠ Permission to Reconstruct Authority",

        one_domain_one_source:
            "One Domain — One Source Authority"
    });

    /*
     * =========================================================================
     * SCORE STATES
     * =========================================================================
     */

    const SCORE_STATES = Object.freeze({

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

        COMPOSITE_PENDING:
            "COMPOSITE_PENDING",

        COMPOSITE_BLOCKED:
            "COMPOSITE_BLOCKED",

        UNOFFICIAL:
            "UNOFFICIAL",

        INVALID_SCORE:
            "INVALID_SCORE"
    });

    const STATScoreScoreDoctrine = {

        doctrine_key:
            DOCTRINE_KEY,

        stream_key:
            STREAM_KEY,

        doctrine_name:
            "STATS-CORE Score Doctrine",

        version:
            VERSION,

        doctrine_status:
            DOCTRINE_STATUS,

        requires_authority:
            "STATScoreStream9Authority",

        requires_intelligence_doctrine:
            "STATScoreIntelligenceDoctrine",

        requires_matrix_doctrine:
            "STATScoreMatrixDoctrine",

        /*
         * ---------------------------------------------------------------------
         * Score Definition
         * ---------------------------------------------------------------------
         */

        score_definition:
            "A STATS-CORE score is a governed numeric interpretation of evidence produced only by an authorized Stream 9 scoring authority, bound to declared evidence requirements, version identity, confidence, explainability, and publication rules.",

        score_is: Object.freeze({

            evidence_based:
                true,

            authority_governed:
                true,

            domain_specific:
                true,

            versioned:
                true,

            confidence_aware:
                true,

            explainability_required:
                true,

            auditable:
                true,

            consumer_readable:
                true
        }),

        score_is_not: Object.freeze({

            raw_stat_total:
                true,

            raw_measurement:
                true,

            raw_gpa:
                true,

            profile_completion_percentage:
                true,

            dashboard_generated_number:
                true,

            page_generated_number:
                true,

            recruiter_preference:
                true,

            coach_opinion:
                true,

            professional_certification:
                true,

            verification_status:
                true,

            unregistered_average:
                true,

            sport_trait_average:
                true,

            hidden_formula:
                true,

            consumer_override:
                true,

            manual_substitution:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Score Authority Doctrine
         * ---------------------------------------------------------------------
         */

        authority_doctrine: Object.freeze({

            official_stream_owner:
                STREAM_KEY,

            independent_scoring_allowed:
                false,

            dashboard_scoring_allowed:
                false,

            profile_scoring_allowed:
                false,

            professional_workspace_scoring_allowed:
                false,

            publication_surface_scoring_allowed:
                false,

            communication_surface_scoring_allowed:
                false,

            generic_fallback_may_publish_official_score:
                false,

            sport_router_may_publish_official_score:
                false,

            sport_supporting_authority_may_publish_domain_score:
                false,

            domain_score_requires_governed_domain_authority:
                true,

            consumer_model_requires_score_authority:
                true,

            composite_requires_composite_authority:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Domain Doctrine
         * ---------------------------------------------------------------------
         */

        domain_doctrine: Object.freeze({

            one_domain_one_source_authority:
                true,

            domain_substitution_allowed:
                false,

            athletic_may_replace_production:
                false,

            production_may_replace_athletic:
                false,

            verification_may_replace_confidence:
                false,

            competition_may_modify_raw_performance:
                false,

            academic_may_modify_athletic:
                false,

            program_health_may_modify_athlete_score:
                false,

            exposure_may_modify_athletic:
                false,

            crystal_may_modify_athletic:
                false,

            recruiting_interest_may_modify_athletic:
                false,

            position_context_creates_independent_score_by_default:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Score Types
         * ---------------------------------------------------------------------
         *
         * Important:
         * A type listed here is a permitted semantic category.
         * Its existence does NOT authorize an implementation.
         * Numeric scoring may exist only where a governed authority defines it.
         */

        score_types: Object.freeze({

            DOMAIN_SCORE:
                "A numeric score produced by one governed Stream 9 domain authority.",

            COMPOSITE_SCORE:
                "A numeric score produced only by Composite Authority from eligible governed domain intelligence.",

            READINESS_SCORE:
                "A numeric readiness score only if an approved Readiness Authority explicitly defines one.",

            PATHWAY_SUPPORT_SCORE:
                "A numeric pathway support score only if an approved Pathway Authority explicitly defines one.",

            RANKING_SUPPORT_SCORE:
                "A numeric ranking support score only if an approved authority explicitly defines one.",

            PROGRAM_FIT_SUPPORT_SCORE:
                "A numeric program-fit support score only if an approved Program Fit Authority explicitly defines one."
        }),

        score_type_rule:
            "The presence of a semantic score type does not authorize a formula. Numeric scoring exists only where a governed authority contract explicitly establishes it.",

        /*
         * ---------------------------------------------------------------------
         * Score Range Doctrine
         * ---------------------------------------------------------------------
         */

        score_range: Object.freeze({

            minimum:
                0,

            maximum:
                100,

            decimal_precision:
                2,

            out_of_range_allowed:
                false,

            null_score_allowed:
                true,

            null_score_meaning:
                "Missing or blocked intelligence must remain null rather than becoming zero.",

            zero_requires_governed_result:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Missing Evidence Doctrine
         * ---------------------------------------------------------------------
         */

        missing_evidence_doctrine: Object.freeze({

            missing_required_evidence_may_block_score:
                true,

            missing_score_must_remain_null:
                true,

            missing_score_may_not_be_zero_fallback:
                true,

            missing_score_may_not_copy_another_domain:
                true,

            missing_score_may_not_use_generic_fallback:
                true,

            missing_authority_may_not_be_reconstructed_by_consumer:
                true,

            insufficient_evidence_status:
                SCORE_STATES.INSUFFICIENT_EVIDENCE
        }),

        /*
         * ---------------------------------------------------------------------
         * Projection Doctrine
         * ---------------------------------------------------------------------
         */

        projection_doctrine: Object.freeze({

            projected_intelligence_allowed_when_explicitly_authorized:
                true,

            projected_score_is_official:
                false,

            projected_may_silently_become_official:
                false,

            projected_may_enter_official_matrix_without_explicit_authorization:
                false,

            projected_requires_status:
                SCORE_STATES.PROJECTED,

            projected_requires_explanation:
                true,

            projected_requires_confidence:
                true,

            projected_requires_non_official_marker:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Confidence Doctrine
         * ---------------------------------------------------------------------
         */

        confidence_doctrine: Object.freeze({

            confidence_required_for_official_scores:
                true,

            confidence_is_independent_from_score:
                true,

            high_score_low_confidence_allowed:
                true,

            low_score_high_confidence_allowed:
                true,

            moderate_score_high_confidence_allowed:
                true,

            score_may_not_replace_confidence:
                true,

            confidence_may_not_replace_score:
                true,

            confidence_may_reflect:
                Object.freeze([
                    "evidence sufficiency",
                    "verification standing",
                    "source provenance",
                    "recency",
                    "conflict",
                    "authority attribution",
                    "receipt integrity"
                ]),

            confidence_may_not_modify_raw_performance:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Verification Doctrine
         * ---------------------------------------------------------------------
         */

        verification_doctrine: Object.freeze({

            verification_changes_underlying_measurement:
                false,

            verification_changes_underlying_gpa:
                false,

            verification_changes_underlying_production_fact:
                false,

            verification_may_change_confidence:
                true,

            verification_may_change_provenance_standing:
                true,

            verification_may_change_publication_eligibility:
                true,

            verified_measurement_rule:
                "A verified 4.41 and a self-reported 4.41 represent the same claimed physical measurement. Verification changes trust, not the physical meaning of 4.41."
        }),

        /*
         * ---------------------------------------------------------------------
         * Certification Doctrine
         * ---------------------------------------------------------------------
         */

        certification_doctrine: Object.freeze({

            certification_owner:
                "STATSCORE_STREAM_10",

            certification_may_affect:
                Object.freeze([
                    "professional authority",
                    "provenance",
                    "verification standing",
                    "confidence",
                    "publication eligibility",
                    "program health"
                ]),

            certification_may_not_affect:
                Object.freeze([
                    "athletic ability",
                    "raw physical measurement",
                    "academic fact",
                    "production fact"
                ]),

            certification_to_athlete_points_allowed:
                false,

            more_certifications_equals_higher_athlete_score:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Academic Doctrine
         * ---------------------------------------------------------------------
         */

        academic_doctrine: Object.freeze({

            raw_gpa_is_not_academic_score:
                true,

            direct_gpa_normalization_to_official_score_allowed:
                false,

            transcript_verification_changes_gpa:
                false,

            academic_performance_ne_academic_verification:
                true,

            academic_performance_ne_eligibility:
                true,

            eligibility_determination_owner_external_or_governed:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Competition Doctrine
         * ---------------------------------------------------------------------
         */

        competition_doctrine: Object.freeze({

            competition_context_is_independent_domain:
                true,

            competition_changes_raw_performance:
                false,

            competition_score_times_athlete_score_is_constitutional_authority:
                false,

            competition_answers:
                "Against what level and quality of competition was the athlete's performance established?"
        }),

        /*
         * ---------------------------------------------------------------------
         * Composite Doctrine
         * ---------------------------------------------------------------------
         */

        composite_doctrine: Object.freeze({

            composite_consumes_domain_intelligence:
                true,

            composite_replaces_domain_intelligence:
                false,

            composite_may_guess_missing_weights:
                false,

            composite_may_use_unregistered_average:
                false,

            composite_may_publish_without_authority:
                false,

            composite_must_preserve_domain_versions:
                true,

            composite_must_preserve_domain_confidence:
                true,

            composite_must_preserve_missing_domains:
                true,

            composite_pending_status:
                SCORE_STATES.COMPOSITE_PENDING,

            composite_blocked_status:
                SCORE_STATES.COMPOSITE_BLOCKED
        }),

        /*
         * ---------------------------------------------------------------------
         * Explainability Doctrine
         * ---------------------------------------------------------------------
         */

        explainability_doctrine: Object.freeze({

            explanation_required_for_official_scores:
                true,

            score_without_explanation_is_unofficial:
                true,

            explanation_must_include_evidence_used:
                true,

            explanation_must_include_missing_evidence_when_applicable:
                true,

            explanation_must_include_authority:
                true,

            explanation_must_include_matrix_version_when_applicable:
                true,

            explanation_must_include_doctrine_version:
                true,

            explanation_must_include_confidence:
                true,

            explanation_must_include_confidence_limiters:
                true,

            explanation_must_include_flags:
                true,

            explanation_must_include_next_action_when_applicable:
                true
        }),

        /*
         * ---------------------------------------------------------------------
         * Weighting Doctrine
         * ---------------------------------------------------------------------
         */

        weighting_doctrine: Object.freeze({

            weighting_required_when_score_formula_uses_weights:
                true,

            weights_must_be_declared:
                true,

            hidden_weights_allowed:
                false,

            consumer_weighting_allowed:
                false,

            dashboard_weighting_allowed:
                false,

            professional_workspace_weighting_allowed:
                false,

            weight_change_requires_version_change:
                true,

            proprietary_composite_weight_guessing_allowed:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Versioning Doctrine
         * ---------------------------------------------------------------------
         */

        versioning_doctrine: Object.freeze({

            score_authority_version_required:
                true,

            matrix_version_required_when_matrix_applies:
                true,

            doctrine_version_required:
                true,

            generated_at_required:
                true,

            evidence_contract_change_requires_version_change:
                true,

            weight_change_requires_version_change:
                true,

            threshold_change_requires_version_change:
                true,

            benchmark_science_change_requires_version_change:
                true,

            confidence_behavior_change_requires_version_change:
                true,

            output_contract_change_requires_version_change:
                true,

            silent_production_mutation_allowed:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Publication Doctrine
         * ---------------------------------------------------------------------
         */

        publication_doctrine: Object.freeze({

            official_domain_scores_must_publish_through_approved_stream_9_domain_authority:
                true,

            official_consumer_model_must_publish_through_score_authority:
                true,

            official_composite_must_publish_through_composite_authority:
                true,

            stream_7_owns_publication_execution:
                true,

            stream_3_owns_athlete_presentation:
                true,

            consumers_may_display_scores:
                true,

            consumers_may_store_governed_score_snapshots:
                true,

            consumers_may_recalculate_scores:
                false,

            consumers_may_reweight_scores:
                false,

            consumers_may_modify_scores:
                false,

            consumers_may_infer_missing_scores:
                false,

            consumers_may_replace_null_with_zero:
                false,

            consumers_may_override_confidence:
                false,

            consumers_may_manufacture_composite:
                false,

            consumers_may_generate_official_recommendations_without_authority:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Consumer Doctrine
         * ---------------------------------------------------------------------
         */

        consumer_doctrine: Object.freeze({

            stream_3:
                "Consume, display, summarize, explain, navigate, and route governed Stream 9 outputs without recalculating them.",

            stream_5:
                "Operationalize governed Stream 9 intelligence without modifying its underlying scoring authority.",

            stream_6:
                "Communicate governed intelligence context without manufacturing or modifying scores.",

            stream_7:
                "Publish authorized intelligence through governed publication surfaces without altering scoring.",

            stream_8:
                "Monitor authority health and runtime integrity without reconstructing intelligence.",

            stream_10:
                "Provide certification facts for provenance/trust without modifying athlete ability.",

            master_integration:
                "Integrate approved Stream 9 outputs while preserving Stream 9 authority."
        }),

        /*
         * ---------------------------------------------------------------------
         * Score Substitution Prohibitions
         * ---------------------------------------------------------------------
         */

        substitution_prohibitions: Object.freeze({

            athletic_equals_position_by_default:
                false,

            production_falls_back_to_athletic:
                false,

            academic_falls_back_to_gpa_conversion:
                false,

            verification_falls_back_to_local_status_constants:
                false,

            confidence_falls_back_to_score:
                false,

            sport_trait_average_becomes_official_domain_score:
                false,

            generic_score_becomes_multiple_domain_scores:
                false,

            character_score_may_alias_verification:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Character Intelligence
         * ---------------------------------------------------------------------
         */

        character_intelligence: Object.freeze({

            active:
                false,

            score_allowed:
                false,

            compatibility_alias_allowed:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Failure Doctrine
         * ---------------------------------------------------------------------
         */

        failure_doctrine: Object.freeze({

            default_behavior:
                "FAIL_RESTRICTIVELY",

            allowed_states:
                SCORE_STATES,

            missing_score:
                "Return null with governed status.",

            missing_matrix:
                "Return MATRIX_UNAVAILABLE or applicable restricted state.",

            unauthorized_matrix:
                "Return MATRIX_UNAUTHORIZED.",

            invalid_matrix_contract:
                "Return MATRIX_CONTRACT_INVALID.",

            evidence_conflict:
                "Return or flag SOURCE_EVIDENCE_CONFLICT.",

            stale_evidence:
                "Return or flag STALE_EVIDENCE and reduce confidence according to authority doctrine.",

            missing_domain_authority:
                "Return DOMAIN_UNAVAILABLE.",

            missing_composite_authority:
                "Return COMPOSITE_PENDING.",

            blocked_composite:
                "Return COMPOSITE_BLOCKED.",

            missing_is_zero:
                false
        }),

        /*
         * ---------------------------------------------------------------------
         * Integrity Requirements
         * ---------------------------------------------------------------------
         */

        integrity_rules: Object.freeze({

            athlete_id_required:
                true,

            snapshot_id_required:
                true,

            authority_identity_required:
                true,

            matrix_identity_required_when_applicable:
                true,

            matrix_version_required_when_applicable:
                true,

            doctrine_version_required:
                true,

            generated_at_required:
                true,

            evidence_reference_required:
                true,

            confidence_required_for_official_score:
                true,

            explanation_required_for_official_score:
                true,

            domain_status_required:
                true,

            unauthorized_score_status:
                SCORE_STATES.UNOFFICIAL,

            invalid_score_status:
                SCORE_STATES.INVALID_SCORE,

            insufficient_score_status:
                SCORE_STATES.INSUFFICIENT_EVIDENCE
        }),

        /*
         * =========================================================================
         * VALIDATION
         * =========================================================================
         */

        validateAuthority: function () {
            return Boolean(
                global.STATScoreStream9Authority &&
                global.STATScoreStream9Authority.stream_number === 9 &&
                global.STATScoreStream9Authority.operational_state === "ACTIVE"
            );
        },

        validateIntelligenceDoctrine: function () {
            return Boolean(
                global.STATScoreIntelligenceDoctrine &&
                global.STATScoreIntelligenceDoctrine.doctrine_key ===
                    "STATSCORE_INTELLIGENCE_DOCTRINE" &&
                global.STATScoreIntelligenceDoctrine.doctrine_status ===
                    "CANON_LOCKED"
            );
        },

        validateMatrixDoctrine: function () {
            return Boolean(
                global.STATScoreMatrixDoctrine &&
                global.STATScoreMatrixDoctrine.doctrine_key ===
                    "STATSCORE_MATRIX_DOCTRINE" &&
                global.STATScoreMatrixDoctrine.doctrine_status ===
                    "CANON_LOCKED"
            );
        },

        isKnownStatus: function (status) {
            const normalized =
                String(status || "")
                    .trim()
                    .toUpperCase();

            return Object.values(
                SCORE_STATES
            ).includes(
                normalized
            );
        },

        isScoreInRange: function (score) {
            if (
                score === null &&
                this.score_range
                    .null_score_allowed
            ) {
                return true;
            }

            if (
                typeof score !== "number" ||
                Number.isNaN(score)
            ) {
                return false;
            }

            return (
                score >=
                    this.score_range.minimum &&
                score <=
                    this.score_range.maximum
            );
        },

        normalizeScore: function (score) {
            if (
                score === null &&
                this.score_range
                    .null_score_allowed
            ) {
                return null;
            }

            if (
                typeof score !== "number" ||
                Number.isNaN(score)
            ) {
                return null;
            }

            const bounded =
                Math.max(
                    this.score_range.minimum,
                    Math.min(
                        this.score_range.maximum,
                        score
                    )
                );

            return Number(
                bounded.toFixed(
                    this.score_range
                        .decimal_precision
                )
            );
        },

        validateOfficialScoreResult: function (
            result
        ) {
            const errors =
                [];

            if (
                !result ||
                typeof result !==
                    "object"
            ) {
                return {
                    valid:
                        false,

                    status:
                        SCORE_STATES.INVALID_SCORE,

                    errors: [
                        "score_result_required"
                    ]
                };
            }

            if (!result.athlete_id) {
                errors.push(
                    "athlete_id_required"
                );
            }

            if (!result.snapshot_id) {
                errors.push(
                    "snapshot_id_required"
                );
            }

            if (!result.domain) {
                errors.push(
                    "domain_required"
                );
            }

            if (
                !this.isScoreInRange(
                    result.score
                )
            ) {
                errors.push(
                    "score_out_of_range_or_invalid"
                );
            }

            if (
                result.score !== null &&
                (
                    result.confidence ===
                        undefined ||
                    result.confidence ===
                        null
                )
            ) {
                errors.push(
                    "confidence_required"
                );
            }

            if (
                result.score !== null &&
                !result.explanation
            ) {
                errors.push(
                    "explanation_required"
                );
            }

            if (!result.generated_at) {
                errors.push(
                    "generated_at_required"
                );
            }

            if (
                !result.doctrine_version
            ) {
                errors.push(
                    "doctrine_version_required"
                );
            }

            if (
                result.status &&
                !this.isKnownStatus(
                    result.status
                )
            ) {
                errors.push(
                    "unknown_status"
                );
            }

            if (
                result.status ===
                    SCORE_STATES.PROJECTED &&
                result.official ===
                    true
            ) {
                errors.push(
                    "projected_cannot_be_official"
                );
            }

            return {
                valid:
                    errors.length === 0,

                status:
                    errors.length === 0
                        ? "VALID_SCORE_RESULT"
                        : SCORE_STATES
                            .INVALID_SCORE,

                errors
            };
        },

        /*
         * =========================================================================
         * DIAGNOSTICS
         * =========================================================================
         */

        getContract: function () {
            return {
                doctrine_key:
                    this.doctrine_key,

                doctrine_name:
                    this.doctrine_name,

                version:
                    this.version,

                doctrine_status:
                    this.doctrine_status,

                stream_key:
                    this.stream_key,

                score_definition:
                    this.score_definition,

                constitutional_invariants:
                    {
                        ...CONSTITUTIONAL_INVARIANTS
                    },

                official_domain_rule:
                    "Official domain scores originate only from governed Stream 9 domain authorities.",

                official_consumer_model_rule:
                    "The Score Authority publishes the governed consumer model.",

                official_composite_rule:
                    "Composite scores originate only from Composite Authority.",

                one_domain_one_source:
                    true,

                projected_equals_official:
                    false,

                verification_changes_performance:
                    false,

                certification_changes_athlete_ability:
                    false,

                missing_equals_zero:
                    false,

                generic_fallback_official:
                    false,

                character_intelligence_active:
                    false
            };
        },

        getConfiguration: function () {
            return {
                doctrine_key:
                    this.doctrine_key,

                version:
                    this.version,

                doctrine_status:
                    this.doctrine_status,

                score_range:
                    {
                        ...this.score_range
                    },

                permitted_states:
                    {
                        ...SCORE_STATES
                    },

                domain_substitution:
                    false,

                direct_gpa_to_score:
                    false,

                local_verification_shortcut:
                    false,

                generic_official_fallback:
                    false,

                consumer_recalculation:
                    false,

                consumer_reweighting:
                    false,

                consumer_confidence_override:
                    false,

                proprietary_composite_weight_guessing:
                    false,

                character_intelligence_active:
                    false
            };
        },

        getDoctrineStatus: function () {
            return {
                doctrine_key:
                    this.doctrine_key,

                version:
                    this.version,

                doctrine_status:
                    this.doctrine_status,

                authority_verified:
                    this.validateAuthority(),

                intelligence_doctrine_verified:
                    this.validateIntelligenceDoctrine(),

                matrix_doctrine_verified:
                    this.validateMatrixDoctrine(),

                one_domain_one_source:
                    this.domain_doctrine
                        .one_domain_one_source_authority,

                confidence_independent_from_score:
                    this.confidence_doctrine
                        .confidence_is_independent_from_score,

                verification_changes_performance:
                    this.verification_doctrine
                        .verification_changes_underlying_measurement,

                certification_to_athlete_points_allowed:
                    this.certification_doctrine
                        .certification_to_athlete_points_allowed,

                projected_may_be_official:
                    this.projection_doctrine
                        .projected_score_is_official,

                missing_may_be_zero:
                    this.missing_evidence_doctrine
                        .missing_score_may_not_be_zero_fallback ===
                        false,

                character_intelligence_active:
                    this.character_intelligence
                        .active
            };
        },

        runHealthCheck: function () {
            const authority =
                this.validateAuthority();

            const intelligenceDoctrine =
                this.validateIntelligenceDoctrine();

            const matrixDoctrine =
                this.validateMatrixDoctrine();

            const invariantsHealthy =
                this.domain_doctrine
                    .one_domain_one_source_authority ===
                    true &&
                this.domain_doctrine
                    .domain_substitution_allowed ===
                    false &&
                this.confidence_doctrine
                    .confidence_is_independent_from_score ===
                    true &&
                this.verification_doctrine
                    .verification_changes_underlying_measurement ===
                    false &&
                this.certification_doctrine
                    .certification_to_athlete_points_allowed ===
                    false &&
                this.projection_doctrine
                    .projected_score_is_official ===
                    false &&
                this.missing_evidence_doctrine
                    .missing_score_may_not_be_zero_fallback ===
                    true &&
                this.publication_doctrine
                    .consumers_may_recalculate_scores ===
                    false &&
                this.publication_doctrine
                    .consumers_may_reweight_scores ===
                    false &&
                this.composite_doctrine
                    .composite_may_guess_missing_weights ===
                    false &&
                this.character_intelligence
                    .active ===
                    false;

            return {
                doctrine_key:
                    this.doctrine_key,

                version:
                    this.version,

                doctrine_status:
                    this.doctrine_status,

                status:
                    (
                        authority &&
                        intelligenceDoctrine &&
                        matrixDoctrine &&
                        invariantsHealthy
                    )
                        ? "HEALTHY"
                        : "DEGRADED",

                stream_9_authority_verified:
                    authority,

                intelligence_doctrine_verified:
                    intelligenceDoctrine,

                matrix_doctrine_verified:
                    matrixDoctrine,

                one_domain_one_source:
                    this.domain_doctrine
                        .one_domain_one_source_authority,

                domain_substitution_allowed:
                    this.domain_doctrine
                        .domain_substitution_allowed,

                verification_changes_performance:
                    this.verification_doctrine
                        .verification_changes_underlying_measurement,

                certification_changes_athlete_ability:
                    this.certification_doctrine
                        .certification_to_athlete_points_allowed,

                projected_is_official:
                    this.projection_doctrine
                        .projected_score_is_official,

                missing_score_zero_fallback:
                    !this.missing_evidence_doctrine
                        .missing_score_may_not_be_zero_fallback,

                consumer_recalculation:
                    this.publication_doctrine
                        .consumers_may_recalculate_scores,

                consumer_reweighting:
                    this.publication_doctrine
                        .consumers_may_reweight_scores,

                proprietary_composite_weight_guessing:
                    this.composite_doctrine
                        .composite_may_guess_missing_weights,

                character_intelligence_active:
                    this.character_intelligence
                        .active,

                generated_at:
                    new Date()
                        .toISOString()
            };
        }

    };

    Object.freeze(
        STATScoreScoreDoctrine
    );

    global.STATScoreScoreDoctrine =
        STATScoreScoreDoctrine;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.ScoreDoctrine =
        STATScoreScoreDoctrine;

    console.info(
        "[STATS-CORE] Score Doctrine loaded:",
        VERSION,
        "| one-domain-one-source | missing ≠ zero | projected ≠ official"
    );

})(window); 
