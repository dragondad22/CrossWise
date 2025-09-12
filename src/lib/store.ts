import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Topic, ListWithItemsAndTopic } from '@/types/database'
import { SolveState, CrosswordGrid, CrosswordNumbering } from '@/types/crossword'

interface AppState {
  // Topics and Lists
  topics: Topic[]
  lists: ListWithItemsAndTopic[]
  selectedTopic: Topic | null
  selectedList: ListWithItemsAndTopic | null
  
  // Current puzzle
  currentPuzzle: {
    id: string
    grid: CrosswordGrid
    numbering: CrosswordNumbering
    seed: string
  } | null
  
  // Solve state
  solveState: SolveState | null
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setTopics: (topics: Topic[]) => void
  setLists: (lists: ListWithItemsAndTopic[]) => void
  selectTopic: (topic: Topic | null) => void
  selectList: (list: ListWithItemsAndTopic | null) => void
  setPuzzle: (puzzle: AppState['currentPuzzle']) => void
  setSolveState: (state: SolveState | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Solve actions
  updateCell: (row: number, col: number, letter: string) => void
  selectCell: (row: number, col: number) => void
  selectClue: (direction: 'across' | 'down', number: number) => void
  clearCell: (row: number, col: number) => void
  clearWord: (direction: 'across' | 'down', number: number) => void
  checkSolution: (mode: 'letter' | 'word' | 'puzzle') => void
  
  // Persistence actions
  saveSolveState: () => void
  loadSolveState: (puzzleId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      topics: [],
      lists: [],
      selectedTopic: null,
      selectedList: null,
      currentPuzzle: null,
      solveState: null,
      isLoading: false,
      error: null,
      
      // Basic actions
      setTopics: (topics) => set({ topics }),
      setLists: (lists) => set({ lists }),
      selectTopic: (topic) => set({ selectedTopic: topic }),
      selectList: (list) => set({ selectedList: list }),
      setPuzzle: (puzzle) => set({ currentPuzzle: puzzle }),
      setSolveState: (state) => set({ solveState: state }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Solve actions
      updateCell: (row, col, letter) => {
        const state = get()
        if (!state.solveState || !state.currentPuzzle) return
        
        const cellKey = `${row},${col}`
        const updatedState = {
          ...state.solveState,
          filledCells: {
            ...state.solveState.filledCells,
            [cellKey]: letter.toUpperCase()
          }
        }
        
        set({ solveState: updatedState })
        
        // Auto-save to localStorage
        if (typeof window !== 'undefined') {
          const key = `crosswise_solve_${state.currentPuzzle.id}`
          localStorage.setItem(key, JSON.stringify(updatedState))
        }
      },
      
      selectCell: (row, col) => {
        const state = get()
        if (!state.solveState) return
        
        const updatedState = {
          ...state.solveState,
          selectedCell: { row, col }
        }
        
        set({ solveState: updatedState })
      },
      
      selectClue: (direction, number) => {
        const state = get()
        if (!state.solveState) return
        
        const updatedState = {
          ...state.solveState,
          selectedClue: { direction, number }
        }
        
        set({ solveState: updatedState })
      },
      
      clearCell: (row, col) => {
        const state = get()
        if (!state.solveState || !state.currentPuzzle) return
        
        const cellKey = `${row},${col}`
        const { [cellKey]: removed, ...remainingCells } = state.solveState.filledCells
        
        const updatedState = {
          ...state.solveState,
          filledCells: remainingCells
        }
        
        set({ solveState: updatedState })
        
        // Auto-save to localStorage
        if (typeof window !== 'undefined') {
          const key = `crosswise_solve_${state.currentPuzzle.id}`
          localStorage.setItem(key, JSON.stringify(updatedState))
        }
      },
      
      clearWord: (direction, number) => {
        const state = get()
        if (!state.solveState || !state.currentPuzzle) return
        
        const clue = state.currentPuzzle.numbering[direction].find(c => c.number === number)
        if (!clue) return
        
        const updatedCells = { ...state.solveState.filledCells }
        
        for (let i = 0; i < clue.length; i++) {
          const row = direction === 'down' ? clue.row + i : clue.row
          const col = direction === 'across' ? clue.col + i : clue.col
          const cellKey = `${row},${col}`
          delete updatedCells[cellKey]
        }
        
        const updatedState = {
          ...state.solveState,
          filledCells: updatedCells
        }
        
        set({ solveState: updatedState })
      },
      
      checkSolution: (mode) => {
        const state = get()
        if (!state.solveState || !state.currentPuzzle) return
        
        const checkResults: Record<string, boolean> = {}
        
        if (mode === 'letter' && state.solveState.selectedCell) {
          const { row, col } = state.solveState.selectedCell
          const cellKey = `${row},${col}`
          const filledLetter = state.solveState.filledCells[cellKey]
          const correctLetter = state.currentPuzzle.grid.cells[row][col].letter
          
          if (filledLetter && correctLetter) {
            checkResults[cellKey] = filledLetter === correctLetter
          }
        } else if (mode === 'word' && state.solveState.selectedClue) {
          const { direction, number } = state.solveState.selectedClue
          const clue = state.currentPuzzle.numbering[direction].find(c => c.number === number)
          
          if (clue) {
            for (let i = 0; i < clue.length; i++) {
              const row = direction === 'down' ? clue.row + i : clue.row
              const col = direction === 'across' ? clue.col + i : clue.col
              const cellKey = `${row},${col}`
              const filledLetter = state.solveState.filledCells[cellKey]
              const correctLetter = state.currentPuzzle.grid.cells[row][col].letter
              
              if (filledLetter && correctLetter) {
                checkResults[cellKey] = filledLetter === correctLetter
              }
            }
          }
        } else if (mode === 'puzzle') {
          // Check all filled cells
          Object.entries(state.solveState.filledCells).forEach(([cellKey, filledLetter]) => {
            const [rowStr, colStr] = cellKey.split(',')
            const row = parseInt(rowStr)
            const col = parseInt(colStr)
            const correctLetter = state.currentPuzzle!.grid.cells[row][col].letter
            
            if (correctLetter) {
              checkResults[cellKey] = filledLetter === correctLetter
            }
          })
        }
        
        const updatedState = {
          ...state.solveState,
          checkResults
        }
        
        set({ solveState: updatedState })
      },
      
      saveSolveState: () => {
        const state = get()
        if (!state.currentPuzzle || !state.solveState) return
        
        // Save to localStorage
        const key = `crosswise_solve_${state.currentPuzzle.id}`
        localStorage.setItem(key, JSON.stringify(state.solveState))
      },
      
      loadSolveState: (puzzleId) => {
        const key = `crosswise_solve_${puzzleId}`
        const saved = localStorage.getItem(key)
        
        if (saved) {
          try {
            const solveState = JSON.parse(saved)
            set({ solveState })
          } catch (error) {
            console.error('Failed to load solve state:', error)
          }
        } else {
          // Create new solve state
          set({
            solveState: {
              filledCells: {},
              startTime: new Date(),
              checkResults: {}
            }
          })
        }
      }
    }),
    {
      name: 'crosswise-store',
      partialize: (state) => ({
        // Only persist non-sensitive state
        selectedTopic: state.selectedTopic,
        selectedList: state.selectedList,
        currentPuzzle: state.currentPuzzle,
        solveState: state.solveState
      })
    }
  )
)