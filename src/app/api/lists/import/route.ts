import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateListJSON, normalizeAnswer } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the import data
    const validation = validateListJSON(body)
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Validation failed',
          details: validation.errors
        }
      }, { status: 400 })
    }
    
    const { data: listData } = validation
    
    // Find or create topic
    let topic = await prisma.topic.findFirst({
      where: { name: listData.topic }
    })
    
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: listData.topic,
          description: `Auto-created from import`,
          color: '#3B82F6',
          icon: '📚'
        }
      })
    }
    
    // Check if list with same name and version already exists
    const existingList = await prisma.list.findFirst({
      where: {
        topicId: topic.id,
        name: listData.name,
        version: listData.version
      }
    })
    
    if (existingList) {
      return NextResponse.json({
        success: false,
        error: {
          message: `List "${listData.name}" version ${listData.version} already exists in topic "${listData.topic}"`
        }
      }, { status: 409 })
    }
    
    // Create list and items in transaction
    const result = await prisma.$transaction(async (tx) => {
      const list = await tx.list.create({
        data: {
          topicId: topic!.id,
          name: listData.name,
          version: listData.version,
          source: 'UPLOAD'
        }
      })
      
      // Create items with normalized answers
      const items = await Promise.all(
        listData.items.map(item =>
          tx.listItem.create({
            data: {
              listId: list.id,
              answer: normalizeAnswer(item.answer),
              clue: item.clue,
              note: item.note,
              difficulty: item.difficulty ? 
                (item.difficulty === 1 ? 'EASY' : 
                 item.difficulty === 2 ? 'MEDIUM' : 'HARD') : 'MEDIUM'
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
    
    return NextResponse.json({
      success: true,
      data: {
        list: completeList,
        message: `Successfully imported ${listData.items.length} items into "${listData.name}"`
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Failed to import list:', error)
    
    if (error instanceof Error && error.message.includes('JSON')) {
      return NextResponse.json({
        success: false,
        error: { message: 'Invalid JSON format' }
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: { message: 'Failed to import list' }
    }, { status: 500 })
  }
}