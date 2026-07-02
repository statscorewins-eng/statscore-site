/* ============================================================
   STATScore™ Multi-Box Governance Engine
   File: statscore-multi-box-governance-engine.js
   Version: STATSCORE-MULTIBOX-GOVERNANCE-ENGINE-V3
   Purpose:
   Enforces locked sender-channel communication governance:
   Sender Role → Target Role → Target Directory → Recipient
   Drafts may be discarded.
   Governed communications may be archived, withdrawn, recalled,
   audited — never deleted.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "statscore-multibox-governance-engine";
  const VERSION = "STATSCORE-MULTIBOX-GOVERNANCE-ENGINE-V3";

  const GovernanceEngine = {
    engine_id: ENGINE_ID,
    version: VERSION,

    WINDOW: {
      OPEN: "open",
      LIMITED: "limited",
      RESTRICTED: "restricted",
      CLOSED: "closed"
    },

    ACTION: {
      DRAFT_SAVED: "draft_saved",
      DRAFT_DISCARDED: "draft_discarded",
      MESSAGE_SENT: "message_sent",
      BROADCAST_SENT: "broadcast_sent",
      ARCHIVED: "archived",
      WITHDRAWN: "withdrawn",
      RECALLED: "recalled",
      RECEIPT_VIEWED: "receipt_viewed",
      AUDIT_VIEWED: "audit_viewed"
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    nowISO() {
      return new Date().toISOString();
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

    getRuntimeContext(context = {}) {
      const roleAccess = this.roleAccess();
      const params = new URLSearchParams(window.location.search);

      return {
        sender_user_id:
          context.sender_user_id ||
          sessionStorage.getItem("statscore_user_id") ||
          sessionStorage.getItem("user_id") ||
          null,

        sender_role: this.lower(
          context.sender_role ||
          context.role ||
          roleAccess?.getAuthenticatedRole?.() ||
          sessionStorage.getItem("statscore_role") ||
          sessionStorage.getItem("role") ||
          params.get("role") ||
          "athlete"
        ),

        sender_role_id:
          context.sender_role_id ||
          context.role_id ||
          roleAccess?.getAuthenticatedRoleId?.() ||
          sessionStorage.getItem("statscore_role_id") ||
          sessionStorage.getItem("role_id") ||
          params.get("role_id") ||
          null,

        athlete_id:
          context.athlete_id ||
          sessionStorage.getItem("statscore_athlete_id") ||
          params.get("athlete_id") ||
          null,

        snapshot_id:
          context.snapshot_id ||
          sessionStorage.getItem("statscore_snapshot_id") ||
          params.get("snapshot_id") ||
          null
      };
    },

    assertSenderLocked(message = {}, context = {}) {
      const runtime = this.getRuntimeContext(context);
      const incoming = this.lower(message.sender_role || message.from_role || runtime.sender_role);

      if (!runtime.sender_role) {
        return {
          allowed: false,
          reason: "Missing authenticated sender role.",
          runtime
        };
      }

      if (incoming !== runtime.sender_role) {
        return {
          allowed: false,
          reason: "Sender role mismatch. Multi-Box sender channel is locked by session/dashboard context.",
          runtime
        };
      }

      return {
        allowed: true,
        reason: "Sender channel locked.",
        runtime
      };
    },

    async getDirectoryRule(senderRole, targetRole, directoryKey) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          reason: "Database client unavailable.",
          rule: null
        };
      }

      const { data, error } = await db
        .from("sc_multibox_directories")
        .select("*")
        .eq("sender_role", this.lower(senderRole))
        .eq("target_role", this.lower(targetRole))
        .eq("directory_key", this.lower(directoryKey))
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("[STATScore] Directory rule lookup failed:", error);
        return {
          ok: false,
          reason: "Directory rule lookup failed.",
          error,
          rule: null
        };
      }

      if (!data) {
        return {
          ok: false,
          reason: "Target directory is not authorized for this sender role.",
          rule: null
        };
      }

      return {
        ok: true,
        reason: "Target directory authorized.",
        rule: data
      };
    },

    async getWindowRule(senderRole, targetRole) {
      const db = this.db();

      if (!db) {
        return {
          ok: false,
          window_status: this.WINDOW.RESTRICTED,
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
        console.error("[STATScore] Window rule lookup failed:", error);
        return {
          ok: false,
          window_status: this.WINDOW.RESTRICTED,
          reason: "Window rule lookup failed.",
          error
        };
      }

      if (!data) {
        return {
          ok: true,
          window_status: this.WINDOW.RESTRICTED,
          reason: "No explicit communication window exists for this sender/target role."
        };
      }

      return {
        ok: true,
        ...data
      };
    },

    hasCredentialAuthority(context = {}, message = {}, directoryRule = {}, windowRule = {}) {
      const credentialRequired =
        !!directoryRule.requires_credential ||
        !!windowRule.requires_credential_validation;

      if (!credentialRequired) {
        return {
          ok: true,
          reason: "Credential validation not required for this route."
        };
      }

      const credentialStatus = this.lower(
        context.credential_status ||
        context.professional_credential_status ||
        sessionStorage.getItem("statscore_credential_status") ||
        ""
      );

      const hasVerifiedCredential =
        credentialStatus === "active" ||
        credentialStatus === "verified" ||
        credentialStatus === "certified";

      return {
        ok: hasVerifiedCredential,
        reason: hasVerifiedCredential
          ? "Credential authority verified."
          : "Credential authority required for this communication route."
      };
    },

    hasGuardianClearance(context = {}, message = {}, directoryRule = {}, windowRule = {}) {
      const guardianRequired =
        !!directoryRule.requires_guardian_clearance ||
        !!windowRule.requires_guardian_approval;

      if (!guardianRequired) {
        return {
          ok: true,
          reason: "Guardian clearance not required for this route."
        };
      }

      const guardianStatus = this.lower(
        context.guardian_approval_status ||
        context.guardian_clearance_status ||
        sessionStorage.getItem("statscore_guardian_status") ||
        ""
      );

      const guardianOk =
        guardianStatus === "approved" ||
        guardianStatus === "active" ||
        guardianStatus === "cleared";

      return {
        ok: guardianOk,
        reason: guardianOk
          ? "Guardian clearance verified."
          : "Guardian clearance required before this communication can proceed."
      };
    },

    isRecruiterDirectAthleteBlocked(message = {}, windowRule = {}) {
      const sender = this.lower(message.sender_role);
      const target = this.lower(message.target_role);

      if (sender === "recruiter" && target === "athlete" && windowRule.blocks_direct_recruiter_contact) {
        return {
          blocked: true,
          reason: windowRule.rule_description || "Direct recruiter-to-athlete contact is restricted."
        };
      }

      return {
        blocked: false,
        reason: "No direct recruiter block triggered."
      };
    },

    validateBroadcast(message = {}) {
      if (!message.is_broadcast) {
        return {
          ok: true,
          reason: "Not a broadcast."
        };
      }

      const sender = this.lower(message.sender_role);

      const allowedBroadcastRoles = [
        "admin",
        "program",
        "program_admin",
        "coach",
        "counselor"
      ];

      if (!allowedBroadcastRoles.includes(sender)) {
        return {
          ok: false,
          reason: "Broadcast is not authorized for this sender role."
        };
      }

      return {
        ok: true,
        reason: "Broadcast sender role authorized."
      };
    },

    evaluateLifecycleAction(action, record = {}) {
      const normalized = this.lower(action);
      const status = this.lower(record.status);

      const forbidden = [
        "delete",
        "deleted",
        "remove",
        "removed",
        "destroy",
        "purge",
        "erase"
      ];

      if (forbidden.includes(normalized)) {
        return {
          allowed: false,
          status: "blocked",
          reason: "Governed communications cannot be deleted or altered."
        };
      }

      if (normalized === this.ACTION.DRAFT_DISCARDED) {
        const allowed = status === "draft";

        return {
          allowed,
          status: allowed ? "approved" : "blocked",
          reason: allowed
            ? "Draft may be discarded prior to transmission."
            : "Only unsent drafts may be discarded."
        };
      }

      if (
        normalized === this.ACTION.ARCHIVED ||
        normalized === this.ACTION.WITHDRAWN ||
        normalized === this.ACTION.RECALLED
      ) {
        const allowed = status === "sent" || status === "broadcast";

        return {
          allowed,
          status: allowed ? "approved" : "blocked",
          reason: allowed
            ? "Governed communication lifecycle action approved. Audit required."
            : "Only transmitted communications may be archived, withdrawn, or recalled."
        };
      }

      if (
        normalized === this.ACTION.MESSAGE_SENT ||
        normalized === this.ACTION.BROADCAST_SENT
      ) {
        return {
          allowed: true,
          status: "approved",
          reason: "Transmission requires receipt and audit record."
        };
      }

      if (normalized === this.ACTION.DRAFT_SAVED) {
        return {
          allowed: true,
          status: "approved",
          reason: "Draft saved. No receipt required until transmission."
        };
      }

      return {
        allowed: true,
        status: "approved",
        reason: "Lifecycle action allowed."
      };
    },

    async evaluateMultiBoxMessage(message = {}, context = {}, incomingWindowRule = null) {
      const lock = this.assertSenderLocked(message, context);

      if (!lock.allowed) {
        return {
          allowed: false,
          status: "blocked",
          reason: lock.reason,
          runtime: lock.runtime
        };
      }

      if (!message.target_role) {
        return {
          allowed: false,
          status: "blocked",
          reason: "Target role is required."
        };
      }

      if (!message.target_directory) {
        return {
          allowed: false,
          status: "blocked",
          reason: "Target directory is required."
        };
      }

      const directoryRule = await this.getDirectoryRule(
        message.sender_role,
        message.target_role,
        message.target_directory
      );

      if (!directoryRule.ok) {
        return {
          allowed: false,
          status: "blocked",
          reason: directoryRule.reason
        };
      }

      const windowRule =
        incomingWindowRule ||
        await this.getWindowRule(message.sender_role, message.target_role);

      if (windowRule.window_status === this.WINDOW.CLOSED) {
        return {
          allowed: false,
          status: "blocked",
          reason: windowRule.rule_description || "Communication window is closed.",
          directory_rule: directoryRule.rule,
          window_rule: windowRule
        };
      }

      const directRecruiterBlock = this.isRecruiterDirectAthleteBlocked(message, windowRule);

      if (directRecruiterBlock.blocked) {
        return {
          allowed: false,
          status: "blocked",
          reason: directRecruiterBlock.reason,
          directory_rule: directoryRule.rule,
          window_rule: windowRule
        };
      }

      const credential = this.hasCredentialAuthority(
        context,
        message,
        directoryRule.rule,
        windowRule
      );

      if (!credential.ok) {
        return {
          allowed: false,
          status: "blocked",
          reason: credential.reason,
          directory_rule: directoryRule.rule,
          window_rule: windowRule
        };
      }

      const guardian = this.hasGuardianClearance(
        context,
        message,
        directoryRule.rule,
        windowRule
      );

      if (!guardian.ok) {
        return {
          allowed: false,
          status: "blocked",
          reason: guardian.reason,
          directory_rule: directoryRule.rule,
          window_rule: windowRule
        };
      }

      const broadcast = this.validateBroadcast(message);

      if (!broadcast.ok) {
        return {
          allowed: false,
          status: "blocked",
          reason: broadcast.reason,
          directory_rule: directoryRule.rule,
          window_rule: windowRule
        };
      }

      return {
        allowed: true,
        status: windowRule.window_status || "open",
        reason: windowRule.rule_description || "Communication route approved.",
        directory_rule: directoryRule.rule,
        window_rule: windowRule,
        runtime: lock.runtime
      };
    },

    renderGovernancePanel(container, evaluation = {}) {
      if (!container) return false;

      const allowed = !!evaluation.allowed;
      const status = allowed ? "APPROVED" : "BLOCKED";
      const color = allowed ? "#37d67a" : "#ff3434";

      container.innerHTML = `
        <div style="
          border:1px solid ${color};
          background:rgba(255,255,255,.035);
          padding:18px;
          color:#f4f2ef;
          box-shadow:0 12px 28px rgba(0,0,0,.38);
        ">
          <div style="
            color:${color};
            font-size:12px;
            font-weight:1000;
            letter-spacing:.18em;
            text-transform:uppercase;
          ">
            Multi-Box Governance
          </div>

          <div style="
            margin-top:10px;
            font-size:28px;
            font-weight:1000;
            color:${color};
          ">
            ${status}
          </div>

          <div style="
            margin-top:14px;
            color:#d6deea;
            font-size:13px;
            line-height:1.5;
          ">
            ${evaluation.reason || "No governance result available."}
          </div>
        </div>
      `;

      return true;
    },

    init() {
      if (window.__STATSCORE_MULTIBOX_GOVERNANCE_ENGINE_V3__) {
        console.warn("[STATScore Multi-Box Governance] Duplicate initialization blocked.");
        return;
      }

      window.__STATSCORE_MULTIBOX_GOVERNANCE_ENGINE_V3__ = true;

      window.STATScoreMultiBoxGovernanceEngine = this;
      window.STATScore.MultiBoxGovernanceEngine = this;

      if (window.STATScoreEngineBus?.emit) {
        window.STATScoreEngineBus.emit("engine_online", {
          engine: ENGINE_ID,
          version: VERSION,
          status: "ONLINE"
        }); 
      }

      console.info("[STATScore Multi-Box Governance] Engine online:", VERSION);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => GovernanceEngine.init());
  } else {
    GovernanceEngine.init();
  }
})(); rep
