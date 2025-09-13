'use client'

import { useEffect, useRef, useState } from 'react'
import { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'
import { useAppStore } from '@/lib/store'

interface CrosswordGridProps {
  grid: CrosswordGrid
  numbering: CrosswordNumbering
  solveState?: SolveState
  onCellClick?: (row: number, col: number) => void
  onCellKeyPress?: (row: number, col: number, key: string) => void
}

export default function CrosswordGrid({ grid, numbering, solveState }: CrosswordGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(40)
  const { updateCell, selectCell, selectClue, clearCell } = useAppStore()
  
  // Calculate grid size and cell size based on container
  useEffect(() => {
    const updateSize = () => {
      if (!gridRef.current) return
      
      const container = gridRef.current.parentElement
      if (!container) return
      
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight - 100 // Account for controls
      
      const maxCellWidth = Math.floor((containerWidth - 20) / grid.size.cols)
      const maxCellHeight = Math.floor((containerHeight - 20) / grid.size.rows)
      const newCellSize = Math.min(maxCellWidth, maxCellHeight, 50)
      
      setCellSize(Math.max(newCellSize, 25))
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [grid.size])
  
  const handleCellClick = (row: number, col: number) => {
    const cell = grid.cells[row][col]
    if (cell.type === 'block') return
    
    selectCell(row, col)
    
    // Find intersecting clues
    const acrossClue = numbering.across.find(clue => 
      clue.row === row && col >= clue.col && col < clue.col + clue.length
    )
    const downClue = numbering.down.find(clue => 
      clue.col === col && row >= clue.row && row < clue.row + clue.length
    )
    
    // Select a clue (prefer the one that starts at this cell, otherwise alternate)
    if (acrossClue && acrossClue.row === row && acrossClue.col === col) {
      selectClue('across', acrossClue.number)
    } else if (downClue && downClue.row === row && downClue.col === col) {
      selectClue('down', downClue.number)
    } else if (acrossClue) {
      selectClue('across', acrossClue.number)
    } else if (downClue) {
      selectClue('down', downClue.number)
    }
  }
  
  const isValidLetter = (key: string): boolean => {
    return key.length === 1 && /^[A-Za-z]$/.test(key)
  }

  const handleKeyPress = (e: React.KeyboardEvent, row: number, col: number) => {
    e.preventDefault()
    
    // Only allow single letters A-Z (case insensitive)
    if (isValidLetter(e.key)) {
      updateCell(row, col, e.key.toUpperCase())
      // Move to next cell in selected direction
      moveToNextCell(row, col)
    } else if (e.key === 'Backspace') {
      clearCell(row, col)
      // Move to previous cell
      moveToPreviousCell(row, col)
    } else if (e.key === 'Delete') {
      clearCell(row, col)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Move to next clue
      moveToNextClue(e.shiftKey)
    } else if (e.key.startsWith('Arrow')) {
      handleArrowKey(e.key, row, col)
    }
    // Explicitly ignore all other keys (Shift, Control, Alt, etc.)
    return
  }
  
  const moveToNextCell = (row: number, col: number) => {
    if (!solveState?.selectedClue) return
    
    const { direction, number } = solveState.selectedClue
    const clue = numbering[direction].find(c => c.number === number)
    if (!clue) return
    
    const nextRow = direction === 'down' ? row + 1 : row
    const nextCol = direction === 'across' ? col + 1 : col
    
    // Check if still within the word
    if (direction === 'across' && nextCol < clue.col + clue.length) {
      selectCell(nextRow, nextCol)
      // Focus the next cell element
      setTimeout(() => focusCell(nextRow, nextCol), 0)
    } else if (direction === 'down' && nextRow < clue.row + clue.length) {
      selectCell(nextRow, nextCol)
      // Focus the next cell element
      setTimeout(() => focusCell(nextRow, nextCol), 0)
    }
  }
  
  const moveToPreviousCell = (row: number, col: number) => {
    if (!solveState?.selectedClue) return
    
    const { direction, number } = solveState.selectedClue
    const clue = numbering[direction].find(c => c.number === number)
    if (!clue) return
    
    const prevRow = direction === 'down' ? row - 1 : row
    const prevCol = direction === 'across' ? col - 1 : col
    
    // Check if still within the word
    if (direction === 'across' && prevCol >= clue.col) {
      selectCell(prevRow, prevCol)
      // Focus the previous cell element
      setTimeout(() => focusCell(prevRow, prevCol), 0)
    } else if (direction === 'down' && prevRow >= clue.row) {
      selectCell(prevRow, prevCol)
      // Focus the previous cell element
      setTimeout(() => focusCell(prevRow, prevCol), 0)
    }
  }
  
  const focusCell = (row: number, col: number) => {
    const cellElement = document.querySelector(`[data-cell="${row}-${col}"]`) as HTMLElement
    if (cellElement) {
      cellElement.focus()
    }
  }
  
  const moveToNextClue = (backward: boolean = false) => {
    if (!solveState?.selectedClue) return
    
    const { direction, number } = solveState.selectedClue
    const clues = numbering[direction]
    const currentIndex = clues.findIndex(c => c.number === number)
    
    if (currentIndex === -1) return
    
    const nextIndex = backward ? currentIndex - 1 : currentIndex + 1
    
    if (nextIndex >= 0 && nextIndex < clues.length) {
      const nextClue = clues[nextIndex]
      selectClue(direction, nextClue.number)
      selectCell(nextClue.row, nextClue.col)
    }
  }
  
  const handleArrowKey = (key: string, row: number, col: number) => {
    let newRow = row
    let newCol = col
    
    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1)
        break
      case 'ArrowDown':
        newRow = Math.min(grid.size.rows - 1, row + 1)
        break
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1)
        break
      case 'ArrowRight':
        newCol = Math.min(grid.size.cols - 1, col + 1)
        break
    }
    
    // Skip blocked cells
    while (grid.cells[newRow][newCol].type === 'block') {
      if (key === 'ArrowUp' && newRow > 0) newRow--
      else if (key === 'ArrowDown' && newRow < grid.size.rows - 1) newRow++
      else if (key === 'ArrowLeft' && newCol > 0) newCol--
      else if (key === 'ArrowRight' && newCol < grid.size.cols - 1) newCol++
      else break
    }
    
    if (grid.cells[newRow][newCol].type === 'cell') {
      selectCell(newRow, newCol)
    }
  }
  
  const getCellClasses = (row: number, col: number) => {
    const cell = grid.cells[row][col]
    const cellKey = `${row},${col}`
    const classes = ['crossword-cell']
    
    if (cell.type === 'block') {
      classes.push('blocked')
      return classes.join(' ')
    }
    
    // Selection states
    if (solveState?.selectedCell?.row === row && solveState?.selectedCell?.col === col) {
      classes.push('selected')
    }
    
    // Highlight cells in selected word
    if (solveState?.selectedClue) {
      const { direction, number } = solveState.selectedClue
      const clue = numbering[direction].find(c => c.number === number)
      if (clue) {
        const inWord = direction === 'across' 
          ? row === clue.row && col >= clue.col && col < clue.col + clue.length
          : col === clue.col && row >= clue.row && row < clue.row + clue.length
        
        if (inWord) {
          classes.push('highlighted')
        }
      }
    }
    
    // Check results
    if (solveState?.checkResults?.[cellKey] !== undefined) {
      classes.push(solveState.checkResults[cellKey] ? 'correct' : 'incorrect')
    }
    
    return classes.join(' ')
  }
  
  const getCellNumber = (row: number, col: number) => {
    const acrossClue = numbering.across.find(clue => clue.row === row && clue.col === col)
    const downClue = numbering.down.find(clue => clue.row === row && clue.col === col)
    
    return acrossClue?.number || downClue?.number
  }
  
  const getCellLetter = (row: number, col: number) => {
    const cellKey = `${row},${col}`
    return solveState?.filledCells[cellKey] || ''
  }
  
  return (
    <div className="flex justify-center p-4">
      <div
        ref={gridRef}
        className="crossword-grid select-none"
        style={{
          gridTemplateColumns: `repeat(${grid.size.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid.size.rows}, ${cellSize}px)`
        }}
      >
        {grid.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              data-cell={`${rowIndex}-${colIndex}`}
              className={getCellClasses(rowIndex, colIndex)}
              style={{ width: cellSize, height: cellSize }}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onKeyDown={(e) => handleKeyPress(e, rowIndex, colIndex)}
              tabIndex={cell.type === 'cell' ? 0 : -1}
            >
              {cell.type === 'cell' && (
                <>
                  {getCellNumber(rowIndex, colIndex) && (
                    <span className="cell-number">
                      {getCellNumber(rowIndex, colIndex)}
                    </span>
                  )}
                  <span style={{ fontSize: Math.max(cellSize * 0.5, 12) }}>
                    {getCellLetter(rowIndex, colIndex)}
                  </span>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}