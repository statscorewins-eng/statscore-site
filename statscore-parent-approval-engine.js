/* ============================================================
STATScore™ Parent Approval Engine
File: statscore-parent-approval-engine.js
Version: 1.1.0
============================================================ */

(function () {
"use strict";

const ENGINE_ID = "STATScoreParentApprovalEngine";
const ENGINE_VERSION = "1.1.0";

const DEFAULT_SCOPE = {
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
lastError: null
};

function getSupabaseClient() {
if (window.STATScoreSupabase) return window.STATScoreSupabase;
if (window.STATScoreSupabaseClient) return window.STATScoreSupabaseClient;
if (window.supabaseClient) return window.supabaseClient;
if (window.STATScoreData?.getClient) return window.STATScoreData.getClient();

throw new Error("Supabase client not found. Load Supabase before Parent Approval Engine.");

}

function getSnapshotId() {
const params = new URLSearchParams(window.location.search);
return (
params.get("snapshot_id") ||
params.get("snapshot") ||
params.get("id") ||
document.body?.dataset?.snapshotId ||
null
);
}

function setText(selector, value) {
document.querySelectorAll(selector).forEach(el => {
el.textContent = value || "—";
});
}

function normalizeStatus(status) {
return String(status || "pending").toLowerCase();
}

function collectScopeFromDOM() {
const scope = {};
Object.keys(DEFAULT_SCOPE).forEach(key => {
const input = document.querySelector([data-scope="${key}"]);
scope[key] = input ? !!input.checked : DEFAULT_SCOPE[key];
});
return scope;
}

function applyScopeToDOM(scope) {
const finalScope = Object.assign({}, DEFAULT_SCOPE, scope || {});
Object.keys(DEFAULT_SCOPE).forEach(key => {
const input = document.querySelector([data-scope="${key}"]);
if (input) input.checked = !!finalScope[key];
});
}

function renderStatus(status) {
const clean = normalizeStatus(status);
const pill = document.querySelector("[data-status-pill]");

if (pill) { 
  pill.className = `status ${clean}`; 
  pill.textContent = clean.toUpperCase(); 
} 

document.body.dataset.parentApprovalStatus = clean; 
setText("[data-parent-approval-status]", clean.toUpperCase());

}

function renderAudit(message, label) {
const log = document.querySelector("[data-parent-audit-log]");
if (!log) return;

const item = document.createElement("div"); 
item.className = "audit-item"; 
item.innerHTML = ` 
  ${String(message || "Runtime event.")} 
  <span>${String(label || "Runtime • Event")}</span> 
`; 

log.prepend(item);

}

function getScopeFromRequest(request) {
return {
profile_participation: !!request.profile_participation,
public_visibility: !!request.public_visibility,
recruiter_access: !!request.recruiter_access,
messaging_access: !!request.messaging_access,
media_exposure: !!request.media_exposure,
counselor_access: !!request.counselor_access
};
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
return data || null;

}

async function writeAuditEvent(payload) {
const supabase = getSupabaseClient();

const record = { 
  approval_request_id: payload.approval_request_id || null, 
  snapshot_id: payload.snapshot_id || STATE.snapshot_id, 
  event_type: payload.event_type || "parent_approval_event", 
  actor_role: payload.actor_role || "guardian", 
  actor_name: payload.actor_name || null, 
  actor_email: payload.actor_email || null, 
  previous_status: payload.previous_status || null, 
  new_status: payload.new_status || null, 
  scope_snapshot: payload.scope_snapshot || DEFAULT_SCOPE, 
  event_payload: payload.event_payload || {} 
}; 

const { error } = await supabase 
  .from("sc_parent_approval_audit_events") 
  .insert(record); 

if (error) throw error; 

return record;

}

async function createApprovalRequest(payload) {
const supabase = getSupabaseClient();
const scope = Object.assign({}, DEFAULT_SCOPE, payload?.scope || {});

const record = { 
  snapshot_id: payload.snapshot_id, 

  athlete_id: payload.athlete_id || null, 
  athlete_name: payload.athlete_name || "Athlete", 

  guardian_id: payload.guardian_id || null, 
  guardian_name: payload.guardian_name || "Parent / Guardian", 
  guardian_email: payload.guardian_email || null, 

  requester_id: payload.requester_id || null, 
  requester_name: payload.requester_name || "STATScore System", 
  requester_role: payload.requester_role || "system", 
  requester_email: payload.requester_email || null, 

  request_type: payload.request_type || "parent_permission_scope", 

  profile_participation: !!scope.profile_participation, 
  public_visibility: !!scope.public_visibility, 
  recruiter_access: !!scope.recruiter_access, 
  messaging_access: !!scope.messaging_access, 
  media_exposure: !!scope.media_exposure, 
  counselor_access: !!scope.counselor_access, 

  status: "pending", 
  parent_notes: payload.parent_notes || null, 
  system_notes: payload.system_notes || null, 
  expires_at: payload.expires_at || null 
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
  actor_role: "system", 
  actor_name: "STATScore System", 
  previous_status: null, 
  new_status: "pending", 
  scope_snapshot: scope, 
  event_payload: data 
}); 

return data;

}

function renderApprovalRequest(request) {
setText("[data-snapshot-id]", STATE.snapshot_id);

if (!request) { 
  setText("[data-athlete-name]", "No Athlete Loaded"); 
  setText("[data-requester-name]", "No Requester Loaded"); 
  setText("[data-requester-role]", "No Request Loaded"); 
  setText("[data-request-type]", "No Active Request"); 
  renderStatus("pending"); 
  applyScopeToDOM(DEFAULT_SCOPE); 
  return; 
} 

setText("[data-athlete-name]", request.athlete_name || "Athlete"); 
setText("[data-requester-name]", request.requester_name || "STATScore System"); 
setText("[data-requester-role]", request.requester_role || "System"); 
setText("[data-request-type]", request.request_type || "Permission Scope"); 

renderStatus(request.status); 
applyScopeToDOM(getScopeFromRequest(request));

}

async function syncPlayerProfileGovernanceState(request) {
if (!request) return null;

const state = { 
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

window.STATScoreParentApprovalState = state; 

localStorage.setItem( 
  `statscore_parent_approval_${request.snapshot_id}`, 
  JSON.stringify(state) 
); 

return state;

}

async function updateApprovalStatus(status, scopeOverride) {
if (!STATE.currentRequest) {
throw new Error("No parent approval request loaded.");
}

const supabase = getSupabaseClient(); 
const previousStatus = STATE.currentRequest.status; 
const scope = Object.assign({}, DEFAULT_SCOPE, scopeOverride || collectScopeFromDOM()); 

const patch = { 
  status, 
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
  event_type: `approval_${status}`, 
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
renderAudit(`Parent approval status updated to ${status}.`, "Logged • Governed Action"); 

return data;

}

function handleError(error) {
STATE.lastError = error;
console.error("[STATScoreParentApprovalEngine]", error);
setText("[data-parent-approval-error]", error.message || "Unknown parent approval error.");
renderAudit(error.message || "Runtime error.", "Runtime • Error");
}

function bindUIActions() {
document.querySelectorAll("[data-parent-action='approve']").forEach(btn => {
btn.onclick = () => updateApprovalStatus("approved").catch(handleError);
});

document.querySelectorAll("[data-parent-action='deny']").forEach(btn => { 
  btn.onclick = () => updateApprovalStatus("denied", { 
    profile_participation: false, 
    public_visibility: false, 
    recruiter_access: false, 
    messaging_access: false, 
    media_exposure: false, 
    counselor_access: false 
  }).catch(handleError); 
}); 

document.querySelectorAll("[data-parent-action='modify']").forEach(btn => { 
  btn.onclick = () => updateApprovalStatus("modified").catch(handleError); 
}); 

document.querySelectorAll("[data-parent-action='revoke']").forEach(btn => { 
  btn.onclick = () => updateApprovalStatus("revoked", { 
    profile_participation: false, 
    public_visibility: false, 
    recruiter_access: false, 
    messaging_access: false, 
    media_exposure: false, 
    counselor_access: false 
  }).catch(handleError); 
});

}

async function loadAndRender() {
try {
STATE.snapshot_id = getSnapshotId();

if (!STATE.snapshot_id) { 
    throw new Error("Missing snapshot_id in URL. Parent Approval requires player snapshot context."); 
  } 

  document.body.dataset.snapshotId = STATE.snapshot_id; 
  setText("[data-snapshot-id]", STATE.snapshot_id); 

  bindUIActions(); 

  let request = await loadLatestApprovalRequest(STATE.snapshot_id); 

  if (!request) { 
    request = await createApprovalRequest({ 
      snapshot_id: STATE.snapshot_id, 
      athlete_name: "Athlete", 
      guardian_name: "Parent / Guardian", 
      requester_name: "STATScore System", 
      requester_role: "system", 
      request_type: "parent_permission_scope", 
      scope: DEFAULT_SCOPE, 
      system_notes: "Auto-created parent approval request from player profile route." 
    }); 
  } 

  renderApprovalRequest(request); 
  await syncPlayerProfileGovernanceState(request); 
  renderAudit("Parent approval engine loaded successfully.", "Runtime • Engine Active"); 

  return request; 
} catch (error) { 
  handleError(error); 
  return null; 
}

}

window.STATScoreParentApprovalEngine = {
ENGINE_ID,
ENGINE_VERSION,
STATE,
loadAndRender,
createApprovalRequest,
approve: () => updateApprovalStatus("approved"),
deny: () => updateApprovalStatus("denied", DEFAULT_SCOPE),
modify: () => updateApprovalStatus("modified"),
revoke: () => updateApprovalStatus("revoked", DEFAULT_SCOPE),
collectScopeFromDOM,
applyScopeToDOM,
syncPlayerProfileGovernanceState
};

document.addEventListener("DOMContentLoaded", loadAndRender);

})(); 
