// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { redirectToAccounts } from '../accounts-redirect'

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`)
  }),
)

vi.mock('next/navigation', () => ({ redirect }))

const go = (...args: Parameters<typeof redirectToAccounts>) => {
  try {
    redirectToAccounts(...args)
  } catch {
    // redirect() throws to stop rendering, as in Next.js.
  }
  return new URL(redirect.mock.lastCall![0])
}

describe('redirectToAccounts', () => {
  afterEach(() => {
    redirect.mockClear()
    delete process.env.APP_URL
    delete process.env.ACCOUNTS_URL
  })

  it('sends sign-in to the accounts service with a return link to the same CrossWise page', () => {
    const url = go('sign-in', '/topics/abc/lists')
    expect(url.origin + url.pathname).toBe('https://accounts.buildyouralpaca.com/sign-in')
    expect(url.searchParams.get('redirect')).toBe(
      'https://crosswise.buildyouralpaca.com/topics/abc/lists',
    )
  })

  it('returns to /topics when there is no next page', () => {
    expect(go('sign-up').searchParams.get('redirect')).toBe(
      'https://crosswise.buildyouralpaca.com/topics',
    )
  })

  it.each(['//evil.example/x', '/\\evil.example', 'https://evil.example/', ['/a', '/b']])(
    'never returns to an outside site (%s)',
    (next) => {
      expect(go('sign-in', next as string).searchParams.get('redirect')).toBe(
        'https://crosswise.buildyouralpaca.com/topics',
      )
    },
  )

  it('uses ACCOUNTS_URL and APP_URL for local development', () => {
    process.env.ACCOUNTS_URL = 'http://localhost:3100'
    process.env.APP_URL = 'http://localhost:3000'
    const url = go('forgot-password', '/solve/p1')
    expect(url.origin + url.pathname).toBe('http://localhost:3100/forgot-password')
    expect(url.searchParams.get('redirect')).toBe('http://localhost:3000/solve/p1')
  })
})
