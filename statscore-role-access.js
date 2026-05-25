/* ============================================================
   STATScore™ Role Access Spine
   File: statscore-role-access.js
   Version: STATSCORE-ROLE-ACCESS-V1
   Purpose:
   Central permission enforcement for all role rooms,
   athlete record access, action authority, visibility lanes,
   and override boundaries.
============================================================ */

window.STATScoreRoleAccess = (() => {

  /* ============================================================
     ROLE DEFINITIONS
  ============================================================ */

  const ROLES = {
    ATHLETE: "athlete",
    PARENT: "parent",
    COACH: "coach",
    COUNSELOR: "counselor",
    RECRUITER: "recruiter",
    EVALUATOR: "evaluator",
    PROGRAM: "program",
    ADMIN: "admin"
  };

  const ROLE_LABELS = {
    athlete: "Athlete",
    parent: "Parent / Guardian",
    coach: "Coach",
    counselor: "Counselor",
    recruiter: "Recruiter",
    evaluator: "Evaluator",
    program: "Program",
    admin: "Admin"
  };

  /* ============================================================
     PERMISSION MAP
  ============================================================ */

  const PERMISSIONS = {

    athlete: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: false,
      view_guardian_controls: false,
      view_recruiting: true,
      view_evaluator_notes: false,
      view_program_fit: true,
      view_media_queue: true,
      view_completion: true,

      edit_profile: true,
      edit_media: true,
      edit_academics: false,
      edit_evaluation: false,
      edit_verification: false,

      approve_media: false,
      approve_recruiter_contact: false,
      approve_guardian_permission: false,

      request_verification: true,
      request_recruiter_access: false,
      request_media_package: true,

      submit_coach_note: false,
      submit_counselor_note: false,
      submit_evaluator_score: false,

      can_override: false
    },

    parent: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: true,
      view_guardian_controls: true,
      view_recruiting: true,
      view_evaluator_notes: false,
      view_program_fit: true,
      view_media_queue: true,
      view_completion: true,

      edit_profile: false,
      edit_media: false,
      edit_academics: false,
      edit_evaluation: false,
      edit_verification: false,

      approve_media: true,
      approve_recruiter_contact: true,
      approve_guardian_permission: true,

      request_verification: true,
      request_recruiter_access: false,
      request_media_package: true,

      submit_coach_note: false,
      submit_counselor_note: false,
      submit_evaluator_score: false,

      can_override: false
    },

    coach: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: false,
      view_guardian_controls: false,
      view_recruiting: true,
      view_evaluator_notes: false,
      view_program_fit: true,
      view_media_queue: true,
      view_completion: true,

      edit_profile: false,
      edit_media: false,
      edit_academics: false,
      edit_evaluation: false,
      edit_verification: false,

      approve_media: false,
      approve_recruiter_contact: false,
      approve_guardian_permission: false,

      request_verification: true,
      request_recruiter_access: false,
      request_media_package: true,

      submit_coach_note: true,
      submit_counselor_note: false,
      submit_evaluator_score: false,

      can_override: false
    },

    counselor: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: true,
      view_guardian_controls: false,
      view_recruiting: false,
      view_evaluator_notes: false,
      view_program_fit: false,
      view_media_queue: false,
      view_completion: true,

      edit_profile: false,
      edit_media: false,
      edit_academics: true,
      edit_evaluation: false,
      edit_verification: false,

      approve_media: false,
      approve_recruiter_contact: false,
      approve_guardian_permission: false,

      request_verification: true,
      request_recruiter_access: false,
      request_media_package: false,

      submit_coach_note: false,
      submit_counselor_note: true,
      submit_evaluator_score: false,

      can_override: false
    },

    recruiter: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: false,
      view_academics: false,
      view_guardian_controls: false,
      view_recruiting: true,
      view_evaluator_notes: false,
      view_program_fit: true,
      view_media_queue: false,
      view_completion: false,

      edit_profile: false,
      edit_media: false,
      edit_academics: false,
      edit_evaluation: false,
      edit_verification: false,

      approve_media: false,
      approve_recruiter_contact: false,
      approve_guardian_permission: false,

      request_verification: false,
      request_recruiter_access: true,
      request_media_package: false,

      submit_coach_note: false,
      submit_counselor_note: false,
      submit_evaluator_score: false,

      can_override: false
    },

    evaluator: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: false,
      view_guardian_controls: false,
      view_recruiting: true,
      view_evaluator_notes: true,
      view_program_fit: true,
      view_media_queue: true,
      view_completion: true,

      edit_profile: false,
      edit_media: false,
      edit_academics: false,
      edit_evaluation: true,
      edit_verification: true,

      approve_media: false,
      approve_recruiter_contact: false,
      approve_guardian_permission: false,

      request_verification: false,
      request_recruiter_access: false,
      request_media_package: false,

      submit_coach_note: false,
      submit_counselor_note: false,
      submit_evaluator_score: true,

      can_override: false
    },

    program: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: false,
      view_guardian_controls: false,
      view_recruiting: true,
      view_evaluator_notes: false,
      view_program_fit: true,
      view_media_queue: true,
      view_completion: true,

      edit_profile: false,
      edit_media: false,
      edit_academics: false,
      edit_evaluation: false,
      edit_verification: false,

      approve_media: false,
      approve_recruiter_contact: false,
      approve_guardian_permission: false,

      request_verification: true,
      request_recruiter_access: false,
      request_media_package: true,

      submit_coach_note: false,
      submit_counselor_note: false,
      submit_evaluator_score: false,

      can_override: false
    },

    admin: {
      view_profile: true,
      view_public_profile: true,
      view_private_identity: true,
      view_academics: true,
      view_guardian_controls: true,
      view_recruiting: true,
      view_evaluator_notes: true,
      view_program_fit: true,
      view_media_queue: true,
      view_completion: true,

      edit_profile: true,
      edit_media: true,
      edit_academics: true,
      edit_evaluation: true,
      edit_verification: true,

      approve_media: true,
      approve_recruiter_contact: true,
      approve_guardian_permission: true,

      request_verification: true,
      request_recruiter_access: true,
      request_media_package: true,

      submit_coach_note: true,
      submit_counselor_note: true,
      submit_evaluator_score: true,

      can_override: true
    }

  };

  /* ============================================================
     ROLE RULES / OVERRIDE DOCTRINE
  ============================================================ */

  const ROLE_LIMITS = {

    athlete: [
      "Athlete may update identity and media but cannot verify themselves.",
      "Athlete cannot override guardian, evaluator, counselor, or recruiter controls."
    ],

    parent: [
      "Parent/Guardian governs permissions, youth protection, media approval, and recruiter contact access.",
      "Parent cannot issue athletic scores or override evaluator validation."
    ],

    coach: [
      "Coach contributes development and performance context.",
      "Coach does not override verification, eligibility, guardian permissions, evaluator validation, or recruiter visibility."
    ],

    counselor: [
      "Counselor contributes academic, eligibility, transcript, and pathway intelligence.",
      "Counselor does not certify NCAA eligibility as final authority."
    ],

    recruiter: [
      "Recruiter may view approved athlete intelligence and request extended access.",
      "Recruiter does not override verification, eligibility, guardian permissions, or evaluator validation."
    ],

    evaluator: [
      "Evaluator verifies metrics, film evidence, position traits, and performance confidence.",
      "Evaluator does not override guardian permission, counselor academic review, or admin governance."
    ],

    program: [
      "Program may manage roster fit, event participation, and organizational context.",
      "Program does not override athlete verification, guardian approval, or scoring governance."
    ],

    admin: [
      "Admin has full system governance access.",
      "Admin actions must remain audit-ready and receipt-bound."
    ]

  };

  /* ============================================================
     UTILITIES
  ============================================================ */

  function core(){
    return window.STATScoreCore || null;
  }

  function routing(){
    return window.STATScoreRouting || null;
  }

  function normalizeRole(role){
    return String(role || "").trim().toLowerCase();
  }

  function getRole(){
    return normalizeRole(
      core()?.getRole?.() ||
      routing()?.getRole?.() ||
      ""
    );
  }

  function getPermissions(role = getRole()){
    const normalized = normalizeRole(role);
    return PERMISSIONS[normalized] || {};
  }

  function hasPermission(permission, role = getRole()){
    const perms = getPermissions(role);
    return !!perms[permission];
  }

  function roleName(role = getRole()){
    return ROLE_LABELS[normalizeRole(role)] || "Guest";
  }

  function roleLimits(role = getRole()){
    return ROLE_LIMITS[normalizeRole(role)] || [
      "No role authority is currently assigned."
    ];
  }

  function isAdmin(role = getRole()){
    return normalizeRole(role) === ROLES.ADMIN;
  }

  /* ============================================================
     ATHLETE RECORD ACCESS
  ============================================================ */

  function canViewAthleteRecord(role = getRole()){
    return hasPermission("view_profile", role);
  }

  function canViewPrivateIdentity(role = getRole()){
    return hasPermission("view_private_identity", role);
  }

  function canViewAcademics(role = getRole()){
    return hasPermission("view_academics", role);
  }

  function canViewRecruiting(role = getRole()){
    return hasPermission("view_recruiting", role);
  }

  function canViewEvaluatorNotes(role = getRole()){
    return hasPermission("view_evaluator_notes", role);
  }

  function canViewMediaQueue(role = getRole()){
    return hasPermission("view_media_queue", role);
  }

  function canViewCompletion(role = getRole()){
    return hasPermission("view_completion", role);
  }

  /* ============================================================
     EDIT / SUBMIT AUTHORITY
  ============================================================ */

  function canEditProfile(role = getRole()){
    return hasPermission("edit_profile", role);
  }

  function canEditAcademics(role = getRole()){
    return hasPermission("edit_academics", role);
  }

  function canEditEvaluation(role = getRole()){
    return hasPermission("edit_evaluation", role);
  }

  function canEditVerification(role = getRole()){
    return hasPermission("edit_verification", role);
  }

  function canSubmitCoachNote(role = getRole()){
    return hasPermission("submit_coach_note", role);
  }

  function canSubmitCounselorNote(role = getRole()){
    return hasPermission("submit_counselor_note", role);
  }

  function canSubmitEvaluatorScore(role = getRole()){
    return hasPermission("submit_evaluator_score", role);
  }

  /* ============================================================
     APPROVAL AUTHORITY
  ============================================================ */

  function canApproveMedia(role = getRole()){
    return hasPermission("approve_media", role);
  }

  function canApproveRecruiterContact(role = getRole()){
    return hasPermission("approve_recruiter_contact", role);
  }

  function canApproveGuardianPermission(role = getRole()){
    return hasPermission("approve_guardian_permission", role);
  }

  function canOverride(role = getRole()){
    return hasPermission("can_override", role);
  }

  /* ============================================================
     REQUEST AUTHORITY
  ============================================================ */

  function canRequestVerification(role = getRole()){
    return hasPermission("request_verification", role);
  }

  function canRequestRecruiterAccess(role = getRole()){
    return hasPermission("request_recruiter_access", role);
  }

  function canRequestMediaPackage(role = getRole()){
    return hasPermission("request_media_package", role);
  }

  /* ============================================================
     VISIBILITY FILTERING
  ============================================================ */

  function filterSnapshotForRole(snapshot, role = getRole()){

    if (!snapshot) return null;

    const r = normalizeRole(role);

    if (isAdmin(r)) return snapshot;

    const filtered = { ...snapshot };

    if (!canViewPrivateIdentity(r)) {
      filtered.guardian_name = "";
      filtered.guardian_email = "";
      filtered.coach_email = "";
    }

    if (!canViewAcademics(r)) {
      filtered.current_gpa = "";
      filtered.ncaa_status = "";
      filtered.transcript_available = "";
    }

    if (!canViewRecruiting(r)) {
      filtered.recruiting_profile_url = "";
      filtered.recruiting_notes = "";
    }

    if (!canViewEvaluatorNotes(r)) {
      filtered.evaluator_notes = "";
      filtered.evaluator_score = "";
      filtered.confidence_score = "";
    }

    if (!canViewMediaQueue(r)) {
      filtered.media_queue_status = "";
      filtered.production_queue_id = "";
    }

    return filtered;

  }

  /* ============================================================
     DOM ENFORCEMENT
  ============================================================ */

  function applyVisibilityControls(role = getRole()){

    const r = normalizeRole(role);

    document.querySelectorAll("[data-permission]").forEach((el) => {

      const required =
        el.getAttribute("data-permission");

      if (!hasPermission(required, r)) {
        el.style.display = "none";
      }

    });

    document.querySelectorAll("[data-role-only]").forEach((el) => {

      const roles =
        String(el.getAttribute("data-role-only") || "")
          .split(",")
          .map(v => v.trim().toLowerCase())
          .filter(Boolean);

      if (!roles.includes(r)) {
        el.style.display = "none";
      }

    });

    document.querySelectorAll("[data-admin-only]").forEach((el) => {

      if (!isAdmin(r)) {
        el.style.display = "none";
      }

    });

  }

  function lockUnauthorizedInputs(role = getRole()){

    const r = normalizeRole(role);

    document.querySelectorAll("[data-edit-permission]").forEach((el) => {

      const required =
        el.getAttribute("data-edit-permission");

      if (!hasPermission(required, r)) {
        el.disabled = true;
        el.setAttribute("aria-disabled", "true");
      }

    });

  }

  function renderRoleAuthority(targetId = "roleAuthorityNotice", role = getRole()){

    const el = document.getElementById(targetId);

    if (!el) return;

    const limits = roleLimits(role);

    el.innerHTML = `
      <strong>${roleName(role)} Authority</strong>
      <ul>
        ${limits.map(item => `<li>${item}</li>`).join("")}
      </ul>
    `;

  }

  /* ============================================================
     ROLE ACCESS REPORT
  ============================================================ */

  function buildAccessReport(role = getRole(), snapshot = null){

    const r = normalizeRole(role);

    return {

      role: r,
      label: roleName(r),

      can_view_athlete_record: canViewAthleteRecord(r),
      can_view_private_identity: canViewPrivateIdentity(r),
      can_view_academics: canViewAcademics(r),
      can_view_recruiting: canViewRecruiting(r),
      can_view_evaluator_notes: canViewEvaluatorNotes(r),
      can_view_media_queue: canViewMediaQueue(r),
      can_view_completion: canViewCompletion(r),

      can_edit_profile: canEditProfile(r),
      can_edit_academics: canEditAcademics(r),
      can_edit_evaluation: canEditEvaluation(r),
      can_edit_verification: canEditVerification(r),

      can_approve_media: canApproveMedia(r),
      can_approve_recruiter_contact: canApproveRecruiterContact(r),
      can_approve_guardian_permission: canApproveGuardianPermission(r),

      can_request_verification: canRequestVerification(r),
      can_request_recruiter_access: canRequestRecruiterAccess(r),
      can_request_media_package: canRequestMediaPackage(r),

      can_override: canOverride(r),

      snapshot_loaded: !!snapshot,
      filtered_snapshot: filterSnapshotForRole(snapshot, r)

    };

  }

  /* ============================================================
     INIT
  ============================================================ */

  function init(options = {}){

    const role = normalizeRole(
      options.role || getRole()
    );

    applyVisibilityControls(role);
    lockUnauthorizedInputs(role);

    if (options.renderAuthority !== false) {
      renderRoleAuthority(
        options.authorityTargetId || "roleAuthorityNotice",
        role
      );
    }

    window.STATScoreAccessReport =
      buildAccessReport(role);

    return window.STATScoreAccessReport;

  }

  /* ============================================================
     PUBLIC EXPORTS
  ============================================================ */

  return {

    ROLES,
    ROLE_LABELS,
    PERMISSIONS,
    ROLE_LIMITS,

    normalizeRole,
    getRole,
    getPermissions,
    hasPermission,
    roleName,
    roleLimits,
    isAdmin,

    canViewAthleteRecord,
    canViewPrivateIdentity,
    canViewAcademics,
    canViewRecruiting,
    canViewEvaluatorNotes,
    canViewMediaQueue,
    canViewCompletion,

    canEditProfile,
    canEditAcademics,
    canEditEvaluation,
    canEditVerification,

    canSubmitCoachNote,
    canSubmitCounselorNote,
    canSubmitEvaluatorScore,

    canApproveMedia,
    canApproveRecruiterContact,
    canApproveGuardianPermission,
    canOverride,

    canRequestVerification,
    canRequestRecruiterAccess,
    canRequestMediaPackage,

    filterSnapshotForRole,

    applyVisibilityControls,
    lockUnauthorizedInputs,
    renderRoleAuthority,

    buildAccessReport,
    init

  };

})(); 
