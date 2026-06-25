import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const { puzzleFindFirst, solveFindUnique, solveCreate, solveUpdate } = vi.hoisted(() => ({
  puzzleFindFirst: vi.fn(),
  solveFindUnique: vi.fn(),
  solveCreate: vi.fn(),
  solveUpdate: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    puzzle: {
      findFirst: puzzleFindFirst,
    },
    solve: {
      findUnique: solveFindUnique,
      create: solveCreate,
      update: solveUpdate,
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

const PUZZLE_ID = 'cpuzzle12345678901234567'

describe('/api/v1/puzzles/:id/solve POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('returns 404 and scopes the lookup by owner for another user’s puzzle', async () => {
    puzzleFindFirst.mockResolvedValueOnce(null)

    const request = new NextRequest(`http://localhost/api/v1/puzzles/${PUZZLE_ID}/solve`, {
      method: 'POST',
      body: JSON.stringify({ puzzleId: PUZZLE_ID, state: '{}' }),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    const response = await POST(request, { params: Promise.resolve({ id: PUZZLE_ID }) })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.message).toMatch(/Puzzle not found/)
    expect(puzzleFindFirst).toHaveBeenCalledWith({
      where: { id: PUZZLE_ID, list: { topic: { userId: 'user-1' } } },
    })
    expect(solveCreate).not.toHaveBeenCalled()
    expect(solveUpdate).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated requests', async () => {
    const request = new NextRequest(`http://localhost/api/v1/puzzles/${PUZZLE_ID}/solve`, {
      method: 'POST',
      body: JSON.stringify({ puzzleId: PUZZLE_ID, state: '{}' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request, { params: Promise.resolve({ id: PUZZLE_ID }) })
    expect(response.status).toBe(401)
  })
})
