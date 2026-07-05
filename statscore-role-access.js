/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-role-access.js

Asset Type:
JavaScript Infrastructure / Role Access Authority

Owner Stream:
Master Integration

Primary Operational Authority:
Master Integration

Layer:
Access Governance / Role Permissions

Runtime Owner:
Master Integration Runtime

Primary Consumers:
- login.html
- role-dashboard-intake.html
- role-dashboard.html
- multi-box.html
- protected role-aware pages

Purpose:
Provides governed role normalization, role permission enforcement,
visibility controls, protected input locking, and locked sender
context for governed communication.

Consumes:
- role
- role_id
- user_id
- credential_status
- snapshot_id
- athlete_id
- session storage
- URL route context

Provides:
- normalized role context
- permission checks
- access report
- filtered snapshot view
- Multi-Box sender context
- allowed target roles

Primary IDs:
- role
- role_id
- user_id
- athlete_id
- snapshot_id

Cross-Stream Dependencies:
May support access governance across all Streams.
May not implement another Stream's business logic.

Does NOT:
- Authenticate users
- Calculate intelligence
- Render dashboards
- Create athlete source records
- Modify scores
- Generate Crystal Reports
- Send communications
- Modify Supabase records

Status:
CANON LOCKED

Last Governance Review:
2026-07-05

==========================================================
*/

/*
============================================================
STATScore™ Role Access Spine
File: statscore-role-access.js
Version: STATSCORE-ROLE-ACCESS-V4
Purpose:
Central role permission enforcement + locked Multi-Box sender context.

Canon:
- Role keys must match routing/session canon.
- Parent / Guardian display label uses canonical role key: parent.
- Multi-Box sender channel is locked by authenticated dashboard/session role.
- If no specific role is supplied, runtime remains pending.
- No fallback should silently convert unknown sender to Athlete.
============================================================
*/

window.STATScoreRoleAccess = (() => {
  "use strict";

  const VERSION = "STATSCORE-ROLE-ACCESS-V4";

  const ROLES = {
    ATHLETE: "athlete",
    PARENT: "parent",
    COACH: "coach",
    COUNSELOR: "counselor",
    RECRUITER: "recruiter",
    EVALUATOR: "evaluator",
    PROGRAM: "program",
    ADMIN: "admin",
    PROFESSIONAL: "professional"
  };

  const ROLE_ALIASES = {
    parent: "parent",
    guardian: "parent",
    parent_guardian: "parent",
    "parent/guardian": "parent",
    "parent / guardian": "parent",
    head_coach: "coach",
    position_coach: "coach",
    program_admin: "program",
    professional: "professional"
  };

  const ROLE_LABELS = {
    athlete: "Athlete",
    parent: "Parent / Guardian",
    coach: "Coach",
    counselor: "Counselor",
    recruiter: "Recruiter",
    evaluator: "Evaluator",
    program: "Program",
    admin: "Admin",
    professional: "Professional"
  };

  const ALL_ROLES = [
    "athlete",
    "parent",
    "coach",
    "counselor",
    "recruiter",
    "evaluator",
    "program",
    "admin",
    "professional"
  ];

  const PROFESSIONAL_ROLES = [
    "parent",
    "coach",
    "counselor",
    "recruiter",
    "evaluator",
    "program"
  ];

  const MULTIBOX_TARGET_ROLES = {
    athlete: ["parent", "coach", "counselor", "program"],
    parent: ["coach", "counselor", "program", "recruiter"],
    coach: ["athlete", "parent", "counselor", "evaluator", "recruiter", "program"],
    counselor: ["athlete", "parent", "coach", "program"],
    recruiter: ["coach", "program", "parent", "athlete"],
    evaluator: ["athlete", "coach", "program"],
    program: ["coach", "recruiter", "evaluator", "parent", "athlete"],
    admin: ["athlete", "parent", "coach", "counselor", "recruiter", "evaluator", "program"],
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

    parent: {
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

  function isKnownRole(role) {
    return ALL_ROLES.includes(normalizeRole(role));
  }

  function isProfessionalRole(role) {
    return PROFESSIONAL_ROLES.includes(normalizeRole(role));
  }

  function getAuthenticatedRole() {
    const role = normalizeRole(
      core()?.getRole?.() ||
      routing()?.getRole?.() ||
      sessionStorage.getItem("statscore_role") ||
      sessionStorage.getItem("statscore_active_role_v1") ||
      sessionStorage.getItem("role") ||
      getParam("role") ||
      ""
    );

    if (!role || !isKnownRole(role)) return "professional";

    return role;
  }

  function setAuthenticatedRole(role) {
    const normalized = normalizeRole(role);

    if (!normalized || !isKnownRole(normalized)) {
      sessionStorage.setItem("statscore_role", "professional");
      return "professional";
    }

    sessionStorage.setItem("statscore_role", normalized);
    sessionStorage.setItem("statscore_active_role_v1", normalized);
    localStorage.setItem("statscore_active_role_v1", normalized);

    core()?.setRole?.(normalized);

    return normalized;
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
    const normalized = normalizeRole(role);
    return normalized === "professional" || !normalized || !isKnownRole(normalized);
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
      is_known_role: isKnownRole(r),
      is_professional_role: isProfessionalRole(r),
      allowed_target_roles: getAllowedTargetRoles(r),
      permissions: getPermissions(r),
      can_override: hasPermission("can_override", r),
      runtime_pending: isRuntimePending(r) || !getAuthenticatedRoleId(),
      snapshot_loaded: !!snapshot,
      filtered_snapshot: filterSnapshotForRole(snapshot, r)
    };
  }

  function init(options = {}) {
    const role = setAuthenticatedRole(options.role || getAuthenticatedRole());

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
    ROLE_ALIASES,
    ROLE_LABELS,
    ALL_ROLES,
    PROFESSIONAL_ROLES,
    PERMISSIONS,
    MULTIBOX_TARGET_ROLES,

    normalizeRole,
    isKnownRole,
    isProfessionalRole,

    getRole: getAuthenticatedRole,
    getAuthenticatedRole,
    setAuthenticatedRole,
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
