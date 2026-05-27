/* ============================================================
   STATScore™ Trait Render Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Matrix Traits → Dynamic Profile Trait Rendering
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-trait-render-engine";
  const VERSION = "v1.0-profile-trait-renderer";

  const STATUS_LABELS = {
    VERIFIED: "VERIFIED",
    PROJECTED: "PROJECTED",
    EVALUATOR_SIGNAL: "EVALUATOR",
    PENDING_VERIFICATION: "PENDING",
    INSUFFICIENT_EVIDENCE: "INSUFFICIENT"
  };

  function log(message, payload) {
    console.log(`[STATScore Trait Render] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Trait Render] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function clampScore(value) {
    const numeric = Number(value);

    if (Number.isNaN(numeric)) return null;

    return Math.max(0, Math.min(100, numeric));
  }

  function getTraitScore(trait) {
    return clampScore(
      trait.value ??
      trait.score ??
      trait.rating ??
      trait.projected_value ??
      null
    );
  }

  function getTraitStatus(trait) {
    return normalize(trait.status || "PENDING_VERIFICATION").toUpperCase();
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status || "PENDING";
  }

  function getStatusColor(status) {
    const normalized = getTraitStatus({ status });

    if (normalized === "VERIFIED") return "#37d67a";
    if (normalized === "PROJECTED") return "#ffb100";
    if (normalized === "EVALUATOR_SIGNAL") return "#9fe7ff";
    if (normalized === "INSUFFICIENT_EVIDENCE") return "#ff3434";

    return "#aab4c3";
  }

  function createShell(container, matrix) {
    container.innerHTML = "";

    const shell = document.createElement("section");
    shell.className = "sc-trait-render-shell";
    shell.setAttribute("data-statscore-trait-render-shell", "true");

    shell.innerHTML = `
      <div class="sc-trait-header" style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:18px;
        margin-bottom:22px;
        padding-bottom:16px;
        border-bottom:1px solid rgba(255,255,255,.12);
      ">
        <div>
          <div style="
            color:#ff3434;
            font-weight:900;
            letter-spacing:.18em;
            text-transform:uppercase;
            font-size:12px;
          ">
            Position Intelligence Matrix
          </div>

          <div style="
            margin-top:6px;
            font-size:32px;
            line-height:1;
            font-weight:950;
            text-transform:uppercase;
            letter-spacing:.03em;
            color:#f4f2ef;
          ">
            Performance Traits
          </div>

          <div style="
            margin-top:10px;
            color:#9fe7ff;
            font-size:13px;
            font-weight:900;
            letter-spacing:.12em;
            text-transform:uppercase;
          ">
            ${(matrix.position || "ATH")} · ${(matrix.archetype || "General Athlete")}
          </div>
        </div>

        <div style="
          min-width:180px;
          text-align:right;
          border:1px solid rgba(255,177,0,.55);
          background:rgba(255,177,0,.06);
          padding:12px 14px;
          box-shadow:inset 0 0 0 1px rgba(255,255,255,.035);
        ">
          <div style="
            color:#ffb100;
            font-weight:950;
            font-size:13px;
            letter-spacing:.12em;
            text-transform:uppercase;
          ">
            ${matrix.matrix_code || "MATRIX_PENDING"}
          </div>

          <div style="
            margin-top:6px;
            color:#b9c4d6;
            font-size:11px;
            letter-spacing:.08em;
            text-transform:uppercase;
          ">
            Evidence-Aware Trait Stack
          </div>
        </div>
      </div>

      <div class="sc-trait-grid" data-statscore-trait-grid="true"></div>

      <div class="sc-trait-footer" style="
        margin-top:18px;
        padding-top:14px;
        border-top:1px solid rgba(255,255,255,.1);
        color:#aab4c3;
        font-size:12px;
        line-height:1.45;
      ">
        Trait values remain pending until verified by approved evidence, evaluator review,
        coach input, camp/combine data, or game film validation.
      </div>
    `;

    container.appendChild(shell);

    return shell.querySelector("[data-statscore-trait-grid]");
  }

  function renderTraitRow(grid, trait, index) {
    const score = getTraitScore(trait);
    const width = score === null ? 0 : score;
    const status = getTraitStatus(trait);
    const statusColor = getStatusColor(status);
    const label = getStatusLabel(status);

    const evidenceCount = Array.isArray(trait.evidence) ? trait.evidence.length : 0;

    const row = document.createElement("div");
    row.className = "sc-trait-row";
    row.setAttribute("data-statscore-trait", trait.name || `Trait ${index + 1}`);

    row.style.display = "grid";
    row.style.gridTemplateColumns = "minmax(150px, 220px) 1fr minmax(86px, 120px)";
    row.style.alignItems = "center";
    row.style.gap = "14px";
    row.style.padding = "12px 0";
    row.style.borderBottom = "1px solid rgba(255,255,255,.075)";

    row.innerHTML = `
      <div>
        <div style="
          color:#f4f2ef;
          font-weight:950;
          letter-spacing:.12em;
          text-transform:uppercase;
          font-size:12px;
        ">
          ${trait.name || `Trait ${index + 1}`}
        </div>

        <div style="
          margin-top:5px;
          color:${statusColor};
          font-size:10px;
          font-weight:900;
          letter-spacing:.1em;
          text-transform:uppercase;
        ">
          ${label}${evidenceCount ? ` · ${evidenceCount} Evidence` : ""}
        </div>
      </div>

      <div style="
        height:10px;
        border:1px solid rgba(255,255,255,.16);
        background:linear-gradient(90deg, rgba(255,255,255,.035), rgba(255,255,255,.015));
        box-shadow:inset 0 0 12px rgba(0,0,0,.55);
        position:relative;
        overflow:hidden;
      ">
        <div style="
          height:100%;
          width:${width}%;
          background:${statusColor};
          box-shadow:0 0 12px ${statusColor};
          opacity:${score === null ? 0 : 0.85};
        "></div>
      </div>

      <div style="
        text-align:right;
        font-weight:950;
        color:${score === null ? "#aab4c3" : statusColor};
        letter-spacing:.08em;
      ">
        ${score === null ? "--" : score}
      </div>
    `;

    grid.appendChild(row);
  }

  function renderTraits(container, matrix) {
    if (!container) {
      warn("No trait container provided.");
      return null;
    }

    if (!matrix || !Array.isArray(matrix.traits)) {
      container.innerHTML = `
        <div style="
          padding:18px;
          border:1px solid rgba(255,52,52,.45);
          background:rgba(255,52,52,.06);
          color:#ffb4b4;
          font-weight:800;
        ">
          STATScore trait matrix unavailable.
        </div>
      `;

      return null;
    }

    const grid = createShell(container, matrix);

    matrix.traits.forEach((trait, index) => {
      renderTraitRow(grid, trait, index);
    });

    log("Traits rendered.", {
      matrix_code: matrix.matrix_code,
      trait_count: matrix.traits.length
    });

    return {
      ok: true,
      matrix_code: matrix.matrix_code,
      trait_count: matrix.traits.length
    };
  }

  function resolveCurrentAthlete() {
    return (
      window.STATScoreCurrentAthlete ||
      window.STATScoreCurrentSnapshot ||
      window.__STATSCORE_CURRENT_ATHLETE__ ||
      null
    );
  }

  function resolveMatrix(athlete) {
    if (
      window.STATScorePositionMatrixEngine &&
      typeof window.STATScorePositionMatrixEngine.getMatrix === "function"
    ) {
      return window.STATScorePositionMatrixEngine.getMatrix(athlete);
    }

    if (
      window.STATScore?.PositionMatrixEngine &&
      typeof window.STATScore.PositionMatrixEngine.getMatrix === "function"
    ) {
      return window.STATScore.PositionMatrixEngine.getMatrix(athlete);
    }

    return null;
  }

  function resolveContainer() {
    return (
      document.querySelector("[data-statscore-performance-traits]") ||
      document.querySelector("#statscore-performance-traits") ||
      document.querySelector("#scPerformanceTraits") ||
      document.querySelector(".sc-performance-traits")
    );
  }

  function renderCurrentAthlete() {
    const athlete = resolveCurrentAthlete();

    if (!athlete) {
      warn("No current athlete/snapshot found for trait rendering.");
      return null;
    }

    const matrix = resolveMatrix(athlete);

    if (!matrix) {
      warn("Position Matrix Engine unavailable or matrix unresolved.");
      return null;
    }

    const container = resolveContainer();

    if (!container) {
      warn("Performance trait container not found.");
      return null;
    }

    return renderTraits(container, matrix);
  }

  function init() {
    if (window.__STATSCORE_TRAIT_RENDER_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_TRAIT_RENDER_ENGINE__ = true;

    window.STATScoreTraitRenderEngine = {
      engine_id: ENGINE_ID,
      version: VERSION,
      renderTraits,
      renderCurrentAthlete,
      resolveCurrentAthlete,
      resolveMatrix
    };

    if (!window.STATScore) window.STATScore = {};
    window.STATScore.TraitRenderEngine = window.STATScoreTraitRenderEngine;

    const result = renderCurrentAthlete();

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE",
        rendered: !!result
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION,
      rendered: !!result
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(); 
