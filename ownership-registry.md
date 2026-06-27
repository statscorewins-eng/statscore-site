# STATS-CORE™ Ownership Registry

Status: ACTIVE 
Purpose: Master quick-reference for file ownership before inserting ownership headers.

---

## Rule

If a file is listed here, its ownership header must match this registry.

If a file is not listed here, do not modify it until ownership is assigned.

---

# HTML PAGE OWNERSHIP

## Stream 1 — Public Access / Login

| File | Layer | Purpose |
|---|---|---|
| index.html | Presentation | Public entry |
| login.html | Presentation | Login / routing |
| privacy.html | Presentation | Privacy |
| terms.html | Presentation | Terms |
| access-approved.html | Presentation | Access confirmation |

---

## Stream 2 — Athlete Source Record

| File | Layer | Purpose |
|---|---|---|
| snapshot-intake.html | Presentation | Athlete snapshot/source intake |
| parent-approval.html | Presentation | Guardian approval |
| verification-request.html | Presentation | Verification request |

---

## Stream 3 — Athlete Intelligence

| File | Layer | Purpose |
|---|---|---|
| athlete-dashboard.html | Presentation | Athlete dashboard |
| player-profile.html | Presentation | Explainable athlete profile |
| athlete-production-record.html | Presentation | Production record / season ledger |
| athletic-snapshot.html | Presentation | Athletic snapshot display |
| eligibility.html | Presentation | Eligibility display |
| readiness.html | Presentation | Readiness display |
| college-pathway.html | Presentation | Pathway display |
| rankings.html | Presentation | Rankings display |
| profile-access.html | Presentation | Profile access settings |
| verification.html | Presentation | Verification display |

---

## Stream 4 — Role Intake

| File | Layer | Purpose |
|---|---|---|
| role-dashboard-intake.html | Presentation | Non-athlete role intake |
| recruiter-intake.html | Presentation | Recruiter intake legacy/reference |

---

## Stream 5 — Shared Role Dashboard / CRM

| File | Layer | Purpose |
|---|---|---|
| role-dashboard.html | Presentation | Shared role dashboard |
| parent.html | Presentation | Parent workspace |
| parent-dashboard.html | Presentation | Parent dashboard legacy/reference |
| parent-notices.html | Presentation | Parent notices |
| coach.html | Presentation | Coach workspace |
| counselor.html | Presentation | Counselor workspace |
| counselor-access.html | Presentation | Counselor access |
| evaluator.html | Presentation | Evaluator workspace |
| program.html | Presentation | Program workspace |
| recruiter-access.html | Presentation | Recruiter workspace |
| recruiter-request.html | Presentation | Recruiter request |

---

## Stream 6 — Communication / Governance

| File | Layer | Purpose |
|---|---|---|
| multi-box.html | Presentation | Governed communication |
| message-windows.html | Presentation | Message permissions |
| audit-trail.html | Presentation | Audit trail |
| visibility-rules.html | Presentation | Visibility rules |

---

## Stream 7 — Crystal / Exposure / Media

| File | Layer | Purpose |
|---|---|---|
| crystal-report.html | Presentation | Crystal report |
| crystal-registry.html | Presentation | Crystal registry |
| media.html | Presentation | Media surface |
| events.html | Presentation | Events / exposure surface |

---

## Stream 8 — System Operations

| File | Layer | Purpose |
|---|---|---|
| system.html | Presentation | System operations |

---

# JAVASCRIPT OWNERSHIP

## Master Integration

| File | Layer | Purpose |
|---|---|---|
| statscore-core.js | Core | Core runtime support |
| statscore-data.js | Core | Supabase/data access |
| statscore-routing.js | Core | Routing |
| statscore-system-map.js | Core | System map |
| statscore-page-map.js | Core | Page map |
| statscore-dashboard-map.js | Core | Dashboard map |
| statscore-engine-registry.js | Core | Engine registry |
| statscore-engine-execution.js | Core | Engine execution |
| statscore-engine-loader.js | Core | Engine loading |
| statscore-engine-bus.js | Core | Engine bus |
| statscore-runtime-state-engine.js | Core | Runtime state |
| statscore-state-engine.js | Core | State engine |

---

## Stream 2 — Athlete Source Record

| File | Layer | Purpose |
|---|---|---|
| statscore-snapshot-intake-engine.js | Engine | Snapshot intake |
| statscore-parent-approval-engine.js | Engine | Parent approval |

---

## Stream 3 — Athlete Intelligence

| File | Layer | Purpose |
|---|---|---|
| statscore-athlete-dashboard-engine.js | Runtime | Athlete dashboard runtime |
| statscore-player-profile-runtime.js | Runtime | Player profile runtime |
| statscore-athlete-production-record.js | Runtime | Production record runtime |
| statscore-production-engine.js | Engine | Production intelligence |
| statscore-production-router.js | Runtime | Production routing |
| statscore-production-matrix.js | Matrix | Production matrix |
| statscore-academic-matrix.js | Matrix | Academic matrix |
| statscore-eligibility-engine.js | Engine | Eligibility |
| statscore-readiness-engine.js | Engine | Readiness |
| statscore-pathway-engine.js | Engine | Pathway |
| statscore-pathway-intelligence-engine.js | Engine | Pathway intelligence |
| statscore-recommendation-engine.js | Engine | Recommendations |
| statscore-explainability-engine.js | Engine | Explainability |
| statscore-intelligence.js | Engine | Intelligence coordination |
| statscore-intelligence-explainer-engine.js | Engine | Intelligence explanation |
| statscore-profile-engine.js | Engine | Profile intelligence |
| statscore-football-scoring-engine.js | Engine | Football scoring |
| statscore-position-matrix-engine.js | Matrix | Position matrix |
| statscore-trait-render-engine.js | Runtime | Trait rendering |
| statscore-scoring-engine.js | Engine | Scoring |
| statscore-score-authority-engine.js | Engine | Score authority |
| statscore-synthesis-engine.js | Engine | Synthesis |
| statscore-consensus-engine.js | Engine | Consensus |
| statscore-evidence-engine.js | Engine | Evidence |
| statscore-verification-engine.js | Engine | Verification |
| statscore-verification-authority-engine.js | Engine | Verification authority |
| statscore-ncaa-eligibility-intelligence-engine.js | Engine | NCAA eligibility |
| statscore-quarterly-eligibility-engine.js | Engine | Quarterly eligibility |
| statscore-phnx-ranking-engine.js | Engine | PHNX ranking |

---

## Stream 4 — Role Intake

| File | Layer | Purpose |
|---|---|---|
| statscore-role-dashboard-intake-engine.js | Engine | Role dashboard intake |
| statscore-role-intake-core.js | Engine | Role intake core |
| statscore-recruiter-intake-engine.js | Engine | Recruiter intake |

---

## Stream 5 — Role Dashboard / CRM

| File | Layer | Purpose |
|---|---|---|
| statscore-role-access.js | Engine | Role access |
| statscore-evaluator-engine.js | Engine | Evaluator support |
| statscore-program-intelligence-engine.js | Engine | Program intelligence |
| statscore-recruiter-verification-engine.js | Engine | Recruiter verification |
| statscore-athlete-search-engine.js | Engine | Athlete search |

---

## Stream 6 — Communication / Governance

| File | Layer | Purpose |
|---|---|---|
| statscore-communication-engine.js | Engine | Communication |
| statscore-multi-box-governance-engine.js | Engine | Multi-Box governance |
| statscore-compliance-engine.js | Engine | Compliance |
| statscore-receipt-ledger-engine.js | Engine | Receipts |
| statscore-signal-governance.js | Engine | Signal governance |
| statscore-governance-sync-engine.js | Engine | Governance sync |

---

## Stream 7 — Crystal / Exposure / Media

| File | Layer | Purpose |
|---|---|---|
| statscore-crystal-engine.js | Engine | Crystal intelligence |
| statscore-crystal-reports.js | Engine | Crystal reports |
| statscore-media-routing.js | Engine | Media routing |
| statscore-media-intelligence-engine.js | Engine | Media intelligence |
| statscore-recruiting-interest-registry.js | Engine | Recruiting interest registry |
| statscore-event-engine.js | Engine | Events |
| statscore-camp-combine-intelligence-engine.js | Engine | Camp/combine intelligence |

---

## Stream 8 — System Operations

| File | Layer | Purpose |
|---|---|---|
| statscore-engine-health.js | Engine | Engine health |
| statscore-self-healing-engine.js | Engine | Self-healing |
| statscore-system-operations-map.js | Engine | Operations map |
| statscore-runtime-integration-test-pack.js | Testing | Runtime integration tests |

---

## Stream 9 — Composite Intelligence / Scoring Authority

| File | Layer | Purpose |
|---|---|---|
| statscore-composite-intelligence-center.js | Engine | Composite intelligence center |
| statscore-intelligence-layer-registry.js | Registry | Intelligence layer registry |
| statscore-intelligence-doctrine.js | Governance | Intelligence doctrine |
| statscore-score-doctrine.js | Governance | Score doctrine |
| statscore-matrix-doctrine.js | Governance | Matrix doctrine |
| statscore-matrix-registry.js | Registry | Matrix registry |
| statscore-stream-9-authority.js | Governance | Stream 9 authority |
| statscore-memory-engine.js | Engine | Memory/context support |

---

# OWNERSHIP HEADER IMPLEMENTATION ORDER

1. Governance `.md` files
2. Master Integration JS
3. Stream 8 operations files
4. Stream 3 athlete intelligence pages
5. Stream 3 athlete intelligence engines
6. Stream 2 source/intake files
7. Stream 4/5 role files
8. Stream 6 communication files
9. Stream 7 Crystal/media files
10. Stream 9 composite/scoring authority files

---

# Final Rule

This registry controls the ownership headers.

Do not add ownership headers randomly.

Do not guess ownership.

Use this document first. 
