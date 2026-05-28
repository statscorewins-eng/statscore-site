/* ============================================================
   STATScore™ Receipt Ledger Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Immutable Receipt Ledger → Governance Traceability → Audit Authority
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "sc-receipt-ledger-engine";
  const VERSION = "v1.0-immutable-trust-ledger";

  const RECEIPT_TYPES = {
    RUNTIME: "RUNTIME",
    ATHLETE: "ATHLETE",
    GOVERNANCE: "GOVERNANCE",
    MULTIBOX: "MULTIBOX",
    RECRUITER: "RECRUITER",
    PROGRAM: "PROGRAM",
    CRYSTAL_REPORT: "CRYSTAL_REPORT",
    CAMP_COMBINE: "CAMP_COMBINE",
    VISIBILITY: "VISIBILITY",
    MESSAGE_WINDOW: "MESSAGE_WINDOW",
    COUNSELOR_ACCESS: "COUNSELOR_ACCESS",
    AUDIT: "AUDIT",
    ERROR: "ERROR"
  };

  const DEFAULT_LEDGER_STATE = {
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
    },

    stats: {
      total_receipts: 0,
      runtime_receipts: 0,
      governance_receipts: 0,
      athlete_receipts: 0,
      recruiter_receipts: 0,
      program_receipts: 0,
      crystal_receipts: 0,
      camp_receipts: 0,
      error_receipts: 0
    }
  };

  let LEDGER = structuredClone(DEFAULT_LEDGER_STATE);

  function now() {
    return new Date().toISOString();
  }

  function log(message, payload) {
    console.log(`[STATScore Receipt Ledger] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Receipt Ledger] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (_) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function getSupabase() {
    return (
      window.STATScoreSupabase ||
      window.supabaseClient ||
      null
    );
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return "[" + value.map(stableStringify).join(",") + "]";
    }

    return "{" +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ":" + stableStringify(value[key]))
        .join(",") +
      "}";
  }

  async function sha256(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function makeReceiptId(type) {
    return (
      "sc_" +
      normalize(type || "receipt").toLowerCase() +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function classifyReceiptType(type) {
    const key = normalize(type);

    if (key.includes("ATHLETE")) return RECEIPT_TYPES.ATHLETE;
    if (key.includes("RECRUITER")) return RECEIPT_TYPES.RECRUITER;
    if (key.includes("PROGRAM")) return RECEIPT_TYPES.PROGRAM;
    if (key.includes("CRYSTAL")) return RECEIPT_TYPES.CRYSTAL_REPORT;
    if (key.includes("CAMP") || key.includes("COMBINE") || key.includes("EVENT")) return RECEIPT_TYPES.CAMP_COMBINE;
    if (key.includes("MULTIBOX") || key.includes("MULTI_BOX")) return RECEIPT_TYPES.MULTIBOX;
    if (key.includes("VISIBILITY")) return RECEIPT_TYPES.VISIBILITY;
    if (key.includes("MESSAGE") || key.includes("WINDOW")) return RECEIPT_TYPES.MESSAGE_WINDOW;
    if (key.includes("COUNSELOR")) return RECEIPT_TYPES.COUNSELOR_ACCESS;
    if (key.includes("GOVERNANCE") || key.includes("APPROVAL")) return RECEIPT_TYPES.GOVERNANCE;
    if (key.includes("ERROR") || key.includes("FAILED")) return RECEIPT_TYPES.ERROR;
    if (key.includes("AUDIT")) return RECEIPT_TYPES.AUDIT;

    return RECEIPT_TYPES.RUNTIME;
  }

  function publishLedger() {
    window.STATScoreReceiptLedger = LEDGER;

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.ReceiptLedger = LEDGER;

    return LEDGER;
  }

  function updateStats(receipt) {
    LEDGER.stats.total_receipts = LEDGER.receipts.length;

    if (receipt.receipt_family === RECEIPT_TYPES.RUNTIME) {
      LEDGER.stats.runtime_receipts += 1;
    }

    if (
      receipt.receipt_family === RECEIPT_TYPES.GOVERNANCE ||
      receipt.receipt_family === RECEIPT_TYPES.MULTIBOX ||
      receipt.receipt_family === RECEIPT_TYPES.VISIBILITY ||
      receipt.receipt_family === RECEIPT_TYPES.MESSAGE_WINDOW ||
      receipt.receipt_family === RECEIPT_TYPES.COUNSELOR_ACCESS ||
      receipt.receipt_family === RECEIPT_TYPES.AUDIT
    ) {
      LEDGER.stats.governance_receipts += 1;
    }

    if (receipt.receipt_family === RECEIPT_TYPES.ATHLETE) {
      LEDGER.stats.athlete_receipts += 1;
    }

    if (receipt.receipt_family === RECEIPT_TYPES.RECRUITER) {
      LEDGER.stats.recruiter_receipts += 1;
    }

    if (receipt.receipt_family === RECEIPT_TYPES.PROGRAM) {
      LEDGER.stats.program_receipts += 1;
    }

    if (receipt.receipt_family === RECEIPT_TYPES.CRYSTAL_REPORT) {
      LEDGER.stats.crystal_receipts += 1;
    }

    if (receipt.receipt_family === RECEIPT_TYPES.CAMP_COMBINE) {
      LEDGER.stats.camp_receipts += 1;
    }

    if (receipt.receipt_family === RECEIPT_TYPES.ERROR) {
      LEDGER.stats.error_receipts += 1;
    }
  }

  async function createReceipt(type, payload = {}, options = {}) {
    const receiptFamily = classifyReceiptType(type);

    const base = {
      receipt_id:
        options.receipt_id || makeReceiptId(type),

      engine_id: ENGINE_ID,
      version: VERSION,

      receipt_type:
        normalize(type || "RUNTIME_EVENT"),

      receipt_family:
        receiptFamily,

      actor_role:
        options.actor_role || payload.actor_role || null,

      actor_id:
        options.actor_id || payload.actor_id || null,

      athlete_id:
        options.athlete_id || payload.athlete_id || null,

      snapshot_id:
        options.snapshot_id || payload.snapshot_id || null,

      program_id:
        options.program_id || payload.program_id || null,

      recruiter_id:
        options.recruiter_id || payload.recruiter_id || null,

      event_id:
        options.event_id || payload.event_id || null,

      route:
        options.route || payload.route || null,

      status:
        options.status || payload.status || "RECORDED",

      previous_hash:
        LEDGER.chain.last_hash || null,

      payload:
        payload || {},

      created_at:
        now()
    };

    const receiptHash =
      await sha256(
        stableStringify(base)
      );

    const receipt = {
      ...base,
      receipt_hash: receiptHash
    };

    LEDGER.receipts.push(receipt);

    LEDGER.receipt_index[receipt.receipt_id] = receipt;

    LEDGER.last_receipt = receipt;

    LEDGER.chain.count += 1;
    LEDGER.chain.last_hash = receiptHash;
    LEDGER.chain.status = "ACTIVE";

    LEDGER.updated_at = now();

    updateStats(receipt);
    publishLedger();

    if (window.STATScoreRuntimeStateEngine?.createRuntimeReceipt) {
      try {
        window.STATScoreRuntimeStateEngine.createRuntimeReceipt(
          "LEDGER_RECEIPT_CREATED",
          {
            receipt_id: receipt.receipt_id,
            receipt_type: receipt.receipt_type,
            receipt_hash: receipt.receipt_hash
          }
        );
      } catch (_) {}
    }

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("ledger_receipt_created", receipt);
    }

    if (options.persist !== false) {
      persistReceipt(receipt);
    }

    return receipt;
  }

  async function persistReceipt(receipt) {
    const client = getSupabase();

    if (!client) {
      return {
        ok: false,
        reason: "SUPABASE_UNAVAILABLE"
      };
    }

    const candidateTables = [
      "statscore_receipts",
      "execution_receipts",
      "governance_receipts",
      "audit_receipts"
    ];

    for (const table of candidateTables) {
      try {
        const { error } = await client
          .from(table)
          .insert({
            receipt_id: receipt.receipt_id,
            receipt_type: receipt.receipt_type,
            receipt_family: receipt.receipt_family,
            receipt_hash: receipt.receipt_hash,
            previous_hash: receipt.previous_hash,
            actor_role: receipt.actor_role,
            actor_id: receipt.actor_id,
            athlete_id: receipt.athlete_id,
            snapshot_id: receipt.snapshot_id,
            program_id: receipt.program_id,
            recruiter_id: receipt.recruiter_id,
            event_id: receipt.event_id,
            route: receipt.route,
            status: receipt.status,
            payload: receipt.payload,
            created_at: receipt.created_at
          });

        if (!error) {
          receipt.persisted = true;
          receipt.persisted_table = table;
          publishLedger();

          return {
            ok: true,
            table
          };
        }
      } catch (_) {}
    }

    receipt.persisted = false;
    receipt.persisted_table = null;
    publishLedger();

    return {
      ok: false,
      reason: "NO_COMPATIBLE_RECEIPT_TABLE"
    };
  }

  function getReceipt(receiptId) {
    return LEDGER.receipt_index[receiptId] || null;
  }

  function searchReceipts(filters = {}) {
    return LEDGER.receipts.filter((receipt) => {
      if (filters.receipt_family && receipt.receipt_family !== filters.receipt_family) {
        return false;
      }

      if (filters.receipt_type && receipt.receipt_type !== normalize(filters.receipt_type)) {
        return false;
      }

      if (filters.athlete_id && receipt.athlete_id !== filters.athlete_id) {
        return false;
      }

      if (filters.snapshot_id && receipt.snapshot_id !== filters.snapshot_id) {
        return false;
      }

      if (filters.program_id && receipt.program_id !== filters.program_id) {
        return false;
      }

      if (filters.recruiter_id && receipt.recruiter_id !== filters.recruiter_id) {
        return false;
      }

      if (filters.status && receipt.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  async function verifyLedgerChain() {
    let previousHash = null;
    const failures = [];

    for (const receipt of LEDGER.receipts) {
      const reconstructed = { ...receipt };
      delete reconstructed.receipt_hash;
      delete reconstructed.persisted;
      delete reconstructed.persisted_table;

      if (reconstructed.previous_hash !== previousHash) {
        failures.push({
          receipt_id: receipt.receipt_id,
          issue: "PREVIOUS_HASH_MISMATCH",
          expected: previousHash,
          actual: reconstructed.previous_hash
        });
      }

      const expectedHash =
        await sha256(
          stableStringify(reconstructed)
        );

      if (expectedHash !== receipt.receipt_hash) {
        failures.push({
          receipt_id: receipt.receipt_id,
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

  function exportLedgerJSON() {
    return JSON.stringify(
      {
        exported_at: now(),
        engine_id: ENGINE_ID,
        version: VERSION,
        ledger: LEDGER
      },
      null,
      2
    );
  }

  function downloadLedgerJSON(filename = "statscore-receipt-ledger.json") {
    const blob = new Blob(
      [exportLedgerJSON()],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    return true;
  }

  function absorbRuntimeReceipts() {
    const runtimeReceipts =
      window.STATScoreRuntimeState?.receipts ||
      window.STATScore?.RuntimeState?.receipts ||
      [];

    if (!Array.isArray(runtimeReceipts) || !runtimeReceipts.length) {
      return [];
    }

    const absorbed = [];

    runtimeReceipts.forEach((receipt) => {
      if (!receipt?.receipt_id) return;
      if (LEDGER.receipt_index[receipt.receipt_id]) return;

      createReceipt(
        receipt.receipt_type || "RUNTIME_ABSORBED_RECEIPT",
        receipt.payload || receipt,
        {
          receipt_id: receipt.receipt_id,
          status: "ABSORBED",
          persist: false
        }
      ).then((created) => {
        absorbed.push(created);
      });
    });

    return absorbed;
  }

  function renderLedgerPanel(container, options = {}) {
    if (!container) return false;

    const receipts =
      options.receipts ||
      LEDGER.receipts.slice(-8).reverse();

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
          ${LEDGER.stats.total_receipts}
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

        <div style="
          margin-top:18px;
          display:grid;
          gap:10px;
        ">
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
                ${receipt.receipt_id}
              </div>

              <div style="
                margin-top:6px;
                color:#8f98a5;
                font-size:10px;
                letter-spacing:.08em;
                text-transform:uppercase;
              ">
                ${receipt.receipt_family} · ${receipt.status} · ${receipt.created_at}
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
      ok:
        LEDGER.initialized &&
        LEDGER.chain.status === "ACTIVE",

      engine_id: ENGINE_ID,
      version: VERSION,

      total_receipts:
        LEDGER.stats.total_receipts,

      chain_status:
        LEDGER.chain.status,

      last_hash:
        LEDGER.chain.last_hash,

      stats:
        clone(LEDGER.stats),

      checked_at:
        now()
    };

    window.STATScoreReceiptLedgerHealth = result;

    return result;
  }

  function bindEngineBus() {
    if (!window.STATScoreEngineBus?.on) return;

    window.STATScoreEngineBus.on("runtime_receipt_created", (payload) => {
      createReceipt(
        payload.receipt_type || "RUNTIME_RECEIPT_CAPTURED",
        payload,
        {
          status: "CAPTURED",
          persist: false
        }
      );
    });

    window.STATScoreEngineBus.on("multibox_route_evaluated", (payload) => {
      createReceipt(
        "MULTIBOX_ROUTE_EVALUATED",
        payload,
        {
          status: payload?.blocked ? "BLOCKED" : "RECORDED",
          athlete_id: payload?.receipt?.athlete_id || null,
          snapshot_id: payload?.receipt?.snapshot_id || null,
          route: payload?.decision?.route || null
        }
      );
    });

    window.STATScoreEngineBus.on("camp_meeting_receipt_created", (payload) => {
      createReceipt(
        "CAMP_MEETING_RECEIPT_CAPTURED",
        payload,
        {
          status: payload?.status || "RECORDED",
          athlete_id: payload?.athlete_id || null,
          recruiter_id: payload?.recruiter_id || null,
          event_id: payload?.camp_or_event_id || null
        }
      );
    });

    window.STATScoreEngineBus.on("phase1_runtime_test_completed", (payload) => {
      createReceipt(
        "PHASE1_RUNTIME_TEST_COMPLETED",
        payload,
        {
          status: payload?.status || "RECORDED"
        }
      );
    });
  }

  function expose() {
    window.STATScoreReceiptLedgerEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,

      receipt_types: RECEIPT_TYPES,

      getLedger: () => clone(LEDGER),
      publishLedger,

      createReceipt,
      persistReceipt,
      getReceipt,
      searchReceipts,
      verifyLedgerChain,

      exportLedgerJSON,
      downloadLedgerJSON,
      absorbRuntimeReceipts,
      renderLedgerPanel,
      runLedgerHealthCheck
    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.ReceiptLedgerEngine =
      window.STATScoreReceiptLedgerEngine;

    publishLedger();
  }

  async function init() {
    if (window.__SC_RECEIPT_LEDGER_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__SC_RECEIPT_LEDGER_ENGINE__ = true;

    LEDGER.initialized = true;
    LEDGER.booted_at = now();
    LEDGER.updated_at = now();
    LEDGER.chain.status = "ACTIVE";

    expose();
    bindEngineBus();

    await createReceipt(
      "RECEIPT_LEDGER_ENGINE_ONLINE",
      {
        engine_id: ENGINE_ID,
        version: VERSION
      },
      {
        status: "ONLINE",
        persist: false
      }
    );

    absorbRuntimeReceipts();

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

    if (panel) {
      renderLedgerPanel(panel);
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
