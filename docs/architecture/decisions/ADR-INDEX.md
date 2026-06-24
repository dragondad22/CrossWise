# Architecture Decision Record (ADR) Index

CrossWise

**Updated:** 2026-06-24

This index tracks all architectural decisions for CrossWise:
- Completed ADRs
- In-progress ADRs
- Planned future ADRs
- Open decision gaps

Status labels: **Proposed** | **Accepted** | **Rejected** | **Superseded**

---

## ADRs

| ADR # | Title | Status | File |
|-------|-------|--------|------|
| ADR-001 | Per-user ownership of topics, lists, and puzzles | Proposed | `ADR-001-user-data-ownership-model.md` |

---

## Planned / Future ADRs

| ADR # | Decision Area | Notes |
|-------|---------------|-------|
| ADR-002 | Production DB migration & backfill strategy | `prisma migrate` vs `db push`; backfilling owner columns (depends on ADR-001) |
| ADR-003 | Curated library & copy-on-pull | Read-only team-published source lists; deep-copy into user account on pull; `sourceListId` provenance; **no** user-publishing (UGC deferred per Decision 1). Depends on ADR-001 |

---

## Open Decision Gaps

Topics that influence architecture but do not yet have ADRs:

- JSON-as-`String` columns (`Puzzle.grid/numbering/settings`, `List.tags`, `Solve.state`) vs Prisma `Json` type — revisit if queryability/validation is needed.
- Anonymous vs authenticated solves: `Solve.userId` is nullable with `@@unique([puzzleId, userId])` — decide whether anonymous solves are supported.

---

## ADR Template

See: `ADR-TEMPLATE.md`
