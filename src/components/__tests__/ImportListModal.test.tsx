import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import ImportListModal from '../ImportListModal'
import type { Topic } from '@/types/database'

const topics = [
  {
    id: 'ctopic1234567890123456789',
    name: 'Animals',
    icon: '🦊',
  } as unknown as Topic,
]

const validItems = [
  { answer: 'otter', clue: 'Playful river mammal' },
  { answer: 'badger', clue: 'Builds complex burrows underground' },
  { answer: 'panda', clue: 'Eats mostly bamboo' },
  { answer: 'fennec', clue: 'Desert fox with big ears' },
  { answer: 'weasel', clue: 'Slim, quick mustelid' },
]

function renderModal(onSubmit = vi.fn()) {
  render(
    <ImportListModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} topics={topics} />,
  )
  return onSubmit
}

function fillAndSubmit(payload: object) {
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: topics[0].id },
  })
  fireEvent.change(screen.getByPlaceholderText('Paste JSON data or upload file...'), {
    target: { value: JSON.stringify(payload) },
  })
  fireEvent.submit(screen.getByRole('button', { name: /import list/i }))
}

describe('ImportListModal answer validation (#17)', () => {
  it('shows a word-naming error and does not submit when an answer has disallowed characters', async () => {
    const onSubmit = renderModal()

    fillAndSubmit({
      topic: 'Animals',
      name: 'Wildlife',
      items: [...validItems.slice(0, 4), { answer: 'CAFÉ-3', clue: 'Invalid characters here' }],
    })

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('CAFÉ-3')
    expect(alert.textContent).toContain("aren't letters A–Z")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a fully valid list unchanged', async () => {
    const onSubmit = renderModal()

    fillAndSubmit({ topic: 'Animals', name: 'Wildlife', items: validItems })

    expect(await screen.queryByRole('alert')).toBeNull()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.items.map((item: { answer: string }) => item.answer)).toEqual([
      'OTTER',
      'BADGER',
      'PANDA',
      'FENNEC',
      'WEASEL',
    ])
  })
})
