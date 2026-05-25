/* ============================================================
   STATScore™ Consensus Engine
   File: statscore-consensus-engine.js
   Version: STATSCORE-CONSENSUS-ENGINE-V1

   PURPOSE:
   Determines confidence quality, agreement alignment,
   volatility, authority weighting, and operational trust.

   Converts multiple signals into governed certainty.
============================================================ */

(function () {

  "use strict";

  window.STATScore = window.STATScore || {};

  const ConsensusEngine = {

    version: "STATSCORE-CONSENSUS-ENGINE-V1",

    AUTHORITY_WEIGHTS: {

      evaluator: 1.00,
      head_coach: 0.92,
      position_coach: 0.84,
      trainer: 0.76,
      counselor: 0.72,
      parent: 0.58,
      athlete: 0.50,
      recruiter: 0.68,
      system: 0.80

    },

    SIGNAL_VALUES: {

      elite: 100,
      strong: 85,
      verified: 82,
      positive: 75,
      developing: 60,
      average: 50,
      concern: 35,
      weak: 25,
      blocked: 10

    },

    VOLATILITY_LEVELS: {

      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH"

    },

    CONFIDENCE_LEVELS: {

      VERIFIED: "VERIFIED",
      STRONG: "STRONG",
      MODERATE: "MODERATE",
      WEAK: "WEAK",
      UNSTABLE: "UNSTABLE"

    },

    nowISO() {
      return new Date().toISOString();
    },

    normalizeValue(value) {

      if (typeof value === "number") {
        return value;
      }

      const key =
        String(value || "")
          .trim()
          .toLowerCase();

      return this.SIGNAL_VALUES[key] || 50;

    },

    authorityWeight(role) {

      return (
        this.AUTHORITY_WEIGHTS[
          String(role || "").toLowerCase()
        ] || 0.50
      );

    },

    weightedAverage(signals = []) {

      if (!signals.length) {
        return 0;
      }

      let total = 0;
      let weights = 0;

      signals.forEach(signal => {

        const weight =
          this.authorityWeight(
            signal.source_role
          );

        const value =
          this.normalizeValue(
            signal.signal_value
          );

        total += value * weight;
        weights += weight;

      });

      if (!weights) return 0;

      return total / weights;

    },

    calculateVariance(signals = [], average = 0) {

      if (!signals.length) {
        return 0;
      }

      let variance = 0;

      signals.forEach(signal => {

        const value =
          this.normalizeValue(
            signal.signal_value
          );

        variance += Math.pow(
          value - average,
          2
        );

      });

      return variance / signals.length;

    },

    classifyVolatility(variance = 0) {

      if (variance <= 120) {
        return this.VOLATILITY_LEVELS.LOW;
      }

      if (variance <= 450) {
        return this.VOLATILITY_LEVELS.MEDIUM;
      }

      return this.VOLATILITY_LEVELS.HIGH;

    },

    classifyConfidence(score = 0) {

      if (score >= 85) {
        return this.CONFIDENCE_LEVELS.VERIFIED;
      }

      if (score >= 72) {
        return this.CONFIDENCE_LEVELS.STRONG;
      }

      if (score >= 58) {
        return this.CONFIDENCE_LEVELS.MODERATE;
      }

      if (score >= 40) {
        return this.CONFIDENCE_LEVELS.WEAK;
      }

      return this.CONFIDENCE_LEVELS.UNSTABLE;

    },

    determineAgreement(signals = []) {

      if (signals.length <= 1) {
        return 1;
      }

      let aligned = 0;
      let comparisons = 0;

      for (let i = 0; i < signals.length; i++) {

        for (let j = i + 1; j < signals.length; j++) {

          const a =
            this.normalizeValue(
              signals[i].signal_value
            );

          const b =
            this.normalizeValue(
              signals[j].signal_value
            );

          const difference =
            Math.abs(a - b);

          comparisons++;

          if (difference <= 15) {
            aligned++;
          }

        }

      }

      if (!comparisons) {
        return 1;
      }

      return aligned / comparisons;

    },

    buildConsensus(signals = [], trait = "unknown") {

      const average =
        this.weightedAverage(signals);

      const variance =
        this.calculateVariance(
          signals,
          average
        );

      const volatility =
        this.classifyVolatility(
          variance
        );

      const agreement =
        this.determineAgreement(
          signals
        );

      const confidence =
        this.classifyConfidence(
          average
        );

      const reviewRequired =
        volatility ===
        this.VOLATILITY_LEVELS.HIGH;

      return {

        consensus_id:
          "consensus_" +
          Date.now(),

        engine_version:
          this.version,

        trait,

        signal_count:
          signals.length,

        weighted_score:
          Number(
            average.toFixed(2)
          ),

        agreement_score:
          Number(
            agreement.toFixed(2)
          ),

        volatility,

        confidence,

        review_required:
          reviewRequired,

        authority_distribution:
          this.buildAuthorityMap(
            signals
          ),

        generated_at:
          this.nowISO(),

        locked: true

      };

    },

    buildAuthorityMap(signals = []) {

      const map = {};

      signals.forEach(signal => {

        const role =
          signal.source_role ||
          "unknown";

        if (!map[role]) {
          map[role] = 0;
        }

        map[role]++;

      });

      return map;

    },

    detectConflict(signals = []) {

      const conflicts = [];

      for (let i = 0; i < signals.length; i++) {

        for (let j = i + 1; j < signals.length; j++) {

          const a =
            this.normalizeValue(
              signals[i].signal_value
            );

          const b =
            this.normalizeValue(
              signals[j].signal_value
            );

          const difference =
            Math.abs(a - b);

          if (difference >= 40) {

            conflicts.push({

              signal_a:
                signals[i],

              signal_b:
                signals[j],

              difference,

              severity:
                difference >= 70
                  ? "CRITICAL"
                  : "WARNING"

            });

          }

        }

      }

      return conflicts;

    },

    buildProjection(consensus) {

      if (!consensus) {
        return null;
      }

      let projection =
        "UNCERTAIN";

      if (
        consensus.confidence ===
        "VERIFIED"
      ) {

        projection =
          "HIGH_TRAJECTORY";

      }

      if (
        consensus.confidence ===
        "STRONG"
      ) {

        projection =
          "STABLE_DEVELOPMENT";

      }

      if (
        consensus.confidence ===
        "MODERATE"
      ) {

        projection =
          "TRACKING_DEVELOPMENT";

      }

      if (
        consensus.confidence ===
        "WEAK"
      ) {

        projection =
          "DEVELOPMENT_RISK";

      }

      if (
        consensus.confidence ===
        "UNSTABLE"
      ) {

        projection =
          "REQUIRES_REVIEW";

      }

      return {

        projection,

        readiness_probability:
          this.probabilityFromConfidence(
            consensus.confidence
          ),

        volatility:
          consensus.volatility,

        review_required:
          consensus.review_required

      };

    },

    probabilityFromConfidence(level) {

      switch(level) {

        case "VERIFIED":
          return 0.94;

        case "STRONG":
          return 0.82;

        case "MODERATE":
          return 0.67;

        case "WEAK":
          return 0.45;

        default:
          return 0.22;

      }

    },

    processTraitConsensus(
      trait,
      signals = []
    ) {

      const consensus =
        this.buildConsensus(
          signals,
          trait
        );

      const conflicts =
        this.detectConflict(
          signals
        );

      const projection =
        this.buildProjection(
          consensus
        );

      return {

        ok: true,

        engine_version:
          this.version,

        trait,

        consensus,

        conflicts,

        projection,

        requires_manual_review:
          conflicts.some(
            c =>
              c.severity ===
              "CRITICAL"
          ),

        generated_at:
          this.nowISO()

      };

    },

    explain(result) {

      if (!result) {
        return "No consensus result.";
      }

      return [

        `Trait: ${result.trait}`,

        `Confidence: ${result.consensus.confidence}`,

        `Agreement: ${result.consensus.agreement_score}`,

        `Volatility: ${result.consensus.volatility}`,

        `Projection: ${result.projection.projection}`

      ].join(" | ");

    }

  };

  window.STATScore.ConsensusEngine =
    ConsensusEngine;

  console.info(
    "[STATScore] Consensus Engine Loaded:",
    ConsensusEngine.version
  );

})(); 
