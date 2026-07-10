Salvage-and-rebuild for a messy or false-start repo: harvest what the repo already knows into a pre-answered inception interview, critique the current implementation, agree a rebuild plan with the human, then execute it as normal tracked work. Never a big-bang rewrite.

`/rebaseline` is the **heavy** adoption tier — for repos where the concept is sound but the implementation is wrong or lacking. Lighter paths first: merely untidy (naming, doc layout, structure, tracker) → `/conform`; just missing kit pieces → `/bootstrap` retrofit; routine currency → `/evergreen`'s kit-delta lens.

## Procedure

1. **Precondition — kit installed.** This procedure runs on the kit's interview machinery, standards, and commands. If they aren't present, install the core first (additive, never overwrites — `bootstrap/SETUP.md` / `/bootstrap` retrofit), then continue.

2. **Harvest — inception run in reverse.** Read the whole repo: code, docs, git history (intent, dead ends, abandoned directions), and the existing UI. Generate the standard inception interview (the `000-inception/` directory under `docs/plans/`, from `bootstrap/QUESTION_BANK.md`, format per `ai/STANDARDS/INTERVIEW_STANDARD.md`) **pre-answered**: every question's Recommendation/Default is cited to evidence in the repo (file paths, commits, observed behavior) so the human confirms or corrects instead of researching. Salvage verdicts are first-class answers — "this part was a false start — discard" is a legitimate `Final:`. If a `000-inception/` already exists, extend it with follow-ups; never clobber or renumber. Add the rebaseline-specific questions, same block format:
   - **In-place vs fresh repo** — recommend **in-place** (rebuild on branches in the existing repo, history preserved) as the default; offer fresh-repo-and-port only when the harvest suggests the damage is structural.
   - **Per-component salvage verdicts** — keep / rework / discard for each major piece, each cited to evidence.
   - **UI critique** — alongside the standard UI questions (what UI is wanted), ask what the human likes and dislikes about the *current* design: covers both the function-only UI needing design work and the UI whose UX is off.

3. **Critique pass — orchestrate the shipped commands, never a parallel engine.** Run against the repo as-is and feed every finding into the interview (as Recommendation/Default evidence or as follow-up questions):
   - Code quality + test coverage → `/qa` and the testing standard's integrity checks.
   - Security → `/security`. Compliance → `/compliance`. Performance → `/perf` (where a smoke exists).
   - Standards drift and process health → the `/evergreen` lenses.
   - **Tracker surface** → existing issues, labels, project board, issue templates/types, and repo settings measured against `ai/STANDARDS/TASK_ISSUE_STANDARD.md`, `ai/STANDARDS/ROADMAP_STANDARD.md`, and `ai/STANDARDS/GIT_WORKFLOW_STANDARD.md`.
   Findings feed the interview; nothing is fixed, deleted, or reorganized during harvest or critique.

4. **Stop — answering is async.** The human confirms/corrects in the files at their own pace (`ai/STANDARDS/INTERVIEW_STANDARD.md`); re-runs re-ingest new answers, update statuses, and generate follow-ups. Talk the plan through until common understanding is reached — **the interview statuses are the record of that agreement**: complete = every question `finalized` / `deferred` / `superseded`.

5. **Close inception, then break the plan down.** Once complete, run `/bootstrap` to fill placeholders and generate the founding artifacts from the `Final:` fields (with `Source:`/`Derived:` provenance as usual). Decompose the agreed rebuild plan into epics / features / tasks per `ai/STANDARDS/TASK_ISSUE_STANDARD.md` — epics as parent issues with sub-issues, every item traceable to its originating question. Discard verdicts become their own tracked removal tasks.

6. **Execute as normal work.** Branch-per-issue with the normal gates (`/preflight`, `/qa`, `/security`, PR review) — the rebuild is ordinary tracked development from here. Fresh-repo answer: scaffold the new repo, port salvaged parts as tracked issues, archive the old repo only when the human says so.

## Notes

- **Nothing is destroyed on the way in.** Deleting code, moving files, or rewriting behavior happens only through the agreed plan's tracked issues — never during harvest or critique.
- Resumable across sessions by design; each run reports what still blocks completion.
