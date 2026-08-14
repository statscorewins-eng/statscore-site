/*
=========================================================
STATS-CORE™
STREAM 9 — ENTERPRISE INTELLIGENCE AUTHORITY

FILE:
statscore-eligibility-engine.js

AUTHORITY:
ELIGIBILITY_INTELLIGENCE

DOMAIN:
ACADEMIC_ELIGIBILITY

VERSION:
2.0.0

STREAM OWNER:
STATSCORE_STREAM_9

OUTPUT TYPE:
ELIGIBILITY_INTELLIGENCE

CONSTITUTIONAL DOCTRINE
---------------------------------------------------------
ATHLETIC ABILITY
≠
ACADEMIC PERFORMANCE
≠
ELIGIBILITY
≠
PATHWAY PROJECTION

STATS-CORE does NOT replace:
- school grading systems;
- district SIS platforms;
- official transcripts;
- governing-body eligibility authorities;
- state/district eligibility authorities;
- counselors;
- NCAA / NAIA / NJCAA determinations.

The Eligibility Engine interprets governed eligibility
evidence and authorized eligibility rules.

It does NOT manufacture eligibility requirements.

It does NOT manufacture an Academic Score.

It does NOT modify Athletic Intelligence.

It does NOT manufacture Pathway recommendations.

LOCKED INVARIANTS
---------------------------------------------------------
Missing ≠ Zero

Unknown ≠ Failed

Reported ≠ Verified

Eligibility Evidence ≠ Eligibility Determination

Eligibility Constraint ≠ Athlete Ability

Eligibility Risk ≠ Athletic Score

Missing Authority ≠ Permission to Reconstruct Authority

One Governing Authority
≠
Another Governing Authority

NCAA ≠ NAIA ≠ NJCAA ≠ STATE ≠ DISTRICT

Pathway Intelligence consumes eligibility constraints.

Eligibility Intelligence does not manufacture pathway
recommendations.

An athlete may possess high-level athletic ability while
simultaneously having unresolved or adverse eligibility
conditions.

Eligibility shall NEVER lower or rewrite Athletic
Intelligence.
=========================================================
*/

(function (root) {
  "use strict";

  /*
  =======================================================
  ENGINE IDENTITY
  =======================================================
  */

  const ENGINE_ID =
    "statscore-eligibility-engine";

  const AUTHORITY =
    "ELIGIBILITY_INTELLIGENCE";

  const DOMAIN =
    "ACADEMIC_ELIGIBILITY";

  const VERSION =
    "2.0.0";

  const STREAM_OWNER =
    "STATSCORE_STREAM_9";

  const OUTPUT_TYPE =
    "ELIGIBILITY_INTELLIGENCE";

  /*
  =======================================================
  STATUS CONTRACT
  =======================================================
  */

  const STATUS =
    Object.freeze({
      CLEAR:
        "CLEAR",

      MONITOR:
        "MONITOR",

      REVIEW_REQUIRED:
        "REVIEW_REQUIRED",

      CONDITION_NOT_MET:
        "CONDITION_NOT_MET",

      INSUFFICIENT_EVIDENCE:
        "INSUFFICIENT_EVIDENCE",

      DETERMINATION_BLOCKED:
        "DETERMINATION_BLOCKED",

      AUTHORITY_UNAVAILABLE:
        "AUTHORITY_UNAVAILABLE",

      RULESET_UNAVAILABLE:
        "RULESET_UNAVAILABLE",

      SOURCE_EVIDENCE_CONFLICT:
        "SOURCE_EVIDENCE_CONFLICT",

      STALE_EVIDENCE:
        "STALE_EVIDENCE",

      UNVERIFIED:
        "UNVERIFIED",

      INVALID_INPUT:
        "INVALID_INPUT"
    });

  /*
  =======================================================
  PORTABILITY CONTRACT
  =======================================================
  */

  const PORTABILITY_STATUS =
    Object.freeze({
      PORTABLE:
        "PORTABLE",

      CONDITIONALLY_PORTABLE:
        "CONDITIONALLY_PORTABLE",

      REVIEW_REQUIRED:
        "REVIEW_REQUIRED",

      NOT_DETERMINED:
        "NOT_DETERMINED",

      DETERMINATION_BLOCKED:
        "DETERMINATION_BLOCKED"
    });

  /*
  =======================================================
  GOVERNING AUTHORITY TYPES
  -------------------------------------------------------
  These authorities remain constitutionally separate.
  =======================================================
  */

  const GOVERNING_AUTHORITIES =
    Object.freeze([
      "NCAA",
      "NAIA",
      "NJCAA",
      "STATE",
      "DISTRICT",
      "SCHOOL",
      "OTHER"
    ]);

  /*
  =======================================================
  EVIDENCE STATES
  =======================================================
  */

  const EVIDENCE_STATUS =
    Object.freeze({
      VERIFIED:
        "VERIFIED",

      REPORTED:
        "REPORTED",

      UNVERIFIED:
        "UNVERIFIED",

      MISSING:
        "MISSING",

      STALE:
        "STALE",

      CONFLICT:
        "CONFLICT",

      UNKNOWN:
        "UNKNOWN"
    });

  /*
  =======================================================
  INTERNAL STATE
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

  function normalizeText(value) {
    return String(
      value == null
        ? ""
        : value
    )
      .trim()
      .toUpperCase();
  }

  function nullableText(value) {
    if (
      value == null ||
      String(value).trim() ===
        ""
    ) {
      return null;
    }

    return String(value)
      .trim();
  }

  function nullableNumber(value) {
    if (
      value == null ||
      value ===
        ""
    ) {
      return null;
    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : null;
  }

  function nullableBoolean(value) {
    if (
      value === true ||
      value === false
    ) {
      return value;
    }

    return null;
  }

  function toArray(value) {
    if (
      Array.isArray(value)
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

  function unique(values) {
    return [
      ...new Set(
        values.filter(
          Boolean
        )
      )
    ];
  }

  function hasValue(value) {
    return !(
      value == null ||
      value ===
        ""
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
    explanation,
    flags = [],
    missingEvidence = []
  ) {
    const result = {
      athlete_id:
        input?.athlete_id ??
        null,

      snapshot_id:
        input?.snapshot_id ??
        null,

      authority:
        AUTHORITY,

      domain:
        DOMAIN,

      engine_id:
        ENGINE_ID,

      engine_version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      status,

      official:
        false,

      eligibility_determination:
        null,

      portability_status:
        PORTABILITY_STATUS
          .NOT_DETERMINED,

      governing_determinations:
        [],

      eligibility_constraints:
        [],

      evidence_used:
        [],

      missing_evidence:
        unique(
          missingEvidence
        ),

      flags:
        unique(
          flags
        ),

      explanation,

      athletic_intelligence_modified:
        false,

      academic_score_created:
        false,

      pathway_recommendation_created:
        false,

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
  PROFILE NORMALIZATION
  -------------------------------------------------------
  IMPORTANT:

  Missing numeric evidence remains null.

  Missing values are NEVER converted to zero.
  =======================================================
  */

  function normalizeProfile(
    profile = {}
  ) {
    return {
      athlete_id:
        nullableText(
          profile.athlete_id
        ),

      snapshot_id:
        nullableText(
          profile.snapshot_id
        ),

      athlete_name:
        nullableText(
          profile.athlete_name ||
          profile.athlete_display_name
        ),

      gpa:
        nullableNumber(
          profile.gpa ??
          profile.current_gpa
        ),

      core_gpa:
        nullableNumber(
          profile.core_gpa
        ),

      sat:
        nullableNumber(
          profile.sat
        ),

      act:
        nullableNumber(
          profile.act
        ),

      core_courses_required:
        nullableNumber(
          profile
            .core_courses_required
        ),

      core_courses_completed:
        nullableNumber(
          profile
            .core_courses_completed ??
          profile
            .coreCoursesCompleted
        ),

      credits_required:
        nullableNumber(
          profile
            .credits_required
        ),

      credits_earned:
        nullableNumber(
          profile
            .credits_earned ??
          profile
            .creditsEarned
        ),

      transcript_status:
        nullableText(
          profile
            .transcript_status ??
          profile
            .transcript_available ??
          profile
            .transcriptAvailable
        ),

      transcript_verified:
        nullableBoolean(
          profile
            .transcript_verified
        ),

      counselor_contact:
        nullableText(
          profile
            .counselor_contact ??
          profile
            .counselorContact
        ),

      counselor_verified:
        nullableBoolean(
          profile
            .counselor_verified
        ),

      transfer_status:
        nullableText(
          profile
            .transfer_status ??
          profile
            .transferStatus
        ),

      previous_school:
        nullableText(
          profile.previous_school
        ),

      school:
        nullableText(
          profile.school ??
          profile.schoolProgram
        ),

      district:
        nullableText(
          profile.district
        ),

      state:
        nullableText(
          profile.state
        ),

      grading_system:
        nullableText(
          profile
            .grading_system ??
          profile
            .gradingSystem
        ),

      graduation_year:
        nullableText(
          profile
            .graduation_year ??
          profile
            .graduationClass
        ),

      class_rank:
        nullableText(
          profile
            .class_rank ??
          profile
            .classRank
        ),

      governing_records:
        normalizeGoverningRecords(
          profile
        ),

      eligibility_evidence:
        toArray(
          profile
            .eligibility_evidence
        ),

      source_records:
        toArray(
          profile
            .source_records
        )
    };
  }

  /*
  =======================================================
  GOVERNING RECORD NORMALIZATION
  -------------------------------------------------------
  NCAA, NAIA, NJCAA, STATE and DISTRICT remain separate.

  They are NEVER concatenated into a synthetic status.
  =======================================================
  */

  function normalizeGoverningRecords(
    profile
  ) {
    const records =
      [];

    function add(
      authority,
      status,
      extra = {}
    ) {
      if (
        !hasValue(status)
      ) {
        return;
      }

      records.push({
        authority,
        status:
          normalizeText(
            status
          ),

        verified:
          extra.verified ===
            true,

        source:
          nullableText(
            extra.source
          ),

        rule_version:
          nullableText(
            extra.rule_version
          ),

        determined_at:
          nullableText(
            extra.determined_at
          )
      });
    }

    add(
      "NCAA",
      profile.ncaa_status ??
      profile
        .ncaaEligibilityStatus,
      {
        verified:
          profile
            .ncaa_verified,

        source:
          profile
            .ncaa_source,

        rule_version:
          profile
            .ncaa_rule_version,

        determined_at:
          profile
            .ncaa_determined_at
      }
    );

    add(
      "NAIA",
      profile.naia_status,
      {
        verified:
          profile
            .naia_verified,

        source:
          profile
            .naia_source,

        rule_version:
          profile
            .naia_rule_version,

        determined_at:
          profile
            .naia_determined_at
      }
    );

    add(
      "NJCAA",
      profile.njcaa_status,
      {
        verified:
          profile
            .njcaa_verified,

        source:
          profile
            .njcaa_source,

        rule_version:
          profile
            .njcaa_rule_version,

        determined_at:
          profile
            .njcaa_determined_at
      }
    );

    add(
      "STATE",
      profile
        .state_eligibility_status,
      {
        verified:
          profile
            .state_eligibility_verified,

        source:
          profile
            .state_eligibility_source,

        rule_version:
          profile
            .state_rule_version,

        determined_at:
          profile
            .state_determined_at
      }
    );

    add(
      "DISTRICT",
      profile
        .district_eligibility_status,
      {
        verified:
          profile
            .district_eligibility_verified,

        source:
          profile
            .district_eligibility_source,

        rule_version:
          profile
            .district_rule_version,

        determined_at:
          profile
            .district_determined_at
      }
    );

    return records;
  }

  /*
  =======================================================
  RULE AUTHORITY RESOLUTION
  =======================================================
  */

  function resolveRulesAuthority(
    context = {}
  ) {
    return (
      context
        .eligibility_rules_authority ||

      root
        .STATScoreEligibilityRulesAuthority ||

      root.STATScore
        ?.EligibilityRulesAuthority ||

      null
    );
  }

  function executeRulesAuthority(
    authority,
    payload
  ) {
    if (!authority) {
      return null;
    }

    const methods = [
      "evaluateEligibility",
      "evaluate",
      "interpretEligibility",
      "applyRules"
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
          "Eligibility Engine requires a synchronous governed eligibility-rules result at this boundary."
        );
      }

      return result;
    }

    return null;
  }

  /*
  =======================================================
  EVIDENCE CLASSIFICATION
  =======================================================
  */

  function classifyEvidence(
    record
  ) {
    if (
      !record ||
      typeof record !==
        "object"
    ) {
      return EVIDENCE_STATUS
        .UNKNOWN;
    }

    const status =
      normalizeText(
        record
          .verification_status ??
        record.status
      );

    if (
      record.conflict ===
        true ||
      status ===
        "CONFLICT"
    ) {
      return EVIDENCE_STATUS
        .CONFLICT;
    }

    if (
      record.stale ===
        true ||
      status ===
        "STALE"
    ) {
      return EVIDENCE_STATUS
        .STALE;
    }

    if (
      record.verified ===
        true ||
      status ===
        "VERIFIED"
    ) {
      return EVIDENCE_STATUS
        .VERIFIED;
    }

    if (
      record.self_reported ===
        true ||
      status ===
        "REPORTED" ||
      normalizeText(
        record.source_type
      ) ===
        "SELF_REPORTED"
    ) {
      return EVIDENCE_STATUS
        .REPORTED;
    }

    if (
      status ===
        "UNVERIFIED"
    ) {
      return EVIDENCE_STATUS
        .UNVERIFIED;
    }

    return EVIDENCE_STATUS
      .UNKNOWN;
  }

  /*
  =======================================================
  SOURCE EVIDENCE REVIEW
  =======================================================
  */

  function reviewEvidence(
    profile
  ) {
    const records = [
      ...profile
        .eligibility_evidence,

      ...profile
        .source_records
    ];

    const flags =
      [];

    const reviewed =
      records.map(
        (
          record,
          index
        ) => {
          const evidenceStatus =
            classifyEvidence(
              record
            );

          if (
            evidenceStatus ===
            EVIDENCE_STATUS
              .CONFLICT
          ) {
            flags.push(
              "SOURCE_EVIDENCE_CONFLICT"
            );
          }

          if (
            evidenceStatus ===
            EVIDENCE_STATUS
              .STALE
          ) {
            flags.push(
              "STALE_EVIDENCE"
            );
          }

          if (
            evidenceStatus ===
            EVIDENCE_STATUS
              .REPORTED ||
            evidenceStatus ===
            EVIDENCE_STATUS
              .UNVERIFIED
          ) {
            flags.push(
              "UNVERIFIED_EVIDENCE"
            );
          }

          return {
            index,
            status:
              evidenceStatus,

            source_type:
              nullableText(
                record
                  ?.source_type
              ),

            authority:
              nullableText(
                record
                  ?.authority
              )
          };
        }
      );

    return {
      records:
        reviewed,

      flags:
        unique(
          flags
        )
    };
  }

  /*
  =======================================================
  GOVERNING DETERMINATIONS
  -------------------------------------------------------
  This engine does not infer "ELIGIBLE" from arbitrary
  strings.

  Official determinations must arrive as structured,
  governed records.

  No substring matching is permitted.
  =======================================================
  */

  function interpretGoverningRecord(
    record
  ) {
    const allowedStatuses =
      new Set([
        "ELIGIBLE",
        "INELIGIBLE",
        "CONDITIONALLY_ELIGIBLE",
        "REVIEW_REQUIRED",
        "PENDING",
        "NOT_STARTED",
        "UNKNOWN"
      ]);

    const status =
      allowedStatuses.has(
        record.status
      )
        ? record.status
        : "UNKNOWN";

    return {
      authority:
        record.authority,

      status,

      official:
        record.verified ===
          true,

      source:
        record.source,

      rule_version:
        record.rule_version,

      determined_at:
        record.determined_at
    };
  }

  /*
  =======================================================
  ELIGIBILITY CONSTRAINT EXTRACTION
  -------------------------------------------------------
  Constraints describe eligibility conditions.

  They are NOT pathway recommendations.
  =======================================================
  */

  function collectConstraints(
    profile,
    governingDeterminations,
    rulesResult
  ) {
    const constraints =
      [];

    if (
      profile.gpa ==
        null &&
      profile.core_gpa ==
        null
    ) {
      constraints.push({
        code:
          "GPA_EVIDENCE_MISSING",

        area:
          "ACADEMIC_RECORD",

        status:
          "EVIDENCE_REQUIRED",

        message:
          "GPA evidence is unavailable."
      });
    }

    if (
      !profile
        .transcript_status
    ) {
      constraints.push({
        code:
          "TRANSCRIPT_EVIDENCE_MISSING",

        area:
          "TRANSCRIPT",

        status:
          "EVIDENCE_REQUIRED",

        message:
          "Transcript evidence is unavailable."
      });
    }

    if (
      profile
        .core_courses_completed ==
        null
    ) {
      constraints.push({
        code:
          "CORE_COURSE_EVIDENCE_MISSING",

        area:
          "CORE_COURSES",

        status:
          "EVIDENCE_REQUIRED",

        message:
          "Core-course completion evidence is unavailable."
      });
    }

    for (
      const determination of
        governingDeterminations
    ) {
      if (
        determination.status ===
        "INELIGIBLE"
      ) {
        constraints.push({
          code:
            `${determination.authority}_INELIGIBLE`,

          area:
            "GOVERNING_AUTHORITY",

          authority:
            determination.authority,

          status:
            "CONDITION_NOT_MET",

          message:
            `${determination.authority} reports an ineligible determination.`
        });
      }

      if (
        determination.status ===
          "REVIEW_REQUIRED" ||
        determination.status ===
          "PENDING" ||
        determination.status ===
          "NOT_STARTED"
      ) {
        constraints.push({
          code:
            `${determination.authority}_${determination.status}`,

          area:
            "GOVERNING_AUTHORITY",

          authority:
            determination.authority,

          status:
            "REVIEW_REQUIRED",

          message:
            `${determination.authority} eligibility determination requires additional action or review.`
        });
      }
    }

    const governedConstraints =
      toArray(
        rulesResult
          ?.constraints
      );

    for (
      const constraint of
        governedConstraints
    ) {
      if (
        !constraint ||
        typeof constraint !==
          "object"
      ) {
        continue;
      }

      constraints.push({
        ...constraint,

        source:
          constraint.source ||
          "GOVERNED_RULE_AUTHORITY"
      });
    }

    return constraints;
  }

  /*
  =======================================================
  COUNSELOR ACTION FLAGS
  -------------------------------------------------------
  Counselor involvement is operational support.

  Counselor presence/absence does not independently
  determine athlete eligibility.
  =======================================================
  */

  function collectCounselorActions(
    profile,
    constraints
  ) {
    const actions =
      [];

    for (
      const constraint of
        constraints
    ) {
      if (
        [
          "ACADEMIC_RECORD",
          "TRANSCRIPT",
          "CORE_COURSES"
        ].includes(
          constraint.area
        )
      ) {
        actions.push({
          code:
            `COUNSELOR_${constraint.code}`,

          action:
            constraint.message
        });
      }
    }

    if (
      profile
        .counselor_verified !==
        true
    ) {
      actions.push({
        code:
          "COUNSELOR_VERIFICATION_PENDING",

        action:
          "Counselor verification is not confirmed."
      });
    }

    return actions;
  }

  /*
  =======================================================
  PORTABILITY RESOLUTION
  -------------------------------------------------------
  Portability is derived from governed eligibility
  determinations and constraints.

  It is NOT a pathway recommendation.
  =======================================================
  */

  function resolvePortability(
    determinations,
    constraints,
    rulesResult
  ) {
    if (
      rulesResult
        ?.portability_status &&
      Object.values(
        PORTABILITY_STATUS
      ).includes(
        rulesResult
          .portability_status
      )
    ) {
      return rulesResult
        .portability_status;
    }

    if (
      constraints.some(
        (item) =>
          item.status ===
          "CONDITION_NOT_MET"
      )
    ) {
      return PORTABILITY_STATUS
        .REVIEW_REQUIRED;
    }

    if (
      constraints.some(
        (item) =>
          item.status ===
          "EVIDENCE_REQUIRED"
      )
    ) {
      return PORTABILITY_STATUS
        .DETERMINATION_BLOCKED;
    }

    const official =
      determinations.filter(
        (item) =>
          item.official
      );

    if (!official.length) {
      return PORTABILITY_STATUS
        .NOT_DETERMINED;
    }

    if (
      official.some(
        (item) =>
          item.status ===
            "REVIEW_REQUIRED" ||
          item.status ===
            "PENDING" ||
          item.status ===
            "NOT_STARTED"
      )
    ) {
      return PORTABILITY_STATUS
        .REVIEW_REQUIRED;
    }

    if (
      official.every(
        (item) =>
          item.status ===
          "ELIGIBLE"
      )
    ) {
      return PORTABILITY_STATUS
        .PORTABLE;
    }

    return PORTABILITY_STATUS
      .CONDITIONALLY_PORTABLE;
  }

  /*
  =======================================================
  OVERALL STATUS
  =======================================================
  */

  function resolveOverallStatus(
    determinations,
    constraints,
    evidenceReview,
    rulesResult
  ) {
    if (
      evidenceReview.flags.includes(
        "SOURCE_EVIDENCE_CONFLICT"
      )
    ) {
      return STATUS
        .SOURCE_EVIDENCE_CONFLICT;
    }

    if (
      constraints.some(
        (item) =>
          item.status ===
          "CONDITION_NOT_MET"
      )
    ) {
      return STATUS
        .CONDITION_NOT_MET;
    }

    if (
      constraints.some(
        (item) =>
          item.status ===
          "EVIDENCE_REQUIRED"
      )
    ) {
      return STATUS
        .INSUFFICIENT_EVIDENCE;
    }

    if (
      rulesResult
        ?.status &&
      Object.values(
        STATUS
      ).includes(
        rulesResult.status
      )
    ) {
      return rulesResult.status;
    }

    const official =
      determinations.filter(
        (item) =>
          item.official
      );

    if (!official.length) {
      return STATUS
        .UNVERIFIED;
    }

    if (
      official.some(
        (item) =>
          item.status ===
            "REVIEW_REQUIRED" ||
          item.status ===
            "PENDING" ||
          item.status ===
            "NOT_STARTED"
      )
    ) {
      return STATUS
        .REVIEW_REQUIRED;
    }

    if (
      official.every(
        (item) =>
          item.status ===
          "ELIGIBLE"
      )
    ) {
      return STATUS
        .CLEAR;
    }

    return STATUS
      .MONITOR;
  }

  /*
  =======================================================
  OFFICIAL EVALUATION
  =======================================================
  */

  function evaluate(
    input = {},
    context = {}
  ) {
    try {
      lastError =
        null;

      const profile =
        normalizeProfile(
          input
        );

      /*
      ---------------------------------------------------
      IDENTITY EVIDENCE
      ---------------------------------------------------
      */

      const missingIdentity =
        [];

      if (
        !profile.athlete_id
      ) {
        missingIdentity.push(
          "athlete_id"
        );
      }

      if (
        !profile.snapshot_id
      ) {
        missingIdentity.push(
          "snapshot_id"
        );
      }

      if (
        missingIdentity.length
      ) {
        return failClosed(
          input,

          STATUS
            .INSUFFICIENT_EVIDENCE,

          "Eligibility Intelligence requires governed athlete and snapshot identity.",

          [
            "IDENTITY_EVIDENCE_MISSING"
          ],

          missingIdentity
        );
      }

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

          STATUS
            .AUTHORITY_UNAVAILABLE,

          "Eligibility Intelligence may only execute as the governed Stream 9 intelligence authority.",

          [
            "STREAM_AUTHORITY_INVALID"
          ]
        );
      }

      /*
      ---------------------------------------------------
      EVIDENCE REVIEW
      ---------------------------------------------------
      */

      const evidenceReview =
        reviewEvidence(
          profile
        );

      /*
      ---------------------------------------------------
      GOVERNING RECORDS
      ---------------------------------------------------
      */

      const governingDeterminations =
        profile
          .governing_records
          .map(
            interpretGoverningRecord
          );

      /*
      ---------------------------------------------------
      RULE AUTHORITY
      ---------------------------------------------------

      No GPA threshold, credit threshold, course threshold
      or testing requirement is manufactured locally.

      A governed rule authority must supply those rules.
      ---------------------------------------------------
      */

      const rulesAuthority =
        resolveRulesAuthority(
          context
        );

      let rulesResult =
        null;

      if (rulesAuthority) {
        rulesResult =
          executeRulesAuthority(
            rulesAuthority,
            {
              athlete_id:
                profile.athlete_id,

              snapshot_id:
                profile.snapshot_id,

              academic_evidence: {
                gpa:
                  profile.gpa,

                core_gpa:
                  profile.core_gpa,

                sat:
                  profile.sat,

                act:
                  profile.act,

                core_courses_required:
                  profile
                    .core_courses_required,

                core_courses_completed:
                  profile
                    .core_courses_completed,

                credits_required:
                  profile
                    .credits_required,

                credits_earned:
                  profile
                    .credits_earned,

                transcript_status:
                  profile
                    .transcript_status,

                transcript_verified:
                  profile
                    .transcript_verified
              },

              governing_records:
                profile
                  .governing_records,

              jurisdiction: {
                school:
                  profile.school,

                district:
                  profile.district,

                state:
                  profile.state
              },

              transfer: {
                status:
                  profile
                    .transfer_status,

                previous_school:
                  profile
                    .previous_school
              },

              graduation_year:
                profile
                  .graduation_year,

              grading_system:
                profile
                  .grading_system
            }
          );
      }

      /*
      ---------------------------------------------------
      CONSTRAINTS
      ---------------------------------------------------
      */

      const constraints =
        collectConstraints(
          profile,
          governingDeterminations,
          rulesResult
        );

      /*
      ---------------------------------------------------
      COUNSELOR ACTIONS
      ---------------------------------------------------
      */

      const counselorActions =
        collectCounselorActions(
          profile,
          constraints
        );

      /*
      ---------------------------------------------------
      PORTABILITY
      ---------------------------------------------------
      */

      const portabilityStatus =
        resolvePortability(
          governingDeterminations,
          constraints,
          rulesResult
        );

      /*
      ---------------------------------------------------
      OVERALL STATUS
      ---------------------------------------------------
      */

      let status =
        resolveOverallStatus(
          governingDeterminations,
          constraints,
          evidenceReview,
          rulesResult
        );

      const flags = [
        ...evidenceReview.flags
      ];

      /*
      ---------------------------------------------------
      RULE AUTHORITY VISIBILITY
      ---------------------------------------------------

      Absence of a rules authority does not permit this
      engine to invent one.

      Existing verified governing determinations may still
      be reported as evidence.

      New rule-derived eligibility conclusions may not be
      manufactured.
      ---------------------------------------------------
      */

      if (
        !rulesAuthority
      ) {
        flags.push(
          "RULESET_UNAVAILABLE"
        );

        if (
          !governingDeterminations
            .some(
              (item) =>
                item.official
            )
        ) {
          status =
            STATUS
              .RULESET_UNAVAILABLE;
        }
      }

      /*
      ---------------------------------------------------
      EVIDENCE USED
      ---------------------------------------------------
      */

      const evidenceUsed =
        [];

      if (
        profile.gpa != null
      ) {
        evidenceUsed.push(
          "gpa"
        );
      }

      if (
        profile.core_gpa !=
        null
      ) {
        evidenceUsed.push(
          "core_gpa"
        );
      }

      if (
        profile
          .transcript_status
      ) {
        evidenceUsed.push(
          "transcript_status"
        );
      }

      if (
        profile
          .core_courses_completed !=
        null
      ) {
        evidenceUsed.push(
          "core_courses_completed"
        );
      }

      if (
        profile.sat != null
      ) {
        evidenceUsed.push(
          "sat"
        );
      }

      if (
        profile.act != null
      ) {
        evidenceUsed.push(
          "act"
        );
      }

      if (
        profile
          .governing_records
          .length
      ) {
        evidenceUsed.push(
          "governing_records"
        );
      }

      if (
        profile
          .eligibility_evidence
          .length
      ) {
        evidenceUsed.push(
          "eligibility_evidence"
        );
      }

      if (
        profile
          .source_records
          .length
      ) {
        evidenceUsed.push(
          "source_records"
        );
      }

      /*
      ---------------------------------------------------
      OFFICIAL DETERMINATION
      ---------------------------------------------------
      */

      const officialDeterminations =
        governingDeterminations
          .filter(
            (item) =>
              item.official
          );

      const official =
        Boolean(
          rulesResult
            ?.official ===
            true ||
          officialDeterminations
            .length
        );

      /*
      ---------------------------------------------------
      RESULT
      ---------------------------------------------------
      */

      const result = {
        athlete_id:
          profile.athlete_id,

        snapshot_id:
          profile.snapshot_id,

        athlete_name:
          profile.athlete_name,

        authority:
          AUTHORITY,

        domain:
          DOMAIN,

        engine_id:
          ENGINE_ID,

        engine_version:
          VERSION,

        stream_owner:
          STREAM_OWNER,

        output_type:
          OUTPUT_TYPE,

        status,

        official,

        eligibility_determination:
          rulesResult
            ?.eligibility_determination ??
          null,

        portability_status:
          portabilityStatus,

        governing_determinations:
          governingDeterminations,

        eligibility_constraints:
          constraints,

        counselor_action_flags:
          counselorActions,

        academic_evidence: {
          gpa:
            profile.gpa,

          core_gpa:
            profile.core_gpa,

          sat:
            profile.sat,

          act:
            profile.act,

          core_courses_required:
            profile
              .core_courses_required,

          core_courses_completed:
            profile
              .core_courses_completed,

          credits_required:
            profile
              .credits_required,

          credits_earned:
            profile
              .credits_earned,

          transcript_status:
            profile
              .transcript_status,

          transcript_verified:
            profile
              .transcript_verified
        },

        jurisdiction: {
          school:
            profile.school,

          district:
            profile.district,

          state:
            profile.state,

          grading_system:
            profile
              .grading_system
        },

        transfer: {
          status:
            profile
              .transfer_status,

          previous_school:
            profile
              .previous_school
        },

        evidence_used:
          unique(
            evidenceUsed
          ),

        missing_evidence:
          constraints
            .filter(
              (item) =>
                item.status ===
                "EVIDENCE_REQUIRED"
            )
            .map(
              (item) =>
                item.code
            ),

        flags:
          unique(
            flags
          ),

        rules_authority_available:
          Boolean(
            rulesAuthority
          ),

        rules_authority_applied:
          Boolean(
            rulesResult
          ),

        explanation: {
          summary:
            "Eligibility Intelligence evaluates governed academic and eligibility evidence without modifying Athletic Intelligence or manufacturing pathway recommendations.",

          missing_is_zero:
            false,

          academic_score_created:
            false,

          athletic_intelligence_modified:
            false,

          pathway_recommendation_created:
            false,

          governing_authorities_separated:
            true,

          local_gpa_thresholds_applied:
            false,

          local_credit_thresholds_applied:
            false,

          local_course_thresholds_applied:
            false,

          local_testing_requirement_applied:
            false
        },

        generated_at:
          now()
      };

      lastResult =
        result;

      return result;

    } catch (error) {
      return failClosed(
        input,

        STATUS
          .INVALID_INPUT,

        String(
          error?.message ||
          error
        ),

        [
          "UNHANDLED_ELIGIBILITY_ERROR"
        ]
      );
    }
  }

  /*
  =======================================================
  CONTRACT
  =======================================================
  */

  function getContract() {
    return {
      engine_id:
        ENGINE_ID,

      authority:
        AUTHORITY,

      domain:
        DOMAIN,

      version:
        VERSION,

      stream_owner:
        STREAM_OWNER,

      output_type:
        OUTPUT_TYPE,

      status_contract: {
        ...STATUS
      },

      portability_status: {
        ...PORTABILITY_STATUS
      },

      evidence_status: {
        ...EVIDENCE_STATUS
      },

      governing_authorities: [
        ...GOVERNING_AUTHORITIES
      ],

      invariants: {
        missing_is_zero:
          false,

        reported_equals_verified:
          false,

        eligibility_equals_athletic_ability:
          false,

        eligibility_modifies_athletic_score:
          false,

        eligibility_creates_academic_score:
          false,

        eligibility_creates_pathway_recommendation:
          false,

        missing_authority_allows_local_rules:
          false,

        governing_authorities_may_be_collapsed:
          false
      }
    };
  }

  /*
  =======================================================
  CONFIGURATION
  =======================================================
  */

  function getConfiguration() {
    return {
      ...getContract(),

      local_scoring_model:
        false,

      local_risk_points:
        false,

      local_gpa_thresholds:
        false,

      local_credit_thresholds:
        false,

      local_core_course_thresholds:
        false,

      local_testing_requirements:
        false,

      pathway_manufacturing:
        false
    };
  }

  /*
  =======================================================
  DIAGNOSTICS
  =======================================================
  */

  function getLastResult() {
    return lastResult;
  }

  function getLastError() {
    return lastError;
  }

  function runHealthCheck(
    context = {}
  ) {
    const rulesAuthority =
      resolveRulesAuthority(
        context
      );

    return {
      engine_loaded:
        true,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      authority:
        AUTHORITY,

      domain:
        DOMAIN,

      stream_owner:
        STREAM_OWNER,

      rules_authority_available:
        Boolean(
          rulesAuthority
        ),

      missing_is_zero:
        false,

      local_risk_scoring:
        false,

      local_gpa_thresholds:
        false,

      local_credit_thresholds:
        false,

      local_course_thresholds:
        false,

      local_testing_requirements:
        false,

      governing_authorities_separated:
        true,

      athletic_intelligence_modified:
        false,

      academic_score_created:
        false,

      pathway_recommendation_created:
        false,

      healthy:
        true
    };
  }

  /*
  =======================================================
  PUBLIC AUTHORITY
  =======================================================
  */

  const api =
    Object.freeze({
      id:
        ENGINE_ID,

      authority:
        AUTHORITY,

      domain:
        DOMAIN,

      version:
        VERSION,

      status:
        "ACTIVE",

      locked:
        true,

      evaluate,

      normalizeProfile,

      getContract,

      getConfiguration,

      getLastResult,

      getLastError,

      runHealthCheck
    });

  root.STATScoreEligibilityEngine =
    api;

  root.STATScore =
    root.STATScore ||
    {};

  root.STATScore.EligibilityEngine =
    api;

  /*
  =======================================================
  CONTROLLED LEGACY COMPATIBILITY
  -------------------------------------------------------
  These aliases delegate to the canonical authority.

  They do NOT create another eligibility authority.
  =======================================================
  */

  root.STATSCORE_ELIGIBILITY_ENGINE =
    api;

  root.STATSCORE_RUN_ELIGIBILITY =
    function (
      profile,
      context
    ) {
      return api.evaluate(
        profile,
        context
      );
    };

  /*
  =======================================================
  LOAD RECEIPT
  =======================================================
  */

  console.info(
    "[STATS-CORE][STREAM 9] Eligibility Intelligence Engine v2.0.0 loaded."
  );

})(
  typeof window !==
    "undefined"
    ? window
    : globalThis
); 
