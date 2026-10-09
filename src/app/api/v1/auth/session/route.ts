import { NextRequest, NextResponse } from 'next/server'

import { AuthUnavailableError, lookupSession } from '@/lib/auth'
import { authUnavailableResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { user, setCookies } = await lookupSession(request.headers.get('cookie'))
    const response = NextResponse.json({ success: true, data: { user } })
    // Pass the accounts service's refreshed session cookie on to the browser.
    for (const cookie of setCookies) response.headers.append('set-cookie', cookie)
    return response
  } catch (error) {
    if (error instanceof AuthUnavailableError) return authUnavailableResponse()
    throw error
  }
}
