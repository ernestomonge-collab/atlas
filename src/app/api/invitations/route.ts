import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/invitations - Get all invitations for the user or organization
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
    const type = searchParams.get('type') // 'received' or 'sent'

    let invitations

    if (type === 'received') {
      // Get invitations for the user's email
      invitations = await prisma.invitation.findMany({
        where: {
          email: session.user.email || ''
        },
        include: {
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          space: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Get invitations sent by users in the same organization
      invitations = await prisma.invitation.findMany({
        where: {
          organizationId: session.user.organizationId
        },
        include: {
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          space: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, type, role, spaceId, projectId } = body

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!type || !['ORGANIZATION', 'SPACE', 'PROJECT'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid invitation type is required (ORGANIZATION, SPACE, PROJECT)' },
        { status: 400 }
      )
    }

    // Validate type-specific requirements
    if (type === 'SPACE' && !spaceId) {
      return NextResponse.json(
        { error: 'Space ID is required for space invitations' },
        { status: 400 }
      )
    }

    if (type === 'PROJECT' && !projectId) {
      return NextResponse.json(
        { error: 'Project ID is required for project invitations' },
        { status: 400 }
      )
    }

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        organizationId: session.user.organizationId
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 400 }
      )
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        organizationId: session.user.organizationId,
        status: 'PENDING'
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Verify access for space/project invitations
    if (type === 'SPACE' && spaceId) {
      const space = await prisma.space.findUnique({
        where: { id: parseInt(spaceId) }
      })

      if (!space || space.organizationId !== session.user.organizationId) {
        return NextResponse.json(
          { error: 'Space not found or access denied' },
          { status: 404 }
        )
      }
    }

    if (type === 'PROJECT' && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) }
      })

      if (!project || project.organizationId !== session.user.organizationId) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: email.trim().toLowerCase(),
        type,
        role: role || 'MEMBER',
        organizationId: session.user.organizationId,
        spaceId: spaceId ? parseInt(spaceId) : null,
        projectId: projectId ? parseInt(projectId) : null,
        invitedById: session.user.id,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
