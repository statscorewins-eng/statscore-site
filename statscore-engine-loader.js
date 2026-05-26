/* ============================================================
   STATScore™ Engine Loader
   File: statscore-engine-loader.js

   PURPOSE:
   Production runtime orchestrator for STATScore.

   RESPONSIBILITIES:
   - Engine dependency validation
   - Engine Bus registration
   - Engine Health synchronization
   - Self-Healing activation
   - Safe-mode enforcement
   - Runtime diagnostics
   - Fail-closed protection
   - Page boot protection
   - Fallback registry
   - Engine readiness report

   STATUS:
   ACTIVE · LOAD-BEARING · SELF-HEALING READY
============================================================ */

(function () {

  "use strict";

  window.STATScore = window.STATScore || {};

  const EngineLoader = {

    version: "STATSCORE-ENGINE-LOADER-V2",

    status: "BOOTING",

    bootStartedAt: new Date().toISOString(),

    bootCompletedAt: null,

    safeMode: false,

    degradedMode: false,

    readOnlyMode: false,

    diagnostics: [],

    registeredEngines: [],

    missingEngines: [],

    failedEngines: [],

    warnings: [],

    /* =========================================================
       ENGINE REGISTRY
    ========================================================= */

    engineMap: [

      {
        name: "Core",
        path: "STATScoreCore",
        required: true
      },

      {
        name: "EngineBus",
        path: "STATScore.EngineBus",
        required: true
      },

      {
        name: "Data",
        path: "STATScoreData",
        required: true
      },

      {
        name: "RoleAccess",
        path: "STATScoreRoleAccess",
        required: true
      },

      {
        name: "SignalGovernance",
        path: "STATScoreSignalGovernance",
        required: true
      },

      {
        name: "StateEngine",
        path: "STATScore.StateEngine",
        required: true
      },

      {
        name: "ComplianceEngine",
        path: "STATScore.ComplianceEngine",
        required: true,
        failClosed: true
      },

      {
        name: "QuarterlyEligibilityEngine",
        path: "STATScore.QuarterlyEligibilityEngine",
        required: false
      },

      {
        name: "Routing",
        path: "STATScoreRouting",
        required: true
      },

      {
        name: "ScoringEngine",
        path: "STATScoreScoringEngine",
        required: false,
        failClosed: true
      },

      {
        name: "SynthesisEngine",
        path: "STATScore.SynthesisEngine",
        required: false
      },

      {
        name: "ConsensusEngine",
        path: "STATScore.ConsensusEngine",
        required: false
      },

      {
        name: "PathwayEngine",
        path: "STATScore.PathwayEngine",
        required: false
      },

      {
        name: "RecommendationEngine",
        path: "STATScore.RecommendationEngine",
        required: false
      },

      {
        name: "ProfileEngine",
        path: "STATScore.ProfileEngine",
        required: false
      },

      {
        name: "MediaIntelligenceEngine",
        path: "STATScore.MediaIntelligenceEngine",
        required: false,
        failClosed: true
      },

      {
        name: "MemoryEngine",
        path: "STATScore.MemoryEngine",
        required: false
      },

      {
        name: "Intelligence",
        path: "STATScoreIntelligence",
        required: false
      },

      {
        name: "AthleteSearchEngine",
        path: "STATScore.AthleteSearchEngine",
        required: false
      },

      {
        name: "EventEngine",
        path: "STATScore.EventEngine",
        required: false
      },

      {
        name: "MediaRouting",
        path: "STATScoreMediaRouting",
        required: false,
        failClosed: true
      },

      {
        name: "EvaluatorEngine",
        path: "STATScoreEvaluatorEngine",
        required: false
      },

      {
        name: "CommunicationEngine",
        path: "STATScore.CommunicationEngine",
        required: false,
        failClosed: true
      },

      {
        name: "EngineHealth",
        path: "STATScore.EngineHealth",
        required: true
      },

      {
        name: "SelfHealingEngine",
        path: "STATScore.SelfHealingEngine",
        required: true
      }

    ],

    dependencyMap: {

      Core: [],

      EngineBus: ["Core"],

      Data: ["Core"],

      RoleAccess: ["Core"],

      SignalGovernance: ["Core"],

      StateEngine: ["Core", "SignalGovernance"],

      ComplianceEngine: ["Core", "StateEngine"],

      QuarterlyEligibilityEngine: ["Core", "ComplianceEngine"],

      Routing: ["Core", "RoleAccess"],

      ScoringEngine: ["Core", "SignalGovernance"],

      SynthesisEngine: ["Core", "SignalGovernance", "ScoringEngine"],

      ConsensusEngine: ["Core", "SignalGovernance"],

      PathwayEngine: ["Core", "ScoringEngine", "ComplianceEngine"],

      RecommendationEngine: ["Core", "PathwayEngine"],

      ProfileEngine: ["Core", "ScoringEngine", "SynthesisEngine", "StateEngine"],

      MediaIntelligenceEngine: ["Core", "MediaRouting", "ScoringEngine"],

      MemoryEngine: ["Core", "ProfileEngine"],

      Intelligence: ["Core"],

      AthleteSearchEngine: ["Core", "Data", "RoleAccess"],

      EventEngine: ["Core", "StateEngine"],

      MediaRouting: ["Core"],

      EvaluatorEngine: ["Core", "ScoringEngine"],

      CommunicationEngine: ["Core", "ComplianceEngine", "EventEngine"],

      EngineHealth: ["EngineBus"],

      SelfHealingEngine: ["EngineBus", "EngineHealth"]

    },

    /* =========================================================
       UTILITIES
    ========================================================= */

    nowISO() {

      return new Date().toISOString();

    },

    getPath(path) {

      return String(path || "")
        .split(".")
        .reduce((obj, key) => {

          return obj && obj[key];

        }, window);

    },

    exists(path) {

      return !!this.getPath(path);

    },

    bus() {

      return window.STATScore?.EngineBus || null;

    },

    health() {

      return window.STATScore?.EngineHealth || null;

    },

    selfHealing() {

      return window.STATScore?.SelfHealingEngine || null;

    },

    log(level, message, payload = {}) {

      const record = {

        level,

        message,

        payload,

        created_at:
          this.nowISO()

      };

      this.diagnostics.push(record);

      if (level === "ERROR") {

        console.error(
          "[STATScore Loader]",
          message,
          payload
        );

      } else if (level === "WARN") {

        console.warn(
          "[STATScore Loader]",
          message,
          payload
        );

      } else {

        console.info(
          "[STATScore Loader]",
          message,
          payload
        );

      }

      this.bus()?.emit(
        "loader_log",
        record
      );

      return record;

    },

    /* =========================================================
       REGISTER ENGINES WITH BUS
    ========================================================= */

    registerEnginesWithBus() {

      const bus =
        this.bus();

      if (!bus) {

        this.safeMode = true;

        this.failedEngines.push(
          "EngineBus"
        );

        this.log(
          "ERROR",
          "EngineBus unavailable. Loader entering safe mode."
        );

        return false;

      }

      this.engineMap.forEach((engine) => {

        const ref =
          this.getPath(engine.path);

        if (!ref) {

          this.missingEngines.push(engine.name);

          if (engine.required) {

            this.safeMode = true;

          }

          this.log(
            engine.required ? "ERROR" : "WARN",
            "Engine missing during registration.",
            engine
          );

          return;

        }

        bus.registerEngine(
          engine.name,
          ref,
          {
            version:
              ref.version ||
              "unknown",

            required:
              engine.required
          }
        );

        bus.setDependencies(
          engine.name,
          this.dependencyMap[engine.name] || []
        );

        this.registeredEngines.push(engine.name);

      });

      return true;

    },

    /* =========================================================
       VALIDATE DEPENDENCIES
    ========================================================= */

    validateDependencies() {

      const bus =
        this.bus();

      if (!bus) {

        return false;

      }

      this.registeredEngines.forEach((engineName) => {

        const result =
          bus.verifyDependencies(engineName);

        if (!result.ok) {

          this.warnings.push(result);

          this.log(
            "WARN",
            "Dependency issue detected.",
            result
          );

          if (
            this.engineMap.find(e => e.name === engineName)?.required
          ) {

            this.safeMode = true;

          }

        }

      });

      return true;

    },

    /* =========================================================
       SUPABASE CHECK
    ========================================================= */

    validateDatabase() {

      const client =
        window.STATScoreCore?.getClient?.() ||
        window.STATScoreData?.getClient?.() ||
        null;

      if (!client) {

        this.readOnlyMode = true;
        this.safeMode = true;

        this.log(
          "WARN",
          "Supabase client unavailable. Read-only safe mode active."
        );

        return false;

      }

      this.log(
        "INFO",
        "Supabase client detected."
      );

      return true;

    },

    /* =========================================================
       SAFE MODE RULES
    ========================================================= */

    applySafeModeRules() {

      const hasCompliance =
        this.registeredEngines.includes(
          "ComplianceEngine"
        );

      const hasCommunication =
        this.registeredEngines.includes(
          "CommunicationEngine"
        );

      const hasScoring =
        this.registeredEngines.includes(
          "ScoringEngine"
        );

      const hasMedia =
        this.registeredEngines.includes(
          "MediaRouting"
        ) &&
        this.registeredEngines.includes(
          "MediaIntelligenceEngine"
        );

      window.STATScore.SafeMode = {

        active:
          this.safeMode,

        degraded:
          this.degradedMode,

        read_only:
          this.readOnlyMode,

        scoring_allowed:
          hasScoring,

        recruiter_communication_allowed:
          hasCompliance && hasCommunication,

        media_publish_allowed:
          hasMedia,

        profile_intelligence_allowed:
          this.registeredEngines.includes(
            "ProfileEngine"
          ),

        database_available:
          !this.readOnlyMode,

        rules: {

          scoring:
            hasScoring
              ? "Scoring available."
              : "Scoring unavailable. Do not issue star signal.",

          compliance:
            hasCompliance
              ? "Compliance available."
              : "Compliance unavailable. Recruiter communication blocked.",

          communication:
            hasCommunication
              ? "Communication available."
              : "Communication unavailable. Multi-Box sending disabled.",

          media:
            hasMedia
              ? "Media systems available."
              : "Media unavailable. Publishing disabled.",

          database:
            !this.readOnlyMode
              ? "Database available."
              : "Database unavailable. Read-only mode active."

        }

      };

      this.log(
        "INFO",
        "Safe mode rules applied.",
        window.STATScore.SafeMode
      );

      return window.STATScore.SafeMode;

    },

    /* =========================================================
       FALLBACK REGISTRY
    ========================================================= */

    createFallbacks() {

      window.STATScore.Fallbacks = {

        profile(snapshot) {

          return {

            ok: true,

            fallback: true,

            message:
              "Profile Intelligence unavailable. Rendering safe snapshot identity.",

            identity:
              snapshot || null

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

            message:
              "Scoring unavailable."

          };

        },

        compliance() {

          return {

            allowed: false,

            fallback: true,

            status: "REVIEW_REQUIRED",

            reason:
              "Compliance unavailable. Communication blocked by default."

          };

        },

        media() {

          return {

            ok: false,

            fallback: true,

            status: "MEDIA_PAUSED",

            reason:
              "Media unavailable. Publishing disabled."

          };

        },

        communication() {

          return {

            ok: false,

            fallback: true,

            status: "COMMUNICATION_PAUSED",

            reason:
              "Communication unavailable."

          };

        }

      };

      this.log(
        "INFO",
        "Fallback registry created."
      );

      return true;

    },

    /* =========================================================
       PAGE BOOT VERIFICATION
    ========================================================= */

    verifyPageBoot() {

      const page =
        window.location.pathname
          .split("/")
          .pop() ||
        "index.html";

      const report = {

        page,

        body_available:
          !!document.body,

        core_available:
          !!window.STATScoreCore,

        bus_available:
          !!this.bus(),

        health_available:
          !!this.health(),

        self_healing_available:
          !!this.selfHealing(),

        checked_at:
          this.nowISO()

      };

      if (!report.body_available) {

        this.safeMode = true;

        this.log(
          "ERROR",
          "Document body unavailable.",
          report
        );

      }

      if (!report.core_available) {

        this.safeMode = true;

        this.log(
          "ERROR",
          "STATScoreCore unavailable.",
          report
        );

      }

      return report;

    },

    /* =========================================================
       HEARTBEAT ALL ENGINES
    ========================================================= */

    heartbeatAll() {

      const health =
        this.health();

      if (!health) {

        this.log(
          "WARN",
          "EngineHealth unavailable for heartbeat."
        );

        return false;

      }

      this.registeredEngines.forEach((engineName) => {

        health.heartbeat(
          engineName
        );

      });

      this.log(
        "INFO",
        "Heartbeat sent to registered engines.",
        {
          count:
            this.registeredEngines.length
        }
      );

      return true;

    },

    /* =========================================================
       ATTACH RUNTIME LISTENERS
    ========================================================= */

    attachRuntimeListeners() {

      const bus =
        this.bus();

      if (!bus) return false;

      bus.on(
        "engine_timeout",
        (payload) => {

          this.log(
            "WARN",
            "Engine timeout received by loader.",
            payload
          );

          this.selfHealing()?.attemptEngineRecovery?.(
            payload.engine
          );

        }
      );

      bus.on(
        "dependency_failure",
        (payload) => {

          this.log(
            "WARN",
            "Dependency failure received by loader.",
            payload
          );

          if (payload?.missing?.length) {

            this.safeMode = true;

            this.applySafeModeRules();

          }

        }
      );

      bus.on(
        "engine_error",
        (payload) => {

          this.log(
            "ERROR",
            "Engine error received by loader.",
            payload
          );

          this.selfHealing()?.attemptEngineRecovery?.(
            payload.engine
          );

        }
      );

      this.log(
        "INFO",
        "Runtime listeners attached."
      );

      return true;

    },

    /* =========================================================
       BUILD HEALTH REPORT
    ========================================================= */

    buildReport() {

      return {

        loader_version:
          this.version,

        status:
          this.status,

        boot_started_at:
          this.bootStartedAt,

        boot_completed_at:
          this.bootCompletedAt,

        safe_mode:
          this.safeMode,

        degraded_mode:
          this.degradedMode,

        read_only_mode:
          this.readOnlyMode,

        registered_engines:
          this.registeredEngines,

        missing_engines:
          this.missingEngines,

        failed_engines:
          this.failedEngines,

        warnings:
          this.warnings,

        diagnostics:
          this.diagnostics.slice(-50),

        safe_mode_report:
          window.STATScore.SafeMode || null,

        bus_snapshot:
          this.bus()?.snapshot?.() ||
          this.bus()?.getStatus?.() ||
          null,

        health_snapshot:
          this.health()?.snapshot?.() ||
          null,

        self_healing_snapshot:
          this.selfHealing()?.snapshot?.() ||
          null

      };

    },

    /* =========================================================
       PRINT REPORT
    ========================================================= */

    printReport() {

      const report =
        this.buildReport();

      console.group(
        "[STATScore Loader] RUNTIME REPORT"
      );

      console.log(report);

      console.groupEnd();

      return report;

    },

    /* =========================================================
       BOOT
    ========================================================= */

    boot() {

      this.status = "BOOTING";

      this.log(
        "INFO",
        "Boot sequence started.",
        {
          version: this.version
        }
      );

      this.createFallbacks();

      this.verifyPageBoot();

      this.registerEnginesWithBus();

      this.validateDependencies();

      this.validateDatabase();

      this.applySafeModeRules();

      this.attachRuntimeListeners();

      this.heartbeatAll();

      if (this.safeMode) {

        this.status = "SAFE_MODE";

        this.selfHealing()?.activateDegradedMode?.(
          "Loader entered safe mode during boot."
        );

      } else {

        this.status = "ONLINE";

      }

      this.bootCompletedAt =
        this.nowISO();

      window.STATScore.EngineLoaderReport =
        this.buildReport();

      this.log(
        "INFO",
        "Boot sequence completed.",
        window.STATScore.EngineLoaderReport
      );

      return window.STATScore.EngineLoaderReport;

    },

    /* =========================================================
       EXPLAIN
    ========================================================= */

    explain() {

      return [

        `Loader: ${this.version}`,

        `Status: ${this.status}`,

        `Safe Mode: ${this.safeMode}`,

        `Registered: ${this.registeredEngines.length}`,

        `Missing: ${this.missingEngines.length}`

      ].join(" | ");

    }

  };

  /* ============================================================
     ATTACH GLOBAL
  ============================================================ */

  window.STATScore.EngineLoader =
    EngineLoader;

  /* ============================================================
     DOM BOOT
  ============================================================ */

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      EngineLoader.boot();

    }
  );

  console.info(
    "[STATScore] Engine Loader Registered:",
    EngineLoader.version
  );

})(); 
