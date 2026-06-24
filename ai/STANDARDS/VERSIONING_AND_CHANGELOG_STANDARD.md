# Versioning & Change Management Standard

Owner: dragondad22
Status: Recommended default
Last Updated: 2026-06-24

This standard governs how CrossWise tracks user-visible changes
(`CHANGELOG.md`) and how it bumps version numbers (the files listed in
`package.json`). Apply it to every PR.

---

## TL;DR

- Every PR that ships **user-visible behavior** adds a one-line entry to
  `CHANGELOG.md` under `## [Unreleased]`, in the same PR.
- Skip the entry only for purely internal work (refactors with no behavior
  change, tests, docs, comments, formatting, no-op dep bumps). When in doubt,
  add the entry.
- Versions are bumped at **release time**, not per-PR. When you cut a release,
  move all `[Unreleased]` entries under the new version heading and bump every
  file in `package.json` in lockstep.
- Releases are **timeboxed**: cut one when `[Unreleased]` is non-empty and either
  ~2 weeks have elapsed since the last release **or** a batch has accumulated
  (see "Release trigger"). No milestone planning required.
- The bump type is **mechanical**: only `Fixed`/`Security` → PATCH; any
  `Added`/`Changed` → MINOR. Pre-1.0, breaking changes are MINOR; `1.0.0` is a
  deliberate "API is stable" decision (see "When to bump the version").
- Use the **`/release`** skill (wraps the kit's generic `release.sh`) to do the
  cut — it bumps all version files and rolls the CHANGELOG in one step.
- Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).
  Versioning: [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html) (or whatever
  `SemVer` specifies).

---

## What goes in the CHANGELOG

### Always add an entry for

- New features, endpoints, screens, permissions, settings
- Bug fixes that change observable behavior
- Security fixes (note in **Security**)
- Behavior or contract changes (request/response shape, defaults, validation,
  rate limits, gates)
- Schema/migration changes that operators or integrators need to know about
- Removals or deprecations
- Breaking changes (also bump MAJOR — see below)

### Do NOT add an entry for

- Pure refactors with identical observable behavior
- Test-only changes
- Doc-only changes (README, ADR, decision log, this standard)
- Comment, formatting, lint, or rename-only commits
- Dependency bumps that do not change behavior (still note transitively if a
  dep bump fixes a CVE or changes runtime behavior)
- Build/CI tweaks invisible to users (note CI changes only when developer
  workflow changes meaningfully)

### Sections (Keep a Changelog)

Use these headings under `[Unreleased]` and each version:

- `### Added` — new features and capabilities
- `### Changed` — changes to existing behavior
- `### Deprecated` — soon-to-be-removed features
- `### Removed` — removed features
- `### Fixed` — bug fixes
- `### Security` — vulnerability fixes (do not delay disclosure for a release)

### Entry style

- One short sentence per entry, written for a human reader (operator,
  integrator, or future engineer skimming the changelog), not as a commit
  subject.
- End each line with the issue or PR number in parens: `(#112)`. Prefer the
  underlying issue number when there is one — that's the durable reference. Use
  the PR number only when there is no issue.
- Group cohesive multi-PR features under one entry where it reads naturally
  (a multi-phase redesign → one line citing all PRs).

Examples:

```
### Added
- Admin override of record status and per-entity state reset (#112)

### Fixed
- `requireApprovedDevice` honors role configuration consistently with login (#109)

### Security
- Patch `path-to-regexp` high-severity advisory via dependency audit (#49)
```

---

## When to bump the version

CrossWise follows `SemVer` (e.g. SemVer `MAJOR.MINOR.PATCH`).
The bump type is **decided mechanically** from which `[Unreleased]` subsections
have entries at cut time — there is no judgement call.

### Rubric (recommended default, active pre-1.0)

| The release contains…                                    | Bump            |
|----------------------------------------------------------|-----------------|
| only `Fixed` and/or `Security` entries                   | **PATCH** (`0.0.X`) |
| any `Added` / `Changed` / `Deprecated` / `Removed` entry | **MINOR** (`0.X.0`) |
| a deliberate "the API is stable" decision                | **MAJOR** (`1.0.0`) |

- **Pre-1.0, breaking changes bump MINOR**, not MAJOR. While you are `0.x` you
  have not promised a stable contract, so a breaking change is just another
  `Changed` entry — but prefix it `**BREAKING:**` in the CHANGELOG and call it
  out in the release notes so nobody misses it. Breaking changes include: API
  contract removals/shape changes, auth/permission semantics changes, migrations
  needing coordinated client work, and removal of CLI flags/env vars/settings.
- **MAJOR (`1.0.0`) is never automatic.** It is a one-time, deliberate decision
  that the project's contract is now stable. Until someone makes that call,
  every release is MINOR or PATCH.
- You do NOT bump per-PR. PRs accumulate under `[Unreleased]`; the bump happens
  only when a release is cut.

`release.sh` with no argument prints the recommended bump by reading the
`[Unreleased]` sections, so the rubric is applied for you.

### After 1.0 (inactive until the 1.0 cutover)

Once `1.0.0` ships, standard SemVer applies: breaking change → MAJOR, new feature
→ MINOR, bug/security-only → PATCH. Flip this section to active when the team cuts
1.0.

---

## Release trigger

Releases are **timeboxed**, not milestone-planned. Propose cutting a release —
and get human approval before doing it — when `[Unreleased]` is non-empty **and
either** of these holds (whichever comes first):

- **Time**: ~2 weeks have passed since the last release, or
- **Batch**: `[Unreleased]` has accumulated a meaningful batch (≥2 features or
  ~8+ entries).

If `[Unreleased]` is empty, skip — there is nothing to release. The AI pair checks
this at the **start of working sessions** (it cannot fire on a wall-clock by
itself) and surfaces it as a suggestion. No milestone or scope planning is
required; the calendar and the accumulated batch are the trigger.

---

## Cutting a release

Run the **`/release`** skill — it wraps the kit's `release.sh`, which performs the
mechanical steps (2–3 below). The full sequence:

1. Open a release-prep PR on a `chore/release-X.Y.Z` branch off latest `main`.
2. In `CHANGELOG.md` *(done by `release.sh <bump>`)*:
   - Replace `## [Unreleased]` with the new version + date heading
     (e.g. `## [0.2.0] - 2026-05-02`).
   - Add a fresh `## [Unreleased]` heading at the top with no entries.
   - First, consolidate `[Unreleased]` if it drifted: one block per
     Keep-a-Changelog section, drop non-standard sections, prefix breaking
     entries `**BREAKING:**`.
3. Bump every file in `package.json` in lockstep *(done by
   `release.sh <bump>`)* to the new version string. If a target platform requires
   an extra build-number component (e.g. an `X.Y.Z+N` suffix for an app store),
   increment that component as well — see "Version alignment" below.
4. Confirm the version-sync check passes at the new version (`release.sh` /
   `/preflight` run this).
5. Commit with a message like
   `chore(release): 0.2.0 — <highlights>`, push the `chore/release-0.2.0`
   branch, and open a PR into `main`.
6. **Publish after the release PR merges — a distinct, mandatory step, not part of
   the merge.** The version files being on `main` does **not** complete the
   release. Tagging/publishing has been skipped before on real projects, so
   always finish it:
   - **Tag the release merge commit** and push it:
     `git tag -a v0.2.0 <merge-sha> -m "v0.2.0 — <highlights>" && git push origin v0.2.0`.
   - **Create the release on `GitHub Issues` / your forge**, body = the
     `## [0.2.0]` changelog section (on GitHub:
     `gh release create v0.2.0 --notes-file <section> --latest`; use
     `--latest=false` when backfilling an older version).
   - **Close the version's milestone** once its items are done.
   - **Verify**: the version appears in your release list (newest = Latest) and in
     `git ls-remote --tags origin`. Every shipped `X.Y.Z` must have both a tag and
     a published release.

---

## Version alignment

- All files in `package.json` carry the **same** version string and move
  together. They are bumped only at release time, never by individual feature PRs.
- If a distribution target needs an extra monotonic build number (common for
  mobile app stores, e.g. a `+N` suffix), that file keeps the shared version
  string plus its build component; increment the build component on every release.
  Reset of the build component is fine when bumping MAJOR/MINOR if the platform
  allows it.
- Surface the version where it is observable (e.g. a `/health` or `--version`
  output, and in CI). Skewed versions across files are a smell — investigate
  before shipping.
- Run the version-sync check (shipped with the kit; also run by `/preflight`) to
  confirm all version files agree.

---

## Failure modes to avoid

- **CHANGELOG drift**: PRs merge without entries, and by release time the
  changelog has gaps that nobody can reconstruct. Mitigation: the `/preflight`
  skill warns when user-visible code changes without a `CHANGELOG.md` entry, and
  code review blocks PRs that ship behavior without a `[Unreleased]` entry.
- **Stealth version bumps**: a version file gets bumped by an individual PR while
  the others and the CHANGELOG lag. Mitigation: version files move only at
  release time, in lockstep.
- **Per-PR version bumps**: every PR bumps PATCH. Pre-1.0 this just creates
  noise. Mitigation: bump on releases, not on every PR.
- **Unscoped MAJOR bumps**: bumping MAJOR for "feels big" rather than for
  actual contract breakage. Mitigation: MAJOR requires identifiable breakage.

---

## How to apply this in practice

When writing a PR:
1. Check the box in `ai/CHECKLISTS/coding.md` under Documentation → CHANGELOG.
2. Add the entry to `[Unreleased]` in the right subsection.
3. Reference the issue number, not the PR number, when there is one.
4. Run the `/preflight` skill before committing — it warns on a missing CHANGELOG
   entry and on version drift.

When cutting a release:
1. Check the trigger (see "Release trigger") at the start of a session — if it's
   met and `[Unreleased]` is non-empty, propose the cut.
2. Run the `/release` skill. If `[Unreleased]` is nearly empty after a long lull,
   audit `git log` first to make sure no PR forgot its entry.
3. Announce the release with a link to the published release notes.

---

## Revision history

| Date       | Author          | Change |
|------------|-----------------|--------|
| 2026-06-24 | Starter kit     | Genericized from project-specific versioning standard |
