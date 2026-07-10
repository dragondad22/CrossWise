*Generic standard from the Claude starter kit — adapt to this project. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# Git Workflow Standard

Owner: dragondad22
Status: Recommended default
Last Updated: 2026-07-09

This standard governs branches, commit messages, pull requests, and merges for
CrossWise. The terse enforcement rules live in `CLAUDE.md` → Git Workflow
(loaded every session); this file carries the depth — formats, examples, and why.

---

## TL;DR

- Never commit to the default branch. One branch per work item:
  `<type>/<issue#>-<slug>`.
- Commit messages follow **lightweight Conventional Commits**: type required,
  scope optional. Types do **not** drive versioning or changelog generation.
- **Squash-merge** is the merge policy. The PR title becomes the commit that
  survives on the default branch, so the commit-format rules apply chiefly to
  PR titles; intra-PR commit messages are relaxed.
- **No AI attribution trailers** in commit messages — AI tooling appends them
  by default, so this must be actively overridden.
- Every PR references its issue (`Closes #N`) and carries its CHANGELOG entry
  when it ships user-visible behavior.

---

## Branches

- The default branch (`main` unless the project says otherwise) is protected:
  changes land only via reviewed PRs — never direct commits, never force pushes.
- One branch per tracked work item, named `<type>/<issue#>-<slug>`:
  - `feat/112-admin-override`
  - `fix/109-device-approval-role`
  - `chore/release-0.2.0` (release-prep branches — see the versioning standard)
- `<type>` uses the same vocabulary as commit types (below). The issue number
  makes the branch ↔ issue link greppable in both directions.
- Delete the branch after its PR merges — a merged branch has no further job.

## Commit messages — lightweight Conventional Commits

Format: `<type>(<scope>): <subject>` — type required, scope optional.

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`.
- Subject in the imperative, no trailing period: `feat(api): add per-entity state reset`.
- Breaking change: append `!` to the type (`feat(api)!: …`) **and** prefix the
  CHANGELOG entry `**BREAKING:**` per the versioning standard.
- **Commit types do NOT drive versioning or the changelog.** The project is
  changelog-first: the CHANGELOG is written by hand per
  `ai/STANDARDS/VERSIONING_AND_CHANGELOG_STANDARD.md`, and the version bump is
  decided from the `[Unreleased]` sections at release time. Conventional
  Commits here buys a scannable history and greppable types — it is not an
  input to semantic-release-style tooling, and adopting such tooling would be
  a recorded decision, not a drift.

### Where the format applies under squash-merge

Because PRs squash-merge, the **PR title is the commit that survives** on the
default branch — so the Conventional Commits format is enforced on PR titles.
Intra-PR commits are relaxed: keep them honestly descriptive (`wip` tells a
reviewer nothing), but they will be squashed away, so format discipline there
is not worth review cycles.

## No AI attribution trailers

Commit messages carry **no** AI attribution trailers — no `Co-Authored-By:
Claude …`, no `Generated with …` lines.

- **This must be actively overridden**: AI coding tools (Claude Code included)
  append an attribution trailer by default. Instructing the tool once in
  `CLAUDE.md` is what keeps it out of every commit.
- Why: in a mostly-AI-authored workflow the trailer is noise on every commit,
  and authorship accountability lives with the human who reviewed and merged —
  the PR record already captures how the change was produced.

## Pull requests

- **Every PR references its work item** — `Closes #N` in the body — so the
  issue closes on merge and the work is traceable from either end. Work with
  no tracked item gets an item first (see Task Tracking in `CLAUDE.md`).
- PR title: Conventional Commits format (it becomes the surviving commit).
- PR body: what changed and why, testing evidence, and anything a reviewer
  can't infer from the diff. If the change ships user-visible behavior, the
  CHANGELOG entry is in the same PR (versioning standard).
- **Merge policy: squash-merge.** One work item → one commit on the default
  branch. Merge-commit and rebase-merge are off. Who merges: the author, after
  approval and green checks — adapt if the team decides otherwise.

## Default-branch protection (assumptions)

Configure on the forge; the workflow above assumes:

- PRs required — no direct pushes to the default branch.
- The PR-validation checks (see `ai/agent-setup.md` → CI Quality Gates) must
  pass before merge.
- Force pushes and branch deletion disabled on the default branch.
- Squash-merge enabled as the only merge method (keeps the policy mechanical).

---

## Revision history

| Date       | Author      | Change |
|------------|-------------|--------|
| 2026-07-09 | Starter kit | Initial standard (kit decision T9) |
