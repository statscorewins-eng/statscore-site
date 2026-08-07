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
- statscore-registration-bootstrap.js
- authorized diagnostics

Purpose:
Establishes the governed registration error vocabulary,
normalizes provider and infrastructure failures, protects
internal implementation details, and publishes safe
presentation messages for STATS-CORE account registration.

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
- controlled public registration messages
- diagnostic metadata for authorized consumers
- account-enumeration protection at the public boundary

Public Presentation Doctrine:
Error codes describe what happened internally.

Public messages tell the user what action to take next.

The public presentation layer shall not expose:
- whether an email address is already registered
- raw Supabase/provider error text
- internal infrastructure terminology
- database conditions
- authentication-provider implementation details
- receipt infrastructure details
- configuration internals
- security-control implementation details

Duplicate-account conditions may be identified internally but
shall be projected to the public through neutral next-step
language.

Caller-Manufactured Public Messaging:
PROHIBITED.

Downstream callers may provide internal diagnostic information,
but the Registration Error Authority exclusively determines
the public user_message associated with a governed error code.

Does NOT:
- create authentication accounts
- authenticate users
- initialize enterprise identity
- publish Registration Context
- write Registration Receipts
- initialize Runtime Context
- route users
- expose raw provider errors to public presentation
- expose account existence to unauthenticated users
- create athlete records
- create professional workspaces
- allow callers to override governed public messages

Status:
CONTROLLED REPLACEMENT — REGISTRATION ERROR HARDENING

Version:
STATSCORE-REGISTRATION-ERRORS-V1.1.0

==========================================================
*/

(function initializeRegistrationErrorAuthority(global) {
  "use strict";

  const AUTHORITY_ID =
    "statscore-registration-errors";

  const VERSION =
    "STATSCORE-REGISTRATION-ERRORS-V1.1.0";

  const ERROR_NAME =
    "STATScoreRegistrationError";

  /*
  ==========================================================
  GOVERNED ERROR CODES
  ==========================================================

  These codes are internal constitutional vocabulary.

  They may be consumed by:
  - Registration Service
  - Registration Receipt Authority
  - diagnostics
  - authorized runtime consumers

  They shall not be interpreted as public presentation text.
  ==========================================================
  */

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

  /*
  ==========================================================
  GOVERNED PUBLIC MESSAGES
  ==========================================================

  These messages are the sole approved public projection of
  registration errors.

  Callers cannot override these messages.

  Duplicate-account and conflict messages are intentionally
  neutral so that unauthenticated users cannot determine
  whether a specific email address already has an account.
  ==========================================================
  */

  const PUBLIC_MESSAGES = Object.freeze({
    [ERROR_CODES.CONFIGURATION_ERROR]:
      "Account registration is temporarily unavailable. Please try again later.",

    [ERROR_CODES.REGISTRATION_UNAVAILABLE]:
      "Account registration is temporarily unavailable. Please try again later.",

    [ERROR_CODES.INVALID_REQUEST]:
      "Check the information you entered and try again.",

    [ERROR_CODES.INVALID_EMAIL]:
      "Enter a valid email address.",

    [ERROR_CODES.INVALID_ROLE]:
      "Select your STATS-CORE role.",

    [ERROR_CODES.INVALID_PASSWORD]:
      "Create a password that meets the password requirements.",

    [ERROR_CODES.PASSWORD_MISMATCH]:
      "The passwords do not match.",

    [ERROR_CODES.TERMS_REQUIRED]:
      "Accept the Terms of Service to continue.",

    [ERROR_CODES.PRIVACY_REQUIRED]:
      "Acknowledge the Privacy Policy to continue.",

    [ERROR_CODES.DUPLICATE_ACCOUNT]:
      "If you have used STATS-CORE before, return to System Login. If this is a new registration, check your email for the next step.",

    [ERROR_CODES.CREDENTIAL_CREATION_FAILED]:
      "We could not complete your account request. Please try again.",

    [ERROR_CODES.EMAIL_VERIFICATION_REQUIRED]:
      "Check your email to verify your address before signing in.",

    [ERROR_CODES.EMAIL_VERIFICATION_FAILED]:
      "We could not verify your email. Please try again.",

    [ERROR_CODES.IDENTITY_INITIALIZATION_FAILED]:
      "We could not finish setting up your account. Please try again.",

    [ERROR_CODES.ROLE_INITIALIZATION_FAILED]:
      "We could not finish setting up your STATS-CORE access. Please try again.",

    [ERROR_CODES.RECEIPT_CREATION_FAILED]:
      "We could not complete your account request. Please try again later.",

    [ERROR_CODES.RECEIPT_PERSISTENCE_FAILED]:
      "We could not complete your account request. Please try again later.",

    [ERROR_CODES.PROVIDER_FAILURE]:
      "Account registration is temporarily unavailable. Please try again later.",

    [ERROR_CODES.NETWORK_FAILURE]:
      "We could not connect. Check your internet connection and try again.",

    [ERROR_CODES.RATE_LIMITED]:
      "Too many attempts were made. Wait a few minutes and try again.",

    [ERROR_CODES.REQUEST_CONFLICT]:
      "We could not complete this account request. If you have used STATS-CORE before, return to System Login.",

    [ERROR_CODES.REQUEST_CANCELLED]:
      "The account request was cancelled.",

    [ERROR_CODES.SECURITY_REJECTION]:
      "We could not complete this account request.",

    [ERROR_CODES.UNKNOWN_ERROR]:
      "We could not complete your account request. Please try again."
  });

  /*
  ==========================================================
  RETRY AND SECURITY CLASSIFICATION
  ==========================================================
  */

  const RETRYABLE_CODES = Object.freeze([
    ERROR_CODES.CONFIGURATION_ERROR,
    ERROR_CODES.REGISTRATION_UNAVAILABLE,
    ERROR_CODES.CREDENTIAL_CREATION_FAILED,
    ERROR_CODES.EMAIL_VERIFICATION_FAILED,
    ERROR_CODES.IDENTITY_INITIALIZATION_FAILED,
    ERROR_CODES.ROLE_INITIALIZATION_FAILED,
    ERROR_CODES.RECEIPT_CREATION_FAILED,
    ERROR_CODES.RECEIPT_PERSISTENCE_FAILED,
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
    Object.values(
      ERROR_CODES
    )
  );

  /*
  ==========================================================
  BASIC UTILITIES
  ==========================================================
  */

  function cleanString(value) {
    return typeof value ===
      "string"
      ? value.trim()
      : "";
  }

  function clone(value) {
    if (
      value ===
      undefined
    ) {
      return undefined;
    }

    try {
      return structuredClone(
        value
      );
    } catch (_) {
      return JSON.parse(
        JSON.stringify(
          value
        )
      );
    }
  }

  function deepFreeze(value) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Object.isFrozen(
        value
      )
    ) {
      return value;
    }

    Object
      .getOwnPropertyNames(
        value
      )
      .forEach(
        (propertyName) => {
          deepFreeze(
            value[
              propertyName
            ]
          );
        }
      );

    return Object.freeze(
      value
    );
  }

  function freezeClone(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return value;
    }

    return deepFreeze(
      clone(
        value
      )
    );
  }

  function nowISO() {
    return new Date()
      .toISOString();
  }

  function generateCorrelationId() {
    if (
      global.crypto &&
      typeof global.crypto
        .randomUUID ===
        "function"
    ) {
      return global.crypto
        .randomUUID();
    }

    return (
      "registration-error-" +
      Date.now()
        .toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  /*
  ==========================================================
  CODE CONTROL
  ==========================================================
  */

  function isKnownCode(
    code
  ) {
    return KNOWN_CODES
      .includes(
        cleanString(
          code
        )
      );
  }

  function normalizeCode(
    code
  ) {
    const normalized =
      cleanString(
        code
      );

    return isKnownCode(
      normalized
    )
      ? normalized
      : ERROR_CODES
        .UNKNOWN_ERROR;
  }

  function getPublicMessage(
    code
  ) {
    const normalizedCode =
      normalizeCode(
        code
      );

    return (
      PUBLIC_MESSAGES[
        normalizedCode
      ] ||
      PUBLIC_MESSAGES[
        ERROR_CODES
          .UNKNOWN_ERROR
      ]
    );
  }

  function isRetryableCode(
    code
  ) {
    return RETRYABLE_CODES
      .includes(
        normalizeCode(
          code
        )
      );
  }

  function isSecurityCode(
    code
  ) {
    return SECURITY_CODES
      .includes(
        normalizeCode(
          code
        )
      );
  }

  /*
  ==========================================================
  METADATA SANITIZATION
  ==========================================================

  Metadata is diagnostic only.

  Sensitive values must not be preserved inside governed
  registration error objects.
  ==========================================================
  */

  function sanitizeMetadata(
    value
  ) {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(
        value
      )
    ) {
      return {};
    }

    const blockedKeys =
      new Set([
        "password",
        "confirm_password",
        "confirmpassword",
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
        "api_key",
        "apikey",
        "service_role",
        "service_role_key"
      ]);

    const output = {};

    Object
      .entries(
        value
      )
      .forEach(
        ([key, item]) => {
          const normalizedKey =
            cleanString(
              key
            )
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
            typeof item ===
              "string" ||
            typeof item ===
              "number" ||
            typeof item ===
              "boolean" ||
            item === null
          ) {
            output[key] =
              item;

            return;
          }

          if (
            Array.isArray(
              item
            )
          ) {
            output[key] =
              item
                .slice(
                  0,
                  25
                )
                .map(
                  (entry) => {
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
                  }
                );

            return;
          }

          if (
            typeof item ===
              "object"
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
  GOVERNED ERROR CLASS
  ==========================================================
  */

  class STATScoreRegistrationError
    extends Error {

    constructor(
      options = {}
    ) {
      const code =
        normalizeCode(
          options.code
        );

      const internalMessage =
        cleanString(
          options
            .internal_message
        ) ||
        cleanString(
          options.message
        ) ||
        getPublicMessage(
          code
        );

      super(
        internalMessage
      );

      this.name =
        ERROR_NAME;

      this.code =
        code;

      /*
      ======================================================
      PUBLIC MESSAGE AUTHORITY
      ======================================================

      user_message is NOT caller-controlled.

      The public message is always derived exclusively from
      the governed error code.

      This prevents downstream services, provider adapters,
      and presentation code from exposing raw infrastructure
      messages or account-existence information.
      ======================================================
      */

      this.user_message =
        getPublicMessage(
          code
        );

      this.internal_message =
        internalMessage;

      this.authority_id =
        AUTHORITY_ID;

      this.authority_version =
        VERSION;

      this.correlation_id =
        cleanString(
          options
            .correlation_id
        ) ||
        generateCorrelationId();

      this.created_at =
        cleanString(
          options.created_at
        ) ||
        nowISO();

      this.retryable =
        options.retryable !==
          undefined
          ? Boolean(
              options.retryable
            )
          : isRetryableCode(
              code
            );

      this.security_related =
        options
          .security_related !==
          undefined
          ? Boolean(
              options
                .security_related
            )
          : isSecurityCode(
              code
            );

      this.provider_code =
        cleanString(
          options
            .provider_code
        ) ||
        null;

      this.provider_status =
        Number.isFinite(
          Number(
            options
              .provider_status
          )
        )
          ? Number(
              options
                .provider_status
            )
          : null;

      this.operation =
        cleanString(
          options.operation
        ) ||
        null;

      this.metadata =
        freezeClone(
          sanitizeMetadata(
            options.metadata ||
            {}
          )
        );

      this.cause =
        options.cause ||
        null;

      if (
        Error
          .captureStackTrace
      ) {
        Error
          .captureStackTrace(
            this,
            STATScoreRegistrationError
          );
      }
    }

    toPublicObject() {
      return deepFreeze({
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

        created_at:
          this.created_at
      });
    }

    toDiagnosticObject() {
      return deepFreeze({
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

  /*
  ==========================================================
  ERROR MANUFACTURING
  ==========================================================
  */

  function createRegistrationError(
    code,
    internalMessage,
    options = {}
  ) {
    return new STATScoreRegistrationError({
      ...options,

      code:
        normalizeCode(
          code
        ),

      internal_message:
        cleanString(
          internalMessage
        ) ||
        getPublicMessage(
          code
        )
    });
  }

  /*
  ==========================================================
  PROVIDER ERROR INSPECTION
  ==========================================================
  */

  function getProviderMessage(
    error
  ) {
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

  function getProviderCode(
    error
  ) {
    return cleanString(
      error &&
      (
        error.code ||
        error.error_code ||
        error.name
      )
    )
      .toLowerCase();
  }

  function getProviderStatus(
    error
  ) {
    const status =
      error &&
      (
        error.status ||
        error.statusCode ||
        error.status_code
      );

    return Number
      .isFinite(
        Number(
          status
        )
      )
      ? Number(
          status
        )
      : null;
  }

  function includesAny(
    source,
    fragments
  ) {
    const normalized =
      cleanString(
        source
      )
        .toLowerCase();

    return fragments
      .some(
        (fragment) =>
          normalized
            .includes(
              fragment
            )
      );
  }

  /*
  ==========================================================
  PROVIDER ERROR MAPPING
  ==========================================================

  Provider errors are mapped into governed internal error codes.

  Raw provider messages are not exposed through user_message.

  Duplicate-account detection remains intentionally available
  internally for diagnostics and receipts while its public
  presentation remains neutral.
  ==========================================================
  */

  function mapProviderError(
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
        .filter(
          Boolean
        )
        .join(
          " "
        )
        .toLowerCase();

    /*
    --------------------------------------------------------
    DUPLICATE / EXISTING ACCOUNT
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "already registered",
          "already exists",
          "user already",
          "email exists",
          "duplicate",
          "user_already_exists",
          "email already",
          "already been registered"
        ]
      ) ||
      providerStatus ===
        409
    ) {
      return ERROR_CODES
        .DUPLICATE_ACCOUNT;
    }

    /*
    --------------------------------------------------------
    INVALID EMAIL
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "invalid email",
          "email address is invalid",
          "malformed email",
          "email is invalid"
        ]
      )
    ) {
      return ERROR_CODES
        .INVALID_EMAIL;
    }

    /*
    --------------------------------------------------------
    PASSWORD POLICY
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "weak password",
          "password should",
          "password must",
          "password is too short",
          "password strength",
          "password requirements"
        ]
      )
    ) {
      return ERROR_CODES
        .INVALID_PASSWORD;
    }

    /*
    --------------------------------------------------------
    RATE LIMIT
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "rate limit",
          "too many requests",
          "email rate limit",
          "request rate",
          "rate_limit",
          "over_email_send_rate_limit"
        ]
      ) ||
      providerStatus ===
        429
    ) {
      return ERROR_CODES
        .RATE_LIMITED;
    }

    /*
    --------------------------------------------------------
    NETWORK
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "network",
          "fetch failed",
          "failed to fetch",
          "networkerror",
          "connection",
          "connection refused",
          "connection reset",
          "timeout",
          "timed out"
        ]
      )
    ) {
      return ERROR_CODES
        .NETWORK_FAILURE;
    }

    /*
    --------------------------------------------------------
    REQUEST CANCELLATION
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "cancel",
          "cancelled",
          "canceled",
          "abort",
          "aborted"
        ]
      )
    ) {
      return ERROR_CODES
        .REQUEST_CANCELLED;
    }

    /*
    --------------------------------------------------------
    SECURITY REJECTION
    --------------------------------------------------------
    */

    if (
      includesAny(
        combined,
        [
          "forbidden",
          "not allowed",
          "security",
          "unauthorized",
          "permission denied",
          "access denied"
        ]
      ) ||
      providerStatus ===
        401 ||
      providerStatus ===
        403
    ) {
      return ERROR_CODES
        .SECURITY_REJECTION;
    }

    /*
    --------------------------------------------------------
    PROVIDER / INFRASTRUCTURE FAILURE
    --------------------------------------------------------
    */

    if (
      providerStatus !==
        null &&
      providerStatus >=
        500
    ) {
      return ERROR_CODES
        .PROVIDER_FAILURE;
    }

    return ERROR_CODES
      .PROVIDER_FAILURE;
  }

  /*
  ==========================================================
  ERROR NORMALIZATION
  ==========================================================
  */

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
      isKnownCode(
        rawError.code
      )
    ) {
      return new STATScoreRegistrationError({
        ...rawError,
        ...options,

        /*
        user_message from rawError or options is intentionally
        ignored by the constructor.
        */

        cause:
          rawError
      });
    }

    const explicitCode =
      cleanString(
        options.code
      );

    const code =
      isKnownCode(
        explicitCode
      )
        ? explicitCode
        : mapProviderError(
            rawError
          );

    return new STATScoreRegistrationError({
      ...options,

      code,

      internal_message:
        cleanString(
          options
            .internal_message
        ) ||
        getProviderMessage(
          rawError
        ) ||
        getPublicMessage(
          code
        ),

      provider_code:
        cleanString(
          options
            .provider_code
        ) ||
        getProviderCode(
          rawError
        ) ||
        null,

      provider_status:
        options
          .provider_status !==
          undefined
          ? options
            .provider_status
          : getProviderStatus(
              rawError
            ),

      metadata:
        sanitizeMetadata(
          options.metadata ||
          {}
        ),

      cause:
        rawError
    });
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
    if (
      condition
    ) {
      return true;
    }

    throw createRegistrationError(
      code,
      internalMessage,
      options
    );
  }

  /*
  ==========================================================
  SERIALIZATION
  ==========================================================
  */

  function serializePublicError(
    error
  ) {
    return normalizeRegistrationError(
      error
    )
      .toPublicObject();
  }

  function serializeDiagnosticError(
    error
  ) {
    return normalizeRegistrationError(
      error
    )
      .toDiagnosticObject();
  }

  /*
  ==========================================================
  HEALTH CHECK
  ==========================================================
  */

  function runHealthCheck() {
    const findings = [];

    const knownCodes =
      Object.values(
        ERROR_CODES
      );

    knownCodes
      .forEach(
        (code) => {
          if (
            !cleanString(
              PUBLIC_MESSAGES[
                code
              ]
            )
          ) {
            findings.push(
              "PUBLIC_MESSAGE_MISSING:" +
              code
            );
          }
        }
      );

    if (
      PUBLIC_MESSAGES[
        ERROR_CODES
          .DUPLICATE_ACCOUNT
      ]
        .toLowerCase()
        .includes(
          "already exists"
        ) ||
      PUBLIC_MESSAGES[
        ERROR_CODES
          .DUPLICATE_ACCOUNT
      ]
        .toLowerCase()
        .includes(
          "already registered"
        )
    ) {
      findings.push(
        "DUPLICATE_ACCOUNT_PUBLIC_DISCLOSURE_RISK"
      );
    }

    if (
      PUBLIC_MESSAGES[
        ERROR_CODES
          .REQUEST_CONFLICT
      ]
        .toLowerCase()
        .includes(
          "existing enterprise account"
        )
    ) {
      findings.push(
        "REQUEST_CONFLICT_PUBLIC_DISCLOSURE_RISK"
      );
    }

    return deepFreeze({
      ok:
        findings.length ===
        0,

      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      governed_error_code_count:
        knownCodes.length,

      public_message_count:
        Object.keys(
          PUBLIC_MESSAGES
        ).length,

      duplicate_account_public_message:
        PUBLIC_MESSAGES[
          ERROR_CODES
            .DUPLICATE_ACCOUNT
        ],

      caller_public_message_override_allowed:
        false,

      metadata_deep_freeze:
        true,

      account_enumeration_protection:
        true,

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

      error_name:
        ERROR_NAME,

      ERROR_CODES,

      PUBLIC_MESSAGES,

      createRegistrationError,

      normalizeRegistrationError,

      mapProviderError,

      getPublicMessage,

      isKnownCode,

      isRetryableCode,

      isSecurityCode,

      assert,

      serializePublicError,

      serializeDiagnosticError,

      runHealthCheck,

      RegistrationError:
        STATScoreRegistrationError
    });

  global.STATSCORE_REGISTRATION_ERRORS =
    api;

  global.STATScore =
    global.STATScore ||
    {};

  global.STATScore
    .RegistrationErrors =
    api;

  /*
  ==========================================================
  READINESS PUBLICATION
  ==========================================================
  */

  global.dispatchEvent(
    new CustomEvent(
      "statscore:registration-errors-ready",
      {
        detail:
          deepFreeze({
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            ready:
              true,

            caller_public_message_override_allowed:
              false,

            account_enumeration_protection:
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
