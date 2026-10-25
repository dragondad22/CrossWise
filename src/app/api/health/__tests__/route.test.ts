// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '../route'
import { resetHealthCheck } from '@/lib/health'

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('@/lib/db', () => ({ prisma: { $queryRaw: queryRaw } }))

describe('GET /api/health (#139)', () => {
  beforeEach(() => {
    queryRaw.mockReset()
    resetHealthCheck()
  })
  afterEach(() => vi.useRealTimers())

  it('answers 200 when the database answers', async () => {
    queryRaw.mockResolvedValueOnce([{ '?column?': 1 }])
    const response = await GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('answers 503 when the database is unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    queryRaw.mockRejectedValueOnce(new Error('connection refused'))
    const response = await GET()
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ ok: false })
  })

  it('asks the database at most once every 10 seconds', async () => {
    vi.useFakeTimers()
    queryRaw.mockResolvedValue([{ '?column?': 1 }])
    await Promise.all([GET(), GET(), GET()])
    expect(queryRaw).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(10_001)
    await GET()
    expect(queryRaw).toHaveBeenCalledTimes(2)
  })
})
