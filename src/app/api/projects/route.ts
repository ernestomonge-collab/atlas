import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/projects - List all projects where user is a member (any role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameter for filtering by space
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const userId = parseInt(session.user.id)

    // Build where clause to only show projects where user is a member
    // User must be explicitly added as a ProjectMember (any role: OWNER, ADMIN, MEMBER, VIEWER)
    const projects = await prisma.project.findMany({
      where: {
        ...(spaceId && { spaceId: parseInt(spaceId) }),
        members: {
          some: { userId }
        }
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            isPublic: true
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
        },
        // Include tasks to calculate completion status
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate progress for each project using the already-loaded tasks
    const projectsWithProgress = projects.map((project) => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Remove tasks from the response as they're only needed for calculation
      const { tasks, ...projectWithoutTasks } = project

      return {
        ...projectWithoutTasks,
        totalTasks,
        completedTasks,
        progress
      }
    })

    return NextResponse.json(projectsWithProgress)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    let { name, description, spaceId, templateId, customStatuses } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    if (!spaceId) {
      return NextResponse.json(
        { error: 'Space is required' },
        { status: 400 }
      )
    }

    // If spaceId is provided and no templateId, inherit template from space
    if (spaceId && !templateId) {
      const space = await prisma.space.findUnique({
        where: { id: parseInt(spaceId) },
        select: { templateId: true }
      })

      if (space?.templateId) {
        templateId = space.templateId
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || undefined,
        spaceId: spaceId || undefined,
        templateId: templateId || undefined,
        ...(session.user.organizationId && { organizationId: session.user.organizationId }),
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    // Add current user as project owner
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: parseInt(session.user.id),
        role: 'OWNER'
      }
    })

    // Create custom statuses if provided
    if (customStatuses && customStatuses.length > 0) {
      await prisma.projectStatus.createMany({
        data: customStatuses.map((status: { name: string; color: string; order: number }) => ({
          projectId: project.id,
          name: status.name,
          color: status.color,
          order: status.order
        }))
      })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
