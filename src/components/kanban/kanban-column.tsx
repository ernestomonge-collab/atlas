'use client'

import { useDroppable } from '@dnd-kit/core'
import { TaskCard } from './task-card'

interface Task {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  dueDate?: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface KanbanColumnProps {
  id: string
  tasks: Task[]
}

export function KanbanColumn({ id, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-full space-y-3 transition-colors ${
        isOver ? 'bg-blue-50/50 rounded-lg' : ''
      }`}
    >
      {tasks.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          Sin tareas
        </div>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))
      )}
    </div>
  )
}