import type { ClueEntry, SolveState } from '@/types/crossword'

export type ClueStatus = 'complete' | 'filled' | 'partial' | 'empty'

// Single source of truth for a clue's solve status (#13): tab counts and clue
// filters must agree with the per-clue status badges, so they all derive from
// this helper rather than reimplementing the walk.
export function getClueStatus(
  clue: ClueEntry,
  direction: 'across' | 'down',
  solveState?: SolveState | null,
): ClueStatus {
  if (!solveState) return 'empty'

  let filledCount = 0
  let correctCount = 0

  for (let i = 0; i < clue.length; i++) {
    const row = direction === 'down' ? clue.row + i : clue.row
    const col = direction === 'across' ? clue.col + i : clue.col
    const cellKey = `${row},${col}`

    if (solveState.filledCells[cellKey]) {
      filledCount++

      if (solveState.checkResults?.[cellKey]) {
        correctCount++
      }
    }
  }

  if (correctCount === clue.length) return 'complete'
  if (filledCount === clue.length) return 'filled'
  if (filledCount > 0) return 'partial'
  return 'empty'
}

// True when at least one of the clue's cells has been checked and is wrong.
export function clueHasError(
  clue: ClueEntry,
  direction: 'across' | 'down',
  solveState?: SolveState | null,
): boolean {
  if (!solveState?.checkResults) return false

  for (let i = 0; i < clue.length; i++) {
    const row = direction === 'down' ? clue.row + i : clue.row
    const col = direction === 'across' ? clue.col + i : clue.col
    if (solveState.checkResults[`${row},${col}`] === false) {
      return true
    }
  }
  return false
}

export function countSolvedClues(
  clues: ClueEntry[],
  direction: 'across' | 'down',
  solveState?: SolveState | null,
): number {
  return clues.filter((clue) => getClueStatus(clue, direction, solveState) === 'complete').length
}

// Key for a clue in SolveState.flaggedClues.
export function clueFlagKey(direction: 'across' | 'down', number: number): string {
  return `${direction}-${number}`
}
