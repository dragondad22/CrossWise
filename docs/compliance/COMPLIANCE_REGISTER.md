# Compliance Register — CrossWise

The obligations that actually bind **this** project: the source of truth for what
applies, who owns it, and whether it's met.

- **Update this** whenever platforms, audience, regulated data, or features change.
- Each row records a **Verified** date — when the live official source was last checked
  (store policies and child-safety law change frequently; an old date is a risk).
- Check a change against it when it touches a public API, the UI, personal data, or
  data about minors.

## Project profile

| Field | Value |
|---|---|
| Target platforms | Web only (Next.js, Vercel) — no mobile binary |
| Audience (incl. age) | **Intended for / likely accessed by minors** (Decision 1, 2026-06-24, `docs/decision-log.md`). Strict child-safety/privacy tier applies. Since 2026-10-09, accounts are for ages 13+ (Build Your Alpaca terms + privacy policy, sign-up page; age not verified). |
| Regulated data handled | **CrossWise:** PII (user id, email, name, request IP), user content (word lists/clues), solve progress. **Shared accounts service (ADR-009):** name, email, profile picture, password hash for email accounts, sessions with IP + user agent — stored in Neon (AWS us-east-2), run on Vercel; account email sent through Resend. No payments / health / location. |
| Obligation-bearing features | Web UI; sign-in via the shared accounts service (session cookie for `buildyouralpaca.com`); first-party REST API (`/api/v1`) incl. a signed account-deleted webhook; JSON/CSV import-export. **No** messaging/UGC, payments, or tracking/analytics. |

## Active obligations

| ID | Trigger | Obligation | Applies because | Owner | Status | Verified | Evidence / Gap |
|----|---------|-----------|-----------------|-------|--------|----------|----------------|
| CW-C-001 | web UI | WCAG 2.2 AA (semantic HTML, keyboard, focus, contrast) | ships a web UI | dragondad22 | ◐ In progress | 2026-06-24 | Spec calls out keyboard nav + focus mgmt for grid/clues; grid focus-ring non-text contrast verified >=3:1 against card/band/accent/check fills (#12, 2026-07-13); **full AA pass not verified** (forms, ARIA, non-grid pages) — tracked in #27 |
| CW-C-002 | personal data | Privacy notice + lawful basis | collects email + content + IP | dragondad22 | ◐ Partial | 2026-06-24 | 2026-10-09: https://buildyouralpaca.com/privacy now exists and covers app accounts (names CrossWise): account data, sessions, cookies, Neon/Vercel/Resend as processors, deletion, 13+ minimum. **Still open:** CrossWise's own database (word lists, solve progress) and its host are not described, no lawful basis is stated, and the notice is not age-appropriate per Decision 1 — tracked in #25 |
| CW-C-003 | personal data | Data-subject rights: access / export / delete | has user accounts | dragondad22 | ◐ Partial | 2026-06-24 | Per-list JSON/CSV export exists. 2026-10-09: **deletion now reaches CrossWise** — before deleting an account, the accounts service calls the signed `POST /api/v1/internal/account-deleted`, which deletes the user with their topics, lists, puzzles and solves; the account is not deleted unless CrossWise confirms (ADR-009, #127). **Still missing: full-account export** — tracked in #26 |
| CW-C-004 | personal data | Retention limits + breach plan | stores PII + sessions in DB | dragondad22 | ☐ Not started | 2026-06-24 | No stated retention or session-expiry/cleanup policy found |
| CW-C-005 | **minors** | COPPA (<13) / GDPR Art.8 EU consent age (13–16) / UK + CA Age-Appropriate Design Codes (<18): age assurance, parental-consent path where required, **DPIA**, high-privacy defaults | **Confirmed by Decision 1 (2026-06-24): intended for / likely accessed by minors** | dragondad22 | ☐ Not started | 2026-06-24 | Active per Decision 1. 2026-10-09: accounts are for ages 13+ (terms, privacy policy, sign-up page); age is not verified, and under-13 accounts are deleted on request. Under-13 users can't create accounts; guest solving (#101, #108) would be their path. **Still open:** DPIA, high-privacy defaults, design-code duties for 13–17, EU parental consent for ages 13–16 where required. Substantial epic — not yet filed/started; track separately |
| CW-C-006 | auth / sessions | OWASP ASVS / Top 10 baseline | sign-in delegated to the shared accounts service (ADR-009) | dragondad22 | ◐ Partial | 2026-06-24 | 2026-10-09: auth controls now live in the accounts service — per-IP sign-in rate limiting in Postgres (#89), email confirmation, hashed passwords, session cookie `httpOnly`+`Secure`+`SameSite=Lax`, 30-day sessions. CrossWise stores no passwords or session tokens, forwards only `alpaca.*` cookies, uses one session check (`requireSession`, #88), and verifies the deletion webhook (HMAC-SHA256, 5-min window). **Review: idle timeout, password policy, MFA need — now in the accounts service** |
| CW-C-007 | telemetry / cookies | ePrivacy / cookie consent | uses cookies + localStorage | dragondad22 | ➖ Likely N/A | 2026-06-24 | 2026-10-09: CrossWise sets no cookies of its own. The accounts service sets the essential sign-in cookie (`__Secure-alpaca.session_token`, for `buildyouralpaca.com`) and a short-lived cookie for the sign-in step; https://buildyouralpaca.com/privacy says neither is used for tracking. Plus functional localStorage/Zustand persistence; **no tracking/analytics found** ⇒ consent banner likely not required. Document the cookie inventory to confirm |

## Scoped out (recorded decisions, not omissions)

| Trigger | Verdict | Reasoning |
|---|---|---|
| Mobile store requirements (Apple/Google) | ⚠ Planned trigger | No mobile binary today, but **native Android + iOS apps are a stated roadmap goal**. Apple App Store / Google Play obligations (privacy nutrition labels / Data safety form, account-deletion requirement, age ratings, and the **minors tier** per Decision 1) **will fire** when a native build ships. Revisit before mobile work begins — see ADR-004 (planned). |
| Messaging / UGC safety (report/block/moderation, DSA/OSA) | ➖ N/A | No user-to-user content. Sharing, collaboration, public links, and guest play are explicitly out of scope in the spec. **Revisit immediately if "shareable puzzles / public sharing links" (a stated stretch goal) is built** — that would fire UGC + the minors tier hard. |
| Payments / PCI DSS | ➖ N/A | No monetization. |
| OpenAPI 3.x spec | ➖ Optional (reconsider for mobile) | The `/api/v1` API is **first-party** and today consumed only by the web frontend (typed via `src/types/api.ts`) ⇒ OpenAPI is currently low-value. **Reconsideration triggers:** (a) opening the API to third parties, or (b) the planned **native mobile clients** (Android/iOS) — multiple first-party clients that can't share TS types make a language-neutral contract worthwhile. Intended path: standardize the contract on Zod (#44), then generate OpenAPI + client codegen from those schemas if promoted. See ADR-004 (planned). |
| Tracking / App Tracking Transparency | ➖ N/A | No analytics/tracking SDKs in the codebase. |

## Decisions & scoping notes

- **RESOLVED — audience decision (Decision 1, 2026-06-24).** CrossWise is treated as
  **intended for / likely accessed by minors** (option b). CW-C-005 is therefore **active**:
  DPIA, high-privacy defaults, and a parental-consent path for EU under-age users are required.
  Full record in `docs/decision-log.md`.
