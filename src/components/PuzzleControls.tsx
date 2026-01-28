'use client'

import { useRouter } from 'next/navigation'

import { useAppStore } from '@/lib/store'
import { Button, buttonClasses } from '@/components/ui/button'

interface PuzzleControlsProps {
  onNewPuzzle?: () => void
  onSettings?: () => void
  onExport?: () => void
  isGenerating?: boolean
  autosaveStatus?: { message: string; variant?: 'muted' | 'warning' }
}

export default function PuzzleControls({
  onNewPuzzle,
  onSettings,
  onExport,
  isGenerating,
  autosaveStatus,
}: PuzzleControlsProps) {
  const { currentPuzzle, solveState, selectedTopic, selectedList } = useAppStore()
  const router = useRouter()

  const handleExitToTopics = () => {
    if (selectedTopic) {
      router.push(`/topics/${selectedTopic.id}/lists`)
    } else {
      router.push('/topics')
    }
  }

  const getCompletionStats = () => {
    if (!currentPuzzle || !solveState) return { filled: 0, total: 0, percentage: 0 }

    const totalCells = currentPuzzle.grid.cells.flat().filter((cell) => cell.type === 'cell').length

    const filledCells = Object.keys(solveState.filledCells).length
    const percentage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0

    return { filled: filledCells, total: totalCells, percentage }
  }

  const stats = getCompletionStats()

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-card/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:py-4">
      <div className="container mx-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-3">
            <button
              onClick={handleExitToTopics}
              className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-3 py-1.5' })}
            >
              ← Topics
            </button>
            {selectedTopic && (
              <span className="inline-flex items-center gap-1 text-foreground">
                <span aria-hidden="true">{selectedTopic.icon}</span>
                {selectedTopic.name}
              </span>
            )}
            {selectedList && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-foreground">{selectedList.name}</span>
              </>
            )}
            {currentPuzzle && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="hidden text-xs uppercase tracking-wide sm:inline">
                  Seed {currentPuzzle.seed.slice(0, 8)}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:gap-3">
            <div className="flex items-center gap-2">
              <div>
                {stats.filled}/{stats.total} cells filled ({stats.percentage}%)
              </div>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted sm:w-32">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
            {autosaveStatus && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium leading-none ${
                  autosaveStatus.variant === 'warning'
                    ? 'border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-50'
                    : 'border-border/60 bg-muted/70 text-foreground'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${
                    autosaveStatus.variant === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                {autosaveStatus.message}
              </span>
            )}
            <div className="hidden text-xs text-muted-foreground sm:block">
              Auto-check is on—correct letters lock automatically.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {onNewPuzzle && (
            <Button onClick={onNewPuzzle} size="sm" disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'New puzzle'}
            </Button>
          )}
          {onSettings && (
            <button
              onClick={onSettings}
              className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-3' })}
            >
              Settings
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-3' })}
            >
              <span className="hidden sm:inline">Export state</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
