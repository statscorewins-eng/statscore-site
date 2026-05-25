/* ============================================================
   STATScore™ Compliance Engine
   File: statscore-compliance-engine.js
   Version: STATSCORE-COMPLIANCE-ENGINE-V1
   Purpose:
   NCAA communication-window governance, guardian protection,
   recruiter contact gating, eligibility rule awareness,
   communication restrictions, and audit-ready compliance checks.

   Note:
   Recruiting-calendar dates must be loaded from current NCAA/source
   rule data. This engine enforces supplied rule data; it does not
   hardcode unstable calendar dates.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const ComplianceEngine = {

    version: "STATSCORE-COMPLIANCE-ENGINE-V1",

    PERIODS: {
      CONTACT: "CONTACT_PERIOD",
      QUIET: "QUIET_PERIOD",
      DEAD: "DEAD_PERIOD",
      EVALUATION: "EVALUATION_PERIOD",
      UNKNOWN: "UNKNOWN_PERIOD"
    },

    COMMUNICATION_STATUS: {
      ALLOWED: "ALLOWED",
      LIMITED: "LIMITED",
      BLOCKED: "BLOCKED",
      GUARDIAN_REQUIRED: "GUARDIAN_REQUIRED",
      REVIEW_REQUIRED: "REVIEW_REQUIRED"
    },

    CORE_COURSE_RULES: {
      DI: {
        total_core_courses: 16,
        label: "NCAA Division I Core-Course Review"
      },
      DII: {
        total_core_courses: 16,
        label: "NCAA Division II Core-Course Review"
      }
    },

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    roleAccess() {
      return window.STATScoreRoleAccess || null;
    },

    normalize(value) {
      return String(value || "").trim();
    },

    lower(value) {
      return this.normalize(value).toLowerCase();
    },

    dateOnly(value) {
      if (!value) return new Date().toISOString().slice(0, 10);
      return new Date(value).toISOString().slice(0, 10);
    },

    isMinor(snapshot) {
      const age = Number(snapshot?.raw?.age || snapshot?.age || 0);
      const classYear = Number(snapshot?.graduation_class || 0);
      const currentYear = new Date().getFullYear();

      if (age && age < 18) return true;
      if (classYear && classYear >= currentYear) return true;

      return true;
    },

    guardianApproved(snapshot) {
      return !!(
        snapshot?.guardian_name ||
        snapshot?.guardian_email ||
        snapshot?.raw?.verificationPermission === "Parent/Guardian approved"
      );
    },

    resolveRecruitingPeriod(ruleCalendar = [], context = {}) {
      const checkDate = this.dateOnly(context.date || new Date());

      const match = ruleCalendar.find((rule) => {
        const start = this.dateOnly(rule.start_date);
        const end = this.dateOnly(rule.end_date);
        const sportMatch =
          !rule.sport ||
          this.lower(rule.sport) === this.lower(context.sport);

        const divisionMatch =
          !rule.division ||
          this.lower(rule.division) === this.lower(context.division);

        return (
          sportMatch &&
          divisionMatch &&
          checkDate >= start &&
          checkDate <= end
        );
      });

      if (!match) {
        return {
          period: this.PERIODS.UNKNOWN,
          label: "Recruiting period unknown",
          rule_source: "NO_RULE_MATCH",
          requires_review: true
        };
      }

      return {
        period: match.period || this.PERIODS.UNKNOWN,
        label: match.label || match.period || "Recruiting Period",
        rule_source: match.rule_source || "RULE_CALENDAR",
        requires_review: false,
        raw_rule: match
      };
    },

    canRecruiterContactAthlete(snapshot, context = {}) {
      const period = this.resolveRecruitingPeriod(
        context.rule_calendar || [],
        {
          sport: snapshot?.sport,
          division: context.division || "DI",
          date: context.date
        }
      );

      const guardianRequired = this.isMinor(snapshot);
      const guardianOk = this.guardianApproved(snapshot);
      const role = this.lower(context.source_role || "recruiter");

      if (role !== "recruiter" && role !== "admin") {
        return {
          status: this.COMMUNICATION_STATUS.BLOCKED,
          allowed: false,
          reason: "Only recruiter or admin role may initiate recruiter-athlete contact check.",
          period
        };
      }

      if (period.period === this.PERIODS.DEAD) {
        return {
          status: this.COMMUNICATION_STATUS.BLOCKED,
          allowed: false,
          reason: "Recruiter contact blocked by current recruiting-period rule data.",
          period
        };
      }

      if (guardianRequired && !guardianOk) {
        return {
          status: this.COMMUNICATION_STATUS.GUARDIAN_REQUIRED,
          allowed: false,
          reason: "Guardian approval is required before recruiter-athlete communication.",
          period
        };
      }

      if (period.period === this.PERIODS.UNKNOWN) {
        return {
          status: this.COMMUNICATION_STATUS.REVIEW_REQUIRED,
          allowed: false,
          reason: "Recruiting period could not be resolved. Compliance review required.",
          period
        };
      }

      if (period.period === this.PERIODS.QUIET) {
        return {
          status: this.COMMUNICATION_STATUS.LIMITED,
          allowed: true,
          reason: "Communication may be limited under supplied quiet-period rule data.",
          period
        };
      }

      return {
        status: this.COMMUNICATION_STATUS.ALLOWED,
        allowed: true,
        reason: "Communication permitted under supplied rule data and guardian controls.",
        period
      };
    },

    evaluateMultiBoxMessage(message = {}, snapshot = {}, context = {}) {
      const fromRole = this.lower(message.from_role);
      const toRole = this.lower(message.to_role);

      const recruiterInvolved =
        fromRole === "recruiter" || toRole === "recruiter";

      if (recruiterInvolved && (fromRole === "athlete" || toRole === "athlete")) {
        const contact = this.canRecruiterContactAthlete(snapshot, {
          ...context,
          source_role: fromRole === "recruiter" ? "recruiter" : context.source_role
        });

        return {
          allowed: contact.allowed,
          status: contact.status,
          reason: contact.reason,
          period: contact.period,
          audit_required: true
        };
      }

      if (toRole === "athlete" && this.isMinor(snapshot) && !this.guardianApproved(snapshot)) {
        return {
          allowed: false,
          status: this.COMMUNICATION_STATUS.GUARDIAN_REQUIRED,
          reason: "Minor athlete communication requires guardian approval lane.",
          audit_required: true
        };
      }

      return {
        allowed: true,
        status: this.COMMUNICATION_STATUS.ALLOWED,
        reason: "Role-to-role message permitted under current compliance checks.",
        audit_required: true
      };
    },

    evaluateCoreCourseProgress(courseRecord = {}, division = "DI") {
      const rule = this.CORE_COURSE_RULES[String(division || "DI").toUpperCase()] || this.CORE_COURSE_RULES.DI;

      const completed = Number(courseRecord.total_core_courses_completed || 0);
      const gpa = Number(courseRecord.core_gpa || 0);
      const transcriptStatus = this.lower(courseRecord.transcript_status);

      const missing = Math.max(0, rule.total_core_courses - completed);

      let status = "REVIEW_REQUIRED";
      let risk = "UNKNOWN";

      if (missing === 0 && gpa >= 2.3 && transcriptStatus.includes("confirmed")) {
        status = "ON_TRACK";
        risk = "LOW";
      } else if (missing <= 3 && gpa >= 2.0) {
        status = "PARTIAL_REVIEW";
        risk = "MODERATE";
      } else {
        status = "RISK_REVIEW";
        risk = "HIGH";
      }

      return {
        division,
        label: rule.label,
        required_core_courses: rule.total_core_courses,
        completed_core_courses: completed,
        missing_core_courses: missing,
        core_gpa: gpa || null,
        transcript_status: courseRecord.transcript_status || "UNKNOWN",
        status,
        risk,
        counselor_review_required: status !== "ON_TRACK",
        note:
          "STATScore tracks readiness and risk only. NCAA Eligibility Center and school records remain official authorities."
      };
    },

    buildComplianceReceipt(action, result, snapshot = {}) {
      return {
        receipt_type: "STATSCORE_COMPLIANCE_RECEIPT",
        engine_version: this.version,
        action,
        athlete_id: snapshot?.athlete_id || null,
        snapshot_id: snapshot?.snapshot_id || null,
        result,
        created_at: this.nowISO(),
        locked: true
      };
    },

    complianceNarrative(result) {
      if (!result) return "No compliance result available.";

      if (result.allowed === false) {
        return `Compliance restriction: ${result.reason}`;
      }

      if (result.status === this.COMMUNICATION_STATUS.LIMITED) {
        return `Limited communication: ${result.reason}`;
      }

      return result.reason || "Compliance check completed.";
    },

    renderCompliancePanel(targetId, result) {
      const el = document.getElementById(targetId);
      if (!el) return;

      el.innerHTML = `
        <div class="compliance-kicker">STATScore Compliance Intelligence</div>
        <h2>${result?.status || "REVIEW REQUIRED"}</h2>
        <p>${this.complianceNarrative(result)}</p>
      `;
    }

  };

  window.STATScore.ComplianceEngine = ComplianceEngine;

  console.info("[STATScore] Compliance Engine Loaded:", ComplianceEngine.version);

})(); 
