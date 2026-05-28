/* ============================================================
   STATScore™ PHNX Ranking Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Program Intelligence → Rankings → Top 10 → PHNX Sports Boards
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-phnx-ranking-engine";
  const VERSION = "v1.0-media-ranking-pipeline";

  const BOARD_TYPES = {
    PROGRAM_TOP_10: {
      label: "PHNX Sports Program Top 10",
      description: "Top ranked programs by STATScore Program Intelligence."
    },

    PROGRAM_RISING: {
      label: "Rising Programs",
      description: "Programs showing positive movement and operational improvement."
    },

    PROGRAM_VERIFIED: {
      label: "Verified Active Programs",
      description: "Programs with strong participation, transparency, and verified activity."
    },

    ATHLETE_WATCHLIST: {
      label: "Athlete Watchlist",
      description: "Athletes with strong emerging signals and pathway movement."
    },

    ATHLETE_RISING: {
      label: "Rising Athletes",
      description: "Athletes showing developmental improvement or pathway growth."
    }
  };

  function log(message, payload) {
    console.log(`[STATScore PHNX Ranking] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore PHNX Ranking] ${message}`, payload || "");
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function rankDirection(currentRank, previousRank) {
    if (!previousRank || !currentRank) return "NEW";
    if (currentRank < previousRank) return "UP";
    if (currentRank > previousRank) return "DOWN";
    return "STABLE";
  }

  function directionSymbol(direction) {
    if (direction === "UP") return "▲";
    if (direction === "DOWN") return "▼";
    if (direction === "STABLE") return "▬";
    return "★";
  }

  function directionLabel(direction) {
    if (direction === "UP") return "Rising";
    if (direction === "DOWN") return "Falling";
    if (direction === "STABLE") return "Stable";
    return "New";
  }

  function resolveProgramEngine() {
    return (
      window.STATScoreProgramIntelligenceEngine ||
      window.STATScore?.ProgramIntelligenceEngine ||
      null
    );
  }

  function calculateProgram(program) {
    const engine = resolveProgramEngine();

    if (engine?.calculateProgramIntelligence) {
      return engine.calculateProgramIntelligence(program);
    }

    return {
      ok: true,
      program_name: program.program_name,
      organization_id: program.organization_id || null,
      program_score: safeNumber(program.program_score || program.score),
      status_label: program.status_label || "Program",
      strengths: program.strengths || [],
      weaknesses: program.weaknesses || [],
      ranking_projection: program.ranking_projection || "Unclassified",
      phnx_shoutout_eligible: safeNumber(program.program_score || program.score) >= 84
    };
  }

  function buildProgramBoard(programs = [], options = {}) {
    const boardType = options.board_type || "PROGRAM_TOP_10";
    const previousRanks = options.previous_ranks || {};

    const calculated = programs
      .map(calculateProgram)
      .filter((item) => item && item.ok)
      .sort((a, b) => safeNumber(b.program_score) - safeNumber(a.program_score));

    let filtered = calculated;

    if (boardType === "PROGRAM_RISING") {
      filtered = calculated.filter((item) => {
        const previous = previousRanks[item.organization_id || item.program_name];
        const currentIndex = calculated.indexOf(item) + 1;
        return rankDirection(currentIndex, previous) === "UP" || item.phnx_shoutout_eligible;
      });
    }

    if (boardType === "PROGRAM_VERIFIED") {
      filtered = calculated.filter((item) => {
        return (
          item.status_label === "Elite Program" ||
          item.status_label === "Verified Active Program" ||
          item.phnx_shoutout_eligible
        );
      });
    }

    const board = filtered.slice(0, options.limit || 10).map((program, index) => {
      const rank = index + 1;
      const key = program.organization_id || program.program_name;
      const previousRank = previousRanks[key] || null;
      const direction = rankDirection(rank, previousRank);

      return {
        rank,
        previous_rank: previousRank,
        movement: direction,
        movement_symbol: directionSymbol(direction),
        movement_label: directionLabel(direction),

        organization_id: program.organization_id || null,
        program_name: program.program_name,
        program_score: program.program_score,
        status_label: program.status_label,
        ranking_projection: program.ranking_projection,

        strengths: program.strengths || [],
        weaknesses: program.weaknesses || [],

        phnx_shoutout_eligible: program.phnx_shoutout_eligible,
        shoutout_copy: generateProgramShoutout(program, rank, direction)
      };
    });

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      board_type: boardType,
      board_label: BOARD_TYPES[boardType]?.label || boardType,
      board_description: BOARD_TYPES[boardType]?.description || "",

      generated_at: new Date().toISOString(),
      count: board.length,
      board
    };
  }

  function generateProgramShoutout(program, rank, direction) {
    const strengths =
      Array.isArray(program.strengths) && program.strengths.length
        ? program.strengths.slice(0, 3).join(", ")
        : "program activity, athlete visibility, and operational participation";

    return `${program.program_name} checks in at #${rank} with a STATScore Program Rating of ${program.program_score}. Movement: ${directionLabel(direction)}. Key strengths: ${strengths}.`;
  }

  function buildAthleteBoard(athletes = [], options = {}) {
    const boardType = options.board_type || "ATHLETE_WATCHLIST";
    const previousRanks = options.previous_ranks || {};

    const calculated = athletes
      .map((athlete) => {
        const score =
          safeNumber(athlete.score_final) ||
          safeNumber(athlete.athletic_signal_score) ||
          safeNumber(athlete.readiness_score) ||
          safeNumber(athlete.pathway_fit_score);

        return {
          athlete_id: athlete.athlete_id || null,
          snapshot_id: athlete.snapshot_id || null,
          athlete_display_name:
            athlete.athlete_display_name ||
            [athlete.first_name, athlete.last_name].filter(Boolean).join(" ") ||
            "Unnamed Athlete",

          sport: athlete.primary_sport || athlete.sport || "Sport Pending",
          position: athlete.primary_position || athlete.position || "Position Pending",
          graduation_class: athlete.graduation_class || "Class Pending",

          score,
          readiness_score: safeNumber(athlete.readiness_score),
          pathway_fit_score: safeNumber(athlete.pathway_fit_score),
          verification_status: athlete.verification_status || "Pending",
          evidence_score: safeNumber(athlete.evidence_score)
        };
      })
      .sort((a, b) => safeNumber(b.score) - safeNumber(a.score));

    const board = calculated.slice(0, options.limit || 10).map((athlete, index) => {
      const rank = index + 1;
      const key = athlete.athlete_id || athlete.snapshot_id || athlete.athlete_display_name;
      const previousRank = previousRanks[key] || null;
      const direction = rankDirection(rank, previousRank);

      return {
        rank,
        previous_rank: previousRank,
        movement: direction,
        movement_symbol: directionSymbol(direction),
        movement_label: directionLabel(direction),

        ...athlete,

        shoutout_copy: generateAthleteShoutout(athlete, rank, direction)
      };
    });

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,

      board_type: boardType,
      board_label: BOARD_TYPES[boardType]?.label || boardType,
      board_description: BOARD_TYPES[boardType]?.description || "",

      generated_at: new Date().toISOString(),
      count: board.length,
      board
    };
  }

  function generateAthleteShoutout(athlete, rank, direction) {
    return `${athlete.athlete_display_name} enters the PHNX Sports board at #${rank}. ${athlete.sport} · ${athlete.position} · Class of ${athlete.graduation_class}. Movement: ${directionLabel(direction)}.`;
  }

  function renderRankingBoard(container, rankingResult) {
    if (!container || !rankingResult) return false;

    container.innerHTML = `
      <div style="
        border:1px solid rgba(255,52,52,.45);
        background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(0,0,0,.32));
        color:#f4f2ef;
        padding:22px;
        box-shadow:0 18px 42px rgba(0,0,0,.45);
      ">

        <div style="
          color:#ff3434;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          PHNX Sports Intelligence Board
        </div>

        <div style="
          margin-top:10px;
          font-size:34px;
          font-weight:1000;
          line-height:1;
        ">
          ${rankingResult.board_label}
        </div>

        <div style="
          margin-top:10px;
          color:#9fe7ff;
          font-size:12px;
          line-height:1.5;
        ">
          ${rankingResult.board_description}
        </div>

        <div style="
          margin-top:22px;
          display:grid;
          gap:12px;
        ">
          ${rankingResult.board.map((item) => `
            <div style="
              display:grid;
              grid-template-columns:64px 1fr auto;
              gap:14px;
              align-items:center;
              border:1px solid rgba(255,255,255,.1);
              background:rgba(0,0,0,.25);
              padding:14px;
            ">

              <div style="
                font-size:30px;
                font-weight:1000;
                color:#ffb100;
              ">
                #${item.rank}
              </div>

              <div>
                <div style="
                  font-size:18px;
                  font-weight:1000;
                  text-transform:uppercase;
                ">
                  ${item.program_name || item.athlete_display_name}
                </div>

                <div style="
                  margin-top:5px;
                  color:#9fe7ff;
                  font-size:11px;
                  letter-spacing:.1em;
                  text-transform:uppercase;
                ">
                  ${item.status_label || `${item.sport} · ${item.position} · ${item.graduation_class}`}
                </div>

                <div style="
                  margin-top:7px;
                  color:#b9c4d6;
                  font-size:12px;
                  line-height:1.45;
                ">
                  ${item.shoutout_copy}
                </div>
              </div>

              <div style="
                text-align:right;
              ">
                <div style="
                  font-size:28px;
                  font-weight:1000;
                  color:#37d67a;
                ">
                  ${item.program_score || item.score || "--"}
                </div>

                <div style="
                  margin-top:6px;
                  color:#ffb100;
                  font-size:12px;
                  font-weight:900;
                  letter-spacing:.12em;
                  text-transform:uppercase;
                ">
                  ${item.movement_symbol} ${item.movement_label}
                </div>
              </div>

            </div>
          `).join("")}
        </div>

        <div style="
          margin-top:18px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:14px;
          color:#7f8a99;
          font-size:11px;
          line-height:1.45;
        ">
          Rankings are generated from STATScore intelligence signals and are not popularity-based.
          Verified activity, participation, transparency, and performance data influence board placement.
        </div>

      </div>
    `;

    return true;
  }

  function buildPHNXSportsSegment(rankingResult) {
    if (!rankingResult || !Array.isArray(rankingResult.board)) {
      return null;
    }

    return {
      ok: true,
      segment_type: "PHNX_SPORTS_TOP_10_SHOUTOUT",
      title: rankingResult.board_label,
      generated_at: new Date().toISOString(),

      intro:
        `PHNX Sports presents this week's ${rankingResult.board_label}, powered by STATScore intelligence.`,

      shoutouts: rankingResult.board.map((item) => ({
        rank: item.rank,
        name: item.program_name || item.athlete_display_name,
        score: item.program_score || item.score,
        movement: item.movement_label,
        copy: item.shoutout_copy
      })),

      outro:
        "These rankings are intelligence-backed, participation-aware, and designed to recognize verified ecosystem activity."
    };
  }

  function runCurrentBoard() {
    const programs =
      window.STATScoreCurrentPrograms ||
      window.__STATSCORE_PROGRAM_LIST__ ||
      [];

    if (!Array.isArray(programs) || !programs.length) {
      warn("No program list found for PHNX Ranking Board.");
      return null;
    }

    const ranking =
      buildProgramBoard(programs, {
        board_type: "PROGRAM_TOP_10",
        limit: 10
      });

    window.STATScoreCurrentPHNXRankingBoard = ranking;
    window.STATScoreCurrentPHNXSegment = buildPHNXSportsSegment(ranking);

    const panel =
      document.querySelector("#scPHNXRankingBoard") ||
      document.querySelector("[data-phnx-ranking-board]");

    if (panel) {
      renderRankingBoard(panel, ranking);
    }

    return ranking;
  }

  function init() {
    if (window.__STATSCORE_PHNX_RANKING_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_PHNX_RANKING_ENGINE__ = true;

    window.STATScorePHNXRankingEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      board_types: BOARD_TYPES,

      buildProgramBoard,
      buildAthleteBoard,
      renderRankingBoard,
      buildPHNXSportsSegment,
      runCurrentBoard
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.PHNXRankingEngine =
      window.STATScorePHNXRankingEngine;

    const result = runCurrentBoard();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        ranking_generated: !!(result && result.ok)
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      ranking_generated: !!(result && result.ok)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
