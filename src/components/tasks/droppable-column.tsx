'use client'

import { Badge } from '@/components/ui/badge'
import { Task, ProjectMember } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutGrid } from 'lucide-react'
import { DraggableTaskCard } from './draggable-task-card'

interface DroppableColumnProps {
  column: {
    id: string
    title: string
    tasks: Task[]
    color?: string
    headerColor?: string
  }
  teamMembers: ProjectMember[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  formatDate: (dateString: string) => string
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  canEdit?: boolean
}

export function DroppableColumn({
  column,
  teamMembers,
  onTaskUpdate,
  formatDate,
  getPriorityColor,
  getPriorityText,
  canEdit = true
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div ref={setNodeRef} className={`rounded-lg border-2 border-gray-200 min-h-[500px] w-72 flex-shrink-0 flex flex-col`}>
      <div className={`p-3 border-b border-gray-200 ${column.color || 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${column.headerColor || 'text-gray-700'}`}>
            {column.title}
          </h3>
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm text-xs">
            {column.tasks.length}
          </Badge>
        </div>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        <SortableContext
          items={column.tasks.map((task: Task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task: Task) => (
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

        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <LayoutGrid className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No hay tareas</p>
          </div>
        )}
      </div>
    </div>
  )
}
