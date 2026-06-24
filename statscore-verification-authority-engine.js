/* ============================================================
   STATS-CORE™
   Stream 3 — Athlete Intelligence
   File: statscore-verification-authority-engine.js
   Purpose: Protect verification truth, evidence authority,
            and performance trait unlocks.
   Doctrine: Athlete can create evidence. Athlete cannot verify evidence.
============================================================ */

(function () {
  "use strict";

  const ENGINE_NAME = "statscore-verification-authority-engine.js";
  const STREAM = "STATS-CORE Stream 3 Athlete Intelligence";

  const AUTHORITY_LEVELS = {
    SELF_REPORTED: "SELF_REPORTED",
    COACH_VERIFIED: "COACH_VERIFIED",
    PHNX_CERTIFIED_COACH: "PHNX_CERTIFIED_COACH",
    PHNX_CERTIFIED_EVALUATOR: "PHNX_CERTIFIED_EVALUATOR",
    PHNX_CERTIFIED_CAMP_COMBINE: "PHNX_CERTIFIED_CAMP_COMBINE",
    OFFICIAL_STAT_SOURCE: "OFFICIAL_STAT_SOURCE"
  };

  const VERIFICATION_STATUS = {
    UNVERIFIED: "UNVERIFIED",
    PARTIAL: "PARTIAL",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED",
    HISTORICAL_VERIFIED_PRODUCTION_CASE: "HISTORICAL_VERIFIED_PRODUCTION_CASE"
  };

  const VERIFICATION_COLOR = {
    RED: "RED",
    YELLOW: "YELLOW",
    GREEN: "GREEN",
    BLUE: "BLUE"
  };

  const LOCKED_PERFORMANCE_TRAITS = [
    "Processing",
    "Timing",
    "Accuracy",
    "Pocket Control",
    "Pressure Response",
    "Production Efficiency"
  ];

  const EXTERNAL_EVIDENCE_TYPES = [
    "MAXPREPS",
    "HUDL",
    "FHSAA",
    "SCHOOL_WEBSITE",
    "NEWSPAPER",
    "STAT_PLATFORM",
    "GAME_FILM",
    "BOX_SCORE",
    "OFFICIAL_RECORD",
    "OTHER_EXTERNAL_SOURCE"
  ];

  function getSnapshotId(explicitSnapshotId) {
    return (
      explicitSnapshotId ||
      new URLSearchParams(window.location.search).get("snapshot_id") ||
      localStorage.getItem("STATSCORE_ACTIVE_SNAPSHOT_ID") ||
      null
    );
  }

  function normalizeAuthority(authority) {
    return String(authority || AUTHORITY_LEVELS.SELF_REPORTED).toUpperCase();
  }

  function normalizeStatus(status) {
    return String(status || VERIFICATION_STATUS.UNVERIFIED).toUpperCase();
  }

  function isPHNXAuthority(authority) {
    const a = normalizeAuthority(authority);

    return [
      AUTHORITY_LEVELS.PHNX_CERTIFIED_COACH,
      AUTHORITY_LEVELS.PHNX_CERTIFIED_EVALUATOR,
      AUTHORITY_LEVELS.PHNX_CERTIFIED_CAMP_COMBINE
    ].includes(a);
  }

  function isRecognizedVerificationAuthority(authority) {
    const a = normalizeAuthority(authority);

    return [
      AUTHORITY_LEVELS.COACH_VERIFIED,
      AUTHORITY_LEVELS.PHNX_CERTIFIED_COACH,
      AUTHORITY_LEVELS.PHNX_CERTIFIED_EVALUATOR,
      AUTHORITY_LEVELS.PHNX_CERTIFIED_CAMP_COMBINE,
      AUTHORITY_LEVELS.OFFICIAL_STAT_SOURCE
    ].includes(a);
  }

  function getCurrentVerificationAuthority(context = {}) {
    return {
      verification_authority: normalizeAuthority(context.verification_authority),
      verification_status: normalizeStatus(context.verification_status),
      verified_by: context.verified_by || null,
      authority_id: context.authority_id || null,
      phnx_certification_id: context.phnx_certification_id || null,
      audit_receipt: context.audit_receipt || null
    };
  }

  function enforceAthleteSelfReportOnly(payload = {}) {
    return {
      ...payload,
      verification_authority: AUTHORITY_LEVELS.SELF_REPORTED,
      verification_status: VERIFICATION_STATUS.UNVERIFIED,
      verification_color: VERIFICATION_COLOR.YELLOW,
      verified_by: null,
      authority_id: null,
      phnx_certification_id: null,
      authority_locked: true,
      doctrine:
        "Athlete-created production evidence is SELF_REPORTED and UNVERIFIED until recognized authority verifies it."
    };
  }

  function validatePHNXAuthorityId(authorityPayload = {}) {
    const authority = normalizeAuthority(authorityPayload.verification_authority);

    if (!isPHNXAuthority(authority)) {
      return {
        valid: true,
        phnx_required: false,
        reason: "PHNX authority validation not required for this authority level."
      };
    }

    const required = {
      phnx_certification_id: authorityPayload.phnx_certification_id,
      certification_status: authorityPayload.certification_status,
      sport_authority: authorityPayload.sport_authority,
      role_authority: authorityPayload.role_authority,
      audit_receipt: authorityPayload.audit_receipt
    };

    const missing = Object.entries(required)
      .filter(([, value]) => !value || String(value).trim() === "")
      .map(([key]) => key);

    if (String(authorityPayload.certification_status || "").toUpperCase() !== "ACTIVE") {
      missing.push("active certification status");
    }

    return {
      valid: missing.length === 0,
      phnx_required: true,
      missing,
      reason:
        missing.length === 0
          ? "PHNX authority validated."
          : "PHNX authority cannot verify without certification ID, active status, sport authority, role authority, and audit receipt."
    };
  }

  function resolveVerificationStatus(context = {}) {
    const authority = normalizeAuthority(context.verification_authority);
    const status = normalizeStatus(context.verification_status);

    if (status === VERIFICATION_STATUS.HISTORICAL_VERIFIED_PRODUCTION_CASE) {
      return VERIFICATION_STATUS.HISTORICAL_VERIFIED_PRODUCTION_CASE;
    }

    if (authority === AUTHORITY_LEVELS.SELF_REPORTED) {
      return VERIFICATION_STATUS.UNVERIFIED;
    }

    if (isPHNXAuthority(authority)) {
      const phnx = validatePHNXAuthorityId(context);
      return phnx.valid ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PARTIAL;
    }

    if (isRecognizedVerificationAuthority(authority)) {
      return VERIFICATION_STATUS.VERIFIED;
    }

    return VERIFICATION_STATUS.UNVERIFIED;
  }

  function resolveVerificationColor(context = {}) {
    const status = resolveVerificationStatus(context);

    switch (status) {
      case VERIFICATION_STATUS.VERIFIED:
        return VERIFICATION_COLOR.GREEN;

      case VERIFICATION_STATUS.HISTORICAL_VERIFIED_PRODUCTION_CASE:
        return VERIFICATION_COLOR.BLUE;

      case VERIFICATION_STATUS.PARTIAL:
        return VERIFICATION_COLOR.YELLOW;

      case VERIFICATION_STATUS.REJECTED:
        return VERIFICATION_COLOR.RED;

      case VERIFICATION_STATUS.UNVERIFIED:
      default:
        return VERIFICATION_COLOR.YELLOW;
    }
  }

  function canUnlockPerformanceTraits(context = {}) {
    const status = resolveVerificationStatus(context);
    const authority = normalizeAuthority(context.verification_authority);

    const unlocked =
      status === VERIFICATION_STATUS.VERIFIED ||
      status === VERIFICATION_STATUS.HISTORICAL_VERIFIED_PRODUCTION_CASE ||
      authority === AUTHORITY_LEVELS.PHNX_CERTIFIED_EVALUATOR ||
      authority === AUTHORITY_LEVELS.PHNX_CERTIFIED_CAMP_COMBINE;

    return {
      unlocked,
      locked_traits: unlocked ? [] : LOCKED_PERFORMANCE_TRAITS,
      reason: unlocked
        ? "Performance traits may unlock because verified production or evaluator authority exists."
        : "Performance traits remain locked until verified production or evaluator authority exists."
    };
  }

  function normalizeExternalEvidence(evidence = {}) {
    return {
      evidence_source_type:
        String(evidence.evidence_source_type || evidence.source_type || "OTHER_EXTERNAL_SOURCE").toUpperCase(),
      evidence_source_name:
        evidence.evidence_source_name || evidence.source_name || null,
      evidence_source_url:
        evidence.evidence_source_url || evidence.source_url || null,
      evidence_reference:
        evidence.evidence_reference || evidence.reference || null,
      evidence_notes:
        evidence.evidence_notes || evidence.notes || null,
      doctrine:
        "External evidence supports verification but does not receive STATS-CORE ID or PHNX ID."
    };
  }

  function createVerificationReceipt(context = {}) {
    const snapshotId = getSnapshotId(context.snapshot_id);
    const authority = normalizeAuthority(context.verification_authority);
    const status = resolveVerificationStatus(context);
    const color = resolveVerificationColor(context);
    const traits = canUnlockPerformanceTraits(context);

    return {
      receipt_type: "STATSCORE_VERIFICATION_RECEIPT",
      stream: STREAM,
      engine: ENGINE_NAME,
      snapshot_id: snapshotId,
      production_record_id: context.production_record_id || null,

      verification_authority: authority,
      verification_status: status,
      verification_color: color,

      verified_by: context.verified_by || null,
      authority_id: context.authority_id || null,
      phnx_certification_id: context.phnx_certification_id || null,
      audit_receipt: context.audit_receipt || null,

      evidence: Array.isArray(context.evidence)
        ? context.evidence.map(normalizeExternalEvidence)
        : [],

      performance_traits_unlocked: traits.unlocked,
      locked_performance_traits: traits.locked_traits,

      created_at: new Date().toISOString(),

      doctrine: {
        authority_answers: "Who verified this?",
        evidence_answers: "What supports this?",
        athlete_rule:
          "Athlete can create production evidence. Athlete cannot verify production evidence.",
        green_verified_rule:
          "Green VERIFIED state requires recognized verification authority.",
        external_evidence_rule:
          "External sources do not receive STATS-CORE IDs or PHNX IDs."
      }
    };
  }

  function resolveVerificationModel(context = {}) {
    const authority = normalizeAuthority(context.verification_authority);
    const status = resolveVerificationStatus(context);
    const color = resolveVerificationColor(context);
    const traits = canUnlockPerformanceTraits(context);

    return {
      verification_authority: authority,
      verification_status: status,
      verification_color: color,
      is_self_reported: authority === AUTHORITY_LEVELS.SELF_REPORTED,
      is_verified: status === VERIFICATION_STATUS.VERIFIED,
      is_historical_case:
        status === VERIFICATION_STATUS.HISTORICAL_VERIFIED_PRODUCTION_CASE,
      performance_traits_unlocked: traits.unlocked,
      locked_performance_traits: traits.locked_traits,
      reason: traits.reason
    };
  }

  function protectGreenVerifiedState(context = {}) {
    const authority = normalizeAuthority(context.verification_authority);
    const requestedStatus = normalizeStatus(context.verification_status);
    const requestedColor = String(context.verification_color || "").toUpperCase();

    const attemptedGreenVerified =
      requestedStatus === VERIFICATION_STATUS.VERIFIED ||
      requestedColor === VERIFICATION_COLOR.GREEN;

    if (attemptedGreenVerified && !isRecognizedVerificationAuthority(authority)) {
      return {
        allowed: false,
        corrected_status: VERIFICATION_STATUS.UNVERIFIED,
        corrected_color: VERIFICATION_COLOR.YELLOW,
        reason:
          "Green VERIFIED blocked. SELF_REPORTED evidence cannot render as VERIFIED."
      };
    }

    return {
      allowed: true,
      corrected_status: resolveVerificationStatus(context),
      corrected_color: resolveVerificationColor(context),
      reason: "Verification display allowed."
    };
  }

  window.STATSCORE_VERIFICATION_AUTHORITY_ENGINE = {
    engine: ENGINE_NAME,
    stream: STREAM,

    AUTHORITY_LEVELS,
    VERIFICATION_STATUS,
    VERIFICATION_COLOR,
    LOCKED_PERFORMANCE_TRAITS,
    EXTERNAL_EVIDENCE_TYPES,

    getCurrentVerificationAuthority,
    enforceAthleteSelfReportOnly,
    validatePHNXAuthorityId,
    resolveVerificationStatus,
    resolveVerificationColor,
    canUnlockPerformanceTraits,
    createVerificationReceipt,
    normalizeExternalEvidence,
    resolveVerificationModel,
    protectGreenVerifiedState
  };

  console.info("[STATS-CORE] Verification Authority Engine loaded.");
})(); 
