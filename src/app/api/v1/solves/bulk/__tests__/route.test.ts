import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const solveUpdateMany = vi.hoisted(() => vi.fn())
const solveDeleteMany = vi.hoisted(() => vi.fn())
const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    solve: {
      updateMany: solveUpdateMany,
      deleteMany: solveDeleteMany,
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

describe('/api/v1/solves/bulk POST', () => {
  const url = 'http://localhost/api/v1/solves/bulk'
  const buildHeaders = () =>
    new Headers({
      cookie: `${SESSION_COOKIE_NAME}=token-123`,
      'content-type': 'application/json',
    })
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('resets solves for the authenticated user', async () => {
    const request = new NextRequest(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action: 'reset', solveIds: ['s1', 's2'] }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ success: true })
    expect(solveUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['s1', 's2'] }, userId: 'user-1' },
      data: { state: '{}', completedAt: null },
    })
    expect(solveDeleteMany).not.toHaveBeenCalled()
  })

  it('deletes solves when the delete action is requested', async () => {
    const request = new NextRequest(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action: 'delete', solveIds: ['s1'] }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(solveDeleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['s1'] }, userId: 'user-1' },
    })
    expect(solveUpdateMany).not.toHaveBeenCalled()
  })

  it('rejects requests without valid authentication', async () => {
    mockSession.mockResolvedValueOnce(null)
    const request = new NextRequest(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action: 'reset', solveIds: ['s1'] }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error.message).toMatch(/Authentication required/)
    expect(solveUpdateMany).not.toHaveBeenCalled()
  })

  it('returns 400 when the payload is invalid', async () => {
    const request = new NextRequest(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action: 'reset', solveIds: [] }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.message).toMatch(/At least one puzzle/)
  })

  it('maps unexpected errors to 500 responses', async () => {
    solveDeleteMany.mockRejectedValueOnce(new Error('db down'))
    const request = new NextRequest(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ action: 'delete', solveIds: ['s1'] }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error.message).toMatch(/Failed to process request/)
  })
})
