/*
=========================================================
STATS-CORE™ PRODUCTION ROUTER
Universal Sport Production Intelligence Controller
=========================================================

CANON:
- Pages do NOT calculate production scores.
- Snapshot Intake metrics = athletic disposition only.
- Verified sport/position statistics = true production grading layer.
- Sport-specific engines calculate scores only when a matrix exists.
- Missing sport engine = SPORT MATRIX PENDING.
=========================================================
*/

window.STATSCORE_PRODUCTION_ROUTER = {

  normalizeSport(value){
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  getSportEngine(sport){
    const key = this.normalizeSport(sport);

    const registry = {
      football: window.STATSCORE_FOOTBALL_SCORING_ENGINE || window.STATSCORE_PRODUCTION_ENGINE
    };

    return registry[key] || null;
  },

  evaluate(snapshot = {}){
    const sport = snapshot.primary_sport || snapshot.sport || snapshot.raw?.primarySport || "";
    const position = snapshot.primary_position || snapshot.position || snapshot.raw?.primaryPosition || "";

    const engine = this.getSportEngine(sport);

    if(!engine){
      return {
        status: "SPORT_MATRIX_PENDING",
        official: false,
        sport,
        position,
        production_score: null,
        production_tier: "PENDING",
        production_level: "Sport Matrix Pending",
        message: `${sport || "This sport"} does not yet have an official STATS-CORE production scoring matrix.`,
        why: [
          "No sport-specific production engine is active for this sport.",
          "Snapshot metrics may describe athletic disposition only.",
          "Official production score requires verified sport/position statistics and an approved scoring matrix."
        ]
      };
    }

    if(typeof engine.evaluate === "function"){
      return engine.evaluate(snapshot);
    }

    if(typeof engine.evaluateFootballProduction === "function"){
      return engine.evaluateFootballProduction(snapshot);
    }

    if(typeof engine.determineProductionScore === "function"){
      return engine.determineProductionScore(snapshot);
    }

    return {
      status: "ENGINE_METHOD_MISSING",
      official: false,
      sport,
      position,
      production_score: null,
      production_tier: "PENDING",
      production_level: "Engine Method Missing",
      message: "Sport engine exists, but no valid evaluation method was found.",
      why: [
        "The production router found a sport engine.",
        "The engine does not expose evaluate(), evaluateFootballProduction(), or determineProductionScore()."
      ]
    };
  }
};

window.evaluateStatsCoreProduction = function(snapshot){
  return window.STATSCORE_PRODUCTION_ROUTER.evaluate(snapshot);
};

console.log("STATS-CORE Production Router Loaded"); 
