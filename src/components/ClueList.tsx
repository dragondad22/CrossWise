import { useState } from 'react'

import { clueFlagKey, clueHasError, getClueStatus } from '@/lib/clue-status'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ClueEntry, SolveState } from '@/types/crossword'

interface ClueListProps {
  clues: ClueEntry[]
  direction: 'across' | 'down'
  selectedClue?: { direction: 'across' | 'down'; number: number }
  solveState?: SolveState
  variant?: 'card' | 'embedded'
}

const statusMap = {
  complete: 'text-emerald-600',
  filled: 'text-primary',
  partial: 'text-amber-500',
  empty: 'text-muted-foreground',
} as const

type ClueFilter = 'all' | 'unsolved' | 'flagged' | 'errors'

const FILTERS: Array<{ id: ClueFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'unsolved', label: 'Unsolved' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'errors', label: 'Errors' },
]

export default function ClueList({
  clues,
  direction,
  selectedClue,
  solveState,
  variant = 'card',
}: ClueListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ClueFilter>('all')
  const { selectClue, selectCell, toggleClueFlag } = useAppStore()

  const handleClueClick = (clue: ClueEntry) => {
    selectClue(direction, clue.number)
    selectCell(clue.row, clue.col)
  }

  const matchesFilter = (clue: ClueEntry): boolean => {
    switch (activeFilter) {
      case 'unsolved':
        // Everything not fully correct: empty, partial, and unchecked-filled.
        return getClueStatus(clue, direction, solveState) !== 'complete'
      case 'flagged':
        return Boolean(solveState?.flaggedClues?.[clueFlagKey(direction, clue.number)])
      case 'errors':
        return clueHasError(clue, direction, solveState)
      default:
        return true
    }
  }

  // Filters compose with the search input (#13).
  const filteredClues = clues.filter(
    (clue) => clue.clue.toLowerCase().includes(searchQuery.toLowerCase()) && matchesFilter(clue),
  )

  const emptyMessage = searchQuery
    ? 'No clues match your search.'
    : activeFilter === 'flagged'
      ? 'No flagged clues yet — use the flag on a clue to mark it for later.'
      : activeFilter === 'errors'
        ? 'No checked errors — nice work.'
        : activeFilter === 'unsolved'
          ? 'Everything here is solved!'
          : 'No clues available for this direction.'

  return (
    <div
      data-testid="clue-list"
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-3xl',
        variant === 'card' ? 'border border-border/70 bg-card shadow-card/10' : 'bg-transparent',
      )}
    >
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {direction} clues
          </h3>
          <span className="text-xs tabular-nums text-muted-foreground">{clues.length} total</span>
        </div>
        <input
          type="text"
          placeholder="Search clues"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-3 w-full rounded-full border border-input bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter clues"
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                  // Active state indicated by more than colour: check mark,
                  // weight, and border treatment (UI standard 4.4).
                  isActive
                    ? 'border-primary bg-primary/10 font-semibold text-primary'
                    : 'border-border/70 text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {isActive ? '✓ ' : ''}
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {filteredClues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClues.map((clue) => {
              const isSelected =
                selectedClue?.direction === direction && selectedClue?.number === clue.number
              const status = getClueStatus(clue, direction, solveState)
              const isFlagged = Boolean(
                solveState?.flaggedClues?.[clueFlagKey(direction, clue.number)],
              )

              return (
                <div
                  key={`${direction}-${clue.number}`}
                  className={cn(
                    'flex w-full items-start gap-1 rounded-xl border border-transparent transition-all duration-150',
                    isSelected
                      ? 'border-primary/40 bg-primary/10 shadow-sm'
                      : 'hover:border-border/80 hover:bg-muted/40',
                  )}
                >
                  <button
                    onClick={() => handleClueClick(clue)}
                    className="min-w-0 flex-1 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tabular-nums text-foreground">
                        {clue.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{clue.clue}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="tabular-nums">{clue.length} letters</span>
                          <span className={statusMap[status]}>Status: {status}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-pressed={isFlagged}
                    aria-label={
                      isFlagged
                        ? `Remove flag from ${direction} ${clue.number}`
                        : `Flag ${direction} ${clue.number} for later`
                    }
                    onClick={() => toggleClueFlag(direction, clue.number)}
                    className={cn(
                      'mr-2 mt-3 shrink-0 rounded-full p-1.5 text-sm leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                      isFlagged
                        ? 'text-amber-500 hover:text-amber-600'
                        : 'text-muted-foreground/40 hover:text-muted-foreground',
                    )}
                  >
                    ⚑
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
