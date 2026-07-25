/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-role-access.js

Asset Type:
JavaScript Infrastructure / Governed Access Authority

Owner Authority:
STATS-CORE Enterprise Access Governance Authority

Primary Operational Authority:
STATS-CORE Enterprise Access Governance Authority

Layer:
Enterprise Infrastructure / Access Governance

Runtime Consumer Boundary:
Consumes Initial Authentication Context from Stream 1.
Consumes Initial Runtime Context from Stream 8.
Consumes resource and policy determinations from their
respective governing authorities.

Primary Consumers:
- statscore-routing.js
- role-dashboard-intake.html
- role-dashboard.html
- athlete-dashboard.html
- player-profile.html
- multi-box.html
- protected role-aware pages
- governed page runtimes

Purpose:
Validates authenticated and runtime identity consistency,
evaluates lifecycle-aware baseline destination capability,
enforces required active Runtime Context bindings, applies
governed resource constraints, and publishes formal access
decisions compatible with the STATS-CORE Routing Authority.

Consumes:
- Initial Authentication Context
- Initial Runtime Context
- trusted entry_intent
- authenticated requested_destination
- registered destination
- active runtime role
- active role_id
- active workspace_id
- active snapshot_id
- active athlete_id
- credential_status
- trust_classification
- permission_set
- assigned_population_context
- governed authority constraints

Provides:
- governed access decisions
- lifecycle-aware intake access
- baseline capability evaluation
- active-context binding validation
- access diagnostics
- authenticated sender identity facts
- UI presentation controls derived from approved decisions
- secondary filtered presentation views

Primary IDs:
- session_id
- user_id
- runtime_id
- role
- role_id
- workspace_id
- athlete_id
- snapshot_id
- destination

Cross-Stream Dependencies:
- Stream 1 owns authentication, entry intent, and Initial
  Authentication Context.
- Stream 8 owns Initial Runtime Context and runtime continuity.
- Stream 2 owns athlete and snapshot source-record establishment.
- Stream 4 owns professional intake, role_id, and workspace context.
- Stream 6 owns Multi-Box communication policy.
- Stream 7 owns exposure and media decisions.
- Stream 9 owns intelligence outputs and related policy facts.
- Routing consumes formal access decisions from this authority.

Does NOT:
- authenticate users
- manufacture session_id
- manufacture user_id
- manufacture role or role_id
- manufacture snapshot_id or athlete_id
- persist authenticated identity
- resolve authority from URL parameters
- treat new=1 as lifecycle authority
- resolve authority from browser storage
- create generic fallback roles
- determine authentication entry state
- override requested_destination
- determine Multi-Box target-role policy
- determine communication windows
- determine guardian communication approval
- create immutable enterprise receipts
- treat DOM visibility as security enforcement
- query or modify Supabase records
- calculate intelligence
- render dashboards
- modify source records
- modify scores
- send communications

Status:
CONTROLLED V5.2 LIFECYCLE AND CONTEXT REVISION

==========================================================
*/

/*
============================================================
STATS-CORE™ Governed Role Access Authority
File: statscore-role-access.js
Version: STATSCORE-ROLE-ACCESS-V5.2

Purpose:
Authentication Context Acceptance
→ Runtime Context Acceptance
→ Context Consistency Validation
→ Trusted Lifecycle Policy Resolution
→ Baseline Capability Evaluation
→ Active Runtime Binding Validation
→ Resource-Bound Governing Constraint
→ Formal Access Decision
→ Routing and Page Consumers

Routing V3.1 Decision Contract:
{
  allowed,
  authority_id,
  authority_type,
  destination,
  user_id,
  session_id,
  decided_at,
  status
}

Certified lifecycle distinctions:

FIRST_TIME_ATHLETE_INTAKE
- Authentication Service-authorized Snapshot Intake entry.
- Does not require preexisting snapshot_id or athlete_id.
- Requires runtime_id.

RETURNING_ATHLETE_MAINTENANCE
- Governed maintenance access to an existing athlete record.
- Requires runtime_id, snapshot_id, and athlete_id.

FIRST_TIME_PROFESSIONAL_INTAKE
- Professional intake before role_id/workspace establishment.
- Requires runtime_id.
- Does not require role_id.

ESTABLISHED_PROFESSIONAL_RUNTIME
- Operational professional destinations.
- Requires runtime_id, role_id, and active workspace where
  specified by destination policy.

This engine never derives authenticated authority from:
- URL parameters
- sessionStorage
- localStorage
- sender payloads
- page attributes
- caller-supplied role values
- caller-supplied new=1 flags

It remains dormant until explicitly initialized with governed
Authentication Context and Runtime Context.
============================================================
*/

(function () {
  "use strict";

  const ENGINE_ID = "statscore-role-access";
  const VERSION = "STATSCORE-ROLE-ACCESS-V5.2";
  const AUTHORITY_ID = "statscore-role-access";
  const AUTHORITY_TYPE = "GOVERNED_ACCESS_AUTHORITY";

  const MAX_CONSTRAINT_DECISION_AGE_MS = 5 * 60 * 1000;
  const MAX_CLOCK_SKEW_MS = 30 * 1000;

  const ENTRY_INTENTS = deepFreeze({
    FIRST_TIME_ATHLETE_INTAKE:
      "FIRST_TIME_ATHLETE_INTAKE",

    RETURNING_ATHLETE_MAINTENANCE:
      "RETURNING_ATHLETE_MAINTENANCE",

    FIRST_TIME_PROFESSIONAL_INTAKE:
      "FIRST_TIME_PROFESSIONAL_INTAKE",

    ESTABLISHED_PROFESSIONAL_RUNTIME:
      "ESTABLISHED_PROFESSIONAL_RUNTIME"
  });

  const PROFESSIONAL_ROLES = Object.freeze([
    "parent",
    "coach",
    "counselor",
    "recruiter",
    "evaluator",
    "program",
    "trainer"
  ]);

  const ALL_ROLES = Object.freeze([
    "athlete",
    ...PROFESSIONAL_ROLES,
    "admin"
  ]);

  const PUBLIC_ROUTES = Object.freeze([
    "index.html",
    "login.html",
    "privacy.html",
    "terms.html"
  ]);

  const SUPPORTED_POLICY_MODES = Object.freeze([
    "PUBLIC",
    "BASELINE",
    "GOVERNED_RESOURCE",
    "ADMIN_GOVERNED"
  ]);

  const RESOURCE_BINDING_FIELDS = Object.freeze([
    "runtime_id",
    "role_id",
    "workspace_id",
    "snapshot_id",
    "athlete_id",
    "organization_id"
  ]);

  const ROLE_LABELS = deepFreeze({
    athlete: "Athlete",
    parent: "Parent / Guardian",
    coach: "Coach",
    counselor: "Counselor",
    recruiter: "Recruiter",
    evaluator: "Evaluator",
    program: "Program",
    trainer: "Trainer",
    admin: "Administrator"
  });

  /*
  ========================================================
  BASELINE CAPABILITY CATALOG
  ========================================================
  */

  const BASELINE_CAPABILITIES = deepFreeze({
    athlete: {
      enter_first_time_snapshot_intake: true,
      maintain_snapshot_intake: true,
      view_athlete_dashboard: true,
      view_player_profile: true,
      request_verification: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      view_eligibility: true,
      view_pathway: true
    },

    parent: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      view_eligibility: true,
      view_pathway: true,
      request_verification: true
    },

    coach: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      view_eligibility: true,
      view_pathway: true,
      request_verification: true
    },

    counselor: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_eligibility: true,
      view_pathway: true,
      request_verification: true
    },

    recruiter: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_pathway: true
    },

    evaluator: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      request_verification: true,
      review_verification: true
    },

    program: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      view_pathway: true,
      request_verification: true
    },

    trainer: {
      enter_role_dashboard_intake: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      request_verification: true
    },

    admin: {
      view_system: true,
      view_role_dashboard: true,
      view_player_profile: true,
      view_athlete_dashboard: true,
      access_multibox_surface: true,
      view_crystal_registry: true,
      view_readiness: true,
      view_eligibility: true,
      view_pathway: true,
      request_verification: true,
      review_verification: true
    }
  });

  const KNOWN_CAPABILITIES = Object.freeze(
    Array.from(
      new Set(
        Object.values(BASELINE_CAPABILITIES)
          .flatMap(capabilities =>
            Object.keys(capabilities)
          )
      )
    )
  );

  /*
  ========================================================
  CORE DESTINATION POLICY REGISTRY
  ========================================================

  Snapshot Intake is resolved through a trusted lifecycle variant
  before this registry is evaluated.

  Core policies are immutable.

  A custom policy resolver may make a policy more restrictive.
  It may not:
  - downgrade a protected route to PUBLIC
  - replace a core capability
  - expand allowed roles
  - remove role_id requirements
  - remove active resource bindings
  ========================================================
  */

  const CORE_DESTINATION_POLICIES = deepFreeze({
    "index.html": {
      mode: "PUBLIC",
      capability: null,
      allowed_roles: [],
      requires_role_id: false,
      required_resource_bindings: []
    },

    "login.html": {
      mode: "PUBLIC",
      capability: null,
      allowed_roles: [],
      requires_role_id: false,
      required_resource_bindings: []
    },

    "privacy.html": {
      mode: "PUBLIC",
      capability: null,
      allowed_roles: [],
      requires_role_id: false,
      required_resource_bindings: []
    },

    "terms.html": {
      mode: "PUBLIC",
      capability: null,
      allowed_roles: [],
      requires_role_id: false,
      required_resource_bindings: []
    },

    /*
    Snapshot Intake is resolved by:
    resolveSnapshotIntakePolicy()
    */

    "athlete-dashboard.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_athlete_dashboard",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "player-profile.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_player_profile",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "role-dashboard-intake.html": {
      mode: "BASELINE",
      capability: "enter_role_dashboard_intake",
      allowed_roles: PROFESSIONAL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id"
      ]
    },

    "role-dashboard.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: PROFESSIONAL_ROLES,
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "parent.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: ["parent"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "coach.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: ["coach"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "counselor.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: ["counselor"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "recruiter-access.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_role_dashboard",
      allowed_roles: ["recruiter"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "evaluator.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: ["evaluator"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "program.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: ["program"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "trainer.html": {
      mode: "BASELINE",
      capability: "view_role_dashboard",
      allowed_roles: ["trainer"],
      requires_role_id: true,
      required_resource_bindings: [
        "runtime_id",
        "role_id",
        "workspace_id"
      ]
    },

    "system.html": {
      mode: "ADMIN_GOVERNED",
      capability: "view_system",
      allowed_roles: ["admin"],
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id"
      ]
    },

    "verification-request.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "request_verification",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "verification-review.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "review_verification",
      allowed_roles: [
        "evaluator",
        "admin"
      ],
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "verification.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "request_verification",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "eligibility.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_eligibility",
      allowed_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "admin"
      ],
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "readiness.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_readiness",
      allowed_roles: [
        "athlete",
        "parent",
        "coach",
        "evaluator",
        "program",
        "trainer",
        "admin"
      ],
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "college-pathway.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_pathway",
      allowed_roles: [
        "athlete",
        "parent",
        "coach",
        "counselor",
        "recruiter",
        "program",
        "admin"
      ],
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "multi-box.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "access_multibox_surface",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "crystal-registry.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_crystal_registry",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    },

    "crystal-report.html": {
      mode: "GOVERNED_RESOURCE",
      capability: "view_crystal_registry",
      allowed_roles: ALL_ROLES,
      requires_role_id: false,
      required_resource_bindings: [
        "runtime_id",
        "snapshot_id",
        "athlete_id"
      ]
    }
  });

  const REQUIRED_AUTHENTICATION_FIELDS = Object.freeze([
    "session_id",
    "user_id",
    "role",
    "entry_intent",
    "authenticated_at",
    "authentication_source",
    "requested_destination"
  ]);

  const REQUIRED_CONSTRAINT_FIELDS = Object.freeze([
    "allowed",
    "authority_id",
    "authority_type",
    "destination",
    "user_id",
    "session_id",
    "decided_at",
    "expires_at",
    "resource_bindings"
  ]);

  const CONFIGURATION = {
    authenticationContextResolver: null,
    runtimeContextResolver: null,
    constraintResolver: null,
    destinationPolicyResolver: null,
    lifecycleContextResolver: null,

    requireRuntimeContext: true,

    maximumConstraintDecisionAgeMs:
      MAX_CONSTRAINT_DECISION_AGE_MS,

    maximumClockSkewMs:
      MAX_CLOCK_SKEW_MS
  };

  let CONFIGURATION_LOCKED = false;
  let STATE = createDefaultState();

  function createDefaultState() {
    return {
      initialized: false,
      initialization_status: "LOADED",

      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,

      initialized_at: null,
      updated_at: null,

      authentication_context: null,
      runtime_context: null,

      last_request: null,
      last_lifecycle_context: null,
      last_policy: null,
      last_decision: null,
      last_constraint_decision: null,

      access_events: [],
      errors: [],
      warnings: []
    };
  }

  function deepFreeze(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach(key => {
      deepFreeze(value[key]);
    });

    return Object.freeze(value);
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function normalizeRole(value) {
    const role = clean(value).toLowerCase();

    if (role === "administrator") {
      return "admin";
    }

    return role;
  }

  function isKnownRole(role) {
    return ALL_ROLES.includes(
      normalizeRole(role)
    );
  }

  function isProfessionalRole(role) {
    return PROFESSIONAL_ROLES.includes(
      normalizeRole(role)
    );
  }

  function roleName(role) {
    return (
      ROLE_LABELS[normalizeRole(role)] ||
      "Unknown Role"
    );
  }

  function isPublicRoute(page) {
    return PUBLIC_ROUTES.includes(
      clean(page)
    );
  }

  function log(message, payload) {
    console.info(
      `[STATS-CORE Role Access] ${message}`,
      payload === undefined ? "" : payload
    );
  }

  function publishState() {
    const publicState = clone(STATE);

    window.STATScoreRoleAccessState =
      publicState;

    window.STATScore =
      window.STATScore || {};

    window.STATScore.RoleAccessState =
      clone(publicState);

    return publicState;
  }

  function getState() {
    return clone(STATE);
  }

  function emit(eventName, payload = {}) {
    const detail = {
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,
      emitted_at: nowISO(),
      ...clone(payload)
    };

    window.dispatchEvent(
      new CustomEvent(
        `statscore:access:${eventName}`,
        { detail }
      )
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        `access_${eventName}`,
        detail
      );
    }
  }

  function recordAccessEvent(
    type,
    payload = {}
  ) {
    const event = {
      access_event_id:
        "sc_access_event_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 10),

      event_type:
        clean(type) || "ACCESS_EVENT",

      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,

      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.access_events.push(event);
    STATE.updated_at = nowISO();

    publishState();

    emit("event_recorded", {
      access_event: clone(event)
    });

    return clone(event);
  }

  function recordWarning(
    code,
    message,
    payload = null
  ) {
    const warning = {
      code:
        clean(code) || "ACCESS_WARNING",

      message:
        clean(message) || "Access warning.",

      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.warnings.push(warning);
    STATE.updated_at = nowISO();

    console.warn(
      `[STATS-CORE Role Access] ${warning.code}: ${warning.message}`,
      payload || ""
    );

    publishState();
    emit("warning", {
      warning: clone(warning)
    });

    return clone(warning);
  }

  function recordError(
    code,
    message,
    payload = null
  ) {
    const errorRecord = {
      code:
        clean(code) || "ACCESS_ERROR",

      message:
        clean(message) || "Access error.",

      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.errors.push(errorRecord);
    STATE.updated_at = nowISO();

    console.error(
      `[STATS-CORE Role Access] ${errorRecord.code}: ${errorRecord.message}`,
      payload || ""
    );

    publishState();
    emit("error", {
      error: clone(errorRecord)
    });

    return clone(errorRecord);
  }

  function configure(options = {}) {
    if (CONFIGURATION_LOCKED) {
      throw new Error(
        "Access Authority configuration is locked for the active runtime."
      );
    }

    const resolverNames = [
      "authenticationContextResolver",
      "runtimeContextResolver",
      "constraintResolver",
      "destinationPolicyResolver",
      "lifecycleContextResolver"
    ];

    resolverNames.forEach(name => {
      if (
        !Object.prototype.hasOwnProperty.call(
          options,
          name
        )
      ) {
        return;
      }

      const resolver = options[name];

      if (
        resolver !== null &&
        typeof resolver !== "function"
      ) {
        throw new TypeError(
          `${name} must be a function or null.`
        );
      }

      CONFIGURATION[name] = resolver;
    });

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "requireRuntimeContext"
      )
    ) {
      CONFIGURATION.requireRuntimeContext =
        options.requireRuntimeContext !== false;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "maximumConstraintDecisionAgeMs"
      )
    ) {
      const value = Number(
        options.maximumConstraintDecisionAgeMs
      );

      if (
        !Number.isFinite(value) ||
        value <= 0
      ) {
        throw new TypeError(
          "maximumConstraintDecisionAgeMs must be a positive number."
        );
      }

      CONFIGURATION
        .maximumConstraintDecisionAgeMs =
        value;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "maximumClockSkewMs"
      )
    ) {
      const value = Number(
        options.maximumClockSkewMs
      );

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        throw new TypeError(
          "maximumClockSkewMs must be a non-negative number."
        );
      }

      CONFIGURATION.maximumClockSkewMs =
        value;
    }

    recordAccessEvent(
      "ACCESS_CONFIGURATION_UPDATED",
      {
        configuration:
          getConfiguration()
      }
    );

    return getConfiguration();
  }

  function getConfiguration() {
    return {
      configuration_locked:
        CONFIGURATION_LOCKED,

      has_authentication_context_resolver:
        typeof CONFIGURATION
          .authenticationContextResolver ===
        "function",

      has_runtime_context_resolver:
        typeof CONFIGURATION
          .runtimeContextResolver ===
        "function",

      has_constraint_resolver:
        typeof CONFIGURATION
          .constraintResolver ===
        "function",

      has_destination_policy_resolver:
        typeof CONFIGURATION
          .destinationPolicyResolver ===
        "function",

      has_lifecycle_context_resolver:
        typeof CONFIGURATION
          .lifecycleContextResolver ===
        "function",

      require_runtime_context:
        CONFIGURATION
          .requireRuntimeContext,

      maximum_constraint_decision_age_ms:
        CONFIGURATION
          .maximumConstraintDecisionAgeMs,

      maximum_clock_skew_ms:
        CONFIGURATION.maximumClockSkewMs
    };
  }

  function getAuthenticationContextFromWindow() {
    return (
      window
        .STATScoreInitialAuthenticationContext ||
      window.STATScoreAuthenticationContext ||
      window.STATScore
        ?.InitialAuthenticationContext ||
      window.STATScore
        ?.AuthenticationContext ||
      null
    );
  }

  function getRuntimeContextFromWindow() {
    const runtimeEngine =
      window.STATScoreRuntimeStateEngine ||
      window.STATScore
        ?.RuntimeStateEngine ||
      null;

    return (
      runtimeEngine
        ?.getInitialRuntimeContext?.() ||
      runtimeEngine
        ?.getState?.()
        ?.initial_runtime_context ||
      window.STATScoreInitialRuntimeContext ||
      window.STATScore
        ?.InitialRuntimeContext ||
      null
    );
  }

  async function resolveAuthenticationContext(
    suppliedContext = null
  ) {
    if (suppliedContext) {
      return clone(suppliedContext);
    }

    if (
      typeof CONFIGURATION
        .authenticationContextResolver ===
      "function"
    ) {
      return clone(
        await CONFIGURATION
          .authenticationContextResolver()
      );
    }

    return clone(
      getAuthenticationContextFromWindow()
    );
  }

  async function resolveRuntimeContext(
    suppliedContext = null
  ) {
    if (suppliedContext) {
      return clone(suppliedContext);
    }

    if (
      typeof CONFIGURATION
        .runtimeContextResolver ===
      "function"
    ) {
      return clone(
        await CONFIGURATION
          .runtimeContextResolver()
      );
    }

    return clone(
      getRuntimeContextFromWindow()
    );
  }

  function validateAuthenticationContext(
    context
  ) {
    const errors = [];

    if (
      !context ||
      typeof context !== "object" ||
      Array.isArray(context)
    ) {
      return {
        valid: false,
        errors: [
          "Initial Authentication Context is unavailable."
        ]
      };
    }

    REQUIRED_AUTHENTICATION_FIELDS
      .forEach(field => {
        if (
          clean(context[field]) === ""
        ) {
          errors.push(
            `Initial Authentication Context is missing required field: ${field}`
          );
        }
      });

    if (
      context.role &&
      !isKnownRole(context.role)
    ) {
      errors.push(
        `Initial Authentication Context contains unsupported role: ${context.role}`
      );
    }

    if (
      context.authenticated_at &&
      Number.isNaN(
        Date.parse(
          context.authenticated_at
        )
      )
    ) {
      errors.push(
        "Initial Authentication Context authenticated_at is invalid."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function normalizeAuthenticationContext(
    context
  ) {
    return {
      session_id:
        clean(context.session_id),

      user_id:
        clean(context.user_id),

      role:
        normalizeRole(context.role),

      entry_intent:
        clean(context.entry_intent),

      authenticated_at:
        clean(context.authenticated_at),

      authentication_source:
        clean(
          context.authentication_source
        ),

      requested_destination:
        clean(
          context.requested_destination
        )
    };
  }

  function normalizeRuntimeContext(
    context
  ) {
    if (
      !context ||
      typeof context !== "object" ||
      Array.isArray(context)
    ) {
      return null;
    }

    return {
      runtime_id:
        clean(context.runtime_id) ||
        null,

      session_id:
        clean(context.session_id) ||
        null,

      user_id:
        clean(context.user_id) ||
        null,

      role:
        normalizeRole(context.role) ||
        null,

      role_id:
        clean(context.role_id) ||
        null,

      entry_intent:
        clean(context.entry_intent) ||
        null,

      authenticated_at:
        clean(context.authenticated_at) ||
        null,

      authentication_source:
        clean(
          context.authentication_source
        ) || null,

      requested_destination:
        clean(
          context.requested_destination
        ) || null,

      page_id:
        clean(context.page_id) ||
        null,

      page_context:
        clone(
          context.page_context ||
          null
        ),

      active_snapshot_id:
        clean(
          context.active_snapshot_id
        ) ||
        clean(
          context.page_context
            ?.snapshot_id
        ) ||
        null,

      active_athlete_id:
        clean(
          context.active_athlete_id
        ) || null,

      active_workspace_id:
        clean(
          context.active_workspace_id
        ) || null,

      organization_id:
        clean(
          context.organization_id
        ) || null,

      credential_status:
        clean(
          context.credential_status
        ).toLowerCase() || null,

      trust_classification:
        clean(
          context.trust_classification
        ).toLowerCase() || null,

      permission_set:
        clone(
          context.permission_set ||
          null
        ),

      assigned_population_context:
        clone(
          context
            .assigned_population_context ||
          null
        ),

      system_state:
        clean(context.system_state) ||
        null
    };
  }

  function validateContextConsistency(
    authenticationContext,
    runtimeContext
  ) {
    const errors = [];

    if (
      CONFIGURATION
        .requireRuntimeContext &&
      !runtimeContext
    ) {
      errors.push(
        "Initial Runtime Context is required but unavailable."
      );

      return {
        valid: false,
        errors
      };
    }

    if (!runtimeContext) {
      return {
        valid: true,
        errors: []
      };
    }

    if (
      runtimeContext.session_id &&
      runtimeContext.session_id !==
        authenticationContext
          .session_id
    ) {
      errors.push(
        "Runtime Context session_id does not match Authentication Context."
      );
    }

    if (
      runtimeContext.user_id &&
      runtimeContext.user_id !==
        authenticationContext.user_id
    ) {
      errors.push(
        "Runtime Context user_id does not match Authentication Context."
      );
    }

    if (
      runtimeContext.role &&
      normalizeRole(
        runtimeContext.role
      ) !==
        normalizeRole(
          authenticationContext.role
        )
    ) {
      errors.push(
        "Runtime Context role does not match Authentication Context."
      );
    }

    if (
      runtimeContext
        .authenticated_at &&
      authenticationContext
        .authenticated_at &&
      runtimeContext.authenticated_at !==
        authenticationContext
          .authenticated_at
    ) {
      errors.push(
        "Runtime Context authenticated_at does not match Authentication Context."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function getAuthenticationContext() {
    return clone(
      STATE.authentication_context
    );
  }

  function getRuntimeContext() {
    return clone(
      STATE.runtime_context
    );
  }

  function getRole() {
    return (
      normalizeRole(
        STATE.runtime_context?.role ||
        STATE.authentication_context
          ?.role
      ) || ""
    );
  }

  function getRoleId() {
    return (
      clean(
        STATE.runtime_context?.role_id
      ) || ""
    );
  }

  function getUserId() {
    return (
      clean(
        STATE.runtime_context?.user_id
      ) ||
      clean(
        STATE.authentication_context
          ?.user_id
      ) ||
      ""
    );
  }

  function getSessionId() {
    return (
      clean(
        STATE.runtime_context
          ?.session_id
      ) ||
      clean(
        STATE.authentication_context
          ?.session_id
      ) ||
      ""
    );
  }

  function getRuntimeId() {
    return (
      clean(
        STATE.runtime_context
          ?.runtime_id
      ) || ""
    );
  }

  function getSnapshotId() {
    return (
      clean(
        STATE.runtime_context
          ?.active_snapshot_id
      ) ||
      clean(
        STATE.runtime_context
          ?.page_context
          ?.snapshot_id
      ) ||
      ""
    );
  }

  function getAthleteId() {
    return (
      clean(
        STATE.runtime_context
          ?.active_athlete_id
      ) || ""
    );
  }

  function getWorkspaceId() {
    return (
      clean(
        STATE.runtime_context
          ?.active_workspace_id
      ) || ""
    );
  }

  function getOrganizationId() {
    return (
      clean(
        STATE.runtime_context
          ?.organization_id
      ) || ""
    );
  }

  function getCredentialStatus() {
    return clean(
      STATE.runtime_context
        ?.credential_status
    ).toLowerCase();
  }

  function getTrustClassification() {
    return clean(
      STATE.runtime_context
        ?.trust_classification
    ).toLowerCase();
  }

  function getEntryIntent() {
    return (
      clean(
        STATE.authentication_context
          ?.entry_intent
      ) || ""
    );
  }

  function getBaselineCapabilities(
    role = getRole()
  ) {
    return clone(
      BASELINE_CAPABILITIES[
        normalizeRole(role)
      ] || {}
    );
  }

  function hasBaselineCapability(
    capability,
    role = getRole()
  ) {
    const normalizedCapability =
      clean(capability);

    if (!normalizedCapability) {
      return false;
    }

    return (
      BASELINE_CAPABILITIES[
        normalizeRole(role)
      ]?.[normalizedCapability] ===
      true
    );
  }

  function parseDestination(
    destination
  ) {
    const raw = clean(destination);

    if (!raw) {
      return {
        valid: false,
        error:
          "Destination is empty."
      };
    }

    const lowered =
      raw.toLowerCase();

    if (
      lowered.startsWith(
        "javascript:"
      ) ||
      lowered.startsWith("data:") ||
      lowered.startsWith(
        "vbscript:"
      )
    ) {
      return {
        valid: false,
        error:
          "Executable destination schemes are prohibited."
      };
    }

    let url;

    try {
      url = new URL(
        raw,
        window.location.href
      );
    } catch (_) {
      return {
        valid: false,
        error:
          "Destination is not a valid URL."
      };
    }

    if (
      url.origin !==
      window.location.origin
    ) {
      return {
        valid: false,
        error:
          "Cross-origin access evaluation is prohibited."
      };
    }

    const page =
      url.pathname
        .split("/")
        .filter(Boolean)
        .pop() ||
      "index.html";

    return {
      valid: true,
      url,
      page
    };
  }

  function normalizeDestination(
    destination
  ) {
    const parsed =
      parseDestination(destination);

    if (!parsed.valid) {
      return {
        valid: false,
        error: parsed.error,
        normalized: null,
        page: null
      };
    }

    const orderedEntries = [
      ...parsed.url
        .searchParams
        .entries()
    ].sort(
      (
        [leftKey, leftValue],
        [rightKey, rightValue]
      ) => {
        const keyComparison =
          leftKey.localeCompare(
            rightKey
          );

        if (keyComparison !== 0) {
          return keyComparison;
        }

        return leftValue.localeCompare(
          rightValue
        );
      }
    );

    const normalizedParams =
      new URLSearchParams();

    orderedEntries.forEach(
      ([key, value]) => {
        normalizedParams.append(
          key,
          value
        );
      }
    );

    const query =
      normalizedParams.toString();

    return {
      valid: true,
      page: parsed.page,

      normalized:
        parsed.page +
        (
          query
            ? `?${query}`
            : ""
        ) +
        parsed.url.hash
    };
  }

  function destinationsMatch(
    leftDestination,
    rightDestination
  ) {
    const left =
      normalizeDestination(
        leftDestination
      );

    const right =
      normalizeDestination(
        rightDestination
      );

    return (
      left.valid &&
      right.valid &&
      left.normalized ===
        right.normalized
    );
  }

  /*
  ========================================================
  TRUSTED SNAPSHOT INTAKE LIFECYCLE
  ========================================================

  FIRST_TIME_ATHLETE_INTAKE is established only when:

  - authenticated role is athlete;
  - Authentication Context entry_intent equals the approved
    FIRST_TIME_ATHLETE_INTAKE enumeration; and
  - the requested destination being evaluated exactly matches
    Authentication Context requested_destination.

  URL new=1 is not used as lifecycle authority.

  All other Snapshot Intake access defaults to governed
  returning-athlete maintenance and therefore requires existing
  runtime_id, snapshot_id, and athlete_id.
  ========================================================
  */

  async function resolveSnapshotIntakeLifecycle(
    destination
  ) {
    const authenticatedContext =
      getAuthenticationContext();

    const normalizedDestination =
      normalizeDestination(
        destination
      );

    if (!normalizedDestination.valid) {
      return {
        valid: false,
        status:
          "SNAPSHOT_INTAKE_DESTINATION_INVALID",
        errors: [
          normalizedDestination.error
        ]
      };
    }

    const firstTimeFromAuthentication =
      getRole() === "athlete" &&
      getEntryIntent() ===
        ENTRY_INTENTS
          .FIRST_TIME_ATHLETE_INTAKE &&
      destinationsMatch(
        normalizedDestination
          .normalized,
        authenticatedContext
          ?.requested_destination
      );

    if (firstTimeFromAuthentication) {
      const lifecycle = {
        valid: true,
        lifecycle_intent:
          ENTRY_INTENTS
            .FIRST_TIME_ATHLETE_INTAKE,

        lifecycle_authority:
          "STREAM_1_AUTHENTICATION_CONTEXT",

        policy: {
          mode: "BASELINE",

          capability:
            "enter_first_time_snapshot_intake",

          allowed_roles: [
            "athlete"
          ],

          requires_role_id: false,

          required_resource_bindings: [
            "runtime_id"
          ]
        }
      };

      STATE.last_lifecycle_context =
        clone(lifecycle);

      STATE.updated_at = nowISO();
      publishState();

      return lifecycle;
    }

    if (
      typeof CONFIGURATION
        .lifecycleContextResolver ===
      "function"
    ) {
      let resolvedLifecycle;

      try {
        resolvedLifecycle =
          await CONFIGURATION
            .lifecycleContextResolver({
              destination:
                normalizedDestination
                  .normalized,

              page:
                normalizedDestination
                  .page,

              authentication_context:
                getAuthenticationContext(),

              runtime_context:
                getRuntimeContext()
            });
      } catch (error) {
        return {
          valid: false,
          status:
            "LIFECYCLE_CONTEXT_RESOLVER_EXCEPTION",
          errors: [
            "The governed lifecycle resolver raised an exception."
          ],
          error
        };
      }

      if (
        clean(
          resolvedLifecycle
            ?.lifecycle_intent
        ) ===
          ENTRY_INTENTS
            .FIRST_TIME_ATHLETE_INTAKE
      ) {
        return {
          valid: false,
          status:
            "LIFECYCLE_AUTHORITY_INVALID",

          errors: [
            "FIRST_TIME_ATHLETE_INTAKE may only be established by the accepted Authentication Context."
          ]
        };
      }

      if (
        clean(
          resolvedLifecycle
            ?.lifecycle_intent
        ) ===
          ENTRY_INTENTS
            .RETURNING_ATHLETE_MAINTENANCE
      ) {
        const lifecycle = {
          valid: true,

          lifecycle_intent:
            ENTRY_INTENTS
              .RETURNING_ATHLETE_MAINTENANCE,

          lifecycle_authority:
            clean(
              resolvedLifecycle
                .authority_id
            ) ||
            "GOVERNED_LIFECYCLE_AUTHORITY",

          policy: {
            mode:
              "GOVERNED_RESOURCE",

            capability:
              "maintain_snapshot_intake",

            allowed_roles: [
              "athlete"
            ],

            requires_role_id: false,

            required_resource_bindings: [
              "runtime_id",
              "snapshot_id",
              "athlete_id"
            ]
          }
        };

        STATE.last_lifecycle_context =
          clone(lifecycle);

        STATE.updated_at = nowISO();
        publishState();

        return lifecycle;
      }
    }

    const maintenanceLifecycle = {
      valid: true,

      lifecycle_intent:
        ENTRY_INTENTS
          .RETURNING_ATHLETE_MAINTENANCE,

      lifecycle_authority:
        "ACCESS_AUTHORITY_SAFE_DEFAULT",

      policy: {
        mode:
          "GOVERNED_RESOURCE",

        capability:
          "maintain_snapshot_intake",

        allowed_roles: [
          "athlete"
        ],

        requires_role_id: false,

        required_resource_bindings: [
          "runtime_id",
          "snapshot_id",
          "athlete_id"
        ]
      }
    };

    STATE.last_lifecycle_context =
      clone(
        maintenanceLifecycle
      );

    STATE.updated_at = nowISO();
    publishState();

    return maintenanceLifecycle;
  }

  function validatePolicyShape(
    policy,
    page
  ) {
    const errors = [];

    if (
      !policy ||
      typeof policy !== "object" ||
      Array.isArray(policy)
    ) {
      return {
        valid: false,
        errors: [
          "Destination policy is unavailable or invalid."
        ]
      };
    }

    if (
      !SUPPORTED_POLICY_MODES.includes(
        policy.mode
      )
    ) {
      errors.push(
        `Unsupported destination policy mode: ${policy.mode}`
      );
    }

    const protectedRoute =
      !isPublicRoute(page);

    if (
      protectedRoute &&
      policy.mode === "PUBLIC"
    ) {
      errors.push(
        "A protected destination may not be downgraded to PUBLIC."
      );
    }

    if (policy.mode !== "PUBLIC") {
      if (
        !clean(policy.capability) ||
        !KNOWN_CAPABILITIES.includes(
          clean(policy.capability)
        )
      ) {
        errors.push(
          "Protected destination policy requires a recognized capability."
        );
      }

      if (
        !Array.isArray(
          policy.allowed_roles
        ) ||
        policy.allowed_roles
          .length === 0
      ) {
        errors.push(
          "Protected destination policy requires explicit allowed_roles."
        );
      } else {
        policy.allowed_roles
          .forEach(role => {
            if (
              !isKnownRole(role)
            ) {
              errors.push(
                `Destination policy contains unsupported role: ${role}`
              );
            }
          });
      }
    }

    if (
      typeof policy
        .requires_role_id !==
      "boolean"
    ) {
      errors.push(
        "Destination policy requires an explicit requires_role_id boolean."
      );
    }

    if (
      !Array.isArray(
        policy
          .required_resource_bindings
      )
    ) {
      errors.push(
        "Destination policy requires required_resource_bindings."
      );
    } else {
      policy
        .required_resource_bindings
        .forEach(field => {
          if (
            !RESOURCE_BINDING_FIELDS
              .includes(field)
          ) {
            errors.push(
              `Unsupported resource binding field: ${field}`
            );
          }
        });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function applyRestrictivePolicyExtension(
    corePolicy,
    extension,
    page
  ) {
    if (!extension) {
      return clone(corePolicy);
    }

    const extensionValidation =
      validatePolicyShape(
        extension,
        page
      );

    if (!extensionValidation.valid) {
      throw new Error(
        `Resolved destination policy is invalid: ${extensionValidation.errors.join(
          " "
        )}`
      );
    }

    if (!corePolicy) {
      return clone(extension);
    }

    if (
      corePolicy.mode !== "PUBLIC" &&
      extension.mode === "PUBLIC"
    ) {
      throw new Error(
        "A protected core policy may not be downgraded to PUBLIC."
      );
    }

    if (
      clean(extension.capability) !==
      clean(corePolicy.capability)
    ) {
      throw new Error(
        "A core destination capability may not be replaced."
      );
    }

    const coreRoles =
      new Set(
        corePolicy.allowed_roles
          .map(normalizeRole)
      );

    const extensionRoles =
      extension.allowed_roles
        .map(normalizeRole);

    if (
      extensionRoles.some(
        role =>
          !coreRoles.has(role)
      )
    ) {
      throw new Error(
        "A resolved destination policy may not expand core allowed roles."
      );
    }

    if (
      corePolicy
        .requires_role_id === true &&
      extension
        .requires_role_id !== true
    ) {
      throw new Error(
        "A resolved destination policy may not remove a core role_id requirement."
      );
    }

    const coreBindings =
      new Set(
        corePolicy
          .required_resource_bindings
      );

    const extensionBindings =
      new Set(
        extension
          .required_resource_bindings
      );

    if (
      [...coreBindings].some(
        field =>
          !extensionBindings.has(
            field
          )
      )
    ) {
      throw new Error(
        "A resolved destination policy may not remove core resource bindings."
      );
    }

    return {
      mode: extension.mode,

      capability:
        corePolicy.capability,

      allowed_roles:
        extensionRoles,

      requires_role_id:
        corePolicy
          .requires_role_id ||
        extension
          .requires_role_id,

      required_resource_bindings:
        [...extensionBindings]
    };
  }

  async function resolveDestinationPolicy(
    destination
  ) {
    const normalized =
      normalizeDestination(
        destination
      );

    if (!normalized.valid) {
      return {
        valid: false,
        errors: [
          normalized.error
        ],
        policy: null
      };
    }

    let corePolicy = null;

    if (
      normalized.page ===
      "snapshot-intake.html"
    ) {
      const lifecycleResult =
        await resolveSnapshotIntakeLifecycle(
          normalized.normalized
        );

      if (
        !lifecycleResult.valid
      ) {
        return {
          valid: false,
          errors:
            clone(
              lifecycleResult.errors ||
              [
                lifecycleResult.status
              ]
            ),
          policy: null
        };
      }

      corePolicy =
        clone(
          lifecycleResult.policy
        );
    } else {
      corePolicy =
        clone(
          CORE_DESTINATION_POLICIES[
            normalized.page
          ] || null
        );
    }

    let extension = null;

    if (
      typeof CONFIGURATION
        .destinationPolicyResolver ===
      "function"
    ) {
      try {
        extension =
          await CONFIGURATION
            .destinationPolicyResolver({
              destination:
                normalized.normalized,

              page:
                normalized.page,

              core_policy:
                clone(corePolicy),

              lifecycle_context:
                clone(
                  STATE
                    .last_lifecycle_context
                ),

              authentication_context:
                getAuthenticationContext(),

              runtime_context:
                getRuntimeContext()
            });
      } catch (error) {
        return {
          valid: false,
          errors: [
            "The destination policy resolver raised an exception."
          ],
          error,
          policy: null
        };
      }
    }

    if (!corePolicy && !extension) {
      return {
        valid: false,
        errors: [
          "No governed destination policy is registered."
        ],
        policy: null
      };
    }

    try {
      const resolvedPolicy =
        applyRestrictivePolicyExtension(
          corePolicy,
          extension,
          normalized.page
        );

      const validation =
        validatePolicyShape(
          resolvedPolicy,
          normalized.page
        );

      if (!validation.valid) {
        return {
          valid: false,
          errors:
            validation.errors,
          policy: null
        };
      }

      return {
        valid: true,
        errors: [],
        policy:
          resolvedPolicy
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          error.message
        ],
        error,
        policy: null
      };
    }
  }

  function getActiveResourceBindings() {
    return {
      runtime_id:
        getRuntimeId() || null,

      role_id:
        getRoleId() || null,

      workspace_id:
        getWorkspaceId() || null,

      snapshot_id:
        getSnapshotId() || null,

      athlete_id:
        getAthleteId() || null,

      organization_id:
        getOrganizationId() ||
        null
    };
  }

  /*
  ========================================================
  ACTIVE CONTEXT BINDING ENFORCEMENT
  ========================================================

  This validation applies to every non-public destination,
  including BASELINE destinations.

  It prevents approval when a destination declares required
  Runtime Context bindings that have not yet been established.
  ========================================================
  */

  function validateRequiredActiveBindings(
    policy
  ) {
    const errors = [];

    const activeBindings =
      getActiveResourceBindings();

    const requiredBindings =
      Array.isArray(
        policy
          ?.required_resource_bindings
      )
        ? policy
            .required_resource_bindings
        : [];

    requiredBindings.forEach(
      field => {
        if (
          !clean(
            activeBindings[field]
          )
        ) {
          errors.push(
            `Active Runtime Context is missing required resource binding: ${field}`
          );
        }
      }
    );

    return {
      valid:
        errors.length === 0,

      errors,

      active_bindings:
        clone(activeBindings),

      required_bindings:
        clone(requiredBindings)
    };
  }

  function buildResourceContext(
    request = {}
  ) {
    const normalized =
      normalizeDestination(
        request.destination
      );

    return {
      destination:
        normalized.valid
          ? normalized.normalized
          : clean(
              request.destination
            ),

      page:
        normalized.valid
          ? normalized.page
          : null,

      runtime_id:
        getRuntimeId() ||
        null,

      session_id:
        getSessionId() ||
        null,

      user_id:
        getUserId() ||
        null,

      role:
        getRole() ||
        null,

      role_id:
        getRoleId() ||
        null,

      workspace_id:
        getWorkspaceId() ||
        null,

      snapshot_id:
        getSnapshotId() ||
        null,

      athlete_id:
        getAthleteId() ||
        null,

      organization_id:
        getOrganizationId() ||
        null,

      credential_status:
        getCredentialStatus() ||
        null,

      trust_classification:
        getTrustClassification() ||
        null,

      permission_set:
        clone(
          STATE.runtime_context
            ?.permission_set ||
          null
        ),

      assigned_population_context:
        clone(
          STATE.runtime_context
            ?.assigned_population_context ||
          null
        ),

      requested_resource_context:
        clone(
          request.resource_context ||
          null
        ),

      lifecycle_context:
        clone(
          STATE
            .last_lifecycle_context
        ),

      established_at:
        nowISO()
    };
  }

  function validateConstraintDecision(
    decision,
    destination,
    policy
  ) {
    const errors = [];

    if (
      !decision ||
      typeof decision !== "object" ||
      Array.isArray(decision)
    ) {
      return {
        valid: false,
        allowed: false,
        errors: [
          "Governing authority returned no valid constraint decision."
        ]
      };
    }

    REQUIRED_CONSTRAINT_FIELDS
      .forEach(field => {
        if (field === "allowed") {
          if (
            typeof decision.allowed !==
            "boolean"
          ) {
            errors.push(
              "Constraint decision allowed must be boolean."
            );
          }

          return;
        }

        if (
          field ===
          "resource_bindings"
        ) {
          if (
            !decision
              .resource_bindings ||
            typeof decision
              .resource_bindings !==
              "object" ||
            Array.isArray(
              decision
                .resource_bindings
            )
          ) {
            errors.push(
              "Constraint decision resource_bindings must be an object."
            );
          }

          return;
        }

        if (
          clean(
            decision[field]
          ) === ""
        ) {
          errors.push(
            `Constraint decision is missing required field: ${field}`
          );
        }
      });

    const requestedDestination =
      normalizeDestination(
        destination
      );

    const decidedDestination =
      normalizeDestination(
        decision.destination
      );

    if (
      !requestedDestination.valid
    ) {
      errors.push(
        "Requested destination is invalid."
      );
    }

    if (
      !decidedDestination.valid
    ) {
      errors.push(
        "Constraint decision destination is invalid."
      );
    }

    if (
      requestedDestination.valid &&
      decidedDestination.valid &&
      requestedDestination
        .normalized !==
        decidedDestination
          .normalized
    ) {
      errors.push(
        "Constraint decision destination does not match the requested destination."
      );
    }

    if (
      clean(decision.user_id) !==
      getUserId()
    ) {
      errors.push(
        "Constraint decision user_id does not match the authenticated user."
      );
    }

    if (
      clean(decision.session_id) !==
      getSessionId()
    ) {
      errors.push(
        "Constraint decision session_id does not match the authenticated session."
      );
    }

    const decidedAt =
      Date.parse(
        decision.decided_at
      );

    const expiresAt =
      Date.parse(
        decision.expires_at
      );

    const currentTime =
      Date.now();

    if (
      Number.isNaN(decidedAt)
    ) {
      errors.push(
        "Constraint decision decided_at is invalid."
      );
    }

    if (
      Number.isNaN(expiresAt)
    ) {
      errors.push(
        "Constraint decision expires_at is invalid."
      );
    }

    if (
      !Number.isNaN(decidedAt) &&
      decidedAt >
        currentTime +
          CONFIGURATION
            .maximumClockSkewMs
    ) {
      errors.push(
        "Constraint decision decided_at is unacceptably far in the future."
      );
    }

    if (
      !Number.isNaN(decidedAt) &&
      currentTime - decidedAt >
        CONFIGURATION
          .maximumConstraintDecisionAgeMs
    ) {
      errors.push(
        "Constraint decision exceeds the permitted decision age."
      );
    }

    if (
      !Number.isNaN(expiresAt) &&
      expiresAt <= currentTime
    ) {
      errors.push(
        "Constraint decision has expired."
      );
    }

    if (
      !Number.isNaN(decidedAt) &&
      !Number.isNaN(expiresAt) &&
      expiresAt <= decidedAt
    ) {
      errors.push(
        "Constraint decision expires_at must be later than decided_at."
      );
    }

    const activeBindings =
      getActiveResourceBindings();

    const decisionBindings =
      decision
        .resource_bindings ||
      {};

    const requiredBindings =
      Array.isArray(
        policy
          .required_resource_bindings
      )
        ? policy
            .required_resource_bindings
        : [];

    requiredBindings.forEach(
      field => {
        const activeValue =
          clean(
            activeBindings[field]
          );

        const decisionValue =
          clean(
            decisionBindings[field]
          );

        if (!activeValue) {
          errors.push(
            `Active Runtime Context is missing required resource binding: ${field}`
          );

          return;
        }

        if (!decisionValue) {
          errors.push(
            `Constraint decision is missing required resource binding: ${field}`
          );

          return;
        }

        if (
          decisionValue !==
          activeValue
        ) {
          errors.push(
            `Constraint decision resource binding does not match active context: ${field}`
          );
        }
      }
    );

    return {
      valid:
        errors.length === 0,

      allowed:
        errors.length === 0 &&
        decision.allowed === true,

      errors,

      decision:
        errors.length > 0
          ? null
          : {
              allowed:
                decision.allowed ===
                true,

              authority_id:
                clean(
                  decision
                    .authority_id
                ),

              authority_type:
                clean(
                  decision
                    .authority_type
                ),

              destination:
                decidedDestination
                  .normalized,

              user_id:
                clean(
                  decision.user_id
                ),

              session_id:
                clean(
                  decision
                    .session_id
                ),

              decided_at:
                clean(
                  decision
                    .decided_at
                ),

              expires_at:
                clean(
                  decision
                    .expires_at
                ),

              resource_bindings:
                clone(
                  decision
                    .resource_bindings
                ),

              status:
                clean(
                  decision.status
                ) ||
                (
                  decision.allowed
                    ? "CONSTRAINT_ALLOWED"
                    : "CONSTRAINT_DENIED"
                ),

              reason:
                clean(
                  decision.reason
                ) || null,

              metadata:
                clone(
                  decision.metadata ||
                  {}
                )
            }
    };
  }

  async function resolveConstraintDecision(
    request,
    policy
  ) {
    if (
      typeof CONFIGURATION
        .constraintResolver !==
      "function"
    ) {
      return {
        valid: false,
        allowed: false,
        status:
          "GOVERNING_AUTHORITY_UNAVAILABLE",
        errors: [
          "No governing-authority constraint resolver is configured."
        ]
      };
    }

    let rawDecision;

    try {
      rawDecision =
        await CONFIGURATION
          .constraintResolver({
            destination:
              request.destination,

            page:
              request.page,

            capability:
              policy.capability,

            policy_mode:
              policy.mode,

            requires_role_id:
              policy
                .requires_role_id,

            required_resource_bindings:
              clone(
                policy
                  .required_resource_bindings
              ),

            lifecycle_context:
              clone(
                STATE
                  .last_lifecycle_context
              ),

            authentication_context:
              getAuthenticationContext(),

            runtime_context:
              getRuntimeContext(),

            resource_context:
              buildResourceContext(
                request
              )
          });
    } catch (error) {
      return {
        valid: false,
        allowed: false,
        status:
          "GOVERNING_AUTHORITY_EXCEPTION",
        errors: [
          "The governing-authority constraint resolver raised an exception."
        ],
        error
      };
    }

    const validation =
      validateConstraintDecision(
        rawDecision,
        request.destination,
        policy
      );

    if (!validation.valid) {
      return {
        valid: false,
        allowed: false,
        status:
          "CONSTRAINT_DECISION_INVALID",
        errors:
          clone(
            validation.errors
          )
      };
    }

    STATE.last_constraint_decision =
      clone(
        validation.decision
      );

    STATE.updated_at =
      nowISO();

    publishState();

    return {
      valid: true,
      allowed:
        validation.allowed,

      status:
        validation
          .decision.status,

      decision:
        clone(
          validation.decision
        )
    };
  }

  function buildDecision({
    allowed,
    destination,
    status,
    reason = null,
    policy = null,
    baseline = null,
    active_binding_validation = null,
    constraint = null,
    metadata = null
  }) {
    const normalized =
      normalizeDestination(
        destination
      );

    return {
      allowed:
        allowed === true,

      authority_id:
        AUTHORITY_ID,

      authority_type:
        AUTHORITY_TYPE,

      destination:
        normalized.valid
          ? normalized.normalized
          : clean(destination),

      user_id:
        getUserId(),

      session_id:
        getSessionId(),

      decided_at:
        nowISO(),

      status:
        clean(status) ||
        (
          allowed
            ? "ACCESS_ALLOWED"
            : "ACCESS_DENIED"
        ),

      reason:
        clean(reason) || null,

      role:
        getRole() || null,

      role_id:
        getRoleId() || null,

      runtime_id:
        getRuntimeId() || null,

      workspace_id:
        getWorkspaceId() || null,

      snapshot_id:
        getSnapshotId() || null,

      athlete_id:
        getAthleteId() || null,

      organization_id:
        getOrganizationId() ||
        null,

      resource_bindings:
        getActiveResourceBindings(),

      lifecycle_context:
        clone(
          STATE
            .last_lifecycle_context
        ),

      policy:
        clone(policy),

      baseline:
        clone(baseline),

      active_binding_validation:
        clone(
          active_binding_validation
        ),

      constraint:
        clone(constraint),

      metadata:
        clone(metadata)
    };
  }

  function finalizeDecision(
    eventType,
    decision
  ) {
    STATE.last_decision =
      clone(decision);

    STATE.updated_at =
      nowISO();

    publishState();

    recordAccessEvent(
      eventType,
      {
        destination:
          decision.destination,

        status:
          decision.status,

        reason:
          decision.reason
      }
    );

    emit("decision", {
      decision:
        clone(decision)
    });

    return decision;
  }

  function rejectDecision(
    destination,
    status,
    reason,
    metadata = null
  ) {
    return finalizeDecision(
      "ACCESS_DENIED",
      buildDecision({
        allowed: false,
        destination,
        status,
        reason,
        metadata
      })
    );
  }

  async function decideAccess(
    request = {}
  ) {
    if (
      !STATE.initialized ||
      STATE
        .initialization_status !==
        "INITIALIZED"
    ) {
      return rejectDecision(
        request.destination || "",
        "ACCESS_AUTHORITY_NOT_INITIALIZED",
        "The governed Access Authority is not initialized."
      );
    }

    const destination =
      normalizeDestination(
        request.destination
      );

    if (!destination.valid) {
      return rejectDecision(
        request.destination || "",
        "ACCESS_DESTINATION_INVALID",
        destination.error
      );
    }

    STATE.last_request = {
      destination:
        destination.normalized,

      page:
        destination.page,

      requested_at:
        nowISO()
    };

    STATE.updated_at =
      nowISO();

    publishState();

    const role = getRole();

    if (
      !role ||
      !isKnownRole(role)
    ) {
      return rejectDecision(
        destination.normalized,
        "AUTHENTICATED_ROLE_UNAVAILABLE",
        "Access evaluation requires a supported authenticated role."
      );
    }

    if (
      !getUserId() ||
      !getSessionId()
    ) {
      return rejectDecision(
        destination.normalized,
        "AUTHENTICATED_IDENTITY_INCOMPLETE",
        "Access evaluation requires authenticated user_id and session_id."
      );
    }

    const policyResult =
      await resolveDestinationPolicy(
        destination.normalized
      );

    if (
      !policyResult.valid ||
      !policyResult.policy
    ) {
      return rejectDecision(
        destination.normalized,
        "DESTINATION_POLICY_INVALID",
        "No valid governed destination policy is available.",
        {
          errors:
            clone(
              policyResult.errors ||
              []
            )
        }
      );
    }

    const policy =
      policyResult.policy;

    STATE.last_policy =
      clone(policy);

    STATE.updated_at =
      nowISO();

    publishState();

    if (
      policy
        .requires_role_id === true &&
      isProfessionalRole(role) &&
      !getRoleId()
    ) {
      return rejectDecision(
        destination.normalized,
        "PROFESSIONAL_ROLE_CONTEXT_INCOMPLETE",
        "This destination requires a governed professional role_id."
      );
    }

    if (
      policy.mode === "PUBLIC"
    ) {
      return finalizeDecision(
        "ACCESS_ALLOWED",
        buildDecision({
          allowed: true,

          destination:
            destination.normalized,

          status:
            "PUBLIC_ACCESS_ALLOWED",

          reason:
            "Destination is registered as public.",

          policy
        })
      );
    }

    const allowedRoles =
      policy.allowed_roles
        .map(normalizeRole);

    if (
      !allowedRoles.includes(role)
    ) {
      return rejectDecision(
        destination.normalized,
        "ROLE_NOT_ALLOWED_FOR_DESTINATION",
        "The authenticated role is not included in the destination policy.",
        {
          role,
          allowed_roles:
            allowedRoles
        }
      );
    }

    const capability =
      clean(policy.capability);

    const baselineAllowed =
      hasBaselineCapability(
        capability,
        role
      );

    const baseline = {
      role,
      capability,
      allowed:
        baselineAllowed
    };

    if (!baselineAllowed) {
      return rejectDecision(
        destination.normalized,
        "BASELINE_CAPABILITY_DENIED",
        "The authenticated role does not possess the required baseline capability.",
        baseline
      );
    }

    /*
    Required active bindings are enforced before either BASELINE
    or governed-resource approval.
    */

    const activeBindingValidation =
      validateRequiredActiveBindings(
        policy
      );

    if (
      !activeBindingValidation.valid
    ) {
      return rejectDecision(
        destination.normalized,
        "ACTIVE_RESOURCE_CONTEXT_INCOMPLETE",
        "The destination requires complete governed Runtime Context.",
        {
          errors:
            clone(
              activeBindingValidation
                .errors
            ),

          required_bindings:
            clone(
              activeBindingValidation
                .required_bindings
            ),

          active_bindings:
            clone(
              activeBindingValidation
                .active_bindings
            )
        }
      );
    }

    if (
      policy.mode === "BASELINE"
    ) {
      return finalizeDecision(
        "ACCESS_ALLOWED",
        buildDecision({
          allowed: true,

          destination:
            destination.normalized,

          status:
            "BASELINE_ACCESS_ALLOWED",

          reason:
            "Authenticated role, baseline capability, and required active Runtime Context bindings were satisfied.",

          policy,
          baseline,

          active_binding_validation:
            activeBindingValidation
        })
      );
    }

    if (
      policy.mode !==
        "GOVERNED_RESOURCE" &&
      policy.mode !==
        "ADMIN_GOVERNED"
    ) {
      return rejectDecision(
        destination.normalized,
        "DESTINATION_POLICY_MODE_INVALID",
        "The destination policy contains an unsupported evaluation mode.",
        {
          policy_mode:
            policy.mode
        }
      );
    }

    const constraint =
      await resolveConstraintDecision(
        {
          destination:
            destination.normalized,

          page:
            destination.page,

          resource_context:
            clone(
              request
                .resource_context ||
              null
            )
        },
        policy
      );

    if (!constraint.valid) {
      return rejectDecision(
        destination.normalized,

        constraint.status ||
          "GOVERNING_CONSTRAINT_INVALID",

        "A valid governing-authority constraint decision was not available.",

        {
          errors:
            clone(
              constraint.errors ||
              []
            )
        }
      );
    }

    if (!constraint.allowed) {
      return rejectDecision(
        destination.normalized,

        constraint.status ||
          "GOVERNING_CONSTRAINT_DENIED",

        constraint.decision
          ?.reason ||
          "The governing authority denied access.",

        {
          constraint:
            clone(
              constraint.decision
            )
        }
      );
    }

    return finalizeDecision(
      "ACCESS_ALLOWED",
      buildDecision({
        allowed: true,

        destination:
          destination.normalized,

        status:
          "GOVERNED_ACCESS_ALLOWED",

        reason:
          "Baseline capability, required active Runtime Context bindings, and resource-bound governing constraints were satisfied.",

        policy,
        baseline,

        active_binding_validation:
          activeBindingValidation,

        constraint:
          constraint.decision
      })
    );
  }

  /*
  ========================================================
  AUTHENTICATED SENDER IDENTITY FACTS
  ========================================================
  */

  function getAuthenticatedSenderFacts() {
    if (
      !STATE.initialized ||
      STATE
        .initialization_status !==
        "INITIALIZED"
    ) {
      return {
        valid: false,
        status:
          "ACCESS_AUTHORITY_NOT_INITIALIZED"
      };
    }

    return {
      valid: true,

      status:
        "AUTHENTICATED_SENDER_FACTS_AVAILABLE",

      sender_user_id:
        getUserId() || null,

      sender_role:
        getRole() || null,

      sender_role_id:
        getRoleId() || null,

      sender_workspace_id:
        getWorkspaceId() || null,

      session_id:
        getSessionId() || null,

      runtime_id:
        getRuntimeId() || null,

      athlete_id:
        getAthleteId() || null,

      snapshot_id:
        getSnapshotId() || null,

      credential_status:
        getCredentialStatus() ||
        null,

      trust_classification:
        getTrustClassification() ||
        null,

      identity_locked: true,
      established_at: nowISO()
    };
  }

  function assertSenderIdentity(
    payload = {}
  ) {
    const facts =
      getAuthenticatedSenderFacts();

    if (!facts.valid) {
      return {
        ok: false,
        status: facts.status,
        reason:
          "Authenticated sender facts are unavailable.",
        facts
      };
    }

    const incomingUserId =
      clean(
        payload.sender_user_id ||
        payload.user_id
      );

    const incomingRole =
      normalizeRole(
        payload.sender_role ||
        payload.role
      );

    const incomingRoleId =
      clean(
        payload.sender_role_id ||
        payload.role_id
      );

    const mismatches = [];

    if (
      incomingUserId &&
      incomingUserId !==
        facts.sender_user_id
    ) {
      mismatches.push(
        "sender_user_id"
      );
    }

    if (
      incomingRole &&
      incomingRole !==
        facts.sender_role
    ) {
      mismatches.push(
        "sender_role"
      );
    }

    if (
      incomingRoleId &&
      incomingRoleId !==
        facts.sender_role_id
    ) {
      mismatches.push(
        "sender_role_id"
      );
    }

    if (
      mismatches.length > 0
    ) {
      return {
        ok: false,
        status:
          "SENDER_IDENTITY_MISMATCH",
        reason:
          "Sender identity does not match the authenticated Runtime Context.",
        mismatches,
        facts
      };
    }

    return {
      ok: true,
      status:
        "SENDER_IDENTITY_CONFIRMED",
      reason:
        "Sender identity matches the authenticated Runtime Context.",
      facts
    };
  }

  /*
  ========================================================
  UI PRESENTATION CONTROLS
  ========================================================
  */

  function applyAccessDecisionToElement(
    element,
    decision,
    options = {}
  ) {
    if (!element || !decision) {
      return false;
    }

    const allowed =
      decision.allowed === true;

    if (!allowed) {
      if (
        options.hide !== false
      ) {
        element.hidden = true;
        element.style.display =
          "none";
      }

      if (
        "disabled" in element
      ) {
        element.disabled = true;
      }

      element.setAttribute(
        "aria-disabled",
        "true"
      );

      element.dataset.accessStatus =
        clean(decision.status) ||
        "ACCESS_DENIED";

      return false;
    }

    if (
      options
        .restore_visibility === true
    ) {
      element.hidden = false;

      element.style
        .removeProperty("display");
    }

    if (
      "disabled" in element &&
      options.enable === true
    ) {
      element.disabled = false;

      element.removeAttribute(
        "aria-disabled"
      );
    }

    element.dataset.accessStatus =
      clean(decision.status) ||
      "ACCESS_ALLOWED";

    return true;
  }

  async function applyDestinationControls(
    selector =
      "[data-access-destination]"
  ) {
    const results = [];

    const elements =
      document.querySelectorAll(
        selector
      );

    for (
      const element of elements
    ) {
      const destination =
        clean(
          element.getAttribute(
            "data-access-destination"
          )
        );

      if (!destination) {
        continue;
      }

      const decision =
        await decideAccess({
          destination
        });

      applyAccessDecisionToElement(
        element,
        decision
      );

      results.push({
        destination,
        allowed:
          decision.allowed,
        status:
          decision.status
      });
    }

    return results;
  }

  function createPresentationView(
    record,
    fieldContract = {}
  ) {
    if (
      !record ||
      typeof record !== "object" ||
      Array.isArray(record)
    ) {
      return null;
    }

    const allowedFields =
      Array.isArray(
        fieldContract
          .allowed_fields
      )
        ? new Set(
            fieldContract
              .allowed_fields
              .map(clean)
              .filter(Boolean)
          )
        : null;

    const deniedFields =
      new Set(
        Array.isArray(
          fieldContract
            .denied_fields
        )
          ? fieldContract
              .denied_fields
              .map(clean)
              .filter(Boolean)
          : []
      );

    if (!allowedFields) {
      throw new Error(
        "createPresentationView requires an explicit allowed_fields contract."
      );
    }

    const result = {};

    Object.entries(record)
      .forEach(
        ([key, value]) => {
          if (
            allowedFields.has(key) &&
            !deniedFields.has(key)
          ) {
            result[key] =
              clone(value);
          }
        }
      );

    return result;
  }

  function buildAccessReport() {
    return {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      authority_id:
        AUTHORITY_ID,

      authority_type:
        AUTHORITY_TYPE,

      initialized:
        STATE.initialized,

      initialization_status:
        STATE
          .initialization_status,

      configuration_locked:
        CONFIGURATION_LOCKED,

      runtime_id:
        getRuntimeId() || null,

      session_id:
        getSessionId() || null,

      user_id:
        getUserId() || null,

      role:
        getRole() || null,

      role_label:
        roleName(getRole()),

      role_id:
        getRoleId() || null,

      workspace_id:
        getWorkspaceId() || null,

      snapshot_id:
        getSnapshotId() || null,

      athlete_id:
        getAthleteId() || null,

      organization_id:
        getOrganizationId() ||
        null,

      entry_intent:
        getEntryIntent() || null,

      lifecycle_context:
        clone(
          STATE
            .last_lifecycle_context
        ),

      credential_status:
        getCredentialStatus() ||
        null,

      trust_classification:
        getTrustClassification() ||
        null,

      is_known_role:
        isKnownRole(getRole()),

      is_professional_role:
        isProfessionalRole(
          getRole()
        ),

      baseline_capabilities:
        getBaselineCapabilities(
          getRole()
        ),

      governing_constraint_available:
        typeof CONFIGURATION
          .constraintResolver ===
        "function",

      last_policy:
        clone(
          STATE.last_policy
        ),

      last_decision:
        clone(
          STATE.last_decision
        ),

      generated_at:
        nowISO()
    };
  }

  function runHealthCheck() {
    const authenticationValidation =
      validateAuthenticationContext(
        STATE
          .authentication_context
      );

    const consistencyValidation =
      validateContextConsistency(
        STATE.authentication_context ||
          {},
        STATE.runtime_context
      );

    return {
      ok:
        STATE.initialized ===
          true &&
        STATE
          .initialization_status ===
          "INITIALIZED" &&
        CONFIGURATION_LOCKED ===
          true &&
        authenticationValidation
          .valid &&
        consistencyValidation
          .valid &&
        isKnownRole(getRole()) &&
        !!getUserId() &&
        !!getSessionId(),

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      authority_id:
        AUTHORITY_ID,

      authority_type:
        AUTHORITY_
...

[Message clipped]  View entire message
