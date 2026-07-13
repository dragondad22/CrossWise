import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { prisma } from '@/lib/db'
import { ResetPasswordSchema } from '@/lib/validation'
import { consumePasswordResetToken, deleteSessionsForUser, hashPassword } from '@/lib/auth'
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rate-limit'

// Generic rejection for every invalid-token case (missing, forged, expired,
// already used) — never reveals whether any account or token matched (#7).
const INVALID_TOKEN_MESSAGE =
  'This reset link is invalid or has expired. Please request a new one.'

export async function POST(request: NextRequest) {
  // Interim per-instance limiter — replaced by the real rate-limiting layer (#89).
  if (!checkRateLimit(`password-reset:${clientKeyFromHeaders(request.headers)}`)) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many requests. Please try again later.' } },
      { status: 429 },
    )
  }

  try {
    const body = await request.json()
    const parsed = ResetPasswordSchema.parse(body)

    // The token is the credential: consuming it atomically enforces single-use
    // and binds the reset to the user the token was issued for.
    const userId = await consumePasswordResetToken(parsed.token)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: INVALID_TOKEN_MESSAGE } },
        { status: 400 },
      )
    }

    const passwordHash = await hashPassword(parsed.newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    // Non-negotiable: a stolen pre-reset session must not survive the reset.
    await deleteSessionsForUser(userId)

    return NextResponse.json({
      success: true,
      data: { message: 'Your password has been reset. You can now sign in.' },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid reset data', details: error.issues } },
        { status: 400 },
      )
    }

    console.error('Failed to reset password:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Password reset failed' } },
      { status: 500 },
    )
  }
}
