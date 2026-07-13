import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'

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
    expect(getByTestId('solve-grid-column')).toHaveClass('lg:items-start', 'lg:justify-start')
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

describe('SolveSurface generation overlay (#14)', () => {
  const renderSurface = (isGenerating: boolean) =>
    render(
      <SolveSurface
        grid={grid}
        numbering={numbering}
        solveState={solveState}
        selectedTab="across"
        onSelectTab={() => {}}
        isGenerating={isGenerating}
        generatingMessage="Generating a new puzzle for Biology…"
      />,
    )

  it('renders the overlay with spinner + message and sets aria-busy while generating', () => {
    const { getByTestId } = renderSurface(true)

    const overlay = getByTestId('generation-overlay')
    expect(overlay.textContent).toContain('Generating a new puzzle for Biology…')
    expect(getByTestId('solve-grid-wrap').getAttribute('aria-busy')).toBe('true')
  })

  it('announces the message via a polite live region', () => {
    const { container } = renderSurface(true)
    const live = container.querySelector('[aria-live="polite"]')
    expect(live?.textContent).toContain('Generating a new puzzle for Biology…')
  })

  it('renders no overlay and no aria-busy when not generating', () => {
    const { queryByTestId, getByTestId, container } = renderSurface(false)

    expect(queryByTestId('generation-overlay')).toBeNull()
    expect(getByTestId('solve-grid-wrap').getAttribute('aria-busy')).toBeNull()
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('')
  })

  it('blocks cell clicks underneath while the overlay is active', () => {
    const { container } = renderSurface(true)

    const cell = container.querySelector('[data-cell="0-0"]') as HTMLElement
    fireEvent.click(cell)
    expect(selectCellMock).not.toHaveBeenCalled()
  })

  it('lets cell clicks through when not generating', () => {
    const { container } = renderSurface(false)

    const cell = container.querySelector('[data-cell="0-0"]') as HTMLElement
    fireEvent.click(cell)
    expect(selectCellMock).toHaveBeenCalledWith(0, 0)
  })
})
