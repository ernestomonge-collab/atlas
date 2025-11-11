import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SprintStatus } from '@prisma/client'
import { verifyProjectAccess, verifyProjectEditAccess } from '@/lib/project-access'

// GET /api/projects/[id]/sprints - Get all sprints for a project
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

    const sprints = await prisma.sprint.findMany({
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

    return NextResponse.json(sprints)
  } catch (error) {
    console.error('Error fetching sprints:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sprints' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/sprints - Create a new sprint
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
    const { name, status, startDate, endDate } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Sprint name is required' },
        { status: 400 }
      )
    }

    // Create the sprint
    const sprint = await prisma.sprint.create({
      data: {
        name: name.trim(),
        status: status || SprintStatus.PLANNING,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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

    return NextResponse.json(sprint, { status: 201 })
  } catch (error) {
    console.error('Error creating sprint:', error)
    return NextResponse.json(
      { error: 'Failed to create sprint' },
      { status: 500 }
    )
  }
}
