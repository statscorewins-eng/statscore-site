/* ============================================================
   STATScore™ Media Routing Spine
   File: statscore-media-routing.js
   Version: STATSCORE-MEDIA-ROUTING-V1
   Purpose:
   PHNX SPORTS media ingest, player card readiness,
   thumbnail routing, highlight/reel packaging,
   YouTube package preparation, approval state,
   and exposure distribution governance.
============================================================ */

window.STATScoreMediaRouting = (() => {

  const MEDIA_STATUSES = {
    NOT_READY: "NOT_READY",
    READY_FOR_INGEST: "READY_FOR_INGEST",
    INGESTED: "INGESTED",
    QUEUED: "QUEUED",
    IN_REVIEW: "IN_REVIEW",
    APPROVED: "APPROVED",
    PUBLISHED: "PUBLISHED",
    BLOCKED: "BLOCKED"
  };

  const PRODUCTION_TYPES = {
    PLAYER_CARD: "PLAYER_CARD",
    THUMBNAIL: "THUMBNAIL",
    HIGHLIGHT_FILM: "HIGHLIGHT_FILM",
    SHORT_REEL: "SHORT_REEL",
    ATHLETE_FEATURE: "ATHLETE_FEATURE",
    COMMITMENT_EDIT: "COMMITMENT_EDIT",
    GAME_DAY_EDIT: "GAME_DAY_EDIT"
  };

  const PHNX_BRAND = {
    channel: "PHNX SPORTS",
    slogan: "ELEVATE YOUR GAME. ANY SPORT. EVERY ATHLETE.",
    visual_identity: [
      "matte black",
      "charcoal",
      "crimson red",
      "metallic silver",
      "broadcast-grade",
      "multi-sport"
    ]
  };

  function core(){ return window.STATScoreCore || null; }
  function data(){ return window.STATScoreData || null; }
  function intelligence(){ return window.STATScoreIntelligence || null; }
  function access(){ return window.STATScoreRoleAccess || null; }

  function safe(value, fallback = ""){
    return core()?.safe?.(value, fallback) ?? (value || fallback);
  }

  function normalize(value){
    return String(value || "").trim();
  }

  function hasHeadshot(snapshot){
    return !!snapshot?.headshot_public_url;
  }

  function hasFilm(snapshot){
    return !!(snapshot?.highlight_url || snapshot?.game_film_url);
  }

  function hasIdentity(snapshot){
    return !!(
      snapshot?.athlete_display_name &&
      snapshot?.sport &&
      snapshot?.position &&
      snapshot?.graduation_class
    );
  }

  function mediaReadiness(snapshot){
    const completion =
      core()?.profileCompletion?.(snapshot) || { percent: 0, missing: [] };

    const readyForCard =
      hasIdentity(snapshot) && hasHeadshot(snapshot);

    const readyForThumbnail =
      hasIdentity(snapshot) && hasHeadshot(snapshot);

    const readyForHighlight =
      hasIdentity(snapshot) && hasFilm(snapshot);

    const readyForYouTube =
      readyForHighlight &&
      snapshot?.verification_status &&
      String(snapshot.verification_status).toUpperCase() !== "BLOCKED";

    const blockedReasons = [];

    if (!snapshot) blockedReasons.push("No athlete snapshot loaded.");
    if (snapshot && !hasIdentity(snapshot)) blockedReasons.push("Athlete identity incomplete.");
    if (snapshot && !hasHeadshot(snapshot)) blockedReasons.push("Official athlete image/headshot missing.");
    if (snapshot && !hasFilm(snapshot)) blockedReasons.push("Highlight or game film link missing.");

    return {
      status:
        readyForCard || readyForHighlight
          ? MEDIA_STATUSES.READY_FOR_INGEST
          : MEDIA_STATUSES.NOT_READY,

      completion_percent: completion.percent,

      player_card_ready: readyForCard,
      thumbnail_ready: readyForThumbnail,
      highlight_ready: readyForHighlight,
      short_reel_ready: readyForHighlight,
      youtube_ready: readyForYouTube,

      blocked: blockedReasons.length > 0,
      blocked_reasons: blockedReasons
    };
  }

  function buildMediaIngestPayload(snapshot){
    const readiness = mediaReadiness(snapshot);

    return {
      snapshot_id: snapshot?.snapshot_id || null,
      athlete_id: snapshot?.athlete_id || null,

      athlete_display_name: safe(snapshot?.athlete_display_name),
      sport: safe(snapshot?.sport),
      position: safe(snapshot?.position),
      school: safe(snapshot?.school),
      city_state: safe(snapshot?.city_state),
      graduation_class: safe(snapshot?.graduation_class),

      headshot_public_url: safe(snapshot?.headshot_public_url),
      highlight_url: safe(snapshot?.highlight_url),
      game_film_url: safe(snapshot?.game_film_url),
      social_profile_url: safe(snapshot?.social_profile_url),
      recruiting_profile_url: safe(snapshot?.recruiting_profile_url),

      eligible_for_player_card: readiness.player_card_ready,
      eligible_for_thumbnail: readiness.thumbnail_ready,
      eligible_for_highlight: readiness.highlight_ready,
      eligible_for_short_reel: readiness.short_reel_ready,

      player_card_status:
        readiness.player_card_ready
          ? "READY_FOR_GENERATION"
          : "NOT_READY",

      thumbnail_status:
        readiness.thumbnail_ready
          ? "READY_FOR_GENERATION"
          : "NOT_READY",

      highlight_status:
        readiness.highlight_ready
          ? "READY_FOR_REVIEW"
          : "PENDING_FILM",

      media_ingest_status:
        readiness.status,

      media_queue_status:
        readiness.status === MEDIA_STATUSES.READY_FOR_INGEST
          ? "QUEUED"
          : "NOT_QUEUED",

      phnx_publish_status: "NOT_PUBLISHED",

      phnx_channel: PHNX_BRAND.channel,
      routing_version: "PHNXSPORTS-MEDIA-V1",
      canon_locked: true,

      notes:
        "Generated by STATScore Media Routing Spine for PHNX SPORTS production intake."
    };
  }

  function buildProductionQueuePayload(mediaIngestId, snapshot){
    const readiness = mediaReadiness(snapshot);
    const intel = intelligence()?.explainAthlete?.(snapshot);

    return {
      media_ingest_id: mediaIngestId || null,
      snapshot_id: snapshot?.snapshot_id || null,
      athlete_id: snapshot?.athlete_id || null,

      athlete_display_name: safe(snapshot?.athlete_display_name),
      sport: safe(snapshot?.sport),
      position: safe(snapshot?.position),
      school: safe(snapshot?.school),
      city_state: safe(snapshot?.city_state),
      graduation_class: safe(snapshot?.graduation_class),

      production_status: "QUEUED",
      priority_level:
        readiness.youtube_ready ? "HIGH" : "NORMAL",

      player_card_required: readiness.player_card_ready,
      thumbnail_required: readiness.thumbnail_ready,
      highlight_film_required: readiness.highlight_ready,
      short_reel_required: readiness.short_reel_ready,

      production_type:
        readiness.highlight_ready
          ? PRODUCTION_TYPES.HIGHLIGHT_FILM
          : PRODUCTION_TYPES.PLAYER_CARD,

      source_headshot_url: safe(snapshot?.headshot_public_url),
      source_highlight_url: safe(snapshot?.highlight_url),
      source_game_film_url: safe(snapshot?.game_film_url),

      youtube_ready: readiness.youtube_ready,

      phnx_channel: PHNX_BRAND.channel,

      review_status: "PENDING_REVIEW",
      approval_status: "PENDING_APPROVAL",
      publish_status: "NOT_PUBLISHED",

      routing_version: "PHNXSPORTS-PRODUCTION-V1",
      canon_locked: true,

      intelligence_summary: intel?.summary || "",
      readiness_label: intel?.readiness?.label || "",
      exposure_label: intel?.exposure?.label || "",
      pathway_label: intel?.pathway?.label || "",

      notes:
        "Auto-created from STATScore athlete record for PHNX SPORTS production queue."
    };
  }

  function buildYouTubePackage(snapshot){
    const name = safe(snapshot?.athlete_display_name, "Athlete");
    const sport = safe(snapshot?.sport, "Sport");
    const position = safe(snapshot?.position, "Position");
    const school = safe(snapshot?.school, "School / Program");
    const grad = safe(snapshot?.graduation_class, "Class Year");
    const city = safe(snapshot?.city_state, "");

    const intel = intelligence()?.explainAthlete?.(snapshot);

    const title =
      `${name} | ${position} | ${sport} ${grad} | PHNX SPORTS`;

    const description = [
      `${name} is featured through PHNX SPORTS athlete media infrastructure.`,
      "",
      `Sport: ${sport}`,
      `Position: ${position}`,
      `Class: ${grad}`,
      `School/Program: ${school}`,
      city ? `Location: ${city}` : "",
      "",
      `STATScore Status: ${snapshot?.verification_status || "UNVERIFIED"}`,
      intel?.readiness?.label ? `Readiness: ${intel.readiness.label}` : "",
      intel?.pathway?.label ? `Pathway: ${intel.pathway.label}` : "",
      "",
      PHNX_BRAND.slogan,
      "",
      "PHNX SPORTS is the public athlete media, exposure, and storytelling layer connected to STATScore athlete intelligence infrastructure."
    ]
      .filter(Boolean)
      .join("\n");

    const tags = [
      "PHNX Sports",
      "STATScore",
      sport,
      position,
      grad,
      school,
      name,
      "Athlete Profile",
      "Highlight Film",
      "Recruiting",
      "Athlete Exposure"
    ]
      .filter(Boolean)
      .map(tag => String(tag).trim());

    return {
      title,
      description,
      tags,
      channel: PHNX_BRAND.channel,
      visibility: "PRIVATE_UNTIL_APPROVED",
      approval_required: true,
      brand_slogan: PHNX_BRAND.slogan
    };
  }

  function buildPlayerCardSpec(snapshot){
    return {
      type: PRODUCTION_TYPES.PLAYER_CARD,
      template_version: "PHNX-PLAYER-CARD-V1",
      athlete_display_name: safe(snapshot?.athlete_display_name),
      sport: safe(snapshot?.sport),
      position: safe(snapshot?.position),
      graduation_class: safe(snapshot?.graduation_class),
      school: safe(snapshot?.school),
      city_state: safe(snapshot?.city_state),
      headshot_public_url: safe(snapshot?.headshot_public_url),
      verification_status: safe(snapshot?.verification_status, "UNVERIFIED"),
      score_status: safe(snapshot?.score_status, "UNVERIFIED"),
      brand: PHNX_BRAND,
      export_status: "NOT_RENDERED"
    };
  }

  function buildThumbnailSpec(snapshot){
    return {
      type: PRODUCTION_TYPES.THUMBNAIL,
      template_version: "PHNX-THUMBNAIL-V1",
      title: `${safe(snapshot?.athlete_display_name, "Athlete")} | ${safe(snapshot?.position, "Position")}`,
      subtitle: `${safe(snapshot?.sport, "Sport")} • Class ${safe(snapshot?.graduation_class, "--")}`,
      athlete_image: safe(snapshot?.headshot_public_url),
      brand: PHNX_BRAND,
      export_status: "NOT_RENDERED"
    };
  }

  function buildHighlightPackageSpec(snapshot){
    const readiness = mediaReadiness(snapshot);

    return {
      type: PRODUCTION_TYPES.HIGHLIGHT_FILM,
      template_version: "PHNX-HIGHLIGHT-FILM-V1",

      athlete_display_name: safe(snapshot?.athlete_display_name),
      sport: safe(snapshot?.sport),
      position: safe(snapshot?.position),
      graduation_class: safe(snapshot?.graduation_class),
      school: safe(snapshot?.school),

      source_highlight_url: safe(snapshot?.highlight_url),
      source_game_film_url: safe(snapshot?.game_film_url),
      source_headshot_url: safe(snapshot?.headshot_public_url),

      required_flow: [
        "PHNX SPORTS branded intro",
        "Athlete identity card",
        "Strongest play first",
        "Escalation sequence",
        "Professional overlay package",
        "Closing PHNX SPORTS authority statement"
      ],

      ready: readiness.highlight_ready,
      approval_required: true,
      publish_status: "NOT_PUBLISHED",
      brand: PHNX_BRAND
    };
  }

  function buildMediaPackage(snapshot){
    return {
      readiness: mediaReadiness(snapshot),
      media_ingest: buildMediaIngestPayload(snapshot),
      player_card: buildPlayerCardSpec(snapshot),
      thumbnail: buildThumbnailSpec(snapshot),
      highlight_package: buildHighlightPackageSpec(snapshot),
      youtube_package: buildYouTubePackage(snapshot)
    };
  }

  async function insertMediaIngest(snapshot){
    const db = core()?.getClient?.();

    if (!db) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        media_ingest_id: ""
      };
    }

    const payload = buildMediaIngestPayload(snapshot);

    const { data: inserted, error } = await db
      .from("phnx_sports_media_ingest")
      .insert(payload)
      .select("media_ingest_id")
      .single();

    if (error) {
      console.error("PHNX media ingest insert failed:", error);
      return {
        ok: false,
        status: "INGEST_INSERT_FAILED",
        error,
        media_ingest_id: ""
      };
    }

    return {
      ok: true,
      status: "INGEST_CREATED",
      media_ingest_id: inserted?.media_ingest_id || "",
      payload
    };
  }

  async function insertProductionQueue(mediaIngestId, snapshot){
    const db = core()?.getClient?.();

    if (!db) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        production_queue_id: ""
      };
    }

    const payload = buildProductionQueuePayload(mediaIngestId, snapshot);

    const { data: inserted, error } = await db
      .from("phnx_sports_media_production_queue")
      .insert(payload)
      .select("production_queue_id")
      .single();

    if (error) {
      console.error("PHNX production queue insert failed:", error);
      return {
        ok: false,
        status: "PRODUCTION_QUEUE_INSERT_FAILED",
        error,
        production_queue_id: ""
      };
    }

    return {
      ok: true,
      status: "PRODUCTION_QUEUE_CREATED",
      production_queue_id: inserted?.production_queue_id || "",
      payload
    };
  }

  async function queueMediaPackage(snapshot){
    const readiness = mediaReadiness(snapshot);

    if (readiness.blocked) {
      return {
        ok: false,
        status: MEDIA_STATUSES.BLOCKED,
        blocked_reasons: readiness.blocked_reasons,
        readiness
      };
    }

    const ingest = await insertMediaIngest(snapshot);

    if (!ingest.ok) {
      return {
        ok: false,
        status: ingest.status,
        ingest
      };
    }

    const production = await insertProductionQueue(
      ingest.media_ingest_id,
      snapshot
    );

    if (!production.ok) {
      return {
        ok: false,
        status: production.status,
        ingest,
        production
      };
    }

    return {
      ok: true,
      status: "MEDIA_PACKAGE_QUEUED",
      media_ingest_id: ingest.media_ingest_id,
      production_queue_id: production.production_queue_id,
      ingest,
      production,
      package: buildMediaPackage(snapshot)
    };
  }

  function mediaStatusNarrative(snapshot){
    const readiness = mediaReadiness(snapshot);

    if (readiness.blocked) {
      return `PHNX SPORTS media routing is blocked: ${readiness.blocked_reasons.join(" ")}`;
    }

    if (readiness.youtube_ready) {
      return "PHNX SPORTS media package is ready for review, branding, and YouTube preparation.";
    }

    if (readiness.highlight_ready) {
      return "Athlete highlight package is ready for PHNX SPORTS review but requires approval before publishing.";
    }

    if (readiness.player_card_ready) {
      return "Athlete is ready for PHNX SPORTS player card and thumbnail production.";
    }

    return "PHNX SPORTS media package is not ready yet.";
  }

  function renderMediaPanel(targetId, snapshot){
    const el = document.getElementById(targetId);
    if (!el) return;

    const readiness = mediaReadiness(snapshot);
    const yt = buildYouTubePackage(snapshot);

    el.innerHTML = `
      <div class="media-kicker">PHNX SPORTS Media Routing</div>
      <h2>${mediaStatusNarrative(snapshot)}</h2>

      <div class="media-grid">
        <div><b>Player Card</b><span>${readiness.player_card_ready ? "Ready" : "Not Ready"}</span></div>
        <div><b>Thumbnail</b><span>${readiness.thumbnail_ready ? "Ready" : "Not Ready"}</span></div>
        <div><b>Highlight Film</b><span>${readiness.highlight_ready ? "Ready" : "Pending Film"}</span></div>
        <div><b>YouTube</b><span>${readiness.youtube_ready ? "Ready For Approval" : "Not Ready"}</span></div>
      </div>

      <div class="media-package-preview">
        <strong>Suggested Title</strong>
        <p>${core()?.escapeHTML?.(yt.title) || yt.title}</p>
      </div>
    `;
  }

  return {
    MEDIA_STATUSES,
    PRODUCTION_TYPES,
    PHNX_BRAND,

    hasHeadshot,
    hasFilm,
    hasIdentity,

    mediaReadiness,
    mediaStatusNarrative,

    buildMediaIngestPayload,
    buildProductionQueuePayload,
    buildYouTubePackage,
    buildPlayerCardSpec,
    buildThumbnailSpec,
    buildHighlightPackageSpec,
    buildMediaPackage,

    insertMediaIngest,
    insertProductionQueue,
    queueMediaPackage,

    renderMediaPanel
  };

})(); 
