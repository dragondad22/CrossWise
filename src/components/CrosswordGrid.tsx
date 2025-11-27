'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { CrosswordGrid as CrosswordGridType, CrosswordNumbering, SolveState } from '@/types/crossword'

interface CrosswordGridProps {
  grid: CrosswordGridType
  numbering: CrosswordNumbering
  solveState?: SolveState
  onCellClick?: (row: number, col: number) => void
  onCellKeyPress?: (row: number, col: number, key: string) => void
}

export default function CrosswordGrid({ grid, numbering, solveState }: CrosswordGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const virtualKeyboardInputRef = useRef<HTMLInputElement>(null)
  const selectedClueRef = useRef<SolveState['selectedClue'] | null>(solveState?.selectedClue ?? null)
  const selectedCellRef = useRef<SolveState['selectedCell'] | null>(solveState?.selectedCell ?? null)
  const [cellSize, setCellSize] = useState(40)
  const [shouldUseVirtualKeyboard, setShouldUseVirtualKeyboard] = useState(false)
  const { updateCell, selectCell, selectClue, clearCell } = useAppStore()

  const focusVirtualInput = useCallback(() => {
    const input = virtualKeyboardInputRef.current
    if (!input) return

    input.focus({ preventScroll: true })
    input.setSelectionRange(0, 0)
  }, [])

  // Enable hidden input on touch devices so tapping cells opens the soft keyboard.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasCoarsePointer =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    const isTouchDevice = hasCoarsePointer || 'ontouchstart' in window

    setShouldUseVirtualKeyboard(isTouchDevice)
  }, [])

  useEffect(() => {
    focusVirtualInput()
  }, [focusVirtualInput])

  // Keep a local reference so keyboard navigation works even when the upstream store
  // doesn't immediately re-render with a new selected clue (e.g., in tests with mocks).
  useEffect(() => {
    selectedClueRef.current = solveState?.selectedClue ?? null
    selectedCellRef.current = solveState?.selectedCell ?? null
  }, [solveState])

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
    selectedCellRef.current = { row, col }

    focusVirtualInput()

    if (shouldUseVirtualKeyboard) {
      setTimeout(() => virtualKeyboardInputRef.current?.focus({ preventScroll: true }), 0)
    }

    // Find intersecting clues
    const acrossClue = numbering.across.find(
      (clue) => clue.row === row && col >= clue.col && col < clue.col + clue.length,
    )
    const downClue = numbering.down.find(
      (clue) => clue.col === col && row >= clue.row && row < clue.row + clue.length,
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
    // Debug: console.log('handleKeyPress', e.key, { row, col })
    e.preventDefault()

    const cellKey = `${row},${col}`
    const isLocked = Boolean(solveState?.lockedCells?.[cellKey])

    // Only allow single letters A-Z (case insensitive)
    if (isValidLetter(e.key)) {
      if (isLocked) return

      updateCell(row, col, e.key.toUpperCase())
      // Move to next cell in selected direction
      moveToNextCell(row, col)
    } else if (e.key === 'Backspace') {
      if (isLocked) {
        moveToPreviousCell(row, col)
        return
      }

      const currentLetter = solveState?.filledCells[cellKey]

      if (currentLetter) {
        // Current cell has content, just clear it
        clearCell(row, col)
      } else {
        // Current cell is empty, move to previous cell and clear it
        moveToPreviousCell(row, col)
      }
    } else if (e.key === 'Delete') {
      if (isLocked) return

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
    const clue = numbering[direction].find((c) => c.number === number)
    if (!clue) return

    // Find next empty cell in the current word
    let nextRow = direction === 'down' ? row + 1 : row
    let nextCol = direction === 'across' ? col + 1 : col

    // Keep looking for an empty cell within the word bounds
    while (
      (direction === 'across' && nextCol < clue.col + clue.length) ||
      (direction === 'down' && nextRow < clue.row + clue.length)
    ) {
      const cellKey = `${nextRow},${nextCol}`
      const hasLetter = solveState?.filledCells[cellKey]

      if (!hasLetter) {
        // Found empty cell, select it
        selectCell(nextRow, nextCol)
        selectedCellRef.current = { row: nextRow, col: nextCol }
        setTimeout(() => {
          focusCell(nextRow, nextCol)
          focusVirtualInput()
        }, 0)
        return
      }

      // Move to next cell
      nextRow = direction === 'down' ? nextRow + 1 : nextRow
      nextCol = direction === 'across' ? nextCol + 1 : nextCol
    }

    // If no empty cell found, stay at current position
  }

  const moveToPreviousCell = (row: number, col: number) => {
    if (!solveState?.selectedClue) return

    const { direction, number } = solveState.selectedClue
    const clue = numbering[direction].find((c) => c.number === number)
    if (!clue) return

    const prevRow = direction === 'down' ? row - 1 : row
    const prevCol = direction === 'across' ? col - 1 : col

    // Check if still within the word
    if (direction === 'across' && prevCol >= clue.col) {
      clearCell(prevRow, prevCol)
      selectCell(prevRow, prevCol)
      // Focus the previous cell element
      setTimeout(() => focusCell(prevRow, prevCol), 0)
    } else if (direction === 'down' && prevRow >= clue.row) {
      clearCell(prevRow, prevCol)
      selectCell(prevRow, prevCol)
      selectedCellRef.current = { row: prevRow, col: prevCol }
      // Focus the previous cell element
      setTimeout(() => {
        focusCell(prevRow, prevCol)
        focusVirtualInput()
      }, 0)
    }
  }

  const focusCell = useCallback(
    (row: number, col: number) => {
      if (shouldUseVirtualKeyboard) return

      const cellElement = document.querySelector(`[data-cell="${row}-${col}"]`) as HTMLElement
      if (cellElement) {
        cellElement.focus()
      }
    },
    [shouldUseVirtualKeyboard],
  )

  const selectedCell = solveState?.selectedCell

  useEffect(() => {
    if (!selectedCell) return
    const { row, col } = selectedCell

    setTimeout(() => {
      focusCell(row, col)
      focusVirtualInput()
    }, 0)
  }, [focusCell, focusVirtualInput, selectedCell, shouldUseVirtualKeyboard])

  const getClueCells = (clue: { row: number; col: number; length: number; direction: 'across' | 'down' }) => {
    const cells: Array<{ row: number; col: number }> = []
    for (let i = 0; i < clue.length; i++) {
      const row = clue.direction === 'down' ? clue.row + i : clue.row
      const col = clue.direction === 'across' ? clue.col + i : clue.col
      cells.push({ row, col })
    }
    return cells
  }

  const moveToNextClue = (backward: boolean = false) => {
    const currentSelectedClue = selectedClueRef.current
    if (!currentSelectedClue) return

    const combinedClues = [
      ...numbering.across.map((clue) => ({ direction: 'across' as const, clue })),
      ...numbering.down.map((clue) => ({ direction: 'down' as const, clue })),
    ]

    if (combinedClues.length === 0) return

    const currentIndex = combinedClues.findIndex(
      (entry) =>
        entry.direction === currentSelectedClue.direction && entry.clue.number === currentSelectedClue.number,
    )

    if (currentIndex === -1) return

    const step = backward ? -1 : 1
    const nextIndex = (currentIndex + step + combinedClues.length) % combinedClues.length
    const targetEntry = combinedClues[nextIndex]

    const nextDirection = targetEntry.direction
    const nextClue = targetEntry.clue
    selectClue(nextDirection, nextClue.number)

    // Find the first empty cell in the next clue; fall back to the starting cell.
    let targetRow = nextClue.row
    let targetCol = nextClue.col

    const filledCells = solveState?.filledCells ?? {}

    const targetCell = getClueCells(nextClue).find((cell) => {
      const cellKey = `${cell.row},${cell.col}`
      return !filledCells[cellKey]
    })

    if (targetCell) {
      targetRow = targetCell.row
      targetCol = targetCell.col
    }

    selectCell(targetRow, targetCol)
    selectedCellRef.current = { row: targetRow, col: targetCol }
    selectedClueRef.current = { direction: nextDirection, number: nextClue.number }
    focusCell(targetRow, targetCol)
    focusVirtualInput()
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

    if (cell.type === 'block') {
      return 'pointer-events-none bg-gray-900'
    }

    const isSelected =
      solveState?.selectedCell?.row === row && solveState?.selectedCell?.col === col

    let isHighlighted = false
    if (solveState?.selectedClue) {
      const { direction, number } = solveState.selectedClue
      const clue = numbering[direction].find((c) => c.number === number)
      if (clue) {
        isHighlighted =
          direction === 'across'
            ? row === clue.row && col >= clue.col && col < clue.col + clue.length
            : col === clue.col && row >= clue.row && row < clue.row + clue.length
      }
    }

    const checkState = solveState?.checkResults?.[cellKey]

    return cn(
      'relative flex items-center justify-center font-semibold uppercase tracking-wide border border-border/60 bg-card text-card-foreground transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      isHighlighted && 'bg-yellow-100',
      isSelected && 'ring-2 ring-primary',
      checkState === true && 'bg-emerald-100 text-emerald-700',
      checkState === false && 'bg-rose-100 text-rose-600',
    )
  }

  const getCellNumber = (row: number, col: number) => {
    const acrossClue = numbering.across.find((clue) => clue.row === row && clue.col === col)
    const downClue = numbering.down.find((clue) => clue.row === row && clue.col === col)

    return acrossClue?.number || downClue?.number
  }

  const getCellLetter = (row: number, col: number) => {
    const cellKey = `${row},${col}`
    return solveState?.filledCells[cellKey] || ''
  }

  const handleKey = useCallback(
    (key: string, shiftKey: boolean, row: number, col: number) => {
      const fakeEvent = {
        key,
        shiftKey,
        preventDefault: () => {},
      } as React.KeyboardEvent

      handleKeyPress(fakeEvent, row, col)
    },
    [handleKeyPress],
  )

  useEffect(() => {
    if (shouldUseVirtualKeyboard) return

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const selectedCell = selectedCellRef.current
      if (!selectedCell) return

      event.preventDefault()
      const { row, col } = selectedCell
      handleKey(event.key, event.shiftKey, row, col)
    }

    document.addEventListener('keydown', onWindowKeyDown, true)
    return () => document.removeEventListener('keydown', onWindowKeyDown, true)
  }, [handleKey, shouldUseVirtualKeyboard])

  const handleVirtualKeyboardKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    focusVirtualInput()

    const selectedCell = selectedCellRef.current
    if (!selectedCell) return

    if (isValidLetter(e.key)) {
      handleKey(e.key, e.shiftKey, selectedCell.row, selectedCell.col)
      return
    }

    const { row, col } = selectedCell
    handleKey(e.key, e.shiftKey, row, col)
    focusVirtualInput()
  }

  const handleVirtualKeyboardInput = (e: React.FormEvent<HTMLInputElement>) => {
    const selectedCell = selectedCellRef.current
    if (!selectedCell) return
    const value = e.currentTarget.value
    e.currentTarget.value = ''

    const lastChar = value.slice(-1)
    if (!lastChar) return

    const { row, col } = selectedCell
    handleKey(lastChar, false, row, col)
  }

  return (
    <div className="flex justify-center p-4">
      <input
        ref={virtualKeyboardInputRef}
        aria-hidden="true"
        className="absolute h-px w-px opacity-0"
        tabIndex={shouldUseVirtualKeyboard ? 0 : -1}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        defaultValue=""
        onKeyDown={handleVirtualKeyboardKeyDown}
        onInput={handleVirtualKeyboardInput}
      />
      <div
        ref={gridRef}
        className="inline-grid select-none gap-px rounded-2xl border border-border bg-foreground/80 p-1 shadow-card"
        style={{
          gridTemplateColumns: `repeat(${grid.size.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid.size.rows}, ${cellSize}px)`,
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
                    <span className="absolute left-1 top-1 text-[10px] font-semibold leading-none text-gray-500">
                      {getCellNumber(rowIndex, colIndex)}
                    </span>
                  )}
                  <span className="font-mono" style={{ fontSize: Math.max(cellSize * 0.5, 12) }}>
                    {getCellLetter(rowIndex, colIndex)}
                  </span>
                </>
              )}
            </div>
          )),
        )}
      </div>
    </div>
  )
}
