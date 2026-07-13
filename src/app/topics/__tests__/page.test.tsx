import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

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

  it('renders a visible error with retry when the fetch fails (#36)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' })
      .mockResolvedValueOnce({
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

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('HTTP error')

    // Retry refetches and clears the error state.
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  it('shows the empty state (not the error) for an empty successful result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: [] }),
      }),
    )

    render(<TopicsPage />)
    useAppStore.setState({
      sessionHydrated: true,
      user: { id: 'u1', email: 'user@example.com', name: null, createdAt: '' },
    })

    expect(await screen.findByText('No topics yet')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('topic delete flow: cancel sends no request; confirm deletes and removes the card (#15)', async () => {
    const topic = {
      id: 'ctopic1234567890123456789',
      name: 'Biology',
      description: null,
      color: '#3B82F6',
      icon: '\u{1F9EC}',
      createdAt: new Date().toISOString(),
    }
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { topicId: topic.id, listIds: [], puzzleIds: [] },
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true, data: [topic] }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<TopicsPage />)
    useAppStore.setState({
      sessionHydrated: true,
      user: { id: 'u1', email: 'user@example.com', name: null, createdAt: '' },
    })

    // Open the confirmation from the card's delete control.
    const deleteButton = await screen.findByRole('button', { name: 'Delete topic Biology' })
    fireEvent.click(deleteButton)
    expect(screen.getByRole('dialog')).toBeTruthy()

    // Cancel aborts with no request and no state change.
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(0)
    expect(screen.getByText('Biology')).toBeTruthy()

    // Reopen and confirm: DELETE fires and the card disappears.
    fireEvent.click(screen.getByRole('button', { name: 'Delete topic Biology' }))
    fireEvent.click(screen.getByRole('button', { name: /delete topic$/i }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE')).toHaveLength(1)
      expect(screen.queryByText('Biology')).toBeNull()
    })
    expect(fetchMock).toHaveBeenCalledWith(`/api/v1/topics/${topic.id}`, { method: 'DELETE' })
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
