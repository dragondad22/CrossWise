import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listId = params.id

    const puzzles = await prisma.puzzle.findMany({
      where: {
        listId: listId,
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
