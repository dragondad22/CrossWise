// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  __resetKnownUsers,
  accountsCookies,
  AuthUnavailableError,
  lookupSession,
  signOutOfAccounts,
} from '../auth'

const prismaMocks = vi.hoisted(() => ({
  user: { upsert: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
}))

vi.mock('../db', () => ({ prisma: prismaMocks }))

const fetchMock = vi.fn()

function accountsReply(body: unknown, init: { status?: number; setCookies?: string[] } = {}) {
  const headers = new Headers({ 'content-type': 'application/json' })
  for (const cookie of init.setCookies ?? []) headers.append('set-cookie', cookie)
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers })
}

const SIGNED_IN = {
  user: { id: 'user-1', email: 'ada@example.com', name: 'Ada', emailVerified: true },
  session: { id: 's1' },
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  prismaMocks.user.upsert.mockReset().mockResolvedValue({})
  prismaMocks.user.findUnique.mockReset().mockResolvedValue(null)
  prismaMocks.user.updateMany.mockReset().mockResolvedValue({ count: 1 })
  __resetKnownUsers()
  delete process.env.ACCOUNTS_URL
  delete process.env.APP_URL
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('accountsCookies', () => {
  it('keeps only the accounts service cookies', () => {
    expect(
      accountsCookies(
        'theme=dark; __Secure-alpaca.session_token=abc.sig; other=1; alpaca.session_data=xyz',
      ),
    ).toBe('__Secure-alpaca.session_token=abc.sig; alpaca.session_data=xyz')
  })

  it('returns nothing for missing or unrelated cookies', () => {
    expect(accountsCookies(null)).toBe('')
    expect(accountsCookies('crosswise_session=old; malpaca.session_token=x')).toBe('')
  })
})

describe('lookupSession', () => {
  it('treats a request without an accounts cookie as signed out without calling the service', async () => {
    await expect(lookupSession('crosswise_session=old')).resolves.toEqual({
      user: null,
      setCookies: [],
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks the accounts service, forwarding only its cookies', async () => {
    fetchMock.mockResolvedValueOnce(accountsReply(SIGNED_IN))

    const result = await lookupSession('theme=dark; alpaca.session_token=abc')

    expect(result.user).toEqual({ id: 'user-1', email: 'ada@example.com', name: 'Ada' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://accounts.buildyouralpaca.com/api/auth/get-session')
    expect(init.headers).toMatchObject({ cookie: 'alpaca.session_token=abc' })
  })

  it('uses ACCOUNTS_URL when set', async () => {
    process.env.ACCOUNTS_URL = 'http://localhost:3100'
    fetchMock.mockResolvedValueOnce(accountsReply(null))
    await lookupSession('alpaca.session_token=abc')
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3100/api/auth/get-session')
  })

  it('returns null when the cookie no longer has a session', async () => {
    fetchMock.mockResolvedValueOnce(accountsReply(null))
    const result = await lookupSession('alpaca.session_token=expired')
    expect(result.user).toBeNull()
    expect(prismaMocks.user.upsert).not.toHaveBeenCalled()
  })

  it('passes refreshed session cookies through', async () => {
    fetchMock.mockResolvedValueOnce(
      accountsReply(SIGNED_IN, { setCookies: ['alpaca.session_token=new; Domain=example.com'] }),
    )
    const result = await lookupSession('alpaca.session_token=abc')
    expect(result.setCookies).toEqual(['alpaca.session_token=new; Domain=example.com'])
  })

  it('creates the local user row once, and again only when details change', async () => {
    fetchMock.mockImplementation(async () => accountsReply(SIGNED_IN))

    await lookupSession('alpaca.session_token=abc')
    await lookupSession('alpaca.session_token=abc')
    expect(prismaMocks.user.upsert).toHaveBeenCalledTimes(1)
    expect(prismaMocks.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      create: { id: 'user-1', email: 'ada@example.com', name: 'Ada' },
      update: { email: 'ada@example.com', name: 'Ada' },
    })

    fetchMock.mockImplementation(async () =>
      accountsReply({ ...SIGNED_IN, user: { ...SIGNED_IN.user, name: 'Ada L' } }),
    )
    await lookupSession('alpaca.session_token=abc')
    expect(prismaMocks.user.upsert).toHaveBeenCalledTimes(2)
  })

  describe('a CrossWise account from before shared sign-in (#134)', () => {
    beforeEach(() => {
      vi.spyOn(console, 'info').mockImplementation(() => {})
      prismaMocks.user.findUnique.mockResolvedValue({ id: 'old-cuid' })
    })

    it('moves the old row onto the accounts id when the email is verified', async () => {
      fetchMock.mockResolvedValueOnce(accountsReply(SIGNED_IN))

      const result = await lookupSession('alpaca.session_token=abc')

      expect(result.user?.id).toBe('user-1')
      expect(prismaMocks.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        select: { id: true },
      })
      expect(prismaMocks.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'old-cuid' },
        data: { id: 'user-1' },
      })
      expect(prismaMocks.user.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
        prismaMocks.user.upsert.mock.invocationCallOrder[0],
      )
    })

    it('leaves the old row alone when the email is not verified', async () => {
      fetchMock.mockResolvedValueOnce(
        accountsReply({ ...SIGNED_IN, user: { ...SIGNED_IN.user, emailVerified: false } }),
      )

      await expect(lookupSession('alpaca.session_token=abc')).rejects.toThrow(/unverified email/)
      expect(prismaMocks.user.updateMany).not.toHaveBeenCalled()
      expect(prismaMocks.user.upsert).not.toHaveBeenCalled()
    })

    it('does nothing extra when the row already has the accounts id', async () => {
      prismaMocks.user.findUnique.mockResolvedValue({ id: 'user-1' })
      fetchMock.mockResolvedValueOnce(accountsReply(SIGNED_IN))

      await lookupSession('alpaca.session_token=abc')

      expect(prismaMocks.user.updateMany).not.toHaveBeenCalled()
      expect(prismaMocks.user.upsert).toHaveBeenCalledTimes(1)
    })
  })

  it('stores an empty name as null', async () => {
    fetchMock.mockResolvedValueOnce(
      accountsReply({ ...SIGNED_IN, user: { ...SIGNED_IN.user, name: '' } }),
    )
    const result = await lookupSession('alpaca.session_token=abc')
    expect(result.user?.name).toBeNull()
  })

  it('reports the service as unavailable on an error status, not as signed out', async () => {
    fetchMock.mockResolvedValueOnce(accountsReply({ message: 'boom' }, { status: 502 }))
    await expect(lookupSession('alpaca.session_token=abc')).rejects.toBeInstanceOf(
      AuthUnavailableError,
    )
  })

  it('reports the service as unavailable when it cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(lookupSession('alpaca.session_token=abc')).rejects.toBeInstanceOf(
      AuthUnavailableError,
    )
  })
})

describe('signOutOfAccounts', () => {
  it('does nothing without an accounts cookie', async () => {
    await expect(signOutOfAccounts(null)).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs out as the CrossWise origin and returns the cookie-clearing headers', async () => {
    fetchMock.mockResolvedValueOnce(
      accountsReply({ success: true }, { setCookies: ['alpaca.session_token=; Max-Age=0'] }),
    )

    const cleared = await signOutOfAccounts('alpaca.session_token=abc; theme=dark')

    expect(cleared).toEqual(['alpaca.session_token=; Max-Age=0'])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://accounts.buildyouralpaca.com/api/auth/sign-out')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      cookie: 'alpaca.session_token=abc',
      origin: 'https://crosswise.buildyouralpaca.com',
    })
  })
})
