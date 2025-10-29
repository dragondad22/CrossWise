import React from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ClueList from '../ClueList'
import type { ClueEntry, SolveState } from '@/types/crossword'

const selectClueMock = vi.fn()
const selectCellMock = vi.fn()

vi.mock('@/lib/store', () => ({
  useAppStore: () => ({
    selectClue: selectClueMock,
    selectCell: selectCellMock,
  }),
}))

const clues: ClueEntry[] = [
  { number: 1, answer: 'CAT', clue: 'Furry friend', row: 0, col: 0, length: 3, direction: 'across' },
  { number: 5, answer: 'DOG', clue: 'Loyal companion', row: 1, col: 0, length: 3, direction: 'across' },
]

const solveState: SolveState = {
  filledCells: {
    '0,0': 'C',
    '0,1': 'A',
    '0,2': 'T',
    '1,0': 'D',
    '1,1': 'O',
  },
  checkResults: {
    '0,0': true,
    '0,1': true,
    '0,2': true,
  },
  startTime: new Date(),
}

describe('ClueList', () => {
  beforeEach(() => {
    selectClueMock.mockClear()
    selectCellMock.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders clue items with computed status and supports filtering', async () => {
    render(
      <ClueList
        clues={clues}
        direction="across"
        selectedClue={{ direction: 'across', number: 1 }}
        solveState={solveState}
      />,
    )

    expect(screen.getByText(/across clues/i)).toBeInTheDocument()
    expect(screen.getByText(/Status: complete/i)).toBeInTheDocument()
    expect(screen.getByText(/Status: partial/i)).toBeInTheDocument()

    const input = screen.getByPlaceholderText(/Search clues/i)
    await userEvent.type(input, 'loyal')
    expect(screen.getByText(/Loyal companion/i)).toBeInTheDocument()
    expect(screen.queryByText(/Furry friend/i)).not.toBeInTheDocument()
  })

  it('selects clues and cells when an entry is clicked', async () => {
    render(
      <ClueList
        clues={clues}
        direction="across"
        selectedClue={{ direction: 'across', number: 5 }}
        solveState={solveState}
      />,
    )

    const clueButton = screen.getByRole('button', { name: /Furry friend/i })
    await userEvent.click(clueButton)

    expect(selectClueMock).toHaveBeenCalledWith('across', 1)
    expect(selectCellMock).toHaveBeenCalledWith(0, 0)
  })
})
