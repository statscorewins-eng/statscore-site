/*!
* =============================================================================
* STATS-CORE™
* STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY
* MATRIX REGISTRY
* -----------------------------------------------------------------------------
*
* File:
*     statscore-matrix-registry.js
*
* Registry:
*     STATSCORE_MATRIX_REGISTRY
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
* Register, validate, authorize, and expose every official scored Matrix
* presently governed by Stream 9.
*
* THIS FILE DOES NOT CALCULATE SCORES.
*
* The Matrix Registry establishes:
*
*     - which scored matrices are official;
*     - which Stream owns them;
*     - which file physically implements them;
*     - required evidence;
*     - optional evidence;
*     - locked weights;
*     - output contracts;
*     - confidence doctrine;
*     - insufficient-evidence behavior;
*     - physical authority expectations.
*
* CONSTITUTIONAL RULE
* -----------------------------------------------------------------------------
*
* Registered
* ≠
* Loaded
* ≠
* Authorized
* ≠
* Contract Valid
*
* A matrix is production-authorized only when:
*
*     1. Stream 9 Authority is available;
*     2. Matrix Doctrine is available and locked;
*     3. Matrix is registered;
*     4. Registered contract is valid;
*     5. Registered weights total 100;
*     6. Physical matrix authority exists;
*     7. Physical authority contract matches the registry;
*     8. Physical authority health requirements pass.
*
* ACTIVE SCORED MATRICES
* -----------------------------------------------------------------------------
*
*     PRODUCTION_MATRIX
*     ATHLETIC_MATRIX
*     COMPETITION_MATRIX
*     ACADEMIC_MATRIX
*     VERIFICATION_MATRIX
*
* IMPORTANT DOMAIN RECONCILIATION RULE
* -----------------------------------------------------------------------------
*
* Stream 9 presently recognizes eleven active intelligence lanes:
*
*     Athletic
*     Production
*     Academic
*     Evaluation
*     Training
*     Competition
*     Verification
*     Exposure
*     Readiness
*     Pathway
*     Crystal
*
* This registry does NOT assume that all eleven are scored matrices.
*
* Evaluation, Training, Exposure, Readiness, Pathway, and Crystal shall not be
* added here merely for numerical symmetry. Each must first be constitutionally
* classified as:
*
*     SCORED MATRIX
*     STRUCTURED INTELLIGENCE AUTHORITY
*     DERIVED INTELLIGENCE PRODUCT
*     CONSUMER-ONLY DOMAIN
*
* No unapproved matrix is authorized by this Registry.
*
* Character Intelligence is inactive and shall not be registered.
* =============================================================================
*/

(function (global) {
    'use strict';

    /*
    ===========================================================================
    REGISTRY CONSTANTS
    ===========================================================================
    */

    const STREAM_OWNER = "STATSCORE_STREAM_9";

    const REGISTRY_KEY = "STATSCORE_MATRIX_REGISTRY";

    const REGISTRY_VERSION = "1.0.0";

    const DOCTRINE_STATUS = "CANON_LOCKED";

    /*
    ===========================================================================
    PHYSICAL AUTHORITY MAP
    ---------------------------------------------------------------------------
    Registry declaration and physical runtime authority are deliberately
    separate concepts.
    ===========================================================================
    */

    const PHYSICAL_AUTHORITIES = Object.freeze({

        PRODUCTION_MATRIX:
            "STATScoreProductionMatrix",

        ATHLETIC_MATRIX:
            "STATScoreAthleticMatrix",

        COMPETITION_MATRIX:
            "STATScoreCompetitionMatrix",

        ACADEMIC_MATRIX:
            "STATScoreAcademicMatrix",

        VERIFICATION_MATRIX:
            "STATScoreVerificationMatrix"

    });

    /*
    ===========================================================================
    REGISTERED MATRIX CONTRACTS
    ===========================================================================
    */

    const MATRICES = Object.freeze({

        /*
        =======================================================================
        PRODUCTION MATRIX
        =======================================================================
        */

        PRODUCTION_MATRIX: Object.freeze({

            matrix_key:
                "PRODUCTION_MATRIX",

            matrix_name:
                "STATS-CORE Production Matrix",

            matrix_domain:
                "PRODUCTION",

            matrix_version:
                "1.0.0",

            stream_owner:
                STREAM_OWNER,

            file_name:
                "statscore-production-matrix.js",

            required_evidence: Object.freeze([
                "athlete_id",
                "snapshot_id",
                "sport",
                "position",
                "season_records"
            ]),

            optional_evidence: Object.freeze([
                "game_records",
                "verified_statistics",
                "stat_source_verification",
                "coach_recognition",
                "league_recognition",
                "postseason_recognition",
                "role_history",
                "competition_context"
            ]),

            weights: Object.freeze({

                production_volume:
                    30,

                production_efficiency:
                    25,

                season_consistency:
                    20,

                role_context:
                    15,

                verified_recognition:
                    10

            }),

            output_type:
                "DOMAIN_SCORE",

            score_range: Object.freeze({
                minimum: 0,
                maximum: 100
            }),

            confidence_behavior:
                "Evidence sufficiency, verification standing, season completeness, recency, provenance, and conflicts govern confidence independently from demonstrated production.",

            explanation_behavior:
                "Explain production through governed season evidence, sport/position context, production components, missing evidence, verification standing, confidence factors, matrix version, and doctrine version.",

            insufficient_evidence_behavior:
                "Return score:null with INSUFFICIENT_EVIDENCE when required production evidence or required production component determinations are unavailable.",

            score_confidence_separation:
                true,

            projection_separation:
                true,

            generated_at_required:
                true

        }),

        /*
        =======================================================================
        ATHLETIC MATRIX
        =======================================================================
        */

        ATHLETIC_MATRIX: Object.freeze({

            matrix_key:
                "ATHLETIC_MATRIX",

            matrix_name:
                "STATS-CORE Athletic Matrix",

            matrix_domain:
                "ATHLETIC",

            matrix_version:
                "1.0.0",

            stream_owner:
                STREAM_OWNER,

            file_name:
                "statscore-athletic-matrix.js",

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

                position_athletic_fit:
                    30,

                verified_measurables:
                    25,

                movement_profile:
                    20,

                strength_profile:
                    15,

                physical_trajectory:
                    10

            }),

            output_type:
                "DOMAIN_SCORE",

            score_range: Object.freeze({
                minimum: 0,
                maximum: 100
            }),

            confidence_behavior:
                "Verification, evidence recency, provenance, completeness, conflicts, and benchmark support govern confidence independently from physical performance.",

            explanation_behavior:
                "Explain Athletic Intelligence through sport/position benchmark evidence, measurable components, missing evidence, matrix weights, verification standing, confidence factors, matrix version, and doctrine version.",

            insufficient_evidence_behavior:
                "Return score:null with INSUFFICIENT_EVIDENCE when required athletic evidence or required benchmark component determinations are unavailable.",

            score_confidence_separation:
                true,

            generated_at_required:
                true

        }),

        /*
        =======================================================================
        COMPETITION MATRIX
        =======================================================================
        */

        COMPETITION_MATRIX: Object.freeze({

            matrix_key:
                "COMPETITION_MATRIX",

            matrix_name:
                "STATS-CORE Competition Matrix",

            matrix_domain:
                "COMPETITION",

            matrix_version:
                "1.0.0",

            stream_owner:
                STREAM_OWNER,

            file_name:
                "statscore-competition-matrix.js",

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

                competition_level:
                    35,

                opponent_quality:
                    25,

                schedule_strength:
                    20,

                regional_context:
                    10,

                verified_context:
                    10

            }),

            output_type:
                "DOMAIN_SCORE",

            score_range: Object.freeze({
                minimum: 0,
                maximum: 100
            }),

            confidence_behavior:
                "Competition-context verification, recency, opponent evidence, schedule evidence, and conflicts govern confidence independently from athlete ability or production.",

            explanation_behavior:
                "Explain Competition Intelligence through level, opponent quality, schedule strength, regional context, verification standing, evidence gaps, matrix version, and doctrine version.",

            insufficient_evidence_behavior:
                "Return score:null with INSUFFICIENT_EVIDENCE when competition level or required competition component determinations are unavailable.",

            athlete_performance_isolation:
                true,

            generated_at_required:
                true

        }),

        /*
        =======================================================================
        ACADEMIC MATRIX
        =======================================================================
        */

        ACADEMIC_MATRIX: Object.freeze({

            matrix_key:
                "ACADEMIC_MATRIX",

            matrix_name:
                "STATS-CORE Academic Matrix",

            matrix_domain:
                "ACADEMIC",

            matrix_version:
                "1.0.0",

            stream_owner:
                STREAM_OWNER,

            file_name:
                "statscore-academic-matrix.js",

            required_evidence: Object.freeze([
                "athlete_id",
                "snapshot_id",
                "gpa"
            ]),

            optional_evidence: Object.freeze([
                "eligibility_status",
                "transcript_status",
                "transcript_record",
                "test_scores",
                "academic_history",
                "academic_trend",
                "counselor_context"
            ]),

            weights: Object.freeze({

                gpa_strength:
                    35,

                eligibility_alignment:
                    30,

                transcript_confidence:
                    15,

                test_score_support:
                    10,

                academic_trend:
                    10

            }),

            output_type:
                "DOMAIN_SCORE",

            score_range: Object.freeze({
                minimum: 0,
                maximum: 100
            }),

            confidence_behavior:
                "Transcript provenance, record verification, recency, completeness, self-reporting, and conflict status govern confidence independently from academic performance.",

            explanation_behavior:
                "Explain Academic Intelligence through GPA, eligibility alignment, transcript evidence, test-score support, academic trend, missing evidence, confidence factors, matrix version, and doctrine version.",

            insufficient_evidence_behavior:
                "Return score:null with INSUFFICIENT_EVIDENCE when GPA or required academic component determinations are unavailable.",

            academic_verification_separation:
                true,

            eligibility_performance_separation:
                true,

            generated_at_required:
                true

        }),

        /*
        =======================================================================
        VERIFICATION MATRIX
        =======================================================================
        */

        VERIFICATION_MATRIX: Object.freeze({

            matrix_key:
                "VERIFICATION_MATRIX",

            matrix_name:
                "STATS-CORE Verification Matrix",

            matrix_domain:
                "VERIFICATION",

            matrix_version:
                "1.0.0",

            stream_owner:
                STREAM_OWNER,

            file_name:
                "statscore-verification-matrix.js",

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

                source_verification:
                    30,

                role_verification:
                    25,

                media_verification:
                    20,

                parent_guardian_approval:
                    15,

                conflict_resolution:
                    10

            }),

            output_type:
                "DOMAIN_SCORE",

            score_range: Object.freeze({
                minimum: 0,
                maximum: 100
            }),

            confidence_behavior:
                "Verification Matrix evaluates evidence provenance and verification standing. Professional certification informs authority and provenance but never athlete ability.",

            explanation_behavior:
                "Explain Verification Intelligence through verified sources, attributed professional actions, credential standing, media support, guardian approval, conflicts, evidence gaps, matrix version, and doctrine version.",

            insufficient_evidence_behavior:
                "Return score:null with INSUFFICIENT_EVIDENCE when no governed verification record exists or required verification component determinations cannot be established.",

            certification_ability_separation:
                true,

            generated_at_required:
                true

        })

    });

    /*
    ===========================================================================
    REGISTRY IMPLEMENTATION
    ===========================================================================
    */

    const STATScoreMatrixRegistry = {

        registry_key:
            REGISTRY_KEY,

        registry_name:
            "STATS-CORE Stream 9 Matrix Registry",

        registry_version:
            REGISTRY_VERSION,

        doctrine_status:
            DOCTRINE_STATUS,

        stream_owner:
            STREAM_OWNER,

        requires_authority:
            "STATScoreStream9Authority",

        requires_matrix_doctrine:
            "STATScoreMatrixDoctrine",

        matrices:
            MATRICES,

        /*
        =======================================================================
        STREAM 9 AUTHORITY
        =======================================================================
        */

        validateAuthority:
            function () {

                return Boolean(

                    global.STATScoreStream9Authority &&

                    global.STATScoreStream9Authority
                        .stream_number === 9 &&

                    global.STATScoreStream9Authority
                        .operational_state === "ACTIVE"

                );

            },

        /*
        =======================================================================
        MATRIX DOCTRINE
        =======================================================================
        */

        validateMatrixDoctrine:
            function () {

                return Boolean(

                    global.STATScoreMatrixDoctrine &&

                    global.STATScoreMatrixDoctrine
                        .doctrine_key ===
                        "STATSCORE_MATRIX_DOCTRINE" &&

                    global.STATScoreMatrixDoctrine
                        .doctrine_status ===
                        "CANON_LOCKED"

                );

            },

        /*
        =======================================================================
        BASIC ACCESS
        =======================================================================
        */

        getMatrix:
            function (matrixKey) {

                return (
                    this.matrices[
                        matrixKey
                    ] || null
                );

            },

        isRegistered:
            function (matrixKey) {

                return Boolean(
                    this.matrices[
                        matrixKey
                    ]
                );

            },

        listMatrices:
            function () {

                return Object.keys(
                    this.matrices
                );

            },

        /*
        =======================================================================
        PHYSICAL AUTHORITY RESOLUTION
        =======================================================================
        */

        getPhysicalAuthorityName:
            function (matrixKey) {

                return (
                    PHYSICAL_AUTHORITIES[
                        matrixKey
                    ] || null
                );

            },

        getPhysicalAuthority:
            function (matrixKey) {

                const authorityName =
                    this.getPhysicalAuthorityName(
                        matrixKey
                    );

                if (!authorityName) {
                    return null;
                }

                return (
                    global[
                        authorityName
                    ] || null
                );

            },

        isPhysicallyLoaded:
            function (matrixKey) {

                return Boolean(
                    this.getPhysicalAuthority(
                        matrixKey
                    )
                );

            },

        /*
        =======================================================================
        REGISTERED AUTHORIZATION
        =======================================================================
        */

        isAuthorized:
            function (matrixKey) {

                const matrix =
                    this.getMatrix(
                        matrixKey
                    );

                if (!matrix) {
                    return false;
                }

                return Boolean(

                    this.validateAuthority() &&

                    this.validateMatrixDoctrine() &&

                    matrix.stream_owner ===
                        STREAM_OWNER

                );

            },

        /*
        =======================================================================
        MATRIX SUMMARY
        =======================================================================
        */

        listMatrixSummaries:
            function () {

                const self =
                    this;

                return Object.keys(
                    this.matrices
                ).map(
                    function (
                        matrixKey
                    ) {

                        const matrix =
                            self.matrices[
                                matrixKey
                            ];

                        return {

                            matrix_key:
                                matrix.matrix_key,

                            matrix_name:
                                matrix.matrix_name,

                            matrix_domain:
                                matrix.matrix_domain,

                            matrix_version:
                                matrix.matrix_version,

                            file_name:
                                matrix.file_name,

                            output_type:
                                matrix.output_type,

                            registered:
                                true,

                            physically_loaded:
                                self.isPhysicallyLoaded(
                                    matrixKey
                                ),

                            authorized:
                                self.isAuthorized(
                                    matrixKey
                                )

                        };

                    }
                );

            },

        /*
        =======================================================================
        REGISTERED CONTRACT VALIDATION
        =======================================================================
        */

        validateRegisteredMatrix:
            function (
                matrixKey
            ) {

                const matrix =
                    this.getMatrix(
                        matrixKey
                    );

                if (!matrix) {

                    return {

                        valid: false,

                        authorized: false,

                        physically_loaded:
                            false,

                        status:
                            "MATRIX_NOT_REGISTERED",

                        matrix_key:
                            matrixKey

                    };

                }

                const doctrine =
                    global
                        .STATScoreMatrixDoctrine;

                const contractValidation =
                    doctrine &&
                    typeof doctrine
                        .validateMatrixContract ===
                        "function"

                        ? doctrine
                            .validateMatrixContract(
                                matrix
                            )

                        : {

                            valid:
                                false,

                            status:
                                "MATRIX_DOCTRINE_NOT_AVAILABLE",

                            missing: [
                                "STATScoreMatrixDoctrine"
                            ]

                        };

                const weightValidation =
                    doctrine &&
                    typeof doctrine
                        .validateWeights ===
                        "function"

                        ? doctrine
                            .validateWeights(
                                matrix.weights
                            )

                        : {

                            valid:
                                false,

                            total:
                                0,

                            expected:
                                100

                        };

                const valid =
                    Boolean(

                        contractValidation
                            .valid &&

                        weightValidation
                            .valid

                    );

                return {

                    valid,

                    authorized:
                        this.isAuthorized(
                            matrixKey
                        ),

                    physically_loaded:
                        this.isPhysicallyLoaded(
                            matrixKey
                        ),

                    status:
                        valid

                            ? "REGISTERED_MATRIX_VALID"

                            : "REGISTERED_MATRIX_INVALID",

                    matrix_key:
                        matrixKey,

                    contract:
                        contractValidation,

                    weights:
                        weightValidation

                };

            },

        /*
        =======================================================================
        PHYSICAL CONTRACT VALIDATION
        -----------------------------------------------------------------------
        Validates the actual loaded matrix authority against the Registry.
        =======================================================================
        */

        validatePhysicalMatrix:
            function (
                matrixKey
            ) {

                const registered =
                    this.getMatrix(
                        matrixKey
                    );

                if (!registered) {

                    return {

                        valid:
                            false,

                        status:
                            "MATRIX_NOT_REGISTERED",

                        matrix_key:
                            matrixKey

                    };

                }

                const authority =
                    this.getPhysicalAuthority(
                        matrixKey
                    );

                if (!authority) {

                    return {

                        valid:
                            false,

                        status:
                            "MATRIX_AUTHORITY_NOT_LOADED",

                        matrix_key:
                            matrixKey,

                        expected_file:
                            registered.file_name,

                        expected_authority:
                            this.getPhysicalAuthorityName(
                                matrixKey
                            )

                    };

                }

                if (
                    typeof authority
                        .getContract !==
                    "function"
                ) {

                    return {

                        valid:
                            false,

                        status:
                            "MATRIX_PHYSICAL_CONTRACT_UNAVAILABLE",

                        matrix_key:
                            matrixKey

                    };

                }

                const physical =
                    authority.getContract();

                const mismatches =
                    [];

                /*
                ---------------------------------------------------------------
                IDENTITY
                ---------------------------------------------------------------
                */

                if (
                    physical
                        .matrix_key !==
                    registered
                        .matrix_key
                ) {
                    mismatches.push(
                        "matrix_key"
                    );
                }

                if (
                    physical
                        .matrix_domain !==
                    registered
                        .matrix_domain
                ) {
                    mismatches.push(
                        "matrix_domain"
                    );
                }

                if (
                    physical
                        .matrix_version !==
                    registered
                        .matrix_version
                ) {
                    mismatches.push(
                        "matrix_version"
                    );
                }

                if (
                    physical
                        .stream_owner !==
                    registered
                        .stream_owner
                ) {
                    mismatches.push(
                        "stream_owner"
                    );
                }

                if (
                    physical
                        .output_type !==
                    registered
                        .output_type
                ) {
                    mismatches.push(
                        "output_type"
                    );
                }

                /*
                ---------------------------------------------------------------
                REQUIRED EVIDENCE
                ---------------------------------------------------------------
                */

                const registeredRequired =
                    [
                        ...registered
                            .required_evidence
                    ].sort();

                const physicalRequired =
                    [
                        ...(
                            physical
                                .required_evidence ||
                            []
                        )
                    ].sort();

                if (
                    JSON.stringify(
                        registeredRequired
                    ) !==
                    JSON.stringify(
                        physicalRequired
                    )
                ) {
                    mismatches.push(
                        "required_evidence"
                    );
                }

                /*
                ---------------------------------------------------------------
                OPTIONAL EVIDENCE
                ---------------------------------------------------------------
                */

                const registeredOptional =
                    [
                        ...registered
                            .optional_evidence
                    ].sort();

                const physicalOptional =
                    [
                        ...(
                            physical
                                .optional_evidence ||
                            []
                        )
                    ].sort();

                if (
                    JSON.stringify(
                        registeredOptional
                    ) !==
                    JSON.stringify(
                        physicalOptional
                    )
                ) {
                    mismatches.push(
                        "optional_evidence"
                    );
                }

                /*
                ---------------------------------------------------------------
                WEIGHTS
                ---------------------------------------------------------------
                */

                const registeredWeights =
                    registered.weights ||
                    {};

                const physicalWeights =
                    physical.weights ||
                    {};

                for (
                    const key of
                    Object.keys(
                        registeredWeights
                    )
                ) {

                    if (
                        Number(
                            physicalWeights[
                                key
                            ]
                        ) !==
                        Number(
                            registeredWeights[
                                key
                            ]
                        )
                    ) {

                        mismatches.push(
                            `weights.${key}`
                        );

                    }

                }

                /*
                ---------------------------------------------------------------
                RESULT
                ---------------------------------------------------------------
                */

                return {

                    valid:
                        mismatches.length ===
                        0,

                    status:
                        mismatches.length ===
                        0

                            ? "MATRIX_PHYSICAL_CONTRACT_VALID"

                            : "MATRIX_PHYSICAL_CONTRACT_INVALID",

                    matrix_key:
                        matrixKey,

                    physical_authority:
                        this.getPhysicalAuthorityName(
                            matrixKey
                        ),

                    file_name:
                        registered.file_name,

                    mismatches

                };

            },

        /*
        =======================================================================
        MATRIX HEALTH CHECK
        =======================================================================
        */

        runMatrixHealthCheck:
            function (
                matrixKey
            ) {

                const registered =
                    this.validateRegisteredMatrix(
                        matrixKey
                    );

                const physical =
                    this.validatePhysicalMatrix(
                        matrixKey
                    );

                const authority =
                    this.getPhysicalAuthority(
                        matrixKey
                    );

                let authorityHealth =
                    null;

                if (
                    authority &&
                    typeof authority
                        .runHealthCheck ===
                        "function"
                ) {

                    try {

                        authorityHealth =
                            authority
                                .runHealthCheck();

                    } catch (
                        error
                    ) {

                        authorityHealth = {

                            healthy:
                                false,

                            status:
                                "MATRIX_HEALTH_CHECK_ERROR",

                            error:
                                String(
                                    error?.message ||
                                    error
                                )

                        };

                    }

                }

                const healthy =
                    Boolean(

                        registered.valid &&

                        registered.authorized &&

                        registered
                            .physically_loaded &&

                        physical.valid &&

                        (
                            authorityHealth == null ||
                            authorityHealth
                                .healthy !== false
                        )

                    );

                return {

                    matrix_key:
                        matrixKey,

                    healthy,

                    registered,

                    physical,

                    authority_health:
                        authorityHealth,

                    status:
                        healthy

                            ? "MATRIX_HEALTHY"

                            : "MATRIX_UNHEALTHY"

                };

            },

        /*
        =======================================================================
        ALL MATRIX VALIDATION
        =======================================================================
        */

        validateAllMatrices:
            function () {

                const self =
                    this;

                return Object.keys(
                    this.matrices
                ).map(
                    function (
                        matrixKey
                    ) {

                        return (
                            self
                                .validateRegisteredMatrix(
                                    matrixKey
                                )
                        );

                    }
                );

            },

        validateAllPhysicalMatrices:
            function () {

                const self =
                    this;

                return Object.keys(
                    this.matrices
                ).map(
                    function (
                        matrixKey
                    ) {

                        return (
                            self
                                .validatePhysicalMatrix(
                                    matrixKey
                                )
                        );

                    }
                );

            },

        runAllHealthChecks:
            function () {

                const self =
                    this;

                return Object.keys(
                    this.matrices
                ).map(
                    function (
                        matrixKey
                    ) {

                        return (
                            self
                                .runMatrixHealthCheck(
                                    matrixKey
                                )
                        );

                    }
                );

            },

        /*
        =======================================================================
        REGISTRY STATUS
        =======================================================================
        */

        getRegistryStatus:
            function () {

                const matrices =
                    this.listMatrices();

                const physicalLoaded =
                    matrices.filter(
                        (
                            matrixKey
                        ) =>
                            this
                                .isPhysicallyLoaded(
                                    matrixKey
                                )
                    );

                const healthChecks =
                    this.runAllHealthChecks();

                const healthyMatrices =
                    healthChecks.filter(
                        (
                            result
                        ) =>
                            result.healthy
                    );

                return {

                    registry_key:
                        this.registry_key,

                    registry_version:
                        this.registry_version,

                    doctrine_status:
                        this.doctrine_status,

                    stream_owner:
                        this.stream_owner,

                    authority_verified:
                        this.validateAuthority(),

                    matrix_doctrine_verified:
                        this.validateMatrixDoctrine(),

                    registered_matrices:
                        matrices,

                    matrix_count:
                        matrices.length,

                    physically_loaded_matrices:
                        physicalLoaded,

                    physically_loaded_count:
                        physicalLoaded.length,

                    healthy_matrix_count:
                        healthyMatrices.length,

                    all_registered_matrices_healthy:
                        healthyMatrices.length ===
                        matrices.length

                };

            }

    };

    /*
    ===========================================================================
    FREEZE REGISTRY
    ===========================================================================
    */

    Object.freeze(
        STATScoreMatrixRegistry
    );

    /*
    ===========================================================================
    PUBLIC AUTHORITY
    ===========================================================================
    */

    global.STATScoreMatrixRegistry =
        STATScoreMatrixRegistry;

    /*
    ===========================================================================
    CANONICAL STATScore NAMESPACE
    ===========================================================================
    */

    global.STATScore =
        global.STATScore || {};

    global.STATScore.MatrixRegistry =
        STATScoreMatrixRegistry;

    /*
    ===========================================================================
    LOAD RECEIPT
    ===========================================================================
    */

    console.info(
        "[STATS-CORE][STREAM 9] Matrix Registry v1.0.0 loaded — 5 scored matrices registered."
    );

})(
    typeof window !== "undefined"
        ? window
        : globalThis
); 
