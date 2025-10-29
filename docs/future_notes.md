# Future Notes & Technical Debt

## Platform & Architecture
- **Authentication scope:** APIs beyond `/api/puzzles/:id/solve` do not enforce auth; topic/list CRUD should require ownership/role checks. PRP envisions admin/user roles that are not yet implemented.
- **Session lifetime management:** Session expiry is enforced server-side, but there is no refresh flow or background cleanup. Consider rotating tokens and pruning expired rows via cron/job.
- **Prisma client usage:** `src/app/api/lists/[id]/puzzles/route.ts` instantiates a new `PrismaClient` rather than the shared singleton. Consolidate on `@/lib/db` to avoid connection churn in serverless environments.

## Domain Features
- **List versioning:** UI exposes a manual version input, yet edits do not auto-increment or track history. Add optimistic version bumping and audit trails.
- **Puzzle difficulty filtering:** PRP specifies difficulty-aware generation; current generator randomly samples words without respecting stored difficulty metadata. Add difficulty selectors and weighting.
- **Settings surface:** Solve controls expose check/clear actions but no configurable check mode, symmetry, or word count selection. Align with planned settings (see PRP §4.2 & §11).
- **Import sources:** Import modal only posts JSON despite support functions for CSV. Extend the UI to accept CSV uploads and provide richer validation messaging.

## UX & Accessibility
- **Responsive captcha:** Mobile tweaks exist in CSS, yet crossword grid still relies on keyboard interactions (e.g., Tab handling). Consider on-screen controls for clue navigation and ARIA annotations for cells.
- **Error handling:** Fetch failures surface generic toasts via `setError`, but there is no global notification component. Introduce consistent feedback and retry affordances.
- **Win condition detection:** `checkWin` polls on demand. Trigger auto-win evaluation after each `updateCell` to avoid manual checks.

## Infrastructure & Tooling
- **Testing:** No automated tests are present. Add unit coverage for the generator, validation helpers, and store logic, plus integration tests for key flows.
- **Observability:** Introduce logging standards (structured logs) and analytics hooks to meet PRP telemetry goals.
- **Deployment readiness:** Document production migration strategy (`prisma migrate` vs `db push`), add health checks, and clarify backup/restore procedures for puzzle data.

## Data Model Considerations
- **Solve state payload size:** Entire solve JSON is stored in the database. Evaluate compression or diff strategies for long-running puzzles.
- **Cascade deletions:** Prisma relations use `onDelete: Cascade`, but UI lacks confirmation flows. Ensure UX warns users before destructive operations (topic/list deletion).
- **List uniqueness:** Import endpoint prevents duplicates by name/version but returns 409 without alternative guidance. Consider version bump suggestions or merging assistance.
