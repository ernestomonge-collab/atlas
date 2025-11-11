import { prisma } from '@/lib/prisma'

/**
 * Create an audit log entry for task changes
 */
export async function createAuditLog({
  action,
  taskId,
  userId,
  field,
  oldValue,
  newValue,
  details
}: {
  action: string
  taskId: number
  userId: string
  field?: string
  oldValue?: string
  newValue?: string
  details?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        taskId,
        userId: parseInt(userId),
        field,
        oldValue,
        newValue,
        details
      }
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logs shouldn't break the main operation
  }
}

/**
 * Compare old and new task data and create audit logs for changes
 */
export async function auditTaskChanges({
  oldTask,
  newTask,
  userId
}: {
  oldTask: any
  newTask: any
  userId: string
}) {
  const changes: Array<{
    field: string
    oldValue: string
    newValue: string
    action: string
  }> = []

  // Check title
  if (oldTask.title !== newTask.title) {
    changes.push({
      field: 'Título',
      oldValue: oldTask.title,
      newValue: newTask.title,
      action: 'Cambió el título'
    })
  }

  // Check description
  if (oldTask.description !== newTask.description) {
    changes.push({
      field: 'Descripción',
      oldValue: oldTask.description || '(vacío)',
      newValue: newTask.description || '(vacío)',
      action: 'Cambió la descripción'
    })
  }

  // Check status
  if (oldTask.status !== newTask.status) {
    const statusLabels: Record<string, string> = {
      TODO: 'Por Hacer',
      IN_PROGRESS: 'En Progreso',
      DONE: 'Completada',
      BLOCKED: 'Bloqueada',
      BACKLOG: 'Backlog'
    }
    changes.push({
      field: 'Estado',
      oldValue: statusLabels[oldTask.status] || oldTask.status,
      newValue: statusLabels[newTask.status] || newTask.status,
      action: 'Cambió el estado'
    })
  }

  // Check priority
  if (oldTask.priority !== newTask.priority) {
    const priorityLabels: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      URGENT: 'Urgente'
    }
    changes.push({
      field: 'Prioridad',
      oldValue: priorityLabels[oldTask.priority] || oldTask.priority,
      newValue: priorityLabels[newTask.priority] || newTask.priority,
      action: 'Cambió la prioridad'
    })
  }

  // Check assignee
  if (oldTask.assigneeId !== newTask.assigneeId) {
    // Get assignee names
    let oldAssigneeName = 'Sin asignar'
    let newAssigneeName = 'Sin asignar'

    if (oldTask.assigneeId) {
      const oldAssignee = await prisma.user.findUnique({
        where: { id: oldTask.assigneeId },
        select: { name: true, email: true }
      })
      oldAssigneeName = oldAssignee?.name || oldAssignee?.email || `Usuario ${oldTask.assigneeId}`
    }

    if (newTask.assigneeId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: newTask.assigneeId },
        select: { name: true, email: true }
      })
      newAssigneeName = newAssignee?.name || newAssignee?.email || `Usuario ${newTask.assigneeId}`
    }

    changes.push({
      field: 'Asignado',
      oldValue: oldAssigneeName,
      newValue: newAssigneeName,
      action: 'Cambió la asignación'
    })
  }

  // Check due date
  if (oldTask.dueDate?.toString() !== newTask.dueDate?.toString()) {
    changes.push({
      field: 'Fecha de vencimiento',
      oldValue: oldTask.dueDate ? new Date(oldTask.dueDate).toLocaleDateString('es-ES') : 'Sin fecha',
      newValue: newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString('es-ES') : 'Sin fecha',
      action: 'Cambió la fecha de vencimiento'
    })
  }

  // Check epic
  if (oldTask.epicId !== newTask.epicId) {
    // Get epic names
    let oldEpicName = 'Sin épica'
    let newEpicName = 'Sin épica'

    if (oldTask.epicId) {
      const oldEpic = await prisma.epic.findUnique({
        where: { id: oldTask.epicId },
        select: { name: true }
      })
      oldEpicName = oldEpic?.name || `Épica ${oldTask.epicId}`
    }

    if (newTask.epicId) {
      const newEpic = await prisma.epic.findUnique({
        where: { id: newTask.epicId },
        select: { name: true }
      })
      newEpicName = newEpic?.name || `Épica ${newTask.epicId}`
    }

    changes.push({
      field: 'Épica',
      oldValue: oldEpicName,
      newValue: newEpicName,
      action: 'Cambió la épica'
    })
  }

  // Check sprint
  if (oldTask.sprintId !== newTask.sprintId) {
    // Get sprint names
    let oldSprintName = 'Sin sprint'
    let newSprintName = 'Sin sprint'

    if (oldTask.sprintId) {
      const oldSprint = await prisma.sprint.findUnique({
        where: { id: oldTask.sprintId },
        select: { name: true }
      })
      oldSprintName = oldSprint?.name || `Sprint ${oldTask.sprintId}`
    }

    if (newTask.sprintId) {
      const newSprint = await prisma.sprint.findUnique({
        where: { id: newTask.sprintId },
        select: { name: true }
      })
      newSprintName = newSprint?.name || `Sprint ${newTask.sprintId}`
    }

    changes.push({
      field: 'Sprint',
      oldValue: oldSprintName,
      newValue: newSprintName,
      action: 'Cambió el sprint'
    })
  }

  // Create audit log entries for each change
  for (const change of changes) {
    await createAuditLog({
      action: change.action,
      taskId: oldTask.id,
      userId,
      field: change.field,
      oldValue: change.oldValue,
      newValue: change.newValue
    })
  }

  return changes.length
}

/**
 * Get human-readable action labels
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'created': 'Tarea creada',
    'updated': 'Tarea actualizada',
    'deleted': 'Tarea eliminada',
    'status_changed': 'Estado cambiado',
    'assigned': 'Asignación cambiada',
    'priority_changed': 'Prioridad cambiada',
    'comment_added': 'Comentario agregado',
    'attachment_added': 'Archivo adjunto agregado',
    'attachment_removed': 'Archivo adjunto eliminado',
    'subtask_added': 'Subtarea agregada',
    'subtask_completed': 'Subtarea completada'
  }

  return labels[action] || action
}
