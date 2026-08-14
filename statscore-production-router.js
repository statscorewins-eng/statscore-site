/*
=========================================================
STATS-CORE™
STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY

FILE:
statscore-production-router.js

AUTHORITY:
PRODUCTION_ROUTER

VERSION:
2.0.0

STREAM OWNER:
STATSCORE_STREAM_9

PURPOSE:
Governed Production Intelligence Routing

CONSTITUTIONAL DOCTRINE
---------------------------------------------------------
The Production Router routes Production Intelligence.

It does NOT calculate Production scores.
It does NOT manufacture Production evidence.
It does NOT normalize athletic measurables into Production.
It does NOT substitute sport scoring engines for the
canonical Production Authority.
It does NOT manufacture authority when an authority is
missing.

CANONICAL CHAIN:

Governed Production Evidence
        ↓
Production Router
        ↓
STATScoreProductionEngine
        ↓
PRODUCTION_MATRIX
        ↓
Production Domain Result

SPORT-SPECIFIC AUTHORITIES:

Sport-specific engines may provide governed sport /
position interpretation behind the Production Authority
where explicitly authorized.

They are NOT interchangeable with the Production Engine.

DOCTRINE:

Production
≠ Athletic Ability
≠ Verification
≠ Pathway Projection

Missing Production Evidence
≠ Zero Production

Missing Authority
≠ Permission to Reconstruct Authority

Unsupported Sport
≠ Zero Production

Pages do not calculate Production Intelligence.
=========================================================
*/

(function (root) {
  "use strict";

  /*
  =======================================================
  ROUTER IDENTITY
  =======================================================
  */

  const ROUTER_KEY =
    "PRODUCTION_ROUTER";

  const ROUTER_VERSION =
    "2.0.0";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const DOMAIN =
    "PRODUCTION";

  const EXPECTED_AUTHORITY =
    "STATScoreProductionEngine";

  /*
  =======================================================
  STATE
  =======================================================
  */

  let lastResult =
    null;

  let lastError =
    null;

  /*
  =======================================================
  UTILITIES
  =======================================================
  */

  function now() {
    return new Date()
      .toISOString();
  }

  function normalizeText(
    value
  ) {
    return String(
      value == null
        ? ""
        : value
    )
      .trim()
      .toUpperCase();
  }

  function normalizeSport(
    value
  ) {
    const normalized =
      normalizeText(
        value
      )
        .replace(
          /[^A-Z0-9]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        );

    const aliases = {
      FB:
        "FOOTBALL",

      FOOTBALL:
        "FOOTBALL",

      BASKETBALL:
        "BASKETBALL",

      BBALL:
        "BASKETBALL",

      BASEBALL:
        "BASEBALL",

      BASE_BALL:
        "BASEBALL",

      TRACK:
        "TRACK",

      TRACK_FIELD:
        "TRACK",

      TRACK_AND_FIELD:
        "TRACK"
    };

    return (
      aliases[
        normalized
      ] ||
      normalized
    );
  }

  function normalizePosition(
    value
  ) {
    return normalizeText(
      value
    )
      .replace(
        /[^A-Z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  }

  function toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value == null
    ) {
      return [];
    }

    return [value];
  }

  function hasRecords(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return (
        value.length >
        0
      );
    }

    if (
      value &&
      typeof value ===
        "object"
    ) {
      return (
        Object.keys(
          value
        ).length >
        0
      );
    }

    return false;
  }

  /*
  =======================================================
  FAIL-CLOSED RESULT
  =======================================================
  */

  function failClosed(
    input,
    status,
    flags,
    explanation,
    missingEvidence = []
  ) {
    const result = {
      athlete_id:
        input?.athlete_id ??
        null,

      snapshot_id:
        input?.snapshot_id ??
        null,

      router_key:
        ROUTER_KEY,

      router_version:
        ROUTER_VERSION,

      stream_owner:
        STREAM_OWNER,

      domain:
        DOMAIN,

      sport:
        normalizeSport(
          input?.sport ||
          input?.primary_sport ||
          input?.raw
            ?.primarySport
        ) ||
        null,

      position:
        normalizePosition(
          input?.position ||
          input?.primary_position ||
          input?.verified_position ||
          input?.raw
            ?.primaryPosition
        ) ||
        null,

      score:
        null,

      production_score:
        null,

      confidence:
        0,

      official:
        false,

      evidence_used:
        [],

      missing_evidence:
        Array.isArray(
          missingEvidence
        )
          ? missingEvidence
          : [],

      flags:
        Array.isArray(
          flags
        )
          ? [
              ...new Set(
                flags
              )
            ]
          : [],

      explanation,

      generated_at:
        now(),

      status
    };

    lastResult =
      result;

    lastError = {
      status,

      flags:
        result.flags,

      explanation,

      generated_at:
        result.generated_at
    };

    return result;
  }

  /*
  =======================================================
  INPUT NORMALIZATION
  -------------------------------------------------------
  This normalizes field locations only.

  It does NOT:
  - calculate Production;
  - normalize statistics into scores;
  - create missing evidence;
  - convert missing values to zero.
  =======================================================
  */

  function normalizeInput(
    input = {}
  ) {
    return {
      ...input,

      athlete_id:
        input.athlete_id ??
        input.athleteId ??
        null,

      snapshot_id:
        input.snapshot_id ??
        input.snapshotId ??
        null,

      sport:
        normalizeSport(
          input.sport ||
          input.primary_sport ||
          input.raw
            ?.primarySport
        ),

      position:
        normalizePosition(
          input.position ||
          input.primary_position ||
          input.verified_position ||
          input.raw
            ?.primaryPosition
        ),

      production_records:
        input.production_records ??
        input.productionRecords ??
        null,

      season_records:
        input.season_records ??
        input.seasonRecords ??
        null,

      game_records:
        input.game_records ??
        input.gameRecords ??
        null,

      official_stats:
        input.official_stats ??
        input.officialStats ??
        null,

      coach_verified_stats:
        input.coach_verified_stats ??
        input.coachVerifiedStats ??
        null,

      league_stats:
        input.league_stats ??
        input.leagueStats ??
        null,

      box_scores:
        input.box_scores ??
        input.boxScores ??
        null,

      competition_context:
        input.competition_context ??
        input.competitionContext ??
        null,

      awards:
        input.awards ??
        null,

      film_references:
        input.film_references ??
        input.filmReferences ??
        null,

      production_history:
        input.production_history ??
        input.productionHistory ??
        null,

      doctrine_version:
        input.doctrine_version ??
        null
    };
  }

  /*
  =======================================================
  REQUIRED ROUTING EVIDENCE
  =======================================================
  */

  function validateRequiredEvidence(
    input
  ) {
    const missing =
      [];

    if (
      !input.athlete_id
    ) {
      missing.push(
        "athlete_id"
      );
    }

    if (
      !input.snapshot_id
    ) {
      missing.push(
        "snapshot_id"
      );
    }

    if (
      !input.sport
    ) {
      missing.push(
        "sport"
      );
    }

    if (
      !input.position
    ) {
      missing.push(
        "position"
      );
    }

    /*
    -----------------------------------------------------
    PRODUCTION EVIDENCE

    production_records is the canonical required input.

    Alternate governed production evidence may establish
    that actual Production evidence exists, but this
    router does not convert those records into scores.
    -----------------------------------------------------
    */

    const productionEvidenceExists =
      hasRecords(
        input.production_records
      ) ||
      hasRecords(
        input.season_records
      ) ||
      hasRecords(
        input.game_records
      ) ||
      hasRecords(
        input.official_stats
      ) ||
      hasRecords(
        input.coach_verified_stats
      ) ||
      hasRecords(
        input.league_stats
      ) ||
      hasRecords(
        input.box_scores
      ) ||
      hasRecords(
        input.production_history
      );

    if (
      !productionEvidenceExists
    ) {
      missing.push(
        "production_records"
      );
    }

    return missing;
  }

  /*
  =======================================================
  CANONICAL PRODUCTION AUTHORITY RESOLUTION
  -------------------------------------------------------
  IMPORTANT:

  There is NO fallback from Production Authority to:
  - Football Scoring Engine;
  - Basketball Scoring Engine;
  - Baseball Scoring Engine;
  - Track Scoring Engine;
  - generic scoring engine;
  - page-local scoring.

  Missing Authority fails closed.
  =======================================================
  */

  function resolveProductionAuthority(
    context = {}
  ) {
    return (
      context
        .production_authority ||

      root
        .STATScoreProductionEngine ||

      root
        .STATScore
        ?.ProductionEngine ||

      root
        .STATScore
        ?.ProductionAuthority ||

      null
    );
  }

  /*
  =======================================================
  AUTHORITY CONTRACT VALIDATION
  =======================================================
  */

  function validateProductionAuthority(
    authority
  ) {
    if (!authority) {
      return {
        ok:
          false,

        status:
          "DOMAIN_UNAVAILABLE",

        reason:
          "Canonical Production Authority is unavailable."
      };
    }

    const methods = [
      "evaluateProductionComponents",
      "evaluateProductionProfile",
      "evaluate",
      "scoreProduction",
      "score"
    ];

    const method =
      methods.find(
        (candidate) =>
          typeof authority[
            candidate
          ] ===
          "function"
      );

    if (!method) {
      return {
        ok:
          false,

        status:
          "MATRIX_CONTRACT_INVALID",

        reason:
          "Canonical Production Authority does not expose an authorized Production evaluation method."
      };
    }

    return {
      ok:
        true,

      method
    };
  }

  /*
  =======================================================
  AUTHORITY EXECUTION
  =======================================================
  */

  function executeAuthority(
    authority,
    method,
    payload
  ) {
    const result =
      authority[
        method
      ](
        payload
      );

    if (
      result &&
      typeof result.then ===
        "function"
    ) {
      throw new Error(
        "PRODUCTION_ROUTER requires a synchronous Production Authority result at this boundary."
      );
    }

    return result;
  }

  /*
  =======================================================
  RESULT CONTRACT VALIDATION
  -------------------------------------------------------
  The router does not determine the Production score.

  It verifies only that the delegated authority returned
  a structurally usable governed result.
  =======================================================
  */

  function validateAuthorityResult(
    result
  ) {
    if (
      !result ||
      typeof result !==
        "object"
    ) {
      return {
        ok:
          false,

        status:
          "MATRIX_CONTRACT_INVALID",

        reason:
          "Production Authority returned no governed result."
      };
    }

    if (
      result.status ===
        "INSUFFICIENT_EVIDENCE"
    ) {
      return {
        ok:
          false,

        status:
          "INSUFFICIENT_EVIDENCE",

        reason:
          "Production Authority determined that available Production evidence is insufficient."
      };
    }

    if (
      result.status ===
        "MATRIX_UNAVAILABLE" ||
      result.status ===
        "DOMAIN_UNAVAILABLE"
    ) {
      return {
        ok:
          false,

        status:
          result.status,

        reason:
          "Production Authority reports that required Production scoring authority is unavailable."
      };
    }

    if (
      result.status ===
        "MATRIX_UNAUTHORIZED"
    ) {
      return {
        ok:
          false,

        status:
          "MATRIX_UNAUTHORIZED",

        reason:
          "Production Authority reports an unauthorized Production Matrix execution."
      };
    }

    if (
      result.status ===
        "MATRIX_CONTRACT_INVALID"
    ) {
      return {
        ok:
          false,

        status:
          "MATRIX_CONTRACT_INVALID",

        reason:
          "Production Authority reports an invalid Production Matrix contract."
      };
    }

    return {
      ok:
        true
    };
  }

  /*
  =======================================================
  CANONICAL ROUTING
  =======================================================
  */

  function route(
    input = {},
    context = {}
  ) {
    try {
      lastError =
        null;

      /*
      ---------------------------------------------------
      STREAM AUTHORITY
      ---------------------------------------------------
      */

      if (
        context.stream_owner &&
        context.stream_owner !==
          STREAM_OWNER
      ) {
        return failClosed(
          input,

          "MATRIX_UNAUTHORIZED",

          [
            "AUTHORITY_INVALID"
          ],

          "PRODUCTION_ROUTER may only execute under Stream 9 intelligence authority."
        );
      }

      /*
      ---------------------------------------------------
      NORMALIZE ROUTING CONTEXT
      ---------------------------------------------------
      */

      const normalized =
        normalizeInput(
          input
        );

      /*
      ---------------------------------------------------
      REQUIRED EVIDENCE
      ---------------------------------------------------
      */

      const missing =
        validateRequiredEvidence(
          normalized
        );

      if (
        missing.length
      ) {
        return failClosed(
          normalized,

          "INSUFFICIENT_EVIDENCE",

          [
            "REQUIRED_EVIDENCE_MISSING"
          ],

          `Required Production routing evidence unavailable: ${missing.join(", ")}.`,

          missing
        );
      }

      /*
      ---------------------------------------------------
      CANONICAL AUTHORITY
      ---------------------------------------------------
      */

      const authority =
        resolveProductionAuthority(
          context
        );

      const authorityValidation =
        validateProductionAuthority(
          authority
        );

      if (
        !authorityValidation.ok
      ) {
        return failClosed(
          normalized,

          authorityValidation.status,

          [
            "PRODUCTION_AUTHORITY_UNAVAILABLE"
          ],

          authorityValidation.reason
        );
      }

      /*
      ---------------------------------------------------
      DELEGATE

      No score calculation occurs in this router.
      ---------------------------------------------------
      */

      const result =
        executeAuthority(
          authority,

          authorityValidation
            .method,

          normalized
        );

      /*
      ---------------------------------------------------
      VALIDATE DELEGATED RESULT
      ---------------------------------------------------
      */

      const resultValidation =
        validateAuthorityResult(
          result
        );

      if (
        !resultValidation.ok
      ) {
        return failClosed(
          normalized,

          resultValidation.status,

          [
            resultValidation
              .status ===
              "INSUFFICIENT_EVIDENCE"
              ? "PRODUCTION_EVIDENCE_INSUFFICIENT"
              : "PRODUCTION_AUTHORITY_RESULT_INVALID"
          ],

          resultValidation.reason,

          result
            ?.missing_evidence ||
          []
        );
      }

      /*
      ---------------------------------------------------
      SUCCESS

      Preserve the canonical Production Authority result.

      The router adds routing metadata only.

      It does NOT alter:
      - score;
      - confidence;
      - components;
      - evidence;
      - verification;
      - projection.
      ---------------------------------------------------
      */

      const routedResult = {
        ...result,

        athlete_id:
          result.athlete_id ??
          normalized
            .athlete_id,

        snapshot_id:
          result.snapshot_id ??
          normalized
            .snapshot_id,

        sport:
          result.sport ??
          normalized
            .sport,

        position:
          result.position ??
          normalized
            .position,

        routing: {
          router_key:
            ROUTER_KEY,

          router_version:
            ROUTER_VERSION,

          stream_owner:
            STREAM_OWNER,

          domain:
            DOMAIN,

          authority:
            EXPECTED_AUTHORITY,

          delegated_method:
            authorityValidation
              .method,

          local_scoring:
            false,

          authority_substitution:
            false,

          missing_authority_reconstructed:
            false
        }
      };

      lastResult =
        routedResult;

      return routedResult;

    } catch (
      error
    ) {
      return failClosed(
        input,

        "MATRIX_CONTRACT_INVALID",

        [
          "UNHANDLED_ROUTER_ERROR"
        ],

        String(
          error?.message ||
          error
        )
      );
    }
  }

  /*
  =======================================================
  EVALUATE COMPATIBILITY METHOD
  -------------------------------------------------------
  evaluate() remains available because existing consumers
  may call the Production Router through this method.

  It is an alias for route().

  It does not establish a second execution path.
  =======================================================
  */

  function evaluate(
    input = {},
    context = {}
  ) {
    return route(
      input,
      context
    );
  }

  /*
  =======================================================
  CONTRACT
  =======================================================
  */

  function getContract() {
    return {
      router_key:
        ROUTER_KEY,

      router_version:
        ROUTER_VERSION,

      stream_owner:
        STREAM_OWNER,

      domain:
        DOMAIN,

      expected_authority:
        EXPECTED_AUTHORITY,

      local_scoring:
        false,

      sport_engine_substitution:
        false,

      missing_authority_reconstruction:
        false,

      athletic_measurables_create_production:
        false,

      missing_production_becomes_zero:
        false,

      verification_changes_production:
        false,

      pathway_projection_owned:
        false,

      canonical_chain: [
        "GOVERNED_PRODUCTION_EVIDENCE",
        "PRODUCTION_ROUTER",
        "PRODUCTION_ENGINE",
        "PRODUCTION_MATRIX",
        "PRODUCTION_DOMAIN_RESULT"
      ]
    };
  }

  function getConfiguration() {
    return {
      ...getContract(),

      supported_input_fields: [
        "athlete_id",
        "snapshot_id",
        "sport",
        "position",
        "production_records",
        "season_records",
        "game_records",
        "official_stats",
        "coach_verified_stats",
        "league_stats",
        "box_scores",
        "competition_context",
        "awards",
        "film_references",
        "production_history"
      ],

      authorized_failure_states: [
        "INSUFFICIENT_EVIDENCE",
        "DOMAIN_UNAVAILABLE",
        "MATRIX_UNAVAILABLE",
        "MATRIX_UNAUTHORIZED",
        "MATRIX_CONTRACT_INVALID"
      ]
    };
  }

  function getLastResult() {
    return lastResult;
  }

  function getLastError() {
    return lastError;
  }

  /*
  =======================================================
  HEALTH CHECK
  =======================================================
  */

  function runHealthCheck(
    context = {}
  ) {
    const authority =
      resolveProductionAuthority(
        context
      );

    const validation =
      validateProductionAuthority(
        authority
      );

    return {
      router_loaded:
        true,

      router_key:
        ROUTER_KEY,

      router_version:
        ROUTER_VERSION,

      stream_owner:
        STREAM_OWNER,

      domain:
        DOMAIN,

      production_authority_available:
        Boolean(
          authority
        ),

      production_authority_contract_valid:
        validation.ok,

      production_authority_method:
        validation.ok
          ? validation.method
          : null,

      local_scoring:
        false,

      sport_engine_substitution:
        false,

      missing_authority_reconstruction:
        false,

      athletic_measurables_create_production:
        false,

      missing_production_becomes_zero:
        false,

      healthy:
        validation.ok
    };
  }

  /*
  =======================================================
  PUBLIC AUTHORITY
  =======================================================
  */

  const api =
    Object.freeze({

      route,

      evaluate,

      normalizeSport,

      normalizePosition,

      getContract,

      getConfiguration,

      getLastResult,

      getLastError,

      runHealthCheck

    });

  /*
  =======================================================
  CANONICAL REGISTRATION
  =======================================================
  */

  root.STATScoreProductionRouter =
    api;

  root.STATScore =
    root.STATScore ||
    {};

  root.STATScore.ProductionRouter =
    api;

  /*
  =======================================================
  CONTROLLED LEGACY COMPATIBILITY
  -------------------------------------------------------
  These aliases delegate to the canonical router.

  They do NOT create independent Production authority.
  =======================================================
  */

  root.STATSCORE_PRODUCTION_ROUTER =
    api;

  root.evaluateStatsCoreProduction =
    function (
      input,
      context
    ) {
      return api.evaluate(
        input,
        context
      );
    };

  /*
  =======================================================
  LOAD RECEIPT
  =======================================================
  */

  console.info(
    "[STATS-CORE][STREAM 9] PRODUCTION_ROUTER v2.0.0 loaded."
  );

})(
  typeof window !==
    "undefined"
    ? window
    : globalThis
); 
