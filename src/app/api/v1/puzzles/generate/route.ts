import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GeneratePuzzleSchema } from '@/lib/validation'
import { CrosswordGenerator, deriveListSeed } from '@/lib/crossword-generator'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: { message: 'Authentication required' } }, { status: 401 })

async function requireSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return getSessionForToken(token, { refresh: true })
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id
    const body = await request.json()
    const validated = GeneratePuzzleSchema.parse(body)
    const gridSize = validated.gridSize
      ? { rows: validated.gridSize.rows ?? 15, cols: validated.gridSize.cols ?? 15 }
      : { rows: 15, cols: 15 }

    // Fetch list with items
    const list = await prisma.list.findFirst({
      where: { id: validated.listId, topic: { userId } },
      include: {
        items: true,
      },
    })

    if (!list) {
      return NextResponse.json(
        { success: false, error: { message: 'List not found' } },
        { status: 404 },
      )
    }

    if (list.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'List has no items' } },
        { status: 400 },
      )
    }

    const items = list.items.map((item) => ({
      answer: item.answer,
      clue: item.clue,
    }))

    // Seed contract (#35, ADR-006): an explicit seed is used verbatim; otherwise the
    // default is derived from the list id + content, never from the clock. The same
    // (list, seed) always reproduces the same puzzle — the generator's seeded RNG
    // drives both word selection (up to 150 items) and placement.
    const seed = validated.seed || deriveListSeed(list.id, items)

    const generator = new CrosswordGenerator({
      gridSize,
      seed,
      maxAttempts: 300,
      maxWords: 150,
    })

    const result = generator.generate(items)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to generate puzzle',
            details: {
              placedWords: result.placedWords,
              totalWords: result.totalWords,
              conflictingWords: result.conflictingWords,
            },
          },
        },
        { status: 422 },
      )
    }

    // Save puzzle to database
    const puzzle = await prisma.puzzle.create({
      data: {
        listId: validated.listId,
        seed,
        grid: JSON.stringify(result.grid),
        numbering: JSON.stringify(result.numbering),
        settings: JSON.stringify({
          gridSize,
          checkMode: 'word',
          symmetry: false,
          allowHyphens: false,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        puzzleId: puzzle.id,
        grid: result.grid,
        numbering: result.numbering,
        seed: puzzle.seed,
        placedWords: result.placedWords,
        totalWords: result.totalWords,
      },
    })
  } catch (error) {
    console.error('Failed to generate puzzle:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data' } },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate puzzle' } },
      { status: 500 },
    )
  }
}
