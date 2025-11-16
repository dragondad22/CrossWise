import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import { act } from '@testing-library/react'

import { useAppStore } from '@/lib/store'
import type { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'

const grid: CrosswordGrid = {
  size: { rows: 1, cols: 3 },
  cells: [
    [
      { row: 0, col: 0, type: 'cell', letter: 'C', number: 1 },
      { row: 0, col: 1, type: 'cell', letter: 'A' },
      { row: 0, col: 2, type: 'cell', letter: 'T' },
    ],
  ],
}

const numbering: CrosswordNumbering = {
  across: [
    {
      number: 1,
      answer: 'CAT',
      clue: 'Common pet',
      direction: 'across',
      row: 0,
      col: 0,
      length: 3,
    },
  ],
  down: [],
}

const buildSolveState = (): SolveState => ({
  filledCells: {},
  selectedCell: { row: 0, col: 0 },
  selectedClue: { direction: 'across', number: 1 },
  startTime: new Date(),
  lockedCells: {},
  checkResults: {},
})

describe('Solve workflow smoke test', () => {
  beforeEach(() => {
    localStorage.clear()
    act(() => {
      const store = useAppStore.getState()
      store.setPuzzle({ id: 'smoke-puzzle', grid, numbering, seed: 'seed-1', listId: 'list-1' })
      store.setSolveState(buildSolveState())
    })
  })

  afterEach(() => {
    act(() => {
      const store = useAppStore.getState()
      store.setPuzzle(null)
      store.setSolveState(null)
    })
  })

  it('fills a puzzle, locks letters, and persists progress', () => {
    act(() => {
      const store = useAppStore.getState()
      store.updateCell(0, 0, 'c')
      store.updateCell(0, 1, 'a')
      store.updateCell(0, 2, 't')
    })

    expect(useAppStore.getState().solveState?.filledCells).toEqual({
      '0,0': 'C',
      '0,1': 'A',
      '0,2': 'T',
    })
    expect(useAppStore.getState().solveState?.lockedCells).toMatchObject({
      '0,0': true,
      '0,1': true,
      '0,2': true,
    })
    expect(useAppStore.getState().checkWin()).toBe(true)

    useAppStore.getState().saveSolveState()
    const saved = localStorage.getItem('crosswise_solve_smoke-puzzle')
    expect(saved).toBeTruthy()

    // Simulate a reload and ensure loadSolveState hydrates progress
    act(() => {
      useAppStore.setState({ solveState: null })
      useAppStore.getState().loadSolveState('smoke-puzzle')
    })
    expect(useAppStore.getState().solveState?.filledCells['0,2']).toBe('T')

    // Locked letters should not be cleared by clearWord
    act(() => {
      useAppStore.getState().clearWord('across', 1)
    })
    expect(useAppStore.getState().solveState?.filledCells['0,0']).toBe('C')
  })
})
