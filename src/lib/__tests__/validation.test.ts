import { describe, expect, it } from 'vitest'

import {
  validateListJSON,
  normalizeAnswer,
  validateAnswerFormat,
  ImportListSchema,
} from '../validation'

describe('validation helpers', () => {
  it('validates and normalizes a well-formed list payload', () => {
    const payload = {
      topic: 'Animals',
      name: 'Mammals',
      version: 1,
      items: [
        { answer: 'otter', clue: 'Playful river mammal', note: 'Loves water' },
        { answer: 'Sea-lion', clue: 'Barks loudly on the shore' },
        { answer: 'Fennec Fox', clue: 'Desert fox with big ears' },
        { answer: 'Badger', clue: 'Builds complex burrows underground' },
        { answer: 'Panda', clue: 'Eats mostly bamboo', difficulty: 'MEDIUM' },
      ],
    }

    const result = validateListJSON(payload)
    expect(result.success).toBe(true)
    expect(result.data?.items.map((item) => item.answer)).toEqual([
      'OTTER',
      'SEALION',
      'FENNECFOX',
      'BADGER',
      'PANDA',
    ])
  })

  it('rejects lists that contain duplicate answers', () => {
    const payload = {
      topic: 'Test',
      name: 'Duplicates',
      items: [
        { answer: 'alpha', clue: 'First letter' },
        { answer: 'alpha', clue: 'Duplicate answer' },
        { answer: 'beta', clue: 'Second letter' },
        { answer: 'gamma', clue: 'Third letter' },
        { answer: 'delta', clue: 'Fourth letter' },
      ],
    }

    const result = validateListJSON(payload)
    expect(result.success).toBe(false)
    expect(result.errors?.[0].message).toMatch(/Duplicate answers/i)
  })

  it('surfaces schema validation errors with field metadata', () => {
    const payload = {
      topic: '',
      name: '',
      items: [{ answer: 'a', clue: 'hi' }],
    }

    const result = validateListJSON(payload)
    expect(result.success).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'topic', message: expect.stringContaining('required') }),
        expect.objectContaining({
          field: 'items',
          message: expect.stringContaining('least 5'),
        }),
      ]),
    )
  })

  it('supports ImportListSchema parsing directly for strongly typed guards', () => {
    const parsed = ImportListSchema.safeParse({
      topic: 'History',
      name: 'Renaissance',
      version: 2,
      items: Array.from({ length: 5 }, (_, index) => ({
        answer: `artist${index + 1}`,
        clue: `Notable renaissance artist ${index + 1}`,
      })),
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) {
      throw new Error('ImportListSchema parsing unexpectedly failed')
    }
    expect(parsed.data.version).toBe(2)
  })

  it('normalizes answers by upper-casing and stripping non letters', () => {
    expect(normalizeAnswer('Sea-horse!')).toBe('SEAHORSE')
  })

  it('describes formatting issues for invalid answers', () => {
    const result = validateAnswerFormat('1')
    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining(['Non-letter characters removed', 'Answer too short (minimum 2 letters)']),
    )
  })

  it('flags answers that exceed the maximum allowed length', () => {
    const longAnswer = 'supercalifragilisticexpialidocious'
    const result = validateAnswerFormat(longAnswer)

    expect(result.valid).toBe(false)
    expect(result.issues).toContain('Answer too long (maximum 20 letters)')
  })
})
