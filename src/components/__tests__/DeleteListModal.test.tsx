import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import DeleteListModal from '../DeleteListModal'
import type { ListWithItemsAndTopic } from '@/types/database'

const list = { id: 'l1', name: 'Wildlife', version: 1 } as unknown as ListWithItemsAndTopic

describe('DeleteListModal (#16)', () => {
  it('names the list and warns puzzles are permanently removed', () => {
    render(<DeleteListModal isOpen list={list} onClose={vi.fn()} onConfirm={vi.fn()} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('Wildlife')
    expect(dialog.textContent).toMatch(/permanently deletes .* every puzzle/i)
  })

  it('Confirm calls onConfirm; Cancel calls onClose', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<DeleteListModal isOpen list={list} onClose={onClose} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: /delete list/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape cancels and busy state disables both buttons', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <DeleteListModal isOpen list={list} onClose={onClose} onConfirm={vi.fn()} />,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(
      <DeleteListModal isOpen isDeleting list={list} onClose={onClose} onConfirm={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /deleting/i })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveProperty('disabled', true)
  })

  it('renders nothing when closed', () => {
    render(<DeleteListModal isOpen={false} list={list} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
