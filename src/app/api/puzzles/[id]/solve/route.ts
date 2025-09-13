import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UpdateSolveStateSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // First, get the puzzle data
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            topic: true,
            items: true
          }
        }
      }
    })
    
    if (!puzzle) {
      return NextResponse.json(
        { success: false, error: { message: 'Puzzle not found' } },
        { status: 404 }
      )
    }
    
    // Try to find existing solve state
    const solve = await prisma.solve.findFirst({
      where: { 
        puzzleId: id,
        userId: null // Single-user mode for v1
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: solve?.id || null,
        state: solve ? JSON.parse(solve.state) : null,
        completedAt: solve?.completedAt || null,
        puzzle: {
          id: puzzle.id,
          grid: JSON.parse(puzzle.grid),
          numbering: JSON.parse(puzzle.numbering),
          settings: JSON.parse(puzzle.settings),
          seed: puzzle.seed,
          list: puzzle.list
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = UpdateSolveStateSchema.parse(body)
    
    // Check if puzzle exists
    const puzzle = await prisma.puzzle.findUnique({
      where: { id }
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
        puzzleId: id,
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
          puzzleId: id,
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