/**
* STATS-CORE™ — Authentication Receipt Service
* Article 3 / PWP-001
* Version 1.2.0
*
* Constitutional responsibilities:
* - Validate authentication-receipt submissions.
* - Reject missing and unauthorized receipt fields.
* - Capture each submitted receipt as an immutable evidentiary request.
* - Require a governed server-side receipt-writing path.
* - Submit each receipt independently through an authorized Supabase RPC.
* - Require one explicit server acknowledgment contract.
* - Preserve the originating authentication disposition when a failure
*   receipt cannot be written.
* - Publish receipt events as best-effort observational signals.
*
* Operational boundary:
* - This browser module may request a governed receipt write.
* - This browser module is not the receipt authority.
* - Receipt identity, authoritative timestamping, persistence,
*   immutability, and final acceptance remain server-side responsibilities.
* - Direct browser insertion into an authentication-receipt table is not
*   authorized.
*
* This module does not:
* - Authenticate credentials.
* - Resolve identity or role authority.
* - Publish Initial Authentication Context.
* - Create provider sessions.
* - Manufacture receipt identifiers.
* - Manufacture authoritative server timestamps.
* - Insert directly into browser-accessible database tables.
*/
(function initializeStatsCoreAuthenticationReceipts(global) {
  "use strict";

  const errors =
    global.STATSCORE_AUTH_ERRORS;

  const contextService =
    global.STATSCORE_AUTH_CONTEXT;

  if (!errors) {
    throw new Error(
      "Load statscore-authentication-errors.js before " +
        "statscore-authentication-receipts.js"
    );
  }

  if (!contextService) {
    throw new Error(
      "Load statscore-authentication-context.js before " +
        "statscore-authentication-receipts.js"
    );
  }

  const {
    ERROR_CODES,
    StatsCoreAuthenticationError
  } = errors;

  const VERSION =
    "1.2.0";

  const CONTRACT_NAME =
    "STATSCORE_AUTHENTICATION_RECEIPT_REQUEST_V1";

  const ACKNOWLEDGMENT_CONTRACT_NAME =
    "STATSCORE_AUTHENTICATION_RECEIPT_ACKNOWLEDGMENT_V1";

  const MAX_STRING_LENGTH =
    2048;

  const MAX_ERROR_CODE_LENGTH =
    256;

  const MAX_CORRELATION_ID_LENGTH =
    512;

  const MAX_RECEIPT_ID_LENGTH =
    512;

  const MAX_METADATA_KEY_LENGTH =
    256;

  const MAX_METADATA_SERIALIZED_LENGTH =
    16384;

  const MAX_METADATA_DEPTH =
    8;

  const MAX_DESTINATION_DECODE_PASSES =
    4;

  const RECEIPT_FIELDS = Object.freeze([
    "outcome",
    "session_id",
    "user_id",
    "role",
    "authentication_source",
    "requested_destination",
    "resolved_destination",
    "error_code",
    "correlation_id",
    "metadata"
  ]);

  const REQUIRED_RECEIPT_FIELDS =
    RECEIPT_FIELDS;

  const ACKNOWLEDGMENT_FIELDS = Object.freeze([
    "accepted",
    "receipt_id",
    "recorded_at"
  ]);

  const ALLOWED_OUTCOMES = Object.freeze([
    "SUCCESS",
    "FAILURE"
  ]);

  const PROHIBITED_METADATA_KEYS =
    Object.freeze([
      "__proto__",
      "prototype",
      "constructor"
    ]);

  const ALLOWED_ROLES = Object.freeze([
    ...contextService.ALLOWED_ROLES
  ]);

  const ALLOWED_AUTHENTICATION_SOURCES = Object.freeze([
    ...contextService.ALLOWED_AUTHENTICATION_SOURCES
  ]);

  const EVENT_NAMES = Object.freeze({
    WRITE_SUCCEEDED:
      "statscore:authentication-receipt-written",

    WRITE_FAILED:
      "statscore:authentication-receipt-write-failed",

    REJECTED:
      "statscore:authentication-receipt-rejected"
  });

  const ALLOWED_OUTCOME_SET =
    new Set(ALLOWED_OUTCOMES);

  const ALLOWED_ROLE_SET =
    new Set(ALLOWED_ROLES);

  const ALLOWED_AUTHENTICATION_SOURCE_SET =
    new Set(ALLOWED_AUTHENTICATION_SOURCES);

  const PROHIBITED_METADATA_KEY_SET =
    new Set(PROHIBITED_METADATA_KEYS);

  const state = {
    client:
      null,

    rpc:
      null,

    writeQueue:
      Promise.resolve(),

    pendingWrites:
      0
  };

  function cleanString(value) {
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  function createReceiptError(
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

  function normalizeReceiptError(
    rawError,
    message
  ) {
    if (
      rawError instanceof
      StatsCoreAuthenticationError
    ) {
      return rawError;
    }

    return createReceiptError(
      ERROR_CODES.RECEIPT_FAILURE,
      message ||
        "The governed authentication receipt could not be written.",
      {
        cause:
          rawError,

        retryable:
          true
      }
    );
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
          : ERROR_CODES.RECEIPT_FAILURE,

      message:
        error && error.message
          ? error.message
          : "Authentication receipt operation failed."
    };
  }

  function dispatchEventSafely(
    eventName,
    detail
  ) {
    try {
      if (
        !global ||
        typeof global.dispatchEvent !== "function" ||
        typeof global.CustomEvent !== "function"
      ) {
        return false;
      }

      global.dispatchEvent(
        new global.CustomEvent(
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
       * Receipt events are observational only.
       * Event failure must never change receipt disposition.
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

  function assertSafeIdentifier(
    value,
    label
  ) {
    const candidate =
      cleanString(value);

    if (!candidate) {
      throw createReceiptError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} is required.`
      );
    }

    if (
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(
        candidate
      )
    ) {
      throw createReceiptError(
        ERROR_CODES.CONFIGURATION_ERROR,
        `${label} contains unsupported characters.`
      );
    }

    return candidate;
  }

  function assertClient(client) {
    if (
      !client ||
      typeof client !== "object" ||
      typeof client.rpc !== "function"
    ) {
      throw createReceiptError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "A Supabase client exposing rpc() is required for governed " +
          "authentication receipt persistence."
      );
    }

    return client;
  }

  function configure(options) {
    if (
      state.pendingWrites > 0
    ) {
      throw createReceiptError(
        ERROR_CODES.CONFIGURATION_ERROR,
        "Authentication receipt transport cannot be reconfigured while " +
          "writes are pending."
      );
    }

    const next =
      options &&
      typeof options === "object"
        ? options
        : {};

    let nextClient =
      state.client;

    let nextRpc =
      state.rpc;

    /*
     * Validate all proposed configuration before mutating state.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        next,
        "client"
      )
    ) {
      nextClient =
        assertClient(
          next.client
        );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        next,
        "rpc"
      )
    ) {
      nextRpc =
        assertSafeIdentifier(
          next.rpc,
          "Authentication receipt RPC"
        );
    }

    assertClient(
      nextClient
    );

    assertSafeIdentifier(
      nextRpc,
      "Authentication receipt RPC"
    );

    state.client =
      nextClient;

    state.rpc =
      nextRpc;

    return getConfiguration();
  }

  function getConfiguration() {
    return Object.freeze({
      configured:
        Boolean(
          state.client &&
          state.rpc
        ),

      rpc:
        state.rpc,

      queued_writes:
        state.pendingWrites,

      write_in_progress:
        state.pendingWrites > 0,

      transport:
        "supabase_rpc",

      reconfiguration_policy:
        "prohibited_while_writes_pending",

      direct_table_write:
        false
    });
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
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} must be a plain object.`
      );
    }

    const prototype =
      Object.getPrototypeOf(value);

    if (
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} must use a supported object shape.`
      );
    }

    return value;
  }

  function validateExactFieldSet(
    value,
    authorizedFields,
    label
  ) {
    const keys =
      Object.keys(value);

    const missingFields =
      authorizedFields.filter(
        function findMissingField(fieldName) {
          return !Object.prototype.hasOwnProperty.call(
            value,
            fieldName
          );
        }
      );

    if (
      missingFields.length > 0
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} is missing required fields: ` +
          missingFields.join(", ")
      );
    }

    const unauthorizedFields =
      keys.filter(
        function findUnauthorizedField(fieldName) {
          return !authorizedFields.includes(
            fieldName
          );
        }
      );

    if (
      unauthorizedFields.length > 0
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} contains unauthorized fields: ` +
          unauthorizedFields.join(", ")
      );
    }

    if (
      keys.length !==
      authorizedFields.length
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} must contain exactly ${authorizedFields.length} fields.`
      );
    }
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
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
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
      cleanString(value);

    if (!candidate) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} is required.`
      );
    }

    if (
      candidate.length >
      maximumLength
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} exceeds the authorized maximum length.`
      );
    }

    rejectControlCharacters(
      candidate,
      label
    );

    return candidate;
  }

  function validateNullableString(
    value,
    label,
    maximumLength
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    return validateRequiredString(
      value,
      label,
      maximumLength
    );
  }

  function normalizeOutcome(value) {
    const outcome =
      cleanString(value)
        .toUpperCase();

    if (
      !ALLOWED_OUTCOME_SET.has(
        outcome
      )
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `Unsupported authentication receipt outcome: ${
          outcome || "empty"
        }`
      );
    }

    return outcome;
  }

  function normalizeRole(value) {
    return contextService.normalizeRole(
      value
    );
  }

  function validateNullableRole(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const role =
      normalizeRole(value);

    if (
      !role ||
      !ALLOWED_ROLE_SET.has(
        role
      )
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `Unsupported authentication receipt role: ${role || "empty"}`
      );
    }

    return role;
  }

  function normalizeAuthenticationSource(value) {
    return contextService
      .normalizeAuthenticationSource(
        value
      );
  }

  function validateAuthenticationSource(value) {
    const source =
      normalizeAuthenticationSource(
        value
      );

    if (
      !source ||
      !ALLOWED_AUTHENTICATION_SOURCE_SET.has(
        source
      )
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
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

  function decodeRouteBounded(value) {
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
          decodeURIComponent(
            current
          );
      } catch (_error) {
        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Receipt destination contains invalid URL encoding."
        );
      }

      if (
        decoded === current
      ) {
        return decoded;
      }

      current =
        decoded;
    }

    try {
      const next =
        decodeURIComponent(
          current
        );

      if (
        next !== current
      ) {
        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Receipt destination exceeds the authorized encoding depth."
        );
      }
    } catch (rawError) {
      if (
        rawError instanceof
        StatsCoreAuthenticationError
      ) {
        throw rawError;
      }

      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Receipt destination contains invalid URL encoding."
      );
    }

    return current;
  }

  function validateRouteRepresentation(
    value,
    label
  ) {
    rejectControlCharacters(
      value,
      label
    );

    if (
      value.startsWith("/") ||
      value.startsWith("\\") ||
      value.includes("\\") ||
      containsUnsafeScheme(value)
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} must be application-relative.`
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
          return (
            segment === "." ||
            segment === ".."
          );
        }
      )
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} contains a prohibited traversal segment.`
      );
    }

    if (
      value.includes("../") ||
      value.includes("..\\") ||
      value.includes("./") ||
      value.includes(".\\")
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} contains prohibited path traversal.`
      );
    }

    return value;
  }

  function validateDestination(
    value,
    label,
    allowRoleAwareDefault
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const destination =
      validateRequiredString(
        value,
        label,
        MAX_STRING_LENGTH
      );

    if (
      allowRoleAwareDefault === true &&
      destination ===
        "role-aware-default"
    ) {
      return destination;
    }

    validateRouteRepresentation(
      destination,
      label
    );

    const fullyDecodedDestination =
      decodeRouteBounded(
        destination
      );

    validateRouteRepresentation(
      fullyDecodedDestination,
      `decoded ${label}`
    );

    return destination;
  }

  function validateErrorCode(
    value,
    outcome
  ) {
    const errorCode =
      validateNullableString(
        value,
        "error_code",
        MAX_ERROR_CODE_LENGTH
      );

    if (
      outcome === "SUCCESS" &&
      errorCode !== null
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "A successful authentication receipt cannot contain error_code."
      );
    }

    if (
      outcome === "FAILURE" &&
      errorCode === null
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "A failed authentication receipt requires error_code."
      );
    }

    return errorCode;
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
      const propertyName of
      Object.keys(value)
    ) {
      deepFreeze(
        value[propertyName]
      );
    }

    return Object.freeze(
      value
    );
  }

  function validateMetadataValue(
    value,
    depth,
    seen
  ) {
    if (
      depth >
      MAX_METADATA_DEPTH
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata exceeds the authorized depth."
      );
    }

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    if (
      typeof value === "number"
    ) {
      if (
        !Number.isFinite(value)
      ) {
        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Authentication receipt metadata contains a non-finite number."
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
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata contains an unsupported value."
      );
    }

    if (
      typeof value !== "object"
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata contains an unsupported type."
      );
    }

    if (
      seen.has(value)
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata contains a circular reference."
      );
    }

    seen.add(value);

    if (
      Array.isArray(value)
    ) {
      const validatedArray =
        value.map(
          function validateArrayItem(item) {
            return validateMetadataValue(
              item,
              depth + 1,
              seen
            );
          }
        );

      seen.delete(value);

      return validatedArray;
    }

    const prototype =
      Object.getPrototypeOf(value);

    if (
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      seen.delete(value);

      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata must contain only plain objects."
      );
    }

    const validatedObject =
      Object.create(null);

    const normalizedKeys =
      new Set();

    for (
      const [key, item] of
      Object.entries(value)
    ) {
      const normalizedKey =
        validateRequiredString(
          key,
          "metadata key",
          MAX_METADATA_KEY_LENGTH
        );

      if (
        PROHIBITED_METADATA_KEY_SET.has(
          normalizedKey
        )
      ) {
        seen.delete(value);

        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Authentication receipt metadata contains a prohibited key: " +
            normalizedKey
        );
      }

      if (
        normalizedKeys.has(
          normalizedKey
        )
      ) {
        seen.delete(value);

        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Authentication receipt metadata contains a duplicate " +
            `normalized key: ${normalizedKey}`
        );
      }

      normalizedKeys.add(
        normalizedKey
      );

      validatedObject[normalizedKey] =
        validateMetadataValue(
          item,
          depth + 1,
          seen
        );
    }

    seen.delete(value);

    return validatedObject;
  }

  function validateMetadata(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return Object.freeze(
        Object.create(null)
      );
    }

    assertPlainObject(
      value,
      "metadata"
    );

    const validated =
      validateMetadataValue(
        value,
        0,
        new WeakSet()
      );

    let serialized;

    try {
      serialized =
        JSON.stringify(
          validated
        );
    } catch (rawError) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata could not be serialized.",
        {
          cause:
            rawError
        }
      );
    }

    if (
      serialized.length >
      MAX_METADATA_SERIALIZED_LENGTH
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Authentication receipt metadata exceeds the authorized size."
      );
    }

    return deepFreeze(
      validated
    );
  }

  function validateOutcomeRequirements(receipt) {
    if (
      receipt.outcome === "SUCCESS"
    ) {
      if (
        !receipt.session_id ||
        !receipt.user_id ||
        !receipt.role ||
        !receipt.resolved_destination
      ) {
        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "A successful authentication receipt requires session_id, " +
            "user_id, role, and resolved_destination."
        );
      }

      return;
    }

    if (
      receipt.outcome === "FAILURE" &&
      receipt.error_code === null
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "A failed authentication receipt requires error_code."
      );
    }
  }

  function validate(payload) {
    const candidate =
      assertPlainObject(
        payload,
        "Authentication receipt request"
      );

    validateExactFieldSet(
      candidate,
      RECEIPT_FIELDS,
      "Authentication receipt request"
    );

    const outcome =
      normalizeOutcome(
        candidate.outcome
      );

    const receipt =
      Object.freeze({
        outcome,

        session_id:
          validateNullableString(
            candidate.session_id,
            "session_id",
            MAX_STRING_LENGTH
          ),

        user_id:
          validateNullableString(
            candidate.user_id,
            "user_id",
            MAX_STRING_LENGTH
          ),

        role:
          validateNullableRole(
            candidate.role
          ),

        authentication_source:
          validateAuthenticationSource(
            candidate.authentication_source
          ),

        requested_destination:
          validateDestination(
            candidate.requested_destination,
            "requested_destination",
            true
          ),

        resolved_destination:
          validateDestination(
            candidate.resolved_destination,
            "resolved_destination",
            false
          ),

        error_code:
          validateErrorCode(
            candidate.error_code,
            outcome
          ),

        correlation_id:
          validateRequiredString(
            candidate.correlation_id,
            "correlation_id",
            MAX_CORRELATION_ID_LENGTH
          ),

        metadata:
          validateMetadata(
            candidate.metadata
          )
      });

    validateOutcomeRequirements(
      receipt
    );

    return receipt;
  }

  function create(payload) {
    try {
      return validate(
        payload
      );
    } catch (error) {
      dispatchRejected(
        "create",
        error
      );

      throw error;
    }
  }

  function validateCanonicalUtcTimestamp(
    value,
    label
  ) {
    const timestamp =
      validateRequiredString(
        value,
        label,
        64
      );

    const canonicalUtcPattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    if (
      !canonicalUtcPattern.test(
        timestamp
      )
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} must be a canonical ISO-8601 UTC timestamp.`
      );
    }

    const parsedTimestamp =
      Date.parse(
        timestamp
      );

    if (
      !Number.isFinite(
        parsedTimestamp
      ) ||
      new Date(
        parsedTimestamp
      ).toISOString() !== timestamp
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        `${label} is not a valid canonical timestamp.`
      );
    }

    return timestamp;
  }

  function normalizeRpcResponseData(data) {
    if (
      Array.isArray(data)
    ) {
      if (
        data.length !== 1
      ) {
        throw createReceiptError(
          ERROR_CODES.RECEIPT_FAILURE,
          "Governed receipt RPC returned an unexpected result count."
        );
      }

      return data[0];
    }

    return data;
  }

  function validateRpcAcknowledgment(data) {
    const candidate =
      assertPlainObject(
        normalizeRpcResponseData(
          data
        ),
        "Governed receipt RPC acknowledgment"
      );

    validateExactFieldSet(
      candidate,
      ACKNOWLEDGMENT_FIELDS,
      "Governed receipt RPC acknowledgment"
    );

    if (
      candidate.accepted !== true
    ) {
      throw createReceiptError(
        ERROR_CODES.RECEIPT_FAILURE,
        "Governed receipt RPC did not confirm receipt acceptance."
      );
    }

    const receiptId =
      validateRequiredString(
        candidate.receipt_id,
        "receipt_id",
        MAX_RECEIPT_ID_LENGTH
      );

    const recordedAt =
      validateCanonicalUtcTimestamp(
        candidate.recorded_at,
        "recorded_at"
      );

    return Object.freeze({
      accepted:
        true,

      receipt_id:
        receiptId,

      recorded_at:
        recordedAt
    });
  }

  function buildRpcArguments(receipt) {
    return Object.freeze({
      p_outcome:
        receipt.outcome,

      p_session_id:
        receipt.session_id,

      p_user_id:
        receipt.user_id,

      p_role:
        receipt.role,

      p_authentication_source:
        receipt.authentication_source,

      p_requested_destination:
        receipt.requested_destination,

      p_resolved_destination:
        receipt.resolved_destination,

      p_error_code:
        receipt.error_code,

      p_correlation_id:
        receipt.correlation_id,

      p_metadata:
        receipt.metadata
    });
  }

  async function performWrite(receipt) {
    /*
     * The receipt received here was validated, detached, and frozen
     * synchronously when write() accepted the submission.
     */
    const client =
      assertClient(
        state.client
      );

    const rpc =
      assertSafeIdentifier(
        state.rpc,
        "Authentication receipt RPC"
      );

    let response;

    try {
      response =
        await client.rpc(
          rpc,
          buildRpcArguments(
            receipt
          )
        );
    } catch (rawError) {
      const error =
        normalizeReceiptError(
          rawError,
          "The governed authentication receipt RPC could not be reached."
        );

      dispatchEventSafely(
        EVENT_NAMES.WRITE_FAILED,
        Object.freeze({
          phase:
            "rpc_transport",

          outcome:
            receipt.outcome,

          correlation_id:
            receipt.correlation_id,

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

    if (
      !response ||
      response.error
    ) {
      const error =
        normalizeReceiptError(
          response
            ? response.error
            : null,
          "The governed authentication receipt RPC rejected the write."
        );

      dispatchEventSafely(
        EVENT_NAMES.WRITE_FAILED,
        Object.freeze({
          phase:
            "rpc_response",

          outcome:
            receipt.outcome,

          correlation_id:
            receipt.correlation_id,

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

    let acknowledgment;

    try {
      acknowledgment =
        validateRpcAcknowledgment(
          response.data
        );
    } catch (rawError) {
      const error =
        normalizeReceiptError(
          rawError,
          "The governed authentication receipt RPC returned an invalid acknowledgment."
        );

      dispatchEventSafely(
        EVENT_NAMES.WRITE_FAILED,
        Object.freeze({
          phase:
            "acknowledgment_validation",

          outcome:
            receipt.outcome,

          correlation_id:
            receipt.correlation_id,

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

    const result =
      Object.freeze({
        written:
          true,

        outcome:
          receipt.outcome,

        receipt_id:
          acknowledgment.receipt_id,

        recorded_at:
          acknowledgment.recorded_at,

        correlation_id:
          receipt.correlation_id
      });

    dispatchEventSafely(
      EVENT_NAMES.WRITE_SUCCEEDED,
      Object.freeze({
        result,

        contract:
          CONTRACT_NAME,

        acknowledgment_contract:
          ACKNOWLEDGMENT_CONTRACT_NAME,

        version:
          VERSION
      })
    );

    return result;
  }

  function write(payload) {
    let receipt;

    /*
     * Validation and detachment occur synchronously at submission time.
     * The caller's original object is never stored in the queue.
     */
    try {
      receipt =
        validate(
          payload
        );
    } catch (error) {
      dispatchRejected(
        "write_validation",
        error
      );

      return Promise.reject(
        error
      );
    }

    /*
     * Transport must already be valid when the submission is accepted.
     */
    try {
      assertClient(
        state.client
      );

      assertSafeIdentifier(
        state.rpc,
        "Authentication receipt RPC"
      );
    } catch (error) {
      dispatchRejected(
        "write_configuration",
        error
      );

      return Promise.reject(
        error
      );
    }

    state.pendingWrites += 1;

    /*
     * Every validated receipt receives its own queued write operation.
     *
     * A prior failure does not terminate the queue.
     * No caller receives another submission's acknowledgment,
     * receipt ID, correlation ID, or promise disposition.
     */
    const queuedWrite =
      state.writeQueue
        .catch(
          function preserveQueueAfterFailure() {
            return undefined;
          }
        )
        .then(
          function writeValidatedReceipt() {
            return performWrite(
              receipt
            );
          }
        );

    state.writeQueue =
      queuedWrite;

    return queuedWrite.finally(
      function decrementPendingWriteCount() {
        state.pendingWrites =
          Math.max(
            0,
            state.pendingWrites - 1
          );
      }
    );
  }

  function getContractDefinition() {
    return Object.freeze({
      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME,

      version:
        VERSION,

      receipt_fields:
        RECEIPT_FIELDS,

      required_receipt_fields:
        REQUIRED_RECEIPT_FIELDS,

      acknowledgment_fields:
        ACKNOWLEDGMENT_FIELDS,

      allowed_outcomes:
        ALLOWED_OUTCOMES,

      allowed_roles:
        ALLOWED_ROLES,

      allowed_authentication_sources:
        ALLOWED_AUTHENTICATION_SOURCES,

      prohibited_metadata_keys:
        PROHIBITED_METADATA_KEYS,

      event_names:
        EVENT_NAMES,

      transport:
        "supabase_rpc",

      concurrency_policy:
        "independent_fifo_queue",

      submission_capture:
        "synchronous_validation_and_detachment",

      reconfiguration_policy:
        "prohibited_while_writes_pending",

      metadata_object_prototype:
        null,

      server_authoritative:
        true,

      direct_browser_table_write:
        false,

      browser_manufactures_receipt_id:
        false,

      browser_manufactures_recorded_at:
        false,

      acknowledgment_shape:
        Object.freeze({
          accepted:
            true,

          receipt_id:
            "required_string",

          recorded_at:
            "canonical_iso_8601_utc"
        })
    });
  }

  global.STATSCORE_AUTH_RECEIPTS =
    Object.freeze({
      version:
        VERSION,

      contract:
        CONTRACT_NAME,

      acknowledgment_contract:
        ACKNOWLEDGMENT_CONTRACT_NAME,

      EVENT_NAMES,

      RECEIPT_FIELDS,

      REQUIRED_RECEIPT_FIELDS,

      ACKNOWLEDGMENT_FIELDS,

      ALLOWED_OUTCOMES,

      ALLOWED_ROLES,

      ALLOWED_AUTHENTICATION_SOURCES,

      PROHIBITED_METADATA_KEYS,

      configure,

      getConfiguration,

      getContractDefinition,

      create,

      validate,

      write
    });
})(window); 
