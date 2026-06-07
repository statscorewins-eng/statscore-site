/*
=========================================================
STATS-CORE™ PRODUCTION MATRIX
Proprietary Athletic Production Intelligence Layer
=========================================================
*/

window.STATSCORE_PRODUCTION_MATRIX = {
  football: {
    quarterback: {
      elite: {
        label: "Power 4 / High D1",
        production_score_min: 90,
        indicators: [
          "High verified game production",
          "Strong TD-to-turnover ratio",
          "Advanced decision-making",
          "Verified arm strength",
          "Leadership impact"
        ]
      },
      high: {
        label: "G5 / FCS / D1",
        production_score_min: 82,
        indicators: [
          "Consistent varsity production",
          "Recruitable film",
          "Strong accuracy and command",
          "Scheme-transfer potential"
        ]
      },
      recruitable: {
        label: "D2 / NAIA / Developmental FCS",
        production_score_min: 72,
        indicators: [
          "Productive but still developing",
          "Needs verified competition context",
          "Needs more film or camp validation"
        ]
      },
      developing: {
        label: "D3 / JUCO / Prep / Developmental",
        production_score_min: 60,
        indicators: [
          "Needs production evidence",
          "Needs measurable verification",
          "Needs development route"
        ]
      }
    },

    wide_receiver: {
      elite: {
        label: "Power 4 / High D1",
        production_score_min: 90,
        indicators: [
          "Dominant game production",
          "Separation against verified competition",
          "Explosive yards after catch",
          "Verified speed or elite play speed",
          "High impact scoring production"
        ]
      },
      high: {
        label: "G5 / FCS / D1",
        production_score_min: 82,
        indicators: [
          "Strong receiving production",
          "Reliable route running",
          "Verified hands",
          "Recruitable frame or speed"
        ]
      },
      recruitable: {
        label: "D2 / NAIA / Developmental FCS",
        production_score_min: 72,
        indicators: [
          "Solid production",
          "Needs exposure validation",
          "Needs verified athletic testing"
        ]
      },
      developing: {
        label: "D3 / JUCO / Prep / Developmental",
        production_score_min: 60,
        indicators: [
          "Needs production increase",
          "Needs film evidence",
          "Needs development pathway"
        ]
      }
    },

    running_back: {
      elite: {
        label: "Power 4 / High D1",
        production_score_min: 90,
        indicators: [
          "High rushing production",
          "Explosive play rate",
          "Contact balance",
          "Verified speed",
          "Consistent scoring impact"
        ]
      },
      high: {
        label: "G5 / FCS / D1",
        production_score_min: 82,
        indicators: [
          "Strong varsity production",
          "Reliable ball security",
          "Good burst and vision",
          "Recruitable film"
        ]
      },
      recruitable: {
        label: "D2 / NAIA / Developmental FCS",
        production_score_min: 72,
        indicators: [
          "Productive but needs validation",
          "Needs verified speed/strength",
          "Needs more competitive context"
        ]
      },
      developing: {
        label: "D3 / JUCO / Prep / Developmental",
        production_score_min: 60,
        indicators: [
          "Needs stronger evidence",
          "Needs development route",
          "Needs production growth"
        ]
      }
    },

    defensive_back: {
      elite: {
        label: "Power 4 / High D1",
        production_score_min: 90,
        indicators: [
          "High-level coverage production",
          "Turnover creation",
          "Verified speed",
          "Position versatility",
          "Strong tackling evidence"
        ]
      },
      high: {
        label: "G5 / FCS / D1",
        production_score_min: 82,
        indicators: [
          "Good coverage evidence",
          "Recruitable athletic profile",
          "Strong game film",
          "Verified competitive production"
        ]
      },
      recruitable: {
        label: "D2 / NAIA / Developmental FCS",
        production_score_min: 72,
        indicators: [
          "Solid defensive production",
          "Needs exposure",
          "Needs verified metrics"
        ]
      },
      developing: {
        label: "D3 / JUCO / Prep / Developmental",
        production_score_min: 60,
        indicators: [
          "Needs more film",
          "Needs measurable verification",
          "Needs position development"
        ]
      }
    }
  }
};

/*
=========================================================
PRODUCTION MATRIX HELPER
=========================================================
*/

window.getProductionProjection = function({ sport, position, production_score }) {
  const cleanSport = String(sport || "").toLowerCase().replace(/\s+/g, "_");
  const cleanPosition = String(position || "").toLowerCase().replace(/\s+/g, "_");
  const score = Number(production_score || 0);

  const matrix =
    window.STATSCORE_PRODUCTION_MATRIX?.[cleanSport]?.[cleanPosition];

  if (!matrix) {
    return {
      status: "NO_MATRIX_FOUND",
      label: "Needs sport/position matrix",
      score,
      why: [
        "No production matrix exists yet for this sport and position.",
        "Route athlete through evidence-building pathway until matrix is established."
      ]
    };
  }

  if (score >= matrix.elite.production_score_min) {
    return { tier: "ELITE", ...matrix.elite, score };
  }

  if (score >= matrix.high.production_score_min) {
    return { tier: "HIGH", ...matrix.high, score };
  }

  if (score >= matrix.recruitable.production_score_min) {
    return { tier: "RECRUITABLE", ...matrix.recruitable, score };
  }

  if (score >= matrix.developing.production_score_min) {
    return { tier: "DEVELOPING", ...matrix.developing, score };
  }

  return {
    tier: "UNVERIFIED",
    label: "Developmental / Needs Evidence",
    score,
    indicators: [
      "Insufficient production evidence",
      "Needs verified film",
      "Needs coach/evaluator input"
    ]
  };
};

console.log("STATS-CORE Production Matrix Loaded"); 
