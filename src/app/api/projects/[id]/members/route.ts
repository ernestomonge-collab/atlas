import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyProjectAccess } from '@/lib/project-access'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyProjectMemberAdded } from '@/lib/notifications'

// GET /api/projects/[id]/members - Get all members of a project
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
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)

    // Get search parameter from URL
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Build where clause for search
    const userWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // Get members AND verify access in a single query
    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
        // Verify user is a member of this project
        project: {
          members: {
            some: {
              userId
            }
          }
        },
        // Apply search filter to user
        user: userWhere
      },
      select: {
        id: true,
        role: true,
        joinedAt: true,
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

    // If no members returned, either project doesn't exist or user doesn't have access
    if (members.length === 0) {
      // Check if project exists
      const projectExists = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true }
      })

      if (!projectExists) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'No eres miembro de este proyecto' },
        { status: 403 }
      )
    }

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching project members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project members' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/members - Add a member to a project
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

    const resolvedParams = await params
    const projectId = parseInt(resolvedParams.id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
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

    // Check if user is project owner/admin
    const isProjectOwnerOrAdmin = project.members.some(
      m => m.role === 'OWNER' || m.role === 'ADMIN'
    )

    if (!isProjectOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only project owners/admins can add members' },
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
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userIdInt
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      )
    }

    // Add member
    const member = await prisma.projectMember.create({
      data: {
        projectId,
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
    await notifyProjectMemberAdded(
      userIdInt.toString(),
      projectId.toString(),
      project.name,
      session.user.name || session.user.email
    ).catch(err => console.error('Failed to send notification:', err))

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding project member:', error)
    return NextResponse.json(
      { error: 'Failed to add project member' },
      { status: 500 }
    )
  }
}
