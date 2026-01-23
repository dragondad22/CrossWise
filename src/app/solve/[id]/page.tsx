'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { autosaveManager } from '@/lib/autosave'
import SolveSurface from '@/components/SolveSurface'
import PuzzleControls from '@/components/PuzzleControls'
import WinModal from '@/components/WinModal'
import { buttonClasses } from '@/components/ui/button'
import type { SolveState } from '@/types/crossword'
import { normalizeSolveState, resolveSolveState } from '../solveState'
import type { RemoteSolveState } from '../solveState'

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
  const [autosaveMeta, setAutosaveMeta] = useState<{
    lastLocalSave: Date | null
    lastServerSave: Date | null
    isSyncing: boolean
    error: string | null
  }>({ lastLocalSave: null, lastServerSave: null, isSyncing: false, error: null })
  const lastLoadedPuzzleRef = useRef<string | null>(null)
  const serverSyncWarningRef = useRef(false)
  const autosavePuzzleRef = useRef<string | null>(null)

  useEffect(() => {
    const nextDirection = solveState?.selectedClue?.direction
    if (!nextDirection) return
    setSelectedTab((prev) => (prev === nextDirection ? prev : nextDirection))
  }, [solveState?.selectedClue?.direction])

  useEffect(() => {
    return () => {
      autosaveManager.stopAutosave()
      lastLoadedPuzzleRef.current = null
      autosavePuzzleRef.current = null
    }
  }, [])

  useEffect(() => {
    setAutosaveMeta({ lastLocalSave: null, lastServerSave: null, isSyncing: false, error: null })
    serverSyncWarningRef.current = false
  }, [currentPuzzle?.id])

  useEffect(() => {
    const puzzleId = currentPuzzle?.id
    if (!puzzleId) return

    const unsubscribe = autosaveManager.subscribe((event) => {
      if (event.puzzleId !== puzzleId) return

      setAutosaveMeta((prev) => {
        switch (event.type) {
          case 'local-save':
            return { ...prev, lastLocalSave: new Date(event.savedAt) }
          case 'server-save-start':
            return { ...prev, isSyncing: true, error: null }
          case 'server-save-success':
            return {
              ...prev,
              isSyncing: false,
              lastServerSave: new Date(event.savedAt),
              error: null,
            }
          case 'server-save-failed':
            return { ...prev, isSyncing: false, error: event.error.message }
          default:
            return prev
        }
      })
    })

    return unsubscribe
  }, [currentPuzzle?.id])

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

            const remoteState = result.data.state
              ? normalizeSolveState(result.data.state as RemoteSolveState)
              : null

            const resolvedState = resolveSolveState(savedState, remoteState)

            if (resolvedState) {
              setSolveState(resolvedState.state)

              if (resolvedState.source === 'remote') {
                autosaveManager.saveToBrowser(id, resolvedState.state)
              }
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

        // Clear in-memory puzzle state before navigating to the new puzzle
        autosaveManager.stopAutosave()
        setPuzzle(null)
        setSolveState(null)
        setWon(false)

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
            throw new Error('Session expired')
          }
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to sync solve state')
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to sync solve state')
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        if (
          error instanceof TypeError &&
          (error.message === 'Failed to fetch' ||
            error.message === 'NetworkError when attempting to fetch resource.' ||
            error.message === 'NetworkError when attempting to fetch resource')
        ) {
          if (!serverSyncWarningRef.current) {
            console.warn(
              'Solve state sync skipped: offline or server unreachable. Progress will resync when the connection returns.',
            )
            serverSyncWarningRef.current = true
          }
          throw error
        }

        throw error instanceof Error ? error : new Error(String(error))
      }
    },
    [puzzleId, user],
  )

  const formatRelativeTime = useCallback((date: Date) => {
    const diff = Date.now() - date.getTime()
    if (diff < 45_000) return 'just now'
    if (diff < 90_000) return '1 min ago'
    if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60_000)} mins ago`
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }, [])

  const autosaveStatus = useMemo(() => {
    if (autosaveMeta.isSyncing) {
      return { message: 'Syncing…', variant: 'muted' as const }
    }
    if (autosaveMeta.error) {
      return { message: 'Saved locally · Sync pending', variant: 'warning' as const }
    }
    if (autosaveMeta.lastServerSave) {
      return {
        message: `Synced ${formatRelativeTime(autosaveMeta.lastServerSave)}`,
        variant: 'muted' as const,
      }
    }
    if (autosaveMeta.lastLocalSave) {
      return { message: 'Saved locally · Sync pending', variant: 'muted' as const }
    }
    return { message: 'Autosave ready', variant: 'muted' as const }
  }, [autosaveMeta, formatRelativeTime])

  useEffect(() => {
    if (!currentPuzzle || !solveState || !user) return
    if (autosavePuzzleRef.current === currentPuzzle.id) return

    autosavePuzzleRef.current = currentPuzzle.id
    autosaveManager.startAutosave(currentPuzzle.id, () => useAppStore.getState().solveState, {
      onSave: saveSolveStateToServer,
    })
    return () => {
      if (autosavePuzzleRef.current === currentPuzzle.id) {
        autosaveManager.stopAutosave()
        autosavePuzzleRef.current = null
      }
    }
  }, [currentPuzzle?.id, solveState, user, saveSolveStateToServer])

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
        autosaveStatus={autosaveStatus}
      />

      <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 pb-10 pt-6">
        <SolveSurface
          grid={currentPuzzle.grid}
          numbering={currentPuzzle.numbering}
          solveState={solveState}
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
        />
      </div>

      <WinModal isOpen={isWon} onNewPuzzle={handleNewPuzzle} onClose={() => setWon(false)} />
    </div>
  )
}
