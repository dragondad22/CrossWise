import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import DeleteTopicModal from '../DeleteTopicModal'
import type { Topic } from '@/types/database'

const topic = { id: 't1', name: 'Biology', icon: '🧬' } as unknown as Topic

describe('DeleteTopicModal (#15)', () => {
  it('names the topic and warns about cascading data loss', () => {
    render(
      <DeleteTopicModal isOpen topic={topic} onClose={vi.fn()} onConfirm={vi.fn()} />,
    )

    expect(screen.getByRole('dialog').textContent).toContain('Biology')
    expect(screen.getByRole('dialog').textContent).toMatch(/word list|puzzle|solve/i)
  })

  it('Confirm calls onConfirm; Cancel calls onClose with no confirm', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<DeleteTopicModal isOpen topic={topic} onClose={onClose} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: /delete topic/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape cancels', () => {
    const onClose = vi.fn()
    render(<DeleteTopicModal isOpen topic={topic} onClose={onClose} onConfirm={vi.fn()} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('busy state disables both buttons and blocks Escape', () => {
    const onClose = vi.fn()
    render(
      <DeleteTopicModal isOpen isDeleting topic={topic} onClose={onClose} onConfirm={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /deleting/i })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveProperty('disabled', true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('focuses the safe (Cancel) action when opened', () => {
    render(<DeleteTopicModal isOpen topic={topic} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /cancel/i }))
  })
})
