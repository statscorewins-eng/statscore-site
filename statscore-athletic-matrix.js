/**
* STATS-CORE™
* STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY
*
* File:
* statscore-athletic-matrix.js
*
* Matrix:
* ATHLETIC_MATRIX
*
* Version:
* 1.0.0
*
* Stream Owner:
* STATSCORE_STREAM_9
*
* Output Type:
* DOMAIN_SCORE
*
* Constitutional Doctrine:
* Athletic performance and evidence confidence are independent.
*
* Verification may alter confidence in a measurement.
* Verification shall never alter the physical meaning of the measurement itself.
*
* Example:
* Verified 4.41 forty = 4.41
* Self-reported 4.41 forty = 4.41
*
* The athletic interpretation is based upon the same claimed performance.
* Confidence changes according to provenance and verification.
*/

(function (root) {
  "use strict";

  const MATRIX_KEY = "ATHLETIC_MATRIX";
  const MATRIX_DOMAIN = "ATHLETIC";
  const MATRIX_VERSION = "1.0.0";
  const STREAM_OWNER = "STATSCORE_STREAM_9";
  const OUTPUT_TYPE = "DOMAIN_SCORE";

  const SCORE_RANGE = Object.freeze({
    min: 0,
    max: 100
  });

  const WEIGHTS = Object.freeze({
    position_athletic_fit: 30,
    verified_measurables: 25,
    movement_profile: 20,
    strength_profile: 15,
    physical_trajectory: 10
  });

  const REQUIRED_EVIDENCE = Object.freeze([
    "athlete_id",
    "snapshot_id",
    "sport",
    "position",
    "measurables"
  ]);

  const OPTIONAL_EVIDENCE = Object.freeze([
    "combine_results",
    "camp_results",
    "verified_testing",
    "physical_profile",
    "position_benchmarks"
  ]);

  let lastResult = null;
  let lastError = null;

  function now() {
    return new Date().toISOString();
  }

  function clamp(value, min = 0, max = 100) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    return Math.max(min, Math.min(max, number));
  }

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .trim()
      .toUpperCase();
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function weightTotal() {
    return Object.values(WEIGHTS)
      .reduce((sum, value) => sum + value, 0);
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
      athlete_id: input?.athlete_id ?? null,
      snapshot_id: input?.snapshot_id ?? null,

      matrix_key: MATRIX_KEY,
      matrix_version: MATRIX_VERSION,
      doctrine_version: input?.doctrine_version ?? null,

      domain: MATRIX_DOMAIN,

      score: null,
      confidence: 0,

      evidence_used: [],
      missing_evidence: missingEvidence,

      flags: Array.isArray(flags) ? flags : [],

      explanation,

      generated_at: now(),

      status
    };

    lastResult = result;

    lastError = {
      status,
      explanation,
      generated_at: result.generated_at
    };

    return result;
  }

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

    if (typeof registry.getMatrix === "function") {
      return registry.getMatrix(MATRIX_KEY);
    }

    if (typeof registry.get === "function") {
      return registry.get(MATRIX_KEY);
    }

    if (registry[MATRIX_KEY]) {
      return registry[MATRIX_KEY];
    }

    if (Array.isArray(registry.matrices)) {
      return (
        registry.matrices.find(
          (entry) => entry?.matrix_key === MATRIX_KEY
        ) || null
      );
    }

    return null;
  }

  function validateRegistry(context = {}) {
    const entry = getRegistryEntry(context);

    if (!entry) {
      return {
        ok: false,
        status: "MATRIX_UNAVAILABLE",
        reason:
          "ATHLETIC_MATRIX is not available from the Matrix Registry."
      };
    }

    const contractChecks = [
      ["matrix_key", MATRIX_KEY],
      ["matrix_domain", MATRIX_DOMAIN],
      ["matrix_version", MATRIX_VERSION],
      ["stream_owner", STREAM_OWNER],
      ["output_type", OUTPUT_TYPE]
    ];

    for (const [field, expected] of contractChecks) {
      if (
        entry[field] != null &&
        String(entry[field]) !== String(expected)
      ) {
        return {
          ok: false,
          status: "MATRIX_CONTRACT_INVALID",
          reason:
            `ATHLETIC_MATRIX registry mismatch for ${field}.`
        };
      }
    }

    if (entry.weights) {
      for (const [key, expectedWeight] of Object.entries(WEIGHTS)) {
        if (Number(entry.weights[key]) !== expectedWeight) {
          return {
            ok: false,
            status: "MATRIX_CONTRACT_INVALID",
            reason:
              `ATHLETIC_MATRIX registry weight mismatch for ${key}.`
          };
        }
      }
    }

    return {
      ok: true,
      entry
    };
  }

  function validateAuthority(context = {}) {
    if (
      context.stream_owner &&
      context.stream_owner !== STREAM_OWNER
    ) {
      return {
        ok: false,
        status: "MATRIX_UNAUTHORIZED",
        reason:
          "ATHLETIC_MATRIX may only execute under Stream 9 authority."
      };
    }

    return {
      ok: true
    };
  }

  function validateRequiredEvidence(input) {
    const missing = [];

    for (const field of REQUIRED_EVIDENCE) {
      const value = input?.[field];

      if (
        value == null ||
        value === "" ||
        (
          field === "measurables" &&
          (
            typeof value !== "object" ||
            Array.isArray(value) ||
            Object.keys(value).length === 0
          )
        )
      ) {
        missing.push(field);
      }
    }

    return missing;
  }

  function resolveBenchmarkAuthority(context = {}) {
    return (
      context.benchmark_authority ||
      root.STATScorePositionMatrixEngine ||
      root.STATScore?.PositionMatrixEngine ||
      null
    );
  }

  function executeBenchmarkAuthority(authority, payload) {
    if (!authority) {
      return null;
    }

    const methods = [
      "evaluateAthleticProfile",
      "evaluate",
      "scoreMeasurables",
      "score"
    ];

    for (const method of methods) {
      if (typeof authority[method] === "function") {
        const result = authority[method](payload);

        if (
          result &&
          typeof result.then === "function"
        ) {
          throw new Error(
            "ATHLETIC_MATRIX requires a synchronous benchmark result at this authority boundary."
          );
        }

        return result;
      }
    }

    return null;
  }

  function readComponent(result, key) {
    const candidates = [
      result?.components?.[key],
      result?.component_scores?.[key],
      result?.scores?.[key],
      result?.[key]
    ];

    for (const value of candidates) {
      if (isFiniteNumber(value)) {
        return clamp(value);
      }
    }

    return null;
  }

  function flattenEvidence(value) {
    if (value == null) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "object") {
      const values = Object.values(value);

      const structured = values.filter(
        (item) =>
          item &&
          typeof item === "object"
      );

      if (structured.length) {
        return structured;
      }

      return [value];
    }

    return [];
  }

  function determineConfidence(input) {
    const evidenceSources = [
      input.measurables,
      input.combine_results,
      input.camp_results,
      input.verified_testing,
      input.physical_profile
    ];

    const evidenceRecords = evidenceSources.flatMap(
      flattenEvidence
    );

    if (!evidenceRecords.length) {
      return {
        confidence: 0,
        flags: ["UNVERIFIED"]
      };
    }

    let totalConfidence = 0;
    let recordCount = 0;

    const flags = [];

    for (const record of evidenceRecords) {
      if (
        !record ||
        typeof record !== "object"
      ) {
        continue;
      }

      recordCount += 1;

      const verificationStatus = normalizeText(
        record.verification_status ||
        record.status
      );

      const sourceType = normalizeText(
        record.source_type
      );

      const verified =
        record.verified === true ||
        verificationStatus === "VERIFIED";

      const selfReported =
        record.self_reported === true ||
        sourceType === "SELF_REPORTED";

      const stale =
        record.stale === true ||
        verificationStatus === "STALE";

      const conflict =
        record.conflict === true ||
        verificationStatus === "CONFLICT";

      let confidence = 70;

      if (verified) {
        confidence = 100;
      }

      if (selfReported) {
        confidence = Math.min(confidence, 55);
        flags.push("SELF_REPORTED_EVIDENCE");
      }

      if (stale) {
        confidence = Math.min(confidence, 45);
        flags.push("STALE_EVIDENCE");
      }

      if (conflict) {
        confidence = Math.min(confidence, 25);
        flags.push("SOURCE_EVIDENCE_CONFLICT");
      }

      totalConfidence += confidence;
    }

    if (!recordCount) {
      return {
        confidence: 50,
        flags: ["UNVERIFIED"]
      };
    }

    const confidence = Math.round(
      clamp(totalConfidence / recordCount)
    );

    if (confidence < 60) {
      flags.push("LOW_CONFIDENCE");
    }

    if (!flags.length) {
      flags.push("CONFIDENCE_SUPPORTED");
    }

    return {
      confidence,
      flags: [...new Set(flags)]
    };
  }

  function evaluate(input, context = {}) {
    try {
      lastError = null;

      if (!validateWeights()) {
        return failClosed(
          input,
          "MATRIX_CONTRACT_INVALID",
          ["WEIGHTS_INVALID"],
          "ATHLETIC_MATRIX weights do not total 100."
        );
      }

      const authorityValidation =
        validateAuthority(context);

      if (!authorityValidation.ok) {
        return failClosed(
          input,
          authorityValidation.status,
          ["AUTHORITY_INVALID"],
          authorityValidation.reason
        );
      }

      const registryValidation =
        validateRegistry(context);

      if (!registryValidation.ok) {
        return failClosed(
          input,
          registryValidation.status,
          ["REGISTRY_INVALID"],
          registryValidation.reason
        );
      }

      const missingRequired =
        validateRequiredEvidence(input);

      if (missingRequired.length) {
        return failClosed(
          input,
          "INSUFFICIENT_EVIDENCE",
          ["REQUIRED_EVIDENCE_MISSING"],
          `Required athletic evidence unavailable: ${missingRequired.join(", ")}.`,
          missingRequired
        );
      }

      const sport =
        normalizeText(input.sport);

      const position =
        normalizeText(input.position);

      const benchmarkAuthority =
        resolveBenchmarkAuthority(context);

      if (!benchmarkAuthority) {
        return failClosed(
          input,
          "MATRIX_UNAVAILABLE",
          ["BENCHMARK_AUTHORITY_UNAVAILABLE"],
          "Sport/position benchmark authority is unavailable. ATHLETIC_MATRIX will not invent benchmark science."
        );
      }

      const benchmarkResult =
        executeBenchmarkAuthority(
          benchmarkAuthority,
          {
            athlete_id: input.athlete_id,
            snapshot_id: input.snapshot_id,

            sport,
            position,

            measurables: input.measurables,
            combine_results:
              input.combine_results ?? null,
            camp_results:
              input.camp_results ?? null,
            verified_testing:
              input.verified_testing ?? null,
            physical_profile:
              input.physical_profile ?? null,
            position_benchmarks:
              input.position_benchmarks ?? null
          }
        );

      if (
        !benchmarkResult ||
        benchmarkResult.status ===
          "INSUFFICIENT_EVIDENCE"
      ) {
        return failClosed(
          input,
          "INSUFFICIENT_EVIDENCE",
          ["BENCHMARK_EVIDENCE_INSUFFICIENT"],
          "The sport/position benchmark authority did not return sufficient governed athletic evidence."
        );
      }

      const components = {};
      const missingComponents = [];

      for (const key of Object.keys(WEIGHTS)) {
        const value =
          readComponent(
            benchmarkResult,
            key
          );

        if (value == null) {
          missingComponents.push(key);
        } else {
          components[key] = value;
        }
      }

      if (missingComponents.length) {
        return failClosed(
          input,
          "INSUFFICIENT_EVIDENCE",
          ["ATHLETIC_COMPONENTS_MISSING"],
          `ATHLETIC_MATRIX component determinations unavailable: ${missingComponents.join(", ")}.`,
          missingComponents
        );
      }

      const rawScore =
        Object.entries(WEIGHTS)
          .reduce(
            (sum, [key, weight]) =>
              sum +
              (
                components[key] *
                (weight / 100)
              ),
            0
          );

      const score =
        Math.round(
          (rawScore + Number.EPSILON) * 100
        ) / 100;

      const trust =
        determineConfidence(input);

      const evidenceUsed = [
        "sport",
        "position",
        "measurables",
        ...OPTIONAL_EVIDENCE.filter(
          (key) =>
            input[key] != null
        )
      ];

      const result = {
        athlete_id: input.athlete_id,
        snapshot_id: input.snapshot_id,

        matrix_key: MATRIX_KEY,
        matrix_version: MATRIX_VERSION,

        doctrine_version:
          input.doctrine_version ??
          registryValidation.entry
            ?.doctrine_version ??
          null,

        domain: MATRIX_DOMAIN,

        score,
        confidence: trust.confidence,

        evidence_used: evidenceUsed,
        missing_evidence: [],

        flags: trust.flags,

        explanation: {
          summary:
            "Athletic performance was evaluated against the governed sport/position benchmark authority. Verification affects confidence only and does not alter the physical meaning of the performance evidence.",

          components,

          weights: {
            ...WEIGHTS
          },

          performance_confidence_separation:
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
        ["UNHANDLED_MATRIX_ERROR"],
        String(
          error?.message ||
          error
        )
      );
    }
  }

  function getContract() {
    return {
      matrix_key: MATRIX_KEY,
      matrix_domain: MATRIX_DOMAIN,
      matrix_version: MATRIX_VERSION,
      stream_owner: STREAM_OWNER,
      output_type: OUTPUT_TYPE,

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

  function runHealthCheck(context = {}) {
    const registryValidation =
      validateRegistry(context);

    return {
      authority_loaded: true,

      matrix_key: MATRIX_KEY,
      matrix_version: MATRIX_VERSION,

      weights_total: weightTotal(),
      weights_valid: validateWeights(),

      registered:
        registryValidation.ok,

      registry_status:
        registryValidation.ok
          ? "OK"
          : registryValidation.status,

      benchmark_authority_available:
        Boolean(
          resolveBenchmarkAuthority(
            context
          )
        ),

      healthy:
        validateWeights() &&
        registryValidation.ok
    };
  }

  const api = Object.freeze({
    evaluate,
    getContract,
    getConfiguration,
    getLastResult,
    getLastError,
    runHealthCheck
  });

  root.STATScoreAthleticMatrix =
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
