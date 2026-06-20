const RECRUITER_DRAFT_KEY = "statscore_recruiter_intake_draft_v2";
const RECRUITER_CONTEXT_KEY = "statscore_recruiter_context_v1";
const ROLE_DASHBOARD_CONTEXT_KEY = "statscore_role_dashboard_context_v1";
const MULTIBOX_CONTEXT_KEY = "statscore_multibox_identity_v1";
const ACTIVE_RECRUITER_ID_KEY = "STATSCORE_ACTIVE_RECRUITER_ID";

function $(id){ return document.getElementById(id); }

function nowISO(){
  return new Date().toISOString();
}

function uuid(){
  return crypto?.randomUUID ? crypto.randomUUID() :
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function safeText(value){
  return value === undefined || value === null ? "" : String(value).trim();
}

function val(id){
  const el = $(id);
  return el && typeof el.value !== "undefined" ? safeText(el.value) : "";
}

function setMessage(message, color = "var(--green)"){
  const el = $("systemMessage");
  if (!el) return;
  el.textContent = message || "";
  el.style.color = color;
}

function setStatus(id, text, color = "var(--green)"){
  const el = $(id);
  if (!el) return;
  el.textContent = text || "";
  el.style.color = color;
}

function recruiterDisplayName(){
  return `${val("firstName")} ${val("lastName")}`.trim();
}

function buildRecruiterPayload(){
  const existingId =
    localStorage.getItem(ACTIVE_RECRUITER_ID_KEY) ||
    sessionStorage.getItem(ACTIVE_RECRUITER_ID_KEY);

  const recruiterId = existingId || uuid();
  const displayName = recruiterDisplayName();

  return {
    system: "STATS-CORE",
    source_page: "recruiter-intake.html",
    role: "recruiter",
    role_label: "Recruiter",

    recruiter_id: recruiterId,

    first_name: val("firstName"),
    last_name: val("lastName"),
    display_name: displayName,
    email: val("email"),
    phone: val("phone"),
    title_role: val("titleRole"),
    recruiter_type: val("recruiterType"),

    organization_name: val("organizationName"),
    organization_url: val("organizationUrl"),
    city_state: val("cityState"),
    operating_level: val("operatingLevel"),

    primary_sport: val("primarySport"),
    secondary_sports: val("secondarySports"),
    recruiting_reach: val("recruitingReach"),
    primary_region: val("primaryRegion"),
    target_grad_classes: val("targetGradClasses"),
    target_positions: val("targetPositions"),

    primary_need_type: val("primaryNeedType"),
    academic_threshold: val("academicThreshold"),
    ideal_athlete_notes: val("idealAthleteNotes"),

    crystal_preference: val("crystalPreference"),
    watchlist_mode: val("watchlistMode"),
    primary_comm_route: val("primaryCommRoute"),

    multibox_from_role: "recruiter",
    multibox_from_id: recruiterId,
    multibox_from_label: displayName || "Recruiter",

    dashboard_url: `role-dashboard.html?role=recruiter&recruiter_id=${encodeURIComponent(recruiterId)}&from=recruiter-intake`,
    recruiter_room_url: `recruiter-access.html?recruiter_id=${encodeURIComponent(recruiterId)}&from=recruiter-intake`,
    multibox_url: `multi-box.html?from_role=recruiter&from_id=${encodeURIComponent(recruiterId)}`,

    created_at: nowISO(),
    updated_at: nowISO()
  };
}

function updateStatus(){
  const payload = buildRecruiterPayload();

  setStatus("statusRecruiterId", payload.recruiter_id ? "Ready" : "Pending");

  setStatus(
    "statusIdentity",
    payload.display_name && payload.email ? "Captured" : "Pending",
    payload.display_name && payload.email ? "var(--green)" : "var(--gold)"
  );

  setStatus(
    "statusOrganization",
    payload.organization_name ? "Captured" : "Pending",
    payload.organization_name ? "var(--green)" : "var(--gold)"
  );

  setStatus(
    "statusScope",
    payload.primary_sport && payload.primary_region ? "Captured" : "Pending",
    payload.primary_sport && payload.primary_region ? "var(--green)" : "var(--gold)"
  );

  setStatus("statusCrm", payload.crystal_preference ? "Prepared" : "Pending", "var(--green)");
  setStatus("statusMultibox", "FROM: Recruiter", "var(--green)");
}

function validateRecruiterPayload(payload){
  const missing = [];

  if (!payload.first_name) missing.push("First Name");
  if (!payload.last_name) missing.push("Last Name");
  if (!payload.email) missing.push("Email");
  if (!payload.organization_name) missing.push("Organization / Program Name");
  if (!payload.primary_sport) missing.push("Primary Sport");
  if (!payload.primary_region) missing.push("Primary Region");

  return missing;
}

function saveRecruiterDraft(){
  const payload = buildRecruiterPayload();
  localStorage.setItem(RECRUITER_DRAFT_KEY, JSON.stringify(payload));
  updateStatus();
  setMessage("Recruiter intake draft saved.", "var(--green)");
}

function restoreRecruiterDraft(){
  const raw = localStorage.getItem(RECRUITER_DRAFT_KEY);
  if (!raw) return;

  let draft = null;

  try {
    draft = JSON.parse(raw);
  } catch {
    return;
  }

  const map = {
    firstName:"first_name",
    lastName:"last_name",
    email:"email",
    phone:"phone",
    titleRole:"title_role",
    recruiterType:"recruiter_type",
    organizationName:"organization_name",
    organizationUrl:"organization_url",
    cityState:"city_state",
    operatingLevel:"operating_level",
    primarySport:"primary_sport",
    secondarySports:"secondary_sports",
    recruitingReach:"recruiting_reach",
    primaryRegion:"primary_region",
    targetGradClasses:"target_grad_classes",
    targetPositions:"target_positions",
    primaryNeedType:"primary_need_type",
    academicThreshold:"academic_threshold",
    idealAthleteNotes:"ideal_athlete_notes",
    crystalPreference:"crystal_preference",
    watchlistMode:"watchlist_mode",
    primaryCommRoute:"primary_comm_route"
  };

  Object.keys(map).forEach(id => {
    const el = $(id);
    const key = map[id];

    if (el && draft[key] !== undefined && draft[key] !== null){
      el.value = draft[key];
    }
  });
}

function previewRecruiterContext(){
  const payload = buildRecruiterPayload();
  updateStatus();

  alert(
`RECRUITER ENVIRONMENT PREVIEW

Recruiter:
${payload.display_name || "Not Set"}

Organization:
${payload.organization_name || "Not Set"}

Sport / Region:
${payload.primary_sport || "Not Set"} / ${payload.primary_region || "Not Set"}

Recruiting Reach:
${payload.recruiting_reach || "Not Set"}

Crystal:
${payload.crystal_preference || "Not Set"}

Multi-Box:
FROM = Recruiter`
  );
}

function createRecruiterEnvironment(){
  const submitBtn = $("submitRecruiterBtn");
  const payload = buildRecruiterPayload();
  const missing = validateRecruiterPayload(payload);

  if (missing.length){
    setMessage("Missing required fields: " + missing.join(", "), "var(--red)");
    updateStatus();
    return;
  }

  if (submitBtn) submitBtn.disabled = true;

  localStorage.setItem(ACTIVE_RECRUITER_ID_KEY, payload.recruiter_id);
  sessionStorage.setItem(ACTIVE_RECRUITER_ID_KEY, payload.recruiter_id);

  localStorage.setItem(RECRUITER_CONTEXT_KEY, JSON.stringify(payload));
  localStorage.setItem(ROLE_DASHBOARD_CONTEXT_KEY, JSON.stringify(payload));
  sessionStorage.setItem(ROLE_DASHBOARD_CONTEXT_KEY, JSON.stringify(payload));

  localStorage.setItem(MULTIBOX_CONTEXT_KEY, JSON.stringify({
    from_role: "recruiter",
    from_id: payload.recruiter_id,
    from_label: payload.display_name || "Recruiter",
    source_page: "recruiter-intake.html",
    created_at: nowISO()
  }));

  sessionStorage.setItem("statscore_role", "recruiter");
  sessionStorage.setItem("statscore_recruiter_id", payload.recruiter_id);
  sessionStorage.setItem("statscore_next_dashboard", payload.dashboard_url);

  const badge = $("recordBadge");
  if (badge) badge.textContent = "Environment Created";

  const viewDashboardBtn = $("viewDashboardBtn");
  if (viewDashboardBtn) viewDashboardBtn.href = payload.dashboard_url;

  updateStatus();
  localStorage.removeItem(RECRUITER_DRAFT_KEY);

  setMessage("Recruiter environment created. Routing to shared role dashboard.", "var(--green)");

  setTimeout(() => {
    window.location.href = payload.dashboard_url;
  }, 650);
}

function bindRecruiterRuntime(){
  restoreRecruiterDraft();
  updateStatus();

  document.querySelectorAll("input,select,textarea").forEach(el => {
    el.addEventListener("input", updateStatus);
    el.addEventListener("change", updateStatus);
  });

  $("submitRecruiterBtn")?.addEventListener("click", event => {
    event.preventDefault();
    createRecruiterEnvironment();
  });

  $("saveDraftBtn")?.addEventListener("click", event => {
    event.preventDefault();
    saveRecruiterDraft();
  });

  $("previewBtn")?.addEventListener("click", event => {
    event.preventDefault();
    previewRecruiterContext();
  });

  setMessage("Recruiter Intake Engine loaded.", "var(--green)");
}

document.addEventListener("DOMContentLoaded", bindRecruiterRuntime); 
