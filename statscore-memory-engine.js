/* ============================================================
   STATScore™ Memory Engine
   File: statscore-memory-engine.js
   Version: STATSCORE-MEMORY-ENGINE-V1
   Purpose:
   Longitudinal athlete intelligence memory for tracking
   progression, regression, state changes, risk movement,
   quarterly history, scoring history, pathway history,
   media history, and profile continuity.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const MemoryEngine = {

    version: "STATSCORE-MEMORY-ENGINE-V1",

    TREND: {
      UP: "TRENDING_UP",
      STABLE: "STABLE",
      DOWN: "TRENDING_DOWN",
      VOLATILE: "VOLATILE",
      UNKNOWN: "UNKNOWN"
    },

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    profile() {
      return window.STATScore?.ProfileEngine || null;
    },

    scoring() {
      return window.STATScoreScoringEngine || null;
    },

    pathway() {
      return window.STATScore?.PathwayEngine || null;
    },

    quarterly() {
      return window.STATScore?.QuarterlyEligibilityEngine || null;
    },

    mediaIntel() {
      return window.STATScore?.MediaIntelligenceEngine || null;
    },

    eventEngine() {
      return window.STATScore?.EventEngine || null;
    },

    safe(value, fallback = "") {
      return this.core()?.safe?.(value, fallback) ?? (value || fallback);
    },

    number(value, fallback = 0) {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    },

    createMemoryRecord(snapshot, context = {}) {
      const profile =
        context.profile ||
        this.profile()?.assembleProfile?.(snapshot) ||
        null;

      const score =
        context.score ||
        this.scoring()?.explainScore?.(snapshot) ||
        null;

      const pathway =
        context.pathway ||
        this.pathway()?.buildPathwayReport?.(snapshot) ||
        null;

      const media =
        context.media ||
        this.mediaIntel()?.buildMediaIntelligenceReport?.(snapshot, context.media_context || {}) ||
        null;

      return {
        memory_id: "mem_" + Date.now(),
        engine_version: this.version,

        athlete_id: snapshot?.athlete_id || null,
        snapshot_id: snapshot?.snapshot_id || null,
        athlete_display_name: snapshot?.athlete_display_name || "Athlete",

        recorded_at: this.nowISO(),

        profile_banner: profile?.banner?.label || "",
        profile_visibility: profile?.operational_state?.visibility_state || "",

        final_score: score?.ok ? score.final_score : null,
        star_signal: score?.ok ? score.star_signal?.label : "",

        pathway_fit: pathway?.ok ? pathway.current_best_fit?.label : "",
        pathway_state: pathway?.ok ? pathway.current_best_fit?.state : "",
        academic_risk: pathway?.ok ? pathway.academic_risk?.risk : "",

        media_release_state: media?.ok ? media.release_state?.state : "",
        media_quality_score: media?.ok ? media.media_quality?.score : null,

        eligibility_status:
          context.quarterly_report?.evaluation?.status ||
          snapshot?.ncaa_status ||
          "",

        readiness_state:
          profile?.operational_state?.readiness_state ||
          "",

        notes: context.notes || "",
        source_context: context.source || "SYSTEM_MEMORY_CAPTURE",

        locked: true
      };
    },

    compareValues(previous, current) {
      if (previous === null || previous === undefined || current === null || current === undefined) {
        return {
          delta: null,
          trend: this.TREND.UNKNOWN
        };
      }

      const prev = this.number(previous);
      const curr = this.number(current);
      const delta = curr - prev;

      if (Math.abs(delta) <= 2) {
        return { delta, trend: this.TREND.STABLE };
      }

      if (delta > 2) {
        return { delta, trend: this.TREND.UP };
      }

      return { delta, trend: this.TREND.DOWN };
    },

    detectScoreTrend(history = []) {
      const ordered = [...history]
        .filter(r => r.final_score !== null && r.final_score !== undefined)
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

      if (ordered.length < 2) {
        return {
          trend: this.TREND.UNKNOWN,
          delta: null,
          reason: "Not enough score history."
        };
      }

      const first = ordered[0];
      const last = ordered[ordered.length - 1];

      const result = this.compareValues(first.final_score, last.final_score);

      return {
        ...result,
        first_score: first.final_score,
        latest_score: last.final_score,
        sample_count: ordered.length,
        reason: `Score moved from ${first.final_score} to ${last.final_score}.`
      };
    },

    detectMediaTrend(history = []) {
      const ordered = [...history]
        .filter(r => r.media_quality_score !== null && r.media_quality_score !== undefined)
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

      if (ordered.length < 2) {
        return {
          trend: this.TREND.UNKNOWN,
          delta: null,
          reason: "Not enough media history."
        };
      }

      const first = ordered[0];
      const last = ordered[ordered.length - 1];

      const result = this.compareValues(first.media_quality_score, last.media_quality_score);

      return {
        ...result,
        first_media_score: first.media_quality_score,
        latest_media_score: last.media_quality_score,
        sample_count: ordered.length,
        reason: `Media quality moved from ${first.media_quality_score} to ${last.media_quality_score}.`
      };
    },

    detectRiskMovement(history = []) {
      const riskRank = {
        LOW: 1,
        MODERATE: 2,
        MODERATE_HIGH: 3,
        HIGH: 4,
        CRITICAL: 5,
        UNKNOWN: 3
      };

      const ordered = [...history]
        .filter(r => r.academic_risk)
        .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

      if (ordered.length < 2) {
        return {
          trend: this.TREND.UNKNOWN,
          reason: "Not enough academic-risk history."
        };
      }

      const first = ordered[0];
      const last = ordered[ordered.length - 1];

      const start = riskRank[first.academic_risk] || 3;
      const end = riskRank[last.academic_risk] || 3;

      if (end > start) {
        return {
          trend: this.TREND.DOWN,
          reason: `Academic risk worsened from ${first.academic_risk} to ${last.academic_risk}.`
        };
      }

      if (end < start) {
        return {
          trend: this.TREND.UP,
          reason: `Academic risk improved from ${first.academic_risk} to ${last.academic_risk}.`
        };
      }

      return {
        trend: this.TREND.STABLE,
        reason: `Academic risk remained ${last.academic_risk}.`
      };
    },

    detectVolatility(history = []) {
      const scores = history
        .map(r => this.number(r.final_score, null))
        .filter(v => v !== null);

      if (scores.length < 3) {
        return {
          volatile: false,
          label: "INSUFFICIENT_HISTORY",
          reason: "Not enough samples for volatility detection."
        };
      }

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;

      return {
        volatile: variance > 80,
        label: variance > 80 ? "VOLATILE" : "STABLE",
        variance: Math.round(variance),
        reason: variance > 80
          ? "Score movement is unstable and should be reviewed."
          : "Score movement appears stable."
      };
    },

    buildProgressionReport(history = []) {
      const scoreTrend = this.detectScoreTrend(history);
      const mediaTrend = this.detectMediaTrend(history);
      const riskMovement = this.detectRiskMovement(history);
      const volatility = this.detectVolatility(history);

      return {
        ok: true,
        engine_version: this.version,
        generated_at: this.nowISO(),

        record_count: history.length,

        score_trend: scoreTrend,
        media_trend: mediaTrend,
        academic_risk_movement: riskMovement,
        volatility,

        overall_progression:
          scoreTrend.trend === this.TREND.UP && riskMovement.trend !== this.TREND.DOWN
            ? "PROGRESSION_POSITIVE"
            : scoreTrend.trend === this.TREND.DOWN || riskMovement.trend === this.TREND.DOWN
              ? "PROGRESSION_AT_RISK"
              : "PROGRESSION_STABLE",

        locked: true
      };
    },

    async persistMemoryRecord(record) {
      const db = this.core()?.getClient?.();

      if (!db) {
        return {
          ok: false,
          status: "NO_DB_CLIENT",
          record
        };
      }

      const { data, error } = await db
        .from("statscore_athlete_memory")
        .insert(record)
        .select("*")
        .single();

      if (error) {
        console.error("STATScore memory insert failed:", error);
        return {
          ok: false,
          status: "MEMORY_INSERT_FAILED",
          error,
          record
        };
      }

      return {
        ok: true,
        status: "MEMORY_INSERTED",
        record: data
      };
    },

    async loadAthleteMemory(athleteId) {
      const db = this.core()?.getClient?.();

      if (!db || !athleteId) {
        return {
          ok: false,
          status: "NO_DB_OR_ATHLETE",
          history: []
        };
      }

      const { data, error } = await db
        .from("statscore_athlete_memory")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("STATScore memory load failed:", error);
        return {
          ok: false,
          status: "MEMORY_LOAD_FAILED",
          error,
          history: []
        };
      }

      return {
        ok: true,
        status: "MEMORY_LOADED",
        history: data || []
      };
    },

    async capture(snapshot, context = {}) {
      const record = this.createMemoryRecord(snapshot, context);
      const persisted = await this.persistMemoryRecord(record);

      return {
        ok: persisted.ok,
        status: persisted.status,
        record: persisted.record || record,
        generated_at: this.nowISO()
      };
    },

    async buildAthleteMemoryReport(athleteId) {
      const loaded = await this.loadAthleteMemory(athleteId);

      if (!loaded.ok) {
        return {
          ok: false,
          status: loaded.status,
          history: []
        };
      }

      const progression = this.buildProgressionReport(loaded.history);

      return {
        ok: true,
        status: "MEMORY_REPORT_READY",
        athlete_id: athleteId,
        history: loaded.history,
        progression,
        generated_at: this.nowISO()
      };
    },

    renderMemoryPanel(targetId, report) {
      const el = document.getElementById(targetId);
      if (!el || !report?.ok) return;

      el.innerHTML = `
        <div class="memory-kicker">STATScore Athlete Memory</div>
        <h2>${report.progression.overall_progression}</h2>

        <div class="memory-grid">
          <div><b>Records</b><span>${report.progression.record_count}</span></div>
          <div><b>Score Trend</b><span>${report.progression.score_trend.trend}</span></div>
          <div><b>Media Trend</b><span>${report.progression.media_trend.trend}</span></div>
          <div><b>Academic Movement</b><span>${report.progression.academic_risk_movement.trend}</span></div>
          <div><b>Volatility</b><span>${report.progression.volatility.label}</span></div>
        </div>
      `;
    },

    explain(report) {
      if (!report?.ok) return "No athlete memory report available.";

      return [
        `Progression: ${report.progression.overall_progression}`,
        `Score: ${report.progression.score_trend.trend}`,
        `Media: ${report.progression.media_trend.trend}`,
        `Academic: ${report.progression.academic_risk_movement.trend}`
      ].join(" | ");
    }

  };

  window.STATScore.MemoryEngine = MemoryEngine;

  console.info("[STATScore] Memory Engine Loaded:", MemoryEngine.version);

})(); 
