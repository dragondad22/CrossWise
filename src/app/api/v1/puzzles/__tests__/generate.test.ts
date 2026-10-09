import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../generate/route'

const { listFindFirst, puzzleCreate } = vi.hoisted(() => ({
  listFindFirst: vi.fn(),
  puzzleCreate: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    list: {
      findFirst: listFindFirst,
    },
    puzzle: {
      create: puzzleCreate,
    },
  },
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    lookupSession: mockSession,
  }
})

describe('/api/v1/puzzles/generate auth enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockImplementation(async (cookie: string | null) => ({
      user: cookie ? { id: 'user-1', email: 'user-1@example.com' } : null,
      setCookies: [],
    }))
  })

  it('returns 401 when no session cookie is present', async () => {
    mockSession.mockResolvedValueOnce({ user: null, setCookies: [] })
    const request = new NextRequest('http://localhost/api/v1/puzzles/generate', {
      method: 'POST',
      body: JSON.stringify({ listId: 'clist1234567890123456789' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 404 and scopes the lookup by owner for another user’s list', async () => {
    listFindFirst.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/v1/puzzles/generate', {
      method: 'POST',
      body: JSON.stringify({ listId: 'clist1234567890123456789' }),
      headers: { 'content-type': 'application/json', cookie: `alpaca.session_token=token-123` },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.message).toMatch(/List not found/)
    expect(listFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'clist1234567890123456789', topic: { userId: 'user-1' } },
      }),
    )
    expect(puzzleCreate).not.toHaveBeenCalled()
  })
})
