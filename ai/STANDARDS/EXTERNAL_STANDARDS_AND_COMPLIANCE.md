# External Standards & Compliance

Two jobs:

1. **Adopt recognized external standards where they make sense** (OpenAPI, W3C/WCAG, RFCs, security baselines) instead of inventing local conventions.
2. **Catch context-driven obligations** — requirements that apply *because of what a change does*, not because of where it lives in the tree. A change that adds user-to-user messaging, collects a birthdate, or ships a new mobile binary pulls in obligations a normal code review won't surface.

> **"Where they make sense" is the rule, not "always."** Adopt the *intent* of a standard and the subset that fits this project; don't cargo-cult bureaucracy. Use the trigger map to decide what applies, and record the verdict in the project's compliance register (`docs/compliance/COMPLIANCE_REGISTER.md`) so it isn't re-litigated every PR.

> **Currency caveat (important).** Store policies, platform target-API levels, and child-safety/privacy law change frequently and vary by region. This file lists *what to consider* and where to look — it is **not** a substitute for the current official text. When a trigger fires, open the live source, and record the date you checked in the register.

This project's platforms: `Web (Next.js on Vercel)` · audience: `Students, teachers, and general users — not currently age-gated (minors plausibly access)` · regulated data: `PII (email, bcrypt password hash, session token, request IP), user content (word lists/clues), solve progress. No payments/health/location.`.

---

## Trigger map

When a change touches the left column, the middle column **may** apply — confirm against the register and the live source.

| If the change touches… | Consider these obligations | Primary source |
|---|---|---|
| A public / externally-consumed HTTP API | Keep the **OpenAPI 3.x** spec the source of truth (update in the same PR); REST + HTTP semantics (RFC 9110); consistent error shape (RFC 9457 Problem Details); explicit API versioning; idempotency on unsafe retries | OpenAPI Spec; IETF RFCs |
| Any web UI | **WCAG 2.2 AA**; semantic HTML; ARIA only when native semantics fall short (first rule of ARIA: don't use ARIA); full keyboard operability; visible focus; valid markup | W3C / WAI |
| A **mobile app** binary/release | Apple App Store Review Guidelines **and** Google Play policies — see *Mobile store requirements* below | Apple / Google official policy |
| **User-to-user messaging or any user-generated content** | Safety-by-design: moderation, in-app **report** + **block**, a published contact, and a defined response time; platform UGC rules; EU DSA / UK Online Safety Act if in scope — see *Messaging & UGC* below | Store UGC rules; DSA; OSA |
| Collection of **personal data** | Lawful basis/consent, privacy notice, data-subject rights (access/delete/export), retention limits, breach plan (GDPR / UK GDPR / CCPA-CPRA) | Relevant DPA / regulator |
| Data about, or a service likely accessed by, **minors** | Age assurance, parental-consent thresholds, high-privacy defaults — see *Minors* below | COPPA; GDPR Art.8; AADC |
| **Payments / monetization** | PCI DSS scope (prefer a compliant processor so you never touch PANs); platform in-app-purchase rules for digital goods | PCI SSC; store rules |
| **Authentication / sessions / secrets** | OWASP ASVS + OWASP Top 10; platform sign-in rules (e.g. offer Sign in with Apple if you offer other third-party logins on iOS); MFA where warranted | OWASP; store rules |
| **Accessibility in a regulated setting** (gov, EU market, public accommodation) | ADA / Section 508 (US), EN 301 549 + European Accessibility Act (EU) — these make WCAG a legal floor, not a nicety | Relevant law |
| Dates, encoding, i18n, locales | ISO 8601 timestamps, UTF-8/Unicode, BCP 47 language tags, currency/number formatting via locale | ISO / Unicode / IETF |
| Telemetry / analytics / tracking | Consent before tracking; on iOS, App Tracking Transparency; data-safety/privacy-label disclosure must match reality | Store + privacy law |

If a change fires a trigger and the obligation **isn't yet in the register**, stop and surface it (file a tracked item) — don't silently take on the obligation or silently skip it.

---

## Mobile store requirements

Both stores reject late and expensively. Check these *before* building a release, not at submission. Verify each against the current official guideline (they change at least yearly).

**Common to both**
- **Privacy disclosure that matches reality**: Apple privacy "nutrition" labels / Google Play **Data safety** form. Mismatches between declared and actual data collection are a top rejection/enforcement cause.
- **Account & data deletion**: if the app supports account creation, it must offer in-app account deletion (and, for Play, an externally reachable deletion path).
- **Permissions**: request only what you use, justify sensitive permissions (location, mic, camera, contacts, photos), degrade gracefully if denied.
- **Age rating** filled honestly based on actual content/features (messaging and UGC raise the rating).
- **Crash-free, no placeholder content, working contact/support URL, reachable privacy policy URL.**

**Apple-specific**
- Sign in with Apple if you offer other third-party social logins.
- App Tracking Transparency prompt before any cross-app tracking.
- UGC apps (Guideline 1.2): content filtering, report mechanism, block abusive users, published contact, and act on reports — historically within ~24h.
- Kids Category (if used): no third-party analytics/ads that collect PII, parental gate for purchases/external links.

**Google Play-specific**
- Meet the current **target API level** requirement (Play raises the minimum annually; an old target blocks updates).
- Families / "Designed for Families" policy if the audience includes children; Photo/Video and other sensitive-permission policies; declared use of restricted permissions.

---

## Messaging & UGC (safety-by-design)

Any feature where one user's content reaches another — **including staff↔user messaging** — is a user-to-user service and carries safety obligations:

- **Report & block** reachable from the content itself; reports go somewhere a human acts on, with a defined response time.
- **Moderation**: a stated policy on prohibited content, and a means to remove it and the offending account.
- **Audit/retention**: keep enough record to investigate abuse and meet any legal-hold/safeguarding duty, balanced against data-minimization.
- **Regulatory scope**: EU **Digital Services Act** and UK **Online Safety Act** impose duties on user-to-user services (risk assessment, transparency, child-safety duties) — confirm whether thresholds apply.
- **Higher bar when minors are involved** (see below): default to private-by-default, restrict contact discoverability, and consider safeguarding/mandatory-reporting context for adult-to-minor communication.

---

## Minors

A change that touches data about under-18s, or ships a service "likely to be accessed by children," activates the strictest tier. Thresholds differ by region — don't assume one number:

- **COPPA (US)**: special protections for **under 13** (verifiable parental consent, data minimization).
- **GDPR Article 8 (EU)**: digital-consent age is **13–16 depending on member state** (default 16). A 14-year-old is below the consent age in some EU countries → parental consent may be required there.
- **UK Age Appropriate Design Code / California AADC**: apply to under-18 services — require a **DPIA**, high-privacy defaults, no nudge toward weaker privacy, age-appropriate transparency.

> Worked example — *an app for ages 14+ with staff messaging*: age gate excludes under-13 (COPPA largely avoided), **but** EU 14–15-year-olds may be under the consent age in some states (parental-consent path), the UK Children's Code applies (DPIA + high-privacy defaults), the messaging feature needs report/block/moderation and a safeguarding stance for adult-to-minor contact, and both stores' age ratings + Families policies are in play. Record each of these in the register with an owner.

---

## Where to record what applies

The **trigger map is generic**; the **obligations that actually bind this project** live in `docs/compliance/COMPLIANCE_REGISTER.md` — each with an owner, status, and a date the live source was last verified. Update the register when the project's platforms, audience, data, or features change. The `/compliance` command checks a diff (or a described feature) against this standard and the register.
