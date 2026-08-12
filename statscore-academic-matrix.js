/*
=========================================================
STATS-CORE™
STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY

FILE:
statscore-academic-matrix.js

AUTHORITY:
ACADEMIC_MATRIX

MATRIX DOMAIN:
ACADEMIC

VERSION:
1.0.0

STREAM OWNER:
STATSCORE_STREAM_9

OUTPUT TYPE:
DOMAIN_SCORE

CONSTITUTIONAL DOCTRINE
---------------------------------------------------------
ACADEMIC PERFORMANCE
≠
ACADEMIC VERIFICATION
≠
ELIGIBILITY DETERMINATION

Academic performance describes what the athlete has
demonstrated academically.

Verification describes how strongly the academic
evidence can be trusted.

Eligibility describes the athlete's governed eligibility
standing or alignment.

Verification may strengthen confidence in a GPA,
transcript, test score, or academic record.

Verification shall NEVER increase the underlying GPA,
test score, course completion, or academic achievement.

Missing academic evidence shall NEVER silently become
zero performance.

Example:

GPA: 3.10
Transcript verification: VERIFIED

The GPA remains 3.10.

Verification affects evidence confidence.

It does not manufacture a higher GPA.

Likewise:

Verified ineligible
≠
eligible

The verification confirms the condition.
It does not improve the condition.
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
    "ACADEMIC_MATRIX";

  const MATRIX_DOMAIN =
    "ACADEMIC";

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

  gpa_strength               35
  eligibility_alignment      30
  transcript_confidence      15
  test_score_support         10
  academic_trend             10
                            ---
                            100

  No replacement weights are authorized.
  =======================================================
  */

  const WEIGHTS =
    Object.freeze({
      gpa_strength: 35,
      eligibility_alignment: 30,
      transcript_confidence: 15,
      test_score_support: 10,
      academic_trend: 10
    });

  /*
  =======================================================
  EVIDENCE CONTRACT
  =======================================================
  */

  const REQUIRED_EVIDENCE =
    Object.freeze([
      "athlete_id",
      "snapshot_id",
      "gpa"
    ]);

  const OPTIONAL_EVIDENCE =
    Object.freeze([
      "eligibility_status",
      "transcript_status",
      "transcript_record",
      "test_scores",
      "academic_history",
      "academic_trend",
      "counselor_context"
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

  function normalizeKey(
    value
  ) {
    return String(
      value == null
        ? ""
        : value
    )
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        "_"
      );
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
        total + weight,
      0
    );
  }

  function validateWeights() {
    return (
      weightTotal() === 100
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

      score: null,

      confidence: 0,

      evidence_used: [],

      missing_evidence:
        missingEvidence,

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
          "ACADEMIC_MATRIX is not available from the Matrix Registry."
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
          ok: false,

          status:
            "MATRIX_CONTRACT_INVALID",

          reason:
            `ACADEMIC_MATRIX registry mismatch for ${field}.`
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
            ok: false,

            status:
              "MATRIX_CONTRACT_INVALID",

            reason:
              `ACADEMIC_MATRIX registry weight mismatch for ${key}.`
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
        ok: false,

        status:
          "MATRIX_UNAUTHORIZED",

        reason:
          "ACADEMIC_MATRIX may only execute under Stream 9 authority."
      };
    }

    return {
      ok: true
    };
  }

  /*
  =======================================================
  REQUIRED EVIDENCE
  =======================================================
  */

  function resolveGpa(
    input
  ) {
    const rawGpa =
      input?.gpa ??
      input?.academic_gpa;

    if (
      rawGpa == null ||
      rawGpa === ""
    ) {
      return null;
    }

    const gpa =
      Number(rawGpa);

    if (
      !Number.isFinite(
        gpa
      )
    ) {
      return null;
    }

    return gpa;
  }

  function validateRequiredEvidence(
    input
  ) {
    const missing = [];

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
      resolveGpa(
        input
      ) == null
    ) {
      missing.push(
        "gpa"
      );
    }

    return missing;
  }

  /*
  =======================================================
  ACADEMIC SCIENCE AUTHORITY
  =======================================================

  The matrix does not invent normalization science
  beyond the registered authority contract.

  A governed academic benchmark / rules authority may
  provide the five required component determinations.

  This preserves separation between:

  source academic facts
  academic policy / eligibility facts
  matrix interpretation
  =======================================================
  */

  function resolveAcademicAuthority(
    context = {}
  ) {
    return (
      context.academic_authority ||

      root.STATScoreAcademicAuthority ||

      root.STATScore
        ?.AcademicAuthority ||

      null
    );
  }

  function executeAcademicAuthority(
    authority,
    payload
  ) {
    if (!authority) {
      return null;
    }

    const methods = [
      "evaluateAcademicComponents",
      "evaluateAcademicProfile",
      "evaluate",
      "scoreAcademic",
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
            "ACADEMIC_MATRIX requires a synchronous academic-authority result at this boundary."
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

      result?.[key]
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
  CONFIDENCE DETERMINATION
  =======================================================

  Academic score and confidence remain separate.

  Verification strengthens trust in academic evidence.

  It does not inflate GPA or test performance.
  =======================================================
  */

  function collectEvidenceRecords(
    input
  ) {
    return [
      ...toArray(
        input.transcript_record
      ),

      ...toArray(
        input.test_scores
      ),

      ...toArray(
        input.academic_history
      ),

      ...toArray(
        input.counselor_context
      )
    ];
  }

  function determineConfidence(
    input
  ) {
    const records =
      collectEvidenceRecords(
        input
      );

    const transcriptStatus =
      normalizeKey(
        input.transcript_status ??
        input.transcriptStatus ??
        input.transcriptAvailable
      );

    const flags = [];

    let confidence = 65;

    if (
      [
        "available",
        "verified",
        "uploaded",
        "confirmed"
      ].includes(
        transcriptStatus
      )
    ) {
      confidence = 90;
    }

    if (
      [
        "pending",
        "in_progress"
      ].includes(
        transcriptStatus
      )
    ) {
      confidence = 65;

      flags.push(
        "TRANSCRIPT_PENDING"
      );
    }

    if (
      [
        "parent_permission_required",
        "permission_required"
      ].includes(
        transcriptStatus
      )
    ) {
      confidence = 50;

      flags.push(
        "PARENT_PERMISSION_REQUIRED"
      );
    }

    if (
      [
        "unavailable",
        "unknown",
        ""
      ].includes(
        transcriptStatus
      )
    ) {
      confidence = 45;

      flags.push(
        "TRANSCRIPT_UNVERIFIED"
      );
    }

    let observed = 0;
    let total = 0;

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

      observed += 1;

      const status =
        normalizeText(
          record.verification_status ||
          record.status
        );

      const verified =
        record.verified ===
          true ||
        status ===
          "VERIFIED";

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

      const selfReported =
        record.self_reported ===
          true ||
        normalizeText(
          record.source_type
        ) ===
          "SELF_REPORTED";

      let recordConfidence =
        70;

      if (verified) {
        recordConfidence =
          100;
      }

      if (
        selfReported
      ) {
        recordConfidence =
          Math.min(
            recordConfidence,
            55
          );

        flags.push(
          "SELF_REPORTED_EVIDENCE"
        );
      }

      if (stale) {
        recordConfidence =
          Math.min(
            recordConfidence,
            45
          );

        flags.push(
          "STALE_EVIDENCE"
        );
      }

      if (conflict) {
        recordConfidence =
          Math.min(
            recordConfidence,
            25
          );

        flags.push(
          "SOURCE_EVIDENCE_CONFLICT"
        );
      }

      total +=
        recordConfidence;
    }

    if (observed) {
      const recordAverage =
        total /
        observed;

      confidence =
        Math.round(
          (
            confidence +
            recordAverage
          ) /
          2
        );
    }

    confidence =
      Math.round(
        clamp(
          confidence
        )
      );

    if (
      confidence < 60
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
  OFFICIAL ACADEMIC MATRIX EVALUATION
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

          "ACADEMIC_MATRIX weights do not total 100."
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

          `Required academic evidence unavailable: ${missingRequired.join(", ")}.`,

          missingRequired
        );
      }

      const gpa =
        resolveGpa(
          input
        );

      /*
      ---------------------------------------------------
      ACADEMIC AUTHORITY
      ---------------------------------------------------
      */

      const academicAuthority =
        resolveAcademicAuthority(
          context
        );

      if (
        !academicAuthority
      ) {
        return failClosed(
          input,

          "MATRIX_UNAVAILABLE",

          [
            "ACADEMIC_AUTHORITY_UNAVAILABLE"
          ],

          "Academic benchmark / rules authority is unavailable. ACADEMIC_MATRIX will not invent academic normalization or eligibility science."
        );
      }

      const academicResult =
        executeAcademicAuthority(
          academicAuthority,
          {
            athlete_id:
              input.athlete_id,

            snapshot_id:
              input.snapshot_id,

            gpa,

            eligibility_status:
              input.eligibility_status ??
              input.eligibilityStatus ??
              input.ncaaEligibilityStatus ??
              null,

            transcript_status:
              input.transcript_status ??
              input.transcriptStatus ??
              input.transcriptAvailable ??
              null,

            transcript_record:
              input.transcript_record ??
              null,

            test_scores:
              input.test_scores ??
              null,

            academic_history:
              input.academic_history ??
              null,

            academic_trend:
              input.academic_trend ??
              null,

            counselor_context:
              input.counselor_context ??
              null
          }
        );

      if (
        !academicResult ||
        academicResult.status ===
          "INSUFFICIENT_EVIDENCE"
      ) {
        return failClosed(
          input,

          "INSUFFICIENT_EVIDENCE",

          [
            "ACADEMIC_EVIDENCE_INSUFFICIENT"
          ],

          "The Academic Authority did not return sufficient governed academic evidence for an official Academic score."
        );
      }

      /*
      ---------------------------------------------------
      COMPONENTS
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
            academicResult,
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
          ] = value;
        }
      }

      if (
        missingComponents.length
      ) {
        return failClosed(
          input,

          "INSUFFICIENT_EVIDENCE",

          [
            "ACADEMIC_COMPONENTS_MISSING"
          ],

          `ACADEMIC_MATRIX component determinations unavailable: ${missingComponents.join(", ")}.`,

          missingComponents
        );
      }

      /*
      ---------------------------------------------------
      ACADEMIC SCORE
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
        "gpa",

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

        missing_evidence: [],

        flags:
          trust.flags,

        explanation: {
          summary:
            "Academic Intelligence evaluates demonstrated academic standing independently from evidence verification and eligibility determination. Verification affects confidence in academic evidence but does not inflate academic performance.",

          source_facts: {
            gpa
          },

          components,

          weights: {
            ...WEIGHTS
          },

          academic_verification_separation:
            true,

          academic_eligibility_separation:
            true,

          verification_changes_gpa:
            false,

          eligibility_changes_gpa:
            false
        },

        generated_at:
          now(),

        status:
          trust.confidence < 60
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
  DOWNSTREAM ACADEMIC ROUTING INTELLIGENCE
  =======================================================

  The following preserves the useful routing doctrine
  contained in the legacy Academic Matrix.

  This is NOT the official Academic scoring authority.

  It consumes academic facts / governed Academic
  Intelligence and determines an academic pathway state.

  It shall not change the official Academic score.
  =======================================================
  */

  const GPA_BANDS =
    Object.freeze({

      elite: {
        min: 3.75,

        label:
          "Elite Academic Standing",

        tier:
          "ACADEMIC_ELITE",

        pathwayMeaning:
          "Strong fit for high-academic institutions and selective programs."
      },

      strong: {
        min: 3.25,

        label:
          "Strong Academic Standing",

        tier:
          "ACADEMIC_STRONG",

        pathwayMeaning:
          "Broad academic access with favorable eligibility posture."
      },

      stable: {
        min: 2.75,

        label:
          "Stable Academic Standing",

        tier:
          "ACADEMIC_STABLE",

        pathwayMeaning:
          "Recruitable academic position with normal monitoring."
      },

      watch: {
        min: 2.30,

        label:
          "Academic Watch",

        tier:
          "ACADEMIC_WATCH",

        pathwayMeaning:
          "Needs counselor tracking, eligibility review, and improvement plan."
      },

      recovery: {
        min: 0,

        label:
          "Academic Recovery Route",

        tier:
          "ACADEMIC_RECOVERY",

        pathwayMeaning:
          "Does not eliminate athlete. Routes to recovery, prep, JUCO, or bridge pathway."
      }
    });

  const ELIGIBILITY_STATUSES =
    Object.freeze({

      verified_track: {
        label:
          "Verified Track",

        risk:
          "LOW",

        meaning:
          "Academic pathway appears documented and eligibility-aligned."
      },

      on_track: {
        label:
          "On Track",

        risk:
          "LOW_MODERATE",

        meaning:
          "Athlete appears on track but still requires monitoring and documentation."
      },

      in_progress: {
        label:
          "In Progress",

        risk:
          "MODERATE",

        meaning:
          "Academic record is developing and requires counselor or guardian follow-up."
      },

      needs_review: {
        label:
          "Needs Review",

        risk:
          "HIGH",

        meaning:
          "Eligibility cannot be safely assumed and requires governed review."
      },

      not_started: {
        label:
          "Not Started",

        risk:
          "HIGH",

        meaning:
          "Eligibility pathway has not been established."
      },

      unknown: {
        label:
          "Unknown",

        risk:
          "UNKNOWN",

        meaning:
          "Insufficient eligibility evidence."
      }
    });

  const TRANSCRIPT_STATUSES =
    Object.freeze({

      available: {
        label:
          "Transcript Available",

        evidenceQuality:
          "HIGH"
      },

      pending: {
        label:
          "Transcript Pending",

        evidenceQuality:
          "MODERATE"
      },

      parent_permission_required: {
        label:
          "Parent Permission Required",

        evidenceQuality:
          "LOCKED"
      },

      unavailable: {
        label:
          "Transcript Unavailable",

        evidenceQuality:
          "LOW"
      },

      unknown: {
        label:
          "Transcript Unknown",

        evidenceQuality:
          "UNKNOWN"
      }
    });

  const COUNSELOR_STATUSES =
    Object.freeze({

      confirmed: {
        label:
          "Counselor Contact Confirmed",

        governanceStatus:
          "READY"
      },

      pending: {
        label:
          "Counselor Contact Pending",

        governanceStatus:
          "PENDING"
      },

      not_provided: {
        label:
          "Counselor Contact Not Provided",

        governanceStatus:
          "NEEDS_ACTION"
      },

      unknown: {
        label:
          "Counselor Contact Unknown",

        governanceStatus:
          "UNKNOWN"
      }
    });

  /*
  =======================================================
  GPA BAND
  =======================================================
  */

  function resolveGpaBand(
    gpa
  ) {
    if (
      gpa >=
      GPA_BANDS
        .elite
        .min
    ) {
      return (
        GPA_BANDS.elite
      );
    }

    if (
      gpa >=
      GPA_BANDS
        .strong
        .min
    ) {
      return (
        GPA_BANDS.strong
      );
    }

    if (
      gpa >=
      GPA_BANDS
        .stable
        .min
    ) {
      return (
        GPA_BANDS.stable
      );
    }

    if (
      gpa >=
      GPA_BANDS
        .watch
        .min
    ) {
      return (
        GPA_BANDS.watch
      );
    }

    return (
      GPA_BANDS.recovery
    );
  }

  /*
  =======================================================
  TRANSCRIPT STATE
  =======================================================
  */

  function resolveTranscriptStatus(
    value
  ) {
    const normalized =
      normalizeKey(
        value
      );

    if (
      [
        "yes",
        "available",
        "true",
        "uploaded",
        "verified"
      ].includes(
        normalized
      )
    ) {
      return (
        TRANSCRIPT_STATUSES
          .available
      );
    }

    if (
      [
        "pending",
        "in_progress"
      ].includes(
        normalized
      )
    ) {
      return (
        TRANSCRIPT_STATUSES
          .pending
      );
    }

    if (
      [
        "parent_permission_required",
        "permission_required"
      ].includes(
        normalized
      )
    ) {
      return (
        TRANSCRIPT_STATUSES
          .parent_permission_required
      );
    }

    if (
      [
        "no",
        "unavailable",
        "false"
      ].includes(
        normalized
      )
    ) {
      return (
        TRANSCRIPT_STATUSES
          .unavailable
      );
    }

    return (
      TRANSCRIPT_STATUSES
        .unknown
    );
  }

  /*
  =======================================================
  COUNSELOR STATE
  =======================================================
  */

  function resolveCounselorContact(
    value
  ) {
    const normalized =
      normalizeKey(
        value
      );

    if (
      [
        "yes",
        "confirmed",
        "true",
        "available"
      ].includes(
        normalized
      )
    ) {
      return (
        COUNSELOR_STATUSES
          .confirmed
      );
    }

    if (
      [
        "pending",
        "in_progress"
      ].includes(
        normalized
      )
    ) {
      return (
        COUNSELOR_STATUSES
          .pending
      );
    }

    if (
      [
        "no",
        "not_provided",
        "false"
      ].includes(
        normalized
      )
    ) {
      return (
        COUNSELOR_STATUSES
          .not_provided
      );
    }

    return (
      COUNSELOR_STATUSES
        .unknown
    );
  }

  /*
  =======================================================
  ACADEMIC ROUTE
  =======================================================
  */

  function resolveAcademicRoute({
    gpaBand,
    eligibility,
    transcript,
    counselor
  }) {

    if (
      gpaBand.tier ===
        "ACADEMIC_ELITE" ||
      gpaBand.tier ===
        "ACADEMIC_STRONG"
    ) {
      return {
        route:
          "HIGH_ACADEMIC_ROUTE",

        label:
          "High-Academic Program Route",

        meaning:
          "Athlete may be considered for academically selective programs when governed production, fit, and eligibility support that pathway."
      };
    }

    if (
      gpaBand.tier ===
        "ACADEMIC_STABLE" &&
      eligibility.risk !==
        "HIGH"
    ) {
      return {
        route:
          "STANDARD_ELIGIBILITY_ROUTE",

        label:
          "Standard Eligibility Route",

        meaning:
          "Athlete remains academically positioned for normal recruiting consideration with continued monitoring."
      };
    }

    if (
      gpaBand.tier ===
        "ACADEMIC_WATCH" ||
      eligibility.risk ===
        "HIGH" ||
      transcript
        .evidenceQuality ===
        "LOW" ||
      counselor
        .governanceStatus ===
        "NEEDS_ACTION"
    ) {
      return {
        route:
          "ACADEMIC_BRIDGE_ROUTE",

        label:
          "Academic Bridge / Counselor Review Route",

        meaning:
          "Athlete remains active but requires academic review, counselor support, evidence completion, or eligibility repair."
      };
    }

    return {
      route:
        "ACADEMIC_RECOVERY_ROUTE",

      label:
        "Academic Recovery / Prep / JUCO Route",

      meaning:
        "Athlete is not discarded. Governed pathway intelligence may route toward recovery, prep, JUCO, bridge, or another authorized alternative."
    };
  }

  /*
  =======================================================
  DOWNSTREAM ACADEMIC PROFILE / ROUTING HELPER
  =======================================================
  */

  function evaluateAcademicProfile(
    input = {}
  ) {
    const gpa =
      resolveGpa(
        input
      );

    /*
    -----------------------------------------------------
    CRITICAL NULL RULE
    -----------------------------------------------------

    Missing GPA is not 0.00.
    -----------------------------------------------------
    */

    if (
      gpa == null
    ) {
      return {
        status:
          "INSUFFICIENT_EVIDENCE",

        gpa: null,

        gpaBand: null,

        eligibility:
          ELIGIBILITY_STATUSES
            .unknown,

        transcript:
          resolveTranscriptStatus(
            input.transcript_status ??
            input.transcriptStatus ??
            input.transcriptAvailable
          ),

        counselor:
          resolveCounselorContact(
            input.counselor_contact ??
            input.counselorContact
          ),

        academicRoute: null,

        explainability: [
          "GPA evidence is unavailable.",
          "Academic pathway routing cannot treat missing GPA as 0.00.",
          "Additional academic evidence is required."
        ]
      };
    }

    const eligibilityRaw =
      normalizeKey(
        input.eligibility_status ??
        input.eligibilityStatus ??
        input.ncaaEligibilityStatus ??
        "unknown"
      );

    const transcriptRaw =
      input.transcript_status ??
      input.transcriptStatus ??
      input.transcriptAvailable ??
      "unknown";

    const counselorRaw =
      input.counselor_contact ??
      input.counselorContact ??
      "unknown";

    const gpaBand =
      resolveGpaBand(
        gpa
      );

    const eligibility =
      ELIGIBILITY_STATUSES[
        eligibilityRaw
      ] ||
      ELIGIBILITY_STATUSES
        .unknown;

    const transcript =
      resolveTranscriptStatus(
        transcriptRaw
      );

    const counselor =
      resolveCounselorContact(
        counselorRaw
      );

    const academicRoute =
      resolveAcademicRoute({
        gpaBand,
        eligibility,
        transcript,
        counselor
      });

    return {
      status:
        "ROUTED",

      engine:
        "Academic Routing Intelligence",

      gpa,

      gpaBand,

      eligibility,

      transcript,

      counselor,

      academicRoute,

      explainability: [
        `GPA evaluated at ${gpa}.`,

        `Academic tier: ${gpaBand.label}.`,

        `Eligibility status: ${eligibility.label} — ${eligibility.meaning}`,

        `Transcript status: ${transcript.label}.`,

        `Counselor status: ${counselor.label}.`,

        `Recommended academic route: ${academicRoute.label}.`,

        academicRoute.meaning,

        "Academic routing does not change the athlete's governed Academic score."
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

      academic_verification_separation:
        true,

      academic_eligibility_separation:
        true,

      routing_separation:
        true
    };
  }

  function getConfiguration() {
    return {
      ...getContract(),

      gpa_bands:
        GPA_BANDS,

      eligibility_statuses:
        ELIGIBILITY_STATUSES,

      transcript_statuses:
        TRANSCRIPT_STATUSES,

      counselor_statuses:
        COUNSELOR_STATUSES
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

    const academicAuthority =
      resolveAcademicAuthority(
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

      academic_authority_available:
        Boolean(
          academicAuthority
        ),

      missing_gpa_becomes_zero:
        false,

      academic_verification_separated:
        true,

      eligibility_separated_from_performance:
        true,

      pathway_routing_separated:
        true,

      healthy:
        validateWeights() &&
        registryValidation.ok &&
        Boolean(
          academicAuthority
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

      evaluateAcademicProfile,

      resolveGpaBand,

      resolveTranscriptStatus,

      resolveCounselorContact,

      resolveAcademicRoute,

      getContract,

      getConfiguration,

      getLastResult,

      getLastError,

      runHealthCheck
    });

  root.STATScoreAcademicMatrix =
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
  CONTROLLED LEGACY COMPATIBILITY
  =======================================================

  Existing consumers may temporarily reference:

  window.STATSCORE_ACADEMIC_MATRIX
  window.STATSCORE_EVALUATE_ACADEMICS

  These aliases point to the same authority.
  They do not establish competing scoring engines.
  =======================================================
  */

  root.STATSCORE_ACADEMIC_MATRIX =
    api;

  root.STATSCORE_EVALUATE_ACADEMICS =
    evaluateAcademicProfile;

  /*
  =======================================================
  LOAD RECEIPT
  =======================================================
  */

  console.info(
    "[STATS-CORE][STREAM 9] ACADEMIC_MATRIX v1.0.0 loaded."
  );

})(
  typeof window !==
    "undefined"
    ? window
    : globalThis
); 
