import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/spaces/[id]/projects - Get all projects in a space
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

    const spaceId = parseInt(params.id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Verify space exists and user has access
    const space = await prisma.space.findUnique({
      where: { id: spaceId }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (space.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const projects = await prisma.project.findMany({
      where: {
        spaceId
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            sprints: true,
            epics: true
          }
        },
        members: {
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const tasks = await prisma.task.findMany({
          where: { projectId: project.id },
          select: { status: true }
        })

        const totalTasks = tasks.length
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return {
          ...project,
          totalTasks,
          completedTasks,
          progress
        }
      })
    )

    return NextResponse.json(projectsWithProgress)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/spaces/[id]/projects - Create a new project in a space
export async function POST(
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

    const spaceId = parseInt(params.id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Verify space exists and user has access
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        }
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (space.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user is member of the space or org admin
    const isSpaceMember = space.members.length > 0
    const isOrgAdmin = session.user.role === 'ADMIN'

    if (!isSpaceMember && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'You must be a member of this space to create projects' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    // Validate
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // Create project and add creator as member
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        organizationId: session.user.organizationId,
        spaceId,
        members: {
          create: {
            userId: parseInt(session.user.id),
            role: 'OWNER'
          }
        }
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            sprints: true,
            epics: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(
      {
        ...project,
        totalTasks: 0,
        completedTasks: 0,
        progress: 0
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
