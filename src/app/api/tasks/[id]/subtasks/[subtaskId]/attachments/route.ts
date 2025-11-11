import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/tasks/[id]/subtasks/[subtaskId]/attachments - Get all attachments for a subtask
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
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

    const subtaskId = parseInt(resolvedParams.subtaskId)

    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Invalid subtask ID' },
        { status: 400 }
      )
    }

    // Verify subtask exists and user is a member of the project
    const subtask = await prisma.task.findUnique({
      where: { id: subtaskId },
      include: {
        parentTask: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId: parseInt(session.user.id) }
                }
              }
            }
          }
        }
      }
    })

    if (!subtask || !subtask.parentTaskId) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }

    if (!subtask.parentTask?.project.members || subtask.parentTask.project.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    const attachments = await prisma.attachment.findMany({
      where: {
        taskId: subtaskId
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

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching subtask attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/subtasks/[subtaskId]/attachments - Create a new attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
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

    const subtaskId = parseInt(resolvedParams.subtaskId)

    if (isNaN(subtaskId)) {
      return NextResponse.json(
        { error: 'Invalid subtask ID' },
        { status: 400 }
      )
    }

    // Verify subtask exists and user is a member of the project
    const subtask = await prisma.task.findUnique({
      where: { id: subtaskId },
      include: {
        parentTask: {
          include: {
            project: {
              include: {
                members: {
                  where: { userId: parseInt(session.user.id) }
                }
              }
            }
          }
        }
      }
    })

    if (!subtask || !subtask.parentTaskId) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }

    if (!subtask.parentTask?.project.members || subtask.parentTask.project.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this project' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { filename, url, size, mimeType } = body

    // Validate required fields
    if (!filename || !filename.trim()) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      )
    }

    // Create attachment
    const attachment = await prisma.attachment.create({
      data: {
        filename: filename.trim(),
        url: url.trim(),
        size: size || null,
        mimeType: mimeType || null,
        taskId: subtaskId,
        uploadedById: parseInt(session.user.id)
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
    console.error('Error creating subtask attachment:', error)
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    )
  }
}
