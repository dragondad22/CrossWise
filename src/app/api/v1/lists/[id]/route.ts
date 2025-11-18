import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { prisma } from '@/lib/db'
import { UpdateListSchema, normalizeAnswer } from '@/lib/validation'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: { message: 'Authentication required' } }, { status: 401 })

async function requireSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return getSessionForToken(token, { refresh: true })
}

function mapDifficulty(
  difficulty: number | 'EASY' | 'MEDIUM' | 'HARD' | undefined,
): 'EASY' | 'MEDIUM' | 'HARD' {
  if (typeof difficulty === 'string') {
    if (difficulty === 'EASY' || difficulty === 'MEDIUM' || difficulty === 'HARD') {
      return difficulty
    }
  }

  if (typeof difficulty === 'number') {
    if (difficulty <= 2) return 'EASY'
    if (difficulty <= 3) return 'MEDIUM'
    return 'HARD'
  }

  return 'MEDIUM'
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }
    const userId = session.user.id

    const { id } = await params
    const body = await request.json()
    const validated = UpdateListSchema.parse(body)

    const existingList = await prisma.list.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!existingList) {
      return NextResponse.json(
        { success: false, error: { message: 'List not found' } },
        { status: 404 },
      )
    }

    const normalizedItems = validated.items.map((item) => ({
      ...item,
      normalizedAnswer: normalizeAnswer(item.answer),
    }))

    const seenAnswers = new Set<string>()
    for (const item of normalizedItems) {
      if (seenAnswers.has(item.normalizedAnswer)) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'Duplicate answers detected after normalization' },
          },
          { status: 400 },
        )
      }
      seenAnswers.add(item.normalizedAnswer)
    }

    const existingIds = new Set(existingList.items.map((item) => item.id))
    const incomingIds = new Set(
      normalizedItems.filter((item) => item.id).map((item) => item.id as string),
    )

    const itemsToDelete = existingList.items
      .filter((item) => !incomingIds.has(item.id))
      .map((item) => item.id)

    await prisma.$transaction(async (tx) => {
      await tx.list.update({
        where: { id },
        data: {
          name: validated.name,
          ...(typeof validated.version === 'number' ? { version: validated.version } : {}),
        },
      })

      for (const item of normalizedItems) {
        const payload = {
          answer: item.normalizedAnswer,
          clue: item.clue,
          note: item.note?.trim() ? item.note : null,
          difficulty: mapDifficulty(item.difficulty),
        }

        if (item.id && existingIds.has(item.id)) {
          await tx.listItem.update({
            where: { id: item.id },
            data: payload,
          })
        } else {
          await tx.listItem.create({
            data: {
              listId: id,
              ...payload,
            },
          })
        }
      }

      if (itemsToDelete.length > 0) {
        await tx.listItem.deleteMany({
          where: { id: { in: itemsToDelete } },
        })
      }
    })

    const updatedList = await prisma.list.findUnique({
      where: { id },
      include: {
        topic: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
        puzzles: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { items: true, puzzles: true },
        },
      },
    })

    if (!updatedList) {
      return NextResponse.json(
        { success: false, error: { message: 'List not found after update' } },
        { status: 404 },
      )
    }

    let userSolves: {
      id: string
      puzzleId: string
      createdAt: Date
      updatedAt: Date
      completedAt: Date | null
      puzzle: { id: string; listId: string; createdAt: Date; seed: string | null }
    }[] = []

    userSolves = await prisma.solve.findMany({
      where: {
        userId,
        puzzle: { listId: id },
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
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedList,
        userSolves,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
        },
        { status: 400 },
      )
    }

    console.error('Failed to update list:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update list' } },
      { status: 500 },
    )
  }
}
