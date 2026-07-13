import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { DELETE, GET } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const { topicFindFirst, topicDelete } = vi.hoisted(() => ({
  topicFindFirst: vi.fn(),
  topicDelete: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findFirst: topicFindFirst,
      delete: topicDelete,
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

describe('/api/v1/topics/:id DELETE handler (#15)', () => {
  const deleteRequest = (cookie = `${SESSION_COOKIE_NAME}=token-123`) =>
    new NextRequest('http://localhost/api/v1/topics/topic-1', {
      method: 'DELETE',
      headers: cookie ? { cookie } : {},
    })

  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('deletes an owned topic and returns the affected list and puzzle ids', async () => {
    topicFindFirst.mockResolvedValueOnce({
      id: 'topic-1',
      userId: 'user-1',
      lists: [
        { id: 'list-1', puzzles: [{ id: 'puzzle-1' }, { id: 'puzzle-2' }] },
        { id: 'list-2', puzzles: [] },
      ],
    })
    topicDelete.mockResolvedValueOnce({ id: 'topic-1' })

    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: 'topic-1' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data).toEqual({
      topicId: 'topic-1',
      listIds: ['list-1', 'list-2'],
      puzzleIds: ['puzzle-1', 'puzzle-2'],
    })
    // Cascade handles children; the route deletes only the topic row.
    expect(topicDelete).toHaveBeenCalledWith({ where: { id: 'topic-1' } })
  })

  it("scopes the delete by owner: another user's topic returns 404 and deletes nothing", async () => {
    topicFindFirst.mockResolvedValueOnce(null)

    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: 'topic-1' }),
    })

    expect(response.status).toBe(404)
    expect(topicFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'topic-1', userId: 'user-1' },
      }),
    )
    expect(topicDelete).not.toHaveBeenCalled()
  })

  it('returns 404 for a missing topic', async () => {
    topicFindFirst.mockResolvedValueOnce(null)

    const response = await DELETE(deleteRequest(), {
      params: Promise.resolve({ id: 'missing' }),
    })

    expect(response.status).toBe(404)
  })

  it('rejects unauthenticated requests without deleting', async () => {
    mockSession.mockResolvedValueOnce(null)

    const response = await DELETE(deleteRequest(''), {
      params: Promise.resolve({ id: 'topic-1' }),
    })

    expect(response.status).toBe(401)
    expect(topicDelete).not.toHaveBeenCalled()
  })
})
