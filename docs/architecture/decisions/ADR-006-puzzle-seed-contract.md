# ADR-006: Puzzle generation seed contract

**Status:** Proposed
**Date:** 2026-07-10
**Deciders:** dragondad22
**Related ADRs:** ADR-005 (AI list generation stays non-deterministic; puzzle generation from a list stays seeded)

## 1. Context

CLAUDE.md lists deterministic generation as a non-negotiable: "puzzle generation is
seeded and reproducible for a given list + seed." The implementation violated it (#35):
the generate route shuffled candidate words with unseeded `Math.random()`, defaulted the
seed to `Date.now()`-based strings (computed twice, so the stored seed could even differ
from the one used), and the generator itself fell back to `Math.random()` when no seed
was given. The same request therefore produced different puzzles on every call, and even
an explicit seed did not reproduce a puzzle. Determinism is also a prerequisite for
size/word-count selection (#22) and difficulty-aware generation (#33).

A contract was needed for (a) what a seed guarantees, (b) where the seed comes from when
the client omits it, and (c) how clients get variety.

## 2. Decision

- **Reproducibility guarantee (server):** the same (list content, seed, grid size)
  always produces the same grid and numbering. A single seeded PRNG
  (`seedrandom(seed)`) drives *all* randomness on the generation path — word selection
  (capping at 150 items) and placement. `Math.random()`/`Date.now()` are banned from
  the path.
- **Explicit seed:** used verbatim and persisted on the puzzle, so any puzzle can be
  regenerated from its stored (list, seed).
- **Omitted seed:** the API derives a stable default — `deriveListSeed(listId, items)`,
  an FNV-1a hash of the list id + order-independent item content. Re-requesting without
  edits reproduces the same puzzle; editing the list changes the default.
- **Variety is the client's job:** a client wanting a different puzzle for the same
  list passes a fresh explicit seed (the web UI's generate/regenerate buttons do this).
  The server never invents randomness.

## 3. Consequences

**Good**
- The non-negotiable holds and is enforced by unit + API tests (same seed → identical
  output; omitted seed → stable, content-derived).
- Stored puzzles are reproducible from their persisted seed — useful for debugging,
  sharing, and future features (#22, #33) that need stable selection.
- The stored seed always matches the seed actually used (the double-`Date.now()`
  mismatch is gone).

**Trade-offs**
- Generating without a seed no longer yields variety; clients must opt into variety
  with explicit seeds. The existing web UI already sends explicit seeds, so behavior
  there is unchanged.
- The default seed hash (FNV-1a 32-bit) is not cryptographic — acceptable, as it only
  needs stability, not unpredictability.
