import { describe, expect, it } from 'vitest'

import {
  validateListJSON,
  normalizeAnswer,
  validateAnswerFormat,
  ImportListSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../validation'

describe('validation helpers', () => {
  it('validates and uppercases a well-formed list payload', () => {
    const payload = {
      topic: 'Animals',
      name: 'Mammals',
      version: 1,
      items: [
        { answer: 'otter', clue: 'Playful river mammal', note: 'Loves water' },
        { answer: 'Sealion', clue: 'Barks loudly on the shore' },
        { answer: 'Fennec', clue: 'Desert fox with big ears' },
        { answer: 'Badger', clue: 'Builds complex burrows underground' },
        { answer: 'Panda', clue: 'Eats mostly bamboo', difficulty: 'MEDIUM' },
      ],
    }

    const result = validateListJSON(payload)
    expect(result.success).toBe(true)
    expect(result.data?.items.map((item) => item.answer)).toEqual([
      'OTTER',
      'SEALION',
      'FENNEC',
      'BADGER',
      'PANDA',
    ])
  })

  it('rejects answers with disallowed characters and names the offending word (#17)', () => {
    const base = [
      { answer: 'otter', clue: 'Playful river mammal' },
      { answer: 'Badger', clue: 'Builds complex burrows underground' },
      { answer: 'Panda', clue: 'Eats mostly bamboo' },
      { answer: 'Fennec', clue: 'Desert fox with big ears' },
    ]

    for (const bad of ['Sea-lion', 'Fennec Fox', 'CAFÉ', 'Word3']) {
      const result = validateListJSON({
        topic: 'Animals',
        name: 'Mammals',
        items: [...base, { answer: bad, clue: 'Contains a disallowed character' }],
      })

      expect(result.success).toBe(false)
      const answerError = result.errors?.find((err) => err.field.endsWith('answer'))
      expect(answerError?.message).toContain(bad.toUpperCase())
      expect(answerError?.message).toContain("aren't letters A–Z")
    }
  })

  it('never silently strips disallowed characters (regression for #17)', () => {
    // "CAF-É3" used to import as "CAF"; it must now be rejected, not mutated.
    const result = validateListJSON({
      topic: 'Food',
      name: 'Drinks',
      items: [
        { answer: 'CAF-É3', clue: 'Corrupted coffee word' },
        { answer: 'Latte', clue: 'Milky espresso drink' },
        { answer: 'Mocha', clue: 'Chocolate espresso drink' },
        { answer: 'Espresso', clue: 'Strong small coffee' },
        { answer: 'Ristretto', clue: 'Even shorter espresso' },
      ],
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeUndefined()
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
      items: ['Raphael', 'Titian', 'Botticelli', 'Donatello', 'Caravaggio'].map(
        (answer, index) => ({
          answer,
          clue: `Notable renaissance artist ${index + 1}`,
        }),
      ),
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) {
      throw new Error('ImportListSchema parsing unexpectedly failed')
    }
    expect(parsed.data.version).toBe(2)
  })

  it('normalizes answers by upper-casing only — disallowed characters survive to validation (#17)', () => {
    expect(normalizeAnswer('otter')).toBe('OTTER')
    expect(normalizeAnswer('Sea-horse!')).toBe('SEA-HORSE!')
  })

  it('describes formatting issues for invalid answers', () => {
    const result = validateAnswerFormat('1')
    expect(result.valid).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining("aren't letters A–Z"),
        'Answer too short (minimum 2 letters)',
      ]),
    )
  })

  it('flags answers that exceed the maximum allowed length', () => {
    const longAnswer = 'supercalifragilisticexpialidocious'
    const result = validateAnswerFormat(longAnswer)

    expect(result.valid).toBe(false)
    expect(result.issues).toContain('Answer too long (maximum 20 letters)')
  })

  it('accepts both numeric (1-5) and string difficulty on import, but rejects out-of-range values', () => {
    const base = {
      topic: 'Animals',
      name: 'Mammals',
      items: [
        { answer: 'otter', clue: 'Playful river mammal', difficulty: 3 },
        { answer: 'Sealion', clue: 'Barks loudly on the shore', difficulty: 'HARD' },
        { answer: 'Fennec', clue: 'Desert fox with big ears' },
        { answer: 'Badger', clue: 'Builds complex burrows underground' },
        { answer: 'Panda', clue: 'Eats mostly bamboo', difficulty: 'EASY' },
      ],
    }
    expect(validateListJSON(base).success).toBe(true)

    const bad = {
      ...base,
      items: [{ ...base.items[0], difficulty: 6 }, ...base.items.slice(1)],
    }
    expect(validateListJSON(bad).success).toBe(false)
  })

  describe('password recovery schemas (#7)', () => {
    it('normalizes forgot-password emails to lowercase', () => {
      const parsed = ForgotPasswordSchema.parse({ email: 'User@Example.COM' })
      expect(parsed.email).toBe('user@example.com')
    })

    it('rejects malformed forgot-password emails', () => {
      expect(ForgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
      expect(ForgotPasswordSchema.safeParse({}).success).toBe(false)
    })

    it('accepts a reset request with a token and a policy-compliant password', () => {
      const parsed = ResetPasswordSchema.parse({
        token: 'a'.repeat(64),
        newPassword: 'longenough',
      })
      expect(parsed.token).toBe('a'.repeat(64))
      expect(parsed.newPassword).toBe('longenough')
    })

    it('enforces the register password policy on reset (min 8, max 100)', () => {
      expect(
        ResetPasswordSchema.safeParse({ token: 'tok', newPassword: 'short7c' }).success,
      ).toBe(false)
      expect(
        ResetPasswordSchema.safeParse({ token: 'tok', newPassword: 'x'.repeat(101) }).success,
      ).toBe(false)
    })

    it('requires a non-empty token', () => {
      expect(
        ResetPasswordSchema.safeParse({ token: '', newPassword: 'longenough' }).success,
      ).toBe(false)
      expect(ResetPasswordSchema.safeParse({ newPassword: 'longenough' }).success).toBe(false)
    })
  })
})
