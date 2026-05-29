/* ============================================================
   STATScore™ Parent Approval Engine
   File: statscore-parent-approval-engine.js
   Version: 1.0.1
   Purpose:
   Parent/guardian permission-scope governance for:
   - profile participation
   - public visibility
   - recruiter access
   - messaging access
   - media exposure
   - counselor access

   IMPORTANT:
   This engine does NOT overwrite document.body.
   It only hydrates existing parent-approval.html data-* hooks.
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "STATScoreParentApprovalEngine";
  const ENGINE_VERSION = "1.0.1";

  const DEFAULT_SCOPE = {
    profile_participation: false,
    public_visibility: false,
    recruiter_access: false,
    messaging_access: false,
    media_exposure: false,
    counselor_access: false
  };

  const DEFAULT_TEST_SCOPE = {
    profile_participation: true,
    public_visibility: false,
    recruiter_access: false,
    messaging_access: false,
    media_exposure: false,
    counselor_access: false
  };

  const STATE = {
    snapshot_id: null,
    currentRequest: null,
    guardian: null,
    athlete: null,
    initialized: false,
    actionsBound: false,
    lastError: null
  };

  function getSupabaseClient() {
    if (window.STATScoreSupabaseClient) return window.STATScoreSupabaseClient;
    if (window.supabaseClient) return window.supabaseClient;

    if (
      window.supabase &&
      window.STAT_SCORE_SUPABASE_URL &&
      window.STAT_SCORE_SUPABASE_ANON_KEY
    ) {
      window.STATScoreSupabaseClient = window.supabase.createClient(
        window.STAT_SCORE_SUPABASE_URL,
        window.STAT_SCORE_SUPABASE_ANON_KEY
      );

      return window.STATScoreSupabaseClient;
    }

    throw new Error(
      "Supabase client not found. Confirm anon key/client is loaded before Parent Approval Engine."
    );
  }

  function getSnapshotId() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("snapshot_id") ||
      params.get("snapshot") ||
      params.get("id") ||
      document.body?.dataset?.snapshotId ||
      "TEST001"
    );
  }

  function safeText(value, fallback) {
    if (value === null || value === undefined || value === "") {
      return fallback || "—";
    }

    return String(value);
  }

  function normalizeBool(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = safeText(value);
    });
  }

  function emit(eventName, detail) {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: Object.assign(
          {
            engine: ENGINE_ID,
            version: ENGINE_VERSION,
            timestamp: new Date().toISOString()
          },
          detail || {}
        )
      })
    );
  }

  function collectScopeFromDOM() {
    const scope = {};

    Object.keys(DEFAULT_SCOPE).forEach(function (key) {
      const input = document.querySelector("[data-scope='" + key + "']");
      scope[key] = normalizeBool(input && input.checked);
    });

    return scope;
  }

  function applyScopeToDOM(scope) {
    const merged = Object.assign({}, DEFAULT_SCOPE, scope || {});

    Object.keys(DEFAULT_SCOPE).forEach(function (key) {
      const input = document.querySelector("[data-scope='" + key + "']");
      if (input) input.checked = !!merged[key];
    });
  }

  function getScopeFromRequest(request) {
    if (!request) return Object.assign({}, DEFAULT_SCOPE);

    return {
      profile_participation: !!request.profile_participation,
      public_visibility: !!request.public_visibility,
      recruiter_access: !!request.recruiter_access,
      messaging_access: !!request.messaging_access,
      media_exposure: !!request.media_exposure,
      counselor_access: !!request.counselor_access
    };
  }

  function statusClass(status) {
    const clean = String(status || "pending").toLowerCase();

    if (clean === "approved") return "status approved";
    if (clean === "denied") return "status denied";
    if (clean === "revoked") return "status revoked";
    if (clean === "modified") return "status modified";

    return "status pending";
  }

  function renderStatus(status) {
    const clean = String(status || "pending").toLowerCase();

    const pill = document.querySelector("[data-status-pill]");
    if (pill) {
      pill.className = statusClass(clean);
      pill.textContent = clean;
    }

    document.body.dataset.parentApprovalStatus = clean;
    setText("[data-parent-approval-status]", clean);
  }

  function renderAudit(message, label) {
    const log = document.querySelector("[data-parent-audit-log]");
    if (!log) return;

    const item = document.createElement("div");
    item.className = "audit-item";

    const messageNode = document.createTextNode(
      safeText(message, "Runtime event.")
    );

    const span = document.createElement("span");
    span.textContent = safeText(label, "Runtime • Event");

    item.appendChild(messageNode);
    item.appendChild(span);

    log.prepend(item);
  }

  function renderInitials(name) {
    const initials = document.querySelector("[data-athlete-initials]");
    if (!initials) return;

    const clean = safeText(name, "SC");

    initials.textContent = clean
      .split(" ")
      .filter(Boolean)
      .map(function (part) {
        return part[0];
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  async function writeAuditEvent(payload) {
    const supabase = getSupabaseClient();

    const record = {
      approval_request_id: payload.approval_request_id || null,
      snapshot_id: payload.snapshot_id || STATE.snapshot_id,
      event_type: payload.event_type || "parent_approval_event",
      actor_role: payload.actor_role || "guardian",
      actor_name: payload.actor_name || STATE.guardian?.guardian_name || null,
      actor_email: payload.actor_email || STATE.guardian?.guardian_email || null,
      previous_status: payload.previous_status || null,
      new_status: payload.new_status || null,
      scope_snapshot: payload.scope_snapshot || DEFAULT_SCOPE,
      event_payload: payload.event_payload || {}
    };

    const { error } = await supabase
      .from("sc_parent_approval_audit_events")
      .insert(record);

    if (error) throw error;

    emit("statscore:parent-approval:audit-written", record);

    return record;
  }

  async function loadLatestApprovalRequest(snapshot_id) {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("sc_parent_approval_requests")
      .select("*")
      .eq("snapshot_id", snapshot_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    STATE.currentRequest = data || null;

    if (data) {
      STATE.guardian = {
        guardian_id: data.guardian_id,
        guardian_name: data.guardian_name,
        guardian_email: data.guardian_email
      };

      STATE.athlete = {
        athlete_id: data.athlete_id,
        athlete_name: data.athlete_name
      };
    }

    return data || null;
  }

  function renderApprovalRequest(request) {
    setText("[data-snapshot-id]", STATE.snapshot_id);

    if (!request) {
      setText("[data-athlete-name]", "No Athlete Loaded");
      setText("[data-requester-name]", "No Requester Loaded");
      setText("[data-requester-role]", "No Request Loaded");
      setText("[data-request-type]", "No Active Request");

      renderInitials("SC");
      renderStatus("pending");
      applyScopeToDOM(DEFAULT_SCOPE);

      renderAudit(
        "No approval request found for this snapshot.",
        "Runtime • No Request"
      );

      return;
    }

    setText("[data-athlete-name]", request.athlete_name || "Athlete");
    setText("[data-requester-name]", request.requester_name || "Requester");
    setText("[data-requester-role]", request.requester_role || "Requester Role");
    setText("[data-request-type]", request.request_type || "Permission Scope");

    renderInitials(request.athlete_name || "SC");
    renderStatus(request.status);
    applyScopeToDOM(getScopeFromRequest(request));
  }

  async function createApprovalRequest(payload) {
    const supabase = getSupabaseClient();
    const cleanPayload = payload || {};
    const scope = Object.assign({}, DEFAULT_SCOPE, cleanPayload.scope || {});

    const record = {
      snapshot_id: cleanPayload.snapshot_id || STATE.snapshot_id || getSnapshotId(),

      athlete_id: cleanPayload.athlete_id || null,
      athlete_name: cleanPayload.athlete_name || "Demo Athlete",

      guardian_id: cleanPayload.guardian_id || null,
      guardian_name: cleanPayload.guardian_name || "Parent / Guardian",
      guardian_email: cleanPayload.guardian_email || null,

      requester_id: cleanPayload.requester_id || null,
      requester_name: cleanPayload.requester_name || "STATScore System",
      requester_role: cleanPayload.requester_role || "system",
      requester_email: cleanPayload.requester_email || null,

      request_type: cleanPayload.request_type || "parent_permission_scope",

      profile_participation: !!scope.profile_participation,
      public_visibility: !!scope.public_visibility,
      recruiter_access: !!scope.recruiter_access,
      messaging_access: !!scope.messaging_access,
      media_exposure: !!scope.media_exposure,
      counselor_access: !!scope.counselor_access,

      status: "pending",

      parent_notes: cleanPayload.parent_notes || null,
      system_notes: cleanPayload.system_notes || null,
      expires_at: cleanPayload.expires_at || null
    };

    const { data, error } = await supabase
      .from("sc_parent_approval_requests")
      .insert(record)
      .select("*")
      .single();

    if (error) throw error;

    STATE.currentRequest = data;

    await writeAuditEvent({
      approval_request_id: data.approval_request_id,
      snapshot_id: data.snapshot_id,
      event_type: "approval_request_created",
      actor_role: record.requester_role,
      actor_name: record.requester_name,
      actor_email: record.requester_email,
      previous_status: null,
      new_status: "pending",
      scope_snapshot: scope,
      event_payload: data
    });

    renderApprovalRequest(data);

    emit("statscore:parent-approval:created", data);

    return data;
  }

  async function syncPlayerProfileGovernanceState(request) {
    if (!request) return null;

    const governanceState = {
      snapshot_id: request.snapshot_id,
      parent_approval_status: request.status,
      profile_participation: !!request.profile_participation,
      public_visibility: !!request.public_visibility,
      recruiter_access: !!request.recruiter_access,
      messaging_access: !!request.messaging_access,
      media_exposure: !!request.media_exposure,
      counselor_access: !!request.counselor_access,
      updated_at: new Date().toISOString()
    };

    window.STATScoreParentApprovalState = governanceState;

    try {
      localStorage.setItem(
        "statscore_parent_approval_" + request.snapshot_id,
        JSON.stringify(governanceState)
      );
    } catch (_) {}

    emit("statscore:player-profile:governance-state-updated", governanceState);

    return governanceState;
  }

  async function updateApprovalStatus(status, scopeOverride) {
    if (!STATE.currentRequest) {
      throw new Error("No parent approval request loaded.");
    }

    const supabase = getSupabaseClient();

    const previousStatus = STATE.currentRequest.status;
    const scope = Object.assign(
      {},
      DEFAULT_SCOPE,
      scopeOverride || collectScopeFromDOM()
    );

    const patch = {
      status: status,
      profile_participation: !!scope.profile_participation,
      public_visibility: !!scope.public_visibility,
      recruiter_access: !!scope.recruiter_access,
      messaging_access: !!scope.messaging_access,
      media_exposure: !!scope.media_exposure,
      counselor_access: !!scope.counselor_access,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("sc_parent_approval_requests")
      .update(patch)
      .eq("approval_request_id", STATE.currentRequest.approval_request_id)
      .select("*")
      .single();

    if (error) throw error;

    STATE.currentRequest = data;

    await writeAuditEvent({
      approval_request_id: data.approval_request_id,
      snapshot_id: data.snapshot_id,
      event_type: "approval_" + status,
      actor_role: "guardian",
      actor_name: data.guardian_name || "Parent / Guardian",
      actor_email: data.guardian_email || null,
      previous_status: previousStatus,
      new_status: status,
      scope_snapshot: scope,
      event_payload: data
    });

    await syncPlayerProfileGovernanceState(data);

    renderApprovalRequest(data);

    emit("statscore:parent-approval:updated", data);

    return data;
  }

  function approve(scopeOverride) {
    return updateApprovalStatus("approved", scopeOverride);
  }

  function deny() {
    return updateApprovalStatus("denied", DEFAULT_SCOPE);
  }

  function modify(scopeOverride) {
    return updateApprovalStatus("modified", scopeOverride || collectScopeFromDOM());
  }

  function revoke() {
    return updateApprovalStatus("revoked", DEFAULT_SCOPE);
  }

  function bindUIActions() {
    if (STATE.actionsBound) return;

    document.querySelectorAll("[data-parent-action='approve']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        approve().catch(handleError);
      });
    });

    document.querySelectorAll("[data-parent-action='deny']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deny().catch(handleError);
      });
    });

    document.querySelectorAll("[data-parent-action='modify']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        modify().catch(handleError);
      });
    });

    document.querySelectorAll("[data-parent-action='revoke']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        revoke().catch(handleError);
      });
    });

    STATE.actionsBound = true;
  }

  function handleError(error) {
    STATE.lastError = error;

    console.error("[STATScoreParentApprovalEngine]", error);

    document.body.dataset.parentApprovalError = "true";

    setText(
      "[data-parent-approval-error]",
      error.message || "Unknown parent approval runtime error."
    );

    renderAudit(
      error.message || "Unknown parent approval runtime error.",
      "Runtime • Error"
    );

    emit("statscore:parent-approval:error", {
      message: error.message || "Unknown parent approval runtime error.",
      error: error
    });
  }

  async function loadAndRender() {
    try {
      STATE.snapshot_id = getSnapshotId();

      document.body.dataset.snapshotId = STATE.snapshot_id;

      setText("[data-snapshot-id]", STATE.snapshot_id);

      bindUIActions();

      let request = await loadLatestApprovalRequest(STATE.snapshot_id);

      if (!request) {
        request = await createApprovalRequest({
          snapshot_id: STATE.snapshot_id,
          athlete_name: "Demo Athlete",
          guardian_name: "Parent / Guardian",
          requester_name: "STATScore System",
          requester_role: "system",
          request_type: "parent_permission_scope",
          scope: DEFAULT_TEST_SCOPE,
          system_notes: "Auto-created runtime test approval request."
        });
      }

      renderApprovalRequest(request);

      await syncPlayerProfileGovernanceState(request);

      renderAudit(
        "Parent approval engine loaded successfully.",
        "Runtime • Engine Active"
      );

      emit("statscore:parent-approval:loaded", {
        snapshot_id: STATE.snapshot_id,
        request: request
      });

      STATE.initialized = true;

      return request;
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  window.STATScoreParentApprovalEngine = {
    ENGINE_ID: ENGINE_ID,
    ENGINE_VERSION: ENGINE_VERSION,
    STATE: STATE,

    loadAndRender: loadAndRender,
    createApprovalRequest: createApprovalRequest,

    approve: approve,
    deny: deny,
    modify: modify,
    revoke: revoke,

    writeAuditEvent: writeAuditEvent,
    syncPlayerProfileGovernanceState: syncPlayerProfileGovernanceState,

    collectScopeFromDOM: collectScopeFromDOM,
    applyScopeToDOM: applyScopeToDOM
  };

  console.log(ENGINE_ID + " v" + ENGINE_VERSION + " loaded.");

})(); 
