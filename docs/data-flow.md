# Data Flow

## Authentication & Session Hydration
- Sign-in happens on the shared accounts service (ADR-009). `/login` redirects to `https://accounts.buildyouralpaca.com/sign-in` with a return link. After sign-in, the accounts service sets the `__Secure-alpaca.session_token` cookie for `buildyouralpaca.com`, so it reaches CrossWise.
- Root server layout (`src/app/layout.tsx`) forwards the `alpaca.*` cookies to the accounts service's `/api/auth/get-session` on every request. It creates or updates the local `users` row (id, email, name), passes the user into `AuthProvider`, and the client store hydrates itself on mount.
- API routes do the same lookup through `requireSession` (`src/lib/api-auth.ts`): 401 when signed out, 503 when the accounts service can't be reached. Full detail: `docs/auth-session-flow.md`.

```mermaid
sequenceDiagram
    participant UI as Client UI
    participant Accounts as Accounts service
    participant CW as CrossWise (layout / API)
    participant DB as Prisma + Database

    UI->>Accounts: Sign in (redirect from /login)
    Accounts-->>UI: Set-Cookie __Secure-alpaca.session_token (buildyouralpaca.com)
    UI->>CW: Request + alpaca.* cookie
    CW->>Accounts: GET /api/auth/get-session (3 s timeout)
    Accounts-->>CW: { user } or null
    CW->>DB: upsert users row (id, email, name)
    CW-->>UI: Page with user, or 401 / 503 from API routes
    UI->>UI: useAppStore.hydrateUser(user)
```

## Topic & List Retrieval
- Topics are fetched via `/api/v1/topics` (auth required). The API returns topics with list counts.
- When navigating to a topic, the client requests `/api/v1/topics/:id` for metadata and `/api/v1/lists?topicId=...` for lists. The list handler looks up the user through the cookie and joins recent solve history.

```mermaid
sequenceDiagram
    participant UI as Topics UI
    participant TopicsAPI as /api/v1/topics
    participant ListsAPI as /api/v1/lists
    participant DB as Prisma

    UI->>TopicsAPI: GET /api/v1/topics
    TopicsAPI->>DB: topic.findMany + _count
    TopicsAPI-->>UI: JSON topics[]
    UI->>ListsAPI: GET /api/v1/lists?topicId=ID (cookie)
    ListsAPI->>DB: list.findMany(include topic, items, puzzles)
    alt Authenticated
        ListsAPI->>DB: solve.findMany(userId, listIds)
        ListsAPI-->>UI: lists + solves
    else Anonymous
        ListsAPI-->>UI: lists
    end
    UI->>UI: useAppStore.setTopics/lists(...)
```

## List Import & Maintenance
- Import modal validates JSON client-side with `validateListJSON`. On success it posts to `/api/v1/lists` (new lists) or `/api/v1/lists/import` (auto-topic creation). The API normalises answers, creates list items inside a transaction, and returns the enriched list for UI refresh.
- Edits go through `PUT /api/v1/lists/:id`, which normalises answers, enforces uniqueness, updates/deletes/creates items via a transaction, and returns the updated list plus user solve summaries.

## Puzzle Generation Pipeline
- `POST /api/v1/puzzles/generate` accepts a list ID and optional seed/grid size. The handler fetches the list, picks up to 150 shuffled items, and feeds them to `CrosswordGenerator`.
- The generator preprocesses answers, evaluates placement candidates with heuristics (intersections, adjacency, connectivity), and keeps the best attempt across retries. On success, the handler persists the grid/numbering/settings JSON blobs and responds with the new puzzle ID.

```mermaid
sequenceDiagram
    participant UI as ListsPage
    participant API as /api/v1/puzzles/generate
    participant Prisma
    participant Generator as CrosswordGenerator

    UI->>API: POST { listId, seed?, gridSize? }
    API->>Prisma: list.findUnique(include items)
    API->>Generator: generate(items[])
    Generator-->>API: { success, grid, numbering }
    API->>Prisma: puzzle.create({ grid, numbering, settings })
    API-->>UI: { puzzleId, seed, metrics }
    UI->>UI: router.push(/solve/puzzleId)
```

## Solve State Lifecycle
- When the solver page mounts, it loads autosaved state from `localStorage` and requests `/api/v1/puzzles/:id/solve`. The API validates the session, returns puzzle data and any server-stored solve state.
- The page merges data, seeds the Zustand store, and registers autosave handlers. On every cell change (keypress/clear), the autosave manager writes to `localStorage` and invokes the server-sync callback. The callback posts a JSON-serialised solve state to the same endpoint; the server upserts a `Solve` row and stamps `completedAt` if the client reports completion.
- Manual checks (`letter`, `word`, `puzzle`) leverage the stored solution grid to annotate `checkResults` in the store, which powers clue status styling.

```mermaid
sequenceDiagram
    participant UI as SolvePage
    participant Autosave
    participant API as /api/v1/puzzles/:id/solve
    participant Prisma
    participant Storage as localStorage

    UI->>Storage: load crosswise_solve_{id}
    UI->>API: GET /api/v1/puzzles/:id/solve (cookie)
    API->>Prisma: puzzle.findUnique(include list)
    API->>Prisma: solve.findFirst(userId, puzzleId)
    API-->>UI: { puzzle, state? }
    UI->>UI: useAppStore.setPuzzle/solveState
    UI->>Autosave: startAutosave(id, getState, onSave)
    UI->>Autosave: cell change -> forceSave
    Autosave->>Storage: save JSON snapshot
    Autosave->>API: POST /api/v1/puzzles/:id/solve { state, completed? }
    API->>Prisma: upsert solve row
    API-->>Autosave: 200 OK, 401 (signed out) or 503 (accounts service down)
```

## Import / Export Flows
- **Export list:** Browser calls `GET /api/v1/lists/:id/export`; server emits PRP-compliant JSON with `Content-Disposition`. The UI creates a Blob and forces download.
- **Export solve state:** `PuzzleControls` uses `autosaveManager.exportSolveState` to serialise the local state and trigger a file download client-side without a network round-trip.
- **Import solve state (future-ready):** Autosave manager exposes `importSolveState` to hydrate from JSON backups if needed.
