import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/analytics/velocity - Get velocity chart data (completed vs planned tasks per sprint)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      )
    }

    const organizationId = session.user.organizationId

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      select: {
        organizationId: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get completed sprints with task data
    const sprints = await prisma.sprint.findMany({
      where: {
        projectId: parseInt(projectId),
        status: {
          in: ['COMPLETED', 'ACTIVE']
        }
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        endDate: 'desc'
      },
      take: limit
    })

    // Calculate velocity data
    const velocityData = sprints.reverse().map(sprint => {
      const plannedTasks = sprint.tasks.length
      const completedTasks = sprint.tasks.filter(t => t.status === 'COMPLETED').length

      return {
        sprint: sprint.name,
        sprintId: sprint.id,
        completadas: completedTasks,
        planificadas: plannedTasks,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status: sprint.status
      }
    })

    return NextResponse.json(velocityData)
  } catch (error) {
    console.error('Error fetching velocity data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch velocity data' },
      { status: 500 }
    )
  }
}
