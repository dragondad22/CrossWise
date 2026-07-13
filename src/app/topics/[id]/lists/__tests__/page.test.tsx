import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import ListsPage from '../page'
import { useAppStore } from '@/lib/store'

const replaceMock = vi.fn()
const pushMock = vi.fn()
const routerMock = { replace: replaceMock, push: pushMock }
const TOPIC_ID = 'ctopic1234567890123456789'

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useParams: () => ({ id: TOPIC_ID }),
  usePathname: () => `/topics/${TOPIC_ID}/lists`,
}))

vi.mock('@/lib/autosave', () => ({
  useAutosave: () => ({ clearSolveState: vi.fn(), stopAutosave: vi.fn() }),
}))

const initialState = useAppStore.getState()

describe('ListsPage error state (#36)', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...initialState,
      lists: [],
      selectedTopic: {
        id: TOPIC_ID,
        name: 'Biology',
        description: null,
        color: '#3B82F6',
        icon: '🧬',
      } as never,
      user: { id: 'u1', email: 'user@example.com', name: null, createdAt: '' } as never,
      sessionHydrated: true,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders a visible error state when the lists fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )

    render(<ListsPage />)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Network error')
  })

  it('shows the empty state, not an error, when the topic simply has no lists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () =>
          url.includes('/topics/')
            ? { success: true, data: useAppStore.getState().selectedTopic }
            : { success: true, data: [] },
      })),
    )

    render(<ListsPage />)

    expect(await screen.findByText('No lists yet')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
