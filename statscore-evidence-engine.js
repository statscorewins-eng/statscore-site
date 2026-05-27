/* ============================================================
   STATScore™ Evidence Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Evidence → Classification → Trait Attachment → Trust Signal
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-evidence-engine";
  const VERSION = "v1.0-proof-layer";

  const EVIDENCE_TYPES = {
    HIGHLIGHT_FILM: {
      label: "Highlight Film",
      weight: 12,
      trust: "SUPPORTING"
    },
    GAME_FILM: {
      label: "Game Film",
      weight: 18,
      trust: "STRONG"
    },
    VERIFIED_EVENT: {
      label: "Verified Event",
      weight: 22,
      trust: "STRONG"
    },
    COMBINE_METRIC: {
      label: "Combine Metric",
      weight: 20,
      trust: "STRONG"
    },
    COACH_NOTE: {
      label: "Coach Note",
      weight: 10,
      trust: "SUPPORTING"
    },
    EVALUATOR_NOTE: {
      label: "Evaluator Note",
      weight: 18,
      trust: "STRONG"
    },
    RECRUITER_OBSERVATION: {
      label: "Recruiter Observation",
      weight: 12,
      trust: "SUPPORTING"
    },
    ACADEMIC_RECORD: {
      label: "Academic Record",
      weight: 16,
      trust: "STRONG"
    },
    GUARDIAN_PERMISSION: {
      label: "Guardian Permission",
      weight: 8,
      trust: "CONTROL"
    },
    PROFILE_DATA: {
      label: "Profile Data",
      weight: 5,
      trust: "BASELINE"
    }
  };

  const TRAIT_EVIDENCE_MAP = {
    PROCESSING: ["GAME_FILM", "EVALUATOR_NOTE", "COACH_NOTE"],
    DECISION_SPEED: ["GAME_FILM", "EVALUATOR_NOTE"],
    ARM_TALENT: ["GAME_FILM", "COMBINE_METRIC", "EVALUATOR_NOTE"],
    BALL_PLACEMENT: ["GAME_FILM", "EVALUATOR_NOTE"],
    FIELD_VISION: ["GAME_FILM", "EVALUATOR_NOTE", "COACH_NOTE"],
    POCKET_PRESENCE: ["GAME_FILM", "EVALUATOR_NOTE"],
    PRESSURE_RESPONSE: ["GAME_FILM", "EVALUATOR_NOTE"],
    LEADERSHIP: ["COACH_NOTE", "EVALUATOR_NOTE"],
    ESCAPE_ABILITY: ["GAME_FILM", "HIGHLIGHT_FILM", "COMBINE_METRIC"],
    DESIGNED_RUN_VALUE: ["GAME_FILM", "HIGHLIGHT_FILM"],
    OPEN_FIELD_THREAT: ["GAME_FILM", "HIGHLIGHT_FILM", "COMBINE_METRIC"],
    SCRAMBLE_TO_THROW_ABILITY: ["GAME_FILM", "HIGHLIGHT_FILM"],
    BALL_SECURITY: ["GAME_FILM", "COACH_NOTE", "EVALUATOR_NOTE"],
    SEPARATION: ["GAME_FILM", "HIGHLIGHT_FILM", "EVALUATOR_NOTE"],
    HANDS: ["GAME_FILM", "HIGHLIGHT_FILM", "EVALUATOR_NOTE"],
    ROUTE_IQ: ["GAME_FILM", "EVALUATOR_NOTE", "COACH_NOTE"],
    CONTACT_BALANCE: ["GAME_FILM", "HIGHLIGHT_FILM", "COMBINE_METRIC"],
    VISION: ["GAME_FILM", "EVALUATOR_NOTE", "COACH_NOTE"],
    BURST: ["COMBINE_METRIC", "GAME_FILM", "HIGHLIGHT_FILM"]
  };

  function log(message, payload) {
    console.log(`[STATScore Evidence] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Evidence] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  }

  function hasValue(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function evidenceItem(type, source) {
    const key = normalize(type);
    const meta = EVIDENCE_TYPES[key] || {
      label: key,
      weight: 5,
      trust: "BASELINE"
    };

    return {
      evidence_type: key,
      label: meta.label,
      trust_level: meta.trust,
      weight: meta.weight,
      source_label: source?.label || source?.source_label || meta.label,
      url: source?.url || null,
      note: source?.note || null,
      verified_by: source?.verified_by || null,
      verified_at: source?.verified_at || null,
      created_at: new Date().toISOString()
    };
  }

  function collectEvidence(athlete) {
    const evidence = [];

    if (!athlete) return evidence;

    if (hasValue(athlete.highlight_url)) {
      evidence.push(
        evidenceItem("HIGHLIGHT_FILM", {
          label: "Highlight Film",
          url: athlete.highlight_url
        })
      );
    }

    if (hasValue(athlete.game_film_url)) {
      evidence.push(
        evidenceItem("GAME_FILM", {
          label: "Game Film",
          url: athlete.game_film_url
        })
      );
    }

    if (hasValue(athlete.recruiting_profile_url)) {
      evidence.push(
        evidenceItem("PROFILE_DATA", {
          label: "Recruiting Profile",
          url: athlete.recruiting_profile_url
        })
      );
    }

    if (hasValue(athlete.verified_event_source)) {
      evidence.push(
        evidenceItem("VERIFIED_EVENT", {
          label: athlete.verified_event_source
        })
      );
    }

    if (
      hasValue(athlete.dash40) ||
      hasValue(athlete.vertical_jump) ||
      hasValue(athlete.shuttle) ||
      hasValue(athlete.height) ||
      hasValue(athlete.weight)
    ) {
      evidence.push(
        evidenceItem("COMBINE_METRIC", {
          label: "Athletic Metrics",
          note: "Metric fields present in athlete snapshot."
        })
      );
    }

    if (hasValue(athlete.coach_name) || hasValue(athlete.coach_email)) {
      evidence.push(
        evidenceItem("COACH_NOTE", {
          label: "Coach Contact / Confirmation Available",
          verified_by: athlete.coach_name || null
        })
      );
    }

    if (hasValue(athlete.academic_notes) || hasValue(athlete.current_gpa) || hasValue(athlete.ncaa_eligibility_status)) {
      evidence.push(
        evidenceItem("ACADEMIC_RECORD", {
          label: "Academic / NCAA Data Present",
          note: athlete.academic_notes || null
        })
      );
    }

    if (
      hasValue(athlete.guardian_name) ||
      hasValue(athlete.guardian_email) ||
      hasValue(athlete.verification_permission)
    ) {
      evidence.push(
        evidenceItem("GUARDIAN_PERMISSION", {
          label: "Guardian / Verification Permission",
          verified_by: athlete.guardian_name || null
        })
      );
    }

    if (athlete.raw_payload && Array.isArray(athlete.raw_payload.evidence)) {
      athlete.raw_payload.evidence.forEach((item) => {
        evidence.push(
          evidenceItem(item.type || item.evidence_type || "PROFILE_DATA", item)
        );
      });
    }

    return evidence;
  }

  function calculateEvidenceScore(evidence) {
    if (!Array.isArray(evidence) || !evidence.length) return 0;

    const total = evidence.reduce((sum, item) => {
      return sum + Number(item.weight || 0);
    }, 0);

    return Math.max(0, Math.min(100, total));
  }

  function calculateEvidenceBand(score) {
    if (score >= 85) return "EVIDENCE_STRONG";
    if (score >= 65) return "EVIDENCE_GOOD";
    if (score >= 40) return "EVIDENCE_PARTIAL";
    if (score > 0) return "EVIDENCE_LIMITED";
    return "NO_EVIDENCE";
  }

  function attachEvidenceToTraits(traits, evidence) {
    if (!Array.isArray(traits)) return [];

    return traits.map((trait) => {
      const key = normalize(trait.name);
      const allowed = TRAIT_EVIDENCE_MAP[key] || [];

      const matched = evidence.filter((item) => {
        return allowed.includes(item.evidence_type);
      });

      return {
        ...trait,
        evidence: matched,
        evidence_count: matched.length,
        evidence_status:
          matched.length >= 2
            ? "SUPPORTED"
            : matched.length === 1
              ? "PARTIAL_SUPPORT"
              : "UNSUPPORTED"
      };
    });
  }

  function analyzeEvidence(athlete, scoredResult) {
    const evidence = collectEvidence(athlete);
    const evidenceScore = calculateEvidenceScore(evidence);
    const evidenceBand = calculateEvidenceBand(evidenceScore);

    const traitsWithEvidence =
      scoredResult && Array.isArray(scoredResult.traits)
        ? attachEvidenceToTraits(scoredResult.traits, evidence)
        : [];

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,
      athlete_id: athlete?.athlete_id || null,
      snapshot_id: athlete?.snapshot_id || null,
      evidence_score: evidenceScore,
      evidence_band: evidenceBand,
      evidence_count: evidence.length,
      evidence,
      traits: traitsWithEvidence,
      proof_layer_status:
        evidenceScore >= 65
          ? "PROOF_LAYER_ACTIVE"
          : evidenceScore > 0
            ? "PROOF_LAYER_PARTIAL"
            : "PROOF_LAYER_MISSING",
      explanation: {
        summary: `Evidence layer classified this athlete as ${evidenceBand} with ${evidence.length} evidence item(s).`,
        rule: "Evidence is collected from film, verified events, athletic metrics, coach/evaluator input, academic records, guardian permission, and structured raw payload evidence.",
        limitation:
          "Evidence attachment does not make a score official by itself. Official status requires verification and governance approval."
      },
      created_at: new Date().toISOString()
    };
  }

  function applyEvidenceToFootballScore(score, evidenceResult) {
    if (!score || !score.ok || !evidenceResult || !evidenceResult.ok) {
      return score;
    }

    return {
      ...score,
      evidence_score: evidenceResult.evidence_score,
      evidence_band: evidenceResult.evidence_band,
      proof_layer_status: evidenceResult.proof_layer_status,
      traits: evidenceResult.traits.length
        ? evidenceResult.traits
        : score.traits,
      evidence: evidenceResult.evidence
    };
  }

  function renderEvidencePanel(container, evidenceResult) {
    if (!container || !evidenceResult) return null;

    const color =
      evidenceResult.evidence_score >= 65
        ? "#37d67a"
        : evidenceResult.evidence_score >= 40
          ? "#ffb100"
          : "#ff3434";

    container.innerHTML = `
      <div style="
        border:1px solid ${color};
        background:rgba(255,255,255,.035);
        padding:16px;
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
          Proof Layer · ${evidenceResult.evidence_band}
        </div>

        <div style="
          margin-top:8px;
          font-size:30px;
          font-weight:950;
          color:${color};
        ">
          ${evidenceResult.evidence_score}
        </div>

        <div style="
          margin-top:6px;
          color:#aab4c3;
          font-size:12px;
          line-height:1.45;
        ">
          ${evidenceResult.explanation.summary}
        </div>

        <div style="
          margin-top:14px;
          display:grid;
          gap:8px;
        ">
          ${evidenceResult.evidence.map((item) => `
            <div style="
              border:1px solid rgba(255,255,255,.12);
              padding:10px 12px;
              background:rgba(0,0,0,.22);
            ">
              <div style="
                color:#f4f2ef;
                font-weight:900;
                letter-spacing:.1em;
                text-transform:uppercase;
                font-size:11px;
              ">
                ${item.label}
              </div>
              <div style="
                margin-top:4px;
                color:#9fe7ff;
                font-size:11px;
                letter-spacing:.08em;
                text-transform:uppercase;
              ">
                ${item.trust_level} · Weight ${item.weight}
              </div>
            </div>
          `).join("")}
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

  function runCurrentEvidenceAnalysis() {
    const athlete = resolveCurrentAthlete();

    if (!athlete) {
      warn("No current athlete found.");
      return null;
    }

    const currentScore =
      window.STATScoreCurrentFootballScore ||
      null;

    const evidenceResult = analyzeEvidence(athlete, currentScore);

    window.STATScoreCurrentEvidence = evidenceResult;

    if (window.STATScoreCurrentFootballScore) {
      window.STATScoreCurrentFootballScore =
        applyEvidenceToFootballScore(
          window.STATScoreCurrentFootballScore,
          evidenceResult
        );
    }

    const panel =
      document.querySelector("[data-statscore-evidence-panel]") ||
      document.querySelector("#statscore-evidence-panel") ||
      document.querySelector("#scEvidencePanel");

    if (panel) renderEvidencePanel(panel, evidenceResult);

    if (
      window.STATScoreTraitRenderEngine?.renderTraits &&
      window.STATScoreCurrentFootballScore?.traits
    ) {
      const traitContainer =
        document.querySelector("[data-statscore-performance-traits]") ||
        document.querySelector("#statscore-performance-traits") ||
        document.querySelector("#scPerformanceTraits") ||
        document.querySelector(".sc-performance-traits");

      if (traitContainer) {
        window.STATScoreTraitRenderEngine.renderTraits(traitContainer, {
          sport: window.STATScoreCurrentFootballScore.sport,
          position: window.STATScoreCurrentFootballScore.position,
          archetype: window.STATScoreCurrentFootballScore.archetype,
          matrix_code: window.STATScoreCurrentFootballScore.matrix_code,
          traits: window.STATScoreCurrentFootballScore.traits
        });
      }
    }

    return evidenceResult;
  }

  function init() {
    if (window.__STATSCORE_EVIDENCE_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_EVIDENCE_ENGINE__ = true;

    window.STATScoreEvidenceEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      evidence_types: EVIDENCE_TYPES,
      trait_evidence_map: TRAIT_EVIDENCE_MAP,
      collectEvidence,
      analyzeEvidence,
      attachEvidenceToTraits,
      applyEvidenceToFootballScore,
      renderEvidencePanel,
      runCurrentEvidenceAnalysis
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.EvidenceEngine = window.STATScoreEvidenceEngine;

    const result = runCurrentEvidenceAnalysis();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        evidence_active: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      evidence_active: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
