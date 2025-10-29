import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { useAppStore } from '../store'
import type { CrosswordGrid, CrosswordNumbering } from '@/types/crossword'

const initialState = useAppStore.getState()

const buildPuzzle = () => {
  const grid: CrosswordGrid = {
    size: { rows: 2, cols: 2 },
    cells: [
      [
        { row: 0, col: 0, type: 'cell', letter: 'C', number: 1 },
        { row: 0, col: 1, type: 'cell', letter: 'A', number: undefined },
      ],
      [
        { row: 1, col: 0, type: 'cell', letter: 'R', number: undefined },
        { row: 1, col: 1, type: 'block' },
      ],
    ],
  }

  const numbering: CrosswordNumbering = {
    across: [
      {
        number: 1,
        answer: 'CA',
        clue: 'Something a cat says, almost',
        length: 2,
        row: 0,
        col: 0,
        direction: 'across',
      },
    ],
    down: [
      {
        number: 1,
        answer: 'CR',
        clue: 'First and last letters of a big animal',
        length: 2,
        row: 0,
        col: 0,
        direction: 'down',
      },
    ],
  }

  return {
    id: 'puzzle-1',
    listId: 'list-1',
    seed: 'seed',
    grid,
    numbering,
  }
}

const primeStoreForPuzzle = () => {
  const store = useAppStore.getState()
  store.setPuzzle(buildPuzzle())
  store.setSolveState({
    filledCells: {},
    checkResults: {},
    startTime: new Date(),
  })
  return useAppStore.getState()
}

describe('useAppStore crossword interactions', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState(initialState, true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    useAppStore.setState(initialState, true)
  })

  it('sets user state and skips redundant updates when identity matches', () => {
    const store = useAppStore.getState()

    const user = { id: 'u1', email: 'test@example.com', name: 'Test User' }
    store.setUser(user)

    const first = useAppStore.getState()
    expect(first.user).toEqual(user)
    expect(first.sessionHydrated).toBe(true)

    const originalRef = first.user
    store.setUser({ ...user })
    const second = useAppStore.getState()
    expect(second.user).toBe(originalRef)

    store.setUser({ id: 'u2', email: 'other@example.com', name: 'Other User' })
    expect(useAppStore.getState().user?.id).toBe('u2')
  })

  it('updates cells, auto-saves, and marks a completed puzzle as won', () => {
    const store = primeStoreForPuzzle()
    store.selectClue('across', 1)
    store.selectCell(0, 0)
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    store.updateCell(0, 0, 'c')
    store.updateCell(0, 1, 'a')
    store.selectClue('down', 1)
    store.selectCell(0, 0)
    store.updateCell(1, 0, 'r')

    const updatedState = useAppStore.getState()
    expect(updatedState.solveState?.filledCells['0,0']).toBe('C')
    expect(updatedState.solveState?.filledCells['0,1']).toBe('A')
    expect(updatedState.solveState?.filledCells['1,0']).toBe('R')
    expect(setItemSpy).toHaveBeenCalled()
    expect(updatedState.isWon).toBe(true)
  })

  it('clears individual cells and entire words correctly', () => {
    const store = primeStoreForPuzzle()
    store.setSolveState({
      filledCells: { '0,0': 'C', '0,1': 'A', '1,0': 'R' },
      checkResults: {},
      startTime: new Date(),
    })

    store.clearCell(0, 1)
    expect(useAppStore.getState().solveState?.filledCells['0,1']).toBeUndefined()

    store.clearWord('down', 1)
    const afterClear = useAppStore.getState().solveState?.filledCells ?? {}
    expect(afterClear['0,0']).toBeUndefined()
    expect(afterClear['1,0']).toBeUndefined()
  })

  it('checks solutions by cell, word, and puzzle scopes', () => {
    const store = primeStoreForPuzzle()
    store.setSolveState({
      filledCells: { '0,0': 'C', '0,1': 'A', '1,0': 'R' },
      checkResults: {},
      selectedCell: { row: 0, col: 0 },
      selectedClue: { direction: 'across', number: 1 },
      startTime: new Date(),
    })

    store.checkSolution('letter')
    expect(useAppStore.getState().solveState?.checkResults?.['0,0']).toBe(true)

    store.checkSolution('word')
    const wordResults = useAppStore.getState().solveState?.checkResults ?? {}
    expect(wordResults['0,0']).toBe(true)
    expect(wordResults['0,1']).toBe(true)

    store.checkSolution('puzzle')
    const puzzleResults = useAppStore.getState().solveState?.checkResults ?? {}
    expect(puzzleResults['1,0']).toBe(true)
  })

  it('saves and restores solve state, including fallback creation and error handling', () => {
    const store = primeStoreForPuzzle()
    store.setSolveState({
      filledCells: { '0,0': 'C' },
      checkResults: {},
      startTime: new Date('2024-01-01T00:00:00Z'),
    })

    store.saveSolveState()
    const saved = localStorage.getItem('crosswise_solve_puzzle-1')
    expect(saved).toBeTruthy()

    useAppStore.setState(initialState, true)
    useAppStore.getState().loadSolveState('puzzle-1')
    expect(useAppStore.getState().solveState?.filledCells['0,0']).toBe('C')

    useAppStore.setState(initialState, true)
    useAppStore.getState().loadSolveState('missing')
    const fallbackState = useAppStore.getState().solveState
    expect(fallbackState?.filledCells).toEqual({})
    expect(fallbackState?.startTime).toBeInstanceOf(Date)

    const badKey = 'crosswise_solve_puzzle-2'
    localStorage.setItem(badKey, '{invalid')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    useAppStore.getState().loadSolveState('puzzle-2')
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to load solve state:',
      expect.any(SyntaxError),
    )
    errorSpy.mockRestore()
  })

  it('hydrates and sets user state only when user changes', () => {
    const store = useAppStore.getState()
    store.hydrateUser({ id: 'u1', email: 'test@example.com', name: 'Test' })
    expect(useAppStore.getState().user?.id).toBe('u1')
    expect(useAppStore.getState().sessionHydrated).toBe(true)

    store.hydrateUser({ id: 'u1', email: 'test@example.com', name: 'Test' })
    expect(useAppStore.getState().user?.id).toBe('u1')
  })
})
