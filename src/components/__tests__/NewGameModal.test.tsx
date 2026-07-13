import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import NewGameModal from '../NewGameModal'
import type { ListWithItemsAndTopic } from '@/types/database'

const makeList = (itemCount: number) =>
  ({
    id: 'l1',
    name: 'Biology',
    items: Array.from({ length: itemCount }, (_, i) => ({ id: `i${i}` })),
  }) as unknown as ListWithItemsAndTopic

describe('NewGameModal (#22)', () => {
  it('offers presets capped to the list size, plus an "All words" default', () => {
    render(
      <NewGameModal isOpen list={makeList(18)} onClose={vi.fn()} onStart={vi.fn()} />,
    )

    // 10 and 15 are below 18; 20/30/50 must not appear.
    expect(screen.getByRole('button', { name: /10 words/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /15 words/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /20 words/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /50 words/ })).toBeNull()

    const all = screen.getByRole('button', { name: /All words \(18\)/ })
    expect(all.getAttribute('aria-pressed')).toBe('true')
  })

  it('starting with the default sends no word count (all words)', () => {
    const onStart = vi.fn()
    render(<NewGameModal isOpen list={makeList(18)} onClose={vi.fn()} onStart={onStart} />)

    fireEvent.click(screen.getByRole('button', { name: /start puzzle/i }))
    expect(onStart).toHaveBeenCalledWith(undefined)
  })

  it('starting with a chosen preset sends that count', () => {
    const onStart = vi.fn()
    render(<NewGameModal isOpen list={makeList(40)} onClose={vi.fn()} onStart={onStart} />)

    fireEvent.click(screen.getByRole('button', { name: /15 words/ }))
    fireEvent.click(screen.getByRole('button', { name: /start puzzle/i }))
    expect(onStart).toHaveBeenCalledWith(15)
  })

  it('cancel and Escape close without starting', () => {
    const onStart = vi.fn()
    const onClose = vi.fn()
    render(<NewGameModal isOpen list={makeList(18)} onClose={onClose} onStart={onStart} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onStart).not.toHaveBeenCalled()
  })

  it('busy state disables both actions', () => {
    render(
      <NewGameModal isOpen isGenerating list={makeList(18)} onClose={vi.fn()} onStart={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /generating/i })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveProperty('disabled', true)
  })
})
