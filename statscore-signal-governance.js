/* ============================================================
   STATScore™ Signal Governance Engine
   File: SC-Signal-Governance.js
   Purpose:
   Converts role-fed inputs into governed athlete intelligence.
   Prevents raw room inputs from becoming truth without authority,
   freshness, conflict review, and audit-state logic.
   ============================================================ */

(function () {
  "use strict";

  const SC_SIGNAL_GOVERNANCE_VERSION = "SC-SIGNAL-GOVERNANCE-V1.0";

  const ROLE_AUTHORITY = {
    athlete: 20,
    parent: 35,
    coach: 55,
    counselor: 65,
    recruiter: 45,
    program: 70,
    evaluator: 90,
    system: 100
  };

  const SIGNAL_TYPES = {
    IDENTITY: "identity",
    PERFORMANCE: "performance",
    READINESS: "readiness",
    ELIGIBILITY: "eligibility",
    PATHWAY: "pathway",
    MEDIA: "media",
    COMMUNICATION: "communication",
    EXPOSURE: "exposure",
    PROGRAM_HEALTH: "program_health"
  };

  const SIGNAL_STATUS = {
    GREEN: "GREEN",
    YELLOW: "YELLOW",
    RED: "RED",
    PENDING: "PENDING",
    CONFLICT: "CONFLICT",
    EXPIRED: "EXPIRED"
  };

  const FRESHNESS_DAYS = {
    identity: 365,
    performance: 90,
    readiness: 60,
    eligibility: 45,
    pathway: 60,
    media: 120,
    communication: 30,
    exposure: 30,
    program_health: 90
  };

  function nowISO() {
    return new Date().toISOString();
  }

  function daysOld(dateValue) {
    if (!dateValue) return Infinity;
    const created = new Date(dateValue).getTime();
    if (Number.isNaN(created)) return Infinity;
    return Math.floor((Date.now() - created) / 86400000);
  }

  function getRoleWeight(role) {
    return ROLE_AUTHORITY[String(role || "").toLowerCase()] || 0;
  }

  function getFreshnessLimit(signalType) {
    return FRESHNESS_DAYS[signalType] || 60;
  }

  function normalizeSignal(input) {
    return {
      signal_id: input.signal_id || crypto.randomUUID(),
      athlete_id: input.athlete_id || null,
      source_role: String(input.source_role || "system").toLowerCase(),
      signal_type: input.signal_type || SIGNAL_TYPES.PERFORMANCE,
      signal_value: input.signal_value || SIGNAL_STATUS.PENDING,
      confidence: Number(input.confidence || 0),
      evidence_level: input.evidence_level || "unverified",
      notes: input.notes || "",
      created_at: input.created_at || nowISO(),
      updated_at: nowISO()
    };
  }

  function evaluateFreshness(signal) {
    const age = daysOld(signal.created_at);
    const limit = getFreshnessLimit(signal.signal_type);

    return {
      is_fresh: age <= limit,
      age_days: age,
      freshness_limit_days: limit,
      freshness_status: age <= limit ? "fresh" : "expired"
    };
  }

  function computeAuthorityScore(signal) {
    const roleWeight = getRoleWeight(signal.source_role);
    const confidence = Math.max(0, Math.min(100, Number(signal.confidence || 0)));

    let evidenceBoost = 0;
    if (signal.evidence_level === "official") evidenceBoost = 20;
    if (signal.evidence_level === "verified") evidenceBoost = 15;
    if (signal.evidence_level === "documented") evidenceBoost = 10;
    if (signal.evidence_level === "self_reported") evidenceBoost = 0;
    if (signal.evidence_level === "unverified") evidenceBoost = -10;

    return Math.max(0, Math.min(100, Math.round((roleWeight * 0.6) + (confidence * 0.3) + evidenceBoost)));
  }

  function detectConflict(signals) {
    const values = new Set(signals.map(s => s.signal_value));
    return values.size > 1;
  }

  function synthesizeSignal(signals) {
    if (!Array.isArray(signals) || signals.length === 0) {
      return {
        status: SIGNAL_STATUS.PENDING,
        reason: "No signals available.",
        authority_score: 0
      };
    }

    const normalized = signals.map(normalizeSignal);

    const active = normalized.filter(signal => evaluateFreshness(signal).is_fresh);

    if (active.length === 0) {
      return {
        status: SIGNAL_STATUS.EXPIRED,
        reason: "All signals are expired.",
        authority_score: 0,
        signals: normalized
      };
    }

    if (detectConflict(active)) {
      return {
        status: SIGNAL_STATUS.CONFLICT,
        reason: "Conflicting role-fed signals detected.",
        authority_score: Math.max(...active.map(computeAuthorityScore)),
        signals: active
      };
    }

    const ranked = active
      .map(signal => ({
        ...signal,
        authority_score: computeAuthorityScore(signal),
        freshness: evaluateFreshness(signal)
      }))
      .sort((a, b) => b.authority_score - a.authority_score);

    const winner = ranked[0];

    return {
      status: winner.signal_value,
      reason: "Highest authority fresh signal selected.",
      authority_score: winner.authority_score,
      governing_role: winner.source_role,
      signal_type: winner.signal_type,
      evidence_level: winner.evidence_level,
      selected_signal_id: winner.signal_id,
      signals: ranked
    };
  }

  function buildAthleteIntelligenceModel(athleteId, groupedSignals) {
    const output = {
      engine: SC_SIGNAL_GOVERNANCE_VERSION,
      athlete_id: athleteId,
      generated_at: nowISO(),
      intelligence_state: {},
      review_required: false,
      conflict_count: 0,
      expired_count: 0
    };

    Object.keys(groupedSignals || {}).forEach(type => {
      const result = synthesizeSignal(groupedSignals[type]);
      output.intelligence_state[type] = result;

      if (result.status === SIGNAL_STATUS.CONFLICT) {
        output.review_required = true;
        output.conflict_count += 1;
      }

      if (result.status === SIGNAL_STATUS.EXPIRED) {
        output.review_required = true;
        output.expired_count += 1;
      }
    });

    return output;
  }

  window.STATScoreSignalGovernance = {
    version: SC_SIGNAL_GOVERNANCE_VERSION,
    SIGNAL_TYPES,
    SIGNAL_STATUS,
    ROLE_AUTHORITY,
    normalizeSignal,
    evaluateFreshness,
    computeAuthorityScore,
    detectConflict,
    synthesizeSignal,
    buildAthleteIntelligenceModel
  };

})(); 
