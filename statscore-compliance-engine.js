/*!
* =============================================================================
* STATS-CORE™
* Cross-Stream Compliance / Governance Support Authority
* -----------------------------------------------------------------------------
* File:
*     statscore-compliance-engine.js
*
* Classification:
*     CROSS-STREAM COMPLIANCE / GOVERNANCE SUPPORT AUTHORITY
*
* Primary Governance Posture:
*     Enterprise Governance Support
*
* Primary Operational Consumers:
*     Stream 6 — Communication & Governance Authority
*     Stream 5 — Professional Operations Authority
*     Stream 3 — Athlete Workspace Presentation
*     Stream 9 — Contextual Intelligence Consumer
*
* Upstream Authorities Consumed:
*     Stream 1 — Authenticated identity / session context
*     Stream 2 — Guardian approval / source-record truth
*     Stream 4 — Professional role intake context
*     Stream 5 — Active professional workspace context
*     Stream 10 — Professional certification / authorization facts
*     External governed rule datasets — NCAA / recruiting / eligibility rules
*
* Version:
*     STATSCORE-COMPLIANCE-ENGINE-V2
*
* Contract Version:
*     STATSCORE-COMPLIANCE-CONTRACT-V1
*
* Status:
*     RECONSTRUCTED — NON-SCORING GOVERNANCE AUTHORITY
*
* Purpose:
*     Produce governed compliance decisions for communication, recruiting,
*     guardian protection, authorization, and eligibility-risk review without
*     becoming Communication Authority, Eligibility Authority, or athlete
*     scoring authority.
*
* Constitutional Rules:
*
*     Guardian Contact ≠ Guardian Approval
*     Role Label ≠ Authorization
*     Unknown Age ≠ Confirmed Minor
*     Compliance ≠ Academic Score
*     Compliance ≠ Eligibility Determination
*     Compliance Decision ≠ Communication Execution
*     Governance Decision ≠ Presentation
*     Missing Rule Authority ≠ Permission to Guess
*
* This file DOES:
*     - evaluate governed compliance requests;
*     - consume versioned rule context;
*     - consume guardian approval state;
*     - consume professional authorization context;
*     - determine ALLOWED / LIMITED / BLOCKED / REVIEW_REQUIRED states;
*     - preserve rule provenance;
*     - create audit-ready decision receipts;
*     - expose diagnostics.
*
* This file DOES NOT:
*     - calculate athlete scores;
*     - calculate academic scores;
*     - determine official NCAA eligibility;
*     - manufacture guardian approval;
*     - infer authorization from a role string;
*     - own Multi-Box™ execution;
*     - send messages;
*     - create recruiting actions;
*     - render DOM;
*     - hardcode unstable recruiting calendars;
*     - silently invent current rule thresholds.
*
* =============================================================================
*/

(function (global) {
    "use strict";

    const ENGINE_ID =
        "statscore-compliance-engine";

    const VERSION =
        "STATSCORE-COMPLIANCE-ENGINE-V2";

    const CONTRACT_VERSION =
        "STATSCORE-COMPLIANCE-CONTRACT-V1";

    const CLASSIFICATION =
        "CROSS_STREAM_COMPLIANCE_GOVERNANCE_SUPPORT_AUTHORITY";

    const DECISION_STATUS = Object.freeze({
        DECISION_COMPLETE:
            "DECISION_COMPLETE",

        RULE_CONTEXT_UNAVAILABLE:
            "RULE_CONTEXT_UNAVAILABLE",

        RULE_CONTEXT_STALE:
            "RULE_CONTEXT_STALE",

        AUTHORIZATION_CONTEXT_MISSING:
            "AUTHORIZATION_CONTEXT_MISSING",

        GUARDIAN_APPROVAL_REQUIRED:
            "GUARDIAN_APPROVAL_REQUIRED",

        AGE_STATUS_UNKNOWN:
            "AGE_STATUS_UNKNOWN",

        CONTACT_BLOCKED:
            "CONTACT_BLOCKED",

        CONTACT_LIMITED:
            "CONTACT_LIMITED",

        REVIEW_REQUIRED:
            "REVIEW_REQUIRED",

        INVALID_REQUEST:
            "INVALID_REQUEST",

        ERROR:
            "ERROR"
    });

    const DECISIONS = Object.freeze({
        ALLOWED:
            "ALLOWED",

        LIMITED:
            "LIMITED",

        BLOCKED:
            "BLOCKED",

        REVIEW_REQUIRED:
            "REVIEW_REQUIRED"
    });

    const AGE_STATUS = Object.freeze({
        MINOR_CONFIRMED:
            "MINOR_CONFIRMED",

        ADULT_CONFIRMED:
            "ADULT_CONFIRMED",

        AGE_STATUS_UNKNOWN:
            "AGE_STATUS_UNKNOWN"
    });

    const RECRUITING_PERIODS = Object.freeze({
        CONTACT:
            "CONTACT_PERIOD",

        QUIET:
            "QUIET_PERIOD",

        DEAD:
            "DEAD_PERIOD",

        EVALUATION:
            "EVALUATION_PERIOD",

        UNKNOWN:
            "UNKNOWN_PERIOD"
    });

    let lastDecision = null;
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

    function lower(value) {
        return normalize(value)
            .toLowerCase();
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

    function dateOnly(value) {
        if (!value) {
            return nowISO().slice(0, 10);
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return null;
        }

        return date
            .toISOString()
            .slice(0, 10);
    }

    function generateDecisionId() {
        return (
            "compliance_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }

    function generateReceiptId() {
        return (
            "compliance_receipt_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );
    }

    /*
     * =========================================================================
     * AGE STATUS
     * =========================================================================
     */

    function resolveAgeStatus(
        subject = {}
    ) {
        const age =
            Number(
                subject.age ??
                subject.raw?.age ??
                subject.raw_payload?.age
            );

        if (
            Number.isFinite(age) &&
            age > 0
        ) {
            return age < 18
                ? AGE_STATUS.MINOR_CONFIRMED
                : AGE_STATUS.ADULT_CONFIRMED;
        }

        const dob =
            subject.date_of_birth ||
            subject.dob ||
            subject.raw_payload?.date_of_birth ||
            null;

        if (dob) {
            const birthDate =
                new Date(dob);

            if (
                !Number.isNaN(
                    birthDate.getTime()
                )
            ) {
                const now =
                    new Date();

                let calculatedAge =
                    now.getFullYear() -
                    birthDate.getFullYear();

                const monthDifference =
                    now.getMonth() -
                    birthDate.getMonth();

                if (
                    monthDifference < 0 ||
                    (
                        monthDifference === 0 &&
                        now.getDate() <
                            birthDate.getDate()
                    )
                ) {
                    calculatedAge -= 1;
                }

                return calculatedAge < 18
                    ? AGE_STATUS.MINOR_CONFIRMED
                    : AGE_STATUS.ADULT_CONFIRMED;
            }
        }

        return AGE_STATUS.AGE_STATUS_UNKNOWN;
    }

    /*
     * =========================================================================
     * GUARDIAN APPROVAL
     * =========================================================================
     */

    function resolveGuardianApproval(
        context = {}
    ) {
        const approval =
            safeObject(
                context.guardian_approval ||
                context.parent_approval
            );

        const status =
            upper(
                approval.approval_status ||
                approval.status ||
                context.guardian_approval_status ||
                context.parent_approval_status ||
                ""
            );

        const approved =
            [
                "APPROVED",
                "GRANTED",
                "ACTIVE"
            ].includes(status);

        return {
            approved,

            status:
                status || "UNKNOWN",

            approval_request_id:
                approval.approval_request_id ||
                approval.request_id ||
                null,

            guardian_id:
                approval.guardian_id ||
                null,

            guardian_email:
                approval.guardian_email ||
                context.guardian_email ||
                null,

            approved_at:
                approval.approved_at ||
                null,

            receipt_id:
                approval.receipt_id ||
                null,

            source_authority:
                approval.source_authority ||
                "STREAM_2_SOURCE_RECORD_AUTHORITY"
        };
    }

    /*
     * =========================================================================
     * AUTHORIZATION CONTEXT
     * =========================================================================
     */

    function resolveAuthorizationContext(
        context = {}
    ) {
        const auth =
            safeObject(
                context.authorization ||
                context.authorization_context
            );

        const status =
            upper(
                auth.status ||
                context.authorization_status ||
                ""
            );

        const active =
            [
                "AUTHORIZED",
                "ACTIVE",
                "APPROVED"
            ].includes(status);

        return {
            sc_user_id:
                auth.sc_user_id ||
                context.sc_user_id ||
                null,

            professional_id:
                auth.professional_id ||
                context.professional_id ||
                null,

            role:
                auth.role ||
                context.role ||
                context.source_role ||
                null,

            role_context_id:
                auth.role_context_id ||
                context.role_context_id ||
                null,

            workspace_id:
                auth.workspace_id ||
                context.workspace_id ||
                null,

            certification_id:
                auth.certification_id ||
                context.certification_id ||
                null,

            certification_status:
                auth.certification_status ||
                context.certification_status ||
                null,

            authorized_scope:
                auth.authorized_scope ||
                context.authorized_scope ||
                null,

            authorization_receipt_id:
                auth.receipt_id ||
                context.authorization_receipt_id ||
                null,

            status:
                status || "UNKNOWN",

            authorized:
                active
        };
    }

    function hasAuthorizationFor(
        authorization,
        actionType
    ) {
        if (
            !authorization ||
            authorization.authorized !== true
        ) {
            return false;
        }

        const scopes =
            Array.isArray(
                authorization.authorized_scope
            )
                ? authorization.authorized_scope
                    .map(upper)
                : [
                    upper(
                        authorization.authorized_scope
                    )
                ].filter(Boolean);

        if (
            scopes.length === 0
        ) {
            return false;
        }

        const action =
            upper(actionType);

        return (
            scopes.includes("*") ||
            scopes.includes("ALL") ||
            scopes.includes(action) ||
            scopes.includes("RECRUITING_COMMUNICATION") &&
                action === "RECRUITER_CONTACT" ||
            scopes.includes("COMMUNICATION") &&
                action.includes("MESSAGE")
        );
    }

    /*
     * =========================================================================
     * RULE CONTEXT
     * =========================================================================
     */

    function validateRuleContext(
        ruleContext = {}
    ) {
        const rule =
            safeObject(
                ruleContext
            );

        const required =
            [
                "rule_set_id",
                "rule_version",
                "source_authority"
            ];

        const missing =
            required.filter(
                function (key) {
                    return !rule[key];
                }
            );

        const effectiveAt =
            rule.effective_at
                ? new Date(
                    rule.effective_at
                )
                : null;

        const expiresAt =
            rule.expires_at
                ? new Date(
                    rule.expires_at
                )
                : null;

        const now =
            new Date();

        const stale =
            Boolean(
                expiresAt &&
                !Number.isNaN(
                    expiresAt.getTime()
                ) &&
                expiresAt < now
            );

        return {
            valid:
                missing.length === 0 &&
                !stale,

            stale,

            missing,

            rule_set_id:
                rule.rule_set_id ||
                null,

            rule_version:
                rule.rule_version ||
                null,

            source_authority:
                rule.source_authority ||
                null,

            effective_at:
                rule.effective_at ||
                null,

            expires_at:
                rule.expires_at ||
                null,

            retrieved_at:
                rule.retrieved_at ||
                null
        };
    }

    function resolveRecruitingPeriod(
        ruleCalendar = [],
        context = {}
    ) {
        const checkDate =
            dateOnly(
                context.date ||
                new Date()
            );

        if (!checkDate) {
            return {
                period:
                    RECRUITING_PERIODS.UNKNOWN,

                label:
                    "Recruiting period unresolved",

                rule_source:
                    "INVALID_DATE",

                requires_review:
                    true,

                matched_rule:
                    null
            };
        }

        const rules =
            safeArray(
                ruleCalendar
            );

        const match =
            rules.find(
                function (rule) {
                    const start =
                        dateOnly(
                            rule.start_date
                        );

                    const end =
                        dateOnly(
                            rule.end_date
                        );

                    if (
                        !start ||
                        !end
                    ) {
                        return false;
                    }

                    const sportMatch =
                        !rule.sport ||
                        lower(rule.sport) ===
                            lower(context.sport);

                    const divisionMatch =
                        !rule.division ||
                        lower(rule.division) ===
                            lower(context.division);

                    return (
                        sportMatch &&
                        divisionMatch &&
                        checkDate >= start &&
                        checkDate <= end
                    );
                }
            );

        if (!match) {
            return {
                period:
                    RECRUITING_PERIODS.UNKNOWN,

                label:
                    "Recruiting period unknown",

                rule_source:
                    "NO_RULE_MATCH",

                requires_review:
                    true,

                matched_rule:
                    null
            };
        }

        return {
            period:
                match.period ||
                RECRUITING_PERIODS.UNKNOWN,

            label:
                match.label ||
                match.period ||
                "Recruiting Period",

            rule_source:
                match.rule_source ||
                context.source_authority ||
                "GOVERNED_RULE_DATA",

            requires_review:
                false,

            matched_rule:
                {
                    rule_id:
                        match.rule_id ||
                        null,

                    start_date:
                        match.start_date ||
                        null,

                    end_date:
                        match.end_date ||
                        null,

                    sport:
                        match.sport ||
                        null,

                    division:
                        match.division ||
                        null,

                    period:
                        match.period ||
                        null
                }
        };
    }

    /*
     * =========================================================================
     * RECRUITER CONTACT DECISION
     * =========================================================================
     */

    function evaluateRecruiterContact(
        input = {}
    ) {
        const athlete =
            safeObject(
                input.athlete ||
                input.snapshot
            );

        const context =
            safeObject(
                input.context
            );

        const authorization =
            resolveAuthorizationContext(
                context
            );

        const guardian =
            resolveGuardianApproval(
                context
            );

        const ageStatus =
            resolveAgeStatus(
                athlete
            );

        const ruleValidation =
            validateRuleContext(
                context.rule_context
            );

        const base = {
            decision_id:
                generateDecisionId(),

            engine_id:
                ENGINE_ID,

            engine_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            classification:
                CLASSIFICATION,

            athlete_id:
                athlete.athlete_id ||
                null,

            snapshot_id:
                athlete.snapshot_id ||
                null,

            action_type:
                "RECRUITER_CONTACT",

            subject_age_status:
                ageStatus,

            guardian_approval:
                guardian,

            authorization_context:
                authorization,

            rule_context:
                ruleValidation,

            audit_required:
                true,

            generated_at:
                nowISO()
        };

        if (
            !athlete.athlete_id ||
            !athlete.snapshot_id
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.INVALID_REQUEST,

                reasons: [
                    {
                        code:
                            "ATHLETE_CONTEXT_REQUIRED",

                        message:
                            "athlete_id and snapshot_id are required for governed compliance evaluation."
                    }
                ]
            };
        }

        if (
            !ruleValidation.valid
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    ruleValidation.stale
                        ? DECISION_STATUS.RULE_CONTEXT_STALE
                        : DECISION_STATUS.RULE_CONTEXT_UNAVAILABLE,

                reasons: [
                    {
                        code:
                            ruleValidation.stale
                                ? "RULE_CONTEXT_STALE"
                                : "RULE_CONTEXT_UNAVAILABLE",

                        message:
                            "Current governed recruiting rule context is unavailable or stale. Contact may not proceed."
                    }
                ]
            };
        }

        if (
            !authorization.authorized
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.AUTHORIZATION_CONTEXT_MISSING,

                reasons: [
                    {
                        code:
                            "AUTHORIZATION_REQUIRED",

                        message:
                            "Governed professional authorization is required before recruiter contact may be evaluated as allowed."
                    }
                ]
            };
        }

        if (
            !hasAuthorizationFor(
                authorization,
                "RECRUITER_CONTACT"
            )
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.AUTHORIZATION_CONTEXT_MISSING,

                reasons: [
                    {
                        code:
                            "AUTHORIZED_SCOPE_REQUIRED",

                        message:
                            "The authenticated professional context does not include recruiter-contact authorization."
                    }
                ]
            };
        }

        const period =
            resolveRecruitingPeriod(
                context.rule_calendar,
                {
                    sport:
                        athlete.sport ||
                        athlete.primary_sport,

                    division:
                        context.division,

                    date:
                        context.date,

                    source_authority:
                        ruleValidation.source_authority
                }
            );

        base.rule_context.period =
            period;

        if (
            period.period ===
                RECRUITING_PERIODS.DEAD
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.CONTACT_BLOCKED,

                reasons: [
                    {
                        code:
                            "DEAD_PERIOD",

                        message:
                            "Recruiter contact is blocked by the active governed recruiting-period rule."
                    }
                ]
            };
        }

        if (
            period.period ===
                RECRUITING_PERIODS.UNKNOWN
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.REVIEW_REQUIRED,

                reasons: [
                    {
                        code:
                            "RECRUITING_PERIOD_UNRESOLVED",

                        message:
                            "Recruiting-period status could not be resolved from the supplied governed rule dataset."
                    }
                ]
            };
        }

        if (
            ageStatus ===
                AGE_STATUS.MINOR_CONFIRMED &&
            guardian.approved !== true
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.GUARDIAN_APPROVAL_REQUIRED,

                reasons: [
                    {
                        code:
                            "GUARDIAN_APPROVAL_REQUIRED",

                        message:
                            "Governed guardian approval is required before recruiter-athlete communication may proceed."
                    }
                ]
            };
        }

        if (
            ageStatus ===
                AGE_STATUS.AGE_STATUS_UNKNOWN &&
            guardian.approved !== true
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.AGE_STATUS_UNKNOWN,

                reasons: [
                    {
                        code:
                            "AGE_STATUS_UNKNOWN",

                        message:
                            "Age status cannot be confirmed. Guardian/review controls remain required until subject status is established."
                    }
                ]
            };
        }

        if (
            period.period ===
                RECRUITING_PERIODS.QUIET
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.LIMITED,

                status:
                    DECISION_STATUS.CONTACT_LIMITED,

                reasons: [
                    {
                        code:
                            "QUIET_PERIOD_LIMITATION",

                        message:
                            "Contact is limited according to the active governed quiet-period rule."
                    }
                ]
            };
        }

        return {
            ...base,

            decision:
                DECISIONS.ALLOWED,

            status:
                DECISION_STATUS.DECISION_COMPLETE,

            reasons: [
                {
                    code:
                        "CONTACT_ALLOWED",

                    message:
                        "Recruiter contact is permitted under the supplied governed rule, authorization, age, and guardian context."
                }
            ]
        };
    }

    /*
     * =========================================================================
     * MESSAGE COMPLIANCE DECISION
     * =========================================================================
     */

    function evaluateMessage(
        input = {}
    ) {
        const message =
            safeObject(
                input.message
            );

        const athlete =
            safeObject(
                input.athlete ||
                input.snapshot
            );

        const context =
            safeObject(
                input.context
            );

        const fromRole =
            upper(
                message.from_role
            );

        const toRole =
            upper(
                message.to_role
            );

        const recruiterAthleteContact =
            (
                fromRole === "RECRUITER" &&
                toRole === "ATHLETE"
            ) ||
            (
                fromRole === "ATHLETE" &&
                toRole === "RECRUITER"
            );

        if (
            recruiterAthleteContact
        ) {
            return evaluateRecruiterContact({
                athlete,
                context
            });
        }

        const authorization =
            resolveAuthorizationContext(
                context
            );

        const ageStatus =
            resolveAgeStatus(
                athlete
            );

        const guardian =
            resolveGuardianApproval(
                context
            );

        const base = {
            decision_id:
                generateDecisionId(),

            engine_id:
                ENGINE_ID,

            engine_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            classification:
                CLASSIFICATION,

            athlete_id:
                athlete.athlete_id ||
                null,

            snapshot_id:
                athlete.snapshot_id ||
                null,

            action_type:
                "MESSAGE_COMPLIANCE_CHECK",

            authorization_context:
                authorization,

            subject_age_status:
                ageStatus,

            guardian_approval:
                guardian,

            audit_required:
                true,

            generated_at:
                nowISO()
        };

        if (
            !authorization.authorized
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.AUTHORIZATION_CONTEXT_MISSING,

                reasons: [
                    {
                        code:
                            "AUTHORIZATION_REQUIRED",

                        message:
                            "Governed authorization context is required before message execution."
                    }
                ]
            };
        }

        if (
            toRole === "ATHLETE" &&
            ageStatus ===
                AGE_STATUS.MINOR_CONFIRMED &&
            guardian.approved !== true
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.GUARDIAN_APPROVAL_REQUIRED,

                reasons: [
                    {
                        code:
                            "GUARDIAN_APPROVAL_REQUIRED",

                        message:
                            "Governed guardian approval is required for this minor-athlete communication path."
                    }
                ]
            };
        }

        if (
            toRole === "ATHLETE" &&
            ageStatus ===
                AGE_STATUS.AGE_STATUS_UNKNOWN &&
            guardian.approved !== true
        ) {
            return {
                ...base,

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.AGE_STATUS_UNKNOWN,

                reasons: [
                    {
                        code:
                            "AGE_STATUS_UNKNOWN",

                        message:
                            "Age status is unresolved. The communication must remain blocked pending guardian/review resolution."
                    }
                ]
            };
        }

        return {
            ...base,

            decision:
                DECISIONS.ALLOWED,

            status:
                DECISION_STATUS.DECISION_COMPLETE,

            reasons: [
                {
                    code:
                        "MESSAGE_COMPLIANCE_PASSED",

                    message:
                        "The message passed the supplied governed compliance checks."
                }
            ]
        };
    }

    /*
     * =========================================================================
     * ELIGIBILITY / ACADEMIC RISK INTERPRETATION
     * =========================================================================
     */

    function evaluateEligibilityRisk(
        input = {}
    ) {
        const athlete =
            safeObject(
                input.athlete ||
                input.snapshot
            );

        const record =
            safeObject(
                input.course_record ||
                input.academic_record
            );

        const ruleContext =
            safeObject(
                input.rule_context
            );

        const validation =
            validateRuleContext(
                ruleContext
            );

        const base = {
            decision_id:
                generateDecisionId(),

            engine_id:
                ENGINE_ID,

            engine_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            classification:
                CLASSIFICATION,

            athlete_id:
                athlete.athlete_id ||
                null,

            snapshot_id:
                athlete.snapshot_id ||
                null,

            action_type:
                "ELIGIBILITY_RISK_REVIEW",

            official_eligibility_determination:
                false,

            academic_score:
                null,

            eligibility_score:
                null,

            rule_context:
                validation,

            generated_at:
                nowISO()
        };

        if (
            !validation.valid
        ) {
            return {
                ...base,

                status:
                    validation.stale
                        ? DECISION_STATUS.RULE_CONTEXT_STALE
                        : DECISION_STATUS.RULE_CONTEXT_UNAVAILABLE,

                risk:
                    "UNKNOWN",

                review_required:
                    true,

                reasons: [
                    {
                        code:
                            "CURRENT_ELIGIBILITY_RULE_CONTEXT_REQUIRED",

                        message:
                            "Current governed eligibility-rule data is required before academic risk interpretation may proceed."
                    }
                ]
            };
        }

        const requiredCourses =
            Number(
                ruleContext.required_core_courses
            );

        const minimumGpa =
            Number(
                ruleContext.minimum_core_gpa
            );

        const completedCourses =
            Number(
                record.total_core_courses_completed
            );

        const coreGpa =
            Number(
                record.core_gpa
            );

        if (
            !Number.isFinite(requiredCourses) ||
            !Number.isFinite(completedCourses)
        ) {
            return {
                ...base,

                status:
                    DECISION_STATUS.REVIEW_REQUIRED,

                risk:
                    "UNKNOWN",

                review_required:
                    true,

                reasons: [
                    {
                        code:
                            "COURSE_RULE_OR_RECORD_INCOMPLETE",

                        message:
                            "Core-course requirement or athlete course record is incomplete."
                    }
                ]
            };
        }

        const missingCourses =
            Math.max(
                0,
                requiredCourses -
                completedCourses
            );

        const transcriptStatus =
            upper(
                record.transcript_status
            );

        let status =
            "RISK_REVIEW";

        let risk =
            "HIGH";

        if (
            missingCourses === 0 &&
            Number.isFinite(coreGpa) &&
            Number.isFinite(minimumGpa) &&
            coreGpa >= minimumGpa &&
            [
                "CONFIRMED",
                "VERIFIED"
            ].some(
                function (token) {
                    return transcriptStatus.includes(
                        token
                    );
                }
            )
        ) {
            status =
                "ON_TRACK";

            risk =
                "LOW";
        } else if (
            missingCourses <= 3
        ) {
            status =
                "PARTIAL_REVIEW";

            risk =
                "MODERATE";
        }

        return {
            ...base,

            status:
                DECISION_STATUS.DECISION_COMPLETE,

            compliance_state:
                status,

            risk,

            required_core_courses:
                requiredCourses,

            completed_core_courses:
                completedCourses,

            missing_core_courses:
                missingCourses,

            core_gpa:
                Number.isFinite(coreGpa)
                    ? coreGpa
                    : null,

            minimum_core_gpa_rule:
                Number.isFinite(minimumGpa)
                    ? minimumGpa
                    : null,

            transcript_status:
                record.transcript_status ||
                "UNKNOWN",

            counselor_review_required:
                status !== "ON_TRACK",

            official_eligibility_determination:
                false,

            explanation:
                "This is compliance/risk intelligence only. NCAA Eligibility Center, school records, and other governing bodies remain the official eligibility authorities."
        };
    }

    /*
     * =========================================================================
     * RECEIPTS
     * =========================================================================
     */

    function buildComplianceReceipt(
        decision,
        context = {}
    ) {
        const authorization =
            resolveAuthorizationContext(
                context
            );

        return {
            receipt_id:
                generateReceiptId(),

            receipt_type:
                "STATSCORE_COMPLIANCE_RECEIPT",

            engine_id:
                ENGINE_ID,

            engine_version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            decision_id:
                decision?.decision_id ||
                null,

            action_type:
                decision?.action_type ||
                null,

            decision:
                decision?.decision ||
                null,

            status:
                decision?.status ||
                null,

            athlete_id:
                decision?.athlete_id ||
                null,

            snapshot_id:
                decision?.snapshot_id ||
                null,

            actor_sc_user_id:
                authorization.sc_user_id,

            professional_id:
                authorization.professional_id,

            role_context_id:
                authorization.role_context_id,

            workspace_id:
                authorization.workspace_id,

            certification_id:
                authorization.certification_id,

            authorization_receipt_id:
                authorization.authorization_receipt_id,

            session_id:
                context.session_id ||
                null,

            rule_set_id:
                decision?.rule_context?.rule_set_id ||
                null,

            rule_version:
                decision?.rule_context?.rule_version ||
                null,

            rule_source_authority:
                decision?.rule_context?.source_authority ||
                null,

            occurred_at:
                context.occurred_at ||
                nowISO(),

            created_at:
                nowISO(),

            locked:
                true
        };
    }

    /*
     * =========================================================================
     * EXPLAINABILITY
     * =========================================================================
     */

    function explainDecision(
        decision
    ) {
        if (
            !decision ||
            typeof decision !== "object"
        ) {
            return {
                summary:
                    "No compliance decision is available.",

                status:
                    DECISION_STATUS.INVALID_REQUEST
            };
        }

        return {
            summary:
                `${decision.action_type || "Compliance action"} resolved as ${decision.decision || decision.status || "UNKNOWN"}.`,

            reasons:
                safeArray(
                    decision.reasons
                ),

            rule_context:
                decision.rule_context ||
                null,

            authorization_context:
                decision.authorization_context ||
                null,

            guardian_approval:
                decision.guardian_approval ||
                null,

            subject_age_status:
                decision.subject_age_status ||
                null,

            rule:
                "Compliance determines whether an action is permitted under governed rule, approval, identity, and authorization context. It does not calculate athlete ability or replace communication execution authority."
        };
    }

    /*
     * =========================================================================
     * CONTRACT / DIAGNOSTICS
     * =========================================================================
     */

    function getContract() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            classification:
                CLASSIFICATION,

            official_scoring_authority:
                false,

            official_eligibility_authority:
                false,

            communication_execution_authority:
                false,

            guardian_approval_authority:
                false,

            professional_certification_authority:
                false,

            canonical_inputs: {
                athlete_id:
                    true,

                snapshot_id:
                    true,

                rule_context:
                    true,

                authorization_context:
                    true,

                guardian_approval_context:
                    false,

                rule_calendar:
                    false
            },

            canonical_outputs: {
                decision_id:
                    true,

                action_type:
                    true,

                decision:
                    true,

                reasons:
                    true,

                authorization_context:
                    true,

                rule_context:
                    true,

                audit_required:
                    true,

                status:
                    true,

                generated_at:
                    true
            },

            constitutional_rules: [
                "Guardian Contact ≠ Guardian Approval",
                "Role Label ≠ Authorization",
                "Unknown Age ≠ Confirmed Minor",
                "Compliance ≠ Academic Score",
                "Compliance ≠ Eligibility Determination",
                "Compliance Decision ≠ Communication Execution",
                "Governance Decision ≠ Presentation",
                "Missing Rule Authority ≠ Permission to Guess"
            ]
        };
    }

    function getConfiguration() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            hardcoded_recruiting_calendar:
                false,

            hardcoded_ncaa_core_course_rule:
                false,

            guardian_contact_equals_approval:
                false,

            role_string_equals_authorization:
                false,

            unknown_age_equals_minor:
                false,

            compliance_equals_academic_score:
                false,

            compliance_equals_eligibility_determination:
                false,

            communication_execution_owned_here:
                false,

            dom_rendering_enabled:
                false,

            fail_closed_on_missing_rule_context:
                true,

            audit_receipts_enabled:
                true
        };
    }

    function getLastDecision() {
        return lastDecision;
    }

    function getLastError() {
        return lastError;
    }

    function execute(
        type,
        input
    ) {
        lastError =
            null;

        try {
            let result;

            switch (
                upper(type)
            ) {
                case "RECRUITER_CONTACT":
                    result =
                        evaluateRecruiterContact(
                            input
                        );
                    break;

                case "MESSAGE":
                case "MESSAGE_COMPLIANCE":
                    result =
                        evaluateMessage(
                            input
                        );
                    break;

                case "ELIGIBILITY_RISK":
                    result =
                        evaluateEligibilityRisk(
                            input
                        );
                    break;

                default:
                    result = {
                        decision_id:
                            generateDecisionId(),

                        engine_id:
                            ENGINE_ID,

                        engine_version:
                            VERSION,

                        action_type:
                            upper(type) ||
                            "UNKNOWN",

                        decision:
                            DECISIONS.BLOCKED,

                        status:
                            DECISION_STATUS.INVALID_REQUEST,

                        reasons: [
                            {
                                code:
                                    "UNSUPPORTED_COMPLIANCE_ACTION",

                                message:
                                    "The requested compliance action is not registered."
                            }
                        ],

                        generated_at:
                            nowISO()
                    };
                    break;
            }

            lastDecision =
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
                decision_id:
                    generateDecisionId(),

                engine_id:
                    ENGINE_ID,

                engine_version:
                    VERSION,

                action_type:
                    upper(type) ||
                    "UNKNOWN",

                decision:
                    DECISIONS.BLOCKED,

                status:
                    DECISION_STATUS.ERROR,

                reasons: [
                    {
                        code:
                            "COMPLIANCE_EXECUTION_ERROR",

                        message:
                            lastError.message
                    }
                ],

                generated_at:
                    nowISO()
            };

            lastDecision =
                result;

            return result;
        }
    }

    function runHealthCheck() {
        return {
            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            status:
                "HEALTHY",

            hardcoded_recruiting_calendar:
                false,

            hardcoded_unstable_eligibility_rules:
                false,

            guardian_contact_equals_approval:
                false,

            role_string_equals_authorization:
                false,

            unknown_age_equals_minor:
                false,

            compliance_publishes_athlete_score:
                false,

            compliance_publishes_academic_score:
                false,

            compliance_publishes_official_eligibility:
                false,

            communication_execution_owned_here:
                false,

            dom_rendering_enabled:
                false,

            current_rule_context_required:
                true,

            rule_provenance_preserved:
                true,

            audit_receipt_supported:
                true,

            generated_at:
                nowISO()
        };
    }

    const ComplianceEngine =
        Object.freeze({

            engine_id:
                ENGINE_ID,

            version:
                VERSION,

            contract_version:
                CONTRACT_VERSION,

            classification:
                CLASSIFICATION,

            status:
                "ACTIVE",

            decisions:
                DECISIONS,

            decision_status:
                DECISION_STATUS,

            age_status:
                AGE_STATUS,

            recruiting_periods:
                RECRUITING_PERIODS,

            resolveAgeStatus,

            resolveGuardianApproval,

            resolveAuthorizationContext,

            validateRuleContext,

            resolveRecruitingPeriod,

            evaluateRecruiterContact,

            evaluateMessage,

            evaluateEligibilityRisk,

            buildComplianceReceipt,

            explainDecision,

            execute,

            getContract,

            getConfiguration,

            getLastDecision,

            getLastError,

            runHealthCheck
        });

    global.STATScore =
        global.STATScore || {};

    global.STATScore.ComplianceEngine =
        ComplianceEngine;

    global.STATScoreComplianceEngine =
        ComplianceEngine;

    console.info(
        "[STATS-CORE] Compliance Engine loaded:",
        VERSION,
        "| cross-stream governance | non-scoring | current-rule authority required"
    );

})(window); 
