# Placeholder Registry

Every customizable value in this kit is written as a `{{DOUBLE_BRACE}}` token.
The `/bootstrap` command (or a manual find-and-replace) fills them in. This file
is the single source of truth for what each token means.

> Convention: tokens are `UPPER_SNAKE_CASE` inside `{{ }}`. A token that is
> optional for a given project should be set to a sensible literal or removed
> along with the section that references it (the bootstrap interview handles this).

## Identity

| Token | Meaning | Example |
|---|---|---|
| `{{PROJECT_NAME}}` | Product / repo name | `ShelterSync` |
| `{{PROJECT_TAGLINE}}` | One-line description of what it is | `Multi-tenant SaaS for animal shelters` |
| `{{PROJECT_OWNER}}` | Company / org / individual that owns it | `Zoolytix` |
| `{{PROJECT_DOMAIN}}` | The problem domain, in plain words | `animal shelter operations` |

## Source control & tracking

| Token | Meaning | Example |
|---|---|---|
| `{{REPO_SLUG}}` | `host/org/repo` for the canonical remote | `github.com/Zoolytix/sheltersync` |
| `{{ISSUE_TRACKER}}` | Where tasks live (URL or tool name) | `https://github.com/orgs/Zoolytix/projects/2` |
| `{{ISSUE_TRACKER_KIND}}` | `GitHub Issues`, `Jira`, `Linear`, etc. | `GitHub Issues` |
| `{{WORK_ITEM_PREFIX}}` | Prefix for work-item IDs used in reports/branches | `IMP` (yields `IMP-008`) |

## Stack & layout (stack-agnostic — fill with whatever is true)

| Token | Meaning | Example |
|---|---|---|
| `{{PRIMARY_LANGUAGE}}` | Main implementation language(s) | `TypeScript` |
| `{{APP_LAYOUT}}` | One-paragraph map of the repo's top-level structure | `apps/api (Express+Prisma), apps/web (React), apps/mobile (Flutter)` |
| `{{TEST_COMMAND}}` | How to run the full test suite | `npm test` |
| `{{BUILD_COMMAND}}` | How to build / typecheck | `npm run build` |
| `{{DEV_COMMAND}}` | How to start the app locally | `npm run dev` |
| `{{LINT_COMMAND}}` | Linter / formatter check (or `N/A`) | `npm run lint` |
| `{{DB_LAYER}}` | ORM / migration tool, or `N/A` if no database | `Prisma + PostgreSQL` |
| `{{MIGRATION_COMMAND}}` | How to run/create DB migrations, or `N/A` | `npx prisma migrate dev` |
| `{{E2E_COMMAND}}` | End-to-end test command, or `N/A` | `npm run test:e2e` |

## Versioning

| Token | Meaning | Example |
|---|---|---|
| `{{VERSION_FILES}}` | Files that hold a version and must move in lockstep | `VERSION, package.json` |
| `{{VERSION_SCHEME}}` | `SemVer` or other | `SemVer (pre-1.0)` |

## Quality gates (set to what the project actually has)

| Token | Meaning | Example |
|---|---|---|
| `{{CI_SYSTEM}}` | CI provider + key workflow files | `GitHub Actions (.github/workflows/ci.yml)` |
| `{{SECURITY_SCAN_COMMAND}}` | Dependency / SAST scan, or `N/A` | `npm audit` |
| `{{PERF_TARGET}}` | The perf signal that matters, or `N/A` | `/health p95 < 200ms` |

## Platforms, audience & compliance

Drive `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md` and seed `docs/compliance/COMPLIANCE_REGISTER.md`.

| Token | Meaning | Example |
|---|---|---|
| `{{TARGET_PLATFORMS}}` | Where it ships | `iOS + Android + web` / `API-only` / `CLI` |
| `{{AUDIENCE}}` | Who uses it, incl. age if minors | `shelter staff + volunteers, 14+` / `general adult` |
| `{{REGULATED_DATA}}` | Regulated/sensitive data handled | `PII + messages` / `none` |
| `{{COMPLIANCE_FEATURES}}` | Features that carry obligations | `staff↔user messaging, public API` / `none` |

## Non-negotiables

`{{NON_NEGOTIABLES}}` — a bulleted list of finalized architectural constraints
that must not be re-litigated. This is the highest-value thing the interview
captures. ShelterSync's were: multi-org isolation, RBAC at every layer, audit
trails, restriction-not-deactivation, stateful sessions. Yours will differ —
many small projects have just one or two (e.g. "no PII leaves the device",
"all writes are idempotent"). It is fine for this to be short, but never empty.

## Docs & design

| Token | Meaning | Example |
|---|---|---|
| `{{DOCS_SOURCE_OF_TRUTH}}` | Where user-facing docs live / their source of truth | `the docs site in apps/docs` / `the README` / `none yet` |
| `{{UAT_DOC}}` | Where UAT / acceptance docs live | `docs/uat/` |
| `{{DESIGN_SOURCE}}` | Design source of truth, if any (UI projects only) | `Figma` / `none` |

---

## Runtime tokens (NOT filled by bootstrap)

These are substituted each time a report is scaffolded by `ai/scripts/new-report.sh`,
not during bootstrap. Leave them as tokens in the templates under `ai/TEMPLATES/`:

- `{{DATE}}` — today's date, inserted into a new report
- `{{IMP_ID}}` — the work-item id passed to `new-report.sh`
- `{{FEATURE}}` — the feature slug passed to `new-report.sh`

## Meta-literals (NOT project values)

`{{TOKEN}}`, `{{TOKENS}}`, `{{PLACEHOLDER}}`, `{{DOUBLE_BRACE}}` appear only inside
instructional text (this file, `README.md`, and the one-line genericization banner at the
top of each standard/template). They are illustrative, not values to fill. Bootstrap
should strip the genericization banner lines once the kit is adapted.

---

## Filling these in

- **Interactive:** run `/bootstrap` and answer the interview. It rewrites files in place.
- **Manual:** `grep -rl '{{' .` to find every file with unfilled tokens, then
  replace per this table. `bootstrap/SETUP.md` is the hand-fill checklist.
- After filling, `grep -rn '{{' .` should return nothing except this file and
  `bootstrap/`.
