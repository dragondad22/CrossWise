import { useRef } from 'react'

import { countSolvedClues } from '@/lib/clue-status'
import { cn } from '@/lib/utils'
import type { CrosswordGrid as CrosswordGridType, CrosswordNumbering, SolveState } from '@/types/crossword'
import ClueList from './ClueList'
import CrosswordGrid from './CrosswordGrid'

interface SolveSurfaceProps {
  grid: CrosswordGridType
  numbering: CrosswordNumbering
  solveState: SolveState
  selectedTab: 'across' | 'down'
  onSelectTab: (tab: 'across' | 'down') => void
  // Regeneration overlay (#14): scoped to the grid area so surrounding context
  // (controls, clues) stays visible while a new puzzle is generated.
  isGenerating?: boolean
  generatingMessage?: string
}

export default function SolveSurface({
  grid,
  numbering,
  solveState,
  selectedTab,
  onSelectTab,
  isGenerating = false,
  generatingMessage = 'Generating a new puzzle…',
}: SolveSurfaceProps) {
  const tabRefs = useRef<Record<'across' | 'down', HTMLButtonElement | null>>({
    across: null,
    down: null,
  })
  const selected = solveState.selectedClue
  const selectedEntry = selected
    ? numbering[selected.direction].find((clue) => clue.number === selected.number)
    : undefined
  const captionText = selectedEntry
    ? `${selectedEntry.number}. ${selectedEntry.clue} (${selectedEntry.length} letters)`
    : 'Select a clue to see its details.'

  return (
    <div className="rounded-3xl border border-border/70 bg-card shadow-card/20">
      <div
        data-testid="solve-surface"
        className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[7fr_5fr] lg:gap-8"
      >
        <div
          data-testid="solve-grid-column"
          className="flex flex-1 items-center justify-center lg:items-start lg:justify-start"
        >
          <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
            <div
              data-testid="solve-caption"
              className="w-full rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-sm font-medium text-foreground shadow-sm sm:px-4 sm:py-3 sm:text-base"
            >
              <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Selected clue
              </span>
              <span className="mt-1 block">{captionText}</span>
            </div>
            <div
              data-testid="solve-grid-wrap"
              aria-busy={isGenerating || undefined}
              className="relative w-full max-w-[420px] aspect-square sm:aspect-auto sm:max-w-[520px] lg:max-w-[720px]"
              // Capture-phase blockers: while generating, no click or key event
              // may reach the grid underneath the overlay (#14).
              onClickCapture={
                isGenerating
                  ? (event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }
                  : undefined
              }
              onKeyDownCapture={
                isGenerating
                  ? (event) => {
                      event.preventDefault()
                      event.stopPropagation()
                    }
                  : undefined
              }
            >
              <CrosswordGrid grid={grid} numbering={numbering} solveState={solveState} />
              {isGenerating && (
                <div
                  data-testid="generation-overlay"
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 backdrop-blur-[2px]"
                >
                  <div
                    className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <p className="px-4 text-center text-sm font-medium text-foreground">
                    {generatingMessage}
                  </p>
                </div>
              )}
            </div>
            {/* Always-mounted polite live region so generation start/finish is
                announced to assistive tech without interrupting (#14). */}
            <div aria-live="polite" className="sr-only">
              {isGenerating ? generatingMessage : ''}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:border-l lg:border-border/60 lg:pl-6">
          <div
            role="tablist"
            aria-label="Clue direction"
            className="flex rounded-full border border-border/70 bg-muted/60 p-1 text-sm font-medium"
            onKeyDown={(event) => {
              // Roving tabs (#13): arrow keys move and activate per the ARIA
              // tabs pattern; the inactive tab is not in the page tab order.
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const next = selectedTab === 'across' ? 'down' : 'across'
              onSelectTab(next)
              tabRefs.current[next]?.focus()
            }}
          >
            {(['across', 'down'] as const).map((direction) => {
              const solved = countSolvedClues(numbering[direction], direction, solveState)
              const total = numbering[direction].length
              const isActive = selectedTab === direction
              return (
                <button
                  key={direction}
                  ref={(node) => {
                    tabRefs.current[direction] = node
                  }}
                  role="tab"
                  id={`clue-tab-${direction}`}
                  aria-selected={isActive}
                  aria-controls={`clue-panel-${direction}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => onSelectTab(direction)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    isActive
                      ? 'bg-card font-semibold text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {direction === 'across' ? 'Across' : 'Down'}
                  <span
                    className="tabular-nums text-xs text-muted-foreground"
                    aria-label={`${solved} of ${total} solved`}
                  >
                    {solved}/{total}
                  </span>
                </button>
              )
            })}
          </div>
          <div
            className="flex-1"
            role="tabpanel"
            id={`clue-panel-${selectedTab}`}
            aria-labelledby={`clue-tab-${selectedTab}`}
          >
            <ClueList
              clues={numbering[selectedTab]}
              direction={selectedTab}
              selectedClue={solveState.selectedClue}
              solveState={solveState}
              variant="embedded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
