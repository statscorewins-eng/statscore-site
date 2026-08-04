/*
==========================================================
STATS-CORE™ OWNERSHIP HEADER
==========================================================

File:
statscore-registration-service.js

Asset Type:
JavaScript Orchestration Authority / Enterprise Registration Service

Owner Stream:
Stream 1 — Public Access, Authentication & Entry Authority

Primary Operational Authority:
Stream 1 — Enterprise Account Registration Authority

System Layer:
Public Entry / Enterprise Identity Registration

Primary Consumers:
- register.html
- governed runtime bootstrap
- authorized diagnostics
- registration verification tooling

Purpose:
Coordinates the complete governed enterprise-registration
lifecycle from validated registration request through provider
account creation, enterprise identity initialization, Registration
Context publication, Registration Receipt persistence, email
verification state publication, rollback, and controlled response.

Consumes:
- approved registration request
- configured authentication provider
- enterprise identity initializer
- Registration Error Authority
- Registration Context Authority
- Registration Receipt Authority

Provides:
- register(request)
- controlled provider account creation
- governed enterprise identity initialization
- Registration Context publication
- immutable Registration Receipt generation
- provider-aware rollback
- registration diagnostics
- configuration reporting

Constitutional Boundary:
Registration manufactures credentials and initializes a governed
enterprise identity that may later authenticate.

Registration does not authenticate the user into STATS-CORE.

Does NOT:
- sign the user into the enterprise
- publish Initial Authentication Context
- initialize Runtime Context
- create authentication sessions for enterprise participation
- create athlete source records
- manufacture athlete_id or snapshot_id
- create professional workspaces
- complete athlete or professional intake
- route directly to dashboards
- calculate intelligence
- store passwords in browser storage
- persist access tokens
- bypass email verification policy

Status:
ENGINEERING CHANGE CONTROL — ENTERPRISE REGISTRATION BUILD

==========================================================
*/

(function initializeRegistrationService(global) {
  "use strict";

  const SERVICE_ID =
    "statscore-registration-service";

  const VERSION =
    "STATSCORE-REGISTRATION-SERVICE-V1.0.0";

  const REGISTRATION_VERSION =
    "STATSCORE-REGISTRATION-V1.0.0";

  const REGISTRATION_CONTRACT_VERSION =
    "STATSCORE-REGISTRATION-CONTRACT-V1.0.0";

  const AUTHENTICATION_CONTRACT_VERSION =
    "STATSCORE-AUTHENTICATION-CONTRACT-V1.0.0";

  const DEFAULT_IDENTITY_RPC =
    "initialize_statscore_enterprise_identity";

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

  const PROVIDER_REQUIRED_METHODS = Object.freeze([
    "register",
    "rollbackRegistration",
    "getEnvironment"
  ]);

  const STATE = {
    configured: false,
    configurationLocked: false,

    client: null,

    registrationProvider: null,

    identityInitializer: null,
    identityRollback: null,

    identityRpc:
      DEFAULT_IDENTITY_RPC,

    requireEmailVerification: true,

    environment:
      "unconfigured",

    registrationSource:
      "register.html",

    requestedDestination:
      "login.html",

    registrationInProgress: false,

    activeCorrelationId: null,

    lastResult: null,
    lastError: null
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

  function getContextAuthority() {
    return (
      global
        .STATSCORE_REGISTRATION_CONTEXT_AUTHORITY ||
      global.STATScore
        ?.RegistrationContextAuthority ||
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

  function getErrorCodes() {
    return (
      getErrorsAuthority()
        ?.ERROR_CODES ||
      {}
    );
  }

  function createRegistrationError(
    code,
    internalMessage,
    options = {}
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
              options.operation ||
              "registration_service",

            correlation_id:
              options.correlation_id ||
              STATE.activeCorrelationId ||
              null,

            metadata:
              options.metadata ||
              {},

            cause:
              options.cause ||
              null
          }
        );
    }

    const error =
      new Error(
        internalMessage ||
        "Enterprise registration failed."
      );

    error.name =
      "STATScoreRegistrationServiceError";

    error.code =
      code ||
      "REGISTRATION_UNKNOWN_ERROR";

    error.user_message =
      "Enterprise registration could not be completed.";

    error.correlation_id =
      options.correlation_id ||
      STATE.activeCorrelationId ||
      null;

    return error;
  }

  function normalizeRegistrationError(
    rawError,
    options = {}
  ) {
    const authority =
      getErrorsAuthority();

    if (
      authority &&
      typeof authority
        .normalizeRegistrationError ===
        "function"
    ) {
      return authority
        .normalizeRegistrationError(
          rawError,
          {
            operation:
              options.operation ||
              "registration_service",

            correlation_id:
              options.correlation_id ||
              STATE.activeCorrelationId ||
              null,

            code:
              options.code,

            internal_message:
              options.internal_message,

            metadata:
              options.metadata ||
              {}
          }
        );
    }

    if (
      rawError &&
      rawError.code
    ) {
      return rawError;
    }

    return createRegistrationError(
      options.code ||
      getErrorCodes().UNKNOWN_ERROR ||
      "REGISTRATION_UNKNOWN_ERROR",
      options.internal_message ||
      cleanString(rawError?.message) ||
      "Enterprise registration failed.",
      {
        ...options,
        cause: rawError
      }
    );
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

    throw createRegistrationError(
      code,
      internalMessage,
      {
        metadata
      }
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

  function getDefaultProvider() {
    const client =
      getClient();

    if (
      !client ||
      !client.auth ||
      typeof client.auth.signUp !==
        "function"
    ) {
      return null;
    }

    return Object.freeze({
      provider_id:
        "supabase",

      async register(request) {
        const response =
          await client.auth.signUp({
            email:
              request.email,

            password:
              request.password,

            options: {
              emailRedirectTo:
                request.email_redirect_to ||
                undefined,

              data: {
                requested_role:
                  request.requested_role,

                registration_source:
                  request.registration_source,

                registration_version:
                  REGISTRATION_VERSION
              }
            }
          });

        return response;
      },

      async rollbackRegistration(payload = {}) {
        /*
        Supabase browser clients generally cannot delete an auth user.
        This method intentionally performs no unauthorized deletion.

        A governed server-side rollback adapter may be configured
        when production infrastructure supports account deletion or
        disablement through approved service authority.
        */

        return Object.freeze({
          rolled_back:
            false,

          status:
            "PROVIDER_ROLLBACK_REQUIRES_SERVER_AUTHORITY",

          authentication_user_id:
            cleanString(
              payload.authentication_user_id
            ) || null
        });
      },

      getEnvironment() {
        return Object.freeze({
          provider_id:
            "supabase",

          authentication_source:
            "supabase_registration",

          production:
            true,

          requires_email_verification:
            STATE.requireEmailVerification
        });
      }
    });
  }

  function getActiveProvider() {
    return (
      STATE.registrationProvider ||
      getDefaultProvider()
    );
  }

  function getProviderEnvironment() {
    const provider =
      getActiveProvider();

    assertCondition(
      provider &&
      typeof provider.getEnvironment ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "The active registration provider environment is unavailable."
    );

    const environment =
      provider.getEnvironment();

    assertCondition(
      environment &&
      typeof environment ===
        "object" &&
      !Array.isArray(environment),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "The registration provider returned an invalid environment contract."
    );

    const providerId =
      cleanString(
        environment.provider_id
      );

    assertCondition(
      Boolean(providerId),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "The registration provider environment requires provider_id."
    );

    return immutableClone({
      ...clone(environment),

      provider_id:
        providerId,

      requires_email_verification:
        environment
          .requires_email_verification !==
          undefined
          ? Boolean(
              environment
                .requires_email_verification
            )
          : STATE
              .requireEmailVerification
    });
  }

  function getActiveProviderId() {
    return getProviderEnvironment()
      .provider_id;
  }

  function validateProvider(
    provider
  ) {
    assertCondition(
      provider === null ||
      (
        typeof provider ===
          "object" &&
        !Array.isArray(provider)
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "registrationProvider must be an object or null."
    );

    if (provider === null) {
      return true;
    }

    PROVIDER_REQUIRED_METHODS
      .forEach((method) => {
        assertCondition(
          typeof provider[method] ===
            "function",
          getErrorCodes()
            .CONFIGURATION_ERROR ||
            "REGISTRATION_CONFIGURATION_ERROR",
          `registrationProvider must implement ${method}().`
        );
      });

    const environment =
      provider.getEnvironment();

    assertCondition(
      environment &&
      typeof environment ===
        "object" &&
      Boolean(
        cleanString(
          environment.provider_id
        )
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "registrationProvider.getEnvironment() must return a non-empty provider_id."
    );

    return true;
  }

  function validateRequest(
    rawRequest
  ) {
    assertCondition(
      rawRequest &&
      typeof rawRequest ===
        "object" &&
      !Array.isArray(rawRequest),
      getErrorCodes()
        .INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration request must be an object."
    );

    const email =
      normalizeEmail(
        rawRequest.email
      );

    const password =
      typeof rawRequest.password ===
        "string"
        ? rawRequest.password
        : "";

    const role =
      normalizeRole(
        rawRequest.requested_role ||
        rawRequest.role
      );

    assertCondition(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email),
      getErrorCodes()
        .INVALID_EMAIL ||
        "REGISTRATION_INVALID_EMAIL",
      "Registration request contains an invalid email address."
    );

    assertCondition(
      SUPPORTED_ROLES.includes(role),
      getErrorCodes()
        .INVALID_ROLE ||
        "REGISTRATION_INVALID_ROLE",
      "Registration request contains an unsupported enterprise role.",
      {
        requested_role:
          role || null
      }
    );

    assertCondition(
      password.length >= 12 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password),
      getErrorCodes()
        .INVALID_PASSWORD ||
        "REGISTRATION_INVALID_PASSWORD",
      "Registration password does not satisfy the approved security standard."
    );

    assertCondition(
      rawRequest.agreements &&
      rawRequest.agreements
        .terms_accepted === true,
      getErrorCodes()
        .TERMS_REQUIRED ||
        "REGISTRATION_TERMS_REQUIRED",
      "Registration requires Terms of Service acceptance."
    );

    assertCondition(
      rawRequest.agreements &&
      rawRequest.agreements
        .privacy_accepted === true,
      getErrorCodes()
        .PRIVACY_REQUIRED ||
        "REGISTRATION_PRIVACY_REQUIRED",
      "Registration requires Privacy Policy acknowledgement."
    );

    const acceptedAt =
      cleanString(
        rawRequest.agreements
          .accepted_at
      );

    assertCondition(
      Boolean(acceptedAt) &&
      Number.isFinite(
        Date.parse(acceptedAt)
      ),
      getErrorCodes()
        .INVALID_REQUEST ||
        "REGISTRATION_INVALID_REQUEST",
      "Registration agreement acceptance requires a valid timestamp."
    );

    return Object.freeze({
      email,

      password,

      requested_role:
        role,

      registration_source:
        cleanString(
          rawRequest.registration_source
        ) ||
        STATE.registrationSource,

      requested_destination:
        cleanString(
          rawRequest.requested_destination
        ) ||
        STATE.requestedDestination,

      email_redirect_to:
        cleanString(
          rawRequest.email_redirect_to
        ) ||
        null,

      agreements:
        Object.freeze({
          terms_accepted:
            true,

          privacy_accepted:
            true,

          accepted_at:
            acceptedAt,

          terms_version:
            cleanString(
              rawRequest.agreements
                .terms_version
            ) ||
            null,

          privacy_version:
            cleanString(
              rawRequest.agreements
                .privacy_version
            ) ||
            null
        }),

      entry_metadata:
        immutableClone(
          sanitizeMetadata(
            rawRequest.entry_metadata ||
            {}
          )
        )
    });
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

    const output = {};

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
          output[key] = item;
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
            sanitizeMetadata(item);
        }
      });

    return output;
  }

  function normalizeProviderResponse(
    response
  ) {
    assertCondition(
      response &&
      typeof response ===
        "object",
      getErrorCodes()
        .CREDENTIAL_CREATION_FAILED ||
        "REGISTRATION_CREDENTIAL_CREATION_FAILED",
      "Registration provider returned no response."
    );

    if (response.error) {
      throw normalizeRegistrationError(
        response.error,
        {
          operation:
            "provider_registration"
        }
      );
    }

    const data =
      response.data || {};

    const user =
      data.user ||
      response.user ||
      null;

    const session =
      data.session ||
      response.session ||
      null;

    assertCondition(
      user &&
      Boolean(
        cleanString(user.id)
      ),
      getErrorCodes()
        .CREDENTIAL_CREATION_FAILED ||
        "REGISTRATION_CREDENTIAL_CREATION_FAILED",
      "Registration provider did not return a valid authentication user."
    );

    return Object.freeze({
      authentication_user_id:
        cleanString(user.id),

      email:
        normalizeEmail(
          user.email
        ),

      provider_user:
        immutableClone({
          id:
            cleanString(user.id),

          email:
            normalizeEmail(
              user.email
            ),

          email_confirmed_at:
            cleanString(
              user.email_confirmed_at
            ) ||
            null,

          created_at:
            cleanString(
              user.created_at
            ) ||
            null,

          app_metadata:
            sanitizeMetadata(
              user.app_metadata ||
              {}
            ),

          user_metadata:
            sanitizeMetadata(
              user.user_metadata ||
              {}
            )
        }),

      provider_session_present:
        Boolean(session),

      email_verified:
        Boolean(
          cleanString(
            user.email_confirmed_at
          )
        )
    });
  }

  async function createProviderAccount(
    request
  ) {
    const provider =
      getActiveProvider();

    assertCondition(
      provider &&
      typeof provider.register ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "The governed registration provider has not been configured."
    );

    const response =
      await provider.register(
        request
      );

    return normalizeProviderResponse(
      response
    );
  }

  function normalizeIdentityResult(
    result,
    request,
    providerResult
  ) {
    assertCondition(
      result &&
      typeof result ===
        "object",
      getErrorCodes()
        .IDENTITY_INITIALIZATION_FAILED ||
        "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",
      "Enterprise identity initializer returned no result."
    );

    if (result.error) {
      throw normalizeRegistrationError(
        result.error,
        {
          code:
            getErrorCodes()
              .IDENTITY_INITIALIZATION_FAILED ||
            "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",

          operation:
            "enterprise_identity_initialization"
        }
      );
    }

    const data =
      result.data ||
      result;

    const enterpriseIdentityId =
      cleanString(
        data.enterprise_identity_id ||
        data.identity_id ||
        data.user_id
      );

    assertCondition(
      Boolean(
        enterpriseIdentityId
      ),
      getErrorCodes()
        .IDENTITY_INITIALIZATION_FAILED ||
        "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",
      "Enterprise identity initialization did not return enterprise_identity_id."
    );

    return Object.freeze({
      enterprise_identity_id:
        enterpriseIdentityId,

      requested_role:
        normalizeRole(
          data.requested_role ||
          request.requested_role
        ),

      role_status:
        cleanString(
          data.role_status
        ) ||
        "REQUESTED",

      enterprise_status:
        cleanString(
          data.enterprise_status
        ) ||
        "PENDING_EMAIL_VERIFICATION",

      initialized_at:
        cleanString(
          data.initialized_at
        ) ||
        nowISO(),

      metadata:
        immutableClone(
          sanitizeMetadata(
            data.metadata ||
            {}
          )
        ),

      authentication_user_id:
        providerResult
          .authentication_user_id
    });
  }

  async function initializeEnterpriseIdentity(
    request,
    providerResult,
    correlationId
  ) {
    if (
      typeof STATE.identityInitializer ===
        "function"
    ) {
      const result =
        await STATE
          .identityInitializer({
            authentication_user_id:
              providerResult
                .authentication_user_id,

            email:
              request.email,

            requested_role:
              request.requested_role,

            registration_source:
              request.registration_source,

            correlation_id:
              correlationId,

            agreements:
              clone(
                request.agreements
              ),

            registration_version:
              REGISTRATION_VERSION,

            registration_contract_version:
              REGISTRATION_CONTRACT_VERSION,

            authentication_contract_version:
              AUTHENTICATION_CONTRACT_VERSION
          });

      return normalizeIdentityResult(
        result,
        request,
        providerResult
      );
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
      "Enterprise identity initialization runtime has not been configured."
    );

    assertCondition(
      Boolean(
        cleanString(
          STATE.identityRpc
        )
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Enterprise identity initialization RPC has not been configured."
    );

    const {
      data,
      error
    } =
      await client.rpc(
        STATE.identityRpc,
        {
          p_authentication_user_id:
            providerResult
              .authentication_user_id,

          p_email:
            request.email,

          p_requested_role:
            request.requested_role,

          p_registration_source:
            request.registration_source,

          p_correlation_id:
            correlationId,

          p_terms_accepted:
            true,

          p_privacy_accepted:
            true,

          p_agreements_accepted_at:
            request.agreements
              .accepted_at,

          p_registration_version:
            REGISTRATION_VERSION,

          p_registration_contract_version:
            REGISTRATION_CONTRACT_VERSION,

          p_authentication_contract_version:
            AUTHENTICATION_CONTRACT_VERSION
        }
      );

    if (error) {
      throw normalizeRegistrationError(
        error,
        {
          code:
            getErrorCodes()
              .IDENTITY_INITIALIZATION_FAILED ||
            "REGISTRATION_IDENTITY_INITIALIZATION_FAILED",

          operation:
            "enterprise_identity_initialization",

          metadata: {
            identity_rpc:
              STATE.identityRpc
          }
        }
      );
    }

    return normalizeIdentityResult(
      {
        data
      },
      request,
      providerResult
    );
  }

  function buildInitialRegistrationStatus(
    providerEnvironment,
    providerResult
  ) {
    const verificationRequired =
      providerEnvironment
        .requires_email_verification !==
        false &&
      STATE.requireEmailVerification;

    if (
      providerResult.email_verified
    ) {
      return Object.freeze({
        registration_status:
          "EMAIL_VERIFIED",

        email_verification_status:
          "VERIFIED",

        enterprise_status:
          "EMAIL_VERIFIED",

        email_verified_at:
          nowISO(),

        verification_required:
          false
      });
    }

    if (verificationRequired) {
      return Object.freeze({
        registration_status:
          "EMAIL_VERIFICATION_PENDING",

        email_verification_status:
          "PENDING",

        enterprise_status:
          "PENDING_EMAIL_VERIFICATION",

        email_verified_at:
          null,

        verification_required:
          true
      });
    }

    return Object.freeze({
      registration_status:
        "IDENTITY_INITIALIZED",

      email_verification_status:
        "NOT_REQUIRED",

      enterprise_status:
        "ACTIVE_PENDING_LOGIN",

      email_verified_at:
        null,

      verification_required:
        false
    });
  }

  function createRegistrationContext(
    request,
    providerResult,
    identityResult,
    providerEnvironment,
    correlationId
  ) {
    const contextAuthority =
      getContextAuthority();

    assertCondition(
      contextAuthority &&
      typeof contextAuthority
        .createContext ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Context Authority has not been loaded."
    );

    const lifecycle =
      buildInitialRegistrationStatus(
        providerEnvironment,
        providerResult
      );

    const registeredAt =
      nowISO();

    return contextAuthority
      .createContext({
        correlation_id:
          correlationId,

        authentication_user_id:
          providerResult
            .authentication_user_id,

        enterprise_identity_id:
          identityResult
            .enterprise_identity_id,

        email:
          request.email,

        requested_role:
          request.requested_role,

        registration_status:
          lifecycle
            .registration_status,

        email_verification_status:
          lifecycle
            .email_verification_status,

        email_verified_at:
          lifecycle
            .email_verified_at,

        identity_initialized_at:
          identityResult
            .initialized_at,

        registration_source:
          request
            .registration_source,

        requested_destination:
          request
            .requested_destination,

        authentication_provider:
          providerEnvironment
            .provider_id,

        enterprise_status:
          lifecycle
            .enterprise_status,

        registered_at:
          registeredAt,

        updated_at:
          registeredAt,

        registration_version:
          REGISTRATION_VERSION,

        registration_contract_version:
          REGISTRATION_CONTRACT_VERSION,

        authentication_contract_version:
          AUTHENTICATION_CONTRACT_VERSION,

        agreements:
          request.agreements,

        entry_metadata: {
          ...clone(
            request.entry_metadata
          ),

          provider_environment:
            sanitizeMetadata(
              providerEnvironment
            ),

          identity_metadata:
            sanitizeMetadata(
              identityResult.metadata
            )
        }
      });
  }

  async function createRegistrationReceipt(
    context,
    providerEnvironment,
    verificationRequired
  ) {
    const receiptsAuthority =
      getReceiptsAuthority();

    assertCondition(
      receiptsAuthority &&
      typeof receiptsAuthority
        .issueAndPersist ===
        "function",
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Receipt Authority has not been loaded."
    );

    const receiptType =
      verificationRequired
        ? receiptsAuthority
            .RECEIPT_TYPES
            .EMAIL_VERIFICATION_PENDING
        : receiptsAuthority
            .RECEIPT_TYPES
            .REGISTRATION_SUCCEEDED;

    const persistedReceipt =
      await receiptsAuthority
        .issueAndPersist({
          receipt_type:
            receiptType,

          registration_context:
            context,

          authentication_provider:
            providerEnvironment
              .provider_id,

          environment:
            cleanString(
              STATE.environment
            ) ||
            "unconfigured",

          audit_metadata: {
            service_id:
              SERVICE_ID,

            service_version:
              VERSION,

            verification_required:
              verificationRequired,

            provider_production:
              providerEnvironment
                .production !== false
          },

          client_metadata:
            getClientMetadata()
        });

    if (
      typeof receiptsAuthority
        .attachReceiptToContext ===
        "function"
    ) {
      receiptsAuthority
        .attachReceiptToContext(
          persistedReceipt
        );
    }

    return persistedReceipt;
  }

  function getClientMetadata() {
    return immutableClone({
      user_agent:
        cleanString(
          global.navigator
            ?.userAgent
        ) ||
        null,

      language:
        cleanString(
          global.navigator
            ?.language
        ) ||
        null,

      platform:
        cleanString(
          global.navigator
            ?.platform
        ) ||
        null,

      page:
        cleanString(
          global.location
            ?.pathname
        ) ||
        null,

      origin:
        cleanString(
          global.location
            ?.origin
        ) ||
        null
    });
  }

  async function rollbackRegistration(
    rollbackState,
    originalError
  ) {
    const failures = [];

    if (
      rollbackState.contextCreated
    ) {
      try {
        const contextAuthority =
          getContextAuthority();

        if (
          contextAuthority &&
          typeof contextAuthority
            .markRegistrationFailed ===
            "function"
        ) {
          contextAuthority
            .markRegistrationFailed({
              error_code:
                cleanString(
                  originalError?.code
                ) ||
                "REGISTRATION_FAILED",

              correlation_id:
                rollbackState
                  .correlationId
            });
        }
      } catch (error) {
        failures.push({
          operation:
            "mark_registration_failed",

          error_code:
            cleanString(
              error?.code
            ) ||
            "REGISTRATION_CONTEXT_ROLLBACK_FAILED"
        });
      }
    }

    if (
      rollbackState
        .identityInitialized
    ) {
      try {
        if (
          typeof STATE.identityRollback ===
            "function"
        ) {
          await STATE
            .identityRollback({
              enterprise_identity_id:
                rollbackState
                  .enterpriseIdentityId,

              authentication_user_id:
                rollbackState
                  .authenticationUserId,

              correlation_id:
                rollbackState
                  .correlationId,

              reason:
                cleanString(
                  originalError?.code
                ) ||
                "REGISTRATION_FAILED"
            });
        }
      } catch (error) {
        failures.push({
          operation:
            "identity_rollback",

          error_code:
            cleanString(
              error?.code
            ) ||
            "REGISTRATION_IDENTITY_ROLLBACK_FAILED"
        });
      }
    }

    if (
      rollbackState.providerCreated
    ) {
      try {
        const provider =
          getActiveProvider();

        if (
          provider &&
          typeof provider
            .rollbackRegistration ===
            "function"
        ) {
          await provider
            .rollbackRegistration({
              authentication_user_id:
                rollbackState
                  .authenticationUserId,

              enterprise_identity_id:
                rollbackState
                  .enterpriseIdentityId,

              correlation_id:
                rollbackState
                  .correlationId,

              reason:
                cleanString(
                  originalError?.code
                ) ||
                "REGISTRATION_FAILED"
            });
        }
      } catch (error) {
        failures.push({
          operation:
            "provider_rollback",

          error_code:
            cleanString(
              error?.code
            ) ||
            "REGISTRATION_PROVIDER_ROLLBACK_FAILED"
        });
      }
    }

    return Object.freeze({
      attempted:
        true,

      failures:
        immutableClone(
          failures
        ),

      rollback_complete:
        failures.length === 0
    });
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

        correlation_id:
          STATE.activeCorrelationId,

        timestamp:
          nowISO(),

        ...sanitizeMetadata(payload)
      });

    global.dispatchEvent(
      new CustomEvent(
        `statscore:registration-service-${eventName}`,
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
          `registration_service_${eventName}`,
          detail
        );
    }

    return detail;
  }

  function assertRegistrationRuntime() {
    assertCondition(
      getErrorsAuthority(),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Error Authority has not been loaded."
    );

    assertCondition(
      getContextAuthority(),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Context Authority has not been loaded."
    );

    assertCondition(
      getReceiptsAuthority(),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Receipt Authority has not been loaded."
    );

    const provider =
      getActiveProvider();

    validateProvider(
      provider
    );

    assertCondition(
      typeof STATE.identityInitializer ===
        "function" ||
      (
        getClient() &&
        typeof getClient().rpc ===
          "function"
      ),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Enterprise identity initialization has not been configured."
    );

    return true;
  }

  async function register(
    rawRequest
  ) {
    if (
      STATE.registrationInProgress
    ) {
      throw createRegistrationError(
        getErrorCodes()
          .REQUEST_CONFLICT ||
          "REGISTRATION_REQUEST_CONFLICT",
        "A registration request is already in progress."
      );
    }

    assertRegistrationRuntime();

    const request =
      validateRequest(
        rawRequest
      );

    const correlationId =
      generateId(
        "registration-correlation"
      );

    STATE.registrationInProgress =
      true;

    STATE.activeCorrelationId =
      correlationId;

    STATE.lastResult =
      null;

    STATE.lastError =
      null;

    const rollbackState = {
      correlationId,

      providerCreated:
        false,

      identityInitialized:
        false,

      contextCreated:
        false,

      authenticationUserId:
        null,

      enterpriseIdentityId:
        null
    };

    emit(
      "started",
      {
        requested_role:
          request.requested_role,

        registration_source:
          request
            .registration_source
      }
    );

    try {
      const providerEnvironment =
        getProviderEnvironment();

      const providerResult =
        await createProviderAccount(
          request
        );

      rollbackState.providerCreated =
        true;

      rollbackState
        .authenticationUserId =
        providerResult
          .authentication_user_id;

      emit(
        "provider-account-created",
        {
          authentication_user_id:
            providerResult
              .authentication_user_id,

          provider_id:
            providerEnvironment
              .provider_id
        }
      );

      const identityResult =
        await initializeEnterpriseIdentity(
          request,
          providerResult,
          correlationId
        );

      rollbackState
        .identityInitialized =
        true;

      rollbackState
        .enterpriseIdentityId =
        identityResult
          .enterprise_identity_id;

      emit(
        "identity-initialized",
        {
          authentication_user_id:
            providerResult
              .authentication_user_id,

          enterprise_identity_id:
            identityResult
              .enterprise_identity_id,

          requested_role:
            request.requested_role
        }
      );

      const context =
        createRegistrationContext(
          request,
          providerResult,
          identityResult,
          providerEnvironment,
          correlationId
        );

      rollbackState.contextCreated =
        true;

      const verificationRequired =
        context
          .email_verification_status ===
          "PENDING";

      const receipt =
        await createRegistrationReceipt(
          context,
          providerEnvironment,
          verificationRequired
        );

      const refreshedContext =
        getContextAuthority()
          ?.getContext?.() ||
        context;

      const result =
        immutableClone({
          registered:
            true,

          correlation_id:
            correlationId,

          authentication_user_id:
            providerResult
              .authentication_user_id,

          enterprise_identity_id:
            identityResult
              .enterprise_identity_id,

          requested_role:
            request.requested_role,

          registration_status:
            refreshedContext
              .registration_status,

          email_verification_status:
            refreshedContext
              .email_verification_status,

          verification_required:
            verificationRequired,

          registration_receipt_id:
            receipt
              .registration_receipt_id,

          requested_destination:
            request
              .requested_destination,

          provider_id:
            providerEnvironment
              .provider_id,

          completed_at:
            nowISO()
        });

      STATE.lastResult =
        result;

      emit(
        "succeeded",
        {
          registration_receipt_id:
            result
              .registration_receipt_id,

          requested_role:
            result.requested_role,

          verification_required:
            result
              .verification_required
        }
      );

      return result;
    } catch (rawError) {
      const error =
        normalizeRegistrationError(
          rawError,
          {
            correlation_id:
              correlationId,

            operation:
              "register"
          }
        );

      const rollback =
        await rollbackRegistration(
          rollbackState,
          error
        );

      STATE.lastError =
        immutableClone({
          code:
            cleanString(
              error.code
            ) ||
            "REGISTRATION_UNKNOWN_ERROR",

          user_message:
            cleanString(
              error.user_message
            ) ||
            "Enterprise registration could not be completed.",

          correlation_id:
            correlationId,

          rollback
        });

      emit(
        "failed",
        {
          error_code:
            STATE.lastError
              .code,

          rollback_complete:
            rollback
              .rollback_complete
        }
      );

      throw error;
    } finally {
      STATE.registrationInProgress =
        false;

      STATE.activeCorrelationId =
        null;
    }
  }

  function configure(
    next = {}
  ) {
    if (
      STATE.configurationLocked &&
      next.force_reload !== true
    ) {
      throw createRegistrationError(
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "Registration Service configuration is locked for the active runtime."
      );
    }

    assertCondition(
      next &&
      typeof next === "object" &&
      !Array.isArray(next),
      getErrorCodes()
        .CONFIGURATION_ERROR ||
        "REGISTRATION_CONFIGURATION_ERROR",
      "Registration Service configuration must be an object."
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
        "Registration Service client must be an object or null."
      );

      STATE.client =
        next.client;
    }

    if (
      next.registrationProvider !==
        undefined
    ) {
      validateProvider(
        next.registrationProvider
      );

      STATE.registrationProvider =
        next.registrationProvider;
    }

    if (
      next.identityInitializer !==
        undefined
    ) {
      assertCondition(
        next.identityInitializer ===
          null ||
        typeof next
          .identityInitializer ===
          "function",
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "identityInitializer must be a function or null."
      );

      STATE.identityInitializer =
        next.identityInitializer;
    }

    if (
      next.identityRollback !==
        undefined
    ) {
      assertCondition(
        next.identityRollback ===
          null ||
        typeof next
          .identityRollback ===
          "function",
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "identityRollback must be a function or null."
      );

      STATE.identityRollback =
        next.identityRollback;
    }

    if (
      next.identityRpc !== undefined
    ) {
      const identityRpc =
        cleanString(
          next.identityRpc
        );

      assertCondition(
        Boolean(identityRpc),
        getErrorCodes()
          .CONFIGURATION_ERROR ||
          "REGISTRATION_CONFIGURATION_ERROR",
        "identityRpc must be a non-empty string."
      );

      STATE.identityRpc =
        identityRpc;
    }

    if (
      next.requireEmailVerification !==
        undefined
    ) {
      STATE
        .requireEmailVerification =
        Boolean(
          next
            .requireEmailVerification
        );
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
        "Registration Service environment must be a non-empty string."
      );

      STATE.environment =
        environment;
    }

    if (
      next.registrationSource !==
        undefined
    ) {
      STATE.registrationSource =
        cleanString(
          next.registrationSource
        ) ||
        STATE.registrationSource;
    }

    if (
      next.requestedDestination !==
        undefined
    ) {
      STATE.requestedDestination =
        cleanString(
          next.requestedDestination
        ) ||
        STATE.requestedDestination;
    }

    STATE.configured =
      Boolean(
        getActiveProvider() &&
        (
          typeof STATE
            .identityInitializer ===
            "function" ||
          (
            getClient() &&
            typeof getClient().rpc ===
              "function"
          )
        )
      );

    if (
      next.lock !== false
    ) {
      STATE.configurationLocked =
        true;
    }

    emit(
      "configured",
      {
        configured:
          STATE.configured,

        environment:
          STATE.environment,

        provider_id:
          STATE.configured
            ? getActiveProviderId()
            : null
      }
    );

    global.dispatchEvent(
      new CustomEvent(
        "statscore:registration-runtime-ready",
        {
          detail:
            immutableClone({
              service_id:
                SERVICE_ID,

              version:
                VERSION,

              configured:
                STATE.configured,

              ready:
                STATE.configured
            })
        }
      )
    );

    return getConfiguration();
  }

  function getConfiguration() {
    let providerEnvironment =
      null;

    try {
      if (getActiveProvider()) {
        providerEnvironment =
          getProviderEnvironment();
      }
    } catch (_) {
      providerEnvironment =
        null;
    }

    return immutableClone({
      service_id:
        SERVICE_ID,

      version:
        VERSION,

      registration_version:
        REGISTRATION_VERSION,

      registration_contract_version:
        REGISTRATION_CONTRACT_VERSION,

      authentication_contract_version:
        AUTHENTICATION_CONTRACT_VERSION,

      configured:
        STATE.configured,

      configuration_locked:
        STATE.configurationLocked,

      environment:
        STATE.environment,

      registration_source:
        STATE.registrationSource,

      requested_destination:
        STATE.requestedDestination,

      identity_rpc:
        STATE.identityRpc,

      identity_initializer:
        typeof STATE
          .identityInitializer ===
          "function"
          ? "custom"
          : "rpc",

      identity_rollback_available:
        typeof STATE
          .identityRollback ===
          "function",

      require_email_verification:
        STATE
          .requireEmailVerification,

      provider_environment:
        providerEnvironment,

      registration_in_progress:
        STATE
          .registrationInProgress
    });
  }

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

    if (!getErrorsAuthority()) {
      findings.push(
        "REGISTRATION_ERRORS_UNAVAILABLE"
      );
    }

    if (!getContextAuthority()) {
      findings.push(
        "REGISTRATION_CONTEXT_UNAVAILABLE"
      );
    }

    if (!getReceiptsAuthority()) {
      findings.push(
        "REGISTRATION_RECEIPTS_UNAVAILABLE"
      );
    }

    let providerValid = false;

    try {
      validateProvider(
        getActiveProvider()
      );

      providerValid = true;
    } catch (_) {
      findings.push(
        "REGISTRATION_PROVIDER_INVALID"
      );
    }

    const identityRuntimeAvailable =
      typeof STATE.identityInitializer ===
        "function" ||
      Boolean(
        getClient() &&
        typeof getClient().rpc ===
          "function"
      );

    if (!identityRuntimeAvailable) {
      findings.push(
        "IDENTITY_INITIALIZATION_UNAVAILABLE"
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

      provider_valid:
        providerValid,

      identity_runtime_available:
        identityRuntimeAvailable,

      registration_in_progress:
        STATE
          .registrationInProgress,

      findings,

      checked_at:
        nowISO()
    });
  }

  const api = Object.freeze({
    service_id:
      SERVICE_ID,

    version:
      VERSION,

    registration_version:
      REGISTRATION_VERSION,

    registration_contract_version:
      REGISTRATION_CONTRACT_VERSION,

    authentication_contract_version:
      AUTHENTICATION_CONTRACT_VERSION,

    SUPPORTED_ROLES,

    configure,

    register,

    getConfiguration,

    getLastResult,

    getLastError,

    runHealthCheck
  });

  global.STATSCORE_REGISTRATION_SERVICE =
    api;

  global.STATScore =
    global.STATScore || {};

  global.STATScore
    .RegistrationService =
    api;

  global.dispatchEvent(
    new CustomEvent(
      "statscore:registration-service-loaded",
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
    "[STATS-CORE Registration Service] Loaded:",
    VERSION
  );
})(window); 
