# CrossWise – Decision Log

**Purpose:**
This document captures *decisions*, not discussions. It is the single source of truth
for what has been decided for CrossWise, why those decisions were made, and what
they impact. It keeps the team and AI collaborators aligned as the product evolves.

Use this log for **product / scope** decisions. Architectural decisions belong in
`docs/architecture/decisions/` (ADR format). When uncertain where a decision belongs,
check existing patterns in both locations.

---

## Decision 1: CrossWise is intended for, and likely accessed by, minors
**Date:** 2026-06-24

**Context:**
CrossWise is marketed in its README for "students, teachers, and anyone," and is a
vocabulary-learning tool whose natural audience includes school-age users. The product
currently has no age gate and no stated minimum age. The compliance review
(`docs/compliance/COMPLIANCE_REGISTER.md`, row CW-C-005) flagged this as an unresolved
audience question that determines whether child-safety/privacy obligations apply.

**Decision:**
Treat CrossWise as a service **intended for and likely to be accessed by minors**
(option b). It is **not** restricted to adults.

**Rationale:**
- The stated audience ("students") plainly includes under-18s; an adults-only posture
  would contradict the product's purpose and require an age gate that isn't wanted.
- Adopting the children's-privacy posture proactively is cheaper than retrofitting it
  after an incident or a regulator inquiry.
- Tradeoff accepted: additional up-front work (DPIA, high-privacy defaults, a
  parental-consent path for EU under-age users) and ongoing design constraints.

**Impact:**
- Activates compliance obligation **CW-C-005** (COPPA for under-13, GDPR Article 8 EU
  digital-consent age, UK & California Age-Appropriate Design Codes for under-18):
  age assurance, parental-consent path where required, a DPIA, and high-privacy defaults.
- Raises the bar on related rows: privacy notice (CW-C-002) must be age-appropriate;
  data minimization and retention (CW-C-004) become stricter; any future sharing /
  user-to-user feature is gated behind child-safety design (see the register's
  scoped-out UGC row — revisit before building public sharing links).
- New features that collect data from or about users must default to the most
  privacy-protective setting.

**Status:** Active

**Scope:** In

---

<!-- Append new dated entries below. Never edit a recorded decision in place to mean
     something different — supersede it with a new entry and mark the old one Superseded. -->
