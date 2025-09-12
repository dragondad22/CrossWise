'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { autosaveManager } from '@/lib/autosave'
import CrosswordGrid from '@/components/CrosswordGrid'
import ClueList from '@/components/ClueList'
import PuzzleControls from '@/components/PuzzleControls'

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
    setError
  } = useAppStore()
  
  const [selectedTab, setSelectedTab] = useState<'across' | 'down'>('across')
  
  useEffect(() => {
    if (puzzleId) {
      loadPuzzle(puzzleId)
    }
    
    return () => {
      // Stop autosave when leaving the page
      autosaveManager.stopAutosave()
    }
  }, [puzzleId])
  
  useEffect(() => {
    // Start autosave when puzzle and solve state are ready
    if (currentPuzzle && solveState) {
      autosaveManager.startAutosave(currentPuzzle.id, () => solveState)
    }
  }, [currentPuzzle, solveState])
  
  const loadPuzzle = async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // First, try to load from localStorage
      const savedState = autosaveManager.loadSolveState(id)
      
      // Fetch puzzle data from API
      const response = await fetch(`/api/puzzles/${id}/solve`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success) {
          const puzzleData = result.data.puzzle
          
          setPuzzle({
            id: puzzleData.id,
            grid: puzzleData.grid,
            numbering: puzzleData.numbering,
            seed: puzzleData.seed
          })
          
          // Use saved state if available, otherwise create new
          if (savedState) {
            setSolveState(savedState)
          } else {
            loadSolveState(id) // This will create a new solve state
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
  }
  
  const handleNewPuzzle = async () => {
    if (!currentPuzzle) return
    
    try {
      setLoading(true)
      
      // Get the list ID from current puzzle (we'd need to fetch this from the API)
      // For now, we'll generate a new puzzle with the same list
      const response = await fetch('/api/puzzles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listId: 'current-list-id', // This should be passed from the puzzle data
          seed: `${Date.now()}_new`
        })
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading puzzle...</p>
        </div>
      </div>
    )
  }
  
  if (!currentPuzzle || !solveState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Puzzle not found</h2>
          <p className="text-gray-500 mb-4">The puzzle you're looking for doesn't exist or failed to load.</p>
          <button
            onClick={() => router.push('/topics')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Back to Topics
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PuzzleControls
        onNewPuzzle={handleNewPuzzle}
        onExport={handleExport}
        isGenerating={useAppStore.getState().isLoading}
      />
      
      <div className="flex-1 flex">
        {/* Main puzzle area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <CrosswordGrid
              grid={currentPuzzle.grid}
              numbering={currentPuzzle.numbering}
              solveState={solveState}
            />
          </div>
        </div>
        
        {/* Clues sidebar */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setSelectedTab('across')}
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  selectedTab === 'across'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Across
              </button>
              <button
                onClick={() => setSelectedTab('down')}
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  selectedTab === 'down'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Down
              </button>
            </nav>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ClueList
              clues={currentPuzzle.numbering[selectedTab]}
              direction={selectedTab}
              selectedClue={solveState.selectedClue}
              solveState={solveState}
            />
          </div>
        </div>
      </div>
      
      {/* Mobile responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .flex {
            flex-direction: column;
          }
          .w-80 {
            width: 100%;
            height: 40vh;
          }
        }
      `}</style>
    </div>
  )
}