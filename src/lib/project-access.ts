import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Verifies that the user has access to a project (must be a project member)
 * Returns the project if access is granted, or a NextResponse error if not
 */
export async function verifyProjectAccess(projectId: number) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  const userId = parseInt(session.user.id)

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      members: {
        where: { userId },
        select: {
          userId: true,
          role: true
        }
      }
    }
  })

  if (!project) {
    return {
      error: NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
  }

  // User must be a member of the project
  if (project.members.length === 0) {
    return {
      error: NextResponse.json(
        { error: 'No eres miembro de este proyecto' },
        { status: 403 }
      )
    }
  }

  const userRole = project.members[0].role

  return {
    project,
    session,
    userId,
    userRole
  }
}

/**
 * Verifies that the user can edit the project (not a VIEWER)
 * Returns error if user is a VIEWER
 */
export async function verifyProjectEditAccess(projectId: number) {
  const accessCheck = await verifyProjectAccess(projectId)

  if (accessCheck.error) {
    return accessCheck
  }

  // Check if user is VIEWER
  if (accessCheck.userRole === 'VIEWER') {
    return {
      error: NextResponse.json(
        { error: 'No tienes permisos para editar este proyecto' },
        { status: 403 }
      )
    }
  }

  return accessCheck
}
