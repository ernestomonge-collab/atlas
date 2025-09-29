import { prisma } from '@/lib/db'
import { NotificationType } from '@prisma/client'

interface CreateNotificationOptions {
  userId: string
  title: string
  message: string
  type: NotificationType
  taskId?: string
  projectId?: string
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  taskId,
  projectId,
}: CreateNotificationOptions) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        taskId,
        projectId,
      },
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

// Notification generators for common events
export async function notifyTaskAssigned(taskId: string, assigneeId: string, taskTitle: string) {
  return createNotification({
    userId: assigneeId,
    title: 'Nueva tarea asignada',
    message: `Se te ha asignado la tarea: ${taskTitle}`,
    type: 'TASK_ASSIGNED',
    taskId,
  })
}

export async function notifyTaskUpdated(
  taskId: string,
  affectedUserIds: string[],
  taskTitle: string,
  updatedBy: string
) {
  const notifications = await Promise.all(
    affectedUserIds.map(userId =>
      createNotification({
        userId,
        title: 'Tarea actualizada',
        message: `${updatedBy} actualizó la tarea: ${taskTitle}`,
        type: 'TASK_UPDATED',
        taskId,
      })
    )
  )

  return notifications
}

export async function notifyCommentAdded(
  taskId: string,
  affectedUserIds: string[],
  taskTitle: string,
  commenterName: string
) {
  const notifications = await Promise.all(
    affectedUserIds.map(userId =>
      createNotification({
        userId,
        title: 'Nuevo comentario',
        message: `${commenterName} comentó en la tarea: ${taskTitle}`,
        type: 'COMMENT_ADDED',
        taskId,
      })
    )
  )

  return notifications
}

export async function notifyProjectUpdated(
  projectId: string,
  affectedUserIds: string[],
  projectName: string,
  updatedBy: string
) {
  const notifications = await Promise.all(
    affectedUserIds.map(userId =>
      createNotification({
        userId,
        title: 'Proyecto actualizado',
        message: `${updatedBy} actualizó el proyecto: ${projectName}`,
        type: 'PROJECT_UPDATED',
        projectId,
      })
    )
  )

  return notifications
}

// Helper function to get affected users for a task
export async function getTaskAffectedUsers(taskId: string): Promise<string[]> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        createdBy: true,
        comments: {
          include: { user: true },
        },
      },
    })

    if (!task) return []

    const userIds = new Set<string>()

    // Add task creator
    userIds.add(task.createdById)

    // Add assignee
    if (task.assigneeId) {
      userIds.add(task.assigneeId)
    }

    // Add commenters
    task.comments.forEach(comment => {
      userIds.add(comment.userId)
    })

    return Array.from(userIds)
  } catch (error) {
    console.error('Failed to get task affected users:', error)
    return []
  }
}