/* ============================================================
   STATScore™ Signal Governance Engine
   File: statscore-signal-governance.js
   Version: v2.0
   Purpose:
   Institutional Signal Governance Authority Layer

   Converts role-fed inputs into governed athlete intelligence.
   Prevents raw room inputs from becoming institutional truth
   without authority, freshness, conflict review, verification,
   governance validation, and audit-state enforcement.

   Runtime Governance Layer:
   ABOVE:
   - UI
   - Rooms
   - Forms
   - Messaging
   - Rankings

   BELOW:
   - Runtime State Authority
   - Crystal Reports
   - PHNX Rankings
   - Visibility Systems
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-signal-governance";
  const VERSION = "SC-SIGNAL-GOVERNANCE-V2.0";

  /* ============================================================
     ROLE AUTHORITY
     ============================================================ */

  const ROLE_AUTHORITY = {
    athlete: 20,
    parent: 35,
    coach: 55,
    recruiter: 45,
    counselor: 65,
    program: 70,
    evaluator: 90,
    admin: 95,
    system: 100
  };

  /* ============================================================
     SIGNAL TYPES
     ============================================================ */

  const SIGNAL_TYPES = {
    IDENTITY: "identity",
    PERFORMANCE: "performance",
    READINESS: "readiness",
    ELIGIBILITY: "eligibility",
    PATHWAY: "pathway",
    MEDIA: "media",
    COMMUNICATION: "communication",
    EXPOSURE: "exposure",
    PROGRAM_HEALTH: "program_health",
    VISIBILITY: "visibility",
    RECRUITING: "recruiting",
    VERIFICATION: "verification"
  };

  /* ============================================================
     SIGNAL STATUS
     ============================================================ */

  const SIGNAL_STATUS = {
    GREEN: "GREEN",
    YELLOW: "YELLOW",
    RED: "RED",
    PENDING: "PENDING",
    CONFLICT: "CONFLICT",
    EXPIRED: "EXPIRED",
    BLOCKED: "BLOCKED",
    LOCKED: "LOCKED"
  };

  /* ============================================================
     FRESHNESS WINDOWS
     ============================================================ */

  const FRESHNESS_DAYS = {
    identity: 365,
    performance: 90,
    readiness: 60,
    eligibility: 45,
    pathway: 60,
    media: 120,
    communication: 30,
    exposure: 30,
    program_health: 90,
    visibility: 30,
    recruiting: 45,
    verification: 180
  };

  /* ============================================================
     TRUST THRESHOLDS
     ============================================================ */

  const TRUST_THRESHOLDS = {
    VERIFIED_MINIMUM: 70,
    PUBLIC_VISIBILITY: 75,
    RECRUITER_VISIBILITY: 80,
    PHNX_RANKING: 85,
    CRYSTAL_REPORT: 82
  };

  /* ============================================================
     UTILITIES
     ============================================================ */

  function nowISO() {
    return new Date().toISOString();
  }

  function uuid() {
    if (window.crypto?.randomUUID) {
      return crypto.randomUUID();
    }

    return (
      "sc_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function daysOld(dateValue) {
    if (!dateValue) return Infinity;

    const created = new Date(dateValue).getTime();

    if (Number.isNaN(created)) {
      return Infinity;
    }

    return Math.floor((Date.now() - created) / 86400000);
  }

  function getRoleWeight(role) {
    return ROLE_AUTHORITY[String(role || "").toLowerCase()] || 0;
  }

  function getFreshnessLimit(signalType) {
    return FRESHNESS_DAYS[signalType] || 60;
  }

  function emit(eventName, payload) {
    window.dispatchEvent(
      new CustomEvent("statscore:signal-governance:" + eventName, {
        detail: Object.assign(
          {
            engine: ENGINE_ID,
            version: VERSION,
            timestamp: nowISO()
          },
          payload || {}
        )
      })
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        "signal_governance_" + eventName,
        payload || {}
      );
    }
  }

  /* ============================================================
     SIGNAL NORMALIZATION
     ============================================================ */

  function normalizeSignal(input) {
    input = input || {};

    return {
      signal_id: input.signal_id || uuid(),

      athlete_id: input.athlete_id || null,
      snapshot_id: input.snapshot_id || null,

      source_role: normalize(input.source_role || "system").toLowerCase(),

      source_id: input.source_id || null,
      source_name: input.source_name || null,

      signal_type:
        input.signal_type ||
        SIGNAL_TYPES.PERFORMANCE,

      signal_value:
        input.signal_value ||
        SIGNAL_STATUS.PENDING,

      confidence:
        clamp(Number(input.confidence || 0), 0, 100),

      evidence_level:
        input.evidence_level ||
        "unverified",

      visibility_level:
        input.visibility_level ||
        "private",

      notes:
        input.notes || "",

      verified:
        !!input.verified,

      locked:
        !!input.locked,

      created_at:
        input.created_at || nowISO(),

      updated_at:
        nowISO()
    };
  }

  /* ============================================================
     FRESHNESS
     ============================================================ */

  function evaluateFreshness(signal) {
    const age = daysOld(signal.created_at);

    const limit =
      getFreshnessLimit(signal.signal_type);

    return {
      is_fresh: age <= limit,
      age_days: age,
      freshness_limit_days: limit,
      freshness_status:
        age <= limit
          ? "fresh"
          : "expired"
    };
  }

  /* ============================================================
     AUTHORITY SCORE
     ============================================================ */

  function computeAuthorityScore(signal) {

    const roleWeight =
      getRoleWeight(signal.source_role);

    const confidence =
      clamp(
        Number(signal.confidence || 0),
        0,
        100
      );

    let evidenceBoost = 0;

    switch(signal.evidence_level){

      case "official":
        evidenceBoost = 20;
        break;

      case "verified":
        evidenceBoost = 15;
        break;

      case "documented":
        evidenceBoost = 10;
        break;

      case "self_reported":
        evidenceBoost = 0;
        break;

      default:
        evidenceBoost = -10;
    }

    let verificationBoost = 0;

    if(signal.verified){
      verificationBoost = 10;
    }

    return clamp(
      Math.round(
        (roleWeight * 0.55) +
        (confidence * 0.30) +
        evidenceBoost +
        verificationBoost
      ),
      0,
      100
    );
  }

  /* ============================================================
     CONFLICT DETECTION
     ============================================================ */

  function detectConflict(signals) {

    if(!Array.isArray(signals)){
      return false;
    }

    const values =
      new Set(
        signals.map(
          s => normalize(s.signal_value)
        )
      );

    return values.size > 1;
  }

  /* ============================================================
     SIGNAL SYNTHESIS
     ============================================================ */

  function synthesizeSignal(signals) {

    if(
      !Array.isArray(signals) ||
      signals.length === 0
    ){
      return {
        status: SIGNAL_STATUS.PENDING,
        reason: "No signals available.",
        authority_score: 0,
        signals:[]
      };
    }

    const normalized =
      signals.map(normalizeSignal);

    const active =
      normalized.filter(signal =>
        evaluateFreshness(signal).is_fresh
      );

    if(active.length === 0){
      return {
        status: SIGNAL_STATUS.EXPIRED,
        reason: "All signals expired.",
        authority_score: 0,
        signals: normalized
      };
    }

    if(detectConflict(active)){

      const maxAuthority =
        Math.max(
          ...active.map(computeAuthorityScore)
        );

      return {
        status: SIGNAL_STATUS.CONFLICT,
        reason: "Conflicting governed signals detected.",
        authority_score: maxAuthority,
        review_required: true,
        signals: active
      };
    }

    const ranked =
      active
        .map(signal => ({
          ...signal,
          authority_score:
            computeAuthorityScore(signal),
          freshness:
            evaluateFreshness(signal)
        }))
        .sort(
          (a,b) =>
            b.authority_score -
            a.authority_score
        );

    const winner = ranked[0];

    return {
      status: winner.signal_value,
      reason: "Highest authority signal selected.",

      authority_score:
        winner.authority_score,

      governing_role:
        winner.source_role,

      signal_type:
        winner.signal_type,

      evidence_level:
        winner.evidence_level,

      selected_signal_id:
        winner.signal_id,

      review_required:false,

      signals: ranked
    };
  }

  /* ============================================================
     TRUST GOVERNANCE
     ============================================================ */

  function computeTrustState(model){

    const intelligence =
      model.intelligence_state || {};

    let total = 0;
    let count = 0;

    Object.keys(intelligence).forEach(type => {

      const item = intelligence[type];

      if(
        item &&
        typeof item.authority_score === "number"
      ){
        total += item.authority_score;
        count += 1;
      }

    });

    const trust_score =
      count > 0
        ? Math.round(total / count)
        : 0;

    const review_required =
      !!model.review_required;

    return {

      trust_score,

      verified:
        trust_score >=
        TRUST_THRESHOLDS.VERIFIED_MINIMUM,

      recruiter_visible:
        trust_score >=
        TRUST_THRESHOLDS.RECRUITER_VISIBILITY &&
        !review_required,

      public_visible:
        trust_score >=
        TRUST_THRESHOLDS.PUBLIC_VISIBILITY &&
        !review_required,

      crystal_eligible:
        trust_score >=
        TRUST_THRESHOLDS.CRYSTAL_REPORT &&
        !review_required,

      phnx_rankable:
        trust_score >=
        TRUST_THRESHOLDS.PHNX_RANKING &&
        !review_required
    };
  }

  /* ============================================================
     ATHLETE INTELLIGENCE MODEL
     ============================================================ */

  function buildAthleteIntelligenceModel(
    athleteId,
    groupedSignals
  ) {

    const output = {

      engine: ENGINE_ID,
      version: VERSION,

      athlete_id: athleteId,

      generated_at: nowISO(),

      intelligence_state: {},

      review_required: false,

      conflict_count: 0,
      expired_count: 0,

      governance: {},
      visibility: {},
      trust: {}
    };

    Object.keys(groupedSignals || {})
      .forEach(type => {

        const result =
          synthesizeSignal(
            groupedSignals[type]
          );

        output.intelligence_state[type] =
          result;

        if(
          result.status ===
          SIGNAL_STATUS.CONFLICT
        ){
          output.review_required = true;
          output.conflict_count += 1;
        }

        if(
          result.status ===
          SIGNAL_STATUS.EXPIRED
        ){
          output.review_required = true;
          output.expired_count += 1;
        }

      });

    output.trust =
      computeTrustState(output);

    output.visibility = {

      recruiter_access:
        output.trust.recruiter_visible,

      public_visibility:
        output.trust.public_visible,

      crystal_visibility:
        output.trust.crystal_eligible,

      phnx_visibility:
        output.trust.phnx_rankable

    };

    output.governance = {

      locked:
        output.review_required,

      requires_manual_review:
        output.review_required,

      institutional_status:
        output.review_required
          ? "REVIEW_REQUIRED"
          : "ACTIVE"

    };

    emit("athlete_model_built", {
      athlete_id: athleteId,
      trust_score: output.trust.trust_score
    });

    return output;
  }

  /* ============================================================
     VISIBILITY GOVERNANCE
     ============================================================ */

  function evaluateVisibilityGovernance(model){

    if(!model){
      return {
        visible:false,
        reason:"No intelligence model."
      };
    }

    if(model.review_required){
      return {
        visible:false,
        reason:"Manual review required."
      };
    }

    if(
      !model.trust ||
      !model.trust.verified
    ){
      return {
        visible:false,
        reason:"Trust threshold not met."
      };
    }

    return {
      visible:true,
      reason:"Governance thresholds satisfied."
    };
  }

  /* ============================================================
     CRYSTAL REPORT GOVERNANCE
     ============================================================ */

  function evaluateCrystalEligibility(model){

    if(!model){
      return false;
    }

    return !!(
      model.trust &&
      model.trust.crystal_eligible &&
      !model.review_required
    );
  }

  /* ============================================================
     PHNX RANKING GOVERNANCE
     ============================================================ */

  function evaluatePHNXEligibility(model){

    if(!model){
      return false;
    }

    return !!(
      model.trust &&
      model.trust.phnx_rankable &&
      !model.review_required
    );
  }

  /* ============================================================
     ENGINE REGISTRATION
     ============================================================ */

  function registerWithRuntime(){

    if(
      window.STATScoreRuntimeStateEngine?.registerEngine
    ){
      window.STATScoreRuntimeStateEngine
        .registerEngine(
          ENGINE_ID,
          {
            version: VERSION,
            status: "ONLINE"
          }
        );
    }

  }

  /* ============================================================
     EXPOSE
     ============================================================ */

  window.STATScoreSignalGovernance = {

    ENGINE_ID,
    VERSION,

    SIGNAL_TYPES,
    SIGNAL_STATUS,

    ROLE_AUTHORITY,

    normalizeSignal,
    evaluateFreshness,
    computeAuthorityScore,

    detectConflict,
    synthesizeSignal,

    computeTrustState,

    buildAthleteIntelligenceModel,

    evaluateVisibilityGovernance,
    evaluateCrystalEligibility,
    evaluatePHNXEligibility

  };

  /* ============================================================
     INIT
     ============================================================ */

  function init(){

    if(window.__SC_SIGNAL_GOVERNANCE__){
      return;
    }

    window.__SC_SIGNAL_GOVERNANCE__ = true;

    registerWithRuntime();

    emit("engine_online", {
      engine: ENGINE_ID,
      version: VERSION,
      status: "ONLINE"
    });

    console.log(
      "[STATScore Signal Governance] ONLINE",
      VERSION
    );

  }

  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  }else{
    init();
  }

})(); 
