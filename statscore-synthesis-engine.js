/* ============================================================
   STATScore™ Synthesis Engine
   File: statscore-synthesis-engine.js
   Purpose: Fuse room signals into unified athlete intelligence state.
   Status: Build Layer / Intelligence Fusion
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const SynthesisEngine = {
    version: "STATScore-SYNTHESIS-V1",

    createBaseState() {
      return {
        athlete_id: null,
        synthesis_version: this.version,
        generated_at: new Date().toISOString(),

        profile_state: "UNVERIFIED_PROFILE",
        verification_state: "EVIDENCE_PENDING",
        readiness_state: "DEVELOPING",
        eligibility_state: "PARTIAL_REVIEW",
        pathway_state: "PATH_PENDING",
        visibility_state: "CONTROLLED",
        media_state: "MEDIA_PENDING",

        athletic_projection: "UNISSUED",
        academic_risk: "UNKNOWN",
        exposure_gap: "PENDING",
        competition_level: "UNVERIFIED",

        confidence_score: 0,
        completion_score: 0,

        blocking_items: [],
        recommended_actions: [],
        intelligence_notes: [],
        source_signals: {}
      };
    },

    normalizeSignal(value) {
      if (!value) return "UNKNOWN";
      return String(value).trim().toUpperCase();
    },

    calculateCompletion(signals) {
      const required = [
        "profile",
        "verification",
        "readiness",
        "eligibility",
        "pathway",
        "media",
        "evaluator",
        "coach",
        "counselor"
      ];

      let complete = 0;

      required.forEach((key) => {
        if (signals[key] && signals[key] !== "UNKNOWN" && signals[key] !== "--") {
          complete++;
        }
      });

      return Math.round((complete / required.length) * 100);
    },

    calculateConfidence(signals) {
      let score = 40;

      if (signals.evaluator === "VERIFIED") score += 20;
      if (signals.media === "READY" || signals.media === "ROUTED") score += 10;
      if (signals.coach && signals.coach !== "UNKNOWN") score += 10;
      if (signals.counselor && signals.counselor !== "UNKNOWN") score += 10;
      if (signals.competition_level === "VERIFIED") score += 10;

      return Math.min(score, 100);
    },

    synthesize(input = {}) {
      const state = this.createBaseState();

      state.athlete_id = input.athlete_id || input.snapshot_id || null;

      const signals = {
        profile: this.normalizeSignal(input.profile_state),
        verification: this.normalizeSignal(input.verification_state),
        readiness: this.normalizeSignal(input.readiness_state),
        eligibility: this.normalizeSignal(input.eligibility_state),
        pathway: this.normalizeSignal(input.pathway_state),
        media: this.normalizeSignal(input.media_state),
        evaluator: this.normalizeSignal(input.evaluator_state),
        coach: this.normalizeSignal(input.coach_state),
        counselor: this.normalizeSignal(input.counselor_state),
        recruiter: this.normalizeSignal(input.recruiter_state),
        program: this.normalizeSignal(input.program_state),
        competition_level: this.normalizeSignal(input.competition_level)
      };

      state.source_signals = signals;

      state.completion_score = this.calculateCompletion(signals);
      state.confidence_score = this.calculateConfidence(signals);

      if (signals.profile.includes("ACTIVE") || signals.profile.includes("CREATED")) {
        state.profile_state = "PROFILE_ACTIVE";
      }

      if (signals.evaluator === "VERIFIED") {
        state.verification_state = "VERIFIED_SIGNAL_PRESENT";
      }

      if (signals.readiness.includes("DEVELOPING")) {
        state.readiness_state = "DEVELOPING_PLAN_REQUIRED";
        state.recommended_actions.push("Attach verified film, metrics, and development plan.");
      }

      if (signals.eligibility.includes("PARTIAL") || signals.eligibility.includes("YELLOW")) {
        state.eligibility_state = "PARTIAL_NCAA_REVIEW";
        state.blocking_items.push("Eligibility standing requires transcript/course confirmation.");
      }

      if (signals.pathway.includes("PENDING")) {
        state.pathway_state = "BEST_ROUTE_NOT_FINALIZED";
        state.recommended_actions.push("Complete readiness and eligibility review before route escalation.");
      }

      if (signals.media.includes("PENDING")) {
        state.media_state = "MEDIA_INTAKE_REQUIRED";
        state.recommended_actions.push("Upload headshot, highlight reel, and verified game/training film.");
      }

      if (signals.competition_level === "VERIFIED") {
        state.competition_level = "VERIFIED_COMPETITION_CONTEXT";
      } else {
        state.blocking_items.push("Competition level has not been verified.");
      }

      if (state.confidence_score >= 85) {
        state.visibility_state = "CONTROLLED_HIGH_CONFIDENCE";
      } else if (state.confidence_score >= 65) {
        state.visibility_state = "CONTROLLED_REVIEW";
      } else {
        state.visibility_state = "RESTRICTED_PENDING_EVIDENCE";
      }

      state.exposure_gap =
        state.blocking_items.length > 0
          ? "EXPOSURE_LIMITED_BY_PENDING ITEMS"
          : "EXPOSURE_READY_FOR_CONTROLLED ROUTING";

      state.intelligence_notes.push(
        "Synthesis generated from role-fed STATScore room signals."
      );

      return state;
    },

    explain(state) {
      if (!state) return "No synthesis state available.";

      return [
        `Completion: ${state.completion_score}%`,
        `Confidence: ${state.confidence_score}%`,
        `Visibility: ${state.visibility_state}`,
        `Readiness: ${state.readiness_state}`,
        `Eligibility: ${state.eligibility_state}`,
        `Pathway: ${state.pathway_state}`
      ].join(" | ");
    }
  };

  window.STATScore.SynthesisEngine = SynthesisEngine;

  console.info("[STATScore] Synthesis Engine loaded:", SynthesisEngine.version);
})(); 
