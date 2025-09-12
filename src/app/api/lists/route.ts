import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateListSchema } from '@/lib/validation'
import { normalizeAnswer } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topicId')
  
  try {
    const where = topicId ? { topicId } : {}
    
    const lists = await prisma.list.findMany({
      where,
      include: {
        topic: true,
        items: true,
        _count: {
          select: { items: true, puzzles: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    return NextResponse.json({ success: true, data: lists })
  } catch (error) {
    console.error('Failed to fetch lists:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch lists' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateListSchema.parse(body)
    
    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: validated.topicId }
    })
    
    if (!topic) {
      return NextResponse.json(
        { success: false, error: { message: 'Topic not found' } },
        { status: 404 }
      )
    }
    
    // Create list and items in transaction
    const result = await prisma.$transaction(async (tx) => {
      const list = await tx.list.create({
        data: {
          topicId: validated.topicId,
          name: validated.name,
          source: 'UPLOAD'
        }
      })
      
      // Create items with normalized answers
      const items = await Promise.all(
        validated.items.map((item, index) =>
          tx.listItem.create({
            data: {
              listId: list.id,
              answer: normalizeAnswer(item.answer),
              clue: item.clue,
              note: item.note,
              difficulty: item.difficulty || 'MEDIUM'
            }
          })
        )
      )
      
      return { list, items }
    })
    
    // Fetch complete list with relations
    const completeList = await prisma.list.findUnique({
      where: { id: result.list.id },
      include: {
        topic: true,
        items: true,
        _count: {
          select: { items: true, puzzles: true }
        }
      }
    })
    
    return NextResponse.json({ success: true, data: completeList }, { status: 201 })
  } catch (error) {
    console.error('Failed to create list:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create list' } },
      { status: 500 }
    )
  }
}