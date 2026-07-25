/**
* STATS-CORE™ — Authentication Service
* PWP-001 — Authentication Constitutional Boundary
* PWP-002 — Controlled Demo Provider Integration
* Version 1.3.0
*
* Authority:
* - Article 1 remains the exclusive authentication orchestration authority.
* - Production authentication continues through Supabase when no custom
*   authentication provider is configured.
* - Controlled demonstration authentication may run through one optional
*   governed provider.
*
* Article 1 remains responsible for:
* - Request validation.
* - Provider authentication orchestration.
* - Identity resolution.
* - Role resolution and role-hint enforcement.
* - Entry-state resolution through a governed resolver or governed RPC.
* - Authorized destination resolution.
* - Initial Authentication Context publication.
* - Authentication receipt generation.
* - Error normalization.
* - Rollback.
* - Sign-out orchestration.
* - Authentication lifecycle events.
*
* Constitutional boundaries:
* - Identity queries use explicit governed column selections.
* - Role queries use explicit governed column selections.
* - Wildcard database selection is prohibited.
* - Identity does not manufacture Entry State.
* - Entry State must come from a configured resolver or governed RPC.
*
* Required load order:
* 1. statscore-authentication-errors.js
* 2. statscore-authentication-context.js
* 3. statscore-authentication-receipts.js
* 4. Optional: statscore-demo-authentication-provider.js
* 5. statscore-authentication-service.js
*/
(function initializeStatsCoreAuthenticationService(global) {
  "use strict";

  const errors =
    global.STATSCORE_AUTH_ERRORS;

  const contextService =
    global.STATSCORE_AUTH_CONTEXT;

  const receiptService =
    global.STATSCORE_AUTH_RECEIPTS;

  if (
    !errors ||
    !errors.ERROR_CODES
  ) {
    throw new Error(
      "Load statscore-authentication-errors.js before " +
        "statscore-authentication-service.js."
    );
  }

  if (
    !contextService ||
    typeof contextService.create !== "function" ||
    typeof contextService.publish !== "function" ||
    typeof contextService.clear !== "function"
  ) {
    throw new Error(
      "Load statscore-authentication-context.js before " +
        "statscore-authentication-service.js."
    );
  }

  if (
    !receiptService ||
    typeof receiptService.configure !== "function" ||
    typeof receiptService.write !== "function"
  ) {
    throw new Error(
      "Load statscore-authentication-receipts.js before " +
        "statscore-authentication-service.js."
    );
  }

  const {
    ERROR_CODES
  } = errors;

  const VERSION =
    "1.3.0";

  const DEFAULT_AUTHENTICATION_SOURCE =
    "supabase_password";

  const DEFAULT_PROVIDER_ID =
    "supabase";

  const DEFAULT_REQUESTED_DESTINATION =
    "role-aware-default";

  const DEFAULT_ENTRY_INTENT =
    "login";

  const DEFAULT_IDENTITY_SELECT =
    "id,auth_user_id,role_id,active";

  const DEFAULT_ROLE_SELECT =
    "id,role_name";

  const DEFAULT_ENTRY_STATE_RPC =
    "resolve_authentication_entry_state";

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
    new Set(
      Array.isArray(
        contextService.ALLOWED_ROLES
      )
        ? contextService.ALLOWED_ROLES
        : [
            "athlete",
            "parent",
            "coach",
            "counselor",
            "recruiter",
            "evaluator",
            "program",
            "trainer",
            "administrator"
          ]
    );

  const ALLOWED_ENTRY_INTENTS =
    new Set(
      Array.isArray(
        contextService.ALLOWED_ENTRY_INTENTS
      )
        ? contextService.ALLOWED_ENTRY_INTENTS
        : [
            "login"
          ]
    );

  const state = {
    client:
      null,

    authenticationProvider:
      null,

    authenticationSource:
      DEFAULT_AUTHENTICATION_SOURCE,

    identityResolver:
      null,

    roleResolver:
      null,

    entryStateResolver:
      null,

    routeResolver:
      null,

    sessionIdResolver:
      null,

    userTable:
      "sc_users",

    roleTable:
      "sc_roles",

    userAuthColumn:
      "auth_user_id",

    userRoleColumn:
      "role_id",

    roleIdColumn:
      "id",

    roleNameColumn:
      "role_name",

    activeUserColumn:
      "active",

    identitySelect:
      DEFAULT_IDENTITY_SELECT,

    roleSelect:
      DEFAULT_ROLE_SELECT,

    entryStateRpc:
      DEFAULT_ENTRY_STATE_RPC,

    allowMetadataRoleFallback:
      false,

    routes:
      {
        ...DEFAULT_ROUTES
      }
  };

  function cleanString(
    value
  ) {
    return typeof value ===
      "string"
      ? value.trim()
      : "";
  }

  function normalizeRole(
    value
  ) {
    if (
      typeof contextService.normalizeRole ===
      "function"
    ) {
      return contextService.normalizeRole(
        value
      );
    }

    const role =
      cleanString(
        value
      ).toLowerCase();

    return role ===
      "admin"
      ? "administrator"
      : role;
  }

  function createAuthenticationError(
    code,
    message,
    options
  ) {
    if (
      typeof errors.create ===
      "function"
    ) {
      return errors.create(
        code,
        message,
        options
      );
    }

    if (
      typeof errors.StatsCoreAuthenticationError ===
      "function"
    ) {
      return new errors.StatsCoreAuthenticationError(
        code,
        message,
        options
      );
    }

    const error =
      new Error(
        message ||
        "Authentication operation failed."
      );

    error.code =
      code;

    if (
      options &&
      options.cause
    ) {
      error.cause =
        options.cause;
    }

    return error;
  }

  function normalizeAuthenticationError(
    error,
    fallbackCode
  ) {
    if (
      typeof errors.normalize ===
      "function"
    ) {
      return errors.normalize(
        error,
        fallbackCode
      );
    }

    if (
      typeof errors.mapProviderError ===
      "function"
    ) {
      return errors.mapProviderError(
        error
      );
    }

    if (
      error &&
      cleanString(
        error.code
      )
    ) {
      return error;
    }

    return createAuthenticationError(
      fallbackCode ||
      ERROR_CODES.UNKNOWN_ERROR,
      undefined,
      {
        cause:
          error
      }
    );
  }

  function createCorrelationId() {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
      "function"
    ) {
      return global.crypto.randomUUID();
    }

    return (
      "auth-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(16)
        .slice(2)
    );
  }

  function validateSelectList(
    value,
    configurationName
  ) {
    const selection =
      cleanString(
        value
      );

    if (
      !selection
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        configurationName +
          " must be a non-empty explicit column selection."
      );
    }

    if (
      selection.includes("*")
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        configurationName +
          " must not contain wildcard selection."
      );
    }

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

    if (
      columns.length ===
        0 ||
      columns.some(
        function hasInvalidColumn(
          column
        ) {
          return (
            !column ||
            !/^[A-Za-z_][A-Za-z0-9_]*$/.test(
              column
            )
          );
        }
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        configurationName +
          " must contain only comma-separated database column names."
      );
    }

    if (
      new Set(
        columns
      ).size !==
      columns.length
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        configurationName +
          " must not contain duplicate columns."
      );
    }

    return columns.join(
      ","
    );
  }

  function assertSelectIncludes(
    selection,
    requiredColumns,
    configurationName
  ) {
    const selectedColumns =
      new Set(
        selection
          .split(",")
          .map(
            function cleanColumn(
              column
            ) {
              return cleanString(
                column
              );
            }
          )
      );

    const missingColumns =
      requiredColumns.filter(
        function findMissingColumn(
          column
        ) {
          return !selectedColumns.has(
            column
          );
        }
      );

    if (
      missingColumns.length >
      0
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        configurationName +
          " is missing required governed columns: " +
          missingColumns.join(", ") +
          "."
      );
    }
  }

  function validateIdentitySelect(
    value
  ) {
    const selection =
      validateSelectList(
        value,
        "identitySelect"
      );

    assertSelectIncludes(
      selection,
      [
        "id",
        state.userAuthColumn,
        state.userRoleColumn,
        state.activeUserColumn
      ],
      "identitySelect"
    );

    return selection;
  }

  function validateRoleSelect(
    value
  ) {
    const selection =
      validateSelectList(
        value,
        "roleSelect"
      );

    assertSelectIncludes(
      selection,
      [
        state.roleIdColumn,
        state.roleNameColumn
      ],
      "roleSelect"
    );

    return selection;
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

    const delimiter =
      url.includes("?")
        ? "&"
        : "?";

    return (
      url +
      delimiter +
      encodeURIComponent(
        name
      ) +
      "=" +
      encodeURIComponent(
        value
      )
    );
  }

  function validateAuthenticationProvider(
    provider
  ) {
    if (
      provider ===
      null
    ) {
      return null;
    }

    if (
      typeof provider !==
        "object" ||
      typeof provider.authenticate !==
        "function" ||
      typeof provider.signOut !==
        "function" ||
      typeof provider.getEnvironment !==
        "function"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "authenticationProvider must implement " +
          "authenticate, signOut, and getEnvironment."
      );
    }

    return provider;
  }

  function getActiveProviderEnvironment() {
    if (
      !state.authenticationProvider
    ) {
      return null;
    }

    let environment;

    try {
      environment =
        state.authenticationProvider.getEnvironment();
    } catch (
      error
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "The configured authentication provider " +
          "could not report its environment.",
        {
          cause:
            error
        }
      );
    }

    if (
      !environment ||
      typeof environment !==
        "object" ||
      Array.isArray(
        environment
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "The configured authentication provider " +
          "returned an invalid environment."
      );
    }

    return environment;
  }

  function getActiveProviderId() {
    if (
      !state.authenticationProvider
    ) {
      return DEFAULT_PROVIDER_ID;
    }

    const environment =
      getActiveProviderEnvironment();

    return (
      cleanString(
        environment.provider_id
      ) ||
      "custom"
    );
  }

  function resolveActiveAuthenticationSource() {
    if (
      state.authenticationProvider
    ) {
      const environment =
        getActiveProviderEnvironment();

      const source =
        cleanString(
          environment.authentication_source
        );

      if (
        !source
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "The configured authentication provider " +
            "did not report authentication_source."
        );
      }

      return source;
    }

    const source =
      cleanString(
        state.authenticationSource
      );

    if (
      !source
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "authenticationSource has not been configured."
      );
    }

    return source;
  }

  function assertAuthenticationRuntime() {
    if (
      state.authenticationProvider
    ) {
      validateAuthenticationProvider(
        state.authenticationProvider
      );

      resolveActiveAuthenticationSource();
    } else if (
      !state.client ||
      !state.client.auth ||
      typeof state.client.auth.signInWithPassword !==
        "function" ||
      typeof state.client.auth.signOut !==
        "function"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Supabase authentication client " +
          "has not been configured."
      );
    }

    if (
      !state.identityResolver ||
      !state.roleResolver ||
      !state.entryStateResolver
    ) {
      if (
        !state.client
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "A configured Supabase data client is required " +
            "for default identity, role, or entry-state resolution."
        );
      }
    }

    validateIdentitySelect(
      state.identitySelect
    );

    validateRoleSelect(
      state.roleSelect
    );

    if (
      !state.entryStateResolver &&
      !cleanString(
        state.entryStateRpc
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Entry State requires a governed entryStateResolver " +
          "or governed entryStateRpc."
      );
    }
  }

  async function authenticateWithActiveProvider(
    credentials
  ) {
    if (
      state.authenticationProvider
    ) {
      return state.authenticationProvider.authenticate(
        credentials
      );
    }

    return state.client.auth.signInWithPassword(
      credentials
    );
  }

  async function signOutActiveProvider() {
    if (
      state.authenticationProvider
    ) {
      return state.authenticationProvider.signOut();
    }

    return state.client.auth.signOut();
  }

  async function rollbackAuthenticatedSession() {
    const failures = {
      context_clear_error:
        null,

      provider_sign_out_error:
        null
    };

    try {
      contextService.clear();
    } catch (
      error
    ) {
      failures.context_clear_error =
        error;
    }

    try {
      const response =
        await signOutActiveProvider();

      if (
        response &&
        response.error
      ) {
        throw response.error;
      }
    } catch (
      error
    ) {
      failures.provider_sign_out_error =
        error;
    }

    return Object.freeze(
      failures
    );
  }

  function configure(
    options
  ) {
    const next =
      options &&
      typeof options ===
        "object"
        ? options
        : {};

    if (
      next.client !==
      undefined
    ) {
      state.client =
        next.client;
    }

    if (
      next.authenticationProvider !==
      undefined
    ) {
      state.authenticationProvider =
        validateAuthenticationProvider(
          next.authenticationProvider
        );
    }

    if (
      next.authenticationSource !==
      undefined
    ) {
      const source =
        cleanString(
          next.authenticationSource
        );

      if (
        !source
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "authenticationSource must be a non-empty string."
        );
      }

      state.authenticationSource =
        source;
    }

    const resolverKeys = [
      "identityResolver",
      "roleResolver",
      "entryStateResolver",
      "routeResolver",
      "sessionIdResolver"
    ];

    for (
      const key of
      resolverKeys
    ) {
      if (
        next[key] !==
        undefined
      ) {
        if (
          next[key] !==
            null &&
          typeof next[key] !==
            "function"
        ) {
          throw createAuthenticationError(
            ERROR_CODES.CONFIGURATION_ERROR,
            key +
              " must be a function or null."
          );
        }

        state[key] =
          next[key];
      }
    }

    const stringConfigurationKeys = [
      "userTable",
      "roleTable",
      "userAuthColumn",
      "userRoleColumn",
      "roleIdColumn",
      "roleNameColumn",
      "activeUserColumn"
    ];

    for (
      const key of
      stringConfigurationKeys
    ) {
      if (
        next[key] !==
        undefined
      ) {
        const configuredValue =
          cleanString(
            next[key]
          );

        if (
          !configuredValue
        ) {
          throw createAuthenticationError(
            ERROR_CODES.CONFIGURATION_ERROR,
            key +
              " must be a non-empty string."
          );
        }

        state[key] =
          configuredValue;
      }
    }

    if (
      next.identitySelect !==
      undefined
    ) {
      state.identitySelect =
        validateIdentitySelect(
          next.identitySelect
        );
    } else {
      state.identitySelect =
        validateIdentitySelect(
          state.identitySelect
        );
    }

    if (
      next.roleSelect !==
      undefined
    ) {
      state.roleSelect =
        validateRoleSelect(
          next.roleSelect
        );
    } else {
      state.roleSelect =
        validateRoleSelect(
          state.roleSelect
        );
    }

    if (
      next.entryStateRpc !==
      undefined
    ) {
      if (
        next.entryStateRpc ===
        null
      ) {
        state.entryStateRpc =
          null;
      } else {
        const entryStateRpc =
          cleanString(
            next.entryStateRpc
          );

        if (
          !entryStateRpc
        ) {
          throw createAuthenticationError(
            ERROR_CODES.CONFIGURATION_ERROR,
            "entryStateRpc must be a non-empty string or null."
          );
        }

        state.entryStateRpc =
          entryStateRpc;
      }
    }

    if (
      !state.entryStateResolver &&
      !cleanString(
        state.entryStateRpc
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Entry State requires a governed entryStateResolver " +
          "or governed entryStateRpc."
      );
    }

    if (
      next.allowMetadataRoleFallback !==
      undefined
    ) {
      if (
        typeof next.allowMetadataRoleFallback !==
        "boolean"
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "allowMetadataRoleFallback must be boolean."
        );
      }

      state.allowMetadataRoleFallback =
        next.allowMetadataRoleFallback;
    }

    if (
      next.routes !==
      undefined
    ) {
      if (
        !next.routes ||
        typeof next.routes !==
          "object" ||
        Array.isArray(
          next.routes
        )
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "routes must be an object."
        );
      }

      state.routes = {
        ...state.routes,
        ...next.routes
      };
    }

    receiptService.configure({
      client:
        state.client,

      table:
        cleanString(
          next.receiptTable
        ) ||
        undefined,

      rpc:
        cleanString(
          next.receiptRpc
        ) ||
        undefined
    });

    if (
      state.authenticationProvider
    ) {
      resolveActiveAuthenticationSource();
    }

    return getConfiguration();
  }

  function getConfiguration() {
    const environment =
      state.authenticationProvider
        ? getActiveProviderEnvironment()
        : null;

    return Object.freeze({
      configured:
        Boolean(
          state.authenticationProvider ||
          state.client
        ),

      authentication_source:
        resolveActiveAuthenticationSource(),

      authentication_provider:
        getActiveProviderId(),

      environment:
        environment
          ? Object.freeze({
              ...environment
            })
          : null,

      user_table:
        state.userTable,

      role_table:
        state.roleTable,

      identity_select:
        state.identitySelect,

      role_select:
        state.roleSelect,

      entry_state_authority:
        state.entryStateResolver
          ? "custom_resolver"
          : cleanString(
              state.entryStateRpc
            )
            ? "governed_rpc"
            : "unconfigured",

      entry_state_rpc:
        state.entryStateResolver
          ? null
          : cleanString(
              state.entryStateRpc
            ) ||
            null,

      allow_metadata_role_fallback:
        state.allowMetadataRoleFallback,

      routes:
        Object.freeze({
          ...state.routes
        })
    });
  }

  function validateRequest(
    request
  ) {
    if (
      !request ||
      typeof request !==
        "object" ||
      Array.isArray(
        request
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.INVALID_REQUEST,
        "Authentication request must be an object."
      );
    }

    const email =
      cleanString(
        request.email
      ).toLowerCase();

    const password =
      typeof request.password ===
        "string"
        ? request.password
        : "";

    const entryIntent =
      cleanString(
        request.entry_intent
      ) ||
      DEFAULT_ENTRY_INTENT;

    const requestedDestination =
      cleanString(
        request.requested_destination
      ) ||
      DEFAULT_REQUESTED_DESTINATION;

    const roleHint =
      normalizeRole(
        request.role_hint
      );

    if (
      !email ||
      !email.includes("@") ||
      !password
    ) {
      throw createAuthenticationError(
        ERROR_CODES.INVALID_REQUEST,
        "Email and password are required."
      );
    }

    if (
      !ALLOWED_ENTRY_INTENTS.has(
        entryIntent
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.INVALID_REQUEST,
        "Unsupported authentication entry_intent."
      );
    }

    if (
      roleHint &&
      !ALLOWED_ROLES.has(
        roleHint
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.UNSUPPORTED_ROLE,
        "The selected role is not supported."
      );
    }

    return Object.freeze({
      email,

      password,

      entry_intent:
        entryIntent,

      requested_destination:
        requestedDestination,

      role_hint:
        roleHint,

      remember_me:
        Boolean(
          request.remember_me
        )
    });
  }

  async function defaultIdentityResolver(
    authUser
  ) {
    if (
      !state.client ||
      typeof state.client.from !==
        "function"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Default identity resolution requires " +
          "a configured Supabase data client."
      );
    }

    const identitySelect =
      validateIdentitySelect(
        state.identitySelect
      );

    const response =
      await state.client
        .from(
          state.userTable
        )
        .select(
          identitySelect
        )
        .eq(
          state.userAuthColumn,
          authUser.id
        )
        .maybeSingle();

    if (
      response.error
    ) {
      throw response.error;
    }

    if (
      !response.data
    ) {
      throw createAuthenticationError(
        ERROR_CODES.UNKNOWN_IDENTITY,
        "No governed identity was found for the authenticated user."
      );
    }

    if (
      state.activeUserColumn &&
      Object.prototype.hasOwnProperty.call(
        response.data,
        state.activeUserColumn
      ) &&
      response.data[
        state.activeUserColumn
      ] ===
        false
    ) {
      throw createAuthenticationError(
        ERROR_CODES.ACCOUNT_DISABLED,
        "The authenticated identity is inactive."
      );
    }

    return response.data;
  }

  async function defaultRoleResolver(
    authUser,
    identity
  ) {
    let resolvedRole =
      "";

    const roleId =
      identity &&
      identity[
        state.userRoleColumn
      ];

    if (
      roleId
    ) {
      if (
        !state.client ||
        typeof state.client.from !==
          "function"
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "Default role resolution requires " +
            "a configured Supabase data client."
        );
      }

      const roleSelect =
        validateRoleSelect(
          state.roleSelect
        );

      const response =
        await state.client
          .from(
            state.roleTable
          )
          .select(
            roleSelect
          )
          .eq(
            state.roleIdColumn,
            roleId
          )
          .maybeSingle();

      if (
        response.error
      ) {
        throw response.error;
      }

      if (
        response.data
      ) {
        resolvedRole =
          normalizeRole(
            response.data[
              state.roleNameColumn
            ]
          );
      }
    }

    if (
      !resolvedRole &&
      state.allowMetadataRoleFallback
    ) {
      resolvedRole =
        normalizeRole(
          (
            authUser.app_metadata &&
            authUser.app_metadata.role
          ) ||
          (
            authUser.user_metadata &&
            authUser.user_metadata.role
          )
        );
    }

    if (
      !resolvedRole
    ) {
      throw createAuthenticationError(
        ERROR_CODES.UNKNOWN_ROLE,
        "No governed role was found for the authenticated identity."
      );
    }

    if (
      !ALLOWED_ROLES.has(
        resolvedRole
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.UNSUPPORTED_ROLE,
        "The authenticated role is not supported."
      );
    }

    return resolvedRole;
  }

  function normalizeEntryStateResult(
    value
  ) {
    let source =
      value;

    if (
      Array.isArray(
        source
      )
    ) {
      if (
        source.length !==
        1
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONFIGURATION_ERROR,
          "The governed Entry-State authority returned " +
            "an invalid record count."
        );
      }

      source =
        source[0];
    }

    if (
      !source ||
      typeof source !==
        "object" ||
      Array.isArray(
        source
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "The governed Entry-State authority returned " +
          "an invalid response."
      );
    }

    const firstTime =
      typeof source.first_time ===
        "boolean"
        ? source.first_time
        : typeof source.is_first_time ===
            "boolean"
          ? source.is_first_time
          : null;

    if (
      firstTime ===
      null
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "The governed Entry-State authority must return " +
          "a boolean first_time value."
      );
    }

    return Object.freeze({
      first_time:
        firstTime,

      snapshot_id:
        cleanString(
          source.snapshot_id
        ) ||
        null
    });
  }

  async function defaultEntryStateResolver(
    authUser,
    identity,
    role
  ) {
    if (
      !state.client ||
      typeof state.client.rpc !==
        "function"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Default Entry-State resolution requires " +
          "a configured Supabase RPC client."
      );
    }

    const entryStateRpc =
      cleanString(
        state.entryStateRpc
      );

    if (
      !entryStateRpc
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Entry State requires a governed entryStateRpc " +
          "when no custom entryStateResolver is configured."
      );
    }

    const response =
      await state.client.rpc(
        entryStateRpc,
        {
          p_auth_user_id:
            authUser.id,

          p_identity_id:
            identity &&
            identity.id
              ? identity.id
              : null,

          p_role:
            role
        }
      );

    if (
      response &&
      response.error
    ) {
      throw response.error;
    }

    return normalizeEntryStateResult(
      response
        ? response.data
        : null
    );
  }

  async function defaultRouteResolver(
    routingInput
  ) {
    const {
      role,
      entryState
    } = routingInput;

    if (
      role ===
      "administrator"
    ) {
      return state.routes.administrator;
    }

    if (
      role ===
      "athlete"
    ) {
      if (
        entryState.first_time
      ) {
        return state.routes.first_time_athlete;
      }

      if (
        !cleanString(
          entryState.snapshot_id
        )
      ) {
        throw createAuthenticationError(
          ERROR_CODES.ROUTING_DENIED,
          "A returning athlete requires snapshot_id."
        );
      }

      return appendQueryParameter(
        state.routes.returning_athlete,
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
          state.routes.first_time_professional,
          "role",
          role
        );
      }

      return state.routes.returning_professional;
    }

    throw createAuthenticationError(
      ERROR_CODES.ROUTING_DENIED,
      "No authorized authentication destination exists for this role."
    );
  }

  function defaultSessionIdResolver(
    authSession
  ) {
    const sessionId =
      cleanString(
        authSession &&
        (
          authSession.session_id ||
          authSession.id
        )
      );

    if (
      !sessionId
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONTEXT_FAILURE,
        "The authentication provider did not expose " +
          "a valid session identifier."
      );
    }

    return sessionId;
  }

  async function authenticate(
    request
  ) {
    assertAuthenticationRuntime();

    const normalizedRequest =
      validateRequest(
        request
      );

    const correlationId =
      createCorrelationId();

    const authenticationSource =
      resolveActiveAuthenticationSource();

    const providerId =
      getActiveProviderId();

    let authUser =
      null;

    let authSession =
      null;

    let resolvedRole =
      null;

    let resolvedDestination =
      null;

    try {
      const providerResponse =
        await authenticateWithActiveProvider({
          email:
            normalizedRequest.email,

          password:
            normalizedRequest.password
        });

      if (
        providerResponse &&
        providerResponse.error
      ) {
        throw providerResponse.error;
      }

      authUser =
        providerResponse &&
        providerResponse.data &&
        providerResponse.data.user;

      authSession =
        providerResponse &&
        providerResponse.data &&
        providerResponse.data.session;

      if (
        !authUser ||
        !cleanString(
          authUser.id
        ) ||
        !authSession
      ) {
        throw createAuthenticationError(
          ERROR_CODES.AUTHENTICATION_UNAVAILABLE,
          "The active authentication provider did not " +
            "return a valid user and session."
        );
      }

      const identity =
        await (
          state.identityResolver ||
          defaultIdentityResolver
        )(
          authUser,
          {
            client:
              state.client,

            request:
              normalizedRequest
          }
        );

      resolvedRole =
        normalizeRole(
          await (
            state.roleResolver ||
            defaultRoleResolver
          )(
            authUser,
            identity,
            {
              client:
                state.client,

              request:
                normalizedRequest
            }
          )
        );

      if (
        !ALLOWED_ROLES.has(
          resolvedRole
        )
      ) {
        throw createAuthenticationError(
          ERROR_CODES.UNSUPPORTED_ROLE,
          "The resolved role is not supported."
        );
      }

      if (
        normalizedRequest.role_hint &&
        normalizedRequest.role_hint !==
          resolvedRole
      ) {
        throw createAuthenticationError(
          ERROR_CODES.ROUTING_DENIED,
          "The selected login role does not match " +
            "the authenticated role authority."
        );
      }

      const entryState =
        normalizeEntryStateResult(
          await (
            state.entryStateResolver ||
            defaultEntryStateResolver
          )(
            authUser,
            identity,
            resolvedRole,
            {
              client:
                state.client,

              request:
                normalizedRequest
            }
          )
        );

      resolvedDestination =
        await (
          state.routeResolver ||
          defaultRouteResolver
        )({
          authUser,

          identity,

          role:
            resolvedRole,

          entryState,

          request:
            normalizedRequest
        });

      resolvedDestination =
        cleanString(
          resolvedDestination
        );

      if (
        !resolvedDestination
      ) {
        throw createAuthenticationError(
          ERROR_CODES.ROUTING_DENIED,
          "The route resolver did not return an authorized destination."
        );
      }

      const sessionId =
        cleanString(
          await (
            state.sessionIdResolver ||
            defaultSessionIdResolver
          )(
            authSession,
            authUser,
            {
              client:
                state.client,

              request:
                normalizedRequest
            }
          )
        );

      if (
        !sessionId
      ) {
        throw createAuthenticationError(
          ERROR_CODES.CONTEXT_FAILURE,
          "The session resolver did not return a valid session_id."
        );
      }

      const authenticationContext =
        contextService.create({
          session_id:
            sessionId,

          user_id:
            authUser.id,

          role:
            resolvedRole,

          entry_intent:
            normalizedRequest.entry_intent,

          authenticated_at:
            new Date().toISOString(),

          authentication_source:
            authenticationSource,

          requested_destination:
            resolvedDestination
        });

      await receiptService.write({
        outcome:
          "SUCCESS",

        session_id:
          authenticationContext.session_id,

        user_id:
          authenticationContext.user_id,

        role:
          authenticationContext.role,

        authentication_source:
          authenticationContext.authentication_source,

        requested_destination:
          normalizedRequest.requested_destination,

        resolved_destination:
          resolvedDestination,

        error_code:
          null,

        correlation_id:
          correlationId,

        metadata:
          Object.freeze({
            provider:
              providerId,

            entry_intent:
              authenticationContext.entry_intent
          })
      });

      contextService.publish(
        authenticationContext
      );

      const result =
        Object.freeze({
          authenticated:
            true,

          context:
            authenticationContext,

          destination:
            resolvedDestination,

          correlation_id:
            correlationId
        });

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
    } catch (
      rawError
    ) {
      const normalizedError =
        normalizeAuthenticationError(
          rawError,
          ERROR_CODES.AUTHENTICATION_UNAVAILABLE
        );

      let receiptFailure =
        null;

      try {
        await receiptService.write({
          outcome:
            "FAILURE",

          session_id:
            null,

          user_id:
            authUser
              ? authUser.id
              : null,

          role:
            resolvedRole,

          authentication_source:
            authenticationSource,

          requested_destination:
            normalizedRequest.requested_destination,

          resolved_destination:
            resolvedDestination,

          error_code:
            normalizedError.code,

          correlation_id:
            correlationId,

          metadata:
            Object.freeze({
              provider:
                providerId,

              entry_intent:
                normalizedRequest.entry_intent
            })
        });
      } catch (
        error
      ) {
        receiptFailure =
          error;
      }

      const rollbackFailures =
        authSession
          ? await rollbackAuthenticatedSession()
          : Object.freeze({
              context_clear_error:
                null,

              provider_sign_out_error:
                null
            });

      if (
        !authSession
      ) {
        try {
          contextService.clear();
        } catch (
          contextClearError
        ) {
          void contextClearError;
        }
      }

      if (
        receiptFailure
      ) {
        throw createAuthenticationError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Authentication failed and the required " +
            "authentication receipt could not be written.",
          {
            cause:
              receiptFailure,

            details:
              Object.freeze({
                original_error_code:
                  normalizedError.code,

                context_clear_failed:
                  Boolean(
                    rollbackFailures.context_clear_error
                  ),

                provider_sign_out_failed:
                  Boolean(
                    rollbackFailures.provider_sign_out_error
                  )
              })
          }
        );
      }

      global.dispatchEvent(
        new CustomEvent(
          "statscore:authentication-failed",
          {
            detail:
              Object.freeze({
                error:
                  typeof normalizedError.toJSON ===
                    "function"
                    ? normalizedError.toJSON()
                    : {
                        code:
                          normalizedError.code,

                        message:
                          normalizedError.message
                      },

                correlation_id:
                  correlationId
              })
          }
        )
      );

      throw normalizedError;
    }
  }

  async function signOut() {
    assertAuthenticationRuntime();

    let providerFailure =
      null;

    let contextFailure =
      null;

    try {
      const providerResponse =
        await signOutActiveProvider();

      if (
        providerResponse &&
        providerResponse.error
      ) {
        throw providerResponse.error;
      }
    } catch (
      error
    ) {
      providerFailure =
        error;
    }

    try {
      contextService.clear();
    } catch (
      error
    ) {
      contextFailure =
        error;
    }

    if (
      providerFailure
    ) {
      throw normalizeAuthenticationError(
        providerFailure,
        ERROR_CODES.AUTHENTICATION_UNAVAILABLE
      );
    }

    if (
      contextFailure
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONTEXT_FAILURE,
        "The provider session ended, but the Initial " +
          "Authentication Context could not be cleared.",
        {
          cause:
            contextFailure
        }
      );
    }

    global.dispatchEvent(
      new CustomEvent(
        "statscore:authentication-signed-out"
      )
    );

    return Object.freeze({
      signed_out:
        true
    });
  }

  global.STATSCORE_AUTH_SERVICE =
    Object.freeze({
      version:
        VERSION,

      configure,

      getConfiguration,

      authenticate,

      signOut
    });
})(window); 
