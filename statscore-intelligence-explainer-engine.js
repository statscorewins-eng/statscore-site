/* ============================================================
   STATS-CORE™
   Stream 3 — Athlete Intelligence
   File: statscore-intelligence-explainer-engine.js
   Purpose: Explain every score, signal, standing, risk,
            opportunity, and next action.
   Doctrine: No score may exist without an explainability path.
============================================================ */

(function () {
  "use strict";

  const ENGINE_NAME = "statscore-intelligence-explainer-engine.js";
  const STREAM = "STATS-CORE Stream 3 Athlete Intelligence";

  function getSnapshotId(explicitSnapshotId) {
    return (
      explicitSnapshotId ||
      new URLSearchParams(window.location.search).get("snapshot_id") ||
      localStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      null
    );
  }

  function authorityEngine() {
    return window.STATSCORE_SCORE_AUTHORITY_ENGINE || null;
  }

  function verificationEngine() {
    return window.STATSCORE_VERIFICATION_AUTHORITY_ENGINE || null;
  }

  function baseExplanation(snapshot_id, layer_key, label) {
    return {
      snapshot_id: getSnapshotId(snapshot_id),
      layer_key,
      label,

      current_standing: "Pending",
      score_breakdown: [],
      evidence_used: [],
      verification_status: "UNVERIFIED",
      confidence_level: "LOW",
      role_friendly_summary: {},
      risks: [],
      opportunities: [],
      next_actions: [],

      explanation_questions: {
        what_is_this: "",
        why_did_the_athlete_receive_this: "",
        what_evidence_created_it: "",
        what_does_it_mean: "",
        what_should_happen_next: ""
      },

      doctrine:
        "No score may exist without an explainability path."
    };
  }

  function roleSummaries(text) {
    return {
      athlete: text.athlete || "Review your standing and complete the next required action.",
      parent: text.parent || "Review what is true, safe, approved, and still needed.",
      coach: text.coach || "Review what needs development or verification.",
      counselor: text.counselor || "Review academic or eligibility blockers.",
      recruiter: text.recruiter || "Review athlete fit, evidence strength, and trust level.",
      evaluator: text.evaluator || "Review what evidence supports the current standing.",
      program: text.program || "Review whether this athlete fits the program pathway.",
      admin: text.admin || "Review system health, authority, and governance issues."
    };
  }

  function resolveVerification(context = {}) {
    const engine = verificationEngine();

    if (!engine) {
      return {
        verification_status: "UNVERIFIED",
        verification_color: "YELLOW",
        confidence_level: "LOW"
      };
    }

    const model = engine.resolveVerificationModel(context);

    return {
      verification_status: model.verification_status,
      verification_color: model.verification_color,
      confidence_level:
        model.verification_status === "VERIFIED" ? "HIGH" :
        model.verification_status === "HISTORICAL_VERIFIED_PRODUCTION_CASE" ? "HIGH" :
        model.verification_status === "PARTIAL" ? "MEDIUM" :
        "LOW"
    };
  }

  function explainAthleticScore(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "ATHLETIC_SCORE", "Athletic Score");
    const verification = resolveVerification(context);

    return {
      ...explanation,
      current_standing: context.current_standing || "Athletic profile pending full interpretation.",
      score_breakdown: context.score_breakdown || [
        "Position metrics",
        "Speed / explosiveness",
        "Agility",
        "Strength",
        "Sport-position fit"
      ],
      evidence_used: context.evidence_used || [
        "Snapshot athletic metrics",
        "Camp/combine metrics if available",
        "Position-specific athletic profile"
      ],
      verification_status: verification.verification_status,
      confidence_level: verification.confidence_level,
      role_friendly_summary: roleSummaries({
        athlete: "This shows how your measurable athletic profile supports your position evaluation.",
        parent: "This shows what athletic data exists and whether it is verified.",
        coach: "This highlights athletic tools that may support development or position fit.",
        recruiter: "This is a support signal, not the primary production ranking source.",
        evaluator: "This identifies measurable athletic traits requiring verification or review."
      }),
      risks: [
        "Snapshot metrics alone must not create production traits.",
        "Unverified metrics should not be treated as final evaluation evidence."
      ],
      opportunities: [
        "Complete verified testing.",
        "Attach camp/combine evidence.",
        "Compare athletic profile to position standards."
      ],
      next_actions: [
        "Confirm height, weight, position, and measurable metrics.",
        "Request certified evaluator or camp/combine verification if needed."
      ],
      explanation_questions: {
        what_is_this: "Athletic Score measures the athlete’s physical and position-related athletic profile.",
        why_did_the_athlete_receive_this: "It is based on measurable athletic inputs and position-fit signals.",
        what_evidence_created_it: "Snapshot metrics, testing data, camp/combine data, and position metric payloads.",
        what_does_it_mean: "It supports evaluation but does not replace verified competition production.",
        what_should_happen_next: "Verify metrics and connect them to the correct sport-position profile."
      }
    };
  }

  function explainProductionScore(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "PRODUCTION_SCORE", "Production Score");
    const verification = resolveVerification(context);

    return {
      ...explanation,
      current_standing: context.current_standing || "Production standing pending verified season records.",
      score_breakdown: context.score_breakdown || [
        "Season production",
        "Sustained production",
        "Position output",
        "Competition context",
        "Awards / recognition when supported"
      ],
      evidence_used: context.evidence_used || [
        "Athlete production records",
        "External evidence references",
        "Coach or official source verification when available"
      ],
      verification_status: verification.verification_status,
      confidence_level: verification.confidence_level,
      role_friendly_summary: roleSummaries({
        athlete: "This shows what you actually produced in competition.",
        parent: "This separates self-reported claims from verified production.",
        coach: "This identifies production that may need coach verification.",
        recruiter: "This is a primary ranking signal when evidence is strong.",
        evaluator: "This shows what output is supported and what still needs review."
      }),
      risks: [
        "Self-reported production cannot become green verified.",
        "Production without source evidence has lower confidence.",
        "Athletic metrics must not generate production traits."
      ],
      opportunities: [
        "Attach official stats, film, or box score evidence.",
        "Request coach or official source verification.",
        "Build sustained production history by season."
      ],
      next_actions: [
        "Review season ledger.",
        "Add evidence source references.",
        "Request verification from recognized authority."
      ],
      explanation_questions: {
        what_is_this: "Production Score reflects verified or self-reported competition output.",
        why_did_the_athlete_receive_this: "It is based on season production records and evidence strength.",
        what_evidence_created_it: "Production records, external evidence, official stat sources, or authorized verification.",
        what_does_it_mean: "Production drives ranking because it shows what happened in real competition.",
        what_should_happen_next: "Strengthen evidence and unlock verified production status."
      }
    };
  }

  function explainAcademicScore(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "ACADEMIC_SCORE", "Academic Score");

    return {
      ...explanation,
      current_standing: context.current_standing || "Academic standing pending transcript/core-course review.",
      score_breakdown: context.score_breakdown || [
        "GPA",
        "Core course progress",
        "Test scores if available",
        "Graduation track",
        "Academic access"
      ],
      evidence_used: context.evidence_used || [
        "Snapshot academic payload",
        "Transcript data if attached",
        "Core course status if available"
      ],
      verification_status: context.verification_status || "PENDING",
      confidence_level: context.confidence_level || "MEDIUM",
      role_friendly_summary: roleSummaries({
        athlete: "This shows how academics affect access and pathway options.",
        parent: "This shows whether academic items may block opportunity.",
        counselor: "This identifies eligibility and academic access risks.",
        recruiter: "This helps determine whether the athlete can meet program access requirements.",
        program: "This supports pathway fit and admissions/eligibility review."
      }),
      risks: [
        "Academics must not inflate athletic or production scores.",
        "Missing transcript/core-course data may block accurate eligibility routing."
      ],
      opportunities: [
        "Complete academic profile.",
        "Attach transcript/core-course status.",
        "Confirm NCAA / NAIA / NJCAA pathway requirements."
      ],
      next_actions: [
        "Update GPA and academic fields.",
        "Request counselor review if eligibility risk exists."
      ],
      explanation_questions: {
        what_is_this: "Academic Score reflects academic standing and access.",
        why_did_the_athlete_receive_this: "It is based on academic information available in the snapshot and academic payloads.",
        what_evidence_created_it: "GPA, transcript status, core course status, test scores, and academic profile data.",
        what_does_it_mean: "Academics affect pathway access but do not inflate athletic or production ranking.",
        what_should_happen_next: "Complete academic data and resolve eligibility blockers."
      }
    };
  }

  function explainEligibilityScore(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "ELIGIBILITY_SCORE", "Eligibility Score");

    return {
      ...explanation,
      current_standing: context.current_standing || "Eligibility standing pending academic/pathway review.",
      score_breakdown: context.score_breakdown || [
        "NCAA status",
        "NAIA status",
        "NJCAA status",
        "Core course standing",
        "Risk flags"
      ],
      evidence_used: context.evidence_used || [
        "Academic payload",
        "Eligibility engine output",
        "Core course / transcript status"
      ],
      verification_status: context.verification_status || "PENDING",
      confidence_level: context.confidence_level || "MEDIUM",
      role_friendly_summary: roleSummaries({
        athlete: "This shows whether eligibility issues could block your pathway.",
        parent: "This identifies academic/eligibility items that may need attention.",
        counselor: "This highlights eligibility risks and review needs.",
        recruiter: "This helps determine whether the athlete is pathway-accessible.",
        program: "This supports roster/pathway fit and risk assessment."
      }),
      risks: [
        "Incomplete academic data may hide eligibility risk.",
        "Eligibility issues can block opportunity even when production is strong."
      ],
      opportunities: [
        "Resolve missing academic fields.",
        "Confirm core course progress.",
        "Route to counselor review if needed."
      ],
      next_actions: [
        "Open Eligibility Intelligence.",
        "Review NCAA / NAIA / NJCAA status.",
        "Request counselor validation."
      ],
      explanation_questions: {
        what_is_this: "Eligibility Score reflects NCAA / NAIA / NJCAA pathway standing.",
        why_did_the_athlete_receive_this: "It is based on eligibility rules, academic profile data, and pathway requirements.",
        what_evidence_created_it: "Academic records, eligibility payloads, transcript/core-course indicators, and engine outputs.",
        what_does_it_mean: "It shows whether academic or eligibility issues may block athletic opportunity.",
        what_should_happen_next: "Resolve eligibility risks and confirm pathway access."
      }
    };
  }

  function explainExposureSignal(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "EXPOSURE_SIGNAL", "Exposure Signal");

    return {
      ...explanation,
      current_standing: context.current_standing || "Exposure signal pending media/activity evidence.",
      score_breakdown: context.score_breakdown || [
        "Profile visibility",
        "Media presence",
        "Recruiter/program views",
        "Watchlist activity",
        "Crystal support signals"
      ],
      evidence_used: context.evidence_used || [
        "Profile activity",
        "PHNX Sports media links",
        "Exposure registry activity",
        "Crystal support outputs"
      ],
      verification_status: context.verification_status || "PENDING",
      confidence_level: context.confidence_level || "LOW",
      role_friendly_summary: roleSummaries({
        athlete: "This shows whether your profile is being seen and supported by media/activity signals.",
        parent: "This shows visibility while preserving governance controls.",
        recruiter: "This provides exposure context but does not replace production evidence.",
        admin: "This helps monitor exposure flow without confusing it with verified interest."
      }),
      risks: [
        "Exposure is not the same as recruiting interest.",
        "Media visibility must not replace verified production."
      ],
      opportunities: [
        "Upload film.",
        "Connect PHNX Sports media.",
        "Route high-value profile materials to Crystal/Exposure stream."
      ],
      next_actions: [
        "Upload or connect verified film.",
        "Open PHNX Sports Media.",
        "Review exposure registry once activity exists."
      ],
      explanation_questions: {
        what_is_this: "Exposure Signal measures visibility and media/profile activity.",
        why_did_the_athlete_receive_this: "It is based on available media, profile activity, and exposure registry signals.",
        what_evidence_created_it: "Media links, activity logs, profile views, and Crystal support outputs.",
        what_does_it_mean: "It helps explain visibility but does not equal recruiting interest or verified production.",
        what_should_happen_next: "Improve profile media and connect exposure evidence."
      }
    };
  }

  function explainRecruitingReadiness(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "RECRUITING_READINESS", "Recruiting Readiness");

    return {
      ...explanation,
      current_standing: context.current_standing || "Recruiting readiness pending full intelligence review.",
      score_breakdown: context.score_breakdown || [
        "Production standing",
        "Verification strength",
        "Eligibility standing",
        "Academic access",
        "Profile completeness",
        "Exposure readiness"
      ],
      evidence_used: context.evidence_used || [
        "Production outputs",
        "Verification model",
        "Academic/eligibility outputs",
        "Profile completion data"
      ],
      verification_status: context.verification_status || "PENDING",
      confidence_level: context.confidence_level || "MEDIUM",
      role_friendly_summary: roleSummaries({
        athlete: "This tells you whether you are ready to be evaluated by programs.",
        parent: "This shows what must be completed before safe recruiting exposure.",
        coach: "This highlights verification or development steps needed.",
        counselor: "This flags academic or eligibility barriers.",
        recruiter: "This shows whether evidence is strong enough to evaluate fit.",
        program: "This helps determine whether the athlete is pathway-ready."
      }),
      risks: [
        "Strong athletic traits without verified production may reduce confidence.",
        "Eligibility gaps may block recruiting opportunity.",
        "Incomplete profile evidence may weaken evaluation."
      ],
      opportunities: [
        "Complete production verification.",
        "Resolve academic/eligibility issues.",
        "Improve profile completeness and media."
      ],
      next_actions: [
        "Open Recruiting Readiness.",
        "Complete missing evidence.",
        "Request verification where needed."
      ],
      explanation_questions: {
        what_is_this: "Recruiting Readiness explains whether the athlete is prepared for program evaluation.",
        why_did_the_athlete_receive_this: "It considers production, verification, eligibility, academics, profile completeness, and exposure readiness.",
        what_evidence_created_it: "Outputs from production, verification, academic, eligibility, and profile systems.",
        what_does_it_mean: "It shows what is ready, what is risky, and what should happen next.",
        what_should_happen_next: "Complete the highest-risk missing items first."
      }
    };
  }

  function explainProfileCompleteness(snapshot_id, context = {}) {
    const explanation = baseExplanation(snapshot_id, "PROFILE_COMPLETENESS", "Profile Completeness");

    return {
      ...explanation,
      current_standing: context.current_standing || "Profile completion pending required fields.",
      score_breakdown: context.score_breakdown || [
        "Identity fields",
        "Athletic profile",
        "Production records",
        "Academic data",
        "Media evidence",
        "Parent governance"
      ],
      evidence_used: context.evidence_used || [
        "Snapshot record",
        "Profile fields",
        "Production records",
        "Media links",
        "Parent approval status"
      ],
      verification_status: context.verification_status || "PENDING",
      confidence_level: context.confidence_level || "MEDIUM",
      role_friendly_summary: roleSummaries({
        athlete: "This shows what is missing from your profile.",
        parent: "This shows what still needs approval or completion.",
        coach: "This shows missing fields that affect evaluation.",
        recruiter: "This shows whether the profile has enough information to review.",
        admin: "This supports system readiness and governance review."
      }),
      risks: [
        "Incomplete profiles may reduce trust and visibility.",
        "Missing parent approval may restrict release.",
        "Missing evidence may limit evaluation confidence."
      ],
      opportunities: [
        "Complete required fields.",
        "Attach evidence.",
        "Confirm governance and profile release."
      ],
      next_actions: [
        "Open Profile Completion.",
        "Complete missing fields.",
        "Resolve parent approval and evidence gaps."
      ],
      explanation_questions: {
        what_is_this: "Profile Completeness measures whether the athlete profile has the required information and governance state.",
        why_did_the_athlete_receive_this: "It is based on filled fields, evidence, production records, media, and approval status.",
        what_evidence_created_it: "Snapshot data, profile fields, production records, media links, and parent approval state.",
        what_does_it_mean: "It shows whether the athlete profile is ready to be safely consumed by roles.",
        what_should_happen_next: "Complete missing profile, evidence, and approval items."
      }
    };
  }

  function explainLayer(snapshot_id, layer_key, context = {}) {
    const key = String(layer_key || "").toUpperCase();

    switch (key) {
      case "ATHLETIC_SCORE":
        return explainAthleticScore(snapshot_id, context);

      case "PRODUCTION_SCORE":
      case "PRODUCTION_INDEX":
        return explainProductionScore(snapshot_id, context);

      case "ACADEMIC_SCORE":
        return explainAcademicScore(snapshot_id, context);

      case "ELIGIBILITY_SCORE":
        return explainEligibilityScore(snapshot_id, context);

      case "EXPOSURE_SIGNAL":
        return explainExposureSignal(snapshot_id, context);

      case "RECRUITING_READINESS":
        return explainRecruitingReadiness(snapshot_id, context);

      case "PROFILE_COMPLETENESS":
        return explainProfileCompleteness(snapshot_id, context);

      default:
        return {
          ...baseExplanation(snapshot_id, key || "UNKNOWN_LAYER", "Unknown Intelligence Layer"),
          current_standing: "Blocked",
          risks: ["Requested intelligence layer does not have an approved explainability path."],
          next_actions: ["Register this layer before displaying it on a page."],
          explanation_questions: {
            what_is_this: "This layer is not registered for explainability.",
            why_did_the_athlete_receive_this: "No approved explanation path exists.",
            what_evidence_created_it: "No approved evidence path exists.",
            what_does_it_mean: "This score or signal should not be displayed yet.",
            what_should_happen_next: "Block display until the layer is registered and explained."
          }
        };
    }
  }

  function getDashboardExplainabilityModel(snapshot_id, context = {}) {
    const snapshotId = getSnapshotId(snapshot_id);

    return {
      snapshot_id: snapshotId,
      page: "athlete-dashboard.html",
      route_spine: [
        "Athlete Dashboard card",
        "Intelligence Center",
        "Explainability Layer",
        "Evidence Layer",
        "Next Action Layer"
      ],
      explanations: [
        explainAthleticScore(snapshotId, context.athletic || {}),
        explainProductionScore(snapshotId, context.production || {}),
        explainAcademicScore(snapshotId, context.academic || {}),
        explainEligibilityScore(snapshotId, context.eligibility || {}),
        explainExposureSignal(snapshotId, context.exposure || {}),
        explainRecruitingReadiness(snapshotId, context.readiness || {}),
        explainProfileCompleteness(snapshotId, context.profile || {})
      ]
    };
  }

  window.STATSCORE_INTELLIGENCE_EXPLAINER_ENGINE = {
    engine: ENGINE_NAME,
    stream: STREAM,

    explainLayer,
    explainAthleticScore,
    explainProductionScore,
    explainAcademicScore,
    explainEligibilityScore,
    explainExposureSignal,
    explainRecruitingReadiness,
    explainProfileCompleteness,
    getDashboardExplainabilityModel
  };

  console.info("[STATS-CORE] Intelligence Explainer Engine loaded.");
})(); 
