import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/analytics/team - Get team analytics for the organization
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
    const period = searchParams.get('period') || '7d'

    // Calculate date range based on period
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
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const organizationId = session.user.organizationId

    // Get total users in organization
    const totalUsers = await prisma.user.count({
      where: { organizationId }
    })

    // Get total projects
    const totalProjects = await prisma.project.count({
      where: { organizationId }
    })

    // Get all tasks for the organization
    const allTasks = await prisma.task.count({
      where: {
        project: {
          organizationId
        }
      }
    })

    // Get completed tasks in the time period
    const completedTasksInPeriod = await prisma.task.count({
      where: {
        project: {
          organizationId
        },
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate
        }
      }
    })

    // Get total completed tasks
    const totalCompletedTasks = await prisma.task.count({
      where: {
        project: {
          organizationId
        },
        status: 'COMPLETED'
      }
    })

    // Calculate completion rate
    const completionRate = allTasks > 0
      ? Math.round((totalCompletedTasks / allTasks) * 100)
      : 0

    // Calculate average tasks per user
    const averageTasksPerUser = totalUsers > 0
      ? Math.round(allTasks / totalUsers)
      : 0

    // Simple productivity trend calculation (comparing with previous period)
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const previousPeriodCompleted = await prisma.task.count({
      where: {
        project: {
          organizationId
        },
        status: 'COMPLETED',
        updatedAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    let productivityTrend: 'up' | 'down' | 'stable' = 'stable'
    const difference = completedTasksInPeriod - previousPeriodCompleted

    if (difference > 2) {
      productivityTrend = 'up'
    } else if (difference < -2) {
      productivityTrend = 'down'
    }

    const analytics = {
      totalUsers,
      totalProjects,
      totalTasks: allTasks,
      completedTasksThisWeek: completedTasksInPeriod,
      productivityTrend,
      averageTasksPerUser,
      completionRate
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching team analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team analytics' },
      { status: 500 }
    )
  }
}
