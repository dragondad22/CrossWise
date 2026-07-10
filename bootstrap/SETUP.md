# Manual Setup Checklist

The hand-fill alternative to `/bootstrap`. Use this if you'd rather not run the interview.

## 1. Fill placeholders

Read `bootstrap/PLACEHOLDERS.md` for what each token means, then replace every `{{TOKEN}}`
across the repo. Find them with your editor's project-wide search for `{{`, or via CLI:

```
# cross-platform (ripgrep):
rg "\{\{" -g '!bootstrap/**'
# macOS / Linux (POSIX grep):
grep -rn '{{' . --include='*.md' --include='*.sh' --include='*.json' --include='*.txt' | grep -v '/bootstrap/'
```

Do NOT edit files under `bootstrap/` — they document the tokens themselves.

The order that matters most:
- [ ] `CLAUDE.md` — identity, `{{APP_LAYOUT}}`, `{{NON_NEGOTIABLES}}`, commands
- [ ] `ai/scripts/version-files.txt` — list the files that hold a version (default just `VERSION`)
- [ ] `ai/STANDARDS/*` — replace command/path/tracker tokens
- [ ] `ai/CHECKLISTS/*`, `ai/TEMPLATES/*`, `ai/agent-setup.md`
- [ ] `CHANGELOG.md` heading, `VERSION` (default `0.1.0`)

## 2. Install the modules that apply (additive — nothing to prune)
Optional content ships as modules, staged dormant under `bootstrap/modules/` at scaffold
time (`bootstrap/modules/README.md` explains the staging).
- [ ] See what's available: `bash ai/scripts/scaffold-module.sh list`
- [ ] Install what applies **now** (e.g. `db` if there's a database): `bash ai/scripts/scaffold-module.sh <name>`, then fill the new files' tokens
- [ ] Leave the rest staged — install later when its trigger fires (first UI code, first deploy target, …)
- [ ] If you copied files by hand instead of running the kit's scaffold engine, check that
      `bootstrap/KIT_VERSION` exists and records the kit version you copied from (its header
      comment shows the shape)

## 3. Wire the harness
- [ ] Activate PR-validation CI: fill the tokens in `.github/workflows/pr-validation.yml.example`,
  uncomment the gates the project has, rename to `pr-validation.yml` (GitHub Actions;
  other CI: port the gate list — the file's header explains)
- [ ] Add this project's commands to `.claude/settings.json` `permissions.allow` so they don't prompt
- [ ] Add any hooks you want (`.claude/hooks/README.md` has examples)
- [ ] Edit the `area:*` section of `ai/scripts/bootstrap-labels.sh` to your project's areas,
  then apply the label taxonomy: `bash ai/scripts/bootstrap-labels.sh` (GitHub; idempotent).
  Other trackers: mirror the manifest table by hand.
- [ ] Create the project board (one per repo) per "Project Board & Issue Lifecycle" in
  `ai/STANDARDS/TASK_ISSUE_STANDARD.md`: Status = Backlog / Next / In progress / Done,
  the two saved views, and the "Item closed → Done" + auto-add workflows.

## 4. Verify
- [ ] A project-wide search for `{{` finds nothing outside `bootstrap/` (ignore the meta
  tokens listed in `PLACEHOLDERS.md`). macOS / Linux CLI equivalent:
  ```
  grep -rnoE '\{\{[A-Z_]+\}\}' . --include='*.md' --include='*.sh' --include='*.json' --include='*.txt' \
    | grep -vE '/bootstrap/|/README.md|\{\{(TOKEN|TOKENS|PLACEHOLDER|DOUBLE_BRACE)\}\}'
  ```
- [ ] `bash ai/scripts/check-version-sync.sh` passes
- [ ] The `ai/scripts/*.sh` automation runs (POSIX shell — native on macOS/Linux; Git Bash or WSL
  on Windows). On macOS/Linux, make them executable first: `chmod +x ai/scripts/*.sh ai/scripts/lib/*.sh`

## 5. First commit
- [ ] Commit the bootstrapped state.
