/*
=========================================================
STATS-CORE™ ENGINE EXECUTION LAYER
Athlete Decision Intelligence Logic
=========================================================
*/

window.STATSCORE_ENGINE_EXECUTION = {

  evaluateProduction(athlete = {}) {
    const score = Number(athlete.production_score || athlete.productionScore || 0);

    if (score >= 90) return { tier: "ELITE", level: "Power 4 / High D1", score };
    if (score >= 82) return { tier: "HIGH", level: "G5 / FCS / D1", score };
    if (score >= 72) return { tier: "RECRUITABLE", level: "D2 / NAIA / FCS Development", score };
    if (score >= 60) return { tier: "DEVELOPING", level: "D3 / NAIA / JUCO / Prep", score };

    return { tier: "UNVERIFIED", level: "Developmental / Needs Evidence", score };
  },

  evaluateAcademics(athlete = {}) {
    const gpa = Number(athlete.gpa || athlete.academic_gpa || 0);
    const act = Number(athlete.act || 0);
    const sat = Number(athlete.sat || 0);

    if (gpa >= 3.5 || act >= 24 || sat >= 1160) {
      return { tier: "STRONG", route: "Full Academic Access", gpa, act, sat };
    }

    if (gpa >= 2.7 || act >= 19 || sat >= 980) {
      return { tier: "ELIGIBLE", route: "Standard Eligibility Route", gpa, act, sat };
    }

    if (gpa >= 2.0) {
      return { tier: "WATCH", route: "Bridge / Eligibility Monitoring Route", gpa, act, sat };
    }

    return { tier: "RISK", route: "Academic Recovery / JUCO / Prep Route", gpa, act, sat };
  },

  evaluateDevelopmentPotential(athlete = {}) {
    const developmentScore = Number(
      athlete.development_score ||
      athlete.developmentPotential ||
      athlete.upside_score ||
      0
    );

    if (developmentScore >= 90) return { tier: "EXCEPTIONAL", signal: "Late-bloomer / high-upside profile", score: developmentScore };
    if (developmentScore >= 80) return { tier: "HIGH", signal: "Strong developmental trajectory", score: developmentScore };
    if (developmentScore >= 70) return { tier: "MODERATE", signal: "Developing upside", score: developmentScore };

    return { tier: "UNKNOWN", signal: "Needs more evidence", score: developmentScore };
  },

  determinePathway(athlete = {}) {
    const production = this.evaluateProduction(athlete);
    const academics = this.evaluateAcademics(athlete);
    const development = this.evaluateDevelopmentPotential(athlete);

    let pathway = "Developmental + Evidence Building Route";

    if (production.tier === "ELITE" && ["STRONG", "ELIGIBLE"].includes(academics.tier)) {
      pathway = "High Division / Best-Fit Program Route";
    } else if (["ELITE", "HIGH"].includes(production.tier) && ["WATCH", "RISK"].includes(academics.tier)) {
      pathway = "Bridge / JUCO / Prep / Academic Recovery Route";
    } else if (["DEVELOPING", "RECRUITABLE"].includes(production.tier) && academics.tier === "STRONG" && ["HIGH", "EXCEPTIONAL"].includes(development.tier)) {
      pathway = "High-Academic Developmental Program Route";
    } else if (development.tier === "EXCEPTIONAL") {
      pathway = "Late-Bloomer Developmental Watch Route";
    }

    return {
      pathway,
      production,
      academics,
      development,
      why: this.generateWhy({ production, academics, development, pathway })
    };
  },

  generateWhy({ production, academics, development, pathway }) {
    const why = [];

    why.push(`Production tier is ${production.tier}, projecting ${production.level}.`);
    why.push(`Academic tier is ${academics.tier}, routing through ${academics.route}.`);
    why.push(`Development potential is ${development.tier}: ${development.signal}.`);
    why.push(`Recommended pathway: ${pathway}.`);

    return why;
  }
};

window.determineStatsCorePathway = function(athlete){
  return window.STATSCORE_ENGINE_EXECUTION.determinePathway(athlete);
};

console.log("STATS-CORE Engine Execution Layer Loaded"); 
