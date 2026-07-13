import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { prisma } from '@/lib/db'
import { ForgotPasswordSchema } from '@/lib/validation'
import { createPasswordResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit, clientKeyFromHeaders } from '@/lib/rate-limit'

// The one and only success payload. Known and unknown emails MUST return this
// exact body and status so account existence cannot be enumerated (#7).
const GENERIC_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.'

function genericResponse() {
  return NextResponse.json({ success: true, data: { message: GENERIC_MESSAGE } })
}

export async function POST(request: NextRequest) {
  // Interim per-instance limiter — replaced by the real rate-limiting layer (#89).
  if (!checkRateLimit(`password-forgot:${clientKeyFromHeaders(request.headers)}`)) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many requests. Please try again later.' } },
      { status: 429 },
    )
  }

  try {
    const body = await request.json()
    const parsed = ForgotPasswordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (user) {
      const { token } = await createPasswordResetToken(user.id)
      const resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`
      await sendPasswordResetEmail(user.email, resetUrl)
    }

    return genericResponse()
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Valid email required' } },
        { status: 400 },
      )
    }

    // Internal failures (token creation, delivery) can only occur for existing
    // accounts — returning the generic success keeps errors from leaking
    // account existence. The failure is still logged server-side (no PII).
    console.error('Failed to process password reset request:', error)
    return genericResponse()
  }
}
