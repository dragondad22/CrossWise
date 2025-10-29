import { describe, expect, it } from 'vitest'

import { CrosswordGenerator } from '../crossword-generator'

const intersectingWords = [
  { answer: 'Crossword', clue: 'Type of word puzzle' },
  { answer: 'Words', clue: 'Units of language' },
  { answer: 'Sword', clue: 'Blade used by knights' },
  { answer: 'Crowd', clue: 'Large gathering of people' },
  { answer: 'Rows', clue: 'Lines of things' },
  { answer: 'Cord', clue: 'Rope-like piece' },
]

const nonIntersectingWords = [
  { answer: 'Alpha', clue: 'First letter' },
  { answer: 'Beta', clue: 'Second letter' },
  { answer: 'Gamma', clue: 'Third letter' },
  { answer: 'Delta', clue: 'Fourth letter' },
]

describe('CrosswordGenerator', () => {
  it('attempts to place words and returns grid metadata when enough intersections exist', () => {
    const generator = new CrosswordGenerator({
      gridSize: { rows: 10, cols: 10 },
      seed: 'unit-test-seed',
      maxAttempts: 50,
    })

    const result = generator.generate(intersectingWords)

    expect(result.totalWords).toBe(intersectingWords.length)
    expect(result.placedWords).toBeGreaterThan(0)

    if (result.success) {
      expect(result.grid).toBeDefined()
      expect(result.numbering?.across.length).toBeGreaterThan(0)
      expect(result.numbering?.down.length).toBeGreaterThan(0)

      const flatCells = result.grid!.cells.flat()
      const gridLetters = new Set(
        flatCells.filter((cell) => cell.type === 'cell' && cell.letter).map((cell) => cell.letter),
      )

      for (const letter of ['C', 'R', 'O', 'S', 'W', 'D']) {
        expect(gridLetters.has(letter)).toBe(true)
      }
    } else {
      expect(result.conflictingWords).toBeDefined()
    }
  })

  it('generates a valid puzzle when a single word is provided', () => {
    const generator = new CrosswordGenerator({
      gridSize: { rows: 5, cols: 5 },
      seed: 'single-word',
      maxAttempts: 1,
    })

    const result = generator.generate([{ answer: 'cat', clue: 'Feline friend' }])

    expect(result.success).toBe(true)
    expect(result.grid?.cells.flat().filter((cell) => cell.type === 'cell').length).toBe(3)
    expect(result.numbering?.across[0]).toMatchObject({
      direction: 'across',
      number: 1,
      answer: 'CAT',
    })
    expect(result.numbering?.down).toHaveLength(0)
  })

  it('reports failure when insufficient intersections are available', () => {
    const generator = new CrosswordGenerator({
      gridSize: { rows: 6, cols: 6 },
      seed: 'conflict-test',
      maxAttempts: 10,
    })

    const result = generator.generate(nonIntersectingWords)

    expect(result.success).toBe(false)
    expect(result.placedWords).toBeLessThan(nonIntersectingWords.length)
    expect(result.conflictingWords).toBeDefined()
    const upperAnswers = nonIntersectingWords.map((w) => w.answer.toUpperCase())
    for (const word of result.conflictingWords ?? []) {
      expect(upperAnswers).toContain(word)
    }
  })

  it('returns failure metadata gracefully when no words are supplied', () => {
    const generator = new CrosswordGenerator()
    const result = generator.generate([])

    expect(result.success).toBe(false)
    expect(result.placedWords).toBe(0)
    expect(result.totalWords).toBe(0)
  })
})
