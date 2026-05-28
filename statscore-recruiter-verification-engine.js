/* ============================================================
   STATScore™ Recruiter Verification Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Recruiter Identity → Verification → Trust Score → Access Authority
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-recruiter-verification-engine";
  const VERSION = "v1.0-recruiting-trust-authority";

  const VERIFICATION_STATUS = {
    VERIFIED: {
      label: "Verified Recruiter",
      color: "#37d67a",
      trust_floor: 85
    },

    PROVISIONAL: {
      label: "Provisionally Verified",
      color: "#9fe7ff",
      trust_floor: 65
    },

    PENDING_REVIEW: {
      label: "Pending Review",
      color: "#ffb100",
      trust_floor: 45
    },

    RESTRICTED: {
      label: "Restricted Recruiter",
      color: "#ff3434",
      trust_floor: 20
    },

    UNVERIFIED: {
      label: "Unverified",
      color: "#ff3434",
      trust_floor: 0
    }
  };

  const ACCESS_LEVELS = {
    FULL_GOVERNED_ACCESS: {
      label: "Full Governed Access",
      description: "Verified recruiter may access approved athlete visibility lanes and governed communication routes."
    },

    COACH_COUNSELOR_ONLY: {
      label: "Coach / Counselor Only",
      description: "Recruiter may communicate through coach, counselor, evaluator, or program lanes only."
    },

    REVIEW_REQUIRED: {
      label: "Review Required",
      description: "Recruiter must complete identity and role validation before expanded access."
    },

    BLOCKED: {
      label: "Blocked",
      description: "Recruiter is not authorized for athlete visibility or communication access."
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Recruiter Verification] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Recruiter Verification] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function getRecruiterIdentityFlags(recruiter = {}) {
    return {
      has_recruiter_id:
        hasValue(recruiter.recruiter_id) ||
        hasValue(recruiter.verified_recruiter_id),

      has_name:
        hasValue(recruiter.recruiter_name) ||
        hasValue(recruiter.name) ||
        hasValue(recruiter.full_name),

      has_school:
        hasValue(recruiter.school_program) ||
        hasValue(recruiter.school) ||
        hasValue(recruiter.institution),

      has_division:
        hasValue(recruiter.division) ||
        hasValue(recruiter.division_level) ||
        Array.isArray(recruiter.division_focus),

      has_email:
        hasValue(recruiter.email) ||
        hasValue(recruiter.work_email) ||
        hasValue(recruiter.school_email),

      has_role:
        hasValue(recruiter.role) ||
        hasValue(recruiter.staff_role) ||
        hasValue(recruiter.title),

      verified_status_marked:
        upper(recruiter.verification_status).includes("VERIFIED") ||
        upper(recruiter.status).includes("VERIFIED"),

      school_domain_email:
        (() => {
          const email =
            recruiter.work_email ||
            recruiter.school_email ||
            recruiter.email ||
            "";

          if (!email.includes("@")) return false;

          const domain = email.split("@")[1] || "";

          return (
            domain.endsWith(".edu") ||
            domain.includes("athletics") ||
            domain.includes("school") ||
            domain.includes("college") ||
            domain.includes("university")
          );
        })(),

      restricted_flag:
        upper(recruiter.status).includes("RESTRICTED") ||
        upper(recruiter.verification_status).includes("RESTRICTED") ||
        recruiter.restricted === true,

      banned_flag:
        upper(recruiter.status).includes("BANNED") ||
        recruiter.banned === true
    };
  }

  function calculateIdentityScore(flags) {
    let score = 0;

    if (flags.has_recruiter_id) score += 22;
    if (flags.has_name) score += 10;
    if (flags.has_school) score += 14;
    if (flags.has_division) score += 12;
    if (flags.has_email) score += 10;
    if (flags.has_role) score += 10;
    if (flags.school_domain_email) score += 10;
    if (flags.verified_status_marked) score += 12;

    if (flags.restricted_flag) score -= 30;
    if (flags.banned_flag) score = 0;

    return clamp(score);
  }

  function calculateActivityScore(recruiter = {}) {
    const coachOutreach =
      safeNumber(recruiter.coach_outreach_count);

    const athleteViews =
      safeNumber(recruiter.athlete_profile_views);

    const verifiedMeetings =
      safeNumber(recruiter.verified_meetings);

    const campAttendance =
      safeNumber(recruiter.camp_attendance_count);

    const followUps =
      safeNumber(recruiter.follow_up_count);

    const responseRate =
      safeNumber(recruiter.response_rate);

    const score =
      Math.min(100, coachOutreach * 5) * 0.18 +
      Math.min(100, athleteViews * 3) * 0.12 +
      Math.min(100, verifiedMeetings * 12) * 0.26 +
      Math.min(100, campAttendance * 10) * 0.18 +
      Math.min(100, followUps * 6) * 0.14 +
      clamp(responseRate) * 0.12;

    return clamp(Math.round(score));
  }

  function calculateComplianceScore(recruiter = {}) {
    let score = 70;

    const violations =
      safeNumber(recruiter.communication_violations);

    const unverifiedContacts =
      safeNumber(recruiter.unverified_athlete_contacts);

    const missedConfirmations =
      safeNumber(recruiter.missed_meeting_confirmations);

    const ncaaAcknowledged =
      recruiter.ncaa_rules_acknowledged === true ||
      upper(recruiter.ncaa_rules_acknowledged).includes("YES") ||
      upper(recruiter.compliance_acknowledgment).includes("YES");

    if (ncaaAcknowledged) score += 15;

    score -= violations * 18;
    score -= unverifiedContacts * 14;
    score -= missedConfirmations * 8;

    return clamp(score);
  }

  function resolveVerificationStatus(identityScore, complianceScore, recruiter = {}) {
    const flags = getRecruiterIdentityFlags(recruiter);

    if (flags.banned_flag) return "RESTRICTED";
    if (flags.restricted_flag) return "RESTRICTED";

    if (
      identityScore >= 82 &&
      complianceScore >= 75 &&
      flags.has_recruiter_id &&
      flags.has_school
    ) {
      return "VERIFIED";
    }

    if (identityScore >= 65 && complianceScore >= 60) {
      return "PROVISIONAL";
    }

    if (identityScore >= 40) {
      return "PENDING_REVIEW";
    }

    return "UNVERIFIED";
  }

  function determineAccessLevel(status, recruiter = {}) {
    const verificationStatus = upper(status);

    if (verificationStatus === "VERIFIED") {
      return "FULL_GOVERNED_ACCESS";
    }

    if (verificationStatus === "PROVISIONAL") {
      return "COACH_COUNSELOR_ONLY";
    }

    if (verificationStatus === "PENDING_REVIEW") {
      return "REVIEW_REQUIRED";
    }

    return "BLOCKED";
  }

  function generateMissingItems(flags) {
    const missing = [];

    if (!flags.has_recruiter_id) missing.push("Verified Recruiter ID");
    if (!flags.has_name) missing.push("Recruiter name");
    if (!flags.has_school) missing.push("School/program affiliation");
    if (!flags.has_division) missing.push("Division or recruiting level");
    if (!flags.has_email) missing.push("Institutional email");
    if (!flags.has_role) missing.push("Staff role/title");

    return missing;
  }

  function verifyRecruiter(recruiter = {}) {
    const flags = getRecruiterIdentityFlags(recruiter);
    const identityScore = calculateIdentityScore(flags);
    const activityScore = calculateActivityScore(recruiter);
    const complianceScore = calculateComplianceScore(recruiter);

    const trustScore = clamp(
      Math.round(
        identityScore * 0.42 +
        activityScore * 0.24 +
        complianceScore * 0.34
      )
    );

    const statusKey =
      resolveVerificationStatus(identityScore, complianceScore, recruiter);

    const status =
      VERIFICATION_STATUS[statusKey] || VERIFICATION_STATUS.UNVERIFIED;

    const accessKey =
      determineAccessLevel(statusKey, recruiter);

    const access =
      ACCESS_LEVELS[accessKey];

    return {
      ok: true,

      engine_id: ENGINE_ID,
      version: VERSION,

      recruiter_id:
        recruiter.recruiter_id ||
        recruiter.verified_recruiter_id ||
        null,

      verified_recruiter_id:
        recruiter.verified_recruiter_id || null,

      recruiter_name:
        recruiter.recruiter_name ||
        recruiter.name ||
        recruiter.full_name ||
        "Unnamed Recruiter",

      school_program:
        recruiter.school_program ||
        recruiter.school ||
        recruiter.institution ||
        "School Pending",

      division:
        recruiter.division ||
        recruiter.division_level ||
        recruiter.division_focus ||
        "Division Pending",

      role:
        recruiter.role ||
        recruiter.staff_role ||
        recruiter.title ||
        "Role Pending",

      verification_status:
        statusKey,

      verification_label:
        status.label,

      verification_color:
        status.color,

      trust_score:
        Math.max(trustScore, status.trust_floor),

      identity_score:
        identityScore,

      activity_score:
        activityScore,

      compliance_score:
        complianceScore,

      access_level:
        accessKey,

      access_label:
        access.label,

      access_description:
        access.description,

      identity_flags:
        flags,

      missing_items:
        generateMissingItems(flags),

      permitted_routes:
        buildPermittedRoutes(accessKey),

      restricted_routes:
        buildRestrictedRoutes(accessKey),

      explanation: {
        summary:
          `${recruiter.recruiter_name || recruiter.name || "This recruiter"} is classified as ${status.label} with a trust score of ${Math.max(trustScore, status.trust_floor)}.`,
        rule:
          "Recruiter verification is based on identity proof, school/program affiliation, division/role validation, institutional contact, activity history, communication compliance, and system verification.",
        limitation:
          "Recruiter verification does not imply athlete contact permission. Athlete communication remains governed by NCAA rules, guardian controls, and Multi-Box routing."
      },

      created_at:
        new Date().toISOString()
    };
  }

  function buildPermittedRoutes(accessKey) {
    if (accessKey === "FULL_GOVERNED_ACCESS") {
      return [
        "COACH_COMMUNICATION",
        "COUNSELOR_COMMUNICATION",
        "EVALUATOR_COMMUNICATION",
        "APPROVED_ATHLETE_VISIBILITY",
        "PARENT_GUARDED_COMMUNICATION",
        "CAMP_MEETING_CONFIRMATION",
        "WATCHLIST_REVIEW"
      ];
    }

    if (accessKey === "COACH_COUNSELOR_ONLY") {
      return [
        "COACH_COMMUNICATION",
        "COUNSELOR_COMMUNICATION",
        "EVALUATOR_COMMUNICATION",
        "CAMP_MEETING_CONFIRMATION"
      ];
    }

    if (accessKey === "REVIEW_REQUIRED") {
      return [
        "IDENTITY_REVIEW",
        "PROGRAM_AFFILIATION_REVIEW"
      ];
    }

    return [];
  }

  function buildRestrictedRoutes(accessKey) {
    if (accessKey === "FULL_GOVERNED_ACCESS") {
      return [
        "UNAPPROVED_DIRECT_MINOR_CONTACT",
        "OFF_PLATFORM_CONTACT",
        "UNLOGGED_MEETING"
      ];
    }

    if (accessKey === "COACH_COUNSELOR_ONLY") {
      return [
        "ATHLETE_DIRECT_CONTACT",
        "PARENT_DIRECT_CONTACT",
        "PRIVATE_VISIBILITY_REQUEST",
        "OFF_PLATFORM_CONTACT"
      ];
    }

    return [
      "ATHLETE_DIRECT_CONTACT",
      "PARENT_DIRECT_CONTACT",
      "PROFILE_VISIBILITY",
      "CAMP_MEETING_REQUEST",
      "WATCHLIST_ACCESS",
      "OFF_PLATFORM_CONTACT"
    ];
  }

  function evaluateRecruiterAthleteFit(recruiter = {}, athlete = {}, pathway = {}) {
    const verification =
      verifyRecruiter(recruiter);

    if (
      verification.access_level === "BLOCKED" ||
      verification.access_level === "REVIEW_REQUIRED"
    ) {
      return {
        ok: true,
        recruiter_verification: verification,
        fit_score: 0,
        fit_status: "ACCESS_NOT_AUTHORIZED",
        allowed: false,
        reason: "Recruiter must complete verification before athlete fit can be activated."
      };
    }

    const recruiterSports =
      Array.isArray(recruiter.sports)
        ? recruiter.sports.map(upper)
        : [];

    const recruiterPositions =
      Array.isArray(recruiter.positions)
        ? recruiter.positions.map(upper)
        : [];

    const recruiterDivisions =
      Array.isArray(recruiter.division_focus)
        ? recruiter.division_focus.map(upper)
        : [];

    const sport =
      upper(athlete.primary_sport || athlete.sport);

    const position =
      upper(athlete.primary_position || athlete.position);

    const pathwayLevel =
      upper(pathway.primary_pathway || pathway.level || athlete.pathway_level);

    let fit = 40;

    if (recruiterSports.includes(sport)) fit += 18;
    if (recruiterPositions.includes(position)) fit += 18;
    if (recruiterDivisions.includes(pathwayLevel)) fit += 18;

    fit += Math.round(verification.trust_score * 0.16);

    fit = clamp(fit);

    return {
      ok: true,

      recruiter_verification:
        verification,

      athlete_id:
        athlete.athlete_id || null,

      snapshot_id:
        athlete.snapshot_id || null,

      fit_score:
        fit,

      fit_status:
        fit >= 82
          ? "STRONG_RECRUITER_FIT"
          : fit >= 68
            ? "GOOD_RECRUITER_FIT"
            : fit >= 52
              ? "LIMITED_RECRUITER_FIT"
              : "LOW_RECRUITER_FIT",

      allowed:
        fit >= 52,

      recommended_route:
        verification.access_level === "FULL_GOVERNED_ACCESS"
          ? "MULTIBOX_GOVERNED_ROUTE"
          : "COACH_COUNSELOR_ROUTE",

      reason:
        "Recruiter fit is based on verified recruiter trust, sport alignment, position alignment, and pathway/division alignment.",

      created_at:
        new Date().toISOString()
    };
  }

  function createRecruiterReceipt(type, payload = {}) {
    return {
      receipt_id:
        "recruiter_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      engine_id: ENGINE_ID,
      version: VERSION,

      receipt_type:
        type || "RECRUITER_VERIFICATION_EVENT",

      recruiter_id:
        payload.recruiter_id || null,

      verified_recruiter_id:
        payload.verified_recruiter_id || null,

      athlete_id:
        payload.athlete_id || null,

      snapshot_id:
        payload.snapshot_id || null,

      program_id:
        payload.program_id || null,

      event_id:
        payload.event_id || null,

      status:
        payload.status || "RECORDED",

      notes:
        payload.notes || null,

      created_at:
        new Date().toISOString()
    };
  }

  function renderRecruiterVerification(container, verification) {
    if (!container || !verification) return false;

    const color = verification.verification_color || "#9fe7ff";

    container.innerHTML = `
      <div style="
        border:1px solid ${color};
        background:rgba(255,255,255,.035);
        padding:18px;
        color:#f4f2ef;
        box-shadow:0 12px 28px rgba(0,0,0,.38);
      ">

        <div style="
          color:${color};
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          Recruiter Verification
        </div>

        <div style="
          margin-top:10px;
          font-size:30px;
          font-weight:1000;
          color:${color};
        ">
          ${verification.trust_score}
        </div>

        <div style="
          margin-top:6px;
          color:#9fe7ff;
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:900;
        ">
          ${verification.verification_label}
        </div>

        <div style="
          margin-top:14px;
          color:#f4f2ef;
          font-size:18px;
          font-weight:900;
        ">
          ${verification.recruiter_name}
        </div>

        <div style="
          margin-top:5px;
          color:#d6deea;
          font-size:12px;
          line-height:1.45;
        ">
          ${verification.school_program} · ${verification.division} · ${verification.role}
        </div>

        <div style="
          margin-top:16px;
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
          gap:10px;
        ">

          <div style="
            border:1px solid rgba(255,255,255,.1);
            background:rgba(0,0,0,.22);
            padding:10px;
          ">
            <div style="color:#9ea7b5;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">
              Identity
            </div>
            <div style="margin-top:6px;font-weight:1000;">
              ${verification.identity_score}
            </div>
          </div>

          <div style="
            border:1px solid rgba(255,255,255,.1);
            background:rgba(0,0,0,.22);
            padding:10px;
          ">
            <div style="color:#9ea7b5;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">
              Activity
            </div>
            <div style="margin-top:6px;font-weight:1000;">
              ${verification.activity_score}
            </div>
          </div>

          <div style="
            border:1px solid rgba(255,255,255,.1);
            background:rgba(0,0,0,.22);
            padding:10px;
          ">
            <div style="color:#9ea7b5;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">
              Compliance
            </div>
            <div style="margin-top:6px;font-weight:1000;">
              ${verification.compliance_score}
            </div>
          </div>

        </div>

        <div style="
          margin-top:16px;
          color:#b9c4d6;
          font-size:12px;
          line-height:1.5;
        ">
          ${verification.explanation.summary}
        </div>

      </div>
    `;

    return true;
  }

  function runCurrentRecruiterVerification() {
    const recruiter =
      window.STATScoreCurrentRecruiter ||
      null;

    if (!recruiter) {
      warn("No current recruiter found.");
      return null;
    }

    const verification =
      verifyRecruiter(recruiter);

    window.STATScoreCurrentRecruiterVerification =
      verification;

    const panel =
      document.querySelector("#scRecruiterVerificationPanel") ||
      document.querySelector("[data-recruiter-verification]");

    if (panel) {
      renderRecruiterVerification(panel, verification);
    }

    return verification;
  }

  function init() {
    if (window.__STATSCORE_RECRUITER_VERIFICATION_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_RECRUITER_VERIFICATION_ENGINE__ = true;

    window.STATScoreRecruiterVerificationEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      verification_status:
        VERIFICATION_STATUS,

      access_levels:
        ACCESS_LEVELS,

      verifyRecruiter,
      evaluateRecruiterAthleteFit,
      createRecruiterReceipt,
      renderRecruiterVerification,
      runCurrentRecruiterVerification
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.RecruiterVerificationEngine =
      window.STATScoreRecruiterVerificationEngine;

    const result =
      runCurrentRecruiterVerification();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        recruiter_verified: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      recruiter_verified: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
