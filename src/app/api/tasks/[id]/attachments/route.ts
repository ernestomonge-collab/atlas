import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/tasks/[id]/attachments - Get all attachments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const taskId = parseInt(resolvedParams.id)

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    // Get attachments AND verify user is a member of the project
    const attachments = await prisma.attachment.findMany({
      where: {
        taskId,
        task: {
          project: {
            members: {
              some: {
                userId: parseInt(session.user.id)
              }
            }
          }
        }
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If no attachments returned, verify if user has access to the project
    if (attachments.length === 0) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: {
            include: {
              members: {
                where: { userId: parseInt(session.user.id) }
              }
            }
          }
        }
      })

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        )
      }

      if (task.project.members.length === 0) {
        return NextResponse.json(
          { error: 'You are not a member of this project' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/attachments - Create a new attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const taskId = parseInt(resolvedParams.id)

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    // Verify task exists and user is a member of the project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: parseInt(session.user.id) }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.project.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { fileName, fileUrl, fileSize, fileType } = body

    // Validate required fields
    if (!fileName || !fileName.trim()) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    if (!fileUrl || !fileUrl.trim()) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    // Create attachment
    const attachment = await prisma.attachment.create({
      data: {
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        fileSize: fileSize || null,
        fileType: fileType || null,
        taskId,
        uploadedById: session.user.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error creating attachment:', error)
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    )
  }
}
