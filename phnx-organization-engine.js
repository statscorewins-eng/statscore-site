/* ============================================================
   PHNX OS™ Organization Engine
   File: phnx-organization-engine.js
   Version: PHNX-ORGANIZATION-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish, manage, persist, and expose organization context
   for PHNX Professional Workspaces, STATS-CORE™, Multi-Box™,
   credential authority, dashboards, rosters, and future PHNX apps.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Professional Identity is permanent.
   Professional Workspaces are operational.
   Organizations are operational environments.
   People are linked to organizations through workspaces,
   memberships, permissions, and credential authority.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-organization-engine";
  const VERSION = "PHNX-ORGANIZATION-ENGINE-V1";

  const STORAGE_KEYS = {
    organizations: "phnx_organizations",
    activeOrganizationId: "phnx_active_organization_id",
    activeOrganization: "phnx_active_organization",
    organizationRuntime: "phnx_organization_runtime"
  };

  const OrganizationState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,

    organizations: [],
    active_organization: null,

    runtime: {
      organization_id: null,
      organization_name: null,
      organization_type: null,
      organization_level: null,
      location: null,
      application: "STATS-CORE",
      status: "UNINITIALIZED"
    }
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

  function workspaceRuntime() {
    return window.PHNXWorkspaceRuntime || window.PHNX?.WorkspaceRuntime || null;
  }

  function workspaceRegistry() {
    return window.PHNXWorkspaceRegistryEngine || window.PHNX?.WorkspaceRegistryEngine || null;
  }

  function sessionEngine() {
    return window.PHNXSessionEngine || window.PHNX?.SessionEngine || null;
  }

  function makeOrganizationId(seed = "organization") {
    const base = lower(seed).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return "PHNX-ORG-" + (base || "ORG").toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
  }

  function normalizeOrganizationType(value) {
    const raw = lower(value);

    const aliases = {
      school: "school",
      high_school: "school",
      hs: "school",
      middle_school: "school",
      college: "college",
      university: "college",
      juco: "college",
      club: "club",
      travel: "club",
      recreation: "recreational_league",
      rec: "recreational_league",
      youth: "youth_league",
      league: "league",
      training: "training_facility",
      facility: "training_facility",
      evaluator: "evaluation_organization",
      recruiting: "recruiting_service",
      program: "program",
      district: "district",
      athletic_department: "athletic_department"
    };

    return aliases[raw] || raw || "organization";
  }

  function organizationName(org = {}) {
    return (
      org.organization_name ||
      org.name ||
      org.school_name ||
      org.program_name ||
      org.club_name ||
      org.display_name ||
      "PHNX Organization"
    );
  }

  function normalizeOrganization(org = {}) {
    const name = organizationName(org);

    return {
      organization_id:
        org.organization_id ||
        org.id ||
        makeOrganizationId(name),

      organization_name: name,

      organization_type:
        normalizeOrganizationType(org.organization_type || org.type || org.category),

      organization_level:
        org.organization_level ||
        org.level ||
        org.competition_level ||
        null,

      organization_status:
        org.organization_status ||
        org.status ||
        "active",

      is_active:
        org.is_active !== false,

      city: org.city || null,
      state: org.state || org.region || null,
      country: org.country || "US",

      location:
        org.location ||
        [org.city, org.state].filter(Boolean).join(", ") ||
        null,

      website_url:
        org.website_url ||
        org.website ||
        org.url ||
        null,

      primary_sport:
        org.primary_sport ||
        org.sport ||
        null,

      supported_sports:
        Array.isArray(org.supported_sports)
          ? org.supported_sports
          : org.supported_sports
            ? [org.supported_sports]
            : [],

      governance_status:
        org.governance_status ||
        "pending_runtime",

      verification_status:
        org.verification_status ||
        "pending_runtime",

      metadata: {
        ...(org.metadata || {}),
        normalized_at: nowISO()
      },

      source_record:
        org.source_record || org
    };
  }

  function resolveWorkspaceOrganization() {
    const runtime =
      workspaceRuntime()?.getRuntime?.() ||
      window.STATScoreWorkspaceRuntime ||
      safeJSONParse(getStorage("phnx_workspace_runtime"), null) ||
      {};

    const workspace =
      workspaceRuntime()?.getActiveWorkspace?.() ||
      workspaceRegistry()?.getActiveWorkspace?.() ||
      safeJSONParse(getStorage("phnx_active_workspace"), null) ||
      {};

    return {
      organization_id:
        workspace.organization_id ||
        runtime.organization_id ||
        getParam("organization_id") ||
        getStorage("phnx_organization_id") ||
        null,

      organization_name:
        workspace.organization_name ||
        runtime.organization_name ||
        getParam("organization") ||
        getStorage("phnx_organization_name") ||
        null,

      organization_type:
        workspace.organization_type ||
        runtime.organization_type ||
        getParam("organization_type") ||
        null,

      sport:
        workspace.sport ||
        runtime.sport ||
        getParam("sport") ||
        getStorage("statscore_sport") ||
        null
    };
  }

  function buildFallbackOrganization(context = {}) {
    const resolved = resolveWorkspaceOrganization();

    return normalizeOrganization({
      organization_id:
        context.organization_id ||
        resolved.organization_id ||
        makeOrganizationId(context.organization_name || resolved.organization_name || "runtime"),

      organization_name:
        context.organization_name ||
        context.organization ||
        resolved.organization_name ||
        "PHNX Runtime Organization",

      organization_type:
        context.organization_type ||
        resolved.organization_type ||
        "organization",

      organization_level:
        context.organization_level ||
        context.level ||
        null,

      city:
        context.city ||
        getParam("city") ||
        null,

      state:
        context.state ||
        getParam("state") ||
        null,

      primary_sport:
        context.primary_sport ||
        context.sport ||
        resolved.sport ||
        null,

      supported_sports:
        context.supported_sports ||
        (resolved.sport ? [resolved.sport] : []),

      governance_status: "runtime",
      verification_status: "pending_runtime",

      metadata: {
        source: "fallback_workspace_organization"
      }
    });
  }

  function buildOrganizationRuntime(org = {}) {
    return {
      engine_id: ENGINE_ID,
      version: VERSION,

      organization_id: org.organization_id || null,
      organization_name: org.organization_name || null,
      organization_type: org.organization_type || null,
      organization_level: org.organization_level || null,

      city: org.city || null,
      state: org.state || null,
      country: org.country || "US",
      location: org.location || null,

      primary_sport: org.primary_sport || null,
      supported_sports: org.supported_sports || [],

      governance_status: org.governance_status || "pending_runtime",
      verification_status: org.verification_status || "pending_runtime",

      application: "STATS-CORE",
      status: org.organization_id ? "ACTIVE_ORGANIZATION" : "NO_ACTIVE_ORGANIZATION",
      loaded_at: nowISO()
    };
  }

  function persistState() {
    OrganizationState.updated_at = nowISO();

    setSession(STORAGE_KEYS.organizations, OrganizationState.organizations);
    setSession(STORAGE_KEYS.activeOrganizationId, OrganizationState.active_organization?.organization_id || "");
    setSession(STORAGE_KEYS.activeOrganization, OrganizationState.active_organization || {});
    setSession(STORAGE_KEYS.organizationRuntime, OrganizationState.runtime || {});

    if (OrganizationState.active_organization?.organization_id) {
      setSession("phnx_organization_id", OrganizationState.active_organization.organization_id);
    }

    if (OrganizationState.active_organization?.organization_name) {
      setSession("phnx_organization_name", OrganizationState.active_organization.organization_name);
    }

    window.PHNXOrganizationState = OrganizationState;
    window.PHNXActiveOrganization = OrganizationState.active_organization;
    window.STATScoreOrganizationRuntime = OrganizationState.runtime;

    return OrganizationState;
  }

  async function loadOrganizations(context = {}) {
    const cached = safeJSONParse(getStorage(STORAGE_KEYS.organizations), null);

    if (Array.isArray(cached) && cached.length && !context.force_reload) {
      OrganizationState.organizations = cached.map(normalizeOrganization);
      persistState();
      return OrganizationState.organizations;
    }

    const client = db();

    /*
      Platform table:
      phnx_organizations

      Expected columns:
      organization_id, organization_name, organization_type,
      organization_level, city, state, country, website_url,
      primary_sport, supported_sports, governance_status,
      verification_status, is_active, metadata, created_at, updated_at
    */
    if (client) {
      try {
        let query = client
          .from("phnx_organizations")
          .select("*")
          .eq("is_active", true)
          .order("organization_name", { ascending: true });

        const resolved = resolveWorkspaceOrganization();

        if (context.organization_id || resolved.organization_id) {
          query = query.eq("organization_id", context.organization_id || resolved.organization_id);
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data) && data.length) {
          OrganizationState.organizations = data.map(normalizeOrganization);
          persistState();
          return OrganizationState.organizations;
        }

        if (error) {
          console.warn("[PHNX Organization] DB load fallback active:", error);
        }
      } catch (error) {
        console.warn("[PHNX Organization] DB exception fallback active:", error);
      }
    }

    OrganizationState.organizations = [buildFallbackOrganization(context)];
    persistState();

    return OrganizationState.organizations;
  }

  async function createOrganization(org = {}, options = {}) {
    const normalized = normalizeOrganization(org);

    const existingIndex = OrganizationState.organizations.findIndex(
      item => item.organization_id === normalized.organization_id
    );

    if (existingIndex >= 0) {
      OrganizationState.organizations[existingIndex] = {
        ...OrganizationState.organizations[existingIndex],
        ...normalized,
        updated_at: nowISO()
      };
    } else {
      OrganizationState.organizations.push({
        ...normalized,
        created_at: nowISO(),
        updated_at: nowISO()
      });
    }

    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { data, error } = await client
          .from("phnx_organizations")
          .upsert({
            organization_id: normalized.organization_id,
            organization_name: normalized.organization_name,
            organization_type: normalized.organization_type,
            organization_level: normalized.organization_level,
            organization_status: normalized.organization_status,
            is_active: normalized.is_active,
            city: normalized.city,
            state: normalized.state,
            country: normalized.country,
            location: normalized.location,
            website_url: normalized.website_url,
            primary_sport: normalized.primary_sport,
            supported_sports: normalized.supported_sports,
            governance_status: normalized.governance_status,
            verification_status: normalized.verification_status,
            metadata: normalized.metadata || {},
            updated_at: nowISO()
          }, {
            onConflict: "organization_id"
          })
          .select("*")
          .single();

        if (error) {
          return {
            ok: false,
            status: "ORGANIZATION_STORED_LOCALLY_DB_FAILED",
            error,
            organization: normalized
          };
        }

        const saved = normalizeOrganization(data);

        const index = OrganizationState.organizations.findIndex(
          item => item.organization_id === saved.organization_id
        );

        if (index >= 0) OrganizationState.organizations[index] = saved;

        persistState();

        return {
          ok: true,
          status: "ORGANIZATION_CREATED",
          organization: saved
        };
      } catch (error) {
        return {
          ok: false,
          status: "ORGANIZATION_STORED_LOCALLY_DB_EXCEPTION",
          error,
          organization: normalized
        };
      }
    }

    return {
      ok: true,
      status: "ORGANIZATION_CREATED_LOCAL",
      organization: normalized
    };
  }

  async function updateOrganization(organizationId, updates = {}, options = {}) {
    const index = OrganizationState.organizations.findIndex(
      item => item.organization_id === organizationId
    );

    if (index < 0) {
      return {
        ok: false,
        status: "ORGANIZATION_NOT_FOUND"
      };
    }

    const updated = normalizeOrganization({
      ...OrganizationState.organizations[index],
      ...updates,
      organization_id: organizationId,
      updated_at: nowISO()
    });

    OrganizationState.organizations[index] = updated;

    if (OrganizationState.active_organization?.organization_id === organizationId) {
      OrganizationState.active_organization = updated;
      OrganizationState.runtime = buildOrganizationRuntime(updated);
    }

    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { error } = await client
          .from("phnx_organizations")
          .update({
            organization_name: updated.organization_name,
            organization_type: updated.organization_type,
            organization_level: updated.organization_level,
            organization_status: updated.organization_status,
            is_active: updated.is_active,
            city: updated.city,
            state: updated.state,
            country: updated.country,
            location: updated.location,
            website_url: updated.website_url,
            primary_sport: updated.primary_sport,
            supported_sports: updated.supported_sports,
            governance_status: updated.governance_status,
            verification_status: updated.verification_status,
            metadata: updated.metadata || {},
            updated_at: nowISO()
          })
          .eq("organization_id", organizationId);

        if (error) {
          return {
            ok: false,
            status: "ORGANIZATION_UPDATED_LOCAL_DB_FAILED",
            error,
            organization: updated
          };
        }
      } catch (error) {
        return {
          ok: false,
          status: "ORGANIZATION_UPDATED_LOCAL_DB_EXCEPTION",
          error,
          organization: updated
        };
      }
    }

    return {
      ok: true,
      status: "ORGANIZATION_UPDATED",
      organization: updated
    };
  }

  async function archiveOrganization(organizationId, options = {}) {
    return updateOrganization(
      organizationId,
      {
        is_active: false,
        organization_status: "archived"
      },
      options
    );
  }

  function getOrganizations(filters = {}) {
    return clone(OrganizationState.organizations.filter(org => {
      if (filters.organization_type && org.organization_type !== normalizeOrganizationType(filters.organization_type)) return false;
      if (filters.organization_level && org.organization_level !== filters.organization_level) return false;
      if (filters.state && lower(org.state) !== lower(filters.state)) return false;
      if (filters.sport) {
        const sport = lower(filters.sport);
        const supported = (org.supported_sports || []).map(lower);
        if (lower(org.primary_sport) !== sport && !supported.includes(sport)) return false;
      }
      if (filters.active_only && !org.is_active) return false;
      return true;
    }));
  }

  function getOrganization(organizationId) {
    return clone(
      OrganizationState.organizations.find(org => org.organization_id === organizationId) ||
      null
    );
  }

  function getActiveOrganization() {
    return clone(OrganizationState.active_organization);
  }

  function setActiveOrganization(organizationOrId, options = {}) {
    const org =
      typeof organizationOrId === "string"
        ? OrganizationState.organizations.find(item => item.organization_id === organizationOrId)
        : normalizeOrganization(organizationOrId);

    if (!org) {
      return {
        ok: false,
        status: "ORGANIZATION_NOT_FOUND"
      };
    }

    OrganizationState.active_organization = org;
    OrganizationState.runtime = buildOrganizationRuntime(org);

    persistState();

    if (sessionEngine()?.refreshSession && !options.skip_session_refresh) {
      sessionEngine().refreshSession({
        organization_id: org.organization_id,
        organization_name: org.organization_name
      });
    }

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("phnx_active_organization_changed", {
        engine: ENGINE_ID,
        version: VERSION,
        organization_id: org.organization_id,
        organization_name: org.organization_name,
        changed_at: nowISO()
      });
    }

    if (!options.silent) {
      console.info("[PHNX Organization] Active organization:", OrganizationState.runtime);
    }

    return {
      ok: true,
      status: "ACTIVE_ORGANIZATION_SET",
      organization: org,
      runtime: OrganizationState.runtime
    };
  }

  function selectDefaultOrganization() {
    const requested =
      getParam("organization_id") ||
      getStorage(STORAGE_KEYS.activeOrganizationId) ||
      resolveWorkspaceOrganization().organization_id;

    if (requested) {
      const found = OrganizationState.organizations.find(org => org.organization_id === requested);
      if (found) return found;
    }

    return (
      OrganizationState.organizations.find(org => org.is_active) ||
      OrganizationState.organizations[0] ||
      null
    );
  }

  function getRuntime() {
    return clone(OrganizationState.runtime);
  }

  function buildOrganizationSummary() {
    return {
      total_organizations: OrganizationState.organizations.length,
      active_organization_id: OrganizationState.active_organization?.organization_id || null,
      active_organization_name: OrganizationState.active_organization?.organization_name || null,
      organization_types: [
        ...new Set(OrganizationState.organizations.map(org => org.organization_type).filter(Boolean))
      ],
      sports: [
        ...new Set(
          OrganizationState.organizations
            .flatMap(org => [org.primary_sport, ...(org.supported_sports || [])])
            .filter(Boolean)
        )
      ],
      generated_at: nowISO()
    };
  }

  function renderOrganizationBadge(container) {
    if (!container) return false;

    const org = OrganizationState.active_organization || {};
    const verified = ["verified", "active", "approved"].includes(lower(org.verification_status || org.organization_status));

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
        ">PHNX Organization</div>

        <div style="margin-top:6px;font-size:16px;font-weight:900;">
          ${org.organization_name || "No Active Organization"}
        </div>

        <div style="margin-top:4px;font-size:12px;color:#c9d8e8;">
          ${[org.organization_type, org.organization_level, org.location].filter(Boolean).join(" • ") || "Pending organization context"}
        </div>
      </div>
    `;

    return true;
  }

  function runHealthCheck() {
    return {
      ok: !!OrganizationState.initialized && !!OrganizationState.active_organization?.organization_id,
      engine_id: ENGINE_ID,
      version: VERSION,
      organization_count: OrganizationState.organizations.length,
      active_organization_id: OrganizationState.active_organization?.organization_id || null,
      active_organization_name: OrganizationState.active_organization?.organization_name || null,
      runtime_status: OrganizationState.runtime?.status || "UNKNOWN",
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_ORGANIZATION_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        organization: getActiveOrganization(),
        runtime: getRuntime()
      };
    }

    window.__PHNX_ORGANIZATION_ENGINE_V1__ = true;

    OrganizationState.initialized = true;
    OrganizationState.booted_at = OrganizationState.booted_at || nowISO();
    OrganizationState.updated_at = nowISO();

    expose();

    await loadOrganizations(context);

    const selected = selectDefaultOrganization();
    if (selected) {
      setActiveOrganization(selected, { silent: true, skip_session_refresh: true });
    } else {
      OrganizationState.runtime = buildOrganizationRuntime(null);
      persistState();
    }

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Organization] Engine online:", VERSION, buildOrganizationSummary());

    return {
      ok: true,
      status: "PHNX_ORGANIZATION_ENGINE_ONLINE",
      organization: getActiveOrganization(),
      runtime: getRuntime(),
      summary: buildOrganizationSummary()
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      loadOrganizations,

      createOrganization,
      updateOrganization,
      archiveOrganization,

      getOrganizations,
      getOrganization,
      getActiveOrganization,
      setActiveOrganization,

      getRuntime,
      buildOrganizationSummary,
      renderOrganizationBadge,
      runHealthCheck,

      getState: () => clone(OrganizationState)
    };

    window.PHNXOrganizationEngine = api;
    window.PHNX.OrganizationEngine = api;

    window.STATScoreOrganizationEngine = api;
    window.STATScore.OrganizationEngine = api;

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
