import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { getSessionForToken, SESSION_COOKIE_NAME } from '@/lib/auth'

const BulkSolveActionSchema = z.object({
  action: z.enum(['reset', 'delete']),
  solveIds: z.array(z.string().min(1)).min(1, 'At least one puzzle must be selected'),
})

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const session = await getSessionForToken(token, { refresh: true })

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const body = await request.json()
    const { action, solveIds } = BulkSolveActionSchema.parse(body)

    if (action === 'reset') {
      await prisma.solve.updateMany({
        where: {
          id: { in: solveIds },
          userId: session.user.id,
        },
        data: {
          state: '{}',
          completedAt: null,
        },
      })
    } else if (action === 'delete') {
      await prisma.solve.deleteMany({
        where: {
          id: { in: solveIds },
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to process solve action:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0]?.message || 'Invalid request' } },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to process request' } },
      { status: 500 },
    )
  }
}
