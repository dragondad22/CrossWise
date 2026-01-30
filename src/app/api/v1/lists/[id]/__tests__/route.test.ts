import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { DELETE } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const { listFindUnique, listDelete } = vi.hoisted(() => ({
  listFindUnique: vi.fn(),
  listDelete: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    list: {
      findUnique: listFindUnique,
      delete: listDelete,
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

describe('/api/v1/lists/:id DELETE handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('deletes a list and returns puzzle ids', async () => {
    listFindUnique.mockResolvedValueOnce({
      id: 'list-1',
      puzzles: [{ id: 'puzzle-1' }, { id: 'puzzle-2' }],
    })
    listDelete.mockResolvedValueOnce({ id: 'list-1' })

    const request = new NextRequest('http://localhost/api/v1/lists/list-1', {
      method: 'DELETE',
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'list-1' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(listFindUnique).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      select: { id: true, puzzles: { select: { id: true } } },
    })
    expect(listDelete).toHaveBeenCalledWith({ where: { id: 'list-1' } })
    expect(payload.data).toEqual({ listId: 'list-1', puzzleIds: ['puzzle-1', 'puzzle-2'] })
  })

  it('returns 404 when list is missing', async () => {
    listFindUnique.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/v1/lists/missing', {
      method: 'DELETE',
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'missing' }) })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.message).toMatch(/List not found/)
    expect(listDelete).not.toHaveBeenCalled()
  })

  it('rejects DELETE requests without authentication', async () => {
    mockSession.mockResolvedValueOnce(null)
    const request = new NextRequest('http://localhost/api/v1/lists/list-1', { method: 'DELETE' })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'list-1' }) })
    expect(response.status).toBe(401)
  })

  it('handles delete failures gracefully', async () => {
    listFindUnique.mockResolvedValueOnce({
      id: 'list-1',
      puzzles: [],
    })
    listDelete.mockRejectedValueOnce(new Error('db down'))

    const request = new NextRequest('http://localhost/api/v1/lists/list-1', {
      method: 'DELETE',
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await DELETE(request, { params: Promise.resolve({ id: 'list-1' }) })
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error.message).toMatch(/Failed to delete list/)
  })
})
