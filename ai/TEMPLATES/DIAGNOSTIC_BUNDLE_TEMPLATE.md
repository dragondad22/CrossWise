*Generic template from the Claude starter kit — adapt to this project. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*

# Diagnostic Bundle: <CW-NNN> — <short failure title>

<!--
WHEN: a validation gate FAILED (tests, QA/UAT, security, performance, CI).
Success produces NO bundle — an exit code and a one-line summary is the entire
report. The bundle's one job: enough detail to fix the failure without
re-running it.

WHERE: local runs -> testing-reports/ (gitignored — never committed; report-only
commits polluting history is the lesson this rule encodes). CI -> uploaded as a
run artifact on failure (the PR-validation workflow does this).

ROUTING: actionable findings become tracked issues per
ai/STANDARDS/GITHUB_ISSUES.md with this bundle linked as evidence. Recurring
failure PATTERNS across bundles are evergreen-review material, not extra issues.

TABLE-LINT NOTE (single home for this rule): if a section contains markdown
tables, avoid raw `|` inside inline code in table rows — use pipe-free wording
or escape as `\|`.
-->

## What ran
- Work item: <CW-NNN or "none — routine gate">
- Commit: <`git rev-parse HEAD`> · working tree: <clean, or `git status --short` summary>
- Environment: <local | CI run URL> · <runtime/tool versions that matter>
- Commands executed, with exit codes:

| Gate | Command | Exit |
|---|---|---|
| <tests> | <`npm test`> | <1> |

## What failed
- Failing subset: <the smallest failing unit — suite/spec/scan/endpoint>
- Severity: <Blocker / High / Medium / Low — per the failing gate's standard>
- Repro: <exact command(s) + preconditions to reproduce the failure>

## Evidence
Artifacts under `testing-reports/artifacts/<date>_<CW-NNN>_<feature>_<timestamp>/`:
- <command/suite logs with exit codes>
- <failing output subset — not the full green noise>
- <UI failures: screenshots / traces / videos (Playwright writes these on failure by default)>

## Per-gate detail
<!-- One subsection per FAILED gate. Delete the rest — an empty section is
success apparatus, and success is silent. -->

### Tests
<failing tests, assertion output>

### QA / UAT
<acceptance criterion (journey step / EC-ID) that failed, observed vs expected>

### Security
<finding, scan output, boundary affected>

### Performance
<measured values vs the thresholds they were judged against; raw sample log path>

## Suspected cause
<best current hypothesis, and what evidence supports it>

## Suggested direction
<direction for the fix — not a patch>

## Self-correction attempted
| Recovery step | Result |
|---|---|
| <reinstall deps / re-run codegen / retry> | <still failing / error changed to …> |
