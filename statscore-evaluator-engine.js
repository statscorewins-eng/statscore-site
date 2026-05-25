/* ============================================================
   STATScore™ Evaluator Engine Spine
   File: statscore-evaluator-engine.js
   Version: STATSCORE-EVALUATOR-ENGINE-V1
   Purpose:
   Human verified truth layer for evaluator submissions,
   metric verification, film validation, trust weighting,
   consensus, confidence, audit receipts, and scoring support.
============================================================ */

window.STATScoreEvaluatorEngine = (() => {

  const ENGINE_VERSION = "STATSCORE-EVALUATOR-ENGINE-V1";

  const EVALUATION_STATUS = {
    NOT_STARTED: "NOT_STARTED",
    IN_REVIEW: "IN_REVIEW",
    VERIFIED: "VERIFIED",
    NEEDS_MORE_EVIDENCE: "NEEDS_MORE_EVIDENCE",
    DISPUTED: "DISPUTED",
    REJECTED: "REJECTED"
  };

  const EVIDENCE_TYPES = {
    FILM: "FILM",
    METRIC: "METRIC",
    EVENT: "EVENT",
    COACH_CONFIRMATION: "COACH_CONFIRMATION",
    COUNSELOR_CONFIRMATION: "COUNSELOR_CONFIRMATION",
    GUARDIAN_PERMISSION: "GUARDIAN_PERMISSION"
  };

  const TRUST_TIERS = {
    CERTIFIED: { label: "Certified Evaluator", weight: 1.25 },
    VERIFIED: { label: "Verified Evaluator", weight: 1.1 },
    STANDARD: { label: "Standard Evaluator", weight: 1.0 },
    PROBATION: { label: "Probation Evaluator", weight: 0.75 },
    UNVERIFIED: { label: "Unverified Evaluator", weight: 0.5 }
  };

  function core(){ return window.STATScoreCore || null; }
  function scoring(){ return window.STATScoreScoringEngine || null; }

  function safe(value, fallback = ""){
    return core()?.safe?.(value, fallback) ?? (value || fallback);
  }

  function now(){
    return new Date().toISOString();
  }

  function normalize(value){
    return String(value || "").trim();
  }

  function upper(value){
    return normalize(value).toUpperCase();
  }

  function clamp(value, min = 0, max = 100){
    const n = Number(value || 0);
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function resolveTrustTier(tier){
    const key = upper(tier || "STANDARD");
    return TRUST_TIERS[key] || TRUST_TIERS.STANDARD;
  }

  function evaluatorWeight(evaluator = {}){
    return resolveTrustTier(evaluator.trust_tier || evaluator.tier).weight;
  }

  function metricEvidenceScore(snapshot){
    let score = 0;
    const evidence = [];

    if (snapshot?.dash40) {
      score += 18;
      evidence.push("40-yard / sprint metric submitted");
    }

    if (snapshot?.vertical_jump) {
      score += 16;
      evidence.push("vertical jump / explosiveness metric submitted");
    }

    if (snapshot?.shuttle) {
      score += 14;
      evidence.push("shuttle / change-of-direction metric submitted");
    }

    if (snapshot?.broad_jump) {
      score += 12;
      evidence.push("broad jump / lower-body power metric submitted");
    }

    return {
      score: clamp(score),
      evidence
    };
  }

  function filmEvidenceScore(snapshot){
    let score = 0;
    const evidence = [];

    if (snapshot?.highlight_url) {
      score += 35;
      evidence.push("highlight reel submitted");
    }

    if (snapshot?.game_film_url) {
      score += 45;
      evidence.push("full or game film submitted");
    }

    return {
      score: clamp(score),
      evidence
    };
  }

  function verificationNeed(snapshot){
    const needs = [];

    if (!snapshot?.headshot_public_url) needs.push("official athlete image");
    if (!snapshot?.highlight_url && !snapshot?.game_film_url) needs.push("film evidence");
    if (!snapshot?.dash40 && !snapshot?.vertical_jump && !snapshot?.shuttle) needs.push("verified performance metrics");
    if (!snapshot?.coach_name && !snapshot?.coach_email) needs.push("coach confirmation");
    if (!snapshot?.guardian_name && !snapshot?.guardian_email) needs.push("guardian permission lane");
    if (!snapshot?.current_gpa && !snapshot?.ncaa_status) needs.push("academic readiness context");

    return needs;
  }

  function buildEvaluationDraft(snapshot, evaluator = {}){

    const metric = metricEvidenceScore(snapshot);
    const film = filmEvidenceScore(snapshot);
    const needs = verificationNeed(snapshot);
    const trust = resolveTrustTier(evaluator.trust_tier);

    const baseConfidence =
      metric.score * 0.25 +
      film.score * 0.35 +
      (needs.length === 0 ? 25 : Math.max(0, 25 - needs.length * 4)) +
      trust.weight * 12;

    const confidence = clamp(baseConfidence);

    let status = EVALUATION_STATUS.IN_REVIEW;

    if (confidence >= 85 && needs.length <= 1) {
      status = EVALUATION_STATUS.VERIFIED;
    } else if (needs.length >= 4) {
      status = EVALUATION_STATUS.NEEDS_MORE_EVIDENCE;
    }

    return {
      engine_version: ENGINE_VERSION,
      evaluation_status: status,
      confidence_score: confidence,
      evaluator_trust_tier: trust.label,
      evaluator_weight: trust.weight,

      snapshot_id: snapshot?.snapshot_id || null,
      athlete_id: snapshot?.athlete_id || null,
      athlete_display_name: safe(snapshot?.athlete_display_name),

      sport: safe(snapshot?.sport),
      position: safe(snapshot?.position),
      graduation_class: safe(snapshot?.graduation_class),
      school: safe(snapshot?.school),

      metric_evidence_score: metric.score,
      film_evidence_score: film.score,

      evidence_found: [
        ...metric.evidence,
        ...film.evidence
      ],

      missing_evidence: needs,

      evaluator_id: evaluator.evaluator_id || null,
      evaluator_name: evaluator.evaluator_name || evaluator.name || "",
      submitted_at: now(),

      notes:
        "Evaluation draft generated by STATScore Evaluator Engine. Final evaluator action must remain role-governed and audit-ready."
    };
  }

  function buildEvaluatorReceipt(action, snapshot, evaluator = {}, payload = {}){

    return {
      receipt_type: "STATSCORE_EVALUATOR_RECEIPT",
      engine_version: ENGINE_VERSION,
      action: action || "EVALUATION_ACTION",
      created_at: now(),

      snapshot_id: snapshot?.snapshot_id || null,
      athlete_id: snapshot?.athlete_id || null,
      athlete_display_name: safe(snapshot?.athlete_display_name),

      evaluator_id: evaluator.evaluator_id || null,
      evaluator_name: evaluator.evaluator_name || evaluator.name || "",
      evaluator_trust_tier: evaluator.trust_tier || "STANDARD",

      payload,
      locked: true
    };
  }

  function consensusScore(evaluations = []){

    if (!Array.isArray(evaluations) || !evaluations.length) {
      return {
        score: 0,
        count: 0,
        label: "No Evaluator Consensus",
        status: "NO_CONSENSUS"
      };
    }

    let totalWeight = 0;
    let weightedTotal = 0;

    evaluations.forEach((evaluation) => {
      const trust = resolveTrustTier(evaluation.evaluator_trust_tier || evaluation.trust_tier);
      const score = Number(evaluation.confidence_score || evaluation.score || 0);

      totalWeight += trust.weight;
      weightedTotal += score * trust.weight;
    });

    const score = totalWeight ? clamp(weightedTotal / totalWeight) : 0;

    return {
      score,
      count: evaluations.length,
      label:
        score >= 85
          ? "Strong Evaluator Consensus"
          : score >= 70
            ? "Moderate Evaluator Consensus"
            : "Weak Evaluator Consensus",
      status:
        score >= 85
          ? "STRONG_CONSENSUS"
          : score >= 70
            ? "MODERATE_CONSENSUS"
            : "WEAK_CONSENSUS"
    };
  }

  function scoringAdjustmentFromEvaluation(evaluation){

    const confidence = Number(evaluation?.confidence_score || 0);
    const status = upper(evaluation?.evaluation_status);

    if (status === EVALUATION_STATUS.VERIFIED) {
      return {
        adjustment: confidence >= 90 ? 5 : 3,
        reason: "verified evaluator confidence supports positive scoring adjustment"
      };
    }

    if (status === EVALUATION_STATUS.NEEDS_MORE_EVIDENCE) {
      return {
        adjustment: -4,
        reason: "evaluation requires more evidence before score can expand"
      };
    }

    if (status === EVALUATION_STATUS.DISPUTED || status === EVALUATION_STATUS.REJECTED) {
      return {
        adjustment: -8,
        reason: "disputed or rejected evidence lowers scoring confidence"
      };
    }

    return {
      adjustment: 0,
      reason: "evaluation is still in review"
    };
  }

  function applyEvaluationToScore(snapshot, evaluation){

    const base =
      scoring()?.explainScore?.(snapshot);

    if (!base?.ok) return base;

    const adj =
      scoringAdjustmentFromEvaluation(evaluation);

    const finalScore =
      clamp(base.final_score + adj.adjustment);

    return {
      ...base,
      final_score: finalScore,
      evaluator_adjustment: adj,
      evaluator_confidence: evaluation?.confidence_score || null,
      evaluator_status: evaluation?.evaluation_status || EVALUATION_STATUS.IN_REVIEW,
      summary:
        `${base.summary} Evaluator layer applied: ${adj.reason}.`
    };

  }

  async function insertEvaluatorReceipt(receipt){

    const db = core()?.getClient?.();

    if (!db) {
      return {
        ok:false,
        status:"NO_DB_CLIENT",
        receipt:null
      };
    }

    const { data, error } = await db
      .from("statscore_evaluator_receipts")
      .insert(receipt)
      .select("*")
      .single();

    if (error) {
      console.error("Evaluator receipt insert failed:", error);
      return {
        ok:false,
        status:"RECEIPT_INSERT_FAILED",
        error
      };
    }

    return {
      ok:true,
      status:"RECEIPT_INSERTED",
      receipt:data
    };

  }

  async function submitEvaluation(snapshot, evaluator = {}, evaluationPayload = {}){

    const draft =
      buildEvaluationDraft(snapshot, evaluator);

    const merged = {
      ...draft,
      ...evaluationPayload,
      submitted_at: now()
    };

    const db = core()?.getClient?.();

    if (!db) {
      return {
        ok:false,
        status:"NO_DB_CLIENT",
        evaluation:merged
      };
    }

    const { data, error } = await db
      .from("statscore_evaluations")
      .insert(merged)
      .select("*")
      .single();

    if (error) {
      console.error("Evaluation insert failed:", error);
      return {
        ok:false,
        status:"EVALUATION_INSERT_FAILED",
        error,
        evaluation:merged
      };
    }

    const receipt =
      buildEvaluatorReceipt(
        "EVALUATION_SUBMITTED",
        snapshot,
        evaluator,
        data
      );

    const receiptResult =
      await insertEvaluatorReceipt(receipt);

    return {
      ok:true,
      status:"EVALUATION_SUBMITTED",
      evaluation:data,
      receipt:receiptResult
    };

  }

  function evaluatorNarrative(snapshot, evaluator = {}){

    const draft =
      buildEvaluationDraft(snapshot, evaluator);

    if (draft.evaluation_status === EVALUATION_STATUS.VERIFIED) {
      return "Evaluator review supports verified athlete signal. Scoring confidence may expand.";
    }

    if (draft.evaluation_status === EVALUATION_STATUS.NEEDS_MORE_EVIDENCE) {
      return `Evaluator review requires more evidence: ${draft.missing_evidence.join(", ")}.`;
    }

    return "Evaluator review is in progress. Evidence is being weighed before verification is released.";

  }

  function renderEvaluatorPanel(targetId, snapshot, evaluator = {}){

    const el = document.getElementById(targetId);
    if (!el) return;

    const draft = buildEvaluationDraft(snapshot, evaluator);

    const esc = core()?.escapeHTML || ((v) => v);

    el.innerHTML = `
      <div class="evaluator-kicker">STATScore Evaluator Intelligence</div>
      <h2>${esc(draft.evaluation_status)}</h2>
      <p>${esc(evaluatorNarrative(snapshot, evaluator))}</p>

      <div class="evaluator-grid">
        <div><b>Confidence</b><span>${draft.confidence_score}</span></div>
        <div><b>Trust Tier</b><span>${esc(draft.evaluator_trust_tier)}</span></div>
        <div><b>Metric Evidence</b><span>${draft.metric_evidence_score}</span></div>
        <div><b>Film Evidence</b><span>${draft.film_evidence_score}</span></div>
      </div>

      <strong>Missing Evidence</strong>
      <ul>
        ${draft.missing_evidence.map(item => `<li>${esc(item)}</li>`).join("")}
      </ul>
    `;

  }

  return {
    ENGINE_VERSION,
    EVALUATION_STATUS,
    EVIDENCE_TYPES,
    TRUST_TIERS,

    resolveTrustTier,
    evaluatorWeight,

    metricEvidenceScore,
    filmEvidenceScore,
    verificationNeed,

    buildEvaluationDraft,
    buildEvaluatorReceipt,
    consensusScore,

    scoringAdjustmentFromEvaluation,
    applyEvaluationToScore,

    insertEvaluatorReceipt,
    submitEvaluation,

    evaluatorNarrative,
    renderEvaluatorPanel
  };

})(); 
