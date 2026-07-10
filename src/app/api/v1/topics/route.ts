import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateTopicSchema } from '@/lib/validation'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

const unauthorizedResponse = () =>
  NextResponse.json({ success: false, error: { message: 'Authentication required' } }, { status: 401 })

async function requireSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return getSessionForToken(token, { refresh: true })
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id

    const topics = await prisma.topic.findMany({
      where: { userId },
      include: {
        _count: {
          select: { lists: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: topics })
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch topics' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    console.log('Received topic creation request:', body)
    const validated = CreateTopicSchema.parse(body)
    const userId = session.user.id

    const topic = await prisma.topic.create({
      data: { ...validated, userId },
      include: {
        _count: {
          select: { lists: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: topic }, { status: 201 })
  } catch (error) {
    console.error('Failed to create topic:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid topic data', details: error.message } },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic name already exists' } },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to create topic',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    )
  }
}
