# STATS-CORE™
# SYSTEM MAP
### Canonical Architecture & Navigation

Version: 1.0
Status: LOCKED
Authority: STATS-CORE Canon

---

# PURPOSE

The System Map defines the complete architecture of STATS-CORE.

It explains how pages,
engines,
runtimes,
databases,
roles,
and intelligence move through the system.

This document is the highest-level architectural reference.

---

# CORE PHILOSOPHY

STATS-CORE is NOT a website.

STATS-CORE is an Athlete Intelligence Platform.

HTML presents intelligence.

JavaScript creates intelligence.

Supabase stores intelligence.

---

# SYSTEM STACK

Presentation Layer

↓

Runtime Layer

↓

Engine Layer

↓

Database Layer

↓

Intelligence Layer

↓

Rendering Layer

---

# PRESENTATION LAYER

Contains HTML pages only.

Examples

index.html

login.html

athlete-dashboard.html

player-profile.html

role-dashboard.html

system.html

Responsibilities

Display

Navigation

User interaction

Never

Business logic

Scoring

Database intelligence

---

# RUNTIME LAYER

Purpose

Coordinate pages with engines.

Responsibilities

Load snapshot_id

Load role

Initialize page

Call engines

Update UI

Never

Own intelligence.

---

# ENGINE LAYER

Purpose

Generate intelligence.

Examples

Scoring

Production

Eligibility

Readiness

Recommendation

Consensus

Pathway

Academic

Explainability

Crystal

Memory

Competition Intelligence

---

# DATABASE LAYER

Supabase

Stores

Snapshots

Production

Roles

Messages

Guardian approvals

Crystal records

Verification

Audit logs

Never

Render pages.

---

# ATHLETE FLOW

Public

↓

Login

↓

Snapshot Intake

↓

Athlete Dashboard

↓

Player Profile

↓

Production Record

↓

Eligibility

↓

Readiness

↓

Crystal

↓

Recruiter Visibility

---

# ROLE FLOW

Login

↓

Role Intake

↓

Role Dashboard

↓

Role Workspace

↓

Athlete Intelligence

↓

Communication

---

# ADMIN FLOW

Login

↓

System

↓

Engine Health

↓

Registry

↓

Operations

↓

Governance

---

# ENGINE EXECUTION

Page

↓

Runtime

↓

Engine Registry

↓

Required Engines

↓

Database

↓

Intelligence

↓

Render

---

# GOLDEN RULE

Presentation never owns intelligence.

Runtime never owns business logic.

Engine never owns presentation.

Database never owns calculations.

---

# PRIMARY IDENTIFIERS

athlete_id

Permanent athlete identity.

snapshot_id

Current athlete intelligence.

role_id

Permanent professional identity.

role

Current logged-in role.

production_record_id

Season production identity.

message_id

Communication identity.

crystal_id

Crystal identity.

---

# INTELLIGENCE PIPELINE

Production

↓

Academic

↓

Eligibility

↓

Development

↓

Readiness

↓

Competition

↓

Composite Intelligence

↓

Recommendations

↓

Crystal

↓

Dashboard

---

# SYSTEM AUTHORITY

Canon Lock

↓

Stream Registry

↓

Page Registry

↓

Engine Registry

↓

System Map

↓

Source Code

---

END OF SYSTEM MAP

STATS-CORE CANON 
