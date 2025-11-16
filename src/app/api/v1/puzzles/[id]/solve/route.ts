import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

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

    const session = await getSessionForToken(token, { refresh: true })

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

    const session = await getSessionForToken(token, { refresh: true })

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

    const now = new Date()
    const existingSolve = await prisma.solve.findUnique({
      where: {
        puzzleId_userId: {
          puzzleId: id,
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        completedAt: true,
      },
    })

    const completedAt = validated.completed ? existingSolve?.completedAt ?? now : null

    let solve

    if (existingSolve) {
      try {
        solve = await prisma.solve.update({
          where: {
            puzzleId_userId: {
              puzzleId: id,
              userId: session.user.id,
            },
          },
          data: {
            state: validated.state,
            completedAt,
          },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          // The record was deleted between the read and update; fall back to create.
          solve = await prisma.solve.create({
            data: {
              puzzleId: id,
              userId: session.user.id,
              state: validated.state,
              completedAt,
            },
          })
        } else {
          throw error
        }
      }
    } else {
      try {
        solve = await prisma.solve.create({
          data: {
            puzzleId: id,
            userId: session.user.id,
            state: validated.state,
            completedAt,
          },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          solve = await prisma.solve.update({
            where: {
              puzzleId_userId: {
                puzzleId: id,
                userId: session.user.id,
              },
            },
            data: {
              state: validated.state,
              completedAt,
            },
          })
        } else {
          throw error
        }
      }
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
