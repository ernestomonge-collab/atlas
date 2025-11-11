'use client'

import { Badge } from '@/components/ui/badge'
import { Task, ProjectMember } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Target, Calendar } from 'lucide-react'
import { DraggableTaskCard } from '@/components/tasks/draggable-task-card'

interface Sprint {
  id: number | string
  name: string
  status: string
  startDate: string | Date
  endDate: string | Date
}

interface DroppableSprintColumnProps {
  sprint: Sprint
  tasks: Task[]
  teamMembers: ProjectMember[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  formatDate: (dateString: string) => string
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  canEdit?: boolean
}

export function DroppableSprintColumn({
  sprint,
  tasks,
  teamMembers,
  onTaskUpdate,
  formatDate,
  getPriorityColor,
  getPriorityText,
  canEdit = true
}: DroppableSprintColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `sprint-${sprint.id}`,
  })

  const getSprintStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'border-blue-400 bg-blue-50'
      case 'COMPLETED':
        return 'border-green-400 bg-green-50'
      case 'PLANNING':
        return 'border-gray-400 bg-white'
      default:
        return 'border-gray-400 bg-white'
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 min-h-[500px] w-80 flex-shrink-0 ${getSprintStatusColor(sprint.status)}`}
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {sprint.name}
          </h3>
          <Badge
            variant="outline"
            className={sprint.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      sprint.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'}
          >
            {sprint.status === 'ACTIVE' ? 'Activo' :
             sprint.status === 'COMPLETED' ? 'Completado' :
             'Planificación'}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(sprint.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            {' - '}
            {new Date(sprint.endDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
          </div>
          <Badge variant="secondary" className="bg-white">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              onTaskUpdate={onTaskUpdate}
              formatDate={formatDate}
              getPriorityColor={getPriorityColor}
              getPriorityText={getPriorityText}
              canEdit={canEdit}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Sin tareas asignadas</p>
          </div>
        )}
      </div>
    </div>
  )
}
