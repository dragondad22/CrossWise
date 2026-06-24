# Compliance Register — CrossWise

The obligations that actually bind **this** project, derived from
`ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`. The standard is the generic
catalog; this file is the project-specific source of truth for what applies, who
owns it, and whether it's met.

- **Update this** whenever platforms, audience, regulated data, or features change.
- Each row records a **Verified** date — when the live official source was last checked
  (store policies and child-safety law change frequently; an old date is a risk).
- `/compliance` reads this file to decide which obligations a change triggers.

## Project profile

| Field | Value |
|---|---|
| Target platforms | Web only (Next.js, Vercel) — no mobile binary |
| Audience (incl. age) | **Intended for / likely accessed by minors** (Decision 1, 2026-06-24, `docs/decision_log.md`). Strict child-safety/privacy tier applies. |
| Regulated data handled | PII (email, bcrypt password hash, session token, request IP), user content (word lists/clues), solve progress. No payments / health / location. |
| Obligation-bearing features | Web UI; accounts + session cookies; first-party REST API (`/api/v1`); JSON/CSV import-export. **No** messaging/UGC, payments, or tracking/analytics. |

## Active obligations

| ID | Trigger | Obligation | Applies because | Owner | Status | Verified | Evidence / Gap |
|----|---------|-----------|-----------------|-------|--------|----------|----------------|
| CW-C-001 | web UI | WCAG 2.2 AA (semantic HTML, keyboard, focus, contrast) | ships a web UI | dragondad22 | ◐ In progress | 2026-06-24 | Spec calls out keyboard nav + focus mgmt for grid/clues; **full AA pass not verified** (contrast, forms, ARIA, non-grid pages) — tracked in #27 |
| CW-C-002 | personal data | Privacy notice + lawful basis | collects email + content + IP | dragondad22 | ☐ Not started | 2026-06-24 | **No privacy policy found anywhere in repo** — tracked in #25 |
| CW-C-003 | personal data | Data-subject rights: access / export / delete | has user accounts | dragondad22 | ◐ Partial | 2026-06-24 | Per-list JSON/CSV export exists; **no full-account export, no account-deletion path** (auth routes are register/login/session/logout only) — tracked in #26 |
| CW-C-004 | personal data | Retention limits + breach plan | stores PII + sessions in DB | dragondad22 | ☐ Not started | 2026-06-24 | No stated retention or session-expiry/cleanup policy found |
| CW-C-005 | **minors** | COPPA (<13) / GDPR Art.8 EU consent age (13–16) / UK + CA Age-Appropriate Design Codes (<18): age assurance, parental-consent path where required, **DPIA**, high-privacy defaults | **Confirmed by Decision 1 (2026-06-24): intended for / likely accessed by minors** | dragondad22 | ☐ Not started | 2026-06-24 | Active per Decision 1. Substantial epic — not yet filed/started; track separately |
| CW-C-006 | auth / sessions | OWASP ASVS / Top 10 baseline | custom auth | dragondad22 | ◐ Partial | 2026-06-24 | Good baseline: bcrypt, DB-backed sessions, cookie `httpOnly`+`sameSite=lax`+`secure` in prod. **Review: login rate-limiting, session expiry/idle, password policy, MFA need** |
| CW-C-007 | telemetry / cookies | ePrivacy / cookie consent | uses cookies + localStorage | dragondad22 | ➖ Likely N/A | 2026-06-24 | Only essential auth cookie + functional localStorage/Zustand persistence; **no tracking/analytics found** ⇒ consent banner likely not required. Document the cookie inventory to confirm |

## Scoped out (recorded decisions, not omissions)

| Trigger | Verdict | Reasoning |
|---|---|---|
| Mobile store requirements (Apple/Google) | ➖ N/A | No mobile binary — web only. Revisit if a native/PWA-store build ships. |
| Messaging / UGC safety (report/block/moderation, DSA/OSA) | ➖ N/A | No user-to-user content. Sharing, collaboration, public links, and guest play are explicitly out of scope in the spec. **Revisit immediately if "shareable puzzles / public sharing links" (a stated stretch goal) is built** — that would fire UGC + the minors tier hard. |
| Payments / PCI DSS | ➖ N/A | No monetization. |
| OpenAPI 3.x spec | ➖ Optional | The `/api/v1` API is **first-party** (consumed only by CrossWise's own frontend; typed via `src/types/api.ts`). "Where it makes sense" ⇒ OpenAPI is low-value here. Promote to required only if the API is opened to third parties. |
| Tracking / App Tracking Transparency | ➖ N/A | No analytics/tracking SDKs in the codebase. |

## Decisions & scoping notes

- **RESOLVED — audience decision (Decision 1, 2026-06-24).** CrossWise is treated as
  **intended for / likely accessed by minors** (option b). CW-C-005 is therefore **active**:
  DPIA, high-privacy defaults, and a parental-consent path for EU under-age users are required.
  Full record in `docs/decision_log.md`.
