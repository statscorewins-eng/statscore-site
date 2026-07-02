/* ============================================================
   STATScore™ Role Access Spine
   File: statscore-role-access.js
   Version: STATSCORE-ROLE-ACCESS-V3
   Purpose:
   Central role permission enforcement + locked Multi-Box sender context.

   Canon:
   - Multi-Box sender channel is locked by authenticated dashboard/session role.
   - If no role is supplied, runtime remains pending.
   - No fallback should silently convert unknown sender to Athlete.
============================================================ */

window.STATScoreRoleAccess = (() => {
  "use strict";

  const VERSION = "STATSCORE-ROLE-ACCESS-V3";

  const ROLES = {
    ATHLETE: "athlete",
    PARENT: "parent_guardian",
    COACH: "coach",
    COUNSELOR: "counselor",
    RECRUITER: "recruiter",
    EVALUATOR: "evaluator",
    PROGRAM: "program",
    ADMIN: "admin",
    PROFESSIONAL: "professional"
  };

  const ROLE_ALIASES = {
    parent: "parent_guardian",
    guardian: "parent_guardian",
    parent_guardian: "parent_guardian",
    head_coach: "coach",
    position_coach: "coach",
    program_admin: "program",
    professional: "professional"
  };

  const ROLE_LABELS = {
    athlete: "Athlete",
    parent_guardian: "Parent / Guardian",
    coach: "Coach",
    counselor: "Counselor",
    recruiter: "Recruiter",
    evaluator: "Evaluator",
    program: "Program",
    admin: "Admin",
    professional: "Professional"
  };

  const MULTIBOX_TARGET_ROLES = {
    athlete: ["parent_guardian", "coach", "counselor", "program"],
    parent_guardian: ["coach", "counselor", "program", "recruiter"],
    coach: ["athlete", "parent_guardian", "counselor", "evaluator", "recruiter", "program"],
    counselor: ["athlete", "parent_guardian", "coach", "program"],
    recruiter: ["coach", "program", "parent_guardian", "athlete"],
    evaluator: ["athlete", "coach", "program"],
    program: ["coach", "recruiter", "evaluator", "parent_guardian", "athlete"],
    admin: ["athlete", "parent_guardian", "coach", "counselor", "recruiter", "evaluator", "program"],
    professional: []
  };

  const PERMISSIONS = {
    athlete: {
      view_profile: true,
      view_private_identity: true,
      view_academics: false,
      view_recruiting: true,
      view_media_queue: true,
      edit_profile: true,
      edit_media: true,
      request_verification: true,
      request_media_package: true,
      can_override: false
    },

    parent_guardian: {
      view_profile: true,
      view_private_identity: true,
      view_academics: true,
      view_guardian_controls: true,
      view_recruiting: true,
      view_media_queue: true,
      approve_media: true,
      approve_recruiter_contact: true,
      approve_guardian_permission: true,
      request_verification: true,
      request_media_package: true,
      can_override: false
    },

    coach: {
      view_profile: true,
      view_private_identity: true,
      view_academics: false,
      view_recruiting: true,
      view_media_queue: true,
      request_verification: true,
      request_media_package: true,
      submit_coach_note: true,
      can_override: false
    },

    counselor: {
      view_profile: true,
      view_private_identity: true,
      view_academics: true,
      view_recruiting: false,
      edit_academics: true,
      submit_counselor_note: true,
      request_verification: true,
      can_override: false
    },

    recruiter: {
      view_profile: true,
      view_private_identity: false,
      view_academics: false,
      view_recruiting: true,
      view_program_fit: true,
      request_recruiter_access: true,
      can_override: false
    },

    evaluator: {
      view_profile: true,
      view_private_identity: true,
      view_recruiting: true,
      view_evaluator_notes: true,
      edit_evaluation: true,
      edit_verification: true,
      submit_evaluator_score: true,
      can_override: false
    },

    program: {
      view_profile: true,
      view_private_identity: true,
      view_recruiting: true,
      view_program_fit: true,
      view_media_queue: true,
      request_verification: true,
      request_media_package: true,
      can_override: false
    },

    admin: {
      view_profile: true,
      view_private_identity: true,
      view_academics: true,
      view_guardian_controls: true,
      view_recruiting: true,
      view_evaluator_notes: true,
      view_program_fit: true,
      view_media_queue: true,
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
    },

    professional: {
      view_profile: false,
      view_private_identity: false,
      view_academics: false,
      view_recruiting: false,
      can_override: false,
      runtime_pending: true
    }
  };

  function core() {
    return window.STATScoreCore || null;
  }

  function routing() {
    return window.STATScoreRouting || null;
  }

  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function normalizeRole(role) {
    const raw = String(role || "").trim().toLowerCase();
    return ROLE_ALIASES[raw] || raw;
  }

  function getAuthenticatedRole() {
    return normalizeRole(
      core()?.getRole?.() ||
      routing()?.getRole?.() ||
      sessionStorage.getItem("statscore_role") ||
      sessionStorage.getItem("role") ||
      getParam("role") ||
      "professional"
    );
  }

  function getAuthenticatedRoleId() {
    return (
      sessionStorage.getItem("statscore_role_id") ||
      sessionStorage.getItem("role_id") ||
      getParam("role_id") ||
      null
    );
  }

  function getAuthenticatedUserId() {
    return (
      sessionStorage.getItem("statscore_user_id") ||
      sessionStorage.getItem("user_id") ||
      getParam("user_id") ||
      null
    );
  }

  function getCredentialStatus() {
    return String(
      sessionStorage.getItem("statscore_credential_status") ||
      sessionStorage.getItem("credential_status") ||
      getParam("credential_status") ||
      "pending"
    ).trim().toLowerCase();
  }

  function getSenderLabel(role = getAuthenticatedRole()) {
    return (
      sessionStorage.getItem("statscore_sender_label") ||
      sessionStorage.getItem("sender_label") ||
      ROLE_LABELS[normalizeRole(role)] ||
      "Pending Runtime"
    );
  }

  function getPermissions(role = getAuthenticatedRole()) {
    return PERMISSIONS[normalizeRole(role)] || {};
  }

  function hasPermission(permission, role = getAuthenticatedRole()) {
    return !!getPermissions(role)[permission];
  }

  function roleName(role = getAuthenticatedRole()) {
    return ROLE_LABELS[normalizeRole(role)] || "Pending Runtime";
  }

  function isAdmin(role = getAuthenticatedRole()) {
    return normalizeRole(role) === "admin";
  }

  function isRuntimePending(role = getAuthenticatedRole()) {
    return normalizeRole(role) === "professional" || !normalizeRole(role);
  }

  function getAllowedTargetRoles(role = getAuthenticatedRole()) {
    return MULTIBOX_TARGET_ROLES[normalizeRole(role)] || [];
  }

  function canTargetRole(targetRole, senderRole = getAuthenticatedRole()) {
    return getAllowedTargetRoles(senderRole).includes(normalizeRole(targetRole));
  }

  function getMultiBoxSenderContext(context = {}) {
    const senderRole = normalizeRole(context.sender_role || context.role || getAuthenticatedRole());
    const roleId = context.sender_role_id || context.role_id || getAuthenticatedRoleId();

    return {
      sender_user_id: context.sender_user_id || context.user_id || getAuthenticatedUserId(),
      sender_role: senderRole,
      sender_role_id: roleId,
      sender_label: context.sender_label || getSenderLabel(senderRole),
      sender_channel_locked: true,
      runtime_pending: isRuntimePending(senderRole) || !roleId,

      credential_status:
        context.credential_status ||
        context.professional_credential_status ||
        getCredentialStatus(),

      allowed_target_roles: getAllowedTargetRoles(senderRole),

      athlete_id:
        context.athlete_id ||
        sessionStorage.getItem("statscore_athlete_id") ||
        getParam("athlete_id") ||
        null,

      snapshot_id:
        context.snapshot_id ||
        sessionStorage.getItem("statscore_snapshot_id") ||
        getParam("snapshot_id") ||
        null
    };
  }

  function assertLockedSender(payload = {}, context = {}) {
    const runtime = getMultiBoxSenderContext(context);
    const incoming = normalizeRole(payload.sender_role || payload.from_role || runtime.sender_role);

    if (!runtime.sender_role || runtime.sender_role === "professional") {
      return {
        ok: false,
        reason: "Authenticated sender role is pending. Multi-Box requires a specific locked role channel.",
        runtime
      };
    }

    if (incoming !== runtime.sender_role) {
      return {
        ok: false,
        reason: "Sender role mismatch. Multi-Box sender channel is locked.",
        runtime
      };
    }

    return {
      ok: true,
      reason: "Sender channel locked.",
      runtime
    };
  }

  function filterSnapshotForRole(snapshot, role = getAuthenticatedRole()) {
    if (!snapshot) return null;

    const r = normalizeRole(role);
    if (isAdmin(r)) return snapshot;

    const filtered = { ...snapshot };

    if (!hasPermission("view_private_identity", r)) {
      filtered.guardian_name = "";
      filtered.guardian_email = "";
      filtered.coach_email = "";
    }

    if (!hasPermission("view_academics", r)) {
      filtered.current_gpa = "";
      filtered.ncaa_status = "";
      filtered.transcript_available = "";
    }

    if (!hasPermission("view_recruiting", r)) {
      filtered.recruiting_profile_url = "";
      filtered.recruiting_notes = "";
    }

    if (!hasPermission("view_evaluator_notes", r)) {
      filtered.evaluator_notes = "";
      filtered.evaluator_score = "";
      filtered.confidence_score = "";
    }

    return filtered;
  }

  function applyVisibilityControls(role = getAuthenticatedRole()) {
    const r = normalizeRole(role);

    document.querySelectorAll("[data-permission]").forEach((el) => {
      if (!hasPermission(el.getAttribute("data-permission"), r)) {
        el.style.display = "none";
      }
    });

    document.querySelectorAll("[data-role-only]").forEach((el) => {
      const roles = String(el.getAttribute("data-role-only") || "")
        .split(",")
        .map(v => normalizeRole(v))
        .filter(Boolean);

      if (!roles.includes(r)) el.style.display = "none";
    });

    document.querySelectorAll("[data-admin-only]").forEach((el) => {
      if (!isAdmin(r)) el.style.display = "none";
    });
  }

  function lockUnauthorizedInputs(role = getAuthenticatedRole()) {
    const r = normalizeRole(role);

    document.querySelectorAll("[data-edit-permission]").forEach((el) => {
      if (!hasPermission(el.getAttribute("data-edit-permission"), r)) {
        el.disabled = true;
        el.setAttribute("aria-disabled", "true");
      }
    });
  }

  function buildAccessReport(role = getAuthenticatedRole(), snapshot = null) {
    const r = normalizeRole(role);

    return {
      engine_version: VERSION,
      role: r,
      label: roleName(r),
      role_id: getAuthenticatedRoleId(),
      user_id: getAuthenticatedUserId(),
      credential_status: getCredentialStatus(),
      allowed_target_roles: getAllowedTargetRoles(r),
      permissions: getPermissions(r),
      can_override: hasPermission("can_override", r),
      runtime_pending: isRuntimePending(r) || !getAuthenticatedRoleId(),
      snapshot_loaded: !!snapshot,
      filtered_snapshot: filterSnapshotForRole(snapshot, r)
    };
  }

  function init(options = {}) {
    const role = normalizeRole(options.role || getAuthenticatedRole());

    applyVisibilityControls(role);
    lockUnauthorizedInputs(role);

    window.STATScoreAccessReport = buildAccessReport(role);
    window.STATScoreMultiBoxSenderContext = getMultiBoxSenderContext({ role });

    console.info("[STATScore Role Access] Engine Loaded:", VERSION, window.STATScoreMultiBoxSenderContext);

    return window.STATScoreAccessReport;
  }

  return {
    VERSION,
    ROLES,
    ROLE_LABELS,
    PERMISSIONS,
    MULTIBOX_TARGET_ROLES,

    normalizeRole,

    getRole: getAuthenticatedRole,
    getAuthenticatedRole,
    getAuthenticatedRoleId,
    getAuthenticatedUserId,
    getCredentialStatus,
    getSenderLabel,

    getPermissions,
    hasPermission,
    roleName,
    isAdmin,
    isRuntimePending,

    getAllowedTargetRoles,
    canTargetRole,
    getMultiBoxSenderContext,
    assertLockedSender,

    filterSnapshotForRole,
    applyVisibilityControls,
    lockUnauthorizedInputs,
    buildAccessReport,
    init
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  window.STATScoreRoleAccess?.init?.();
}); 
