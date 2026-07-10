# Paved-Road Registry

House defaults for tools, frameworks, and data formats across projects. Each row
is **the default that wins unless the inception/feature interview surfaces a
reason to deviate** — not a mandate. Consistency by default, dogma never.

How this file works:

- **It is a swappable data file.** The kit's machinery stays stack-agnostic; a
  fork of the kit encodes its own preferences by editing this one file. The
  defaults below are the kit owner's; replace them with yours.
- **Deviation = ADR.** A project may deviate from any row, but the deviation is
  recorded as an ADR with the reason ("mobile-only → Maestro instead of
  Playwright"), so it is deliberate and greppable. (`docs/architecture/decisions/`)
- **Rows carry a last-reviewed date.** Preferences rot; stale rows are re-checked
  in the periodic evergreen date sweep — same discipline as the compliance
  register's Verified column.
- **Consumption:** interview recommendations cite rows by name ("E2E: Playwright
  — house default"); trigger modules arrive pre-configured with the paved-road
  choice; the CI example's commented blocks name paved-road tools. Chosen tools
  land in each project's `CLAUDE.md`/standards as that project's reality — this
  registry is consulted, not copied.

## Tooling defaults

| Category | House default | When it applies | Last reviewed |
|---|---|---|---|
| E2E / UI testing | **Playwright** | Any web UI. Its on-failure screenshot/trace/video defaults satisfy the kit's failure-evidence rules out of the box. Mobile-only UI → deviation ADR (e.g. Maestro) | 2026-07-09 |
| Unit tests | Per language: TypeScript/JS → **Vitest** · Python → **pytest** · Dart/Flutter → **flutter_test** · Go → **go test** | Every project with code | 2026-07-09 |
| Lint / format | TypeScript/JS → **ESLint + Prettier** · Python → **Ruff** (lint + format) · Dart → **dart analyze + dart format** · Shell → **shellcheck** | Every project; wire into the PR-validation CI | 2026-07-09 |
| Package manager | JS → **npm** (pnpm when a workspace/monorepo justifies it) · Python → **uv** · Dart → **pub** | Every project | 2026-07-09 |
| CI | **GitHub Actions** (kit decision T10.1) — PR-validation workflow is core; deploy/CD is a separate module when environments are decided | GitHub-hosted projects; elsewhere, port the gate list | 2026-07-09 |
| Dependency maintenance | **Renovate** (Dependabot acceptable) — kit decision T10.3; cadence + ownership in the security standard | GitHub-hosted projects | 2026-07-09 |
| Database + ORM/migrations | **PostgreSQL** + the stack's migration-first ORM (TS → Prisma) · **SQLite** when single-host-small is the honest scale | First schema/migration (db module trigger) | 2026-07-09 |
| UI foundation | Design tokens + an established component library over ad-hoc per-screen CSS (React → Tailwind + a headless/component kit) | First UI code (ui module trigger) | 2026-07-09 |
| Auth | An established library or hosted identity provider — session- or token-based per the project's shape. Never hand-rolled password/crypto handling | Any project with accounts | 2026-07-09 |
| Logging | Structured JSON per `ai/STANDARDS/LOGGING_STANDARD.md` | Every service | 2026-07-09 |
| Secret store | Deployed environments → the platform's secret manager. `.env` is local-dev convenience only: gitignored, never real production secrets | Every project with secrets | 2026-07-09 |
| Hosting ladder | **Smallest that works**: local → single small host (Pi / VPS) → managed platform (Fly.io / Render / Railway) → full cloud (AWS/GCP). Move up only with a reason | Deploy-target decisions (inception or deploy trigger) | 2026-07-09 |

## Data-format standards

Small, well-known representation standards. Their value is **discovery**, not
just consistency — surfacing a standard the human didn't know existed saves the
rework of retrofitting it later.

| Data category | Standard | Application note | Last reviewed |
|---|---|---|---|
| Phone numbers | **E.164** | Store normalized `+<country><number>`; format for display per locale | 2026-07-09 |
| Dates / times | **ISO 8601** | Store UTC; carry offsets only at the edges; date-only values stay date-only | 2026-07-09 |
| Currency | **ISO 4217** codes | Amounts as integer minor units (cents) — never floats | 2026-07-09 |
| Country | **ISO 3166-1 alpha-2** | `US`, `GB`, … — not names, not alpha-3, unless an interface demands it | 2026-07-09 |
| Language / locale | **BCP 47** | `en`, `en-GB`, `pt-BR` | 2026-07-09 |
| Text encoding | **UTF-8** | Everywhere: storage, transport, files | 2026-07-09 |
| Email addresses | **RFC 5322** | Validate loosely (`@` + deliverability), verify by sending — don't over-regex | 2026-07-09 |

### Coin-time application rule

When a **new field, entity, or API shape of a well-known data category is
coined** (schema change, API contract, form design), consult this section and
propose the matching standard **at introduction time — not at rework time**.
Same timing as the glossary's coin-time recording rules: the moment of coining
is the cheap moment. If the human declines the standard, that's a deviation —
record the ADR.

The trigger map in `ai/STANDARDS/EXTERNAL_STANDARDS_AND_COMPLIANCE.md`
(dates/encoding/i18n row) points here for the concrete list.
