/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-routing.js

Asset Type:
JavaScript Infrastructure / Governed Routing Authority

Owner Stream:
Stream 1 — Public Access / Login

Primary Operational Authority:
Stream 1 — Public Access / Login

Layer:
Enterprise Infrastructure / Governed Routing

Runtime Consumer Boundary:
Consumes Initial Authentication Context from Stream 1.
Consumes Initial Runtime Context from Stream 8.
Consumes access determinations from the governed Access Authority.
Consumes page registration from Page Map and System Map authorities.

Primary Consumers:
- index.html
- login.html
- snapshot-intake.html
- athlete-dashboard.html
- player-profile.html
- role-dashboard-intake.html
- role-dashboard.html
- system.html
- all governed route-aware pages

Purpose:
Executes governed navigation only after authentication, entry-state,
access, page-registration, and runtime authorities have produced
their approved context or decisions.

Consumes:
- Initial Authentication Context
- Initial Runtime Context
- active Runtime State
- Authentication Service requested_destination
- governed access decisions
- governed Page Map
- governed System Map
- active snapshot_id
- active role reference
- active role_id reference

Provides:
- Authentication Service destination execution
- registered-route validation
- governed access enforcement
- safe query-parameter preservation
- snapshot-aware navigation
- page-navigation helpers
- active-navigation marking
- room-context publication
- routing health diagnostics

Primary IDs:
- session_id
- user_id
- snapshot_id
- athlete_id
- role
- role_id
- page_id
- runtime_id
- active_workspace_id

Cross-Stream Dependencies:
- Stream 1 publishes Initial Authentication Context and the
  Authentication Service authorized requested_destination.
- Stream 8 publishes Initial Runtime Context and Runtime State.
- Role Access Authority publishes governed access decisions.
- Page Map and System Map publish registered-page authorities.
- This file executes approved navigation but does not replace
  those authorities.

Does NOT:
- authenticate users
- manufacture session_id
- manufacture user_id
- manufacture role or role_id
- persist authenticated identity
- resolve role from URL parameters
- resolve role from browser storage
- determine first-time or returning entry state
- override requested_destination
- accept caller-manufactured authentication authorization
- accept caller-manufactured access decisions
- allow protected-route access checks to be disabled
- expose role_id through general navigation URLs
- create access policy
- calculate intelligence
- render dashboards
- create source records
- modify scores
- generate Crystal Reports
- execute communications
- execute intelligence engines
- manufacture governance decisions

Status:
CONTROLLED V3.1 ACCESS-ENFORCEMENT REVISION

==========================================================
*/

/*
============================================================
STATS-CORE™ Governed Routing Authority
File: statscore-routing.js
Version: STATSCORE-ROUTING-V3.1
Purpose:
Authorized Destination Consumption
→ Registered Route Validation
→ Governed Access Enforcement
→ Context Preservation
→ Navigation Execution

Certified Authentication Entry Routes:

First-time athlete:
snapshot-intake.html
  ?new=1
  &role=athlete
  &from=login
  &next=athlete-dashboard.html

Returning athlete:
athlete-dashboard.html?snapshot_id={snapshot_id}

First-time professional:
role-dashboard-intake.html
  ?role={authenticated_role}
  &from=login
  &next=role-dashboard.html

Returning professional:
role-dashboard.html

Administrator:
system.html

Important:
The Authentication Service determines which entry route applies
and publishes that complete route as requested_destination.

This engine validates and executes that destination. It does not
reconstruct entry state from role, URL parameters, or storage.
============================================================
*/

(function () {
  "use strict";

  const ENGINE_ID = "statscore-routing";
  const VERSION = "STATSCORE-ROUTING-V3.1";
  const OWNER_STREAM = "Stream 1 — Public Access / Login";

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

  const ROLE_DASHBOARDS = Object.freeze({
    athlete: "athlete-dashboard.html",
    parent: "role-dashboard.html",
    coach: "role-dashboard.html",
    counselor: "role-dashboard.html",
    recruiter: "role-dashboard.html",
    evaluator: "role-dashboard.html",
    program: "role-dashboard.html",
    trainer: "role-dashboard.html",
    admin: "system.html"
  });

  /*
  ========================================================
  CONTROLLED ROUTE FALLBACK
  ========================================================

  Page Map and System Map remain the preferred enterprise
  page-registration authorities.

  This local list provides only a controlled load-order fallback.
  It is not an access-policy registry.
  ========================================================
  */

  const CORE_REGISTERED_ROUTES = Object.freeze([
    "index.html",
    "login.html",
    "privacy.html",
    "terms.html",

    "snapshot-intake.html",
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

  const ROUTE_FIELDS = Object.freeze([
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

  const ROUTE_CONTAINER_FIELDS = Object.freeze([
    "pages",
    "routes",
    "entries",
    "items",
    "children",
    "registry",
    "page_map",
    "system_map"
  ]);

  const REQUIRED_AUTHENTICATION_FIELDS = Object.freeze([
    "session_id",
    "user_id",
    "role",
    "entry_intent",
    "authenticated_at",
    "authentication_source",
    "requested_destination"
  ]);

  const REQUIRED_ACCESS_DECISION_FIELDS = Object.freeze([
    "allowed",
    "authority_id",
    "authority_type",
    "destination",
    "user_id",
    "session_id",
    "decided_at"
  ]);

  const CONFIGURATION = {
    authenticationContextResolver: null,
    runtimeContextResolver: null,
    accessDecisionResolver: null,
    pageRegistryResolver: null,
    systemRegistryResolver: null,

    requireRegisteredDestination: true,
    bindNavigationElements: true,
    hydrateSnapshotLinks: true,
    markActiveNavigation: true
  };

  let STATE = createDefaultState();
  let NAVIGATION_ELEMENTS_BOUND = false;

  function createDefaultState() {
    return {
      initialized: false,
      initialization_status: "LOADED",

      engine_id: ENGINE_ID,
      version: VERSION,
      owner_stream: OWNER_STREAM,

      initialized_at: null,
      updated_at: null,

      authentication_context: null,
      runtime_context: null,
      room_context: null,

      registered_routes: [],

      last_validation: null,
      last_access_decision: null,
      last_navigation: null,

      navigation_events: [],
      errors: [],
      warnings: []
    };
  }

  function nowISO() {
    return new Date().toISOString();
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

  function getCurrentPage() {
    const pathname = window.location.pathname || "";

    return (
      pathname
        .split("/")
        .filter(Boolean)
        .pop() || "index.html"
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
      ).get(key) || ""
    );
  }

  function isPublicRoute(page = getCurrentPage()) {
    return PUBLIC_ROUTES.includes(clean(page));
  }

  function isValidRole(role) {
    return ALL_ROLES.includes(normalizeRole(role));
  }

  function isProfessionalRole(role) {
    return PROFESSIONAL_ROLES.includes(
      normalizeRole(role)
    );
  }

  function log(message, payload) {
    console.info(
      `[STATS-CORE Routing] ${message}`,
      payload === undefined ? "" : payload
    );
  }

  /*
  ========================================================
  STATE PUBLICATION
  ========================================================

  The internal STATE object is never published by reference.
  External consumers receive a clone only.
  ========================================================
  */

  function publishState() {
    const publicState = clone(STATE);

    window.STATScoreRoutingState = publicState;

    window.STATScore =
      window.STATScore || {};

    window.STATScore.RoutingState =
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
      emitted_at: nowISO(),
      ...clone(payload)
    };

    window.dispatchEvent(
      new CustomEvent(
        `statscore:routing:${eventName}`,
        { detail }
      )
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        `routing_${eventName}`,
        detail
      );
    }
  }

  function recordNavigationEvent(type, payload = {}) {
    const event = {
      navigation_event_id:
        "sc_route_event_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
          .toString(36)
          .slice(2, 10),

      event_type:
        clean(type) || "ROUTING_EVENT",

      engine_id: ENGINE_ID,
      version: VERSION,

      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.navigation_events.push(event);
    STATE.updated_at = nowISO();

    publishState();

    emit("event_recorded", {
      navigation_event: clone(event)
    });

    return clone(event);
  }

  function recordWarning(code, message, payload = null) {
    const warning = {
      code:
        clean(code) || "ROUTING_WARNING",

      message:
        clean(message) || "Routing warning.",

      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.warnings.push(warning);
    STATE.updated_at = nowISO();

    console.warn(
      `[STATS-CORE Routing] ${warning.code}: ${warning.message}`,
      payload || ""
    );

    publishState();
    emit("warning", { warning: clone(warning) });

    return clone(warning);
  }

  function recordError(code, message, payload = null) {
    const errorRecord = {
      code:
        clean(code) || "ROUTING_ERROR",

      message:
        clean(message) || "Routing error.",

      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.errors.push(errorRecord);
    STATE.updated_at = nowISO();

    console.error(
      `[STATS-CORE Routing] ${errorRecord.code}: ${errorRecord.message}`,
      payload || ""
    );

    publishState();
    emit("error", { error: clone(errorRecord) });

    return clone(errorRecord);
  }

  function configure(options = {}) {
    const resolverNames = [
      "authenticationContextResolver",
      "runtimeContextResolver",
      "accessDecisionResolver",
      "pageRegistryResolver",
      "systemRegistryResolver"
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

    const booleanOptions = [
      "requireRegisteredDestination",
      "bindNavigationElements",
      "hydrateSnapshotLinks",
      "markActiveNavigation"
    ];

    booleanOptions.forEach(name => {
      if (
        Object.prototype.hasOwnProperty.call(
          options,
          name
        )
      ) {
        CONFIGURATION[name] =
          options[name] !== false;
      }
    });

    recordNavigationEvent(
      "ROUTING_CONFIGURATION_UPDATED",
      {
        configuration: getConfiguration()
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
          .runtimeContextResolver === "function",

      has_access_decision_resolver:
        typeof CONFIGURATION
          .accessDecisionResolver === "function",

      has_page_registry_resolver:
        typeof CONFIGURATION
          .pageRegistryResolver === "function",

      has_system_registry_resolver:
        typeof CONFIGURATION
          .systemRegistryResolver === "function",

      require_registered_destination:
        CONFIGURATION.requireRegisteredDestination,

      bind_navigation_elements:
        CONFIGURATION.bindNavigationElements,

      hydrate_snapshot_links:
        CONFIGURATION.hydrateSnapshotLinks,

      mark_active_navigation:
        CONFIGURATION.markActiveNavigation
    };
  }

  function getAuthenticationContextFromWindow() {
    return (
      window.STATScoreInitialAuthenticationContext ||
      window.STATScoreAuthenticationContext ||
      window.STATScore
        ?.InitialAuthenticationContext ||
      window.STATScore?.AuthenticationContext ||
      null
    );
  }

  function getRuntimeContextFromWindow() {
    const runtimeEngine =
      window.STATScoreRuntimeStateEngine ||
      window.STATScore?.RuntimeStateEngine ||
      null;

    return (
      runtimeEngine
        ?.getInitialRuntimeContext?.() ||
      runtimeEngine
        ?.getState?.()
        ?.initial_runtime_context ||
      window.STATScoreInitialRuntimeContext ||
      window.STATScore?.InitialRuntimeContext ||
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
        .runtimeContextResolver === "function"
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

  function validateAuthenticationContext(context) {
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

    REQUIRED_AUTHENTICATION_FIELDS.forEach(
      field => {
        if (clean(context[field]) === "") {
          errors.push(
            `Initial Authentication Context is missing required field: ${field}`
          );
        }
      }
    );

    if (
      context.role &&
      !isValidRole(context.role)
    ) {
      errors.push(
        `Initial Authentication Context contains unsupported role: ${context.role}`
      );
    }

    if (
      context.authenticated_at &&
      Number.isNaN(
        Date.parse(context.authenticated_at)
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

  function normalizeAuthenticationContext(context) {
    return {
      session_id: clean(context.session_id),
      user_id: clean(context.user_id),
      role: normalizeRole(context.role),

      entry_intent:
        clean(context.entry_intent),

      authenticated_at:
        clean(context.authenticated_at),

      authentication_source:
        clean(context.authentication_source),

      requested_destination:
        clean(context.requested_destination)
    };
  }

  function normalizeRuntimeContext(context) {
    if (
      !context ||
      typeof context !== "object" ||
      Array.isArray(context)
    ) {
      return null;
    }

    return {
      runtime_id:
        clean(context.runtime_id) || null,

      session_id:
        clean(context.session_id) || null,

      user_id:
        clean(context.user_id) || null,

      role:
        normalizeRole(context.role) || null,

      role_id:
        clean(context.role_id) || null,

      entry_intent:
        clean(context.entry_intent) || null,

      authenticated_at:
        clean(context.authenticated_at) || null,

      authentication_source:
        clean(context.authentication_source) ||
        null,

      requested_destination:
        clean(context.requested_destination) ||
        null,

      page_id:
        clean(context.page_id) || null,

      page_context:
        clone(context.page_context || null),

      active_snapshot_id:
        clean(context.active_snapshot_id) ||
        clean(
          context.page_context?.snapshot_id
        ) ||
        null,

      active_athlete_id:
        clean(context.active_athlete_id) ||
        null,

      active_workspace_id:
        clean(context.active_workspace_id) ||
        null,

      system_state:
        clean(context.system_state) || null
    };
  }

  function getRole() {
    return (
      normalizeRole(
        STATE.runtime_context?.role ||
        STATE.authentication_context?.role
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

  function getRuntimeId() {
    return (
      clean(
        STATE.runtime_context?.runtime_id
      ) || ""
    );
  }

  function getSessionId() {
    return (
      clean(
        STATE.runtime_context?.session_id
      ) ||
      clean(
        STATE.authentication_context
          ?.session_id
      ) ||
      ""
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

  function dashboardForRole(role = getRole()) {
    const normalized =
      normalizeRole(role);

    if (!isValidRole(normalized)) {
      return "";
    }

    return (
      ROLE_DASHBOARDS[normalized] || ""
    );
  }

  /*
  ========================================================
  DESTINATION NORMALIZATION
  ========================================================
  */

  function parseDestination(destination) {
    const raw = clean(destination);

    if (!raw) {
      return {
        valid: false,
        error: "Destination is empty."
      };
    }

    const lowered = raw.toLowerCase();

    if (
      lowered.startsWith("javascript:") ||
      lowered.startsWith("data:") ||
      lowered.startsWith("vbscript:")
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
          "Cross-origin routing is prohibited."
      };
    }

    const page =
      url.pathname
        .split("/")
        .filter(Boolean)
        .pop() || "index.html";

    return {
      valid: true,
      raw,
      url,
      page
    };
  }

  function normalizeDestination(destination) {
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
      ...parsed.url.searchParams.entries()
    ].sort(([leftKey, leftValue], [
      rightKey,
      rightValue
    ]) => {
      const keyComparison =
        leftKey.localeCompare(rightKey);

      if (keyComparison !== 0) {
        return keyComparison;
      }

      return leftValue.localeCompare(
        rightValue
      );
    });

    const normalizedParams =
      new URLSearchParams();

    orderedEntries.forEach(
      ([key, value]) => {
        normalizedParams.append(key, value);
      }
    );

    const query =
      normalizedParams.toString();

    const normalized =
      parsed.page +
      (query ? `?${query}` : "") +
      parsed.url.hash;

    return {
      valid: true,
      normalized,
      page: parsed.page,
      url: parsed.url
    };
  }

  function appendParams(destination, params = {}) {
    const parsed =
      parseDestination(destination);

    if (!parsed.valid) {
      throw new Error(parsed.error);
    }

    Object.entries(params).forEach(
      ([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          clean(value) === ""
        ) {
          return;
        }

        parsed.url.searchParams.set(
          key,
          String(value)
        );
      }
    );

    return normalizeDestination(
      parsed.url.href
    ).normalized;
  }

  function removeParams(destination, keys = []) {
    const parsed =
      parseDestination(destination);

    if (!parsed.valid) {
      throw new Error(parsed.error);
    }

    keys.forEach(key => {
      parsed.url.searchParams.delete(key);
    });

    return normalizeDestination(
      parsed.url.href
    ).normalized;
  }

  function withSnapshot(
    destination,
    snapshotId = getSnapshotId()
  ) {
    const normalizedSnapshotId =
      clean(snapshotId);

    if (!normalizedSnapshotId) {
      return destination;
    }

    return appendParams(destination, {
      snapshot_id: normalizedSnapshotId
    });
  }

  /*
  General runtime-context propagation is intentionally limited.

  role_id is never published through URLs.

  role is not propagated during ordinary navigation. The only
  approved role-bearing entry route is the complete destination
  produced by Authentication Service for first-time professional
  intake.
  */

  function withRuntimeContext(
    destination,
    options = {}
  ) {
    const params = {};

    if (
      options.include_snapshot !== false
    ) {
      const snapshotId =
        clean(options.snapshot_id) ||
        getSnapshotId();

      if (snapshotId) {
        params.snapshot_id =
          snapshotId;
      }
    }

    if (clean(options.from)) {
      params.from =
        clean(options.from);
    }

    if (clean(options.next)) {
      params.next =
        clean(options.next);
    }

    return appendParams(
      destination,
      params
    );
  }

  /*
  ========================================================
  REGISTERED ROUTE EXTRACTION
  ========================================================

  Only recognized route-bearing properties are parsed.

  Ordinary metadata strings are never recursively interpreted
  as route names.
  ========================================================
  */

  function extractRoutesFromRegistry(registry) {
    const routes = new Set();
    const visited = new WeakSet();

    function addRoute(value) {
      if (typeof value !== "string") {
        return;
      }

      const normalized =
        normalizeDestination(value);

      if (normalized.valid) {
        routes.add(normalized.page);
      }
    }

    function walkRouteRecord(value, depth = 0) {
      if (
        value === null ||
        value === undefined ||
        depth > 6
      ) {
        return;
      }

      if (typeof value === "string") {
        addRoute(value);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(item => {
          walkRouteRecord(
            item,
            depth + 1
          );
        });

        return;
      }

      if (typeof value !== "object") {
        return;
      }

      if (visited.has(value)) {
        return;
      }

      visited.add(value);

      ROUTE_FIELDS.forEach(field => {
        if (
          typeof value[field] ===
          "string"
        ) {
          addRoute(value[field]);
        }
      });

      ROUTE_CONTAINER_FIELDS.forEach(
        field => {
          const container = value[field];

          if (
            container &&
            (
              Array.isArray(container) ||
              typeof container === "object"
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

    walkRouteRecord(registry);

    return [...routes];
  }

  async function resolveRegisteredRoutes() {
    const routes =
      new Set(CORE_REGISTERED_ROUTES);

    const registries = [];

    if (
      typeof CONFIGURATION
        .pageRegistryResolver === "function"
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
        window.STATScorePageMap ||
        window.STATScore?.PageMap ||
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
        window.STATScoreSystemMap ||
        window.STATScore?.SystemMap ||
        null
      );
    }

    registries.forEach(registry => {
      extractRoutesFromRegistry(
        registry
      ).forEach(route => {
        routes.add(route);
      });
    });

    STATE.registered_routes =
      [...routes].sort();

    STATE.updated_at = nowISO();

    publishState();

    return clone(
      STATE.registered_routes
    );
  }

  function isRegisteredRoute(destination) {
    const normalized =
      normalizeDestination(destination);

    if (!normalized.valid) {
      return false;
    }

    return STATE.registered_routes.includes(
      normalized.page
    );
  }

  /*
  ========================================================
  AUTHENTICATION DESTINATION VALIDATION
  ========================================================

  No public boolean or caller-supplied option can declare that a
  destination was authorized by Authentication Service.

  The destination must exactly match requested_destination after
  safe normalization.
  ========================================================
  */

  function validateAuthenticationDestination(
    destination
  ) {
    const requestedDestination =
      STATE.authentication_context
        ?.requested_destination;

    const supplied =
      normalizeDestination(destination);

    const authorized =
      normalizeDestination(
        requestedDestination
      );

    if (!supplied.valid) {
      return {
        valid: false,
        status:
          "AUTHENTICATION_DESTINATION_INVALID",
        error: supplied.error
      };
    }

    if (!authorized.valid) {
      return {
        valid: false,
        status:
          "AUTHORIZED_DESTINATION_INVALID",
        error: authorized.error
      };
    }

    if (
      supplied.normalized !==
      authorized.normalized
    ) {
      return {
        valid: false,
        status:
          "AUTHENTICATION_DESTINATION_MISMATCH",

        supplied_destination:
          supplied.normalized,

        authorized_destination:
          authorized.normalized
      };
    }

    return {
      valid: true,
      status:
        "AUTHENTICATION_DESTINATION_CONFIRMED",

      destination:
        authorized.normalized,

      page: authorized.page,

      authority_id:
        "STREAM_1_AUTHENTICATION_SERVICE"
    };
  }

  /*
  ========================================================
  GOVERNED ACCESS DECISION CONTRACT
  ========================================================
  */

  function validateAccessDecision(
    decision,
    destination
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
          "Governed Access Authority returned no valid decision object."
        ]
      };
    }

    REQUIRED_ACCESS_DECISION_FIELDS.forEach(
      field => {
        if (
          field === "allowed"
        ) {
          if (
            typeof decision.allowed !==
            "boolean"
          ) {
            errors.push(
              "Access decision allowed must be boolean."
            );
          }

          return;
        }

        if (
          clean(decision[field]) === ""
        ) {
          errors.push(
            `Access decision is missing required field: ${field}`
          );
        }
      }
    );

    const requestedDestination =
      normalizeDestination(destination);

    const decidedDestination =
      normalizeDestination(
        decision.destination
      );

    if (!requestedDestination.valid) {
      errors.push(
        "Requested destination is invalid."
      );
    }

    if (!decidedDestination.valid) {
      errors.push(
        "Access decision destination is invalid."
      );
    }

    if (
      requestedDestination.valid &&
      decidedDestination.valid &&
      requestedDestination.normalized !==
        decidedDestination.normalized
    ) {
      errors.push(
        "Access decision destination does not match the requested destination."
      );
    }

    const activeUserId = getUserId();
    const activeSessionId =
      getSessionId();

    if (
      clean(decision.user_id) !==
      activeUserId
    ) {
      errors.push(
        "Access decision user_id does not match the active authenticated user."
      );
    }

    if (
      clean(decision.session_id) !==
      activeSessionId
    ) {
      errors.push(
        "Access decision session_id does not match the active authenticated session."
      );
    }

    if (
      decision.decided_at &&
      Number.isNaN(
        Date.parse(decision.decided_at)
      )
    ) {
      errors.push(
        "Access decision decided_at is invalid."
      );
    }

    return {
      valid: errors.length === 0,
      allowed:
        errors.length === 0 &&
        decision.allowed === true,

      errors,

      decision: errors.length
        ? null
        : {
            allowed:
              decision.allowed === true,

            authority_id:
              clean(decision.authority_id),

            authority_type:
              clean(decision.authority_type),

            destination:
              decidedDestination.normalized,

            user_id:
              clean(decision.user_id),

            session_id:
              clean(decision.session_id),

            decided_at:
              clean(decision.decided_at),

            status:
              clean(decision.status) ||
              (
                decision.allowed
                  ? "ACCESS_ALLOWED"
                  : "ACCESS_DENIED"
              ),

            metadata:
              clone(decision.metadata || {})
          }
    };
  }

  async function resolveGovernedAccessDecision(
    destination
  ) {
    if (
      typeof CONFIGURATION
        .accessDecisionResolver !==
      "function"
    ) {
      return {
        valid: false,
        allowed: false,
        status:
          "ACCESS_AUTHORITY_UNAVAILABLE",
        errors: [
          "No governed Access Authority resolver is configured."
        ]
      };
    }

    let rawDecision;

    try {
      rawDecision =
        await CONFIGURATION
          .accessDecisionResolver({
            destination:
              normalizeDestination(
                destination
              ).normalized,

            page:
              normalizeDestination(
                destination
              ).page,

            authentication_context:
              clone(
                STATE.authentication_context
              ),

            runtime_context:
              clone(
                STATE.runtime_context
              ),

            current_page:
              getCurrentPage()
          });
    } catch (error) {
      return {
        valid: false,
        allowed: false,
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
        destination
      );

    if (!validation.valid) {
      return {
        valid: false,
        allowed: false,
        status:
          "ACCESS_DECISION_INVALID",
        errors:
          clone(validation.errors)
      };
    }

    STATE.last_access_decision =
      clone(validation.decision);

    STATE.updated_at = nowISO();

    publishState();

    return {
      valid: true,
      allowed:
        validation.allowed,

      status:
        validation.decision.status,

      decision:
        clone(validation.decision)
    };
  }

  /*
  ========================================================
  DESTINATION VALIDATION
  ========================================================

  Public pages may be navigated without Access Authority review.

  Every non-public route requires a governed Access Authority
  decision. No caller option can disable that requirement.
  ========================================================
  */

  async function validateGeneralDestination(
    destination
  ) {
    const normalized =
      normalizeDestination(destination);

    if (!normalized.valid) {
      const result = {
        valid: false,
        status: "INVALID_DESTINATION",
        destination:
          clean(destination),
        error: normalized.error
      };

      STATE.last_validation =
        clone(result);

      publishState();

      return result;
    }

    if (
      CONFIGURATION
        .requireRegisteredDestination &&
      !STATE.registered_routes.includes(
        normalized.page
      )
    ) {
      const result = {
        valid: false,
        status:
          "DESTINATION_NOT_REGISTERED",

        destination:
          normalized.normalized,

        page: normalized.page
      };

      STATE.last_validation =
        clone(result);

      publishState();

      return result;
    }

    if (isPublicRoute(normalized.page)) {
      const result = {
        valid: true,
        status:
          "PUBLIC_DESTINATION_VALIDATED",

        destination:
          normalized.normalized,

        page: normalized.page,

        access_decision: {
          allowed: true,
          status:
            "PUBLIC_ROUTE_ACCESS"
        }
      };

      STATE.last_validation =
        clone(result);

      STATE.updated_at = nowISO();

      publishState();

      return result;
    }

    const accessResult =
      await resolveGovernedAccessDecision(
        normalized.normalized
      );

    if (
      !accessResult.valid ||
      !accessResult.allowed
    ) {
      const result = {
        valid: false,
        status:
          accessResult.status ||
          "ACCESS_DENIED",

        destination:
          normalized.normalized,

        page: normalized.page,

        access_decision:
          clone(accessResult)
      };

      STATE.last_validation =
        clone(result);

      publishState();

      return result;
    }

    const result = {
      valid: true,
      status:
        "PROTECTED_DESTINATION_VALIDATED",

      destination:
        normalized.normalized,

      page: normalized.page,

      access_decision:
        clone(accessResult.decision)
    };

    STATE.last_validation =
      clone(result);

    STATE.updated_at = nowISO();

    publishState();

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
    STATE.last_navigation = {
      destination,
      page:
        normalizeDestination(
          destination
        ).page,

      source_page:
        getCurrentPage(),

      initiated_at:
        nowISO(),

      replace:
        options.replace === true
    };

    STATE.updated_at = nowISO();

    publishState();

    recordNavigationEvent(
      "NAVIGATION_APPROVED",
      {
        destination,
        page:
          STATE.last_navigation.page,

        source_page:
          STATE.last_navigation
            .source_page
      }
    );

    emit("navigation_approved", {
      destination,
      page:
        STATE.last_navigation.page
    });

    if (options.replace === true) {
      window.location.replace(
        destination
      );
    } else {
      window.location.assign(
        destination
      );
    }

    return {
      ok: true,
      status:
        "NAVIGATION_APPROVED",
      destination
    };
  }

  /*
  Public method:
  No authentication override.
  No caller access decision.
  No access-disable switch.
  */

  async function navigate(
    destination,
    options = {}
  ) {
    const validation =
      await validateGeneralDestination(
        destination
      );

    if (!validation.valid) {
      recordError(
        "NAVIGATION_BLOCKED",
        "The requested navigation was blocked.",
        validation
      );

      emit("navigation_blocked", {
        validation:
          clone(validation)
      });

      return {
        ok: false,
        status:
          "NAVIGATION_BLOCKED",
        validation:
          clone(validation)
      };
    }

    return executeNavigation(
      validation.destination,
      {
        replace:
          options.replace === true
      }
    );
  }

  /*
  Authentication completion method:
  Destination cannot be supplied by the caller.

  The method reads requested_destination directly from the
  accepted Initial Authentication Context and verifies it against
  itself through normalized destination validation.
  */

  async function navigateAuthorizedDestination(
    options = {}
  ) {
    const destination =
      STATE.authentication_context
        ?.requested_destination;

    if (!clean(destination)) {
      const result = {
        ok: false,
        status:
          "AUTHORIZED_DESTINATION_UNAVAILABLE"
      };

      recordError(
        result.status,
        "Initial Authentication Context does not contain requested_destination."
      );

      return result;
    }

    const authenticationValidation =
      validateAuthenticationDestination(
        destination
      );

    if (
      !authenticationValidation.valid
    ) {
      recordError(
        authenticationValidation.status,
        "Authentication-authorized navigation validation failed.",
        authenticationValidation
      );

      return {
        ok: false,
        status:
          authenticationValidation.status,
        validation:
          clone(authenticationValidation)
      };
    }

    if (
      CONFIGURATION
        .requireRegisteredDestination &&
      !STATE.registered_routes.includes(
        authenticationValidation.page
      )
    ) {
      const result = {
        ok: false,
        status:
          "AUTHORIZED_DESTINATION_NOT_REGISTERED",

        destination:
          authenticationValidation
            .destination,

        page:
          authenticationValidation.page
      };

      recordError(
        result.status,
        "Authentication Service requested_destination is not registered.",
        result
      );

      return result;
    }

    recordNavigationEvent(
      "AUTHENTICATION_DESTINATION_CONFIRMED",
      {
        destination:
          authenticationValidation
            .destination,

        authority_id:
          authenticationValidation
            .authority_id
      }
    );

    return executeNavigation(
      authenticationValidation.destination,
      {
        replace:
          options.replace === true
      }
    );
  }

  async function navigateToDashboard(
    options = {}
  ) {
    const role = getRole();
    const destination =
      dashboardForRole(role);

    if (!destination) {
      const result = {
        ok: false,
        status:
          "DASHBOARD_DESTINATION_UNAVAILABLE",
        role
      };

      recordError(
        result.status,
        "No governed dashboard destination exists for the active authenticated role.",
        result
      );

      return result;
    }

    if (role === "athlete") {
      const snapshotId =
        clean(options.snapshot_id) ||
        getSnapshotId();

      if (!snapshotId) {
        const result = {
          ok: false,
          status:
            "ATHLETE_DASHBOARD_SNAPSHOT_REQUIRED",
          role
        };

        recordError(
          result.status,
          "Athlete Dashboard navigation requires a governed snapshot_id."
        );

        return result;
      }

      return navigate(
        withSnapshot(
          destination,
          snapshotId
        ),
        {
          replace:
            options.replace === true
        }
      );
    }

    return navigate(destination, {
      replace:
        options.replace === true
    });
  }

  function requireSnapshotContext(
    operationName,
    snapshotId
  ) {
    const normalizedSnapshotId =
      clean(snapshotId) ||
      getSnapshotId();

    if (!normalizedSnapshotId) {
      const result = {
        ok: false,
        status:
          "GOVERNED_SNAPSHOT_CONTEXT_REQUIRED",

        operation:
          operationName
      };

      recordError(
        result.status,
        `${operationName} requires a governed snapshot_id.`,
        result
      );

      return result;
    }

    return {
      ok: true,
      snapshot_id:
        normalizedSnapshotId
    };
  }

  async function goToProfile(
    snapshotId = getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Player Profile navigation",
        snapshotId
      );

    if (!context.ok) {
      return context;
    }

    return navigate(
      withSnapshot(
        "player-profile.html",
        context.snapshot_id
      ),
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToSnapshotIntake(
    options = {}
  ) {
    const role = getRole();

    if (role !== "athlete") {
      const result = {
        ok: false,
        status:
          "SNAPSHOT_INTAKE_ATHLETE_CONTEXT_REQUIRED",
        role
      };

      recordError(
        result.status,
        "Snapshot Intake navigation requires authenticated athlete context.",
        result
      );

      return result;
    }

    /*
    This helper is for governed returning-athlete maintenance
    navigation. It does not set new=1.

    First-time athlete routing must use the complete destination
    published by Authentication Service.
    */

    let destination =
      appendParams(
        "snapshot-intake.html",
        {
          from:
            clean(options.from) ||
            getCurrentPage(),

          next:
            clean(options.next) ||
            "athlete-dashboard.html"
        }
      );

    const snapshotId =
      clean(options.snapshot_id) ||
      getSnapshotId();

    if (snapshotId) {
      destination = withSnapshot(
        destination,
        snapshotId
      );
    }

    return navigate(destination, {
      replace:
        options.replace === true
    });
  }

  async function goToRoleDashboard(
    options = {}
  ) {
    const role = getRole();

    if (!isProfessionalRole(role)) {
      const result = {
        ok: false,
        status:
          "PROFESSIONAL_CONTEXT_REQUIRED",
        role
      };

      recordError(
        result.status,
        "Role Dashboard navigation requires an authenticated professional role.",
        result
      );

      return result;
    }

    return navigate(
      "role-dashboard.html",
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToSystem(
    options = {}
  ) {
    if (getRole() !== "admin") {
      const result = {
        ok: false,
        status:
          "ADMINISTRATOR_CONTEXT_REQUIRED"
      };

      recordError(
        result.status,
        "System navigation requires authenticated administrator context."
      );

      return result;
    }

    return navigate(
      "system.html",
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToVerification(
    snapshotId = getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Verification navigation",
        snapshotId
      );

    if (!context.ok) {
      return context;
    }

    return navigate(
      withSnapshot(
        "verification.html",
        context.snapshot_id
      ),
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToEligibility(
    snapshotId = getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Eligibility navigation",
        snapshotId
      );

    if (!context.ok) {
      return context;
    }

    return navigate(
      withSnapshot(
        "eligibility.html",
        context.snapshot_id
      ),
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToReadiness(
    snapshotId = getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Readiness navigation",
        snapshotId
      );

    if (!context.ok) {
      return context;
    }

    return navigate(
      withSnapshot(
        "readiness.html",
        context.snapshot_id
      ),
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToMultiBox(
    snapshotId = getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Multi-Box navigation",
        snapshotId
      );

    if (!context.ok) {
      return context;
    }

    return navigate(
      withSnapshot(
        "multi-box.html",
        context.snapshot_id
      ),
      {
        replace:
          options.replace === true
      }
    );
  }

  async function goToCrystal(
    snapshotId = getSnapshotId(),
    options = {}
  ) {
    const context =
      requireSnapshotContext(
        "Crystal Registry navigation",
        snapshotId
      );

    if (!context.ok) {
      return context;
    }

    return navigate(
      withSnapshot(
        "crystal-registry.html",
        context.snapshot_id
      ),
      {
        replace:
          options.replace === true
      }
    );
  }

  function hydrateSnapshotLinks() {
    const snapshotId =
      getSnapshotId();

    if (!snapshotId) {
      return 0;
    }

    let count = 0;

    document
      .querySelectorAll(
        "[data-snapshot-link]"
      )
      .forEach(element => {
        const destination =
          element.getAttribute("href") ||
          element.dataset.snapshotLink ||
          "";

        const normalized =
          normalizeDestination(
            destination
          );

        if (!normalized.valid) {
          return;
        }

        element.setAttribute(
          "href",
          withSnapshot(
            normalized.normalized,
            snapshotId
          )
        );

        count += 1;
      });

    return count;
  }

  /*
  Compatibility function retained intentionally.

  It no longer appends role or role_id into URLs.
  Role context must be consumed from Authentication Context or
  Runtime Context by downstream pages.
  */

  function hydrateRoleLinks() {
    return 0;
  }

  function markActiveNav() {
    const currentPage =
      getCurrentPage();

    let count = 0;

    document
      .querySelectorAll("a")
      .forEach(link => {
        const href =
          link.getAttribute("href") || "";

        if (!clean(href)) {
          return;
        }

        const normalized =
          normalizeDestination(href);

        if (!normalized.valid) {
          return;
        }

        if (
          normalized.page ===
          currentPage
        ) {
          link.classList.add("active");

          link.setAttribute(
            "aria-current",
            "page"
          );

          count += 1;
        }
      });

    return count;
  }

  function bindNavigationElements(
    selector =
      "[data-route-destination]"
  ) {
    if (NAVIGATION_ELEMENTS_BOUND) {
      return 0;
    }

    NAVIGATION_ELEMENTS_BOUND = true;

    let count = 0;

    document
      .querySelectorAll(selector)
      .forEach(element => {
        if (
          element.dataset
            .routingBound === "true"
        ) {
          return;
        }

        element.dataset.routingBound =
          "true";

        element.addEventListener(
          "click",
          async event => {
            event.preventDefault();

            const destination =
              element.getAttribute(
                "data-route-destination"
              ) ||
              element.dataset
                .routeDestination ||
              element.getAttribute("href") ||
              "";

            if (!clean(destination)) {
              recordWarning(
                "NAVIGATION_ELEMENT_DESTINATION_MISSING",
                "A governed navigation element has no destination."
              );

              return;
            }

            await navigate(destination);
          }
        );

        count += 1;
      });

    return count;
  }

  function getRoomContext() {
    const role = getRole();
    const page = getCurrentPage();

    return {
      engine_id: ENGINE_ID,
      version: VERSION,

      runtime_id:
        getRuntimeId() || null,

      session_id:
        getSessionId() || null,

      user_id:
        getUserId() || null,

      role:
        role || null,

      role_id:
        getRoleId() || null,

      page_id: page,
      route: getCurrentRoute(),

      snapshot_id:
        getSnapshotId() || null,

      athlete_id:
        getAthleteId() || null,

      active_workspace_id:
        clean(
          STATE.runtime_context
            ?.active_workspace_id
        ) || null,

      entry_intent:
        clean(
          STATE.runtime_context
            ?.entry_intent ||
          STATE.authentication_context
            ?.entry_intent
        ) || null,

      requested_destination:
        clean(
          STATE.authentication_context
            ?.requested_destination
        ) || null,

      dashboard:
        dashboardForRole(role) ||
        null,

      is_professional:
        isProfessionalRole(role),

      is_public_route:
        isPublicRoute(page),

      registered_route:
        STATE.registered_routes.includes(
          page
        ),

      established_at:
        nowISO()
    };
  }

  function exposeRoomContext() {
    STATE.room_context =
      getRoomContext();

    STATE.updated_at = nowISO();

    const publicContext =
      clone(STATE.room_context);

    window.STATScoreRoomContext =
      publicContext;

    window.STATScore =
      window.STATScore || {};

    window.STATScore.RoomContext =
      clone(publicContext);

    publishState();

    emit(
      "room_context_published",
      {
        room_context:
          clone(publicContext)
      }
    );

    return publicContext;
  }

  function runHealthCheck() {
    const authenticationValidation =
      validateAuthenticationContext(
        STATE.authentication_context
      );

    const currentPage =
      getCurrentPage();

    return {
      ok:
        STATE.initialized === true &&
        authenticationValidation.valid &&
        STATE.registered_routes.includes(
          currentPage
        ),

      engine_id: ENGINE_ID,
      version: VERSION,
      owner_stream: OWNER_STREAM,

      initialization_status:
        STATE.initialization_status,

      authentication_context_valid:
        authenticationValidation.valid,

      runtime_context_available:
        !!STATE.runtime_context,

      active_role:
        getRole() || null,

      active_role_id:
        getRoleId() || null,

      current_page:
        currentPage,

      current_page_registered:
        STATE.registered_routes.includes(
          currentPage
        ),

      registered_route_count:
        STATE.registered_routes.length,

      access_authority_available:
        typeof CONFIGURATION
          .accessDecisionResolver ===
        "function",

      last_validation:
        clone(STATE.last_validation),

      last_access_decision:
        clone(
          STATE.last_access_decision
        ),

      last_navigation:
        clone(STATE.last_navigation),

      error_count:
        STATE.errors.length,

      warning_count:
        STATE.warnings.length,

      checked_at:
        nowISO()
    };
  }

  async function init(options = {}) {
    if (
      STATE.initialized &&
      options.force_reload !== true
    ) {
      return {
        ok: true,
        status:
          "ROUTING_ALREADY_INITIALIZED",
        state: getState()
      };
    }

    if (
      options.force_reload === true
    ) {
      STATE =
        createDefaultState();
    }

    if (options.configuration) {
      configure(
        options.configuration
      );
    }

    STATE.initialization_status =
      "CONTEXT_RESOLUTION_PENDING";

    STATE.updated_at = nowISO();

    publishState();

    const authenticationContext =
      await resolveAuthenticationContext(
        options.authentication_context ||
        options.authenticationContext ||
        null
      );

    const authenticationValidation =
      validateAuthenticationContext(
        authenticationContext
      );

    if (
      !authenticationValidation.valid
    ) {
      STATE.initialized = false;

      STATE.initialization_status =
        "AUTHENTICATION_CONTEXT_REJECTED";

      STATE.updated_at = nowISO();

      publishState();

      authenticationValidation.errors.forEach(
        message => {
          recordError(
            "ROUTING_AUTHENTICATION_CONTEXT_INVALID",
            message
          );
        }
      );

      emit(
        "initialization_blocked",
        {
          validation_errors:
            clone(
              authenticationValidation
                .errors
            )
        }
      );

      return {
        ok: false,
        status:
          "ROUTING_INITIALIZATION_BLOCKED",

        errors:
          clone(
            authenticationValidation
              .errors
          ),

        state: getState()
      };
    }

    STATE.authentication_context =
      normalizeAuthenticationContext(
        authenticationContext
      );

    const runtimeContext =
      await resolveRuntimeContext(
        options.runtime_context ||
        options.runtimeContext ||
        null
      );

    STATE.runtime_context =
      normalizeRuntimeContext(
        runtimeContext
      );

    if (
      STATE.runtime_context
        ?.session_id &&
      STATE.runtime_context
        .session_id !==
        STATE.authentication_context
          .session_id
    ) {
      STATE.initialized = false;

      STATE.initialization_status =
        "CONTEXT_MISMATCH_BLOCKED";

      recordError(
        "ROUTING_SESSION_CONTEXT_MISMATCH",
        "Runtime Context session_id does not match Initial Authentication Context session_id.",
        {
          authentication_session_id:
            STATE.authentication_context
              .session_id,

          runtime_session_id:
            STATE.runtime_context
              .session_id
        }
      );

      return {
        ok: false,
        status:
          "ROUTING_CONTEXT_MISMATCH_BLOCKED",
        state: getState()
      };
    }

    if (
      STATE.runtime_context?.user_id &&
      STATE.runtime_context.user_id !==
        STATE.authentication_context
          .user_id
    ) {
      STATE.initialized = false;

      STATE.initialization_status =
        "CONTEXT_MISMATCH_BLOCKED";

      recordError(
        "ROUTING_USER_CONTEXT_MISMATCH",
        "Runtime Context user_id does not match Initial Authentication Context user_id.",
        {
          authentication_user_id:
            STATE.authentication_context
              .user_id,

          runtime_user_id:
            STATE.runtime_context
              .user_id
        }
      );

      return {
        ok: false,
        status:
          "ROUTING_CONTEXT_MISMATCH_BLOCKED",
        state: getState()
      };
    }

    if (
      STATE.runtime_context?.role &&
      normalizeRole(
        STATE.runtime_context.role
      ) !==
        normalizeRole(
          STATE.authentication_context
            .role
        )
    ) {
      STATE.initialized = false;

      STATE.initialization_status =
        "CONTEXT_MISMATCH_BLOCKED";

      recordError(
        "ROUTING_ROLE_CONTEXT_MISMATCH",
        "Runtime Context role does not match Initial Authentication Context role.",
        {
          authentication_role:
            STATE.authentication_context
              .role,

          runtime_role:
            STATE.runtime_context.role
        }
      );

      return {
        ok: false,
        status:
          "ROUTING_CONTEXT_MISMATCH_BLOCKED",
        state: getState()
      };
    }

    await resolveRegisteredRoutes();

    STATE.initialized = true;

    STATE.initialization_status =
      "INITIALIZED";

    STATE.initialized_at =
      STATE.initialized_at ||
      nowISO();

    STATE.updated_at = nowISO();

    publishState();

    if (
      CONFIGURATION
        .hydrateSnapshotLinks &&
      options.hydrate_links !== false
    ) {
      hydrateSnapshotLinks();
    }

    if (
      CONFIGURATION
        .markActiveNavigation &&
      options.mark_active_nav !==
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
        options.navigation_selector ||
        "[data-route-destination]"
      );
    }

    exposeRoomContext();

    recordNavigationEvent(
      "ROUTING_ENGINE_INITIALIZED",
      {
        session_id:
          STATE.authentication_context
            .session_id,

        user_id:
          STATE.authentication_context
            .user_id,

        role:
          STATE.authentication_context
            .role,

        current_page:
          getCurrentPage(),

        requested_destination:
          STATE.authentication_context
            .requested_destination,

        registered_route_count:
          STATE.registered_routes
            .length
      }
    );

    emit("engine_online", {
      status: "ONLINE",
      current_page:
        getCurrentPage()
    });

    log(
      "Governed routing authority initialized.",
      {
        engine_id: ENGINE_ID,
        version: VERSION,

        current_page:
          getCurrentPage(),

        role:
          getRole(),

        requested_destination:
          STATE.authentication_context
            .requested_destination
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
      ok: true,
      status:
        "ROUTING_INITIALIZED",

      room_context:
        clone(STATE.room_context),

      state: getState()
    };
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,
      owner_stream: OWNER_STREAM,

      PROFESSIONAL_ROLES,
      ALL_ROLES,
      PUBLIC_ROUTES,
      CORE_REGISTERED_ROUTES,
      ROLE_DASHBOARDS,

      configure,
      getConfiguration,

      init,

      getCurrentPage,
      getCurrentRoute,
      getQueryParam,

      normalizeRole,
      isValidRole,
      isProfessionalRole,
      isPublicRoute,

      getRole,
      getRoleId,
      getSnapshotId,
      getAthleteId,
      getRuntimeId,
      getSessionId,
      getUserId,

      dashboardForRole,

      parseDestination,
      normalizeDestination,
      appendParams,
      removeParams,
      withSnapshot,
      withRuntimeContext,

      resolveRegisteredRoutes,
      isRegisteredRoute,

      /*
      Public destination validation always applies governed access
      enforcement for non-public pages.
      */
      validateDestination:
        validateGeneralDestination,

      navigate,
      navigateAuthorizedDestination,
      navigateToDashboard,

      goToProfile,
      goToSnapshotIntake,
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

      getRoomContext,
      exposeRoomContext,

      runHealthCheck,
      getState
    };

    window.STATScoreRouting = api;

    window.STATScore =
      window.STATScore || {};

    window.STATScore.Routing = api;

    publishState();

    emit("engine_loaded", {
      status:
        "WAITING_FOR_CONTEXT"
    });

    log(
      "Routing engine loaded and waiting for governed initialization.",
      {
        engine_id: ENGINE_ID,
        version: VERSION
      }
    );

    return api;
  }

  expose();

  /*
  ========================================================
  INITIALIZATION DOCTRINE
  ========================================================

  This file deliberately does not:

  - infer role from URL parameters
  - infer role from sessionStorage
  - infer role from localStorage
  - establish role from button attributes
  - accept caller-manufactured access decisions
  - allow callers to bypass protected-route access evaluation
  - expose role_id through navigation URLs
  - automatically redirect on DOMContentLoaded

  It must be initialized after Initial Authentication Context is
  available and, where applicable, after Stream 8 has published
  Initial Runtime Context.

  Standard initialization:

  await window.STATScoreRouting.init({
    authentication_context: approvedAuthenticationContext,
    runtime_context: approvedRuntimeContext,
    configuration: {
      accessDecisionResolver:
        governedAccessDecisionResolver
    }
  });

  Login completion:

  await window.STATScoreRouting.init({
    authentication_context: approvedAuthenticationContext,
    runtime_context: approvedRuntimeContext,
    configuration: {
      accessDecisionResolver:
        governedAccessDecisionResolver
    }
  });

  await window.STATScoreRouting
    .navigateAuthorizedDestination();

  Or:

  await window.STATScoreRouting.init({
    authentication_context: approvedAuthenticationContext,
    runtime_context: approvedRuntimeContext,
    configuration: {
      accessDecisionResolver:
        governedAccessDecisionResolver
    },
    navigate_authorized_destination: true
  });

  Authentication Service must determine whether the user is:

  - a first-time athlete
  - a returning athlete
  - a first-time professional
  - a returning professional
  - an administrator

  and must publish the complete resulting destination as
  requested_destination.

  Routing validates and executes that decision. It does not
  recreate it.
  ========================================================
  */
})(); 
