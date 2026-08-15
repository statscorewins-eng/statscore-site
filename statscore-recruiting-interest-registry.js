/* ============================================================
   STATS-CORE™ RECRUITING INTEREST REGISTRY
   File: statscore-recruiting-interest-registry.js
   Version: STATSCORE-RECRUITING-INTEREST-REGISTRY-V2-GOVERNED

   Owner:
   Stream 7 — Exposure / Publication Event Registry
   consuming governed recruiting, identity, communication,
   verification, and disclosure authorities.

   Purpose:
   Preserve and classify governed recruiting lifecycle events
   without converting exposure into interest, communication into
   offer, or offer into commitment.

   CONTROLLING DOCTRINES:

   Exposure ≠ Interest
   Interest ≠ Communication
   Communication ≠ Offer
   Offer ≠ Commitment

   Recruiter View ≠ Recruiting Interest
   Recruiter Save ≠ Offer
   Program Match ≠ Program Interest
   Program Interest ≠ Offer
   Offer ≠ Commitment
   Verification ≠ Public Disclosure
   Recruiting Event ≠ Public Media Authority

   IMPORTANT:
   This registry classifies governed events.
   It does NOT manufacture recruiting truth merely because a
   caller supplies a signal label.
============================================================ */

(function () {
  "use strict";

  const VERSION =
    "STATSCORE-RECRUITING-INTEREST-REGISTRY-V2-GOVERNED";


  /* ==========================================================
     EVENT DEFINITIONS

     progression_order is lifecycle ordering only.

     IT IS NOT:
     - recruiting score;
     - athlete score;
     - probability;
     - program-fit score;
     - offer probability.
  ========================================================== */

  const EVENT_TYPES = Object.freeze({

    VIEWED_PROFILE: Object.freeze({
      progression_order: 10,
      label: "Viewed Profile",
      lifecycle_class: "EXPOSURE",
      establishes_interest: false,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "A governed recruiter/program profile-view event occurred. " +
        "This is exposure only and does not establish recruiting interest."
    }),

    VIEWED_FILM: Object.freeze({
      progression_order: 20,
      label: "Viewed Film",
      lifecycle_class: "EXPOSURE",
      establishes_interest: false,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "A governed film-view event occurred. Film consumption is exposure, not confirmed recruiting interest."
    }),

    FOLLOWED_ATHLETE: Object.freeze({
      progression_order: 30,
      label: "Followed / Saved Athlete",
      lifecycle_class: "WATCH",
      establishes_interest: false,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "The athlete was followed, saved, or added to a governed watch context. This is a tracking signal, not an offer or commitment."
    }),

    REQUESTED_INFO: Object.freeze({
      progression_order: 40,
      label: "Information Requested",
      lifecycle_class: "INTEREST",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "An authorized recruiter/program requested additional athlete information. When verified, this establishes recruiting interest but not an offer."
    }),

    MESSAGE_REQUEST: Object.freeze({
      progression_order: 50,
      label: "Communication Requested",
      lifecycle_class: "COMMUNICATION_REQUEST",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "An authorized recruiter/program requested communication access. Communication itself remains governed by Stream 6."
    }),

    EVALUATION_REQUESTED: Object.freeze({
      progression_order: 60,
      label: "Evaluation Requested",
      lifecycle_class: "EVALUATION_INTEREST",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "An authorized recruiter/program requested additional governed evaluation or verification review. This is recruiting interest, not an offer."
    }),

    CAMP_INVITE: Object.freeze({
      progression_order: 70,
      label: "Camp Invitation",
      lifecycle_class: "ACTIVE_RECRUITING",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "A governed camp invitation was issued. It may represent active recruiting activity but does not establish an offer."
    }),

    VISIT_INVITE: Object.freeze({
      progression_order: 80,
      label: "Visit Invitation",
      lifecycle_class: "HIGH_INTEREST",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: false,

      meaning:
        "A governed visit invitation was issued. It may establish significant recruiting interest but remains distinct from an offer."
    }),

    OFFER: Object.freeze({
      progression_order: 90,
      label: "Formal Offer",
      lifecycle_class: "FORMAL_OFFER",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: true,
      establishes_commitment: false,
      elevated_authority_required: true,

      meaning:
        "A formal offer may be represented only when authoritative offer evidence and verification are present. An offer is not a commitment."
    }),

    COMMITMENT: Object.freeze({
      progression_order: 100,
      label: "Commitment",
      lifecycle_class: "COMMITMENT",
      establishes_interest: true,
      establishes_communication: false,
      establishes_offer: false,
      establishes_commitment: true,
      elevated_authority_required: true,

      meaning:
        "A commitment may be represented only when authoritative commitment evidence and verification are present. It must not be inferred from interest, communication, or an offer."
    })
  });


  /* ==========================================================
     SEPARATE STATE DIMENSIONS

     Do not collapse these into one status.
  ========================================================== */

  const VERIFICATION_STATES = Object.freeze({
    UNVERIFIED: "UNVERIFIED",
    PENDING: "PENDING",
    VERIFIED: "VERIFIED",
    REJECTED: "REJECTED"
  });

  const LIFECYCLE_STATES = Object.freeze({
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
    WITHDRAWN: "WITHDRAWN",
    SUPERSEDED: "SUPERSEDED",
    HISTORICAL: "HISTORICAL"
  });

  const COMMUNICATION_STATES = Object.freeze({
    NOT_APPLICABLE: "NOT_APPLICABLE",
    UNKNOWN: "UNKNOWN",
    REQUESTED: "REQUESTED",
    ALLOWED: "ALLOWED",
    RESTRICTED: "RESTRICTED",
    PENDING_PERMISSION: "PENDING_PERMISSION"
  });

  const DISCLOSURE_SCOPES = Object.freeze({
    PRIVATE: "PRIVATE",
    ATHLETE_WORKSPACE: "ATHLETE_WORKSPACE",
    PARENT_GUARDIAN: "PARENT_GUARDIAN",
    PROFESSIONAL_WORKSPACE: "PROFESSIONAL_WORKSPACE",
    RECRUITING: "RECRUITING",
    PUBLIC_MEDIA: "PUBLIC_MEDIA"
  });

  const ESTABLISHMENT_STATES = Object.freeze({
    ESTABLISHED: "ESTABLISHED",
    UNESTABLISHED: "UNESTABLISHED",
    HISTORICAL_ONLY: "HISTORICAL_ONLY"
  });


  /* ==========================================================
     HELPERS
  ========================================================== */

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
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

  function nowISO() {
    return new Date().toISOString();
  }

  function generateId(prefix = "recruiting_event") {
    if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return `${prefix}:${globalThis.crypto.randomUUID()}`;
    }

    return (
      `${prefix}:${Date.now()}:` +
      Math.random().toString(36).slice(2)
    );
  }

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function getDefinition(type) {
    return EVENT_TYPES[
      normalize(type)
    ] || null;
  }

  function isVerified(state) {
    return (
      normalize(state) ===
      VERIFICATION_STATES.VERIFIED
    );
  }

  function isCurrentLifecycle(state) {
    return (
      normalize(state) ===
      LIFECYCLE_STATES.ACTIVE
    );
  }


  /* ==========================================================
     AUTHORITY VALIDATION

     A signal label cannot manufacture enterprise truth.
  ========================================================== */

  function validateAuthority(input = {}, definition = {}) {
    const errors = [];

    const sourceAuthority =
      clean(
        input.source_authority ||
        input.governing_authority
      );

    const evidenceReference =
      clean(
        input.evidence_reference ||
        input.event_reference ||
        input.source_event_id
      );

    const receiptId =
      clean(
        input.receipt_id ||
        input.verification_receipt_id
      );

    const verificationState =
      normalize(
        input.verification_state ||
        VERIFICATION_STATES.UNVERIFIED
      );

    /*
      All events need attribution sufficient to distinguish
      registered event from arbitrary caller assertion.
    */
    if (!sourceAuthority) {
      errors.push(
        "source_authority is required."
      );
    }

    /*
      Elevated recruiting states require stronger evidence.
    */
    if (
      definition.elevated_authority_required === true
    ) {
      if (!evidenceReference) {
        errors.push(
          "Formal Offer / Commitment requires authoritative evidence_reference."
        );
      }

      if (!receiptId) {
        errors.push(
          "Formal Offer / Commitment requires a governed receipt/reference."
        );
      }

      if (
        verificationState !==
        VERIFICATION_STATES.VERIFIED
      ) {
        errors.push(
          "Formal Offer / Commitment requires VERIFIED authority."
        );
      }
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }


  /* ==========================================================
     EVENT ESTABLISHMENT

     Distinguish "event was submitted" from
     "enterprise meaning is established."
  ========================================================== */

  function determineEstablishment(
    definition,
    verificationState,
    lifecycleState,
    authorityValidation
  ) {
    if (
      !isCurrentLifecycle(lifecycleState)
    ) {
      return {
        state:
          ESTABLISHMENT_STATES.HISTORICAL_ONLY,

        reason:
          `Lifecycle state is ${lifecycleState}. ` +
          "The event remains historical evidence but does not establish current recruiting state."
      };
    }

    if (!authorityValidation.ok) {
      return {
        state:
          ESTABLISHMENT_STATES.UNESTABLISHED,

        reason:
          authorityValidation.errors.join(" ")
      };
    }

    /*
      Exposure events may be valid observed events without
      becoming recruiting interest.

      Interest/offer/commitment classifications require
      verified authority before their higher-order meaning
      is established.
    */
    if (
      definition.establishes_interest === true ||
      definition.establishes_offer === true ||
      definition.establishes_commitment === true
    ) {
      if (!isVerified(verificationState)) {
        return {
          state:
            ESTABLISHMENT_STATES.UNESTABLISHED,

          reason:
            "Recruiting meaning is not established until the event is verified."
        };
      }
    }

    return {
      state:
        ESTABLISHMENT_STATES.ESTABLISHED,

      reason:
        "Required event authority is established."
    };
  }


  /* ==========================================================
     GOVERNED EVENT CREATION

     This creates a registry EVENT OBJECT.
     It does not create the underlying recruiting truth.
  ========================================================== */

  function createSignal(input = {}) {
    const typeKey =
      normalize(
        input.event_type ||
        input.interest_level ||
        input.signal_type
      );

    const definition =
      EVENT_TYPES[typeKey];

    if (!definition) {
      return {
        ok: false,
        error: "INVALID_RECRUITING_EVENT_TYPE",
        message:
          "Recruiting event type is not recognized.",
        received:
          input.event_type ||
          input.interest_level ||
          input.signal_type ||
          null
      };
    }

    const verificationState =
      normalize(
        input.verification_state ||
        input.signal_status ||
        VERIFICATION_STATES.UNVERIFIED
      );

    const lifecycleState =
      normalize(
        input.lifecycle_state ||
        LIFECYCLE_STATES.ACTIVE
      );

    const communicationState =
      normalize(
        input.communication_state ||
        (
          typeKey === "MESSAGE_REQUEST"
            ? COMMUNICATION_STATES.REQUESTED
            : COMMUNICATION_STATES.NOT_APPLICABLE
        )
      );

    const disclosureScope =
      normalize(
        input.disclosure_scope ||
        DISCLOSURE_SCOPES.PRIVATE
      );

    const authorityValidation =
      validateAuthority(
        input,
        definition
      );

    const establishment =
      determineEstablishment(
        definition,
        verificationState,
        lifecycleState,
        authorityValidation
      );

    const established =
      establishment.state ===
      ESTABLISHMENT_STATES.ESTABLISHED;


    /*
      Only established events can create higher-order
      recruiting meaning.
    */
    const establishesInterest =
      established &&
      definition.establishes_interest === true;

    const establishesOffer =
      established &&
      definition.establishes_offer === true;

    const establishesCommitment =
      established &&
      definition.establishes_commitment === true;


    return {
      ok: true,

      registry_version:
        VERSION,

      event_id:
        input.event_id ||
        input.signal_id ||
        generateId(),

      event_type:
        typeKey,

      event_label:
        definition.label,

      lifecycle_class:
        definition.lifecycle_class,

      progression_order:
        definition.progression_order,

      metric_class:
        "RECRUITING_LIFECYCLE_ORDER",

      recruiting_score:
        false,


      /* ------------------------------------------------------
         SUBJECTS
      ------------------------------------------------------ */

      athlete_id:
        input.athlete_id || null,

      athlete_name:
        input.athlete_name ||
        input.athlete_display_name ||
        null,

      snapshot_id:
        input.snapshot_id || null,

      program_id:
        input.program_id || null,

      program_name:
        input.program_name || null,

      recruiter_id:
        input.recruiter_id || null,

      recruiter_name:
        input.recruiter_name || null,


      /* ------------------------------------------------------
         PROFESSIONAL / ORGANIZATIONAL ATTRIBUTION
      ------------------------------------------------------ */

      professional_id:
        input.professional_id ||
        input.recruiter_id ||
        null,

      certification_id:
        input.certification_id ||
        input.psc_certification_id ||
        null,

      certification_status_at_time_of_action:
        input.certification_status_at_time_of_action ||
        null,

      organization_id:
        input.organization_id ||
        input.program_id ||
        null,

      organization_role:
        input.organization_role ||
        null,

      authority_scope:
        input.authority_scope ||
        null,


      /* ------------------------------------------------------
         GOVERNING AUTHORITY / EVIDENCE
      ------------------------------------------------------ */

      source_authority:
        input.source_authority ||
        input.governing_authority ||
        null,

      source_event_id:
        input.source_event_id ||
        null,

      evidence_reference:
        input.evidence_reference ||
        input.event_reference ||
        null,

      verification_receipt_id:
        input.verification_receipt_id ||
        null,

      receipt_id:
        input.receipt_id ||
        null,

      provenance:
        clone(
          input.provenance || {}
        ),


      /* ------------------------------------------------------
         SEPARATE GOVERNANCE DIMENSIONS
      ------------------------------------------------------ */

      verification_state:
        verificationState,

      lifecycle_state:
        lifecycleState,

      communication_state:
        communicationState,

      communication_governance_reference:
        input.communication_governance_reference ||
        input.communication_receipt_id ||
        null,

      parent_guardian_permission_state:
        normalize(
          input.parent_guardian_permission_state ||
          "UNKNOWN"
        ),

      parent_guardian_permission_reference:
        input.parent_guardian_permission_reference ||
        null,

      disclosure_scope:
        disclosureScope,

      public_disclosure_authorized:
        input.public_disclosure_authorized === true,

      disclosure_authority_reference:
        input.disclosure_authority_reference ||
        null,


      /* ------------------------------------------------------
         ESTABLISHMENT
      ------------------------------------------------------ */

      establishment_state:
        establishment.state,

      establishment_reason:
        establishment.reason,

      establishes_interest:
        establishesInterest,

      establishes_communication:
        false,

      establishes_offer:
        establishesOffer,

      establishes_commitment:
        establishesCommitment,


      /* ------------------------------------------------------
         EXPLAINABILITY
      ------------------------------------------------------ */

      meaning:
        definition.meaning,

      notes:
        input.notes || "",

      occurred_at:
        input.occurred_at ||
        input.created_at ||
        nowISO(),

      registered_at:
        nowISO(),

      locked:
        true,

      doctrine: {
        exposure_is_not_interest: true,
        interest_is_not_communication: true,
        communication_is_not_offer: true,
        offer_is_not_commitment: true,
        verification_is_not_public_disclosure: true,
        recruiting_event_is_not_media_authority: true,
        progression_order_is_not_score: true
      }
    };
  }


  /* ==========================================================
     PRESENTATION CLASSIFICATION

     IMPORTANT:
     This produces a WORKSPACE-SAFE label.

     It is not automatically a PUBLIC label.
  ========================================================== */

  function classifySignal(input = {}) {
    const signal =
      input?.registry_version === VERSION &&
      input?.event_type
        ? clone(input)
        : createSignal(input);

    if (!signal.ok) {
      return signal;
    }

    let workspaceLabel =
      "Exposure Signal";

    let athleteMessage =
      "This event should not be treated as confirmed recruiting interest.";

    if (
      signal.establishment_state !==
      ESTABLISHMENT_STATES.ESTABLISHED
    ) {
      workspaceLabel =
        "Unconfirmed Recruiting Event";

      athleteMessage =
        "A recruiting-related event is registered, but its higher-order meaning is not currently established.";
    } else if (
      signal.establishes_commitment
    ) {
      workspaceLabel =
        "Verified Commitment";

      athleteMessage =
        "A governed commitment event is established.";
    } else if (
      signal.establishes_offer
    ) {
      workspaceLabel =
        "Verified Formal Offer";

      athleteMessage =
        "A governed formal offer is established. An offer is not a commitment.";
    } else if (
      signal.establishes_interest
    ) {
      workspaceLabel =
        "Verified Recruiting Interest";

      athleteMessage =
        "Governed recruiting interest is established, but this does not constitute an offer.";
    } else if (
      signal.lifecycle_class ===
      "COMMUNICATION_REQUEST"
    ) {
      workspaceLabel =
        "Communication Request";

      athleteMessage =
        "Communication was requested. Stream 6 communication governance determines whether communication may occur.";
    }

    const publicPresentationAllowed =
      signal.public_disclosure_authorized === true &&
      signal.disclosure_scope ===
        DISCLOSURE_SCOPES.PUBLIC_MEDIA &&
      Boolean(
        signal.disclosure_authority_reference
      );


    return {
      ...signal,

      workspace_label:
        workspaceLabel,

      athlete_message:
        athleteMessage,

      public_presentation_allowed:
        publicPresentationAllowed,

      /*
        Deliberately no generic `public_label`.
        Recruiting privacy fails closed.
      */
      public_label:
        publicPresentationAllowed
          ? workspaceLabel
          : null,

      explainability:
        explainSignal(signal)
    };
  }


  /* ==========================================================
     EXPLAINABILITY
  ========================================================== */

  function explainSignal(signal = {}) {
    return [
      `Event: ${signal.event_label || "Unknown"}.`,
      `Lifecycle class: ${signal.lifecycle_class || "Unknown"}.`,
      `Verification: ${signal.verification_state || "Unknown"}.`,
      `Lifecycle state: ${signal.lifecycle_state || "Unknown"}.`,
      `Establishment: ${signal.establishment_state || "Unknown"}.`,
      `Establishes interest: ${signal.establishes_interest ? "Yes" : "No"}.`,
      `Establishes offer: ${signal.establishes_offer ? "Yes" : "No"}.`,
      `Establishes commitment: ${signal.establishes_commitment ? "Yes" : "No"}.`,
      `Disclosure scope: ${signal.disclosure_scope || "PRIVATE"}.`,
      `Meaning: ${signal.meaning || "No explanation supplied."}`
    ];
  }


  /* ==========================================================
     CURRENT-STATE ELIGIBILITY
  ========================================================== */

  function isCurrentEstablishedSignal(signal = {}) {
    return (
      signal.ok === true &&
      signal.establishment_state ===
        ESTABLISHMENT_STATES.ESTABLISHED &&
      signal.lifecycle_state ===
        LIFECYCLE_STATES.ACTIVE
    );
  }


  /* ==========================================================
     ATHLETE RECRUITING SUMMARY

     Preserve:
     - full event history;
     - current established state;
     - historical high-water state.

     Do not collapse history into one mutable status.
  ========================================================== */

  function summarizeAthleteInterest(signals = []) {
    const classified =
      (Array.isArray(signals) ? signals : [])
        .map(signal =>
          classifySignal(signal)
        )
        .filter(signal => signal.ok);


    if (!classified.length) {
      return {
        ok: true,
        status: "NO_EVENTS",

        current_state:
          null,

        historical_high_water:
          null,

        summary:
          "No governed recruiting lifecycle events are registered.",

        events: [],

        generated_at:
          nowISO()
      };
    }


    /*
      Immutable/historical ordering.
    */
    const historical =
      [...classified]
        .sort(
          (a, b) =>
            Number(
              b.progression_order || 0
            ) -
            Number(
              a.progression_order || 0
            )
        );


    const currentEstablished =
      historical.filter(
        isCurrentEstablishedSignal
      );


    const current =
      currentEstablished[0] ||
      null;


    const historicalHigh =
      historical.find(
        signal =>
          signal.establishment_state ===
          ESTABLISHMENT_STATES.ESTABLISHED ||
          signal.establishment_state ===
          ESTABLISHMENT_STATES.HISTORICAL_ONLY
      ) ||
      null;


    return {
      ok: true,

      status:
        current
          ? "CURRENT_STATE_ESTABLISHED"
          : "NO_CURRENT_ESTABLISHED_STATE",

      current_state:
        current
          ? {
              event_id:
                current.event_id,

              event_type:
                current.event_type,

              label:
                current.workspace_label,

              lifecycle_class:
                current.lifecycle_class,

              program_id:
                current.program_id,

              program_name:
                current.program_name,

              recruiter_id:
                current.recruiter_id,

              establishes_interest:
                current.establishes_interest,

              establishes_offer:
                current.establishes_offer,

              establishes_commitment:
                current.establishes_commitment,

              verification_state:
                current.verification_state,

              occurred_at:
                current.occurred_at,

              receipt_id:
                current.receipt_id ||
                current.verification_receipt_id ||
                null
            }
          : null,


      historical_high_water:
        historicalHigh
          ? {
              event_id:
                historicalHigh.event_id,

              event_type:
                historicalHigh.event_type,

              label:
                historicalHigh.workspace_label,

              lifecycle_state:
                historicalHigh.lifecycle_state,

              occurred_at:
                historicalHigh.occurred_at
            }
          : null,


      summary:
        buildSummary(
          current,
          historicalHigh
        ),

      events:
        historical,

      generated_at:
        nowISO(),

      locked:
        true,

      doctrine: {
        current_state_is_not_historical_high_water:
          true,

        revoked_or_expired_event_does_not_create_current_state:
          true,

        exposure_is_not_interest:
          true,

        offer_is_not_commitment:
          true
      }
    };
  }


  /* ==========================================================
     SUMMARY COPY
  ========================================================== */

  function buildSummary(
    current,
    historicalHigh
  ) {
    if (!current) {
      if (historicalHigh) {
        return (
          "Recruiting lifecycle history exists, but no current " +
          "governed recruiting state is established."
        );
      }

      return (
        "No current governed recruiting state is established."
      );
    }

    const athlete =
      current.athlete_name ||
      "Athlete";

    const program =
      current.program_name ||
      "a program";


    if (
      current.establishes_commitment
    ) {
      return (
        `${athlete} has a currently established governed ` +
        `commitment event with ${program}.`
      );
    }


    if (
      current.establishes_offer
    ) {
      return (
        `${athlete} has a currently established governed ` +
        `formal offer from ${program}. ` +
        `This does not establish commitment.`
      );
    }


    if (
      current.establishes_interest
    ) {
      return (
        `${athlete} has currently established recruiting ` +
        `interest from ${program}. ` +
        `This does not establish an offer.`
      );
    }


    return (
      `${athlete} has governed exposure/watch activity involving ` +
      `${program}, but no current verified recruiting interest is established.`
    );
  }


  /* ==========================================================
     PUBLIC-MEDIA ELIGIBILITY

     Stream 7 may determine whether this REGISTRY OBJECT carries
     sufficient disclosure authorization to be considered by the
     publication lifecycle.

     It does NOT itself publish the event.
  ========================================================== */

  function buildMediaCandidateReference(signalInput = {}) {
    const signal =
      classifySignal(signalInput);

    if (!signal.ok) {
      return signal;
    }

    if (
      signal.public_presentation_allowed !==
      true
    ) {
      return {
        ok: false,

        status:
          "PUBLIC_DISCLOSURE_NOT_AUTHORIZED",

        event_id:
          signal.event_id,

        reason:
          "Recruiting event remains private/restricted. No PHNX Media Candidate may be created from this event without governed public-disclosure authority."
      };
    }


    if (
      signal.establishment_state !==
      ESTABLISHMENT_STATES.ESTABLISHED
    ) {
      return {
        ok: false,

        status:
          "RECRUITING_EVENT_NOT_ESTABLISHED",

        event_id:
          signal.event_id,

        reason:
          "Unestablished recruiting event cannot become a public media claim."
      };
    }


    return {
      ok: true,

      candidate_reference_type:
        "RECRUITING_EVENT_MEDIA_REFERENCE",

      source_event_id:
        signal.event_id,

      source_authority:
        signal.source_authority,

      why:
        (
          `Governed ${signal.event_label} event is eligible ` +
          `for editorial consideration under explicit public-disclosure authority.`
        ),

      disclosure_scope:
        signal.disclosure_scope,

      disclosure_authority_reference:
        signal.disclosure_authority_reference,

      receipt_id:
        signal.receipt_id ||
        signal.verification_receipt_id ||
        null,

      /*
        Candidate reference ≠ publication approval.
      */
      publication_authorized:
        false,

      doctrine: {
        media_candidate_is_not_publication:
          true,

        recruiting_event_is_not_automatic_public_media:
          true
      }
    };
  }


  /* ==========================================================
     REGISTRY OBJECT
  ========================================================== */

  const Registry = {
    version:
      VERSION,

    locked:
      true,

    EVENT_TYPES,
    INTEREST_LEVELS:
      EVENT_TYPES,

    VERIFICATION_STATES,
    LIFECYCLE_STATES,
    COMMUNICATION_STATES,
    DISCLOSURE_SCOPES,
    ESTABLISHMENT_STATES,

    normalize,
    nowISO,

    getLevel:
      getDefinition,

    getDefinition,

    validateAuthority,

    createSignal,
    classifySignal,
    explainSignal,

    summarizeAthleteInterest,
    buildSummary,

    isCurrentEstablishedSignal,

    buildMediaCandidateReference
  };


  /* ==========================================================
     GLOBAL COMPATIBILITY API
  ========================================================== */

  window.STATSCORE_RECRUITING_INTEREST_REGISTRY =
    Registry;


  window.STATSCORE_REGISTER_RECRUITING_SIGNAL =
    function (input) {
      return Registry.classifySignal(
        input
      );
    };


  window.STATSCORE_SUMMARIZE_RECRUITING_INTEREST =
    function (signals) {
      return Registry.summarizeAthleteInterest(
        signals
      );
    };


  window.STATSCORE_BUILD_RECRUITING_MEDIA_REFERENCE =
    function (signal) {
      return Registry.buildMediaCandidateReference(
        signal
      );
    };


  console.info(
    "STATS-CORE Governed Recruiting Interest Registry loaded:",
    VERSION
  );

})(); 
