/*
==========================================================
STATS-CORE™ / PHNX SPORTS MEDIA ENGINE
File: statscore-phnx-media-engine.js
Version: PHNX-MEDIA-ENGINE-V2-INDUSTRIAL
Owner: Stream 7 — Crystal / Exposure / Media

Purpose:
Industrial PHNX Sports media runtime.

Owns:
- Snapshot Intake media capture
- PHNX asset registration
- PHNX media job creation/update
- Music selection
- Render bridge
- YouTube publishing bridge
- Multi-Box notification bridge
- Job events
- Governance receipts
- Worker claim/release
==========================================================
*/

(function () {
  "use strict";

  const ENGINE_VERSION = "PHNX-MEDIA-ENGINE-V2-INDUSTRIAL";

  const TABLES = {
    ASSETS: "phnx_media_assets",
    JOBS: "phnx_media_jobs",
    EVENTS: "phnx_media_job_events",
    MUSIC: "phnx_music_library",
    RENDERS: "phnx_render_outputs",
    YOUTUBE: "phnx_youtube_posts",
    RECEIPTS: "phnx_media_receipts",

    MBX_MESSAGES: "sc_multibox_messages",
    MBX_RECEIPTS: "sc_multibox_receipts",
    MBX_AUDIT: "sc_multibox_audit_events"
  };

  const JOB_TYPE = "phnx_sports_youtube_package";
  const CHANNEL_KEY = "phnx_sports_youtube";

  const STATUS = {
    PENDING: "PENDING",
    ASSETS_CAPTURED: "ASSETS_CAPTURED",
    QUEUED_FOR_REVIEW: "QUEUED_FOR_REVIEW",
    APPROVED_FOR_RENDER: "APPROVED_FOR_RENDER",
    HELD_FOR_REVIEW: "HELD_FOR_REVIEW",
    REJECTED: "REJECTED",
    QUEUED_FOR_RENDER: "QUEUED_FOR_RENDER",
    RENDERING: "RENDERING",
    RENDERED: "RENDERED",
    QUEUED_TO_YOUTUBE: "QUEUED_TO_YOUTUBE",
    POSTING_TO_YOUTUBE: "POSTING_TO_YOUTUBE",
    POSTED: "POSTED",
    MULTIBOX_NOTIFIED: "MULTIBOX_NOTIFIED",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED"
  };

  function db() {
    return (
      window.STATScoreData?.getClient?.() ||
      window.STATScoreCore?.getClient?.() ||
      window.supabaseClient ||
      window.STATScoreSupabase ||
      null
    );
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function val(id) {
    return clean(document.getElementById(id)?.value);
  }

  function valByName(name) {
    return clean(document.querySelector(`[name="${name}"]`)?.value);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "";
  }

  function safeJson(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function normalizeSport(value) {
    return clean(value).toLowerCase();
  }

  function hasAnyMediaInput() {
    return Boolean(
      val("headshotUrl") ||
      val("headshotPath") ||
      val("headshotFileName") ||
      valByName("highlightUrl") ||
      valByName("gameFilmUrl") ||
      valByName("socialProfileUrl") ||
      valByName("recruitingProfileUrl")
    );
  }

  function buildSourceMeta(saved = {}) {
    const raw = saved.raw_payload || {};
    const sourceClaims =
      saved.source_claims_payload ||
      raw.source_claims_payload ||
      safeJson(val("sourceClaimsPayload"), {});

    return {
      trust_classification:
        saved.trust_classification ||
        sourceClaims.trust_classification ||
        val("trustClassification") ||
        "SELF_REPORTED",

      source_origin:
        saved.source_origin ||
        sourceClaims.source_origin ||
        val("sourceOrigin") ||
        "athlete_self",

      submitted_by_role:
        saved.submitted_by_role ||
        sourceClaims.submitted_by_role ||
        val("submittedByRole") ||
        "athlete",

      submitted_by_name:
        saved.submitted_by_name ||
        sourceClaims.submitted_by_name ||
        val("submittedByName") ||
        null,

      submitted_by_email:
        saved.submitted_by_email ||
        sourceClaims.submitted_by_email ||
        val("submittedByEmail") ||
        null
    };
  }

  function buildAthleteContext(saved = {}) {
    return {
      snapshot_id: saved.snapshot_id || val("snapshotId") || null,
      athlete_id: saved.athlete_id || val("athleteId") || null,

      athlete_display_name:
        saved.athlete_display_name ||
        [saved.first_name || valByName("firstName"), saved.last_name || valByName("lastName")]
          .filter(Boolean)
          .join(" ")
          .trim(),

      sport: normalizeSport(saved.primary_sport || valByName("primarySport")),
      primary_position: clean(saved.primary_position || valByName("primaryPosition")),
      school_program: clean(saved.school_program || valByName("schoolProgram")),
      graduation_class: clean(saved.graduation_class || valByName("graduationClass"))
    };
  }

  function buildAssetList(saved = {}) {
    const ctx = buildAthleteContext(saved);
    const source = buildSourceMeta(saved);
    const assets = [];

    const headshotUrl = val("headshotUrl") || saved.headshot_url || saved.headshot_public_url || "";
    const headshotPath = val("headshotPath") || saved.headshot_path || "";
    const headshotFileName = val("headshotFileName") || saved.headshot_filename || "";

    if (headshotUrl || headshotPath || headshotFileName) {
      assets.push({
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        asset_type: "headshot",
        asset_label: "Official Athlete Headshot",
        source_kind: "uploaded_file",
        source_url: headshotUrl || null,
        storage_path: headshotPath || null,
        public_url: headshotUrl || null,
        original_filename: headshotFileName || null,
        trust_classification: source.trust_classification,
        source_origin: source.source_origin,
        submitted_by_role: source.submitted_by_role,
        submitted_by_name: source.submitted_by_name,
        submitted_by_email: source.submitted_by_email,
        review_status: "pending",
        metadata: {
          engine_version: ENGINE_VERSION,
          captured_from: "snapshot-intake.html",
          asset_role: "player_identity",
          captured_at: nowISO()
        }
      });
    }

    const urlAssets = [
      ["highlightUrl", "highlight_url", "Athlete Highlight Reel", "highlight_film"],
      ["gameFilmUrl", "game_film_url", "Athlete Game Film", "game_film"],
      ["socialProfileUrl", "social_profile_url", "Athlete Social Profile", "social_reference"],
      ["recruitingProfileUrl", "recruiting_profile_url", "Athlete Recruiting Profile", "recruiting_reference"]
    ];

    urlAssets.forEach(([fieldName, assetType, label, role]) => {
      const sourceUrl =
        valByName(fieldName) ||
        saved[fieldName] ||
        saved[fieldName.replace(/[A-Z]/g, m => "_" + m.toLowerCase())] ||
        "";

      if (!sourceUrl) return;

      assets.push({
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        asset_type: assetType,
        asset_label: label,
        source_kind: "submitted_url",
        source_url: sourceUrl,
        trust_classification: source.trust_classification,
        source_origin: source.source_origin,
        submitted_by_role: source.submitted_by_role,
        submitted_by_name: source.submitted_by_name,
        submitted_by_email: source.submitted_by_email,
        review_status: "pending",
        metadata: {
          engine_version: ENGINE_VERSION,
          captured_from: "snapshot-intake.html",
          asset_role: role,
          captured_at: nowISO()
        }
      });
    });

    return assets.filter(a => a.snapshot_id);
  }

  async function writeReceipt(payload = {}) {
    const client = db();
    if (!client) return null;

    try {
      const receipt = {
        media_job_id: payload.media_job_id || null,
        asset_id: payload.asset_id || null,
        render_id: payload.render_id || null,
        youtube_post_id: payload.youtube_post_id || null,
        snapshot_id: payload.snapshot_id || null,
        athlete_id: payload.athlete_id || null,
        receipt_type: payload.receipt_type || "PHNX_MEDIA_EVENT",
        status: payload.status || "RECORDED",
        receipt_payload: {
          engine_version: ENGINE_VERSION,
          ...payload.receipt_payload,
          created_at: nowISO()
        }
      };

      const { data, error } = await client
        .from(TABLES.RECEIPTS)
        .insert(receipt)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("[PHNX Media] Receipt write skipped:", err);
      return null;
    }
  }

  async function writeJobEvent({ media_job_id, from_status = null, to_status = null, event_type, payload = {} }) {
    const client = db();
    if (!client || !media_job_id) return null;

    try {
      const row = {
        media_job_id,
        event_type: event_type || "JOB_EVENT",
        from_status,
        to_status,
        actor_type: "system",
        actor_label: "PHNX Sports Media Engine",
        event_payload: {
          engine_version: ENGINE_VERSION,
          ...payload,
          created_at: nowISO()
        }
      };

      const { data, error } = await client
        .from(TABLES.EVENTS)
        .insert(row)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("[PHNX Media] Job event write skipped:", err);
      return null;
    }
  }

  async function selectMusicTrack(saved = {}) {
    const client = db();
    if (!client) return null;

    const ctx = buildAthleteContext(saved);
    const sport = ctx.sport || null;

    try {
      const { data, error } = await client
        .from(TABLES.MUSIC)
        .select("*")
        .eq("active", true)
        .order("track_id", { ascending: true });

      if (error) throw error;

      const tracks = Array.isArray(data) ? data : [];
      if (!tracks.length) return null;

      const sportHigh = tracks.find(t =>
        clean(t.sport).toLowerCase() === sport &&
        clean(t.intensity).toLowerCase() === "high"
      );

      if (sportHigh) return sportHigh;

      const hype = tracks.find(t => clean(t.mood).toLowerCase() === "hype");
      if (hype) return hype;

      return tracks[0];
    } catch (err) {
      console.warn("[PHNX Media] Music selection skipped:", err);
      return null;
    }
  }

  async function registerAssets(saved = {}) {
    const client = db();
    if (!client) throw new Error("PHNX Media Engine: Supabase client unavailable.");

    const assets = buildAssetList(saved);
    const registered = [];

    if (!assets.length) return registered;

    for (const asset of assets) {
      const { data: existing, error: existingError } = await client
        .from(TABLES.ASSETS)
        .select("*")
        .eq("snapshot_id", asset.snapshot_id)
        .eq("asset_type", asset.asset_type)
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { data, error } = await client
          .from(TABLES.ASSETS)
          .update({
            ...asset,
            updated_at: nowISO(),
            metadata: {
              ...(existing.metadata || {}),
              ...(asset.metadata || {}),
              updated_by_engine: ENGINE_VERSION,
              updated_at: nowISO()
            }
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (error) throw error;
        registered.push(data);

        await writeReceipt({
          asset_id: data.asset_id,
          snapshot_id: data.snapshot_id,
          athlete_id: data.athlete_id,
          receipt_type: "PHNX_MEDIA_ASSET_UPDATED",
          status: "ASSET_UPDATED",
          receipt_payload: {
            asset_type: data.asset_type,
            asset_label: data.asset_label
          }
        });
      } else {
        const { data, error } = await client
          .from(TABLES.ASSETS)
          .insert(asset)
          .select("*")
          .single();

        if (error) throw error;
        registered.push(data);

        await writeReceipt({
          asset_id: data.asset_id,
          snapshot_id: data.snapshot_id,
          athlete_id: data.athlete_id,
          receipt_type: "PHNX_MEDIA_ASSET_CAPTURED",
          status: "ASSET_CAPTURED",
          receipt_payload: {
            asset_type: data.asset_type,
            asset_label: data.asset_label
          }
        });
      }
    }

    return registered;
  }

  async function createOrUpdateMediaJob(saved = {}, registeredAssets = []) {
    const client = db();
    if (!client) throw new Error("PHNX Media Engine: Supabase client unavailable.");

    const ctx = buildAthleteContext(saved);
    if (!ctx.snapshot_id) throw new Error("PHNX Media Engine: snapshot_id missing.");

    const musicTrack = await selectMusicTrack(saved);

    const inputPayload = {
      engine_version: ENGINE_VERSION,
      source_page: "snapshot-intake.html",
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,
      athlete_display_name: ctx.athlete_display_name,
      assets: registeredAssets.map(a => ({
        asset_id: a.asset_id,
        asset_type: a.asset_type,
        asset_label: a.asset_label,
        source_kind: a.source_kind,
        source_url: a.source_url,
        public_url: a.public_url,
        storage_path: a.storage_path,
        review_status: a.review_status
      })),
      captured_at: nowISO()
    };

    const renderPayload = {
      engine_version: ENGINE_VERSION,
      render_profile: "phnx_sports_youtube_package_v1",
      output_format: "youtube_video",
      branding: {
        channel: "PHNX SPORTS",
        colorway: "red_black_white",
        watermark: true,
        lower_third: true,
        player_card: true,
        intro: true,
        outro: true
      },
      music: musicTrack ? {
        track_id: musicTrack.track_id,
        track_title: musicTrack.track_title,
        mood: musicTrack.mood,
        sport: musicTrack.sport,
        intensity: musicTrack.intensity,
        source: "phnx_music_library"
      } : null,
      created_at: nowISO()
    };

    const publishPayload = {
      engine_version: ENGINE_VERSION,
      channel_key: CHANNEL_KEY,
      platform: "youtube",
      title_template: "{{athlete_display_name}} | PHNX Sports Highlight Feature",
      description_template: "PHNX Sports athlete media package generated from governed STATS-CORE™ intake.",
      tags: [
        "PHNX Sports",
        "STATS-CORE",
        ctx.sport,
        ctx.primary_position,
        ctx.school_program,
        ctx.graduation_class
      ].filter(Boolean),
      created_at: nowISO()
    };

    const payload = {
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,
      job_type: JOB_TYPE,
      channel_key: CHANNEL_KEY,
      athlete_display_name: ctx.athlete_display_name,
      sport: ctx.sport,
      primary_position: ctx.primary_position,
      school_program: ctx.school_program,
      graduation_class: ctx.graduation_class,
      job_status: STATUS.ASSETS_CAPTURED,
      review_status: "pending",
      music_track_id: musicTrack?.track_id || null,
      music_selection_reason: musicTrack
        ? `System-selected track based on sport=${ctx.sport || "unknown"} and active PHNX music library.`
        : null,
      render_required: true,
      youtube_publish_required: true,
      multibox_notice_required: true,
      locked: false,
      attempt_count: 0,
      max_attempts: 3,
      priority: "standard",
      input_payload: inputPayload,
      render_payload: renderPayload,
      publish_payload: publishPayload,
      updated_at: nowISO()
    };

    const { data: existing, error: existingError } = await client
      .from(TABLES.JOBS)
      .select("*")
      .eq("snapshot_id", ctx.snapshot_id)
      .eq("job_type", JOB_TYPE)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      const fromStatus = existing.job_status;

      const { data, error } = await client
        .from(TABLES.JOBS)
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;

      await writeJobEvent({
        media_job_id: data.media_job_id,
        from_status: fromStatus,
        to_status: data.job_status,
        event_type: "JOB_UPDATED",
        payload: { asset_count: registeredAssets.length }
      });

      await writeReceipt({
        media_job_id: data.media_job_id,
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        receipt_type: "PHNX_MEDIA_JOB_UPDATED",
        status: data.job_status,
        receipt_payload: { asset_count: registeredAssets.length }
      });

      return data;
    }

    const { data, error } = await client
      .from(TABLES.JOBS)
      .insert({ ...payload, created_at: nowISO() })
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: data.media_job_id,
      from_status: null,
      to_status: data.job_status,
      event_type: "JOB_CREATED",
      payload: { asset_count: registeredAssets.length }
    });

    await writeReceipt({
      media_job_id: data.media_job_id,
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,
      receipt_type: "PHNX_MEDIA_JOB_CREATED",
      status: data.job_status,
      receipt_payload: { asset_count: registeredAssets.length }
    });

    return data;
  }

  function updateMediaUI(job = null, assets = []) {
    if (!job && !assets.length) {
      setText("statusPhnxMedia", "Not Queued");
      setText("mediaQueueBadge", "Media Queue Pending");
      return;
    }

    setText("statusPhnxMedia", "Queued");
    setText("mediaQueueBadge", "PHNX Media Queued");

    if (assets.some(a => a.asset_type === "headshot")) {
      setText("mediaStatusHeadshot", "Captured");
      setText("mediaStatusCard", "Ready");
    }

    if (assets.some(a => ["highlight_url", "highlight_file", "game_film_url", "game_film_file"].includes(a.asset_type))) {
      setText("mediaStatusFilm", "Captured");
    }

    setText("mediaStatusRouting", job?.job_status || "ASSETS CAPTURED");
  }

  async function queueSnapshotMediaPackage(saved = {}) {
    if (!saved?.snapshot_id) {
      return { ok: false, status: "MISSING_SNAPSHOT_ID" };
    }

    if (!hasAnyMediaInput()) {
      updateMediaUI(null, []);
      return { ok: true, status: "NO_MEDIA_TO_QUEUE", assets: [], job: null };
    }

    try {
      setText("statusPhnxMedia", "Queueing");
      setText("mediaQueueBadge", "Queueing PHNX Media");

      const assets = await registerAssets(saved);
      const job = await createOrUpdateMediaJob(saved, assets);

      updateMediaUI(job, assets);

      return { ok: true, status: "PHNX_MEDIA_QUEUED", assets, job };
    } catch (err) {
      console.error("[PHNX Media] Queue failed:", err);

      setText("statusPhnxMedia", "Queue Failed");
      setText("mediaQueueBadge", "Media Queue Failed");

      await writeReceipt({
        snapshot_id: saved.snapshot_id || null,
        athlete_id: saved.athlete_id || null,
        receipt_type: "PHNX_MEDIA_QUEUE_FAILED",
        status: "FAILED",
        receipt_payload: { error: err.message || String(err) }
      });

      return { ok: false, status: "PHNX_MEDIA_QUEUE_FAILED", error: err.message || String(err) };
    }
  }

  async function getMediaJob(mediaJobId) {
    const client = db();
    const { data, error } = await client
      .from(TABLES.JOBS)
      .select("*")
      .eq("media_job_id", mediaJobId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function transitionJob(mediaJobId, toStatus, payload = {}) {
    const client = db();
    const existing = await getMediaJob(mediaJobId);
    if (!existing) throw new Error("Media job not found.");

    const updatePayload = {
      job_status: toStatus,
      updated_at: nowISO(),
      ...payload
    };

    if (toStatus === STATUS.COMPLETED) updatePayload.completed_at = nowISO();

    const { data, error } = await client
      .from(TABLES.JOBS)
      .update(updatePayload)
      .eq("media_job_id", mediaJobId)
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: mediaJobId,
      from_status: existing.job_status,
      to_status: toStatus,
      event_type: "JOB_STATUS_CHANGED",
      payload
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: data.snapshot_id,
      athlete_id: data.athlete_id,
      receipt_type: "PHNX_MEDIA_JOB_STATUS_CHANGED",
      status: toStatus,
      receipt_payload: payload
    });

    return data;
  }

  async function approveForRender(mediaJobId, reviewNotes = "Approved for PHNX Sports render.") {
    return transitionJob(mediaJobId, STATUS.APPROVED_FOR_RENDER, {
      review_status: "approved",
      render_required: true,
      error_message: null,
      render_payload: {
        ...(await getMediaJob(mediaJobId))?.render_payload,
        review_notes: reviewNotes,
        approved_at: nowISO()
      }
    });
  }

  async function queueForRender(mediaJobId) {
    return transitionJob(mediaJobId, STATUS.QUEUED_FOR_RENDER, {
      locked: false,
      locked_at: null,
      locked_by: null
    });
  }

  async function markRendering(mediaJobId, workerId = "phoenix-video-render") {
    return transitionJob(mediaJobId, STATUS.RENDERING, {
      locked: true,
      locked_at: nowISO(),
      locked_by: workerId
    });
  }

  async function recordRenderOutput(options = {}) {
    const client = db();
    const mediaJobId = options.media_job_id;
    if (!mediaJobId) throw new Error("media_job_id is required.");

    const job = await getMediaJob(mediaJobId);
    if (!job) throw new Error("Media job not found.");

    const renderRow = {
      media_job_id: mediaJobId,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,
      render_status: "rendered",
      output_type: options.output_type || "youtube_video",
      output_bucket: options.output_bucket || null,
      output_path: options.output_path || null,
      output_url: options.output_url || null,
      thumbnail_bucket: options.thumbnail_bucket || null,
      thumbnail_path: options.thumbnail_path || null,
      thumbnail_url: options.thumbnail_url || null,
      duration_seconds: options.duration_seconds || null,
      width: options.width || 1080,
      height: options.height || 1920,
      render_engine: options.render_engine || "phoenix-video-render",
      render_payload: options.render_payload || job.render_payload || {},
      updated_at: nowISO()
    };

    const { data: render, error } = await client
      .from(TABLES.RENDERS)
      .insert(renderRow)
      .select("*")
      .single();

    if (error) throw error;

    await transitionJob(mediaJobId, STATUS.RENDERED, {
      rendered_video_url: render.output_url,
      rendered_thumbnail_url: render.thumbnail_url,
      locked: false,
      locked_at: null,
      locked_by: null
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      render_id: render.render_id,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,
      receipt_type: "PHNX_RENDER_COMPLETED",
      status: "RENDERED",
      receipt_payload: {
        output_url: render.output_url,
        thumbnail_url: render.thumbnail_url
      }
    });

    return render;
  }

  async function createOrQueueYouTubePost(mediaJobId) {
    const client = db();
    const job = await getMediaJob(mediaJobId);
    if (!job) throw new Error("Media job not found.");

    const { data: latestRender } = await client
      .from(TABLES.RENDERS)
      .select("*")
      .eq("media_job_id", mediaJobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const title = `${job.athlete_display_name || "PHNX Athlete"} | PHNX Sports Highlight Feature`;
    const description = `PHNX Sports athlete media package generated from governed STATS-CORE™ intake.`;

    const postPayload = {
      media_job_id: mediaJobId,
      render_id: latestRender?.render_id || null,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,
      channel_key: CHANNEL_KEY,
      title,
      description,
      tags: [
        "PHNX Sports",
        "STATS-CORE",
        job.sport,
        job.primary_position,
        job.school_program,
        job.graduation_class
      ].filter(Boolean),
      publish_status: "queued",
      updated_at: nowISO()
    };

    const { data: existing } = await client
      .from(TABLES.YOUTUBE)
      .select("*")
      .eq("media_job_id", mediaJobId)
      .maybeSingle();

    let post;

    if (existing) {
      const { data, error } = await client
        .from(TABLES.YOUTUBE)
        .update(postPayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;
      post = data;
    } else {
      const { data, error } = await client
        .from(TABLES.YOUTUBE)
        .insert(postPayload)
        .select("*")
        .single();

      if (error) throw error;
      post = data;
    }

    await transitionJob(mediaJobId, STATUS.QUEUED_TO_YOUTUBE, {
      youtube_post_id: post.youtube_post_id
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      youtube_post_id: post.youtube_post_id,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,
      receipt_type: "PHNX_YOUTUBE_POST_QUEUED",
      status: "QUEUED_TO_YOUTUBE",
      receipt_payload: {
        youtube_post_id: post.youtube_post_id,
        title
      }
    });

    return post;
  }

  async function markYouTubePosted(options = {}) {
    const client = db();
    const mediaJobId = options.media_job_id;
    if (!mediaJobId) throw new Error("media_job_id is required.");

    const job = await getMediaJob(mediaJobId);
    if (!job) throw new Error("Media job not found.");

    const { data: post, error } = await client
      .from(TABLES.YOUTUBE)
      .update({
        youtube_video_id: options.youtube_video_id || null,
        youtube_url: options.youtube_url || null,
        publish_status: "posted",
        spider_job_id: options.spider_job_id || null,
        spider_receipt: options.spider_receipt || {},
        published_at: nowISO(),
        updated_at: nowISO()
      })
      .eq("media_job_id", mediaJobId)
      .select("*")
      .single();

    if (error) throw error;

    await transitionJob(mediaJobId, STATUS.POSTED, {
      youtube_post_id: post.youtube_post_id,
      youtube_url: post.youtube_url
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      youtube_post_id: post.youtube_post_id,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,
      receipt_type: "PHNX_YOUTUBE_POSTED",
      status: "POSTED",
      receipt_payload: {
        youtube_video_id: post.youtube_video_id,
        youtube_url: post.youtube_url
      }
    });

    if (job.multibox_notice_required) {
      await sendPublishedMultiBoxNotice(mediaJobId);
    }

    return post;
  }

  async function sendPublishedMultiBoxNotice(mediaJobId) {
    const client = db();
    const job = await getMediaJob(mediaJobId);
    if (!job) throw new Error("Media job not found.");

    const { data: post } = await client
      .from(TABLES.YOUTUBE)
      .select("*")
      .eq("media_job_id", mediaJobId)
      .maybeSingle();

    const subject = "Your PHNX Sports media package has been published";
    const body = [
      `Your PHNX Sports media package is complete.`,
      post?.youtube_url ? `Published link: ${post.youtube_url}` : `Publishing record has been completed.`,
      ``,
      `Athlete: ${job.athlete_display_name || "Athlete"}`,
      `Media Job: ${mediaJobId}`
    ].join("\n");

    const messagePayload = {
      sender_user_id: null,
      sender_role: "system",
      sender_role_id: null,
      sender_label: "PHNX Sports Media",
      sender_channel_locked: true,

      target_role: "athlete",
      target_directory: "athlete_media_notifications",
      target_recipient_id: job.athlete_id || job.snapshot_id,
      target_recipient_type: "athlete",
      target_recipient_label: job.athlete_display_name || "Athlete",

      athlete_id: job.athlete_id || null,
      snapshot_id: job.snapshot_id || null,

      message_type: "phnx_media_publish_notice",
      priority: "standard",
      communication_window: "open",

      subject,
      body,

      status: "sent",
      is_broadcast: false,
      archived: false,
      soft_deleted: false
    };

    const { data: message, error: msgError } = await client
      .from(TABLES.MBX_MESSAGES)
      .insert(messagePayload)
      .select("*")
      .single();

    if (msgError) throw msgError;

    const receiptPayload = {
      message_id: message.id || null,
      receipt_type: "STATSCORE_MULTIBOX_RECEIPT",
      action: "phnx_media_publish_notice_sent",

      sender_user_id: null,
      sender_role: "system",
      sender_role_id: null,
      sender_label: "PHNX Sports Media",

      target_role: "athlete",
      target_directory: "athlete_media_notifications",
      target_recipient_id: job.athlete_id || job.snapshot_id,
      target_recipient_type: "athlete",
      target_recipient_label: job.athlete_display_name || "Athlete",

      athlete_id: job.athlete_id || null,
      snapshot_id: job.snapshot_id || null,

      receipt_payload: {
        engine_version: ENGINE_VERSION,
        media_job_id: mediaJobId,
        youtube_url: post?.youtube_url || null,
        status: "sent",
        created_at: nowISO()
      }
    };

    const { data: receipt, error: receiptError } = await client
      .from(TABLES.MBX_RECEIPTS)
      .insert(receiptPayload)
      .select("*")
      .single();

    if (receiptError) throw receiptError;

    await client.from(TABLES.MBX_AUDIT).insert({
      message_id: message.id || null,
      receipt_id: receipt.id || null,
      event_type: "phnx_media_publish_notice_sent",
      actor_user_id: null,
      actor_role: "system",
      actor_role_id: null,
      event_payload: {
        engine_version: ENGINE_VERSION,
        media_job_id: mediaJobId,
        youtube_url: post?.youtube_url || null,
        created_at: nowISO()
      }
    });

    await transitionJob(mediaJobId, STATUS.MULTIBOX_NOTIFIED, {
      multibox_message_id: message.id || null,
      multibox_receipt_id: receipt.id || null
    });

    await transitionJob(mediaJobId, STATUS.COMPLETED, {
      completed_at: nowISO()
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      youtube_post_id: post?.youtube_post_id || null,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,
      receipt_type: "PHNX_MULTIBOX_NOTICE_SENT",
      status: "MULTIBOX_NOTIFIED",
      receipt_payload: {
        message_id: message.id || null,
        receipt_id: receipt.id || null
      }
    });

    return { message, receipt };
  }

  async function claimNextJob(workerId = "phnx-media-worker") {
    const client = db();
    if (!client) throw new Error("PHNX Media Engine: Supabase client unavailable.");

    const { data: jobs, error } = await client
      .from(TABLES.JOBS)
      .select("*")
      .eq("locked", false)
      .in("job_status", [
        STATUS.ASSETS_CAPTURED,
        STATUS.QUEUED_FOR_REVIEW,
        STATUS.APPROVED_FOR_RENDER,
        STATUS.QUEUED_FOR_RENDER
      ])
      .lt("attempt_count", 3)
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) throw error;
    if (!jobs || !jobs.length) return null;

    const job = jobs[0];

    const { data, error: lockError } = await client
      .from(TABLES.JOBS)
      .update({
        locked: true,
        locked_at: nowISO(),
        locked_by: workerId,
        attempt_count: Number(job.attempt_count || 0) + 1,
        updated_at: nowISO()
      })
      .eq("id", job.id)
      .eq("locked", false)
      .select("*")
      .single();

    if (lockError) throw lockError;

    await writeJobEvent({
      media_job_id: data.media_job_id,
      from_status: job.job_status,
      to_status: data.job_status,
      event_type: "JOB_CLAIMED",
      payload: {
        worker_id: workerId,
        attempt_count: data.attempt_count
      }
    });

    return data;
  }

  async function releaseJob(mediaJobId, status = STATUS.FAILED, errorMessage = null) {
    const client = db();
    const existing = await getMediaJob(mediaJobId);
    if (!existing) throw new Error("Media job not found.");

    const { data, error } = await client
      .from(TABLES.JOBS)
      .update({
        locked: false,
        locked_at: null,
        locked_by: null,
        job_status: status,
        error_message: errorMessage,
        last_error_at: errorMessage ? nowISO() : existing.last_error_at,
        updated_at: nowISO()
      })
      .eq("media_job_id", mediaJobId)
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: mediaJobId,
      from_status: existing.job_status,
      to_status: status,
      event_type: errorMessage ? "JOB_RELEASED_WITH_ERROR" : "JOB_RELEASED",
      payload: { error_message: errorMessage }
    });

    return data;
  }

  window.STATScorePHNXMediaEngine = {
    version: ENGINE_VERSION,
    STATUS,
    TABLES,
    JOB_TYPE,
    CHANNEL_KEY,

    queueSnapshotMediaPackage,
    registerAssets,
    createOrUpdateMediaJob,
    selectMusicTrack,

    approveForRender,
    queueForRender,
    markRendering,
    recordRenderOutput,

    createOrQueueYouTubePost,
    markYouTubePosted,
    sendPublishedMultiBoxNotice,

    transitionJob,
    writeJobEvent,
    writeReceipt,

    claimNextJob,
    releaseJob,
    getMediaJob,

    _debug: {
      buildAssetList,
      buildAthleteContext,
      buildSourceMeta,
      hasAnyMediaInput
    }
  };

  console.info("[PHNX Media] Engine Loaded:", ENGINE_VERSION);
})(); 
