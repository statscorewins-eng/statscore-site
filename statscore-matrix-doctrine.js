/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Matrix Doctrine
* -----------------------------------------------------------------------------
* File:
*     statscore-matrix-doctrine.js
*
* Purpose:
*     Define the official laws, boundaries, structure, registration rules,
*     versioning rules, evidence requirements, output requirements, and
*     execution requirements for all STATS-CORE intelligence matrices.
*
* Doctrine:
*     This file DOES NOT calculate scores.
*     This file defines what a governed matrix is and what every matrix must
*     declare before it may be authorized by Stream 9.
*
* Version:
*     1.0.0
*
* Status:
*     CANON LOCKED
* =============================================================================
*/

(function (global) {
    'use strict';

    const STATScoreMatrixDoctrine = Object.freeze({

        doctrine_key: "STATSCORE_MATRIX_DOCTRINE",
        stream_key: "STATSCORE_STREAM_9",
        doctrine_name: "STATS-CORE Matrix Doctrine",
        version: "1.0.0",
        doctrine_status: "CANON_LOCKED",

        requires_authority: "STATScoreStream9Authority",
        requires_intelligence_doctrine: "STATScoreIntelligenceDoctrine",
        requires_score_doctrine: "STATScoreScoreDoctrine",

        matrix_definition:
            "A STATS-CORE matrix is a governed scoring model that declares required evidence, weighting logic, output contract, confidence behavior, explanation requirements, and version identity before it may generate official domain intelligence.",

        matrix_is: Object.freeze({
            governed_model: true,
            evidence_declared: true,
            weighting_declared: true,
            versioned: true,
            confidence_aware: true,
            explainability_required: true,
            registry_required: true,
            audit_ready: true
        }),

        matrix_is_not: Object.freeze({
            dashboard_logic: true,
            page_runtime_behavior: true,
            raw_stat_display: true,
            unregistered_formula: true,
            hidden_weighting_system: true,
            consumer_generated_score: true,
            manual_override_tool: true
        }),

        required_matrix_contract: Object.freeze({
            matrix_key: true,
            matrix_name: true,
            matrix_domain: true,
            matrix_version: true,
            stream_owner: true,
            required_evidence: true,
            optional_evidence: true,
            weights: true,
            output_type: true,
            score_range: true,
            confidence_behavior: true,
            explanation_behavior: true,
            insufficient_evidence_behavior: true,
            generated_at_required: true
        }),

        allowed_output_types: Object.freeze({
            DOMAIN_SCORE: true,
            DOMAIN_INTELLIGENCE: true,
            CONFIDENCE_SIGNAL: true,
            RECOMMENDATION_SIGNAL: true,
            PATHWAY_SIGNAL: true,
            RANKING_SUPPORT_SIGNAL: true,
            PROGRAM_FIT_SIGNAL: true
        }),

        ownership_rules: Object.freeze({
            stream_owner_required: true,
            official_stream_owner: "STATSCORE_STREAM_9",
            non_stream_9_matrix_authority_allowed: false,
            consumer_owned_matrices_allowed: false,
            dashboard_owned_matrices_allowed: false
        }),

        versioning_rules: Object.freeze({
            matrix_version_required: true,
            doctrine_version_required: true,
            registry_version_required: true,
            weight_change_requires_version_change: true,
            evidence_requirement_change_requires_version_change: true,
            output_contract_change_requires_version_change: true
        }),

        evidence_rules: Object.freeze({
            required_evidence_must_be_declared: true,
            missing_required_evidence_must_be_flagged: true,
            missing_required_evidence_may_return_null_score: true,
            optional_evidence_may_adjust_confidence: true,
            unverifiable_evidence_must_reduce_confidence: true,
            conflicting_evidence_must_be_flagged: true,
            stale_evidence_must_reduce_confidence: true
        }),

        weighting_rules: Object.freeze({
            weights_must_be_declared: true,
            weights_must_sum_to_expected_total: true,
            default_expected_total: 100,
            hidden_weights_allowed: false,
            consumer_weight_adjustment_allowed: false,
            dashboard_weight_adjustment_allowed: false
        }),

        execution_rules: Object.freeze({
            matrix_does_not_render_pages: true,
            matrix_does_not_route_users: true,
            matrix_does_not_create_dashboards: true,
            matrix_does_not_send_messages: true,
            matrix_does_not_create_crystal_reports: true,
            matrix_returns_structured_output: true
        }),

        required_matrix_output: Object.freeze({
            athlete_id: true,
            snapshot_id: true,
            matrix_key: true,
            matrix_version: true,
            doctrine_version: true,
            domain: true,
            score: true,
            confidence: true,
            evidence_used: true,
            missing_evidence: true,
            flags: true,
            explanation: true,
            generated_at: true,
            status: true
        }),

        official_matrix_rule:
            "No matrix may produce official STATS-CORE intelligence unless it is registered in the Stream 9 Matrix Registry and owned by Stream 9.",

        unauthorized_matrix_status: "UNAUTHORIZED_MATRIX",
        invalid_matrix_status: "INVALID_MATRIX_CONTRACT",
        insufficient_evidence_status: "INSUFFICIENT_EVIDENCE",

        validateAuthority: function () {
            return Boolean(
                global.STATScoreStream9Authority &&
                global.STATScoreStream9Authority.stream_number === 9 &&
                global.STATScoreStream9Authority.operational_state === "ACTIVE"
            );
        },

        validateScoreDoctrine: function () {
            return Boolean(
                global.STATScoreScoreDoctrine &&
                global.STATScoreScoreDoctrine.doctrine_key === "STATSCORE_SCORE_DOCTRINE" &&
                global.STATScoreScoreDoctrine.doctrine_status === "CANON_LOCKED"
            );
        },

        validateMatrixContract: function (matrix) {
            if (!matrix || typeof matrix !== "object") {
                return {
                    valid: false,
                    status: this.invalid_matrix_status,
                    missing: ["matrix_object"]
                };
            }

            const missing = [];

            Object.keys(this.required_matrix_contract).forEach(function (key) {
                if (matrix[key] === undefined || matrix[key] === null) {
                    missing.push(key);
                }
            });

            if (matrix.stream_owner !== this.ownership_rules.official_stream_owner) {
                missing.push("valid_stream_owner");
            }

            if (!this.allowed_output_types[matrix.output_type]) {
                missing.push("valid_output_type");
            }

            return {
                valid: missing.length === 0,
                status: missing.length === 0 ? "VALID_MATRIX_CONTRACT" : this.invalid_matrix_status,
                missing: missing
            };
        },

        validateWeights: function (weights, expectedTotal) {
            if (!weights || typeof weights !== "object") {
                return {
                    valid: false,
                    total: 0,
                    expected: expectedTotal || this.weighting_rules.default_expected_total
                };
            }

            const expected = expectedTotal || this.weighting_rules.default_expected_total;
            const total = Object.keys(weights).reduce(function (sum, key) {
                const value = Number(weights[key]);
                return sum + (Number.isFinite(value) ? value : 0);
            }, 0);

            return {
                valid: Math.abs(total - expected) < 0.0001,
                total: Number(total.toFixed(4)),
                expected: expected
            };
        },

        getDoctrineStatus: function () {
            return {
                doctrine_key: this.doctrine_key,
                version: this.version,
                doctrine_status: this.doctrine_status,
                authority_verified: this.validateAuthority(),
                score_doctrine_verified: this.validateScoreDoctrine(),
                official_matrix_rule: this.official_matrix_rule
            };
        }

    });

    global.STATScoreMatrixDoctrine = STATScoreMatrixDoctrine;

})(window); 
