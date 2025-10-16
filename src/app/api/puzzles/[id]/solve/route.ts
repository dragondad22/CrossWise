import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateSolveStateSchema } from '@/lib/validation'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const session = await getSessionForToken(token)

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 },
      )
    }

    // First, get the puzzle data
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            topic: true,
            items: true,
          },
        },
      },
    })

    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: { message: 'Puzzle not found' } },
        { status: 404 },
      )
    }

    // Try to find existing solve state
    const solve = await prisma.solve.findFirst({
      where: {
        puzzleId: id,
        userId: session.user.id,
      },
    })

    let parsedState: unknown = null
    if (solve) {
      try {
        parsedState = JSON.parse(solve.state)
      } catch (error) {
        console.warn('Failed to parse stored solve state:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: solve?.id || null,
        state: parsedState,
        completedAt: solve?.completedAt || null,
        puzzle: {
          id: puzzle.id,
          grid: JSON.parse(puzzle.grid),
          numbering: JSON.parse(puzzle.numbering),
          settings: JSON.parse(puzzle.settings),
          seed: puzzle.seed,
          list: puzzle.list,
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch solve state:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch solve state' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = UpdateSolveStateSchema.parse(body)
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const session = await getSessionForToken(token)

    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 },
      )
    }

    if (validated.puzzleId !== id) {
      return NextResponse.json(
        { success: false, error: { message: 'Puzzle ID mismatch' } },
        { status: 400 },
      )
    }

    // Check if puzzle exists
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
    })

    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: { message: 'Puzzle not found' } },
        { status: 404 },
      )
    }

    // Find existing solve state or create new one
    const existingSolve = await prisma.solve.findFirst({
      where: {
        puzzleId: id,
        userId: session.user.id,
      },
    })

    const now = new Date()
    const completedAt = validated.completed ? (existingSolve?.completedAt ?? now) : null

    let solve
    if (existingSolve) {
      solve = await prisma.solve.update({
        where: { id: existingSolve.id },
        data: {
          state: validated.state,
          completedAt,
          userId: session.user.id,
        },
      })
    } else {
      solve = await prisma.solve.create({
        data: {
          puzzleId: id,
          userId: session.user.id,
          state: validated.state,
          completedAt,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: { id: solve.id, completedAt: solve.completedAt },
    })
  } catch (error) {
    console.error('Failed to update solve state:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update solve state' } },
      { status: 500 },
    )
  }
}
