'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Target, Calendar, CheckCircle, Clock, MoreVertical, Edit, Trash2, Play, Pause, ChevronDown, ChevronRight, ListPlus, Users, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddTasksToSprintModal } from './add-tasks-to-sprint-modal'

interface Task {
  id: string | number
  title: string
  status: string
  priority: string
  assignee?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface Sprint {
  id: number
  name: string
  goal?: string | null
  startDate: string
  endDate: string
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED'
  _count?: {
    tasks: number
  }
  tasks?: Task[]
}

interface SprintListProps {
  sprints: Sprint[]
  onEdit?: (sprint: Sprint) => void
  onDelete?: (sprint: Sprint) => void
  onStatusChange?: (sprintId: number, newStatus: 'PLANNING' | 'ACTIVE' | 'COMPLETED') => void
  onSprintUpdated?: () => void
  projectId?: string
  projectConfig?: {
    statuses: Array<{
      id: string
      name: string
      color: string
      order: number
    }>
  } | null
  canEdit?: boolean
}

export function SprintList({ sprints, onEdit, onDelete, onStatusChange, onSprintUpdated, projectId, projectConfig, canEdit = true }: SprintListProps) {
  const [expandedSprints, setExpandedSprints] = useState<Set<number>>(new Set())
  const [sprintTasks, setSprintTasks] = useState<Record<number, Task[]>>({})
  const [showAddTasksModal, setShowAddTasksModal] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<{ id: number; name: string } | null>(null)

  const toggleSprint = (sprintId: number) => {
    setExpandedSprints(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sprintId)) {
        newSet.delete(sprintId)
      } else {
        newSet.add(sprintId)
        // Fetch tasks when expanding
        if (!sprintTasks[sprintId] && projectId) {
          fetchSprintTasks(sprintId)
        }
      }
      return newSet
    })
  }

  const fetchSprintTasks = async (sprintId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (response.ok) {
        const allTasks = await response.json()
        const filtered = allTasks.filter((task: any) => task.sprintId === sprintId)
        setSprintTasks(prev => ({ ...prev, [sprintId]: filtered }))
      }
    } catch (error) {
      console.error('Error fetching sprint tasks:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PLANNING':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo'
      case 'COMPLETED':
        return 'Completado'
      case 'PLANNING':
        return 'Planificación'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'PLANNING':
        return <Target className="h-4 w-4" />
      default:
        return null
    }
  }

  const parseLocalDate = (dateString: string) => {
    // Parse date as local date to avoid timezone issues
    const date = new Date(dateString)
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  }

  const getDaysRemaining = (endDate: string) => {
    const end = parseLocalDate(endDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-700'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700'
      case 'COMPLETED':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'IN_PROGRESS':
        return 'En Progreso'
      case 'COMPLETED':
        return 'Completada'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      case 'LOW':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const isTaskCompleted = (task: Task) => {
    // Use template-based completion logic if available
    if (projectConfig && projectConfig.statuses.length > 0) {
      const maxOrder = Math.max(...projectConfig.statuses.map(s => s.order))
      const statusConfig = projectConfig.statuses.find(s => s.id === task.status)
      return statusConfig?.order === maxOrder
    }
    // Fallback to status === 'COMPLETED' if no projectConfig
    return task.status === 'COMPLETED'
  }

  const calculateProgress = (tasks: Task[]) => {
    if (!tasks || tasks.length === 0) return 0

    const completedTasks = tasks.filter(isTaskCompleted).length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  const getCompletedTasksCount = (tasks: Task[]) => {
    return tasks.filter(isTaskCompleted).length
  }

  const handleTasksAdded = () => {
    // Clear local cache and refetch sprint data
    if (selectedSprint) {
      setSprintTasks(prev => {
        const newState = { ...prev }
        delete newState[selectedSprint.id]
        return newState
      })
      // Refetch tasks for the sprint that was just updated
      if (projectId) {
        fetchSprintTasks(selectedSprint.id)
      }
    }
    // Also trigger parent refresh
    if (onSprintUpdated) {
      onSprintUpdated()
    }
  }

  if (sprints.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay sprints creados
          </h3>
          <p className="text-gray-500">
            Crea tu primer sprint para comenzar a organizar las tareas de tu proyecto
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sprints.map((sprint) => {
        const daysRemaining = getDaysRemaining(sprint.endDate)
        const isActive = sprint.status === 'ACTIVE'
        const isCompleted = sprint.status === 'COMPLETED'
        const isExpanded = expandedSprints.has(sprint.id)
        // Use locally fetched tasks if available, otherwise use tasks from sprint object
        const tasks = sprintTasks[sprint.id] || sprint.tasks || []

        return (
          <Collapsible
            key={sprint.id}
            open={isExpanded}
            onOpenChange={() => toggleSprint(sprint.id)}
          >
            <Card className={`overflow-hidden hover:shadow-md transition-shadow ${isActive ? 'border-blue-300' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side: Sprint name and status */}
                  <div className="flex-1 min-w-0">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 mb-2 hover:opacity-70 transition-opacity text-left w-full">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <Badge variant="outline" className={`${getStatusColor(sprint.status)} flex-shrink-0`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(sprint.status)}
                            {getStatusText(sprint.status)}
                          </span>
                        </Badge>
                        <CardTitle className="text-lg">{sprint.name}</CardTitle>
                        <span className="text-sm text-gray-500">({tasks.length})</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 ml-2">
                          <Calendar className="h-3 w-3" />
                          {format(parseLocalDate(sprint.startDate), 'dd MMM', { locale: es })} - {format(parseLocalDate(sprint.endDate), 'dd MMM yyyy', { locale: es })}
                        </span>
                        {isActive && (
                          <span className={`text-xs flex items-center gap-1 font-medium ml-2 ${daysRemaining > 7 ? 'text-green-600' : daysRemaining > 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                            <Clock className="h-3 w-3" />
                            {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                          </span>
                        )}
                      </button>
                    </CollapsibleTrigger>
                    {sprint.goal && (
                      <CardDescription className="ml-9">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Target className="h-3 w-3" />
                          {sprint.goal}
                        </span>
                      </CardDescription>
                    )}
                  </div>

                  {/* Right side: Progress bar and Menu */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {getCompletedTasksCount(tasks)}/{tasks.length}
                      </span>
                      <div className="w-32">
                        <Progress value={calculateProgress(tasks)} className="h-1.5" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                        {calculateProgress(tasks)}%
                      </span>
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                      {!isCompleted && (
                        <DropdownMenuItem onClick={() => {
                          setSelectedSprint({ id: sprint.id, name: sprint.name })
                          setShowAddTasksModal(true)
                        }}>
                          <ListPlus className="mr-2 h-4 w-4" />
                          Agregar tareas
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(sprint)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar sprint
                        </DropdownMenuItem>
                      )}
                      {onStatusChange && !isCompleted && (
                        <>
                          <DropdownMenuSeparator />
                          {sprint.status === 'PLANNING' && (
                            <DropdownMenuItem onClick={() => onStatusChange(sprint.id, 'ACTIVE')}>
                              <Play className="mr-2 h-4 w-4" />
                              Iniciar sprint
                            </DropdownMenuItem>
                          )}
                          {sprint.status === 'ACTIVE' && (
                            <DropdownMenuItem onClick={() => onStatusChange(sprint.id, 'COMPLETED')}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Completar sprint
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(sprint)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar sprint
                          </DropdownMenuItem>
                        </>
                      )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">

                  {/* Collapsible Tasks Section */}
                  <CollapsibleContent>
                    {tasks.length === 0 ? (
                      <div className="pt-3 border-t">
                        <div className="text-center py-8 text-gray-400">
                          <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay tareas asignadas a este sprint</p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Tareas del Sprint
                        </h4>
                        <div className="space-y-2">
                          {tasks.map((task) => {
                            const completed = isTaskCompleted(task)
                            return (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                  completed
                                    ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <CheckCircle2
                                    className={`h-4 w-4 ${
                                      completed
                                        ? 'text-green-600'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                      completed
                                        ? 'line-through text-gray-500'
                                        : 'text-gray-900'
                                    }`}>
                                      {task.title}
                                    </p>
                                    {task.priority && (
                                      <p className={`text-xs ${getPriorityColor(task.priority)} mt-0.5`}>
                                        Prioridad: {task.priority}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getTaskStatusColor(task.status)}`}
                                >
                                  {getTaskStatusText(task.status)}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </CardContent>
            </Card>
          </Collapsible>
        )
      })}

      {selectedSprint && projectId && (
        <AddTasksToSprintModal
          sprintId={selectedSprint.id}
          sprintName={selectedSprint.name}
          projectId={projectId}
          open={showAddTasksModal}
          onOpenChange={setShowAddTasksModal}
          onTasksAdded={handleTasksAdded}
        />
      )}
    </div>
  )
}
