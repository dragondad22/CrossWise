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
  const { currentPuzzle, solveState, selectedTopic, selectedList, checkSolution, clearWord } =
    useAppStore()
  const router = useRouter()

  const handleCheck = (mode: 'letter' | 'word' | 'puzzle') => {
    checkSolution(mode)
  }

  const handleClearWord = () => {
    if (solveState?.selectedClue) {
      const { direction, number } = solveState.selectedClue
      clearWord(direction, number)
    }
  }

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
    <div className="border-b border-border/70 bg-card/85 px-4 py-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {stats.filled}/{stats.total} cells filled ({stats.percentage}%)
          </div>
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onNewPuzzle && (
          <Button onClick={onNewPuzzle} size="sm" disabled={isGenerating}>
            {isGenerating ? 'Generating…' : 'New puzzle'}
          </Button>
        )}
        <button
          onClick={() => handleCheck('letter')}
          disabled={!solveState?.selectedCell}
          className={buttonClasses({
            variant: 'outline',
            size: 'sm',
            className: 'disabled:opacity-50',
          })}
        >
          Check letter
        </button>
        <button
          onClick={() => handleCheck('word')}
          disabled={!solveState?.selectedClue}
          className={buttonClasses({
            variant: 'outline',
            size: 'sm',
            className: 'disabled:opacity-50',
          })}
        >
          Check word
        </button>
        <button
          onClick={() => handleCheck('puzzle')}
          disabled={stats.filled === 0}
          className={buttonClasses({
            variant: 'outline',
            size: 'sm',
            className: 'disabled:opacity-50',
          })}
        >
          Check puzzle
        </button>
        <button
          onClick={handleClearWord}
          disabled={!solveState?.selectedClue}
          className={buttonClasses({
            variant: 'outline',
            size: 'sm',
            className: 'text-red-600 hover:bg-red-50 disabled:opacity-50',
          })}
        >
          Clear word
        </button>
        {onSettings && (
          <button onClick={onSettings} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            Settings
          </button>
        )}
        {onExport && (
          <button onClick={onExport} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            Export state
          </button>
        )}
      </div>
    </div>
  )
}
