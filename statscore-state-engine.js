/* ============================================================
   STATScore™ State Engine
   File: statscore-state-engine.js
   Version: STATSCORE-STATE-ENGINE-V1
   Purpose:
   Governs operational athlete states after synthesis.
   Controls visibility, routing, escalation,
   readiness, verification, and lifecycle state transitions.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const StateEngine = {

    version: "STATSCORE-STATE-ENGINE-V1",

    STATES: {

      PROFILE: {
        CREATED: "PROFILE_CREATED",
        ACTIVE: "PROFILE_ACTIVE",
        REVIEW: "PROFILE_REVIEW",
        ARCHIVED: "PROFILE_ARCHIVED"
      },

      VERIFICATION: {
        UNVERIFIED: "UNVERIFIED",
        PARTIAL: "PARTIALLY_VERIFIED",
        VERIFIED: "VERIFIED",
        VERIFIED_ELITE: "VERIFIED_ELITE",
        CONFLICTED: "CONFLICTED"
      },

      READINESS: {
        DEVELOPING: "DEVELOPING",
        TRACKING_UP: "TRACKING_UP",
        READY: "READY",
        CONDITIONAL_READY: "CONDITIONAL_READY",
        LIMITED: "LIMITED",
        RECOVERY: "RECOVERY_STATE"
      },

      ELIGIBILITY: {
        UNKNOWN: "UNKNOWN",
        REVIEW_REQUIRED: "REVIEW_REQUIRED",
        PARTIAL_REVIEW: "PARTIAL_REVIEW",
        NCAA_READY: "NCAA_READY",
        NCAA_RISK: "NCAA_RISK",
        BLOCKED: "BLOCKED"
      },

      VISIBILITY: {
        PRIVATE: "PRIVATE",
        CONTROLLED: "CONTROLLED",
        VERIFIED_VISIBLE: "VERIFIED_VISIBLE",
        RESTRICTED: "RESTRICTED",
        LOCKED: "LOCKED"
      },

      ROUTING: {
        ATHLETE: "ATHLETE_ROUTE",
        PARENT: "PARENT_ROUTE",
        COACH: "COACH_ROUTE",
        COUNSELOR: "COUNSELOR_ROUTE",
        EVALUATOR: "EVALUATOR_ROUTE",
        RECRUITER: "RECRUITER_ROUTE",
        PROGRAM: "PROGRAM_ROUTE"
      },

      ESCALATION: {
        NONE: "NONE",
        COUNSELOR_REVIEW: "COUNSELOR_REVIEW",
        EVALUATOR_REQUIRED: "EVALUATOR_REQUIRED",
        ACADEMIC_REVIEW: "ACADEMIC_REVIEW",
        MEDICAL_FLAG: "MEDICAL_FLAG",
        VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED"
      },

      MEDIA: {
        PENDING: "MEDIA_PENDING",
        FILM_ATTACHED: "FILM_ATTACHED",
        VERIFIED_MEDIA: "VERIFIED_MEDIA",
        HIGHLIGHT_READY: "HIGHLIGHT_READY",
        MEDIA_EXPIRED: "MEDIA_EXPIRED"
      }

    },

    nowISO() {
      return new Date().toISOString();
    },

    buildBaseState(athleteId = null) {

      return {

        engine_version: this.version,

        athlete_id: athleteId,

        generated_at: this.nowISO(),
        updated_at: this.nowISO(),

        profile_state: this.STATES.PROFILE.CREATED,

        verification_state: this.STATES.VERIFICATION.UNVERIFIED,

        readiness_state: this.STATES.READINESS.DEVELOPING,

        eligibility_state: this.STATES.ELIGIBILITY.REVIEW_REQUIRED,

        visibility_state: this.STATES.VISIBILITY.CONTROLLED,

        routing_state: this.STATES.ROUTING.ATHLETE,

        escalation_state: this.STATES.ESCALATION.NONE,

        media_state: this.STATES.MEDIA.PENDING,

        confidence_score: 0,
        completion_score: 0,

        blocking_items: [],
        alerts: [],
        required_actions: [],

        pathway_locked: false,
        recruiter_access: false,
        evaluator_access: false,
        counselor_access: true,

        event_history: []
      };

    },

    applySynthesis(state, synthesis) {

      if (!synthesis) return state;

      state.confidence_score =
        Number(synthesis.confidence_score || 0);

      state.completion_score =
        Number(synthesis.completion_score || 0);

      /* =========================================
         PROFILE STATE
      ========================================= */

      if (
        synthesis.profile_state === "PROFILE_ACTIVE"
      ) {

        state.profile_state =
          this.STATES.PROFILE.ACTIVE;

      }

      /* =========================================
         VERIFICATION STATE
      ========================================= */

      if (
        synthesis.verification_state ===
        "VERIFIED_SIGNAL_PRESENT"
      ) {

        state.verification_state =
          this.STATES.VERIFICATION.VERIFIED;

        state.evaluator_access = true;

      } else {

        state.verification_state =
          this.STATES.VERIFICATION.UNVERIFIED;

        state.escalation_state =
          this.STATES.ESCALATION.VERIFICATION_REQUIRED;

        state.required_actions.push(
          "Verified evaluator evidence required."
        );

      }

      /* =========================================
         READINESS STATE
      ========================================= */

      if (
        synthesis.readiness_state ===
        "DEVELOPING_PLAN_REQUIRED"
      ) {

        state.readiness_state =
          this.STATES.READINESS.DEVELOPING;

        state.required_actions.push(
          "Development plan recommended."
        );

      }

      if (
        state.confidence_score >= 85 &&
        state.completion_score >= 85
      ) {

        state.readiness_state =
          this.STATES.READINESS.READY;

      }

      if (
        state.confidence_score >= 70 &&
        state.completion_score >= 60
      ) {

        state.readiness_state =
          this.STATES.READINESS.CONDITIONAL_READY;

      }

      /* =========================================
         ELIGIBILITY STATE
      ========================================= */

      if (
        synthesis.eligibility_state ===
        "PARTIAL_NCAA_REVIEW"
      ) {

        state.eligibility_state =
          this.STATES.ELIGIBILITY.PARTIAL_REVIEW;

        state.escalation_state =
          this.STATES.ESCALATION.COUNSELOR_REVIEW;

        state.blocking_items.push(
          "Eligibility review incomplete."
        );

      }

      if (
        state.completion_score >= 80 &&
        state.confidence_score >= 75 &&
        synthesis.eligibility_state !==
        "PARTIAL_NCAA_REVIEW"
      ) {

        state.eligibility_state =
          this.STATES.ELIGIBILITY.NCAA_READY;

      }

      /* =========================================
         VISIBILITY STATE
      ========================================= */

      if (
        state.verification_state ===
        this.STATES.VERIFICATION.VERIFIED &&
        state.readiness_state ===
        this.STATES.READINESS.READY &&
        state.eligibility_state ===
        this.STATES.ELIGIBILITY.NCAA_READY
      ) {

        state.visibility_state =
          this.STATES.VISIBILITY.VERIFIED_VISIBLE;

        state.recruiter_access = true;

      } else {

        state.visibility_state =
          this.STATES.VISIBILITY.CONTROLLED;

        state.recruiter_access = false;

      }

      /* =========================================
         MEDIA STATE
      ========================================= */

      if (
        synthesis.media_state ===
        "MEDIA_INTAKE_REQUIRED"
      ) {

        state.media_state =
          this.STATES.MEDIA.PENDING;

        state.required_actions.push(
          "Upload verified media."
        );

      }

      if (
        synthesis.media_state &&
        synthesis.media_state.includes("READY")
      ) {

        state.media_state =
          this.STATES.MEDIA.HIGHLIGHT_READY;

      }

      /* =========================================
         PATHWAY LOCK
      ========================================= */

      if (
        state.eligibility_state ===
        this.STATES.ELIGIBILITY.BLOCKED
      ) {

        state.pathway_locked = true;

      }

      /* =========================================
         ALERTS
      ========================================= */

      if (state.blocking_items.length > 0) {

        state.alerts.push({
          type: "BLOCKING_ITEMS_PRESENT",
          severity: "MEDIUM",
          created_at: this.nowISO()
        });

      }

      return state;

    },

    transitionState(currentState, event = {}) {

      const nextState = {
        ...currentState
      };

      nextState.updated_at = this.nowISO();

      const type =
        String(event.type || "").toLowerCase();

      /* =========================================
         EVENT ROUTING
      ========================================= */

      switch (type) {

        case "verification.applied":

          nextState.verification_state =
            this.STATES.VERIFICATION.VERIFIED;

          nextState.event_history.push({
            event: "verification.applied",
            created_at: this.nowISO()
          });

          break;

        case "eligibility.warning":

          nextState.eligibility_state =
            this.STATES.ELIGIBILITY.NCAA_RISK;

          nextState.visibility_state =
            this.STATES.VISIBILITY.RESTRICTED;

          nextState.event_history.push({
            event: "eligibility.warning",
            created_at: this.nowISO()
          });

          break;

        case "media.attached":

          nextState.media_state =
            this.STATES.MEDIA.FILM_ATTACHED;

          nextState.event_history.push({
            event: "media.attached",
            created_at: this.nowISO()
          });

          break;

        case "recruiter.request":

          nextState.routing_state =
            this.STATES.ROUTING.RECRUITER;

          nextState.event_history.push({
            event: "recruiter.request",
            created_at: this.nowISO()
          });

          break;

        case "counselor.review":

          nextState.routing_state =
            this.STATES.ROUTING.COUNSELOR;

          nextState.event_history.push({
            event: "counselor.review",
            created_at: this.nowISO()
          });

          break;

        default:

          nextState.event_history.push({
            event: "unknown",
            created_at: this.nowISO()
          });

      }

      return nextState;

    },

    evaluateExpiration(state) {

      if (!state.updated_at) return state;

      const last =
        new Date(state.updated_at).getTime();

      const days =
        Math.floor(
          (Date.now() - last) / 86400000
        );

      if (days >= 90) {

        state.readiness_state =
          this.STATES.READINESS.LIMITED;

        state.visibility_state =
          this.STATES.VISIBILITY.RESTRICTED;

        state.alerts.push({
          type: "READINESS_EXPIRED",
          severity: "HIGH",
          created_at: this.nowISO()
        });

      }

      return state;

    },

    buildStateFromSynthesis(synthesis = {}) {

      let state =
        this.buildBaseState(
          synthesis.athlete_id || null
        );

      state =
        this.applySynthesis(
          state,
          synthesis
        );

      state =
        this.evaluateExpiration(state);

      return state;

    },

    explain(state) {

      if (!state) {
        return "No athlete state available.";
      }

      return [
        `Profile: ${state.profile_state}`,
        `Verification: ${state.verification_state}`,
        `Readiness: ${state.readiness_state}`,
        `Eligibility: ${state.eligibility_state}`,
        `Visibility: ${state.visibility_state}`,
        `Confidence: ${state.confidence_score}%`,
        `Completion: ${state.completion_score}%`
      ].join(" | ");

    }

  };

  window.STATScore.StateEngine = StateEngine;

  console.info(
    "[STATScore] State Engine Loaded:",
    StateEngine.version
  );

})(); 
