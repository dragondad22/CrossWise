# Product Requirements Proposal (PRP)

## 1) Product Snapshot
**Name (working):** CrossWise (Study Crosswords)
**One‑liner:** Upload JSON lists of terms & clues to auto‑generate shareable crosswords organized by topic.
**Primary users:** Self‑learners, teachers/trainers, teams.
**Success metric (v1):** Create → generate → solve a puzzle in < 2 minutes with >90% auto‑placement success for lists ≤ 500 entries.

---

## 2) Problem & Goals
**Problem:** Studying definitions and concepts can be dry. Existing crossword tools are either generic, manual, or don’t support structured topic sets.
**Goals:**
- Quickly generate a crossword puzzle from a list of ≤ 25 random entries from a topic term lists (JSON).
- Organize lists by topic and subtopic for repeatable study.
- Simple upload/import and re‑use.
- Mobile & desktop friendly solving experience with progress save.

**Non‑goals (v1):** Multi‑language UI, multiplayer co‑op solving, print‑layout editor, advanced styling marketplace.

---

## 3) User Stories (Prioritized)
1. **As a learner**, I can upload a JSON file of {word, clue} so I can generate a crossword for a topic.
2. **As a learner**, I can categorize a list into a topic (e.g., Context Engineering, Linux) and optional subtopic so I can find it later.
3. **As a learner**, I can click “New Game” to get a crossword grid that fits the words with minimal conflicts.
4. **As a solver**, I can navigate cells with keyboard or taps, see numbered clues (Across/Down), and fill answers.
5. **As a solver**, I can check correctness per letter/word or at the end, with configurable feedback.
6. **As a user**, My progress is autosaved so I can resume later.
7. **As a user**, I can export/import lists and puzzles for backup.
8. **As a user**, I can search/browse lists by topic and date.

---

## 4) Core Features & Requirements
### 4.1 Topic & List Management
- Create Topics (name, color/icon, description).
- Upload JSON list(s) and assign to topic/subtopic.
- Validate JSON schema (see §9.1) with clear errors & sample fix.
- Versioning: auto‑increment list version on edit; keep history.

### 4.2 Puzzle Generation
- Deterministic by seed (optional) to reproduce a layout.
- Backtracking algorithm with scoring heuristic:
  - Place longest words first; prefer placements creating max intersections.
  - Penalize isolated islands and excessive black cells.
  - Retry with shuffled order on failure until max tries.
- Configurable grid size (default 15×15; auto‑shrink/grow to bounds 9–19).
- Ensure every answer crosses at least one other (where possible).
- Auto numbering (Across then Down), clue mapping.

### 4.3 Solver UI
- Keyboard navigation: arrows to move, tab/shift‑tab to next clue, backspace behavior.
- Mobile gestures: tap to focus cell/clue; long‑press to clear word.
- Accessibility: screen‑reader labels, contrast‑safe palette, ARIA roles.
- “Check” modes: letter/word/puzzle; configurable reveal.
- Autosave progress (localStorage) per puzzle instance.

### 4.4 Library & Search
- Topic gallery with counts; recent lists; filter by topic/tag.
- Quick actions: New Game, Duplicate, Edit, Export.

### 4.5 Import/Export
- Import JSON file(s) or paste.
- Export list as JSON; export puzzle state as JSON; (stretch) export PDF/PNG.

---

## 5) UX Flows (Happy Paths)
1. **Upload → Validate → Assign Topic → Generate → Solve**
2. **Browse Topics → Pick List → Generate (seeded) → Share/Export**
3. **Resume**: Open puzzle → progress restored → continue.

**Wireframe notes:**
- Left: Grid. Right: Clues panel with tabs (Across/Down), search.
- Top bar: Topic chip, list name & version, Generate/Regenerate, Settings.

---

## 6) Acceptance Criteria (v1)
- Given a valid JSON list (≤ 500 items), clicking **New Game** produces a connected grid with ≤20% black cells and all words placed ≥90% of the time.
- Clue numbering follows crossword conventions; no duplicate numbers.
- Autosave works: refresh the page and the filled letters persist.
- Check modes function and never falsely flag correct letters.
- JSON validation errors show field name and index.

---

## 7) Architecture & Stack
**Front‑end:** Next.js (App Router), TypeScript, Tailwind, Zustand (or Redux) for state, shadcn/ui. Optional: Framer Motion.
**Back‑end:** Next.js API routes (or FastAPI if preferred) for persistence/generation; Node for generator for shared types.
**DB:** SQLite (local dev) → Postgres (prod). Prisma ORM.
**Storage:** Object storage (e.g., S3 compatible) for exports (stretch).
**Auth:** Email‑magic link (Clerk/Supabase Auth) (stretch) — v1 can be local/offline for single user.
**Deployment:** Vercel (FE+API) or Fly.io; Postgres via Supabase/Neon.

**Services:**
- Validation: Zod for JSON and API payloads.
- Seeded RNG: seedrandom.

---

## 8) Data Model (Relational)
**topics**
- id (uuid)
- name (string, unique)
- description (text?)
- color (string)
- icon (string)
- created_at

**lists**
- id (uuid)
- topic_id (fk → topics)
- name (string)
- version (int)
- tags (string[] / separate table list_tags)
- source (enum: upload|paste|api)
- created_at, updated_at

**list_items**
- id (uuid)
- list_id (fk → lists)
- answer (string, UPPERCASE, A‑Z only)
- clue (text)
- note (text?)
- difficulty (enum: 1..5)
- created_at

**puzzles**
- id (uuid)
- list_id (fk → lists)
- seed (string)
- grid (jsonb)  // cells with letters/blocks
- numbering (jsonb) // across/down arrays
- settings (jsonb) // size, check modes
- created_at

**solves** (optional, for multi-user)
- id (uuid)
- puzzle_id (fk)
- user_id (nullable in v1)
- state (jsonb) // filled letters
- completed_at (nullable)
- created_at, updated_at

---

## 9) Interfaces & Schemas
### 9.1 List JSON Schema (v1)
```json
{
  "topic": "Context Engineering",
  "name": "Foundations v1",
  "version": 1,
  "items": [
    { "answer": "PROMPT", "clue": "Instructional text provided to an LLM" },
    { "answer": "CONTEXTWINDOW", "clue": "The token span available to a model" },
    { "answer": "RETRIEVAL", "clue": "Bringing external knowledge into generation" }
  ]
}
```
**Validation rules:**
- `answer`: A–Z only, length 2–20; spaces replaced with no‑space or `-` stripped; convert to uppercase.
- `clue`: 3–200 chars.
- `items`: 5–50 for best results (v1 sweet spot 10–25).

### 9.2 Generate Puzzle API
`POST /api/puzzles/generate`
```ts
body: {
  listId: string,
  gridSize?: { rows?: number; cols?: number },
  seed?: string
}
```
**Response:**
```ts
{
  puzzleId: string,
  grid: Cell[][], // { row, col, type: 'block'|'cell', letter?: 'A'|'', number?: number }
  numbering: {
    across: { number: number; answer: string; clue: string; row: number; col: number; length: number }[],
    down:   { number: number; answer: string; clue: string; row: number; col: number; length: number }[]
  }
}
```

### 9.3 Upload List API
`POST /api/lists`
```ts
body: { topicId: string, name: string, items: { answer: string; clue: string; note?: string; difficulty?: number }[] }
```

### 9.4 Export/Import APIs
- `GET /api/lists/:id/export` → JSON
- `POST /api/lists/import` → accepts schema in 9.1

---

## 10) Algorithm Design (High Level)
1. **Preprocess:** Normalize answers (A–Z), compute letter frequency, sort by length desc.
2. **Placement search:**
   - Start with longest word; try center placement across/down.
   - For next words, score candidate placements by: intersections (weighted), boundary fit, new blocks created, adjacency rules (no 2‑letter orphan segments), connectivity.
   - Use backtracking with heuristic ordering; maintain best‑so‑far grid.
3. **Connectivity enforcement:** Ensure all placed words are reachable as one component (DFS on cells). If not, backtrack.
4. **Numbering:** Scan rows for Across starts (left edge or block on left, next is letter). Repeat columns for Down.
5. **Failover:** If cannot place ≥90% after N tries (e.g., 300), suggest to user which words conflict (e.g., rare letters with no overlaps) and allow regeneration or remove flagged words.

**Complexities & Tradeoffs:** NP‑hard variants; heuristic + backtracking sufficient for ≤50 words. Consider simulated annealing (stretch) for larger.

---

## 11) Settings (v1)
- Grid size: auto (9–19) or fixed.
- Check mode: off | letter | word | full (default: word).
- Symmetry: rotational on/off (default: off for max fit in study mode).
- Allow hyphens/apostrophes: normalize to letters only.

---

## 12) Security & Privacy
- No PII required. Lists stored per user account (or local‑only option).
- Rate limit generation to prevent abuse. Server‑side validation with Zod.
- CSP headers, HTTPS, parameterized queries via Prisma, audit logs (admin).

---

## 13) Telemetry / Metrics (opt‑in)
- Generation success rate, average attempts.
- Avg time to first puzzle, session duration, topics used.

---

## 14) Testing Strategy
- **Unit:** JSON validation, placement scoring, numbering, check modes.
- **Property‑based:** Random lists within bounds → invariants (no overlapping conflicts, numbering monotonic).
- **E2E:** Cypress to cover upload→generate→solve→resume.
- **Performance:** Generate ≤2s for 25 items on mid‑range CPU (target).

---

## 15) Risks & Mitigations
- **Placement failures on dense/thematic lists** → expose conflict insights, allow partial placement or split into two minis.
- **Mobile input friction** → large tap targets, explicit on‑screen nav controls.
- **Performance** → cap attempts, memoize candidate maps, web worker for generation.

---

## 16) Definition of Done
- All acceptance criteria pass.
- Docs: README with JSON examples; quickstart video/gif.
- At least 10 real lists tested (Context Engineering, Linux, Git, Python, etc.).

---

## 17) Reference Sample Data (Context Engineering)
```json
{
  "topic": "Context Engineering",
  "name": "CE Basics",
  "version": 1,
  "items": [
    { "answer": "PRIMER", "clue": "Short context to orient a model before tasks" },
    { "answer": "SYSTEMPROMPT", "clue": "Top‑level instruction guiding model behavior" },
    { "answer": "FEWSHOT", "clue": "Supplying examples to condition outputs" },
    { "answer": "TEMPLATE", "clue": "Reusable prompt structure with slots" },
    { "answer": "GUARDRAILS", "clue": "Constraints to keep outputs safe and on‑policy" },
    { "answer": "RETRIEVER", "clue": "Component that fetches relevant docs" },
    { "answer": "CHUNKING", "clue": "Breaking documents into manageable slices" }
  ]
}
```

---

## 18) Developer Notes
- Consider packaging the generator as `@crosswise/generator` with pure functions and unit tests; UI consumes it.
- Use Web Worker for generation to keep UI responsive; postMessage for progress.
- Maintain deterministic testing seeds in fixture files.



