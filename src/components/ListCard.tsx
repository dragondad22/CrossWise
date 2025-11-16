'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

import { useAppStore } from '@/lib/store'
import { useAutosave } from '@/lib/autosave'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button, buttonClasses } from '@/components/ui/button'
import { ListWithItemsAndTopic } from '@/types/database'

interface ListCardProps {
  list: ListWithItemsAndTopic
  onNewGame?: () => void
  onEdit?: () => void
  onExport?: () => void
  onDuplicate?: () => void
  onRefresh?: () => Promise<void> | void
}

export default function ListCard({
  list,
  onNewGame,
  onEdit,
  onExport,
  onDuplicate,
  onRefresh,
}: ListCardProps) {
  const itemCount = list.items.length
  const userSolves = useMemo(() => list.userSolves ?? [], [list.userSolves])
  const [selectedSolveIds, setSelectedSolveIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const setError = useAppStore((state) => state.setError)
  const setLoading = useAppStore((state) => state.setLoading)
  const { clearSolveState } = useAutosave()

  const sortedHistory = [...userSolves].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const toggleSolveSelection = (solveId: string) => {
    setSelectedSolveIds((prev) =>
      prev.includes(solveId) ? prev.filter((id) => id !== solveId) : [...prev, solveId],
    )
  }

  useEffect(() => {
    setSelectedSolveIds((prev) => {
      if (prev.length === 0) {
        return prev
      }

      const availableIds = new Set(userSolves.map((solve) => solve.id))
      const filtered = prev.filter((id) => availableIds.has(id))
      return filtered.length === prev.length ? prev : filtered
    })
  }, [userSolves])

  const clearSelection = () => setSelectedSolveIds([])

  const handleBulkAction = async (action: 'reset' | 'delete') => {
    if (selectedSolveIds.length === 0 || isProcessing) {
      return
    }

    const puzzlesToClear = userSolves
      .filter((solve) => selectedSolveIds.includes(solve.id))
      .map((solve) => solve.puzzleId)

    try {
      setIsProcessing(true)
      setLoading(true)
      setError(null)

      const response = await fetch('/api/solves/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          solveIds: selectedSolveIds,
        }),
      })

      let result: unknown = null
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse bulk solve response:', parseError)
      }

      if (!response.ok || !result || (result as { success?: boolean }).success !== true) {
        const message =
          (result as { error?: { message?: string } })?.error?.message ??
          `Failed to ${action} selected puzzles`
        setError(message)
        return
      }

      if (action === 'reset' || action === 'delete') {
        puzzlesToClear.forEach((puzzleId) => clearSolveState(puzzleId))
      }

      if (onRefresh) {
        await onRefresh()
      }

      setSelectedSolveIds([])
    } catch (error) {
      console.error(`Failed to ${action} puzzles:`, error)
      setError('Network error while updating puzzles')
    } finally {
      setIsProcessing(false)
      setLoading(false)
    }
  }

  const selectedCount = selectedSolveIds.length
  const hasSelection = selectedCount > 0

  return (
    <Card className="flex h-full flex-col border border-border/70 shadow-card/20 transition hover:-translate-y-0.5 hover:shadow-card">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{list.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
              <span>{itemCount} terms</span>
              {list.topic && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <span aria-hidden="true">{list.topic.icon}</span>
                    {list.topic.name}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline">v{list.version}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
            Your puzzles
          </p>
          {hasSelection && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                {selectedCount} selected
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={isProcessing}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleBulkAction('reset')}
                  disabled={isProcessing}
                >
                  Reset selected
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={isProcessing}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Delete selected
                </Button>
              </div>
            </div>
          )}
          {sortedHistory.length > 0 ? (
            <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {sortedHistory.map((solve, index) => {
                const puzzleCreated = new Date(solve.puzzle.createdAt)
                const completedAt = solve.completedAt ? new Date(solve.completedAt) : null
                const isCompleted = Boolean(completedAt)
                const statusText = isCompleted
                  ? `Completed ${format(completedAt as Date, 'MMM d, yyyy')}`
                  : `Last updated ${formatDistanceToNow(new Date(solve.updatedAt), {
                      addSuffix: true,
                    })}`
                const isSelected = selectedSolveIds.includes(solve.id)

                return (
                  <div
                    key={solve.id}
                    className={cn(
                      'flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition',
                      isSelected ? 'border-primary/40 bg-primary/10' : 'hover:bg-primary/10',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSolveSelection(solve.id)}
                      className="h-4 w-4 cursor-pointer rounded border border-border/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      aria-label={`Select puzzle ${index + 1}`}
                    />
                    <Link
                      href={`/solve/${solve.puzzleId}`}
                      className="flex flex-1 items-center gap-3"
                    >
                      <span aria-hidden="true" className="text-lg">
                        {isCompleted ? '✅' : '🕓'}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          Puzzle {index + 1} • {format(puzzleCreated, 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">{statusText}</span>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              You haven&apos;t generated any puzzles for this list yet. Create a new game to get
              started.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70">
        <span className="text-xs text-muted-foreground">
          Updated {new Date(list.updatedAt).toLocaleDateString()}
        </span>
        <div className="flex flex-wrap gap-2">
          {onNewGame && (
            <Button onClick={onNewGame} size="sm">
              New game
            </Button>
          )}
          {onEdit && (
            <button onClick={onEdit} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
              Edit
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              Duplicate
            </button>
          )}
          {onExport && (
            <button onClick={onExport} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
              Export
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
