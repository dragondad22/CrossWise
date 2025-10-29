import React from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PuzzleControls from '../PuzzleControls'
import type { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'

const pushMock = vi.fn()
const checkSolutionMock = vi.fn()
const clearWordMock = vi.fn()

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
      clue: 'Sound a cat might make',
      length: 2,
      row: 0,
      col: 0,
      direction: 'across',
    },
  ],
  down: [],
}

const solveState: SolveState = {
  filledCells: { '0,0': 'C', '0,1': 'A' },
  selectedCell: { row: 0, col: 0 },
  selectedClue: { direction: 'across', number: 1 },
  startTime: new Date(),
  checkResults: {},
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('@/lib/store', () => ({
  useAppStore: () => ({
    currentPuzzle: { id: 'puzzle-1', listId: 'list-1', seed: 'seed-123456', grid, numbering },
    solveState,
    selectedTopic: { id: 'topic-1', name: 'Animals', icon: '🐾' },
    selectedList: { id: 'list-1', name: 'Wildlife', topic: { id: 'topic-1', name: 'Animals' } },
    checkSolution: checkSolutionMock,
    clearWord: clearWordMock,
  }),
}))

describe('PuzzleControls', () => {
  beforeEach(() => {
    pushMock.mockClear()
    checkSolutionMock.mockClear()
    clearWordMock.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('displays puzzle metadata and completion stats', () => {
    render(<PuzzleControls />)

    expect(screen.getByText(/Animals/)).toBeInTheDocument()
    expect(screen.getByText(/Wildlife/)).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('Seed seed-123')),
    ).toBeInTheDocument()
    expect(screen.getByText('2/3 cells filled (67%)')).toBeInTheDocument()
  })

  it('calls store actions and navigates when buttons are used', async () => {
    const onNewPuzzle = vi.fn()
    const onSettings = vi.fn()
    const onExport = vi.fn()

    render(
      <PuzzleControls onNewPuzzle={onNewPuzzle} onSettings={onSettings} onExport={onExport} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /New puzzle/i }))
    expect(onNewPuzzle).toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /Check word/i }))
    expect(checkSolutionMock).toHaveBeenCalledWith('word')

    await userEvent.click(screen.getByRole('button', { name: /Clear word/i }))
    expect(clearWordMock).toHaveBeenCalledWith('across', 1)

    await userEvent.click(screen.getByRole('button', { name: /Export state/i }))
    expect(onExport).toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /Settings/i }))
    expect(onSettings).toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /← Topics/i }))
    expect(pushMock).toHaveBeenCalledWith('/topics/topic-1/lists')
  })
})
