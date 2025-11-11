import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/tasks/[id]/subtasks/[subtaskId]/audit-logs - Get audit trail for a subtask
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subtaskId = parseInt(resolvedParams.subtaskId)

    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Invalid subtask ID' },
        { status: 400 }
      )
    }

    // Verify subtask exists and user is a member of the project
    const subtask = await prisma.task.findUnique({
      where: { id: subtaskId },
      include: {
        parentTask: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId: parseInt(session.user.id) }
                }
              }
            }
          }
        }
      }
    })

    if (!subtask || !subtask.parentTaskId) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }

    if (!subtask.parentTask?.project.members || subtask.parentTask.project.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    // Get audit logs with user information
    const auditLogs = await prisma.auditLog.findMany({
      where: { taskId: subtaskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('Error fetching subtask audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
