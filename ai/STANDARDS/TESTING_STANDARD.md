# Testing Standard


## Purpose
Define how to run trustworthy test validation after any code change. The goal is
*evidence*, not vibes: a pass/fail claim only counts if it maps to real command output.

## Authority Order
When guidance conflicts, follow the higher source:
1. The active implementation plan / work-item spec
2. Acceptance / UAT criteria for the change
3. The project QA checklist
4. This file
5. The issue/bug reporting standard

## Non-Negotiables
- **Evidence-first:** every pass/fail claim must map to command output or a captured artifact.
- **Security-critical flows** (authentication, authorization, and — *if applicable* —
  tenant/data isolation) are always high-priority coverage areas.
- **Negative-path testing is mandatory:** for any access-controlled behavior, prove the
  *denial* path as well as the success path (unauthenticated, under-privileged, wrong owner).

## Project Test Inventory
Fill this in with the project's real entry points:
- Full / primary test suite: `npm test`
- End-to-end / browser suite (if any): `N/A`
- Build / typecheck (must pass before tests are meaningful): `npm run build`
- Data-layer codegen / migration prep (if the `Prisma + PostgreSQL` requires it before tests run):
  e.g. generate the ORM client / apply migrations to the test database.

> Note which runner is canonical for each surface (backend, frontend, mobile, etc.) so
> reports are unambiguous about *what* was executed.

## Required Execution Matrix
Run all applicable suites for the impacted components:
- **Backend changes:** run any required data-layer codegen, then `npm test` for the backend.
- **Frontend changes:** run the frontend unit suite (and `N/A` if the change is user-visible flow).
- **Mobile / other-surface changes:** run that surface's suite (or report `BLOCKED` with reason if the toolchain is unavailable).
- **Cross-cutting auth / session / authorization changes:** *all* affected surfaces' suites are mandatory, not just one.

## Test Integrity Audit (Required)
Run these scans from the repo root and include the output in report artifacts. They catch
tests that pass by *not testing anything*. Adjust the file globs to this project's
`TypeScript` and test file conventions.

```bash
# Skipped / disabled tests
rg -n --glob '<test-file-glob>' '\b(it|test|describe)\.skip\('
rg -n --glob '<test-file-glob>' '\b(xit|xtest|xdescribe)\('
# Tautological assertions (assert literally-true / always-true)
rg -n --glob '<test-file-glob>' 'expect\(.*\)\.toBe\(true\)'
rg -n --glob '<test-file-glob>' 'return\s+true;?'
```

Interpretation:
- Exit `1` from `rg` means **no matches** (a clean result).
- Any match is a **review flag** — it may still be legitimate, but it must be explained
  in the report, not silently accepted.

## Data Realism Review (Required)
- Prefer DB-backed / real-integration tests for authentication, authorization, and (if
  applicable) data-isolation behavior. These are exactly the paths where mocks hide bugs.
- Treat **excessive mocking in core security/session flows** as a risk unless explicitly justified.
- For each significant mock/stub of a critical path, confirm at least one integration-level
  test exercises the real behavior end-to-end.

## Coverage Adequacy Rules
- Every changed route / service / middleware (or equivalent backend unit) should map to a test.
- Every changed UI page / component / shared lib should map to a test.
- Every changed unit on any other surface should map to that surface's tests.
- **A missing mapping in a critical path is an issue-worthy coverage gap** — file it, don't bury it.

## Self-Correction Protocol
When execution fails due to setup/tooling (not a real defect):
1. Retry after environment repair (**max 2 attempts**), in this order:
   - Install / restore dependencies for the impacted component.
   - Re-run any required data-layer codegen / migration step for `Prisma + PostgreSQL`.
   - Re-run the failed suite.
2. If still blocked, mark the report outcome `BLOCKED`.
3. Record the **exact blocker** and the **exact human action** needed to unblock.

## Evidence and Artifact Requirements
For each run, collect artifacts under a timestamped directory, e.g.:
- `testing-reports/artifacts/<date>_<CW-NNN>_<feature>_<timestamp>/`

Minimum artifacts:
- Command log per suite (with exit codes).
- Integrity-scan logs.
- A summary markdown noting outcomes and exit codes.
- Optional screenshots (for UI failures).
- If the report itself contains markdown tables, lint them: avoid raw `|` inside inline
  code cells within tables; escape as `\|` when unavoidable.

> The kit ships helper-script stubs (e.g. an evidence-collection script). Wire them to
> `npm test` / `N/A` for this project, or run the commands directly.

## Outcome Definitions
- `PASS`: required suites passed, no critical findings.
- `PASS-WITH-ISSUES`: suites passed but non-blocking risks/findings exist (record them).
- `FAIL`: a required suite failed due to a product defect.
- `BLOCKED`: required validation could not execute due to environment/access/tooling blockers.
