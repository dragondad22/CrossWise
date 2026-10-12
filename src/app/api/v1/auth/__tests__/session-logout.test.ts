// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET as getSession } from '../session/route'
import { POST as logout } from '../logout/route'
import { AuthUnavailableError } from '@/lib/auth'

const { lookupSession, signOutOfAccounts } = vi.hoisted(() => ({
  lookupSession: vi.fn(),
  signOutOfAccounts: vi.fn(),
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return { ...actual, lookupSession, signOutOfAccounts }
})

const COOKIE = 'alpaca.session_token=abc'

describe('GET /api/v1/auth/session', () => {
  beforeEach(() => lookupSession.mockReset())

  it('returns the user and passes the refreshed cookie to the browser', async () => {
    lookupSession.mockResolvedValueOnce({
      user: { id: 'u1', email: 'a@b.c', name: null },
      setCookies: ['alpaca.session_token=new; Domain=buildyouralpaca.com'],
    })
    const response = await getSession(
      new NextRequest('http://localhost/api/v1/auth/session', { headers: { cookie: COOKIE } }),
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { user: { id: 'u1', email: 'a@b.c', name: null } },
    })
    expect(response.headers.getSetCookie()).toEqual([
      'alpaca.session_token=new; Domain=buildyouralpaca.com',
    ])
  })

  it('returns a null user when signed out', async () => {
    lookupSession.mockResolvedValueOnce({ user: null, setCookies: [] })
    const response = await getSession(new NextRequest('http://localhost/api/v1/auth/session'))
    await expect(response.json()).resolves.toEqual({ success: true, data: { user: null } })
  })

  it('answers 503 when the accounts service is down, so the client does not sign out', async () => {
    lookupSession.mockRejectedValueOnce(new AuthUnavailableError('down'))
    const response = await getSession(
      new NextRequest('http://localhost/api/v1/auth/session', { headers: { cookie: COOKIE } }),
    )
    expect(response.status).toBe(503)
  })
})

describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => signOutOfAccounts.mockReset())

  it('signs out of the shared account and clears its cookie', async () => {
    signOutOfAccounts.mockResolvedValueOnce(['alpaca.session_token=; Max-Age=0'])
    const response = await logout(
      new NextRequest('http://localhost/api/v1/auth/logout', {
        method: 'POST',
        headers: { cookie: COOKIE },
      }),
    )
    expect(response.status).toBe(200)
    expect(signOutOfAccounts).toHaveBeenCalledWith(COOKIE)
    expect(response.headers.getSetCookie()).toEqual(['alpaca.session_token=; Max-Age=0'])
  })

  it('answers 503 when the accounts service is down', async () => {
    signOutOfAccounts.mockRejectedValueOnce(new AuthUnavailableError('down'))
    const response = await logout(
      new NextRequest('http://localhost/api/v1/auth/logout', { method: 'POST' }),
    )
    expect(response.status).toBe(503)
  })
})
