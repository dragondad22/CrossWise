import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '../export/route'

const { listFindFirst } = vi.hoisted(() => ({
  listFindFirst: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    list: {
      findFirst: listFindFirst,
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

describe('/api/v1/lists/:id/export auth enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockImplementation(async (cookie: string | null) => ({
      user: cookie ? { id: 'user-1', email: 'user-1@example.com' } : null,
      setCookies: [],
    }))
  })

  it('returns 401 for unauthenticated requests', async () => {
    mockSession.mockResolvedValueOnce({ user: null, setCookies: [] })
    const request = new NextRequest('http://localhost/api/v1/lists/clist123/export')

    const response = await GET(request, { params: Promise.resolve({ id: 'clist123' }) })
    expect(response.status).toBe(401)
  })

  it('returns 404 and scopes the lookup by owner for another user’s list', async () => {
    listFindFirst.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/v1/lists/other-users-list/export', {
      headers: { cookie: `alpaca.session_token=token-123` },
    })
    const response = await GET(request, {
      params: Promise.resolve({ id: 'other-users-list' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.message).toMatch(/List not found/)
    expect(listFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'other-users-list', topic: { userId: 'user-1' } },
      }),
    )
  })
})
