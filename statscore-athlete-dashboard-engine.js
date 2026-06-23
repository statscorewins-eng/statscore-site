window.STATSCORE_ATHLETE_DASHBOARD_ENGINE = {
  version: "v1.1",
  status: "ACTIVE",
  engine_name: "STATS-CORE Athlete Dashboard Engine",

  getSnapshotId(){
    const params = new URLSearchParams(window.location.search);
    return String(
      params.get("snapshot_id") ||
      params.get("snapshot") ||
      params.get("id") ||
      localStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      localStorage.getItem("statscore_active_snapshot_id") ||
      sessionStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      sessionStorage.getItem("statscore_active_snapshot_id") ||
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

  setAll(selectors, value, fallback = "—"){
    selectors.forEach(sel => this.setText(sel, value, fallback));
  },

  setImage(selector, url, name = "Athlete Image"){
    const img = document.querySelector(selector);
    if(!img) return;

    if(url){
      img.src = url;
      img.alt = name;
      img.style.display = "";
    }else{
      img.removeAttribute("src");
      img.alt = "Athlete Image Required";
    }
  },

  n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  },

  async loadSnapshot(snapshotId){
    const db = this.getDb();
    const cleanSnapshotId = String(snapshotId || "").trim();

    console.log("DASHBOARD LOAD snapshot_id:", cleanSnapshotId);
    console.log("DASHBOARD DB:", db);

    if(!db || !cleanSnapshotId) return null;

    const { data, error } = await db
      .from("statscore_snapshots")
      .select("*")
      .eq("snapshot_id", cleanSnapshotId)
      .maybeSingle();

    console.log("DASHBOARD SNAPSHOT DATA:", data);
    console.log("DASHBOARD SNAPSHOT ERROR:", error);

    if(error){
      console.error("Athlete Dashboard snapshot load failed:", error);
      return null;
    }

    return data || null;
  },

  async loadProduction(snapshotId){
    const db = this.getDb();
    if(!db || !snapshotId) return [];

    const { data, error } = await db
      .from("statscore_athlete_production_records")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .order("snapshot_year", { ascending:true });

    if(error){
      console.warn("Dashboard production load failed:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async loadParentApproval(snapshotId){
    const db = this.getDb();
    if(!db || !snapshotId) return null;

    const { data, error } = await db
      .from("sc_parent_approval_requests")
      .select("*")
      .eq("snapshot_id", snapshotId)
      .order("created_at", { ascending:false })
      .limit(1)
      .maybeSingle();

    if(error){
      console.warn("Dashboard parent approval load failed:", error);
      return null;
    }

    return data || null;
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
      athlete_id: record?.athlete_id || raw.athlete_id || "",
      name: this.buildAthleteName(record),

      first_name: record?.first_name || raw.firstName || "",
      last_name: record?.last_name || raw.lastName || "",

      sport: record?.primary_sport || raw.primarySport || raw.sport || "",
      position: record?.primary_position || raw.primaryPosition || raw.position || "",
      secondary_position: record?.secondary_position || raw.secondaryPosition || "",

      class_year: record?.graduation_class || raw.graduationClass || raw.classYear || "",
      school: record?.school_program || record?.school || raw.schoolProgram || raw.school || "",
      city_state: record?.city_state || raw.cityState || "",

      height: record?.height || raw.height || "",
      weight: record?.weight || raw.weight || "",

      dash40: record?.dash40 || raw.dash40 || raw.forty || raw.fortyDash || "",
      vertical_jump: record?.vertical_jump || raw.verticalJump || raw.vertical || "",
      shuttle: record?.shuttle || raw.shuttle || "",
      broad_jump: record?.broad_jump || raw.broadJump || "",
      strength_marker: record?.strength_marker || raw.strengthMarker || "",

      gpa: record?.current_gpa || record?.gpa || raw.currentGpa || raw.gpa || "",
      ncaa_status: record?.ncaa_eligibility_status || record?.ncaa_status || raw.ncaaEligibilityStatus || "",

      headshot_url:
        record?.headshot_public_url ||
        record?.headshot_url ||
        record?.headshot_path ||
        raw.headshot_public_url ||
        raw.headshotUrl ||
        raw.headshot_url ||
        "",

      verification_status: record?.verification_status || raw.verificationStatus || "UNVERIFIED",
      score_status: record?.score_status || raw.scoreStatus || "UNVERIFIED",

      raw
    };
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
    this.renderCardValue("profile_completeness", "0%");
  },

  renderCardValue(cardKey, value){
    const selectors = [
      `[data-dashboard-card="${cardKey}"] [data-card-value]`,
      `[data-card="${cardKey}"] [data-card-value]`,
      `[data-${cardKey}]`
    ];

    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if(el) el.textContent = value || "Pending";
    });
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

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  },

  calculateProductionSummary(records){
    if(!records.length){
      return {
        seasons: 0,
        passing_yards: "—",
        passing_tds: "—",
        rushing_yards: "—",
        total_yards: "—",
        total_tds: "—"
      };
    }

    let passingYards = 0;
    let passingTds = 0;
    let rushingYards = 0;
    let rushingTds = 0;

    records.forEach(r => {
      const p = r.stat_payload || r.raw_payload || r;

      passingYards += this.n(p.passing_yards) || 0;
      passingTds += this.n(p.passing_touchdowns || p.passing_tds) || 0;
      rushingYards += this.n(p.rushing_yards) || 0;
      rushingTds += this.n(p.rushing_touchdowns || p.rushing_tds) || 0;
    });

    return {
      seasons: records.length,
      passing_yards: passingYards || "—",
      passing_tds: passingTds || "—",
      rushing_yards: rushingYards || "—",
      total_yards: passingYards + rushingYards || "—",
      total_tds: passingTds + rushingTds || "—"
    };
  },

  renderAthlete(record, productionRecords = [], approval = null){
    const athlete = this.normalizeRecord(record);
    const production = this.calculateProductionSummary(productionRecords);

    if(!athlete.snapshot_id){
      this.renderBlankState();
      return;
    }

    localStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", athlete.snapshot_id);
    localStorage.setItem("statscore_active_snapshot_id", athlete.snapshot_id);
    sessionStorage.setItem("STATSCORE_ACTIVE_SNAPSHOT_ID", athlete.snapshot_id);

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

    this.setImage("[data-athlete-image]", athlete.headshot_url, athlete.name);

    const approvalStatus =
      approval?.status ||
      approval?.approval_status ||
      approval?.request_status ||
      "PENDING";

    this.setAll(["[data-parent-release]", "[data-guardian-status]"], approvalStatus);
    this.setText("[data-profile-status]", "PROFILE LOADED");

    this.renderCardValue("eligibility_status", athlete.ncaa_status || "Needs Review");
    this.renderCardValue("academic_overview", athlete.gpa ? `GPA ${athlete.gpa}` : "Academic Pending");
    this.renderCardValue("athletic_snapshot", athlete.position ? `${athlete.position} Snapshot` : "Snapshot Pending");
    this.renderCardValue("profile_completeness", this.calculateProfileCompleteness(athlete) + "%");

    this.renderCardValue("production_score", production.total_yards !== "—" ? `${production.total_yards} YDS` : "Production Pending");
    this.renderCardValue("performance_trend", production.seasons ? `${production.seasons} Seasons` : "Needs History");
    this.renderCardValue("recruiting_readiness", athlete.verification_status === "VERIFIED" ? "Verification Active" : "Needs Verification");
    this.renderCardValue("exposure_score", athlete.headshot_url ? "Media Active" : "Needs Media");

    this.setText("[data-40-yard]", athlete.dash40);
    this.setText("[data-vertical]", athlete.vertical_jump);
    this.setText("[data-shuttle]", athlete.shuttle);
    this.setText("[data-broad-jump]", athlete.broad_jump);
    this.setText("[data-strength]", athlete.strength_marker);

    this.setText("[data-gpa]", athlete.gpa);
    this.setText("[data-ncaa-status]", athlete.ncaa_status);

    this.attachSnapshotToLinks(athlete.snapshot_id);

    console.log("DASHBOARD RENDERED ATHLETE:", athlete);
    console.log("DASHBOARD PRODUCTION:", production);
  },

  attachSnapshotToLinks(snapshotId){
    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      if(!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const internalPages = [
        "athlete-dashboard.html",
        "player-profile.html",
        "athlete-production-record.html",
        "athletic-snapshot.html",
        "eligibility.html",
        "readiness.html",
        "pathway.html",
        "multi-box.html",
        "crystal-report.html",
        "media.html"
      ];

      if(!internalPages.some(page => href.includes(page))) return;

      const url = new URL(href, window.location.href);
      url.searchParams.set("snapshot_id", snapshotId);
      link.setAttribute("href", url.pathname.replace(/^\//, "") + url.search);
      link.removeAttribute("aria-disabled");
      link.classList.remove("disabled");
    });
  },

  wireCardRouting(){
    document.querySelectorAll("[data-dashboard-route]").forEach(card => {
      card.addEventListener("click", event => {
        const snapshotId = this.getSnapshotId();
        if(!snapshotId){
          event.preventDefault();
          alert("Load an athlete snapshot before opening this intelligence room.");
        }
      });
    });
  },

  async init(){
    console.log("STATS-CORE Athlete Dashboard Engine v1.1 init");

    this.wireCardRouting();

    const snapshotId = this.getSnapshotId();

    if(!snapshotId){
      this.renderBlankState();
      return;
    }

    const record = await this.loadSnapshot(snapshotId);

    if(!record){
      console.warn("Dashboard snapshot_id found but no record loaded:", snapshotId);
      this.renderBlankState();
      this.setText("[data-athlete-school]", "Snapshot ID found, but database record did not load.");
      this.setText("[data-snapshot-id]", snapshotId);
      return;
    }

    const productionRecords = await this.loadProduction(snapshotId);
    const approval = await this.loadParentApproval(snapshotId);

    this.renderAthlete(record, productionRecords, approval);
  }
};

document.addEventListener("DOMContentLoaded", function(){
  window.STATSCORE_ATHLETE_DASHBOARD_ENGINE.init();
}); 
