import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyProjectAccess } from '@/lib/project-access'

// GET /api/projects/[id]/subtasks - Get all subtasks for a project
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

    // Get all subtasks for tasks in this project
    const subtasks = await prisma.task.findMany({
      where: {
        projectId: projectId,
        parentTaskId: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        parentTaskId: true,
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
        order: 'asc'
      }
    })

    return NextResponse.json(subtasks)
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    )
  }
}
