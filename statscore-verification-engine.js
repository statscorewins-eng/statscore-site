/* ============================================================
   STATScore™ Verification Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Signal Trust → Verification Status → Confidence Layer
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-verification-engine";
  const VERSION = "v1.0-trust-foundation";

  const VERIFICATION_LEVELS = {
    UNVERIFIED: {
      label: "Unverified",
      weight: 0,
      confidence: 20
    },
    PROFILE_SUBMITTED: {
      label: "Profile Submitted",
      weight: 1,
      confidence: 35
    },
    FILM_ATTACHED: {
      label: "Film Attached",
      weight: 2,
      confidence: 45
    },
    COACH_CONFIRMED: {
      label: "Coach Confirmed",
      weight: 3,
      confidence: 58
    },
    EVALUATOR_REVIEWED: {
      label: "Evaluator Reviewed",
      weight: 4,
      confidence: 70
    },
    EVENT_VERIFIED: {
      label: "Camp/Combine Verified",
      weight: 5,
      confidence: 82
    },
    SYSTEM_VERIFIED: {
      label: "System Verified",
      weight: 6,
      confidence: 90
    },
    OFFICIAL_VERIFIED: {
      label: "Official Verified",
      weight: 7,
      confidence: 96
    }
  };

  function normalize(value) {
    return String(value || "").trim();
  }

  function upper(value) {
    return normalize(value).toUpperCase().replace(/\s+/g, "_");
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function clamp(value, min = 0, max = 100) {
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, n));
  }

  function getEvidenceFlags(athlete) {
    const raw = athlete?.raw_payload || {};

    return {
      has_profile:
        hasValue(athlete?.athlete_display_name) ||
        hasValue(athlete?.first_name) ||
        hasValue(athlete?.last_name),

      has_snapshot:
        hasValue(athlete?.snapshot_id),

      has_film:
        hasValue(athlete?.highlight_url) ||
        hasValue(athlete?.game_film_url) ||
        hasValue(athlete?.recruiting_profile_url),

      has_headshot:
        hasValue(athlete?.headshot_public_url),

      has_metrics:
        hasValue(athlete?.dash40) ||
        hasValue(athlete?.vertical_jump) ||
        hasValue(athlete?.shuttle) ||
        hasValue(athlete?.height) ||
        hasValue(athlete?.weight),

      has_academic:
        hasValue(athlete?.current_gpa) ||
        hasValue(athlete?.ncaa_eligibility_status) ||
        hasValue(athlete?.academic_notes),

      has_guardian:
        hasValue(athlete?.guardian_name) ||
        hasValue(athlete?.guardian_email) ||
        hasValue(athlete?.guardian_phone),

      has_coach:
        hasValue(athlete?.coach_name) ||
        hasValue(athlete?.coach_email),

      has_verified_event:
        hasValue(athlete?.verified_event_source),

      has_permission:
        upper(athlete?.verification_permission).includes("YES") ||
        upper(athlete?.verification_permission).includes("APPROVED") ||
        upper(raw?.verification_permission).includes("APPROVED"),

      marked_verified:
        upper(athlete?.verification_status).includes("VERIFIED")
    };
  }

  function determineLevel(flags) {
    if (
      flags.marked_verified &&
      flags.has_verified_event &&
      flags.has_film &&
      flags.has_coach
    ) {
      return "OFFICIAL_VERIFIED";
    }

    if (flags.marked_verified && flags.has_film && flags.has_metrics) {
      return "SYSTEM_VERIFIED";
    }

    if (flags.has_verified_event) {
      return "EVENT_VERIFIED";
    }

    if (flags.has_film && flags.has_coach) {
      return "EVALUATOR_REVIEWED";
    }

    if (flags.has_coach) {
      return "COACH_CONFIRMED";
    }

    if (flags.has_film) {
      return "FILM_ATTACHED";
    }

    if (flags.has_profile || flags.has_snapshot) {
      return "PROFILE_SUBMITTED";
    }

    return "UNVERIFIED";
  }

  function calculateConfidence(flags, levelKey) {
    const base = VERIFICATION_LEVELS[levelKey]?.confidence || 20;

    let confidence = base;

    if (flags.has_profile) confidence += 3;
    if (flags.has_snapshot) confidence += 3;
    if (flags.has_film) confidence += 8;
    if (flags.has_metrics) confidence += 7;
    if (flags.has_academic) confidence += 4;
    if (flags.has_guardian) confidence += 4;
    if (flags.has_coach) confidence += 6;
    if (flags.has_verified_event) confidence += 9;
    if (flags.has_permission) confidence += 4;
    if (flags.marked_verified) confidence += 5;

    return clamp(Math.round(confidence), 0, 100);
  }

  function generateTrustTags(flags) {
    const tags = [];

    if (flags.has_profile) tags.push("PROFILE_PRESENT");
    if (flags.has_snapshot) tags.push("SNAPSHOT_PRESENT");
    if (flags.has_film) tags.push("FILM_ATTACHED");
    if (flags.has_metrics) tags.push("METRICS_PRESENT");
    if (flags.has_academic) tags.push("ACADEMIC_DATA_PRESENT");
    if (flags.has_guardian) tags.push("GUARDIAN_CONTACT_PRESENT");
    if (flags.has_coach) tags.push("COACH_CONTACT_PRESENT");
    if (flags.has_verified_event) tags.push("EVENT_SOURCE_PRESENT");
    if (flags.has_permission) tags.push("VERIFICATION_PERMISSION_PRESENT");
    if (flags.marked_verified) tags.push("VERIFICATION_STATUS_MARKED");

    return tags;
  }

  function generateMissingItems(flags) {
    const missing = [];

    if (!flags.has_film) missing.push("Film or highlight evidence");
    if (!flags.has_metrics) missing.push("Verified athletic metrics");
    if (!flags.has_coach) missing.push("Coach confirmation");
    if (!flags.has_guardian) missing.push("Guardian/parent contact");
    if (!flags.has_academic) missing.push("Academic/NCAA eligibility data");
    if (!flags.has_verified_event) missing.push("Camp/combine or verified event source");
    if (!flags.has_permission) missing.push("Verification permission");

    return missing;
  }

  function verifyAthlete(athlete) {
    if (!athlete) {
      return {
        ok: false,
        status: "NO_ATHLETE",
        verification_level: "UNVERIFIED",
        confidence_score: 0,
        trust_tags: [],
        missing_items: ["Athlete profile data"]
      };
    }

    const flags = getEvidenceFlags(athlete);
    const levelKey = determineLevel(flags);
    const level = VERIFICATION_LEVELS[levelKey];
    const confidence = calculateConfidence(flags, levelKey);

    const result = {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,
      athlete_id: athlete.athlete_id || null,
      snapshot_id: athlete.snapshot_id || null,
      verification_level: levelKey,
      verification_label: level.label,
      verification_weight: level.weight,
      confidence_score: confidence,
      trusted_signal:
        confidence >= 80 && level.weight >= VERIFICATION_LEVELS.EVENT_VERIFIED.weight,
      official_signal:
        levelKey === "SYSTEM_VERIFIED" || levelKey === "OFFICIAL_VERIFIED",
      evidence_flags: flags,
      trust_tags: generateTrustTags(flags),
      missing_items: generateMissingItems(flags),
      explanation: {
        summary: `This athlete is currently classified as ${level.label} with a ${confidence}% confidence score.`,
        rule: "Verification status is determined by profile completeness, film, metrics, coach/evaluator/event confirmation, academic data, guardian permission, and explicit verification status.",
        limitation:
          "Projected scoring may exist before official verification, but official STATScore outputs require stronger evidence and validation."
      },
      created_at: new Date().toISOString()
    };

    return result;
  }

  function applyVerificationToFootballScore(score, verification) {
    if (!score || !score.ok || !verification || !verification.ok) return score;

    const adjusted = { ...score };

    adjusted.verification = verification;
    adjusted.confidence_score = verification.confidence_score;
    adjusted.official_status = verification.official_signal
      ? "VERIFIED_SIGNAL"
      : "PROJECTED_SIGNAL";

    adjusted.traits = Array.isArray(score.traits)
      ? score.traits.map((trait) => ({
          ...trait,
          status: verification.official_signal
            ? "VERIFIED"
            : verification.trusted_signal
              ? "EVALUATOR_SIGNAL"
              : "PROJECTED",
          confidence_score: verification.confidence_score
        }))
      : [];

    return adjusted;
  }

  function renderVerificationBadge(container, verification) {
    if (!container || !verification) return null;

    const color = verification.official_signal
      ? "#37d67a"
      : verification.trusted_signal
        ? "#9fe7ff"
        : "#ffb100";

    container.innerHTML = `
      <div style="
        border:1px solid ${color};
        background:rgba(255,255,255,.035);
        padding:14px 16px;
        color:#f4f2ef;
        box-shadow:0 10px 26px rgba(0,0,0,.35);
      ">
        <div style="
          color:${color};
          font-weight:950;
          letter-spacing:.16em;
          text-transform:uppercase;
          font-size:12px;
        ">
          ${verification.verification_label}
        </div>

        <div style="
          margin-top:8px;
          font-size:30px;
          font-weight:950;
          color:${color};
        ">
          ${verification.confidence_score}%
        </div>

        <div style="
          margin-top:6px;
          color:#aab4c3;
          font-size:12px;
          line-height:1.45;
        ">
          ${verification.explanation.summary}
        </div>
      </div>
    `;

    return true;
  }

  function resolveCurrentAthlete() {
    return (
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null
    );
  }

  function runCurrentVerification() {
    const athlete = resolveCurrentAthlete();

    if (!athlete) {
      console.warn("[STATScore Verification] No current athlete found.");
      return null;
    }

    const verification = verifyAthlete(athlete);
    window.STATScoreCurrentVerification = verification;

    if (window.STATScoreCurrentFootballScore) {
      window.STATScoreCurrentFootballScore =
        applyVerificationToFootballScore(
          window.STATScoreCurrentFootballScore,
          verification
        );
    }

    const badge =
      document.querySelector("[data-statscore-verification-badge]") ||
      document.querySelector("#statscore-verification-badge") ||
      document.querySelector("#scVerificationBadge");

    if (badge) renderVerificationBadge(badge, verification);

    return verification;
  }

  function init() {
    if (window.__STATSCORE_VERIFICATION_ENGINE__) return;

    window.__STATSCORE_VERIFICATION_ENGINE__ = true;

    window.STATScoreVerificationEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      verifyAthlete,
      runCurrentVerification,
      applyVerificationToFootballScore,
      renderVerificationBadge
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.VerificationEngine = window.STATScoreVerificationEngine;

    const result = runCurrentVerification();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        verified: !!(result && result.ok)
      });
    }

    console.log("[STATScore Verification] Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      verified: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
