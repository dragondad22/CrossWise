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

## Decision 2: Roadmap includes native mobile apps (planned) and AI-assisted list generation (exploratory)
**Date:** 2026-06-24

**Context:**
CrossWise is web-first today (Next.js on Vercel, consumed only by its own React
frontend). The owner intends to ship **native Android and iOS apps**, and is
**exploring AI-assisted list generation** — a user enters a topic and an LLM generates
the word/clue list (the manual prompt already exists at
`sample-puzzles/ai-list-generation-prompt.md`). These goals are recorded now because
they shape decisions being made today — chiefly the shape of the `/api/v1` contract.

**Decision:**
Treat native **Android + iOS** as a **planned** direction, and **AI-assisted list
generation** as an **exploratory** direction under consideration. This entry records the
direction to inform — not yet fully specify — architectural choices; the technical
decisions are deferred to the ADRs below.

**Rationale:**
- Surfacing the multi-client and AI goals early avoids baking in web-only assumptions
  (e.g. a cookie-only auth model, a TypeScript-only API contract) that are expensive to
  unwind once native clients exist.
- Recording AI generation now ensures its minors-audience safety obligation (Decision 1)
  is considered before any build, not retrofitted.

**Impact:**
- **API contract:** `/api/v1` becomes multi-client (web + native). Standardize the
  request/response shapes on **Zod as the single source of truth** (#44); revisit the
  OpenAPI "optional" scoping (native clients are a reconsideration trigger), API
  versioning/deprecation (mobile clients lag the backend), and a mobile-friendly auth
  strategy (the current `httpOnly` cookie session is web-centric; native apps typically
  need token-based auth). Captured in **ADR-004 (planned)**.
- **AI generation:** introduces a server-side LLM provider integration + a new endpoint;
  adds an **AI-content safety/moderation** obligation given the minors audience
  (Decision 1), plus provider data-processing to disclose in the privacy notice
  (CW-C-002), and cost/rate controls. Captured in **ADR-005 (planned)**.
- **Determinism boundary:** the AI-generated *list* is non-deterministic content; the
  *puzzle* generated from a list remains seeded and reproducible (#35). Keep the two
  separate.
- **Mobile store compliance:** Apple App Store / Google Play obligations and the minors
  tier will fire when a native build ships (see `docs/compliance/COMPLIANCE_REGISTER.md`).

**Status:** Active — Mobile = Planned · AI generation = Exploratory

**Scope:** In
