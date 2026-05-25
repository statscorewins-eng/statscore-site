/* ============================================================
   STATScore™ Media Intelligence Engine
   File: statscore-media-intelligence-engine.js
   Version: STATSCORE-MEDIA-INTELLIGENCE-ENGINE-V1
   Purpose:
   PHNX SPORTS media cognition layer for film intelligence,
   clip priority, player-card strategy, thumbnail planning,
   highlight sequencing, YouTube readiness, exposure timing,
   and branded athlete presentation.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const MediaIntelligenceEngine = {

    version: "STATSCORE-MEDIA-INTELLIGENCE-ENGINE-V1",

    CLIP_TYPES: {
      GAME_IMPACT: "GAME_IMPACT",
      ATHLETIC_TRAIT: "ATHLETIC_TRAIT",
      POSITION_SKILL: "POSITION_SKILL",
      PRESSURE_MOMENT: "PRESSURE_MOMENT",
      CONTEXT_PLAY: "CONTEXT_PLAY",
      DEVELOPMENT_CLIP: "DEVELOPMENT_CLIP",
      EVALUATOR_APPROVED: "EVALUATOR_APPROVED"
    },

    PACKAGE_TYPES: {
      PLAYER_CARD: "PLAYER_CARD",
      THUMBNAIL: "THUMBNAIL",
      SHORT_REEL: "SHORT_REEL",
      HIGHLIGHT_REEL: "HIGHLIGHT_REEL",
      RECRUITER_CUT: "RECRUITER_CUT",
      EVALUATOR_CUT: "EVALUATOR_CUT",
      PUBLIC_FEATURE: "PUBLIC_FEATURE"
    },

    RELEASE_STATES: {
      BLOCKED: "BLOCKED",
      HOLD: "HOLD",
      INTERNAL_REVIEW: "INTERNAL_REVIEW",
      READY_FOR_APPROVAL: "READY_FOR_APPROVAL",
      READY_TO_PUBLISH: "READY_TO_PUBLISH",
      PUBLISHED: "PUBLISHED"
    },

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    mediaRouting() {
      return window.STATScoreMediaRouting || null;
    },

    scoring() {
      return window.STATScoreScoringEngine || null;
    },

    pathway() {
      return window.STATScore?.PathwayEngine || null;
    },

    profile() {
      return window.STATScore?.ProfileEngine || null;
    },

    recommendation() {
      return window.STATScore?.RecommendationEngine || null;
    },

    safe(value, fallback = "") {
      return this.core()?.safe?.(value, fallback) ?? (value || fallback);
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    hasFilm(snapshot) {
      return !!(snapshot?.highlight_url || snapshot?.game_film_url);
    },

    hasIdentity(snapshot) {
      return !!(
        snapshot?.athlete_display_name &&
        snapshot?.sport &&
        snapshot?.position &&
        snapshot?.graduation_class
      );
    },

    evaluateMediaQuality(snapshot, context = {}) {
      let score = 0;
      const strengths = [];
      const gaps = [];

      if (snapshot?.headshot_public_url) {
        score += 18;
        strengths.push("official athlete image available");
      } else {
        gaps.push("official athlete image missing");
      }

      if (snapshot?.highlight_url) {
        score += 22;
        strengths.push("highlight reel available");
      } else {
        gaps.push("highlight reel missing");
      }

      if (snapshot?.game_film_url) {
        score += 28;
        strengths.push("game film available");
      } else {
        gaps.push("full-game film missing");
      }

      if (context.evaluator_approved_clips?.length) {
        score += 18;
        strengths.push("evaluator-approved clips present");
      } else {
        gaps.push("evaluator-approved clips not yet selected");
      }

      if (context.clip_notes?.length) {
        score += 8;
        strengths.push("clip notes available");
      }

      if (context.brand_assets_ready) {
        score += 6;
        strengths.push("PHNX brand assets ready");
      } else {
        gaps.push("PHNX brand asset confirmation pending");
      }

      score = Math.max(0, Math.min(100, Math.round(score)));

      return {
        score,
        quality_label:
          score >= 85 ? "Broadcast Ready" :
          score >= 70 ? "Review Ready" :
          score >= 50 ? "Package Building" :
          "Media Incomplete",
        strengths,
        gaps
      };
    },

    prioritizeClips(snapshot, clips = []) {
      if (!Array.isArray(clips) || !clips.length) {
        return [];
      }

      const weights = {
        EVALUATOR_APPROVED: 100,
        GAME_IMPACT: 90,
        PRESSURE_MOMENT: 84,
        POSITION_SKILL: 78,
        ATHLETIC_TRAIT: 74,
        CONTEXT_PLAY: 66,
        DEVELOPMENT_CLIP: 55
      };

      return clips
        .map((clip) => {
          const type = String(clip.clip_type || "").toUpperCase();
          const evaluatorBoost = clip.evaluator_approved ? 18 : 0;
          const competitionBoost = clip.verified_competition ? 10 : 0;
          const qualityPenalty = clip.low_quality ? -15 : 0;

          return {
            ...clip,
            priority_score:
              (weights[type] || 50) +
              evaluatorBoost +
              competitionBoost +
              qualityPenalty
          };
        })
        .sort((a, b) => b.priority_score - a.priority_score);
    },

    buildHighlightSequence(snapshot, clips = []) {
      const prioritized = this.prioritizeClips(snapshot, clips);

      if (!prioritized.length) {
        return {
          ready: false,
          sequence: [],
          reason: "No clips supplied for sequencing."
        };
      }

      const opener =
        prioritized.find(c => c.clip_type === this.CLIP_TYPES.GAME_IMPACT) ||
        prioritized[0];

      const middle = prioritized
        .filter(c => c !== opener)
        .slice(0, 5);

      const closer =
        prioritized.find(c => c.clip_type === this.CLIP_TYPES.PRESSURE_MOMENT) ||
        middle[middle.length - 1] ||
        opener;

      const sequence = [
        {
          segment: "PHNX SPORTS INTRO",
          purpose: "Brand authority opening"
        },
        {
          segment: "ATHLETE IDENTITY CARD",
          purpose: `${this.safe(snapshot?.athlete_display_name, "Athlete")} identity presentation`
        },
        {
          segment: "OPENING IMPACT CLIP",
          clip: opener,
          purpose: "Lead with strongest verified impact"
        },
        ...middle.map((clip, index) => ({
          segment: `SEQUENCE CLIP ${index + 1}`,
          clip,
          purpose: "Build trait and position evidence"
        })),
        {
          segment: "CLOSING AUTHORITY CLIP",
          clip: closer,
          purpose: "Close with high-confidence action"
        },
        {
          segment: "PHNX SPORTS CLOSE",
          purpose: "Controlled athlete visibility close"
        }
      ];

      return {
        ready: true,
        sequence,
        clip_count: prioritized.length,
        primary_clip: opener
      };
    },

    determineReleaseState(snapshot, context = {}) {
      const quality = this.evaluateMediaQuality(snapshot, context);
      const routing = this.mediaRouting()?.mediaReadiness?.(snapshot);
      const scoring = this.scoring()?.explainScore?.(snapshot);
      const verified = this.lower(snapshot?.verification_status) === "verified";

      if (!this.hasIdentity(snapshot)) {
        return {
          state: this.RELEASE_STATES.BLOCKED,
          reason: "Athlete identity incomplete."
        };
      }

      if (!this.hasFilm(snapshot)) {
        return {
          state: this.RELEASE_STATES.HOLD,
          reason: "Film evidence required before media release."
        };
      }

      if (!verified) {
        return {
          state: this.RELEASE_STATES.INTERNAL_REVIEW,
          reason: "Verification incomplete. Media can be prepared but not released."
        };
      }

      if (quality.score < 70) {
        return {
          state: this.RELEASE_STATES.INTERNAL_REVIEW,
          reason: "Media quality requires PHNX review before approval."
        };
      }

      if (routing?.youtube_ready && scoring?.ok && scoring.final_score >= 70) {
        return {
          state: this.RELEASE_STATES.READY_FOR_APPROVAL,
          reason: "Media package is ready for approval and YouTube preparation."
        };
      }

      return {
        state: this.RELEASE_STATES.HOLD,
        reason: "Media package requires additional review before release."
      };
    },

    buildPresentationStrategy(snapshot, context = {}) {
      const score = this.scoring()?.explainScore?.(snapshot);
      const pathway = this.pathway()?.buildPathwayReport?.(snapshot);
      const quality = this.evaluateMediaQuality(snapshot, context);
      const release = this.determineReleaseState(snapshot, context);

      const emphasis = [];

      if (score?.ok && score.final_score >= 85) {
        emphasis.push("lead with verified athlete signal");
      }

      if (pathway?.ok) {
        emphasis.push(`frame around ${pathway.current_best_fit.label} pathway`);
      }

      if (quality.score < 70) {
        emphasis.push("prioritize clean visuals and evaluator-confirmed moments");
      }

      if (!emphasis.length) {
        emphasis.push("focus on identity, development, and controlled exposure");
      }

      return {
        package_type:
          release.state === this.RELEASE_STATES.READY_FOR_APPROVAL
            ? this.PACKAGE_TYPES.PUBLIC_FEATURE
            : this.PACKAGE_TYPES.RECRUITER_CUT,

        visual_direction: "PHNX SPORTS black/red/silver broadcast identity",

        opening_strategy: "Athlete identity + strongest verified moment first",

        emphasis,

        release_state: release,

        title_angle:
          `${this.safe(snapshot?.athlete_display_name, "Athlete")} | ${this.safe(snapshot?.position, "Position")} | ${this.safe(snapshot?.sport, "Sport")} Feature`,

        notes:
          "Presentation strategy generated by STATScore Media Intelligence Engine."
      };
    },

    buildMediaIntelligenceReport(snapshot, context = {}) {
      if (!snapshot) {
        return {
          ok: false,
          status: "NO_SNAPSHOT",
          message: "No athlete snapshot loaded."
        };
      }

      const quality = this.evaluateMediaQuality(snapshot, context);
      const sequence = this.buildHighlightSequence(snapshot, context.clips || []);
      const release = this.determineReleaseState(snapshot, context);
      const strategy = this.buildPresentationStrategy(snapshot, context);
      const routingPackage = this.mediaRouting()?.buildMediaPackage?.(snapshot);

      return {
        ok: true,
        engine_version: this.version,

        athlete_id: snapshot.athlete_id || null,
        snapshot_id: snapshot.snapshot_id || null,
        athlete_display_name: snapshot.athlete_display_name || "Athlete",

        media_quality: quality,
        highlight_sequence: sequence,
        release_state: release,
        presentation_strategy: strategy,
        routing_package: routingPackage,

        recommended_actions: [
          ...quality.gaps.map(gap => `Resolve media gap: ${gap}`),
          release.state === this.RELEASE_STATES.INTERNAL_REVIEW
            ? "Complete PHNX Sports internal media review."
            : "",
          release.state === this.RELEASE_STATES.READY_FOR_APPROVAL
            ? "Submit package for final approval before publishing."
            : ""
        ].filter(Boolean),

        generated_at: this.nowISO(),
        locked: true
      };
    },

    renderMediaIntelligencePanel(targetId, snapshot, context = {}) {
      const el = document.getElementById(targetId);
      if (!el) return;

      const report = this.buildMediaIntelligenceReport(snapshot, context);

      if (!report.ok) {
        el.innerHTML = `<p>${report.message}</p>`;
        return;
      }

      el.innerHTML = `
        <div class="media-intel-kicker">PHNX SPORTS Media Intelligence</div>
        <h2>${report.release_state.state}</h2>
        <p>${report.release_state.reason}</p>

        <div class="media-intel-grid">
          <div><b>Quality</b><span>${report.media_quality.quality_label}</span></div>
          <div><b>Score</b><span>${report.media_quality.score}</span></div>
          <div><b>Package</b><span>${report.presentation_strategy.package_type}</span></div>
          <div><b>Sequence</b><span>${report.highlight_sequence.ready ? "Ready" : "Pending"}</span></div>
        </div>

        <strong>Recommended Media Actions</strong>
        <ul>
          ${report.recommended_actions.map(action => `<li>${action}</li>`).join("")}
        </ul>
      `;
    },

    explain(report) {
      if (!report?.ok) return "No media intelligence report available.";

      return [
        `Release: ${report.release_state.state}`,
        `Quality: ${report.media_quality.quality_label}`,
        `Package: ${report.presentation_strategy.package_type}`,
        `Sequence: ${report.highlight_sequence.ready ? "Ready" : "Pending"}`
      ].join(" | ");
    }

  };

  window.STATScore.MediaIntelligenceEngine = MediaIntelligenceEngine;

  console.info("[STATScore] Media Intelligence Engine Loaded:", MediaIntelligenceEngine.version);

})(); 
