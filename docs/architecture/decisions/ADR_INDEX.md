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
| ADR-001 | Per-user ownership of topics, lists, and puzzles | Accepted | `ADR-001-user-data-ownership-model.md` |
| ADR-002 | Production DB migration & backfill strategy | Accepted | `ADR-002-db-migration-strategy.md` |

---

## Planned / Future ADRs

| ADR # | Decision Area | Notes |
|-------|---------------|-------|
| ADR-003 | Curated library & copy-on-pull | Read-only team-published source lists; deep-copy into user account on pull; `sourceListId` provenance; **no** user-publishing (UGC deferred per Decision 1). Depends on ADR-001 |
| ADR-004 | API contract & versioning for multiple clients | Roadmap adds native Android/iOS, making `/api/v1` multi-client. Standardize the contract on Zod as single source (#44); decide OpenAPI + client codegen; define an API version/deprecation policy (mobile clients can't deploy in lockstep with the backend) |
| ADR-005 | AI-assisted list generation | User enters a topic → an LLM generates the word/clue list. Provider integration + key management, prompt (`sample-puzzles/ai-list-generation-prompt.md`), cost/rate controls, and **AI-content safety/moderation for the minors audience** (Decision 1). The generated list is non-deterministic; puzzle generation from a list stays seeded (#35) |

---

## Open Decision Gaps

Topics that influence architecture but do not yet have ADRs:

- JSON-as-`String` columns (`Puzzle.grid/numbering/settings`, `List.tags`, `Solve.state`) vs Prisma `Json` type — revisit if queryability/validation is needed.
- Anonymous vs authenticated solves: `Solve.userId` is nullable with `@@unique([puzzleId, userId])` — decide whether anonymous solves are supported.
- API contract for multiple clients (web today; native Android/iOS planned) — single Zod source now (#44); OpenAPI/codegen + versioning policy to be decided in ADR-004.
- AI-content safety: AI-generated lists shown to a minors audience (Decision 1) need a moderation/safety review — to be scoped in ADR-005.

---

## ADR Template

See: `ADR_TEMPLATE.md`
