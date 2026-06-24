Cut a release — bump the version file(s) in lockstep and roll the CHANGELOG.

Follow `ai/STANDARDS/VERSIONING_AND_CHANGELOG_STANDARD.md`. Versions move only at release time, in lockstep; the bump type comes from the rubric, not from feel.

1. **Confirm the trigger.** A release is due when `[Unreleased]` in `CHANGELOG.md` is non-empty AND either ~2 weeks have passed since the last release or a batch has accumulated (≥2 features / ~8+ entries). If `[Unreleased]` is empty, stop — nothing to release.
2. **Confirm the branch.** Work on a release-prep branch off the latest default branch (e.g. `chore/release-X.Y.Z`), not on the default branch directly.
3. **Check sync.** Run `bash ai/scripts/check-version-sync.sh`. If it reports drift, fix that first — do not cut a release on top of drift.
4. **Get the bump.** Run `bash ai/scripts/release.sh` (no arg) to see the recommended bump from `[Unreleased]` (only Fixed/Security → patch; any Added/Changed → minor). MAJOR/1.0.0 is never auto-recommended pre-1.0 — only on an explicit "API is stable" decision.
5. **Consolidate `[Unreleased]` first** if it drifted: merge duplicate `### Added`/`### Fixed`/`### Changed` blocks, drop non-standard sections, prefix breaking entries with `**BREAKING:**`.
6. **Cut.** Run `bash ai/scripts/release.sh <bump>` (add `--date YYYY-MM-DD` only to override today). Show the resulting `git diff`.
7. **Verify.** `[Unreleased]` is now empty, `## [X.Y.Z] - DATE` is populated, and `bash ai/scripts/check-version-sync.sh` passes at the new version.
8. **Approval + commit + PR.** Ask the user to approve, then commit `chore(release): X.Y.Z — <highlights>`, push the branch, and open a PR into the default branch.
9. **Publish after merge (do not skip — its own step).** Once merged: sync the default branch, tag the merge commit (`git tag -a vX.Y.Z <sha> -m "..." && git push origin vX.Y.Z`), and create the release on the host (e.g. `gh release create vX.Y.Z --notes-file <changelog section> --latest`). Verify the tag and release are published.
