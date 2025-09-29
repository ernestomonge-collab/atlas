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

    // Get projects with detailed analytics
    const projects = await prisma.project.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        tasks: {
          include: {
            assignee: true,
            comments: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    // Calculate analytics for each project
    const projectAnalytics = await Promise.all(
      projects.map(async (project) => {
        const tasks = project.tasks

        // Basic task counts
        const totalTasks = tasks.length
        const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length
        const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length
        const pendingTasks = tasks.filter(task => task.status === 'PENDING').length

        // Progress calculation
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        // Overdue tasks
        const now = new Date()
        const overdueTasks = tasks.filter(task =>
          task.dueDate &&
          new Date(task.dueDate) < now &&
          task.status !== 'COMPLETED'
        ).length

        // Recent activity (tasks updated in the last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const recentActivity = tasks.filter(task =>
          new Date(task.updatedAt) > weekAgo
        ).length

        // Team members count (unique assignees)
        const assigneeIds = new Set(
          tasks
            .filter(task => task.assigneeId)
            .map(task => task.assigneeId)
        )
        const teamMembersCount = assigneeIds.size

        // Average completion time (simplified - days between creation and completion)
        const completedTasksWithDates = tasks.filter(
          task => task.status === 'COMPLETED'
        )
        let averageCompletionTime: number | undefined

        if (completedTasksWithDates.length > 0) {
          const totalCompletionDays = completedTasksWithDates.reduce((sum, task) => {
            const createdDate = new Date(task.createdAt)
            const completedDate = new Date(task.updatedAt) // Approximation
            const diffDays = Math.ceil((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
            return sum + diffDays
          }, 0)
          averageCompletionTime = Math.round(totalCompletionDays / completedTasksWithDates.length)
        }

        return {
          id: project.id,
          name: project.name,
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          progress,
          overdueTasks,
          recentActivity,
          teamMembersCount,
          averageCompletionTime,
        }
      })
    )

    return NextResponse.json(projectAnalytics)
  } catch (error) {
    console.error('Project analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}