import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET, POST } from '../route'
import { SESSION_COOKIE_NAME } from '@/lib/auth'

const {
  listFindMany,
  listFindUnique,
  solveFindMany,
  topicFindUnique,
  prismaTransaction,
} = vi.hoisted(() => ({
  listFindMany: vi.fn(),
  listFindUnique: vi.fn(),
  solveFindMany: vi.fn(),
  topicFindUnique: vi.fn(),
  prismaTransaction: vi.fn(),
}))

const mockSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  prisma: {
    list: {
      findMany: listFindMany,
      findUnique: listFindUnique,
    },
    solve: {
      findMany: solveFindMany,
    },
    topic: {
      findUnique: topicFindUnique,
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

describe('/api/v1/lists route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession.mockReset()
    mockSession.mockResolvedValue({ user: { id: 'user-1' } })
  })

  it('fetches lists and attaches user solves when a session exists', async () => {
    const lists = [
      {
        id: 'clist1234567890123456789',
        name: 'Animals',
        topicId: 'ctopic1234567890123456789',
        items: [],
        puzzles: [{ id: 'p1', createdAt: new Date() }],
        _count: { items: 0, puzzles: 1 },
        topic: { id: 'ctopic1234567890123456789', name: 'Topics' },
      },
    ]
    listFindMany.mockResolvedValueOnce(lists)
    solveFindMany.mockResolvedValueOnce([
      {
        id: 'solve-1',
        puzzleId: 'p1',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        puzzle: {
          id: 'p1',
          listId: 'clist1234567890123456789',
          createdAt: new Date(),
          seed: 'seed',
        },
      },
    ])

    const request = new NextRequest('http://localhost/api/v1/lists', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(mockSession).toHaveBeenCalledWith('token-123', { refresh: true })
    expect(solveFindMany).toHaveBeenCalled()
    expect(payload.data[0].userSolves).toHaveLength(1)
  })

  it('propagates database errors on GET', async () => {
    listFindMany.mockRejectedValueOnce(new Error('db down'))

    const request = new NextRequest('http://localhost/api/v1/lists', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error.message).toMatch(/Failed to fetch lists/)
  })

  it('rejects GET requests without authentication', async () => {
    mockSession.mockResolvedValueOnce(null)
    const response = await GET(new NextRequest('http://localhost/api/v1/lists'))
    expect(response.status).toBe(401)
  })

  it('creates a list with normalized items on POST', async () => {
    const topicId = 'ctopic1234567890123456789'
    topicFindUnique.mockResolvedValueOnce({ id: topicId, name: 'Animals' })

    const createdList = { id: 'clist1234567890123456789', topicId, name: 'Wildlife', source: 'UPLOAD' }

    type MockListItemData = {
      listId: string
      answer: string
      clue: string
      note?: string | null
      difficulty?: string
    }

    type MockListItemRecord = MockListItemData & { id: string }

    const createdItems: MockListItemRecord[] = []

    const listCreateMock = vi.fn(async () => createdList)

    const listItemCreateMock = vi.fn(
      async ({ data }: { data: MockListItemData }) => {
        const created: MockListItemRecord = { id: `item-${createdItems.length + 1}`, ...data }
        createdItems.push(created)
        return created
      },
    )

    type MockTransactionClient = {
      list: { create: typeof listCreateMock }
      listItem: { create: typeof listItemCreateMock }
    }

    prismaTransaction.mockImplementationOnce(
      async (callback: (client: MockTransactionClient) => Promise<{ list: typeof createdList; items: MockListItemRecord[] }>) => {
        const tx: MockTransactionClient = {
          list: { create: listCreateMock },
          listItem: { create: listItemCreateMock },
        }
        return callback(tx)
      },
    )

    listFindUnique.mockResolvedValueOnce({
      ...createdList,
      items: createdItems,
      topic: { id: topicId, name: 'Animals' },
      _count: { items: 2, puzzles: 0 },
    })

    const payload = {
      topicId,
      name: 'Wildlife',
      items: [
        { answer: 'cat', clue: 'Feline friend' },
        { answer: 'dog', clue: 'Man’s best friend', difficulty: 5 },
      ],
    }

    const request = new NextRequest('http://localhost/api/v1/lists', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(topicFindUnique).toHaveBeenCalledWith({ where: { id: topicId } })
    expect(prismaTransaction).toHaveBeenCalled()
    expect(body.data.items).toHaveLength(2)
    expect(body.data.items[0].answer).toBe('CAT')
    expect(body.data.items[1].difficulty).toBe('HARD')
  })

  it('returns 404 when posting to a missing topic', async () => {
    topicFindUnique.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost/api/v1/lists', {
      method: 'POST',
      body: JSON.stringify({
        topicId: 'ckmissingtopic1234567890123',
        name: 'Wildlife',
        items: [{ answer: 'cat', clue: 'Feline friend' }],
      }),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
    const payload = await response.json()
    expect(payload.error.message).toMatch(/Topic not found/)
    expect(prismaTransaction).not.toHaveBeenCalled()
  })

  it('handles transactional failures gracefully', async () => {
    topicFindUnique.mockResolvedValueOnce({ id: 'ctopic1234567890123456789' })
    prismaTransaction.mockRejectedValueOnce(new Error('transaction failed'))

    const request = new NextRequest('http://localhost/api/v1/lists', {
      method: 'POST',
      body: JSON.stringify({
        topicId: 'ctopic1234567890123456789',
        name: 'Wildlife',
        items: [{ answer: 'cat', clue: 'Feline friend' }],
      }),
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE_NAME}=token-123` },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error.message).toMatch(/Failed to create list/)
  })

  it('rejects POST requests without authentication', async () => {
    mockSession.mockResolvedValueOnce(null)
    const request = new NextRequest('http://localhost/api/v1/lists', {
      method: 'POST',
      body: JSON.stringify({
        topicId: 'ctopic1234567890123456789',
        name: 'Wildlife',
        items: [{ answer: 'cat', clue: 'Feline friend' }],
      }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
