import { SolveState } from '@/types/crossword'

const AUTOSAVE_KEY_PREFIX = 'crosswise_solve_'
const AUTOSAVE_INTERVAL = 5000 // 5 seconds

export class AutosaveManager {
  private saveTimer: NodeJS.Timeout | null = null
  private currentPuzzleId: string | null = null
  
  constructor() {
    // Auto-save on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.forceSave.bind(this))
    }
  }
  
  public startAutosave(puzzleId: string, getSolveState: () => SolveState | null) {
    this.currentPuzzleId = puzzleId
    this.stopAutosave()
    
    this.saveTimer = setInterval(() => {
      const state = getSolveState()
      if (state) {
        this.saveToBrowser(puzzleId, state)
      }
    }, AUTOSAVE_INTERVAL)
    
    // Save immediately
    const state = getSolveState()
    if (state) {
      this.saveToBrowser(puzzleId, state)
    }
  }
  
  public stopAutosave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
  }
  
  public forceSave(puzzleId?: string, state?: SolveState) {
    if (puzzleId && state) {
      this.saveToBrowser(puzzleId, state)
    } else if (this.currentPuzzleId) {
      // This would need access to the store, so we'll skip for now
      console.log('Force saving current puzzle state')
    }
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
          endTime: parsed.endTime ? new Date(parsed.endTime) : undefined
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
        lastSaved: new Date().toISOString()
      })
      
      localStorage.setItem(key, serialized)
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
            lastSaved: data.lastSaved || 'Unknown'
          })
        } catch (error) {
          console.error('Failed to parse saved puzzle data:', error)
        }
      }
    }
    
    return savedPuzzles.sort((a, b) => 
      new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
    )
  }
  
  public cleanupOldSaves(maxAge: number = 30 * 24 * 60 * 60 * 1000) { // 30 days default
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
        } catch (error) {
          // Remove corrupted entries
          toDelete.push(key)
        }
      }
    }
    
    toDelete.forEach(key => localStorage.removeItem(key))
    
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
        endTime: state.endTime ? new Date(state.endTime) : undefined
      })
      
      return true
    } catch (error) {
      console.error('Failed to import solve state:', error)
      return false
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
    importSolveState: autosaveManager.importSolveState.bind(autosaveManager)
  }
}