import { NextResponse } from 'next/server'

import { AuthUnavailableError, lookupSession } from './auth'
import type { AuthUser } from '@/types/auth'

// The one session check for API routes (#88). Either the signed-in user, or the
// response to send instead:
//   const session = await requireSession(request)
//   if (session.response) return session.response
//   session.user.id ...

export type RequireSessionResult =
  | { user: AuthUser; response?: undefined }
  | { user?: undefined; response: NextResponse }

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: { message: 'Authentication required' } },
    { status: 401 },
  )
}

export function authUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      error: { message: 'Sign-in is temporarily unavailable. Try again shortly.' },
    },
    { status: 503, headers: { 'Retry-After': '30' } },
  )
}

export async function requireSession(request: Request): Promise<RequireSessionResult> {
  try {
    const { user } = await lookupSession(request.headers.get('cookie'))
    return user ? { user } : { response: unauthorizedResponse() }
  } catch (error) {
    if (error instanceof AuthUnavailableError) {
      console.error('Session check failed:', error.message)
      return { response: authUnavailableResponse() }
    }
    throw error
  }
}
