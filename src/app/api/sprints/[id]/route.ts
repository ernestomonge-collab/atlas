import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyProjectEditAccess } from '@/lib/project-access'

// GET /api/sprints/[id] - Get a single sprint
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
    const sprintId = parseInt(resolvedParams.id)

    if (isNaN(sprintId)) {
      return NextResponse.json(
        { error: 'Invalid sprint ID' },
        { status: 400 }
      )
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Verify user belongs to the same organization
    if (sprint.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(sprint)
  } catch (error) {
    console.error('Error fetching sprint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprint' },
      { status: 500 }
    )
  }
}

// PATCH /api/sprints/[id] - Update a sprint
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const sprintId = parseInt(resolvedParams.id)

    if (isNaN(sprintId)) {
      return NextResponse.json(
        { error: 'Invalid sprint ID' },
        { status: 400 }
      )
    }

    // Check if sprint exists and get project ID
    const existingSprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        projectId: true
      }
    })

    if (!existingSprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(existingSprint.projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    const body = await request.json()
    const { name, goal, status, startDate, endDate } = body

    // Validate name if provided
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Sprint name cannot be empty' },
        { status: 400 }
      )
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(goal !== undefined && { goal: goal || null }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null })
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedSprint)
  } catch (error) {
    console.error('Error updating sprint:', error)
    return NextResponse.json(
      { error: 'Failed to update sprint' },
      { status: 500 }
    )
  }
}

// DELETE /api/sprints/[id] - Delete a sprint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const sprintId = parseInt(resolvedParams.id)

    if (isNaN(sprintId)) {
      return NextResponse.json(
        { error: 'Invalid sprint ID' },
        { status: 400 }
      )
    }

    // Check if sprint exists and get project ID
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      select: {
        id: true,
        projectId: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    if (!sprint) {
      return NextResponse.json(
        { error: 'Sprint not found' },
        { status: 404 }
      )
    }

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(sprint.projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    // Check if sprint has tasks
    if (sprint._count.tasks > 0) {
      return NextResponse.json(
        { error: 'Cannot delete sprint with existing tasks. Remove or reassign tasks first.' },
        { status: 400 }
      )
    }

    await prisma.sprint.delete({
      where: { id: sprintId }
    })

    return NextResponse.json({ message: 'Sprint deleted successfully' })
  } catch (error) {
    console.error('Error deleting sprint:', error)
    return NextResponse.json(
      { error: 'Failed to delete sprint' },
      { status: 500 }
    )
  }
}
