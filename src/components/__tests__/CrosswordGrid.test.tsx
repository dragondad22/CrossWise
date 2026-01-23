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

const sequentialGrid: CrosswordGridType = {
  size: { rows: 2, cols: 6 },
  cells: [
    [
      { row: 0, col: 0, type: 'cell', letter: 'A', number: 3 },
      { row: 0, col: 1, type: 'cell', letter: 'B' },
      { row: 0, col: 2, type: 'block' },
      { row: 0, col: 3, type: 'cell', letter: 'C', number: 5 },
      { row: 0, col: 4, type: 'cell', letter: 'D' },
      { row: 0, col: 5, type: 'block' },
    ],
    [
      { row: 1, col: 0, type: 'cell', letter: 'E', number: 9 },
      { row: 1, col: 1, type: 'cell', letter: 'F' },
      { row: 1, col: 2, type: 'cell', letter: 'G' },
      { row: 1, col: 3, type: 'cell', letter: 'H' },
      { row: 1, col: 4, type: 'block' },
      { row: 1, col: 5, type: 'cell', letter: 'I' },
    ],
  ],
}

const sequentialNumbering: CrosswordNumbering = {
  across: [
    { number: 3, answer: 'AB', clue: 'First pair', length: 2, row: 0, col: 0, direction: 'across' },
    { number: 5, answer: 'CD', clue: 'Second pair', length: 2, row: 0, col: 3, direction: 'across' },
    { number: 9, answer: 'EFG', clue: 'Third trio', length: 3, row: 1, col: 0, direction: 'across' },
  ],
  down: [
    { number: 1, answer: 'AE', clue: 'Down one', length: 2, row: 0, col: 0, direction: 'down' },
    { number: 2, answer: 'CH', clue: 'Down two', length: 2, row: 0, col: 3, direction: 'down' },
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

  it('disables auto-capitalization on the virtual keyboard input', () => {
    const { container } = render(
      <CrosswordGrid grid={baseGrid} numbering={numbering} solveState={createSolveState()} />,
    )

    const hiddenInput = container.querySelector('input[aria-hidden="true"]') as HTMLInputElement
    expect(hiddenInput).toBeTruthy()
    expect(hiddenInput.getAttribute('autocapitalize')).toBe('none')
  })

  it('keeps clue numbers above filled letters', () => {
    const { getByText } = render(
      <CrosswordGrid
        grid={baseGrid}
        numbering={numbering}
        solveState={createSolveState({ filledCells: { '0,0': 'H' } })}
      />,
    )

    expect(getByText('1')).toHaveClass('z-10')
    expect(getByText('H')).toHaveClass('z-0')
  })

  it('falls back to selecting the down clue when no across clue matches', async () => {
    render(
      <CrosswordGrid grid={sequentialGrid} numbering={sequentialNumbering} solveState={createSolveState()} />,
    )

    const downCell = document.querySelector('[data-cell="1-3"]') as HTMLElement
    await userEvent.click(downCell)

    expect(selectCellMock).toHaveBeenCalledWith(1, 3)
    expect(selectClueMock).toHaveBeenLastCalledWith('down', 2)
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

  it('moves to the previous cell when hitting backspace on a locked entry', async () => {
    const solveState = createSolveState({
      selectedCell: { row: 0, col: 1 },
      selectedClue: { direction: 'across', number: 1 },
      lockedCells: { '0,1': true },
      filledCells: { '0,0': 'H', '0,1': 'I' },
    })

    render(<CrosswordGrid grid={baseGrid} numbering={numbering} solveState={solveState} />)

    const lockedCell = document.querySelector('[data-cell="0-1"]') as HTMLElement
    await userEvent.click(lockedCell)
    vi.clearAllMocks()

    await userEvent.keyboard('{Backspace}')

    expect(clearCellMock).toHaveBeenCalledWith(0, 0)
    expect(selectCellMock).toHaveBeenCalledWith(0, 0)
  })

  it('cycles through clues sequentially with tabbing and wraps after the final entry', async () => {
    const solveState = createSolveState({
      selectedCell: { row: 0, col: 0 },
      selectedClue: { direction: 'across', number: 3 },
    })
    selectClueMock.mockImplementation((direction: 'across' | 'down', number: number) => {
      solveState.selectedClue = { direction, number }
    })

    render(
      <CrosswordGrid
        grid={sequentialGrid}
        numbering={sequentialNumbering}
        solveState={solveState}
      />,
    )

    const firstAcrossCell = document.querySelector('[data-cell="0-0"]') as HTMLElement
    await userEvent.click(firstAcrossCell)
    vi.clearAllMocks()

    await userEvent.keyboard('{Tab}')
    expect(selectClueMock).toHaveBeenCalledWith('across', 5)

    await userEvent.keyboard('{Tab}')
    expect(selectClueMock).toHaveBeenCalledWith('across', 9)

    await userEvent.keyboard('{Tab}')
    expect(selectClueMock).toHaveBeenCalledWith('down', 1)

    await userEvent.keyboard('{Tab}')
    expect(selectClueMock).toHaveBeenCalledWith('down', 2)
  })

  it('cycles backwards in reverse order when using shift+tab', async () => {
    const solveState = createSolveState({
      selectedCell: { row: 0, col: 0 },
      selectedClue: { direction: 'across', number: 3 },
    })
    selectClueMock.mockImplementation((direction: 'across' | 'down', number: number) => {
      solveState.selectedClue = { direction, number }
    })

    render(
      <CrosswordGrid
        grid={sequentialGrid}
        numbering={sequentialNumbering}
        solveState={solveState}
      />,
    )

    const firstAcrossCell = document.querySelector('[data-cell="0-0"]') as HTMLElement
    await userEvent.click(firstAcrossCell)
    vi.clearAllMocks()

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(selectClueMock).toHaveBeenCalledWith('down', 2)

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(selectClueMock).toHaveBeenCalledWith('down', 1)

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(selectClueMock).toHaveBeenCalledWith('across', 9)
  })
})
