import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/analytics/productivity - Get member productivity data
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
    const period = searchParams.get('period') || '30d'
    const projectId = searchParams.get('projectId')

    const organizationId = session.user.organizationId

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
    }

    // Get all users in organization
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // Build where clause for tasks
    const taskWhereClause: any = {
      project: {
        organizationId
      },
      updatedAt: {
        gte: startDate
      }
    }

    if (projectId && projectId !== 'all') {
      taskWhereClause.projectId = parseInt(projectId)
    }

    // Calculate productivity for each user
    const productivityData = await Promise.all(
      users.map(async (user) => {
        // Tasks completed in period
        const tasksCompleted = await prisma.task.count({
          where: {
            ...taskWhereClause,
            assigneeId: user.id,
            status: 'COMPLETED'
          }
        })

        // Tasks currently in progress
        const tasksInProgress = await prisma.task.count({
          where: {
            project: {
              organizationId
            },
            assigneeId: user.id,
            status: 'IN_PROGRESS'
          }
        })

        // Total assigned tasks
        const totalAssigned = await prisma.task.count({
          where: {
            project: {
              organizationId
            },
            assigneeId: user.id
          }
        })

        // Calculate productivity score (0-100)
        const productivity = totalAssigned > 0
          ? Math.round((tasksCompleted / totalAssigned) * 100)
          : 0

        // Calculate trend (compare with previous period)
        const previousPeriodStart = new Date(startDate)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        const previousCompleted = await prisma.task.count({
          where: {
            ...taskWhereClause,
            assigneeId: user.id,
            status: 'COMPLETED',
            updatedAt: {
              gte: previousPeriodStart,
              lt: startDate
            }
          }
        })

        let trend: 'up' | 'down' | 'stable' = 'stable'
        const difference = tasksCompleted - previousCompleted

        if (difference > 1) {
          trend = 'up'
        } else if (difference < -1) {
          trend = 'down'
        }

        return {
          id: user.id.toString(),
          name: user.name || user.email,
          email: user.email,
          tasksCompleted,
          tasksInProgress,
          productivity,
          trend
        }
      })
    )

    // Sort by productivity descending
    productivityData.sort((a, b) => b.productivity - a.productivity)

    return NextResponse.json(productivityData)
  } catch (error) {
    console.error('Error fetching productivity data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch productivity data' },
      { status: 500 }
    )
  }
}
