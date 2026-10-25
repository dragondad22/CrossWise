# ADR-002: Production database migration & backfill strategy

**Status:** Accepted
**Date:** 2026-06-25
**Accepted:** 2026-06-25
**Deciders:** Project owner (dragondad22)
**Related ADRs:** ADR-001 (per-user ownership — the first migration this governs)
**Related issues:** #34 (first schema change requiring this); #138 (PR checks on a throwaway Postgres)
**Amended:** 2026-10-23 (#138): PRs check migrations on a throwaway Postgres in place of a Neon branch,
so PR CI holds no secrets. 2026-10-25 (#139): migrations run when a `v*` tag deploys, not on every merge.

## 1. Context

Schema changes (starting with #34) must reach the production Postgres (Neon) database
safely and automatically, without a human running migrations by hand before each deploy.
Today there is no migration step in CI: `.github/workflows/deploy.yml` runs
`lint && test && build`, then deploys to Vercel — the database is never touched. The repo
also mixes `prisma db push` (in `package.json`) with a committed `prisma/migrations/`
history. Vercel does not run migrations as part of its build in any safe way. The minors
audience (Decision 1) and the personal data we hold raise the bar on not corrupting or
exposing data during a migration.

## 2. Decision

1. **Versioned migrations are the source of truth.** `prisma migrate dev` authors them
   locally; the SQL is committed under `prisma/migrations/`. **`prisma db push` is for
   local prototyping only — never against a shared/preview/production database.**
2. **CI applies migrations with `prisma migrate deploy`** (idempotent, no shadow DB, no
   prompts, never resets) in a **dedicated `migrate` job that gates the app `deploy`**.
   The app is deployed only after the database is migrated, so a failed migration blocks
   the deploy and the old code never serves against a half-migrated schema.
3. **Pull requests validate migrations on a throwaway Postgres**: `scripts/ci.sh` runs
   `prisma migrate deploy` + `prisma migrate status` against the database in `DATABASE_URL`
   (a `postgres:17` service container in PR CI, or one beside the dark factory's box), and
   **lints the migration SQL the PR changes with squawk** for dangerous operations. A bad
   migration fails the PR, never production. PR CI holds no secrets, so a branch's own
   workflow can do no harm before review. (Until #138 this used an ephemeral Neon branch,
   which needed the Neon API key in PR CI.)
4. **Prod migrations are serialized** via a GitHub Actions concurrency group and are
   **forward-only** (no auto-rollback; roll forward with a new migration, restore from a
   Neon snapshot/branch if needed).
5. **Migrations must be backward-compatible with the currently-running app**
   (expand/contract): add nullable columns, don't drop/rename/tighten something the live
   code still needs in the same deploy. A breaking change is split across two deploys —
   **expand** (additive) → deploy code → **contract** (tighten/drop). Data **backfills are
   encoded as SQL inside the migration** so they run automatically.
6. **#34 uses a pre-launch reset.** CrossWise has no real user data yet, so the
   `topics.user_id` migration does not backfill — it assumes a fresh/reset database
   (`prisma migrate reset` reseeds with ownership). Once real user data exists, future
   ownership-style changes must use the expand/contract pattern in (5), not a reset.

## 3. Consequences

### Positive
- Schema changes deploy automatically and safely; no manual pre-deploy migration step.
- Bad migrations are caught on a throwaway DB in the PR, before they can touch prod.
- The app never serves against an un-migrated database.

### Negative
- A throwaway Postgres is not Neon: a migration that depends on something only Neon has would
  pass the PR and fail in production. None does today.
- Imposes expand/contract discipline on the team; genuinely breaking changes need two
  deploys. CI can *flag* unsafe ops (squawk) but cannot author safe SQL or decide backfill
  rules — those remain human design decisions.
- `migrate deploy` fails only on what Postgres itself rejects. A migration that breaks the running
  code (a dropped or tightened column, say) can apply cleanly, so squawk, which fails the PR since
  #138, and review are what catch it — the signal to use expand/contract.

## 4. Alternatives Considered

- **`prisma db push` in CI** — no migration history, can silently drop columns/data.
  Rejected: unacceptable for production data.
- **Run `migrate deploy` in the Vercel build command** — simplest, but the build runs per
  deployment (including previews) and can run concurrently, so previews would migrate prod
  and races are possible. Rejected in favor of a gated, serialized GitHub Actions job.
- **Keep migrations manual** — the current state. Rejected: error-prone and exactly the gap
  that stranded #34.

## 5. Implementation Notes

- `scripts/ci.sh` (#138): squawk on the PR's changed migrations, then `migrate deploy` +
  `migrate status` on a throwaway Postgres. `.github/workflows/pr-validation.yml` runs it with
  a `postgres:17` service container. (Before #138: a PR-only `migrations-check` job in
  `deploy.yml`, on an ephemeral Neon branch.)
- `.github/workflows/deploy.yml`: a push-to-main `migrate` job (`prisma migrate deploy`,
  concurrency `db-migrate-prod`) that `deploy` now `needs`. Since #139 it runs on a `v*` tag
  instead: a Neon snapshot branch first when the release has migrations, then migrate, then
  deploy. The app is rolled back on its own only when the release's migrations are expand-only
  (`scripts/release-plan.sh`), which §2.4's "forward-only" still holds to: the schema is never
  rolled back.
- `package.json`: `db:migrate` (`prisma migrate dev`), `db:migrate:deploy`,
  `db:migrate:status`, `db:reset` (`prisma migrate reset`). `db:push` stays for local
  prototyping only.
- PR checks need no secrets (#138).

## 6. Follow-Up Actions

- For any future migration that touches existing user data, use expand/contract (§2.5);
  do not reset once real users exist.
- Revisit `db:push` removal entirely if it proves a footgun.
