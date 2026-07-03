/* ============================================================
   PHNX OS™ Notification Engine
   File: phnx-notification-engine.js
   Version: PHNX-NOTIFICATION-ENGINE-V1

   Layer:
   PHNX Platform Layer

   Lead Establishment Stream:
   STATS-CORE Stream 6 — Communication & Governance

   Purpose:
   Establish shared notification creation, routing, persistence,
   display, and unread-state management for PHNX Platform,
   STATS-CORE™, Multi-Box™, dashboards, credential authority,
   workspace events, and future PHNX applications.

   Core Doctrine:
   Governance defines.
   Platform provides.
   Applications deliver.

   Notifications are platform-level awareness signals.
   Multi-Box is governed communication.
   Receipts preserve accountability.
   Notifications do not replace receipts.
============================================================ */

(function () {
  "use strict";

  window.PHNX = window.PHNX || {};
  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "phnx-notification-engine";
  const VERSION = "PHNX-NOTIFICATION-ENGINE-V1";

  const STORAGE_KEYS = {
    notifications: "phnx_notifications",
    unreadCount: "phnx_notification_unread_count",
    runtime: "phnx_notification_runtime"
  };

  const NotificationState = {
    initialized: false,
    engine_id: ENGINE_ID,
    version: VERSION,
    booted_at: null,
    updated_at: null,
    notifications: [],
    unread_count: 0,
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

  function identityEngine() {
    return window.PHNXProfessionalIdentityEngine || window.PHNX?.ProfessionalIdentityEngine || null;
  }

  function uuid(prefix = "PHNX-NOTICE") {
    return prefix + "-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
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

    const professionalId =
      context.professional_id ||
      session.professional_id ||
      workspace.professional_id ||
      identityEngine()?.getProfessionalId?.() ||
      getStorage("phnx_professional_id") ||
      getStorage("statscore_professional_id") ||
      getStorage("statscore_user_id") ||
      null;

    return {
      professional_id: professionalId,
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

      role:
        context.role ||
        session.role ||
        workspace.role ||
        getStorage("statscore_role") ||
        null,

      organization_id:
        context.organization_id ||
        session.organization_id ||
        workspace.organization_id ||
        getStorage("phnx_organization_id") ||
        null,

      application:
        context.application ||
        session.application ||
        workspace.application ||
        getStorage("phnx_active_application") ||
        "STATS-CORE"
    };
  }

  function normalizeNotification(input = {}, context = {}) {
    const runtime = resolveRuntime(context);

    return {
      notification_id:
        input.notification_id ||
        input.id ||
        uuid(),

      professional_id:
        input.professional_id ||
        runtime.professional_id ||
        null,

      workspace_id:
        input.workspace_id ||
        runtime.workspace_id ||
        null,

      organization_id:
        input.organization_id ||
        runtime.organization_id ||
        null,

      application:
        input.application ||
        runtime.application ||
        "STATS-CORE",

      source_system:
        input.source_system ||
        input.source ||
        "PHNX Platform",

      notification_type:
        lower(input.notification_type || input.type || "system_notice"),

      priority:
        lower(input.priority || "standard"),

      status:
        lower(input.status || "unread"),

      title:
        input.title ||
        "PHNX Notification",

      message:
        input.message ||
        input.body ||
        "",

      route:
        input.route ||
        input.url ||
        null,

      action_label:
        input.action_label ||
        null,

      action_payload:
        input.action_payload ||
        {},

      related_record_id:
        input.related_record_id ||
        input.record_id ||
        null,

      created_at:
        input.created_at ||
        nowISO(),

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

  function sortNotifications(list) {
    return [...list].sort((a, b) => {
      const priorityRank = { urgent: 4, high: 3, standard: 2, low: 1 };
      const pa = priorityRank[lower(a.priority)] || 2;
      const pb = priorityRank[lower(b.priority)] || 2;

      if (pb !== pa) return pb - pa;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  function recalcUnread() {
    NotificationState.unread_count = NotificationState.notifications.filter(
      n => lower(n.status) === "unread"
    ).length;

    return NotificationState.unread_count;
  }

  function persistState() {
    NotificationState.updated_at = nowISO();
    recalcUnread();

    setSession(STORAGE_KEYS.notifications, NotificationState.notifications);
    setSession(STORAGE_KEYS.unreadCount, String(NotificationState.unread_count));
    setSession(STORAGE_KEYS.runtime, NotificationState.runtime);

    window.PHNXNotificationState = NotificationState;
    window.STATScoreNotificationState = NotificationState;

    return NotificationState;
  }

  async function loadNotifications(context = {}) {
    const runtime = resolveRuntime(context);

    NotificationState.runtime = {
      ...runtime,
      status: "LOADING",
      loaded_at: nowISO()
    };

    const cached = safeJSONParse(getStorage(STORAGE_KEYS.notifications), null);

    if (Array.isArray(cached) && cached.length && !context.force_reload) {
      NotificationState.notifications = sortNotifications(
        cached.map(n => normalizeNotification(n, runtime))
      );

      NotificationState.runtime.status = "LOADED_FROM_CACHE";
      persistState();

      return NotificationState.notifications;
    }

    const client = db();

    /*
      Platform table:
      phnx_notifications

      Expected columns:
      notification_id, professional_id, workspace_id,
      organization_id, application, source_system, notification_type,
      priority, status, title, message, route, action_label,
      action_payload, related_record_id, created_at, read_at,
      archived_at, metadata
    */
    if (client && runtime.professional_id) {
      try {
        let query = client
          .from("phnx_notifications")
          .select("*")
          .eq("professional_id", runtime.professional_id)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(context.limit || 50);

        if (runtime.workspace_id && !context.all_workspaces) {
          query = query.or(`workspace_id.eq.${runtime.workspace_id},workspace_id.is.null`);
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data)) {
          NotificationState.notifications = sortNotifications(
            data.map(n => normalizeNotification(n, runtime))
          );

          NotificationState.runtime.status = "LOADED_FROM_DATABASE";
          persistState();

          return NotificationState.notifications;
        }

        if (error) {
          console.warn("[PHNX Notification] DB load fallback active:", error);
        }
      } catch (error) {
        console.warn("[PHNX Notification] DB exception fallback active:", error);
      }
    }

    NotificationState.notifications = [];
    NotificationState.runtime.status = "READY_EMPTY";
    persistState();

    return NotificationState.notifications;
  }

  async function createNotification(input = {}, options = {}) {
    const notice = normalizeNotification(input, options);

    NotificationState.notifications.unshift(notice);
    NotificationState.notifications = sortNotifications(NotificationState.notifications);
    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { data, error } = await client
          .from("phnx_notifications")
          .upsert({
            notification_id: notice.notification_id,
            professional_id: notice.professional_id,
            workspace_id: notice.workspace_id,
            organization_id: notice.organization_id,
            application: notice.application,
            source_system: notice.source_system,
            notification_type: notice.notification_type,
            priority: notice.priority,
            status: notice.status,
            title: notice.title,
            message: notice.message,
            route: notice.route,
            action_label: notice.action_label,
            action_payload: notice.action_payload || {},
            related_record_id: notice.related_record_id,
            created_at: notice.created_at,
            read_at: notice.read_at,
            archived_at: notice.archived_at,
            metadata: notice.metadata || {}
          }, {
            onConflict: "notification_id"
          })
          .select("*")
          .single();

        if (error) {
          return {
            ok: false,
            status: "NOTIFICATION_STORED_LOCALLY_DB_FAILED",
            error,
            notification: notice
          };
        }

        const saved = normalizeNotification(data, options);
        const index = NotificationState.notifications.findIndex(
          n => n.notification_id === saved.notification_id
        );

        if (index >= 0) NotificationState.notifications[index] = saved;
        persistState();

        return {
          ok: true,
          status: "NOTIFICATION_CREATED",
          notification: saved
        };
      } catch (error) {
        return {
          ok: false,
          status: "NOTIFICATION_STORED_LOCALLY_DB_EXCEPTION",
          error,
          notification: notice
        };
      }
    }

    emitNoticeCreated(notice);

    return {
      ok: true,
      status: "NOTIFICATION_CREATED_LOCAL",
      notification: notice
    };
  }

  function emitNoticeCreated(notice) {
    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("phnx_notification_created", {
        engine: ENGINE_ID,
        version: VERSION,
        notification_id: notice.notification_id,
        type: notice.notification_type,
        priority: notice.priority,
        created_at: nowISO()
      });
    }
  }

  async function markRead(notificationId, options = {}) {
    const notice = NotificationState.notifications.find(n => n.notification_id === notificationId);

    if (!notice) {
      return {
        ok: false,
        status: "NOTIFICATION_NOT_FOUND"
      };
    }

    notice.status = "read";
    notice.read_at = nowISO();

    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { error } = await client
          .from("phnx_notifications")
          .update({
            status: "read",
            read_at: notice.read_at
          })
          .eq("notification_id", notificationId);

        if (error) {
          return {
            ok: false,
            status: "NOTIFICATION_READ_LOCAL_DB_FAILED",
            error,
            notification: notice
          };
        }
      } catch (error) {
        return {
          ok: false,
          status: "NOTIFICATION_READ_LOCAL_DB_EXCEPTION",
          error,
          notification: notice
        };
      }
    }

    return {
      ok: true,
      status: "NOTIFICATION_MARKED_READ",
      notification: notice
    };
  }

  async function markAllRead(options = {}) {
    const unread = NotificationState.notifications.filter(n => lower(n.status) === "unread");

    unread.forEach(n => {
      n.status = "read";
      n.read_at = nowISO();
    });

    persistState();

    const client = db();

    if (client && options.persist !== false && unread.length) {
      try {
        const ids = unread.map(n => n.notification_id);

        const { error } = await client
          .from("phnx_notifications")
          .update({
            status: "read",
            read_at: nowISO()
          })
          .in("notification_id", ids);

        if (error) {
          return {
            ok: false,
            status: "NOTIFICATIONS_READ_LOCAL_DB_FAILED",
            error,
            count: unread.length
          };
        }
      } catch (error) {
        return {
          ok: false,
          status: "NOTIFICATIONS_READ_LOCAL_DB_EXCEPTION",
          error,
          count: unread.length
        };
      }
    }

    return {
      ok: true,
      status: "ALL_NOTIFICATIONS_MARKED_READ",
      count: unread.length
    };
  }

  async function archiveNotification(notificationId, options = {}) {
    const notice = NotificationState.notifications.find(n => n.notification_id === notificationId);

    if (!notice) {
      return {
        ok: false,
        status: "NOTIFICATION_NOT_FOUND"
      };
    }

    notice.status = "archived";
    notice.archived_at = nowISO();

    persistState();

    const client = db();

    if (client && options.persist !== false) {
      try {
        const { error } = await client
          .from("phnx_notifications")
          .update({
            status: "archived",
            archived_at: notice.archived_at
          })
          .eq("notification_id", notificationId);

        if (error) {
          return {
            ok: false,
            status: "NOTIFICATION_ARCHIVED_LOCAL_DB_FAILED",
            error,
            notification: notice
          };
        }
      } catch (error) {
        return {
          ok: false,
          status: "NOTIFICATION_ARCHIVED_LOCAL_DB_EXCEPTION",
          error,
          notification: notice
        };
      }
    }

    return {
      ok: true,
      status: "NOTIFICATION_ARCHIVED",
      notification: notice
    };
  }

  function getNotifications(filters = {}) {
    return clone(NotificationState.notifications.filter(n => {
      if (filters.status && lower(n.status) !== lower(filters.status)) return false;
      if (filters.priority && lower(n.priority) !== lower(filters.priority)) return false;
      if (filters.type && lower(n.notification_type) !== lower(filters.type)) return false;
      if (filters.application && n.application !== filters.application) return false;
      if (filters.workspace_id && n.workspace_id !== filters.workspace_id) return false;
      if (filters.unread_only && lower(n.status) !== "unread") return false;
      if (filters.active_only && n.archived_at) return false;
      return true;
    }));
  }

  function getUnreadCount() {
    return recalcUnread();
  }

  function buildNotificationSummary() {
    const all = NotificationState.notifications;

    return {
      total: all.length,
      unread: all.filter(n => lower(n.status) === "unread").length,
      read: all.filter(n => lower(n.status) === "read").length,
      archived: all.filter(n => lower(n.status) === "archived").length,
      urgent: all.filter(n => lower(n.priority) === "urgent").length,
      high: all.filter(n => lower(n.priority) === "high").length,
      application: NotificationState.runtime.application || "STATS-CORE",
      workspace_id: NotificationState.runtime.workspace_id || null,
      generated_at: nowISO()
    };
  }

  function renderNotificationBadge(container) {
    if (!container) return false;

    const count = getUnreadCount();

    container.innerHTML = `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:8px;
        border:1px solid ${count ? "rgba(255,177,0,.75)" : "rgba(55,214,122,.55)"};
        background:rgba(0,0,0,.35);
        color:#f4f4ef;
        font-family:Arial,Helvetica,sans-serif;
        padding:8px 12px;
        font-size:12px;
        font-weight:900;
        letter-spacing:.08em;
        text-transform:uppercase;
      ">
        <span>PHNX Notices</span>
        <span style="
          min-width:22px;
          text-align:center;
          color:${count ? "#ffb100" : "#37d67a"};
        ">${count}</span>
      </div>
    `;

    return true;
  }

  function renderNotificationList(container, options = {}) {
    if (!container) return false;

    const notices = getNotifications(options.filters || {}).slice(0, options.limit || 10);

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
          margin-bottom:10px;
        ">PHNX Notifications</div>

        ${
          notices.length
            ? notices.map(n => `
              <div style="
                border:1px solid rgba(255,255,255,.12);
                background:${lower(n.status) === "unread" ? "rgba(255,177,0,.08)" : "rgba(255,255,255,.035)"};
                padding:10px;
                margin-bottom:8px;
              ">
                <div style="font-size:13px;font-weight:900;">
                  ${n.title}
                </div>
                <div style="margin-top:4px;font-size:12px;color:#c9d8e8;">
                  ${n.message}
                </div>
                <div style="
                  margin-top:6px;
                  font-size:10px;
                  color:#8ea0b8;
                  text-transform:uppercase;
                  letter-spacing:.08em;
                ">
                  ${n.priority} • ${n.status} • ${n.notification_type}
                </div>
              </div>
            `).join("")
            : `<div style="color:#9fb1c7;font-size:12px;">No active notifications.</div>`
        }
      </div>
    `;

    return true;
  }

  function runHealthCheck() {
    return {
      ok: !!NotificationState.initialized,
      engine_id: ENGINE_ID,
      version: VERSION,
      notification_count: NotificationState.notifications.length,
      unread_count: getUnreadCount(),
      runtime_status: NotificationState.runtime.status,
      checked_at: nowISO()
    };
  }

  async function init(context = {}) {
    if (window.__PHNX_NOTIFICATION_ENGINE_V1__ && !context.force_reload) {
      return {
        ok: true,
        status: "ALREADY_INITIALIZED",
        summary: buildNotificationSummary()
      };
    }

    window.__PHNX_NOTIFICATION_ENGINE_V1__ = true;

    NotificationState.initialized = true;
    NotificationState.booted_at = NotificationState.booted_at || nowISO();
    NotificationState.updated_at = nowISO();

    expose();

    NotificationState.runtime = {
      ...resolveRuntime(context),
      status: "ONLINE",
      loaded_at: nowISO()
    };

    await loadNotifications(context);

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        layer: "PHNX_PLATFORM_LAYER",
        status: "ONLINE"
      });
    }

    console.info("[PHNX Notification] Engine online:", VERSION, buildNotificationSummary());

    return {
      ok: true,
      status: "PHNX_NOTIFICATION_ENGINE_ONLINE",
      summary: buildNotificationSummary(),
      runtime: clone(NotificationState.runtime)
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,

      init,
      loadNotifications,
      createNotification,

      markRead,
      markAllRead,
      archiveNotification,

      getNotifications,
      getUnreadCount,
      buildNotificationSummary,

      renderNotificationBadge,
      renderNotificationList,
      runHealthCheck,

      getState: () => clone(NotificationState)
    };

    window.PHNXNotificationEngine = api;
    window.PHNX.NotificationEngine = api;

    window.STATScoreNotificationEngine = api;
    window.STATScore.NotificationEngine = api;

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
