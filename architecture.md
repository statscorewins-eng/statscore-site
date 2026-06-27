# STATS-CORE™ Architecture
### Constitutional System Architecture & Runtime Standard

**Document Name:** `ARCHITECTURE.md`

**Classification:** LEVEL 1 GOVERNANCE DOCUMENT

**Authority:** STATS-CORE Constitutional Standard

**Priority:** HIGHEST

**Status:** LOCKED

**Version:** 1.0

---

# PURPOSE

This document defines the permanent architecture of the STATS-CORE™ platform.

It establishes:

- System layers
- Runtime responsibilities
- Engine responsibilities
- Page ownership
- Stream ownership
- Data flow
- Intelligence flow

This architecture may not be modified without constitutional approval.

---

# CORE PHILOSOPHY

STATS-CORE is not a website.

STATS-CORE is an Athlete Decision Intelligence System.

The website is simply the interface.

The intelligence lives inside the engines.

---

# SYSTEM LAYERS

Layer 1

User Interface

HTML

Purpose

Visual shell only.

HTML does not perform intelligence.

---

Layer 2

Runtime

Page JavaScript

Purpose

Controls page behavior.

Loads data.

Calls engines.

Updates interface.

---

Layer 3

Business Intelligence

Engine JavaScript

Purpose

Produces intelligence.

Scores athletes.

Calculates rankings.

Creates recommendations.

Generates explainability.

No UI logic belongs here.

---

Layer 4

Governance

Doctrine

Routing

Registry

Audit

Purpose

Controls system behavior.

Defines authority.

Protects architecture.

---

Layer 5

Database

Supabase

Purpose

Permanent storage.

No business intelligence belongs inside the database.

---

# ARCHITECTURE

```
Browser

↓

HTML Shell

↓

Runtime JS

↓

Engine Registry

↓

Business Engines

↓

Supabase

↓

Runtime

↓

HTML
```

---

# HTML RESPONSIBILITIES

HTML pages are responsible for:

• Layout

• Forms

• Containers

• Navigation

• User interaction

Nothing more.

HTML never calculates intelligence.

---

# RUNTIME RESPONSIBILITIES

Runtime controls:

Loading

Saving

Rendering

Refreshing

Routing

Calling engines

Updating components

Runtime never owns intelligence.

---

# ENGINE RESPONSIBILITIES

Engines own:

Scoring

Rankings

Recommendations

Risk

Pathways

Explainability

Confidence

Composite Intelligence

Eligibility

Development

Academic Intelligence

Production Intelligence

Exposure Intelligence

Communication Intelligence

Only engines may calculate intelligence.

---

# DATABASE RESPONSIBILITIES

Supabase owns:

Athletes

Snapshots

Production

Academic records

Media

Roles

Audit

Communication

Verification

No page should perform permanent storage.

---

# PAGE OWNERSHIP

Public Pages

Login

Access

Privacy

Terms

---

Athlete Pages

Snapshot Intake

Athlete Dashboard

Player Profile

Athletic Snapshot

Production Record

Eligibility

Verification

Crystal

---

Role Pages

Parent

Coach

Counselor

Recruiter

Evaluator

Program

Dashboard

---

Administrative Pages

System

Audit

Governance

Operations

---

# ENGINE OWNERSHIP

Examples

Production Engine

Academic Engine

Eligibility Engine

Crystal Engine

Communication Engine

Pathway Engine

Composite Intelligence

Consensus Engine

Explainability Engine

Governance Engine

Engine Registry

Engine Loader

Routing

Runtime State

Self Healing

---

# STREAM RESPONSIBILITIES

Stream 1

Public Access

---

Stream 2

Athlete Source Record

---

Stream 3

Athlete Intelligence

---

Stream 4

Role Intake

---

Stream 5

Role Dashboard

---

Stream 6

Communication

---

Stream 7

Crystal

---

Stream 8

Operations

---

Stream 9

Composite Intelligence

---

Master Integration

Owns connections between every stream.

Never duplicates stream responsibilities.

---

# DATA FLOW

Athlete

↓

Snapshot Intake

↓

Snapshot ID

↓

Production

↓

Academic

↓

Eligibility

↓

Development

↓

Composite Intelligence

↓

Dashboard

↓

Player Profile

↓

Crystal

---

# ENGINE FLOW

Snapshot

↓

Production Engine

↓

Academic Engine

↓

Eligibility Engine

↓

Development Engine

↓

Pathway Engine

↓

Composite Intelligence

↓

Explainability

↓

Dashboard

---

# CANONICAL RULES

No duplicated engines.

No duplicated scoring.

No duplicated routing.

No duplicated business logic.

No page owns intelligence.

No HTML calculates scores.

No runtime owns scoring.

Only engines calculate intelligence.

Only Supabase stores permanent data.

---

# DEVELOPMENT ORDER

1.

Architecture

↓

2.

Doctrine

↓

3.

Registry

↓

4.

Routing

↓

5.

Engines

↓

6.

Runtime

↓

7.

Pages

↓

8.

Testing

↓

9.

Deployment

---

# GOVERNANCE

All development must comply with:

README.md

statscore-canon-lock.md

ARCHITECTURE.md

PSC Constitutional Packets

Any implementation conflicting with these documents is considered architecture drift and must be corrected before additional development proceeds.

---

STATS-CORE™

Constitutional Architecture Standard

LOCKED 
