'use client'

import { useAppStore } from '@/lib/store'

interface PuzzleControlsProps {
  onNewPuzzle?: () => void
  onSettings?: () => void
  onExport?: () => void
  isGenerating?: boolean
}

export default function PuzzleControls({ onNewPuzzle, onSettings, onExport, isGenerating }: PuzzleControlsProps) {
  const { currentPuzzle, solveState, selectedTopic, selectedList, checkSolution, clearWord } = useAppStore()
  
  const handleCheck = (mode: 'letter' | 'word' | 'puzzle') => {
    checkSolution(mode)
  }
  
  const handleClearWord = () => {
    if (solveState?.selectedClue) {
      const { direction, number } = solveState.selectedClue
      clearWord(direction, number)
    }
  }
  
  const getCompletionStats = () => {
    if (!currentPuzzle || !solveState) return { filled: 0, total: 0, percentage: 0 }
    
    const totalCells = currentPuzzle.grid.cells
      .flat()
      .filter(cell => cell.type === 'cell').length
    
    const filledCells = Object.keys(solveState.filledCells).length
    const percentage = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0
    
    return { filled: filledCells, total: totalCells, percentage }
  }
  
  const stats = getCompletionStats()
  
  return (
    <div className="bg-white border-b p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectedTopic && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedTopic.icon}</span>
              <span className="text-sm font-medium text-gray-700">{selectedTopic.name}</span>
            </div>
          )}
          {selectedList && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-600">{selectedList.name}</span>
            </>
          )}
          {currentPuzzle && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">Seed: {currentPuzzle.seed.slice(0, 8)}...</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            Progress: {stats.filled}/{stats.total} ({stats.percentage}%)
          </div>
          
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {onNewPuzzle && (
            <button
              onClick={onNewPuzzle}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'New Puzzle'}
            </button>
          )}
          
          <button
            onClick={() => handleCheck('letter')}
            disabled={!solveState?.selectedCell}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Letter
          </button>
          
          <button
            onClick={() => handleCheck('word')}
            disabled={!solveState?.selectedClue}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Word
          </button>
          
          <button
            onClick={() => handleCheck('puzzle')}
            disabled={stats.filled === 0}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check All
          </button>
          
          <button
            onClick={handleClearWord}
            disabled={!solveState?.selectedClue}
            className="px-3 py-1.5 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Word
          </button>
        </div>
        
        <div className="flex gap-2">
          {onSettings && (
            <button
              onClick={onSettings}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Settings
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Export
            </button>
          )}
          
          <button className="p-1.5 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}