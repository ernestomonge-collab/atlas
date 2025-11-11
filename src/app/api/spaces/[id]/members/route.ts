import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifySpaceMemberAdded } from '@/lib/notifications'

// GET /api/spaces/[id]/members - Get all members of a space
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

    const { id } = await params
    const spaceId = parseInt(id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Verify space exists
    const space = await prisma.space.findUnique({
      where: { id: spaceId }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    const members = await prisma.spaceMember.findMany({
      where: {
        spaceId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching space members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch space members' },
      { status: 500 }
    )
  }
}

// POST /api/spaces/[id]/members - Add a member to a space
export async function POST(
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

    const { id } = await params
    const spaceId = parseInt(id)

    if (isNaN(spaceId)) {
      return NextResponse.json(
        { error: 'Invalid space ID' },
        { status: 400 }
      )
    }

    // Verify space exists and user has access
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        }
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    // Check if user is space owner/admin
    const isSpaceOwnerOrAdmin = space.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )

    if (!isSpaceOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only space owners/admins can add members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userIdInt = parseInt(userId)
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userIdInt },
      select: { id: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId,
          userId: userIdInt
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this space' },
        { status: 400 }
      )
    }

    // Add member
    const member = await prisma.spaceMember.create({
      data: {
        spaceId,
        userId: userIdInt,
        role: role || 'MEMBER'
      },
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
    })

    // Send notification to the new member
    await notifySpaceMemberAdded(
      userIdInt.toString(),
      spaceId.toString(),
      space.name,
      session.user.name || session.user.email
    ).catch(err => console.error('Failed to send notification:', err))

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding space member:', error)
    return NextResponse.json(
      { error: 'Failed to add space member' },
      { status: 500 }
    )
  }
}
