/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Intelligence Doctrine
* -----------------------------------------------------------------------------
* File:
*     statscore-intelligence-doctrine.js
*
* Purpose:
*     Define what athlete intelligence is, what it is not, and what conditions
*     must be satisfied before intelligence may be considered official.
*
* Doctrine:
*     This file DOES NOT calculate scores.
*     This file defines the meaning, boundaries, evidence rules, and publication
*     requirements for official STATS-CORE athlete intelligence.
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

    const AUTHORITY = global.STATScoreStream9Authority || null;

    const STATScoreIntelligenceDoctrine = Object.freeze({

        doctrine_key: "STATSCORE_INTELLIGENCE_DOCTRINE",

        stream_key: "STATSCORE_STREAM_9",

        doctrine_name: "STATS-CORE Intelligence Doctrine",

        version: "1.0.0",

        doctrine_status: "CANON_LOCKED",

        requires_authority:
            "STATScoreStream9Authority",

        authority_verified:
            Boolean(AUTHORITY && AUTHORITY.stream_number === 9),

        //----------------------------------------------------------------------
        // Intelligence Definition
        //----------------------------------------------------------------------

        intelligence_definition:
            "STATS-CORE athlete intelligence is governed interpretation of athlete evidence, transformed through authorized matrices, confidence logic, explainability logic, and composite authority publication.",

        intelligence_is: Object.freeze({

            evidence_based: true,

            matrix_governed: true,

            confidence_scored: true,

            explainable: true,

            versioned: true,

            auditable: true,

            composite_capable: true,

            consumer_ready: true

        }),

        intelligence_is_not: Object.freeze({

            raw_data_only: true,

            dashboard_opinion: true,

            recruiter_preference_only: true,

            coach_opinion_only: true,

            unverified_claim_only: true,

            static_profile_content: true,

            visual_layout: true,

            page_rendering_logic: true

        }),

        //----------------------------------------------------------------------
        // Required Intelligence Components
        //----------------------------------------------------------------------

        required_components: Object.freeze({

            athlete_id: true,

            snapshot_id: true,

            evidence_inputs: true,

            domain_scores: true,

            matrix_versions: true,

            confidence: true,

            explainability: true,

            recommendations: true,

            generated_at: true,

            intelligence_version: true

        }),

        //----------------------------------------------------------------------
        // Evidence Doctrine
        //----------------------------------------------------------------------

        evidence_doctrine: Object.freeze({

            source_record_required: true,

            snapshot_context_required: true,

            unverifiable_claims_allowed_but_flagged: true,

            verified_evidence_increases_confidence: true,

            missing_evidence_reduces_confidence: true,

            conflicting_evidence_must_be_flagged: true,

            stale_evidence_must_reduce_confidence: true

        }),

        //----------------------------------------------------------------------
        // Official Intelligence Rule
        //----------------------------------------------------------------------

        official_intelligence_rule:
            "No athlete intelligence is official until published through the Stream 9 Composite Authority Engine or an approved Stream 9 authority publisher.",

        official_publisher_required: true,

        unauthorized_intelligence_status:
            "UNOFFICIAL",

        //----------------------------------------------------------------------
        // Consumer Doctrine
        //----------------------------------------------------------------------

        consumer_doctrine: Object.freeze({

            stream3_displays_intelligence: true,

            stream5_operationalizes_intelligence: true,

            stream6_communicates_context: true,

            stream7_consumes_crystal_inputs: true,

            stream8_monitors_integrity: true,

            master_integration_synchronizes_outputs: true,

            consumers_may_modify_scores: false,

            consumers_may_generate_recommendations: false,

            consumers_may_override_confidence: false

        }),

        //----------------------------------------------------------------------
        // Validation
        //----------------------------------------------------------------------

        validateAuthority: function () {
            return Boolean(
                global.STATScoreStream9Authority &&
                global.STATScoreStream9Authority.stream_number === 9 &&
                global.STATScoreStream9Authority.operational_state === "ACTIVE"
            );
        },

        getDoctrineStatus: function () {
            return {
                doctrine_key: this.doctrine_key,
                version: this.version,
                doctrine_status: this.doctrine_status,
                authority_verified: this.validateAuthority(),
                official_publisher_required: this.official_publisher_required
            };
        }

    });

    Object.freeze(STATScoreIntelligenceDoctrine);

    global.STATScoreIntelligenceDoctrine = STATScoreIntelligenceDoctrine;

})(window); 
