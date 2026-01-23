# Major Components & Services

## Core Services
### `useAppStore` (`src/lib/store.ts`)
- Zustand store encapsulating topics, lists, active puzzle metadata, solve state, loading flags, and authenticated user details.
- Persists a subset of state (`selectedTopic`, `selectedList`, `currentPuzzle`, `solveState`, `user`) to `localStorage` (`crosswise-store` key).
- Provides rich helpers:
  - `updateCell`, `selectCell`, `selectClue`, `clearCell`, `clearWord` mutate solve state and maintain selection synchronisation with UI components.
  - `checkSolution(mode)` inspects the canonical grid in `currentPuzzle`, writes per-cell results for UI highlighting, and supports letter/word/puzzle scopes.
  - `checkWin()` recomputes completion across the entire grid, used to trigger the `WinModal`.
  - `saveSolveState` & `loadSolveState` mirror state directly to/from `localStorage`.

```ts
const { solveState, updateCell, selectClue } = useAppStore.getState()
updateCell(row, col, 'A')
selectClue('across', 12)
```

### `AutosaveManager` (`src/lib/autosave.ts`)
- Browser-only singleton that:
  - Registers the active puzzle and provides a `forceSave` hook for cell-change-driven saves to `localStorage`.
  - Optionally invokes a provided `onSave` callback so pages can sync with the server on each change.
  - Normalises `Date` objects during save/load, ensuring hydration is correct.
- Offers utilities such as `exportSolveState` (pretty JSON string), `importSolveState`, and `cleanupOldSaves`.

### `CrosswordGenerator` (`src/lib/crossword-generator.ts`)
- Deterministic generator keyed by seedrandom; uses heuristics to produce connected grids.
- Steps:
  1. Sanitises answers and sorts by length.
  2. Iteratively places words using scored candidates (intersection count, centrality, adjacency).
  3. Backtracks when conflicts occur, tracking best attempt across up to `maxAttempts` (default 300).
  4. Rebuilds a `CrosswordGrid` structure and generates across/down numbering.
- Returns placement metrics and conflicting words when 90% coverage cannot be achieved.

```ts
const generator = new CrosswordGenerator({ seed: 'demo', gridSize: { rows: 15, cols: 15 } })
const outcome = generator.generate(wordList)
if (outcome.success) {
  console.log(outcome.grid, outcome.numbering)
}
```

### Auth Helpers (`src/lib/auth.ts`)
- `hashPassword` / `verifyPassword` wrap bcryptjs.
- `createSession`, `getSessionForToken`, `deleteSessionByToken` manage the `Session` model and expiration logic.
- `sanitizeUser` ensures only non-sensitive fields flow to the client.

## API Handlers (selected)
| Handler | File | Highlights |
| --- | --- | --- |
| Login & Register | `src/app/api/v1/auth/login/route.ts`, `src/app/api/v1/auth/register/route.ts` | Zod validation, bcrypt comparison, session cookie issuance. |
| Session probe | `src/app/api/v1/auth/session/route.ts` | Returns `{ user: null }` without error when unauthenticated for easier client hydration. |
| Topics CRUD | `src/app/api/v1/topics/[id]/route.ts` | Uses Prisma includes for nested list metadata; handles uniqueness and not-found cases. |
| List fetch/update | `src/app/api/v1/lists/route.ts`, `src/app/api/v1/lists/[id]/route.ts` | Augments results with `userSolves` when a session exists, prevents duplicate answers post-normalisation, maps numeric difficulty to enum values. |
| Generate puzzle | `src/app/api/v1/puzzles/generate/route.ts` | Shuffles list items, limits to 25, stores generated grid/numbering/settings JSON strings. |
| Solve state sync | `src/app/api/v1/puzzles/[id]/solve/route.ts` | Enforces authentication, merges stored solve state, upserts completion status. |

## UI Components
| Component | File | Notes |
| --- | --- | --- |
| `AppHeader` | `src/components/AppHeader.tsx` | Displays auth state, triggers logout flow, and navigates back to the homepage. |
| `CreateTopicModal` / `ImportListModal` / `EditListModal` | `src/components/*Modal.tsx` | Form-heavy components handling validation feedback, dynamic item editing, and sample data loading. |
| `CrosswordGrid` | `src/components/CrosswordGrid.tsx` | Adapts cell dimensions responsively, maps keyboard events to store actions, highlights selected clues, and renders numbering. |
| `ClueList` | `src/components/ClueList.tsx` | Search filter, completion status indicator based on `checkResults`, and pointer/keyboard accessible selection. |
| `PuzzleControls` | `src/components/PuzzleControls.tsx` | Exposes check/clear actions, displays progress stats, and re-routes to topics when needed. |
| `WinModal` | `src/components/WinModal.tsx` | Simple completed-state CTA, integrates with router to start fresh puzzles or exit. |
| `ListCard` / `TopicCard` | `src/components/ListCard.tsx`, `src/components/TopicCard.tsx` | Summaries using `date-fns`, handle quick navigation and actions (new game, export, edit). |
| UI primitives | `src/components/ui` | Tailwind-based Button, Card, Badge with variants and focus styles. |

## Types & DTOs
- `SolveState` (`src/types/crossword.ts`) tracks filled cells, selection, check results, and timestamps—shared between client and server.
- `ListWithItemsAndTopic` (`src/types/database.ts`) extends Prisma projections to include nested relations plus optional `userSolves`.
- API request/response shapes in `src/types/api.ts` document payload expectations for list creation, puzzle generation, and solve updates.

## Configuration Assets
- `src/app/globals.css` defines Tailwind layer customisations, responsive crossword tweaks, print/high-contrast modes, and reduced-motion support.
- `tailwind.config.ts` extends the design system with named colours, radii, and box shadows used throughout UI components.
