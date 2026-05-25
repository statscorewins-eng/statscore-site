/* ============================================================
   STATScore™ Profile Engine
   File: statscore-profile-engine.js
   Version: STATSCORE-PROFILE-ENGINE-V1
   Purpose:
   Assembles the living athlete profile from identity,
   scoring, synthesis, state, consensus, pathway,
   recommendations, eligibility, media, and evaluator intelligence.
============================================================ */

(function () {
  "use strict";

  window.STATScore = window.STATScore || {};

  const ProfileEngine = {

    version: "STATSCORE-PROFILE-ENGINE-V1",

    nowISO() {
      return new Date().toISOString();
    },

    core() {
      return window.STATScoreCore || null;
    },

    scoring() {
      return window.STATScoreScoringEngine || null;
    },

    intelligence() {
      return window.STATScoreIntelligence || null;
    },

    pathway() {
      return window.STATScore?.PathwayEngine || null;
    },

    recommendation() {
      return window.STATScore?.RecommendationEngine || null;
    },

    media() {
      return window.STATScoreMediaRouting || null;
    },

    stateEngine() {
      return window.STATScore?.StateEngine || null;
    },

    synthesis() {
      return window.STATScore?.SynthesisEngine || null;
    },

    evaluator() {
      return window.STATScoreEvaluatorEngine || null;
    },

    roleAccess() {
      return window.STATScoreRoleAccess || null;
    },

    safe(value, fallback = "") {
      return this.core()?.safe?.(value, fallback) ?? (value || fallback);
    },

    lower(value) {
      return String(value || "").trim().toLowerCase();
    },

    buildIdentity(snapshot) {
      return {
        snapshot_id: snapshot?.snapshot_id || null,
        athlete_id: snapshot?.athlete_id || null,
        athlete_display_name: this.safe(snapshot?.athlete_display_name, "Athlete Profile"),

        first_name: this.safe(snapshot?.first_name),
        last_name: this.safe(snapshot?.last_name),

        sport: this.safe(snapshot?.sport, "Sport"),
        position: this.safe(snapshot?.position, "Position"),
        secondary_position: this.safe(snapshot?.secondary_position),

        graduation_class: this.safe(snapshot?.graduation_class, "Class Year"),
        school: this.safe(snapshot?.school, "School / Program"),
        city_state: this.safe(snapshot?.city_state, "City, State"),

        height: this.safe(snapshot?.height, "--"),
        weight: this.safe(snapshot?.weight, "--"),
        jersey_number: this.safe(snapshot?.jersey_number, "--"),

        headshot_public_url: this.safe(snapshot?.headshot_public_url),
        verification_status: this.safe(snapshot?.verification_status, "UNVERIFIED"),
        score_status: this.safe(snapshot?.score_status, "UNVERIFIED")
      };
    },

    buildProfileInputs(snapshot) {
      const scoring = this.scoring()?.explainScore?.(snapshot);
      const athleteIntel = this.intelligence()?.explainAthlete?.(snapshot);
      const pathway = this.pathway()?.buildPathwayReport?.(snapshot);
      const mediaPackage = this.media()?.buildMediaPackage?.(snapshot);
      const recommendations = this.recommendation()?.buildFullRecommendationReport?.(snapshot);
      const evaluatorDraft = this.evaluator()?.buildEvaluationDraft?.(snapshot, {
        trust_tier: "STANDARD",
        evaluator_name: "System Preview"
      });

      return {
        scoring: scoring?.ok ? scoring : null,
        athlete_intelligence: athleteIntel || null,
        pathway: pathway?.ok ? pathway : null,
        media: mediaPackage || null,
        recommendations: recommendations?.ok ? recommendations : null,
        evaluator_preview: evaluatorDraft || null
      };
    },

    buildSyntheticInput(snapshot, profileInputs) {
      return {
        athlete_id: snapshot?.athlete_id || snapshot?.snapshot_id || null,
        snapshot_id: snapshot?.snapshot_id || null,

        profile_state: snapshot?.snapshot_status || "CREATED",
        verification_state: snapshot?.verification_status || "UNVERIFIED",
        readiness_state: profileInputs?.athlete_intelligence?.readiness?.status || "DEVELOPING",
        eligibility_state: snapshot?.ncaa_status || "PARTIAL_REVIEW",
        pathway_state: profileInputs?.pathway?.current_best_fit?.state || "PENDING",
        media_state: profileInputs?.media?.readiness?.youtube_ready ? "READY" : "PENDING",
        evaluator_state: profileInputs?.evaluator_preview?.evaluation_status || "IN_REVIEW",
        coach_state: snapshot?.coach_name || snapshot?.coach_email ? "PRESENT" : "UNKNOWN",
        counselor_state: snapshot?.ncaa_status || snapshot?.current_gpa ? "PRESENT" : "UNKNOWN",
        recruiter_state: "CONTROLLED",
        program_state: "PENDING",
        competition_level: snapshot?.competition_level || snapshot?.raw?.competitionLevel || "UNVERIFIED"
      };
    },

    buildLivingState(snapshot, profileInputs) {
      const synthesisEngine = this.synthesis();
      const stateEngine = this.stateEngine();

      const synthesisInput = this.buildSyntheticInput(snapshot, profileInputs);

      const synthesisState =
        synthesisEngine?.synthesize?.(synthesisInput) || null;

      const operationalState =
        stateEngine?.buildStateFromSynthesis?.(synthesisState) || null;

      return {
        synthesis_state: synthesisState,
        operational_state: operationalState
      };
    },

    buildProfileBanner(livingState, profileInputs) {
      const state = livingState?.operational_state;
      const scoring = profileInputs?.scoring;
      const pathway = profileInputs?.pathway;

      if (!state) {
        return {
          label: "PROFILE BUILDING",
          tone: "yellow",
          explanation: "Athlete profile is still assembling intelligence."
        };
      }

      if (
        state.visibility_state === "VERIFIED_VISIBLE" &&
        scoring?.final_score >= 85
      ) {
        return {
          label: "VERIFIED RISING ATHLETE",
          tone: "green",
          explanation: "Athlete has verified intelligence, strong readiness, and controlled visibility clearance."
        };
      }

      if (state.eligibility_state === "NCAA_RISK" || state.eligibility_state === "PARTIAL_REVIEW") {
        return {
          label: "ELIGIBILITY REVIEW ACTIVE",
          tone: "yellow",
          explanation: "Athlete pathway is active but academic/eligibility review affects visibility."
        };
      }

      if (pathway?.current_best_fit?.state === "ACADEMIC_BRIDGE_PATH") {
        return {
          label: "BRIDGE PATHWAY RECOMMENDED",
          tone: "yellow",
          explanation: "Athlete may require academic or developmental bridge routing before expanded exposure."
        };
      }

      if (state.readiness_state === "READY" || state.readiness_state === "CONDITIONAL_READY") {
        return {
          label: "CONDITIONAL READINESS",
          tone: "green",
          explanation: "Athlete is approaching readiness but some governance checks may still apply."
        };
      }

      return {
        label: "DEVELOPMENT TRACK",
        tone: "red",
        explanation: "Athlete should remain in controlled development until more evidence, verification, or readiness is complete."
      };
    },

    buildRoleView(profile, role = "athlete") {
      const access = this.roleAccess();
      const r = String(role || "athlete").toLowerCase();

      const visibleSnapshot =
        access?.filterSnapshotForRole?.(profile.identity, r) ||
        profile.identity;

      const base = {
        role: r,
        identity: visibleSnapshot,
        banner: profile.banner,
        public_summary: profile.public_summary,
        operational_state: profile.operational_state,
        recommendations: profile.recommendations
      };

      if (r === "recruiter") {
        return {
          ...base,
          scoring: profile.scoring,
          pathway: profile.pathway,
          media: profile.media?.youtube_package || null,
          private_notes_hidden: true
        };
      }

      if (r === "counselor") {
        return {
          ...base,
          academic: profile.academic,
          pathway: profile.pathway,
          eligibility_focus: true
        };
      }

      if (r === "evaluator") {
        return {
          ...base,
          scoring: profile.scoring,
          evaluator_preview: profile.evaluator_preview,
          consensus_focus: true
        };
      }

      if (r === "parent") {
        return {
          ...base,
          permissions: profile.permissions,
          academic: profile.academic,
          media: profile.media,
          recommendations: profile.recommendations
        };
      }

      if (r === "admin" || r === "program") {
        return profile;
      }

      return base;
    },

    buildPublicSummary(identity, profileInputs, banner) {
      const scoring = profileInputs?.scoring;
      const pathway = profileInputs?.pathway;

      return {
        title: `${identity.athlete_display_name} — ${identity.position} / ${identity.sport}`,
        subtitle: `${identity.school} • Class ${identity.graduation_class}`,
        signal: scoring?.star_signal?.label || identity.score_status || "Scoring Pending",
        score: scoring?.final_score || "--",
        pathway: pathway?.current_best_fit?.label || "Pathway Pending",
        banner: banner.label,
        explanation: banner.explanation
      };
    },

    buildAcademicSnapshot(snapshot) {
      return {
        current_gpa: this.safe(snapshot?.current_gpa, "--"),
        ncaa_status: this.safe(snapshot?.ncaa_status, "Review Required"),
        transcript_available: this.safe(snapshot?.transcript_available, "Pending"),
        counselor_review: snapshot?.current_gpa || snapshot?.ncaa_status ? "Review Active" : "Review Needed"
      };
    },

    buildPermissionSnapshot(snapshot) {
      return {
        guardian_name: this.safe(snapshot?.guardian_name),
        guardian_email: this.safe(snapshot?.guardian_email),
        guardian_lane_active: !!(snapshot?.guardian_name || snapshot?.guardian_email),
        recruiter_contact_allowed: false,
        media_approval_required: true,
        visibility_control: "Controlled"
      };
    },

    assembleProfile(snapshot, options = {}) {
      if (!snapshot) {
        return {
          ok: false,
          status: "NO_SNAPSHOT",
          message: "No athlete snapshot loaded."
        };
      }

      const identity = this.buildIdentity(snapshot);
      const profileInputs = this.buildProfileInputs(snapshot);
      const livingState = this.buildLivingState(snapshot, profileInputs);
      const banner = this.buildProfileBanner(livingState, profileInputs);

      const profile = {
        ok: true,
        engine_version: this.version,
        generated_at: this.nowISO(),

        identity,
        banner,
        public_summary: this.buildPublicSummary(identity, profileInputs, banner),

        scoring: profileInputs.scoring,
        athlete_intelligence: profileInputs.athlete_intelligence,
        pathway: profileInputs.pathway,
        media: profileInputs.media,
        recommendations: profileInputs.recommendations,
        evaluator_preview: profileInputs.evaluator_preview,

        synthesis_state: livingState.synthesis_state,
        operational_state: livingState.operational_state,

        academic: this.buildAcademicSnapshot(snapshot),
        permissions: this.buildPermissionSnapshot(snapshot),

        source_snapshot: snapshot,
        locked: true
      };

      if (options.role) {
        return this.buildRoleView(profile, options.role);
      }

      return profile;
    },

    renderProfileSummary(targetId, profile) {
      const el = document.getElementById(targetId);
      if (!el || !profile?.ok) return;

      const esc = this.core()?.escapeHTML || ((v) => v);

      el.innerHTML = `
        <div class="profile-engine-kicker">STATScore Living Profile</div>
        <h2>${esc(profile.public_summary.title)}</h2>
        <p>${esc(profile.public_summary.subtitle)}</p>

        <div class="profile-engine-banner ${esc(profile.banner.tone)}">
          <strong>${esc(profile.banner.label)}</strong>
          <span>${esc(profile.banner.explanation)}</span>
        </div>

        <div class="profile-engine-grid">
          <div><b>Signal</b><span>${esc(profile.public_summary.signal)}</span></div>
          <div><b>Score</b><span>${esc(profile.public_summary.score)}</span></div>
          <div><b>Pathway</b><span>${esc(profile.public_summary.pathway)}</span></div>
          <div><b>Visibility</b><span>${esc(profile.operational_state?.visibility_state || "--")}</span></div>
        </div>
      `;
    },

    explain(profile) {
      if (!profile?.ok) return "No living profile available.";

      return [
        `Athlete: ${profile.identity.athlete_display_name}`,
        `Banner: ${profile.banner.label}`,
        `Signal: ${profile.public_summary.signal}`,
        `Pathway: ${profile.public_summary.pathway}`,
        `Visibility: ${profile.operational_state?.visibility_state || "--"}`
      ].join(" | ");
    }

  };

  window.STATScore.ProfileEngine = ProfileEngine;

  console.info("[STATScore] Profile Engine Loaded:", ProfileEngine.version);

})(); 
