/* ============================================================
   STATScore™ Communication Engine
   File: statscore-communication-engine.js
   Version: STATSCORE-COMMUNICATION-ENGINE-V1
   Purpose:
   Multi-Box role-to-role communication authority,
   guardian gating, recruiter-athlete restrictions,
   NCAA communication-window checks, audit receipts,
   notifications, and message routing governance.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const CommunicationEngine = {

    version: "STATSCORE-COMMUNICATION-ENGINE-V1",

    MESSAGE_STATUS: {
      DRAFT: "DRAFT",
      QUEUED: "QUEUED",
      SENT: "SENT",
      BLOCKED: "BLOCKED",
      REVIEW_REQUIRED: "REVIEW_REQUIRED",
      GUARDIAN_REQUIRED: "GUARDIAN_REQUIRED"
    },

    PRIORITY: {
      LOW: "LOW",
      NORMAL: "NORMAL",
      HIGH: "HIGH",
      URGENT: "URGENT"
    },

    CHANNELS: {
      ATHLETE: "athlete",
      PARENT: "parent",
      COACH: "coach",
      COUNSELOR: "counselor",
      RECRUITER: "recruiter",
      EVALUATOR: "evaluator",
      PROGRAM: "program",
      ADMIN: "admin"
    },

    nowISO() {
      return new Date().toISOString();
    },

    uuid() {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID();
      return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    },

    core() {
      return window.STATScoreCore || null;
    },

    compliance() {
      return window.STATScore?.ComplianceEngine || null;
    },

    eventEngine() {
      return window.STATScore?.EventEngine || null;
    },

    roleAccess() {
      return window.STATScoreRoleAccess || null;
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    safe(value, fallback = "") {
      return this.core()?.safe?.(value, fallback) ?? (value || fallback);
    },

    isRecruiterAthleteMessage(fromRole, toRole) {
      const from = this.lower(fromRole);
      const to = this.lower(toRole);

      return (
        (from === "recruiter" && to === "athlete") ||
        (from === "athlete" && to === "recruiter")
      );
    },

    isGuardianRequired(snapshot, fromRole, toRole) {
      const compliance = this.compliance();

      if (!compliance) return false;

      const athleteInvolved =
        this.lower(fromRole) === "athlete" ||
        this.lower(toRole) === "athlete";

      return athleteInvolved && compliance.isMinor?.(snapshot);
    },

    buildMessage(payload = {}) {
      return {
        message_id: payload.message_id || this.uuid(),
        engine_version: this.version,

        athlete_id: payload.athlete_id || null,
        snapshot_id: payload.snapshot_id || null,

        from_role: this.lower(payload.from_role || "system"),
        to_role: this.lower(payload.to_role || "admin"),

        from_user_id: payload.from_user_id || null,
        to_user_id: payload.to_user_id || null,

        subject: payload.subject || "STATScore Message",
        body: payload.body || "",

        priority: payload.priority || this.PRIORITY.NORMAL,
        message_status: payload.message_status || this.MESSAGE_STATUS.DRAFT,

        source_room: payload.source_room || "multi-box",
        route_type: payload.route_type || "ROLE_TO_ROLE",

        compliance_status: "PENDING",
        compliance_reason: "",

        audit_required: true,
        locked: true,

        created_at: this.nowISO(),
        updated_at: this.nowISO()
      };
    },

    evaluateMessage(message, snapshot = {}, context = {}) {
      const compliance = this.compliance();

      if (!message.body || !String(message.body).trim()) {
        return {
          allowed: false,
          status: this.MESSAGE_STATUS.BLOCKED,
          reason: "Message body is required."
        };
      }

      if (!message.from_role || !message.to_role) {
        return {
          allowed: false,
          status: this.MESSAGE_STATUS.BLOCKED,
          reason: "Message requires source role and target role."
        };
      }

      if (this.isRecruiterAthleteMessage(message.from_role, message.to_role)) {
        const result = compliance?.evaluateMultiBoxMessage?.(message, snapshot, context);

        if (!result) {
          return {
            allowed: false,
            status: this.MESSAGE_STATUS.REVIEW_REQUIRED,
            reason: "Compliance engine unavailable. Recruiter-athlete communication requires review."
          };
        }

        return {
          allowed: !!result.allowed,
          status: result.allowed ? this.MESSAGE_STATUS.QUEUED : result.status,
          reason: result.reason,
          compliance_result: result
        };
      }

      if (this.isGuardianRequired(snapshot, message.from_role, message.to_role)) {
        const guardianOk = compliance?.guardianApproved?.(snapshot);

        if (!guardianOk) {
          return {
            allowed: false,
            status: this.MESSAGE_STATUS.GUARDIAN_REQUIRED,
            reason: "Guardian approval is required before athlete communication."
          };
        }
      }

      return {
        allowed: true,
        status: this.MESSAGE_STATUS.QUEUED,
        reason: "Message approved for role-to-role routing."
      };
    },

    routeMessage(message, snapshot = {}, context = {}) {
      const evaluation = this.evaluateMessage(message, snapshot, context);

      const routed = {
        ...message,
        message_status: evaluation.allowed ? this.MESSAGE_STATUS.QUEUED : evaluation.status,
        compliance_status: evaluation.status,
        compliance_reason: evaluation.reason,
        updated_at: this.nowISO()
      };

      return {
        ok: evaluation.allowed,
        status: routed.message_status,
        message: routed,
        evaluation,
        receipt: this.buildMessageReceipt(routed, evaluation)
      };
    },

    buildMessageReceipt(message, evaluation = {}) {
      return {
        receipt_type: "STATSCORE_COMMUNICATION_RECEIPT",
        engine_version: this.version,

        message_id: message.message_id,
        athlete_id: message.athlete_id,
        snapshot_id: message.snapshot_id,

        from_role: message.from_role,
        to_role: message.to_role,
        source_room: message.source_room,

        status: message.message_status,
        compliance_status: message.compliance_status,
        compliance_reason: message.compliance_reason,

        allowed: !!evaluation.allowed,

        created_at: this.nowISO(),
        locked: true
      };
    },

    buildNotification(message) {
      return {
        notification_id: this.uuid(),
        message_id: message.message_id,

        athlete_id: message.athlete_id,
        snapshot_id: message.snapshot_id,

        target_role: message.to_role,
        message: `New STATScore Multi-Box message: ${message.subject}`,

        read_status: "UNREAD",
        created_at: this.nowISO(),
        locked: true
      };
    },

    async persistMessage(message) {
      const db = this.core()?.getClient?.();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          message
        };
      }

      const { data, error } = await db
        .from("sc_messages")
        .insert(message)
        .select("*")
        .single();

      if (error) {
        console.error("STATScore message insert failed:", error);
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
      const db = this.core()?.getClient?.();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          receipt
        };
      }

      const { data, error } = await db
        .from("statscore_communication_receipts")
        .insert(receipt)
        .select("*")
        .single();

      if (error) {
        console.error("STATScore communication receipt insert failed:", error);
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

    async persistNotification(notification) {
      const db = this.core()?.getClient?.();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          notification
        };
      }

      const { data, error } = await db
        .from("statscore_notifications")
        .insert(notification)
        .select("*")
        .single();

      if (error) {
        console.error("STATScore communication notification insert failed:", error);
        return {
          ok: false,
          status: "NOTIFICATION_INSERT_FAILED",
          error,
          notification
        };
      }

      return {
        ok: true,
        status: "NOTIFICATION_INSERTED",
        notification: data
      };
    },

    async sendMessage(payload = {}, snapshot = {}, context = {}) {
      const message = this.buildMessage(payload);
      const routed = this.routeMessage(message, snapshot, context);

      if (!routed.ok) {
        await this.persistReceipt(routed.receipt);

        return {
          ok: false,
          status: routed.status,
          message: routed.message,
          evaluation: routed.evaluation,
          receipt: routed.receipt
        };
      }

      routed.message.message_status = this.MESSAGE_STATUS.SENT;
      routed.message.updated_at = this.nowISO();

      const messageResult = await this.persistMessage(routed.message);
      const receiptResult = await this.persistReceipt(routed.receipt);
      const notificationResult = await this.persistNotification(
        this.buildNotification(routed.message)
      );

      return {
        ok: messageResult.ok,
        status: messageResult.ok ? "MESSAGE_SENT" : messageResult.status,
        message: messageResult.message,
        evaluation: routed.evaluation,
        receipt: receiptResult,
        notification: notificationResult
      };
    },

    async saveDraft(payload = {}) {
      const message = this.buildMessage({
        ...payload,
        message_status: this.MESSAGE_STATUS.DRAFT
      });

      return await this.persistMessage(message);
    },

    async loadMessagesForRole(role, snapshotId = null) {
      const db = this.core()?.getClient?.();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          messages: []
        };
      }

      let query = db
        .from("sc_messages")
        .select("*")
        .or(`from_role.eq.${this.lower(role)},to_role.eq.${this.lower(role)}`)
        .order("created_at", { ascending: false });

      if (snapshotId) {
        query = query.eq("snapshot_id", snapshotId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("STATScore message load failed:", error);
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

    buildCommunicationSummary(messages = []) {
      const total = messages.length;
      const unread = messages.filter(m => m.read_status === "UNREAD").length;
      const blocked = messages.filter(m => m.message_status === this.MESSAGE_STATUS.BLOCKED).length;
      const recruiterMessages = messages.filter(m =>
        this.lower(m.from_role) === "recruiter" || this.lower(m.to_role) === "recruiter"
      ).length;

      return {
        total_messages: total,
        unread_messages: unread,
        blocked_messages: blocked,
        recruiter_messages: recruiterMessages,
        generated_at: this.nowISO()
      };
    },

    renderCommunicationPanel(targetId, summary) {
      const el = document.getElementById(targetId);
      if (!el || !summary) return;

      el.innerHTML = `
        <div class="communication-kicker">STATScore Multi-Box Intelligence</div>
        <h2>Communication Governance Active</h2>

        <div class="communication-grid">
          <div><b>Total</b><span>${summary.total_messages}</span></div>
          <div><b>Unread</b><span>${summary.unread_messages}</span></div>
          <div><b>Blocked</b><span>${summary.blocked_messages}</span></div>
          <div><b>Recruiter Routed</b><span>${summary.recruiter_messages}</span></div>
        </div>
      `;
    },

    explain(result) {
      if (!result) return "No communication result available.";

      return [
        `Status: ${result.status}`,
        `Allowed: ${result.ok ? "YES" : "NO"}`,
        `Reason: ${result.evaluation?.reason || "--"}`
      ].join(" | ");
    }

  };

  window.STATScore.CommunicationEngine = CommunicationEngine;

  console.info("[STATScore] Communication Engine Loaded:", CommunicationEngine.version);

})(); 
