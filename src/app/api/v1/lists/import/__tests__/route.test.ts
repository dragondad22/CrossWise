import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { POST } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const {
  topicFindFirst,
  topicCreate,
  listFindFirst,
  listFindUnique,
  prismaTransaction,
} = vi.hoisted(() => ({
  topicFindFirst: vi.fn(),
  topicCreate: vi.fn(),
  listFindFirst: vi.fn(),
  listFindUnique: vi.fn(),
  prismaTransaction: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findFirst: topicFindFirst,
      create: topicCreate,
    },
    list: {
      findFirst: listFindFirst,
      findUnique: listFindUnique,
    },
    $transaction: prismaTransaction,
  },
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return {
    ...actual,
    getSessionForToken: mockSession,
  }
})

const importPayload = {
  topic: 'Animals',
  name: 'Wildlife',
  version: 1,
  items: [
    { answer: 'cat', clue: 'Feline friend' },
    { answer: 'dog', clue: 'Man’s best friend' },
    { answer: 'fox', clue: 'Sly woodland canine' },
    { answer: 'owl', clue: 'Nocturnal bird' },
    { answer: 'bear', clue: 'Hibernating giant' },
  ],
}

const importRequest = (cookie = `${SESSION_COOKIE_NAME}=token-123`) =>
  new NextRequest('http://localhost/api/v1/lists/import', {
    method: 'POST',
    body: JSON.stringify(importPayload),
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
  })

describe('/api/v1/lists/import POST handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  // Regression test for #55: the auto-create-Topic path must scope the lookup to the
  // authenticated user and create the topic owned by them.
  it('scopes the topic lookup by owner and auto-creates the topic owned by the importer', async () => {
    const topicId = 'ctopic1234567890123456789'
    topicFindFirst.mockResolvedValueOnce(null)
    topicCreate.mockResolvedValueOnce({ id: topicId, name: 'Animals', userId: 'user-1' })
    listFindFirst.mockResolvedValueOnce(null)

    const createdList = { id: 'clist1234567890123456789', topicId, name: 'Wildlife', source: 'UPLOAD' }
    prismaTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        list: { create: vi.fn(async () => createdList) },
        listItem: { create: vi.fn(async ({ data }: { data: object }) => ({ id: 'item-1', ...data })) },
      }),
    )
    listFindUnique.mockResolvedValueOnce({
      ...createdList,
      items: [],
      topic: { id: topicId, name: 'Animals' },
      _count: { items: 5, puzzles: 0 },
    })

    const response = await POST(importRequest())
    expect(response.status).toBe(201)

    expect(topicFindFirst).toHaveBeenCalledWith({
      where: { name: 'Animals', userId: 'user-1' },
    })
    expect(topicCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Animals', userId: 'user-1' }),
    })
  })

  it('reuses an existing topic only when it belongs to the importer', async () => {
    const topicId = 'ctopic1234567890123456789'
    topicFindFirst.mockResolvedValueOnce({ id: topicId, name: 'Animals', userId: 'user-1' })
    listFindFirst.mockResolvedValueOnce(null)

    const createdList = { id: 'clist1234567890123456789', topicId, name: 'Wildlife', source: 'UPLOAD' }
    prismaTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        list: { create: vi.fn(async () => createdList) },
        listItem: { create: vi.fn(async ({ data }: { data: object }) => ({ id: 'item-1', ...data })) },
      }),
    )
    listFindUnique.mockResolvedValueOnce({
      ...createdList,
      items: [],
      topic: { id: topicId, name: 'Animals' },
      _count: { items: 5, puzzles: 0 },
    })

    const response = await POST(importRequest())
    expect(response.status).toBe(201)

    expect(topicFindFirst).toHaveBeenCalledWith({
      where: { name: 'Animals', userId: 'user-1' },
    })
    expect(topicCreate).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated requests', async () => {
    mockSession.mockResolvedValueOnce(null)

    const response = await POST(importRequest(''))
    expect(response.status).toBe(401)
    expect(topicFindFirst).not.toHaveBeenCalled()
  })
})
