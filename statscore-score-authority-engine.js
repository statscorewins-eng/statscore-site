/* ============================================================
   STATS-CORE™ SCORE AUTHORITY ENGINE
   File: statscore-score-authority-engine.js
   Version: STATSCORE-SCORE-AUTHORITY-V2

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Creates the governed score model consumed by dashboards,
   Player Profile, Athletic Snapshot, and future intelligence views.

   Canon:
   Stream 9 calculates/interprets.
   Stream 3 displays.
   No page independently calculates official intelligence.
============================================================ */

(function(){
  "use strict";

  const ENGINE = "statscore-score-authority-engine.js";
  const VERSION = "STATSCORE-SCORE-AUTHORITY-V2";

  function n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function hasNumber(value){
    const num = n(value);
    return num !== null && num > 0;
  }

  function safe(value, fallback = "—"){
    return value === null || value === undefined || value === "" ? fallback : value;
  }

  function upper(value){
    return String(value || "").trim().toUpperCase();
  }

  function normalizeInput(input){
    if(!input) return {};
    if(typeof input === "string") return { snapshot_id: input };
    return input;
  }

  function getSport(snapshot){
    return upper(
      snapshot.primary_sport ||
      snapshot.sport ||
      snapshot.raw_payload?.primarySport ||
      snapshot.raw_payload?.sport
    );
  }

  function getScoringEngine(){
    return window.STATScoreScoringEngine || null;
  }

  function getFootballEngine(){
    return window.STATScoreFootballScoringEngine || window.STATScore?.FootballScoringEngine || null;
  }

  function getSynthesisEngine(){
    return window.STATScore?.SynthesisEngine || null;
  }

  function getVerificationEngine(){
    return window.STATSCORE_VERIFICATION_AUTHORITY_ENGINE || null;
  }

  function calculateFootballScore(snapshot){
    const football = getFootballEngine();

    if(!football?.scoreAthlete) return null;

    try{
      const output = football.scoreAthlete(snapshot);

      if(output?.ok){
        return output;
      }

      console.warn("[STATS-CORE Score Authority] Football score unavailable:", output);
      return null;
    }catch(error){
      console.warn("[STATS-CORE Score Authority] Football scoring failed:", error);
      return null;
    }
  }

  function calculateGenericScore(snapshot){
    const scoring = getScoringEngine();

    if(!scoring?.explainScore) return null;

    try{
      const output = scoring.explainScore(snapshot);

      if(output?.ok){
        return output;
      }

      return null;
    }catch(error){
      console.warn("[STATS-CORE Score Authority] Generic scoring failed:", error);
      return null;
    }
  }

  function deriveSportScore(snapshot){
    const sport = getSport(snapshot);

    if(sport === "FOOTBALL" || !sport){
      const footballScore = calculateFootballScore(snapshot);
      if(footballScore) return footballScore;
    }

    const genericScore = calculateGenericScore(snapshot);
    if(genericScore) return genericScore;

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
        readiness_state:
          scoreOutput?.projection_lane?.lane ||
          scoreOutput?.score_band ||
          "DEVELOPING",
        eligibility_state:
          snapshot.ncaa_status ||
          snapshot.ncaa_eligibility_status ||
          "PARTIAL_REVIEW",
        pathway_state:
          scoreOutput?.projection_lane?.lane ||
          scoreOutput?.score_band ||
          "PATH_PENDING",
        media_state:
          snapshot.headshot_url ||
          snapshot.headshot_public_url ||
          snapshot.highlight_url ||
          snapshot.game_film_url
            ? "READY"
            : "PENDING",
        competition_level: snapshot.competition_level || "UNVERIFIED"
      });
    }catch(error){
      console.warn("[STATS-CORE Score Authority] Synthesis failed:", error);
      return null;
    }
  }

  function deriveVerification(snapshot, scoreOutput){
    const verification = getVerificationEngine();

    const context = {
      verification_authority:
        snapshot.verification_authority ||
        "SELF_REPORTED",
      verification_status:
        snapshot.verification_status ||
        "UNVERIFIED",
      verification_color:
        snapshot.verification_color ||
        "YELLOW"
    };

    if(verification?.resolveVerificationModel){
      try{
        return verification.resolveVerificationModel(context);
      }catch(error){
        console.warn("[STATS-CORE Score Authority] Verification model failed:", error);
      }
    }

    const verified =
      upper(context.verification_status).includes("VERIFIED") &&
      upper(context.verification_authority) !== "SELF_REPORTED";

    return {
      verification_authority: context.verification_authority,
      verification_status: verified ? "VERIFIED" : "UNVERIFIED",
      verification_color: verified ? "GREEN" : "YELLOW",
      is_verified: verified,
      is_self_reported: upper(context.verification_authority) === "SELF_REPORTED"
    };
  }

  function getFinalScore(scoreOutput, snapshot){
    return (
      n(scoreOutput?.final_score) ??
      n(scoreOutput?.score_final) ??
      n(scoreOutput?.score) ??
      n(snapshot.position_score) ??
      n(snapshot.athletic_score) ??
      null
    );
  }

  function getProductionScore(snapshot, productionFallback){
    return (
      n(snapshot.production_score) ??
      n(snapshot.raw_payload?.productionScore) ??
      n(snapshot.raw_payload?.production_score) ??
      productionFallback ??
      null
    );
  }

  function getAcademicScore(snapshot){
    return (
      n(snapshot.academic_score) ??
      n(snapshot.raw_payload?.academicScore) ??
      n(snapshot.raw_payload?.academic_score) ??
      n(snapshot.gpa) ??
      n(snapshot.current_gpa) ??
      n(snapshot.raw_payload?.gpa) ??
      n(snapshot.raw_payload?.currentGpa) ??
      null
    );
  }

  function buildWhy(scoreOutput, snapshot){
    if(Array.isArray(scoreOutput?.why_this_signal) && scoreOutput.why_this_signal.length){
      return scoreOutput.why_this_signal;
    }

    if(Array.isArray(scoreOutput?.explanation?.factors)){
      return scoreOutput.explanation.factors;
    }

    return [
      "Sport-specific scoring authority applied.",
      "Position matrix interpreted through available athlete evidence.",
      "Verification status limits official release.",
      "Composite score remains pending until all required authority gates are complete."
    ];
  }

  function buildRiskFlags(scoreOutput, snapshot){
    const flags = Array.isArray(scoreOutput?.risk_flags)
      ? [...scoreOutput.risk_flags]
      : [];

    if(!upper(snapshot.verification_status).includes("VERIFIED")){
      flags.push("Verification incomplete.");
    }

    if(!snapshot.highlight_url && !snapshot.game_film_url){
      flags.push("Film evidence missing or incomplete.");
    }

    return Array.from(new Set(flags));
  }

  function buildDashboardScoreModel(input){
    const snapshot = normalizeInput(input);
    const scoreOutput = deriveSportScore(snapshot);
    const synthesis = deriveSynthesis(snapshot, scoreOutput);
    const verification = deriveVerification(snapshot, scoreOutput);

    const finalScore = getFinalScore(scoreOutput, snapshot);

    const positionScore = finalScore;
    const athleticScore = finalScore;

    const productionScore = getProductionScore(
      snapshot,
      finalScore
    );

    const academicRaw = getAcademicScore(snapshot);

    const academicScore =
      academicRaw !== null && academicRaw <= 4.5
        ? Math.round((academicRaw / 4.0) * 100)
        : academicRaw;

    const verificationScore =
      verification.is_verified
        ? 100
        : upper(snapshot.verification_status).includes("PENDING")
          ? 65
          : 35;

    return {
      engine: ENGINE,
      version: VERSION,
      snapshot_id: snapshot.snapshot_id || "",
      athlete_id: snapshot.athlete_id || "",

      composite_status: "PENDING",
      composite_display_allowed: false,
      composite_value: "🔒",
      composite_state: "COMPOSITE SCORE PENDING",

      position_score: hasNumber(positionScore) ? positionScore : "—",
      athletic_score: hasNumber(athleticScore) ? athleticScore : "—",
      production_score: hasNumber(productionScore) ? productionScore : "—",
      academic_score: hasNumber(academicScore) ? academicScore : "—",

      verification_score: verificationScore,

      /*
        Temporary compatibility:
        Old dashboard HTML still has data-character-score.
        Character is inactive by doctrine.
        This value is verification intelligence until the HTML label is updated.
      */
      character_score: verificationScore,

      score_status:
        scoreOutput?.official_status ||
        verification.verification_status ||
        "UNVERIFIED",

      final_score: finalScore,
      score_band:
        scoreOutput?.score_band ||
        "PENDING",
      matrix_id:
        scoreOutput?.matrix_code ||
        scoreOutput?.matrix_id ||
        "MATRIX_PENDING",

      star_signal:
        scoreOutput?.star_signal ||
        scoreOutput?.star_projection ||
        null,

      projection_lane:
        scoreOutput?.projection_lane ||
        {
          lane: "VERIFY_FIRST",
          label: "Verification First",
          explanation: "Profile signal remains limited until evidence is verified."
        },

      risk_flags: buildRiskFlags(scoreOutput, snapshot),
      why_this_signal: buildWhy(scoreOutput, snapshot),

      confidence_score:
        n(synthesis?.confidence_score) ??
        verificationScore,

      completion_score:
        n(synthesis?.completion_score) ??
        0,

      traits:
        Array.isArray(scoreOutput?.traits)
          ? scoreOutput.traits
          : [],

      synthesis,
      verification,
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
