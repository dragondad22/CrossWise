import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

import { prisma } from './db'
import type { AuthUser } from '@/types/auth'

export const SESSION_COOKIE_NAME = 'crosswise_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 // 24 hours
const SESSION_CLEANUP_INTERVAL_MS = 1000 * 60 * 60 // 1 hour

let lastCleanupRun = 0

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

  await maybeCleanupExpiredSessions()

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function getSessionForToken(token: string, options?: { refresh?: boolean }) {
  await maybeCleanupExpiredSessions()

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } }).catch(() => {})
    return null
  }

  if (options?.refresh) {
    const msUntilExpiry = session.expiresAt.getTime() - Date.now()
    if (msUntilExpiry <= SESSION_REFRESH_THRESHOLD_MS) {
      const newExpiry = new Date(Date.now() + SESSION_DURATION_MS)
      await prisma.session.update({
        where: { token },
        data: { expiresAt: newExpiry },
      })
      session.expiresAt = newExpiry
    }
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

export async function cleanupExpiredSessions() {
  return prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}

async function maybeCleanupExpiredSessions() {
  const now = Date.now()
  if (now - lastCleanupRun < SESSION_CLEANUP_INTERVAL_MS) {
    return
  }

  lastCleanupRun = now

  try {
    await cleanupExpiredSessions()
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error)
  }
}

export function __resetSessionCleanupState() {
  lastCleanupRun = 0
}
