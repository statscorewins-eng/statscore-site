/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-track-position-matrix.js
*
* Classification:
*     SUPPORTING TRACK EVENT / POSITION INTELLIGENCE AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-TRACK-POSITION-MATRIX-V2
*
* Status:
*     RECONSTRUCTED — GOVERNED SUPPORTING AUTHORITY
*
* Purpose:
*     Provide governed Track & Field event-group classification,
*     event/archetype interpretation, and trait vocabulary for downstream
*     Stream 9 sport intelligence and registered domain matrices.
*
* Constitutional Role:
*
*     Track Athlete Evidence
*              ↓
*     Track Event Normalization
*              ↓
*     Track Event-Group Authority
*              ↓
*     Track Archetype / Trait Authority
*              ↓
*     Track Sport Intelligence
*              ↓
*     Registered Stream 9 Domain Matrices
*              ↓
*     Score Authority
*              ↓
*     Composite Authority
*
* This file DOES:
*     - Normalize supported Track & Field events.
*     - Resolve governed event groups.
*     - Resolve event-specific archetype candidates.
*     - Publish Track-specific trait vocabulary.
*     - Identify evidence requirements.
*     - Identify missing evidence.
*     - Return explainable supporting sport intelligence.
*     - Fail closed when event authority cannot be established.
*
* This file DOES NOT:
*     - Calculate an official STATScore™.
*     - Calculate an Athletic domain score.
*     - Calculate a Production domain score.
*     - Calculate an Academic domain score.
*     - Calculate a Composite score.
*     - Generate official star ratings.
*     - Manufacture missing evidence.
*     - Substitute projected values for missing evidence.
*     - Default an unknown event to SPRINT.
*     - Modify performance because evidence is verified.
*     - Render HTML or manipulate the DOM.
*     - Auto-execute intelligence on page load.
*
* Governing Law:
*     Missing Authority ≠ Permission to Reconstruct Authority.
*
*     Missing evidence must remain missing.
*     Unsupported event authority must fail closed.
*     Verification changes confidence/trust, not measured performance.
*     Sport/event interpretation supports registered matrices;
*     it does not replace them.
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE = "statscore-track-position-matrix.js";
    const VERSION = "STATSCORE-TRACK-POSITION-MATRIX-V2";
    const SPORT = "TRACK";

    const STATUS = Object.freeze({
        READY: "READY",
        PARTIAL: "PARTIAL",
        INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
        UNSUPPORTED_EVENT: "UNSUPPORTED_EVENT",
        EVENT_REQUIRED: "EVENT_REQUIRED",
        INVALID_INPUT: "INVALID_INPUT"
    });

    /*
     * -------------------------------------------------------------------------
     * Event Groups
     * -------------------------------------------------------------------------
     *
     * These groups are interpretation authorities only.
     * They are NOT scoring matrices and contain no official score weights.
     */

    const EVENT_GROUPS = Object.freeze({

        SPRINT: Object.freeze({
            code: "SPRINT",
            label: "Sprints",
            traits: Object.freeze([
                "START",
                "ACCELERATION",
                "MAX_VELOCITY",
                "SPEED_ENDURANCE",
                "SPRINT_MECHANICS",
                "COMPETITION_EXECUTION"
            ]),
            archetypes: Object.freeze([
                "POWER_SPRINTER",
                "TECHNICAL_SPRINTER"
            ])
        }),

        DISTANCE: Object.freeze({
            code: "DISTANCE",
            label: "Distance / Endurance",
            traits: Object.freeze([
                "AEROBIC_CAPACITY",
                "PACE_CONTROL",
                "ENDURANCE",
                "RACE_STRATEGY",
                "FINISHING_STRENGTH",
                "COMPETITION_EXECUTION"
            ]),
            archetypes: Object.freeze([
                "ENDURANCE_RUNNER",
                "TACTICAL_RUNNER"
            ])
        }),

        RELAY: Object.freeze({
            code: "RELAY",
            label: "Relay",
            traits: Object.freeze([
                "SPLIT_PERFORMANCE",
                "EXCHANGE_EXECUTION",
                "ACCELERATION",
                "MAX_VELOCITY",
                "TEAM_EXECUTION",
                "COMPETITION_EXECUTION"
            ]),
            archetypes: Object.freeze([
                "RELAY_SPECIALIST"
            ])
        }),

        JUMPS: Object.freeze({
            code: "JUMPS",
            label: "Jumps",
            traits: Object.freeze([
                "APPROACH",
                "EXPLOSIVENESS",
                "TAKEOFF",
                "TECHNIQUE",
                "BODY_CONTROL",
                "COMPETITION_EXECUTION"
            ]),
            archetypes: Object.freeze([
                "EXPLOSIVE_JUMPER"
            ])
        }),

        THROWS: Object.freeze({
            code: "THROWS",
            label: "Throws",
            traits: Object.freeze([
                "POWER",
                "TECHNIQUE",
                "RELEASE_EXECUTION",
                "CONSISTENCY",
                "IMPLEMENT_CONTROL",
                "COMPETITION_EXECUTION"
            ]),
            archetypes: Object.freeze([
                "POWER_THROWER"
            ])
        })

    });

    /*
     * -------------------------------------------------------------------------
     * Event Registry
     * -------------------------------------------------------------------------
     *
     * Event aliases normalize into canonical event identities.
     *
     * IMPORTANT:
     * No UNKNOWN → SPRINT fallback exists.
     */

    const EVENT_REGISTRY = Object.freeze({

        "55M": Object.freeze({
            event_code: "55M",
            label: "55 Meter",
            event_group: "SPRINT"
        }),

        "60M": Object.freeze({
            event_code: "60M",
            label: "60 Meter",
            event_group: "SPRINT"
        }),

        "100M": Object.freeze({
            event_code: "100M",
            label: "100 Meter",
            event_group: "SPRINT"
        }),

        "200M": Object.freeze({
            event_code: "200M",
            label: "200 Meter",
            event_group: "SPRINT"
        }),

        "400M": Object.freeze({
            event_code: "400M",
            label: "400 Meter",
            event_group: "SPRINT"
        }),

        "800M": Object.freeze({
            event_code: "800M",
            label: "800 Meter",
            event_group: "DISTANCE"
        }),

        "1500M": Object.freeze({
            event_code: "1500M",
            label: "1500 Meter",
            event_group: "DISTANCE"
        }),

        "1600M": Object.freeze({
            event_code: "1600M",
            label: "1600 Meter",
            event_group: "DISTANCE"
        }),

        "MILE": Object.freeze({
            event_code: "MILE",
            label: "Mile",
            event_group: "DISTANCE"
        }),

        "3000M": Object.freeze({
            event_code: "3000M",
            label: "3000 Meter",
            event_group: "DISTANCE"
        }),

        "3200M": Object.freeze({
            event_code: "3200M",
            label: "3200 Meter",
            event_group: "DISTANCE"
        }),

        "5000M": Object.freeze({
            event_code: "5000M",
            label: "5000 Meter",
            event_group: "DISTANCE"
        }),

        "4X100": Object.freeze({
            event_code: "4X100",
            label: "4x100 Meter Relay",
            event_group: "RELAY"
        }),

        "4X200": Object.freeze({
            event_code: "4X200",
            label: "4x200 Meter Relay",
            event_group: "RELAY"
        }),

        "4X400": Object.freeze({
            event_code: "4X400",
            label: "4x400 Meter Relay",
            event_group: "RELAY"
        }),

        "4X800": Object.freeze({
            event_code: "4X800",
            label: "4x800 Meter Relay",
            event_group: "RELAY"
        }),

        "LONG_JUMP": Object.freeze({
            event_code: "LONG_JUMP",
            label: "Long Jump",
            event_group: "JUMPS"
        }),

        "TRIPLE_JUMP": Object.freeze({
            event_code: "TRIPLE_JUMP",
            label: "Triple Jump",
            event_group: "JUMPS"
        }),

        "HIGH_JUMP": Object.freeze({
            event_code: "HIGH_JUMP",
            label: "High Jump",
            event_group: "JUMPS"
        }),

        "POLE_VAULT": Object.freeze({
            event_code: "POLE_VAULT",
            label: "Pole Vault",
            event_group: "JUMPS"
        }),

        "SHOT_PUT": Object.freeze({
            event_code: "SHOT_PUT",
            label: "Shot Put",
            event_group: "THROWS"
        }),

        "DISCUS": Object.freeze({
            event_code: "DISCUS",
            label: "Discus",
            event_group: "THROWS"
        }),

        "JAVELIN": Object.freeze({
            event_code: "JAVELIN",
            label: "Javelin",
            event_group: "THROWS"
        }),

        "HAMMER": Object.freeze({
            event_code: "HAMMER",
            label: "Hammer Throw",
            event_group: "THROWS"
        })

    });

    /*
     * -------------------------------------------------------------------------
     * Alias Registry
     * -------------------------------------------------------------------------
     */

    const EVENT_ALIASES = Object.freeze({

        "55": "55M",
        "55_M": "55M",
        "55_METER": "55M",
        "55_METERS": "55M",

        "60": "60M",
        "60_M": "60M",
        "60_METER": "60M",
        "60_METERS": "60M",

        "100": "100M",
        "100_M": "100M",
        "100_METER": "100M",
        "100_METERS": "100M",

        "200": "200M",
        "200_M": "200M",
        "200_METER": "200M",
        "200_METERS": "200M",

        "400": "400M",
        "400_M": "400M",
        "400_METER": "400M",
        "400_METERS": "400M",

        "800": "800M",
        "800_M": "800M",
        "800_METER": "800M",
        "800_METERS": "800M",

        "1500": "1500M",
        "1500_M": "1500M",

        "1600": "1600M",
        "1600_M": "1600M",

        "1_MILE": "MILE",
        "ONE_MILE": "MILE",

        "3000": "3000M",
        "3000_M": "3000M",

        "3200": "3200M",
        "3200_M": "3200M",

        "5000": "5000M",
        "5000_M": "5000M",
        "5K": "5000M",

        "4X100M": "4X100",
        "4_X_100": "4X100",
        "4_X_100M": "4X100",

        "4X200M": "4X200",
        "4_X_200": "4X200",
        "4_X_200M": "4X200",

        "4X400M": "4X400",
        "4_X_400": "4X400",
        "4_X_400M": "4X400",

        "4X800M": "4X800",
        "4_X_800": "4X800",
        "4_X_800M": "4X800",

        "LJ": "LONG_JUMP",
        "LONGJUMP": "LONG_JUMP",

        "TJ": "TRIPLE_JUMP",
        "TRIPLEJUMP": "TRIPLE_JUMP",

        "HJ": "HIGH_JUMP",
        "HIGHJUMP": "HIGH_JUMP",

        "PV": "POLE_VAULT",
        "POLEVAULT": "POLE_VAULT",

        "SHOT": "SHOT_PUT",
        "SHOTPUT": "SHOT_PUT",

        "DISCUS_THROW": "DISCUS",

        "JAV": "JAVELIN",
        "JAVELIN_THROW": "JAVELIN",

        "HAMMER_THROW": "HAMMER"

    });

    /*
     * -------------------------------------------------------------------------
     * Archetype Registry
     * -------------------------------------------------------------------------
     *
     * Archetypes are interpretive labels.
     *
     * They DO NOT carry:
     *     - baseline scores
     *     - score bonuses
     *     - score penalties
     *     - official matrix weights
     */

    const ARCHETYPES = Object.freeze({

        POWER_SPRINTER: Object.freeze({
            code: "POWER_SPRINTER",
            event_group: "SPRINT",
            label: "Power Sprinter",
            description:
                "Sprint profile emphasizing acceleration, force application, and explosive race development.",
            supporting_traits: Object.freeze([
                "START",
                "ACCELERATION",
                "MAX_VELOCITY",
                "SPRINT_MECHANICS"
            ])
        }),

        TECHNICAL_SPRINTER: Object.freeze({
            code: "TECHNICAL_SPRINTER",
            event_group: "SPRINT",
            label: "Technical Sprinter",
            description:
                "Sprint profile emphasizing mechanical efficiency, speed maintenance, and technical execution.",
            supporting_traits: Object.freeze([
                "SPRINT_MECHANICS",
                "MAX_VELOCITY",
                "SPEED_ENDURANCE",
                "COMPETITION_EXECUTION"
            ])
        }),

        ENDURANCE_RUNNER: Object.freeze({
            code: "ENDURANCE_RUNNER",
            event_group: "DISTANCE",
            label: "Endurance Runner",
            description:
                "Distance profile emphasizing aerobic capacity, sustained pace, and endurance.",
            supporting_traits: Object.freeze([
                "AEROBIC_CAPACITY",
                "PACE_CONTROL",
                "ENDURANCE",
                "FINISHING_STRENGTH"
            ])
        }),

        TACTICAL_RUNNER: Object.freeze({
            code: "TACTICAL_RUNNER",
            event_group: "DISTANCE",
            label: "Tactical Runner",
            description:
                "Distance profile emphasizing race positioning, pace decisions, and competitive execution.",
            supporting_traits: Object.freeze([
                "PACE_CONTROL",
                "RACE_STRATEGY",
                "FINISHING_STRENGTH",
                "COMPETITION_EXECUTION"
            ])
        }),

        RELAY_SPECIALIST: Object.freeze({
            code: "RELAY_SPECIALIST",
            event_group: "RELAY",
            label: "Relay Specialist",
            description:
                "Relay profile emphasizing split performance, exchange execution, and team-context execution.",
            supporting_traits: Object.freeze([
                "SPLIT_PERFORMANCE",
                "EXCHANGE_EXECUTION",
                "TEAM_EXECUTION",
                "COMPETITION_EXECUTION"
            ])
        }),

        EXPLOSIVE_JUMPER: Object.freeze({
            code: "EXPLOSIVE_JUMPER",
            event_group: "JUMPS",
            label: "Explosive Jumper",
            description:
                "Jump profile emphasizing approach quality, explosive takeoff, technical execution, and body control.",
            supporting_traits: Object.freeze([
                "APPROACH",
                "EXPLOSIVENESS",
                "TAKEOFF",
                "TECHNIQUE",
                "BODY_CONTROL"
            ])
        }),

        POWER_THROWER: Object.freeze({
            code: "POWER_THROWER",
            event_group: "THROWS",
            label: "Power Thrower",
            description:
                "Throwing profile emphasizing power generation, implement control, release execution, and technical consistency.",
            supporting_traits: Object.freeze([
                "POWER",
                "TECHNIQUE",
                "RELEASE_EXECUTION",
                "IMPLEMENT_CONTROL",
                "CONSISTENCY"
            ])
        })

    });

    /*
     * -------------------------------------------------------------------------
     * Trait Evidence Doctrine
     * -------------------------------------------------------------------------
     *
     * These definitions describe acceptable evidence categories.
     *
     * No trait receives a numeric baseline simply because it exists in
     * this registry.
     */

    const TRAIT_EVIDENCE_REQUIREMENTS = Object.freeze({

        START: Object.freeze([
            "BLOCK_START_EVIDENCE",
            "RACE_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        ACCELERATION: Object.freeze([
            "SPLIT_DATA",
            "RACE_RESULT",
            "RACE_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        MAX_VELOCITY: Object.freeze([
            "VERIFIED_TIME",
            "SPLIT_DATA",
            "CERTIFIED_MEASUREMENT"
        ]),

        SPEED_ENDURANCE: Object.freeze([
            "VERIFIED_TIME",
            "SPLIT_DATA",
            "RACE_RESULT"
        ]),

        SPRINT_MECHANICS: Object.freeze([
            "RACE_FILM",
            "TRAINING_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        AEROBIC_CAPACITY: Object.freeze([
            "VERIFIED_TIME",
            "RACE_HISTORY",
            "CERTIFIED_EVALUATION"
        ]),

        PACE_CONTROL: Object.freeze([
            "SPLIT_DATA",
            "RACE_RESULT",
            "RACE_FILM"
        ]),

        ENDURANCE: Object.freeze([
            "VERIFIED_TIME",
            "RACE_HISTORY",
            "SPLIT_DATA"
        ]),

        RACE_STRATEGY: Object.freeze([
            "RACE_FILM",
            "RACE_RESULT",
            "CERTIFIED_EVALUATION"
        ]),

        FINISHING_STRENGTH: Object.freeze([
            "SPLIT_DATA",
            "RACE_FILM",
            "RACE_RESULT"
        ]),

        SPLIT_PERFORMANCE: Object.freeze([
            "VERIFIED_SPLIT",
            "OFFICIAL_RESULT",
            "RACE_FILM"
        ]),

        EXCHANGE_EXECUTION: Object.freeze([
            "RACE_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        TEAM_EXECUTION: Object.freeze([
            "RACE_FILM",
            "COACH_EVALUATION",
            "CERTIFIED_EVALUATION"
        ]),

        APPROACH: Object.freeze([
            "EVENT_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        EXPLOSIVENESS: Object.freeze([
            "VERIFIED_MARK",
            "EVENT_FILM",
            "CERTIFIED_MEASUREMENT"
        ]),

        TAKEOFF: Object.freeze([
            "EVENT_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        TECHNIQUE: Object.freeze([
            "EVENT_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        BODY_CONTROL: Object.freeze([
            "EVENT_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        POWER: Object.freeze([
            "VERIFIED_MARK",
            "EVENT_FILM",
            "CERTIFIED_MEASUREMENT"
        ]),

        RELEASE_EXECUTION: Object.freeze([
            "EVENT_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        CONSISTENCY: Object.freeze([
            "ATTEMPT_SERIES",
            "EVENT_HISTORY",
            "OFFICIAL_RESULTS"
        ]),

        IMPLEMENT_CONTROL: Object.freeze([
            "EVENT_FILM",
            "CERTIFIED_EVALUATION"
        ]),

        COMPETITION_EXECUTION: Object.freeze([
            "OFFICIAL_RESULT",
            "EVENT_FILM",
            "COMPETITION_HISTORY"
        ])

    });

    function normalizeToken(value) {
        return String(value || "")
            .trim()
            .toUpperCase()
            .replace(/&/g, "AND")
            .replace(/[^\w]+/g, "_")
            .replace(/^_+|_+$/g, "");
    }

    function normalizeEvent(value) {
        const token = normalizeToken(value);

        if (!token) {
            return null;
        }

        if (EVENT_REGISTRY[token]) {
            return token;
        }

        const alias = EVENT_ALIASES[token];

        if (alias && EVENT_REGISTRY[alias]) {
            return alias;
        }

        return null;
    }

    function getEventFromAthlete(athlete = {}) {
        return (
            athlete.primary_event ||
            athlete.event ||
            athlete.track_event ||
            athlete.position ||
            athlete.raw_payload?.primaryEvent ||
            athlete.raw_payload?.primary_event ||
            athlete.raw_payload?.event ||
            athlete.raw_payload?.trackEvent ||
            athlete.raw_payload?.track_event ||
            null
        );
    }

    function resolveEvent(value) {
        const eventCode = normalizeEvent(value);

        if (!eventCode) {
            return null;
        }

        return EVENT_REGISTRY[eventCode] || null;
    }

    function resolveEventGroup(value) {
        const event = resolveEvent(value);

        if (!event) {
            return null;
        }

        return EVENT_GROUPS[event.event_group] || null;
    }

    function getEventGroupByCode(groupCode) {
        const code = normalizeToken(groupCode);

        return EVENT_GROUPS[code] || null;
    }

    function getArchetype(archetypeCode) {
        const code = normalizeToken(archetypeCode);

        return ARCHETYPES[code] || null;
    }

    function getArchetypesForEvent(value) {
        const group = resolveEventGroup(value);

        if (!group) {
            return [];
        }

        return group.archetypes
            .map(code => ARCHETYPES[code])
            .filter(Boolean);
    }

    function getTraitsForEvent(value) {
        const group = resolveEventGroup(value);

        if (!group) {
            return [];
        }

        return Array.from(group.traits);
    }

    function getTraitEvidenceRequirements(trait) {
        const key = normalizeToken(trait);

        return Array.from(
            TRAIT_EVIDENCE_REQUIREMENTS[key] || []
        );
    }

    /*
     * -------------------------------------------------------------------------
     * Evidence Extraction
     * -------------------------------------------------------------------------
     *
     * This authority identifies supplied evidence.
     * It does not certify provenance.
     *
     * Verification authority remains external.
     */

    function collectEvidence(athlete = {}) {
        const evidence = [];

        function add(type, value, source) {
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return;
            }

            evidence.push({
                evidence_type: type,
                value,
                source,
                verification_status: "CONSUME_EXTERNAL_VERIFICATION"
            });
        }

        add(
            "OFFICIAL_RESULT",
            athlete.official_result ||
                athlete.raw_payload?.officialResult ||
                athlete.raw_payload?.official_result,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "VERIFIED_TIME",
            athlete.verified_time ||
                athlete.event_time ||
                athlete.raw_payload?.verifiedTime ||
                athlete.raw_payload?.verified_time ||
                athlete.raw_payload?.eventTime ||
                athlete.raw_payload?.event_time,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "VERIFIED_MARK",
            athlete.verified_mark ||
                athlete.event_mark ||
                athlete.raw_payload?.verifiedMark ||
                athlete.raw_payload?.verified_mark ||
                athlete.raw_payload?.eventMark ||
                athlete.raw_payload?.event_mark,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "SPLIT_DATA",
            athlete.split_data ||
                athlete.splits ||
                athlete.raw_payload?.splitData ||
                athlete.raw_payload?.split_data ||
                athlete.raw_payload?.splits,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "EVENT_FILM",
            athlete.event_film_url ||
                athlete.game_film_url ||
                athlete.highlight_url ||
                athlete.raw_payload?.eventFilmUrl ||
                athlete.raw_payload?.event_film_url ||
                athlete.raw_payload?.gameFilmUrl ||
                athlete.raw_payload?.highlightUrl,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "RACE_FILM",
            athlete.race_film_url ||
                athlete.raw_payload?.raceFilmUrl ||
                athlete.raw_payload?.race_film_url,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "EVENT_HISTORY",
            athlete.event_history ||
                athlete.competition_history ||
                athlete.raw_payload?.eventHistory ||
                athlete.raw_payload?.event_history ||
                athlete.raw_payload?.competitionHistory ||
                athlete.raw_payload?.competition_history,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "ATTEMPT_SERIES",
            athlete.attempt_series ||
                athlete.raw_payload?.attemptSeries ||
                athlete.raw_payload?.attempt_series,
            "ATHLETE_SNAPSHOT"
        );

        add(
            "CERTIFIED_EVALUATION",
            athlete.certified_evaluation ||
                athlete.evaluator_report ||
                athlete.raw_payload?.certifiedEvaluation ||
                athlete.raw_payload?.evaluatorReport,
            "EXTERNAL_AUTHORITY"
        );

        return evidence;
    }

    function evidenceTypeSet(evidence = []) {
        return new Set(
            evidence.map(item => normalizeToken(item.evidence_type))
        );
    }

    function buildTraitModel(trait, evidence = []) {
        const requirements = getTraitEvidenceRequirements(trait);
        const availableTypes = evidenceTypeSet(evidence);

        const matchedEvidence = evidence.filter(item =>
            requirements.includes(
                normalizeToken(item.evidence_type)
            )
        );

        const missingEvidence = requirements.filter(
            requirement => !availableTypes.has(requirement)
        );

        /*
         * IMPORTANT:
         *
         * This position authority does not manufacture a numeric trait value.
         * Numeric interpretation must be supplied by an authorized downstream
         * benchmark/trait interpreter operating under registered doctrine.
         */

        return {
            trait_key: trait,

            value: null,

            confidence: 0,

            status:
                matchedEvidence.length > 0
                    ? "EVIDENCE_PRESENT_INTERPRETATION_REQUIRED"
                    : STATUS.INSUFFICIENT_EVIDENCE,

            official: false,

            evidence_used: matchedEvidence,

            evidence_requirements: requirements,

            missing_evidence: missingEvidence,

            verification_status:
                matchedEvidence.length > 0
                    ? "CONSUME_EXTERNAL_VERIFICATION"
                    : "NOT_APPLICABLE",

            explanation:
                matchedEvidence.length > 0
                    ? "Relevant Track evidence exists. Authorized benchmark interpretation is required before a numeric trait value may be produced."
                    : "No qualifying evidence is available for this Track trait. No baseline or projected value has been manufactured."
        };
    }

    function buildTraitMap(group, evidence) {
        if (!group) {
            return {};
        }

        return group.traits.reduce((result, trait) => {
            result[trait] = buildTraitModel(trait, evidence);
            return result;
        }, {});
    }

    function collectMissingEvidence(traits = {}) {
        const missing = new Set();

        Object.values(traits).forEach(trait => {
            (trait.missing_evidence || []).forEach(item => {
                missing.add(item);
            });
        });

        return Array.from(missing);
    }

    function determineStatus(traits = {}) {
        const values = Object.values(traits);

        if (!values.length) {
            return STATUS.INSUFFICIENT_EVIDENCE;
        }

        const withEvidence = values.filter(
            trait =>
                Array.isArray(trait.evidence_used) &&
                trait.evidence_used.length > 0
        ).length;

        if (withEvidence === 0) {
            return STATUS.INSUFFICIENT_EVIDENCE;
        }

        if (withEvidence < values.length) {
            return STATUS.PARTIAL;
        }

        return STATUS.READY;
    }

    function buildFlags(event, group, traits) {
        const flags = [];

        if (!event) {
            flags.push("Track event authority could not be established.");
        }

        if (!group) {
            flags.push("Track event group could not be established.");
        }

        const insufficientTraits = Object.values(traits || {})
            .filter(
                trait =>
                    trait.status === STATUS.INSUFFICIENT_EVIDENCE
            )
            .map(trait => trait.trait_key);

        if (insufficientTraits.length) {
            flags.push(
                `Insufficient evidence for traits: ${insufficientTraits.join(", ")}.`
            );
        }

        return flags;
    }

    function buildInvalidResult(athlete, status, message) {
        return {
            ok: false,

            engine: ENGINE,
            version: VERSION,

            authority_class:
                "SUPPORTING_TRACK_EVENT_POSITION_INTELLIGENCE",

            sport: SPORT,

            athlete_id:
                athlete?.athlete_id ||
                null,

            snapshot_id:
                athlete?.snapshot_id ||
                null,

            event: null,
            event_group: null,

            archetypes: [],
            traits: {},

            evidence_used: [],
            missing_evidence: [],

            flags: [message],

            official: false,

            status,

            explanation: {
                summary: message,

                scoring_rule:
                    "No official score may be created by this authority.",

                failure_rule:
                    "Missing or unsupported Track event authority fails closed.",

                downstream_rule:
                    "Track sport intelligence must feed registered Stream 9 domain matrices."
            },

            generated_at: new Date().toISOString()
        };
    }

    /*
     * -------------------------------------------------------------------------
     * Primary Authority Method
     * -------------------------------------------------------------------------
     */

    function interpretAthlete(athlete = {}) {
        if (
            !athlete ||
            typeof athlete !== "object" ||
            Array.isArray(athlete)
        ) {
            return buildInvalidResult(
                {},
                STATUS.INVALID_INPUT,
                "A valid athlete snapshot object is required."
            );
        }

        const rawEvent = getEventFromAthlete(athlete);

        if (!rawEvent) {
            return buildInvalidResult(
                athlete,
                STATUS.EVENT_REQUIRED,
                "Track event is required. No event-group authority has been assumed."
            );
        }

        const event = resolveEvent(rawEvent);

        if (!event) {
            return buildInvalidResult(
                athlete,
                STATUS.UNSUPPORTED_EVENT,
                `Unsupported or unregistered Track event: ${String(rawEvent)}.`
            );
        }

        const group = getEventGroupByCode(
            event.event_group
        );

        if (!group) {
            return buildInvalidResult(
                athlete,
                STATUS.UNSUPPORTED_EVENT,
                `No governed Track event-group authority exists for ${event.event_code}.`
            );
        }

        const evidence = collectEvidence(athlete);
        const traits = buildTraitMap(group, evidence);
        const missingEvidence = collectMissingEvidence(traits);
        const status = determineStatus(traits);

        const archetypes = group.archetypes
            .map(code => ARCHETYPES[code])
            .filter(Boolean)
            .map(archetype => ({
                code: archetype.code,
                label: archetype.label,
                description: archetype.description,

                /*
                 * No archetype is automatically assigned.
                 * Evidence-based archetype classification belongs to an
                 * authorized interpreter.
                 */
                selected: false,
                confidence: 0,
                status: "CANDIDATE_ONLY",
                official: false
            }));

        return {
            ok:
                status === STATUS.READY ||
                status === STATUS.PARTIAL,

            engine: ENGINE,
            version: VERSION,

            authority_class:
                "SUPPORTING_TRACK_EVENT_POSITION_INTELLIGENCE",

            sport: SPORT,

            athlete_id:
                athlete.athlete_id ||
                null,

            snapshot_id:
                athlete.snapshot_id ||
                null,

            event: {
                code: event.event_code,
                label: event.label
            },

            event_group: {
                code: group.code,
                label: group.label
            },

            archetypes,

            traits,

            evidence_used: evidence,

            missing_evidence: missingEvidence,

            flags: buildFlags(
                event,
                group,
                traits
            ),

            official: false,

            status,

            explanation: {
                summary:
                    `${event.label} was resolved to the governed ${group.label} Track event authority.`,

                event_authority:
                    `${event.event_code} → ${group.code}`,

                trait_authority:
                    Array.from(group.traits),

                archetype_candidates:
                    Array.from(group.archetypes),

                evidence_rule:
                    "Only supplied athlete evidence is exposed. Missing evidence remains missing.",

                projection_rule:
                    "No projected numeric trait values are generated by this authority.",

                verification_rule:
                    "Verification standing must be consumed from the governed verification authority. Verification does not alter the underlying measured performance.",

                scoring_rule:
                    "This authority does not publish final_score, STATScore™, Athletic domain score, Production domain score, Academic domain score, or Composite score.",

                downstream_rule:
                    "Track event/trait intelligence must be consumed by registered Stream 9 matrices before any official domain score may exist."
            },

            generated_at:
                new Date().toISOString()
        };
    }

    /*
     * -------------------------------------------------------------------------
     * Registry Inspection
     * -------------------------------------------------------------------------
     */

    function getRegisteredEvents() {
        return Object.values(EVENT_REGISTRY).map(event => ({
            ...event
        }));
    }

    function getRegisteredEventGroups() {
        return Object.values(EVENT_GROUPS).map(group => ({
            code: group.code,
            label: group.label,
            traits: Array.from(group.traits),
            archetypes: Array.from(group.archetypes)
        }));
    }

    function getRegisteredArchetypes() {
        return Object.values(ARCHETYPES).map(archetype => ({
            code: archetype.code,
            event_group: archetype.event_group,
            label: archetype.label,
            description: archetype.description,
            supporting_traits:
                Array.from(archetype.supporting_traits)
        }));
    }

    /*
     * -------------------------------------------------------------------------
     * Public Authority
     * -------------------------------------------------------------------------
     *
     * No DOM hooks.
     * No DOMContentLoaded execution.
     * No automatic athlete scoring.
     */

    const TrackPositionMatrix = Object.freeze({

        engine: ENGINE,
        version: VERSION,

        stream:
            "STREAM_9",

        owner:
            "Stream 9 — Enterprise Intelligence Authority",

        classification:
            "SUPPORTING_TRACK_EVENT_POSITION_INTELLIGENCE_AUTHORITY",

        status:
            "ACTIVE",

        official_score_publisher:
            false,

        calculates_official_score:
            false,

        calculates_composite:
            false,

        modifies_verified_performance:
            false,

        permits_fabricated_baselines:
            false,

        permits_unknown_event_fallback:
            false,

        EVENT_GROUPS,
        EVENT_REGISTRY,
        EVENT_ALIASES,
        ARCHETYPES,
        TRAIT_EVIDENCE_REQUIREMENTS,

        normalizeEvent,
        resolveEvent,
        resolveEventGroup,

        getEventGroupByCode,
        getArchetype,
        getArchetypesForEvent,
        getTraitsForEvent,
        getTraitEvidenceRequirements,

        collectEvidence,

        interpretAthlete,

        /*
         * Compatibility alias.
         *
         * Historical consumers may expect an evaluate-style method.
         * It returns supporting intelligence only.
         */
        evaluate:
            interpretAthlete,

        getRegisteredEvents,
        getRegisteredEventGroups,
        getRegisteredArchetypes

    });

    global.STATScoreTrackPositionMatrix =
        TrackPositionMatrix;

    global.STATScore = global.STATScore || {};

    global.STATScore.TrackPositionMatrix =
        TrackPositionMatrix;

    console.info(
        "[STATS-CORE] Track Event / Position Matrix Authority loaded:",
        VERSION
    );

})(window); 
