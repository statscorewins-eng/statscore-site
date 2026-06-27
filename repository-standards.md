# STATS-CORE™
# REPOSITORY STANDARDS
### Canonical Repository Organization Standard

Version: 1.0
Status: CANON LOCKED
Authority: STATS-CORE Canon

---

# PURPOSE

This document establishes the official repository structure,
file naming conventions,
directory organization,
and development standards for STATS-CORE.

The repository shall remain organized,
predictable,
and governed.

---

# CORE PRINCIPLE

The repository is a governed system.

It is NOT a collection of unrelated files.

Every file has a place.

Every place has a purpose.

---

# DIRECTORY STRUCTURE

Root

README.md

Governance Documents

HTML Pages

JavaScript Engines

Runtime Files

CSS

Assets

Database

Documentation

---

# GOVERNANCE

Recommended directory

/governance/

Contains

statscore-canon-lock.md

engine-registry.md

page-registry.md

stream-registry.md

system-map.md

runtime-governance.md

ownership-header-standard.md

repository-standards.md

future governance documents

---

# HTML PAGES

Purpose

Presentation only.

Naming

lowercase

hyphen-separated

Examples

athlete-dashboard.html

player-profile.html

snapshot-intake.html

role-dashboard.html

system.html

Never

Business logic

Scoring

Database intelligence

---

# RUNTIME FILES

Purpose

Coordinate execution.

Naming

statscore-[page]-runtime.js

Examples

statscore-player-profile-runtime.js

statscore-dashboard-runtime.js

Never

Contain scoring logic

Never

Contain database intelligence

---

# ENGINE FILES

Purpose

Business logic.

Naming

statscore-[function]-engine.js

Examples

statscore-scoring-engine.js

statscore-production-engine.js

statscore-pathway-engine.js

statscore-consensus-engine.js

Never

Render HTML

Never

Contain CSS

---

# CSS

Purpose

Presentation styling.

Naming

lowercase

hyphen-separated

Examples

dashboard.css

player-profile.css

system.css

---

# DATABASE

Purpose

Persistent storage.

Contains

SQL

Migrations

Views

Functions

Policies

Never

Presentation code

---

# ASSETS

Contains

Images

Icons

Logos

Fonts

Media

Never

Business logic

---

# FILE NAMING

All filenames

lowercase

hyphen-separated

No spaces

No CamelCase

Examples

statscore-profile-engine.js

role-dashboard.html

system-map.md

---

# IDENTIFIER STANDARD

athlete_id

Permanent athlete identity

snapshot_id

Snapshot intelligence

role_id

Professional identity

message_id

Communication identity

crystal_id

Crystal identity

production_record_id

Production identity

---

# ENGINE DEPENDENCIES

Engines may consume engines.

Pages consume runtimes.

Runtimes consume engines.

Engines never consume HTML.

---

# MODIFICATION RULE

Before adding a file:

Verify ownership.

Verify Stream.

Verify directory.

Verify naming convention.

Verify no existing file already performs the function.

---

# DUPLICATION RULE

No duplicate engines.

No duplicate pages.

No duplicate runtimes.

No duplicate governance.

No duplicate authority.

---

# GOLDEN RULE

The repository grows by governance,
not by accumulation.

Every file has purpose.

Every purpose has one owner.

---

END OF REPOSITORY STANDARDS

STATS-CORE CANON 
