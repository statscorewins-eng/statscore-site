/* ============================================================
   STATS-CORE™ PROFILE ENGINE
   File: statscore-profile-engine.js
   Version: STATSCORE-PROFILE-ENGINE-V2-GOVERNED-PROJECTION

   Owner:
   Stream 3 — Athlete Intelligence Presentation Authority

   Classification:
   Governed Athlete Profile Projection / Presentation Engine

   Purpose:
   Assemble presentation-safe athlete profile models from
   already-governed identity, disclosure, intelligence,
   explainability, and publication state.

   Constitutional Boundaries:

   Stream 2
   → owns athlete source records and snapshot preservation.

   Stream 3
   → owns athlete profile presentation.

   Stream 5
   → owns professional workspace and operational permissions.

   Stream 6
   → owns communication governance.

   Stream 7
   → owns publication / exposure authority.

   Stream 9
   → owns governed athlete intelligence and explainability.

   Stream 10
   → owns professional certification / credential trust.

   Core Doctrine:

   PRESENTATION ≠ INTELLIGENCE AUTHORITY

   SOURCE DATA ≠ GOVERNED INTELLIGENCE

   IDENTITY ≠ DISCLOSURE AUTHORITY

   ROLE ≠ ATHLETE SCOPE

   MISSING AUTHORITY ≠ PERMISSION TO RECONSTRUCT AUTHORITY

   Stream 3 may format, organize, label, and render
   already-governed intelligence.

   Stream 3 may not:
   - calculate scores;
   - recalculate domain intelligence;
   - synthesize athlete state;
   - create pathway intelligence;
   - create recommendations;
   - create evaluator drafts;
   - manufacture verification;
   - manufacture publication authority;
   - infer recruiting interest;
   - establish local thresholds;
   - create athlete classifications from raw values;
   - retain unrestricted source snapshots in profile outputs.

============================================================ */

(function (global) {
  "use strict";

  global.STATScore =
    global.STATScore || {};

  const ENGINE =
    "statscore-profile-engine.js";

  const VERSION =
    "STATSCORE-PROFILE-ENGINE-V2-GOVERNED-PROJECTION";

  const OWNER_STREAM =
    "STREAM_3_ATHLETE_INTELLIGENCE_PRESENTATION";

  const STATUS = Object.freeze({
    READY:
      "READY",

    PROFILE_PACKAGE_REQUIRED:
      "PROFILE_PACKAGE_REQUIRED",

    DISCLOSURE_REQUIRED:
      "DISCLOSURE_REQUIRED",

    IDENTITY_UNAVAILABLE:
      "IDENTITY_UNAVAILABLE",

    INTELLIGENCE_UNAVAILABLE:
      "INTELLIGENCE_UNAVAILABLE",

    EXPLAINABILITY_UNAVAILABLE:
      "EXPLAINABILITY_UNAVAILABLE",

    PUBLICATION_UNAVAILABLE:
      "PUBLICATION_UNAVAILABLE",

    PARTIAL:
      "PARTIAL",

    BLOCKED:
      "BLOCKED"
  });

  const AUDIENCE = Object.freeze({
    ATHLETE: "athlete",
    PARENT: "parent",
    COACH: "coach",
    COUNSELOR: "counselor",
    RECRUITER: "recruiter",
    EVALUATOR: "evaluator",
    TRAINER: "trainer",
    PROGRAM: "program",
    ADMIN: "admin",
    PROFESSIONAL: "professional"
  });

  /* ============================================================
     UTILITIES
  ============================================================ */

  function nowISO() {
    return new Date().toISOString();
  }

  function normalize(value) {
    return String(value ?? "").trim();
  }

  function lower(value) {
    return normalize(value).toLowerCase();
  }

  function upper(value) {
    return normalize(value).toUpperCase();
  }

  function hasObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function safeArray(value) {
    return Array.isArray(value)
      ? value.filter(
          item =>
            item !== undefined &&
            item !== null
        )
      : [];
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (_) {
      return value;
    }
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return null;
  }

  function escapeHTML(value) {
    return String(
      value ?? ""
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeAudience(value) {
    const role =
      lower(
        value ||
        AUDIENCE.ATHLETE
      );

    return Object.values(
      AUDIENCE
    ).includes(role)
      ? role
      : AUDIENCE.ATHLETE;
  }

  /* ============================================================
     INPUT CONTRACT

     Expected upstream package:

     {
       identity,
       disclosure,
       intelligence,
       explainability,
       publication,
       governance,
       audience,
       authority_lineage
     }

     No raw source record is required or accepted as authority.
  ============================================================ */

  function normalizeInput(input = {}) {
    if (!hasObject(input)) {
      return null;
    }

    const packageInput =
      hasObject(
        input.profile_package
      )
        ? input.profile_package
        : input;

    return {
      audience:
        normalizeAudience(
          firstDefined(
            packageInput.audience,
            input.audience
          )
        ),

      identity:
        hasObject(
          packageInput.identity
        )
          ? clone(
              packageInput.identity
            )
          : null,

      disclosure:
        hasObject(
          packageInput.disclosure
        )
          ? clone(
              packageInput.disclosure
            )
          : null,

      intelligence:
        hasObject(
          packageInput.intelligence
        )
          ? clone(
              packageInput.intelligence
            )
          : null,

      explainability:
        hasObject(
          packageInput.explainability
        )
          ? clone(
              packageInput.explainability
            )
          : null,

      publication:
        hasObject(
          packageInput.publication
        )
          ? clone(
              packageInput.publication
            )
          : null,

      governance:
        hasObject(
          packageInput.governance
        )
          ? clone(
              packageInput.governance
            )
          : null,

      authority_lineage:
        safeArray(
          packageInput.authority_lineage
        ),

      source_status:
        firstDefined(
          packageInput.status,
          packageInput.source_status
        ),

      generated_at:
        packageInput.generated_at ||
        null
    };
  }

  /* ============================================================
     DISCLOSURE VALIDATION
  ============================================================ */

  function validateDisclosure(model) {
    if (
      !model ||
      !hasObject(
        model.disclosure
      )
    ) {
      return {
        ok: false,
        status:
          STATUS.DISCLOSURE_REQUIRED,
        message:
          "A governed disclosure projection is required before profile presentation."
      };
    }

    const disclosure =
      model.disclosure;

    if (
      disclosure.authorized === false ||
      upper(
        disclosure.status
      ) === "DENIED" ||
      upper(
        disclosure.status
      ) === "BLOCKED"
    ) {
      return {
        ok: false,
        status:
          STATUS.BLOCKED,
        message:
          "The current profile disclosure projection is not authorized."
      };
    }

    return {
      ok: true,
      status:
        "AUTHORIZED"
    };
  }

  function validateIdentity(model) {
    if (
      !model ||
      !hasObject(
        model.identity
      )
    ) {
      return {
        ok: false,
        status:
          STATUS.IDENTITY_UNAVAILABLE,
        message:
          "Governed athlete identity is unavailable."
      };
    }

    if (
      !model.identity.athlete_id ||
      !model.identity.snapshot_id
    ) {
      return {
        ok: false,
        status:
          STATUS.IDENTITY_UNAVAILABLE,
        message:
          "athlete_id and snapshot_id are required for governed profile presentation."
      };
    }

    return {
      ok: true,
      status:
        "IDENTITY_VALID"
    };
  }

  /* ============================================================
     IDENTITY PRESENTATION MODEL
  ============================================================ */

  function buildIdentityPresentation(
    identity = {}
  ) {
    return {
      athlete_id:
        identity.athlete_id ||
        null,

      snapshot_id:
        identity.snapshot_id ||
        null,

      athlete_display_name:
        firstDefined(
          identity.athlete_display_name,
          identity.athlete_name,
          "Athlete"
        ),

      first_name:
        firstDefined(
          identity.first_name,
          null
        ),

      last_name:
        firstDefined(
          identity.last_name,
          null
        ),

      sport:
        firstDefined(
          identity.sport,
          identity.primary_sport,
          "Unavailable"
        ),

      position:
        firstDefined(
          identity.position,
          identity.primary_position,
          "Unavailable"
        ),

      secondary_position:
        firstDefined(
          identity.secondary_position,
          null
        ),

      graduation_class:
        firstDefined(
          identity.graduation_class,
          "Unavailable"
        ),

      school:
        firstDefined(
          identity.school,
          identity.school_program,
          "Unavailable"
        ),

      city_state:
        firstDefined(
          identity.city_state,
          "Unavailable"
        ),

      height:
        firstDefined(
          identity.height,
          "Unavailable"
        ),

      weight:
        firstDefined(
          identity.weight,
          "Unavailable"
        ),

      jersey_number:
        firstDefined(
          identity.jersey_number,
          null
        ),

      headshot_url:
        firstDefined(
          identity.headshot_url,
          identity.headshot_public_url,
          null
        ),

      verification_status:
        firstDefined(
          identity.verification_status,
          "UNAVAILABLE"
        ),

      snapshot_status:
        firstDefined(
          identity.snapshot_status,
          "UNAVAILABLE"
        )
    };
  }

  /* ============================================================
     GOVERNED INTELLIGENCE PRESENTATION

     No score or state calculation occurs here.
  ============================================================ */

  function buildIntelligencePresentation(
    intelligence
  ) {
    if (
      !hasObject(
        intelligence
      )
    ) {
      return {
        available:
          false,

        status:
          STATUS.INTELLIGENCE_UNAVAILABLE,

        score:
          null,

        score_status:
          "UNAVAILABLE",

        star_signal:
          null,

        readiness:
          null,

        pathway:
          null,

        academic:
          null,

        development:
          null,

        verification:
          null,

        production:
          null,

        exposure:
          null,

        composite:
          null,

        recommendations:
          [],

        next_best_action:
          null,

        risk_flags:
          [],

        confidence_limiters:
          [],

        authority_lineage:
          []
      };
    }

    const domains =
      hasObject(
        intelligence.domains
      )
        ? intelligence.domains
        : {};

    return {
      available:
        true,

      status:
        firstDefined(
          intelligence.status,
          intelligence.publication_status,
          "AVAILABLE"
        ),

      score:
        clone(
          firstDefined(
            intelligence.final_score,
            intelligence.score,
            intelligence.composite?.score,
            intelligence.composite?.composite_score
          )
        ),

      score_status:
        firstDefined(
          intelligence.score_status,
          intelligence.composite?.status,
          intelligence.status,
          "PENDING"
        ),

      star_signal:
        clone(
          firstDefined(
            intelligence.star_signal,
            intelligence.report_card?.star_signal
          )
        ),

      readiness:
        clone(
          firstDefined(
            domains.readiness,
            intelligence.readiness
          )
        ),

      pathway:
        clone(
          firstDefined(
            domains.pathway,
            intelligence.pathway
          )
        ),

      academic:
        clone(
          firstDefined(
            domains.academic,
            intelligence.academic
          )
        ),

      development:
        clone(
          firstDefined(
            domains.training,
            intelligence.development,
            intelligence.training
          )
        ),

      verification:
        clone(
          firstDefined(
            domains.verification,
            intelligence.verification
          )
        ),

      production:
        clone(
          firstDefined(
            domains.production,
            intelligence.production
          )
        ),

      exposure:
        clone(
          firstDefined(
            domains.exposure,
            intelligence.exposure
          )
        ),

      composite:
        clone(
          intelligence.composite ||
          null
        ),

      recommendations:
        clone(
          safeArray(
            intelligence.recommendations?.actions ||
            intelligence.recommendations
          )
        ),

      next_best_action:
        clone(
          firstDefined(
            intelligence.recommendations
              ?.next_best_action,
            intelligence.next_best_action,
            intelligence.report_card
              ?.next_best_action
          )
        ),

      risk_flags:
        clone(
          safeArray(
            intelligence.risk_flags ||
            intelligence.flags
          )
        ),

      confidence_limiters:
        clone(
          safeArray(
            intelligence.confidence_limiters
          )
        ),

      authority_lineage:
        clone(
          safeArray(
            intelligence.authority_lineage
          )
        )
    };
  }

  /* ============================================================
     EXPLAINABILITY PRESENTATION
  ============================================================ */

  function buildExplainabilityPresentation(
    explainability
  ) {
    if (
      !hasObject(
        explainability
      )
    ) {
      return {
        available:
          false,

        status:
          STATUS.EXPLAINABILITY_UNAVAILABLE,

        summary:
          "Governed explainability is unavailable.",

        explanations:
          {},

        availability_flags:
          [],

        risk_flags:
          [],

        confidence_limiters:
          [],

        recommended_actions:
          [],

        next_best_action:
          null,

        authority_lineage:
          []
      };
    }

    return {
      available:
        true,

      status:
        firstDefined(
          explainability.status,
          "AVAILABLE"
        ),

      summary:
        firstDefined(
          explainability.summary,
          "Governed intelligence explanation available."
        ),

      explanations:
        clone(
          explainability.explanations ||
          {}
        ),

      availability_flags:
        clone(
          safeArray(
            explainability.availability_flags
          )
        ),

      risk_flags:
        clone(
          safeArray(
            explainability.risk_flags
          )
        ),

      confidence_limiters:
        clone(
          safeArray(
            explainability.confidence_limiters
          )
        ),

      recommended_actions:
        clone(
          safeArray(
            explainability.recommended_actions
          )
        ),

      next_best_action:
        clone(
          explainability.next_best_action ||
          null
        ),

      authority_lineage:
        clone(
          safeArray(
            explainability.authority_lineage
          )
        )
    };
  }

  /* ============================================================
     PUBLICATION PRESENTATION

     This engine does not determine publication permission.
     It displays supplied Stream 7 publication state only.
  ============================================================ */

  function buildPublicationPresentation(
    publication
  ) {
    if (
      !hasObject(
        publication
      )
    ) {
      return {
        available:
          false,

        status:
          STATUS.PUBLICATION_UNAVAILABLE,

        public_profile_authorized:
          false,

        media_publication_authorized:
          false,

        recruiting_disclosure_authorized:
          false,

        publication_state:
          "UNAVAILABLE",

        disclosure_class:
          "UNAVAILABLE"
      };
    }

    return {
      available:
        true,

      status:
        firstDefined(
          publication.status,
          publication.publication_state,
          "AVAILABLE"
        ),

      public_profile_authorized:
        publication.public_profile_authorized ===
        true,

      media_publication_authorized:
        publication.media_publication_authorized ===
        true,

      recruiting_disclosure_authorized:
        publication.recruiting_disclosure_authorized ===
        true,

      publication_state:
        firstDefined(
          publication.publication_state,
          publication.status,
          "UNAVAILABLE"
        ),

      disclosure_class:
        firstDefined(
          publication.disclosure_class,
          publication.visibility_class,
          "UNAVAILABLE"
        ),

      publication_id:
        firstDefined(
          publication.publication_id,
          null
        ),

      authority_lineage:
        clone(
          safeArray(
            publication.authority_lineage
          )
        )
    };
  }

  /* ============================================================
     PROFILE BANNER

     IMPORTANT:
     This does not derive status from score thresholds.
     It only renders already-governed labels.
  ============================================================ */

  function buildBanner(
    model,
    intelligence,
    publication
  ) {
    const governedBanner =
      firstDefined(
        model.intelligence
          ?.report_card
          ?.profile_banner,

        model.intelligence
          ?.profile_banner,

        model.explainability
          ?.report_card
          ?.profile_banner,

        model.publication
          ?.profile_banner
      );

    if (
      hasObject(
        governedBanner
      )
    ) {
      return {
        label:
          firstDefined(
            governedBanner.label,
            "ATHLETE PROFILE"
          ),

        tone:
          firstDefined(
            governedBanner.tone,
            "neutral"
          ),

        explanation:
          firstDefined(
            governedBanner.explanation,
            governedBanner.reason,
            "Governed profile status supplied by upstream authority."
          ),

        authority:
          firstDefined(
            governedBanner.authority,
            governedBanner.authority_key,
            null
          ),

        generated_here:
          false
      };
    }

    if (
      publication.public_profile_authorized
    ) {
      return {
        label:
          "GOVERNED ATHLETE PROFILE",

        tone:
          "neutral",

        explanation:
          "Profile is being rendered from authorized governed identity and intelligence.",

        authority:
          OWNER_STREAM,

        generated_here:
          false
      };
    }

    return {
      label:
        "CONTROLLED ATHLETE PROFILE",

      tone:
        "neutral",

      explanation:
        intelligence.available
          ? "Governed athlete intelligence is available. Public disclosure remains controlled by its publication authority."
          : "Governed athlete intelligence is currently unavailable.",

      authority:
        OWNER_STREAM,

      generated_here:
        false
    };
  }

  /* ============================================================
     SUMMARY PRESENTATION

     No public status is inferred.
  ============================================================ */

  function buildSummary(
    identity,
    intelligence,
    banner
  ) {
    const starSignal =
      intelligence.star_signal;

    const signalLabel =
      hasObject(
        starSignal
      )
        ? firstDefined(
            starSignal.label,
            starSignal.display
          )
        : starSignal;

    const pathwayLabel =
      firstDefined(
        intelligence.pathway?.label,
        intelligence.pathway
          ?.current_best_fit
          ?.label,
        intelligence.pathway
          ?.status
      );

    return {
      title:
        `${identity.athlete_display_name} — ${identity.position} / ${identity.sport}`,

      subtitle:
        `${identity.school} • Class ${identity.graduation_class}`,

      signal:
        firstDefined(
          signalLabel,
          intelligence.score_status,
          "Intelligence Pending"
        ),

      score:
        intelligence.score ??
        "—",

      pathway:
        pathwayLabel ||
        "Pathway Unavailable",

      banner:
        banner.label,

      explanation:
        banner.explanation,

      generated_here:
        false
    };
  }

  /* ============================================================
     ROLE-SAFE VIEW

     The profile engine consumes disclosure.
     It does not invent a new access policy.
  ============================================================ */

  function buildRoleView(
    profile,
    model
  ) {
    const disclosure =
      model.disclosure;

    if (
      !hasObject(
        disclosure
      )
    ) {
      return {
        ok: false,
        status:
          STATUS.DISCLOSURE_REQUIRED,
        message:
          "Governed disclosure projection unavailable."
      };
    }

    const allowedSections =
      safeArray(
        disclosure.allowed_sections
      );

    const deniedSections =
      safeArray(
        disclosure.denied_sections
      );

    function permitted(section) {
      if (
        deniedSections.includes(
          section
        )
      ) {
        return false;
      }

      if (
        allowedSections.length === 0
      ) {
        return Boolean(
          disclosure.authorized === true
        );
      }

      return allowedSections.includes(
        section
      );
    }

    return {
      ok:
        true,

      engine_version:
        VERSION,

      role:
        model.audience,

      identity:
        permitted("identity")
          ? clone(
              profile.identity
            )
          : null,

      banner:
        permitted("banner")
          ? clone(
              profile.banner
            )
          : null,

      summary:
        permitted("summary")
          ? clone(
              profile.summary
            )
          : null,

      intelligence:
        permitted("intelligence")
          ? clone(
              profile.intelligence
            )
          : null,

      explainability:
        permitted("explainability")
          ? clone(
              profile.explainability
            )
          : null,

      publication:
        permitted("publication")
          ? clone(
              profile.publication
            )
          : null,

      governance:
        permitted("governance")
          ? clone(
              profile.governance
            )
          : null,

      disclosure:
        clone(
          disclosure
        ),

      authority_lineage:
        clone(
          profile.authority_lineage
        ),

      generated_at:
        nowISO(),

      locked:
        true
    };
  }

  /* ============================================================
     PROFILE ASSEMBLY
  ============================================================ */

  function assembleProfile(
    input = {},
    options = {}
  ) {
    const model =
      normalizeInput(
        input
      );

    if (!model) {
      return {
        ok: false,
        status:
          STATUS.PROFILE_PACKAGE_REQUIRED,
        message:
          "A governed profile package is required.",
        generated_at:
          nowISO()
      };
    }

    const identityValidation =
      validateIdentity(
        model
      );

    if (
      !identityValidation.ok
    ) {
      return {
        ok: false,
        status:
          identityValidation.status,
        message:
          identityValidation.message,
        generated_at:
          nowISO()
      };
    }

    const disclosureValidation =
      validateDisclosure(
        model
      );

    if (
      !disclosureValidation.ok
    ) {
      return {
        ok: false,
        status:
          disclosureValidation.status,
        message:
          disclosureValidation.message,
        athlete_id:
          model.identity.athlete_id,
        snapshot_id:
          model.identity.snapshot_id,
        generated_at:
          nowISO()
      };
    }

    const identity =
      buildIdentityPresentation(
        model.identity
      );

    const intelligence =
      buildIntelligencePresentation(
        model.intelligence
      );

    const explainability =
      buildExplainabilityPresentation(
        model.explainability
      );

    const publication =
      buildPublicationPresentation(
        model.publication
      );

    const banner =
      buildBanner(
        model,
        intelligence,
        publication
      );

    const summary =
      buildSummary(
        identity,
        intelligence,
        banner
      );

    const authorityLineage = [
      ...safeArray(
        model.authority_lineage
      ),

      ...safeArray(
        intelligence.authority_lineage
      ),

      ...safeArray(
        explainability.authority_lineage
      ),

      ...safeArray(
        publication.authority_lineage
      )
    ];

    const profile = {
      ok:
        true,

      engine:
        ENGINE,

      engine_version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      status:
        (
          intelligence.available &&
          explainability.available
        )
          ? STATUS.READY
          : STATUS.PARTIAL,

      audience:
        model.audience,

      athlete_id:
        identity.athlete_id,

      snapshot_id:
        identity.snapshot_id,

      identity,

      banner,

      summary,

      intelligence,

      explainability,

      publication,

      governance:
        clone(
          model.governance ||
          null
        ),

      disclosure:
        clone(
          model.disclosure
        ),

      authority_lineage:
        clone(
          authorityLineage
        ),

      constitutional_guards: {
        calculates_scores:
          false,

        recalculates_domains:
          false,

        synthesizes_state:
          false,

        creates_pathway:
          false,

        creates_recommendations:
          false,

        creates_evaluator_drafts:
          false,

        creates_verification:
          false,

        creates_publication_authority:
          false,

        creates_recruiting_interest:
          false,

        creates_thresholds:
          false,

        retains_source_snapshot:
          false,

        raw_payload_fallback:
          false,

        missing_authority_reconstruction:
          false,

        presentation_only:
          true
      },

      generated_at:
        nowISO(),

      locked:
        true
    };

    const role =
      options.role ||
      model.audience;

    if (role) {
      return buildRoleView(
        profile,
        {
          ...model,
          audience:
            normalizeAudience(
              role
            )
        }
      );
    }

    return profile;
  }

  /* ============================================================
     PRESENTATION RENDERER

     Rendering only.
  ============================================================ */

  function renderProfileSummary(
    targetId,
    profile
  ) {
    const el =
      document.getElementById(
        targetId
      );

    if (
      !el ||
      !profile?.ok
    ) {
      return false;
    }

    const summary =
      profile.summary ||
      profile.public_summary ||
      null;

    const banner =
      profile.banner ||
      null;

    if (
      !summary ||
      !banner
    ) {
      el.textContent =
        "Governed profile presentation is unavailable.";

      return false;
    }

    el.innerHTML = `
      <div class="profile-engine-kicker">
        STATS-CORE Governed Athlete Profile
      </div>

      <h2>
        ${escapeHTML(summary.title)}
      </h2>

      <p>
        ${escapeHTML(summary.subtitle)}
      </p>

      <div class="profile-engine-banner ${escapeHTML(
        banner.tone ||
        "neutral"
      )}">
        <strong>
          ${escapeHTML(
            banner.label
          )}
        </strong>

        <span>
          ${escapeHTML(
            banner.explanation
          )}
        </span>
      </div>

      <div class="profile-engine-grid">
        <div>
          <b>Signal</b>
          <span>
            ${escapeHTML(
              summary.signal
            )}
          </span>
        </div>

        <div>
          <b>Score</b>
          <span>
            ${escapeHTML(
              summary.score
            )}
          </span>
        </div>

        <div>
          <b>Pathway</b>
          <span>
            ${escapeHTML(
              summary.pathway
            )}
          </span>
        </div>

        <div>
          <b>Publication</b>
          <span>
            ${escapeHTML(
              profile.publication
                ?.publication_state ||
              "Unavailable"
            )}
          </span>
        </div>
      </div>
    `;

    return true;
  }

  /* ============================================================
     EXPLANATION ACCESSOR

     No new intelligence is created.
  ============================================================ */

  function explain(
    profile
  ) {
    if (
      !profile?.ok
    ) {
      return "No governed athlete profile is available.";
    }

    const identity =
      profile.identity ||
      {};

    const summary =
      profile.summary ||
      {};

    return [
      `Athlete: ${
        identity.athlete_display_name ||
        "Unavailable"
      }`,

      `Profile: ${
        summary.banner ||
        "Unavailable"
      }`,

      `Signal: ${
        summary.signal ||
        "Unavailable"
      }`,

      `Pathway: ${
        summary.pathway ||
        "Unavailable"
      }`,

      `Publication: ${
        profile.publication
          ?.publication_state ||
        "Unavailable"
      }`
    ].join(" | ");
  }

  /* ============================================================
     PUBLIC AUTHORITY
  ============================================================ */

  const ProfileEngine =
    Object.freeze({
      engine:
        ENGINE,

      version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      status:
        "ACTIVE",

      classification:
        "GOVERNED_PROFILE_PROJECTION_PRESENTATION_ENGINE",

      STATUS,
      AUDIENCE,

      doctrine:
        Object.freeze({
          presentation_authority:
            true,

          intelligence_authority:
            false,

          calculates_scores:
            false,

          synthesizes_state:
            false,

          creates_pathway:
            false,

          creates_recommendations:
            false,

          creates_evaluator_drafts:
            false,

          creates_publication_authority:
            false,

          creates_recruiting_interest:
            false,

          creates_thresholds:
            false,

          consumes_raw_payload:
            false,

          retains_source_snapshot:
            false,

          fail_open_role_filtering:
            false,

          requires_governed_disclosure:
            true,

          missing_authority_allows_reconstruction:
            false
        }),

      normalizeInput,

      validateIdentity,

      validateDisclosure,

      buildIdentityPresentation,

      buildIntelligencePresentation,

      buildExplainabilityPresentation,

      buildPublicationPresentation,

      buildBanner,

      buildSummary,

      buildRoleView,

      assembleProfile,

      renderProfileSummary,

      explain,

      getStatus() {
        return {
          engine:
            ENGINE,

          version:
            VERSION,

          owner_stream:
            OWNER_STREAM,

          status:
            "ACTIVE",

          calculates_scores:
            false,

          synthesizes_state:
            false,

          creates_pathway:
            false,

          creates_recommendations:
            false,

          creates_evaluator_drafts:
            false,

          creates_publication_authority:
            false,

          retains_source_snapshot:
            false,

          consumes_raw_payload:
            false,

          requires_governed_disclosure:
            true,

          generated_at:
            nowISO()
        };
      }
    });

  global.STATScore.ProfileEngine =
    ProfileEngine;

  global.STATSCORE_PROFILE_ENGINE =
    ProfileEngine;

  console.info(
    "[STATS-CORE] Governed Profile Engine loaded:",
    VERSION
  );

})(window); 
