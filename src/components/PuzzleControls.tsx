'use client'

import { useRouter } from 'next/navigation'

import { useAppStore } from '@/lib/store'
import { Button, buttonClasses } from '@/components/ui/button'

interface PuzzleControlsProps {
  onNewPuzzle?: () => void
  onSettings?: () => void
  onExport?: () => void
  isGenerating?: boolean
}

export default function PuzzleControls({
  onNewPuzzle,
  onSettings,
  onExport,
  isGenerating,
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
    <div className="sticky top-0 z-30 border-b border-border/60 bg-card/90 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                <span className="text-xs uppercase tracking-wide">
                  Seed {currentPuzzle.seed.slice(0, 8)}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div>
                {stats.filled}/{stats.total} cells filled ({stats.percentage}%)
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
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
              Export state
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
