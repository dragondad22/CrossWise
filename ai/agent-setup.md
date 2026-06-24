# CrossWise Agent Setup

The living orientation doc for working in this repo with Claude Code. Keep it current.

## Overview

Claude Code is the primary AI development tool for CrossWise. Project context is
managed through `CLAUDE.md`, checklists, slash-command skills, standards, and (optionally)
a persistent memory system.

## Project Context Files

- `CLAUDE.md` — root project context: non-negotiables, commands, standards index, anti-drift rules. Loaded every session.
- Add per-area `CLAUDE.md` files (e.g. `apps/api/CLAUDE.md`) when an area needs its own patterns.

## Checklists (completion gates)
- `ai/CHECKLISTS/coding.md` — implementation gate
- `ai/CHECKLISTS/qa.md` — QA/testing gate
- `ai/CHECKLISTS/validation.md` — security + performance gate

## Slash-Command Skills
- `/bootstrap` — one-time: fill the kit's placeholders for this project
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
- `new-report.sh` — scaffold a quality report from a template
- `log-self-correction.sh` — record a self-correction (see below)
- `security-review.sh` / `performance-smoke.sh` — **stubs**; customize for this stack
- `lib/redact.sh` — strip secrets from artifacts before persisting

## CI Quality Gates
GitHub Actions (.github/workflows/deploy.yml): lint + test + build on PRs to main; deploy to Vercel on push to main

<!-- Document the actual gates here once CI exists: what runs on PR vs on merge vs on a
schedule, which gates block merge vs are advisory, and where artifacts are uploaded. -->

## One-Time Setup
1. Run `/bootstrap` to fill placeholders, or fill by hand per `bootstrap/SETUP.md`.
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
