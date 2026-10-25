import { NextResponse } from 'next/server'

import { databaseAnswers } from '@/lib/health'

// For the smoke test after each release (scripts/smoke.sh, #139): 200 when the app is up and reaches
// its database, 503 when it can't. Needs no session and says nothing about any user.
export const dynamic = 'force-dynamic'

export async function GET() {
  const ok = await databaseAnswers()
  return NextResponse.json(
    { ok },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
