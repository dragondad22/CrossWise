*Generic standard from the Claude starter kit — adapt to this project's stack. Replace `{{TOKENS}}`; see `bootstrap/PLACEHOLDERS.md`.*
*Optional — keep only if this project has a database.*

# Database Schema Standard

## Purpose

Define the naming, typing, and structural conventions used in this project's schema
(managed with `{{DB_LAYER}}`) so any schema change — new table/model, new column, new
migration — is consistent with what is already in production. This standard should be
**descriptive**: it codifies the conventions the codebase already follows, not
aspirational rules. Update it when the real conventions change.

## Authority Order

1. The live schema definition (the `{{DB_LAYER}}` schema/model files) — source of
   truth.
2. The canonical ERD / data-model diagram, kept in sync with the schema.
3. This file.
4. The project's Non-Negotiables (see `CLAUDE.md` / `{{NON_NEGOTIABLES}}`).

## Non-Negotiables

- **Forward-only migrations**: never edit a historical migration. Add a new one.
- **Audit every mutation** that matters (who, when, what changed) per the project's
  logging/audit standard.
- *(If multi-tenant — see the optional section below — every query is tenant-scoped
  server-side and never trusts a client-provided tenant id.)*

---

## Naming Conventions

> The exact casing below is a common convention; if your `{{DB_LAYER}}` or team uses
> a different one, document **that** here and apply it consistently. The rule that
> matters is *one* convention, enforced everywhere.

### Tables

- **lowercase, plural, snake_case** — e.g. `activities`, `activity_types`,
  `password_reset_tokens`.
- If your ORM uses different model names from table names, map them explicitly per
  model.
- **Junction tables** are named `<entity_a>_<entity_b>` plural: `user_roles`,
  `role_permissions`.

### Columns

- **snake_case** — `created_at`, `recommended_minutes`, `is_active`.
- If your ORM exposes camelCase fields, map each to its snake_case column explicitly.

### Model names (if the ORM has them)

- **PascalCase singular** — `Organization`, `ActivityType`.
- One model per table; no model spans multiple tables; no table backs multiple
  models.

### Booleans

- Default to `is_*` / `has_*` prefixes — `is_active`, `is_primary`.
- Some legacy columns may be bare adjectives. New columns should prefer the `is_*`
  form; do not rename existing columns purely for consistency.

### Foreign keys

- `<referenced_table_singular>_id` — `species_id`, `activity_type_id`.
- Use a consistent key type across the schema (see Primary keys).

### Primary keys

- A single, consistent PK convention — typically `id`, a generated UUID, no composite
  PKs. *(Pick one and document it here; integer auto-increment is also fine if that's
  what the project uses — just be consistent.)*

### Timestamps

- Every mutable entity has both `created_at` and `updated_at`.
- Use a timezone-aware timestamp type. Defaults: now-on-create, auto-update-on-write.
- Event/log-style tables may carry a single timestamp (`at`, `occurred_at`) instead
  of the pair.

### Other typed columns

- Use the **most specific** column type available rather than a catch-all string:
  dedicated types for IP addresses, date-only values, bounded small integers, and
  structured JSON config/policy blobs. A precise type is free validation.

---

## Indexes

- Index the columns you actually filter, join, and sort on — not everything, and not
  nothing.
- Composite indexes should lead with the column queries filter on first.
- Express uniqueness constraints that the domain requires (e.g. a per-scope unique
  code) as composite unique indexes, not application-only checks.
- Ordering/sort-order columns that must be unique within a scope need their own
  composite unique constraint; reorder operations may need a two-pass
  temporary-offset trick to avoid collisions during swaps.

---

## Lookup / Reference Values

Two common patterns — pick deliberately and document which a given vocabulary uses:

- **FK to a lookup table** — strong referential integrity, renames cascade,
  reads join.
- **Denormalized value stored by name** — a small per-scope table validated at the
  **write layer** (read the lookup, reject unknown/inactive values), with consumers
  storing the resolved name as a text column and **not** joining on read.

The denormalized pattern has a deliberate trade-off: admin renames do **not** cascade
into historical rows — which is a *feature* for audit fidelity (the record shows what
the value was at the time). If you use it, validate at write time and surface a
rename-warning in admin UI; do not add a DB-level FK/CHECK/trigger after the fact, as
that would break the denormalized columns that copy from the validated source.

---

## Deletion Behavior

- **Hard delete** is reasonable for lookup tables and standalone configuration
  entries. DELETE endpoints should return a conflict (e.g. 409) when the row is still
  referenced by live data, and success (e.g. 204) otherwise.
- **Soft-state, not soft-delete**, for entities that need historical preservation:
  prefer a `status` column or an `is_active` flag over a `deleted_at` timestamp where
  the record must remain queryable and intact.
- Do not introduce `deleted_at` / `archived_at` columns ad hoc; decide soft- vs
  hard-delete per entity and record non-obvious choices in an ADR.

---

## Migrations

- Generate migrations with your migration tool (`{{MIGRATION_COMMAND}}`); use short
  `snake_case` descriptions.
- **Never rename, reorder, or edit an applied/historical migration.** Add a new one.
- Multi-step changes (create + backfill, rename + populate) live in **one** migration
  so they apply atomically.
- Backfill SQL should be **idempotent where feasible** — use
  `INSERT … ON CONFLICT DO NOTHING` or guarded `… WHERE NOT EXISTS` patterns so
  re-running on a partially-applied database does not crash.
- Every migration is **reviewed** before merge — schema changes are the hardest to
  reverse, so they get the most scrutiny, not the least.

---

## One shared constant over duplicated literals

When the same value appears in more than one place — an enum/status vocabulary, a
default, a magic number, a seed value, a lookup name — define it **once** as a shared
constant/type and import it everywhere. Duplicated literals drift independently and
diverge silently. This is especially true across the seed / fixture / provisioning /
demo-data write paths, which are notorious for falling out of sync with the schema and
with each other.

## Impact analysis on shared columns (mandatory gate)

Before completing any change to something **shared** — a column, a constraint, an
enum/lookup vocabulary, a seed/default, a provisioning template, or a shared
type/helper — sweep **every consumer** of it first. List the call sites, the seed and
fixture writers, the provisioning/demo paths, exports, and any code that reads or
writes the value, and confirm each is handled. The write paths that populate a column
drift independently from the code that reads it; assume they have diverged until you
have checked.

---

## OPTIONAL: Multi-Tenant Isolation

*Keep this section only if the project is multi-tenant (shared database serving
multiple organizations/accounts). Delete it otherwise.*

- Every tenant-owned row carries an `organizationId` (tenant id) column, with a
  relation back to the tenant table. The only exceptions are the tenant table itself
  and genuinely platform-level/global tables.
- When adding a new tenant-owned model, also add the inverse relation on the tenant
  model — search the schema for an existing relation to copy the convention.
- Every read and write (`findMany`/`findFirst`/`update`/`delete` and their equivalents)
  includes the tenant id in its filter, derived server-side — never client-supplied.
  (Doctrine — why, threat model: `ai/STANDARDS/SECURITY_REVIEW_STANDARD.md`
  § Multi-tenant isolation.)
- Composite indexes on tenant-owned tables should **lead with `organizationId`** to
  match the tenant-scoped access pattern, and org-scoped uniqueness uses a composite
  unique that includes `organizationId`.

---

## When Adding a New Table / Model

1. Confirm it conforms to every section of this standard before opening a PR.
2. Update the canonical ERD / data-model diagram in the **same** PR — it must not
   drift from the schema.
3. If the new model breaks a convention here, record an ADR and update this standard
   to reflect the new pattern.
4. Generate and commit the migration alongside the schema change.
5. Run the **Impact analysis** gate above for any shared column/constraint touched.
6. Record every new domain noun, status value, or role name the model coins in
   `docs/GLOSSARY.md` at introduction time (coin-time rule — see the glossary header).

---

## See Also

- The `{{DB_LAYER}}` schema definition — source of truth.
- The canonical ERD / data-model diagram.
- The project's architecture decision records (ADRs) — exceptions to or extensions of
  this standard.
