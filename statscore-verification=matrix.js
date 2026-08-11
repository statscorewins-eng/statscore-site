/**
* STATS-CORE™
* STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY
*
* File:
* statscore-verification-matrix.js
*
* Matrix:
* VERIFICATION_MATRIX
*
* Version:
* 1.0.0
*
* Constitutional Boundary:
*
* Stream 10 owns PHNX Professional Certification.
* Stream 9 consumes certification facts only as governed
* provenance / professional-authority evidence.
*
* Certification may affect:
* - provenance
* - verification standing
* - confidence
* - attribution
* - authorized scope
*
* Certification shall NEVER manufacture:
* - athletic ability
* - academic ability
* - production
* - speed
* - strength
* - athlete performance
*/

(function (root) {
  "use strict";

  const MATRIX_KEY =
    "VERIFICATION_MATRIX";

  const MATRIX_DOMAIN =
    "VERIFICATION";

  const MATRIX_VERSION =
    "1.0.0";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const OUTPUT_TYPE =
    "DOMAIN_SCORE";

  const WEIGHTS =
    Object.freeze({
      source_verification: 30,
      role_verification: 25,
      media_verification: 20,
      parent_guardian_approval: 15,
      conflict_resolution: 10
    });

  const REQUIRED_EVIDENCE =
    Object.freeze([
      "athlete_id",
      "snapshot_id",
      "verification_records"
    ]);

  const OPTIONAL_EVIDENCE =
    Object.freeze([
      "coach_verification",
      "parent_approval",
      "evaluator_verification",
      "media_verification",
      "stat_source_verification"
    ]);

  let lastResult = null;
  let lastError = null;

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

    if (!Number.isFinite(number)) {
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
          "VERIFICATION_MATRIX is not available from the Matrix Registry."
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
          String(expected)
      ) {
        return {
          ok: false,

          status:
            "MATRIX_CONTRACT_INVALID",

          reason:
            `VERIFICATION_MATRIX registry mismatch for ${field}.`
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
              `VERIFICATION_MATRIX registry weight mismatch for ${key}.`
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
          "VERIFICATION_MATRIX may only execute under Stream 9 authority."
      };
    }

    return {
      ok: true
    };
  }

  function validateRequiredEvidence(
    input
  ) {
    const missing = [];

    for (
      const field of REQUIRED_EVIDENCE
    ) {
      const value =
        input?.[field];

      if (
        value == null ||
        value === "" ||
        (
          field ===
            "verification_records" &&
          toArray(value).length === 0
        )
      ) {
        missing.push(field);
      }
    }

    return missing;
  }

  function getStatus(record) {
    return normalizeText(
      record?.verification_status ||
      record?.status
    );
  }

  function isVerified(record) {
    const status =
      getStatus(record);

    return (
      record?.verified === true ||
      status === "VERIFIED" ||
      status === "CONFIRMED" ||
      status === "APPROVED"
    );
  }

  function isConflict(record) {
    const status =
      getStatus(record);

    return (
      record?.conflict === true ||
      status === "CONFLICT" ||
      status === "CONFLICTING" ||
      status === "DISPUTED"
    );
  }

  function evaluateCertificationStanding(
    record
  ) {
    const attribution =
      record?.professional_attribution ||
      record?.certification ||
      record ||
      {};

    const professionalId =
      attribution.professional_id ??
      null;

    const certificationId =
      attribution.certification_id ??
      null;

    if (
      !professionalId &&
      !certificationId
    ) {
      return {
        present: false,

        professional_id:
          professionalId,

        certification_id:
          certificationId,

        role:
          attribution.role ??
          null,

        specialization:
          attribution.specialization ??
          null,

        certification_status:
          null,

        active: false,

        authorized: false
      };
    }

    const certificationStatus =
      normalizeText(
        attribution.certification_status ||
        attribution.credential_status
      );

    const occurredAt =
      record?.occurred_at
        ? new Date(
            record.occurred_at
          ).getTime()
        : Date.now();

    const effectiveAt =
      attribution.effective_at
        ? new Date(
            attribution.effective_at
          ).getTime()
        : null;

    const expiresAt =
      attribution.expires_at
        ? new Date(
            attribution.expires_at
          ).getTime()
        : null;

    const statusActive =
      certificationStatus ===
      "ACTIVE";

    const effectiveValid =
      effectiveAt == null ||
      occurredAt >= effectiveAt;

    const expirationValid =
      expiresAt == null ||
      occurredAt <= expiresAt;

    const scopeAuthorized =
      attribution.authorized_scope ===
        true ||
      attribution.scope_authorized ===
        true ||
      attribution.authorized_scope ==
        null;

    const active =
      statusActive &&
      effectiveValid &&
      expirationValid;

    return {
      present: true,

      professional_id:
        professionalId,

      certification_id:
        certificationId,

      role:
        attribution.role ??
        null,

      specialization:
        attribution.specialization ??
        null,

      certification_status:
        certificationStatus,

      active,

      authorized:
        active &&
        scopeAuthorized
    };
  }

  function percentage(
    records,
    predicate
  ) {
    if (!records.length) {
      return null;
    }

    const passed =
      records.filter(
        predicate
      ).length;

    return clamp(
      (
        passed /
        records.length
      ) * 100
    );
  }

  function resolveComponents(
    input
  ) {
    const verificationRecords =
      toArray(
        input.verification_records
      );

    const sourceRecords =
      verificationRecords.filter(
        (record) =>
          normalizeText(
            record.type ||
            record.category
          ).includes(
            "SOURCE"
          ) ||
          Boolean(
            record.source_record_id
          ) ||
          Boolean(
            record.evidence_id
          )
      );

    const roleRecords =
      verificationRecords.filter(
        (record) =>
          Boolean(
            record.professional_id
          ) ||
          Boolean(
            record.certification_id
          ) ||
          Boolean(
            record.professional_attribution
          )
      );

    const mediaRecords = [
      ...verificationRecords.filter(
        (record) =>
          normalizeText(
            record.type ||
            record.category
          ).includes(
            "MEDIA"
          )
      ),

      ...toArray(
        input.media_verification
      )
    ];

    const parentRecords = [
      ...verificationRecords.filter(
        (record) => {
          const type =
            normalizeText(
              record.type ||
              record.category
            );

          return (
            type.includes(
              "PARENT"
            ) ||
            type.includes(
              "GUARDIAN"
            )
          );
        }
      ),

      ...toArray(
        input.parent_approval
      )
    ];

    const conflictRecords =
      verificationRecords.filter(
        isConflict
      );

    const sourcePool =
      sourceRecords.length
        ? sourceRecords
        : verificationRecords;

    const sourceVerification =
      percentage(
        sourcePool,
        isVerified
      );

    const roleVerification =
      roleRecords.length
        ? percentage(
            roleRecords,
            (record) => {
              const standing =
                evaluateCertificationStanding(
                  record
                );

              return (
                isVerified(
                  record
                ) &&
                standing.authorized
              );
            }
          )
        : null;

    const mediaVerification =
      percentage(
        mediaRecords,
        isVerified
      );

    const parentGuardianApproval =
      percentage(
        parentRecords,
        (record) => {
          const status =
            getStatus(record);

          return (
            isVerified(
              record
            ) ||
            status ===
              "GRANTED"
          );
        }
      );

    const unresolvedConflicts =
      conflictRecords.filter(
        (record) =>
          !record.resolved &&
          getStatus(record) !==
            "RESOLVED"
      );

    const conflictResolution =
      verificationRecords.length
        ? clamp(
            100 -
              (
                unresolvedConflicts.length /
                verificationRecords.length
              ) *
                100
          )
        : null;

    return {
      source_verification:
        sourceVerification,

      role_verification:
        roleVerification,

      media_verification:
        mediaVerification,

      parent_guardian_approval:
        parentGuardianApproval,

      conflict_resolution:
        conflictResolution
    };
  }

  function evaluate(
    input,
    context = {}
  ) {
    try {
      lastError = null;

      if (
        !validateWeights()
      ) {
        return failClosed(
          input,
          "MATRIX_CONTRACT_INVALID",
          ["WEIGHTS_INVALID"],
          "VERIFICATION_MATRIX weights do not total 100."
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
          `Required verification evidence unavailable: ${missingRequired.join(", ")}.`,
          missingRequired
        );
      }

      const components =
        resolveComponents(
          input
        );

      const missingComponents =
        Object.keys(
          WEIGHTS
        ).filter(
          (key) =>
            typeof components[
              key
            ] !== "number" ||
            !Number.isFinite(
              components[
                key
              ]
            )
        );

      if (
        missingComponents.length
      ) {
        return failClosed(
          input,
          "INSUFFICIENT_EVIDENCE",
          [
            "VERIFICATION_COMPONENTS_MISSING"
          ],
          `Verification Matrix component determinations unavailable: ${missingComponents.join(", ")}.`,
          missingComponents
        );
      }

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

      const verificationRecords =
        toArray(
          input.verification_records
        );

      const certificationFacts =
        verificationRecords
          .map(
            evaluateCertificationStanding
          )
          .filter(
            (standing) =>
              standing.present
          );

      const flags = [];

      if (
        verificationRecords.some(
          isConflict
        )
      ) {
        flags.push(
          "SOURCE_EVIDENCE_CONFLICT"
        );
      }

      if (
        certificationFacts.some(
          (fact) =>
            !fact.active
        )
      ) {
        flags.push(
          "PROFESSIONAL_CREDENTIAL_INACTIVE"
        );
      }

      if (
        certificationFacts.some(
          (fact) =>
            fact.active &&
            !fact.authorized
        )
      ) {
        flags.push(
          "PROFESSIONAL_SCOPE_UNAUTHORIZED"
        );
      }

      if (
        certificationFacts.some(
          (fact) =>
            fact.authorized
        )
      ) {
        flags.push(
          "GOVERNED_PROFESSIONAL_ATTRIBUTION"
        );
      }

      const confidence =
        Math.round(
          clamp(score)
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

        confidence,

        evidence_used: [
          "verification_records",

          ...OPTIONAL_EVIDENCE.filter(
            (key) =>
              input[key] != null
          )
        ],

        missing_evidence: [],

        flags,

        explanation: {
          summary:
            "Verification Intelligence evaluates provenance, governed professional authority, evidence support, guardian approval, media support, and conflict resolution. PHNX certification affects authority and provenance only. It never alters athlete ability.",

          components,

          weights: {
            ...WEIGHTS
          },

          certification_separation:
            true,

          certification_facts_consumed:
            certificationFacts
        },

        generated_at: now(),

        status:
          score < 60
            ? "PENDING_VERIFICATION"
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
      },

      certification_boundary:
        "PHNX certification informs authority, provenance and verification standing. It never manufactures athlete ability."
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

      certification_boundary_preserved:
        true,

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

  root.STATScoreVerificationMatrix =
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
