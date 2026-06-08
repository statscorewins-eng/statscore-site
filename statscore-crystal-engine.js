/* ============================================================
   STATS-CORE™ CRYSTAL ENGINE
   File: statscore-crystal-engine.js
   Version: STATSCORE-CRYSTAL-ENGINE-V1
   Purpose:
   Performs explainable athlete-to-program and program-to-athlete
   matching intelligence.

   Doctrine:
   - Crystal Engine makes matching decisions.
   - Crystal Reports display matching decisions.
   - Viewed profile is not interest.
   - Interest is not an offer.
   - Offer is not commitment.
   - Every match must explain WHY.
============================================================ */

(function(){
  "use strict";

  window.STATSCORE_CRYSTAL_ENGINE = {
    version: "STATSCORE-CRYSTAL-ENGINE-V1",
    locked: true,

    MATCH_LEVELS: {
      EXCELLENT: "EXCELLENT_MATCH",
      STRONG: "STRONG_MATCH",
      MODERATE: "MODERATE_MATCH",
      DEVELOPMENT: "DEVELOPMENT_MATCH",
      POOR: "POOR_MATCH"
    },

    normalize(value){
      return String(value || "").trim().toLowerCase();
    },

    clamp(value, min = 0, max = 100){
      const n = Number(value || 0);
      return Math.max(min, Math.min(max, Math.round(n)));
    },

    getPathwayReport(athlete){
      if(window.STATSCORE_PATHWAY_ENGINE?.buildPathwayReport){
        return window.STATSCORE_PATHWAY_ENGINE.buildPathwayReport(athlete);
      }

      if(window.STATScore?.PathwayEngine?.buildPathwayReport){
        return window.STATScore.PathwayEngine.buildPathwayReport(athlete);
      }

      return null;
    },

    evaluateAthleteToProgram(athlete = {}, program = {}){
      const pathway = this.getPathwayReport(athlete);

      const athletePosition = this.normalize(
        athlete.position ||
        athlete.primary_position ||
        athlete.primaryPosition
      );

      const programNeeds = Array.isArray(program.position_needs)
        ? program.position_needs.map(v => this.normalize(v))
        : [];

      const athleteClass = String(
        athlete.graduation_year ||
        athlete.grad_year ||
        athlete.class_year ||
        ""
      );

      const programClassNeeds = Array.isArray(program.class_needs)
        ? program.class_needs.map(String)
        : [];

      let score = 50;
      const why = [];

      if(programNeeds.includes(athletePosition)){
        score += 18;
        why.push("Program has a stated position need that matches the athlete.");
      } else {
        why.push("Program position need is not confirmed for this athlete.");
      }

      if(programClassNeeds.includes(athleteClass)){
        score += 10;
        why.push("Athlete graduation class matches the program recruiting window.");
      } else {
        why.push("Graduation class fit is not confirmed.");
      }

      if(pathway?.ok){
        const fit = pathway.current_best_fit?.best_fit || "";
        const label = pathway.current_best_fit?.label || "Unknown";

        if(this.levelCompatible(fit, program.program_level)){
          score += 18;
          why.push(`Pathway fit aligns with program level: ${label}.`);
        } else {
          score -= 8;
          why.push(`Pathway fit may not fully align with program level: ${label}.`);
        }

        if(pathway.survivability?.score >= 80){
          score += 8;
          why.push("Athlete has strong survivability indicators.");
        }

        if(pathway.academic_risk?.blocking){
          score -= 15;
          why.push("Academic or eligibility risk requires bridge review.");
        }
      } else {
        score -= 10;
        why.push("Pathway report is unavailable, lowering match confidence.");
      }

      const academicScore = this.academicCompatibility(athlete, program);
      score += academicScore.delta;
      why.push(academicScore.reason);

      const evidenceScore = this.evidenceCompatibility(athlete);
      score += evidenceScore.delta;
      why.push(evidenceScore.reason);

      const developmentScore = this.developmentCompatibility(athlete, program);
      score += developmentScore.delta;
      why.push(developmentScore.reason);

      score = this.clamp(score);

      return {
        ok: true,
        engine: "STATS-CORE Crystal Engine",
        engine_version: this.version,
        match_type: "ATHLETE_TO_PROGRAM",
        athlete_id: athlete.athlete_id || null,
        snapshot_id: athlete.snapshot_id || null,
        program_id: program.program_id || null,
        match_score: score,
        match_level: this.resolveMatchLevel(score),
        pathway_report: pathway,
        why,
        summary: this.buildSummary(score, athlete, program),
        generated_at: new Date().toISOString(),
        locked: true
      };
    },

    evaluateProgramToAthletes(program = {}, athletes = []){
      const results = athletes.map(athlete => {
        return this.evaluateAthleteToProgram(athlete, program);
      });

      return {
        ok: true,
        engine: "STATS-CORE Crystal Engine",
        engine_version: this.version,
        match_type: "PROGRAM_TO_ATHLETES",
        program_id: program.program_id || null,
        total_candidates: results.length,
        matches: results.sort((a,b) => b.match_score - a.match_score),
        generated_at: new Date().toISOString(),
        locked: true
      };
    },

    levelCompatible(pathwayFit, programLevel){
      const fit = this.normalize(pathwayFit);
      const level = this.normalize(programLevel);

      if(!fit || !level) return false;

      if(fit.includes("d1") && level.includes("d1")) return true;
      if(fit.includes("d2") && level.includes("d2")) return true;
      if((fit.includes("d3") || fit.includes("naia")) && (level.includes("d3") || level.includes("naia"))) return true;
      if((fit.includes("juco") || fit.includes("bridge")) && (level.includes("juco") || level.includes("prep"))) return true;

      return false;
    },

    academicCompatibility(athlete, program){
      const athleteGpa = Number(
        athlete.current_gpa ||
        athlete.gpa ||
        athlete.academic_gpa ||
        0
      );

      const minGpa = Number(
        program.minimum_gpa ||
        program.min_gpa ||
        0
      );

      if(!athleteGpa || !minGpa){
        return {
          delta: -3,
          reason: "Academic compatibility is incomplete because GPA requirements are missing."
        };
      }

      if(athleteGpa >= minGpa + 0.5){
        return {
          delta: 12,
          reason: "Athlete academic standing exceeds program minimum expectations."
        };
      }

      if(athleteGpa >= minGpa){
        return {
          delta: 6,
          reason: "Athlete academic standing meets program minimum expectations."
        };
      }

      return {
        delta: -14,
        reason: "Athlete academic standing is below program minimum expectation and may require bridge routing."
      };
    },

    evidenceCompatibility(athlete){
      const verified = this.normalize(athlete.verification_status) === "verified";
      const film = athlete.highlight_url || athlete.film_url || athlete.game_film_url;
      const metrics = athlete.verified_event_source || athlete.testing_source;

      let delta = 0;
      const reasons = [];

      if(verified){
        delta += 8;
        reasons.push("Athlete has verified status.");
      } else {
        delta -= 6;
        reasons.push("Athlete verification is incomplete.");
      }

      if(film){
        delta += 5;
        reasons.push("Athlete has film evidence available.");
      }

      if(metrics){
        delta += 5;
        reasons.push("Athlete has testing or event evidence available.");
      }

      if(!film && !metrics){
        delta -= 7;
        reasons.push("Athlete evidence package needs improvement.");
      }

      return {
        delta,
        reason: reasons.join(" ")
      };
    },

    developmentCompatibility(athlete, program){
      const devModel = this.normalize(program.development_model);
      const devPotential = this.normalize(
        athlete.development_potential ||
        athlete.developmentPotential ||
        athlete.ceiling_type
      );

      if(!devModel && !devPotential){
        return {
          delta: 0,
          reason: "Development fit is neutral because development model data is incomplete."
        };
      }

      if(devModel.includes("development") && devPotential.includes("high")){
        return {
          delta: 10,
          reason: "Program development model aligns with athlete upside."
        };
      }

      if(devModel.includes("ready") && devPotential.includes("raw")){
        return {
          delta: -6,
          reason: "Program appears to need ready-now athletes while athlete may require development."
        };
      }

      return {
        delta: 3,
        reason: "Development fit appears acceptable but requires more evidence."
      };
    },

    resolveMatchLevel(score){
      if(score >= 90) return this.MATCH_LEVELS.EXCELLENT;
      if(score >= 80) return this.MATCH_LEVELS.STRONG;
      if(score >= 68) return this.MATCH_LEVELS.MODERATE;
      if(score >= 55) return this.MATCH_LEVELS.DEVELOPMENT;
      return this.MATCH_LEVELS.POOR;
    },

    buildSummary(score, athlete, program){
      const athleteName =
        athlete.athlete_display_name ||
        athlete.athlete_name ||
        "Athlete";

      const programName =
        program.program_name ||
        program.name ||
        "Program";

      const level = this.resolveMatchLevel(score).replace(/_/g, " ");

      return `${athleteName} is a ${level} for ${programName} with a Crystal Match Score of ${score}.`;
    }
  };

  window.STATSCORE_RUN_CRYSTAL_MATCH = function(athlete, program){
    return window.STATSCORE_CRYSTAL_ENGINE.evaluateAthleteToProgram(athlete, program);
  };

  console.info("STATS-CORE Crystal Engine loaded:", window.STATSCORE_CRYSTAL_ENGINE.version);
})(); 
