import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateSolveStateSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const solve = await prisma.solve.findFirst({
      where: { 
        puzzleId: params.id,
        userId: null // Single-user mode for v1
      },
      include: {
        puzzle: {
          include: {
            list: {
              include: {
                topic: true,
                items: true
              }
            }
          }
        }
      }
    })
    
    if (!solve) {
      return NextResponse.json(
        { success: false, error: { message: 'Solve state not found' } },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: solve.id,
        state: JSON.parse(solve.state),
        completedAt: solve.completedAt,
        puzzle: {
          id: solve.puzzle.id,
          grid: JSON.parse(solve.puzzle.grid),
          numbering: JSON.parse(solve.puzzle.numbering),
          settings: JSON.parse(solve.puzzle.settings),
          seed: solve.puzzle.seed,
          list: solve.puzzle.list
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch solve state:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch solve state' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = UpdateSolveStateSchema.parse(body)
    
    // Check if puzzle exists
    const puzzle = await prisma.puzzle.findUnique({
      where: { id: params.id }
    })
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: { message: 'Puzzle not found' } },
        { status: 404 }
      )
    }
    
    // Find existing solve state or create new one
    const existingSolve = await prisma.solve.findFirst({
      where: {
        puzzleId: params.id,
        userId: null // Single-user mode
      }
    })
    
    let solve
    if (existingSolve) {
      solve = await prisma.solve.update({
        where: { id: existingSolve.id },
        data: {
          state: validated.state,
          completedAt: validated.completed ? new Date() : null
        }
      })
    } else {
      solve = await prisma.solve.create({
        data: {
          puzzleId: params.id,
          userId: null,
          state: validated.state,
          completedAt: validated.completed ? new Date() : null
        }
      })
    }
    
    return NextResponse.json({ success: true, data: solve })
  } catch (error) {
    console.error('Failed to update solve state:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update solve state' } },
      { status: 500 }
    )
  }
}