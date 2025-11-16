import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CrosswordGrid from '../CrosswordGrid'
import type { CrosswordGrid as CrosswordGridType, CrosswordNumbering, SolveState } from '@/types/crossword'

const updateCellMock = vi.fn()
const selectCellMock = vi.fn()
const selectClueMock = vi.fn()
const clearCellMock = vi.fn()

vi.mock('@/lib/store', () => ({
  useAppStore: () => ({
    updateCell: updateCellMock,
    selectCell: selectCellMock,
    selectClue: selectClueMock,
    clearCell: clearCellMock,
  }),
}))

const baseGrid: CrosswordGridType = {
  size: { rows: 2, cols: 2 },
  cells: [
    [
      { row: 0, col: 0, type: 'cell', letter: 'H', number: 1 },
      { row: 0, col: 1, type: 'cell', letter: 'I', number: 2 },
    ],
    [
      { row: 1, col: 0, type: 'cell', letter: 'A', number: 3 },
      { row: 1, col: 1, type: 'cell', letter: 'T', number: 4 },
    ],
  ],
}

const numbering: CrosswordNumbering = {
  across: [
    {
      number: 1,
      clue: 'Greeting start',
      answer: 'HI',
      length: 2,
      direction: 'across',
      row: 0,
      col: 0,
    },
    {
      number: 3,
      clue: 'Casual affirmative',
      answer: 'AT',
      length: 2,
      direction: 'across',
      row: 1,
      col: 0,
    },
  ],
  down: [
    {
      number: 2,
      clue: 'Laugh syllable',
      answer: 'HA',
      length: 2,
      direction: 'down',
      row: 0,
      col: 0,
    },
  ],
}

const downOnlyNumbering: CrosswordNumbering = {
  across: [],
  down: [
    {
      number: 5,
      clue: 'Vertical pronoun',
      answer: 'IT',
      length: 2,
      direction: 'down',
      row: 0,
      col: 1,
    },
  ],
}

const createSolveState = (overrides: Partial<SolveState> = {}): SolveState => ({
  filledCells: {},
  selectedCell: { row: 0, col: 0 },
  selectedClue: { direction: 'across', number: 1 },
  startTime: new Date(),
  checkResults: {},
  lockedCells: {},
  ...overrides,
})

describe('CrosswordGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefers across clues when the cell starts an across entry', async () => {
    render(<CrosswordGrid grid={baseGrid} numbering={numbering} solveState={createSolveState()} />)

    const startingCell = document.querySelector('[data-cell="0-0"]') as HTMLElement
    await userEvent.click(startingCell)

    expect(selectCellMock).toHaveBeenCalledWith(0, 0)
    expect(selectClueMock).toHaveBeenCalledWith('across', 1)
  })

  it('falls back to selecting the down clue when no across clue matches', async () => {
    render(<CrosswordGrid grid={baseGrid} numbering={downOnlyNumbering} solveState={createSolveState()} />)

    const downCell = document.querySelector('[data-cell="0-1"]') as HTMLElement
    await userEvent.click(downCell)

    expect(selectCellMock).toHaveBeenCalledWith(0, 1)
    expect(selectClueMock).toHaveBeenLastCalledWith('down', 5)
  })

  it('updates letters and advances focus when typing', async () => {
    render(<CrosswordGrid grid={baseGrid} numbering={numbering} solveState={createSolveState()} />)

    const startingCell = document.querySelector('[data-cell="0-0"]') as HTMLElement
    await userEvent.click(startingCell)
    await userEvent.keyboard('h')

    expect(updateCellMock).toHaveBeenCalledWith(0, 0, 'H')
    expect(selectCellMock).toHaveBeenLastCalledWith(0, 1)
  })

  it('prevents edits to locked cells', async () => {
    render(
      <CrosswordGrid
        grid={baseGrid}
        numbering={numbering}
        solveState={createSolveState({ lockedCells: { '0,0': true } })}
      />,
    )

    const lockedCell = document.querySelector('[data-cell="0-0"]') as HTMLElement
    await userEvent.click(lockedCell)
    await userEvent.keyboard('Z')
    await userEvent.keyboard('{Backspace}')

    expect(updateCellMock).not.toHaveBeenCalled()
    expect(clearCellMock).not.toHaveBeenCalled()
  })
})
