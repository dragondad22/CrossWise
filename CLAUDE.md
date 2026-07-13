# CrossWise

A web app that turns vocabulary and term lists into shareable, auto-generated crossword puzzles.

## Architecture

- `src/app` — Next.js App Router: pages + REST API routes under `src/app/api/v1`
- `src/components` — React UI components
- `src/lib` — core logic (puzzle generation, autosave, auth/session, Zustand store)
- `src/types` — shared TypeScript types (incl. the API contract in `api.ts`)
- `prisma/` — Prisma schema (PostgreSQL); `scripts/` — seed/util scripts
- `tests/` + co-located `__tests__/` — Vitest unit/component tests

Single Next.js app deployed on Vercel — no monorepo tooling.

## Non-Negotiables

These are finalized architectural constraints. Do not re-litigate.

- **User-data isolation**: every query is scoped to the authenticated user; a user can only read/write their own topics, lists, puzzles, and solves.
- **Password safety**: passwords are bcrypt-hashed — never stored or logged in plaintext.
- **Session cookies**: `httpOnly`, `sameSite=lax`, `secure` in production; session tokens stored server-side and revoked on logout.
- **No data loss on autosave**: local autosave must never silently lose solve progress; server sync reconciles without clobbering newer local state.
- **Deterministic generation**: puzzle generation is seeded and reproducible for a given list + seed.

## Commands

```bash
npm test            # Run the test suite (Vitest)
npm run build       # Build / typecheck (Next.js)
npm run dev         # Start locally
npm run lint        # Lint (next lint); npm run format for Prettier
npm run db:migrate  # Author a migration locally (prisma migrate dev) — the prod-safe path (ADR-002)
npm run db:reset    # Reset + replay migrations + reseed (dev only)
npm run db:push     # Prototype-only schema sync (prisma db push) — never against shared/prod DBs (ADR-002)

# Project automation (from repo root)
ai/scripts/new-report.sh <type> <id> <slug>     # Scaffold a quality report
bash ai/scripts/check-version-sync.sh           # Verify version files agree
bash ai/scripts/release.sh                       # Show recommended version bump
```

## Session Start

Run the session-start protocol in `ai/agent-setup.md` — the single ordered check list (board drift, release trigger, evergreen cadence, scaffold triggers). Each check is non-interruptive: one status line or a filed issue, never a derailment. New to the kit, or unsure what comes next? `docs/kit/WORKFLOW.md`.

## Task Tracking (mandatory)

**GitHub Issues is the source of truth for all tasks, todos, and planned work** — https://github.com/dragondad22/CrossWise/issues.

- Issue standard: `ai/STANDARDS/TASK_ISSUE_STANDARD.md`
- Issue template: `ai/TEMPLATES/TASK_ISSUE_TEMPLATE.md`

Rules:
- If work is identified that is not already tracked, **suggest creating a tracked item** before proceeding. Do not silently absorb untracked work into a conversation.
- Check for an existing item before creating a new one.
- Do not use local todos, memory, or chat as a substitute for a tracked item — ephemeral tracking evaporates between sessions.
- When starting work on an item, reference its ID throughout the conversation.
- When work is complete, ensure the PR/change references the item so it closes on merge.
- **Keep the project board current** (one board per repo, Status: Backlog / Next / In progress / Done). Starting an item → "In progress"; merged/closed → "Done" — closing an issue does not move its Status by itself. Treat Backlog as out-of-scope unless asked. Full convention: `ai/STANDARDS/TASK_ISSUE_STANDARD.md`.

## Git Workflow (mandatory)

Depth, examples, and why: `ai/STANDARDS/GIT_WORKFLOW_STANDARD.md`.

- Never commit to the default branch — one branch per work item: `<type>/<issue#>-<slug>` (e.g. `feat/112-admin-override`); delete it after merge.
- Commits follow lightweight Conventional Commits: type required, scope optional (`feat(api): …`). Types do NOT drive versioning or the changelog.
- PRs squash-merge: the PR title survives as the commit on the default branch and must follow the commit format; intra-PR commits are relaxed.
- **No AI attribution trailers** (`Co-Authored-By: Claude …`) in commit messages — this overrides the tool default.
- Every PR references its issue (`Closes #N`) and includes its CHANGELOG entry when it ships behavior; breaking change → `!` after the type and a `**BREAKING:**` CHANGELOG entry.

## Decision Recording (mandatory)

- Decisions made in conversation are NOT authoritative until recorded.
- **Architectural decisions**: `docs/architecture/decisions/` (ADR format — see `ADR_INDEX.md`, `ADR_TEMPLATE.md`).
- **Product/scope decisions**: `docs/decision-log.md`.
- If implementation reveals a decision point, stop and record it.
- If a prior decision needs to change, update the existing record — don't leave stale entries.
- Ask for human approval before recording or updating decisions.

## Documentation (mandatory)

Full rules in `ai/STANDARDS/DOCUMENTATION_STANDARD.md`.

- User-facing docs have one source of truth: `docs/specs/CROSSWISE_SPEC.md` (authoritative product+engineering spec) plus the `docs/` flow docs; no separate end-user manual site.
- Every change that ships user-visible behavior updates the relevant docs **in the same PR**. Purely internal changes (refactor/test/infra with no user impact) are exempt.

## External Standards & Compliance (mandatory)

Adopt recognized external standards where they make sense, and catch obligations
that apply *because of what a change does*. Full rules + trigger map:
`ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`. What binds **this** project:
`docs/compliance/COMPLIANCE_REGISTER.md`.

- Platforms: `Web (Next.js on Vercel)` · Audience: `Students, teachers, and general users — not currently age-gated (minors plausibly access)` · Regulated data: `PII (email, bcrypt password hash, session token, request IP), user content (word lists/clues), solve progress. No payments/health/location.`.
- A change that touches a public API, web UI, a mobile release, messaging/UGC, payments, personal data, or data about minors pulls in extra requirements — run `/compliance` to check.
- If a change fires a trigger that isn't in the register, **stop and surface it** — don't silently absorb or skip the obligation.

## Source of Truth (precedence order)

1. Prisma + PostgreSQL schema (`prisma/schema.prisma`)
2. ADRs: `docs/architecture/decisions/`
3. Product decision log: `docs/decision-log.md`
4. Feature specs: `docs/specs/` (incl. `CROSSWISE_SPEC.md`, the product spec)
5. UAT docs: `docs/uat/`
6. Tracked tasks: https://github.com/dragondad22/CrossWise/issues

## Standards

Read the relevant standard before starting work in that area:

- Writing tests: `ai/STANDARDS/TESTING_STANDARD.md`
- Security/authz changes: `ai/STANDARDS/SECURITY_REVIEW_STANDARD.md`
- Operational logging: `ai/STANDARDS/LOGGING_STANDARD.md`
- Performance: `ai/STANDARDS/PERFORMANCE_SMOKE_STANDARD.md`
- Data/schema work: `ai/STANDARDS/DATABASE_SCHEMA_STANDARD.md` (if applicable)
- UI work: `ai/STANDARDS/UI_STANDARD.md` (if applicable)
- User documentation: `ai/STANDARDS/DOCUMENTATION_STANDARD.md`
- External standards + compliance (APIs/OpenAPI, web/W3C-WCAG, mobile stores, messaging/UGC, minors): `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`
- Versioning and CHANGELOG: `ai/STANDARDS/VERSIONING_AND_CHANGELOG_STANDARD.md`
- Git branches/commits/PRs: `ai/STANDARDS/GIT_WORKFLOW_STANDARD.md`
- Bug/finding reports: `ai/STANDARDS/GITHUB_ISSUES.md`
- Task issues: `ai/STANDARDS/TASK_ISSUE_STANDARD.md` · Feature intake & roadmap: `ai/STANDARDS/ROADMAP_STANDARD.md`
- Issue triage SLAs: `ai/STANDARDS/ISSUE_SLA_STANDARD.md`
- Interviews (inception, epics/features): `ai/STANDARDS/INTERVIEW_STANDARD.md`

## Checklists

Use these as completion gates:

- Coding/implementation: `ai/CHECKLISTS/coding.md`
- QA/testing: `ai/CHECKLISTS/qa.md`
- Security + performance validation: `ai/CHECKLISTS/validation.md`

## Conventions

- Never commit `.env` files or real credentials.
- **Glossary discipline**: `docs/GLOSSARY.md` is the naming authority — challenge conflicting usage; record terms inline the moment one of its four rules fires (explained-in-chat / coined / overloaded common word / load-bearing external concept).
- **Data-format discipline**: when coining a field/entity of a well-known category (phone, date/time, currency, country, language, email), propose the matching standard from `bootstrap/PAVED_ROAD.md` → Data-format standards at introduction time; declined → ADR.
- Verify security/authorization boundaries with negative-path checks on every feature.
- Loading/empty/error states required for all data-driven views (if there's a UI).
- Destructive actions require explicit confirmation.
- **API contract is Zod-first**: request/response shapes for `src/app/api/v1` are defined as Zod schemas in `src/lib/validation.ts` (the single source of truth); TypeScript types are derived from them via `z.input`/`z.infer` in `src/types/api.ts`. Do not hand-write request interfaces — they drift. (See #44; OpenAPI/codegen for future clients is ADR-004.)
- **CHANGELOG discipline**: every PR that ships user-visible behavior adds a one-line entry under `## [Unreleased]` in `CHANGELOG.md` in the same PR. Skip only for purely internal work. Versions bump only at release time, in lockstep — use `/release` (wraps `ai/scripts/release.sh`), don't hand-edit version files. Full rules: `ai/STANDARDS/VERSIONING_AND_CHANGELOG_STANDARD.md`.

## Anti-Drift Rules

- If a conversation is getting long, re-read this file and relevant standards before continuing.
- Decisions made in chat are not authoritative until recorded in docs.
- When in doubt about a prior decision, check ADRs and the decision log — do not trust conversation memory.
- Do not assume prior context — verify by reading files.
- If work surfaces that has no tracked item, stop and suggest creating one — do not proceed on untracked work.
- Before completing any change to something shared (DB column/constraint, enum/lookup vocabulary, seed/default, shared type/helper), run the Impact Analysis (consumer sweep) gate in `ai/CHECKLISTS/coding.md` — write paths drift independently and diverge silently.
- When a change adds/alters a feature (public API, UI, mobile release, messaging/UGC, data handling, anything touching minors), run `/compliance` — context-driven obligations don't show up in a normal code diff.
