import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateTopicSchema } from '@/lib/validation'

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        _count: {
          select: { lists: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ success: true, data: topics })
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch topics' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received topic creation request:', body)
    const validated = CreateTopicSchema.parse(body)
    
    const topic = await prisma.topic.create({
      data: validated,
      include: {
        _count: {
          select: { lists: true }
        }
      }
    })
    
    return NextResponse.json({ success: true, data: topic }, { status: 201 })
  } catch (error) {
    console.error('Failed to create topic:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid topic data', details: error.message } },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic name already exists' } },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create topic', details: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    )
  }
}