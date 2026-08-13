/*!
* =============================================================================
* STATS-CORE™
* Stream 9 — Enterprise Intelligence Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-synthesis-engine.js
*
* Classification:
*     SUPPORTING ENTERPRISE INTELLIGENCE FUSION AUTHORITY
*
* Owner:
*     Stream 9 — Enterprise Intelligence Authority
*
* Version:
*     STATSCORE-SYNTHESIS-ENGINE-V2
*
* Contract Version:
*     STATSCORE-SYNTHESIS-CONTRACT-V1
*
* Status:
*     RECONSTRUCTED — NON-SCORING INTELLIGENCE FUSION AUTHORITY
*
* Purpose:
*     Fuse already-governed Stream 9 domain intelligence into a unified
*     operational intelligence state for downstream consumers.
*
* Constitutional Chain:
*
*     Governed Domain Authorities
*              ↓
*     Score Authority / Governed Domain Package
*              ↓
*     Synthesis Engine
*              ↓
*     Unified Operational Intelligence State
*              ↓
*     Recommendations / Blockers / Visibility Posture / Next Actions
*
* This file DOES:
*     - preserve athlete_id and snapshot_id independently;
*     - consume governed domain intelligence;
*     - consume governed confidence if supplied;
*     - summarize readiness, eligibility, pathway, visibility, and media state;
*     - identify blockers;
*     - identify recommended actions;
*     - preserve source attribution;
*     - expose diagnostics and health checks.
*
* This file DOES NOT:
*     - calculate Athletic Score;
*     - calculate Production Score;
*     - calculate Academic Score;
*     - calculate Competition Score;
*     - calculate Verification Score;
*     - calculate Composite Score;
*     - manufacture confidence;
*     - add role-based confidence bonuses;
*     - infer professional authority from role labels;
*     - collapse athlete_id into snapshot_id;
*     - render DOM;
*     - modify consumer pages;
*     - create official athlete rankings;
*     - create official recruiting decisions;
*     - replace missing authority.
*
* Governing Rule:
*
*     Synthesis combines governed intelligence.
*     It does not create missing intelligence or establish scoring authority.
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-synthesis-engine";

    const VERSION =
        "STATSCORE-SYNTHESIS-ENGINE-V2";

    const CONTRACT_VERSION =
        "STATSCORE-SYNTHESIS-CONTRACT-V1";

    const STREAM_OWNER =
        "STATSCORE_STREAM_9";

    const STATUS = Object.freeze({
        READY:
            "READY",

        PARTIAL:
            "PARTIAL",

        INSUFFICIENT_INPUT:
            "INSUFFICIENT_INPUT",

        AUTHORITY_UNAVAILABLE:
            "AUTHORITY_UNAVAILABLE",

        SOURCE_CONFLICT:
            "SOURCE_CONFLICT",

        BLOCKED:
            "BLOCKED",

        ERROR:
            "ERROR"
    });

    const CONFIDENCE_LEVELS = Object.freeze({
        HIGH:
            "HIGH",

        MODERATE:
            "MODERATE",

        LOW:
            "LOW",

        BLOCKED:
            "BLOCKED",

        UNKNOWN:
            "UNKNOWN"
    });

    const VISIBILITY_STATES = Object.freeze({
        CONTROLLED_HIGH_CONFIDENCE:
            "CONTROLLED_HIGH_CONFIDENCE",

        CONTROLLED_REVIEW:
            "CONTROLLED_REVIEW",

        RESTRICTED_PENDING_EVIDENCE:
            "RESTRICTED_PENDING_EVIDENCE",

        BLOCKED:
            "BLOCKED",

        UNKNOWN:
            "UNKNOWN"
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
            .replace(/-/g, "_");
    }

    function safeArray(value) {
        return Array.isArray(value)
            ? value
            : [];
    }

    function safeObject(value) {
        return (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        )
            ? value
            : {};
    }

    function numberOrNull(value) {
        if (
            value === undefined ||
            value === null ||
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

    function normalizeInput(input) {
        if (
            !input ||
            typeof input !== "object" ||
            Array.isArray(input)
        ) {
            return {};
        }

        return input;
    }

    function validateStream9Authority() {
        return Boolean(
            global.STATScoreStream9Authority &&
            global.STATScoreStream9Authority.stream_number === 9 &&
            global.STATScoreStream9Authority.operational_state === "ACTIVE"
        );
    }

    function createBaseState(
        athleteId,
        snapshotId
    ) {
        return {
            athlete_id:
                athleteId || null,

            snapshot_id:
                snapshotId || null,

            synthesis_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            generated_at:
                nowISO(),

            states: {
                profile:
                    "UNKNOWN",

                verification:
                    "UNKNOWN",

                readiness:
                    "UNKNOWN",

                eligibility:
                    "UNKNOWN",

                pathway:
                    "UNKNOWN",

                visibility:
                    VISIBILITY_STATES.UNKNOWN,

                media:
                    "UNKNOWN"
            },

            source_domains:
                [],

            source_authorities:
                [],

            blocking_items:
                [],

            recommended_actions:
                [],

            flags:
                [],

            intelligence_notes:
                [],

            confidence_context: {
                value:
                    null,

                level:
                    CONFIDENCE_LEVELS.UNKNOWN,

                source:
                    null,

                status:
                    "NOT_SUPPLIED"
            },

            operational_completion: {
                percent:
                    null,

                complete_domains:
                    [],

                missing_domains:
                    []
            },

            status:
                STATUS.INSUFFICIENT_INPUT
        };
    }

    function getDomain(
        domains,
        key
    ) {
        return safeObject(
            domains?.[
                key
            ]
        );
    }

    function normalizeDomainStatus(
        domain
    ) {
        return upper(
            domain?.status ||
            "UNKNOWN"
        );
    }

    function normalizeDomainScore(
        domain
    ) {
        return numberOrNull(
            domain?.score
        );
    }

    function collectDomainSources(
        domains
    ) {
        const sourceDomains =
            [];

        const sourceAuthorities =
            [];

        Object.entries(
            safeObject(domains)
        ).forEach(
            function (
                [key, domain]
            ) {
                if (
                    domain &&
                    typeof domain ===
                        "object"
                ) {
                    sourceDomains.push(
                        key
                    );

                    if (
                        domain.authority
                    ) {
                        sourceAuthorities.push(
                            domain.authority
                        );
                    }
                }
            }
        );

        return {
            source_domains:
                Array.from(
                    new Set(
                        sourceDomains
                    )
                ),

            source_authorities:
                Array.from(
                    new Set(
                        sourceAuthorities
                            .filter(Boolean)
                    )
                )
        };
    }

    function calculateOperationalCompletion(
        domains
    ) {
        const keys =
            [
                "athletic",
                "production",
                "academic",
                "competition",
                "verification",
                "evaluation",
                "training",
                "exposure",
                "readiness",
                "pathway",
                "crystal"
            ];

        const complete =
            [];

        const missing =
            [];

        keys.forEach(
            function (
                key
            ) {
                const domain =
                    domains?.[
                        key
                    ];

                if (
                    domain &&
                    typeof domain ===
                        "object" &&
                    upper(
                        domain.status
                    ) !==
                        "DOMAIN_UNAVAILABLE" &&
                    upper(
                        domain.status
                    ) !==
                        "MATRIX_UNAVAILABLE" &&
                    upper(
                        domain.status
                    ) !==
                        "AUTHORITY_UNAVAILABLE"
                ) {
                    complete.push(
                        key
                    );
                } else {
                    missing.push(
                        key
                    );
                }
            }
        );

        return {
            percent:
                Math.round(
                    (
                        complete.length /
                        keys.length
                    ) *
                    100
                ),

            complete_domains:
                complete,

            missing_domains:
                missing
        };
    }

    function resolveGovernedConfidence(
        input
    ) {
        const explicit =
            safeObject(
                input.confidence
            );

        const verification =
            getDomain(
                input.domains,
                "verification"
            );

        const explicitValue =
            numberOrNull(
                explicit.value ??
                explicit.score ??
                explicit.confidence
            );

        const verificationConfidence =
            numberOrNull(
                verification
                    ?.confidence
            );

        const value =
            explicitValue ??
            verificationConfidence ??
            null;

        let level =
            upper(
                explicit.level ||
                explicit.status ||
                ""
            );

        if (
            ![
                "HIGH",
                "MODERATE",
                "LOW",
                "BLOCKED"
            ].includes(
                level
            )
        ) {
            if (
                value === null
            ) {
                level =
                    CONFIDENCE_LEVELS.UNKNOWN;
            } else if (
                value >= 80
            ) {
                level =
                    CONFIDENCE_LEVELS.HIGH;
            } else if (
                value >= 55
            ) {
                level =
                    CONFIDENCE_LEVELS.MODERATE;
            } else {
                level =
                    CONFIDENCE_LEVELS.LOW;
            }
        }

        return {
            value,

            level,

            source:
                explicitValue !== null
                    ? (
                        explicit.authority ||
                        explicit.source ||
                        "GOVERNED_CONFIDENCE_INPUT"
                    )
                    : verificationConfidence !== null
                        ? (
                            verification.authority ||
                            "VERIFICATION_DOMAIN_CONFIDENCE"
                        )
                        : null,

            status:
                value === null
                    ? "NOT_AVAILABLE"
                    : "CONSUMED",

            official:
                explicit.official ===
                    true ||
                verification.official ===
                    true
        };
    }

    function resolveProfileState(
        input
    ) {
        const profile =
            upper(
                input.profile_state ||
                input.profile?.status ||
                ""
            );

        if (
            profile.includes("ACTIVE") ||
            profile.includes("CREATED")
        ) {
            return "PROFILE_ACTIVE";
        }

        if (
            profile.includes("BLOCK")
        ) {
            return "PROFILE_BLOCKED";
        }

        return profile ||
            "UNKNOWN";
    }

    function resolveVerificationState(
        domains
    ) {
        const verification =
            getDomain(
                domains,
                "verification"
            );

        const status =
            normalizeDomainStatus(
                verification
            );

        if (
            status === "SCORED" &&
            verification.official === true
        ) {
            return "VERIFICATION_GOVERNED";
        }

        if (
            status === "PENDING_VERIFICATION"
        ) {
            return "PENDING_VERIFICATION";
        }

        if (
            status === "INSUFFICIENT_EVIDENCE"
        ) {
            return "VERIFICATION_INSUFFICIENT";
        }

        if (
            status === "SOURCE_EVIDENCE_CONFLICT"
        ) {
            return "VERIFICATION_CONFLICT";
        }

        return status;
    }

    function resolveReadinessState(
        domains
    ) {
        const readiness =
            getDomain(
                domains,
                "readiness"
            );

        return (
            readiness
                ?.state ||
            readiness
                ?.readiness_state ||
            readiness
                ?.status ||
            "UNKNOWN"
        );
    }

    function resolveEligibilityState(
        input,
        domains
    ) {
        const academic =
            getDomain(
                domains,
                "academic"
            );

        const eligibility =
            input.eligibility ||
            input.eligibility_state ||
            academic
                ?.eligibility ||
            academic
                ?.eligibility_status ||
            academic
                ?.explanation
                ?.eligibility_status ||
            null;

        if (
            typeof eligibility ===
                "object"
        ) {
            return upper(
                eligibility.status ||
                eligibility.label ||
                "UNKNOWN"
            );
        }

        return upper(
            eligibility ||
            "UNKNOWN"
        );
    }

    function resolvePathwayState(
        domains
    ) {
        const pathway =
            getDomain(
                domains,
                "pathway"
            );

        return upper(
            pathway
                ?.state ||
            pathway
                ?.pathway_state ||
            pathway
                ?.status ||
            "UNKNOWN"
        );
    }

    function resolveMediaState(
        input
    ) {
        return upper(
            input.media_state ||
            input.media?.status ||
            "UNKNOWN"
        );
    }

    function resolveVisibilityState(
        confidence,
        blockers
    ) {
        if (
            blockers.some(
                function (
                    item
                ) {
                    return upper(
                        item.severity
                    ) ===
                    "BLOCKING";
                }
            )
        ) {
            return VISIBILITY_STATES.BLOCKED;
        }

        switch (
            confidence.level
        ) {
            case CONFIDENCE_LEVELS.HIGH:
                return VISIBILITY_STATES
                    .CONTROLLED_HIGH_CONFIDENCE;

            case CONFIDENCE_LEVELS.MODERATE:
                return VISIBILITY_STATES
                    .CONTROLLED_REVIEW;

            case CONFIDENCE_LEVELS.LOW:
            case CONFIDENCE_LEVELS.UNKNOWN:
                return VISIBILITY_STATES
                    .RESTRICTED_PENDING_EVIDENCE;

            case CONFIDENCE_LEVELS.BLOCKED:
                return VISIBILITY_STATES.BLOCKED;

            default:
                return VISIBILITY_STATES.UNKNOWN;
        }
    }

    function addBlocker(
        blockers,
        code,
        message,
        source,
        severity
    ) {
        blockers.push({
            code,

            message,

            source:
                source || null,

            severity:
                severity ||
                "REVIEW"
        });
    }

    function addAction(
        actions,
        code,
        message,
        source
    ) {
        actions.push({
            code,

            message,

            source:
                source || null
        });
    }

    function collectBlockers(
        input,
        domains
    ) {
        const blockers =
            [];

        const academic =
            getDomain(
                domains,
                "academic"
            );

        const verification =
            getDomain(
                domains,
                "verification"
            );

        const competition =
            getDomain(
                domains,
                "competition"
            );

        const pathway =
            getDomain(
                domains,
                "pathway"
            );

        if (
            [
                "INSUFFICIENT_EVIDENCE",
                "MATRIX_UNAVAILABLE",
                "MATRIX_UNAUTHORIZED",
                "MATRIX_CONTRACT_INVALID"
            ].includes(
                normalizeDomainStatus(
                    verification
                )
            )
        ) {
            addBlocker(
                blockers,
                "VERIFICATION_NOT_READY",
                "Verification intelligence is not currently sufficient for full release confidence.",
                "verification",
                "REVIEW"
            );
        }

        if (
            normalizeDomainStatus(
                verification
            ) ===
            "SOURCE_EVIDENCE_CONFLICT"
        ) {
            addBlocker(
                blockers,
                "VERIFICATION_CONFLICT",
                "Conflicting evidence requires review before unrestricted reliance.",
                "verification",
                "BLOCKING"
            );
        }

        if (
            normalizeDomainStatus(
                competition
            ) ===
            "INSUFFICIENT_EVIDENCE"
        ) {
            addBlocker(
                blockers,
                "COMPETITION_CONTEXT_MISSING",
                "Competition context is incomplete.",
                "competition",
                "REVIEW"
            );
        }

        if (
            normalizeDomainStatus(
                academic
            ) ===
            "INSUFFICIENT_EVIDENCE"
        ) {
            addBlocker(
                blockers,
                "ACADEMIC_EVIDENCE_MISSING",
                "Academic intelligence is incomplete.",
                "academic",
                "REVIEW"
            );
        }

        const academicFlags =
            safeArray(
                academic.flags
            );

        if (
            academicFlags.some(
                function (
                    flag
                ) {
                    return upper(
                        flag
                    ).includes(
                        "ELIGIBILITY"
                    );
                }
            )
        ) {
            addBlocker(
                blockers,
                "ACADEMIC_ELIGIBILITY_REVIEW",
                "Academic or eligibility intelligence requires review.",
                "academic",
                "REVIEW"
            );
        }

        if (
            [
                "BLOCKED",
                "COMPOSITE_BLOCKED"
            ].includes(
                upper(
                    pathway
                        ?.status
                )
            )
        ) {
            addBlocker(
                blockers,
                "PATHWAY_BLOCKED",
                "Pathway authority reports a blocked state.",
                "pathway",
                "BLOCKING"
            );
        }

        safeArray(
            input.blocking_items
        ).forEach(
            function (
                item
            ) {
                if (
                    typeof item ===
                        "string"
                ) {
                    addBlocker(
                        blockers,
                        "UPSTREAM_BLOCKER",
                        item,
                        "upstream",
                        "REVIEW"
                    );
                } else if (
                    item &&
                    typeof item ===
                        "object"
                ) {
                    blockers.push(
                        item
                    );
                }
            }
        );

        return blockers;
    }

    function collectRecommendedActions(
        input,
        domains,
        blockers
    ) {
        const actions =
            [];

        blockers.forEach(
            function (
                blocker
            ) {
                switch (
                    blocker.code
                ) {
                    case "VERIFICATION_NOT_READY":
                        addAction(
                            actions,
                            "COMPLETE_VERIFICATION",
                            "Complete governed evidence verification and provenance review.",
                            "verification"
                        );
                        break;

                    case "VERIFICATION_CONFLICT":
                        addAction(
                            actions,
                            "RESOLVE_EVIDENCE_CONFLICT",
                            "Resolve conflicting evidence before expanding reliance or publication.",
                            "verification"
                        );
                        break;

                    case "COMPETITION_CONTEXT_MISSING":
                        addAction(
                            actions,
                            "COMPLETE_COMPETITION_CONTEXT",
                            "Supply current competition level, opponent quality, and schedule context.",
                            "competition"
                        );
                        break;

                    case "ACADEMIC_EVIDENCE_MISSING":
                    case "ACADEMIC_ELIGIBILITY_REVIEW":
                        addAction(
                            actions,
                            "COMPLETE_ACADEMIC_REVIEW",
                            "Complete academic evidence and eligibility review.",
                            "academic"
                        );
                        break;

                    case "PATHWAY_BLOCKED":
                        addAction(
                            actions,
                            "REVIEW_PATHWAY_BLOCK",
                            "Review the governed Pathway Intelligence blockers before route escalation.",
                            "pathway"
                        );
                        break;

                    default:
                        break;
                }
            }
        );

        Object.entries(
            safeObject(
                domains
            )
        ).forEach(
            function (
                [key, domain]
            ) {
                safeArray(
                    domain
                        ?.recommended_actions
                ).forEach(
                    function (
                        action
                    ) {
                        if (
                            typeof action ===
                                "string"
                        ) {
                            addAction(
                                actions,
                                `${upper(key)}_ACTION`,
                                action,
                                key
                            );
                        } else if (
                            action &&
                            typeof action ===
                                "object"
                        ) {
                            actions.push(
                                action
                            );
                        }
                    }
                );
            }
        );

        safeArray(
            input.recommended_actions
        ).forEach(
            function (
                item
            ) {
                if (
                    typeof item ===
                        "string"
                ) {
                    addAction(
                        actions,
                        "UPSTREAM_ACTION",
                        item,
                        "upstream"
                    );
                } else if (
                    item &&
                    typeof item ===
                        "object"
                ) {
                    actions.push(
                        item
                    );
                }
            }
        );

        const seen =
            new Set();

        return actions.filter(
            function (
                item
            ) {
                const key =
                    JSON.stringify([
                        item.code,
                        item.message,
                        item.source
                    ]);

                if (
                    seen.has(
                        key
                    )
                ) {
                    return false;
                }

                seen.add(
                    key
                );

                return true;
            }
        );
    }

    function collectFlags(
        domains,
        blockers
    ) {
        const flags =
            [];

        Object.values(
            safeObject(
                domains
            )
        ).forEach(
            function (
                domain
            ) {
                safeArray(
                    domain
                        ?.flags
                ).forEach(
                    function (
                        flag
                    ) {
                        flags.push(
                            flag
                        );
                    }
                );
            }
        );

        blockers.forEach(
            function (
                blocker
            ) {
                flags.push(
                    blocker.code
                );
            }
        );

        return Array.from(
            new Set(
                flags.filter(Boolean)
            )
        );
    }

    function determineStatus(
        state
    ) {
        if (
            !state.athlete_id ||
            !state.snapshot_id
        ) {
            return STATUS
                .INSUFFICIENT_INPUT;
        }

        if (
            state.blocking_items.some(
                function (
                    item
                ) {
                    return upper(
                        item.severity
                    ) ===
                    "BLOCKING";
                }
            )
        ) {
            return STATUS.BLOCKED;
        }

        if (
            state.operational_completion
                .percent === 100
        ) {
            return STATUS.READY;
        }

        return STATUS.PARTIAL;
    }

    function synthesize(
        input = {}
    ) {
        lastError =
            null;

        try {
            const normalized =
                normalizeInput(
                    input
                );

            const athleteId =
                normalized
                    .athlete_id ||
                normalized
                    .snapshot
                    ?.athlete_id ||
                null;

            const snapshotId =
                normalized
                    .snapshot_id ||
                normalized
                    .snapshot
                    ?.snapshot_id ||
                null;

            const state =
                createBaseState(
                    athleteId,
                    snapshotId
                );

            if (
                !validateStream9Authority()
            ) {
                state.flags.push(
                    "STREAM_9_AUTHORITY_UNAVAILABLE"
                );

                state.status =
                    STATUS
                        .AUTHORITY_UNAVAILABLE;

                lastResult =
                    state;

                return state;
            }

            if (
                !athleteId ||
                !snapshotId
            ) {
                if (
                    !athleteId
                ) {
                    state.flags.push(
                        "ATHLETE_ID_REQUIRED"
                    );
                }

                if (
                    !snapshotId
                ) {
                    state.flags.push(
                        "SNAPSHOT_ID_REQUIRED"
                    );
                }

                state.status =
                    STATUS
                        .INSUFFICIENT_INPUT;

                lastResult =
                    state;

                return state;
            }

            const domains =
                safeObject(
                    normalized
                        .domains
                );

            const sources =
                collectDomainSources(
                    domains
                );

            state.source_domains =
                sources
                    .source_domains;

            state.source_authorities =
                sources
                    .source_authorities;

            state.confidence_context =
                resolveGovernedConfidence({
                    ...normalized,
                    domains
                });

            state.operational_completion =
                calculateOperationalCompletion(
                    domains
                );

            state.states.profile =
                resolveProfileState(
                    normalized
                );

            state.states.verification =
                resolveVerificationState(
                    domains
                );

            state.states.readiness =
                resolveReadinessState(
                    domains
                );

            state.states.eligibility =
                resolveEligibilityState(
                    normalized,
                    domains
                );

            state.states.pathway =
                resolvePathwayState(
                    domains
                );

            state.states.media =
                resolveMediaState(
                    normalized
                );

            state.blocking_items =
                collectBlockers(
                    normalized,
                    domains
                );

            state.recommended_actions =
                collectRecommendedActions(
                    normalized,
                    domains,
                    state.blocking_items
                );

            state.states.visibility =
                resolveVisibilityState(
                    state.confidence_context,
                    state.blocking_items
                );

            state.flags =
                collectFlags(
                    domains,
                    state.blocking_items
                );

            state.intelligence_notes.push(
                "Synthesis generated only from governed upstream intelligence and supplied governed confidence."
            );

            state.intelligence_notes.push(
                "No local domain score, Composite score, or confidence score was manufactured."
            );

            state.status =
                determineStatus(
                    state
                );

            lastResult =
                state;

            return state;

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
                athlete_id:
                    input
                        ?.athlete_id ||
                    input
                        ?.snapshot
                        ?.athlete_id ||
                    null,

                snapshot_id:
                    input
                        ?.snapshot_id ||
                    input
                        ?.snapshot
                        ?.snapshot_id ||
                    null,

                synthesis_version:
                    VERSION,

                contract_version:
                    CONTRACT_VERSION,

                stream_owner:
                    STREAM_OWNER,

                states:
                    {},

                source_domains:
                    [],

                source_authorities:
                    [],

                blocking_items:
                    [],

                recommended_actions:
                    [],

                flags: [
                    "SYNTHESIS_EXECUTION_ERROR"
                ],

                confidence_context: {
                    value:
                        null,

                    level:
                        CONFIDENCE_LEVELS.UNKNOWN,

                    source:
                        null,

                    status:
                        "NOT_AVAILABLE"
                },

                operational_completion: {
                    percent:
                        null,

                    complete_domains:
                        [],

                    missing_domains:
                        []
                },

                status:
                    STATUS.ERROR,

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

    function explain(
        state
    ) {
        if (
            !state ||
            typeof state !==
                "object"
        ) {
            return {
                summary:
                    "No synthesis state available.",

                status:
                    STATUS
                        .INSUFFICIENT_INPUT
            };
        }

        return {
            summary:
                `Synthesis status is ${state.status}. Visibility posture is ${state.states?.visibility || "UNKNOWN"}. Governed confidence level is ${state.confidence_context?.level || "UNKNOWN"}.`,

            readiness:
                state.states
                    ?.readiness ||
                "UNKNOWN",

            eligibility:
                state.states
                    ?.eligibility ||
                "UNKNOWN",

            pathway:
                state.states
                    ?.pathway ||
                "UNKNOWN",

            visibility:
                state.states
                    ?.visibility ||
                "UNKNOWN",

            operational_completion:
                state
                    .operational_completion
                    ?.percent ??
                null,

            blockers:
                safeArray(
                    state
                        .blocking_items
                ),

            recommended_actions:
                safeArray(
                    state
                        .recommended_actions
                ),

            rule:
                "Synthesis summarizes governed intelligence and does not create scoring authority."
        };
    }

    function getContract() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                "SUPPORTING_ENTERPRISE_INTELLIGENCE_FUSION_AUTHORITY",

            required_identity: [
                "athlete_id",
                "snapshot_id"
            ],

            canonical_input: {
                athlete_id:
                    true,

                snapshot_id:
                    true,

                domains:
                    true,

                confidence:
                    false,

                profile_state:
                    false,

                media_state:
                    false
            },

            canonical_output: {
                athlete_id:
                    true,

                snapshot_id:
                    true,

                states:
                    true,

                source_domains:
                    true,

                source_authorities:
                    true,

                blocking_items:
                    true,

                recommended_actions:
                    true,

                flags:
                    true,

                confidence_context:
                    true,

                operational_completion:
                    true,

                status:
                    true,

                generated_at:
                    true
            },

            prohibited_output: [
                "official domain score",
                "official Composite score",
                "locally calculated confidence score",
                "athletic ability score",
                "verification score"
            ],

            confidence_rule:
                "Consume governed confidence if available; do not manufacture a local confidence formula.",

            identity_rule:
                "athlete_id and snapshot_id remain distinct identities.",

            completion_rule:
                "Operational completion describes synthesis input coverage only and is not athlete performance.",

            scoring_rule:
                "Synthesis combines governed intelligence; it does not create missing intelligence or establish scoring authority."
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            local_score_calculation:
                false,

            local_confidence_formula:
                false,

            role_presence_confidence_bonus:
                false,

            evaluator_verified_bonus:
                false,

            athlete_id_snapshot_id_collapse:
                false,

            completion_affects_athlete_score:
                false,

            direct_visibility_from_local_confidence:
                false,

            dom_rendering:
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

        const healthy =
            stream9 ===
                true;

        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                healthy
                    ? "HEALTHY"
                    : "DEGRADED",

            stream_9_authority_verified:
                stream9,

            local_score_calculation:
                false,

            local_confidence_formula:
                false,

            evaluator_role_bonus:
                false,

            coach_presence_bonus:
                false,

            counselor_presence_bonus:
                false,

            media_presence_bonus:
                false,

            athlete_id_snapshot_id_collapse:
                false,

            operational_completion_is_athlete_score:
                false,

            creates_composite:
                false,

            creates_domain_scores:
                false,

            renders_dom:
                false,

            generated_at:
                nowISO()
        };
    }

    const SynthesisEngine =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            stream_owner:
                STREAM_OWNER,

            classification:
                "SUPPORTING_ENTERPRISE_INTELLIGENCE_FUSION_AUTHORITY",

            status:
                "ACTIVE",

            synthesize,

            explain,

            getContract,

            getConfiguration,

            getLastResult,

            getLastError,

            runHealthCheck
        });

    global.STATScore =
        global.STATScore || {};

    global.STATScore.SynthesisEngine =
        SynthesisEngine;

    global.STATScoreSynthesisEngine =
        SynthesisEngine;

    console.info(
        "[STATS-CORE] Synthesis Engine loaded:",
        VERSION,
        "| non-scoring | governed confidence consumer | identity separation preserved"
    );

})(window); 
