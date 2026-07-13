# UAT — CW-2: Export a printable blank puzzle instead of raw JSON

- Work Item: CW-2 (#2)
- Feature / Workflow: Lists page "Export" action → blank printable crossword
- Environment: local / preview

## Behavior Under Test

Clicking "Export" on a list card must produce a **blank printable crossword** —
an empty numbered grid plus across/down clue lists, built from the list's most
recent generated puzzle — instead of downloading the raw list JSON. The output
must contain **no answer letters and no PII** (audience includes minors,
Decision 1). A list with no generated puzzle must show a friendly error, not
download anything.

## Acceptance Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Happy path | Generate a puzzle for a list, click "Export" | New tab opens with a print dialog: heading = list name, empty numbered grid (black blocks, blank white squares with small start-of-word numbers), "Across" and "Down" clue lists |
| 2 | No answers leak | Inspect the exported page source | No answer letters appear anywhere (grid cells are empty; clues only); no email/account/session data on the sheet |
| 3 | No raw JSON | Click "Export" | No `.json` file downloads; the raw list JSON endpoint is not used by the button |
| 4 | No puzzle yet | Click "Export" on a list that has never generated a puzzle | Error banner: "Generate a puzzle first — this list doesn't have one yet."; nothing downloads or opens |
| 5 | Most recent puzzle | Generate two puzzles with different seeds, click "Export" | The printed grid/clues match the newest puzzle (compare numbering with the solve screen) |
| 6 | Popup blocked | Block popups for the site, click "Export" | A self-contained `.html` file downloads instead; opening it shows the same printable page |
| 7 | Hostile clue text | Import a list with a clue containing `<script>alert(1)</script>`, generate, export | The clue renders as literal text on the sheet; no script executes |
| 8 | Print fidelity | Print (or print-preview) grids at sizes 9x9 and 19x19 | Grid fits the page without clipping; block cells print solid dark |
| 9 | Accessibility | Reach the "Export" button by keyboard (Tab) and activate with Enter | Button is focusable with a visible focus ring and operable by keyboard (WCAG 2.2 AA, CW-C-001) |
| 10 | Auth boundary | Call `GET /api/v1/lists/:id/puzzles` without a session, or for another user's list | 401 without a session; another user's list yields no puzzles (ownership-scoped query) |

## Notes

- The printable document is built client-side by `buildPrintableCrosswordHTML`
  in `src/lib/export.ts`, which mirrors the structure-only discipline of
  `exportPuzzleState` (never writes `cell.letter` or `clue.answer`).
- Puzzle data comes from `GET /api/v1/lists/:id/puzzles` (newest first); the
  export targets the first entry.
- Raw JSON/CSV list export (`exportListAsJSON` / `exportListAsCSV`,
  `GET /api/v1/lists/:id/export`) remains for data interchange and is out of
  scope here; an answer-key (filled grid) export is tracked separately if
  requested.
