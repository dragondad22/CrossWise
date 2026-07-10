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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id
    const { id } = await params
    const topic = await prisma.topic.findFirst({
      where: { id, userId },
      include: {
        lists: {
          include: {
            _count: {
              select: { items: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: topic })
  } catch (error) {
    console.error('Failed to fetch topic:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch topic' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id
    const { id } = await params
    const body = await request.json()
    const validated = CreateTopicSchema.parse(body)

    const owned = await prisma.topic.findFirst({ where: { id, userId } })
    if (!owned) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 },
      )
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: validated,
      include: {
        _count: {
          select: { lists: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: topic })
  } catch (error) {
    console.error('Failed to update topic:', error)

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to update topic' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(request)
    if (!session?.user) {
      return unauthorizedResponse()
    }

    const userId = session.user.id
    const { id } = await params

    const owned = await prisma.topic.findFirst({ where: { id, userId } })
    if (!owned) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 },
      )
    }

    await prisma.topic.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Failed to delete topic:', error)

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete topic' } },
      { status: 500 },
    )
  }
}
