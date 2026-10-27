import { NextRequest, NextResponse } from 'next/server'

import { PREVIEW_COOKIE, previewMode } from '@/lib/preview'
import { sanitizeNextPath } from '@/lib/utils'

// Signs the browser in as the preview's test user (ADR-010). Outside a preview it doesn't exist:
// scripts/smoke.sh checks production answers 404 here.
export async function POST(request: NextRequest) {
  if (!previewMode()) {
    return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
  }
  const form = await request.formData().catch(() => null)
  const next = form?.get('next')
  const response = NextResponse.redirect(
    new URL(sanitizeNextPath(typeof next === 'string' ? next : null), request.url),
    303,
  )
  response.cookies.set(PREVIEW_COOKIE, '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
