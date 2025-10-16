import { NextRequest, NextResponse } from 'next/server'

import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ success: true, data: { user: null } })
  }

  const sessionContext = await getSessionForToken(token)

  if (!sessionContext) {
    return NextResponse.json({ success: true, data: { user: null } })
  }

  return NextResponse.json({
    success: true,
    data: { user: sessionContext.user },
  })
}
