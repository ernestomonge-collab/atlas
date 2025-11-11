'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  projectId?: string
  createdAt: string
  updatedAt: string
}

type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'
import { AlertTriangle, Calendar } from 'lucide-react'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  highlightOverdue?: boolean
}

export function TaskCard({ task, isDragging = false, highlightOverdue = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH': return 'border-l-red-500 bg-red-50'
      case 'MEDIUM': return 'border-l-yellow-500 bg-yellow-50'
      case 'LOW': return 'border-l-gray-300 bg-white'
      default: return 'border-l-gray-300 bg-white'
    }
  }

  const getPriorityBadgeColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: TaskPriority) => {
    if (priority === 'HIGH') {
      return <AlertTriangle className="h-3 w-3" />
    }
    return null
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana'
    }
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return dueDate < today
  }

  // Check if task is overdue
  const taskIsOverdue = task.dueDate && isOverdue(task.dueDate)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing border-l-4 hover:shadow-md transition-all ${getPriorityColor(task.priority)} ${
        isDragging ? 'rotate-3 scale-105' : ''
      } ${highlightOverdue && taskIsOverdue ? 'bg-red-50' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <div className="hover:text-blue-600">
            <h4 className="font-medium text-sm leading-tight line-clamp-2 hover:underline">
              {task.title}
            </h4>
          </div>

          {/* Due Date (in place of status) */}
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${
              isOverdue(task.dueDate) ? 'text-red-600' : 'text-gray-500'
            }`}>
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {formatDate(task.dueDate as unknown as string)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}