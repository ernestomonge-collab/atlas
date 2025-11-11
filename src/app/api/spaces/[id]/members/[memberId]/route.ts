import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/spaces/[id]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, memberId: memberIdStr } = await params
    const spaceId = parseInt(id)
    const memberId = parseInt(memberIdStr)

    if (isNaN(spaceId) || isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid space or member ID' },
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

    if (space.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user is space owner/admin or organization admin
    const isSpaceOwnerOrAdmin = space.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )
    const isOrgAdmin = session.user.role === 'ADMIN'

    if (!isSpaceOwnerOrAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only space owners/admins can update member roles' },
        { status: 403 }
      )
    }

    // Check if member exists
    const existingMember = await prisma.spaceMember.findUnique({
      where: { id: memberId }
    })

    if (!existingMember || existingMember.spaceId !== spaceId) {
      return NextResponse.json(
        { error: 'Member not found in this space' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    // Update member role
    const updatedMember = await prisma.spaceMember.update({
      where: { id: memberId },
      data: { role },
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

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error updating space member:', error)
    return NextResponse.json(
      { error: 'Failed to update space member' },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[id]/members/[memberId] - Remove member from space
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, memberId: memberIdStr } = await params
    const spaceId = parseInt(id)
    const memberId = parseInt(memberIdStr)

    if (isNaN(spaceId) || isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid space or member ID' },
        { status: 400 }
      )
    }

    // Verify space exists and user has access
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: true
      }
    })

    if (!space) {
      return NextResponse.json(
        { error: 'Space not found' },
        { status: 404 }
      )
    }

    if (space.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user is space owner/admin or organization admin
    const userMembership = space.members.find(m => m.userId === session.user.id)
    const isSpaceOwnerOrAdmin = userMembership && (userMembership.role === 'OWNER' || userMembership.role === 'ADMIN')
    const isOrgAdmin = session.user.role === 'ADMIN'

    if (!isSpaceOwnerOrAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only space owners/admins can remove members' },
        { status: 403 }
      )
    }

    // Check if member exists
    const memberToRemove = space.members.find(m => m.id === memberId)

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found in this space' },
        { status: 404 }
      )
    }

    // Prevent removing the last owner
    if (memberToRemove.role === 'OWNER') {
      const ownerCount = space.members.filter(m => m.role === 'OWNER').length
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the space' },
          { status: 400 }
        )
      }
    }

    await prisma.spaceMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing space member:', error)
    return NextResponse.json(
      { error: 'Failed to remove space member' },
      { status: 500 }
    )
  }
}
