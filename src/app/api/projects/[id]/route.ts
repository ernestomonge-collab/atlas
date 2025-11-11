import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        template: {
          include: {
            states: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        epics: {
          select: {
            id: true,
            name: true,
            color: true,
            status: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        sprints: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tasks: {
          select: {
            id: true,
            status: true
          }
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            sprints: true,
            epics: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify user has access to the space (public or member of private space)
    const userId = parseInt(session.user.id)
    const space = await prisma.space.findUnique({
      where: { id: project.spaceId },
      include: {
        members: {
          where: { userId }
        }
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    // Check if user is member of this project
    const isProjectMember = project.members.some(m => m.userId === userId)

    // User must be a member of the project to access it
    if (!isProjectMember) {
      return NextResponse.json(
        { error: 'No eres miembro de este proyecto' },
        { status: 403 }
      )
    }

    // Calculate progress from tasks already loaded
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Remove tasks from response to keep it clean
    const { tasks, ...projectWithoutTasks } = project

    return NextResponse.json({
      ...projectWithoutTasks,
      totalTasks,
      completedTasks,
      progress
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Check if project exists and user has access
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        }
      }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user is project owner/admin
    const isProjectOwner = existingProject.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )

    if (!isProjectOwner) {
      return NextResponse.json(
        { error: 'Only project owners/admins can update this project' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    // Validate
    if (name && !name.trim()) {
      return NextResponse.json(
        { error: 'Project name cannot be empty' },
        { status: 400 }
      )
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
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
        tasks: {
          select: {
            id: true,
            status: true
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

    // Calculate progress from tasks already loaded
    const totalTasks = updatedProject.tasks.length
    const completedTasks = updatedProject.tasks.filter(t => t.status === 'COMPLETED').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Remove tasks from response to keep it clean
    const { tasks, ...projectWithoutTasks } = updatedProject

    return NextResponse.json({
      ...projectWithoutTasks,
      totalTasks,
      completedTasks,
      progress
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Only project owners can delete
    const isProjectOwner = project.members.some(m => m.role === 'OWNER')

    if (!isProjectOwner) {
      return NextResponse.json(
        { error: 'Only project owners or organization admins can delete projects' },
        { status: 403 }
      )
    }

    // Check if project has tasks
    if (project._count.tasks > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with existing tasks. Delete or move tasks first.' },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
