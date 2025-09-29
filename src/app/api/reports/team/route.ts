import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizationId = session.user.organizationId

    // Get team overview data
    const [users, projects, tasks] = await Promise.all([
      // Total users in organization
      prisma.user.count({
        where: { organizationId },
      }),

      // Total projects
      prisma.project.count({
        where: { organizationId },
      }),

      // All tasks with details
      prisma.task.findMany({
        where: {
          project: {
            organizationId,
          },
        },
        include: {
          assignee: true,
        },
      }),
    ])

    // Calculate team analytics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length

    // Tasks completed this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const completedTasksThisWeek = tasks.filter(task =>
      task.status === 'COMPLETED' &&
      new Date(task.updatedAt) > weekAgo
    ).length

    // Previous week for trend comparison
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const completedTasksPreviousWeek = tasks.filter(task => {
      const updatedDate = new Date(task.updatedAt)
      return task.status === 'COMPLETED' &&
        updatedDate > twoWeeksAgo &&
        updatedDate <= weekAgo
    }).length

    // Determine productivity trend
    let productivityTrend: 'up' | 'down' | 'stable'
    if (completedTasksThisWeek > completedTasksPreviousWeek) {
      productivityTrend = 'up'
    } else if (completedTasksThisWeek < completedTasksPreviousWeek) {
      productivityTrend = 'down'
    } else {
      productivityTrend = 'stable'
    }

    // Average tasks per user
    const averageTasksPerUser = users > 0 ? Math.round(totalTasks / users) : 0

    // Completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const teamAnalytics = {
      totalUsers: users,
      totalProjects: projects,
      totalTasks,
      completedTasksThisWeek,
      productivityTrend,
      averageTasksPerUser,
      completionRate,
    }

    return NextResponse.json(teamAnalytics)
  } catch (error) {
    console.error('Team analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}