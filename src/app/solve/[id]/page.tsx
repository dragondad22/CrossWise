'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { autosaveManager } from '@/lib/autosave'
import CrosswordGrid from '@/components/CrosswordGrid'
import ClueList from '@/components/ClueList'
import PuzzleControls from '@/components/PuzzleControls'
import WinModal from '@/components/WinModal'
import { buttonClasses } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SolveState } from '@/types/crossword'

type RemoteSolveState = Partial<
  Omit<SolveState, 'startTime' | 'endTime' | 'filledCells'>
> & {
  filledCells?: Record<string, string>
  startTime?: string | Date
  endTime?: string | Date
}

const normalizeSolveState = (raw: RemoteSolveState | null | undefined): SolveState => ({
  filledCells: raw?.filledCells ?? {},
  selectedCell: raw?.selectedCell,
  selectedClue: raw?.selectedClue,
  startTime: raw?.startTime ? new Date(raw.startTime) : new Date(),
  endTime: raw?.endTime ? new Date(raw.endTime) : undefined,
  checkResults: raw?.checkResults,
  lastSaved: raw?.lastSaved,
})

export default function SolvePage() {
  const router = useRouter()
  const params = useParams()
  const puzzleId = params.id as string

  const {
    currentPuzzle,
    solveState,
    setPuzzle,
    setSolveState,
    loadSolveState,
    setLoading,
    setError,
    isWon,
    setWon,
    user,
    sessionHydrated,
  } = useAppStore()

  const [selectedTab, setSelectedTab] = useState<'across' | 'down'>('across')
  const lastLoadedPuzzleRef = useRef<string | null>(null)
  const serverSyncWarningRef = useRef(false)

  useEffect(() => {
    const nextDirection = solveState?.selectedClue?.direction
    if (!nextDirection) return
    setSelectedTab((prev) => (prev === nextDirection ? prev : nextDirection))
  }, [solveState?.selectedClue?.direction])

  useEffect(() => {
    return () => {
      autosaveManager.stopAutosave()
      lastLoadedPuzzleRef.current = null
    }
  }, [])

  const loadPuzzle = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      setWon(false) // Reset win state when loading new puzzle

      try {
        // First, try to load from localStorage
        const savedState = autosaveManager.loadSolveState(id)

        // Fetch puzzle data from API
        const response = await fetch(`/api/v1/puzzles/${id}/solve`)

        if (response.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/solve/${id}`)}`)
          return
        }

        if (response.ok) {
          const result = await response.json()

          if (result.success) {
            const puzzleData = result.data.puzzle

            setPuzzle({
              id: puzzleData.id,
              grid: puzzleData.grid,
              numbering: puzzleData.numbering,
              seed: puzzleData.seed,
              listId: puzzleData.list.id,
            })

            // Use saved state if available, otherwise use API state, otherwise create new
            if (savedState) {
              setSolveState(savedState)
            } else if (result.data.state) {
              // Use solve state from API
              const hydratedState = normalizeSolveState(result.data.state as RemoteSolveState)
              setSolveState(hydratedState)
              autosaveManager.saveToBrowser(id, hydratedState)
            } else {
              // Create new solve state
              loadSolveState(id)
            }
          } else {
            setError(result.error?.message || 'Failed to load puzzle')
          }
        } else {
          // Puzzle doesn't exist in database, this shouldn't happen
          setError('Puzzle not found')
        }
      } catch (error) {
        setError('Network error')
        console.error('Failed to load puzzle:', error)
      } finally {
        setLoading(false)
      }
    },
    [loadSolveState, router, setError, setLoading, setPuzzle, setSolveState, setWon],
  )

  useEffect(() => {
    if (!puzzleId || !sessionHydrated) return

    if (!user) {
      autosaveManager.stopAutosave()
      router.replace(`/login?next=${encodeURIComponent(`/solve/${puzzleId}`)}`)
      return
    }

    if (lastLoadedPuzzleRef.current === puzzleId) return

    lastLoadedPuzzleRef.current = puzzleId
    void loadPuzzle(puzzleId)

    return () => {
      if (lastLoadedPuzzleRef.current === puzzleId) {
        autosaveManager.stopAutosave()
        lastLoadedPuzzleRef.current = null
      }
    }
  }, [puzzleId, sessionHydrated, user, router, loadPuzzle])

  const handleNewPuzzle = async () => {
    if (!currentPuzzle) return

    try {
      setLoading(true)

      // Get the list ID from current puzzle (we'd need to fetch this from the API)
      // For now, we'll generate a new puzzle with the same list
      const response = await fetch('/api/v1/puzzles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listId: currentPuzzle.listId,
          seed: `${Date.now()}_new`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Clear old autosave
        autosaveManager.clearSolveState(currentPuzzle.id)

        // Load new puzzle
        router.push(`/solve/${result.data.puzzleId}`)
      } else {
        setError(result.error?.message || 'Failed to generate new puzzle')
      }
    } catch (error) {
      setError('Network error')
      console.error('Failed to generate new puzzle:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSolveStateToServer = useCallback(
    async (state: SolveState) => {
      if (!puzzleId || !user) return

      try {
        const isCompleted = useAppStore.getState().checkWin()
        const response = await fetch(`/api/v1/puzzles/${puzzleId}/solve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            puzzleId,
            state: JSON.stringify({
              ...state,
              startTime:
                state.startTime instanceof Date ? state.startTime.toISOString() : state.startTime,
              endTime: state.endTime instanceof Date ? state.endTime.toISOString() : state.endTime,
              lastSaved: new Date().toISOString(),
            }),
            completed: isCompleted,
          }),
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Session expired, stop trying to sync until user logs in again
            if (!serverSyncWarningRef.current) {
              console.warn(
                'Solve state sync skipped: session expired. Please sign in again to continue syncing progress.',
              )
              serverSyncWarningRef.current = true
            }
            return
          }
          const errorText = await response.text()
          console.error('Failed to sync solve state:', errorText)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          if (!serverSyncWarningRef.current) {
            console.warn(
              'Solve state sync skipped: offline or server unreachable. Progress will resync when the connection returns.',
            )
            serverSyncWarningRef.current = true
          }
          return
        }

        console.error('Failed to sync solve state:', error)
      }
    },
    [puzzleId, user],
  )

  useEffect(() => {
    if (!currentPuzzle || !solveState || !user) return

    autosaveManager.startAutosave(currentPuzzle.id, () => useAppStore.getState().solveState, {
      onSave: saveSolveStateToServer,
    })
  }, [currentPuzzle, solveState, user, saveSolveStateToServer])

  if (!sessionHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    )
  }

  if (sessionHydrated && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  const handleExport = () => {
    if (!currentPuzzle || !solveState) return

    const exported = autosaveManager.exportSolveState(currentPuzzle.id)
    if (exported) {
      const blob = new Blob([exported], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `crossword_solve_${currentPuzzle.id.slice(0, 8)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  if (useAppStore.getState().isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading puzzle…</p>
        </div>
      </div>
    )
  }

  if (!currentPuzzle || !solveState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Puzzle not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The puzzle you&apos;re looking for doesn&apos;t exist or failed to load.
          </p>
          <button
            onClick={() => router.push('/topics')}
            className={buttonClasses({ className: 'mt-4 px-6 py-3 text-base' })}
          >
            Back to topics
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PuzzleControls
        onNewPuzzle={handleNewPuzzle}
        onExport={handleExport}
        isGenerating={useAppStore.getState().isLoading}
      />

      <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 pb-10 pt-6 lg:flex-row">
        {/* Main puzzle area */}
        <div className="flex-1 rounded-3xl border border-border/70 bg-card shadow-card/20">
          <div className="flex h-full flex-col">
            <div className="flex-1 p-4 sm:p-6">
              <CrosswordGrid
                grid={currentPuzzle.grid}
                numbering={currentPuzzle.numbering}
                solveState={solveState}
              />
            </div>
          </div>
        </div>

        {/* Clues sidebar */}
        <div className="flex w-full max-w-md flex-col gap-4 lg:max-w-sm">
          <div className="flex rounded-full border border-border/70 bg-muted/60 p-1 text-sm font-medium">
            <button
              onClick={() => setSelectedTab('across')}
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
              onClick={() => setSelectedTab('down')}
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
              clues={currentPuzzle.numbering[selectedTab]}
              direction={selectedTab}
              selectedClue={solveState.selectedClue}
              solveState={solveState}
            />
          </div>
        </div>
      </div>

      <WinModal isOpen={isWon} onNewPuzzle={handleNewPuzzle} onClose={() => setWon(false)} />
    </div>
  )
}
