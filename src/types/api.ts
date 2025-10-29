import type { CrosswordGrid, CrosswordNumbering, PuzzleSettings } from '@/types/crossword'

// API request/response types
export interface CreateTopicRequest {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface CreateListRequest {
  topicId: string
  name: string
  items: ListItemInput[]
}

export interface ListItemInput {
  answer: string
  clue: string
  note?: string
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface GeneratePuzzleRequest {
  listId: string
  gridSize?: { rows?: number; cols?: number }
  seed?: string
}

export interface GeneratePuzzleResponse {
  puzzleId: string
  grid: CrosswordGrid
  numbering: CrosswordNumbering
  settings: PuzzleSettings
}

export interface ImportListRequest {
  topic: string
  name: string
  version?: number
  items: {
    answer: string
    clue: string
    note?: string
    difficulty?: number
  }[]
}

export interface ExportListResponse {
  topic: string
  name: string
  version: number
  items: {
    answer: string
    clue: string
    note?: string
    difficulty?: number
  }[]
}

export interface UpdateSolveStateRequest {
  puzzleId: string
  state: string // JSON stringified solve state
  completed?: boolean
}

// API error types
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
