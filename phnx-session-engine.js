/* ============================================================
   PHNX OS™ Session Engine
   File: phnx-session-engine.js
   Version: PHNX-SESSION-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish, preserve, restore, and expose the active PHNX
   professional session for STATS-CORE™ and future PHNX apps.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Professional Identity is permanent.
   Professional Workspaces are operational.
   Session remembers the active identity, workspace, application,
   organization, runtime, and restoration state.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-session-engine";
  const VERSION = "PHNX-SESSION-ENGINE-V1";

  const STORAGE_KEYS = {
    session: "phnx_session",
    sessionId: "phnx_session_id",
    professionalId: "phnx_professional_id",
    activeWorkspaceId: "phnx_active_workspace_id",
    activeApplication: "phnx_active_application",
    lastRoute: "phnx_last_route",
    restoredAt: "phnx_session_restored_at"
  };

  const SessionState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,

    session_id: null,
    session_status: "UNINITIALIZED",

    professional_id: null,
    phnx_professional_id: null,
    workspace_id: null,
    workspace_name: null,

    application: "STATS-CORE",
    organization_id: null,
    organization_name: null,

    route: null,
    restored: false,
    restored_at: null,

    session_payload: {}
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

  function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "phnx_session_" + Date.now() + "_" + Math.random().toString(36).slice(2);
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

  function resolveIdentity() {
    const identity =
      identityEngine()?.getIdentity?.() ||
      window.PHNXProfessionalIdentity ||
      null;

    return identity || {};
  }

  function resolveWorkspace() {
    const workspace =
      workspaceRuntime()?.getActiveWorkspace?.() ||
      workspaceRegistry()?.getActiveWorkspace?.() ||
      safeJSONParse(getStorage("phnx_active_workspace"), null) ||
      null;

    return workspace || {};
  }

  function resolveRuntime() {
    return (
      workspaceRuntime()?.getRuntime?.() ||
      window.STATScoreWorkspaceRuntime ||
      safeJSONParse(getStorage("phnx_workspace_runtime"), null) ||
      {}
    );
  }

  function buildSession(context = {}) {
    const identity = resolveIdentity();
    const workspace = resolveWorkspace();
    const runtime = resolveRuntime();

    const professionalId =
      context.professional_id ||
      identity.professional_id ||
      identity.phnx_professional_id ||
      runtime.professional_id ||
      getParam("professional_id") ||
      getStorage(STORAGE_KEYS.professionalId) ||
      getStorage("statscore_professional_id") ||
      getStorage("statscore_user_id") ||
      null;

    const workspaceId =
      context.workspace_id ||
      workspace.workspace_id ||
      runtime.workspace_id ||
      getParam("workspace_id") ||
      getStorage(STORAGE_KEYS.activeWorkspaceId) ||
      null;

    return {
      session_id:
        context.session_id ||
        getStorage(STORAGE_KEYS.sessionId) ||
        uuid(),

      session_status: "ACTIVE",

      professional_id: professionalId,
      phnx_professional_id:
        identity.phnx_professional_id ||
        identity.professional_id ||
        runtime.phnx_professional_id ||
        professionalId,

      professional_name:
        identity.display_name ||
        runtime.professional_name ||
        getStorage("phnx_professional_name") ||
        null,

      workspace_id: workspaceId,
      workspace_name:
        workspace.workspace_name ||
        runtime.workspace_name ||
        null,

      workspace_type:
        workspace.workspace_type ||
        runtime.workspace_type ||
        null,

      application:
        context.application ||
        runtime.application ||
        getParam("application") ||
        getStorage(STORAGE_KEYS.activeApplication) ||
        "STATS-CORE",

      organization_id:
        context.organization_id ||
        workspace.organization_id ||
        runtime.organization_id ||
        getStorage("phnx_organization_id") ||
        null,

      organization_name:
        context.organization_name ||
        workspace.organization_name ||
        runtime.organization_name ||
        getStorage("phnx_organization_name") ||
        null,

      sport:
        context.sport ||
        workspace.sport ||
        runtime.sport ||
        getStorage("statscore_sport") ||
        null,

      role:
        context.role ||
        workspace.role ||
        runtime.role ||
        getStorage("statscore_role") ||
        null,

      role_id:
        context.role_id ||
        workspace.role_id ||
        runtime.role_id ||
        getStorage("statscore_role_id") ||
        null,

      assignment_title:
        context.assignment_title ||
        workspace.assignment_title ||
        runtime.assignment_title ||
        null,

      authority_scope:
        context.authority_scope ||
        workspace.authority_scope ||
        runtime.authority_scope ||
        null,

      route:
        context.route ||
        window.location.pathname.split("/").pop() ||
        "index.html",

      url:
        window.location.href,

      restored: false,
      restored_at: null,

      session_payload: {
        engine_id: ENGINE_ID,
        version: VERSION,
        identity,
        workspace,
        runtime,
        context,
        created_at: nowISO()
      }
    };
  }

  function applySessionCompatibility(session) {
    if (!session) return;

    if (session.professional_id) {
      setSession("phnx_professional_id", session.professional_id);
      setSession("statscore_professional_id", session.professional_id);
      setSession("statscore_user_id", session.professional_id);
    }

    if (session.workspace_id) {
      setSession("phnx_active_workspace_id", session.workspace_id);
    }

    if (session.application) {
      setSession("phnx_active_application", session.application);
    }

    if (session.organization_id) {
      setSession("phnx_organization_id", session.organization_id);
    }

    if (session.organization_name) {
      setSession("phnx_organization_name", session.organization_name);
    }

    if (session.role) {
      setSession("statscore_role", lower(session.role));
    }

    if (session.role_id) {
      setSession("statscore_role_id", session.role_id);
    }

    if (session.sport) {
      setSession("statscore_sport", session.sport);
    }

    if (session.professional_name) {
      setSession("statscore_sender_label", session.professional_name);
      setSession("phnx_professional_name", session.professional_name);
    }
  }

  function persistSession() {
    SessionState.updated_at = nowISO();

    setSession(STORAGE_KEYS.session, SessionState);
    setSession(STORAGE_KEYS.sessionId, SessionState.session_id || "");
    setSession(STORAGE_KEYS.professionalId, SessionState.professional_id || "");
    setSession(STORAGE_KEYS.activeWorkspaceId, SessionState.workspace_id || "");
    setSession(STORAGE_KEYS.activeApplication, SessionState.application || "STATS-CORE");
    setSession(STORAGE_KEYS.lastRoute, SessionState.route || "");

    applySessionCompatibility(SessionState);

    window.PHNXSessionState = SessionState;
    window.STATScoreSessionState = SessionState;

    return SessionState;
  }

  async function persistSessionToDB(session = SessionState) {
    const client = db();

    if (!client) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        session
      };
    }

    try {
      const { data, error } = await client
        .from("phnx_sessions")
        .upsert({
          session_id: session.session_id,
          professional_id: session.professional_id,
          phnx_professional_id: session.phnx_professional_id,
          workspace_id: session.workspace_id,
          workspace_name: session.workspace_name,
          application: session.application,
          organization_id: session.organization_id,
          organization_name: session.organization_name,
          role: session.role,
          role_id: session.role_id,
          sport: session.sport,
          session_status: session.session_status,
          route: session.route,
          url: session.url,
          session_payload: session.session_payload || {},
          updated_at: nowISO()
        }, {
          onConflict: "session_id"
        })
        .select("*")
        .single();

      if (error) {
        return {
          ok: false,
          status: "SESSION_DB_PERSIST_FAILED",
          error,
          session
        };
      }

      return {
        ok: true,
        status: "SESSION_DB_PERSISTED",
        session: data
      };
    } catch (error) {
      return {
        ok: false,
        status: "SESSION_DB_PERSIST_EXCEPTION",
        error,
        session
      };
    }
  }

  function setSessionState(session = {}) {
    Object.assign(SessionState, {
      ...SessionState,
      ...session,
      initialized: true,
      engine_id: ENGINE_ID,
      version: VERSION,
      updated_at: nowISO()
    });

    persistSession();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("phnx_session_changed", {
        engine: ENGINE_ID,
        version: VERSION,
        session_id: SessionState.session_id,
        professional_id: SessionState.professional_id,
        workspace_id: SessionState.workspace_id,
        application: SessionState.application,
        changed_at: nowISO()
      });
    }

    return {
      ok: true,
      status: "SESSION_SET",
      session: clone(SessionState)
    };
  }

  async function startSession(context = {}, options = {}) {
    const session = buildSession(context);

    setSessionState(session);

    let dbResult = null;
    if (options.persist !== false) {
      dbResult = await persistSessionToDB(SessionState);
    }

    return {
      ok: true,
      status: "SESSION_STARTED",
      session: clone(SessionState),
      db: dbResult
    };
  }

  function restoreSession(context = {}) {
    const cached = safeJSONParse(getStorage(STORAGE_KEYS.session), null);

    if (cached?.session_id && !context.force_new) {
      Object.assign(SessionState, cached, {
        initialized: true,
        restored: true,
        restored_at: nowISO(),
        session_status: cached.session_status || "ACTIVE"
      });

      setSession(STORAGE_KEYS.restoredAt, SessionState.restored_at);
      persistSession();

      return {
        ok: true,
        status: "SESSION_RESTORED",
        session: clone(SessionState)
      };
    }

    const session = buildSession(context);
    Object.assign(SessionState, session, {
      initialized: true,
      restored: false,
      session_status: "ACTIVE"
    });

    persistSession();

    return {
      ok: true,
      status: "SESSION_CREATED",
      session: clone(SessionState)
    };
  }

  async function refreshSession(context = {}) {
    const session = buildSession({
      ...context,
      session_id: SessionState.session_id || getStorage(STORAGE_KEYS.sessionId)
    });

    return startSession(session);
  }

  async function endSession(options = {}) {
    SessionState.session_status = "ENDED";
    SessionState.updated_at = nowISO();

    persistSession();

    if (options.clear_storage) {
      Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));
    }

    await persistSessionToDB(SessionState);

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("phnx_session_ended", {
        engine: ENGINE_ID,
        version: VERSION,
        session_id: SessionState.session_id,
        ended_at: nowISO()
      });
    }

    return {
      ok: true,
      status: "SESSION_ENDED",
      session: clone(SessionState)
    };
  }

  function updateRoute(route = null) {
    SessionState.route =
      route ||
      window.location.pathname.split("/").pop() ||
      "index.html";

    SessionState.url = window.location.href;
    SessionState.updated_at = nowISO();

    persistSession();

    return {
      ok: true,
      status: "SESSION_ROUTE_UPDATED",
      route: SessionState.route,
      session: clone(SessionState)
    };
  }

  function getSession() {
    return clone(SessionState);
  }

  function getSessionId() {
    return SessionState.session_id || null;
  }

  function getSessionContext() {
    return {
      session_id: SessionState.session_id,
      professional_id: SessionState.professional_id,
      phnx_professional_id: SessionState.phnx_professional_id,
      workspace_id: SessionState.workspace_id,
      workspace_name: SessionState.workspace_name,
      application: SessionState.application,
      organization_id: SessionState.organization_id,
      organization_name: SessionState.organization_name,
      role: SessionState.role,
      role_id: SessionState.role_id,
      sport: SessionState.sport,
      assignment_title: SessionState.assignment_title,
      authority_scope: SessionState.authority_scope,
      route: SessionState.route,
      session_status: SessionState.session_status
    };
  }

  function isActive() {
    return SessionState.session_status === "ACTIVE";
  }

  function runHealthCheck() {
    return {
      ok: !!SessionState.initialized && !!SessionState.session_id,
      engine_id: ENGINE_ID,
      version: VERSION,
      session_id: SessionState.session_id,
      session_status: SessionState.session_status,
      professional_id: SessionState.professional_id,
      workspace_id: SessionState.workspace_id,
      application: SessionState.application,
      restored: !!SessionState.restored,
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_SESSION_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        session: getSession()
      };
    }

    window.__PHNX_SESSION_ENGINE_V1__ = true;

    SessionState.initialized = true;
    SessionState.booted_at = SessionState.booted_at || nowISO();

    expose();

    const restored = restoreSession(context);
    updateRoute(context.route);

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Session] Engine online:", VERSION, getSessionContext());

    return {
      ok: true,
      status: "PHNX_SESSION_ENGINE_ONLINE",
      restore: restored,
      session: getSession()
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      startSession,
      restoreSession,
      refreshSession,
      endSession,
      updateRoute,

      getSession,
      getSessionId,
      getSessionContext,
      isActive,

      persistSessionToDB,
      runHealthCheck,

      getState: () => clone(SessionState)
    };

    window.PHNXSessionEngine = api;
    window.PHNX.SessionEngine = api;

    window.STATScoreSessionEngine = api;
    window.STATScore.SessionEngine = api;

    persistSession();

    return api;
  }

  expose();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  window.addEventListener("beforeunload", () => {
    try {
      updateRoute();
    } catch (_) {}
  });
})(); 
