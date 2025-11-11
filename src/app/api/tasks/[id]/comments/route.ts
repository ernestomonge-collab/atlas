import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notifyCommentAdded, extractMentions, getUserIdsFromMentions, notifyMention } from '@/lib/notifications'

// GET /api/tasks/[id]/comments - Get all comments for a task
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

    // Get comments AND verify user is a member of the project
    const comments = await prisma.comment.findMany({
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

    // If no comments returned, verify if user has access to the project
    if (comments.length === 0) {
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

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/comments - Create a new comment
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

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            organizationId: true,
            id: true
          }
        },
        assignee: {
          select: { id: true }
        },
        createdBy: {
          select: { id: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
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
        taskId,
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

    // Send notifications to task participants (assignee and creator, excluding commenter)
    const usersToNotify = new Set<number>()
    const currentUserId = parseInt(session.user.id)

    if (task.assigneeId && task.assigneeId !== currentUserId) {
      usersToNotify.add(task.assigneeId)
    }
    if (task.createdById !== currentUserId) {
      usersToNotify.add(task.createdById)
    }

    if (usersToNotify.size > 0) {
      await notifyCommentAdded(
        task.id.toString(),
        Array.from(usersToNotify).map(id => id.toString()),
        task.title,
        session.user.name || session.user.email,
        task.project.id.toString()
      ).catch(err => console.error('Failed to send notification:', err))
    }

    // Extract and notify mentioned users
    const mentions = extractMentions(content)
    if (mentions.length > 0) {
      const mentionedUserIds = await getUserIdsFromMentions(mentions)
      const mentionedUsersToNotify = mentionedUserIds.filter(id => id !== currentUserId)

      for (const userId of mentionedUsersToNotify) {
        await notifyMention(
          userId.toString(),
          task.id.toString(),
          task.title,
          session.user.name || session.user.email,
          task.project.id.toString()
        ).catch(err => console.error('Failed to send mention notification:', err))
      }
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
