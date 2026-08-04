/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-registration-receipts.js

Asset Type:
JavaScript Authority Module / Registration Receipt Governance

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Account Registration Authority

System Layer:
Public Entry / Registration Evidence Governance

Primary Consumers:
- statscore-registration-service.js
- statscore-registration-context.js
- authorized audit and diagnostics consumers
- Office of the Chief Systems Engineer
- Master Integration Stream evidence packages

Purpose:
Creates, validates, persists, retrieves, and publishes
immutable Enterprise Registration Receipts.

Each receipt constitutes governed operational evidence that
an enterprise registration event occurred.

Consumes:
- Registration Context
- registration outcome
- authentication user identifier
- enterprise identity identifier
- requested enterprise role
- email-verification state
- provider metadata
- registration contract versions
- authorized persistence configuration

Provides:
- immutable Enterprise Registration Receipts
- governed receipt validation
- receipt persistence through approved RPC or adapter
- receipt retrieval
- correlation to Registration Context
- audit-safe receipt publication
- receipt lifecycle diagnostics

Primary IDs:
- registration_receipt_id
- registration_context_id
- correlation_id
- authentication_user_id
- enterprise_identity_id

Does NOT:
- create authentication accounts
- authenticate users
- initialize enterprise identity
- create athlete source records
- create professional workspaces
- publish Initial Authentication Context
- manufacture Runtime Context
- route users
- modify previously issued receipts
- store passwords, tokens, secrets, or credentials
- treat mutable browser events as enterprise receipts

Status:
ENGINEERING CHANGE CONTROL — ENTERPRISE REGISTRATION BUILD

==========================================================
*/

(function initializeRegistrationReceiptAuthority(global) {
  "use strict";

  const AUTHORITY_ID =
    "statscore-registration-receipts";

  const VERSION =
    "STATSCORE-REGISTRATION-RECEIPTS-V1.0.0";

  const RECEIPT_CONTRACT_VERSION =
    "STATSCORE-REGISTRATION-RECEIPT-CONTRACT-V1.0.0";

  const DEFAULT_RECEIPT_RPC =
    "record_statscore_registration_receipt";

  const RECEIPT_TYPES = Object.freeze({
    REGISTRATION_SUCCEEDED:
      "REGISTRATION_SUCCEEDED",

    REGISTRATION_FAILED:
      "REGISTRATION_FAILED",

    REGISTRATION_ROLLED_BACK:
      "REGISTRATION_ROLLED_BACK",

    EMAIL_VERIFICATION_PENDING:
      "EMAIL_VERIFICATION_PENDING",

    EMAIL_VERIFIED:
      "EMAIL_VERIFIED",

    IDENTITY_INITIALIZED:
      "IDENTITY_INITIALIZED"
  });

  const RECEIPT_STATUSES = Object.freeze({
    ISSUED:
      "ISSUED",

    PERSISTED:
      "PERSISTED",

    PERSISTENCE_FAILED:
      "PERSISTENCE_FAILED"
  });

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

  const REQUIRED_FIELDS = Object.freeze([
    "registration_receipt_id",
    "receipt_type",
    "receipt_status",
    "registration_context_id",
    "correlation_id",
    "authentication_user_id",
    "enterprise_identity_id",
    "email",
    "requested_role",
    "registration_status",
    "email_verification_status",
    "authentication_provider",
    "issued_at",
    "registration_version",
    "registration_contract_version",
    "authentication_contract_version",
    "receipt_contract_version",
    "constitutional_owner"
  ]);

  const SENSITIVE_KEYS = new Set([
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
    "session",
    "session_data",
    "raw_provider_response"
  ]);

  const STATE = {
    configured: false,

    client: null,

    receiptRpc:
      DEFAULT_RECEIPT_RPC,

    persistenceAdapter: null,

    environment:
      "unconfigured",

    registrationVersion:
      "STATSCORE-REGISTRATION-V1.0.0",

    authenticationContractVersion:
      "STATSCORE-AUTHENTICATION-CONTRACT-V1.0.0",

    issuedReceipts:
      new Map(),

    receiptOrder: [],

    configurationLocked: false
  };

  function nowISO() {
    return new Date().toISOString();
  }

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function normalizeEmail(value) {
    return cleanString(value)
      .toLowerCase();
  }

  function normalizeRole(value) {
    return cleanString(value)
      .toLowerCase();
  }

  function normalizeUpper(value) {
    return cleanString(value)
      .toUpperCase();
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
        deepFreeze(
          value[property]
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

  function isValidISODate(value) {
    const normalized =
      cleanString(value);

    if (!normalized) {
      return false;
    }

    return Number.isFinite(
      Date.parse(normalized)
    );
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

  function sanitizeMetadata(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      return {};
    }

    const sanitized = {};

    Object.entries(value)
      .forEach(([key, item]) => {
        const normalizedKey =
          cleanString(key)
            .toLowerCase();

        if (
          !normalizedKey ||
          SENSITIVE_KEYS.has(
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
                  typeof entry === "string" ||
                  typeof entry === "number" ||
                  typeof entry === "boolean" ||
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

  function getErrorsAuthority() {
    return (
      global.STATSCORE_REGISTRATION_ERRORS ||
      global.STATScore
        ?.RegistrationErrors ||
      null
    );
  }

  function getErrorCodes() {
    return (
      getErrorsAuthority()
        ?.ERROR_CODES ||
      {}
    );
  }

  function createReceiptError(
    code,
    internalMessage,
    metadata = {},
    cause = null
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
              "registration_receipts",

            metadata:
              sanitizeMetadata(
                metadata
              ),

            cause
          }
        );
    }

    const error =
      new Error(
        internalMessage ||
        "Registration Receipt failure."
      );

    error.name =
      "STATScoreRegistrationReceiptError";

    error.code =
      code ||
      "REGISTRATION_RECEIPT_ERROR";

    error.user_message =
      "Registration could not be completed because required evidence was not preserved.";

    error.metadata =
      sanitizeMetadata(
        metadata
      );

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

    throw createReceiptError(
      code,
      internalMessage,
      metadata
    );
  }

  function getContextAuthority() {
    return (
      global
        .STATSCORE_REGISTRATION_CONTEXT_AUTHORITY ||
      global.STATScore
        ?.RegistrationContextAuthority ||
      null
    );
  }

  function resolveContext(
    suppliedContext
  ) {
    if (
      suppliedContext &&
      typeof suppliedContext ===
        "object"
    ) {
      return clone(
        suppliedContext
      );
    }

    const authority =
      getContextAuthority();

    if (
      authority &&
      typeof authority.getContext ===
        "function"
    ) {
      return authority.getContext();
    }

    return null;
  }

  function validateReceiptType(
    value
  ) {
    const normalized =
      normalizeUpper(value);

    assertCondition(
      Object.values(
        RECEIPT_TYPES
      ).includes(normalized),
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Unsupported Enterprise Registration Receipt type.",
      {
        receipt_type:
          normalized || null
      }
    );

    return normalized;
  }

  function validateReceiptStatus(
    value
  ) {
    const normalized =
      normalizeUpper(value);

    assertCondition(
      Object.values(
        RECEIPT_STATUSES
      ).includes(normalized),
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Unsupported Enterprise Registration Receipt status.",
      {
        receipt_status:
          normalized || null
      }
    );

    return normalized;
  }

  function normalizeReceiptInput(
    input = {}
  ) {
    assertCondition(
      input &&
      typeof input === "object" &&
      !Array.isArray(input),
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Registration Receipt input must be an object."
    );

    const context =
      resolveContext(
        input.registration_context
      );

    assertCondition(
      context &&
      typeof context === "object",
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Registration Receipt requires a governed Registration Context."
    );

    const email =
      normalizeEmail(
        input.email ||
        context.email
      );

    assertCondition(
      isValidEmail(email),
      getErrorCodes()
        .INVALID_EMAIL ||
        "REGISTRATION_INVALID_EMAIL",
      "Registration Receipt contains an invalid email address."
    );

    const role =
      normalizeRole(
        input.requested_role ||
        context.requested_role
      );

    assertCondition(
      SUPPORTED_ROLES.includes(
        role
      ),
      getErrorCodes()
        .INVALID_ROLE ||
        "REGISTRATION_INVALID_ROLE",
      "Registration Receipt contains an unsupported enterprise role.",
      {
        requested_role:
          role || null
      }
    );

    const issuedAt =
      cleanString(
        input.issued_at
      ) || nowISO();

    assertCondition(
      isValidISODate(issuedAt),
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Registration Receipt issued_at must be a valid timestamp."
    );

    const registrationContextId =
      cleanString(
        input.registration_context_id ||
        context
          .registration_context_id
      );

    const correlationId =
      cleanString(
        input.correlation_id ||
        context.correlation_id
      );

    const authenticationUserId =
      cleanString(
        input.authentication_user_id ||
        context
          .authentication_user_id
      );

    const enterpriseIdentityId =
      cleanString(
        input.enterprise_identity_id ||
        context
          .enterprise_identity_id
      );

    [
      [
        "registration_context_id",
        registrationContextId
      ],
      [
        "correlation_id",
        correlationId
      ],
      [
        "authentication_user_id",
        authenticationUserId
      ],
      [
        "enterprise_identity_id",
        enterpriseIdentityId
      ]
    ].forEach(
      ([field, value]) => {
        assertCondition(
          Boolean(value),
          getErrorCodes()
            .RECEIPT_CREATION_FAILED ||
            "REGISTRATION_RECEIPT_CREATION_FAILED",
          `Registration Receipt requires ${field}.`,
          {
            missing_field:
              field
          }
        );
      }
    );

    return {
      registration_receipt_id:
        cleanString(
          input
            .registration_receipt_id
        ) ||
        generateId(
          "registration-receipt"
        ),

      receipt_type:
        validateReceiptType(
          input.receipt_type
        ),

      receipt_status:
        validateReceiptStatus(
          input.receipt_status ||
          RECEIPT_STATUSES.ISSUED
        ),

      registration_context_id:
        registrationContextId,

      correlation_id:
        correlationId,

      authentication_user_id:
        authenticationUserId,

      enterprise_identity_id:
        enterpriseIdentityId,

      email,

      requested_role:
        role,

      registration_status:
        normalizeUpper(
          input.registration_status ||
          context.registration_status
        ),

      email_verification_status:
        normalizeUpper(
          input
            .email_verification_status ||
          context
            .email_verification_status
        ),

      enterprise_status:
        normalizeUpper(
          input.enterprise_status ||
          context.enterprise_status
        ) ||
        "UNKNOWN",

      authentication_provider:
        cleanString(
          input.authentication_provider ||
          context
            .authentication_provider
        ).toLowerCase(),

      registration_source:
        cleanString(
          input.registration_source ||
          context.registration_source
        ) ||
        "register.html",

      requested_destination:
        cleanString(
          input.requested_destination ||
          context.requested_destination
        ) ||
        "login.html",

      issued_at:
        issuedAt,

      persisted_at:
        cleanString(
          input.persisted_at
        ) ||
        null,

      constitutional_owner:
        "STREAM_1_PUBLIC_ACCESS_AUTHENTICATION_ENTRY_AUTHORITY",

      registration_version:
        cleanString(
          input.registration_version ||
          context.registration_version ||
          STATE.registrationVersion
        ),

      registration_contract_version:
        cleanString(
          input
            .registration_contract_version ||
          context
            .registration_contract_version
        ),

      authentication_contract_version:
        cleanString(
          input
            .authentication_contract_version ||
          context
            .authentication_contract_version ||
          STATE
            .authenticationContractVersion
        ),

      receipt_contract_version:
        RECEIPT_CONTRACT_VERSION,

      environment:
        cleanString(
          input.environment ||
          STATE.environment
        ) ||
        "unconfigured",

      source_ip:
        cleanString(
          input.source_ip
        ) ||
        null,

      client_metadata:
        immutableClone(
          sanitizeMetadata(
            input.client_metadata ||
            {}
          )
        ),

      audit_metadata:
        immutableClone(
          sanitizeMetadata(
            input.audit_metadata ||
            {}
          )
        ),

      failure:
        input.failure
          ? immutableClone(
              sanitizeMetadata(
                input.failure
              )
            )
          : null
    };
  }

  function validateReceipt(
    rawReceipt
  ) {
    const receipt =
      normalizeReceiptInput(
        rawReceipt
      );

    REQUIRED_FIELDS
      .forEach((field) => {
        const value =
          receipt[field];

        assertCondition(
          value !== undefined &&
          value !== null &&
          cleanString(
            value
          ) !== "",
          getErrorCodes()
            .RECEIPT_CREATION_FAILED ||
            "REGISTRATION_RECEIPT_CREATION_FAILED",
          `Registration Receipt is missing required field: ${field}.`,
          {
            missing_field:
              field
          }
        );
      });

    if (
      receipt.persisted_at
    ) {
      assertCondition(
        isValidISODate(
          receipt.persisted_at
        ),
        getErrorCodes()
          .RECEIPT_CREATION_FAILED ||
          "REGISTRATION_RECEIPT_CREATION_FAILED",
        "Registration Receipt persisted_at must be a valid timestamp."
      );
    }

    return immutableClone(
      receipt
    );
  }

  function getClient() {
    return (
      STATE.client ||
      global.STATScoreCore
        ?.getClient?.() ||
      global.STATScoreData
        ?.getClient?.() ||
      global.STATScoreSupabase ||
      global.STATScoreSupabaseClient ||
      global.supabaseClient ||
      null
    );
  }

  function assertPersistenceRuntime() {
    if (
      typeof STATE
        .persistenceAdapter ===
        "function"
    ) {
      return true;
    }

    const client =
      getClient();

    assertCondition(
      client &&
      typeof client.rpc ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Receipt persistence runtime has not been configured."
    );

    assertCondition(
      Boolean(
        cleanString(
          STATE.receiptRpc
        )
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Receipt RPC has not been configured."
    );

    return true;
  }

  function configure(
    next = {}
  ) {
    if (
      STATE.configurationLocked &&
      next.force_reload !== true
    ) {
      throw createReceiptError(
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Receipt Authority configuration is locked for the active runtime."
      );
    }

    assertCondition(
      next &&
      typeof next === "object" &&
      !Array.isArray(next),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Receipt configuration must be an object."
    );

    if (
      next.client !== undefined
    ) {
      assertCondition(
        next.client === null ||
        typeof next.client ===
          "object",
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Receipt client must be an object or null."
      );

      STATE.client =
        next.client;
    }

    if (
      next.receiptRpc !== undefined
    ) {
      const receiptRpc =
        cleanString(
          next.receiptRpc
        );

      assertCondition(
        Boolean(receiptRpc),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Receipt RPC must be a non-empty string."
      );

      STATE.receiptRpc =
        receiptRpc;
    }

    if (
      next.persistenceAdapter !==
        undefined
    ) {
      assertCondition(
        next.persistenceAdapter ===
          null ||
        typeof next
          .persistenceAdapter ===
          "function",
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Receipt persistenceAdapter must be a function or null."
      );

      STATE.persistenceAdapter =
        next.persistenceAdapter;
    }

    if (
      next.environment !==
        undefined
    ) {
      const environment =
        cleanString(
          next.environment
        );

      assertCondition(
        Boolean(environment),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Receipt environment must be a non-empty string."
      );

      STATE.environment =
        environment;
    }

    if (
      next.registrationVersion !==
        undefined
    ) {
      STATE.registrationVersion =
        cleanString(
          next.registrationVersion
        ) ||
        STATE.registrationVersion;
    }

    if (
      next
        .authenticationContractVersion !==
        undefined
    ) {
      STATE
        .authenticationContractVersion =
        cleanString(
          next
            .authenticationContractVersion
        ) ||
        STATE
          .authenticationContractVersion;
    }

    STATE.configured =
      Boolean(
        STATE.persistenceAdapter ||
        getClient()
      );

    if (
      next.lock !== false
    ) {
      STATE.configurationLocked =
        true;
    }

    global.dispatchEvent(
      new CustomEvent(
        "statscore:registration-receipts-configured",
        {
          detail:
            immutableClone({
              authority_id:
                AUTHORITY_ID,

              version:
                VERSION,

              configured:
                STATE.configured,

              environment:
                STATE.environment,

              persistence_mode:
                STATE.persistenceAdapter
                  ? "adapter"
                  : "rpc",

              configured_at:
                nowISO()
            })
        }
      )
    );

    return getConfiguration();
  }

  function publishReceiptEvent(
    eventName,
    receipt,
    metadata = {}
  ) {
    global.dispatchEvent(
      new CustomEvent(
        `statscore:registration-receipt-${eventName}`,
        {
          detail:
            immutableClone({
              authority_id:
                AUTHORITY_ID,

              version:
                VERSION,

              receipt:
                receipt
                  ? clone(receipt)
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

    if (
      global.STATScore
        ?.EngineBus?.emit
    ) {
      global.STATScore
        .EngineBus
        .emit(
          `registration_receipt_${eventName}`,
          {
            receipt_id:
              receipt
                ?.registration_receipt_id ||
              null,

            receipt_type:
              receipt
                ?.receipt_type ||
              null,

            correlation_id:
              receipt
                ?.correlation_id ||
              null
          }
        );
    }
  }

  function retainReceipt(
    receipt
  ) {
    const receiptId =
      receipt
        .registration_receipt_id;

    assertCondition(
      !STATE.issuedReceipts
        .has(receiptId),
      getErrorCodes()
        .RECEIPT_CREATION_FAILED ||
        "REGISTRATION_RECEIPT_CREATION_FAILED",
      "Registration Receipt identifier already exists.",
      {
        registration_receipt_id:
          receiptId
      }
    );

    STATE.issuedReceipts.set(
      receiptId,
      receipt
    );

    STATE.receiptOrder.push(
      receiptId
    );

    return receipt;
  }

  function issueReceipt(
    input = {}
  ) {
    const receipt =
      validateReceipt({
        ...clone(input),

        receipt_status:
          RECEIPT_STATUSES.ISSUED,

        persisted_at:
          null
      });

    retainReceipt(
      receipt
    );

    publishReceiptEvent(
      "issued",
      receipt
    );

    return immutableClone(
      receipt
    );
  }

  function buildPersistencePayload(
    receipt
  ) {
    return immutableClone({
      p_registration_receipt_id:
        receipt
          .registration_receipt_id,

      p_receipt_type:
        receipt.receipt_type,

      p_receipt_status:
        receipt.receipt_status,

      p_registration_context_id:
        receipt
          .registration_context_id,

      p_correlation_id:
        receipt.correlation_id,

      p_authentication_user_id:
        receipt
          .authentication_user_id,

      p_enterprise_identity_id:
        receipt
          .enterprise_identity_id,

      p_email:
        receipt.email,

      p_requested_role:
        receipt.requested_role,

      p_registration_status:
        receipt
          .registration_status,

      p_email_verification_status:
        receipt
          .email_verification_status,

      p_enterprise_status:
        receipt.enterprise_status,

      p_authentication_provider:
        receipt
          .authentication_provider,

      p_registration_source:
        receipt.registration_source,

      p_requested_destination:
        receipt
          .requested_destination,

      p_issued_at:
        receipt.issued_at,

      p_constitutional_owner:
        receipt
          .constitutional_owner,

      p_registration_version:
        receipt
          .registration_version,

      p_registration_contract_version:
        receipt
          .registration_contract_version,

      p_authentication_contract_version:
        receipt
          .authentication_contract_version,

      p_receipt_contract_version:
        receipt
          .receipt_contract_version,

      p_environment:
        receipt.environment,

      p_source_ip:
        receipt.source_ip,

      p_client_metadata:
        clone(
          receipt.client_metadata ||
          {}
        ),

      p_audit_metadata:
        clone(
          receipt.audit_metadata ||
          {}
        ),

      p_failure:
        clone(
          receipt.failure
        )
    });
  }

  async function persistThroughAdapter(
    receipt
  ) {
    const response =
      await STATE
        .persistenceAdapter({
          receipt:
            immutableClone(
              receipt
            ),

          payload:
            buildPersistencePayload(
              receipt
            ),

          authority_id:
            AUTHORITY_ID,

          authority_version:
            VERSION
        });

    assertCondition(
      response &&
      response.persisted === true,
      getErrorCodes()
        .RECEIPT_PERSISTENCE_FAILED ||
        "REGISTRATION_RECEIPT_PERSISTENCE_FAILED",
      "Registration Receipt persistence adapter did not confirm persistence.",
      {
        registration_receipt_id:
          receipt
            .registration_receipt_id
      }
    );

    return response;
  }

  async function persistThroughRpc(
    receipt
  ) {
    const client =
      getClient();

    const {
      data,
      error
    } =
      await client.rpc(
        STATE.receiptRpc,
        buildPersistencePayload(
          receipt
        )
      );

    if (error) {
      throw createReceiptError(
        getErrorCodes()
          .RECEIPT_PERSISTENCE_FAILED ||
          "REGISTRATION_RECEIPT_PERSISTENCE_FAILED",
        "Registration Receipt RPC persistence failed.",
        {
          registration_receipt_id:
            receipt
              .registration_receipt_id,

          receipt_rpc:
            STATE.receiptRpc,

          provider_message:
            cleanString(
              error.message
            ) || null
        },
        error
      );
    }

    return {
      persisted:
        true,

      data
    };
  }

  async function persistReceipt(
    receiptOrId
  ) {
    assertPersistenceRuntime();

    const receipt =
      typeof receiptOrId ===
        "string"
        ? STATE.issuedReceipts
            .get(
              cleanString(
                receiptOrId
              )
            )
        : validateReceipt(
            receiptOrId
          );

    assertCondition(
      Boolean(receipt),
      getErrorCodes()
        .RECEIPT_PERSISTENCE_FAILED ||
        "REGISTRATION_RECEIPT_PERSISTENCE_FAILED",
      "Registration Receipt could not be located for persistence."
    );

    if (
      receipt.receipt_status ===
        RECEIPT_STATUSES.PERSISTED
    ) {
      return immutableClone(
        receipt
      );
    }

    try {
      if (
        STATE.persistenceAdapter
      ) {
        await persistThroughAdapter(
          receipt
        );
      } else {
        await persistThroughRpc(
          receipt
        );
      }

      const persistedReceipt =
        validateReceipt({
          ...clone(receipt),

          receipt_status:
            RECEIPT_STATUSES.PERSISTED,

          persisted_at:
            nowISO()
        });

      STATE.issuedReceipts.set(
        persistedReceipt
          .registration_receipt_id,
        persistedReceipt
      );

      publishReceiptEvent(
        "persisted",
        persistedReceipt
      );

      return immutableClone(
        persistedReceipt
      );
    } catch (rawError) {
      const failedReceipt =
        validateReceipt({
          ...clone(receipt),

          receipt_status:
            RECEIPT_STATUSES
              .PERSISTENCE_FAILED,

          persisted_at:
            null
        });

      STATE.issuedReceipts.set(
        failedReceipt
          .registration_receipt_id,
        failedReceipt
      );

      publishReceiptEvent(
        "persistence-failed",
        failedReceipt,
        {
          error_code:
            cleanString(
              rawError?.code
            ) ||
            "REGISTRATION_RECEIPT_PERSISTENCE_FAILED"
        }
      );

      if (
        rawError &&
        rawError.code
      ) {
        throw rawError;
      }

      throw createReceiptError(
        getErrorCodes()
          .RECEIPT_PERSISTENCE_FAILED ||
          "REGISTRATION_RECEIPT_PERSISTENCE_FAILED",
        "Registration Receipt persistence failed.",
        {
          registration_receipt_id:
            receipt
              .registration_receipt_id
        },
        rawError
      );
    }
  }

  async function issueAndPersist(
    input = {}
  ) {
    const issued =
      issueReceipt(
        input
      );

    return persistReceipt(
      issued
    );
  }

  function getReceipt(
    registrationReceiptId
  ) {
    const receiptId =
      cleanString(
        registrationReceiptId
      );

    if (!receiptId) {
      return null;
    }

    const receipt =
      STATE.issuedReceipts
        .get(receiptId);

    return receipt
      ? immutableClone(receipt)
      : null;
  }

  function getReceiptsByCorrelationId(
    correlationId
  ) {
    const normalized =
      cleanString(
        correlationId
      );

    if (!normalized) {
      return [];
    }

    return STATE.receiptOrder
      .map(
        (receiptId) =>
          STATE.issuedReceipts
            .get(receiptId)
      )
      .filter(
        (receipt) =>
          receipt &&
          receipt.correlation_id ===
            normalized
      )
      .map(
        (receipt) =>
          immutableClone(receipt)
      );
  }

  function getReceiptsByContextId(
    registrationContextId
  ) {
    const normalized =
      cleanString(
        registrationContextId
      );

    if (!normalized) {
      return [];
    }

    return STATE.receiptOrder
      .map(
        (receiptId) =>
          STATE.issuedReceipts
            .get(receiptId)
      )
      .filter(
        (receipt) =>
          receipt &&
          receipt
            .registration_context_id ===
            normalized
      )
      .map(
        (receipt) =>
          immutableClone(receipt)
      );
  }

  function listReceipts(
    options = {}
  ) {
    const limit =
      Number.isInteger(
        Number(options.limit)
      )
        ? Math.max(
            1,
            Math.min(
              Number(
                options.limit
              ),
              500
            )
          )
        : 100;

    const receiptType =
      cleanString(
        options.receipt_type
      ).toUpperCase();

    const receiptStatus =
      cleanString(
        options.receipt_status
      ).toUpperCase();

    let receipts =
      STATE.receiptOrder
        .map(
          (receiptId) =>
            STATE.issuedReceipts
              .get(receiptId)
        )
        .filter(Boolean);

    if (receiptType) {
      receipts =
        receipts.filter(
          (receipt) =>
            receipt.receipt_type ===
              receiptType
        );
    }

    if (receiptStatus) {
      receipts =
        receipts.filter(
          (receipt) =>
            receipt.receipt_status ===
              receiptStatus
        );
    }

    return receipts
      .slice(-limit)
      .map(
        (receipt) =>
          immutableClone(receipt)
      );
  }

  function attachReceiptToContext(
    receipt
  ) {
    const contextAuthority =
      getContextAuthority();

    if (
      !contextAuthority ||
      typeof contextAuthority
        .attachReceiptId !==
        "function"
    ) {
      return false;
    }

    contextAuthority
      .attachReceiptId(
        receipt
          .registration_receipt_id
      );

    return true;
  }

  function getConfiguration() {
    return immutableClone({
      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      receipt_contract_version:
        RECEIPT_CONTRACT_VERSION,

      configured:
        STATE.configured,

      configuration_locked:
        STATE.configurationLocked,

      environment:
        STATE.environment,

      receipt_rpc:
        STATE.receiptRpc,

      persistence_mode:
        STATE.persistenceAdapter
          ? "adapter"
          : "rpc",

      client_available:
        Boolean(
          getClient()
        ),

      receipt_count:
        STATE.receiptOrder.length,

      supported_receipt_types:
        RECEIPT_TYPES,

      supported_receipt_statuses:
        RECEIPT_STATUSES,

      required_fields:
        REQUIRED_FIELDS
    });
  }

  function runHealthCheck() {
    let valid = true;
    const errors = [];

    STATE.receiptOrder
      .forEach(
        (receiptId) => {
          const receipt =
            STATE.issuedReceipts
              .get(receiptId);

          try {
            validateReceipt(
              receipt
            );
          } catch (error) {
            valid = false;

            errors.push({
              registration_receipt_id:
                receiptId,

              error_code:
                cleanString(
                  error?.code
                ) ||
                "REGISTRATION_RECEIPT_VALIDATION_FAILED"
            });
          }
        }
      );

    return immutableClone({
      ok:
        valid,

      authority_id:
        AUTHORITY_ID,

      version:
        VERSION,

      configured:
        STATE.configured,

      environment:
        STATE.environment,

      receipt_count:
        STATE.receiptOrder.length,

      persistence_available:
        Boolean(
          STATE.persistenceAdapter ||
          (
            getClient() &&
            typeof getClient().rpc ===
              "function"
          )
        ),

      validation_errors:
        errors,

      checked_at:
        nowISO()
    });
  }

  const api = Object.freeze({
    authority_id:
      AUTHORITY_ID,

    version:
      VERSION,

    receipt_contract_version:
      RECEIPT_CONTRACT_VERSION,

    RECEIPT_TYPES,

    RECEIPT_STATUSES,

    REQUIRED_FIELDS,

    configure,

    issueReceipt,

    persistReceipt,

    issueAndPersist,

    validateReceipt,

    attachReceiptToContext,

    getReceipt,

    getReceiptsByCorrelationId,

    getReceiptsByContextId,

    listReceipts,

    getConfiguration,

    runHealthCheck
  });

  global.STATSCORE_REGISTRATION_RECEIPTS =
    api;

  global.STATScore =
    global.STATScore || {};

  global.STATScore
    .RegistrationReceipts =
    api;

  global.dispatchEvent(
    new CustomEvent(
      "statscore:registration-receipts-authority-ready",
      {
        detail:
          immutableClone({
            authority_id:
              AUTHORITY_ID,

            version:
              VERSION,

            receipt_contract_version:
              RECEIPT_CONTRACT_VERSION,

            ready:
              true
          })
      }
    )
  );

  console.info(
    "[STATS-CORE Registration Receipts] Authority ready:",
    VERSION
  );
})(window); 
