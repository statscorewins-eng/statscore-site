/* ============================================================
   STATScore™ Engine Loader
   File: statscore-engine-loader.js
   Version: STATSCORE-ENGINE-LOADER-V1
   Purpose:
   Critical bootstrap infrastructure for loading, validating,
   monitoring, and safely recovering STATScore engines.

   Doctrine:
   - Never silently fail.
   - Fail closed, not open.
   - Degrade safely.
   - Explain what is unavailable.
   - Attempt recovery without exposing restricted actions.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const EngineLoader = {

    version: "STATSCORE-ENGINE-LOADER-V1",

    ENGINE_ORDER: [
      "STATScoreCore",
      "STATScoreData",
      "STATScoreRoleAccess",
      "STATScoreSignalGovernance",

      "STATScore.StateEngine",
      "STATScore.ComplianceEngine",
      "STATScore.QuarterlyEligibilityEngine",
      "STATScoreRouting",

      "STATScoreScoringEngine",
      "STATScore.SynthesisEngine",
      "STATScore.ConsensusEngine",
      "STATScore.PathwayEngine",
      "STATScore.RecommendationEngine",
      "STATScore.ProfileEngine",
      "STATScore.MediaIntelligenceEngine",
      "STATScore.MemoryEngine",
      "STATScoreIntelligence",

      "STATScore.EventEngine",
      "STATScoreMediaRouting",
      "STATScoreEvaluatorEngine",
      "STATScore.CommunicationEngine"
    ],

    CRITICAL_ENGINES: [
      "STATScoreCore",
      "STATScoreData",
      "STATScoreRoleAccess",
      "STATScoreSignalGovernance",
      "STATScore.StateEngine",
      "STATScore.ComplianceEngine",
      "STATScoreRouting"
    ],

    FAIL_CLOSED_RULES: {
      scoring: "Score unavailable. Do not issue star signal.",
      compliance: "Compliance unavailable. Recruiter communication blocked.",
      media: "Media unavailable. Publishing disabled.",
      profile: "Profile intelligence unavailable. Use snapshot fallback.",
      database: "Database unavailable. Read-only safe mode active.",
      routing: "Routing unavailable. Protected access required.",
      communication: "Communication unavailable. Multi-Box sending disabled."
    },

    state: {
      booted: false,
      safe_mode: false,
      read_only_mode: false,
      fail_closed: false,
      missing_engines: [],
      failed_engines: [],
      degraded_engines: [],
      recovered_engines: [],
      diagnostics: [],
      started_at: null,
      completed_at: null
    },

    nowISO() {
      return new Date().toISOString();
    },

    getPath(path) {
      return String(path || "")
        .split(".")
        .reduce((obj, key) => obj && obj[key], window);
    },

    exists(path) {
      return !!this.getPath(path);
    },

    log(level, message, detail = {}) {
      const entry = {
        level,
        message,
        detail,
        created_at: this.nowISO()
      };

      this.state.diagnostics.push(entry);

      const label = `[STATScore Loader] ${message}`;

      if (level === "ERROR") console.error(label, detail);
      else if (level === "WARN") console.warn(label, detail);
      else console.info(label, detail);

      return entry;
    },

    checkEngine(path) {
      const found = this.exists(path);

      return {
        engine: path,
        found,
        critical: this.CRITICAL_ENGINES.includes(path),
        checked_at: this.nowISO()
      };
    },

    validateEngines() {
      const results = this.ENGINE_ORDER.map((engine) =>
        this.checkEngine(engine)
      );

      this.state.missing_engines = results
        .filter(r => !r.found)
        .map(r => r.engine);

      const missingCritical = results
        .filter(r => !r.found && r.critical)
        .map(r => r.engine);

      if (missingCritical.length) {
        this.state.safe_mode = true;
        this.state.fail_closed = true;

        this.log("ERROR", "Critical engines missing. Fail-closed safe mode enabled.", {
          missingCritical
        });
      }

      if (this.state.missing_engines.length) {
        this.log("WARN", "Some engines are missing.", {
          missing: this.state.missing_engines
        });
      }

      return {
        ok: missingCritical.length === 0,
        results,
        missingCritical,
        missing: this.state.missing_engines
      };
    },

    validateSupabase() {
      const hasData = this.exists("STATScoreData");
      const client = window.STATScoreData?.getClient?.();

      if (!hasData || !client) {
        this.state.read_only_mode = true;
        this.state.safe_mode = true;

        this.log("WARN", "Supabase client unavailable. Read-only safe mode active.", {
          rule: this.FAIL_CLOSED_RULES.database
        });

        return {
          ok: false,
          status: "NO_SUPABASE_CLIENT"
        };
      }

      return {
        ok: true,
        status: "SUPABASE_READY"
      };
    },

    applyFailClosedGuards() {
      window.STATScore.SafeMode = {
        active: this.state.safe_mode,
        read_only: this.state.read_only_mode,
        fail_closed: this.state.fail_closed,

        scoring_allowed: this.exists("STATScoreScoringEngine"),
        recruiter_communication_allowed:
          this.exists("STATScore.ComplianceEngine") &&
          this.exists("STATScore.CommunicationEngine"),

        media_publish_allowed:
          this.exists("STATScoreMediaRouting") &&
          this.exists("STATScore.MediaIntelligenceEngine"),

        profile_intelligence_allowed:
          this.exists("STATScore.ProfileEngine"),

        event_processing_allowed:
          this.exists("STATScore.EventEngine"),

        reasons: {
          scoring:
            this.exists("STATScoreScoringEngine")
              ? "Scoring engine available."
              : this.FAIL_CLOSED_RULES.scoring,

          compliance:
            this.exists("STATScore.ComplianceEngine")
              ? "Compliance engine available."
              : this.FAIL_CLOSED_RULES.compliance,

          media:
            this.exists("STATScoreMediaRouting")
              ? "Media routing available."
              : this.FAIL_CLOSED_RULES.media,

          profile:
            this.exists("STATScore.ProfileEngine")
              ? "Profile engine available."
              : this.FAIL_CLOSED_RULES.profile,

          database:
            this.validateSupabase().ok
              ? "Database available."
              : this.FAIL_CLOSED_RULES.database
        }
      };

      return window.STATScore.SafeMode;
    },

    attemptRecovery() {
      const recovered = [];

      this.state.missing_engines.forEach((engine) => {
        if (this.exists(engine)) {
          recovered.push(engine);
        }
      });

      if (recovered.length) {
        this.state.recovered_engines.push(...recovered);

        this.state.missing_engines =
          this.state.missing_engines.filter(e => !recovered.includes(e));

        this.log("INFO", "Recovered previously missing engines.", {
          recovered
        });
      }

      return recovered;
    },

    buildHealthReport() {
      const engineChecks = this.ENGINE_ORDER.map((engine) =>
        this.checkEngine(engine)
      );

      const available = engineChecks.filter(e => e.found).length;
      const total = engineChecks.length;

      return {
        ok: this.state.missing_engines.length === 0,
        loader_version: this.version,
        generated_at: this.nowISO(),

        booted: this.state.booted,
        safe_mode: this.state.safe_mode,
        read_only_mode: this.state.read_only_mode,
        fail_closed: this.state.fail_closed,

        engine_total: total,
        engine_available: available,
        engine_missing: total - available,

        missing_engines: this.state.missing_engines,
        failed_engines: this.state.failed_engines,
        degraded_engines: this.state.degraded_engines,
        recovered_engines: this.state.recovered_engines,

        safe_mode_report: window.STATScore.SafeMode || null,
        diagnostics: this.state.diagnostics,
        engine_checks: engineChecks
      };
    },

    renderSystemStatus(targetId = "statscoreSystemStatus") {
      const el = document.getElementById(targetId);
      if (!el) return;

      const report = this.buildHealthReport();

      el.innerHTML = `
        <div class="system-status-kicker">STATScore Engine Health</div>
        <h2>${report.safe_mode ? "SAFE MODE ACTIVE" : "SYSTEM READY"}</h2>
        <p>
          Engines Available: ${report.engine_available}/${report.engine_total}
        </p>
        ${
          report.missing_engines.length
            ? `<strong>Missing Engines</strong><ul>${report.missing_engines.map(e => `<li>${e}</li>`).join("")}</ul>`
            : `<p>All registered engines detected.</p>`
        }
      `;
    },

    createFallbacks() {
      window.STATScore.Fallbacks = {

        profile(snapshot) {
          return {
            ok: true,
            fallback: true,
            message: "Profile Engine unavailable. Rendering safe snapshot identity only.",
            identity: snapshot || null
          };
        },

        score() {
          return {
            ok: false,
            fallback: true,
            final_score: "--",
            star_signal: {
              label: "Score Pending",
              display: "☆☆☆☆☆"
            },
            message: "Scoring Engine unavailable."
          };
        },

        compliance() {
          return {
            allowed: false,
            fallback: true,
            status: "REVIEW_REQUIRED",
            reason: "Compliance Engine unavailable. Communication blocked by default."
          };
        },

        media() {
          return {
            ok: false,
            fallback: true,
            status: "MEDIA_PAUSED",
            reason: "Media engines unavailable. Publishing disabled."
          };
        },

        communication() {
          return {
            ok: false,
            fallback: true,
            status: "COMMUNICATION_PAUSED",
            reason: "Communication Engine unavailable."
          };
        }

      };

      this.log("INFO", "Fallback registry created.");
    },

    verifyPageBoot() {
      const page = window.location.pathname.split("/").pop() || "index.html";

      const context = {
        page,
        has_body: !!document.body,
        has_core: this.exists("STATScoreCore"),
        has_routing: this.exists("STATScoreRouting"),
        has_safe_mode: !!window.STATScore.SafeMode,
        verified_at: this.nowISO()
      };

      if (!context.has_body) {
        this.state.safe_mode = true;
        this.log("ERROR", "Page boot failed: document body unavailable.", context);
      }

      if (!context.has_core) {
        this.state.safe_mode = true;
        this.state.fail_closed = true;
        this.log("ERROR", "Page boot failed: STATScoreCore missing.", context);
      }

      return context;
    },

    initEngines() {
      const callableInits = [
        "STATScoreRouting.init",
        "STATScoreRoleAccess.init"
      ];

      callableInits.forEach((path) => {
        const fn = this.getPath(path);

        if (typeof fn === "function") {
          try {
            fn({ enforce: false, renderAuthority: false });
            this.log("INFO", `Initialized ${path}.`);
          } catch (error) {
            this.state.failed_engines.push(path);
            this.state.safe_mode = true;
            this.log("ERROR", `Engine init failed: ${path}`, { error });
          }
        }
      });
    },

    boot(options = {}) {
      this.state.started_at = this.nowISO();

      this.log("INFO", "Boot sequence started.", {
        version: this.version
      });

      this.createFallbacks();

      const engineValidation = this.validateEngines();
      const pageBoot = this.verifyPageBoot();

      this.attemptRecovery();

      this.applyFailClosedGuards();

      if (options.initEngines !== false) {
        this.initEngines();
      }

      this.state.completed_at = this.nowISO();
      this.state.booted = true;

      const report = this.buildHealthReport();

      window.STATScore.EngineHealth = report;

      this.log("INFO", "Boot sequence completed.", report);

      if (options.renderStatus) {
        this.renderSystemStatus(options.statusTargetId || "statscoreSystemStatus");
      }

      return {
        ok: engineValidation.ok,
        pageBoot,
        report
      };
    },

    requireEngine(path) {
      if (this.exists(path)) {
        return {
          ok: true,
          engine: this.getPath(path)
        };
      }

      this.state.safe_mode = true;

      this.log("ERROR", "Required engine unavailable.", {
        engine: path
      });

      return {
        ok: false,
        engine: null
      };
    },

    explain() {
      const report = this.buildHealthReport();

      return [
        `Loader: ${this.version}`,
        `Booted: ${report.booted}`,
        `Safe Mode: ${report.safe_mode}`,
        `Engines: ${report.engine_available}/${report.engine_total}`,
        `Missing: ${report.missing_engines.length}`
      ].join(" | ");
    }

  };

  window.STATScore.EngineLoader = EngineLoader;

  document.addEventListener("DOMContentLoaded", () => {
    window.STATScore.EngineLoader.boot({
      initEngines: true,
      renderStatus: false
    });
  });

  console.info("[STATScore] Engine Loader Registered:", EngineLoader.version);

})(); 
