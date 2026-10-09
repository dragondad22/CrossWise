import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'

// Called by the accounts service when someone deletes their account (ADR-009).
// Deleting the user cascades to their topics, lists, puzzles and solves.
//
// Signed with ACCOUNT_WEBHOOK_SECRET, shared with the accounts service:
//   x-alpaca-timestamp: unix seconds
//   x-alpaca-signature: v1=<hex HMAC-SHA256 of "<timestamp>.<raw body>">
// Requests older than five minutes are refused so a captured one can't be replayed later.

const MAX_AGE_SECONDS = 5 * 60

const BodySchema = z.object({ userId: z.string().min(1) })

function reject(status: number, message: string) {
  return NextResponse.json({ success: false, error: { message } }, { status })
}

function validSignature(secret: string, timestamp: string, body: string, signature: string) {
  const expected = `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const secret = process.env.ACCOUNT_WEBHOOK_SECRET
  if (!secret) {
    console.error('ACCOUNT_WEBHOOK_SECRET is not set; refusing account-deleted webhook.')
    return reject(503, 'Not configured')
  }

  const timestamp = request.headers.get('x-alpaca-timestamp') ?? ''
  const signature = request.headers.get('x-alpaca-signature') ?? ''
  const body = await request.text()

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!/^\d+$/.test(timestamp) || !(age <= MAX_AGE_SECONDS)) {
    return reject(401, 'Invalid signature')
  }
  if (!validSignature(secret, timestamp, body, signature)) {
    return reject(401, 'Invalid signature')
  }

  let userId: string
  try {
    userId = BodySchema.parse(JSON.parse(body)).userId
  } catch {
    return reject(400, 'Expected { userId }')
  }

  // deleteMany so a repeat delivery for an already-deleted user still succeeds.
  const { count } = await prisma.user.deleteMany({ where: { id: userId } })
  return NextResponse.json({ success: true, data: { deleted: count } })
}
