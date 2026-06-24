# Quality Issue Standard for Quality Agents

> This standard is written assuming **GitHub Issues** (`gh` CLI). The structure —
> severity model, title format, body fields, label mapping — ports cleanly to any
> tracker (`GitHub Issues`); replace the `gh` commands with the
> equivalent for your tracker (`https://github.com/dragondad22/CrossWise/issues`).

## Purpose
Standardize how testing/UAT/security/performance findings become actionable,
tracked issues.

## Preconditions
- Issue tracker access configured (`https://github.com/dragondad22/CrossWise/issues`).
- For GitHub: CLI installed (`gh --version`), authenticated (`gh auth status`),
  in repo root with remote configured.

## Required Labels
Recommended baseline labels:
- `bug`
- `testing`
- `uat`
- `security-review`
- `performance`
- `flaky-test`
- `coverage-gap`
- `ux`
- `accessibility`
- `documentation`
- `severity:blocker`
- `severity:high`
- `severity:medium`
- `severity:low`

Optional bootstrap command (run once, GitHub):
```bash
gh label create testing --color 0E8A16 --description "Automated testing findings" || true
gh label create uat --color 1D76DB --description "UAT findings" || true
gh label create flaky-test --color B60205 --description "Flaky or nondeterministic tests" || true
gh label create coverage-gap --color FBCA04 --description "Missing critical test coverage" || true
gh label create ux --color 5319E7 --description "UX quality issue" || true
gh label create accessibility --color 0052CC --description "Accessibility issue" || true
gh label create documentation --color 006B75 --description "Documentation drift" || true
gh label create security-review --color D93F0B --description "Security reviewer findings" || true
gh label create performance --color 0E8A16 --description "Performance smoke findings" || true
gh label create severity:blocker --color B60205 --description "Blocker severity issue" || true
gh label create severity:high --color D93F0B --description "High severity issue" || true
gh label create severity:medium --color FBCA04 --description "Medium severity issue" || true
gh label create severity:low --color C2E0C6 --description "Low severity issue" || true
```

## Severity Mapping
- `Blocker`: broken core flow, security boundary failure, data integrity risk
- `High`: acceptance criteria failure in major workflow, reproducible failing suite
- `Medium`: non-blocking functional defect, significant UX confusion
- `Low`: copy polish, minor visual inconsistency, non-critical enhancement

## Duplicate Check
Before opening a new issue (GitHub):
```bash
gh issue list --state open --search "<short phrase> in:title"
```
If a duplicate exists, link the existing issue in the report instead of creating
a new one.

## Title Format
Use `CW-XXX` for the work-item ID (e.g. `IMP-006`).
- TESTER: `[TEST][CW-XXX][Severity] Short summary`
- UAT: `[UAT][CW-XXX][Severity] Short summary`
- SECURITY REVIEWER: `[SEC][CW-XXX][Severity] Short summary`
- PERFORMANCE SMOKE: `[PERF][CW-XXX][Severity] Short summary`

## Required Issue Body Fields
- Environment
- Build/SHA
- Steps to reproduce
- Expected behavior
- Actual behavior
- Evidence (artifact paths, screenshots, logs)
- Impact
- Suggested fix direction (no direct code patch in issue body)

## CLI Example (GitHub)
```bash
gh issue create \
  --title "[TEST][IMP-006][High] OTP suite intermittently fails on lockout boundary" \
  --label "bug,testing,flaky-test" \
  --body-file /tmp/issue.md
```

## Report Linking Rule
Every created issue must be linked in the corresponding report under `Issues
Created` with severity and area.

## Triage SLA Governance
- Follow `ai/STANDARDS/ISSUE_TRIAGE_SLA.md` for board workflow and SLA targets.
- Every new issue must include one severity label and one flow label (`testing`,
  `uat`, `security-review`, or `performance`).

## Other Rules
- Never use backticks in issue comments.
