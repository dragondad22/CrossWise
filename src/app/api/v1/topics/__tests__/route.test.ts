import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET, POST } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const { topicFindMany, topicCreate } = vi.hoisted(() => ({
  topicFindMany: vi.fn(),
  topicCreate: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findMany: topicFindMany,
      create: topicCreate,
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

describe('/api/v1/topics route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns a list of topics on GET', async () => {
    const topics = [{ id: 't1', name: 'History', _count: { lists: 2 } }]
    topicFindMany.mockResolvedValueOnce(topics)

    const request = new NextRequest('http://localhost/api/v1/topics', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(topicFindMany).toHaveBeenCalled()

    const payload = await response.json()
    expect(payload).toEqual({ success: true, data: topics })
  })

  it('handles database errors on GET', async () => {
    topicFindMany.mockRejectedValueOnce(new Error('db down'))

    const request = new NextRequest('http://localhost/api/v1/topics', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.success).toBe(false)
    expect(payload.error.message).toMatch(/Failed to fetch topics/)
  })

  it('creates a new topic when POST receives valid data', async () => {
    const body = {
      name: 'Science',
      description: 'STEM topics',
      color: '#123456',
      icon: '🔬',
    }
    const created = { id: 'topic-1', ...body, _count: { lists: 0 } }
    topicCreate.mockResolvedValueOnce(created)

    const request = new NextRequest('http://localhost/api/v1/topics', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(topicCreate).toHaveBeenCalledWith({
      data: body,
      include: { _count: { select: { lists: true } } },
    })
    expect(payload.success).toBe(true)
    expect(payload.data).toEqual(created)
  })

  it('returns validation errors from Zod as a 400 response', async () => {
    const invalidBody = { name: '', color: '#123456' }
    const request = new NextRequest('http://localhost/api/v1/topics', {
      method: 'POST',
      body: JSON.stringify(invalidBody),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error.message).toMatch(/Invalid topic data/)
  })

  it('maps unique constraint failures to 409 responses', async () => {
    const body = {
      name: 'Science',
      description: 'STEM topics',
      color: '#123456',
      icon: '🔬',
    }
    const request = new NextRequest('http://localhost/api/v1/topics', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    topicCreate.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`name`)'),
    )

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error.message).toMatch(/already exists/)
  })

  it('handles unexpected errors during topic creation', async () => {
    const body = {
      name: 'Science',
      description: 'STEM topics',
      color: '#123456',
      icon: '🔬',
    }
    const request = new NextRequest('http://localhost/api/v1/topics', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    topicCreate.mockRejectedValueOnce(new Error('network error'))

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error.message).toMatch(/Failed to create topic/)
  })

  it('rejects unauthorized requests', async () => {
    mockSession.mockResolvedValueOnce(null)
    const request = new NextRequest('http://localhost/api/v1/topics')
    const response = await GET(request)
    expect(response.status).toBe(401)
    const payload = await response.json()
    expect(payload.error.message).toMatch(/Authentication required/)
  })
})
