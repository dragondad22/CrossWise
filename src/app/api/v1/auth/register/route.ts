import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { prisma } from '@/lib/db'
import { RegisterSchema } from '@/lib/validation'
import { createSession, hashPassword, sanitizeUser, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RegisterSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'An account with that email already exists.' } },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(parsed.password)

    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash,
        name: parsed.name?.trim() || null,
      },
    })

    const session = await createSession(user.id)

    const response = NextResponse.json(
      {
        success: true,
        data: { user: sanitizeUser(user) },
      },
      { status: 201 },
    )

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
        { success: false, error: { message: 'Invalid registration data', details: error.issues } },
        { status: 400 },
      )
    }

    console.error('Failed to register user:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Registration failed' } },
      { status: 500 },
    )
  }
}
