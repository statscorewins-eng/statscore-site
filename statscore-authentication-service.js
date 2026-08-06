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
for existing STATS-CORE enterprise credentials.

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

Initial Authentication Context:
1. session_id
2. user_id
3. role
4. entry_intent
5. authenticated_at
6. authentication_source
7. requested_destination

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
CONTROLLED REPLACEMENT — STREAM 1 CONSTITUTIONAL FLOW READY

Version:
STATSCORE-AUTHENTICATION-SERVICE-V2.1.0

Primary Correction:
The Entry-State Authority RPC requires the parameter:

p_identity_id

The service must not submit:

p_sc_user_id

==========================================================
*/

(function initializeStatsCoreAuthenticationService(global) {
  "use strict";

  /*
  ==========================================================
  AUTHORITY CONSTANTS
  ==========================================================
  */

  const SERVICE_ID =
    "statscore-authentication-service";

  const VERSION =
    "STATSCORE-AUTHENTICATION-SERVICE-V2.1.0";

  const AUTHENTICATION_CONTRACT_VERSION =
    "STATSCORE-AUTHENTICATION-CONTRACT-V2.1.0";

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

  const ALLOWED_REQUESTED_DESTINATIONS =
    new Set([
      DEFAULT_REQUESTED_DESTINATION
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
    } catch (_error) {
      return JSON.parse(
        JSON.stringify(value)
      );
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

    Object
      .getOwnPropertyNames(value)
      .forEach(
        function freezeProperty(
          propertyName
        ) {
          deepFreeze(
            value[propertyName]
          );
        }
      );

    return Object.freeze(
      value
    );
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
      cleanString(prefix) +
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

  function isPlainObject(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return false;
    }

    const prototype =
      Object.getPrototypeOf(value);

    return (
      prototype === Object.prototype ||
      prototype === null
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

  function resolveErrorCode(
    preferredCode,
    fallbackCode
  ) {
    const codes =
      getErrorCodes();

    if (
      preferredCode &&
      cleanString(
        codes[preferredCode]
      )
    ) {
      return codes[
        preferredCode
      ];
    }

    if (
      fallbackCode &&
      cleanString(
        codes[fallbackCode]
      )
    ) {
      return codes[
        fallbackCode
      ];
    }

    return (
      cleanString(
        fallbackCode
      ) ||
      "AUTHENTICATION_FAILURE"
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
      resolveErrorCode(
        "AUTHENTICATION_FAILURE",
        "AUTHENTICATION_FAILURE"
      );

    const controlledMessage =
      cleanString(
        internalMessage
      ) ||
      "Authentication operation failed.";

    const details =
      isPlainObject(
        options.details
      )
        ? immutableClone(
          options.details
        )
        : null;

    if (
      errorAuthority &&
      typeof errorAuthority.create ===
        "function"
    ) {
      return errorAuthority.create(
        controlledCode,
        controlledMessage,
        {
          cause:
            options.cause instanceof Error
              ? options.cause
              : null,

          retryable:
            typeof options.retryable ===
              "boolean"
              ? options.retryable
              : undefined,

          details
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
          controlledMessage,
          {
            cause:
              options.cause instanceof Error
                ? options.cause
                : null,

            retryable:
              typeof options.retryable ===
                "boolean"
                ? options.retryable
                : undefined,

            details
          }
        );
    }

    const error =
      new Error(
        controlledMessage
      );

    error.name =
      "StatsCoreAuthenticationServiceError";

    error.code =
      controlledCode;

    error.retryable =
      Boolean(
        options.retryable
      );

    error.details =
      details;

    return error;
  }

  function normalizeAuthenticationError(
    rawError,
    options = {}
  ) {
    const errorAuthority =
      getErrorAuthority();

    const fallbackCode =
      cleanString(
        options.code
      ) ||
      resolveErrorCode(
        "AUTHENTICATION_FAILURE",
        "AUTHENTICATION_FAILURE"
      );

    const fallbackMessage =
      cleanString(
        options.internalMessage
      ) ||
      "Governed authentication could not be completed.";

    if (
      errorAuthority &&
      typeof errorAuthority
        .isAuthenticationError ===
        "function" &&
      errorAuthority
        .isAuthenticationError(
          rawError
        )
    ) {
      return rawError;
    }

    if (
      errorAuthority &&
      typeof errorAuthority.normalize ===
        "function"
    ) {
      return errorAuthority.normalize(
        rawError,
        fallbackCode,
        fallbackMessage,
        {
          retryable:
            typeof options.retryable ===
              "boolean"
              ? options.retryable
              : undefined,

          details:
            isPlainObject(
              options.details
            )
              ? options.details
              : null,

          preserve_message:
            options.preserveMessage ===
              true
        }
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
      fallbackCode,
      fallbackMessage,
      {
        cause:
          rawError instanceof Error
            ? rawError
            : null,

        retryable:
          options.retryable,

        details:
          options.details
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

  function serializeControlledError(
    error
  ) {
    const errorAuthority =
      getErrorAuthority();

    if (
      errorAuthority &&
      typeof errorAuthority.serialize ===
        "function"
    ) {
      return errorAuthority.serialize(
        error
      );
    }

    return Object.freeze({
      name:
        cleanString(
          error?.name
        ) ||
        "StatsCoreAuthenticationError",

      code:
        cleanString(
          error?.code
        ) ||
        "AUTHENTICATION_FAILURE",

      message:
        cleanString(
          error?.message
        ) ||
        "Authentication could not be completed.",

      retryable:
        Boolean(
          error?.retryable
        ),

      details:
        error?.details || null
    });
  }

  /*
  ==========================================================
  METADATA CONTROL
  ==========================================================
  */

  function sanitizeMetadata(
    value,
    seen = new WeakSet()
  ) {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return {};
    }

    if (
      seen.has(value)
    ) {
      return {};
    }

    seen.add(value);

    const blockedKeys =
      new Set([
        "__proto__",
        "prototype",
        "constructor",
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
        "session_token",
        "cookie",
        "stack",
        "cause",
        "request",
        "provider_response",
        "raw_response"
      ]);

    const output = {};

    Object.entries(value)
      .slice(0, 100)
      .forEach(
        function sanitizeEntry(
          entry
        ) {
          const [
            key,
            item
          ] = entry;

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
            typeof item === "string"
          ) {
            output[key] =
              item.slice(
                0,
                2048
              );

            return;
          }

          if (
            typeof item === "number" &&
            Number.isFinite(item)
          ) {
            output[key] =
              item;

            return;
          }

          if (
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
                .map(
                  function sanitizeArrayItem(
                    arrayItem
                  ) {
                    if (
                      typeof arrayItem ===
                        "string"
                    ) {
                      return arrayItem.slice(
                        0,
                        2048
                      );
                    }

                    if (
                      typeof arrayItem ===
                        "number" &&
                      Number.isFinite(
                        arrayItem
                      )
                    ) {
                      return arrayItem;
                    }

                    if (
                      typeof arrayItem ===
                        "boolean" ||
                      arrayItem === null
                    ) {
                      return arrayItem;
                    }

                    return null;
                  }
                );

            return;
          }

          if (
            isPlainObject(item)
          ) {
            output[key] =
              sanitizeMetadata(
                item,
                seen
              );
          }
        }
      );

    seen.delete(value);

    return output;
  }

  /*
  ==========================================================
  CONFIGURATION VALIDATION
  ==========================================================
  */

  function validateSupabaseClient(client) {
    const configurationCode =
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      );

    assertCondition(
      client &&
      typeof client === "object",
      configurationCode,
      "Authentication Service requires an approved Supabase client."
    );

    assertCondition(
      client.auth &&
      typeof client.auth
        .signInWithPassword ===
        "function",
      configurationCode,
      "The approved Supabase client does not provide auth.signInWithPassword()."
    );

    assertCondition(
      client.auth &&
      typeof client.auth.signOut ===
        "function",
      configurationCode,
      "The approved Supabase client does not provide auth.signOut()."
    );

    assertCondition(
      typeof client.from ===
        "function",
      configurationCode,
      "The approved Supabase client does not provide from()."
    );

    assertCondition(
      typeof client.rpc ===
        "function",
      configurationCode,
      "The approved Supabase client does not provide rpc()."
    );

    return true;
  }

  function validateSafeIdentifier(
    value,
    label
  ) {
    const candidate =
      cleanString(value);

    assertCondition(
      Boolean(candidate),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      `${label} must be a non-empty identifier.`
    );

    assertCondition(
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(
        candidate
      ),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      `${label} contains unsupported characters.`
    );

    return candidate;
  }

  function validateSelectList(value) {
    const selection =
      cleanString(value);

    assertCondition(
      Boolean(selection),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      "Authentication identity selection must be configured."
    );

    assertCondition(
      !selection.includes("*"),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      "Wildcard identity selection is prohibited."
    );

    const columns =
      selection
        .split(",")
        .map(
          function normalizeColumn(
            column
          ) {
            return cleanString(
              column
            );
          }
        );

    assertCondition(
      columns.length > 0 &&
      columns.every(
        function validateColumn(
          column
        ) {
          return (
            Boolean(column) &&
            /^[A-Za-z_][A-Za-z0-9_]*$/
              .test(column)
          );
        }
      ),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      "Authentication identity selection contains an invalid column."
    );

    [
      "sc_user_id",
      "auth_user_id",
      "role"
    ].forEach(
      function requireColumn(
        requiredColumn
      ) {
        assertCondition(
          columns.includes(
            requiredColumn
          ),
          resolveErrorCode(
            "CONFIGURATION_ERROR",
            "CONFIGURATION_ERROR"
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

  function validateRoute(
    value,
    label
  ) {
    const route =
      cleanString(value);

    assertCondition(
      Boolean(route),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      `${label} must be configured.`
    );

    assertCondition(
      !route.startsWith("/") &&
      !route.startsWith("\\") &&
      !route.includes("\\") &&
      !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(
        route
      ),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      `${label} must be an application-relative route.`
    );

    const pathOnly =
      route
        .split("#", 1)[0]
        .split("?", 1)[0];

    assertCondition(
      !pathOnly
        .split("/")
        .some(
          function containsTraversal(
            segment
          ) {
            return (
              segment === "." ||
              segment === ".."
            );
          }
        ),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      `${label} contains prohibited path traversal.`
    );

    return route;
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
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      "Authentication Context Authority has not been loaded."
    );

    assertCondition(
      receiptAuthority &&
      typeof receiptAuthority.write ===
        "function",
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
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
      isPlainObject(options),
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      "Authentication Service configuration must be a plain object."
    );

    if (
      STATE.configurationLocked &&
      options.force_reload !== true
    ) {
      throw createAuthenticationError(
        resolveErrorCode(
          "CONFIGURATION_ERROR",
          "CONFIGURATION_ERROR"
        ),
        "Authentication Service configuration is locked for the active runtime."
      );
    }

    let nextClient =
      STATE.client;

    let nextEntryStateRpc =
      STATE.entryStateRpc;

    let nextUserTable =
      STATE.userTable;

    let nextUserSelect =
      STATE.userSelect;

    let nextAuthenticationSource =
      STATE.authenticationSource;

    let nextRoutes =
      {
        ...STATE.routes
      };

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "client"
      )
    ) {
      validateSupabaseClient(
        options.client
      );

      nextClient =
        options.client;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "entryStateRpc"
      )
    ) {
      nextEntryStateRpc =
        validateSafeIdentifier(
          options.entryStateRpc,
          "Entry-State Authority RPC"
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "userTable"
      )
    ) {
      nextUserTable =
        validateSafeIdentifier(
          options.userTable,
          "Authentication identity table"
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "userSelect"
      )
    ) {
      nextUserSelect =
        validateSelectList(
          options.userSelect
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "authenticationSource"
      )
    ) {
      nextAuthenticationSource =
        cleanString(
          options.authenticationSource
        );

      assertCondition(
        Boolean(
          nextAuthenticationSource
        ),
        resolveErrorCode(
          "CONFIGURATION_ERROR",
          "CONFIGURATION_ERROR"
        ),
        "authenticationSource must be a non-empty string."
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        "routes"
      )
    ) {
      assertCondition(
        isPlainObject(
          options.routes
        ),
        resolveErrorCode(
          "CONFIGURATION_ERROR",
          "CONFIGURATION_ERROR"
        ),
        "Authentication routes must be a plain object."
      );

      const authorizedRouteKeys =
        Object.keys(
          DEFAULT_ROUTES
        );

      const unauthorizedRouteKeys =
        Object.keys(
          options.routes
        ).filter(
          function findUnauthorizedRoute(
            routeKey
          ) {
            return !authorizedRouteKeys.includes(
              routeKey
            );
          }
        );

      assertCondition(
        unauthorizedRouteKeys.length ===
          0,
        resolveErrorCode(
          "CONFIGURATION_ERROR",
          "CONFIGURATION_ERROR"
        ),
        (
          "Authentication route configuration contains unauthorized keys: " +
          unauthorizedRouteKeys.join(", ")
        )
      );

      nextRoutes = {
        ...nextRoutes,
        ...options.routes
      };
    }

    validateSupabaseClient(
      nextClient
    );

    nextEntryStateRpc =
      validateSafeIdentifier(
        nextEntryStateRpc,
        "Entry-State Authority RPC"
      );

    nextUserTable =
      validateSafeIdentifier(
        nextUserTable,
        "Authentication identity table"
      );

    nextUserSelect =
      validateSelectList(
        nextUserSelect
      );

    Object.entries(
      nextRoutes
    ).forEach(
      function validateConfiguredRoute(
        entry
      ) {
        const [
          routeKey,
          routeValue
        ] = entry;

        nextRoutes[routeKey] =
          validateRoute(
            routeValue,
            `Authentication route ${routeKey}`
          );
      }
    );

    assertSupportingAuthorities();

    STATE.client =
      nextClient;

    STATE.entryStateRpc =
      nextEntryStateRpc;

    STATE.userTable =
      nextUserTable;

    STATE.userSelect =
      nextUserSelect;

    STATE.authenticationSource =
      nextAuthenticationSource;

    STATE.routes =
      nextRoutes;

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

    dispatchEventSafely(
      "statscore:authentication-service-configured",
      configuration
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

      entry_state_rpc_arguments:
        Object.freeze([
          "p_auth_user_id",
          "p_identity_id",
          "p_role"
        ]),

      routes:
        clone(
          STATE.routes
        ),

      allowed_requested_destinations:
        Array.from(
          ALLOWED_REQUESTED_DESTINATIONS
        ),

      initial_authentication_context_fields:
        Object.freeze([
          "session_id",
          "user_id",
          "role",
          "entry_intent",
          "authenticated_at",
          "authentication_source",
          "requested_destination"
        ])
    });
  }

  /*
  ==========================================================
  REQUEST VALIDATION
  ==========================================================
  */

  function validateRequest(rawRequest) {
    assertCondition(
      isPlainObject(rawRequest),
      resolveErrorCode(
        "REQUEST_VALIDATION_FAILURE",
        "REQUEST_VALIDATION_FAILURE"
      ),
      "Authentication request must be a plain object."
    );

    const authorizedFields =
      new Set([
        "email",
        "password",
        "role_hint",
        "entry_intent",
        "requested_destination"
      ]);

    const unauthorizedFields =
      Object.keys(
        rawRequest
      ).filter(
        function findUnauthorizedField(
          fieldName
        ) {
          return !authorizedFields.has(
            fieldName
          );
        }
      );

    assertCondition(
      unauthorizedFields.length ===
        0,
      resolveErrorCode(
        "REQUEST_VALIDATION_FAILURE",
        "REQUEST_VALIDATION_FAILURE"
      ),
      (
        "Authentication request contains unauthorized fields: " +
        unauthorizedFields.join(", ")
      )
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
      ).toLowerCase() ||
      DEFAULT_ENTRY_INTENT;

    const requestedDestination =
      cleanString(
        rawRequest.requested_destination
      ) ||
      DEFAULT_REQUESTED_DESTINATION;

    assertCondition(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email),
      resolveErrorCode(
        "REQUEST_VALIDATION_FAILURE",
        "REQUEST_VALIDATION_FAILURE"
      ),
      "Authentication request contains an invalid email address."
    );

    assertCondition(
      Boolean(password),
      resolveErrorCode(
        "REQUEST_VALIDATION_FAILURE",
        "REQUEST_VALIDATION_FAILURE"
      ),
      "Authentication request requires a password."
    );

    assertCondition(
      !roleHint ||
      ALLOWED_ROLES.has(
        roleHint
      ),
      resolveErrorCode(
        "ROLE_FAILURE",
        "ROLE_FAILURE"
      ),
      "The submitted role hint is unsupported."
    );

    assertCondition(
      entryIntent ===
        DEFAULT_ENTRY_INTENT,
      resolveErrorCode(
        "REQUEST_VALIDATION_FAILURE",
        "REQUEST_VALIDATION_FAILURE"
      ),
      "Unsupported authentication entry intent."
    );

    assertCondition(
      ALLOWED_REQUESTED_DESTINATIONS.has(
        requestedDestination
      ),
      resolveErrorCode(
        "ROUTING_FAILURE",
        "ROUTING_FAILURE"
      ),
      "The requested enterprise destination is not authorized."
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
    let response;

    try {
      response =
        await STATE.client.auth
          .signInWithPassword({
            email:
              request.email,

            password:
              request.password
          });
    } catch (rawError) {
      throw normalizeAuthenticationError(
        rawError,
        {
          code:
            resolveErrorCode(
              "PROVIDER_FAILURE",
              "PROVIDER_FAILURE"
            ),

          internalMessage:
            "The authentication provider could not be reached.",

          retryable:
            true
        }
      );
    }

    if (
      response &&
      response.error
    ) {
      throw normalizeAuthenticationError(
        response.error,
        {
          code:
            resolveErrorCode(
              "CREDENTIAL_FAILURE",
              "CREDENTIAL_FAILURE"
            ),

          internalMessage:
            "The submitted credentials were not accepted.",

          preserveMessage:
            false,

          retryable:
            false
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
      resolveErrorCode(
        "PROVIDER_FAILURE",
        "PROVIDER_FAILURE"
      ),
      "Authentication provider did not return a valid user."
    );

    assertCondition(
      authSession &&
      typeof authSession ===
        "object",
      resolveErrorCode(
        "SESSION_FAILURE",
        "SESSION_FAILURE"
      ),
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
    let response;

    try {
      response =
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
    } catch (rawError) {
      throw normalizeAuthenticationError(
        rawError,
        {
          code:
            resolveErrorCode(
              "IDENTITY_FAILURE",
              "IDENTITY_FAILURE"
            ),

          internalMessage:
            "Governed enterprise identity lookup could not be completed.",

          retryable:
            true
        }
      );
    }

    if (
      response &&
      response.error
    ) {
      throw normalizeAuthenticationError(
        response.error,
        {
          code:
            resolveErrorCode(
              "IDENTITY_FAILURE",
              "IDENTITY_FAILURE"
            ),

          internalMessage:
            "Governed enterprise identity lookup failed.",

          retryable:
            false
        }
      );
    }

    assertCondition(
      response &&
      response.data,
      resolveErrorCode(
        "IDENTITY_FAILURE",
        "IDENTITY_FAILURE"
      ),
      "No governed enterprise identity was found for the authenticated account."
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
      resolveErrorCode(
        "IDENTITY_FAILURE",
        "IDENTITY_FAILURE"
      ),
      "Enterprise identity authentication reference does not match the authenticated account."
    );

    assertCondition(
      Boolean(
        cleanString(
          identity.sc_user_id
        )
      ),
      resolveErrorCode(
        "IDENTITY_FAILURE",
        "IDENTITY_FAILURE"
      ),
      "Enterprise identity does not contain sc_user_id."
    );

    const role =
      normalizeRole(
        identity.role
      );

    assertCondition(
      ALLOWED_ROLES.has(role),
      resolveErrorCode(
        "ROLE_FAILURE",
        "ROLE_FAILURE"
      ),
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
      resolveErrorCode(
        "AUTHORIZATION_FAILURE",
        "AUTHORIZATION_FAILURE"
      ),
      "The submitted role does not match the governed enterprise role."
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
        resolveErrorCode(
          "ENTRY_STATE_FAILURE",
          "ENTRY_STATE_FAILURE"
        ),
        "Entry-State Authority returned an invalid record count."
      );

      result =
        result[0];
    }

    assertCondition(
      isPlainObject(result),
      resolveErrorCode(
        "ENTRY_STATE_FAILURE",
        "ENTRY_STATE_FAILURE"
      ),
      "Entry-State Authority returned an invalid response."
    );

    assertCondition(
      Object.prototype
        .hasOwnProperty.call(
          result,
          "first_time"
        ),
      resolveErrorCode(
        "ENTRY_STATE_FAILURE",
        "ENTRY_STATE_FAILURE"
      ),
      "Entry-State Authority response is missing first_time."
    );

    assertCondition(
      typeof result.first_time ===
        "boolean",
      resolveErrorCode(
        "ENTRY_STATE_FAILURE",
        "ENTRY_STATE_FAILURE"
      ),
      "Entry-State Authority must return boolean first_time."
    );

    const snapshotId =
      cleanString(
        result.snapshot_id
      ) ||
      null;

    return Object.freeze({
      first_time:
        result.first_time,

      snapshot_id:
        snapshotId
    });
  }

  async function resolveEntryState(
    authUser,
    identity
  ) {
    let response;

    try {
      response =
        await STATE.client.rpc(
          STATE.entryStateRpc,
          {
            p_auth_user_id:
              authUser.id,

            /*
             * Database RPC contract:
             *
             * resolve_authentication_entry_state(
             *   p_auth_user_id uuid,
             *   p_identity_id uuid,
             *   p_role text
             * )
             *
             * p_identity_id receives public.sc_users.sc_user_id.
             */
            p_identity_id:
              identity.sc_user_id,

            p_role:
              identity.role
          }
        );
    } catch (rawError) {
      throw normalizeAuthenticationError(
        rawError,
        {
          code:
            resolveErrorCode(
              "ENTRY_STATE_FAILURE",
              "ENTRY_STATE_FAILURE"
            ),

          internalMessage:
            "Governed Entry-State Authority could not be reached.",

          retryable:
            true
        }
      );
    }

    if (
      response &&
      response.error
    ) {
      throw normalizeAuthenticationError(
        response.error,
        {
          code:
            resolveErrorCode(
              "ENTRY_STATE_FAILURE",
              "ENTRY_STATE_FAILURE"
            ),

          internalMessage:
            "Governed Entry-State resolution failed.",

          preserveMessage:
            false,

          retryable:
            false,

          details: {
            rpc:
              STATE.entryStateRpc,

            expected_arguments:
              [
                "p_auth_user_id",
                "p_identity_id",
                "p_role"
              ]
          }
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
      return validateRoute(
        STATE.routes
          .administrator,
        "Administrator destination"
      );
    }

    if (
      role ===
      "athlete"
    ) {
      if (
        entryState.first_time ===
          true
      ) {
        return validateRoute(
          STATE.routes
            .first_time_athlete,
          "First-time athlete destination"
        );
      }

      assertCondition(
        Boolean(
          cleanString(
            entryState.snapshot_id
          )
        ),
        resolveErrorCode(
          "ROUTING_FAILURE",
          "ROUTING_FAILURE"
        ),
        "Returning athlete routing requires snapshot_id."
      );

      return validateRoute(
        appendQueryParameter(
          STATE.routes
            .returning_athlete,
          "snapshot_id",
          entryState.snapshot_id
        ),
        "Returning athlete destination"
      );
    }

    if (
      PROFESSIONAL_ROLES.has(
        role
      )
    ) {
      if (
        entryState.first_time ===
          true
      ) {
        return validateRoute(
          appendQueryParameter(
            STATE.routes
              .first_time_professional,
            "role",
            role
          ),
          "First-time professional destination"
        );
      }

      return validateRoute(
        STATE.routes
          .returning_professional,
        "Returning professional destination"
      );
    }

    throw createAuthenticationError(
      resolveErrorCode(
        "ROUTING_FAILURE",
        "ROUTING_FAILURE"
      ),
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
      resolveErrorCode(
        "SESSION_FAILURE",
        "SESSION_FAILURE"
      ),
      "Authentication session reference cannot be manufactured without a provider session."
    );

    /*
     * The provider access token is never copied into:
     *
     * - Initial Authentication Context
     * - Authentication Receipt metadata
     * - browser localStorage
     * - presentation output
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

        /*
         * Constitutional field:
         *
         * requested_destination preserves the request received
         * from Login Authority.
         *
         * It is not replaced by resolved_destination.
         */
        requested_destination:
          input.requested_destination
      });

    [
      "session_id",
      "user_id",
      "role",
      "entry_intent",
      "authenticated_at",
      "authentication_source",
      "requested_destination"
    ].forEach(
      function requireContextField(
        fieldName
      ) {
        assertCondition(
          Boolean(
            cleanString(
              context[fieldName]
            )
          ),
          resolveErrorCode(
            "CONTEXT_FAILURE",
            "CONTEXT_FAILURE"
          ),
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
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
      "The governed authentication runtime has not been configured."
    );

    assertCondition(
      STATE.authenticationInProgress ===
        false,
      resolveErrorCode(
        "AUTHENTICATION_IN_PROGRESS",
        "AUTHENTICATION_IN_PROGRESS"
      ),
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
          request.entry_intent,

        requested_destination:
          request.requested_destination
      }
    );

    try {
      /*
      --------------------------------------------------------
      PHASE 1 — PROVIDER AUTHENTICATION
      --------------------------------------------------------
      */

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

      /*
      --------------------------------------------------------
      PHASE 2 — GOVERNED IDENTITY
      --------------------------------------------------------
      */

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

      /*
      --------------------------------------------------------
      PHASE 3 — ENTRY-STATE AUTHORITY
      --------------------------------------------------------
      */

      entryState =
        await resolveEntryState(
          authUser,
          identity
        );

      emit(
        "entry-state-resolved",
        {
          correlation_id:
            correlationId,

          role:
            resolvedRole,

          first_time:
            entryState.first_time,

          snapshot_id:
            entryState.snapshot_id
        }
      );

      /*
      --------------------------------------------------------
      PHASE 4 — CONSTITUTIONAL ROUTING
      --------------------------------------------------------
      */

      resolvedDestination =
        resolveDestination(
          resolvedRole,
          entryState
        );

      /*
      --------------------------------------------------------
      PHASE 5 — SESSION REFERENCE
      --------------------------------------------------------
      */

      authenticationSessionId =
        manufactureSessionReference(
          authSession
        );

      const authenticatedAt =
        nowISO();

      /*
      --------------------------------------------------------
      PHASE 6 — INITIAL AUTHENTICATION CONTEXT
      --------------------------------------------------------
      */

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
            request.requested_destination
        });

      /*
      --------------------------------------------------------
      PHASE 7 — SUCCESS RECEIPT
      --------------------------------------------------------
      */

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

      /*
      --------------------------------------------------------
      PHASE 8 — CONTEXT PUBLICATION
      --------------------------------------------------------
      */

      const publishedContext =
        getContextAuthority()
          .publish(
            authenticationContext
          );

      /*
      --------------------------------------------------------
      PHASE 9 — LOGIN AUTHORITY RESULT
      --------------------------------------------------------
      */

      const result =
        immutableClone({
          authenticated:
            true,

          correlation_id:
            correlationId,

          context:
            publishedContext,

          requested_destination:
            request.requested_destination,

          destination:
            resolvedDestination,

          /*
           * Authentication Receipt Service V1.2.0 returns:
           *
           * receipt_id
           * recorded_at
           */
          authentication_receipt_id:
            authenticationReceipt
              .receipt_id,

          authentication_receipt_recorded_at:
            authenticationReceipt
              .recorded_at,

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

          requested_destination:
            request.requested_destination,

          destination:
            resolvedDestination,

          authentication_receipt_id:
            result
              .authentication_receipt_id
        }
      );

      dispatchEventSafely(
        "statscore:authentication-succeeded",
        result
      );

      return result;
    } catch (rawError) {
      const error =
        normalizeAuthenticationError(
          rawError,
          {
            code:
              resolveErrorCode(
                "AUTHENTICATION_FAILURE",
                "AUTHENTICATION_FAILURE"
              ),

            internalMessage:
              "Governed authentication failed.",

            preserveMessage:
              true,

            retryable:
              false
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
            "AUTHENTICATION_FAILURE",

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
              Boolean(entryState),

            resolved_destination_available:
              Boolean(
                resolvedDestination
              )
          }
        });
      } catch (receiptError) {
        receiptFailure =
          receiptError;
      }

      const rollback =
        await rollbackAuthentication();

      const serializedError =
        serializeControlledError(
          error
        );

      STATE.lastError =
        immutableClone({
          code:
            cleanString(
              serializedError.code
            ) ||
            "AUTHENTICATION_FAILURE",

          message:
            cleanString(
              serializedError.message
            ) ||
            "Authentication could not be completed.",

          retryable:
            Boolean(
              serializedError.retryable
            ),

          details:
            serializedError.details ||
            null,

          correlation_id:
            correlationId,

          receipt_failure:
            receiptFailure
              ? {
                  code:
                    cleanString(
                      receiptFailure.code
                    ) ||
                    "RECEIPT_FAILURE",

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

      dispatchEventSafely(
        "statscore:authentication-failed",
        immutableClone({
          error:
            STATE.lastError,

          correlation_id:
            correlationId
        })
      );

      if (receiptFailure) {
        throw createAuthenticationError(
          resolveErrorCode(
            "RECEIPT_FAILURE",
            "RECEIPT_FAILURE"
          ),
          "Authentication failed and the required failure receipt could not be persisted.",
          {
            cause:
              receiptFailure instanceof Error
                ? receiptFailure
                : null,

            retryable:
              true,

            details: {
              original_error_code:
                STATE.lastError.code,

              correlation_id:
                correlationId,

              rollback_complete:
                rollback.complete
            }
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
      resolveErrorCode(
        "CONFIGURATION_ERROR",
        "CONFIGURATION_ERROR"
      ),
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
            resolveErrorCode(
              "SESSION_FAILURE",
              "SESSION_FAILURE"
            ),

          internalMessage:
            "Provider sign-out failed.",

          preserveMessage:
            false,

          retryable:
            true
        }
      );
    }

    if (contextFailure) {
      throw createAuthenticationError(
        resolveErrorCode(
          "CONTEXT_FAILURE",
          "CONTEXT_FAILURE"
        ),
        "Provider sign-out succeeded, but Initial Authentication Context cleanup failed.",
        {
          cause:
            contextFailure instanceof Error
              ? contextFailure
              : null
        }
      );
    }

    const result =
      Object.freeze({
        signed_out:
          true,

        signed_out_at:
          nowISO()
      });

    emit(
      "signed-out",
      result
    );

    dispatchEventSafely(
      "statscore:authentication-signed-out",
      result
    );

    return result;
  }

  /*
  ==========================================================
  EVENTS
  ==========================================================
  */

  function dispatchEventSafely(
    eventName,
    detail
  ) {
    try {
      if (
        typeof global.dispatchEvent !==
          "function" ||
        typeof global.CustomEvent !==
          "function"
      ) {
        return false;
      }

      global.dispatchEvent(
        new global.CustomEvent(
          eventName,
          {
            detail:
              immutableClone(
                detail
              )
          }
        )
      );

      return true;
    } catch (_error) {
      return false;
    }
  }

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

    dispatchEventSafely(
      `statscore:authentication-service-${eventName}`,
      detail
    );

    try {
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
    } catch (_error) {
      /*
       * Engine Bus observations are non-authoritative.
       */
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

      active_correlation_id:
        STATE.activeCorrelationId,

      user_table:
        STATE.userTable,

      entry_state_rpc:
        STATE.entryStateRpc,

      entry_state_rpc_arguments:
        [
          "p_auth_user_id",
          "p_identity_id",
          "p_role"
        ],

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

  dispatchEventSafely(
    "statscore:authentication-service-loaded",
    {
      service_id:
        SERVICE_ID,

      version:
        VERSION,

      loaded:
        true,

      configured:
        false,

      entry_state_rpc:
        DEFAULT_ENTRY_STATE_RPC,

      entry_state_rpc_arguments:
        [
          "p_auth_user_id",
          "p_identity_id",
          "p_role"
        ]
    }
  );

  console.info(
    "[STATS-CORE Authentication Service] Loaded:",
    VERSION
  );
})(window); 
