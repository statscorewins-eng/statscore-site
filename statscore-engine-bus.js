/* ============================================================
   STATScore™ Engine Bus
   File: statscore-engine-bus.js

   PURPOSE:
   Central runtime communication layer for all STATScore engines.

   RESPONSIBILITIES:
   - Engine registration
   - Dependency verification
   - Runtime event dispatch
   - Health heartbeat
   - Error reporting
   - Engine state visibility
   - Runtime orchestration support

   STATUS:
   ACTIVE · LOAD-BEARING
============================================================ */

(function () {

  "use strict";

  window.STATScore = window.STATScore || {};

  const EngineBus = {

    version: "SC_ENGINE_BUS_V1",

    status: "BOOTING",

    registry: {},

    dependencies: {},

    health: {},

    events: [],

    runtimeStartedAt: new Date().toISOString(),

    /* =========================================================
       REGISTER ENGINE
    ========================================================= */

    registerEngine(engineName, engineReference, options = {}) {

      if (!engineName || !engineReference) {

        console.warn(
          "[STATScore Engine Bus] Invalid engine registration."
        );

        return false;
      }

      this.registry[engineName] = {

        name: engineName,

        ref: engineReference,

        version:
          options.version ||
          engineReference.version ||
          "unknown",

        required:
          options.required !== false,

        registered_at:
          new Date().toISOString()

      };

      this.health[engineName] = {

        status: "REGISTERED",

        last_seen:
          new Date().toISOString(),

        heartbeat_count: 0,

        errors: []

      };

      console.info(
        `[STATScore Engine Bus] Registered: ${engineName}`
      );

      this.emit(
        "engine_registered",
        {
          engine: engineName
        }
      );

      return true;
    },

    /* =========================================================
       GET ENGINE
    ========================================================= */

    getEngine(engineName) {

      return this.registry[engineName]?.ref || null;
    },

    /* =========================================================
       HAS ENGINE
    ========================================================= */

    hasEngine(engineName) {

      return !!this.registry[engineName];
    },

    /* =========================================================
       DEPENDENCY REGISTRATION
    ========================================================= */

    setDependencies(engineName, dependencyList = []) {

      this.dependencies[engineName] =
        dependencyList;

      return true;
    },

    /* =========================================================
       VERIFY DEPENDENCIES
    ========================================================= */

    verifyDependencies(engineName) {

      const required =
        this.dependencies[engineName] || [];

      const missing = [];

      required.forEach((dependency) => {

        if (!this.hasEngine(dependency)) {

          missing.push(dependency);
        }

      });

      if (missing.length > 0) {

        this.health[engineName] =
          this.health[engineName] || {};

        this.health[engineName].status =
          "DEPENDENCY_FAILURE";

        this.health[engineName].missing =
          missing;

        console.warn(
          `[STATScore Engine Bus] Missing dependencies for ${engineName}:`,
          missing
        );

        this.emit(
          "dependency_failure",
          {
            engine: engineName,
            missing
          }
        );

        return {

          ok: false,

          engine: engineName,

          missing

        };

      }

      return {

        ok: true,

        engine: engineName,

        missing: []

      };
    },

    /* =========================================================
       EVENT EMITTER
    ========================================================= */

    emit(eventName, payload = {}) {

      const eventObject = {

        event: eventName,

        payload,

        timestamp:
          new Date().toISOString()

      };

      this.events.push(eventObject);

      window.dispatchEvent(

        new CustomEvent(

          `statscore:${eventName}`,

          {
            detail: payload
          }

        )

      );

      return eventObject;
    },

    /* =========================================================
       EVENT LISTENER
    ========================================================= */

    on(eventName, callback) {

      if (typeof callback !== "function") {

        return false;
      }

      window.addEventListener(

        `statscore:${eventName}`,

        (event) => {

          callback(event.detail);

        }

      );

      return true;
    },

    /* =========================================================
       HEARTBEAT
    ========================================================= */

    heartbeat(engineName) {

      if (!this.health[engineName]) {

        this.health[engineName] = {

          status: "UNKNOWN",

          heartbeat_count: 0,

          errors: []

        };

      }

      this.health[engineName].status =
        "ALIVE";

      this.health[engineName].last_seen =
        new Date().toISOString();

      this.health[engineName].heartbeat_count += 1;

      this.emit(
        "engine_heartbeat",
        {
          engine: engineName
        }
      );

      return true;
    },

    /* =========================================================
       REPORT ERROR
    ========================================================= */

    reportError(engineName, error) {

      if (!this.health[engineName]) {

        this.health[engineName] = {

          status: "ERROR",

          errors: []

        };

      }

      const errorRecord = {

        message:
          error?.message ||
          String(error),

        timestamp:
          new Date().toISOString()

      };

      this.health[engineName].status =
        "ERROR";

      this.health[engineName].errors.push(
        errorRecord
      );

      console.error(
        `[STATScore Engine Bus] ${engineName} error:`,
        error
      );

      this.emit(
        "engine_error",
        {
          engine: engineName,
          error: errorRecord
        }
      );

      return errorRecord;
    },

    /* =========================================================
       STATUS REPORT
    ========================================================= */

    getStatus() {

      return {

        version: this.version,

        status: this.status,

        runtime_started_at:
          this.runtimeStartedAt,

        registered_engines:
          Object.keys(this.registry),

        dependencies:
          this.dependencies,

        health:
          this.health,

        recent_events:
          this.events.slice(-25)

      };
    },

    /* =========================================================
       RUNTIME SNAPSHOT
    ========================================================= */

    snapshot() {

      return JSON.parse(

        JSON.stringify(
          this.getStatus()
        )

      );
    },

    /* =========================================================
       SAFE MODE
    ========================================================= */

    activateSafeMode(reason = "UNKNOWN") {

      this.status = "SAFE_MODE";

      console.warn(
        `[STATScore Engine Bus] SAFE MODE ACTIVATED: ${reason}`
      );

      this.emit(
        "safe_mode_activated",
        {
          reason
        }
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
        "[STATScore Engine Bus] ONLINE"
      );

      this.emit(
        "engine_bus_online",
        {
          version: this.version
        }
      );

      return this.getStatus();
    }

  };

  /* ============================================================
     ATTACH TO GLOBAL RUNTIME
  ============================================================ */

  window.STATScore.EngineBus = EngineBus;

  /* ============================================================
     BOOT ENGINE BUS
  ============================================================ */

  EngineBus.boot();

})(); 
