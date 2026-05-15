/* STATScore Live Intelligence Fetch Layer v1 */
/* Use Supabase ANON key only. Never place service_role keys in frontend files. */

const STATSCORE_CONFIG = {
  supabaseUrl: "YOUR_SUPABASE_PROJECT_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Demo athlete for current build phase.
  // Later this should come from login/session/profile selection.
  activeAthleteId: null
};

async function supabaseGet(path) {
  const res = await fetch(`${STATSCORE_CONFIG.supabaseUrl}/rest/v1/${path}`, {
    method: "GET",
    headers: {
      apikey: STATSCORE_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${STATSCORE_CONFIG.supabaseAnonKey}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Supabase fetch failed: ${res.status} ${errorText}`);
  }

  return await res.json();
}

async function loadAthleteProfile() {
  const rows = await supabaseGet(
    "statscore_athlete_intelligence_profile_view?select=*&limit=1"
  );

  return rows[0] || null;
}

async function loadResolutionQueue() {
  return await supabaseGet(
    "statscore_resolution_queue?select=*&limit=25"
  );
}

async function loadRoleQueueDashboard() {
  return await supabaseGet(
    "statscore_role_queue_dashboard_feed?select=*&order=queue_key.asc"
  );
}

async function loadEventFeed() {
  return await supabaseGet(
    "statscore_resolution_event_feed?select=*&order=created_at.desc&limit=10"
  );
}

async function loadResolutionStatistics() {
  const rows = await supabaseGet(
    "statscore_resolution_statistics?select=*&limit=1"
  );

  return rows[0] || null;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "—";
}

function setList(id, items) {
  const el = document.getElementById(id);
  if (!el) return;

  const safeItems = Array.isArray(items) ? items : [];
  el.innerHTML = safeItems.map(item => `<li>${item}</li>`).join("");
}

window.STATScoreData = {
  loadAthleteProfile,
  loadResolutionQueue,
  loadRoleQueueDashboard,
  loadEventFeed,
  loadResolutionStatistics,
  setText,
  setList
}; 
