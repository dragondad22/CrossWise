Tidy an existing repo to the kit's current standards: file renames, doc reorganization into the shipped layout, structure conformance, tracker cleanup. **Explicitly no behavior or design changes** — if a step would alter what the code does or how anything looks, it does not belong here (that's `/rebaseline`, the salvage-and-rebuild tier).

`/conform github` scopes the run to the tracker surface only — for adopting the kit's GitHub process without touching the code.

## Procedure

1. **Scope.** No argument → the repo surface (files, docs, structure), and offer the tracker scope as a follow-up. `github` → tracker surface only (step 4). Missing kit pieces discovered along the way (no labels manifest, no board, no `bootstrap/KIT_VERSION`) belong to `/bootstrap` retrofit — offer it, don't absorb it.

2. **Inventory drift against the standards that define "conformant".**
   - File naming → `ai/STANDARDS/DOCUMENTATION_STANDARD.md` (reference docs `UPPER_SNAKE_CASE.md`, working docs `kebab-case.md`, ecosystem-fixed and ID-anchored names exempt).
   - Doc layout → the shipped tree: ADRs in `docs/architecture/decisions/`, specs in `docs/specs/`, runbooks in `docs/runbooks/`, interviews/plans in `docs/plans/`, glossary/personas/decision-log at `docs/` root.
   - Structure → standards in `ai/STANDARDS/`, templates in `ai/TEMPLATES/`, scripts in `ai/scripts/`, checklists in `ai/CHECKLISTS/`.
   Produce a **conform plan**: a rename/move table (from → to, rule cited) plus the reference updates each rename requires. Present it and **get approval before changing anything**.

3. **Execute as tracked work.** One tracked issue, one branch, one PR (`ai/STANDARDS/GIT_WORKFLOW_STANDARD.md`). Renames/moves via `git mv` so history follows. Update every reference to a renamed/moved file **in the same PR** — a conform pass must not create dead links. Verify no behavior change: build and tests pass unchanged, and the diff contains only renames, moves, and reference updates.

4. **`github` scope — conform the tracker surface** (each item offered, applied only on approval):
   - **Labels** → apply the manifest via `bash ai/scripts/bootstrap-labels.sh` (idempotent); map existing labels onto the taxonomy (rename, don't duplicate) and retire strays.
   - **Typed-issue migration** → add `type:*` labels to existing open issues; restructure epic-shaped issues as parent issues with native sub-issues (`ai/STANDARDS/TASK_ISSUE_STANDARD.md`).
   - **Project board** → one board per repo with the Status field and saved views per the task-issue standard, plus the Horizon field and Roadmap view per `ai/STANDARDS/ROADMAP_STANDARD.md`; walk the human through the UI-only parts.
   - **Templates** → wire the issue body shapes from `ai/TEMPLATES/` into the repo's issue templates.
   - **Repo settings** → squash-merge with PR-title-as-commit, branch cleanup on merge, per `ai/STANDARDS/GIT_WORKFLOW_STANDARD.md`.

5. **Report.** What was renamed/moved/migrated, what was offered and declined, and anything found that exceeds tidy-only (behavior or design work) — recommend `/rebaseline` or a tracked issue for those, never do them here.
