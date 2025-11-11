import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyProjectAccess, verifyProjectEditAccess } from '@/lib/project-access'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { auditTaskChanges } from '@/lib/audit'
import { notifyTaskAssigned, notifyTaskCompleted } from '@/lib/notifications'

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
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

    // Get session for audit log
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing task with all fields for audit comparison
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(existingTask.projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, assigneeId, epicId, sprintId } = body

    // Validate title if provided
    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json(
        { error: 'Task title cannot be empty' },
        { status: 400 }
      )
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ? parseInt(assigneeId) : null }),
        ...(epicId !== undefined && { epicId: epicId ? parseInt(epicId) : null }),
        ...(sprintId !== undefined && { sprintId: sprintId ? parseInt(sprintId) : null })
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
        },
        epic: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })

    // Create audit logs for changes
    await auditTaskChanges({
      oldTask: existingTask,
      newTask: updatedTask,
      userId: session.user.id
    })

    // Send notifications for task assignment changes
    // Only notify if assignee actually changed AND it's not the person making the change
    if (assigneeId !== undefined &&
        existingTask.assigneeId !== updatedTask.assigneeId &&
        updatedTask.assigneeId !== null &&
        updatedTask.assigneeId !== parseInt(session.user.id)) {
      await notifyTaskAssigned(
        updatedTask.id.toString(),
        updatedTask.assigneeId.toString(),
        updatedTask.title,
        updatedTask.projectId.toString()
      ).catch(err => console.error('Failed to send notification:', err))
    }

    // Send notifications when task is completed
    // Notify assignee and creator (excluding the person who completed it)
    if (status !== undefined &&
        existingTask.status !== 'COMPLETED' &&
        updatedTask.status === 'COMPLETED') {
      const usersToNotify = new Set<number>()
      const currentUserId = parseInt(session.user.id)

      if (updatedTask.assigneeId && updatedTask.assigneeId !== currentUserId) {
        usersToNotify.add(updatedTask.assigneeId)
      }
      if (updatedTask.createdById !== currentUserId) {
        usersToNotify.add(updatedTask.createdById)
      }

      for (const userId of usersToNotify) {
        await notifyTaskCompleted(
          userId.toString(),
          updatedTask.id.toString(),
          updatedTask.title,
          session.user.name || session.user.email,
          updatedTask.projectId.toString()
        ).catch(err => console.error('Failed to send task completion notification:', err))
      }
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// GET /api/tasks/[id] - Get a single task
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
    const taskId = parseInt(resolvedParams.id)

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
        epic: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        },
        comments: {
          include: {
            user: {
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
        },
        attachments: {
          orderBy: {
            createdAt: 'desc'
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

    // Verify user belongs to the same organization
    if (task.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
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
        projectId: true
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

    await prisma.task.delete({
      where: { id: taskId }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
