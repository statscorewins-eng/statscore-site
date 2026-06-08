/* ============================================================
   STATS-CORE™ ACADEMIC MATRIX
   File: statscore-academic-matrix.js
   Purpose:
   Separate academic eligibility/readiness intelligence from
   athletic production. Academics do NOT erase production.
   Academics route the athlete to the correct pathway.
   ============================================================ */

(function(){
  "use strict";

  window.STATSCORE_ACADEMIC_MATRIX = {
    meta: {
      name: "STATS-CORE Academic Matrix",
      version: "1.0.0",
      authority: "STATS-CORE™ / PHNX Sports / RPE",
      doctrine: "Athletics and academics are judged separately, then combined only for pathway routing.",
      locked: true
    },

    coreRules: [
      "Academics do not replace athletic production.",
      "Athletic production does not override academic eligibility.",
      "High production + weak academics routes to bridge/JUCO/prep/academic recovery.",
      "High academics + developing production routes to high-academic developmental programs.",
      "Academic status must explain WHY the athlete is routed.",
      "Eligibility must be understandable to parent, athlete, counselor, coach, and recruiter."
    ],

    gpaBands: {
      elite: {
        min: 3.75,
        label: "Elite Academic Standing",
        tier: "ACADEMIC_ELITE",
        pathwayMeaning: "Strong fit for high-academic institutions and selective programs."
      },
      strong: {
        min: 3.25,
        label: "Strong Academic Standing",
        tier: "ACADEMIC_STRONG",
        pathwayMeaning: "Broad academic access with favorable eligibility posture."
      },
      stable: {
        min: 2.75,
        label: "Stable Academic Standing",
        tier: "ACADEMIC_STABLE",
        pathwayMeaning: "Recruitable academic position with normal monitoring."
      },
      watch: {
        min: 2.30,
        label: "Academic Watch",
        tier: "ACADEMIC_WATCH",
        pathwayMeaning: "Needs counselor tracking, eligibility review, and improvement plan."
      },
      recovery: {
        min: 0,
        label: "Academic Recovery Route",
        tier: "ACADEMIC_RECOVERY",
        pathwayMeaning: "Does not eliminate athlete. Routes to recovery, prep, JUCO, or bridge pathway."
      }
    },

    eligibilityStatuses: {
      verified_track: {
        label: "Verified Track",
        risk: "LOW",
        meaning: "Academic pathway appears documented and eligibility-aligned."
      },
      on_track: {
        label: "On Track",
        risk: "LOW_MODERATE",
        meaning: "Athlete appears on track but still needs monitoring and documentation."
      },
      in_progress: {
        label: "In Progress",
        risk: "MODERATE",
        meaning: "Academic record is developing and requires counselor/guardian follow-up."
      },
      needs_review: {
        label: "Needs Review",
        risk: "HIGH",
        meaning: "Eligibility cannot be safely assumed. Requires review before strong routing."
      },
      not_started: {
        label: "Not Started",
        risk: "HIGH",
        meaning: "Eligibility pathway has not been established. Route to academic intake/recovery."
      },
      unknown: {
        label: "Unknown",
        risk: "UNKNOWN",
        meaning: "Insufficient academic evidence. Route to evidence-building."
      }
    },

    transcriptStatus: {
      available: {
        label: "Transcript Available",
        evidenceQuality: "HIGH"
      },
      pending: {
        label: "Transcript Pending",
        evidenceQuality: "MODERATE"
      },
      parent_permission_required: {
        label: "Parent Permission Required",
        evidenceQuality: "LOCKED"
      },
      unavailable: {
        label: "Transcript Unavailable",
        evidenceQuality: "LOW"
      },
      unknown: {
        label: "Transcript Unknown",
        evidenceQuality: "UNKNOWN"
      }
    },

    counselorContact: {
      confirmed: {
        label: "Counselor Contact Confirmed",
        governanceStatus: "READY"
      },
      pending: {
        label: "Counselor Contact Pending",
        governanceStatus: "PENDING"
      },
      not_provided: {
        label: "Counselor Contact Not Provided",
        governanceStatus: "NEEDS_ACTION"
      },
      unknown: {
        label: "Counselor Contact Unknown",
        governanceStatus: "UNKNOWN"
      }
    },

    evaluateAcademicProfile(input = {}) {
      const gpa = Number(input.gpa || input.academic_gpa || 0);
      const eligibilityRaw = String(input.eligibilityStatus || input.ncaaEligibilityStatus || input.eligibility_status || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");

      const transcriptRaw = String(input.transcriptAvailable || input.transcriptStatus || input.transcript_status || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");

      const counselorRaw = String(input.counselorContact || input.counselor_contact || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");

      const gpaBand = this.resolveGpaBand(gpa);
      const eligibility = this.eligibilityStatuses[eligibilityRaw] || this.eligibilityStatuses.unknown;
      const transcript = this.resolveTranscriptStatus(transcriptRaw);
      const counselor = this.resolveCounselorContact(counselorRaw);

      const academicRoute = this.resolveAcademicRoute({
        gpaBand,
        eligibility,
        transcript,
        counselor
      });

      return {
        engine: "Academic Matrix",
        gpa,
        gpaBand,
        eligibility,
        transcript,
        counselor,
        academicRoute,
        explainability: this.explainAcademicDecision({
          gpa,
          gpaBand,
          eligibility,
          transcript,
          counselor,
          academicRoute
        })
      };
    },

    resolveGpaBand(gpa) {
      if (gpa >= this.gpaBands.elite.min) return this.gpaBands.elite;
      if (gpa >= this.gpaBands.strong.min) return this.gpaBands.strong;
      if (gpa >= this.gpaBands.stable.min) return this.gpaBands.stable;
      if (gpa >= this.gpaBands.watch.min) return this.gpaBands.watch;
      return this.gpaBands.recovery;
    },

    resolveTranscriptStatus(value) {
      if (["yes", "available", "true", "uploaded"].includes(value)) return this.transcriptStatus.available;
      if (["pending", "in_progress"].includes(value)) return this.transcriptStatus.pending;
      if (["parent_permission_required", "permission_required"].includes(value)) return this.transcriptStatus.parent_permission_required;
      if (["no", "unavailable", "false"].includes(value)) return this.transcriptStatus.unavailable;
      return this.transcriptStatus.unknown;
    },

    resolveCounselorContact(value) {
      if (["yes", "confirmed", "true", "available"].includes(value)) return this.counselorContact.confirmed;
      if (["pending", "in_progress"].includes(value)) return this.counselorContact.pending;
      if (["no", "not_provided", "false"].includes(value)) return this.counselorContact.not_provided;
      return this.counselorContact.unknown;
    },

    resolveAcademicRoute({ gpaBand, eligibility, transcript, counselor }) {
      if (gpaBand.tier === "ACADEMIC_ELITE" || gpaBand.tier === "ACADEMIC_STRONG") {
        return {
          route: "HIGH_ACADEMIC_ROUTE",
          label: "High-Academic Program Route",
          meaning: "Athlete can be matched toward academically selective programs if production and fit support it."
        };
      }

      if (gpaBand.tier === "ACADEMIC_STABLE" && eligibility.risk !== "HIGH") {
        return {
          route: "STANDARD_ELIGIBILITY_ROUTE",
          label: "Standard Eligibility Route",
          meaning: "Athlete remains recruitable with normal academic monitoring."
        };
      }

      if (
        gpaBand.tier === "ACADEMIC_WATCH" ||
        eligibility.risk === "HIGH" ||
        transcript.evidenceQuality === "LOW" ||
        counselor.governanceStatus === "NEEDS_ACTION"
      ) {
        return {
          route: "ACADEMIC_BRIDGE_ROUTE",
          label: "Academic Bridge / Counselor Review Route",
          meaning: "Athlete should remain active but must be routed through academic review, counselor support, or eligibility repair."
        };
      }

      return {
        route: "ACADEMIC_RECOVERY_ROUTE",
        label: "Academic Recovery / Prep / JUCO Route",
        meaning: "Athlete is not discarded. System routes to recovery, prep, JUCO, bridge, or fallback pathway."
      };
    },

    explainAcademicDecision({ gpa, gpaBand, eligibility, transcript, counselor, academicRoute }) {
      return [
        `GPA evaluated at ${gpa || "unknown"}.`,
        `Academic tier: ${gpaBand.label}.`,
        `Eligibility status: ${eligibility.label} — ${eligibility.meaning}`,
        `Transcript status: ${transcript.label}.`,
        `Counselor status: ${counselor.label}.`,
        `Recommended academic route: ${academicRoute.label}.`,
        academicRoute.meaning
      ];
    }
  };

  window.STATSCORE_EVALUATE_ACADEMICS = function(input){
    return window.STATSCORE_ACADEMIC_MATRIX.evaluateAcademicProfile(input);
  };

  console.info("STATS-CORE Academic Matrix loaded.");
})(); 
