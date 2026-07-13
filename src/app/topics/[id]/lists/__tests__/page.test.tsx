import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

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

const sampleListFor = (topicId: string) => ({
  id: 'clist1234567890123456789',
  name: 'Marine mammals',
  version: 1,
  topicId,
  source: 'USER',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-02T00:00:00Z',
  items: [
    { id: 'item-1', answer: 'OTTER', clue: 'Playful swimmer', note: null, difficulty: 'EASY' },
  ],
  topic: {
    id: topicId,
    name: 'Biology',
    description: null,
    color: '#3B82F6',
    icon: '🧬',
  },
  userSolves: [],
})

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

  it('shows a friendly message when exporting a list that has no puzzle yet (#2)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => {
          if (url.includes('/puzzles')) return { success: true, data: [] }
          if (url.includes('/topics/')) {
            return { success: true, data: useAppStore.getState().selectedTopic }
          }
          return { success: true, data: [sampleListFor(TOPIC_ID)] }
        },
      })),
    )

    render(<ListsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Export' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain("Generate a puzzle first")
  })

  it('opens a printable blank crossword when exporting a list with a puzzle (#2)', async () => {
    const grid = {
      size: { rows: 1, cols: 2 },
      cells: [
        [
          { row: 0, col: 0, type: 'cell', letter: 'Q', number: 1 },
          { row: 0, col: 1, type: 'cell', letter: 'X' },
        ],
      ],
    }
    const numbering = {
      across: [
        { number: 1, clue: 'Printable hint', row: 0, col: 0, length: 2, answer: 'QX', direction: 'across' },
      ],
      down: [],
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => {
          if (url.includes('/puzzles')) {
            return {
              success: true,
              data: [
                {
                  id: 'puzzle-1',
                  grid: JSON.stringify(grid),
                  numbering: JSON.stringify(numbering),
                  createdAt: '2026-07-01T00:00:00Z',
                },
              ],
            }
          }
          if (url.includes('/topics/')) {
            return { success: true, data: useAppStore.getState().selectedTopic }
          }
          return { success: true, data: [sampleListFor(TOPIC_ID)] }
        },
      })),
    )

    const fakeWindow = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
      print: vi.fn(),
    }
    vi.stubGlobal('open', vi.fn(() => fakeWindow))

    render(<ListsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Export' }))

    const writtenHtml = await vi.waitFor(() => {
      expect(fakeWindow.document.write).toHaveBeenCalled()
      return fakeWindow.document.write.mock.calls[0][0] as string
    })

    // Blank printable crossword: clue text present, answer letters absent.
    expect(writtenHtml).toContain('Printable hint')
    expect(writtenHtml).not.toMatch(/[QX]/)
    expect(fakeWindow.print).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).toBeNull()
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
