import seedrandom from 'seedrandom'
import { CrosswordCell, CrosswordGrid, CrosswordNumbering, WordPlacement, ClueEntry } from '@/types/crossword'

export interface WordEntry {
  answer: string
  clue: string
  length: number
  letterFreq: Map<string, number[]> // letter -> positions in word
}

export interface PlacementCandidate {
  word: WordEntry
  row: number
  col: number
  direction: 'across' | 'down'
  score: number
  intersections: { row: number; col: number; letter: string }[]
}

export interface GeneratorOptions {
  gridSize?: { rows: number; cols: number }
  maxAttempts?: number
  seed?: string
}

export class CrosswordGenerator {
  private rng: () => number
  private grid: (string | null)[][]
  private placedWords: WordPlacement[] = []
  private gridSize: { rows: number; cols: number }
  private maxAttempts: number

  constructor(options: GeneratorOptions = {}) {
    const seed = options.seed || Math.random().toString()
    this.rng = seedrandom(seed)
    this.gridSize = options.gridSize || { rows: 15, cols: 15 }
    this.maxAttempts = options.maxAttempts || 300
    this.grid = this.createEmptyGrid()
  }

  public generate(words: { answer: string; clue: string }[]): {
    success: boolean
    grid?: CrosswordGrid
    numbering?: CrosswordNumbering
    placedWords: number
    totalWords: number
    conflictingWords?: string[]
  } {
    // Step 1: Preprocess words
    const processedWords = this.preprocessWords(words)
    if (processedWords.length === 0) {
      return { success: false, placedWords: 0, totalWords: words.length }
    }

    // Step 2: Try generation with multiple attempts
    let bestResult: WordPlacement[] = []
    let attempts = 0

    while (attempts < this.maxAttempts) {
      this.grid = this.createEmptyGrid()
      this.placedWords = []
      
      const shuffledWords = this.shuffleArray([...processedWords])
      const result = this.generateWithBacktracking(shuffledWords)
      
      if (result.length > bestResult.length) {
        bestResult = [...result]
      }
      
      // Success criteria: placed at least 90% of words
      if (result.length >= Math.floor(words.length * 0.9)) {
        break
      }
      
      attempts++
    }

    this.placedWords = bestResult
    const successRate = bestResult.length / words.length

    if (successRate < 0.9) {
      const conflictingWords = this.findConflictingWords(processedWords, bestResult)
      return {
        success: false,
        placedWords: bestResult.length,
        totalWords: words.length,
        conflictingWords
      }
    }

    // Step 3: Create final grid and numbering
    this.rebuildGrid(bestResult)
    const finalGrid = this.createFinalGrid()
    const numbering = this.generateNumbering(bestResult)

    return {
      success: true,
      grid: finalGrid,
      numbering,
      placedWords: bestResult.length,
      totalWords: words.length
    }
  }

  private preprocessWords(words: { answer: string; clue: string }[]): WordEntry[] {
    return words
      .map(word => ({
        answer: word.answer.toUpperCase().replace(/[^A-Z]/g, ''),
        clue: word.clue,
        length: word.answer.length,
        letterFreq: this.calculateLetterFrequency(word.answer)
      }))
      .filter(word => word.answer.length >= 2 && word.answer.length <= 20)
      .sort((a, b) => b.length - a.length) // Longest words first
  }

  private calculateLetterFrequency(word: string): Map<string, number[]> {
    const freq = new Map<string, number[]>()
    for (let i = 0; i < word.length; i++) {
      const letter = word[i]
      if (!freq.has(letter)) {
        freq.set(letter, [])
      }
      freq.get(letter)!.push(i)
    }
    return freq
  }

  private generateWithBacktracking(words: WordEntry[]): WordPlacement[] {
    if (words.length === 0) return this.placedWords

    const word = words[0]
    const remainingWords = words.slice(1)
    
    // If this is the first word, place it in the center
    if (this.placedWords.length === 0) {
      const centerRow = Math.floor(this.gridSize.rows / 2)
      const centerCol = Math.floor((this.gridSize.cols - word.length) / 2)
      
      if (this.tryPlaceWord(word, centerRow, centerCol, 'across')) {
        const result = this.generateWithBacktracking(remainingWords)
        if (result.length > 0) return result
        
        // Backtrack
        this.removeWord(this.placedWords[this.placedWords.length - 1])
      }
      
      return []
    }

    // Find all possible placements for this word
    const candidates = this.findPlacementCandidates(word)
    
    // Sort by score (best first)
    candidates.sort((a, b) => b.score - a.score)
    
    // Try each candidate
    for (const candidate of candidates) {
      if (this.tryPlaceWord(word, candidate.row, candidate.col, candidate.direction)) {
        const result = this.generateWithBacktracking(remainingWords)
        if (result.length >= remainingWords.length) {
          return result
        }
        
        // Backtrack
        this.removeWord(this.placedWords[this.placedWords.length - 1])
      }
    }

    // If we can't place this word, try without it
    return this.generateWithBacktracking(remainingWords)
  }

  private findPlacementCandidates(word: WordEntry): PlacementCandidate[] {
    const candidates: PlacementCandidate[] = []
    
    for (const placement of this.placedWords) {
      // Try intersections with this placed word
      for (let i = 0; i < placement.answer.length; i++) {
        const placedLetter = placement.answer[i]
        const positions = word.letterFreq.get(placedLetter)
        
        if (!positions) continue
        
        for (const pos of positions) {
          // Calculate intersection point
          const intersectRow = placement.direction === 'across' ? placement.row : placement.row + i
          const intersectCol = placement.direction === 'across' ? placement.col + i : placement.col
          
          // Try perpendicular direction
          const newDirection = placement.direction === 'across' ? 'down' : 'across'
          const newRow = newDirection === 'across' ? intersectRow : intersectRow - pos
          const newCol = newDirection === 'across' ? intersectCol - pos : intersectCol
          
          if (this.isValidPlacement(word, newRow, newCol, newDirection)) {
            const score = this.scorePlacement(word, newRow, newCol, newDirection)
            candidates.push({
              word,
              row: newRow,
              col: newCol,
              direction: newDirection,
              score,
              intersections: [{ row: intersectRow, col: intersectCol, letter: placedLetter }]
            })
          }
        }
      }
    }
    
    return candidates
  }

  private isValidPlacement(word: WordEntry, row: number, col: number, direction: 'across' | 'down'): boolean {
    const endRow = direction === 'down' ? row + word.length - 1 : row
    const endCol = direction === 'across' ? col + word.length - 1 : col
    
    // Check bounds
    if (row < 0 || col < 0 || endRow >= this.gridSize.rows || endCol >= this.gridSize.cols) {
      return false
    }
    
    // Check for conflicts and adjacency rules
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'down' ? row + i : row
      const currentCol = direction === 'across' ? col + i : col
      const letter = word.answer[i]
      
      const cellValue = this.grid[currentRow][currentCol]
      
      if (cellValue !== null && cellValue !== letter) {
        return false // Conflict
      }
      
      // Check adjacency (no touching words except at intersections)
      if (cellValue === null) {
        const adjacentCells = this.getAdjacentCells(currentRow, currentCol, direction)
        for (const [adjRow, adjCol] of adjacentCells) {
          if (this.grid[adjRow][adjCol] !== null) {
            return false
          }
        }
      }
    }
    
    // Check word boundaries (ensure words don't run together)
    const beforeRow = direction === 'down' ? row - 1 : row
    const beforeCol = direction === 'across' ? col - 1 : col
    const afterRow = direction === 'down' ? endRow + 1 : row
    const afterCol = direction === 'across' ? endCol + 1 : col
    
    if (this.isInBounds(beforeRow, beforeCol) && this.grid[beforeRow][beforeCol] !== null) {
      return false
    }
    if (this.isInBounds(afterRow, afterCol) && this.grid[afterRow][afterCol] !== null) {
      return false
    }
    
    return true
  }

  private scorePlacement(word: WordEntry, row: number, col: number, direction: 'across' | 'down'): number {
    let score = 0
    let intersections = 0
    
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'down' ? row + i : row
      const currentCol = direction === 'across' ? col + i : col
      
      if (this.grid[currentRow][currentCol] !== null) {
        intersections++
        score += 10 // Reward intersections
      }
    }
    
    // Prefer central placements
    const centerRow = this.gridSize.rows / 2
    const centerCol = this.gridSize.cols / 2
    const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol)
    score -= distanceFromCenter * 0.5
    
    // Reward more intersections exponentially
    score += intersections * intersections * 5
    
    return score
  }

  private tryPlaceWord(word: WordEntry, row: number, col: number, direction: 'across' | 'down'): boolean {
    if (!this.isValidPlacement(word, row, col, direction)) {
      return false
    }
    
    // Place the word
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'down' ? row + i : row
      const currentCol = direction === 'across' ? col + i : col
      this.grid[currentRow][currentCol] = word.answer[i]
    }
    
    this.placedWords.push({
      word: word.answer,
      clue: word.clue,
      row,
      col,
      direction,
      number: 0 // Will be set during numbering
    })
    
    return true
  }

  private removeWord(placement: WordPlacement): void {
    // Remove word from grid
    for (let i = 0; i < placement.word.length; i++) {
      const currentRow = placement.direction === 'down' ? placement.row + i : placement.row
      const currentCol = placement.direction === 'across' ? placement.col + i : placement.col
      
      // Only remove if no other word uses this cell
      let usedByOther = false
      for (const other of this.placedWords) {
        if (other === placement) continue
        
        for (let j = 0; j < other.word.length; j++) {
          const otherRow = other.direction === 'down' ? other.row + j : other.row
          const otherCol = other.direction === 'across' ? other.col + j : other.col
          
          if (otherRow === currentRow && otherCol === currentCol) {
            usedByOther = true
            break
          }
        }
        if (usedByOther) break
      }
      
      if (!usedByOther) {
        this.grid[currentRow][currentCol] = null
      }
    }
    
    // Remove from placed words
    const index = this.placedWords.indexOf(placement)
    if (index > -1) {
      this.placedWords.splice(index, 1)
    }
  }

  private rebuildGrid(placements: WordPlacement[]): void {
    this.grid = this.createEmptyGrid()
    
    for (const placement of placements) {
      for (let i = 0; i < placement.word.length; i++) {
        const row = placement.direction === 'down' ? placement.row + i : placement.row
        const col = placement.direction === 'across' ? placement.col + i : placement.col
        this.grid[row][col] = placement.word[i]
      }
    }
  }

  private createFinalGrid(): CrosswordGrid {
    const cells: CrosswordCell[][] = []
    
    for (let row = 0; row < this.gridSize.rows; row++) {
      cells[row] = []
      for (let col = 0; col < this.gridSize.cols; col++) {
        const letter = this.grid[row][col]
        cells[row][col] = {
          row,
          col,
          type: letter ? 'cell' : 'block',
          letter: letter || undefined
        }
      }
    }
    
    return {
      cells,
      size: { rows: this.gridSize.rows, cols: this.gridSize.cols }
    }
  }

  private generateNumbering(placements: WordPlacement[]): CrosswordNumbering {
    const numbered = new Set<string>()
    const across: ClueEntry[] = []
    const down: ClueEntry[] = []
    let currentNumber = 1
    
    // Sort placements by position (top-left to bottom-right)
    const sortedPlacements = [...placements].sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row
      return a.col - b.col
    })
    
    for (let row = 0; row < this.gridSize.rows; row++) {
      for (let col = 0; col < this.gridSize.cols; col++) {
        if (this.grid[row][col] === null) continue
        
        const acrossWord = sortedPlacements.find(p => 
          p.direction === 'across' && p.row === row && p.col === col
        )
        const downWord = sortedPlacements.find(p => 
          p.direction === 'down' && p.row === row && p.col === col
        )
        
        if (acrossWord || downWord) {
          if (acrossWord) {
            acrossWord.number = currentNumber
            across.push({
              number: currentNumber,
              answer: acrossWord.word,
              clue: acrossWord.clue,
              row: acrossWord.row,
              col: acrossWord.col,
              length: acrossWord.word.length,
              direction: 'across'
            })
          }
          
          if (downWord) {
            downWord.number = currentNumber
            down.push({
              number: currentNumber,
              answer: downWord.word,
              clue: downWord.clue,
              row: downWord.row,
              col: downWord.col,
              length: downWord.word.length,
              direction: 'down'
            })
          }
          
          currentNumber++
        }
      }
    }
    
    return { across, down }
  }

  private createEmptyGrid(): (string | null)[][] {
    return Array(this.gridSize.rows).fill(null).map(() => 
      Array(this.gridSize.cols).fill(null)
    )
  }

  private getAdjacentCells(row: number, col: number, direction: 'across' | 'down'): [number, number][] {
    const adjacent: [number, number][] = []
    
    if (direction === 'across') {
      // Check above and below
      if (row > 0) adjacent.push([row - 1, col])
      if (row < this.gridSize.rows - 1) adjacent.push([row + 1, col])
    } else {
      // Check left and right
      if (col > 0) adjacent.push([row, col - 1])
      if (col < this.gridSize.cols - 1) adjacent.push([row, col + 1])
    }
    
    return adjacent.filter(([r, c]) => this.isInBounds(r, c))
  }

  private isInBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.gridSize.rows && col >= 0 && col < this.gridSize.cols
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private findConflictingWords(allWords: WordEntry[], placedWords: WordPlacement[]): string[] {
    const placed = new Set(placedWords.map(p => p.word))
    return allWords
      .filter(w => !placed.has(w.answer))
      .map(w => w.answer)
      .slice(0, 5) // Return up to 5 conflicting words
  }
}