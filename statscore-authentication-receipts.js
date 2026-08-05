/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-authentication-receipts.js

Asset Type:
JavaScript Evidence Request Authority /
Authentication Receipt Transport

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Authentication Receipt Governance

System Layer:
Authentication Evidence / Governed Server Persistence

Primary Consumers:
- statscore-authentication-service.js
- statscore-authentication-bootstrap.js
- authorized diagnostics
- Office of the Chief Systems Engineer
- Master Integration Stream

Supporting Authorities:
- statscore-authentication-errors.js
- statscore-authentication-context.js
- approved shared Supabase browser client
- governed server-side Authentication Receipt RPC

Purpose:
Validates, captures, queues, and submits governed Authentication
Receipt requests to the authorized server-side receipt authority.

The browser authority:

- validates the exact Authentication Receipt request contract
- rejects missing and unauthorized fields
- validates success and failure receipt requirements
- sanitizes receipt metadata
- validates application-relative destinations
- captures each accepted request immutably
- submits each receipt independently through the governed RPC
- validates the server acknowledgment contract
- preserves FIFO transport without allowing one failed receipt to
  terminate later writes
- publishes observational receipt events
- reports configuration and runtime health
- supports controlled production configuration locking

Server Authority:
Receipt identity, authoritative timestamping, persistence,
immutability, and final acceptance remain server-side
responsibilities.

The browser does not manufacture the authoritative receipt ID or
the authoritative recorded timestamp.

Approved Receipt Request Fields:
- outcome
- session_id
- user_id
- role
- authentication_source
- requested_destination
- resolved_destination
- error_code
- correlation_id
- metadata

Approved Server Acknowledgment:
- accepted
- receipt_id
- recorded_at

Approved Authentication Sources:
- supabase_password
- supabase_sso
- governed_authentication_provider
- controlled_demo_provider

Constitutional Boundary:
This module requests governed Authentication Receipt persistence.

It is not the final database authority and does not insert directly
into an Authentication Receipt table.

Does NOT:
- authenticate credentials
- register accounts
- resolve identity
- determine role
- determine entry state
- determine routing
- create provider sessions
- manufacture the authoritative receipt identifier
- manufacture the authoritative recorded timestamp
- publish Initial Authentication Context
- initialize Runtime Context
- write directly to browser-accessible receipt tables
- expose passwords, tokens, credentials, provider sessions,
  raw provider responses, browser storage, or stack traces
- use Supabase service-role credentials

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
STATSCORE-AUTHENTICATION-RECEIPTS-V2.0.0

==========================================================
*/

(function initializeStatsCoreAuthenticationReceipts(global) {
  "use strict";

  /*
  ==========================================================
  AUTHORITY IDENTITY
  ==========================================================
  */

  const AUTHORITY_ID =
    "statscore-authentication-receipts";

  const VERSION =
    "STATSCORE-AUTHENTICATION-RECEIPTS-V2.0.0";

  const CONTRACT_NAME =
    "STATSCORE-AUTHENTICATION-RECEIPT-REQUEST-V2.0.0";

  const ACKNOWLEDGMENT_CONTRACT_NAME =
    "STATSCORE-AUTHENTICATION-RECEIPT-ACKNOWLEDGMENT-V1.0.0";

  const DEFAULT_RECEIPT_RPC =
    "record_statscore_authentication_receipt";

  const DEFAULT_ENVIRONMENT =
    "production";

  /*
  ==========================================================
  DEPENDENCY RESOLUTION
  ==========================================================
  */

  const errors =
    global.STATSCORE_AUTH_ERRORS;

  const contextAuthority =
    global.STATSCORE_AUTH_CONTEXT;

  if (
    !errors ||
    !errors.ERROR_CODES ||
    typeof errors.create !== "function" ||
    typeof errors.normalize !== "function"
  ) {
    throw new Error(
      "Load statscore-authentication-errors.js before " +
      "statscore-authentication-receipts.js."
    );
  }

  if (
    !contextAuthority ||
    typeof contextAuthority.normalizeRole !== "function"
  ) {
    throw new Error(
      "Load statscore-authentication-context.js before " +
      "statscore-authentication-receipts.js."
    );
  }

  const {
    ERROR_CODES,
    StatsCoreAuthenticationError
  } = errors;

  /*
  ==========================================================
  CONTRACT LIMITS
  ==========================================================
  */

  const MAX_STRING_LENGTH =
    2048;

  const MAX_ERROR_CODE_LENGTH =
    256;

  const MAX_CORRELATION_ID_LENGTH =
    512;

  const MAX_RECEIPT_ID_LENGTH =
    512;

  const MAX_METADATA_KEY_LENGTH =
    256;

  const MAX_METADATA_STRING_LENGTH =
    4096;

  const MAX_METADATA_SERIALIZED_LENGTH =
    16384;

  const MAX_METADATA_DEPTH =
    8;

  const MAX_METADATA_ARRAY_LENGTH =
    50;

  const MAX_DESTINATION_DECODE_PASSES =
    4;

  /*
  ==========================================================
  RECEIPT CONTRACT
  ==========================================================
  */

  const RECEIPT_FIELDS =
    Object.freeze([
      "outcome",
      "session_id",
      "user_id",
      "role",
      "authentication_source",
      "requested_destination",
      "resolved_destination",
      "error_code",
      "correlation_id",
      "metadata"
    ]);

  const REQUIRED_RECEIPT_FIELDS =
    RECEIPT_FIELDS;

  const ACKNOWLEDGMENT_FIELDS =
    Object.freeze([
      "accepted",
      "receipt_id",
      "recorded_at"
    ]);

  const ALLOWED_OUTCOMES =
    Object.freeze([
      "SUCCESS",
      "FAILURE"
    ]);

  const ALLOWED_OUTCOME_SET =
    new Set(
      ALLOWED_OUTCOMES
    );

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

  const ALLOWED_ROLE_SET =
    new Set(
      ALLOWED_ROLES
    );

  const ALLOWED_AUTHENTICATION_SOURCES =
    Object.freeze([
      "supabase_password",
      "supabase_sso",
      "governed_authentication_provider",
      "controlled_demo_provider"
    ]);

  const ALLOWED_AUTHENTICATION_SOURCE_SET =
    new Set(
      ALLOWED_AUTHENTICATION_SOURCES
    );

  /*
  ==========================================================
  METADATA GOVERNANCE
  ==========================================================
  */

  const PROHIBITED_METADATA_KEYS =
    Object.freeze([
      "__proto__",
      "prototype",
      "constructor",

      "password",
      "passcode",
      "pin",
      "secret",
      "private_key",
      "service_role",
      "service_role_key",

      "token",
      "access_token",
      "refresh_token",
      "id_token",
      "provider_token",
      "provider_refresh_token",

      "authorization",
      "authorization_header",

      "cookie",
      "cookies",

      "credential",
      "credentials",
      "encrypted_password",

      "session",
      "provider_session",
      "supabase_session",

      "stack",
      "stacktrace",
      "stack_trace",

      "cause",
      "raw_error",
      "raw_response",
      "provider_response",

      "request",
      "request_object",
      "response",
      "response_object",

      "localstorage",
      "sessionstorage",
      "browser_storage",

      "document",
      "window",
      "element",
      "dom"
    ]);

  const PROHIBITED_METADATA_KEY_SET =
    new Set(
      PROHIBITED_METADATA_KEYS
    );

  /*
  ==========================================================
  EVENTS
  ==========================================================
  */

  const EVENT_NAMES =
    Object.freeze({
      CONFIGURED:
        "statscore:authentication-receipts-configured",

      WRITE_QUEUED:
        "statscore:authentication-receipt-queued",

      WRITE_SUCCEEDED:
        "statscore:authentication-receipt-written",

      WRITE_FAILED:
        "statscore:authentication-receipt-write-failed",

      REJECTED:
        "statscore:authentication-receipt-rejected"
    });

  /*
  ==========================================================
  RUNTIME STATE
  ==========================================================
  */

  const STATE = {
    client:
      null,

    receiptRpc:
      DEFAULT_RECEIPT_RPC,

    environment:
      DEFAULT_ENVIRONMENT,

    configured:
      false,

    configurationLocked:
      false,

    configuredAt:
      null,

    writeQueue:
      Promise.resolve(),

    pendingWrites:
      0,

    completedWrites:
      0,

    failedWrites:
      0,

    lastResult:
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
      value === null ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object
      .getOwnPropertyNames(value)
      .forEach(
        (propertyName) => {
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

  function normalizeRole(value) {
    return contextAuthority
      .normalizeRole(
        value
      );
  }

  function normalizeAuthenticationSource(value) {
    return cleanString(value)
      .toLowerCase();
  }

  /*
  ==========================================================
  ERROR CONTROL
  ==========================================================
  */

  function createReceiptError(
    code,
    internalMessage,
    options = {}
  ) {
    return errors.create(
      code,
      internalMessage,
      {
        cause:
          options.cause ||
          null,

        user_message:
          options.user_message,

        correlation_id:
          options.correlation_id,

        retryable:
          options.retryable,

        security_related:
          options.security_related,

        production_blocking:
          options.production_blocking,

        provider_code:
          options.provider_code,

        provider_status:
          options.provider_status,

        operation:
          options.operation ||
          "authentication_receipt",

        details:
          options.details,

        metadata:
          options.metadata
      }
    );
  }

  function normalizeReceiptError(
    rawError,
    options = {}
  ) {
    if (
      rawError instanceof
      StatsCoreAuthenticationError
    ) {
      return rawError;
    }

    return errors.normalize(
      rawError,

      options.code ||
      ERROR_CODES.RECEIPT_FAILURE,

      options.internal_message ||
      "The governed Authentication Receipt could not be processed.",

      {
        user_message:
          options.user_message,

        correlation_id:
          options.correlation_id,

        retryable:
          options.retryable,

        security_related:
          options.security_related,

        production_blocking:
          options.production_blocking,

        provider_code:
          options.provider_code,

        provider_status:
          options.provider_status,

        operation:
          options.operation ||
          "authentication_receipt",

        details:
          options.details,

        metadata:
          options.metadata,

        use_provider_mapping:
          options.use_provider_mapping ===
          true
      }
    );
  }

  function safelySerializeError(error) {
    try {
      if (
        error &&
        typeof error.toJSON === "function"
      ) {
        return error.toJSON();
      }

      if (
        typeof errors.serializePublicError ===
        "function"
      ) {
        return errors.serializePublicError(
          error
        );
      }
    } catch (_) {
      // Continue to the controlled fallback.
    }

    return Object.freeze({
      name:
        "StatsCoreAuthenticationError",

      code:
        cleanString(
          error?.code
        ) ||
        ERROR_CODES.RECEIPT_FAILURE,

      user_message:
        cleanString(
          error?.user_message
        ) ||
        "Authentication evidence could not be recorded.",

      retryable:
        true
    });
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

    throw createReceiptError(
      code,
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  EVENT PUBLICATION
  ==========================================================
  */

  function dispatchEventSafely(
    eventName,
    detail
  ) {
    try {
      if (
        !global ||
        typeof global.dispatchEvent !== "function" ||
        typeof global.CustomEvent !== "function"
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

      if (
        global.STATScore
          ?.EngineBus?.emit
      ) {
        global.STATScore
          .EngineBus
          .emit(
            eventName,
            immutableClone(
              detail
            )
          );
      }

      return true;
    } catch (_) {
      /*
      Receipt events are observational only.

      Event publication failure must never alter receipt
      validation, transport, or persistence disposition.
      */

      return false;
    }
  }

  function dispatchRejected(
    operation,
    error,
    correlationId = null
  ) {
    return dispatchEventSafely(
      EVENT_NAMES.REJECTED,
      {
        authority_id:
          AUTHORITY_ID,

        version:
          VERSION,

        contract:
          CONTRACT_NAME,

        operation:
          cleanString(operation) ||
          "unknown",

        correlation_id:
          cleanString(
            correlationId
          ) ||
          null,

        error:
          safelySerializeError(
            error
          ),

        rejected_at:
          nowISO()
      }
    );
  }

  /*
  ==========================================================
  CONFIGURATION VALIDATION
  ==========================================================
  */

  function assertSafeIdentifier(
    value,
    label
  ) {
    const candidate =
      cleanString(value);

    assertCondition(
      Boolean(candidate),
      ERROR_CODES.CONFIGURATION_ERROR,
      label +
      " is required."
    );

    assertCondition(
      /^[A-Za-z_][A-Za-z0-9_]*$/
        .test(
          candidate
        ),
      ERROR_CODES.CONFIGURATION_ERROR,
      label +
      " contains unsupported characters."
    );

    return candidate;
  }

  function assertClient(client) {
    assertCondition(
      client &&
      typeof client === "object" &&
      typeof client.rpc === "function",
      ERROR_CODES.CONFIGURATION_ERROR,
      "A Supabase client exposing rpc() is required for governed " +
      "Authentication Receipt persistence."
    );

    return client;
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
      ERROR_CODES.CONFIGURATION_ERROR,
      "Authentication Receipt configuration must be an object."
    );

    if (
      STATE.configurationLocked &&
      options.force_reload !== true
    ) {
      throw createReceiptError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Authentication Receipt Authority configuration is locked " +
        "for the active runtime."
      );
    }

    if (
      STATE.pendingWrites > 0 &&
      options.force_reload !== true
    ) {
      throw createReceiptError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Authentication Receipt transport cannot be reconfigured " +
        "while writes are pending."
      );
    }

    let nextClient =
      STATE.client;

    let nextReceiptRpc =
      STATE.receiptRpc;

    let nextEnvironment =
      STATE.environment;

    if (
      Object.prototype
        .hasOwnProperty.call(
          options,
          "client"
        )
    ) {
      nextClient =
        assertClient(
          options.client
        );
    }

    const requestedRpc =
      cleanString(
        options.receiptRpc ||
        options.receipt_rpc ||
        options.rpc
      );

    if (requestedRpc) {
      nextReceiptRpc =
        assertSafeIdentifier(
          requestedRpc,
          "Authentication Receipt RPC"
        );
    }

    const requestedEnvironment =
      cleanString(
        options.environment
      );

    if (requestedEnvironment) {
      nextEnvironment =
        requestedEnvironment;
    }

    assertClient(
      nextClient
    );

    assertSafeIdentifier(
      nextReceiptRpc,
      "Authentication Receipt RPC"
    );

    STATE.client =
      nextClient;

    STATE.receiptRpc =
      nextReceiptRpc;

    STATE.environment =
      nextEnvironment;

    STATE.configured =
      true;

    STATE.configuredAt =
      nowISO();

    STATE.lastError =
      null;

    if (
      options.lock !== false
    ) {
      STATE.configurationLocked =
        true;
    }

    const configuration =
      getConfiguration();

    dispatchEventSafely(
      EVENT_NAMES.CONFIGURED,
      {
        authority_id:
          AUTHORITY_ID,

        version:
          VERSION,

        configured:
          true,

        configuration_locked:
          STATE.configurationLocked,

        environment:
          STATE.environment,

        receipt_rpc:
          STATE.receiptRpc,

        configured_at:
          STATE.configuredAt
      }
    );

    return configuration;
  }

  function getConfiguration() {
    return immutableClone({
      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME,

      configured:
        STATE.configured,

      configuration_locked:
        STATE.configurationLocked,

      configured_at:
        STATE.configuredAt,

      environment:
        STATE.environment,

      receipt_rpc:
        STATE.receiptRpc,

      /*
      Compatibility alias for older diagnostics.
      */
      rpc:
        STATE.receiptRpc,

      queued_writes:
        STATE.pendingWrites,

      write_in_progress:
        STATE.pendingWrites > 0,

      completed_writes:
        STATE.completedWrites,

      failed_writes:
        STATE.failedWrites,

      transport:
        "supabase_rpc",

      reconfiguration_policy:
        "locked_after_production_configuration",

      direct_table_write:
        false,

      server_authoritative:
        true
    });
  }

  /*
  ==========================================================
  OBJECT VALIDATION
  ==========================================================
  */

  function assertPlainObject(
    value,
    label
  ) {
    assertCondition(
      value &&
      typeof value === "object" &&
      !Array.isArray(value),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " must be a plain object."
    );

    const prototype =
      Object.getPrototypeOf(
        value
      );

    assertCondition(
      prototype === Object.prototype ||
      prototype === null,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " must use a supported object shape."
    );

    return value;
  }

  function validateExactFieldSet(
    value,
    authorizedFields,
    label
  ) {
    const suppliedFields =
      Object.keys(
        value
      );

    const missingFields =
      authorizedFields.filter(
        (fieldName) => {
          return !Object.prototype
            .hasOwnProperty.call(
              value,
              fieldName
            );
        }
      );

    assertCondition(
      missingFields.length === 0,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " is missing required fields: " +
      missingFields.join(", "),
      {
        details: {
          missing_fields:
            missingFields
        }
      }
    );

    const unauthorizedFields =
      suppliedFields.filter(
        (fieldName) => {
          return !authorizedFields
            .includes(
              fieldName
            );
        }
      );

    assertCondition(
      unauthorizedFields.length === 0,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " contains unauthorized fields: " +
      unauthorizedFields.join(", "),
      {
        details: {
          unauthorized_fields:
            unauthorizedFields
        }
      }
    );

    assertCondition(
      suppliedFields.length ===
      authorizedFields.length,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " must contain exactly " +
      authorizedFields.length +
      " fields."
    );

    return true;
  }

  /*
  ==========================================================
  STRING VALIDATION
  ==========================================================
  */

  function rejectControlCharacters(
    value,
    label
  ) {
    assertCondition(
      !/[\u0000-\u001F\u007F]/.test(
        value
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " contains prohibited control characters."
    );

    return value;
  }

  function validateRequiredString(
    value,
    label,
    maximumLength
  ) {
    const candidate =
      cleanString(value);

    assertCondition(
      Boolean(candidate),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " is required."
    );

    assertCondition(
      candidate.length <=
      maximumLength,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " exceeds the authorized maximum length."
    );

    return rejectControlCharacters(
      candidate,
      label
    );
  }

  function validateNullableString(
    value,
    label,
    maximumLength
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    return validateRequiredString(
      value,
      label,
      maximumLength
    );
  }

  /*
  ==========================================================
  RECEIPT FIELD NORMALIZATION
  ==========================================================
  */

  function normalizeOutcome(value) {
    const outcome =
      cleanString(value)
        .toUpperCase();

    assertCondition(
      ALLOWED_OUTCOME_SET.has(
        outcome
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Unsupported Authentication Receipt outcome: " +
      (
        outcome ||
        "empty"
      )
    );

    return outcome;
  }

  function validateNullableRole(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const role =
      normalizeRole(
        value
      );

    assertCondition(
      Boolean(role) &&
      ALLOWED_ROLE_SET.has(
        role
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Unsupported Authentication Receipt role: " +
      (
        role ||
        "empty"
      )
    );

    return role;
  }

  function validateAuthenticationSource(value) {
    const source =
      normalizeAuthenticationSource(
        value
      );

    assertCondition(
      Boolean(source) &&
      ALLOWED_AUTHENTICATION_SOURCE_SET.has(
        source
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Unsupported authentication_source: " +
      (
        source ||
        "empty"
      )
    );

    return source;
  }

  function validateErrorCode(
    value,
    outcome
  ) {
    const errorCode =
      validateNullableString(
        value,
        "error_code",
        MAX_ERROR_CODE_LENGTH
      );

    if (
      outcome === "SUCCESS"
    ) {
      assertCondition(
        errorCode === null,
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "A successful Authentication Receipt cannot contain error_code."
      );
    }

    if (
      outcome === "FAILURE"
    ) {
      assertCondition(
        errorCode !== null,
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "A failed Authentication Receipt requires error_code."
      );
    }

    return errorCode;
  }

  /*
  ==========================================================
  DESTINATION VALIDATION
  ==========================================================
  */

  function containsUnsafeScheme(value) {
    return /^[A-Za-z][A-Za-z0-9+.-]*:/i
      .test(
        value
      );
  }

  function decodeRouteBounded(value) {
    let current =
      value;

    for (
      let pass = 0;
      pass <
      MAX_DESTINATION_DECODE_PASSES;
      pass += 1
    ) {
      let decoded;

      try {
        decoded =
          decodeURIComponent(
            current
          );
      } catch (rawError) {
        throw createReceiptError(
          ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
          "Receipt destination contains invalid URL encoding.",
          {
            cause:
              rawError
          }
        );
      }

      if (
        decoded === current
      ) {
        return decoded;
      }

      current =
        decoded;
    }

    try {
      const next =
        decodeURIComponent(
          current
        );

      assertCondition(
        next === current,
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Receipt destination exceeds the authorized encoding depth."
      );
    } catch (rawError) {
      if (
        rawError instanceof
        StatsCoreAuthenticationError
      ) {
        throw rawError;
      }

      throw createReceiptError(
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Receipt destination contains invalid URL encoding.",
        {
          cause:
            rawError
        }
      );
    }

    return current;
  }

  function validateRouteRepresentation(
    value,
    label
  ) {
    rejectControlCharacters(
      value,
      label
    );

    assertCondition(
      !value.startsWith("/") &&
      !value.startsWith("\\") &&
      !value.includes("\\") &&
      !containsUnsafeScheme(value),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " must be application-relative."
    );

    const pathOnly =
      value
        .split("#", 1)[0]
        .split("?", 1)[0];

    const pathSegments =
      pathOnly
        .split("/");

    assertCondition(
      !pathSegments.some(
        (segment) => {
          return (
            segment === "." ||
            segment === ".."
          );
        }
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " contains a prohibited traversal segment."
    );

    assertCondition(
      !value.includes("../") &&
      !value.includes("..\\") &&
      !value.includes("./") &&
      !value.includes(".\\"),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " contains prohibited path traversal."
    );

    return value;
  }

  function validateDestination(
    value,
    label,
    allowRoleAwareDefault
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const destination =
      validateRequiredString(
        value,
        label,
        MAX_STRING_LENGTH
      );

    if (
      allowRoleAwareDefault === true &&
      destination ===
      "role-aware-default"
    ) {
      return destination;
    }

    validateRouteRepresentation(
      destination,
      label
    );

    const decodedDestination =
      decodeRouteBounded(
        destination
      );

    validateRouteRepresentation(
      decodedDestination,
      "decoded " +
      label
    );

    return destination;
  }

  /*
  ==========================================================
  METADATA SANITIZATION
  ==========================================================
  */

  function isProhibitedMetadataKey(
    key
  ) {
    const normalized =
      cleanString(key)
        .toLowerCase();

    if (!normalized) {
      return true;
    }

    if (
      PROHIBITED_METADATA_KEY_SET.has(
        normalized
      )
    ) {
      return true;
    }

    const prohibitedFragments =
      [
        "password",
        "passcode",
        "secret",
        "private_key",
        "service_role",
        "access_token",
        "refresh_token",
        "authorization",
        "cookie",
        "credential",
        "encrypted_password",
        "provider_response",
        "raw_response",
        "stack_trace"
      ];

    return prohibitedFragments
      .some(
        (fragment) => {
          return normalized
            .includes(
              fragment
            );
        }
      );
  }

  function validateMetadataKey(value) {
    const key =
      validateRequiredString(
        value,
        "metadata key",
        MAX_METADATA_KEY_LENGTH
      );

    assertCondition(
      !isProhibitedMetadataKey(
        key
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Authentication Receipt metadata contains a prohibited key: " +
      key
    );

    return key;
  }

  function validateMetadataValue(
    value,
    depth,
    seen
  ) {
    assertCondition(
      depth <=
      MAX_METADATA_DEPTH,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Authentication Receipt metadata exceeds the authorized depth."
    );

    if (
      value === null ||
      typeof value === "boolean"
    ) {
      return value;
    }

    if (
      typeof value === "string"
    ) {
      assertCondition(
        value.length <=
        MAX_METADATA_STRING_LENGTH,
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Authentication Receipt metadata contains an oversized string."
      );

      return rejectControlCharacters(
        value,
        "Authentication Receipt metadata value"
      );
    }

    if (
      typeof value === "number"
    ) {
      assertCondition(
        Number.isFinite(value),
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Authentication Receipt metadata contains a non-finite number."
      );

      return value;
    }

    if (
      typeof value === "undefined" ||
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Authentication Receipt metadata contains an unsupported value."
      );
    }

    assertCondition(
      typeof value === "object",
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Authentication Receipt metadata contains an unsupported type."
    );

    assertCondition(
      !seen.has(value),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Authentication Receipt metadata contains a circular reference."
    );

    seen.add(
      value
    );

    if (
      Array.isArray(value)
    ) {
      assertCondition(
        value.length <=
        MAX_METADATA_ARRAY_LENGTH,
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Authentication Receipt metadata array exceeds the authorized length."
      );

      const validatedArray =
        value.map(
          (item) => {
            return validateMetadataValue(
              item,
              depth + 1,
              seen
            );
          }
        );

      seen.delete(
        value
      );

      return validatedArray;
    }

    const prototype =
      Object.getPrototypeOf(
        value
      );

    assertCondition(
      prototype === Object.prototype ||
      prototype === null,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Authentication Receipt metadata must contain only plain objects."
    );

    const validatedObject =
      Object.create(null);

    const normalizedKeys =
      new Set();

    for (
      const [key, item]
      of Object.entries(value)
    ) {
      const normalizedKey =
        validateMetadataKey(
          key
        );

      const collisionKey =
        normalizedKey
          .toLowerCase();

      assertCondition(
        !normalizedKeys.has(
          collisionKey
        ),
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Authentication Receipt metadata contains a duplicate normalized key: " +
        normalizedKey
      );

      normalizedKeys.add(
        collisionKey
      );

      validatedObject[
        normalizedKey
      ] =
        validateMetadataValue(
          item,
          depth + 1,
          seen
        );
    }

    seen.delete(
      value
    );

    return validatedObject;
  }

  function validateMetadata(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return Object.freeze(
        Object.create(null)
      );
    }

    assertPlainObject(
      value,
      "metadata"
    );

    const validated =
      validateMetadataValue(
        value,
        0,
        new WeakSet()
      );

    let serialized;

    try {
      serialized =
        JSON.stringify(
          validated
        );
    } catch (rawError) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Authentication Receipt metadata could not be serialized.",
        {
          cause:
            rawError
        }
      );
    }

    assertCondition(
      serialized.length <=
      MAX_METADATA_SERIALIZED_LENGTH,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "Authentication Receipt metadata exceeds the authorized size."
    );

    return deepFreeze(
      validated
    );
  }

  /*
  ==========================================================
  RECEIPT VALIDATION
  ==========================================================
  */

  function validateOutcomeRequirements(receipt) {
    if (
      receipt.outcome ===
      "SUCCESS"
    ) {
      assertCondition(
        Boolean(
          receipt.session_id &&
          receipt.user_id &&
          receipt.role &&
          receipt.resolved_destination
        ),
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "A successful Authentication Receipt requires session_id, " +
        "user_id, role, and resolved_destination."
      );

      return true;
    }

    assertCondition(
      receipt.outcome ===
      "FAILURE" &&
      receipt.error_code !==
      null,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      "A failed Authentication Receipt requires error_code."
    );

    return true;
  }

  function validate(payload) {
    const candidate =
      assertPlainObject(
        payload,
        "Authentication Receipt request"
      );

    validateExactFieldSet(
      candidate,
      RECEIPT_FIELDS,
      "Authentication Receipt request"
    );

    const outcome =
      normalizeOutcome(
        candidate.outcome
      );

    const receipt =
      Object.freeze({
        outcome,

        session_id:
          validateNullableString(
            candidate.session_id,
            "session_id",
            MAX_STRING_LENGTH
          ),

        user_id:
          validateNullableString(
            candidate.user_id,
            "user_id",
            MAX_STRING_LENGTH
          ),

        role:
          validateNullableRole(
            candidate.role
          ),

        authentication_source:
          validateAuthenticationSource(
            candidate.authentication_source
          ),

        requested_destination:
          validateDestination(
            candidate.requested_destination,
            "requested_destination",
            true
          ),

        resolved_destination:
          validateDestination(
            candidate.resolved_destination,
            "resolved_destination",
            false
          ),

        error_code:
          validateErrorCode(
            candidate.error_code,
            outcome
          ),

        correlation_id:
          validateRequiredString(
            candidate.correlation_id,
            "correlation_id",
            MAX_CORRELATION_ID_LENGTH
          ),

        metadata:
          validateMetadata(
            candidate.metadata
          )
      });

    validateOutcomeRequirements(
      receipt
    );

    return receipt;
  }

  function create(payload) {
    try {
      return validate(
        payload
      );
    } catch (error) {
      dispatchRejected(
        "create",
        error,
        payload?.correlation_id
      );

      throw error;
    }
  }

  /*
  ==========================================================
  SERVER ACKNOWLEDGMENT VALIDATION
  ==========================================================
  */

  function validateCanonicalUtcTimestamp(
    value,
    label
  ) {
    const timestamp =
      validateRequiredString(
        value,
        label,
        64
      );

    const canonicalUtcPattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    assertCondition(
      canonicalUtcPattern.test(
        timestamp
      ),
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " must be a canonical ISO-8601 UTC timestamp."
    );

    const parsedTimestamp =
      Date.parse(
        timestamp
      );

    assertCondition(
      Number.isFinite(
        parsedTimestamp
      ) &&
      new Date(
        parsedTimestamp
      ).toISOString() ===
      timestamp,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      label +
      " is not a valid canonical timestamp."
    );

    return timestamp;
  }

  function normalizeRpcResponseData(data) {
    if (
      Array.isArray(data)
    ) {
      assertCondition(
        data.length === 1,
        ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
        "Governed Authentication Receipt RPC returned an unexpected result count."
      );

      return data[0];
    }

    return data;
  }

  function validateRpcAcknowledgment(data) {
    const candidate =
      assertPlainObject(
        normalizeRpcResponseData(
          data
        ),
        "Governed Authentication Receipt RPC acknowledgment"
      );

    validateExactFieldSet(
      candidate,
      ACKNOWLEDGMENT_FIELDS,
      "Governed Authentication Receipt RPC acknowledgment"
    );

    assertCondition(
      candidate.accepted === true,
      ERROR_CODES.RECEIPT_PERSISTENCE_FAILURE,
      "Governed Authentication Receipt RPC did not confirm receipt acceptance."
    );

    const receiptId =
      validateRequiredString(
        candidate.receipt_id,
        "receipt_id",
        MAX_RECEIPT_ID_LENGTH
      );

    const recordedAt =
      validateCanonicalUtcTimestamp(
        candidate.recorded_at,
        "recorded_at"
      );

    return Object.freeze({
      accepted:
        true,

      receipt_id:
        receiptId,

      recorded_at:
        recordedAt
    });
  }

  /*
  ==========================================================
  RPC TRANSPORT
  ==========================================================
  */

  function buildRpcArguments(receipt) {
    return Object.freeze({
      p_outcome:
        receipt.outcome,

      p_session_id:
        receipt.session_id,

      p_user_id:
        receipt.user_id,

      p_role:
        receipt.role,

      p_authentication_source:
        receipt.authentication_source,

      p_requested_destination:
        receipt.requested_destination,

      p_resolved_destination:
        receipt.resolved_destination,

      p_error_code:
        receipt.error_code,

      p_correlation_id:
        receipt.correlation_id,

      p_metadata:
        receipt.metadata
    });
  }

  async function performWrite(receipt) {
    const client =
      assertClient(
        STATE.client
      );

    const receiptRpc =
      assertSafeIdentifier(
        STATE.receiptRpc,
        "Authentication Receipt RPC"
      );

    let response;

    try {
      response =
        await client.rpc(
          receiptRpc,
          buildRpcArguments(
            receipt
          )
        );
    } catch (rawError) {
      throw normalizeReceiptError(
        rawError,
        {
          code:
            ERROR_CODES
              .RECEIPT_PERSISTENCE_FAILURE,

          internal_message:
            "The governed Authentication Receipt RPC could not be reached.",

          user_message:
            "Authentication evidence could not be preserved.",

          correlation_id:
            receipt.correlation_id,

          retryable:
            true,

          operation:
            "authentication_receipt_rpc_transport",

          use_provider_mapping:
            false
        }
      );
    }

    if (
      !response ||
      response.error
    ) {
      throw normalizeReceiptError(
        response
          ? response.error
          : null,
        {
          code:
            ERROR_CODES
              .RECEIPT_PERSISTENCE_FAILURE,

          internal_message:
            "The governed Authentication Receipt RPC rejected the write.",

          user_message:
            "Authentication evidence could not be preserved.",

          correlation_id:
            receipt.correlation_id,

          retryable:
            true,

          operation:
            "authentication_receipt_rpc_response",

          use_provider_mapping:
            false
        }
      );
    }

    let acknowledgment;

    try {
      acknowledgment =
        validateRpcAcknowledgment(
          response.data
        );
    } catch (rawError) {
      throw normalizeReceiptError(
        rawError,
        {
          code:
            ERROR_CODES
              .RECEIPT_VALIDATION_FAILURE,

          internal_message:
            "The governed Authentication Receipt RPC returned " +
            "an invalid acknowledgment.",

          user_message:
            "Authentication evidence could not be confirmed.",

          correlation_id:
            receipt.correlation_id,

          operation:
            "authentication_receipt_acknowledgment_validation",

          production_blocking:
            true,

          use_provider_mapping:
            false
        }
      );
    }

    return Object.freeze({
      written:
        true,

      persisted:
        true,

      outcome:
        receipt.outcome,

      authentication_receipt_id:
        acknowledgment.receipt_id,

      /*
      Compatibility alias preserving the server acknowledgment name.
      */
      receipt_id:
        acknowledgment.receipt_id,

      recorded_at:
        acknowledgment.recorded_at,

      correlation_id:
        receipt.correlation_id,

      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME
    });
  }

  /*
  ==========================================================
  QUEUED WRITE AUTHORITY
  ==========================================================
  */

  function write(payload) {
    let receipt;

    try {
      receipt =
        validate(
          payload
        );
    } catch (error) {
      dispatchRejected(
        "write_validation",
        error,
        payload?.correlation_id
      );

      return Promise.reject(
        error
      );
    }

    try {
      assertCondition(
        STATE.configured === true,
        ERROR_CODES.CONFIGURATION_ERROR,
        "Authentication Receipt Authority has not been configured."
      );

      assertClient(
        STATE.client
      );

      assertSafeIdentifier(
        STATE.receiptRpc,
        "Authentication Receipt RPC"
      );
    } catch (error) {
      dispatchRejected(
        "write_configuration",
        error,
        receipt.correlation_id
      );

      return Promise.reject(
        error
      );
    }

    STATE.pendingWrites += 1;

    dispatchEventSafely(
      EVENT_NAMES.WRITE_QUEUED,
      {
        authority_id:
          AUTHORITY_ID,

        version:
          VERSION,

        outcome:
          receipt.outcome,

        correlation_id:
          receipt.correlation_id,

        queued_writes:
          STATE.pendingWrites,

        queued_at:
          nowISO()
      }
    );

    const queuedWrite =
      STATE.writeQueue
        .catch(
          () => {
            /*
            A failed previous write must not terminate the queue.
            */

            return undefined;
          }
        )
        .then(
          async () => {
            try {
              const result =
                await performWrite(
                  receipt
                );

              STATE.completedWrites += 1;

              STATE.lastResult =
                immutableClone(
                  result
                );

              STATE.lastError =
                null;

              dispatchEventSafely(
                EVENT_NAMES.WRITE_SUCCEEDED,
                {
                  authority_id:
                    AUTHORITY_ID,

                  version:
                    VERSION,

                  result,

                  environment:
                    STATE.environment,

                  completed_at:
                    nowISO()
                }
              );

              return result;
            } catch (rawError) {
              const error =
                normalizeReceiptError(
                  rawError,
                  {
                    code:
                      rawError?.code ||
                      ERROR_CODES
                        .RECEIPT_FAILURE,

                    internal_message:
                      rawError?.message ||
                      "Authentication Receipt persistence failed.",

                    correlation_id:
                      receipt
                        .correlation_id,

                    operation:
                      "authentication_receipt_write",

                    retryable:
                      true,

                    use_provider_mapping:
                      false
                  }
                );

              STATE.failedWrites += 1;

              STATE.lastError =
                immutableClone({
                  code:
                    error.code,

                  user_message:
                    error.user_message,

                  correlation_id:
                    receipt
                      .correlation_id,

                  occurred_at:
                    nowISO()
                });

              dispatchEventSafely(
                EVENT_NAMES.WRITE_FAILED,
                {
                  authority_id:
                    AUTHORITY_ID,

                  version:
                    VERSION,

                  outcome:
                    receipt.outcome,

                  correlation_id:
                    receipt
                      .correlation_id,

                  error:
                    safelySerializeError(
                      error
                    ),

                  environment:
                    STATE.environment,

                  failed_at:
                    nowISO()
                }
              );

              throw error;
            }
          }
        );

    STATE.writeQueue =
      queuedWrite;

    return queuedWrite
      .finally(
        () => {
          STATE.pendingWrites =
            Math.max(
              0,
              STATE.pendingWrites - 1
            );
        }
      );
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
      typeof STATE.client.rpc !==
      "function"
    ) {
      findings.push(
        "SUPABASE_RPC_UNAVAILABLE"
      );
    }

    if (
      !cleanString(
        STATE.receiptRpc
      )
    ) {
      findings.push(
        "AUTHENTICATION_RECEIPT_RPC_UNAVAILABLE"
      );
    }

    if (!STATE.configured) {
      findings.push(
        "AUTHENTICATION_RECEIPT_AUTHORITY_NOT_CONFIGURED"
      );
    }

    if (
      STATE.configurationLocked !==
      true
    ) {
      findings.push(
        "AUTHENTICATION_RECEIPT_CONFIGURATION_NOT_LOCKED"
      );
    }

    return immutableClone({
      ok:
        findings.length === 0,

      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME,

      configured:
        STATE.configured,

      configuration_locked:
        STATE.configurationLocked,

      environment:
        STATE.environment,

      receipt_rpc:
        STATE.receiptRpc,

      client_available:
        Boolean(
          STATE.client
        ),

      rpc_available:
        Boolean(
          STATE.client &&
          typeof STATE.client.rpc ===
          "function"
        ),

      pending_writes:
        STATE.pendingWrites,

      completed_writes:
        STATE.completedWrites,

      failed_writes:
        STATE.failedWrites,

      findings,

      checked_at:
        nowISO()
    });
  }

  /*
  ==========================================================
  CONTRACT REPORTING
  ==========================================================
  */

  function getContractDefinition() {
    return immutableClone({
      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME,

      receipt_fields:
        RECEIPT_FIELDS,

      required_receipt_fields:
        REQUIRED_RECEIPT_FIELDS,

      acknowledgment_fields:
        ACKNOWLEDGMENT_FIELDS,

      allowed_outcomes:
        ALLOWED_OUTCOMES,

      allowed_roles:
        ALLOWED_ROLES,

      allowed_authentication_sources:
        ALLOWED_AUTHENTICATION_SOURCES,

      prohibited_metadata_keys:
        PROHIBITED_METADATA_KEYS,

      event_names:
        EVENT_NAMES,

      transport:
        "supabase_rpc",

      concurrency_policy:
        "independent_fifo_queue",

      submission_capture:
        "synchronous_validation_and_immutable_detachment",

      reconfiguration_policy:
        "locked_after_production_configuration",

      server_authoritative:
        true,

      direct_browser_table_write:
        false,

      browser_manufactures_receipt_id:
        false,

      browser_manufactures_recorded_at:
        false,

      acknowledgment_shape:
        Object.freeze({
          accepted:
            true,

          receipt_id:
            "required_server_generated_string",

          recorded_at:
            "canonical_iso_8601_utc"
        }),

      result_shape:
        Object.freeze([
          "written",
          "persisted",
          "outcome",
          "authentication_receipt_id",
          "receipt_id",
          "recorded_at",
          "correlation_id",
          "contract",
          "acknowledgment_contract"
        ])
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

      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME,

      EVENT_NAMES,

      RECEIPT_FIELDS,

      REQUIRED_RECEIPT_FIELDS,

      ACKNOWLEDGMENT_FIELDS,

      ALLOWED_OUTCOMES,

      ALLOWED_ROLES,

      ALLOWED_AUTHENTICATION_SOURCES,

      PROHIBITED_METADATA_KEYS,

      configure,

      getConfiguration,

      getContractDefinition,

      create,

      validate,

      write,

      getLastResult,

      getLastError,

      runHealthCheck
    });

  global.STATSCORE_AUTH_RECEIPTS =
    api;

  global.STATScore =
    global.STATScore ||
    {};

  global.STATScore
    .AuthenticationReceipts =
    api;

  global.dispatchEvent(
    new CustomEvent(
      "statscore:authentication-receipts-loaded",
      {
        detail:
          immutableClone({
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            contract:
              CONTRACT_NAME,

            loaded:
              true,

            configured:
              false
          })
      }
    )
  );

  console.info(
    "[STATS-CORE Authentication Receipts] Loaded:",
    VERSION
  );
})(window); 
