# Performance Smoke Standard


## Purpose
Provide a lightweight performance / environment-health signal against a deployed target.
Because it measures a *deployed environment* (not the diff), it reflects environment health
rather than a per-PR code regression. Recommended cadence: run it on a **schedule**
(e.g. nightly) and on **manual dispatch** in `GitHub Actions (.github/workflows/deploy.yml): lint + test + build on PRs to main; deploy to Vercel on push to main` — *not* on every PR — and run
it on demand when validating a specific change.

## Measurements
Pick the signal that actually matters for this project (`Puzzle generation stays fast for lists up to 150 items; API routes respond well under typical load (set concrete p95 thresholds once measured)`). The structure
below is an example using a health endpoint; replace with the project's real critical path:
- **Startup latency:** time from process start to first successful response.
- **p95 latency:** the p95 of repeated requests to `Puzzle generation stays fast for lists up to 150 items; API routes respond well under typical load (set concrete p95 thresholds once measured)` during the smoke run.

## Default Thresholds
Make thresholds overridable via environment variables. Set them from `Puzzle generation stays fast for lists up to 150 items; API routes respond well under typical load (set concrete p95 thresholds once measured)`;
example values (replace with the project's real budgets):
- `PERF_STARTUP_SLA_MS` — max acceptable startup latency (example: `20000`).
- `PERF_P95_SLA_MS` — max acceptable p95 latency (example: `400`).
- `PERF_REQUEST_COUNT` — number of samples per run (example: `40`).

## Execution
Run via the project's perf entry point:
- `ai/scripts/performance-smoke.sh <CW-NNN> <feature-slug>` (kit ships a
  stub; wire it to measure `Puzzle generation stays fast for lists up to 150 items; API routes respond well under typical load (set concrete p95 thresholds once measured)` for this project).

## Outcome Rules
- `PASS`: all measured values are at or below their thresholds.
- `PASS-WITH-ISSUES`: slight drift, but below the blocking threshold (record it).
- `FAIL`: a threshold was breached.
- `BLOCKED`: the benchmark could not execute (record the exact blocker).

## Artifact Requirements
Stored under `testing-reports/artifacts/<date>_<CW-NNN>_<feature>_<timestamp>/`:
- Summary markdown with measured values **and** the thresholds they were judged against.
- Raw sample log (per-request latencies).
- Startup log for the process under test.
