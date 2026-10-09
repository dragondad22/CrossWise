// @vitest-environment node
import { createHmac } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../route'

const userDeleteMany = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({ prisma: { user: { deleteMany: userDeleteMany } } }))

const SECRET = 'test-webhook-secret'

function sign(timestamp: string, body: string, secret = SECRET) {
  return `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`
}

function deliver(
  body: string,
  {
    timestamp = String(Math.floor(Date.now() / 1000)),
    signature,
  }: { timestamp?: string; signature?: string } = {},
) {
  return POST(
    new NextRequest('http://localhost/api/v1/internal/account-deleted', {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'x-alpaca-timestamp': timestamp,
        'x-alpaca-signature': signature ?? sign(timestamp, body),
      },
    }),
  )
}

const BODY = JSON.stringify({ userId: 'user-1' })

describe('POST /api/v1/internal/account-deleted', () => {
  beforeEach(() => {
    process.env.ACCOUNT_WEBHOOK_SECRET = SECRET
    userDeleteMany.mockReset().mockResolvedValue({ count: 1 })
  })

  afterEach(() => {
    delete process.env.ACCOUNT_WEBHOOK_SECRET
  })

  it('deletes the user (and so all their data) for a valid signed request', async () => {
    const response = await deliver(BODY)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, data: { deleted: 1 } })
    expect(userDeleteMany).toHaveBeenCalledWith({ where: { id: 'user-1' } })
  })

  it('succeeds again for a repeat delivery', async () => {
    userDeleteMany.mockResolvedValueOnce({ count: 0 })
    const response = await deliver(BODY)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, data: { deleted: 0 } })
  })

  it('refuses everything when the secret is not configured', async () => {
    delete process.env.ACCOUNT_WEBHOOK_SECRET
    expect((await deliver(BODY)).status).toBe(503)
    expect(userDeleteMany).not.toHaveBeenCalled()
  })

  it('rejects a missing signature', async () => {
    expect((await deliver(BODY, { signature: '' })).status).toBe(401)
    expect(userDeleteMany).not.toHaveBeenCalled()
  })

  it('rejects a signature made with another secret', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = sign(timestamp, BODY, 'wrong-secret')
    expect((await deliver(BODY, { timestamp, signature })).status).toBe(401)
    expect(userDeleteMany).not.toHaveBeenCalled()
  })

  it('rejects a body changed after signing', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = sign(timestamp, BODY)
    const tampered = JSON.stringify({ userId: 'someone-else' })
    expect((await deliver(tampered, { timestamp, signature })).status).toBe(401)
    expect(userDeleteMany).not.toHaveBeenCalled()
  })

  it.each([
    ['older than five minutes', String(Math.floor(Date.now() / 1000) - 6 * 60)],
    ['from the future', String(Math.floor(Date.now() / 1000) + 6 * 60)],
    ['not a number', 'yesterday'],
    ['missing', ''],
  ])('rejects a timestamp that is %s', async (_label, timestamp) => {
    expect((await deliver(BODY, { timestamp })).status).toBe(401)
    expect(userDeleteMany).not.toHaveBeenCalled()
  })

  it('accepts the fixed vector the accounts service signs with', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)
    const response = await deliver('{"userId":"user-1"}', {
      timestamp: '1700000000',
      signature: 'v1=521caa95b8aaa409b533440b5650fbbaff5e67c130e0eefcd6625c5ae0053566',
    })
    expect(response.status).toBe(200)
  })

  it('rejects a signed body without a userId', async () => {
    expect((await deliver(JSON.stringify({ id: 'user-1' }))).status).toBe(400)
    expect((await deliver('not json')).status).toBe(400)
    expect(userDeleteMany).not.toHaveBeenCalled()
  })
})
