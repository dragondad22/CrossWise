import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Topic, ListWithItemsAndTopic } from '@/types/database'
import type { AuthUser } from '@/types/auth'
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
    listId: string
  } | null

  // Solve state
  solveState: SolveState | null

  // UI state
  isLoading: boolean
  error: string | null
  isWon: boolean
  user: AuthUser | null
  sessionHydrated: boolean

  // Actions
  setTopics: (topics: Topic[]) => void
  setLists: (lists: ListWithItemsAndTopic[]) => void
  selectTopic: (topic: Topic | null) => void
  selectList: (list: ListWithItemsAndTopic | null) => void
  setPuzzle: (puzzle: AppState['currentPuzzle']) => void
  setSolveState: (state: SolveState | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setWon: (won: boolean) => void
  hydrateUser: (user: AuthUser | null) => void
  setUser: (user: AuthUser | null) => void

  // Solve actions
  updateCell: (row: number, col: number, letter: string) => void
  selectCell: (row: number, col: number) => void
  selectClue: (direction: 'across' | 'down', number: number) => void
  clearCell: (row: number, col: number) => void
  clearWord: (direction: 'across' | 'down', number: number) => void
  checkSolution: (mode: 'letter' | 'word' | 'puzzle') => void
  checkWin: () => boolean

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
      isWon: false,
      user: null,
      sessionHydrated: false,

      // Basic actions
      setTopics: (topics) => set({ topics }),
      setLists: (lists) => set({ lists }),
      selectTopic: (topic) => set({ selectedTopic: topic }),
      selectList: (list) => set({ selectedList: list }),
      setPuzzle: (puzzle) => set({ currentPuzzle: puzzle }),
      setSolveState: (state) =>
        set({
          solveState: state
            ? {
                ...state,
                lockedCells: state.lockedCells ?? {},
              }
            : state,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setWon: (won) => set({ isWon: won }),
      hydrateUser: (user) =>
        set((state) => {
          const current = state.user
          const isSameUser =
            (current?.id ?? null) === (user?.id ?? null) &&
            (current?.email ?? null) === (user?.email ?? null) &&
            (current?.name ?? null) === (user?.name ?? null) &&
            state.sessionHydrated

          if (isSameUser) {
            return {}
          }

          return { user, sessionHydrated: true }
        }),
      setUser: (user) =>
        set((state) => {
          const current = state.user
          const isSameUser =
            (current?.id ?? null) === (user?.id ?? null) &&
            (current?.email ?? null) === (user?.email ?? null) &&
            (current?.name ?? null) === (user?.name ?? null)

          if (isSameUser && state.sessionHydrated) {
            return {}
          }

          return { user, sessionHydrated: true }
        }),

      // Solve actions
      updateCell: (row, col, letter) => {
        const state = get()
        const currentPuzzle = state.currentPuzzle
        const solveState = state.solveState
        if (!solveState || !currentPuzzle) return

        const cellKey = `${row},${col}`
        const existingLocked = solveState.lockedCells ?? {}
        if (existingLocked[cellKey]) return

        const filledCells = {
          ...solveState.filledCells,
          [cellKey]: letter.toUpperCase(),
        }

        const lockedCells = { ...existingLocked }
        const checkResults = { ...(solveState.checkResults ?? {}) }
        let selectedClue = solveState.selectedClue
        let selectedCell = solveState.selectedCell
        let completedClueForAdvance: { direction: 'across' | 'down'; number: number } | null = null

        delete checkResults[cellKey]

        const evaluateClue = (clue: {
          row: number
          col: number
          length: number
          direction: 'across' | 'down'
          number: number
        }) => {
          if (!clue) return

          const positions: Array<{
            row: number
            col: number
            key: string
            correctLetter: string | undefined
          }> = []

          for (let i = 0; i < clue.length; i++) {
            const clueRow = clue.direction === 'down' ? clue.row + i : clue.row
            const clueCol = clue.direction === 'across' ? clue.col + i : clue.col
            const key = `${clueRow},${clueCol}`
            const correctLetter = currentPuzzle.grid.cells[clueRow][clueCol].letter
            positions.push({ row: clueRow, col: clueCol, key, correctLetter })

            if (!lockedCells[key] && key !== cellKey && checkResults[key] !== undefined) {
              delete checkResults[key]
            }
          }

          const isComplete = positions.every(({ key }) => Boolean(filledCells[key]))
          if (!isComplete) {
            return
          }

          const isCorrect = positions.every(
            ({ key, correctLetter }) => correctLetter && filledCells[key] === correctLetter,
          )

          if (isCorrect) {
            for (const { key } of positions) {
              lockedCells[key] = true
              checkResults[key] = true
            }

            if (
              solveState.selectedClue?.direction === clue.direction &&
              solveState.selectedClue.number === clue.number
            ) {
              completedClueForAdvance = { direction: clue.direction, number: clue.number }
            }
          } else {
            for (const { key } of positions) {
              if (!lockedCells[key]) {
                delete checkResults[key]
              }
            }
          }
        }

        const acrossClue = currentPuzzle.numbering.across.find(
          (clue) => clue.row === row && col >= clue.col && col < clue.col + clue.length,
        )
        const downClue = currentPuzzle.numbering.down.find(
          (clue) => clue.col === col && row >= clue.row && row < clue.row + clue.length,
        )

        if (acrossClue) {
          evaluateClue(acrossClue)
        }
        if (downClue) {
          evaluateClue(downClue)
        }

        const findNextClueSelection = (
          direction: 'across' | 'down',
          currentNumber: number,
        ): { clueNumber: number; direction: 'across' | 'down'; row: number; col: number } | null => {
          const combinedClues = [
            ...currentPuzzle.numbering.across.map((clue) => ({ direction: 'across' as const, clue })),
            ...currentPuzzle.numbering.down.map((clue) => ({ direction: 'down' as const, clue })),
          ]

          if (!combinedClues.length) return null

          const currentIndex = combinedClues.findIndex(
            (entry) => entry.direction === direction && entry.clue.number === currentNumber,
          )
          if (currentIndex === -1) return null

          for (let offset = 1; offset <= combinedClues.length; offset++) {
            const candidateIndex = (currentIndex + offset) % combinedClues.length
            if (candidateIndex === currentIndex) continue

            const entry = combinedClues[candidateIndex]
            let fallback: { row: number; col: number } | null = null

            for (let j = 0; j < entry.clue.length; j++) {
              const candidateRow = entry.clue.direction === 'down' ? entry.clue.row + j : entry.clue.row
              const candidateCol = entry.clue.direction === 'across' ? entry.clue.col + j : entry.clue.col
              const candidateKey = `${candidateRow},${candidateCol}`

              if (lockedCells[candidateKey]) {
                continue
              }

              if (!filledCells[candidateKey]) {
                return {
                  direction: entry.direction,
                  clueNumber: entry.clue.number,
                  row: candidateRow,
                  col: candidateCol,
                }
              }

              if (!fallback) {
                fallback = { row: candidateRow, col: candidateCol }
              }
            }

            if (fallback) {
              return {
                direction: entry.direction,
                clueNumber: entry.clue.number,
                row: fallback.row,
                col: fallback.col,
              }
            }
          }

          return null
        }

        if (completedClueForAdvance) {
          const { direction, number } = completedClueForAdvance
          const selection = findNextClueSelection(direction, number)
          if (selection) {
            selectedClue = { direction: selection.direction, number: selection.clueNumber }
            selectedCell = { row: selection.row, col: selection.col }
          }
        }

        const updatedState = {
          ...solveState,
          filledCells,
          lockedCells,
          checkResults,
          selectedClue,
          selectedCell,
        }

        set({ solveState: updatedState })

        // Check for win condition
        const isWin = get().checkWin()
        if (isWin && !state.isWon) {
          set({ isWon: true })
        }

        // Auto-save to localStorage
        if (typeof window !== 'undefined') {
          const key = `crosswise_solve_${currentPuzzle.id}`
          localStorage.setItem(key, JSON.stringify(updatedState))
        }
      },

      selectCell: (row, col) => {
        const state = get()
        if (!state.solveState) return

        const updatedState = {
          ...state.solveState,
          selectedCell: { row, col },
        }

        set({ solveState: updatedState })
      },

      selectClue: (direction, number) => {
        const state = get()
        if (!state.solveState) return

        const updatedState = {
          ...state.solveState,
          selectedClue: { direction, number },
        }

        set({ solveState: updatedState })
      },

      clearCell: (row, col) => {
        const state = get()
        if (!state.solveState || !state.currentPuzzle) return

        const cellKey = `${row},${col}`
        if (state.solveState.lockedCells?.[cellKey]) return

        const remainingCells = { ...state.solveState.filledCells }
        delete remainingCells[cellKey]

        const checkResults = { ...(state.solveState.checkResults ?? {}) }
        if (checkResults[cellKey] !== undefined) {
          delete checkResults[cellKey]
        }

        const updatedState = {
          ...state.solveState,
          filledCells: remainingCells,
          checkResults,
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

        const clue = state.currentPuzzle.numbering[direction].find((c) => c.number === number)
        if (!clue) return

        const updatedCells = { ...state.solveState.filledCells }
        const checkResults = { ...(state.solveState.checkResults ?? {}) }

        for (let i = 0; i < clue.length; i++) {
          const row = direction === 'down' ? clue.row + i : clue.row
          const col = direction === 'across' ? clue.col + i : clue.col
          const cellKey = `${row},${col}`
          if (state.solveState.lockedCells?.[cellKey]) continue
          delete updatedCells[cellKey]
          if (checkResults[cellKey] !== undefined) {
            delete checkResults[cellKey]
          }
        }

        const updatedState = {
          ...state.solveState,
          filledCells: updatedCells,
          checkResults,
        }

        set({ solveState: updatedState })
      },

      checkSolution: (mode) => {
        const state = get()
        if (!state.solveState || !state.currentPuzzle) return

        const checkResults: Record<string, boolean> = {
          ...(state.solveState.checkResults ?? {}),
        }

        if (mode === 'letter' && state.solveState.selectedCell) {
          const { row, col } = state.solveState.selectedCell
          const cellKey = `${row},${col}`
          const filledLetter = state.solveState.filledCells[cellKey]
          const correctLetter = state.currentPuzzle.grid.cells[row][col].letter

          if (filledLetter && correctLetter) {
            checkResults[cellKey] = filledLetter === correctLetter
          } else {
            delete checkResults[cellKey]
          }
        } else if (mode === 'word' && state.solveState.selectedClue) {
          const { direction, number } = state.solveState.selectedClue
          const clue = state.currentPuzzle.numbering[direction].find((c) => c.number === number)

          if (clue) {
            for (let i = 0; i < clue.length; i++) {
              const row = direction === 'down' ? clue.row + i : clue.row
              const col = direction === 'across' ? clue.col + i : clue.col
              const cellKey = `${row},${col}`
              const filledLetter = state.solveState.filledCells[cellKey]
              const correctLetter = state.currentPuzzle.grid.cells[row][col].letter

              if (filledLetter && correctLetter) {
                checkResults[cellKey] = filledLetter === correctLetter
              } else {
                delete checkResults[cellKey]
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
            } else {
              delete checkResults[cellKey]
            }
          })
        }

        const updatedState = {
          ...state.solveState,
          checkResults,
        }

        set({ solveState: updatedState })
      },

      checkWin: () => {
        const state = get()
        if (!state.currentPuzzle || !state.solveState) return false

        // Get all cells that should have letters (non-blocked cells)
        const requiredCells: Array<{ row: number; col: number; letter: string }> = []

        for (let row = 0; row < state.currentPuzzle.grid.size.rows; row++) {
          for (let col = 0; col < state.currentPuzzle.grid.size.cols; col++) {
            const cell = state.currentPuzzle.grid.cells[row][col]
            if (cell.type === 'cell' && cell.letter) {
              requiredCells.push({ row, col, letter: cell.letter })
            }
          }
        }

        // Check if all required cells are filled with correct letters
        for (const { row, col, letter } of requiredCells) {
          const cellKey = `${row},${col}`
          const filledLetter = state.solveState.filledCells[cellKey]
          if (!filledLetter || filledLetter !== letter) {
            return false
          }
        }

        return true
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
            const parsed = JSON.parse(saved)
            set({
              solveState: {
                ...parsed,
                lockedCells: parsed.lockedCells ?? {},
              },
            })
          } catch (error) {
            console.error('Failed to load solve state:', error)
          }
        } else {
          // Create new solve state
          set({
            solveState: {
              filledCells: {},
              startTime: new Date(),
              checkResults: {},
              lockedCells: {},
            },
          })
        }
      },
    }),
    {
      name: 'crosswise-store',
      partialize: (state) => ({
        // Only persist non-sensitive state
        selectedTopic: state.selectedTopic,
        selectedList: state.selectedList,
        currentPuzzle: state.currentPuzzle,
        solveState: state.solveState,
        user: state.user,
      }),
    },
  ),
)
