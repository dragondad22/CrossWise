import { describe, expect, it } from 'vitest'

import { CrosswordGenerator, deriveListSeed } from '../crossword-generator'

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

  it('produces identical output for the same words and seed', () => {
    const options = { gridSize: { rows: 10, cols: 10 }, seed: 'determinism', maxAttempts: 50 }
    const first = new CrosswordGenerator(options).generate(intersectingWords)
    const second = new CrosswordGenerator(options).generate(intersectingWords)

    expect(second).toEqual(first)
  })

  it('selects the same maxWords subset for the same seed', () => {
    const options = {
      gridSize: { rows: 10, cols: 10 },
      seed: 'subset-determinism',
      maxAttempts: 50,
      maxWords: 4,
    }
    const first = new CrosswordGenerator(options).generate(intersectingWords)
    const second = new CrosswordGenerator(options).generate(intersectingWords)

    expect(first.totalWords).toBe(4)
    expect(second).toEqual(first)
  })

  it('is deterministic when no seed is provided', () => {
    const options = { gridSize: { rows: 10, cols: 10 }, maxAttempts: 50 }
    const first = new CrosswordGenerator(options).generate(intersectingWords)
    const second = new CrosswordGenerator(options).generate(intersectingWords)

    expect(second).toEqual(first)
  })
})

// Realistic vocab list large enough to force backtracking (#76 repro class).
const biologyWords = [
  'GLUCOSE',
  'MITOCHONDRIA',
  'RIBOSOME',
  'NUCLEUS',
  'CYTOPLASM',
  'MEMBRANE',
  'ENZYME',
  'PROTEIN',
  'CHLOROPLAST',
  'OSMOSIS',
  'DIFFUSION',
  'PHOTOSYNTHESIS',
  'RESPIRATION',
  'BACTERIA',
  'VIRUS',
  'GENOME',
  'CHROMOSOME',
  'MEIOSIS',
  'MITOSIS',
  'ORGANELLE',
  'VACUOLE',
  'LYSOSOME',
  'PEPTIDE',
  'HORMONE',
].map((answer, i) => ({ answer, clue: `Biology term ${i + 1}` }))

describe('CrosswordGenerator placement invariants (#76)', () => {
  const generate = (seed: string) =>
    new CrosswordGenerator({ seed, maxAttempts: 300 }).generate(biologyWords)

  const allClues = (result: ReturnType<CrosswordGenerator['generate']>) => [
    ...(result.numbering?.across ?? []),
    ...(result.numbering?.down ?? []),
  ]

  for (const seed of ['dup-check', 'invariant-a', 'invariant-b']) {
    it(`never places a word twice (seed ${seed})`, () => {
      const result = generate(seed)
      const answers = allClues(result).map((clue) => clue.answer)
      expect(new Set(answers).size).toBe(answers.length)
    })

    it(`reports placedWords equal to the clue count and within the input size (seed ${seed})`, () => {
      const result = generate(seed)
      if (result.success) {
        expect(result.placedWords).toBe(allClues(result).length)
      }
      expect(result.placedWords).toBeLessThanOrEqual(biologyWords.length)
      expect(result.totalWords).toBe(biologyWords.length)
    })

    it(`keeps crossing letters consistent in the final grid (seed ${seed})`, () => {
      const result = generate(seed)
      if (!result.success) return
      for (const clue of allClues(result)) {
        for (let i = 0; i < clue.answer.length; i++) {
          const row = clue.direction === 'down' ? clue.row + i : clue.row
          const col = clue.direction === 'across' ? clue.col + i : clue.col
          const cell = result.grid!.cells[row][col]
          expect(cell.type).toBe('cell')
          expect(cell.letter).toBe(clue.answer[i])
        }
      }
    })
  }

  it('only reports success when the placement threshold is genuinely met', () => {
    const result = generate('dup-check')
    const distinctPlaced = new Set(allClues(result).map((clue) => clue.answer)).size
    if (result.success) {
      expect(distinctPlaced).toBeGreaterThanOrEqual(Math.floor(biologyWords.length * 0.9))
    } else {
      expect(result.conflictingWords).toBeDefined()
    }
  })

  it('stays within the generation time budget', () => {
    const start = performance.now()
    generate('perf-budget')
    expect(performance.now() - start).toBeLessThan(2000)
  })
})

describe('deriveListSeed', () => {
  const items = [
    { answer: 'Crossword', clue: 'Type of word puzzle' },
    { answer: 'Words', clue: 'Units of language' },
  ]

  it('is stable regardless of item order', () => {
    const reversed = [...items].reverse()
    expect(deriveListSeed('list1', reversed)).toBe(deriveListSeed('list1', items))
  })

  it('changes when list content changes', () => {
    const edited = [items[0], { answer: 'Words', clue: 'A different clue' }]
    expect(deriveListSeed('list1', edited)).not.toBe(deriveListSeed('list1', items))
  })

  it('changes when the list id changes', () => {
    expect(deriveListSeed('list2', items)).not.toBe(deriveListSeed('list1', items))
  })
})
