import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import TopicsPage from '../page'
import { useAppStore } from '@/lib/store'

const replaceMock = vi.fn()
const pushMock = vi.fn()
// A single stable router object: components hang identity-sensitive hooks
// (useCallback/useEffect deps) off the router, so the mock must not mint a new
// object per render the way a naive `() => ({ ... })` would.
const routerMock = { replace: replaceMock, push: pushMock }

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/topics',
}))

const initialState = useAppStore.getState()

describe('TopicsPage auth gate (#82)', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...initialState,
      topics: [],
      user: null,
      sessionHydrated: false,
      isLoading: false,
      error: null,
    })
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('shows a loading state (not the empty state) while the session is hydrating', () => {
    render(<TopicsPage />)

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.queryByText('No topics yet')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('redirects an anonymous visitor to login with a next param instead of a false empty state', async () => {
    render(<TopicsPage />)

    useAppStore.setState({ sessionHydrated: true, user: null })

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(`/login?next=${encodeURIComponent('/topics')}`)
    })
    expect(screen.queryByText('No topics yet')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('fetches topics once authenticated', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TopicsPage />)

    useAppStore.setState({
      sessionHydrated: true,
      user: { id: 'u1', email: 'user@example.com', name: null, createdAt: '' },
    })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/topics')
    })
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('redirects through login when the session expires mid-visit (401)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    render(<TopicsPage />)

    useAppStore.setState({
      sessionHydrated: true,
      user: { id: 'u1', email: 'user@example.com', name: null, createdAt: '' },
    })

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(`/login?next=${encodeURIComponent('/topics')}`)
    })
    expect(screen.queryByText('No topics yet')).toBeNull()
  })
})
