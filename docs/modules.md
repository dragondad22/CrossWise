# Module Catalogue

## Application Shell & Routing
| Module | Location | Responsibilities | Depends On |
| --- | --- | --- | --- |
| `RootLayout` | `src/app/layout.tsx` | Server component that resolves the session cookie, hydrates initial auth state, and renders the global header plus page content. | `@/lib/auth`, `next/headers`, `AuthProvider`, `AppHeader` |
| `Home` | `src/app/page.tsx` | Marketing-style landing page linking into topics and registration. | UI primitives |
| `LoginPage` / `RegisterPage` | `src/app/login/page.tsx`, `src/app/register/page.tsx` | Client-side forms that post to auth APIs and hydrate the Zustand store. | `useAppStore`, `/api/v1/auth/*` |
| `TopicsPage` | `src/app/topics/page.tsx` | Fetches topics, drives topic creation modal, and sets global selection. | `useAppStore`, `/api/v1/topics`, `CreateTopicModal`, `TopicCard` |
| `ListsPage` | `src/app/topics/[id]/lists/page.tsx` | Manages list fetching, import/edit modals, puzzle generation/export triggers. | `useAppStore`, `/api/v1/topics/:id`, `/api/v1/lists`, `/api/v1/puzzles/generate`, multiple modals |
| `SolvePage` | `src/app/solve/[id]/page.tsx` | Loads puzzle & solve state, orchestrates autosave, and renders solving UI. | `useAppStore`, `autosaveManager`, `/api/v1/puzzles/:id/solve`, presentation components |

## API Route Handlers
| Namespace | Location | Responsibilities | Depends On |
| --- | --- | --- | --- |
| Auth | `src/app/api/v1/auth/*/route.ts` | Login, register, logout, and session probing. | `@/lib/auth`, `@/lib/validation`, `prisma`, cookies |
| Topics | `src/app/api/v1/topics/**/*.ts` | CRUD topics plus detail fetch with list counts. | `prisma`, `CreateTopicSchema` |
| Lists | `src/app/api/v1/lists/**/*.ts` | Fetch lists with optional user solve metadata, create/import/update lists, export lists, list recent puzzles. | `prisma`, `CreateListSchema`, `UpdateListSchema`, `validateListJSON`, `normalizeAnswer`, auth helper |
| Puzzles | `src/app/api/v1/puzzles/**/*.ts` | Generate new puzzles and load/save solve state (auth-only). | `CrosswordGenerator`, `GeneratePuzzleSchema`, `UpdateSolveStateSchema`, session helpers |

## Core Libraries
| Module | Location | Summary | Key Collaborators |
| --- | --- | --- | --- |
| `auth` | `src/lib/auth.ts` | Password hashing & verification, session CRUD, cookie metadata. | Prisma session & user models, crypto, bcrypt |
| `db` | `src/lib/db.ts` | Exposes a singleton Prisma client to avoid hot-reload leaks. | Prisma |
| `autosave` | `src/lib/autosave.ts` | Manages change-driven browser saves and optional server sync callbacks. | `localStorage`, `SolveState`, `SolvePage` |
| `crossword-generator` | `src/lib/crossword-generator.ts` | Deterministic, heuristic backtracking generator for crossword grids and numbering. | `seedrandom`, crossword types |
| `store` | `src/lib/store.ts` | Zustand store for topics, lists, puzzles, solve state, auth, and helper actions (check, clear, persistence). | `localStorage`, `SolvePage`, topic/list pages |
| `validation` | `src/lib/validation.ts` | Zod schemas for API requests, list imports, and answer utilities. | API handlers, modals |
| `export` | `src/lib/export.ts` | JSON/CSV export helpers, filename utilities, import parsing. | List/Puzzle flows |
| `seed-data` | `src/lib/seed-data.ts` | Database seeding/clearing helpers used by CLI scripts. | Prisma, `hashPassword` |
| `utils` | `src/lib/utils.ts` | Minimal utility helpers (`cn`). | UI components |

## Components
| Component | Location | Purpose | Notes |
| --- | --- | --- | --- |
| `AppHeader` | `src/components/AppHeader.tsx` | Sticky navigation bar with auth-aware actions. | Uses `/api/v1/auth/logout` |
| `AuthProvider` | `src/components/AuthProvider.tsx` | Hydrates Zustand with server-provided user on mount. | Client-side wrapper |
| `CrosswordGrid` | `src/components/CrosswordGrid.tsx` | Renders interactive grid, handles keyboard navigation, clue selection, and highlighting. | Talks to `useAppStore` |
| `ClueList` | `src/components/ClueList.tsx` | Searchable clue list with status indicator per entry. | Depends on store selection & check results |
| `PuzzleControls` | `src/components/PuzzleControls.tsx` | Toolbar for navigation, check/clear actions, and progress display. | Uses store actions |
| `ListCard`, `TopicCard` | `src/components/*.tsx` | Dashboard cards surfacing metadata and quick actions. | Date formatting via `date-fns` |
| Modals | `src/components/*Modal.tsx` | Create/import/edit experiences for topics and lists. | Leverage validation helpers |
| UI primitives | `src/components/ui/*.tsx` | Buttons, cards, badges styled with Tailwind tokens. | Share `cn` helper |
| `WinModal` | `src/components/WinModal.tsx` | End-of-puzzle celebration with next actions. | Triggered by store `isWon` |

## Types & Schemas
- `src/types/crossword.ts`: Structural types for grids, clues, placements, and solve state.
- `src/types/database.ts`: Prisma-backed entity shapes and typed composites (e.g. lists with items and solves).
- `src/types/auth.ts`, `src/types/api.ts`: Shared DTOs for auth and API payload descriptions.

## Tooling & Scripts
| Item | Location | Purpose |
| --- | --- | --- |
| Prisma schema | `prisma/schema.prisma` | Declares database models, relations, enums, and maps snake_case columns. |
| Seed script | `scripts/seed.ts` | CLI entry to seed, clear, or reset the database using `tsx`. |
| Configuration | `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `.env` | Framework, styling, compiler, and environment configuration. |
