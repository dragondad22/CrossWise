// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../preview-sign-in/route'

const URL_ = 'https://crosswise-abc-chris.vercel.app/api/v1/auth/preview-sign-in'

function post(next?: string) {
  const body = new URLSearchParams(next === undefined ? {} : { next })
  return POST(new NextRequest(URL_, { method: 'POST', body }))
}

describe('POST /api/v1/auth/preview-sign-in', () => {
  afterEach(() => {
    delete process.env.VERCEL_ENV
    delete process.env.PREVIEW_SIGN_IN
  })

  it.each([{}, { VERCEL_ENV: 'production', PREVIEW_SIGN_IN: '1' }, { VERCEL_ENV: 'preview' }])(
    'is not there outside a preview with the test sign-in on (%o)',
    async (env) => {
      Object.assign(process.env, env)
      const response = await post('/topics')
      expect(response.status).toBe(404)
      expect(response.headers.getSetCookie()).toEqual([])
    },
  )

  it('signs a preview in as the test user and goes on to the page asked for', async () => {
    Object.assign(process.env, { VERCEL_ENV: 'preview', PREVIEW_SIGN_IN: '1' })
    const response = await post('/topics/abc')
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://crosswise-abc-chris.vercel.app/topics/abc',
    )
    const [cookie] = response.headers.getSetCookie()
    expect(cookie).toMatch(/^crosswise_preview_user=1;/)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Secure/i)
  })

  it.each([
    '//evil.example/x',
    'https://evil.example/',
    '/\t/evil.example/x',
    '/\n/evil.example',
    undefined,
  ])('never sends you to another site (%s)', async (next) => {
    Object.assign(process.env, { VERCEL_ENV: 'preview', PREVIEW_SIGN_IN: '1' })
    const response = await post(next)
    expect(response.headers.get('location')).toBe('https://crosswise-abc-chris.vercel.app/topics')
  })
})
