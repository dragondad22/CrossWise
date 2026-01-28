import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'

import SolveSurface from '../SolveSurface'
import type { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'

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

const grid: CrosswordGrid = {
  size: { rows: 2, cols: 2 },
  cells: [
    [
      { row: 0, col: 0, type: 'cell', letter: 'H', number: 1 },
      { row: 0, col: 1, type: 'cell', letter: 'I' },
    ],
    [
      { row: 1, col: 0, type: 'cell', letter: 'A', number: 2 },
      { row: 1, col: 1, type: 'cell', letter: 'T' },
    ],
  ],
}

const numbering: CrosswordNumbering = {
  across: [
    { number: 1, clue: 'Greeting start', answer: 'HI', length: 2, direction: 'across', row: 0, col: 0 },
    { number: 2, clue: 'Feline favorite', answer: 'AT', length: 2, direction: 'across', row: 1, col: 0 },
  ],
  down: [
    { number: 3, clue: 'Down one', answer: 'HA', length: 2, direction: 'down', row: 0, col: 0 },
  ],
}

const solveState: SolveState = {
  filledCells: {},
  selectedCell: { row: 0, col: 0 },
  selectedClue: { direction: 'across', number: 1 },
  startTime: new Date(),
  checkResults: {},
  lockedCells: {},
}

describe('SolveSurface', () => {
  it('uses a shared grid layout with embedded clue list styling', () => {
    const { getByTestId } = render(
      <SolveSurface
        grid={grid}
        numbering={numbering}
        solveState={solveState}
        selectedTab="across"
        onSelectTab={() => {}}
      />,
    )

    expect(getByTestId('solve-surface')).toHaveClass('grid', 'lg:grid-cols-[7fr_5fr]')
    expect(getByTestId('solve-grid-wrap')).toHaveClass('aspect-square')
    expect(getByTestId('clue-list')).toHaveClass('bg-transparent')
    expect(getByTestId('clue-list')).not.toHaveClass('border')
  })

  it('renders selected clue caption and updates with selection changes', () => {
    const { getByTestId, rerender } = render(
      <SolveSurface
        grid={grid}
        numbering={numbering}
        solveState={{
          ...solveState,
          filledCells: { '0,0': 'H' },
          selectedClue: { direction: 'across', number: 1 },
        }}
        selectedTab="across"
        onSelectTab={() => {}}
      />,
    )

    expect(getByTestId('solve-caption')).toHaveTextContent('1. Greeting start (2 letters)')

    rerender(
      <SolveSurface
        grid={grid}
        numbering={numbering}
        solveState={{
          ...solveState,
          filledCells: { '0,0': 'H', '1,0': 'A' },
          selectedClue: { direction: 'down', number: 3 },
        }}
        selectedTab="down"
        onSelectTab={() => {}}
      />,
    )

    expect(getByTestId('solve-caption')).toHaveTextContent('3. Down one (2 letters)')
  })
})
