/* ============================================================
   PHNX OS™ Credential Authority Engine
   File: phnx-credential-authority-engine.js
   Version: PHNX-CREDENTIAL-AUTHORITY-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish credential, authority, permission, and workspace
   activation governance for PHNX Professional Identity,
   Professional Workspaces, STATS-CORE™, Multi-Box™, dashboards,
   organizations, and future PHNX applications.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Professional Identity is permanent.
   Professional Workspaces are operational.
   Credentials authorize workspace authority.
   Dashboard access follows active workspace authority.
   Multi-Box communication follows active workspace authority.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-credential-authority-engine";
  const VERSION = "PHNX-CREDENTIAL-AUTHORITY-ENGINE-V1";

  const STORAGE_KEYS = {
    credentials: "phnx_credentials",
    credentialRuntime: "phnx_credential_runtime",
    authorityProfile: "phnx_authority_profile",
    permissionMap: "phnx_permission_map",
    professionalId: "phnx_professional_id"
  };

  const CredentialState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,

    professional_id: null,
    credentials: [],
    authority_profile: null,
    permission_map: {},

    runtime: {
      professional_id: null,
      workspace_id: null,
      credential_status: "pending_runtime",
      authority_status: "pending_runtime",
      verified: false,
      permissions: [],
      application: "STATS-CORE",
      status: "UNINITIALIZED"
    }
  };

  const DEFAULT_PERMISSION_SETS = {
    athlete: [
      "view_own_profile",
      "edit_own_profile",
      "view_own_messages",
      "send_governed_messages",
      "view_readiness",
      "view_eligibility"
    ],

    parent_guardian: [
      "view_child_profile",
      "view_child_academics",
      "approve_media",
      "approve_recruiter_contact",
      "view_child_messages",
      "send_governed_messages",
      "view_guardian_controls"
    ],

    coach: [
      "view_assigned_athletes",
      "view_roster",
      "view_profile",
      "send_governed_messages",
      "submit_coach_notes",
      "request_verification",
      "view_recruiting_activity"
    ],

    counselor: [
      "view_assigned_athletes",
      "view_academics",
      "edit_academic_records",
      "submit_counselor_notes",
      "send_governed_messages",
      "view_eligibility"
    ],

    recruiter: [
      "view_approved_profiles",
      "view_recruiting_fit",
      "request_contact",
      "send_governed_messages",
      "view_public_athlete_data"
    ],

    evaluator: [
      "view_assigned_athletes",
      "submit_evaluation",
      "submit_verification",
      "view_evaluator_notes",
      "send_governed_messages"
    ],

    program: [
      "view_program_roster",
      "view_program_fit",
      "manage_program_requests",
      "send_governed_messages",
      "broadcast_governed_messages"
    ],

    admin: [
      "platform_admin",
      "view_all",
      "edit_all",
      "override_governance",
      "manage_credentials",
      "manage_workspaces",
      "manage_organizations",
      "broadcast_governed_messages"
    ],

    professional: [
      "view_professional_workspace",
      "send_governed_messages"
    ]
  };

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    return String(value || "").trim();
  }

  function lower(value) {
    return clean(value).toLowerCase();
  }

  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function getStorage(key) {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
  }

  function setSession(key, value) {
    if (value === undefined || value === null) return;
    sessionStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  }

  function safeJSONParse(value, fallback = null) {
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function db() {
    return (
      window.STATScoreCore?.getClient?.() ||
      window.STATScoreData?.getClient?.() ||
      window.STATScoreSupabase ||
      window.STATScoreSupabaseClient ||
      window.supabaseClient ||
      null
    );
  }

  function identityEngine() {
    return window.PHNXProfessionalIdentityEngine || window.PHNX?.ProfessionalIdentityEngine || null;
  }

  function workspaceRuntime() {
    return window.PHNXWorkspaceRuntime || window.PHNX?.WorkspaceRuntime || null;
  }

  function workspaceRegistry() {
    return window.PHNXWorkspaceRegistryEngine || window.PHNX?.WorkspaceRegistryEngine || null;
  }

  function organizationEngine() {
    return window.PHNXOrganizationEngine || window.PHNX?.OrganizationEngine || null;
  }

  function sessionEngine() {
    return window.PHNXSessionEngine || window.PHNX?.SessionEngine || null;
  }

  function normalizeRole(role) {
    const raw = lower(role);
    const aliases = {
      parent: "parent_guardian",
      guardian: "parent_guardian",
      parent_guardian: "parent_guardian",
      head_coach: "coach",
      position_coach: "coach",
      athletic_director: "admin",
      program_admin: "program"
    };

    return aliases[raw] || raw || "professional";
  }

  function resolveProfessionalId(context = {}) {
    return (
      context.professional_id ||
      context.phnx_professional_id ||
      identityEngine()?.getProfessionalId?.() ||
      window.PHNXProfessionalIdentity?.professional_id ||
      getParam("professional_id") ||
      getParam("phnx_professional_id") ||
      getStorage(STORAGE_KEYS.professionalId) ||
      getStorage("statscore_professional_id") ||
      getStorage("statscore_user_id") ||
      null
    );
  }

  function resolveWorkspace(context = {}) {
    return (
      context.workspace ||
      workspaceRuntime()?.getActiveWorkspace?.() ||
      workspaceRegistry()?.getActiveWorkspace?.() ||
      safeJSONParse(getStorage("phnx_active_workspace"), null) ||
      {}
    );
  }

  function resolveWorkspaceRuntime(context = {}) {
    return (
      context.runtime ||
      workspaceRuntime()?.getRuntime?.() ||
      window.STATScoreWorkspaceRuntime ||
      safeJSONParse(getStorage("phnx_workspace_runtime"), null) ||
      {}
    );
  }

  function resolveOrganization(context = {}) {
    return (
      context.organization ||
      organizationEngine()?.getActiveOrganization?.() ||
      window.PHNXActiveOrganization ||
      safeJSONParse(getStorage("phnx_active_organization"), null) ||
      {}
    );
  }

  function makeCredentialId(seed = "credential") {
    const base = lower(seed).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return "PHNX-CRED-" + (base || "CREDENTIAL").toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
  }

  function normalizeCredential(credential = {}, context = {}) {
    const professionalId = resolveProfessionalId(context) || credential.professional_id;

    const role = normalizeRole(
      credential.role ||
      credential.credential_role ||
      credential.workspace_type ||
      credential.authority_scope
    );

    return {
      credential_id:
        credential.credential_id ||
        credential.id ||
        makeCredentialId(role),

      professional_id: professionalId,
      phnx_professional_id: credential.phnx_professional_id || professionalId,

      credential_type:
        credential.credential_type ||
        credential.type ||
        "professional_authority",

      credential_name:
        credential.credential_name ||
        credential.name ||
        credential.title ||
        `${role} Credential`,

      role,
      authority_scope:
        credential.authority_scope ||
        credential.authority ||
        role,

      organization_id:
        credential.organization_id ||
        context.organization_id ||
        null,

      workspace_id:
        credential.workspace_id ||
        context.workspace_id ||
        null,

      sport:
        credential.sport ||
        context.sport ||
        null,

      credential_status:
        credential.credential_status ||
        credential.status ||
        "pending_runtime",

      verification_status:
        credential.verification_status ||
        credential.identity_verification_status ||
        "pending_runtime",

      issued_by:
        credential.issued_by ||
        credential.issuer ||
        null,

      issued_at:
        credential.issued_at ||
        credential.issue_date ||
        null,

      expires_at:
        credential.expires_at ||
        credential.expiration_date ||
        null,

      permissions:
        Array.isArray(credential.permissions)
          ? credential.permissions
          : credential.permissions
            ? [credential.permissions]
            : DEFAULT_PERMISSION_SETS[role] || DEFAULT_PERMISSION_SETS.professional,

      is_active:
        credential.is_active !== false,

      metadata: {
        ...(credential.metadata || {}),
        normalized_at: nowISO()
      },

      source_record:
        credential.source_record || credential
    };
  }

  function credentialIsExpired(credential = {}) {
    if (!credential.expires_at) return false;
    const expires = new Date(credential.expires_at).getTime();
    return Number.isFinite(expires) && expires < Date.now();
  }

  function credentialIsVerified(credential = {}) {
    const status = lower(credential.credential_status);
    const verify = lower(credential.verification_status);

    if (credentialIsExpired(credential)) return false;

    return (
      credential.is_active !== false &&
      ["active", "verified", "certified", "approved"].includes(status) &&
      ["active", "verified", "certified", "approved", "pending_runtime"].includes(verify)
    );
  }

  function buildFallbackCredential(context = {}) {
    const runtime = resolveWorkspaceRuntime(context);
    const workspace = resolveWorkspace(context);
    const organization = resolveOrganization(context);

    const role = normalizeRole(
      context.role ||
      workspace.role ||
      runtime.role ||
      getStorage("statscore_role") ||
      "professional"
    );

    return normalizeCredential({
      professional_id: resolveProfessionalId(context),
      credential_type: "runtime_authority",
      credential_name: `${role} Runtime Authority`,
      role,
      authority_scope:
        context.authority_scope ||
        workspace.authority_scope ||
        runtime.authority_scope ||
        role,
      organization_id:
        context.organization_id ||
        workspace.organization_id ||
        runtime.organization_id ||
        organization.organization_id ||
        null,
      workspace_id:
        context.workspace_id ||
        workspace.workspace_id ||
        runtime.workspace_id ||
        null,
      sport:
        context.sport ||
        workspace.sport ||
        runtime.sport ||
        null,
      credential_status:
        context.credential_status ||
        getStorage("statscore_credential_status") ||
        "pending_runtime",
      verification_status: "pending_runtime",
      permissions: DEFAULT_PERMISSION_SETS[role] || DEFAULT_PERMISSION_SETS.professional,
      metadata: {
        source: "fallback_runtime_authority"
      }
    }, context);
  }

  function buildAuthorityProfile(context = {}) {
    const runtime = resolveWorkspaceRuntime(context);
    const workspace = resolveWorkspace(context);
    const organization = resolveOrganization(context);

    const role = normalizeRole(
      context.role ||
      workspace.role ||
      runtime.role ||
      getStorage("statscore_role") ||
      "professional"
    );

    const relevantCredentials = CredentialState.credentials.filter(credential => {
      if (!credential.is_active) return false;
      if (credential.professional_id && credential.professional_id !== resolveProfessionalId(context)) return false;

      const roleMatches =
        credential.role === role ||
        credential.authority_scope === role ||
        credential.role === "admin";

      const workspaceMatches =
        !credential.workspace_id ||
        !runtime.workspace_id ||
        credential.workspace_id === runtime.workspace_id;

      const orgMatches =
        !credential.organization_id ||
        !runtime.organization_id ||
        credential.organization_id === runtime.organization_id ||
        credential.organization_id === organization.organization_id;

      const sportMatches =
        !credential.sport ||
        !runtime.sport ||
        lower(credential.sport) === lower(runtime.sport);

      return roleMatches && workspaceMatches && orgMatches && sportMatches;
    });

    const verifiedCredentials = relevantCredentials.filter(credentialIsVerified);
    const permissions = [
      ...new Set(
        relevantCredentials.flatMap(credential => credential.permissions || [])
      )
    ];

    const fallbackPermissions = DEFAULT_PERMISSION_SETS[role] || DEFAULT_PERMISSION_SETS.professional;

    const authorityStatus = verifiedCredentials.length
      ? "authorized"
      : relevantCredentials.length
        ? "pending_verification"
        : "runtime_fallback";

    return {
      professional_id: resolveProfessionalId(context),
      workspace_id: runtime.workspace_id || workspace.workspace_id || null,
      organization_id: runtime.organization_id || organization.organization_id || null,
      sport: runtime.sport || workspace.sport || null,
      role,
      authority_scope: runtime.authority_scope || workspace.authority_scope || role,

      credential_count: relevantCredentials.length,
      verified_credential_count: verifiedCredentials.length,

      credential_status: verifiedCredentials.length
        ? "verified"
        : relevantCredentials.length
          ? "pending_runtime"
          : "runtime_fallback",

      authority_status: authorityStatus,
      verified: verifiedCredentials.length > 0,

      permissions: permissions.length ? permissions : fallbackPermissions,
      credentials: relevantCredentials,
      generated_at: nowISO()
    };
  }

  function buildRuntime(profile = CredentialState.authority_profile) {
    return {
      engine_id: ENGINE_ID,
      version: VERSION,

      professional_id: profile?.professional_id || null,
      workspace_id: profile?.workspace_id || null,
      organization_id: profile?.organization_id || null,
      sport: profile?.sport || null,

      role: profile?.role || "professional",
      authority_scope: profile?.authority_scope || "professional",

      credential_status: profile?.credential_status || "pending_runtime",
      authority_status: profile?.authority_status || "pending_runtime",
      verified: !!profile?.verified,

      permissions: profile?.permissions || [],

      application: "STATS-CORE",
      status: profile ? "ACTIVE_AUTHORITY_PROFILE" : "NO_AUTHORITY_PROFILE",
      loaded_at: nowISO()
    };
  }

  function persistState() {
    CredentialState.updated_at = nowISO();

    setSession(STORAGE_KEYS.credentials, CredentialState.credentials);
    setSession(STORAGE_KEYS.authorityProfile, CredentialState.authority_profile || {});
    setSession(STORAGE_KEYS.permissionMap, CredentialState.permission_map || {});
    setSession(STORAGE_KEYS.credentialRuntime, CredentialState.runtime || {});

    if (CredentialState.runtime?.credential_status) {
      setSession("phnx_credential_status", CredentialState.runtime.credential_status);
      setSession("statscore_credential_status", CredentialState.runtime.credential_status);
    }

    window.PHXNCredentialAuthorityState = CredentialState;
    window.PHXNAuthorityProfile = CredentialState.authority_profile;
    window.STATScoreCredentialRuntime = CredentialState.runtime;

    return CredentialState;
  }

  async function loadCredentials(context = {}) {
    const professionalId = resolveProfessionalId(context);
    CredentialState.professional_id = professionalId;

    const cached = safeJSONParse(getStorage(STORAGE_KEYS.credentials), null);

    if (Array.isArray(cached) && cached.length && !context.force_reload) {
      CredentialState.credentials = cached.map(c => normalizeCredential(c, context));
      CredentialState.authority_profile = buildAuthorityProfile(context);
      CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
      persistState();
      return CredentialState.credentials;
    }

    const client = db();

    /*
      Platform table:
      phnx_professional_credentials

      Expected columns:
      credential_id, professional_id, phnx_professional_id,
      credential_type, credential_name, role, authority_scope,
      organization_id, workspace_id, sport, credential_status,
      verification_status, issued_by, issued_at, expires_at,
      permissions, is_active, metadata, created_at, updated_at
    */
    if (client && professionalId) {
      try {
        const { data, error } = await client
          .from("phnx_professional_credentials")
          .select("*")
          .eq("professional_id", professionalId)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data) && data.length) {
          CredentialState.credentials = data.map(c => normalizeCredential(c, context));
          CredentialState.authority_profile = buildAuthorityProfile(context);
          CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
          persistState();
          return CredentialState.credentials;
        }

        if (error) {
          console.warn("[PHNX Credential Authority] DB load fallback active:", error);
        }
      } catch (error) {
        console.warn("[PHNX Credential Authority] DB exception fallback active:", error);
      }
    }

    CredentialState.credentials = [buildFallbackCredential(context)];
    CredentialState.authority_profile = buildAuthorityProfile(context);
    CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
    persistState();

    return CredentialState.credentials;
  }

  async function createCredential(credential = {}, options = {}) {
    const normalized = normalizeCredential(credential, options);

    const existingIndex = CredentialState.credentials.findIndex(
      item => item.credential_id === normalized.credential_id
    );

    if (existingIndex >= 0) {
      CredentialState.credentials[existingIndex] = {
        ...CredentialState.credentials[existingIndex],
        ...normalized,
        updated_at: nowISO()
      };
    } else {
      CredentialState.credentials.push({
        ...normalized,
        created_at: nowISO(),
        updated_at: nowISO()
      });
    }

    CredentialState.authority_profile = buildAuthorityProfile(options);
    CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { data, error } = await client
          .from("phnx_professional_credentials")
          .upsert({
            credential_id: normalized.credential_id,
            professional_id: normalized.professional_id,
            phnx_professional_id: normalized.phnx_professional_id,
            credential_type: normalized.credential_type,
            credential_name: normalized.credential_name,
            role: normalized.role,
            authority_scope: normalized.authority_scope,
            organization_id: normalized.organization_id,
            workspace_id: normalized.workspace_id,
            sport: normalized.sport,
            credential_status: normalized.credential_status,
            verification_status: normalized.verification_status,
            issued_by: normalized.issued_by,
            issued_at: normalized.issued_at,
            expires_at: normalized.expires_at,
            permissions: normalized.permissions,
            is_active: normalized.is_active,
            metadata: normalized.metadata || {},
            updated_at: nowISO()
          }, {
            onConflict: "credential_id"
          })
          .select("*")
          .single();

        if (error) {
          return {
            ok: false,
            status: "CREDENTIAL_STORED_LOCALLY_DB_FAILED",
            error,
            credential: normalized
          };
        }

        const saved = normalizeCredential(data, options);
        const index = CredentialState.credentials.findIndex(
          item => item.credential_id === saved.credential_id
        );

        if (index >= 0) CredentialState.credentials[index] = saved;

        CredentialState.authority_profile = buildAuthorityProfile(options);
        CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
        persistState();

        return {
          ok: true,
          status: "CREDENTIAL_CREATED",
          credential: saved
        };
      } catch (error) {
        return {
          ok: false,
          status: "CREDENTIAL_STORED_LOCALLY_DB_EXCEPTION",
          error,
          credential: normalized
        };
      }
    }

    return {
      ok: true,
      status: "CREDENTIAL_CREATED_LOCAL",
      credential: normalized
    };
  }

  async function updateCredential(credentialId, updates = {}, options = {}) {
    const index = CredentialState.credentials.findIndex(
      item => item.credential_id === credentialId
    );

    if (index < 0) {
      return {
        ok: false,
        status: "CREDENTIAL_NOT_FOUND"
      };
    }

    const updated = normalizeCredential({
      ...CredentialState.credentials[index],
      ...updates,
      credential_id: credentialId,
      updated_at: nowISO()
    }, options);

    CredentialState.credentials[index] = updated;
    CredentialState.authority_profile = buildAuthorityProfile(options);
    CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { error } = await client
          .from("phnx_professional_credentials")
          .update({
            credential_type: updated.credential_type,
            credential_name: updated.credential_name,
            role: updated.role,
            authority_scope: updated.authority_scope,
            organization_id: updated.organization_id,
            workspace_id: updated.workspace_id,
            sport: updated.sport,
            credential_status: updated.credential_status,
            verification_status: updated.verification_status,
            issued_by: updated.issued_by,
            issued_at: updated.issued_at,
            expires_at: updated.expires_at,
            permissions: updated.permissions,
            is_active: updated.is_active,
            metadata: updated.metadata || {},
            updated_at: nowISO()
          })
          .eq("credential_id", credentialId);

        if (error) {
          return {
            ok: false,
            status: "CREDENTIAL_UPDATED_LOCAL_DB_FAILED",
            error,
            credential: updated
          };
        }
      } catch (error) {
        return {
          ok: false,
          status: "CREDENTIAL_UPDATED_LOCAL_DB_EXCEPTION",
          error,
          credential: updated
        };
      }
    }

    return {
      ok: true,
      status: "CREDENTIAL_UPDATED",
      credential: updated
    };
  }

  async function revokeCredential(credentialId, options = {}) {
    return updateCredential(
      credentialId,
      {
        is_active: false,
        credential_status: "revoked",
        verification_status: "revoked"
      },
      options
    );
  }

  function getCredentials(filters = {}) {
    return clone(CredentialState.credentials.filter(credential => {
      if (filters.role && credential.role !== normalizeRole(filters.role)) return false;
      if (filters.workspace_id && credential.workspace_id !== filters.workspace_id) return false;
      if (filters.organization_id && credential.organization_id !== filters.organization_id) return false;
      if (filters.sport && lower(credential.sport) !== lower(filters.sport)) return false;
      if (filters.verified_only && !credentialIsVerified(credential)) return false;
      if (filters.active_only && !credential.is_active) return false;
      return true;
    }));
  }

  function getCredential(credentialId) {
    return clone(
      CredentialState.credentials.find(item => item.credential_id === credentialId) ||
      null
    );
  }

  function getAuthorityProfile(context = {}) {
    if (context.refresh) {
      CredentialState.authority_profile = buildAuthorityProfile(context);
      CredentialState.runtime = buildRuntime(CredentialState.authority_profile);
      persistState();
    }

    return clone(CredentialState.authority_profile);
  }

  function getRuntime() {
    return clone(CredentialState.runtime);
  }

  function getPermissions(context = {}) {
    const profile = context.refresh
      ? buildAuthorityProfile(context)
      : CredentialState.authority_profile;

    return clone(profile?.permissions || []);
  }

  function hasPermission(permission, context = {}) {
    const permissions = getPermissions(context);
    return permissions.includes(permission) || permissions.includes("platform_admin") || permissions.includes("view_all");
  }

  function canActivateWorkspace(workspace = resolveWorkspace(), context = {}) {
    const profile = buildAuthorityProfile({
      ...context,
      workspace
    });

    const role = normalizeRole(workspace.role || profile.role);
    const hasRolePermission =
      profile.permissions.includes("platform_admin") ||
      profile.permissions.includes("manage_workspaces") ||
      profile.permissions.length > 0 ||
      !!DEFAULT_PERMISSION_SETS[role];

    const organization = resolveOrganization(context);

    const orgOk =
      !workspace.organization_id ||
      !organization.organization_id ||
      workspace.organization_id === organization.organization_id ||
      organization.verification_status === "verified" ||
      organization.governance_status === "runtime";

    return {
      allowed: !!hasRolePermission && !!orgOk,
      status: !!hasRolePermission && !!orgOk ? "WORKSPACE_AUTHORIZED" : "WORKSPACE_BLOCKED",
      reason: !!hasRolePermission && !!orgOk
        ? "Workspace authority validated."
        : "Workspace authority could not be validated.",
      authority_profile: profile,
      workspace,
      organization
    };
  }

  function canAccessDashboard(dashboardKey, context = {}) {
    const runtime = resolveWorkspaceRuntime(context);
    const role = normalizeRole(context.role || runtime.role);
    const permissions = getPermissions(context);

    const dashboardPermission = `access_dashboard_${lower(dashboardKey)}`;

    const allowed =
      permissions.includes("platform_admin") ||
      permissions.includes("view_all") ||
      permissions.includes(dashboardPermission) ||
      permissions.includes(`access_${role}_dashboard`) ||
      permissions.length > 0;

    return {
      allowed,
      status: allowed ? "DASHBOARD_ACCESS_APPROVED" : "DASHBOARD_ACCESS_BLOCKED",
      dashboard_key: dashboardKey,
      role,
      permissions,
      reason: allowed
        ? "Dashboard access approved by credential authority."
        : "Dashboard access not authorized for active workspace."
    };
  }

  function canSendMultiBoxMessage(message = {}, context = {}) {
    const permissions = getPermissions(context);
    const runtime = resolveWorkspaceRuntime(context);

    const allowed =
      permissions.includes("platform_admin") ||
      permissions.includes("send_governed_messages") ||
      permissions.includes("broadcast_governed_messages");

    if (message.is_broadcast && !permissions.includes("broadcast_governed_messages") && !permissions.includes("platform_admin")) {
      return {
        allowed: false,
        status: "BROADCAST_AUTHORITY_BLOCKED",
        reason: "Broadcast authority is not granted for the active workspace.",
        permissions,
        runtime
      };
    }

    return {
      allowed,
      status: allowed ? "MULTIBOX_AUTHORITY_APPROVED" : "MULTIBOX_AUTHORITY_BLOCKED",
      reason: allowed
        ? "Multi-Box communication authority approved."
        : "Multi-Box communication authority is not granted for the active workspace.",
      permissions,
      runtime
    };
  }

  function canPerformAction(action, context = {}) {
    const permission = lower(action);
    const allowed = hasPermission(permission, context);

    return {
      allowed,
      status: allowed ? "ACTION_AUTHORIZED" : "ACTION_BLOCKED",
      action: permission,
      reason: allowed
        ? "Action authorized by credential authority."
        : "Action is not authorized for the active workspace.",
      permissions: getPermissions(context)
    };
  }

  function buildPermissionMap() {
    const profile = CredentialState.authority_profile || {};
    const permissions = profile.permissions || [];

    const map = {};
    permissions.forEach(permission => {
      map[permission] = true;
    });

    CredentialState.permission_map = map;
    persistState();

    return clone(map);
  }

  function buildAuthoritySummary() {
    const profile = CredentialState.authority_profile || {};

    return {
      professional_id: profile.professional_id || null,
      workspace_id: profile.workspace_id || null,
      organization_id: profile.organization_id || null,
      role: profile.role || null,
      authority_scope: profile.authority_scope || null,
      credential_status: profile.credential_status || "pending_runtime",
      authority_status: profile.authority_status || "pending_runtime",
      verified: !!profile.verified,
      credential_count: profile.credential_count || 0,
      verified_credential_count: profile.verified_credential_count || 0,
      permission_count: (profile.permissions || []).length,
      generated_at: nowISO()
    };
  }

  function renderAuthorityBadge(container) {
    if (!container) return false;

    const profile = CredentialState.authority_profile || {};
    const verified = !!profile.verified;

    container.innerHTML = `
      <div style="
        border:1px solid ${verified ? "rgba(55,214,122,.55)" : "rgba(255,177,0,.55)"};
        background:rgba(0,0,0,.35);
        padding:12px 14px;
        color:#f4f4ef;
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div style="
          color:${verified ? "#37d67a" : "#ffb100"};
          font-size:11px;
          font-weight:900;
          letter-spacing:.14em;
          text-transform:uppercase;
        ">PHNX Credential Authority</div>

        <div style="margin-top:6px;font-size:16px;font-weight:900;">
          ${profile.authority_scope || profile.role || "Pending Authority"}
        </div>

        <div style="margin-top:4px;font-size:12px;color:#c9d8e8;">
          ${profile.credential_status || "pending_runtime"} • ${profile.authority_status || "pending_runtime"}
        </div>

        <div style="
          margin-top:8px;
          font-size:10px;
          color:${verified ? "#37d67a" : "#ffb100"};
          text-transform:uppercase;
          letter-spacing:.12em;
          font-weight:900;
        ">
          ${verified ? "Verified Authority" : "Runtime Authority Pending"}
        </div>
      </div>
    `;

    return true;
  }

  function runHealthCheck() {
    return {
      ok: !!CredentialState.initialized && !!CredentialState.authority_profile,
      engine_id: ENGINE_ID,
      version: VERSION,
      professional_id: CredentialState.professional_id,
      credential_count: CredentialState.credentials.length,
      credential_status: CredentialState.runtime?.credential_status || "pending_runtime",
      authority_status: CredentialState.runtime?.authority_status || "pending_runtime",
      verified: !!CredentialState.runtime?.verified,
      permission_count: (CredentialState.runtime?.permissions || []).length,
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_CREDENTIAL_AUTHORITY_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        runtime: getRuntime(),
        authority: getAuthorityProfile()
      };
    }

    window.__PHNX_CREDENTIAL_AUTHORITY_ENGINE_V1__ = true;

    CredentialState.initialized = true;
    CredentialState.booted_at = CredentialState.booted_at || nowISO();
    CredentialState.updated_at = nowISO();

    expose();

    await loadCredentials(context);
    buildPermissionMap();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Credential Authority] Engine online:", VERSION, buildAuthoritySummary());

    return {
      ok: true,
      status: "PHNX_CREDENTIAL_AUTHORITY_ENGINE_ONLINE",
      authority: getAuthorityProfile(),
      runtime: getRuntime(),
      summary: buildAuthoritySummary()
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      loadCredentials,

      createCredential,
      updateCredential,
      revokeCredential,

      getCredentials,
      getCredential,
      getAuthorityProfile,
      getRuntime,

      getPermissions,
      hasPermission,
      canActivateWorkspace,
      canAccessDashboard,
      canSendMultiBoxMessage,
      canPerformAction,

      buildPermissionMap,
      buildAuthoritySummary,
      renderAuthorityBadge,
      runHealthCheck,

      getState: () => clone(CredentialState)
    };

    window.PHXNCredentialAuthorityEngine = api;
    window.PHNX.CredentialAuthorityEngine = api;

    window.STATScoreCredentialAuthorityEngine = api;
    window.STATScore.CredentialAuthorityEngine = api;

    persistState();

    return api;
  }

  expose();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})(); 
