/* ============================================================
   STATScore™ Crystal Report Engine
   FULL PRODUCTION FILE
   Version: v1.0
   Purpose:
   Institutional Athlete Intelligence Report Generation
   ============================================================ */

(function () {
  "use strict";

  const ENGINE_ID = "statscore-crystal-report-engine";
  const VERSION = "v1.0-output-layer";

  function log(message, payload) {
    console.log(`[STATScore Crystal Reports] ${message}`, payload || "");
  }

  function warn(message, payload) {
    console.warn(`[STATScore Crystal Reports] ${message}`, payload || "");
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function safe(value, fallback = "N/A") {
    return value === undefined || value === null || value === ""
      ? fallback
      : value;
  }

  function nowString() {
    return new Date().toLocaleString();
  }

  function createSection(title, body) {
    return `
      <section class="sc-crystal-section">
        <div class="sc-crystal-section-title">${title}</div>
        <div class="sc-crystal-section-body">
          ${body}
        </div>
      </section>
    `;
  }

  function createMetric(label, value, accent = "") {
    return `
      <div class="sc-crystal-metric ${accent}">
        <div class="sc-crystal-metric-label">${label}</div>
        <div class="sc-crystal-metric-value">${safe(value)}</div>
      </div>
    `;
  }

  function buildTraitTable(traits = []) {
    if (!Array.isArray(traits) || !traits.length) {
      return `
        <div class="sc-crystal-empty">
          No trait intelligence available.
        </div>
      `;
    }

    return `
      <table class="sc-crystal-table">
        <thead>
          <tr>
            <th>Trait</th>
            <th>Score</th>
            <th>Status</th>
            <th>Evidence</th>
          </tr>
        </thead>

        <tbody>
          ${traits.map((trait) => `
            <tr>
              <td>${safe(trait.name)}</td>
              <td>${safe(trait.value)}</td>
              <td>${safe(trait.status)}</td>
              <td>${safe(trait.evidence_status || trait.scoring_source || "N/A")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function buildDevelopmentList(plan = []) {
    if (!Array.isArray(plan) || !plan.length) {
      return `
        <div class="sc-crystal-empty">
          No development priorities available.
        </div>
      `;
    }

    return `
      <div class="sc-crystal-stack">
        ${plan.map((item, index) => `
          <div class="sc-dev-card">

            <div class="sc-dev-priority">
              PRIORITY ${index + 1}
            </div>

            <div class="sc-dev-title">
              ${safe(item.trait)}
            </div>

            <div class="sc-dev-category">
              ${safe(item.category)}
            </div>

            <div class="sc-dev-body">
              ${safe(item.recommendation)}
            </div>

            <div class="sc-dev-drills">
              ${(item.drills || []).map(drill => `
                <div class="sc-dev-drill">
                  ${drill}
                </div>
              `).join("")}
            </div>

          </div>
        `).join("")}
      </div>
    `;
  }

  function buildCorrectionPlan(plan = []) {
    if (!Array.isArray(plan) || !plan.length) {
      return `
        <div class="sc-crystal-empty">
          No correction actions currently required.
        </div>
      `;
    }

    return `
      <div class="sc-crystal-stack">
        ${plan.map(item => `
          <div class="sc-correction-card">

            <div class="sc-correction-category">
              ${safe(item.category)}
            </div>

            <div class="sc-correction-issue">
              ${safe(item.issue)}
            </div>

            <div class="sc-correction-action">
              ${safe(item.action)}
            </div>

          </div>
        `).join("")}
      </div>
    `;
  }

  function buildPathwayActions(actions = []) {
    if (!Array.isArray(actions) || !actions.length) {
      return `
        <div class="sc-crystal-empty">
          No pathway actions currently available.
        </div>
      `;
    }

    return `
      <div class="sc-crystal-stack">
        ${actions.map(item => `
          <div class="sc-pathway-card">

            <div class="sc-pathway-header">
              ${safe(item.category)}
            </div>

            <div class="sc-pathway-priority">
              ${safe(item.priority)}
            </div>

            <div class="sc-pathway-body">
              ${safe(item.action)}
            </div>

          </div>
        `).join("")}
      </div>
    `;
  }

  function athleteHeader(athlete, score, readiness) {
    return `
      <div class="sc-crystal-hero">

        <div class="sc-crystal-watermark">
          STATScore™
        </div>

        <div class="sc-crystal-identity">

          <div class="sc-crystal-name">
            ${safe(
              athlete?.athlete_display_name ||
              `${safe(athlete?.first_name, "")} ${safe(athlete?.last_name, "")}`
            )}
          </div>

          <div class="sc-crystal-subline">
            ${safe(athlete?.primary_sport || athlete?.sport)} ·
            ${safe(athlete?.primary_position || athlete?.position)} ·
            ${safe(score?.archetype)}
          </div>

        </div>

        <div class="sc-crystal-score">

          <div class="sc-crystal-score-value">
            ${safe(score?.score_final)}
          </div>

          <div class="sc-crystal-score-label">
            VERIFIED SIGNAL
          </div>

          <div class="sc-crystal-score-readiness">
            ${safe(readiness?.readiness_label)}
          </div>

        </div>

      </div>
    `;
  }

  function buildAthleteReport(data) {
    const {
      athlete,
      score,
      verification,
      evidence,
      readiness,
      pathway,
      eligibility
    } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>STATScore Crystal Report</title>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  background:#0b1018;
  color:#f4f2ef;
  font-family:Inter,Arial,sans-serif;
}

.sc-crystal-shell{
  width:100%;
  max-width:1200px;
  margin:auto;
  padding:34px;
}

.sc-crystal-topbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding-bottom:18px;
  border-bottom:2px solid #ff3434;
}

.sc-crystal-brand{
  font-size:28px;
  font-weight:1000;
  letter-spacing:.18em;
}

.sc-crystal-report-type{
  color:#9fe7ff;
  font-size:12px;
  letter-spacing:.18em;
  text-transform:uppercase;
}

.sc-crystal-hero{
  position:relative;
  margin-top:28px;
  border:1px solid rgba(255,255,255,.1);
  background:linear-gradient(
    135deg,
    rgba(255,255,255,.04),
    rgba(0,0,0,.28)
  );
  padding:28px;
  overflow:hidden;
}

.sc-crystal-watermark{
  position:absolute;
  right:18px;
  top:12px;
  font-size:80px;
  opacity:.04;
  font-weight:1000;
  pointer-events:none;
}

.sc-crystal-name{
  font-size:42px;
  font-weight:1000;
  line-height:1;
}

.sc-crystal-subline{
  margin-top:10px;
  color:#9fe7ff;
  font-size:14px;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.sc-crystal-score{
  margin-top:24px;
}

.sc-crystal-score-value{
  font-size:64px;
  font-weight:1000;
  color:#37d67a;
  line-height:1;
}

.sc-crystal-score-label{
  margin-top:8px;
  font-size:12px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:#d6deea;
}

.sc-crystal-score-readiness{
  margin-top:6px;
  color:#ffb100;
  font-size:13px;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-weight:900;
}

.sc-crystal-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:14px;
  margin-top:24px;
}

.sc-crystal-metric{
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.03);
  padding:16px;
}

.sc-crystal-metric-label{
  color:#9ea7b5;
  font-size:11px;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.sc-crystal-metric-value{
  margin-top:10px;
  font-size:28px;
  font-weight:1000;
}

.sc-crystal-section{
  margin-top:28px;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.03);
}

.sc-crystal-section-title{
  padding:16px 18px;
  border-bottom:1px solid rgba(255,255,255,.08);
  font-size:14px;
  font-weight:1000;
  letter-spacing:.14em;
  text-transform:uppercase;
  color:#ff3434;
}

.sc-crystal-section-body{
  padding:18px;
}

.sc-crystal-table{
  width:100%;
  border-collapse:collapse;
}

.sc-crystal-table th{
  text-align:left;
  padding:12px;
  background:rgba(255,255,255,.05);
  color:#9fe7ff;
  font-size:11px;
  letter-spacing:.1em;
  text-transform:uppercase;
}

.sc-crystal-table td{
  padding:12px;
  border-top:1px solid rgba(255,255,255,.06);
  color:#d6deea;
  font-size:13px;
}

.sc-crystal-stack{
  display:grid;
  gap:12px;
}

.sc-dev-card,
.sc-correction-card,
.sc-pathway-card{
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.22);
  padding:14px;
}

.sc-dev-priority,
.sc-correction-category,
.sc-pathway-header{
  color:#ff3434;
  font-size:11px;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-weight:1000;
}

.sc-dev-title,
.sc-correction-issue{
  margin-top:6px;
  font-size:18px;
  font-weight:900;
}

.sc-dev-category,
.sc-pathway-priority{
  margin-top:4px;
  color:#9fe7ff;
  font-size:11px;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.sc-dev-body,
.sc-correction-action,
.sc-pathway-body{
  margin-top:10px;
  color:#d6deea;
  line-height:1.5;
  font-size:13px;
}

.sc-dev-drills{
  margin-top:12px;
  display:grid;
  gap:6px;
}

.sc-dev-drill{
  border-left:2px solid #ffb100;
  padding-left:10px;
  color:#b9c4d6;
  font-size:12px;
}

.sc-crystal-empty{
  color:#9ea7b5;
  font-size:13px;
}

.sc-crystal-footer{
  margin-top:40px;
  border-top:1px solid rgba(255,255,255,.08);
  padding-top:18px;
  color:#7f8a99;
  font-size:11px;
  line-height:1.5;
}

</style>
</head>

<body>

<div class="sc-crystal-shell">

  <div class="sc-crystal-topbar">

    <div class="sc-crystal-brand">
      STATScore™
    </div>

    <div class="sc-crystal-report-type">
      Crystal Athlete Intelligence Report
    </div>

  </div>

  ${athleteHeader(athlete, score, readiness)}

  <div class="sc-crystal-grid">

    ${createMetric("Athletic Signal", score?.score_final)}
    ${createMetric("Verification Confidence", verification?.confidence_score)}
    ${createMetric("Evidence Strength", evidence?.evidence_score)}
    ${createMetric("Readiness", readiness?.readiness_score)}
    ${createMetric("Pathway Fit", pathway?.pathway_fit_score)}
    ${createMetric("Academic Readiness", eligibility?.eligibility_score)}

  </div>

  ${createSection(
    "Athlete Intelligence Matrix",
    buildTraitTable(score?.traits)
  )}

  ${createSection(
    "Development Priorities",
    buildDevelopmentList(readiness?.development_plan)
  )}

  ${createSection(
    "Pathway Intelligence",
    buildPathwayActions(pathway?.recommended_actions)
  )}

  ${createSection(
    "NCAA Eligibility Intelligence",
    buildCorrectionPlan(eligibility?.correction_plan)
  )}

  <div class="sc-crystal-footer">

    Generated:
    ${nowString()}
    <br><br>

    STATScore™ Crystal Reports are institutional intelligence outputs
    designed to support athlete development, pathway navigation,
    recruiter alignment, academic readiness, and ecosystem transparency.

  </div>

</div>

</body>
</html>
    `;
  }

  function gatherCurrentData() {
    return {
      athlete:
        window.STATScoreCurrentAthlete ||
        window.STATScoreCurrentSnapshot ||
        window.__STATSCORE_CURRENT_ATHLETE__ ||
        null,

      score:
        window.STATScoreCurrentFootballScore ||
        null,

      verification:
        window.STATScoreCurrentVerification ||
        null,

      evidence:
        window.STATScoreCurrentEvidence ||
        null,

      readiness:
        window.STATScoreCurrentReadiness ||
        null,

      pathway:
        window.STATScoreCurrentPathway ||
        null,

      eligibility:
        window.STATScoreCurrentNCAAEligibility ||
        null
    };
  }

  function openCrystalReport(html) {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      warn("Popup blocked.");
      return false;
    }

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();

    return true;
  }

  function generateAthleteCrystalReport() {
    const data = gatherCurrentData();

    if (!data.athlete) {
      warn("No athlete available for report generation.");
      return null;
    }

    const html = buildAthleteReport(data);

    window.STATScoreCurrentCrystalReportHTML = html;

    return {
      ok: true,
      engine_id: ENGINE_ID,
      version: VERSION,
      type: "ATHLETE_CRYSTAL_REPORT",
      html
    };
  }

  function openAthleteCrystalReport() {
    const result = generateAthleteCrystalReport();

    if (!result?.ok) {
      warn("Crystal report generation failed.");
      return null;
    }

    openCrystalReport(result.html);

    return result;
  }

  function init() {

    if (window.__STATSCORE_CRYSTAL_REPORT_ENGINE__) {
      warn("Duplicate initialization blocked.");
      return;
    }

    window.__STATSCORE_CRYSTAL_REPORT_ENGINE__ = true;

    window.STATScoreCrystalReportEngine = {

      engine_id: ENGINE_ID,
      version: VERSION,

      generateAthleteCrystalReport,
      openAthleteCrystalReport

    };

    if (!window.STATScore) {
      window.STATScore = {};
    }

    window.STATScore.CrystalReportEngine =
      window.STATScoreCrystalReportEngine;

    if (window.STATScoreEngineBus?.emit) {
      window.STATScoreEngineBus.emit("engine_online", {
        engine: ENGINE_ID,
        version: VERSION,
        status: "ONLINE"
      });
    }

    log("Engine online.", {
      engine: ENGINE_ID,
      version: VERSION
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})(); 
