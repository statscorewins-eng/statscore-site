/* ============================================================
   STATScore™ Pathway Engine
   File: statscore-pathway-engine.js
   Version: STATSCORE-PATHWAY-ENGINE-V1
   Purpose:
   Determines athlete pathway fit, survivability, level projection,
   exposure timing, route recommendations, and academic-athletic
   alignment across Football, Basketball, Baseball, and Track.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const PathwayEngine = {

    version: "STATSCORE-PATHWAY-ENGINE-V1",

    LEVELS: {
      D1: "NCAA Division I",
      D2: "NCAA Division II",
      D3: "NCAA Division III",
      NAIA: "NAIA",
      JUCO: "JUCO / Bridge Path",
      CLUB: "Club / Developmental",
      UNDETERMINED: "Undetermined"
    },

    PATHWAY_STATES: {
      DIRECT: "DIRECT_PATH",
      CONDITIONAL: "CONDITIONAL_PATH",
      DEVELOPMENTAL: "DEVELOPMENTAL_PATH",
      ACADEMIC_BRIDGE: "ACADEMIC_BRIDGE_PATH",
      EXPOSURE_HOLD: "EXPOSURE_HOLD",
      REVIEW_REQUIRED: "REVIEW_REQUIRED"
    },

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    scoring() {
      return window.STATScoreScoringEngine || null;
    },

    intelligence() {
      return window.STATScoreIntelligence || null;
    },

    consensus() {
      return window.STATScore?.ConsensusEngine || null;
    },

    normalize(value) {
      return String(value || "").trim();
    },

    lower(value) {
      return this.normalize(value).toLowerCase();
    },

    clamp(value, min = 0, max = 100) {
      const n = Number(value || 0);
      return Math.max(min, Math.min(max, Math.round(n)));
    },

    getScore(snapshot) {
      const result = this.scoring()?.explainScore?.(snapshot);
      return result?.ok ? result.final_score : 0;
    },

    getCompletion(snapshot) {
      return this.core()?.profileCompletion?.(snapshot)?.percent || 0;
    },

    getReadiness(snapshot) {
      return this.intelligence()?.readinessState?.(snapshot) || {
        status: "UNKNOWN",
        label: "Unknown",
        explanation: "Readiness not available."
      };
    },

    getExposure(snapshot) {
      return this.intelligence()?.exposureGap?.(snapshot) || {
        status: "UNKNOWN",
        label: "Unknown",
        explanation: "Exposure intelligence not available."
      };
    },

    getCompetition(snapshot) {
      return this.intelligence()?.competitionLevel?.(snapshot) || {
        label: "Standard Varsity",
        weight: 1,
        exposure: "NORMAL"
      };
    },

    academicRisk(snapshot) {
      const gpa = Number(snapshot?.current_gpa || 0);
      const ncaa = this.lower(snapshot?.ncaa_status);
      const transcript = this.lower(snapshot?.transcript_available);

      if (!gpa && !ncaa && !transcript) {
        return {
          risk: "UNKNOWN",
          score: 40,
          blocking: true,
          reason: "Academic record is incomplete."
        };
      }

      if (
        ncaa.includes("needs") ||
        ncaa.includes("not started") ||
        transcript === "no"
      ) {
        return {
          risk: "HIGH",
          score: 45,
          blocking: true,
          reason: "Eligibility or transcript lane requires review."
        };
      }

      if (gpa && gpa < 2.3) {
        return {
          risk: "MODERATE_HIGH",
          score: 55,
          blocking: true,
          reason: "Core academic survivability may be at risk."
        };
      }

      if (gpa && gpa < 2.8) {
        return {
          risk: "MODERATE",
          score: 68,
          blocking: false,
          reason: "Academic profile may support some pathways but requires monitoring."
        };
      }

      return {
        risk: "LOW",
        score: 85,
        blocking: false,
        reason: "Academic lane appears stable pending official confirmation."
      };
    },

    athleticCeiling(snapshot) {
      const score = this.getScore(snapshot);
      const comp = this.getCompetition(snapshot);

      if (score >= 92 && comp.weight >= 1.16) {
        return {
          ceiling: "D1",
          label: this.LEVELS.D1,
          score: 95,
          reason: "High STATScore signal with strong competition context."
        };
      }

      if (score >= 84) {
        return {
          ceiling: "D2",
          label: this.LEVELS.D2,
          score: 84,
          reason: "Strong athlete signal with regional or verified development value."
        };
      }

      if (score >= 74) {
        return {
          ceiling: "D3/NAIA",
          label: "D3 / NAIA",
          score: 74,
          reason: "Verified development signal supports non-D1 pathway review."
        };
      }

      if (score >= 62) {
        return {
          ceiling: "JUCO",
          label: this.LEVELS.JUCO,
          score: 62,
          reason: "Athlete may benefit from bridge development or additional verification."
        };
      }

      return {
        ceiling: "UNDETERMINED",
        label: this.LEVELS.UNDETERMINED,
        score,
        reason: "Insufficient verified signal for pathway projection."
      };
    },

    survivabilityFit(snapshot) {
      const academic = this.academicRisk(snapshot);
      const readiness = this.getReadiness(snapshot);
      const completion = this.getCompletion(snapshot);

      let score = academic.score;

      if (readiness.status === "OPERATIONAL_READY") score += 10;
      if (readiness.status === "REVIEW_READY") score += 5;
      if (completion >= 85) score += 5;
      if (academic.blocking) score -= 12;

      score = this.clamp(score);

      if (score >= 85) {
        return {
          fit: "HIGH_SURVIVABILITY",
          label: "High Survivability",
          score,
          reason: "Academic and readiness indicators support stable pathway movement."
        };
      }

      if (score >= 68) {
        return {
          fit: "CONDITIONAL_SURVIVABILITY",
          label: "Conditional Survivability",
          score,
          reason: "Pathway may be viable but requires monitoring or review."
        };
      }

      return {
        fit: "SURVIVABILITY_RISK",
        label: "Survivability Risk",
        score,
        reason: "Academic or readiness gaps may restrict pathway movement."
      };
    },

    determineBestFit(snapshot) {
      const ceiling = this.athleticCeiling(snapshot);
      const academic = this.academicRisk(snapshot);
      const survivability = this.survivabilityFit(snapshot);
      const score = this.getScore(snapshot);

      if (academic.blocking) {
        return {
          best_fit: "JUCO",
          label: this.LEVELS.JUCO,
          state: this.PATHWAY_STATES.ACADEMIC_BRIDGE,
          reason: "Academic or eligibility review creates bridge-path risk."
        };
      }

      if (ceiling.ceiling === "D1" && survivability.score >= 80) {
        return {
          best_fit: "D1",
          label: this.LEVELS.D1,
          state: this.PATHWAY_STATES.DIRECT,
          reason: "Athletic ceiling and survivability indicators support D1 review."
        };
      }

      if (score >= 82 && survivability.score >= 70) {
        return {
          best_fit: "D2",
          label: this.LEVELS.D2,
          state: this.PATHWAY_STATES.CONDITIONAL,
          reason: "Strong signal supports D2 or high-fit regional pathway."
        };
      }

      if (score >= 72) {
        return {
          best_fit: "D3_NAIA",
          label: "D3 / NAIA",
          state: this.PATHWAY_STATES.DEVELOPMENTAL,
          reason: "Athlete may fit development-centered college pathway."
        };
      }

      return {
        best_fit: "JUCO_DEVELOPMENT",
        label: this.LEVELS.JUCO,
        state: this.PATHWAY_STATES.DEVELOPMENTAL,
        reason: "Athlete needs development, verification, or additional exposure before higher pathway projection."
      };
    },

    exposureTiming(snapshot) {
      const exposure = this.getExposure(snapshot);
      const academic = this.academicRisk(snapshot);
      const completion = this.getCompletion(snapshot);
      const verified = this.lower(snapshot?.verification_status) === "verified";

      if (academic.blocking) {
        return {
          timing: "HOLD",
          label: "Exposure Hold",
          reason: "Recruiting visibility should remain controlled until academic review improves."
        };
      }

      if (!verified) {
        return {
          timing: "VERIFY_FIRST",
          label: "Verify First",
          reason: "Exposure should not expand until verification is complete."
        };
      }

      if (completion < 75) {
        return {
          timing: "COMPLETE_PROFILE",
          label: "Complete Profile First",
          reason: "Profile completion is not yet strong enough for expansion."
        };
      }

      if (exposure.status === "HIGH_VALUE_EXPOSURE") {
        return {
          timing: "EXPAND",
          label: "Expand Visibility",
          reason: "Athlete has strong evidence and competition context."
        };
      }

      return {
        timing: "CONTROLLED",
        label: "Controlled Visibility",
        reason: "Athlete can receive controlled visibility while remaining under review."
      };
    },

    developmentTimeline(snapshot) {
      const score = this.getScore(snapshot);
      const readiness = this.getReadiness(snapshot);
      const completion = this.getCompletion(snapshot);

      if (score >= 88 && completion >= 85) {
        return "0-6 months";
      }

      if (score >= 78 || readiness.status === "REVIEW_READY") {
        return "6-12 months";
      }

      if (score >= 65) {
        return "12-18 months";
      }

      return "18+ months / development review";
    },

    buildPathwayReport(snapshot) {
      if (!snapshot) {
        return {
          ok: false,
          status: "NO_SNAPSHOT",
          message: "No athlete snapshot loaded."
        };
      }

      const ceiling = this.athleticCeiling(snapshot);
      const academic = this.academicRisk(snapshot);
      const survivability = this.survivabilityFit(snapshot);
      const bestFit = this.determineBestFit(snapshot);
      const exposure = this.exposureTiming(snapshot);
      const timeline = this.developmentTimeline(snapshot);

      const actions = [];

      if (academic.blocking) {
        actions.push("Complete counselor review, transcript confirmation, and NCAA course tracking.");
      }

      if (exposure.timing === "VERIFY_FIRST") {
        actions.push("Complete evaluator verification before expanding recruiter visibility.");
      }

      if (exposure.timing === "COMPLETE_PROFILE") {
        actions.push("Complete missing athlete profile lanes before wider exposure.");
      }

      actions.push("Match athlete pathway to readiness, academic survivability, competition level, and verified evidence.");

      return {
        ok: true,
        engine_version: this.version,
        athlete_id: snapshot.athlete_id || null,
        snapshot_id: snapshot.snapshot_id || null,
        athlete_display_name: snapshot.athlete_display_name || "Athlete",

        highest_ceiling: ceiling,
        current_best_fit: bestFit,
        survivability,
        academic_risk: academic,
        exposure_timing: exposure,
        development_timeline: timeline,

        pathway_summary:
          `${snapshot.athlete_display_name || "Athlete"} currently projects toward ${bestFit.label}. Highest ceiling is ${ceiling.label}. Exposure timing is ${exposure.label}.`,

        recommended_actions: actions,

        generated_at: this.nowISO(),
        locked: true
      };
    },

    renderPathwayPanel(targetId, snapshot) {
      const el = document.getElementById(targetId);
      if (!el) return;

      const report = this.buildPathwayReport(snapshot);

      if (!report.ok) {
        el.innerHTML = `<p>${report.message}</p>`;
        return;
      }

      el.innerHTML = `
        <div class="pathway-kicker">STATScore Pathway Intelligence</div>
        <h2>${report.current_best_fit.label}</h2>
        <p>${report.pathway_summary}</p>

        <div class="pathway-grid">
          <div><b>Highest Ceiling</b><span>${report.highest_ceiling.label}</span></div>
          <div><b>Best Fit</b><span>${report.current_best_fit.label}</span></div>
          <div><b>Survivability</b><span>${report.survivability.label}</span></div>
          <div><b>Exposure Timing</b><span>${report.exposure_timing.label}</span></div>
          <div><b>Timeline</b><span>${report.development_timeline}</span></div>
          <div><b>Academic Risk</b><span>${report.academic_risk.risk}</span></div>
        </div>

        <strong>Recommended Actions</strong>
        <ul>
          ${report.recommended_actions.map(action => `<li>${action}</li>`).join("")}
        </ul>
      `;
    },

    explain(report) {
      if (!report?.ok) return "No pathway report available.";

      return [
        `Best Fit: ${report.current_best_fit.label}`,
        `Highest Ceiling: ${report.highest_ceiling.label}`,
        `Survivability: ${report.survivability.label}`,
        `Exposure: ${report.exposure_timing.label}`,
        `Timeline: ${report.development_timeline}`
      ].join(" | ");
    }

  };

  window.STATScore.PathwayEngine = PathwayEngine;

  console.info("[STATScore] Pathway Engine Loaded:", PathwayEngine.version);

})(); 
