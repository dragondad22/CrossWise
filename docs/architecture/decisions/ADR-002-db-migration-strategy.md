# ADR-002: Production database migration & backfill strategy

**Status:** Accepted
**Date:** 2026-06-25
**Accepted:** 2026-06-25
**Deciders:** Project owner (dragondad22)
**Related ADRs:** ADR-001 (per-user ownership — the first migration this governs)
**Related issues:** #34 (first schema change requiring this)

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
3. **Pull requests validate migrations on an ephemeral Neon branch**: create a branch DB,
   run `prisma migrate deploy` + `prisma migrate status` against it, and **lint the
   migration SQL with squawk** for dangerous operations. A bad migration fails the PR,
   never production.
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
- Requires two new CI secrets (`NEON_API_KEY`, `NEON_PROJECT_ID`) for the ephemeral-DB job.
- Imposes expand/contract discipline on the team; genuinely breaking changes need two
  deploys. CI can *flag* unsafe ops (squawk) but cannot author safe SQL or decide backfill
  rules — those remain human design decisions.
- `migrate deploy` against a populated DB will fail on a non-backward-compatible migration
  (by design) — that is the signal to use expand/contract.

## 4. Alternatives Considered

- **`prisma db push` in CI** — no migration history, can silently drop columns/data.
  Rejected: unacceptable for production data.
- **Run `migrate deploy` in the Vercel build command** — simplest, but the build runs per
  deployment (including previews) and can run concurrently, so previews would migrate prod
  and races are possible. Rejected in favor of a gated, serialized GitHub Actions job.
- **Keep migrations manual** — the current state. Rejected: error-prone and exactly the gap
  that stranded #34.

## 5. Implementation Notes

- `.github/workflows/deploy.yml`: add a PR-only `migrations-check` job (squawk lint +
  ephemeral Neon branch apply + `migrate status`) and a push-to-main `migrate` job
  (`prisma migrate deploy`, concurrency `db-migrate-prod`) that `deploy` now `needs`.
- `package.json`: `db:migrate` (`prisma migrate dev`), `db:migrate:deploy`,
  `db:migrate:status`, `db:reset` (`prisma migrate reset`). `db:push` stays for local
  prototyping only.
- New secrets required: `NEON_API_KEY`, `NEON_PROJECT_ID`. Until they are set, the
  ephemeral-DB validation self-skips with a warning (squawk lint still runs).

## 6. Follow-Up Actions

- Add the two Neon secrets so the PR validation job is active.
- For any future migration that touches existing user data, use expand/contract (§2.5);
  do not reset once real users exist.
- Revisit `db:push` removal entirely if it proves a footgun.
