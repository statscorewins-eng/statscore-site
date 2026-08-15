/* ============================================================
   STATS-CORE™ CRYSTAL REPORT ENGINE
   File: statscore-crystal-reports.js
   Version: STATSCORE-CRYSTAL-REPORTS-V2-GOVERNED-PUBLICATION

   Owner:
   Stream 7 — Crystal Reports / Crystal Registry /
   Enterprise Publication Authority

   Constitutional Purpose:
   Compose explainable, versioned, snapshot-bound Crystal Reports
   from governed enterprise intelligence.

   STREAM 7 MAY:
   - consume governed Crystal publication objects;
   - consume governed publication-safe intelligence references;
   - preserve athlete/snapshot lineage;
   - preserve WHY;
   - preserve confidence;
   - preserve authority/version/receipt lineage;
   - preserve pathway constraints;
   - preserve recommendation/action references;
   - preserve eligibility rule/version references;
   - compose institutional human-readable reports;
   - prepare report publication records;
   - hand report publication to the Publication Receipt lifecycle.

   STREAM 7 SHALL NOT:
   - calculate Athletic Score;
   - calculate STATScore;
   - calculate Evidence Strength;
   - calculate Confidence;
   - calculate Readiness;
   - calculate Development Intelligence;
   - prescribe development plans;
   - calculate Pathway;
   - calculate Eligibility;
   - manufacture ranking;
   - manufacture Match Intelligence;
   - strengthen verification claims;
   - combine intelligence from mismatched snapshots;
   - publish restricted intelligence merely because it exists.

   CONTROLLING DOCTRINES:

   Crystal Report ≠ Intelligence Authority

   Intelligence
        ↓
   Governed Intelligence Receipt
        ↓
   Crystal Composition
        ↓
   Crystal Report
        ↓
   Publication Receipt

   Report Composition Time ≠ Intelligence Effective Time

   Athletic Ceiling ≠ Current Reachable Pathway

   Fact ≠ Evidence ≠ Authority ≠ Confidence ≠ Interpretation
        ≠ Recommendation ≠ Action ≠ Outcome
============================================================ */

(function () {
  "use strict";


  const ENGINE_ID =
    "statscore-crystal-report-engine";

  const VERSION =
    "STATSCORE-CRYSTAL-REPORTS-V2-GOVERNED-PUBLICATION";


  const REPORT_TYPES = Object.freeze({
    ATHLETE_INTELLIGENCE:
      "ATHLETE_INTELLIGENCE",

    CRYSTAL_MATCH:
      "CRYSTAL_MATCH",

    PATHWAY:
      "PATHWAY",

    DEVELOPMENT:
      "DEVELOPMENT",

    ELIGIBILITY:
      "ELIGIBILITY",

    LIFECYCLE:
      "LIFECYCLE"
  });


  const DISCLOSURE_SCOPES = Object.freeze({
    PRIVATE:
      "PRIVATE",

    ATHLETE_WORKSPACE:
      "ATHLETE_WORKSPACE",

    PARENT_GUARDIAN:
      "PARENT_GUARDIAN",

    PROFESSIONAL_WORKSPACE:
      "PROFESSIONAL_WORKSPACE",

    RECRUITING:
      "RECRUITING",

    PUBLIC_MEDIA:
      "PUBLIC_MEDIA"
  });


  /* ==========================================================
     LOGGING
  ========================================================== */

  function log(message, payload) {
    console.log(
      `[STATS-CORE Crystal Reports] ${message}`,
      payload || ""
    );
  }


  function warn(message, payload) {
    console.warn(
      `[STATS-CORE Crystal Reports] ${message}`,
      payload || ""
    );
  }


  /* ==========================================================
     UTILITIES
  ========================================================== */

  function clean(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  }


  function upper(value) {
    return clean(value).toUpperCase();
  }


  function safe(value, fallback = "N/A") {
    return (
      value === undefined ||
      value === null ||
      value === ""
    )
      ? fallback
      : value;
  }


  function clone(value) {
    try {
      return JSON.parse(
        JSON.stringify(value)
      );
    } catch (_) {
      return value;
    }
  }


  function nowISO() {
    return new Date().toISOString();
  }


  function generateId(prefix = "crystal_report") {
    if (
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return `${prefix}:${globalThis.crypto.randomUUID()}`;
    }

    return (
      `${prefix}:${Date.now()}:` +
      Math.random()
        .toString(36)
        .slice(2)
    );
  }


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function display(value, fallback = "N/A") {
    return escapeHTML(
      safe(value, fallback)
    );
  }


  function formatTimestamp(value) {
    if (!value) {
      return "N/A";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return clean(value);
    }

    return date.toLocaleString();
  }


  /* ==========================================================
     GOVERNED CONTRACT VALIDATION
  ========================================================== */

  function validateReportContract(contract = {}) {
    const errors = [];

    if (!clean(contract.report_id)) {
      errors.push(
        "report_id is required."
      );
    }

    if (!clean(contract.report_type)) {
      errors.push(
        "report_type is required."
      );
    }

    if (!clean(contract.athlete_id)) {
      errors.push(
        "athlete_id is required."
      );
    }

    if (!clean(contract.snapshot_id)) {
      errors.push(
        "snapshot_id is required."
      );
    }

    if (
      !Array.isArray(
        contract.intelligence_components
      )
    ) {
      errors.push(
        "intelligence_components array is required."
      );
    }

    if (
      !clean(
        contract.disclosure_scope
      )
    ) {
      errors.push(
        "disclosure_scope is required."
      );
    }


    /*
      Every material intelligence component must carry lineage.
    */
    (
      contract.intelligence_components ||
      []
    ).forEach(
      (component, index) => {

        if (!clean(component.domain)) {
          errors.push(
            `intelligence_components[${index}].domain is required.`
          );
        }

        if (
          !clean(
            component.intelligence_authority
          )
        ) {
          errors.push(
            `intelligence_components[${index}].intelligence_authority is required.`
          );
        }

        if (
          !clean(
            component.intelligence_receipt_id
          )
        ) {
          errors.push(
            `intelligence_components[${index}].intelligence_receipt_id is required.`
          );
        }

        if (
          component.snapshot_id &&
          component.snapshot_id !==
            contract.snapshot_id
        ) {
          errors.push(
            `intelligence_components[${index}] references a different snapshot_id.`
          );
        }

        if (
          component.athlete_id &&
          component.athlete_id !==
            contract.athlete_id
        ) {
          errors.push(
            `intelligence_components[${index}] references a different athlete_id.`
          );
        }
      }
    );


    return {
      ok:
        errors.length === 0,

      errors
    };
  }


  /* ==========================================================
     COMPONENT ACCESS

     No intelligence is calculated here.
  ========================================================== */

  function getComponent(
    contract,
    domain
  ) {
    const key =
      upper(domain);

    return (
      contract
        ?.intelligence_components
        ?.find(
          component =>
            upper(component.domain) ===
            key
        ) ||
      null
    );
  }


  function componentValue(
    component,
    key,
    fallback = null
  ) {
    if (!component) {
      return fallback;
    }

    if (
      component.values &&
      Object.prototype.hasOwnProperty.call(
        component.values,
        key
      )
    ) {
      return component.values[key];
    }

    if (
      Object.prototype.hasOwnProperty.call(
        component,
        key
      )
    ) {
      return component[key];
    }

    return fallback;
  }


  /* ==========================================================
     REPORT CONTRACT MANUFACTURE

     This operation converts GOVERNED intelligence objects into
     a Stream 7 report-composition contract.

     It does NOT convert raw athlete data into intelligence.
  ========================================================== */

  function buildReportContract(input = {}) {
    const athlete =
      input.athlete || {};

    const crystal =
      input.crystal || null;

    const intelligenceComponents =
      Array.isArray(
        input.intelligence_components
      )
        ? clone(
            input.intelligence_components
          )
        : [];


    /*
      A governed Crystal object may itself be carried as one
      report component.
    */
    if (
      crystal?.ok &&
      !intelligenceComponents.some(
        item =>
          upper(item.domain) ===
          "CRYSTAL"
      )
    ) {
      intelligenceComponents.push({
        domain:
          "CRYSTAL",

        athlete_id:
          crystal.athlete_id,

        snapshot_id:
          crystal.snapshot_id,

        intelligence_authority:
          crystal.intelligence_authority,

        authority_version:
          crystal.authority_version,

        intelligence_receipt_id:
          crystal.intelligence_receipt_id,

        effective_at:
          crystal.effective_at,

        confidence:
          crystal.confidence,

        why:
          clone(
            crystal.why || []
          ),

        values: {
          match_score:
            crystal.match_score,

          match_level:
            crystal.match_level,

          ranking_position:
            crystal.ranking_position,

          program_id:
            crystal.program_id,

          program_name:
            crystal.program_name,

          pathway:
            clone(
              crystal.pathway || {}
            ),

          strengths:
            clone(
              crystal.strengths || []
            ),

          constraints:
            clone(
              crystal.constraints || []
            ),

          gaps:
            clone(
              crystal.gaps || []
            ),

          opportunities:
            clone(
              crystal.opportunities || []
            )
        }
      });
    }


    return {
      report_id:
        input.report_id ||
        generateId(),

      report_type:
        upper(
          input.report_type ||
          REPORT_TYPES.ATHLETE_INTELLIGENCE
        ),

      report_version:
        input.report_version ||
        "CRYSTAL-REPORT-V2",

      athlete_id:
        input.athlete_id ||
        athlete.athlete_id ||
        crystal?.athlete_id ||
        null,

      snapshot_id:
        input.snapshot_id ||
        athlete.snapshot_id ||
        crystal?.snapshot_id ||
        null,

      athlete: {
        athlete_display_name:
          athlete.athlete_display_name ||
          athlete.athlete_name ||
          [
            athlete.first_name,
            athlete.last_name
          ]
            .filter(Boolean)
            .join(" ") ||
          null,

        primary_sport:
          athlete.primary_sport ||
          athlete.sport ||
          null,

        primary_position:
          athlete.primary_position ||
          athlete.position ||
          null,

        graduation_class:
          athlete.graduation_class ||
          null,

        school_program:
          athlete.school_program ||
          athlete.school ||
          null
      },

      intelligence_components:
        intelligenceComponents,

      disclosure_scope:
        upper(
          input.disclosure_scope ||
          crystal?.disclosure?.scope ||
          DISCLOSURE_SCOPES.PRIVATE
        ),

      disclosure_authority_reference:
        input.disclosure_authority_reference ||
        crystal
          ?.disclosure
          ?.disclosure_authority_reference ||
        null,

      publication_safe:
        input.publication_safe === true,

      public_disclosure_authorized:
        input.public_disclosure_authorized === true,

      report_effective_at:
        input.report_effective_at ||
        null,

      composed_at:
        nowISO(),

      publication_state:
        "NOT_PUBLISHED",

      publication_receipt_id:
        null,

      locked:
        true
    };
  }


  /* ==========================================================
     HTML COMPONENTS
  ========================================================== */

  function createSection(title, body) {
    return `
      <section class="sc-crystal-section">
        <div class="sc-crystal-section-title">
          ${display(title)}
        </div>

        <div class="sc-crystal-section-body">
          ${body}
        </div>
      </section>
    `;
  }


  function createMetric(
    label,
    value,
    meta = ""
  ) {
    return `
      <div class="sc-crystal-metric">

        <div class="sc-crystal-metric-label">
          ${display(label)}
        </div>

        <div class="sc-crystal-metric-value">
          ${display(value)}
        </div>

        ${
          meta
            ? `
              <div class="sc-crystal-metric-meta">
                ${display(meta)}
              </div>
            `
            : ""
        }

      </div>
    `;
  }


  function emptyState(message) {
    return `
      <div class="sc-crystal-empty">
        ${display(message)}
      </div>
    `;
  }


  /* ==========================================================
     TRAIT INTELLIGENCE

     Traits are displayed exactly as governed upstream.
  ========================================================== */

  function buildTraitTable(
    traits = []
  ) {
    if (
      !Array.isArray(traits) ||
      !traits.length
    ) {
      return emptyState(
        "No governed trait intelligence is available for this report."
      );
    }


    return `
      <table class="sc-crystal-table">

        <thead>
          <tr>
            <th>Trait</th>
            <th>Result</th>
            <th>Status</th>
            <th>Evidence / Authority</th>
          </tr>
        </thead>

        <tbody>

          ${
            traits.map(
              trait => `
                <tr>
                  <td>
                    ${display(trait.name)}
                  </td>

                  <td>
                    ${display(
                      trait.value ??
                      trait.result
                    )}
                  </td>

                  <td>
                    ${display(
                      trait.status
                    )}
                  </td>

                  <td>
                    ${display(
                      trait.evidence_status ||
                      trait.scoring_source ||
                      trait.intelligence_reference ||
                      "N/A"
                    )}
                  </td>
                </tr>
              `
            ).join("")
          }

        </tbody>

      </table>
    `;
  }


  /* ==========================================================
     GOVERNED RECOMMENDATIONS

     Crystal renders recommendations.
     It does not create them.
  ========================================================== */

  function buildRecommendationList(
    recommendations = []
  ) {
    if (
      !Array.isArray(
        recommendations
      ) ||
      !recommendations.length
    ) {
      return emptyState(
        "No governed recommendations are available."
      );
    }


    return `
      <div class="sc-crystal-stack">

        ${
          recommendations.map(
            (item, index) => `

              <div class="sc-dev-card">

                <div class="sc-dev-priority">
                  ${
                    display(
                      item.priority ||
                      `PRIORITY ${index + 1}`
                    )
                  }
                </div>

                <div class="sc-dev-title">
                  ${display(
                    item.title ||
                    item.trait ||
                    item.category ||
                    "Recommendation"
                  )}
                </div>

                <div class="sc-dev-category">
                  ${display(
                    item.category ||
                    item.domain ||
                    "Governed Recommendation"
                  )}
                </div>

                <div class="sc-dev-body">
                  ${display(
                    item.recommendation ||
                    item.action ||
                    item.summary
                  )}
                </div>

                ${
                  item.why
                    ? `
                      <div class="sc-why">
                        <strong>WHY:</strong>
                        ${display(
                          Array.isArray(item.why)
                            ? item.why.join(" ")
                            : item.why
                        )}
                      </div>
                    `
                    : ""
                }

                ${
                  item.receipt_id
                    ? `
                      <div class="sc-reference">
                        Recommendation Receipt:
                        ${display(item.receipt_id)}
                      </div>
                    `
                    : ""
                }

              </div>
            `
          ).join("")
        }

      </div>
    `;
  }


  /* ==========================================================
     PATHWAY

     Preserve Athletic Ceiling != Current Reachable Pathway.
  ========================================================== */

  function buildPathwaySection(
    pathway = {}
  ) {
    if (
      !pathway ||
      typeof pathway !== "object" ||
      !Object.keys(pathway).length
    ) {
      return emptyState(
        "No governed Pathway Intelligence is available."
      );
    }


    const constraints =
      Array.isArray(
        pathway.blocking_constraints
      )
        ? pathway.blocking_constraints
        : [];


    const bridge =
      Array.isArray(
        pathway.bridge_requirements
      )
        ? pathway.bridge_requirements
        : [];


    const actions =
      Array.isArray(
        pathway.recommended_actions
      )
        ? pathway.recommended_actions
        : [];


    return `
      <div class="sc-pathway-summary">

        ${createMetric(
          "Athletic Ceiling",
          pathway.athletic_ceiling
        )}

        ${createMetric(
          "Current Reachable Pathway",
          pathway.current_reachable_pathway
        )}

        ${createMetric(
          "Target Pathway",
          pathway.target_pathway
        )}

      </div>


      <div class="sc-subsection">

        <div class="sc-subsection-title">
          Blocking Constraints
        </div>

        ${
          constraints.length
            ? `
              <ul class="sc-list">
                ${
                  constraints
                    .map(
                      item =>
                        `<li>${display(
                          typeof item === "string"
                            ? item
                            : item.summary ||
                              item.constraint ||
                              item.reason
                        )}</li>`
                    )
                    .join("")
                }
              </ul>
            `
            : emptyState(
                "No blocking constraints supplied."
              )
        }

      </div>


      <div class="sc-subsection">

        <div class="sc-subsection-title">
          Bridge Requirements
        </div>

        ${
          bridge.length
            ? `
              <ul class="sc-list">
                ${
                  bridge
                    .map(
                      item =>
                        `<li>${display(
                          typeof item === "string"
                            ? item
                            : item.summary ||
                              item.requirement
                        )}</li>`
                    )
                    .join("")
                }
              </ul>
            `
            : emptyState(
                "No bridge requirements supplied."
              )
        }

      </div>


      <div class="sc-subsection">

        <div class="sc-subsection-title">
          Governed Next Actions
        </div>

        ${
          buildRecommendationList(
            actions
          )
        }

      </div>


      ${
        pathway.pathway_receipt_id
          ? `
            <div class="sc-reference">
              Pathway Receipt:
              ${display(
                pathway.pathway_receipt_id
              )}
            </div>
          `
          : ""
      }
    `;
  }


  /* ==========================================================
     ELIGIBILITY / ACADEMIC

     Preserve rule-set/version lineage.
  ========================================================== */

  function buildEligibilitySection(
    component = null
  ) {
    if (!component) {
      return emptyState(
        "No governed Eligibility Intelligence is available."
      );
    }


    const corrections =
      componentValue(
        component,
        "correction_plan",
        []
      );


    const value =
      componentValue(
        component,
        "eligibility_status",
        componentValue(
          component,
          "eligibility_label",
          null
        )
      );


    return `
      <div class="sc-crystal-grid">

        ${createMetric(
          "Eligibility Status",
          value
        )}

        ${createMetric(
          "Authority",
          component.intelligence_authority
        )}

        ${createMetric(
          "Rule Set",
          component.rule_set
        )}

        ${createMetric(
          "Rule Version",
          component.rule_version
        )}

      </div>


      <div class="sc-subsection">

        <div class="sc-subsection-title">
          Correction / Recovery Actions
        </div>

        ${
          buildRecommendationList(
            Array.isArray(corrections)
              ? corrections
              : []
          )
        }

      </div>


      <div class="sc-reference">
        Intelligence Receipt:
        ${display(
          component.intelligence_receipt_id
        )}
        ${
          component.effective_at
            ? ` • Effective: ${display(
                formatTimestamp(
                  component.effective_at
                )
              )}`
            : ""
        }
      </div>
    `;
  }


  /* ==========================================================
     WHY / LINEAGE
  ========================================================== */

  function buildWhySection(
    contract
  ) {
    const items = [];


    contract.intelligence_components
      .forEach(
        component => {

          const why =
            Array.isArray(component.why)
              ? component.why
              : (
                  component.why
                    ? [component.why]
                    : []
                );


          why.forEach(
            statement => {
              items.push({
                domain:
                  component.domain,

                statement,

                authority:
                  component.intelligence_authority,

                receipt:
                  component.intelligence_receipt_id
              });
            }
          );
        }
      );


    if (!items.length) {
      return emptyState(
        "No governed WHY explanation was supplied."
      );
    }


    return `
      <div class="sc-crystal-stack">

        ${
          items.map(
            item => `
              <div class="sc-why-card">

                <div class="sc-why-domain">
                  ${display(item.domain)}
                </div>

                <div class="sc-why-text">
                  ${display(item.statement)}
                </div>

                <div class="sc-reference">
                  Authority:
                  ${display(item.authority)}
                  • Receipt:
                  ${display(item.receipt)}
                </div>

              </div>
            `
          ).join("")
        }

      </div>
    `;
  }


  function buildLineageTable(
    contract
  ) {
    if (
      !contract
        .intelligence_components
        .length
    ) {
      return emptyState(
        "No intelligence lineage available."
      );
    }


    return `
      <table class="sc-crystal-table">

        <thead>
          <tr>
            <th>Domain</th>
            <th>Authority</th>
            <th>Version</th>
            <th>Effective</th>
            <th>Receipt</th>
          </tr>
        </thead>

        <tbody>

          ${
            contract
              .intelligence_components
              .map(
                component => `
                  <tr>

                    <td>
                      ${display(
                        component.domain
                      )}
                    </td>

                    <td>
                      ${display(
                        component.intelligence_authority
                      )}
                    </td>

                    <td>
                      ${display(
                        component.authority_version ||
                        component.rule_version
                      )}
                    </td>

                    <td>
                      ${display(
                        component.effective_at
                          ? formatTimestamp(
                              component.effective_at
                            )
                          : "N/A"
                      )}
                    </td>

                    <td>
                      ${display(
                        component.intelligence_receipt_id
                      )}
                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>
    `;
  }


  /* ==========================================================
     ATHLETE HEADER
  ========================================================== */

  function athleteHeader(
    contract,
    athleticComponent,
    readinessComponent
  ) {
    const athlete =
      contract.athlete || {};


    const score =
      componentValue(
        athleticComponent,
        "score_final",
        componentValue(
          athleticComponent,
          "athletic_score",
          "N/A"
        )
      );


    const scoreLabel =
      componentValue(
        athleticComponent,
        "score_label",
        "Governed Athletic Result"
      );


    const readiness =
      componentValue(
        readinessComponent,
        "readiness_label",
        "N/A"
      );


    const archetype =
      componentValue(
        athleticComponent,
        "archetype",
        ""
      );


    return `
      <div class="sc-crystal-hero">

        <div class="sc-crystal-watermark">
          STATS-CORE™
        </div>

        <div class="sc-crystal-identity">

          <div class="sc-crystal-name">
            ${display(
              athlete.athlete_display_name,
              "Athlete"
            )}
          </div>

          <div class="sc-crystal-subline">
            ${display(
              athlete.primary_sport
            )}
            ·
            ${display(
              athlete.primary_position
            )}

            ${
              archetype
                ? ` · ${display(archetype)}`
                : ""
            }
          </div>

        </div>


        <div class="sc-crystal-score">

          <div class="sc-crystal-score-value">
            ${display(score)}
          </div>

          <div class="sc-crystal-score-label">
            ${display(scoreLabel)}
          </div>

          <div class="sc-crystal-score-readiness">
            ${display(readiness)}
          </div>

        </div>

      </div>
    `;
  }


  /* ==========================================================
     REPORT HTML
  ========================================================== */

  function buildAthleteReport(
    contract
  ) {
    const validation =
      validateReportContract(
        contract
      );


    if (!validation.ok) {
      return {
        ok: false,

        status:
          "INVALID_CRYSTAL_REPORT_CONTRACT",

        errors:
          validation.errors
      };
    }


    const athletic =
      getComponent(
        contract,
        "ATHLETIC"
      );


    const verification =
      getComponent(
        contract,
        "VERIFICATION"
      );


    const evidence =
      getComponent(
        contract,
        "EVIDENCE"
      );


    const readiness =
      getComponent(
        contract,
        "READINESS"
      );


    const development =
      getComponent(
        contract,
        "DEVELOPMENT"
      );


    const pathway =
      getComponent(
        contract,
        "PATHWAY"
      );


    const eligibility =
      getComponent(
        contract,
        "ELIGIBILITY"
      );


    const traits =
      componentValue(
        athletic,
        "traits",
        []
      );


    const recommendations =
      componentValue(
        development,
        "recommendations",
        componentValue(
          readiness,
          "development_plan",
          []
        )
      );


    const pathwayValue =
      componentValue(
        pathway,
        "pathway",
        pathway?.values || {}
      );


    const athleticMetric =
      componentValue(
        athletic,
        "score_final",
        componentValue(
          athletic,
          "athletic_score",
          "N/A"
        )
      );


    const verificationMetric =
      componentValue(
        verification,
        "confidence",
        verification?.confidence ||
        "N/A"
      );


    const evidenceMetric =
      componentValue(
        evidence,
        "evidence_sufficiency",
        componentValue(
          evidence,
          "evidence_strength",
          "N/A"
        )
      );


    const readinessMetric =
      componentValue(
        readiness,
        "readiness_label",
        componentValue(
          readiness,
          "readiness_result",
          "N/A"
        )
      );


    const pathwayMetric =
      pathwayValue
        ?.current_reachable_pathway ||
      "N/A";


    const eligibilityMetric =
      componentValue(
        eligibility,
        "eligibility_status",
        componentValue(
          eligibility,
          "eligibility_label",
          "N/A"
        )
      );


    const html = `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>
  STATS-CORE™ Crystal Report
</title>

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
  gap:20px;
  align-items:center;
  padding-bottom:18px;
  border-bottom:2px solid #ff3434;
}

.sc-crystal-brand{
  font-size:28px;
  font-weight:1000;
  letter-spacing:.16em;
}

.sc-crystal-report-type{
  color:#9fe7ff;
  font-size:12px;
  letter-spacing:.18em;
  text-transform:uppercase;
  text-align:right;
}

.sc-crystal-hero{
  position:relative;
  margin-top:28px;
  border:1px solid rgba(255,255,255,.1);
  background:
    linear-gradient(
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
  font-size:70px;
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
  grid-template-columns:
    repeat(auto-fit,minmax(190px,1fr));
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
  font-size:25px;
  font-weight:1000;
}

.sc-crystal-metric-meta{
  margin-top:6px;
  color:#7f8a99;
  font-size:10px;
  line-height:1.4;
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
  vertical-align:top;
}

.sc-crystal-stack{
  display:grid;
  gap:12px;
}

.sc-dev-card,
.sc-pathway-card,
.sc-why-card{
  border:1px solid rgba(255,255,255,.08);
  background:rgba(0,0,0,.22);
  padding:14px;
}

.sc-dev-priority,
.sc-why-domain{
  color:#ff3434;
  font-size:11px;
  letter-spacing:.12em;
  text-transform:uppercase;
  font-weight:1000;
}

.sc-dev-title{
  margin-top:6px;
  font-size:18px;
  font-weight:900;
}

.sc-dev-category{
  margin-top:4px;
  color:#9fe7ff;
  font-size:11px;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.sc-dev-body,
.sc-why-text{
  margin-top:10px;
  color:#d6deea;
  line-height:1.55;
  font-size:13px;
}

.sc-why{
  margin-top:10px;
  border-left:2px solid #46a8ff;
  padding-left:10px;
  color:#c8d8e8;
  font-size:12px;
  line-height:1.5;
}

.sc-reference{
  margin-top:10px;
  color:#7f8a99;
  font-size:10px;
  overflow-wrap:anywhere;
}

.sc-pathway-summary{
  display:grid;
  grid-template-columns:
    repeat(auto-fit,minmax(180px,1fr));
  gap:12px;
}

.sc-subsection{
  margin-top:20px;
}

.sc-subsection-title{
  margin-bottom:10px;
  color:#9fe7ff;
  font-size:11px;
  font-weight:900;
  letter-spacing:.12em;
  text-transform:uppercase;
}

.sc-list{
  margin:0;
  padding-left:20px;
  color:#d6deea;
  line-height:1.6;
  font-size:13px;
}

.sc-crystal-empty{
  color:#9ea7b5;
  font-size:13px;
}

.sc-crystal-doctrine{
  margin-top:28px;
  border-left:3px solid #ffb100;
  background:rgba(255,177,0,.06);
  padding:14px 16px;
  color:#f4e6b5;
  font-size:12px;
  line-height:1.55;
}

.sc-crystal-footer{
  margin-top:40px;
  border-top:1px solid rgba(255,255,255,.08);
  padding-top:18px;
  color:#7f8a99;
  font-size:11px;
  line-height:1.6;
}

@media(max-width:700px){

  .sc-crystal-shell{
    padding:18px;
  }

  .sc-crystal-topbar{
    display:block;
  }

  .sc-crystal-report-type{
    margin-top:8px;
    text-align:left;
  }

  .sc-crystal-name{
    font-size:32px;
  }

  .sc-crystal-score-value{
    font-size:48px;
  }

  .sc-crystal-table{
    font-size:11px;
  }

}

</style>

</head>


<body>

<div class="sc-crystal-shell">

  <div class="sc-crystal-topbar">

    <div class="sc-crystal-brand">
      STATS-CORE™
    </div>

    <div class="sc-crystal-report-type">
      Crystal Athlete Intelligence Publication
    </div>

  </div>


  ${athleteHeader(
    contract,
    athletic,
    readiness
  )}


  <div class="sc-crystal-grid">

    ${createMetric(
      "Athletic Intelligence",
      athleticMetric,
      athletic?.intelligence_authority || ""
    )}

    ${createMetric(
      "Verification / Confidence",
      verificationMetric,
      verification?.intelligence_authority || ""
    )}

    ${createMetric(
      "Evidence Sufficiency",
      evidenceMetric,
      evidence?.intelligence_authority || ""
    )}

    ${createMetric(
      "Readiness",
      readinessMetric,
      readiness?.intelligence_authority || ""
    )}

    ${createMetric(
      "Current Reachable Pathway",
      pathwayMetric,
      pathway?.intelligence_authority || ""
    )}

    ${createMetric(
      "Eligibility",
      eligibilityMetric,
      eligibility?.intelligence_authority || ""
    )}

  </div>


  ${createSection(
    "Athlete Intelligence Matrix",
    buildTraitTable(
      Array.isArray(traits)
        ? traits
        : []
    )
  )}


  ${createSection(
    "Development Intelligence & Recommendations",
    buildRecommendationList(
      Array.isArray(recommendations)
        ? recommendations
        : []
    )
  )}


  ${createSection(
    "College Pathway Intelligence",
    buildPathwaySection(
      pathwayValue || {}
    )
  )}


  ${createSection(
    "Eligibility Intelligence",
    buildEligibilitySection(
      eligibility
    )
  )}


  ${createSection(
    "WHY — Explainability",
    buildWhySection(
      contract
    )
  )}


  ${createSection(
    "Intelligence Authority & Receipt Lineage",
    buildLineageTable(
      contract
    )
  )}


  <div class="sc-crystal-doctrine">
    This Crystal Report publishes governed intelligence.
    It does not calculate Athletic Score, STATScore, Confidence,
    Development Intelligence, Eligibility, Pathway, Match Intelligence,
    ranking, or recruiting status. Historical athlete state remains
    snapshot-bound and auditable.
  </div>


  <div class="sc-crystal-footer">

    Report ID:
    ${display(contract.report_id)}

    <br>

    Athlete ID:
    ${display(contract.athlete_id)}

    <br>

    Snapshot ID:
    ${display(contract.snapshot_id)}

    <br>

    Intelligence Effective At:
    ${display(
      contract.report_effective_at
        ? formatTimestamp(
            contract.report_effective_at
          )
        : "See component lineage"
    )}

    <br>

    Report Composed At:
    ${display(
      formatTimestamp(
        contract.composed_at
      )
    )}

    <br>

    Disclosure Scope:
    ${display(
      contract.disclosure_scope
    )}

    <br>

    Publication State:
    ${display(
      contract.publication_state
    )}

    <br>

    Publication Receipt:
    ${display(
      contract.publication_receipt_id
    )}

    <br><br>

    STATS-CORE™ Crystal Reports are governed publication artifacts.
    Every material intelligence statement must remain traceable to
    its governing authority, version, evidence/intelligence lineage,
    effective state, and receipt.

  </div>

</div>

</body>
</html>
    `;


    return {
      ok: true,
      html
    };
  }


  /* ==========================================================
     GOVERNED REPORT GENERATION
  ========================================================== */

  function generateAthleteCrystalReport(
    input = {}
  ) {
    /*
      Accept either:
      1. an already-built report contract; or
      2. governed input from which Stream 7 may build one.
    */

    const contract =
      (
        input.report_id &&
        Array.isArray(
          input.intelligence_components
        )
      )
        ? clone(input)
        : buildReportContract(input);


    const validation =
      validateReportContract(
        contract
      );


    if (!validation.ok) {
      warn(
        "Crystal Report contract rejected.",
        validation.errors
      );

      return {
        ok: false,

        status:
          "INVALID_CRYSTAL_REPORT_CONTRACT",

        errors:
          validation.errors
      };
    }


    const rendered =
      buildAthleteReport(
        contract
      );


    if (!rendered.ok) {
      return rendered;
    }


    const result = {
      ok: true,

      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      type:
        "ATHLETE_CRYSTAL_REPORT",

      report_id:
        contract.report_id,

      athlete_id:
        contract.athlete_id,

      snapshot_id:
        contract.snapshot_id,

      disclosure_scope:
        contract.disclosure_scope,

      publication_state:
        contract.publication_state,

      publication_receipt_id:
        contract.publication_receipt_id,

      report_contract:
        contract,

      html:
        rendered.html,

      composed_at:
        contract.composed_at,

      locked:
        true
    };


    window.STATScoreCurrentCrystalReport =
      result;

    /*
      Compatibility only.
    */
    window.STATScoreCurrentCrystalReportHTML =
      result.html;


    return result;
  }


  /* ==========================================================
     LEGACY CURRENT-DATA GATHERING

     Previous implementation gathered arbitrary loose global
     intelligence. That behavior is no longer lawful.

     This function now looks only for a governed report contract
     or governed Crystal report input.
  ========================================================== */

  function gatherCurrentData() {
    return (
      window.STATScoreCurrentCrystalReportContract ||
      window.__STATSCORE_CRYSTAL_REPORT_CONTRACT__ ||
      window.STATScoreCurrentGovernedCrystalInput ||
      null
    );
  }


  /* ==========================================================
     REPORT WINDOW
  ========================================================== */

  function openCrystalReport(html) {
    const reportWindow =
      window.open(
        "",
        "_blank"
      );


    if (!reportWindow) {
      warn(
        "Crystal Report popup blocked."
      );

      return false;
    }


    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();

    return true;
  }


  function openAthleteCrystalReport(
    input = null
  ) {
    const governedInput =
      input ||
      gatherCurrentData();


    if (!governedInput) {
      warn(
        "No governed Crystal Report contract is available."
      );

      return {
        ok: false,

        status:
          "GOVERNED_CRYSTAL_REPORT_CONTRACT_REQUIRED",

        message:
          "Crystal Reports will not reconstruct intelligence from loose global athlete state."
      };
    }


    const result =
      generateAthleteCrystalReport(
        governedInput
      );


    if (!result?.ok) {
      warn(
        "Crystal Report generation failed.",
        result
      );

      return result;
    }


    openCrystalReport(
      result.html
    );


    return result;
  }


  /* ==========================================================
     PUBLICATION HANDOFF

     This prepares the report for the Stream 7 publication
     lifecycle.

     It does NOT itself claim PUBLISHED state.
  ========================================================== */

  function buildPublicationHandoff(
    report
  ) {
    if (!report?.ok) {
      return {
        ok: false,

        status:
          "VALID_CRYSTAL_REPORT_REQUIRED"
      };
    }


    return {
      ok: true,

      publication_type:
        "CRYSTAL_REPORT",

      report_id:
        report.report_id,

      athlete_id:
        report.athlete_id,

      snapshot_id:
        report.snapshot_id,

      disclosure_scope:
        report.disclosure_scope,

      report_version:
        VERSION,

      publication_state:
        "DRAFT",

      publication_authorized:
        false,

      source_receipts:
        report
          .report_contract
          .intelligence_components
          .map(
            component =>
              component
                .intelligence_receipt_id
          )
          .filter(Boolean),

      composed_at:
        report.composed_at,

      doctrine: {
        report_generated_is_not_published:
          true,

        publication_receipt_required_for_published_state:
          true
      }
    };
  }


  /* ==========================================================
     INITIALIZATION
  ========================================================== */

  function init() {
    if (
      window
        .__STATSCORE_CRYSTAL_REPORT_ENGINE__
    ) {
      warn(
        "Duplicate initialization blocked."
      );

      return;
    }


    window
      .__STATSCORE_CRYSTAL_REPORT_ENGINE__ =
      true;


    window.STATScoreCrystalReportEngine = {
      engine_id:
        ENGINE_ID,

      version:
        VERSION,

      REPORT_TYPES,
      DISCLOSURE_SCOPES,

      validateReportContract,
      buildReportContract,

      getComponent,
      componentValue,

      buildAthleteReport,
      generateAthleteCrystalReport,

      gatherCurrentData,

      openCrystalReport,
      openAthleteCrystalReport,

      buildPublicationHandoff
    };


    window.STATScore =
      window.STATScore ||
      {};


    window.STATScore.CrystalReportEngine =
      window.STATScoreCrystalReportEngine;


    if (
      window.STATScoreEngineBus?.emit
    ) {
      window.STATScoreEngineBus.emit(
        "engine_online",
        {
          engine:
            ENGINE_ID,

          version:
            VERSION,

          status:
            "ONLINE",

          authority_class:
            "STREAM_7_CRYSTAL_REPORT_PUBLICATION"
        }
      );
    }


    log(
      "Governed Crystal Report Engine online.",
      {
        engine:
          ENGINE_ID,

        version:
          VERSION
      }
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})(); 
