Run security validation against recent changes.

1. Read `ai/CHECKLISTS/validation.md` and `ai/STANDARDS/SECURITY_REVIEW_STANDARD.md`.
2. Run `git diff --name-only` to identify changed files.
3. If `ai/scripts/security-review.sh` is configured for this project, run it.
4. Run the dependency/SCA scan: `npm audit` (skip if N/A) and report high/critical findings.
5. Review changed entry points (routes/handlers/commands) for:
   - Missing authorization/permission enforcement
   - Untrusted input (body/params/headers) used without validation
   - Missing audit logging on sensitive mutations
   - Secrets or credentials in code, logs, or config
6. If the project is multi-tenant, verify tenant/data isolation on changed queries (no client-provided scoping IDs trusted).
7. Summarize findings with severity (critical/major/minor) and evidence.
8. For threshold-breaching findings, recommend filing tracked issues per `ai/STANDARDS/GITHUB_ISSUES.md`.
