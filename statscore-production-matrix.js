/*
=========================================================
STATS-CORE™
STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY

FILE:
statscore-production-matrix.js

AUTHORITY:
PRODUCTION_MATRIX

MATRIX DOMAIN:
PRODUCTION

VERSION:
1.0.0

STREAM OWNER:
STATSCORE_STREAM_9

OUTPUT TYPE:
DOMAIN_SCORE

CONSTITUTIONAL DOCTRINE
---------------------------------------------------------
PRODUCTION PERFORMANCE
≠
ATHLETIC ABILITY
≠
VERIFICATION
≠
PATHWAY PROJECTION

Production describes what the athlete actually produced
in governed competition evidence.

Athletic traits describe physical / position capability.

Verification describes how strongly the production
evidence can be trusted.

Pathway projection interprets an already-governed
Production score for downstream recruiting/pathway use.

Verification may strengthen confidence in a production
record.

Verification shall NEVER increase:
- passing yards;
- touchdowns;
- receptions;
- rushing yards;
- tackles;
- interceptions;
- sacks;
- scoring production;
- or any other underlying production fact.

Missing production evidence shall NEVER silently become
zero performance.

Athletic measurables shall NEVER manufacture production.

Example:

2,450 passing yards
Verification: VERIFIED

The production remains 2,450 passing yards.

Verification affects evidence confidence.

Likewise:

Missing production record
≠
0 production

The correct state is:

score: null
status: INSUFFICIENT_EVIDENCE
=========================================================
*/

(function (root) {
  "use strict";

  /*
  =======================================================
  MATRIX IDENTITY
  =======================================================
  */

  const MATRIX_KEY =
    "PRODUCTION_MATRIX";

  const MATRIX_DOMAIN =
    "PRODUCTION";

  const MATRIX_VERSION =
    "1.0.0";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const OUTPUT_TYPE =
    "DOMAIN_SCORE";

  const SCORE_RANGE =
    Object.freeze({
      min: 0,
      max: 100
    });

  /*
  =======================================================
  LOCKED MATRIX WEIGHTS
  =======================================================

  CSE CONTROLLED WEIGHTS

  verified_production      35
  sustained_production     25
  position_output          20
  competition_context      10
  production_consistency   10
                          ---
                          100

  IMPORTANT:

  Competition context may contextualize production.

  It shall NOT act as a hidden generic multiplier against
  unrelated athlete scores.
  =======================================================
  */

  const WEIGHTS =
    Object.freeze({
      verified_production: 35,
      sustained_production: 25,
      position_output: 20,
      competition_context: 10,
      production_consistency: 10
    });

  /*
  =======================================================
  REQUIRED EVIDENCE
  =======================================================
  */

  const REQUIRED_EVIDENCE =
    Object.freeze([
      "athlete_id",
      "snapshot_id",
      "sport",
      "position",
      "production_records"
    ]);

  const OPTIONAL_EVIDENCE =
    Object.freeze([
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
    ]);

  /*
  =======================================================
  PROJECTION TIERS
  -------------------------------------------------------
  These are NOT Production scoring authority.

  They consume an already-governed Production score and
  provide downstream pathway/recruiting support only.
  =======================================================
  */

  const PROJECTION_TIERS =
    Object.freeze({

      ELITE: Object.freeze({
        min: 90,
        label:
          "Power 4 / High D1"
      }),

      HIGH: Object.freeze({
        min: 82,
        label:
          "G5 / FCS / D1"
      }),

      RECRUITABLE: Object.freeze({
        min: 72,
        label:
          "D2 / NAIA / Developmental FCS"
      }),

      DEVELOPING: Object.freeze({
        min: 60,
        label:
          "D3 / JUCO / Prep / Developmental"
      })

    });

  /*
  =======================================================
  AUTHORITY STATE
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

  function clamp(
    value,
    min = 0,
    max = 100
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return null;
    }

    return Math.max(
      min,
      Math.min(
        max,
        number
      )
    );
  }

  function isFiniteNumber(
    value
  ) {
    return (
      typeof value ===
        "number" &&
      Number.isFinite(
        value
      )
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

  function weightTotal() {
    return Object.values(
      WEIGHTS
    ).reduce(
      (
        total,
        weight
      ) =>
        total +
        weight,
      0
    );
  }

  function validateWeights() {
    return (
      weightTotal() ===
      100
    );
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

      matrix_key:
        MATRIX_KEY,

      matrix_version:
        MATRIX_VERSION,

      doctrine_version:
        input?.doctrine_version ??
        null,

      domain:
        MATRIX_DOMAIN,

      score:
        null,

      confidence:
        0,

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
          ? flags
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
      explanation,
      generated_at:
        result.generated_at
    };

    return result;
  }

  /*
  =======================================================
  MATRIX REGISTRY
  =======================================================
  */

  function getRegistry() {
    return (
      root.STATScoreMatrixRegistry ||
      root.STATSCORE_MATRIX_REGISTRY ||
      root.STATScore
        ?.MatrixRegistry ||
      null
    );
  }

  function getRegistryEntry(
    context = {}
  ) {
    if (
      context.registry_entry
    ) {
      return (
        context.registry_entry
      );
    }

    const registry =
      getRegistry();

    if (!registry) {
      return null;
    }

    if (
      typeof registry
        .getMatrix ===
        "function"
    ) {
      return registry.getMatrix(
        MATRIX_KEY
      );
    }

    if (
      typeof registry.get ===
        "function"
    ) {
      return registry.get(
        MATRIX_KEY
      );
    }

    if (
      registry[
        MATRIX_KEY
      ]
    ) {
      return registry[
        MATRIX_KEY
      ];
    }

    if (
      Array.isArray(
        registry.matrices
      )
    ) {
      return (
        registry.matrices.find(
          (entry) =>
            entry?.matrix_key ===
            MATRIX_KEY
        ) ||
        null
      );
    }

    return null;
  }

  function validateRegistry(
    context = {}
  ) {
    const entry =
      getRegistryEntry(
        context
      );

    if (!entry) {
      return {
        ok:
          false,

        status:
          "MATRIX_UNAVAILABLE",

        reason:
          "PRODUCTION_MATRIX is not available from the Matrix Registry."
      };
    }

    const checks = [
      [
        "matrix_key",
        MATRIX_KEY
      ],

      [
        "matrix_domain",
        MATRIX_DOMAIN
      ],

      [
        "matrix_version",
        MATRIX_VERSION
      ],

      [
        "stream_owner",
        STREAM_OWNER
      ],

      [
        "output_type",
        OUTPUT_TYPE
      ]
    ];

    for (
      const [
        field,
        expected
      ] of checks
    ) {
      if (
        entry[field] != null &&
        String(
          entry[field]
        ) !==
          String(
            expected
          )
      ) {
        return {
          ok:
            false,

          status:
            "MATRIX_CONTRACT_INVALID",

          reason:
            `PRODUCTION_MATRIX registry mismatch for ${field}.`
        };
      }
    }

    if (
      entry.weights
    ) {
      for (
        const [
          key,
          expectedWeight
        ] of Object.entries(
          WEIGHTS
        )
      ) {
        if (
          Number(
            entry.weights[
              key
            ]
          ) !==
          expectedWeight
        ) {
          return {
            ok:
              false,

            status:
              "MATRIX_CONTRACT_INVALID",

            reason:
              `PRODUCTION_MATRIX registry weight mismatch for ${key}.`
          };
        }
      }
    }

    return {
      ok:
        true,

      entry
    };
  }

  /*
  =======================================================
  STREAM AUTHORITY
  =======================================================
  */

  function validateAuthority(
    context = {}
  ) {
    if (
      context.stream_owner &&
      context.stream_owner !==
        STREAM_OWNER
    ) {
      return {
        ok:
          false,

        status:
          "MATRIX_UNAUTHORIZED",

        reason:
          "PRODUCTION_MATRIX may only execute under Stream 9 authority."
      };
    }

    return {
      ok:
        true
    };
  }

  /*
  =======================================================
  REQUIRED EVIDENCE
  =======================================================
  */

  function hasProductionRecords(
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

  function validateRequiredEvidence(
    input
  ) {
    const missing =
      [];

    if (
      !input?.athlete_id
    ) {
      missing.push(
        "athlete_id"
      );
    }

    if (
      !input?.snapshot_id
    ) {
      missing.push(
        "snapshot_id"
      );
    }

    if (
      !input?.sport
    ) {
      missing.push(
        "sport"
      );
    }

    if (
      !input?.position
    ) {
      missing.push(
        "position"
      );
    }

    if (
      !hasProductionRecords(
        input?.production_records
      )
    ) {
      missing.push(
        "production_records"
      );
    }

    return missing;
  }

  /*
  =======================================================
  PRODUCTION AUTHORITY
  -------------------------------------------------------
  Production normalization is not invented here.

  A governed Production Authority must interpret:
  - sport;
  - position;
  - season/game production;
  - official stat evidence;
  - competition context;
  - sustained production;
  - production consistency.

  The matrix consumes those governed component
  determinations.
  =======================================================
  */

  function resolveProductionAuthority(
    context = {}
  ) {
    return (
      context.production_authority ||

      root.STATScoreProductionEngine ||

      root.STATScore
        ?.ProductionEngine ||

      root.STATScore
        ?.ProductionAuthority ||

      null
    );
  }

  function executeProductionAuthority(
    authority,
    payload
  ) {
    if (!authority) {
      return null;
    }

    const methods = [
      "evaluateProductionComponents",
      "evaluateProductionProfile",
      "evaluate",
      "scoreProduction",
      "score"
    ];

    for (
      const method of methods
    ) {
      if (
        typeof authority[
          method
        ] ===
        "function"
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
            "PRODUCTION_MATRIX requires a synchronous Production Authority result at this boundary."
          );
        }

        return result;
      }
    }

    return null;
  }

  /*
  =======================================================
  COMPONENT EXTRACTION
  =======================================================
  */

  function readComponent(
    result,
    key
  ) {
    const candidates = [
      result
        ?.components?.[
          key
        ],

      result
        ?.component_scores?.[
          key
        ],

      result
        ?.scores?.[
          key
        ],

      result?.[
        key
      ]
    ];

    for (
      const value of candidates
    ) {
      if (
        isFiniteNumber(
          value
        )
      ) {
        return clamp(
          value
        );
      }
    }

    return null;
  }

  /*
  =======================================================
  PRODUCTION EVIDENCE COLLECTION
  =======================================================
  */

  function collectEvidenceRecords(
    input
  ) {
    return [
      ...toArray(
        input.production_records
      ),

      ...toArray(
        input.season_records
      ),

      ...toArray(
        input.game_records
      ),

      ...toArray(
        input.official_stats
      ),

      ...toArray(
        input.coach_verified_stats
      ),

      ...toArray(
        input.league_stats
      ),

      ...toArray(
        input.box_scores
      ),

      ...toArray(
        input.production_history
      )
    ];
  }

  /*
  =======================================================
  CONFIDENCE DETERMINATION
  -------------------------------------------------------
  Production score and confidence are separate.

  Verification strengthens confidence.

  It does not alter underlying production facts.
  =======================================================
  */

  function determineConfidence(
    input
  ) {
    const records =
      collectEvidenceRecords(
        input
      );

    if (
      !records.length
    ) {
      return {
        confidence:
          0,

        flags: [
          "UNVERIFIED"
        ]
      };
    }

    let total =
      0;

    let observed =
      0;

    const flags =
      [];

    for (
      const record of records
    ) {
      if (
        !record ||
        typeof record !==
          "object"
      ) {
        continue;
      }

      observed +=
        1;

      const status =
        normalizeText(
          record
            .verification_status ||
          record.status
        );

      const sourceType =
        normalizeText(
          record.source_type
        );

      const verified =
        record.verified ===
          true ||
        status ===
          "VERIFIED";

      const officialSource =
        sourceType ===
          "OFFICIAL_SOURCE" ||
        sourceType ===
          "LEAGUE_SOURCE" ||
        sourceType ===
          "SCHOOL_SOURCE";

      const selfReported =
        record.self_reported ===
          true ||
        sourceType ===
          "SELF_REPORTED";

      const stale =
        record.stale ===
          true ||
        status ===
          "STALE";

      const conflict =
        record.conflict ===
          true ||
        status ===
          "CONFLICT";

      let confidence =
        70;

      if (
        verified ||
        officialSource
      ) {
        confidence =
          100;
      }

      if (
        selfReported
      ) {
        confidence =
          Math.min(
            confidence,
            55
          );

        flags.push(
          "SELF_REPORTED_EVIDENCE"
        );
      }

      if (
        stale
      ) {
        confidence =
          Math.min(
            confidence,
            45
          );

        flags.push(
          "STALE_EVIDENCE"
        );
      }

      if (
        conflict
      ) {
        confidence =
          Math.min(
            confidence,
            25
          );

        flags.push(
          "SOURCE_EVIDENCE_CONFLICT"
        );
      }

      total +=
        confidence;
    }

    if (
      !observed
    ) {
      return {
        confidence:
          0,

        flags: [
          "UNVERIFIED"
        ]
      };
    }

    const confidence =
      Math.round(
        clamp(
          total /
          observed
        )
      );

    if (
      confidence <
      60
    ) {
      flags.push(
        "LOW_CONFIDENCE"
      );
    }

    if (
      !flags.length
    ) {
      flags.push(
        "CONFIDENCE_SUPPORTED"
      );
    }

    return {
      confidence,

      flags: [
        ...new Set(
          flags
        )
      ]
    };
  }

  /*
  =======================================================
  OFFICIAL PRODUCTION MATRIX EVALUATION
  =======================================================
  */

  function evaluate(
    input,
    context = {}
  ) {
    try {
      lastError =
        null;

      /*
      ---------------------------------------------------
      WEIGHTS
      ---------------------------------------------------
      */

      if (
        !validateWeights()
      ) {
        return failClosed(
          input,

          "MATRIX_CONTRACT_INVALID",

          [
            "WEIGHTS_INVALID"
          ],

          "PRODUCTION_MATRIX weights do not total 100."
        );
      }

      /*
      ---------------------------------------------------
      STREAM AUTHORITY
      ---------------------------------------------------
      */

      const authorityValidation =
        validateAuthority(
          context
        );

      if (
        !authorityValidation.ok
      ) {
        return failClosed(
          input,

          authorityValidation.status,

          [
            "AUTHORITY_INVALID"
          ],

          authorityValidation.reason
        );
      }

      /*
      ---------------------------------------------------
      REGISTRY CONTRACT
      ---------------------------------------------------
      */

      const registryValidation =
        validateRegistry(
          context
        );

      if (
        !registryValidation.ok
      ) {
        return failClosed(
          input,

          registryValidation.status,

          [
            "REGISTRY_INVALID"
          ],

          registryValidation.reason
        );
      }

      /*
      ---------------------------------------------------
      REQUIRED EVIDENCE
      ---------------------------------------------------
      */

      const missingRequired =
        validateRequiredEvidence(
          input
        );

      if (
        missingRequired.length
      ) {
        return failClosed(
          input,

          "INSUFFICIENT_EVIDENCE",

          [
            "REQUIRED_EVIDENCE_MISSING"
          ],

          `Required production evidence unavailable: ${missingRequired.join(", ")}.`,

          missingRequired
        );
      }

      /*
      ---------------------------------------------------
      PRODUCTION AUTHORITY
      ---------------------------------------------------
      */

      const productionAuthority =
        resolveProductionAuthority(
          context
        );

      if (
        !productionAuthority
      ) {
        return failClosed(
          input,

          "MATRIX_UNAVAILABLE",

          [
            "PRODUCTION_AUTHORITY_UNAVAILABLE"
          ],

          "Production interpretation authority is unavailable. PRODUCTION_MATRIX will not invent production normalization or benchmark science."
        );
      }

      const productionResult =
        executeProductionAuthority(
          productionAuthority,
          {
            athlete_id:
              input.athlete_id,

            snapshot_id:
              input.snapshot_id,

            sport:
              normalizeText(
                input.sport
              ),

            position:
              normalizeText(
                input.position
              ),

            production_records:
              input.production_records,

            season_records:
              input.season_records ??
              null,

            game_records:
              input.game_records ??
              null,

            official_stats:
              input.official_stats ??
              null,

            coach_verified_stats:
              input.coach_verified_stats ??
              null,

            league_stats:
              input.league_stats ??
              null,

            box_scores:
              input.box_scores ??
              null,

            competition_context:
              input.competition_context ??
              null,

            awards:
              input.awards ??
              null,

            film_references:
              input.film_references ??
              null,

            production_history:
              input.production_history ??
              null
          }
        );

      if (
        !productionResult ||
        productionResult.status ===
          "INSUFFICIENT_EVIDENCE"
      ) {
        return failClosed(
          input,

          "INSUFFICIENT_EVIDENCE",

          [
            "PRODUCTION_EVIDENCE_INSUFFICIENT"
          ],

          "The Production Authority did not return sufficient governed production evidence for an official Production score."
        );
      }

      /*
      ---------------------------------------------------
      COMPONENTS
      ---------------------------------------------------
      */

      const components =
        {};

      const missingComponents =
        [];

      for (
        const key of Object.keys(
          WEIGHTS
        )
      ) {
        const value =
          readComponent(
            productionResult,
            key
          );

        if (
          value == null
        ) {
          missingComponents.push(
            key
          );
        } else {
          components[
            key
          ] =
            value;
        }
      }

      if (
        missingComponents.length
      ) {
        return failClosed(
          input,

          "INSUFFICIENT_EVIDENCE",

          [
            "PRODUCTION_COMPONENTS_MISSING"
          ],

          `PRODUCTION_MATRIX component determinations unavailable: ${missingComponents.join(", ")}.`,

          missingComponents
        );
      }

      /*
      ---------------------------------------------------
      PRODUCTION SCORE
      ---------------------------------------------------
      */

      const rawScore =
        Object.entries(
          WEIGHTS
        ).reduce(
          (
            total,
            [
              key,
              weight
            ]
          ) =>
            total +
            (
              components[
                key
              ] *
              (
                weight /
                100
              )
            ),

          0
        );

      const score =
        Math.round(
          (
            rawScore +
            Number.EPSILON
          ) *
            100
        ) /
        100;

      /*
      ---------------------------------------------------
      CONFIDENCE
      ---------------------------------------------------
      */

      const trust =
        determineConfidence(
          input
        );

      /*
      ---------------------------------------------------
      EVIDENCE USED
      ---------------------------------------------------
      */

      const evidenceUsed = [
        "sport",
        "position",
        "production_records",

        ...OPTIONAL_EVIDENCE.filter(
          (key) =>
            input[
              key
            ] != null
        )
      ];

      /*
      ---------------------------------------------------
      RESULT
      ---------------------------------------------------
      */

      const result = {
        athlete_id:
          input.athlete_id,

        snapshot_id:
          input.snapshot_id,

        matrix_key:
          MATRIX_KEY,

        matrix_version:
          MATRIX_VERSION,

        doctrine_version:
          input.doctrine_version ??
          registryValidation
            .entry
            ?.doctrine_version ??
          null,

        domain:
          MATRIX_DOMAIN,

        score,

        confidence:
          trust.confidence,

        evidence_used:
          evidenceUsed,

        missing_evidence:
          [],

        flags:
          trust.flags,

        explanation: {
          summary:
            "Production Intelligence evaluates governed competitive production independently from Athletic ability, Verification standing, and downstream pathway projection. Verification affects confidence in the production evidence but does not alter the underlying production facts.",

          components,

          weights: {
            ...WEIGHTS
          },

          production_athletic_separation:
            true,

          production_verification_separation:
            true,

          production_pathway_separation:
            true,

          verification_changes_production:
            false,

          athletic_measurables_create_production:
            false
        },

        generated_at:
          now(),

        status:
          trust.confidence <
            60

            ? "UNVERIFIED"

            : "SCORED"
      };

      lastResult =
        result;

      return result;

    } catch (
      error
    ) {
      return failClosed(
        input,

        "MATRIX_CONTRACT_INVALID",

        [
          "UNHANDLED_MATRIX_ERROR"
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
  DOWNSTREAM PROJECTION SUPPORT
  -------------------------------------------------------
  This helper is intentionally NOT the Production Matrix.

  It consumes an already-authorized Production score.

  It does not:
  - create a Production score;
  - repair a missing score;
  - convert null to zero;
  - change official Production intelligence.
  =======================================================
  */

  function getProductionProjection({
    sport,
    position,
    production_score
  } = {}) {

    if (
      production_score == null ||
      production_score ===
        ""
    ) {
      return {
        status:
          "INSUFFICIENT_EVIDENCE",

        score:
          null,

        tier:
          null,

        label:
          "Production score unavailable",

        indicators: [
          "A governed Production domain score is required before pathway projection may be generated."
        ],

        official_production_score:
          false
      };
    }

    const score =
      Number(
        production_score
      );

    if (
      !Number.isFinite(
        score
      )
    ) {
      return {
        status:
          "INVALID_PRODUCTION_SCORE",

        score:
          null,

        tier:
          null,

        label:
          "Invalid Production score",

        indicators: [
          "Production projection requires a valid governed numeric Production domain score."
        ],

        official_production_score:
          false
      };
    }

    const bounded =
      clamp(
        score
      );

    let tier =
      "DEVELOPMENTAL";

    let meta = {
      min:
        0,

      label:
        "Developmental / Needs Evidence"
    };

    if (
      bounded >=
      PROJECTION_TIERS
        .ELITE
        .min
    ) {
      tier =
        "ELITE";

      meta =
        PROJECTION_TIERS
          .ELITE;

    } else if (
      bounded >=
      PROJECTION_TIERS
        .HIGH
        .min
    ) {
      tier =
        "HIGH";

      meta =
        PROJECTION_TIERS
          .HIGH;

    } else if (
      bounded >=
      PROJECTION_TIERS
        .RECRUITABLE
        .min
    ) {
      tier =
        "RECRUITABLE";

      meta =
        PROJECTION_TIERS
          .RECRUITABLE;

    } else if (
      bounded >=
      PROJECTION_TIERS
        .DEVELOPING
        .min
    ) {
      tier =
        "DEVELOPING";

      meta =
        PROJECTION_TIERS
          .DEVELOPING;
    }

    return {
      status:
        "PROJECTED",

      sport:
        sport ??
        null,

      position:
        position ??
        null,

      production_score:
        bounded,

      score:
        bounded,

      tier,

      label:
        meta.label,

      projection_authority:
        false,

      official_production_score:
        false,

      pathway_support_only:
        true,

      indicators: [
        "Projection consumes an existing governed Production score.",
        "Projection does not modify the official Production domain score.",
        "Final pathway decisions require separate governed Pathway Intelligence."
      ]
    };
  }

  /*
  =======================================================
  CONTRACT / DIAGNOSTICS
  =======================================================
  */

  function getContract() {
    return {
      matrix_key:
        MATRIX_KEY,

      matrix_domain:
        MATRIX_DOMAIN,

      matrix_version:
        MATRIX_VERSION,

      stream_owner:
        STREAM_OWNER,

      output_type:
        OUTPUT_TYPE,

      score_range: {
        ...SCORE_RANGE
      },

      required_evidence: [
        ...REQUIRED_EVIDENCE
      ],

      optional_evidence: [
        ...OPTIONAL_EVIDENCE
      ],

      weights: {
        ...WEIGHTS
      },

      production_athletic_separation:
        true,

      production_verification_separation:
        true,

      production_pathway_separation:
        true,

      missing_production_becomes_zero:
        false
    };
  }

  function getConfiguration() {
    return {
      ...getContract(),

      projection_tiers:
        PROJECTION_TIERS
    };
  }

  function getLastResult() {
    return lastResult;
  }

  function getLastError() {
    return lastError;
  }

  function runHealthCheck(
    context = {}
  ) {
    const registryValidation =
      validateRegistry(
        context
      );

    const productionAuthority =
      resolveProductionAuthority(
        context
      );

    return {
      authority_loaded:
        true,

      matrix_key:
        MATRIX_KEY,

      matrix_version:
        MATRIX_VERSION,

      stream_owner:
        STREAM_OWNER,

      weights_total:
        weightTotal(),

      weights_valid:
        validateWeights(),

      registered:
        registryValidation.ok,

      registry_status:
        registryValidation.ok
          ? "OK"
          : registryValidation.status,

      production_authority_available:
        Boolean(
          productionAuthority
        ),

      missing_production_becomes_zero:
        false,

      athletic_measurables_create_production:
        false,

      verification_changes_production:
        false,

      pathway_projection_separated:
        true,

      healthy:
        validateWeights() &&
        registryValidation.ok &&
        Boolean(
          productionAuthority
        )
    };
  }

  /*
  =======================================================
  CANONICAL PUBLIC AUTHORITY
  =======================================================
  */

  const api =
    Object.freeze({

      evaluate,

      getProductionProjection,

      getContract,

      getConfiguration,

      getLastResult,

      getLastError,

      runHealthCheck

    });

  root.STATScoreProductionMatrix =
    api;

  root.STATScore =
    root.STATScore ||
    {};

  root.STATScore.Matrices =
    root.STATScore.Matrices ||
    {};

  root.STATScore.Matrices[
    MATRIX_KEY
  ] =
    api;

  /*
  =======================================================
  CONTROLLED LEGACY COMPATIBILITY
  -------------------------------------------------------
  Existing consumers may temporarily reference:
  window.STATSCORE_PRODUCTION_MATRIX
  window.getProductionProjection

  These aliases point to this governed authority / helper.
  They do not create a second Production scoring authority.
  =======================================================
  */

  root.STATSCORE_PRODUCTION_MATRIX =
    api;

  root.getProductionProjection =
    getProductionProjection;

  /*
  =======================================================
  LOAD RECEIPT
  =======================================================
  */

  console.info(
    "[STATS-CORE][STREAM 9] PRODUCTION_MATRIX v1.0.0 loaded."
  );

})(
  typeof window !==
    "undefined"
    ? window
    : globalThis
); 
