/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-registration-errors.js

Asset Type:
JavaScript Authority Module / Registration Error Governance

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Account Registration Authority

System Layer:
Public Entry / Registration Error Governance

Primary Consumers:
- register.html
- statscore-registration-service.js
- statscore-registration-receipts.js
- runtime bootstrap and diagnostics

Purpose:
Establishes the governed registration error vocabulary,
normalizes provider and infrastructure failures, protects
internal implementation details, and publishes safe
presentation messages for enterprise account registration.

Consumes:
- registration validation failures
- authentication provider errors
- identity initialization failures
- receipt infrastructure failures
- configuration failures
- email verification failures
- unexpected runtime exceptions

Provides:
- immutable registration error codes
- governed registration error objects
- provider-error normalization
- user-safe registration messages
- diagnostic metadata for authorized consumers

Does NOT:
- create authentication accounts
- authenticate users
- initialize enterprise identity
- publish Registration Context
- write Registration Receipts
- initialize Runtime Context
- route users
- expose raw provider errors to public presentation
- create athlete records or professional workspaces

Status:
ENGINEERING CHANGE CONTROL — ENTERPRISE REGISTRATION BUILD

==========================================================
*/

(function initializeRegistrationErrorAuthority(global) {
  "use strict";

  const AUTHORITY_ID =
    "statscore-registration-errors";

  const VERSION =
    "STATSCORE-REGISTRATION-ERRORS-V1.0.0";

  const ERROR_NAME =
    "STATScoreRegistrationError";

  const ERROR_CODES = Object.freeze({
    CONFIGURATION_ERROR:
      "REGISTRATION_CONFIGURATION_ERROR",

    REGISTRATION_UNAVAILABLE:
      "REGISTRATION_UNAVAILABLE",

    INVALID_REQUEST:
      "REGISTRATION_INVALID_REQUEST",

    INVALID_EMAIL:
      "REGISTRATION_INVALID_EMAIL",

    INVALID_ROLE:
      "REGISTRATION_INVALID_ROLE",

    INVALID_PASSWORD:
      "REGISTRATION_INVALID_PASSWORD",

    PASSWORD_MISMATCH:
      "REGISTRATION_PASSWORD_MISMATCH",

    TERMS_REQUIRED:
      "REGISTRATION_TERMS_REQUIRED",

    PRIVACY_REQUIRED:
      "REGISTRATION_PRIVACY_REQUIRED",

    DUPLICATE_ACCOUNT:
      "REGISTRATION_DUPLICATE_ACCOUNT",

    CREDENTIAL_CREATION_FAILED:
      "REGISTRATION_CREDENTIAL_CREATION_FAILED",

    EMAIL_VERIFICATION_REQUIRED:
      "REGISTRATION_EMAIL_VERIFICATION_REQUIRED",

    EMAIL_VERIFICATION_FAILED:
      "REGISTRATION_EMAIL_VERIFICATION_FAILED",

    IDENTITY_INITIALIZATION_FAILED:
      "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",

    ROLE_INITIALIZATION_FAILED:
      "REGISTRATION_ROLE_INITIALIZATION_FAILED",

    RECEIPT_CREATION_FAILED:
      "REGISTRATION_RECEIPT_CREATION_FAILED",

    RECEIPT_PERSISTENCE_FAILED:
      "REGISTRATION_RECEIPT_PERSISTENCE_FAILED",

    PROVIDER_FAILURE:
      "REGISTRATION_PROVIDER_FAILURE",

    NETWORK_FAILURE:
      "REGISTRATION_NETWORK_FAILURE",

    RATE_LIMITED:
      "REGISTRATION_RATE_LIMITED",

    REQUEST_CONFLICT:
      "REGISTRATION_REQUEST_CONFLICT",

    REQUEST_CANCELLED:
      "REGISTRATION_REQUEST_CANCELLED",

    SECURITY_REJECTION:
      "REGISTRATION_SECURITY_REJECTION",

    UNKNOWN_ERROR:
      "REGISTRATION_UNKNOWN_ERROR"
  });

  const PUBLIC_MESSAGES = Object.freeze({
    [ERROR_CODES.CONFIGURATION_ERROR]:
      "The governed registration runtime has not been configured.",

    [ERROR_CODES.REGISTRATION_UNAVAILABLE]:
      "Enterprise registration is temporarily unavailable.",

    [ERROR_CODES.INVALID_REQUEST]:
      "The registration request is incomplete or invalid.",

    [ERROR_CODES.INVALID_EMAIL]:
      "Enter a valid email address.",

    [ERROR_CODES.INVALID_ROLE]:
      "Select an approved enterprise role.",

    [ERROR_CODES.INVALID_PASSWORD]:
      "Create a password that satisfies the required security standard.",

    [ERROR_CODES.PASSWORD_MISMATCH]:
      "Password confirmation does not match.",

    [ERROR_CODES.TERMS_REQUIRED]:
      "Accept the Terms of Service to continue.",

    [ERROR_CODES.PRIVACY_REQUIRED]:
      "Acknowledge the Privacy Policy to continue.",

    [ERROR_CODES.DUPLICATE_ACCOUNT]:
      "An enterprise account already exists for this email address.",

    [ERROR_CODES.CREDENTIAL_CREATION_FAILED]:
      "The enterprise account could not be created.",

    [ERROR_CODES.EMAIL_VERIFICATION_REQUIRED]:
      "Verify your email address before signing in.",

    [ERROR_CODES.EMAIL_VERIFICATION_FAILED]:
      "The email verification process could not be completed.",

    [ERROR_CODES.IDENTITY_INITIALIZATION_FAILED]:
      "The enterprise identity could not be initialized.",

    [ERROR_CODES.ROLE_INITIALIZATION_FAILED]:
      "The requested enterprise role could not be initialized.",

    [ERROR_CODES.RECEIPT_CREATION_FAILED]:
      "Registration could not be completed because required evidence was not created.",

    [ERROR_CODES.RECEIPT_PERSISTENCE_FAILED]:
      "Registration could not be completed because required evidence was not preserved.",

    [ERROR_CODES.PROVIDER_FAILURE]:
      "The account provider could not complete the registration request.",

    [ERROR_CODES.NETWORK_FAILURE]:
      "The registration service could not be reached. Check your connection and try again.",

    [ERROR_CODES.RATE_LIMITED]:
      "Too many registration attempts were received. Wait before trying again.",

    [ERROR_CODES.REQUEST_CONFLICT]:
      "This registration request conflicts with an existing enterprise account.",

    [ERROR_CODES.REQUEST_CANCELLED]:
      "The registration request was cancelled.",

    [ERROR_CODES.SECURITY_REJECTION]:
      "The registration request was rejected by enterprise security controls.",

    [ERROR_CODES.UNKNOWN_ERROR]:
      "Enterprise registration could not be completed."
  });

  const RETRYABLE_CODES = Object.freeze([
    ERROR_CODES.REGISTRATION_UNAVAILABLE,
    ERROR_CODES.PROVIDER_FAILURE,
    ERROR_CODES.NETWORK_FAILURE,
    ERROR_CODES.RATE_LIMITED,
    ERROR_CODES.UNKNOWN_ERROR
  ]);

  const SECURITY_CODES = Object.freeze([
    ERROR_CODES.SECURITY_REJECTION,
    ERROR_CODES.INVALID_REQUEST,
    ERROR_CODES.INVALID_ROLE
  ]);

  const KNOWN_CODES = Object.freeze(
    Object.values(ERROR_CODES)
  );

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(
        JSON.stringify(value)
      );
    }
  }

  function freezeClone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    return Object.freeze(
      clone(value)
    );
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function generateCorrelationId() {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
    ) {
      return global.crypto.randomUUID();
    }

    return (
      "registration-error-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  function isKnownCode(code) {
    return KNOWN_CODES.includes(
      cleanString(code)
    );
  }

  function getPublicMessage(code) {
    const normalizedCode =
      isKnownCode(code)
        ? cleanString(code)
        : ERROR_CODES.UNKNOWN_ERROR;

    return (
      PUBLIC_MESSAGES[normalizedCode] ||
      PUBLIC_MESSAGES[
        ERROR_CODES.UNKNOWN_ERROR
      ]
    );
  }

  function isRetryableCode(code) {
    return RETRYABLE_CODES.includes(
      cleanString(code)
    );
  }

  function isSecurityCode(code) {
    return SECURITY_CODES.includes(
      cleanString(code)
    );
  }

  class STATScoreRegistrationError extends Error {
    constructor(options = {}) {
      const requestedCode =
        cleanString(options.code);

      const code =
        isKnownCode(requestedCode)
          ? requestedCode
          : ERROR_CODES.UNKNOWN_ERROR;

      const internalMessage =
        cleanString(options.internal_message) ||
        cleanString(options.message) ||
        getPublicMessage(code);

      super(internalMessage);

      this.name = ERROR_NAME;
      this.code = code;

      this.user_message =
        cleanString(options.user_message) ||
        getPublicMessage(code);

      this.internal_message =
        internalMessage;

      this.authority_id =
        AUTHORITY_ID;

      this.authority_version =
        VERSION;

      this.correlation_id =
        cleanString(options.correlation_id) ||
        generateCorrelationId();

      this.created_at =
        cleanString(options.created_at) ||
        nowISO();

      this.retryable =
        options.retryable !== undefined
          ? Boolean(options.retryable)
          : isRetryableCode(code);

      this.security_related =
        options.security_related !== undefined
          ? Boolean(
              options.security_related
            )
          : isSecurityCode(code);

      this.provider_code =
        cleanString(options.provider_code) ||
        null;

      this.provider_status =
        Number.isFinite(
          Number(options.provider_status)
        )
          ? Number(options.provider_status)
          : null;

      this.operation =
        cleanString(options.operation) ||
        null;

      this.metadata =
        freezeClone(
          options.metadata || {}
        );

      this.cause =
        options.cause || null;

      if (
        Error.captureStackTrace
      ) {
        Error.captureStackTrace(
          this,
          STATScoreRegistrationError
        );
      }
    }

    toPublicObject() {
      return Object.freeze({
        name: this.name,
        code: this.code,
        user_message:
          this.user_message,
        correlation_id:
          this.correlation_id,
        retryable:
          this.retryable,
        created_at:
          this.created_at
      });
    }

    toDiagnosticObject() {
      return Object.freeze({
        name: this.name,
        code: this.code,
        user_message:
          this.user_message,
        internal_message:
          this.internal_message,
        authority_id:
          this.authority_id,
        authority_version:
          this.authority_version,
        correlation_id:
          this.correlation_id,
        created_at:
          this.created_at,
        retryable:
          this.retryable,
        security_related:
          this.security_related,
        provider_code:
          this.provider_code,
        provider_status:
          this.provider_status,
        operation:
          this.operation,
        metadata:
          freezeClone(
            this.metadata
          )
      });
    }
  }

  function createRegistrationError(
    code,
    internalMessage,
    options = {}
  ) {
    return new STATScoreRegistrationError({
      ...options,
      code,
      internal_message:
        cleanString(internalMessage) ||
        getPublicMessage(code)
    });
  }

  function getProviderMessage(error) {
    return cleanString(
      error &&
        (
          error.message ||
          error.error_description ||
          error.msg ||
          error.details
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
    ).toLowerCase();
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
      (fragment) =>
        normalized.includes(
          fragment
        )
    );
  }

  function mapProviderError(error) {
    const providerMessage =
      getProviderMessage(error);

    const providerCode =
      getProviderCode(error);

    const providerStatus =
      getProviderStatus(error);

    const combined =
      [
        providerMessage,
        providerCode
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (
      includesAny(combined, [
        "already registered",
        "already exists",
        "user already",
        "email exists",
        "duplicate"
      ]) ||
      providerStatus === 409
    ) {
      return ERROR_CODES.DUPLICATE_ACCOUNT;
    }

    if (
      includesAny(combined, [
        "invalid email",
        "email address is invalid",
        "malformed email"
      ])
    ) {
      return ERROR_CODES.INVALID_EMAIL;
    }

    if (
      includesAny(combined, [
        "password",
        "weak password",
        "password should",
        "password must"
      ])
    ) {
      return ERROR_CODES.INVALID_PASSWORD;
    }

    if (
      includesAny(combined, [
        "rate limit",
        "too many requests",
        "email rate limit",
        "request rate"
      ]) ||
      providerStatus === 429
    ) {
      return ERROR_CODES.RATE_LIMITED;
    }

    if (
      includesAny(combined, [
        "network",
        "fetch failed",
        "failed to fetch",
        "networkerror",
        "connection"
      ])
    ) {
      return ERROR_CODES.NETWORK_FAILURE;
    }

    if (
      includesAny(combined, [
        "cancel",
        "abort"
      ])
    ) {
      return ERROR_CODES.REQUEST_CANCELLED;
    }

    if (
      includesAny(combined, [
        "forbidden",
        "not allowed",
        "security",
        "unauthorized"
      ]) ||
      providerStatus === 401 ||
      providerStatus === 403
    ) {
      return ERROR_CODES.SECURITY_REJECTION;
    }

    if (
      providerStatus !== null &&
      providerStatus >= 500
    ) {
      return ERROR_CODES.PROVIDER_FAILURE;
    }

    return ERROR_CODES.PROVIDER_FAILURE;
  }

  function normalizeRegistrationError(
    rawError,
    options = {}
  ) {
    if (
      rawError instanceof
      STATScoreRegistrationError
    ) {
      return rawError;
    }

    if (
      rawError &&
      rawError.name ===
        ERROR_NAME &&
      isKnownCode(rawError.code)
    ) {
      return new STATScoreRegistrationError({
        ...rawError,
        ...options,
        cause: rawError
      });
    }

    const explicitCode =
      cleanString(
        options.code
      );

    const code =
      isKnownCode(explicitCode)
        ? explicitCode
        : mapProviderError(
            rawError
          );

    return new STATScoreRegistrationError({
      ...options,

      code,

      internal_message:
        cleanString(
          options.internal_message
        ) ||
        getProviderMessage(
          rawError
        ) ||
        getPublicMessage(code),

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

      cause: rawError
    });
  }

  function assert(
    condition,
    code,
    internalMessage,
    options = {}
  ) {
    if (condition) {
      return true;
    }

    throw createRegistrationError(
      code,
      internalMessage,
      options
    );
  }

  function serializePublicError(
    error
  ) {
    return normalizeRegistrationError(
      error
    ).toPublicObject();
  }

  function serializeDiagnosticError(
    error
  ) {
    return normalizeRegistrationError(
      error
    ).toDiagnosticObject();
  }

  const api = Object.freeze({
    authority_id:
      AUTHORITY_ID,

    version:
      VERSION,

    error_name:
      ERROR_NAME,

    ERROR_CODES,

    PUBLIC_MESSAGES,

    createRegistrationError,

    normalizeRegistrationError,

    getPublicMessage,

    isKnownCode,

    isRetryableCode,

    isSecurityCode,

    assert,

    serializePublicError,

    serializeDiagnosticError,

    RegistrationError:
      STATScoreRegistrationError
  });

  global.STATSCORE_REGISTRATION_ERRORS =
    api;

  global.STATScore =
    global.STATScore || {};

  global.STATScore.RegistrationErrors =
    api;

  global.dispatchEvent(
    new CustomEvent(
      "statscore:registration-errors-ready",
      {
        detail: Object.freeze({
          authority_id:
            AUTHORITY_ID,

          version:
            VERSION,

          ready:
            true
        })
      }
    )
  );

  console.info(
    "[STATS-CORE Registration Errors] Authority ready:",
    VERSION
  );
})(window); 
