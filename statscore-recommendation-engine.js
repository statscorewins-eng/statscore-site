/* ============================================================
   STATScore™ Recommendation Engine
   File: statscore-recommendation-engine.js
   Version: STATSCORE-RECOMMENDATION-ENGINE-V1
   Purpose:
   Generates athlete, sport, position, academic, pathway,
   media, exposure, camp/combine, and next-action recommendations.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const RecommendationEngine = {

    version: "STATSCORE-RECOMMENDATION-ENGINE-V1",

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    intelligence() {
      return window.STATScoreIntelligence || null;
    },

    scoring() {
      return window.STATScoreScoringEngine || null;
    },

    pathway() {
      return window.STATScore?.PathwayEngine || null;
    },

    quarterly() {
      return window.STATScore?.QuarterlyEligibilityEngine || null;
    },

    media() {
      return window.STATScoreMediaRouting || null;
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    safe(value, fallback = "") {
      return this.core()?.safe?.(value, fallback) ?? (value || fallback);
    },

    buildCampCombineRecommendations(snapshot) {
      const list =
        this.intelligence()?.campCombineRecommendations?.(snapshot) || [];

      return list.map((item) => ({
        type: "CAMP_COMBINE",
        priority: "HIGH",
        title: item,
        reason: `Recommended for ${this.safe(snapshot?.sport, "sport")} / ${this.safe(snapshot?.position, "position")} development and verification.`,
        status: "RECOMMENDED"
      }));
    },

    buildDevelopmentRecommendations(snapshot) {
      const recommendations = [];

      if (!snapshot?.highlight_url && !snapshot?.game_film_url) {
        recommendations.push({
          type: "DEVELOPMENT",
          priority: "HIGH",
          title: "Add verified film evidence",
          reason: "Film evidence is required before stronger exposure and evaluator confidence can be released.",
          status: "ACTION_REQUIRED"
        });
      }

      if (!snapshot?.dash40 && !snapshot?.vertical_jump && !snapshot?.shuttle) {
        recommendations.push({
          type: "DEVELOPMENT",
          priority: "MEDIUM",
          title: "Add verified performance metrics",
          reason: "Verified metrics improve scoring confidence, position comparison, and competition-context analysis.",
          status: "ACTION_REQUIRED"
        });
      }

      if (!snapshot?.coach_name && !snapshot?.coach_email) {
        recommendations.push({
          type: "DEVELOPMENT",
          priority: "MEDIUM",
          title: "Add coach confirmation contact",
          reason: "Coach confirmation supports development context and improves trust-layer completeness.",
          status: "ACTION_REQUIRED"
        });
      }

      return recommendations;
    },

    buildAcademicRecommendations(snapshot, quarterlyReport = null) {
      const recommendations = [];

      const gpa = Number(snapshot?.current_gpa || 0);
      const ncaa = this.lower(snapshot?.ncaa_status);
      const transcript = this.lower(snapshot?.transcript_available);

      if (!gpa && !ncaa && !transcript) {
        recommendations.push({
          type: "ACADEMIC",
          priority: "HIGH",
          title: "Complete academic readiness lane",
          reason: "Eligibility, transcript, and GPA information are missing. Counselor review should be triggered.",
          status: "ACTION_REQUIRED"
        });
      }

      if (gpa && gpa < 2.3) {
        recommendations.push({
          type: "ACADEMIC",
          priority: "HIGH",
          title: "Academic intervention recommended",
          reason: "Current GPA may create NCAA survivability or pathway risk.",
          status: "REVIEW_REQUIRED"
        });
      }

      if (transcript.includes("no") || transcript.includes("pending")) {
        recommendations.push({
          type: "ACADEMIC",
          priority: "HIGH",
          title: "Transcript confirmation required",
          reason: "Transcript status must be confirmed before eligibility confidence can increase.",
          status: "REVIEW_REQUIRED"
        });
      }

      if (quarterlyReport?.evaluation?.status && quarterlyReport.evaluation.status !== "ON_TRACK") {
        recommendations.push({
          type: "ACADEMIC",
          priority: "HIGH",
          title: "Quarterly eligibility review required",
          reason: `Quarterly status returned ${quarterlyReport.evaluation.status}. Counselor review should update course pacing and transcript status.`,
          status: "REVIEW_REQUIRED"
        });
      }

      return recommendations;
    },

    buildPathwayRecommendations(snapshot) {
      const report =
        this.pathway()?.buildPathwayReport?.(snapshot);

      if (!report?.ok) {
        return [{
          type: "PATHWAY",
          priority: "MEDIUM",
          title: "Pathway review required",
          reason: "Pathway engine could not generate a complete route.",
          status: "REVIEW_REQUIRED"
        }];
      }

      return [
        {
          type: "PATHWAY",
          priority: "HIGH",
          title: `Current best fit: ${report.current_best_fit.label}`,
          reason: report.current_best_fit.reason,
          status: report.current_best_fit.state
        },
        {
          type: "PATHWAY",
          priority: "MEDIUM",
          title: `Exposure timing: ${report.exposure_timing.label}`,
          reason: report.exposure_timing.reason,
          status: report.exposure_timing.timing
        },
        {
          type: "PATHWAY",
          priority: "MEDIUM",
          title: `Development timeline: ${report.development_timeline}`,
          reason: "Timeline is based on current score, readiness, completion, academic risk, and verified evidence.",
          status: "PROJECTED"
        }
      ];
    },

    buildMediaRecommendations(snapshot) {
      const readiness =
        this.media()?.mediaReadiness?.(snapshot);

      const recommendations = [];

      if (!readiness) {
        return [{
          type: "MEDIA",
          priority: "MEDIUM",
          title: "Media review required",
          reason: "Media routing engine unavailable.",
          status: "REVIEW_REQUIRED"
        }];
      }

      if (!readiness.player_card_ready) {
        recommendations.push({
          type: "MEDIA",
          priority: "HIGH",
          title: "Prepare player card assets",
          reason: "Athlete identity and official image are required for PHNX SPORTS player card generation.",
          status: "ACTION_REQUIRED"
        });
      }

      if (!readiness.highlight_ready) {
        recommendations.push({
          type: "MEDIA",
          priority: "HIGH",
          title: "Attach highlight or game film",
          reason: "PHNX SPORTS highlight routing requires film evidence.",
          status: "ACTION_REQUIRED"
        });
      }

      if (readiness.youtube_ready) {
        recommendations.push({
          type: "MEDIA",
          priority: "HIGH",
          title: "Prepare YouTube package for approval",
          reason: "Athlete has enough media readiness for PHNX SPORTS branded review and channel preparation.",
          status: "READY_FOR_APPROVAL"
        });
      }

      return recommendations;
    },

    buildExposureRecommendations(snapshot) {
      const exposure =
        this.intelligence()?.exposureGap?.(snapshot);

      if (!exposure) {
        return [{
          type: "EXPOSURE",
          priority: "MEDIUM",
          title: "Exposure review required",
          reason: "Exposure intelligence unavailable.",
          status: "REVIEW_REQUIRED"
        }];
      }

      const priority =
        exposure.status === "HIGH_VALUE_EXPOSURE"
          ? "HIGH"
          : exposure.status.includes("GAP")
            ? "HIGH"
            : "MEDIUM";

      return [{
        type: "EXPOSURE",
        priority,
        title: exposure.label,
        reason: exposure.explanation,
        status: exposure.status
      }];
    },

    buildScoringRecommendations(snapshot) {
      const score =
        this.scoring()?.explainScore?.(snapshot);

      if (!score?.ok) {
        return [{
          type: "SCORING",
          priority: "MEDIUM",
          title: "Scoring review required",
          reason: "Scoring engine could not generate a score from current athlete record.",
          status: "REVIEW_REQUIRED"
        }];
      }

      const recommendations = [];

      if (score.risk_flags?.length) {
        score.risk_flags.forEach((flag) => {
          recommendations.push({
            type: "SCORING",
            priority: "HIGH",
            title: "Resolve scoring risk flag",
            reason: flag,
            status: "ACTION_REQUIRED"
          });
        });
      }

      recommendations.push({
        type: "SCORING",
        priority: "MEDIUM",
        title: score.star_signal.label,
        reason: score.summary,
        status: "CURRENT_SIGNAL"
      });

      return recommendations;
    },

    buildFullRecommendationReport(snapshot, context = {}) {
      if (!snapshot) {
        return {
          ok: false,
          status: "NO_SNAPSHOT",
          message: "No athlete snapshot loaded."
        };
      }

      const quarterlyReport = context.quarterly_report || null;

      const recommendations = [
        ...this.buildCampCombineRecommendations(snapshot),
        ...this.buildDevelopmentRecommendations(snapshot),
        ...this.buildAcademicRecommendations(snapshot, quarterlyReport),
        ...this.buildPathwayRecommendations(snapshot),
        ...this.buildMediaRecommendations(snapshot),
        ...this.buildExposureRecommendations(snapshot),
        ...this.buildScoringRecommendations(snapshot)
      ];

      const highPriority = recommendations.filter(r => r.priority === "HIGH");

      return {
        ok: true,
        engine_version: this.version,

        athlete_id: snapshot.athlete_id || null,
        snapshot_id: snapshot.snapshot_id || null,
        athlete_display_name: snapshot.athlete_display_name || "Athlete",

        recommendation_count: recommendations.length,
        high_priority_count: highPriority.length,

        recommendations,

        immediate_next_actions: highPriority.slice(0, 5),

        summary:
          `${snapshot.athlete_display_name || "Athlete"} has ${recommendations.length} active recommendations, including ${highPriority.length} high-priority actions.`,

        generated_at: this.nowISO(),
        locked: true
      };
    },

    renderRecommendationPanel(targetId, snapshot, context = {}) {
      const el = document.getElementById(targetId);
      if (!el) return;

      const report = this.buildFullRecommendationReport(snapshot, context);

      if (!report.ok) {
        el.innerHTML = `<p>${report.message}</p>`;
        return;
      }

      el.innerHTML = `
        <div class="recommendation-kicker">STATScore Recommendation Intelligence</div>
        <h2>${report.summary}</h2>

        <strong>Immediate Next Actions</strong>
        <ul>
          ${report.immediate_next_actions.map(item => `
            <li>
              <b>${item.title}</b><br>
              <span>${item.reason}</span>
            </li>
          `).join("")}
        </ul>
      `;
    },

    explain(report) {
      if (!report?.ok) return "No recommendation report available.";

      return [
        `Recommendations: ${report.recommendation_count}`,
        `High Priority: ${report.high_priority_count}`,
        `Athlete: ${report.athlete_display_name}`
      ].join(" | ");
    }

  };

  window.STATScore.RecommendationEngine = RecommendationEngine;

  console.info("[STATScore] Recommendation Engine Loaded:", RecommendationEngine.version);

})(); 
