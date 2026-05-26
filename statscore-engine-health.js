/* ============================================================
   STATScore™ Engine Health System
   File: statscore-engine-health.js

   PURPOSE:
   Runtime survivability, monitoring, heartbeat verification,
   dependency tracking, timeout detection, and operational
   runtime health visibility.

   STATUS:
   ACTIVE · LOAD-BEARING
============================================================ */

(function () {

  "use strict";

  window.STATScore = window.STATScore || {};

  const EngineHealth = {

    version: "SC_ENGINE_HEALTH_V1",

    status: "BOOTING",

    heartbeatIntervalMs: 15000,

    timeoutThresholdMs: 45000,

    runtimeStartedAt: new Date().toISOString(),

    monitorInterval: null,

    engineTimeouts: {},

    runtimeWarnings: [],

    runtimeErrors: [],

    /* =========================================================
       ENGINE BUS ACCESS
    ========================================================= */

    bus() {

      return window.STATScore?.EngineBus || null;
    },

    /* =========================================================
       LOG WARNING
    ========================================================= */

    warn(message, payload = {}) {

      const warning = {

        type: "WARNING",

        message,

        payload,

        timestamp: new Date().toISOString()

      };

      this.runtimeWarnings.push(warning);

      console.warn(
        "[STATScore Engine Health]",
        warning
      );

      this.bus()?.emit(
        "engine_health_warning",
        warning
      );

      return warning;
    },

    /* =========================================================
       LOG ERROR
    ========================================================= */

    error(message, payload = {}) {

      const error = {

        type: "ERROR",

        message,

        payload,

        timestamp: new Date().toISOString()

      };

      this.runtimeErrors.push(error);

      console.error(
        "[STATScore Engine Health]",
        error
      );

      this.bus()?.emit(
        "engine_health_error",
        error
      );

      return error;
    },

    /* =========================================================
       REGISTER HEARTBEAT
    ========================================================= */

    heartbeat(engineName) {

      if (!engineName) return false;

      this.engineTimeouts[engineName] = Date.now();

      this.bus()?.heartbeat(engineName);

      return true;
    },

    /* =========================================================
       VERIFY ENGINE EXISTS
    ========================================================= */

    verifyEngine(engineName) {

      const bus = this.bus();

      if (!bus) {

        this.error(
          "EngineBus unavailable during verifyEngine.",
          { engine: engineName }
        );

        return false;
      }

      const exists = bus.hasEngine(engineName);

      if (!exists) {

        this.warn(
          "Engine missing from runtime registry.",
          { engine: engineName }
        );

      }

      return exists;
    },

    /* =========================================================
       CHECK ENGINE TIMEOUTS
    ========================================================= */

    checkTimeouts() {

      const now = Date.now();

      Object.keys(this.engineTimeouts).forEach((engineName) => {

        const lastSeen =
          this.engineTimeouts[engineName];

        const delta =
          now - lastSeen;

        if (delta > this.timeoutThresholdMs) {

          this.warn(
            "Engine heartbeat timeout detected.",
            {
              engine: engineName,
              timeout_ms: delta
            }
          );

          this.bus()?.emit(
            "engine_timeout",
            {
              engine: engineName,
              timeout_ms: delta
            }
          );

        }

      });

    },

    /* =========================================================
       VERIFY DEPENDENCIES
    ========================================================= */

    verifyDependencies() {

      const bus = this.bus();

      if (!bus) {

        this.error(
          "EngineBus unavailable during dependency verification."
        );

        return false;
      }

      const engines =
        Object.keys(bus.registry);

      engines.forEach((engineName) => {

        const result =
          bus.verifyDependencies(engineName);

        if (!result.ok) {

          this.warn(
            "Dependency verification failure.",
            result
          );

        }

      });

      return true;
    },

    /* =========================================================
       ENGINE HEALTH SNAPSHOT
    ========================================================= */

    snapshot() {

      const bus = this.bus();

      return {

        version: this.version,

        status: this.status,

        runtime_started_at:
          this.runtimeStartedAt,

        registered_engines:
          Object.keys(bus?.registry || {}),

        heartbeat_tracking:
          this.engineTimeouts,

        warnings:
          this.runtimeWarnings.slice(-25),

        errors:
          this.runtimeErrors.slice(-25),

        bus_health:
          bus?.health || {}

      };
    },

    /* =========================================================
       PRINT STATUS REPORT
    ========================================================= */

    printStatus() {

      const snapshot =
        this.snapshot();

      console.group(
        "[STATScore Engine Health] STATUS REPORT"
      );

      console.table(
        snapshot.bus_health
      );

      console.log(
        "Warnings:",
        snapshot.warnings
      );

      console.log(
        "Errors:",
        snapshot.errors
      );

      console.groupEnd();

      return snapshot;
    },

    /* =========================================================
       MONITOR LOOP
    ========================================================= */

    startMonitoring() {

      if (this.monitorInterval) {

        clearInterval(
          this.monitorInterval
        );

      }

      this.monitorInterval = setInterval(() => {

        try {

          this.checkTimeouts();

          this.verifyDependencies();

        } catch (error) {

          this.error(
            "Monitoring loop failure.",
            {
              message: error.message
            }
          );

        }

      }, this.heartbeatIntervalMs);

      console.info(
        "[STATScore Engine Health] Monitoring ACTIVE"
      );

      return true;
    },

    /* =========================================================
       SAFE MODE
    ========================================================= */

    activateSafeMode(reason = "UNKNOWN") {

      this.status = "SAFE_MODE";

      this.warn(
        "SAFE MODE ACTIVATED",
        { reason }
      );

      this.bus()?.activateSafeMode(
        reason
      );

      return {

        status: this.status,

        reason

      };
    },

    /* =========================================================
       ONLINE BOOT
    ========================================================= */

    boot() {

      this.status = "ONLINE";

      console.info(
        "[STATScore Engine Health] ONLINE"
      );

      this.bus()?.emit(
        "engine_health_online",
        {
          version: this.version
        }
      );

      this.startMonitoring();

      return this.snapshot();
    }

  };

  /* ============================================================
     ATTACH TO GLOBAL RUNTIME
  ============================================================ */

  window.STATScore.EngineHealth =
    EngineHealth;

  /* ============================================================
     AUTO REGISTER TO ENGINE BUS
  ============================================================ */

  if (
    window.STATScore?.EngineBus
  ) {

    window.STATScore.EngineBus.registerEngine(
      "EngineHealth",
      EngineHealth,
      {
        version:
          EngineHealth.version
      }
    );

  }

  /* ============================================================
     BOOT
  ============================================================ */

  EngineHealth.boot();

})(); 
