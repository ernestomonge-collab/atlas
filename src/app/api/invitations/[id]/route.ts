import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/invitations/[id] - Get a single invitation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const invitationId = parseInt(params.id)

    if (isNaN(invitationId)) {
      return NextResponse.json(
        { error: 'Invalid invitation ID' },
        { status: 400 }
      )
    }

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
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

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user has access (either recipient or from same organization)
    const hasAccess =
      invitation.email === session.user.email ||
      invitation.organizationId === session.user.organizationId

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[id] - Cancel/delete an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const invitationId = parseInt(params.id)

    if (isNaN(invitationId)) {
      return NextResponse.json(
        { error: 'Invalid invitation ID' },
        { status: 400 }
      )
    }

    // Check if invitation exists
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Only the inviter or org admin can cancel
    if (
      invitation.invitedById !== session.user.id &&
      invitation.organizationId !== session.user.organizationId &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only the inviter or organization admin can cancel this invitation' },
        { status: 403 }
      )
    }

    await prisma.invitation.delete({
      where: { id: invitationId }
    })

    return NextResponse.json({ message: 'Invitation cancelled successfully' })
  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    )
  }
}
