STATS-CORE™

National Athlete Decision Intelligence Infrastructure

STATS-CORE™ is an athlete lifecycle intelligence system built to protect athlete opportunity through verified production records, explainable scoring, readiness intelligence, eligibility awareness, governed communication, and evidence-based pathway support.

STATS-CORE is not a recruiting website.

STATS-CORE is not a statistics website.

STATS-CORE is not a social platform.

STATS-CORE is an explainable athlete decision intelligence platform.

---

Core Mission

STATS-CORE exists to answer:

- What has the athlete actually produced?
- What evidence supports it?
- What is verified?
- What is missing?
- What risks exist?
- What opportunities exist?
- What should happen next?
- Which role is responsible?

---

Constitutional Governance

Before modifying this repository, read:

statscore-canon-lock.md

That file is the constitutional authority for this system.

All pages, engines, streams, runtime components, database structures, and future contributors must comply with the canon.

---

Core Architecture

STATS-CORE follows this hierarchy:

Database
↓
Engines
↓
Runtime State
↓
Pages
↓
User

Pages render.

Engines calculate.

Runtime coordinates.

Database stores.

No page should independently calculate athlete intelligence.

---

Primary Identifiers

STATS-CORE depends on stable identifiers:

athlete_id
snapshot_id
role_id
recruiter_id
program_id
evaluator_id

The most important operational identifier for athlete intelligence flow is:

snapshot_id

Every athlete intelligence page must preserve "snapshot_id".

---

Core Athlete Flow

index.html
↓
login.html
↓
snapshot-intake.html
↓
athlete-dashboard.html
↓
player-profile.html
↓
athlete-production-record.html
↓
crystal-report.html

---

Role Flow

login.html
↓
role-dashboard-intake.html
↓
role-dashboard.html
↓
role-specific workspaces

---

Major System Areas

- Athlete Source Record
- Snapshot Intake
- Athlete Dashboard
- Player Profile
- Athlete Production Record
- Academic Intelligence
- Eligibility Intelligence
- Readiness Intelligence
- Pathway Intelligence
- Crystal Reports
- Multi-Box™ Communication
- Role Dashboards
- System Operations
- Engine Registry
- Runtime State
- Self-Healing / Diagnostics

---

Development Doctrine

HTML = Shell / Layout
Runtime JS = Page Behavior
Engine JS = Business Logic / Intelligence
Supabase = Data Persistence
System Map = Page Authority
Engine Registry = Engine Authority
Runtime State = Current User / Snapshot / Role Context

---

Non-Negotiable Rules

- Do not duplicate pages.
- Do not duplicate engines.
- Do not hardcode athlete data.
- Do not bypass "snapshot_id".
- Do not calculate intelligence inside dashboard pages.
- Do not calculate intelligence inside profile pages.
- Do not add new scripts to operational pages without review.
- Do not change Stream ownership without updating canon.
- Do not create new files without checking whether they already exist.
- Always preserve the constitutional architecture.

---

Required Governance Documents

This repository should maintain the following governance files:

statscore-canon-lock.md
README.md
statscore-system-map.md
statscore-engine-registry.md
statscore-data-dictionary.md
statscore-stream-charters.md
statscore-page-lifecycle.md
statscore-intelligence-architecture.md
statscore-scoring-architecture.md
statscore-development-standard.md

---

Project Status

STATS-CORE is under active development.

Current priority:

Stabilize end-to-end rendering.
Preserve routing.
Preserve snapshot_id.
Centralize intelligence.
Prevent architectural drift.

---

Final Principle

STATS-CORE must remain governed.

Every page must have one job.

Every engine must have one authority.

Every Stream must respect its boundary.

Every future change must strengthen the system, not create drift. 
