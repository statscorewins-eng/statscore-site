/*
=========================================================
STATS-CORE™ PRODUCTION ENGINE
Verified Sport/Position Production Intelligence Layer
=========================================================

Canon:
- Pages do NOT calculate Production Score.
- Production Score belongs to this engine.
- Snapshot Intake metrics = athletic disposition only.
- Verified sport-position production = true grading layer.
*/

window.STATSCORE_PRODUCTION_ENGINE = {
  normalizeSport(value){
    const v = String(value || "").toLowerCase();
    if(v.includes("football")) return "football";
    if(v.includes("basketball")) return "basketball";
    if(v.includes("baseball")) return "baseball";
    if(v.includes("track")) return "track";
    return "unknown";
  },

  normalizePosition(value){
    const v = String(value || "").toLowerCase();

    if(v.includes("quarterback") || v === "qb") return "quarterback";
    if(v.includes("wide receiver") || v === "wr") return "wide_receiver";
    if(v.includes("running back") || v === "rb") return "running_back";
    if(v.includes("defensive back") || v.includes("corner") || v.includes("safety") || v === "db") return "defensive_back";

    return v.replace(/\s+/g, "_") || "athlete";
  },

  verificationWeight(level){
    const v = String(level || "").toUpperCase();

    if(v.includes("PHNX_CAMP") || v.includes("PHNX_COMBINE")) return 1.25;
    if(v.includes("PHNX_EVALUATOR")) return 1.20;
    if(v.includes("PHNX_CERTIFIED_COACH")) return 1.15;
    if(v.includes("COACH_VERIFIED")) return 1.10;
    if(v.includes("STATSCORE_VERIFIED")) return 1.10;
    if(v.includes("EXTERNAL_EVIDENCE")) return 1.00;

    return 0.75;
  },

  calculateQB(stats = {}){
    const passingYards = Number(stats.passing_yards || 0);
    const passingTDs = Number(stats.passing_tds || 0);
    const rushingYards = Number(stats.rushing_yards || 0);
    const totalYards = Number(stats.total_yards || passingYards + rushingYards || 0);
    const games = Number(stats.games_played || 0);
    const completion = Number(stats.completion_percentage || 0);
    const interceptions = Number(stats.interceptions || 0);
    const varsityYears = Number(stats.varsity_years || 0);
    const playerAwards = Number(stats.player_of_game_count || 0);
    const freshmanLetterman = Boolean(stats.freshman_letterman);

    let score = 50;

    if(totalYards >= 6500) score += 16;
    else if(totalYards >= 4500) score += 12;
    else if(totalYards >= 2500) score += 8;
    else if(totalYards >= 1000) score += 4;

    if(passingTDs >= 50) score += 12;
    else if(passingTDs >= 35) score += 9;
    else if(passingTDs >= 20) score += 6;
    else if(passingTDs >= 10) score += 3;

    if(completion >= 62) score += 8;
    else if(completion >= 58) score += 6;
    else if(completion >= 54) score += 4;

    if(games >= 30) score += 8;
    else if(games >= 20) score += 6;
    else if(games >= 10) score += 3;

    if(varsityYears >= 4) score += 8;
    else if(varsityYears >= 3) score += 6;
    else if(varsityYears >= 2) score += 3;

    if(freshmanLetterman) score += 4;

    if(playerAwards >= 5) score += 6;
    else if(playerAwards >= 3) score += 4;
    else if(playerAwards >= 1) score += 2;

    if(interceptions > 0 && passingTDs > 0){
      const tdIntRatio = passingTDs / interceptions;
      if(tdIntRatio >= 3) score += 5;
      else if(tdIntRatio >= 2) score += 3;
      else if(tdIntRatio >= 1.5) score += 1;
    }

    const weighted = score * this.verificationWeight(stats.verification_level);
    const finalScore = Math.max(0, Math.min(100, Math.round(weighted)));

    return this.packageResult(finalScore, "quarterback", stats, [
      `${totalYards} total offensive yards`,
      `${passingYards} passing yards`,
      `${rushingYards} rushing yards`,
      `${passingTDs} passing touchdowns`,
      `${games} varsity games`,
      `${varsityYears} varsity years`,
      freshmanLetterman ? "Freshman varsity letterman signal present" : "Freshman letterman signal not present",
      `${playerAwards} Player of the Game awards`,
      `Verification level: ${stats.verification_level || "SELF_REPORTED"}`
    ]);
  },

  packageResult(score, position, stats, why = []){
    let tier = "Developmental";
    let level = "Evidence Building";

    if(score >= 92){
      tier = "Excellent";
      level = "High-value recruiting target";
    }else if(score >= 85){
      tier = "Best";
      level = "Strong program-fit candidate";
    }else if(score >= 75){
      tier = "Good";
      level = "Recruitable with fit/context review";
    }

    return {
      production_score: score,
      position_score: score,
      production_tier: tier,
      production_level: level,
      position,
      sport: stats.sport || "football",
      verification_level: stats.verification_level || "SELF_REPORTED",
      why
    };
  },

  evaluate(stats = {}){
    const sport = this.normalizeSport(stats.sport);
    const position = this.normalizePosition(stats.position);

    if(sport === "football" && position === "quarterback"){
      return this.calculateQB({...stats, sport, position});
    }

    return this.packageResult(0, position, stats, [
      "Production matrix not yet built for this sport/position."
    ]);
  }
};

window.runStatsCoreProductionEngine = function(stats){
  return window.STATSCORE_PRODUCTION_ENGINE.evaluate(stats);
};

console.log("STATS-CORE Production Engine Loaded"); 
