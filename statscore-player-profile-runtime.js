/* ============================================================
   STATS-CORE™ PLAYER PROFILE RUNTIME
   File: statscore-player-profile-runtime.js
   Version: STATSCORE-PLAYER-PROFILE-RUNTIME-V1

   Purpose:
   Loads the active snapshot_id from URL/localStorage, pulls the
   athlete snapshot from Supabase, and renders Player Profile as
   the athlete’s explainable intelligence record / PHNX player card.
============================================================ */

(function(){
  "use strict";

  var SUPABASE_URL = "https://oyjmpbuxvfxusmbouldi.supabase.co";
  var SUPABASE_ANON_KEY = "PASTE_YOUR_EXISTING_SUPABASE_ANON_KEY_HERE";

  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

  function safe(v,fallback="—"){
    return v === undefined || v === null || v === "" ? fallback : v;
  }

  function getSnapshotId(){
    var params = new URLSearchParams(window.location.search);
    return (
      params.get("snapshot_id") ||
      localStorage.getItem("statscore_current_snapshot_id") ||
      localStorage.getItem("statscore_snapshot_id") ||
      null
    );
  }

  function normalizePayload(row){
    var payload = row?.intake_payload || {};

    if(typeof payload === "string"){
      try{ payload = JSON.parse(payload); }
      catch(e){ payload = {}; }
    }

    var first = payload.firstName || payload.first_name || "";
    var last = payload.lastName || payload.last_name || "";

    return {
      raw_row: row,
      raw_payload: payload,

      snapshot_id: row.snapshot_id || payload.snapshot_id || "",
      athlete_id: row.athlete_id || payload.athlete_id || "",
      athlete_name: row.athlete_name || `${first} ${last}`.trim() || "Athlete",

      first_name: first,
      last_name: last,

      sport: payload.primarySport || payload.sport || "",
      position: payload.primaryPosition || payload.position || "",
      secondary_position: payload.secondaryPosition || "",
      height: payload.height || "",
      weight: payload.weight || "",
      graduation_class: payload.graduationClass || payload.graduation_year || payload.gradYear || "",

      city: payload.city || "",
      state: payload.state || "",
      school: payload.school || payload.schoolProgram || "",

      gpa: payload.gpa || payload.current_gpa || payload.coreGpa || "",
      ncaa_status: payload.ncaaEligibilityStatus || payload.ncaa_status || "",
      transcript_available: payload.transcriptAvailable || payload.transcript_available || "",
      counselor_contact: payload.counselorContact || payload.counselor_contact || "",

      forty: payload.fortyDash || payload.forty || "",
      vertical: payload.vertical || "",
      shuttle: payload.shuttle || "",
      broad_jump: payload.broadJump || payload.broad_jump || "",
      strength_marker: payload.strengthMarker || payload.strength_marker || "",

      highlight_url: payload.highlightUrl || payload.highlight_url || "",
      game_film_url: payload.gameFilmUrl || payload.game_film_url || "",
      recruiting_profile_url: payload.recruitingProfileUrl || payload.recruiting_profile_url || "",
      social_url: payload.socialProfileUrl || payload.social_url || "",

      headshot_url:
        payload.headshotUrl ||
        payload.headshot_url ||
        payload.athleteHeadshotUrl ||
        payload.photo_url ||
        payload.photo ||
        "",

      verification_status: payload.verificationStatus || payload.verification_status || "unverified",

      created_at: row.created_at || ""
    };
  }

  async function loadSnapshot(){
    var snapshotId = getSnapshotId();

    if(!window.supabase){
      console.error("STATS-CORE Player Profile: Supabase CDN missing.");
      return null;
    }

    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    var query = client
      .from("sc_snapshot_intakes")
      .select("*");

    if(snapshotId){
      query = query.eq("snapshot_id", snapshotId);
    }else{
      query = query.order("created_at",{ascending:false}).limit(1);
    }

    var result = await query.limit(1);

    console.log("STATS-CORE Player Profile Snapshot Query:", result);

    if(result.error){
      console.error("STATS-CORE Player Profile Snapshot Error:", result.error);
      return null;
    }

    if(!result.data || !result.data.length){
      console.error("STATS-CORE Player Profile: No snapshot found.");
      return null;
    }

    var row = result.data[0];
    localStorage.setItem("statscore_current_snapshot_id", row.snapshot_id);

    return normalizePayload(row);
  }

  function setText(selectors,value){
    selectors.forEach(function(sel){
      var el = qs(sel);
      if(el) el.textContent = safe(value);
    });
  }

  function renderIdentity(snapshot){
    setText([
      "[data-sc='athlete-name']",
      ".athlete-name",
      "#athleteName"
    ], snapshot.athlete_name);

    setText([
      "[data-sc='position']",
      "#primaryPosition"
    ], snapshot.position);

    setText([
      "[data-sc='school']",
      "#schoolName"
    ], snapshot.school);

    setText([
      "[data-sc='class']",
      "#gradClass"
    ], snapshot.graduation_class ? "Class of " + snapshot.graduation_class : "");

    setText([
      "[data-sc='height']"
    ], snapshot.height);

    setText([
      "[data-sc='weight']"
    ], snapshot.weight ? snapshot.weight + " lbs" : "");

    setText([
      "[data-sc='snapshot-id']",
      "#snapshotId"
    ], snapshot.snapshot_id);

    setText([
      "[data-sc='location']"
    ], [snapshot.city, snapshot.state].filter(Boolean).join(", "));

    var photo = qs("[data-sc='headshot']") || qs(".profile-photo img") || qs(".athlete-photo img") || qs(".photo-box img");

    if(photo && snapshot.headshot_url){
      photo.src = snapshot.headshot_url;
      photo.alt = snapshot.athlete_name;
    }
  }

  function renderMetrics(snapshot){
    var map = {
      "forty": snapshot.forty,
      "vertical": snapshot.vertical,
      "shuttle": snapshot.shuttle,
      "broad-jump": snapshot.broad_jump,
      "strength-marker": snapshot.strength_marker,
      "gpa": snapshot.gpa,
      "ncaa-status": snapshot.ncaa_status,
      "transcript": snapshot.transcript_available,
      "counselor": snapshot.counselor_contact
    };

    Object.keys(map).forEach(function(key){
      setText([`[data-sc='${key}']`], map[key]);
    });
  }

  function renderStatscoreSnapshot(snapshot){
    var scoreSection = qs("#statscore-snapshot") || qs("[data-sc-section='statscore-snapshot']");
    if(!scoreSection) return;

    var status = snapshot.verification_status || "unverified";

    var html = `
      <div class="section-title">STATS-CORE / SNAPSHOT</div>
      <p><b>What it is:</b> The athlete’s current intelligence signal generated from submitted snapshot data, evidence quality, performance indicators, academic readiness, and governance status.</p>
      <p><b>Status:</b> ${safe(status).toUpperCase()}</p>
      <p><b>Snapshot ID:</b> ${safe(snapshot.snapshot_id)}</p>
      <p><b>What affects the score:</b> Position fit, athletic metrics, production evidence, academic readiness, verification status, profile completeness, and parent/governance release.</p>
      <p><b>Why it matters:</b> The STATS-CORE score gives athletes, families, coaches, evaluators, recruiters, and programs a fast but explainable view of current athlete readiness.</p>
    `;

    scoreSection.innerHTML = html;
  }

  function wireSnapshotLinks(snapshot){
    if(!snapshot.snapshot_id) return;

    qsa("a[href]").forEach(function(a){
      var href = a.getAttribute("href");
      if(!href) return;

      var internalTargets = [
        "athlete-dashboard.html",
        "player-profile.html",
        "crystal-report.html",
        "rankings.html",
        "readiness.html",
        "media.html",
        "recruiter-access.html",
        "multi-box.html",
        "eligibility.html"
      ];

      var matches = internalTargets.some(function(target){
        return href.includes(target);
      });

      if(!matches) return;
      if(href.includes("snapshot_id=")) return;
      if(href.startsWith("#")) return;

      var anchor = "";
      var base = href;

      if(href.includes("#")){
        var parts = href.split("#");
        base = parts[0];
        anchor = "#" + parts[1];
      }

      var joiner = base.includes("?") ? "&" : "?";
      a.setAttribute("href", base + joiner + "snapshot_id=" + encodeURIComponent(snapshot.snapshot_id) + anchor);
    });
  }

  async function init(){
    console.log("STATS-CORE Player Profile Runtime Loaded");

    var snapshot = await loadSnapshot();

    if(!snapshot){
      console.warn("STATS-CORE Player Profile: snapshot unavailable.");
      return;
    }

    console.log("STATS-CORE Player Profile Snapshot Loaded:", snapshot);

    renderIdentity(snapshot);
    renderMetrics(snapshot);
    renderStatscoreSnapshot(snapshot);
    wireSnapshotLinks(snapshot);
  }

  document.addEventListener("DOMContentLoaded", init);

})(); 
