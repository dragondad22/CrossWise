import { describe, expect, it } from 'vitest'

import { cn } from '../utils'

describe('cn utility', () => {
  it('joins truthy class names with spaces', () => {
    expect(cn('base', 'active', 'primary')).toBe('base active primary')
  })

  it('omits falsy values', () => {
    expect(cn('base', null, undefined, false, 'selected')).toBe('base selected')
  })

  it('handles empty input gracefully', () => {
    expect(cn()).toBe('')
  })
})
