/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-routing.js

Asset Type:
JavaScript Infrastructure / Governed Routing Authority

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Governed Routing Authority

Layer:
Enterprise Infrastructure / Governed Routing

Primary Consumers:
- index.html
- register.html
- login.html
- snapshot-intake.html
- parent-approval.html
- athlete-dashboard.html
- player-profile.html
- role-dashboard-intake.html
- role-dashboard.html
- system.html
- all governed route-aware pages

Purpose:
Executes governed navigation and protected-page admission after
authentication, route registration, Page Context, Runtime Context,
and Access Authority have produced the required approved context
or decisions.

Provides:
- Authentication Service destination execution
- mandatory registered-route validation
- governed outbound navigation
- governed current-page admission
- protected-anchor interception
- alternate-browser-context doctrine
- Access Authority enforcement
- explicit current/destination snapshot evaluation
- Page Context establishment
- Runtime Context continuity validation
- snapshot-aware navigation
- Parent Approval navigation
- routing diagnostics
- current-page admission evidence

==========================================================
CONSTITUTIONAL ROUTING PRINCIPLES
==========================================================

1. REGISTERED ROUTE PRINCIPLE

Every governed STATS-CORE destination must be registered.

Registered-route validation is constitutional behavior.

It cannot be disabled by:
- configure()
- init()
- page callers
- navigation options
- downstream streams

Page Map and System Map remain the preferred authoritative
enterprise registration authorities.

CORE_REGISTERED_ROUTES is only a controlled load-order fallback.

Registration does not itself grant access.

----------------------------------------------------------

2. RUNTIME CONTEXT CONTINUITY PRINCIPLE

Authorized URL
        ↓
Page Context
        ↓
Validation
        ↓
Runtime Context
        ↓
Enterprise Operational Authority

An authorized route parameter may initiate Page Context.

Page Context may nominate context for:
- access evaluation
- navigation continuity
- Runtime Context initialization

Page Context does NOT become Runtime Authority merely because a
value appeared in the URL.

----------------------------------------------------------

3. CURRENT PAGE ADMISSION PRINCIPLE

Authenticated Request
        ↓
Registered Current Destination
        ↓
Page Context
        ↓
Governed Access Decision
        ↓
Current Page Admission
        ↓
Business Runtime May Execute

A protected page is not admitted merely because:
- the page exists
- the filename is registered
- snapshot_id is syntactically valid
- Page Context was successfully parsed

Access Authority must affirmatively admit the current destination.

----------------------------------------------------------

4. DESTINATION SNAPSHOT PRINCIPLE

Access Authority receives current and destination snapshots as
separate fields.

current_snapshot_id:
The governed snapshot presently associated with the active page
or Runtime Context.

destination_snapshot_id:
The snapshot explicitly encoded in the normalized destination
being evaluated.

Routing shall never substitute current_snapshot_id for
destination_snapshot_id.

----------------------------------------------------------

5. PROTECTED LINK ACTIVATION PRINCIPLE

There are two constitutionally recognized browser activation modes.

A. PRIMARY SAME-CONTEXT ACTIVATION

Examples:
- normal left-click
- normal tap

Governed sequence:

Protected Anchor
        ↓
Routing.navigate()
        ↓
Registered Destination Validation
        ↓
Access Authority
        ↓
Navigation
        ↓
Current Page Admission
        ↓
Business Runtime

This receives BOTH outbound authorization and arrival admission.

B. ALTERNATE BROWSER-CONTEXT ACTIVATION

Examples:
- Ctrl+click
- Command+click
- middle-click
- Shift+click
- target="_blank"
- browser-created alternate tab/window behavior

STATS-CORE does not replace or emulate browser-native
tab/window behavior after asynchronous authorization because doing
so can break browser gesture semantics and popup controls.

Therefore the constitutional enforcement path is:

Protected Anchor
        ↓
Native Alternate Browser Context
        ↓
Protected Destination Loads
        ↓
Mandatory Registered Route Validation
        ↓
Mandatory Current Page Admission
        ↓
Access Authority
        ↓
Business Runtime Allowed or Blocked

Alternate browser-context navigation therefore relies on the
mandatory ARRIVAL ADMISSION gate.

No protected business runtime may execute before admission.

----------------------------------------------------------

6. SNAPSHOT INTAKE INTENT INVARIANT

First-time athlete:

snapshot-intake.html?new=1

Existing record:

snapshot-intake.html?snapshot_id={id}

These are constitutionally distinct entry intents.

Routing shall never:
- collapse them
- infer one from the other
- manufacture new=1 for maintenance navigation
- combine new=1 with snapshot_id

----------------------------------------------------------

7. PARENT APPROVAL CONTRACT

Approved route:

parent-approval.html?snapshot_id={authorized_snapshot_id}

Stream 1:
- validates route
- preserves snapshot reference
- requests governed Access Authority evaluation
- executes governed navigation
- governs arrival admission

Stream 2:
- owns Parent Approval business runtime
- owns Parent Approval persistence
- owns Parent Approval transaction behavior

----------------------------------------------------------

Does NOT:
- authenticate users
- manufacture session_id
- manufacture user_id
- manufacture role or role_id
- manufacture snapshot_id
- manufacture athlete_id
- determine first-time or returning entry state
- resolve role from URL parameters
- resolve role from browser storage
- create Runtime Context
- convert URL parameters directly into Runtime Authority
- create access policy
- accept caller-manufactured access decisions
- allow registered-route enforcement to be disabled
- allow protected-page admission to be disabled
- allow primary protected-anchor enforcement to be disabled
- expose role_id through ordinary navigation URLs
- create Parent Approval records
- execute Parent Approval persistence
- execute Parent Approval business rules
- calculate intelligence
- modify athlete records
- manufacture governance decisions

Status:
CONTROLLED V3.5 — CONSOLIDATED ROUTING HARDENING

Version:
STATSCORE-ROUTING-V3.5

==========================================================
*/

(function initializeStatsCoreRoutingAuthority() {
  "use strict";

  const ENGINE_ID =
    "statscore-routing";

  const VERSION =
    "STATSCORE-ROUTING-V3.5";

  const OWNER_STREAM =
    "Stream 1 — Public Access, Authentication & Entry Authority";

  const PROFESSIONAL_ROLES =
    Object.freeze([
      "parent",
      "coach",
      "counselor",
      "recruiter",
      "evaluator",
      "program",
      "trainer"
    ]);

  const ALL_ROLES =
    Object.freeze([
      "athlete",
      ...PROFESSIONAL_ROLES,
      "admin"
    ]);

  const PUBLIC_ROUTES =
    Object.freeze([
      "index.html",
      "register.html",
      "login.html",
      "privacy.html",
      "terms.html"
    ]);

  const ROLE_DASHBOARDS =
    Object.freeze({
      athlete:
        "athlete-dashboard.html",

      parent:
        "role-dashboard.html",

      coach:
        "role-dashboard.html",

      counselor:
        "role-dashboard.html",

      recruiter:
        "role-dashboard.html",

      evaluator:
        "role-dashboard.html",

      program:
        "role-dashboard.html",

      trainer:
        "role-dashboard.html",

      admin:
        "system.html"
    });

  /*
  ========================================================
  CONTROLLED ROUTE FALLBACK
  ========================================================

  Page Map and System Map remain authoritative.

  This list exists only as a controlled load-order fallback.
  ========================================================
  */

  const CORE_REGISTERED_ROUTES =
    Object.freeze([
      "index.html",
      "register.html",
      "login.html",
      "privacy.html",
      "terms.html",

      "snapshot-intake.html",
      "parent-approval.html",
      "athlete-dashboard.html",
      "player-profile.html",

      "role-dashboard-intake.html",
      "role-dashboard.html",

      "parent.html",
      "coach.html",
      "counselor.html",
      "recruiter-access.html",
      "evaluator.html",
      "program.html",
      "trainer.html",

      "multi-box.html",
      "system.html",

      "verification-request.html",
      "verification-review.html",

      "verification.html",
      "eligibility.html",
      "readiness.html",
      "college-pathway.html",
      "crystal-registry.html",
      "crystal-report.html"
    ]);

  const ROUTE_FIELDS =
    Object.freeze([
      "page",
      "page_id",
      "filename",
      "file",
      "route",
      "path",
      "url",
      "destination",
      "href"
    ]);

  const ROUTE_CONTAINER_FIELDS =
    Object.freeze([
      "pages",
      "routes",
      "entries",
      "items",
      "children",
      "registry",
      "page_map",
      "system_map"
    ]);

  const REQUIRED_AUTHENTICATION_FIELDS =
    Object.freeze([
      "session_id",
      "user_id",
      "role",
      "entry_intent",
      "authenticated_at",
      "authentication_source",
      "requested_destination"
    ]);

  const REQUIRED_ACCESS_DECISION_FIELDS =
    Object.freeze([
      "allowed",
      "authority_id",
      "authority_type",
      "destination",
      "user_id",
      "session_id",
      "decided_at"
    ]);

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /*
  ========================================================
  CONFIGURATION
  ========================================================

  Constitutional controls do not live here as mutable caller
  switches.

  These are always enforced:
  - registered-route requirement
  - protected-page admission
  - protected-anchor primary activation binding
  ========================================================
  */

  const CONFIGURATION = {
    authenticationContextResolver:
      null,

    runtimeContextResolver:
      null,

    accessDecisionResolver:
      null,

    pageRegistryResolver:
      null,

    systemRegistryResolver:
      null,

    bindNavigationElements:
      true,

    hydrateSnapshotLinks:
      true,

    markActiveNavigation:
      true
  };

  let STATE =
    createDefaultState();

  let NAVIGATION_ELEMENTS_BOUND =
    false;

  let PROTECTED_ANCHORS_BOUND =
    false;

  /*
  ========================================================
  STATE
  ========================================================
  */

  function createDefaultState() {
    return {
      initialized:
        false,

      initialization_status:
        "LOADED",

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      initialized_at:
        null,

      updated_at:
        null,

      authentication_context:
        null,

      page_context:
        null,

      runtime_context:
        null,

      current_page_admission:
        null,

      room_context:
        null,

      registered_routes:
        [],

      last_validation:
        null,

      last_access_decision:
        null,

      last_navigation:
        null,

      navigation_events:
        [],

      errors:
        [],

      warnings:
        []
    };
  }

  /*
  ========================================================
  BASIC UTILITIES
  ========================================================
  */

  function nowISO() {
    return new Date()
      .toISOString();
  }

  function clean(value) {
    return String(
      value ?? ""
    ).trim();
  }

  function clone(value) {
    if (
      value === undefined
    ) {
      return undefined;
    }

    try {
      return structuredClone(
        value
      );
    } catch (_) {
      return JSON.parse(
        JSON.stringify(
          value
        )
      );
    }
  }

  function normalizeRole(value) {
    const role =
      clean(value)
        .toLowerCase();

    if (
      role ===
      "administrator"
    ) {
      return "admin";
    }

    return role;
  }

  function isUuid(value) {
    return UUID_PATTERN.test(
      clean(value)
    );
  }

  function getCurrentPage() {
    const pathname =
      window.location.pathname ||
      "";

    return (
      pathname
        .split("/")
        .filter(Boolean)
        .pop() ||
      "index.html"
    );
  }

  function getCurrentRoute() {
    return (
      getCurrentPage() +
      window.location.search +
      window.location.hash
    );
  }

  function getQueryParam(key) {
    return (
      new URLSearchParams(
        window.location.search
      ).get(key) ||
      ""
    );
  }

  function isPublicRoute(
    page =
      getCurrentPage()
  ) {
    return PUBLIC_ROUTES.includes(
      clean(page)
    );
  }

  function isValidRole(role) {
    return ALL_ROLES.includes(
      normalizeRole(
        role
      )
    );
  }

  function isProfessionalRole(role) {
    return PROFESSIONAL_ROLES.includes(
      normalizeRole(
        role
      )
    );
  }

  function log(
    message,
    payload
  ) {
    console.info(
      `[STATS-CORE Routing] ${message}`,
      payload === undefined
        ? ""
        : payload
    );
  }

  /*
  ========================================================
  STATE PUBLICATION
  ========================================================
  */

  function publishState() {
    const publicState =
      clone(
        STATE
      );

    window.STATScoreRoutingState =
      publicState;

    window.STATScore =
      window.STATScore ||
      {};

    window.STATScore.RoutingState =
      clone(
        publicState
      );

    return publicState;
  }

  function getState() {
    return clone(
      STATE
    );
  }

  function emit(
    eventName,
    payload = {}
  ) {
    const detail = {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      emitted_at:
        nowISO(),

      ...clone(
        payload
      )
    };

    window.dispatchEvent(
      new CustomEvent(
        `statscore:routing:${eventName}`,
        {
          detail
        }
      )
    );

    if (
      window
        .STATScoreEngineBus
        ?.emit
    ) {
      window
        .STATScoreEngineBus
        .emit(
          `routing_${eventName}`,
          detail
        );
    }
  }

  function recordNavigationEvent(
    type,
    payload = {}
  ) {
    const event = {
      navigation_event_id:
        "sc_route_event_" +
        Date.now()
          .toString(36) +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 10),

      event_type:
        clean(type) ||
        "ROUTING_EVENT",

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      payload:
        clone(
          payload
        ),

      created_at:
        nowISO()
    };

    STATE
      .navigation_events
      .push(
        event
      );

    STATE.updated_at =
      nowISO();

    publishState();

    emit(
      "event_recorded",
      {
        navigation_event:
          clone(
            event
          )
      }
    );

    return clone(
      event
    );
  }

  function recordWarning(
    code,
    message,
    payload = null
  ) {
    const warning = {
      code:
        clean(code) ||
        "ROUTING_WARNING",

      message:
        clean(message) ||
        "Routing warning.",

      payload:
        clone(
          payload
        ),

      created_at:
        nowISO()
    };

    STATE
      .warnings
      .push(
        warning
      );

    STATE.updated_at =
      nowISO();

    console.warn(
      `[STATS-CORE Routing] ${warning.code}: ${warning.message}`,
      payload ||
      ""
    );

    publishState();

    emit(
      "warning",
      {
        warning:
          clone(
            warning
          )
      }
    );

    return clone(
      warning
    );
  }

  function recordError(
    code,
    message,
    payload = null
  ) {
    const errorRecord = {
      code:
        clean(code) ||
        "ROUTING_ERROR",

      message:
        clean(message) ||
        "Routing error.",

      payload:
        clone(
          payload
        ),

      created_at:
        nowISO()
    };

    STATE
      .errors
      .push(
        errorRecord
      );

    STATE.updated_at =
      nowISO();

    console.error(
      `[STATS-CORE Routing] ${errorRecord.code}: ${errorRecord.message}`,
      payload ||
      ""
    );

    publishState();

    emit(
      "error",
      {
        error:
          clone(
            errorRecord
          )
      }
    );

    return clone(
      errorRecord
    );
  }

  /*
  ========================================================
  CALLER CONFIGURATION
  ========================================================

  Only non-constitutional behavior may be changed here.

  Registered-route enforcement, protected admission, and
  protected-anchor primary activation enforcement cannot be
  changed by callers.
  ========================================================
  */

  function configure(
    options = {}
  ) {
    const resolverNames = [
      "authenticationContextResolver",
      "runtimeContextResolver",
      "accessDecisionResolver",
      "pageRegistryResolver",
      "systemRegistryResolver"
    ];

    resolverNames.forEach(
      name => {
        if (
          !Object.prototype
            .hasOwnProperty.call(
              options,
              name
            )
        ) {
          return;
        }

        const resolver =
          options[
            name
          ];

        if (
          resolver !== null &&
          typeof resolver !==
            "function"
        ) {
          throw new TypeError(
            `${name} must be a function or null.`
          );
        }

        CONFIGURATION[
          name
        ] =
          resolver;
      }
    );

    const booleanOptions = [
      "bindNavigationElements",
      "hydrateSnapshotLinks",
      "markActiveNavigation"
    ];

    booleanOptions.forEach(
      name => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              options,
              name
            )
        ) {
          CONFIGURATION[
            name
          ] =
            options[
              name
            ] !==
            false;
        }
      }
    );

    const prohibitedOverrides = [
      "requireRegisteredDestination",
      "requireProtectedPageAdmission",
      "bindProtectedAnchors"
    ];

    prohibitedOverrides.forEach(
      name => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              options,
              name
            )
        ) {
          recordWarning(
            "CONSTITUTIONAL_ROUTING_OVERRIDE_IGNORED",
            `${name} is constitutional routing behavior and cannot be changed by caller configuration.`,
            {
              option:
                name
            }
          );
        }
      }
    );

    recordNavigationEvent(
      "ROUTING_CONFIGURATION_UPDATED",
      {
        configuration:
          getConfiguration()
      }
    );

    return getConfiguration();
  }

  function getConfiguration() {
    return {
      has_authentication_context_resolver:
        typeof CONFIGURATION
          .authenticationContextResolver ===
        "function",

      has_runtime_context_resolver:
        typeof CONFIGURATION
          .runtimeContextResolver ===
        "function",

      has_access_decision_resolver:
        typeof CONFIGURATION
          .accessDecisionResolver ===
        "function",

      has_page_registry_resolver:
        typeof CONFIGURATION
          .pageRegistryResolver ===
        "function",

      has_system_registry_resolver:
        typeof CONFIGURATION
          .systemRegistryResolver ===
        "function",

      require_registered_destination:
        true,

      registered_destination_disableable:
        false,

      require_protected_page_admission:
        true,

      protected_page_admission_disableable:
        false,

      bind_protected_anchors:
        true,

      protected_anchor_enforcement_disableable:
        false,

      bind_navigation_elements:
        CONFIGURATION
          .bindNavigationElements,

      hydrate_snapshot_links:
        CONFIGURATION
          .hydrateSnapshotLinks,

      mark_active_navigation:
        CONFIGURATION
          .markActiveNavigation
    };
  }

  /*
  ========================================================
  AUTHENTICATION / RUNTIME CONTEXT RESOLUTION
  ========================================================
  */

  function getAuthenticationContextFromWindow() {
    return (
      window
        .STATSCORE_INITIAL_AUTHENTICATION_CONTEXT ||

      window
        .STATScoreInitialAuthenticationContext ||

      window
        .STATScoreAuthenticationContext ||

      window
        .STATScore
        ?.InitialAuthenticationContext ||

      window
        .STATScore
        ?.AuthenticationContext ||

      null
    );
  }

  function getRuntimeContextFromWindow() {
    const runtimeEngine =
      window
        .STATScoreRuntimeStateEngine ||
      window
        .STATScore
        ?.RuntimeStateEngine ||
      null;

    return (
      runtimeEngine
        ?.getInitialRuntimeContext
        ?.() ||

      runtimeEngine
        ?.getState
        ?.()
        ?.initial_runtime_context ||

      window
        .STATScoreInitialRuntimeContext ||

      window
        .STATScore
        ?.InitialRuntimeContext ||

      null
    );
  }

  async function resolveAuthenticationContext(
    suppliedContext =
      null
  ) {
    if (
      suppliedContext
    ) {
      return clone(
        suppliedContext
      );
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
    suppliedContext =
      null
  ) {
    if (
      suppliedContext
    ) {
      return clone(
        suppliedContext
      );
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
    const errors =
      [];

    if (
      !context ||
      typeof context !==
        "object" ||
      Array.isArray(
        context
      )
    ) {
      return {
        valid:
          false,

        errors: [
          "Initial Authentication Context is unavailable."
        ]
      };
    }

    REQUIRED_AUTHENTICATION_FIELDS
      .forEach(
        field => {
          if (
            clean(
              context[
                field
              ]
            ) ===
            ""
          ) {
            errors.push(
              `Initial Authentication Context is missing required field: ${field}`
            );
          }
        }
      );

    if (
      context.role &&
      !isValidRole(
        context.role
      )
    ) {
      errors.push(
        `Initial Authentication Context contains unsupported role: ${context.role}`
      );
    }

    if (
      context
        .authenticated_at &&
      Number.isNaN(
        Date.parse(
          context
            .authenticated_at
        )
      )
    ) {
      errors.push(
        "Initial Authentication Context authenticated_at is invalid."
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors
    };
  }

  function normalizeAuthenticationContext(
    context
  ) {
    return {
      session_id:
        clean(
          context
            .session_id
        ),

      user_id:
        clean(
          context
            .user_id
        ),

      role:
        normalizeRole(
          context.role
        ),

      entry_intent:
        clean(
          context
            .entry_intent
        ),

      authenticated_at:
        clean(
          context
            .authenticated_at
        ),

      authentication_source:
        clean(
          context
            .authentication_source
        ),

      requested_destination:
        clean(
          context
            .requested_destination
        )
    };
  }

  function normalizeRuntimeContext(
    context
  ) {
    if (
      !context ||
      typeof context !==
        "object" ||
      Array.isArray(
        context
      )
    ) {
      return null;
    }

    return {
      runtime_id:
        clean(
          context
            .runtime_id
        ) ||
        null,

      session_id:
        clean(
          context
            .session_id
        ) ||
        null,

      user_id:
        clean(
          context
            .user_id
        ) ||
        null,

      role:
        normalizeRole(
          context.role
        ) ||
        null,

      role_id:
        clean(
          context
            .role_id
        ) ||
        null,

      entry_intent:
        clean(
          context
            .entry_intent
        ) ||
        null,

      authenticated_at:
        clean(
          context
            .authenticated_at
        ) ||
        null,

      authentication_source:
        clean(
          context
            .authentication_source
        ) ||
        null,

      requested_destination:
        clean(
          context
            .requested_destination
        ) ||
        null,

      page_id:
        clean(
          context
            .page_id
        ) ||
        null,

      page_context:
        clone(
          context
            .page_context ||
          null
        ),

      active_snapshot_id:
        clean(
          context
            .active_snapshot_id
        ) ||
        clean(
          context
            .page_context
            ?.snapshot_id
        ) ||
        null,

      active_athlete_id:
        clean(
          context
            .active_athlete_id
        ) ||
        null,

      active_workspace_id:
        clean(
          context
            .active_workspace_id
        ) ||
        null,

      system_state:
        clean(
          context
            .system_state
        ) ||
        null
    };
  }

  /*
  ========================================================
  PAGE CONTEXT
  ========================================================
  */

  function validateNewIntentValue(
    value
  ) {
    const normalized =
      clean(
        value
      ).toLowerCase();

    if (
      normalized ===
      ""
    ) {
      return {
        valid:
          true,

        active:
          false,

        normalized:
          null
      };
    }

    if (
      normalized ===
        "1" ||
      normalized ===
        "true"
    ) {
      return {
        valid:
          true,

        active:
          true,

        normalized:
          "1"
      };
    }

    return {
      valid:
        false,

      active:
        false,

      normalized
    };
  }

  function derivePageContextFromCurrentRoute() {
    const page =
      getCurrentPage();

    const route =
      getCurrentRoute();

    const query =
      new URLSearchParams(
        window.location.search
      );

    const snapshotValues =
      query.getAll(
        "snapshot_id"
      );

    const newValues =
      query.getAll(
        "new"
      );

    const errors =
      [];

    if (
      snapshotValues.length >
      1
    ) {
      errors.push(
        "Route contains multiple snapshot_id parameters."
      );
    }

    if (
      newValues.length >
      1
    ) {
      errors.push(
        "Route contains multiple new parameters."
      );
    }

    const rawSnapshotId =
      clean(
        snapshotValues[
          0
        ]
      );

    const newIntent =
      validateNewIntentValue(
        newValues[
          0
        ]
      );

    if (
      !newIntent.valid
    ) {
      errors.push(
        "Route parameter new contains an unsupported value."
      );
    }

    if (
      rawSnapshotId &&
      !isUuid(
        rawSnapshotId
      )
    ) {
      errors.push(
        "Route snapshot_id is not a valid UUID."
      );
    }

    if (
      rawSnapshotId &&
      newIntent.active
    ) {
      errors.push(
        "Route cannot simultaneously request new=1 and an existing snapshot_id."
      );
    }

    if (
      newIntent.active &&
      page !==
        "snapshot-intake.html"
    ) {
      errors.push(
        "new=1 is authorized only for snapshot-intake.html."
      );
    }

    const context = {
      page_id:
        page,

      route,

      snapshot_id:
        rawSnapshotId ||
        null,

      new_record:
        newIntent.active,

      source:
        rawSnapshotId ||
        newIntent.active
          ? "ROUTE_PARAMETER"
          : "CURRENT_ROUTE",

      validation_status:
        errors.length ===
          0
          ? (
              rawSnapshotId
                ? "PAGE_CONTEXT_VALID_PENDING_ADMISSION"
                : newIntent.active
                  ? "NEW_ENTRY_INTENT_VALID_PENDING_ADMISSION"
                  : "PAGE_CONTEXT_VALID"
            )
          : "PAGE_CONTEXT_INVALID",

      established_at:
        nowISO()
    };

    return {
      valid:
        errors.length ===
        0,

      errors,

      context
    };
  }

  function validatePageContextAgainstRuntime(
    pageContext,
    runtimeContext
  ) {
    const errors =
      [];

    if (
      !pageContext
    ) {
      return {
        valid:
          true,

        errors
      };
    }

    const pageSnapshotId =
      clean(
        pageContext
          .snapshot_id
      );

    const runtimeSnapshotId =
      clean(
        runtimeContext
          ?.active_snapshot_id
      ) ||
      clean(
        runtimeContext
          ?.page_context
          ?.snapshot_id
      );

    if (
      pageContext
        .new_record ===
        true &&
      runtimeSnapshotId
    ) {
      errors.push(
        "new=1 conflicts with an existing Runtime Context snapshot_id."
      );
    }

    if (
      pageSnapshotId &&
      runtimeSnapshotId &&
      pageSnapshotId !==
        runtimeSnapshotId
    ) {
      errors.push(
        "Page Context snapshot_id does not match Runtime Context snapshot_id."
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors,

      page_snapshot_id:
        pageSnapshotId ||
        null,

      runtime_snapshot_id:
        runtimeSnapshotId ||
        null
    };
  }

  function getPageContext() {
    return clone(
      STATE
        .page_context
    );
  }

  /*
  ========================================================
  CONTEXT ACCESSORS
  ========================================================
  */

  function getRole() {
    return (
      normalizeRole(
        STATE
          .runtime_context
          ?.role ||
        STATE
          .authentication_context
          ?.role
      ) ||
      ""
    );
  }

  function getRoleId() {
    return (
      clean(
        STATE
          .runtime_context
          ?.role_id
      ) ||
      ""
    );
  }

  function getRuntimeSnapshotId() {
    return (
      clean(
        STATE
          .runtime_context
          ?.active_snapshot_id
      ) ||
      clean(
        STATE
          .runtime_context
          ?.page_context
          ?.snapshot_id
      ) ||
      ""
    );
  }

  function getPageSnapshotId() {
    return (
      clean(
        STATE
          .page_context
          ?.snapshot_id
      ) ||
      ""
    );
  }

  function getSnapshotId() {
    return (
      getRuntimeSnapshotId() ||
      getPageSnapshotId() ||
      ""
    );
  }

  function getSnapshotContext() {
    const runtimeSnapshotId =
      getRuntimeSnapshotId();

    if (
      runtimeSnapshotId
    ) {
      return {
        snapshot_id:
          runtimeSnapshotId,

        source:
          "RUNTIME_CONTEXT",

        operational_authority:
          true,

        admitted:
          STATE
            .current_page_admission
            ?.allowed ===
          true
      };
    }

    const pageSnapshotId =
      getPageSnapshotId();

    if (
      pageSnapshotId
    ) {
      return {
        snapshot_id:
          pageSnapshotId,

        source:
          "PAGE_CONTEXT",

        operational_authority:
          false,

        admitted:
          STATE
            .current_page_admission
            ?.allowed ===
          true
      };
    }

    return {
      snapshot_id:
        null,

      source:
        null,

      operational_authority:
        false,

      admitted:
        STATE
          .current_page_admission
          ?.allowed ===
        true
    };
  }

  function getAthleteId() {
    return (
      clean(
        STATE
          .runtime_context
          ?.active_athlete_id
      ) ||
      ""
    );
  }

  function getRuntimeId() {
    return (
      clean(
        STATE
          .runtime_context
          ?.runtime_id
      ) ||
      ""
    );
  }

  function getSessionId() {
    return (
      clean(
        STATE
          .runtime_context
          ?.session_id
      ) ||
      clean(
        STATE
          .authentication_context
          ?.session_id
      ) ||
      ""
    );
  }

  function getUserId() {
    return (
      clean(
        STATE
          .runtime_context
          ?.user_id
      ) ||
      clean(
        STATE
          .authentication_context
          ?.user_id
      ) ||
      ""
    );
  }

  function dashboardForRole(
    role =
      getRole()
  ) {
    const normalized =
      normalizeRole(
        role
      );

    if (
      !isValidRole(
        normalized
      )
    ) {
      return "";
    }

    return (
      ROLE_DASHBOARDS[
        normalized
      ] ||
      ""
    );
  }

  /*
  ========================================================
  DESTINATION NORMALIZATION
  ========================================================
  */

  function parseDestination(
    destination
  ) {
    const raw =
      clean(
        destination
      );

    if (
      !raw
    ) {
      return {
        valid:
          false,

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
      lowered.startsWith(
        "data:"
      ) ||
      lowered.startsWith(
        "vbscript:"
      )
    ) {
      return {
        valid:
          false,

        error:
          "Executable destination schemes are prohibited."
      };
    }

    let url;

    try {
      url =
        new URL(
          raw,
          window.location.href
        );
    } catch (_) {
      return {
        valid:
          false,

        error:
          "Destination is not a valid URL."
      };
    }

    if (
      url.origin !==
      window.location.origin
    ) {
      return {
        valid:
          false,

        error:
          "Cross-origin routing is prohibited."
      };
    }

    const page =
      url.pathname
        .split("/")
        .filter(Boolean)
        .pop() ||
      "index.html";

    return {
      valid:
        true,

      raw,

      url,

      page
    };
  }

  function normalizeDestination(
    destination
  ) {
    const parsed =
      parseDestination(
        destination
      );

    if (
      !parsed.valid
    ) {
      return {
        valid:
          false,

        error:
          parsed.error,

        normalized:
          null,

        page:
          null,

        url:
          null
      };
    }

    const orderedEntries = [
      ...parsed
        .url
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

        if (
          keyComparison !==
          0
        ) {
          return keyComparison;
        }

        return leftValue
          .localeCompare(
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
      normalizedParams
        .toString();

    const normalized =
      parsed.page +
      (
        query
          ? `?${query}`
          : ""
      ) +
      parsed.url.hash;

    return {
      valid:
        true,

      normalized,

      page:
        parsed.page,

      url:
        new URL(
          normalized,
          window.location.href
        )
    };
  }

  function appendParams(
    destination,
    params = {}
  ) {
    const parsed =
      parseDestination(
        destination
      );

    if (
      !parsed.valid
    ) {
      throw new Error(
        parsed.error
      );
    }

    Object
      .entries(
        params
      )
      .forEach(
        ([key, value]) => {
          if (
            value ===
              undefined ||
            value ===
              null ||
            clean(
              value
            ) ===
              ""
          ) {
            return;
          }

          parsed
            .url
            .searchParams
            .set(
              key,
              String(
                value
              )
            );
        }
      );

    return normalizeDestination(
      parsed
        .url
        .href
    ).normalized;
  }

  function removeParams(
    destination,
    keys = []
  ) {
    const parsed =
      parseDestination(
        destination
      );

    if (
      !parsed.valid
    ) {
      throw new Error(
        parsed.error
      );
    }

    keys.forEach(
      key => {
        parsed
          .url
          .searchParams
          .delete(
            key
          );
      }
    );

    return normalizeDestination(
      parsed
        .url
        .href
    ).normalized;
  }

  function withSnapshot(
    destination,
    snapshotId =
      getSnapshotId()
  ) {
    const normalizedSnapshotId =
      clean(
        snapshotId
      );

    if (
      !normalizedSnapshotId
    ) {
      return destination;
    }

    if (
      !isUuid(
        normalizedSnapshotId
      )
    ) {
      throw new Error(
        "snapshot_id must be a valid UUID."
      );
    }

    return appendParams(
      destination,
      {
        snapshot_id:
          normalizedSnapshotId
      }
    );
  }

  function withRuntimeContext(
    destination,
    options = {}
  ) {
    const params =
      {};

    if (
      options
        .include_snapshot !==
      false
    ) {
      const snapshotId =
        clean(
          options
            .snapshot_id
        ) ||
        getSnapshotId();

      if (
        snapshotId
      ) {
        if (
          !isUuid(
            snapshotId
          )
        ) {
          throw new Error(
            "snapshot_id must be a valid UUID."
          );
        }

        params.snapshot_id =
          snapshotId;
      }
    }

    if (
      clean(
        options.from
      )
    ) {
      params.from =
        clean(
          options.from
        );
    }

    if (
      clean(
        options.next
      )
    ) {
      params.next =
        clean(
          options.next
        );
    }

    return appendParams(
      destination,
      params
    );
  }

  /*
  ========================================================
  DESTINATION SNAPSHOT EXTRACTION
  ========================================================
  */

  function extractDestinationSnapshot(
    normalizedDestination
  ) {
    if (
      !normalizedDestination ||
      normalizedDestination.valid !==
        true ||
      !normalizedDestination.url
    ) {
      return {
        valid:
          false,

        snapshot_id:
          null,

        present:
          false,

        error:
          "Normalized destination is unavailable."
      };
    }

    const values =
      normalizedDestination
        .url
        .searchParams
        .getAll(
          "snapshot_id"
        );

    if (
      values.length >
      1
    ) {
      return {
        valid:
          false,

        snapshot_id:
          null,

        present:
          true,

        error:
          "Destination contains multiple snapshot_id parameters."
      };
    }

    const rawSnapshotId =
      clean(
        values[
          0
        ]
      );

    if (
      !rawSnapshotId
    ) {
      return {
        valid:
          true,

        snapshot_id:
          null,

        present:
          false,

        error:
          null
      };
    }

    if (
      !isUuid(
        rawSnapshotId
      )
    ) {
      return {
        valid:
          false,

        snapshot_id:
          rawSnapshotId,

        present:
          true,

        error:
          "Destination snapshot_id is not a valid UUID."
      };
    }

    return {
      valid:
        true,

      snapshot_id:
        rawSnapshotId,

      present:
        true,

      error:
        null
    };
  }

  /*
  ========================================================
  REGISTERED ROUTE EXTRACTION
  ========================================================
  */

  function extractRoutesFromRegistry(
    registry
  ) {
    const routes =
      new Set();

    const visited =
      new WeakSet();

    function addRoute(value) {
      if (
        typeof value !==
        "string"
      ) {
        return;
      }

      const normalized =
        normalizeDestination(
          value
        );

      if (
        normalized.valid
      ) {
        routes.add(
          normalized.page
        );
      }
    }

    function walkRouteRecord(
      value,
      depth = 0
    ) {
      if (
        value ===
          null ||
        value ===
          undefined ||
        depth >
          6
      ) {
        return;
      }

      if (
        typeof value ===
        "string"
      ) {
        addRoute(
          value
        );

        return;
      }

      if (
        Array.isArray(
          value
        )
      ) {
        value.forEach(
          item => {
            walkRouteRecord(
              item,
              depth + 1
            );
          }
        );

        return;
      }

      if (
        typeof value !==
        "object"
      ) {
        return;
      }

      if (
        visited.has(
          value
        )
      ) {
        return;
      }

      visited.add(
        value
      );

      ROUTE_FIELDS.forEach(
        field => {
          if (
            typeof value[
              field
            ] ===
            "string"
          ) {
            addRoute(
              value[
                field
              ]
            );
          }
        }
      );

      ROUTE_CONTAINER_FIELDS
        .forEach(
          field => {
            const container =
              value[
                field
              ];

            if (
              container &&
              (
                Array.isArray(
                  container
                ) ||
                typeof container ===
                  "object"
              )
            ) {
              walkRouteRecord(
                container,
                depth + 1
              );
            }
          }
        );
    }

    walkRouteRecord(
      registry
    );

    return [
      ...routes
    ];
  }

  async function resolveRegisteredRoutes() {
    const routes =
      new Set(
        CORE_REGISTERED_ROUTES
      );

    const registries =
      [];

    if (
      typeof CONFIGURATION
        .pageRegistryResolver ===
      "function"
    ) {
      try {
        registries.push(
          await CONFIGURATION
            .pageRegistryResolver()
        );
      } catch (error) {
        recordWarning(
          "PAGE_REGISTRY_RESOLUTION_FAILED",
          "The governed Page Map registry could not be resolved.",
          error
        );
      }
    } else {
      registries.push(
        window
          .STATScorePageMap ||
        window
          .STATScore
          ?.PageMap ||
        null
      );
    }

    if (
      typeof CONFIGURATION
        .systemRegistryResolver ===
      "function"
    ) {
      try {
        registries.push(
          await CONFIGURATION
            .systemRegistryResolver()
        );
      } catch (error) {
        recordWarning(
          "SYSTEM_REGISTRY_RESOLUTION_FAILED",
          "The governed System Map registry could not be resolved.",
          error
        );
      }
    } else {
      registries.push(
        window
          .STATScoreSystemMap ||
        window
          .STATScore
          ?.SystemMap ||
        null
      );
    }

    registries.forEach(
      registry => {
        extractRoutesFromRegistry(
          registry
        ).forEach(
          route => {
            routes.add(
              route
            );
          }
        );
      }
    );

    STATE.registered_routes =
      [
        ...routes
      ].sort();

    STATE.updated_at =
      nowISO();

    publishState();

    return clone(
      STATE
        .registered_routes
    );
  }

  function isRegisteredRoute(
    destination
  ) {
    const normalized =
      normalizeDestination(
        destination
      );

    if (
      !normalized.valid
    ) {
      return false;
    }

    return STATE
      .registered_routes
      .includes(
        normalized.page
      );
  }

  /*
  ========================================================
  AUTHENTICATION DESTINATION VALIDATION
  ========================================================
  */

  function validateAuthenticationDestination(
    destination
  ) {
    const requestedDestination =
      STATE
        .authentication_context
        ?.requested_destination;

    const supplied =
      normalizeDestination(
        destination
      );

    const authorized =
      normalizeDestination(
        requestedDestination
      );

    if (
      !supplied.valid
    ) {
      return {
        valid:
          false,

        status:
          "AUTHENTICATION_DESTINATION_INVALID",

        error:
          supplied.error
      };
    }

    if (
      !authorized.valid
    ) {
      return {
        valid:
          false,

        status:
          "AUTHORIZED_DESTINATION_INVALID",

        error:
          authorized.error
      };
    }

    if (
      supplied.normalized !==
      authorized.normalized
    ) {
      return {
        valid:
          false,

        status:
          "AUTHENTICATION_DESTINATION_MISMATCH",

        supplied_destination:
          supplied
            .normalized,

        authorized_destination:
          authorized
            .normalized
      };
    }

    if (
      !STATE
        .registered_routes
        .includes(
          authorized.page
        )
    ) {
      return {
        valid:
          false,

        status:
          "AUTHORIZED_DESTINATION_NOT_REGISTERED",

        authorized_destination:
          authorized
            .normalized,

        page:
          authorized.page
      };
    }

    return {
      valid:
        true,

      status:
        "AUTHENTICATION_DESTINATION_CONFIRMED",

      destination:
        authorized
          .normalized,

      page:
        authorized.page,

      authority_id:
        "STREAM_1_AUTHENTICATION_SERVICE"
    };
  }

  /*
  ========================================================
  ACCESS DECISION CONTRACT
  ========================================================
  */

  function validateAccessDecision(
    decision,
    destination
  ) {
    const errors =
      [];

    if (
      !decision ||
      typeof decision !==
        "object" ||
      Array.isArray(
        decision
      )
    ) {
      return {
        valid:
          false,

        allowed:
          false,

        errors: [
          "Governed Access Authority returned no valid decision object."
        ]
      };
    }

    REQUIRED_ACCESS_DECISION_FIELDS
      .forEach(
        field => {
          if (
            field ===
            "allowed"
          ) {
            if (
              typeof decision
                .allowed !==
              "boolean"
            ) {
              errors.push(
                "Access decision allowed must be boolean."
              );
            }

            return;
          }

          if (
            clean(
              decision[
                field
              ]
            ) ===
            ""
          ) {
            errors.push(
              `Access decision is missing required field: ${field}`
            );
          }
        }
      );

    const requestedDestination =
      normalizeDestination(
        destination
      );

    const decidedDestination =
      normalizeDestination(
        decision
          .destination
      );

    if (
      !requestedDestination
        .valid
    ) {
      errors.push(
        "Requested destination is invalid."
      );
    }

    if (
      !decidedDestination
        .valid
    ) {
      errors.push(
        "Access decision destination is invalid."
      );
    }

    if (
      requestedDestination
        .valid &&
      decidedDestination
        .valid &&
      requestedDestination
        .normalized !==
        decidedDestination
          .normalized
    ) {
      errors.push(
        "Access decision destination does not match the requested destination."
      );
    }

    if (
      clean(
        decision
          .user_id
      ) !==
      getUserId()
    ) {
      errors.push(
        "Access decision user_id does not match the active authenticated user."
      );
    }

    if (
      clean(
        decision
          .session_id
      ) !==
      getSessionId()
    ) {
      errors.push(
        "Access decision session_id does not match the active authenticated session."
      );
    }

    if (
      decision
        .decided_at &&
      Number.isNaN(
        Date.parse(
          decision
            .decided_at
        )
      )
    ) {
      errors.push(
        "Access decision decided_at is invalid."
      );
    }

    return {
      valid:
        errors.length ===
        0,

      allowed:
        errors.length ===
          0 &&
        decision.allowed ===
          true,

      errors,

      decision:
        errors.length
          ? null
          : {
              allowed:
                decision
                  .allowed ===
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
                  decision
                    .user_id
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

              status:
                clean(
                  decision
                    .status
                ) ||
                (
                  decision.allowed
                    ? "ACCESS_ALLOWED"
                    : "ACCESS_DENIED"
                ),

              metadata:
                clone(
                  decision
                    .metadata ||
                  {}
                )
            }
    };
  }

  /*
  ========================================================
  GOVERNED ACCESS EVALUATION
  ========================================================
  */

  async function resolveGovernedAccessDecision(
    destination,
    options = {}
  ) {
    if (
      typeof CONFIGURATION
        .accessDecisionResolver !==
      "function"
    ) {
      return {
        valid:
          false,

        allowed:
          false,

        status:
          "ACCESS_AUTHORITY_UNAVAILABLE",

        errors: [
          "No governed Access Authority resolver is configured."
        ]
      };
    }

    const normalized =
      normalizeDestination(
        destination
      );

    if (
      !normalized.valid
    ) {
      return {
        valid:
          false,

        allowed:
          false,

        status:
          "ACCESS_DESTINATION_INVALID",

        errors: [
          normalized.error
        ]
      };
    }

    /*
    Registered-route validation is unconditional.
    */

    if (
      !STATE
        .registered_routes
        .includes(
          normalized.page
        )
    ) {
      return {
        valid:
          false,

        allowed:
          false,

        status:
          "DESTINATION_NOT_REGISTERED",

        errors: [
          "Destination is not registered."
        ],

        destination:
          normalized
            .normalized,

        page:
          normalized.page
      };
    }

    const destinationSnapshot =
      extractDestinationSnapshot(
        normalized
      );

    if (
      !destinationSnapshot.valid
    ) {
      return {
        valid:
          false,

        allowed:
          false,

        status:
          "DESTINATION_SNAPSHOT_INVALID",

        errors: [
          destinationSnapshot
            .error
        ],

        destination:
          normalized
            .normalized
      };
    }

    const currentSnapshotContext =
      getSnapshotContext();

    const currentSnapshotId =
      clean(
        currentSnapshotContext
          .snapshot_id
      ) ||
      null;

    const destinationSnapshotId =
      destinationSnapshot
        .snapshot_id ||
      null;

    const snapshotTransition =
      currentSnapshotId &&
      destinationSnapshotId
        ? (
            currentSnapshotId ===
              destinationSnapshotId
              ? "SAME_SNAPSHOT"
              : "CROSS_SNAPSHOT_REQUEST"
          )
        : (
            destinationSnapshotId
              ? "DESTINATION_SNAPSHOT_REQUEST"
              : currentSnapshotId
                ? "CURRENT_SNAPSHOT_ONLY"
                : "NO_SNAPSHOT_CONTEXT"
          );

    let rawDecision;

    try {
      rawDecision =
        await CONFIGURATION
          .accessDecisionResolver({
            operation:
              clean(
                options.operation
              ) ||
              "NAVIGATION",

            destination:
              normalized
                .normalized,

            page:
              normalized.page,

            current_page:
              getCurrentPage(),

            authentication_context:
              clone(
                STATE
                  .authentication_context
              ),

            page_context:
              clone(
                STATE
                  .page_context
              ),

            runtime_context:
              clone(
                STATE
                  .runtime_context
              ),

            current_snapshot_id:
              currentSnapshotId,

            current_snapshot_context_source:
              currentSnapshotContext
                .source,

            current_snapshot_runtime_authoritative:
              currentSnapshotContext
                .operational_authority ===
              true,

            destination_snapshot_id:
              destinationSnapshotId,

            destination_snapshot_present:
              destinationSnapshot
                .present ===
              true,

            /*
            Temporary compatibility alias.

            snapshot_id means DESTINATION snapshot in Access
            Authority evaluation.
            */

            snapshot_id:
              destinationSnapshotId,

            snapshot_transition:
              snapshotTransition
          });
    } catch (error) {
      return {
        valid:
          false,

        allowed:
          false,

        status:
          "ACCESS_AUTHORITY_EXCEPTION",

        errors: [
          "The governed Access Authority resolver raised an exception."
        ],

        error
      };
    }

    const validation =
      validateAccessDecision(
        rawDecision,
        normalized
          .normalized
      );

    if (
      !validation.valid
    ) {
      return {
        valid:
          false,

        allowed:
          false,

        status:
          "ACCESS_DECISION_INVALID",

        errors:
          clone(
            validation
              .errors
          )
      };
    }

    STATE.last_access_decision =
      clone({
        ...validation
          .decision,

        current_snapshot_id:
          currentSnapshotId,

        destination_snapshot_id:
          destinationSnapshotId,

        snapshot_transition:
          snapshotTransition
      });

    STATE.updated_at =
      nowISO();

    publishState();

    return {
      valid:
        true,

      allowed:
        validation
          .allowed,

      status:
        validation
          .decision
          .status,

      current_snapshot_id:
        currentSnapshotId,

      destination_snapshot_id:
        destinationSnapshotId,

      snapshot_transition:
        snapshotTransition,

      decision:
        clone(
          STATE
            .last_access_decision
        )
    };
  }

  /*
  ========================================================
  GENERAL DESTINATION VALIDATION
  ========================================================
  */

  async function validateGeneralDestination(
    destination
  ) {
    const normalized =
      normalizeDestination(
        destination
      );

    if (
      !normalized.valid
    ) {
      const result = {
        valid:
          false,

        status:
          "INVALID_DESTINATION",

        destination:
          clean(
            destination
          ),

        error:
          normalized.error
      };

      STATE.last_validation =
        clone(
          result
        );

      publishState();

      return result;
    }

    /*
    Constitutional registered-route gate.
    No caller switch exists.
    */

    if (
      !STATE
        .registered_routes
        .includes(
          normalized.page
        )
    ) {
      const result = {
        valid:
          false,

        status:
          "DESTINATION_NOT_REGISTERED",

        destination:
          normalized
            .normalized,

        page:
          normalized.page
      };

      STATE.last_validation =
        clone(
          result
        );

      publishState();

      return result;
    }

    const destinationSnapshot =
      extractDestinationSnapshot(
        normalized
      );

    if (
      !destinationSnapshot.valid
    ) {
      const result = {
        valid:
          false,

        status:
          "DESTINATION_SNAPSHOT_INVALID",

        destination:
          normalized
            .normalized,

        page:
          normalized.page,

        error:
          destinationSnapshot
            .error
      };

      STATE.last_validation =
        clone(
          result
        );

      publishState();

      return result;
    }

    if (
      isPublicRoute(
        normalized.page
      )
    ) {
      const result = {
        valid:
          true,

        status:
          "PUBLIC_DESTINATION_VALIDATED",

        destination:
          normalized
            .normalized,

        page:
          normalized.page,

        access_decision: {
          allowed:
            true,

          status:
            "PUBLIC_ROUTE_ACCESS"
        }
      };

      STATE.last_validation =
        clone(
          result
        );

      STATE.updated_at =
        nowISO();

      publishState();

      return result;
    }

    const accessResult =
      await resolveGovernedAccessDecision(
        normalized
          .normalized,
        {
          operation:
            "OUTBOUND_NAVIGATION"
        }
      );

    if (
      !accessResult.valid ||
      !accessResult.allowed
    ) {
      const result = {
        valid:
          false,

        status:
          accessResult
            .status ||
          "ACCESS_DENIED",

        destination:
          normalized
            .normalized,

        page:
          normalized.page,

        current_snapshot_id:
          accessResult
            .current_snapshot_id ||
          null,

        destination_snapshot_id:
          accessResult
            .destination_snapshot_id ||
          null,

        access_decision:
          clone(
            accessResult
          )
      };

      STATE.last_validation =
        clone(
          result
        );

      publishState();

      return result;
    }

    const result = {
      valid:
        true,

      status:
        "PROTECTED_DESTINATION_VALIDATED",

      destination:
        normalized
          .normalized,

      page:
        normalized.page,

      current_snapshot_id:
        accessResult
          .current_snapshot_id ||
        null,

      destination_snapshot_id:
        accessResult
          .destination_snapshot_id ||
        null,

      access_decision:
        clone(
          accessResult
            .decision
        )
    };

    STATE.last_validation =
      clone(
        result
      );

    STATE.updated_at =
      nowISO();

    publishState();

    return result;
  }

  /*
  ========================================================
  CURRENT PAGE ADMISSION
  ========================================================
  */

  function getCurrentPageAdmission() {
    return clone(
      STATE
        .current_page_admission
    );
  }

  function hasCurrentPageAdmission() {
    return (
      STATE
        .current_page_admission
        ?.allowed ===
      true
    );
  }

  async function admitCurrentPage() {
    const currentRoute =
      normalizeDestination(
        getCurrentRoute()
      );

    if (
      !currentRoute.valid
    ) {
      const result = {
        allowed:
          false,

        admitted:
          false,

        status:
          "CURRENT_PAGE_DESTINATION_INVALID",

        destination:
          getCurrentRoute(),

        admitted_at:
          null
      };

      STATE.current_page_admission =
        clone(
          result
        );

      publishState();

      return result;
    }

    /*
    Registered route is mandatory.
    */

    if (
      !STATE
        .registered_routes
        .includes(
          currentRoute.page
        )
    ) {
      const result = {
        allowed:
          false,

        admitted:
          false,

        status:
          "CURRENT_PAGE_NOT_REGISTERED",

        destination:
          currentRoute
            .normalized,

        page:
          currentRoute.page,

        admitted_at:
          null
      };

      STATE.current_page_admission =
        clone(
          result
        );

      publishState();

      return result;
    }

    const destinationSnapshot =
      extractDestinationSnapshot(
        currentRoute
      );

    if (
      !destinationSnapshot.valid
    ) {
      const result = {
        allowed:
          false,

        admitted:
          false,

        status:
          "CURRENT_PAGE_SNAPSHOT_INVALID",

        destination:
          currentRoute
            .normalized,

        page:
          currentRoute.page,

        admitted_at:
          null
      };

      STATE.current_page_admission =
        clone(
          result
        );

      publishState();

      return result;
    }

    if (
      isPublicRoute(
        currentRoute.page
      )
    ) {
      const result = {
        allowed:
          true,

        admitted:
          true,

        protected:
          false,

        status:
          "PUBLIC_PAGE_ADMITTED",

        destination:
          currentRoute
            .normalized,

        page:
          currentRoute.page,

        authority_id:
          "STREAM_1_PUBLIC_ROUTE_AUTHORITY",

        admitted_at:
          nowISO()
      };

      STATE.current_page_admission =
        clone(
          result
        );

      STATE.updated_at =
        nowISO();

      publishState();

      emit(
        "current_page_admitted",
        {
          admission:
            clone(
              result
            )
        }
      );

      return result;
    }

    const accessResult =
      await resolveGovernedAccessDecision(
        currentRoute
          .normalized,
        {
          operation:
            "CURRENT_PAGE_ADMISSION"
        }
      );

    if (
      !accessResult.valid ||
      !accessResult.allowed
    ) {
      const result = {
        allowed:
          false,

        admitted:
          false,

        protected:
          true,

        status:
          accessResult
            .status ||
          "CURRENT_PAGE_ACCESS_DENIED",

        destination:
          currentRoute
            .normalized,

        page:
          currentRoute.page,

        current_snapshot_id:
          accessResult
            .current_snapshot_id ||
          null,

        destination_snapshot_id:
          accessResult
            .destination_snapshot_id ||
          null,

        access_decision:
          clone(
            accessResult
          ),

        admitted_at:
          null
      };

      STATE.current_page_admission =
        clone(
          result
        );

      STATE.updated_at =
        nowISO();

      publishState();

      try {
        document
          .documentElement
          .setAttribute(
            "data-statscore-page-admission",
            "denied"
          );
      } catch (_) {}

      recordError(
        "CURRENT_PAGE_ADMISSION_DENIED",
        "The protected current page was not admitted by the governed Access Authority.",
        result
      );

      emit(
        "current_page_admission_denied",
        {
          admission:
            clone(
              result
            )
        }
      );

      return result;
    }

    const result = {
      allowed:
        true,

      admitted:
        true,

      protected:
        true,

      status:
        "PROTECTED_PAGE_ADMITTED",

      destination:
        currentRoute
          .normalized,

      page:
        currentRoute.page,

      current_snapshot_id:
        accessResult
          .current_snapshot_id ||
        null,

      destination_snapshot_id:
        accessResult
          .destination_snapshot_id ||
        null,

      snapshot_transition:
        accessResult
          .snapshot_transition ||
        null,

      page_context:
        clone(
          STATE
            .page_context
        ),

      access_decision:
        clone(
          accessResult
            .decision
        ),

      authority_id:
        clean(
          accessResult
            .decision
            ?.authority_id
        ) ||
        null,

      admitted_at:
        nowISO()
    };

    STATE.current_page_admission =
      clone(
        result
      );

    if (
      STATE.page_context
    ) {
      STATE
        .page_context
        .validation_status =
        "PAGE_CONTEXT_ADMITTED";
    }

    STATE.updated_at =
      nowISO();

    publishState();

    try {
      document
        .documentElement
        .setAttribute(
          "data-statscore-page-admission",
          "admitted"
        );
    } catch (_) {}

    recordNavigationEvent(
      "CURRENT_PAGE_ADMITTED",
      result
    );

    emit(
      "current_page_admitted",
      {
        admission:
          clone(
            result
          )
      }
    );

    return result;
  }

  /*
  ========================================================
  NAVIGATION EXECUTION
  ========================================================
  */

  function executeNavigation(
    destination,
    options = {}
  ) {
    const normalized =
      normalizeDestination(
        destination
      );

    if (
      !normalized.valid
    ) {
      return {
        ok:
          false,

        status:
          "NAVIGATION_DESTINATION_INVALID"
      };
    }

    if (
      !STATE
        .registered_routes
        .includes(
          normalized.page
        )
    ) {
      return {
        ok:
          false,

        status:
          "NAVIGATION_DESTINATION_NOT_REGISTERED"
      };
    }

    const destinationSnapshot =
      extractDestinationSnapshot(
        normalized
      );

    STATE.last_navigation = {
      destination:
        normalized
          .normalized,

      page:
        normalized.page,

      source_page:
        getCurrentPage(),

      current_snapshot_context:
        getSnapshotContext(),

      destination_snapshot_id:
        destinationSnapshot.valid
          ? destinationSnapshot
              .snapshot_id
          : null,

      initiated_at:
        nowISO(),

      replace:
        options
          .replace ===
        true
    };

    STATE.updated_at =
      nowISO();

    publishState();

    recordNavigationEvent(
      "NAVIGATION_APPROVED",
      STATE
        .last_navigation
    );

    emit(
      "navigation_approved",
      {
        destination:
          normalized
            .normalized,

        page:
          normalized.page
      }
    );

    if (
      options
        .replace ===
      true
    ) {
      window.location.replace(
        normalized
          .normalized
      );
    } else {
      window.location.assign(
        normalized
          .normalized
      );
    }

    return {
      ok:
        true,

      status:
        "NAVIGATION_APPROVED",

      destination:
        normalized
          .normalized
    };
  }

  async function navigate(
    destination,
    options = {}
  ) {
    const validation =
      await validateGeneralDestination(
        destination
      );

    if (
      !validation.valid
    ) {
      recordError(
        "NAVIGATION_BLOCKED",
        "The requested navigation was blocked.",
        validation
      );

      emit(
        "navigation_blocked",
        {
          validation:
            clone(
              validation
            )
        }
      );

      return {
        ok:
          false,

        status:
          "NAVIGATION_BLOCKED",

        validation:
          clone(
            validation
          )
      };
    }

    return executeNavigation(
      validation
        .destination,
      {
        replace:
          options
            .replace ===
          true
      }
    );
  }

  /*
  ========================================================
  AUTHENTICATION DESTINATION EXECUTION
  ========================================================
  */

  async function navigateAuthorizedDestination(
    options = {}
  ) {
    const destination =
      STATE
        .authentication_context
        ?.requested_destination;

    if (
      !clean(
        destination
      )
    ) {
      return {
        ok:
          false,

        status:
          "AUTHORIZED_DESTINATION_UNAVAILABLE"
      };
    }

    const validation =
      validateAuthenticationDestination(
        destination
      );

    if (
      !validation.valid
    ) {
      recordError(
        validation.status,
        "Authentication-authorized destination failed validation.",
        validation
      );

      return {
        ok:
          false,

        status:
          validation.status,

        validation:
          clone(
            validation
          )
      };
    }

    recordNavigationEvent(
      "AUTHENTICATION_DESTINATION_CONFIRMED",
      {
        destination:
          validation
            .destination,

        authority_id:
          validation
            .authority_id
      }
    );

    return executeNavigation(
      validation
        .destination,
      {
        replace:
          options
            .replace ===
          true
      }
    );
  }

  /*
  ========================================================
  SNAPSHOT REQUIREMENT
  ========================================================
  */

  function requireSnapshotContext(
    operationName,
    snapshotId
  ) {
    const normalizedSnapshotId =
      clean(
        snapshotId
      ) ||
      getSnapshotId();

    if (
      !normalizedSnapshotId
    ) {
      return {
        ok:
          false,

        status:
          "GOVERNED_SNAPSHOT_CONTEXT_REQUIRED",

        operation:
          operationName
      };
    }

    if (
      !isUuid(
        normalizedSnapshotId
      )
    ) {
      return {
        ok:
          false,

        status:
          "SNAPSHOT_CONTEXT_INVALID",

        operation:
          operationName
      };
    }

    const activeContext =
      getSnapshotContext();

    return {
      ok:
        true,

      snapshot_id:
        normalizedSnapshotId,

      source:
        activeContext
          .snapshot_id ===
        normalizedSnapshotId
          ? activeContext
              .source
          : "EXPLICIT_CALLER_NOMINATION",

      operational_authority:
        activeContext
          .snapshot_id ===
        normalizedSnapshotId
          ? activeContext
              .operational_authority
          : false,

      requires_access_evaluation:
        true
    };
  }

  /*
  ========================================================
  PAGE NAVIGATION HELPERS
  ========================================================
  */

  async function navigateToDashboard(
    options = {}
  ) {
    const role =
      getRole();

    const destination =
      dashboardForRole(
        role
      );

    if (
      !destination
    ) {
      return {
        ok:
          false,

        status:
          "DASHBOARD_DESTINATION_UNAVAILABLE"
      };
    }

    if (
      role ===
      "athlete"
    ) {
      const context =
        requireSnapshotContext(
          "Athlete Dashboard navigation",
          clean(
            options
              .snapshot_id
          ) ||
          getSnapshotId()
        );

      if (
        !context.ok
      ) {
        return context;
      }

      return navigate(
        withSnapshot(
          destination,
          context
            .snapshot_id
        ),
        {
          replace:
            options
              .replace ===
            true
        }
      );
    }

    return navigate(
      destination,
      {
        replace:
          options
            .replace ===
          true
      }
    );
  }

  async function goToProfile(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Player Profile navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    return navigate(
      withSnapshot(
        "player-profile.html",
        context
          .snapshot_id
      ),
      options
    );
  }

  async function goToSnapshotIntake(
    options = {}
  ) {
    if (
      getRole() !==
      "athlete"
    ) {
      return {
        ok:
          false,

        status:
          "SNAPSHOT_INTAKE_ATHLETE_CONTEXT_REQUIRED"
      };
    }

    let destination =
      appendParams(
        "snapshot-intake.html",
        {
          from:
            clean(
              options
                .from
            ) ||
            getCurrentPage(),

          next:
            clean(
              options
                .next
            ) ||
            "athlete-dashboard.html"
        }
      );

    const snapshotId =
      clean(
        options
          .snapshot_id
      ) ||
      getSnapshotId();

    if (
      snapshotId
    ) {
      const context =
        requireSnapshotContext(
          "Snapshot Intake maintenance navigation",
          snapshotId
        );

      if (
        !context.ok
      ) {
        return context;
      }

      destination =
        withSnapshot(
          destination,
          context
            .snapshot_id
        );
    }

    destination =
      removeParams(
        destination,
        [
          "new"
        ]
      );

    return navigate(
      destination,
      options
    );
  }

  async function goToParentApproval(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Parent Approval navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    const destination =
      withSnapshot(
        "parent-approval.html",
        context
          .snapshot_id
      );

    recordNavigationEvent(
      "PARENT_APPROVAL_ROUTE_REQUESTED",
      {
        current_snapshot_id:
          getSnapshotId() ||
          null,

        destination_snapshot_id:
          context
            .snapshot_id,

        nomination_source:
          context
            .source
      }
    );

    return navigate(
      destination,
      options
    );
  }

  async function goToRoleDashboard(
    options = {}
  ) {
    if (
      !isProfessionalRole(
        getRole()
      )
    ) {
      return {
        ok:
          false,

        status:
          "PROFESSIONAL_CONTEXT_REQUIRED"
      };
    }

    return navigate(
      "role-dashboard.html",
      options
    );
  }

  async function goToSystem(
    options = {}
  ) {
    if (
      getRole() !==
      "admin"
    ) {
      return {
        ok:
          false,

        status:
          "ADMINISTRATOR_CONTEXT_REQUIRED"
      };
    }

    return navigate(
      "system.html",
      options
    );
  }

  async function goToVerification(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Verification navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    return navigate(
      withSnapshot(
        "verification.html",
        context
          .snapshot_id
      ),
      options
    );
  }

  async function goToEligibility(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Eligibility navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    return navigate(
      withSnapshot(
        "eligibility.html",
        context
          .snapshot_id
      ),
      options
    );
  }

  async function goToReadiness(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Readiness navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    return navigate(
      withSnapshot(
        "readiness.html",
        context
          .snapshot_id
      ),
      options
    );
  }

  async function goToMultiBox(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Multi-Box navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    return navigate(
      withSnapshot(
        "multi-box.html",
        context
          .snapshot_id
      ),
      options
    );
  }

  async function goToCrystal(
    snapshotId =
      getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Crystal Registry navigation",
        snapshotId
      );

    if (
      !context.ok
    ) {
      return context;
    }

    return navigate(
      withSnapshot(
        "crystal-registry.html",
        context
          .snapshot_id
      ),
      options
    );
  }

  /*
  ========================================================
  SNAPSHOT LINK HYDRATION
  ========================================================
  */

  function hydrateSnapshotLinks() {
    const snapshotContext =
      getSnapshotContext();

    const snapshotId =
      clean(
        snapshotContext
          .snapshot_id
      );

    if (
      !snapshotId
    ) {
      return 0;
    }

    let count =
      0;

    document
      .querySelectorAll(
        "[data-snapshot-link]"
      )
      .forEach(
        element => {
          const destination =
            element
              .getAttribute(
                "href"
              ) ||
            element
              .dataset
              .snapshotLink ||
            "";

          const normalized =
            normalizeDestination(
              destination
            );

          if (
            !normalized.valid
          ) {
            return;
          }

          element.setAttribute(
            "href",
            withSnapshot(
              normalized
                .normalized,
              snapshotId
            )
          );

          count +=
            1;
        }
      );

    return count;
  }

  function hydrateRoleLinks() {
    return 0;
  }

  /*
  ========================================================
  ACTIVE NAVIGATION
  ========================================================
  */

  function markActiveNav() {
    const currentPage =
      getCurrentPage();

    let count =
      0;

    document
      .querySelectorAll(
        "a[href]"
      )
      .forEach(
        link => {
          const normalized =
            normalizeDestination(
              link
                .getAttribute(
                  "href"
                ) ||
              ""
            );

          if (
            !normalized.valid
          ) {
            return;
          }

          if (
            normalized.page ===
            currentPage
          ) {
            link
              .classList
              .add(
                "active"
              );

            link
              .setAttribute(
                "aria-current",
                "page"
              );

            count +=
              1;
          }
        }
      );

    return count;
  }

  /*
  ========================================================
  EXPLICIT ROUTING ELEMENTS
  ========================================================
  */

  function bindNavigationElements(
    selector =
      "[data-route-destination]"
  ) {
    if (
      NAVIGATION_ELEMENTS_BOUND
    ) {
      return 0;
    }

    NAVIGATION_ELEMENTS_BOUND =
      true;

    let count =
      0;

    document
      .querySelectorAll(
        selector
      )
      .forEach(
        element => {
          if (
            element
              .dataset
              .routingBound ===
            "true"
          ) {
            return;
          }

          element
            .dataset
            .routingBound =
            "true";

          element.addEventListener(
            "click",
            async event => {
              if (
                event.defaultPrevented
              ) {
                return;
              }

              event.preventDefault();

              const destination =
                element
                  .getAttribute(
                    "data-route-destination"
                  ) ||
                element
                  .dataset
                  .routeDestination ||
                element
                  .getAttribute(
                    "href"
                  ) ||
                "";

              if (
                !clean(
                  destination
                )
              ) {
                return;
              }

              await navigate(
                destination
              );
            }
          );

          count +=
            1;
        }
      );

    return count;
  }

  /*
  ========================================================
  PROTECTED ANCHOR ACTIVATION CLASSIFICATION
  ========================================================
  */

  function classifyAnchorActivation(
    event,
    anchor
  ) {
    const target =
      clean(
        anchor
          .getAttribute(
            "target"
          )
      ).toLowerCase();

    if (
      target &&
      target !==
        "_self"
    ) {
      return {
        mode:
          "ALTERNATE_BROWSER_CONTEXT",

        reason:
          "TARGET_CONTEXT"
      };
    }

    if (
      event.button ===
      1
    ) {
      return {
        mode:
          "ALTERNATE_BROWSER_CONTEXT",

        reason:
          "MIDDLE_CLICK"
      };
    }

    if (
      event.metaKey
    ) {
      return {
        mode:
          "ALTERNATE_BROWSER_CONTEXT",

        reason:
          "META_MODIFIER"
      };
    }

    if (
      event.ctrlKey
    ) {
      return {
        mode:
          "ALTERNATE_BROWSER_CONTEXT",

        reason:
          "CTRL_MODIFIER"
      };
    }

    if (
      event.shiftKey
    ) {
      return {
        mode:
          "ALTERNATE_BROWSER_CONTEXT",

        reason:
          "SHIFT_MODIFIER"
      };
    }

    if (
      event.altKey
    ) {
      return {
        mode:
          "ALTERNATE_BROWSER_CONTEXT",

        reason:
          "ALT_MODIFIER"
      };
    }

    if (
      event.button ===
      0
    ) {
      return {
        mode:
          "PRIMARY_SAME_CONTEXT",

        reason:
          "PRIMARY_ACTIVATION"
      };
    }

    return {
      mode:
        "UNSUPPORTED_ACTIVATION",

      reason:
        "UNSUPPORTED_POINTER_BUTTON"
    };
  }

  /*
  ========================================================
  MANDATORY PROTECTED ANCHOR ENFORCEMENT
  ========================================================
  */

  function bindProtectedAnchors(
    selector =
      "a[href]"
  ) {
    PROTECTED_ANCHORS_BOUND =
      true;

    let count =
      0;

    document
      .querySelectorAll(
        selector
      )
      .forEach(
        anchor => {
          if (
            anchor
              .dataset
              .routingBound ===
            "true"
          ) {
            return;
          }

          if (
            anchor
              .dataset
              .protectedRoutingBound ===
            "true"
          ) {
            return;
          }

          const href =
            anchor
              .getAttribute(
                "href"
              ) ||
            "";

          if (
            !clean(
              href
            ) ||
            clean(
              href
            ).startsWith(
              "#"
            )
          ) {
            return;
          }

          const parsed =
            parseDestination(
              href
            );

          if (
            !parsed.valid
          ) {
            return;
          }

          /*
          Only registered non-public routes are protected
          STATS-CORE anchor surfaces.
          */

          if (
            !STATE
              .registered_routes
              .includes(
                parsed.page
              )
          ) {
            return;
          }

          if (
            isPublicRoute(
              parsed.page
            )
          ) {
            return;
          }

          anchor
            .dataset
            .protectedRoutingBound =
            "true";

          anchor.addEventListener(
            "click",
            async event => {
              if (
                event.defaultPrevented
              ) {
                return;
              }

              if (
                anchor
                  .hasAttribute(
                    "download"
                  )
              ) {
                return;
              }

              const activation =
                classifyAnchorActivation(
                  event,
                  anchor
                );

              const currentHref =
                anchor
                  .getAttribute(
                    "href"
                  ) ||
                "";

              const normalized =
                normalizeDestination(
                  currentHref
                );

              if (
                !normalized.valid
              ) {
                event.preventDefault();

                recordError(
                  "PROTECTED_ANCHOR_DESTINATION_INVALID",
                  "Protected anchor destination is invalid.",
                  {
                    destination:
                      currentHref
                  }
                );

                return;
              }

              /*
              Defense in depth:
              protected anchors are bound only to registered routes,
              but re-check at activation time.
              */

              if (
                !STATE
                  .registered_routes
                  .includes(
                    normalized.page
                  )
              ) {
                event.preventDefault();

                recordError(
                  "PROTECTED_ANCHOR_DESTINATION_NOT_REGISTERED",
                  "Protected anchor destination is not registered.",
                  {
                    destination:
                      normalized
                        .normalized
                  }
                );

                return;
              }

              const destinationSnapshot =
                extractDestinationSnapshot(
                  normalized
                );

              if (
                !destinationSnapshot.valid
              ) {
                event.preventDefault();

                recordError(
                  "PROTECTED_ANCHOR_SNAPSHOT_INVALID",
                  destinationSnapshot
                    .error,
                  {
                    destination:
                      normalized
                        .normalized
                  }
                );

                return;
              }

              /*
              PRIMARY SAME-CONTEXT:
              outbound governed authorization is mandatory.
              */

              if (
                activation.mode ===
                "PRIMARY_SAME_CONTEXT"
              ) {
                event.preventDefault();

                recordNavigationEvent(
                  "PROTECTED_ANCHOR_PRIMARY_ACTIVATION",
                  {
                    destination:
                      normalized
                        .normalized,

                    activation_mode:
                      activation
                        .mode
                  }
                );

                await navigate(
                  normalized
                    .normalized
                );

                return;
              }

              /*
              ALTERNATE BROWSER CONTEXT:

              Preserve native browser tab/window semantics.

              The destination remains governed because protected
              arrival admission is mandatory on the newly created
              browsing context before protected business runtime
              may execute.
              */

              if (
                activation.mode ===
                "ALTERNATE_BROWSER_CONTEXT"
              ) {
                recordNavigationEvent(
                  "PROTECTED_ANCHOR_ALTERNATE_CONTEXT_ACTIVATION",
                  {
                    destination:
                      normalized
                        .normalized,

                    activation_mode:
                      activation
                        .mode,

                    reason:
                      activation
                        .reason,

                    enforcement_path:
                      "MANDATORY_ARRIVAL_ADMISSION"
                  }
                );

                /*
                DO NOT preventDefault().
                Browser creates its requested alternate context.
                */

                return;
              }

              /*
              Unknown activation is blocked.
              */

              event.preventDefault();

              recordWarning(
                "PROTECTED_ANCHOR_ACTIVATION_UNSUPPORTED",
                "Protected anchor activation mode is unsupported.",
                activation
              );
            }
          );

          count +=
            1;
        }
      );

    return count;
  }

  /*
  ========================================================
  RUNTIME REFRESH
  ========================================================
  */

  function validateRuntimeBinding(
    runtimeContext
  ) {
    const errors =
      [];

    if (
      !runtimeContext
    ) {
      return {
        valid:
          true,

        errors
      };
    }

    if (
      runtimeContext
        .session_id &&
      runtimeContext
        .session_id !==
      STATE
        .authentication_context
        ?.session_id
    ) {
      errors.push(
        "Runtime Context session_id does not match Initial Authentication Context session_id."
      );
    }

    if (
      runtimeContext
        .user_id &&
      runtimeContext
        .user_id !==
      STATE
        .authentication_context
        ?.user_id
    ) {
      errors.push(
        "Runtime Context user_id does not match Initial Authentication Context user_id."
      );
    }

    if (
      runtimeContext
        .role &&
      normalizeRole(
        runtimeContext
          .role
      ) !==
      normalizeRole(
        STATE
          .authentication_context
          ?.role
      )
    ) {
      errors.push(
        "Runtime Context role does not match Initial Authentication Context role."
      );
    }

    const pageValidation =
      validatePageContextAgainstRuntime(
        STATE
          .page_context,
        runtimeContext
      );

    errors.push(
      ...pageValidation
        .errors
    );

    return {
      valid:
        errors.length ===
        0,

      errors
    };
  }

  async function refreshRuntimeContext(
    suppliedContext =
      null
  ) {
    if (
      !STATE
        .authentication_context
    ) {
      return {
        ok:
          false,

        status:
          "AUTHENTICATION_CONTEXT_REQUIRED"
      };
    }

    const rawContext =
      await resolveRuntimeContext(
        suppliedContext
      );

    const normalized =
      normalizeRuntimeContext(
        rawContext
      );

    const validation =
      validateRuntimeBinding(
        normalized
      );

    if (
      !validation.valid
    ) {
      return {
        ok:
          false,

        status:
          "RUNTIME_CONTEXT_REFRESH_REJECTED",

        errors:
          clone(
            validation
              .errors
          )
      };
    }

    STATE.runtime_context =
      normalized;

    STATE.updated_at =
      nowISO();

    publishState();

    if (
      STATE.initialized &&
      !isPublicRoute(
        getCurrentPage()
      )
    ) {
      const admission =
        await admitCurrentPage();

      if (
        !admission.allowed
      ) {
        return {
          ok:
            false,

          status:
            "RUNTIME_CONTEXT_ADMISSION_REJECTED",

          admission:
            clone(
              admission
            )
        };
      }
    }

    if (
      CONFIGURATION
        .hydrateSnapshotLinks
    ) {
      hydrateSnapshotLinks();
    }

    bindProtectedAnchors(
      "a[href]"
    );

    exposeRoomContext();

    return {
      ok:
        true,

      status:
        "RUNTIME_CONTEXT_REFRESHED",

      runtime_context:
        clone(
          STATE
            .runtime_context
        ),

      current_page_admission:
        getCurrentPageAdmission()
    };
  }

  /*
  ========================================================
  ROOM CONTEXT
  ========================================================
  */

  function getRoomContext() {
    const role =
      getRole();

    const page =
      getCurrentPage();

    const snapshotContext =
      getSnapshotContext();

    return {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

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
        role ||
        null,

      role_id:
        getRoleId() ||
        null,

      page_id:
        page,

      route:
        getCurrentRoute(),

      page_context:
        clone(
          STATE
            .page_context
        ),

      current_page_admission:
        getCurrentPageAdmission(),

      page_admitted:
        hasCurrentPageAdmission(),

      snapshot_id:
        snapshotContext
          .snapshot_id,

      snapshot_context_source:
        snapshotContext
          .source,

      snapshot_runtime_authoritative:
        snapshotContext
          .operational_authority,

      runtime_snapshot_id:
        getRuntimeSnapshotId() ||
        null,

      page_snapshot_id:
        getPageSnapshotId() ||
        null,

      athlete_id:
        getAthleteId() ||
        null,

      requested_destination:
        clean(
          STATE
            .authentication_context
            ?.requested_destination
        ) ||
        null,

      dashboard:
        dashboardForRole(
          role
        ) ||
        null,

      is_public_route:
        isPublicRoute(
          page
        ),

      registered_route:
        STATE
          .registered_routes
          .includes(
            page
          ),

      established_at:
        nowISO()
    };
  }

  function exposeRoomContext() {
    STATE.room_context =
      getRoomContext();

    const publicContext =
      clone(
        STATE
          .room_context
      );

    window.STATScoreRoomContext =
      publicContext;

    window.STATScore =
      window.STATScore ||
      {};

    window.STATScore.RoomContext =
      clone(
        publicContext
      );

    publishState();

    return publicContext;
  }

  /*
  ========================================================
  HEALTH CHECK
  ========================================================
  */

  function runHealthCheck() {
    const authenticationValidation =
      validateAuthenticationContext(
        STATE
          .authentication_context
      );

    const currentPage =
      getCurrentPage();

    const currentPageRegistered =
      STATE
        .registered_routes
        .includes(
          currentPage
        );

    const currentPageProtected =
      !isPublicRoute(
        currentPage
      );

    const admissionValid =
      !currentPageProtected ||
      hasCurrentPageAdmission();

    return {
      ok:
        STATE.initialized ===
          true &&
        authenticationValidation
          .valid &&
        currentPageRegistered &&
        admissionValid &&
        PROTECTED_ANCHORS_BOUND ===
          true,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      initialization_status:
        STATE
          .initialization_status,

      authentication_context_valid:
        authenticationValidation
          .valid,

      runtime_context_available:
        !!STATE
          .runtime_context,

      current_page:
        currentPage,

      current_page_registered:
        currentPageRegistered,

      registered_route_requirement:
        "MANDATORY",

      registered_route_requirement_disableable:
        false,

      current_page_protected:
        currentPageProtected,

      current_page_admitted:
        hasCurrentPageAdmission(),

      current_page_admission:
        getCurrentPageAdmission(),

      current_page_admission_requirement:
        "MANDATORY_FOR_PROTECTED_ROUTES",

      current_page_admission_disableable:
        false,

      parent_approval_registered:
        STATE
          .registered_routes
          .includes(
            "parent-approval.html"
          ),

      access_authority_available:
        typeof CONFIGURATION
          .accessDecisionResolver ===
        "function",

      protected_anchor_primary_enforcement:
        "MANDATORY",

      protected_anchor_primary_enforcement_disableable:
        false,

      alternate_browser_context_policy:
        "MANDATORY_ARRIVAL_ADMISSION",

      protected_anchors_bound:
        PROTECTED_ANCHORS_BOUND,

      last_validation:
        clone(
          STATE
            .last_validation
        ),

      last_access_decision:
        clone(
          STATE
            .last_access_decision
        ),

      last_navigation:
        clone(
          STATE
            .last_navigation
        ),

      error_count:
        STATE
          .errors
          .length,

      warning_count:
        STATE
          .warnings
          .length,

      checked_at:
        nowISO()
    };
  }

  /*
  ========================================================
  INITIALIZATION
  ========================================================
  */

  async function init(
    options = {}
  ) {
    if (
      STATE.initialized &&
      options
        .force_reload !==
      true
    ) {
      return {
        ok:
          true,

        status:
          "ROUTING_ALREADY_INITIALIZED",

        current_page_admission:
          getCurrentPageAdmission(),

        state:
          getState()
      };
    }

    if (
      options
        .force_reload ===
      true
    ) {
      STATE =
        createDefaultState();

      NAVIGATION_ELEMENTS_BOUND =
        false;

      PROTECTED_ANCHORS_BOUND =
        false;
    }

    if (
      options
        .configuration
    ) {
      configure(
        options
          .configuration
      );
    }

    const prohibitedInitOptions = [
      "bind_protected_anchors",
      "require_registered_destination",
      "require_protected_page_admission"
    ];

    prohibitedInitOptions.forEach(
      name => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              options,
              name
            )
        ) {
          recordWarning(
            "CONSTITUTIONAL_INITIALIZATION_OVERRIDE_IGNORED",
            `${name} cannot change constitutional routing enforcement.`,
            {
              option:
                name
            }
          );
        }
      }
    );

    STATE.initialization_status =
      "CONTEXT_RESOLUTION_PENDING";

    publishState();

    /*
    PHASE 1 — AUTHENTICATION
    */

    const authenticationContext =
      await resolveAuthenticationContext(
        options
          .authentication_context ||
        options
          .authenticationContext ||
        null
      );

    const authenticationValidation =
      validateAuthenticationContext(
        authenticationContext
      );

    if (
      !authenticationValidation.valid
    ) {
      STATE.initialization_status =
        "AUTHENTICATION_CONTEXT_REJECTED";

      return {
        ok:
          false,

        status:
          "ROUTING_INITIALIZATION_BLOCKED",

        errors:
          clone(
            authenticationValidation
              .errors
          )
      };
    }

    STATE.authentication_context =
      normalizeAuthenticationContext(
        authenticationContext
      );

    /*
    PHASE 2 — ROUTE REGISTRY
    */

    await resolveRegisteredRoutes();

    if (
      !STATE
        .registered_routes
        .includes(
          getCurrentPage()
        )
    ) {
      STATE.initialization_status =
        "CURRENT_PAGE_NOT_REGISTERED";

      return {
        ok:
          false,

        status:
          "CURRENT_PAGE_NOT_REGISTERED"
      };
    }

    /*
    PHASE 3 — PAGE CONTEXT
    */

    const pageContextResult =
      derivePageContextFromCurrentRoute();

    if (
      !pageContextResult.valid
    ) {
      STATE.initialization_status =
        "PAGE_CONTEXT_REJECTED";

      return {
        ok:
          false,

        status:
          "ROUTING_PAGE_CONTEXT_REJECTED",

        errors:
          clone(
            pageContextResult
              .errors
          )
      };
    }

    STATE.page_context =
      clone(
        pageContextResult
          .context
      );

    /*
    PHASE 4 — RUNTIME CONTEXT
    */

    const runtimeContext =
      normalizeRuntimeContext(
        await resolveRuntimeContext(
          options
            .runtime_context ||
          options
            .runtimeContext ||
          null
        )
      );

    const runtimeValidation =
      validateRuntimeBinding(
        runtimeContext
      );

    if (
      !runtimeValidation.valid
    ) {
      STATE.initialization_status =
        "CONTEXT_MISMATCH_BLOCKED";

      return {
        ok:
          false,

        status:
          "ROUTING_CONTEXT_MISMATCH_BLOCKED",

        errors:
          clone(
            runtimeValidation
              .errors
          )
      };
    }

    STATE.runtime_context =
      runtimeContext;

    /*
    PHASE 5 — CURRENT PAGE ADMISSION
    */

    STATE.initialization_status =
      "CURRENT_PAGE_ADMISSION_PENDING";

    publishState();

    const admission =
      await admitCurrentPage();

    if (
      !admission.allowed
    ) {
      STATE.initialization_status =
        "CURRENT_PAGE_ADMISSION_BLOCKED";

      return {
        ok:
          false,

        status:
          "CURRENT_PAGE_ADMISSION_BLOCKED",

        admission:
          clone(
            admission
          )
      };
    }

    /*
    PHASE 6 — ONLINE
    */

    STATE.initialized =
      true;

    STATE.initialization_status =
      "INITIALIZED";

    STATE.initialized_at =
      STATE
        .initialized_at ||
      nowISO();

    STATE.updated_at =
      nowISO();

    publishState();

    /*
    PHASE 7 — PRESENTATION ROUTING BINDING
    */

    if (
      CONFIGURATION
        .hydrateSnapshotLinks &&
      options
        .hydrate_links !==
      false
    ) {
      hydrateSnapshotLinks();
    }

    if (
      CONFIGURATION
        .markActiveNavigation &&
      options
        .mark_active_nav !==
      false
    ) {
      markActiveNav();
    }

    if (
      CONFIGURATION
        .bindNavigationElements &&
      options
        .bind_navigation_elements !==
      false
    ) {
      bindNavigationElements(
        options
          .navigation_selector ||
        "[data-route-destination]"
      );
    }

    /*
    Constitutional protected-anchor binding.
    No disable option exists.
    */

    bindProtectedAnchors(
      "a[href]"
    );

    exposeRoomContext();

    recordNavigationEvent(
      "ROUTING_ENGINE_INITIALIZED",
      {
        current_page:
          getCurrentPage(),

        role:
          getRole(),

        current_page_admission:
          getCurrentPageAdmission(),

        registered_route_requirement:
          "MANDATORY",

        protected_anchor_primary_enforcement:
          "MANDATORY",

        alternate_browser_context_policy:
          "MANDATORY_ARRIVAL_ADMISSION"
      }
    );

    emit(
      "engine_online",
      {
        status:
          "ONLINE",

        current_page:
          getCurrentPage()
      }
    );

    log(
      "Governed routing authority initialized.",
      {
        version:
          VERSION,

        current_page:
          getCurrentPage(),

        registered:
          true,

        admitted:
          hasCurrentPageAdmission()
      }
    );

    if (
      options
        .navigate_authorized_destination ===
      true
    ) {
      return navigateAuthorizedDestination({
        replace:
          options
            .replace_authorized_destination ===
          true
      });
    }

    return {
      ok:
        true,

      status:
        "ROUTING_INITIALIZED",

      current_page_admission:
        getCurrentPageAdmission(),

      room_context:
        clone(
          STATE
            .room_context
        ),

      state:
        getState()
    };
  }

  /*
  ========================================================
  PUBLIC API
  ========================================================
  */

  function expose() {
    const api = {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      owner_stream:
        OWNER_STREAM,

      PROFESSIONAL_ROLES,
      ALL_ROLES,
      PUBLIC_ROUTES,
      CORE_REGISTERED_ROUTES,
      ROLE_DASHBOARDS,

      configure,
      getConfiguration,

      init,
      refreshRuntimeContext,

      getCurrentPage,
      getCurrentRoute,
      getQueryParam,

      normalizeRole,
      isValidRole,
      isProfessionalRole,
      isPublicRoute,

      getRole,
      getRoleId,

      getPageContext,

      getSnapshotContext,
      getRuntimeSnapshotId,
      getPageSnapshotId,
      getSnapshotId,

      getAthleteId,
      getRuntimeId,
      getSessionId,
      getUserId,

      getCurrentPageAdmission,
      hasCurrentPageAdmission,
      admitCurrentPage,

      dashboardForRole,

      parseDestination,
      normalizeDestination,
      appendParams,
      removeParams,
      withSnapshot,
      withRuntimeContext,

      extractDestinationSnapshot,

      resolveRegisteredRoutes,
      isRegisteredRoute,

      validateDestination:
        validateGeneralDestination,

      navigate,
      navigateAuthorizedDestination,
      navigateToDashboard,

      goToProfile,
      goToSnapshotIntake,
      goToParentApproval,
      goToRoleDashboard,
      goToSystem,
      goToVerification,
      goToEligibility,
      goToReadiness,
      goToMultiBox,
      goToCrystal,

      hydrateSnapshotLinks,
      hydrateRoleLinks,
      markActiveNav,

      bindNavigationElements,
      bindProtectedAnchors,
      classifyAnchorActivation,

      getRoomContext,
      exposeRoomContext,

      runHealthCheck,
      getState
    };

    window.STATScoreRouting =
      api;

    window.STATScore =
      window.STATScore ||
      {};

    window.STATScore.Routing =
      api;

    publishState();

    emit(
      "engine_loaded",
      {
        status:
          "WAITING_FOR_CONTEXT"
      }
    );

    log(
      "Routing engine loaded.",
      {
        engine_id:
          ENGINE_ID,

        version:
          VERSION
      }
    );

    return api;
  }

  expose();

  /*
  ========================================================
  DOWNSTREAM BUSINESS RUNTIME REQUIREMENT
  ========================================================

  Protected destination engines MUST fail closed until Routing
  confirms admission.

  Example:

  const admission =
    window.STATScoreRouting
      ?.getCurrentPageAdmission?.();

  if (
    !admission ||
    admission.allowed !== true
  ) {
    return;
  }

  This requirement applies equally to:

  - same-tab governed navigation
  - direct URL entry
  - browser refresh
  - bookmarked protected destinations
  - Ctrl/Command-click
  - middle-click
  - Shift-click
  - target="_blank"
  - any alternate browsing context

  Therefore alternate-context browser navigation does not create
  a protected business-authority bypass.

  ========================================================
  */
})(); 
