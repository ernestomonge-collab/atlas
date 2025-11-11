import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PATCH /api/projects/[id]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projectId = parseInt(params.id)
    const memberId = parseInt(params.memberId)

    if (isNaN(projectId) || isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid project or member ID' },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: parseInt(session.user.id) }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user is project owner/admin or organization admin
    const isProjectOwnerOrAdmin = project.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )
    const isOrgAdmin = session.user.role === 'ADMIN'

    if (!isProjectOwnerOrAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only project owners/admins can update member roles' },
        { status: 403 }
      )
    }

    // Check if member exists
    const existingMember = await prisma.projectMember.findUnique({
      where: { id: memberId }
    })

    if (!existingMember || existingMember.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Member not found in this project' },
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
    const updatedMember = await prisma.projectMember.update({
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
    console.error('Error updating project member:', error)
    return NextResponse.json(
      { error: 'Failed to update project member' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/members/[memberId] - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projectId = parseInt(params.id)
    const memberId = parseInt(params.memberId)

    if (isNaN(projectId) || isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid project or member ID' },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user is project owner/admin or organization admin
    const userMembership = project.members.find(m => m.userId === session.user.id)
    const isProjectOwnerOrAdmin = userMembership && (userMembership.role === 'OWNER' || userMembership.role === 'ADMIN')
    const isOrgAdmin = session.user.role === 'ADMIN'

    if (!isProjectOwnerOrAdmin && !isOrgAdmin) {
      return NextResponse.json(
        { error: 'Only project owners/admins can remove members' },
        { status: 403 }
      )
    }

    // Check if member exists
    const memberToRemove = project.members.find(m => m.id === memberId)

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found in this project' },
        { status: 404 }
      )
    }

    // Prevent removing the last owner
    if (memberToRemove.role === 'OWNER') {
      const ownerCount = project.members.filter(m => m.role === 'OWNER').length
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the project' },
          { status: 400 }
        )
      }
    }

    await prisma.projectMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing project member:', error)
    return NextResponse.json(
      { error: 'Failed to remove project member' },
      { status: 500 }
    )
  }
}
