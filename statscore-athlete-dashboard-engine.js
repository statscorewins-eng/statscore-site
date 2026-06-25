window.STATSCORE_ATHLETE_DASHBOARD_ENGINE = { 
  version: "v1.3-stream3-spine", 
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

  scoreAuthority(){
    return window.STATSCORE_SCORE_AUTHORITY_ENGINE || null;
  },

  verificationAuthority(){
    return window.STATSCORE_VERIFICATION_AUTHORITY_ENGINE || null;
  },

  explainer(){
    return window.STATSCORE_INTELLIGENCE_EXPLAINER_ENGINE || null;
  },

  setText(selector, value, fallback = "—"){
    const el = document.querySelector(selector);
    if(el) el.textContent = value === null || value === undefined || value === "" ? fallback : value;
  },

  setAll(selectors, value, fallback = "—"){
    selectors.forEach(sel => this.setText(sel, value, fallback));
  },

  setImage(selector, url, name = "Athlete Image"){
    const img = document.querySelector(selector);
    const placeholder = document.querySelector("[data-photo-placeholder]");
    if(!img) return;

    const cleanUrl = String(url || "").trim();

    if(cleanUrl){
      img.src = cleanUrl;
      img.alt = name;
      img.style.display = "block";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.objectPosition = "center top";
      if(placeholder) placeholder.style.display = "none";
    }else{
      img.removeAttribute("src");
      img.alt = "Athlete Image Required";
      img.style.display = "none";
      if(placeholder) placeholder.style.display = "grid";
    }
  },

  n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  },

  show(value, fallback = "—"){
    return value === null || value === undefined || value === "" ? fallback : value;
  },

  scoreValue(...values){
    for(const v of values){
      const n = this.n(v);
      if(n !== null) return n;
    }
    return "—";
  },

  async loadSnapshot(snapshotId){
    const db = this.getDb();
    const cleanSnapshotId = String(snapshotId || "").trim();

    console.log("DASHBOARD LOAD snapshot_id:", cleanSnapshotId);

    if(!db || !cleanSnapshotId) return null;

    const primary = await db
      .from("statscore_snapshots")
      .select("*")
      .eq("snapshot_id", cleanSnapshotId)
      .maybeSingle();

    if(primary.error){
      console.error("Athlete Dashboard snapshot load failed:", primary.error);
      return null;
    }

    if(primary.data){
      return {
        __source_table: "statscore_snapshots",
        __legacy_fallback: false,
        ...primary.data
      };
    }

    const fallback = await db
      .from("sc_snapshot_intakes")
      .select("*")
      .eq("snapshot_id", cleanSnapshotId)
      .maybeSingle();

    if(fallback.error){
      console.warn("Athlete Dashboard legacy intake fallback failed:", fallback.error);
      return null;
    }

    if(fallback.data){
      const intake = fallback.data;
      const payload = intake.intake_payload || {};

      return {
        __source_table: "sc_snapshot_intakes",
        __legacy_fallback: true,
        snapshot_id: intake.snapshot_id,
        athlete_id: intake.athlete_id,
        athlete_display_name:
          intake.athlete_name ||
          `${payload.firstName || payload.first_name || ""} ${payload.lastName || payload.last_name || ""}`.trim(),

        first_name: payload.firstName || payload.first_name || "",
        last_name: payload.lastName || payload.last_name || "",

        primary_sport: intake.sport || payload.primarySport || payload.sport || "",
        primary_position: intake.position || payload.primaryPosition || payload.position || "",
        secondary_position: payload.secondaryPosition || payload.secondary_position || "",

        graduation_class: payload.graduationClass || payload.classYear || payload.graduation_year || "",
        school_program: payload.schoolProgram || payload.school || "",
        city_state: payload.cityState || [payload.city, payload.state].filter(Boolean).join(", "),

        height: payload.height || "",
        weight: payload.weight || "",

        current_gpa: payload.currentGpa || payload.gpa || "",
        ncaa_eligibility_status: payload.ncaaEligibilityStatus || payload.ncaa_status || "",

        dash40: payload.dash40 || payload.forty || payload.fortyDash || "",
        vertical_jump: payload.verticalJump || payload.vertical || "",
        shuttle: payload.shuttle || "",
        broad_jump: payload.broadJump || payload.broad_jump || "",
        strength_marker: payload.strengthMarker || payload.strength_marker || "",

        headshot_public_url: payload.headshot_public_url || payload.headshotUrl || payload.headshot_url || payload.photo_url || "",

        verification_authority: "SELF_REPORTED",
        verification_status: "UNVERIFIED",
        verification_color: "YELLOW",
        score_status: "COMPOSITE_PENDING",

        raw_payload: payload
      };
    }

    return null;
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
      record?.athlete_name ||
      raw.athlete_display_name ||
      `${record?.first_name || raw.firstName || raw.first_name || ""} ${record?.last_name || raw.lastName || raw.last_name || ""}`.trim() ||
      ""
    );
  },

  normalizeRecord(record){
    const raw = record?.raw_payload || {};

    return {
      source_table: record?.__source_table || "",
      legacy_fallback: Boolean(record?.__legacy_fallback),

      snapshot_id: record?.snapshot_id || raw.snapshot_id || "",
      athlete_id: record?.athlete_id || raw.athlete_id || "",
      name: this.buildAthleteName(record),

      first_name: record?.first_name || raw.firstName || raw.first_name || "",
      last_name: record?.last_name || raw.lastName || raw.last_name || "",

      sport: record?.primary_sport || record?.sport || raw.primarySport || raw.primary_sport || raw.sport || "",
      position: record?.primary_position || record?.position || raw.primaryPosition || raw.primary_position || raw.position || "",
      secondary_position: record?.secondary_position || raw.secondaryPosition || raw.secondary_position || "",

      class_year: record?.graduation_class || record?.class_year || raw.graduationClass || raw.classYear || raw.class_year || "",
      school: record?.school_program || record?.school || raw.schoolProgram || raw.school || "",
      city_state: record?.city_state || raw.cityState || raw.city_state || "",

      height: record?.height || raw.height || "",
      weight: record?.weight || raw.weight || "",

      dash40: record?.dash40 || record?.dash_40 || raw.dash40 || raw.forty || raw.fortyDash || "",
      vertical_jump: record?.vertical_jump || raw.verticalJump || raw.vertical || "",
      shuttle: record?.shuttle || raw.shuttle || "",
      broad_jump: record?.broad_jump || raw.broadJump || raw.broad_jump || "",
      strength_marker: record?.strength_marker || raw.strengthMarker || raw.strength_marker || "",

      gpa: record?.current_gpa || record?.gpa || raw.currentGpa || raw.gpa || "",
      sat: record?.sat || record?.sat_score || raw.sat || raw.satScore || "",
      act: record?.act || record?.act_score || raw.act || raw.actScore || "",
      class_rank: record?.class_rank || raw.classRank || raw.class_rank || "",
      ncaa_status: record?.ncaa_eligibility_status || record?.ncaa_status || raw.ncaaEligibilityStatus || raw.ncaa_status || "",

      headshot_url:
        record?.headshot_public_url ||
        record?.headshot_url ||
        raw.headshot_public_url ||
        raw.headshotUrl ||
        raw.headshot_url ||
        raw.photo_url ||
        "",

      verification_authority:
        record?.verification_authority ||
        raw.verification_authority ||
        "SELF_REPORTED",

      verification_status:
        record?.verification_status ||
        raw.verificationStatus ||
        raw.verification_status ||
        "UNVERIFIED",

      verification_color:
        record?.verification_color ||
        raw.verification_color ||
        "YELLOW",

      score_status:
        record?.score_status ||
        raw.scoreStatus ||
        raw.score_status ||
        "COMPOSITE_PENDING",

      position_score: record?.position_score || raw.positionScore || raw.position_score || "",
      athletic_score: record?.athletic_score || raw.athleticScore || raw.athletic_score || "",
      production_score: record?.production_score || raw.productionScore || raw.production_score || "",
      academic_score: record?.academic_score || raw.academicScore || raw.academic_score || "",
      character_score: record?.character_score || raw.characterScore || raw.character_score || "",

      exposure_score: record?.exposure_score || raw.exposure_score || "",
      recruiting_readiness: record?.recruiting_readiness || raw.recruiting_readiness || "",

      production_tier: record?.production_tier || raw.production_tier || "",
      production_level: record?.production_level || raw.production_level || "",
      snapshot_stage: record?.snapshot_stage || raw.snapshot_stage || "",

      raw
    };
  },

  getVerificationModel(athlete){
    const engine = this.verificationAuthority();

    const context = {
      verification_authority: athlete.verification_authority || "SELF_REPORTED",
      verification_status: athlete.verification_status || "UNVERIFIED",
      verification_color: athlete.verification_color || "YELLOW"
    };

    if(engine?.resolveVerificationModel){
      return engine.resolveVerificationModel(context);
    }

    return {
      verification_authority: context.verification_authority,
      verification_status:
        context.verification_authority === "SELF_REPORTED" ? "UNVERIFIED" : context.verification_status,
      verification_color:
        context.verification_authority === "SELF_REPORTED" ? "YELLOW" : context.verification_color,
      is_verified: context.verification_status === "VERIFIED" && context.verification_authority !== "SELF_REPORTED",
      is_self_reported: context.verification_authority === "SELF_REPORTED",
      performance_traits_unlocked: false,
      locked_performance_traits: []
    };
  },

  getScoreModel(snapshotId){
    const engine = this.scoreAuthority();

    if(engine?.getDashboardScoreModel){
      return engine.getDashboardScoreModel(snapshotId);
    }

    return {
      snapshot_id: snapshotId,
      composite_status: "PENDING",
      composite_display_allowed: false,
      display_rule: "Composite authority not active.",
      scores: []
    };
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
        rushing_tds: "—",
        total_yards: "—",
        total_tds: "—",
        awards: "—",
        player_of_game: "—"
      };
    }

    let passingYards = 0;
    let passingTds = 0;
    let rushingYards = 0;
    let rushingTds = 0;
    let totalYards = 0;
    let totalTds = 0;
    let awards = 0;
    let playerOfGame = 0;

    records.forEach(r => {
      const p = r.stat_payload || r.raw_payload || r;

      const passYds = this.n(p.passing_yards) || 0;
      const passTds = this.n(p.passing_touchdowns || p.passing_tds) || 0;
      const rushYds = this.n(p.rushing_yards) || 0;
      const rushTds = this.n(p.rushing_touchdowns || p.rushing_tds) || 0;
      const rowTotalYds = this.n(p.total_yards) || passYds + rushYds;
      const rowTotalTds = this.n(p.total_touchdowns || p.total_tds) || passTds + rushTds;

      passingYards += passYds;
      passingTds += passTds;
      rushingYards += rushYds;
      rushingTds += rushTds;
      totalYards += rowTotalYds;
      totalTds += rowTotalTds;
      awards += this.n(p.awards_count || p.awards) || 0;
      playerOfGame += this.n(p.player_of_game_count) || 0;
    });

    return {
      seasons: records.length,
      passing_yards: passingYards || "—",
      passing_tds: passingTds || "—",
      rushing_yards: rushingYards || "—",
      rushing_tds: rushingTds || "—",
      total_yards: totalYards || "—",
      total_tds: totalTds || "—",
      awards: awards || "—",
      player_of_game: playerOfGame || "—"
    };
  },

  resolveDashboardScores(athlete){
    return {

        composite_label: "Composite Score",
        
        composite_value: "🔒",

        composite_state: "COMPOSITE SCORE PENDING",

        position_score: this.scoreValue(athlete.position_score),

        athletic_score: this.scoreValue(athlete.athletic_score),

        production_score: this.scoreValue(athlete.production_score),

        academic_score: this.scoreValue(athlete.academic_score),

        character_score: this.scoreValue(athlete.character_score)

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

    this.setText("[data-core-score]", "PENDING");
    this.setText("[data-score-state]", "COMPOSITE PENDING");

    this.setText("[data-position-score]", "—");
    this.setText("[data-athletic-score]", "—");
    this.setText("[data-production-score]", "—");
    this.setText("[data-academic-score]", "—");
    this.setText("[data-character-score]", "—");

    this.setText("[data-card-eligibility]", "Pending");
    this.setText("[data-card-exposure]", "Pending");
    this.setText("[data-card-recruiting]", "Pending");
    this.setText("[data-card-trend]", "Pending");
    this.setText("[data-card-complete]", "0%");
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

    const verification = this.getVerificationModel(athlete);
    const scoreModel = this.getScoreModel(athlete.snapshot_id);
    const scores = this.resolveDashboardScores(athlete);

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

    this.setText("[data-parent-status]", `Parent Release: ${approvalStatus}`);
    this.setAll(["[data-parent-release]", "[data-guardian-status]", "[data-gov-guardian]"], approvalStatus);
    this.setText("[data-profile-status]", "PROFILE LOADED");

    const completeness = this.calculateProfileCompleteness(athlete);

    this.setText("[data-core-score]", scores.composite_value);
    this.setText("[data-score-state]", scores.composite_state);

    this.setText("[data-position-score]", scores.position_score);
    this.setText("[data-athletic-score]", scores.athletic_score);
    this.setText("[data-production-score]", scores.production_score);
    this.setText("[data-academic-score]", scores.academic_score);
    this.setText("[data-character-score]", scores.character_score);

    this.setText("[data-card-eligibility]", athlete.ncaa_status || "Needs Review");
    this.setText("[data-card-eligibility-line2]", `Core Courses: —\nGPA: ${athlete.gpa || "—"}`);

    this.setText("[data-card-exposure]", athlete.headshot_url ? "Media Active" : "Needs Media");
    this.setText("[data-card-exposure-line]", athlete.headshot_url ? "Media Reach: Active" : "Media Reach: Pending");

    this.setText(
      "[data-card-recruiting]",
      verification.is_verified ? "Verification Active" : "Needs Verification"
    );

    this.setText(
      "[data-card-recruiting-line]",
      athlete.production_tier || athlete.production_level || "Interest Registry: Pending"
    );

    this.setText("[data-card-trend]", production.seasons ? `${production.seasons} Seasons` : "Needs History");
    this.setText("[data-card-trend-line]", production.total_yards !== "—" ? `${production.total_yards} total yards` : "History Required");

    this.setText("[data-card-complete]", completeness + "%");
    this.setText("[data-card-complete-line]", `Required Fields: ${completeness >= 80 ? "Strong" : "In Progress"}`);

    this.setText("[data-metric-40]", athlete.dash40);
    this.setText("[data-metric-vertical]", athlete.vertical_jump);
    this.setText("[data-metric-shuttle]", athlete.shuttle);
    this.setText("[data-metric-broad]", athlete.broad_jump);
    this.setText("[data-metric-strength]", athlete.strength_marker);

    this.setText("[data-academic-gpa]", athlete.gpa);
    this.setText("[data-academic-sat]", athlete.sat);
    this.setText("[data-academic-act]", athlete.act);
    this.setText("[data-academic-rank]", athlete.class_rank);

    this.setText("[data-media-title]", athlete.headshot_url ? "PHNX Media Connected" : "Media Production Layer");
    this.setText("[data-media-status]", athlete.headshot_url ? "Headshot/media asset connected to snapshot." : "Upload or connect film through PHNX Sports Media");

    this.setText("[data-crystal-status]", `Profile ID: ${athlete.snapshot_id}\nStatus: Loaded`);

    this.setText("[data-gov-visibility]", "Controlled");
    this.setText("[data-gov-recruiting]", verification.is_verified ? "Limited" : "Locked");
    this.setText("[data-gov-media]", athlete.headshot_url ? "Active" : "Limited");
    this.setText("[data-gov-sharing]", "Controlled");

    this.setText("[data-intel-action]", athlete.headshot_url && production.seasons ? "1" : "3");
    this.setText("[data-intel-opportunity]", production.seasons ? "Active" : "—");
    this.setText("[data-intel-feed]", "Loaded");

    this.setText("[data-recruiting-row1]", production.seasons ? `${production.seasons} seasons loaded` : "Awaiting production history");
    this.setText("[data-recruiting-row2]", verification.is_verified ? "Profile verification active" : "Pending exposure activity");
    this.setText("[data-recruiting-row3]", approvalStatus !== "PENDING" ? `Parent gate: ${approvalStatus}` : "No active requests loaded");

    this.setText("[data-feed-row1]", `Snapshot loaded: ${athlete.snapshot_id}`);
    this.setText("[data-feed-row2]", `Verification: ${verification.verification_status}`);
    this.setText("[data-feed-row3]", `Parent gate: ${approvalStatus}`);

    this.attachSnapshotToLinks(athlete.snapshot_id);

    console.log("DASHBOARD RENDERED ATHLETE:", athlete);
    console.log("DASHBOARD PRODUCTION SUMMARY:", production);
    console.log("STREAM 3 SCORE MODEL:", scoreModel);
    console.log("STREAM 3 VERIFICATION MODEL:", verification);
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
        "academic-intelligence.html",
        "eligibility.html",
        "readiness.html",
        "pathway.html",
        "multi-box.html",
        "crystal-report.html",
        "crystal-registry.html",
        "phnx-sports-media.html",
        "recruiting-readiness.html",
        "recruiting-activity.html",
        "activity-feed.html",
        "events.html",
        "profile-access.html",
        "verification-request.html",
        "parent-approval.html",
        "athlete-intelligence.html"
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
  const snapshotRouteCards = document.querySelectorAll(
    ".index-card, [data-dashboard-route]"
  );

  snapshotRouteCards.forEach(card => {
    card.style.cursor = "pointer";

    card.addEventListener("click", event => {
      const snapshotId = this.getSnapshotId();

      if(!snapshotId){
        event.preventDefault();
        alert("Load an athlete snapshot before opening this intelligence room.");
        return;
      }

      const route =
        card.getAttribute("data-dashboard-route") ||
        card.getAttribute("href") ||
        "athletic-snapshot.html";

      event.preventDefault();

      window.location.href =
        route.split("?")[0] + "?snapshot_id=" + encodeURIComponent(snapshotId);
    });
  });
}, 


  async init(){
    console.log("STATS-CORE Athlete Dashboard Engine v1.3-stream3-spine init");

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
