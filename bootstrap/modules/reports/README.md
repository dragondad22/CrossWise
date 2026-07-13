# Module: reports

Formal QA/UAT machinery, scaffolded when the project gains its first formal QA/UAT need
(e.g. external stakeholder acceptance — T3.9). Files mirror their project-root-relative
destinations:

- `ai/STANDARDS/UAT_SOURCE_OF_TRUTH.md`
- `ai/TEMPLATES/ACCEPTANCE_DOC_TEMPLATE.md` — agent-facing acceptance doc shape (T28.2)
- `ai/TEMPLATES/BETA_GUIDE_TEMPLATE.md` — human-facing beta guide, goals-not-steps (T28.3)
- `docs/uat/` — acceptance docs at the root; beta guides under `docs/uat/beta/` (T28.7)

Note: the four role report templates (TESTER/UAT/SECURITY/PERF) were retired per T5.7;
their replacement — a single failure-driven diagnostic-bundle shape — is core and arrives
with the diagnostics epic (#30).
