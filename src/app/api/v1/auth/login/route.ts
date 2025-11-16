import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { prisma } from '@/lib/db'
import { LoginSchema } from '@/lib/validation'
import { createSession, sanitizeUser, SESSION_COOKIE_NAME, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email or password' } },
        { status: 401 },
      )
    }

    const isValid = await verifyPassword(parsed.password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email or password' } },
        { status: 401 },
      )
    }

    const session = await createSession(user.id)

    const response = NextResponse.json({
      success: true,
      data: { user: sanitizeUser(user) },
    })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: session.expiresAt,
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid login data', details: error.issues } },
        { status: 400 },
      )
    }

    console.error('Failed to login:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Login failed' } },
      { status: 500 },
    )
  }
}
