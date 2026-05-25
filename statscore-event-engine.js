/* ============================================================
   STATScore™ Event Engine
   File: statscore-event-engine.js
   Version: STATSCORE-EVENT-ENGINE-V1
   Purpose:
   System heartbeat for event creation, state transitions,
   audit receipts, room propagation, notification routing,
   and governed operational updates.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const EventEngine = {

    version: "STATSCORE-EVENT-ENGINE-V1",

    EVENT_TYPES: {
      SNAPSHOT_CREATED: "snapshot.created",
      PROFILE_LOADED: "profile.loaded",

      VERIFICATION_REQUESTED: "verification.requested",
      VERIFICATION_APPLIED: "verification.applied",
      VERIFICATION_REJECTED: "verification.rejected",

      ELIGIBILITY_WARNING: "eligibility.warning",
      ELIGIBILITY_CLEARED: "eligibility.cleared",

      MEDIA_ATTACHED: "media.attached",
      MEDIA_QUEUED: "media.queued",
      MEDIA_APPROVED: "media.approved",
      MEDIA_PUBLISHED: "media.published",

      RECRUITER_REQUEST: "recruiter.request",
      RECRUITER_APPROVED: "recruiter.approved",
      RECRUITER_RESTRICTED: "recruiter.restricted",

      COUNSELOR_REVIEW: "counselor.review",
      COACH_NOTE: "coach.note",
      EVALUATOR_REVIEW: "evaluator.review",

      STATE_UPDATED: "state.updated",
      SYNTHESIS_UPDATED: "synthesis.updated",
      SIGNAL_CREATED: "signal.created",

      SYSTEM_ALERT: "system.alert"
    },

    EVENT_SEVERITY: {
      INFO: "INFO",
      NOTICE: "NOTICE",
      WARNING: "WARNING",
      CRITICAL: "CRITICAL"
    },

    nowISO() {
      return new Date().toISOString();
    },

    uuid() {
      if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
      }

      return "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    },

    core() {
      return window.STATScoreCore || null;
    },

    stateEngine() {
      return window.STATScore?.StateEngine || null;
    },

    synthesisEngine() {
      return window.STATScore?.SynthesisEngine || null;
    },

    signalGovernance() {
      return window.STATScoreSignalGovernance || null;
    },

    buildEvent(type, payload = {}) {
      return {
        event_id: this.uuid(),
        event_type: type || this.EVENT_TYPES.SYSTEM_ALERT,
        engine_version: this.version,

        athlete_id: payload.athlete_id || payload.snapshot_id || null,
        snapshot_id: payload.snapshot_id || null,

        source_role: payload.source_role || "system",
        source_room: payload.source_room || null,

        severity: payload.severity || this.EVENT_SEVERITY.INFO,

        payload,

        created_at: this.nowISO(),
        processed: false,
        locked: true
      };
    },

    classifyEvent(type) {
      const t = String(type || "").toLowerCase();

      if (t.includes("eligibility.warning")) {
        return {
          severity: this.EVENT_SEVERITY.WARNING,
          routes: ["counselor", "parent", "athlete", "admin"],
          state_transition: "eligibility.warning"
        };
      }

      if (t.includes("verification.applied")) {
        return {
          severity: this.EVENT_SEVERITY.NOTICE,
          routes: ["athlete", "parent", "coach", "evaluator", "admin"],
          state_transition: "verification.applied"
        };
      }

      if (t.includes("media")) {
        return {
          severity: this.EVENT_SEVERITY.NOTICE,
          routes: ["athlete", "parent", "coach", "program", "admin"],
          state_transition: "media.attached"
        };
      }

      if (t.includes("recruiter.request")) {
        return {
          severity: this.EVENT_SEVERITY.NOTICE,
          routes: ["parent", "athlete", "admin"],
          state_transition: "recruiter.request"
        };
      }

      if (t.includes("counselor.review")) {
        return {
          severity: this.EVENT_SEVERITY.NOTICE,
          routes: ["counselor", "parent", "athlete", "admin"],
          state_transition: "counselor.review"
        };
      }

      return {
        severity: this.EVENT_SEVERITY.INFO,
        routes: ["admin"],
        state_transition: null
      };
    },

    buildReceipt(event, result = {}) {
      return {
        receipt_type: "STATSCORE_EVENT_RECEIPT",
        event_id: event.event_id,
        event_type: event.event_type,
        engine_version: this.version,

        athlete_id: event.athlete_id,
        snapshot_id: event.snapshot_id,

        source_role: event.source_role,
        source_room: event.source_room,

        severity: event.severity,

        result,

        created_at: this.nowISO(),
        locked: true
      };
    },

    buildNotification(event, role, message = "") {
      return {
        notification_id: this.uuid(),
        event_id: event.event_id,
        athlete_id: event.athlete_id,
        snapshot_id: event.snapshot_id,

        target_role: role,
        message: message || this.defaultMessage(event),

        read_status: "UNREAD",
        created_at: this.nowISO(),
        locked: true
      };
    },

    defaultMessage(event) {
      const type = String(event.event_type || "");

      if (type === this.EVENT_TYPES.ELIGIBILITY_WARNING) {
        return "Eligibility warning detected. Counselor review required.";
      }

      if (type === this.EVENT_TYPES.VERIFICATION_APPLIED) {
        return "Verification has been applied to this athlete record.";
      }

      if (type === this.EVENT_TYPES.MEDIA_QUEUED) {
        return "PHNX SPORTS media package has been queued.";
      }

      if (type === this.EVENT_TYPES.RECRUITER_REQUEST) {
        return "Recruiter access request received. Guardian approval may be required.";
      }

      return "STATScore system event recorded.";
    },

    applyStateTransition(currentState, event) {
      const stateEngine = this.stateEngine();

      if (!stateEngine || !currentState) {
        return currentState || null;
      }

      const classification = this.classifyEvent(event.event_type);

      if (!classification.state_transition) {
        return currentState;
      }

      return stateEngine.transitionState(currentState, {
        type: classification.state_transition,
        payload: event.payload
      });
    },

    buildSignalFromEvent(event) {
      const governance = this.signalGovernance();

      if (!governance) return null;

      let signalType = governance.SIGNAL_TYPES.PERFORMANCE;
      let signalValue = governance.SIGNAL_STATUS.PENDING;
      let confidence = 50;
      let evidenceLevel = "documented";

      switch (event.event_type) {
        case this.EVENT_TYPES.VERIFICATION_APPLIED:
          signalType = governance.SIGNAL_TYPES.PERFORMANCE;
          signalValue = governance.SIGNAL_STATUS.GREEN;
          confidence = 85;
          evidenceLevel = "verified";
          break;

        case this.EVENT_TYPES.ELIGIBILITY_WARNING:
          signalType = governance.SIGNAL_TYPES.ELIGIBILITY;
          signalValue = governance.SIGNAL_STATUS.YELLOW;
          confidence = 75;
          evidenceLevel = "documented";
          break;

        case this.EVENT_TYPES.MEDIA_QUEUED:
          signalType = governance.SIGNAL_TYPES.MEDIA;
          signalValue = governance.SIGNAL_STATUS.GREEN;
          confidence = 70;
          evidenceLevel = "documented";
          break;

        case this.EVENT_TYPES.RECRUITER_REQUEST:
          signalType = governance.SIGNAL_TYPES.COMMUNICATION;
          signalValue = governance.SIGNAL_STATUS.PENDING;
          confidence = 60;
          evidenceLevel = "documented";
          break;
      }

      return governance.normalizeSignal({
        athlete_id: event.athlete_id,
        source_role: event.source_role || "system",
        signal_type: signalType,
        signal_value: signalValue,
        confidence,
        evidence_level: evidenceLevel,
        notes: `Generated from event: ${event.event_type}`,
        created_at: event.created_at
      });
    },

    async persistEvent(event) {
      const db = this.core()?.getClient?.();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          event
        };
      }

      const { data, error } = await db
        .from("statscore_events")
        .insert(event)
        .select("*")
        .single();

      if (error) {
        console.error("STATScore event insert failed:", error);
        return {
          ok: false,
          status: "EVENT_INSERT_FAILED",
          error,
          event
        };
      }

      return {
        ok: true,
        status: "EVENT_INSERTED",
        event: data
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
        .from("statscore_event_receipts")
        .insert(receipt)
        .select("*")
        .single();

      if (error) {
        console.error("STATScore event receipt insert failed:", error);
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

    async persistNotifications(notifications = []) {
      const db = this.core()?.getClient?.();

      if (!db || !notifications.length) {
        return {
          ok: false,
          status: "NO_DB_OR_NO_NOTIFICATIONS",
          notifications
        };
      }

      const { data, error } = await db
        .from("statscore_notifications")
        .insert(notifications)
        .select("*");

      if (error) {
        console.error("STATScore notifications insert failed:", error);
        return {
          ok: false,
          status: "NOTIFICATION_INSERT_FAILED",
          error,
          notifications
        };
      }

      return {
        ok: true,
        status: "NOTIFICATIONS_INSERTED",
        notifications: data
      };
    },

    processEvent(type, payload = {}, currentState = null) {
      const classification = this.classifyEvent(type);

      const event = this.buildEvent(type, {
        ...payload,
        severity: payload.severity || classification.severity
      });

      const nextState = this.applyStateTransition(currentState, event);

      const signal = this.buildSignalFromEvent(event);

      const notifications = classification.routes.map((role) =>
        this.buildNotification(event, role)
      );

      const result = {
        event,
        next_state: nextState,
        generated_signal: signal,
        notifications,
        routed_roles: classification.routes
      };

      const receipt = this.buildReceipt(event, result);

      return {
        ok: true,
        status: "EVENT_PROCESSED",
        ...result,
        receipt
      };
    },

    async processAndPersist(type, payload = {}, currentState = null) {
      const processed = this.processEvent(type, payload, currentState);

      const eventResult = await this.persistEvent(processed.event);
      const receiptResult = await this.persistReceipt(processed.receipt);
      const notificationResult = await this.persistNotifications(processed.notifications);

      return {
        ...processed,
        persisted: {
          event: eventResult,
          receipt: receiptResult,
          notifications: notificationResult
        }
      };
    },

    explain(processedEvent) {
      if (!processedEvent) {
        return "No event processed.";
      }

      return [
        `Event: ${processedEvent.event?.event_type || "--"}`,
        `Routes: ${(processedEvent.routed_roles || []).join(", ") || "--"}`,
        `Signal: ${processedEvent.generated_signal?.signal_type || "--"}`,
        `Receipt: ${processedEvent.receipt?.receipt_type || "--"}`
      ].join(" | ");
    }

  };

  window.STATScore.EventEngine = EventEngine;

  console.info("[STATScore] Event Engine Loaded:", EventEngine.version);

})(); 
