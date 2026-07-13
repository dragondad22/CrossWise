Close out project inception: consume the inception interview's `Final:` answers to fill every `{{PLACEHOLDER}}`, generate the founding files (README, LICENSE), seed the founding docs, and wire the harness and tracker.

`/bootstrap` is the **final step of inception**, not a standalone questionnaire (the interview is where the real questions live). Re-running it later is the retrofit/upgrade path — see "Re-run & retrofit" below.

## Procedure

1. **Locate the inception interview** — the `000-inception/` directory under `docs/plans/`.
   - **None exists** → offer to start inception, **brief first** (T29 — rationale and format: "The Brief" in `ai/STANDARDS/INTERVIEW_STANDARD.md`): ingest whatever concept context the repo holds (README, PRD/spec/concept docs, code, roadmap issues) and generate `000-inception/00-BRIEF.md` — AI-drafted understanding citing its sources when context exists, a prompt-guided skeleton for the human when not. Then **stop**: no questions are generated until the human edits and approves the brief.
   - **Brief exists but `Status: draft`** → re-ingest the human's edits, refine, report what still reads vague; **stop** until approved.
   - **Brief approved, sections not yet generated** → generate the interview directory from `bootstrap/QUESTION_BANK.md` per `ai/STANDARDS/INTERVIEW_STANDARD.md` (a `00-INDEX.md` hub + one section file per spine section, every question expanded into the full block format), **seeded by the brief**. Detect what you can before writing questions — stack, commands, layout, git remote — and bake detections *and the brief's statements* into each question's **Recommendation/Default** so the human confirms instead of researching. Then **stop**: answering is async and at the human's pace; `/bootstrap` resumes on a later run.
   - **Exists, but questions are still `open`/`in-discussion`** → re-ingest new answers, update statuses and the index, generate follow-up questions where answers open threads (same format, IDs appended in-section), and report what still blocks completion. Offer to apply defaults to anything the human is happy to defer (status → `deferred`, default recorded in `Final:`). Stop unless the interview is now complete.
   - **Complete** (every question `finalized` / `deferred` / `superseded`) → continue.

2. **Fill placeholders from `Final:` fields.** `bootstrap/PLACEHOLDERS.md` is the authoritative token list; `bootstrap/INTERVIEW.md` maps each token to the interview answers that feed it. Replace every `{{TOKEN}}` across the repo (`CLAUDE.md`, `ai/**`, `docs/**`, `.claude/commands/*`, `CHANGELOG.md`, `VERSION`). Do NOT edit files under `bootstrap/` (they document the tokens). Also:
   - Write the project's version files list into `ai/scripts/version-files.txt`; seed `VERSION` (default `0.1.0`) and `CHANGELOG.md`'s first heading.
   - Strip the one-line genericization banner at the top of each `ai/STANDARDS/*` and `ai/TEMPLATES/*` file — its job is done once adapted.
   - Anything no `Final:` answers (rare — mechanical facts like an exact migrate command), detect and confirm in chat; do not reopen interview ground.

3. **Generate the founding artifacts from `Final:` fields** — every derived artifact gets a `Source:` citation (qualified Q-ID, e.g. `000/Q-ARCH-03`) and is listed back on the question's `Derived:` line and in `00-INDEX.md`:
   - **Non-negotiables** → `CLAUDE.md` (from the scope section's answers).
   - **Initial ADRs** for the settled architecture/infrastructure/data choices; **decision-log entries** for product/scope calls.
   - **Compliance register**: in `docs/compliance/COMPLIANCE_REGISTER.md`, stamp the universal Baseline rows (today's date as Verified; assign owners), then walk the trigger map in `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md` with the audience/data/feature answers and pre-populate the conditional rows that fire (status ☐, today's date as Verified). Remove the worked-example comment block once real rows exist.
   - **Glossary seeds**: add the project's Domain terms to `docs/GLOSSARY.md` from the identity/scope answers (domain vocabulary, non-negotiables terms) plus any compliance terms whose triggers fired (e.g. DPIA only if the minors trigger fires). The Technical section ships pre-seeded; after bootstrap the glossary grows only via its recording rules. **Persona seeds**: populate `docs/PERSONAS.md` from the audience answers (who they are, goals, role/permission mapping, context/constraints); remove its worked example once real personas exist.
   - **Scaffold plan**: from the answers, offer the modules that apply now (database → `db`, UI → `ui`, …) and install each accepted one with `bash ai/scripts/scaffold-module.sh <module>` — offered, never silent. The rest stay staged for their triggers.
   - **Project README** — generate it from the answers (name, tagline, what/why, commands, layout, doc pointers). Draft from `Final:` fields with a light structural skeleton: title + tagline, a short "what is this", Getting started (commands), Layout, and pointers to `CLAUDE.md`, `ai/agent-setup.md`, and `docs/kit/WORKFLOW.md`. The README is a user-facing doc surface: it falls under the documentation standard's same-PR keep-current rule from day one.
   - **LICENSE** — per the license answer: write the standard MIT or Apache-2.0 text with the answered copyright holder; proprietary → no LICENSE file (all rights reserved); undecided → no file plus a revisit marker in the decision log.

4. **Configure the harness.** Offer to set up `.claude/settings.json` permissions for the detected commands, and ask whether any project-specific hooks are wanted (see `.claude/hooks/README.md`).

5. **Set up the issue tracker.** Two parts:
   - **Labels:** edit the `area:*` section of `ai/scripts/bootstrap-labels.sh` to this project's functional areas (from the interview), then — if the tracker is GitHub and `gh` is authenticated — offer to run it (idempotent). Other trackers: mirror the manifest table by hand.
   - **Project board:** every repo gets one (see "Project Board & Issue Lifecycle" in `ai/STANDARDS/TASK_ISSUE_STANDARD.md`) **including the Horizon field and Roadmap view** ("Setup (once per repo)" in `ai/STANDARDS/ROADMAP_STANDARD.md`). If `gh` has the `project` scope, offer `gh project create` + `gh project link` + the Horizon field command; walk the user through the UI-only parts either way.

6. **Generate the human-setup checklist.** Collect every remaining step only a human can do — from the interview answers and this run's leftovers: `gh` scopes (`gh auth refresh -s project` for the board), tracker/board UI-only steps, CI secrets, access tokens and API keys for chosen integrations, third-party signups, store/developer accounts. Write them to `SETUP_CHECKLIST.md` at the repo root — per item: what to set up and why, step-by-step instructions, and alternatives where they genuinely exist (e.g. fine-grained PAT vs. broader OAuth scopes). It's a checklist, not a living doc: anything that will be done twice belongs in `docs/runbooks/` instead. On later runs, check it — once the human confirms everything is done, **offer to delete the file** (graduating recurring items to runbooks first).

7. **Verify.** Run:
   ```bash
   grep -rnoE '\{\{[A-Z_]+\}\}' . --include='*.md' --include='*.sh' --include='*.json' --include='*.txt' \
     | grep -vE '/bootstrap/|/README.md|\{\{(TOKEN|TOKENS|PLACEHOLDER|DOUBLE_BRACE)\}\}'
   ```
   It should return nothing (the excluded tokens are meta-literals — see `bootstrap/PLACEHOLDERS.md`). Also confirm `bootstrap/KIT_VERSION` exists and records the scaffold. (Snippet is macOS/Linux; on Windows use `rg "\{\{"` or an editor's project-wide search.)

8. **Hand off.** Summarize: what was filled and generated, which modules were installed vs left staged, which questions were deferred on defaults, and what remains by hand — pointing at `SETUP_CHECKLIST.md` for all of it. Suggest committing the bootstrapped state as the first commit. Point at `docs/kit/WORKFLOW.md` for what comes next and `ai/agent-setup.md` as the living orientation doc.

## Re-run & retrofit

Re-running `/bootstrap` must be safe (idempotent-ish) and serves two cases:

- **Updating an already-bootstrapped project:** re-detect, show what's filled, and offer to update specific values rather than re-asking everything. Never regenerate an artifact that has diverged by hand — propose an edit instead.
- **Retrofitting an existing repo** (adopted the kit late, or scaffolded from an older kit): offer to add the missing kit pieces one by one — label manifest, project board, `bootstrap/KIT_VERSION` marker, staged modules, founding docs that never got seeded, an inception interview for the parts of the spine that were never answered. The same mechanism serves kit upgrades.

Retrofit is additive only. When the repo needs more than additions — untidy naming/layout/tracker → `/conform`; a rebuild worth salvaging inputs from → `/rebaseline`.

## Notes

- The interview is resumable across sessions by design — never force synchronous answering; re-ingest whatever landed and report status.
- Keep `CLAUDE.md` tight after filling — it loads every session. Delete commentary `<!-- ... -->` blocks once their guidance is no longer needed.
