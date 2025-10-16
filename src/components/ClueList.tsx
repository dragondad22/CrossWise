import { useState } from 'react'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ClueEntry, SolveState } from '@/types/crossword'

interface ClueListProps {
  clues: ClueEntry[]
  direction: 'across' | 'down'
  selectedClue?: { direction: 'across' | 'down'; number: number }
  solveState?: SolveState
}

const statusMap = {
  complete: 'text-emerald-600',
  filled: 'text-primary',
  partial: 'text-amber-500',
  empty: 'text-muted-foreground',
} as const

export default function ClueList({ clues, direction, selectedClue, solveState }: ClueListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { selectClue, selectCell } = useAppStore()

  const handleClueClick = (clue: ClueEntry) => {
    selectClue(direction, clue.number)
    selectCell(clue.row, clue.col)
  }

  const filteredClues = clues.filter((clue) =>
    clue.clue.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getClueStatus = (clue: ClueEntry) => {
    if (!solveState) return 'empty'

    let filledCount = 0
    let correctCount = 0

    for (let i = 0; i < clue.length; i++) {
      const row = direction === 'down' ? clue.row + i : clue.row
      const col = direction === 'across' ? clue.col + i : clue.col
      const cellKey = `${row},${col}`

      if (solveState.filledCells[cellKey]) {
        filledCount++

        if (solveState.checkResults?.[cellKey]) {
          correctCount++
        }
      }
    }

    if (correctCount === clue.length) return 'complete'
    if (filledCount === clue.length) return 'filled'
    if (filledCount > 0) return 'partial'
    return 'empty'
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card/10">
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {direction} clues
          </h3>
          <span className="text-xs text-muted-foreground">{clues.length} total</span>
        </div>
        <input
          type="text"
          placeholder="Search clues"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-3 w-full rounded-full border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {filteredClues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No clues match your search.' : 'No clues available for this direction.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClues.map((clue) => {
              const isSelected =
                selectedClue?.direction === direction && selectedClue?.number === clue.number
              const status = getClueStatus(clue)

              return (
                <button
                  key={`${direction}-${clue.number}`}
                  onClick={() => handleClueClick(clue)}
                  className={cn(
                    'w-full rounded-xl border border-transparent px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    isSelected
                      ? 'border-primary/40 bg-primary/10 shadow-sm'
                      : 'hover:border-border/80 hover:bg-muted/40',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {clue.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{clue.clue}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{clue.length} letters</span>
                        <span className={statusMap[status]}>Status: {status}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
