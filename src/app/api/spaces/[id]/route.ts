import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/spaces/[id] - Get space details
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
    const spaceId = parseInt(resolvedParams.id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Check if we should load projects (default: true, but can be disabled with ?includeProjects=false)
    const { searchParams } = new URL(request.url)
    const includeProjects = searchParams.get('includeProjects') !== 'false'

    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
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
        ...(includeProjects && {
          projects: {
            include: {
              _count: {
                select: {
                  tasks: true,
                  members: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }),
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
        _count: {
          select: {
            projects: true,
            members: true
          }
        }
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this space (public or is a member)
    const hasAccess = space.isPublic || space.members.some(m => m.userId === parseInt(session.user.id))

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this private space' },
        { status: 403 }
      )
    }

    return NextResponse.json(space)
  } catch (error) {
    console.error('Error fetching space:', error)
    return NextResponse.json(
      { error: 'Failed to fetch space' },
      { status: 500 }
    )
  }
}

// PATCH /api/spaces/[id] - Update space
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
    const spaceId = parseInt(resolvedParams.id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Check if space exists and user has access
    const existingSpace = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        }
      }
    })

    if (!existingSpace) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    // Check if user is owner/admin of the space
    const isSpaceOwnerOrAdmin = existingSpace.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )

    if (!isSpaceOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only space owners/admins can update this space' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color, icon, isPublic } = body

    // Validate
    if (name && !name.trim()) {
      return NextResponse.json(
        { error: 'Space name cannot be empty' },
        { status: 400 }
      )
    }

    // Handle visibility change: Private → Public
    // When converting to public, remove all members except OWNER
    if (existingSpace.isPublic === false && isPublic === true) {
      await prisma.spaceMember.deleteMany({
        where: {
          spaceId: spaceId,
          role: {
            not: 'OWNER'
          }
        }
      })
    }

    const updatedSpace = await prisma.space.update({
      where: { id: spaceId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        _count: {
          select: {
            projects: true,
            members: true
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

    return NextResponse.json(updatedSpace)
  } catch (error) {
    console.error('Error updating space:', error)
    return NextResponse.json(
      { error: 'Failed to update space' },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[id] - Delete space
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
    const spaceId = parseInt(resolvedParams.id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Check if space exists
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        },
        _count: {
          select: {
            projects: true
          }
        }
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    // Only space owners/admins can delete
    const isSpaceOwnerOrAdmin = space.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )

    if (!isSpaceOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only space owners/admins can delete spaces' },
        { status: 403 }
      )
    }

    // Check if space has projects
    if (space._count.projects > 0) {
      return NextResponse.json(
        { error: 'Cannot delete space with existing projects. Delete or move projects first.' },
        { status: 400 }
      )
    }

    await prisma.space.delete({
      where: { id: spaceId }
    })

    return NextResponse.json({ message: 'Space deleted successfully' })
  } catch (error) {
    console.error('Error deleting space:', error)
    return NextResponse.json(
      { error: 'Failed to delete space' },
      { status: 500 }
    )
  }
}
