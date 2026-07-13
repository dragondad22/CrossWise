/**
 * API contract types for `/api/v1`.
 *
 * SINGLE SOURCE OF TRUTH: request shapes are **derived** from the Zod schemas in
 * `src/lib/validation.ts` — do not hand-write request interfaces here. Define a new
 * endpoint's contract as a Zod schema in `validation.ts`, then derive its type below.
 * This keeps runtime validation and compile-time types from drifting (issue #44).
 *
 * Note on `z.input` vs `z.infer`: request types use `z.input` (the shape the *client
 * sends*, before defaults/transforms run), so optional-with-default fields stay optional.
 *
 * Response types have no schema yet and are declared directly; give them schemas (and
 * derive their types the same way) when response validation or OpenAPI generation is
 * introduced — see ADR-004 (planned).
 */
import { z } from 'zod'
import {
  CreateTopicSchema,
  CreateListSchema,
  ListItemInputSchema,
  GeneratePuzzleSchema,
  ImportListSchema,
  UpdateSolveStateSchema,
  RegisterSchema,
  LoginSchema,
} from '@/lib/validation'
import type { CrosswordGrid, CrosswordNumbering } from '@/types/crossword'

// --- Request types (derived from Zod schemas) ---

export type CreateTopicRequest = z.input<typeof CreateTopicSchema>
export type CreateListRequest = z.input<typeof CreateListSchema>
export type ListItemInput = z.input<typeof ListItemInputSchema>
export type GeneratePuzzleRequest = z.input<typeof GeneratePuzzleSchema>
export type ImportListRequest = z.input<typeof ImportListSchema>
export type UpdateSolveStateRequest = z.input<typeof UpdateSolveStateSchema>
export type RegisterRequest = z.input<typeof RegisterSchema>
export type LoginRequest = z.input<typeof LoginSchema>

// --- Response types (no schema yet; declared directly) ---

export interface GeneratePuzzleResponse {
  puzzleId: string
  grid: CrosswordGrid
  numbering: CrosswordNumbering
  seed: string
  placedWords: number
  totalWords: number
  // Words that did not fit the grid when a partial puzzle was accepted (#99).
  unplacedWords: string[]
}

export interface ExportListResponse {
  topic: string
  name: string
  version: number
  items: {
    answer: string
    clue: string
    note?: string
    // Export emits numeric difficulty (1-3); persisted storage uses the EASY/MEDIUM/HARD enum.
    difficulty?: number
  }[]
}

// --- Response envelope / error types ---

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
}
