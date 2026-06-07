/*
=========================================================
STATS-CORE™ ENGINE REGISTRY
Athlete Decision Intelligence Infrastructure
=========================================================
*/

window.STATSCORE_ENGINE_REGISTRY = {

  production_engine: {
    id: "PRODUCTION_ENGINE",
    name: "Production Engine",
    status: "ACTIVE",
    purpose:
      "Determines athletic ceiling, competitive level, and divisional projection.",
    owner: "STATS-CORE",
    explainable: true
  },

  academic_engine: {
    id: "ACADEMIC_ENGINE",
    name: "Academic Engine",
    status: "ACTIVE",
    purpose:
      "Determines eligibility, academic readiness, admissions fit, and academic pathway.",
    owner: "STATS-CORE",
    explainable: true
  },

  development_potential_engine: {
    id: "DEVELOPMENT_POTENTIAL_ENGINE",
    name: "Development Potential Engine",
    status: "ACTIVE",
    purpose:
      "Detects growth potential, late bloomers, developmental upside, and future projection.",
    owner: "STATS-CORE",
    explainable: true
  },

  recruiting_interest_registry: {
    id: "RECRUITING_INTEREST_REGISTRY",
    name: "Recruiting Interest Registry",
    status: "ACTIVE",
    purpose:
      "Tracks verified recruiter interest, communication, evaluations, requests, and offers.",
    owner: "STATS-CORE",
    explainable: true
  },

  pathway_engine: {
    id: "PATHWAY_ENGINE",
    name: "Pathway Intelligence Engine",
    status: "ACTIVE",
    purpose:
      "Determines the highest-probability athlete development and recruiting pathway.",
    owner: "STATS-CORE",
    explainable: true
  },

  crystal_matching_engine: {
    id: "CRYSTAL_MATCHING_ENGINE",
    name: "Crystal Matching Engine",
    status: "ACTIVE",
    purpose:
      "Matches athletes to programs and programs to athletes based on verified criteria.",
    owner: "STATS-CORE",
    explainable: true
  },

  explainability_engine: {
    id: "EXPLAINABILITY_ENGINE",
    name: "Explainability Engine",
    status: "ACTIVE",
    purpose:
      "Explains rankings, pathways, recommendations, ratings, and decisions.",
    owner: "STATS-CORE",
    explainable: true
  },

  exposure_engine: {
    id: "EXPOSURE_ENGINE",
    name: "PHNX Sports Exposure Engine",
    status: "ACTIVE",
    purpose:
      "Manages athlete exposure, media visibility, event participation, and opportunity discovery.",
    owner: "PHNX Sports",
    explainable: true
  },

  verification_engine: {
    id: "VERIFICATION_ENGINE",
    name: "Verification Engine",
    status: "ACTIVE",
    purpose:
      "Verifies athlete identity, metrics, documents, evaluations, and evidence.",
    owner: "STATS-CORE",
    explainable: true
  },

  multibox_engine: {
    id: "MULTIBOX_ENGINE",
    name: "Multi-Box Communication Engine",
    status: "ACTIVE",
    purpose:
      "Manages governed communication between athletes, parents, coaches, counselors, recruiters, evaluators, and programs.",
    owner: "STATS-CORE",
    explainable: true
  }

};

/*
=========================================================
ENGINE HELPER FUNCTIONS
=========================================================
*/

window.getEngine = function(engineName){
  return window.STATSCORE_ENGINE_REGISTRY?.[engineName] || null;
};

window.getAllEngines = function(){
  return Object.values(window.STATSCORE_ENGINE_REGISTRY);
};

window.getActiveEngines = function(){
  return Object.values(window.STATSCORE_ENGINE_REGISTRY)
    .filter(engine => engine.status === "ACTIVE");
};

console.log(
  "STATS-CORE Engine Registry Loaded:",
  Object.keys(window.STATSCORE_ENGINE_REGISTRY).length,
  "Engines Active"
); 
