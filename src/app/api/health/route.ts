import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

// For the smoke test after each release (scripts/smoke.sh, #139): 200 when the app is up and reaches
// its database, 503 when it can't. Needs no session and says nothing about any user.
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch (error) {
    console.error('Health check: the database is unreachable:', error)
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE })
  }
}
