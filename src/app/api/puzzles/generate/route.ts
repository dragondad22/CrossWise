import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GeneratePuzzleSchema } from '@/lib/validation'
import { CrosswordGenerator } from '@/lib/crossword-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = GeneratePuzzleSchema.parse(body)
    
    // Fetch list with items
    const list = await prisma.list.findUnique({
      where: { id: validated.listId },
      include: {
        items: true
      }
    })
    
    if (!list) {
      return NextResponse.json(
        { success: false, error: { message: 'List not found' } },
        { status: 404 }
      )
    }
    
    if (list.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'List has no items' } },
        { status: 400 }
      )
    }
    
    // Determine number of items to use (random selection up to 25)
    const maxItems = Math.min(25, list.items.length)
    const itemsToUse = list.items
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, maxItems)
      .map(item => ({
        answer: item.answer,
        clue: item.clue
      }))
    
    // Generate puzzle
    const generator = new CrosswordGenerator({
      gridSize: validated.gridSize,
      seed: validated.seed || `${Date.now()}_${list.id}`,
      maxAttempts: 300
    })
    
    const result = generator.generate(itemsToUse)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Failed to generate puzzle',
          details: {
            placedWords: result.placedWords,
            totalWords: result.totalWords,
            conflictingWords: result.conflictingWords
          }
        }
      }, { status: 422 })
    }
    
    // Save puzzle to database
    const puzzle = await prisma.puzzle.create({
      data: {
        listId: validated.listId,
        seed: validated.seed || `${Date.now()}_${list.id}`,
        grid: JSON.stringify(result.grid),
        numbering: JSON.stringify(result.numbering),
        settings: JSON.stringify({
          gridSize: validated.gridSize || { rows: 15, cols: 15 },
          checkMode: 'word',
          symmetry: false,
          allowHyphens: false
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        puzzleId: puzzle.id,
        grid: result.grid,
        numbering: result.numbering,
        seed: puzzle.seed,
        placedWords: result.placedWords,
        totalWords: result.totalWords
      }
    })
  } catch (error) {
    console.error('Failed to generate puzzle:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data' } },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate puzzle' } },
      { status: 500 }
    )
  }
}