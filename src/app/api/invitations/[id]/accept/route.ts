import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/invitations/[id]/accept - Accept an invitation
export async function POST(
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

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Verify invitation is for this user
    if (invitation.email !== session.user.email) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      )
    }

    // Check if invitation is still valid
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invitation has already been processed' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Process invitation based on type
    await prisma.$transaction(async (tx) => {
      if (invitation.type === 'ORGANIZATION') {
        // Check if user already belongs to an organization
        const currentUser = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { organizationId: true }
        })

        if (currentUser?.organizationId === invitation.organizationId) {
          throw new Error('You already belong to this organization')
        }

        // Update user's organization
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            organizationId: invitation.organizationId
          }
        })
      } else if (invitation.type === 'SPACE' && invitation.spaceId) {
        // Add user to space
        const existingMember = await tx.spaceMember.findUnique({
          where: {
            spaceId_userId: {
              spaceId: invitation.spaceId,
              userId: parseInt(session.user.id)
            }
          }
        })

        if (!existingMember) {
          await tx.spaceMember.create({
            data: {
              spaceId: invitation.spaceId,
              userId: parseInt(session.user.id),
              role: invitation.role || 'MEMBER'
            }
          })
        }
      } else if (invitation.type === 'PROJECT' && invitation.projectId) {
        // Add user to project
        const existingMember = await tx.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invitation.projectId,
              userId: parseInt(session.user.id)
            }
          }
        })

        if (!existingMember) {
          await tx.projectMember.create({
            data: {
              projectId: invitation.projectId,
              userId: parseInt(session.user.id),
              role: invitation.role || 'MEMBER'
            }
          })
        }
      }

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      })
    })

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      type: invitation.type
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
