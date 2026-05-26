/* ============================================================
   STATScore™ Engine Bus
   Central runtime registry + communication layer
   ============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const EngineBus = {
    version: "SC_ENGINE_BUS_V1",
    status: "BOOTING",

    registry: {},
    events: [],
    dependencies: {},
    health: {},

    registerEngine(engineName, engineRef, options = {}) {
      if (!engineName || !engineRef) {
        console.warn("[STATScore Engine Bus] Invalid engine registration attempt.");
        return false;
      }

      this.registry[engineName] = {
        name: engineName,
        ref: engineRef,
        version: options.version || engineRef.version || "unknown",
        required: options.required !== false,
        registered_at: new Date().toISOString()
      };

      this.health[engineName] = {
        status: "REGISTERED",
        last_seen: new Date().toISOString(),
        errors: []
      };

      this.emit("engine:registered", {
        engine: engineName,
        version: this.registry[engineName].version
      });

      console.info(`[STATScore Engine Bus] Engine registered: ${engineName}`);
      return true;
    },

    getEngine(engineName) {
      return this.registry[engineName]?.ref || null;
    },

    hasEngine(engineName) {
      return Boolean(this.registry[engineName]?.ref);
    },

    setDependencies(engineName, dependencyList = []) {
      this.dependencies[engineName] = dependencyList;
      return true;
    },

    verifyDependencies(engineName) {
      const deps = this.dependencies[engineName] || [];
      const missing = deps.filter((dep) => !this.hasEngine(dep));

      if (missing.length) {
        this.health[engineName] = this.health[engineName] || {};
        this.health[engineName].status = "DEPENDENCY_MISSING";
        this.health[engineName].missing = missing;

        this.emit("engine:dependency_missing", {
          engine: engineName,
          missing
        });

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

    emit(eventName, payload = {}) {
      const event = {
        event: eventName,
        payload,
        timestamp: new Date().toISOString()
      };

      this.events.push(event);

      window.dispatchEvent(
        new CustomEvent(`statscore:${eventName}`, {
          detail: payload
        })
      );

      return event;
    },

    on(eventName, handler) {
      if (typeof handler !== "function") return false;

      window.addEventListener(`statscore:${eventName}`, (event) => {
        handler(event.detail);
      });

      return true;
    },

    heartbeat(engineName) {
      if (!this.health[engineName]) {
        this.health[engineName] = {
          status: "UNKNOWN",
          errors: []
        };
      }

      this.health[engineName].status = "ALIVE";
      this.health[engineName].last_seen = new Date().toISOString();

      this.emit("engine:heartbeat", {
        engine: engineName
      });

      return true;
    },

    reportError(engineName, error) {
      if (!this.health[engineName]) {
        this.health[engineName] = {
          status: "ERROR",
          errors: []
        };
      }

      const errorRecord = {
        message: error?.message || String(error),
        timestamp: new Date().toISOString()
      };

      this.health[engineName].status = "ERROR";
      this.health[engineName].errors.push(errorRecord);

      this.emit("engine:error", {
        engine: engineName,
        error: errorRecord
      });

      console.error(`[STATScore Engine Bus] ${engineName} error:`, error);
      return errorRecord;
    },

    getStatus() {
      return {
        version: this.version,
        status: this.status,
        engines: Object.keys(this.registry),
        health: this.health,
        events: this.events.slice(-25)
      };
    },

    boot() {
      this.status = "ONLINE";

      this.emit("engine_bus:online", {
        version: this.version
      });

      console.info("[STATScore Engine Bus] ONLINE");
      return this.getStatus();
    }
  };

  window.STATScore.EngineBus = EngineBus;
  window.STATScore.EngineBus.boot();

})(); 
