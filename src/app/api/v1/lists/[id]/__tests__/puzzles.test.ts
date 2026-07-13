import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '../puzzles/route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const { puzzleFindMany } = vi.hoisted(() => ({
  puzzleFindMany: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    puzzle: {
      findMany: puzzleFindMany,
    },
  },
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    getSessionForToken: mockSession,
  }
})

describe('/api/v1/lists/:id/puzzles auth enforcement (printable export data path, #2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns 401 for unauthenticated requests', async () => {
    mockSession.mockResolvedValueOnce(null)
    const request = new NextRequest('http://localhost/api/v1/lists/clist123/puzzles')

    const response = await GET(request, { params: Promise.resolve({ id: 'clist123' }) })

    expect(response.status).toBe(401)
    expect(puzzleFindMany).not.toHaveBeenCalled()
  })

  it('scopes the lookup by owner so another user’s list yields no puzzles', async () => {
    puzzleFindMany.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost/api/v1/lists/other-users-list/puzzles', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request, {
      params: Promise.resolve({ id: 'other-users-list' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data).toEqual([])
    expect(puzzleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { listId: 'other-users-list', list: { topic: { userId: 'user-1' } } },
      }),
    )
  })

  it('returns puzzles newest-first so the client can pick the most recent', async () => {
    const puzzles = [
      { id: 'p-new', createdAt: '2026-07-02T00:00:00Z' },
      { id: 'p-old', createdAt: '2026-07-01T00:00:00Z' },
    ]
    puzzleFindMany.mockResolvedValueOnce(puzzles)

    const request = new NextRequest('http://localhost/api/v1/lists/clist123/puzzles', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request, { params: Promise.resolve({ id: 'clist123' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data[0].id).toBe('p-new')
    expect(puzzleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    )
  })
})
