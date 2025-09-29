import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

// DELETE /api/projects/[id]/members/[memberId] - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, memberId } = await params

    // Verify current user has admin access to this project
    const currentUserMembership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: 'You do not have permission to manage members for this project' },
        { status: 403 }
      )
    }

    // Find the membership to remove
    const membershipToRemove = await prisma.projectMember.findFirst({
      where: {
        id: memberId,
        projectId: projectId
      }
    })

    if (!membershipToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent removing the project owner
    if (membershipToRemove.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove project owner' },
        { status: 400 }
      )
    }

    // Prevent non-owners from removing other admins
    if (membershipToRemove.role === 'ADMIN' && currentUserMembership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only project owners can remove administrators' },
        { status: 403 }
      )
    }

    // Remove the membership
    await prisma.projectMember.delete({
      where: {
        id: memberId
      }
    })

    return NextResponse.json(
      { message: 'Member removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing project member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}