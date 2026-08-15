/* ============================================================
   STATS-CORE™ PROGRAM HEALTH INTELLIGENCE ENGINE

   File:
   statscore-program-intelligence-engine.js

   Version:
   STATSCORE-PROGRAM-INTELLIGENCE-V2-GOVERNED-LONGITUDINAL

   Owner:
   Stream 9 — Enterprise Intelligence Authority

   Purpose:
   Manufacture governed Program Health Intelligence from
   already-governed domain inputs without converting mere
   operational activity into false effectiveness.

   CONTROLLING DOCTRINE

   Professional Activity ≠ Professional Effectiveness

   Exposure ≠ Interest ≠ Communication ≠ Offer ≠ Commitment

   Program Health Intelligence ≠ Publication Authority

   Missing Evidence ≠ Average Score

   Pathway Success ≠ Highest Division Placement

   Development Activity ≠ Athlete Improvement

   Historical State SHALL NOT be overwritten.

   Stream 9 manufactures Program Health Intelligence.
   Stream 5 presents and operationalizes Program Health.
   Stream 7 publishes governed Program Health outputs.

============================================================ */

(function () {
  "use strict";


  /* ==========================================================
     ENGINE IDENTITY
  ========================================================== */

  const ENGINE_ID =
    "statscore-program-intelligence-engine";


  const VERSION =
    "STATSCORE-PROGRAM-INTELLIGENCE-V2-GOVERNED-LONGITUDINAL";


  const INTELLIGENCE_AUTHORITY =
    "Stream 9 — Enterprise Intelligence Authority";


  const RULE_SET = Object.freeze({
    rule_set_id:
      "PROGRAM_HEALTH_INTELLIGENCE_V1",

    version:
      "1.0.0",

    effective_date:
      "2026-08-15",

    authority:
      INTELLIGENCE_AUTHORITY
  });


  /* ==========================================================
     INTELLIGENCE STATES
  ========================================================== */

  const DATA_STATES = Object.freeze({
    VERIFIED:
      "VERIFIED",

    DOCUMENTED:
      "DOCUMENTED",

    PARTIAL:
      "PARTIAL",

    PENDING:
      "PENDING",

    UNVERIFIED:
      "UNVERIFIED",

    INSUFFICIENT_EVIDENCE:
      "INSUFFICIENT_EVIDENCE",

    NOT_MEASURED:
      "NOT_MEASURED",

    NOT_APPLICABLE:
      "NOT_APPLICABLE"
  });


  const HEALTH_STATES = Object.freeze({
    STRONG:
      "STRONG",

    STABLE:
      "STABLE",

    MONITOR:
      "MONITOR",

    INTERVENTION:
      "INTERVENTION_REQUIRED",

    INSUFFICIENT:
      "INSUFFICIENT_EVIDENCE"
  });


  const TREND_STATES = Object.freeze({
    IMPROVING:
      "IMPROVING",

    STABLE:
      "STABLE",

    DECLINING:
      "DECLINING",

    BASELINE:
      "BASELINE",

    UNKNOWN:
      "UNKNOWN"
  });


  /* ==========================================================
     HELPERS
  ========================================================== */

  function log(message, payload) {
    console.info(
      `[STATS-CORE Program Intelligence] ${message}`,
      payload || ""
    );
  }


  function warn(message, payload) {
    console.warn(
      `[STATS-CORE Program Intelligence] ${message}`,
      payload || ""
    );
  }


  function nowISO() {
    return new Date().toISOString();
  }


  function uuid(prefix = "program_intel") {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      `${prefix}_${Date.now()}_` +
      Math.random()
        .toString(36)
        .slice(2)
    );
  }


  function clean(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  }


  function numberOrNull(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const n =
      Number(value);

    return Number.isFinite(n)
      ? n
      : null;
  }


  function clamp(value, min = 0, max = 100) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return Math.max(
      min,
      Math.min(
        max,
        Math.round(value)
      )
    );
  }


  function averageAvailable(values = []) {
    const valid =
      values.filter(
        value =>
          typeof value === "number" &&
          Number.isFinite(value)
      );

    if (!valid.length) {
      return null;
    }

    return clamp(
      valid.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / valid.length
    );
  }


  function ratioScore(
    numerator,
    denominator
  ) {
    const n =
      numberOrNull(numerator);

    const d =
      numberOrNull(denominator);

    if (
      n === null ||
      d === null ||
      d <= 0
    ) {
      return null;
    }

    return clamp(
      (n / d) * 100
    );
  }


  /* ==========================================================
     INPUT AUTHORITY

     Stream 9 consumes already-governed domain outputs.

     Raw activity values may be retained as facts but SHALL NOT
     automatically represent professional effectiveness.
  ========================================================== */

  function domainInput(
    program,
    domain
  ) {
    const domains =
      program?.governed_domains ||
      program?.program_health_domains ||
      {};

    return (
      domains[domain] ||
      null
    );
  }


  function normalizeDomainInput(
    input,
    domain
  ) {
    if (!input) {
      return {
        domain,
        state:
          DATA_STATES.INSUFFICIENT_EVIDENCE,

        score:
          null,

        confidence:
          null,

        evidence_receipt_ids:
          [],

        explanation:
          "No governed domain intelligence supplied.",

        authoritative:
          false
      };
    }


    return {
      domain,

      state:
        clean(
          input.state ||
          input.status ||
          DATA_STATES.DOCUMENTED
        ),

      score:
        clamp(
          numberOrNull(
            input.score
          )
        ),

      confidence:
        clamp(
          numberOrNull(
            input.confidence ??
            input.confidence_score
          )
        ),

      evidence_receipt_ids:
        Array.isArray(
          input.evidence_receipt_ids
        )
          ? [
              ...input
                .evidence_receipt_ids
            ]
          : [],

      intelligence_receipt_id:
        input.intelligence_receipt_id ||
        input.receipt_id ||
        null,

      explanation:
        clean(
          input.explanation ||
          input.why
        ) ||
        "Governed domain intelligence supplied.",

      authoritative:
        input.authoritative !==
        false,

      effective_at:
        input.effective_at ||
        input.generated_at ||
        null,

      raw:
        input
    };
  }


  /* ==========================================================
     ACTIVITY DESCRIPTORS

     These values describe operational activity.

     They DO NOT directly create Program Health effectiveness.
  ========================================================== */

  function buildActivityProfile(program = {}) {
    return {
      athlete_activity: {
        total_athletes:
          numberOrNull(
            program.total_athletes
          ),

        active_athletes:
          numberOrNull(
            program.active_athletes
          ),

        verified_athletes:
          numberOrNull(
            program.verified_athletes
          ),

        updated_profiles:
          numberOrNull(
            program.updated_profiles
          )
      },


      professional_activity: {
        total_coaches:
          numberOrNull(
            program.total_coaches
          ),

        evaluations_submitted:
          numberOrNull(
            program.total_evaluations_submitted
          ),

        verified_evaluators:
          numberOrNull(
            program.verified_evaluators
          ),

        evidence_uploads:
          numberOrNull(
            program.evidence_uploads
          )
      },


      exposure_activity: {
        recruiter_views:
          numberOrNull(
            program.recruiter_visits
          ),

        verified_interactions:
          numberOrNull(
            program.verified_recruiter_interactions
          ),

        event_attendance:
          numberOrNull(
            program.recruiting_event_attendance
          )
      }
    };
  }


  /* ==========================================================
     FALLBACK OBSERVATIONAL DOMAINS

     These are only used where governed summary facts exist.

     Missing evidence remains missing.
  ========================================================== */

  function observationalParticipation(
    program
  ) {
    const scores = [
      ratioScore(
        program.active_athletes,
        program.total_athletes
      ),

      ratioScore(
        program.verified_athletes,
        program.total_athletes
      ),

      ratioScore(
        program.updated_profiles,
        program.total_athletes
      )
    ];


    const score =
      averageAvailable(scores);


    return {
      domain:
        "PARTICIPATION",

      state:
        score === null
          ? DATA_STATES
              .INSUFFICIENT_EVIDENCE
          : DATA_STATES
              .DOCUMENTED,

      score,

      confidence:
        score === null
          ? null
          : 45,

      authoritative:
        false,

      explanation:
        score === null
          ? "Participation facts are insufficient."
          : (
              "Operational participation descriptor only. " +
              "This does not establish professional effectiveness."
            )
    };
  }


  function observationalAcademic(
    program
  ) {
    const onTrack =
      numberOrNull(
        program.on_track_athletes
      );

    const partial =
      numberOrNull(
        program.partial_track_athletes
      );

    const offTrack =
      numberOrNull(
        program.off_track_athletes
      );


    if (
      onTrack === null &&
      partial === null &&
      offTrack === null
    ) {
      return {
        domain:
          "ACADEMIC",

        state:
          DATA_STATES
            .INSUFFICIENT_EVIDENCE,

        score:
          null,

        confidence:
          null,

        authoritative:
          false,

        explanation:
          "No governed academic summary supplied."
      };
    }


    const total =
      (onTrack || 0) +
      (partial || 0) +
      (offTrack || 0);


    if (!total) {
      return {
        domain:
          "ACADEMIC",

        state:
          DATA_STATES
            .INSUFFICIENT_EVIDENCE,

        score:
          null,

        confidence:
          null,

        authoritative:
          false,

        explanation:
          "Academic population is insufficient for scoring."
      };
    }


    const score =
      clamp(
        (
          (
            (onTrack || 0) *
              1.0
          ) +
          (
            (partial || 0) *
              0.5
          ) +
          (
            (offTrack || 0) *
              0
          )
        ) /
        total *
        100
      );


    return {
      domain:
        "ACADEMIC",

      state:
        DATA_STATES
          .DOCUMENTED,

      score,

      confidence:
        45,

      authoritative:
        false,

      explanation:
        (
          "Derived from supplied summary classifications only. " +
          "Course-level academic and eligibility intelligence remains authoritative upstream."
        )
    };
  }


  /* ==========================================================
     PATHWAY OUTCOME

     D1 is NOT inherently better than D2, D3, NAIA, JUCO,
     prep, or another correct governed bridge.

     Success means appropriate pathway target attainment.
  ========================================================== */

  function pathwayEffectiveness(
    program
  ) {
    const governed =
      domainInput(
        program,
        "pathway"
      );


    if (governed) {
      return normalizeDomainInput(
        governed,
        "PATHWAY"
      );
    }


    const successful =
      numberOrNull(
        program
          .successful_pathway_outcomes
      );

    const eligible =
      numberOrNull(
        program
          .pathway_outcomes_evaluated
      );


    const score =
      ratioScore(
        successful,
        eligible
      );


    return {
      domain:
        "PATHWAY",

      state:
        score === null
          ? DATA_STATES
              .INSUFFICIENT_EVIDENCE
          : DATA_STATES
              .DOCUMENTED,

      score,

      confidence:
        score === null
          ? null
          : 40,

      authoritative:
        false,

      explanation:
        score === null
          ? (
              "No governed pathway-effectiveness evidence supplied. " +
              "Division placement counts are not treated as pathway success."
            )
          : (
              "Measures governed target/bridge attainment rather than rewarding higher division labels."
            )
    };
  }


  /* ==========================================================
     DOMAIN RESOLUTION
  ========================================================== */

  function resolveDomains(
    program
  ) {
    const explicit = {
      roster:
        domainInput(
          program,
          "roster"
        ),

      academic:
        domainInput(
          program,
          "academic"
        ),

      development:
        domainInput(
          program,
          "development"
        ),

      recruiting:
        domainInput(
          program,
          "recruiting"
        ),

      exposure:
        domainInput(
          program,
          "exposure"
        ),

      pathway:
        domainInput(
          program,
          "pathway"
        ),

      professional_effectiveness:
        domainInput(
          program,
          "professional_effectiveness"
        )
    };


    return {
      roster:
        explicit.roster
          ? normalizeDomainInput(
              explicit.roster,
              "ROSTER"
            )
          : observationalParticipation(
              program
            ),


      academic:
        explicit.academic
          ? normalizeDomainInput(
              explicit.academic,
              "ACADEMIC"
            )
          : observationalAcademic(
              program
            ),


      development:
        normalizeDomainInput(
          explicit.development,
          "DEVELOPMENT"
        ),


      recruiting:
        normalizeDomainInput(
          explicit.recruiting,
          "RECRUITING"
        ),


      exposure:
        normalizeDomainInput(
          explicit.exposure,
          "EXPOSURE"
        ),


      pathway:
        pathwayEffectiveness(
          program
        ),


      professional_effectiveness:
        normalizeDomainInput(
          explicit
            .professional_effectiveness,
          "PROFESSIONAL_EFFECTIVENESS"
        )
    };
  }


  /* ==========================================================
     EVIDENCE SUFFICIENCY
  ========================================================== */

  function evidenceSufficiency(
    domains
  ) {
    const list =
      Object.values(
        domains
      );


    const measurable =
      list.filter(
        domain =>
          typeof domain.score ===
          "number"
      );


    const authoritative =
      measurable.filter(
        domain =>
          domain.authoritative ===
          true
      );


    return {
      total_domains:
        list.length,

      measurable_domains:
        measurable.length,

      authoritative_domains:
        authoritative.length,

      coverage_percent:
        clamp(
          (
            measurable.length /
            list.length
          ) *
          100
        ),

      authoritative_coverage_percent:
        clamp(
          (
            authoritative.length /
            list.length
          ) *
          100
        )
    };
  }


  /* ==========================================================
     CONFIDENCE

     Confidence is separate from score.
  ========================================================== */

  function calculateConfidence(
    domains,
    sufficiency
  ) {
    const supplied =
      Object
        .values(domains)
        .map(
          domain =>
            numberOrNull(
              domain.confidence
            )
        )
        .filter(
          value =>
            value !== null
        );


    const domainConfidence =
      averageAvailable(
        supplied
      );


    if (
      domainConfidence === null
    ) {
      return {
        score:
          null,

        state:
          DATA_STATES
            .INSUFFICIENT_EVIDENCE,

        explanation:
          "No governed confidence values supplied."
      };
    }


    const coverageAdjustment =
      (
        sufficiency
          .coverage_percent /
        100
      );


    const score =
      clamp(
        domainConfidence *
        coverageAdjustment
      );


    return {
      score,

      state:
        score >= 80
          ? "HIGH"
          : score >= 60
            ? "MODERATE"
            : "LOW",

      explanation:
        "Confidence reflects domain confidence and evidence coverage; it does not modify the underlying facts."
    };
  }


  /* ==========================================================
     PROGRAM HEALTH AGGREGATION

     Only measurable domains participate.

     Missing domains do not receive synthetic 40/50 values.
  ========================================================== */

  function aggregateProgramHealth(
    domains
  ) {
    const scored =
      Object
        .values(domains)
        .filter(
          domain =>
            typeof domain.score ===
            "number"
        );


    if (!scored.length) {
      return {
        score:
          null,

        state:
          HEALTH_STATES
            .INSUFFICIENT,

        explanation:
          "No measurable governed Program Health domains are available."
      };
    }


    const score =
      averageAvailable(
        scored.map(
          domain =>
            domain.score
        )
      );


    let state =
      HEALTH_STATES.MONITOR;


    if (score >= 85) {
      state =
        HEALTH_STATES.STRONG;

    } else if (score >= 70) {
      state =
        HEALTH_STATES.STABLE;

    } else if (score >= 55) {
      state =
        HEALTH_STATES.MONITOR;

    } else {
      state =
        HEALTH_STATES.INTERVENTION;
    }


    return {
      score,

      state,

      explanation:
        (
          "Program Health is synthesized from available governed domains. " +
          "Missing domains remain missing and do not receive artificial midpoint scores."
        )
    };
  }


  /* ==========================================================
     STRENGTHS / GAPS
  ========================================================== */

  function determineStrengths(
    domains
  ) {
    return Object
      .values(domains)
      .filter(
        domain =>
          typeof domain.score ===
            "number" &&
          domain.score >= 80
      )
      .map(
        domain => ({
          domain:
            domain.domain,

          score:
            domain.score,

          explanation:
            domain.explanation
        })
      );
  }


  function determineGaps(
    domains
  ) {
    return Object
      .values(domains)
      .filter(
        domain =>
          typeof domain.score ===
            "number" &&
          domain.score < 60
      )
      .map(
        domain => ({
          domain:
            domain.domain,

          score:
            domain.score,

          explanation:
            domain.explanation
        })
      );
  }


  /* ==========================================================
     LONGITUDINAL INTELLIGENCE
  ========================================================== */

  function compareSnapshots(
    current,
    previous
  ) {
    if (
      !current ||
      !previous ||
      typeof current.program_health_score !==
        "number" ||
      typeof previous.program_health_score !==
        "number"
    ) {
      return {
        state:
          TREND_STATES.BASELINE,

        delta:
          null,

        explanation:
          "No comparable previous governed Program Health state supplied."
      };
    }


    const delta =
      current.program_health_score -
      previous.program_health_score;


    let state =
      TREND_STATES.STABLE;


    if (delta >= 5) {
      state =
        TREND_STATES.IMPROVING;

    } else if (delta <= -5) {
      state =
        TREND_STATES.DECLINING;
    }


    return {
      state,

      delta,

      previous_intelligence_id:
        previous.program_intelligence_id ||
        previous.intelligence_id ||
        null,

      previous_receipt_id:
        previous.intelligence_receipt_id ||
        previous.receipt_id ||
        null,

      explanation:
        `Program Health changed by ${delta} points across governed intelligence states.`
    };
  }


  /* ==========================================================
     PRIORITY

     Priority describes intelligence state.
     It does not directly assign work to professionals.
  ========================================================== */

  function determinePriority(
    health,
    gaps
  ) {
    if (
      health.state ===
      HEALTH_STATES.INTERVENTION
    ) {
      return "RED";
    }


    if (
      health.state ===
      HEALTH_STATES.MONITOR ||
      gaps.length
    ) {
      return "YELLOW";
    }


    if (
      health.state ===
      HEALTH_STATES.STRONG ||
      health.state ===
      HEALTH_STATES.STABLE
    ) {
      return "GREEN";
    }


    return "PENDING";
  }


  /* ==========================================================
     EXPLAINABILITY
  ========================================================== */

  function buildWhy(
    domains,
    health,
    confidence,
    sufficiency
  ) {
    return {
      question:
        "Why is STATS-CORE reporting this Program Health state?",

      answer:
        health.explanation,

      evidence_coverage:
        sufficiency,

      confidence,

      domain_explanations:
        Object
          .values(domains)
          .map(
            domain => ({
              domain:
                domain.domain,

              state:
                domain.state,

              score:
                domain.score,

              confidence:
                domain.confidence,

              explanation:
                domain.explanation,

              intelligence_receipt_id:
                domain
                  .intelligence_receipt_id ||
                null
            })
          )
    };
  }


  /* ==========================================================
     INTELLIGENCE RECEIPT
  ========================================================== */

  function buildReceipt(
    result
  ) {
    return {
      receipt_id:
        uuid(
          "program_intel_receipt"
        ),

      receipt_type:
        "PROGRAM_HEALTH_INTELLIGENCE_RECEIPT",

      intelligence_id:
        result.program_intelligence_id,

      intelligence_authority:
        INTELLIGENCE_AUTHORITY,

      rule_set:
        RULE_SET,

      program_id:
        result.program_id,

      organization_id:
        result.organization_id,

      program_health_score:
        result.program_health_score,

      health_state:
        result.health_state,

      confidence:
        result.confidence,

      evidence_sufficiency:
        result.evidence_sufficiency,

      generated_at:
        result.generated_at,

      immutable:
        true
    };
  }


  /* ==========================================================
     MAIN PROGRAM HEALTH INTELLIGENCE
  ========================================================== */

  function calculateProgramIntelligence(
    program,
    options = {}
  ) {
    if (!program) {
      return {
        ok:false,
        status:"NO_PROGRAM"
      };
    }


    const domains =
      resolveDomains(
        program
      );


    const sufficiency =
      evidenceSufficiency(
        domains
      );


    const health =
      aggregateProgramHealth(
        domains
      );


    const confidence =
      calculateConfidence(
        domains,
        sufficiency
      );


    const strengths =
      determineStrengths(
        domains
      );


    const gaps =
      determineGaps(
        domains
      );


    const generatedAt =
      nowISO();


    const intelligenceId =
      uuid(
        "program_intelligence"
      );


    const base = {
      ok:true,

      engine_id:
        ENGINE_ID,

      engine_version:
        VERSION,

      intelligence_authority:
        INTELLIGENCE_AUTHORITY,

      intelligence_version:
        RULE_SET.version,

      rule_set:
        RULE_SET,

      program_intelligence_id:
        intelligenceId,

      program_id:
        program.program_id ||
        null,

      organization_id:
        program.organization_id ||
        null,

      program_name:
        clean(
          program.program_name
        ) ||
        "Program",

      sport_scope:
        clean(
          program.sport_scope ||
          program.sport
        ) ||
        null,

      effective_at:
        options.effective_at ||
        program.effective_at ||
        generatedAt,

      generated_at:
        generatedAt,

      program_health_score:
        health.score,

      health_score:
        health.score,

      health_state:
        health.state,

      health_signal:
        health.state,

      confidence:
        confidence.score,

      confidence_state:
        confidence.state,

      evidence_sufficiency:
        sufficiency,

      domains,

      roster_state:
        domains.roster.state,

      academic_state:
        domains.academic.state,

      development_state:
        domains.development.state,

      recruiting_state:
        domains.recruiting.state,

      exposure_state:
        domains.exposure.state,

      pathway_state:
        domains.pathway.state,

      professional_effectiveness_state:
        domains
          .professional_effectiveness
          .state,

      strengths,

      gaps,

      priority_state:
        determinePriority(
          health,
          gaps
        ),

      activity_profile:
        buildActivityProfile(
          program
        ),

      explainability:
        buildWhy(
          domains,
          health,
          confidence,
          sufficiency
        ),

      explainability_reference:
        intelligenceId,

      recommendation_ids:
        Array.isArray(
          program
            .governed_recommendation_ids
        )
          ? [
              ...program
                .governed_recommendation_ids
            ]
          : [],

      publication_candidate:
        {
          candidate:
            health.score !== null &&
            confidence.score !== null,

          candidate_type:
            "PROGRAM_HEALTH_PUBLICATION_CANDIDATE",

          reason:
            (
              "Stream 9 may nominate governed Program Health intelligence " +
              "for Stream 7 editorial/publication consideration. " +
              "This does not authorize publication."
            )
        },

      locked:
        true
    };


    const trend =
      compareSnapshots(
        base,
        options.previous_intelligence ||
        null
      );


    const result = {
      ...base,

      longitudinal:
        trend
    };


    const receipt =
      buildReceipt(
        result
      );


    result.intelligence_receipt_id =
      receipt.receipt_id;


    result.receipt =
      receipt;


    return result;
  }


  /* ==========================================================
     GOVERNED RANKING

     Rankings require an explicit population/rule context.
  ========================================================== */

  function buildTop10Programs(
    programs = [],
    rankingContext = {}
  ) {
    const required = [
      "ranking_authority",
      "population_id",
      "sport_scope",
      "geographic_scope",
      "time_period",
      "minimum_evidence_coverage",
      "ranking_version"
    ];


    const missing =
      required.filter(
        key =>
          rankingContext[key] ===
            null ||
          rankingContext[key] ===
            undefined ||
          rankingContext[key] ===
            ""
      );


    if (missing.length) {
      return {
        ok:false,

        status:
          "RANKING_CONTEXT_INCOMPLETE",

        missing,

        message:
          "Program ranking cannot be manufactured without a governed population and ranking authority."
      };
    }


    const threshold =
      Number(
        rankingContext
          .minimum_evidence_coverage
      );


    const calculated =
      programs
        .map(
          program =>
            calculateProgramIntelligence(
              program
            )
        )
        .filter(
          result =>
            result.ok &&
            typeof result.program_health_score ===
              "number" &&
            (
              result
                .evidence_sufficiency
                .coverage_percent >=
              threshold
            )
        )
        .sort(
          (a,b) =>
            b.program_health_score -
            a.program_health_score
        );


    const board =
      calculated
        .slice(0,10)
        .map(
          (program,index) => ({
            rank:
              index + 1,

            program_id:
              program.program_id,

            organization_id:
              program.organization_id,

            program_name:
              program.program_name,

            score:
              program.program_health_score,

            confidence:
              program.confidence,

            intelligence_receipt_id:
              program.intelligence_receipt_id
          })
        );


    return {
      ok:true,

      ranking_authority:
        rankingContext.ranking_authority,

      ranking_version:
        rankingContext.ranking_version,

      population_id:
        rankingContext.population_id,

      sport_scope:
        rankingContext.sport_scope,

      geographic_scope:
        rankingContext.geographic_scope,

      time_period:
        rankingContext.time_period,

      minimum_evidence_coverage:
        threshold,

      tie_policy:
        rankingContext.tie_policy ||
        "SAME_SCORE_REQUIRES_GOVERNED_TIE_RULE",

      generated_at:
        nowISO(),

      board
    };
  }


  /* ==========================================================
     RENDERING

     Presentation only.
  ========================================================== */

  function renderProgramPanel(
    container,
    result
  ) {
    if (
      !container ||
      !result ||
      !result.ok
    ) {
      return false;
    }


    const score =
      result.program_health_score ===
        null
        ? "Pending"
        : result.program_health_score;


    const confidence =
      result.confidence ===
        null
        ? "Pending"
        : result.confidence;


    container.innerHTML = `

      <div style="
        border:1px solid rgba(255,255,255,.18);
        background:rgba(255,255,255,.03);
        padding:20px;
        color:#f4f2ef;
      ">

        <div style="
          color:#ff3434;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          Governed Program Health Intelligence
        </div>

        <div style="
          margin-top:12px;
          font-size:34px;
          font-weight:1000;
        ">
          ${result.program_name}
        </div>

        <div style="
          margin-top:18px;
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:12px;
        ">

          <div>
            <div style="
              color:#9ea7b5;
              font-size:11px;
              text-transform:uppercase;
            ">
              Program Health
            </div>

            <div style="
              margin-top:6px;
              font-size:36px;
              font-weight:1000;
            ">
              ${score}
            </div>
          </div>

          <div>
            <div style="
              color:#9ea7b5;
              font-size:11px;
              text-transform:uppercase;
            ">
              State
            </div>

            <div style="
              margin-top:10px;
              font-size:15px;
              font-weight:900;
              color:#9fe7ff;
            ">
              ${result.health_state}
            </div>
          </div>

          <div>
            <div style="
              color:#9ea7b5;
              font-size:11px;
              text-transform:uppercase;
            ">
              Confidence
            </div>

            <div style="
              margin-top:10px;
              font-size:15px;
              font-weight:900;
              color:#ffb100;
            ">
              ${confidence}
            </div>
          </div>

        </div>

        <div style="
          margin-top:20px;
          border-top:1px solid rgba(255,255,255,.1);
          padding-top:14px;
          color:#b9c4d6;
          font-size:12px;
          line-height:1.5;
        ">
          Intelligence Receipt:
          ${result.intelligence_receipt_id}
          <br>
          Rule Set:
          ${result.rule_set.rule_set_id}
          · ${result.rule_set.version}
        </div>

      </div>
    `;


    return true;
  }


  /* ==========================================================
     CURRENT PROGRAM
  ========================================================== */

  function runCurrentProgram(
    options = {}
  ) {
    const current =
      window.STATScoreCurrentProgram ||
      window.__STATSCORE_CURRENT_PROGRAM__ ||
      null;


    if (!current) {
      warn(
        "No current governed program object found."
      );

      return null;
    }


    const result =
      calculateProgramIntelligence(
        current,
        options
      );


    window
      .STATScoreCurrentProgramIntelligence =
      result;


    window
      .STATScoreCurrentProgramHealthIntelligence =
      result;


    const panel =
      document.querySelector(
        "#scProgramIntelligencePanel"
      ) ||
      document.querySelector(
        "[data-program-intelligence]"
      );


    if (panel) {
      renderProgramPanel(
        panel,
        result
      );
    }


    window.dispatchEvent(
      new CustomEvent(
        "statscore:program-health-intelligence-ready",
        {
          detail:
            result
        }
      )
    );


    return result;
  }


  /* ==========================================================
     STREAM 5 REFRESH REQUEST
  ========================================================== */

  window.addEventListener(
    "statscore:program-health-intelligence-request",
    event => {

      log(
        "Program Health intelligence refresh requested.",
        event.detail
      );


      runCurrentProgram();
    }
  );


  /* ==========================================================
     INIT
  ========================================================== */

  function init() {
    if (
      window
        .__STATSCORE_PROGRAM_INTELLIGENCE_ENGINE__
    ) {
      warn(
        "Duplicate initialization blocked."
      );

      return;
    }


    window
      .__STATSCORE_PROGRAM_INTELLIGENCE_ENGINE__ =
      true;


    window
      .STATScoreProgramIntelligenceEngine =
      {
        engine_id:
          ENGINE_ID,

        version:
          VERSION,

        authority:
          INTELLIGENCE_AUTHORITY,

        rule_set:
          RULE_SET,

        DATA_STATES,
        HEALTH_STATES,
        TREND_STATES,

        calculateProgramIntelligence,
        buildTop10Programs,
        renderProgramPanel,
        runCurrentProgram,

        compareSnapshots
      };


    window.STATScore =
      window.STATScore ||
      {};


    window
      .STATScore
      .ProgramIntelligenceEngine =
      window
        .STATScoreProgramIntelligenceEngine;


    const result =
      runCurrentProgram();


    if (
      window
        .STATScoreEngineBus
        ?.emit
    ) {
      window
        .STATScoreEngineBus
        .emit(
          "engine_online",
          {
            engine:
              ENGINE_ID,

            version:
              VERSION,

            authority:
              INTELLIGENCE_AUTHORITY,

            status:
              "ONLINE",

            intelligence_generated:
              !!(
                result &&
                result.ok
              )
          }
        );
    }


    log(
      "Engine online.",
      {
        engine:
          ENGINE_ID,

        version:
          VERSION,

        authority:
          INTELLIGENCE_AUTHORITY
      }
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {
    init();
  }

})(); 
