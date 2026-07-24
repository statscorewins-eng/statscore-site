/**
* STATS-CORE™ — Enterprise Authentication Service
* Article 1 / PWP-001
* Version 1.2.0
*
* Production responsibilities:
* - Authenticate credentials through Supabase Auth.
* - Resolve governed STATS-CORE identity and role authority.
* - Consume governed entry-state facts.
* - Resolve the authorized post-authentication route.
* - Publish the seven-field Initial Authentication Context.
* - Write authentication receipts through a governed server-side path.
*
* This service does not:
* - Manufacture athlete snapshot authority.
* - Manufacture professional onboarding state.
* - Manufacture runtime workspace context.
* - Treat browser metadata as authoritative identity.
* - Treat user_id as session_id.
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
    !contextService ||
    !receiptService
  ) {
    throw new Error(
      "Load authentication errors, context, and receipts before " +
        "statscore-authentication-service.js"
    );
  }

  const {
    ERROR_CODES,
    StatsCoreAuthenticationError
  } = errors;

  const SUPPORTED_ROLES =
    new Set(
      Array.isArray(
        contextService.ALLOWED_ROLES
      )
        ? contextService.ALLOWED_ROLES
        : []
    );

  const ALLOWED_ENTRY_INTENTS =
    new Set(
      Array.isArray(
        contextService.ALLOWED_ENTRY_INTENTS
      )
        ? contextService.ALLOWED_ENTRY_INTENTS
        : []
    );

  const NON_ATHLETE_ROLES =
    new Set([
      "parent",
      "coach",
      "counselor",
      "recruiter",
      "evaluator",
      "program",
      "trainer"
    ]);

  const ALLOWED_AUTHENTICATION_SOURCES =
    new Set([
      "supabase_password",
      "supabase_magic_link",
      "supabase_oauth",
      "demo_isolated"
    ]);

  const REQUIRED_ROUTE_KEYS =
    Object.freeze([
      "first_time_athlete",
      "returning_athlete",
      "first_time_professional",
      "returning_professional",
      "administrator"
    ]);

  const DEFAULT_ROUTES =
    Object.freeze({
      first_time_athlete:
        "snapshot-intake.html?new=1&role=athlete&from=login&next=athlete-dashboard.html",

      returning_athlete:
        "athlete-dashboard.html",

      first_time_professional:
        "role-dashboard-intake.html?from=login&next=role-dashboard.html",

      returning_professional:
        "role-dashboard.html",

      administrator:
        "system.html"
    });

  const DEFAULT_IDENTITY_SELECT =
    "id,auth_user_id,role_id,active";

  const DEFAULT_ROLE_SELECT =
    "id,role_name";

  const state = {
    client:
      null,

    authenticationSource:
      "supabase_password",

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

    receiptWriter:
      null,

    entryStateRpc:
      null,

    receiptRpc:
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

    identityPrimaryKeyColumn:
      "id",

    identitySelect:
      DEFAULT_IDENTITY_SELECT,

    roleSelect:
      DEFAULT_ROLE_SELECT,

    allowMetadataRoleFallback:
      false,

    routes: {
      ...DEFAULT_ROUTES
    },

    authenticationPromise:
      null
  };

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function normalizeRole(value) {
    return contextService.normalizeRole(
      value
    );
  }

  function createAuthenticationError(
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

  function normalizeAuthenticationError(
    rawError
  ) {
    if (
      rawError instanceof
      StatsCoreAuthenticationError
    ) {
      return rawError;
    }

    return errors.normalize(
      rawError,
      ERROR_CODES.PROVIDER_FAILURE,
      "The authentication provider operation failed.",
      {
        preserve_message:
          true
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
      `corr_${Date.now()}_` +
      Math.random()
        .toString(16)
        .slice(2)
    );
  }

  function assertClient() {
    if (
      !state.client ||
      !state.client.auth ||
      typeof state.client.auth
        .signInWithPassword !==
        "function"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Supabase authentication client has not been configured."
      );
    }
  }

  function assertSupportedAuthenticationSource(
    value
  ) {
    const source =
      cleanString(
        value
      );

    if (
      !ALLOWED_AUTHENTICATION_SOURCES.has(
        source
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `Unsupported authentication source: ${
          source || "empty"
        }`
      );
    }

    return source;
  }

  function assertAllowedEntryIntent(
    value
  ) {
    const entryIntent =
      cleanString(
        value
      );

    if (!entryIntent) {
      throw createAuthenticationError(
        ERROR_CODES.REQUEST_VALIDATION_FAILURE,
        "entry_intent is required."
      );
    }

    if (
      ALLOWED_ENTRY_INTENTS.size === 0
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "The authentication context service does not expose an authorized entry-intent vocabulary."
      );
    }

    if (
      !ALLOWED_ENTRY_INTENTS.has(
        entryIntent
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.REQUEST_VALIDATION_FAILURE,
        `Unsupported entry_intent: ${entryIntent}`
      );
    }

    return entryIntent;
  }

  function assertSafeIdentifier(
    value,
    label
  ) {
    const candidate =
      cleanString(
        value
      );

    if (!candidate) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} is required.`
      );
    }

    if (
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(
        candidate
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} contains unsupported characters.`
      );
    }

    return candidate;
  }

  function assertSafeSelect(
    value,
    label
  ) {
    const candidate =
      cleanString(
        value
      );

    if (!candidate) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} is required.`
      );
    }

    if (
      candidate.includes("*") ||
      !/^[A-Za-z0-9_,\s.]+$/.test(
        candidate
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} must contain an explicit, safe column list.`
      );
    }

    return candidate
      .split(",")
      .map(
        function normalizeColumn(
          column
        ) {
          return column.trim();
        }
      )
      .filter(Boolean)
      .join(",");
  }

  function containsUnsafeScheme(
    value
  ) {
    return /^[A-Za-z][A-Za-z0-9+.-]*:/i.test(
      value
    );
  }

  function normalizeLocalRoute(
    value,
    label
  ) {
    const candidate =
      cleanString(
        value
      );

    if (!candidate) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} is required.`
      );
    }

    const decodedCandidate =
      (function safelyDecode() {
        try {
          return decodeURIComponent(
            candidate
          );
        } catch (_error) {
          return candidate;
        }
      })();

    if (
      containsUnsafeScheme(
        candidate
      ) ||
      containsUnsafeScheme(
        decodedCandidate
      ) ||
      candidate.startsWith("//") ||
      decodedCandidate.startsWith("//") ||
      candidate.includes("\\") ||
      decodedCandidate.includes("\\") ||
      candidate.includes("\u0000") ||
      decodedCandidate.includes("\u0000") ||
      candidate.includes("..") ||
      decodedCandidate.includes("..")
    ) {
      throw createAuthenticationError(
        ERROR_CODES.ROUTING_FAILURE,
        `${label} must be a safe local application route.`
      );
    }

    return candidate.replace(
      /^\.\/+/,
      ""
    );
  }

  function normalizeRequestedDestination(
    value
  ) {
    const candidate =
      cleanString(
        value
      ) ||
      "role-aware-default";

    if (
      candidate ===
      "role-aware-default"
    ) {
      return candidate;
    }

    return normalizeLocalRoute(
      candidate,
      "requested_destination"
    );
  }

  function validateRoutes(routes) {
    const candidate =
      routes &&
      typeof routes === "object"
        ? routes
        : {};

    const validated =
      {};

    for (
      const key of
      REQUIRED_ROUTE_KEYS
    ) {
      validated[key] =
        normalizeLocalRoute(
          candidate[key],
          `routes.${key}`
        );
    }

    return Object.freeze(
      validated
    );
  }

  function configure(options) {
    const next =
      options || {};

    if (next.client) {
      state.client =
        next.client;
    }

    if (
      cleanString(
        next.authenticationSource
      )
    ) {
      state.authenticationSource =
        assertSupportedAuthenticationSource(
          next.authenticationSource
        );
    } else {
      state.authenticationSource =
        assertSupportedAuthenticationSource(
          state.authenticationSource
        );
    }

    for (
      const key of [
        "identityResolver",
        "roleResolver",
        "entryStateResolver",
        "routeResolver",
        "sessionIdResolver",
        "receiptWriter"
      ]
    ) {
      if (
        typeof next[key] ===
        "function"
      ) {
        state[key] =
          next[key];
      }
    }

    if (
      cleanString(
        next.entryStateRpc
      )
    ) {
      state.entryStateRpc =
        assertSafeIdentifier(
          next.entryStateRpc,
          "entryStateRpc"
        );
    }

    if (
      cleanString(
        next.receiptRpc
      )
    ) {
      state.receiptRpc =
        assertSafeIdentifier(
          next.receiptRpc,
          "receiptRpc"
        );
    }

    const identifierConfiguration = {
      userTable:
        "userTable",

      roleTable:
        "roleTable",

      userAuthColumn:
        "userAuthColumn",

      userRoleColumn:
        "userRoleColumn",

      roleIdColumn:
        "roleIdColumn",

      roleNameColumn:
        "roleNameColumn",

      activeUserColumn:
        "activeUserColumn",

      identityPrimaryKeyColumn:
        "identityPrimaryKeyColumn"
    };

    for (
      const [stateKey, label] of
      Object.entries(
        identifierConfiguration
      )
    ) {
      if (
        cleanString(
          next[stateKey]
        )
      ) {
        state[stateKey] =
          assertSafeIdentifier(
            next[stateKey],
            label
          );
      }
    }

    if (
      cleanString(
        next.identitySelect
      )
    ) {
      state.identitySelect =
        assertSafeSelect(
          next.identitySelect,
          "identitySelect"
        );
    }

    if (
      cleanString(
        next.roleSelect
      )
    ) {
      state.roleSelect =
        assertSafeSelect(
          next.roleSelect,
          "roleSelect"
        );
    }

    if (
      typeof next.allowMetadataRoleFallback ===
      "boolean"
    ) {
      state.allowMetadataRoleFallback =
        next.allowMetadataRoleFallback;
    }

    const mergedRoutes = {
      ...state.routes,

      ...(
        next.routes &&
        typeof next.routes === "object"
          ? next.routes
          : {}
      )
    };

    state.routes = {
      ...validateRoutes(
        mergedRoutes
      )
    };

    if (
      typeof state.receiptWriter !==
        "function" &&
      !state.receiptRpc
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "A governed receiptWriter or receiptRpc is required. " +
          "Direct browser table receipt writes are not authorized."
      );
    }

    if (state.receiptRpc) {
      receiptService.configure({
        client:
          state.client,

        rpc:
          state.receiptRpc
      });
    }

    return getConfiguration();
  }

  function getConfiguration() {
    return Object.freeze({
      configured:
        Boolean(
          state.client
        ),

      authentication_source:
        state.authenticationSource,

      user_table:
        state.userTable,

      role_table:
        state.roleTable,

      entry_state_rpc:
        state.entryStateRpc,

      receipt_rpc:
        state.receiptRpc,

      custom_receipt_writer:
        typeof state.receiptWriter ===
        "function",

      custom_entry_state_resolver:
        typeof state.entryStateResolver ===
        "function",

      allow_metadata_role_fallback:
        state.allowMetadataRoleFallback,

      authentication_in_progress:
        Boolean(
          state.authenticationPromise
        ),

      routes:
        Object.freeze({
          ...state.routes
        })
    });
  }

  function validateRequest(request) {
    const source =
      request &&
      typeof request === "object"
        ? request
        : {};

    const email =
      cleanString(
        source.email
      ).toLowerCase();

    const password =
      typeof source.password ===
      "string"
        ? source.password
        : "";

    if (
      !email ||
      !email.includes("@") ||
      !password
    ) {
      throw createAuthenticationError(
        ERROR_CODES.REQUEST_VALIDATION_FAILURE,
        "A valid email address and password are required."
      );
    }

    const entryIntent =
      assertAllowedEntryIntent(
        cleanString(
          source.entry_intent
        ) ||
        "login"
      );

    return Object.freeze({
      email,

      password,

      entry_intent:
        entryIntent,

      requested_destination:
        normalizeRequestedDestination(
          source.requested_destination
        ),

      role_hint:
        normalizeRole(
          source.role_hint
        )
    });
  }

  async function defaultIdentityResolver(
    authUser
  ) {
    const response =
      await state.client
        .from(
          state.userTable
        )
        .select(
          state.identitySelect
        )
        .eq(
          state.userAuthColumn,
          authUser.id
        )
        .maybeSingle();

    if (response.error) {
      throw response.error;
    }

    if (!response.data) {
      throw createAuthenticationError(
        ERROR_CODES.IDENTITY_FAILURE,
        "No governed STATS-CORE identity was found for the authenticated user."
      );
    }

    if (
      state.activeUserColumn &&
      Object.prototype
        .hasOwnProperty.call(
          response.data,
          state.activeUserColumn
        ) &&
      response.data[
        state.activeUserColumn
      ] === false
    ) {
      throw createAuthenticationError(
        ERROR_CODES.AUTHORIZATION_FAILURE,
        "The authenticated STATS-CORE identity is inactive."
      );
    }

    return response.data;
  }

  async function defaultRoleResolver(
    authUser,
    identity
  ) {
    let role =
      "";

    const roleId =
      identity &&
      identity[
        state.userRoleColumn
      ];

    if (roleId) {
      const response =
        await state.client
          .from(
            state.roleTable
          )
          .select(
            state.roleSelect
          )
          .eq(
            state.roleIdColumn,
            roleId
          )
          .maybeSingle();

      if (response.error) {
        throw response.error;
      }

      if (response.data) {
        role =
          normalizeRole(
            response.data[
              state.roleNameColumn
            ]
          );
      }
    }

    if (
      !role &&
      state.allowMetadataRoleFallback
    ) {
      role =
        normalizeRole(
          authUser.app_metadata &&
          authUser.app_metadata.role
            ? authUser
              .app_metadata
              .role
            : (
              authUser.user_metadata &&
              authUser.user_metadata.role
            )
        );
    }

    if (!role) {
      throw createAuthenticationError(
        ERROR_CODES.ROLE_FAILURE,
        "No governed STATS-CORE role was resolved for the authenticated identity."
      );
    }

    if (
      !SUPPORTED_ROLES.has(
        role
      )
    ) {
      throw createAuthenticationError(
        ERROR_CODES.ROLE_FAILURE,
        `The resolved STATS-CORE role is unsupported: ${role}`
      );
    }

    return role;
  }

  function normalizeEntryState(
    value,
    role
  ) {
    if (
      !value ||
      typeof value !== "object"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.ENTRY_STATE_FAILURE,
        "Governed entry-state resolution returned no result."
      );
    }

    if (
      typeof value.first_time !==
      "boolean"
    ) {
      throw createAuthenticationError(
        ERROR_CODES.ENTRY_STATE_FAILURE,
        "Governed entry-state resolution must return first_time as a boolean."
      );
    }

    const snapshotId =
      cleanString(
        value.snapshot_id
      ) ||
      null;

    if (
      role === "athlete" &&
      value.first_time === false &&
      !snapshotId
    ) {
      throw createAuthenticationError(
        ERROR_CODES.ENTRY_STATE_FAILURE,
        "A returning athlete requires a governed snapshot_id."
      );
    }

    return Object.freeze({
      first_time:
        value.first_time,

      snapshot_id:
        snapshotId
    });
  }

  async function defaultEntryStateResolver(
    authUser,
    identity,
    role
  ) {
    if (
      role ===
      "administrator"
    ) {
      return Object.freeze({
        first_time:
          false,

        snapshot_id:
          null
      });
    }

    if (
      !state.entryStateRpc
    ) {
      throw createAuthenticationError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "A governed entryStateResolver or entryStateRpc is required."
      );
    }

    const identityId =
      identity &&
      identity[
        state.identityPrimaryKeyColumn
      ];

    const response =
      await state.client.rpc(
        state.entryStateRpc,
        {
          p_auth_user_id:
            authUser.id,

          p_identity_id:
            identityId || null,

          p_role:
            role
        }
      );

    if (response.error) {
      throw response.error;
    }

    return normalizeEntryState(
      response.data,
      role
    );
  }

  function appendQuery(
    url,
    name,
    value
  ) {
    if (!value) {
      return url;
    }

    const safeUrl =
      normalizeLocalRoute(
        url,
        "route"
      );

    const delimiter =
      safeUrl.includes("?")
        ? "&"
        : "?";

    return (
      `${safeUrl}${delimiter}` +
      `${encodeURIComponent(name)}=` +
      `${encodeURIComponent(value)}`
    );
  }

  async function defaultRouteResolver({
    role,
    entryState
  }) {
    if (
      role ===
      "administrator"
    ) {
      return normalizeLocalRoute(
        state.routes.administrator,
        "administrator route"
      );
    }

    if (
      role ===
      "athlete"
    ) {
      if (
        entryState.first_time
      ) {
        return normalizeLocalRoute(
          state.routes.first_time_athlete,
          "first-time athlete route"
        );
      }

      return appendQuery(
        state.routes.returning_athlete,
        "snapshot_id",
        entryState.snapshot_id
      );
    }

    if (
      NON_ATHLETE_ROLES.has(
        role
      )
    ) {
      if (
        entryState.first_time
      ) {
        return appendQuery(
          state.routes
            .first_time_professional,
          "role",
          role
        );
      }

      return normalizeLocalRoute(
        state.routes
          .returning_professional,
        "returning professional route"
      );
    }

    throw createAuthenticationError(
      ERROR_CODES.ROUTING_FAILURE,
      `No authorized authentication route exists for role: ${
        role || "empty"
      }`
    );
  }

  function decodeJwtPayload(
    accessToken
  ) {
    const token =
      cleanString(
        accessToken
      );

    if (!token) {
      return null;
    }

    const sections =
      token.split(".");

    if (
      sections.length !== 3
    ) {
      return null;
    }

    try {
      const normalized =
        sections[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");

      const padded =
        normalized +
        "=".repeat(
          (
            4 -
            normalized.length %
              4
          ) %
            4
        );

      const json =
        global.atob(
          padded
        );

      return JSON.parse(
        json
      );
    } catch (_error) {
      return null;
    }
  }

  function defaultSessionIdResolver(
    authSession
  ) {
    const directSessionId =
      cleanString(
        authSession &&
        (
          authSession.session_id ||
          authSession.id
        )
      );

    if (
      directSessionId
    ) {
      return directSessionId;
    }

    const tokenPayload =
      decodeJwtPayload(
        authSession &&
        authSession.access_token
      );

    const claimSessionId =
      cleanString(
        tokenPayload &&
        (
          tokenPayload.session_id ||
          tokenPayload.sid
        )
      );

    if (
      claimSessionId
    ) {
      return claimSessionId;
    }

    throw createAuthenticationError(
      ERROR_CODES.SESSION_FAILURE,
      "Authentication provider did not expose a governed session identifier."
    );
  }

  async function writeReceipt(
    payload
  ) {
    if (
      typeof state.receiptWriter ===
      "function"
    ) {
      return state.receiptWriter(
        Object.freeze({
          ...payload
        }),
        {
          client:
            state.client,

          rpc:
            state.receiptRpc
        }
      );
    }

    if (
      !state.receiptRpc
    ) {
      throw createAuthenticationError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Governed receipt RPC has not been configured."
      );
    }

    return receiptService.write(
      payload
    );
  }

  async function rollbackAuthenticatedSession() {
    let contextClearError =
      null;

    let providerSignOutError =
      null;

    try {
      contextService.clear();
    } catch (error) {
      contextClearError =
        error;
    }

    if (
      state.client &&
      state.client.auth &&
      typeof state.client.auth.signOut ===
        "function"
    ) {
      try {
        const response =
          await state.client.auth
            .signOut();

        if (
          response &&
          response.error
        ) {
          providerSignOutError =
            response.error;
        }
      } catch (error) {
        providerSignOutError =
          error;
      }
    }

    if (
      contextClearError ||
      providerSignOutError
    ) {
      dispatchEventSafely(
        "statscore:authentication-rollback-failed",
        Object.freeze({
          context_clear_failed:
            Boolean(
              contextClearError
            ),

          provider_sign_out_failed:
            Boolean(
              providerSignOutError
            )
        })
      );
    }

    return Object.freeze({
      context_cleared:
        !contextClearError,

      provider_signed_out:
        !providerSignOutError
    });
  }

  function dispatchEventSafely(
    eventName,
    detail
  ) {
    try {
      global.dispatchEvent(
        new CustomEvent(
          eventName,
          detail === undefined
            ? undefined
            : {
              detail
            }
        )
      );
    } catch (_error) {
      /*
       * Event publication must not alter authentication disposition.
       */
    }
  }

  async function performAuthentication(
    request
  ) {
    assertClient();

    /*
     * Request validation, including entry_intent validation,
     * occurs before provider authentication begins.
     */
    const normalizedRequest =
      validateRequest(
        request
      );

    const correlationId =
      createCorrelationId();

    let authUser =
      null;

    let authSession =
      null;

    let role =
      null;

    let destination =
      null;

    let successReceiptWritten =
      false;

    try {
      const response =
        await state.client.auth
          .signInWithPassword({
            email:
              normalizedRequest.email,

            password:
              normalizedRequest.password
          });

      if (
        response.error
      ) {
        throw response.error;
      }

      authUser =
        response.data &&
        response.data.user;

      authSession =
        response.data &&
        response.data.session;

      if (
        !authUser ||
        !authSession
      ) {
        throw createAuthenticationError(
          ERROR_CODES.SESSION_FAILURE,
          "Authentication provider did not return a valid user and session."
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

      role =
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
        !SUPPORTED_ROLES.has(
          role
        )
      ) {
        throw createAuthenticationError(
          ERROR_CODES.ROLE_FAILURE,
          `The resolved STATS-CORE role is unsupported: ${
            role || "empty"
          }`
        );
      }

      if (
        normalizedRequest.role_hint &&
        normalizedRequest.role_hint !==
          role
      ) {
        throw createAuthenticationError(
          ERROR_CODES.AUTHORIZATION_FAILURE,
          "Selected role does not match authenticated authority."
        );
      }

      const rawEntryState =
        await (
          state.entryStateResolver ||
          defaultEntryStateResolver
        )(
          authUser,
          identity,
          role,
          {
            client:
              state.client,

            request:
              normalizedRequest
          }
        );

      const entryState =
        role === "administrator"
          ? Object.freeze({
            first_time:
              false,

            snapshot_id:
              null
          })
          : normalizeEntryState(
            rawEntryState,
            role
          );

      destination =
        await (
          state.routeResolver ||
          defaultRouteResolver
        )({
          authUser,

          identity,

          role,

          entryState,

          request:
            normalizedRequest
        });

      destination =
        normalizeLocalRoute(
          destination,
          "resolved destination"
        );

      const sessionId =
        cleanString(
          await (
            state.sessionIdResolver ||
            defaultSessionIdResolver
          )(
            authSession,
            authUser
          )
        );

      if (
        !sessionId
      ) {
        throw createAuthenticationError(
          ERROR_CODES.SESSION_FAILURE,
          "Session resolver returned an empty session identifier."
        );
      }

      const authContext =
        contextService.create({
          session_id:
            sessionId,

          user_id:
            authUser.id,

          role,

          entry_intent:
            normalizedRequest
              .entry_intent,

          authenticated_at:
            new Date()
              .toISOString(),

          authentication_source:
            state.authenticationSource,

          requested_destination:
            normalizedRequest
              .requested_destination
        });

      try {
        await writeReceipt({
          outcome:
            "SUCCESS",

          session_id:
            authContext.session_id,

          user_id:
            authContext.user_id,

          role:
            authContext.role,

          authentication_source:
            authContext
              .authentication_source,

          requested_destination:
            normalizedRequest
              .requested_destination,

          resolved_destination:
            destination,

          error_code:
            null,

          correlation_id:
            correlationId,

          metadata: {
            provider:
              "supabase",

            entry_intent:
              authContext.entry_intent
          }
        });

        successReceiptWritten =
          true;
      } catch (receiptError) {
        await rollbackAuthenticatedSession();

        const controlledReceiptError =
          createAuthenticationError(
            ERROR_CODES.RECEIPT_FAILURE,
            "Authentication succeeded, but the governed success receipt could not be written.",
            {
              cause:
                receiptError,

              retryable:
                true
            }
          );

        dispatchEventSafely(
          "statscore:authentication-receipt-failed",
          Object.freeze({
            phase:
              "success_receipt",

            error:
              typeof controlledReceiptError
                .toJSON ===
              "function"
                ? controlledReceiptError
                  .toJSON()
                : {
                  code:
                    ERROR_CODES
                      .RECEIPT_FAILURE
                },

            correlation_id:
              correlationId
          })
        );

        throw controlledReceiptError;
      }

      try {
        contextService.publish(
          authContext
        );
      } catch (contextError) {
        await rollbackAuthenticatedSession();

        const controlledContextError =
          createAuthenticationError(
            ERROR_CODES.CONTEXT_FAILURE,
            "Authentication context could not be published.",
            {
              cause:
                contextError,

              retryable:
                true
            }
          );

        dispatchEventSafely(
          "statscore:authentication-context-failed",
          Object.freeze({
            error:
              typeof controlledContextError
                .toJSON ===
              "function"
                ? controlledContextError
                  .toJSON()
                : {
                  code:
                    ERROR_CODES
                      .CONTEXT_FAILURE
                },

            correlation_id:
              correlationId
          })
        );

        throw controlledContextError;
      }

      const result =
        Object.freeze({
          authenticated:
            true,

          context:
            authContext,

          destination,

          correlation_id:
            correlationId
        });

      dispatchEventSafely(
        "statscore:authentication-succeeded",
        result
      );

      return result;
    } catch (rawError) {
      const error =
        normalizeAuthenticationError(
          rawError
        );

      const isReceiptFailure =
        error &&
        error.code ===
          ERROR_CODES.RECEIPT_FAILURE;

      const isPostSuccessFailure =
        successReceiptWritten ===
        true;

      if (
        !isReceiptFailure &&
        !isPostSuccessFailure
      ) {
        try {
          await writeReceipt({
            outcome:
              "FAILURE",

            session_id:
              null,

            user_id:
              authUser
                ? authUser.id
                : null,

            role,

            authentication_source:
              state.authenticationSource,

            requested_destination:
              normalizedRequest
                .requested_destination,

            resolved_destination:
              destination,

            error_code:
              error.code,

            correlation_id:
              correlationId,

            metadata: {
              provider:
                "supabase",

              entry_intent:
                normalizedRequest
                  .entry_intent
            }
          });
        } catch (receiptError) {
          /*
           * A failure-receipt infrastructure error must not replace
           * the original authentication disposition.
           */
          dispatchEventSafely(
            "statscore:authentication-receipt-failed",
            Object.freeze({
              phase:
                "failure_receipt",

              authentication_error:
                typeof error.toJSON ===
                "function"
                  ? error.toJSON()
                  : {
                    code:
                      error.code
                  },

              receipt_error:
                receiptError &&
                typeof receiptError
                  .toJSON ===
                "function"
                  ? receiptError.toJSON()
                  : {
                    message:
                      receiptError &&
                      receiptError.message
                        ? receiptError
                          .message
                        : "Failure receipt could not be written."
                  },

              correlation_id:
                correlationId
            })
          );
        }
      }

      await rollbackAuthenticatedSession();

      dispatchEventSafely(
        "statscore:authentication-failed",
        Object.freeze({
          error:
            typeof error.toJSON ===
            "function"
              ? error.toJSON()
              : {
                code:
                  error.code,

                message:
                  error.message
              },

          correlation_id:
            correlationId
        })
      );

      throw error;
    }
  }

  function authenticate(request) {
    /*
     * Service-level concurrency protection:
     * repeated submissions receive the active authentication promise.
     */
    if (
      state.authenticationPromise
    ) {
      return state.authenticationPromise;
    }

    state.authenticationPromise =
      performAuthentication(
        request
      ).finally(
        function clearAuthenticationLock() {
          state.authenticationPromise =
            null;
        }
      );

    return state.authenticationPromise;
  }

  async function signOut() {
    assertClient();

    let providerError =
      null;

    let contextError =
      null;

    try {
      const response =
        await state.client.auth
          .signOut();

      if (
        response &&
        response.error
      ) {
        providerError =
          response.error;
      }
    } catch (error) {
      providerError =
        error;
    }

    try {
      contextService.clear();
    } catch (error) {
      contextError =
        error;
    }

    if (providerError) {
      throw normalizeAuthenticationError(
        providerError
      );
    }

    if (contextError) {
      throw createAuthenticationError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Provider sign-out completed, but local authentication context could not be cleared.",
        {
          cause:
            contextError,

          retryable:
            true
        }
      );
    }

    dispatchEventSafely(
      "statscore:authentication-signed-out"
    );
  }

  global.STATSCORE_AUTH_SERVICE =
    Object.freeze({
      version:
        "1.2.0",

      configure,

      getConfiguration,

      authenticate,

      signOut
    });
})(window); 
