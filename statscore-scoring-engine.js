/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-scoring-engine.js
*
* Classification:
*     COMPATIBILITY ADAPTER — LEGACY GENERIC SCORER DEPRECATED
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-SCORING-ENGINE-COMPAT-V2
*
* Status:
*     DEPRECATED AS SCORING AUTHORITY
*     ACTIVE ONLY AS CONTROLLED COMPATIBILITY ADAPTER
*
* Superseded Authority:
*     Legacy Generic Scoring Engine
*
* Canonical Replacement:
*     statscore-score-authority-engine.js
*
* Purpose:
*     Preserve temporary compatibility for legacy consumers that still call
*     STATScoreScoringEngine methods while preventing this file from operating
*     as an independent scoring system.
*
* Constitutional Chain:
*
*     Legacy Consumer
*          ↓
*     statscore-scoring-engine.js
*          ↓
*     Score Authority
*          ↓
*     Registered Stream 9 Domain Authorities
*          ↓
*     Composite Authority
*
* This file DOES:
*     - preserve selected legacy method names;
*     - forward requests to the canonical Score Authority;
*     - identify itself as deprecated scoring infrastructure;
*     - expose migration and health diagnostics;
*     - fail closed when Score Authority is unavailable.
*
* This file DOES NOT:
*     - calculate a score;
*     - define scoring weights;
*     - calculate evidence points;
*     - calculate verification points;
*     - calculate readiness points;
*     - calculate competition points;
*     - calculate completion points;
*     - calculate sport-context points;
*     - average traits;
*     - generate official stars;
*     - create recruiting projections;
*     - multiply performance by competition level;
*     - convert profile completion into athlete ability;
*     - convert guardian status into athlete ability;
*     - convert headshot/media presence into athlete ability;
*     - create official domain scores;
*     - create Composite Intelligence;
*     - render DOM;
*     - mutate page state;
*     - invoke sport engines directly;
*     - use a generic fallback formula.
*
* Permanent Rule:
*
*     THIS FILE IS NOT AN OFFICIAL SCORING AUTHORITY.
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-scoring-engine";

    const VERSION =
        "STATSCORE-SCORING-ENGINE-COMPAT-V2";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const CLASSIFICATION =
        "CONTROLLED_COMPATIBILITY_ADAPTER";

    const AUTHORITY_STATUS =
        "DEPRECATED_AS_SCORING_AUTHORITY";

    const CANONICAL_REPLACEMENT =
        "statscore-score-authority-engine.js";

    const CANONICAL_API =
        "STATScore.ScoreAuthority.getAthleteIntelligence";

    let lastResult =
        null;

    let lastError =
        null;

    /*
     * =========================================================================
     * LEGACY FEATURES PERMANENTLY DISABLED
     * =========================================================================
     */

    const LEGACY_SCORING_FEATURES = Object.freeze({

        generic_weighted_formula:
            false,

        evidence_weight_24:
            false,

        verification_weight_18:
            false,

        readiness_weight_18:
            false,

        competition_weight_18:
            false,

        completion_weight_12:
            false,

        sport_context_weight_10:
            false,

        profile_completion_affects_ability:
            false,

        headshot_affects_ability:
            false,

        guardian_contact_affects_ability:
            false,

        coach_contact_affects_ability:
            false,

        media_presence_affects_ability:
            false,

        verification_status_affects_performance:
            false,

        competition_multiplier:
            false,

        local_readiness_scoring:
            false,

        local_star_authority:
            false,

        local_projection_lane_authority:
            false,

        local_final_score:
            false,

        direct_sport_engine_scoring:
            false,

        generic_fallback_scoring:
            false,

        dom_rendering:
            false
    });

    /*
     * =========================================================================
     * UTILITY
     * =========================================================================
     */

    function nowISO() {
        return new Date()
            .toISOString();
    }

    function normalizeInput(
        input
    ) {
        if (
            input === undefined ||
            input === null
        ) {
            return {};
        }

        if (
            typeof input ===
                "string"
        ) {
            return {
                snapshot_id:
                    input
            };
        }

        if (
            typeof input ===
                "object" &&
            !Array.isArray(
                input
            )
        ) {
            return input;
        }

        return {};
    }

    /*
     * =========================================================================
     * CANONICAL AUTHORITY RESOLUTION
     * =========================================================================
     */

    function getScoreAuthority() {
        return (
            global
                .STATSCORE_SCORE_AUTHORITY_ENGINE ||
            global
                .STATScore
                ?.ScoreAuthority ||
            global
                .STATScore
                ?.ScoreAuthorityEngine ||
            null
        );
    }

    function getCanonicalMethod(
        authority
    ) {
        if (
            authority &&
            typeof authority
                .getAthleteIntelligence ===
                "function"
        ) {
            return "getAthleteIntelligence";
        }

        /*
         * Compatibility with transitional Score Authority builds.
         * These are still downstream calls to the canonical authority.
         */

        if (
            authority &&
            typeof authority
                .getDashboardScoreModel ===
                "function"
        ) {
            return "getDashboardScoreModel";
        }

        if (
            authority &&
            typeof authority
                .getProfileScoreModel ===
                "function"
        ) {
            return "getProfileScoreModel";
        }

        return null;
    }

    /*
     * =========================================================================
     * FAILURE CONTRACT
     * =========================================================================
     */

    function buildAuthorityUnavailableResult(
        input,
        requestedMethod
    ) {
        const normalized =
            normalizeInput(
                input
            );

        const snapshot =
            normalized.snapshot &&
            typeof normalized.snapshot ===
                "object"
                ? normalized.snapshot
                : normalized;

        return {
            ok:
                false,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                CLASSIFICATION,

            authority_status:
                AUTHORITY_STATUS,

            official_scoring_authority:
                false,

            requested_legacy_method:
                requestedMethod ||
                null,

            canonical_replacement:
                CANONICAL_REPLACEMENT,

            canonical_api:
                CANONICAL_API,

            athlete_id:
                normalized
                    .athlete_id ||
                snapshot
                    ?.athlete_id ||
                null,

            snapshot_id:
                normalized
                    .snapshot_id ||
                snapshot
                    ?.snapshot_id ||
                null,

            score:
                null,

            final_score:
                null,

            status:
                "AUTHORITY_UNAVAILABLE",

            flags: [
                "LEGACY_SCORER_DEPRECATED",
                "SCORE_AUTHORITY_UNAVAILABLE",
                "NO_GENERIC_SCORING_FALLBACK"
            ],

            explanation: {
                summary:
                    "The legacy generic scorer is deprecated and the canonical Score Authority is unavailable.",

                rule:
                    "Missing scoring authority does not authorize reconstruction or fallback scoring.",

                next_action:
                    "Load statscore-score-authority-engine.js before requesting governed athlete intelligence."
            },

            generated_at:
                nowISO()
        };
    }

    function buildExecutionErrorResult(
        input,
        requestedMethod,
        error
    ) {
        const normalized =
            normalizeInput(
                input
            );

        const snapshot =
            normalized.snapshot &&
            typeof normalized.snapshot ===
                "object"
                ? normalized.snapshot
                : normalized;

        return {
            ok:
                false,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                CLASSIFICATION,

            authority_status:
                AUTHORITY_STATUS,

            official_scoring_authority:
                false,

            requested_legacy_method:
                requestedMethod ||
                null,

            canonical_replacement:
                CANONICAL_REPLACEMENT,

            canonical_api:
                CANONICAL_API,

            athlete_id:
                normalized
                    .athlete_id ||
                snapshot
                    ?.athlete_id ||
                null,

            snapshot_id:
                normalized
                    .snapshot_id ||
                snapshot
                    ?.snapshot_id ||
                null,

            score:
                null,

            final_score:
                null,

            status:
                "SCORE_AUTHORITY_ERROR",

            flags: [
                "LEGACY_SCORER_DEPRECATED",
                "CANONICAL_SCORE_AUTHORITY_ERROR",
                "NO_FALLBACK_SCORE_CREATED"
            ],

            explanation: {
                summary:
                    "Canonical Score Authority failed during compatibility forwarding.",

                error:
                    error instanceof Error
                        ? error.message
                        : String(error),

                rule:
                    "The compatibility adapter may not substitute a legacy score when canonical authority fails."
            },

            generated_at:
                nowISO()
        };
    }

    /*
     * =========================================================================
     * CANONICAL DELEGATION
     * =========================================================================
     */

    function delegate(
        input,
        requestedLegacyMethod
    ) {
        lastError =
            null;

        const authority =
            getScoreAuthority();

        const canonicalMethod =
            getCanonicalMethod(
                authority
            );

        if (
            !authority ||
            !canonicalMethod
        ) {
            const result =
                buildAuthorityUnavailableResult(
                    input,
                    requestedLegacyMethod
                );

            lastResult =
                result;

            return result;
        }

        try {
            const normalized =
                normalizeInput(
                    input
                );

            const result =
                authority[
                    canonicalMethod
                ](
                    normalized
                );

            const compatibilityResult = {
                ...result,

                compatibility_adapter: {
                    engine_id:
                        ENGINE_ID,

                    version:
                        VERSION,

                    requested_legacy_method:
                        requestedLegacyMethod ||
                        null,

                    delegated_to:
                        canonicalMethod,

                    deprecated_scoring_authority:
                        true,

                    calculated_locally:
                        false
                }
            };

            lastResult =
                compatibilityResult;

            return compatibilityResult;

        } catch (error) {
            lastError = {
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),

                requested_method:
                    requestedLegacyMethod ||
                    null,

                generated_at:
                    nowISO()
            };

            const result =
                buildExecutionErrorResult(
                    input,
                    requestedLegacyMethod,
                    error
                );

            lastResult =
                result;

            return result;
        }
    }

    /*
     * =========================================================================
     * LEGACY PUBLIC METHODS
     * =========================================================================
     *
     * These method names survive ONLY for compatibility.
     * They calculate nothing locally.
     */

    function explainScore(
        snapshot
    ) {
        return delegate(
            snapshot,
            "explainScore"
        );
    }

    function calculateRawScore(
        snapshot
    ) {
        return delegate(
            snapshot,
            "calculateRawScore"
        );
    }

    function getScoreModel(
        input
    ) {
        return delegate(
            input,
            "getScoreModel"
        );
    }

    function scoreAthlete(
        input
    ) {
        return delegate(
            input,
            "scoreAthlete"
        );
    }

    function calculate(
        input
    ) {
        return delegate(
            input,
            "calculate"
        );
    }

    function run(
        input
    ) {
        return delegate(
            input,
            "run"
        );
    }

    /*
     * =========================================================================
     * REMOVED LEGACY SCORING METHODS
     * =========================================================================
     *
     * These methods intentionally return non-scoring deprecation contracts.
     */

    function deprecatedComponent(
        component
    ) {
        return {
            ok:
                false,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            component,

            official:
                false,

            score:
                null,

            status:
                "DEPRECATED_COMPONENT",

            flags: [
                "LEGACY_GENERIC_COMPONENT_REMOVED"
            ],

            explanation: {
                summary:
                    `${component} is no longer calculated by statscore-scoring-engine.js.`,

                rule:
                    "Each intelligence domain must originate from its own governed authority."
            },

            generated_at:
                nowISO()
        };
    }

    function evidenceScore() {
        return deprecatedComponent(
            "evidenceScore"
        );
    }

    function verificationScore() {
        return deprecatedComponent(
            "verificationScore"
        );
    }

    function readinessScore() {
        return deprecatedComponent(
            "readinessScore"
        );
    }

    function competitionScore() {
        return deprecatedComponent(
            "competitionScore"
        );
    }

    function completionScore() {
        return deprecatedComponent(
            "completionScore"
        );
    }

    function sportContextScore() {
        return deprecatedComponent(
            "sportContextScore"
        );
    }

    function starSignal() {
        return {
            ok:
                false,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            official:
                false,

            stars:
                null,

            status:
                "DEPRECATED_PRESENTATION_SIGNAL",

            flags: [
                "UNREGISTERED_STAR_THRESHOLDS_REMOVED"
            ],

            explanation: {
                summary:
                    "The legacy generic star authority has been removed from official scoring."
            },

            generated_at:
                nowISO()
        };
    }

    function projectionLane() {
        return {
            ok:
                false,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            official:
                false,

            lane:
                null,

            status:
                "DEPRECATED_PROJECTION_AUTHORITY",

            flags: [
                "LEGACY_PROJECTION_LANE_REMOVED"
            ],

            explanation: {
                summary:
                    "Recruiting, pathway, readiness, and exposure recommendations must come from their governed Stream 9 authorities."
            },

            generated_at:
                nowISO()
        };
    }

    function riskFlags(
        input
    ) {
        const model =
            delegate(
                input,
                "riskFlags"
            );

        if (
            Array.isArray(
                model
                    ?.flags
            )
        ) {
            return model
                .flags;
        }

        return [];
    }

    /*
     * =========================================================================
     * PRESENTATION REMOVAL
     * =========================================================================
     */

    function renderScoreToProfile() {
        return {
            ok:
                false,

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            status:
                "PRESENTATION_AUTHORITY_REMOVED",

            rendered:
                false,

            explanation:
                "Score rendering belongs to the owning presentation authority. Stream 9 does not manipulate profile DOM."
        };
    }

    /*
     * =========================================================================
     * CONTRACT / MIGRATION
     * =========================================================================
     */

    function getContract() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                CLASSIFICATION,

            authority_status:
                AUTHORITY_STATUS,

            official_scoring_authority:
                false,

            canonical_replacement:
                CANONICAL_REPLACEMENT,

            canonical_api:
                CANONICAL_API,

            permitted_role:
                "Forward legacy scoring calls to Score Authority only.",

            local_score_calculation:
                false,

            local_weighting:
                false,

            local_domain_scoring:
                false,

            local_composite_scoring:
                false,

            local_star_scoring:
                false,

            local_projection_scoring:
                false,

            direct_sport_scoring:
                false,

            generic_fallback:
                false,

            rendering:
                false,

            migration_rule:
                "New consumers must call STATScore.ScoreAuthority.getAthleteIntelligence directly."
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            status:
                AUTHORITY_STATUS,

            legacy_features:
                {
                    ...LEGACY_SCORING_FEATURES
                },

            score_authority_loaded:
                Boolean(
                    getScoreAuthority()
                ),

            canonical_method:
                getCanonicalMethod(
                    getScoreAuthority()
                ),

            compatibility_mode:
                true,

            official_scoring_enabled:
                false
        };
    }

    function getMigrationGuide() {
        return {
            deprecated_file:
                "statscore-scoring-engine.js",

            replacement_file:
                CANONICAL_REPLACEMENT,

            old_calls: [
                "STATScoreScoringEngine.explainScore(snapshot)",
                "STATScoreScoringEngine.calculateRawScore(snapshot)",
                "STATScoreScoringEngine.scoreAthlete(snapshot)"
            ],

            canonical_call:
                "STATScore.ScoreAuthority.getAthleteIntelligence({ athlete_id, snapshot_id, snapshot })",

            migration_status:
                "REQUIRED",

            remove_when:
                "All legacy consumers have migrated to Score Authority."
        };
    }

    function getLastResult() {
        return lastResult;
    }

    function getLastError() {
        return lastError;
    }

    function runHealthCheck() {
        const authority =
            getScoreAuthority();

        const canonicalMethod =
            getCanonicalMethod(
                authority
            );

        const allLegacyScoringDisabled =
            Object.values(
                LEGACY_SCORING_FEATURES
            ).every(
                function (
                    value
                ) {
                    return (
                        value ===
                        false
                    );
                }
            );

        const healthy =
            Boolean(
                authority &&
                canonicalMethod &&
                allLegacyScoringDisabled
            );

        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            classification:
                CLASSIFICATION,

            authority_status:
                AUTHORITY_STATUS,

            status:
                healthy
                    ? "HEALTHY_COMPATIBILITY_ADAPTER"
                    : "DEGRADED_COMPATIBILITY_ADAPTER",

            official_scoring_authority:
                false,

            canonical_replacement:
                CANONICAL_REPLACEMENT,

            canonical_score_authority_loaded:
                Boolean(
                    authority
                ),

            canonical_method_available:
                canonicalMethod,

            all_legacy_scoring_disabled:
                allLegacyScoringDisabled,

            generic_weighted_formula_enabled:
                false,

            evidence_component_scoring_enabled:
                false,

            verification_component_scoring_enabled:
                false,

            readiness_component_scoring_enabled:
                false,

            competition_component_scoring_enabled:
                false,

            completion_component_scoring_enabled:
                false,

            sport_context_component_scoring_enabled:
                false,

            headshot_affects_score:
                false,

            guardian_affects_score:
                false,

            coach_contact_affects_score:
                false,

            verification_changes_performance:
                false,

            competition_multiplier_enabled:
                false,

            local_star_authority_enabled:
                false,

            local_projection_authority_enabled:
                false,

            direct_sport_scoring_enabled:
                false,

            generic_fallback_enabled:
                false,

            dom_rendering_enabled:
                false,

            generated_at:
                nowISO()
        };
    }

    /*
     * =========================================================================
     * PUBLIC COMPATIBILITY OBJECT
     * =========================================================================
     */

    const CompatibilityAdapter =
        Object.freeze({

            ENGINE_ID,

            VERSION,

            SCORE_VERSION:
                VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                CLASSIFICATION,

            status:
                AUTHORITY_STATUS,

            deprecated:
                true,

            official_scoring_authority:
                false,

            canonical_replacement:
                CANONICAL_REPLACEMENT,

            /*
             * Legacy compatibility methods
             */
            explainScore,

            calculateRawScore,

            getScoreModel,

            scoreAthlete,

            calculate,

            run,

            /*
             * Deprecated component methods
             */
            evidenceScore,

            verificationScore,

            readinessScore,

            competitionScore,

            completionScore,

            sportContextScore,

            starSignal,

            projectionLane,

            riskFlags,

            renderScoreToProfile,

            /*
             * Diagnostics
             */
            getContract,

            getConfiguration,

            getMigrationGuide,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    /*
     * =========================================================================
     * LEGACY GLOBAL
     * =========================================================================
     */

    global.STATScoreScoringEngine =
        CompatibilityAdapter;

    global.STATScore =
        global.STATScore ||
        {};

    global.STATScore.LegacyScoringAdapter =
        CompatibilityAdapter;

    /*
     * Do NOT register this object as ScoreAuthority.
     * Do NOT register this object as an official matrix.
     * Do NOT auto-execute scoring.
     */

    console.info(
        "[STATS-CORE] Legacy Scoring Engine compatibility adapter loaded:",
        VERSION,
        "| official scorer deprecated | all scoring delegated to Score Authority"
    );

})(window); 
