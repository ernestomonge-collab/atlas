'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Epic, EpicStatus } from '@/types'
import { Layers, Plus, Calendar, Target, ChevronDown, ChevronRight, CheckCircle2, ListPlus } from 'lucide-react'
import { CreateEpicModal } from './create-epic-modal'
import { AddTasksToEpicModal } from './add-tasks-to-epic-modal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ProjectConfig {
  statuses: Array<{
    id: string
    name: string
    color: string
    order: number
  }>
}

interface EpicsListProps {
  projectId: string
  projectConfig?: ProjectConfig | null
  showCreateModal?: boolean
  onCreateModalChange?: (show: boolean) => void
  onEpicCreated?: () => void
  canEdit?: boolean
  epics?: Epic[]
}

export function EpicsList({
  projectId,
  projectConfig,
  showCreateModal: externalShowCreateModal,
  onCreateModalChange,
  onEpicCreated: externalOnEpicCreated,
  canEdit = true,
  epics: externalEpics
}: EpicsListProps) {
  const [epics, setEpics] = useState<Epic[]>(externalEpics || [])
  const [isLoading, setIsLoading] = useState(!externalEpics)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddTasksModal, setShowAddTasksModal] = useState(false)
  const [selectedEpic, setSelectedEpic] = useState<{ id: string; name: string } | null>(null)
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set())

  // Update local epics when external epics change
  useEffect(() => {
    if (externalEpics) {
      setEpics(externalEpics)
      setIsLoading(false)
    }
  }, [externalEpics])

  // Only fetch if no external epics provided
  useEffect(() => {
    if (!externalEpics) {
      fetchEpics()
    }
  }, [projectId, externalEpics])

  const fetchEpics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/epics`)
      if (response.ok) {
        const data = await response.json()
        setEpics(data)
      }
    } catch (error) {
      console.error('Error fetching epics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEpicCreated = (newEpic: Epic) => {
    setEpics([newEpic, ...epics])
    if (externalOnEpicCreated) {
      externalOnEpicCreated()
    }
  }

  // Use external modal state if provided, otherwise use internal
  const isCreateModalOpen = externalShowCreateModal !== undefined ? externalShowCreateModal : showCreateModal
  const setIsCreateModalOpen = onCreateModalChange || setShowCreateModal

  const getStatusColor = (status: EpicStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'DONE':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: EpicStatus) => {
    switch (status) {
      case 'TODO':
        return 'Por Hacer'
      case 'IN_PROGRESS':
        return 'En Progreso'
      case 'DONE':
        return 'Completada'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  const isTaskCompleted = (task: any) => {
    // Use template-based completion logic
    if (projectConfig && projectConfig.statuses.length > 0) {
      const maxOrder = Math.max(...projectConfig.statuses.map(s => s.order))
      const statusConfig = projectConfig.statuses.find(s => s.id === task.status)
      return statusConfig?.order === maxOrder
    }
    // Fallback to status === 'COMPLETED' if no projectConfig
    return task.status === 'COMPLETED'
  }

  const calculateProgress = (epic: Epic) => {
    if (!epic.tasks || epic.tasks.length === 0) return 0

    const completedTasks = epic.tasks.filter(isTaskCompleted).length
    return Math.round((completedTasks / epic.tasks.length) * 100)
  }

  const getCompletedTasksCount = (tasks: any[]) => {
    return tasks.filter(isTaskCompleted).length
  }

  const toggleEpic = (epicId: string) => {
    setExpandedEpics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(epicId)) {
        newSet.delete(epicId)
      } else {
        newSet.add(epicId)
      }
      return newSet
    })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Epics List */}
      {epics.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay épicas todavía
              </h3>
              <p className="text-gray-500 mb-6">
                Las épicas te ayudan a organizar tareas relacionadas y rastrear objetivos de alto nivel.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Épica
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {epics.map((epic) => {
            const progress = calculateProgress(epic)
            const completedTasks = getCompletedTasksCount(epic.tasks || [])
            const totalTasks = epic.tasks?.length || 0
            const isExpanded = expandedEpics.has(epic.id)

            return (
              <Card key={epic.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleEpic(epic.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 mb-2 hover:opacity-70 transition-opacity text-left w-full">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: epic.color || '#8B5CF6' }}
                            />
                            <CardTitle className="text-lg">{epic.name}</CardTitle>
                            <span className="text-sm text-gray-500">({totalTasks})</span>
                          </button>
                        </CollapsibleTrigger>
                        <CardDescription className="ml-9">
                          {epic.description || 'Sin descripción'}
                        </CardDescription>
                      </div>

                      {/* Progress bar - aligned to the right */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {completedTasks}/{totalTasks}
                          </span>
                          <div className="w-32">
                            <Progress value={progress} className="h-1.5" />
                          </div>
                          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                            {progress}%
                          </span>
                        </div>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEpic({ id: epic.id, name: epic.name })
                              setShowAddTasksModal(true)
                            }}
                            className="h-8"
                          >
                            <ListPlus className="h-4 w-4 mr-1" />
                            Agregar Tareas
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">

                      {/* Tasks List - Collapsible */}
                      <CollapsibleContent>
                        {totalTasks > 0 ? (
                          <div className="pt-3 border-t space-y-2">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Tareas de esta Épica
                            </h4>
                            <div className="space-y-2">
                              {epic.tasks?.map((task) => {
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
                        ) : (
                          <div className="pt-3 border-t">
                            <p className="text-sm text-gray-500 text-center py-4">
                              No hay tareas asociadas a esta épica
                            </p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </CardContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>
      )}

      <CreateEpicModal
        projectId={projectId}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onEpicCreated={handleEpicCreated}
      />

      {selectedEpic && (
        <AddTasksToEpicModal
          epicId={selectedEpic.id}
          epicName={selectedEpic.name}
          projectId={projectId}
          open={showAddTasksModal}
          onOpenChange={setShowAddTasksModal}
          onTasksAdded={fetchEpics}
        />
      )}
    </div>
  )
}
