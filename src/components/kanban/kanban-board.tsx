'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanColumn } from './kanban-column'
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

interface KanbanBoardProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: { status?: string }) => Promise<void>
}

const columns = [
  {
    id: 'PENDING',
    title: 'Pendiente',
    color: 'bg-gray-100 border-gray-300',
  },
  {
    id: 'IN_PROGRESS',
    title: 'En Progreso',
    color: 'bg-blue-50 border-blue-300',
  },
  {
    id: 'COMPLETED',
    title: 'Completado',
    color: 'bg-green-50 border-green-300',
  },
]

export function KanbanBoard({ tasks, onTaskUpdate }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find(t => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over || active.id === over.id) return

    const taskId = active.id as string
    const newStatus = over.id as string

    // Check if it's actually a status column
    if (!columns.find(col => col.id === newStatus)) return

    const task = localTasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update: Update UI immediately
    setLocalTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus as any } : t
      )
    )

    try {
      await onTaskUpdate(taskId, { status: newStatus })
    } catch (error) {
      console.error('Failed to update task status:', error)
      // Revert optimistic update on error
      setLocalTasks(tasks)
    }
  }

  const getTasksByStatus = (status: string) => {
    return localTasks.filter(task => task.status === status)
  }

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id)
            return (
              <div key={column.id} className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{column.title}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>

                <Card className={`flex-1 ${column.color}`}>
                  <CardContent className="p-4 h-full">
                    <SortableContext
                      items={columnTasks.map(task => task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <KanbanColumn
                        id={column.id}
                        tasks={columnTasks}
                      />
                    </SortableContext>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}