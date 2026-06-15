/*
=========================================================
STATS-CORE™ ATHLETE PRODUCTION RECORD
Verified Sport/Position Statistical Evidence Layer
=========================================================

Canon:
- Snapshot Intake metrics = athletic disposition only.
- Production Record = verified sport/position output.
- Production Score must be backed by production evidence.
- Pages consume production intelligence; pages do not calculate final truth.
*/

window.STATSCORE_ATHLETE_PRODUCTION_RECORD = {

  TABLE: "statscore_athlete_production_records",

  getDb(){
    return window.STATScoreSupabaseClient ||
           window.STATScoreSupabase ||
           window.supabaseClient ||
           null;
  },

  clean(v){
    return String(v || "").trim();
  },

  num(v){
    const n = Number(String(v || "").replace(/[^\d.-]/g,""));
    return Number.isFinite(n) ? n : 0;
  },

  normalizeSport(v){
    return this.clean(v).toLowerCase().replace(/\s+/g,"_");
  },

  normalizePosition(v){
    const p = this.clean(v).toLowerCase();

    if(["qb","quarterback"].includes(p)) return "quarterback";
    if(["wr","wide receiver"].includes(p)) return "wide_receiver";
    if(["rb","running back"].includes(p)) return "running_back";
    if(["db","defensive back","cb","cornerback","safety"].includes(p)) return "defensive_back";

    return p.replace(/\s+/g,"_");
  },

  normalizeRecord(row = {}){
    return {
      production_record_id: row.production_record_id || row.id || null,
      athlete_id: row.athlete_id || null,
      snapshot_id: row.snapshot_id || null,

      snapshot_stage: row.snapshot_stage || "varsity",
      snapshot_year: row.snapshot_year || null,

      sport: this.normalizeSport(row.sport || row.primary_sport),
      position: this.normalizePosition(row.position || row.primary_position),

      season_label: row.season_label || row.season || "",
      grade_level: row.grade_level || "",

      games_played: this.num(row.games_played),

      passing_yards: this.num(row.passing_yards),
      passing_tds: this.num(row.passing_tds),
      passing_attempts: this.num(row.passing_attempts),
      passing_completions: this.num(row.passing_completions),
      interceptions: this.num(row.interceptions),

      rushing_yards: this.num(row.rushing_yards),
      rushing_tds: this.num(row.rushing_tds),

      total_yards: this.num(row.total_yards) ||
        (this.num(row.passing_yards) + this.num(row.rushing_yards)),

      total_tds: this.num(row.total_tds) ||
        (this.num(row.passing_tds) + this.num(row.rushing_tds)),

      varsity_years: this.num(row.varsity_years),
      varsity_letterman: row.varsity_letterman === true || row.varsity_letterman === "true",

      awards_count: this.num(row.awards_count),
      player_of_game_count: this.num(row.player_of_game_count),

      source_name: row.source_name || "STATS-CORE",
      source_type: row.source_type || "submitted",
      verification_level: row.verification_level || "UNVERIFIED",

      verified_by: row.verified_by || "",
      verified_at: row.verified_at || null,

      raw_payload: row.raw_payload || row
    };
  },

  calculateFootballQB(record){
    let score = 50;
    const why = [];

    if(record.passing_yards >= 6000){
      score += 16;
      why.push("Elite verified career passing production.");
    }else if(record.passing_yards >= 4000){
      score += 12;
      why.push("High verified career passing production.");
    }else if(record.passing_yards >= 2500){
      score += 8;
      why.push("Recruitable passing production.");
    }

    if(record.passing_tds >= 50){
      score += 12;
      why.push("High touchdown production.");
    }else if(record.passing_tds >= 30){
      score += 8;
      why.push("Strong touchdown production.");
    }

    if(record.total_yards >= 6500){
      score += 10;
      why.push("Total offense impact includes rushing production.");
    }else if(record.total_yards >= 4500){
      score += 7;
      why.push("Strong total offensive production.");
    }

    if(record.varsity_years >= 4){
      score += 8;
      why.push("Four-year varsity production signal.");
    }else if(record.varsity_years >= 3){
      score += 6;
      why.push("Multi-year varsity production signal.");
    }

    if(record.varsity_letterman){
      score += 4;
      why.push("Varsity letterman status confirmed.");
    }

    if(record.player_of_game_count >= 3){
      score += 5;
      why.push("Repeated game-impact recognition.");
    }

    if(record.verification_level.includes("PHNX_CERTIFIED")){
      score += 8;
      why.push("PHNX-certified verification carries highest trust weight.");
    }else if(record.verification_level.includes("COACH_VERIFIED")){
      score += 5;
      why.push("Coach-verified production evidence.");
    }else if(record.verification_level.includes("THIRD_PARTY")){
      score += 3;
      why.push("Third-party production evidence present.");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let tier = "DEVELOPMENTAL";
    let level = "Needs Evidence";

    if(score >= 90){
      tier = "ELITE";
      level = "Power 4 / High D1 Watch";
    }else if(score >= 84){
      tier = "HIGH";
      level = "D1 / FCS / G5 Fit";
    }else if(score >= 76){
      tier = "RECRUITABLE";
      level = "D2 / NAIA / FCS Development";
    }else if(score >= 65){
      tier = "DEVELOPING";
      level = "D3 / NAIA / JUCO / Prep";
    }

    return {
      sport: "football",
      position: "quarterback",
      production_score: score,
      production_tier: tier,
      production_level: level,
      total_yards: record.total_yards,
      total_tds: record.total_tds,
      verification_level: record.verification_level,
      why
    };
  },

  evaluate(record = {}){
    const r = this.normalizeRecord(record);

    if(r.sport === "football" && r.position === "quarterback"){
      return this.calculateFootballQB(r);
    }

    return {
      sport: r.sport,
      position: r.position,
      production_score: 0,
      production_tier: "NO_SPORT_ENGINE",
      production_level: "Sport/position production engine not built yet.",
      verification_level: r.verification_level,
      why: [
        "Production record exists, but no scoring engine is active for this sport/position yet."
      ]
    };
  },

  async loadBySnapshot(snapshotId){
    const db = this.getDb();

    if(!db || !snapshotId){
      return null;
    }

    const { data, error } = await db
      .from(this.TABLE)
      .select("*")
      .eq("snapshot_id", snapshotId)
      .order("snapshot_year", { ascending:false })
      .limit(1)
      .maybeSingle();

    if(error){
      console.error("Production Record load failed:", error);
      return null;
    }

    return data ? this.normalizeRecord(data) : null;
  },

  async evaluateBySnapshot(snapshotId){
    const record = await this.loadBySnapshot(snapshotId);

    if(!record){
      return {
        production_score: 0,
        production_tier: "NO_PRODUCTION_RECORD",
        production_level: "Verified production record required.",
        why: [
          "No athlete production record exists for this snapshot yet."
        ]
      };
    }

    return this.evaluate(record);
  }
};

console.log("STATS-CORE Athlete Production Record Layer Loaded"); 
