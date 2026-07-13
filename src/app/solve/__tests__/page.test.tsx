import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'

import SolvePage from '../[id]/page'
import { useAppStore } from '@/lib/store'

const routerMock = { replace: vi.fn(), push: vi.fn() }
const PUZZLE_ID = 'cpuzzle123456789012345678'

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  useParams: () => ({ id: PUZZLE_ID }),
  usePathname: () => `/solve/${PUZZLE_ID}`,
}))

vi.mock('@/lib/autosave', () => ({
  autosaveManager: {
    loadSolveState: vi.fn(() => null),
    stopAutosave: vi.fn(),
    clearSolveState: vi.fn(),
    startAutosave: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    forceSave: vi.fn(),
  },
}))

const initialState = useAppStore.getState()

describe('SolvePage loading state reactivity (#36)', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...initialState,
      currentPuzzle: null,
      solveState: null,
      user: { id: 'u1', email: 'user@example.com', name: null, createdAt: '' } as never,
      sessionHydrated: true,
      isLoading: true,
      error: null,
    })
    // Keep the page's own load effect pending so store state drives the render.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('re-renders reactively when isLoading changes in the store', async () => {
    render(<SolvePage />)

    // Loading branch while isLoading is true.
    expect(screen.getByText('Loading puzzle…')).toBeTruthy()

    // Flip the store: with the old imperative getState() read this would NOT
    // re-render; the subscribed read must swap to the not-found branch.
    act(() => {
      useAppStore.setState({ isLoading: false })
    })

    expect(screen.queryByText('Loading puzzle…')).toBeNull()
    expect(screen.getByText('Puzzle not found')).toBeTruthy()
  })
})
