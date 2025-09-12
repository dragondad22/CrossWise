// Core crossword types
export interface CrosswordCell {
  row: number
  col: number
  type: 'block' | 'cell'
  letter?: string
  number?: number
  isSelected?: boolean
  isHighlighted?: boolean
  isCorrect?: boolean
  isIncorrect?: boolean
}

export interface ClueEntry {
  number: number
  answer: string
  clue: string
  row: number
  col: number
  length: number
  direction: 'across' | 'down'
}

export interface CrosswordNumbering {
  across: ClueEntry[]
  down: ClueEntry[]
}

export interface CrosswordGrid {
  cells: CrosswordCell[][]
  size: { rows: number; cols: number }
}

export interface CrosswordPuzzle {
  id: string
  grid: CrosswordGrid
  numbering: CrosswordNumbering
  seed: string
  settings: PuzzleSettings
}

export interface PuzzleSettings {
  gridSize?: { rows?: number; cols?: number }
  checkMode: 'off' | 'letter' | 'word' | 'full'
  symmetry: boolean
  allowHyphens: boolean
}

// Generation types
export interface WordPlacement {
  word: string
  clue: string
  row: number
  col: number
  direction: 'across' | 'down'
  number: number
}

export interface GenerationOptions {
  listId: string
  gridSize?: { rows?: number; cols?: number }
  seed?: string
  maxAttempts?: number
}

export interface GenerationResult {
  success: boolean
  puzzle?: CrosswordPuzzle
  placedWords: number
  totalWords: number
  conflictingWords?: string[]
  error?: string
}

// Solve state types
export interface SolveState {
  filledCells: Record<string, string> // "row,col" -> letter
  selectedCell?: { row: number; col: number }
  selectedClue?: { direction: 'across' | 'down'; number: number }
  startTime: Date
  endTime?: Date
  checkResults?: Record<string, boolean> // "row,col" -> isCorrect
}

// UI types
export interface ClueListProps {
  clues: ClueEntry[]
  selectedClue?: { direction: 'across' | 'down'; number: number }
  onClueSelect: (clue: ClueEntry) => void
  solveState?: SolveState
}

export interface GridProps {
  grid: CrosswordGrid
  numbering: CrosswordNumbering
  solveState?: SolveState
  onCellClick: (row: number, col: number) => void
  onCellKeyPress: (row: number, col: number, key: string) => void
}