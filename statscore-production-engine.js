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
- Multiple season records aggregate into one career production signal.
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

  n(value){
    const x = Number(String(value ?? "").replace(/,/g,"").replace(/[^\d.-]/g,""));
    return Number.isFinite(x) ? x : 0;
  },

  payload(record = {}){
    return record.production_payload || record.raw_payload || record || {};
  },

  value(record = {}, key){
    const p = this.payload(record);
    return p[key] ?? record[key] ?? null;
  },

  verificationWeight(level){
    const v = String(level || "").toUpperCase();

    if(v.includes("OFFICIAL_STAT_SOURCE")) return 1.20;
    if(v.includes("OFFICIAL")) return 1.15;
    if(v.includes("PHNX_CAMP") || v.includes("PHNX_COMBINE")) return 1.25;
    if(v.includes("PHNX_EVALUATOR")) return 1.20;
    if(v.includes("PHNX_CERTIFIED_COACH")) return 1.15;
    if(v.includes("COACH_VERIFIED")) return 1.10;
    if(v.includes("STATSCORE_VERIFIED")) return 1.10;
    if(v.includes("EXTERNAL_EVIDENCE")) return 1.00;
    if(v.includes("SELF_REPORTED")) return 0.75;

    return 0.75;
  },

  strongestVerification(records = []){
    const levels = records.map(r => String(this.value(r,"verification_level") || "").toUpperCase());
    if(levels.some(v => v.includes("PHNX_CAMP") || v.includes("PHNX_COMBINE"))) return "PHNX_CAMP_COMBINE";
    if(levels.some(v => v.includes("PHNX_EVALUATOR"))) return "PHNX_EVALUATOR";
    if(levels.some(v => v.includes("OFFICIAL_STAT_SOURCE"))) return "OFFICIAL_STAT_SOURCE";
    if(levels.some(v => v.includes("OFFICIAL"))) return "OFFICIAL_STAT_SOURCE";
    if(levels.some(v => v.includes("PHNX_CERTIFIED_COACH"))) return "PHNX_CERTIFIED_COACH";
    if(levels.some(v => v.includes("COACH_VERIFIED"))) return "COACH_VERIFIED";
    if(levels.some(v => v.includes("STATSCORE_VERIFIED"))) return "STATSCORE_VERIFIED";
    if(levels.some(v => v.includes("EXTERNAL_EVIDENCE"))) return "EXTERNAL_EVIDENCE";
    return "SELF_REPORTED";
  },

  aggregateRecords(records = []){
    const list = Array.isArray(records) ? records : [];

    const sorted = [...list].sort((a,b)=>{
      return this.n(this.value(a,"snapshot_year")) - this.n(this.value(b,"snapshot_year"));
    });

    const latest = sorted[sorted.length - 1] || {};
    const latestPayload = this.payload(latest);

    const sum = key => sorted.reduce((t,r)=>t + this.n(this.value(r,key)),0);
    const max = key => sorted.reduce((m,r)=>Math.max(m,this.n(this.value(r,key))),0);

    const games = sum("games_played");
    const passingYards = sum("passing_yards");
    const rushingYards = sum("rushing_yards");
    const totalYards = sum("total_yards") || passingYards + rushingYards;
    const passingTDs = sum("passing_tds");
    const rushingTDs = sum("rushing_tds");
    const totalTDs = sum("total_tds") || passingTDs + rushingTDs;
    const interceptions = sum("interceptions");
    const attempts = sum("passing_attempts");
    const completions = sum("passing_completions");
    const awards = sum("awards_count");
    const pog = sum("player_of_game_count");

    const completion = attempts > 0 ? Number(((completions / attempts) * 100).toFixed(1)) : max("completion_percentage");
    const passingYPG = games > 0 ? Number((passingYards / games).toFixed(1)) : max("passing_yards_per_game");
    const totalYPG = games > 0 ? Number((totalYards / games).toFixed(1)) : max("total_yards_per_game");

    const varsityYears =
      sorted.length ||
      max("varsity_years");

    const seasonLabels = sorted.map(r => this.value(r,"season_label")).filter(Boolean);

    return {
      sport: latestPayload.sport || latest.sport || "football",
      position: latestPayload.position || latest.position || "quarterback",
      snapshot_stage: latestPayload.snapshot_stage || latest.snapshot_stage || "varsity",
      snapshot_year: latestPayload.snapshot_year || latest.snapshot_year || null,

      seasons: sorted.length,
      season_labels: seasonLabels,

      games_played: games,
      varsity_years: varsityYears,

      passing_attempts: attempts,
      passing_completions: completions,
      passing_yards: passingYards,
      passing_tds: passingTDs,
      interceptions,

      completion_percentage: completion,
      passing_yards_per_game: passingYPG,

      rushing_yards: rushingYards,
      rushing_tds: rushingTDs,

      total_yards: totalYards,
      total_tds: totalTDs,
      total_yards_per_game: totalYPG,

      awards_count: awards,
      player_of_game_count: pog,

      verification_level: this.strongestVerification(sorted),
      records: sorted
    };
  },

  calculateQB(stats = {}){
    const passingYards = this.n(stats.passing_yards);
    const passingTDs = this.n(stats.passing_tds);
    const rushingYards = this.n(stats.rushing_yards);
    const totalYards = this.n(stats.total_yards) || passingYards + rushingYards;
    const games = this.n(stats.games_played);
    const completion = this.n(stats.completion_percentage);
    const interceptions = this.n(stats.interceptions);
    const varsityYears = this.n(stats.varsity_years);
    const playerAwards = this.n(stats.player_of_game_count);
    const seasons = this.n(stats.seasons);
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

    if(seasons >= 4) score += 3;

    if(freshmanLetterman) score += 4;

    if(playerAwards >= 8) score += 7;
    else if(playerAwards >= 5) score += 6;
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
      `${seasons || 1} season record(s) evaluated`,
      `${totalYards} total offensive yards`,
      `${passingYards} passing yards`,
      `${rushingYards} rushing yards`,
      `${passingTDs} passing touchdowns`,
      `${stats.total_tds || passingTDs} total touchdowns`,
      `${games} varsity games`,
      `${varsityYears} varsity years / season span`,
      `${playerAwards} Player of the Game awards`,
      `Completion rate: ${completion || "N/A"}%`,
      `Verification level: ${stats.verification_level || "SELF_REPORTED"}`
    ]);
  },

  packageResult(score, position, stats, why = []){
    let tier = "Developmental";
    let level = "Evidence Building";
    let signal = "Production Evidence Building";

    if(score >= 92){
      tier = "Excellent"; 
      level = "High-value recruiting target";
      signal = "Elite Verified Production Signal";
    }else if(score >= 85){
      tier = "Best";
      level = "Strong program-fit candidate";
      signal = "Strong Verified Production Signal";
    }else if(score >= 75){
      tier = "Good";
      level = "Recruitable with fit/context review";
      signal = "Verified Recruitable Production Signal";
    }else if(score >= 65){
      tier = "Developing";
      level = "Needs added evidence/context";
      signal = "Developing Production Signal";
    }

    return {
      production_score: score,
      position_score: score,
      production_tier: tier,
      production_level: level,
      production_signal: signal,
      position,
      sport: stats.sport || "football",
      verification_level: stats.verification_level || "SELF_REPORTED",
      seasons: stats.seasons || 1,
      career_totals: {
        games_played: stats.games_played || 0,
        passing_yards: stats.passing_yards || 0,
        passing_tds: stats.passing_tds || 0,
        rushing_yards: stats.rushing_yards || 0,
        rushing_tds: stats.rushing_tds || 0,
        total_yards: stats.total_yards || 0,
        total_tds: stats.total_tds || 0,
        awards_count: stats.awards_count || 0,
        player_of_game_count: stats.player_of_game_count || 0
      },
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
  },

  evaluateCareer(records = []){
    const aggregate = this.aggregateRecords(records);
    return this.evaluate(aggregate);
  }
};

window.runStatsCoreProductionEngine = function(statsOrRecords){
  if(Array.isArray(statsOrRecords)){
    return window.STATSCORE_PRODUCTION_ENGINE.evaluateCareer(statsOrRecords);
  }

  return window.STATSCORE_PRODUCTION_ENGINE.evaluate(statsOrRecords);
};

console.log("STATS-CORE Production Engine Loaded"); 
