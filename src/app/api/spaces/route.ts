import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/spaces - List all spaces for the user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get spaces that are either:
    // 1. Public (isPublic = true)
    // 2. Private but user is a member
    const spaces = await prisma.space.findMany({
      where: {
        OR: [
          // Public spaces
          { isPublic: true },
          // Private spaces where user is a member
          {
            isPublic: false,
            members: {
              some: {
                userId: parseInt(session.user.id)
              }
            }
          }
        ]
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(spaces)
  } catch (error) {
    console.error('Error fetching spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
      { status: 500 }
    )
  }
}

// POST /api/spaces - Create a new space
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can create spaces
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can create spaces' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color, icon, isPublic, templateId } = body

    // Validate
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      )
    }

    // Create space and add creator as admin member
    const space = await prisma.space.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || 'folder',
        isPublic: isPublic ?? true,
        ...(session.user.organizationId && { organizationId: session.user.organizationId }),
        ...(templateId && { templateId: parseInt(templateId) }),
        members: {
          create: {
            userId: parseInt(session.user.id),
            role: 'ADMIN'
          }
        }
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

    return NextResponse.json(space, { status: 201 })
  } catch (error) {
    console.error('Error creating space:', error)
    return NextResponse.json(
      { error: 'Failed to create space' },
      { status: 500 }
    )
  }
}
