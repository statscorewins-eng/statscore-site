/*!
* =============================================================================
* STATS-CORE™
* STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY
* MATRIX DOCTRINE
* -----------------------------------------------------------------------------
*
* File:
*     statscore-matrix-doctrine.js
*
* Doctrine:
*     STATSCORE_MATRIX_DOCTRINE
*
* Version:
*     1.0.0
*
* Stream Owner:
*     STATSCORE_STREAM_9
*
* Status:
*     CANON_LOCKED
*
* PURPOSE
* -----------------------------------------------------------------------------
* Define the constitutional laws governing every official STATS-CORE matrix.
*
* This file DOES NOT calculate athlete scores.
*
* It defines:
*
*     - what a governed matrix is;
*     - what a matrix must declare;
*     - how evidence must be treated;
*     - how weights must be governed;
*     - how score and confidence must remain separate;
*     - how verification affects trust;
*     - how missing evidence must fail closed;
*     - how official output must be structured;
*     - which statuses are lawful;
*     - how matrix versions must change;
*     - how registration and physical authority must agree.
*
* CONTROLLING CONSTITUTIONAL INVARIANT
* -----------------------------------------------------------------------------
*
* STATS-CORE evaluates:
*
*     WHAT THE ATHLETE DEMONSTRATED
*
* separately from:
*
*     HOW STRONGLY THE EVIDENCE CAN BE TRUSTED
*
* and only then publishes governed intelligence.
*
* Professional authority, certification, provenance, verification,
* completeness, recency, and conflict standing may affect confidence.
*
* They shall NEVER manufacture athletic or academic ability.
*
* =============================================================================
*/

(function (global) {
    'use strict';

    /*
    ===========================================================================
    CONSTANTS
    ===========================================================================
    */

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const DOCTRINE_KEY =
        "STATSCORE_MATRIX_DOCTRINE";

    const DOCTRINE_VERSION =
        "1.0.0";

    const DOCTRINE_STATUS =
        "CANON_LOCKED";

    /*
    ===========================================================================
    GOVERNED MATRIX STATUSES
    ===========================================================================
    */

    const ALLOWED_MATRIX_STATUSES =
        Object.freeze({

            SCORED: true,

            PROJECTED: true,

            UNVERIFIED: true,

            PENDING_VERIFICATION: true,

            INSUFFICIENT_EVIDENCE: true,

            MATRIX_UNAVAILABLE: true,

            MATRIX_UNAUTHORIZED: true,

            MATRIX_CONTRACT_INVALID: true,

            SOURCE_EVIDENCE_CONFLICT: true,

            STALE_EVIDENCE: true,

            COMPOSITE_PENDING: true,

            COMPOSITE_BLOCKED: true

        });

    /*
    ===========================================================================
    REQUIRED MATRIX CONTRACT
    ===========================================================================
    */

    const REQUIRED_MATRIX_CONTRACT =
        Object.freeze({

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

        });

    /*
    ===========================================================================
    REQUIRED MATRIX OUTPUT
    ===========================================================================
    */

    const REQUIRED_MATRIX_OUTPUT =
        Object.freeze({

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

        });

    /*
    ===========================================================================
    ALLOWED OUTPUT TYPES
    ===========================================================================
    */

    const ALLOWED_OUTPUT_TYPES =
        Object.freeze({

            DOMAIN_SCORE: true,

            DOMAIN_INTELLIGENCE: true,

            CONFIDENCE_SIGNAL: true,

            RECOMMENDATION_SIGNAL: true,

            PATHWAY_SIGNAL: true,

            RANKING_SUPPORT_SIGNAL: true,

            PROGRAM_FIT_SIGNAL: true

        });

    /*
    ===========================================================================
    ACTIVE SCORED MATRIX DOMAINS
    ---------------------------------------------------------------------------
    These are the presently registered scored Matrix domains.

    This list shall NOT be expanded merely because Stream 9 has eleven active
    intelligence lanes.
    ===========================================================================
    */

    const ACTIVE_SCORED_MATRIX_DOMAINS =
        Object.freeze({

            PRODUCTION: true,

            ATHLETIC: true,

            COMPETITION: true,

            ACADEMIC: true,

            VERIFICATION: true

        });

    /*
    ===========================================================================
    ACTIVE INTELLIGENCE LANES
    ---------------------------------------------------------------------------
    These eleven lanes exist in the current Scoring Science architecture.

    Not all eleven are automatically scored matrices.
    ===========================================================================
    */

    const ACTIVE_INTELLIGENCE_LANES =
        Object.freeze({

            ATHLETIC: true,

            PRODUCTION: true,

            ACADEMIC: true,

            EVALUATION: true,

            TRAINING: true,

            COMPETITION: true,

            VERIFICATION: true,

            EXPOSURE: true,

            READINESS: true,

            PATHWAY: true,

            CRYSTAL: true

        });

    /*
    ===========================================================================
    DOCTRINE
    ===========================================================================
    */

    const STATScoreMatrixDoctrine = {

        doctrine_key:
            DOCTRINE_KEY,

        stream_key:
            STREAM_OWNER,

        doctrine_name:
            "STATS-CORE Matrix Doctrine",

        version:
            DOCTRINE_VERSION,

        doctrine_status:
            DOCTRINE_STATUS,

        requires_authority:
            "STATScoreStream9Authority",

        requires_intelligence_doctrine:
            "STATScoreIntelligenceDoctrine",

        requires_score_doctrine:
            "STATScoreScoreDoctrine",

        /*
        =======================================================================
        MATRIX DEFINITION
        =======================================================================
        */

        matrix_definition:
            "A STATS-CORE matrix is a registered, versioned, evidence-governed Stream 9 scoring authority that declares required evidence, optional evidence, weighting logic, score range, confidence behavior, explainability requirements, failure behavior, and output contract before it may publish official domain intelligence.",

        /*
        =======================================================================
        MATRIX IS
        =======================================================================
        */

        matrix_is:
            Object.freeze({

                governed_model:
                    true,

                evidence_declared:
                    true,

                weighting_declared:
                    true,

                versioned:
                    true,

                confidence_aware:
                    true,

                explainability_required:
                    true,

                registry_required:
                    true,

                physical_authority_required:
                    true,

                audit_ready:
                    true,

                fail_closed:
                    true,

                attribution_preserving:
                    true

            }),

        /*
        =======================================================================
        MATRIX IS NOT
        =======================================================================
        */

        matrix_is_not:
            Object.freeze({

                dashboard_logic:
                    true,

                page_runtime_behavior:
                    true,

                raw_stat_display:
                    true,

                unregistered_formula:
                    true,

                hidden_weighting_system:
                    true,

                consumer_generated_score:
                    true,

                manual_override_tool:
                    true,

                professional_certification_engine:
                    true,

                publication_engine:
                    true,

                communication_engine:
                    true,

                runtime_recovery_engine:
                    true

            }),

        /*
        =======================================================================
        REQUIRED CONTRACT
        =======================================================================
        */

        required_matrix_contract:
            REQUIRED_MATRIX_CONTRACT,

        /*
        =======================================================================
        OUTPUT TYPES
        =======================================================================
        */

        allowed_output_types:
            ALLOWED_OUTPUT_TYPES,

        /*
        =======================================================================
        GOVERNED STATUSES
        =======================================================================
        */

        allowed_matrix_statuses:
            ALLOWED_MATRIX_STATUSES,

        /*
        =======================================================================
        OWNERSHIP RULES
        =======================================================================
        */

        ownership_rules:
            Object.freeze({

                stream_owner_required:
                    true,

                official_stream_owner:
                    STREAM_OWNER,

                non_stream_9_matrix_authority_allowed:
                    false,

                consumer_owned_matrices_allowed:
                    false,

                dashboard_owned_matrices_allowed:
                    false,

                professional_workspace_owned_matrices_allowed:
                    false,

                crystal_owned_athlete_scoring_allowed:
                    false

            }),

        /*
        =======================================================================
        DOMAIN RULES
        =======================================================================
        */

        domain_rules:
            Object.freeze({

                active_scored_matrix_domains:
                    ACTIVE_SCORED_MATRIX_DOMAINS,

                active_intelligence_lanes:
                    ACTIVE_INTELLIGENCE_LANES,

                all_intelligence_lanes_are_matrices:
                    false,

                character_intelligence_active:
                    false,

                character_matrix_allowed:
                    false,

                domain_authority_must_be_explicit:
                    true,

                one_domain_one_source_authority:
                    true

            }),

        /*
        =======================================================================
        VERSIONING RULES
        =======================================================================
        */

        versioning_rules:
            Object.freeze({

                matrix_version_required:
                    true,

                doctrine_version_required:
                    true,

                registry_version_required:
                    true,

                weight_change_requires_version_change:
                    true,

                evidence_requirement_change_requires_version_change:
                    true,

                optional_evidence_semantic_change_requires_version_change:
                    true,

                output_contract_change_requires_version_change:
                    true,

                confidence_behavior_change_requires_version_change:
                    true,

                score_interpretation_change_requires_version_change:
                    true,

                benchmark_science_change_requires_version_change:
                    true,

                threshold_change_requires_version_change:
                    true,

                silent_production_mutation_allowed:
                    false

            }),

        /*
        =======================================================================
        EVIDENCE RULES
        =======================================================================
        */

        evidence_rules:
            Object.freeze({

                required_evidence_must_be_declared:
                    true,

                optional_evidence_must_be_declared:
                    true,

                missing_required_evidence_must_be_flagged:
                    true,

                missing_required_evidence_must_return_null_score:
                    true,

                missing_required_evidence_may_be_converted_to_zero:
                    false,

                missing_intelligence_may_be_converted_to_zero:
                    false,

                optional_evidence_may_adjust_confidence:
                    true,

                unverifiable_evidence_must_reduce_confidence:
                    true,

                self_reported_evidence_may_reduce_confidence:
                    true,

                conflicting_evidence_must_be_flagged:
                    true,

                stale_evidence_must_reduce_confidence:
                    true,

                evidence_consumed_must_be_reported:
                    true,

                missing_evidence_must_be_reported:
                    true,

                source_truth_may_be_mutated:
                    false

            }),

        /*
        =======================================================================
        SCORE / CONFIDENCE SEPARATION
        =======================================================================
        */

        score_confidence_rules:
            Object.freeze({

                score_and_confidence_are_distinct:
                    true,

                verification_may_change_confidence:
                    true,

                verification_may_change_physical_measurement:
                    false,

                verification_may_change_academic_fact:
                    false,

                certification_may_change_athletic_score:
                    false,

                certification_may_change_academic_score:
                    false,

                professional_authority_may_change_ability:
                    false,

                provenance_may_inform_confidence:
                    true,

                conflict_may_inform_confidence:
                    true,

                recency_may_inform_confidence:
                    true,

                missing_evidence_may_inform_confidence:
                    true

            }),

        /*
        =======================================================================
        CERTIFICATION SEPARATION
        =======================================================================
        */

        certification_rules:
            Object.freeze({

                certification_owner:
                    "STATSCORE_STREAM_10",

                certification_consumption_allowed:
                    true,

                certification_ownership_transfer_allowed:
                    false,

                certification_may_establish_professional_authority:
                    true,

                certification_may_support_provenance:
                    true,

                certification_may_support_verification:
                    true,

                certification_may_support_confidence:
                    true,

                certification_may_increase_athlete_ability:
                    false,

                certification_may_increase_gpa:
                    false,

                certification_may_increase_production:
                    false,

                certification_count_may_increase_score:
                    false

            }),

        /*
        =======================================================================
        WEIGHTING RULES
        =======================================================================
        */

        weighting_rules:
            Object.freeze({

                weights_must_be_declared:
                    true,

                weights_must_sum_to_expected_total:
                    true,

                default_expected_total:
                    100,

                hidden_weights_allowed:
                    false,

                consumer_weight_adjustment_allowed:
                    false,

                dashboard_weight_adjustment_allowed:
                    false,

                unregistered_average_allowed:
                    false,

                guessed_composite_weights_allowed:
                    false,

                legacy_weights_may_silently_override_registry:
                    false

            }),

        /*
        =======================================================================
        PROJECTED VS OFFICIAL
        =======================================================================
        */

        projection_rules:
            Object.freeze({

                projected_intelligence_allowed:
                    true,

                projected_intelligence_must_be_labeled:
                    true,

                projected_intelligence_may_be_marked_projected:
                    true,

                projected_intelligence_may_be_marked_unverified:
                    true,

                projected_intelligence_may_be_marked_provisional:
                    true,

                projected_score_may_silently_become_official:
                    false,

                official_score_requires_registered_matrix:
                    true,

                official_score_requires_required_evidence:
                    true,

                official_score_requires_matrix_version:
                    true,

                official_score_requires_doctrine_version:
                    true,

                official_score_requires_confidence:
                    true,

                official_score_requires_explanation:
                    true,

                official_score_requires_stream_9_publication:
                    true

            }),

        /*
        =======================================================================
        EXECUTION RULES
        =======================================================================
        */

        execution_rules:
            Object.freeze({

                matrix_does_not_render_pages:
                    true,

                matrix_does_not_route_users:
                    true,

                matrix_does_not_create_dashboards:
                    true,

                matrix_does_not_send_messages:
                    true,

                matrix_does_not_create_crystal_reports:
                    true,

                matrix_does_not_authenticate_users:
                    true,

                matrix_does_not_restore_runtime:
                    true,

                matrix_returns_structured_output:
                    true,

                matrix_fails_closed:
                    true,

                matrix_must_not_invent_missing_authority:
                    true

            }),

        /*
        =======================================================================
        REQUIRED OUTPUT
        =======================================================================
        */

        required_matrix_output:
            REQUIRED_MATRIX_OUTPUT,

        /*
        =======================================================================
        OUTPUT RULES
        =======================================================================
        */

        output_rules:
            Object.freeze({

                naked_numeric_score_is_official_intelligence:
                    false,

                explanation_required_for_official_score:
                    true,

                confidence_required_for_official_score:
                    true,

                evidence_used_required:
                    true,

                missing_evidence_required:
                    true,

                generated_at_required:
                    true,

                matrix_version_required:
                    true,

                doctrine_version_required:
                    true,

                athlete_identity_required:
                    true,

                snapshot_identity_required:
                    true,

                null_score_must_remain_null:
                    true

            }),

        /*
        =======================================================================
        OFFICIAL MATRIX RULE
        =======================================================================
        */

        official_matrix_rule:
            "No matrix may publish official STATS-CORE intelligence unless it is registered in the Stream 9 Matrix Registry, owned by Stream 9, contract-valid, physically available, and operating under the locked Matrix Doctrine.",

        /*
        =======================================================================
        GOVERNED FAILURE STATES
        =======================================================================
        */

        unauthorized_matrix_status:
            "MATRIX_UNAUTHORIZED",

        invalid_matrix_status:
            "MATRIX_CONTRACT_INVALID",

        unavailable_matrix_status:
            "MATRIX_UNAVAILABLE",

        insufficient_evidence_status:
            "INSUFFICIENT_EVIDENCE",

        source_conflict_status:
            "SOURCE_EVIDENCE_CONFLICT",

        stale_evidence_status:
            "STALE_EVIDENCE",

        /*
        =======================================================================
        AUTHORITY VALIDATION
        =======================================================================
        */

        validateAuthority:
            function () {

                return Boolean(

                    global
                        .STATScoreStream9Authority &&

                    global
                        .STATScoreStream9Authority
                        .stream_number ===
                        9 &&

                    global
                        .STATScoreStream9Authority
                        .operational_state ===
                        "ACTIVE"

                );

            },

        /*
        =======================================================================
        INTELLIGENCE DOCTRINE VALIDATION
        =======================================================================
        */

        validateIntelligenceDoctrine:
            function () {

                return Boolean(

                    global
                        .STATScoreIntelligenceDoctrine &&

                    global
                        .STATScoreIntelligenceDoctrine
                        .doctrine_status ===
                        "CANON_LOCKED"

                );

            },

        /*
        =======================================================================
        SCORE DOCTRINE VALIDATION
        =======================================================================
        */

        validateScoreDoctrine:
            function () {

                return Boolean(

                    global
                        .STATScoreScoreDoctrine &&

                    global
                        .STATScoreScoreDoctrine
                        .doctrine_key ===
                        "STATSCORE_SCORE_DOCTRINE" &&

                    global
                        .STATScoreScoreDoctrine
                        .doctrine_status ===
                        "CANON_LOCKED"

                );

            },

        /*
        =======================================================================
        MATRIX CONTRACT VALIDATION
        =======================================================================
        */

        validateMatrixContract:
            function (
                matrix
            ) {

                if (
                    !matrix ||
                    typeof matrix !==
                        "object"
                ) {

                    return {

                        valid:
                            false,

                        status:
                            this
                                .invalid_matrix_status,

                        missing: [
                            "matrix_object"
                        ],

                        violations: []

                    };

                }

                const missing =
                    [];

                const violations =
                    [];

                const doctrine =
                    this;

                Object.keys(
                    this
                        .required_matrix_contract
                ).forEach(
                    function (
                        key
                    ) {

                        if (
                            matrix[key] ===
                                undefined ||
                            matrix[key] ===
                                null
                        ) {

                            missing.push(
                                key
                            );

                        }

                    }
                );

                /*
                ---------------------------------------------------------------
                OWNER
                ---------------------------------------------------------------
                */

                if (
                    matrix
                        .stream_owner !==
                    this
                        .ownership_rules
                        .official_stream_owner
                ) {

                    violations.push(
                        "INVALID_STREAM_OWNER"
                    );

                }

                /*
                ---------------------------------------------------------------
                OUTPUT TYPE
                ---------------------------------------------------------------
                */

                if (
                    !this
                        .allowed_output_types[
                            matrix
                                .output_type
                        ]
                ) {

                    violations.push(
                        "INVALID_OUTPUT_TYPE"
                    );

                }

                /*
                ---------------------------------------------------------------
                EVIDENCE DECLARATIONS
                ---------------------------------------------------------------
                */

                if (
                    matrix
                        .required_evidence &&
                    !Array.isArray(
                        matrix
                            .required_evidence
                    )
                ) {

                    violations.push(
                        "REQUIRED_EVIDENCE_NOT_ARRAY"
                    );

                }

                if (
                    matrix
                        .optional_evidence &&
                    !Array.isArray(
                        matrix
                            .optional_evidence
                    )
                ) {

                    violations.push(
                        "OPTIONAL_EVIDENCE_NOT_ARRAY"
                    );

                }

                /*
                ---------------------------------------------------------------
                WEIGHTS
                ---------------------------------------------------------------
                */

                const weightValidation =
                    this
                        .validateWeights(
                            matrix.weights
                        );

                if (
                    !weightValidation
                        .valid
                ) {

                    violations.push(
                        "INVALID_WEIGHT_TOTAL"
                    );

                }

                /*
                ---------------------------------------------------------------
                SCORE RANGE
                ---------------------------------------------------------------
                */

                const scoreRange =
                    matrix
                        .score_range;

                if (
                    !scoreRange ||
                    typeof scoreRange !==
                        "object"
                ) {

                    violations.push(
                        "INVALID_SCORE_RANGE"
                    );

                } else {

                    const minimum =
                        Number(
                            scoreRange
                                .minimum ??
                            scoreRange
                                .min
                        );

                    const maximum =
                        Number(
                            scoreRange
                                .maximum ??
                            scoreRange
                                .max
                        );

                    if (
                        !Number.isFinite(
                            minimum
                        ) ||
                        !Number.isFinite(
                            maximum
                        ) ||
                        minimum !== 0 ||
                        maximum !== 100
                    ) {

                        violations.push(
                            "INVALID_SCORE_RANGE"
                        );

                    }

                }

                /*
                ---------------------------------------------------------------
                CHARACTER INTELLIGENCE
                ---------------------------------------------------------------
                */

                if (
                    String(
                        matrix
                            .matrix_domain ||
                        ""
                    )
                        .toUpperCase() ===
                    "CHARACTER"
                ) {

                    violations.push(
                        "CHARACTER_INTELLIGENCE_INACTIVE"
                    );

                }

                /*
                ---------------------------------------------------------------
                RESULT
                ---------------------------------------------------------------
                */

                const valid =
                    missing.length ===
                        0 &&
                    violations.length ===
                        0;

                return {

                    valid,

                    status:
                        valid

                            ? "VALID_MATRIX_CONTRACT"

                            : doctrine
                                .invalid_matrix_status,

                    missing,

                    violations,

                    weights:
                        weightValidation

                };

            },

        /*
        =======================================================================
        WEIGHT VALIDATION
        =======================================================================
        */

        validateWeights:
            function (
                weights,
                expectedTotal
            ) {

                const expected =
                    expectedTotal ??
                    this
                        .weighting_rules
                        .default_expected_total;

                if (
                    !weights ||
                    typeof weights !==
                        "object" ||
                    Array.isArray(
                        weights
                    )
                ) {

                    return {

                        valid:
                            false,

                        total:
                            0,

                        expected,

                        invalid_keys: [
                            "weights"
                        ]

                    };

                }

                const invalidKeys =
                    [];

                let total =
                    0;

                Object.keys(
                    weights
                ).forEach(
                    function (
                        key
                    ) {

                        const value =
                            Number(
                                weights[
                                    key
                                ]
                            );

                        if (
                            !Number.isFinite(
                                value
                            )
                        ) {

                            invalidKeys.push(
                                key
                            );

                            return;

                        }

                        if (
                            value < 0
                        ) {

                            invalidKeys.push(
                                key
                            );

                            return;

                        }

                        total +=
                            value;

                    }
                );

                const valid =
                    invalidKeys.length ===
                        0 &&
                    Math.abs(
                        total -
                        expected
                    ) <
                    0.0001;

                return {

                    valid,

                    total:
                        Number(
                            total
                                .toFixed(
                                    4
                                )
                        ),

                    expected,

                    invalid_keys:
                        invalidKeys

                };

            },

        /*
        =======================================================================
        MATRIX OUTPUT VALIDATION
        =======================================================================
        */

        validateMatrixOutput:
            function (
                output,
                registeredMatrix
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
                            "INVALID_MATRIX_OUTPUT",

                        missing: [
                            "output_object"
                        ],

                        violations: []

                    };

                }

                const missing =
                    [];

                const violations =
                    [];

                Object.keys(
                    this
                        .required_matrix_output
                ).forEach(
                    function (
                        key
                    ) {

                        if (
                            output[
                                key
                            ] ===
                                undefined
                        ) {

                            missing.push(
                                key
                            );

                        }

                    }
                );

                /*
                ---------------------------------------------------------------
                STATUS
                ---------------------------------------------------------------
                */

                if (
                    output.status &&
                    !this
                        .allowed_matrix_statuses[
                            output
                                .status
                        ]
                ) {

                    violations.push(
                        "INVALID_MATRIX_STATUS"
                    );

                }

                /*
                ---------------------------------------------------------------
                IDENTITY
                ---------------------------------------------------------------
                */

                if (
                    !output
                        .athlete_id
                ) {

                    violations.push(
                        "ATHLETE_ID_REQUIRED"
                    );

                }

                if (
                    !output
                        .snapshot_id
                ) {

                    violations.push(
                        "SNAPSHOT_ID_REQUIRED"
                    );

                }

                /*
                ---------------------------------------------------------------
                OFFICIAL SCORED OUTPUT
                ---------------------------------------------------------------
                */

                if (
                    output.status ===
                        "SCORED"
                ) {

                    if (
                        output.score ===
                            null ||
                        !Number.isFinite(
                            Number(
                                output
                                    .score
                            )
                        )
                    ) {

                        violations.push(
                            "SCORED_STATUS_REQUIRES_NUMERIC_SCORE"
                        );

                    }

                    if (
                        !Number.isFinite(
                            Number(
                                output
                                    .confidence
                            )
                        )
                    ) {

                        violations.push(
                            "SCORED_STATUS_REQUIRES_CONFIDENCE"
                        );

                    }

                    if (
                        output
                            .explanation ==
                            null
                    ) {

                        violations.push(
                            "SCORED_STATUS_REQUIRES_EXPLANATION"
                        );

                    }

                }

                /*
                ---------------------------------------------------------------
                FAIL-CLOSED STATES
                ---------------------------------------------------------------
                */

                const nullScoreStatuses =
                    [

                        "INSUFFICIENT_EVIDENCE",

                        "MATRIX_UNAVAILABLE",

                        "MATRIX_UNAUTHORIZED",

                        "MATRIX_CONTRACT_INVALID",

                        "COMPOSITE_PENDING",

                        "COMPOSITE_BLOCKED"

                    ];

                if (
                    nullScoreStatuses
                        .includes(
                            output.status
                        ) &&
                    output.score !==
                        null
                ) {

                    violations.push(
                        "FAIL_CLOSED_STATUS_REQUIRES_NULL_SCORE"
                    );

                }

                /*
                ---------------------------------------------------------------
                SCORE RANGE
                ---------------------------------------------------------------
                */

                if (
                    output.score !==
                        null &&
                    output.score !==
                        undefined
                ) {

                    const score =
                        Number(
                            output.score
                        );

                    if (
                        !Number.isFinite(
                            score
                        ) ||
                        score < 0 ||
                        score > 100
                    ) {

                        violations.push(
                            "SCORE_OUT_OF_RANGE"
                        );

                    }

                }

                /*
                ---------------------------------------------------------------
                CONFIDENCE RANGE
                ---------------------------------------------------------------
                */

                if (
                    output.confidence !==
                        null &&
                    output.confidence !==
                        undefined
                ) {

                    const confidence =
                        Number(
                            output
                                .confidence
                        );

                    if (
                        !Number.isFinite(
                            confidence
                        ) ||
                        confidence < 0 ||
                        confidence > 100
                    ) {

                        violations.push(
                            "CONFIDENCE_OUT_OF_RANGE"
                        );

                    }

                }

                /*
                ---------------------------------------------------------------
                EVIDENCE ARRAYS
                ---------------------------------------------------------------
                */

                if (
                    output
                        .evidence_used !==
                        undefined &&
                    !Array.isArray(
                        output
                            .evidence_used
                    )
                ) {

                    violations.push(
                        "EVIDENCE_USED_NOT_ARRAY"
                    );

                }

                if (
                    output
                        .missing_evidence !==
                        undefined &&
                    !Array.isArray(
                        output
                            .missing_evidence
                    )
                ) {

                    violations.push(
                        "MISSING_EVIDENCE_NOT_ARRAY"
                    );

                }

                if (
                    output
                        .flags !==
                        undefined &&
                    !Array.isArray(
                        output.flags
                    )
                ) {

                    violations.push(
                        "FLAGS_NOT_ARRAY"
                    );

                }

                /*
                ---------------------------------------------------------------
                REGISTERED MATRIX CONSISTENCY
                ---------------------------------------------------------------
                */

                if (
                    registeredMatrix
                ) {

                    if (
                        output
                            .matrix_key !==
                        registeredMatrix
                            .matrix_key
                    ) {

                        violations.push(
                            "OUTPUT_MATRIX_KEY_MISMATCH"
                        );

                    }

                    if (
                        output
                            .matrix_version !==
                        registeredMatrix
                            .matrix_version
                    ) {

                        violations.push(
                            "OUTPUT_MATRIX_VERSION_MISMATCH"
                        );

                    }

                    if (
                        output
                            .domain !==
                        registeredMatrix
                            .matrix_domain
                    ) {

                        violations.push(
                            "OUTPUT_DOMAIN_MISMATCH"
                        );

                    }

                }

                const valid =
                    missing.length ===
                        0 &&
                    violations.length ===
                        0;

                return {

                    valid,

                    status:
                        valid

                            ? "VALID_MATRIX_OUTPUT"

                            : "INVALID_MATRIX_OUTPUT",

                    missing,

                    violations

                };

            },

        /*
        =======================================================================
        REGISTRATION VALIDATION
        =======================================================================
        */

        validateRegistration:
            function (
                matrixKey
            ) {

                const registry =
                    global
                        .STATScoreMatrixRegistry;

                if (
                    !registry
                ) {

                    return {

                        valid:
                            false,

                        status:
                            "MATRIX_REGISTRY_UNAVAILABLE"

                    };

                }

                const matrix =
                    registry
                        .getMatrix
                        ? registry
                            .getMatrix(
                                matrixKey
                            )
                        : null;

                if (!matrix) {

                    return {

                        valid:
                            false,

                        status:
                            "MATRIX_NOT_REGISTERED",

                        matrix_key:
                            matrixKey

                    };

                }

                const contract =
                    this
                        .validateMatrixContract(
                            matrix
                        );

                return {

                    valid:
                        contract.valid,

                    status:
                        contract.valid

                            ? "MATRIX_REGISTRATION_VALID"

                            : "MATRIX_REGISTRATION_INVALID",

                    matrix_key:
                        matrixKey,

                    contract

                };

            },

        /*
        =======================================================================
        OFFICIAL RELEASE ELIGIBILITY
        =======================================================================
        */

        validateOfficialRelease:
            function ({
                matrix_key,
                output
            } = {}) {

                const failures =
                    [];

                /*
                ---------------------------------------------------------------
                STREAM 9 AUTHORITY
                ---------------------------------------------------------------
                */

                if (
                    !this
                        .validateAuthority()
                ) {

                    failures.push(
                        "STREAM_9_AUTHORITY_UNAVAILABLE"
                    );

                }

                /*
                ---------------------------------------------------------------
                SCORE DOCTRINE
                ---------------------------------------------------------------
                */

                if (
                    !this
                        .validateScoreDoctrine()
                ) {

                    failures.push(
                        "SCORE_DOCTRINE_UNAVAILABLE"
                    );

                }

                /*
                ---------------------------------------------------------------
                REGISTRATION
                ---------------------------------------------------------------
                */

                const registration =
                    this
                        .validateRegistration(
                            matrix_key
                        );

                if (
                    !registration
                        .valid
                ) {

                    failures.push(
                        "MATRIX_REGISTRATION_INVALID"
                    );

                }

                /*
                ---------------------------------------------------------------
                PHYSICAL MATRIX
                ---------------------------------------------------------------
                */

                const registry =
                    global
                        .STATScoreMatrixRegistry;

                let physical =
                    null;

                if (
                    registry &&
                    typeof registry
                        .validatePhysicalMatrix ===
                        "function"
                ) {

                    physical =
                        registry
                            .validatePhysicalMatrix(
                                matrix_key
                            );

                    if (
                        !physical
                            .valid
                    ) {

                        failures.push(
                            "MATRIX_PHYSICAL_CONTRACT_INVALID"
                        );

                    }

                } else {

                    failures.push(
                        "MATRIX_PHYSICAL_VALIDATION_UNAVAILABLE"
                    );

                }

                /*
                ---------------------------------------------------------------
                OUTPUT
                ---------------------------------------------------------------
                */

                const registeredMatrix =
                    registry &&
                    registry.getMatrix
                        ? registry
                            .getMatrix(
                                matrix_key
                            )
                        : null;

                const outputValidation =
                    this
                        .validateMatrixOutput(
                            output,
                            registeredMatrix
                        );

                if (
                    !outputValidation
                        .valid
                ) {

                    failures.push(
                        "MATRIX_OUTPUT_INVALID"
                    );

                }

                /*
                ---------------------------------------------------------------
                RELEASE RESULT
                ---------------------------------------------------------------
                */

                return {

                    valid:
                        failures.length ===
                        0,

                    status:
                        failures.length ===
                        0

                            ? "OFFICIAL_MATRIX_RELEASE_ALLOWED"

                            : "OFFICIAL_MATRIX_RELEASE_BLOCKED",

                    matrix_key,

                    failures,

                    registration,

                    physical,

                    output:
                        outputValidation

                };

            },

        /*
        =======================================================================
        DOCTRINE STATUS
        =======================================================================
        */

        getDoctrineStatus:
            function () {

                return {

                    doctrine_key:
                        this
                            .doctrine_key,

                    version:
                        this.version,

                    doctrine_status:
                        this
                            .doctrine_status,

                    authority_verified:
                        this
                            .validateAuthority(),

                    intelligence_doctrine_verified:
                        this
                            .validateIntelligenceDoctrine(),

                    score_doctrine_verified:
                        this
                            .validateScoreDoctrine(),

                    active_scored_matrix_domains:
                        Object.keys(
                            ACTIVE_SCORED_MATRIX_DOMAINS
                        ),

                    active_intelligence_lanes:
                        Object.keys(
                            ACTIVE_INTELLIGENCE_LANES
                        ),

                    character_intelligence_active:
                        false,

                    official_matrix_rule:
                        this
                            .official_matrix_rule

                };

            }

    };

    /*
    ===========================================================================
    FREEZE DOCTRINE
    ===========================================================================
    */

    Object.freeze(
        STATScoreMatrixDoctrine
    );

    /*
    ===========================================================================
    PUBLIC AUTHORITY
    ===========================================================================
    */

    global.STATScoreMatrixDoctrine =
        STATScoreMatrixDoctrine;

    /*
    ===========================================================================
    CANONICAL NAMESPACE
    ===========================================================================
    */

    global.STATScore =
        global.STATScore ||
        {};

    global.STATScore.MatrixDoctrine =
        STATScoreMatrixDoctrine;

    /*
    ===========================================================================
    LOAD RECEIPT
    ===========================================================================
    */

    console.info(
        "[STATS-CORE][STREAM 9] Matrix Doctrine v1.0.0 loaded — fail-closed matrix governance active."
    );

})(
    typeof window !==
        "undefined"
        ? window
        : globalThis
); 
