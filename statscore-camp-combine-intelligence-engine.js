/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-camp-combine-intelligence-engine.js
*
* Canonical Classification:
*     DOWNSTREAM CAMP / COMBINE RECOMMENDATION INTELLIGENCE AUTHORITY
*
* Production Role:
*     Interpret governed athlete intelligence and governed event context into
*     explainable Camp / Combine recommendation intelligence.
*
* Constitutional Chain:
*
*     Governed Athlete Intelligence
*              +
*     Governed Event Context
*              +
*     Governed Recruiter / Program Context
*              ↓
*     Camp / Combine Fit Interpretation
*              ↓
*     Recommendation Intelligence
*              ↓
*     Authorized Consumer
*
* This authority DOES:
*     - classify governed camp/combine event context;
*     - evaluate sport compatibility;
*     - evaluate position/event compatibility;
*     - consume governed Readiness Intelligence;
*     - consume governed Pathway Intelligence;
*     - consume governed Academic / Eligibility Intelligence;
*     - consume governed Recruiting / Program context;
*     - evaluate geographic practicality;
*     - identify governed recruiter/program meeting targets;
*     - expose factor-level intelligence;
*     - preserve confidence independently from recommendation strength;
*     - expose missing authority and missing evidence;
*     - explain recommendation intelligence;
*     - fail closed when required authority is unavailable.
*
* This authority DOES NOT:
*     - calculate Athletic Score;
*     - calculate Production Score;
*     - calculate Academic Score;
*     - calculate Verification Score;
*     - calculate STATScore™;
*     - calculate Composite Intelligence;
*     - invent proprietary recommendation weights;
*     - convert recruiter certification into athlete ability;
*     - send messages;
*     - build notification payloads;
*     - create communication receipts;
*     - persist routing receipts;
*     - register athletes for events;
*     - contact recruiters;
*     - render UI;
*     - manipulate DOM;
*     - execute automatically when loaded.
*
* Governing Doctrine:
*     Evidence ≠ Intelligence
*     Intelligence ≠ Presentation
*     Intelligence ≠ Communication
*     Recommendation ≠ Action
*     Pathway Intelligence ≠ Placement
*     Confidence ≠ Certification
*     PROJECTED ≠ OFFICIAL
*     Missing ≠ Zero
*     Missing Authority ≠ Permission to Reconstruct Authority
*
* Critical Rule:
*     Camp / Combine recommendation intelligence is downstream intelligence.
*     It may consume athlete intelligence but may never become the source of
*     the athlete's Athletic, Production, Academic, Verification, Competition,
*     or Composite score.
*
* Version:
*     STATSCORE-CAMP-COMBINE-INTELLIGENCE-V2
*
* Contract Version:
*     STATSCORE-CAMP-COMBINE-INTELLIGENCE-CONTRACT-V1
*
* Status:
*     PRODUCTION RECONSTRUCTION
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-camp-combine-intelligence-engine";

    const AUTHORITY_KEY =
        "CAMP_COMBINE_RECOMMENDATION_INTELLIGENCE";

    const VERSION =
        "STATSCORE-CAMP-COMBINE-INTELLIGENCE-V2";

    const CONTRACT_VERSION =
        "STATSCORE-CAMP-COMBINE-INTELLIGENCE-CONTRACT-V1";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const STATUS = Object.freeze({
        AVAILABLE:
            "AVAILABLE",

        PARTIAL:
            "PARTIAL",

        RECOMMENDATION_PENDING:
            "RECOMMENDATION_PENDING",

        RECOMMENDED:
            "RECOMMENDED",

        NOT_RECOMMENDED:
            "NOT_RECOMMENDED",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE",

        INVALID_INPUT:
            "INVALID_INPUT",

        AUTHORITY_UNAVAILABLE:
            "AUTHORITY_UNAVAILABLE",

        AUTHORITY_UNAUTHORIZED:
            "AUTHORITY_UNAUTHORIZED",

        CONTRACT_INVALID:
            "CONTRACT_INVALID",

        UNSUPPORTED_EVENT:
            "UNSUPPORTED_EVENT",

        ERROR:
            "ERROR"
    });

    const FACTOR_STATUS = Object.freeze({
        AVAILABLE:
            "AVAILABLE",

        PARTIAL:
            "PARTIAL",

        UNAVAILABLE:
            "UNAVAILABLE",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE"
    });

    const EVENT_TYPES = Object.freeze({

        DEVELOPMENTAL: Object.freeze({
            code:
                "DEVELOPMENTAL",

            label:
                "Developmental",

            meaning:
                "Primarily supports athlete development, technical growth, readiness improvement, or foundational evaluation."
        }),

        EXPOSURE: Object.freeze({
            code:
                "EXPOSURE",

            label:
                "Exposure",

            meaning:
                "Primarily supports governed visibility, evaluator/recruiter interaction, or pathway exposure."
        }),

        HYBRID: Object.freeze({
            code:
                "HYBRID",

            label:
                "Hybrid",

            meaning:
                "Combines development, evaluation, and governed exposure opportunity."
        }),

        UNKNOWN: Object.freeze({
            code:
                "UNKNOWN",

            label:
                "Unknown",

            meaning:
                "Event type cannot be determined from governed event context."
        })

    });

    /*
    ============================================================================
    LEGACY AGGREGATE WEIGHTING DISPOSITION
    ----------------------------------------------------------------------------
    The previous file contained this internal aggregation:

        sport_fit      18%
        position_fit   16%
        readiness_fit  18%
        pathway_fit    14%
        academic_fit   12%
        recruiter_fit  14%
        geography_fit   8%

    Those coefficients are NOT reproduced as production authority here.

    No aggregate recommendation score will be manufactured unless a separately
    governed recommendation contract is explicitly supplied and validated.
    ============================================================================
    */

    const REQUIRED_RECOMMENDATION_FACTORS =
        Object.freeze([
            "sport_fit",
            "position_fit",
            "readiness_fit",
            "pathway_fit",
            "academic_fit",
            "recruiter_fit",
            "geography_fit"
        ]);

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(
            value == null ? "" : value
        ).trim();
    }

    function upper(value) {
        return normalize(value)
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/-/g, "_");
    }

    function numberOrNull(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const numeric =
            Number(
                String(value)
                    .replace(/,/g, "")
                    .replace(/[^\d.-]/g, "")
            );

        return Number.isFinite(numeric)
            ? numeric
            : null;
    }

    function clamp(
        value,
        min = 0,
        max = 100
    ) {
        const numeric =
            numberOrNull(value);

        if (numeric === null) {
            return null;
        }

        return Number(
            Math.max(
                min,
                Math.min(max, numeric)
            ).toFixed(2)
        );
    }

    function normalizeSport(value) {
        const sport =
            upper(value);

        const aliases =
            Object.freeze({
                FB:
                    "FOOTBALL",

                FOOTBALL:
                    "FOOTBALL",

                BASKETBALL:
                    "BASKETBALL",

                BBALL:
                    "BASKETBALL",

                HOOPS:
                    "BASKETBALL",

                BASEBALL:
                    "BASEBALL",

                BASE_BALL:
                    "BASEBALL",

                TRACK:
                    "TRACK",

                TRACK_FIELD:
                    "TRACK",

                TRACK_AND_FIELD:
                    "TRACK"
            });

        return (
            aliases[sport] ||
            sport ||
            "UNKNOWN"
        );
    }

    function validateStream9Authority() {
        const authority =
            global.STATScoreStream9Authority;

        if (!authority) {
            return {
                valid:
                    false,

                status:
                    STATUS.AUTHORITY_UNAVAILABLE
            };
        }

        const valid =
            authority.stream_number === 9 &&
            authority.operational_state ===
                "ACTIVE";

        return {
            valid,

            status:
                valid
                    ? "AUTHORIZED"
                    : STATUS.AUTHORITY_UNAUTHORIZED
        };
    }

    /*
    ============================================================================
    EVENT CLASSIFICATION
    ============================================================================
    */

    function resolveEventType(event = {}) {
        const explicit =
            upper(
                event.event_type ||
                event.type ||
                event.classification
            );

        if (
            explicit &&
            EVENT_TYPES[explicit]
        ) {
            return {
                ...EVENT_TYPES[explicit],

                source:
                    "EXPLICIT"
            };
        }

        const recruiters =
            Array.isArray(
                event.attending_recruiters
            )
                ? event.attending_recruiters
                : [];

        const developmentSignals =
            Boolean(
                event.development_focus ||
                event.skill_training ||
                event.position_training ||
                event.instructional ||
                event.developmental
            );

        const exposureSignals =
            Boolean(
                recruiters.length ||
                event.exposure_focus ||
                event.recruiter_exposure ||
                event.college_exposure
            );

        if (
            developmentSignals &&
            exposureSignals
        ) {
            return {
                ...EVENT_TYPES.HYBRID,

                source:
                    "GOVERNED_EVENT_CONTEXT"
            };
        }

        if (exposureSignals) {
            return {
                ...EVENT_TYPES.EXPOSURE,

                source:
                    "GOVERNED_EVENT_CONTEXT"
            };
        }

        if (developmentSignals) {
            return {
                ...EVENT_TYPES.DEVELOPMENTAL,

                source:
                    "GOVERNED_EVENT_CONTEXT"
            };
        }

        return {
            ...EVENT_TYPES.UNKNOWN,

            source:
                "INSUFFICIENT_EVENT_CONTEXT"
        };
    }

    /*
    ============================================================================
    FACTOR INTELLIGENCE
    ----------------------------------------------------------------------------
    Factor signals are SUPPORTING recommendation intelligence.

    They are NOT:
      - Athletic Score
      - Production Score
      - STATScore™
      - Composite Intelligence

    Each factor is independently explainable.
    ============================================================================
    */

    function evaluateSportFit(
        event,
        athlete
    ) {
        const eventSport =
            normalizeSport(
                event?.sport ||
                event?.primary_sport
            );

        const athleteSport =
            normalizeSport(
                athlete?.primary_sport ||
                athlete?.sport
            );

        if (
            eventSport === "UNKNOWN" ||
            athleteSport === "UNKNOWN"
        ) {
            return {
                factor:
                    "sport_fit",

                value:
                    null,

                classification:
                    "UNKNOWN",

                status:
                    FACTOR_STATUS
                        .INSUFFICIENT_EVIDENCE,

                evidence_used:
                    [],

                missing_evidence: [
                    eventSport === "UNKNOWN"
                        ? "event.sport"
                        : null,

                    athleteSport === "UNKNOWN"
                        ? "athlete.sport"
                        : null
                ].filter(Boolean),

                explanation:
                    "Sport compatibility cannot be determined because required sport context is missing."
            };
        }

        const match =
            eventSport ===
            athleteSport;

        return {
            factor:
                "sport_fit",

            value:
                match
                    ? 100
                    : 0,

            classification:
                match
                    ? "DIRECT_MATCH"
                    : "NO_MATCH",

            status:
                FACTOR_STATUS.AVAILABLE,

            evidence_used: [
                {
                    evidence_type:
                        "ATHLETE_SPORT",

                    value:
                        athleteSport
                },
                {
                    evidence_type:
                        "EVENT_SPORT",

                    value:
                        eventSport
                }
            ],

            missing_evidence:
                [],

            explanation:
                match
                    ? `Event sport ${eventSport} matches the athlete's governed sport context.`
                    : `Event sport ${eventSport} does not match athlete sport ${athleteSport}.`
        };
    }

    function normalizePositionList(value) {
        if (
            !Array.isArray(value)
        ) {
            return [];
        }

        return value
            .map(upper)
            .filter(Boolean);
    }

    function evaluatePositionFit(
        event,
        athlete
    ) {
        const athletePosition =
            upper(
                athlete?.primary_position ||
                athlete?.position ||
                athlete?.primary_event ||
                athlete?.event
            );

        const eventPositions =
            normalizePositionList(
                event?.positions ||
                event?.position_groups ||
                event?.target_positions ||
                event?.events ||
                []
            );

        if (!athletePosition) {
            return {
                factor:
                    "position_fit",

                value:
                    null,

                classification:
                    "UNKNOWN",

                status:
                    FACTOR_STATUS
                        .INSUFFICIENT_EVIDENCE,

                evidence_used:
                    [],

                missing_evidence: [
                    "athlete.position_or_event"
                ],

                explanation:
                    "Position/event compatibility cannot be determined because athlete position/event context is missing."
            };
        }

        if (
            !eventPositions.length
        ) {
            return {
                factor:
                    "position_fit",

                value:
                    null,

                classification:
                    "EVENT_POSITION_OPEN_OR_UNDECLARED",

                status:
                    FACTOR_STATUS.PARTIAL,

                evidence_used: [
                    {
                        evidence_type:
                            "ATHLETE_POSITION",

                        value:
                            athletePosition
                    }
                ],

                missing_evidence: [
                    "event.positions"
                ],

                explanation:
                    "Athlete position is known, but the event does not declare governed position/event targeting."
            };
        }

        const match =
            eventPositions.includes(
                athletePosition
            );

        return {
            factor:
                "position_fit",

            value:
                match
                    ? 100
                    : 0,

            classification:
                match
                    ? "DIRECT_MATCH"
                    : "NO_DIRECT_MATCH",

            status:
                FACTOR_STATUS.AVAILABLE,

            evidence_used: [
                {
                    evidence_type:
                        "ATHLETE_POSITION",

                    value:
                        athletePosition
                },
                {
                    evidence_type:
                        "EVENT_POSITIONS",

                    value:
                        eventPositions
                }
            ],

            missing_evidence:
                [],

            explanation:
                match
                    ? `Athlete position/event ${athletePosition} is explicitly supported by this event.`
                    : `Athlete position/event ${athletePosition} is not explicitly listed in the event's governed target positions/events.`
        };
    }

    function getReadinessValue(
        readiness
    ) {
        return (
            numberOrNull(
                readiness?.score
            ) ??
            numberOrNull(
                readiness?.readiness_score
            ) ??
            null
        );
    }

    function evaluateReadinessFit(
        eventType,
        readiness
    ) {
        if (!readiness) {
            return {
                factor:
                    "readiness_fit",

                value:
                    null,

                classification:
                    "READINESS_UNAVAILABLE",

                status:
                    FACTOR_STATUS
                        .INSUFFICIENT_EVIDENCE,

                evidence_used:
                    [],

                missing_evidence: [
                    "readiness_intelligence"
                ],

                explanation:
                    "Governed Readiness Intelligence is unavailable."
            };
        }

        const readinessScore =
            getReadinessValue(
                readiness
            );

        const readinessStatus =
            upper(
                readiness.status ||
                readiness.readiness_status ||
                readiness.classification
            );

        return {
            factor:
                "readiness_fit",

            value:
                readinessScore,

            classification:
                readinessStatus ||
                "READINESS_AVAILABLE",

            status:
                FACTOR_STATUS.AVAILABLE,

            evidence_used: [
                {
                    evidence_type:
                        "READINESS_INTELLIGENCE",

                    value:
                        readinessScore,

                    status:
                        readinessStatus ||
                        null,

                    authority:
                        readiness.authority ||
                        readiness.engine ||
                        "STREAM_9_READINESS_AUTHORITY"
                }
            ],

            missing_evidence:
                [],

            explanation:
                `Camp/combine recommendation consumes governed Readiness Intelligence. Event classification is ${eventType.code}.`
        };
    }

    function evaluatePathwayFit(
        event,
        pathway
    ) {
        if (!pathway) {
            return {
                factor:
                    "pathway_fit",

                value:
                    null,

                classification:
                    "PATHWAY_UNAVAILABLE",

                status:
                    FACTOR_STATUS
                        .INSUFFICIENT_EVIDENCE,

                evidence_used:
                    [],

                missing_evidence: [
                    "pathway_intelligence"
                ],

                explanation:
                    "Governed Pathway Intelligence is unavailable."
            };
        }

        const athletePathway =
            upper(
                pathway.primary_pathway ||
                pathway.pathway ||
                pathway.current_best_fit
                    ?.code ||
                pathway.current_best_fit
                    ?.label
            );

        const eventPathway =
            upper(
                event.target_pathway ||
                event.division_focus ||
                event.division_level
            );

        if (!athletePathway) {
            return {
                factor:
                    "pathway_fit",

                value:
                    null,

                classification:
                    "PATHWAY_PENDING",

                status:
                    FACTOR_STATUS.PARTIAL,

                evidence_used:
                    [],

                missing_evidence: [
                    "pathway.primary_pathway"
                ],

                explanation:
                    "Pathway authority exists, but the athlete's current governed pathway is unresolved."
            };
        }

        if (!eventPathway) {
            return {
                factor:
                    "pathway_fit",

                value:
                    null,

                classification:
                    "EVENT_PATHWAY_UNDECLARED",

                status:
                    FACTOR_STATUS.PARTIAL,

                evidence_used: [
                    {
                        evidence_type:
                            "ATHLETE_PATHWAY",

                        value:
                            athletePathway
                    }
                ],

                missing_evidence: [
                    "event.target_pathway"
                ],

                explanation:
                    "Athlete pathway is governed, but event pathway targeting is not declared."
            };
        }

        const match =
            athletePathway ===
            eventPathway;

        return {
            factor:
                "pathway_fit",

            value:
                match
                    ? 100
                    : null,

            classification:
                match
                    ? "DIRECT_PATHWAY_MATCH"
                    : "PATHWAY_DIFFERENCE_REQUIRES_INTERPRETATION",

            status:
                match
                    ? FACTOR_STATUS.AVAILABLE
                    : FACTOR_STATUS.PARTIAL,

            evidence_used: [
                {
                    evidence_type:
                        "ATHLETE_PATHWAY",

                    value:
                        athletePathway
                },
                {
                    evidence_type:
                        "EVENT_PATHWAY",

                    value:
                        eventPathway
                }
            ],

            missing_evidence:
                [],

            explanation:
                match
                    ? `Event pathway ${eventPathway} aligns directly with the athlete's governed pathway.`
                    : `Event pathway ${eventPathway} differs from athlete pathway ${athletePathway}; no arbitrary division-distance coefficient is manufactured.`
        };
    }

    function evaluateAcademicFit(
        event,
        academic,
        eligibility
    ) {
        const requiresOnTrack =
            Boolean(
                event
                    ?.requires_ncaa_on_track
            ) ||
            upper(
                event
                    ?.academic_requirement
            ).includes(
                "ON_TRACK"
            );

        if (
            !requiresOnTrack
        ) {
            return {
                factor:
                    "academic_fit",

                value:
                    null,

                classification:
                    "NO_DECLARED_ACADEMIC_GATE",

                status:
                    FACTOR_STATUS.AVAILABLE,

                evidence_used:
                    [],

                missing_evidence:
                    [],

                explanation:
                    "This event does not declare a governed academic/eligibility gate."
            };
        }

        const eligibilityStatus =
            upper(
                eligibility
                    ?.status ||
                eligibility
                    ?.eligibility_status ||
                academic
                    ?.eligibility
                    ?.status ||
                academic
                    ?.eligibility_status
            );

        if (!eligibilityStatus) {
            return {
                factor:
                    "academic_fit",

                value:
                    null,

                classification:
                    "ELIGIBILITY_UNAVAILABLE",

                status:
                    FACTOR_STATUS
                        .INSUFFICIENT_EVIDENCE,

                evidence_used:
                    [],

                missing_evidence: [
                    "eligibility_intelligence"
                ],

                explanation:
                    "The event declares an academic/eligibility gate, but governed eligibility intelligence is unavailable."
            };
        }

        const aligned =
            eligibilityStatus ===
                "ON_TRACK" ||
            eligibilityStatus ===
                "VERIFIED_TRACK" ||
            eligibilityStatus ===
                "ELIGIBLE";

        return {
            factor:
                "academic_fit",

            value:
                aligned
                    ? 100
                    : 0,

            classification:
                aligned
                    ? "ACADEMIC_GATE_SATISFIED"
                    : "ACADEMIC_GATE_NOT_SATISFIED",

            status:
                FACTOR_STATUS.AVAILABLE,

            evidence_used: [
                {
                    evidence_type:
                        "ELIGIBILITY_INTELLIGENCE",

                    value:
                        eligibilityStatus
                }
            ],

            missing_evidence:
                [],

            explanation:
                aligned
                    ? "Governed eligibility intelligence satisfies the event's declared academic gate."
                    : "Governed eligibility intelligence does not currently satisfy the event's declared academic gate."
        };
    }

    /*
    ============================================================================
    RECRUITER / PROGRAM FIT
    ----------------------------------------------------------------------------
    Recruiter certification, credential status, or professional verification
    may establish AUTHORITY / PROVENANCE.

    It does NOT add athlete ability points.

    No legacy "+8 for verified recruiter" behavior survives.
    ============================================================================
    */

    function evaluateRecruiterFit(
        event,
        athlete,
        pathway
    ) {
        const recruiters =
            Array.isArray(
                event
                    ?.attending_recruiters
            )
                ? event
                    .attending_recruiters
                : [];

        if (
            !recruiters.length
        ) {
            return {
                factor:
                    "recruiter_fit",

                value:
                    null,

                classification:
                    "NO_RECRUITER_CONTEXT",

                status:
                    FACTOR_STATUS.PARTIAL,

                evidence_used:
                    [],

                missing_evidence: [
                    "event.attending_recruiters"
                ],

                meeting_targets:
                    [],

                explanation:
                    "No governed recruiter attendance context is available for this event."
            };
        }

        const athleteSport =
            normalizeSport(
                athlete
                    ?.primary_sport ||
                athlete
                    ?.sport
            );

        const athletePosition =
            upper(
                athlete
                    ?.primary_position ||
                athlete
                    ?.position ||
                athlete
                    ?.primary_event ||
                athlete
                    ?.event
            );

        const athletePathway =
            upper(
                pathway
                    ?.primary_pathway ||
                pathway
                    ?.pathway
            );

        const targets = [];

        recruiters
            .forEach(
                function (
                    recruiter
                ) {
                    const sports =
                        Array.isArray(
                            recruiter.sports
                        )
                            ? recruiter
                                .sports
                                .map(
                                    normalizeSport
                                )
                            : [];

                    const positions =
                        Array.isArray(
                            recruiter.positions
                        )
                            ? recruiter
                                .positions
                                .map(upper)
                            : [];

                    const pathways =
                        Array.isArray(
                            recruiter
                                .division_focus
                        )
                            ? recruiter
                                .division_focus
                                .map(upper)
                            : [];

                    const fitReasons =
                        [];

                    if (
                        athleteSport !==
                            "UNKNOWN" &&
                        sports.includes(
                            athleteSport
                        )
                    ) {
                        fitReasons.push(
                            "SPORT_MATCH"
                        );
                    }

                    if (
                        athletePosition &&
                        positions.includes(
                            athletePosition
                        )
                    ) {
                        fitReasons.push(
                            "POSITION_MATCH"
                        );
                    }

                    if (
                        athletePathway &&
                        pathways.includes(
                            athletePathway
                        )
                    ) {
                        fitReasons.push(
                            "PATHWAY_MATCH"
                        );
                    }

                    if (
                        !fitReasons.length
                    ) {
                        return;
                    }

                    targets.push({
                        professional_id:
                            recruiter
                                .professional_id ||
                            null,

                        recruiter_id:
                            recruiter
                                .recruiter_id ||
                            null,

                        certification_id:
                            recruiter
                                .certification_id ||
                            null,

                        certification_status:
                            recruiter
                                .certification_status ||
                            null,

                        authorized_scope:
                            recruiter
                                .authorized_scope ||
                            null,

                        recruiter_name:
                            recruiter
                                .recruiter_name ||
                            recruiter
                                .name ||
                            null,

                        school_program:
                            recruiter
                                .school_program ||
                            recruiter
                                .school ||
                            null,

                        fit_reasons:
                            fitReasons,

                        authority_note:
                            "Professional certification and verification establish provenance/authority only; they do not increase athlete performance."
                    });
                }
            );

        return {
            factor:
                "recruiter_fit",

            value:
                null,

            classification:
                targets.length
                    ? "GOVERNED_RECRUITER_ALIGNMENT_PRESENT"
                    : "NO_GOVERNED_RECRUITER_ALIGNMENT",

            status:
                FACTOR_STATUS.AVAILABLE,

            evidence_used: [
                {
                    evidence_type:
                        "EVENT_RECRUITER_CONTEXT",

                    recruiter_count:
                        recruiters.length,

                    aligned_target_count:
                        targets.length
                }
            ],

            missing_evidence:
                [],

            meeting_targets:
                targets,

            explanation:
                targets.length
                    ? `${targets.length} governed recruiter/program target(s) align with athlete sport, position/event, or pathway context.`
                    : "No attending recruiter/program context currently aligns with athlete sport, position/event, or pathway."
        };
    }

    function evaluateGeographyFit(
        event,
        athlete
    ) {
        const eventLocation =
            normalize(
                event?.city_state ||
                event?.state ||
                event?.region
            );

        const athleteLocation =
            normalize(
                athlete?.city_state ||
                athlete?.state ||
                athlete?.region
            );

        if (
            !eventLocation ||
            !athleteLocation
        ) {
            return {
                factor:
                    "geography_fit",

                value:
                    null,

                classification:
                    "LOCATION_CONTEXT_INCOMPLETE",

                status:
                    FACTOR_STATUS.PARTIAL,

                evidence_used:
                    [],

                missing_evidence: [
                    !eventLocation
                        ? "event.location"
                        : null,

                    !athleteLocation
                        ? "athlete.location"
                        : null
                ].filter(Boolean),

                explanation:
                    "Geographic practicality cannot be fully interpreted because location context is incomplete."
            };
        }

        const sameLocation =
            upper(eventLocation) ===
            upper(athleteLocation);

        return {
            factor:
                "geography_fit",

            value:
                sameLocation
                    ? 100
                    : null,

            classification:
                sameLocation
                    ? "DIRECT_LOCATION_MATCH"
                    : "TRAVEL_CONTEXT_REQUIRED",

            status:
                sameLocation
                    ? FACTOR_STATUS.AVAILABLE
                    : FACTOR_STATUS.PARTIAL,

            evidence_used: [
                {
                    evidence_type:
                        "ATHLETE_LOCATION",

                    value:
                        athleteLocation
                },
                {
                    evidence_type:
                        "EVENT_LOCATION",

                    value:
                        eventLocation
                }
            ],

            missing_evidence:
                [],

            explanation:
                sameLocation
                    ? "Athlete and event location contexts directly align."
                    : "Athlete and event locations differ; travel feasibility must be governed separately rather than assigned an arbitrary fit penalty."
        };
    }

    /*
    ============================================================================
    RECOMMENDATION CONTRACT
    ----------------------------------------------------------------------------
    Aggregation is permitted only when an explicitly supplied governed contract
    defines the factor weights and passes validation.
    ============================================================================
    */

    function validateRecommendationContract(
        contract
    ) {
        if (
            !contract ||
            typeof contract !==
                "object"
        ) {
            return {
                valid:
                    false,

                status:
                    "RECOMMENDATION_CONTRACT_UNAVAILABLE",

                total_weight:
                    null,

                missing_factors:
                    Array.from(
                        REQUIRED_RECOMMENDATION_FACTORS
                    )
            };
        }

        if (
            contract
                .stream_owner !==
            STREAM_OWNER
        ) {
            return {
                valid:
                    false,

                status:
                    "INVALID_RECOMMENDATION_CONTRACT_OWNER",

                total_weight:
                    null,

                missing_factors:
                    []
            };
        }

        if (
            !contract.version
        ) {
            return {
                valid:
                    false,

                status:
                    "RECOMMENDATION_CONTRACT_VERSION_REQUIRED",

                total_weight:
                    null,

                missing_factors:
                    []
            };
        }

        const weights =
            contract.weights;

        if (
            !weights ||
            typeof weights !==
                "object"
        ) {
            return {
                valid:
                    false,

                status:
                    "RECOMMENDATION_WEIGHTS_REQUIRED",

                total_weight:
                    null,

                missing_factors:
                    Array.from(
                        REQUIRED_RECOMMENDATION_FACTORS
                    )
            };
        }

        const missingFactors =
            REQUIRED_RECOMMENDATION_FACTORS
                .filter(
                    function (
                        factor
                    ) {
                        return (
                            numberOrNull(
                                weights[
                                    factor
                                ]
                            ) === null
                        );
                    }
                );

        const totalWeight =
            REQUIRED_RECOMMENDATION_FACTORS
                .reduce(
                    function (
                        total,
                        factor
                    ) {
                        return (
                            total +
                            (
                                numberOrNull(
                                    weights[
                                        factor
                                    ]
                                ) ||
                                0
                            )
                        );
                    },
                    0
                );

        const totalValid =
            Math.abs(
                totalWeight -
                100
            ) <
            0.0001;

        return {
            valid:
                missingFactors.length ===
                    0 &&
                totalValid,

            status:
                missingFactors.length
                    ? "RECOMMENDATION_CONTRACT_MISSING_FACTORS"
                    : totalValid
                        ? "VALID_RECOMMENDATION_CONTRACT"
                        : "RECOMMENDATION_WEIGHTS_MUST_TOTAL_100",

            total_weight:
                Number(
                    totalWeight
                        .toFixed(4)
                ),

            missing_factors:
                missingFactors
        };
    }

    function calculateGovernedRecommendation(
        factors,
        contract
    ) {
        const validation =
            validateRecommendationContract(
                contract
            );

        if (
            !validation.valid
        ) {
            return {
                available:
                    false,

                score:
                    null,

                classification:
                    "RECOMMENDATION_PENDING",

                status:
                    STATUS
                        .RECOMMENDATION_PENDING,

                contract_validation:
                    validation,

                explanation:
                    "No aggregate event recommendation score was manufactured because a valid CSE-governed recommendation weighting contract was not supplied."
            };
        }

        const unavailableFactors =
            REQUIRED_RECOMMENDATION_FACTORS
                .filter(
                    function (
                        factor
                    ) {
                        return (
                            numberOrNull(
                                factors[
                                    factor
                                ]?.value
                            ) === null
                        );
                    }
                );

        if (
            unavailableFactors.length
        ) {
            return {
                available:
                    false,

                score:
                    null,

                classification:
                    "INSUFFICIENT_FACTOR_EVIDENCE",

                status:
                    STATUS
                        .INSUFFICIENT_EVIDENCE,

                contract_validation:
                    validation,

                missing_factors:
                    unavailableFactors,

                explanation:
                    "A valid recommendation contract exists, but required factor intelligence is incomplete. No aggregate score was manufactured."
            };
        }

        const score =
            REQUIRED_RECOMMENDATION_FACTORS
                .reduce(
                    function (
                        total,
                        factor
                    ) {
                        const factorValue =
                            numberOrNull(
                                factors[
                                    factor
                                ].value
                            );

                        const weight =
                            numberOrNull(
                                contract
                                    .weights[
                                        factor
                                    ]
                            );

                        return (
                            total +
                            (
                                factorValue *
                                (
                                    weight /
                                    100
                                )
                            )
                        );
                    },
                    0
                );

        const normalizedScore =
            clamp(score);

        /*
        Recommendation thresholds must also come from governed contract.
        No legacy threshold is silently restored.
        */

        const thresholds =
            contract.thresholds ||
            {};

        const recommendedMinimum =
            numberOrNull(
                thresholds
                    .recommended_minimum
            );

        const priorityMinimum =
            numberOrNull(
                thresholds
                    .priority_minimum
            );

        if (
            recommendedMinimum ===
            null
        ) {
            return {
                available:
                    false,

                score:
                    normalizedScore,

                classification:
                    "THRESHOLD_CONTRACT_INCOMPLETE",

                status:
                    STATUS
                        .RECOMMENDATION_PENDING,

                contract_validation:
                    validation,

                explanation:
                    "Factor aggregation completed under a governed weighting contract, but release thresholds are not governed. Recommendation remains pending."
            };
        }

        const recommended =
            normalizedScore >=
            recommendedMinimum;

        const priority =
            priorityMinimum !==
                null &&
            normalizedScore >=
                priorityMinimum
                ? "HIGH"
                : recommended
                    ? "STANDARD"
                    : "NOT_RECOMMENDED";

        return {
            available:
                true,

            score:
                normalizedScore,

            classification:
                recommended
                    ? "RECOMMENDED"
                    : "NOT_RECOMMENDED",

            status:
                recommended
                    ? STATUS.RECOMMENDED
                    : STATUS.NOT_RECOMMENDED,

            recommended,

            priority,

            contract_version:
                contract.version,

            contract_validation:
                validation,

            explanation:
                "Aggregate recommendation intelligence was produced only because an explicit governed Stream 9 recommendation contract was supplied and validated."
        };
    }

    function collectEvidenceUsed(
        factors
    ) {
        const evidence = [];

        Object.keys(
            factors
        ).forEach(
            function (
                factorKey
            ) {
                const factor =
                    factors[
                        factorKey
                    ];

                if (
                    !Array.isArray(
                        factor
                            ?.evidence_used
                    )
                ) {
                    return;
                }

                factor
                    .evidence_used
                    .forEach(
                        function (
                            item
                        ) {
                            evidence.push({
                                factor:
                                    factorKey,

                                ...item
                            });
                        }
                    );
            }
        );

        return evidence;
    }

    function collectMissingEvidence(
        factors
    ) {
        const missing = [];

        Object.keys(
            factors
        ).forEach(
            function (
                factorKey
            ) {
                const factor =
                    factors[
                        factorKey
                    ];

                if (
                    !Array.isArray(
                        factor
                            ?.missing_evidence
                    )
                ) {
                    return;
                }

                factor
                    .missing_evidence
                    .forEach(
                        function (
                            item
                        ) {
                            missing.push({
                                factor:
                                    factorKey,

                                missing:
                                    item
                            });
                        }
                    );
            }
        );

        return missing;
    }

    function determineFactorStatus(
        factors
    ) {
        const values =
            Object.values(
                factors
            );

        const unavailable =
            values.filter(
                function (
                    factor
                ) {
                    return (
                        factor.status ===
                            FACTOR_STATUS
                                .INSUFFICIENT_EVIDENCE ||
                        factor.status ===
                            FACTOR_STATUS
                                .UNAVAILABLE
                    );
                }
            ).length;

        const partial =
            values.filter(
                function (
                    factor
                ) {
                    return (
                        factor.status ===
                        FACTOR_STATUS.PARTIAL
                    );
                }
            ).length;

        if (
            unavailable ===
            values.length
        ) {
            return (
                STATUS
                    .INSUFFICIENT_EVIDENCE
            );
        }

        if (
            unavailable > 0 ||
            partial > 0
        ) {
            return (
                STATUS.PARTIAL
            );
        }

        return (
            STATUS.AVAILABLE
        );
    }

    function buildExplanation(
        event,
        athlete,
        eventType,
        factors,
        recommendation
    ) {
        const eventName =
            event
                ?.event_name ||
            event
                ?.name ||
            "Event";

        const athleteName =
            athlete
                ?.athlete_display_name ||
            [
                athlete
                    ?.first_name,
                athlete
                    ?.last_name
            ]
                .filter(Boolean)
                .join(" ") ||
            "Athlete";

        const availableFactors =
            Object.entries(
                factors
            )
                .filter(
                    function (
                        entry
                    ) {
                        return (
                            entry[1]
                                .status ===
                            FACTOR_STATUS
                                .AVAILABLE
                        );
                    }
                )
                .map(
                    function (
                        entry
                    ) {
                        return entry[0];
                    }
                );

        const limitedFactors =
            Object.entries(
                factors
            )
                .filter(
                    function (
                        entry
                    ) {
                        return (
                            entry[1]
                                .status !==
                            FACTOR_STATUS
                                .AVAILABLE
                        );
                    }
                )
                .map(
                    function (
                        entry
                    ) {
                        return entry[0];
                    }
                );

        return {
            summary:
                `${eventName} was evaluated as a ${eventType.label} opportunity for ${athleteName}. Camp / Combine Intelligence is downstream recommendation intelligence and does not alter the athlete's Athletic, Production, Academic, Verification, Competition, or Composite scores.`,

            event_type:
                eventType,

            available_factors:
                availableFactors,

            limited_factors:
                limitedFactors,

            recommendation_status:
                recommendation
                    .status,

            recommendation_explanation:
                recommendation
                    .explanation,

            factors: Object.keys(
                factors
            ).map(
                function (
                    factorKey
                ) {
                    return {
                        factor:
                            factorKey,

                        classification:
                            factors[
                                factorKey
                            ]
                                .classification,

                        status:
                            factors[
                                factorKey
                            ]
                                .status,

                        explanation:
                            factors[
                                factorKey
                            ]
                                .explanation
                    };
                }
            ),

            limitations: [
                "No athlete domain score is recalculated here.",
                "No recruiter credential creates athlete performance points.",
                "No notification is sent by this authority.",
                "No communication payload is created by this authority.",
                "No routing receipt is persisted by this authority.",
                "No event registration action is executed by this authority.",
                "No aggregate recommendation weighting is guessed.",
                "Recommendation remains pending when governed recommendation weights or required factor evidence are unavailable."
            ],

            downstream_rule:
                "Recommendation Intelligence may be consumed by authorized Workspace and Communication authorities. Recommendation does not execute the recommended action."
        };
    }

    /*
    ============================================================================
    MAIN INTERPRETATION
    ============================================================================
    */

    function evaluateEvent(
        event = {},
        context = {},
        options = {}
    ) {
        lastError = null;

        try {
            const authority =
                validateStream9Authority();

            if (
                !authority.valid
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        authority.status,

                    athlete_id:
                        context
                            ?.athlete
                            ?.athlete_id ||
                        null,

                    snapshot_id:
                        context
                            ?.athlete
                            ?.snapshot_id ||
                        null,

                    event_id:
                        event
                            ?.event_id ||
                        event
                            ?.id ||
                        null,

                    flags: [
                        authority.status
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            const athlete =
                context
                    ?.athlete;

            if (
                !athlete ||
                typeof athlete !==
                    "object"
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS
                            .INVALID_INPUT,

                    athlete_id:
                        null,

                    snapshot_id:
                        null,

                    event_id:
                        event
                            ?.event_id ||
                        event
                            ?.id ||
                        null,

                    flags: [
                        "ATHLETE_CONTEXT_REQUIRED"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            if (
                !athlete
                    .athlete_id ||
                !athlete
                    .snapshot_id
            ) {
                const missing =
                    [];

                if (
                    !athlete
                        .athlete_id
                ) {
                    missing.push(
                        "athlete_id"
                    );
                }

                if (
                    !athlete
                        .snapshot_id
                ) {
                    missing.push(
                        "snapshot_id"
                    );
                }

                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS
                            .INVALID_INPUT,

                    athlete_id:
                        athlete
                            .athlete_id ||
                        null,

                    snapshot_id:
                        athlete
                            .snapshot_id ||
                        null,

                    event_id:
                        event
                            ?.event_id ||
                        event
                            ?.id ||
                        null,

                    missing_evidence:
                        missing,

                    flags: [
                        "REQUIRED_IDENTITY_MISSING"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            if (
                !event ||
                typeof event !==
                    "object" ||
                (
                    !event.event_id &&
                    !event.id &&
                    !event.event_name &&
                    !event.name
                )
            ) {
                const result = {
                    ok:
                        false,

                    authority:
                        ENGINE_ID,

                    authority_key:
                        AUTHORITY_KEY,

                    authority_version:
                        VERSION,

                    contract_version:
                        CONTRACT_VERSION,

                    status:
                        STATUS
                            .INVALID_INPUT,

                    athlete_id:
                        athlete
                            .athlete_id,

                    snapshot_id:
                        athlete
                            .snapshot_id,

                    event_id:
                        null,

                    flags: [
                        "EVENT_CONTEXT_REQUIRED"
                    ],

                    generated_at:
                        nowISO()
                };

                lastResult =
                    result;

                return result;
            }

            const eventType =
                resolveEventType(
                    event
                );

            const factors = {
                sport_fit:
                    evaluateSportFit(
                        event,
                        athlete
                    ),

                position_fit:
                    evaluatePositionFit(
                        event,
                        athlete
                    ),

                readiness_fit:
                    evaluateReadinessFit(
                        eventType,
                        context
                            .readiness
                    ),

                pathway_fit:
                    evaluatePathwayFit(
                        event,
                        context
                            .pathway
                    ),

                academic_fit:
                    evaluateAcademicFit(
                        event,
                        context
                            .academic,
                        context
                            .eligibility
                    ),

                recruiter_fit:
                    evaluateRecruiterFit(
                        event,
                        athlete,
                        context
                            .pathway
                    ),

                geography_fit:
                    evaluateGeographyFit(
                        event,
                        athlete
                    )
            };

            const factorStatus =
                determineFactorStatus(
                    factors
                );

            const recommendation =
                calculateGovernedRecommendation(
                    factors,
                    options
                        .recommendation_contract ||
                    context
                        .recommendation_contract ||
                    null
                );

            const flags = [];

            if (
                eventType.code ===
                "UNKNOWN"
            ) {
                flags.push(
                    "EVENT_TYPE_UNRESOLVED"
                );
            }

            if (
                recommendation
                    .status ===
                STATUS
                    .RECOMMENDATION_PENDING
            ) {
                flags.push(
                    "RECOMMENDATION_CONTRACT_OR_THRESHOLD_PENDING"
                );
            }

            if (
                factorStatus ===
                STATUS
                    .PARTIAL
            ) {
                flags.push(
                    "PARTIAL_RECOMMENDATION_EVIDENCE"
                );
            }

            if (
                factorStatus ===
                STATUS
                    .INSUFFICIENT_EVIDENCE
            ) {
                flags.push(
                    "INSUFFICIENT_RECOMMENDATION_EVIDENCE"
                );
            }

            const meetingTargets =
                Array.isArray(
                    factors
                        .recruiter_fit
                        .meeting_targets
                )
                    ? factors
                        .recruiter_fit
                        .meeting_targets
                    : [];

            const result = {
                ok:
                    true,

                authority:
                    ENGINE_ID,

                authority_key:
                    AUTHORITY_KEY,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "DOWNSTREAM_RECOMMENDATION_INTELLIGENCE",

                official:
                    true,

                athlete_id:
                    athlete
                        .athlete_id,

                snapshot_id:
                    athlete
                        .snapshot_id,

                event_id:
                    event
                        .event_id ||
                    event
                        .id ||
                    null,

                event_name:
                    event
                        .event_name ||
                    event
                        .name ||
                    "Unnamed Event",

                event_type:
                    eventType,

                factors,

                factor_status:
                    factorStatus,

                recommendation: {
                    status:
                        recommendation
                            .status,

                    available:
                        recommendation
                            .available,

                    score:
                        recommendation
                            .score,

                    classification:
                        recommendation
                            .classification,

                    recommended:
                        recommendation
                            .recommended ??
                        null,

                    priority:
                        recommendation
                            .priority ||
                        null,

                    contract_version:
                        recommendation
                            .contract_version ||
                        null
                },

                confidence: {
                    value:
                        null,

                    status:
                        "CONFIDENCE_AUTHORITY_REQUIRED",

                    rule:
                        "Camp / Combine Intelligence does not manufacture confidence from recommendation strength."
                },

                meeting_targets:
                    meetingTargets,

                evidence_used:
                    collectEvidenceUsed(
                        factors
                    ),

                missing_evidence:
                    collectMissingEvidence(
                        factors
                    ),

                flags:
                    Array.from(
                        new Set(
                            flags
                        )
                    ),

                prohibited_actions: {
                    notification_send:
                        true,

                    message_send:
                        true,

                    event_registration:
                        true,

                    recruiter_contact:
                        true,

                    receipt_persistence:
                        true,

                    athlete_score_recalculation:
                        true
                },

                explanation:
                    buildExplanation(
                        event,
                        athlete,
                        eventType,
                        factors,
                        recommendation
                    ),

                status:
                    recommendation
                        .available
                        ? recommendation
                            .status
                        : factorStatus ===
                            STATUS
                                .INSUFFICIENT_EVIDENCE
                            ? STATUS
                                .INSUFFICIENT_EVIDENCE
                            : STATUS
                                .RECOMMENDATION_PENDING,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;

        } catch (error) {
            lastError = {
                message:
                    error instanceof Error
                        ? error.message
                        : String(error),

                generated_at:
                    nowISO()
            };

            const result = {
                ok:
                    false,

                authority:
                    ENGINE_ID,

                authority_key:
                    AUTHORITY_KEY,

                authority_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                status:
                    STATUS.ERROR,

                athlete_id:
                    context
                        ?.athlete
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    context
                        ?.athlete
                        ?.snapshot_id ||
                    null,

                event_id:
                    event
                        ?.event_id ||
                    event
                        ?.id ||
                    null,

                flags: [
                    "CAMP_COMBINE_INTELLIGENCE_EXECUTION_ERROR"
                ],

                error:
                    lastError
                        .message,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }
    }

    function rankEvents(
        events = [],
        context = {},
        options = {}
    ) {
        if (
            !Array.isArray(
                events
            )
        ) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .INVALID_INPUT,

                results:
                    [],

                flags: [
                    "EVENT_LIST_REQUIRED"
                ],

                generated_at:
                    nowISO()
            };
        }

        const results =
            events.map(
                function (
                    event
                ) {
                    return evaluateEvent(
                        event,
                        context,
                        options
                    );
                }
            );

        /*
        A deterministic ordered ranking is allowed only when governed
        recommendation scores actually exist.

        Pending recommendations are never assigned artificial zeros.
        */

        const scored =
            results
                .filter(
                    function (
                        item
                    ) {
                        return (
                            item
                                .recommendation
                                ?.score !==
                                null &&
                            item
                                .recommendation
                                ?.score !==
                                undefined
                        );
                    }
                )
                .sort(
                    function (
                        a,
                        b
                    ) {
                        return (
                            b
                                .recommendation
                                .score -
                            a
                                .recommendation
                                .score
                        );
                    }
                );

        const pending =
            results
                .filter(
                    function (
                        item
                    ) {
                        return (
                            item
                                .recommendation
                                ?.score ===
                                null ||
                            item
                                .recommendation
                                ?.score ===
                                undefined
                        );
                    }
                );

        return {
            ok:
                true,

            authority:
                ENGINE_ID,

            authority_version:
                VERSION,

            athlete_id:
                context
                    ?.athlete
                    ?.athlete_id ||
                null,

            snapshot_id:
                context
                    ?.athlete
                    ?.snapshot_id ||
                null,

            ranked:
                scored,

            pending:
                pending,

            total_events:
                results.length,

            ranked_count:
                scored.length,

            pending_count:
                pending.length,

            status:
                pending.length
                    ? "PARTIAL_OR_PENDING_RECOMMENDATIONS"
                    : "RANKED",

            generated_at:
                nowISO()
        };
    }

    /*
    ============================================================================
    COMPATIBILITY ALIASES
    ----------------------------------------------------------------------------
    Legacy method names remain callable but now return governed recommendation
    intelligence only.

    No notification creation.
    No receipt creation.
    No DOM rendering.
    ============================================================================
    */

    function calculateEventMatch(
        event,
        systems = {},
        options = {}
    ) {
        return evaluateEvent(
            event,
            systems,
            options
        );
    }

    function getContract() {
        return {
            authority_key:
                AUTHORITY_KEY,

            authority:
                ENGINE_ID,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                "DOWNSTREAM_RECOMMENDATION_INTELLIGENCE",

            required_input: [
                "athlete.athlete_id",
                "athlete.snapshot_id",
                "event"
            ],

            governed_context: [
                "athlete",
                "readiness",
                "pathway",
                "academic",
                "eligibility",
                "recruiting",
                "event",
                "recruiter/program context"
            ],

            factors:
                Array.from(
                    REQUIRED_RECOMMENDATION_FACTORS
                ),

            aggregate_score_rule:
                "No aggregate event recommendation score may be generated unless an explicit Stream 9 governed recommendation weighting contract is supplied and validates to 100.",

            certification_rule:
                "Professional certification establishes authority/provenance only and never adds athlete ability or fit points.",

            communication_rule:
                "This authority produces recommendation intelligence only. Stream 6 owns communication execution.",

            receipt_rule:
                "This authority may expose intelligence suitable for receipt capture, but it does not create or persist communication/runtime receipts.",

            action_rule:
                "Recommendation does not execute registration, contact, messaging, scheduling, or placement.",

            presentation_rule:
                "This authority does not render UI or manipulate DOM.",

            downstream_isolation_rule:
                "Camp / Combine Intelligence may not become the source authority for Athletic, Production, Academic, Competition, Verification, or Composite athlete scores."
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            event_types:
                EVENT_TYPES,

            recommendation_factors:
                Array.from(
                    REQUIRED_RECOMMENDATION_FACTORS
                ),

            internal_proprietary_weights:
                false,

            guessed_weights:
                false,

            notifications:
                false,

            receipt_creation:
                false,

            dom_rendering:
                false,

            automatic_execution:
                false
        };
    }

    function getLastResult() {
        return lastResult;
    }

    function getLastError() {
        return lastError;
    }

    function runHealthCheck() {
        const authority =
            validateStream9Authority();

        const healthy =
            authority.valid;

        return {
            authority:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            authority_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                healthy
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_9_authority:
                authority,

            recommendation_factors:
                Array.from(
                    REQUIRED_RECOMMENDATION_FACTORS
                ),

            legacy_internal_weighting_active:
                false,

            guessed_recommendation_weights:
                false,

            recruiter_certification_adds_points:
                false,

            athlete_domain_scoring:
                false,

            communication_execution:
                false,

            notification_generation:
                false,

            receipt_persistence:
                false,

            event_registration:
                false,

            dom_rendering:
                false,

            automatic_execution:
                false,

            generated_at:
                nowISO()
        };
    }

    const CampCombineIntelligenceAuthority =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            authority_key:
                AUTHORITY_KEY,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            status:
                "ACTIVE",

            classification:
                "DOWNSTREAM_CAMP_COMBINE_RECOMMENDATION_INTELLIGENCE_AUTHORITY",

            event_types:
                EVENT_TYPES,

            evaluateEvent,

            calculateEventMatch,

            rankEvents,

            resolveEventType,

            validateRecommendationContract,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScoreCampCombineIntelligenceEngine =
        CampCombineIntelligenceAuthority;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.CampCombineIntelligenceEngine =
        CampCombineIntelligenceAuthority;

    console.info(
        "[STATS-CORE] Camp / Combine Recommendation Intelligence Authority loaded:",
        VERSION,
        "| explicit invocation required | no guessed weights | communication disabled | DOM disabled"
    );

})(window); 
