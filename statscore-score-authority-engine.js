/* ============================================================
   STATS-CORE™ SCORE AUTHORITY ENGINE
   File: statscore-score-authority-engine.js
   Owner: Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Authority bridge between existing scoring engines and consumer pages.

   This file does NOT invent scoring science.
   It consumes existing engines:
   - window.STATScoreScoringEngine
   - window.STATScore.SynthesisEngine

   Provides:
   - getDashboardScoreModel(input)
   - getProfileScoreModel(input)

   Canon:
   Pages render intelligence.
   Stream 9 produces governed intelligence.
============================================================ */

(function(){
  "use strict";

  const ENGINE = "statscore-score-authority-engine.js";
  const VERSION = "STATSCORE-SCORE-AUTHORITY-V1";

  function n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function safe(value, fallback = "—"){
    return value === null || value === undefined || value === "" ? fallback : value;
  }

  function normalizeInput(input){
    if(!input) return {};

    if(typeof input === "string"){
      return { snapshot_id: input };
    }

    return input;
  }

  function getScoringEngine(){
    return window.STATScoreScoringEngine || null;
  }

  function getSynthesisEngine(){
    return window.STATScore?.SynthesisEngine || null;
  }

  function deriveScore(snapshot){
    const scoring = getScoringEngine();

    if(scoring?.explainScore){
      try{
        const output = scoring.explainScore(snapshot);
        if(output?.ok){
          return output;
        }
      }catch(error){
        console.warn("[STATS-CORE Score Authority] Scoring engine failed:", error);
      }
    }

    return null;
  }

  function deriveSynthesis(snapshot, scoreOutput){
    const synthesis = getSynthesisEngine();

    if(!synthesis?.synthesize) return null;

    try{
      return synthesis.synthesize({
        athlete_id: snapshot.athlete_id,
        snapshot_id: snapshot.snapshot_id,
        profile_state: snapshot.name || snapshot.athlete_display_name ? "ACTIVE" : "UNKNOWN",
        verification_state: snapshot.verification_status || "UNVERIFIED",
        readiness_state: scoreOutput?.projection_lane?.lane || "DEVELOPING",
        eligibility_state: snapshot.ncaa_status || "PARTIAL_REVIEW",
        pathway_state: scoreOutput?.projection_lane?.lane || "PATH_PENDING",
        media_state: snapshot.headshot_url || snapshot.headshot_public_url ? "READY" : "PENDING",
        competition_level: snapshot.competition_level || "UNVERIFIED"
      });
    }catch(error){
      console.warn("[STATS-CORE Score Authority] Synthesis engine failed:", error);
      return null;
    }
  }

  function buildDashboardScoreModel(input){
    const snapshot = normalizeInput(input);
    const scoreOutput = deriveScore(snapshot);
    const synthesis = deriveSynthesis(snapshot, scoreOutput);

    const finalScore =
      n(scoreOutput?.final_score) ??
      n(snapshot.position_score) ??
      n(snapshot.athletic_score) ??
      null;

    const verificationLabel =
      scoreOutput?.components?.verification?.label ||
      snapshot.verification_status ||
      "UNVERIFIED";

    const compositeAllowed = false;

    return {
      engine: ENGINE,
      version: VERSION,
      snapshot_id: snapshot.snapshot_id || "",
      athlete_id: snapshot.athlete_id || "",

      composite_status: "PENDING",
      composite_display_allowed: compositeAllowed,
      composite_value: "🔒",
      composite_state: "COMPOSITE SCORE PENDING",

      position_score: finalScore ?? "—",
      athletic_score: finalScore ?? "—",
      production_score: finalScore ?? "—",
      academic_score: n(snapshot.academic_score) ?? "—",
      character_score: "—",

      score_status: verificationLabel,
      final_score: finalScore,
      matrix_id: scoreOutput?.matrix_id || "MATRIX_PENDING",

      star_signal: scoreOutput?.star_signal || null,
      projection_lane: scoreOutput?.projection_lane || null,
      risk_flags: scoreOutput?.risk_flags || [],
      why_this_signal: scoreOutput?.why_this_signal || [],

      confidence_score:
        n(synthesis?.confidence_score) ??
        n(scoreOutput?.components?.verification?.score) ??
        0,

      completion_score:
        n(synthesis?.completion_score) ??
        n(scoreOutput?.components?.completion?.score) ??
        0,

      synthesis,
      scoring_output: scoreOutput,

      display_rule:
        "Composite remains pending until final composite authority gates are complete. Domain signals may display as unverified intelligence."
    };
  }

  window.STATSCORE_SCORE_AUTHORITY_ENGINE = {
    engine: ENGINE,
    version: VERSION,
    status: "ACTIVE",

    getDashboardScoreModel(input){
      return buildDashboardScoreModel(input);
    },

    getProfileScoreModel(input){
      return buildDashboardScoreModel(input);
    },

    explain(input){
      return buildDashboardScoreModel(input);
    }
  };

  console.info("[STATS-CORE] Score Authority Engine loaded:", VERSION);
})(); 
