/**
* STATS-CORE™ — Governed Demo Authentication Provider
* PWP-002 — Controlled Demo Capability
* Version 1.0.0
*
* Purpose:
* - Provide controlled, isolated authentication results for demonstration.
* - Return the same provider response shape consumed by Article 1.
* - Supply optional controlled identity, role, entry-state, and session
*   resolver seams for isolated demo scenarios.
* - Preserve the complete certified PWP-001 authentication pipeline.
*
* This provider may:
* - Validate controlled demo credentials.
* - Return a controlled demo provider user and session.
* - Resolve controlled demo identity facts.
* - Resolve controlled demo role facts.
* - Resolve controlled demo entry-state facts.
* - Expose a read-only environment description.
* - Clear its in-memory provider session during sign-out.
*
* This provider does not:
* - Publish Initial Authentication Context.
* - Write authentication receipts.
* - Select authorized destinations.
* - Execute browser routing.
* - Store authentication state in localStorage or sessionStorage.
* - Create production users.
* - Query or modify production identity tables.
* - Query or modify production athlete records.
* - Determine enterprise runtime workspace context.
*
* Required dependency:
* - statscore-authentication-errors.js
*
* Recommended load order:
* 1. statscore-authentication-errors.js
* 2. statscore-authentication-context.js
* 3. statscore-authentication-receipts.js
* 4. statscore-demo-authentication-provider.js
* 5. statscore-authentication-service.js
*/
(function initializeStatsCoreDemoAuthenticationProvider(global) {
  "use strict";

  const errors =
    global.STATSCORE_AUTH_ERRORS;

  if (
    !errors ||
    !errors.ERROR_CODES ||
    typeof errors.StatsCoreAuthenticationError !==
      "function"
  ) {
    throw new Error(
      "Load statscore-authentication-errors.js before " +
        "statscore-demo-authentication-provider.js."
    );
  }

  const {
    ERROR_CODES,
    StatsCoreAuthenticationError
  } = errors;

  const VERSION =
    "1.0.0";

  const PROVIDER_ID =
    "statscore_demo";

  const ENVIRONMENT_ID =
    "demo";

  const AUTHENTICATION_SOURCE =
    "demo_isolated";

  const DEMO_PASSWORD =
    "StatsCoreDemo2026!";

  const ENVIRONMENT =
    deepFreeze({
      provider_id:
        PROVIDER_ID,

      environment:
        ENVIRONMENT_ID,

      label:
        "DEMO ENVIRONMENT",

      authentication_source:
        AUTHENTICATION_SOURCE,

      production:
        false,

      isolated:
        true,

      persistent_provider_session:
        false
    });

  const SCENARIOS =
    deepFreeze({
      "demo-athlete-new@statscore.test": {
        scenario_id:
          "first_time_athlete",

        user_id:
          "demo-user-athlete-new",

        identity_id:
          "demo-identity-athlete-new",

        role:
          "athlete",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-athlete-returning@statscore.test": {
        scenario_id:
          "returning_athlete",

        user_id:
          "demo-user-athlete-returning",

        identity_id:
          "demo-identity-athlete-returning",

        role:
          "athlete",

        first_time:
          false,

        snapshot_id:
          "demo-snapshot-athlete-001"
      },

      "demo-parent-new@statscore.test": {
        scenario_id:
          "first_time_parent",

        user_id:
          "demo-user-parent-new",

        identity_id:
          "demo-identity-parent-new",

        role:
          "parent",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-parent-returning@statscore.test": {
        scenario_id:
          "returning_parent",

        user_id:
          "demo-user-parent-returning",

        identity_id:
          "demo-identity-parent-returning",

        role:
          "parent",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-coach-new@statscore.test": {
        scenario_id:
          "first_time_coach",

        user_id:
          "demo-user-coach-new",

        identity_id:
          "demo-identity-coach-new",

        role:
          "coach",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-coach-returning@statscore.test": {
        scenario_id:
          "returning_coach",

        user_id:
          "demo-user-coach-returning",

        identity_id:
          "demo-identity-coach-returning",

        role:
          "coach",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-counselor-new@statscore.test": {
        scenario_id:
          "first_time_counselor",

        user_id:
          "demo-user-counselor-new",

        identity_id:
          "demo-identity-counselor-new",

        role:
          "counselor",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-counselor-returning@statscore.test": {
        scenario_id:
          "returning_counselor",

        user_id:
          "demo-user-counselor-returning",

        identity_id:
          "demo-identity-counselor-returning",

        role:
          "counselor",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-recruiter-new@statscore.test": {
        scenario_id:
          "first_time_recruiter",

        user_id:
          "demo-user-recruiter-new",

        identity_id:
          "demo-identity-recruiter-new",

        role:
          "recruiter",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-recruiter-returning@statscore.test": {
        scenario_id:
          "returning_recruiter",

        user_id:
          "demo-user-recruiter-returning",

        identity_id:
          "demo-identity-recruiter-returning",

        role:
          "recruiter",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-evaluator-new@statscore.test": {
        scenario_id:
          "first_time_evaluator",

        user_id:
          "demo-user-evaluator-new",

        identity_id:
          "demo-identity-evaluator-new",

        role:
          "evaluator",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-evaluator-returning@statscore.test": {
        scenario_id:
          "returning_evaluator",

        user_id:
          "demo-user-evaluator-returning",

        identity_id:
          "demo-identity-evaluator-returning",

        role:
          "evaluator",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-program-new@statscore.test": {
        scenario_id:
          "first_time_program",

        user_id:
          "demo-user-program-new",

        identity_id:
          "demo-identity-program-new",

        role:
          "program",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-program-returning@statscore.test": {
        scenario_id:
          "returning_program",

        user_id:
          "demo-user-program-returning",

        identity_id:
          "demo-identity-program-returning",

        role:
          "program",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-trainer-new@statscore.test": {
        scenario_id:
          "first_time_trainer",

        user_id:
          "demo-user-trainer-new",

        identity_id:
          "demo-identity-trainer-new",

        role:
          "trainer",

        first_time:
          true,

        snapshot_id:
          null
      },

      "demo-trainer-returning@statscore.test": {
        scenario_id:
          "returning_trainer",

        user_id:
          "demo-user-trainer-returning",

        identity_id:
          "demo-identity-trainer-returning",

        role:
          "trainer",

        first_time:
          false,

        snapshot_id:
          null
      },

      "demo-administrator@statscore.test": {
        scenario_id:
          "administrator",

        user_id:
          "demo-user-administrator",

        identity_id:
          "demo-identity-administrator",

        role:
          "administrator",

        first_time:
          false,

        snapshot_id:
          null
      }
    });

  const SCENARIOS_BY_USER_ID =
    createScenarioUserIndex(
      SCENARIOS
    );

  let activeProviderSession =
    null;

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function deepFreeze(value) {
    if (
      value === null ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    for (
      const key of
      Object.keys(value)
    ) {
      deepFreeze(
        value[key]
      );
    }

    return Object.freeze(
      value
    );
  }

  function createScenarioUserIndex(
    scenarios
  ) {
    const index =
      Object.create(null);

    for (
      const scenario of
      Object.values(scenarios)
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          index,
          scenario.user_id
        )
      ) {
        throw new Error(
          "Duplicate controlled demo user_id detected."
        );
      }

      index[scenario.user_id] =
        scenario;
    }

    return Object.freeze(
      index
    );
  }

  function createDemoError(
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

  function createProviderFailureResponse(
    error
  ) {
    return Object.freeze({
      data:
        null,

      error
    });
  }

  function createProviderSuccessResponse(
    user,
    session
  ) {
    return Object.freeze({
      data:
        Object.freeze({
          user,
          session
        }),

      error:
        null
    });
  }

  function createSessionId() {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
    ) {
      return (
        "demo-session-" +
        global.crypto.randomUUID()
      );
    }

    return (
      "demo-session-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(16)
        .slice(2)
    );
  }

  function assertCredentialsObject(
    credentials
  ) {
    if (
      !credentials ||
      typeof credentials !== "object" ||
      Array.isArray(credentials)
    ) {
      throw createDemoError(
        ERROR_CODES.REQUEST_VALIDATION_FAILURE,
        "Demo authentication credentials must be supplied as an object."
      );
    }

    return credentials;
  }

  function getScenarioByEmail(
    value
  ) {
    const email =
      cleanString(
        value
      ).toLowerCase();

    if (!email) {
      return null;
    }

    return Object.prototype
      .hasOwnProperty.call(
        SCENARIOS,
        email
      )
      ? SCENARIOS[email]
      : null;
  }

  function getScenarioByUserId(
    value
  ) {
    const userId =
      cleanString(
        value
      );

    if (!userId) {
      return null;
    }

    return Object.prototype
      .hasOwnProperty.call(
        SCENARIOS_BY_USER_ID,
        userId
      )
      ? SCENARIOS_BY_USER_ID[userId]
      : null;
  }

  function requireScenarioByUserId(
    value
  ) {
    const scenario =
      getScenarioByUserId(
        value
      );

    if (!scenario) {
      throw createDemoError(
        ERROR_CODES.IDENTITY_FAILURE,
        "The authenticated demo user does not belong to an authorized demo scenario."
      );
    }

    return scenario;
  }

  async function authenticate(
    credentials
  ) {
    let source;

    try {
      source =
        assertCredentialsObject(
          credentials
        );
    } catch (error) {
      return createProviderFailureResponse(
        error
      );
    }

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
      !password
    ) {
      return createProviderFailureResponse(
        createDemoError(
          ERROR_CODES.REQUEST_VALIDATION_FAILURE,
          "Demo email and password are required."
        )
      );
    }

    const scenario =
      getScenarioByEmail(
        email
      );

    if (
      !scenario ||
      password !== DEMO_PASSWORD
    ) {
      return createProviderFailureResponse(
        createDemoError(
          ERROR_CODES.CREDENTIAL_FAILURE,
          "The supplied demo credentials are not authorized."
        )
      );
    }

    const sessionId =
      createSessionId();

    const authenticatedAt =
      new Date()
        .toISOString();

    const user =
      deepFreeze({
        id:
          scenario.user_id,

        email,

        app_metadata:
          Object.freeze({}),

        user_metadata:
          Object.freeze({}),

        aud:
          "authenticated",

        created_at:
          authenticatedAt
      });

    const session =
      deepFreeze({
        session_id:
          sessionId,

        access_token:
          null,

        token_type:
          "demo",

        expires_at:
          null,

        user
      });

    activeProviderSession =
      Object.freeze({
        session_id:
          sessionId,

        user_id:
          scenario.user_id,

        scenario_id:
          scenario.scenario_id,

        authenticated_at:
          authenticatedAt
      });

    return createProviderSuccessResponse(
      user,
      session
    );
  }

  async function signOut() {
    activeProviderSession =
      null;

    return Object.freeze({
      error:
        null
    });
  }

  function getEnvironment() {
    return ENVIRONMENT;
  }

  async function identityResolver(
    authUser
  ) {
    if (
      !authUser ||
      typeof authUser !== "object"
    ) {
      throw createDemoError(
        ERROR_CODES.IDENTITY_FAILURE,
        "Demo identity resolution requires an authenticated provider user."
      );
    }

    const scenario =
      requireScenarioByUserId(
        authUser.id
      );

    return deepFreeze({
      id:
        scenario.identity_id,

      auth_user_id:
        scenario.user_id,

      role_id:
        scenario.role,

      role:
        scenario.role,

      active:
        true,

      demo_scenario:
        scenario.scenario_id
    });
  }

  async function roleResolver(
    authUser,
    identity
  ) {
    const scenario =
      requireScenarioByUserId(
        authUser &&
        authUser.id
      );

    if (
      !identity ||
      identity.id !==
        scenario.identity_id
    ) {
      throw createDemoError(
        ERROR_CODES.ROLE_FAILURE,
        "Demo role resolution received an invalid governed identity."
      );
    }

    return scenario.role;
  }

  async function entryStateResolver(
    authUser,
    identity,
    role
  ) {
    const scenario =
      requireScenarioByUserId(
        authUser &&
        authUser.id
      );

    if (
      !identity ||
      identity.id !==
        scenario.identity_id
    ) {
      throw createDemoError(
        ERROR_CODES.ENTRY_STATE_FAILURE,
        "Demo entry-state resolution received an invalid governed identity."
      );
    }

    if (
      cleanString(role) !==
      scenario.role
    ) {
      throw createDemoError(
        ERROR_CODES.ENTRY_STATE_FAILURE,
        "Demo entry-state resolution received a role that does not match the controlled scenario."
      );
    }

    return Object.freeze({
      first_time:
        scenario.first_time,

      snapshot_id:
        scenario.snapshot_id
    });
  }

  async function sessionIdResolver(
    authSession,
    authUser
  ) {
    const sessionId =
      cleanString(
        authSession &&
        authSession.session_id
      );

    const userId =
      cleanString(
        authUser &&
        authUser.id
      );

    if (
      !sessionId ||
      !userId
    ) {
      throw createDemoError(
        ERROR_CODES.SESSION_FAILURE,
        "Demo session resolution requires a provider session and authenticated user."
      );
    }

    if (
      !activeProviderSession ||
      activeProviderSession.session_id !==
        sessionId ||
      activeProviderSession.user_id !==
        userId
    ) {
      throw createDemoError(
        ERROR_CODES.SESSION_FAILURE,
        "The controlled demo provider session is not active."
      );
    }

    return sessionId;
  }

  global.STATSCORE_DEMO_AUTH_PROVIDER =
    Object.freeze({
      version:
        VERSION,

      provider_id:
        PROVIDER_ID,

      authentication_source:
        AUTHENTICATION_SOURCE,

      authenticate,

      signOut,

      getEnvironment,

      identityResolver,

      roleResolver,

      entryStateResolver,

      sessionIdResolver
    });
})(window); 
