import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyProjectEditAccess } from '@/lib/project-access'

// GET /api/tasks/[id]/subtasks - Get all subtasks for a task
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

    // Get subtasks AND verify user is a member of the project
    const subtasks = await prisma.task.findMany({
      where: {
        parentTaskId: taskId,
        project: {
          members: {
            some: {
              userId: parseInt(session.user.id)
            }
          }
        }
      },
      orderBy: { order: 'asc' },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            subtasks: true
          }
        }
      }
    })

    // If no subtasks returned, verify if user has access to the project
    if (subtasks.length === 0) {
      const parentTask = await prisma.task.findUnique({
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

      if (!parentTask) {
        return NextResponse.json(
          { error: 'Parent task not found' },
          { status: 404 }
        )
      }

      if (parentTask.project.members.length === 0) {
        return NextResponse.json(
          { error: 'You are not a member of this project' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(subtasks)
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const taskId = parseInt(resolvedParams.id)

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    // Check if task exists and get project ID
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            template: {
              include: {
                states: {
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
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

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(task.projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    // Get the first status from the project template, or use PENDING as fallback
    const firstTemplateState = task.project.template?.states?.[0]?.name || 'PENDING'

    const body = await request.json()
    const { title, description, status = firstTemplateState, priority = 'MEDIUM', dueDate, assigneeId, order } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Subtask title is required' },
        { status: 400 }
      )
    }

    // If order not provided, add to end
    let subtaskOrder = order
    if (subtaskOrder === undefined) {
      const lastSubtask = await prisma.task.findFirst({
        where: { parentTaskId: taskId },
        orderBy: { order: 'desc' }
      })
      subtaskOrder = lastSubtask ? lastSubtask.order + 1 : 0
    }

    const subtask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        order: subtaskOrder,
        parentTaskId: taskId,
        projectId: task.projectId,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        createdById: accessCheck.userId
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}
