/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-registration-context.js

Asset Type:
JavaScript Authority Module / Registration Context Governance

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Account Registration Authority

System Layer:
Public Entry / Registration Context Publication

Primary Consumers:
- statscore-registration-service.js
- statscore-registration-receipts.js
- register.html
- enterprise identity initialization workflow
- authorized diagnostics

Purpose:
Creates, validates, publishes, reads, and clears the governed
Registration Context produced during enterprise account creation.

The Registration Context records the outcome of account
registration before the user returns to the certified Login
Authority.

Consumes:
- registration correlation identifier
- authentication user identifier
- enterprise identity identifier
- requested enterprise role
- normalized email address
- registration status
- email verification status
- provider identity
- registration contract versions
- registration timestamps
- governed entry metadata

Provides:
- immutable Registration Context contract
- Registration Context validation
- controlled context publication
- controlled context retrieval
- controlled context clearing
- registration-context lifecycle events

Primary IDs:
- registration_context_id
- correlation_id
- authentication_user_id
- enterprise_identity_id
- registration_receipt_id

Does NOT:
- create authentication accounts
- authenticate users
- publish Initial Authentication Context
- manufacture Runtime Context
- create authentication sessions
- manufacture role_id
- create athlete_id
- create snapshot_id
- create professional workspaces
- initialize downstream intake
- route users
- write Registration Receipts
- store passwords or credential secrets

Status:
ENGINEERING CHANGE CONTROL — ENTERPRISE REGISTRATION BUILD

==========================================================
*/

(function initializeRegistrationContextAuthority(global) {
  "use strict";

  const AUTHORITY_ID =
    "statscore-registration-context";

  const VERSION =
    "STATSCORE-REGISTRATION-CONTEXT-V1.0.0";

  const CONTRACT_VERSION =
    "STATSCORE-REGISTRATION-CONTRACT-V1.0.0";

  const STORAGE_KEY =
    "statscore_registration_context_v1";

  const SUPPORTED_ROLES = Object.freeze([
    "athlete",
    "parent",
    "coach",
    "counselor",
    "recruiter",
    "evaluator",
    "trainer",
    "program"
  ]);

  const SUPPORTED_STATUSES = Object.freeze([
    "REGISTRATION_CREATED",
    "EMAIL_VERIFICATION_PENDING",
    "EMAIL_VERIFIED",
    "IDENTITY_INITIALIZED",
    "REGISTRATION_COMPLETE",
    "REGISTRATION_FAILED",
    "REGISTRATION_ROLLED_BACK"
  ]);

  const SUPPORTED_VERIFICATION_STATUSES =
    Object.freeze([
      "NOT_REQUIRED",
      "PENDING",
      "VERIFIED",
      "FAILED"
    ]);

  const SUPPORTED_PROVIDERS =
    Object.freeze([
      "supabase",
      "demo_isolated",
      "test_isolated",
      "enterprise_sso",
      "custom"
    ]);

  const REQUIRED_FIELDS =
    Object.freeze([
      "registration_context_id",
      "correlation_id",
      "authentication_user_id",
      "enterprise_identity_id",
      "email",
      "requested_role",
      "registration_status",
      "email_verification_status",
      "registration_source",
      "authentication_provider",
      "registered_at",
      "registration_version",
      "authentication_contract_version"
    ]);

  let ACTIVE_CONTEXT = null;

  function nowISO() {
    return new Date().toISOString();
  }

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function normalizeEmail(value) {
    return cleanString(value).toLowerCase();
  }

  function normalizeRole(value) {
    return cleanString(value).toLowerCase();
  }

  function normalizeStatus(value) {
    return cleanString(value).toUpperCase();
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

    Object.getOwnPropertyNames(value)
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

  function generateId(prefix) {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
    ) {
      return (
        prefix +
        "-" +
        global.crypto.randomUUID()
      );
    }

    return (
      prefix +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 10)
    );
  }

  function getErrorsAuthority() {
    return (
      global.STATSCORE_REGISTRATION_ERRORS ||
      global.STATScore
        ?.RegistrationErrors ||
      null
    );
  }

  function getErrorCodes() {
    const authority =
      getErrorsAuthority();

    return (
      authority &&
      authority.ERROR_CODES
    ) || {};
  }

  function createContextError(
    code,
    internalMessage,
    metadata = {}
  ) {
    const authority =
      getErrorsAuthority();

    if (
      authority &&
      typeof authority
        .createRegistrationError ===
        "function"
    ) {
      return authority
        .createRegistrationError(
          code,
          internalMessage,
          {
            operation:
              "registration_context",
            metadata
          }
        );
    }

    const error =
      new Error(
        internalMessage ||
        "Registration Context failure."
      );

    error.name =
      "STATScoreRegistrationContextError";

    error.code =
      code ||
      "REGISTRATION_CONTEXT_ERROR";

    error.user_message =
      "Enterprise registration could not be completed.";

    return error;
  }

  function assertCondition(
    condition,
    code,
    internalMessage,
    metadata = {}
  ) {
    if (condition) {
      return true;
    }

    throw createContextError(
      code,
      internalMessage,
      metadata
    );
  }

  function isValidISODate(value) {
    const normalized =
      cleanString(value);

    if (!normalized) {
      return false;
    }

    const time =
      Date.parse(normalized);

    return Number.isFinite(time);
  }

  function isValidEmail(value) {
    const email =
      normalizeEmail(value);

    return (
      email.length >= 3 &&
      email.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email)
    );
  }

  function validateRole(role) {
    const normalized =
      normalizeRole(role);

    assertCondition(
      SUPPORTED_ROLES.includes(
        normalized
      ),
      getErrorCodes().INVALID_ROLE ||
        "REGISTRATION_INVALID_ROLE",
      "Registration Context contains an unsupported enterprise role.",
      {
        requested_role:
          normalized || null
      }
    );

    return normalized;
  }

  function validateRegistrationStatus(
    status
  ) {
    const normalized =
      normalizeStatus(status);

    assertCondition(
      SUPPORTED_STATUSES.includes(
        normalized
      ),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context contains an unsupported registration status.",
      {
        registration_status:
          normalized || null
      }
    );

    return normalized;
  }

  function validateVerificationStatus(
    status
  ) {
    const normalized =
      normalizeStatus(status);

    assertCondition(
      SUPPORTED_VERIFICATION_STATUSES
        .includes(normalized),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context contains an unsupported email-verification status.",
      {
        email_verification_status:
          normalized || null
      }
    );

    return normalized;
  }

  function validateProvider(provider) {
    const normalized =
      cleanString(provider)
        .toLowerCase();

    assertCondition(
      SUPPORTED_PROVIDERS.includes(
        normalized
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Context contains an unsupported authentication provider.",
      {
        authentication_provider:
          normalized || null
      }
    );

    return normalized;
  }

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
        "access_token",
        "refresh_token",
        "provider_token",
        "provider_refresh_token",
        "authorization",
        "credential",
        "credentials",
        "secret",
        "session"
      ]);

    const sanitized = {};

    Object.entries(value)
      .forEach(([key, item]) => {
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
          sanitized[key] = item;
          return;
        }

        if (
          Array.isArray(item)
        ) {
          sanitized[key] =
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
          sanitized[key] =
            sanitizeMetadata(item);
        }
      });

    return sanitized;
  }

  function normalizeContextInput(
    input = {}
  ) {
    assertCondition(
      input &&
      typeof input === "object" &&
      !Array.isArray(input),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context input must be an object."
    );

    const registeredAt =
      cleanString(
        input.registered_at
      ) || nowISO();

    const updatedAt =
      cleanString(
        input.updated_at
      ) || registeredAt;

    const email =
      normalizeEmail(
        input.email
      );

    assertCondition(
      isValidEmail(email),
      getErrorCodes().INVALID_EMAIL ||
        "REGISTRATION_INVALID_EMAIL",
      "Registration Context contains an invalid email address."
    );

    const authenticationUserId =
      cleanString(
        input.authentication_user_id
      );

    const enterpriseIdentityId =
      cleanString(
        input.enterprise_identity_id
      );

    assertCondition(
      Boolean(authenticationUserId),
      getErrorCodes()
        .IDENTITY_INITIALIZATION_FAILED ||
        "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",
      "Registration Context requires an authentication_user_id."
    );

    assertCondition(
      Boolean(enterpriseIdentityId),
      getErrorCodes()
        .IDENTITY_INITIALIZATION_FAILED ||
        "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",
      "Registration Context requires an enterprise_identity_id."
    );

    assertCondition(
      isValidISODate(registeredAt),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context registered_at must be a valid timestamp."
    );

    assertCondition(
      isValidISODate(updatedAt),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context updated_at must be a valid timestamp."
    );

    const context = {
      registration_context_id:
        cleanString(
          input.registration_context_id
        ) ||
        generateId(
          "registration-context"
        ),

      correlation_id:
        cleanString(
          input.correlation_id
        ) ||
        generateId(
          "registration-correlation"
        ),

      registration_receipt_id:
        cleanString(
          input.registration_receipt_id
        ) ||
        null,

      authentication_user_id:
        authenticationUserId,

      enterprise_identity_id:
        enterpriseIdentityId,

      email,

      requested_role:
        validateRole(
          input.requested_role
        ),

      registration_status:
        validateRegistrationStatus(
          input.registration_status
        ),

      email_verification_status:
        validateVerificationStatus(
          input.email_verification_status
        ),

      registration_source:
        cleanString(
          input.registration_source
        ) ||
        "register.html",

      requested_destination:
        cleanString(
          input.requested_destination
        ) ||
        "login.html",

      authentication_provider:
        validateProvider(
          input.authentication_provider ||
          "supabase"
        ),

      enterprise_status:
        cleanString(
          input.enterprise_status
        ) ||
        "PENDING_VERIFICATION",

      registered_at:
        registeredAt,

      updated_at:
        updatedAt,

      email_verified_at:
        cleanString(
          input.email_verified_at
        ) ||
        null,

      identity_initialized_at:
        cleanString(
          input.identity_initialized_at
        ) ||
        null,

      completed_at:
        cleanString(
          input.completed_at
        ) ||
        null,

      registration_version:
        cleanString(
          input.registration_version
        ) ||
        VERSION,

      registration_contract_version:
        cleanString(
          input
            .registration_contract_version
        ) ||
        CONTRACT_VERSION,

      authentication_contract_version:
        cleanString(
          input
            .authentication_contract_version
        ) ||
        "STATSCORE-AUTHENTICATION-CONTRACT-V1.0.0",

      agreements:
        immutableClone({
          terms_accepted:
            Boolean(
              input.agreements
                ?.terms_accepted
            ),

          privacy_accepted:
            Boolean(
              input.agreements
                ?.privacy_accepted
            ),

          accepted_at:
            cleanString(
              input.agreements
                ?.accepted_at
            ) ||
            null,

          terms_version:
            cleanString(
              input.agreements
                ?.terms_version
            ) ||
            null,

          privacy_version:
            cleanString(
              input.agreements
                ?.privacy_version
            ) ||
            null
        }),

      entry_metadata:
        immutableClone(
          sanitizeMetadata(
            input.entry_metadata ||
            {}
          )
        )
    };

    return context;
  }

  function validateTemporalFields(
    context
  ) {
    const optionalDateFields = [
      "email_verified_at",
      "identity_initialized_at",
      "completed_at"
    ];

    optionalDateFields.forEach(
      (field) => {
        const value =
          cleanString(
            context[field]
          );

        if (!value) {
          return;
        }

        assertCondition(
          isValidISODate(value),
          getErrorCodes()
            .INVALID_REQUEST ||
            "REGISTRATION_INVALID_REQUEST",
          `Registration Context ${field} must be a valid timestamp.`,
          {
            field,
            value
          }
        );
      }
    );
  }

  function validateAgreementContract(
    context
  ) {
    assertCondition(
      context.agreements &&
      context.agreements
        .terms_accepted === true,
      getErrorCodes().TERMS_REQUIRED ||
        "REGISTRATION_TERMS_REQUIRED",
      "Registration Context requires Terms acceptance."
    );

    assertCondition(
      context.agreements &&
      context.agreements
        .privacy_accepted === true,
      getErrorCodes().PRIVACY_REQUIRED ||
        "REGISTRATION_PRIVACY_REQUIRED",
      "Registration Context requires Privacy Policy acknowledgement."
    );

    assertCondition(
      isValidISODate(
        context.agreements
          .accepted_at
      ),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context requires a valid agreement acceptance timestamp."
    );
  }

  function validateStateConsistency(
    context
  ) {
    const verificationStatus =
      context
        .email_verification_status;

    const registrationStatus =
      context.registration_status;

    if (
      verificationStatus ===
        "VERIFIED"
    ) {
      assertCondition(
        isValidISODate(
          context
            .email_verified_at
        ),
        getErrorCodes()
          .EMAIL_VERIFICATION_FAILED ||
          "REGISTRATION_EMAIL_VERIFICATION_FAILED",
        "Verified Registration Context requires email_verified_at."
      );
    }

    if (
      registrationStatus ===
        "IDENTITY_INITIALIZED" ||
      registrationStatus ===
        "REGISTRATION_COMPLETE"
    ) {
      assertCondition(
        isValidISODate(
          context
            .identity_initialized_at
        ),
        getErrorCodes()
          .IDENTITY_INITIALIZATION_FAILED ||
          "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",
        "Initialized Registration Context requires identity_initialized_at."
      );
    }

    if (
      registrationStatus ===
        "REGISTRATION_COMPLETE"
    ) {
      assertCondition(
        isValidISODate(
          context.completed_at
        ),
        getErrorCodes()
          .INVALID_REQUEST ||
          "REGISTRATION_INVALID_REQUEST",
        "Completed Registration Context requires completed_at."
      );
    }
  }

  function validateRegistrationContext(
    rawContext
  ) {
    const context =
      normalizeContextInput(
        rawContext
      );

    REQUIRED_FIELDS.forEach(
      (field) => {
        assertCondition(
          context[field] !==
            undefined &&
          context[field] !==
            null &&
          cleanString(
            context[field]
          ) !== "",
          getErrorCodes()
            .INVALID_REQUEST ||
            "REGISTRATION_INVALID_REQUEST",
          `Registration Context is missing required field: ${field}.`,
          {
            missing_field:
              field
          }
        );
      }
    );

    validateTemporalFields(
      context
    );

    validateAgreementContract(
      context
    );

    validateStateConsistency(
      context
    );

    return immutableClone(
      context
    );
  }

  function publishEvent(
    eventName,
    context,
    metadata = {}
  ) {
    global.dispatchEvent(
      new CustomEvent(
        `statscore:registration-context-${eventName}`,
        {
          detail:
            immutableClone({
              authority_id:
                AUTHORITY_ID,

              version:
                VERSION,

              context:
                context
                  ? clone(context)
                  : null,

              metadata:
                sanitizeMetadata(
                  metadata
                ),

              published_at:
                nowISO()
            })
        }
      )
    );
  }

  function publishGlobalContext(
    context
  ) {
    const publicContext =
      context
        ? immutableClone(context)
        : null;

    global.STATSCORE_REGISTRATION_CONTEXT =
      publicContext;

    global.STATScore =
      global.STATScore || {};

    global.STATScore
      .RegistrationContext =
      publicContext;

    return publicContext;
  }

  function persistContext(
    context
  ) {
    try {
      global.sessionStorage
        .setItem(
          STORAGE_KEY,
          JSON.stringify(
            context
          )
        );

      return true;
    } catch (error) {
      throw createContextError(
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Context could not be persisted to controlled session storage.",
        {
          storage_key:
            STORAGE_KEY,
          error_message:
            cleanString(
              error?.message
            ) || null
        }
      );
    }
  }

  function removePersistedContext() {
    try {
      global.sessionStorage
        .removeItem(
          STORAGE_KEY
        );

      return true;
    } catch (_) {
      return false;
    }
  }

  function createContext(
    input = {},
    options = {}
  ) {
    const context =
      validateRegistrationContext(
        input
      );

    ACTIVE_CONTEXT =
      context;

    if (
      options.persist !== false
    ) {
      persistContext(
        context
      );
    }

    publishGlobalContext(
      context
    );

    publishEvent(
      "published",
      context,
      {
        persisted:
          options.persist !== false
      }
    );

    return immutableClone(
      context
    );
  }

  function restoreContext(
    options = {}
  ) {
    if (ACTIVE_CONTEXT) {
      return immutableClone(
        ACTIVE_CONTEXT
      );
    }

    let raw = null;

    try {
      raw =
        global.sessionStorage
          .getItem(
            STORAGE_KEY
          );
    } catch (_) {
      raw = null;
    }

    if (!raw) {
      if (
        options.required === true
      ) {
        throw createContextError(
          getErrorCodes()
            .INVALID_REQUEST ||
            "REGISTRATION_INVALID_REQUEST",
          "No persisted Registration Context is available."
        );
      }

      return null;
    }

    let parsed;

    try {
      parsed =
        JSON.parse(raw);
    } catch (error) {
      removePersistedContext();

      throw createContextError(
        getErrorCodes()
          .INVALID_REQUEST ||
          "REGISTRATION_INVALID_REQUEST",
        "Persisted Registration Context is malformed.",
        {
          error_message:
            cleanString(
              error?.message
            ) || null
        }
      );
    }

    const context =
      validateRegistrationContext(
        parsed
      );

    ACTIVE_CONTEXT =
      context;

    publishGlobalContext(
      context
    );

    publishEvent(
      "restored",
      context
    );

    return immutableClone(
      context
    );
  }

  function getContext() {
    if (!ACTIVE_CONTEXT) {
      return null;
    }

    return immutableClone(
      ACTIVE_CONTEXT
    );
  }

  function hasContext() {
    return Boolean(
      ACTIVE_CONTEXT
    );
  }

  function updateContext(
    patch = {},
    options = {}
  ) {
    const current =
      ACTIVE_CONTEXT ||
      restoreContext({
        required:
          true
      });

    assertCondition(
      patch &&
      typeof patch === "object" &&
      !Array.isArray(patch),
      getErrorCodes().INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration Context update patch must be an object."
    );

    const protectedFields =
      new Set([
        "registration_context_id",
        "correlation_id",
        "authentication_user_id",
        "enterprise_identity_id",
        "email",
        "requested_role",
        "registration_source",
        "authentication_provider",
        "registered_at",
        "registration_version",
        "registration_contract_version",
        "authentication_contract_version",
        "agreements"
      ]);

    Object.keys(patch)
      .forEach((field) => {
        assertCondition(
          !protectedFields.has(
            field
          ),
          getErrorCodes()
            .SECURITY_REJECTION ||
            "REGISTRATION_SECURITY_REJECTION",
          `Registration Context field cannot be modified after publication: ${field}.`,
          {
            protected_field:
              field
          }
        );
      });

    const next =
      validateRegistrationContext({
        ...clone(current),
        ...clone(patch),
        updated_at:
          nowISO()
      });

    ACTIVE_CONTEXT =
      next;

    if (
      options.persist !== false
    ) {
      persistContext(
        next
      );
    }

    publishGlobalContext(
      next
    );

    publishEvent(
      "updated",
      next,
      {
        changed_fields:
          Object.keys(patch)
      }
    );

    return immutableClone(
      next
    );
  }

  function attachReceiptId(
    registrationReceiptId,
    options = {}
  ) {
    const receiptId =
      cleanString(
        registrationReceiptId
      );

    assertCondition(
      Boolean(receiptId),
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Registration Receipt identifier is required."
    );

    const current =
      ACTIVE_CONTEXT ||
      restoreContext({
        required:
          true
      });

    const next =
      validateRegistrationContext({
        ...clone(current),

        registration_receipt_id:
          receiptId,

        updated_at:
          nowISO()
      });

    ACTIVE_CONTEXT =
      next;

    if (
      options.persist !== false
    ) {
      persistContext(
        next
      );
    }

    publishGlobalContext(
      next
    );

    publishEvent(
      "receipt-attached",
      next,
      {
        registration_receipt_id:
          receiptId
      }
    );

    return immutableClone(
      next
    );
  }

  function markEmailVerified(
    verifiedAt = nowISO(),
    options = {}
  ) {
    return updateContext(
      {
        email_verification_status:
          "VERIFIED",

        email_verified_at:
          verifiedAt,

        registration_status:
          options
            .registration_status ||
          "EMAIL_VERIFIED",

        enterprise_status:
          options
            .enterprise_status ||
          "EMAIL_VERIFIED"
      },
      options
    );
  }

  function markIdentityInitialized(
    initializedAt = nowISO(),
    options = {}
  ) {
    return updateContext(
      {
        identity_initialized_at:
          initializedAt,

        registration_status:
          options
            .registration_status ||
          "IDENTITY_INITIALIZED",

        enterprise_status:
          options
            .enterprise_status ||
          "ACTIVE_PENDING_LOGIN"
      },
      options
    );
  }

  function markRegistrationComplete(
    completedAt = nowISO(),
    options = {}
  ) {
    const current =
      ACTIVE_CONTEXT ||
      restoreContext({
        required:
          true
      });

    const identityInitializedAt =
      cleanString(
        current
          .identity_initialized_at
      ) || completedAt;

    return updateContext(
      {
        identity_initialized_at:
          identityInitializedAt,

        registration_status:
          "REGISTRATION_COMPLETE",

        enterprise_status:
          options
            .enterprise_status ||
          "ACTIVE_PENDING_LOGIN",

        completed_at:
          completedAt
      },
      options
    );
  }

  function markRegistrationFailed(
    failureMetadata = {},
    options = {}
  ) {
    return updateContext(
      {
        registration_status:
          "REGISTRATION_FAILED",

        enterprise_status:
          "REGISTRATION_FAILED",

        entry_metadata:
          immutableClone(
            sanitizeMetadata({
              ...clone(
                ACTIVE_CONTEXT
                  ?.entry_metadata ||
                {}
              ),

              failure:
                sanitizeMetadata(
                  failureMetadata
                )
            })
          )
      },
      options
    );
  }

  function clearContext(
    options = {}
  ) {
    const previous =
      ACTIVE_CONTEXT
        ? immutableClone(
            ACTIVE_CONTEXT
          )
        : null;

    ACTIVE_CONTEXT =
      null;

    removePersistedContext();

    publishGlobalContext(
      null
    );

    publishEvent(
      "cleared",
      previous,
      {
        reason:
          cleanString(
            options.reason
          ) ||
          "CONTROLLED_CLEAR"
      }
    );

    return Object.freeze({
      cleared:
        true,

      previous_context_id:
        previous
          ?.registration_context_id ||
        null,

      cleared_at:
        nowISO()
    });
  }

  function getPublicContext() {
    const context =
      getContext();

    if (!context) {
      return null;
    }

    return immutableClone({
      registration_context_id:
        context
          .registration_context_id,

      correlation_id:
        context.correlation_id,

      registration_receipt_id:
        context
          .registration_receipt_id,

      requested_role:
        context.requested_role,

      registration_status:
        context
          .registration_status,

      email_verification_status:
        context
          .email_verification_status,

      enterprise_status:
        context.enterprise_status,

      requested_destination:
        context
          .requested_destination,

      registered_at:
        context.registered_at,

      updated_at:
        context.updated_at,

      completed_at:
        context.completed_at,

      registration_version:
        context
          .registration_version,

      registration_contract_version:
        context
          .registration_contract_version
    });
  }

  function getConfiguration() {
    return immutableClone({
      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      contract_version:
        CONTRACT_VERSION,

      storage_key:
        STORAGE_KEY,

      supported_roles:
        SUPPORTED_ROLES,

      supported_statuses:
        SUPPORTED_STATUSES,

      supported_verification_statuses:
        SUPPORTED_VERIFICATION_STATUSES,

      supported_providers:
        SUPPORTED_PROVIDERS,

      required_fields:
        REQUIRED_FIELDS,

      context_active:
        Boolean(
          ACTIVE_CONTEXT
        ),

      active_context_id:
        ACTIVE_CONTEXT
          ?.registration_context_id ||
        null
    });
  }

  function runHealthCheck() {
    let valid = true;
    let validationError = null;

    if (ACTIVE_CONTEXT) {
      try {
        validateRegistrationContext(
          ACTIVE_CONTEXT
        );
      } catch (error) {
        valid = false;

        validationError =
          cleanString(
            error?.code
          ) ||
          cleanString(
            error?.message
          ) ||
          "UNKNOWN_CONTEXT_ERROR";
      }
    }

    return immutableClone({
      ok:
        valid,

      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      contract_version:
        CONTRACT_VERSION,

      context_active:
        Boolean(
          ACTIVE_CONTEXT
        ),

      active_context_id:
        ACTIVE_CONTEXT
          ?.registration_context_id ||
        null,

      validation_error:
        validationError,

      checked_at:
        nowISO()
    });
  }

  const api = Object.freeze({
    authority_id:
      AUTHORITY_ID,

    version:
      VERSION,

    contract_version:
      CONTRACT_VERSION,

    SUPPORTED_ROLES,

    SUPPORTED_STATUSES,

    SUPPORTED_VERIFICATION_STATUSES,

    SUPPORTED_PROVIDERS,

    REQUIRED_FIELDS,

    createContext,

    restoreContext,

    validateRegistrationContext,

    updateContext,

    attachReceiptId,

    markEmailVerified,

    markIdentityInitialized,

    markRegistrationComplete,

    markRegistrationFailed,

    getContext,

    getPublicContext,

    hasContext,

    clearContext,

    getConfiguration,

    runHealthCheck
  });

  global.STATSCORE_REGISTRATION_CONTEXT_AUTHORITY =
    api;

  global.STATScore =
    global.STATScore || {};

  global.STATScore
    .RegistrationContextAuthority =
    api;

  publishGlobalContext(
    null
  );

  global.dispatchEvent(
    new CustomEvent(
      "statscore:registration-context-authority-ready",
      {
        detail:
          immutableClone({
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            contract_version:
              CONTRACT_VERSION,

            ready:
              true
          })
      }
    )
  );

  console.info(
    "[STATS-CORE Registration Context] Authority ready:",
    VERSION
  );
})(window); 
