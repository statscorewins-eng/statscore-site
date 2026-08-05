/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-authentication-bootstrap.js

Asset Type:
JavaScript Runtime Bootstrap / Authentication Configuration Authority

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Authentication Authority

System Layer:
Authentication Runtime Configuration / Controlled Entry Bootstrap

Primary Consumers:
- login.html
- statscore-authentication-service.js
- statscore-authentication-receipts.js
- authorized diagnostics
- Stream 8 Runtime Entry Coordination

Supporting Authorities:
- statscore-data.js
- statscore-authentication-errors.js
- statscore-authentication-context.js
- statscore-authentication-receipts.js
- statscore-authentication-service.js

Purpose:
Configures and activates the complete governed STATS-CORE
authentication runtime.

The bootstrap:

- resolves the approved shared Supabase browser client
- verifies all required Stream 1 authentication authorities
- configures Authentication Receipt persistence
- configures the Authentication Service
- binds the actual public.sc_users schema contract
- binds the governed Entry-State RPC
- binds the approved Stream 1 routing contract
- locks runtime configuration
- validates service and receipt health
- publishes runtime readiness
- publishes runtime failure
- prevents duplicate uncontrolled initialization
- remains fail-closed when any dependency is unavailable

Approved Shared Client:
STATScoreData.getClient()

Approved Identity Authority:
public.sc_users

Approved Identity Columns:
- sc_user_id
- auth_user_id
- sc_athlete_id
- role
- email
- created_at

Approved Entry-State Authority:
public.resolve_authentication_entry_state

Approved Authentication Receipt Authority:
public.record_statscore_authentication_receipt

Approved Routing:
First-time athlete:
snapshot-intake.html?new=1&role=athlete&from=login&next=athlete-dashboard.html

Returning athlete:
athlete-dashboard.html?snapshot_id={snapshot_id}

First-time professional:
role-dashboard-intake.html?role={authenticated_role}&from=login&next=role-dashboard.html

Returning professional:
role-dashboard.html

Administrator:
system.html

Constitutional Boundary:
This bootstrap configures Stream 1 authentication authorities.

It does not authenticate users, manufacture identities, resolve
entry state, generate Authentication Context, or route users.

Does NOT:
- create Supabase clients from service-role credentials
- contain Supabase service-role credentials
- authenticate credentials
- register accounts
- create auth.users records
- create public.sc_users records
- write Authentication Receipts directly
- create Initial Authentication Context
- publish Runtime Context
- create athlete source records
- create snapshots
- create professional workspaces
- determine first-time status
- execute downstream stream responsibilities
- restore professional workspaces
- alter database schema
- bypass runtime health verification

Required Load Order:
1. Supabase browser library
2. statscore-data.js
3. statscore-authentication-errors.js
4. statscore-authentication-context.js
5. statscore-authentication-receipts.js
6. statscore-authentication-service.js
7. statscore-authentication-bootstrap.js
8. login.html presentation controller

Status:
CONTROLLED REPLACEMENT — STREAM 1 CONSTITUTIONAL FLOW READINESS

Version:
STATSCORE-AUTHENTICATION-BOOTSTRAP-V1.0.0

==========================================================
*/

(function initializeStatsCoreAuthenticationBootstrap(global) {
  "use strict";

  const BOOTSTRAP_ID =
    "statscore-authentication-bootstrap";

  const VERSION =
    "STATSCORE-AUTHENTICATION-BOOTSTRAP-V1.0.0";

  const AUTHENTICATION_CONTRACT_VERSION =
    "STATSCORE-AUTHENTICATION-CONTRACT-V2.0.0";

  const INITIAL_AUTHENTICATION_CONTEXT_VERSION =
    "STATSCORE-INITIAL-AUTHENTICATION-CONTEXT-V1.0.0";

  const DEFAULT_CONFIGURATION =
    Object.freeze({
      environment:
        "production",

      authenticationSource:
        "supabase_password",

      userTable:
        "sc_users",

      userSelect:
        [
          "sc_user_id",
          "auth_user_id",
          "sc_athlete_id",
          "role",
          "email",
          "created_at"
        ].join(","),

      entryStateRpc:
        "resolve_authentication_entry_state",

      receiptRpc:
        "record_statscore_authentication_receipt",

      lockAuthorities:
        true,

      routes:
        Object.freeze({
          first_time_athlete:
            "snapshot-intake.html" +
            "?new=1" +
            "&role=athlete" +
            "&from=login" +
            "&next=athlete-dashboard.html",

          returning_athlete:
            "athlete-dashboard.html",

          first_time_professional:
            "role-dashboard-intake.html" +
            "?from=login" +
            "&next=role-dashboard.html",

          returning_professional:
            "role-dashboard.html",

          administrator:
            "system.html"
        })
    });

  const STATE = {
    initialized:
      false,

    initializing:
      false,

    configured:
      false,

    clientAvailable:
      false,

    authoritiesAvailable:
      false,

    healthVerified:
      false,

    initializedAt:
      null,

    environment:
      null,

    authenticationSource:
      null,

    userTable:
      null,

    userSelect:
      null,

    entryStateRpc:
      null,

    receiptRpc:
      null,

    routes:
      null,

    lastError:
      null
  };

  /*
  ==========================================================
  BASIC UTILITIES
  ==========================================================
  */

  function nowISO() {
    return new Date().toISOString();
  }

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function clone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(
        JSON.stringify(value)
      );
    }
  }

  function deepFreeze(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object
      .getOwnPropertyNames(value)
      .forEach((propertyName) => {
        deepFreeze(
          value[propertyName]
        );
      });

    return Object.freeze(value);
  }

  function immutableClone(value) {
    return deepFreeze(
      clone(value)
    );
  }

  /*
  ==========================================================
  ERROR AUTHORITY
  ==========================================================
  */

  function getErrorAuthority() {
    return (
      global.STATSCORE_AUTH_ERRORS ||
      null
    );
  }

  function getErrorCodes() {
    return (
      getErrorAuthority()
        ?.ERROR_CODES ||
      {}
    );
  }

  function createBootstrapError(
    internalMessage,
    options = {}
  ) {
    const errorAuthority =
      getErrorAuthority();

    const code =
      cleanString(
        options.code
      ) ||
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR";

    if (
      errorAuthority &&
      typeof errorAuthority.create ===
        "function"
    ) {
      return errorAuthority.create(
        code,
        internalMessage,
        {
          cause:
            options.cause ||
            null,

          details:
            immutableClone(
              options.details ||
              {}
            )
        }
      );
    }

    if (
      errorAuthority &&
      typeof errorAuthority
        .StatsCoreAuthenticationError ===
        "function"
    ) {
      return new errorAuthority
        .StatsCoreAuthenticationError(
          code,
          internalMessage,
          {
            cause:
              options.cause ||
              null,

            details:
              immutableClone(
                options.details ||
                {}
              )
          }
        );
    }

    const error =
      new Error(
        internalMessage ||
        "Authentication runtime configuration failed."
      );

    error.name =
      "STATScoreAuthenticationBootstrapError";

    error.code =
      code;

    error.user_message =
      options.user_message ||
      "The governed authentication runtime has not been configured.";

    error.details =
      immutableClone(
        options.details ||
        {}
      );

    if (options.cause) {
      error.cause =
        options.cause;
    }

    return error;
  }

  function assertCondition(
    condition,
    internalMessage,
    options = {}
  ) {
    if (condition) {
      return true;
    }

    throw createBootstrapError(
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  AUTHORITY RESOLUTION
  ==========================================================
  */

  function getSupabaseClient() {
    return (
      global.STATScoreData
        ?.getClient?.() ||

      global.STATScoreCore
        ?.getClient?.() ||

      global.supabaseClient ||

      global.STATScoreSupabaseClient ||

      global.STATScoreSupabase ||

      null
    );
  }

  function getContextAuthority() {
    return (
      global.STATSCORE_AUTH_CONTEXT ||
      null
    );
  }

  function getReceiptAuthority() {
    return (
      global.STATSCORE_AUTH_RECEIPTS ||
      null
    );
  }

  function getAuthenticationService() {
    return (
      global.STATSCORE_AUTH_SERVICE ||
      null
    );
  }

  /*
  ==========================================================
  RUNTIME CONFIGURATION
  ==========================================================
  */

  function validateSelectList(value) {
    const selection =
      cleanString(value);

    assertCondition(
      Boolean(selection),
      "Authentication identity selection must be configured."
    );

    assertCondition(
      !selection.includes("*"),
      "Wildcard authentication identity selection is prohibited."
    );

    const columns =
      selection
        .split(",")
        .map((column) => {
          return cleanString(column);
        });

    assertCondition(
      columns.length > 0 &&
      columns.every((column) => {
        return (
          Boolean(column) &&
          /^[A-Za-z_][A-Za-z0-9_]*$/
            .test(column)
        );
      }),
      "Authentication identity selection contains an invalid database column."
    );

    const requiredColumns =
      [
        "sc_user_id",
        "auth_user_id",
        "role"
      ];

    requiredColumns.forEach(
      (requiredColumn) => {
        assertCondition(
          columns.includes(
            requiredColumn
          ),
          (
            "Authentication identity selection is missing " +
            requiredColumn +
            "."
          )
        );
      }
    );

    return columns.join(",");
  }

  function readRuntimeConfiguration() {
    const suppliedConfiguration =
      global
        .STATSCORE_AUTHENTICATION_BOOTSTRAP_CONFIG;

    if (
      suppliedConfiguration !==
        undefined
    ) {
      assertCondition(
        suppliedConfiguration &&
        typeof suppliedConfiguration ===
          "object" &&
        !Array.isArray(
          suppliedConfiguration
        ),
        "STATSCORE_AUTHENTICATION_BOOTSTRAP_CONFIG must be an object."
      );
    }

    const suppliedRoutes =
      suppliedConfiguration
        ?.routes;

    if (
      suppliedRoutes !== undefined
    ) {
      assertCondition(
        suppliedRoutes &&
        typeof suppliedRoutes ===
          "object" &&
        !Array.isArray(
          suppliedRoutes
        ),
        "Authentication bootstrap routes must be an object."
      );
    }

    const nextConfiguration = {
      ...DEFAULT_CONFIGURATION,

      ...(suppliedConfiguration || {}),

      routes: {
        ...DEFAULT_CONFIGURATION.routes,
        ...(suppliedRoutes || {})
      }
    };

    const environment =
      cleanString(
        nextConfiguration.environment
      );

    const authenticationSource =
      cleanString(
        nextConfiguration
          .authenticationSource
      );

    const userTable =
      cleanString(
        nextConfiguration.userTable
      );

    const userSelect =
      validateSelectList(
        nextConfiguration.userSelect
      );

    const entryStateRpc =
      cleanString(
        nextConfiguration.entryStateRpc
      );

    const receiptRpc =
      cleanString(
        nextConfiguration.receiptRpc
      );

    assertCondition(
      Boolean(environment),
      "Authentication environment must be configured."
    );

    assertCondition(
      Boolean(authenticationSource),
      "Authentication source must be configured."
    );

    assertCondition(
      Boolean(userTable),
      "Authentication identity table must be configured."
    );

    assertCondition(
      Boolean(entryStateRpc),
      "Authentication Entry-State RPC must be configured."
    );

    assertCondition(
      Boolean(receiptRpc),
      "Authentication Receipt RPC must be configured."
    );

    const requiredRouteKeys =
      [
        "first_time_athlete",
        "returning_athlete",
        "first_time_professional",
        "returning_professional",
        "administrator"
      ];

    requiredRouteKeys.forEach(
      (routeKey) => {
        assertCondition(
          Boolean(
            cleanString(
              nextConfiguration
                .routes[routeKey]
            )
          ),
          (
            "Authentication route " +
            routeKey +
            " must be configured."
          )
        );
      }
    );

    return immutableClone({
      environment,

      authenticationSource,

      userTable,

      userSelect,

      entryStateRpc,

      receiptRpc,

      lockAuthorities:
        nextConfiguration
          .lockAuthorities !==
        false,

      routes:
        nextConfiguration.routes
    });
  }

  /*
  ==========================================================
  CLIENT VALIDATION
  ==========================================================
  */

  function validateSupabaseClient(client) {
    assertCondition(
      client &&
      typeof client === "object",
      "The approved shared Supabase client is unavailable."
    );

    assertCondition(
      client.auth &&
      typeof client.auth
        .signInWithPassword ===
        "function",
      "The approved Supabase client does not provide auth.signInWithPassword()."
    );

    assertCondition(
      client.auth &&
      typeof client.auth.signOut ===
        "function",
      "The approved Supabase client does not provide auth.signOut()."
    );

    assertCondition(
      typeof client.from ===
        "function",
      "The approved Supabase client does not provide from()."
    );

    assertCondition(
      typeof client.rpc ===
        "function",
      "The approved Supabase client does not provide rpc()."
    );

    return true;
  }

  /*
  ==========================================================
  AUTHORITY VALIDATION
  ==========================================================
  */

  function validateAuthorities() {
    const errorAuthority =
      getErrorAuthority();

    const contextAuthority =
      getContextAuthority();

    const receiptAuthority =
      getReceiptAuthority();

    const authenticationService =
      getAuthenticationService();

    assertCondition(
      errorAuthority &&
      typeof errorAuthority ===
        "object",
      "Authentication Error Authority has not been loaded."
    );

    assertCondition(
      contextAuthority &&
      typeof contextAuthority.create ===
        "function" &&
      typeof contextAuthority.publish ===
        "function" &&
      typeof contextAuthority.clear ===
        "function",
      "Authentication Context Authority has not been loaded."
    );

    assertCondition(
      receiptAuthority &&
      typeof receiptAuthority.configure ===
        "function" &&
      typeof receiptAuthority.write ===
        "function" &&
      typeof receiptAuthority
        .getConfiguration ===
        "function",
      "Authentication Receipt Authority has not been loaded."
    );

    assertCondition(
      authenticationService &&
      typeof authenticationService
        .configure ===
        "function" &&
      typeof authenticationService
        .authenticate ===
        "function" &&
      typeof authenticationService
        .getConfiguration ===
        "function",
      "Authentication Service has not been loaded."
    );

    return Object.freeze({
      errorAuthority,

      contextAuthority,

      receiptAuthority,

      authenticationService
    });
  }

  /*
  ==========================================================
  AUTHORITY CONFIGURATION
  ==========================================================
  */

  function configureReceiptAuthority(
    receiptAuthority,
    client,
    configuration,
    options = {}
  ) {
    return receiptAuthority
      .configure({
        client,

        receiptRpc:
          configuration.receiptRpc,

        rpc:
          configuration.receiptRpc,

        environment:
          configuration.environment,

        lock:
          configuration.lockAuthorities,

        force_reload:
          options.force_reload ===
          true
      });
  }

  function configureAuthenticationService(
    authenticationService,
    client,
    configuration,
    options = {}
  ) {
    return authenticationService
      .configure({
        client,

        authenticationSource:
          configuration
            .authenticationSource,

        userTable:
          configuration.userTable,

        userSelect:
          configuration.userSelect,

        entryStateRpc:
          configuration.entryStateRpc,

        routes:
          configuration.routes,

        lock:
          configuration.lockAuthorities,

        force_reload:
          options.force_reload ===
          true
      });
  }

  /*
  ==========================================================
  HEALTH VERIFICATION
  ==========================================================
  */

  function verifyConfiguredAuthorities(
    receiptAuthority,
    authenticationService
  ) {
    const receiptConfiguration =
      receiptAuthority
        .getConfiguration();

    const serviceConfiguration =
      authenticationService
        .getConfiguration();

    assertCondition(
      receiptConfiguration &&
      receiptConfiguration.configured ===
        true,
      "Authentication Receipt Authority did not confirm configuration."
    );

    assertCondition(
      serviceConfiguration &&
      serviceConfiguration.configured ===
        true,
      "Authentication Service did not confirm configuration."
    );

    assertCondition(
      cleanString(
        receiptConfiguration
          .receipt_rpc
      ) ===
      cleanString(
        STATE.receiptRpc
      ),
      "Authentication Receipt RPC configuration does not match the bootstrap contract."
    );

    assertCondition(
      cleanString(
        serviceConfiguration
          .entry_state_rpc
      ) ===
      cleanString(
        STATE.entryStateRpc
      ),
      "Authentication Entry-State RPC configuration does not match the bootstrap contract."
    );

    assertCondition(
      cleanString(
        serviceConfiguration
          .user_table
      ) ===
      cleanString(
        STATE.userTable
      ),
      "Authentication identity-table configuration does not match the bootstrap contract."
    );

    assertCondition(
      cleanString(
        serviceConfiguration
          .user_select
      ) ===
      cleanString(
        STATE.userSelect
      ),
      "Authentication identity-selection configuration does not match the bootstrap contract."
    );

    const receiptHealth =
      typeof receiptAuthority
        .runHealthCheck ===
        "function"
        ? receiptAuthority
            .runHealthCheck()
        : null;

    const serviceHealth =
      typeof authenticationService
        .runHealthCheck ===
        "function"
        ? authenticationService
            .runHealthCheck()
        : null;

    assertCondition(
      !receiptHealth ||
      receiptHealth.ok === true,
      "Authentication Receipt Authority health verification failed.",
      {
        details: {
          findings:
            receiptHealth
              ?.findings ||
            []
        }
      }
    );

    assertCondition(
      !serviceHealth ||
      serviceHealth.ok === true,
      "Authentication Service health verification failed.",
      {
        details: {
          findings:
            serviceHealth
              ?.findings ||
            []
        }
      }
    );

    return Object.freeze({
      receiptConfiguration,

      serviceConfiguration,

      receiptHealth,

      serviceHealth
    });
  }

  /*
  ==========================================================
  STATE PUBLICATION
  ==========================================================
  */

  function publishState() {
    const publishedState =
      immutableClone({
        bootstrap_id:
          BOOTSTRAP_ID,

        version:
          VERSION,

        authentication_contract_version:
          AUTHENTICATION_CONTRACT_VERSION,

        initial_authentication_context_version:
          INITIAL_AUTHENTICATION_CONTEXT_VERSION,

        initialized:
          STATE.initialized,

        initializing:
          STATE.initializing,

        configured:
          STATE.configured,

        client_available:
          STATE.clientAvailable,

        authorities_available:
          STATE.authoritiesAvailable,

        health_verified:
          STATE.healthVerified,

        initialized_at:
          STATE.initializedAt,

        environment:
          STATE.environment,

        authentication_source:
          STATE.authenticationSource,

        user_table:
          STATE.userTable,

        user_select:
          STATE.userSelect,

        entry_state_rpc:
          STATE.entryStateRpc,

        receipt_rpc:
          STATE.receiptRpc,

        routes:
          clone(
            STATE.routes
          ),

        last_error:
          clone(
            STATE.lastError
          )
      });

    global
      .STATSCORE_AUTHENTICATION_BOOTSTRAP_STATE =
      publishedState;

    global.STATScore =
      global.STATScore ||
      {};

    global.STATScore
      .AuthenticationBootstrapState =
      publishedState;

    return publishedState;
  }

  /*
  ==========================================================
  EVENTS
  ==========================================================
  */

  function emit(
    eventName,
    payload = {}
  ) {
    const detail =
      immutableClone({
        bootstrap_id:
          BOOTSTRAP_ID,

        version:
          VERSION,

        timestamp:
          nowISO(),

        ...clone(payload)
      });

    global.dispatchEvent(
      new CustomEvent(
        `statscore:authentication-bootstrap-${eventName}`,
        {
          detail
        }
      )
    );

    if (
      global.STATScore
        ?.EngineBus?.emit
    ) {
      global.STATScore
        .EngineBus
        .emit(
          `authentication_bootstrap_${eventName}`,
          detail
        );
    }

    return detail;
  }

  function publishRuntimeReady(
    state,
    verification
  ) {
    const detail =
      immutableClone({
        bootstrap_id:
          BOOTSTRAP_ID,

        version:
          VERSION,

        configured:
          true,

        ready:
          true,

        initialized:
          true,

        client_available:
          true,

        authorities_available:
          true,

        health_verified:
          true,

        environment:
          STATE.environment,

        authentication_source:
          STATE.authenticationSource,

        user_table:
          STATE.userTable,

        entry_state_rpc:
          STATE.entryStateRpc,

        receipt_rpc:
          STATE.receiptRpc,

        initialized_at:
          STATE.initializedAt,

        receipt_health_ok:
          verification
            .receiptHealth
            ?.ok !==
          false,

        service_health_ok:
          verification
            .serviceHealth
            ?.ok !==
          false,

        state
      });

    global.dispatchEvent(
      new CustomEvent(
        "statscore:authentication-runtime-ready",
        {
          detail
        }
      )
    );

    return detail;
  }

  function publishRuntimeFailed() {
    const detail =
      immutableClone({
        bootstrap_id:
          BOOTSTRAP_ID,

        version:
          VERSION,

        configured:
          false,

        ready:
          false,

        initialized:
          false,

        client_available:
          STATE.clientAvailable,

        authorities_available:
          STATE.authoritiesAvailable,

        health_verified:
          false,

        error_code:
          STATE.lastError
            ?.code ||
          "AUTHENTICATION_CONFIGURATION_ERROR",

        user_message:
          STATE.lastError
            ?.user_message ||
          "The governed authentication runtime has not been configured.",

        occurred_at:
          STATE.lastError
            ?.occurred_at ||
          nowISO()
      });

    global.dispatchEvent(
      new CustomEvent(
        "statscore:authentication-runtime-failed",
        {
          detail
        }
      )
    );

    return detail;
  }

  /*
  ==========================================================
  INITIALIZATION
  ==========================================================
  */

  async function initialize(
    options = {}
  ) {
    if (
      STATE.initialized &&
      options.force_reload !== true
    ) {
      return publishState();
    }

    if (STATE.initializing) {
      throw createBootstrapError(
        "Authentication bootstrap initialization is already in progress."
      );
    }

    STATE.initializing =
      true;

    STATE.lastError =
      null;

    STATE.healthVerified =
      false;

    publishState();

    emit(
      "initializing"
    );

    try {
      const configuration =
        readRuntimeConfiguration();

      const client =
        getSupabaseClient();

      validateSupabaseClient(
        client
      );

      STATE.clientAvailable =
        true;

      const authorities =
        validateAuthorities();

      STATE.authoritiesAvailable =
        true;

      STATE.environment =
        configuration.environment;

      STATE.authenticationSource =
        configuration
          .authenticationSource;

      STATE.userTable =
        configuration.userTable;

      STATE.userSelect =
        configuration.userSelect;

      STATE.entryStateRpc =
        configuration.entryStateRpc;

      STATE.receiptRpc =
        configuration.receiptRpc;

      STATE.routes =
        clone(
          configuration.routes
        );

      configureReceiptAuthority(
        authorities.receiptAuthority,
        client,
        configuration,
        options
      );

      configureAuthenticationService(
        authorities.authenticationService,
        client,
        configuration,
        options
      );

      const verification =
        verifyConfiguredAuthorities(
          authorities.receiptAuthority,
          authorities.authenticationService
        );

      STATE.initialized =
        true;

      STATE.configured =
        true;

      STATE.healthVerified =
        true;

      STATE.initializedAt =
        nowISO();

      STATE.lastError =
        null;

      const publishedState =
        publishState();

      emit(
        "ready",
        {
          configured:
            true,

          environment:
            STATE.environment,

          authentication_source:
            STATE.authenticationSource,

          user_table:
            STATE.userTable,

          entry_state_rpc:
            STATE.entryStateRpc,

          receipt_rpc:
            STATE.receiptRpc,

          initialized_at:
            STATE.initializedAt
        }
      );

      publishRuntimeReady(
        publishedState,
        verification
      );

      console.info(
        "[STATS-CORE Authentication Bootstrap] Runtime ready:",
        VERSION
      );

      return publishedState;
    } catch (rawError) {
      const error =
        rawError &&
        cleanString(
          rawError.code
        )
          ? rawError
          : createBootstrapError(
              cleanString(
                rawError?.message
              ) ||
              "Authentication runtime bootstrap failed.",
              {
                cause:
                  rawError
              }
            );

      STATE.initialized =
        false;

      STATE.configured =
        false;

      STATE.healthVerified =
        false;

      STATE.clientAvailable =
        Boolean(
          getSupabaseClient()
        );

      STATE.authoritiesAvailable =
        Boolean(
          getContextAuthority() &&
          getReceiptAuthority() &&
          getAuthenticationService()
        );

      STATE.lastError =
        immutableClone({
          code:
            cleanString(
              error.code
            ) ||
            "AUTHENTICATION_CONFIGURATION_ERROR",

          user_message:
            cleanString(
              error.user_message
            ) ||
            "The governed authentication runtime has not been configured.",

          internal_message:
            cleanString(
              error.message
            ) ||
            "Authentication bootstrap failed.",

          occurred_at:
            nowISO()
        });

      publishState();

      emit(
        "failed",
        {
          configured:
            false,

          error_code:
            STATE.lastError.code,

          client_available:
            STATE.clientAvailable,

          authorities_available:
            STATE.authoritiesAvailable
        }
      );

      publishRuntimeFailed();

      console.error(
        "[STATS-CORE Authentication Bootstrap] Configuration failed:",
        error
      );

      return publishState();
    } finally {
      STATE.initializing =
        false;

      publishState();
    }
  }

  /*
  ==========================================================
  DIAGNOSTICS
  ==========================================================
  */

  function getState() {
    return publishState();
  }

  function getConfiguration() {
    let runtimeConfiguration =
      null;

    try {
      runtimeConfiguration =
        readRuntimeConfiguration();
    } catch (_) {
      runtimeConfiguration =
        null;
    }

    return immutableClone({
      bootstrap_id:
        BOOTSTRAP_ID,

      version:
        VERSION,

      initialized:
        STATE.initialized,

      configured:
        STATE.configured,

      client_available:
        Boolean(
          getSupabaseClient()
        ),

      authorities_available:
        Boolean(
          getContextAuthority() &&
          getReceiptAuthority() &&
          getAuthenticationService()
        ),

      health_verified:
        STATE.healthVerified,

      runtime_configuration:
        runtimeConfiguration,

      state:
        clone(
          STATE
        )
    });
  }

  function runHealthCheck() {
    const findings = [];

    const client =
      getSupabaseClient();

    if (!client) {
      findings.push(
        "SUPABASE_CLIENT_UNAVAILABLE"
      );
    } else {
      if (
        !client.auth ||
        typeof client.auth
          .signInWithPassword !==
          "function"
      ) {
        findings.push(
          "SUPABASE_AUTHENTICATION_UNAVAILABLE"
        );
      }

      if (
        !client.auth ||
        typeof client.auth.signOut !==
          "function"
      ) {
        findings.push(
          "SUPABASE_SIGN_OUT_UNAVAILABLE"
        );
      }

      if (
        typeof client.from !==
          "function"
      ) {
        findings.push(
          "SUPABASE_DATA_CLIENT_UNAVAILABLE"
        );
      }

      if (
        typeof client.rpc !==
          "function"
      ) {
        findings.push(
          "SUPABASE_RPC_UNAVAILABLE"
        );
      }
    }

    if (!getErrorAuthority()) {
      findings.push(
        "AUTHENTICATION_ERRORS_UNAVAILABLE"
      );
    }

    if (!getContextAuthority()) {
      findings.push(
        "AUTHENTICATION_CONTEXT_UNAVAILABLE"
      );
    }

    if (!getReceiptAuthority()) {
      findings.push(
        "AUTHENTICATION_RECEIPTS_UNAVAILABLE"
      );
    }

    if (!getAuthenticationService()) {
      findings.push(
        "AUTHENTICATION_SERVICE_UNAVAILABLE"
      );
    }

    if (!STATE.initialized) {
      findings.push(
        "AUTHENTICATION_BOOTSTRAP_NOT_INITIALIZED"
      );
    }

    if (!STATE.configured) {
      findings.push(
        "AUTHENTICATION_RUNTIME_NOT_CONFIGURED"
      );
    }

    if (!STATE.healthVerified) {
      findings.push(
        "AUTHENTICATION_HEALTH_NOT_VERIFIED"
      );
    }

    const receiptHealth =
      getReceiptAuthority()
        ?.runHealthCheck?.();

    if (
      receiptHealth &&
      receiptHealth.ok !== true
    ) {
      findings.push(
        "AUTHENTICATION_RECEIPT_HEALTH_FAILED"
      );
    }

    const serviceHealth =
      getAuthenticationService()
        ?.runHealthCheck?.();

    if (
      serviceHealth &&
      serviceHealth.ok !== true
    ) {
      findings.push(
        "AUTHENTICATION_SERVICE_HEALTH_FAILED"
      );
    }

    return immutableClone({
      ok:
        findings.length === 0,

      bootstrap_id:
        BOOTSTRAP_ID,

      version:
        VERSION,

      initialized:
        STATE.initialized,

      configured:
        STATE.configured,

      client_available:
        Boolean(client),

      authorities_available:
        Boolean(
          getContextAuthority() &&
          getReceiptAuthority() &&
          getAuthenticationService()
        ),

      health_verified:
        STATE.healthVerified,

      findings,

      checked_at:
        nowISO()
    });
  }

  /*
  ==========================================================
  PUBLIC BOOTSTRAP
  ==========================================================
  */

  const api =
    Object.freeze({
      bootstrap_id:
        BOOTSTRAP_ID,

      version:
        VERSION,

      authentication_contract_version:
        AUTHENTICATION_CONTRACT_VERSION,

      initial_authentication_context_version:
        INITIAL_AUTHENTICATION_CONTEXT_VERSION,

      initialize,

      getState,

      getConfiguration,

      runHealthCheck
    });

  global
    .STATSCORE_AUTHENTICATION_BOOTSTRAP =
    api;

  global.STATScore =
    global.STATScore ||
    {};

  global.STATScore
    .AuthenticationBootstrap =
    api;

  publishState();

  global.dispatchEvent(
    new CustomEvent(
      "statscore:authentication-bootstrap-loaded",
      {
        detail:
          immutableClone({
            bootstrap_id:
              BOOTSTRAP_ID,

            version:
              VERSION,

            loaded:
              true,

            initialized:
              false,

            configured:
              false
          })
      }
    )
  );

  /*
  ==========================================================
  AUTOMATIC INITIALIZATION
  ==========================================================
  */

  function autoInitialize() {
    initialize()
      .catch((error) => {
        console.error(
          "[STATS-CORE Authentication Bootstrap] Unhandled initialization failure:",
          error
        );
      });
  }

  if (
    document.readyState ===
      "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      autoInitialize,
      {
        once:
          true
      }
    );
  } else {
    autoInitialize();
  }

  console.info(
    "[STATS-CORE Authentication Bootstrap] Loaded:",
    VERSION
  );
})(window); 
