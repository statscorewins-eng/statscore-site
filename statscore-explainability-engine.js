/* ============================================================
   STATS-CORE™ EXPLAINABILITY ENGINE
   File: statscore-explainability-engine.js
   Version: STATSCORE-EXPLAINABILITY-ENGINE-V1
   Purpose:
   Converts STATS-CORE engine outputs into clear, human-readable
   explanations for athletes, parents, coaches, counselors,
   recruiters, evaluators, programs, and admins.

   Doctrine:
   - STATS-CORE does not produce unexplained decisions.
   - Every score must explain WHY.
   - Every route must explain WHY.
   - Every match must explain WHY.
   - Every recruiting signal must explain WHY it matters.
   - Rankings must be explainable and auditable.
============================================================ */

(function(){
  "use strict";

  window.STATSCORE_EXPLAINABILITY_ENGINE = {
    version: "STATSCORE-EXPLAINABILITY-ENGINE-V1",
    locked: true,

    AUDIENCES: {
      ATHLETE: "ATHLETE",
      PARENT: "PARENT",
      COACH: "COACH",
      COUNSELOR: "COUNSELOR",
      RECRUITER: "RECRUITER",
      EVALUATOR: "EVALUATOR",
      PROGRAM: "PROGRAM",
      ADMIN: "ADMIN"
    },

    normalize(value){
      return String(value || "").trim();
    },

    safeArray(value){
      return Array.isArray(value) ? value : [];
    },

    explainDecision(input = {}){
      const audience = String(input.audience || "ATHLETE").toUpperCase();

      return {
        ok: true,
        engine: "STATS-CORE Explainability Engine",
        engine_version: this.version,
        audience,
        athlete_id: input.athlete_id || null,
        snapshot_id: input.snapshot_id || null,

        ranking_explanation: this.explainRanking(input),
        academic_explanation: this.explainAcademics(input),
        pathway_explanation: this.explainPathway(input),
        crystal_explanation: this.explainCrystalMatch(input),
        recruiting_explanation: this.explainRecruitingInterest(input),

        risk_factors: this.collectRiskFactors(input),
        recommended_actions: this.collectRecommendedActions(input),
        next_best_step: this.determineNextBestStep(input),

        summary: this.buildHumanSummary(input, audience),
        generated_at: new Date().toISOString(),
        locked: true
      };
    },

    explainRanking(input){
      const production = input.production || input.production_report || null;
      const score = production?.score || production?.production_score || input.production_score || null;
      const tier = production?.tier || production?.production_tier || input.production_tier || "Unknown";

      const reasons = [];

      if(score !== null){
        reasons.push(`Production score evaluated at ${score}.`);
      } else {
        reasons.push("Production score is not yet available.");
      }

      reasons.push(`Production tier: ${tier}.`);

      if(production?.why){
        reasons.push(...this.safeArray(production.why));
      }

      if(production?.evidence_quality){
        reasons.push(`Evidence quality: ${production.evidence_quality}.`);
      }

      return {
        label: "Ranking Explanation",
        score,
        tier,
        why: reasons
      };
    },

    explainAcademics(input){
      const academic = input.academic || input.academic_report || null;

      if(!academic){
        return {
          label: "Academic Explanation",
          status: "MISSING_ACADEMIC_REPORT",
          why: [
            "Academic matrix output is not available.",
            "Academic routing should not be assumed without GPA, eligibility status, transcript status, and counselor context."
          ]
        };
      }

      return {
        label: "Academic Explanation",
        tier: academic.gpaBand?.tier || academic.academic_tier || "Unknown",
        route: academic.academicRoute?.route || academic.academic_route || "Unknown",
        why: academic.explainability || academic.why || [
          "Academic standing was evaluated separately from athletic production."
        ]
      };
    },

    explainPathway(input){
      const pathway = input.pathway || input.pathway_report || null;

      if(!pathway){
        return {
          label: "Pathway Explanation",
          status: "MISSING_PATHWAY_REPORT",
          why: [
            "Pathway engine output is not available.",
            "STATS-CORE cannot explain route confidence until pathway evaluation runs."
          ]
        };
      }

      const why = [];

      if(pathway.pathway_summary){
        why.push(pathway.pathway_summary);
      }

      if(pathway.current_best_fit?.reason){
        why.push(pathway.current_best_fit.reason);
      }

      if(pathway.highest_ceiling?.reason){
        why.push(pathway.highest_ceiling.reason);
      }

      if(pathway.academic_risk?.reason){
        why.push(pathway.academic_risk.reason);
      }

      if(pathway.exposure_timing?.reason){
        why.push(pathway.exposure_timing.reason);
      }

      return {
        label: "Pathway Explanation",
        best_fit: pathway.current_best_fit?.label || "Unknown",
        highest_ceiling: pathway.highest_ceiling?.label || "Unknown",
        exposure_timing: pathway.exposure_timing?.label || "Unknown",
        why
      };
    },

    explainCrystalMatch(input){
      const crystal = input.crystal || input.crystal_report || input.match_report || null;

      if(!crystal){
        return {
          label: "Crystal Match Explanation",
          status: "MISSING_CRYSTAL_MATCH",
          why: [
            "Crystal match output is not available.",
            "Athlete-program matching should wait until Crystal Engine evaluation runs."
          ]
        };
      }

      return {
        label: "Crystal Match Explanation",
        match_score: crystal.match_score ?? null,
        match_level: crystal.match_level || "Unknown",
        why: crystal.why || [
          "Crystal Engine produced a match but did not return detailed why-factors."
        ]
      };
    },

    explainRecruitingInterest(input){
      const recruiting = input.recruiting || input.recruiting_summary || null;

      if(!recruiting){
        return {
          label: "Recruiting Interest Explanation",
          status: "MISSING_RECRUITING_SUMMARY",
          why: [
            "Recruiting interest registry output is not available.",
            "Viewed profile should not be treated as interest unless recruiter action is registered."
          ]
        };
      }

      return {
        label: "Recruiting Interest Explanation",
        highest_level: recruiting.highest_level || null,
        creates_interest: Boolean(recruiting.creates_interest),
        creates_offer: Boolean(recruiting.creates_offer),
        creates_commitment: Boolean(recruiting.creates_commitment),
        why: recruiting.signals?.[0]?.explainability || [
          recruiting.summary || "Recruiting signal summary unavailable."
        ]
      };
    },

    collectRiskFactors(input){
      const risks = [];

      const academic = input.academic || input.academic_report;
      const pathway = input.pathway || input.pathway_report;
      const crystal = input.crystal || input.crystal_report || input.match_report;
      const recruiting = input.recruiting || input.recruiting_summary;

      if(!academic){
        risks.push("Academic profile has not been evaluated.");
      }

      if(academic?.eligibility?.risk === "HIGH"){
        risks.push("Eligibility status requires review.");
      }

      if(academic?.transcript?.evidenceQuality === "LOW" || academic?.transcript?.evidenceQuality === "UNKNOWN"){
        risks.push("Transcript evidence is weak or missing.");
      }

      if(pathway?.academic_risk?.blocking){
        risks.push("Academic risk may block direct pathway movement.");
      }

      if(pathway?.exposure_timing?.timing === "VERIFY_FIRST"){
        risks.push("Verification should be completed before expanded exposure.");
      }

      if(crystal?.match_score !== undefined && crystal.match_score < 68){
        risks.push("Crystal match strength is below preferred match threshold.");
      }

      if(recruiting && !recruiting.creates_interest){
        risks.push("Current recruiting signals do not yet equal verified interest.");
      }

      return risks;
    },

    collectRecommendedActions(input){
      const actions = [];

      const pathway = input.pathway || input.pathway_report;
      const academic = input.academic || input.academic_report;
      const recruiting = input.recruiting || input.recruiting_summary;

      if(pathway?.recommended_actions?.length){
        actions.push(...pathway.recommended_actions);
      }

      if(!academic){
        actions.push("Run academic matrix evaluation before final pathway routing.");
      }

      if(academic?.academicRoute?.route === "ACADEMIC_BRIDGE_ROUTE"){
        actions.push("Route athlete to counselor review and academic bridge support.");
      }

      if(recruiting && !recruiting.creates_interest){
        actions.push("Continue evidence-building and exposure without treating views as recruiting interest.");
      }

      if(!actions.length){
        actions.push("Continue monitoring production, academics, verification, and recruiting signals.");
      }

      return [...new Set(actions)];
    },

    determineNextBestStep(input){
      const risks = this.collectRiskFactors(input);
      const actions = this.collectRecommendedActions(input);

      if(risks.some(r => r.toLowerCase().includes("academic"))){
        return "Complete academic review and eligibility verification first.";
      }

      if(risks.some(r => r.toLowerCase().includes("verification"))){
        return "Complete athlete verification before expanding exposure.";
      }

      if(actions.length){
        return actions[0];
      }

      return "Continue pathway monitoring and evidence-building.";
    },

    buildHumanSummary(input, audience){
      const athleteName =
        input.athlete_name ||
        input.athlete_display_name ||
        "This athlete";

      const pathway = input.pathway || input.pathway_report;
      const crystal = input.crystal || input.crystal_report || input.match_report;
      const recruiting = input.recruiting || input.recruiting_summary;

      const bestFit = pathway?.current_best_fit?.label || "a pathway still under review";
      const matchScore = crystal?.match_score;
      const interest = recruiting?.highest_level || "no verified recruiting interest yet";

      let summary = `${athleteName} currently projects toward ${bestFit}.`;

      if(matchScore !== undefined){
        summary += ` Crystal Match Score is ${matchScore}.`;
      }

      summary += ` Recruiting status: ${interest}.`;

      if(audience === "PARENT"){
        summary += " This explanation separates exposure, interest, offers, and commitments so the family does not receive false signals.";
      }

      if(audience === "RECRUITER" || audience === "PROGRAM"){
        summary += " This explanation separates athlete fit, survivability, evidence quality, and program match.";
      }

      return summary;
    }
  };

  window.STATSCORE_EXPLAIN_DECISION = function(input){
    return window.STATSCORE_EXPLAINABILITY_ENGINE.explainDecision(input);
  };

  console.info("STATS-CORE Explainability Engine loaded:", window.STATSCORE_EXPLAINABILITY_ENGINE.version);
})(); 
