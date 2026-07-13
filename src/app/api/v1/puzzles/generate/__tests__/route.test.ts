import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../route'
import { deriveListSeed } from '@/lib/crossword-generator'

vi.mock('@/lib/db', () => ({
  prisma: {
    list: { findFirst: vi.fn() },
    puzzle: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  SESSION_COOKIE_NAME: 'crosswise_session',
  getSessionForToken: vi.fn(),
}))

import { prisma } from '@/lib/db'
import { getSessionForToken } from '@/lib/auth'

const LIST_ID = 'clist0000000000000000001'

// Two intersecting words place successfully regardless of seed, keeping these
// tests about the seed contract rather than placement strength.
const listItems = [
  { answer: 'Cat', clue: 'Feline friend' },
  { answer: 'Car', clue: 'Road vehicle' },
]

function makeRequest(body: Record<string, unknown>, { authenticated = true } = {}) {
  return new NextRequest('http://localhost/api/v1/puzzles/generate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: authenticated ? { cookie: 'crosswise_session=test-token' } : {},
  })
}

describe('POST /api/v1/puzzles/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSessionForToken).mockResolvedValue({
      user: { id: 'user1' },
    } as Awaited<ReturnType<typeof getSessionForToken>>)
    vi.mocked(prisma.list.findFirst).mockResolvedValue({
      id: LIST_ID,
      items: listItems,
    } as Awaited<ReturnType<typeof prisma.list.findFirst>>)
    vi.mocked(prisma.puzzle.create).mockImplementation(
      (async ({ data }: { data: { seed: string } }) => ({ id: 'puzzle1', ...data })) as never,
    )
  })

  it('returns identical puzzles for two calls with the same seed', async () => {
    const body = { listId: LIST_ID, seed: 'fixed-seed' }
    const first = await (await POST(makeRequest(body))).json()
    const second = await (await POST(makeRequest(body))).json()

    expect(first.success).toBe(true)
    expect(second.data.grid).toEqual(first.data.grid)
    expect(second.data.numbering).toEqual(first.data.numbering)
    expect(second.data.seed).toBe('fixed-seed')
  })

  it('uses a stable content-derived seed when the client omits one', async () => {
    const first = await (await POST(makeRequest({ listId: LIST_ID }))).json()
    const second = await (await POST(makeRequest({ listId: LIST_ID }))).json()

    expect(first.data.seed).toBe(deriveListSeed(LIST_ID, listItems))
    expect(second.data.seed).toBe(first.data.seed)
    expect(second.data.grid).toEqual(first.data.grid)
  })

  it('persists the same seed it generated with', async () => {
    await (await POST(makeRequest({ listId: LIST_ID }))).json()

    expect(vi.mocked(prisma.puzzle.create).mock.calls[0][0].data.seed).toBe(
      deriveListSeed(LIST_ID, listItems),
    )
  })

  it('rejects unauthenticated requests', async () => {
    const response = await POST(makeRequest({ listId: LIST_ID }, { authenticated: false }))
    expect(response.status).toBe(401)
  })

  it("returns 404 for a list the user doesn't own", async () => {
    vi.mocked(prisma.list.findFirst).mockResolvedValue(null)
    const response = await POST(makeRequest({ listId: LIST_ID }))
    expect(response.status).toBe(404)
  })

  describe('word count (#22)', () => {
    const vocab = [
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
      'BACTERIA',
    ].map((answer, i) => ({ answer, clue: `Term ${i + 1}` }))

    beforeEach(() => {
      vi.mocked(prisma.list.findFirst).mockResolvedValue({
        id: LIST_ID,
        items: vocab,
      } as Awaited<ReturnType<typeof prisma.list.findFirst>>)
    })

    it('uses at most the requested number of words and persists the resolved count', async () => {
      const response = await POST(
        makeRequest({ listId: LIST_ID, seed: 'count-seed', wordCount: 6 }),
      )
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.totalWords).toBe(6)
      expect(result.data.placedWords).toBeLessThanOrEqual(6)

      const settings = JSON.parse(
        vi.mocked(prisma.puzzle.create).mock.calls[0][0].data.settings as string,
      )
      expect(settings.wordCount).toBe(6)
    })

    it('is deterministic for the same {listId, seed, wordCount}', async () => {
      const body = { listId: LIST_ID, seed: 'count-det', wordCount: 6 }
      const first = await (await POST(makeRequest(body))).json()
      const second = await (await POST(makeRequest(body))).json()

      expect(second.data.grid).toEqual(first.data.grid)
      expect(second.data.numbering).toEqual(first.data.numbering)
    })

    it('uses all items without error when the requested count exceeds the list size', async () => {
      const response = await POST(
        makeRequest({ listId: LIST_ID, seed: 's', wordCount: 100 }),
      )
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.totalWords).toBe(vocab.length)
      const settings = JSON.parse(
        vi.mocked(prisma.puzzle.create).mock.calls[0][0].data.settings as string,
      )
      expect(settings.wordCount).toBe(vocab.length)
    })

    it('rejects an out-of-range word count with 400 before touching generation', async () => {
      const low = await POST(makeRequest({ listId: LIST_ID, wordCount: 2 }))
      expect(low.status).toBe(400)
      const high = await POST(makeRequest({ listId: LIST_ID, wordCount: 151 }))
      expect(high.status).toBe(400)
      expect(vi.mocked(prisma.puzzle.create)).not.toHaveBeenCalled()
    })
  })

  describe('partial acceptance (#99)', () => {
    // Realistic vocab: enough words that a 15x15 grid cannot fit them all, so the
    // route must either grow the grid or accept a partial puzzle — never fail.
    const bigList = [
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
    ].map((answer, i) => ({ answer, clue: `Term ${i + 1}` }))

    it('accepts a realistic 24-word list instead of failing, disclosing any unplaced words', async () => {
      vi.mocked(prisma.list.findFirst).mockResolvedValue({
        id: LIST_ID,
        items: bigList,
      } as Awaited<ReturnType<typeof prisma.list.findFirst>>)

      const response = await POST(makeRequest({ listId: LIST_ID, seed: 'classroom' }))
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.placedWords).toBeGreaterThanOrEqual(2)
      expect(result.data.placedWords + result.data.unplacedWords.length).toBe(bigList.length)

      // The unplaced list is persisted so the solve UI can disclose it on reload.
      const settings = JSON.parse(
        vi.mocked(prisma.puzzle.create).mock.calls[0][0].data.settings as string,
      )
      expect(settings.unplacedWords).toEqual(result.data.unplacedWords)
    })

    it('is deterministic across the grid-size ladder', async () => {
      vi.mocked(prisma.list.findFirst).mockResolvedValue({
        id: LIST_ID,
        items: bigList,
      } as Awaited<ReturnType<typeof prisma.list.findFirst>>)

      const body = { listId: LIST_ID, seed: 'ladder-seed' }
      const first = await (await POST(makeRequest(body))).json()
      const second = await (await POST(makeRequest(body))).json()

      expect(second.data.grid).toEqual(first.data.grid)
      expect(second.data.numbering).toEqual(first.data.numbering)
      expect(second.data.unplacedWords).toEqual(first.data.unplacedWords)
    })

    it('honours an explicitly requested grid size without laddering', async () => {
      vi.mocked(prisma.list.findFirst).mockResolvedValue({
        id: LIST_ID,
        items: bigList,
      } as Awaited<ReturnType<typeof prisma.list.findFirst>>)

      const response = await POST(
        makeRequest({ listId: LIST_ID, seed: 's', gridSize: { rows: 15, cols: 15 } }),
      )
      const result = await response.json()

      expect(result.success).toBe(true)
      const settings = JSON.parse(
        vi.mocked(prisma.puzzle.create).mock.calls[0][0].data.settings as string,
      )
      expect(settings.gridSize).toEqual({ rows: 15, cols: 15 })
      expect(result.data.grid.size).toEqual({ rows: 15, cols: 15 })
    })

    it('still fails with the unplaced list when fewer than two words can cross', async () => {
      vi.mocked(prisma.list.findFirst).mockResolvedValue({
        id: LIST_ID,
        // No shared letters: at most one word can ever be placed.
        items: [
          { answer: 'AAA', clue: 'First' },
          { answer: 'BBB', clue: 'Second' },
        ],
      } as Awaited<ReturnType<typeof prisma.list.findFirst>>)

      const response = await POST(makeRequest({ listId: LIST_ID, seed: 'no-crossings' }))
      const result = await response.json()

      expect(response.status).toBe(422)
      expect(result.success).toBe(false)
      expect(result.error.details.unplacedWords.length).toBeGreaterThan(0)
      expect(vi.mocked(prisma.puzzle.create)).not.toHaveBeenCalled()
    })
  })
})
