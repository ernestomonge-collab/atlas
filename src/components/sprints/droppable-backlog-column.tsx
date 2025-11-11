'use client'

import { Badge } from '@/components/ui/badge'
import { Task, ProjectMember } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Layers } from 'lucide-react'
import { DraggableTaskCard } from '@/components/tasks/draggable-task-card'

interface DroppableBacklogColumnProps {
  tasks: Task[]
  teamMembers: ProjectMember[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  formatDate: (dateString: string) => string
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  canEdit?: boolean
}

export function DroppableBacklogColumn({
  tasks,
  teamMembers,
  onTaskUpdate,
  formatDate,
  getPriorityColor,
  getPriorityText,
  canEdit = true
}: DroppableBacklogColumnProps) {
  const { setNodeRef } = useDroppable({
    id: 'sprint-backlog',
  })

  return (
    <div
      ref={setNodeRef}
      className="rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] w-80 flex-shrink-0 bg-gray-50"
    >
      <div className="p-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Backlog
          </h3>
          <Badge variant="secondary" className="bg-white">
            {tasks.length}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-1">Tareas sin sprint asignado</p>
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
            <Layers className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Sin tareas</p>
          </div>
        )}
      </div>
    </div>
  )
}
