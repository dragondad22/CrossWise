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
}

export default function SolveSurface({
  grid,
  numbering,
  solveState,
  selectedTab,
  onSelectTab,
}: SolveSurfaceProps) {
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
        <div className="flex flex-1 items-center justify-center">
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
              className="w-full max-w-[420px] aspect-square sm:aspect-auto sm:max-w-[520px] lg:max-w-[720px]"
            >
              <CrosswordGrid grid={grid} numbering={numbering} solveState={solveState} />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:border-l lg:border-border/60 lg:pl-6">
          <div className="flex rounded-full border border-border/70 bg-muted/60 p-1 text-sm font-medium">
            <button
              onClick={() => onSelectTab('across')}
              className={cn(
                'flex-1 rounded-full px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                selectedTab === 'across'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Across
            </button>
            <button
              onClick={() => onSelectTab('down')}
              className={cn(
                'flex-1 rounded-full px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                selectedTab === 'down'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Down
            </button>
          </div>
          <div className="flex-1">
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
