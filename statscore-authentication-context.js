/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-authentication-context.js

Asset Type:
JavaScript Context Authority / Initial Authentication Context

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Initial Authentication Context Authority

System Layer:
Authentication Context Publication / Controlled Entry Evidence

Primary Consumers:
- statscore-authentication-service.js
- statscore-authentication-bootstrap.js
- login.html
- Stream 8 Runtime Entry Coordination
- authorized diagnostics
- Master Integration Stream

Purpose:
Creates, validates, publishes, retrieves, and clears the
governed STATS-CORE Initial Authentication Context.

The Initial Authentication Context contains exactly seven
constitutional fields:

1. session_id
2. user_id
3. role
4. entry_intent
5. authenticated_at
6. authentication_source
7. requested_destination

Constitutional Boundary:
Stream 1 publishes only Initial Authentication Context.

Stream 1 does not publish Initial Runtime Context, restore
professional workspaces, create athlete records, create snapshots,
or initialize downstream operational state.

Storage Doctrine:
The approved Initial Authentication Context may be retained in
browser sessionStorage only for continuity during the active
browser session.

It must not be written to localStorage.

It must not contain:
- passwords
- access tokens
- refresh tokens
- Supabase provider sessions
- athlete_id
- snapshot_id
- enterprise_identity_id
- role_context_id
- dashboard configuration
- workspace configuration
- Runtime Context
- receipt payloads
- arbitrary metadata

Does NOT:
- authenticate credentials
- register accounts
- authorize database access
- determine role
- determine entry state
- determine routing
- create Supabase sessions
- manufacture Runtime Context
- write Authentication Receipts
- create athlete source records
- create professional workspaces
- restore active workspaces
- expose provider tokens

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
STATSCORE-AUTHENTICATION-CONTEXT-V2.0.0

==========================================================
*/

(function initializeStatsCoreAuthenticationContext(global) {
  "use strict";

  const AUTHORITY_ID =
    "statscore-authentication-context";

  const VERSION =
    "STATSCORE-AUTHENTICATION-CONTEXT-V2.0.0";

  const CONTEXT_CONTRACT_VERSION =
    "STATSCORE-INITIAL-AUTHENTICATION-CONTEXT-V1.0.0";

  const STORAGE_KEY =
    "statscore_initial_authentication_context_v1";

  const CONTEXT_FIELDS =
    Object.freeze([
      "session_id",
      "user_id",
      "role",
      "entry_intent",
      "authenticated_at",
      "authentication_source",
      "requested_destination"
    ]);

  const ALLOWED_ROLES =
    Object.freeze([
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

  const ALLOWED_ENTRY_INTENTS =
    Object.freeze([
      "login"
    ]);

  let activeContext =
    null;

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

  function createContextError(
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
        .CONTEXT_FAILURE ||
      "AUTHENTICATION_CONTEXT_FAILURE";

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
        "Initial Authentication Context operation failed."
      );

    error.name =
      "STATScoreAuthenticationContextError";

    error.code =
      code;

    error.user_message =
      options.user_message ||
      "Authentication context could not be established.";

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

    throw createContextError(
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  STORAGE AUTHORITY
  ==========================================================
  */

  function getSessionStorage() {
    try {
      if (
        global.sessionStorage &&
        typeof global.sessionStorage
          .getItem === "function" &&
        typeof global.sessionStorage
          .setItem === "function" &&
        typeof global.sessionStorage
          .removeItem === "function"
      ) {
        return global.sessionStorage;
      }
    } catch (_) {
      return null;
    }

    return null;
  }

  function persistContext(context) {
    const storage =
      getSessionStorage();

    assertCondition(
      storage,
      "Browser sessionStorage is unavailable.",
      {
        code:
          getErrorCodes()
            .CONTEXT_FAILURE ||
          "AUTHENTICATION_CONTEXT_FAILURE"
      }
    );

    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          context
        )
      );
    } catch (error) {
      throw createContextError(
        "Initial Authentication Context could not be persisted to sessionStorage.",
        {
          cause:
            error
        }
      );
    }

    return true;
  }

  function removePersistedContext() {
    const storage =
      getSessionStorage();

    if (!storage) {
      return false;
    }

    try {
      storage.removeItem(
        STORAGE_KEY
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  function readPersistedContext() {
    const storage =
      getSessionStorage();

    if (!storage) {
      return null;
    }

    let rawValue =
      null;

    try {
      rawValue =
        storage.getItem(
          STORAGE_KEY
        );
    } catch (_) {
      return null;
    }

    if (!rawValue) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(
          rawValue
        );

      return validateContext(
        parsed
      );
    } catch (_) {
      removePersistedContext();
      return null;
    }
  }

  /*
  ==========================================================
  CONTEXT VALIDATION
  ==========================================================
  */

  function assertExactFieldSet(input) {
    const suppliedFields =
      Object.keys(input)
        .sort();

    const approvedFields =
      [...CONTEXT_FIELDS]
        .sort();

    assertCondition(
      suppliedFields.length ===
        approvedFields.length,
      "Initial Authentication Context contains an unauthorized field count.",
      {
        details: {
          supplied_fields:
            suppliedFields,

          approved_fields:
            approvedFields
        }
      }
    );

    approvedFields.forEach(
      (fieldName, index) => {
        assertCondition(
          suppliedFields[index] ===
            fieldName,
          "Initial Authentication Context contains unauthorized or missing fields.",
          {
            details: {
              supplied_fields:
                suppliedFields,

              approved_fields:
                approvedFields
            }
          }
        );
      }
    );

    return true;
  }

  function validateTimestamp(value) {
    const timestamp =
      cleanString(value);

    assertCondition(
      Boolean(timestamp),
      "Initial Authentication Context requires authenticated_at."
    );

    assertCondition(
      Number.isFinite(
        Date.parse(timestamp)
      ),
      "Initial Authentication Context authenticated_at is invalid."
    );

    return new Date(
      timestamp
    ).toISOString();
  }

  function validateContext(rawContext) {
    assertCondition(
      rawContext &&
      typeof rawContext ===
        "object" &&
      !Array.isArray(rawContext),
      "Initial Authentication Context must be an object."
    );

    assertExactFieldSet(
      rawContext
    );

    const sessionId =
      cleanString(
        rawContext.session_id
      );

    const userId =
      cleanString(
        rawContext.user_id
      );

    const role =
      normalizeRole(
        rawContext.role
      );

    const entryIntent =
      cleanString(
        rawContext.entry_intent
      ).toLowerCase();

    const authenticatedAt =
      validateTimestamp(
        rawContext.authenticated_at
      );

    const authenticationSource =
      cleanString(
        rawContext.authentication_source
      );

    const requestedDestination =
      cleanString(
        rawContext.requested_destination
      );

    assertCondition(
      Boolean(sessionId),
      "Initial Authentication Context requires session_id."
    );

    assertCondition(
      Boolean(userId),
      "Initial Authentication Context requires user_id."
    );

    assertCondition(
      ALLOWED_ROLES.includes(
        role
      ),
      "Initial Authentication Context contains an unsupported role."
    );

    assertCondition(
      ALLOWED_ENTRY_INTENTS.includes(
        entryIntent
      ),
      "Initial Authentication Context contains an unsupported entry_intent."
    );

    assertCondition(
      Boolean(authenticationSource),
      "Initial Authentication Context requires authentication_source."
    );

    assertCondition(
      Boolean(requestedDestination),
      "Initial Authentication Context requires requested_destination."
    );

    return Object.freeze({
      session_id:
        sessionId,

      user_id:
        userId,

      role,

      entry_intent:
        entryIntent,

      authenticated_at:
        authenticatedAt,

      authentication_source:
        authenticationSource,

      requested_destination:
        requestedDestination
    });
  }

  /*
  ==========================================================
  CONTEXT CREATION
  ==========================================================
  */

  function create(rawContext) {
    return validateContext(
      rawContext
    );
  }

  /*
  ==========================================================
  CONTEXT PUBLICATION
  ==========================================================
  */

  function publish(rawContext) {
    const context =
      validateContext(
        rawContext
      );

    persistContext(
      context
    );

    activeContext =
      context;

    const published =
      immutableClone(
        context
      );

    global
      .STATSCORE_INITIAL_AUTHENTICATION_CONTEXT =
      published;

    global.STATScore =
      global.STATScore ||
      {};

    global.STATScore
      .InitialAuthenticationContext =
      published;

    global.dispatchEvent(
      new CustomEvent(
        "statscore:initial-authentication-context-published",
        {
          detail:
            immutableClone({
              authority_id:
                AUTHORITY_ID,

              version:
                VERSION,

              context_contract_version:
                CONTEXT_CONTRACT_VERSION,

              published_at:
                nowISO(),

              context:
                published
            })
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
          "initial_authentication_context_published",
          {
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            context_contract_version:
              CONTEXT_CONTRACT_VERSION,

            context:
              published
          }
        );
    }

    return published;
  }

  /*
  ==========================================================
  CONTEXT RETRIEVAL
  ==========================================================
  */

  function get() {
    if (activeContext) {
      return immutableClone(
        activeContext
      );
    }

    const persistedContext =
      readPersistedContext();

    if (!persistedContext) {
      return null;
    }

    activeContext =
      persistedContext;

    global
      .STATSCORE_INITIAL_AUTHENTICATION_CONTEXT =
      immutableClone(
        persistedContext
      );

    global.STATScore =
      global.STATScore ||
      {};

    global.STATScore
      .InitialAuthenticationContext =
      immutableClone(
        persistedContext
      );

    return immutableClone(
      persistedContext
    );
  }

  function hasContext() {
    return Boolean(
      get()
    );
  }

  /*
  ==========================================================
  CONTEXT CLEARING
  ==========================================================
  */

  function clear() {
    const previousContext =
      activeContext ||
      readPersistedContext();

    activeContext =
      null;

    removePersistedContext();

    try {
      delete global
        .STATSCORE_INITIAL_AUTHENTICATION_CONTEXT;
    } catch (_) {
      global
        .STATSCORE_INITIAL_AUTHENTICATION_CONTEXT =
        null;
    }

    if (
      global.STATScore &&
      Object.prototype
        .hasOwnProperty.call(
          global.STATScore,
          "InitialAuthenticationContext"
        )
    ) {
      try {
        delete global
          .STATScore
          .InitialAuthenticationContext;
      } catch (_) {
        global.STATScore
          .InitialAuthenticationContext =
          null;
      }
    }

    global.dispatchEvent(
      new CustomEvent(
        "statscore:initial-authentication-context-cleared",
        {
          detail:
            immutableClone({
              authority_id:
                AUTHORITY_ID,

              version:
                VERSION,

              cleared:
                true,

              previous_session_id:
                cleanString(
                  previousContext
                    ?.session_id
                ) ||
                null,

              cleared_at:
                nowISO()
            })
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
          "initial_authentication_context_cleared",
          {
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            previous_session_id:
              cleanString(
                previousContext
                  ?.session_id
              ) ||
              null,

            cleared_at:
              nowISO()
          }
        );
    }

    return Object.freeze({
      cleared:
        true,

      previous_session_id:
        cleanString(
          previousContext
            ?.session_id
        ) ||
        null,

      cleared_at:
        nowISO()
    });
  }

  /*
  ==========================================================
  CONTEXT RESTORATION
  ==========================================================
  */

  function restore() {
    const restoredContext =
      readPersistedContext();

    if (!restoredContext) {
      activeContext =
        null;

      return null;
    }

    activeContext =
      restoredContext;

    const published =
      immutableClone(
        restoredContext
      );

    global
      .STATSCORE_INITIAL_AUTHENTICATION_CONTEXT =
      published;

    global.STATScore =
      global.STATScore ||
      {};

    global.STATScore
      .InitialAuthenticationContext =
      published;

    global.dispatchEvent(
      new CustomEvent(
        "statscore:initial-authentication-context-restored",
        {
          detail:
            immutableClone({
              authority_id:
                AUTHORITY_ID,

              version:
                VERSION,

              context_contract_version:
                CONTEXT_CONTRACT_VERSION,

              restored_at:
                nowISO(),

              context:
                published
            })
        }
      )
    );

    return published;
  }

  /*
  ==========================================================
  DIAGNOSTICS
  ==========================================================
  */

  function getContract() {
    return immutableClone({
      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      context_contract_version:
        CONTEXT_CONTRACT_VERSION,

      storage_authority:
        "sessionStorage",

      storage_key:
        STORAGE_KEY,

      context_fields:
        CONTEXT_FIELDS,

      allowed_roles:
        ALLOWED_ROLES,

      allowed_entry_intents:
        ALLOWED_ENTRY_INTENTS
    });
  }

  function runHealthCheck() {
    const findings = [];

    if (!getSessionStorage()) {
      findings.push(
        "SESSION_STORAGE_UNAVAILABLE"
      );
    }

    const restored =
      readPersistedContext();

    if (
      restored &&
      Object.keys(restored).length !==
        CONTEXT_FIELDS.length
    ) {
      findings.push(
        "PERSISTED_CONTEXT_FIELD_COUNT_INVALID"
      );
    }

    return immutableClone({
      ok:
        findings.length === 0,

      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      context_contract_version:
        CONTEXT_CONTRACT_VERSION,

      context_active:
        Boolean(
          activeContext ||
          restored
        ),

      storage_available:
        Boolean(
          getSessionStorage()
        ),

      findings,

      checked_at:
        nowISO()
    });
  }

  /*
  ==========================================================
  PUBLIC AUTHORITY
  ==========================================================
  */

  const api =
    Object.freeze({
      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      context_contract_version:
        CONTEXT_CONTRACT_VERSION,

      CONTEXT_FIELDS,

      ALLOWED_ROLES,

      ALLOWED_ENTRY_INTENTS,

      normalizeRole,

      create,

      publish,

      get,

      hasContext,

      clear,

      restore,

      getContract,

      runHealthCheck
    });

  global.STATSCORE_AUTH_CONTEXT =
    api;

  global.STATScore =
    global.STATScore ||
    {};

  global.STATScore
    .AuthenticationContext =
    api;

  restore();

  global.dispatchEvent(
    new CustomEvent(
      "statscore:authentication-context-loaded",
      {
        detail:
          immutableClone({
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            context_contract_version:
              CONTEXT_CONTRACT_VERSION,

            loaded:
              true,

            context_restored:
              Boolean(
                activeContext
              )
          })
      }
    )
  );

  console.info(
    "[STATS-CORE Authentication Context] Loaded:",
    VERSION
  );
})(window); 
