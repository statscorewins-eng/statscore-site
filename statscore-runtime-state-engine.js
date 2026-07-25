/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-runtime-state-engine.js

Asset Type:
JavaScript Infrastructure / Runtime State Engine

Owner Stream:
Stream 8 — Enterprise Runtime Operations & Self-Healing Authority

Primary Operational Authority:
Stream 8 — Enterprise Runtime Operations & Self-Healing Authority

Layer:
Enterprise Runtime / State Management

Runtime Owner:
STATS-CORE Enterprise Runtime Operations

Primary Consumers:
- all governed page runtimes
- statscore-routing.js
- statscore-engine-loader.js
- statscore-engine-execution.js
- system.html
- governed Stream 8 runtime services

Purpose:
Consumes the Initial Authentication Context published by Stream 1,
establishes the Initial Runtime Context, maintains active runtime
references, receives governed outputs from their owning authorities,
and publishes runtime state to approved consumers.

Consumes:
- Initial Authentication Context
- authorized page context
- authorized snapshot_id
- governed snapshot reference data
- governed engine outputs
- Stream 8 runtime configuration

Provides:
- runtime_state
- initial_runtime_context
- active authenticated user reference
- active role and role_id references
- active snapshot_id
- active athlete_id
- page_id
- page_context
- system_state
- engine health registry
- runtime events

Initial Authentication Context Contract:
- session_id
- user_id
- role
- entry_intent
- authenticated_at
- authentication_source
- requested_destination

Primary Runtime IDs:
- runtime_id
- session_id
- user_id
- snapshot_id
- athlete_id
- role
- role_id
- page_id

Cross-Stream Dependencies:
- Stream 1 publishes Initial Authentication Context.
- Stream 2 governs athlete and snapshot source records.
- Stream 3 and Stream 9 govern athlete intelligence outputs.
- Stream 4 governs professional intake context.
- Stream 5 governs professional workspace operations.
- Stream 6 governs communication decisions.
- Stream 7 governs exposure and media decisions.
- Stream 8 owns runtime initialization and continuity.
- Engine Execution invokes governed engines and returns outputs.

Does NOT:
- authenticate users
- manufacture user_id, role, role_id, or session_id
- resolve authenticated identity
- authorize destinations
- override routing
- calculate scores
- execute intelligence engines
- generate recommendations
- manufacture governance decisions
- create immutable enterprise receipts
- render HTML
- create snapshots
- modify production records
- execute communications

Status:
CONTROLLED V2.0 RECONSTRUCTION

==========================================================
*/

/* ============================================================
   STATS-CORE™ Runtime State Engine
   FULL PRODUCTION FILE
   Version: v2.0
   Purpose:
   Authentication Context Consumption → Runtime Initialization
   → Runtime State Publication → Governed Output Reception
   → Health and Continuity Monitoring
============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-runtime-state-engine";
  const VERSION = "v2.0-runtime-context-authority";
  const OWNER_STREAM =
    "Stream 8 — Enterprise Runtime Operations & Self-Healing Authority";

  const AUTHENTICATION_CONTEXT_FIELDS = Object.freeze([
    "session_id",
    "user_id",
    "role",
    "entry_intent",
    "authenticated_at",
    "authentication_source",
    "requested_destination"
  ]);

  const REQUIRED_SNAPSHOT_COLUMNS = Object.freeze([
    "snapshot_id",
    "athlete_id"
  ]);

  const DEFAULT_SNAPSHOT_SELECT = "snapshot_id,athlete_id";

  const DEFAULT_GOVERNED_OUTPUT_KEYS = Object.freeze([
    "athlete_intelligence",
    "verification",
    "evidence",
    "readiness",
    "pathway",
    "eligibility",
    "visibility",
    "crystal_report",
    "program_intelligence",
    "phnx_ranking_board",
    "multibox_context",
    "multibox_evaluation",
    "camp_combine_matches",
    "recruiter_verification"
  ]);

  const PROTECTED_RUNTIME_KEYS = new Set([
    "authentication_context",
    "initial_runtime_context",
    "session_id",
    "active_user_id",
    "active_role",
    "authenticated_at",
    "authentication_source",
    "entry_intent",
    "requested_destination",
    "runtime_id",
    "runtime_started_at"
  ]);

  const CONFIGURATION = {
    client: null,
    authenticationContextResolver: null,
    snapshotLoader: null,
    snapshotSelect: DEFAULT_SNAPSHOT_SELECT,
    allowedGovernedOutputKeys: new Set(DEFAULT_GOVERNED_OUTPUT_KEYS),
    bindVisibilityHeartbeat: true,
    bindEngineBus: true
  };

  const DEFAULT_STATE = Object.freeze({
    initialized: false,
    initialization_status: "WAITING_FOR_AUTHENTICATION",

    engine_id: ENGINE_ID,
    version: VERSION,
    owner_stream: OWNER_STREAM,

    runtime_id: null,
    runtime_started_at: null,
    updated_at: null,
    ended_at: null,

    authentication_context: null,
    initial_runtime_context: null,

    session_id: null,
    active_user_id: null,
    active_role: null,
    active_role_id: null,

    entry_intent: null,
    authenticated_at: null,
    authentication_source: null,
    requested_destination: null,

    page_id: null,
    page_context: null,
    system_state: "WAITING_FOR_AUTHENTICATION",

    active_snapshot_id: null,
    active_athlete_id: null,
    active_snapshot_reference: null,
    active_athlete_reference: null,

    active_program: null,
    active_recruiter: null,
    active_event: null,
    active_workspace_id: null,

    governed_outputs: {},

    registered_engines: {},
    runtime_events: [],
    errors: [],
    warnings: [],

    heartbeat: {
      status: "IDLE",
      count: 0,
      last_beat_at: null
    }
  });

  let STATE = createDefaultState();
  let EVENTS_BOUND = false;

  function createDefaultState() {
    return clone(DEFAULT_STATE);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function normalizeRole(value) {
    return clean(value).toLowerCase();
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

  function createRuntimeId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return (
      "sc_runtime_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 12)
    );
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getCurrentPageId() {
    const page =
      window.location.pathname.split("/").filter(Boolean).pop() ||
      "index.html";

    return clean(page) || "index.html";
  }

  function getCurrentRoute() {
    return (
      getCurrentPageId() +
      window.location.search +
      window.location.hash
    );
  }

  function snapshot() {
    return clone(STATE);
  }

  function log(message, payload) {
    console.info(
      `[STATS-CORE Runtime State] ${message}`,
      payload === undefined ? "" : payload
    );
  }

  function publishState() {
    window.STATScoreRuntimeState = STATE;

    window.STATScore = window.STATScore || {};
    window.STATScore.RuntimeState = STATE;

    return STATE;
  }

  function emit(eventName, payload = {}) {
    const detail = Object.assign(
      {
        engine_id: ENGINE_ID,
        version: VERSION,
        runtime_id: STATE.runtime_id,
        emitted_at: nowISO()
      },
      payload
    );

    window.dispatchEvent(
      new CustomEvent(`statscore:runtime:${eventName}`, {
        detail
      })
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit(
        `runtime_${eventName}`,
        detail
      );
    }
  }

  function recordRuntimeEvent(type, payload = {}) {
    const event = {
      runtime_event_id:
        "sc_runtime_event_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 10),

      runtime_id: STATE.runtime_id,
      engine_id: ENGINE_ID,
      version: VERSION,
      event_type: clean(type) || "RUNTIME_EVENT",
      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.runtime_events.push(event);
    STATE.updated_at = nowISO();

    publishState();
    emit("event_recorded", { runtime_event: clone(event) });

    return clone(event);
  }

  function recordWarning(code, message, payload = null) {
    const warning = {
      code: clean(code) || "RUNTIME_WARNING",
      message: clean(message) || "Runtime warning.",
      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.warnings.push(warning);
    STATE.updated_at = nowISO();

    console.warn(
      `[STATS-CORE Runtime State] ${warning.code}: ${warning.message}`,
      payload || ""
    );

    publishState();
    emit("warning", { warning: clone(warning) });

    return warning;
  }

  function recordError(code, message, payload = null) {
    const errorRecord = {
      code: clean(code) || "RUNTIME_ERROR",
      message: clean(message) || "Runtime error.",
      payload: clone(payload),
      created_at: nowISO()
    };

    STATE.errors.push(errorRecord);
    STATE.updated_at = nowISO();

    console.error(
      `[STATS-CORE Runtime State] ${errorRecord.code}: ${errorRecord.message}`,
      payload || ""
    );

    publishState();
    emit("error", { error: clone(errorRecord) });

    return errorRecord;
  }

  function validateExplicitSelection(selection) {
    const normalized = clean(selection);

    if (!normalized) {
      throw new Error(
        "Runtime snapshot selection cannot be empty."
      );
    }

    if (normalized.includes("*")) {
      throw new Error(
        "Wildcard database selection is prohibited."
      );
    }

    const columns = normalized
      .split(",")
      .map(column => clean(column))
      .filter(Boolean);

    const duplicates = columns.filter(
      (column, index) => columns.indexOf(column) !== index
    );

    if (duplicates.length) {
      throw new Error(
        `Duplicate snapshot selection columns are prohibited: ${[
          ...new Set(duplicates)
        ].join(", ")}`
      );
    }

    for (const requiredColumn of REQUIRED_SNAPSHOT_COLUMNS) {
      if (!columns.includes(requiredColumn)) {
        throw new Error(
          `Snapshot selection must include governed column: ${requiredColumn}`
        );
      }
    }

    return columns.join(",");
  }

  function configure(options = {}) {
    if (
      Object.prototype.hasOwnProperty.call(options, "client")
    ) {
      CONFIGURATION.client = options.client || null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "authenticationContextResolver"
      )
    ) {
      if (
        options.authenticationContextResolver !== null &&
        typeof options.authenticationContextResolver !== "function"
      ) {
        throw new TypeError(
          "authenticationContextResolver must be a function or null."
        );
      }

      CONFIGURATION.authenticationContextResolver =
        options.authenticationContextResolver;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "snapshotLoader"
      )
    ) {
      if (
        options.snapshotLoader !== null &&
        typeof options.snapshotLoader !== "function"
      ) {
        throw new TypeError(
          "snapshotLoader must be a function or null."
        );
      }

      CONFIGURATION.snapshotLoader = options.snapshotLoader;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "snapshotSelect"
      )
    ) {
      CONFIGURATION.snapshotSelect =
        validateExplicitSelection(options.snapshotSelect);
    } else {
      CONFIGURATION.snapshotSelect =
        validateExplicitSelection(
          CONFIGURATION.snapshotSelect
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "allowedGovernedOutputKeys"
      )
    ) {
      if (!Array.isArray(options.allowedGovernedOutputKeys)) {
        throw new TypeError(
          "allowedGovernedOutputKeys must be an array."
        );
      }

      const normalizedKeys = options.allowedGovernedOutputKeys
        .map(clean)
        .filter(Boolean);

      CONFIGURATION.allowedGovernedOutputKeys =
        new Set(normalizedKeys);
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "bindVisibilityHeartbeat"
      )
    ) {
      CONFIGURATION.bindVisibilityHeartbeat =
        options.bindVisibilityHeartbeat !== false;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "bindEngineBus"
      )
    ) {
      CONFIGURATION.bindEngineBus =
        options.bindEngineBus !== false;
    }

    recordRuntimeEvent("RUNTIME_CONFIGURATION_UPDATED", {
      has_client: !!CONFIGURATION.client,
      has_authentication_context_resolver:
        typeof CONFIGURATION.authenticationContextResolver ===
        "function",
      has_snapshot_loader:
        typeof CONFIGURATION.snapshotLoader === "function",
      snapshot_select: CONFIGURATION.snapshotSelect,
      allowed_governed_output_keys: [
        ...CONFIGURATION.allowedGovernedOutputKeys
      ]
    });

    return getConfiguration();
  }

  function getConfiguration() {
    return {
      has_client: !!CONFIGURATION.client,
      has_authentication_context_resolver:
        typeof CONFIGURATION.authenticationContextResolver ===
        "function",
      has_snapshot_loader:
        typeof CONFIGURATION.snapshotLoader === "function",
      snapshot_select: CONFIGURATION.snapshotSelect,
      allowed_governed_output_keys: [
        ...CONFIGURATION.allowedGovernedOutputKeys
      ],
      bind_visibility_heartbeat:
        CONFIGURATION.bindVisibilityHeartbeat,
      bind_engine_bus: CONFIGURATION.bindEngineBus
    };
  }

  async function resolveAuthenticationContext(
    suppliedContext = null
  ) {
    if (suppliedContext) {
      return clone(suppliedContext);
    }

    if (
      typeof CONFIGURATION.authenticationContextResolver ===
      "function"
    ) {
      return clone(
        await CONFIGURATION.authenticationContextResolver()
      );
    }

    return null;
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
          "Initial Authentication Context is unavailable or invalid."
        ]
      };
    }

    for (const field of AUTHENTICATION_CONTEXT_FIELDS) {
      const value = context[field];

      if (
        value === undefined ||
        value === null ||
        clean(value) === ""
      ) {
        errors.push(
          `Initial Authentication Context is missing required field: ${field}`
        );
      }
    }

    if (
      context.authenticated_at &&
      Number.isNaN(Date.parse(context.authenticated_at))
    ) {
      errors.push(
        "Initial Authentication Context authenticated_at is not a valid timestamp."
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
      entry_intent: clean(context.entry_intent),
      authenticated_at: clean(context.authenticated_at),
      authentication_source: clean(
        context.authentication_source
      ),
      requested_destination: clean(
        context.requested_destination
      )
    };
  }

  function buildPageContext(options = {}) {
    const pageId =
      clean(options.page_id) || getCurrentPageId();

    const snapshotId =
      clean(options.snapshot_id) ||
      clean(getQueryParam("snapshot_id")) ||
      null;

    return {
      page_id: pageId,
      route: clean(options.route) || getCurrentRoute(),
      pathname: window.location.pathname,
      query_string: window.location.search,
      hash: window.location.hash,
      url: window.location.href,
      snapshot_id: snapshotId,
      requested_destination:
        STATE.requested_destination || null,
      established_at: nowISO()
    };
  }

  function buildInitialRuntimeContext(
    authenticationContext,
    options = {}
  ) {
    const pageContext = buildPageContext(options);

    return {
      runtime_id: createRuntimeId(),

      session_id: authenticationContext.session_id,
      user_id: authenticationContext.user_id,
      role: authenticationContext.role,
      role_id: options.role_id
        ? clean(options.role_id)
        : null,

      entry_intent: authenticationContext.entry_intent,
      authenticated_at:
        authenticationContext.authenticated_at,
      authentication_source:
        authenticationContext.authentication_source,
      requested_destination:
        authenticationContext.requested_destination,

      page_id: pageContext.page_id,
      page_context: pageContext,

      active_snapshot_id:
        pageContext.snapshot_id || null,
      active_athlete_id: null,
      active_workspace_id: options.active_workspace_id
        ? clean(options.active_workspace_id)
        : null,

      system_state: "RUNTIME_INITIALIZED",
      runtime_started_at: nowISO()
    };
  }

  function publishInitialRuntimeContext(runtimeContext) {
    window.STATScoreInitialRuntimeContext =
      clone(runtimeContext);

    window.STATScore = window.STATScore || {};
    window.STATScore.InitialRuntimeContext =
      window.STATScoreInitialRuntimeContext;

    emit("initial_context_published", {
      initial_runtime_context: clone(runtimeContext)
    });

    return clone(runtimeContext);
  }

  function applyInitialRuntimeContext(runtimeContext) {
    STATE.initialized = true;
    STATE.initialization_status = "INITIALIZED";

    STATE.runtime_id = runtimeContext.runtime_id;
    STATE.runtime_started_at =
      runtimeContext.runtime_started_at;
    STATE.updated_at = nowISO();

    STATE.initial_runtime_context =
      clone(runtimeContext);

    STATE.session_id = runtimeContext.session_id;
    STATE.active_user_id = runtimeContext.user_id;
    STATE.active_role = runtimeContext.role;
    STATE.active_role_id =
      runtimeContext.role_id || null;

    STATE.entry_intent =
      runtimeContext.entry_intent;
    STATE.authenticated_at =
      runtimeContext.authenticated_at;
    STATE.authentication_source =
      runtimeContext.authentication_source;
    STATE.requested_destination =
      runtimeContext.requested_destination;

    STATE.page_id = runtimeContext.page_id;
    STATE.page_context =
      clone(runtimeContext.page_context);

    STATE.system_state =
      runtimeContext.system_state;

    STATE.active_snapshot_id =
      runtimeContext.active_snapshot_id || null;
    STATE.active_athlete_id =
      runtimeContext.active_athlete_id || null;
    STATE.active_workspace_id =
      runtimeContext.active_workspace_id || null;

    STATE.heartbeat = {
      status: "ONLINE",
      count: 0,
      last_beat_at: null
    };

    publishState();
    publishInitialRuntimeContext(runtimeContext);

    return snapshot();
  }

  function assertRuntimeInitialized(operationName) {
    if (
      !STATE.initialized ||
      STATE.initialization_status !== "INITIALIZED" ||
      !STATE.runtime_id
    ) {
      throw new Error(
        `${operationName} requires an initialized authenticated runtime.`
      );
    }
  }

  function getSupabaseClient() {
    return CONFIGURATION.client || null;
  }

  async function loadSnapshotReference(snapshotId) {
    const normalizedSnapshotId = clean(snapshotId);

    if (!normalizedSnapshotId) {
      return {
        data: null,
        error: {
          code: "RUNTIME_SNAPSHOT_ID_REQUIRED",
          message:
            "A governed snapshot_id is required."
        }
      };
    }

    if (typeof CONFIGURATION.snapshotLoader === "function") {
      try {
        const result =
          await CONFIGURATION.snapshotLoader({
            snapshot_id: normalizedSnapshotId,
            select: CONFIGURATION.snapshotSelect
          });

        if (
          result &&
          typeof result === "object" &&
          (
            Object.prototype.hasOwnProperty.call(
              result,
              "data"
            ) ||
            Object.prototype.hasOwnProperty.call(
              result,
              "error"
            )
          )
        ) {
          return {
            data: result.data || null,
            error: result.error || null
          };
        }

        return {
          data: result || null,
          error: null
        };
      } catch (error) {
        return {
          data: null,
          error: {
            code: "RUNTIME_SNAPSHOT_LOADER_EXCEPTION",
            message:
              "The governed snapshot loader raised an exception.",
            cause: error
          }
        };
      }
    }

    const client = getSupabaseClient();

    if (!client) {
      return {
        data: null,
        error: {
          code: "RUNTIME_DATA_CLIENT_UNAVAILABLE",
          message:
            "No governed snapshot loader or Supabase client is configured."
        }
      };
    }

    try {
      const { data, error } = await client
        .from("statscore_snapshots")
        .select(CONFIGURATION.snapshotSelect)
        .eq("snapshot_id", normalizedSnapshotId)
        .limit(1)
        .maybeSingle();

      return {
        data: data || null,
        error: error || null
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: "RUNTIME_SNAPSHOT_QUERY_EXCEPTION",
          message:
            "The canonical snapshot query raised an exception.",
          cause: error
        }
      };
    }
  }

  async function hydrateSnapshotReference(snapshotId) {
    assertRuntimeInitialized(
      "hydrateSnapshotReference"
    );

    const normalizedSnapshotId =
      clean(snapshotId) ||
      clean(STATE.page_context?.snapshot_id);

    if (!normalizedSnapshotId) {
      recordWarning(
        "RUNTIME_SNAPSHOT_ID_UNAVAILABLE",
        "No snapshot_id was supplied for runtime reference hydration."
      );

      return {
        ok: false,
        status: "RUNTIME_SNAPSHOT_ID_UNAVAILABLE",
        snapshot: null
      };
    }

    const result =
      await loadSnapshotReference(
        normalizedSnapshotId
      );

    if (result.error) {
      recordError(
        "RUNTIME_SNAPSHOT_REFERENCE_LOAD_FAILED",
        "The canonical snapshot reference could not be loaded.",
        {
          snapshot_id: normalizedSnapshotId,
          error: result.error
        }
      );

      return {
        ok: false,
        status:
          "RUNTIME_SNAPSHOT_REFERENCE_LOAD_FAILED",
        error: result.error,
        snapshot: null
      };
    }

    if (!result.data) {
      recordWarning(
        "RUNTIME_SNAPSHOT_REFERENCE_NOT_FOUND",
        "No canonical snapshot record matched the supplied snapshot_id.",
        {
          snapshot_id: normalizedSnapshotId
        }
      );

      return {
        ok: false,
        status:
          "RUNTIME_SNAPSHOT_REFERENCE_NOT_FOUND",
        snapshot: null
      };
    }

    const snapshotReference = clone(result.data);

    STATE.active_snapshot_id =
      clean(snapshotReference.snapshot_id) ||
      normalizedSnapshotId;

    STATE.active_athlete_id =
      clean(snapshotReference.athlete_id) ||
      null;

    STATE.active_snapshot_reference =
      snapshotReference;

    STATE.active_athlete_reference =
      STATE.active_athlete_id
        ? {
            athlete_id: STATE.active_athlete_id
          }
        : null;

    if (STATE.page_context) {
      STATE.page_context.snapshot_id =
        STATE.active_snapshot_id;
    }

    if (STATE.initial_runtime_context) {
      STATE.initial_runtime_context.active_snapshot_id =
        STATE.active_snapshot_id;

      STATE.initial_runtime_context.active_athlete_id =
        STATE.active_athlete_id;
    }

    STATE.updated_at = nowISO();

    publishState();

    recordRuntimeEvent(
      "SNAPSHOT_REFERENCE_HYDRATED",
      {
        snapshot_id: STATE.active_snapshot_id,
        athlete_id: STATE.active_athlete_id,
        source_table:
          "public.statscore_snapshots",
        selected_columns:
          CONFIGURATION.snapshotSelect
      }
    );

    emit("snapshot_reference_hydrated", {
      snapshot_id: STATE.active_snapshot_id,
      athlete_id: STATE.active_athlete_id
    });

    return {
      ok: true,
      status:
        "RUNTIME_SNAPSHOT_REFERENCE_HYDRATED",
      snapshot: clone(snapshotReference)
    };
  }

  function heartbeat() {
    assertRuntimeInitialized("heartbeat");

    STATE.heartbeat.count += 1;
    STATE.heartbeat.status = "ONLINE";
    STATE.heartbeat.last_beat_at = nowISO();
    STATE.updated_at = nowISO();

    publishState();

    emit("heartbeat", {
      heartbeat: clone(STATE.heartbeat)
    });

    return clone(STATE.heartbeat);
  }

  function registerEngine(engineId, payload = {}) {
    assertRuntimeInitialized("registerEngine");

    const normalizedEngineId = clean(engineId);

    if (!normalizedEngineId) {
      throw new Error(
        "registerEngine requires a valid engine_id."
      );
    }

    const existing =
      STATE.registered_engines[
        normalizedEngineId
      ] || {};

    STATE.registered_engines[
      normalizedEngineId
    ] = {
      ...existing,
      engine_id: normalizedEngineId,
      version:
        clean(payload.version) ||
        existing.version ||
        null,
      status:
        clean(payload.status) ||
        existing.status ||
        "ONLINE",
      owner_stream:
        clean(payload.owner_stream) ||
        existing.owner_stream ||
        null,
      last_ping_at: nowISO(),
      metadata: clone(payload.metadata || {})
    };

    STATE.updated_at = nowISO();
    publishState();

    recordRuntimeEvent("ENGINE_REGISTERED", {
      engine_id: normalizedEngineId,
      version:
        STATE.registered_engines[
          normalizedEngineId
        ].version,
      status:
        STATE.registered_engines[
          normalizedEngineId
        ].status
    });

    return clone(
      STATE.registered_engines[
        normalizedEngineId
      ]
    );
  }

  function pingEngine(engineId, payload = {}) {
    assertRuntimeInitialized("pingEngine");

    const normalizedEngineId = clean(engineId);

    if (!normalizedEngineId) {
      throw new Error(
        "pingEngine requires a valid engine_id."
      );
    }

    if (
      !STATE.registered_engines[
        normalizedEngineId
      ]
    ) {
      return registerEngine(
        normalizedEngineId,
        payload
      );
    }

    const engine =
      STATE.registered_engines[
        normalizedEngineId
      ];

    engine.status =
      clean(payload.status) ||
      engine.status ||
      "ONLINE";

    engine.version =
      clean(payload.version) ||
      engine.version ||
      null;

    engine.last_ping_at = nowISO();

    if (
      Object.prototype.hasOwnProperty.call(
        payload,
        "metadata"
      )
    ) {
      engine.metadata = clone(
        payload.metadata || {}
      );
    }

    STATE.updated_at = nowISO();
    publishState();

    emit("engine_ping", {
      engine: clone(engine)
    });

    return clone(engine);
  }

  function acceptGovernedOutput(
    outputKey,
    value,
    authority = {}
  ) {
    assertRuntimeInitialized(
      "acceptGovernedOutput"
    );

    const normalizedKey = clean(outputKey);

    if (
      !CONFIGURATION.allowedGovernedOutputKeys.has(
        normalizedKey
      )
    ) {
      throw new Error(
        `Governed output key is not approved for Runtime State: ${normalizedKey}`
      );
    }

    const ownerStream =
      clean(authority.owner_stream);

    const authorityId =
      clean(authority.authority_id);

    if (!ownerStream || !authorityId) {
      throw new Error(
        "Governed output requires owner_stream and authority_id."
      );
    }

    const acceptedOutput = {
      output_key: normalizedKey,
      value: clone(value),
      authority: {
        owner_stream: ownerStream,
        authority_id: authorityId,
        authority_version:
          clean(authority.authority_version) ||
          null
      },
      received_at: nowISO()
    };

    STATE.governed_outputs[
      normalizedKey
    ] = acceptedOutput;

    STATE.updated_at = nowISO();
    publishState();

    recordRuntimeEvent(
      "GOVERNED_OUTPUT_ACCEPTED",
      {
        output_key: normalizedKey,
        owner_stream: ownerStream,
        authority_id: authorityId
      }
    );

    emit("governed_output_accepted", {
      output: clone(acceptedOutput)
    });

    return clone(acceptedOutput);
  }

  function getGovernedOutput(outputKey) {
    const normalizedKey = clean(outputKey);

    if (!normalizedKey) {
      return null;
    }

    return clone(
      STATE.governed_outputs[
        normalizedKey
      ] || null
    );
  }

  function setPageContext(pageContext = {}) {
    assertRuntimeInitialized("setPageContext");

    const nextPageContext = {
      ...clone(STATE.page_context || {}),
      ...clone(pageContext),
      page_id:
        clean(pageContext.page_id) ||
        STATE.page_id ||
        getCurrentPageId(),
      route:
        clean(pageContext.route) ||
        getCurrentRoute(),
      url:
        clean(pageContext.url) ||
        window.location.href,
      updated_at: nowISO()
    };

    STATE.page_id =
      nextPageContext.page_id;

    STATE.page_context =
      nextPageContext;

    STATE.updated_at = nowISO();

    publishState();

    recordRuntimeEvent(
      "PAGE_CONTEXT_UPDATED",
      {
        page_id: STATE.page_id,
        route: STATE.page_context.route
      }
    );

    emit("page_context_updated", {
      page_context: clone(
        STATE.page_context
      )
    });

    return clone(STATE.page_context);
  }

  function setActiveRoleId(roleId, authority = {}) {
    assertRuntimeInitialized(
      "setActiveRoleId"
    );

    const normalizedRoleId = clean(roleId);

    if (!normalizedRoleId) {
      throw new Error(
        "setActiveRoleId requires a valid role_id."
      );
    }

    if (
      !clean(authority.owner_stream) ||
      !clean(authority.authority_id)
    ) {
      throw new Error(
        "role_id assignment requires owner_stream and authority_id."
      );
    }

    STATE.active_role_id =
      normalizedRoleId;

    if (STATE.initial_runtime_context) {
      STATE.initial_runtime_context.role_id =
        normalizedRoleId;
    }

    STATE.updated_at = nowISO();

    publishState();

    recordRuntimeEvent(
      "ACTIVE_ROLE_ID_ACCEPTED",
      {
        role_id: normalizedRoleId,
        owner_stream:
          clean(authority.owner_stream),
        authority_id:
          clean(authority.authority_id)
      }
    );

    return STATE.active_role_id;
  }

  function setActiveWorkspace(
    workspace = {},
    authority = {}
  ) {
    assertRuntimeInitialized(
      "setActiveWorkspace"
    );

    const workspaceId = clean(
      workspace.active_workspace_id ||
      workspace.workspace_id
    );

    if (!workspaceId) {
      throw new Error(
        "setActiveWorkspace requires an active_workspace_id."
      );
    }

    if (
      !clean(authority.owner_stream) ||
      !clean(authority.authority_id)
    ) {
      throw new Error(
        "Workspace assignment requires owner_stream and authority_id."
      );
    }

    STATE.active_workspace_id =
      workspaceId;

    STATE.updated_at = nowISO();

    publishState();

    recordRuntimeEvent(
      "ACTIVE_WORKSPACE_ACCEPTED",
      {
        active_workspace_id:
          workspaceId,
        owner_stream:
          clean(authority.owner_stream),
        authority_id:
          clean(authority.authority_id)
      }
    );

    return STATE.active_workspace_id;
  }

  function setSystemState(
    nextSystemState,
    metadata = {}
  ) {
    assertRuntimeInitialized(
      "setSystemState"
    );

    const normalizedState =
      clean(nextSystemState);

    if (!normalizedState) {
      throw new Error(
        "setSystemState requires a valid system state."
      );
    }

    const previousState =
      STATE.system_state;

    STATE.system_state =
      normalizedState;

    STATE.updated_at = nowISO();

    publishState();

    recordRuntimeEvent(
      "SYSTEM_STATE_UPDATED",
      {
        previous_system_state:
          previousState,
        next_system_state:
          normalizedState,
        metadata: clone(metadata)
      }
    );

    emit("system_state_updated", {
      previous_system_state:
        previousState,
      system_state: normalizedState
    });

    return STATE.system_state;
  }

  function updateRuntimeState(
    patch = {},
    metadata = {}
  ) {
    assertRuntimeInitialized(
      "updateRuntimeState"
    );

    if (
      !patch ||
      typeof patch !== "object" ||
      Array.isArray(patch)
    ) {
      throw new TypeError(
        "updateRuntimeState patch must be an object."
      );
    }

    const prohibitedKeys =
      Object.keys(patch).filter(key =>
        PROTECTED_RUNTIME_KEYS.has(key)
      );

    if (prohibitedKeys.length) {
      throw new Error(
        `Protected runtime fields cannot be mutated through updateRuntimeState: ${prohibitedKeys.join(
          ", "
        )}`
      );
    }

    STATE = {
      ...STATE,
      ...clone(patch),
      updated_at: nowISO()
    };

    publishState();

    recordRuntimeEvent(
      "RUNTIME_STATE_UPDATED",
      {
        patch_keys: Object.keys(patch),
        metadata: clone(metadata)
      }
    );

    emit("state_updated", {
      patch_keys: Object.keys(patch),
      metadata: clone(metadata),
      state: snapshot()
    });

    return snapshot();
  }

  function runHealthCheck() {
    const authenticationValid =
      validateAuthenticationContext(
        STATE.authentication_context
      );

    const initializedCorrectly =
      STATE.initialized === true &&
      STATE.initialization_status ===
        "INITIALIZED" &&
      !!STATE.runtime_id &&
      authenticationValid.valid;

    return {
      ok: initializedCorrectly,
      engine_id: ENGINE_ID,
      version: VERSION,
      owner_stream: OWNER_STREAM,

      initialization_status:
        STATE.initialization_status,

      runtime_id: STATE.runtime_id,
      session_id: STATE.session_id,
      active_user_id:
        STATE.active_user_id,
      active_role: STATE.active_role,
      active_role_id:
        STATE.active_role_id,

      page_id: STATE.page_id,
      system_state: STATE.system_state,

      active_snapshot_id:
        STATE.active_snapshot_id,
      active_athlete_id:
        STATE.active_athlete_id,

      registered_engine_count:
        Object.keys(
          STATE.registered_engines
        ).length,

      runtime_event_count:
        STATE.runtime_events.length,

      error_count: STATE.errors.length,
      warning_count:
        STATE.warnings.length,

      heartbeat: clone(
        STATE.heartbeat
      ),

      authentication_context_valid:
        authenticationValid.valid,

      checked_at: nowISO()
    };
  }

  function bindRuntimeEvents() {
    if (EVENTS_BOUND) {
      return;
    }

    EVENTS_BOUND = true;

    if (
      CONFIGURATION.bindVisibilityHeartbeat
    ) {
      document.addEventListener(
        "visibilitychange",
        function () {
          if (
            !document.hidden &&
            STATE.initialized &&
            STATE.initialization_status ===
              "INITIALIZED"
          ) {
            try {
              heartbeat();
            } catch (error) {
              recordError(
                "RUNTIME_HEARTBEAT_FAILED",
                "Runtime heartbeat failed after visibility restoration.",
                error
              );
            }
          }
        }
      );
    }

    window.addEventListener(
      "statscore:engine:online",
      function (event) {
        if (
          !STATE.initialized ||
          STATE.initialization_status !==
            "INITIALIZED"
        ) {
          return;
        }

        const detail =
          event.detail || {};

        const engineId =
          detail.engine_id ||
          detail.engine;

        if (!clean(engineId)) {
          return;
        }

        try {
          registerEngine(engineId, {
            version:
              detail.version || null,
            status:
              detail.status || "ONLINE",
            owner_stream:
              detail.owner_stream || null,
            metadata: detail
          });
        } catch (error) {
          recordError(
            "ENGINE_REGISTRATION_FAILED",
            "A runtime engine registration event could not be accepted.",
            {
              engine_id: engineId,
              error
            }
          );
        }
      }
    );

    if (
      CONFIGURATION.bindEngineBus &&
      window.STATScoreEngineBus?.on
    ) {
      window.STATScoreEngineBus.on(
        "engine_online",
        function (payload = {}) {
          if (
            !STATE.initialized ||
            STATE.initialization_status !==
              "INITIALIZED"
          ) {
            return;
          }

          const engineId =
            payload.engine_id ||
            payload.engine;

          if (!clean(engineId)) {
            return;
          }

          try {
            registerEngine(engineId, {
              version:
                payload.version || null,
              status:
                payload.status ||
                "ONLINE",
              owner_stream:
                payload.owner_stream ||
                null,
              metadata: payload
            });
          } catch (error) {
            recordError(
              "ENGINE_BUS_REGISTRATION_FAILED",
              "An Engine Bus registration could not be accepted.",
              {
                engine_id: engineId,
                error
              }
            );
          }
        }
      );

      window.STATScoreEngineBus.on(
        "runtime_state_request",
        function () {
          publishState();

          emit("state_published", {
            state: snapshot()
          });
        }
      );
    }
  }

  async function init(options = {}) {
    if (
      STATE.initialized &&
      STATE.initialization_status ===
        "INITIALIZED" &&
      !options.force_reload
    ) {
      return {
        ok: true,
        status:
          "RUNTIME_ALREADY_INITIALIZED",
        state: snapshot()
      };
    }

    if (options.force_reload) {
      STATE = createDefaultState();
      publishState();
    }

    STATE.initialization_status =
      "AUTHENTICATION_CONTEXT_PENDING";
    STATE.system_state =
      "WAITING_FOR_AUTHENTICATION";
    STATE.updated_at = nowISO();

    publishState();

    const suppliedContext =
      options.authentication_context ||
      options.authenticationContext ||
      null;

    const authenticationContext =
      await resolveAuthenticationContext(
        suppliedContext
      );

    const validation =
      validateAuthenticationContext(
        authenticationContext
      );

    if (!validation.valid) {
      STATE.initialized = false;
      STATE.initialization_status =
        "AUTHENTICATION_CONTEXT_REJECTED";
      STATE.system_state =
        "RUNTIME_BLOCKED";
      STATE.updated_at = nowISO();

      publishState();

      validation.errors.forEach(
        message => {
          recordError(
            "INITIAL_AUTHENTICATION_CONTEXT_INVALID",
            message
          );
        }
      );

      emit("initialization_blocked", {
        reason:
          "INITIAL_AUTHENTICATION_CONTEXT_INVALID",
        validation_errors:
          clone(validation.errors)
      });

      return {
        ok: false,
        status:
          "RUNTIME_INITIALIZATION_BLOCKED",
        errors: clone(
          validation.errors
        ),
        state: snapshot()
      };
    }

    const normalizedAuthenticationContext =
      normalizeAuthenticationContext(
        authenticationContext
      );

    STATE.authentication_context =
      clone(
        normalizedAuthenticationContext
      );

    const initialRuntimeContext =
      buildInitialRuntimeContext(
        normalizedAuthenticationContext,
        options
      );

    applyInitialRuntimeContext(
      initialRuntimeContext
    );

    bindRuntimeEvents();

    registerEngine(ENGINE_ID, {
      version: VERSION,
      status: "ONLINE",
      owner_stream: OWNER_STREAM,
      metadata: {
        runtime_id:
          STATE.runtime_id
      }
    });

    heartbeat();

    recordRuntimeEvent(
      "RUNTIME_INITIALIZED",
      {
        runtime_id:
          STATE.runtime_id,
        session_id:
          STATE.session_id,
        user_id:
          STATE.active_user_id,
        role:
          STATE.active_role,
        page_id:
          STATE.page_id,
        authentication_source:
          STATE.authentication_source
      }
    );

    emit("initialized", {
      initial_runtime_context:
        clone(
          STATE.initial_runtime_context
        ),
      state: snapshot()
    });

    let snapshotHydration = null;

    const snapshotId =
      clean(options.snapshot_id) ||
      clean(
        STATE.page_context?.snapshot_id
      );

    if (
      snapshotId &&
      options.hydrate_snapshot !== false
    ) {
      snapshotHydration =
        await hydrateSnapshotReference(
          snapshotId
        );
    }

    log("Engine initialized.", {
      engine_id: ENGINE_ID,
      version: VERSION,
      runtime_id:
        STATE.runtime_id,
      session_id:
        STATE.session_id,
      user_id:
        STATE.active_user_id,
      role:
        STATE.active_role,
      page_id:
        STATE.page_id
    });

    return {
      ok: true,
      status:
        "RUNTIME_INITIALIZED",
      initial_runtime_context:
        clone(
          STATE.initial_runtime_context
        ),
      snapshot_hydration:
        snapshotHydration,
      state: snapshot()
    };
  }

  function endRuntime(metadata = {}) {
    if (
      !STATE.initialized ||
      !STATE.runtime_id
    ) {
      return {
        ok: true,
        status:
          "RUNTIME_NOT_ACTIVE",
        state: snapshot()
      };
    }

    const endedAt = nowISO();

    recordRuntimeEvent(
      "RUNTIME_ENDED",
      {
        runtime_id:
          STATE.runtime_id,
        session_id:
          STATE.session_id,
        metadata: clone(metadata),
        ended_at: endedAt
      }
    );

    STATE.initialization_status =
      "ENDED";
    STATE.system_state =
      "RUNTIME_ENDED";
    STATE.ended_at = endedAt;
    STATE.updated_at = endedAt;

    STATE.heartbeat.status =
      "OFFLINE";

    publishState();

    emit("ended", {
      runtime_id:
        STATE.runtime_id,
      ended_at: endedAt
    });

    return {
      ok: true,
      status: "RUNTIME_ENDED",
      state: snapshot()
    };
  }

  function resetRuntime(options = {}) {
    if (
      STATE.initialized &&
      !options.force
    ) {
      throw new Error(
        "resetRuntime requires force: true while a runtime is active."
      );
    }

    STATE = createDefaultState();
    publishState();

    emit("reset", {
      reset_at: nowISO()
    });

    return snapshot();
  }

  function expose() {
    const api = {
      engine_id: ENGINE_ID,
      version: VERSION,
      owner_stream: OWNER_STREAM,

      configure,
      getConfiguration,

      init,
      endRuntime,
      resetRuntime,

      getState: snapshot,
      publishState,
      getInitialRuntimeContext: function () {
        return clone(
          STATE.initial_runtime_context
        );
      },
      getAuthenticationContext: function () {
        return clone(
          STATE.authentication_context
        );
      },

      heartbeat,
      runHealthCheck,

      registerEngine,
      pingEngine,

      hydrateSnapshotReference,

      acceptGovernedOutput,
      getGovernedOutput,

      setPageContext,
      setActiveRoleId,
      setActiveWorkspace,
      setSystemState,
      updateRuntimeState,

      recordRuntimeEvent
    };

    window.STATScoreRuntimeStateEngine =
      api;

    window.STATScore =
      window.STATScore || {};

    window.STATScore.RuntimeStateEngine =
      api;

    publishState();

    emit("engine_loaded", {
      status:
        "WAITING_FOR_AUTHENTICATION"
    });

    log(
      "Engine loaded and waiting for authenticated Stream 8 initialization.",
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
  IMPORTANT INITIALIZATION RULE
  ========================================================

  This file deliberately does NOT initialize Runtime State
  on DOMContentLoaded.

  Stream 8 must initialize it only after Stream 1 has
  successfully published the Initial Authentication Context.

  Required integration pattern:

  await window.STATScoreRuntimeStateEngine.init({
    authentication_context: approvedAuthenticationContext,
    role_id: approvedRoleId || null,
    active_workspace_id: approvedWorkspaceId || null,
    snapshot_id: approvedSnapshotId || null
  });

  A configured authenticationContextResolver may be used
  instead of passing authentication_context directly.

  Runtime initialization must never precede authentication.
  ========================================================
  */
})(); 
