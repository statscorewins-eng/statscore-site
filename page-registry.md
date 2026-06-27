# STATS-CORE™
# PAGE REGISTRY
### Canonical HTML Ownership Registry

Version: 1.0
Status: LOCKED
Authority: STATS-CORE Canon
Repository: statscore-site

---

# PURPOSE

The Page Registry establishes the authoritative ownership of every HTML page
within the STATS-CORE platform.

Every page shall have:

• One owner
• One mission
• One responsibility

Pages consume intelligence.

Pages DO NOT create intelligence.

Business logic belongs inside engines.

---

# PAGE GOVERNANCE

Each page must answer:

• What page is this?
• Which Stream owns it?
• What engines does it consume?
• What intelligence does it display?
• What pages route here?
• What pages can it route to?

---

# STREAM 1
## Public Access / Login

### index.html

Owner:
Stream 1

Purpose:
Public landing page.

Consumes:

- statscore-routing.js

Produces:

- Public navigation only

Routes To

- login.html

---

### login.html

Owner:
Stream 1

Purpose

Authenticate user.

Consumes

- role context
- routing

Routes To

Athlete

- snapshot-intake.html

Non-Athlete

- role-dashboard-intake.html

Administrator

- system.html

---

# STREAM 2
## Athlete Source Record

### snapshot-intake.html

Owner

Stream 2

Purpose

Creates athlete source record.

Creates

- athlete_id
- snapshot_id
- intake record

Consumes

- intake runtime
- validation engine

Routes

- athlete-dashboard.html

Never

Scoring

Crystal

Player Intelligence

Recruiting Intelligence

---

### parent-approval.html

Owner

Stream 2

Purpose

Parent release governance.

Creates

Approval status only.

Never

Scores

Production

Recruiting intelligence

---

# STREAM 3
## Athlete Intelligence

### athlete-dashboard.html

Purpose

Athlete command center.

Consumes

- scoring engine
- production intelligence
- academic intelligence
- pathway intelligence
- readiness intelligence
- eligibility intelligence
- explainability engine

Never

Edit production

Create snapshots

Modify governance

---

### player-profile.html

Purpose

Explainable Athlete Intelligence.

Consumes

- profile engine
- scoring engine
- synthesis engine
- recommendation engine
- pathway engine
- intelligence engine

Never

Edit athlete production.

---

### athlete-production-record.html

Purpose

Production evidence.

Consumes

Production Record Engine

Creates

Season production records.

Displays

Season Ledger

Career Totals

Verification

Never

Calculate overall athlete score.

---

# STREAM 4
## Role Intake

### role-dashboard-intake.html

Purpose

Create role identity.

Routes

Shared Dashboard

Never

Athlete intelligence.

---

# STREAM 5
## Shared Role Dashboard

Pages

coach.html

parent.html

counselor.html

program.html

evaluator.html

recruiter-access.html

role-dashboard.html

Purpose

Shared professional workspace.

Consumes

Athlete intelligence.

Never

Generate athlete intelligence.

---

# STREAM 6
## Communication

Pages

multi-box.html

communication-center.html

Purpose

Governed communication.

Consumes

Message Engine

Audit Engine

Permissions

Never

Athlete scoring.

---

# STREAM 7
## Crystal

Pages

crystal-report.html

crystal-registry.html

Purpose

Crystal intelligence.

Consumes

Verified athlete intelligence.

Never

Create production.

---

# STREAM 8
## Operations

Pages

system.html

system-health.html

engine-health.html

Purpose

System administration.

Consumes

Engine Registry

System Registry

Health Engine

Never

Athlete production.

---

# STREAM 9
## Composite Intelligence

Purpose

No HTML ownership.

Owns

Composite Intelligence Engines.

Consumed by

Athlete Dashboard

Player Profile

Crystal Reports

Recruiter Intelligence

System Intelligence

Never

Own HTML pages.

---

# PAGE OWNERSHIP RULES

Every HTML page has ONE owner.

No page may belong to multiple Streams.

A page may consume engines from multiple Streams.

A page may never own engines.

---

# ENGINE RULE

HTML

↓

Runtime

↓

Engine

↓

Database

↓

Return Intelligence

↓

Render

Never

HTML

↓

Database

---

# PAGE MODIFICATION RULE

Before modifying any page:

1.
Verify page ownership.

2.
Verify consuming engines.

3.
Verify routing.

4.
Verify Stream boundaries.

If any modification crosses another Stream's authority,
the work SHALL be transferred to the owning Stream.

---

END OF PAGE REGISTRY
STATS-CORE CANON 

