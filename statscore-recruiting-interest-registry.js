/* ============================================================
   STATS-CORE™ RECRUITING INTEREST REGISTRY
   File: statscore-recruiting-interest-registry.js
   Version: STATSCORE-RECRUITING-INTEREST-REGISTRY-V1
   Purpose:
   Separates exposure signals from verified recruiting interest,
   offers, and commitments.

   Doctrine:
   - Exposure is not interest.
   - Interest is not communication.
   - Communication is not an offer.
   - Offer is not commitment.
   - Viewed profile does NOT create false hope.
   - Recruiter actions must be registered, classified, and explainable.
============================================================ */

(function(){
  "use strict";

  window.STATSCORE_RECRUITING_INTEREST_REGISTRY = {
    version: "STATSCORE-RECRUITING-INTEREST-REGISTRY-V1",
    locked: true,

    INTEREST_LEVELS: {
      VIEWED_PROFILE: {
        rank: 1,
        label: "Viewed Profile",
        category: "EXPOSURE_SIGNAL",
        creates_interest: false,
        creates_offer: false,
        meaning: "A recruiter or program viewed the athlete profile. This is exposure, not confirmed interest."
      },
      VIEWED_FILM: {
        rank: 2,
        label: "Viewed Film",
        category: "EXPOSURE_SIGNAL",
        creates_interest: false,
        creates_offer: false,
        meaning: "Film was viewed. This improves visibility but does not confirm recruiting interest."
      },
      FOLLOWED_ATHLETE: {
        rank: 3,
        label: "Followed Athlete",
        category: "WATCH_SIGNAL",
        creates_interest: false,
        creates_offer: false,
        meaning: "Athlete was followed or added to a watchlist. This is a tracking signal, not an offer."
      },
      REQUESTED_INFO: {
        rank: 4,
        label: "Requested Info",
        category: "EARLY_INTEREST",
        creates_interest: true,
        creates_offer: false,
        meaning: "Recruiter requested additional information. This is early verified interest."
      },
      MESSAGE_REQUEST: {
        rank: 5,
        label: "Message Request",
        category: "COMMUNICATION_REQUEST",
        creates_interest: true,
        creates_offer: false,
        meaning: "Recruiter requested communication access. Communication governance applies."
      },
      EVALUATION_REQUESTED: {
        rank: 6,
        label: "Evaluation Requested",
        category: "EVALUATION_INTEREST",
        creates_interest: true,
        creates_offer: false,
        meaning: "Recruiter requested athlete evaluation or verification review."
      },
      CAMP_INVITE: {
        rank: 7,
        label: "Camp Invite",
        category: "ACTIVE_RECRUITING_SIGNAL",
        creates_interest: true,
        creates_offer: false,
        meaning: "Athlete received a camp invite. This is active recruiting activity but not an offer."
      },
      VISIT_INVITE: {
        rank: 8,
        label: "Visit Invite",
        category: "HIGH_INTEREST",
        creates_interest: true,
        creates_offer: false,
        meaning: "Athlete received a visit invite. This indicates strong interest but is still not an offer."
      },
      OFFER: {
        rank: 9,
        label: "Offer",
        category: "FORMAL_OFFER",
        creates_interest: true,
        creates_offer: true,
        meaning: "Program has registered an offer. Offer must remain separate from commitment."
      },
      COMMITMENT: {
        rank: 10,
        label: "Commitment",
        category: "COMMITMENT_STATUS",
        creates_interest: true,
        creates_offer: true,
        creates_commitment: true,
        meaning: "Athlete has committed. Commitment is the highest recruiting status."
      }
    },

    SIGNAL_STATUS: {
      UNVERIFIED: "UNVERIFIED",
      VERIFIED: "VERIFIED",
      REVOKED: "REVOKED",
      EXPIRED: "EXPIRED",
      PENDING_PARENT_PERMISSION: "PENDING_PARENT_PERMISSION",
      COMMUNICATION_ALLOWED: "COMMUNICATION_ALLOWED",
      COMMUNICATION_RESTRICTED: "COMMUNICATION_RESTRICTED"
    },

    normalize(value){
      return String(value || "").trim().toUpperCase().replace(/\s+/g, "_");
    },

    nowISO(){
      return new Date().toISOString();
    },

    getLevel(level){
      const key = this.normalize(level);
      return this.INTEREST_LEVELS[key] || null;
    },

    createSignal(input = {}){
      const levelKey = this.normalize(input.interest_level || input.signal_type);
      const level = this.INTEREST_LEVELS[levelKey];

      if(!level){
        return {
          ok: false,
          error: "INVALID_INTEREST_LEVEL",
          message: "Recruiting signal level is not recognized.",
          received: input.interest_level || input.signal_type || null
        };
      }

      const parentPermissionRequired = Boolean(input.parent_permission_required);
      const communicationAllowed = Boolean(input.communication_allowed);

      let signalStatus = input.signal_status || this.SIGNAL_STATUS.UNVERIFIED;

      if(parentPermissionRequired && !communicationAllowed){
        signalStatus = this.SIGNAL_STATUS.PENDING_PARENT_PERMISSION;
      }

      return {
        ok: true,
        registry_version: this.version,

        signal_id: input.signal_id || crypto?.randomUUID?.() || `signal_${Date.now()}`,

        program_id: input.program_id || null,
        program_name: input.program_name || null,

        recruiter_id: input.recruiter_id || null,
        recruiter_name: input.recruiter_name || null,

        athlete_id: input.athlete_id || null,
        athlete_name: input.athlete_name || null,

        interest_level: levelKey,
        interest_rank: level.rank,
        signal_label: level.label,
        signal_category: level.category,

        creates_interest: Boolean(level.creates_interest),
        creates_offer: Boolean(level.creates_offer),
        creates_commitment: Boolean(level.creates_commitment),

        signal_status: signalStatus,
        verified_at: input.verified_at || null,

        communication_allowed: communicationAllowed,
        parent_permission_required: parentPermissionRequired,

        notes: input.notes || "",
        meaning: level.meaning,

        created_at: input.created_at || this.nowISO(),
        updated_at: this.nowISO(),
        locked: true
      };
    },

    classifySignal(input = {}){
      const signal = this.createSignal(input);
      if(!signal.ok) return signal;

      let publicLabel = "Exposure Signal";
      let athleteMessage = "This signal should not be treated as confirmed recruiting interest.";

      if(signal.creates_commitment){
        publicLabel = "Commitment";
        athleteMessage = "This signal indicates a commitment status.";
      } else if(signal.creates_offer){
        publicLabel = "Formal Offer";
        athleteMessage = "This signal indicates an offer, but not a commitment.";
      } else if(signal.creates_interest){
        publicLabel = "Verified Recruiting Interest";
        athleteMessage = "This signal indicates real recruiting interest, but not an offer.";
      }

      return {
        ...signal,
        public_label: publicLabel,
        athlete_message: athleteMessage,
        explainability: this.explainSignal(signal)
      };
    },

    explainSignal(signal){
      return [
        `Signal: ${signal.signal_label}.`,
        `Category: ${signal.signal_category}.`,
        `Creates interest: ${signal.creates_interest ? "Yes" : "No"}.`,
        `Creates offer: ${signal.creates_offer ? "Yes" : "No"}.`,
        `Creates commitment: ${signal.creates_commitment ? "Yes" : "No"}.`,
        `Meaning: ${signal.meaning}`
      ];
    },

    summarizeAthleteInterest(signals = []){
      const classified = signals
        .map(signal => this.classifySignal(signal))
        .filter(signal => signal.ok);

      if(!classified.length){
        return {
          ok: true,
          status: "NO_SIGNALS",
          highest_level: null,
          summary: "No recruiting signals registered.",
          signals: []
        };
      }

      const sorted = classified.sort((a,b) => b.interest_rank - a.interest_rank);
      const highest = sorted[0];

      return {
        ok: true,
        status: "SIGNALS_FOUND",
        highest_level: highest.signal_label,
        highest_category: highest.signal_category,
        creates_interest: highest.creates_interest,
        creates_offer: highest.creates_offer,
        creates_commitment: highest.creates_commitment,
        summary: this.buildSummary(highest),
        signals: sorted,
        generated_at: this.nowISO(),
        locked: true
      };
    },

    buildSummary(highest){
      if(highest.creates_commitment){
        return `${highest.athlete_name || "Athlete"} has a registered commitment signal with ${highest.program_name || "a program"}.`;
      }

      if(highest.creates_offer){
        return `${highest.athlete_name || "Athlete"} has a registered offer signal from ${highest.program_name || "a program"}.`;
      }

      if(highest.creates_interest){
        return `${highest.athlete_name || "Athlete"} has verified recruiting interest from ${highest.program_name || "a program"}, but this is not an offer.`;
      }

      return `${highest.athlete_name || "Athlete"} has exposure/watch signals, but no verified recruiting interest yet.`;
    }
  };

  window.STATSCORE_REGISTER_RECRUITING_SIGNAL = function(input){
    return window.STATSCORE_RECRUITING_INTEREST_REGISTRY.classifySignal(input);
  };

  window.STATSCORE_SUMMARIZE_RECRUITING_INTEREST = function(signals){
    return window.STATSCORE_RECRUITING_INTEREST_REGISTRY.summarizeAthleteInterest(signals);
  };

  console.info("STATS-CORE Recruiting Interest Registry loaded:", window.STATSCORE_RECRUITING_INTEREST_REGISTRY.version);
})(); 
