import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationOptions {
  userId: string
  title: string
  message: string
  type: NotificationType
  taskId?: string
  projectId?: string
  link?: string
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  taskId,
  projectId,
  link,
}: CreateNotificationOptions) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        title,
        message,
        type,
        ...(taskId && { taskId: parseInt(taskId) }),
        ...(projectId && { projectId: parseInt(projectId) }),
        ...(link && { link }),
      },
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

// Notification generators for common events
export async function notifyTaskAssigned(taskId: string, assigneeId: string, taskTitle: string, projectId: string) {
  return createNotification({
    userId: assigneeId,
    title: 'Nueva tarea asignada',
    message: `Se te ha asignado la tarea: ${taskTitle}`,
    type: 'TASK_ASSIGNED',
    taskId,
    projectId,
    link: `/projects/${projectId}?taskId=${taskId}`,
  })
}

export async function notifyTaskUpdated(
  taskId: string,
  affectedUserIds: string[],
  taskTitle: string,
  updatedBy: string,
  projectId: string
) {
  const notifications = await Promise.all(
    affectedUserIds.map(userId =>
      createNotification({
        userId,
        title: 'Tarea actualizada',
        message: `${updatedBy} actualizó la tarea: ${taskTitle}`,
        type: 'TASK_UPDATED',
        taskId,
        projectId,
        link: `/projects/${projectId}?taskId=${taskId}`,
      })
    )
  )

  return notifications
}

export async function notifyCommentAdded(
  taskId: string,
  affectedUserIds: string[],
  taskTitle: string,
  commenterName: string,
  projectId: string
) {
  const notifications = await Promise.all(
    affectedUserIds.map(userId =>
      createNotification({
        userId,
        title: 'Nuevo comentario',
        message: `${commenterName} comentó en la tarea: ${taskTitle}`,
        type: 'COMMENT_ADDED',
        taskId,
        projectId,
        link: `/projects/${projectId}?taskId=${taskId}`,
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
        link: `/projects/${projectId}`,
      })
    )
  )

  return notifications
}

// New: Notify when user is added to a project
export async function notifyProjectMemberAdded(
  userId: string,
  projectId: string,
  projectName: string,
  addedBy: string
) {
  return createNotification({
    userId,
    title: 'Agregado a proyecto',
    message: `${addedBy} te agregó al proyecto: ${projectName}`,
    type: 'PROJECT_UPDATED',
    projectId,
    link: `/projects/${projectId}`,
  })
}

// New: Notify when user is mentioned in a comment
export async function notifyMention(
  userId: string,
  taskId: string,
  taskTitle: string,
  mentionedBy: string,
  projectId: string
) {
  return createNotification({
    userId,
    title: 'Te mencionaron en un comentario',
    message: `${mentionedBy} te mencionó en la tarea: ${taskTitle}`,
    type: 'COMMENT_ADDED',
    taskId,
    projectId,
    link: `/projects/${projectId}?taskId=${taskId}`,
  })
}

// New: Notify when a task is completed
export async function notifyTaskCompleted(
  userId: string,
  taskId: string,
  taskTitle: string,
  completedBy: string,
  projectId: string
) {
  return createNotification({
    userId,
    title: 'Tarea completada',
    message: `${completedBy} completó la tarea: ${taskTitle}`,
    type: 'TASK_UPDATED',
    taskId,
    projectId,
    link: `/projects/${projectId}?taskId=${taskId}`,
  })
}

// New: Notify when user is added to a space
export async function notifySpaceMemberAdded(
  userId: string,
  spaceId: string,
  spaceName: string,
  addedBy: string
) {
  return createNotification({
    userId,
    title: 'Agregado a espacio',
    message: `${addedBy} te agregó al espacio: ${spaceName}`,
    type: 'INFO',
    link: `/spaces/${spaceId}`,
  })
}

// Helper function to extract user mentions from text (@username or @email)
export function extractMentions(text: string): string[] {
  // Match @username or @email patterns
  const mentionPattern = /@(\w+(?:\.\w+)*(?:@[\w.-]+)?)/g
  const matches = text.match(mentionPattern)

  if (!matches) return []

  // Remove @ symbol and return unique mentions
  return [...new Set(matches.map(m => m.substring(1)))]
}

// Helper function to get user IDs from usernames/emails
export async function getUserIdsFromMentions(mentions: string[]): Promise<number[]> {
  if (mentions.length === 0) return []

  try {
    // Create case-insensitive queries for each mention
    const orConditions = mentions.flatMap(mention => [
      { email: { equals: mention, mode: 'insensitive' as const } },
      { name: { equals: mention, mode: 'insensitive' as const } }
    ])

    const users = await prisma.user.findMany({
      where: {
        OR: orConditions
      },
      select: { id: true }
    })

    return users.map(u => u.id)
  } catch (error) {
    console.error('Failed to get user IDs from mentions:', error)
    return []
  }
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