import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/epics/[id]/tasks - Get all tasks for an epic
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const epicId = parseInt(resolvedParams.id)

    if (isNaN(epicId)) {
      return NextResponse.json(
        { error: 'Invalid epic ID' },
        { status: 400 }
      )
    }

    // Verify epic exists and user has access
    const epic = await prisma.epic.findFirst({
      where: {
        id: epicId,
        project: {
          organizationId: session.user.organizationId
        }
      },
      select: { id: true }
    })

    if (!epic) {
      return NextResponse.json(
        { error: 'Epic not found or access denied' },
        { status: 404 }
      )
    }

    // Get tasks for this epic
    const tasks = await prisma.task.findMany({
      where: {
        epicId
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching epic tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch epic tasks' },
      { status: 500 }
    )
  }
}
