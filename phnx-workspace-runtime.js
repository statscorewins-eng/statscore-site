<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="statscore-data.js"></script>
<script src="statscore-role-access.js"></script>
<script src="statscore-receipt-ledger-engine.js"></script>
<script src="statscore-multi-box-governance-engine.js"></script>
<script src="statscore-communication-engine.js"></script>

<script>
let supabaseClient = null;
let MBX_RUNTIME = null;
let MBX_DIRECTORIES = [];

function $(id){
  return document.getElementById(id);
}

function lower(value){
  return String(value || "").trim().toLowerCase();
}

function titleRole(role){
  return String(role || "")
    .replaceAll("_"," / ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function esc(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setMessage(message,type="success"){
  const node = $("systemMessage");
  if(!node) return;
  node.textContent = message || "";
  node.style.color = type === "error" ? "var(--red)" : "var(--green)";
  node.title = message || "";
}

function setText(id,value){
  const node = $(id);
  if(node) node.textContent = value;
}

function setValue(id,value){
  const node = $(id);
  if(node) node.value = value;
}

function initSupabase(){
  supabaseClient =
    window.STATScoreData?.getClient?.() ||
    window.STATScoreCore?.getClient?.() ||
    window.supabaseClient ||
    null;

  if(supabaseClient){
    window.supabaseClient = supabaseClient;
    window.STATScoreSupabase = supabaseClient;
    window.STATScoreSupabaseClient = supabaseClient;
    console.info("[STATScore] Multi-Box using shared Supabase client.");
  }else{
    console.error("[STATScore] Shared Supabase client unavailable.");
  }
}

function ensureSessionDefaults(){
  const params = new URLSearchParams(window.location.search);

  const role =
    params.get("role") ||
    sessionStorage.getItem("statscore_role") ||
    localStorage.getItem("statscore_role") ||
    localStorage.getItem("STATSCORE_ROLE") ||
    "coach";

  sessionStorage.setItem("statscore_role", lower(role));

  const roleId =
    params.get("role_id") ||
    sessionStorage.getItem("statscore_role_id") ||
    localStorage.getItem("statscore_role_id") ||
    null;

  if(roleId) sessionStorage.setItem("statscore_role_id", roleId);

  const userId =
    params.get("user_id") ||
    sessionStorage.getItem("statscore_user_id") ||
    localStorage.getItem("statscore_user_id") ||
    null;

  if(userId) sessionStorage.setItem("statscore_user_id", userId);

  const snapshotId =
    params.get("snapshot_id") ||
    sessionStorage.getItem("statscore_snapshot_id") ||
    localStorage.getItem("statscore_snapshot_id") ||
    localStorage.getItem("statscore_current_snapshot_id") ||
    null;

  if(snapshotId) sessionStorage.setItem("statscore_snapshot_id", snapshotId);

  const athleteId =
    params.get("athlete_id") ||
    sessionStorage.getItem("statscore_athlete_id") ||
    localStorage.getItem("statscore_athlete_id") ||
    localStorage.getItem("statscore_current_athlete_id") ||
    null;

  if(athleteId) sessionStorage.setItem("statscore_athlete_id", athleteId);
}

async function initMultiBoxRuntime(){
  const engine = window.STATScore?.CommunicationEngine;

  if(!engine){
    setMessage("Communication Engine not loaded.","error");
    addAudit("Engine Error","statscore-communication-engine.js did not load.");
    return;
  }

  MBX_RUNTIME = await engine.init();
  MBX_DIRECTORIES = MBX_RUNTIME?.directories || [];

  const runtime = MBX_RUNTIME?.runtime || {};
  const senderRole = runtime.sender_role || "unknown";
  const senderLabel = runtime.sender_label || titleRole(senderRole);

  document.body.dataset.role = senderRole;

  setValue("senderChannel", senderLabel);
  setText("currentChannelLabel", senderLabel);
  setText("currentChannelMeta", `Role: ${senderRole} • Role ID: ${runtime.sender_role_id || "Pending Runtime"}`);
  setText("runtimeBadge", "Runtime Active");
  setText("senderLockedStatus", "Locked");
  setText("credentialStatus", runtime.credential_status || sessionStorage.getItem("statscore_credential_status") || "Pending Runtime");

  const snapshotText = runtime.snapshot_id
    ? `snapshot_id: ${runtime.snapshot_id}`
    : "No snapshot context";

  setValue("snapshotContext", snapshotText);

  loadTargetRoles();

  if(!MBX_DIRECTORIES.length){
    addAudit("Directory Warning","No target directories loaded for this sender role.");
    setMessage("Awaiting target directory assignment.","error");
  }else{
    addAudit("Runtime Online",`${senderLabel} channel locked. ${MBX_DIRECTORIES.length} directory route(s) loaded.`);
    setMessage(`Multi-Box ready: ${senderLabel} channel locked.`);
  }

  await loadCounts();
}

function loadTargetRoles(){
  const targetRole = $("targetRole");
  const targetDirectory = $("targetDirectory");
  const targetRecipient = $("targetRecipient");

  if(!targetRole) return;

  const roles = [...new Set(
    MBX_DIRECTORIES
      .map(d => lower(d.target_role))
      .filter(Boolean)
  )];

  targetRole.innerHTML = `<option value="">Select Target Role</option>` +
    roles.map(role => `<option value="${esc(role)}">${esc(titleRole(role))}</option>`).join("");

  if(targetDirectory){
    targetDirectory.innerHTML = `<option value="">Select Target Role First</option>`;
  }

  if(targetRecipient){
    targetRecipient.innerHTML = `<option value="">Select Directory First</option>`;
  }

  if(roles.length){
    targetRole.value = roles[0];
    loadDirectoriesForRole(roles[0]);
  }
}

function loadDirectoriesForRole(role){
  const targetDirectory = $("targetDirectory");
  const targetRecipient = $("targetRecipient");

  if(!targetDirectory) return;

  const dirs = MBX_DIRECTORIES.filter(d => lower(d.target_role) === lower(role));

  targetDirectory.innerHTML = `<option value="">Select Target Directory</option>` +
    dirs.map(d => `<option value="${esc(d.directory_key)}">${esc(d.directory_label || d.directory_key)}</option>`).join("");

  if(dirs.length){
    targetDirectory.value = dirs[0].directory_key;
    loadRecipientsForDirectory(role, dirs[0].directory_key);
    setMessage(`${titleRole(role)} target role selected. Directory loaded.`);
  }else{
    targetDirectory.innerHTML = `<option value="">No Directory Available</option>`;
    if(targetRecipient){
      targetRecipient.innerHTML = `<option value="">Select Directory First</option>`;
    }
  }
}

async function loadRecipientsForDirectory(role,directoryKey){
  const targetRecipient = $("targetRecipient");
  if(!targetRecipient) return;

  targetRecipient.innerHTML = `<option value="">Loading Recipients...</option>`;

  const runtime = MBX_RUNTIME?.runtime || {};
  const athleteId = runtime.athlete_id || sessionStorage.getItem("statscore_athlete_id");
  const snapshotId = runtime.snapshot_id || sessionStorage.getItem("statscore_snapshot_id");

  const fallback = [
    {
      id: athleteId || "manual-recipient-pending",
      label: lower(role) === "athlete" ? "Athlete Recipient Pending" : "Recipient Directory Pending",
      type: role || "recipient"
    }
  ];

  let recipients = fallback;

  try{
    if(supabaseClient && lower(role) === "athlete"){
      let query = supabaseClient
        .from("sc_snapshot_intakes")
        .select("id, athlete_id, snapshot_id, first_name, last_name, athlete_name")
        .limit(25);

      if(snapshotId) query = query.eq("snapshot_id", snapshotId);

      const {data,error} = await query;

      if(!error && Array.isArray(data) && data.length){
        recipients = data.map(row => ({
          id: row.athlete_id || row.snapshot_id || row.id,
          label: row.athlete_name || [row.first_name,row.last_name].filter(Boolean).join(" ") || "Athlete",
          type: "athlete",
          athlete_id: row.athlete_id || null,
          snapshot_id: row.snapshot_id || null
        }));
      }
    }
  }catch(error){
    console.warn("[STATScore] Recipient load fallback active:",error);
  }

  targetRecipient.innerHTML = `<option value="">Select Target Recipient</option>` +
    recipients.map(r => `
      <option
        value="${esc(r.id)}"
        data-label="${esc(r.label)}"
        data-type="${esc(r.type)}"
        data-athlete-id="${esc(r.athlete_id || "")}"
        data-snapshot-id="${esc(r.snapshot_id || "")}"
      >
        ${esc(r.label)}
      </option>
    `).join("");

  if(recipients.length){
    targetRecipient.value = recipients[0].id;
  }

  setMessage("Target directory selected. Recipient selection ready.");
}

function getPayload(){
  const runtime = MBX_RUNTIME?.runtime || {};
  const recipientOption = $("targetRecipient")?.selectedOptions?.[0];

  return {
    sender_user_id: runtime.sender_user_id || null,
    sender_role: runtime.sender_role,
    sender_role_id: runtime.sender_role_id || null,
    sender_label: runtime.sender_label || titleRole(runtime.sender_role),

    target_role: lower($("targetRole")?.value),
    target_directory: lower($("targetDirectory")?.value),
    target_recipient_id: $("targetRecipient")?.value || null,
    target_recipient_type: lower(recipientOption?.dataset?.type || $("targetRole")?.value),
    target_recipient_label: recipientOption?.dataset?.label || recipientOption?.textContent || null,

    athlete_id: recipientOption?.dataset?.athleteId || runtime.athlete_id || null,
    snapshot_id: recipientOption?.dataset?.snapshotId || runtime.snapshot_id || null,

    message_type: lower($("messageType")?.value),
    priority: lower($("priorityLevel")?.value),
    communication_window: lower($("communicationWindow")?.value),

    subject: $("subject")?.value.trim() || "",
    body: $("messageBody")?.value.trim() || ""
  };
}

function validatePayload(payload,mode="message"){
  if(!payload.sender_role) return "Sender channel missing.";
  if(!payload.target_role) return "Target Role is required.";
  if(!payload.target_directory) return "Target Directory is required.";
  if(mode !== "broadcast" && !payload.target_recipient_id) return "Target Recipient is required.";
  if(!payload.subject) return "Subject is required.";
  if(!payload.body) return "Message body is required.";
  return null;
}

async function evaluateCurrentRoute(){
  const engine = window.STATScore?.MultiBoxGovernanceEngine;
  if(!engine) return;

  const payload = getPayload();

  if(!payload.target_role || !payload.target_directory) return;

  const result = await engine.evaluateMultiBoxMessage(payload, MBX_RUNTIME?.runtime || {});

  setText("windowRuleStatus", result.allowed ? "Approved" : "Blocked");
  setText("guardianGateStatus", result.reason || "Contextual");

  return result;
}

async function saveDraft(){
  const engine = window.STATScore?.CommunicationEngine;
  const payload = getPayload();

  const problem = validatePayload(payload,"draft");
  if(problem){
    setMessage(problem,"error");
    return;
  }

  const result = await engine.saveDraft(payload, MBX_RUNTIME?.runtime || {});

  if(result.ok){
    addAudit("Draft Saved",`${titleRole(payload.target_role)} draft saved for ${payload.target_recipient_label || "selected recipient"}.`);
    setMessage("Draft saved. No receipt created until transmission.");
    await loadCounts();
  }else{
    addAudit("Draft Failed",result.error || result.status || "Draft failed.");
    setMessage(result.error || result.status || "Draft save failed.","error");
  }
}

async function sendMessage(){
  const engine = window.STATScore?.CommunicationEngine;
  const payload = getPayload();

  const problem = validatePayload(payload,"message");
  if(problem){
    setMessage(problem,"error");
    return;
  }

  const result = await engine.sendMessage(payload, MBX_RUNTIME?.runtime || {});

  if(result.ok){
    addAudit("Message Sent",`${titleRole(payload.message_type)} routed to ${payload.target_recipient_label || titleRole(payload.target_role)}.`);
    setMessage("Message sent and audited.");
    await loadCounts();
  }else{
    addAudit("Message Blocked",result.reason || "Communication blocked.");
    setMessage(result.reason || "Message blocked.","error");
    await loadCounts();
  }
}

async function broadcastNotice(){
  const engine = window.STATScore?.CommunicationEngine;
  const payload = getPayload();

  const problem = validatePayload(payload,"broadcast");
  if(problem){
    setMessage(problem,"error");
    return;
  }

  payload.target_recipient_id = null;
  payload.target_recipient_label = "Broadcast Directory";
  payload.target_recipient_type = payload.target_role;

  const result = await engine.broadcastNotice(payload, MBX_RUNTIME?.runtime || {});

  if(result.ok){
    addAudit("Broadcast Sent",`${titleRole(payload.message_type)} broadcast to ${titleRole(payload.target_directory)}.`);
    setMessage("Broadcast sent and audited.");
    await loadCounts();
  }else{
    addAudit("Broadcast Blocked",result.reason || "Broadcast blocked.");
    setMessage(result.reason || "Broadcast blocked.","error");
    await loadCounts();
  }
}

function aiAssist(){
  const payload = getPayload();
  const sender = payload.sender_label || "Current Channel";
  const target = payload.target_recipient_label || titleRole(payload.target_role || "Target Role");

  let subject = `${sender} Communication Notice`;
  let body = `STATS-CORE™ Multi-Box notice from the locked ${sender} sender channel to ${target}. This communication is governed by sender authority, target role permissions, communication windows, receipts, and audit trail controls.`;

  if(payload.message_type === "recruiting_window_notice"){
    subject = "Recruiting Communication Window Status Update";
    body = "STATS-CORE™ Notice: This recruiting communication route is governed by credential authority, guardian clearance, communication window rules, and receipt logging. Direct recruiter-to-athlete contact remains restricted unless approved by governance.";
  }

  if(payload.message_type === "parent_approval_required"){
    subject = "Parent / Guardian Approval Required";
    body = "STATS-CORE™ Permission Notice: Parent / Guardian approval is required before expanded communication, visibility, or recruiting access can proceed. Please review the athlete communication governance status.";
  }

  if(payload.message_type === "eligibility_reminder"){
    subject = "Eligibility Readiness Reminder";
    body = "STATS-CORE™ Eligibility Notice: This athlete record requires continued eligibility awareness. Please review academic readiness, test dates, verification status, and required documentation.";
  }

  setValue("subject",subject);
  setValue("messageBody",body);

  addAudit("AI Assist","Governed message draft generated.");
  setMessage("AI draft generated.");
}

function addAudit(title,note){
  const panel = $("auditPanel");
  if(!panel) return;

  const item = document.createElement("div");
  item.className = "audit-item";
  item.innerHTML = `<b>${esc(title)}</b><span>${esc(note)}</span>`;
  panel.prepend(item);
}

async function loadCounts(){
  const engine = window.STATScore?.CommunicationEngine;
  if(!engine) return;

  try{
    const sent = await engine.loadMessagesForSender(MBX_RUNTIME?.runtime || {},{status:"sent"});
    const drafts = await engine.loadMessagesForSender(MBX_RUNTIME?.runtime || {},{status:"draft"});
    const blocked = await engine.loadMessagesForSender(MBX_RUNTIME?.runtime || {},{status:"blocked"});
    const inbox = await engine.loadMessagesForRecipient(MBX_RUNTIME?.runtime || {});

    setText("sentMetric",String(sent.messages?.length || 0));
    setText("draftsMetric",String(drafts.messages?.length || 0));
    setText("restrictedWindowsMetric",String(blocked.messages?.length || 0));
    setText("unreadNoticesMetric",String(inbox.messages?.length || 0));
    setText("pendingRequestsMetric","0");
  }catch(error){
    console.warn("[STATScore] Count load skipped:",error);
  }
}

function clearComposer(){
  setValue("subject","");
  setValue("messageBody","");
}

function generateCrystalReport(){
  const payload = getPayload();

  localStorage.setItem("statscore_multibox_crystal_report_payload",JSON.stringify({
    ...payload,
    source_system:"STATS-CORE Multi-Box™",
    report_type:"Multi-Box Crystal Report",
    generated_at:new Date().toISOString()
  }));

  addAudit("Crystal Report","Multi-Box Crystal Report payload prepared.");
  setMessage("Crystal Report payload prepared.");
  window.location.href = "crystal-report.html";
}

function activateRailButton(button){
  document.querySelectorAll(".rail-btn").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
}

function wireEvents(){
  document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click",async () => {
      activateRailButton(button);
      const action = button.dataset.action;

      if(action === "compose"){
        setMessage("Compose mode active.");
      }

      if(action === "inbox"){
        addAudit("Inbox","Recipient messages loaded for current channel.");
        setMessage("Inbox view requested.");
      }

      if(action === "drafts"){
        addAudit("Drafts","Draft messages loaded for current channel.");
        setMessage("Draft view requested.");
      }

      if(action === "sent"){
        addAudit("Sent","Sent messages loaded for current channel.");
        setMessage("Sent view requested.");
      }

      if(action === "receipts"){
        addAudit("Receipts","Receipt ledger available through governed audit records.");
        setMessage("Receipts view requested.");
      }

      if(action === "archived"){
        addAudit("Archived","Archived messages view requested.");
        setMessage("Archived view requested.");
      }

      if(action === "discard-draft"){
        if(confirm(
          "Discard this draft?\n\nThis draft has never been sent.\nNo receipt exists.\n\nContinue?"
        )){
          clearComposer();
          setMessage("Draft discarded.");
          addAudit("Draft Discarded","Unsent draft removed prior to communication.");
        }
      }
    });
  });

  document.querySelectorAll("[data-target-role]").forEach(button => {
    button.addEventListener("click",() => {
      const role = lower(button.dataset.targetRole);
      const targetRole = $("targetRole");

      if(targetRole){
        targetRole.value = role;
        loadDirectoriesForRole(role);
        addAudit("Directory Selected",`${titleRole(role)} directory lane selected.`);
        setMessage(`${titleRole(role)} target role selected.`);
      }
    });
  });

  $("targetRole")?.addEventListener("change",async event => {
    loadDirectoriesForRole(event.target.value);
    await evaluateCurrentRoute();
  });

  $("targetDirectory")?.addEventListener("change",async event => {
    await loadRecipientsForDirectory($("targetRole")?.value,event.target.value);
    await evaluateCurrentRoute();
  });

  $("targetRecipient")?.addEventListener("change",evaluateCurrentRoute);
  $("communicationWindow")?.addEventListener("change",evaluateCurrentRoute);

  $("aiAssistBtn")?.addEventListener("click",aiAssist);
  $("saveDraftBtn")?.addEventListener("click",saveDraft);
  $("sendMessageBtn")?.addEventListener("click",sendMessage);
  $("broadcastNoticeBtn")?.addEventListener("click",broadcastNotice);
  $("generateCrystalReportBtn")?.addEventListener("click",generateCrystalReport);
}

document.addEventListener("DOMContentLoaded",async () => {
  window.scrollTo(0,0);

  ensureSessionDefaults();
  initSupabase();
  wireEvents();

  if(window.STATScoreRoleAccess?.init){
    window.STATScoreRoleAccess.init({renderAuthority:false});
  }

  await initMultiBoxRuntime();

  const loggedRole = sessionStorage.getItem("statscore_role") || "coach";

  if(loggedRole !== "admin" && loggedRole !== "system"){
    document.querySelector(".tab-rail")?.remove();
  }
});

window.addEventListener("load",() => {
  setTimeout(() => window.scrollTo(0,0),50);
});
</script> 
