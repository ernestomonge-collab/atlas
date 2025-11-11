import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/analytics/burndown - Get burndown chart data for active sprint
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
    const sprintId = searchParams.get('sprintId')

    if (!projectId && !sprintId) {
      return NextResponse.json(
        { error: 'Either projectId or sprintId is required' },
        { status: 400 }
      )
    }

    const organizationId = session.user.organizationId

    let sprint

    if (sprintId) {
      // Get specific sprint
      sprint = await prisma.sprint.findUnique({
        where: { id: parseInt(sprintId) },
        include: {
          project: {
            select: {
              organizationId: true
            }
          },
          metrics: {
            orderBy: { date: 'asc' }
          }
        }
      })
    } else if (projectId) {
      // Get active sprint for project
      sprint = await prisma.sprint.findFirst({
        where: {
          projectId: parseInt(projectId),
          status: 'ACTIVE'
        },
        include: {
          project: {
            select: {
              organizationId: true
            }
          },
          metrics: {
            orderBy: { date: 'asc' }
          }
        }
      })
    }

    if (!sprint) {
      return NextResponse.json(
        { error: 'No active sprint found' },
        { status: 404 }
      )
    }

    // Verify organization access
    if (sprint.project.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // If metrics exist, return them
    if (sprint.metrics && sprint.metrics.length > 0) {
      const burndownData = sprint.metrics.map(metric => ({
        day: new Date(metric.date).toLocaleDateString('es-ES', { weekday: 'short' }),
        date: metric.date,
        ideal: metric.idealRemaining,
        real: metric.remainingTasks
      }))

      return NextResponse.json(burndownData)
    }

    // If no metrics, generate from current sprint data
    if (!sprint.startDate || !sprint.endDate) {
      return NextResponse.json(
        { error: 'Sprint has no start or end date' },
        { status: 400 }
      )
    }

    // Get total tasks in sprint
    const totalTasks = await prisma.task.count({
      where: {
        sprintId: sprint.id
      }
    })

    // Calculate burndown based on current state
    const startDate = new Date(sprint.startDate)
    const endDate = new Date(sprint.endDate)
    const today = new Date()
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const burndownData = []
    for (let i = 0; i <= Math.min(daysPassed, totalDays); i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)

      const idealRemaining = Math.max(0, totalTasks - Math.round((totalTasks / totalDays) * i))

      // Get completed tasks up to this date
      const completedByDate = await prisma.task.count({
        where: {
          sprintId: sprint.id,
          status: 'COMPLETED',
          updatedAt: {
            lte: currentDate
          }
        }
      })

      const realRemaining = Math.max(0, totalTasks - completedByDate)

      burndownData.push({
        day: currentDate.toLocaleDateString('es-ES', { weekday: 'short' }),
        date: currentDate.toISOString(),
        ideal: idealRemaining,
        real: realRemaining
      })
    }

    return NextResponse.json(burndownData)
  } catch (error) {
    console.error('Error fetching burndown data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch burndown data' },
      { status: 500 }
    )
  }
}
