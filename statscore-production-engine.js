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

CONSTITUTIONAL PURPOSE
---------------------------------------------------------
The Production Matrix evaluates demonstrated athlete
production separately from evidence verification and
confidence.

Production performance answers:

"What has the athlete actually produced?"

Verification answers:

"How strongly can that production evidence be trusted?"

Verification may change confidence.

Verification shall NEVER increase or decrease the
underlying production meaning of the evidence itself.

The Production Matrix shall fail closed when required
production evidence is unavailable.

Missing intelligence shall NEVER silently become zero.
=========================================================
*/

(function (root) {
  "use strict";

  /*
  =======================================================
  MATRIX IDENTITY
  =======================================================
  */

  const MATRIX_KEY = "PRODUCTION_MATRIX";
  const MATRIX_DOMAIN = "PRODUCTION";
  const MATRIX_VERSION = "1.0.0";
  const STREAM_OWNER = "STATSCORE_STREAM_9";
  const OUTPUT_TYPE = "DOMAIN_SCORE";

  const SCORE_RANGE = Object.freeze({
    min: 0,
    max: 100
  });

  /*
  =======================================================
  LOCKED MATRIX WEIGHTS
  =======================================================

  CSE CONTROLLED WEIGHTS

  production_volume       30
  production_efficiency   25
  season_consistency      20
  role_context            15
  verified_recognition    10
                         ---
                         100

  These weights shall not be silently changed.
  =======================================================
  */

  const WEIGHTS = Object.freeze({
    production_volume: 30,
    production_efficiency: 25,
    season_consistency: 20,
    role_context: 15,
    verified_recognition: 10
  });

  /*
  =======================================================
  EVIDENCE CONTRACT
  =======================================================
  */

  const REQUIRED_EVIDENCE = Object.freeze([
    "athlete_id",
    "snapshot_id",
    "sport",
    "position",
    "season_records"
  ]);

  const OPTIONAL_EVIDENCE = Object.freeze([
    "game_records",
    "verified_statistics",
    "stat_source_verification",
    "coach_recognition",
    "league_recognition",
    "postseason_recognition",
    "role_history",
    "competition_context"
  ]);

  /*
  =======================================================
  AUTHORITY STATE
  =======================================================
  */

  let lastResult = null;
  let lastError = null;

  /*
  =======================================================
  UTILITIES
  =======================================================
  */

  function now() {
    return new Date().toISOString();
  }

  function normalizeText(value) {
    return String(
      value == null ? "" : value
    )
      .trim()
      .toUpperCase();
  }

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    return Math.max(
      min,
      Math.min(max, number)
    );
  }

  function isFiniteNumber(value) {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
    );
  }

  function toArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (value == null) {
      return [];
    }

    return [value];
  }

  function weightTotal() {
    return Object.values(WEIGHTS)
      .reduce(
        (sum, value) => sum + value,
        0
      );
  }

  function validateWeights() {
    return weightTotal() === 100;
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
        input?.athlete_id ?? null,

      snapshot_id:
        input?.snapshot_id ?? null,

      matrix_key:
        MATRIX_KEY,

      matrix_version:
        MATRIX_VERSION,

      doctrine_version:
        input?.doctrine_version ??
        null,

      domain:
        MATRIX_DOMAIN,

      score: null,

      confidence: 0,

      evidence_used: [],

      missing_evidence:
        missingEvidence,

      flags:
        Array.isArray(flags)
          ? flags
          : [],

      explanation,

      generated_at:
        now(),

      status
    };

    lastResult = result;

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
  MATRIX REGISTRY VALIDATION
  =======================================================
  */

  function getRegistry() {
    return (
      root.STATScoreMatrixRegistry ||
      root.STATSCORE_MATRIX_REGISTRY ||
      root.STATScore?.MatrixRegistry ||
      null
    );
  }

  function getRegistryEntry(context = {}) {
    if (context.registry_entry) {
      return context.registry_entry;
    }

    const registry = getRegistry();

    if (!registry) {
      return null;
    }

    if (
      typeof registry.getMatrix ===
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

    if (registry[MATRIX_KEY]) {
      return registry[MATRIX_KEY];
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
        ) || null
      );
    }

    return null;
  }

  function validateRegistry(context = {}) {
    const entry =
      getRegistryEntry(context);

    if (!entry) {
      return {
        ok: false,
        status:
          "MATRIX_UNAVAILABLE",
        reason:
          "PRODUCTION_MATRIX is not available from the Matrix Registry."
      };
    }

    const checks = [
      ["matrix_key", MATRIX_KEY],
      ["matrix_domain", MATRIX_DOMAIN],
      ["matrix_version", MATRIX_VERSION],
      ["stream_owner", STREAM_OWNER],
      ["output_type", OUTPUT_TYPE]
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
          String(expected)
      ) {
        return {
          ok: false,
          status:
            "MATRIX_CONTRACT_INVALID",
          reason:
            `PRODUCTION_MATRIX registry mismatch for ${field}.`
        };
      }
    }

    if (entry.weights) {
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
            entry.weights[key]
          ) !==
          expectedWeight
        ) {
          return {
            ok: false,
            status:
              "MATRIX_CONTRACT_INVALID",
            reason:
              `PRODUCTION_MATRIX registry weight mismatch for ${key}.`
          };
        }
      }
    }

    return {
      ok: true,
      entry
    };
  }

  /*
  =======================================================
  STREAM AUTHORITY VALIDATION
  =======================================================
  */

  function validateAuthority(context = {}) {
    if (
      context.stream_owner &&
      context.stream_owner !==
        STREAM_OWNER
    ) {
      return {
        ok: false,
        status:
          "MATRIX_UNAUTHORIZED",
        reason:
          "PRODUCTION_MATRIX may only execute under Stream 9 authority."
      };
    }

    return {
      ok: true
    };
  }

  /*
  =======================================================
  REQUIRED EVIDENCE VALIDATION
  =======================================================
  */

  function validateRequiredEvidence(input) {
    const missing = [];

    for (
      const field of REQUIRED_EVIDENCE
    ) {
      const value =
        input?.[field];

      if (
        value == null ||
        value === ""
      ) {
        missing.push(field);
        continue;
      }

      if (
        field ===
          "season_records" &&
        toArray(value).length === 0
      ) {
        missing.push(field);
      }
    }

    return missing;
  }

  /*
  =======================================================
  PRODUCTION SCIENCE AUTHORITY
  =======================================================

  This matrix DOES NOT invent sport-specific production
  benchmark science.

  Sport / position production normalization must be
  supplied by an approved sport/position production
  authority.

  Example future authorities may include:

  Football QB production model
  Football WR production model
  Baseball pitcher production model
  Basketball guard production model
  Track event production model

  This matrix consumes their governed component output.
  =======================================================
  */

  function resolveProductionAuthority(context = {}) {
    return (
      context.production_authority ||

      root.STATScoreProductionAuthority ||

      root.STATScore
        ?.ProductionAuthority ||

      root.STATScoreSportScoringRouter ||

      root.STATScore
        ?.SportScoringRouter ||

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
      "evaluateProduction",
      "evaluate",
      "scoreProduction",
      "score"
    ];

    for (const method of methods) {
      if (
        typeof authority[method] ===
        "function"
      ) {
        const result =
          authority[method](
            payload
          );

        if (
          result &&
          typeof result.then ===
            "function"
        ) {
          throw new Error(
            "PRODUCTION_MATRIX requires a synchronous production-authority result at this boundary."
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
      result?.components?.[key],
      result?.component_scores?.[
        key
      ],
      result?.scores?.[key],
      result?.[key]
    ];

    for (
      const value of candidates
    ) {
      if (
        isFiniteNumber(value)
      ) {
        return clamp(value);
      }
    }

    return null;
  }

  /*
  =======================================================
  CONFIDENCE / VERIFICATION SEPARATION
  =======================================================

  IMPORTANT:

  Production score describes production.

  Confidence describes trust in the production evidence.

  Verification status may not retroactively inflate
  or reduce the production component values.
  =======================================================
  */

  function flattenRecords(value) {
    if (value == null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (
      typeof value ===
      "object"
    ) {
      return [value];
    }

    return [];
  }

  function determineConfidence(input) {
    const records = [
      ...flattenRecords(
        input.season_records
      ),

      ...flattenRecords(
        input.game_records
      ),

      ...flattenRecords(
        input.verified_statistics
      ),

      ...flattenRecords(
        input.stat_source_verification
      )
    ];

    if (!records.length) {
      return {
        confidence: 0,
        flags: [
          "UNVERIFIED"
        ]
      };
    }

    let total = 0;
    let count = 0;

    const flags = [];

    for (const record of records) {
      if (
        !record ||
        typeof record !==
          "object"
      ) {
        continue;
      }

      count += 1;

      const status =
        normalizeText(
          record.verification_status ||
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

      const stale =
        record.stale === true ||
        status === "STALE";

      const conflict =
        record.conflict ===
          true ||
        status ===
          "CONFLICT";

      const selfReported =
        record.self_reported ===
          true ||
        sourceType ===
          "SELF_REPORTED";

      let confidence = 70;

      if (verified) {
        confidence = 100;
      }

      if (selfReported) {
        confidence =
          Math.min(
            confidence,
            55
          );

        flags.push(
          "SELF_REPORTED_EVIDENCE"
        );
      }

      if (stale) {
        confidence =
          Math.min(
            confidence,
            45
          );

        flags.push(
          "STALE_EVIDENCE"
        );
      }

      if (conflict) {
        confidence =
          Math.min(
            confidence,
            25
          );

        flags.push(
          "SOURCE_EVIDENCE_CONFLICT"
        );
      }

      total += confidence;
    }

    if (!count) {
      return {
        confidence: 50,
        flags: [
          "UNVERIFIED"
        ]
      };
    }

    const confidence =
      Math.round(
        clamp(total / count)
      );

    if (confidence < 60) {
      flags.push(
        "LOW_CONFIDENCE"
      );
    }

    if (!flags.length) {
      flags.push(
        "CONFIDENCE_SUPPORTED"
      );
    }

    return {
      confidence,

      flags: [
        ...new Set(flags)
      ]
    };
  }

  /*
  =======================================================
  OFFICIAL PRODUCTION EVALUATION
  =======================================================
  */

  function evaluate(
    input,
    context = {}
  ) {
    try {
      lastError = null;

      /*
      ---------------------------------------------------
      WEIGHT VALIDATION
      ---------------------------------------------------
      */

      if (!validateWeights()) {
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
      SPORT / POSITION NORMALIZATION
      ---------------------------------------------------
      */

      const sport =
        normalizeText(
          input.sport
        );

      const position =
        normalizeText(
          input.position
        );

      /*
      ---------------------------------------------------
      SPORT-SPECIFIC PRODUCTION AUTHORITY
      ---------------------------------------------------
      */

      const productionAuthority =
        resolveProductionAuthority(
          context
        );

      if (!productionAuthority) {
        return failClosed(
          input,
          "MATRIX_UNAVAILABLE",
          [
            "PRODUCTION_AUTHORITY_UNAVAILABLE"
          ],
          "Sport/position Production Authority is unavailable. PRODUCTION_MATRIX will not invent production benchmark science."
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

            sport,

            position,

            season_records:
              input.season_records,

            game_records:
              input.game_records ??
              null,

            verified_statistics:
              input.verified_statistics ??
              null,

            stat_source_verification:
              input.stat_source_verification ??
              null,

            coach_recognition:
              input.coach_recognition ??
              null,

            league_recognition:
              input.league_recognition ??
              null,

            postseason_recognition:
              input.postseason_recognition ??
              null,

            role_history:
              input.role_history ??
              null,

            competition_context:
              input.competition_context ??
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
          "The sport/position Production Authority did not return sufficient governed production evidence."
        );
      }

      /*
      ---------------------------------------------------
      COMPONENT EXTRACTION
      ---------------------------------------------------
      */

      const components = {};
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

        if (value == null) {
          missingComponents.push(
            key
          );
        } else {
          components[key] =
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
      OFFICIAL PRODUCTION SCORE
      ---------------------------------------------------
      */

      const rawScore =
        Object.entries(
          WEIGHTS
        ).reduce(
          (
            total,
            [key, weight]
          ) =>
            total +
            (
              components[key] *
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
          ) * 100
        ) / 100;

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
        "season_records",

        ...OPTIONAL_EVIDENCE.filter(
          (key) =>
            input[key] != null
        )
      ];

      /*
      ---------------------------------------------------
      MATRIX RESULT
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

        missing_evidence: [],

        flags:
          trust.flags,

        explanation: {
          summary:
            "Production Intelligence evaluates demonstrated sport and position production. Verification and provenance affect confidence in the production evidence but do not inflate or reduce the production itself.",

          components,

          weights: {
            ...WEIGHTS
          },

          production_confidence_separation:
            true,

          verification_changes_performance:
            false
        },

        generated_at:
          now(),

        status:
          trust.confidence < 60
            ? "UNVERIFIED"
            : "SCORED"
      };

      lastResult = result;

      return result;

    } catch (error) {
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
  DOWNSTREAM PRODUCTION PROJECTION SUPPORT
  =======================================================

  This section preserves the useful recruiting /
  pathway projection logic from the legacy file.

  IMPORTANT:

  This helper consumes an ALREADY GOVERNED production
  score.

  It is NOT the Production Matrix.

  It does NOT publish an official Production score.

  Missing production_score remains null.

  It shall NEVER convert missing intelligence into zero.
  =======================================================
  */

  const PRODUCTION_PROJECTION_MATRIX =
    Object.freeze({

      football: {

        quarterback: {

          elite: {
            label:
              "Power 4 / High D1",

            production_score_min:
              90,

            indicators: [
              "High verified game production",
              "Strong TD-to-turnover ratio",
              "Advanced decision-making",
              "Verified arm strength",
              "Leadership impact"
            ]
          },

          high: {
            label:
              "G5 / FCS / D1",

            production_score_min:
              82,

            indicators: [
              "Consistent varsity production",
              "Recruitable film",
              "Strong accuracy and command",
              "Scheme-transfer potential"
            ]
          },

          recruitable: {
            label:
              "D2 / NAIA / Developmental FCS",

            production_score_min:
              72,

            indicators: [
              "Productive but still developing",
              "Needs verified competition context",
              "Needs more film or camp validation"
            ]
          },

          developing: {
            label:
              "D3 / JUCO / Prep / Developmental",

            production_score_min:
              60,

            indicators: [
              "Needs production evidence",
              "Needs measurable verification",
              "Needs development route"
            ]
          }
        },

        wide_receiver: {

          elite: {
            label:
              "Power 4 / High D1",

            production_score_min:
              90,

            indicators: [
              "Dominant game production",
              "Separation against verified competition",
              "Explosive yards after catch",
              "Verified speed or elite play speed",
              "High impact scoring production"
            ]
          },

          high: {
            label:
              "G5 / FCS / D1",

            production_score_min:
              82,

            indicators: [
              "Strong receiving production",
              "Reliable route running",
              "Verified hands",
              "Recruitable frame or speed"
            ]
          },

          recruitable: {
            label:
              "D2 / NAIA / Developmental FCS",

            production_score_min:
              72,

            indicators: [
              "Solid production",
              "Needs exposure validation",
              "Needs verified athletic testing"
            ]
          },

          developing: {
            label:
              "D3 / JUCO / Prep / Developmental",

            production_score_min:
              60,

            indicators: [
              "Needs production increase",
              "Needs film evidence",
              "Needs development pathway"
            ]
          }
        },

        running_back: {

          elite: {
            label:
              "Power 4 / High D1",

            production_score_min:
              90,

            indicators: [
              "High rushing production",
              "Explosive play rate",
              "Contact balance",
              "Verified speed",
              "Consistent scoring impact"
            ]
          },

          high: {
            label:
              "G5 / FCS / D1",

            production_score_min:
              82,

            indicators: [
              "Strong varsity production",
              "Reliable ball security",
              "Good burst and vision",
              "Recruitable film"
            ]
          },

          recruitable: {
            label:
              "D2 / NAIA / Developmental FCS",

            production_score_min:
              72,

            indicators: [
              "Productive but needs validation",
              "Needs verified speed/strength",
              "Needs more competitive context"
            ]
          },

          developing: {
            label:
              "D3 / JUCO / Prep / Developmental",

            production_score_min:
              60,

            indicators: [
              "Needs stronger evidence",
              "Needs development route",
              "Needs production growth"
            ]
          }
        },

        defensive_back: {

          elite: {
            label:
              "Power 4 / High D1",

            production_score_min:
              90,

            indicators: [
              "High-level coverage production",
              "Turnover creation",
              "Verified speed",
              "Position versatility",
              "Strong tackling evidence"
            ]
          },

          high: {
            label:
              "G5 / FCS / D1",

            production_score_min:
              82,

            indicators: [
              "Good coverage evidence",
              "Recruitable athletic profile",
              "Strong game film",
              "Verified competitive production"
            ]
          },

          recruitable: {
            label:
              "D2 / NAIA / Developmental FCS",

            production_score_min:
              72,

            indicators: [
              "Solid defensive production",
              "Needs exposure",
              "Needs verified metrics"
            ]
          },

          developing: {
            label:
              "D3 / JUCO / Prep / Developmental",

            production_score_min:
              60,

            indicators: [
              "Needs more film",
              "Needs measurable verification",
              "Needs position development"
            ]
          }
        }
      }
    });

  /*
  =======================================================
  PROJECTION HELPER
  =======================================================
  */

  function getProductionProjection({
    sport,
    position,
    production_score
  } = {}) {

    const cleanSport =
      String(
        sport || ""
      )
        .toLowerCase()
        .trim()
        .replace(
          /\s+/g,
          "_"
        );

    const cleanPosition =
      String(
        position || ""
      )
        .toLowerCase()
        .trim()
        .replace(
          /\s+/g,
          "_"
        );

    /*
    -----------------------------------------------------
    CRITICAL NULL RULE
    -----------------------------------------------------

    DO NOT:

    Number(production_score || 0)

    Missing production intelligence is not zero.
    -----------------------------------------------------
    */

    if (
      production_score == null ||
      production_score === ""
    ) {
      return {
        status:
          "INSUFFICIENT_EVIDENCE",

        tier: null,

        label:
          "Production score unavailable",

        score: null,

        indicators: [
          "Official Production Intelligence is unavailable.",
          "No recruiting or pathway projection is authorized until a governed Production score exists."
        ]
      };
    }

    const score =
      Number(
        production_score
      );

    if (
      !Number.isFinite(score)
    ) {
      return {
        status:
          "MATRIX_CONTRACT_INVALID",

        tier: null,

        label:
          "Invalid production score",

        score: null,

        indicators: [
          "Production projection received a non-numeric governed score."
        ]
      };
    }

    const matrix =
      PRODUCTION_PROJECTION_MATRIX
        ?.[cleanSport]
        ?.[cleanPosition];

    if (!matrix) {
      return {
        status:
          "NO_PROJECTION_MATRIX_FOUND",

        tier: null,

        label:
          "Needs sport/position projection matrix",

        score,

        indicators: [
          "No downstream production projection matrix exists for this sport and position.",
          "The official Production score remains valid and unchanged."
        ]
      };
    }

    if (
      score >=
      matrix.elite
        .production_score_min
    ) {
      return {
        status:
          "PROJECTED",

        tier:
          "ELITE",

        ...matrix.elite,

        score
      };
    }

    if (
      score >=
      matrix.high
        .production_score_min
    ) {
      return {
        status:
          "PROJECTED",

        tier:
          "HIGH",

        ...matrix.high,

        score
      };
    }

    if (
      score >=
      matrix.recruitable
        .production_score_min
    ) {
      return {
        status:
          "PROJECTED",

        tier:
          "RECRUITABLE",

        ...matrix.recruitable,

        score
      };
    }

    if (
      score >=
      matrix.developing
        .production_score_min
    ) {
      return {
        status:
          "PROJECTED",

        tier:
          "DEVELOPING",

        ...matrix.developing,

        score
      };
    }

    return {
      status:
        "PROJECTED",

      tier:
        "DEVELOPMENTAL",

      label:
        "Developmental / Needs Production Growth",

      score,

      indicators: [
        "Current governed production score is below the defined projection threshold.",
        "Production development is required.",
        "Projection does not alter the underlying official Production score."
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

      performance_confidence_separation:
        true,

      projection_separation:
        true
    };
  }

  function getConfiguration() {
    return {
      ...getContract(),

      projection_sports:
        Object.keys(
          PRODUCTION_PROJECTION_MATRIX
        )
    };
  }

  function getLastResult() {
    return lastResult;
  }

  function getLastError() {
    return lastError;
  }

  function runHealthCheck(context = {}) {
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

      missing_score_becomes_zero:
        false,

      production_confidence_separated:
        true,

      projection_separated_from_official_score:
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
  PUBLIC AUTHORITY
  =======================================================
  */

  const api =
    Object.freeze({
      evaluate,

      getContract,

      getConfiguration,

      getLastResult,

      getLastError,

      runHealthCheck,

      getProductionProjection
    });

  /*
  =======================================================
  CANONICAL NAMESPACE
  =======================================================
  */

  root.STATScoreProductionMatrix =
    api;

  root.STATScore =
    root.STATScore || {};

  root.STATScore.Matrices =
    root.STATScore.Matrices || {};

  root.STATScore.Matrices[
    MATRIX_KEY
  ] = api;

  /*
  =======================================================
  CONTROLLED LEGACY COMPATIBILITY EXPORTS
  =======================================================

  These names are retained temporarily so existing
  consumers do not break during reconstruction.

  They are compatibility aliases only.

  They are NOT separate scoring authorities.
  =======================================================
  */

  root.STATSCORE_PRODUCTION_MATRIX =
    PRODUCTION_PROJECTION_MATRIX;

  root.getProductionProjection =
    getProductionProjection;

  /*
  =======================================================
  LOAD RECEIPT
  =======================================================
  */

  console.log(
    "[STATS-CORE][STREAM 9] PRODUCTION_MATRIX v1.0.0 loaded."
  );

})(
  typeof window !== "undefined"
    ? window
    : globalThis
); 
