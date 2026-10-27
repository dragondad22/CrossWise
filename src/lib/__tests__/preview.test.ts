// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  databaseUrl,
  PREVIEW_USER,
  previewDatabaseName,
  previewMode,
  previewUser,
} from '../preview'

const PREVIEW = { VERCEL_ENV: 'preview', PREVIEW_SIGN_IN: '1' }

describe('previewMode', () => {
  it('is on only for a Vercel preview with PREVIEW_SIGN_IN=1', () => {
    expect(previewMode(PREVIEW)).toBe(true)
  })

  it.each([
    { VERCEL_ENV: 'production', PREVIEW_SIGN_IN: '1' },
    { VERCEL_ENV: 'development', PREVIEW_SIGN_IN: '1' },
    { PREVIEW_SIGN_IN: '1' },
    { VERCEL_ENV: 'preview' },
    { VERCEL_ENV: 'preview', PREVIEW_SIGN_IN: 'true' },
    {},
  ])('is off for %o', (env) => {
    expect(previewMode(env)).toBe(false)
  })
})

describe('previewDatabaseName', () => {
  it('names a database after the branch, with a hash so two branches never share one', () => {
    const name = previewDatabaseName('factory/12-p1-Fix the Grid!')
    expect(name).toMatch(/^preview_factory_12_p1_fix_the_grid_[0-9a-f]{8}$/)
    expect(previewDatabaseName('factory/12-p1-Fix the Grid!')).toBe(name)
    expect(previewDatabaseName('factory/12-p1-fix-the-grid')).not.toBe(name)
  })

  it('stays a valid Postgres name for long branches and no branch', () => {
    for (const branch of ['x'.repeat(200), undefined, '', '---']) {
      const name = previewDatabaseName(branch)
      expect(name).toMatch(/^preview_[a-z0-9_]+$/)
      expect(name.length).toBeLessThanOrEqual(63)
    }
  })
})

describe('databaseUrl', () => {
  const url = 'postgresql://u:p@ep-x.us-east-2.aws.neon.tech/neondb?sslmode=require'

  it('leaves DATABASE_URL alone outside preview mode', () => {
    expect(databaseUrl({ DATABASE_URL: url, VERCEL_ENV: 'production', PREVIEW_SIGN_IN: '1' })).toBe(
      url,
    )
    expect(databaseUrl({ DATABASE_URL: url })).toBe(url)
    expect(databaseUrl({})).toBeUndefined()
  })

  it("points a preview at its branch's own database on the same server", () => {
    const own = new URL(
      databaseUrl({ ...PREVIEW, DATABASE_URL: url, VERCEL_GIT_COMMIT_REF: 'feat/a' })!,
    )
    expect(own.host).toBe('ep-x.us-east-2.aws.neon.tech')
    expect(own.pathname).toBe(`/${previewDatabaseName('feat/a')}`)
    expect(own.searchParams.get('sslmode')).toBe('require')
    expect(`${own.username}:${own.password}`).toBe('u:p')
  })
})

describe('previewUser', () => {
  it('is the test user only when the preview cookie says so', () => {
    expect(previewUser('a=1; crosswise_preview_user=1')).toEqual(PREVIEW_USER)
    expect(previewUser('crosswise_preview_user=0')).toBeNull()
    expect(previewUser('crosswise_preview_user=1x')).toBeNull()
    expect(previewUser(null)).toBeNull()
  })
})
