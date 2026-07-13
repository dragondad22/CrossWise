import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../password/forgot/route'
import { __resetRateLimit } from '@/lib/rate-limit'

const { userFindUnique } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
}))

const createPasswordResetTokenMock = vi.hoisted(() => vi.fn())
const sendPasswordResetEmailMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: userFindUnique,
    },
  },
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    createPasswordResetToken: createPasswordResetTokenMock,
  }
})

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: sendPasswordResetEmailMock,
}))

function forgotRequest(body: unknown, ip = '203.0.113.7') {
  return new NextRequest('http://localhost/api/v1/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  })
}

describe('POST /api/v1/auth/password/forgot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __resetRateLimit()
    createPasswordResetTokenMock.mockResolvedValue({
      token: 'raw-reset-token-abc123',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    sendPasswordResetEmailMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    __resetRateLimit()
  })

  it('creates a reset token and delivers the link for a known email', async () => {
    userFindUnique.mockResolvedValueOnce({ id: 'user-1', email: 'known@example.com' })

    const response = await POST(forgotRequest({ email: 'Known@Example.com' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(userFindUnique).toHaveBeenCalledWith({ where: { email: 'known@example.com' } })
    expect(createPasswordResetTokenMock).toHaveBeenCalledWith('user-1')
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
      'known@example.com',
      'http://localhost/reset-password?token=raw-reset-token-abc123',
    )
  })

  it('returns a byte-identical response for unknown and known emails (no enumeration)', async () => {
    userFindUnique.mockResolvedValueOnce({ id: 'user-1', email: 'known@example.com' })
    const knownResponse = await POST(forgotRequest({ email: 'known@example.com' }, '203.0.113.1'))
    const knownBody = await knownResponse.text()

    userFindUnique.mockResolvedValueOnce(null)
    const unknownResponse = await POST(
      forgotRequest({ email: 'nobody@example.com' }, '203.0.113.2'),
    )
    const unknownBody = await unknownResponse.text()

    expect(unknownResponse.status).toBe(knownResponse.status)
    expect(unknownBody).toBe(knownBody)
  })

  it('never creates a token or sends email for an unknown email', async () => {
    userFindUnique.mockResolvedValueOnce(null)

    const response = await POST(forgotRequest({ email: 'nobody@example.com' }))

    expect(response.status).toBe(200)
    expect(createPasswordResetTokenMock).not.toHaveBeenCalled()
    expect(sendPasswordResetEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed email with 400', async () => {
    const response = await POST(forgotRequest({ email: 'not-an-email' }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(userFindUnique).not.toHaveBeenCalled()
  })

  it('still returns the generic success when token creation fails (no leak via errors)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    userFindUnique.mockResolvedValueOnce({ id: 'user-1', email: 'known@example.com' })
    createPasswordResetTokenMock.mockRejectedValueOnce(new Error('db down'))

    const response = await POST(forgotRequest({ email: 'known@example.com' }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('rate limits repeated requests from the same client (interim guard, #89)', async () => {
    userFindUnique.mockResolvedValue(null)

    for (let i = 0; i < 5; i += 1) {
      const response = await POST(forgotRequest({ email: 'nobody@example.com' }, '198.51.100.9'))
      expect(response.status).toBe(200)
    }

    const blocked = await POST(forgotRequest({ email: 'nobody@example.com' }, '198.51.100.9'))
    const payload = await blocked.json()

    expect(blocked.status).toBe(429)
    expect(payload.success).toBe(false)
  })
})
