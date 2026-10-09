import { NextRequest, NextResponse } from 'next/server'

import { AuthUnavailableError, signOutOfAccounts } from '@/lib/auth'
import { authUnavailableResponse } from '@/lib/api-auth'

// Signing out of CrossWise signs out of the shared account, on every app.
export async function POST(request: NextRequest) {
  try {
    const setCookies = await signOutOfAccounts(request.headers.get('cookie'))
    const response = NextResponse.json({ success: true })
    for (const cookie of setCookies) response.headers.append('set-cookie', cookie)
    return response
  } catch (error) {
    if (error instanceof AuthUnavailableError) return authUnavailableResponse()
    throw error
  }
}
