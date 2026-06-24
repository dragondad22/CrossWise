Run pre-commit validation to catch issues before committing.

1. Run `git diff --name-only` to identify changed files and which areas they touch.
2. For the affected areas, run in order:
   - **Build / typecheck**: `npm run build`
   - **Lint**: `npm run lint` (skip if N/A)
   - **Tests**: `npm test`
3. Quick security scan on changed files (see `ai/STANDARDS/SECURITY_REVIEW_STANDARD.md`):
   - Missing authorization/permission checks on new entry points
   - Untrusted input used without validation
   - `.env` files or credentials in staged changes
4. CHANGELOG + version checks (`ai/STANDARDS/VERSIONING_AND_CHANGELOG_STANDARD.md`):
   - If the diff ships user-visible behavior but `CHANGELOG.md` is NOT among the changed files, warn: "user-visible change with no `[Unreleased]` entry — add one (skip only for purely internal work)."
   - Run `bash ai/scripts/check-version-sync.sh` and report any version drift.
5. Documentation check (`ai/STANDARDS/DOCUMENTATION_STANDARD.md`):
   - If the diff touches user-visible behavior but no docs were updated, warn and point at the relevant doc surface.
6. Compliance trigger check (`ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`):
   - If the diff touches a public API, web UI, a mobile release, messaging/UGC, payments, or personal data, run the trigger map (or suggest `/compliance`). Warn on any fired trigger missing from `docs/compliance/COMPLIANCE_REGISTER.md`.
6. Report results: all passed, or list failures/warnings with file paths and error messages.
7. If all checks pass, confirm ready to commit.
