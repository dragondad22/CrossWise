import { describe, expect, it } from 'vitest'

import { cn, sanitizeNextPath } from '../utils'

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

describe('sanitizeNextPath (#78)', () => {
  it('accepts a same-origin path', () => {
    expect(sanitizeNextPath('/topics')).toBe('/topics')
    expect(sanitizeNextPath('/solve/abc?tab=down')).toBe('/solve/abc?tab=down')
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeNextPath('//evil.com')).toBe('/topics')
    expect(sanitizeNextPath('//evil.com/phish')).toBe('/topics')
  })

  it('rejects backslash variants browsers normalize to //', () => {
    expect(sanitizeNextPath('/\\evil.com')).toBe('/topics')
  })

  it('rejects absolute and scheme-based URLs', () => {
    expect(sanitizeNextPath('https://evil.com')).toBe('/topics')
    expect(sanitizeNextPath('javascript:alert(1)')).toBe('/topics')
  })

  it('falls back for null, empty, and relative values', () => {
    expect(sanitizeNextPath(null)).toBe('/topics')
    expect(sanitizeNextPath('')).toBe('/topics')
    expect(sanitizeNextPath('topics')).toBe('/topics')
  })

  it('honours a custom fallback', () => {
    expect(sanitizeNextPath('//evil.com', '/')).toBe('/')
  })
})
