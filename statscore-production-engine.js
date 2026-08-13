/*
=========================================================
STATS-CORE™
STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY

FILE:
statscore-production-engine.js

AUTHORITY:
PRODUCTION_INTERPRETATION_AUTHORITY

VERSION:
STATSCORE-PRODUCTION-ENGINE-V1

STREAM OWNER:
STATSCORE_STREAM_9

AUTHORITY TYPE:
DOMAIN_COMPONENT_INTERPRETATION

PURPOSE
---------------------------------------------------------
Interpret governed athlete production evidence and return
the normalized Production components required by:

statscore-production-matrix.js
        ↓
PRODUCTION_MATRIX
        ↓
Official PRODUCTION Domain Intelligence

THIS ENGINE DOES NOT:
- publish the official Production domain score;
- publish Composite STATScore™;
- manufacture missing production;
- convert missing production to zero;
- use Athletic measurables as Production;
- change production because evidence is verified;
- apply generic competition multipliers;
- render DOM;
- auto-execute on page load;
- create pathway/recruiting projections.

CONSTITUTIONAL DOCTRINE
---------------------------------------------------------
PRODUCTION FACT
≠
PRODUCTION INTERPRETATION
≠
VERIFICATION
≠
COMPETITION CONTEXT
≠
ATHLETIC ABILITY
≠
PRODUCTION DOMAIN SCORE

Verification changes confidence in a production fact.

Verification does not change the production fact.

Competition Intelligence may contextualize Production.

Competition Intelligence shall not multiply unrelated
athlete scores.

Missing Authority ≠ Permission to Reconstruct Authority.

Missing Production ≠ Zero Production.

Load Authority ≠ Execute Authority.
=========================================================
*/

(function (root) {
  "use strict";

  /*
  =======================================================
  AUTHORITY IDENTITY
  =======================================================
  */

  const ENGINE_ID =
    "statscore-production-engine";

  const VERSION =
    "STATSCORE-PRODUCTION-ENGINE-V1";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const AUTHORITY_KEY =
    "PRODUCTION_INTERPRETATION_AUTHORITY";

  const AUTHORITY_TYPE =
    "DOMAIN_COMPONENT_INTERPRETATION";

  /*
  =======================================================
  REQUIRED OUTPUT COMPONENTS
  -------------------------------------------------------
  These names match the canonical PRODUCTION_MATRIX.
  =======================================================
  */

  const REQUIRED_COMPONENTS =
    Object.freeze([
      "verified_production",
      "sustained_production",
      "position_output",
      "competition_context",
      "production_consistency"
    ]);

  /*
  =======================================================
  STATUS
  =======================================================
  */

  const STATUS =
    Object.freeze({

      INTERPRETED:
        "INTERPRETED",

      PARTIAL:
        "PARTIAL",

      INSUFFICIENT_EVIDENCE:
        "INSUFFICIENT_EVIDENCE",

      SPORT_AUTHORITY_UNAVAILABLE:
        "SPORT_AUTHORITY_UNAVAILABLE",

      COMPETITION_AUTHORITY_UNAVAILABLE:
        "COMPETITION_AUTHORITY_UNAVAILABLE",

      AUTHORITY_UNAUTHORIZED:
        "AUTHORITY_UNAUTHORIZED",

      CONTRACT_INVALID:
        "CONTRACT_INVALID"

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
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
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

  function unique(
    values
  ) {
    return [
      ...new Set(
        values.filter(
          Boolean
        )
      )
    ];
  }

  /*
  =======================================================
  FAIL-CLOSED RESULT
  =======================================================
  */

  function failClosed(
    input,
    status,
    explanation,
    flags = [],
    missingEvidence = []
  ) {
    const result = {

      ok:
        false,

      authority:
        AUTHORITY_KEY,

      authority_type:
        AUTHORITY_TYPE,

      engine_id:
        ENGINE_ID,

      engine_version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      athlete_id:
        input?.athlete_id ??
        null,

      snapshot_id:
        input?.snapshot_id ??
        null,

      sport:
        normalizeText(
          input?.sport
        ) ||
        null,

      position:
        normalizeText(
          input?.position
        ) ||
        null,

      components:
        {},

      component_scores:
        {},

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

      status,

      generated_at:
        now()

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
  INPUT VALIDATION
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

  function validateInput(
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
  AUTHORITY VALIDATION
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
          STATUS
            .AUTHORITY_UNAUTHORIZED,

        reason:
          "Production Interpretation Authority may only execute under Stream 9 authority."

      };
    }

    return {
      ok:
        true
    };
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

    ].filter(
      (
        record
      ) =>
        record != null
    );
  }

  /*
  =======================================================
  VERIFICATION / PROVENANCE READING
  -------------------------------------------------------
  This engine consumes verification facts.

  It does not create Verification authority.
  =======================================================
  */

  function evidenceStanding(
    record
  ) {
    if (
      !record ||
      typeof record !==
        "object"
    ) {
      return {

        verified:
          false,

        official_source:
          false,

        self_reported:
          false,

        stale:
          false,

        conflict:
          false

      };
    }

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

    return {

      verified:
        record.verified ===
          true ||
        status ===
          "VERIFIED",

      official_source:
        [
          "OFFICIAL_SOURCE",
          "LEAGUE_SOURCE",
          "SCHOOL_SOURCE",
          "OFFICIAL_STAT_SOURCE"
        ].includes(
          sourceType
        ),

      self_reported:
        record.self_reported ===
          true ||
        sourceType ===
          "SELF_REPORTED",

      stale:
        record.stale ===
          true ||
        status ===
          "STALE",

      conflict:
        record.conflict ===
          true ||
        status ===
          "CONFLICT" ||
        status ===
          "DISPUTED"

    };
  }

  /*
  =======================================================
  GOVERNED COMPONENT PAYLOAD READING
  -------------------------------------------------------
  Sport-specific Production science may already have
  produced normalized component determinations.

  This coordinator may consume those values.

  It shall not guess them.
  =======================================================
  */

  function extractDeclaredComponents(
    input
  ) {
    const sources = [

      input.production_components,

      input.component_scores,

      input.normalized_production,

      input.production_interpretation

    ];

    const output =
      {};

    for (
      const source of sources
    ) {
      if (
        !source ||
        typeof source !==
          "object"
      ) {
        continue;
      }

      for (
        const key of REQUIRED_COMPONENTS
      ) {
        if (
          output[key] != null
        ) {
          continue;
        }

        const value =
          source[key];

        if (
          isFiniteNumber(
            value
          )
        ) {
          output[key] =
            clamp(
              value
            );
        }
      }
    }

    return output;
  }

  /*
  =======================================================
  SPORT-SPECIFIC PRODUCTION AUTHORITY
  -------------------------------------------------------
  Production normalization is inherently sport/position
  specific.

  This engine coordinates governed sport Production
  authority.

  It does not make Football statistics equivalent to
  Basketball, Baseball, or Track statistics.
  =======================================================
  */

  function resolveSportProductionAuthority(
    sport,
    context = {}
  ) {
    const explicit =
      context
        ?.sport_production_authorities
        ?.[sport];

    if (explicit) {
      return explicit;
    }

    if (
      context
        .sport_production_authority
    ) {
      return (
        context
          .sport_production_authority
      );
    }

    switch (
      sport
    ) {

      case "FOOTBALL":
        return (
          root
            .STATScoreFootballProductionAuthority ||
          root
            .STATScore
            ?.FootballProductionAuthority ||
          null
        );

      case "BASKETBALL":
        return (
          root
            .STATScoreBasketballProductionAuthority ||
          root
            .STATScore
            ?.BasketballProductionAuthority ||
          null
        );

      case "BASEBALL":
        return (
          root
            .STATScoreBaseballProductionAuthority ||
          root
            .STATScore
            ?.BaseballProductionAuthority ||
          null
        );

      case "TRACK":
        return (
          root
            .STATScoreTrackProductionAuthority ||
          root
            .STATScore
            ?.TrackProductionAuthority ||
          null
        );

      default:
        return null;

    }
  }

  function executeSportProductionAuthority(
    authority,
    payload
  ) {
    if (!authority) {
      return null;
    }

    const methods = [

      "evaluateProductionComponents",

      "evaluateProductionProfile",

      "interpretProduction",

      "evaluate",

      "resolve"

    ];

    for (
      const method of methods
    ) {
      if (
        typeof authority[
          method
        ] !==
          "function"
      ) {
        continue;
      }

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
          "Production Interpretation Authority requires a synchronous sport-production authority result at this boundary."
        );
      }

      return result;
    }

    return null;
  }

  /*
  =======================================================
  COMPETITION CONTEXT
  -------------------------------------------------------
  Competition context is consumed as a governed component.

  This engine does not apply a generic multiplier.
  =======================================================
  */

  function resolveCompetitionContext(
    input,
    context = {}
  ) {
    const candidates = [

      input
        ?.competition_context
        ?.score,

      input
        ?.competition_context
        ?.competition_score,

      input
        ?.competition_context
        ?.component_score,

      input
        ?.competition_context_score,

      context
        ?.competition_context
        ?.score,

      context
        ?.competition_result
        ?.score

    ];

    for (
      const candidate of candidates
    ) {
      const number =
        Number(
          candidate
        );

      if (
        Number.isFinite(
          number
        )
      ) {
        return clamp(
          number
        );
      }
    }

    const matrix =
      root
        .STATScoreCompetitionMatrix ||
      root
        .STATScore
        ?.Matrices
        ?.COMPETITION_MATRIX ||
      null;

    /*
    -----------------------------------------------------
    Do not invoke Competition Matrix recursively without
    complete governed input. Only consume an already
    available result if supplied.
    -----------------------------------------------------
    */

    if (
      matrix &&
      typeof matrix.getLastResult ===
        "function"
    ) {
      const result =
        matrix.getLastResult();

      if (
        result &&
        result.athlete_id ===
          input?.athlete_id &&
        result.snapshot_id ===
          input?.snapshot_id &&
        Number.isFinite(
          Number(
            result.score
          )
        )
      ) {
        return clamp(
          result.score
        );
      }
    }

    return null;
  }

  /*
  =======================================================
  COMPONENT EXTRACTION FROM SPORT AUTHORITY
  =======================================================
  */

  function extractAuthorityComponents(
    result
  ) {
    if (
      !result ||
      typeof result !==
        "object"
    ) {
      return {};
    }

    const sources = [

      result.components,

      result.component_scores,

      result.scores,

      result

    ];

    const output =
      {};

    for (
      const source of sources
    ) {
      if (
        !source ||
        typeof source !==
          "object"
      ) {
        continue;
      }

      for (
        const key of REQUIRED_COMPONENTS
      ) {
        if (
          output[key] != null
        ) {
          continue;
        }

        const value =
          source[key];

        if (
          isFiniteNumber(
            value
          )
        ) {
          output[key] =
            clamp(
              value
            );
        }
      }
    }

    return output;
  }

  /*
  =======================================================
  VERIFIED PRODUCTION SUPPORT
  -------------------------------------------------------
  This function does NOT alter production statistics.

  It may provide a normalized support component only from
  explicit verification standing of production records.
  =======================================================
  */

  function deriveVerificationSupport(
    records
  ) {
    const structured =
      records.filter(
        (
          record
        ) =>
          record &&
          typeof record ===
            "object"
      );

    if (
      !structured.length
    ) {
      return null;
    }

    let supported =
      0;

    let observed =
      0;

    for (
      const record of structured
    ) {
      const standing =
        evidenceStanding(
          record
        );

      observed +=
        1;

      /*
      ---------------------------------------------------
      These values describe trust quality only.

      They do NOT modify any production statistic.
      ---------------------------------------------------
      */

      let trust =
        70;

      if (
        standing.verified ||
        standing.official_source
      ) {
        trust =
          100;
      }

      if (
        standing.self_reported
      ) {
        trust =
          Math.min(
            trust,
            55
          );
      }

      if (
        standing.stale
      ) {
        trust =
          Math.min(
            trust,
            45
          );
      }

      if (
        standing.conflict
      ) {
        trust =
          Math.min(
            trust,
            25
          );
      }

      supported +=
        trust;
    }

    if (
      !observed
    ) {
      return null;
    }

    return clamp(
      supported /
      observed
    );
  }

  /*
  =======================================================
  EVIDENCE CONFIDENCE
  =======================================================
  */

  function determineEvidenceConfidence(
    records
  ) {
    const verificationSupport =
      deriveVerificationSupport(
        records
      );

    if (
      verificationSupport ==
        null
    ) {
      return {

        confidence:
          0,

        flags: [
          "PRODUCTION_EVIDENCE_UNVERIFIED"
        ]

      };
    }

    const flags =
      [];

    for (
      const record of records
    ) {
      const standing =
        evidenceStanding(
          record
        );

      if (
        standing.self_reported
      ) {
        flags.push(
          "SELF_REPORTED_EVIDENCE"
        );
      }

      if (
        standing.stale
      ) {
        flags.push(
          "STALE_EVIDENCE"
        );
      }

      if (
        standing.conflict
      ) {
        flags.push(
          "SOURCE_EVIDENCE_CONFLICT"
        );
      }
    }

    if (
      verificationSupport <
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

      confidence:
        Math.round(
          verificationSupport
        ),

      flags:
        unique(
          flags
        )

    };
  }

  /*
  =======================================================
  PRIMARY PRODUCTION INTERPRETATION
  =======================================================
  */

  function evaluateProductionComponents(
    input = {},
    context = {}
  ) {
    try {

      lastError =
        null;

      /*
      ---------------------------------------------------
      AUTHORITY
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

          authorityValidation.reason,

          [
            "STREAM_9_AUTHORITY_REQUIRED"
          ]

        );
      }

      /*
      ---------------------------------------------------
      REQUIRED EVIDENCE
      ---------------------------------------------------
      */

      const missing =
        validateInput(
          input
        );

      if (
        missing.length
      ) {
        return failClosed(

          input,

          STATUS
            .INSUFFICIENT_EVIDENCE,

          `Required production evidence unavailable: ${missing.join(", ")}.`,

          [
            "REQUIRED_PRODUCTION_EVIDENCE_MISSING"
          ],

          missing

        );
      }

      const sport =
        normalizeText(
          input.sport
        );

      const position =
        normalizeText(
          input.position
        );

      const records =
        collectEvidenceRecords(
          input
        );

      /*
      ---------------------------------------------------
      DECLARED GOVERNED COMPONENTS
      ---------------------------------------------------
      */

      const declaredComponents =
        extractDeclaredComponents(
          input
        );

      /*
      ---------------------------------------------------
      SPORT AUTHORITY
      ---------------------------------------------------
      */

      const sportAuthority =
        resolveSportProductionAuthority(
          sport,
          context
        );

      let sportResult =
        null;

      let authorityComponents =
        {};

      if (
        sportAuthority
      ) {
        sportResult =
          executeSportProductionAuthority(

            sportAuthority,

            {

              athlete_id:
                input.athlete_id,

              snapshot_id:
                input.snapshot_id,

              sport,

              position,

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

        authorityComponents =
          extractAuthorityComponents(
            sportResult
          );
      }

      /*
      ---------------------------------------------------
      COMPONENT MERGE

      Priority:

      1. governed sport authority
      2. explicitly supplied governed component payload
      3. limited non-performance contextual support

      No guessed athlete performance values.
      ---------------------------------------------------
      */

      const components = {

        ...declaredComponents,

        ...authorityComponents

      };

      /*
      ---------------------------------------------------
      VERIFIED PRODUCTION

      Verification support may populate this component
      because the component itself represents evidence
      standing, not underlying statistical production.
      ---------------------------------------------------
      */

      if (
        components
          .verified_production ==
        null
      ) {
        const verifiedSupport =
          deriveVerificationSupport(
            records
          );

        if (
          verifiedSupport !=
          null
        ) {
          components
            .verified_production =
            verifiedSupport;
        }
      }

      /*
      ---------------------------------------------------
      COMPETITION CONTEXT

      Consume governed Competition Intelligence when
      available.

      Never multiply Production.
      ---------------------------------------------------
      */

      if (
        components
          .competition_context ==
        null
      ) {
        const competition =
          resolveCompetitionContext(
            input,
            context
          );

        if (
          competition !=
          null
        ) {
          components
            .competition_context =
            competition;
        }
      }

      /*
      ---------------------------------------------------
      COMPONENT COMPLETENESS
      ---------------------------------------------------
      */

      const missingComponents =
        REQUIRED_COMPONENTS.filter(
          (
            key
          ) =>
            !isFiniteNumber(
              components[
                key
              ]
            )
        );

      if (
        missingComponents.length
      ) {

        const flags = [
          "PRODUCTION_COMPONENTS_INCOMPLETE"
        ];

        if (
          !sportAuthority
        ) {
          flags.push(
            "SPORT_PRODUCTION_AUTHORITY_UNAVAILABLE"
          );
        }

        return failClosed(

          input,

          STATUS
            .INSUFFICIENT_EVIDENCE,

          `Governed Production component determinations unavailable: ${missingComponents.join(", ")}.`,

          flags,

          missingComponents

        );
      }

      /*
      ---------------------------------------------------
      NORMALIZE COMPONENTS
      ---------------------------------------------------
      */

      const normalizedComponents =
        {};

      for (
        const key of REQUIRED_COMPONENTS
      ) {
        normalizedComponents[
          key
        ] =
          clamp(
            components[
              key
            ]
          );
      }

      /*
      ---------------------------------------------------
      CONFIDENCE
      ---------------------------------------------------
      */

      const trust =
        determineEvidenceConfidence(
          records
        );

      const evidenceUsed = [
        "production_records"
      ];

      const optionalKeys = [

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

      ];

      for (
        const key of optionalKeys
      ) {
        if (
          input[
            key
          ] != null
        ) {
          evidenceUsed.push(
            key
          );
        }
      }

      /*
      ---------------------------------------------------
      RESULT
      ---------------------------------------------------
      */

      const result = {

        ok:
          true,

        authority:
          AUTHORITY_KEY,

        authority_type:
          AUTHORITY_TYPE,

        engine_id:
          ENGINE_ID,

        engine_version:
          VERSION,

        stream_owner:
          STREAM_OWNER,

        athlete_id:
          input.athlete_id,

        snapshot_id:
          input.snapshot_id,

        sport,

        position,

        components:
          normalizedComponents,

        component_scores:
          normalizedComponents,

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
            "Production evidence was interpreted into the governed component contract required by PRODUCTION_MATRIX. This authority does not publish the official Production domain score.",

          component_contract:
            [
              ...REQUIRED_COMPONENTS
            ],

          sport_authority_used:
            Boolean(
              sportAuthority
            ),

          sport_authority:
            sportAuthority
              ? (
                  sportResult
                    ?.authority ||
                  sportResult
                    ?.engine_id ||
                  `${sport}_PRODUCTION_AUTHORITY`
                )
              : null,

          competition_context_consumed:
            normalizedComponents
              .competition_context !=
            null,

          verification_changes_production_facts:
            false,

          competition_multiplier_used:
            false,

          athletic_measurables_create_production:
            false,

          official_domain_score_published:
            false

        },

        status:
          STATUS
            .INTERPRETED,

        generated_at:
          now()

      };

      lastResult =
        result;

      return result;

    } catch (
      error
    ) {
      return failClosed(

        input,

        STATUS
          .CONTRACT_INVALID,

        String(
          error?.message ||
          error
        ),

        [
          "PRODUCTION_INTERPRETATION_ERROR"
        ]

      );
    }
  }

  /*
  =======================================================
  COMPATIBILITY ENTRYPOINTS
  -------------------------------------------------------
  The canonical method is:

  evaluateProductionComponents()

  Transitional names forward to the SAME authority.
  =======================================================
  */

  function evaluateProductionProfile(
    input,
    context = {}
  ) {
    return evaluateProductionComponents(
      input,
      context
    );
  }

  function interpretProduction(
    input,
    context = {}
  ) {
    return evaluateProductionComponents(
      input,
      context
    );
  }

  function evaluate(
    input,
    context = {}
  ) {
    return evaluateProductionComponents(
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

      authority:
        AUTHORITY_KEY,

      authority_type:
        AUTHORITY_TYPE,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      downstream_authority:
        "PRODUCTION_MATRIX",

      required_components:
        [
          ...REQUIRED_COMPONENTS
        ],

      official_domain_score_authority:
        false,

      composite_authority:
        false,

      athletic_authority:
        false,

      verification_authority:
        false,

      pathway_authority:
        false,

      presentation_authority:
        false,

      runtime_authority:
        false,

      generic_score_multiplier:
        false,

      missing_production_becomes_zero:
        false,

      auto_execution:
        false

    };
  }

  /*
  =======================================================
  HEALTH CHECK
  =======================================================
  */

  function runHealthCheck(
    context = {}
  ) {
    const sportAuthorities = {

      FOOTBALL:
        Boolean(
          resolveSportProductionAuthority(
            "FOOTBALL",
            context
          )
        ),

      BASKETBALL:
        Boolean(
          resolveSportProductionAuthority(
            "BASKETBALL",
            context
          )
        ),

      BASEBALL:
        Boolean(
          resolveSportProductionAuthority(
            "BASEBALL",
            context
          )
        ),

      TRACK:
        Boolean(
          resolveSportProductionAuthority(
            "TRACK",
            context
          )
        )

    };

    return {

      authority_loaded:
        true,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      required_components:
        [
          ...REQUIRED_COMPONENTS
        ],

      sport_authorities:
        sportAuthorities,

      production_matrix_available:
        Boolean(
          root
            .STATScoreProductionMatrix ||
          root
            .STATScore
            ?.Matrices
            ?.PRODUCTION_MATRIX
        ),

      competition_matrix_available:
        Boolean(
          root
            .STATScoreCompetitionMatrix ||
          root
            .STATScore
            ?.Matrices
            ?.COMPETITION_MATRIX
        ),

      publishes_domain_score:
        false,

      generic_multiplier_enabled:
        false,

      dom_rendering_enabled:
        false,

      auto_execution_enabled:
        false,

      missing_production_becomes_zero:
        false,

      healthy:
        true

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
  PUBLIC AUTHORITY
  =======================================================
  */

  const api =
    Object.freeze({

      authority:
        AUTHORITY_KEY,

      authority_type:
        AUTHORITY_TYPE,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      status:
        "ACTIVE",

      required_components:
        REQUIRED_COMPONENTS,

      evaluateProductionComponents,

      evaluateProductionProfile,

      interpretProduction,

      evaluate,

      getContract,

      runHealthCheck,

      getLastResult,

      getLastError

    });

  /*
  =======================================================
  CANONICAL GLOBALS
  =======================================================
  */

  root.STATScoreProductionEngine =
    api;

  root.STATScore =
    root.STATScore ||
    {};

  root.STATScore.ProductionEngine =
    api;

  root.STATScore.ProductionAuthority =
    api;

  /*
  =======================================================
  LOAD RECEIPT
  -------------------------------------------------------
  Loading registers authority only.

  No athlete is interpreted automatically.
  No score is published.
  No DOM is touched.
  =======================================================
  */

  console.info(
    "[STATS-CORE][STREAM 9] Production Interpretation Authority loaded:",
    VERSION
  );

})(
  typeof window !==
    "undefined"
    ? window
    : globalThis
); 
