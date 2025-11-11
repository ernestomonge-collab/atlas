import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyProjectEditAccess } from '@/lib/project-access'

// GET /api/epics/[id] - Get a single epic
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const epicId = parseInt(params.id)

    if (isNaN(epicId)) {
      return NextResponse.json(
        { error: 'Invalid epic ID' },
        { status: 400 }
      )
    }

    const epic = await prisma.epic.findUnique({
      where: { id: epicId },
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

    if (!epic) {
      return NextResponse.json(
        { error: 'Epic not found' },
        { status: 404 }
      )
    }

    // Verify user belongs to the same organization
    if (epic.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(epic)
  } catch (error) {
    console.error('Error fetching epic:', error)
    return NextResponse.json(
      { error: 'Failed to fetch epic' },
      { status: 500 }
    )
  }
}

// PATCH /api/epics/[id] - Update an epic
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const epicId = parseInt(params.id)

    if (isNaN(epicId)) {
      return NextResponse.json(
        { error: 'Invalid epic ID' },
        { status: 400 }
      )
    }

    // Check if epic exists and get project ID
    const existingEpic = await prisma.epic.findUnique({
      where: { id: epicId },
      select: {
        id: true,
        projectId: true
      }
    })

    if (!existingEpic) {
      return NextResponse.json(
        { error: 'Epic not found' },
        { status: 404 }
      )
    }

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(existingEpic.projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    const body = await request.json()
    const { name, description, color, status, startDate, targetDate } = body

    // Validate name if provided
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Epic name cannot be empty' },
        { status: 400 }
      )
    }

    const updatedEpic = await prisma.epic.update({
      where: { id: epicId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null })
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedEpic)
  } catch (error) {
    console.error('Error updating epic:', error)
    return NextResponse.json(
      { error: 'Failed to update epic' },
      { status: 500 }
    )
  }
}

// DELETE /api/epics/[id] - Delete an epic
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const epicId = parseInt(params.id)

    if (isNaN(epicId)) {
      return NextResponse.json(
        { error: 'Invalid epic ID' },
        { status: 400 }
      )
    }

    // Check if epic exists and get project ID
    const epic = await prisma.epic.findUnique({
      where: { id: epicId },
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

    if (!epic) {
      return NextResponse.json(
        { error: 'Epic not found' },
        { status: 404 }
      )
    }

    // Verify user can edit (not a VIEWER)
    const accessCheck = await verifyProjectEditAccess(epic.projectId)
    if (accessCheck.error) {
      return accessCheck.error
    }

    // Check if epic has tasks
    if (epic._count.tasks > 0) {
      return NextResponse.json(
        { error: 'Cannot delete epic with existing tasks. Remove or reassign tasks first.' },
        { status: 400 }
      )
    }

    await prisma.epic.delete({
      where: { id: epicId }
    })

    return NextResponse.json({ message: 'Epic deleted successfully' })
  } catch (error) {
    console.error('Error deleting epic:', error)
    return NextResponse.json(
      { error: 'Failed to delete epic' },
      { status: 500 }
    )
  }
}
