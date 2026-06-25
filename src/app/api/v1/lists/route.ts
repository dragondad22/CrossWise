import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateListSchema } from '@/lib/validation'
import { normalizeAnswer } from '@/lib/validation'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: { message: 'Authentication required' } }, { status: 401 })

async function requireSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return getSessionForToken(token, { refresh: true })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topicId')

  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }
    const userId = session.user.id

    const where = { topic: { userId }, ...(topicId ? { topicId } : {}) }

    const lists = await prisma.list.findMany({
      where,
      include: {
        topic: true,
        items: true,
        puzzles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { items: true, puzzles: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const listIds = lists.map((list) => list.id)

    if (listIds.length === 0) {
      return NextResponse.json({ success: true, data: lists })
    }

    const userSolves = await prisma.solve.findMany({
      where: {
        userId,
        puzzle: {
          listId: {
            in: listIds,
          },
        },
      },
      select: {
        id: true,
        puzzleId: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
        puzzle: {
          select: {
            id: true,
            listId: true,
            createdAt: true,
            seed: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const solvesByList = userSolves.reduce<Record<string, typeof userSolves>>((acc, solve) => {
      const listIdForSolve = solve.puzzle.listId
      if (!acc[listIdForSolve]) {
        acc[listIdForSolve] = []
      }
      acc[listIdForSolve].push(solve)
      return acc
    }, {})

    const listsWithUserSolves = lists.map((list) => ({
      ...list,
      userSolves: solvesByList[list.id] ?? [],
    }))

    return NextResponse.json({ success: true, data: listsWithUserSolves })
  } catch (error) {
    console.error('Failed to fetch lists:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch lists' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id
    const body = await request.json()
    const validated = CreateListSchema.parse(body)

    // Check if topic exists and is owned by the user
    const topic = await prisma.topic.findFirst({
      where: { id: validated.topicId, userId },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 },
      )
    }

    // Create list and items in transaction
    const result = await prisma.$transaction(async (tx) => {
      const list = await tx.list.create({
        data: {
          topicId: validated.topicId,
          name: validated.name,
          source: 'UPLOAD',
        },
      })

      // Create items with normalized answers
      const items = await Promise.all(
        validated.items.map((item) =>
          tx.listItem.create({
            data: {
              listId: list.id,
              answer: normalizeAnswer(item.answer),
              clue: item.clue,
              note: item.note,
              difficulty:
                typeof item.difficulty === 'number'
                  ? item.difficulty <= 2
                    ? 'EASY'
                    : item.difficulty <= 3
                      ? 'MEDIUM'
                      : 'HARD'
                  : item.difficulty || 'MEDIUM',
            },
          }),
        ),
      )

      return { list, items }
    })

    // Fetch complete list with relations
    const completeList = await prisma.list.findUnique({
      where: { id: result.list.id },
      include: {
        topic: true,
        items: true,
        _count: {
          select: { items: true, puzzles: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: completeList }, { status: 201 })
  } catch (error) {
    console.error('Failed to create list:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create list' } },
      { status: 500 },
    )
  }
}
