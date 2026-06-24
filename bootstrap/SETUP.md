# Manual Setup Checklist

The hand-fill alternative to `/bootstrap`. Use this if you'd rather not run the interview.

## 1. Fill placeholders

Read `bootstrap/PLACEHOLDERS.md` for what each token means, then replace every `{{TOKEN}}`
across the repo. Find them all:

```bash
grep -rn '{{' . --include='*.md' --include='*.sh' --include='*.json' --include='*.txt' | grep -v '/bootstrap/'
```

Do NOT edit files under `bootstrap/` — they document the tokens themselves.

The order that matters most:
- [ ] `CLAUDE.md` — identity, `{{APP_LAYOUT}}`, `{{NON_NEGOTIABLES}}`, commands
- [ ] `ai/scripts/version-files.txt` — list the files that hold a version (default just `VERSION`)
- [ ] `ai/STANDARDS/*` — replace command/path/tracker tokens
- [ ] `ai/CHECKLISTS/*`, `ai/TEMPLATES/*`, `ai/agent-setup.md`
- [ ] `CHANGELOG.md` heading, `VERSION` (default `0.1.0`)

## 2. Prune what doesn't apply
- [ ] No database → delete `ai/STANDARDS/DATABASE_SCHEMA_STANDARD.md` + its `CLAUDE.md` reference
- [ ] No UI → delete `ai/STANDARDS/UI_STANDARD.md` + its references; drop UI items from checklists
- [ ] No formal quality-agent process → the report templates/scripts are optional; keep or remove

## 3. Wire the harness
- [ ] Add this project's commands to `.claude/settings.json` `permissions.allow` so they don't prompt
- [ ] Add any hooks you want (`.claude/hooks/README.md` has examples)

## 4. Verify
- [ ] This returns nothing (excludes runtime/meta tokens — see `PLACEHOLDERS.md`):
  ```bash
  grep -rnoE '\{\{[A-Z_]+\}\}' . --include='*.md' --include='*.sh' --include='*.json' --include='*.txt' \
    | grep -vE '/bootstrap/|/README.md|\{\{(DATE|IMP_ID|FEATURE|TOKEN|TOKENS|PLACEHOLDER|DOUBLE_BRACE)\}\}'
  ```
- [ ] `bash ai/scripts/check-version-sync.sh` passes
- [ ] Scripts are executable: `chmod +x ai/scripts/*.sh ai/scripts/lib/*.sh`

## 5. First commit
- [ ] Commit the bootstrapped state.
