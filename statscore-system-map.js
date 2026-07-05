/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-system-map.js

Asset Type:
JavaScript Registry / System Map

Owner Stream:
Master Integration

Primary Operational Authority:
Master Integration

Layer:
Governance / System Topology

Runtime Owner:
Master Integration Runtime

Primary Consumers:
- system.html
- statscore-engine-loader.js
- statscore-engine-registry.js
- statscore-system-operations-map.js
- Stream startup governance

Purpose:
Defines the official system topology for STATS-CORE.
Provides the canonical map of pages, roles, flows,
system areas, and high-level architectural authority.

Consumes:
- STATS-CORE Canon
- Stream Registry
- Page Registry
- Engine Registry
- Runtime Governance

Provides:
- System structure reference
- Page and Stream relationship authority
- Top-level operational map
- Integration guidance for Master Integration

Primary IDs:
- athlete_id
- snapshot_id
- role
- role_id
- system_state

Cross-Stream Dependencies:
May reference all Streams for mapping purposes.
May not implement another Stream's business logic.

Does NOT:
- Perform athlete scoring
- Calculate intelligence
- Render dashboards
- Execute routing
- Modify Supabase records
- Own page runtime behavior
- Generate recommendations
- Execute communication logic

Status:
CANON LOCKED

Last Governance Review:
2026-07-05

==========================================================
*/

window.STATSCORE_SYSTEM_MAP = {
  map_version: "v1.2",
  map_status: "ACTIVE",
  system_name: "STATS-CORE",
  system_identity: "Athlete Lifecycle Intelligence System",

  prime_directive: {
    shell_status: "BUILT",
    build_mode: "FUNCTIONAL_ACTIVATION_ONLY",
    rule: "Do not rebuild existing shells. Activate functionality inside the existing page structure.",
    athlete_data_rule: "No athlete-specific data may permanently live inside static HTML pages. Athlete data must load by snapshot_id from registry/source records."
  },

  required_startup_files: [
    "statscore-doctrine.js",
    "statscore-system-map.js",
    "statscore-athlete-efbp-map.js",
    "statscore-page-map.js",
    "statscore-dashboard-map.js",
    "statscore-engine-registry.js",
    "statscore-routing.js"
  ],

  core_doctrine: {
    dashboard: "Navigation and awareness layer only",
    player_profile: "Explainable athlete intelligence layer",
    snapshot_intake: "Athlete source-data intake layer",
    media_ingest: "Official headshot, media, film, social, and PHNX Sports routing origin layer",
    multibox: "Governed communication layer",
    system: "Back office/admin layer",
    phnx_sports: "Exposure, rendering, packaging, and channel-output layer",
    crystal_reports: "Matching and reporting layer"
  },

  master_flows: {
    public_entry_flow: ["index.html", "login.html"],

    athlete_flow: [
      "login.html",
      "snapshot-intake.html",
      "athlete-dashboard.html",
      "player-profile.html"
    ],

    non_athlete_role_flow: [
      "login.html",
      "role-dashboard-intake.html",
      "role-dashboard.html",
      "role-specific-tools"
    ],

    admin_flow: ["login.html", "system.html"],

    athlete_data_flow: [
      "snapshot-intake.html",
      "snapshot_id",
      "registry/source record",
      "athlete-dashboard.html",
      "player-profile.html",
      "deeper intelligence pages",
      "PHNX Sports exposure outputs"
    ],

    media_flow: [
      "snapshot-intake.html",
      "media / film ingest",
      "official headshot",
      "highlight links",
      "social links",
      "recruiting links",
      "media intelligence engine",
      "PHNX Sports routing",
      "player cards / thumbnails / reels / exposure assets"
    ],

    communication_flow: [
      "role dashboard",
      "multi-box.html",
      "message-windows.html",
      "audit-trail.html"
    ]
  },

  pages: {
    "index.html": {
      role: "Public Entry",
      layer: "Entry",
      purpose: "Public-facing entry point into STATS-CORE.",
      flow_group: "public_entry_flow",
      next: ["login.html"],
      data_rule: "No athlete record storage."
    },

    "login.html": {
      role: "All Roles",
      layer: "Authentication / Role Detection",
      purpose: "Detect user role and route to correct intake/dashboard path.",
      next: ["snapshot-intake.html", "role-dashboard-intake.html", "system.html"],
      rule: "Athlete routes to Snapshot Intake. Non-athlete roles route to universal role intake. Admin routes to System Operations."
    },

    "privacy.html": {
      role: "Public",
      layer: "Public Legal / Privacy",
      purpose: "Public-facing privacy policy and data protection notice.",
      next: ["index.html", "login.html", "terms.html"],
      data_rule: "Public information page only. Does not authenticate users, modify records, or generate intelligence."
    },

    "terms.html": {
      role: "Public",
      layer: "Public Legal / Terms",
      purpose: "Public-facing terms of service.",
      next: ["index.html", "login.html", "privacy.html"],
      data_rule: "Public information page only. Does not authenticate users, modify records, or generate intelligence."
    },

    "snapshot-intake.html": {
      role: "Athlete",
      layer: "Source Intake",
      purpose: "Creates athlete source record, snapshot_id, initial score state, official headshot/media ingest, and routing foundation.",
      previous: ["login.html"],
      next: ["athlete-dashboard.html", "player-profile.html", "parent-approval.html", "verification-request.html"],
      source_of_truth: true,
      owns: [
        "athlete identity",
        "physical profile",
        "performance metrics",
        "academic readiness",
        "media/film links",
        "official headshot",
        "guardian/coach verification request data"
      ],
      must_create_or_use: ["snapshot_id"],
      connected_engines: [
        "statscore-data.js",
        "statscore-routing.js",
        "statscore-media-routing.js",
        "statscore-parent-approval-engine.js",
        "statscore-verification-engine.js"
      ],
      do_not_drift: [
        "Snapshot Intake is the beginning of athlete source input.",
        "Media ingest establishes the official headshot and media assets.",
        "This page must not become a permanent athlete profile page."
      ]
    },

    "athlete-dashboard.html": {
      role: "Athlete",
      layer: "Navigation / Awareness",
      purpose: "Athlete command dashboard. Displays summary cards and routes into deeper intelligence layers.",
      previous: ["snapshot-intake.html"],
      next: [
        "player-profile.html",
        "eligibility.html",
        "readiness.html",
        "college-pathway.html",
        "media.html",
        "crystal-report.html",
        "multi-box.html",
        "parent-approval.html",
        "events.html",
        "verification.html"
      ],
      data_rule: "Must render athlete information dynamically by snapshot_id. No permanent hardcoded athlete records.",
      connected_engines: [
        "statscore-doctrine.js",
        "statscore-system-map.js",
        "statscore-athlete-efbp-map.js",
        "statscore-page-map.js",
        "statscore-dashboard-map.js",
        "statscore-engine-registry.js",
        "statscore-engine-execution.js",
        "statscore-production-matrix.js",
        "statscore-academic-matrix.js",
        "statscore-recruiting-interest-registry.js"
      ],
      dashboard_card_routes: {
        eligibility_status: "eligibility.html",
        exposure_score: "media.html",
        recruiting_readiness: "college-pathway.html",
        performance_trend: "readiness.html",
        profile_completeness: "action-plan.html",
        crystal_reports: "crystal-report.html",
        multibox_communication: "multi-box.html",
        upcoming_events: "events.html",
        parent_gate: "parent-approval.html",
        verification: "verification.html"
      },
      do_not_drift: [
        "Dashboard is navigation only.",
        "Dashboard consumes intelligence; it does not own intelligence.",
        "Each dashboard box must route to a deeper intelligence/function layer."
      ]
    },

    "player-profile.html": {
      role: "Athlete / Approved Viewers",
      layer: "Explainable Athlete Intelligence",
      purpose: "Deep athlete intelligence record rendered from snapshot_id and registry/source data.",
      previous: ["athlete-dashboard.html", "profile-access.html"],
      next: ["crystal-report.html", "verification-request.html", "parent-approval.html"],
      data_rule: "Must pull athlete data dynamically by snapshot_id. No permanent player-specific HTML.",
      connected_engines: [
        "statscore-player-profile-runtime.js",
        "statscore-profile-engine.js",
        "statscore-production-matrix.js",
        "statscore-academic-matrix.js",
        "statscore-explainability-engine.js",
        "statscore-evidence-engine.js"
      ],
      do_not_drift: [
        "Player Profile is the explainable intelligence layer.",
        "This page explains why the athlete has the displayed status, score, readiness, and pathway."
      ]
    },

    "role-dashboard-intake.html": {
      role: "Professional",
      layer: "Professional Role Intake",
      purpose: "Captures professional role identity/context after login and prepares professional operating context.",
      previous: ["login.html"],
      next: ["role-dashboard.html"],
      connected_engines: ["statscore-routing.js", "statscore-role-access.js"],
      rule: "All non-athlete professional roles route through this intake page."
    },

    "role-dashboard.html": {
      role: "Professional",
      layer: "Professional Operations Dashboard",
      purpose: "Shared professional operating environment for authenticated professional users.",
      previous: ["role-dashboard-intake.html"],
      next: [
        "parent.html",
        "coach.html",
        "counselor.html",
        "recruiter-access.html",
        "evaluator.html",
        "program.html",
        "multi-box.html"
      ],
      connected_engines: ["statscore-routing.js", "statscore-role-access.js"],
      rule: "Dashboard behavior follows role context, credential status, sport scope, position/event scope, and permissions."
    },

    "multi-box.html": {
      role: "All Authorized Roles",
      layer: "Governed Communication",
      purpose: "Role-aware communication routing, permission-based messaging, and audit receipt infrastructure.",
      connected_engines: [
        "statscore-communication-engine.js",
        "statscore-multi-box-governance-engine.js",
        "statscore-receipt-ledger-engine.js"
      ],
      do_not_drift: [
        "Multi-Box is not a dashboard.",
        "FROM role is logged-in role.",
        "TO role/user is selected recipient.",
        "Communication window governs routing."
      ]
    },

    "system.html": {
      role: "Admin / Back Office",
      layer: "Back Office/Admin",
      purpose: "Administrative command surface for system oversight.",
      previous: ["login.html"],
      do_not_drift: [
        "System.html is not the athlete dashboard.",
        "System.html is the back office/admin layer."
      ]
    },

    "parent-approval.html": {
      role: "Parent / Guardian",
      layer: "Release Governance",
      purpose: "Parent/guardian approval, denial, modification, and release control.",
      connected_engines: ["statscore-parent-approval-engine.js"],
      do_not_drift: [
        "Parent release governs visibility, recruiting access, messaging access, media exposure, counselor access, and profile participation."
      ]
    },

    "parent-dashboard.html": {
      role: "Parent / Guardian",
      layer: "Role Dashboard",
      purpose: "Parent/guardian command dashboard after role intake."
    },

    "parent.html": {
      role: "Parent / Guardian",
      layer: "Guardian Tool Room",
      purpose: "Guardian approval and access operations."
    },

    "parent-notices.html": {
      role: "Parent / Guardian",
      layer: "Guardian Notices",
      purpose: "Parent/guardian notices and unread approval/action items."
    },

    "coach.html": {
      role: "Coach",
      layer: "Role Tool Room",
      purpose: "Coach-facing athlete support, evaluation, and verification surface.",
      do_not_drift: [
        "Coach is a contributor, not the system authority.",
        "Coach input may support athlete intelligence but cannot become final truth without evidence."
      ]
    },

    "counselor.html": {
      role: "Counselor",
      layer: "Role Tool Room",
      purpose: "Academic, eligibility, transcript, and counselor support surface."
    },

    "counselor-access.html": {
      role: "Counselor",
      layer: "Access Control",
      purpose: "Counselor access request and authorization surface."
    },

    "recruiter-access.html": {
      role: "Recruiter",
      layer: "Recruiting Access",
      purpose: "Recruiter visibility and access surface governed by parent release and communication permissions."
    },

    "recruiter-request.html": {
      role: "Recruiter",
      layer: "Recruiting Request",
      purpose: "Recruiter request initiation and controlled access path."
    },

    "program.html": {
      role: "Program",
      layer: "Program Intelligence",
      purpose: "Program-level intelligence, roster/pathway, sustainability, and athlete fit surface."
    },

    "evaluator.html": {
      role: "Evaluator",
      layer: "Evaluation",
      purpose: "Evaluator review, verification, and athlete assessment surface."
    },

    "eligibility.html": {
      role: "Athlete / Counselor / Admin",
      layer: "Eligibility Intelligence",
      purpose: "Eligibility standing, risk flags, correction path, and verification guidance.",
      connected_engines: [
        "statscore-eligibility-engine.js",
        "statscore-ncaa-eligibility-intelligence-engine.js",
        "statscore-academic-matrix.js"
      ]
    },

    "readiness.html": {
      role: "Athlete / Coach / Evaluator",
      layer: "Readiness Intelligence",
      purpose: "Development readiness, performance trend, and next-movement guidance.",
      connected_engines: ["statscore-readiness-engine.js"]
    },

    "college-pathway.html": {
      role: "Athlete / Counselor / Recruiter",
      layer: "Pathway Intelligence",
      purpose: "Best probability pathway based on athletic, academic, eligibility, visibility, development, and fit signals.",
      connected_engines: [
        "statscore-pathway-engine.js",
        "statscore-pathway-intelligence-engine.js",
        "statscore-production-matrix.js",
        "statscore-academic-matrix.js",
        "statscore-explainability-engine.js"
      ]
    },

    "crystal-registry.html": {
      role: "System / Athlete Intelligence",
      layer: "Persistent Registry",
      purpose: "Persistent athlete intelligence identity registry."
    },

    "crystal-report.html": {
      role: "Athlete / Recruiter / Program / Counselor",
      layer: "Report Output",
      purpose: "Generated intelligence report derived from registry, profile, verification, matrices, and engines.",
      connected_engines: [
        "statscore-crystal-engine.js",
        "statscore-crystal-reports.js",
        "statscore-explainability-engine.js"
      ]
    },

    "media.html": {
      role: "Athlete / PHNX Sports",
      layer: "Media / Exposure",
      purpose: "Media intelligence, exposure routing, and PHNX Sports channel asset preparation.",
      connected_engines: [
        "statscore-media-intelligence-engine.js",
        "statscore-media-routing.js"
      ]
    },

    "events.html": {
      role: "Athlete / System",
      layer: "Events / Opportunities",
      purpose: "Camps, combines, showcases, calendar events, and athlete opportunity routing.",
      connected_engines: ["statscore-event-engine.js"]
    },

    "rankings.html": {
      role: "Public / Athlete / Recruiter",
      layer: "Rankings",
      purpose: "Rankings must explain why; rankings cannot exist without explainability.",
      connected_engines: [
        "statscore-phnx-ranking-engine.js",
        "statscore-explainability-engine.js"
      ]
    },

    "profile-access.html": {
      role: "Authorized Viewer",
      layer: "Profile Access",
      purpose: "Controlled profile access gateway."
    },

    "access-approved.html": {
      role: "Authorized Viewer",
      layer: "Access Approval",
      purpose: "Approved access confirmation and routing."
    },

    "verification.html": {
      role: "Coach / Counselor / Evaluator / Admin",
      layer: "Verification",
      purpose: "Trust layer for confirming athlete evidence, metrics, academic status, source claims, and profile validity.",
      connected_engines: [
        "statscore-verification-engine.js",
        "statscore-evidence-engine.js"
      ]
    },

    "verification-request.html": {
      role: "Athlete / Coach / Counselor / Evaluator",
      layer: "Verification Request",
      purpose: "Request verification from trusted parties."
    },

    "visibility-rules.html": {
      role: "System / Parent / Admin",
      layer: "Visibility Governance",
      purpose: "Controls profile visibility, release rules, recruiting visibility, media exposure, and access constraints."
    },

    "audit-trail.html": {
      role: "Admin / System",
      layer: "Audit",
      purpose: "Receipts, traceability, system activity trail, and governance proof.",
      connected_engines: ["statscore-receipt-ledger-engine.js"]
    },

    "opportunities.html": {
      role: "Athlete / System",
      layer: "Opportunity Intelligence",
      purpose: "Recommended future page for best-fit programs, camps, showcases, recruiter targets, and opportunity channels.",
      build_status: "MISSING"
    },

    "action-plan.html": {
      role: "Athlete",
      layer: "Action Plan Intelligence",
      purpose: "Recommended future page for prioritized next actions across academics, development, exposure, verification, and pathway.",
      build_status: "MISSING"
    }
  },

  engines: {
    governance_and_core: [
      "statscore-doctrine.js",
      "statscore-system-map.js",
      "statscore-athlete-efbp-map.js",
      "statscore-page-map.js",
      "statscore-dashboard-map.js",
      "statscore-core.js",
      "statscore-data.js",
      "statscore-routing.js",
      "statscore-role-access.js",
      "statscore-runtime-state-engine.js",
      "statscore-governance-sync-engine.js"
    ],

    runtime_stack: [
      "statscore-engine-bus.js",
      "statscore-engine-loader.js",
      "statscore-engine-registry.js",
      "statscore-engine-execution.js",
      "statscore-engine-health.js",
      "statscore-self-healing-engine.js",
      "statscore-runtime-integration-test-pack.js"
    ],

    athlete_intelligence: [
      "statscore-production-matrix.js",
      "statscore-academic-matrix.js",
      "statscore-position-matrix-engine.js",
      "statscore-football-scoring-engine.js",
      "statscore-scoring-engine.js",
      "statscore-trait-render-engine.js",
      "statscore-synthesis-engine.js",
      "statscore-consensus-engine.js",
      "statscore-recommendation-engine.js",
      "statscore-explainability-engine.js"
    ],

    profile_and_registry: [
      "statscore-profile-engine.js",
      "statscore-player-profile-runtime.js",
      "statscore-dynamic-athlete-engine.js",
      "statscore-athlete-search-engine.js",
      "statscore-crystal-engine.js",
      "statscore-crystal-reports.js"
    ],

    eligibility_and_pathway: [
      "statscore-eligibility-engine.js",
      "statscore-ncaa-eligibility-intelligence-engine.js",
      "statscore-quarterly-eligibility-engine.js",
      "statscore-pathway-engine.js",
      "statscore-pathway-intelligence-engine.js",
      "statscore-readiness-engine.js"
    ],

    media_and_exposure: [
      "statscore-media-intelligence-engine.js",
      "statscore-media-routing.js",
      "statscore-phnx-ranking-engine.js"
    ],

    communication_and_access: [
      "statscore-communication-engine.js",
      "statscore-multi-box-governance-engine.js",
      "statscore-parent-approval-engine.js",
      "statscore-recruiting-interest-registry.js",
      "statscore-recruiter-verification-engine.js"
    ],

    trust_and_evidence: [
      "statscore-verification-engine.js",
      "statscore-evidence-engine.js",
      "statscore-compliance-engine.js",
      "statscore-signal-governance.js",
      "statscore-receipt-ledger-engine.js"
    ],

    role_engines: [
      "statscore-evaluator-engine.js",
      "statscore-program-intelligence-engine.js",
      "statscore-camp-combine-intelligence-engine.js",
      "statscore-event-engine.js"
    ]
  },

  stream_failsafes: {
    before_editing_any_page: [
      "Read statscore-doctrine.js.",
      "Read statscore-system-map.js.",
      "Read statscore-athlete-efbp-map.js.",
      "Read statscore-page-map.js.",
      "Read statscore-dashboard-map.js.",
      "Confirm the page exists in STATSCORE_PAGE_MAP.pages.",
      "Confirm page layer, purpose, route, powered_by engines, and build_status before editing.",
      "If editing athlete-dashboard.html, confirm the dashboard card exists in STATSCORE_DASHBOARD_MAP.dashboard_cards.",
      "Preserve existing shell unless user explicitly orders redesign.",
      "Do not hardcode athlete-specific records.",
      "If page map is missing or incomplete, update the map first.",
      "If dashboard card map is missing or incomplete, update the dashboard map first.",
      "If editing dashboard cards, preserve Dashboard = Navigation Layer doctrine.",
      "If editing athlete data rendering, route by snapshot_id from registry/source."
    ],

    before_editing_any_engine: [
      "Read statscore-doctrine.js.",
      "Read statscore-system-map.js.",
      "Read statscore-engine-registry.js.",
      "Confirm the engine belongs to a mapped engine category.",
      "Confirm the engine supports a mapped page, dashboard card, or athlete EFBP question.",
      "Do not create duplicate engines when existing matrix/engine logic already supports the function.",
      "If new engine is required, update statscore-system-map.js and statscore-engine-registry.js."
    ],

    prohibited_actions: [
      "Do not rebuild shells already built.",
      "Do not make athlete-specific static HTML pages permanent.",
      "Do not merge Dashboard and Player Profile responsibilities.",
      "Do not make Multi-Box a dashboard.",
      "Do not allow exposure to equal recruiter interest.",
      "Do not allow communication to equal offer.",
      "Do not allow coach input to become final athlete truth without evidence.",
      "Do not remove mapping, doctrine, or governance scripts."
    ],

    missing_map_rule:
      "If a stream identifies that a page, engine, dashboard card, route, or athlete EFBP question is missing from the maps, it must generate the correct mapping before continuing code work."
  }
};

console.info("STATS-CORE System Map loaded:", window.STATSCORE_SYSTEM_MAP.map_version); 
