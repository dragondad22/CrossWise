import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import {
  exportListAsJSON,
  exportListAsCSV,
  exportPuzzleState,
  generateFilename,
  parseImportFile,
  downloadFile,
  buildPrintableCrosswordHTML,
  openPrintableCrossword,
} from '../export'
import type { ListWithItemsAndTopic } from '@/types/database'
import type { CrosswordGrid, CrosswordNumbering, SolveState } from '@/types/crossword'

const sampleList = {
  id: 'list-1',
  name: 'Sample List',
  version: 3,
  topicId: 'topic-1',
  source: 'USER',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  userId: 'user-1',
  items: [
    {
      id: 'item-1',
      answer: 'OTTER',
      clue: 'Playful swimmer',
      note: 'Lives in rivers',
      difficulty: 'EASY',
    },
    {
      id: 'item-2',
      answer: 'SEALION',
      clue: 'Barks loudly',
      note: null,
      difficulty: 'HARD',
    },
  ],
  topic: {
    id: 'topic-1',
    name: 'Animals',
    color: '#000000',
    icon: '🐾',
    description: 'Animal themed puzzles',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  },
} as unknown as ListWithItemsAndTopic

describe('export helpers', () => {
  it('exports list data as pretty JSON with normalized difficulty', () => {
    const json = exportListAsJSON(sampleList)
    const parsed = JSON.parse(json)

    expect(parsed.topic).toBe('Animals')
    expect(parsed.items).toHaveLength(2)
    expect(parsed.items[0]).toEqual(
      expect.objectContaining({
        answer: 'OTTER',
        difficulty: 1,
        note: 'Lives in rivers',
      }),
    )
  })

  it('exports list data as CSV escaping quotes where needed', () => {
    const listWithQuotes = {
      ...sampleList,
      items: [
        {
          id: 'item-1',
          answer: 'RAVEN',
          clue: 'Said "Nevermore"',
          note: 'From Poe',
          difficulty: 'MEDIUM',
        },
      ],
    } as unknown as ListWithItemsAndTopic

    const csv = exportListAsCSV(listWithQuotes)
    expect(csv).toContain('"RAVEN"')
    expect(csv).toContain('"Said ""Nevermore"""')
  })

  it('generates sanitized filenames with optional timestamps', () => {
    const name = generateFilename('My Puzzle!', 'json', false)
    expect(name).toBe('My_Puzzle_.json')
  })

  it('exports puzzle state without leaking answer letters', () => {
    const grid: CrosswordGrid = {
      size: { rows: 2, cols: 2 },
      cells: [
        [
          { row: 0, col: 0, type: 'cell', letter: 'A', number: 1 },
          { row: 0, col: 1, type: 'cell', letter: 'B', number: undefined },
        ],
        [
          { row: 1, col: 0, type: 'cell', letter: 'C', number: undefined },
          { row: 1, col: 1, type: 'block' },
        ],
      ],
    }

    const numbering: CrosswordNumbering = {
      across: [{ number: 1, clue: 'First word', row: 0, col: 0, length: 2, answer: 'AB', direction: 'across' }],
      down: [{ number: 1, clue: 'Vertical', row: 0, col: 0, length: 2, answer: 'AC', direction: 'down' }],
    }

    const solveState: SolveState = {
      filledCells: { '0,0': 'A', '0,1': 'B' },
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T10:05:00Z'),
      checkResults: { '0,0': true },
    }

    const exported = exportPuzzleState('puzzle-1', grid, numbering, solveState)
    const parsed = JSON.parse(exported)

    expect(parsed.puzzleId).toBe('puzzle-1')
    expect(parsed.grid.cells[0][0]).not.toHaveProperty('letter')
    expect(parsed.clues.across[0]).toEqual(
      expect.objectContaining({ number: 1, clue: 'First word', length: 2 }),
    )
    expect(parsed.solveState.filledCells['0,1']).toBe('B')
  })

  it('parses JSON imports and normalizes entries', () => {
    const jsonContent = JSON.stringify({
      topic: 'Space',
      name: 'Planets',
      version: 1,
      items: [
        { answer: 'earth', clue: 'Third rock from the sun' },
        { answer: 'mars', clue: 'The red planet' },
      ],
    })

    const parsed = parseImportFile(jsonContent, 'planets.json')

    expect(parsed.format).toBe('json')
    expect(parsed.data.items[0].answer).toBe('EARTH')
  })

  it('parses CSV imports using basic headers', () => {
    const csv = ['answer,clue', 'Mercury,First planet', 'Venus,Second planet'].join('\n')
    const parsed = parseImportFile(csv, 'planets.csv')

    expect(parsed.format).toBe('csv')
    expect(parsed.data.items).toHaveLength(2)
    expect(parsed.data.items[1].answer).toBe('VENUS')
  })

  it('parses CSV rows that contain escaped quotes and commas inside quoted fields', () => {
    const csv = [
      'answer,clue',
      '"New York","Known as the ""Big Apple"""',
      '"LosAngeles","City of Angels, on the west coast"',
    ].join('\n')

    const parsed = parseImportFile(csv, 'cities.csv')

    expect(parsed.data.items[0].clue).toBe('Known as the "Big Apple"')
    expect(parsed.data.items[1].clue).toContain('City of Angels')
  })

  it('throws a descriptive error when CSV content contains no valid rows', () => {
    const csv = ['answer,clue', ','].join('\n')
    expect(() => parseImportFile(csv, 'empty.csv')).toThrow(/No valid items/)
  })

  it('wraps JSON parsing errors with helpful context', () => {
    expect(() => parseImportFile('{"topic":}', 'bad.json')).toThrow(/Invalid JSON/)
  })

  it('throws for unsupported import formats', () => {
    expect(() => parseImportFile('content', 'data.txt')).toThrow(/Unsupported file format/)
  })
})

describe('buildPrintableCrosswordHTML', () => {
  // Contrived answers built from letters (Q, X, Z, J, V) that never appear in
  // the clue texts or list name, so the "no answer letters" assertion is airtight.
  const printableGrid: CrosswordGrid = {
    size: { rows: 3, cols: 3 },
    cells: [
      [
        { row: 0, col: 0, type: 'cell', letter: 'Q', number: 1 },
        { row: 0, col: 1, type: 'cell', letter: 'X', number: 2 },
        { row: 0, col: 2, type: 'block' },
      ],
      [
        { row: 1, col: 0, type: 'cell', letter: 'Z' },
        { row: 1, col: 1, type: 'block' },
        { row: 1, col: 2, type: 'block' },
      ],
      [
        { row: 2, col: 0, type: 'cell', letter: 'J' },
        { row: 2, col: 1, type: 'block' },
        { row: 2, col: 2, type: 'block' },
      ],
    ],
  }

  const printableNumbering: CrosswordNumbering = {
    across: [
      { number: 1, clue: 'First hint here', row: 0, col: 0, length: 2, answer: 'QX', direction: 'across' },
    ],
    down: [
      { number: 1, clue: 'Second hint here', row: 0, col: 0, length: 3, answer: 'QZJ', direction: 'down' },
    ],
  }

  it('renders the heading, numbered cells, and across/down clue lists', () => {
    const html = buildPrintableCrosswordHTML('Marine mammals', printableGrid, printableNumbering)

    expect(html).toContain('Marine mammals')
    expect(html).toContain('Across')
    expect(html).toContain('Down')
    expect(html).toContain('<li value="1">First hint here</li>')
    expect(html).toContain('<li value="1">Second hint here</li>')
    // Start-of-word number rendered in the starting cell
    expect(html).toContain('<span class="num">1</span>')
  })

  it('contains none of the answer letters', () => {
    const html = buildPrintableCrosswordHTML('Marine mammals', printableGrid, printableNumbering)

    // Answers are built exclusively from Q/X/Z/J/V; none may leak into the output.
    expect(html).not.toMatch(/[QXZJV]/)
  })

  it('renders block cells and letter cells differently', () => {
    const html = buildPrintableCrosswordHTML('Marine mammals', printableGrid, printableNumbering)

    const blockCount = (html.match(/<td class="block">/g) ?? []).length
    const cellCount = (html.match(/<td class="cell">/g) ?? []).length

    expect(blockCount).toBe(5)
    expect(cellCount).toBe(4)
    // Block cells never carry a number
    expect(html).not.toContain('<td class="block"><span')
  })

  it('does not crash on a single-word grid with no down clues', () => {
    const singleWordGrid: CrosswordGrid = {
      size: { rows: 1, cols: 2 },
      cells: [
        [
          { row: 0, col: 0, type: 'cell', letter: 'Q', number: 1 },
          { row: 0, col: 1, type: 'cell', letter: 'X' },
        ],
      ],
    }
    const singleNumbering: CrosswordNumbering = {
      across: [
        { number: 1, clue: 'Only word', row: 0, col: 0, length: 2, answer: 'QX', direction: 'across' },
      ],
      down: [],
    }

    const html = buildPrintableCrosswordHTML('Tiny list', singleWordGrid, singleNumbering)

    expect(html).toContain('Only word')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).not.toMatch(/[QXZJV]/)
  })

  it('escapes user-provided markup in the list name and clues', () => {
    const hostileNumbering: CrosswordNumbering = {
      across: [
        {
          number: 1,
          clue: '<script>alert("pwn")</script>',
          row: 0,
          col: 0,
          length: 2,
          answer: 'QX',
          direction: 'across',
        },
      ],
      down: [],
    }

    const html = buildPrintableCrosswordHTML(
      '<img src=y onerror=alert(1)>',
      printableGrid,
      hostileNumbering,
    )

    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('<img src=y')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img src=y onerror=alert(1)&gt;')
  })
})

describe('openPrintableCrossword', () => {
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl
    URL.revokeObjectURL = originalRevokeObjectUrl
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('writes the document into a new window and triggers print', () => {
    const fakeWindow = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    }
    const openSpy = vi.fn(() => fakeWindow)
    vi.stubGlobal('open', openSpy)

    openPrintableCrossword('<html>doc</html>', 'puzzle.html')

    expect(openSpy).toHaveBeenCalledWith('', '_blank')
    expect(fakeWindow.document.write).toHaveBeenCalledWith('<html>doc</html>')
    expect(fakeWindow.print).toHaveBeenCalled()
  })

  it('falls back to downloading the HTML file when the popup is blocked', () => {
    vi.stubGlobal('open', vi.fn(() => null))
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    openPrintableCrossword('<html>doc</html>', 'puzzle.html')

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
  })
})

describe('downloadFile helper', () => {
  const originalCreateObjectUrl = URL.createObjectURL
  const originalRevokeObjectUrl = URL.revokeObjectURL

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl
    URL.revokeObjectURL = originalRevokeObjectUrl
    vi.restoreAllMocks()
  })

  it('creates a temporary anchor element and triggers a download', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild')
    const removeSpy = vi.spyOn(document.body, 'removeChild')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadFile('example', 'test.txt', 'text/plain')

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
