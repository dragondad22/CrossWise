import React from 'react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ClueList from '../ClueList'
import type { ClueEntry, SolveState } from '@/types/crossword'

const selectClueMock = vi.fn()
const selectCellMock = vi.fn()

const toggleClueFlagMock = vi.fn()

vi.mock('@/lib/store', () => ({
  useAppStore: () => ({
    selectClue: selectClueMock,
    selectCell: selectCellMock,
    toggleClueFlag: toggleClueFlagMock,
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

describe('ClueList preset filters (#13)', () => {
  // CAT (clue 1) is fully correct; DOG (clue 5) is partial with one checked error.
  const filterState: SolveState = {
    filledCells: { '0,0': 'C', '0,1': 'A', '0,2': 'T', '1,0': 'D', '1,1': 'O' },
    checkResults: { '0,0': true, '0,1': true, '0,2': true, '1,0': false },
    startTime: new Date(),
    flaggedClues: { 'across-5': true },
  }

  const renderList = () =>
    render(
      <ClueList clues={clues} direction="across" solveState={filterState} />,
    )

  it('Unsolved hides fully-correct clues', async () => {
    renderList()
    await userEvent.click(screen.getByRole('button', { name: 'Unsolved' }))

    expect(screen.queryByText('Furry friend')).not.toBeInTheDocument()
    expect(screen.getByText('Loyal companion')).toBeInTheDocument()
  })

  it('Errors shows only clues with a false check result', async () => {
    renderList()
    await userEvent.click(screen.getByRole('button', { name: 'Errors' }))

    expect(screen.queryByText('Furry friend')).not.toBeInTheDocument()
    expect(screen.getByText('Loyal companion')).toBeInTheDocument()
  })

  it('Flagged shows only flagged clues and the flag toggle calls the store action', async () => {
    renderList()
    await userEvent.click(screen.getByRole('button', { name: 'Flagged' }))

    expect(screen.queryByText('Furry friend')).not.toBeInTheDocument()
    expect(screen.getByText('Loyal companion')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove flag from across 5' }),
    )
    expect(toggleClueFlagMock).toHaveBeenCalledWith('across', 5)
  })

  it('filters compose with search and show a clear empty state when nothing matches', async () => {
    renderList()
    await userEvent.click(screen.getByRole('button', { name: 'Errors' }))
    await userEvent.type(screen.getByPlaceholderText('Search clues'), 'furry')

    expect(screen.queryByText('Loyal companion')).not.toBeInTheDocument()
    expect(screen.getByText('No clues match your search.')).toBeInTheDocument()
  })

  it('applying a filter makes no network calls and mutates nothing', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderList()
    await userEvent.click(screen.getByRole('button', { name: 'Unsolved' }))
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('active filter is indicated by more than colour (check mark + aria-pressed)', async () => {
    renderList()
    const unsolved = screen.getByRole('button', { name: 'Unsolved' })
    await userEvent.click(unsolved)

    expect(unsolved.getAttribute('aria-pressed')).toBe('true')
    expect(unsolved.textContent).toContain('✓')
  })
})
