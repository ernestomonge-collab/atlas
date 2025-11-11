import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EpicStatus } from '@prisma/client'
import { verifyProjectAccess, verifyProjectEditAccess } from '@/lib/project-access'

// GET /api/projects/[id]/epics - Get all epics for a project
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

    // Load epics with their tasks for the list view
    const epics = await prisma.epic.findMany({
      where: {
        projectId
      },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(epics)
  } catch (error) {
    console.error('Error fetching epics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch epics' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/epics - Create a new epic
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

    const body = await request.json()
    const { name, description, color, status, startDate, targetDate } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Epic name is required' },
        { status: 400 }
      )
    }

    // Create the epic
    const epic = await prisma.epic.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#8B5CF6',
        status: status || EpicStatus.IN_PROGRESS,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        projectId
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(epic, { status: 201 })
  } catch (error) {
    console.error('Error creating epic:', error)
    return NextResponse.json(
      { error: 'Failed to create epic' },
      { status: 500 }
    )
  }
}
