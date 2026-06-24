# ADR-001: Per-user ownership of topics, lists, and puzzles

**Status:** Proposed
**Date:** 2026-06-24
**Deciders:** Project owner (pending approval)
**Related ADRs:** —
**Related issues:** #34 (enforce user-data isolation)

## 1. Context

CLAUDE.md declares a non-negotiable: "every query is scoped to the authenticated
user; a user can only read/write their own topics, lists, puzzles, and solves."
The data model does not support this:

- In `prisma/schema.prisma`, `Topic`, `List`, `ListItem`, and `Puzzle` have **no
  owner column**. Only `Solve` carries a (nullable) `userId`.
- `Topic.name` is **globally `@unique`**, so topics live in a single shared
  namespace — one user's "Animals" topic collides with and is visible to every
  other user.
- The API enforces only a session gate. `src/app/api/v1/topics/route.ts` queries
  topics with no `where: { userId }`, and `src/app/api/v1/lists/import/route.ts`
  resolves a topic via `prisma.topic.findFirst({ where: { name } })` with no user
  scoping.

Net effect: any authenticated user can read and modify every other user's topics
and lists. This is a cross-user data-exposure gap against a stated non-negotiable,
and it is heightened by Decision 1 (minors audience → privacy-protective defaults).
A decision on the ownership model is required before the isolation work in #34 can
proceed, because the model dictates the schema, the uniqueness constraints, and the
query-scoping pattern.

## 2. Decision

**Topics and lists (and everything beneath them) are owned by the user who creates
them.** Concretely:

- Add an owner relation `userId → User` to `Topic` (and confirm the ownership chain
  for `List`/`Puzzle` flows from it).
- Replace the global `Topic.name @unique` with a **per-user** uniqueness constraint
  (`@@unique([userId, name])`), so two users can independently own a same-named topic.
- Scope **every** read and write (find/create/update/delete) by the authenticated
  `userId`, including the import topic lookup.
- Return `404` (not `403`) for resources the caller does not own, to avoid
  existence disclosure.

This ownership model is **compatible with a curated library** users pull from. The
library is read-only source content **published by the CrossWise team**; "pulling"
an item **deep-copies it into the pulling user's account** as a new owned list
(*copy-on-pull*). It does **not** create shared, mutable ownership, so isolation is
preserved. We will **not** support user-to-user publishing / public sharing of user
content — that would be UGC and is gated by Decision 1's child-safety requirements.
The curated-library content model and copy-on-pull mechanics are a separate decision,
specified in **ADR-003** (planned).

## 3. Consequences

### Positive
- Satisfies the user-data-isolation non-negotiable at the data layer, not just by
  convention.
- Removes the same-name topic collision between unrelated users.
- Makes the negative-path isolation tests in #15, #16, and #34 meaningful.

### Negative
- Requires a schema migration that **backfills ownership** for existing topics/lists
  (existing rows have no owner). Backfill strategy must be decided (assign to a
  specific user, or treat pre-existing data as seed/demo content).
- Touches many call sites: every topics/lists/puzzles query, the import route, and
  the seed scripts (`scripts/`, `src/lib/seed-data.ts`).
- Dropping the global unique constraint changes existing DB constraints — needs the
  Impact Analysis (consumer sweep) gate in `ai/CHECKLISTS/coding.md`.

## 4. Alternatives Considered

- **Shared global catalog (shared mutable ownership)** — topics remain global/shared,
  only lists are owned. Rejected: contradicts the non-negotiable's explicit mention of
  "their own topics," and a shared write surface for minors is exactly what Decision 1
  says to avoid. The "pull from a shared source" benefit is instead delivered by a
  read-only curated library reached via copy-on-pull (ADR-003) — no shared mutable state.
- **User-published / public sharing (UGC)** — let users publish their own lists for
  others to pull. Rejected for now: this is user-to-user content sharing, which
  Decision 1 gates behind child-safety design (moderation, report/block, minor-visibility
  limits). The curated, team-published library avoids those obligations.
- **Leave it session-gated, enforce in app code only** — no schema change, rely on
  query discipline. Rejected: nothing prevents a missed `where` clause from leaking
  data; the constraint belongs in the model.

## 5. Implementation Notes

- Data model: `Topic.userId` (+ relation, `onDelete: Cascade`), `@@unique([userId, name])`.
  Confirm `List`/`Puzzle` ownership is reachable via the topic→list chain or add a
  redundant `userId` if query patterns need it.
- Migration: additive column, backfill, then enforce `NOT NULL` + new unique; must be
  reversible. Coordinate with the production migration-strategy decision (currently an
  open gap — see index).
- API: introduce a single ownership-scoped query helper so no route can forget the
  `userId` filter.

## 6. Follow-Up Actions

- This ADR governs implementation of #34.
- Add negative-path isolation tests for topics/lists/puzzles routes (user A vs user B).
- Record a follow-up decision on the production migration/backfill strategy (ADR-002).
- Specify the curated library + copy-on-pull model in **ADR-003** (read-only,
  team-published source lists; deep-copy into the user's account on pull; `sourceListId`
  provenance; no user-publishing).
- On acceptance, flip Status to **Accepted** and update `ADR-INDEX.md`.
