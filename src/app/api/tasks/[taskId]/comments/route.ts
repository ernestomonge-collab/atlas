import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { notifyCommentAdded, getTaskAffectedUsers } from '@/lib/notifications'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { taskId } = await params

    // Verify task exists and user has access to it via project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!task || task.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { content } = commentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Send notifications to affected users (excluding the commenter)
    const affectedUsers = await getTaskAffectedUsers(taskId)
    const usersToNotify = affectedUsers.filter(userId => userId !== session.user.id)

    if (usersToNotify.length > 0) {
      await notifyCommentAdded(
        taskId,
        usersToNotify,
        task.title,
        session.user.name || session.user.email
      )
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Comment creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { taskId } = await params

    // Verify task exists and user has access to it via project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    })

    if (!task || task.project.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}