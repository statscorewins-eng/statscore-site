/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-registration-bootstrap.js

Asset Type:
JavaScript Runtime Bootstrap / Registration Configuration

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Account Registration Authority

System Layer:
Public Entry / Registration Runtime Bootstrap

Primary Consumers:
- register.html
- statscore-registration-receipts.js
- statscore-registration-service.js
- authorized diagnostics

Purpose:
Connects the governed Enterprise Registration authorities
to the approved browser Supabase client and configured
database RPC contracts.

Load Order:
1. Supabase library
2. Approved Supabase client/bootstrap
3. statscore-registration-errors.js
4. statscore-registration-context.js
5. statscore-registration-receipts.js
6. statscore-registration-service.js
7. statscore-registration-bootstrap.js

Consumes:
- approved browser Supabase client
- Registration Receipt Authority
- Registration Service
- controlled bootstrap configuration

Provides:
- receipt-authority configuration
- registration-service configuration
- governed runtime readiness event
- bootstrap diagnostics
- fail-closed configuration behavior

Does NOT:
- contain Supabase service-role credentials
- create a Supabase client from hardcoded secrets
- create authentication accounts
- initialize enterprise identity directly
- write Registration Receipts directly
- authenticate users
- initialize Runtime Context
- create athlete records
- create professional workspaces
- route users

Status:
ENGINEERING CHANGE CONTROL — ENTERPRISE REGISTRATION BUILD

==========================================================
*/

(function initializeRegistrationBootstrap(global) {
  "use strict";

  const BOOTSTRAP_ID =
    "statscore-registration-bootstrap";

  const VERSION =
    "STATSCORE-REGISTRATION-BOOTSTRAP-V1.0.0";

  const DEFAULT_CONFIGURATION = Object.freeze({
    environment: "production",

    identityRpc:
      "initialize_statscore_enterprise_identity",

    receiptRpc:
      "record_statscore_registration_receipt",

    requireEmailVerification: true,

    registrationSource:
      "register.html",

    requestedDestination:
      "login.html",

    lockAuthorities: true
  });

  const STATE = {
    initialized: false,
    initializing: false,
    initialized_at: null,

    configured: false,
    client_available: false,

    environment: null,
    identity_rpc: null,
    receipt_rpc: null,

    last_error: null
  };

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
      value === undefined ||
      value === null
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
      .forEach((property) => {
        deepFreeze(value[property]);
      });

    return Object.freeze(value);
  }

  function immutableClone(value) {
    return deepFreeze(
      clone(value)
    );
  }

  function getErrorsAuthority() {
    return (
      global.STATSCORE_REGISTRATION_ERRORS ||
      global.STATScore?.RegistrationErrors ||
      null
    );
  }

  function getErrorCodes() {
    return (
      getErrorsAuthority()?.ERROR_CODES ||
      {}
    );
  }

  function createBootstrapError(
    internalMessage,
    metadata = {},
    cause = null
  ) {
    const authority =
      getErrorsAuthority();

    const code =
      getErrorCodes().CONFIGURATION_ERROR ||
      "REGISTRATION_CONFIGURATION_ERROR";

    if (
      authority &&
      typeof authority.createRegistrationError ===
        "function"
    ) {
      return authority.createRegistrationError(
        code,
        internalMessage,
        {
          operation:
            "registration_bootstrap",

          metadata,

          cause
        }
      );
    }

    const error =
      new Error(
        internalMessage ||
        "Registration runtime configuration failed."
      );

    error.name =
      "STATScoreRegistrationBootstrapError";

    error.code =
      code;

    error.user_message =
      "The governed registration runtime has not been configured.";

    error.metadata =
      immutableClone(metadata);

    return error;
  }

  function assertCondition(
    condition,
    internalMessage,
    metadata = {}
  ) {
    if (condition) {
      return true;
    }

    throw createBootstrapError(
      internalMessage,
      metadata
    );
  }

  function getSupabaseClient() {
    return (
      global.STATScoreCore?.getClient?.() ||
      global.STATScoreData?.getClient?.() ||
      global.STATScoreSupabase ||
      global.STATScoreSupabaseClient ||
      global.supabaseClient ||
      null
    );
  }

  function getReceiptsAuthority() {
    return (
      global.STATSCORE_REGISTRATION_RECEIPTS ||
      global.STATScore
        ?.RegistrationReceipts ||
      null
    );
  }

  function getRegistrationService() {
    return (
      global.STATSCORE_REGISTRATION_SERVICE ||
      global.STATScore
        ?.RegistrationService ||
      null
    );
  }

  function readRuntimeConfiguration() {
    const supplied =
      global
        .STATSCORE_REGISTRATION_BOOTSTRAP_CONFIG;

    if (
      supplied !== undefined &&
      (
        !supplied ||
        typeof supplied !== "object" ||
        Array.isArray(supplied)
      )
    ) {
      throw createBootstrapError(
        "STATSCORE_REGISTRATION_BOOTSTRAP_CONFIG must be an object."
      );
    }

    const next = {
      ...DEFAULT_CONFIGURATION,
      ...(supplied || {})
    };

    const environment =
      cleanString(next.environment);

    const identityRpc =
      cleanString(next.identityRpc);

    const receiptRpc =
      cleanString(next.receiptRpc);

    const registrationSource =
      cleanString(
        next.registrationSource
      );

    const requestedDestination =
      cleanString(
        next.requestedDestination
      );

    assertCondition(
      Boolean(environment),
      "Registration environment must be configured."
    );

    assertCondition(
      Boolean(identityRpc),
      "Registration identity RPC must be configured."
    );

    assertCondition(
      Boolean(receiptRpc),
      "Registration receipt RPC must be configured."
    );

    assertCondition(
      Boolean(registrationSource),
      "Registration source must be configured."
    );

    assertCondition(
      Boolean(requestedDestination),
      "Registration requested destination must be configured."
    );

    return immutableClone({
      environment,

      identityRpc,

      receiptRpc,

      requireEmailVerification:
        next.requireEmailVerification !== false,

      registrationSource,

      requestedDestination,

      lockAuthorities:
        next.lockAuthorities !== false
    });
  }

  function validateSupabaseClient(client) {
    assertCondition(
      client &&
      typeof client === "object",
      "The approved Supabase client is unavailable."
    );

    assertCondition(
      client.auth &&
      typeof client.auth.signUp ===
        "function",
      "The approved Supabase client does not provide auth.signUp()."
    );

    assertCondition(
      typeof client.rpc ===
        "function",
      "The approved Supabase client does not provide rpc()."
    );

    return true;
  }

  function validateAuthorities() {
    const errorsAuthority =
      getErrorsAuthority();

    const contextAuthority =
      global
        .STATSCORE_REGISTRATION_CONTEXT_AUTHORITY ||
      global.STATScore
        ?.RegistrationContextAuthority ||
      null;

    const receiptsAuthority =
      getReceiptsAuthority();

    const registrationService =
      getRegistrationService();

    assertCondition(
      errorsAuthority &&
      typeof errorsAuthority === "object",
      "Registration Error Authority has not been loaded."
    );

    assertCondition(
      contextAuthority &&
      typeof contextAuthority.createContext ===
        "function",
      "Registration Context Authority has not been loaded."
    );

    assertCondition(
      receiptsAuthority &&
      typeof receiptsAuthority.configure ===
        "function",
      "Registration Receipt Authority has not been loaded."
    );

    assertCondition(
      registrationService &&
      typeof registrationService.configure ===
        "function",
      "Registration Service has not been loaded."
    );

    return Object.freeze({
      errorsAuthority,
      contextAuthority,
      receiptsAuthority,
      registrationService
    });
  }

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
        `statscore:registration-bootstrap-${eventName}`,
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
          `registration_bootstrap_${eventName}`,
          detail
        );
    }

    return detail;
  }

  function publishState() {
    const published =
      immutableClone({
        bootstrap_id:
          BOOTSTRAP_ID,

        version:
          VERSION,

        ...clone(STATE)
      });

    global.STATSCORE_REGISTRATION_BOOTSTRAP_STATE =
      published;

    global.STATScore =
      global.STATScore || {};

    global.STATScore
      .RegistrationBootstrapState =
      published;

    return published;
  }

  function configureReceiptAuthority(
    authority,
    client,
    configuration
  ) {
    return authority.configure({
      client,

      receiptRpc:
        configuration.receiptRpc,

      environment:
        configuration.environment,

      registrationVersion:
        "STATSCORE-REGISTRATION-V1.0.0",

      authenticationContractVersion:
        "STATSCORE-AUTHENTICATION-CONTRACT-V1.0.0",

      lock:
        configuration.lockAuthorities
    });
  }

  function configureRegistrationService(
    service,
    client,
    configuration
  ) {
    return service.configure({
      client,

      identityRpc:
        configuration.identityRpc,

      requireEmailVerification:
        configuration
          .requireEmailVerification,

      environment:
        configuration.environment,

      registrationSource:
        configuration.registrationSource,

      requestedDestination:
        configuration.requestedDestination,

      lock:
        configuration.lockAuthorities
    });
  }

  function verifyConfiguredAuthorities(
    receiptsAuthority,
    registrationService
  ) {
    const receiptConfiguration =
      receiptsAuthority
        .getConfiguration?.();

    const serviceConfiguration =
      registrationService
        .getConfiguration?.();

    assertCondition(
      receiptConfiguration &&
      receiptConfiguration.configured ===
        true,
      "Registration Receipt Authority did not confirm configuration."
    );

    assertCondition(
      serviceConfiguration &&
      serviceConfiguration.configured ===
        true,
      "Registration Service did not confirm configuration."
    );

    const receiptHealth =
      receiptsAuthority
        .runHealthCheck?.();

    const serviceHealth =
      registrationService
        .runHealthCheck?.();

    assertCondition(
      !receiptHealth ||
      receiptHealth.persistence_available ===
        true,
      "Registration Receipt persistence is unavailable."
    );

    assertCondition(
      !serviceHealth ||
      serviceHealth.ok === true,
      "Registration Service health verification failed.",
      {
        findings:
          serviceHealth?.findings || []
      }
    );

    return Object.freeze({
      receiptConfiguration,
      serviceConfiguration,
      receiptHealth,
      serviceHealth
    });
  }

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
        "Registration bootstrap initialization is already in progress."
      );
    }

    STATE.initializing = true;
    STATE.last_error = null;

    publishState();

    emit("initializing");

    try {
      const configuration =
        readRuntimeConfiguration();

      const client =
        getSupabaseClient();

      validateSupabaseClient(client);

      const authorities =
        validateAuthorities();

      configureReceiptAuthority(
        authorities.receiptsAuthority,
        client,
        configuration
      );

      configureRegistrationService(
        authorities.registrationService,
        client,
        configuration
      );

      const verification =
        verifyConfiguredAuthorities(
          authorities.receiptsAuthority,
          authorities.registrationService
        );

      STATE.initialized = true;
      STATE.configured = true;
      STATE.client_available = true;

      STATE.environment =
        configuration.environment;

      STATE.identity_rpc =
        configuration.identityRpc;

      STATE.receipt_rpc =
        configuration.receiptRpc;

      STATE.initialized_at =
        nowISO();

      const state =
        publishState();

      emit("ready", {
        configured:
          true,

        environment:
          configuration.environment,

        identity_rpc:
          configuration.identityRpc,

        receipt_rpc:
          configuration.receiptRpc,

        receipt_health_ok:
          verification
            .receiptHealth?.ok !== false,

        service_health_ok:
          verification
            .serviceHealth?.ok === true
      });

      /*
      register.html already listens for this event.
      The event confirms that the service has been
      configured and is ready to receive registration
      requests.
      */
      global.dispatchEvent(
        new CustomEvent(
          "statscore:registration-runtime-ready",
          {
            detail:
              immutableClone({
                bootstrap_id:
                  BOOTSTRAP_ID,

                version:
                  VERSION,

                configured:
                  true,

                ready:
                  true,

                environment:
                  configuration.environment,

                initialized_at:
                  STATE.initialized_at
              })
          }
        )
      );

      console.info(
        "[STATS-CORE Registration Bootstrap] Runtime ready:",
        VERSION
      );

      return state;
    } catch (rawError) {
      const error =
        rawError &&
        rawError.code
          ? rawError
          : createBootstrapError(
              cleanString(
                rawError?.message
              ) ||
              "Registration runtime bootstrap failed.",
              {},
              rawError
            );

      STATE.initialized = false;
      STATE.configured = false;

      STATE.client_available =
        Boolean(
          getSupabaseClient()
        );

      STATE.last_error = {
        code:
          cleanString(error.code) ||
          "REGISTRATION_CONFIGURATION_ERROR",

        user_message:
          cleanString(
            error.user_message
          ) ||
          "The governed registration runtime has not been configured.",

        internal_message:
          cleanString(
            error.internal_message
          ) ||
          cleanString(
            error.message
          ) ||
          "Registration bootstrap failed.",

        occurred_at:
          nowISO()
      };

      publishState();

      emit("failed", {
        configured:
          false,

        error_code:
          STATE.last_error.code
      });

      global.dispatchEvent(
        new CustomEvent(
          "statscore:registration-runtime-failed",
          {
            detail:
              immutableClone({
                bootstrap_id:
                  BOOTSTRAP_ID,

                version:
                  VERSION,

                configured:
                  false,

                ready:
                  false,

                error_code:
                  STATE.last_error.code,

                user_message:
                  STATE.last_error
                    .user_message
              })
          }
        )
      );

      console.error(
        "[STATS-CORE Registration Bootstrap] Configuration failed:",
        error
      );

      throw error;
    } finally {
      STATE.initializing = false;
      publishState();
    }
  }

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

      runtime_configuration:
        runtimeConfiguration,

      state:
        clone(STATE)
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
        typeof client.auth.signUp !==
          "function"
      ) {
        findings.push(
          "SUPABASE_SIGNUP_UNAVAILABLE"
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

    if (!getErrorsAuthority()) {
      findings.push(
        "REGISTRATION_ERRORS_UNAVAILABLE"
      );
    }

    if (
      !global
        .STATSCORE_REGISTRATION_CONTEXT_AUTHORITY
    ) {
      findings.push(
        "REGISTRATION_CONTEXT_UNAVAILABLE"
      );
    }

    if (!getReceiptsAuthority()) {
      findings.push(
        "REGISTRATION_RECEIPTS_UNAVAILABLE"
      );
    }

    if (!getRegistrationService()) {
      findings.push(
        "REGISTRATION_SERVICE_UNAVAILABLE"
      );
    }

    if (!STATE.configured) {
      findings.push(
        "REGISTRATION_RUNTIME_NOT_CONFIGURED"
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

      findings,

      checked_at:
        nowISO()
    });
  }

  const api = Object.freeze({
    bootstrap_id:
      BOOTSTRAP_ID,

    version:
      VERSION,

    initialize,

    getState,

    getConfiguration,

    runHealthCheck
  });

  global.STATSCORE_REGISTRATION_BOOTSTRAP =
    api;

  global.STATScore =
    global.STATScore || {};

  global.STATScore
    .RegistrationBootstrap =
    api;

  publishState();

  global.dispatchEvent(
    new CustomEvent(
      "statscore:registration-bootstrap-loaded",
      {
        detail:
          immutableClone({
            bootstrap_id:
              BOOTSTRAP_ID,

            version:
              VERSION,

            loaded:
              true
          })
      }
    )
  );

  function autoInitialize() {
    initialize().catch(() => {
      /*
      Failure is intentionally published through the
      governed bootstrap and registration-runtime events.
      The presentation layer remains fail-closed.
      */
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
        once: true
      }
    );
  } else {
    autoInitialize();
  }

  console.info(
    "[STATS-CORE Registration Bootstrap] Loaded:",
    VERSION
  );
})(window); 
