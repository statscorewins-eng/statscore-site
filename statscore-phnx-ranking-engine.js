/* ============================================================
   STATS-CORE™ / PHNX SPORTS
   File: statscore-phnx-ranking-engine.js
   Version: STATSCORE-PHNX-RANKING-V2-GOVERNED-PUBLICATION

   Owner:
   Stream 7 — PHNX Sports Ranking / Exposure Publication Authority

   Constitutional Purpose:
   Publish governed ranking and leaderboard intelligence supplied
   by the lawful enterprise intelligence/ranking authority.

   STREAM 7 MAY:
   - validate ranking-publication contracts;
   - classify leaderboard publication type;
   - order already-ranked entries for presentation;
   - preserve ranking criteria and authority;
   - preserve ranking version/history;
   - calculate DISPLAY movement from governed current/previous rank;
   - compose PHNX board presentation;
   - compose PHNX Sports segment presentation;
   - prepare ranking publication handoff;
   - preserve Publication Receipt references.

   STREAM 7 SHALL NOT:
   - calculate Athletic Score;
   - calculate STATScore;
   - calculate Program Health;
   - calculate Program Intelligence;
   - calculate Development Intelligence;
   - calculate Academic Intelligence;
   - calculate Pathway Fit;
   - determine Stars;
   - calculate official rank;
   - choose one score as a substitute for another;
   - manufacture verification;
   - infer "Rising" intelligence;
   - infer leaderboard eligibility;
   - invent ranking criteria.

   CONTROLLING DOCTRINE:
   Intelligence Authority → Governed Ranking → Stream 7 Publication

   NOT:
   Athlete/Program Data → Stream 7 Scoring → Ranking
============================================================ */

(function () {
  "use strict";

  const ENGINE_ID =
    "statscore-phnx-ranking-engine";

  const VERSION =
    "STATSCORE-PHNX-RANKING-V2-GOVERNED-PUBLICATION";


  /* ==========================================================
     LEADERBOARD CLASSES

     These identify publication classes only.

     They do NOT define ranking science.
  ========================================================== */

  const LEADERBOARD_CLASSES = Object.freeze({
    ATHLETIC: "ATHLETIC",
    ACADEMIC: "ACADEMIC",
    DEVELOPMENT: "DEVELOPMENT",
    VERIFIED_PERFORMANCE: "VERIFIED_PERFORMANCE",
    EXPOSURE_VIEWERSHIP: "EXPOSURE_VIEWERSHIP",
    PROGRAM: "PROGRAM"
  });


  const BOARD_TYPES = Object.freeze({

    PROGRAM_TOP_10: {
      class: LEADERBOARD_CLASSES.PROGRAM,
      label: "PHNX Sports Program Top 10",
      description:
        "Governed Program Intelligence ranking publication."
    },

    PROGRAM_RISING: {
      class: LEADERBOARD_CLASSES.PROGRAM,
      label: "Rising Programs",
      description:
        "Governed publication of programs classified upstream as demonstrating positive movement."
    },

    PROGRAM_VERIFIED: {
      class: LEADERBOARD_CLASSES.PROGRAM,
      label: "Verified Active Programs",
      description:
        "Governed publication of programs whose verified classification is established upstream."
    },

    ATHLETE_WATCHLIST: {
      class: LEADERBOARD_CLASSES.ATHLETIC,
      label: "Athlete Watchlist",
      description:
        "Governed athlete ranking/watchlist publication supplied by the appropriate intelligence authority."
    },

    ATHLETE_RISING: {
      class: LEADERBOARD_CLASSES.DEVELOPMENT,
      label: "Rising Athletes",
      description:
        "Governed Development Intelligence ranking publication."
    },

    ATHLETIC_LEADERBOARD: {
      class: LEADERBOARD_CLASSES.ATHLETIC,
      label: "Athletic Leaderboard",
      description:
        "Governed Athletic Intelligence leaderboard."
    },

    ACADEMIC_LEADERBOARD: {
      class: LEADERBOARD_CLASSES.ACADEMIC,
      label: "Academic Leaderboard",
      description:
        "Governed Academic Intelligence leaderboard."
    },

    DEVELOPMENT_LEADERBOARD: {
      class: LEADERBOARD_CLASSES.DEVELOPMENT,
      label: "Development Leaderboard",
      description:
        "Governed longitudinal Development Intelligence leaderboard."
    },

    VERIFIED_PERFORMANCE: {
      class: LEADERBOARD_CLASSES.VERIFIED_PERFORMANCE,
      label: "Verified Performance Leaderboard",
      description:
        "Governed verified-performance leaderboard."
    },

    EXPOSURE_VIEWERSHIP: {
      class: LEADERBOARD_CLASSES.EXPOSURE_VIEWERSHIP,
      label: "PHNX Sports Exposure / Viewership",
      description:
        "Governed exposure/viewership publication. Exposure is not athletic ability."
    }
  });


  /* ==========================================================
     UTILITIES
  ========================================================== */

  function log(message, payload) {
    console.log(
      `[STATS-CORE PHNX Ranking Publication] ${message}`,
      payload || ""
    );
  }

  function warn(message, payload) {
    console.warn(
      `[STATS-CORE PHNX Ranking Publication] ${message}`,
      payload || ""
    );
  }

  function clean(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function safeNumber(value, fallback = null) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  }

  function clone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (_) {
      return value;
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* ==========================================================
     MOVEMENT

     Rank movement may be calculated for DISPLAY because the
     official current rank and official previous rank are both
     supplied by the governing ranking authority.

     Stream 7 does NOT calculate either rank.
  ========================================================== */

  function rankDirection(
    currentRank,
    previousRank
  ) {
    const current =
      safeNumber(currentRank);

    const previous =
      safeNumber(previousRank);

    if (current === null) {
      return "UNKNOWN";
    }

    if (previous === null) {
      return "NEW";
    }

    if (current < previous) {
      return "UP";
    }

    if (current > previous) {
      return "DOWN";
    }

    return "STABLE";
  }

  function directionSymbol(direction) {
    if (direction === "UP") return "▲";
    if (direction === "DOWN") return "▼";
    if (direction === "STABLE") return "▬";
    if (direction === "NEW") return "★";
    return "—";
  }

  function directionLabel(direction) {
    if (direction === "UP") return "Rising";
    if (direction === "DOWN") return "Falling";
    if (direction === "STABLE") return "Stable";
    if (direction === "NEW") return "New";
    return "Unknown";
  }


  /* ==========================================================
     GOVERNED RANKING PUBLICATION CONTRACT

     Minimum expected shape:

     {
       ranking_id,
       board_type,
       leaderboard_class,

       ranking_authority,
       authority_version,

       criteria: {
         population,
         age_grade,
         participation_level,
         sport,
         position_event,
         geography,
         intelligence_source,
         verification_requirements,
         time_period,
         minimum_evidence,
         tie_behavior
       },

       ranking_version,
       effective_at,
       generated_at,
       publication_date,

       explanation,
       receipt_id,

       entries: [
         {
           entity_type,
           athlete_id / organization_id,
           snapshot_id,
           display_name,
           rank,
           previous_rank,
           governed_score,
           score_label,
           confidence,
           verification_state,
           explanation,
           intelligence_reference,
           receipt_id,
           publication_safe
         }
       ]
     }
  ========================================================== */

  function validateRankingContract(
    ranking = {}
  ) {
    const errors = [];

    if (!clean(ranking.ranking_id)) {
      errors.push(
        "ranking_id is required."
      );
    }

    if (!clean(ranking.board_type)) {
      errors.push(
        "board_type is required."
      );
    }

    if (
      !clean(
        ranking.leaderboard_class
      )
    ) {
      errors.push(
        "leaderboard_class is required."
      );
    }

    if (
      !clean(
        ranking.ranking_authority
      )
    ) {
      errors.push(
        "ranking_authority is required."
      );
    }

    if (
      !clean(
        ranking.ranking_version
      )
    ) {
      errors.push(
        "ranking_version is required."
      );
    }

    if (
      !ranking.criteria ||
      typeof ranking.criteria !== "object"
    ) {
      errors.push(
        "ranking criteria are required."
      );
    }

    if (
      !Array.isArray(
        ranking.entries
      )
    ) {
      errors.push(
        "entries array is required."
      );
    }

    (ranking.entries || []).forEach(
      (entry, index) => {

        if (
          safeNumber(entry.rank) === null
        ) {
          errors.push(
            `entries[${index}].rank must be supplied by ranking authority.`
          );
        }

        if (
          entry.publication_safe !== true
        ) {
          errors.push(
            `entries[${index}] is not authorized for publication.`
          );
        }

        if (
          !clean(
            entry.intelligence_reference
          )
        ) {
          errors.push(
            `entries[${index}].intelligence_reference is required.`
          );
        }
      }
    );

    return {
      ok: errors.length === 0,
      errors
    };
  }


  /* ==========================================================
     CRITERIA NORMALIZATION

     Normalize for publication presentation only.

     Missing criteria remain missing.

     Stream 7 SHALL NOT invent them.
  ========================================================== */

  function normalizeCriteria(
    criteria = {}
  ) {
    return {
      population:
        criteria.population || null,

      age_grade:
        criteria.age_grade || null,

      participation_level:
        criteria.participation_level || null,

      sport:
        criteria.sport || null,

      position_event:
        criteria.position_event || null,

      geography:
        criteria.geography || null,

      intelligence_source:
        criteria.intelligence_source || null,

      verification_requirements:
        criteria.verification_requirements || null,

      time_period:
        criteria.time_period || null,

      minimum_evidence:
        criteria.minimum_evidence || null,

      tie_behavior:
        criteria.tie_behavior || null
    };
  }


  /* ==========================================================
     ENTRY NORMALIZATION

     IMPORTANT:
     Rank and governed score are consumed.

     They are NOT calculated here.
  ========================================================== */

  function normalizeEntry(entry = {}) {
    const rank =
      safeNumber(entry.rank);

    const previousRank =
      safeNumber(
        entry.previous_rank
      );

    const direction =
      rankDirection(
        rank,
        previousRank
      );

    return {
      entity_type:
        upper(
          entry.entity_type ||
          (
            entry.athlete_id
              ? "ATHLETE"
              : "PROGRAM"
          )
        ),

      athlete_id:
        entry.athlete_id || null,

      snapshot_id:
        entry.snapshot_id || null,

      organization_id:
        entry.organization_id || null,

      display_name:
        entry.display_name ||
        entry.program_name ||
        entry.athlete_display_name ||
        "Unnamed",

      sport:
        entry.sport || null,

      position:
        entry.position || null,

      graduation_class:
        entry.graduation_class || null,

      status_label:
        entry.status_label || null,

      rank,

      previous_rank:
        previousRank,

      movement:
        entry.movement ||
        direction,

      movement_symbol:
        entry.movement_symbol ||
        directionSymbol(direction),

      movement_label:
        entry.movement_label ||
        directionLabel(direction),

      /*
        Whatever number or result appears here was supplied
        by the governing ranking contract.

        It is not recalculated.
      */
      governed_score:
        entry.governed_score ??
        entry.score ??
        entry.program_score ??
        null,

      score_label:
        entry.score_label ||
        null,

      confidence:
        entry.confidence ||
        null,

      verification_state:
        entry.verification_state ||
        null,

      ranking_classification:
        entry.ranking_classification ||
        null,

      explanation:
        entry.explanation ||
        null,

      intelligence_reference:
        entry.intelligence_reference ||
        null,

      receipt_id:
        entry.receipt_id ||
        null,

      publication_safe:
        entry.publication_safe === true,

      publication_scope:
        entry.publication_scope ||
        null,

      strengths:
        Array.isArray(entry.strengths)
          ? clone(entry.strengths)
          : [],

      weaknesses:
        Array.isArray(entry.weaknesses)
          ? clone(entry.weaknesses)
          : []
    };
  }


  /* ==========================================================
     GOVERNED BOARD PUBLICATION

     This does not rank entities.

     It receives ranked entities and composes the publication.
  ========================================================== */

  function buildGovernedBoard(
    rankingContract = {},
    options = {}
  ) {
    const validation =
      validateRankingContract(
        rankingContract
      );

    if (!validation.ok) {
      return {
        ok: false,
        status:
          "INVALID_GOVERNED_RANKING_CONTRACT",
        errors:
          validation.errors
      };
    }

    const boardType =
      rankingContract.board_type;

    const boardDefinition =
      BOARD_TYPES[boardType] || {
        class:
          rankingContract.leaderboard_class,

        label:
          rankingContract.board_label ||
          boardType,

        description:
          rankingContract.board_description ||
          ""
      };

    const limit =
      safeNumber(
        options.limit,
        null
      );

    /*
      Sorting by an already-governed official rank is
      presentation ordering.

      Stream 7 does NOT create rank here.
    */
    let entries =
      rankingContract.entries
        .map(normalizeEntry)
        .filter(
          entry =>
            entry.publication_safe === true
        )
        .sort(
          (a, b) =>
            a.rank - b.rank
        );

    if (
      limit !== null &&
      limit > 0
    ) {
      entries =
        entries.slice(
          0,
          limit
        );
    }

    const board =
      entries.map(
        entry => ({
          ...entry,

          shoutout_copy:
            generateGovernedShoutout(
              entry,
              rankingContract
            )
        })
      );

    return {
      ok: true,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      authority_class:
        "STREAM_7_RANKING_PUBLICATION",

      ranking_id:
        rankingContract.ranking_id,

      board_type:
        boardType,

      leaderboard_class:
        upper(
          rankingContract
            .leaderboard_class
        ),

      board_label:
        rankingContract.board_label ||
        boardDefinition.label ||
        boardType,

      board_description:
        rankingContract
          .board_description ||
        boardDefinition.description ||
        "",

      ranking_authority:
        rankingContract
          .ranking_authority,

      authority_version:
        rankingContract
          .authority_version ||
        null,

      ranking_version:
        rankingContract
          .ranking_version,

      criteria:
        normalizeCriteria(
          rankingContract.criteria
        ),

      explanation:
        rankingContract.explanation ||
        null,

      ranking_receipt_id:
        rankingContract.receipt_id ||
        null,

      effective_at:
        rankingContract
          .effective_at ||
        null,

      intelligence_generated_at:
        rankingContract
          .generated_at ||
        null,

      publication_date:
        rankingContract
          .publication_date ||
        null,

      composed_at:
        new Date().toISOString(),

      count:
        board.length,

      board,

      /*
        Official publication receipt remains separate.
      */
      publication: {
        authorized:
          rankingContract
            .publication_authorized ===
          true,

        publication_receipt_id:
          rankingContract
            .publication_receipt_id ||
          null,

        state:
          rankingContract
            .publication_state ||
          "NOT_PUBLISHED"
      },

      doctrine: {
        ranking_consumed_not_calculated:
          true,

        exposure_is_not_athletic_ability:
          true,

        leaderboard_classes_are_distinct:
          true,

        publication_does_not_create_rank:
          true
      }
    };
  }


  /* ==========================================================
     GOVERNED SHOUTOUT COPY

     Copy may summarize supplied ranking state.

     It SHALL NOT invent intelligence.
  ========================================================== */

  function generateGovernedShoutout(
    entry,
    rankingContract
  ) {
    if (
      entry.explanation
    ) {
      return (
        `${entry.display_name} is published at #${entry.rank}. ` +
        `${entry.explanation}`
      );
    }

    const scoreText =
      entry.governed_score !== null &&
      entry.governed_score !== undefined
        ? (
            ` Governed ${
              entry.score_label ||
              "rating"
            }: ${
              entry.governed_score
            }.`
          )
        : "";

    return (
      `${entry.display_name} is published at #${entry.rank} ` +
      `on ${rankingContract.board_label || rankingContract.board_type}.` +
      scoreText +
      ` Movement: ${entry.movement_label}.`
    );
  }


  /* ==========================================================
     COMPATIBILITY METHODS

     Existing callers may still invoke buildProgramBoard()
     or buildAthleteBoard().

     They MUST now supply a governed ranking contract.

     Raw Program or Athlete lists are rejected.
  ========================================================== */

  function isGovernedRankingContract(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      value.ranking_authority &&
      value.ranking_version &&
      Array.isArray(value.entries)
    );
  }


  function buildProgramBoard(
    input,
    options = {}
  ) {
    if (
      !isGovernedRankingContract(
        input
      )
    ) {
      return {
        ok: false,

        status:
          "GOVERNED_PROGRAM_RANKING_REQUIRED",

        message:
          "Stream 7 does not calculate Program Intelligence or official Program rank. Supply a governed ranking contract from the lawful ranking authority."
      };
    }

    return buildGovernedBoard(
      input,
      options
    );
  }


  function buildAthleteBoard(
    input,
    options = {}
  ) {
    if (
      !isGovernedRankingContract(
        input
      )
    ) {
      return {
        ok: false,

        status:
          "GOVERNED_ATHLETE_RANKING_REQUIRED",

        message:
          "Stream 7 does not select athlete scoring criteria or calculate official athlete rank. Supply a governed ranking contract."
      };
    }

    return buildGovernedBoard(
      input,
      options
    );
  }


  /* ==========================================================
     PHNX SPORTS SEGMENT

     Converts a governed ranking publication into a media
     segment specification.

     Does not create ranking intelligence.
  ========================================================== */

  function buildPHNXSportsSegment(
    rankingResult
  ) {
    if (
      !rankingResult?.ok ||
      !Array.isArray(
        rankingResult.board
      )
    ) {
      return null;
    }

    return {
      ok: true,

      segment_type:
        "PHNX_SPORTS_GOVERNED_RANKING",

      ranking_id:
        rankingResult.ranking_id,

      leaderboard_class:
        rankingResult
          .leaderboard_class,

      ranking_authority:
        rankingResult
          .ranking_authority,

      ranking_version:
        rankingResult
          .ranking_version,

      ranking_receipt_id:
        rankingResult
          .ranking_receipt_id,

      title:
        rankingResult
          .board_label,

      generated_at:
        new Date().toISOString(),

      intro:
        `PHNX Sports presents ${rankingResult.board_label}, ` +
        `published from governed ${rankingResult.leaderboard_class} ranking intelligence.`,

      shoutouts:
        rankingResult.board.map(
          item => ({
            rank:
              item.rank,

            previous_rank:
              item.previous_rank,

            name:
              item.display_name,

            governed_score:
              item.governed_score,

            score_label:
              item.score_label,

            movement:
              item.movement_label,

            intelligence_reference:
              item.intelligence_reference,

            receipt_id:
              item.receipt_id,

            copy:
              item.shoutout_copy
          })
        ),

      outro:
        "PHNX Sports publishes governed ranking intelligence. " +
        "Publication does not create athlete ability, academic standing, development intelligence, or ranking authority.",

      publication_authorized:
        rankingResult.publication
          ?.authorized === true
    };
  }


  /* ==========================================================
     RENDERING
  ========================================================== */

  function renderRankingBoard(
    container,
    rankingResult
  ) {
    if (
      !container ||
      !rankingResult?.ok
    ) {
      return false;
    }

    const boardRows =
      rankingResult.board
        .map(item => {

          const name =
            escapeHTML(
              item.display_name
            );

          const secondary =
            escapeHTML(
              item.status_label ||
              [
                item.sport,
                item.position,
                item.graduation_class
              ]
                .filter(Boolean)
                .join(" · ") ||
              "Governed Ranking Entry"
            );

          const copy =
            escapeHTML(
              item.shoutout_copy
            );

          const score =
            item.governed_score !==
              null &&
            item.governed_score !==
              undefined
              ? escapeHTML(
                  item.governed_score
                )
              : "—";

          const scoreLabel =
            escapeHTML(
              item.score_label ||
              "Governed Result"
            );

          return `
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
                #${escapeHTML(item.rank)}
              </div>

              <div>
                <div style="
                  font-size:18px;
                  font-weight:1000;
                  text-transform:uppercase;
                ">
                  ${name}
                </div>

                <div style="
                  margin-top:5px;
                  color:#9fe7ff;
                  font-size:11px;
                  letter-spacing:.1em;
                  text-transform:uppercase;
                ">
                  ${secondary}
                </div>

                <div style="
                  margin-top:7px;
                  color:#b9c4d6;
                  font-size:12px;
                  line-height:1.45;
                ">
                  ${copy}
                </div>
              </div>

              <div style="
                text-align:right;
              ">

                <div style="
                  color:#7f8a99;
                  font-size:9px;
                  font-weight:900;
                  letter-spacing:.08em;
                  text-transform:uppercase;
                ">
                  ${scoreLabel}
                </div>

                <div style="
                  margin-top:4px;
                  font-size:28px;
                  font-weight:1000;
                  color:#37d67a;
                ">
                  ${score}
                </div>

                <div style="
                  margin-top:6px;
                  color:#ffb100;
                  font-size:12px;
                  font-weight:900;
                  letter-spacing:.12em;
                  text-transform:uppercase;
                ">
                  ${escapeHTML(
                    item.movement_symbol
                  )}
                  ${escapeHTML(
                    item.movement_label
                  )}
                </div>

              </div>

            </div>
          `;
        })
        .join("");


    const criteria =
      rankingResult.criteria || {};

    const criteriaLine =
      [
        criteria.population
          ? `Population: ${criteria.population}`
          : null,

        criteria.age_grade
          ? `Age/Grade: ${criteria.age_grade}`
          : null,

        criteria.sport
          ? `Sport: ${criteria.sport}`
          : null,

        criteria.position_event
          ? `Position/Event: ${criteria.position_event}`
          : null,

        criteria.geography
          ? `Geography: ${criteria.geography}`
          : null,

        criteria.time_period
          ? `Period: ${criteria.time_period}`
          : null
      ]
        .filter(Boolean)
        .map(escapeHTML)
        .join(" • ");


    container.innerHTML = `
      <div style="
        border:1px solid rgba(255,52,52,.45);
        background:
          linear-gradient(
            135deg,
            rgba(255,255,255,.04),
            rgba(0,0,0,.32)
          );
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
          PHNX Sports • Governed Ranking Publication
        </div>

        <div style="
          margin-top:10px;
          font-size:34px;
          font-weight:1000;
          line-height:1;
        ">
          ${escapeHTML(
            rankingResult.board_label
          )}
        </div>

        <div style="
          margin-top:10px;
          color:#9fe7ff;
          font-size:12px;
          line-height:1.5;
        ">
          ${escapeHTML(
            rankingResult.board_description
          )}
        </div>

        <div style="
          margin-top:10px;
          color:#7f8a99;
          font-size:10px;
          line-height:1.5;
        ">
          Authority:
          ${escapeHTML(
            rankingResult.ranking_authority
          )}
          • Version:
          ${escapeHTML(
            rankingResult.ranking_version
          )}
          • Class:
          ${escapeHTML(
            rankingResult.leaderboard_class
          )}
        </div>

        ${
          criteriaLine
            ? `
              <div style="
                margin-top:8px;
                color:#7f8a99;
                font-size:10px;
                line-height:1.5;
              ">
                ${criteriaLine}
              </div>
            `
            : ""
        }

        <div style="
          margin-top:22px;
          display:grid;
          gap:12px;
        ">
          ${boardRows}
        </div>

        <div style="
          margin-top:18px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:14px;
          color:#7f8a99;
          font-size:11px;
          line-height:1.55;
        ">
          Rankings shown here are governed intelligence supplied
          by the designated ranking authority and published by
          Stream 7. PHNX Sports does not calculate the underlying
          score, ranking, Stars, eligibility, Development Intelligence,
          Program Health, or Pathway determination.
        </div>

      </div>
    `;

    return true;
  }


  /* ==========================================================
     CURRENT BOARD

     IMPORTANT:
     Page load may render a governed ranking already supplied
     by the enterprise.

     It SHALL NOT calculate a board from arbitrary program or
     athlete arrays.
  ========================================================== */

  function resolveCurrentGovernedBoard() {
    return (
      window.STATScoreCurrentGovernedRanking ||
      window.__STATSCORE_GOVERNED_RANKING__ ||
      null
    );
  }


  function runCurrentBoard() {
    const governedRanking =
      resolveCurrentGovernedBoard();

    if (!governedRanking) {
      warn(
        "No governed ranking publication payload available. " +
        "No ranking has been manufactured."
      );

      return null;
    }

    const ranking =
      buildGovernedBoard(
        governedRanking,
        {
          limit:
            governedRanking.limit ||
            10
        }
      );

    if (!ranking.ok) {
      warn(
        "Governed ranking contract rejected.",
        ranking
      );

      return ranking;
    }

    window.STATScoreCurrentPHNXRankingBoard =
      ranking;

    window.STATScoreCurrentPHNXSegment =
      buildPHNXSportsSegment(
        ranking
      );

    const panel =
      document.querySelector(
        "#scPHNXRankingBoard"
      ) ||
      document.querySelector(
        "[data-phnx-ranking-board]"
      );

    if (panel) {
      renderRankingBoard(
        panel,
        ranking
      );
    }

    return ranking;
  }


  /* ==========================================================
     INITIALIZATION
  ========================================================== */

  function init() {
    if (
      window
        .__STATSCORE_PHNX_RANKING_ENGINE__
    ) {
      warn(
        "Duplicate initialization blocked."
      );
      return;
    }

    window
      .__STATSCORE_PHNX_RANKING_ENGINE__ =
      true;


    window.STATScorePHNXRankingEngine = {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      leaderboard_classes:
        LEADERBOARD_CLASSES,

      board_types:
        BOARD_TYPES,

      validateRankingContract,
      normalizeCriteria,
      normalizeEntry,

      buildGovernedBoard,

      /*
        Compatibility names.
      */
      buildProgramBoard,
      buildAthleteBoard,

      renderRankingBoard,

      buildPHNXSportsSegment,

      resolveCurrentGovernedBoard,
      runCurrentBoard,

      rankDirection,
      directionSymbol,
      directionLabel
    };


    window.STATScore =
      window.STATScore || {};

    window.STATScore.PHNXRankingEngine =
      window.STATScorePHNXRankingEngine;


    const result =
      runCurrentBoard();


    if (
      window.STATScoreEngineBus?.emit
    ) {
      window.STATScoreEngineBus.emit(
        "engine_online",
        {
          engine:
            ENGINE_ID,

          version:
            VERSION,

          status:
            "ONLINE",

          /*
            This means an already-governed ranking was
            successfully composed for publication.

            It does NOT mean Stream 7 calculated one.
          */
          governed_ranking_loaded:
            Boolean(
              result &&
              result.ok
            )
        }
      );
    }


    log(
      "Governed Ranking Publication Engine online.",
      {
        engine:
          ENGINE_ID,

        version:
          VERSION,

        governed_ranking_loaded:
          Boolean(
            result &&
            result.ok
          )
      }
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})(); 
