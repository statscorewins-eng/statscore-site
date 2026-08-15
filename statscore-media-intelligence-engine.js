/* ============================================================
   STATS-CORE™ / PHNX SPORTS MEDIA
   File: statscore-media-intelligence-engine.js
   Version: STATSCORE-MEDIA-INTELLIGENCE-ENGINE-V2-GOVERNED

   Owner:
   Stream 7 — PHNX Sports Media / Publication Authority

   Constitutional Purpose:
   Governed PHNX Sports editorial/media-publication cognition.

   This engine MAY:
   - assess media-package completeness;
   - assess editorial readiness;
   - organize governed clips;
   - prioritize clips for editorial sequencing;
   - build Highlight Reel sequence recommendations;
   - build Player Card / feature presentation strategy;
   - preserve Media Candidate WHY;
   - consume governed intelligence references;
   - recommend publication-package treatment;
   - produce explainable editorial recommendations.

   This engine DOES NOT:
   - calculate Athletic Score;
   - calculate STATScore;
   - calculate Stars;
   - calculate rankings;
   - calculate academic standing;
   - determine NCAA eligibility;
   - calculate Development Intelligence;
   - determine College Pathway;
   - determine Program Fit;
   - determine Recruiting Interest;
   - establish verification;
   - establish media rights;
   - establish consent;
   - authorize publication;
   - establish official publication state.

   CONTROLLING DOCTRINES:
   Editorial Readiness ≠ Athlete Ability
   Media Quality ≠ Athletic Score
   Candidate ≠ Approved
   Verification ≠ Publication Authority
   Recruiting Visibility ≠ Public Media
   Exposure ≠ Interest ≠ Offer ≠ Commitment
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const ENGINE_VERSION =
    "STATSCORE-MEDIA-INTELLIGENCE-ENGINE-V2-GOVERNED";

  const MediaIntelligenceEngine = {

    version: ENGINE_VERSION,

    CLIP_TYPES: Object.freeze({
      GAME_IMPACT: "GAME_IMPACT",
      ATHLETIC_TRAIT: "ATHLETIC_TRAIT",
      POSITION_SKILL: "POSITION_SKILL",
      PRESSURE_MOMENT: "PRESSURE_MOMENT",
      CONTEXT_PLAY: "CONTEXT_PLAY",
      DEVELOPMENT_CLIP: "DEVELOPMENT_CLIP",
      EVALUATOR_APPROVED: "EVALUATOR_APPROVED",
      ACADEMIC_FEATURE: "ACADEMIC_FEATURE",
      EVENT_FEATURE: "EVENT_FEATURE",
      PROGRAM_FEATURE: "PROGRAM_FEATURE"
    }),

    PACKAGE_TYPES: Object.freeze({
      PLAYER_CARD: "PLAYER_CARD",
      THUMBNAIL: "THUMBNAIL",
      SHORT_REEL: "SHORT_REEL",
      HIGHLIGHT_REEL: "HIGHLIGHT_REEL",
      RECRUITER_CUT: "RECRUITER_CUT",
      EVALUATOR_CUT: "EVALUATOR_CUT",
      DEVELOPMENT_FEATURE: "DEVELOPMENT_FEATURE",
      ACADEMIC_FEATURE: "ACADEMIC_FEATURE",
      EVENT_FEATURE: "EVENT_FEATURE",
      PUBLIC_FEATURE: "PUBLIC_FEATURE"
    }),

    /*
    ============================================================
    EDITORIAL READINESS STATES

    These are NOT official publication states.

    Official publication state belongs to:
    STATScorePHNXMediaEngine

    DRAFT
    IN_PRODUCTION
    EDITORIAL_REVIEW
    FACT_REVIEW
    RIGHTS_REVIEW
    APPROVED
    SCHEDULED
    PUBLISHED
    etc.
    ============================================================
    */
    EDITORIAL_STATES: Object.freeze({
      INCOMPLETE: "INCOMPLETE",
      SOURCE_READY: "SOURCE_READY",
      EDITORIAL_REVIEW_READY: "EDITORIAL_REVIEW_READY",
      FACT_REVIEW_REQUIRED: "FACT_REVIEW_REQUIRED",
      GOVERNANCE_REVIEW_REQUIRED: "GOVERNANCE_REVIEW_REQUIRED",
      PACKAGE_READY: "PACKAGE_READY"
    }),

    DISCLOSURE: Object.freeze({
      PRIVATE: "PRIVATE",
      DEVELOPMENT: "DEVELOPMENT",
      RECRUITING: "RECRUITING",
      PUBLIC_MEDIA: "PUBLIC_MEDIA"
    }),

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    mediaRouting() {
      return window.STATScoreMediaRouting || null;
    },

    /*
      Stream 7 may inspect publication state from the governing
      PHNX Media Engine.

      It does not reproduce publication authority locally.
    */
    publicationEngine() {
      return window.STATScorePHNXMediaEngine || null;
    },

    safe(value, fallback = "") {
      return (
        this.core()?.safe?.(value, fallback) ??
        (value || fallback)
      );
    },

    clean(value) {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    },

    upper(value) {
      return this.clean(value).toUpperCase();
    },

    lower(value) {
      return this.clean(value).toLowerCase();
    },

    isObject(value) {
      return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      );
    },

    clone(value) {
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (_) {
        return value;
      }
    },

    /*
    ============================================================
    GOVERNED INPUT CONTRACT
    ============================================================

    This engine should consume a governed media context.

    Example:

    {
      athlete_id,
      snapshot_id,

      athlete_context: {...},

      candidate: {
        candidate_id,
        candidate_type,
        why,
        source_authority,
        intelligence_reference,
        evidence_references
      },

      assets: [...],

      clips: [...],

      governance: {
        disclosure_scope,
        rights_state,
        consent_state,
        guardian_authorization_state,
        public_disclosure_authorized
      },

      governed_intelligence: {
        athletic: {...},
        academic: {...},
        development: {...},
        pathway: {...},
        ranking: {...},
        eligibility: {...}
      },

      publication: {...}
    }

    Governed intelligence values are DISPLAY / EDITORIAL INPUTS.

    They are never calculated here.
    ============================================================
    */

    normalizeContext(snapshot = {}, context = {}) {
      const candidate =
        context.candidate ||
        context.media_candidate ||
        {};

      const governance =
        context.governance ||
        {};

      const governedIntelligence =
        context.governed_intelligence ||
        context.intelligence_refs ||
        {};

      return {
        athlete_id:
          snapshot.athlete_id ||
          context.athlete_id ||
          null,

        snapshot_id:
          snapshot.snapshot_id ||
          context.snapshot_id ||
          null,

        athlete_display_name:
          snapshot.athlete_display_name ||
          context.athlete_display_name ||
          "Athlete",

        sport:
          snapshot.sport ||
          snapshot.primary_sport ||
          context.sport ||
          null,

        position:
          snapshot.position ||
          snapshot.primary_position ||
          context.position ||
          null,

        graduation_class:
          snapshot.graduation_class ||
          context.graduation_class ||
          null,

        headshot:
          snapshot.headshot_public_url ||
          snapshot.headshot_url ||
          context.headshot_url ||
          null,

        highlight_url:
          snapshot.highlight_url ||
          context.highlight_url ||
          null,

        game_film_url:
          snapshot.game_film_url ||
          context.game_film_url ||
          null,

        candidate: {
          candidate_id:
            candidate.candidate_id || null,

          candidate_type:
            this.upper(
              candidate.candidate_type ||
              "ATHLETE_MEDIA"
            ),

          why:
            candidate.why || null,

          source_authority:
            candidate.source_authority || null,

          intelligence_reference:
            candidate.intelligence_reference || null,

          evidence_references:
            Array.isArray(candidate.evidence_references)
              ? candidate.evidence_references
              : []
        },

        governance: {
          disclosure_scope:
            this.upper(
              governance.disclosure_scope ||
              this.DISCLOSURE.PRIVATE
            ),

          rights_state:
            this.upper(
              governance.rights_state ||
              "UNKNOWN"
            ),

          consent_state:
            this.upper(
              governance.consent_state ||
              "UNKNOWN"
            ),

          guardian_authorization_state:
            this.upper(
              governance.guardian_authorization_state ||
              "UNKNOWN"
            ),

          minor_status:
            this.upper(
              governance.minor_status ||
              "UNKNOWN"
            ),

          public_disclosure_authorized:
            governance.public_disclosure_authorized === true
        },

        governed_intelligence:
          this.clone(governedIntelligence),

        assets:
          Array.isArray(context.assets)
            ? context.assets
            : [],

        clips:
          Array.isArray(context.clips)
            ? context.clips
            : [],

        evaluator_approved_clips:
          Array.isArray(context.evaluator_approved_clips)
            ? context.evaluator_approved_clips
            : [],

        clip_notes:
          Array.isArray(context.clip_notes)
            ? context.clip_notes
            : [],

        brand_assets_ready:
          context.brand_assets_ready === true,

        publication:
          context.publication || null
      };
    },

    hasFilm(mediaContext = {}) {
      return Boolean(
        mediaContext.highlight_url ||
        mediaContext.game_film_url ||
        mediaContext.assets.some(asset =>
          [
            "highlight_url",
            "highlight_file",
            "highlight_film",
            "game_film_url",
            "game_film_file",
            "game_film"
          ].includes(
            this.lower(asset.asset_type)
          )
        )
      );
    },

    hasIdentity(mediaContext = {}) {
      return Boolean(
        mediaContext.athlete_id &&
        mediaContext.snapshot_id &&
        mediaContext.athlete_display_name
      );
    },

    hasCandidate(mediaContext = {}) {
      return Boolean(
        mediaContext.candidate?.candidate_id &&
        mediaContext.candidate?.why &&
        mediaContext.candidate?.source_authority
      );
    },

    /*
    ============================================================
    EDITORIAL MEDIA READINESS INDEX
    ============================================================

    Internal Stream 7 production metric only.

    It SHALL NOT be:
    - published as athlete ability;
    - interpreted as STATScore;
    - used as ranking intelligence;
    - used as recruiting readiness;
    - used as pathway intelligence.

    It answers only:
    "How complete is the media package for editorial work?"
    ============================================================
    */

    evaluateEditorialReadiness(snapshot, context = {}) {
      const media =
        this.normalizeContext(snapshot, context);

      let index = 0;

      const strengths = [];
      const gaps = [];

      if (media.headshot) {
        index += 15;
        strengths.push(
          "governed athlete image available"
        );
      } else {
        gaps.push(
          "governed athlete image unavailable"
        );
      }

      if (media.highlight_url) {
        index += 15;
        strengths.push(
          "highlight source available"
        );
      } else {
        gaps.push(
          "highlight source unavailable"
        );
      }

      if (media.game_film_url) {
        index += 20;
        strengths.push(
          "game-film source available"
        );
      } else {
        gaps.push(
          "game-film source unavailable"
        );
      }

      if (
        media.evaluator_approved_clips.length
      ) {
        index += 15;

        strengths.push(
          "governed evaluator clip references available"
        );
      } else {
        gaps.push(
          "no evaluator-approved clip references supplied"
        );
      }

      if (media.clip_notes.length) {
        index += 10;

        strengths.push(
          "editorial clip notes available"
        );
      }

      if (media.brand_assets_ready) {
        index += 10;

        strengths.push(
          "PHNX brand assets ready"
        );
      } else {
        gaps.push(
          "PHNX brand assets not confirmed"
        );
      }

      if (this.hasCandidate(media)) {
        index += 15;

        strengths.push(
          "governed Media Candidate + WHY available"
        );
      } else {
        gaps.push(
          "governed Media Candidate contract incomplete"
        );
      }

      index =
        Math.max(
          0,
          Math.min(
            100,
            Math.round(index)
          )
        );

      return {
        editorial_readiness_index: index,

        /*
          Explicitly prevent semantic collision with
          athlete scoring.
        */
        metric_class:
          "STREAM_7_EDITORIAL_MEDIA_READINESS",

        athlete_score: false,

        readiness_label:
          index >= 85
            ? "Editorial Package Strong"
            : index >= 70
              ? "Editorial Review Ready"
              : index >= 50
                ? "Package Building"
                : "Media Package Incomplete",

        strengths,
        gaps,

        doctrine: {
          editorial_readiness_is_not_athletic_ability: true,
          editorial_readiness_is_not_statscore: true,
          editorial_readiness_is_not_recruiting_readiness: true
        }
      };
    },

    /*
      Backward-compatible method name.

      Existing consumers may still call evaluateMediaQuality().

      The returned object preserves `score` and `quality_label`
      aliases temporarily, but explicitly classifies them as
      editorial-only compatibility fields.
    */
    evaluateMediaQuality(snapshot, context = {}) {
      const readiness =
        this.evaluateEditorialReadiness(
          snapshot,
          context
        );

      return {
        ...readiness,

        score:
          readiness.editorial_readiness_index,

        quality_label:
          readiness.readiness_label,

        compatibility_notice:
          "score is an editorial readiness compatibility alias; " +
          "it is NOT athlete intelligence."
      };
    },

    /*
    ============================================================
    CLIP PRIORITY
    ============================================================

    Editorial sequencing priority only.

    priority_score SHALL NOT be treated as athlete performance
    or evaluation scoring.
    ============================================================
    */

    prioritizeClips(snapshot, clips = []) {
      if (
        !Array.isArray(clips) ||
        !clips.length
      ) {
        return [];
      }

      const weights = {
        EVALUATOR_APPROVED: 100,
        GAME_IMPACT: 90,
        PRESSURE_MOMENT: 84,
        POSITION_SKILL: 78,
        ATHLETIC_TRAIT: 74,
        CONTEXT_PLAY: 66,
        DEVELOPMENT_CLIP: 55,
        ACADEMIC_FEATURE: 55,
        EVENT_FEATURE: 55,
        PROGRAM_FEATURE: 55
      };

      return clips
        .map(clip => {
          const type =
            this.upper(
              clip.clip_type
            );

          /*
            These flags must already be governed attributes.
            This engine does not verify them.
          */
          const evaluatorBoost =
            clip.evaluator_approved === true
              ? 18
              : 0;

          const verificationBoost =
            clip.verified_competition === true
              ? 10
              : 0;

          const qualityPenalty =
            clip.low_quality === true
              ? -15
              : 0;

          return {
            ...clip,

            editorial_priority_score:
              (weights[type] || 50) +
              evaluatorBoost +
              verificationBoost +
              qualityPenalty,

            metric_class:
              "STREAM_7_EDITORIAL_SEQUENCE_PRIORITY",

            athlete_score: false
          };
        })
        .sort(
          (a, b) =>
            b.editorial_priority_score -
            a.editorial_priority_score
        );
    },

    /*
    ============================================================
    HIGHLIGHT SEQUENCE
    ============================================================
    */

    buildHighlightSequence(snapshot, clips = []) {
      const prioritized =
        this.prioritizeClips(
          snapshot,
          clips
        );

      if (!prioritized.length) {
        return {
          ready: false,
          sequence: [],
          reason:
            "No governed clips supplied for editorial sequencing."
        };
      }

      const opener =
        prioritized.find(
          clip =>
            this.upper(clip.clip_type) ===
            this.CLIP_TYPES.GAME_IMPACT
        ) ||
        prioritized[0];

      const candidatesForMiddle =
        prioritized.filter(
          clip => clip !== opener
        );

      const closerCandidate =
        candidatesForMiddle.find(
          clip =>
            this.upper(clip.clip_type) ===
            this.CLIP_TYPES.PRESSURE_MOMENT
        );

      const middle =
        candidatesForMiddle
          .filter(
            clip =>
              clip !== closerCandidate
          )
          .slice(0, 5);

      const closer =
        closerCandidate ||
        middle[middle.length - 1] ||
        opener;

      const sequence = [
        {
          segment:
            "PHNX SPORTS INTRO",

          purpose:
            "PHNX brand presentation"
        },

        {
          segment:
            "ATHLETE IDENTITY CARD",

          purpose:
            `${
              this.safe(
                snapshot?.athlete_display_name,
                "Athlete"
              )
            } governed identity presentation`
        },

        {
          segment:
            "OPENING EDITORIAL CLIP",

          clip: opener,

          purpose:
            "Lead with highest-priority governed editorial selection"
        },

        ...middle.map(
          (clip, index) => ({
            segment:
              `SEQUENCE CLIP ${index + 1}`,

            clip,

            purpose:
              "Build governed editorial narrative"
          })
        ),

        {
          segment:
            "CLOSING EDITORIAL CLIP",

          clip: closer,

          purpose:
            "Close with strong governed editorial selection"
        },

        {
          segment:
            "PHNX SPORTS CLOSE",

          purpose:
            "Controlled PHNX publication close"
        }
      ];

      return {
        ready: true,

        sequence,

        clip_count:
          prioritized.length,

        primary_clip:
          opener,

        doctrine: {
          sequence_is_editorial_not_scoring:
            true
        }
      };
    },

    /*
    ============================================================
    EDITORIAL STATE

    This does NOT determine official PHNX publication state.
    ============================================================
    */

    determineEditorialState(
      snapshot,
      context = {}
    ) {
      const media =
        this.normalizeContext(
          snapshot,
          context
        );

      const readiness =
        this.evaluateEditorialReadiness(
          snapshot,
          context
        );

      if (!this.hasIdentity(media)) {
        return {
          state:
            this.EDITORIAL_STATES.INCOMPLETE,

          reason:
            "Governed athlete/snapshot identity is incomplete."
        };
      }

      if (!this.hasCandidate(media)) {
        return {
          state:
            this.EDITORIAL_STATES.INCOMPLETE,

          reason:
            "Governed Media Candidate + WHY are required before editorial manufacture."
        };
      }

      if (!this.hasFilm(media)) {
        return {
          state:
            this.EDITORIAL_STATES.SOURCE_READY,

          reason:
            "Candidate exists, but no governed film source is presently available."
        };
      }

      if (
        readiness.editorial_readiness_index <
        50
      ) {
        return {
          state:
            this.EDITORIAL_STATES.SOURCE_READY,

          reason:
            "Media sources exist but the editorial package requires additional preparation."
        };
      }

      if (
        media.governance.rights_state !==
        "APPROVED" ||
        media.governance.consent_state !==
        "APPROVED"
      ) {
        return {
          state:
            this.EDITORIAL_STATES.GOVERNANCE_REVIEW_REQUIRED,

          reason:
            "Editorial work may continue where authorized, but rights/consent authority is not established for publication."
        };
      }

      if (
        readiness.editorial_readiness_index <
        70
      ) {
        return {
          state:
            this.EDITORIAL_STATES.EDITORIAL_REVIEW_READY,

          reason:
            "Media package is available for editorial review and refinement."
        };
      }

      return {
        state:
          this.EDITORIAL_STATES.PACKAGE_READY,

        reason:
          "Media package is editorially prepared for the governed PHNX publication workflow.",

        /*
          Explicit constitutional guard:
        */
        publication_authorized: false,

        publication_state_source:
          "STATScorePHNXMediaEngine"
      };
    },

    /*
      Backward-compatible name.

      Important:
      This now returns EDITORIAL state, NOT official release
      or publication authority.
    */
    determineReleaseState(
      snapshot,
      context = {}
    ) {
      const result =
        this.determineEditorialState(
          snapshot,
          context
        );

      return {
        ...result,

        compatibility_notice:
          "Release state is editorial readiness only. " +
          "Official publication state belongs to " +
          "STATScorePHNXMediaEngine."
      };
    },

    /*
    ============================================================
    GOVERNED INTELLIGENCE CONSUMPTION
    ============================================================

    This engine consumes pre-resolved intelligence references.

    It SHALL NOT call scoring, pathway, recommendation, ranking,
    eligibility, or Development engines to create new intelligence.
    ============================================================
    */

    getGovernedIntelligence(
      context = {},
      domain
    ) {
      const governed =
        context.governed_intelligence ||
        context.intelligence_refs ||
        {};

      return (
        governed[domain] ||
        null
      );
    },

    buildGovernedEmphasis(
      mediaContext = {}
    ) {
      const governed =
        mediaContext.governed_intelligence ||
        {};

      const emphasis = [];

      /*
        ATHLETIC
        Consume only already-authorized publication-safe state.
      */
      const athletic =
        governed.athletic || null;

      if (
        athletic?.publication_safe === true &&
        athletic?.summary
      ) {
        emphasis.push({
          domain: "ATHLETIC",
          statement:
            athletic.summary,
          authority:
            athletic.authority ||
            "STREAM_9",
          intelligence_reference:
            athletic.intelligence_reference ||
            null
        });
      }

      /*
        DEVELOPMENT
      */
      const development =
        governed.development || null;

      if (
        development?.publication_safe === true &&
        development?.verified_improvement === true
      ) {
        emphasis.push({
          domain: "DEVELOPMENT",
          statement:
            development.summary ||
            "Verified athlete development milestone.",

          authority:
            development.authority ||
            "STREAM_9",

          intelligence_reference:
            development.intelligence_reference ||
            null,

          receipt_id:
            development.receipt_id ||
            null
        });
      }

      /*
        ACADEMIC
      */
      const academic =
        governed.academic || null;

      if (
        academic?.publication_safe === true &&
        academic?.summary
      ) {
        emphasis.push({
          domain: "ACADEMIC",
          statement:
            academic.summary,

          authority:
            academic.authority ||
            "STREAM_9",

          intelligence_reference:
            academic.intelligence_reference ||
            null
        });
      }

      /*
        PATHWAY

        Private Program Match or recruiting intelligence may NOT
        be transformed into public media.

        Only explicitly publication-safe pathway context may be
        consumed.
      */
      const pathway =
        governed.pathway || null;

      if (
        pathway?.publication_safe === true &&
        pathway?.summary
      ) {
        emphasis.push({
          domain: "PATHWAY",
          statement:
            pathway.summary,

          authority:
            pathway.authority ||
            "STREAM_9",

          intelligence_reference:
            pathway.intelligence_reference ||
            null
        });
      }

      return emphasis;
    },

    /*
    ============================================================
    PACKAGE STRATEGY
    ============================================================
    */

    determinePackageType(media = {}) {
      const candidateType =
        this.upper(
          media.candidate?.candidate_type
        );

      const disclosureScope =
        media.governance?.disclosure_scope ||
        this.DISCLOSURE.PRIVATE;

      if (
        candidateType.includes(
          "DEVELOPMENT"
        )
      ) {
        return this.PACKAGE_TYPES
          .DEVELOPMENT_FEATURE;
      }

      if (
        candidateType.includes(
          "ACADEMIC"
        )
      ) {
        return this.PACKAGE_TYPES
          .ACADEMIC_FEATURE;
      }

      if (
        candidateType.includes(
          "EVENT"
        ) ||
        candidateType.includes(
          "CAMP"
        ) ||
        candidateType.includes(
          "COMBINE"
        )
      ) {
        return this.PACKAGE_TYPES
          .EVENT_FEATURE;
      }

      if (
        disclosureScope ===
        this.DISCLOSURE.RECRUITING
      ) {
        return this.PACKAGE_TYPES
          .RECRUITER_CUT;
      }

      if (
        disclosureScope ===
        this.DISCLOSURE.PUBLIC_MEDIA
      ) {
        return this.PACKAGE_TYPES
          .PUBLIC_FEATURE;
      }

      return this.PACKAGE_TYPES
        .HIGHLIGHT_REEL;
    },

    buildPresentationStrategy(
      snapshot,
      context = {}
    ) {
      const media =
        this.normalizeContext(
          snapshot,
          context
        );

      const readiness =
        this.evaluateEditorialReadiness(
          snapshot,
          context
        );

      const editorial =
        this.determineEditorialState(
          snapshot,
          context
        );

      const emphasis =
        this.buildGovernedEmphasis(
          media
        );

      if (!emphasis.length) {
        emphasis.push({
          domain: "EDITORIAL",
          statement:
            "Focus on governed athlete identity, verified media context where supplied, development, and controlled exposure.",

          authority:
            "STREAM_7_EDITORIAL",

          intelligence_reference:
            null
        });
      }

      const packageType =
        this.determinePackageType(
          media
        );

      return {
        package_type:
          packageType,

        visual_direction:
          "PHNX SPORTS black/red/silver broadcast identity",

        opening_strategy:
          "Governed athlete identity + highest-priority approved editorial moment",

        emphasis,

        editorial_state:
          editorial,

        editorial_readiness:
          readiness,

        candidate: {
          candidate_id:
            media.candidate
              ?.candidate_id ||
            null,

          candidate_type:
            media.candidate
              ?.candidate_type ||
            null,

          why:
            media.candidate
              ?.why ||
            null,

          source_authority:
            media.candidate
              ?.source_authority ||
            null
        },

        disclosure_scope:
          media.governance
            ?.disclosure_scope ||
          this.DISCLOSURE.PRIVATE,

        title_angle:
          `${
            this.safe(
              media.athlete_display_name,
              "Athlete"
            )
          } | ${
            this.safe(
              media.position,
              "Position"
            )
          } | ${
            this.safe(
              media.sport,
              "Sport"
            )
          } PHNX Feature`,

        /*
          Explicitly not publication approval.
        */
        publication_authorized:
          false,

        publication_authority:
          "STATScorePHNXMediaEngine",

        notes:
          "Presentation strategy generated from governed PHNX media candidate and publication-safe intelligence references."
      };
    },

    /*
    ============================================================
    MEDIA INTELLIGENCE REPORT

    The term "Media Intelligence" here means:
    editorial/media-publication cognition.

    It does NOT mean athlete intelligence authority.
    ============================================================
    */

    buildMediaIntelligenceReport(
      snapshot,
      context = {}
    ) {
      if (!snapshot) {
        return {
          ok: false,
          status: "NO_SNAPSHOT",
          message:
            "No governed athlete snapshot context loaded."
        };
      }

      const media =
        this.normalizeContext(
          snapshot,
          context
        );

      const readiness =
        this.evaluateEditorialReadiness(
          snapshot,
          context
        );

      const sequence =
        this.buildHighlightSequence(
          snapshot,
          media.clips
        );

      const editorial =
        this.determineEditorialState(
          snapshot,
          context
        );

      const strategy =
        this.buildPresentationStrategy(
          snapshot,
          context
        );

      /*
        Routing engine may produce a routing PACKAGE or routing
        recommendation.

        It must not create publication authority.
      */
      const routingPackage =
        this.mediaRouting()
          ?.buildMediaPackage?.(
            snapshot,
            {
              ...context,
              governed_media_context:
                media
            }
          ) ||
        null;

      const recommendedActions = [];

      readiness.gaps.forEach(
        gap => {
          recommendedActions.push({
            action_type:
              "MEDIA_PACKAGE_GAP",

            action:
              `Resolve media gap: ${gap}`,

            authority:
              "STREAM_7_EDITORIAL",

            outcome_required:
              true
          });
        }
      );

      if (
        editorial.state ===
        this.EDITORIAL_STATES
          .GOVERNANCE_REVIEW_REQUIRED
      ) {
        recommendedActions.push({
          action_type:
            "GOVERNANCE_REVIEW",

          action:
            "Obtain governed rights/consent/disclosure determination before publication.",

          authority:
            "GOVERNING_RIGHTS_CONSENT_AUTHORITY",

          outcome_required:
            true
        });
      }

      if (
        editorial.state ===
        this.EDITORIAL_STATES
          .PACKAGE_READY
      ) {
        recommendedActions.push({
          action_type:
            "PHNX_PUBLICATION_WORKFLOW",

          action:
            "Submit package into the governed PHNX editorial/fact/rights review lifecycle.",

          authority:
            "STREAM_7_PHNX_PUBLICATION",

          outcome_required:
            true
        });
      }

      return {
        ok: true,

        engine_version:
          this.version,

        authority_class:
          "STREAM_7_MEDIA_PUBLICATION_COGNITION",

        athlete_id:
          media.athlete_id,

        snapshot_id:
          media.snapshot_id,

        athlete_display_name:
          media.athlete_display_name,

        candidate:
          media.candidate,

        governance:
          media.governance,

        editorial_readiness:
          readiness,

        /*
          Backward compatibility only.
          Do not interpret as athlete scoring.
        */
        media_quality:
          {
            ...readiness,
            score:
              readiness
                .editorial_readiness_index,

            quality_label:
              readiness
                .readiness_label
          },

        highlight_sequence:
          sequence,

        editorial_state:
          editorial,

        /*
          Backward compatibility alias.
        */
        release_state: {
          ...editorial,

          compatibility_notice:
            "Editorial readiness only; not official publication state."
        },

        presentation_strategy:
          strategy,

        routing_package:
          routingPackage,

        governed_intelligence_refs:
          media.governed_intelligence,

        recommended_actions:
          recommendedActions,

        generated_at:
          this.nowISO(),

        /*
          "locked" means report object should not be casually
          mutated by presentation code.

          It does NOT mean authoritative athlete intelligence.
        */
        locked: true,

        doctrine: {
          candidate_is_not_approved:
            true,

          editorial_readiness_is_not_athletic_ability:
            true,

          verification_is_not_publication_authority:
            true,

          recruiting_visibility_is_not_public_media:
            true,

          exposure_is_not_interest:
            true,

          engagement_is_not_recruiting_outcome:
            true
        }
      };
    },

    /*
    ============================================================
    PRESENTATION
    ============================================================
    */

    escapeHTML(value) {
      return String(
        value ?? ""
      )
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        )
        .replaceAll(
          '"',
          "&quot;"
        )
        .replaceAll(
          "'",
          "&#039;"
        );
    },

    renderMediaIntelligencePanel(
      targetId,
      snapshot,
      context = {}
    ) {
      const el =
        document.getElementById(
          targetId
        );

      if (!el) return;

      const report =
        this.buildMediaIntelligenceReport(
          snapshot,
          context
        );

      if (!report.ok) {
        el.textContent =
          report.message;
        return;
      }

      const actions =
        report.recommended_actions
          .map(
            item =>
              `<li>${this.escapeHTML(item.action)}</li>`
          )
          .join("");

      el.innerHTML = `
        <div class="media-intel-kicker">
          PHNX SPORTS • Governed Media Publication
        </div>

        <h2>
          ${this.escapeHTML(report.editorial_state.state)}
        </h2>

        <p>
          ${this.escapeHTML(report.editorial_state.reason)}
        </p>

        <div class="media-intel-grid">
          <div>
            <b>Editorial Readiness</b>
            <span>
              ${this.escapeHTML(
                report.editorial_readiness.readiness_label
              )}
            </span>
          </div>

          <div>
            <b>Readiness Index</b>
            <span>
              ${this.escapeHTML(
                report.editorial_readiness
                  .editorial_readiness_index
              )}
            </span>
          </div>

          <div>
            <b>Package</b>
            <span>
              ${this.escapeHTML(
                report.presentation_strategy.package_type
              )}
            </span>
          </div>

          <div>
            <b>Sequence</b>
            <span>
              ${
                report.highlight_sequence.ready
                  ? "Ready"
                  : "Pending"
              }
            </span>
          </div>
        </div>

        <strong>Candidate WHY</strong>
        <p>
          ${this.escapeHTML(
            report.candidate?.why ||
            "No governed candidate explanation supplied."
          )}
        </p>

        <strong>Recommended Media Actions</strong>

        <ul>
          ${actions}
        </ul>

        <small>
          Editorial Readiness is a Stream 7 media-production
          measure. It is not Athletic Score, STATScore,
          recruiting readiness, ranking, or athlete ability.
        </small>
      `;
    },

    explain(report) {
      if (!report?.ok) {
        return (
          "No governed PHNX media publication cognition report available."
        );
      }

      return [
        `Editorial: ${
          report.editorial_state.state
        }`,

        `Readiness: ${
          report.editorial_readiness
            .readiness_label
        }`,

        `Package: ${
          report.presentation_strategy
            .package_type
        }`,

        `Sequence: ${
          report.highlight_sequence.ready
            ? "Ready"
            : "Pending"
        }`,

        `WHY: ${
          report.candidate?.why ||
          "Not supplied"
        }`
      ].join(" | ");
    }

  };

  /*
  ============================================================
  PUBLIC AUTHORITY REGISTRATION
  ============================================================
  */

  window.STATScore.MediaIntelligenceEngine =
    MediaIntelligenceEngine;

  /*
    Optional clearer alias for subsequent manufacturing.

    Existing consumers do NOT need to change immediately.
  */
  window.STATScore.MediaPublicationIntelligenceEngine =
    MediaIntelligenceEngine;

  console.info(
    "[STATScore] Governed Media Publication Intelligence Engine Loaded:",
    MediaIntelligenceEngine.version
  );

})(); 
