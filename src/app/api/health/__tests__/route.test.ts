// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '../route'

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('@/lib/db', () => ({ prisma: { $queryRaw: queryRaw } }))

describe('GET /api/health (#139)', () => {
  beforeEach(() => queryRaw.mockReset())

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
})
