/* ============================================================
   PHNX OS™ Workspace Registry Engine
   File: phnx-workspace-registry-engine.js
   Version: PHNX-WORKSPACE-REGISTRY-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish, manage, persist, and expose PHNX Professional
   Workspaces for STATS-CORE™ and future PHNX applications.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Professional Identity is permanent.
   Professional Workspaces are operational.
   One PHNX Professional Identity may own multiple workspaces.
   Dashboard behavior follows the active workspace.
   Multi-Box communicates from the active workspace.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-workspace-registry-engine";
  const VERSION = "PHNX-WORKSPACE-REGISTRY-ENGINE-V1";

  const STORAGE_KEYS = {
    registry: "phnx_workspace_registry",
    workspaces: "phnx_professional_workspaces",
    activeWorkspaceId: "phnx_active_workspace_id",
    activeWorkspace: "phnx_active_workspace",
    professionalId: "phnx_professional_id"
  };

  const RegistryState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,
    professional_id: null,
    workspaces: [],
    active_workspace_id: null,
    registry_status: "UNINITIALIZED"
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

  function runtimeEngine() {
    return window.PHNXWorkspaceRuntime || window.PHNX?.WorkspaceRuntime || null;
  }

  function makeWorkspaceId(seed = "workspace") {
    const base = lower(seed).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return "PHNX-WS-" + (base || "WORKSPACE").toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
  }

  function normalizeRole(value) {
    const raw = lower(value);
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

  function workspaceName(workspace = {}) {
    return (
      workspace.workspace_name ||
      workspace.name ||
      [
        workspace.organization_name || workspace.organization,
        workspace.sport,
        workspace.assignment_title || workspace.assignment
      ].filter(Boolean).join(" • ") ||
      `${workspace.assignment_title || workspace.role || "Professional"} Workspace`
    );
  }

  function normalizeWorkspace(workspace = {}, context = {}) {
    const professionalId = resolveProfessionalId(context) || workspace.professional_id || workspace.phnx_professional_id;
    const role = normalizeRole(workspace.role || workspace.workspace_type || workspace.base_role || workspace.assignment_role);

    const normalized = {
      workspace_id:
        workspace.workspace_id ||
        workspace.id ||
        makeWorkspaceId(workspace.assignment_title || workspace.role || workspace.sport || "workspace"),

      professional_id: professionalId,
      phnx_professional_id: workspace.phnx_professional_id || professionalId,

      workspace_name: workspaceName(workspace),
      workspace_type: workspace.workspace_type || role,

      application: workspace.application || "STATS-CORE",

      organization_id: workspace.organization_id || null,
      organization_name: workspace.organization_name || workspace.organization || null,

      sport: workspace.sport || null,
      team_level: workspace.team_level || workspace.level || null,

      assignment_title:
        workspace.assignment_title ||
        workspace.assignment ||
        workspace.title ||
        workspace.position_title ||
        role,

      authority_scope:
        workspace.authority_scope ||
        workspace.authority ||
        workspace.permission_scope ||
        role,

      role,
      role_id:
        workspace.role_id ||
        workspace.assignment_id ||
        workspace.workspace_id ||
        null,

      status: workspace.status || "active",
      is_active: workspace.is_active !== false,
      is_default: !!workspace.is_default,

      start_date: workspace.start_date || null,
      end_date: workspace.end_date || null,

      metadata: {
        ...(workspace.metadata || {}),
        normalized_at: nowISO()
      }
    };

    normalized.workspace_name = workspaceName(normalized);
    return normalized;
  }

  function persistRegistry() {
    RegistryState.updated_at = nowISO();

    setSession(STORAGE_KEYS.registry, RegistryState);
    setSession(STORAGE_KEYS.workspaces, RegistryState.workspaces);
    setSession(STORAGE_KEYS.activeWorkspaceId, RegistryState.active_workspace_id || "");

    const active = getActiveWorkspace();
    if (active) setSession(STORAGE_KEYS.activeWorkspace, active);

    window.PHNXWorkspaceRegistryState = RegistryState;
    window.PHNXProfessionalWorkspaces = RegistryState.workspaces;
    window.STATScoreProfessionalWorkspaces = RegistryState.workspaces;

    return RegistryState;
  }

  async function loadWorkspaces(context = {}) {
    const professionalId = resolveProfessionalId(context);
    RegistryState.professional_id = professionalId;

    const cached = safeJSONParse(getStorage(STORAGE_KEYS.workspaces), null);

    if (Array.isArray(cached) && cached.length && !context.force_reload) {
      RegistryState.workspaces = cached.map(w => normalizeWorkspace(w, { professional_id: professionalId }));
      RegistryState.registry_status = "LOADED_FROM_CACHE";
      persistRegistry();
      return RegistryState.workspaces;
    }

    const client = db();

    /*
      Platform table:
      phnx_professional_workspaces

      Expected columns:
      workspace_id, professional_id, workspace_name, workspace_type,
      application, organization_id, organization_name, sport, team_level,
      assignment_title, authority_scope, role, role_id, status, is_active,
      is_default, start_date, end_date, metadata, created_at, updated_at
    */
    if (client && professionalId) {
      try {
        const { data, error } = await client
          .from("phnx_professional_workspaces")
          .select("*")
          .eq("professional_id", professionalId)
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data) && data.length) {
          RegistryState.workspaces = data.map(w => normalizeWorkspace(w, { professional_id: professionalId }));
          RegistryState.registry_status = "LOADED_FROM_DATABASE";
          persistRegistry();
          return RegistryState.workspaces;
        }

        if (error) {
          console.warn("[PHNX Workspace Registry] DB load fallback active:", error);
        }
      } catch (error) {
        console.warn("[PHNX Workspace Registry] DB exception fallback active:", error);
      }
    }

    const fallback = createFallbackWorkspace(context);
    RegistryState.workspaces = [fallback];
    RegistryState.registry_status = "FALLBACK_WORKSPACE_ACTIVE";
    persistRegistry();

    return RegistryState.workspaces;
  }

  function createFallbackWorkspace(context = {}) {
    const professionalId = resolveProfessionalId(context);

    const role =
      context.role ||
      context.sender_role ||
      getParam("role") ||
      getStorage("statscore_role") ||
      "coach";

    const roleId =
      context.role_id ||
      context.sender_role_id ||
      getParam("role_id") ||
      getStorage("statscore_role_id") ||
      `${normalizeRole(role)}-runtime`;

    return normalizeWorkspace({
      workspace_id:
        context.workspace_id ||
        getParam("workspace_id") ||
        getStorage(STORAGE_KEYS.activeWorkspaceId) ||
        makeWorkspaceId(roleId),

      professional_id: professionalId,
      workspace_type: normalizeRole(role),
      application: context.application || "STATS-CORE",

      organization_id:
        context.organization_id ||
        getParam("organization_id") ||
        getStorage("phnx_organization_id") ||
        null,

      organization_name:
        context.organization_name ||
        context.organization ||
        getParam("organization") ||
        getStorage("phnx_organization_name") ||
        null,

      sport:
        context.sport ||
        getParam("sport") ||
        getStorage("statscore_sport") ||
        null,

      team_level:
        context.team_level ||
        getParam("team_level") ||
        null,

      assignment_title:
        context.assignment_title ||
        context.assignment ||
        getParam("assignment") ||
        getStorage("phnx_assignment_title") ||
        role,

      authority_scope:
        context.authority_scope ||
        getParam("authority_scope") ||
        normalizeRole(role),

      role: normalizeRole(role),
      role_id: roleId,
      is_active: true,
      is_default: true,
      status: "active",
      metadata: {
        source: "fallback_legacy_role_bridge"
      }
    }, { professional_id: professionalId });
  }

  async function createWorkspace(workspace = {}, options = {}) {
    const normalized = normalizeWorkspace(workspace, options);
    const client = db();

    const existingIndex = RegistryState.workspaces.findIndex(w => w.workspace_id === normalized.workspace_id);

    if (existingIndex >= 0) {
      RegistryState.workspaces[existingIndex] = {
        ...RegistryState.workspaces[existingIndex],
        ...normalized,
        updated_at: nowISO()
      };
    } else {
      RegistryState.workspaces.push({
        ...normalized,
        created_at: nowISO(),
        updated_at: nowISO()
      });
    }

    if (options.make_default) {
      RegistryState.workspaces = RegistryState.workspaces.map(w => ({
        ...w,
        is_default: w.workspace_id === normalized.workspace_id
      }));
    }

    persistRegistry();

    if (client && options.persist !== false) {
      try {
        const { data, error } = await client
          .from("phnx_professional_workspaces")
          .upsert({
            workspace_id: normalized.workspace_id,
            professional_id: normalized.professional_id,
            phnx_professional_id: normalized.phnx_professional_id,
            workspace_name: normalized.workspace_name,
            workspace_type: normalized.workspace_type,
            application: normalized.application,
            organization_id: normalized.organization_id,
            organization_name: normalized.organization_name,
            sport: normalized.sport,
            team_level: normalized.team_level,
            assignment_title: normalized.assignment_title,
            authority_scope: normalized.authority_scope,
            role: normalized.role,
            role_id: normalized.role_id,
            status: normalized.status,
            is_active: normalized.is_active,
            is_default: normalized.is_default,
            start_date: normalized.start_date,
            end_date: normalized.end_date,
            metadata: normalized.metadata || {},
            updated_at: nowISO()
          }, {
            onConflict: "workspace_id"
          })
          .select("*")
          .single();

        if (error) {
          console.warn("[PHNX Workspace Registry] Workspace upsert fallback:", error);
          return {
            ok: false,
            status: "WORKSPACE_STORED_LOCALLY_DB_FAILED",
            error,
            workspace: normalized
          };
        }

        const saved = normalizeWorkspace(data, options);

        const savedIndex = RegistryState.workspaces.findIndex(w => w.workspace_id === saved.workspace_id);
        if (savedIndex >= 0) RegistryState.workspaces[savedIndex] = saved;

        persistRegistry();

        return {
          ok: true,
          status: "WORKSPACE_CREATED",
          workspace: saved
        };
      } catch (error) {
        return {
          ok: false,
          status: "WORKSPACE_STORED_LOCALLY_DB_EXCEPTION",
          error,
          workspace: normalized
        };
      }
    }

    return {
      ok: true,
      status: "WORKSPACE_CREATED_LOCAL",
      workspace: normalized
    };
  }

  async function updateWorkspace(workspaceId, updates = {}, options = {}) {
    const index = RegistryState.workspaces.findIndex(w => w.workspace_id === workspaceId);

    if (index < 0) {
      return {
        ok: false,
        status: "WORKSPACE_NOT_FOUND"
      };
    }

    const updated = normalizeWorkspace({
      ...RegistryState.workspaces[index],
      ...updates,
      workspace_id: workspaceId,
      updated_at: nowISO()
    });

    RegistryState.workspaces[index] = updated;
    persistRegistry();

    if (getActiveWorkspace()?.workspace_id === workspaceId) {
      setActiveWorkspace(workspaceId);
    }

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { error } = await client
          .from("phnx_professional_workspaces")
          .update({
            workspace_name: updated.workspace_name,
            workspace_type: updated.workspace_type,
            application: updated.application,
            organization_id: updated.organization_id,
            organization_name: updated.organization_name,
            sport: updated.sport,
            team_level: updated.team_level,
            assignment_title: updated.assignment_title,
            authority_scope: updated.authority_scope,
            role: updated.role,
            role_id: updated.role_id,
            status: updated.status,
            is_active: updated.is_active,
            is_default: updated.is_default,
            start_date: updated.start_date,
            end_date: updated.end_date,
            metadata: updated.metadata || {},
            updated_at: nowISO()
          })
          .eq("workspace_id", workspaceId);

        if (error) {
          return {
            ok: false,
            status: "WORKSPACE_UPDATED_LOCAL_DB_FAILED",
            error,
            workspace: updated
          };
        }
      } catch (error) {
        return {
          ok: false,
          status: "WORKSPACE_UPDATED_LOCAL_DB_EXCEPTION",
          error,
          workspace: updated
        };
      }
    }

    return {
      ok: true,
      status: "WORKSPACE_UPDATED",
      workspace: updated
    };
  }

  async function archiveWorkspace(workspaceId, options = {}) {
    return updateWorkspace(
      workspaceId,
      {
        is_active: false,
        status: "archived",
        end_date: options.end_date || nowISO()
      },
      options
    );
  }

  function getWorkspaces(filters = {}) {
    return clone(RegistryState.workspaces.filter(w => {
      if (filters.application && w.application !== filters.application) return false;
      if (filters.role && w.role !== normalizeRole(filters.role)) return false;
      if (filters.sport && lower(w.sport) !== lower(filters.sport)) return false;
      if (filters.organization_id && w.organization_id !== filters.organization_id) return false;
      if (filters.status && w.status !== filters.status) return false;
      if (filters.active_only && !w.is_active) return false;
      return true;
    }));
  }

  function getWorkspace(workspaceId) {
    return clone(RegistryState.workspaces.find(w => w.workspace_id === workspaceId) || null);
  }

  function getDefaultWorkspace() {
    return clone(
      RegistryState.workspaces.find(w => w.is_default && w.is_active) ||
      RegistryState.workspaces.find(w => w.is_active) ||
      RegistryState.workspaces[0] ||
      null
    );
  }

  function getActiveWorkspace() {
    const id = RegistryState.active_workspace_id || getStorage(STORAGE_KEYS.activeWorkspaceId);
    return clone(
      RegistryState.workspaces.find(w => w.workspace_id === id) ||
      getDefaultWorkspace()
    );
  }

  function setActiveWorkspace(workspaceId) {
    const workspace = RegistryState.workspaces.find(w => w.workspace_id === workspaceId);

    if (!workspace) {
      return {
        ok: false,
        status: "WORKSPACE_NOT_FOUND"
      };
    }

    RegistryState.active_workspace_id = workspace.workspace_id;

    setSession(STORAGE_KEYS.activeWorkspaceId, workspace.workspace_id);
    setSession(STORAGE_KEYS.activeWorkspace, workspace);

    if (runtimeEngine()?.setActiveWorkspace) {
      runtimeEngine().setActiveWorkspace(workspace, { silent: true });
    }

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("workspace_registry_active_workspace_changed", {
        engine: ENGINE_ID,
        version: VERSION,
        workspace_id: workspace.workspace_id,
        role: workspace.role,
        sport: workspace.sport,
        changed_at: nowISO()
      });
    }

    persistRegistry();

    return {
      ok: true,
      status: "ACTIVE_WORKSPACE_SET",
      workspace
    };
  }

  function buildWorkspaceSummary() {
    const active = getActiveWorkspace();

    return {
      professional_id: RegistryState.professional_id,
      total_workspaces: RegistryState.workspaces.length,
      active_workspaces: RegistryState.workspaces.filter(w => w.is_active).length,
      applications: [...new Set(RegistryState.workspaces.map(w => w.application).filter(Boolean))],
      sports: [...new Set(RegistryState.workspaces.map(w => w.sport).filter(Boolean))],
      roles: [...new Set(RegistryState.workspaces.map(w => w.role).filter(Boolean))],
      active_workspace_id: active?.workspace_id || null,
      active_workspace_name: active?.workspace_name || null,
      generated_at: nowISO()
    };
  }

  function renderWorkspaceList(container, options = {}) {
    if (!container) return false;

    const workspaces = getWorkspaces(options.filters || {});
    const active = getActiveWorkspace();

    container.innerHTML = `
      <div style="
        border:1px solid rgba(0,229,255,.35);
        background:rgba(0,0,0,.35);
        padding:14px;
        color:#f4f4ef;
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div style="
          color:#00e5ff;
          font-size:11px;
          font-weight:900;
          letter-spacing:.14em;
          text-transform:uppercase;
        ">PHNX Workspaces</div>

        <div style="margin-top:10px;display:grid;gap:8px;">
          ${workspaces.map(w => `
            <button
              type="button"
              data-phnx-workspace-id="${w.workspace_id}"
              style="
                text-align:left;
                border:1px solid ${active?.workspace_id === w.workspace_id ? "rgba(55,214,122,.75)" : "rgba(255,255,255,.14)"};
                background:${active?.workspace_id === w.workspace_id ? "rgba(55,214,122,.10)" : "rgba(255,255,255,.04)"};
                color:#f4f4ef;
                padding:10px;
                cursor:pointer;
              "
            >
              <div style="font-weight:900;font-size:13px;">
                ${w.workspace_name}
              </div>
              <div style="margin-top:3px;color:#9fb1c7;font-size:11px;">
                ${[w.sport, w.assignment_title, w.organization_name].filter(Boolean).join(" • ") || w.role}
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-phnx-workspace-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        setActiveWorkspace(btn.dataset.phnxWorkspaceId);
        renderWorkspaceList(container, options);
      });
    });

    return true;
  }

  function runHealthCheck() {
    return {
      ok: !!RegistryState.initialized && RegistryState.workspaces.length > 0,
      engine_id: ENGINE_ID,
      version: VERSION,
      professional_id: RegistryState.professional_id,
      workspace_count: RegistryState.workspaces.length,
      active_workspace_id: RegistryState.active_workspace_id,
      registry_status: RegistryState.registry_status,
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_WORKSPACE_REGISTRY_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        registry: RegistryState
      };
    }

    window.__PHNX_WORKSPACE_REGISTRY_ENGINE_V1__ = true;

    RegistryState.initialized = true;
    RegistryState.booted_at = RegistryState.booted_at || nowISO();
    RegistryState.updated_at = nowISO();

    expose();

    await loadWorkspaces(context);

    const requested =
      context.workspace_id ||
      getParam("workspace_id") ||
      getStorage(STORAGE_KEYS.activeWorkspaceId);

    const active = requested
      ? RegistryState.workspaces.find(w => w.workspace_id === requested)
      : getDefaultWorkspace();

    if (active) setActiveWorkspace(active.workspace_id);

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Workspace Registry] Engine online:", VERSION, buildWorkspaceSummary());

    return {
      ok: true,
      status: "PHNX_WORKSPACE_REGISTRY_ONLINE",
      registry: RegistryState,
      summary: buildWorkspaceSummary()
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      loadWorkspaces,

      createWorkspace,
      updateWorkspace,
      archiveWorkspace,

      getWorkspaces,
      getWorkspace,
      getDefaultWorkspace,
      getActiveWorkspace,
      setActiveWorkspace,

      buildWorkspaceSummary,
      renderWorkspaceList,
      runHealthCheck,

      getState: () => clone(RegistryState)
    };

    window.PHNXWorkspaceRegistryEngine = api;
    window.PHNX.WorkspaceRegistryEngine = api;

    window.STATScoreWorkspaceRegistryEngine = api;
    window.STATScore.WorkspaceRegistryEngine = api;

    persistRegistry();

    return api;
  }

  expose();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})(); 
