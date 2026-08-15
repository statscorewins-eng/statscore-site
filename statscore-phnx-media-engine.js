/*
==========================================================
STATS-CORE™ / PHNX SPORTS MEDIA ENGINE
File: statscore-phnx-media-engine.js
Version: PHNX-MEDIA-ENGINE-V3-GOVERNED-V1
Owner: Stream 7 — PHNX Sports Media / Publication Authority

Constitutional Role:
Governed downstream PHNX Sports media manufacturing,
publication, distribution, publication receipts, and
exposure-receipt handoff.

STREAM 7 OWNS:
- Media candidate consumption
- Governed PHNX production jobs
- Editorial workflow state
- Fact review state
- Rights-review enforcement for publication
- Player Card / Highlight / feature manufacturing state
- PHNX publication authority
- Publication state
- Distribution orchestration
- Publication receipts
- Correction/version history
- Exposure receipts
- Lifecycle return

STREAM 7 DOES NOT OWN:
- Athlete source-media intake
- Athlete source-record manufacture
- Source provenance authority
- Athlete identity authority
- Athletic / Academic / Development scoring
- Rankings authority
- Recruiting Matching
- Professional Certification
- Communication execution
- Multi-Box message/receipt authority

CONTROLLING RULES:
Candidate ≠ Approved
Possession ≠ Publication Authority
Exposure ≠ Athletic Ability
Engagement ≠ Recruiting Outcome
No Rights Authority → Do Not Publish
No Consent → Do Not Publish where consent is required
No Governed Intelligence → Do Not Invent Intelligence
==========================================================
*/

(function () {
  "use strict";

  const ENGINE_VERSION = "PHNX-MEDIA-ENGINE-V3-GOVERNED-V1";

  const TABLES = {
    ASSETS: "phnx_media_assets",
    JOBS: "phnx_media_jobs",
    EVENTS: "phnx_media_job_events",
    MUSIC: "phnx_music_library",
    RENDERS: "phnx_render_outputs",
    YOUTUBE: "phnx_youtube_posts",
    RECEIPTS: "phnx_media_receipts"
  };

  const JOB_TYPE = "phnx_sports_publication_package";
  const CHANNEL_KEY = "phnx_sports_youtube";

  /*
  ==========================================================
  CANONICAL PUBLICATION STATES
  ==========================================================
  These are publication-governance states.

  Render/worker mechanics belong inside production records
  and must not become the constitutional publication state.
  ==========================================================
  */
  const STATUS = Object.freeze({
    DRAFT: "DRAFT",
    IN_PRODUCTION: "IN_PRODUCTION",
    EDITORIAL_REVIEW: "EDITORIAL_REVIEW",
    FACT_REVIEW: "FACT_REVIEW",
    RIGHTS_REVIEW: "RIGHTS_REVIEW",
    CORRECTION_REQUIRED: "CORRECTION_REQUIRED",
    APPROVED: "APPROVED",
    SCHEDULED: "SCHEDULED",
    PUBLISHED: "PUBLISHED",
    UPDATED: "UPDATED",
    WITHDRAWN: "WITHDRAWN",
    ARCHIVED: "ARCHIVED",
    REJECTED: "REJECTED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED"
  });

  const DISCLOSURE = Object.freeze({
    PRIVATE: "PRIVATE",
    DEVELOPMENT: "DEVELOPMENT",
    RECRUITING: "RECRUITING",
    PUBLIC_MEDIA: "PUBLIC_MEDIA"
  });

  const REVIEW = Object.freeze({
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CORRECTION_REQUIRED: "CORRECTION_REQUIRED"
  });

  const RECEIPT_TYPES = Object.freeze({
    HANDOFF_ACCEPTED: "PHNX_MEDIA_HANDOFF_ACCEPTED",
    ASSET_REGISTERED: "PHNX_MEDIA_ASSET_REGISTERED",
    JOB_CREATED: "PHNX_MEDIA_JOB_CREATED",
    JOB_UPDATED: "PHNX_MEDIA_JOB_UPDATED",
    JOB_STATUS_CHANGED: "PHNX_MEDIA_JOB_STATUS_CHANGED",
    RENDER_COMPLETED: "PHNX_RENDER_COMPLETED",

    EDITORIAL_REVIEW: "PHNX_EDITORIAL_REVIEW",
    FACT_REVIEW: "PHNX_FACT_REVIEW",
    RIGHTS_REVIEW: "PHNX_RIGHTS_REVIEW",

    PUBLICATION_SCHEDULED: "PHNX_PUBLICATION_SCHEDULED",
    PUBLICATION_PUBLISHED: "PHNX_PUBLICATION_PUBLISHED",
    PUBLICATION_UPDATED: "PHNX_PUBLICATION_UPDATED",
    PUBLICATION_WITHDRAWN: "PHNX_PUBLICATION_WITHDRAWN",
    PUBLICATION_ARCHIVED: "PHNX_PUBLICATION_ARCHIVED",

    DISTRIBUTION_QUEUED: "PHNX_DISTRIBUTION_QUEUED",
    DISTRIBUTION_COMPLETED: "PHNX_DISTRIBUTION_COMPLETED",

    EXPOSURE_EVENT: "PHNX_EXPOSURE_EVENT",
    COMMUNICATION_HANDOFF: "PHNX_COMMUNICATION_HANDOFF",

    FAILURE: "PHNX_MEDIA_FAILURE"
  });

  const EXPOSURE_EVENT_TYPES = Object.freeze([
    "PUBLICATION",
    "VIEW",
    "SHARE",
    "PROFILE_OPEN",
    "PLAYER_CARD_INTERACTION",
    "HIGHLIGHT_REEL_INTERACTION",
    "PROGRAM_INTERACTION",
    "RECRUITER_INTERACTION",
    "VERIFIED_RECRUITER_SAVE",
    "OUTREACH",
    "FOLLOW_UP",
    "CAMP_INVITATION",
    "OTHER_ATTRIBUTABLE_EXPOSURE_EVENT"
  ]);

  /*
  ==========================================================
  CORE HELPERS
  ==========================================================
  */

  function db() {
    return (
      window.STATScoreData?.getClient?.() ||
      window.STATScoreCore?.getClient?.() ||
      window.supabaseClient ||
      window.STATScoreSupabase ||
      null
    );
  }

  function requireDb() {
    const client = db();
    if (!client) {
      throw new Error(
        "PHNX Media Engine: governed data client unavailable."
      );
    }
    return client;
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
  }

  function normalizeUpper(value) {
    return clean(value).toUpperCase();
  }

  function normalizeLower(value) {
    return clean(value).toLowerCase();
  }

  function safeJson(value, fallback = {}) {
    if (!value) return fallback;

    if (
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function isObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function normalizeSport(value) {
    return normalizeLower(value);
  }

  function generateLocalRef(prefix) {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return `${prefix}:${window.crypto.randomUUID()}`;
    }

    return `${prefix}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  /*
  ==========================================================
  GOVERNED HANDOFF CONTRACT
  ==========================================================

  PRIMARY INBOUND CONTRACT

  Stream 7 SHALL consume a governed PHNX media handoff.

  Stream 7 SHALL NOT manufacture source provenance from DOM
  fields or assume SELF_REPORTED simply because values exist.

  Expected handoff shape is intentionally transport-neutral:

  {
    handoff_id,
    athlete_id,
    snapshot_id,

    candidate: {
      candidate_id,
      candidate_type,
      why,
      source_authority,
      intelligence_reference,
      evidence_references,
      nominated_at
    },

    athlete_context: {...},

    assets: [
      {
        media_asset_id,
        asset_type,
        asset_label,
        source_kind,
        source_url,
        public_url,
        storage_path,
        original_filename,
        provenance,
        verification_state,
        rights_state,
        consent_state,
        disclosure_scope,
        lineage
      }
    ],

    governance: {
      disclosure_scope,
      rights_state,
      consent_state,
      guardian_authorization_state,
      minor_status,
      public_disclosure_authorized
    },

    intelligence_refs: {...},
    professional_attribution: {...},
    receipts: {...}
  }

  ==========================================================
  */

  function resolveGovernedHandoff(input = {}) {
    /*
      Compatibility:
      Stream 2 may persist its handoff under one of these
      existing JSON structures.

      IMPORTANT:
      This compatibility path does NOT read source-media
      fields from the page and does NOT manufacture provenance.
    */
    const handoff =
      input.phnx_media_handoff_payload ||
      input.media_handoff_payload ||
      input.phnx_media_handoff ||
      input;

    if (!isObject(handoff)) {
      throw new Error(
        "PHNX Media Engine: governed PHNX media handoff missing."
      );
    }

    return clone(handoff);
  }

  function validateGovernedHandoff(handoff = {}) {
    const errors = [];

    if (!clean(handoff.snapshot_id)) {
      errors.push("snapshot_id is required.");
    }

    if (!clean(handoff.athlete_id)) {
      errors.push("athlete_id is required.");
    }

    if (!isObject(handoff.candidate)) {
      errors.push(
        "Governed media candidate is required. " +
        "Media presence alone does not create a candidate."
      );
    } else {
      if (!clean(handoff.candidate.candidate_id)) {
        errors.push("candidate.candidate_id is required.");
      }

      if (!clean(handoff.candidate.why)) {
        errors.push(
          "candidate.why is required for universal WHY traceability."
        );
      }

      if (!clean(handoff.candidate.source_authority)) {
        errors.push(
          "candidate.source_authority is required."
        );
      }
    }

    if (
      !Array.isArray(handoff.assets) ||
      handoff.assets.length === 0
    ) {
      errors.push(
        "At least one governed media asset is required."
      );
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }

  function buildAthleteContext(handoff = {}) {
    const ctx = handoff.athlete_context || {};

    return {
      snapshot_id:
        clean(handoff.snapshot_id || ctx.snapshot_id) || null,

      athlete_id:
        clean(handoff.athlete_id || ctx.athlete_id) || null,

      athlete_display_name:
        clean(
          ctx.athlete_display_name ||
          handoff.athlete_display_name
        ) || null,

      sport: normalizeSport(
        ctx.sport ||
        handoff.sport
      ),

      primary_position:
        clean(
          ctx.primary_position ||
          handoff.primary_position
        ) || null,

      school_program:
        clean(
          ctx.school_program ||
          handoff.school_program
        ) || null,

      graduation_class:
        clean(
          ctx.graduation_class ||
          handoff.graduation_class
        ) || null
    };
  }

  function buildCandidateContext(handoff = {}) {
    const candidate = handoff.candidate || {};

    return {
      candidate_id:
        clean(candidate.candidate_id) || null,

      candidate_type:
        normalizeUpper(
          candidate.candidate_type || "ATHLETE_MEDIA"
        ),

      why:
        clean(candidate.why) || null,

      source_authority:
        clean(candidate.source_authority) || null,

      intelligence_reference:
        candidate.intelligence_reference || null,

      evidence_references:
        Array.isArray(candidate.evidence_references)
          ? candidate.evidence_references
          : [],

      nominated_at:
        candidate.nominated_at || null,

      nomination_receipt_id:
        candidate.nomination_receipt_id || null
    };
  }

  function buildGovernanceContext(handoff = {}) {
    const governance = handoff.governance || {};

    return {
      disclosure_scope:
        normalizeUpper(
          governance.disclosure_scope ||
          DISCLOSURE.PRIVATE
        ),

      rights_state:
        normalizeUpper(
          governance.rights_state || "UNKNOWN"
        ),

      consent_state:
        normalizeUpper(
          governance.consent_state || "UNKNOWN"
        ),

      guardian_authorization_state:
        normalizeUpper(
          governance.guardian_authorization_state ||
          "UNKNOWN"
        ),

      minor_status:
        normalizeUpper(
          governance.minor_status || "UNKNOWN"
        ),

      public_disclosure_authorized:
        governance.public_disclosure_authorized === true,

      rights_authority:
        governance.rights_authority || null,

      consent_authority:
        governance.consent_authority || null,

      governance_receipt_id:
        governance.governance_receipt_id || null
    };
  }

  /*
  ==========================================================
  RIGHTS / CONSENT FAIL-CLOSED CONTRACT
  ==========================================================
  */

  function evaluatePublicationAuthority(
    governance = {},
    requestedScope = DISCLOSURE.PUBLIC_MEDIA
  ) {
    const scope = normalizeUpper(requestedScope);

    const rightsApproved =
      normalizeUpper(governance.rights_state) === "APPROVED";

    const consentApproved =
      normalizeUpper(governance.consent_state) === "APPROVED";

    const isMinor =
      normalizeUpper(governance.minor_status) === "MINOR";

    const guardianApproved =
      normalizeUpper(
        governance.guardian_authorization_state
      ) === "APPROVED";

    if (scope === DISCLOSURE.PRIVATE) {
      return {
        authorized: true,
        scope,
        reason: "Private governed use."
      };
    }

    if (!rightsApproved) {
      return {
        authorized: false,
        scope,
        reason:
          "NO RIGHTS AUTHORITY — publication fails closed."
      };
    }

    if (!consentApproved) {
      return {
        authorized: false,
        scope,
        reason:
          "NO REQUIRED CONSENT — publication fails closed."
      };
    }

    if (isMinor && !guardianApproved) {
      return {
        authorized: false,
        scope,
        reason:
          "MINOR/GUARDIAN AUTHORIZATION NOT ESTABLISHED — " +
          "public publication fails closed."
      };
    }

    if (
      scope === DISCLOSURE.PUBLIC_MEDIA &&
      governance.public_disclosure_authorized !== true
    ) {
      return {
        authorized: false,
        scope,
        reason:
          "NO PUBLIC DISCLOSURE AUTHORITY — keep information private."
      };
    }

    return {
      authorized: true,
      scope,
      reason: "Required publication authority established."
    };
  }

  /*
  ==========================================================
  MEDIA ASSET CONTRACT
  ==========================================================
  */

  function normalizeHandoffAsset(
    handoff,
    sourceAsset,
    index
  ) {
    const ctx = buildAthleteContext(handoff);
    const governance = buildGovernanceContext(handoff);

    const provenance =
      sourceAsset.provenance ||
      sourceAsset.source_provenance ||
      {};

    const lineage =
      sourceAsset.lineage || {};

    return {
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,

      asset_type:
        clean(sourceAsset.asset_type) ||
        "media_asset",

      asset_label:
        clean(sourceAsset.asset_label) ||
        `PHNX Media Asset ${index + 1}`,

      source_kind:
        clean(sourceAsset.source_kind) ||
        "governed_handoff",

      source_url:
        sourceAsset.source_url || null,

      storage_path:
        sourceAsset.storage_path || null,

      public_url:
        sourceAsset.public_url || null,

      original_filename:
        sourceAsset.original_filename || null,

      /*
        Trust/provenance are consumed from the handoff.
        Stream 7 does not manufacture them.
      */
      trust_classification:
        sourceAsset.trust_classification ||
        provenance.trust_classification ||
        null,

      source_origin:
        sourceAsset.source_origin ||
        provenance.source_origin ||
        null,

      submitted_by_role:
        sourceAsset.submitted_by_role ||
        provenance.submitted_by_role ||
        null,

      submitted_by_name:
        sourceAsset.submitted_by_name ||
        provenance.submitted_by_name ||
        null,

      submitted_by_email:
        sourceAsset.submitted_by_email ||
        provenance.submitted_by_email ||
        null,

      review_status: "pending",

      metadata: {
        ...(sourceAsset.metadata || {}),

        engine_version: ENGINE_VERSION,
        consumed_from: "governed_phnx_media_handoff",
        handoff_id: handoff.handoff_id || null,

        /*
          Preserve upstream object ID where it exists.
          Do not fabricate authority.
        */
        upstream_media_asset_id:
          sourceAsset.media_asset_id ||
          sourceAsset.asset_id ||
          null,

        verification_state:
          sourceAsset.verification_state ||
          "UNKNOWN",

        rights_state:
          sourceAsset.rights_state ||
          governance.rights_state,

        consent_state:
          sourceAsset.consent_state ||
          governance.consent_state,

        disclosure_scope:
          sourceAsset.disclosure_scope ||
          governance.disclosure_scope,

        content_integrity:
          sourceAsset.content_integrity ||
          "UNKNOWN",

        provenance,

        lineage: {
          parent_media_asset_id:
            lineage.parent_media_asset_id || null,

          root_media_asset_id:
            lineage.root_media_asset_id ||
            sourceAsset.media_asset_id ||
            null,

          derivative_type:
            lineage.derivative_type || "SOURCE",

          version:
            lineage.version || 1,

          prior_version_asset_id:
            lineage.prior_version_asset_id || null
        },

        captured_at:
          sourceAsset.capture_date ||
          sourceAsset.captured_at ||
          null,

        consumed_at: nowISO()
      }
    };
  }

  function buildAssetListFromHandoff(handoff = {}) {
    const sourceAssets =
      Array.isArray(handoff.assets)
        ? handoff.assets
        : [];

    return sourceAssets.map((asset, index) =>
      normalizeHandoffAsset(
        handoff,
        asset || {},
        index
      )
    );
  }

  async function registerAssetsFromHandoff(handoff = {}) {
    const client = requireDb();

    const assets = buildAssetListFromHandoff(handoff);
    const registered = [];

    /*
      V1 HISTORY RULE:
      Do not overwrite an existing source/derivative simply
      because another asset of the same type arrives.

      Existing exact upstream asset IDs may be reused
      idempotently. Otherwise a new governed asset record is
      created so historical lineage survives.
    */
    for (const asset of assets) {
      const upstreamId =
        asset.metadata?.upstream_media_asset_id;

      let existing = null;

      if (upstreamId) {
        const { data, error } = await client
          .from(TABLES.ASSETS)
          .select("*")
          .eq(
            "snapshot_id",
            asset.snapshot_id
          )
          .eq(
            "asset_type",
            asset.asset_type
          )
          .eq(
            "active",
            true
          );

        if (error) throw error;

        existing = (data || []).find(row => {
          const meta = row.metadata || {};
          return (
            meta.upstream_media_asset_id === upstreamId
          );
        }) || null;
      }

      if (existing) {
        registered.push(existing);
        continue;
      }

      const { data, error } = await client
        .from(TABLES.ASSETS)
        .insert(asset)
        .select("*")
        .single();

      if (error) throw error;

      registered.push(data);

      await writeReceipt({
        asset_id:
          data.asset_id ||
          data.id ||
          null,

        snapshot_id: data.snapshot_id,
        athlete_id: data.athlete_id,

        receipt_type:
          RECEIPT_TYPES.ASSET_REGISTERED,

        status: "ASSET_REGISTERED",

        receipt_payload: {
          asset_type: data.asset_type,
          asset_label: data.asset_label,
          upstream_media_asset_id:
            data.metadata?.upstream_media_asset_id ||
            null,

          lineage:
            data.metadata?.lineage || null
        }
      });
    }

    return registered;
  }

  /*
  ==========================================================
  RECEIPTS / JOB EVENTS
  ==========================================================
  */

  async function writeReceipt(payload = {}) {
    const client = db();

    /*
      Receipt failure must not be silently represented as
      success. When no client exists, return an explicit
      unresolved result to the caller.
    */
    if (!client) {
      return {
        ok: false,
        unresolved: true,
        reason: "DATA_CLIENT_UNAVAILABLE"
      };
    }

    try {
      const receipt = {
        media_job_id:
          payload.media_job_id || null,

        asset_id:
          payload.asset_id || null,

        render_id:
          payload.render_id || null,

        youtube_post_id:
          payload.youtube_post_id || null,

        snapshot_id:
          payload.snapshot_id || null,

        athlete_id:
          payload.athlete_id || null,

        receipt_type:
          payload.receipt_type ||
          "PHNX_MEDIA_EVENT",

        status:
          payload.status || "RECORDED",

        receipt_payload: {
          engine_version: ENGINE_VERSION,
          authority: "STREAM_7_PHNX_PUBLICATION",
          ...(payload.receipt_payload || {}),
          created_at: nowISO()
        }
      };

      const { data, error } = await client
        .from(TABLES.RECEIPTS)
        .insert(receipt)
        .select("*")
        .single();

      if (error) throw error;

      return {
        ok: true,
        receipt: data
      };
    } catch (err) {
      console.error(
        "[PHNX Media] Receipt write failed:",
        err
      );

      return {
        ok: false,
        unresolved: true,
        reason: err.message || String(err)
      };
    }
  }

  async function writeJobEvent({
    media_job_id,
    from_status = null,
    to_status = null,
    event_type,
    payload = {}
  }) {
    const client = requireDb();

    if (!media_job_id) {
      throw new Error(
        "PHNX Media Engine: media_job_id required."
      );
    }

    const row = {
      media_job_id,
      event_type:
        event_type || "JOB_EVENT",

      from_status,
      to_status,

      actor_type:
        payload.actor_type || "system",

      actor_label:
        payload.actor_label ||
        "PHNX Sports Media Engine",

      event_payload: {
        engine_version: ENGINE_VERSION,
        authority: "STREAM_7_PHNX_PUBLICATION",
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
  }

  /*
  ==========================================================
  MUSIC / PRODUCTION SUPPORT
  ==========================================================
  */

  async function selectMusicTrack(handoff = {}) {
    const client = db();
    if (!client) return null;

    const ctx = buildAthleteContext(handoff);
    const sport = ctx.sport || null;

    try {
      const { data, error } = await client
        .from(TABLES.MUSIC)
        .select("*")
        .eq("active", true)
        .order(
          "track_id",
          { ascending: true }
        );

      if (error) throw error;

      const tracks =
        Array.isArray(data)
          ? data
          : [];

      if (!tracks.length) return null;

      const sportHigh = tracks.find(track =>
        normalizeLower(track.sport) === sport &&
        normalizeLower(track.intensity) === "high"
      );

      if (sportHigh) return sportHigh;

      const hype = tracks.find(
        track =>
          normalizeLower(track.mood) === "hype"
      );

      return hype || tracks[0];
    } catch (err) {
      console.warn(
        "[PHNX Media] Music selection unavailable:",
        err
      );

      return null;
    }
  }

  /*
  ==========================================================
  JOB MANUFACTURE
  ==========================================================
  */

  async function createOrUpdateMediaJob(
    handoff = {},
    registeredAssets = []
  ) {
    const client = requireDb();

    const validation =
      validateGovernedHandoff(handoff);

    if (!validation.ok) {
      throw new Error(
        `PHNX Media Engine: invalid governed handoff: ` +
        validation.errors.join(" ")
      );
    }

    const ctx = buildAthleteContext(handoff);
    const candidate = buildCandidateContext(handoff);
    const governance = buildGovernanceContext(handoff);
    const musicTrack = await selectMusicTrack(handoff);

    const inputPayload = {
      engine_version: ENGINE_VERSION,

      source_contract:
        "PHNX_MEDIA_V1_GOVERNED_HANDOFF",

      handoff_id:
        handoff.handoff_id || null,

      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,

      athlete_display_name:
        ctx.athlete_display_name,

      candidate,

      governance,

      intelligence_refs:
        handoff.intelligence_refs || {},

      professional_attribution:
        handoff.professional_attribution || {},

      upstream_receipts:
        handoff.receipts || {},

      assets: registeredAssets.map(asset => ({
        asset_id:
          asset.asset_id ||
          asset.id ||
          null,

        asset_type: asset.asset_type,
        asset_label: asset.asset_label,

        source_kind: asset.source_kind,

        source_url: asset.source_url,
        public_url: asset.public_url,
        storage_path: asset.storage_path,

        review_status:
          asset.review_status,

        provenance:
          asset.metadata?.provenance ||
          null,

        verification_state:
          asset.metadata?.verification_state ||
          "UNKNOWN",

        rights_state:
          asset.metadata?.rights_state ||
          "UNKNOWN",

        consent_state:
          asset.metadata?.consent_state ||
          "UNKNOWN",

        disclosure_scope:
          asset.metadata?.disclosure_scope ||
          governance.disclosure_scope,

        lineage:
          asset.metadata?.lineage ||
          null
      })),

      editorial_review: {
        status: REVIEW.PENDING,
        reviewed_by: null,
        reviewed_at: null,
        notes: null
      },

      fact_review: {
        status: REVIEW.PENDING,
        reviewed_by: null,
        reviewed_at: null,
        notes: null
      },

      rights_review: {
        status: REVIEW.PENDING,
        reviewed_by: null,
        reviewed_at: null,
        notes: null
      },

      publication_version: 1,

      captured_at: nowISO()
    };

    const renderPayload = {
      engine_version: ENGINE_VERSION,

      render_profile:
        "phnx_sports_publication_package_v1",

      output_format:
        "youtube_video",

      /*
        Branding is manufacturing/presentation.
        It does not create intelligence.
      */
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
            track_id:
              musicTrack.track_id,

            track_title:
              musicTrack.track_title,

            mood:
              musicTrack.mood,

            sport:
              musicTrack.sport,

            intensity:
              musicTrack.intensity,

            source:
              "phnx_music_library"
          }
        : null,

      /*
        Governed intelligence references may be rendered.
        Values are NOT calculated here.
      */
      intelligence_refs:
        handoff.intelligence_refs || {},

      created_at: nowISO()
    };

    const publishPayload = {
      engine_version: ENGINE_VERSION,
      channel_key: CHANNEL_KEY,
      platform: "youtube",

      /*
        This is only a proposed publication package.
        Publication authority has not yet been established.
      */
      proposed_title:
        `${ctx.athlete_display_name || "PHNX Athlete"} | ` +
        `PHNX Sports Feature`,

      proposed_description:
        "PHNX Sports governed athlete media publication.",

      proposed_tags: [
        "PHNX Sports",
        "STATS-CORE",
        ctx.sport,
        ctx.primary_position,
        ctx.school_program,
        ctx.graduation_class
      ].filter(Boolean),

      disclosure_scope:
        governance.disclosure_scope,

      publication_authorized: false,

      created_at: nowISO()
    };

    const jobPayload = {
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,

      job_type: JOB_TYPE,
      channel_key: CHANNEL_KEY,

      athlete_display_name:
        ctx.athlete_display_name,

      sport: ctx.sport,

      primary_position:
        ctx.primary_position,

      school_program:
        ctx.school_program,

      graduation_class:
        ctx.graduation_class,

      /*
        Candidate has entered Stream 7 manufacturing.
        It has NOT been approved for publication.
      */
      job_status: STATUS.DRAFT,

      review_status: "pending",

      music_track_id:
        musicTrack?.track_id || null,

      music_selection_reason:
        musicTrack
          ? (
              `System-selected production track ` +
              `for sport=${ctx.sport || "unknown"}.`
            )
          : null,

      /*
        Publication/distribution requirements remain false
        until governed approval.
      */
      render_required: true,
      youtube_publish_required: false,
      multibox_notice_required: false,

      locked: false,
      attempt_count: 0,
      max_attempts: 3,
      priority: "standard",

      input_payload: inputPayload,
      render_payload: renderPayload,
      publish_payload: publishPayload,

      updated_at: nowISO()
    };

    const { data: existing, error: existingError } =
      await client
        .from(TABLES.JOBS)
        .select("*")
        .eq(
          "snapshot_id",
          ctx.snapshot_id
        )
        .eq(
          "job_type",
          JOB_TYPE
        )
        .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      /*
        Preserve prior lifecycle/history.
        Do not reset a PUBLISHED/WITHDRAWN/ARCHIVED job to DRAFT
        merely because a new handoff arrives.

        A published revision must use explicit update/version
        manufacture.
      */
      if (
        [
          STATUS.PUBLISHED,
          STATUS.UPDATED,
          STATUS.WITHDRAWN,
          STATUS.ARCHIVED
        ].includes(existing.job_status)
      ) {
        throw new Error(
          "PHNX Media Engine: existing publication has historical " +
          "state. Use governed publication revision/version workflow."
        );
      }

      const { data, error } = await client
        .from(TABLES.JOBS)
        .update({
          ...jobPayload,

          /*
            Keep job in its current constitutional state unless
            it has not progressed beyond DRAFT.
          */
          job_status:
            existing.job_status === STATUS.DRAFT
              ? STATUS.DRAFT
              : existing.job_status,

          input_payload: {
            ...(existing.input_payload || {}),
            ...inputPayload,

            /*
              Preserve review records already completed.
            */
            editorial_review:
              existing.input_payload?.editorial_review ||
              inputPayload.editorial_review,

            fact_review:
              existing.input_payload?.fact_review ||
              inputPayload.fact_review,

            rights_review:
              existing.input_payload?.rights_review ||
              inputPayload.rights_review
          },

          updated_at: nowISO()
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw error;

      await writeJobEvent({
        media_job_id: data.media_job_id,
        from_status: existing.job_status,
        to_status: data.job_status,
        event_type: "GOVERNED_HANDOFF_RECONCILED",
        payload: {
          handoff_id:
            handoff.handoff_id || null,

          candidate_id:
            candidate.candidate_id,

          asset_count:
            registeredAssets.length
        }
      });

      await writeReceipt({
        media_job_id: data.media_job_id,
        snapshot_id: ctx.snapshot_id,
        athlete_id: ctx.athlete_id,

        receipt_type:
          RECEIPT_TYPES.JOB_UPDATED,

        status: data.job_status,

        receipt_payload: {
          handoff_id:
            handoff.handoff_id || null,

          candidate_id:
            candidate.candidate_id,

          asset_count:
            registeredAssets.length
        }
      });

      return data;
    }

    const { data, error } = await client
      .from(TABLES.JOBS)
      .insert({
        ...jobPayload,
        created_at: nowISO()
      })
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: data.media_job_id,
      from_status: null,
      to_status: STATUS.DRAFT,
      event_type: "MEDIA_CANDIDATE_ACCEPTED",
      payload: {
        candidate_id:
          candidate.candidate_id,

        candidate_type:
          candidate.candidate_type,

        why:
          candidate.why,

        source_authority:
          candidate.source_authority,

        asset_count:
          registeredAssets.length
      }
    });

    await writeReceipt({
      media_job_id: data.media_job_id,
      snapshot_id: ctx.snapshot_id,
      athlete_id: ctx.athlete_id,

      receipt_type:
        RECEIPT_TYPES.JOB_CREATED,

      status: STATUS.DRAFT,

      receipt_payload: {
        handoff_id:
          handoff.handoff_id || null,

        candidate_id:
          candidate.candidate_id,

        candidate_why:
          candidate.why,

        source_authority:
          candidate.source_authority,

        asset_count:
          registeredAssets.length
      }
    });

    return data;
  }

  /*
  ==========================================================
  PRIMARY ENTRY — GOVERNED MEDIA HANDOFF
  ==========================================================
  */

  async function queueGovernedMediaHandoff(input = {}) {
    let handoff;

    try {
      handoff = resolveGovernedHandoff(input);

      const validation =
        validateGovernedHandoff(handoff);

      if (!validation.ok) {
        return {
          ok: false,
          status: "INVALID_GOVERNED_HANDOFF",
          errors: validation.errors
        };
      }

      const assets =
        await registerAssetsFromHandoff(handoff);

      const job =
        await createOrUpdateMediaJob(
          handoff,
          assets
        );

      await writeReceipt({
        media_job_id:
          job.media_job_id,

        snapshot_id:
          job.snapshot_id,

        athlete_id:
          job.athlete_id,

        receipt_type:
          RECEIPT_TYPES.HANDOFF_ACCEPTED,

        status:
          "GOVERNED_HANDOFF_ACCEPTED",

        receipt_payload: {
          handoff_id:
            handoff.handoff_id || null,

          candidate_id:
            handoff.candidate?.candidate_id ||
            null
        }
      });

      return {
        ok: true,
        status: STATUS.DRAFT,
        handoff,
        assets,
        job
      };
    } catch (err) {
      console.error(
        "[PHNX Media] Governed handoff failed:",
        err
      );

      await writeReceipt({
        snapshot_id:
          handoff?.snapshot_id || null,

        athlete_id:
          handoff?.athlete_id || null,

        receipt_type:
          RECEIPT_TYPES.FAILURE,

        status: "FAILED",

        receipt_payload: {
          stage:
            "GOVERNED_HANDOFF",

          error:
            err.message || String(err)
        }
      });

      return {
        ok: false,
        status: "PHNX_MEDIA_HANDOFF_FAILED",
        error:
          err.message || String(err)
      };
    }
  }

  /*
  ==========================================================
  LEGACY ENTRY COMPATIBILITY
  ==========================================================

  Existing Stream 2 callers may still invoke:
    queueSnapshotMediaPackage(savedSnapshot)

  This compatibility method accepts ONLY a governed PHNX media
  handoff already manufactured upstream.

  It does NOT inspect DOM fields.
  It does NOT create provenance.
  It does NOT infer candidate eligibility.
  ==========================================================
  */

  async function queueSnapshotMediaPackage(saved = {}) {
    const handoff =
      saved.phnx_media_handoff_payload ||
      saved.media_handoff_payload ||
      saved.phnx_media_handoff ||
      null;

    if (!handoff) {
      return {
        ok: false,
        status: "GOVERNED_MEDIA_HANDOFF_REQUIRED",
        reason:
          "Stream 7 no longer manufactures athlete source-media " +
          "intake/provenance from Snapshot Intake. " +
          "A governed Stream 2 media handoff is required."
      };
    }

    return queueGovernedMediaHandoff(handoff);
  }

  /*
  ==========================================================
  JOB ACCESS / TRANSITION
  ==========================================================
  */

  async function getMediaJob(mediaJobId) {
    const client = requireDb();

    const { data, error } = await client
      .from(TABLES.JOBS)
      .select("*")
      .eq(
        "media_job_id",
        mediaJobId
      )
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  function allowedTransitions() {
    return {
      [STATUS.DRAFT]: [
        STATUS.IN_PRODUCTION,
        STATUS.REJECTED,
        STATUS.CANCELLED
      ],

      [STATUS.IN_PRODUCTION]: [
        STATUS.EDITORIAL_REVIEW,
        STATUS.CORRECTION_REQUIRED,
        STATUS.FAILED,
        STATUS.CANCELLED
      ],

      [STATUS.EDITORIAL_REVIEW]: [
        STATUS.FACT_REVIEW,
        STATUS.CORRECTION_REQUIRED,
        STATUS.REJECTED
      ],

      [STATUS.FACT_REVIEW]: [
        STATUS.RIGHTS_REVIEW,
        STATUS.CORRECTION_REQUIRED,
        STATUS.REJECTED
      ],

      [STATUS.RIGHTS_REVIEW]: [
        STATUS.APPROVED,
        STATUS.CORRECTION_REQUIRED,
        STATUS.REJECTED
      ],

      [STATUS.CORRECTION_REQUIRED]: [
        STATUS.IN_PRODUCTION,
        STATUS.EDITORIAL_REVIEW,
        STATUS.REJECTED,
        STATUS.CANCELLED
      ],

      [STATUS.APPROVED]: [
        STATUS.SCHEDULED,
        STATUS.WITHDRAWN
      ],

      [STATUS.SCHEDULED]: [
        STATUS.PUBLISHED,
        STATUS.WITHDRAWN,
        STATUS.CANCELLED
      ],

      [STATUS.PUBLISHED]: [
        STATUS.UPDATED,
        STATUS.WITHDRAWN,
        STATUS.ARCHIVED
      ],

      [STATUS.UPDATED]: [
        STATUS.UPDATED,
        STATUS.WITHDRAWN,
        STATUS.ARCHIVED
      ],

      [STATUS.WITHDRAWN]: [
        STATUS.ARCHIVED
      ],

      [STATUS.REJECTED]: [
        STATUS.ARCHIVED
      ],

      [STATUS.FAILED]: [
        STATUS.DRAFT,
        STATUS.CANCELLED,
        STATUS.ARCHIVED
      ],

      [STATUS.CANCELLED]: [
        STATUS.ARCHIVED
      ],

      [STATUS.ARCHIVED]: []
    };
  }

  function assertTransitionAllowed(
    fromStatus,
    toStatus
  ) {
    const map = allowedTransitions();

    const allowed =
      map[fromStatus] || [];

    if (!allowed.includes(toStatus)) {
      throw new Error(
        `PHNX Media Engine: illegal publication transition ` +
        `${fromStatus} → ${toStatus}.`
      );
    }
  }

  async function transitionJob(
    mediaJobId,
    toStatus,
    payload = {}
  ) {
    const client = requireDb();

    const existing =
      await getMediaJob(mediaJobId);

    if (!existing) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    assertTransitionAllowed(
      existing.job_status,
      toStatus
    );

    const updatePayload = {
      job_status: toStatus,
      updated_at: nowISO(),
      ...payload
    };

    if (
      toStatus === STATUS.PUBLISHED
    ) {
      updatePayload.completed_at =
        existing.completed_at || nowISO();
    }

    const { data, error } = await client
      .from(TABLES.JOBS)
      .update(updatePayload)
      .eq(
        "media_job_id",
        mediaJobId
      )
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: mediaJobId,
      from_status: existing.job_status,
      to_status: toStatus,
      event_type:
        "PUBLICATION_STATE_CHANGED",
      payload
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: data.snapshot_id,
      athlete_id: data.athlete_id,

      receipt_type:
        RECEIPT_TYPES.JOB_STATUS_CHANGED,

      status: toStatus,

      receipt_payload: {
        from_status:
          existing.job_status,

        to_status: toStatus,

        transition_payload:
          payload
      }
    });

    return data;
  }

  /*
  ==========================================================
  PRODUCTION / RENDER
  ==========================================================
  */

  async function beginProduction(
    mediaJobId,
    workerId = "phnx-media-production"
  ) {
    const client = requireDb();

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      ![
        STATUS.DRAFT,
        STATUS.CORRECTION_REQUIRED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: production may begin only from " +
        "DRAFT or CORRECTION_REQUIRED."
      );
    }

    const { data, error } = await client
      .from(TABLES.JOBS)
      .update({
        job_status: STATUS.IN_PRODUCTION,
        locked: true,
        locked_at: nowISO(),
        locked_by: workerId,
        updated_at: nowISO()
      })
      .eq(
        "media_job_id",
        mediaJobId
      )
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: mediaJobId,
      from_status: job.job_status,
      to_status: STATUS.IN_PRODUCTION,
      event_type: "PRODUCTION_STARTED",
      payload: {
        worker_id: workerId
      }
    });

    return data;
  }

  async function recordRenderOutput(options = {}) {
    const client = requireDb();

    const mediaJobId =
      clean(options.media_job_id);

    if (!mediaJobId) {
      throw new Error(
        "PHNX Media Engine: media_job_id is required."
      );
    }

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      job.job_status !== STATUS.IN_PRODUCTION
    ) {
      throw new Error(
        "PHNX Media Engine: render output may only be recorded " +
        "while publication is IN_PRODUCTION."
      );
    }

    const previousRenderId =
      options.prior_render_id || null;

    const renderRow = {
      media_job_id: mediaJobId,
      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,

      render_status: "rendered",

      output_type:
        options.output_type ||
        "youtube_video",

      output_bucket:
        options.output_bucket || null,

      output_path:
        options.output_path || null,

      output_url:
        options.output_url || null,

      thumbnail_bucket:
        options.thumbnail_bucket || null,

      thumbnail_path:
        options.thumbnail_path || null,

      thumbnail_url:
        options.thumbnail_url || null,

      duration_seconds:
        options.duration_seconds || null,

      width:
        options.width || 1080,

      height:
        options.height || 1920,

      render_engine:
        options.render_engine ||
        "phoenix-video-render",

      render_payload: {
        ...(job.render_payload || {}),
        ...(options.render_payload || {}),

        lineage: {
          source_asset_ids:
            options.source_asset_ids || [],

          selected_clip_ids:
            options.selected_clip_ids || [],

          prior_render_id:
            previousRenderId,

          derivative_type:
            options.derivative_type ||
            "EDITED_PUBLICATION_PRODUCT",

          version:
            options.version ||
            (
              Number(
                job.input_payload
                  ?.publication_version || 1
              )
            )
        },

        rendered_at: nowISO()
      },

      updated_at: nowISO()
    };

    const { data: render, error } =
      await client
        .from(TABLES.RENDERS)
        .insert(renderRow)
        .select("*")
        .single();

    if (error) throw error;

    const { data: updatedJob, error: jobError } =
      await client
        .from(TABLES.JOBS)
        .update({
          rendered_video_url:
            render.output_url,

          rendered_thumbnail_url:
            render.thumbnail_url,

          locked: false,
          locked_at: null,
          locked_by: null,

          job_status:
            STATUS.EDITORIAL_REVIEW,

          updated_at: nowISO()
        })
        .eq(
          "media_job_id",
          mediaJobId
        )
        .select("*")
        .single();

    if (jobError) throw jobError;

    await writeJobEvent({
      media_job_id: mediaJobId,
      from_status: STATUS.IN_PRODUCTION,
      to_status: STATUS.EDITORIAL_REVIEW,
      event_type: "RENDER_COMPLETED",
      payload: {
        render_id:
          render.render_id || render.id,

        lineage:
          render.render_payload?.lineage ||
          null
      }
    });

    await writeReceipt({
      media_job_id: mediaJobId,

      render_id:
        render.render_id ||
        render.id ||
        null,

      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,

      receipt_type:
        RECEIPT_TYPES.RENDER_COMPLETED,

      status: "RENDERED",

      receipt_payload: {
        output_url:
          render.output_url,

        thumbnail_url:
          render.thumbnail_url,

        lineage:
          render.render_payload?.lineage ||
          null
      }
    });

    return {
      render,
      job: updatedJob
    };
  }

  /*
  ==========================================================
  REVIEW CONTRACTS
  ==========================================================
  */

  async function updateReviewRecord(
    mediaJobId,
    reviewType,
    review = {}
  ) {
    const client = requireDb();

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    const allowedReviewTypes = [
      "editorial_review",
      "fact_review",
      "rights_review"
    ];

    if (
      !allowedReviewTypes.includes(reviewType)
    ) {
      throw new Error(
        "PHNX Media Engine: invalid review type."
      );
    }

    const status =
      normalizeUpper(review.status);

    if (
      ![
        REVIEW.APPROVED,
        REVIEW.REJECTED,
        REVIEW.CORRECTION_REQUIRED
      ].includes(status)
    ) {
      throw new Error(
        "PHNX Media Engine: governed review status required."
      );
    }

    const inputPayload = {
      ...(job.input_payload || {})
    };

    inputPayload[reviewType] = {
      status,
      reviewed_by:
        review.reviewed_by || null,

      reviewer_authority:
        review.reviewer_authority || null,

      reviewed_at:
        review.reviewed_at || nowISO(),

      notes:
        review.notes || null,

      receipt_id:
        review.receipt_id || null
    };

    const { data, error } = await client
      .from(TABLES.JOBS)
      .update({
        input_payload: inputPayload,
        updated_at: nowISO()
      })
      .eq(
        "media_job_id",
        mediaJobId
      )
      .select("*")
      .single();

    if (error) throw error;

    return data;
  }

  async function completeEditorialReview(
    mediaJobId,
    review = {}
  ) {
    const job =
      await getMediaJob(mediaJobId);

    if (
      job?.job_status !==
      STATUS.EDITORIAL_REVIEW
    ) {
      throw new Error(
        "PHNX Media Engine: publication is not in EDITORIAL_REVIEW."
      );
    }

    const updated =
      await updateReviewRecord(
        mediaJobId,
        "editorial_review",
        review
      );

    const status =
      normalizeUpper(review.status);

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: updated.snapshot_id,
      athlete_id: updated.athlete_id,

      receipt_type:
        RECEIPT_TYPES.EDITORIAL_REVIEW,

      status,

      receipt_payload: {
        reviewer:
          review.reviewed_by || null,

        reviewer_authority:
          review.reviewer_authority || null,

        notes:
          review.notes || null
      }
    });

    if (
      status === REVIEW.CORRECTION_REQUIRED
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.CORRECTION_REQUIRED
      );
    }

    if (
      status === REVIEW.REJECTED
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.REJECTED
      );
    }

    return transitionJob(
      mediaJobId,
      STATUS.FACT_REVIEW
    );
  }

  async function completeFactReview(
    mediaJobId,
    review = {}
  ) {
    const job =
      await getMediaJob(mediaJobId);

    if (
      job?.job_status !==
      STATUS.FACT_REVIEW
    ) {
      throw new Error(
        "PHNX Media Engine: publication is not in FACT_REVIEW."
      );
    }

    const updated =
      await updateReviewRecord(
        mediaJobId,
        "fact_review",
        review
      );

    const status =
      normalizeUpper(review.status);

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: updated.snapshot_id,
      athlete_id: updated.athlete_id,

      receipt_type:
        RECEIPT_TYPES.FACT_REVIEW,

      status,

      receipt_payload: {
        reviewer:
          review.reviewed_by || null,

        reviewer_authority:
          review.reviewer_authority || null,

        notes:
          review.notes || null
      }
    });

    if (
      status === REVIEW.CORRECTION_REQUIRED
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.CORRECTION_REQUIRED
      );
    }

    if (
      status === REVIEW.REJECTED
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.REJECTED
      );
    }

    return transitionJob(
      mediaJobId,
      STATUS.RIGHTS_REVIEW
    );
  }

  async function completeRightsReview(
    mediaJobId,
    review = {}
  ) {
    const client = requireDb();

    const job =
      await getMediaJob(mediaJobId);

    if (
      job?.job_status !==
      STATUS.RIGHTS_REVIEW
    ) {
      throw new Error(
        "PHNX Media Engine: publication is not in RIGHTS_REVIEW."
      );
    }

    /*
      Rights authority comes from the governed review/handoff.
      Stream 7 records/preserves it; it does not invent it.
    */
    const inputPayload = {
      ...(job.input_payload || {})
    };

    const governance = {
      ...(inputPayload.governance || {}),

      ...(review.governance || {})
    };

    inputPayload.governance = governance;

    const publicationAuthority =
      evaluatePublicationAuthority(
        governance,
        governance.disclosure_scope ||
        DISCLOSURE.PUBLIC_MEDIA
      );

    const requestedStatus =
      normalizeUpper(review.status);

    let effectiveReviewStatus =
      requestedStatus;

    if (
      requestedStatus === REVIEW.APPROVED &&
      !publicationAuthority.authorized
    ) {
      effectiveReviewStatus =
        REVIEW.CORRECTION_REQUIRED;
    }

    inputPayload.rights_review = {
      status:
        effectiveReviewStatus,

      reviewed_by:
        review.reviewed_by || null,

      reviewer_authority:
        review.reviewer_authority || null,

      reviewed_at:
        review.reviewed_at || nowISO(),

      notes:
        review.notes || null,

      receipt_id:
        review.receipt_id || null,

      publication_authority:
        publicationAuthority
    };

    const { data: updated, error } =
      await client
        .from(TABLES.JOBS)
        .update({
          input_payload: inputPayload,
          updated_at: nowISO()
        })
        .eq(
          "media_job_id",
          mediaJobId
        )
        .select("*")
        .single();

    if (error) throw error;

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: updated.snapshot_id,
      athlete_id: updated.athlete_id,

      receipt_type:
        RECEIPT_TYPES.RIGHTS_REVIEW,

      status:
        effectiveReviewStatus,

      receipt_payload: {
        reviewer:
          review.reviewed_by || null,

        reviewer_authority:
          review.reviewer_authority || null,

        governance,

        publication_authority:
          publicationAuthority
      }
    });

    if (
      effectiveReviewStatus ===
      REVIEW.REJECTED
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.REJECTED
      );
    }

    if (
      effectiveReviewStatus !==
      REVIEW.APPROVED
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.CORRECTION_REQUIRED,
        {
          error_message:
            publicationAuthority.reason
        }
      );
    }

    /*
      Editorial + fact review must still be approved.
    */
    const editorialApproved =
      normalizeUpper(
        inputPayload.editorial_review?.status
      ) === REVIEW.APPROVED;

    const factApproved =
      normalizeUpper(
        inputPayload.fact_review?.status
      ) === REVIEW.APPROVED;

    if (
      !editorialApproved ||
      !factApproved
    ) {
      return transitionJob(
        mediaJobId,
        STATUS.CORRECTION_REQUIRED,
        {
          error_message:
            "Editorial and fact review authority are required."
        }
      );
    }

    return transitionJob(
      mediaJobId,
      STATUS.APPROVED,
      {
        review_status: "approved",
        error_message: null,

        publish_payload: {
          ...(job.publish_payload || {}),
          publication_authorized: true,
          publication_authority:
            publicationAuthority,

          approved_at: nowISO()
        }
      }
    );
  }

  /*
  ==========================================================
  PUBLICATION / DISTRIBUTION CONTRACT
  ==========================================================
  */

  async function schedulePublication(
    mediaJobId,
    schedule = {}
  ) {
    const job =
      await getMediaJob(mediaJobId);

    if (
      job?.job_status !== STATUS.APPROVED
    ) {
      throw new Error(
        "PHNX Media Engine: only APPROVED publication may be scheduled."
      );
    }

    const governance =
      job.input_payload?.governance || {};

    const authority =
      evaluatePublicationAuthority(
        governance,
        governance.disclosure_scope ||
        DISCLOSURE.PUBLIC_MEDIA
      );

    if (!authority.authorized) {
      throw new Error(
        `PHNX Media Engine: ${authority.reason}`
      );
    }

    const updated =
      await transitionJob(
        mediaJobId,
        STATUS.SCHEDULED,
        {
          youtube_publish_required: true,

          publish_payload: {
            ...(job.publish_payload || {}),

            publication_authorized: true,

            scheduled_for:
              schedule.scheduled_for ||
              null,

            scheduled_by:
              schedule.scheduled_by ||
              null,

            scheduling_authority:
              schedule.scheduling_authority ||
              "STREAM_7_PUBLICATION_AUTHORITY",

            scheduled_at: nowISO()
          }
        }
      );

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: updated.snapshot_id,
      athlete_id: updated.athlete_id,

      receipt_type:
        RECEIPT_TYPES.PUBLICATION_SCHEDULED,

      status: STATUS.SCHEDULED,

      receipt_payload: {
        scheduled_for:
          schedule.scheduled_for || null,

        scheduled_by:
          schedule.scheduled_by || null
      }
    });

    return updated;
  }

  async function createOrQueueYouTubePost(
    mediaJobId
  ) {
    const client = requireDb();

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      job.job_status !== STATUS.SCHEDULED
    ) {
      throw new Error(
        "PHNX Media Engine: distribution may only be queued " +
        "from SCHEDULED publication state."
      );
    }

    if (
      job.publish_payload?.publication_authorized !== true
    ) {
      throw new Error(
        "PHNX Media Engine: publication authority not established."
      );
    }

    const governance =
      job.input_payload?.governance || {};

    const authority =
      evaluatePublicationAuthority(
        governance,
        governance.disclosure_scope ||
        DISCLOSURE.PUBLIC_MEDIA
      );

    if (!authority.authorized) {
      throw new Error(
        `PHNX Media Engine: ${authority.reason}`
      );
    }

    const { data: latestRender, error: renderError } =
      await client
        .from(TABLES.RENDERS)
        .select("*")
        .eq(
          "media_job_id",
          mediaJobId
        )
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(1)
        .maybeSingle();

    if (renderError) throw renderError;

    if (!latestRender) {
      throw new Error(
        "PHNX Media Engine: approved publication has no governed render output."
      );
    }

    const title =
      job.publish_payload?.approved_title ||
      job.publish_payload?.proposed_title ||
      `${job.athlete_display_name || "PHNX Athlete"} | PHNX Sports Feature`;

    const description =
      job.publish_payload?.approved_description ||
      job.publish_payload?.proposed_description ||
      "PHNX Sports governed athlete media publication.";

    const tags =
      job.publish_payload?.approved_tags ||
      job.publish_payload?.proposed_tags ||
      [];

    const postPayload = {
      media_job_id: mediaJobId,

      render_id:
        latestRender.render_id ||
        latestRender.id ||
        null,

      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,

      channel_key: CHANNEL_KEY,

      title,
      description,
      tags,

      publish_status: "queued",

      updated_at: nowISO()
    };

    const { data: existing, error: lookupError } =
      await client
        .from(TABLES.YOUTUBE)
        .select("*")
        .eq(
          "media_job_id",
          mediaJobId
        )
        .maybeSingle();

    if (lookupError) throw lookupError;

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

    await writeReceipt({
      media_job_id: mediaJobId,

      youtube_post_id:
        post.youtube_post_id ||
        post.id ||
        null,

      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,

      receipt_type:
        RECEIPT_TYPES.DISTRIBUTION_QUEUED,

      status: "DISTRIBUTION_QUEUED",

      receipt_payload: {
        destination:
          CHANNEL_KEY,

        title,

        publication_state:
          job.job_status
      }
    });

    return post;
  }

  /*
  ==========================================================
  OFFICIAL PUBLICATION
  ==========================================================

  Spider/channel execution proves distribution mechanics.

  Official PHNX publication is established by Stream 7 only
  after:
  - APPROVED
  - SCHEDULED
  - governed distribution success
  - publication receipt manufacture

  ==========================================================
  */

  async function markPublished(options = {}) {
    const client = requireDb();

    const mediaJobId =
      clean(options.media_job_id);

    if (!mediaJobId) {
      throw new Error(
        "PHNX Media Engine: media_job_id required."
      );
    }

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      job.job_status !== STATUS.SCHEDULED
    ) {
      throw new Error(
        "PHNX Media Engine: publication may only occur from SCHEDULED."
      );
    }

    const governance =
      job.input_payload?.governance || {};

    const authority =
      evaluatePublicationAuthority(
        governance,
        governance.disclosure_scope ||
        DISCLOSURE.PUBLIC_MEDIA
      );

    if (!authority.authorized) {
      throw new Error(
        `PHNX Media Engine: ${authority.reason}`
      );
    }

    if (
      job.publish_payload?.publication_authorized !== true
    ) {
      throw new Error(
        "PHNX Media Engine: governed publication approval missing."
      );
    }

    const { data: post, error } =
      await client
        .from(TABLES.YOUTUBE)
        .update({
          youtube_video_id:
            options.youtube_video_id || null,

          youtube_url:
            options.youtube_url || null,

          publish_status: "posted",

          spider_job_id:
            options.spider_job_id || null,

          spider_receipt:
            options.spider_receipt || {},

          published_at:
            options.published_at ||
            nowISO(),

          updated_at:
            nowISO()
        })
        .eq(
          "media_job_id",
          mediaJobId
        )
        .select("*")
        .single();

    if (error) throw error;

    /*
      Publication Receipt is the constitutional evidence that
      official publication occurred.
    */
    const publicationReceipt =
      await writeReceipt({
        media_job_id: mediaJobId,

        youtube_post_id:
          post.youtube_post_id ||
          post.id ||
          null,

        snapshot_id: job.snapshot_id,
        athlete_id: job.athlete_id,

        receipt_type:
          RECEIPT_TYPES.PUBLICATION_PUBLISHED,

        status: STATUS.PUBLISHED,

        receipt_payload: {
          publication_authority:
            "STREAM_7_PHNX_PUBLICATION_AUTHORITY",

          candidate_id:
            job.input_payload
              ?.candidate
              ?.candidate_id ||
            null,

          why:
            job.input_payload
              ?.candidate
              ?.why ||
            null,

          disclosure_scope:
            governance.disclosure_scope,

          rights_authority:
            governance.rights_authority ||
            null,

          consent_authority:
            governance.consent_authority ||
            null,

          publication_version:
            job.input_payload
              ?.publication_version ||
            1,

          destination:
            CHANNEL_KEY,

          youtube_video_id:
            post.youtube_video_id,

          youtube_url:
            post.youtube_url,

          spider_job_id:
            post.spider_job_id || null,

          spider_receipt:
            post.spider_receipt || {},

          published_at:
            post.published_at
        }
      });

    if (!publicationReceipt?.ok) {
      /*
        Fail closed:
        Channel execution without authoritative publication
        receipt must NOT be represented as official PHNX
        publication truth.
      */
      throw new Error(
        "PHNX Media Engine: distribution completed but " +
        "Publication Receipt Authority could not be established."
      );
    }

    const publishedJob =
      await transitionJob(
        mediaJobId,
        STATUS.PUBLISHED,
        {
          youtube_post_id:
            post.youtube_post_id ||
            post.id ||
            null,

          youtube_url:
            post.youtube_url,

          multibox_notice_required:
            true,

          publish_payload: {
            ...(job.publish_payload || {}),

            publication_receipt_id:
              publicationReceipt.receipt?.id ||
              publicationReceipt.receipt
                ?.receipt_id ||
              null,

            published_at:
              post.published_at,

            publication_authorized:
              true
          }
        }
      );

    await writeReceipt({
      media_job_id: mediaJobId,

      youtube_post_id:
        post.youtube_post_id ||
        post.id ||
        null,

      snapshot_id: job.snapshot_id,
      athlete_id: job.athlete_id,

      receipt_type:
        RECEIPT_TYPES.DISTRIBUTION_COMPLETED,

      status: "DISTRIBUTED",

      receipt_payload: {
        destination:
          CHANNEL_KEY,

        youtube_url:
          post.youtube_url,

        publication_receipt_id:
          publicationReceipt.receipt?.id ||
          publicationReceipt.receipt
            ?.receipt_id ||
          null
      }
    });

    return {
      job: publishedJob,
      post,
      publication_receipt:
        publicationReceipt.receipt
    };
  }

  /*
    Backward-compatible name.

    IMPORTANT:
    It now enforces governed publication authority.
  */
  async function markYouTubePosted(options = {}) {
    return markPublished(options);
  }

  /*
  ==========================================================
  COMMUNICATION HANDOFF
  ==========================================================

  STREAM 7 DOES NOT WRITE MULTI-BOX TABLES.

  This function manufactures a governed communication request
  for Stream 6.

  Stream 6 decides whether, how, and when the communication
  is actually admitted and sent.
  ==========================================================
  */

  async function buildPublishedNotificationHandoff(
    mediaJobId
  ) {
    const client = requireDb();

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      ![
        STATUS.PUBLISHED,
        STATUS.UPDATED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: publication notification handoff " +
        "requires PUBLISHED or UPDATED state."
      );
    }

    const { data: post, error } =
      await client
        .from(TABLES.YOUTUBE)
        .select("*")
        .eq(
          "media_job_id",
          mediaJobId
        )
        .maybeSingle();

    if (error) throw error;

    const handoff = {
      handoff_type:
        "STREAM_7_TO_STREAM_6_PUBLICATION_NOTICE",

      handoff_id:
        generateLocalRef(
          "PHNX_MEDIA_COMMUNICATION"
        ),

      governing_stream:
        "STREAM_6",

      source_stream:
        "STREAM_7",

      message_type:
        "phnx_media_publish_notice",

      target_role:
        "athlete",

      athlete_id:
        job.athlete_id || null,

      snapshot_id:
        job.snapshot_id || null,

      athlete_display_name:
        job.athlete_display_name || null,

      subject:
        "Your PHNX Sports media publication is available",

      publication: {
        media_job_id:
          mediaJobId,

        publication_state:
          job.job_status,

        publication_receipt_id:
          job.publish_payload
            ?.publication_receipt_id ||
          null,

        youtube_url:
          post?.youtube_url || null
      },

      requested_at: nowISO()
    };

    await writeReceipt({
      media_job_id: mediaJobId,

      youtube_post_id:
        post?.youtube_post_id ||
        post?.id ||
        null,

      snapshot_id:
        job.snapshot_id,

      athlete_id:
        job.athlete_id,

      receipt_type:
        RECEIPT_TYPES.COMMUNICATION_HANDOFF,

      status:
        "STREAM_6_HANDOFF_READY",

      receipt_payload: {
        handoff
      }
    });

    /*
      Optional non-authoritative browser signal.
      This does not represent communication admission/sending.
    */
    try {
      window.dispatchEvent(
        new CustomEvent(
          "statscore:stream6-communication-handoff",
          {
            detail: clone(handoff)
          }
        )
      );
    } catch (_) {}

    return handoff;
  }

  /*
    Legacy function name retained only for compatibility.
    It no longer sends Multi-Box communication.
  */
  async function sendPublishedMultiBoxNotice(
    mediaJobId
  ) {
    console.warn(
      "[PHNX Media] sendPublishedMultiBoxNotice is compatibility-only. " +
      "Stream 7 now manufactures a Stream 6 communication handoff."
    );

    return buildPublishedNotificationHandoff(
      mediaJobId
    );
  }

  /*
  ==========================================================
  EXPOSURE RECEIPT CONTRACT
  ==========================================================
  */

  async function recordExposureReceipt(options = {}) {
    const mediaJobId =
      clean(options.media_job_id);

    if (!mediaJobId) {
      throw new Error(
        "PHNX Media Engine: media_job_id required."
      );
    }

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      ![
        STATUS.PUBLISHED,
        STATUS.UPDATED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: exposure events require an official " +
        "published publication state."
      );
    }

    const eventType =
      normalizeUpper(options.event_type);

    if (
      !EXPOSURE_EVENT_TYPES.includes(eventType)
    ) {
      throw new Error(
        "PHNX Media Engine: unsupported governed exposure event."
      );
    }

    const receiptResult =
      await writeReceipt({
        media_job_id: mediaJobId,

        snapshot_id:
          job.snapshot_id,

        athlete_id:
          job.athlete_id,

        receipt_type:
          RECEIPT_TYPES.EXPOSURE_EVENT,

        status:
          "EXPOSURE_EVENT_RECORDED",

        receipt_payload: {
          exposure_event_type:
            eventType,

          occurred_at:
            options.occurred_at ||
            nowISO(),

          publication_receipt_id:
            job.publish_payload
              ?.publication_receipt_id ||
            null,

          destination:
            options.destination ||
            CHANNEL_KEY,

          actor_classification:
            options.actor_classification ||
            null,

          governed_actor_id:
            options.governed_actor_id ||
            null,

          attribution:
            options.attribution || {},

          event_context:
            options.event_context || {},

          /*
            Constitutional warning carried with receipt.
          */
          doctrine: {
            exposure_is_not_athletic_ability:
              true,

            engagement_is_not_recruiting_outcome:
              true,

            exposure_is_not_offer:
              true,

            exposure_is_not_commitment:
              true
          }
        }
      });

    if (!receiptResult?.ok) {
      throw new Error(
        "PHNX Media Engine: exposure receipt could not be established."
      );
    }

    return receiptResult.receipt;
  }

  /*
  ==========================================================
  CORRECTION / VERSION HISTORY
  ==========================================================
  */

  async function markCorrectionRequired(
    mediaJobId,
    correction = {}
  ) {
    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      [
        STATUS.ARCHIVED,
        STATUS.REJECTED,
        STATUS.CANCELLED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: closed publication cannot enter correction."
      );
    }

    if (
      job.job_status === STATUS.PUBLISHED ||
      job.job_status === STATUS.UPDATED
    ) {
      /*
        A published correction must preserve historical state.
        Withdraw or create explicit updated version.
      */
      throw new Error(
        "PHNX Media Engine: published artifacts require explicit " +
        "version/update manufacture; history may not be overwritten."
      );
    }

    return transitionJob(
      mediaJobId,
      STATUS.CORRECTION_REQUIRED,
      {
        error_message:
          correction.reason ||
          "Correction required."
      }
    );
  }

  async function markPublicationUpdated(
    mediaJobId,
    update = {}
  ) {
    const client = requireDb();

    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      ![
        STATUS.PUBLISHED,
        STATUS.UPDATED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: only a published publication may be updated."
      );
    }

    const currentVersion =
      Number(
        job.input_payload
          ?.publication_version || 1
      );

    const inputPayload = {
      ...(job.input_payload || {}),
      publication_version:
        currentVersion + 1,

      prior_publication_reference: {
        publication_receipt_id:
          job.publish_payload
            ?.publication_receipt_id ||
          null,

        youtube_url:
          job.youtube_url ||
          null,

        prior_version:
          currentVersion
      }
    };

    const { data, error } = await client
      .from(TABLES.JOBS)
      .update({
        job_status: STATUS.UPDATED,
        input_payload: inputPayload,
        updated_at: nowISO()
      })
      .eq(
        "media_job_id",
        mediaJobId
      )
      .select("*")
      .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id: mediaJobId,
      from_status: job.job_status,
      to_status: STATUS.UPDATED,
      event_type: "PUBLICATION_VERSION_UPDATED",
      payload: {
        prior_version:
          currentVersion,

        new_version:
          currentVersion + 1,

        reason:
          update.reason || null
      }
    });

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: data.snapshot_id,
      athlete_id: data.athlete_id,

      receipt_type:
        RECEIPT_TYPES.PUBLICATION_UPDATED,

      status: STATUS.UPDATED,

      receipt_payload: {
        prior_version:
          currentVersion,

        new_version:
          currentVersion + 1,

        reason:
          update.reason || null
      }
    });

    return data;
  }

  async function withdrawPublication(
    mediaJobId,
    withdrawal = {}
  ) {
    const job =
      await getMediaJob(mediaJobId);

    if (
      !job ||
      ![
        STATUS.APPROVED,
        STATUS.SCHEDULED,
        STATUS.PUBLISHED,
        STATUS.UPDATED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: publication is not eligible for withdrawal."
      );
    }

    const data =
      await transitionJob(
        mediaJobId,
        STATUS.WITHDRAWN,
        {
          error_message:
            withdrawal.reason ||
            "Publication withdrawn.",

          publish_payload: {
            ...(job.publish_payload || {}),
            withdrawn_at:
              nowISO(),

            withdrawal_reason:
              withdrawal.reason ||
              null,

            withdrawn_by:
              withdrawal.withdrawn_by ||
              null
          }
        }
      );

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: data.snapshot_id,
      athlete_id: data.athlete_id,

      receipt_type:
        RECEIPT_TYPES.PUBLICATION_WITHDRAWN,

      status: STATUS.WITHDRAWN,

      receipt_payload: {
        reason:
          withdrawal.reason ||
          null,

        withdrawn_by:
          withdrawal.withdrawn_by ||
          null
      }
    });

    return data;
  }

  async function archivePublication(
    mediaJobId,
    archive = {}
  ) {
    const job =
      await getMediaJob(mediaJobId);

    if (!job) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      ![
        STATUS.PUBLISHED,
        STATUS.UPDATED,
        STATUS.WITHDRAWN,
        STATUS.REJECTED,
        STATUS.FAILED,
        STATUS.CANCELLED
      ].includes(job.job_status)
    ) {
      throw new Error(
        "PHNX Media Engine: publication is not eligible for archive."
      );
    }

    const data =
      await transitionJob(
        mediaJobId,
        STATUS.ARCHIVED,
        {
          publish_payload: {
            ...(job.publish_payload || {}),
            archived_at:
              nowISO(),

            archived_by:
              archive.archived_by ||
              null,

            archive_reason:
              archive.reason || null
          }
        }
      );

    await writeReceipt({
      media_job_id: mediaJobId,
      snapshot_id: data.snapshot_id,
      athlete_id: data.athlete_id,

      receipt_type:
        RECEIPT_TYPES.PUBLICATION_ARCHIVED,

      status: STATUS.ARCHIVED,

      receipt_payload: {
        archived_by:
          archive.archived_by ||
          null,

        reason:
          archive.reason ||
          null
      }
    });

    return data;
  }

  /*
  ==========================================================
  WORKER CLAIM / RELEASE
  ==========================================================
  */

  async function claimNextJob(
    workerId = "phnx-media-worker"
  ) {
    const client = requireDb();

    /*
      Workers manufacture media.
      They do not approve publication.
    */
    const { data: jobs, error } =
      await client
        .from(TABLES.JOBS)
        .select("*")
        .eq("locked", false)
        .in(
          "job_status",
          [
            STATUS.DRAFT,
            STATUS.CORRECTION_REQUIRED
          ]
        )
        .lt(
          "attempt_count",
          3
        )
        .order(
          "created_at",
          { ascending: true }
        )
        .limit(1);

    if (error) throw error;

    if (
      !jobs ||
      !jobs.length
    ) {
      return null;
    }

    const job = jobs[0];

    const { data, error: lockError } =
      await client
        .from(TABLES.JOBS)
        .update({
          locked: true,
          locked_at: nowISO(),
          locked_by: workerId,

          attempt_count:
            Number(
              job.attempt_count || 0
            ) + 1,

          job_status:
            STATUS.IN_PRODUCTION,

          updated_at:
            nowISO()
        })
        .eq("id", job.id)
        .eq("locked", false)
        .select("*")
        .single();

    if (lockError) throw lockError;

    await writeJobEvent({
      media_job_id:
        data.media_job_id,

      from_status:
        job.job_status,

      to_status:
        STATUS.IN_PRODUCTION,

      event_type:
        "PRODUCTION_JOB_CLAIMED",

      payload: {
        worker_id: workerId,

        attempt_count:
          data.attempt_count
      }
    });

    return data;
  }

  async function releaseJob(
    mediaJobId,
    status = STATUS.FAILED,
    errorMessage = null
  ) {
    const client = requireDb();

    const existing =
      await getMediaJob(mediaJobId);

    if (!existing) {
      throw new Error(
        "PHNX Media Engine: media job not found."
      );
    }

    if (
      ![
        STATUS.FAILED,
        STATUS.CANCELLED,
        STATUS.CORRECTION_REQUIRED,
        STATUS.EDITORIAL_REVIEW
      ].includes(status)
    ) {
      throw new Error(
        "PHNX Media Engine: worker may not assign publication authority state."
      );
    }

    const { data, error } =
      await client
        .from(TABLES.JOBS)
        .update({
          locked: false,
          locked_at: null,
          locked_by: null,

          job_status: status,

          error_message:
            errorMessage,

          last_error_at:
            errorMessage
              ? nowISO()
              : existing.last_error_at,

          updated_at: nowISO()
        })
        .eq(
          "media_job_id",
          mediaJobId
        )
        .select("*")
        .single();

    if (error) throw error;

    await writeJobEvent({
      media_job_id:
        mediaJobId,

      from_status:
        existing.job_status,

      to_status:
        status,

      event_type:
        errorMessage
          ? "PRODUCTION_JOB_RELEASED_WITH_ERROR"
          : "PRODUCTION_JOB_RELEASED",

      payload: {
        error_message:
          errorMessage
      }
    });

    if (errorMessage) {
      await writeReceipt({
        media_job_id:
          mediaJobId,

        snapshot_id:
          data.snapshot_id,

        athlete_id:
          data.athlete_id,

        receipt_type:
          RECEIPT_TYPES.FAILURE,

        status,

        receipt_payload: {
          stage:
            "PRODUCTION_WORKER",

          error_message:
            errorMessage
        }
      });
    }

    return data;
  }

  /*
  ==========================================================
  DEBUG / INSPECTION
  ==========================================================
  */

  function inspectPublicationAuthority(job = {}) {
    const governance =
      job.input_payload?.governance || {};

    return {
      media_job_id:
        job.media_job_id || null,

      publication_state:
        job.job_status || null,

      candidate:
        job.input_payload?.candidate ||
        null,

      editorial_review:
        job.input_payload
          ?.editorial_review ||
        null,

      fact_review:
        job.input_payload
          ?.fact_review ||
        null,

      rights_review:
        job.input_payload
          ?.rights_review ||
        null,

      governance,

      authority:
        evaluatePublicationAuthority(
          governance,
          governance.disclosure_scope ||
          DISCLOSURE.PUBLIC_MEDIA
        ),

      publication_receipt_id:
        job.publish_payload
          ?.publication_receipt_id ||
        null
    };
  }

  /*
  ==========================================================
  PUBLIC API
  ==========================================================
  */

  window.STATScorePHNXMediaEngine = {
    version: ENGINE_VERSION,

    STATUS,
    DISCLOSURE,
    REVIEW,
    RECEIPT_TYPES,
    EXPOSURE_EVENT_TYPES,

    TABLES,
    JOB_TYPE,
    CHANNEL_KEY,

    /*
      Primary governed inbound path.
    */
    queueGovernedMediaHandoff,

    /*
      Compatibility with prior Stream 2 caller.
      Requires governed handoff payload.
    */
    queueSnapshotMediaPackage,

    registerAssetsFromHandoff,
    createOrUpdateMediaJob,
    selectMusicTrack,

    beginProduction,
    recordRenderOutput,

    completeEditorialReview,
    completeFactReview,
    completeRightsReview,

    schedulePublication,
    createOrQueueYouTubePost,

    markPublished,

    /*
      Legacy method name preserved.
      Now governance-enforced.
    */
    markYouTubePosted,

    /*
      Communication is a Stream 6 handoff.
    */
    buildPublishedNotificationHandoff,
    sendPublishedMultiBoxNotice,

    recordExposureReceipt,

    markCorrectionRequired,
    markPublicationUpdated,
    withdrawPublication,
    archivePublication,

    transitionJob,
    writeJobEvent,
    writeReceipt,

    claimNextJob,
    releaseJob,
    getMediaJob,

    inspectPublicationAuthority,

    _debug: {
      resolveGovernedHandoff,
      validateGovernedHandoff,

      buildAthleteContext,
      buildCandidateContext,
      buildGovernanceContext,

      buildAssetListFromHandoff,

      evaluatePublicationAuthority,
      allowedTransitions
    }
  };

  console.info(
    "[PHNX Media] Governed V1 Engine Loaded:",
    ENGINE_VERSION
  );
})(); 
