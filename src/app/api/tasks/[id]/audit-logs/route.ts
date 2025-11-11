import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/tasks/[id]/audit-logs - Get audit trail for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const taskId = parseInt(resolvedParams.id)

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    // Get audit logs AND verify user is a member of the project
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        taskId,
        task: {
          project: {
            members: {
              some: {
                userId: parseInt(session.user.id)
              }
            }
          }
        }
      },
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

    // If no logs returned, verify if user has access to the project
    if (auditLogs.length === 0) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: {
              members: {
                where: { userId: parseInt(session.user.id) }
              }
            }
          }
        }
      })

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        )
      }

      if (task.project.members.length === 0) {
        return NextResponse.json(
          { error: 'You are not a member of this project' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
