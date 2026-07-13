# ADR-007: Solve sync and reconciliation contract

**Status:** Proposed
**Date:** 2026-07-13
**Deciders:** dragondad22
**Related ADRs:** —

## 1. Context

CLAUDE.md's autosave non-negotiable says local autosave must never silently lose
solve progress and "server sync reconciles without clobbering newer local
state". The implementation only honoured the local half (#84):

- `POST /api/v1/puzzles/:id/solve` overwrote `state` unconditionally — any stale
  writer (old tab, slow device) clobbered newer server state.
- Reconciliation happened only at page load and picked a winner by comparing
  client wall-clock `lastSaved` values, so a device with a skewed clock could
  shadow real progress.
- Every keystroke triggered a full server POST (one serverless invocation and
  ~4 queries per typed letter).
- The unload flush used a plain `fetch`, which browsers cancel during
  navigation, and `stopAutosave()` dropped any queued pending state on unmount.

## 2. Decision

1. **Monotonic revision counter.** `SolveState` gains an optional `revision`
   (integer). Each server save sends `revision = (loaded revision) + 1`; on
   success the client adopts the sent value. Optional for back-compat with
   states saved before the field existed.
2. **Server recency guard.** The solve POST compares the incoming state's
   `revision` with the stored one and rejects `incoming <= stored` with **409
   `STALE_WRITE`**, writing nothing. When either side lacks a revision (legacy
   states), it falls back to comparing `lastSaved` timestamps; when neither is
   parseable it accepts (previous behaviour). The client treats 409 as
   "another writer won": it does not retry that state; the next page load
   reconciles.
3. **Load-time reconciliation prefers revisions.** `resolveSolveState` picks the
   side with the higher revision; wall-clock `lastSaved` is only a tiebreaker /
   legacy fallback. Clock skew no longer decides.
4. **Debounced server sync.** Local (localStorage) saves stay per-keystroke;
   the server POST is debounced (2.5s, coalesced to the latest state). Flush
   triggers: window blur, `visibilitychange -> hidden`, `pagehide`,
   `beforeunload`, and `stopAutosave()` (flush, don't drop).
5. **Keepalive flush.** The sync fetch always sets `keepalive: true` so the
   final flush survives page unload/navigation (solve states are far below the
   64 KB keepalive body cap).

## 3. Consequences

**Good**
- A stale writer can no longer destroy newer progress, on the server or at load.
- Steady typing costs at most one serverless invocation per debounce window
  instead of one per keystroke.
- The last keystrokes before navigating away actually reach the server.

**Trade-offs**
- 409 responses discard the losing writer's delta rather than merging it.
  Field-level merge of `filledCells` (union of cells, newest-wins per cell) is
  a possible future refinement if simultaneous multi-device solving becomes a
  real pattern; noted, not built.
- Multi-tab coordination in the same browser is out of scope here (tracked
  separately in #93).
