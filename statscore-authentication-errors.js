/**
* STATS-CORE™ — Authentication Error Contract
* Article 4 / PWP-001
* Version 1.0.0
*
* Constitutional responsibilities:
* - Establish the governed authentication error-code vocabulary.
* - Provide one controlled authentication-error class.
* - Preserve safe causal and diagnostic information.
* - Normalize unknown failures into governed authentication errors.
* - Provide deterministic machine-readable serialization.
* - Prevent error serialization from exposing uncontrolled objects,
*   browser state, provider responses, credentials, or stack traces.
*
* Operational boundary:
* - This module defines and normalizes authentication errors.
* - This module does not authenticate credentials.
* - This module does not determine role or entry state.
* - This module does not publish Initial Authentication Context.
* - This module does not write authentication receipts.
* - This module does not authorize access.
*
* Required load order:
* 1. statscore-authentication-errors.js
* 2. statscore-authentication-context.js
* 3. statscore-authentication-receipts.js
* 4. statscore-authentication-service.js
*/
(function initializeStatsCoreAuthenticationErrors(global) {
  "use strict";

  const VERSION =
    "1.0.0";

  const CONTRACT_NAME =
    "STATSCORE_AUTHENTICATION_ERROR_CONTRACT_V1";

  const DEFAULT_ERROR_CODE =
    "AUTHENTICATION_FAILURE";

  const MAX_CODE_LENGTH =
    128;

  const MAX_MESSAGE_LENGTH =
    2048;

  const MAX_DETAIL_KEY_LENGTH =
    128;

  const MAX_DETAIL_STRING_LENGTH =
    2048;

  const MAX_DETAILS_SERIALIZED_LENGTH =
    8192;

  const MAX_DETAILS_DEPTH =
    6;

  const ERROR_CODES = Object.freeze({
    AUTHENTICATION_FAILURE:
      "AUTHENTICATION_FAILURE",

    AUTHENTICATION_IN_PROGRESS:
      "AUTHENTICATION_IN_PROGRESS",

    CONFIGURATION_ERROR:
      "CONFIGURATION_ERROR",

    REQUEST_VALIDATION_FAILURE:
      "REQUEST_VALIDATION_FAILURE",

    CREDENTIAL_FAILURE:
      "CREDENTIAL_FAILURE",

    PROVIDER_FAILURE:
      "PROVIDER_FAILURE",

    SESSION_FAILURE:
      "SESSION_FAILURE",

    IDENTITY_FAILURE:
      "IDENTITY_FAILURE",

    ROLE_FAILURE:
      "ROLE_FAILURE",

    ENTRY_STATE_FAILURE:
      "ENTRY_STATE_FAILURE",

    ROUTING_FAILURE:
      "ROUTING_FAILURE",

    CONTEXT_FAILURE:
      "CONTEXT_FAILURE",

    RECEIPT_FAILURE:
      "RECEIPT_FAILURE",

    AUTHORIZATION_FAILURE:
      "AUTHORIZATION_FAILURE",

    ROLLBACK_FAILURE:
      "ROLLBACK_FAILURE",

    INTERNAL_FAILURE:
      "INTERNAL_FAILURE"
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

  const RETRYABLE_ERROR_CODES =
    Object.freeze([
      ERROR_CODES.PROVIDER_FAILURE,
      ERROR_CODES.SESSION_FAILURE,
      ERROR_CODES.RECEIPT_FAILURE,
      ERROR_CODES.INTERNAL_FAILURE
    ]);

  const RETRYABLE_ERROR_CODE_SET =
    new Set(
      RETRYABLE_ERROR_CODES
    );

  const PROHIBITED_DETAIL_KEYS =
    Object.freeze([
      "__proto__",
      "prototype",
      "constructor",
      "password",
      "passcode",
      "secret",
      "token",
      "access_token",
      "refresh_token",
      "authorization",
      "cookie",
      "session",
      "credential",
      "credentials",
      "stack",
      "cause",
      "provider_response",
      "raw_response",
      "request"
    ]);

  const PROHIBITED_DETAIL_KEY_SET =
    new Set(
      PROHIBITED_DETAIL_KEYS
    );

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
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
        `${label} contains prohibited control characters.`
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
      cleanString(
        value
      );

    if (!candidate) {
      throw new TypeError(
        `${label} is required.`
      );
    }

    if (
      candidate.length >
      maximumLength
    ) {
      throw new TypeError(
        `${label} exceeds the authorized maximum length.`
      );
    }

    return rejectControlCharacters(
      candidate,
      label
    );
  }

  function validateErrorCode(value) {
    const code =
      validateRequiredString(
        value,
        "Authentication error code",
        MAX_CODE_LENGTH
      );

    if (
      !ERROR_CODE_SET.has(
        code
      )
    ) {
      throw new TypeError(
        `Unsupported authentication error code: ${code}`
      );
    }

    return code;
  }

  function validateMessage(value) {
    return validateRequiredString(
      value,
      "Authentication error message",
      MAX_MESSAGE_LENGTH
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
        `${label} must be a plain object.`
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
        `${label} must use a supported object shape.`
      );
    }

    return value;
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

  function normalizeDetailKey(value) {
    const key =
      validateRequiredString(
        value,
        "Authentication error detail key",
        MAX_DETAIL_KEY_LENGTH
      );

    const canonicalKey =
      key.toLowerCase();

    if (
      PROHIBITED_DETAIL_KEY_SET.has(
        canonicalKey
      )
    ) {
      throw new TypeError(
        `Authentication error details contain a prohibited key: ${key}`
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
      return validateRequiredString(
        value,
        "Authentication error detail value",
        MAX_DETAIL_STRING_LENGTH
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
      throw new TypeError(
        "Authentication error details contain an unsupported value."
      );
    }

    if (
      typeof value !== "object"
    ) {
      throw new TypeError(
        "Authentication error details contain an unsupported type."
      );
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
      Array.isArray(
        value
      )
    ) {
      const sanitizedArray =
        value.map(
          function sanitizeArrayItem(item) {
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

      return sanitizedArray;
    }

    assertPlainObject(
      value,
      "Authentication error detail object"
    );

    const sanitizedObject =
      Object.create(null);

    const normalizedKeys =
      new Set();

    for (
      const [key, item] of
      Object.entries(
        value
      )
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

      sanitizedObject[normalizedKey] =
        sanitizeDetailValue(
          item,
          depth + 1,
          seen
        );
    }

    seen.delete(
      value
    );

    return sanitizedObject;
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
    } catch (_error) {
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

  function normalizeCause(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    if (
      value instanceof Error
    ) {
      return value;
    }

    return null;
  }

  function resolveRetryable(
    code,
    suppliedValue
  ) {
    if (
      suppliedValue !== undefined &&
      typeof suppliedValue !== "boolean"
    ) {
      throw new TypeError(
        "Authentication error retryable must be boolean."
      );
    }

    if (
      typeof suppliedValue === "boolean"
    ) {
      return suppliedValue;
    }

    return RETRYABLE_ERROR_CODE_SET.has(
      code
    );
  }

  function resolveOptions(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return Object.freeze({
        cause:
          null,

        retryable:
          undefined,

        details:
          null
      });
    }

    assertPlainObject(
      value,
      "Authentication error options"
    );

    const authorizedFields =
      new Set([
        "cause",
        "retryable",
        "details"
      ]);

    const unauthorizedFields =
      Object.keys(
        value
      ).filter(
        function findUnauthorizedField(fieldName) {
          return !authorizedFields.has(
            fieldName
          );
        }
      );

    if (
      unauthorizedFields.length > 0
    ) {
      throw new TypeError(
        "Authentication error options contain unauthorized fields: " +
          unauthorizedFields.join(", ")
      );
    }

    return Object.freeze({
      cause:
        normalizeCause(
          value.cause
        ),

      retryable:
        value.retryable,

      details:
        sanitizeDetails(
          value.details
        )
    });
  }

  class StatsCoreAuthenticationError extends Error {
    constructor(
      code,
      message,
      options
    ) {
      const validatedCode =
        validateErrorCode(
          code
        );

      const validatedMessage =
        validateMessage(
          message
        );

      const validatedOptions =
        resolveOptions(
          options
        );

      super(
        validatedMessage
      );

      Object.defineProperty(
        this,
        "name",
        {
          configurable:
            false,

          enumerable:
            true,

          writable:
            false,

          value:
            "StatsCoreAuthenticationError"
        }
      );

      Object.defineProperty(
        this,
        "code",
        {
          configurable:
            false,

          enumerable:
            true,

          writable:
            false,

          value:
            validatedCode
        }
      );

      Object.defineProperty(
        this,
        "retryable",
        {
          configurable:
            false,

          enumerable:
            true,

          writable:
            false,

          value:
            resolveRetryable(
              validatedCode,
              validatedOptions.retryable
            )
        }
      );

      Object.defineProperty(
        this,
        "details",
        {
          configurable:
            false,

          enumerable:
            true,

          writable:
            false,

          value:
            validatedOptions.details
        }
      );

      Object.defineProperty(
        this,
        "cause",
        {
          configurable:
            false,

          enumerable:
            false,

          writable:
            false,

          value:
            validatedOptions.cause
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

    toJSON() {
      return Object.freeze({
        name:
          this.name,

        code:
          this.code,

        message:
          this.message,

        retryable:
          this.retryable,

        details:
          this.details
      });
    }
  }

  function isAuthenticationError(value) {
    return (
      value instanceof
      StatsCoreAuthenticationError
    );
  }

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

  function deriveMessage(
    rawError,
    fallbackMessage
  ) {
    const fallback =
      validateMessage(
        fallbackMessage
      );

    if (
      rawError instanceof Error
    ) {
      const candidate =
        cleanString(
          rawError.message
        );

      if (
        candidate &&
        candidate.length <=
          MAX_MESSAGE_LENGTH &&
        !/[\u0000-\u001F\u007F]/.test(
          candidate
        )
      ) {
        return candidate;
      }
    }

    return fallback;
  }

  function normalize(
    rawError,
    fallbackCode,
    fallbackMessage,
    options
  ) {
    if (
      isAuthenticationError(
        rawError
      )
    ) {
      return rawError;
    }

    const code =
      validateErrorCode(
        fallbackCode ||
          DEFAULT_ERROR_CODE
      );

    const suppliedOptions =
      options === undefined ||
      options === null
        ? {}
        : assertPlainObject(
          options,
          "Authentication error normalization options"
        );

    const authorizedFields =
      new Set([
        "retryable",
        "details",
        "preserve_message"
      ]);

    const unauthorizedFields =
      Object.keys(
        suppliedOptions
      ).filter(
        function findUnauthorizedField(fieldName) {
          return !authorizedFields.has(
            fieldName
          );
        }
      );

    if (
      unauthorizedFields.length > 0
    ) {
      throw new TypeError(
        "Authentication error normalization options contain " +
          "unauthorized fields: " +
          unauthorizedFields.join(", ")
      );
    }

    if (
      suppliedOptions.preserve_message !== undefined &&
      typeof suppliedOptions.preserve_message !==
        "boolean"
    ) {
      throw new TypeError(
        "preserve_message must be boolean."
      );
    }

    const message =
      suppliedOptions.preserve_message === true
        ? deriveMessage(
          rawError,
          fallbackMessage
        )
        : validateMessage(
          fallbackMessage
        );

    return new StatsCoreAuthenticationError(
      code,
      message,
      {
        cause:
          rawError instanceof Error
            ? rawError
            : null,

        retryable:
          suppliedOptions.retryable,

        details:
          suppliedOptions.details
      }
    );
  }

  function serialize(value) {
    if (
      isAuthenticationError(
        value
      )
    ) {
      return value.toJSON();
    }

    return Object.freeze({
      name:
        "StatsCoreAuthenticationError",

      code:
        ERROR_CODES.INTERNAL_FAILURE,

      message:
        "An uncontrolled authentication error occurred.",

      retryable:
        false,

      details:
        null
    });
  }

  function getContractDefinition() {
    return Object.freeze({
      contract:
        CONTRACT_NAME,

      version:
        VERSION,

      default_error_code:
        DEFAULT_ERROR_CODE,

      error_codes:
        ERROR_CODES,

      error_code_values:
        ERROR_CODE_VALUES,

      retryable_error_codes:
        RETRYABLE_ERROR_CODES,

      prohibited_detail_keys:
        PROHIBITED_DETAIL_KEYS,

      constructor_shape:
        Object.freeze({
          code:
            "required_governed_error_code",

          message:
            "required_controlled_string",

          options:
            Object.freeze({
              cause:
                "optional_native_error",

              retryable:
                "optional_boolean",

              details:
                "optional_sanitized_plain_object"
            })
        }),

      serialized_shape:
        Object.freeze([
          "name",
          "code",
          "message",
          "retryable",
          "details"
        ]),

      exposes_stack:
        false,

      serializes_cause:
        false,

      permits_uncontrolled_error_codes:
        false
    });
  }

  global.STATSCORE_AUTH_ERRORS =
    Object.freeze({
      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      ERROR_CODES,

      ERROR_CODE_VALUES,

      RETRYABLE_ERROR_CODES,

      PROHIBITED_DETAIL_KEYS,

      StatsCoreAuthenticationError,

      isAuthenticationError,

      create,

      normalize,

      serialize,

      validateErrorCode,

      getContractDefinition
    });
})(window); 
