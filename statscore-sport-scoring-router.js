/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-sport-scoring-router.js
*
* Classification:
*     CANONICAL SPORT INTELLIGENCE ROUTER / COORDINATION AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-SPORT-INTELLIGENCE-ROUTER-V2
*
* Contract Version:
*     STATSCORE-SPORT-INTELLIGENCE-CONTRACT-V1
*
* Status:
*     RECONSTRUCTED — GOVERNED ROUTING AUTHORITY
*
* Purpose:
*     Resolve the athlete sport, invoke the correct governed sport-specific
*     supporting intelligence authority, and normalize the returned intelligence
*     into one score-neutral Sport Intelligence Contract for downstream Stream 9
*     domain matrices and authorities.
*
* Constitutional Chain:
*
*     Governed Athlete Snapshot
*              ↓
*     Sport Resolution
*              ↓
*     Sport-Specific Supporting Intelligence Authority
*              ↓
*     Normalized Sport Intelligence Contract
*              ↓
*     Registered Stream 9 Domain Authorities
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*
* This router DOES:
*     - normalize the active sport;
*     - resolve the correct sport-specific authority;
*     - prefer interpretAthlete() as the canonical invocation;
*     - allow scoreAthlete() only as a compatibility alias;
*     - preserve athlete_id and snapshot_id;
*     - preserve sport-specific position/event context;
*     - preserve archetype context;
*     - preserve traits;
*     - preserve raw measurements;
*     - preserve evidence_used;
*     - preserve missing_evidence;
*     - preserve flags;
*     - preserve confidence context;
*     - preserve explanation;
*     - fail closed for unsupported or unavailable sport authorities.
*
* This router DOES NOT:
*     - calculate an Athletic Score;
*     - calculate a Production Score;
*     - calculate an Academic Score;
*     - calculate a Competition Score;
*     - calculate a Verification Score;
*     - calculate Position Score;
*     - calculate STATScore™;
*     - calculate Composite Intelligence;
*     - normalize legacy final_score into official intelligence;
*     - normalize legacy score_final into official intelligence;
*     - preserve legacy star ratings as official authority;
*     - manufacture missing matrix authority;
*     - invoke generic legacy scoring as a fallback;
*     - render UI;
*     - manipulate DOM;
*     - execute automatically.
*
* Governing Doctrine:
*     Evidence ≠ Intelligence
*     Intelligence ≠ Presentation
*     Score ≠ Confidence
*     PROJECTED ≠ OFFICIAL
*     Missing ≠ Zero
*     Missing Authority ≠ Permission to Reconstruct Authority
*     One Domain — One Source Authority
*
* Critical Rule:
*     Sport routing is not score publication.
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-sport-scoring-router";

    const AUTHORITY_KEY =
        "SPORT_INTELLIGENCE_ROUTER";

    const VERSION =
        "STATSCORE-SPORT-INTELLIGENCE-ROUTER-V2";

    const CONTRACT_VERSION =
        "STATSCORE-SPORT-INTELLIGENCE-CONTRACT-V1";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const STATUS = Object.freeze({
        READY:
            "READY",

        PARTIAL:
            "PARTIAL",

        PROJECTED:
            "PROJECTED",

        INSUFFICIENT_EVIDENCE:
            "INSUFFICIENT_EVIDENCE",

        INVALID_INPUT:
            "INVALID_INPUT",

        UNSUPPORTED_SPORT:
            "UNSUPPORTED_SPORT",

        SPORT_AUTHORITY_PENDING:
            "SPORT_AUTHORITY_PENDING",

        SPORT_AUTHORITY_ERROR:
            "SPORT_AUTHORITY_ERROR",

        AUTHORITY_UNAVAILABLE:
            "AUTHORITY_UNAVAILABLE",

        AUTHORITY_UNAUTHORIZED:
            "AUTHORITY_UNAUTHORIZED",

        CONTRACT_INVALID:
            "CONTRACT_INVALID"
    });

    const SUPPORTED_SPORTS = Object.freeze({

        FOOTBALL: Object.freeze({
            sport:
                "FOOTBALL",

            label:
                "Football",

            authority_key:
                "STATScoreFootballScoringEngine",

            namespace_key:
                "FootballScoringEngine",

            canonical_method:
                "interpretAthlete",

            compatibility_methods:
                Object.freeze([
                    "scoreAthlete"
                ]),

            status:
                "ACTIVE"
        }),

        BASKETBALL: Object.freeze({
            sport:
                "BASKETBALL",

            label:
                "Basketball",

            authority_key:
                "STATScoreBasketballScoringEngine",

            namespace_key:
                "BasketballScoringEngine",

            canonical_method:
                "interpretAthlete",

            compatibility_methods:
                Object.freeze([
                    "scoreAthlete"
                ]),

            status:
                "ACTIVE"
        }),

        BASEBALL: Object.freeze({
            sport:
                "BASEBALL",

            label:
                "Baseball",

            authority_key:
                "STATScoreBaseballScoringEngine",

            namespace_key:
                "BaseballScoringEngine",

            canonical_method:
                "interpretAthlete",

            compatibility_methods:
                Object.freeze([
                    "scoreAthlete"
                ]),

            status:
                "ACTIVE"
        }),

        TRACK: Object.freeze({
            sport:
                "TRACK",

            label:
                "Track",

            authority_key:
                "STATScoreTrackScoringEngine",

            namespace_key:
                "TrackScoringEngine",

            canonical_method:
                "interpretAthlete",

            compatibility_methods:
                Object.freeze([
                    "scoreAthlete"
                ]),

            status:
                "ACTIVE"
        })

    });

    let lastResult = null;
    let lastError = null;

    function nowISO() {
        return new Date().toISOString();
    }

    function normalize(value) {
        return String(
            value == null
                ? ""
                : value
        ).trim();
    }

    function upper(value) {
        return normalize(value)
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/-/g, "_")
            .replace(/&/g, "AND");
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

                BBALL:
                    "BASKETBALL",

                HOOPS:
                    "BASKETBALL",

                BASKETBALL:
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
                    "TRACK",

                TRACKANDFIELD:
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

    function getSport(snapshot = {}) {
        return normalizeSport(
            snapshot.primary_sport ||
            snapshot.sport ||
            snapshot
                ?.raw_payload
                ?.primarySport ||
            snapshot
                ?.raw_payload
                ?.primary_sport ||
            snapshot
                ?.raw_payload
                ?.sport ||
            ""
        );
    }

    function getSportConfig(
        sport
    ) {
        return (
            SUPPORTED_SPORTS[
                normalizeSport(
                    sport
                )
            ] ||
            null
        );
    }

    function getAuthorityForSport(
        sport
    ) {
        const config =
            getSportConfig(
                sport
            );

        if (!config) {
            return null;
        }

        return (
            global[
                config
                    .authority_key
            ] ||
            global.STATScore
                ?.[
                    config
                        .namespace_key
                ] ||
            null
        );
    }

    function resolveInvocationMethod(
        authority,
        config
    ) {
        if (
            authority &&
            typeof authority[
                config
                    .canonical_method
            ] === "function"
        ) {
            return {
                method:
                    config
                        .canonical_method,

                compatibility:
                    false
            };
        }

        for (
            const method
            of config
                .compatibility_methods
        ) {
            if (
                authority &&
                typeof authority[
                    method
                ] === "function"
            ) {
                return {
                    method,

                    compatibility:
                        true
                };
            }
        }

        return null;
    }

    function invokeSportAuthority(
        snapshot,
        options = {}
    ) {
        const sport =
            getSport(
                snapshot
            );

        const config =
            getSportConfig(
                sport
            );

        if (!config) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .UNSUPPORTED_SPORT,

                sport,

                configuration:
                    null,

                authority:
                    null,

                invocation:
                    null,

                output:
                    null
            };
        }

        const authority =
            getAuthorityForSport(
                sport
            );

        if (!authority) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .SPORT_AUTHORITY_PENDING,

                sport,

                configuration:
                    config,

                authority:
                    null,

                invocation:
                    null,

                output:
                    null
            };
        }

        const invocation =
            resolveInvocationMethod(
                authority,
                config
            );

        if (!invocation) {
            return {
                ok:
                    false,

                status:
                    STATUS
                        .SPORT_AUTHORITY_PENDING,

                sport,

                configuration:
                    config,

                authority,

                invocation:
                    null,

                output:
                    null
            };
        }

        try {
            const output =
                authority[
                    invocation
                        .method
                ](
                    snapshot,
                    options
                );

            return {
                ok:
                    true,

                status:
                    "SPORT_AUTHORITY_INVOKED",

                sport,

                configuration:
                    config,

                authority,

                invocation,

                output:
                    output ||
                    null
            };

        } catch (error) {
            lastError = {
                sport,

                message:
                    error instanceof Error
                        ? error.message
                        : String(error),

                generated_at:
                    nowISO()
            };

            return {
                ok:
                    false,

                status:
                    STATUS
                        .SPORT_AUTHORITY_ERROR,

                sport,

                configuration:
                    config,

                authority,

                invocation,

                output:
                    null,

                error:
                    lastError
                        .message
            };
        }
    }

    function normalizeArray(
        value
    ) {
        return Array.isArray(
            value
        )
            ? value
            : [];
    }

    function normalizeObject(
        value
    ) {
        return (
            value &&
            typeof value ===
                "object" &&
            !Array.isArray(value)
        )
            ? value
            : {};
    }

    function extractPositionOrEvent(
        output,
        snapshot
    ) {
        return {
            position:
                output
                    ?.position ||
                output
                    ?.position_or_event
                    ?.position ||
                snapshot
                    ?.primary_position ||
                snapshot
                    ?.position ||
                null,

            event:
                output
                    ?.event ||
                output
                    ?.position_or_event
                    ?.event ||
                snapshot
                    ?.primary_event ||
                snapshot
                    ?.event ||
                snapshot
                    ?.track_event ||
                null,

            event_group:
                output
                    ?.event_group ||
                output
                    ?.position_or_event
                    ?.event_group ||
                null
        };
    }

    function extractArchetypeContext(
        output
    ) {
        if (
            output
                ?.archetype_context
        ) {
            return output
                .archetype_context;
        }

        if (
            output
                ?.archetype_candidates
        ) {
            return {
                selected:
                    null,

                candidates:
                    output
                        .archetype_candidates
            };
        }

        if (
            output
                ?.archetype ||
            output
                ?.archetype_code
        ) {
            return {
                selected: {
                    code:
                        output
                            .archetype_code ||
                        null,

                    label:
                        output
                            .archetype ||
                        null
                },

                candidates:
                    []
            };
        }

        return {
            selected:
                null,

            candidates:
                []
        };
    }

    function extractConfidenceContext(
        output
    ) {
        if (
            output
                ?.confidence_context
        ) {
            return output
                .confidence_context;
        }

        if (
            output
                ?.confidence !==
            undefined
        ) {
            return {
                value:
                    output
                        .confidence,

                source:
                    output
                        .confidence_source ||
                    "SPORT_AUTHORITY"
            };
        }

        return {
            value:
                null,

            source:
                null,

            status:
                "CONFIDENCE_NOT_PRODUCED_BY_ROUTER"
        };
    }

    function sanitizeLegacyScoreFields(
        output
    ) {
        const detected =
            [];

        const legacyFields = [
            "final_score",
            "score_final",
            "score",
            "athletic_score",
            "production_score",
            "academic_score",
            "competition_score",
            "verification_score",
            "position_score",
            "statscore",
            "composite",
            "composite_score",
            "star_signal",
            "star_projection",
            "score_band"
        ];

        legacyFields
            .forEach(
                function (
                    field
                ) {
                    if (
                        output &&
                        output[
                            field
                        ] !==
                        undefined &&
                        output[
                            field
                        ] !==
                        null
                    ) {
                        detected
                            .push(
                                field
                            );
                    }
                }
            );

        return detected;
    }

    function normalizeSportIntelligenceOutput(
        invocationResult,
        snapshot
    ) {
        const sport =
            invocationResult
                .sport;

        const output =
            invocationResult
                .output;

        if (!output) {
            return {
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

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SPORT_INTELLIGENCE_ROUTER",

                sport,

                athlete_id:
                    snapshot
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    snapshot
                        ?.snapshot_id ||
                    null,

                official:
                    false,

                status:
                    STATUS
                        .INSUFFICIENT_EVIDENCE,

                flags: [
                    "SPORT_AUTHORITY_RETURNED_NO_OUTPUT"
                ],

                generated_at:
                    nowISO()
            };
        }

        const legacyScoreFields =
            sanitizeLegacyScoreFields(
                output
            );

        const positionOrEvent =
            extractPositionOrEvent(
                output,
                snapshot
            );

        const archetypeContext =
            extractArchetypeContext(
                output
            );

        const flags = [
            ...normalizeArray(
                output
                    .flags
            )
        ];

        if (
            invocationResult
                .invocation
                ?.compatibility ===
            true
        ) {
            flags.push(
                "COMPATIBILITY_INVOCATION_USED"
            );
        }

        if (
            legacyScoreFields.length
        ) {
            flags.push(
                "LEGACY_SCORE_FIELDS_SUPPRESSED"
            );
        }

        const normalized = {
            ok:
                output
                    .ok !==
                false,

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
                "NORMALIZED_SUPPORTING_SPORT_INTELLIGENCE",

            official:
                false,

            sport,

            athlete_id:
                output
                    .athlete_id ||
                snapshot
                    ?.athlete_id ||
                null,

            snapshot_id:
                output
                    .snapshot_id ||
                snapshot
                    ?.snapshot_id ||
                null,

            sport_authority: {
                authority_key:
                    invocationResult
                        .configuration
                        ?.authority_key ||
                    null,

                authority_version:
                    output
                        .authority_version ||
                    output
                        .version ||
                    null,

                invocation_method:
                    invocationResult
                        .invocation
                        ?.method ||
                    null,

                compatibility_invocation:
                    invocationResult
                        .invocation
                        ?.compatibility ===
                    true
            },

            position_or_event:
                positionOrEvent,

            archetype_context:
                archetypeContext,

            traits:
                normalizeObject(
                    output
                        .traits
                ),

            raw_measurements:
                normalizeObject(
                    output
                        .raw_measurements
                ),

            evidence_used:
                normalizeArray(
                    output
                        .evidence_used
                ),

            missing_evidence:
                normalizeArray(
                    output
                        .missing_evidence
                ),

            confidence_context:
                extractConfidenceContext(
                    output
                ),

            flags:
                Array.from(
                    new Set(
                        flags
                    )
                ),

            explanation:
                output
                    .explanation ||
                null,

            source_status:
                output
                    .status ||
                null,

            status:
                output
                    .status ||
                STATUS.READY,

            downstream_authority_required:
                true,

            prohibited_publication: {
                athletic_score:
                    true,

                production_score:
                    true,

                academic_score:
                    true,

                competition_score:
                    true,

                verification_score:
                    true,

                position_score:
                    true,

                final_score:
                    true,

                score_final:
                    true,

                statscore:
                    true,

                composite:
                    true,

                official_star_rating:
                    true
            },

            suppressed_legacy_score_fields:
                legacyScoreFields,

            generated_at:
                output
                    .generated_at ||
                output
                    .created_at ||
                nowISO()
        };

        return normalized;
    }

    function unsupportedSportResult(
        snapshot,
        sport
    ) {
        return {
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

            stream_owner:
                STREAM_OWNER,

            classification:
                "SPORT_INTELLIGENCE_ROUTER",

            official:
                false,

            sport,

            athlete_id:
                snapshot
                    ?.athlete_id ||
                null,

            snapshot_id:
                snapshot
                    ?.snapshot_id ||
                null,

            position_or_event: {
                position:
                    null,

                event:
                    null,

                event_group:
                    null
            },

            archetype_context: {
                selected:
                    null,

                candidates:
                    []
            },

            traits:
                {},

            raw_measurements:
                {},

            evidence_used:
                [],

            missing_evidence: [
                "SUPPORTED_SPORT_AUTHORITY"
            ],

            confidence_context: {
                value:
                    null,

                status:
                    "UNAVAILABLE"
            },

            flags: [
                `Unsupported sport: ${sport || "UNKNOWN"}.`
            ],

            explanation: {
                summary:
                    "No governed sport-specific supporting intelligence authority exists for this sport.",

                failure_rule:
                    "Unsupported sport authority fails closed.",

                scoring_rule:
                    "No official score has been manufactured."
            },

            status:
                STATUS
                    .UNSUPPORTED_SPORT,

            generated_at:
                nowISO()
        };
    }

    function pendingAuthorityResult(
        snapshot,
        sport,
        config
    ) {
        return {
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

            stream_owner:
                STREAM_OWNER,

            classification:
                "SPORT_INTELLIGENCE_ROUTER",

            official:
                false,

            sport,

            athlete_id:
                snapshot
                    ?.athlete_id ||
                null,

            snapshot_id:
                snapshot
                    ?.snapshot_id ||
                null,

            position_or_event: {
                position:
                    null,

                event:
                    null,

                event_group:
                    null
            },

            archetype_context: {
                selected:
                    null,

                candidates:
                    []
            },

            traits:
                {},

            raw_measurements:
                {},

            evidence_used:
                [],

            missing_evidence: [
                `${config?.label || sport}_SPORT_AUTHORITY`
            ],

            confidence_context: {
                value:
                    null,

                status:
                    "UNAVAILABLE"
            },

            flags: [
                `${config?.label || sport} supporting sport authority is not available.`
            ],

            explanation: {
                summary:
                    "The sport is part of the Phoenix Multi-Sport Scoring Framework™, but its governed supporting intelligence authority is unavailable.",

                failure_rule:
                    "Missing sport authority does not authorize generic fallback scoring.",

                scoring_rule:
                    "No official score has been manufactured."
            },

            status:
                STATUS
                    .SPORT_AUTHORITY_PENDING,

            generated_at:
                nowISO()
        };
    }

    function route(
        snapshot = {},
        options = {}
    ) {
        lastError = null;

        if (
            !snapshot ||
            typeof snapshot !==
                "object" ||
            Array.isArray(
                snapshot
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

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SPORT_INTELLIGENCE_ROUTER",

                official:
                    false,

                status:
                    STATUS
                        .INVALID_INPUT,

                athlete_id:
                    null,

                snapshot_id:
                    null,

                flags: [
                    "ATHLETE_SNAPSHOT_REQUIRED"
                ],

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }

        const authorityValidation =
            validateStream9Authority();

        if (
            !authorityValidation
                .valid
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

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SPORT_INTELLIGENCE_ROUTER",

                official:
                    false,

                status:
                    authorityValidation
                        .status,

                athlete_id:
                    snapshot
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    snapshot
                        ?.snapshot_id ||
                    null,

                flags: [
                    authorityValidation
                        .status
                ],

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }

        if (
            !snapshot
                .athlete_id ||
            !snapshot
                .snapshot_id
        ) {
            const missing =
                [];

            if (
                !snapshot
                    .athlete_id
            ) {
                missing.push(
                    "athlete_id"
                );
            }

            if (
                !snapshot
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

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SPORT_INTELLIGENCE_ROUTER",

                official:
                    false,

                status:
                    STATUS
                        .INVALID_INPUT,

                athlete_id:
                    snapshot
                        .athlete_id ||
                    null,

                snapshot_id:
                    snapshot
                        .snapshot_id ||
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

        const sport =
            getSport(
                snapshot
            );

        const config =
            getSportConfig(
                sport
            );

        if (!config) {
            const result =
                unsupportedSportResult(
                    snapshot,
                    sport
                );

            lastResult =
                result;

            return result;
        }

        const invocationResult =
            invokeSportAuthority(
                snapshot,
                options
            );

        if (
            !invocationResult.ok
        ) {
            if (
                invocationResult
                    .status ===
                STATUS
                    .SPORT_AUTHORITY_PENDING
            ) {
                const result =
                    pendingAuthorityResult(
                        snapshot,
                        sport,
                        config
                    );

                lastResult =
                    result;

                return result;
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

                stream_owner:
                    STREAM_OWNER,

                classification:
                    "SPORT_INTELLIGENCE_ROUTER",

                official:
                    false,

                status:
                    invocationResult
                        .status,

                sport,

                athlete_id:
                    snapshot
                        .athlete_id,

                snapshot_id:
                    snapshot
                        .snapshot_id,

                flags: [
                    invocationResult
                        .status
                ],

                error:
                    invocationResult
                        .error ||
                    null,

                generated_at:
                    nowISO()
            };

            lastResult =
                result;

            return result;
        }

        const result =
            normalizeSportIntelligenceOutput(
                invocationResult,
                snapshot
            );

        lastResult =
            result;

        return result;
    }

    /*
     * -------------------------------------------------------------------------
     * Compatibility alias
     * -------------------------------------------------------------------------
     *
     * Historical consumers may still call score().
     *
     * It now routes supporting sport intelligence only.
     * No official score fields are returned.
     */

    function score(
        snapshot = {},
        options = {}
    ) {
        return route(
            snapshot,
            options
        );
    }

    function isSupportedSport(
        sport
    ) {
        return Boolean(
            getSportConfig(
                sport
            )
        );
    }

    function isActiveSport(
        sport
    ) {
        const config =
            getSportConfig(
                sport
            );

        if (!config) {
            return false;
        }

        const authority =
            getAuthorityForSport(
                sport
            );

        if (!authority) {
            return false;
        }

        return Boolean(
            resolveInvocationMethod(
                authority,
                config
            )
        );
    }

    function getRegisteredSports() {
        return Object.entries(
            SUPPORTED_SPORTS
        ).map(
            function (
                [sport, config]
            ) {
                const authority =
                    getAuthorityForSport(
                        sport
                    );

                const invocation =
                    authority
                        ? resolveInvocationMethod(
                            authority,
                            config
                        )
                        : null;

                return {
                    sport,

                    label:
                        config.label,

                    status:
                        config.status,

                    authority_key:
                        config
                            .authority_key,

                    canonical_method:
                        config
                            .canonical_method,

                    authority_loaded:
                        Boolean(
                            authority
                        ),

                    invocation_available:
                        Boolean(
                            invocation
                        ),

                    compatibility_only:
                        Boolean(
                            invocation
                                ?.compatibility
                        ),

                    active:
                        Boolean(
                            authority &&
                            invocation
                        )
                };
            }
        );
    }

    function getContract() {
        return {
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
                "CANONICAL_SPORT_INTELLIGENCE_ROUTER",

            active_sports:
                Object.keys(
                    SUPPORTED_SPORTS
                ),

            canonical_invocation:
                "interpretAthlete",

            compatibility_invocation:
                "scoreAthlete",

            required_input: [
                "athlete_id",
                "snapshot_id",
                "sport"
            ],

            output: [
                "athlete_id",
                "snapshot_id",
                "sport",
                "sport_authority",
                "position_or_event",
                "archetype_context",
                "traits",
                "raw_measurements",
                "evidence_used",
                "missing_evidence",
                "confidence_context",
                "flags",
                "explanation",
                "status",
                "generated_at"
            ],

            prohibited_output: [
                "official_final_score",
                "official_score_final",
                "official_athletic_score",
                "official_production_score",
                "official_academic_score",
                "official_competition_score",
                "official_verification_score",
                "official_position_score",
                "official_statscore",
                "official_composite",
                "official_star_rating"
            ],

            fallback_rule:
                "No generic scoring fallback is authorized.",

            missing_authority_rule:
                "Missing sport authority fails closed.",

            legacy_score_rule:
                "Legacy sport score fields may be detected for audit but are suppressed from the normalized official routing contract.",

            downstream_rule:
                "Sport-specific supporting intelligence must be consumed by registered Stream 9 domain authorities before official scoring.",

            execution_rule:
                "Explicit invocation only.",

            presentation_rule:
                "No rendering or DOM manipulation."
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

            supported_sports:
                SUPPORTED_SPORTS,

            generic_scoring_fallback:
                false,

            final_score_normalization:
                false,

            star_normalization:
                false,

            official_score_publication:
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
        const stream9 =
            validateStream9Authority();

        const registeredSports =
            getRegisteredSports();

        const healthySportCount =
            registeredSports
                .filter(
                    function (
                        item
                    ) {
                        return item.active;
                    }
                )
                .length;

        const healthy =
            stream9.valid &&
            healthySportCount ===
                registeredSports.length;

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
                stream9,

            registered_sports:
                registeredSports,

            active_sport_count:
                healthySportCount,

            expected_sport_count:
                registeredSports
                    .length,

            generic_scoring_fallback:
                false,

            final_score_publication:
                false,

            score_final_publication:
                false,

            official_star_publication:
                false,

            legacy_score_fields_normalized:
                false,

            dom_rendering:
                false,

            automatic_execution:
                false,

            generated_at:
                nowISO()
        };
    }

    const SportIntelligenceRouter =
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
                "CANONICAL_SPORT_INTELLIGENCE_ROUTER",

            supported_sports:
                SUPPORTED_SPORTS,

            normalizeSport,

            getSport,

            getSportConfig,

            getAuthorityForSport,

            route,

            /*
             * Compatibility alias only.
             * Does NOT publish a score.
             */
            score,

            isSupportedSport,

            isActiveSport,

            getRegisteredSports,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATSCORE_SPORT_SCORING_ROUTER =
        SportIntelligenceRouter;

    global.STATScoreSportScoringRouter =
        SportIntelligenceRouter;

    global.STATScore =
        global.STATScore || {};

    global.STATScore.SportScoringRouter =
        SportIntelligenceRouter;

    global.STATScore.SportIntelligenceRouter =
        SportIntelligenceRouter;

    console.info(
        "[STATS-CORE] Sport Intelligence Router loaded:",
        VERSION,
        "| score-neutral | generic fallback disabled | explicit invocation required"
    );

})(window); 
