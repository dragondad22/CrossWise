import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: { message: 'Authentication required' } }, { status: 401 })

async function requireSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return getSessionForToken(token, { refresh: true })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id
    const { id: listId } = await params

    const puzzles = await prisma.puzzle.findMany({
      where: {
        listId,
        list: { topic: { userId } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 most recent puzzles
    })

    return NextResponse.json({
      success: true,
      data: puzzles,
    })
  } catch (error) {
    console.error('Error fetching puzzles:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch puzzles',
        },
      },
      { status: 500 },
    )
  }
}
