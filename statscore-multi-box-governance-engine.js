/* ============================================================
   STATScore™ Multi-Box Governance Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Role-Based Communication Governance → NCAA-Safe Routing → Receipts
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-multibox-governance-engine";
  const VERSION = "v1.0-controlled-communication-spine";

  const ROLES = {
    ATHLETE: "ATHLETE",
    PARENT: "PARENT",
    HEAD_COACH: "HEAD_COACH",
    POSITION_COACH: "POSITION_COACH",
    COUNSELOR: "COUNSELOR",
    RECRUITER: "RECRUITER",
    EVALUATOR: "EVALUATOR",
    PROGRAM_ADMIN: "PROGRAM_ADMIN"
  };

  const COMMUNICATION_STATUS = {
    OPEN: {
      label: "Open",
      color: "#37d67a"
    },
    CONTROLLED: {
      label: "Controlled",
      color: "#9fe7ff"
    },
    RESTRICTED: {
      label: "Restricted",
      color: "#ffb100"
    },
    CLOSED: {
      label: "Closed",
      color: "#ff3434"
    },
    REQUIRES_PARENT: {
      label: "Parent / Guardian Required",
      color: "#ffb100"
    },
    REQUIRES_VERIFICATION: {
      label: "Verification Required",
      color: "#ff3434"
    }
  };

  function log(message, payload) {
    console.log(`[STATScore Multi-Box Governance] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Multi-Box Governance] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function isMinorAthlete(athlete) {
    const rawClass = String(athlete?.graduation_class || "").trim();
    const gradYear = Number(rawClass);

    if (!gradYear || Number.isNaN(gradYear)) {
      return true;
    }

    const currentYear = new Date().getFullYear();

    return gradYear >= currentYear;
  }

  function isVerifiedRecruiter(actor) {
    return !!(
      actor?.verified_recruiter_id ||
      actor?.recruiter_id ||
      normalize(actor?.verification_status).includes("VERIFIED")
    );
  }

  function hasGuardianRoute(athlete) {
    return !!(
      athlete?.guardian_name ||
      athlete?.guardian_email ||
      athlete?.guardian_phone
    );
  }

  function hasCoachRoute(athlete) {
    return !!(
      athlete?.coach_name ||
      athlete?.coach_email
    );
  }

  function isAlwaysOpenRole(role) {
    const r = normalize(role);

    return [
      ROLES.HEAD_COACH,
      ROLES.POSITION_COACH,
      ROLES.COUNSELOR,
      ROLES.EVALUATOR,
      ROLES.PROGRAM_ADMIN
    ].includes(r);
  }

  function isAthleteOrParent(role) {
    const r = normalize(role);

    return r === ROLES.ATHLETE || r === ROLES.PARENT;
  }

  function isRecruiter(role) {
    return normalize(role) === ROLES.RECRUITER;
  }

  function determineContactWindow(context = {}) {
    const athlete = context.athlete || {};
    const fromRole = normalize(context.from_role);
    const toRole = normalize(context.to_role);

    const actor = context.actor || {};
    const target = context.target || {};

    const athleteInvolved =
      fromRole === ROLES.ATHLETE ||
      toRole === ROLES.ATHLETE ||
      fromRole === ROLES.PARENT ||
      toRole === ROLES.PARENT;

    const recruiterInvolved =
      fromRole === ROLES.RECRUITER ||
      toRole === ROLES.RECRUITER;

    if (!fromRole || !toRole) {
      return {
        status: "RESTRICTED",
        reason: "Missing sender or recipient role.",
        route: "REVIEW_REQUIRED"
      };
    }

    if (isAlwaysOpenRole(fromRole) && isAlwaysOpenRole(toRole)) {
      return {
        status: "OPEN",
        reason: "Professional support roles may communicate through governed system channels.",
        route: "DIRECT_GOVERNED"
      };
    }

    if (recruiterInvolved) {
      const recruiterActor = isRecruiter(fromRole) ? actor : target;

      if (!isVerifiedRecruiter(recruiterActor)) {
        return {
          status: "REQUIRES_VERIFICATION",
          reason: "Recruiter communication requires verified recruiter identity.",
          route: "BLOCK_RECRUITER_UNVERIFIED"
        };
      }

      if (athleteInvolved) {
        if (isMinorAthlete(athlete)) {
          if (!hasGuardianRoute(athlete)) {
            return {
              status: "CLOSED",
              reason: "Minor athlete route requires parent/guardian contact before recruiter communication.",
              route: "BLOCK_NO_GUARDIAN"
            };
          }

          return {
            status: "REQUIRES_PARENT",
            reason: "Recruiter-to-athlete communication must route through parent/guardian-controlled channel.",
            route: "PARENT_GUARDIAN_GATE"
          };
        }

        return {
          status: "CONTROLLED",
          reason: "Recruiter communication is controlled and must be logged by STATScore.",
          route: "RECRUITER_CONTROLLED_WINDOW"
        };
      }

      return {
        status: "OPEN",
        reason: "Verified recruiter communication with coach/counselor/evaluator lane is open.",
        route: "DIRECT_GOVERNED"
      };
    }

    if (isAthleteOrParent(fromRole) || isAthleteOrParent(toRole)) {
      return {
        status: "CONTROLLED",
        reason: "Athlete and parent communication routes remain controlled and logged.",
        route: "CONTROLLED_FAMILY_CHANNEL"
      };
    }

    return {
      status: "CONTROLLED",
      reason: "Default governed communication route.",
      route: "CONTROLLED_SYSTEM_CHANNEL"
    };
  }

  function createReceipt(context = {}, decision = {}) {
    return {
      receipt_id:
        "mbx_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      engine_id: ENGINE_ID,
      version: VERSION,

      athlete_id: context.athlete?.athlete_id || null,
      snapshot_id: context.athlete?.snapshot_id || null,

      from_role: normalize(context.from_role),
      to_role: normalize(context.to_role),

      from_actor_id:
        context.actor?.actor_id ||
        context.actor?.recruiter_id ||
        context.actor?.coach_id ||
        context.actor?.guardian_id ||
        null,

      to_actor_id:
        context.target?.actor_id ||
        context.target?.recruiter_id ||
        context.target?.coach_id ||
        context.target?.guardian_id ||
        null,

      communication_status: decision.status,
      route: decision.route,
      reason: decision.reason,

      message_type:
        context.message_type || "GENERAL",

      subject:
        context.subject || null,

      camp_or_event_id:
        context.camp_or_event_id || null,

      requires_parent:
        decision.status === "REQUIRES_PARENT",

      requires_verification:
        decision.status === "REQUIRES_VERIFICATION",

      blocked:
        decision.status === "CLOSED" ||
        decision.status === "REQUIRES_VERIFICATION",

      created_at:
        new Date().toISOString()
    };
  }

  function evaluateCommunication(context = {}) {
    const decision = determineContactWindow(context);
    const receipt = createReceipt(context, decision);

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      decision,
      receipt,

      allowed:
        decision.status === "OPEN" ||
        decision.status === "CONTROLLED" ||
        decision.status === "REQUIRES_PARENT",

      blocked:
        receipt.blocked,

      governance_label:
        COMMUNICATION_STATUS[decision.status]?.label || decision.status,

      governance_color:
        COMMUNICATION_STATUS[decision.status]?.color || "#9fe7ff"
    };
  }

  function routeMessage(context = {}) {
    const evaluation = evaluateCommunication(context);

    window.STATScoreLastMultiBoxEvaluation = evaluation;

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("multibox_route_evaluated", evaluation);
    }

    return evaluation;
  }

  function confirmCampMeeting(payload = {}) {
    const receipt = {
      receipt_id:
        "camp_meet_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      engine_id: ENGINE_ID,
      version: VERSION,

      type: "CAMP_COMBINE_MEETING_CONFIRMATION",

      athlete_id: payload.athlete_id || null,
      recruiter_id: payload.recruiter_id || null,
      verified_recruiter_id: payload.verified_recruiter_id || null,
      coach_id: payload.coach_id || null,
      program_id: payload.program_id || null,

      camp_or_event_id: payload.camp_or_event_id || null,
      camp_name: payload.camp_name || null,

      scheduled_meeting_date: payload.scheduled_meeting_date || null,
      actual_meeting_confirmed: !!payload.actual_meeting_confirmed,

      confirmed_by:
        payload.confirmed_by || "SYSTEM",

      status:
        payload.actual_meeting_confirmed
          ? "MEETING_CONFIRMED"
          : "MEETING_PENDING_CONFIRMATION",

      created_at:
        new Date().toISOString()
    };

    window.STATScoreLastCampMeetingReceipt = receipt;

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("camp_meeting_receipt_created", receipt);
    }

    return receipt;
  }

  function renderGovernancePanel(container, evaluation) {
    if (!container || !evaluation) return false;

    const color = evaluation.governance_color;

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
          ${evaluation.governance_label}
        </div>

        <div style="
          margin-top:8px;
          color:#9fe7ff;
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:900;
        ">
          Route: ${evaluation.decision.route}
        </div>

        <div style="
          margin-top:14px;
          color:#d6deea;
          font-size:13px;
          line-height:1.5;
        ">
          ${evaluation.decision.reason}
        </div>

        <div style="
          margin-top:16px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:12px;
          color:#7f8a99;
          font-size:11px;
          line-height:1.45;
        ">
          Receipt:
          ${evaluation.receipt.receipt_id}
        </div>

      </div>
    `;

    return true;
  }

  function runCurrentGovernanceCheck() {
    const context =
      window.STATScoreCurrentMultiBoxContext ||
      null;

    if (!context) {
      warn("No current Multi-Box context found.");
      return null;
    }

    const evaluation = routeMessage(context);

    const panel =
      document.querySelector("#scMultiBoxGovernancePanel") ||
      document.querySelector("[data-multibox-governance-panel]");

    if (panel) {
      renderGovernancePanel(panel, evaluation);
    }

    return evaluation;
  }

  function init() {
    if (window.__STATSCORE_MULTIBOX_GOVERNANCE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_MULTIBOX_GOVERNANCE_ENGINE__ = true;

    window.STATScoreMultiBoxGovernanceEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      roles: ROLES,
      communication_status: COMMUNICATION_STATUS,

      determineContactWindow,
      evaluateCommunication,
      routeMessage,
      createReceipt,
      confirmCampMeeting,
      renderGovernancePanel,
      runCurrentGovernanceCheck
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.MultiBoxGovernanceEngine =
      window.STATScoreMultiBoxGovernanceEngine;

    const result = runCurrentGovernanceCheck();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        governance_checked: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      governance_checked: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
