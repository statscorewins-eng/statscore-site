/* ============================================================
   STATScore™ Governance Sync Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Cross-Corridor Governance Sync → Policy Enforcement → Escalation Authority
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "sc-governance-sync-engine";
  const VERSION = "v1.0-multibox-brain";

  const GOVERNANCE_DOMAINS = {
    PARENT_APPROVAL: "PARENT_APPROVAL",
    RECRUITER_REQUESTS: "RECRUITER_REQUESTS",
    VISIBILITY_RULES: "VISIBILITY_RULES",
    MESSAGE_WINDOWS: "MESSAGE_WINDOWS",
    COUNSELOR_ACCESS: "COUNSELOR_ACCESS",
    AUDIT_TRAIL: "AUDIT_TRAIL",
    CAMP_COMBINE: "CAMP_COMBINE",
    CRYSTAL_REPORTS: "CRYSTAL_REPORTS",
    PROGRAM_INTELLIGENCE: "PROGRAM_INTELLIGENCE"
  };

  const GOVERNANCE_STATUS = {
    ACTIVE: "ACTIVE",
    CONTROLLED: "CONTROLLED",
    PARENT_GATED: "PARENT_GATED",
    REVIEW_REQUIRED: "REVIEW_REQUIRED",
    RESTRICTED: "RESTRICTED",
    FROZEN: "FROZEN",
    BLOCKED: "BLOCKED"
  };

  const DEFAULT_GOVERNANCE_STATE = {
    initialized: false,
    booted_at: null,
    updated_at: null,

    global_status: GOVERNANCE_STATUS.ACTIVE,

    active_athlete_id: null,
    active_snapshot_id: null,
    active_role: "SYSTEM",

    parent_approval: {
      status: GOVERNANCE_STATUS.PARENT_GATED,
      guardian_required: true,
      guardian_approved: false,
      last_decision: null
    },

    recruiter_requests: {
      status: GOVERNANCE_STATUS.REVIEW_REQUIRED,
      verified_recruiter_required: true,
      active_recruiter_id: null,
      trust_score: null,
      access_level: null
    },

    visibility_rules: {
      status: GOVERNANCE_STATUS.CONTROLLED,
      public_visibility: false,
      recruiter_visibility: GOVERNANCE_STATUS.RESTRICTED,
      counselor_visibility: GOVERNANCE_STATUS.CONTROLLED,
      coach_visibility: GOVERNANCE_STATUS.ACTIVE,
      parent_visibility: GOVERNANCE_STATUS.ACTIVE
    },

    message_windows: {
      status: GOVERNANCE_STATUS.CONTROLLED,
      recruiter_to_athlete: GOVERNANCE_STATUS.PARENT_GATED,
      coach_lane: GOVERNANCE_STATUS.ACTIVE,
      counselor_lane: GOVERNANCE_STATUS.CONTROLLED,
      evaluator_lane: GOVERNANCE_STATUS.CONTROLLED,
      off_platform_contact: GOVERNANCE_STATUS.BLOCKED
    },

    counselor_access: {
      status: GOVERNANCE_STATUS.CONTROLLED,
      transcript_access: GOVERNANCE_STATUS.CONTROLLED,
      academic_readiness_access: GOVERNANCE_STATUS.ACTIVE,
      athlete_private_data: GOVERNANCE_STATUS.RESTRICTED
    },

    audit_trail: {
      status: GOVERNANCE_STATUS.ACTIVE,
      receipts_required: true,
      blocked_events_visible: true,
      last_receipt_id: null
    },

    freeze: {
      active: false,
      reason: null,
      frozen_by: null,
      frozen_at: null
    },

    escalations: [],
    receipts: [],
    warnings: [],
    errors: []
  };

  let GOVERNANCE = structuredClone(DEFAULT_GOVERNANCE_STATE);

  function now() {
    return new Date().toISOString();
  }

  function log(message, payload) {
    console.log(`[STATScore Governance Sync] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Governance Sync] ${message}`, payload || "");

    GOVERNANCE.warnings.push({
      message,
      payload: payload || null,
      created_at: now()
    });
  }

  function error(message, payload) {
    console.error(`[STATScore Governance Sync] ${message}`, payload || "");

    GOVERNANCE.errors.push({
      message,
      payload: payload || null,
      created_at: now()
    });
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  }

  function publishGovernance() {
    window.STATScoreGovernanceState = GOVERNANCE;

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.GovernanceState = GOVERNANCE;

    return GOVERNANCE;
  }

  function getRuntimeState() {
    return (
      window.STATScoreRuntimeState ||
      window.STATScore?.RuntimeState ||
      null
    );
  }

  function getLedgerEngine() {
    return (
      window.STATScoreReceiptLedgerEngine ||
      window.STATScore?.ReceiptLedgerEngine ||
      null
    );
  }

  async function createGovernanceReceipt(type, payload = {}, options = {}) {
    const ledger = getLedgerEngine();

    let receipt = null;

    if (ledger?.createReceipt) {
      receipt = await ledger.createReceipt(
        type,
        {
          ...payload,
          governance_engine: ENGINE_ID,
          governance_version: VERSION
        },
        {
          status: options.status || payload.status || "RECORDED",
          actor_role: options.actor_role || payload.actor_role || GOVERNANCE.active_role,
          athlete_id: options.athlete_id || payload.athlete_id || GOVERNANCE.active_athlete_id,
          snapshot_id: options.snapshot_id || payload.snapshot_id || GOVERNANCE.active_snapshot_id,
          recruiter_id: options.recruiter_id || payload.recruiter_id || GOVERNANCE.recruiter_requests.active_recruiter_id,
          route: options.route || payload.route || null
        }
      );
    } else if (window.STATScoreRuntimeStateEngine?.createRuntimeReceipt) {
      receipt = window.STATScoreRuntimeStateEngine.createRuntimeReceipt(
        type,
        payload
      );
    } else {
      receipt = {
        receipt_id:
          "gov_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).slice(2, 8),
        receipt_type: normalize(type),
        payload,
        created_at: now()
      };
    }

    GOVERNANCE.receipts.push(receipt);
    GOVERNANCE.audit_trail.last_receipt_id = receipt.receipt_id || null;
    GOVERNANCE.updated_at = now();

    publishGovernance();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("governance_receipt_created", receipt);
    }

    return receipt;
  }

  function updateGovernance(patch = {}, meta = {}) {
    GOVERNANCE = {
      ...GOVERNANCE,
      ...patch,
      updated_at: now()
    };

    publishGovernance();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("governance_state_updated", {
        engine: ENGINE_ID,
        version: VERSION,
        meta,
        governance: clone(GOVERNANCE)
      });
    }

    return GOVERNANCE;
  }

  function hydrateFromRuntime() {
    const runtime = getRuntimeState();

    if (!runtime) {
      warn("Runtime state unavailable for governance hydration.");
      return GOVERNANCE;
    }

    const athlete = runtime.active_athlete || null;
    const recruiter = runtime.active_recruiter || null;
    const recruiterVerification = runtime.recruiter_verification || null;
    const multiboxEvaluation = runtime.multibox_evaluation || null;

    GOVERNANCE.active_athlete_id =
      athlete?.athlete_id ||
      runtime.active_athlete_id ||
      GOVERNANCE.active_athlete_id ||
      null;

    GOVERNANCE.active_snapshot_id =
      athlete?.snapshot_id ||
      runtime.active_snapshot_id ||
      GOVERNANCE.active_snapshot_id ||
      null;

    if (recruiter || recruiterVerification) {
      GOVERNANCE.recruiter_requests.active_recruiter_id =
        recruiterVerification?.recruiter_id ||
        recruiter?.recruiter_id ||
        recruiter?.verified_recruiter_id ||
        null;

      GOVERNANCE.recruiter_requests.trust_score =
        recruiterVerification?.trust_score ||
        null;

      GOVERNANCE.recruiter_requests.access_level =
        recruiterVerification?.access_level ||
        null;

      if (recruiterVerification?.verification_status === "VERIFIED") {
        GOVERNANCE.recruiter_requests.status = GOVERNANCE_STATUS.CONTROLLED;
      } else if (recruiterVerification?.verification_status === "RESTRICTED") {
        GOVERNANCE.recruiter_requests.status = GOVERNANCE_STATUS.RESTRICTED;
      } else {
        GOVERNANCE.recruiter_requests.status = GOVERNANCE_STATUS.REVIEW_REQUIRED;
      }
    }

    if (multiboxEvaluation?.decision?.status) {
      const status = normalize(multiboxEvaluation.decision.status);

      if (status === "REQUIRES_PARENT") {
        GOVERNANCE.message_windows.recruiter_to_athlete =
          GOVERNANCE_STATUS.PARENT_GATED;

        GOVERNANCE.parent_approval.status =
          GOVERNANCE_STATUS.PARENT_GATED;
      }

      if (status === "CLOSED" || status === "REQUIRES_VERIFICATION") {
        GOVERNANCE.message_windows.recruiter_to_athlete =
          GOVERNANCE_STATUS.BLOCKED;
      }
    }

    GOVERNANCE.updated_at = now();
    publishGovernance();

    return GOVERNANCE;
  }

  function evaluateParentApproval(context = {}) {
    const athlete =
      context.athlete ||
      getRuntimeState()?.active_athlete ||
      {};

    const guardianApproved =
      context.guardian_approved === true ||
      context.parent_approved === true ||
      GOVERNANCE.parent_approval.guardian_approved === true;

    const guardianRequired =
      context.guardian_required !== false;

    const status =
      guardianRequired && !guardianApproved
        ? GOVERNANCE_STATUS.PARENT_GATED
        : GOVERNANCE_STATUS.ACTIVE;

    GOVERNANCE.parent_approval = {
      ...GOVERNANCE.parent_approval,
      status,
      guardian_required: guardianRequired,
      guardian_approved: guardianApproved,
      last_decision: {
        status,
        athlete_id: athlete.athlete_id || GOVERNANCE.active_athlete_id || null,
        snapshot_id: athlete.snapshot_id || GOVERNANCE.active_snapshot_id || null,
        created_at: now()
      }
    };

    publishGovernance();

    return GOVERNANCE.parent_approval;
  }

  function evaluateRecruiterAccess(context = {}) {
    const recruiterVerification =
      context.recruiter_verification ||
      window.STATScoreCurrentRecruiterVerification ||
      getRuntimeState()?.recruiter_verification ||
      null;

    let status = GOVERNANCE_STATUS.REVIEW_REQUIRED;

    if (!recruiterVerification) {
      status = GOVERNANCE_STATUS.REVIEW_REQUIRED;
    } else if (recruiterVerification.access_level === "FULL_GOVERNED_ACCESS") {
      status = GOVERNANCE_STATUS.CONTROLLED;
    } else if (recruiterVerification.access_level === "COACH_COUNSELOR_ONLY") {
      status = GOVERNANCE_STATUS.CONTROLLED;
    } else if (recruiterVerification.access_level === "BLOCKED") {
      status = GOVERNANCE_STATUS.BLOCKED;
    } else {
      status = GOVERNANCE_STATUS.REVIEW_REQUIRED;
    }

    GOVERNANCE.recruiter_requests = {
      ...GOVERNANCE.recruiter_requests,
      status,
      active_recruiter_id:
        recruiterVerification?.recruiter_id ||
        recruiterVerification?.verified_recruiter_id ||
        GOVERNANCE.recruiter_requests.active_recruiter_id ||
        null,
      trust_score:
        recruiterVerification?.trust_score ||
        GOVERNANCE.recruiter_requests.trust_score ||
        null,
      access_level:
        recruiterVerification?.access_level ||
        GOVERNANCE.recruiter_requests.access_level ||
        null
    };

    publishGovernance();

    return GOVERNANCE.recruiter_requests;
  }

  function evaluateVisibility(context = {}) {
    const parentApproval =
      evaluateParentApproval(context);

    const recruiterAccess =
      evaluateRecruiterAccess(context);

    const visibility = {
      ...GOVERNANCE.visibility_rules
    };

    visibility.public_visibility = false;

    visibility.parent_visibility =
      GOVERNANCE_STATUS.ACTIVE;

    visibility.coach_visibility =
      GOVERNANCE_STATUS.ACTIVE;

    visibility.counselor_visibility =
      GOVERNANCE_STATUS.CONTROLLED;

    if (
      recruiterAccess.status === GOVERNANCE_STATUS.CONTROLLED &&
      parentApproval.status !== GOVERNANCE_STATUS.PARENT_GATED
    ) {
      visibility.recruiter_visibility =
        GOVERNANCE_STATUS.CONTROLLED;
    } else if (recruiterAccess.status === GOVERNANCE_STATUS.BLOCKED) {
      visibility.recruiter_visibility =
        GOVERNANCE_STATUS.BLOCKED;
    } else {
      visibility.recruiter_visibility =
        GOVERNANCE_STATUS.RESTRICTED;
    }

    GOVERNANCE.visibility_rules = visibility;
    GOVERNANCE.updated_at = now();

    publishGovernance();

    return visibility;
  }

  function evaluateMessageWindows(context = {}) {
    const parentApproval =
      evaluateParentApproval(context);

    const recruiterAccess =
      evaluateRecruiterAccess(context);

    const windows = {
      ...GOVERNANCE.message_windows
    };

    windows.coach_lane =
      GOVERNANCE_STATUS.ACTIVE;

    windows.counselor_lane =
      GOVERNANCE_STATUS.CONTROLLED;

    windows.evaluator_lane =
      GOVERNANCE_STATUS.CONTROLLED;

    windows.off_platform_contact =
      GOVERNANCE_STATUS.BLOCKED;

    if (recruiterAccess.status === GOVERNANCE_STATUS.BLOCKED) {
      windows.recruiter_to_athlete =
        GOVERNANCE_STATUS.BLOCKED;
    } else if (parentApproval.status === GOVERNANCE_STATUS.PARENT_GATED) {
      windows.recruiter_to_athlete =
        GOVERNANCE_STATUS.PARENT_GATED;
    } else {
      windows.recruiter_to_athlete =
        GOVERNANCE_STATUS.CONTROLLED;
    }

    GOVERNANCE.message_windows = windows;
    GOVERNANCE.updated_at = now();

    publishGovernance();

    return windows;
  }

  function evaluateCounselorAccess(context = {}) {
    const counselor = {
      ...GOVERNANCE.counselor_access
    };

    counselor.academic_readiness_access =
      GOVERNANCE_STATUS.ACTIVE;

    counselor.transcript_access =
      context.transcript_authorized === true
        ? GOVERNANCE_STATUS.ACTIVE
        : GOVERNANCE_STATUS.CONTROLLED;

    counselor.athlete_private_data =
      GOVERNANCE_STATUS.RESTRICTED;

    counselor.status =
      GOVERNANCE_STATUS.CONTROLLED;

    GOVERNANCE.counselor_access = counselor;
    GOVERNANCE.updated_at = now();

    publishGovernance();

    return counselor;
  }

  function syncAllGovernance(context = {}) {
    hydrateFromRuntime();

    const parent =
      evaluateParentApproval(context);

    const recruiter =
      evaluateRecruiterAccess(context);

    const visibility =
      evaluateVisibility(context);

    const windows =
      evaluateMessageWindows(context);

    const counselor =
      evaluateCounselorAccess(context);

    const result = {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      global_status:
        GOVERNANCE.global_status,

      parent_approval:
        parent,

      recruiter_requests:
        recruiter,

      visibility_rules:
        visibility,

      message_windows:
        windows,

      counselor_access:
        counselor,

      freeze:
        GOVERNANCE.freeze,

      synced_at:
        now()
    };

    createGovernanceReceipt(
      "GOVERNANCE_SYNC_COMPLETED",
      result,
      {
        status: "SYNCED"
      }
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        "governance_sync_completed",
        result
      );
    }

    return result;
  }

  function freezeGovernance(reason, actor = {}) {
    GOVERNANCE.global_status =
      GOVERNANCE_STATUS.FROZEN;

    GOVERNANCE.freeze = {
      active: true,
      reason: reason || "Governance freeze activated.",
      frozen_by:
        actor.actor_id ||
        actor.user_id ||
        actor.role ||
        "SYSTEM",
      frozen_at: now()
    };

    GOVERNANCE.updated_at = now();

    publishGovernance();

    createGovernanceReceipt(
      "GOVERNANCE_FREEZE_ACTIVATED",
      {
        reason: GOVERNANCE.freeze.reason,
        frozen_by: GOVERNANCE.freeze.frozen_by
      },
      {
        status: "FROZEN"
      }
    );

    return GOVERNANCE.freeze;
  }

  function unfreezeGovernance(actor = {}) {
    GOVERNANCE.global_status =
      GOVERNANCE_STATUS.ACTIVE;

    const previousFreeze =
      clone(GOVERNANCE.freeze);

    GOVERNANCE.freeze = {
      active: false,
      reason: null,
      frozen_by: null,
      frozen_at: null
    };

    GOVERNANCE.updated_at = now();

    publishGovernance();

    createGovernanceReceipt(
      "GOVERNANCE_FREEZE_RELEASED",
      {
        previous_freeze: previousFreeze,
        released_by:
          actor.actor_id ||
          actor.user_id ||
          actor.role ||
          "SYSTEM"
      },
      {
        status: "ACTIVE"
      }
    );

    return GOVERNANCE.freeze;
  }

  function escalateGovernance(issue = {}) {
    const escalation = {
      escalation_id:
        "gov_esc_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      issue_type:
        issue.issue_type || "GENERAL_GOVERNANCE_REVIEW",

      severity:
        issue.severity || "MEDIUM",

      athlete_id:
        issue.athlete_id || GOVERNANCE.active_athlete_id || null,

      snapshot_id:
        issue.snapshot_id || GOVERNANCE.active_snapshot_id || null,

      recruiter_id:
        issue.recruiter_id || GOVERNANCE.recruiter_requests.active_recruiter_id || null,

      description:
        issue.description || "Governance issue requires review.",

      status:
        "OPEN",

      created_at:
        now()
    };

    GOVERNANCE.escalations.push(escalation);
    GOVERNANCE.updated_at = now();

    publishGovernance();

    createGovernanceReceipt(
      "GOVERNANCE_ESCALATION_CREATED",
      escalation,
      {
        status: "ESCALATED",
        athlete_id: escalation.athlete_id,
        snapshot_id: escalation.snapshot_id,
        recruiter_id: escalation.recruiter_id
      }
    );

    return escalation;
  }

  function canRouteCommunication(context = {}) {
    if (GOVERNANCE.freeze.active) {
      return {
        allowed: false,
        status: GOVERNANCE_STATUS.FROZEN,
        reason: GOVERNANCE.freeze.reason,
        route: "GOVERNANCE_FROZEN"
      };
    }

    const fromRole = normalize(context.from_role);
    const toRole = normalize(context.to_role);

    syncAllGovernance(context);

    if (
      fromRole === "RECRUITER" &&
      toRole === "ATHLETE"
    ) {
      const status =
        GOVERNANCE.message_windows.recruiter_to_athlete;

      if (status === GOVERNANCE_STATUS.BLOCKED) {
        return {
          allowed: false,
          status,
          reason: "Recruiter-to-athlete contact is blocked.",
          route: "BLOCKED_RECRUITER_ATHLETE"
        };
      }

      if (status === GOVERNANCE_STATUS.PARENT_GATED) {
        return {
          allowed: true,
          status,
          reason: "Recruiter-to-athlete contact requires parent gate.",
          route: "PARENT_GUARDIAN_GATE"
        };
      }

      return {
        allowed: true,
        status,
        reason: "Recruiter-to-athlete contact is controlled.",
        route: "CONTROLLED_RECRUITER_WINDOW"
      };
    }

    if (
      toRole === "COUNSELOR" ||
      fromRole === "COUNSELOR"
    ) {
      return {
        allowed: true,
        status: GOVERNANCE.counselor_access.status,
        reason: "Counselor communication remains in controlled academic lane.",
        route: "COUNSELOR_ACADEMIC_LANE"
      };
    }

    if (
      fromRole === "COACH" ||
      fromRole === "HEAD_COACH" ||
      fromRole === "POSITION_COACH" ||
      toRole === "COACH" ||
      toRole === "HEAD_COACH" ||
      toRole === "POSITION_COACH"
    ) {
      return {
        allowed: true,
        status: GOVERNANCE_STATUS.ACTIVE,
        reason: "Coach support lane is open through governed communication.",
        route: "COACH_SUPPORT_LANE"
      };
    }

    return {
      allowed: true,
      status: GOVERNANCE_STATUS.CONTROLLED,
      reason: "Default governed communication route.",
      route: "CONTROLLED_SYSTEM_ROUTE"
    };
  }

  function renderGovernanceSyncPanel(container, syncResult) {
    if (!container) return false;

    const result =
      syncResult ||
      {
        ok: true,
        global_status: GOVERNANCE.global_status,
        parent_approval: GOVERNANCE.parent_approval,
        recruiter_requests: GOVERNANCE.recruiter_requests,
        visibility_rules: GOVERNANCE.visibility_rules,
        message_windows: GOVERNANCE.message_windows,
        counselor_access: GOVERNANCE.counselor_access
      };

    const statusColor =
      GOVERNANCE.freeze.active
        ? "#ff4d4d"
        : "#2bdc65";

    container.innerHTML = `
      <div style="
        border:1px solid ${statusColor};
        background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(0,0,0,.35));
        padding:20px;
        color:#f4f4ef;
        box-shadow:0 14px 34px rgba(0,0,0,.55);
      ">

        <div style="
          color:${statusColor};
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          STATScore Governance Sync
        </div>

        <div style="
          margin-top:10px;
          font-size:30px;
          font-weight:1000;
          color:${statusColor};
        ">
          ${result.global_status || GOVERNANCE.global_status}
        </div>

        <div style="
          margin-top:16px;
          display:grid;
          gap:10px;
        ">

          ${[
            ["Parent Approval", GOVERNANCE.parent_approval.status],
            ["Recruiter Requests", GOVERNANCE.recruiter_requests.status],
            ["Visibility Rules", GOVERNANCE.visibility_rules.status],
            ["Message Windows", GOVERNANCE.message_windows.status],
            ["Counselor Access", GOVERNANCE.counselor_access.status],
            ["Audit Trail", GOVERNANCE.audit_trail.status]
          ].map(([label, status]) => `
            <div style="
              border:1px solid rgba(255,255,255,.1);
              background:rgba(0,0,0,.24);
              padding:12px;
              display:flex;
              justify-content:space-between;
              gap:12px;
              align-items:center;
            ">
              <div style="
                font-size:12px;
                font-weight:900;
                letter-spacing:.1em;
                text-transform:uppercase;
              ">
                ${label}
              </div>

              <div style="
                color:#ffb100;
                font-size:11px;
                font-weight:1000;
                letter-spacing:.1em;
                text-transform:uppercase;
              ">
                ${status}
              </div>
            </div>
          `).join("")}

        </div>

      </div>
    `;

    return true;
  }

  function runAndRender() {
    const result =
      syncAllGovernance();

    const panel =
      document.querySelector("#scGovernanceSyncPanel") ||
      document.querySelector("[data-governance-sync-panel]");

    if (panel) {
      renderGovernanceSyncPanel(panel, result);
    }

    return result;
  }

  function bindEngineBus() {
    if (!window.STATScoreEngineBus?.on) return;

    window.STATScoreEngineBus.on("runtime_state_updated", () => {
      hydrateFromRuntime();
    });

    window.STATScoreEngineBus.on("ledger_receipt_created", (receipt) => {
      GOVERNANCE.audit_trail.last_receipt_id =
        receipt?.receipt_id ||
        GOVERNANCE.audit_trail.last_receipt_id;

      GOVERNANCE.updated_at = now();
      publishGovernance();
    });

    window.STATScoreEngineBus.on("multibox_route_evaluated", (payload) => {
      if (payload?.decision?.status === "REQUIRES_PARENT") {
        GOVERNANCE.parent_approval.status =
          GOVERNANCE_STATUS.PARENT_GATED;

        GOVERNANCE.message_windows.recruiter_to_athlete =
          GOVERNANCE_STATUS.PARENT_GATED;
      }

      if (payload?.blocked) {
        escalateGovernance({
          issue_type: "MULTIBOX_ROUTE_BLOCKED",
          severity: "MEDIUM",
          description:
            payload?.decision?.reason ||
            "Multi-Box route was blocked.",
          athlete_id:
            payload?.receipt?.athlete_id ||
            null,
          snapshot_id:
            payload?.receipt?.snapshot_id ||
            null
        });
      }

      publishGovernance();
    });

    window.STATScoreEngineBus.on("camp_meeting_receipt_created", (payload) => {
      createGovernanceReceipt(
        "CAMP_MEETING_GOVERNANCE_SYNC",
        payload,
        {
          status:
            payload?.status ||
            "RECORDED",
          athlete_id:
            payload?.athlete_id ||
            null,
          recruiter_id:
            payload?.recruiter_id ||
            null,
          event_id:
            payload?.camp_or_event_id ||
            null
        }
      );
    });
  }

  function expose() {
    window.STATScoreGovernanceSyncEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      governance_domains: GOVERNANCE_DOMAINS,
      governance_status: GOVERNANCE_STATUS,

      getGovernance: () => clone(GOVERNANCE),
      publishGovernance,
      updateGovernance,
      hydrateFromRuntime,

      evaluateParentApproval,
      evaluateRecruiterAccess,
      evaluateVisibility,
      evaluateMessageWindows,
      evaluateCounselorAccess,

      syncAllGovernance,
      canRouteCommunication,

      freezeGovernance,
      unfreezeGovernance,
      escalateGovernance,

      createGovernanceReceipt,
      renderGovernanceSyncPanel,
      runAndRender
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.GovernanceSyncEngine =
      window.STATScoreGovernanceSyncEngine;

    publishGovernance();
  }

  function init() {
    if (window.__SC_GOVERNANCE_SYNC_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__SC_GOVERNANCE_SYNC_ENGINE__ = true;

    GOVERNANCE.initialized = true;
    GOVERNANCE.booted_at = now();
    GOVERNANCE.updated_at = now();

    expose();
    bindEngineBus();

    hydrateFromRuntime();

    createGovernanceReceipt(
      "GOVERNANCE_SYNC_ENGINE_ONLINE",
      {
        engine_id: ENGINE_ID,
        version: VERSION
      },
      {
        status: "ONLINE"
      }
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
    }

    const panel =
      document.querySelector("#scGovernanceSyncPanel") ||
      document.querySelector("[data-governance-sync-panel]");

    if (panel) {
      runAndRender();
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
