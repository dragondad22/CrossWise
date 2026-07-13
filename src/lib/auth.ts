import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

import { prisma } from './db'
import type { AuthUser } from '@/types/auth'

export const SESSION_COOKIE_NAME = 'crosswise_session'
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 // 24 hours
const SESSION_CLEANUP_INTERVAL_MS = 1000 * 60 * 60 // 1 hour
const PASSWORD_RESET_TOKEN_DURATION_MS = 1000 * 60 * 30 // 30 minutes

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

// --- Password reset tokens (#7) ---
//
// Reset tokens are higher-risk than session tokens (they arrive over email and grant
// a password change), so only a SHA-256 hash is ever stored — the raw token exists
// solely in the reset link delivered to the user. Never store or log the raw token.

function hashPasswordResetToken(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex')
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_DURATION_MS)

  // Opportunistic cleanup of expired rows, mirroring the session cleanup approach.
  await prisma.passwordResetToken
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch((error) => {
      console.error('Failed to cleanup expired password reset tokens:', error)
    })

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashPasswordResetToken(rawToken),
      expiresAt,
    },
  })

  return { token: rawToken, expiresAt }
}

/**
 * Validates a raw reset token (exists, not expired, not consumed) and marks it
 * consumed. Returns the owning userId, or null for any invalid token — callers
 * must not distinguish why (no account/token enumeration).
 */
export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashPasswordResetToken(rawToken)

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record) return null
  if (record.consumedAt) return null
  if (record.expiresAt < new Date()) return null

  // Conditional update makes consumption atomic: two concurrent requests with the
  // same token cannot both succeed (single-use enforced at the database).
  const consumed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  })

  if (consumed.count === 0) return null

  return record.userId
}

/** Revokes every session for a user (e.g. after a password reset). */
export async function deleteSessionsForUser(userId: string) {
  return prisma.session.deleteMany({ where: { userId } })
}
