/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-authentication-service.js

Asset Type:
JavaScript Orchestration Authority / Enterprise Authentication Service

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Authentication Authority

System Layer:
Authentication Orchestration / Constitutional Entry

Primary Consumers:
- login.html
- statscore-authentication-bootstrap.js
- authorized diagnostics
- Stream 8 Runtime Entry Coordination
- Master Integration Stream

Supporting Authorities:
- statscore-authentication-errors.js
- statscore-authentication-context.js
- statscore-authentication-receipts.js
- statscore-data.js

Purpose:
Coordinates the complete governed authentication lifecycle
for existing enterprise credentials.

The service:

- validates the authentication request
- authenticates credentials through Supabase
- resolves the governed enterprise identity
- resolves the governed enterprise role
- enforces the submitted role hint
- requests first-time or returning entry state
- resolves the authorized constitutional destination
- manufactures the authentication session reference
- creates the seven-field Initial Authentication Context
- persists an immutable Authentication Receipt
- publishes the Initial Authentication Context
- returns the authorized destination to Login Authority
- performs controlled rollback after authentication failure

Constitutional Authentication Context:
- session_id
- user_id
- role
- entry_intent
- authenticated_at
- authentication_source
- requested_destination

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
Stream 1 authenticates, resolves entry identity, publishes the
Initial Authentication Context, and authorizes the initial route.

Stream 1 does not manufacture Enterprise Runtime Context.

Stream 8 consumes the published Initial Authentication Context
during Runtime Entry Coordination.

Does NOT:
- register new accounts
- create auth.users records
- initialize athlete source records
- create athlete_id
- create snapshot_id
- create professional intake context
- create professional workspaces
- manufacture Runtime Context
- restore professional workspaces
- calculate intelligence
- manufacture dashboard contents
- directly execute downstream stream responsibilities
- store passwords
- store provider access tokens
- use Supabase service-role credentials
- trust role metadata as constitutional role authority
- determine first-time status inside this service
- write directly to receipt tables

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
STATSCORE-AUTHENTICATION-SERVICE-V2.0.0

==========================================================
*/

(function initializeStatsCoreAuthenticationService(global) {
  "use strict";

  const SERVICE_ID =
    "statscore-authentication-service";

  const VERSION =
    "STATSCORE-AUTHENTICATION-SERVICE-V2.0.0";

  const AUTHENTICATION_CONTRACT_VERSION =
    "STATSCORE-AUTHENTICATION-CONTRACT-V2.0.0";

  const INITIAL_AUTHENTICATION_CONTEXT_VERSION =
    "STATSCORE-INITIAL-AUTHENTICATION-CONTEXT-V1.0.0";

  const DEFAULT_AUTHENTICATION_SOURCE =
    "supabase_password";

  const DEFAULT_ENTRY_INTENT =
    "login";

  const DEFAULT_REQUESTED_DESTINATION =
    "role-aware-default";

  const DEFAULT_ENTRY_STATE_RPC =
    "resolve_authentication_entry_state";

  const DEFAULT_USER_TABLE =
    "sc_users";

  const DEFAULT_USER_SELECT =
    [
      "sc_user_id",
      "auth_user_id",
      "sc_athlete_id",
      "role",
      "email",
      "created_at"
    ].join(",");

  const PROFESSIONAL_ROLES =
    new Set([
      "parent",
      "coach",
      "counselor",
      "recruiter",
      "evaluator",
      "program",
      "trainer"
    ]);

  const ALLOWED_ROLES =
    new Set([
      "athlete",
      "parent",
      "coach",
      "counselor",
      "recruiter",
      "evaluator",
      "program",
      "trainer",
      "administrator"
    ]);

  const DEFAULT_ROUTES =
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
    });

  const STATE = {
    configured:
      false,

    configurationLocked:
      false,

    client:
      null,

    entryStateRpc:
      DEFAULT_ENTRY_STATE_RPC,

    userTable:
      DEFAULT_USER_TABLE,

    userSelect:
      DEFAULT_USER_SELECT,

    authenticationSource:
      DEFAULT_AUTHENTICATION_SOURCE,

    routes:
      {
        ...DEFAULT_ROUTES
      },

    authenticationInProgress:
      false,

    activeCorrelationId:
      null,

    lastResult:
      null,

    lastError:
      null,

    configuredAt:
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

  function normalizeRole(value) {
    const role =
      cleanString(value)
        .toLowerCase();

    return role === "admin"
      ? "administrator"
      : role;
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

  function generateId(prefix) {
    const generatedId =
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
        ? global.crypto.randomUUID()
        : (
          Date.now().toString(36) +
          "-" +
          Math.random()
            .toString(36)
            .slice(2, 12)
        );

    return (
      prefix +
      "-" +
      generatedId
    );
  }

  function appendQueryParameter(
    url,
    name,
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return url;
    }

    const separator =
      url.includes("?")
        ? "&"
        : "?";

    return (
      url +
      separator +
      encodeURIComponent(name) +
      "=" +
      encodeURIComponent(value)
    );
  }

  /*
  ==========================================================
  SUPPORTING AUTHORITIES
  ==========================================================
  */

  function getErrorAuthority() {
    return (
      global.STATSCORE_AUTH_ERRORS ||
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

  function getErrorCodes() {
    return (
      getErrorAuthority()
        ?.ERROR_CODES ||
      {}
    );
  }

  /*
  ==========================================================
  ERROR CONTROL
  ==========================================================
  */

  function createAuthenticationError(
    code,
    internalMessage,
    options = {}
  ) {
    const errorAuthority =
      getErrorAuthority();

    const controlledCode =
      cleanString(code) ||
      getErrorCodes()
        .UNKNOWN_ERROR ||
      "AUTHENTICATION_UNKNOWN_ERROR";

    if (
      errorAuthority &&
      typeof errorAuthority.create ===
        "function"
    ) {
      return errorAuthority.create(
        controlledCode,
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
          controlledCode,
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
        "Authentication operation failed."
      );

    error.name =
      "STATScoreAuthenticationServiceError";

    error.code =
      controlledCode;

    error.user_message =
      options.user_message ||
      "Authentication could not be completed.";

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

  function normalizeAuthenticationError(
    rawError,
    options = {}
  ) {
    const errorAuthority =
      getErrorAuthority();

    if (
      errorAuthority &&
      typeof errorAuthority.normalize ===
        "function"
    ) {
      return errorAuthority.normalize(
        rawError,
        cleanString(
          options.code
        ) ||
        getErrorCodes()
          .AUTHENTICATION_UNAVAILABLE ||
        "AUTHENTICATION_UNAVAILABLE"
      );
    }

    if (
      errorAuthority &&
      typeof errorAuthority
        .mapProviderError ===
        "function"
    ) {
      return errorAuthority
        .mapProviderError(
          rawError
        );
    }

    if (
      rawError &&
      cleanString(
        rawError.code
      )
    ) {
      return rawError;
    }

    return createAuthenticationError(
      cleanString(
        options.code
      ) ||
      getErrorCodes()
        .AUTHENTICATION_UNAVAILABLE ||
      "AUTHENTICATION_UNAVAILABLE",
      cleanString(
        options.internalMessage
      ) ||
      cleanString(
        rawError?.message
      ) ||
      "Authentication operation failed.",
      {
        cause:
          rawError,

        details:
          options.details,

        user_message:
          options.user_message
      }
    );
  }

  function assertCondition(
    condition,
    code,
    internalMessage,
    options = {}
  ) {
    if (condition) {
      return true;
    }

    throw createAuthenticationError(
      code,
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  METADATA CONTROL
  ==========================================================
  */

  function sanitizeMetadata(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return {};
    }

    const blockedKeys =
      new Set([
        "password",
        "confirm_password",
        "encrypted_password",
        "access_token",
        "refresh_token",
        "provider_token",
        "provider_refresh_token",
        "authorization",
        "credential",
        "credentials",
        "secret",
        "session",
        "session_token"
      ]);

    const output = {};

    Object.entries(value)
      .forEach(
        ([key, item]) => {
          const normalizedKey =
            cleanString(key)
              .toLowerCase();

          if (
            !normalizedKey ||
            blockedKeys.has(
              normalizedKey
            )
          ) {
            return;
          }

          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean" ||
            item === null
          ) {
            output[key] =
              item;

            return;
          }

          if (
            Array.isArray(item)
          ) {
            output[key] =
              item
                .slice(0, 25)
                .map((entry) => {
                  if (
                    typeof entry ===
                      "string" ||
                    typeof entry ===
                      "number" ||
                    typeof entry ===
                      "boolean" ||
                    entry === null
                  ) {
                    return entry;
                  }

                  return null;
                });

            return;
          }

          if (
            typeof item === "object"
          ) {
            output[key] =
              sanitizeMetadata(
                item
              );
          }
        }
      );

    return output;
  }

  /*
  ==========================================================
  CONFIGURATION VALIDATION
  ==========================================================
  */

  function validateSupabaseClient(client) {
    assertCondition(
      client &&
      typeof client === "object",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Authentication Service requires an approved Supabase client."
    );

    assertCondition(
      client.auth &&
      typeof client.auth
        .signInWithPassword ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "The approved Supabase client does not provide auth.signInWithPassword()."
    );

    assertCondition(
      client.auth &&
      typeof client.auth.signOut ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "The approved Supabase client does not provide auth.signOut()."
    );

    assertCondition(
      typeof client.from ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "The approved Supabase client does not provide from()."
    );

    assertCondition(
      typeof client.rpc ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "The approved Supabase client does not provide rpc()."
    );

    return true;
  }

  function validateSelectList(value) {
    const selection =
      cleanString(value);

    assertCondition(
      Boolean(selection),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Authentication identity selection must be configured."
    );

    assertCondition(
      !selection.includes("*"),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Wildcard identity selection is prohibited."
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
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Authentication identity selection contains an invalid column."
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
          getErrorCodes()
            .CONFIGURATION_ERROR ||
          "AUTHENTICATION_CONFIGURATION_ERROR",
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

  function assertSupportingAuthorities() {
    const contextAuthority =
      getContextAuthority();

    const receiptAuthority =
      getReceiptAuthority();

    assertCondition(
      contextAuthority &&
      typeof contextAuthority.create ===
        "function" &&
      typeof contextAuthority.publish ===
        "function" &&
      typeof contextAuthority.clear ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Authentication Context Authority has not been loaded."
    );

    assertCondition(
      receiptAuthority &&
      typeof receiptAuthority.write ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Authentication Receipt Authority has not been loaded."
    );

    return true;
  }

  /*
  ==========================================================
  CONFIGURATION
  ==========================================================
  */

  function configure(options = {}) {
    assertCondition(
      options &&
      typeof options === "object" &&
      !Array.isArray(options),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Authentication Service configuration must be an object."
    );

    if (
      STATE.configurationLocked &&
      options.force_reload !== true
    ) {
      throw createAuthenticationError(
        getErrorCodes()
          .CONFIGURATION_ERROR ||
        "AUTHENTICATION_CONFIGURATION_ERROR",
        "Authentication Service configuration is locked for the active runtime."
      );
    }

    if (
      options.client !==
      undefined
    ) {
      validateSupabaseClient(
        options.client
      );

      STATE.client =
        options.client;
    }

    if (
      options.entryStateRpc !==
      undefined
    ) {
      const entryStateRpc =
        cleanString(
          options.entryStateRpc
        );

      assertCondition(
        Boolean(entryStateRpc),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
        "AUTHENTICATION_CONFIGURATION_ERROR",
        "entryStateRpc must be a non-empty string."
      );

      STATE.entryStateRpc =
        entryStateRpc;
    }

    if (
      options.userTable !==
      undefined
    ) {
      const userTable =
        cleanString(
          options.userTable
        );

      assertCondition(
        Boolean(userTable),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
        "AUTHENTICATION_CONFIGURATION_ERROR",
        "userTable must be a non-empty string."
      );

      STATE.userTable =
        userTable;
    }

    if (
      options.userSelect !==
      undefined
    ) {
      STATE.userSelect =
        validateSelectList(
          options.userSelect
        );
    }

    if (
      options.authenticationSource !==
      undefined
    ) {
      const authenticationSource =
        cleanString(
          options.authenticationSource
        );

      assertCondition(
        Boolean(authenticationSource),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
        "AUTHENTICATION_CONFIGURATION_ERROR",
        "authenticationSource must be a non-empty string."
      );

      STATE.authenticationSource =
        authenticationSource;
    }

    if (
      options.routes !==
      undefined
    ) {
      assertCondition(
        options.routes &&
        typeof options.routes ===
          "object" &&
        !Array.isArray(
          options.routes
        ),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
        "AUTHENTICATION_CONFIGURATION_ERROR",
        "Authentication routes must be an object."
      );

      STATE.routes = {
        ...STATE.routes,
        ...options.routes
      };
    }

    validateSupabaseClient(
      STATE.client
    );

    STATE.userSelect =
      validateSelectList(
        STATE.userSelect
      );

    assertCondition(
      Boolean(
        cleanString(
          STATE.entryStateRpc
        )
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Entry-State Authority RPC has not been configured."
    );

    assertSupportingAuthorities();

    STATE.configured =
      true;

    STATE.configuredAt =
      nowISO();

    if (
      options.lock !== false
    ) {
      STATE.configurationLocked =
        true;
    }

    const configuration =
      getConfiguration();

    emit(
      "configured",
      {
        configured:
          true,

        user_table:
          STATE.userTable,

        entry_state_rpc:
          STATE.entryStateRpc
      }
    );

    global.dispatchEvent(
      new CustomEvent(
        "statscore:authentication-service-configured",
        {
          detail:
            configuration
        }
      )
    );

    return configuration;
  }

  function getConfiguration() {
    return immutableClone({
      service_id:
        SERVICE_ID,

      version:
        VERSION,

      authentication_contract_version:
        AUTHENTICATION_CONTRACT_VERSION,

      initial_authentication_context_version:
        INITIAL_AUTHENTICATION_CONTEXT_VERSION,

      configured:
        STATE.configured,

      configuration_locked:
        STATE.configurationLocked,

      configured_at:
        STATE.configuredAt,

      authentication_source:
        STATE.authenticationSource,

      user_table:
        STATE.userTable,

      user_select:
        STATE.userSelect,

      entry_state_rpc:
        STATE.entryStateRpc,

      routes:
        clone(
          STATE.routes
        ),

      initial_authentication_context_fields:
        [
          "session_id",
          "user_id",
          "role",
          "entry_intent",
          "authenticated_at",
          "authentication_source",
          "requested_destination"
        ]
    });
  }

  /*
  ==========================================================
  REQUEST VALIDATION
  ==========================================================
  */

  function validateRequest(rawRequest) {
    assertCondition(
      rawRequest &&
      typeof rawRequest === "object" &&
      !Array.isArray(rawRequest),
      getErrorCodes()
        .INVALID_REQUEST ||
      "AUTHENTICATION_INVALID_REQUEST",
      "Authentication request must be an object."
    );

    const email =
      cleanString(
        rawRequest.email
      ).toLowerCase();

    const password =
      typeof rawRequest.password ===
        "string"
        ? rawRequest.password
        : "";

    const roleHint =
      normalizeRole(
        rawRequest.role_hint
      );

    const entryIntent =
      cleanString(
        rawRequest.entry_intent
      ) ||
      DEFAULT_ENTRY_INTENT;

    const requestedDestination =
      cleanString(
        rawRequest.requested_destination
      ) ||
      DEFAULT_REQUESTED_DESTINATION;

    assertCondition(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email),
      getErrorCodes()
        .INVALID_REQUEST ||
      "AUTHENTICATION_INVALID_REQUEST",
      "Authentication request contains an invalid email address.",
      {
        user_message:
          "Enter a valid authorized email."
      }
    );

    assertCondition(
      Boolean(password),
      getErrorCodes()
        .INVALID_REQUEST ||
      "AUTHENTICATION_INVALID_REQUEST",
      "Authentication request requires a password.",
      {
        user_message:
          "Enter your access password."
      }
    );

    assertCondition(
      !roleHint ||
      ALLOWED_ROLES.has(
        roleHint
      ),
      getErrorCodes()
        .UNSUPPORTED_ROLE ||
      "AUTHENTICATION_UNSUPPORTED_ROLE",
      "The submitted role hint is unsupported.",
      {
        user_message:
          "Select a supported access role."
      }
    );

    assertCondition(
      entryIntent ===
        DEFAULT_ENTRY_INTENT,
      getErrorCodes()
        .INVALID_REQUEST ||
      "AUTHENTICATION_INVALID_REQUEST",
      "Unsupported authentication entry intent."
    );

    return Object.freeze({
      email,

      password,

      role_hint:
        roleHint,

      entry_intent:
        entryIntent,

      requested_destination:
        requestedDestination
    });
  }

  /*
  ==========================================================
  PROVIDER AUTHENTICATION
  ==========================================================
  */

  async function authenticateCredentials(
    request
  ) {
    const response =
      await STATE.client.auth
        .signInWithPassword({
          email:
            request.email,

          password:
            request.password
        });

    if (
      response &&
      response.error
    ) {
      throw normalizeAuthenticationError(
        response.error,
        {
          code:
            getErrorCodes()
              .AUTHENTICATION_UNAVAILABLE ||
            "AUTHENTICATION_UNAVAILABLE",

          internalMessage:
            "Supabase credential authentication failed."
        }
      );
    }

    const authUser =
      response
        ?.data
        ?.user ||
      null;

    const authSession =
      response
        ?.data
        ?.session ||
      null;

    assertCondition(
      authUser &&
      Boolean(
        cleanString(
          authUser.id
        )
      ),
      getErrorCodes()
        .AUTHENTICATION_UNAVAILABLE ||
      "AUTHENTICATION_UNAVAILABLE",
      "Authentication provider did not return a valid user."
    );

    assertCondition(
      authSession &&
      typeof authSession ===
        "object",
      getErrorCodes()
        .AUTHENTICATION_UNAVAILABLE ||
      "AUTHENTICATION_UNAVAILABLE",
      "Authentication provider did not return a valid session."
    );

    return Object.freeze({
      authUser,

      authSession
    });
  }

  /*
  ==========================================================
  GOVERNED IDENTITY RESOLUTION
  ==========================================================
  */

  async function resolveEnterpriseIdentity(
    authUser
  ) {
    const response =
      await STATE.client
        .from(
          STATE.userTable
        )
        .select(
          STATE.userSelect
        )
        .eq(
          "auth_user_id",
          authUser.id
        )
        .maybeSingle();

    if (
      response &&
      response.error
    ) {
      throw normalizeAuthenticationError(
        response.error,
        {
          code:
            getErrorCodes()
              .UNKNOWN_IDENTITY ||
            "AUTHENTICATION_UNKNOWN_IDENTITY",

          internalMessage:
            "Governed enterprise identity lookup failed."
        }
      );
    }

    assertCondition(
      response &&
      response.data,
      getErrorCodes()
        .UNKNOWN_IDENTITY ||
      "AUTHENTICATION_UNKNOWN_IDENTITY",
      "No governed enterprise identity was found for the authenticated account.",
      {
        user_message:
          "No active STATS-CORE enterprise identity is associated with this account."
      }
    );

    const identity =
      response.data;

    assertCondition(
      cleanString(
        identity.auth_user_id
      ) ===
      cleanString(
        authUser.id
      ),
      getErrorCodes()
        .UNKNOWN_IDENTITY ||
      "AUTHENTICATION_UNKNOWN_IDENTITY",
      "Enterprise identity authentication reference does not match the authenticated account."
    );

    const role =
      normalizeRole(
        identity.role
      );

    assertCondition(
      ALLOWED_ROLES.has(role),
      getErrorCodes()
        .UNKNOWN_ROLE ||
      "AUTHENTICATION_UNKNOWN_ROLE",
      "The governed enterprise identity does not contain a supported role."
    );

    return Object.freeze({
      ...clone(identity),

      role
    });
  }

  /*
  ==========================================================
  ROLE-HINT ENFORCEMENT
  ==========================================================
  */

  function enforceRoleHint(
    roleHint,
    governedRole
  ) {
    if (!roleHint) {
      return true;
    }

    assertCondition(
      roleHint ===
        governedRole,
      getErrorCodes()
        .ROUTING_DENIED ||
      "AUTHENTICATION_ROUTING_DENIED",
      "The submitted role does not match the governed enterprise role.",
      {
        user_message:
          "The selected access role does not match this account."
      }
    );

    return true;
  }

  /*
  ==========================================================
  ENTRY-STATE RESOLUTION
  ==========================================================
  */

  function normalizeEntryStateResult(
    rawResult
  ) {
    let result =
      rawResult;

    if (
      Array.isArray(result)
    ) {
      assertCondition(
        result.length === 1,
        getErrorCodes()
          .CONFIGURATION_ERROR ||
        "AUTHENTICATION_CONFIGURATION_ERROR",
        "Entry-State Authority returned an invalid record count."
      );

      result =
        result[0];
    }

    assertCondition(
      result &&
      typeof result === "object" &&
      !Array.isArray(result),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Entry-State Authority returned an invalid response."
    );

    assertCondition(
      typeof result.first_time ===
        "boolean",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "Entry-State Authority must return boolean first_time."
    );

    return Object.freeze({
      first_time:
        result.first_time,

      snapshot_id:
        cleanString(
          result.snapshot_id
        ) ||
        null
    });
  }

  async function resolveEntryState(
    authUser,
    identity
  ) {
    const response =
      await STATE.client.rpc(
        STATE.entryStateRpc,
        {
          p_auth_user_id:
            authUser.id,

          p_sc_user_id:
            identity.sc_user_id,

          p_role:
            identity.role
        }
      );

    if (
      response &&
      response.error
    ) {
      throw normalizeAuthenticationError(
        response.error,
        {
          code:
            getErrorCodes()
              .ROUTING_DENIED ||
            "AUTHENTICATION_ROUTING_DENIED",

          internalMessage:
            "Governed Entry-State resolution failed."
        }
      );
    }

    return normalizeEntryStateResult(
      response
        ? response.data
        : null
    );
  }

  /*
  ==========================================================
  AUTHORIZED DESTINATION RESOLUTION
  ==========================================================
  */

  function resolveDestination(
    role,
    entryState
  ) {
    if (
      role ===
      "administrator"
    ) {
      return STATE.routes
        .administrator;
    }

    if (
      role ===
      "athlete"
    ) {
      if (
        entryState.first_time
      ) {
        return STATE.routes
          .first_time_athlete;
      }

      assertCondition(
        Boolean(
          cleanString(
            entryState.snapshot_id
          )
        ),
        getErrorCodes()
          .ROUTING_DENIED ||
        "AUTHENTICATION_ROUTING_DENIED",
        "Returning athlete routing requires snapshot_id."
      );

      return appendQueryParameter(
        STATE.routes
          .returning_athlete,
        "snapshot_id",
        entryState.snapshot_id
      );
    }

    if (
      PROFESSIONAL_ROLES.has(
        role
      )
    ) {
      if (
        entryState.first_time
      ) {
        return appendQueryParameter(
          STATE.routes
            .first_time_professional,
          "role",
          role
        );
      }

      return STATE.routes
        .returning_professional;
    }

    throw createAuthenticationError(
      getErrorCodes()
        .ROUTING_DENIED ||
      "AUTHENTICATION_ROUTING_DENIED",
      "No authorized destination exists for the governed enterprise role."
    );
  }

  /*
  ==========================================================
  AUTHENTICATION SESSION REFERENCE
  ==========================================================
  */

  function manufactureSessionReference(
    authSession
  ) {
    assertCondition(
      authSession &&
      typeof authSession ===
        "object",
      getErrorCodes()
        .CONTEXT_FAILURE ||
      "AUTHENTICATION_CONTEXT_FAILURE",
      "Authentication session reference cannot be manufactured without a provider session."
    );

    /*
    Supabase browser sessions do not guarantee a constitutional
    session_id property. Stream 1 therefore manufactures an
    authentication-session reference after provider authentication
    succeeds.

    The provider access token is never copied, exposed, or stored
    inside the Initial Authentication Context.
    */

    return generateId(
      "authentication-session"
    );
  }

  /*
  ==========================================================
  INITIAL AUTHENTICATION CONTEXT
  ==========================================================
  */

  function createInitialAuthenticationContext(
    input
  ) {
    const contextAuthority =
      getContextAuthority();

    const context =
      contextAuthority.create({
        session_id:
          input.session_id,

        user_id:
          input.user_id,

        role:
          input.role,

        entry_intent:
          input.entry_intent,

        authenticated_at:
          input.authenticated_at,

        authentication_source:
          input.authentication_source,

        requested_destination:
          input.requested_destination
      });

    const requiredFields =
      [
        "session_id",
        "user_id",
        "role",
        "entry_intent",
        "authenticated_at",
        "authentication_source",
        "requested_destination"
      ];

    requiredFields.forEach(
      (fieldName) => {
        assertCondition(
          Boolean(
            cleanString(
              context[fieldName]
            )
          ),
          getErrorCodes()
            .CONTEXT_FAILURE ||
          "AUTHENTICATION_CONTEXT_FAILURE",
          (
            "Initial Authentication Context is missing " +
            fieldName +
            "."
          )
        );
      }
    );

    return context;
  }

  /*
  ==========================================================
  RECEIPT GENERATION
  ==========================================================
  */

  async function writeAuthenticationReceipt(
    input
  ) {
    return getReceiptAuthority()
      .write({
        outcome:
          input.outcome,

        session_id:
          input.session_id,

        user_id:
          input.user_id,

        role:
          input.role,

        authentication_source:
          input.authentication_source,

        requested_destination:
          input.requested_destination,

        resolved_destination:
          input.resolved_destination,

        error_code:
          input.error_code,

        correlation_id:
          input.correlation_id,

        metadata:
          sanitizeMetadata(
            input.metadata ||
            {}
          )
      });
  }

  /*
  ==========================================================
  CONTROLLED ROLLBACK
  ==========================================================
  */

  async function rollbackAuthentication() {
    const failures = [];

    try {
      getContextAuthority()
        ?.clear?.();
    } catch (error) {
      failures.push({
        operation:
          "authentication_context_clear",

        error:
          cleanString(
            error?.message
          ) ||
          "Authentication Context clear failed."
      });
    }

    if (
      STATE.client &&
      STATE.client.auth &&
      typeof STATE.client.auth.signOut ===
        "function"
    ) {
      try {
        const response =
          await STATE.client
            .auth
            .signOut();

        if (
          response &&
          response.error
        ) {
          throw response.error;
        }
      } catch (error) {
        failures.push({
          operation:
            "provider_sign_out",

          error:
            cleanString(
              error?.message
            ) ||
            "Provider sign-out failed."
        });
      }
    }

    return immutableClone({
      attempted:
        true,

      complete:
        failures.length === 0,

      failures
    });
  }

  /*
  ==========================================================
  AUTHENTICATION EXECUTION
  ==========================================================
  */

  async function authenticate(rawRequest) {
    assertCondition(
      STATE.configured === true,
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "The governed authentication runtime has not been configured.",
      {
        user_message:
          "The governed authentication runtime is unavailable."
      }
    );

    assertCondition(
      STATE.authenticationInProgress ===
        false,
      getErrorCodes()
        .REQUEST_CONFLICT ||
      "AUTHENTICATION_REQUEST_CONFLICT",
      "An authentication request is already in progress."
    );

    const request =
      validateRequest(
        rawRequest
      );

    const correlationId =
      generateId(
        "authentication-correlation"
      );

    STATE.authenticationInProgress =
      true;

    STATE.activeCorrelationId =
      correlationId;

    STATE.lastResult =
      null;

    STATE.lastError =
      null;

    let authUser =
      null;

    let authSession =
      null;

    let identity =
      null;

    let resolvedRole =
      null;

    let entryState =
      null;

    let resolvedDestination =
      null;

    let authenticationSessionId =
      null;

    emit(
      "started",
      {
        correlation_id:
          correlationId,

        role_hint:
          request.role_hint,

        entry_intent:
          request.entry_intent
      }
    );

    try {
      const providerResult =
        await authenticateCredentials(
          request
        );

      authUser =
        providerResult.authUser;

      authSession =
        providerResult.authSession;

      emit(
        "provider-authenticated",
        {
          correlation_id:
            correlationId,

          user_id:
            authUser.id
        }
      );

      identity =
        await resolveEnterpriseIdentity(
          authUser
        );

      resolvedRole =
        identity.role;

      enforceRoleHint(
        request.role_hint,
        resolvedRole
      );

      emit(
        "identity-resolved",
        {
          correlation_id:
            correlationId,

          user_id:
            authUser.id,

          enterprise_identity_id:
            identity.sc_user_id,

          role:
            resolvedRole
        }
      );

      entryState =
        await resolveEntryState(
          authUser,
          identity
        );

      resolvedDestination =
        resolveDestination(
          resolvedRole,
          entryState
        );

      authenticationSessionId =
        manufactureSessionReference(
          authSession
        );

      const authenticatedAt =
        nowISO();

      const authenticationContext =
        createInitialAuthenticationContext({
          session_id:
            authenticationSessionId,

          user_id:
            authUser.id,

          role:
            resolvedRole,

          entry_intent:
            request.entry_intent,

          authenticated_at:
            authenticatedAt,

          authentication_source:
            STATE.authenticationSource,

          requested_destination:
            resolvedDestination
        });

      const authenticationReceipt =
        await writeAuthenticationReceipt({
          outcome:
            "SUCCESS",

          session_id:
            authenticationContext
              .session_id,

          user_id:
            authenticationContext
              .user_id,

          role:
            authenticationContext
              .role,

          authentication_source:
            authenticationContext
              .authentication_source,

          requested_destination:
            request.requested_destination,

          resolved_destination:
            resolvedDestination,

          error_code:
            null,

          correlation_id:
            correlationId,

          metadata: {
            service_id:
              SERVICE_ID,

            service_version:
              VERSION,

            authentication_contract_version:
              AUTHENTICATION_CONTRACT_VERSION,

            initial_authentication_context_version:
              INITIAL_AUTHENTICATION_CONTEXT_VERSION,

            enterprise_identity_id:
              identity.sc_user_id,

            sc_athlete_id:
              identity.sc_athlete_id ||
              null,

            first_time:
              entryState.first_time,

            snapshot_id:
              entryState.snapshot_id,

            entry_intent:
              request.entry_intent
          }
        });

      getContextAuthority()
        .publish(
          authenticationContext
        );

      const result =
        immutableClone({
          authenticated:
            true,

          correlation_id:
            correlationId,

          context:
            authenticationContext,

          destination:
            resolvedDestination,

          authentication_receipt_id:
            authenticationReceipt
              .authentication_receipt_id,

          entry_state:
            {
              first_time:
                entryState.first_time,

              snapshot_id:
                entryState.snapshot_id
            },

          completed_at:
            nowISO()
        });

      STATE.lastResult =
        result;

      emit(
        "succeeded",
        {
          correlation_id:
            correlationId,

          user_id:
            authUser.id,

          role:
            resolvedRole,

          destination:
            resolvedDestination,

          authentication_receipt_id:
            result
              .authentication_receipt_id
        }
      );

      global.dispatchEvent(
        new CustomEvent(
          "statscore:authentication-succeeded",
          {
            detail:
              result
          }
        )
      );

      return result;
    } catch (rawError) {
      const error =
        normalizeAuthenticationError(
          rawError,
          {
            code:
              getErrorCodes()
                .AUTHENTICATION_UNAVAILABLE ||
              "AUTHENTICATION_UNAVAILABLE",

            internalMessage:
              "Governed authentication failed."
          }
        );

      let receiptFailure =
        null;

      try {
        await writeAuthenticationReceipt({
          outcome:
            "FAILURE",

          session_id:
            authenticationSessionId,

          user_id:
            authUser
              ? authUser.id
              : null,

          role:
            resolvedRole,

          authentication_source:
            STATE.authenticationSource,

          requested_destination:
            request.requested_destination,

          resolved_destination:
            resolvedDestination,

          error_code:
            cleanString(
              error.code
            ) ||
            "AUTHENTICATION_FAILED",

          correlation_id:
            correlationId,

          metadata: {
            service_id:
              SERVICE_ID,

            service_version:
              VERSION,

            entry_intent:
              request.entry_intent,

            provider_authenticated:
              Boolean(authSession),

            identity_resolved:
              Boolean(identity),

            entry_state_resolved:
              Boolean(entryState)
          }
        });
      } catch (receiptError) {
        receiptFailure =
          receiptError;
      }

      const rollback =
        await rollbackAuthentication();

      STATE.lastError =
        immutableClone({
          code:
            cleanString(
              error.code
            ) ||
            "AUTHENTICATION_FAILED",

          user_message:
            cleanString(
              error.user_message
            ) ||
            cleanString(
              error.message
            ) ||
            "Authentication could not be completed.",

          correlation_id:
            correlationId,

          receipt_failure:
            receiptFailure
              ? {
                  code:
                    cleanString(
                      receiptFailure.code
                    ) ||
                    "AUTHENTICATION_RECEIPT_FAILURE",

                  message:
                    cleanString(
                      receiptFailure.message
                    ) ||
                    "Authentication failure receipt could not be persisted."
                }
              : null,

          rollback,

          occurred_at:
            nowISO()
        });

      emit(
        "failed",
        {
          correlation_id:
            correlationId,

          error_code:
            STATE.lastError.code,

          rollback_complete:
            rollback.complete,

          receipt_failure:
            Boolean(
              receiptFailure
            )
        }
      );

      global.dispatchEvent(
        new CustomEvent(
          "statscore:authentication-failed",
          {
            detail:
              immutableClone({
                error:
                  STATE.lastError,

                correlation_id:
                  correlationId
              })
          }
        )
      );

      if (receiptFailure) {
        throw createAuthenticationError(
          getErrorCodes()
            .RECEIPT_FAILURE ||
          "AUTHENTICATION_RECEIPT_FAILURE",
          "Authentication failed and the required failure receipt could not be persisted.",
          {
            cause:
              receiptFailure,

            details: {
              original_error_code:
                STATE.lastError.code,

              correlation_id:
                correlationId,

              rollback_complete:
                rollback.complete
            },

            user_message:
              "Authentication could not be completed and the required evidence could not be recorded."
          }
        );
      }

      throw error;
    } finally {
      STATE.authenticationInProgress =
        false;

      STATE.activeCorrelationId =
        null;
    }
  }

  /*
  ==========================================================
  SIGN OUT
  ==========================================================
  */

  async function signOut() {
    assertCondition(
      STATE.configured === true,
      getErrorCodes()
        .CONFIGURATION_ERROR ||
      "AUTHENTICATION_CONFIGURATION_ERROR",
      "The governed authentication runtime has not been configured."
    );

    let providerFailure =
      null;

    let contextFailure =
      null;

    try {
      const response =
        await STATE.client
          .auth
          .signOut();

      if (
        response &&
        response.error
      ) {
        throw response.error;
      }
    } catch (error) {
      providerFailure =
        error;
    }

    try {
      getContextAuthority()
        .clear();
    } catch (error) {
      contextFailure =
        error;
    }

    if (providerFailure) {
      throw normalizeAuthenticationError(
        providerFailure,
        {
          code:
            getErrorCodes()
              .AUTHENTICATION_UNAVAILABLE ||
            "AUTHENTICATION_UNAVAILABLE",

          internalMessage:
            "Provider sign-out failed."
        }
      );
    }

    if (contextFailure) {
      throw createAuthenticationError(
        getErrorCodes()
          .CONTEXT_FAILURE ||
        "AUTHENTICATION_CONTEXT_FAILURE",
        "Provider sign-out succeeded, but Initial Authentication Context cleanup failed.",
        {
          cause:
            contextFailure
        }
      );
    }

    emit(
      "signed-out"
    );

    global.dispatchEvent(
      new CustomEvent(
        "statscore:authentication-signed-out"
      )
    );

    return Object.freeze({
      signed_out:
        true,

      signed_out_at:
        nowISO()
    });
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
        service_id:
          SERVICE_ID,

        version:
          VERSION,

        timestamp:
          nowISO(),

        ...sanitizeMetadata(
          payload
        )
      });

    global.dispatchEvent(
      new CustomEvent(
        `statscore:authentication-service-${eventName}`,
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
          `authentication_service_${eventName}`,
          detail
        );
    }

    return detail;
  }

  /*
  ==========================================================
  DIAGNOSTICS
  ==========================================================
  */

  function getLastResult() {
    return immutableClone(
      STATE.lastResult
    );
  }

  function getLastError() {
    return immutableClone(
      STATE.lastError
    );
  }

  function runHealthCheck() {
    const findings = [];

    if (!STATE.client) {
      findings.push(
        "SUPABASE_CLIENT_UNAVAILABLE"
      );
    }

    if (
      STATE.client &&
      (
        !STATE.client.auth ||
        typeof STATE.client.auth
          .signInWithPassword !==
          "function"
      )
    ) {
      findings.push(
        "SUPABASE_AUTHENTICATION_UNAVAILABLE"
      );
    }

    if (
      STATE.client &&
      typeof STATE.client.from !==
        "function"
    ) {
      findings.push(
        "SUPABASE_DATA_CLIENT_UNAVAILABLE"
      );
    }

    if (
      STATE.client &&
      typeof STATE.client.rpc !==
        "function"
    ) {
      findings.push(
        "SUPABASE_RPC_UNAVAILABLE"
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

    if (
      !cleanString(
        STATE.entryStateRpc
      )
    ) {
      findings.push(
        "ENTRY_STATE_AUTHORITY_UNAVAILABLE"
      );
    }

    if (!STATE.configured) {
      findings.push(
        "AUTHENTICATION_SERVICE_NOT_CONFIGURED"
      );
    }

    return immutableClone({
      ok:
        findings.length === 0,

      service_id:
        SERVICE_ID,

      version:
        VERSION,

      configured:
        STATE.configured,

      configuration_locked:
        STATE.configurationLocked,

      authentication_in_progress:
        STATE.authenticationInProgress,

      user_table:
        STATE.userTable,

      entry_state_rpc:
        STATE.entryStateRpc,

      findings,

      checked_at:
        nowISO()
    });
  }

  /*
  ==========================================================
  PUBLIC SERVICE
  ==========================================================
  */

  const api =
    Object.freeze({
      service_id:
        SERVICE_ID,

      version:
        VERSION,

      authentication_contract_version:
        AUTHENTICATION_CONTRACT_VERSION,

      initial_authentication_context_version:
        INITIAL_AUTHENTICATION_CONTEXT_VERSION,

      configure,

      getConfiguration,

      authenticate,

      signOut,

      getLastResult,

      getLastError,

      runHealthCheck
    });

  global.STATSCORE_AUTH_SERVICE =
    api;

  global.STATScore =
    global.STATScore ||
    {};

  global.STATScore
    .AuthenticationService =
    api;

  global.dispatchEvent(
    new CustomEvent(
      "statscore:authentication-service-loaded",
      {
        detail:
          immutableClone({
            service_id:
              SERVICE_ID,

            version:
              VERSION,

            loaded:
              true,

            configured:
              false
          })
      }
    )
  );

  console.info(
    "[STATS-CORE Authentication Service] Loaded:",
    VERSION
  );
})(window); 
