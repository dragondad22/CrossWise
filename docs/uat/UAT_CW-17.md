# UAT — CW-17: Import answers must contain only allowed characters

- Work Item: CW-17 (#17)
- Feature / Workflow: List import answer-character validation (fail-closed)
- Environment: local / preview

## Behavior Under Test

Importing a word list (pasted JSON or uploaded file) where any answer contains a
character outside the letters A–Z (after uppercasing) must **deny the whole
import** with a friendly error that names the offending word. Nothing may be
silently stripped or partially imported.

## Acceptance Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Happy path | Import a list whose answers are all letters (any case) | Import succeeds; answers stored uppercased; item count matches |
| 2 | Accented character | Include `CAFÉ` in an otherwise valid list | 400 / modal error naming `CAFÉ`, mentioning letters A–Z; nothing created |
| 3 | Digit / hyphen / space | Include `WORD3`, `SEA-LION`, or `FENNEC FOX` | Same as #2, naming the exact word |
| 4 | No silent strip (regression) | Import `CAF-É3` | Import denied; **no** list item `CAF` appears anywhere |
| 5 | Whole-import denial | 9 valid words + 1 invalid | Zero items created; error names only the invalid word |
| 6 | Accessibility | Trigger a validation error in the Import modal | Error list is announced (role="alert"), readable, and keyboard-reachable |
| 7 | Auth boundary | Call `POST /api/v1/lists/import` without a session | 401 before any validation/write |

## Notes

- The allowed-character rule lives in `src/lib/validation.ts`
  (`ANSWER_ALLOWED_PATTERN`, `AnswerSchema`) and is shared by client and server;
  CSV import (#31) must reuse the same helper.
- Case is the only permitted normalization (`normalizeAnswer` uppercases only).
