/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Matrix Registry
* -----------------------------------------------------------------------------
* File:
*     statscore-matrix-registry.js
*
* Purpose:
*     Register, validate, authorize, and expose every official STATS-CORE
*     intelligence matrix governed by Stream 9.
*
* Doctrine:
*     This file DOES NOT calculate scores.
*     This file declares which matrices are official and prevents unauthorized
*     matrices from being treated as Stream 9 intelligence sources.
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

    const STREAM_OWNER = "STATSCORE_STREAM_9";

    const STATScoreMatrixRegistry = {

        registry_key: "STATSCORE_MATRIX_REGISTRY",
        registry_name: "STATS-CORE Stream 9 Matrix Registry",
        registry_version: "1.0.0",
        doctrine_status: "CANON_LOCKED",
        stream_owner: STREAM_OWNER,

        requires_authority: "STATScoreStream9Authority",
        requires_matrix_doctrine: "STATScoreMatrixDoctrine",

        matrices: Object.freeze({

            PRODUCTION_MATRIX: Object.freeze({
                matrix_key: "PRODUCTION_MATRIX",
                matrix_name: "STATS-CORE Production Matrix",
                matrix_domain: "PRODUCTION",
                matrix_version: "1.0.0",
                stream_owner: STREAM_OWNER,
                file_name: "statscore-production-matrix.js",
                required_evidence: Object.freeze([
                    "athlete_id",
                    "snapshot_id",
                    "sport",
                    "position",
                    "season_records"
                ]),
                optional_evidence: Object.freeze([
                    "awards",
                    "games_played",
                    "team_context",
                    "competition_context",
                    "verification_status"
                ]),
                weights: Object.freeze({
                    production_volume: 30,
                    production_efficiency: 25,
                    season_consistency: 20,
                    role_context: 15,
                    verified_recognition: 10
                }),
                output_type: "DOMAIN_SCORE",
                score_range: Object.freeze({ minimum: 0, maximum: 100 }),
                confidence_behavior: "Evidence sufficiency, verification level, season completeness, and conflict detection adjust confidence independently from score.",
                explanation_behavior: "Explain production score using season evidence, position context, verified achievements, missing evidence, and confidence factors.",
                insufficient_evidence_behavior: "Return null score with INSUFFICIENT_EVIDENCE status when required production evidence is missing.",
                generated_at_required: true
            }),

            ATHLETIC_MATRIX: Object.freeze({
                matrix_key: "ATHLETIC_MATRIX",
                matrix_name: "STATS-CORE Athletic Matrix",
                matrix_domain: "ATHLETIC",
                matrix_version: "1.0.0",
                stream_owner: STREAM_OWNER,
                file_name: "statscore-athletic-matrix.js",
                required_evidence: Object.freeze([
                    "athlete_id",
                    "snapshot_id",
                    "sport",
                    "position",
                    "measurables"
                ]),
                optional_evidence: Object.freeze([
                    "combine_results",
                    "camp_results",
                    "verified_testing",
                    "physical_profile",
                    "position_benchmarks"
                ]),
                weights: Object.freeze({
                    position_athletic_fit: 30,
                    verified_measurables: 25,
                    movement_profile: 20,
                    strength_profile: 15,
                    physical_trajectory: 10
                }),
                output_type: "DOMAIN_SCORE",
                score_range: Object.freeze({ minimum: 0, maximum: 100 }),
                confidence_behavior: "Verified testing, recency, and position benchmark alignment increase confidence; missing or self-reported metrics reduce confidence.",
                explanation_behavior: "Explain athletic score using measurable evidence, position standards, verification level, and missing testing signals.",
                insufficient_evidence_behavior: "Return null score with INSUFFICIENT_EVIDENCE status when required athletic evidence is missing.",
                generated_at_required: true
            }),

            COMPETITION_MATRIX: Object.freeze({
                matrix_key: "COMPETITION_MATRIX",
                matrix_name: "STATS-CORE Competition Matrix",
                matrix_domain: "COMPETITION",
                matrix_version: "1.0.0",
                stream_owner: STREAM_OWNER,
                file_name: "statscore-competition-matrix.js",
                required_evidence: Object.freeze([
                    "athlete_id",
                    "snapshot_id",
                    "sport",
                    "competition_level"
                ]),
                optional_evidence: Object.freeze([
                    "opponent_quality",
                    "league_strength",
                    "school_classification",
                    "regional_context",
                    "schedule_strength"
                ]),
                weights: Object.freeze({
                    competition_level: 35,
                    opponent_quality: 25,
                    schedule_strength: 20,
                    regional_context: 10,
                    verified_context: 10
                }),
                output_type: "DOMAIN_SCORE",
                score_range: Object.freeze({ minimum: 0, maximum: 100 }),
                confidence_behavior: "Verified competition context and opponent quality increase confidence; unclear or missing level context reduces confidence.",
                explanation_behavior: "Explain competition score through level, opponent quality, schedule strength, and verification signals.",
                insufficient_evidence_behavior: "Return null score with INSUFFICIENT_EVIDENCE status when competition level is missing.",
                generated_at_required: true
            }),

            ACADEMIC_MATRIX: Object.freeze({
                matrix_key: "ACADEMIC_MATRIX",
                matrix_name: "STATS-CORE Academic Matrix",
                matrix_domain: "ACADEMIC",
                matrix_version: "1.0.0",
                stream_owner: STREAM_OWNER,
                file_name: "statscore-academic-matrix.js",
                required_evidence: Object.freeze([
                    "athlete_id",
                    "snapshot_id",
                    "gpa"
                ]),
                optional_evidence: Object.freeze([
                    "core_gpa",
                    "test_scores",
                    "ncaa_status",
                    "naia_status",
                    "transcript_status",
                    "graduation_year"
                ]),
                weights: Object.freeze({
                    gpa_strength: 35,
                    eligibility_alignment: 30,
                    transcript_confidence: 15,
                    test_score_support: 10,
                    academic_trend: 10
                }),
                output_type: "DOMAIN_SCORE",
                score_range: Object.freeze({ minimum: 0, maximum: 100 }),
                confidence_behavior: "Transcript verification, eligibility records, and recency increase confidence; self-reported academics reduce confidence.",
                explanation_behavior: "Explain academic score using GPA, eligibility standing, transcript status, test scores, missing evidence, and academic risk factors.",
                insufficient_evidence_behavior: "Return null score with INSUFFICIENT_EVIDENCE status when GPA or academic basis is missing.",
                generated_at_required: true
            }),

            VERIFICATION_MATRIX: Object.freeze({
                matrix_key: "VERIFICATION_MATRIX",
                matrix_name: "STATS-CORE Verification Matrix",
                matrix_domain: "VERIFICATION",
                matrix_version: "1.0.0",
                stream_owner: STREAM_OWNER,
                file_name: "statscore-verification-matrix.js",
                required_evidence: Object.freeze([
                    "athlete_id",
                    "snapshot_id",
                    "verification_records"
                ]),
                optional_evidence: Object.freeze([
                    "coach_verification",
                    "parent_approval",
                    "evaluator_verification",
                    "media_verification",
                    "stat_source_verification"
                ]),
                weights: Object.freeze({
                    source_verification: 30,
                    role_verification: 25,
                    media_verification: 20,
                    parent_guardian_approval: 15,
                    conflict_resolution: 10
                }),
                output_type: "DOMAIN_SCORE",
                score_range: Object.freeze({ minimum: 0, maximum: 100 }),
                confidence_behavior: "Verification matrix directly supports confidence but remains separate from score calculation.",
                explanation_behavior: "Explain verification standing through verified sources, missing approvals, conflicts, and audit receipt quality.",
                insufficient_evidence_behavior: "Return null score with INSUFFICIENT_EVIDENCE status when no verification record exists.",
                generated_at_required: true
            })

        }),

        validateAuthority: function () {
            return Boolean(
                global.STATScoreStream9Authority &&
                global.STATScoreStream9Authority.stream_number === 9 &&
                global.STATScoreStream9Authority.operational_state === "ACTIVE"
            );
        },

        validateMatrixDoctrine: function () {
            return Boolean(
                global.STATScoreMatrixDoctrine &&
                global.STATScoreMatrixDoctrine.doctrine_key === "STATSCORE_MATRIX_DOCTRINE" &&
                global.STATScoreMatrixDoctrine.doctrine_status === "CANON_LOCKED"
            );
        },

        getMatrix: function (matrixKey) {
            return this.matrices[matrixKey] || null;
        },

        isRegistered: function (matrixKey) {
            return Boolean(this.matrices[matrixKey]);
        },

        isAuthorized: function (matrixKey) {
            const matrix = this.getMatrix(matrixKey);

            if (!matrix) {
                return false;
            }

            return Boolean(
                this.validateAuthority() &&
                this.validateMatrixDoctrine() &&
                matrix.stream_owner === STREAM_OWNER
            );
        },

        listMatrices: function () {
            return Object.keys(this.matrices);
        },

        listMatrixSummaries: function () {
            return Object.keys(this.matrices).map((key) => {
                const matrix = this.matrices[key];

                return {
                    matrix_key: matrix.matrix_key,
                    matrix_name: matrix.matrix_name,
                    matrix_domain: matrix.matrix_domain,
                    matrix_version: matrix.matrix_version,
                    file_name: matrix.file_name,
                    output_type: matrix.output_type,
                    authorized: this.isAuthorized(matrix.matrix_key)
                };
            });
        },

        validateRegisteredMatrix: function (matrixKey) {
            const matrix = this.getMatrix(matrixKey);

            if (!matrix) {
                return {
                    valid: false,
                    authorized: false,
                    status: "MATRIX_NOT_REGISTERED",
                    matrix_key: matrixKey
                };
            }

            const doctrine = global.STATScoreMatrixDoctrine;

            const contractValidation = doctrine && doctrine.validateMatrixContract
                ? doctrine.validateMatrixContract(matrix)
                : {
                    valid: false,
                    status: "MATRIX_DOCTRINE_NOT_AVAILABLE",
                    missing: ["STATScoreMatrixDoctrine"]
                };

            const weightValidation = doctrine && doctrine.validateWeights
                ? doctrine.validateWeights(matrix.weights)
                : {
                    valid: false,
                    total: 0,
                    expected: 100
                };

            return {
                valid: contractValidation.valid && weightValidation.valid,
                authorized: this.isAuthorized(matrixKey),
                status: contractValidation.valid && weightValidation.valid
                    ? "REGISTERED_MATRIX_VALID"
                    : "REGISTERED_MATRIX_INVALID",
                matrix_key: matrixKey,
                contract: contractValidation,
                weights: weightValidation
            };
        },

        validateAllMatrices: function () {
            const self = this;

            return Object.keys(this.matrices).map(function (matrixKey) {
                return self.validateRegisteredMatrix(matrixKey);
            });
        },

        getRegistryStatus: function () {
            return {
                registry_key: this.registry_key,
                registry_version: this.registry_version,
                doctrine_status: this.doctrine_status,
                stream_owner: this.stream_owner,
                authority_verified: this.validateAuthority(),
                matrix_doctrine_verified: this.validateMatrixDoctrine(),
                registered_matrices: this.listMatrices(),
                matrix_count: this.listMatrices().length
            };
        }

    };

    Object.freeze(STATScoreMatrixRegistry);

    global.STATScoreMatrixRegistry = STATScoreMatrixRegistry;

})(window); 
