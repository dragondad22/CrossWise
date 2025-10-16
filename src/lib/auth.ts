import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

import { prisma } from './db'
import type { AuthUser } from '@/types/auth'

export const SESSION_COOKIE_NAME = 'crosswise_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

export function sanitizeUser<T extends { id: string; email: string; name?: string | null }>(
  user: T,
): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
  }
}

export async function hashPassword(password: string) {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function getSessionForToken(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } }).catch(() => {})
    return null
  }

  return {
    session,
    user: sanitizeUser(session.user),
  }
}

export async function deleteSessionByToken(token: string) {
  try {
    await prisma.session.delete({ where: { token } })
  } catch (error) {
    // Ignore missing sessions
    console.warn('Failed to delete session token:', error)
  }
}
