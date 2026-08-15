/* ============================================================
   STATS-CORE™ CRYSTAL ENGINE
   File: statscore-crystal-engine.js
   Version: STATSCORE-CRYSTAL-ENGINE-V2-GOVERNED-PUBLICATION

   Owner:
   Stream 7 — Crystal Reports / Crystal Registry /
   Enterprise Publication Authority

   Constitutional Purpose:
   Consume, validate, normalize, preserve, explain, and compose
   governed athlete-to-program / program-to-athlete intelligence
   for Crystal publication.

   STREAM 7 CRYSTAL MAY:
   - consume governed Match Intelligence;
   - consume governed Pathway references;
   - consume governed Program Intelligence references;
   - preserve intelligence authority;
   - preserve confidence;
   - preserve WHY;
   - preserve constraints, strengths, gaps, and opportunities;
   - preserve evidence/intelligence receipts;
   - preserve ranking/order supplied upstream;
   - preserve version/effective state;
   - enforce disclosure/publication boundaries;
   - compose Crystal publication objects;
   - prepare Crystal Registry references;
   - prepare Crystal Report projections.

   STREAM 7 CRYSTAL SHALL NOT:
   - calculate athlete-to-program match score;
   - calculate program-to-athlete match score;
   - calculate Academic compatibility;
   - calculate Pathway;
   - calculate Program Fit;
   - calculate Development Fit;
   - assign match levels;
   - assign recruiting ranking;
   - manufacture program need;
   - manufacture evidence confidence;
   - infer recruiting interest;
   - infer offer;
   - infer commitment;
   - convert private Match Intelligence into public media.

   CONTROLLING DOCTRINES:

   Crystal Publication ≠ Recruiting Matching Authority

   Athlete Intelligence
        +
   Academic / Eligibility Intelligence
        +
   Pathway Intelligence
        +
   Program Intelligence
        +
   Recruiter Need Intelligence
        ↓
   STREAM 9 — GOVERNED MATCH INTELLIGENCE
        ↓
   STREAM 7 — CRYSTAL PUBLICATION

   Exposure ≠ Interest
   Interest ≠ Communication
   Communication ≠ Offer
   Offer ≠ Commitment

   Athletic Ceiling ≠ Current Reachable Pathway
============================================================ */

(function () {
  "use strict";

  const VERSION =
    "STATSCORE-CRYSTAL-ENGINE-V2-GOVERNED-PUBLICATION";

  const ENGINE_ID =
    "statscore-crystal-engine";


  /* ==========================================================
     PUBLICATION / DISCLOSURE SCOPES
  ========================================================== */

  const DISCLOSURE_SCOPES = Object.freeze({
    PRIVATE: "PRIVATE",
    ATHLETE_WORKSPACE: "ATHLETE_WORKSPACE",
    PARENT_GUARDIAN: "PARENT_GUARDIAN",
    PROFESSIONAL_WORKSPACE: "PROFESSIONAL_WORKSPACE",
    RECRUITING: "RECRUITING",
    PUBLIC_MEDIA: "PUBLIC_MEDIA"
  });


  const CRYSTAL_TYPES = Object.freeze({
    ATHLETE_TO_PROGRAM: "ATHLETE_TO_PROGRAM",
    PROGRAM_TO_ATHLETE: "PROGRAM_TO_ATHLETE",
    PROGRAM_TO_ATHLETES: "PROGRAM_TO_ATHLETES",
    PATHWAY_PROJECTION: "PATHWAY_PROJECTION",
    OPPORTUNITY_PROJECTION: "OPPORTUNITY_PROJECTION"
  });


  const VALIDATION_STATES = Object.freeze({
    VALID: "VALID",
    INVALID: "INVALID",
    INCOMPLETE: "INCOMPLETE",
    RESTRICTED: "RESTRICTED"
  });


  /* ==========================================================
     HELPERS
  ========================================================== */

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


  function nowISO() {
    return new Date().toISOString();
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


  function generateId(prefix = "crystal") {
    if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return `${prefix}:${globalThis.crypto.randomUUID()}`;
    }

    return (
      `${prefix}:${Date.now()}:` +
      Math.random()
        .toString(36)
        .slice(2)
    );
  }


  /* ==========================================================
     GOVERNED MATCH CONTRACT

     Expected upstream shape may include:

     {
       intelligence_id,
       intelligence_type,

       athlete_id,
       snapshot_id,

       program_id,
       program_name,

       match_score,
       match_level,

       intelligence_authority,
       authority_version,

       confidence,
       confidence_basis,

       why: [],
       strengths: [],
       constraints: [],
       gaps: [],
       opportunities: [],

       pathway: {
         athletic_ceiling,
         current_reachable_pathway,
         target_pathway,
         blocking_constraints,
         bridge_requirements
       },

       evidence_references: [],
       intelligence_references: [],

       rule_set,
       rule_version,
       effective_at,

       intelligence_receipt_id,

       disclosure_scope,
       publication_safe
     }

     IMPORTANT:
     Stream 7 consumes all substantive intelligence fields.
     It does not create them.
  ========================================================== */


  function validateGovernedIntelligence(input = {}) {
    const errors = [];

    if (!clean(input.intelligence_id)) {
      errors.push(
        "intelligence_id is required."
      );
    }

    if (
      !clean(
        input.intelligence_authority
      )
    ) {
      errors.push(
        "intelligence_authority is required."
      );
    }

    if (
      !clean(
        input.intelligence_type ||
        input.match_type
      )
    ) {
      errors.push(
        "intelligence_type / match_type is required."
      );
    }

    if (!clean(input.athlete_id)) {
      errors.push(
        "athlete_id is required."
      );
    }

    if (
      !clean(input.program_id) &&
      !clean(input.program_name)
    ) {
      errors.push(
        "program_id or program_name is required."
      );
    }

    if (
      !clean(
        input.intelligence_receipt_id ||
        input.receipt_id
      )
    ) {
      errors.push(
        "intelligence_receipt_id is required."
      );
    }

    /*
      WHY is a constitutional requirement for Crystal.
    */
    const why =
      Array.isArray(input.why)
        ? input.why.filter(Boolean)
        : [];

    if (!why.length) {
      errors.push(
        "Governed WHY explanation is required."
      );
    }

    return {
      ok:
        errors.length === 0,

      state:
        errors.length
          ? VALIDATION_STATES.INVALID
          : VALIDATION_STATES.VALID,

      errors
    };
  }


  /* ==========================================================
     DISCLOSURE GOVERNANCE

     Intelligence validity and publication/disclosure authority
     are independent.
  ========================================================== */

  function resolveDisclosure(input = {}) {
    const scope =
      upper(
        input.disclosure_scope ||
        DISCLOSURE_SCOPES.PRIVATE
      );

    const publicDisclosureAuthorized =
      input.public_disclosure_authorized === true;

    const publicMediaEligible =
      scope ===
        DISCLOSURE_SCOPES.PUBLIC_MEDIA &&
      publicDisclosureAuthorized &&
      Boolean(
        clean(
          input.disclosure_authority_reference
        )
      );

    return {
      scope,

      public_disclosure_authorized:
        publicDisclosureAuthorized,

      disclosure_authority_reference:
        input.disclosure_authority_reference ||
        null,

      public_media_eligible:
        publicMediaEligible,

      doctrine: {
        intelligence_exists_does_not_mean_public:
          true,

        program_match_does_not_mean_program_interest:
          true
      }
    };
  }


  /* ==========================================================
     PATHWAY NORMALIZATION

     Presentation normalization only.

     NO PATHWAY CALCULATION OCCURS HERE.
  ========================================================== */

  function normalizePathway(pathway = {}) {
    return {
      athletic_ceiling:
        pathway.athletic_ceiling ||
        pathway.athletic_projection ||
        null,

      current_reachable_pathway:
        pathway.current_reachable_pathway ||
        pathway.current_destination ||
        null,

      target_pathway:
        pathway.target_pathway ||
        pathway.target_destination ||
        null,

      blocking_constraints:
        Array.isArray(
          pathway.blocking_constraints
        )
          ? clone(
              pathway.blocking_constraints
            )
          : [],

      bridge_requirements:
        Array.isArray(
          pathway.bridge_requirements
        )
          ? clone(
              pathway.bridge_requirements
            )
          : [],

      pathway_reference:
        pathway.pathway_reference ||
        pathway.intelligence_reference ||
        null,

      pathway_receipt_id:
        pathway.pathway_receipt_id ||
        pathway.receipt_id ||
        null
    };
  }


  /* ==========================================================
     GOVERNED CRYSTAL OBJECT

     This is the canonical Stream 7 composition operation.
  ========================================================== */

  function buildCrystalPublication(
    governedIntelligence = {},
    options = {}
  ) {
    const validation =
      validateGovernedIntelligence(
        governedIntelligence
      );

    if (!validation.ok) {
      return {
        ok: false,

        status:
          "INVALID_GOVERNED_CRYSTAL_INTELLIGENCE",

        validation_state:
          validation.state,

        errors:
          validation.errors,

        message:
          "Crystal publication refused because required governed intelligence authority is incomplete."
      };
    }


    const disclosure =
      resolveDisclosure(
        governedIntelligence
      );


    const type =
      upper(
        governedIntelligence
          .intelligence_type ||
        governedIntelligence.match_type
      );


    const why =
      Array.isArray(
        governedIntelligence.why
      )
        ? clone(
            governedIntelligence.why
          )
        : [];


    const strengths =
      Array.isArray(
        governedIntelligence.strengths
      )
        ? clone(
            governedIntelligence.strengths
          )
        : [];


    const constraints =
      Array.isArray(
        governedIntelligence.constraints
      )
        ? clone(
            governedIntelligence.constraints
          )
        : [];


    const gaps =
      Array.isArray(
        governedIntelligence.gaps
      )
        ? clone(
            governedIntelligence.gaps
          )
        : [];


    const opportunities =
      Array.isArray(
        governedIntelligence.opportunities
      )
        ? clone(
            governedIntelligence.opportunities
          )
        : [];


    const pathway =
      normalizePathway(
        governedIntelligence.pathway ||
        {}
      );


    return {
      ok: true,

      crystal_id:
        options.crystal_id ||
        governedIntelligence.crystal_id ||
        generateId(
          "crystal_publication"
        ),

      engine:
        "STATS-CORE Crystal Publication Engine",

      engine_id:
        ENGINE_ID,

      engine_version:
        VERSION,

      authority_class:
        "STREAM_7_CRYSTAL_PUBLICATION",


      /* ------------------------------------------------------
         GOVERNED INTELLIGENCE IDENTITY
      ------------------------------------------------------ */

      intelligence_id:
        governedIntelligence
          .intelligence_id,

      intelligence_type:
        type,

      match_type:
        governedIntelligence
          .match_type ||
        type,

      intelligence_authority:
        governedIntelligence
          .intelligence_authority,

      authority_version:
        governedIntelligence
          .authority_version ||
        null,

      intelligence_receipt_id:
        governedIntelligence
          .intelligence_receipt_id ||
        governedIntelligence.receipt_id ||
        null,


      /* ------------------------------------------------------
         ATHLETE / PROGRAM CONTEXT
      ------------------------------------------------------ */

      athlete_id:
        governedIntelligence
          .athlete_id,

      snapshot_id:
        governedIntelligence
          .snapshot_id ||
        null,

      athlete_display_name:
        governedIntelligence
          .athlete_display_name ||
        governedIntelligence
          .athlete_name ||
        null,

      program_id:
        governedIntelligence
          .program_id ||
        null,

      program_name:
        governedIntelligence
          .program_name ||
        null,


      /* ------------------------------------------------------
         GOVERNED MATCH RESULT

         THESE VALUES ARE CONSUMED.

         THEY ARE NOT CALCULATED BY STREAM 7.
      ------------------------------------------------------ */

      match_score:
        governedIntelligence
          .match_score ??
        null,

      match_level:
        governedIntelligence
          .match_level ||
        null,

      ranking_position:
        governedIntelligence
          .ranking_position ??
        governedIntelligence.rank ??
        null,

      confidence:
        governedIntelligence
          .confidence ||
        null,

      confidence_basis:
        governedIntelligence
          .confidence_basis ||
        null,


      /* ------------------------------------------------------
         EXPLAINABILITY
      ------------------------------------------------------ */

      why,

      summary:
        governedIntelligence.summary ||
        buildSafeSummary(
          governedIntelligence
        ),

      strengths,

      constraints,

      gaps,

      opportunities,


      /* ------------------------------------------------------
         PATHWAY

         Preserve:
         athletic ceiling != current route.
      ------------------------------------------------------ */

      pathway,


      /* ------------------------------------------------------
         REFERENCES
      ------------------------------------------------------ */

      evidence_references:
        Array.isArray(
          governedIntelligence
            .evidence_references
        )
          ? clone(
              governedIntelligence
                .evidence_references
            )
          : [],

      intelligence_references:
        Array.isArray(
          governedIntelligence
            .intelligence_references
        )
          ? clone(
              governedIntelligence
                .intelligence_references
            )
          : [],


      rule_set:
        governedIntelligence
          .rule_set ||
        null,

      rule_version:
        governedIntelligence
          .rule_version ||
        null,

      effective_at:
        governedIntelligence
          .effective_at ||
        null,

      generated_at:
        governedIntelligence
          .generated_at ||
        null,


      /* ------------------------------------------------------
         DISCLOSURE / PUBLICATION
      ------------------------------------------------------ */

      disclosure,

      publication_safe:
        governedIntelligence
          .publication_safe === true,

      publication_authorized:
        false,

      publication_receipt_id:
        null,

      publication_state:
        "NOT_PUBLISHED",


      /* ------------------------------------------------------
         STREAM 7 COMPOSITION
      ------------------------------------------------------ */

      composed_at:
        nowISO(),

      locked:
        true,

      doctrine: {
        crystal_does_not_calculate_match:
          true,

        match_does_not_equal_interest:
          true,

        interest_does_not_equal_offer:
          true,

        offer_does_not_equal_commitment:
          true,

        athletic_ceiling_is_not_current_pathway:
          true,

        valid_intelligence_is_not_automatic_publication:
          true
      }
    };
  }


  /* ==========================================================
     SAFE SUMMARY

     This may assemble already-supplied labels but does not infer
     match strength.
  ========================================================== */

  function buildSafeSummary(
    intelligence = {}
  ) {
    const athlete =
      intelligence.athlete_display_name ||
      intelligence.athlete_name ||
      "Athlete";

    const program =
      intelligence.program_name ||
      "Program";

    const level =
      intelligence.match_level ||
      "governed match";

    return (
      `${athlete} has a ${level} intelligence result for ${program}. ` +
      `See the governed WHY and intelligence receipt for the authoritative basis.`
    );
  }


  /* ==========================================================
     CRYSTAL REGISTRY REFERENCE
  ========================================================== */

  function buildRegistryReference(
    crystal = {}
  ) {
    if (!crystal?.ok) {
      return {
        ok: false,
        status:
          "VALID_CRYSTAL_REQUIRED"
      };
    }

    return {
      ok: true,

      reference_type:
        "CRYSTAL_REGISTRY_REFERENCE",

      crystal_id:
        crystal.crystal_id,

      intelligence_id:
        crystal.intelligence_id,

      intelligence_type:
        crystal.intelligence_type,

      intelligence_authority:
        crystal.intelligence_authority,

      intelligence_receipt_id:
        crystal.intelligence_receipt_id,

      athlete_id:
        crystal.athlete_id,

      snapshot_id:
        crystal.snapshot_id,

      program_id:
        crystal.program_id,

      match_level:
        crystal.match_level,

      confidence:
        crystal.confidence,

      disclosure_scope:
        crystal.disclosure.scope,

      publication_safe:
        crystal.publication_safe,

      effective_at:
        crystal.effective_at,

      composed_at:
        crystal.composed_at,

      locked:
        true
    };
  }


  /* ==========================================================
     PUBLICATION CANDIDATE

     Crystal intelligence may be considered for PHNX publication
     only when the upstream intelligence is publication-safe and
     disclosure governance permits the requested scope.

     Candidate ≠ Publication.
  ========================================================== */

  function buildMediaCandidateReference(
    crystal = {}
  ) {
    if (!crystal?.ok) {
      return {
        ok: false,

        status:
          "VALID_CRYSTAL_REQUIRED"
      };
    }


    if (
      crystal.publication_safe !== true
    ) {
      return {
        ok: false,

        status:
          "CRYSTAL_NOT_PUBLICATION_SAFE",

        crystal_id:
          crystal.crystal_id,

        reason:
          "Governing intelligence did not classify this Crystal result as publication-safe."
      };
    }


    if (
      crystal.disclosure
        ?.public_media_eligible !== true
    ) {
      return {
        ok: false,

        status:
          "PUBLIC_DISCLOSURE_NOT_AUTHORIZED",

        crystal_id:
          crystal.crystal_id,

        reason:
          "Crystal intelligence exists but is not authorized for PUBLIC_MEDIA disclosure."
      };
    }


    return {
      ok: true,

      candidate_reference_type:
        "CRYSTAL_MEDIA_CANDIDATE_REFERENCE",

      source_crystal_id:
        crystal.crystal_id,

      source_intelligence_id:
        crystal.intelligence_id,

      source_authority:
        crystal.intelligence_authority,

      intelligence_receipt_id:
        crystal.intelligence_receipt_id,

      athlete_id:
        crystal.athlete_id,

      snapshot_id:
        crystal.snapshot_id,

      program_id:
        crystal.program_id,

      why:
        clone(
          crystal.why
        ),

      disclosure_scope:
        crystal.disclosure.scope,

      disclosure_authority_reference:
        crystal.disclosure
          .disclosure_authority_reference,

      publication_authorized:
        false,

      doctrine: {
        candidate_is_not_approved:
          true,

        crystal_match_is_not_program_interest:
          true
      }
    };
  }


  /* ==========================================================
     PROGRAM → ATHLETES GOVERNED SET

     Stream 7 does not evaluate athletes or assign order.

     The upstream authority must supply each match and, where
     applicable, governed rank/order.
  ========================================================== */

  function buildProgramMatchPublication(
    governedSet = {}
  ) {
    const matches =
      Array.isArray(
        governedSet.matches
      )
        ? governedSet.matches
        : [];


    if (
      !clean(
        governedSet.intelligence_authority
      )
    ) {
      return {
        ok: false,

        status:
          "GOVERNING_INTELLIGENCE_AUTHORITY_REQUIRED"
      };
    }


    const results = [];

    const errors = [];


    matches.forEach(
      (match, index) => {

        const merged = {
          ...match,

          intelligence_authority:
            match.intelligence_authority ||
            governedSet
              .intelligence_authority,

          authority_version:
            match.authority_version ||
            governedSet
              .authority_version,

          program_id:
            match.program_id ||
            governedSet.program_id,

          program_name:
            match.program_name ||
            governedSet.program_name
        };


        const crystal =
          buildCrystalPublication(
            merged
          );


        if (crystal.ok) {
          results.push(
            crystal
          );
        } else {
          errors.push({
            index,
            errors:
              crystal.errors ||
              [crystal.status]
          });
        }
      }
    );


    /*
      Presentation ordering uses GOVERNED ranking_position only.

      No Stream 7 match score sorting is performed.
    */
    const ordered =
      results.sort(
        (a, b) => {

          const rankA =
            Number(
              a.ranking_position
            );

          const rankB =
            Number(
              b.ranking_position
            );


          if (
            Number.isFinite(rankA) &&
            Number.isFinite(rankB)
          ) {
            return rankA - rankB;
          }

          if (
            Number.isFinite(rankA)
          ) {
            return -1;
          }

          if (
            Number.isFinite(rankB)
          ) {
            return 1;
          }

          return 0;
        }
      );


    return {
      ok: true,

      registry_version:
        VERSION,

      intelligence_authority:
        governedSet
          .intelligence_authority,

      authority_version:
        governedSet
          .authority_version ||
        null,

      program_id:
        governedSet.program_id ||
        null,

      program_name:
        governedSet.program_name ||
        null,

      total_candidates:
        ordered.length,

      matches:
        ordered,

      rejected_matches:
        errors,

      intelligence_receipt_id:
        governedSet
          .intelligence_receipt_id ||
        null,

      composed_at:
        nowISO(),

      locked:
        true,

      doctrine: {
        order_consumed_not_calculated:
          true,

        crystal_does_not_rank_candidates:
          true
      }
    };
  }


  /* ==========================================================
     COMPATIBILITY APIs

     Legacy callers may still attempt:

       evaluateAthleteToProgram(athlete, program)

     That raw-data calculation is now constitutionally prohibited.

     A governed intelligence object must be supplied.
  ========================================================== */

  function isGovernedMatchObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      value.intelligence_id &&
      value.intelligence_authority &&
      (
        value.intelligence_type ||
        value.match_type
      )
    );
  }


  function evaluateAthleteToProgram(
    first = {},
    second = {}
  ) {
    /*
      New lawful usage:
      evaluateAthleteToProgram(governedIntelligence)
    */
    if (
      isGovernedMatchObject(first)
    ) {
      return buildCrystalPublication(
        first
      );
    }


    return {
      ok: false,

      status:
        "GOVERNED_MATCH_INTELLIGENCE_REQUIRED",

      message:
        "Stream 7 Crystal no longer calculates athlete-to-program Match Intelligence from raw athlete/program objects. Supply governed Match Intelligence from Stream 9 / the designated intelligence authority.",

      received_raw_athlete:
        Boolean(first),

      received_raw_program:
        Boolean(second),

      doctrine: {
        crystal_publication_is_not_matching_authority:
          true
      }
    };
  }


  function evaluateProgramToAthletes(
    first = {},
    second = []
  ) {
    /*
      New lawful usage:
      evaluateProgramToAthletes(governedSet)
    */
    if (
      first &&
      typeof first === "object" &&
      Array.isArray(first.matches) &&
      first.intelligence_authority
    ) {
      return buildProgramMatchPublication(
        first
      );
    }


    return {
      ok: false,

      status:
        "GOVERNED_PROGRAM_MATCH_SET_REQUIRED",

      message:
        "Stream 7 Crystal does not calculate or rank program-to-athlete matches from raw program/athlete records. Supply a governed Match Intelligence set.",

      doctrine: {
        crystal_does_not_create_candidate_rankings:
          true
      }
    };
  }


  /* ==========================================================
     EXPLAIN
  ========================================================== */

  function explainCrystal(
    crystal = {}
  ) {
    if (!crystal?.ok) {
      return {
        ok: false,
        message:
          "No valid governed Crystal publication is available."
      };
    }

    return {
      ok: true,

      crystal_id:
        crystal.crystal_id,

      intelligence_authority:
        crystal.intelligence_authority,

      match_level:
        crystal.match_level,

      confidence:
        crystal.confidence,

      why:
        clone(
          crystal.why
        ),

      pathway:
        clone(
          crystal.pathway
        ),

      constraints:
        clone(
          crystal.constraints
        ),

      opportunities:
        clone(
          crystal.opportunities
        ),

      intelligence_receipt_id:
        crystal.intelligence_receipt_id
    };
  }


  /* ==========================================================
     REGISTRY
  ========================================================== */

  const CrystalEngine = {
    version:
      VERSION,

    engine_id:
      ENGINE_ID,

    locked:
      true,

    DISCLOSURE_SCOPES,
    CRYSTAL_TYPES,
    VALIDATION_STATES,

    normalize:
      clean,

    nowISO,

    validateGovernedIntelligence,
    resolveDisclosure,
    normalizePathway,

    buildCrystalPublication,
    buildRegistryReference,
    buildMediaCandidateReference,
    buildProgramMatchPublication,

    evaluateAthleteToProgram,
    evaluateProgramToAthletes,

    explainCrystal,

    doctrine: Object.freeze({
      crystal_publication_is_not_matching_authority:
        true,

      matching_intelligence_belongs_upstream:
        true,

      pathway_is_consumed_not_recalculated:
        true,

      why_is_preserved_not_invented:
        true
    })
  };


  window.STATSCORE_CRYSTAL_ENGINE =
    CrystalEngine;


  /* ==========================================================
     LEGACY GLOBAL — FAILS CLOSED ON RAW INPUTS
  ========================================================== */

  window.STATSCORE_RUN_CRYSTAL_MATCH =
    function (
      governedIntelligence,
      legacyProgram
    ) {
      return CrystalEngine
        .evaluateAthleteToProgram(
          governedIntelligence,
          legacyProgram
        );
    };


  window.STATSCORE_BUILD_CRYSTAL_PUBLICATION =
    function (
      governedIntelligence,
      options
    ) {
      return CrystalEngine
        .buildCrystalPublication(
          governedIntelligence,
          options
        );
    };


  window.STATSCORE_BUILD_CRYSTAL_MEDIA_REFERENCE =
    function (crystal) {
      return CrystalEngine
        .buildMediaCandidateReference(
          crystal
        );
    };


  console.info(
    "STATS-CORE Governed Crystal Publication Engine loaded:",
    VERSION
  );

})(); 
