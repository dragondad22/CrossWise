// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireSession } from '../api-auth'
import { AuthUnavailableError } from '../auth'

const lookupSession = vi.hoisted(() => vi.fn())

vi.mock('../auth', async () => {
  const actual = await vi.importActual<typeof import('../auth')>('../auth')
  return { ...actual, lookupSession }
})

const request = (cookie?: string) =>
  new Request('http://localhost/api/v1/topics', { headers: cookie ? { cookie } : {} })

describe('requireSession', () => {
  beforeEach(() => {
    lookupSession.mockReset()
  })

  it('returns the signed-in user', async () => {
    lookupSession.mockResolvedValueOnce({ user: { id: 'u1', email: 'a@b.c' }, setCookies: [] })
    const result = await requireSession(request('alpaca.session_token=abc'))
    expect(result.response).toBeUndefined()
    expect(result.user).toEqual({ id: 'u1', email: 'a@b.c' })
    expect(lookupSession).toHaveBeenCalledWith('alpaca.session_token=abc')
  })

  it('answers 401 when signed out', async () => {
    lookupSession.mockResolvedValueOnce({ user: null, setCookies: [] })
    const result = await requireSession(request())
    expect(result.response?.status).toBe(401)
    await expect(result.response?.json()).resolves.toEqual({
      success: false,
      error: { message: 'Authentication required' },
    })
  })

  it('answers 503, not 401, when the accounts service is down', async () => {
    lookupSession.mockRejectedValueOnce(new AuthUnavailableError('down'))
    const result = await requireSession(request('alpaca.session_token=abc'))
    expect(result.response?.status).toBe(503)
    expect(result.response?.headers.get('retry-after')).toBe('30')
  })

  it('lets other failures reach the route error handling', async () => {
    lookupSession.mockRejectedValueOnce(new Error('db down'))
    await expect(requireSession(request('alpaca.session_token=abc'))).rejects.toThrow('db down')
  })
})
