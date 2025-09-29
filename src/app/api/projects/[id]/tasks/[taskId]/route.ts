import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@prisma/client'
import { notifyTaskAssigned, notifyTaskUpdated, getTaskAffectedUsers } from '@/lib/notifications'

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
})

// Both PATCH and PUT use the same logic for updating tasks
async function updateTask(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: projectId, taskId } = await params

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify task exists and belongs to the project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updateData = updateTaskSchema.parse(body)

    // Handle dueDate conversion
    const { dueDate: dueDateString, ...restData } = updateData
    const processedData = {
      ...restData,
      dueDate: dueDateString ? new Date(dueDateString) : null
    }

    // Verify assignee exists in organization if provided
    if (updateData.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: updateData.assigneeId,
          organizationId: session.user.organizationId,
        },
      })

      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found' },
          { status: 400 }
        )
      }
    } else if (updateData.assigneeId === '') {
      // Empty string means remove assignee
      processedData.assigneeId = null
    }

    // Verify sprint exists and belongs to the project if provided
    if (updateData.sprintId) {
      const sprint = await prisma.sprint.findFirst({
        where: {
          id: updateData.sprintId,
          projectId,
        },
      })

      if (!sprint) {
        return NextResponse.json(
          { error: 'Sprint not found' },
          { status: 400 }
        )
      }
    } else if (updateData.sprintId === '') {
      // Empty string means remove from sprint
      processedData.sprintId = null
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: processedData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    // Send notifications for task updates
    const updaterName = session.user.name || session.user.email || 'Usuario'

    // If task was assigned to someone new, notify them
    if (updateData.assigneeId && updateData.assigneeId !== existingTask.assigneeId) {
      await notifyTaskAssigned(taskId, updateData.assigneeId, updatedTask.title)
    }

    // Notify affected users about the update (excluding the updater)
    const affectedUsers = await getTaskAffectedUsers(taskId)
    const usersToNotify = affectedUsers.filter(userId => userId !== session.user.id)

    if (usersToNotify.length > 0) {
      await notifyTaskUpdated(taskId, usersToNotify, updatedTask.title, updaterName)
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Task update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH method for partial updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  return updateTask(request, { params })
}

// PUT method for full updates (used by edit modal)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  return updateTask(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: projectId, taskId } = await params

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify task exists and belongs to the project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await prisma.task.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Task deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: projectId, taskId } = await params

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: session.user.organizationId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get the specific task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}