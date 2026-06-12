window.STATSCORE_ATHLETE_EFBP_MAP = {
  map_version: "v1.0",
  map_status: "ACTIVE",
  doctrine: "EFBP — End From Beginning Protocol",

  prime_objective:
    "Help the athlete understand reality, avoid pathway mismatch, overcome invisibility, and reach the highest-probability opportunity available to them.",

  build_rule:
    "Do not build pages first. Start with the athlete question, then map the required answer, intelligence layer, engines, dashboard box, deep page, and build status.",

  athlete_questions: {
    athletic_standing: {
      athlete_question: "How good am I really?",
      desired_answer:
        "Current athletic standing, competitive level, strengths, weaknesses, verified production, and comparable athlete context.",
      intelligence_layer: "Production Intelligence",
      dashboard_box: "Athletic Standing",
      deep_page: "player-profile.html",
      engines: [
        "statscore-production-matrix.js",
        "statscore-profile-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Render athletic standing from snapshot_id and verified source data. Explain what the production means, not just what the numbers are."
    },

    development_trajectory: {
      athlete_question: "Am I improving?",
      desired_answer:
        "Year-over-year growth, improvement curve, plateau/regression detection, coachability indicators, and future upside.",
      intelligence_layer: "Development Potential Intelligence",
      dashboard_box: "Performance Trend / Readiness",
      deep_page: "readiness.html",
      engines: [
        "statscore-readiness-engine.js",
        "statscore-production-matrix.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Show whether athlete output is increasing, flat, or declining. Identify if the athlete is still ascending."
    },

    pathway_fit: {
      athlete_question: "Where should I go?",
      desired_answer:
        "Highest-probability pathway: FBS, FCS, D2, D3, NAIA, JUCO, transfer, development route, or academic route, with explanation.",
      intelligence_layer: "Pathway Intelligence",
      dashboard_box: "College Pathway",
      deep_page: "college-pathway.html",
      engines: [
        "statscore-pathway-engine.js",
        "statscore-pathway-intelligence-engine.js",
        "statscore-production-matrix.js",
        "statscore-academic-matrix.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Explain why a pathway is best, not merely label the athlete. D2, NAIA, and JUCO must be explained as strategic pathways, not failures."
    },

    exposure_visibility: {
      athlete_question: "Who knows I exist?",
      desired_answer:
        "Visibility level, social/media reach, profile discovery, recruiter views, market awareness, and signal-distribution gaps.",
      intelligence_layer: "Exposure Intelligence",
      dashboard_box: "Exposure Score",
      deep_page: "media.html",
      engines: [
        "statscore-media-intelligence-engine.js",
        "statscore-media-routing.js",
        "statscore-recruiting-interest-registry.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "NEEDS FUNCTIONAL BUILD",
      stream_objective:
        "Detect underexposed athletes whose production exceeds visibility. Route media/headshot/social data from Snapshot Intake into PHNX Sports exposure outputs."
    },

    opportunity_gap: {
      athlete_question: "What opportunities am I missing?",
      desired_answer:
        "Programs, camps, combines, showcases, regions, recruiters, and opportunity channels that fit the athlete but have not yet been reached.",
      intelligence_layer: "Opportunity Intelligence",
      dashboard_box: "Opportunities / Events",
      deep_page: "events.html",
      recommended_future_page: "opportunities.html",
      engines: [
        "statscore-event-engine.js",
        "statscore-camp-combine-intelligence-engine.js",
        "statscore-pathway-engine.js",
        "statscore-media-routing.js"
      ],
      build_status: "PARTIAL / FUTURE PAGE LIKELY NEEDED",
      stream_objective:
        "Convert athlete profile into recommended events, camps, showcases, programs, and exposure actions."
    },

    eligibility_survival: {
      athlete_question: "Can I stay eligible and keep my pathway open?",
      desired_answer:
        "Academic standing, NCAA/NAIA/NJCAA risk, missing requirements, transcript status, GPA risk, and correction path.",
      intelligence_layer: "Eligibility Intelligence",
      dashboard_box: "Eligibility Status / Academic Standing",
      deep_page: "eligibility.html",
      engines: [
        "statscore-academic-matrix.js",
        "statscore-eligibility-engine.js",
        "statscore-ncaa-eligibility-intelligence-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Explain eligibility in plain athlete language: where they stand, what is missing, what can derail them, and who must help."
    },

    verification_trust: {
      athlete_question: "Can my numbers and claims be trusted?",
      desired_answer:
        "Verification status for stats, film, measurements, academics, awards, coach input, and evaluator input.",
      intelligence_layer: "Verification / Evidence Intelligence",
      dashboard_box: "Verification",
      deep_page: "verification.html",
      engines: [
        "statscore-verification-engine.js",
        "statscore-evidence-engine.js",
        "statscore-receipt-ledger-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Build trust chain. Every claim should show source, status, and confidence."
    },

    support_network: {
      athlete_question: "Who can help me and what should they do?",
      desired_answer:
        "Parent, coach, counselor, evaluator, recruiter, and program support roles tied to specific athlete needs.",
      intelligence_layer: "Role Support Intelligence",
      dashboard_box: "Support Network / Multi-Box",
      deep_page: "multi-box.html",
      engines: [
        "statscore-communication-engine.js",
        "statscore-multi-box-governance-engine.js",
        "statscore-role-access.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Route athletes to the correct support role without allowing any single role to control the athlete narrative."
    },

    parent_release: {
      athlete_question: "Who is allowed to see or act on my profile?",
      desired_answer:
        "Guardian approval status, visibility permissions, recruiter access status, media exposure permissions, and communication release.",
      intelligence_layer: "Release Governance",
      dashboard_box: "Parent Gate / Access",
      deep_page: "parent-approval.html",
      engines: [
        "statscore-parent-approval-engine.js",
        "statscore-role-access.js",
        "statscore-governance-sync-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Ensure athlete visibility, recruiter access, and media exposure are governed by approval and audit rules."
    },

    action_plan: {
      athlete_question: "What should I do next?",
      desired_answer:
        "A clear prioritized action plan tied to athletic development, academics, exposure, verification, and pathway movement.",
      intelligence_layer: "Action Plan Intelligence",
      dashboard_box: "Next Steps",
      deep_page: "MISSING",
      recommended_future_page: "action-plan.html",
      engines: [
        "statscore-recommendation-engine.js",
        "statscore-pathway-engine.js",
        "statscore-readiness-engine.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "MISSING",
      stream_objective:
        "Create the athlete's prioritized next-action system. This should turn intelligence into execution."
    },

    full_story: {
      athlete_question: "Explain everything to me.",
      desired_answer:
        "Complete athlete story: standing, evidence, trajectory, risks, pathway, exposure, recommendations, and next steps.",
      intelligence_layer: "Crystal Report / Explainability",
      dashboard_box: "Crystal Report",
      deep_page: "crystal-report.html",
      engines: [
        "statscore-crystal-engine.js",
        "statscore-crystal-reports.js",
        "statscore-explainability-engine.js"
      ],
      build_status: "PARTIAL",
      stream_objective:
        "Generate a full athlete intelligence report from registry, profile, verification, matrices, and engines."
    }
  },

  failsafe_rules: [
    "Every Athlete Dashboard box must map to an athlete question.",
    "Every athlete question must map to a desired answer.",
    "Every desired answer must map to a deep page, engine, or missing build requirement.",
    "Do not overload the Athlete Dashboard.",
    "Dashboard remains navigation and awareness layer only.",
    "Deep pages reveal the full intelligence/resource layer.",
    "No athlete-specific data may be hardcoded into static HTML.",
    "All athlete data must render by snapshot_id from registry/source records.",
    "Coach input is contributor data only, not final truth.",
    "Evidence, verification, and explainability govern system conclusions.",
    "If a dashboard box does not answer a real athlete question, remove or redefine it.",
    "If an athlete question has no page or engine, mark it MISSING before building."
  ]
};

console.info(
  "STATS-CORE Athlete EFBP Map loaded:",
  window.STATSCORE_ATHLETE_EFBP_MAP.map_version
); 
