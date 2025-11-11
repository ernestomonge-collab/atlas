import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/tasks/[id]/subtasks/[subtaskId]/comments - Get all comments for a subtask
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

    const comments = await prisma.comment.findMany({
      where: {
        taskId: subtaskId
      },
      include: {
        user: {
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

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching subtask comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/subtasks/[subtaskId]/comments - Create a new comment
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
    const { content } = body

    // Validate required fields
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId: subtaskId,
        userId: parseInt(session.user.id)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
