import { createHash } from 'node:crypto'

import type { AuthUser } from '@/types/auth'

// Previews (ADR-010). A Vercel preview can't use the shared sign-in: its cookie never reaches
// *.vercel.app, and a real session must not reach unreviewed PR code. So a preview with
// PREVIEW_SIGN_IN=1 signs you in as one test user, and keeps its data in a database of its own,
// in the preview Neon project that Preview's DATABASE_URL points at.

export const PREVIEW_COOKIE = 'crosswise_preview_user'

export const PREVIEW_USER: AuthUser = {
  id: 'preview-test-user',
  email: 'test-user@preview.invalid',
  name: 'Test User',
}

type Env = Record<string, string | undefined>

/** True only on a Vercel preview with the test sign-in switched on. Production never sets either. */
export function previewMode(env: Env = process.env): boolean {
  return env.VERCEL_ENV === 'preview' && env.PREVIEW_SIGN_IN === '1'
}

/** The branch's own database: `preview_<branch>_<hash>`, at most 57 characters (Postgres allows 63). */
export function previewDatabaseName(branch: string | undefined): string {
  const ref = branch || 'no-branch'
  const slug = ref
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  const hash = createHash('sha256').update(ref).digest('hex').slice(0, 8)
  return `preview_${slug}_${hash}`
}

/** DATABASE_URL, pointed at the branch's own database when in preview mode. */
export function databaseUrl(env: Env = process.env): string | undefined {
  const url = env.DATABASE_URL
  if (!url || !previewMode(env)) return url
  const own = new URL(url)
  own.pathname = `/${previewDatabaseName(env.VERCEL_GIT_COMMIT_REF)}`
  return own.toString()
}

/** The test user, if the request carries the preview sign-in cookie. */
export function previewUser(cookieHeader: string | null): AuthUser | null {
  const signedIn = (cookieHeader ?? '')
    .split(';')
    .some((part) => part.trim() === `${PREVIEW_COOKIE}=1`)
  return signedIn ? PREVIEW_USER : null
}
