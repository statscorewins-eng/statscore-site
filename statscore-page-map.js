/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-page-map.js

Asset Type:
JavaScript Registry / Page Authority Map

Owner Stream:
Master Integration

Primary Operational Authority:
Master Integration

Layer:
Governance / Page Authority

Runtime Owner:
Master Integration Runtime

Primary Consumers:
- system.html
- statscore-routing.js
- statscore-engine-loader.js
- statscore-dashboard-map.js
- Page Runtime Engines

Purpose:
Defines the canonical registration, ownership, and
governance of every HTML page within STATS-CORE.
Establishes page authority, runtime relationships,
routing identity, and Stream ownership.

Consumes:
- STATS-CORE Canon
- Stream Registry
- Ownership Registry
- System Map

Provides:
- Page registration
- Page ownership authority
- Runtime assignment
- Navigation authority
- Stream ownership reference

Primary IDs:
- page_id
- page_name
- page_type
- role
- snapshot_id

Cross-Stream Dependencies:
May reference every Stream for page ownership.
May not implement page business logic, scoring,
communication, or runtime behavior.

Does NOT:
- Render HTML
- Execute routing
- Calculate athlete intelligence
- Perform authentication
- Execute dashboard logic
- Modify Supabase records
- Generate Crystal Reports
- Execute Multi-Box communications

Status:
CANON LOCKED

Last Governance Review:
2026-07-05

==========================================================
*/

window.STATSCORE_PAGE_MAP = {
  map_version: "v1.1",
  map_status: "ACTIVE",
  map_name: "STATS-CORE Page Map",
  doctrine: "Pages are shells/templates. Functionality is activated through engines, registry records, and snapshot_id routing.",

  global_rules: [
    "Do not rebuild existing shells unless formally ordered.",
    "Do not hardcode athlete-specific records into static HTML pages.",
    "All athlete data must load by snapshot_id from registry/source records.",
    "Dashboard = navigation and awareness layer only.",
    "Deep pages = intelligence/resource layers.",
    "Every page must have a purpose, route, engine dependency, and build status.",
    "If a page is missing from this map, add it before editing that page."
  ],

  build_status_key: {
    BUILT_SHELL: "Visual/page shell exists.",
    PARTIAL: "Shell exists, but functionality still needs activation.",
    FUNCTIONAL_BUILD_NEEDED: "Page exists but needs real system logic/data.",
    MISSING: "Required page does not currently exist.",
    SUPPORT: "Legal/support/infrastructure page.",
    AUDITED_PASS: "Asset has passed Stream 1 audit.",
    PASS_WITH_ADJUSTMENTS: "Asset passed audit but requires documented corrections.",
    FAILED_AUDIT: "Asset failed audit and requires build adjustment."
  },

  pages: {
    "index.html": {
      layer: "Public Entry",
      purpose: "Public landing/entry point into STATS-CORE.",
      routes_to: ["login.html"],
      powered_by: [],
      build_status: "AUDITED_PASS"
    },

    "login.html": {
      layer: "Access / Role Detection",
      purpose: "Authenticate demo users, detect user role, and route user into athlete, professional, or admin flow.",
      routes_to: ["snapshot-intake.html", "role-dashboard-intake.html", "system.html"],
      powered_by: ["statscore-routing.js"],
      build_status: "AUDITED_PASS"
    },

    "privacy.html": {
      layer: "Legal",
      purpose: "Public-facing privacy policy and data protection notice.",
      routes_to: ["index.html", "login.html", "terms.html"],
      powered_by: [],
      build_status: "AUDITED_PASS"
    },

    "terms.html": {
      layer: "Legal",
      purpose: "Public-facing terms of service.",
      routes_to: ["index.html", "login.html", "privacy.html"],
      powered_by: [],
      build_status: "AUDITED_PASS"
    },

    "snapshot-intake.html": {
      layer: "Athlete Source Intake",
      purpose: "Beginning of athlete source data. Creates/uses snapshot_id and captures identity, metrics, academics, guardian data, media/headshot, and verification request data.",
      routes_to: ["athlete-dashboard.html", "player-profile.html", "parent-approval.html", "verification-request.html"],
      powered_by: [
        "statscore-data.js",
        "statscore-routing.js",
        "statscore-media-routing.js",
        "statscore-parent-approval-engine.js",
        "statscore-verification-engine.js"
      ],
      build_status: "PARTIAL",
      do_not_drift: "This page is the origin of athlete source data and media ingest."
    },

    "athlete-dashboard.html": {
      layer: "Athlete Navigation / Awareness",
      purpose: "Athlete command dashboard. Shows summary intelligence and routes each card into deeper pages.",
      routes_to: [
        "player-profile.html",
        "eligibility.html",
        "readiness.html",
        "college-pathway.html",
        "media.html",
        "crystal-report.html",
        "multi-box.html",
        "events.html",
        "parent-approval.html",
        "verification.html"
      ],
      powered_by: [
        "statscore-doctrine.js",
        "statscore-system-map.js",
        "statscore-athlete-efbp-map.js",
        "statscore-engine-registry.js",
        "statscore-engine-execution.js",
        "statscore-production-matrix.js",
        "statscore-academic-matrix.js"
      ],
      build_status: "PARTIAL",
      do_not_drift: "Dashboard is not the intelligence holder. It routes to intelligence."
    },

    "player-profile.html": {
      layer: "Explainable Athlete Intelligence",
      purpose: "Deep athlete profile rendered from snapshot_id, registry/source records, matrices, and explainability logic.",
      routes_to: ["crystal-report.html", "verification-request.html", "parent-approval.html"],
      powered_by: [
        "statscore-player-profile-runtime.js",
        "statscore-profile-engine.js",
        "statscore-production-matrix.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL"
    },

    "role-dashboard-intake.html": {
      layer: "Professional Role Intake",
      purpose: "Captures professional role identity/context after login and prepares professional operating context.",
      routes_to: ["role-dashboard.html"],
      powered_by: ["statscore-routing.js", "statscore-role-access.js"],
      build_status: "PARTIAL",
      do_not_drift: "All non-athlete roles route through this intake page."
    },

    "role-dashboard.html": {
      layer: "Professional Operations Dashboard",
      purpose: "Shared professional operating environment. Loads role/workspace-specific modules according to role, credentials, sport, position/event, and permissions.",
      routes_to: ["parent.html", "coach.html", "counselor.html", "recruiter-access.html", "evaluator.html", "program.html", "multi-box.html"],
      powered_by: ["statscore-routing.js", "statscore-role-access.js"],
      build_status: "PARTIAL",
      do_not_drift: "Professional dashboards share one governed shell. Role-specific behavior is activated by context."
    },

    "eligibility.html": {
      layer: "Eligibility Intelligence",
      purpose: "Explains academic/eligibility standing, risk, requirements, and correction path.",
      routes_to: ["college-pathway.html", "counselor.html"],
      powered_by: [
        "statscore-academic-matrix.js",
        "statscore-eligibility-engine.js",
        "statscore-ncaa-eligibility-intelligence-engine.js"
      ],
      build_status: "PARTIAL"
    },

    "readiness.html": {
      layer: "Development / Readiness Intelligence",
      purpose: "Explains athlete readiness, development trajectory, growth curve, and next movement.",
      routes_to: ["player-profile.html", "college-pathway.html"],
      powered_by: ["statscore-readiness-engine.js", "statscore-production-matrix.js"],
      build_status: "PARTIAL"
    },

    "college-pathway.html": {
      layer: "Pathway Intelligence",
      purpose: "Explains best probability pathway: FBS, FCS, D2, D3, NAIA, JUCO, transfer, development route, or academic route.",
      routes_to: ["crystal-report.html", "eligibility.html", "media.html"],
      powered_by: [
        "statscore-pathway-engine.js",
        "statscore-pathway-intelligence-engine.js",
        "statscore-academic-matrix.js",
        "statscore-production-matrix.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL"
    },

    "media.html": {
      layer: "Media / Exposure Intelligence",
      purpose: "Controls athlete exposure, PHNX Sports media routing, headshot/media assets, highlight links, and signal distribution.",
      routes_to: ["athlete-dashboard.html", "player-profile.html"],
      powered_by: ["statscore-media-intelligence-engine.js", "statscore-media-routing.js"],
      build_status: "FUNCTIONAL_BUILD_NEEDED"
    },

    "crystal-registry.html": {
      layer: "Persistent Athlete Registry",
      purpose: "Persistent athlete intelligence identity layer.",
      routes_to: ["crystal-report.html"],
      powered_by: ["statscore-crystal-engine.js"],
      build_status: "PARTIAL"
    },

    "crystal-report.html": {
      layer: "Generated Intelligence Report",
      purpose: "Generates full athlete story: standing, evidence, trajectory, risk, pathway, exposure, recommendations, and next steps.",
      routes_to: ["player-profile.html"],
      powered_by: ["statscore-crystal-engine.js", "statscore-crystal-reports.js", "statscore-explainability-engine.js"],
      build_status: "PARTIAL"
    },

    "multi-box.html": {
      layer: "Governed Communication",
      purpose: "Role-to-role communication infrastructure with permissions, routing, and audit trail.",
      routes_to: ["message-windows.html", "audit-trail.html"],
      powered_by: ["statscore-communication-engine.js", "statscore-multi-box-governance-engine.js"],
      build_status: "PARTIAL",
      do_not_drift: "Multi-Box is communication layer only, not a dashboard."
    },

    "parent-approval.html": {
      layer: "Guardian Release Governance",
      purpose: "Parent/guardian approval, denial, modification, and release control.",
      routes_to: ["parent-dashboard.html", "athlete-dashboard.html"],
      powered_by: ["statscore-parent-approval-engine.js"],
      build_status: "PARTIAL"
    },

    "parent-dashboard.html": {
      layer: "Parent Dashboard",
      purpose: "Parent command dashboard after role intake.",
      routes_to: ["parent.html", "parent-approval.html", "parent-notices.html", "multi-box.html"],
      powered_by: ["statscore-role-access.js"],
      build_status: "PARTIAL"
    },

    "parent.html": {
      layer: "Parent Tool Room",
      purpose: "Guardian access, athlete oversight, and release operations.",
      routes_to: ["parent-approval.html", "parent-notices.html"],
      powered_by: ["statscore-parent-approval-engine.js"],
      build_status: "PARTIAL"
    },

    "parent-notices.html": {
      layer: "Parent Notices",
      purpose: "Parent unread notices, approval alerts, and action items.",
      routes_to: ["parent-approval.html"],
      powered_by: ["statscore-parent-approval-engine.js"],
      build_status: "PARTIAL"
    },

    "coach.html": {
      layer: "Coach Role Room",
      purpose: "Coach contribution, athlete development notes, verification support, and evaluation input.",
      routes_to: ["verification.html", "multi-box.html"],
      powered_by: ["statscore-verification-engine.js", "statscore-evidence-engine.js"],
      build_status: "PARTIAL",
      do_not_drift: "Coach is contributor, not system authority."
    },

    "counselor.html": {
      layer: "Counselor Role Room",
      purpose: "Academic support, eligibility review, transcript support, and correction path.",
      routes_to: ["eligibility.html", "multi-box.html"],
      powered_by: ["statscore-academic-matrix.js", "statscore-eligibility-engine.js"],
      build_status: "PARTIAL"
    },

    "counselor-access.html": {
      layer: "Counselor Access",
      purpose: "Counselor authorization and access request path.",
      routes_to: ["counselor.html"],
      powered_by: ["statscore-role-access.js"],
      build_status: "PARTIAL"
    },

    "recruiter-access.html": {
      layer: "Recruiter Access",
      purpose: "Recruiter profile visibility and access governed by release, verification, and communication permissions.",
      routes_to: ["player-profile.html", "multi-box.html"],
      powered_by: ["statscore-recruiting-interest-registry.js", "statscore-role-access.js"],
      build_status: "PARTIAL"
    },

    "recruiter-request.html": {
      layer: "Recruiter Request",
      purpose: "Recruiter request initiation and controlled profile access.",
      routes_to: ["recruiter-access.html"],
      powered_by: ["statscore-recruiting-interest-registry.js"],
      build_status: "PARTIAL"
    },

    "program.html": {
      layer: "Program Intelligence",
      purpose: "Program-level view for roster fit, pipeline, sustainability, recruiting coverage, and athlete fit.",
      routes_to: ["player-profile.html", "crystal-report.html"],
      powered_by: ["statscore-program-intelligence-engine.js"],
      build_status: "PARTIAL"
    },

    "evaluator.html": {
      layer: "Evaluator Role Room",
      purpose: "Independent evaluation, evidence review, trait verification, and trusted assessment.",
      routes_to: ["verification.html"],
      powered_by: ["statscore-evaluator-engine.js", "statscore-evidence-engine.js"],
      build_status: "PARTIAL"
    },

    "events.html": {
      layer: "Events / Opportunities",
      purpose: "Camps, combines, showcases, calendar events, and athlete opportunity routing.",
      routes_to: ["media.html", "college-pathway.html"],
      powered_by: ["statscore-event-engine.js", "statscore-camp-combine-intelligence-engine.js"],
      build_status: "PARTIAL"
    },

    "rankings.html": {
      layer: "Rankings / Explainability",
      purpose: "Rankings with required explanation and evidence basis.",
      routes_to: ["player-profile.html"],
      powered_by: ["statscore-phnx-ranking-engine.js", "statscore-explainability-engine.js"],
      build_status: "PARTIAL",
      do_not_drift: "Rankings must explain why."
    },

    "verification.html": {
      layer: "Verification / Trust",
      purpose: "Verifies stats, film, measurements, academics, awards, source claims, and evidence trail.",
      routes_to: ["verification-request.html", "player-profile.html"],
      powered_by: ["statscore-verification-engine.js", "statscore-evidence-engine.js"],
      build_status: "PARTIAL"
    },

    "verification-request.html": {
      layer: "Verification Request",
      purpose: "Request trusted verification from coach, counselor, evaluator, or admin.",
      routes_to: ["verification.html"],
      powered_by: ["statscore-verification-engine.js"],
      build_status: "PARTIAL"
    },

    "profile-access.html": {
      layer: "Profile Access",
      purpose: "Controlled profile access gateway.",
      routes_to: ["access-approved.html", "player-profile.html"],
      powered_by: ["statscore-role-access.js"],
      build_status: "PARTIAL"
    },

    "access-approved.html": {
      layer: "Access Approved",
      purpose: "Approved access confirmation and route continuation.",
      routes_to: ["player-profile.html"],
      powered_by: ["statscore-role-access.js"],
      build_status: "PARTIAL"
    },

    "visibility-rules.html": {
      layer: "Visibility Governance",
      purpose: "Controls profile visibility, recruiter access, media exposure, and permission rules.",
      routes_to: ["parent-approval.html", "profile-access.html"],
      powered_by: ["statscore-governance-sync-engine.js", "statscore-role-access.js"],
      build_status: "PARTIAL"
    },

    "message-windows.html": {
      layer: "Communication Windows",
      purpose: "Messaging window/status control, especially recruiter-athlete communication permissions.",
      routes_to: ["multi-box.html"],
      powered_by: ["statscore-multi-box-governance-engine.js"],
      build_status: "PARTIAL"
    },

    "audit-trail.html": {
      layer: "Audit / Receipts",
      purpose: "System receipts, activity trail, visibility trace, communication trace, and governance audit.",
      routes_to: ["system.html"],
      powered_by: ["statscore-receipt-ledger-engine.js"],
      build_status: "PARTIAL"
    },

    "system.html": {
      layer: "Admin / Back Office",
      purpose: "Back office command surface for admin/system operations.",
      routes_to: ["audit-trail.html", "visibility-rules.html", "multi-box.html"],
      powered_by: [
        "statscore-doctrine.js",
        "statscore-system-map.js",
        "statscore-engine-registry.js",
        "statscore-engine-health.js"
      ],
      build_status: "PARTIAL",
      do_not_drift: "System.html is not Athlete Dashboard."
    },

    "opportunities.html": {
      layer: "Opportunity Intelligence",
      purpose: "Recommended future page for programs, camps, showcases, recruiter targets, and best-fit opportunities.",
      routes_to: ["events.html", "college-pathway.html", "media.html"],
      powered_by: [
        "statscore-recommendation-engine.js",
        "statscore-event-engine.js",
        "statscore-pathway-engine.js"
      ],
      build_status: "MISSING"
    },

    "action-plan.html": {
      layer: "Action Plan Intelligence",
      purpose: "Recommended future page for prioritized athlete next actions.",
      routes_to: ["athlete-dashboard.html"],
      powered_by: [
        "statscore-recommendation-engine.js",
        "statscore-readiness-engine.js",
        "statscore-pathway-engine.js"
      ],
      build_status: "MISSING"
    }
  },

  failsafe: {
    startup_instruction: [
      "Read statscore-doctrine.js.",
      "Read statscore-system-map.js.",
      "Read statscore-athlete-efbp-map.js.",
      "Read statscore-page-map.js.",
      "Read statscore-engine-registry.js if engine work is required."
    ],
    before_page_edit: [
      "Find page in STATSCORE_PAGE_MAP.pages.",
      "Confirm purpose, layer, routes_to, powered_by, and build_status.",
      "If missing, add page map first.",
      "Preserve shell unless redesign is explicitly ordered.",
      "Activate functionality according to mapped purpose."
    ]
  }
};

console.info("STATS-CORE Page Map loaded:", window.STATSCORE_PAGE_MAP.map_version); 
