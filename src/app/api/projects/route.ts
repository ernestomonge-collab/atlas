import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { projectSchema } from '@/lib/validations'
import { getDefaultProjectConfig } from '@/lib/project-config'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = projectSchema.parse(body)
    const { name, description, projectType, customStatuses, ...otherFields } = validatedData

    const project = await prisma.project.create({
      data: {
        name,
        description,
        organizationId: session.user.organizationId,
        // Store additional project metadata if needed
        metadata: {
          projectType: projectType || 'General',
          customStatuses: customStatuses || [],
          ...otherFields
        }
      },
      include: {
        organization: true,
        _count: {
          select: { tasks: true }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)

    if (error instanceof Error && 'code' in error) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projects = await prisma.project.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await prisma.task.count({
          where: { projectId: project.id }
        })

        const completedTasks = await prisma.task.count({
          where: {
            projectId: project.id,
            status: 'COMPLETED'
          }
        })

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
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}