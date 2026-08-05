/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-authentication-errors.js

Asset Type:
JavaScript Authority Module / Authentication Error Governance

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Authentication Error Authority

System Layer:
Authentication Governance / Controlled Error Contract

Primary Consumers:
- login.html
- statscore-authentication-context.js
- statscore-authentication-receipts.js
- statscore-authentication-service.js
- statscore-authentication-bootstrap.js
- authorized diagnostics
- Office of the Chief Systems Engineer
- Master Integration Stream

Purpose:
Establishes the governed authentication error vocabulary used
throughout the complete Stream 1 Authentication Authority.

This authority:

- defines immutable authentication error codes
- provides canonical public-safe messages
- distinguishes public messages from internal diagnostic messages
- classifies retryable, security-related, and production-blocking errors
- normalizes Supabase and browser-provider failures
- creates controlled authentication error objects
- preserves safe causal information
- sanitizes diagnostic metadata
- prevents credentials, tokens, sessions, stacks, and provider payloads
  from entering serialized error evidence
- provides deterministic public and diagnostic serialization
- supports assertions used by all Authentication Authorities
- preserves one synchronized error contract across Login, Context,
  Receipts, Service, and Bootstrap

Constitutional Boundary:
This module governs authentication errors only.

It does not:

- authenticate credentials
- register accounts
- create auth.users records
- resolve enterprise identities
- resolve enterprise roles
- determine entry state
- manufacture session identifiers
- publish Initial Authentication Context
- write Authentication Receipts
- perform routing
- initialize Runtime Context
- create athlete source records
- create athlete snapshots
- create professional intake contexts
- create professional workspaces
- restore downstream workspaces
- expose provider credentials
- expose browser storage
- expose stack traces to public consumers
- expose raw provider responses

Approved Public Contract:
Every governed authentication error may expose:

- name
- code
- user_message
- correlation_id
- retryable
- security_related
- production_blocking
- created_at

Approved Diagnostic Contract:
Authorized diagnostics may additionally expose:

- internal_message
- authority_id
- authority_version
- provider_code
- provider_status
- operation
- metadata

Prohibited Error Evidence:
The authority shall reject or remove:

- passwords
- passcodes
- access tokens
- refresh tokens
- authorization headers
- cookies
- Supabase sessions
- provider sessions
- raw provider responses
- stack traces
- credentials
- secrets
- private keys
- service-role keys
- browser storage objects
- DOM objects
- request objects
- uncontrolled cyclic structures

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
STATSCORE-AUTHENTICATION-ERRORS-V2.0.0

==========================================================
*/

(function initializeStatsCoreAuthenticationErrors(global) {
  "use strict";

  /*
  ==========================================================
  AUTHORITY IDENTITY
  ==========================================================
  */

  const AUTHORITY_ID =
    "statscore-authentication-errors";

  const VERSION =
    "STATSCORE-AUTHENTICATION-ERRORS-V2.0.0";

  const CONTRACT_NAME =
    "STATSCORE-AUTHENTICATION-ERROR-CONTRACT-V2.0.0";

  const ERROR_NAME =
    "StatsCoreAuthenticationError";

  const DEFAULT_ERROR_CODE =
    "AUTHENTICATION_UNKNOWN_ERROR";

  const MAX_CODE_LENGTH =
    128;

  const MAX_MESSAGE_LENGTH =
    2048;

  const MAX_CORRELATION_ID_LENGTH =
    256;

  const MAX_OPERATION_LENGTH =
    256;

  const MAX_PROVIDER_CODE_LENGTH =
    256;

  const MAX_DETAIL_KEY_LENGTH =
    128;

  const MAX_DETAIL_STRING_LENGTH =
    2048;

  const MAX_DETAILS_SERIALIZED_LENGTH =
    16384;

  const MAX_DETAILS_DEPTH =
    7;

  const MAX_ARRAY_LENGTH =
    50;

  /*
  ==========================================================
  GOVERNED ERROR VOCABULARY
  ==========================================================
  */

  const ERROR_CODES =
    Object.freeze({
      CONFIGURATION_ERROR:
        "AUTHENTICATION_CONFIGURATION_ERROR",

      INVALID_REQUEST:
        "AUTHENTICATION_INVALID_REQUEST",

      AUTHENTICATION_UNAVAILABLE:
        "AUTHENTICATION_UNAVAILABLE",

      AUTHENTICATION_FAILURE:
        "AUTHENTICATION_FAILURE",

      INVALID_CREDENTIALS:
        "AUTHENTICATION_INVALID_CREDENTIALS",

      EMAIL_NOT_CONFIRMED:
        "AUTHENTICATION_EMAIL_NOT_CONFIRMED",

      ACCOUNT_DISABLED:
        "AUTHENTICATION_ACCOUNT_DISABLED",

      ACCOUNT_NOT_FOUND:
        "AUTHENTICATION_ACCOUNT_NOT_FOUND",

      SESSION_FAILURE:
        "AUTHENTICATION_SESSION_FAILURE",

      SESSION_EXPIRED:
        "AUTHENTICATION_SESSION_EXPIRED",

      SESSION_INVALID:
        "AUTHENTICATION_SESSION_INVALID",

      UNKNOWN_IDENTITY:
        "AUTHENTICATION_UNKNOWN_IDENTITY",

      IDENTITY_LOOKUP_FAILURE:
        "AUTHENTICATION_IDENTITY_LOOKUP_FAILURE",

      UNKNOWN_ROLE:
        "AUTHENTICATION_UNKNOWN_ROLE",

      UNSUPPORTED_ROLE:
        "AUTHENTICATION_UNSUPPORTED_ROLE",

      ROLE_MISMATCH:
        "AUTHENTICATION_ROLE_MISMATCH",

      ENTRY_STATE_FAILURE:
        "AUTHENTICATION_ENTRY_STATE_FAILURE",

      ENTRY_STATE_INVALID:
        "AUTHENTICATION_ENTRY_STATE_INVALID",

      ROUTING_DENIED:
        "AUTHENTICATION_ROUTING_DENIED",

      ROUTING_FAILURE:
        "AUTHENTICATION_ROUTING_FAILURE",

      CONTEXT_FAILURE:
        "AUTHENTICATION_CONTEXT_FAILURE",

      CONTEXT_VALIDATION_FAILURE:
        "AUTHENTICATION_CONTEXT_VALIDATION_FAILURE",

      CONTEXT_PERSISTENCE_FAILURE:
        "AUTHENTICATION_CONTEXT_PERSISTENCE_FAILURE",

      RECEIPT_FAILURE:
        "AUTHENTICATION_RECEIPT_FAILURE",

      RECEIPT_VALIDATION_FAILURE:
        "AUTHENTICATION_RECEIPT_VALIDATION_FAILURE",

      RECEIPT_PERSISTENCE_FAILURE:
        "AUTHENTICATION_RECEIPT_PERSISTENCE_FAILURE",

      AUTHORIZATION_FAILURE:
        "AUTHENTICATION_AUTHORIZATION_FAILURE",

      REQUEST_CONFLICT:
        "AUTHENTICATION_REQUEST_CONFLICT",

      REQUEST_CANCELLED:
        "AUTHENTICATION_REQUEST_CANCELLED",

      RATE_LIMITED:
        "AUTHENTICATION_RATE_LIMITED",

      NETWORK_FAILURE:
        "AUTHENTICATION_NETWORK_FAILURE",

      PROVIDER_FAILURE:
        "AUTHENTICATION_PROVIDER_FAILURE",

      SECURITY_REJECTION:
        "AUTHENTICATION_SECURITY_REJECTION",

      ROLLBACK_FAILURE:
        "AUTHENTICATION_ROLLBACK_FAILURE",

      SIGN_OUT_FAILURE:
        "AUTHENTICATION_SIGN_OUT_FAILURE",

      INTERNAL_FAILURE:
        "AUTHENTICATION_INTERNAL_FAILURE",

      UNKNOWN_ERROR:
        "AUTHENTICATION_UNKNOWN_ERROR"
    });

  const ERROR_CODE_VALUES =
    Object.freeze(
      Object.values(
        ERROR_CODES
      )
    );

  const ERROR_CODE_SET =
    new Set(
      ERROR_CODE_VALUES
    );

  /*
  ==========================================================
  PUBLIC MESSAGE AUTHORITY
  ==========================================================
  */

  const PUBLIC_MESSAGES =
    Object.freeze({
      [ERROR_CODES.CONFIGURATION_ERROR]:
        "The governed authentication runtime has not been configured.",

      [ERROR_CODES.INVALID_REQUEST]:
        "The authentication request is incomplete or invalid.",

      [ERROR_CODES.AUTHENTICATION_UNAVAILABLE]:
        "Authentication is temporarily unavailable.",

      [ERROR_CODES.AUTHENTICATION_FAILURE]:
        "Authentication could not be completed.",

      [ERROR_CODES.INVALID_CREDENTIALS]:
        "The email or password is incorrect.",

      [ERROR_CODES.EMAIL_NOT_CONFIRMED]:
        "Verify your email address before signing in.",

      [ERROR_CODES.ACCOUNT_DISABLED]:
        "This enterprise account is not currently authorized for access.",

      [ERROR_CODES.ACCOUNT_NOT_FOUND]:
        "No authorized enterprise account was found.",

      [ERROR_CODES.SESSION_FAILURE]:
        "The authentication session could not be established.",

      [ERROR_CODES.SESSION_EXPIRED]:
        "The authentication session has expired. Sign in again.",

      [ERROR_CODES.SESSION_INVALID]:
        "The authentication session is invalid. Sign in again.",

      [ERROR_CODES.UNKNOWN_IDENTITY]:
        "No active STATS-CORE enterprise identity is associated with this account.",

      [ERROR_CODES.IDENTITY_LOOKUP_FAILURE]:
        "The enterprise identity could not be resolved.",

      [ERROR_CODES.UNKNOWN_ROLE]:
        "No governed enterprise role is associated with this account.",

      [ERROR_CODES.UNSUPPORTED_ROLE]:
        "The enterprise role is not supported by this access authority.",

      [ERROR_CODES.ROLE_MISMATCH]:
        "The selected access role does not match this account.",

      [ERROR_CODES.ENTRY_STATE_FAILURE]:
        "The enterprise entry state could not be resolved.",

      [ERROR_CODES.ENTRY_STATE_INVALID]:
        "The enterprise entry state is invalid.",

      [ERROR_CODES.ROUTING_DENIED]:
        "The requested enterprise destination is not authorized.",

      [ERROR_CODES.ROUTING_FAILURE]:
        "The authorized enterprise destination could not be resolved.",

      [ERROR_CODES.CONTEXT_FAILURE]:
        "The Initial Authentication Context could not be established.",

      [ERROR_CODES.CONTEXT_VALIDATION_FAILURE]:
        "The Initial Authentication Context is invalid.",

      [ERROR_CODES.CONTEXT_PERSISTENCE_FAILURE]:
        "The Initial Authentication Context could not be preserved.",

      [ERROR_CODES.RECEIPT_FAILURE]:
        "Authentication evidence could not be recorded.",

      [ERROR_CODES.RECEIPT_VALIDATION_FAILURE]:
        "Authentication evidence is incomplete or invalid.",

      [ERROR_CODES.RECEIPT_PERSISTENCE_FAILURE]:
        "Authentication evidence could not be preserved.",

      [ERROR_CODES.AUTHORIZATION_FAILURE]:
        "This account is not authorized for the requested enterprise access.",

      [ERROR_CODES.REQUEST_CONFLICT]:
        "An authentication request is already in progress.",

      [ERROR_CODES.REQUEST_CANCELLED]:
        "The authentication request was cancelled.",

      [ERROR_CODES.RATE_LIMITED]:
        "Too many authentication attempts were received. Wait before trying again.",

      [ERROR_CODES.NETWORK_FAILURE]:
        "The authentication service could not be reached. Check your connection and try again.",

      [ERROR_CODES.PROVIDER_FAILURE]:
        "The authentication provider could not complete the request.",

      [ERROR_CODES.SECURITY_REJECTION]:
        "The authentication request was rejected by enterprise security controls.",

      [ERROR_CODES.ROLLBACK_FAILURE]:
        "Authentication cleanup could not be completed.",

      [ERROR_CODES.SIGN_OUT_FAILURE]:
        "The authentication session could not be closed.",

      [ERROR_CODES.INTERNAL_FAILURE]:
        "An internal authentication failure occurred.",

      [ERROR_CODES.UNKNOWN_ERROR]:
        "Authentication could not be completed."
    });

  /*
  ==========================================================
  ERROR CLASSIFICATION
  ==========================================================
  */

  const RETRYABLE_CODES =
    Object.freeze([
      ERROR_CODES.AUTHENTICATION_UNAVAILABLE,
      ERROR_CODES.SESSION_FAILURE,
      ERROR_CODES.NETWORK_FAILURE,
      ERROR_CODES.PROVIDER_FAILURE,
      ERROR_CODES.RATE_LIMITED,
      ERROR_CODES.RECEIPT_PERSISTENCE_FAILURE,
      ERROR_CODES.INTERNAL_FAILURE,
      ERROR_CODES.UNKNOWN_ERROR
    ]);

  const RETRYABLE_CODE_SET =
    new Set(
      RETRYABLE_CODES
    );

  const SECURITY_CODES =
    Object.freeze([
      ERROR_CODES.INVALID_CREDENTIALS,
      ERROR_CODES.ACCOUNT_DISABLED,
      ERROR_CODES.ROLE_MISMATCH,
      ERROR_CODES.ROUTING_DENIED,
      ERROR_CODES.AUTHORIZATION_FAILURE,
      ERROR_CODES.SECURITY_REJECTION,
      ERROR_CODES.SESSION_INVALID
    ]);

  const SECURITY_CODE_SET =
    new Set(
      SECURITY_CODES
    );

  const PRODUCTION_BLOCKING_CODES =
    Object.freeze([
      ERROR_CODES.CONFIGURATION_ERROR,
      ERROR_CODES.UNKNOWN_IDENTITY,
      ERROR_CODES.IDENTITY_LOOKUP_FAILURE,
      ERROR_CODES.UNKNOWN_ROLE,
      ERROR_CODES.UNSUPPORTED_ROLE,
      ERROR_CODES.ENTRY_STATE_FAILURE,
      ERROR_CODES.ENTRY_STATE_INVALID,
      ERROR_CODES.ROUTING_FAILURE,
      ERROR_CODES.CONTEXT_FAILURE,
      ERROR_CODES.CONTEXT_VALIDATION_FAILURE,
      ERROR_CODES.CONTEXT_PERSISTENCE_FAILURE,
      ERROR_CODES.RECEIPT_FAILURE,
      ERROR_CODES.RECEIPT_VALIDATION_FAILURE,
      ERROR_CODES.RECEIPT_PERSISTENCE_FAILURE,
      ERROR_CODES.ROLLBACK_FAILURE,
      ERROR_CODES.INTERNAL_FAILURE
    ]);

  const PRODUCTION_BLOCKING_CODE_SET =
    new Set(
      PRODUCTION_BLOCKING_CODES
    );

  /*
  ==========================================================
  PROHIBITED DETAIL GOVERNANCE
  ==========================================================
  */

  const PROHIBITED_DETAIL_KEYS =
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
      "dom",
      "element"
    ]);

  const PROHIBITED_DETAIL_KEY_SET =
    new Set(
      PROHIBITED_DETAIL_KEYS
    );

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

  function generateCorrelationId() {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
    ) {
      return (
        "authentication-error-" +
        global.crypto.randomUUID()
      );
    }

    return (
      "authentication-error-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 12)
    );
  }

  function rejectControlCharacters(
    value,
    label
  ) {
    if (
      /[\u0000-\u001F\u007F]/.test(
        value
      )
    ) {
      throw new TypeError(
        label +
        " contains prohibited control characters."
      );
    }

    return value;
  }

  function validateRequiredString(
    value,
    label,
    maximumLength
  ) {
    const candidate =
      cleanString(value);

    if (!candidate) {
      throw new TypeError(
        label +
        " is required."
      );
    }

    if (
      candidate.length >
      maximumLength
    ) {
      throw new TypeError(
        label +
        " exceeds the authorized maximum length."
      );
    }

    return rejectControlCharacters(
      candidate,
      label
    );
  }

  function validateOptionalString(
    value,
    label,
    maximumLength
  ) {
    const candidate =
      cleanString(value);

    if (!candidate) {
      return null;
    }

    if (
      candidate.length >
      maximumLength
    ) {
      throw new TypeError(
        label +
        " exceeds the authorized maximum length."
      );
    }

    return rejectControlCharacters(
      candidate,
      label
    );
  }

  function isKnownCode(code) {
    return ERROR_CODE_SET.has(
      cleanString(code)
    );
  }

  function normalizeKnownCode(
    code,
    fallbackCode
  ) {
    const requested =
      cleanString(code);

    if (isKnownCode(requested)) {
      return requested;
    }

    const fallback =
      cleanString(fallbackCode);

    if (isKnownCode(fallback)) {
      return fallback;
    }

    return ERROR_CODES.UNKNOWN_ERROR;
  }

  function getPublicMessage(code) {
    const normalizedCode =
      normalizeKnownCode(
        code,
        ERROR_CODES.UNKNOWN_ERROR
      );

    return (
      PUBLIC_MESSAGES[
        normalizedCode
      ] ||
      PUBLIC_MESSAGES[
        ERROR_CODES.UNKNOWN_ERROR
      ]
    );
  }

  function isRetryableCode(code) {
    return RETRYABLE_CODE_SET.has(
      normalizeKnownCode(
        code,
        ERROR_CODES.UNKNOWN_ERROR
      )
    );
  }

  function isSecurityCode(code) {
    return SECURITY_CODE_SET.has(
      normalizeKnownCode(
        code,
        ERROR_CODES.UNKNOWN_ERROR
      )
    );
  }

  function isProductionBlockingCode(code) {
    return PRODUCTION_BLOCKING_CODE_SET.has(
      normalizeKnownCode(
        code,
        ERROR_CODES.UNKNOWN_ERROR
      )
    );
  }

  function assertPlainObject(
    value,
    label
  ) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw new TypeError(
        label +
        " must be a plain object."
      );
    }

    const prototype =
      Object.getPrototypeOf(
        value
      );

    if (
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      throw new TypeError(
        label +
        " must use a supported object shape."
      );
    }

    return value;
  }

  /*
  ==========================================================
  DETAIL SANITIZATION
  ==========================================================
  */

  function isProhibitedDetailKey(
    key
  ) {
    const normalized =
      cleanString(key)
        .toLowerCase();

    if (!normalized) {
      return true;
    }

    if (
      PROHIBITED_DETAIL_KEY_SET.has(
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
          return normalized.includes(
            fragment
          );
        }
      );
  }

  function normalizeDetailKey(value) {
    const key =
      validateRequiredString(
        value,
        "Authentication error detail key",
        MAX_DETAIL_KEY_LENGTH
      );

    if (
      isProhibitedDetailKey(
        key
      )
    ) {
      throw new TypeError(
        "Authentication error details contain a prohibited key: " +
        key
      );
    }

    return key;
  }

  function sanitizeDetailValue(
    value,
    depth,
    seen
  ) {
    if (
      depth >
      MAX_DETAILS_DEPTH
    ) {
      throw new TypeError(
        "Authentication error details exceed the authorized depth."
      );
    }

    if (
      value === null ||
      typeof value === "boolean"
    ) {
      return value;
    }

    if (
      typeof value === "string"
    ) {
      if (
        value.length >
        MAX_DETAIL_STRING_LENGTH
      ) {
        return rejectControlCharacters(
          value.slice(
            0,
            MAX_DETAIL_STRING_LENGTH
          ),
          "Authentication error detail value"
        );
      }

      return rejectControlCharacters(
        value,
        "Authentication error detail value"
      );
    }

    if (
      typeof value === "number"
    ) {
      if (
        !Number.isFinite(
          value
        )
      ) {
        throw new TypeError(
          "Authentication error details contain a non-finite number."
        );
      }

      return value;
    }

    if (
      typeof value === "undefined" ||
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "bigint"
    ) {
      return null;
    }

    if (
      typeof value !== "object"
    ) {
      return null;
    }

    if (
      value instanceof Error
    ) {
      return Object.freeze({
        name:
          cleanString(
            value.name
          ) ||
          "Error",

        message:
          cleanString(
            value.message
          ).slice(
            0,
            MAX_DETAIL_STRING_LENGTH
          ) ||
          "Controlled error"
      });
    }

    if (
      seen.has(
        value
      )
    ) {
      throw new TypeError(
        "Authentication error details contain a circular reference."
      );
    }

    seen.add(
      value
    );

    if (
      Array.isArray(value)
    ) {
      const output =
        value
          .slice(
            0,
            MAX_ARRAY_LENGTH
          )
          .map(
            (item) => {
              return sanitizeDetailValue(
                item,
                depth + 1,
                seen
              );
            }
          );

      seen.delete(
        value
      );

      return output;
    }

    const prototype =
      Object.getPrototypeOf(
        value
      );

    if (
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      seen.delete(
        value
      );

      return null;
    }

    const output =
      Object.create(null);

    const normalizedKeys =
      new Set();

    for (
      const [key, item]
      of Object.entries(value)
    ) {
      const normalizedKey =
        normalizeDetailKey(
          key
        );

      const collisionKey =
        normalizedKey.toLowerCase();

      if (
        normalizedKeys.has(
          collisionKey
        )
      ) {
        seen.delete(
          value
        );

        throw new TypeError(
          "Authentication error details contain a duplicate normalized key: " +
          normalizedKey
        );
      }

      normalizedKeys.add(
        collisionKey
      );

      output[
        normalizedKey
      ] =
        sanitizeDetailValue(
          item,
          depth + 1,
          seen
        );
    }

    seen.delete(
      value
    );

    return output;
  }

  function sanitizeDetails(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    assertPlainObject(
      value,
      "Authentication error details"
    );

    const sanitized =
      sanitizeDetailValue(
        value,
        0,
        new WeakSet()
      );

    let serialized;

    try {
      serialized =
        JSON.stringify(
          sanitized
        );
    } catch (_) {
      throw new TypeError(
        "Authentication error details could not be serialized."
      );
    }

    if (
      serialized.length >
      MAX_DETAILS_SERIALIZED_LENGTH
    ) {
      throw new TypeError(
        "Authentication error details exceed the authorized size."
      );
    }

    return deepFreeze(
      sanitized
    );
  }

  /*
  ==========================================================
  PROVIDER INSPECTION
  ==========================================================
  */

  function getProviderMessage(error) {
    return cleanString(
      error &&
      (
        error.message ||
        error.error_description ||
        error.msg ||
        error.details ||
        error.hint
      )
    );
  }

  function getProviderCode(error) {
    return cleanString(
      error &&
      (
        error.code ||
        error.error_code ||
        error.name
      )
    );
  }

  function getProviderStatus(error) {
    const status =
      error &&
      (
        error.status ||
        error.statusCode ||
        error.status_code
      );

    return Number.isFinite(
      Number(status)
    )
      ? Number(status)
      : null;
  }

  function includesAny(
    source,
    fragments
  ) {
    const normalized =
      cleanString(source)
        .toLowerCase();

    return fragments.some(
      (fragment) => {
        return normalized.includes(
          fragment
        );
      }
    );
  }

  function mapProviderErrorCode(
    error
  ) {
    const providerMessage =
      getProviderMessage(
        error
      );

    const providerCode =
      getProviderCode(
        error
      );

    const providerStatus =
      getProviderStatus(
        error
      );

    const combined =
      [
        providerMessage,
        providerCode
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (
      includesAny(
        combined,
        [
          "invalid login credentials",
          "invalid credentials",
          "wrong password",
          "incorrect password",
          "invalid password",
          "email or password"
        ]
      )
    ) {
      return ERROR_CODES.INVALID_CREDENTIALS;
    }

    if (
      includesAny(
        combined,
        [
          "email not confirmed",
          "email is not confirmed",
          "confirm your email",
          "email confirmation required"
        ]
      )
    ) {
      return ERROR_CODES.EMAIL_NOT_CONFIRMED;
    }

    if (
      includesAny(
        combined,
        [
          "user not found",
          "account not found",
          "no user",
          "unknown user"
        ]
      )
    ) {
      return ERROR_CODES.ACCOUNT_NOT_FOUND;
    }

    if (
      includesAny(
        combined,
        [
          "user banned",
          "account disabled",
          "user disabled",
          "banned until",
          "inactive account"
        ]
      )
    ) {
      return ERROR_CODES.ACCOUNT_DISABLED;
    }

    if (
      includesAny(
        combined,
        [
          "jwt expired",
          "session expired",
          "token expired"
        ]
      )
    ) {
      return ERROR_CODES.SESSION_EXPIRED;
    }

    if (
      includesAny(
        combined,
        [
          "invalid jwt",
          "invalid session",
          "session not found",
          "refresh token not found"
        ]
      )
    ) {
      return ERROR_CODES.SESSION_INVALID;
    }

    if (
      includesAny(
        combined,
        [
          "rate limit",
          "too many requests",
          "too many attempts",
          "request rate"
        ]
      ) ||
      providerStatus === 429
    ) {
      return ERROR_CODES.RATE_LIMITED;
    }

    if (
      includesAny(
        combined,
        [
          "failed to fetch",
          "fetch failed",
          "networkerror",
          "network error",
          "connection refused",
          "connection failed",
          "offline"
        ]
      )
    ) {
      return ERROR_CODES.NETWORK_FAILURE;
    }

    if (
      includesAny(
        combined,
        [
          "abort",
          "cancelled",
          "canceled"
        ]
      )
    ) {
      return ERROR_CODES.REQUEST_CANCELLED;
    }

    if (
      includesAny(
        combined,
        [
          "permission denied",
          "not authorized",
          "unauthorized",
          "forbidden",
          "security policy",
          "row-level security",
          "rls"
        ]
      ) ||
      providerStatus === 401 ||
      providerStatus === 403
    ) {
      return ERROR_CODES.SECURITY_REJECTION;
    }

    if (
      includesAny(
        combined,
        [
          "timeout",
          "gateway timeout",
          "service unavailable"
        ]
      ) ||
      providerStatus === 408 ||
      providerStatus === 502 ||
      providerStatus === 503 ||
      providerStatus === 504
    ) {
      return ERROR_CODES.AUTHENTICATION_UNAVAILABLE;
    }

    if (
      providerStatus !== null &&
      providerStatus >= 500
    ) {
      return ERROR_CODES.PROVIDER_FAILURE;
    }

    return ERROR_CODES.PROVIDER_FAILURE;
  }

  /*
  ==========================================================
  OPTION NORMALIZATION
  ==========================================================
  */

  function normalizeCause(value) {
    return value instanceof Error
      ? value
      : null;
  }

  function resolveBoolean(
    suppliedValue,
    fallbackValue,
    label
  ) {
    if (
      suppliedValue !== undefined &&
      typeof suppliedValue !== "boolean"
    ) {
      throw new TypeError(
        label +
        " must be boolean."
      );
    }

    if (
      typeof suppliedValue === "boolean"
    ) {
      return suppliedValue;
    }

    return Boolean(
      fallbackValue
    );
  }

  function resolveOptions(options) {
    if (
      options === undefined ||
      options === null
    ) {
      return Object.freeze({
        cause:
          null,

        user_message:
          null,

        internal_message:
          null,

        correlation_id:
          null,

        retryable:
          undefined,

        security_related:
          undefined,

        production_blocking:
          undefined,

        provider_code:
          null,

        provider_status:
          null,

        operation:
          null,

        details:
          null,

        metadata:
          null
      });
    }

    assertPlainObject(
      options,
      "Authentication error options"
    );

    const authorizedFields =
      new Set([
        "cause",
        "user_message",
        "internal_message",
        "message",
        "correlation_id",
        "retryable",
        "security_related",
        "production_blocking",
        "provider_code",
        "provider_status",
        "operation",
        "details",
        "metadata"
      ]);

    const unauthorizedFields =
      Object.keys(
        options
      ).filter(
        (fieldName) => {
          return !authorizedFields.has(
            fieldName
          );
        }
      );

    if (
      unauthorizedFields.length >
      0
    ) {
      throw new TypeError(
        "Authentication error options contain unauthorized fields: " +
        unauthorizedFields.join(", ")
      );
    }

    const providerStatus =
      options.provider_status ===
        undefined ||
      options.provider_status ===
        null
        ? null
        : Number(
            options.provider_status
          );

    if (
      providerStatus !== null &&
      !Number.isFinite(
        providerStatus
      )
    ) {
      throw new TypeError(
        "Authentication provider status must be numeric."
      );
    }

    const details =
      options.details !==
        undefined
        ? sanitizeDetails(
            options.details
          )
        : null;

    const metadata =
      options.metadata !==
        undefined
        ? sanitizeDetails(
            options.metadata
          )
        : null;

    return Object.freeze({
      cause:
        normalizeCause(
          options.cause
        ),

      user_message:
        validateOptionalString(
          options.user_message,
          "Authentication public message",
          MAX_MESSAGE_LENGTH
        ),

      internal_message:
        validateOptionalString(
          options.internal_message ||
          options.message,
          "Authentication internal message",
          MAX_MESSAGE_LENGTH
        ),

      correlation_id:
        validateOptionalString(
          options.correlation_id,
          "Authentication correlation identifier",
          MAX_CORRELATION_ID_LENGTH
        ),

      retryable:
        options.retryable,

      security_related:
        options.security_related,

      production_blocking:
        options.production_blocking,

      provider_code:
        validateOptionalString(
          options.provider_code,
          "Authentication provider code",
          MAX_PROVIDER_CODE_LENGTH
        ),

      provider_status:
        providerStatus,

      operation:
        validateOptionalString(
          options.operation,
          "Authentication operation",
          MAX_OPERATION_LENGTH
        ),

      details,

      metadata
    });
  }

  /*
  ==========================================================
  GOVERNED ERROR CLASS
  ==========================================================
  */

  class StatsCoreAuthenticationError
    extends Error {
    constructor(
      code,
      message,
      options
    ) {
      const normalizedCode =
        normalizeKnownCode(
          code,
          ERROR_CODES.UNKNOWN_ERROR
        );

      const normalizedOptions =
        resolveOptions(
          options
        );

      const suppliedMessage =
        cleanString(
          message
        );

      const internalMessage =
        suppliedMessage ||
        normalizedOptions
          .internal_message ||
        getPublicMessage(
          normalizedCode
        );

      const validatedInternalMessage =
        validateRequiredString(
          internalMessage,
          "Authentication internal message",
          MAX_MESSAGE_LENGTH
        );

      super(
        validatedInternalMessage
      );

      const publicMessage =
        normalizedOptions
          .user_message ||
        getPublicMessage(
          normalizedCode
        );

      const correlationId =
        normalizedOptions
          .correlation_id ||
        generateCorrelationId();

      Object.defineProperties(
        this,
        {
          name: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              ERROR_NAME
          },

          code: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              normalizedCode
          },

          user_message: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              publicMessage
          },

          internal_message: {
            configurable:
              false,

            enumerable:
              false,

            writable:
              false,

            value:
              validatedInternalMessage
          },

          authority_id: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              AUTHORITY_ID
          },

          authority_version: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              VERSION
          },

          contract: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              CONTRACT_NAME
          },

          correlation_id: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              correlationId
          },

          created_at: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              nowISO()
          },

          retryable: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              resolveBoolean(
                normalizedOptions
                  .retryable,
                isRetryableCode(
                  normalizedCode
                ),
                "Authentication error retryable"
              )
          },

          security_related: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              resolveBoolean(
                normalizedOptions
                  .security_related,
                isSecurityCode(
                  normalizedCode
                ),
                "Authentication error security_related"
              )
          },

          production_blocking: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              resolveBoolean(
                normalizedOptions
                  .production_blocking,
                isProductionBlockingCode(
                  normalizedCode
                ),
                "Authentication error production_blocking"
              )
          },

          provider_code: {
            configurable:
              false,

            enumerable:
              false,

            writable:
              false,

            value:
              normalizedOptions
                .provider_code
          },

          provider_status: {
            configurable:
              false,

            enumerable:
              false,

            writable:
              false,

            value:
              normalizedOptions
                .provider_status
          },

          operation: {
            configurable:
              false,

            enumerable:
              false,

            writable:
              false,

            value:
              normalizedOptions
                .operation
          },

          details: {
            configurable:
              false,

            enumerable:
              true,

            writable:
              false,

            value:
              normalizedOptions
                .details
          },

          metadata: {
            configurable:
              false,

            enumerable:
              false,

            writable:
              false,

            value:
              normalizedOptions
                .metadata
          },

          cause: {
            configurable:
              false,

            enumerable:
              false,

            writable:
              false,

            value:
              normalizedOptions
                .cause
          }
        }
      );

      if (
        typeof Error.captureStackTrace ===
          "function"
      ) {
        Error.captureStackTrace(
          this,
          StatsCoreAuthenticationError
        );
      }
    }

    toPublicObject() {
      return Object.freeze({
        name:
          this.name,

        code:
          this.code,

        user_message:
          this.user_message,

        correlation_id:
          this.correlation_id,

        retryable:
          this.retryable,

        security_related:
          this.security_related,

        production_blocking:
          this.production_blocking,

        created_at:
          this.created_at
      });
    }

    toDiagnosticObject() {
      return Object.freeze({
        name:
          this.name,

        code:
          this.code,

        user_message:
          this.user_message,

        internal_message:
          this.internal_message,

        authority_id:
          this.authority_id,

        authority_version:
          this.authority_version,

        contract:
          this.contract,

        correlation_id:
          this.correlation_id,

        created_at:
          this.created_at,

        retryable:
          this.retryable,

        security_related:
          this.security_related,

        production_blocking:
          this.production_blocking,

        provider_code:
          this.provider_code,

        provider_status:
          this.provider_status,

        operation:
          this.operation,

        details:
          immutableClone(
            this.details
          ),

        metadata:
          immutableClone(
            this.metadata
          )
      });
    }

    toJSON() {
      return this.toPublicObject();
    }
  }

  /*
  ==========================================================
  ERROR CREATION
  ==========================================================
  */

  function create(
    code,
    message,
    options
  ) {
    return new StatsCoreAuthenticationError(
      code,
      message,
      options
    );
  }

  function createAuthenticationError(
    code,
    internalMessage,
    options
  ) {
    return create(
      code,
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  PROVIDER ERROR MAPPING
  ==========================================================
  */

  function mapProviderError(
    rawError,
    options = {}
  ) {
    const code =
      mapProviderErrorCode(
        rawError
      );

    const providerMessage =
      getProviderMessage(
        rawError
      );

    const suppliedInternalMessage =
      cleanString(
        options.internal_message
      );

    return new StatsCoreAuthenticationError(
      code,
      suppliedInternalMessage ||
      providerMessage ||
      getPublicMessage(code),
      {
        cause:
          rawError instanceof Error
            ? rawError
            : null,

        user_message:
          cleanString(
            options.user_message
          ) ||
          getPublicMessage(code),

        correlation_id:
          cleanString(
            options.correlation_id
          ) ||
          null,

        retryable:
          options.retryable,

        security_related:
          options.security_related,

        production_blocking:
          options.production_blocking,

        provider_code:
          cleanString(
            options.provider_code
          ) ||
          getProviderCode(
            rawError
          ) ||
          null,

        provider_status:
          options.provider_status !==
            undefined
            ? options.provider_status
            : getProviderStatus(
                rawError
              ),

        operation:
          cleanString(
            options.operation
          ) ||
          "authentication_provider",

        details:
          options.details ||
          null,

        metadata:
          options.metadata ||
          null
      }
    );
  }

  /*
  ==========================================================
  ERROR NORMALIZATION
  ==========================================================
  */

  function isAuthenticationError(value) {
    return (
      value instanceof
      StatsCoreAuthenticationError
    ) ||
    (
      value &&
      value.name ===
        ERROR_NAME &&
      isKnownCode(
        value.code
      )
    );
  }

  function normalize(
    rawError,
    fallbackCode,
    fallbackMessage,
    options
  ) {
    if (
      rawError instanceof
      StatsCoreAuthenticationError
    ) {
      return rawError;
    }

    if (
      rawError &&
      rawError.name ===
        ERROR_NAME &&
      isKnownCode(
        rawError.code
      )
    ) {
      return new StatsCoreAuthenticationError(
        rawError.code,
        cleanString(
          rawError.internal_message
        ) ||
        cleanString(
          rawError.message
        ) ||
        getPublicMessage(
          rawError.code
        ),
        {
          user_message:
            cleanString(
              rawError.user_message
            ) ||
            getPublicMessage(
              rawError.code
            ),

          correlation_id:
            cleanString(
              rawError.correlation_id
            ) ||
            null,

          retryable:
            rawError.retryable,

          security_related:
            rawError.security_related,

          production_blocking:
            rawError.production_blocking,

          provider_code:
            cleanString(
              rawError.provider_code
            ) ||
            null,

          provider_status:
            rawError.provider_status,

          operation:
            cleanString(
              rawError.operation
            ) ||
            null,

          details:
            rawError.details ||
            null,

          metadata:
            rawError.metadata ||
            null,

          cause:
            rawError instanceof Error
              ? rawError
              : null
        }
      );
    }

    const normalizedFallbackCode =
      normalizeKnownCode(
        fallbackCode,
        ERROR_CODES.UNKNOWN_ERROR
      );

    const normalizedOptions =
      options &&
      typeof options === "object" &&
      !Array.isArray(options)
        ? options
        : {};

    const providerMappedCode =
      mapProviderErrorCode(
        rawError
      );

    const useProviderMapping =
      normalizedOptions
        .use_provider_mapping !==
        false &&
      (
        normalizedFallbackCode ===
          ERROR_CODES.AUTHENTICATION_UNAVAILABLE ||
        normalizedFallbackCode ===
          ERROR_CODES.AUTHENTICATION_FAILURE ||
        normalizedFallbackCode ===
          ERROR_CODES.PROVIDER_FAILURE ||
        normalizedFallbackCode ===
          ERROR_CODES.UNKNOWN_ERROR
      );

    const resolvedCode =
      useProviderMapping
        ? providerMappedCode
        : normalizedFallbackCode;

    const internalMessage =
      cleanString(
        fallbackMessage
      ) ||
      cleanString(
        normalizedOptions
          .internal_message
      ) ||
      getProviderMessage(
        rawError
      ) ||
      getPublicMessage(
        resolvedCode
      );

    return new StatsCoreAuthenticationError(
      resolvedCode,
      internalMessage,
      {
        cause:
          rawError instanceof Error
            ? rawError
            : null,

        user_message:
          cleanString(
            normalizedOptions
              .user_message
          ) ||
          getPublicMessage(
            resolvedCode
          ),

        correlation_id:
          cleanString(
            normalizedOptions
              .correlation_id
          ) ||
          null,

        retryable:
          normalizedOptions
            .retryable,

        security_related:
          normalizedOptions
            .security_related,

        production_blocking:
          normalizedOptions
            .production_blocking,

        provider_code:
          cleanString(
            normalizedOptions
              .provider_code
          ) ||
          getProviderCode(
            rawError
          ) ||
          null,

        provider_status:
          normalizedOptions
            .provider_status !==
          undefined
            ? normalizedOptions
                .provider_status
            : getProviderStatus(
                rawError
              ),

        operation:
          cleanString(
            normalizedOptions
              .operation
          ) ||
          null,

        details:
          normalizedOptions
            .details ||
          null,

        metadata:
          normalizedOptions
            .metadata ||
          null
      }
    );
  }

  function normalizeAuthenticationError(
    rawError,
    options = {}
  ) {
    return normalize(
      rawError,

      options.code ||
      ERROR_CODES.UNKNOWN_ERROR,

      options.internal_message ||
      options.message ||
      "",

      options
    );
  }

  /*
  ==========================================================
  ASSERTION AUTHORITY
  ==========================================================
  */

  function assert(
    condition,
    code,
    internalMessage,
    options = {}
  ) {
    if (condition) {
      return true;
    }

    throw create(
      code,
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  SERIALIZATION AUTHORITY
  ==========================================================
  */

  function serializePublicError(
    error
  ) {
    return normalize(
      error,
      ERROR_CODES.UNKNOWN_ERROR,
      "Authentication could not be completed."
    ).toPublicObject();
  }

  function serializeDiagnosticError(
    error
  ) {
    return normalize(
      error,
      ERROR_CODES.UNKNOWN_ERROR,
      "Authentication could not be completed."
    ).toDiagnosticObject();
  }

  function serialize(error) {
    return serializePublicError(
      error
    );
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

      error_name:
        ERROR_NAME,

      default_error_code:
        DEFAULT_ERROR_CODE,

      error_codes:
        ERROR_CODES,

      error_code_values:
        ERROR_CODE_VALUES,

      public_messages:
        PUBLIC_MESSAGES,

      retryable_error_codes:
        RETRYABLE_CODES,

      security_error_codes:
        SECURITY_CODES,

      production_blocking_error_codes:
        PRODUCTION_BLOCKING_CODES,

      prohibited_detail_keys:
        PROHIBITED_DETAIL_KEYS,

      public_serialized_shape:
        [
          "name",
          "code",
          "user_message",
          "correlation_id",
          "retryable",
          "security_related",
          "production_blocking",
          "created_at"
        ],

      diagnostic_serialized_shape:
        [
          "name",
          "code",
          "user_message",
          "internal_message",
          "authority_id",
          "authority_version",
          "contract",
          "correlation_id",
          "created_at",
          "retryable",
          "security_related",
          "production_blocking",
          "provider_code",
          "provider_status",
          "operation",
          "details",
          "metadata"
        ],

      exposes_stack_publicly:
        false,

      serializes_cause_publicly:
        false,

      serializes_provider_response:
        false,

      permits_uncontrolled_error_codes:
        false
    });
  }

  function runHealthCheck() {
    const findings = [];

    if (
      ERROR_CODE_VALUES.length ===
      0
    ) {
      findings.push(
        "ERROR_CODE_VOCABULARY_EMPTY"
      );
    }

    ERROR_CODE_VALUES
      .forEach(
        (code) => {
          if (
            !PUBLIC_MESSAGES[code]
          ) {
            findings.push(
              "PUBLIC_MESSAGE_MISSING:" +
              code
            );
          }
        }
      );

    const requiredServiceCodes =
      [
        ERROR_CODES.CONFIGURATION_ERROR,
        ERROR_CODES.INVALID_REQUEST,
        ERROR_CODES.AUTHENTICATION_UNAVAILABLE,
        ERROR_CODES.UNKNOWN_IDENTITY,
        ERROR_CODES.UNKNOWN_ROLE,
        ERROR_CODES.UNSUPPORTED_ROLE,
        ERROR_CODES.ACCOUNT_DISABLED,
        ERROR_CODES.ROUTING_DENIED,
        ERROR_CODES.CONTEXT_FAILURE,
        ERROR_CODES.RECEIPT_FAILURE,
        ERROR_CODES.REQUEST_CONFLICT,
        ERROR_CODES.UNKNOWN_ERROR
      ];

    requiredServiceCodes
      .forEach(
        (code) => {
          if (
            !ERROR_CODE_SET.has(
              code
            )
          ) {
            findings.push(
              "REQUIRED_SERVICE_CODE_MISSING:" +
              code
            );
          }
        }
      );

    return immutableClone({
      ok:
        findings.length === 0,

      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      error_code_count:
        ERROR_CODE_VALUES.length,

      public_message_count:
        Object.keys(
          PUBLIC_MESSAGES
        ).length,

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

      contract:
        CONTRACT_NAME,

      error_name:
        ERROR_NAME,

      ERROR_CODES,

      ERROR_CODE_VALUES,

      PUBLIC_MESSAGES,

      RETRYABLE_ERROR_CODES:
        RETRYABLE_CODES,

      SECURITY_ERROR_CODES:
        SECURITY_CODES,

      PRODUCTION_BLOCKING_ERROR_CODES:
        PRODUCTION_BLOCKING_CODES,

      PROHIBITED_DETAIL_KEYS,

      StatsCoreAuthenticationError,

      isAuthenticationError,

      create,

      createAuthenticationError,

      normalize,

      normalizeAuthenticationError,

      mapProviderError,

      mapProviderErrorCode,

      getPublicMessage,

      isKnownCode,

      isRetryableCode,

      isSecurityCode,

      isProductionBlockingCode,

      assert,

      sanitizeDetails,

      serialize,

      serializePublicError,

      serializeDiagnosticError,

      getContractDefinition,

      runHealthCheck
    });

  global.STATSCORE_AUTH_ERRORS =
    api;

  global.STATScore =
    global.STATScore ||
    {};

  global.STATScore
    .AuthenticationErrors =
    api;

  global.dispatchEvent(
    new CustomEvent(
      "statscore:authentication-errors-ready",
      {
        detail:
          immutableClone({
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            contract:
              CONTRACT_NAME,

            ready:
              true,

            error_code_count:
              ERROR_CODE_VALUES.length
          })
      }
    )
  );

  console.info(
    "[STATS-CORE Authentication Errors] Authority ready:",
    VERSION
  );
})(window); 
