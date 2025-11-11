import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyProjectAccess, verifyProjectEditAccess } from '@/lib/project-access'
import { notifyTaskAssigned } from '@/lib/notifications'

// GET /api/projects/[id]/tasks - Get all tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Verify access in a single query
    const accessCheck = await verifyProjectAccess(projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    // Optimized query - removed subtasks include (they'll be loaded separately when needed)
    // Removed comments and attachments count (not shown in list view)
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        parentTaskId: null // Only get parent tasks, not subtasks
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        order: true,
        projectId: true,
        assigneeId: true,
        epicId: true,
        sprintId: true,
        assignee: {
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
            color: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true
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
            subtasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    const { userId } = accessCheck

    const body = await request.json()
    const { title, description, priority, dueDate, assigneeId, sprintId, epicId, status } = body

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        sprintId: sprintId ? parseInt(sprintId) : null,
        epicId: epicId ? parseInt(epicId) : null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        createdById: userId
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
            color: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    // Send notification if task is assigned to someone (and it's not the creator)
    if (task.assigneeId && task.assigneeId !== userId) {
      await notifyTaskAssigned(
        task.id.toString(),
        task.assigneeId.toString(),
        task.title,
        task.projectId.toString()
      ).catch(err => console.error('Failed to send notification:', err))
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
