# Security Review Standard


## Purpose
Define a repeatable security regression review for the project's trust boundaries:
authentication, authorization, session/credential handling, and account-security actions.

## Scope
- Authentication and session controls.
- Authorization / access-control enforcement (every layer it is enforced at).
- Credential-recovery and second-factor flows (password reset, OTP/MFA), if present.
- Admin/privileged actions that affect account security.
- **Multi-tenant isolation (if applicable):** see the optional subsection below.

## Universal Security Concerns (always in scope)
These are not stack- or domain-specific — review them on every security-relevant change:
- **Input validation:** all external input validated and bounded at the trust boundary.
- **Secrets handling:** no secrets in source, logs, or error messages; secrets sourced from
  a secret store / env, never hard-coded.
- **Authn / authz:** identity is verified, and every privileged action is authorized
  server-side (never trust client-asserted roles, IDs, or permissions).
- **Least privilege:** code, tokens, and credentials hold the minimum scope needed.
- **Dependency scanning:** known-vulnerable dependencies are surfaced and triaged.
- **No secrets in logs:** see the logging standard — operational logs never carry tokens,
  credentials, or sensitive bodies.

## Required Regression Pack
Run via the project's security-scan entry point:
- `ai/scripts/security-review.sh <CW-NNN> <feature-slug>` (kit ships a stub; wire it to the commands below)
- Or directly: `npm audit`

The pack must include:
- Any required data-layer codegen for the backend (so tests run against a real client).
- Targeted security regression tests in the backend.
- Source scans for risky authorization-trust patterns (see Scan Interpretation Rules).

## CI Security Gates
Wire these into `GitHub Actions (.github/workflows/deploy.yml): lint + test + build on PRs to main; deploy to Vercel on push to main` so they run automatically:
- **SCA gate** via `npm audit` (dependency / known-vuln scan) — fail on
  high/critical runtime vulnerabilities.
- **Static analysis (SAST)** for best-practice security issues (e.g. a Semgrep-style job).

## Required Preflight Gate
Before running the pack, verify:
- Repo state is known: current commit (`git rev-parse HEAD`) and working tree (`git status --short`).
- Required tools are present (language toolchain, package manager, `git`, search/JSON utilities, issue-tracker CLI).
- Backend readiness: required env/config present and dependencies installed.
- Issue-tracker readiness (authenticated, if findings will be filed).
- Required source docs / decision records are present.

If any preflight check fails, retry **once** after standard setup recovery. If still
failing, the outcome must be `BLOCKED` with the exact human action required.

## Baseline Targeted Test Set
Maintain a named, stable set of security regression tests that the pack always runs.
Adapt to the project's surfaces; cover at minimum:
- Authorization: permission-denial (under-privileged user is blocked).
- Authentication: login success and failure paths.
- Credential recovery: password reset / OTP flow (if present).
- Session controls: issuance, expiry/idle-timeout, invalidation.
- Second factor: MFA flow (when present).
- **Tenant isolation: cross-tenant access is denied (if applicable — see below).**

### Multi-tenant isolation (if applicable)
*Skip this entire subsection if the project is single-tenant.*

If the project serves multiple isolated tenants/orgs/accounts that must not see each
other's data:
- **Never trust a client-supplied tenant identifier.** Derive the tenant from authenticated
  session/context server-side, and confirm the requested resource belongs to it.
- Every data query must be scoped to the caller's tenant.
- Keep a dedicated isolation regression test proving a user from tenant A cannot read or
  mutate tenant B's data.

## Scan Interpretation Rules
Define the project's scans and what their results mean. Two representative patterns:
- **"Tenant ID derived from request" scan** (only if multi-tenant):
  - No matches: expected clean baseline.
  - One or more matches: requires manual triage to confirm safe derivation and that
    authorization boundaries are enforced regardless of the client-supplied value.
- **"Authorization guards present" scan** (e.g. grep for the authz middleware/decorator):
  - One or more matches: expected baseline signal (guards exist).
  - **No matches: treat as a failed review signal (`FAIL` or `BLOCKED`)** until root cause
    is confirmed — absence of guards is itself a finding.

## Finding Severity Rules
- `Blocker`: authentication bypass, privilege escalation, session-control failure with an
  immediate exploit path — or (if applicable) tenant-isolation bypass.
- `High`: reproducible auth/security failure in a critical flow.
- `Medium`: non-critical boundary weakness or hardening gap.
- `Low`: low-impact misconfiguration or observability gap.

## Output Requirements
- Artifacts under `testing-reports/artifacts/<date>_<CW-NNN>_<feature>_<timestamp>/`.
- Report generated from the security-review report template.
- Findings filed per the project's issue/bug reporting standard.
- If the report contains markdown tables, lint them: avoid raw `|` inside inline code in
  table rows; use pipe-free wording or escape as `\|`.

## Self-Correction Protocol
- Retry dependency install + any data-layer codegen **once** if tooling/setup fails.
- If still blocked, mark the outcome `BLOCKED` with the exact action required.
