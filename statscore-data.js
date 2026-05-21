/* STATScore™ Data Bridge 
   File: statscore-data.js
   Purpose: Load athlete intelligence data into STATScore HTML rooms
*/

window.STATScoreData = window.STATScoreData || {};

(function () {
  const SUPABASE_URL = "https://oyjmpbuxvfxusmbouldi.supabase.co";

  /*
    IMPORTANT:
    Replace this with your Supabase anon public key if your current file
    already had it. Do NOT use service_role key in frontend.
  */
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95am1wYnV4dmZ4dXNtYm91bGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDkxNTcsImV4cCI6MjA4NTAyNTE1N30.S4P98vRR8AS7vsg5W-Dxg_fEtVoSlKscMOWEsigo5Mk";

  let client = null;

  function getClient() {
    if (client) return client;

    if (!window.supabase) {
      console.error("Supabase library not loaded.");
      return null;
    }

    client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    return client;
  }

  function setText(id, value, fallback = "—") {
    const el = document.getElementById(id);
    if (!el) return;

    if (value === null || value === undefined || value === "") {
      el.textContent = fallback;
      return;
    }

    el.textContent = value;
  }

  function setList(id, value, fallback = ["No active items found."]) {
    const el = document.getElementById(id);
    if (!el) return;

    let items = value;

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = [items];
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      items = fallback;
    }

    el.innerHTML = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      el.appendChild(li);
    });
  }

  function normalizeArray(value) {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }

    return [];
  }

  async function loadAthleteProfile() {
    const db = getClient();
    if (!db) return null;

    const { data, error } = await db
      .from("statscore_athlete_intelligence_profile_view")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Athlete profile load error:", error);
      return null;
    }

    if (!data) return null;

    return {
      athlete_profile_id: data.athlete_profile_id,
      athlete_display_name: data.athlete_display_name || "Demo Athlete",
      sport: data.sport || "—",
      position: data.position || "—",

      final_master_state: data.final_master_state || "restricted_visibility",
      athlete_status_label: data.athlete_status_label || "Developmental Athlete",
      operational_tier: data.operational_tier || "tier_2",

      verification_status: data.verification_status || "partial",
      readiness_status: data.readiness_status || data.readiness || "developing",
      eligibility_status: data.eligibility_status || "partial",
      pathway_status: data.pathway_status || "path_pending",
      exposure_status: data.exposure_status || "controlled",

      review_state: data.review_state || "Manual Review Required",
      primary_next_action: data.primary_next_action || "Upload Current Transcript",

      current_blockers: normalizeArray(data.current_blockers),
      development_priorities: normalizeArray(data.development_priorities),
      required_actions: normalizeArray(data.required_actions),

      profile_visibility_message:
        data.profile_visibility_message ||
        "Profile visibility remains controlled until required actions are completed.",

      recruiter_access_message:
        data.recruiter_access_message ||
        "Recruiter access is limited pending verification and eligibility review.",

      review_message:
        data.review_message ||
        "Manual review required before advancement.",

      resolved_at: data.resolved_at || null
    };
  }

  async function loadResolutionQueue() {
    const db = getClient();
    if (!db) return [];

    const { data, error } = await db
      .from("statscore_resolution_state_matrix")
      .select("*")
      .limit(10);

    if (error) {
      console.error("Resolution queue load error:", error);
      return [];
    }

    return data || [];
  }

  async function loadActionEngine() {
    const db = getClient();
    if (!db) return null;

    const { data, error } = await db
      .from("statscore_athlete_action_engine")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Action engine load error:", error);
      return null;
    }

    return data;
  }

  async function loadResolutionStatistics() {
    const db = getClient();
    if (!db) return null;

    const { data, error } = await db
      .from("statscore_resolution_statistics")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Resolution statistics load error:", error);
      return null;
    }

    return data;
  }

  window.STATScoreData = {
    getClient,
    setText,
    setList,
    normalizeArray,
    loadAthleteProfile,
    loadResolutionQueue,
    loadActionEngine,
    loadResolutionStatistics
  };
})(); 
