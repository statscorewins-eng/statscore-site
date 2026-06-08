/* ============================================================
   STATS-CORE™ ELIGIBILITY ENGINE
   File: statscore-eligibility-engine.js 
   Version: STATSCORE-ELIGIBILITY-ENGINE-V1

   Purpose:
   Universal Eligibility Portability Intelligence.

   Doctrine:
   - STATS-CORE does NOT replace school grading systems.
   - STATS-CORE does NOT replace FOCUS or district SIS platforms.
   - STATS-CORE translates eligibility across schools, districts,
     states, grading systems, and athletic pathways.
   - Athletics and academics are never mixed.
   - Eligibility risk routes the athlete; it does not erase the athlete.
============================================================ */

(function(){ 
  "use strict";

  window.STATSCORE_ELIGIBILITY_ENGINE = {
    id: "ELIGIBILITY_ENGINE",
    name: "STATS-CORE Eligibility Engine",
    version: "STATSCORE-ELIGIBILITY-ENGINE-V1",
    status: "ACTIVE",
    locked: true,

    RISK_LEVELS: {
      CLEAR: "CLEAR",
      MONITOR: "MONITOR",
      REVIEW: "REVIEW",
      HIGH_RISK: "HIGH_RISK",
      BLOCKED: "BLOCKED",
      UNKNOWN: "UNKNOWN"
    },

    PORTABILITY_STATUS: {
      PORTABLE: "PORTABLE",
      CONDITIONALLY_PORTABLE: "CONDITIONALLY_PORTABLE",
      REVIEW_REQUIRED: "REVIEW_REQUIRED",
      NOT_PORTABLE_YET: "NOT_PORTABLE_YET",
      UNKNOWN: "UNKNOWN"
    },

    normalize(value){
      return String(value || "").trim();
    },

    lower(value){
      return this.normalize(value).toLowerCase();
    },

    number(value){
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    },

    evaluate(profile = {}){
      const normalized = this.normalizeProfile(profile);

      const gpaRisk = this.evaluateGpa(normalized);
      const transcriptRisk = this.evaluateTranscript(normalized);
      const coreCourseRisk = this.evaluateCoreCourses(normalized);
      const testingRisk = this.evaluateTesting(normalized);
      const transferRisk = this.evaluateTransfer(normalized);
      const governingBodyRisk = this.evaluateGoverningBody(normalized);
      const counselorRisk = this.evaluateCounselor(normalized);

      const flags = [
        ...gpaRisk.flags,
        ...transcriptRisk.flags,
        ...coreCourseRisk.flags,
        ...testingRisk.flags,
        ...transferRisk.flags,
        ...governingBodyRisk.flags,
        ...counselorRisk.flags
      ];

      const riskScore = this.calculateRiskScore([
        gpaRisk,
        transcriptRisk,
        coreCourseRisk,
        testingRisk,
        transferRisk,
        governingBodyRisk,
        counselorRisk
      ]);

      const eligibilityRisk = this.resolveRiskLevel(riskScore, flags);
      const portability = this.resolvePortability(eligibilityRisk, flags);

      const missingRequirements = this.collectMissingRequirements(flags);
      const counselorActions = this.collectCounselorActions(flags);
      const pathwayRecommendation = this.resolvePathwayRecommendation(eligibilityRisk, portability);

      return {
        ok: true,
        engine: this.name,
        engine_version: this.version,

        athlete_id: normalized.athlete_id,
        snapshot_id: normalized.snapshot_id,
        athlete_name: normalized.athlete_name,
         
eligibility_status: this.resolveEligibilityStatus(eligibilityRisk),
display_status: this.resolveDisplayStatus(eligibilityRisk),
risk_label: this.resolveRiskLabel(eligibilityRisk),
ncaa_display: this.resolveGoverningDisplay(normalized.ncaa_status, "NCAA"),
state_display: this.resolveStateDisplay(normalized),
district_display: this.resolveDistrictDisplay(normalized),
last_audit: new Date().toLocaleDateString(),
eligibility_risk: eligibilityRisk,
eligibility_risk_score: riskScore, 
        portability_status: portability.status,
        portability_label: portability.label,

        grading_system: normalized.grading_system,
        district: normalized.district,
        state: normalized.state,
        school: normalized.school,

        gpa_review: gpaRisk,
        transcript_review: transcriptRisk,
        core_course_review: coreCourseRisk,
        testing_review: testingRisk,
        transfer_review: transferRisk,
        governing_body_review: governingBodyRisk,
        counselor_review: counselorRisk,

        missing_requirements: missingRequirements,
        counselor_action_flags: counselorActions,
        pathway_recommendation: pathwayRecommendation,

        why: this.explain({
          normalized,
          eligibilityRisk,
          riskScore,
          portability,
          flags,
          pathwayRecommendation
        }),

        generated_at: new Date().toISOString(),
        locked: true
      };
    },

    normalizeProfile(profile){
      return {
        athlete_id: profile.athlete_id || null,
        snapshot_id: profile.snapshot_id || null,
        athlete_name: profile.athlete_name || profile.athlete_display_name || "Athlete",

        gpa: this.number(profile.gpa || profile.current_gpa || profile.core_gpa),
        core_gpa: this.number(profile.core_gpa || profile.gpa || profile.current_gpa),

        sat: this.number(profile.sat),
        act: this.number(profile.act),

        core_courses_required: this.number(profile.core_courses_required || 16),
        core_courses_completed: this.number(profile.core_courses_completed || profile.coreCoursesCompleted || 0),

        credits_required: this.number(profile.credits_required || 24),
        credits_earned: this.number(profile.credits_earned || profile.creditsEarned || 0),

        transcript_status: this.lower(profile.transcript_status || profile.transcript_available || profile.transcriptAvailable),
        ncaa_status: this.lower(profile.ncaa_status || profile.ncaaEligibilityStatus),
        naia_status: this.lower(profile.naia_status),
        njcaa_status: this.lower(profile.njcaa_status),

        counselor_contact: this.lower(profile.counselor_contact || profile.counselorContact),
        counselor_verified: Boolean(profile.counselor_verified),

        transfer_status: this.lower(profile.transfer_status || profile.transferStatus),
        previous_school: profile.previous_school || null,
        school: profile.school || profile.schoolProgram || "",
        district: profile.district || "",
        state: profile.state || "",
        grading_system: profile.grading_system || profile.gradingSystem || "UNKNOWN",

        graduation_year: profile.graduation_year || profile.graduationClass || "",
        class_rank: profile.class_rank || profile.classRank || ""
      };
    },

    evaluateGpa(p){
      const flags = [];

      if(!p.gpa){
        flags.push("GPA_MISSING");
        return {
          area: "GPA",
          status: "UNKNOWN",
          risk_points: 18,
          flags,
          message: "GPA is missing. Eligibility cannot be safely interpreted."
        };
      }

      if(p.gpa < 2.0){
        flags.push("GPA_HIGH_RISK");
        return {
          area: "GPA",
          status: "HIGH_RISK",
          risk_points: 25,
          flags,
          message: "GPA is below common eligibility safety thresholds."
        };
      }

      if(p.gpa < 2.3){
        flags.push("GPA_REVIEW");
        return {
          area: "GPA",
          status: "REVIEW",
          risk_points: 16,
          flags,
          message: "GPA requires eligibility review and academic monitoring."
        };
      }

      if(p.gpa < 2.75){
        flags.push("GPA_MONITOR");
        return {
          area: "GPA",
          status: "MONITOR",
          risk_points: 8,
          flags,
          message: "GPA is usable but should remain under monitoring."
        };
      }

      return {
        area: "GPA",
        status: "CLEAR",
        risk_points: 0,
        flags,
        message: "GPA appears eligibility-safe pending transcript confirmation."
      };
    },

    evaluateTranscript(p){
      const flags = [];

      if(["yes", "available", "uploaded", "true"].includes(p.transcript_status)){
        return {
          area: "TRANSCRIPT",
          status: "CLEAR",
          risk_points: 0,
          flags,
          message: "Transcript appears available."
        };
      }

      if(["parent permission required", "parent_permission_required", "permission required"].includes(p.transcript_status)){
        flags.push("TRANSCRIPT_PARENT_PERMISSION_REQUIRED");
        return {
          area: "TRANSCRIPT",
          status: "REVIEW",
          risk_points: 14,
          flags,
          message: "Transcript requires parent/guardian permission."
        };
      }

      flags.push("TRANSCRIPT_MISSING");
      return {
        area: "TRANSCRIPT",
        status: "HIGH_RISK",
        risk_points: 22,
        flags,
        message: "Transcript is missing or unavailable."
      };
    },

    evaluateCoreCourses(p){
      const flags = [];

      if(!p.core_courses_completed){
        flags.push("CORE_COURSES_UNKNOWN");
        return {
          area: "CORE_COURSES",
          status: "UNKNOWN",
          risk_points: 18,
          flags,
          message: "Core course completion is unknown."
        };
      }

      if(p.core_courses_completed < p.core_courses_required){
        flags.push("CORE_COURSE_DEFICIENCY");
        return {
          area: "CORE_COURSES",
          status: "REVIEW",
          risk_points: 16,
          flags,
          message: `Core courses incomplete: ${p.core_courses_completed}/${p.core_courses_required}.`
        };
      }

      return {
        area: "CORE_COURSES",
        status: "CLEAR",
        risk_points: 0,
        flags,
        message: `Core courses appear complete: ${p.core_courses_completed}/${p.core_courses_required}.`
      };
    },

    evaluateTesting(p){
      const flags = [];

      if(!p.sat && !p.act){
        flags.push("TESTING_MISSING");
        return {
          area: "TESTING",
          status: "MONITOR",
          risk_points: 8,
          flags,
          message: "SAT/ACT data is missing. Testing may be needed depending on pathway."
        };
      }

      return {
        area: "TESTING",
        status: "CLEAR",
        risk_points: 0,
        flags,
        message: "Testing data is present."
      };
    },

    evaluateTransfer(p){
      const flags = [];

      if(!p.transfer_status){
        return {
          area: "TRANSFER",
          status: "CLEAR",
          risk_points: 0,
          flags,
          message: "No transfer issue detected."
        };
      }

      if(p.transfer_status.includes("transfer") || p.previous_school){
        flags.push("TRANSFER_REVIEW_REQUIRED");
        return {
          area: "TRANSFER",
          status: "REVIEW",
          risk_points: 14,
          flags,
          message: "Transfer history requires eligibility portability review."
        };
      }

      return {
        area: "TRANSFER",
        status: "CLEAR",
        risk_points: 0,
        flags,
        message: "Transfer status does not currently create risk."
      };
    },

    evaluateGoverningBody(p){
      const flags = [];
      const statusText = `${p.ncaa_status} ${p.naia_status} ${p.njcaa_status}`;

      if(!statusText.trim()){
        flags.push("GOVERNING_BODY_STATUS_UNKNOWN");
        return {
          area: "GOVERNING_BODY",
          status: "UNKNOWN",
          risk_points: 14,
          flags,
          message: "NCAA/NAIA/NJCAA status is unknown."
        };
      }

      if(statusText.includes("needs") || statusText.includes("not started") || statusText.includes("review")){
        flags.push("GOVERNING_BODY_REVIEW_REQUIRED");
        return {
          area: "GOVERNING_BODY",
          status: "REVIEW",
          risk_points: 16,
          flags,
          message: "Governing-body eligibility status requires review."
        };
      }

      if(statusText.includes("on track") || statusText.includes("verified") || statusText.includes("eligible")){
        return {
          area: "GOVERNING_BODY",
          status: "CLEAR",
          risk_points: 0,
          flags,
          message: "Governing-body eligibility appears on track."
        };
      }

      return {
        area: "GOVERNING_BODY",
        status: "MONITOR",
        risk_points: 8,
        flags,
        message: "Governing-body status should be monitored."
      };
    },

    evaluateCounselor(p){
      const flags = [];

      if(p.counselor_verified || ["yes", "confirmed", "available"].includes(p.counselor_contact)){
        return {
          area: "COUNSELOR",
          status: "CLEAR",
          risk_points: 0,
          flags,
          message: "Counselor contact appears available."
        };
      }

      if(["pending", "in progress"].includes(p.counselor_contact)){
        flags.push("COUNSELOR_PENDING");
        return {
          area: "COUNSELOR",
          status: "MONITOR",
          risk_points: 8,
          flags,
          message: "Counselor confirmation is pending."
        };
      }

      flags.push("COUNSELOR_MISSING");
      return {
        area: "COUNSELOR",
        status: "REVIEW",
        risk_points: 12,
        flags,
        message: "Counselor contact is missing."
      };
    },

    calculateRiskScore(reviews){
      return reviews.reduce((sum, r) => sum + this.number(r.risk_points), 0);
    },

    resolveRiskLevel(score, flags){
      if(flags.includes("TRANSCRIPT_MISSING") && flags.includes("GPA_MISSING")){
        return this.RISK_LEVELS.BLOCKED;
      }

      if(score >= 60) return this.RISK_LEVELS.HIGH_RISK;
      if(score >= 38) return this.RISK_LEVELS.REVIEW;
      if(score >= 16) return this.RISK_LEVELS.MONITOR;
      if(score > 0) return this.RISK_LEVELS.MONITOR;
      return this.RISK_LEVELS.CLEAR;
    },

    resolveEligibilityStatus(risk){
    if(risk === this.RISK_LEVELS.CLEAR) return "ELIGIBILITY_CLEAR";
    if(risk === this.RISK_LEVELS.MONITOR) return "ELIGIBILITY_MONITOR";
    if(risk === this.RISK_LEVELS.REVIEW) return "ELIGIBILITY_REVIEW_REQUIRED";
    if(risk === this.RISK_LEVELS.HIGH_RISK) return "ELIGIBILITY_HIGH_RISK";
    if(risk === this.RISK_LEVELS.BLOCKED) return "ELIGIBILITY_BLOCKED_PENDING_RECORDS";
    return "ELIGIBILITY_UNKNOWN";
},

resolveDisplayStatus(risk){
    if(risk === this.RISK_LEVELS.CLEAR) return "CLEAR";
    if(risk === this.RISK_LEVELS.MONITOR) return "MONITOR";
    if(risk === this.RISK_LEVELS.REVIEW) return "REVIEW";
    if(risk === this.RISK_LEVELS.HIGH_RISK) return "HIGH RISK";
    if(risk === this.RISK_LEVELS.BLOCKED) return "BLOCKED";
    return "UNKNOWN";
},

resolveRiskLabel(risk){
    if(risk === this.RISK_LEVELS.CLEAR) return "LOW";
    if(risk === this.RISK_LEVELS.MONITOR) return "MODERATE";
    if(risk === this.RISK_LEVELS.REVIEW) return "REVIEW REQUIRED";
    if(risk === this.RISK_LEVELS.HIGH_RISK) return "HIGH";
    if(risk === this.RISK_LEVELS.BLOCKED) return "BLOCKED";
    return "UNKNOWN";
},

resolveGoverningDisplay(value,label){
    const v = this.lower(value || "");

    if(v.includes("eligible") || v.includes("verified") || v.includes("on track")){
        return `${label}: ELIGIBLE`;
    }

    if(v.includes("review") || v.includes("needs")){
        return `${label}: REVIEW`;
    }

    if(v.includes("not started")){
        return `${label}: NOT STARTED`;
    }

    return `${label}: UNKNOWN`;
},

resolveStateDisplay(p){
    return p.state
        ? `STATE: ${String(p.state).toUpperCase()} REVIEW`
        : "STATE: UNKNOWN";
},

resolveDistrictDisplay(p){
    return p.district
        ? `DISTRICT: ${String(p.district).toUpperCase()} REVIEW`
        : "DISTRICT: UNKNOWN";
}, 

    resolvePortability(risk, flags){
      if(risk === this.RISK_LEVELS.CLEAR){
        return {
          status: this.PORTABILITY_STATUS.PORTABLE,
          label: "Eligibility Portable"
        };
      }

      if(flags.includes("TRANSFER_REVIEW_REQUIRED")){
        return {
          status: this.PORTABILITY_STATUS.REVIEW_REQUIRED,
          label: "Transfer Portability Review Required"
        };
      }

      if(risk === this.RISK_LEVELS.MONITOR){
        return {
          status: this.PORTABILITY_STATUS.CONDITIONALLY_PORTABLE,
          label: "Conditionally Portable"
        };
      }

      if(risk === this.RISK_LEVELS.REVIEW){
        return {
          status: this.PORTABILITY_STATUS.REVIEW_REQUIRED,
          label: "Eligibility Review Required"
        };
      }

      return {
        status: this.PORTABILITY_STATUS.NOT_PORTABLE_YET,
        label: "Not Portable Yet"
      };
    },

    collectMissingRequirements(flags){
      const map = {
        GPA_MISSING: "GPA record required",
        TRANSCRIPT_MISSING: "Transcript required",
        TRANSCRIPT_PARENT_PERMISSION_REQUIRED: "Parent/guardian transcript permission required",
        CORE_COURSES_UNKNOWN: "Core course history required",
        CORE_COURSE_DEFICIENCY: "Core course deficiency must be reviewed",
        TESTING_MISSING: "SAT/ACT data may be needed",
        COUNSELOR_MISSING: "Counselor contact required",
        GOVERNING_BODY_STATUS_UNKNOWN: "NCAA/NAIA/NJCAA status required",
        GOVERNING_BODY_REVIEW_REQUIRED: "Governing-body eligibility review required",
        TRANSFER_REVIEW_REQUIRED: "Transfer eligibility review required"
      };

      return flags.map(flag => map[flag]).filter(Boolean);
    },

    collectCounselorActions(flags){
      return this.collectMissingRequirements(flags).filter(item =>
        item.toLowerCase().includes("course") ||
        item.toLowerCase().includes("transcript") ||
        item.toLowerCase().includes("gpa") ||
        item.toLowerCase().includes("counselor") ||
        item.toLowerCase().includes("eligibility")
      );
    },

    resolvePathwayRecommendation(risk, portability){
      if(risk === this.RISK_LEVELS.CLEAR){
        return "Athlete may continue normal pathway routing.";
      }

      if(risk === this.RISK_LEVELS.MONITOR){
        return "Athlete remains active but should stay under academic eligibility monitoring.";
      }

      if(risk === this.RISK_LEVELS.REVIEW){
        return "Route athlete through counselor review before direct recruiting expansion.";
      }

      if(risk === this.RISK_LEVELS.HIGH_RISK){
        return "Route athlete to bridge, academic recovery, JUCO/prep, or eligibility repair pathway.";
      }

      if(risk === this.RISK_LEVELS.BLOCKED){
        return "Hold eligibility portability until GPA/transcript records are available.";
      }

      return "Eligibility pathway unknown. Build evidence first.";
    },

    explain({ normalized, eligibilityRisk, riskScore, portability, flags, pathwayRecommendation }){
      return [
        `${normalized.athlete_name} was evaluated for eligibility portability, not school-grade replacement.`,
        `Eligibility risk: ${eligibilityRisk}.`,
        `Eligibility risk score: ${riskScore}.`,
        `Portability status: ${portability.label}.`,
        flags.length
          ? `Active flags: ${flags.join(", ")}.`
          : "No active eligibility flags detected.",
        `Pathway recommendation: ${pathwayRecommendation}`,
        "STATS-CORE does not replace school grading systems; it translates eligibility risk across systems."
      ];
    }
  };

  window.STATSCORE_RUN_ELIGIBILITY = function(profile){
    return window.STATSCORE_ELIGIBILITY_ENGINE.evaluate(profile);
  };

  console.info("STATS-CORE Eligibility Engine loaded:", window.STATSCORE_ELIGIBILITY_ENGINE.version);
})(); 
