STATS-CORE™ Engine Registry

Purpose

This document defines the official registry of STATS-CORE engines, matrices, runtimes, loaders, governance files, and intelligence modules.

Every JavaScript file must have:

- One owner
- One purpose
- One responsibility boundary
- Known consumers
- Known outputs
- No unauthorized Stream contamination

---

Registry Doctrine

Engines produce intelligence.

Pages render intelligence.

Runtime coordinates intelligence.

No page may become an engine.

No engine may become a page.

No Stream may modify another Stream’s engine without ownership review.

---

Engine Status Labels

Status| Meaning
LOCKED| Canon-approved and operational
ACTIVE| In use and functioning
BETA| Works but requires stabilization
REVIEW| Needs audit before modification
PLANNED| Intended but not finalized
DEPRECATED| Must not be extended

---

Master Integration Engines

Engine| Owner| Purpose| Status
statscore-core.js| Master Integration| Core runtime support| ACTIVE
statscore-data.js| Master Integration| Supabase/data access| ACTIVE
statscore-routing.js| Master Integration| Route preservation and navigation| ACTIVE
statscore-system-map.js| Master Integration| System authority map| ACTIVE
statscore-page-map.js| Master Integration| Page authority map| ACTIVE
statscore-dashboard-map.js| Master Integration| Dashboard route map| ACTIVE
statscore-engine-registry.js| Master Integration| Runtime engine registry| ACTIVE
statscore-engine-execution.js| Master Integration| Engine execution layer| ACTIVE
statscore-engine-loader.js| Master Integration| Engine loading| ACTIVE

---

Stream 3 — Athlete Intelligence Engines

Engine| Purpose| Status
statscore-athlete-dashboard-engine.js| Athlete Dashboard rendering and intelligence consumption| ACTIVE
statscore-production-engine.js| Production intelligence support| ACTIVE
statscore-production-router.js| Production route/context handling| ACTIVE
statscore-athlete-production-record.js| Production record page behavior| ACTIVE
statscore-production-matrix.js| Production scoring matrix| REVIEW
statscore-academic-matrix.js| Academic scoring/intelligence matrix| REVIEW
statscore-eligibility-engine.js| Eligibility intelligence| ACTIVE
statscore-pathway-engine.js| Pathway intelligence| ACTIVE
statscore-recommendation-engine.js| Recommendation intelligence| ACTIVE
statscore-explainability-engine.js| Explainability outputs| ACTIVE
statscore-football-scoring-engine.js| Football scoring science| REVIEW
statscore-position-matrix-engine.js| Position matrix support| REVIEW
statscore-trait-render-engine.js| Trait rendering support| ACTIVE
statscore-scoring-engine.js| General scoring engine| REVIEW
statscore-synthesis-engine.js| Intelligence synthesis| REVIEW
statscore-consensus-engine.js| Consensus intelligence| REVIEW
statscore-intelligence.js| Intelligence coordination| REVIEW
statscore-profile-engine.js| Profile intelligence support| ACTIVE
statscore-media-intelligence-engine.js| Athlete media intelligence| ACTIVE
statscore-memory-engine.js| Memory/context support| REVIEW

---

Stream 6 — Communication Governance Engines

Engine| Purpose| Status
statscore-communication-engine.js| Messaging and communication context| ACTIVE
statscore-compliance-engine.js| Compliance checks| ACTIVE
sc-multi-box-governance-engine.js| Multi-Box governance| ACTIVE
sc-receipt-ledger-engine.js| Receipt ledger support| ACTIVE

---

Stream 7 — Crystal / Exposure / Media Engines

Engine| Purpose| Status
statscore-crystal-engine.js| Crystal intelligence preparation| ACTIVE
statscore-crystal-reports.js| Crystal report generation| ACTIVE
sc-crystal-reports-engine.js| Crystal report engine support| REVIEW
statscore-media-routing.js| Media routing| ACTIVE
statscore-recruiting-interest-registry.js| Recruiting interest registry| ACTIVE

---

Stream 8 — System Operations Engines

Engine| Purpose| Status
statscore-engine-health.js| Engine health monitoring| ACTIVE
sc-engine-health.js| Legacy/current health engine support| REVIEW
statscore-system-operations-map.js| System operations map| ACTIVE
statscore-self-healing-engine.js| Self-healing support| PLANNED
sc-runtime-integration-test-pack.js| Runtime integration testing| ACTIVE
sc-governance-sync-engine.js| Governance synchronization| ACTIVE

---

Stream 4 / 5 — Role Context Engines

Engine| Purpose| Status
statscore-role-access.js| Role access permissions| ACTIVE
statscore-evaluator-engine.js| Evaluator workspace support| ACTIVE
sc-recruiter-verification-engine.js| Recruiter verification support| ACTIVE
sc-program-intelligence-engine.js| Program intelligence support| ACTIVE

---

Scoring Governance / Doctrine Files

File| Purpose| Status
statscore-stream-9-authority.js| Scoring authority doctrine file currently used as governance layer| REVIEW
statscore-intelligence-doctrine.js| Intelligence doctrine| ACTIVE
statscore-score-doctrine.js| Score doctrine| ACTIVE
statscore-matrix-doctrine.js| Matrix doctrine| ACTIVE
statscore-matrix-registry.js| Matrix registry| ACTIVE

Note:

These files shall not be injected into live operational pages without an approved adapter or integration plan.

---

Engine Modification Rule

Before modifying any engine:

1. Confirm the engine exists.
2. Confirm the owner Stream.
3. Confirm the page or engine that consumes it.
4. Confirm whether the change belongs to this engine.
5. Confirm no existing engine already owns the proposed responsibility.
6. Update this registry if ownership, purpose, or status changes.

---

Forbidden Engine Behavior

An engine may not:

- Render page layout
- Own HTML structure
- Modify unrelated Streams
- Duplicate another engine
- Bypass Runtime State
- Bypass Engine Registry
- Create hidden scoring logic
- Inject Stream-specific behavior into another Stream’s domain

---

Required Ownership Header

Every engine must eventually include a non-rendered ownership header:

/*
STATS-CORE FILE OWNERSHIP LOCK
File:
Type:
Owner Stream:
Secondary Authority:
Purpose:
Allowed To Consume:
Produces:
Not Allowed To Own:
Dependencies:
Modification Rule:
Status:
*/

---

Final Rule

If an engine is not listed in this registry, it must not be modified until it is assigned an owner and purpose. 
