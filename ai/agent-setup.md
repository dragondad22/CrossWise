# CrossWise Agent Setup

The living orientation doc for working in this repo with Claude Code. Keep it current.

## Overview

Claude Code is the primary AI development tool for CrossWise. Project context is
managed through `CLAUDE.md`, checklists, slash-command skills, standards, and (optionally)
a persistent memory system.

## Project Context Files

- `CLAUDE.md` — root project context: non-negotiables, commands, standards index, anti-drift rules. Loaded every session.
- `docs/kit/` — the kit explained: `WORKFLOW.md` (the journey, flowchart, "where am I?") and `README.md` (commands + directory map).
- Add per-area `CLAUDE.md` files (e.g. `apps/api/CLAUDE.md`) when an area needs its own patterns.

## Checklists (completion gates)
- `ai/CHECKLISTS/coding.md` — implementation gate
- `ai/CHECKLISTS/qa.md` — QA/testing gate
- `ai/CHECKLISTS/validation.md` — security + performance gate

## Session-Start Protocol

The **single home** for session-start checks (referenced from `CLAUDE.md`). Run
these in order at the start of a working session. Every check is
**non-interruptive**: its output is one status line or a filed issue — never a
derailment of the task the human arrived with (they may be here for an
emergency). **New session-start checks may only be added to this list**, not
scattered into other docs.

1. **Board drift** — glance at the project board for closed-but-not-Done and stale
   In-progress items; fix the statuses or note the drift in one line
   (`ai/STANDARDS/TASK_ISSUE_STANDARD.md`).
2. **Release trigger** — if `[Unreleased]` in `CHANGELOG.md` is non-empty and ~2 weeks
   have passed or a batch has accumulated, propose a cut in one line
   (`ai/STANDARDS/VERSIONING_AND_CHANGELOG_STANDARD.md` → Release trigger).
3. **Evergreen cadence** — if the newest entry in `docs/evergreen-log.md` is older
   than ~30 days, run `/evergreen` in the background / at a natural pause — it files
   its findings as an issue, never an interactive review.
4. **Scaffold triggers** — if a first-of-its-kind artifact exists whose module isn't
   installed (`bash ai/scripts/scaffold-module.sh list`; trigger table:
   `bootstrap/modules/manifest.yml`), **offer** the install in one line — never
   apply a module silently.

## Slash-Command Skills
- `/bootstrap` — inception close-out / retrofit-upgrade path (re-run safe)
- `/conform` — tidy the repo (or, with `github`, the tracker) to kit standards
- `/rebaseline` — salvage-and-rebuild tier for major course corrections
- `/evergreen` — periodic standards & process health review (files an issue)
- `/preflight` — pre-commit build + test + security + changelog check
- `/qa` — QA validation against recent changes
- `/security` — security validation
- `/compliance` — external-standards + context-driven compliance check (APIs/OpenAPI, web/WCAG, mobile stores, messaging/UGC, minors)
- `/perf` — performance smoke
- `/release` — cut a release (version bump + CHANGELOG roll)
- `/checkpoint` — save session state to memory

## Standards (`ai/STANDARDS/`)
Read the relevant one before working in that area. Index lives in `CLAUDE.md` → Standards.
External standards + compliance obligations (incl. mobile-store and context-driven rules)
live in `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`; what binds this project is
tracked in `docs/compliance/COMPLIANCE_REGISTER.md`.

## Report Templates (`ai/TEMPLATES/`)
Scaffold with `ai/scripts/new-report.sh <type> <id> <slug>`. Reports land in `testing-reports/`.

## Scripts (`ai/scripts/`)
- `release.sh` / `check-version-sync.sh` — versioning (driven by `version-files.txt`)
- `bootstrap-labels.sh` — apply the issue-label taxonomy (idempotent; the label manifest)
- `scaffold-module.sh` — list/install staged kit modules from `bootstrap/modules/`
- `new-report.sh` — scaffold a quality report from a template
- `log-self-correction.sh` — record a self-correction (see below)
- `security-review.sh` / `performance-smoke.sh` — **stubs**; customize for this stack
- `lib/redact.sh` — strip secrets from artifacts before persisting

## CI Quality Gates
GitHub Actions, two workflows:

**On PRs to main:**
- `pr-validation.yml` → `validate`: build/typecheck, lint, tests, version sync
  (`ai/scripts/check-version-sync.sh`), dependency scan (`npm audit
  --audit-level=high --omit=dev` — fails on high/critical runtime vulns per
  `ai/STANDARDS/SECURITY_REVIEW_STANDARD.md`). On failure, diagnostics upload to
  the `failure-diagnostics` CI artifact. E2E (Playwright) is stubbed, pending #42.
- `deploy.yml` → `migrations-check`: squawk lint on `prisma/migrations/**/*.sql`
  (results posted as a PR comment); applies migrations to an ephemeral Neon
  branch when `NEON_API_KEY`/`NEON_PROJECT_ID` secrets are set (self-skips with
  a warning until then).

**On push to main:** `deploy.yml` → `build-test` (lint + test + build) →
`migrate` (`prisma migrate deploy` against the Dev-environment DB, serialized
via the `db-migrate-prod` concurrency group) → `deploy` (Vercel `--prod`). A
failed migration blocks the deploy.

All gates block merge/deploy; none are advisory. Branch protection is not yet
configured, so gates are enforced by convention (don't merge red).

## One-Time Setup
1. Bootstrap is complete — the starter-kit placeholders are filled for CrossWise. The `bootstrap/` directory is the kit's staging area (token reference, staged modules, `KIT_VERSION` upgrade marker) — keep it; it is not one-time scaffolding.
2. Install required CLIs the scripts use: `jq` (version scripts), `gh` (if using GitHub).
3. Install project dependencies and set up local env (`.env` from `.env.example`).
4. Configure `.claude/settings.json` permissions for this project's commands.

## Self-Correction
When blocked: retry documented recovery steps, switch to an equivalent path if needed,
log the adaptation, and escalate unresolved blockers with the exact human action required.

```bash
ai/scripts/log-self-correction.sh \
  --id "<work-item-id>" \
  --role "<role>" \
  --trigger "what went wrong" \
  --action "what was tried" \
  --outcome "result" \
  --reuse "reusable learning for next time" \
  --evidence "path/to/artifact"
```

Entries accumulate in `ai/self_correction_log.md`.
