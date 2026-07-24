/**
* STATS-CORE™ — Initial Authentication Context
* Article 2 / PWP-001
* Version 1.3.0
*
* Constitutional responsibilities:
* - Define the exact seven-field Initial Authentication Context.
* - Validate every field before publication.
* - Reject missing fields.
* - Reject unauthorized additional fields.
* - Publish the governed authentication handoff.
* - Provide controlled read, existence, and clear operations.
*
* Operational boundary:
* - The stored context is a browser-held handoff artifact.
* - Browser storage is not continuing identity, role, session,
*   authorization, or runtime-workspace authority.
* - A context returned by read() must be revalidated against the active
*   provider session before it is used for runtime authorization or
*   workspace restoration.
*
* This module does not:
* - Authenticate credentials.
* - Establish identity.
* - Resolve role authority.
* - Restore runtime workspaces.
* - Manufacture athlete snapshot authority.
* - Publish Initial Runtime Context.
*/
(function initializeStatsCoreAuthenticationContext(global) {
  "use strict";

  const errors =
    global.STATSCORE_AUTH_ERRORS;

  if (!errors) {
    throw new Error(
      "Load statscore-authentication-errors.js before " +
        "statscore-authentication-context.js"
    );
  }

  const {
    ERROR_CODES,
    StatsCoreAuthenticationError
  } = errors;

  const VERSION =
    "1.3.0";

  const CONTRACT_NAME =
    "STATSCORE_INITIAL_AUTHENTICATION_CONTEXT_V1";

  const STORAGE_KEY =
    "statscore.initial_authentication_context.v1";

  const MAX_DESTINATION_DECODE_PASSES =
    4;

  const MAX_FUTURE_CLOCK_SKEW_MS =
    5 * 60 * 1000;

  const HANDOFF_AUTHORITY_NOTICE =
    "A context returned by read() is a browser-held handoff artifact " +
    "and must be revalidated against the active provider session before " +
    "being used for runtime authorization or workspace restoration.";

  const FIELD_NAMES = Object.freeze([
    "session_id",
    "user_id",
    "role",
    "entry_intent",
    "authenticated_at",
    "authentication_source",
    "requested_destination"
  ]);

  const ALLOWED_ROLES = Object.freeze([
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

  /*
   * This allowlist is the canonical PWP-001 entry-intent vocabulary.
   *
   * Article 1 must validate against this same exported contract before
   * final PWP-001 certification.
   */
  const ALLOWED_ENTRY_INTENTS = Object.freeze([
    "login",
    "reauthentication",
    "session_recovery",
    "protected_route",
    "invitation",
    "password_reset_return",
    "magic_link_return"
  ]);

  /*
   * This allowlist must remain synchronized with
   * statscore-authentication-service.js.
   *
   * Future authentication sources require a coordinated revision
   * of both Article 1 and Article 2.
   */
  const ALLOWED_AUTHENTICATION_SOURCES = Object.freeze([
    "supabase_password",
    "supabase_magic_link",
    "supabase_oauth",
    "demo_isolated"
  ]);

  const EVENT_NAMES = Object.freeze({
    PUBLISHED:
      "statscore:authentication-context-published",

    CLEARED:
      "statscore:authentication-context-cleared",

    REJECTED:
      "statscore:authentication-context-rejected",

    INVALIDATED:
      "statscore:authentication-context-invalidated"
  });

  const ROLE_ALIASES = Object.freeze({
    admin:
      "administrator",

    administrator:
      "administrator",

    athlete:
      "athlete",

    parent:
      "parent",

    guardian:
      "parent",

    coach:
      "coach",

    counselor:
      "counselor",

    counsellor:
      "counselor",

    recruiter:
      "recruiter",

    evaluator:
      "evaluator",

    program:
      "program",

    program_director:
      "program",

    athletic_director:
      "program",

    ad:
      "program",

    trainer:
      "trainer"
  });

  const ALLOWED_ROLE_SET =
    new Set(ALLOWED_ROLES);

  const ALLOWED_ENTRY_INTENT_SET =
    new Set(ALLOWED_ENTRY_INTENTS);

  const ALLOWED_AUTHENTICATION_SOURCE_SET =
    new Set(ALLOWED_AUTHENTICATION_SOURCES);

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function createContextError(
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

  function normalizeRole(value) {
    const normalized =
      cleanString(value)
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (!normalized) {
      return "";
    }

    return ROLE_ALIASES[normalized] || normalized;
  }

  function normalizeEntryIntent(value) {
    return cleanString(value)
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
  }

  function normalizeAuthenticationSource(value) {
    return cleanString(value)
      .toLowerCase();
  }

  function safelySerializeError(error) {
    if (
      error &&
      typeof error.toJSON === "function"
    ) {
      return error.toJSON();
    }

    return {
      code:
        error && error.code
          ? error.code
          : ERROR_CODES.CONTEXT_FAILURE,

      message:
        error && error.message
          ? error.message
          : "Authentication context operation failed."
    };
  }

  function dispatchEventSafely(
    eventName,
    detail
  ) {
    try {
      if (
        !global ||
        typeof global.dispatchEvent !== "function"
      ) {
        return false;
      }

      const EventConstructor =
        global.CustomEvent;

      if (
        typeof EventConstructor !== "function"
      ) {
        return false;
      }

      global.dispatchEvent(
        new EventConstructor(
          eventName,
          detail === undefined
            ? undefined
            : {
              detail
            }
        )
      );

      return true;
    } catch (_error) {
      /*
       * Context events are observational only.
       * Event failure must never alter context disposition.
       */
      return false;
    }
  }

  function dispatchRejected(
    operation,
    error
  ) {
    dispatchEventSafely(
      EVENT_NAMES.REJECTED,
      Object.freeze({
        operation:
          cleanString(operation) || "unknown",

        error:
          safelySerializeError(error),

        contract:
          CONTRACT_NAME,

        version:
          VERSION
      })
    );
  }

  function validateStorageInterface(storage) {
    if (
      !storage ||
      (
        typeof storage !== "object" &&
        typeof storage !== "function"
      )
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Authentication context storage is unavailable."
      );
    }

    const requiredMethods = [
      "setItem",
      "getItem",
      "removeItem"
    ];

    for (const methodName of requiredMethods) {
      if (
        typeof storage[methodName] !== "function"
      ) {
        throw createContextError(
          ERROR_CODES.CONTEXT_FAILURE,
          "Authentication context storage does not implement the " +
            `required ${methodName}() operation.`
        );
      }
    }

    return storage;
  }

  function resolveStorage(options) {
    try {
      if (
        options &&
        Object.prototype.hasOwnProperty.call(
          options,
          "storage"
        )
      ) {
        return validateStorageInterface(
          options.storage
        );
      }

      return validateStorageInterface(
        global.sessionStorage
      );
    } catch (rawError) {
      if (
        rawError instanceof
        StatsCoreAuthenticationError
      ) {
        throw rawError;
      }

      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Authentication context storage could not be accessed.",
        {
          cause:
            rawError,

          retryable:
            true
        }
      );
    }
  }

  function assertPlainObject(value) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Initial Authentication Context must be a plain object."
      );
    }

    const prototype =
      Object.getPrototypeOf(value);

    if (
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Initial Authentication Context must use a supported object shape."
      );
    }

    return value;
  }

  function validateAuthorizedFieldSet(value) {
    const keys =
      Object.keys(value);

    const missingFields =
      FIELD_NAMES.filter(
        function findMissingField(fieldName) {
          return !Object.prototype.hasOwnProperty.call(
            value,
            fieldName
          );
        }
      );

    if (missingFields.length > 0) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Initial Authentication Context is missing required fields: " +
          missingFields.join(", ")
      );
    }

    const unauthorizedFields =
      keys.filter(
        function findUnauthorizedField(fieldName) {
          return !FIELD_NAMES.includes(
            fieldName
          );
        }
      );

    if (unauthorizedFields.length > 0) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Initial Authentication Context contains unauthorized fields: " +
          unauthorizedFields.join(", ")
      );
    }

    if (
      keys.length !==
      FIELD_NAMES.length
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "Initial Authentication Context must contain exactly seven fields."
      );
    }
  }

  function rejectControlCharacters(
    value,
    label
  ) {
    if (/[\u0000-\u001F\u007F]/.test(value)) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${label} contains prohibited control characters.`
      );
    }

    return value;
  }

  function validateSessionId(value) {
    const sessionId =
      cleanString(value);

    if (!sessionId) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "session_id is required."
      );
    }

    if (sessionId.length > 512) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "session_id exceeds the authorized maximum length."
      );
    }

    rejectControlCharacters(
      sessionId,
      "session_id"
    );

    return sessionId;
  }

  function validateUserId(value) {
    const userId =
      cleanString(value);

    if (!userId) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "user_id is required."
      );
    }

    if (userId.length > 512) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "user_id exceeds the authorized maximum length."
      );
    }

    rejectControlCharacters(
      userId,
      "user_id"
    );

    return userId;
  }

  function validateRole(value) {
    const role =
      normalizeRole(value);

    if (
      !role ||
      !ALLOWED_ROLE_SET.has(role)
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `Unsupported authentication role: ${role || "empty"}`
      );
    }

    return role;
  }

  function validateEntryIntent(value) {
    const entryIntent =
      normalizeEntryIntent(value);

    if (
      !entryIntent ||
      !ALLOWED_ENTRY_INTENT_SET.has(
        entryIntent
      )
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `Unsupported entry_intent: ${entryIntent || "empty"}`
      );
    }

    return entryIntent;
  }

  function validateAuthenticatedAt(value) {
    const authenticatedAt =
      cleanString(value);

    if (!authenticatedAt) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "authenticated_at is required."
      );
    }

    const canonicalUtcPattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    if (
      !canonicalUtcPattern.test(
        authenticatedAt
      )
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "authenticated_at must be a canonical ISO-8601 UTC timestamp."
      );
    }

    const timestamp =
      Date.parse(authenticatedAt);

    if (
      !Number.isFinite(timestamp) ||
      new Date(timestamp).toISOString() !==
        authenticatedAt
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "authenticated_at is not a valid canonical timestamp."
      );
    }

    if (
      timestamp >
      Date.now() +
        MAX_FUTURE_CLOCK_SKEW_MS
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "authenticated_at is materially in the future."
      );
    }

    return authenticatedAt;
  }

  function validateAuthenticationSource(value) {
    const source =
      normalizeAuthenticationSource(value);

    if (
      !source ||
      !ALLOWED_AUTHENTICATION_SOURCE_SET.has(
        source
      )
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `Unsupported authentication_source: ${source || "empty"}`
      );
    }

    return source;
  }

  function containsUnsafeScheme(value) {
    return /^[A-Za-z][A-Za-z0-9+.-]*:/i.test(
      value
    );
  }

  function decodeDestinationBounded(value) {
    let current =
      value;

    for (
      let pass = 0;
      pass < MAX_DESTINATION_DECODE_PASSES;
      pass += 1
    ) {
      let decoded;

      try {
        decoded =
          decodeURIComponent(current);
      } catch (_error) {
        throw createContextError(
          ERROR_CODES.CONTEXT_FAILURE,
          "requested_destination contains invalid URL encoding."
        );
      }

      if (decoded === current) {
        return decoded;
      }

      current =
        decoded;
    }

    try {
      const next =
        decodeURIComponent(current);

      if (next !== current) {
        throw createContextError(
          ERROR_CODES.CONTEXT_FAILURE,
          "requested_destination exceeds the authorized encoding depth."
        );
      }
    } catch (rawError) {
      if (
        rawError instanceof
        StatsCoreAuthenticationError
      ) {
        throw rawError;
      }

      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "requested_destination contains invalid URL encoding."
      );
    }

    return current;
  }

  function validateRouteRepresentation(
    value,
    label
  ) {
    if (!value) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${label} is required.`
      );
    }

    rejectControlCharacters(
      value,
      label
    );

    if (value.startsWith("/")) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${label} must be application-relative.`
      );
    }

    if (
      containsUnsafeScheme(value) ||
      value.startsWith("\\\\") ||
      value.includes("\\") ||
      value.includes("\u0000")
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${label} must be an application-relative route.`
      );
    }

    const pathOnly =
      value
        .split("#", 1)[0]
        .split("?", 1)[0];

    const pathSegments =
      pathOnly.split("/");

    if (
      pathSegments.some(
        function containsTraversalSegment(segment) {
          return segment === "." || segment === "..";
        }
      )
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${label} contains a prohibited traversal segment.`
      );
    }

    if (
      value.includes("../") ||
      value.includes("..\\") ||
      value.includes("./") ||
      value.includes(".\\")
    ) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${label} contains prohibited path traversal.`
      );
    }

    return value;
  }

  function validateLocalRoute(
    value,
    label
  ) {
    const route =
      cleanString(value);

    const routeLabel =
      cleanString(label) ||
      "route";

    if (!route) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${routeLabel} is required.`
      );
    }

    if (route.length > 2048) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        `${routeLabel} exceeds the authorized maximum length.`
      );
    }

    validateRouteRepresentation(
      route,
      routeLabel
    );

    const fullyDecodedRoute =
      decodeDestinationBounded(
        route
      );

    validateRouteRepresentation(
      fullyDecodedRoute,
      `decoded ${routeLabel}`
    );

    return route;
  }

  function validateRequestedDestination(value) {
    const destination =
      cleanString(value);

    if (!destination) {
      throw createContextError(
        ERROR_CODES.CONTEXT_FAILURE,
        "requested_destination is required."
      );
    }

    if (
      destination ===
      "role-aware-default"
    ) {
      return destination;
    }

    return validateLocalRoute(
      destination,
      "requested_destination"
    );
  }

  function validate(value) {
    const candidate =
      assertPlainObject(value);

    validateAuthorizedFieldSet(
      candidate
    );

    return Object.freeze({
      session_id:
        validateSessionId(
          candidate.session_id
        ),

      user_id:
        validateUserId(
          candidate.user_id
        ),

      role:
        validateRole(
          candidate.role
        ),

      entry_intent:
        validateEntryIntent(
          candidate.entry_intent
        ),

      authenticated_at:
        validateAuthenticatedAt(
          candidate.authenticated_at
        ),

      authentication_source:
        validateAuthenticationSource(
          candidate.authentication_source
        ),

      requested_destination:
        validateRequestedDestination(
          candidate.requested_destination
        )
    });
  }

  function create(value) {
    try {
      return validate(value);
    } catch (error) {
      dispatchRejected(
        "create",
        error
      );

      throw error;
    }
  }

  function publish(
    value,
    options
  ) {
    let storage;
    let context;

    try {
      storage =
        resolveStorage(options);

      context =
        validate(value);

      const serialized =
        JSON.stringify(context);

      storage.setItem(
        STORAGE_KEY,
        serialized
      );
    } catch (rawError) {
      const error =
        rawError instanceof
        StatsCoreAuthenticationError
          ? rawError
          : createContextError(
            ERROR_CODES.CONTEXT_FAILURE,
            "Initial Authentication Context could not be published.",
            {
              cause:
                rawError,

              retryable:
                true
            }
          );

      dispatchRejected(
        "publish",
        error
      );

      throw error;
    }

    /*
     * Publication is complete once storage succeeds.
     * Event publication is best-effort and cannot alter that result.
     */
    dispatchEventSafely(
      EVENT_NAMES.PUBLISHED,
      Object.freeze({
        context,

        contract:
          CONTRACT_NAME,

        version:
          VERSION,

        authority_notice:
          HANDOFF_AUTHORITY_NOTICE
      })
    );

    return context;
  }

  function removeStoredContextBestEffort(storage) {
    try {
      storage.removeItem(
        STORAGE_KEY
      );

      return true;
    } catch (_error) {
      return false;
    }
  }

  function read(options) {
    let storage;
    let raw;

    try {
      storage =
        resolveStorage(options);

      raw =
        storage.getItem(
          STORAGE_KEY
        );
    } catch (rawError) {
      const error =
        rawError instanceof
        StatsCoreAuthenticationError
          ? rawError
          : createContextError(
            ERROR_CODES.CONTEXT_FAILURE,
            "Stored Initial Authentication Context could not be accessed.",
            {
              cause:
                rawError,

              retryable:
                true
            }
          );

      dispatchRejected(
        "read_storage",
        error
      );

      throw error;
    }

    if (
      raw === null ||
      raw === ""
    ) {
      return null;
    }

    try {
      const parsed =
        JSON.parse(raw);

      const context =
        validate(parsed);

      /*
       * This returned value remains a browser-held handoff artifact.
       * It is not continuing authorization authority.
       */
      return context;
    } catch (rawError) {
      const removalSucceeded =
        removeStoredContextBestEffort(
          storage
        );

      const error =
        rawError instanceof
        StatsCoreAuthenticationError
          ? rawError
          : createContextError(
            ERROR_CODES.CONTEXT_FAILURE,
            "Stored Initial Authentication Context is malformed or invalid.",
            {
              cause:
                rawError,

              retryable:
                false
            }
          );

      dispatchRejected(
        "read_validation",
        error
      );

      dispatchEventSafely(
        EVENT_NAMES.INVALIDATED,
        Object.freeze({
          removed:
            removalSucceeded,

          error:
            safelySerializeError(error),

          contract:
            CONTRACT_NAME,

          version:
            VERSION
        })
      );

      throw error;
    }
  }

  function clear(options) {
    let storage;

    try {
      storage =
        resolveStorage(options);

      storage.removeItem(
        STORAGE_KEY
      );
    } catch (rawError) {
      const error =
        rawError instanceof
        StatsCoreAuthenticationError
          ? rawError
          : createContextError(
            ERROR_CODES.CONTEXT_FAILURE,
            "Initial Authentication Context could not be cleared.",
            {
              cause:
                rawError,

              retryable:
                true
            }
          );

      dispatchRejected(
        "clear",
        error
      );

      throw error;
    }

    /*
     * Removal is authoritative.
     * Event failure cannot invalidate successful context removal.
     */
    dispatchEventSafely(
      EVENT_NAMES.CLEARED,
      Object.freeze({
        contract:
          CONTRACT_NAME,

        version:
          VERSION
      })
    );

    return true;
  }

  function exists(options) {
    let storage;

    try {
      storage =
        resolveStorage(options);

      return (
        storage.getItem(
          STORAGE_KEY
        ) !== null
      );
    } catch (rawError) {
      const error =
        rawError instanceof
        StatsCoreAuthenticationError
          ? rawError
          : createContextError(
            ERROR_CODES.CONTEXT_FAILURE,
            "Initial Authentication Context existence could not be determined.",
            {
              cause:
                rawError,

              retryable:
                true
            }
          );

      dispatchRejected(
        "exists",
        error
      );

      /*
       * Authentication infrastructure fails closed.
       * A storage failure is not interpreted as a valid absent context.
       */
      throw error;
    }
  }

  function getContractDefinition() {
    return Object.freeze({
      contract:
        CONTRACT_NAME,

      version:
        VERSION,

      storage_key:
        STORAGE_KEY,

      field_names:
        FIELD_NAMES,

      allowed_roles:
        ALLOWED_ROLES,

      allowed_entry_intents:
        ALLOWED_ENTRY_INTENTS,

      allowed_authentication_sources:
        ALLOWED_AUTHENTICATION_SOURCES,

      event_names:
        EVENT_NAMES,

      authority_notice:
        HANDOFF_AUTHORITY_NOTICE,

      field_count:
        FIELD_NAMES.length,

      storage_classification:
        "browser_handoff_artifact",

      continuing_authority:
        false
    });
  }

  global.STATSCORE_AUTH_CONTEXT =
    Object.freeze({
      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      STORAGE_KEY,

      storage_key:
        STORAGE_KEY,

      EVENT_NAMES,

      FIELD_NAMES,

      authorized_fields:
        FIELD_NAMES,

      authority_notice:
        HANDOFF_AUTHORITY_NOTICE,

      ALLOWED_ROLES,

      ALLOWED_ENTRY_INTENTS,

      ALLOWED_AUTHENTICATION_SOURCES,

      normalizeRole,

      normalizeEntryIntent,

      normalizeAuthenticationSource,

      validateLocalRoute,

      getContractDefinition,

      create,

      validate,

      publish,

      read,

      clear,

      exists
    });
})(window); 
