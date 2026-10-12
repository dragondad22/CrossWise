import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AuthProvider from '../AuthProvider'
import { useAppStore } from '@/lib/store'

const fetchMock = vi.fn()

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset().mockResolvedValue(new Response('{}'))
    useAppStore.setState({ user: null, sessionHydrated: false })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('hydrates the store and refreshes the shared session cookie when signed in', () => {
    const user = { id: 'u1', email: 'a@b.c', name: null }
    render(<AuthProvider initialUser={user}>child</AuthProvider>)
    expect(useAppStore.getState().user).toEqual(user)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/session', { cache: 'no-store' })
  })

  it('does not call the session endpoint when signed out', () => {
    render(<AuthProvider initialUser={null}>child</AuthProvider>)
    expect(useAppStore.getState().sessionHydrated).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
