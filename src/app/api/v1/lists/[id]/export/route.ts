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
    const { id } = await params
    const list = await prisma.list.findFirst({
      where: { id, topic: { userId } },
      include: {
        topic: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!list) {
      return NextResponse.json(
        { success: false, error: { message: 'List not found' } },
        { status: 404 },
      )
    }

    // Format for export according to the PRP schema
    const exportData = {
      topic: list.topic.name,
      name: list.name,
      version: list.version,
      items: list.items.map((item) => ({
        answer: item.answer,
        clue: item.clue,
        ...(item.note && { note: item.note }),
        ...(item.difficulty && {
          difficulty: item.difficulty === 'EASY' ? 1 : item.difficulty === 'MEDIUM' ? 2 : 3,
        }),
      })),
    }

    const response = NextResponse.json(exportData)
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_v${list.version}.json"`,
    )

    return response
  } catch (error) {
    console.error('Failed to export list:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to export list' } },
      { status: 500 },
    )
  }
}
