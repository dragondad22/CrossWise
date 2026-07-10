import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const { topicFindFirst } = vi.hoisted(() => ({
  topicFindFirst: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findFirst: topicFindFirst,
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

describe('/api/v1/topics/:id GET handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns the topic when owned by the authenticated user', async () => {
    topicFindFirst.mockResolvedValueOnce({ id: 'topic-1', name: 'History', lists: [] })

    const request = new NextRequest('http://localhost/api/v1/topics/topic-1', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request, { params: Promise.resolve({ id: 'topic-1' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.id).toBe('topic-1')
  })

  it('returns 404 and scopes the lookup by owner for another user’s topic', async () => {
    topicFindFirst.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/v1/topics/other-users-topic', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request, {
      params: Promise.resolve({ id: 'other-users-topic' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.message).toMatch(/Topic not found/)
    expect(topicFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'other-users-topic', userId: 'user-1' },
      }),
    )
  })

  it('rejects unauthenticated requests', async () => {
    mockSession.mockResolvedValueOnce(null)
    const request = new NextRequest('http://localhost/api/v1/topics/topic-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'topic-1' }) })
    expect(response.status).toBe(401)
  })
})
