/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-engine-bus.js

Asset Type:
JavaScript Infrastructure / Governed Runtime Event Bus

Owner Authority:
Stream 8 — Enterprise Runtime Operations & Self-Healing Authority

Primary Operational Authority:
Stream 8 — Enterprise Runtime Operations & Self-Healing Authority

Layer:
Enterprise Runtime Infrastructure / Engine Communication

Runtime Consumer Boundary:
Consumes an approved Initial Runtime Context.
Consumes engine identity and dependency metadata from the
governed Engine Registry Authority.

Primary Consumers:
- statscore-runtime-state-engine.js
- statscore-engine-registry.js
- statscore-engine-loader.js
- statscore-engine-execution.js
- statscore-engine-health.js
- statscore-self-healing-engine.js
- governed runtime engines
- system diagnostics

Purpose:
Provides governed runtime event transport, engine heartbeat
observation, runtime error reporting, dependency-status
observation, bounded event history, and runtime communication
support after Runtime Authority initialization.

Consumes:
- Initial Runtime Context
- Engine Registry Authority
- governed engine identity metadata
- governed dependency metadata
- governed runtime safe-mode decisions

Provides:
- runtime event dispatch
- runtime event subscriptions
- engine heartbeat observation
- engine error observation
- dependency verification results
- bounded operational history
- immutable status snapshots
- health diagnostics
- controlled safe-mode state publication

Primary IDs:
- runtime_id
- session_id
- user_id
- engine_id
- event_id

Cross-Stream Dependencies:
Consumes engine and dependency metadata from the Engine Registry.
Consumes runtime authority from Stream 8.
May transport events for all governed Streams.
May not implement another Stream's business logic.

Does NOT:
- authenticate users
- create Authentication Context
- create Runtime Context
- manufacture runtime_id
- own engine registration
- own dependency definitions
- load JavaScript assets
- execute engine business logic
- calculate athlete intelligence
- calculate scores
- authorize navigation
- execute routing
- grant access
- repair runtime state
- create immutable enterprise receipts
- modify Supabase records
- automatically boot on script load

Status:
CONTROLLED V2 RUNTIME-COMMUNICATION RECONSTRUCTION

==========================================================
*/

/*
============================================================
STATS-CORE™ Governed Engine Bus
File: statscore-engine-bus.js
Version: STATSCORE-ENGINE-BUS-V2

Constitutional Runtime Sequence:

Authentication Authority
        ↓
Initial Authentication Context
        ↓
Runtime Authority
        ↓
Initial Runtime Context
        ↓
Engine Registry Authority
        ↓
Engine Loader / Engine Execution
        ↓
Engine Bus Initialization
        ↓
Governed Runtime Communication

Authority Separation:

Engine Registry Authority
- owns engine registration
- owns engine identity metadata
- owns dependency definitions
- publishes engine lookup services

Engine Loader
- loads approved engine assets

Engine Execution
- coordinates governed engine execution

Engine Bus
- transports runtime events
- observes heartbeats
- records runtime error observations
- verifies dependency availability through Engine Registry
- publishes bounded runtime communication state

Runtime Authority
- owns Runtime Context
- authorizes runtime lifecycle state
- authorizes safe-mode transitions

The Engine Bus does not self-start.
It remains dormant until explicitly initialized and booted by
the governed runtime lifecycle.
============================================================
*/

(function () {
  "use strict";

  const ENGINE_ID = "statscore-engine-bus";
  const VERSION = "STATSCORE-ENGINE-BUS-V2";
  const AUTHORITY_ID =
    "stream-8-enterprise-runtime-engine-bus";
  const AUTHORITY_TYPE =
    "GOVERNED_RUNTIME_EVENT_BUS";

  const STATUS = Object.freeze({
    LOADED: "LOADED",
    INITIALIZING: "INITIALIZING",
    INITIALIZED: "INITIALIZED",
    BOOTING: "BOOTING",
    ONLINE: "ONLINE",
    SAFE_MODE: "SAFE_MODE",
    OFFLINE: "OFFLINE",
    INITIALIZATION_BLOCKED: "INITIALIZATION_BLOCKED",
    SHUTDOWN: "SHUTDOWN"
  });

  const ENGINE_HEALTH_STATUS = Object.freeze({
    UNKNOWN: "UNKNOWN",
    OBSERVED: "OBSERVED",
    ALIVE: "ALIVE",
    DEGRADED: "DEGRADED",
    ERROR: "ERROR",
    DEPENDENCY_FAILURE: "DEPENDENCY_FAILURE",
    UNREGISTERED: "UNREGISTERED"
  });

  const DEFAULT_LIMITS = Object.freeze({
    event_history: 250,
    error_history_per_engine: 100,
    warning_history: 100,
    lifecycle_history: 100
  });

  const REQUIRED_RUNTIME_FIELDS = Object.freeze([
    "runtime_id",
    "session_id",
    "user_id"
  ]);

  const CONFIGURATION = {
    runtimeContextResolver: null,
    engineRegistryResolver: null,
    safeModeDecisionValidator: null,

    eventHistoryLimit:
      DEFAULT_LIMITS.event_history,

    errorHistoryPerEngineLimit:
      DEFAULT_LIMITS.error_history_per_engine,

    warningHistoryLimit:
      DEFAULT_LIMITS.warning_history,

    lifecycleHistoryLimit:
      DEFAULT_LIMITS.lifecycle_history
  };

  let CONFIGURATION_LOCKED = false;

  let STATE = createDefaultState();

  /*
  ========================================================
  STATE
  ========================================================
  */

  function createDefaultState() {
    return {
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,

      status: STATUS.LOADED,

      initialized: false,
      booted: false,
      configuration_locked: false,

      loaded_at: nowISO(),
      initialized_at: null,
      booted_at: null,
      shutdown_at: null,
      updated_at: nowISO(),

      runtime_context: null,

      registry_status: {
        available: false,
        authority_id: null,
        authority_type: null,
        checked_at: null
      },

      engine_health: {},
      events: [],
      warnings: [],
      lifecycle_events: [],

      safe_mode: {
        active: false,
        reason: null,
        authority_id: null,
        authority_type: null,
        decided_at: null,
        activated_at: null
      },

      last_dependency_check: null,
      last_error: null
    };
  }

  /*
  ========================================================
  UTILITIES
  ========================================================
  */

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    return String(value ?? "").trim();
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

  function deepFreeze(value) {
    if (
      value === null ||
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

  function createId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function trimArray(array, limit) {
    if (!Array.isArray(array)) {
      return [];
    }

    if (array.length <= limit) {
      return array;
    }

    array.splice(0, array.length - limit);

    return array;
  }

  function normalizeEngineName(engineName) {
    return clean(engineName);
  }

  function isPlainObject(value) {
    return (
      !!value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function publishState() {
    const publishedState = buildPublishedState();

    window.STATScoreEngineBusState =
      clone(publishedState);

    window.STATScore =
      window.STATScore || {};

    window.STATScore.EngineBusState =
      clone(publishedState);

    return clone(publishedState);
  }

  function buildPublishedState() {
    return {
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,

      status: STATE.status,
      initialized: STATE.initialized,
      booted: STATE.booted,

      configuration_locked:
        CONFIGURATION_LOCKED,

      loaded_at: STATE.loaded_at,
      initialized_at: STATE.initialized_at,
      booted_at: STATE.booted_at,
      shutdown_at: STATE.shutdown_at,
      updated_at: STATE.updated_at,

      runtime_id:
        STATE.runtime_context?.runtime_id ||
        null,

      session_id:
        STATE.runtime_context?.session_id ||
        null,

      user_id:
        STATE.runtime_context?.user_id ||
        null,

      role:
        STATE.runtime_context?.role ||
        null,

      registry_status:
        clone(STATE.registry_status),

      engine_health:
        clone(STATE.engine_health),

      recent_events:
        clone(
          STATE.events.slice(
            -Math.min(
              25,
              CONFIGURATION.eventHistoryLimit
            )
          )
        ),

      warnings:
        clone(STATE.warnings),

      lifecycle_events:
        clone(STATE.lifecycle_events),

      safe_mode:
        clone(STATE.safe_mode),

      last_dependency_check:
        clone(STATE.last_dependency_check),

      last_error:
        clone(STATE.last_error)
    };
  }

  function getState() {
    return clone(STATE);
  }

  /*
  ========================================================
  INTERNAL EVENT TRANSPORT
  ========================================================
  */

  function dispatchWindowEvent(
    eventName,
    detail
  ) {
    window.dispatchEvent(
      new CustomEvent(
        `statscore:${eventName}`,
        {
          detail: clone(detail)
        }
      )
    );
  }

  function emitLifecycleEvent(
    eventType,
    payload = {}
  ) {
    const lifecycleEvent = {
      lifecycle_event_id:
        createId("sc_bus_lifecycle"),

      event_type: clean(eventType),

      runtime_id:
        STATE.runtime_context?.runtime_id ||
        null,

      payload: clone(payload),

      created_at: nowISO()
    };

    STATE.lifecycle_events.push(
      lifecycleEvent
    );

    trimArray(
      STATE.lifecycle_events,
      CONFIGURATION.lifecycleHistoryLimit
    );

    STATE.updated_at = nowISO();

    dispatchWindowEvent(
      `engine_bus:${eventType}`,
      lifecycleEvent
    );

    publishState();

    return clone(lifecycleEvent);
  }

  function recordWarning(
    code,
    message,
    payload = null
  ) {
    const warning = {
      warning_id:
        createId("sc_bus_warning"),

      code:
        clean(code) ||
        "ENGINE_BUS_WARNING",

      message:
        clean(message) ||
        "Engine Bus warning.",

      runtime_id:
        STATE.runtime_context?.runtime_id ||
        null,

      payload: clone(payload),

      created_at: nowISO()
    };

    STATE.warnings.push(warning);

    trimArray(
      STATE.warnings,
      CONFIGURATION.warningHistoryLimit
    );

    STATE.updated_at = nowISO();

    console.warn(
      `[STATS-CORE Engine Bus] ${warning.code}: ${warning.message}`,
      payload || ""
    );

    dispatchWindowEvent(
      "engine_bus:warning",
      warning
    );

    publishState();

    return clone(warning);
  }

  function recordInternalError(
    code,
    message,
    payload = null
  ) {
    const errorRecord = {
      error_id:
        createId("sc_bus_error"),

      code:
        clean(code) ||
        "ENGINE_BUS_ERROR",

      message:
        clean(message) ||
        "Engine Bus error.",

      runtime_id:
        STATE.runtime_context?.runtime_id ||
        null,

      payload: clone(payload),

      created_at: nowISO()
    };

    STATE.last_error =
      clone(errorRecord);

    STATE.updated_at = nowISO();

    console.error(
      `[STATS-CORE Engine Bus] ${errorRecord.code}: ${errorRecord.message}`,
      payload || ""
    );

    dispatchWindowEvent(
      "engine_bus:error",
      errorRecord
    );

    publishState();

    return clone(errorRecord);
  }

  /*
  ========================================================
  CONFIGURATION
  ========================================================
  */

  function configure(options = {}) {
    if (CONFIGURATION_LOCKED) {
      throw new Error(
        "Engine Bus configuration is locked for the active runtime."
      );
    }

    const resolverFields = [
      "runtimeContextResolver",
      "engineRegistryResolver",
      "safeModeDecisionValidator"
    ];

    resolverFields.forEach(field => {
      if (
        !Object.prototype.hasOwnProperty.call(
          options,
          field
        )
      ) {
        return;
      }

      const value = options[field];

      if (
        value !== null &&
        typeof value !== "function"
      ) {
        throw new TypeError(
          `${field} must be a function or null.`
        );
      }

      CONFIGURATION[field] = value;
    });

    const numericFields = [
      "eventHistoryLimit",
      "errorHistoryPerEngineLimit",
      "warningHistoryLimit",
      "lifecycleHistoryLimit"
    ];

    numericFields.forEach(field => {
      if (
        !Object.prototype.hasOwnProperty.call(
          options,
          field
        )
      ) {
        return;
      }

      const value = Number(options[field]);

      if (
        !Number.isInteger(value) ||
        value <= 0
      ) {
        throw new TypeError(
          `${field} must be a positive integer.`
        );
      }

      CONFIGURATION[field] = value;
    });

    return getConfiguration();
  }

  function getConfiguration() {
    return {
      configuration_locked:
        CONFIGURATION_LOCKED,

      has_runtime_context_resolver:
        typeof CONFIGURATION
          .runtimeContextResolver ===
        "function",

      has_engine_registry_resolver:
        typeof CONFIGURATION
          .engineRegistryResolver ===
        "function",

      has_safe_mode_decision_validator:
        typeof CONFIGURATION
          .safeModeDecisionValidator ===
        "function",

      event_history_limit:
        CONFIGURATION.eventHistoryLimit,

      error_history_per_engine_limit:
        CONFIGURATION
          .errorHistoryPerEngineLimit,

      warning_history_limit:
        CONFIGURATION.warningHistoryLimit,

      lifecycle_history_limit:
        CONFIGURATION.lifecycleHistoryLimit
    };
  }

  /*
  ========================================================
  RUNTIME CONTEXT CONSUMPTION
  ========================================================
  */

  function getRuntimeContextFromWindow() {
    const runtimeAuthority =
      window.STATScoreRuntimeStateEngine ||
      window.STATScore?.RuntimeStateEngine ||
      null;

    return (
      runtimeAuthority
        ?.getInitialRuntimeContext?.() ||

      runtimeAuthority
        ?.getRuntimeContext?.() ||

      runtimeAuthority
        ?.getState?.()
        ?.initial_runtime_context ||

      window.STATScoreInitialRuntimeContext ||

      window.STATScore
        ?.InitialRuntimeContext ||

      null
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

  function normalizeRuntimeContext(
    runtimeContext
  ) {
    if (!isPlainObject(runtimeContext)) {
      return null;
    }

    return {
      runtime_id:
        clean(runtimeContext.runtime_id) ||
        null,

      session_id:
        clean(runtimeContext.session_id) ||
        null,

      user_id:
        clean(runtimeContext.user_id) ||
        null,

      role:
        clean(runtimeContext.role)
          .toLowerCase() ||
        null,

      role_id:
        clean(runtimeContext.role_id) ||
        null,

      active_workspace_id:
        clean(
          runtimeContext
            .active_workspace_id
        ) ||
        clean(
          runtimeContext.workspace_id
        ) ||
        null,

      active_snapshot_id:
        clean(
          runtimeContext
            .active_snapshot_id
        ) ||
        clean(
          runtimeContext.snapshot_id
        ) ||
        null,

      active_athlete_id:
        clean(
          runtimeContext
            .active_athlete_id
        ) ||
        clean(
          runtimeContext.athlete_id
        ) ||
        null,

      organization_id:
        clean(
          runtimeContext.organization_id
        ) ||
        null,

      system_state:
        clean(
          runtimeContext.system_state
        ) ||
        null,

      established_at:
        clean(
          runtimeContext.established_at
        ) ||
        clean(
          runtimeContext.initialized_at
        ) ||
        null
    };
  }

  function validateRuntimeContext(
    runtimeContext
  ) {
    const errors = [];

    if (!isPlainObject(runtimeContext)) {
      return {
        valid: false,
        errors: [
          "Initial Runtime Context is unavailable or invalid."
        ]
      };
    }

    REQUIRED_RUNTIME_FIELDS.forEach(
      field => {
        if (
          clean(runtimeContext[field]) ===
          ""
        ) {
          errors.push(
            `Initial Runtime Context is missing required field: ${field}`
          );
        }
      }
    );

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /*
  ========================================================
  ENGINE REGISTRY CONSUMPTION
  ========================================================
  */

  function getEngineRegistryFromWindow() {
    return (
      window.STATScoreEngineRegistry ||
      window.STATScore?.EngineRegistry ||
      window.STATSCORE_ENGINE_REGISTRY ||
      null
    );
  }

  async function resolveEngineRegistry() {
    if (
      typeof CONFIGURATION
        .engineRegistryResolver ===
      "function"
    ) {
      return (
        await CONFIGURATION
          .engineRegistryResolver()
      ) || null;
    }

    return getEngineRegistryFromWindow();
  }

  function inspectRegistryAuthority(
    registry
  ) {
    if (!registry) {
      return {
        valid: false,
        errors: [
          "Engine Registry Authority is unavailable."
        ]
      };
    }

    const hasLookup =
      typeof registry.hasEngine ===
        "function" ||
      typeof registry.isRegisteredEngine ===
        "function" ||
      typeof registry.getEngine ===
        "function";

    if (!hasLookup) {
      return {
        valid: false,
        errors: [
          "Engine Registry Authority does not expose a supported engine lookup contract."
        ]
      };
    }

    return {
      valid: true,
      errors: []
    };
  }

  async function getEngineRegistry() {
    const registry =
      await resolveEngineRegistry();

    return registry || null;
  }

  async function registryHasEngine(
    engineName
  ) {
    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      return false;
    }

    const registry =
      await getEngineRegistry();

    if (!registry) {
      return false;
    }

    if (
      typeof registry.hasEngine ===
      "function"
    ) {
      return (
        registry.hasEngine(normalized) ===
        true
      );
    }

    if (
      typeof registry
        .isRegisteredEngine ===
      "function"
    ) {
      return (
        registry
          .isRegisteredEngine(
            normalized
          ) === true
      );
    }

    if (
      typeof registry.getEngine ===
      "function"
    ) {
      return !!registry.getEngine(
        normalized
      );
    }

    return false;
  }

  async function registryGetEngine(
    engineName
  ) {
    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      return null;
    }

    const registry =
      await getEngineRegistry();

    if (
      !registry ||
      typeof registry.getEngine !==
        "function"
    ) {
      return null;
    }

    return (
      await registry.getEngine(
        normalized
      )
    ) || null;
  }

  async function registryGetDependencies(
    engineName
  ) {
    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      return [];
    }

    const registry =
      await getEngineRegistry();

    if (!registry) {
      return [];
    }

    if (
      typeof registry.getDependencies ===
      "function"
    ) {
      const dependencies =
        await registry.getDependencies(
          normalized
        );

      return Array.isArray(dependencies)
        ? clone(dependencies)
        : [];
    }

    const engineMetadata =
      typeof registry.getEngine ===
        "function"
        ? await registry.getEngine(
            normalized
          )
        : null;

    const dependencies =
      engineMetadata
        ?.dependencies ||
      engineMetadata
        ?.required_dependencies ||
      [];

    return Array.isArray(dependencies)
      ? clone(dependencies)
      : [];
  }

  /*
  ========================================================
  CANONICAL EVENT BUS
  ========================================================
  */

  function requireOnline(operationName) {
    if (
      !STATE.initialized ||
      !STATE.booted ||
      (
        STATE.status !== STATUS.ONLINE &&
        STATE.status !== STATUS.SAFE_MODE
      )
    ) {
      recordWarning(
        "ENGINE_BUS_NOT_ONLINE",
        `${operationName} requires an initialized and booted Engine Bus.`,
        {
          status: STATE.status
        }
      );

      return false;
    }

    return true;
  }

  function emit(
    eventName,
    payload = {},
    options = {}
  ) {
    if (!requireOnline("emit")) {
      return null;
    }

    const normalizedEventName =
      clean(eventName);

    if (!normalizedEventName) {
      recordWarning(
        "EVENT_NAME_INVALID",
        "Engine Bus event name is required."
      );

      return null;
    }

    const sourceEngine =
      normalizeEngineName(
        options.source_engine ||
        options.sourceEngine ||
        ""
      ) || null;

    const eventObject = {
      event_id:
        createId("sc_runtime_event"),

      event_name:
        normalizedEventName,

      runtime_id:
        STATE.runtime_context.runtime_id,

      session_id:
        STATE.runtime_context.session_id,

      source_engine:
        sourceEngine,

      payload:
        clone(payload),

      created_at:
        nowISO()
    };

    STATE.events.push(eventObject);

    trimArray(
      STATE.events,
      CONFIGURATION.eventHistoryLimit
    );

    STATE.updated_at = nowISO();

    dispatchWindowEvent(
      normalizedEventName,
      eventObject
    );

    publishState();

    return clone(eventObject);
  }

  function on(
    eventName,
    callback,
    options = {}
  ) {
    const normalizedEventName =
      clean(eventName);

    if (
      !normalizedEventName ||
      typeof callback !== "function"
    ) {
      return null;
    }

    const listener = event => {
      callback(
        clone(
          event.detail?.payload ??
          event.detail
        ),
        clone(event.detail)
      );
    };

    window.addEventListener(
      `statscore:${normalizedEventName}`,
      listener,
      options
    );

    return function unsubscribe() {
      window.removeEventListener(
        `statscore:${normalizedEventName}`,
        listener,
        options
      );

      return true;
    };
  }

  function once(
    eventName,
    callback
  ) {
    return on(
      eventName,
      callback,
      { once: true }
    );
  }

  /*
  ========================================================
  ENGINE OBSERVATION
  ========================================================
  */

  async function heartbeat(
    engineName,
    details = {}
  ) {
    if (!requireOnline("heartbeat")) {
      return {
        ok: false,
        status:
          "ENGINE_BUS_NOT_ONLINE"
      };
    }

    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      return {
        ok: false,
        status:
          "ENGINE_NAME_INVALID"
      };
    }

    const registered =
      await registryHasEngine(
        normalized
      );

    if (!registered) {
      STATE.engine_health[normalized] = {
        engine_name: normalized,
        status:
          ENGINE_HEALTH_STATUS
            .UNREGISTERED,

        last_seen: nowISO(),
        heartbeat_count: 0,
        errors: [],

        runtime_id:
          STATE.runtime_context.runtime_id
      };

      STATE.updated_at = nowISO();

      recordWarning(
        "UNREGISTERED_ENGINE_HEARTBEAT",
        "Heartbeat rejected because the engine is not registered by the Engine Registry Authority.",
        {
          engine: normalized
        }
      );

      return {
        ok: false,
        engine: normalized,
        status:
          "ENGINE_NOT_REGISTERED"
      };
    }

    const current =
      STATE.engine_health[normalized] ||
      {
        engine_name: normalized,
        status:
          ENGINE_HEALTH_STATUS
            .OBSERVED,

        last_seen: null,
        heartbeat_count: 0,
        errors: [],

        runtime_id:
          STATE.runtime_context.runtime_id
      };

    current.status =
      ENGINE_HEALTH_STATUS.ALIVE;

    current.last_seen = nowISO();

    current.heartbeat_count =
      Number(
        current.heartbeat_count || 0
      ) + 1;

    current.details =
      clone(details);

    current.runtime_id =
      STATE.runtime_context.runtime_id;

    STATE.engine_health[normalized] =
      current;

    STATE.updated_at = nowISO();

    const event = emit(
      "engine_heartbeat",
      {
        engine: normalized,
        heartbeat_count:
          current.heartbeat_count,
        details: clone(details)
      },
      {
        source_engine: normalized
      }
    );

    publishState();

    return {
      ok: true,
      engine: normalized,
      status:
        ENGINE_HEALTH_STATUS.ALIVE,

      heartbeat_count:
        current.heartbeat_count,

      event
    };
  }

  async function reportError(
    engineName,
    error,
    context = {}
  ) {
    if (!requireOnline("reportError")) {
      return null;
    }

    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      recordWarning(
        "ENGINE_ERROR_SOURCE_INVALID",
        "Engine name is required when reporting a runtime error."
      );

      return null;
    }

    const registered =
      await registryHasEngine(
        normalized
      );

    const current =
      STATE.engine_health[normalized] ||
      {
        engine_name: normalized,

        status: registered
          ? ENGINE_HEALTH_STATUS
              .OBSERVED
          : ENGINE_HEALTH_STATUS
              .UNREGISTERED,

        last_seen: null,
        heartbeat_count: 0,
        errors: [],

        runtime_id:
          STATE.runtime_context.runtime_id
      };

    const errorRecord = {
      error_id:
        createId("sc_engine_error"),

      engine: normalized,

      message:
        clean(error?.message) ||
        clean(error) ||
        "Unknown engine error.",

      name:
        clean(error?.name) ||
        null,

      stack:
        clean(error?.stack) ||
        null,

      context:
        clone(context),

      runtime_id:
        STATE.runtime_context.runtime_id,

      created_at:
        nowISO()
    };

    current.status =
      ENGINE_HEALTH_STATUS.ERROR;

    current.last_seen = nowISO();

    current.errors =
      Array.isArray(current.errors)
        ? current.errors
        : [];

    current.errors.push(
      errorRecord
    );

    trimArray(
      current.errors,
      CONFIGURATION
        .errorHistoryPerEngineLimit
    );

    STATE.engine_health[normalized] =
      current;

    STATE.last_error =
      clone(errorRecord);

    STATE.updated_at = nowISO();

    console.error(
      `[STATS-CORE Engine Bus] ${normalized} error:`,
      error
    );

    emit(
      "engine_error",
      {
        engine: normalized,
        registered,
        error: clone(errorRecord)
      },
      {
        source_engine: normalized
      }
    );

    publishState();

    return clone(errorRecord);
  }

  /*
  ========================================================
  DEPENDENCY OBSERVATION
  ========================================================

  Dependency definitions remain owned by the Engine Registry.
  The Engine Bus retrieves and verifies availability only.
  ========================================================
  */

  async function verifyDependencies(
    engineName
  ) {
    if (
      !requireOnline(
        "verifyDependencies"
      )
    ) {
      return {
        ok: false,
        status:
          "ENGINE_BUS_NOT_ONLINE",
        engine:
          normalizeEngineName(
            engineName
          ),
        missing: []
      };
    }

    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      return {
        ok: false,
        status:
          "ENGINE_NAME_INVALID",
        engine: null,
        missing: []
      };
    }

    const engineRegistered =
      await registryHasEngine(
        normalized
      );

    if (!engineRegistered) {
      return {
        ok: false,
        status:
          "ENGINE_NOT_REGISTERED",
        engine: normalized,
        missing: []
      };
    }

    const requiredDependencies =
      await registryGetDependencies(
        normalized
      );

    const missing = [];

    for (
      const dependency of
      requiredDependencies
    ) {
      const dependencyName =
        normalizeEngineName(
          dependency?.engine_name ||
          dependency?.engine_id ||
          dependency?.name ||
          dependency
        );

      if (!dependencyName) {
        continue;
      }

      const dependencyAvailable =
        await registryHasEngine(
          dependencyName
        );

      if (!dependencyAvailable) {
        missing.push(
          dependencyName
        );
      }
    }

    const result = {
      ok: missing.length === 0,

      status:
        missing.length === 0
          ? "DEPENDENCIES_AVAILABLE"
          : "DEPENDENCY_FAILURE",

      engine: normalized,

      required_dependencies:
        clone(requiredDependencies),

      missing:
        clone(missing),

      runtime_id:
        STATE.runtime_context.runtime_id,

      checked_at:
        nowISO()
    };

    STATE.last_dependency_check =
      clone(result);

    const current =
      STATE.engine_health[normalized] ||
      {
        engine_name: normalized,
        status:
          ENGINE_HEALTH_STATUS
            .OBSERVED,
        heartbeat_count: 0,
        errors: [],
        runtime_id:
          STATE.runtime_context.runtime_id
      };

    if (missing.length > 0) {
      current.status =
        ENGINE_HEALTH_STATUS
          .DEPENDENCY_FAILURE;

      current.missing_dependencies =
        clone(missing);
    } else if (
      current.status ===
      ENGINE_HEALTH_STATUS
        .DEPENDENCY_FAILURE
    ) {
      current.status =
        ENGINE_HEALTH_STATUS
          .OBSERVED;

      current.missing_dependencies =
        [];
    }

    current.last_dependency_check =
      result.checked_at;

    STATE.engine_health[normalized] =
      current;

    STATE.updated_at = nowISO();

    emit(
      missing.length === 0
        ? "dependency_check_passed"
        : "dependency_failure",
      result,
      {
        source_engine: normalized
      }
    );

    publishState();

    return clone(result);
  }

  /*
  ========================================================
  SAFE MODE
  ========================================================

  Safe mode may only be activated by a governed Runtime
  Authority decision bound to the active runtime.
  ========================================================
  */

  async function validateSafeModeDecision(
    decision
  ) {
    if (
      typeof CONFIGURATION
        .safeModeDecisionValidator ===
      "function"
    ) {
      const result =
        await CONFIGURATION
          .safeModeDecisionValidator({
            decision: clone(decision),
            runtime_context:
              clone(
                STATE.runtime_context
              )
          });

      return isPlainObject(result)
        ? result
        : {
            valid: result === true,
            errors:
              result === true
                ? []
                : [
                    "Configured safe-mode validator rejected the decision."
                  ]
          };
    }

    const errors = [];

    if (!isPlainObject(decision)) {
      return {
        valid: false,
        errors: [
          "Safe-mode decision is unavailable or invalid."
        ]
      };
    }

    if (decision.allowed !== true) {
      errors.push(
        "Safe-mode decision must explicitly authorize activation."
      );
    }

    if (!clean(decision.authority_id)) {
      errors.push(
        "Safe-mode decision is missing authority_id."
      );
    }

    if (!clean(decision.authority_type)) {
      errors.push(
        "Safe-mode decision is missing authority_type."
      );
    }

    if (
      clean(decision.runtime_id) !==
      clean(
        STATE.runtime_context
          ?.runtime_id
      )
    ) {
      errors.push(
        "Safe-mode decision runtime_id does not match the active Runtime Context."
      );
    }

    if (!clean(decision.decided_at)) {
      errors.push(
        "Safe-mode decision is missing decided_at."
      );
    } else if (
      Number.isNaN(
        Date.parse(
          decision.decided_at
        )
      )
    ) {
      errors.push(
        "Safe-mode decision decided_at is invalid."
      );
    }

    if (!clean(decision.reason)) {
      errors.push(
        "Safe-mode decision is missing reason."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async function activateSafeMode(
    decision
  ) {
    if (!requireOnline("activateSafeMode")) {
      return {
        ok: false,
        status:
          "ENGINE_BUS_NOT_ONLINE"
      };
    }

    const validation =
      await validateSafeModeDecision(
        decision
      );

    if (!validation.valid) {
      recordWarning(
        "SAFE_MODE_DECISION_REJECTED",
        "Safe-mode activation was rejected.",
        {
          errors:
            clone(
              validation.errors
            )
        }
      );

      return {
        ok: false,
        status:
          "SAFE_MODE_DECISION_REJECTED",
        errors:
          clone(
            validation.errors
          )
      };
    }

    STATE.status =
      STATUS.SAFE_MODE;

    STATE.safe_mode = {
      active: true,

      reason:
        clean(decision.reason),

      authority_id:
        clean(decision.authority_id),

      authority_type:
        clean(
          decision.authority_type
        ),

      decided_at:
        clean(decision.decided_at),

      activated_at:
        nowISO()
    };

    STATE.updated_at = nowISO();

    const event = emit(
      "safe_mode_activated",
      {
        safe_mode:
          clone(
            STATE.safe_mode
          )
      }
    );

    emitLifecycleEvent(
      "safe_mode_activated",
      {
        safe_mode:
          clone(
            STATE.safe_mode
          )
      }
    );

    publishState();

    return {
      ok: true,
      status: STATUS.SAFE_MODE,
      safe_mode:
        clone(
          STATE.safe_mode
        ),
      event
    };
  }

  /*
  ========================================================
  STATUS AND HEALTH
  ========================================================
  */

  function getStatus() {
    return clone(
      buildPublishedState()
    );
  }

  function snapshot() {
    return getStatus();
  }

  function getEngineHealth(
    engineName
  ) {
    const normalized =
      normalizeEngineName(engineName);

    if (!normalized) {
      return null;
    }

    return clone(
      STATE.engine_health[
        normalized
      ] || null
    );
  }

  function getAllEngineHealth() {
    return clone(
      STATE.engine_health
    );
  }

  async function runHealthCheck() {
    const runtimeValidation =
      validateRuntimeContext(
        STATE.runtime_context
      );

    const registry =
      await getEngineRegistry();

    const registryValidation =
      inspectRegistryAuthority(
        registry
      );

    const result = {
      ok:
        STATE.initialized === true &&
        STATE.booted === true &&
        (
          STATE.status ===
            STATUS.ONLINE ||
          STATE.status ===
            STATUS.SAFE_MODE
        ) &&
        runtimeValidation.valid &&
        registryValidation.valid,

      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,

      status: STATE.status,

      initialized:
        STATE.initialized,

      booted:
        STATE.booted,

      configuration_locked:
        CONFIGURATION_LOCKED,

      runtime_context_valid:
        runtimeValidation.valid,

      runtime_id:
        STATE.runtime_context
          ?.runtime_id ||
        null,

      session_id:
        STATE.runtime_context
          ?.session_id ||
        null,

      engine_registry_available:
        !!registry,

      engine_registry_contract_valid:
        registryValidation.valid,

      observed_engine_count:
        Object.keys(
          STATE.engine_health
        ).length,

      event_history_count:
        STATE.events.length,

      warning_count:
        STATE.warnings.length,

      lifecycle_event_count:
        STATE.lifecycle_events.length,

      safe_mode_active:
        STATE.safe_mode.active,

      runtime_errors:
        clone(
          runtimeValidation.errors
        ),

      registry_errors:
        clone(
          registryValidation.errors
        ),

      checked_at:
        nowISO()
    };

    return result;
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
      options.force_reload !== true
    ) {
      return {
        ok: true,

        status:
          "ENGINE_BUS_ALREADY_INITIALIZED",

        state:
          getStatus()
      };
    }

    if (
      options.force_reload === true
    ) {
      STATE =
        createDefaultState();

      CONFIGURATION_LOCKED =
        false;
    }

    if (options.configuration) {
      configure(
        options.configuration
      );
    }

    STATE.status =
      STATUS.INITIALIZING;

    STATE.updated_at = nowISO();

    publishState();

    const runtimeContext =
      await resolveRuntimeContext(
        options.runtime_context ||
        options.runtimeContext ||
        null
      );

    const runtimeValidation =
      validateRuntimeContext(
        runtimeContext
      );

    if (!runtimeValidation.valid) {
      STATE.status =
        STATUS.INITIALIZATION_BLOCKED;

      STATE.initialized = false;
      STATE.booted = false;
      STATE.updated_at = nowISO();

      runtimeValidation.errors
        .forEach(message => {
          recordInternalError(
            "ENGINE_BUS_RUNTIME_CONTEXT_INVALID",
            message
          );
        });

      emitLifecycleEvent(
        "initialization_blocked",
        {
          reason:
            "RUNTIME_CONTEXT_INVALID",

          errors:
            clone(
              runtimeValidation.errors
            )
        }
      );

      return {
        ok: false,

        status:
          "ENGINE_BUS_INITIALIZATION_BLOCKED",

        errors:
          clone(
            runtimeValidation.errors
          ),

        state:
          getStatus()
      };
    }

    STATE.runtime_context =
      normalizeRuntimeContext(
        runtimeContext
      );

    const registry =
      options.engine_registry ||
      options.engineRegistry ||
      await resolveEngineRegistry();

    const registryValidation =
      inspectRegistryAuthority(
        registry
      );

    if (!registryValidation.valid) {
      STATE.status =
        STATUS.INITIALIZATION_BLOCKED;

      STATE.initialized = false;
      STATE.booted = false;
      STATE.updated_at = nowISO();

      STATE.registry_status = {
        available: false,
        authority_id: null,
        authority_type: null,
        checked_at: nowISO()
      };

      registryValidation.errors
        .forEach(message => {
          recordInternalError(
            "ENGINE_BUS_REGISTRY_INVALID",
            message
          );
        });

      emitLifecycleEvent(
        "initialization_blocked",
        {
          reason:
            "ENGINE_REGISTRY_INVALID",

          errors:
            clone(
              registryValidation.errors
            )
        }
      );

      return {
        ok: false,

        status:
          "ENGINE_BUS_INITIALIZATION_BLOCKED",

        errors:
          clone(
            registryValidation.errors
          ),

        state:
          getStatus()
      };
    }

    if (
      options.engine_registry ||
      options.engineRegistry
    ) {
      CONFIGURATION
        .engineRegistryResolver =
        function suppliedRegistryResolver() {
          return registry;
        };
    }

    STATE.registry_status = {
      available: true,

      authority_id:
        clean(
          registry.authority_id ||
          registry.registry_id ||
          registry.engine_id
        ) ||
        null,

      authority_type:
        clean(
          registry.authority_type ||
          registry.registry_type
        ) ||
        "GOVERNED_ENGINE_REGISTRY",

      checked_at:
        nowISO()
    };

    STATE.initialized = true;
    STATE.booted = false;
    STATE.status =
      STATUS.INITIALIZED;

    STATE.initialized_at =
      nowISO();

    STATE.updated_at =
      nowISO();

    CONFIGURATION_LOCKED = true;
    STATE.configuration_locked = true;

    emitLifecycleEvent(
      "initialized",
      {
        runtime_id:
          STATE.runtime_context.runtime_id,

        registry_status:
          clone(
            STATE.registry_status
          )
      }
    );

    publishState();

    return {
      ok: true,

      status:
        "ENGINE_BUS_INITIALIZED",

      state:
        getStatus()
    };
  }

  /*
  ========================================================
  CONTROLLED BOOT
  ========================================================
  */

  async function boot() {
    if (!STATE.initialized) {
      return {
        ok: false,

        status:
          "ENGINE_BUS_NOT_INITIALIZED",

        reason:
          "Engine Bus must be initialized with governed Runtime Context before boot."
      };
    }

    if (STATE.booted) {
      return {
        ok: true,

        status:
          "ENGINE_BUS_ALREADY_ONLINE",

        state:
          getStatus()
      };
    }

    STATE.status =
      STATUS.BOOTING;

    STATE.updated_at =
      nowISO();

    publishState();

    const registry =
      await getEngineRegistry();

    const registryValidation =
      inspectRegistryAuthority(
        registry
      );

    if (!registryValidation.valid) {
      STATE.status =
        STATUS.INITIALIZATION_BLOCKED;

      STATE.booted = false;
      STATE.updated_at = nowISO();

      return {
        ok: false,

        status:
          "ENGINE_BUS_BOOT_BLOCKED",

        errors:
          clone(
            registryValidation.errors
          )
      };
    }

    STATE.status =
      STATUS.ONLINE;

    STATE.booted = true;

    STATE.booted_at =
      nowISO();

    STATE.updated_at =
      nowISO();

    emitLifecycleEvent(
      "online",
      {
        version: VERSION,

        runtime_id:
          STATE.runtime_context.runtime_id
      }
    );

    const onlineEvent = {
      event_id:
        createId("sc_runtime_event"),

      event_name:
        "engine_bus_online",

      runtime_id:
        STATE.runtime_context.runtime_id,

      session_id:
        STATE.runtime_context.session_id,

      source_engine:
        ENGINE_ID,

      payload: {
        version: VERSION,

        authority_id:
          AUTHORITY_ID
      },

      created_at:
        nowISO()
    };

    STATE.events.push(
      onlineEvent
    );

    trimArray(
      STATE.events,
      CONFIGURATION.eventHistoryLimit
    );

    dispatchWindowEvent(
      "engine_bus_online",
      onlineEvent
    );

    publishState();

    console.info(
      "[STATS-CORE Engine Bus] ONLINE",
      {
        version: VERSION,

        runtime_id:
          STATE.runtime_context.runtime_id
      }
    );

    return {
      ok: true,

      status:
        "ENGINE_BUS_ONLINE",

      state:
        getStatus()
    };
  }

  /*
  ========================================================
  CONTROLLED SHUTDOWN
  ========================================================
  */

  function shutdown(
    reason = "GOVERNED_RUNTIME_SHUTDOWN"
  ) {
    if (!STATE.initialized) {
      return {
        ok: false,
        status:
          "ENGINE_BUS_NOT_INITIALIZED"
      };
    }

    STATE.status =
      STATUS.SHUTDOWN;

    STATE.booted = false;

    STATE.shutdown_at =
      nowISO();

    STATE.updated_at =
      nowISO();

    emitLifecycleEvent(
      "shutdown",
      {
        reason:
          clean(reason) ||
          "GOVERNED_RUNTIME_SHUTDOWN"
      }
    );

    publishState();

    return {
      ok: true,
      status:
        STATUS.SHUTDOWN,
      reason:
        clean(reason),
      state:
        getStatus()
    };
  }

  /*
  ========================================================
  LEGACY COMPATIBILITY DELEGATION
  ========================================================

  These methods exist only to reduce breakage for legacy engines.

  They do not make Engine Bus the registration authority.

  Calls are delegated to the Engine Registry when that authority
  explicitly exposes a compatible mutation method.
  ========================================================
  */

  async function registerEngineLegacy(
    engineName,
    engineReference,
    options = {}
  ) {
    const registry =
      await getEngineRegistry();

    if (
      !registry ||
      typeof registry.registerEngine !==
        "function"
    ) {
      recordWarning(
        "LEGACY_ENGINE_REGISTRATION_REJECTED",
        "Engine registration belongs to the Engine Registry Authority.",
        {
          engine:
            normalizeEngineName(
              engineName
            )
        }
      );

      return false;
    }

    recordWarning(
      "LEGACY_ENGINE_REGISTRATION_DELEGATED",
      "Legacy Engine Bus registration call was delegated to the Engine Registry Authority.",
      {
        engine:
          normalizeEngineName(
            engineName
          )
      }
    );

    return (
      await registry.registerEngine(
        engineName,
        engineReference,
        options
      )
    );
  }

  async function setDependenciesLegacy(
    engineName,
    dependencies = []
  ) {
    const registry =
      await getEngineRegistry();

    const method =
      registry?.setDependencies ||
      registry?.registerDependencies ||
      null;

    if (typeof method !== "function") {
      recordWarning(
        "LEGACY_DEPENDENCY_REGISTRATION_REJECTED",
        "Dependency definitions belong to the Engine Registry Authority.",
        {
          engine:
            normalizeEngineName(
              engineName
            )
        }
      );

      return false;
    }

    recordWarning(
      "LEGACY_DEPENDENCY_REGISTRATION_DELEGATED",
      "Legacy dependency registration call was delegated to the Engine Registry Authority.",
      {
        engine:
          normalizeEngineName(
            engineName
          )
      }
    );

    return await method.call(
      registry,
      engineName,
      clone(dependencies)
    );
  }

  /*
  ========================================================
  PUBLIC API
  ========================================================
  */

  function expose() {
    const api = Object.freeze({
      engine_id: ENGINE_ID,
      version: VERSION,
      authority_id: AUTHORITY_ID,
      authority_type: AUTHORITY_TYPE,

      configure,
      getConfiguration,

      init,
      boot,
      shutdown,

      emit,
      on,
      once,

      heartbeat,
      reportError,
      verifyDependencies,

      activateSafeMode,

      getStatus,
      snapshot,
      getState,

      getEngineHealth,
      getAllEngineHealth,
      runHealthCheck,

      hasEngine:
        registryHasEngine,

      getEngine:
        registryGetEngine,

      getDependencies:
        registryGetDependencies,

      /*
      Legacy compatibility surface only.
      Canonical registration belongs to Engine Registry.
      */

      registerEngine:
        registerEngineLegacy,

      setDependencies:
        setDependenciesLegacy,

      getEnumerations() {
        return {
          status:
            clone(STATUS),

          engine_health_status:
            clone(
              ENGINE_HEALTH_STATUS
            ),

          default_limits:
            clone(
              DEFAULT_LIMITS
            ),

          required_runtime_fields:
            clone(
              REQUIRED_RUNTIME_FIELDS
            )
        };
      }
    });

    window.STATScore =
      window.STATScore || {};

    window.STATScore.EngineBus =
      api;

    window.STATScoreEngineBus =
      api;

    publishState();

    dispatchWindowEvent(
      "engine_bus_loaded",
      {
        engine_id: ENGINE_ID,
        version: VERSION,
        authority_id: AUTHORITY_ID,
        status:
          STATUS.LOADED,
        loaded_at:
          STATE.loaded_at
      }
    );

    console.info(
      "[STATS-CORE Engine Bus] Loaded and waiting for governed runtime initialization.",
      {
        version: VERSION,
        authority_id:
          AUTHORITY_ID
      }
    );

    return api;
  }

  expose();

  /*
  ========================================================
  INITIALIZATION DOCTRINE
  ========================================================

  The Engine Bus does not initialize or boot automatically.

  Correct sequence:

  1. Authentication Authority publishes Initial Authentication
     Context.

  2. Stream 8 Runtime Authority establishes Initial Runtime
     Context.

  3. Engine Registry Authority becomes available.

  4. Runtime Authority initializes the Engine Bus.

  5. Runtime Authority boots the Engine Bus.

  Example:

  const initialization =
    await window.STATScoreEngineBus.init({
      runtime_context:
        approvedInitialRuntimeContext,

      engine_registry:
        window.STATScoreEngineRegistry
    });

  if (initialization.ok) {
    await window.STATScoreEngineBus.boot();
  }

  Event publication:

  window.STATScoreEngineBus.emit(
    "athlete_context_ready",
    {
      athlete_id,
      snapshot_id
    },
    {
      source_engine:
        "statscore-athlete-dashboard-engine"
    }
  );

  Event subscription:

  const unsubscribe =
    window.STATScoreEngineBus.on(
      "athlete_context_ready",
      payload => {
        // Consume governed event.
      }
    );

  unsubscribe();

  Heartbeat:

  await window.STATScoreEngineBus.heartbeat(
    "statscore-athlete-dashboard-engine",
    {
      page:
        "athlete-dashboard.html"
    }
  );

  Dependency verification:

  const dependencyResult =
    await window.STATScoreEngineBus
      .verifyDependencies(
        "statscore-athlete-dashboard-engine"
      );

  Dependency definitions are retrieved from Engine Registry.
  The Engine Bus does not create or own them.

  Safe mode:

  await window.STATScoreEngineBus.activateSafeMode({
    allowed: true,
    authority_id:
      "stream-8-runtime-operations",
    authority_type:
      "ENTERPRISE_RUNTIME_AUTHORITY",
    runtime_id:
      approvedInitialRuntimeContext.runtime_id,
    reason:
      "GOVERNED_RUNTIME_DEGRADATION",
    decided_at:
      new Date().toISOString()
  });

  A caller-supplied reason alone is insufficient.

  Canonical global API:

  window.STATScoreEngineBus
  window.STATScore.EngineBus

  The Engine Bus is not:
  - Engine Registry
  - Engine Loader
  - Engine Execution
  - Runtime Authority
  - Self-Healing Authority

  It is the governed runtime communication transport between
  already-authorized runtime participants.
  ========================================================
  */
})(); 
