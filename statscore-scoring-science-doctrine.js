/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-scoring-science-doctrine.js

Asset Type:
JavaScript Doctrine / Scoring Science Authority

Owner Stream:
Stream 9 — Scoring Science & Athlete Intelligence Authority

Primary Operational Authority:
Stream 9 — Scoring Science & Athlete Intelligence Authority

Layer:
Governance / Scoring Doctrine

Runtime Owner:
Stream 9 Intelligence Runtime

Primary Consumers:
- system.html
- athlete-dashboard.html
- player-profile.html
- athletic-snapshot.html
- statscore-scoring-engine.js
- statscore-score-authority-engine.js
- statscore-matrix-registry.js
- statscore-composite-intelligence-center.js

Purpose:
Locks the Phoenix Multi-Sport Scoring Framework™ as the official
scoring science doctrine for STATS-CORE.

Provides:
Executable scoring doctrine for pages, engines, registries,
and system operations.

Does NOT:
- Calculate scores
- Render pages
- Modify data
- Execute dashboards
- Replace scoring engines

Status:
CANON LOCKED

Last Governance Review:
2026-06-27

==========================================================
*/

(function(global){
  "use strict";

  const DOCTRINE = Object.freeze({
    doctrine_key: "STATSCORE_SCORING_SCIENCE_DOCTRINE",
    doctrine_name: "Phoenix Multi-Sport Scoring Framework™",
    doctrine_version: "1.0.0",
    status: "CANON_LOCKED",

    owner_stream: "Stream 9 — Scoring Science & Athlete Intelligence Authority",

    universal_score: "STATScore™",

    core_rule:
      "One universal STATScore™. Multiple sport scoring sciences. Multiple position/event matrices. All outputs normalize into one explainable composite score.",

    hierarchy: Object.freeze([
      "Phoenix Multi-Sport Scoring Framework™",
      "Phoenix Scoring Science Framework™",
      "Sport Scoring Science",
      "Position / Event Matrix",
      "Intelligence Domains",
      "Verification + Confidence",
      "Composite Snapshot Score",
      "STATS-CORE Snapshot Report Card"
    ]),

    active_sports: Object.freeze([
      "football",
      "basketball",
      "baseball",
      "track"
    ]),

    active_intelligence_domains: Object.freeze([
      "athletic",
      "production",
      "academic",
      "evaluation",
      "training",
      "competition",
      "verification",
      "exposure",
      "readiness",
      "pathway",
      "crystal"
    ]),

    inactive_domains: Object.freeze([
      "character"
    ]),

    dashboard_doctrine:
      "Athlete Dashboard is a Situation Report / Command Center. It displays current state, trend, alerts, recommendations, and routes. It does not explain every score.",

    report_card_doctrine:
      "The STATS-CORE Snapshot Report Card explains the combined STATS-CORE Snapshot Score and summarizes domain contribution, evidence, verification, confidence, score drivers, score limiters, and next actions.",

    page_rule:
      "Pages render intelligence. Pages do not calculate scoring science.",

    engine_rule:
      "Engines calculate intelligence according to Stream 3 scoring doctrine.",

    canAddSport: function(){
      return "New sports may be added only by extending the framework. The framework must not be redesigned.";
    },

    isActiveDomain: function(domain){
      return this.active_intelligence_domains.includes(String(domain || "").toLowerCase());
    },

    isInactiveDomain: function(domain){
      return this.inactive_domains.includes(String(domain || "").toLowerCase());
    },

    getDoctrineSummary: function(){
      return {
        doctrine_name: this.doctrine_name,
        doctrine_version: this.doctrine_version,
        status: this.status,
        universal_score: this.universal_score,
        owner_stream: this.owner_stream,
        active_sports: Array.from(this.active_sports),
        active_intelligence_domains: Array.from(this.active_intelligence_domains),
        inactive_domains: Array.from(this.inactive_domains)
      };
    }
  });

  global.STATScoreScoringScienceDoctrine = DOCTRINE;

  console.info("[STATS-CORE] Scoring Science Doctrine loaded:", DOCTRINE.doctrine_name);

})(window); 
