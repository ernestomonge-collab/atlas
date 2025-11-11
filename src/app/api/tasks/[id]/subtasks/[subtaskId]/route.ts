import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyTaskAssigned, notifyTaskCompleted } from '@/lib/notifications'

// PATCH /api/tasks/[id]/subtasks/[subtaskId] - Update a subtask
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const taskId = parseInt(params.id)
    const subtaskId = parseInt(params.subtaskId)

    if (isNaN(taskId) || isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID or subtask ID' },
        { status: 400 }
      )
    }

    // Verify subtask exists and user has access
    const subtask = await prisma.task.findUnique({
      where: { id: subtaskId },
      include: {
        parentTask: {
          include: {
            project: {
              select: {
                organizationId: true
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

    if (subtask.parentTask?.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (subtask.parentTaskId !== taskId) {
      return NextResponse.json(
        { error: 'Subtask does not belong to this task' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, assigneeId, order } = body

    // Store previous assigneeId and status for notification comparison
    const previousAssigneeId = subtask.assigneeId
    const previousStatus = subtask.status

    const updatedSubtask = await prisma.task.update({
      where: { id: subtaskId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ? parseInt(assigneeId) : null }),
        ...(order !== undefined && { order })
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

    // Send notification if assignee changed and it's not the current user
    if (assigneeId !== undefined &&
        previousAssigneeId !== updatedSubtask.assigneeId &&
        updatedSubtask.assigneeId !== null &&
        updatedSubtask.assigneeId !== parseInt(session.user.id)) {
      await notifyTaskAssigned(
        updatedSubtask.id.toString(),
        updatedSubtask.assigneeId.toString(),
        updatedSubtask.title,
        subtask.parentTask.project.id?.toString() || ''
      ).catch(err => console.error('Failed to send assignment notification:', err))
    }

    // Send notification when subtask is completed
    if (status !== undefined &&
        previousStatus !== 'COMPLETED' &&
        updatedSubtask.status === 'COMPLETED') {
      const usersToNotify = new Set<number>()
      const currentUserId = parseInt(session.user.id)

      // Add assignee if different from current user
      if (updatedSubtask.assigneeId && updatedSubtask.assigneeId !== currentUserId) {
        usersToNotify.add(updatedSubtask.assigneeId)
      }

      // Add creator if different from current user
      if (updatedSubtask.createdById && updatedSubtask.createdById !== currentUserId) {
        usersToNotify.add(updatedSubtask.createdById)
      }

      // Send notifications to all relevant users
      for (const userId of usersToNotify) {
        await notifyTaskCompleted(
          userId.toString(),
          updatedSubtask.id.toString(),
          updatedSubtask.title,
          session.user.name || session.user.email,
          subtask.parentTask.project.id?.toString() || ''
        ).catch(err => console.error('Failed to send task completion notification:', err))
      }
    }

    return NextResponse.json(updatedSubtask)
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id]/subtasks/[subtaskId] - Delete a subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const taskId = parseInt(params.id)
    const subtaskId = parseInt(params.subtaskId)

    if (isNaN(taskId) || isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID or subtask ID' },
        { status: 400 }
      )
    }

    // Verify subtask exists and user has access
    const subtask = await prisma.task.findUnique({
      where: { id: subtaskId },
      include: {
        parentTask: {
          include: {
            project: {
              select: {
                organizationId: true
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

    if (subtask.parentTask?.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (subtask.parentTaskId !== taskId) {
      return NextResponse.json(
        { error: 'Subtask does not belong to this task' },
        { status: 400 }
      )
    }

    await prisma.task.delete({
      where: { id: subtaskId }
    })

    return NextResponse.json({ message: 'Subtask deleted successfully' })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    )
  }
}
