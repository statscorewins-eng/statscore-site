/* ============================================================
   STATS-CORE™
   Stream 3 — Athlete Intelligence
   File: statscore-intelligence-layer-registry.js
   Purpose: Official intelligence layer registry.
   Doctrine: No page may invent, rename, or collapse score layers.
============================================================ */

(function () {
  "use strict";

  const STREAM = "STATS-CORE Stream 3 Athlete Intelligence";

  const STATUS = {
    ACTIVE: "ACTIVE",
    PENDING: "PENDING",
    LOCKED: "LOCKED",
    CONSUMED: "CONSUMED"
  };

  const ROLE_VISIBILITY = {
    ATHLETE: true,
    PARENT: true,
    COACH: true,
    COUNSELOR: true,
    RECRUITER: true,
    EVALUATOR: true,
    PROGRAM: true,
    ADMIN: true
  };

  const LAYERS = {
    ATHLETIC_SCORE: {
      layer_key: "ATHLETIC_SCORE",
      label: "Athletic Score",
      owner_engine: "statscore-dynamic-athlete-engine.js",
      source_records: [
        "public.statscore_snapshots",
        "athletic metric payloads",
        "camp/combine payloads",
        "position metric payloads"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "athletic-snapshot.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Athletic Score measures athletic profile and supports evaluation. It does not replace production."
    },

    PRODUCTION_SCORE: {
      layer_key: "PRODUCTION_SCORE",
      label: "Production Score",
      owner_engine: "statscore-production-engine.js",
      source_records: [
        "public.statscore_athlete_production_records"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "athlete-production-record.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Production Score reflects competition output. Production drives ranking."
    },

    PRODUCTION_INDEX: {
      layer_key: "PRODUCTION_INDEX",
      label: "Production Index",
      owner_engine: "statscore-production-matrix.js",
      source_records: [
        "public.statscore_athlete_production_records",
        "sport-position production matrix"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "athlete-production-record.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Production Index normalizes sport/position production context."
    },

    ACADEMIC_SCORE: {
      layer_key: "ACADEMIC_SCORE",
      label: "Academic Score",
      owner_engine: "statscore-academic-matrix.js",
      source_records: [
        "public.statscore_snapshots",
        "academic payloads"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "eligibility.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Academic Score reflects academic standing and access. It must not inflate athletic or production scores."
    },

    ELIGIBILITY_SCORE: {
      layer_key: "ELIGIBILITY_SCORE",
      label: "Eligibility Score",
      owner_engine: "statscore-eligibility-engine.js",
      source_records: [
        "public.statscore_snapshots",
        "eligibility payloads",
        "academic payloads"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "eligibility.html",
        "pathway.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Eligibility Score reflects NCAA / NAIA / NJCAA pathway standing."
    },

    VERIFICATION_SCORE: {
      layer_key: "VERIFICATION_SCORE",
      label: "Verification Score",
      owner_engine: "statscore-verification-authority-engine.js",
      source_records: [
        "public.statscore_athlete_production_records",
        "verification payloads",
        "evidence records"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "athlete-production-record.html",
        "athletic-snapshot.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Verification Score measures trust strength of evidence and authority."
    },

    EXPOSURE_SIGNAL: {
      layer_key: "EXPOSURE_SIGNAL",
      label: "Exposure Signal",
      owner_engine: "statscore-crystal-engine.js",
      source_records: [
        "public.statscore_snapshots",
        "exposure payloads",
        "Crystal support outputs"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.CONSUMED,
      doctrine:
        "Exposure Signal may be consumed in Stream 3, but Crystal/media output belongs to Stream 7."
    },

    RECRUITING_READINESS: {
      layer_key: "RECRUITING_READINESS",
      label: "Recruiting Readiness",
      owner_engine: "statscore-readiness-engine.js",
      source_records: [
        "public.statscore_snapshots",
        "production outputs",
        "academic outputs",
        "eligibility outputs",
        "verification outputs"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html",
        "readiness.html",
        "pathway.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.ACTIVE,
      doctrine:
        "Recruiting Readiness explains preparedness, risk, opportunity, and next actions."
    },

    STAR_RATING_SIGNAL: {
      layer_key: "STAR_RATING_SIGNAL",
      label: "Star Rating Signal",
      owner_engine: "statscore-score-authority-engine.js",
      source_records: [
        "production score",
        "sustained production",
        "verification strength",
        "competition context",
        "position value",
        "athletic support signal"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.PENDING,
      doctrine:
        "Star Rating Signal leans toward production, sustained production, verification strength, competition context, position value, and athletic support signal."
    },

    STATSCORE_COMPOSITE_PENDING: {
      layer_key: "STATSCORE_COMPOSITE_PENDING",
      label: "STATS-CORE Composite Pending",
      owner_engine: "statscore-score-authority-engine.js",
      source_records: [
        "required intelligence layers not fully activated"
      ],
      allowed_pages: [
        "athlete-dashboard.html",
        "player-profile.html"
      ],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.PENDING,
      doctrine:
        "Final STATS-CORE Composite is pending until composite authority is activated."
    },

    STATSCORE_COMPOSITE_ACTIVE: {
      layer_key: "STATSCORE_COMPOSITE_ACTIVE",
      label: "STATS-CORE Composite Score",
      owner_engine: "statscore-composite-engine.js",
      source_records: [
        "authorized composite model only"
      ],
      allowed_pages: [],
      explanation_required: true,
      role_visibility: ROLE_VISIBILITY,
      status: STATUS.LOCKED,
      doctrine:
        "Do not display active final composite until composite engine and authority are complete."
    }
  };

  function getLayer(layerKey) {
    return LAYERS[layerKey] || null;
  }

  function getAllLayers() {
    return Object.values(LAYERS);
  }

  function isKnownLayer(layerKey) {
    return Boolean(LAYERS[layerKey]);
  }

  function isLayerAllowedOnPage(layerKey, pageName) {
    const layer = getLayer(layerKey);
    if (!layer) return false;
    return layer.allowed_pages.includes(pageName);
  }

  function requiresExplanation(layerKey) {
    const layer = getLayer(layerKey);
    return Boolean(layer && layer.explanation_required);
  }

  function getAllowedLayersForPage(pageName) {
    return getAllLayers().filter((layer) =>
      layer.allowed_pages.includes(pageName)
    );
  }

  function blockUnknownLayer(layerKey) {
    if (!isKnownLayer(layerKey)) {
      console.error("[STATS-CORE Layer Registry] Unknown score layer blocked:", layerKey);
      return true;
    }
    return false;
  }

  window.STATSCORE_INTELLIGENCE_LAYER_REGISTRY = {
    stream: STREAM,
    layers: LAYERS,
    getLayer,
    getAllLayers,
    isKnownLayer,
    isLayerAllowedOnPage,
    requiresExplanation,
    getAllowedLayersForPage,
    blockUnknownLayer
  };

  console.info("[STATS-CORE] Intelligence Layer Registry loaded.");
})(); 
