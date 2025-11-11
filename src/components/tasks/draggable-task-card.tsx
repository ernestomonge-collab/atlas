'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task, User, ProjectMember } from '@/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar as CalendarIcon, Users, CornerDownRight } from 'lucide-react'

interface DraggableTaskCardProps {
  task: Task
  teamMembers: ProjectMember[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  formatDate: (dateString: string) => string
  getPriorityColor: (priority: string) => string
  getPriorityText: (priority: string) => string
  canEdit?: boolean
  highlightOverdue?: boolean
}

export function DraggableTaskCard({
  task,
  teamMembers,
  onTaskUpdate,
  formatDate,
  getPriorityColor,
  getPriorityText,
  canEdit = true,
  highlightOverdue = false
}: DraggableTaskCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)

  // Check if this is a subtask
  const isSubtask = !!(task as any).taskId

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleTaskUpdate = async (field: string, value: string | Date | null) => {
    const oldValue = task[field as keyof Task]
    const updates: Partial<Task> = { [field]: value }

    // Update assignee object when assigneeId changes
    if (field === 'assigneeId') {
      updates.assignee = (value === 'unassigned' || !value ? undefined :
        teamMembers.find(member => member.id === value)) as unknown as User | undefined
      updates.assigneeId = value === 'unassigned' || !value ? undefined : value
    }

    // Optimistically update UI
    onTaskUpdate(task.id, updates)
    setEditingField(null)

    // Prepare data for API
    const apiData: any = {}
    if (field === 'assigneeId') {
      apiData.assigneeId = value === 'unassigned' || !value ? null : value
    } else if (field === 'dueDate') {
      if (value) {
        // Convert YYYY-MM-DD to noon local time to avoid timezone issues
        const [year, month, day] = (value as string).split('-').map(Number)
        const localDate = new Date(year, month - 1, day, 12, 0, 0, 0)
        apiData.dueDate = localDate.toISOString()
      } else {
        apiData.dueDate = null
      }
    } else if (field === 'priority') {
      apiData.priority = value
    } else if (field === 'status') {
      apiData.status = value
    }

    // Determine the correct API endpoint
    let apiUrl = `/api/tasks/${task.id}`
    if (isSubtask) {
      const parentTaskId = (task as any).taskId
      apiUrl = `/api/tasks/${parentTaskId}/subtasks/${task.id}`
    }

    // Call API to persist
    try {
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })

      if (!response.ok) {
        // Revert on error
        onTaskUpdate(task.id, { [field]: oldValue } as Partial<Task>)
        console.error('Failed to update task')
      }
    } catch (error) {
      // Revert on error
      console.error('Error updating task:', error)
      onTaskUpdate(task.id, { [field]: oldValue } as Partial<Task>)
    }
  }

  const handleDateUpdate = (date: Date | undefined) => {
    if (date) {
      // Convert date to YYYY-MM-DD without timezone conversion
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      handleTaskUpdate('dueDate', dateString)
    }
  }

  const handleFieldClick = (e: React.MouseEvent, field: string) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingField(field)
  }

  // Only apply drag props when not editing and canEdit is true
  const dragProps = (editingField || !canEdit) ? {} : { ...attributes, ...listeners }

  // Check if task is overdue
  const isOverdue = task.dueDate && (() => {
    const dueDate = new Date(task.dueDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return dueDate < today
  })()

  return (
    <Card
      ref={canEdit ? setNodeRef : undefined}
      style={canEdit ? style : undefined}
      {...dragProps}
      key={task.id}
      className={`${(!editingField && canEdit) ? 'cursor-grab active:cursor-grabbing' : 'cursor-auto'} hover:shadow-md transition-shadow ${
        isSubtask ? 'bg-gray-50 border-l-2 border-l-blue-400' : 'bg-white'
      } ${
        isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
      } ${
        highlightOverdue && isOverdue ? 'bg-red-50' : ''
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!editingField) {
          setIsHovering(false)
        }
      }}
    >
      <CardContent className="px-1.5 py-0.5">
        <div className="space-y-0.5">
          {/* Título de la tarea */}
          <div className="flex items-start gap-1">
            {isSubtask && (
              <CornerDownRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
            )}
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>
          </div>

          {/* Información adicional: fecha, asignado y prioridad */}
          <div className="space-y-1">
            {/* Fecha de vencimiento - Editable */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarIcon className="h-3 w-3" />
              {canEdit && editingField === 'dueDate' ? (
                <Popover open={true} onOpenChange={(open) => {
                  if (!open) {
                    setEditingField(null)
                    setIsHovering(false)
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.dueDate ? formatDate(task.dueDate as unknown as string) : 'Sin fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task.dueDate ? new Date(task.dueDate) : undefined}
                      onSelect={handleDateUpdate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span
                  className={`${isHovering && canEdit ? 'hover:text-blue-600 cursor-pointer' : ''}`}
                  onClick={(e) => canEdit && handleFieldClick(e, 'dueDate')}
                >
                  {task.dueDate ? formatDate(task.dueDate as unknown as string) : 'Sin fecha'}
                </span>
              )}
            </div>

            {/* Persona asignada y prioridad */}
            <div className="flex items-center justify-between">
              {/* Persona asignada - Editable */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                {canEdit && editingField === 'assignee' ? (
                  <Select
                    open={true}
                    value={task.assigneeId || 'unassigned'}
                    onValueChange={(value) => handleTaskUpdate('assigneeId', value === 'unassigned' ? null : value)}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingField(null)
                        setIsHovering(false)
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-auto p-0 border-none text-xs bg-transparent text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue>
                        <span className="truncate max-w-[100px]">
                          {task.assignee ? task.assignee.name : 'Sin asignar'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent onClick={(e) => e.stopPropagation()}>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Sin asignar
                        </div>
                      </SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {(member as unknown as User).name?.charAt(0) || (member as unknown as User).email?.charAt(0)}
                              </span>
                            </div>
                            {(member as unknown as User).name || (member as unknown as User).email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={`truncate max-w-[100px] ${isHovering && canEdit ? 'hover:text-blue-600 cursor-pointer' : ''}`}
                    onClick={(e) => canEdit && handleFieldClick(e, 'assignee')}
                  >
                    {task.assignee ? task.assignee.name : 'Sin asignar'}
                  </span>
                )}
              </div>

              {/* Prioridad - Editable */}
              {canEdit && editingField === 'priority' ? (
                <Select
                  open={true}
                  value={task.priority}
                  onValueChange={(value) => handleTaskUpdate('priority', value)}
                  onOpenChange={(open) => {
                    if (!open) {
                      setEditingField(null)
                      setIsHovering(false)
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-auto p-0 border-none bg-transparent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="outline"
                      className={`text-xs cursor-pointer ${getPriorityColor(task.priority)} ring-2 ring-blue-200`}
                    >
                      {getPriorityText(task.priority)}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent onClick={(e) => e.stopPropagation()}>
                    <SelectItem value="LOW">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor('LOW')}`}
                      >
                        {getPriorityText('LOW')}
                      </Badge>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor('MEDIUM')}`}
                      >
                        {getPriorityText('MEDIUM')}
                      </Badge>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor('HIGH')}`}
                      >
                        {getPriorityText('HIGH')}
                      </Badge>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor('URGENT')}`}
                      >
                        {getPriorityText('URGENT')}
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={`text-xs ${getPriorityColor(task.priority)} ${isHovering && canEdit ? 'hover:ring-2 hover:ring-blue-200 cursor-pointer' : ''}`}
                  onClick={(e) => canEdit && handleFieldClick(e, 'priority')}
                >
                  {getPriorityText(task.priority)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
