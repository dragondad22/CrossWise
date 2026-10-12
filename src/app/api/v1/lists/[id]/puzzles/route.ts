import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { requireSession } from '@/lib/api-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (session.response) return session.response

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
