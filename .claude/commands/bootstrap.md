Bootstrap this starter kit into a real project by interviewing the user and filling every `{{PLACEHOLDER}}` in place.

This is a one-time setup command. Run it right after copying the kit into a new repo.

## Procedure

1. **Detect what you can before asking.** Inspect the repo so you don't ask what you can read:
   - Stack: look for `package.json`, `pyproject.toml`/`requirements.txt`, `go.mod`, `Cargo.toml`, `pubspec.yaml`, `*.csproj`, `Gemfile`, etc.
   - Test/build/dev commands: read `package.json` scripts, `Makefile`, `justfile`, `pyproject.toml`, CI workflow files.
   - Repo remote: `git remote -v`.
   - Existing layout: list top-level dirs.
   Summarize what you detected and what you'll assume, so the interview only covers gaps and confirmations.

2. **Read `bootstrap/PLACEHOLDERS.md`** — it is the authoritative list of every token and its meaning.

3. **Interview the user** using `bootstrap/INTERVIEW.md` as the question script. Prefer the AskUserQuestion tool for choices; ask open questions in chat for free-text (project name, tagline, non-negotiables). Group questions; don't ask one at a time. For anything you confidently detected, present it as a default to confirm rather than an open question.
   - The single highest-value answer is **`- **User-data isolation**: every query is scoped to the authenticated user; a user can only read/write their own topics, lists, puzzles, and solves.
- **Password safety**: passwords are bcrypt-hashed — never stored or logged in plaintext.
- **Session cookies**: `httpOnly`, `sameSite=lax`, `secure` in production; session tokens stored server-side and revoked on logout.
- **No data loss on autosave**: local autosave must never silently lose solve progress; server sync reconciles without clobbering newer local state.
- **Deterministic generation**: puzzle generation is seeded and reproducible for a given list + seed.`** — push gently for at least one real architectural constraint. If the user has none yet, write "None recorded yet; add as they are decided."
   - For any token that genuinely doesn't apply (e.g. no database, no UI), mark it so you can prune the section (see step 5).

4. **Fill placeholders.** Replace every `{{TOKEN}}` across the repo with the collected values. Cover: `CLAUDE.md`, `ai/STANDARDS/*`, `ai/CHECKLISTS/*`, `ai/TEMPLATES/*`, `ai/agent-setup.md`, `ai/scripts/*`, `docs/*`, `CHANGELOG.md`, `VERSION`, `.claude/commands/*`. Do NOT edit files under `bootstrap/` (they document the tokens themselves).
   - Write the version files list the project actually uses into `ai/scripts/version-files.txt`.
   - Seed `VERSION` (default `0.1.0`) and `CHANGELOG.md`'s first heading.
   - Strip the one-line *genericization banner* at the top of each `ai/STANDARDS/*` and `ai/TEMPLATES/*` file (the italic / HTML-comment note telling the reader to replace tokens) — its job is done once the kit is adapted.
   - Leave the **runtime tokens** (`{{DATE}}`, `{{IMP_ID}}`, `{{FEATURE}}`) untouched in `ai/TEMPLATES/` — `new-report.sh` fills them per report. See `bootstrap/PLACEHOLDERS.md`.
   - **Seed the compliance register.** Using the platform/audience/data/feature answers, walk the trigger map in `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md` and pre-populate `docs/compliance/COMPLIANCE_REGISTER.md`'s "Active obligations" with the rows that fire (status ☐, today's date as Verified). Remove the worked-example comment block once real rows exist.

5. **Prune what doesn't apply.** Remove optional standards/sections the user opted out of:
   - No database → delete `ai/STANDARDS/DATABASE_SCHEMA_STANDARD.md` and its reference in `CLAUDE.md`.
   - No UI → delete `ai/STANDARDS/UI_STANDARD.md` and its references; drop UI items from the checklists.
   - No formal UAT/quality-agent process → keep the standards but tell the user they're optional.
   Confirm each deletion with the user before removing a file.

6. **Configure the harness.** Offer to set up `.claude/settings.json` permissions for the detected commands (the test/build/lint/dev commands) so they don't prompt each session, and ask whether any project-specific hooks are wanted (e.g. regenerate a client after a schema edit — see `.claude/hooks/README.md`).

7. **Verify.** Run:
   ```bash
   grep -rnoE '\{\{[A-Z_]+\}\}' . --include='*.md' --include='*.sh' --include='*.json' --include='*.txt' \
     | grep -vE '/bootstrap/|/README.md|\{\{(DATE|IMP_ID|FEATURE|TOKEN|TOKENS|PLACEHOLDER|DOUBLE_BRACE)\}\}'
   ```
   It should return nothing (the excluded tokens are runtime/meta-literals — see `bootstrap/PLACEHOLDERS.md`). Report any stragglers and fix them.

8. **Hand off.** Summarize: what was filled, what was pruned, what the user still needs to do by hand (e.g. fill `- **User-data isolation**: every query is scoped to the authenticated user; a user can only read/write their own topics, lists, puzzles, and solves.
- **Password safety**: passwords are bcrypt-hashed — never stored or logged in plaintext.
- **Session cookies**: `httpOnly`, `sameSite=lax`, `secure` in production; session tokens stored server-side and revoked on logout.
- **No data loss on autosave**: local autosave must never silently lose solve progress; server sync reconciles without clobbering newer local state.
- **Deterministic generation**: puzzle generation is seeded and reproducible for a given list + seed.` further, set up CI secrets, wire the issue tracker). Suggest committing the bootstrapped state as the first commit. Point them at `ai/agent-setup.md` as the project's living orientation doc.

## Notes

- Bootstrapping is idempotent-ish: re-running it should re-detect and let the user update values. If tokens are already filled, offer to update specific ones rather than re-asking everything.
- Keep `CLAUDE.md` tight after filling — it loads every session. Delete commentary `<!-- ... -->` blocks once their guidance is no longer needed.
