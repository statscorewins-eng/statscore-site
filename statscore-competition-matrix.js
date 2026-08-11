/**
* STATS-CORE™
* STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY
*
* File:
* statscore-competition-matrix.js
*
* Matrix:
* COMPETITION_MATRIX
*
* Version:
* 1.0.0
*
* Constitutional Purpose:
* Evaluate the competitive context surrounding athlete production.
*
* Competition Intelligence answers:
* "Against what level and quality of competition was the athlete's production established?"
*
* Competition Intelligence shall not alter:
* - athletic ability
* - production facts
* - academic ability
* - physical measurements
*/

(function (root) {
  "use strict";

  const MATRIX_KEY =
    "COMPETITION_MATRIX";

  const MATRIX_DOMAIN =
    "COMPETITION";

  const MATRIX_VERSION =
    "1.0.0";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const OUTPUT_TYPE =
    "DOMAIN_SCORE";

  const WEIGHTS =
    Object.freeze({
      competition_level: 35,
      opponent_quality: 25,
      schedule_strength: 20,
      regional_context: 10,
      verified_context: 10
    });

  const REQUIRED_EVIDENCE =
    Object.freeze([
      "athlete_id",
      "snapshot_id",
      "sport",
      "competition_level"
    ]);

  const OPTIONAL_EVIDENCE =
    Object.freeze([
      "opponent_quality",
      "league_strength",
      "school_classification",
      "regional_context",
      "schedule_strength"
    ]);

  let lastResult = null;
  let lastError = null;

  function now() {
    return new Date().toISOString();
  }

  function clamp(
    value,
    min = 0,
    max = 100
  ) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    return Math.max(
      min,
      Math.min(max, number)
    );
  }

  function normalizeText(value) {
    return String(
      value == null ? "" : value
    )
      .trim()
      .toUpperCase();
  }

  function weightTotal() {
    return Object.values(
      WEIGHTS
    ).reduce(
      (sum, value) =>
        sum + value,
      0
    );
  }

  function validateWeights() {
    return weightTotal() === 100;
  }

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

      matrix_key: MATRIX_KEY,
      matrix_version:
        MATRIX_VERSION,

      doctrine_version:
        input?.doctrine_version ??
        null,

      domain: MATRIX_DOMAIN,

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

      generated_at: now(),

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

    if (
      registry[MATRIX_KEY]
    ) {
      return (
        registry[MATRIX_KEY]
      );
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

  function validateRegistry(
    context = {}
  ) {
    const entry =
      getRegistryEntry(
        context
      );

    if (!entry) {
      return {
        ok: false,

        status:
          "MATRIX_UNAVAILABLE",

        reason:
          "COMPETITION_MATRIX is not available from the Matrix Registry."
      };
    }

    const checks = [
      ["matrix_key", MATRIX_KEY],

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
          String(expected)
      ) {
        return {
          ok: false,

          status:
            "MATRIX_CONTRACT_INVALID",

          reason:
            `COMPETITION_MATRIX registry mismatch for ${field}.`
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
              `COMPETITION_MATRIX registry weight mismatch for ${key}.`
          };
        }
      }
    }

    return {
      ok: true,
      entry
    };
  }

  function validateAuthority(
    context = {}
  ) {
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
          "COMPETITION_MATRIX may only execute under Stream 9 authority."
      };
    }

    return {
      ok: true
    };
  }

  function validateRequiredEvidence(
    input
  ) {
    return (
      REQUIRED_EVIDENCE.filter(
        (field) =>
          input?.[field] == null ||
          input[field] === ""
      )
    );
  }

  function resolveContextAuthority(
    context = {}
  ) {
    return (
      context.competition_context_authority ||

      root.STATScoreCompetitionContextAuthority ||

      root.STATScore
        ?.CompetitionContextAuthority ||

      null
    );
  }

  function executeContextAuthority(
    authority,
    payload
  ) {
    if (!authority) {
      return null;
    }

    const methods = [
      "evaluateCompetitionContext",
      "evaluate",
      "scoreContext",
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
            "COMPETITION_MATRIX requires a synchronous competition-context result."
          );
        }

        return result;
      }
    }

    return null;
  }

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
        typeof value ===
          "number" &&
        Number.isFinite(value)
      ) {
        return clamp(value);
      }
    }

    return null;
  }

  function determineConfidence(
    contextResult
  ) {
    let confidence = 70;

    const flags = [];

    const verificationStatus =
      normalizeText(
        contextResult
          ?.verification_status ||
        contextResult?.status
      );

    const verified =
      contextResult?.verified ===
        true ||
      verificationStatus ===
        "VERIFIED";

    const stale =
      contextResult?.stale ===
        true ||
      verificationStatus ===
        "STALE";

    const conflict =
      contextResult?.conflict ===
        true ||
      verificationStatus ===
        "CONFLICT";

    if (verified) {
      confidence = 100;
    } else {
      flags.push("UNVERIFIED");
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

    if (confidence < 60) {
      flags.push(
        "LOW_CONFIDENCE"
      );
    }

    return {
      confidence:
        Math.round(
          clamp(confidence)
        ),

      flags: [
        ...new Set(flags)
      ]
    };
  }

  function evaluate(
    input,
    context = {}
  ) {
    try {
      lastError = null;

      if (!validateWeights()) {
        return failClosed(
          input,
          "MATRIX_CONTRACT_INVALID",
          ["WEIGHTS_INVALID"],
          "COMPETITION_MATRIX weights do not total 100."
        );
      }

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
          ["AUTHORITY_INVALID"],
          authorityValidation.reason
        );
      }

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
          ["REGISTRY_INVALID"],
          registryValidation.reason
        );
      }

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
          `Required competition evidence unavailable: ${missingRequired.join(", ")}.`,
          missingRequired
        );
      }

      const contextAuthority =
        resolveContextAuthority(
          context
        );

      if (
        !contextAuthority
      ) {
        return failClosed(
          input,
          "MATRIX_UNAVAILABLE",
          [
            "COMPETITION_CONTEXT_AUTHORITY_UNAVAILABLE"
          ],
          "Competition-context authority is unavailable. COMPETITION_MATRIX will not invent competition-level scoring science."
        );
      }

      const contextResult =
        executeContextAuthority(
          contextAuthority,
          {
            athlete_id:
              input.athlete_id,

            snapshot_id:
              input.snapshot_id,

            sport:
              normalizeText(
                input.sport
              ),

            competition_level:
              input.competition_level,

            opponent_quality:
              input.opponent_quality ??
              null,

            league_strength:
              input.league_strength ??
              null,

            school_classification:
              input.school_classification ??
              null,

            regional_context:
              input.regional_context ??
              null,

            schedule_strength:
              input.schedule_strength ??
              null
          }
        );

      if (
        !contextResult ||
        contextResult.status ===
          "INSUFFICIENT_EVIDENCE"
      ) {
        return failClosed(
          input,
          "INSUFFICIENT_EVIDENCE",
          [
            "COMPETITION_CONTEXT_INSUFFICIENT"
          ],
          "Governed competition context is insufficient for an official Competition score."
        );
      }

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
            contextResult,
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
            "COMPETITION_COMPONENTS_MISSING"
          ],
          `Competition Matrix component determinations unavailable: ${missingComponents.join(", ")}.`,
          missingComponents
        );
      }

      const rawScore =
        Object.entries(WEIGHTS)
          .reduce(
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

      const trust =
        determineConfidence(
          contextResult
        );

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

        evidence_used: [
          "sport",
          "competition_level",

          ...OPTIONAL_EVIDENCE.filter(
            (key) =>
              input[key] != null
          )
        ],

        missing_evidence: [],

        flags:
          trust.flags,

        explanation: {
          summary:
            "Competition Intelligence describes the level and quality of competition surrounding athlete production. It does not make the athlete faster, stronger, more productive, or more academically capable.",

          components,

          weights: {
            ...WEIGHTS
          },

          performance_isolation:
            true
        },

        generated_at: now(),

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
        min: 0,
        max: 100
      },

      required_evidence: [
        ...REQUIRED_EVIDENCE
      ],

      optional_evidence: [
        ...OPTIONAL_EVIDENCE
      ],

      weights: {
        ...WEIGHTS
      }
    };
  }

  function getConfiguration() {
    return getContract();
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

    return {
      authority_loaded:
        true,

      matrix_key:
        MATRIX_KEY,

      matrix_version:
        MATRIX_VERSION,

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

      competition_context_authority_available:
        Boolean(
          resolveContextAuthority(
            context
          )
        ),

      healthy:
        validateWeights() &&
        registryValidation.ok
    };
  }

  const api =
    Object.freeze({
      evaluate,
      getContract,
      getConfiguration,
      getLastResult,
      getLastError,
      runHealthCheck
    });

  root.STATScoreCompetitionMatrix =
    api;

  root.STATScore =
    root.STATScore || {};

  root.STATScore.Matrices =
    root.STATScore.Matrices || {};

  root.STATScore.Matrices[
    MATRIX_KEY
  ] = api;

})(
  typeof window !== "undefined"
    ? window
    : globalThis
); 
Compose:
New Message
