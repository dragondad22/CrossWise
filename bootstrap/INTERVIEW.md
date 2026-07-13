# Bootstrap Token Map

The token-fill map `/bootstrap` works through as **the final step of inception**
(the deep questions live in `bootstrap/QUESTION_BANK.md`; format in
`ai/STANDARDS/INTERVIEW_STANDARD.md`). Each entry maps one or more
`PLACEHOLDERS.md` tokens to the question that answers it — fill from the
inception interview's `Final:` fields first, detect what's mechanical
(commands, stack), and only ask in chat for what neither covers. Confirm
defaults rather than asking blind; group related questions.

## 1. Identity
- What is the project called? → `{{PROJECT_NAME}}`
- One line: what is it? → `{{PROJECT_TAGLINE}}`
- Who owns it (company / org / you)? → `{{PROJECT_OWNER}}`
- What problem domain is it in, in plain words? → `{{PROJECT_DOMAIN}}`

## 2. Source control & tracking
- Where do tasks live? Tool + URL. → `{{ISSUE_TRACKER}}`, `{{ISSUE_TRACKER_KIND}}`
- Prefix for work-item IDs in reports/branches? (e.g. `IMP`, `TASK`, or the tracker's own keys) → `{{WORK_ITEM_PREFIX}}`

## 3. Stack & layout (detect first, confirm)
- Primary language(s)? → `{{PRIMARY_LANGUAGE}}`
- Top-level repo layout, one paragraph? → `{{APP_LAYOUT}}`
- Commands (read from package.json/Makefile/etc., confirm):
  - Run tests → `{{TEST_COMMAND}}`
  - Build / typecheck → `{{BUILD_COMMAND}}`
  - Start locally → `{{DEV_COMMAND}}`
  - Lint / format (or N/A) → `{{LINT_COMMAND}}`
  - E2E tests (or N/A) → `{{E2E_COMMAND}}`
- Does it have a database? If so, ORM/migration tool + migrate command. (If no → prune DB standard) → `{{DB_LAYER}}`, `{{MIGRATION_COMMAND}}`
- Does it have a UI? (If no → prune UI standard)
- Design source of truth, if any (Figma/none)? → `{{DESIGN_SOURCE}}`

## 4. Docs
- Where do user-facing docs live / what's their source of truth? (a docs site, a README, in-app help, "none yet") → `{{DOCS_SOURCE_OF_TRUTH}}`
- Where do UAT / acceptance docs live? (default `docs/uat/`) → `{{UAT_DOC}}`

## 5. Versioning
- Which files hold a version and must move in lockstep? (default: just `VERSION`) → `{{VERSION_FILES}}`
- Versioning scheme? (default SemVer) → `{{VERSION_SCHEME}}`

## 6. Quality gates
- CI system + key workflow file(s)? (or "none yet") → `{{CI_SYSTEM}}`
- Dependency/security scan command? (e.g. `npm audit`, `pip-audit`, or N/A) → `{{SECURITY_SCAN_COMMAND}}`
- The one performance signal that matters? (e.g. an endpoint p95, cold-start time, or N/A) → `{{PERF_TARGET}}`

## 7. Platforms, audience & compliance
These drive `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md` and seed `docs/compliance/COMPLIANCE_REGISTER.md`.
- What platforms ship? (web / iOS / Android / desktop / API-only / CLI) → `{{TARGET_PLATFORMS}}`
- Who's the audience, and does it include minors? If so, what age range? → `{{AUDIENCE}}`
- What regulated/sensitive data does it handle? (PII, health, payments, location, none) → `{{REGULATED_DATA}}`
- Any obligation-bearing features? (user-to-user messaging, UGC, payments, tracking/analytics, public API consumed by others) → `{{COMPLIANCE_FEATURES}}`
- After collecting these, walk the trigger map and pre-populate the register's "Active obligations" with the rows that fire (mark each ☐ with today's date as Verified). The 14+/messaging worked example in the register shows the shape.

## 8. Non-negotiables (most important)
- What architectural constraints must never be re-litigated? Push for at least one real one.
  Prompts to draw them out: security/isolation invariants, data-integrity rules, privacy boundaries,
  data/compute locality (incl. third-party AI services — see the interview's Q-INFRA-04),
  idempotency/consistency guarantees, "we will never do X". → `{{NON_NEGOTIABLES}}`
