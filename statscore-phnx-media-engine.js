/*
==========================================================
STATS-CORE™ / PHNX SPORTS MEDIA ENGINE
File: statscore-phnx-media-engine.js
Version: PHNX-MEDIA-ENGINE-V1
Owner: Stream 7 — Crystal / Exposure / Media
Consumes: Stream 2 Snapshot Intake
Purpose:
Creates governed PHNX Sports media assets, jobs, events,
music selection, and receipts from Snapshot Intake media.
==========================================================
*/

(function () {
  "use strict";

  const ENGINE_VERSION = "PHNX-MEDIA-ENGINE-V1";

  const TABLES = {
    ASSETS: "phnx_media_assets",
    JOBS: "phnx_media_jobs",
    EVENTS: "phnx_media_job_events",
    MUSIC: "phnx_music_library",
    RECEIPTS: "phnx_media_receipts"
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

  function uuid(prefix = "phnx") {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
        source_kind: headshotUrl ? "uploaded_file" : "submitted_file",
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
          created_at: nowISO()
        }
      });
    }

    const highlightUrl = valByName("highlightUrl") || saved.highlight_url || "";
    if (highlightUrl) {
      assets.push({
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        asset_type: "highlight_url",
        asset_label: "Athlete Highlight Reel",
        source_kind: "submitted_url",
        source_url: highlightUrl,
        trust_classification: source.trust_classification,
        source_origin: source.source_origin,
        submitted_by_role: source.submitted_by_role,
        submitted_by_name: source.submitted_by_name,
        submitted_by_email: source.submitted_by_email,
        review_status: "pending",
        metadata: {
          engine_version: ENGINE_VERSION,
          captured_from: "snapshot-intake.html",
          asset_role: "highlight_film",
          created_at: nowISO()
        }
      });
    }

    const gameFilmUrl = valByName("gameFilmUrl") || saved.game_film_url || "";
    if (gameFilmUrl) {
      assets.push({
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        asset_type: "game_film_url",
        asset_label: "Athlete Game Film",
        source_kind: "submitted_url",
        source_url: gameFilmUrl,
        trust_classification: source.trust_classification,
        source_origin: source.source_origin,
        submitted_by_role: source.submitted_by_role,
        submitted_by_name: source.submitted_by_name,
        submitted_by_email: source.submitted_by_email,
        review_status: "pending",
        metadata: {
          engine_version: ENGINE_VERSION,
          captured_from: "snapshot-intake.html",
          asset_role: "game_film",
          created_at: nowISO()
        }
      });
    }

    const socialProfileUrl = valByName("socialProfileUrl") || saved.social_profile_url || "";
    if (socialProfileUrl) {
      assets.push({
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        asset_type: "social_profile_url",
        asset_label: "Athlete Social Profile",
        source_kind: "submitted_url",
        source_url: socialProfileUrl,
        trust_classification: source.trust_classification,
        source_origin: source.source_origin,
        submitted_by_role: source.submitted_by_role,
        submitted_by_name: source.submitted_by_name,
        submitted_by_email: source.submitted_by_email,
        review_status: "pending",
        metadata: {
          engine_version: ENGINE_VERSION,
          captured_from: "snapshot-intake.html",
          asset_role: "social_reference",
          created_at: nowISO()
        }
      });
    }

    const recruitingProfileUrl = valByName("recruitingProfileUrl") || saved.recruiting_profile_url || "";
    if (recruitingProfileUrl) {
      assets.push({
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        asset_type: "recruiting_profile_url",
        asset_label: "Athlete Recruiting Profile",
        source_kind: "submitted_url",
        source_url: recruitingProfileUrl,
        trust_classification: source.trust_classification,
        source_origin: source.source_origin,
        submitted_by_role: source.submitted_by_role,
        submitted_by_name: source.submitted_by_name,
        submitted_by_email: source.submitted_by_email,
        review_status: "pending",
        metadata: {
          engine_version: ENGINE_VERSION,
          captured_from: "snapshot-intake.html",
          asset_role: "recruiting_reference",
          created_at: nowISO()
        }
      });
    }

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
      const eventRow = {
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
        .insert(eventRow)
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
      let query = client
        .from(TABLES.MUSIC)
        .select("*")
        .eq("active", true)
        .order("track_id", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const tracks = Array.isArray(data) ? data : [];

      if (!tracks.length) return null;

      const sportMatch = tracks.find(t => clean(t.sport).toLowerCase() === sport && clean(t.intensity).toLowerCase() === "high");
      if (sportMatch) return sportMatch;

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
      const existingQuery = client
        .from(TABLES.ASSETS)
        .select("*")
        .eq("snapshot_id", asset.snapshot_id)
        .eq("asset_type", asset.asset_type)
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      const { data: existing, error: existingError } = await existingQuery;

      if (existingError) throw existingError;

      if (existing) {
        const updatePayload = {
          ...asset,
          updated_at: nowISO(),
          metadata: {
            ...(existing.metadata || {}),
            ...(asset.metadata || {}),
            updated_by_engine: ENGINE_VERSION,
            updated_at: nowISO()
          }
        };

        const { data, error } = await client
          .from(TABLES.ASSETS)
          .update(updatePayload)
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
      music: musicTrack
        ? {
            track_id: musicTrack.track_id,
            track_title: musicTrack.track_title,
            mood: musicTrack.mood,
            sport: musicTrack.sport,
            intensity: musicTrack.intensity,
            source: "phnx_music_library"
          }
        : null,
      created_at: nowISO()
    };

    const publishPayload = {
      engine_version: ENGINE_VERSION,
      channel_key: CHANNEL_KEY,
      platform: "youtube",
      title_template: "{{athlete_display_name}} | PHNX Sports Highlight Feature",
      description_template:
        "PHNX Sports athlete media package generated from governed STATS-CORE™ intake.",
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

    const jobPayload = {
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
        ? `Selected by PHNX Media Engine based on sport=${ctx.sport || "unknown"} and available active tracks.`
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
        .update(jobPayload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;

      await writeJobEvent({
        media_job_id: data.media_job_id,
        from_status: fromStatus,
        to_status: data.job_status,
        event_type: "JOB_UPDATED",
        payload: {
          snapshot_id: ctx.snapshot_id,
          asset_count: registeredAssets.length,
          music_track_id: data.music_track_id
        }
      });

      await writeReceipt({
        media_job_id: data.media_job_id,
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,
        receipt_type: "PHNX_MEDIA_JOB_UPDATED",
        status: data.job_status,
        receipt_payload: {
          job_type: JOB_TYPE,
          channel_key: CHANNEL_KEY,
          asset_count: registeredAssets.length
        }
      });

      return data;
    }

    const createPayload = {
      ...jobPayload,
      created_at: nowISO()
    };

    const { data, error } = await client
      .from(TABLES.JOBS)
      .insert(createPayload)
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: data.media_job_id,
      from_status: null,
      to_status: data.job_status,
      event_type: "JOB_CREATED",
      payload: {
        snapshot_id: ctx.snapshot_id,
        asset_count: registeredAssets.length,
        music_track_id: data.music_track_id
      }
    });

    await writeReceipt({
      media_job_id: data.media_job_id,
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,
      receipt_type: "PHNX_MEDIA_JOB_CREATED",
      status: data.job_status,
      receipt_payload: {
        job_type: JOB_TYPE,
        channel_key: CHANNEL_KEY,
        asset_count: registeredAssets.length
      }
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

    if (
      assets.some(a =>
        ["highlight_url", "highlight_file", "game_film_url", "game_film_file"].includes(a.asset_type)
      )
    ) {
      setText("mediaStatusFilm", "Captured");
    }

    setText("mediaStatusRouting", job?.job_status || "ASSETS CAPTURED");
  }

  async function queueSnapshotMediaPackage(saved = {}) {
    if (!saved?.snapshot_id) {
      console.warn("[PHNX Media] Queue skipped: missing snapshot_id.");
      return {
        ok: false,
        status: "MISSING_SNAPSHOT_ID"
      };
    }

    if (!hasAnyMediaInput()) {
      updateMediaUI(null, []);
      return {
        ok: true,
        status: "NO_MEDIA_TO_QUEUE",
        assets: [],
        job: null
      };
    }

    try {
      setText("statusPhnxMedia", "Queueing");
      setText("mediaQueueBadge", "Queueing PHNX Media");

      const assets = await registerAssets(saved);
      const job = await createOrUpdateMediaJob(saved, assets);

      updateMediaUI(job, assets);

      return {
        ok: true,
        status: "PHNX_MEDIA_QUEUED",
        assets,
        job
      };
    } catch (err) {
      console.error("[PHNX Media] Queue failed:", err);

      setText("statusPhnxMedia", "Queue Failed");
      setText("mediaQueueBadge", "Media Queue Failed");

      await writeReceipt({
        snapshot_id: saved.snapshot_id || null,
        athlete_id: saved.athlete_id || null,
        receipt_type: "PHNX_MEDIA_QUEUE_FAILED",
        status: "FAILED",
        receipt_payload: {
          error: err.message || String(err),
          engine_version: ENGINE_VERSION
        }
      });

      return {
        ok: false,
        status: "PHNX_MEDIA_QUEUE_FAILED",
        error: err.message || String(err)
      };
    }
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
    if (!client) throw new Error("PHNX Media Engine: Supabase client unavailable.");
    if (!mediaJobId) throw new Error("mediaJobId is required.");

    const { data: existing, error: findError } = await client
      .from(TABLES.JOBS)
      .select("*")
      .eq("media_job_id", mediaJobId)
      .maybeSingle();

    if (findError) throw findError;
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
      payload: {
        error_message: errorMessage
      }
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
    writeJobEvent,
    writeReceipt,
    claimNextJob,
    releaseJob,

    _debug: {
      buildAssetList,
      buildAthleteContext,
      buildSourceMeta,
      hasAnyMediaInput
    }
  };

  console.info("[PHNX Media] Engine Loaded:", ENGINE_VERSION);
})(); 
