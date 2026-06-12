window.STATSCORE_DASHBOARD_MAP = {
  map_version: "v1.0",
  map_status: "ACTIVE",
  map_name: "STATS-CORE Athlete Dashboard Map",
  doctrine: "Every Athlete Dashboard card is a door into a deeper intelligence layer. Dashboard is navigation and awareness only.",

  global_rules: [
    "Do not overload the Athlete Dashboard.",
    "Every dashboard card must answer a real athlete question.",
    "Every dashboard card must route to a deeper page or mapped missing build.",
    "Dashboard cards summarize intelligence; they do not own intelligence.",
    "All card data must render by snapshot_id from registry/source records.",
    "If a card has no athlete question, remove it or redefine it.",
    "If a card has no deeper destination, mark the missing page/function before building."
  ],

  dashboard_cards: {
    athlete_profile_header: {
      card_label: "Athlete Profile Header",
      athlete_question: "Who am I in the system?",
      purpose: "Shows identity, sport, position, class, school, location, snapshot_id, profile status, and release status.",
      intelligence_layer: "Identity / Snapshot Registry",
      destination_page: "player-profile.html",
      engines: [
        "statscore-data.js",
        "statscore-profile-engine.js",
        "statscore-player-profile-runtime.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Render athlete header dynamically from snapshot_id. No hardcoded athlete identity."
    },

    statscore_snapshot_score: {
      card_label: "STATS-CORE / Snapshot Score",
      athlete_question: "What is my overall current standing?",
      purpose: "Displays current composite snapshot score and supporting category scores.",
      intelligence_layer: "Composite Athlete Intelligence",
      destination_page: "crystal-report.html",
      engines: [
        "statscore-production-matrix.js",
        "statscore-academic-matrix.js",
        "statscore-crystal-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Composite score must explain why. It cannot be a naked number."
    },

    eligibility_status: {
      card_label: "Eligibility Status",
      athlete_question: "Can I play and stay eligible?",
      purpose: "Summarizes academic and eligibility standing.",
      intelligence_layer: "Eligibility Intelligence",
      destination_page: "eligibility.html",
      engines: [
        "statscore-academic-matrix.js",
        "statscore-eligibility-engine.js",
        "statscore-ncaa-eligibility-intelligence-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Click opens eligibility explanation, risk, missing requirements, and correction path."
    },

    exposure_score: {
      card_label: "Exposure Score",
      athlete_question: "Who knows I exist?",
      purpose: "Summarizes visibility, media reach, profile discovery, and exposure gap.",
      intelligence_layer: "Exposure Intelligence",
      destination_page: "media.html",
      engines: [
        "statscore-media-intelligence-engine.js",
        "statscore-media-routing.js",
        "statscore-recruiting-interest-registry.js"
      ],
      build_status: "FUNCTIONAL_BUILD_NEEDED",
      stream_objective:
        "Detect underexposed athletes whose production exceeds visibility."
    },

    recruiting_readiness: {
      card_label: "Recruiting Readiness",
      athlete_question: "Would a college realistically recruit me today?",
      purpose: "Summarizes recruiting position, interest level, readiness, and market fit.",
      intelligence_layer: "Recruiting / Pathway Intelligence",
      destination_page: "college-pathway.html",
      secondary_destination_page: "recruiter-access.html",
      engines: [
        "statscore-pathway-engine.js",
        "statscore-recruiting-interest-registry.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Explain recruiting readiness using evidence, pathway fit, and verified interest."
    },

    performance_trend: {
      card_label: "Performance Trend",
      athlete_question: "Am I improving?",
      purpose: "Summarizes year-over-year development, growth curve, and trajectory.",
      intelligence_layer: "Development Trajectory Intelligence",
      destination_page: "readiness.html",
      engines: [
        "statscore-readiness-engine.js",
        "statscore-production-matrix.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Show whether athlete output is increasing, flat, or declining."
    },

    profile_completeness: {
      card_label: "Profile Completeness",
      athlete_question: "What is missing from my profile?",
      purpose: "Shows missing fields, incomplete evidence, missing verification, missing media, and incomplete actions.",
      intelligence_layer: "Profile Completion / Action Intelligence",
      destination_page: "action-plan.html",
      fallback_destination_page: "player-profile.html",
      engines: [
        "statscore-profile-engine.js",
        "statscore-recommendation-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "MISSING_DESTINATION",
      stream_objective:
        "Until action-plan.html exists, route to player-profile.html. Final destination should be action-plan.html."
    },

    performance_overview: {
      card_label: "Performance Overview",
      athlete_question: "What are my key athletic measurements?",
      purpose: "Summarizes verified athletic metrics and position-relevant traits.",
      intelligence_layer: "Production / Trait Intelligence",
      destination_page: "player-profile.html",
      secondary_destination_page: "readiness.html",
      engines: [
        "statscore-production-matrix.js",
        "statscore-position-matrix-engine.js",
        "statscore-trait-render-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Render verified metrics and explain which traits matter by sport/position."
    },

    academic_overview: {
      card_label: "Academic Overview",
      athlete_question: "Where do I stand academically?",
      purpose: "Summarizes GPA, test scores, class standing, transcript readiness, and academic risk.",
      intelligence_layer: "Academic Intelligence",
      destination_page: "eligibility.html",
      engines: [
        "statscore-academic-matrix.js",
        "statscore-eligibility-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Convert academic data into plain-language pathway impact."
    },

    athletic_snapshot: {
      card_label: "Athletic Snapshot",
      athlete_question: "What evidence shows what I can do?",
      purpose: "Shows film/evidence/media snapshot and connects performance to proof.",
      intelligence_layer: "Evidence / Media Intelligence",
      destination_page: "media.html",
      secondary_destination_page: "verification.html",
      engines: [
        "statscore-evidence-engine.js",
        "statscore-media-intelligence-engine.js",
        "statscore-verification-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Film and media must support athlete claims, not merely decorate the dashboard."
    },

    crystal_reports: {
      card_label: "Crystal Reports",
      athlete_question: "Can the system explain my full story?",
      purpose: "Routes to generated athlete intelligence report.",
      intelligence_layer: "Crystal Report / Explainability",
      destination_page: "crystal-report.html",
      engines: [
        "statscore-crystal-engine.js",
        "statscore-crystal-reports.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Crystal Report should combine standing, pathway, exposure, evidence, risk, and next steps."
    },

    recruiting_activity: {
      card_label: "Recruiting Activity",
      athlete_question: "Who is showing interest in me?",
      purpose: "Shows recruiter/program views, contact, requests, watchlist, and interest signals.",
      intelligence_layer: "Recruiting Interest Registry",
      destination_page: "recruiter-access.html",
      engines: [
        "statscore-recruiting-interest-registry.js",
        "statscore-recruiter-verification-engine.js",
        "statscore-receipt-ledger-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Separate exposure, interest, communication, offer, and commitment."
    },

    multibox_communication: {
      card_label: "Multi-Box Communication",
      athlete_question: "Who is communicating with me and who can help?",
      purpose: "Routes to governed role-based communication.",
      intelligence_layer: "Communication Governance",
      destination_page: "multi-box.html",
      engines: [
        "statscore-communication-engine.js",
        "statscore-multi-box-governance-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Multi-Box supports communication. It does not become a dashboard."
    },

    upcoming_events: {
      card_label: "Upcoming Events",
      athlete_question: "What events or opportunities should I know about?",
      purpose: "Shows camps, combines, showcases, tests, deadlines, and calendar opportunities.",
      intelligence_layer: "Event / Opportunity Intelligence",
      destination_page: "events.html",
      recommended_future_page: "opportunities.html",
      engines: [
        "statscore-event-engine.js",
        "statscore-camp-combine-intelligence-engine.js",
        "statscore-recommendation-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Events should become opportunity recommendations, not just calendar items."
    },

    activity_feed: {
      card_label: "Activity Feed",
      athlete_question: "What has changed in my profile?",
      purpose: "Shows updates, receipts, verification actions, media actions, profile changes, and system history.",
      intelligence_layer: "Audit / Receipt Intelligence",
      destination_page: "audit-trail.html",
      engines: [
        "statscore-receipt-ledger-engine.js",
        "statscore-governance-sync-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Activity feed must be traceable and auditable."
    },

    viewed_by_watchlist: {
      card_label: "Viewed By / Watchlist",
      athlete_question: "Who has seen me?",
      purpose: "Shows programs, recruiters, evaluators, or entities that viewed/watched/requested the athlete.",
      intelligence_layer: "Exposure / Recruiting Registry",
      destination_page: "recruiter-access.html",
      recommended_future_page: "watchlist.html",
      engines: [
        "statscore-recruiting-interest-registry.js",
        "statscore-media-intelligence-engine.js"
      ],
      build_status: "PARTIAL / FUTURE PAGE LIKELY NEEDED",
      stream_objective:
        "Distinguish profile views from true recruiting interest."
    },

    next_steps: {
      card_label: "Next Steps",
      athlete_question: "What should I do next?",
      purpose: "Shows prioritized next actions across academics, development, exposure, verification, and pathway.",
      intelligence_layer: "Action Plan Intelligence",
      destination_page: "action-plan.html",
      engines: [
        "statscore-recommendation-engine.js",
        "statscore-readiness-engine.js",
        "statscore-pathway-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "MISSING_DESTINATION",
      stream_objective:
        "Build action-plan.html as the execution layer for athlete next actions."
    },

    quick_actions_upload_film: {
      card_label: "Quick Action: Upload Film",
      athlete_question: "What evidence do I need to add?",
      purpose: "Routes athlete to media ingest or evidence upload.",
      intelligence_layer: "Media / Evidence Intake",
      destination_page: "media.html",
      fallback_destination_page: "snapshot-intake.html",
      engines: [
        "statscore-media-routing.js",
        "statscore-evidence-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Film upload must strengthen evidence and exposure pipeline."
    },

    quick_actions_add_achievement: {
      card_label: "Quick Action: Add Achievement",
      athlete_question: "What accomplishments should be added to my record?",
      purpose: "Captures awards, honors, recognitions, milestones, and verified achievements.",
      intelligence_layer: "Evidence Registry",
      destination_page: "verification.html",
      recommended_future_page: "achievements.html",
      engines: [
        "statscore-evidence-engine.js",
        "statscore-verification-engine.js",
        "statscore-receipt-ledger-engine.js"
      ],
      build_status: "PARTIAL / FUTURE PAGE LIKELY NEEDED",
      stream_objective:
        "Achievements must be source-attributed and verification-aware."
    },

    quick_actions_request_evaluation: {
      card_label: "Quick Action: Request Evaluation",
      athlete_question: "Who can independently evaluate me?",
      purpose: "Routes evaluation request to coach/evaluator/trusted verifier.",
      intelligence_layer: "Evaluator / Verification Intelligence",
      destination_page: "verification-request.html",
      secondary_destination_page: "evaluator.html",
      engines: [
        "statscore-evaluator-engine.js",
        "statscore-verification-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Evaluation should reduce single-source dependency and coach-only gatekeeping."
    },

    quick_actions_share_profile: {
      card_label: "Quick Action: Share Profile",
      athlete_question: "How do I send my profile to the right people?",
      purpose: "Controls profile sharing under visibility and guardian rules.",
      intelligence_layer: "Visibility / Access Governance",
      destination_page: "profile-access.html",
      engines: [
        "statscore-role-access.js",
        "statscore-governance-sync-engine.js",
        "statscore-receipt-ledger-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Sharing must be permissioned, logged, and governed."
    },

    quick_actions_view_snapshot_path: {
      card_label: "Quick Action: View Snapshot Path",
      athlete_question: "How did my current standing get created?",
      purpose: "Shows the path from intake to registry to dashboard to profile to deeper intelligence.",
      intelligence_layer: "Snapshot Trace / Explainability",
      destination_page: "crystal-registry.html",
      secondary_destination_page: "crystal-report.html",
      engines: [
        "statscore-crystal-engine.js",
        "statscore-receipt-ledger-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Show how athlete source data becomes system intelligence."
    }
  },

  build_status_summary: {
    complete: [],
    partial: [
      "athlete_profile_header",
      "statscore_snapshot_score",
      "eligibility_status",
      "recruiting_readiness",
      "performance_trend",
      "performance_overview",
      "academic_overview",
      "athletic_snapshot",
      "crystal_reports",
      "recruiting_activity",
      "multibox_communication",
      "upcoming_events",
      "activity_feed",
      "quick_actions_upload_film",
      "quick_actions_request_evaluation",
      "quick_actions_share_profile",
      "quick_actions_view_snapshot_path"
    ],
    functional_build_needed: [
      "exposure_score"
    ],
    missing_destination: [
      "profile_completeness",
      "next_steps"
    ],
    future_page_likely_needed: [
      "viewed_by_watchlist",
      "quick_actions_add_achievement"
    ]
  },

  failsafe_rules: [
    "If a dashboard card is edited, verify it exists in STATSCORE_DASHBOARD_MAP.dashboard_cards.",
    "If a dashboard card is missing from this map, map it before editing.",
    "If a dashboard card has no athlete_question, define one before building.",
    "If a dashboard card has no destination_page, mark destination as missing.",
    "If destination_page is MISSING, add it to STATSCORE_PAGE_MAP before creating it.",
    "Dashboard cards must remain summaries and routes, not full intelligence pages.",
    "No athlete data may be hardcoded into dashboard cards.",
    "Coach input may support cards but cannot become final truth."
  ]
};

console.info("STATS-CORE Dashboard Map loaded:", window.STATSCORE_DASHBOARD_MAP.map_version); 
