# CrossWise Specification

## Purpose
CrossWise is a web app for turning vocabulary/term lists into shareable crossword puzzles. Users organize word lists by topic, generate puzzles from those lists, solve them with full keyboard/touch controls, and sync their progress to a server account while retaining local autosave.

This document is the authoritative product + engineering specification for the current codebase. It should let a developer implement or extend the system without reading the full repo.

## Scope
### In scope (current implementation)
- Topic management (create, list, update, delete).
- List management (import, update, export, generate puzzles).
- Crossword generation with deterministic seeds.
- Puzzle solving UI with keyboard + touch navigation.
- Local autosave + server sync for solve state.
- User accounts + session cookies for auth.
- REST-style JSON API under `/api/v1/...`.

### Out of scope / stretch
- Multi-user collaboration or sharing features.
- Public sharing links or guest play.
- Export formats beyond JSON/CSV (PDF/PNG are listed as stretch in code).
- Advanced puzzle symmetry, hyphen handling, or black-square design constraints beyond current generator rules.

## Key Product Requirements
### Functional requirements
1. **Topics**
   - Users can list, create, edit, and delete topics.
   - Each topic has name, optional description, color hex, and icon (emoji).

2. **Lists**
   - Lists belong to a topic and contain items (answer + clue + optional note/difficulty).
   - Import via JSON (and CSV parsing exists client-side in `export.ts`).
   - Update list items, add/remove items, update name/version.
   - Delete lists, which also removes associated puzzles/solves.
   - Export list as JSON per import schema.

3. **Puzzle generation**
   - Generate from a list using up to 150 items, randomized selection, seeded placement.
   - Grid size defaults to 15x15, with optional 9–19 range per axis.
   - Algorithm prioritizes longest words, requires connected component, avoids adjacent touching except intersections, and targets 90%+ placement.
   - Store puzzle grid, numbering, and settings in database as JSON strings.

4. **Puzzle solving**
   - Provide interactive crossword grid + clue list (Across/Down tabs).
   - Keyboard navigation: arrows, tab, typing letters, backspace, etc.
   - Touch support: hidden input to trigger on-screen keyboard.
   - User can check letter/word/puzzle; correct words lock cells.
   - Win detection when all required cells are filled correctly.

5. **Autosave and sync**
   - Local autosave on each change via `localStorage`.
   - Server sync on autosave with session auth.
   - When loading a puzzle, resolve conflicts using newest `lastSaved` timestamp between local and remote state.

6. **Auth**
   - Email/password registration.
   - Login to create session cookie.
   - Session endpoint to hydrate user on page load.
   - Logout clears session cookie.

### Non-functional requirements
- Responsive UI: desktop/tablet/mobile.
- Accessible keyboard navigation and focus management for grid/clues.
- Fast puzzle generation target: < 2 seconds for 150 words (README claim).
- Safe storage of passwords (bcrypt hashing).
- API returns consistent JSON with `success` + `data` or `error`.

## System Architecture
### Frontend
- **Framework:** Next.js 15 App Router (`src/app`).
- **State management:** Zustand with persistence (`src/lib/store.ts`) for non-puzzle UI state; puzzle progress is stored per puzzle via autosave.
- **UI components:** `src/components` + Tailwind CSS.
- **Auth hydration:** `AuthProvider` receives server-initial user from `app/layout.tsx`.
- **Autosave:** `autosaveManager` handles local + server sync (`src/lib/autosave.ts`).

### Backend / API
- **Framework:** Next.js API Route Handlers under `src/app/api/v1`.
- **Auth:** Custom sessions in database, cookie stored in `crosswise_session`.
- **Validation:** Zod schemas in `src/lib/validation.ts`.
- **DB access:** Prisma client (`src/lib/db.ts`).

### Data storage
- **Database:** PostgreSQL (Prisma schema in `prisma/schema.prisma`).
- **Local storage:**
  - `crosswise-store`: persisted subset of Zustand store (selected topic/list, user).
  - `crosswise_solve_<puzzleId>`: local autosave state for a puzzle.

## Data Model (Prisma)
### Topic
- `id` (cuid, PK)
- `name` (unique)
- `description` (optional)
- `color` (hex, default `#3B82F6`)
- `icon` (default `📚`)
- `createdAt`
- relations: `lists[]`

### List
- `id` (cuid, PK)
- `topicId` (FK)
- `name`
- `version` (int)
- `tags` (string, JSON serialized array, currently unused)
- `source` (enum: `UPLOAD|PASTE|API`)
- `createdAt`, `updatedAt`
- relations: `topic`, `items[]`, `puzzles[]`

### ListItem
- `id` (cuid, PK)
- `listId` (FK)
- `answer` (uppercase A–Z only)
- `clue`
- `note` (optional)
- `difficulty` (enum: `EASY|MEDIUM|HARD`)
- `createdAt`

### Puzzle
- `id` (cuid, PK)
- `listId` (FK)
- `seed`
- `grid` (JSON string)
- `numbering` (JSON string)
- `settings` (JSON string)
- `createdAt`
- relations: `list`, `solves[]`

### Solve
- `id` (cuid, PK)
- `puzzleId` (FK)
- `userId` (FK, nullable)
- `state` (JSON string)
- `completedAt` (optional)
- `createdAt`, `updatedAt`
- unique: `(puzzleId, userId)`

### User
- `id` (cuid, PK)
- `email` (unique)
- `name` (optional)
- `passwordHash`
- `createdAt`, `updatedAt`
- relations: `solves[]`, `sessions[]`

### Session
- `id` (cuid, PK)
- `userId` (FK)
- `token` (unique)
- `expiresAt`
- `createdAt`

## API Specification (v1)
All endpoints return JSON with `{ success: boolean, data?: ..., error?: ... }` unless noted.
Authentication: cookie `crosswise_session` required for most endpoints.

### Auth
- `POST /api/v1/auth/register`
  - Body: `{ email, password, name? }`
  - Creates user + session. Sets cookie.
  - Errors: 400 (Zod), 409 (email exists), 500.

- `POST /api/v1/auth/login`
  - Body: `{ email, password }`
  - Creates session, sets cookie.
  - Errors: 400 (Zod), 401 (invalid credentials), 500.

- `GET /api/v1/auth/session`
  - Returns `{ user: AuthUser | null }`.
  - Does not error on missing session.

- `POST /api/v1/auth/logout`
  - Deletes session token, clears cookie.

### Topics
- `GET /api/v1/topics`
  - Auth required.
  - Returns topics ordered by `createdAt desc`, with list count.

- `POST /api/v1/topics`
  - Auth required.
  - Body: `{ name, description?, color?, icon? }`.
  - Errors: 400 (Zod), 409 (name conflict), 500.

- `GET /api/v1/topics/:id`
  - Auth required.
  - Returns topic + lists (with item counts).
  - Errors: 404, 500.

- `PUT /api/v1/topics/:id`
  - Auth required.
  - Body: same as create.
  - Errors: 404, 500.

- `DELETE /api/v1/topics/:id`
  - Auth required.
  - Errors: 404, 500.

### Lists
- `GET /api/v1/lists?topicId=...`
  - Auth required.
  - Returns lists with topic + items + puzzle counts, plus user solves for those lists.

- `POST /api/v1/lists`
  - Auth required.
  - Body: `{ topicId, name, items[] }` where items are `{answer, clue, note?, difficulty?}`.
  - Normalizes answers to uppercase A–Z.
  - Errors: 404 (topic not found), 500.

- `PUT /api/v1/lists/:id`
  - Auth required.
  - Body: `{ name, version?, items[] }` where items can include `id`.
  - Deletes items missing in payload. Normalizes answers and ensures uniqueness post-normalization.
  - Errors: 400 (validation), 404, 500.

- `POST /api/v1/lists/import`
  - Auth required.
  - Body: import JSON schema `{ topic, name, version, items[] }`.
  - Auto-creates topic if missing.
  - Errors: 400 (validation or JSON), 409 (duplicate list), 500.

- `GET /api/v1/lists/:id/export`
  - Auth required.
  - Returns JSON file download in import schema format.
  - Errors: 404, 500.

- `DELETE /api/v1/lists/:id`
  - Auth required.
  - Deletes the list and cascades to list items, puzzles, and solves.
  - Returns `{ listId, puzzleIds }`.
  - Errors: 404, 500.

- `GET /api/v1/lists/:id/puzzles`
  - Auth required.
  - Returns 10 most recent puzzles for list.

### Puzzles
- `POST /api/v1/puzzles/generate`
  - Auth required.
  - Body: `{ listId, gridSize?, seed? }`.
  - Randomly selects up to 150 list items.
  - Uses `CrosswordGenerator` to create grid/numbering.
  - Errors: 400 (invalid request), 404 (list not found), 422 (generation failed), 500.

- `GET /api/v1/puzzles/:id/solve`
  - Auth required.
  - Returns puzzle data + existing solve state if present.
  - Puzzle includes list, topic, items.

- `POST /api/v1/puzzles/:id/solve`
  - Auth required.
  - Body: `{ puzzleId, state, completed? }` with `state` as JSON string.
  - Upserts solve state for user+puzzle.
  - Errors: 400 (ID mismatch), 404, 500.

### Solves
- `POST /api/v1/solves/bulk`
  - Auth required.
  - Body: `{ action: 'reset'|'delete', solveIds: string[] }`.
  - `reset` clears solve state + completedAt; `delete` removes solves.

## Validation & Normalization Rules
- **List item answers:** normalized to uppercase A–Z; length 2–20.
- **Clue length:** 3–200 chars.
- **Import list items:** min 5, max 250 (optimal up to 150 for generation).
- **Difficulty:** accepts numeric 1–5 or string `EASY|MEDIUM|HARD`; mapped to enum.
- **Topic color:** must match hex `#RRGGBB`.

## Puzzle Generation Details
- Uses `CrosswordGenerator` with backtracking + scoring.
- Places longest words first. First word placed at center, across.
- Valid placement rules:
  - No out-of-bounds.
  - Letters must match intersections.
  - Adjacent cells (parallel) cannot touch unless intersecting.
  - Word boundaries must be empty (no touching before/after word).
- Scores placements by intersections (quadratic reward) and centrality.
- Attempts up to 300 shuffled word orderings.
- Success if >= 90% of words placed; otherwise returns conflicting words.

## Solve State & Autosave
- Solve state includes filled cells, selected cell/clue, start/end times, check results, locked cells.
- Local autosave writes on change to `localStorage` + emits events for UI status.
- Server sync is queued and serialized; if a sync is in progress, the newest pending state is retried after completion.
- Conflict resolution on load uses `lastSaved` timestamp (remote vs local).
- Win detection: all non-block cells must be filled with correct letters.

## Error Handling Strategy
- Server API catches errors and returns consistent JSON structure.
- Zod validation errors return 400 with details.
- Auth-required endpoints return 401 if no valid session cookie.
- Not found resources return 404.
- Conflicts return 409 (topic name or list version).
- Generation failure returns 422 with placed/total/conflicting words.
- Client code treats non-OK responses as errors and shows messages via Zustand state.
- Autosave sync handles offline and session expiration gracefully, preferring local persistence.

## Security & Privacy
- Passwords hashed with bcrypt (salt rounds = 12).
- Session tokens stored in DB; cookie is `httpOnly`, `sameSite=lax`, `secure` in production.
- Session expiration: 7 days, refreshed if <24h left.
- PII stored: email + optional name + password hash.

## Testing Plan
### Current test tooling
- **Runner:** Vitest (`npm run test`).
- **DOM:** JSDOM, React Testing Library.
- **Coverage:** `npm run test:coverage`.

### Existing coverage areas (from repo)
- Crossword generator logic (`src/lib/__tests__/crossword-generator.test.ts`).
- Validation and utility functions.
- Autosave behavior.
- Store behavior and solve state normalization.
- API route handlers for lists, topics, puzzles, solves.
- UI components: clue list, grid, controls, solve surface.

### Recommended test additions
1. **API integration tests**
   - Use a test DB and verify full request/response flows (auth, create topic, import list, generate puzzle, save solve).
2. **Auth edge cases**
   - Expired session refresh, logout invalidation, multiple sessions.
3. **Generator robustness**
   - High-conflict word sets, small grid sizes, deterministic seeds.
4. **Autosave conflict resolution**
   - Local vs remote `lastSaved` ordering and recovery from corrupt local JSON.
5. **End-to-end** (optional)
   - Playwright/Cypress flow: login → topics → list → generate → solve → sync.

## Configuration
- **Env:** `DATABASE_URL` for PostgreSQL.
- **Node:** 18+.
- **Scripts:**
  - `npm run dev` (Next dev server)
  - `npm run db:push` (Prisma push)
  - `npm run seed` (optional sample data)

## Operational Notes
- Prisma client is cached in dev to avoid re-instantiation.
- `prisma` models store JSON as strings; ensure consistent serialization/deserialization.
- Solve state in DB is stored as JSON string (not structured columns).
- API endpoints generally assume authenticated users; UI redirects to login when needed.

## AI Maintenance Instructions
- **Always update this file (`crosswise_spec.md`) when you change:**
  - Prisma schema or any persisted data shape.
  - API routes (paths, request/response formats, status codes).
  - Crossword generation logic or constraints.
  - Auth/session behavior or cookie settings.
  - Client-side solve state structure, autosave rules, or UI flows.
- **Add a short “Change Log” entry at the bottom** describing what changed and why.
- **Keep the spec accurate and minimal**: reflect current code, avoid speculative future features.

---

## Change Log
- 2026-01-30: Tightened crossword grid sizing to account for gap/padding/border and avoid mobile overflow; cells now use border-box sizing and the grid scales to the available container.
- 2026-01-30: Adjusted solve page desktop layout to top-align the puzzle grid with the clue list to remove excess vertical spacing while keeping mobile spacing unchanged.
- 2026-01-30: Updated persistence notes to reflect that `crosswise-store` no longer saves puzzle-scoped state; puzzle progress is stored per-puzzle via autosave keys.
- 2026-01-30: Added list deletion (cascades to puzzles/solves), including DELETE `/api/v1/lists/:id` and topics list UI flow.
- 2026-01-29: Raised puzzle generation selection cap to 150 items across specs/docs.
- 2026-01-29: Initial consolidated spec created from current codebase.
