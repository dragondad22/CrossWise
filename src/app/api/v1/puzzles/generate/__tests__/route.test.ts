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
})
