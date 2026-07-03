/* ============================================================
   PHNX OS™ Professional Identity Engine
   File: phnx-professional-identity-engine.js
   Version: PHNX-PROFESSIONAL-IDENTITY-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish and expose the permanent PHNX Professional Identity
   used by Professional Workspaces, STATS-CORE™, Multi-Box™,
   credential authority, dashboard runtime, receipts, and audit.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Professional Identity is permanent.
   Professional Workspaces are operational.
   One professional may own multiple workspaces.
   Receipts and audit follow the PHNX Professional Identity.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-professional-identity-engine";
  const VERSION = "PHNX-PROFESSIONAL-IDENTITY-ENGINE-V1";

  const STORAGE_KEYS = {
    professionalId: "phnx_professional_id",
    identity: "phnx_professional_identity",
    profile: "phnx_professional_profile",
    credentialStatus: "phnx_credential_status",
    identityRuntime: "phnx_identity_runtime"
  };

  const IdentityState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,
    professional_identity: null,
    identity_runtime: {
      professional_id: null,
      phnx_professional_id: null,
      display_name: null,
      email: null,
      identity_status: "pending_runtime",
      credential_status: "pending_runtime",
      source: "uninitialized"
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

  function makeProfessionalId(seed = "professional") {
    const base = lower(seed).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return "PHNX-PRO-" + (base || "ID") + "-" + Date.now().toString(36).toUpperCase();
  }

  function normalizeIdentity(identity = {}) {
    const professionalId =
      identity.professional_id ||
      identity.phnx_professional_id ||
      identity.id ||
      getParam("professional_id") ||
      getParam("phnx_professional_id") ||
      getStorage(STORAGE_KEYS.professionalId) ||
      getStorage("statscore_professional_id") ||
      getStorage("statscore_user_id") ||
      null;

    const displayName =
      identity.display_name ||
      identity.full_name ||
      identity.name ||
      identity.professional_name ||
      getStorage("phnx_professional_name") ||
      getStorage("statscore_sender_label") ||
      getStorage("sender_label") ||
      "PHNX Professional";

    return {
      professional_id: professionalId || makeProfessionalId(displayName),
      phnx_professional_id: professionalId || makeProfessionalId(displayName),

      display_name: displayName,
      first_name: identity.first_name || null,
      last_name: identity.last_name || null,

      email:
        identity.email ||
        getStorage("phnx_professional_email") ||
        getStorage("statscore_user_email") ||
        null,

      phone: identity.phone || null,

      identity_type: identity.identity_type || "professional",
      identity_status: identity.identity_status || identity.status || "active",

      credential_status:
        identity.credential_status ||
        getStorage(STORAGE_KEYS.credentialStatus) ||
        getStorage("statscore_credential_status") ||
        "pending_runtime",

      verification_status:
        identity.verification_status ||
        identity.identity_verification_status ||
        "pending_runtime",

      source:
        identity.source ||
        identity.created_source ||
        "runtime",

      source_record: identity.source_record || identity,
      loaded_at: nowISO()
    };
  }

  function buildFallbackIdentity(context = {}) {
    const professionalId =
      context.professional_id ||
      context.phnx_professional_id ||
      getParam("professional_id") ||
      getParam("phnx_professional_id") ||
      getStorage(STORAGE_KEYS.professionalId) ||
      getStorage("statscore_professional_id") ||
      getStorage("statscore_user_id") ||
      getParam("user_id") ||
      null;

    return normalizeIdentity({
      professional_id: professionalId,
      display_name:
        context.display_name ||
        context.professional_name ||
        getStorage("phnx_professional_name") ||
        getStorage("statscore_sender_label") ||
        getStorage("sender_label") ||
        "PHNX Professional",
      email: context.email || getStorage("phnx_professional_email") || null,
      credential_status:
        context.credential_status ||
        getStorage("statscore_credential_status") ||
        "pending_runtime",
      identity_status: "active",
      source: "fallback_runtime"
    });
  }

  function buildIdentityRuntime(identity) {
    return {
      engine_id: ENGINE_ID,
      version: VERSION,

      professional_id: identity?.professional_id || null,
      phnx_professional_id: identity?.phnx_professional_id || identity?.professional_id || null,
      display_name: identity?.display_name || null,
      email: identity?.email || null,

      identity_type: identity?.identity_type || "professional",
      identity_status: identity?.identity_status || "pending_runtime",
      credential_status: identity?.credential_status || "pending_runtime",
      verification_status: identity?.verification_status || "pending_runtime",

      source: identity?.source || "runtime",
      loaded_at: nowISO()
    };
  }

  function persistIdentity() {
    IdentityState.updated_at = nowISO();

    const identity = IdentityState.professional_identity;
    const runtime = IdentityState.identity_runtime;

    if (identity?.professional_id) {
      setSession(STORAGE_KEYS.professionalId, identity.professional_id);
      setSession("statscore_professional_id", identity.professional_id);
      setSession("statscore_user_id", identity.professional_id);
    }

    if (identity?.display_name) {
      setSession("phnx_professional_name", identity.display_name);
      setSession("statscore_sender_label", identity.display_name);
    }

    if (identity?.email) {
      setSession("phnx_professional_email", identity.email);
    }

    if (identity?.credential_status) {
      setSession(STORAGE_KEYS.credentialStatus, identity.credential_status);
      setSession("statscore_credential_status", identity.credential_status);
    }

    setSession(STORAGE_KEYS.identity, identity || {});
    setSession(STORAGE_KEYS.identityRuntime, runtime || {});

    window.PHNXProfessionalIdentityState = IdentityState;
    window.PHNXProfessionalIdentity = identity;
    window.STATScoreProfessionalIdentity = identity;

    return IdentityState;
  }

  async function loadIdentity(context = {}) {
    const cached = safeJSONParse(getStorage(STORAGE_KEYS.identity), null);

    if (cached?.professional_id && !context.force_reload) {
      const identity = normalizeIdentity(cached);
      IdentityState.professional_identity = identity;
      IdentityState.identity_runtime = buildIdentityRuntime(identity);
      persistIdentity();
      return identity;
    }

    const client = db();
    const professionalId =
      context.professional_id ||
      context.phnx_professional_id ||
      getParam("professional_id") ||
      getParam("phnx_professional_id") ||
      getStorage(STORAGE_KEYS.professionalId) ||
      getStorage("statscore_professional_id");

    /*
      Future platform table:
      phnx_professional_identities

      Expected columns:
      professional_id, phnx_professional_id, display_name, first_name,
      last_name, email, phone, identity_status, credential_status,
      verification_status, is_active, created_at
    */
    if (client && professionalId) {
      try {
        const { data, error } = await client
          .from("phnx_professional_identities")
          .select("*")
          .or(`professional_id.eq.${professionalId},phnx_professional_id.eq.${professionalId},id.eq.${professionalId}`)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const identity = normalizeIdentity({
            ...data,
            source: "phnx_professional_identities",
            source_record: data
          });

          IdentityState.professional_identity = identity;
          IdentityState.identity_runtime = buildIdentityRuntime(identity);
          persistIdentity();

          return identity;
        }
      } catch (error) {
        console.warn("[PHNX Professional Identity] DB identity fallback active:", error);
      }
    }

    const fallback = buildFallbackIdentity(context);
    IdentityState.professional_identity = fallback;
    IdentityState.identity_runtime = buildIdentityRuntime(fallback);
    persistIdentity();

    return fallback;
  }

  async function upsertIdentity(identity = {}) {
    const normalized = normalizeIdentity(identity);
    const client = db();

    if (!client) {
      IdentityState.professional_identity = normalized;
      IdentityState.identity_runtime = buildIdentityRuntime(normalized);
      persistIdentity();

      return {
        ok: true,
        status: "IDENTITY_STORED_LOCALLY",
        identity: normalized
      };
    }

    try {
      const { data, error } = await client
        .from("phnx_professional_identities")
        .upsert({
          professional_id: normalized.professional_id,
          phnx_professional_id: normalized.phnx_professional_id,
          display_name: normalized.display_name,
          first_name: normalized.first_name,
          last_name: normalized.last_name,
          email: normalized.email,
          phone: normalized.phone,
          identity_type: normalized.identity_type,
          identity_status: normalized.identity_status,
          credential_status: normalized.credential_status,
          verification_status: normalized.verification_status,
          updated_at: nowISO()
        }, {
          onConflict: "professional_id"
        })
        .select("*")
        .single();

      if (error) {
        console.warn("[PHNX Professional Identity] Identity upsert fallback:", error);

        IdentityState.professional_identity = normalized;
        IdentityState.identity_runtime = buildIdentityRuntime(normalized);
        persistIdentity();

        return {
          ok: false,
          status: "IDENTITY_UPSERT_FAILED_LOCAL_ACTIVE",
          error,
          identity: normalized
        };
      }

      const saved = normalizeIdentity({
        ...data,
        source: "phnx_professional_identities",
        source_record: data
      });

      IdentityState.professional_identity = saved;
      IdentityState.identity_runtime = buildIdentityRuntime(saved);
      persistIdentity();

      return {
        ok: true,
        status: "IDENTITY_UPSERTED",
        identity: saved
      };
    } catch (error) {
      IdentityState.professional_identity = normalized;
      IdentityState.identity_runtime = buildIdentityRuntime(normalized);
      persistIdentity();

      return {
        ok: false,
        status: "IDENTITY_UPSERT_EXCEPTION_LOCAL_ACTIVE",
        error,
        identity: normalized
      };
    }
  }

  function setIdentity(identity = {}) {
    const normalized = normalizeIdentity(identity);
    IdentityState.professional_identity = normalized;
    IdentityState.identity_runtime = buildIdentityRuntime(normalized);
    persistIdentity();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("professional_identity_changed", {
        engine: ENGINE_ID,
        version: VERSION,
        professional_id: normalized.professional_id,
        changed_at: nowISO()
      });
    }

    return {
      ok: true,
      status: "IDENTITY_SET",
      identity: normalized,
      runtime: IdentityState.identity_runtime
    };
  }

  function clearIdentity() {
    Object.values(STORAGE_KEYS).forEach(key => sessionStorage.removeItem(key));

    IdentityState.professional_identity = null;
    IdentityState.identity_runtime = buildIdentityRuntime(null);
    IdentityState.updated_at = nowISO();

    window.PHNXProfessionalIdentity = null;
    window.STATScoreProfessionalIdentity = null;

    return {
      ok: true,
      status: "IDENTITY_CLEARED"
    };
  }

  function getIdentity() {
    return clone(IdentityState.professional_identity);
  }

  function getRuntime() {
    return clone(IdentityState.identity_runtime);
  }

  function getProfessionalId() {
    return IdentityState.professional_identity?.professional_id || null;
  }

  function getDisplayName() {
    return IdentityState.professional_identity?.display_name || "PHNX Professional";
  }

  function getCredentialStatus() {
    return IdentityState.professional_identity?.credential_status || "pending_runtime";
  }

  function isIdentityVerified() {
    const identity = IdentityState.professional_identity || {};
    return ["verified", "active", "certified"].includes(lower(identity.verification_status || identity.identity_status));
  }

  function buildIdentitySummary() {
    const identity = IdentityState.professional_identity || {};
    return {
      professional_id: identity.professional_id || null,
      phnx_professional_id: identity.phnx_professional_id || identity.professional_id || null,
      display_name: identity.display_name || null,
      identity_status: identity.identity_status || "pending_runtime",
      credential_status: identity.credential_status || "pending_runtime",
      verification_status: identity.verification_status || "pending_runtime",
      verified: isIdentityVerified(),
      generated_at: nowISO()
    };
  }

  function renderIdentityBadge(container) {
    if (!container) return false;

    const identity = IdentityState.professional_identity || {};
    const verified = isIdentityVerified();

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
        ">PHNX Professional Identity</div>

        <div style="margin-top:6px;font-size:16px;font-weight:900;">
          ${identity.display_name || "PHNX Professional"}
        </div>

        <div style="margin-top:4px;font-size:12px;color:#c9d8e8;">
          ${identity.phnx_professional_id || identity.professional_id || "Pending PHNX ID"}
        </div>

        <div style="
          margin-top:8px;
          font-size:10px;
          color:${verified ? "#37d67a" : "#ffb100"};
          text-transform:uppercase;
          letter-spacing:.12em;
          font-weight:900;
        ">
          ${verified ? "Verified Identity" : "Pending Verification"}
        </div>
      </div>
    `;

    return true;
  }

  function runHealthCheck() {
    return {
      ok: !!IdentityState.initialized && !!IdentityState.professional_identity?.professional_id,
      engine_id: ENGINE_ID,
      version: VERSION,
      professional_loaded: !!IdentityState.professional_identity,
      professional_id: IdentityState.professional_identity?.professional_id || null,
      identity_status: IdentityState.professional_identity?.identity_status || "pending_runtime",
      credential_status: IdentityState.professional_identity?.credential_status || "pending_runtime",
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_PROFESSIONAL_IDENTITY_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        identity: getIdentity(),
        runtime: getRuntime()
      };
    }

    window.__PHNX_PROFESSIONAL_IDENTITY_ENGINE_V1__ = true;

    IdentityState.initialized = true;
    IdentityState.booted_at = IdentityState.booted_at || nowISO();
    IdentityState.updated_at = nowISO();

    expose();

    const identity = await loadIdentity(context);

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Professional Identity] Engine online:", VERSION, identity);

    return {
      ok: true,
      status: "PHNX_PROFESSIONAL_IDENTITY_ONLINE",
      identity,
      runtime: getRuntime()
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      loadIdentity,
      upsertIdentity,
      setIdentity,
      clearIdentity,

      getIdentity,
      getRuntime,
      getProfessionalId,
      getDisplayName,
      getCredentialStatus,
      isIdentityVerified,
      buildIdentitySummary,

      renderIdentityBadge,
      runHealthCheck,

      getState: () => clone(IdentityState)
    };

    window.PHNXProfessionalIdentityEngine = api;
    window.PHNX.ProfessionalIdentityEngine = api;

    /*
      STATS-CORE compatibility aliases.
    */
    window.STATScoreProfessionalIdentityEngine = api;
    window.STATScore.ProfessionalIdentityEngine = api;

    persistIdentity();

    return api;
  }

  expose();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})(); 
