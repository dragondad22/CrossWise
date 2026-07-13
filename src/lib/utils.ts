import type { Route } from 'next'

export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ')
}

// Sanitize a post-auth ?next= redirect target down to a same-origin path (#78).
// A naive startsWith('/') check lets protocol-relative URLs ("//evil.com") and
// backslash variants ("/\evil.com", which browsers normalize to "//") escape to
// an external origin after login. Only a single-slash path is ever navigable.
export function sanitizeNextPath(param: string | null | undefined, fallback = '/topics'): Route {
  if (param && /^\/(?![/\\])/.test(param)) {
    return param as Route
  }
  return fallback as Route
}
