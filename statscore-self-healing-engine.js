/* ============================================================
   STATScore™ Self-Healing Engine
   File: statscore-self-healing-engine.js

   PURPOSE:
   Runtime recovery, fallback orchestration, safe-mode continuity,
   snapshot restoration, dead-engine recovery attempts, retry
   escalation, cache recovery, and operational survivability.

   STATUS:
   ACTIVE · LOAD-BEARING
============================================================ */

(function () {

  "use strict";

  window.STATScore = window.STATScore || {};

  const SelfHealingEngine = {

    version: "SC_SELF_HEALING_ENGINE_V1",

    status: "BOOTING",

    maxRecoveryAttempts: 3,

    recoveryDelayMs: 1200,

    cachePrefix: "statscore_recovery_",

    recoveryLog: [],

    recoveryAttempts: {},

    degradedMode: false,

    runtimeStartedAt: new Date().toISOString(),

    /* =========================================================
       ENGINE ACCESS
    ========================================================= */

    bus() {
      return window.STATScore?.EngineBus || null;
    },

    health() {
      return window.STATScore?.EngineHealth || null;
    },

    loader() {
      return window.STATScore?.EngineLoader || null;
    },

    core() {
      return window.STATScoreCore || null;
    },

    /* =========================================================
       UTILITIES
    ========================================================= */

    nowISO() {
      return new Date().toISOString();
    },

    log(action, payload = {}) {

      const record = {
        action,
        payload,
        created_at: this.nowISO()
      };

      this.recoveryLog.push(record);

      console.info(
        "[STATScore Self-Healing]",
        record
      );

      this.bus()?.emit(
        "self_healing_log",
        record
      );

      return record;
    },

    warn(action, payload = {}) {

      const record = {
        action,
        payload,
        severity: "WARNING",
        created_at: this.nowISO()
      };

      this.recoveryLog.push(record);

      console.warn(
        "[STATScore Self-Healing]",
        record
      );

      this.bus()?.emit(
        "self_healing_warning",
        record
      );

      return record;
    },

    error(action, payload = {}) {

      const record = {
        action,
        payload,
        severity: "ERROR",
        created_at: this.nowISO()
      };

      this.recoveryLog.push(record);

      console.error(
        "[STATScore Self-Healing]",
        record
      );

      this.bus()?.emit(
        "self_healing_error",
        record
      );

      return record;
    },

    /* =========================================================
       ENGINE RECOVERY
    ========================================================= */

    canAttemptRecovery(engineName) {

      const attempts =
        this.recoveryAttempts[engineName] || 0;

      return attempts < this.maxRecoveryAttempts;
    },

    incrementAttempt(engineName) {

      this.recoveryAttempts[engineName] =
        (this.recoveryAttempts[engineName] || 0) + 1;

      return this.recoveryAttempts[engineName];
    },

    async attemptEngineRecovery(engineName) {

      if (!engineName) {

        return {
          ok: false,
          status: "NO_ENGINE_NAME"
        };

      }

      if (!this.canAttemptRecovery(engineName)) {

        this.activateDegradedMode(
          `Max recovery attempts exceeded for ${engineName}`
        );

        return {
          ok: false,
          status: "MAX_ATTEMPTS_EXCEEDED",
          engine: engineName
        };

      }

      const attempt =
        this.incrementAttempt(engineName);

      this.warn(
        "ENGINE_RECOVERY_ATTEMPT",
        {
          engine: engineName,
          attempt
        }
      );

      await new Promise(resolve =>
        setTimeout(resolve, this.recoveryDelayMs)
      );

      const bus =
        this.bus();

      const engineExists =
        bus?.hasEngine?.(engineName);

      if (engineExists) {

        this.log(
          "ENGINE_RECOVERED",
          {
            engine: engineName,
            attempt
          }
        );

        this.health()?.heartbeat(engineName);

        return {
          ok: true,
          status: "ENGINE_RECOVERED",
          engine: engineName,
          attempt
        };

      }

      this.warn(
        "ENGINE_STILL_MISSING",
        {
          engine: engineName,
          attempt
        }
      );

      return {
        ok: false,
        status: "ENGINE_STILL_MISSING",
        engine: engineName,
        attempt
      };

    },

    async recoverMissingEngines() {

      const bus =
        this.bus();

      if (!bus) {

        this.activateDegradedMode(
          "EngineBus unavailable during recovery"
        );

        return {
          ok: false,
          status: "NO_ENGINE_BUS"
        };

      }

      const health =
        this.health()?.snapshot?.();

      const registered =
        health?.registered_engines || [];

      const required =
        [
          "EngineHealth",
          "SelfHealingEngine"
        ];

      const missing =
        required.filter(engine =>
          !registered.includes(engine)
        );

      const results = [];

      for (const engine of missing) {

        results.push(
          await this.attemptEngineRecovery(engine)
        );

      }

      return {
        ok: results.every(r => r.ok),
        status: "RECOVERY_PASS_COMPLETE",
        results
      };

    },

    /* =========================================================
       SAFE / DEGRADED MODE
    ========================================================= */

    activateDegradedMode(reason = "UNKNOWN") {

      this.degradedMode = true;
      this.status = "DEGRADED_MODE";

      window.STATScore.SafeRuntime =
        window.STATScore.SafeRuntime || {};

      window.STATScore.SafeRuntime.degraded_mode = true;
      window.STATScore.SafeRuntime.reason = reason;
      window.STATScore.SafeRuntime.activated_at = this.nowISO();

      this.warn(
        "DEGRADED_MODE_ACTIVATED",
        { reason }
      );

      this.health()?.activateSafeMode?.(reason);
      this.bus()?.activateSafeMode?.(reason);

      return {
        status: this.status,
        degraded_mode: true,
        reason
      };

    },

    clearDegradedMode() {

      this.degradedMode = false;
      this.status = "ONLINE";

      if (window.STATScore.SafeRuntime) {
        window.STATScore.SafeRuntime.degraded_mode = false;
      }

      this.log(
        "DEGRADED_MODE_CLEARED"
      );

      return {
        status: this.status,
        degraded_mode: false
      };

    },

    /* =========================================================
       CACHE / SNAPSHOT RECOVERY
    ========================================================= */

    cacheSet(key, value) {

      try {

        localStorage.setItem(
          this.cachePrefix + key,
          JSON.stringify({
            value,
            cached_at: this.nowISO()
          })
        );

        return true;

      } catch (error) {

        this.error(
          "CACHE_SET_FAILED",
          {
            key,
            message: error.message
          }
        );

        return false;

      }

    },

    cacheGet(key) {

      try {

        const raw =
          localStorage.getItem(
            this.cachePrefix + key
          );

        if (!raw) return null;

        return JSON.parse(raw);

      } catch (error) {

        this.error(
          "CACHE_GET_FAILED",
          {
            key,
            message: error.message
          }
        );

        return null;

      }

    },

    cacheSnapshot(snapshot) {

      if (!snapshot) return false;

      const snapshotId =
        snapshot.snapshot_id ||
        snapshot.athlete_id ||
        "latest";

      this.cacheSet(
        `snapshot_${snapshotId}`,
        snapshot
      );

      this.cacheSet(
        "snapshot_latest",
        snapshot
      );

      this.log(
        "SNAPSHOT_CACHED",
        { snapshot_id: snapshotId }
      );

      return true;

    },

    restoreLatestSnapshot() {

      const cached =
        this.cacheGet("snapshot_latest");

      if (!cached?.value) {

        this.warn(
          "NO_CACHED_SNAPSHOT_AVAILABLE"
        );

        return {
          ok: false,
          status: "NO_CACHED_SNAPSHOT"
        };

      }

      this.log(
        "SNAPSHOT_RESTORED_FROM_CACHE",
        {
          cached_at: cached.cached_at
        }
      );

      return {
        ok: true,
        status: "SNAPSHOT_RESTORED",
        snapshot: cached.value,
        cached_at: cached.cached_at
      };

    },

    cacheProfile(profile) {

      if (!profile) return false;

      const athleteId =
        profile.identity?.athlete_id ||
        profile.identity?.snapshot_id ||
        "latest";

      this.cacheSet(
        `profile_${athleteId}`,
        profile
      );

      this.cacheSet(
        "profile_latest",
        profile
      );

      this.log(
        "PROFILE_CACHED",
        { athlete_id: athleteId }
      );

      return true;

    },

    restoreLatestProfile() {

      const cached =
        this.cacheGet("profile_latest");

      if (!cached?.value) {

        this.warn(
          "NO_CACHED_PROFILE_AVAILABLE"
        );

        return {
          ok: false,
          status: "NO_CACHED_PROFILE"
        };

      }

      return {
        ok: true,
        status: "PROFILE_RESTORED",
        profile: cached.value,
        cached_at: cached.cached_at
      };

    },

    /* =========================================================
       PAGE RECOVERY
    ========================================================= */

    recoverPageState() {

      const restoredProfile =
        this.restoreLatestProfile();

      if (restoredProfile.ok) {

        this.log(
          "PAGE_PROFILE_RECOVERY_AVAILABLE",
          {
            cached_at: restoredProfile.cached_at
          }
        );

        return restoredProfile;

      }

      const restoredSnapshot =
        this.restoreLatestSnapshot();

      if (restoredSnapshot.ok) {

        this.log(
          "PAGE_SNAPSHOT_RECOVERY_AVAILABLE",
          {
            cached_at: restoredSnapshot.cached_at
          }
        );

        return restoredSnapshot;

      }

      this.activateDegradedMode(
        "No cached profile or snapshot available for page recovery"
      );

      return {
        ok: false,
        status: "NO_PAGE_RECOVERY_AVAILABLE"
      };

    },

    /* =========================================================
       RUNTIME WATCHDOG
    ========================================================= */

    attachWatchdogListeners() {

      const bus =
        this.bus();

      if (!bus) {

        this.error(
          "WATCHDOG_ATTACH_FAILED",
          {
            reason: "EngineBus unavailable"
          }
        );

        return false;

      }

      bus.on(
        "engine_timeout",
        async (payload) => {

          await this.attemptEngineRecovery(
            payload.engine
          );

        }
      );

      bus.on(
        "engine_health_error",
        (payload) => {

          this.warn(
            "HEALTH_ERROR_RECEIVED",
            payload
          );

        }
      );

      bus.on(
        "engine_error",
        async (payload) => {

          await this.attemptEngineRecovery(
            payload.engine
          );

        }
      );

      this.log(
        "WATCHDOG_LISTENERS_ATTACHED"
      );

      return true;

    },

    /* =========================================================
       RECOVERY REPORT
    ========================================================= */

    snapshot() {

      return {

        version: this.version,

        status: this.status,

        degraded_mode:
          this.degradedMode,

        runtime_started_at:
          this.runtimeStartedAt,

        recovery_attempts:
          this.recoveryAttempts,

        recovery_log:
          this.recoveryLog.slice(-50),

        safe_runtime:
          window.STATScore.SafeRuntime || null

      };

    },

    printStatus() {

      const snapshot =
        this.snapshot();

      console.group(
        "[STATScore Self-Healing] STATUS REPORT"
      );

      console.log(snapshot);

      console.groupEnd();

      return snapshot;

    },

    /* =========================================================
       BOOT
    ========================================================= */

    boot() {

      this.status = "ONLINE";

      this.log(
        "SELF_HEALING_ENGINE_ONLINE",
        {
          version: this.version
        }
      );

      this.attachWatchdogListeners();

      this.bus()?.emit(
        "self_healing_online",
        {
          version: this.version
        }
      );

      return this.snapshot();

    }

  };

  /* ============================================================
     ATTACH GLOBAL
  ============================================================ */

  window.STATScore.SelfHealingEngine =
    SelfHealingEngine;

  /* ============================================================
     REGISTER WITH ENGINE BUS
  ============================================================ */

  if (window.STATScore?.EngineBus) {

    window.STATScore.EngineBus.registerEngine(
      "SelfHealingEngine",
      SelfHealingEngine,
      {
        version:
          SelfHealingEngine.version,
        required: true
      }
    );

  }

  /* ============================================================
     BOOT
  ============================================================ */

  SelfHealingEngine.boot();

})(); 
