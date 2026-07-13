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

    // Fetch list with items
    const list = await prisma.list.findFirst({
      where: { id: validated.listId, topic: { userId } },
      include: {
        // Stable fetch order: Postgres row order is unspecified and the generator's
        // determinism contract must not depend on it (#77). The generator also
        // canonicalizes internally — this is defense in depth.
        items: { orderBy: { id: 'asc' } },
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

    // When the caller pins a grid size we honour it exactly. Otherwise walk a
    // fixed ladder of sizes: many realistic lists cannot fully fit on 15x15, and
    // a bigger grid beats silently dropping words (#99). The ladder is a pure
    // function of (items, seed), so the determinism contract (ADR-006) holds.
    const gridSizes = validated.gridSize
      ? [{ rows: validated.gridSize.rows ?? 15, cols: validated.gridSize.cols ?? 15 }]
      : [15, 17, 19].map((size) => ({ rows: size, cols: size }))

    let best: { result: ReturnType<CrosswordGenerator['generate']>; gridSize: (typeof gridSizes)[0] } | null =
      null
    for (const gridSize of gridSizes) {
      const generator = new CrosswordGenerator({
        gridSize,
        seed,
        maxAttempts: 300,
        maxWords: 150,
      })
      const result = generator.generate(items)
      if (!best || result.placedWords > best.result.placedWords) {
        best = { result, gridSize }
      }
      if (result.placedWords === result.totalWords) {
        break // everything fits — no reason to grow the grid further
      }
    }

    const { result, gridSize } = best!

    // A puzzle needs at least two crossing words to be worth solving. Below that,
    // fail with the full unplaced list so the author can fix the source list.
    if (!result.grid || !result.numbering || result.placedWords < 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              'These words could not be placed together — they share too few letters. Try splitting the list or adding words with more overlap.',
            details: {
              placedWords: result.placedWords,
              totalWords: result.totalWords,
              unplacedWords: result.unplacedWords,
            },
          },
        },
        { status: 422 },
      )
    }

    // Save puzzle to database. A partial puzzle (some words unplaced) is accepted;
    // the unplaced list is persisted so the solve UI can disclose it (#99).
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
          unplacedWords: result.unplacedWords,
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
        unplacedWords: result.unplacedWords,
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
