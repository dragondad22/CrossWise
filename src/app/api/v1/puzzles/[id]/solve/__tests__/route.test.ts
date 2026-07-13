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

  describe('recency guard (#84, ADR-007)', () => {
    const solveRequest = (state: object) =>
      new NextRequest(`http://localhost/api/v1/puzzles/${PUZZLE_ID}/solve`, {
        method: 'POST',
        body: JSON.stringify({ puzzleId: PUZZLE_ID, state: JSON.stringify(state) }),
        headers: {
          'content-type': 'application/json',
          cookie: `${SESSION_COOKIE_NAME}=token-123`,
        },
      })

    beforeEach(() => {
      puzzleFindFirst.mockResolvedValue({ id: PUZZLE_ID })
      solveUpdate.mockResolvedValue({ id: 'solve-1', completedAt: null })
      solveCreate.mockResolvedValue({ id: 'solve-1', completedAt: null })
    })

    it('rejects a stale revision with 409 and writes nothing', async () => {
      solveFindUnique.mockResolvedValueOnce({
        id: 'solve-1',
        completedAt: null,
        state: JSON.stringify({ filledCells: {}, revision: 5 }),
      })

      const response = await POST(solveRequest({ filledCells: { '0,0': 'A' }, revision: 4 }), {
        params: Promise.resolve({ id: PUZZLE_ID }),
      })
      const payload = await response.json()

      expect(response.status).toBe(409)
      expect(payload.error.code).toBe('STALE_WRITE')
      expect(solveUpdate).not.toHaveBeenCalled()
      expect(solveCreate).not.toHaveBeenCalled()
    })

    it('accepts a newer revision', async () => {
      solveFindUnique.mockResolvedValueOnce({
        id: 'solve-1',
        completedAt: null,
        state: JSON.stringify({ filledCells: {}, revision: 5 }),
      })

      const response = await POST(solveRequest({ filledCells: { '0,0': 'A' }, revision: 6 }), {
        params: Promise.resolve({ id: PUZZLE_ID }),
      })

      expect(response.status).toBe(200)
      expect(solveUpdate).toHaveBeenCalledTimes(1)
    })

    it('falls back to lastSaved for legacy states without revisions', async () => {
      solveFindUnique.mockResolvedValueOnce({
        id: 'solve-1',
        completedAt: null,
        state: JSON.stringify({ filledCells: {}, lastSaved: '2026-07-13T12:00:00Z' }),
      })

      const stale = await POST(
        solveRequest({ filledCells: {}, lastSaved: '2026-07-13T11:00:00Z' }),
        { params: Promise.resolve({ id: PUZZLE_ID }) },
      )
      expect(stale.status).toBe(409)
      expect(solveUpdate).not.toHaveBeenCalled()

      solveFindUnique.mockResolvedValueOnce({
        id: 'solve-1',
        completedAt: null,
        state: JSON.stringify({ filledCells: {}, lastSaved: '2026-07-13T12:00:00Z' }),
      })
      const fresh = await POST(
        solveRequest({ filledCells: {}, lastSaved: '2026-07-13T13:00:00Z' }),
        { params: Promise.resolve({ id: PUZZLE_ID }) },
      )
      expect(fresh.status).toBe(200)
    })

    it('accepts writes when no prior solve exists', async () => {
      solveFindUnique.mockResolvedValueOnce(null)

      const response = await POST(solveRequest({ filledCells: {}, revision: 1 }), {
        params: Promise.resolve({ id: PUZZLE_ID }),
      })

      expect(response.status).toBe(200)
      expect(solveCreate).toHaveBeenCalledTimes(1)
    })

    it('accepts writes when stored state is unparseable', async () => {
      solveFindUnique.mockResolvedValueOnce({
        id: 'solve-1',
        completedAt: null,
        state: 'not-json',
      })

      const response = await POST(solveRequest({ filledCells: {}, revision: 1 }), {
        params: Promise.resolve({ id: PUZZLE_ID }),
      })

      expect(response.status).toBe(200)
    })
  })
})
