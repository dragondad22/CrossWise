import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import {
  sanitizeUser,
  hashPassword,
  verifyPassword,
  createSession,
  getSessionForToken,
  deleteSessionByToken,
  cleanupExpiredSessions,
  __resetSessionCleanupState,
  SESSION_COOKIE_NAME,
} from '../auth'

const prismaMocks = vi.hoisted(() => ({
  session: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
  },
}))

const bcryptMocks = vi.hoisted(() => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  compare: vi.fn().mockResolvedValue(true),
}))

const randomBytesMock = vi.hoisted(() => vi.fn(() => Buffer.from('default-token', 'utf-8')))

vi.mock('../db', () => ({
  prisma: prismaMocks,
}))

vi.mock('bcryptjs', () => ({
  default: bcryptMocks,
}))

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto')
  return {
    ...actual,
    randomBytes: randomBytesMock,
    default: { ...actual, randomBytes: randomBytesMock },
  }
})

describe('auth helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    vi.clearAllMocks()
    randomBytesMock.mockReset()
    randomBytesMock.mockImplementation(() => Buffer.from('default-token', 'utf-8'))
    prismaMocks.session.deleteMany.mockResolvedValue({ count: 0 })
    prismaMocks.session.update.mockResolvedValue(undefined)
    __resetSessionCleanupState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sanitizes user objects by removing sensitive fields', () => {
    const sanitized = sanitizeUser({
      id: 'user-1',
      email: 'test@example.com',
      name: null,
      password: 'secret',
      createdAt: new Date(),
    })

    expect(sanitized).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: null,
    })
  })

  it('hashes passwords using bcrypt', async () => {
    const result = await hashPassword('hunter2')
    expect(bcryptMocks.hash).toHaveBeenCalledWith('hunter2', 12)
    expect(result).toBe('hashed')
  })

  it('verifies passwords via bcrypt compare', async () => {
    const result = await verifyPassword('hunter2', 'hashed')
    expect(bcryptMocks.compare).toHaveBeenCalledWith('hunter2', 'hashed')
    expect(result).toBe(true)
  })

  it('creates sessions with random tokens and seven-day expiry', async () => {
    randomBytesMock.mockReturnValueOnce(Buffer.from('abcd', 'utf-8'))
    prismaMocks.session.create.mockResolvedValueOnce(undefined)

    const { token, expiresAt } = await createSession('user-1')

    expect(randomBytesMock).toHaveBeenCalledWith(32)
    expect(prismaMocks.session.deleteMany).toHaveBeenCalled()
    expect(prismaMocks.session.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        token,
        expiresAt,
      },
    })
    expect(expiresAt.toISOString()).toBe('2024-01-08T00:00:00.000Z')
  })

  it('returns sanitized session data when token is valid', async () => {
    const sessionRecord = {
      token: 'session-token',
      expiresAt: new Date('2024-01-02T00:00:00Z'),
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      },
    }
    prismaMocks.session.findUnique.mockResolvedValueOnce(sessionRecord)

    const result = await getSessionForToken('session-token')
    expect(prismaMocks.session.findUnique).toHaveBeenCalledWith({
      where: { token: 'session-token' },
      include: { user: true },
    })

    expect(result).toEqual({
      session: sessionRecord,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      },
    })
  })

  it('returns null and deletes expired sessions', async () => {
    prismaMocks.session.findUnique.mockResolvedValueOnce({
      token: 'session-token',
      expiresAt: new Date('2023-12-31T23:59:59Z'),
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    })
    prismaMocks.session.delete.mockResolvedValueOnce(undefined)

    const result = await getSessionForToken('session-token')
    expect(result).toBeNull()
    expect(prismaMocks.session.delete).toHaveBeenCalledWith({ where: { token: 'session-token' } })
  })

  it('returns null when no session exists', async () => {
    prismaMocks.session.findUnique.mockResolvedValueOnce(null)

    const result = await getSessionForToken('missing')
    expect(result).toBeNull()
  })

  it('refreshes session expiry when within threshold and refresh requested', async () => {
    const expiringSession = {
      token: 'session-token',
      expiresAt: new Date('2024-01-01T12:00:00Z'),
      user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    }
    prismaMocks.session.findUnique.mockResolvedValueOnce(expiringSession)

    await getSessionForToken('session-token', { refresh: true })

    expect(prismaMocks.session.update).toHaveBeenCalledWith({
      where: { token: 'session-token' },
      data: { expiresAt: new Date('2024-01-08T00:00:00.000Z') },
    })
  })

  it('skips refreshing when not requested', async () => {
    prismaMocks.session.findUnique.mockResolvedValueOnce({
      token: 'session-token',
      expiresAt: new Date('2024-01-01T12:00:00Z'),
      user: { id: 'user-1', email: 'a@b.com', name: 'Test' },
    })

    await getSessionForToken('session-token')

    expect(prismaMocks.session.update).not.toHaveBeenCalled()
  })

  it('silently ignores delete failures', async () => {
    prismaMocks.session.delete.mockRejectedValueOnce(new Error('not found'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await deleteSessionByToken('missing')

    expect(prismaMocks.session.delete).toHaveBeenCalledWith({ where: { token: 'missing' } })
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to delete session token:',
      expect.any(Error),
    )
    warnSpy.mockRestore()
  })

  it('exposes the session cookie constant for reuse', () => {
    expect(SESSION_COOKIE_NAME).toBe('crosswise_session')
  })

  it('exports a cleanup helper that deletes expired sessions', async () => {
    prismaMocks.session.deleteMany.mockResolvedValueOnce({ count: 3 })

    const result = await cleanupExpiredSessions()
    expect(prismaMocks.session.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: new Date('2024-01-01T00:00:00.000Z') } },
    })
    expect(result).toEqual({ count: 3 })
  })
})
