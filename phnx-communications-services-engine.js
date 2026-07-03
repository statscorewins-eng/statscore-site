/* ============================================================
   PHNX OS™ Communication Services Engine
   File: phnx-communication-services-engine.js
   Version: PHNX-COMMUNICATION-SERVICES-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish shared platform communication services for PHNX OS™,
   STATS-CORE™, Multi-Box™, notifications, receipts, workspace
   messaging, application messaging, delivery tracking, and future
   PHNX applications.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Communication Services provide platform transport.
   Multi-Box™ provides governed STATS-CORE communication UX.
   Receipts preserve accountability.
   Notifications signal awareness.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-communication-services-engine";
  const VERSION = "PHNX-COMMUNICATION-SERVICES-ENGINE-V1";

  const STORAGE_KEYS = {
    messages: "phnx_platform_messages",
    outbox: "phnx_platform_outbox",
    inbox: "phnx_platform_inbox",
    runtime: "phnx_communication_runtime"
  };

  const CommunicationState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,

    messages: [],
    inbox: [],
    outbox: [],

    runtime: {
      professional_id: null,
      workspace_id: null,
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

  function uuid(prefix = "PHNX-MSG") {
    return (
      prefix +
      "-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 8).toUpperCase()
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

  function sessionEngine() {
    return window.PHNXSessionEngine || window.PHNX?.SessionEngine || null;
  }

  function workspaceRuntime() {
    return window.PHNXWorkspaceRuntime || window.PHNX?.WorkspaceRuntime || null;
  }

  function credentialEngine() {
    return window.PHXNCredentialAuthorityEngine || window.PHNX?.CredentialAuthorityEngine || null;
  }

  function notificationEngine() {
    return window.PHNXNotificationEngine || window.PHNX?.NotificationEngine || null;
  }

  function resolveRuntime(context = {}) {
    const session =
      sessionEngine()?.getSessionContext?.() ||
      window.PHNXSessionState ||
      {};

    const workspace =
      workspaceRuntime()?.getRuntime?.() ||
      window.STATScoreWorkspaceRuntime ||
      {};

    return {
      professional_id:
        context.professional_id ||
        session.professional_id ||
        workspace.professional_id ||
        getStorage("phnx_professional_id") ||
        getStorage("statscore_professional_id") ||
        getStorage("statscore_user_id") ||
        null,

      workspace_id:
        context.workspace_id ||
        session.workspace_id ||
        workspace.workspace_id ||
        getStorage("phnx_active_workspace_id") ||
        null,

      workspace_name:
        context.workspace_name ||
        session.workspace_name ||
        workspace.workspace_name ||
        null,

      organization_id:
        context.organization_id ||
        session.organization_id ||
        workspace.organization_id ||
        getStorage("phnx_organization_id") ||
        null,

      role:
        context.role ||
        session.role ||
        workspace.role ||
        getStorage("statscore_role") ||
        null,

      application:
        context.application ||
        session.application ||
        workspace.application ||
        getStorage("phnx_active_application") ||
        "STATS-CORE"
    };
  }

  function normalizeMessage(input = {}, context = {}) {
    const runtime = resolveRuntime(context);

    return {
      message_id:
        input.message_id ||
        input.id ||
        uuid(),

      source_system:
        input.source_system ||
        input.source ||
        "PHNX Communication Services",

      application:
        input.application ||
        runtime.application ||
        "STATS-CORE",

      channel:
        lower(input.channel || "platform"),

      message_type:
        lower(input.message_type || input.type || "platform_message"),

      status:
        lower(input.status || "draft"),

      priority:
        lower(input.priority || "standard"),

      sender_professional_id:
        input.sender_professional_id ||
        input.sender_user_id ||
        runtime.professional_id ||
        null,

      sender_workspace_id:
        input.sender_workspace_id ||
        runtime.workspace_id ||
        null,

      sender_label:
        input.sender_label ||
        runtime.workspace_name ||
        runtime.role ||
        "PHNX Sender",

      sender_role:
        input.sender_role ||
        runtime.role ||
        null,

      target_professional_id:
        input.target_professional_id ||
        input.target_user_id ||
        input.recipient_professional_id ||
        null,

      target_workspace_id:
        input.target_workspace_id ||
        input.recipient_workspace_id ||
        null,

      target_role:
        input.target_role ||
        input.recipient_role ||
        null,

      target_label:
        input.target_label ||
        input.target_recipient_label ||
        input.recipient_label ||
        "PHNX Recipient",

      subject:
        input.subject ||
        "PHNX Communication",

      body:
        input.body ||
        input.message ||
        "",

      route:
        input.route ||
        null,

      delivery_status:
        lower(input.delivery_status || "pending"),

      read_status:
        lower(input.read_status || "unread"),

      receipt_required:
        input.receipt_required !== false,

      receipt_id:
        input.receipt_id ||
        null,

      related_record_id:
        input.related_record_id ||
        input.record_id ||
        null,

      created_at:
        input.created_at ||
        nowISO(),

      sent_at:
        input.sent_at ||
        null,

      delivered_at:
        input.delivered_at ||
        null,

      read_at:
        input.read_at ||
        null,

      archived_at:
        input.archived_at ||
        null,

      metadata: {
        ...(input.metadata || {}),
        runtime,
        normalized_at: nowISO()
      }
    };
  }

  function persistState() {
    CommunicationState.updated_at = nowISO();

    CommunicationState.inbox = CommunicationState.messages.filter(
      msg =>
        msg.target_professional_id === CommunicationState.runtime.professional_id ||
        msg.target_workspace_id === CommunicationState.runtime.workspace_id
    );

    CommunicationState.outbox = CommunicationState.messages.filter(
      msg =>
        msg.sender_professional_id === CommunicationState.runtime.professional_id ||
        msg.sender_workspace_id === CommunicationState.runtime.workspace_id
    );

    setSession(STORAGE_KEYS.messages, CommunicationState.messages);
    setSession(STORAGE_KEYS.inbox, CommunicationState.inbox);
    setSession(STORAGE_KEYS.outbox, CommunicationState.outbox);
    setSession(STORAGE_KEYS.runtime, CommunicationState.runtime);

    window.PHNXCommunicationServicesState = CommunicationState;
    window.STATScoreCommunicationServicesState = CommunicationState;

    return CommunicationState;
  }

  function sortMessages(messages) {
    return [...messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async function loadMessages(context = {}) {
    const runtime = resolveRuntime(context);

    CommunicationState.runtime = {
      ...runtime,
      status: "LOADING",
      loaded_at: nowISO()
    };

    const cached = safeJSONParse(getStorage(STORAGE_KEYS.messages), null);

    if (Array.isArray(cached) && cached.length && !context.force_reload) {
      CommunicationState.messages = sortMessages(
        cached.map(msg => normalizeMessage(msg, runtime))
      );

      CommunicationState.runtime.status = "LOADED_FROM_CACHE";
      persistState();

      return CommunicationState.messages;
    }

    const client = db();

    /*
      Platform table:
      phnx_platform_messages

      Expected columns:
      message_id, source_system, application, channel, message_type,
      status, priority, sender_professional_id, sender_workspace_id,
      sender_label, sender_role, target_professional_id,
      target_workspace_id, target_role, target_label, subject, body,
      route, delivery_status, read_status, receipt_required,
      receipt_id, related_record_id, created_at, sent_at, delivered_at,
      read_at, archived_at, metadata
    */
    if (client && (runtime.professional_id || runtime.workspace_id)) {
      try {
        const professionalId = runtime.professional_id || "__none__";
        const workspaceId = runtime.workspace_id || "__none__";

        const { data, error } = await client
          .from("phnx_platform_messages")
          .select("*")
          .or(
            `sender_professional_id.eq.${professionalId},target_professional_id.eq.${professionalId},sender_workspace_id.eq.${workspaceId},target_workspace_id.eq.${workspaceId}`
          )
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(context.limit || 100);

        if (!error && Array.isArray(data)) {
          CommunicationState.messages = sortMessages(
            data.map(msg => normalizeMessage(msg, runtime))
          );

          CommunicationState.runtime.status = "LOADED_FROM_DATABASE";
          persistState();

          return CommunicationState.messages;
        }

        if (error) {
          console.warn("[PHNX Communication Services] DB load fallback active:", error);
        }
      } catch (error) {
        console.warn("[PHNX Communication Services] DB exception fallback active:", error);
      }
    }

    CommunicationState.messages = [];
    CommunicationState.runtime.status = "READY_EMPTY";
    persistState();

    return CommunicationState.messages;
  }

  function canSend(message = {}, context = {}) {
    if (credentialEngine()?.canSendMultiBoxMessage) {
      return credentialEngine().canSendMultiBoxMessage(message, context);
    }

    return {
      allowed: true,
      status: "RUNTIME_COMMUNICATION_ALLOWED",
      reason: "Credential Authority unavailable; runtime communication fallback active."
    };
  }

  async function saveDraft(input = {}, options = {}) {
    const draft = normalizeMessage(
      {
        ...input,
        status: "draft",
        delivery_status: "not_sent",
        read_status: "unread"
      },
      options
    );

    CommunicationState.messages.unshift(draft);
    CommunicationState.messages = sortMessages(CommunicationState.messages);
    persistState();

    await persistMessageToDB(draft, options);

    return {
      ok: true,
      status: "DRAFT_SAVED",
      message: draft
    };
  }

  async function sendMessage(input = {}, options = {}) {
    const message = normalizeMessage(
      {
        ...input,
        status: "sent",
        delivery_status: "sent",
        sent_at: nowISO()
      },
      options
    );

    const authority = canSend(message, options);

    if (!authority.allowed) {
      const blocked = normalizeMessage(
        {
          ...message,
          status: "blocked",
          delivery_status: "blocked",
          metadata: {
            ...(message.metadata || {}),
            authority
          }
        },
        options
      );

      CommunicationState.messages.unshift(blocked);
      CommunicationState.messages = sortMessages(CommunicationState.messages);
      persistState();

      return {
        ok: false,
        status: "MESSAGE_BLOCKED",
        reason: authority.reason,
        authority,
        message: blocked
      };
    }

    CommunicationState.messages.unshift(message);
    CommunicationState.messages = sortMessages(CommunicationState.messages);
    persistState();

    const dbResult = await persistMessageToDB(message, options);

    await createLinkedNotification(message, options);

    emitCommunicationEvent("phnx_message_sent", message);

    return {
      ok: true,
      status: "MESSAGE_SENT",
      message,
      authority,
      db: dbResult
    };
  }

  async function broadcastMessage(input = {}, options = {}) {
    return sendMessage(
      {
        ...input,
        target_professional_id: null,
        target_workspace_id: input.target_workspace_id || null,
        target_label: input.target_label || "Broadcast Audience",
        message_type: input.message_type || "broadcast",
        metadata: {
          ...(input.metadata || {}),
          is_broadcast: true
        }
      },
      {
        ...options,
        is_broadcast: true
      }
    );
  }

  async function persistMessageToDB(message, options = {}) {
    const client = db();

    if (!client || options.persist === false) {
      return {
        ok: false,
        status: "NO_DB_PERSISTENCE"
      };
    }

    try {
      const { data, error } = await client
        .from("phnx_platform_messages")
        .upsert({
          message_id: message.message_id,
          source_system: message.source_system,
          application: message.application,
          channel: message.channel,
          message_type: message.message_type,
          status: message.status,
          priority: message.priority,
          sender_professional_id: message.sender_professional_id,
          sender_workspace_id: message.sender_workspace_id,
          sender_label: message.sender_label,
          sender_role: message.sender_role,
          target_professional_id: message.target_professional_id,
          target_workspace_id: message.target_workspace_id,
          target_role: message.target_role,
          target_label: message.target_label,
          subject: message.subject,
          body: message.body,
          route: message.route,
          delivery_status: message.delivery_status,
          read_status: message.read_status,
          receipt_required: message.receipt_required,
          receipt_id: message.receipt_id,
          related_record_id: message.related_record_id,
          created_at: message.created_at,
          sent_at: message.sent_at,
          delivered_at: message.delivered_at,
          read_at: message.read_at,
          archived_at: message.archived_at,
          metadata: message.metadata || {}
        }, {
          onConflict: "message_id"
        })
        .select("*")
        .single();

      if (error) {
        return {
          ok: false,
          status: "MESSAGE_DB_PERSIST_FAILED",
          error
        };
      }

      return {
        ok: true,
        status: "MESSAGE_DB_PERSISTED",
        data
      };
    } catch (error) {
      return {
        ok: false,
        status: "MESSAGE_DB_PERSIST_EXCEPTION",
        error
      };
    }
  }

  async function createLinkedNotification(message, options = {}) {
    if (!notificationEngine()?.createNotification) return null;

    return notificationEngine().createNotification(
      {
        professional_id: message.target_professional_id,
        workspace_id: message.target_workspace_id,
        application: message.application,
        source_system: "PHNX Communication Services",
        notification_type: "message_received",
        priority: message.priority,
        title: message.subject,
        message: `New message from ${message.sender_label || "PHNX Sender"}`,
        route: message.route,
        related_record_id: message.message_id,
        action_label: "Open Message"
      },
      options
    );
  }

  async function markDelivered(messageId, options = {}) {
    return updateMessageStatus(
      messageId,
      {
        delivery_status: "delivered",
        delivered_at: nowISO()
      },
      options
    );
  }

  async function markRead(messageId, options = {}) {
    return updateMessageStatus(
      messageId,
      {
        read_status: "read",
        read_at: nowISO()
      },
      options
    );
  }

  async function archiveMessage(messageId, options = {}) {
    return updateMessageStatus(
      messageId,
      {
        status: "archived",
        archived_at: nowISO()
      },
      options
    );
  }

  async function updateMessageStatus(messageId, updates = {}, options = {}) {
    const index = CommunicationState.messages.findIndex(
      msg => msg.message_id === messageId
    );

    if (index < 0) {
      return {
        ok: false,
        status: "MESSAGE_NOT_FOUND"
      };
    }

    CommunicationState.messages[index] = {
      ...CommunicationState.messages[index],
      ...updates,
      metadata: {
        ...(CommunicationState.messages[index].metadata || {}),
        updated_at: nowISO()
      }
    };

    const message = CommunicationState.messages[index];

    persistState();
    await persistMessageToDB(message, options);

    emitCommunicationEvent("phnx_message_updated", message);

    return {
      ok: true,
      status: "MESSAGE_UPDATED",
      message
    };
  }

  function getMessages(filters = {}) {
    return clone(CommunicationState.messages.filter(msg => {
      if (filters.status && msg.status !== lower(filters.status)) return false;
      if (filters.channel && msg.channel !== lower(filters.channel)) return false;
      if (filters.message_type && msg.message_type !== lower(filters.message_type)) return false;
      if (filters.application && msg.application !== filters.application) return false;
      if (filters.sender_workspace_id && msg.sender_workspace_id !== filters.sender_workspace_id) return false;
      if (filters.target_workspace_id && msg.target_workspace_id !== filters.target_workspace_id) return false;
      if (filters.unread_only && msg.read_status !== "unread") return false;
      if (filters.active_only && msg.archived_at) return false;
      return true;
    }));
  }

  function getInbox(filters = {}) {
    return getMessages({
      ...filters,
      target_workspace_id: filters.target_workspace_id || CommunicationState.runtime.workspace_id,
      active_only: true
    });
  }

  function getOutbox(filters = {}) {
    return getMessages({
      ...filters,
      sender_workspace_id: filters.sender_workspace_id || CommunicationState.runtime.workspace_id,
      active_only: true
    });
  }

  function buildCommunicationSummary() {
    const all = CommunicationState.messages;

    return {
      total: all.length,
      inbox: getInbox().length,
      outbox: getOutbox().length,
      drafts: all.filter(msg => msg.status === "draft").length,
      sent: all.filter(msg => msg.status === "sent").length,
      blocked: all.filter(msg => msg.status === "blocked").length,
      unread: all.filter(msg => msg.read_status === "unread").length,
      application: CommunicationState.runtime.application,
      workspace_id: CommunicationState.runtime.workspace_id,
      generated_at: nowISO()
    };
  }

  function emitCommunicationEvent(eventName, message) {
    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(eventName, {
        engine: ENGINE_ID,
        version: VERSION,
        message_id: message.message_id,
        status: message.status,
        channel: message.channel,
        application: message.application,
        emitted_at: nowISO()
      });
    }
  }

  function renderCommunicationBadge(container) {
    if (!container) return false;

    const summary = buildCommunicationSummary();

    container.innerHTML = `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:8px;
        border:1px solid rgba(0,229,255,.45);
        background:rgba(0,0,0,.35);
        color:#f4f4ef;
        font-family:Arial,Helvetica,sans-serif;
        padding:8px 12px;
        font-size:12px;
        font-weight:900;
        letter-spacing:.08em;
        text-transform:uppercase;
      ">
        <span>PHNX Communication</span>
        <span style="color:#00e5ff;">${summary.total}</span>
      </div>
    `;

    return true;
  }

  function runHealthCheck() {
    return {
      ok: !!CommunicationState.initialized,
      engine_id: ENGINE_ID,
      version: VERSION,
      message_count: CommunicationState.messages.length,
      inbox_count: getInbox().length,
      outbox_count: getOutbox().length,
      runtime_status: CommunicationState.runtime.status,
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_COMMUNICATION_SERVICES_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        summary: buildCommunicationSummary()
      };
    }

    window.__PHNX_COMMUNICATION_SERVICES_ENGINE_V1__ = true;

    CommunicationState.initialized = true;
    CommunicationState.booted_at = CommunicationState.booted_at || nowISO();
    CommunicationState.updated_at = nowISO();

    expose();

    CommunicationState.runtime = {
      ...resolveRuntime(context),
      status: "ONLINE",
      loaded_at: nowISO()
    };

    await loadMessages(context);

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Communication Services] Engine online:", VERSION, buildCommunicationSummary());

    return {
      ok: true,
      status: "PHNX_COMMUNICATION_SERVICES_ENGINE_ONLINE",
      summary: buildCommunicationSummary(),
      runtime: clone(CommunicationState.runtime)
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      loadMessages,

      saveDraft,
      sendMessage,
      broadcastMessage,

      markDelivered,
      markRead,
      archiveMessage,

      getMessages,
      getInbox,
      getOutbox,

      buildCommunicationSummary,
      renderCommunicationBadge,
      runHealthCheck,

      getState: () => clone(CommunicationState)
    };

    window.PHNXCommunicationServicesEngine = api;
    window.PHNX.CommunicationServicesEngine = api;

    window.STATScorePlatformCommunicationEngine = api;
    window.STATScore.PlatformCommunicationEngine = api;

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
