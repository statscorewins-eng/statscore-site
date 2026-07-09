/* ============================================================
   STATS-CORE™ SCORE AUTHORITY ENGINE
   File: statscore-score-authority-engine.js
   Version: STATSCORE-SCORE-AUTHORITY-V3

   Owner:
   Stream 9 — Intelligence Matrix & Composite Scoring Authority

   Purpose:
   Creates the governed score model consumed by dashboards,
   Player Profile, Athletic Snapshot, Crystal outputs, and future
   intelligence views.

   Canon:
   Stream 9 calculates/interprets.
   Stream 3 displays.
   No page independently calculates official intelligence.
   Sport-specific scoring routes through Sport Scoring Router.
============================================================ */

(function(){
  "use strict";

  const ENGINE = "statscore-score-authority-engine.js";
  const VERSION = "STATSCORE-SCORE-AUTHORITY-V3";

  function n(value){
    const num = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  }

  function hasNumber(value){
    const num = n(value);
    return num !== null && num > 0;
  }

  function upper(value){
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
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
      snapshot.raw_payload?.primary_sport ||
      snapshot.raw_payload?.sport ||
      ""
    );
  }

  function getSportRouter(){
    return (
      window.STATSCORE_SPORT_SCORING_ROUTER ||
      window.STATScore?.SportScoringRouter ||
      null
    );
  }

  function getGenericScoringEngine(){
    return window.STATScoreScoringEngine || null;
  }

  function getSynthesisEngine(){
    return window.STATScore?.SynthesisEngine || null;
  }

  function getVerificationEngine(){
    return window.STATSCORE_VERIFICATION_AUTHORITY_ENGINE || null;
  }

  function deriveSportScore(snapshot){
    const router = getSportRouter();

    if(router?.score){
      try{
        const routed = router.score(snapshot);

        if(routed?.ok){
          return routed;
        }

        console.warn("[STATS-CORE Score Authority] Router score unavailable:", routed);
      }catch(error){
        console.warn("[STATS-CORE Score Authority] Sport router failed:", error);
      }
    }

    const generic = getGenericScoringEngine();

    if(generic?.explainScore){
      try{
        const output = generic.explainScore(snapshot);

        if(output?.ok){
          return output;
        }
      }catch(error){
        console.warn("[STATS-CORE Score Authority] Generic scoring failed:", error);
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

        profile_state:
          snapshot.name ||
          snapshot.athlete_display_name ||
          snapshot.athlete_name
            ? "ACTIVE"
            : "UNKNOWN",

        verification_state:
          snapshot.verification_status ||
          "UNVERIFIED",

        readiness_state:
          scoreOutput?.projection_lane?.lane ||
          scoreOutput?.score_band ||
          "DEVELOPING",

        eligibility_state:
          snapshot.ncaa_status ||
          snapshot.ncaa_eligibility_status ||
          snapshot.raw_payload?.ncaaEligibilityStatus ||
          snapshot.raw_payload?.ncaa_status ||
          "PARTIAL_REVIEW",

        pathway_state:
          scoreOutput?.projection_lane?.lane ||
          scoreOutput?.score_band ||
          "PATH_PENDING",

        media_state:
          snapshot.headshot_url ||
          snapshot.headshot_public_url ||
          snapshot.highlight_url ||
          snapshot.game_film_url ||
          snapshot.raw_payload?.headshotUrl ||
          snapshot.raw_payload?.highlightUrl ||
          snapshot.raw_payload?.gameFilmUrl
            ? "READY"
            : "PENDING",

        competition_level:
          snapshot.competition_level ||
          snapshot.raw_payload?.competitionLevel ||
          snapshot.raw_payload?.competition_level ||
          "UNVERIFIED"
      });
    }catch(error){
      console.warn("[STATS-CORE Score Authority] Synthesis failed:", error);
      return null;
    }
  }

  function deriveVerification(snapshot){
    const verification = getVerificationEngine();

    const context = {
      verification_authority:
        snapshot.verification_authority ||
        snapshot.raw_payload?.verification_authority ||
        "SELF_REPORTED",

      verification_status:
        snapshot.verification_status ||
        snapshot.raw_payload?.verificationStatus ||
        snapshot.raw_payload?.verification_status ||
        "UNVERIFIED",

      verification_color:
        snapshot.verification_color ||
        snapshot.raw_payload?.verification_color ||
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
      n(snapshot.raw_payload?.positionScore) ??
      n(snapshot.raw_payload?.athleticScore) ??
      null
    );
  }

  function getProductionScore(snapshot, finalScore){
    return (
      n(snapshot.production_score) ??
      n(snapshot.raw_payload?.productionScore) ??
      n(snapshot.raw_payload?.production_score) ??
      finalScore ??
      null
    );
  }

  function getAcademicScore(snapshot){
    const raw = (
      n(snapshot.academic_score) ??
      n(snapshot.raw_payload?.academicScore) ??
      n(snapshot.raw_payload?.academic_score) ??
      n(snapshot.gpa) ??
      n(snapshot.current_gpa) ??
      n(snapshot.raw_payload?.gpa) ??
      n(snapshot.raw_payload?.currentGpa) ??
      null
    );

    if(raw !== null && raw <= 4.5){
      return Math.min(100, Math.round((raw / 4.0) * 100));
    }

    return raw;
  }

  function getVerificationScore(snapshot, verification){
    if(verification?.is_verified) return 100;

    const status = upper(
      snapshot.verification_status ||
      snapshot.raw_payload?.verificationStatus ||
      snapshot.raw_payload?.verification_status ||
      ""
    );

    if(status.includes("PENDING") || status.includes("REVIEW")){
      return 65;
    }

    return 35;
  }

  function buildWhy(scoreOutput){
    if(Array.isArray(scoreOutput?.why_this_signal) && scoreOutput.why_this_signal.length){
      return scoreOutput.why_this_signal;
    }

    if(Array.isArray(scoreOutput?.explanation?.factors)){
      return scoreOutput.explanation.factors;
    }

    return [
      "Sport-specific scoring router applied.",
      "Position or event matrix interpreted through available athlete evidence.",
      "Verification status limits official release.",
      "Composite score remains pending until all required authority gates are complete."
    ];
  }

  function buildRiskFlags(scoreOutput, snapshot){
    const flags = Array.isArray(scoreOutput?.risk_flags)
      ? [...scoreOutput.risk_flags]
      : [];

    const verificationStatus = upper(
      snapshot.verification_status ||
      snapshot.raw_payload?.verificationStatus ||
      snapshot.raw_payload?.verification_status ||
      ""
    );

    if(!verificationStatus.includes("VERIFIED")){
      flags.push("Verification incomplete.");
    }

    const hasFilm =
      snapshot.highlight_url ||
      snapshot.game_film_url ||
      snapshot.raw_payload?.highlightUrl ||
      snapshot.raw_payload?.highlight_url ||
      snapshot.raw_payload?.gameFilmUrl ||
      snapshot.raw_payload?.game_film_url;

    if(!hasFilm){
      flags.push("Film evidence missing or incomplete.");
    }

    return Array.from(new Set(flags));
  }

  function buildDashboardScoreModel(input){
    const snapshot = normalizeInput(input);
    const scoreOutput = deriveSportScore(snapshot);
    const synthesis = deriveSynthesis(snapshot, scoreOutput);
    const verification = deriveVerification(snapshot);

    const finalScore = getFinalScore(scoreOutput, snapshot);

    const positionScore = finalScore;
    const athleticScore = finalScore;
    const productionScore = getProductionScore(snapshot, finalScore);
    const academicScore = getAcademicScore(snapshot);
    const verificationScore = getVerificationScore(snapshot, verification);

    const matrixCode =
      scoreOutput?.matrix_code ||
      scoreOutput?.matrix_id ||
      "MATRIX_PENDING";

    const scoreBand =
      scoreOutput?.score_band ||
      scoreOutput?.band ||
      "PENDING";

    return {
      engine: ENGINE,
      version: VERSION,
      snapshot_id: snapshot.snapshot_id || "",
      athlete_id: snapshot.athlete_id || "",

      sport: getSport(snapshot) || scoreOutput?.sport || "UNKNOWN",

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
      score_band: scoreBand,
      matrix_id: matrixCode,
      matrix_code: matrixCode,

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
      why_this_signal: buildWhy(scoreOutput),

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

  window.STATScore = window.STATScore || {};
  window.STATScore.ScoreAuthorityEngine = window.STATSCORE_SCORE_AUTHORITY_ENGINE;

  console.info("[STATS-CORE] Score Authority Engine loaded:", VERSION);
})(); 
