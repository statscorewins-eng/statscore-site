/* ============================================================
   STATScore™ Communication Engine
   File: statscore-communication-engine.js
   Version: STATSCORE-COMMUNICATION-ENGINE-V2
   Purpose:
   Multi-Box™ locked sender-channel runtime.
   Authenticated Role Channel → Target Role → Target Directory
   → Target Recipient → Governed Message → Receipt / Audit.
============================================================ */

(function () { 
  "use strict";

  window.STATScore = window.STATScore || {};

  const CommunicationEngine = {
    version: "STATSCORE-COMMUNICATION-ENGINE-V2",

    STATUS: {
      DRAFT: "draft",
      SENT: "sent",
      BROADCAST: "broadcast",
      ARCHIVED: "archived",
      WITHDRAWN: "withdrawn",
      BLOCKED: "blocked"
    },

    WINDOW: {
      OPEN: "open",
      LIMITED: "limited",
      RESTRICTED: "restricted",
      CLOSED: "closed"
    },

    nowISO() {
      return new Date().toISOString();
    },

    uuid() {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID();
      return "mbx_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    core() {
      return window.STATScoreCore || null;
    },

    db() {
      return this.core()?.getClient?.() || window.supabaseClient || null;
    },

    roleAccess() {
      return window.STATScoreRoleAccess || null;
    },

    governance() {
      return window.STATScore?.MultiBoxGovernanceEngine || null;
    },

    receiptLedger() {
      return window.STATScore?.ReceiptLedgerEngine || null;
    },

    getURLParam(key) {
      return new URLSearchParams(window.location.search).get(key);
    },

    getRuntimeContext(context = {}) {
      const roleAccess = this.roleAccess();

      const senderRole =
        context.sender_role ||
        context.role ||
        roleAccess?.getAuthenticatedRole?.() ||
        sessionStorage.getItem("statscore_role") ||
        sessionStorage.getItem("role") ||
        this.getURLParam("role") ||
        "athlete";

      const senderRoleId =
        context.sender_role_id ||
        context.role_id ||
        roleAccess?.getAuthenticatedRoleId?.() ||
        sessionStorage.getItem("statscore_role_id") ||
        sessionStorage.getItem("role_id") ||
        this.getURLParam("role_id") ||
        null;

      const senderUserId =
        context.sender_user_id ||
        context.user_id ||
        sessionStorage.getItem("statscore_user_id") ||
        sessionStorage.getItem("user_id") ||
        null;

      const senderLabel =
        context.sender_label ||
        context.from_label ||
        sessionStorage.getItem("statscore_sender_label") ||
        sessionStorage.getItem("sender_label") ||
        senderRole;

      return {
        sender_user_id: senderUserId,
        sender_role: this.lower(senderRole),
        sender_role_id: senderRoleId,
        sender_label: senderLabel,
        sender_channel_locked: true,

        athlete_id:
          context.athlete_id ||
          sessionStorage.getItem("statscore_athlete_id") ||
          this.getURLParam("athlete_id") ||
          null,

        snapshot_id:
          context.snapshot_id ||
          sessionStorage.getItem("statscore_snapshot_id") ||
          this.getURLParam("snapshot_id") ||
          null,

        source_page:
          context.source_page ||
          document.body?.dataset?.page ||
          "multi-box.html"
      };
    },

    assertLockedSender(payload = {}, runtime = {}) {
      const incoming = this.lower(payload.sender_role || payload.from_role || runtime.sender_role);
      const locked = this.lower(runtime.sender_role);

      if (!locked) {
        return {
          ok: false,
          reason: "Missing authenticated sender role."
        };
      }

      if (incoming && incoming !== locked) {
        return {
          ok: false,
          reason: "Sender role mismatch. Multi-Box sender channel is locked by dashboard/session context."
        };
      }

      return {
        ok: true,
        reason: "Sender channel locked."
      };
    },

    async loadTargetDirectories(senderRole) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          directories: []
        };
      }

      const { data, error } = await db
        .from("sc_multibox_directories")
        .select("*")
        .eq("sender_role", this.lower(senderRole))
        .eq("is_active", true)
        .order("target_role", { ascending: true })
        .order("directory_label", { ascending: true });

      if (error) {
        console.error("[STATScore] Multi-Box directory load failed:", error);
        return {
          ok: false,
          status: "DIRECTORY_LOAD_FAILED",
          error,
          directories: []
        };
      }

      return {
        ok: true,
        status: "DIRECTORIES_LOADED",
        directories: data || []
      };
    },

    getTargetRolesFromDirectories(directories = []) {
      return [...new Set(directories.map(d => d.target_role))].filter(Boolean);
    },

    async loadWindowRule(senderRole, targetRole) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          window_status: "restricted",
          reason: "Database client unavailable."
        };
      }

      const { data, error } = await db
        .from("sc_multibox_window_rules")
        .select("*")
        .eq("sender_role", this.lower(senderRole))
        .eq("target_role", this.lower(targetRole))
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[STATScore] Multi-Box window rule load failed:", error);
        return {
          ok: false,
          window_status: "restricted",
          reason: "Window rule lookup failed.",
          error
        };
      }

      if (!data) {
        return {
          ok: true,
          window_status: "restricted",
          reason: "No explicit communication rule found."
        };
      }

      return {
        ok: true,
        ...data
      };
    },

    async evaluateMessage(message = {}, context = {}) {
      const lock = this.assertLockedSender(message, context);

      if (!lock.ok) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: lock.reason
        };
      }

      if (!message.target_role) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: "Target role is required."
        };
      }

      if (!message.target_directory) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: "Target directory is required."
        };
      }

      if (!message.is_broadcast && !message.target_recipient_id) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: "Target recipient is required for non-broadcast messages."
        };
      }

      if (!message.subject || !String(message.subject).trim()) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: "Subject is required."
        };
      }

      if (!message.body || !String(message.body).trim()) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: "Message body is required."
        };
      }

      const rule = await this.loadWindowRule(message.sender_role, message.target_role);

      if (rule.window_status === this.WINDOW.CLOSED) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: rule.rule_description || "Communication window is closed.",
          window_rule: rule
        };
      }

      if (rule.blocks_direct_recruiter_contact) {
        return {
          allowed: false,
          status: this.STATUS.BLOCKED,
          reason: rule.rule_description || "Direct recruiter contact is restricted.",
          window_rule: rule
        };
      }

      const governance = this.governance();

      if (governance?.evaluateMultiBoxMessage) {
        const governed = await governance.evaluateMultiBoxMessage(message, context, rule);

        if (governed && governed.allowed === false) {
          return {
            allowed: false,
            status: this.STATUS.BLOCKED,
            reason: governed.reason || "Message blocked by Multi-Box governance.",
            governance_result: governed,
            window_rule: rule
          };
        }
      }

      return {
        allowed: true,
        status: message.is_broadcast ? this.STATUS.BROADCAST : this.STATUS.SENT,
        reason: "Message approved for governed Multi-Box routing.",
        window_rule: rule
      };
    },

    buildMessage(payload = {}, context = {}) {
      const runtime = this.getRuntimeContext(context);
      const locked = this.assertLockedSender(payload, runtime);

      if (!locked.ok) {
        throw new Error(locked.reason);
      }

      return {
        sender_user_id: runtime.sender_user_id,
        sender_role: runtime.sender_role,
        sender_role_id: runtime.sender_role_id,
        sender_label: runtime.sender_label,
        sender_channel_locked: true,

        target_role: this.lower(payload.target_role || payload.to_role),
        target_directory: this.lower(payload.target_directory || ""),
        target_recipient_id: payload.target_recipient_id || payload.to_user_id || null,
        target_recipient_type: this.lower(payload.target_recipient_type || payload.target_role || payload.to_role),
        target_recipient_label: payload.target_recipient_label || payload.to_label || null,

        athlete_id: payload.athlete_id || runtime.athlete_id,
        snapshot_id: payload.snapshot_id || runtime.snapshot_id,

        message_type: this.lower(payload.message_type || "general"),
        priority: this.lower(payload.priority || "standard"),
        communication_window: this.lower(payload.communication_window || "open"),

        subject: payload.subject || "",
        body: payload.body || "",

        status: this.lower(payload.status || this.STATUS.DRAFT),
        is_broadcast: !!payload.is_broadcast,
        archived: false,
        soft_deleted: false
      };
    },

    async persistMessage(message) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          message
        };
      }

      const { data, error } = await db
        .from("sc_multibox_messages")
        .insert(message)
        .select("*")
        .single();

      if (error) {
        console.error("[STATScore] Multi-Box message insert failed:", error);
        return {
          ok: false,
          status: "MESSAGE_INSERT_FAILED",
          error,
          message
        };
      }

      return {
        ok: true,
        status: "MESSAGE_INSERTED",
        message: data
      };
    },

    async persistReceipt(receipt) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          receipt
        };
      }

      const { data, error } = await db
        .from("sc_multibox_receipts")
        .insert(receipt)
        .select("*")
        .single();

      if (error) {
        console.error("[STATScore] Multi-Box receipt insert failed:", error);
        return {
          ok: false,
          status: "RECEIPT_INSERT_FAILED",
          error,
          receipt
        };
      }

      return {
        ok: true,
        status: "RECEIPT_INSERTED",
        receipt: data
      };
    },

    async persistAuditEvent(event) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          event
        };
      }

      const { data, error } = await db
        .from("sc_multibox_audit_events")
        .insert(event)
        .select("*")
        .single();

      if (error) {
        console.error("[STATScore] Multi-Box audit insert failed:", error);
        return {
          ok: false,
          status: "AUDIT_INSERT_FAILED",
          error,
          event
        };
      }

      return {
        ok: true,
        status: "AUDIT_INSERTED",
        event: data
      };
    },

    buildReceipt(message = {}, evaluation = {}, action = "message_event") {
      return {
        message_id: message.id || null,

        receipt_type: "STATSCORE_MULTIBOX_RECEIPT",
        action,

        sender_user_id: message.sender_user_id || null,
        sender_role: message.sender_role,
        sender_role_id: message.sender_role_id || null,
        sender_label: message.sender_label || null,

        target_role: message.target_role,
        target_directory: message.target_directory,
        target_recipient_id: message.target_recipient_id || null,
        target_recipient_type: message.target_recipient_type || null,
        target_recipient_label: message.target_recipient_label || null,

        athlete_id: message.athlete_id || null,
        snapshot_id: message.snapshot_id || null,

        receipt_payload: {
          engine_version: this.version,
          status: message.status,
          communication_window: message.communication_window,
          allowed: !!evaluation.allowed,
          reason: evaluation.reason || null,
          window_rule: evaluation.window_rule || null,
          locked: true,
          created_at: this.nowISO()
        }
      };
    },

    buildAuditEvent(message = {}, receipt = {}, eventType = "message_event", payload = {}) {
      return {
        message_id: message.id || null,
        receipt_id: receipt.id || null,

        event_type: eventType,

        actor_user_id: message.sender_user_id || null,
        actor_role: message.sender_role || null,
        actor_role_id: message.sender_role_id || null,

        event_payload: {
          engine_version: this.version,
          sender_role: message.sender_role,
          target_role: message.target_role,
          target_directory: message.target_directory,
          target_recipient_id: message.target_recipient_id,
          status: message.status,
          ...payload
        }
      };
    },

    async saveDraft(payload = {}, context = {}) {
      let message;

      try {
        message = this.buildMessage(
          {
            ...payload,
            status: this.STATUS.DRAFT,
            is_broadcast: false
          },
          context
        );
      } catch (error) {
        return {
          ok: false,
          status: "SENDER_LOCK_FAILED",
          error: error.message
        };
      }

      const messageResult = await this.persistMessage(message);

      if (!messageResult.ok) return messageResult;

      const saved = messageResult.message;
      const evaluation = {
        allowed: true,
        reason: "Draft saved. Send validation pending."
      };

     const auditResult = await this.persistAuditEvent(
  this.buildAuditEvent(saved, null, "draft_saved", {
    reason: evaluation.reason,
    receipt_created: false
  })
); 

       return {
        ok: true,
        status: "DRAFT_SAVED",
        message: saved,
        receipt: null,
        audit: auditResult
      };
    },

    async sendMessage(payload = {}, context = {}) {
      let message;

      try {
        message = this.buildMessage(
          {
            ...payload,
            status: this.STATUS.SENT,
            is_broadcast: false
          },
          context
        );
      } catch (error) {
        return {
          ok: false,
          status: "SENDER_LOCK_FAILED",
          error: error.message
        };
      }

      const evaluation = await this.evaluateMessage(message, context);

      if (!evaluation.allowed) {
        message.status = this.STATUS.BLOCKED;

        const blockedResult = await this.persistMessage(message);
        const blockedMessage = blockedResult.message || message;

        const receiptResult = await this.persistReceipt(
          this.buildReceipt(blockedMessage, evaluation, "message_blocked")
        );

        const auditResult = await this.persistAuditEvent(
          this.buildAuditEvent(blockedMessage, receiptResult.receipt, "message_blocked", {
            reason: evaluation.reason
          })
        );

        return {
          ok: false,
          status: "MESSAGE_BLOCKED",
          reason: evaluation.reason,
          message: blockedMessage,
          receipt: receiptResult,
          audit: auditResult,
          evaluation
        };
      }

      const messageResult = await this.persistMessage(message);

      if (!messageResult.ok) return messageResult;

      const sent = messageResult.message;

      const receiptResult = await this.persistReceipt(
        this.buildReceipt(sent, evaluation, "message_sent")
      );

      const auditResult = await this.persistAuditEvent(
        this.buildAuditEvent(sent, receiptResult.receipt, "message_sent")
      );

      return {
        ok: true,
        status: "MESSAGE_SENT",
        message: sent,
        receipt: receiptResult,
        audit: auditResult,
        evaluation
      };
    },

    async broadcastNotice(payload = {}, context = {}) {
      let message;

      try {
        message = this.buildMessage(
          {
            ...payload,
            status: this.STATUS.BROADCAST,
            is_broadcast: true
          },
          context
        );
      } catch (error) {
        return {
          ok: false,
          status: "SENDER_LOCK_FAILED",
          error: error.message
        };
      }

      const evaluation = await this.evaluateMessage(message, context);

      if (!evaluation.allowed) {
        message.status = this.STATUS.BLOCKED;

        const blockedResult = await this.persistMessage(message);
        const blockedMessage = blockedResult.message || message;

        const receiptResult = await this.persistReceipt(
          this.buildReceipt(blockedMessage, evaluation, "broadcast_blocked")
        );

        const auditResult = await this.persistAuditEvent(
          this.buildAuditEvent(blockedMessage, receiptResult.receipt, "broadcast_blocked", {
            reason: evaluation.reason
          })
        );

        return {
          ok: false,
          status: "BROADCAST_BLOCKED",
          reason: evaluation.reason,
          message: blockedMessage,
          receipt: receiptResult,
          audit: auditResult,
          evaluation
        };
      }

      const messageResult = await this.persistMessage(message);

      if (!messageResult.ok) return messageResult;

      const broadcast = messageResult.message;

      const receiptResult = await this.persistReceipt(
        this.buildReceipt(broadcast, evaluation, "broadcast_sent")
      );

      const auditResult = await this.persistAuditEvent(
        this.buildAuditEvent(broadcast, receiptResult.receipt, "broadcast_sent")
      );

      return {
        ok: true,
        status: "BROADCAST_SENT",
        message: broadcast,
        receipt: receiptResult,
        audit: auditResult,
        evaluation
      };
    },

    async loadMessagesForSender(context = {}, filters = {}) {
      const db = this.db();
      const runtime = this.getRuntimeContext(context);

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          messages: []
        };
      }

      let query = db
        .from("sc_multibox_messages")
        .select("*")
        .eq("sender_role", runtime.sender_role)
        .order("created_at", { ascending: false });

      if (runtime.sender_role_id) {
        query = query.eq("sender_role_id", runtime.sender_role_id);
      }

      if (filters.status) query = query.eq("status", this.lower(filters.status));
      if (filters.snapshot_id) query = query.eq("snapshot_id", filters.snapshot_id);
      if (filters.athlete_id) query = query.eq("athlete_id", filters.athlete_id);

      const { data, error } = await query;

      if (error) {
        console.error("[STATScore] Multi-Box sender message load failed:", error);
        return {
          ok: false,
          status: "MESSAGE_LOAD_FAILED",
          error,
          messages: []
        };
      }

      return {
        ok: true,
        status: "MESSAGES_LOADED",
        messages: data || []
      };
    },

    async loadMessagesForRecipient(context = {}, filters = {}) {
      const db = this.db();
      const runtime = this.getRuntimeContext(context);

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          messages: []
        };
      }

      let query = db
        .from("sc_multibox_messages")
        .select("*")
        .eq("target_role", runtime.sender_role)
        .order("created_at", { ascending: false });

      if (filters.snapshot_id) query = query.eq("snapshot_id", filters.snapshot_id);
      if (filters.athlete_id) query = query.eq("athlete_id", filters.athlete_id);

      const { data, error } = await query;

      if (error) {
        console.error("[STATScore] Multi-Box recipient message load failed:", error);
        return {
          ok: false,
          status: "MESSAGE_LOAD_FAILED",
          error,
          messages: []
        };
      }

      return {
        ok: true,
        status: "RECIPIENT_MESSAGES_LOADED",
        messages: data || []
      };
    },

    buildCommunicationSummary(messages = []) {
      return {
        total_messages: messages.length,
        unread_messages: messages.filter(m => m.read_status === "unread").length,
        draft_messages: messages.filter(m => m.status === this.STATUS.DRAFT).length,
        sent_messages: messages.filter(m => m.status === this.STATUS.SENT).length,
        blocked_messages: messages.filter(m => m.status === this.STATUS.BLOCKED).length,
        broadcast_messages: messages.filter(m => m.status === this.STATUS.BROADCAST).length,
        generated_at: this.nowISO()
      };
    },

    explain(result) {
      if (!result) return "No communication result available.";

      return [
        `Status: ${result.status}`,
        `Allowed: ${result.ok ? "YES" : "NO"}`,
        `Reason: ${result.reason || result.evaluation?.reason || "--"}`
      ].join(" | ");
    },

    async init(context = {}) {
      const runtime = this.getRuntimeContext(context);
      const directoryResult = await this.loadTargetDirectories(runtime.sender_role);

      window.STATScore.MultiBoxRuntime = {
        engine_version: this.version,
        runtime,
        directories: directoryResult.directories || [],
        target_roles: this.getTargetRolesFromDirectories(directoryResult.directories || []),
        loaded_at: this.nowISO()
      };

      console.info("[STATScore] Multi-Box Runtime Initialized:", window.STATScore.MultiBoxRuntime);

      return window.STATScore.MultiBoxRuntime;
    }
  };

  window.STATScore.CommunicationEngine = CommunicationEngine;

  console.info("[STATScore] Communication Engine Loaded:", CommunicationEngine.version);

})(); 
