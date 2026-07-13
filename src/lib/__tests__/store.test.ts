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
    lockedCells: {},
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
    expect(updatedState.solveState?.lockedCells?.['0,0']).toBe(true)
    expect(updatedState.solveState?.lockedCells?.['0,1']).toBe(true)
    expect(updatedState.solveState?.lockedCells?.['1,0']).toBe(true)
    expect(updatedState.solveState?.checkResults?.['0,0']).toBe(true)
    expect(updatedState.solveState?.checkResults?.['0,1']).toBe(true)
    expect(updatedState.solveState?.checkResults?.['1,0']).toBe(true)
    expect(setItemSpy).toHaveBeenCalled()
    expect(updatedState.isWon).toBe(true)
  })

  it('toggleClueFlag adds/removes a flag and it survives a save/reload round-trip (#13)', () => {
    const store = primeStoreForPuzzle()

    store.toggleClueFlag('across', 1)
    expect(useAppStore.getState().solveState?.flaggedClues?.['across-1']).toBe(true)

    // Persisted via the normal autosave path: reload from localStorage keeps it.
    const saved = JSON.parse(localStorage.getItem('crosswise_solve_puzzle-1') ?? '{}')
    expect(saved.flaggedClues?.['across-1']).toBe(true)

    store.toggleClueFlag('across', 1)
    expect(useAppStore.getState().solveState?.flaggedClues?.['across-1']).toBeUndefined()
  })

  it('persists solve state snapshots when cells change', () => {
    const store = primeStoreForPuzzle()

    store.updateCell(0, 0, 'c')
    const saved = localStorage.getItem('crosswise_solve_puzzle-1')
    expect(saved).toBeTruthy()
    expect(JSON.parse(saved!).filledCells['0,0']).toBe('C')

    store.clearCell(0, 0)
    const cleared = localStorage.getItem('crosswise_solve_puzzle-1')
    expect(cleared).toBeTruthy()
    expect(JSON.parse(cleared!).filledCells['0,0']).toBeUndefined()
  })

  it('locks completed words and prevents edits or clears', () => {
    const store = primeStoreForPuzzle()
    store.selectClue('across', 1)

    store.updateCell(0, 0, 'c')
    store.updateCell(0, 1, 'a')

    let current = useAppStore.getState()
    expect(current.solveState?.lockedCells?.['0,0']).toBe(true)
    expect(current.solveState?.lockedCells?.['0,1']).toBe(true)

    store.updateCell(0, 0, 'x')
    store.clearCell(0, 0)
    store.clearWord('across', 1)

    current = useAppStore.getState()
    expect(current.solveState?.filledCells['0,0']).toBe('C')
    expect(current.solveState?.filledCells['0,1']).toBe('A')
    expect(current.solveState?.checkResults?.['0,0']).toBe(true)
    expect(current.solveState?.checkResults?.['0,1']).toBe(true)
  })

  it('auto advances to the next clue after completing a word', () => {
    const store = useAppStore.getState()

    const grid: CrosswordGrid = {
      size: { rows: 1, cols: 4 },
      cells: [
        [
          { row: 0, col: 0, type: 'cell', letter: 'C', number: 1 },
          { row: 0, col: 1, type: 'cell', letter: 'A', number: undefined },
          { row: 0, col: 2, type: 'cell', letter: 'T', number: undefined },
          { row: 0, col: 3, type: 'cell', letter: 'S', number: 2 },
        ],
      ],
    }

    const numbering: CrosswordNumbering = {
      across: [
        {
          number: 1,
          answer: 'CAT',
          clue: 'Common pet',
          length: 3,
          row: 0,
          col: 0,
          direction: 'across',
        },
        {
          number: 2,
          answer: 'S',
          clue: 'Plural letter',
          length: 1,
          row: 0,
          col: 3,
          direction: 'across',
        },
      ],
      down: [],
    }

    store.setPuzzle({
      id: 'puzzle-advance',
      listId: 'list-advance',
      seed: 'seed-advance',
      grid,
      numbering,
    })
    store.setSolveState({
      filledCells: {},
      checkResults: {},
      lockedCells: {},
      startTime: new Date(),
    })

    store.selectClue('across', 1)
    store.selectCell(0, 0)

    store.updateCell(0, 0, 'c')
    store.updateCell(0, 1, 'a')
    store.updateCell(0, 2, 't')

    const updated = useAppStore.getState().solveState
    expect(updated?.lockedCells?.['0,0']).toBe(true)
    expect(updated?.lockedCells?.['0,1']).toBe(true)
    expect(updated?.lockedCells?.['0,2']).toBe(true)
    expect(updated?.selectedClue).toEqual({ direction: 'across', number: 2 })
    expect(updated?.selectedCell).toEqual({ row: 0, col: 3 })
  })

  it('cycles auto-advance into the next direction when across clues finish', () => {
    const store = useAppStore.getState()

    const grid: CrosswordGrid = {
      size: { rows: 2, cols: 2 },
      cells: [
        [
          { row: 0, col: 0, type: 'cell', letter: 'A', number: 1 },
          { row: 0, col: 1, type: 'cell', letter: 'B', number: undefined },
        ],
        [
          { row: 1, col: 0, type: 'cell', letter: 'C', number: undefined },
          { row: 1, col: 1, type: 'block' },
        ],
      ],
    }

    const numbering: CrosswordNumbering = {
      across: [
        { number: 1, answer: 'AB', clue: 'Letters A & B', length: 2, row: 0, col: 0, direction: 'across' },
      ],
      down: [
        { number: 1, answer: 'AC', clue: 'A plus another letter', length: 2, row: 0, col: 0, direction: 'down' },
      ],
    }

    store.setPuzzle({ id: 'wrap-puzzle', listId: 'wrap', seed: 'wrap', grid, numbering })
    store.setSolveState({
      filledCells: {},
      checkResults: {},
      lockedCells: {},
      startTime: new Date(),
    })

    store.selectClue('across', 1)
    store.selectCell(0, 0)
    store.updateCell(0, 0, 'a')
    store.updateCell(0, 1, 'b')

    const state = useAppStore.getState().solveState
    expect(state?.selectedClue).toEqual({ direction: 'down', number: 1 })
    expect(state?.selectedCell).toEqual({ row: 1, col: 0 })
  })

  it('clears individual cells and entire words correctly', () => {
    const store = primeStoreForPuzzle()
    store.setSolveState({
      filledCells: { '0,0': 'C', '0,1': 'A', '1,0': 'R' },
      checkResults: {},
      startTime: new Date(),
      lockedCells: {},
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
      lockedCells: {},
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
      lockedCells: {},
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
