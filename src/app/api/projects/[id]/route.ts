import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Calculate progress
    const totalTasks = await prisma.task.count({
      where: { projectId: id }
    })

    const completedTasks = await prisma.task.count({
      where: {
        projectId: id,
        status: 'COMPLETED'
      }
    })

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const projectWithProgress = {
      ...project,
      totalTasks,
      completedTasks,
      progress
    }

    return NextResponse.json(projectWithProgress)
  } catch (error) {
    console.error('Project fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}