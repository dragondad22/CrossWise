import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../password/reset/route'
import { __resetRateLimit } from '@/lib/rate-limit'

const { userUpdate } = vi.hoisted(() => ({
  userUpdate: vi.fn(),
}))

const consumePasswordResetTokenMock = vi.hoisted(() => vi.fn())
const deleteSessionsForUserMock = vi.hoisted(() => vi.fn())
const hashPasswordMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      update: userUpdate,
    },
  },
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    consumePasswordResetToken: consumePasswordResetTokenMock,
    deleteSessionsForUser: deleteSessionsForUserMock,
    hashPassword: hashPasswordMock,
  }
})

function resetRequest(body: unknown, ip = '203.0.113.50') {
  return new NextRequest('http://localhost/api/v1/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  })
}

describe('POST /api/v1/auth/password/reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetRateLimit()
    hashPasswordMock.mockResolvedValue('bcrypt-hashed-password')
    deleteSessionsForUserMock.mockResolvedValue({ count: 2 })
    userUpdate.mockResolvedValue({ id: 'user-1' })
  })

  afterEach(() => {
    __resetRateLimit()
  })

  it('resets the password (bcrypt-hashed) and revokes all sessions for a valid token', async () => {
    consumePasswordResetTokenMock.mockResolvedValueOnce('user-1')

    const response = await POST(
      resetRequest({ token: 'valid-raw-token', newPassword: 'brandnewpass' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(consumePasswordResetTokenMock).toHaveBeenCalledWith('valid-raw-token')
    expect(hashPasswordMock).toHaveBeenCalledWith('brandnewpass')
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'bcrypt-hashed-password' },
    })
    expect(deleteSessionsForUserMock).toHaveBeenCalledWith('user-1')

    // The plaintext password must never be written to the database.
    expect(JSON.stringify(userUpdate.mock.calls[0][0])).not.toContain('brandnewpass')
  })

  it('rejects an invalid/forged token with a generic error and no side effects', async () => {
    consumePasswordResetTokenMock.mockResolvedValueOnce(null)

    const response = await POST(
      resetRequest({ token: 'forged-token', newPassword: 'brandnewpass' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(payload.error.message).toBe(
      'This reset link is invalid or has expired. Please request a new one.',
    )
    expect(userUpdate).not.toHaveBeenCalled()
    expect(deleteSessionsForUserMock).not.toHaveBeenCalled()
  })

  it('rejects expired and already-used tokens with the same generic error', async () => {
    // consumePasswordResetToken returns null for expired and consumed tokens alike;
    // the route must not distinguish the cases in its response.
    consumePasswordResetTokenMock.mockResolvedValue(null)

    const expired = await POST(
      resetRequest({ token: 'expired-token', newPassword: 'brandnewpass' }, '203.0.113.51'),
    )
    const reused = await POST(
      resetRequest({ token: 'used-token', newPassword: 'brandnewpass' }, '203.0.113.52'),
    )

    expect(expired.status).toBe(400)
    expect(reused.status).toBe(400)
    expect(await expired.text()).toBe(await reused.text())
  })

  it('cannot be reused: the second reset with the same token fails', async () => {
    consumePasswordResetTokenMock.mockResolvedValueOnce('user-1').mockResolvedValueOnce(null)

    const first = await POST(
      resetRequest({ token: 'single-use-token', newPassword: 'brandnewpass' }, '203.0.113.53'),
    )
    const second = await POST(
      resetRequest({ token: 'single-use-token', newPassword: 'differentpass' }, '203.0.113.54'),
    )

    expect(first.status).toBe(200)
    expect(second.status).toBe(400)
    expect(userUpdate).toHaveBeenCalledTimes(1)
  })

  it("only ever resets the token owner's password (user A token cannot touch user B)", async () => {
    consumePasswordResetTokenMock.mockResolvedValueOnce('user-a')

    const response = await POST(
      resetRequest({ token: 'user-a-token', newPassword: 'brandnewpass' }),
    )

    expect(response.status).toBe(200)
    expect(userUpdate).toHaveBeenCalledTimes(1)
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-a' } }),
    )
  })

  it('rejects a policy-violating password before consuming the token', async () => {
    const response = await POST(resetRequest({ token: 'valid-raw-token', newPassword: 'short' }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(consumePasswordResetTokenMock).not.toHaveBeenCalled()
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('rejects a missing/empty token generically', async () => {
    const response = await POST(resetRequest({ token: '', newPassword: 'brandnewpass' }))

    expect(response.status).toBe(400)
    expect(consumePasswordResetTokenMock).not.toHaveBeenCalled()
    expect(userUpdate).not.toHaveBeenCalled()
  })

  it('rate limits repeated attempts from the same client (interim guard, #89)', async () => {
    consumePasswordResetTokenMock.mockResolvedValue(null)

    for (let i = 0; i < 5; i += 1) {
      const response = await POST(
        resetRequest({ token: 'guess', newPassword: 'brandnewpass' }, '198.51.100.20'),
      )
      expect(response.status).toBe(400)
    }

    const blocked = await POST(
      resetRequest({ token: 'guess', newPassword: 'brandnewpass' }, '198.51.100.20'),
    )

    expect(blocked.status).toBe(429)
  })
})
