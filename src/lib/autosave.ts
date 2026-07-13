import { SolveState } from '@/types/crossword'

const AUTOSAVE_KEY_PREFIX = 'crosswise_solve_'
type ServerSaveCallback = (state: SolveState) => Promise<void> | void
type AutosaveEvent =
  | { type: 'local-save'; puzzleId: string; savedAt: string }
  | { type: 'server-save-start'; puzzleId: string }
  | { type: 'server-save-success'; puzzleId: string; savedAt: string }
  | { type: 'server-save-failed'; puzzleId: string; error: Error }

// Server sync debounce (#84): local saves stay per-keystroke, but the server
// POST coalesces — steady typing produces at most one request per window.
const SERVER_SYNC_DEBOUNCE_MS = 2500

export class AutosaveManager {
  private currentPuzzleId: string | null = null
  private getState: (() => SolveState | null) | null = null
  private onServerSave: ServerSaveCallback | null = null
  private isServerSaving = false
  private pendingServerState: SolveState | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private debouncedState: SolveState | null = null
  private handleBeforeUnload = () => this.flushServerSave()
  // Blur / tab-hidden are the last reliable moments to sync before the browser
  // may throttle or kill the page — flush rather than wait out the debounce.
  private handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.flushServerSave()
    }
  }
  private handleWindowBlur = () => this.flushServerSave()
  private listeners = new Set<(event: AutosaveEvent) => void>()

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload)
      window.addEventListener('pagehide', this.handleBeforeUnload)
      window.addEventListener('blur', this.handleWindowBlur)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  public startAutosave(
    puzzleId: string,
    getSolveState: () => SolveState | null,
    options?: { onSave?: ServerSaveCallback },
  ) {
    this.currentPuzzleId = puzzleId
    this.stopAutosave()
    this.getState = getSolveState
    this.onServerSave = options?.onSave ?? null

    // Save immediately
    const state = getSolveState()
    if (state) {
      this.saveToBrowser(puzzleId, state)
      void this.saveToServerIfNeeded(state)
    }
  }

  public stopAutosave() {
    // Flush, don't drop (#84): any state still waiting in the debounce window
    // or queued behind an in-flight save must reach the server before teardown.
    const flushState = this.takePendingState()
    const flushCallback = this.onServerSave
    if (flushState && flushCallback) {
      void Promise.resolve(flushCallback(flushState)).catch((error) => {
        console.error('Failed to flush pending solve state on stop:', error)
      })
    }

    this.getState = null
    this.onServerSave = null
    this.isServerSaving = false
    this.pendingServerState = null
  }

  // Local save is immediate; server sync is debounced/coalesced (#84).
  public forceSave(puzzleId?: string, state?: SolveState) {
    if (puzzleId && state) {
      this.saveToBrowser(puzzleId, state)
      this.scheduleServerSave(state)
    } else if (this.currentPuzzleId) {
      const latestState = this.getState?.()
      if (latestState) {
        this.saveToBrowser(this.currentPuzzleId, latestState)
        this.scheduleServerSave(latestState)
      }
    }
  }

  // Fire any debounced state immediately (unload, blur, tab hidden).
  public flushServerSave() {
    const state = this.takePendingState() ?? this.getState?.()
    if (state) {
      void this.saveToServerIfNeeded(state)
    }
  }

  private scheduleServerSave(state: SolveState) {
    this.debouncedState = state
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null
      const nextState = this.debouncedState
      this.debouncedState = null
      if (nextState) {
        void this.saveToServerIfNeeded(nextState)
      }
    }, SERVER_SYNC_DEBOUNCE_MS)
  }

  // Cancel the debounce and return whatever state was waiting (debounced or
  // queued behind an in-flight request), or null when nothing is pending.
  private takePendingState(): SolveState | null {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
    const state = this.debouncedState ?? this.pendingServerState
    this.debouncedState = null
    return state
  }

  public loadSolveState(puzzleId: string): SolveState | null {
    if (typeof window === 'undefined') return null

    try {
      const key = AUTOSAVE_KEY_PREFIX + puzzleId
      const saved = localStorage.getItem(key)

      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure dates are properly restored
        return {
          ...parsed,
          startTime: new Date(parsed.startTime),
          endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
        }
      }
    } catch (error) {
      console.error('Failed to load solve state:', error)
      this.clearSolveState(puzzleId) // Clear corrupted data
    }

    return null
  }

  public saveToBrowser(puzzleId: string, state: SolveState) {
    if (typeof window === 'undefined') return

    try {
      const key = AUTOSAVE_KEY_PREFIX + puzzleId
      const serialized = JSON.stringify({
        ...state,
        lastSaved: new Date().toISOString(),
      })

      localStorage.setItem(key, serialized)
      this.emit({
        type: 'local-save',
        puzzleId,
        savedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to save solve state:', error)
    }
  }

  public clearSolveState(puzzleId: string) {
    if (typeof window === 'undefined') return

    const key = AUTOSAVE_KEY_PREFIX + puzzleId
    localStorage.removeItem(key)
  }

  public getAllSavedPuzzles(): { puzzleId: string; lastSaved: string }[] {
    if (typeof window === 'undefined') return []

    const savedPuzzles: { puzzleId: string; lastSaved: string }[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(AUTOSAVE_KEY_PREFIX)) {
        try {
          const puzzleId = key.replace(AUTOSAVE_KEY_PREFIX, '')
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          savedPuzzles.push({
            puzzleId,
            lastSaved: data.lastSaved || 'Unknown',
          })
        } catch (error) {
          console.error('Failed to parse saved puzzle data:', error)
        }
      }
    }

    return savedPuzzles.sort(
      (a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime(),
    )
  }

  public cleanupOldSaves(maxAge: number = 30 * 24 * 60 * 60 * 1000) {
    // 30 days default
    if (typeof window === 'undefined') return

    const cutoffTime = Date.now() - maxAge
    const toDelete: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(AUTOSAVE_KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          const lastSaved = new Date(data.lastSaved || 0).getTime()

          if (lastSaved < cutoffTime) {
            toDelete.push(key)
          }
        } catch {
          // Remove corrupted entries
          toDelete.push(key)
        }
      }
    }

    toDelete.forEach((key) => localStorage.removeItem(key))

    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} old save files`)
    }
  }

  public exportSolveState(puzzleId: string): string | null {
    const state = this.loadSolveState(puzzleId)
    if (!state) return null

    return JSON.stringify(state, null, 2)
  }

  public importSolveState(puzzleId: string, stateJson: string): boolean {
    try {
      const state = JSON.parse(stateJson)
      // Basic validation
      if (typeof state.filledCells !== 'object' || !state.startTime) {
        throw new Error('Invalid solve state format')
      }

      this.saveToBrowser(puzzleId, {
        ...state,
        startTime: new Date(state.startTime),
        endTime: state.endTime ? new Date(state.endTime) : undefined,
      })

      return true
    } catch (error) {
      console.error('Failed to import solve state:', error)
      return false
    }
  }

  private async saveToServerIfNeeded(state: SolveState) {
    if (!this.onServerSave) return
    if (this.isServerSaving) {
      this.pendingServerState = state
      return
    }
    this.isServerSaving = true
    if (this.currentPuzzleId) {
      this.emit({ type: 'server-save-start', puzzleId: this.currentPuzzleId })
    }
    try {
      await this.onServerSave(state)
      if (this.currentPuzzleId) {
        this.emit({
          type: 'server-save-success',
          puzzleId: this.currentPuzzleId,
          savedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('Failed to sync solve state to server:', error)
      if (this.currentPuzzleId) {
        this.emit({
          type: 'server-save-failed',
          puzzleId: this.currentPuzzleId,
          error: error instanceof Error ? error : new Error(String(error)),
        })
      }
    } finally {
      this.isServerSaving = false
      if (this.pendingServerState) {
        const nextState = this.pendingServerState
        this.pendingServerState = null
        void this.saveToServerIfNeeded(nextState)
      }
    }
  }

  private emit(event: AutosaveEvent) {
    this.listeners.forEach((listener) => listener(event))
  }

  public subscribe(listener: (event: AutosaveEvent) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

// Singleton instance
export const autosaveManager = new AutosaveManager()

// Hook for React components
export function useAutosave() {
  return {
    startAutosave: autosaveManager.startAutosave.bind(autosaveManager),
    stopAutosave: autosaveManager.stopAutosave.bind(autosaveManager),
    loadSolveState: autosaveManager.loadSolveState.bind(autosaveManager),
    saveToBrowser: autosaveManager.saveToBrowser.bind(autosaveManager),
    clearSolveState: autosaveManager.clearSolveState.bind(autosaveManager),
    getAllSavedPuzzles: autosaveManager.getAllSavedPuzzles.bind(autosaveManager),
    cleanupOldSaves: autosaveManager.cleanupOldSaves.bind(autosaveManager),
    exportSolveState: autosaveManager.exportSolveState.bind(autosaveManager),
    importSolveState: autosaveManager.importSolveState.bind(autosaveManager),
    subscribe: autosaveManager.subscribe.bind(autosaveManager),
  }
}
