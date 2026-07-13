import seedrandom from 'seedrandom'
import {
  CrosswordCell,
  CrosswordGrid,
  CrosswordNumbering,
  WordPlacement,
  ClueEntry,
} from '@/types/crossword'

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
  maxWords?: number
}

// Fallback when a caller constructs a generator without a seed. A constant (not a
// random value) so generation stays reproducible for a given word set (#35).
export const DEFAULT_GENERATOR_SEED = 'crosswise'

// FNV-1a 32-bit — cheap, dependency-free, stable across runs. Not cryptographic;
// only used to derive default seeds.
function fnv1a(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

// Default seed for a puzzle generated without an explicit seed: stable for a given
// list id + content, independent of item order and of when the request is made.
// Editing the list's items changes the default seed (and thus the default puzzle).
export function deriveListSeed(listId: string, items: { answer: string; clue: string }[]): string {
  const canonical = items
    .map((item) => `${item.answer}\u0000${item.clue}`)
    .sort()
    .join('\u0001')
  return `list:${listId}:${fnv1a(canonical).toString(36)}`
}

// Total backtracking expansions allowed per generate() call. A counter (not a time
// budget) so the cutoff is deterministic for a given seed regardless of machine speed.
// When exhausted, the search degrades to greedy placement (no unwinding).
const DEFAULT_SEARCH_BUDGET = 4000

// Codepoint comparison, deliberately not localeCompare: localeCompare's result
// depends on the runtime's locale, which would make canonical ordering differ
// between environments and break cross-machine reproducibility.
function compareByAnswerThenClue(
  a: { answer: string; clue: string },
  b: { answer: string; clue: string },
): number {
  if (a.answer !== b.answer) return a.answer < b.answer ? -1 : 1
  if (a.clue !== b.clue) return a.clue < b.clue ? -1 : 1
  return 0
}

export class CrosswordGenerator {
  private rng: () => number
  private grid: (string | null)[][]
  private placedWords: WordPlacement[] = []
  private gridSize: { rows: number; cols: number }
  private maxAttempts: number
  private maxWords?: number
  private searchBudget = DEFAULT_SEARCH_BUDGET

  constructor(options: GeneratorOptions = {}) {
    const seed = options.seed || DEFAULT_GENERATOR_SEED
    this.rng = seedrandom(seed)
    this.gridSize = options.gridSize || { rows: 15, cols: 15 }
    this.maxAttempts = options.maxAttempts || 300
    this.maxWords = options.maxWords
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
    // Step 0: Canonicalize input order before anything touches the seeded RNG.
    // Callers pass DB rows whose order is unspecified (and changes after updates/
    // vacuum); "same list + same seed => same puzzle" must not depend on it (#77).
    const canonicalWords = [...words].sort(compareByAnswerThenClue)

    // Select the candidate pool through the seeded RNG so word selection is as
    // reproducible as placement (#35).
    const pool =
      this.maxWords && canonicalWords.length > this.maxWords
        ? this.shuffleArray(canonicalWords).slice(0, this.maxWords)
        : canonicalWords

    // Step 1: Preprocess words
    const processedWords = this.preprocessWords(pool)
    if (processedWords.length === 0) {
      return { success: false, placedWords: 0, totalWords: pool.length }
    }

    // Step 2: Try generation with multiple attempts
    let bestResult: WordPlacement[] = []
    let attempts = 0
    this.searchBudget = DEFAULT_SEARCH_BUDGET

    while (attempts < this.maxAttempts) {
      this.grid = this.createEmptyGrid()
      this.placedWords = []

      const shuffledWords = this.shuffleArray([...processedWords])
      const result = this.generateWithBacktracking(shuffledWords)

      if (result.length > bestResult.length) {
        bestResult = [...result]
      }

      // Success criteria: placed at least 90% of words
      if (result.length >= Math.floor(pool.length * 0.9)) {
        break
      }

      // Budget exhausted: further attempts would run greedy-only and rarely beat
      // what we already have — stop instead of burning CPU.
      if (this.searchBudget <= 0) {
        break
      }

      attempts++
    }

    this.placedWords = bestResult
    const successRate = bestResult.length / pool.length

    if (successRate < 0.9) {
      const conflictingWords = this.findConflictingWords(processedWords, bestResult)
      return {
        success: false,
        placedWords: bestResult.length,
        totalWords: pool.length,
        conflictingWords,
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
      totalWords: pool.length,
    }
  }

  private preprocessWords(words: { answer: string; clue: string }[]): WordEntry[] {
    return words
      .map((word) => {
        const answer = word.answer.toUpperCase().replace(/[^A-Z]/g, '')
        return {
          answer,
          clue: word.clue,
          length: answer.length,
          letterFreq: this.calculateLetterFrequency(answer),
        }
      })
      .filter((word) => word.answer.length >= 2 && word.answer.length <= 20)
      // Longest words first; ties broken by a total order so equal-length words
      // sort identically regardless of input order (#77).
      .sort((a, b) => b.length - a.length || compareByAnswerThenClue(a, b))
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

  // Depth-first placement with symmetric backtracking. Every branch that is not
  // accepted unwinds exactly the placements it added (checkpoint-based), so a word
  // can never remain on the grid twice (#76). Returns a snapshot of the best
  // placement set found in this subtree; the caller rebuilds the grid from it.
  private generateWithBacktracking(words: WordEntry[]): WordPlacement[] {
    if (words.length === 0) return [...this.placedWords]

    const word = words[0]
    const remainingWords = words.slice(1)

    // If this is the first word, place it in the center
    if (this.placedWords.length === 0) {
      const centerRow = Math.floor(this.gridSize.rows / 2)
      const centerCol = Math.floor((this.gridSize.cols - word.length) / 2)

      if (this.tryPlaceWord(word, centerRow, centerCol, 'across')) {
        return this.generateWithBacktracking(remainingWords)
      }

      // Word doesn't fit (e.g. longer than the grid) — continue without it.
      return this.generateWithBacktracking(remainingWords)
    }

    // Find all possible placements for this word
    const candidates = this.findPlacementCandidates(word)

    // Sort by score (best first)
    candidates.sort((a, b) => b.score - a.score)

    // A subtree is perfect when every word (already placed + this one + all
    // remaining) ends up on the grid.
    const target = this.placedWords.length + 1 + remainingWords.length
    let best: WordPlacement[] = []

    // Try each candidate
    for (const candidate of candidates) {
      if (this.tryPlaceWord(word, candidate.row, candidate.col, candidate.direction)) {
        if (this.searchBudget <= 0) {
          // Budget exhausted: greedy mode — commit to the first valid placement.
          return this.generateWithBacktracking(remainingWords)
        }
        this.searchBudget--

        const checkpoint = this.placedWords.length - 1
        const result = this.generateWithBacktracking(remainingWords)
        if (result.length >= target) {
          return result
        }
        if (result.length > best.length) {
          best = result
        }

        // Backtrack: unwind everything this branch placed, not just the last word.
        this.unwindTo(checkpoint)
      }
    }

    // Also consider skipping this word entirely.
    const checkpoint = this.placedWords.length
    const skipped = this.generateWithBacktracking(remainingWords)
    if (skipped.length > best.length) {
      best = skipped
    }
    this.unwindTo(checkpoint)

    return best
  }

  // Remove placements from the end until only `count` remain. Placements are only
  // ever appended, so truncating from the tail restores the exact prior grid state.
  private unwindTo(count: number): void {
    while (this.placedWords.length > count) {
      this.removeWord(this.placedWords[this.placedWords.length - 1])
    }
  }

  private findPlacementCandidates(word: WordEntry): PlacementCandidate[] {
    const candidates: PlacementCandidate[] = []

    for (const placement of this.placedWords) {
      // Try intersections with this placed word
      for (let i = 0; i < placement.word.length; i++) {
        const placedLetter = placement.word[i]
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
              intersections: [{ row: intersectRow, col: intersectCol, letter: placedLetter }],
            })
          }
        }
      }
    }

    return candidates
  }

  private isValidPlacement(
    word: WordEntry,
    row: number,
    col: number,
    direction: 'across' | 'down',
  ): boolean {
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

  private scorePlacement(
    word: WordEntry,
    row: number,
    col: number,
    direction: 'across' | 'down',
  ): number {
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

  private tryPlaceWord(
    word: WordEntry,
    row: number,
    col: number,
    direction: 'across' | 'down',
  ): boolean {
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
      number: 0, // Will be set during numbering
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
          letter: letter || undefined,
        }
      }
    }

    return {
      cells,
      size: { rows: this.gridSize.rows, cols: this.gridSize.cols },
    }
  }

  private generateNumbering(placements: WordPlacement[]): CrosswordNumbering {
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

        const acrossWord = sortedPlacements.find(
          (p) => p.direction === 'across' && p.row === row && p.col === col,
        )
        const downWord = sortedPlacements.find(
          (p) => p.direction === 'down' && p.row === row && p.col === col,
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
              direction: 'across',
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
              direction: 'down',
            })
          }

          currentNumber++
        }
      }
    }

    return { across, down }
  }

  private createEmptyGrid(): (string | null)[][] {
    return Array(this.gridSize.rows)
      .fill(null)
      .map(() => Array(this.gridSize.cols).fill(null))
  }

  private getAdjacentCells(
    row: number,
    col: number,
    direction: 'across' | 'down',
  ): [number, number][] {
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
      const j = Math.floor(this.rng() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private findConflictingWords(allWords: WordEntry[], placedWords: WordPlacement[]): string[] {
    const placed = new Set(placedWords.map((p) => p.word))
    return allWords
      .filter((w) => !placed.has(w.answer))
      .map((w) => w.answer)
      .slice(0, 5) // Return up to 5 conflicting words
  }
}
