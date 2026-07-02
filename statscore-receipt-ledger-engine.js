/* ============================================================
   STATScore™ Receipt Ledger Engine
   File: statscore-receipt-ledger-engine.js
   Version: STATSCORE-RECEIPT-LEDGER-ENGINE-V2
   Purpose:
   Immutable receipt chain + Stream 6 Multi-Box receipt/audit persistence.
   Tables:
   - sc_multibox_receipts
   - sc_multibox_audit_events
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const ENGINE_ID = "sc-receipt-ledger-engine";
  const VERSION = "STATSCORE-RECEIPT-LEDGER-ENGINE-V2";

  const LEDGER = {
    initialized: false,
    booted_at: null,
    updated_at: null,
    receipts: [],
    receipt_index: {},
    last_receipt: null,
    chain: {
      count: 0,
      last_hash: null,
      status: "UNINITIALIZED"
    }
  };

  function now() {
    return new Date().toISOString();
  }

  function lower(value) {
    return String(value || "").trim().toLowerCase();
  }

  function upper(value) {
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function db() {
    return (
      window.STATScoreCore?.getClient?.() ||
      window.STATScoreSupabase ||
      window.supabaseClient ||
      null
    );
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";

    return "{" + Object.keys(value).sort().map((key) => {
      return JSON.stringify(key) + ":" + stableStringify(value[key]);
    }).join(",") + "}";
  }

  async function sha256(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function makeReceiptId(type = "multibox") {
    return (
      "sc_" +
      lower(type).replace(/[^a-z0-9]+/g, "_") +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function publishLedger() {
    window.STATScoreReceiptLedger = LEDGER;
    window.STATScore.ReceiptLedger = LEDGER;
    return LEDGER;
  }

  async function addToLocalChain(receipt = {}) {
    const base = {
      ...receipt,
      ledger_engine_id: ENGINE_ID,
      ledger_version: VERSION,
      previous_hash: LEDGER.chain.last_hash || null,
      chain_created_at: now()
    };

    const receipt_hash = await sha256(stableStringify(base));

    const chained = {
      ...base,
      receipt_hash
    };

    LEDGER.receipts.push(chained);
    LEDGER.receipt_index[chained.local_receipt_id || chained.id || chained.receipt_id] = chained;
    LEDGER.last_receipt = chained;
    LEDGER.chain.count += 1;
    LEDGER.chain.last_hash = receipt_hash;
    LEDGER.chain.status = "ACTIVE";
    LEDGER.updated_at = now();

    publishLedger();

    return chained;
  }

  function buildMultiBoxReceipt(message = {}, evaluation = {}, action = "message_event") {
    return {
      local_receipt_id: makeReceiptId(action),

      message_id: message.id || message.message_id || null,

      receipt_type: "STATSCORE_MULTIBOX_RECEIPT",
      action,

      sender_user_id: message.sender_user_id || null,
      sender_role: lower(message.sender_role || message.from_role),
      sender_role_id: message.sender_role_id || null,
      sender_label: message.sender_label || null,

      target_role: lower(message.target_role || message.to_role),
      target_directory: lower(message.target_directory || ""),
      target_recipient_id: message.target_recipient_id || message.to_user_id || null,
      target_recipient_type: lower(message.target_recipient_type || message.target_role || message.to_role),
      target_recipient_label: message.target_recipient_label || message.to_label || null,

      athlete_id: message.athlete_id || null,
      snapshot_id: message.snapshot_id || null,

      receipt_payload: {
        engine_id: ENGINE_ID,
        version: VERSION,
        action,
        status: message.status || message.message_status || null,
        communication_window: message.communication_window || null,
        allowed: !!evaluation.allowed,
        reason: evaluation.reason || null,
        window_rule: evaluation.window_rule || null,
        directory_rule: evaluation.directory_rule || null,
        locked: true,
        created_at: now()
      }
    };
  }

  function buildAuditEvent(message = {}, receipt = {}, eventType = "message_event", payload = {}) {
    return {
      message_id: message.id || message.message_id || null,
      receipt_id: receipt.id || null,

      event_type: eventType,

      actor_user_id: message.sender_user_id || null,
      actor_role: lower(message.sender_role || message.from_role),
      actor_role_id: message.sender_role_id || null,

      event_payload: {
        engine_id: ENGINE_ID,
        version: VERSION,
        sender_role: lower(message.sender_role || message.from_role),
        target_role: lower(message.target_role || message.to_role),
        target_directory: lower(message.target_directory || ""),
        target_recipient_id: message.target_recipient_id || message.to_user_id || null,
        status: message.status || message.message_status || null,
        ...payload,
        created_at: now()
      }
    };
  }

  async function persistMultiBoxReceipt(receipt = {}) {
    const client = db();

    if (!client) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        receipt
      };
    }

    const { data, error } = await client
      .from("sc_multibox_receipts")
      .insert({
        message_id: receipt.message_id || null,

        receipt_type: receipt.receipt_type || "STATSCORE_MULTIBOX_RECEIPT",
        action: receipt.action || "message_event",

        sender_user_id: receipt.sender_user_id || null,
        sender_role: receipt.sender_role,
        sender_role_id: receipt.sender_role_id || null,
        sender_label: receipt.sender_label || null,

        target_role: receipt.target_role,
        target_directory: receipt.target_directory || null,
        target_recipient_id: receipt.target_recipient_id || null,
        target_recipient_type: receipt.target_recipient_type || null,
        target_recipient_label: receipt.target_recipient_label || null,

        athlete_id: receipt.athlete_id || null,
        snapshot_id: receipt.snapshot_id || null,

        receipt_payload: receipt.receipt_payload || {}
      })
      .select("*")
      .single();

    if (error) {
      console.error("[STATScore Receipt Ledger] Multi-Box receipt insert failed:", error);
      return {
        ok: false,
        status: "RECEIPT_INSERT_FAILED",
        error,
        receipt
      };
    }

    return {
      ok: true,
      status: "RECEIPT_INSERTED",
      receipt: data
    };
  }

  async function persistAuditEvent(event = {}) {
    const client = db();

    if (!client) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        event
      };
    }

    const { data, error } = await client
      .from("sc_multibox_audit_events")
      .insert({
        message_id: event.message_id || null,
        receipt_id: event.receipt_id || null,

        event_type: event.event_type || "message_event",

        actor_user_id: event.actor_user_id || null,
        actor_role: event.actor_role || null,
        actor_role_id: event.actor_role_id || null,

        event_payload: event.event_payload || {}
      })
      .select("*")
      .single();

    if (error) {
      console.error("[STATScore Receipt Ledger] Multi-Box audit insert failed:", error);
      return {
        ok: false,
        status: "AUDIT_INSERT_FAILED",
        error,
        event
      };
    }

    return {
      ok: true,
      status: "AUDIT_INSERTED",
      event: data
    };
  }

  async function recordMultiBoxEvent(message = {}, evaluation = {}, action = "message_event", auditPayload = {}) {
    const receiptDraft = buildMultiBoxReceipt(message, evaluation, action);
    const chained = await addToLocalChain(receiptDraft);

    const receiptResult = await persistMultiBoxReceipt({
      ...receiptDraft,
      receipt_payload: {
        ...receiptDraft.receipt_payload,
        local_receipt_id: chained.local_receipt_id,
        receipt_hash: chained.receipt_hash,
        previous_hash: chained.previous_hash,
        chain_count: LEDGER.chain.count
      }
    });

    const persistedReceipt = receiptResult.receipt || {};

    const auditDraft = buildAuditEvent(
      message,
      persistedReceipt,
      action,
      {
        ...auditPayload,
        local_receipt_id: chained.local_receipt_id,
        receipt_hash: chained.receipt_hash
      }
    );

    const auditResult = await persistAuditEvent(auditDraft);

    return {
      ok: receiptResult.ok && auditResult.ok,
      status: receiptResult.ok && auditResult.ok ? "MULTIBOX_EVENT_RECORDED" : "MULTIBOX_EVENT_PARTIAL",
      local_receipt: chained,
      receipt: receiptResult,
      audit: auditResult
    };
  }

  async function createReceipt(type, payload = {}, options = {}) {
    const genericReceipt = {
      local_receipt_id: options.receipt_id || makeReceiptId(type),
      receipt_type: upper(type || "RUNTIME_EVENT"),
      action: lower(options.action || payload.action || type || "runtime_event"),

      sender_user_id: payload.sender_user_id || options.sender_user_id || null,
      sender_role: lower(payload.sender_role || payload.actor_role || options.actor_role || "system"),
      sender_role_id: payload.sender_role_id || options.sender_role_id || null,
      sender_label: payload.sender_label || null,

      target_role: lower(payload.target_role || "system"),
      target_directory: lower(payload.target_directory || ""),
      target_recipient_id: payload.target_recipient_id || null,
      target_recipient_type: payload.target_recipient_type || null,
      target_recipient_label: payload.target_recipient_label || null,

      athlete_id: payload.athlete_id || options.athlete_id || null,
      snapshot_id: payload.snapshot_id || options.snapshot_id || null,

      receipt_payload: {
        engine_id: ENGINE_ID,
        version: VERSION,
        source_type: "generic_receipt",
        status: options.status || payload.status || "recorded",
        payload,
        created_at: now()
      }
    };

    const chained = await addToLocalChain(genericReceipt);

    if (options.persist === false) {
      return chained;
    }

    await persistMultiBoxReceipt({
      ...genericReceipt,
      receipt_payload: {
        ...genericReceipt.receipt_payload,
        local_receipt_id: chained.local_receipt_id,
        receipt_hash: chained.receipt_hash,
        previous_hash: chained.previous_hash
      }
    });

    return chained;
  }

  function getReceipt(receiptId) {
    return LEDGER.receipt_index[receiptId] || null;
  }

  function searchReceipts(filters = {}) {
    return LEDGER.receipts.filter((receipt) => {
      if (filters.sender_role && receipt.sender_role !== lower(filters.sender_role)) return false;
      if (filters.target_role && receipt.target_role !== lower(filters.target_role)) return false;
      if (filters.athlete_id && receipt.athlete_id !== filters.athlete_id) return false;
      if (filters.snapshot_id && receipt.snapshot_id !== filters.snapshot_id) return false;
      if (filters.action && receipt.action !== lower(filters.action)) return false;
      return true;
    });
  }

  async function verifyLedgerChain() {
    let previousHash = null;
    const failures = [];

    for (const receipt of LEDGER.receipts) {
      const reconstructed = { ...receipt };
      delete reconstructed.receipt_hash;

      if (reconstructed.previous_hash !== previousHash) {
        failures.push({
          receipt_id: receipt.local_receipt_id,
          issue: "PREVIOUS_HASH_MISMATCH",
          expected: previousHash,
          actual: reconstructed.previous_hash
        });
      }

      const expectedHash = await sha256(stableStringify(reconstructed));

      if (expectedHash !== receipt.receipt_hash) {
        failures.push({
          receipt_id: receipt.local_receipt_id,
          issue: "RECEIPT_HASH_MISMATCH",
          expected: expectedHash,
          actual: receipt.receipt_hash
        });
      }

      previousHash = receipt.receipt_hash;
    }

    return {
      ok: failures.length === 0,
      receipt_count: LEDGER.receipts.length,
      failures,
      verified_at: now()
    };
  }

  async function loadMultiBoxReceipts(filters = {}) {
    const client = db();

    if (!client) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        receipts: []
      };
    }

    let query = client
      .from("sc_multibox_receipts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.message_id) query = query.eq("message_id", filters.message_id);
    if (filters.sender_role) query = query.eq("sender_role", lower(filters.sender_role));
    if (filters.target_role) query = query.eq("target_role", lower(filters.target_role));
    if (filters.athlete_id) query = query.eq("athlete_id", filters.athlete_id);
    if (filters.snapshot_id) query = query.eq("snapshot_id", filters.snapshot_id);

    const { data, error } = await query;

    if (error) {
      return {
        ok: false,
        status: "RECEIPT_LOAD_FAILED",
        error,
        receipts: []
      };
    }

    return {
      ok: true,
      status: "RECEIPTS_LOADED",
      receipts: data || []
    };
  }

  async function loadAuditEvents(filters = {}) {
    const client = db();

    if (!client) {
      return {
        ok: false,
        status: "NO_DB_CLIENT",
        events: []
      };
    }

    let query = client
      .from("sc_multibox_audit_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.message_id) query = query.eq("message_id", filters.message_id);
    if (filters.receipt_id) query = query.eq("receipt_id", filters.receipt_id);
    if (filters.actor_role) query = query.eq("actor_role", lower(filters.actor_role));
    if (filters.event_type) query = query.eq("event_type", filters.event_type);

    const { data, error } = await query;

    if (error) {
      return {
        ok: false,
        status: "AUDIT_LOAD_FAILED",
        error,
        events: []
      };
    }

    return {
      ok: true,
      status: "AUDIT_EVENTS_LOADED",
      events: data || []
    };
  }

  function renderLedgerPanel(container, options = {}) {
    if (!container) return false;

    const receipts = options.receipts || LEDGER.receipts.slice(-8).reverse();

    container.innerHTML = `
      <div style="
        border:1px solid rgba(255,31,45,.45);
        background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(0,0,0,.35));
        padding:20px;
        color:#f4f4ef;
        box-shadow:0 14px 34px rgba(0,0,0,.55);
      ">
        <div style="
          color:#ff1f2d;
          font-size:12px;
          font-weight:1000;
          letter-spacing:.18em;
          text-transform:uppercase;
        ">
          STATScore Receipt Ledger
        </div>

        <div style="
          margin-top:10px;
          font-size:34px;
          font-weight:1000;
          color:#ffb100;
        ">
          ${LEDGER.chain.count}
        </div>

        <div style="
          margin-top:5px;
          color:#9fe7ff;
          font-size:12px;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-weight:900;
        ">
          Chain Status: ${LEDGER.chain.status}
        </div>

        <div style="margin-top:18px;display:grid;gap:10px;">
          ${receipts.map((receipt) => `
            <div style="
              border:1px solid rgba(255,255,255,.1);
              background:rgba(0,0,0,.24);
              padding:12px;
            ">
              <div style="
                color:#ffb100;
                font-size:11px;
                font-weight:1000;
                letter-spacing:.1em;
                text-transform:uppercase;
              ">
                ${receipt.receipt_type}
              </div>

              <div style="
                margin-top:6px;
                color:#f4f4ef;
                font-size:12px;
                line-height:1.45;
                word-break:break-word;
              ">
                ${receipt.local_receipt_id}
              </div>

              <div style="
                margin-top:6px;
                color:#8f98a5;
                font-size:10px;
                letter-spacing:.08em;
                text-transform:uppercase;
              ">
                ${receipt.action} · ${receipt.chain_created_at}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    return true;
  }

  function runLedgerHealthCheck() {
    const result = {
      ok: LEDGER.initialized && LEDGER.chain.status === "ACTIVE",
      engine_id: ENGINE_ID,
      version: VERSION,
      total_receipts: LEDGER.chain.count,
      chain_status: LEDGER.chain.status,
      last_hash: LEDGER.chain.last_hash,
      checked_at: now()
    };

    window.STATScoreReceiptLedgerHealth = result;
    return result;
  }

  function expose() {
    window.STATScoreReceiptLedgerEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      getLedger: () => clone(LEDGER),
      publishLedger,

      createReceipt,
      buildMultiBoxReceipt,
      buildAuditEvent,
      recordMultiBoxEvent,

      persistMultiBoxReceipt,
      persistAuditEvent,

      loadMultiBoxReceipts,
      loadAuditEvents,

      getReceipt,
      searchReceipts,
      verifyLedgerChain,
      renderLedgerPanel,
      runLedgerHealthCheck
    };

    window.STATScore.ReceiptLedgerEngine = window.STATScoreReceiptLedgerEngine;
    publishLedger();
  }

  async function init() {
    if (window.__SC_RECEIPT_LEDGER_ENGINE_V2__) {
      console.warn("[STATScore Receipt Ledger] Duplicate initialization blocked.");
      return;
    }

    window.__SC_RECEIPT_LEDGER_ENGINE_V2__ = true;

    LEDGER.initialized = true;
    LEDGER.booted_at = now();
    LEDGER.updated_at = now();
    LEDGER.chain.status = "ACTIVE";

    expose();

    await createReceipt(
      "RECEIPT_LEDGER_ENGINE_ONLINE",
      {
        engine_id: ENGINE_ID,
        version: VERSION
      },
      {
        status: "online",
        persist: false
      }
    );

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
    }

    const panel =
      document.querySelector("#scReceiptLedgerPanel") ||
      document.querySelector("[data-receipt-ledger-panel]");

    if (panel) renderLedgerPanel(panel);

    console.info("[STATScore Receipt Ledger] Engine online:", VERSION);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
