window.STATSCORE_ATHLETE_DASHBOARD_ENGINE = { 
  version: "v1.0", 
  status: "ACTIVE",
  engine_name: "STATS-CORE Athlete Dashboard Engine",

  doctrine: {
    page_role: "Athlete Lifecycle Command Center",
    rule_1: "Athlete Dashboard must not contain hardcoded athlete records.",
    rule_2: "Athlete data only renders when a valid snapshot_id is present.",
    rule_3: "Dashboard cards are lifecycle doorways, not full intelligence pages.",
    rule_4: "This engine orchestrates dashboard rendering; specialized engines produce intelligence."
  },

  getSnapshotId(){ 
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("snapshot_id") ||
      params.get("snapshot") ||
      params.get("id") ||
      localStorage.getItem("statscore_active_snapshot_id") ||
      ""
    ).trim();
  },

  getDb(){
    return window.STATScoreData?.getClient?.() || window.STATScoreSupabase || null;
  },

  setText(selector, value, fallback = "—"){
    const el = document.querySelector(selector);
    if(el) el.textContent = value || fallback;
  },

  setImage(selector, url){
    const img = document.querySelector(selector);
    if(!img) return;

    if(url){
      img.src = url;
      img.alt = "Athlete Image";
      img.style.display = "";
    }else{
      img.removeAttribute("src");
      img.alt = "Athlete Image Required";
    }
  },

  buildAthleteName(record){
    const raw = record?.raw_payload || {};
    return (
      record?.athlete_display_name ||
      raw.athlete_display_name ||
      `${record?.first_name || raw.firstName || ""} ${record?.last_name || raw.lastName || ""}`.trim() ||
      ""
    );
  },

  normalizeRecord(record){
    const raw = record?.raw_payload || {};

    return {
      snapshot_id: record?.snapshot_id || raw.snapshot_id || "",
      name: this.buildAthleteName(record),
      first_name: record?.first_name || raw.firstName || "",
      last_name: record?.last_name || raw.lastName || "",
      sport: record?.primary_sport || raw.primarySport || "",
      position: record?.primary_position || raw.primaryPosition || "",
      secondary_position: record?.secondary_position || raw.secondaryPosition || "",
      class_year: record?.graduation_class || raw.graduationClass || "",
      school: record?.school_program || record?.school || raw.schoolProgram || "",
      city_state: record?.city_state || raw.cityState || "",
      height: record?.height || raw.height || "",
      weight: record?.weight || raw.weight || "",
      headshot_url: record?.headshot_url || raw.headshot_url || raw.headshotUrl || "",
      gpa: record?.gpa || raw.gpa || "",
      ncaa_status: record?.ncaa_status || raw.ncaaEligibilityStatus || "",
      raw
    };
  },

  async loadSnapshot(snapshotId){
  const db = this.getDb();

  console.log("DASHBOARD DEBUG snapshotId:", snapshotId);
  console.log("DASHBOARD DEBUG db:", db);

  if(!db || !snapshotId) return null;

  const cleanSnapshotId = String(snapshotId).trim();

  const { data, error } = await db
    .from("statscore_snapshots")
    .select("*")
    .eq("snapshot_id", cleanSnapshotId)
    .maybeSingle();

  console.log("DASHBOARD DEBUG query data:", data);
  console.log("DASHBOARD DEBUG query error:", error);

  if(error){
    console.error("Athlete Dashboard snapshot load failed:", error);
    return null;
  }

  return data || null;
}, 


  renderBlankState(){
    document.body.setAttribute("data-dashboard-state", "blank");

    this.setText("[data-athlete-name]", "Athlete Dashboard");
    this.setText("[data-athlete-position]", "No Athlete Loaded");
    this.setText("[data-athlete-school]", "Search or open a snapshot record to load athlete intelligence.");
    this.setText("[data-athlete-location]", "Snapshot Required");
    this.setText("[data-snapshot-id]", "No Snapshot ID");

    this.setText("[data-athlete-height]", "—");
    this.setText("[data-athlete-weight]", "—");
    this.setText("[data-athlete-class]", "—");
    this.setText("[data-athlete-sport]", "—");

    this.setImage("[data-athlete-image]", "");

    this.renderCardValue("eligibility_status", "Pending");
    this.renderCardValue("exposure_score", "Pending");
    this.renderCardValue("recruiting_readiness", "Pending");
    this.renderCardValue("performance_trend", "Pending");
    this.renderCardValue("profile_completeness", "Pending");

    this.disableContextLinks();
  },

  renderAthlete(record){
    const athlete = this.normalizeRecord(record);

    if(!athlete.snapshot_id){
      this.renderBlankState();
      return;
    }

    localStorage.setItem("statscore_active_snapshot_id", athlete.snapshot_id);
    document.body.setAttribute("data-dashboard-state", "loaded");

    this.setText("[data-athlete-name]", athlete.name || "Unnamed Athlete");
    this.setText("[data-athlete-position]", athlete.position || "Position Pending");
    this.setText("[data-athlete-school]", athlete.school || "School Pending");
    this.setText("[data-athlete-location]", athlete.city_state || "Location Pending");
    this.setText("[data-snapshot-id]", athlete.snapshot_id);

    this.setText("[data-athlete-height]", athlete.height);
    this.setText("[data-athlete-weight]", athlete.weight);
    this.setText("[data-athlete-class]", athlete.class_year);
    this.setText("[data-athlete-sport]", athlete.sport);

    this.setImage("[data-athlete-image]", athlete.headshot_url);

    this.renderLifecycleCards(athlete);
    this.attachSnapshotToLinks(athlete.snapshot_id);
  },

  renderCardValue(cardKey, value){
    const el = document.querySelector(`[data-dashboard-card="${cardKey}"] [data-card-value]`);
    if(el) el.textContent = value || "Pending";
  },

  renderLifecycleCards(athlete){
    this.renderCardValue("eligibility_status", athlete.ncaa_status || "Needs Review");
    this.renderCardValue("academic_overview", athlete.gpa ? `GPA ${athlete.gpa}` : "Academic Pending");
    this.renderCardValue("athletic_snapshot", athlete.position ? `${athlete.position} Snapshot` : "Snapshot Pending");
    this.renderCardValue("phnx_sports_media", athlete.raw?.highlightUrl ? "Film Linked" : "Media Pending");
    this.renderCardValue("profile_completeness", this.calculateProfileCompleteness(athlete) + "%");
    this.renderCardValue("recruiting_readiness", "Needs Intelligence");
    this.renderCardValue("exposure_score", "Needs Media");
    this.renderCardValue("performance_trend", "Needs History");
  },

  calculateProfileCompleteness(athlete){
    const fields = [
      athlete.name,
      athlete.sport,
      athlete.position,
      athlete.class_year,
      athlete.school,
      athlete.city_state,
      athlete.height,
      athlete.weight,
      athlete.gpa,
      athlete.headshot_url
    ];

    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  },

  attachSnapshotToLinks(snapshotId){
    document.querySelectorAll("[data-context-link], [data-dashboard-route]").forEach(link => {
      const href = link.getAttribute("href");
      if(!href || href === "#") return;

      const url = new URL(href, window.location.href);
      url.searchParams.set("snapshot_id", snapshotId);

      link.setAttribute("href", url.pathname.replace(/^\//, "") + url.search);
      link.removeAttribute("aria-disabled");
      link.classList.remove("disabled");
    });
  },

  disableContextLinks(){
    document.querySelectorAll("[data-requires-snapshot]").forEach(link => {
      link.setAttribute("aria-disabled", "true");
      link.classList.add("disabled");
    });
  },

  wireCardRouting(){
    document.querySelectorAll("[data-dashboard-route]").forEach(card => {
      card.addEventListener("click", event => {
        const snapshotId = this.getSnapshotId();

        if(!snapshotId){
          event.preventDefault();
          alert("Load an athlete snapshot before opening this intelligence room.");
          return;
        }
      });
    });
  },

  async init(){
    this.wireCardRouting();

    const snapshotId = this.getSnapshotId();

    if(!snapshotId){
      this.renderBlankState();
      return;
    }

    const record = await this.loadSnapshot(snapshotId);

    if(!record){
      console.warn("No athlete snapshot found for:", snapshotId);
      this.renderBlankState();
      return;
    }

    this.renderAthlete(record);
  }
};

document.addEventListener("DOMContentLoaded", function(){
  window.STATSCORE_ATHLETE_DASHBOARD_ENGINE.init();
}); 
