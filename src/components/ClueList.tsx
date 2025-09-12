'use client'

import { useState } from 'react'
import { ClueEntry, SolveState } from '@/types/crossword'
import { useAppStore } from '@/lib/store'

interface ClueListProps {
  clues: ClueEntry[]
  direction: 'across' | 'down'
  selectedClue?: { direction: 'across' | 'down'; number: number }
  solveState?: SolveState
}

export default function ClueList({ clues, direction, selectedClue, solveState }: ClueListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { selectClue, selectCell } = useAppStore()
  
  const handleClueClick = (clue: ClueEntry) => {
    selectClue(direction, clue.number)
    selectCell(clue.row, clue.col)
  }
  
  const filteredClues = clues.filter(clue =>
    clue.clue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clue.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const getClueStatus = (clue: ClueEntry) => {
    if (!solveState) return 'empty'
    
    let filledCount = 0
    let correctCount = 0
    
    for (let i = 0; i < clue.length; i++) {
      const row = direction === 'down' ? clue.row + i : clue.row
      const col = direction === 'across' ? clue.col + i : clue.col
      const cellKey = `${row},${col}`
      
      if (solveState.filledCells[cellKey]) {
        filledCount++
        
        if (solveState.checkResults?.[cellKey]) {
          correctCount++
        }
      }
    }
    
    if (correctCount === clue.length) return 'complete'
    if (filledCount === clue.length) return 'filled'
    if (filledCount > 0) return 'partial'
    return 'empty'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return '✅'
      case 'filled':
        return '📝'
      case 'partial':
        return '⚪'
      default:
        return '⭕'
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3 capitalize">
          {direction} ({clues.length})
        </h3>
        <input
          type="text"
          placeholder="Search clues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredClues.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">
            {searchQuery ? 'No matching clues found' : 'No clues available'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredClues.map((clue) => {
              const isSelected = selectedClue?.direction === direction && selectedClue?.number === clue.number
              const status = getClueStatus(clue)
              
              return (
                <div
                  key={`${direction}-${clue.number}`}
                  onClick={() => handleClueClick(clue)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm font-medium text-gray-600 shrink-0">
                        {clue.number}
                      </span>
                      <span className="text-xs" title={`Status: ${status}`}>
                        {getStatusIcon(status)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {clue.clue}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {clue.length} letters
                        </span>
                        
                        {solveState && (
                          <div className="flex gap-0.5">
                            {Array.from({ length: clue.length }).map((_, i) => {
                              const row = direction === 'down' ? clue.row + i : clue.row
                              const col = direction === 'across' ? clue.col + i : clue.col
                              const cellKey = `${row},${col}`
                              const letter = solveState.filledCells[cellKey]
                              const isCorrect = solveState.checkResults?.[cellKey]
                              
                              return (
                                <span
                                  key={i}
                                  className={`w-4 h-4 border text-xs flex items-center justify-center font-mono ${
                                    letter
                                      ? isCorrect === true
                                        ? 'bg-green-100 border-green-300 text-green-800'
                                        : isCorrect === false
                                        ? 'bg-red-100 border-red-300 text-red-800'
                                        : 'bg-blue-50 border-blue-200 text-blue-800'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  {letter || ''}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}