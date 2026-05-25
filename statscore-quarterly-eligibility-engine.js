/* ============================================================
   STATScore™ Quarterly Eligibility Engine
   File: statscore-quarterly-eligibility-engine.js
   Version: STATSCORE-QUARTERLY-ELIGIBILITY-V1

   PURPOSE:
   Tracks longitudinal NCAA eligibility progression,
   quarterly academic survivability, core-course pacing,
   transcript readiness, counselor reviews, and pathway risk.

   This engine creates academic intelligence signals
   that feed:
   - Compliance Engine
   - Pathway Engine
   - Synthesis Engine
   - State Engine
   - Recruiter Visibility
============================================================ */

(function () {

  "use strict";

  window.STATScore =
    window.STATScore || {};

  const QuarterlyEligibilityEngine = {

    version:
      "STATSCORE-QUARTERLY-ELIGIBILITY-V1",

    QUARTERS: {
      Q1: "Quarter 1",
      Q2: "Quarter 2",
      Q3: "Quarter 3",
      Q4: "Quarter 4"
    },

    ELIGIBILITY_STATUS: {

      ON_TRACK:
        "ON_TRACK",

      REVIEW_REQUIRED:
        "REVIEW_REQUIRED",

      MODERATE_RISK:
        "MODERATE_RISK",

      HIGH_RISK:
        "HIGH_RISK",

      CRITICAL:
        "CRITICAL"

    },

    nowISO() {

      return new Date()
        .toISOString();

    },

    normalize(value) {

      return String(value || "")
        .trim();

    },

    lower(value) {

      return this.normalize(value)
        .toLowerCase();

    },

    clamp(
      value,
      min = 0,
      max = 100
    ) {

      const n =
        Number(value || 0);

      return Math.max(
        min,
        Math.min(max, n)
      );

    },

    buildQuarterRecord(payload = {}) {

      return {

        quarter_record_id:
          "qe_" +
          Date.now(),

        engine_version:
          this.version,

        athlete_id:
          payload.athlete_id || null,

        snapshot_id:
          payload.snapshot_id || null,

        school_year:
          payload.school_year || "",

        grade_level:
          payload.grade_level || "",

        quarter:
          payload.quarter || "Q1",

        core_courses_completed:
          Number(
            payload.core_courses_completed || 0
          ),

        core_courses_in_progress:
          Number(
            payload.core_courses_in_progress || 0
          ),

        overall_gpa:
          Number(
            payload.overall_gpa || 0
          ),

        core_gpa:
          Number(
            payload.core_gpa || 0
          ),

        transcript_status:
          payload.transcript_status ||
          "PENDING",

        counselor_review_status:
          payload.counselor_review_status ||
          "PENDING",

        ncaa_eligibility_status:
          payload.ncaa_eligibility_status ||
          "UNKNOWN",

        missing_courses:
          payload.missing_courses || [],

        counselor_notes:
          payload.counselor_notes || "",

        created_at:
          this.nowISO(),

        locked: true

      };

    },

    evaluateQuarter(record = {}) {

      let riskScore = 100;

      const missing =
        Number(
          record.missing_courses?.length || 0
        );

      const overallGpa =
        Number(
          record.overall_gpa || 0
        );

      const coreGpa =
        Number(
          record.core_gpa || 0
        );

      const transcript =
        this.lower(
          record.transcript_status
        );

      const counselor =
        this.lower(
          record.counselor_review_status
        );

      /* =========================================
         GPA IMPACT
      ========================================= */

      if (overallGpa < 2.0) {
        riskScore -= 35;
      }

      else if (overallGpa < 2.3) {
        riskScore -= 25;
      }

      else if (overallGpa < 2.7) {
        riskScore -= 12;
      }

      if (coreGpa < 2.0) {
        riskScore -= 25;
      }

      /* =========================================
         COURSE DEFICIT
      ========================================= */

      riskScore -=
        (missing * 8);

      /* =========================================
         TRANSCRIPT STATUS
      ========================================= */

      if (
        transcript.includes(
          "missing"
        )
      ) {

        riskScore -= 20;

      }

      /* =========================================
         COUNSELOR REVIEW
      ========================================= */

      if (
        counselor.includes(
          "pending"
        )
      ) {

        riskScore -= 10;

      }

      riskScore =
        this.clamp(riskScore);

      let status =
        this.ELIGIBILITY_STATUS.ON_TRACK;

      if (riskScore < 80) {
        status =
          this.ELIGIBILITY_STATUS.REVIEW_REQUIRED;
      }

      if (riskScore < 65) {
        status =
          this.ELIGIBILITY_STATUS.MODERATE_RISK;
      }

      if (riskScore < 45) {
        status =
          this.ELIGIBILITY_STATUS.HIGH_RISK;
      }

      if (riskScore < 25) {
        status =
          this.ELIGIBILITY_STATUS.CRITICAL;
      }

      return {

        status,

        risk_score:
          riskScore,

        recruiter_visibility:
          this.recruiterVisibility(
            status
          ),

        pathway_impact:
          this.pathwayImpact(
            status
          ),

        recommended_actions:
          this.recommendedActions(
            record,
            status
          ),

        generated_at:
          this.nowISO()

      };

    },

    recruiterVisibility(status) {

      switch(status) {

        case "ON_TRACK":
          return "FULL";

        case "REVIEW_REQUIRED":
          return "CONTROLLED";

        case "MODERATE_RISK":
          return "LIMITED";

        case "HIGH_RISK":
          return "RESTRICTED";

        case "CRITICAL":
          return "LOCKED";

        default:
          return "CONTROLLED";

      }

    },

    pathwayImpact(status) {

      switch(status) {

        case "ON_TRACK":
          return "PATHWAY_STABLE";

        case "REVIEW_REQUIRED":
          return "PATHWAY_MONITOR";

        case "MODERATE_RISK":
          return "PATHWAY_DELAYED";

        case "HIGH_RISK":
          return "PATHWAY_UNSTABLE";

        case "CRITICAL":
          return "PATHWAY_BLOCKED";

        default:
          return "PATHWAY_UNKNOWN";

      }

    },

    recommendedActions(
      record,
      status
    ) {

      const actions = [];

      if (
        Number(
          record.overall_gpa || 0
        ) < 2.3
      ) {

        actions.push(
          "Academic intervention recommended."
        );

      }

      if (
        Number(
          record.missing_courses?.length || 0
        ) > 0
      ) {

        actions.push(
          "Review missing NCAA core-course requirements."
        );

      }

      if (
        this.lower(
          record.transcript_status
        ).includes("missing")
      ) {

        actions.push(
          "Transcript upload and counselor verification required."
        );

      }

      if (
        status ===
        this.ELIGIBILITY_STATUS.HIGH_RISK
      ) {

        actions.push(
          "Restrict recruiter exposure until counselor review."
        );

      }

      if (
        status ===
        this.ELIGIBILITY_STATUS.CRITICAL
      ) {

        actions.push(
          "Escalate to academic recovery pathway immediately."
        );

      }

      return actions;

    },

    generateEligibilitySignals(
      evaluation = {},
      record = {}
    ) {

      return [

        {

          signal_type:
            "academic_survivability",

          signal_value:
            evaluation.status,

          source_role:
            "counselor",

          confidence:
            evaluation.risk_score,

          created_at:
            this.nowISO()

        },

        {

          signal_type:
            "recruiter_visibility",

          signal_value:
            evaluation.recruiter_visibility,

          source_role:
            "system",

          confidence:
            evaluation.risk_score,

          created_at:
            this.nowISO()

        },

        {

          signal_type:
            "pathway_stability",

          signal_value:
            evaluation.pathway_impact,

          source_role:
            "system",

          confidence:
            evaluation.risk_score,

          created_at:
            this.nowISO()

        }

      ];

    },

    buildQuarterlyReport(
      payload = {}
    ) {

      const record =
        this.buildQuarterRecord(
          payload
        );

      const evaluation =
        this.evaluateQuarter(
          record
        );

      const signals =
        this.generateEligibilitySignals(
          evaluation,
          record
        );

      return {

        ok: true,

        engine_version:
          this.version,

        athlete_id:
          record.athlete_id,

        snapshot_id:
          record.snapshot_id,

        quarter_record:
          record,

        evaluation,

        generated_signals:
          signals,

        generated_at:
          this.nowISO(),

        locked: true

      };

    },

    explain(report) {

      if (!report) {
        return
          "No quarterly eligibility report.";
      }

      return [

        `Quarter: ${report.quarter_record.quarter}`,

        `Status: ${report.evaluation.status}`,

        `Risk Score: ${report.evaluation.risk_score}`,

        `Recruiter Visibility: ${report.evaluation.recruiter_visibility}`,

        `Pathway Impact: ${report.evaluation.pathway_impact}`

      ].join(" | ");

    }

  };

  window.STATScore
    .QuarterlyEligibilityEngine =
      QuarterlyEligibilityEngine;

  console.info(
    "[STATScore] Quarterly Eligibility Engine Loaded:",
    QuarterlyEligibilityEngine.version
  );

})(); 
