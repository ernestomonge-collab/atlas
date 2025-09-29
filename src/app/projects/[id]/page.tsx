'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MainLayout } from '@/components/layout/main-layout'
import { ManageProjectMembersModal } from '@/components/projects/manage-project-members-modal'
import { ProjectConfigModal } from '@/components/projects/project-config-modal'
import { EditTaskModal } from '@/components/tasks/edit-task-modal'
import { getMockProjectById, getMockTasksByProjectId, getMockSubtasksByTaskId } from '@/lib/mock-data'
import { ProjectConfig, getDefaultProjectConfig } from '@/lib/project-config'
import { Project, Task, User, ProjectMember } from '@/types'
import { TaskStatus, TaskPriority } from '@prisma/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import {
  CSS,
} from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  CheckCircle2,
  Circle,
  Target,
  AlertTriangle,
  Users,
  Edit,
  Settings,
  Plus,
  Layers,
  UserPlus,
  LayoutGrid,
  Grid3X3,
  ChevronDown,
  ChevronRight,
  X,
  Columns,
  List,
  Filter,
  Zap
} from 'lucide-react'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [showManageMembersModal, setShowManageMembersModal] = useState(false)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [editProjectData, setEditProjectData] = useState({ name: '', description: '' })
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('grid')
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([])
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Configuración de sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Funciones para manejar drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task as unknown as Task | null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as string

    // Actualizar el estado de la tarea
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, status: newStatus as unknown as TaskStatus }
        : task
    ) as unknown as Task[])

    setActiveTask(null)
  }

  // Componente para tarjetas draggables
  function DraggableTaskCard({ task }: { task: Task }) {
    const [isHovering, setIsHovering] = useState(false)
    const [editingField, setEditingField] = useState<string | null>(null)

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

    const handleTaskUpdate = (field: string, value: string | Date | null) => {
      const updatedTask = { ...task, [field]: value }

      // Update assignee object when assigneeId changes
      if (field === 'assigneeId') {
        updatedTask.assignee = (value === 'unassigned' || !value ? null :
          teamMembers.find(member => member.id === value)) as unknown as User | undefined
      }

      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t))
      setEditingField(null)
    }

    const handleDateUpdate = (date: Date | undefined) => {
      if (date) {
        handleTaskUpdate('dueDate', date.toISOString().split('T')[0])
      }
    }

    const handleFieldClick = (e: React.MouseEvent, field: string) => {
      e.preventDefault()
      e.stopPropagation()
      setEditingField(field)
    }

    // Only apply drag props when not editing
    const dragProps = (isDragging || editingField) ? {} : { ...attributes, ...listeners }

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...dragProps}
        key={task.id}
        className={`${!editingField ? 'cursor-grab active:cursor-grabbing' : 'cursor-auto'} hover:shadow-md transition-shadow bg-white ${
          isDragging ? 'rotate-2 scale-105 shadow-lg' : ''
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          if (!editingField) {
            setIsHovering(false)
          }
        }}
      >
        <CardContent className="p-2">
          <div className="space-y-1">
            {/* Título de la tarea */}
            <div>
              <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            </div>

            {/* Información adicional: fecha, asignado y prioridad */}
            <div className="space-y-0.5">
              {/* Fecha de vencimiento - Editable */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3" />
                {editingField === 'dueDate' ? (
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
                    className={`${isHovering ? 'hover:text-blue-600 cursor-pointer' : ''}`}
                    onClick={(e) => handleFieldClick(e, 'dueDate')}
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
                  {editingField === 'assignee' ? (
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
                      className={`truncate max-w-[100px] ${isHovering ? 'hover:text-blue-600 cursor-pointer' : ''}`}
                      onClick={(e) => handleFieldClick(e, 'assignee')}
                    >
                      {task.assignee ? task.assignee.name : 'Sin asignar'}
                    </span>
                  )}
                </div>

                {/* Prioridad - Editable */}
                {editingField === 'priority' ? (
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
                    className={`text-xs ${getPriorityColor(task.priority)} ${isHovering ? 'hover:ring-2 hover:ring-blue-200 cursor-pointer' : ''}`}
                    onClick={(e) => handleFieldClick(e, 'priority')}
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

  // Componente para columnas droppables
  function DroppableColumn({ column }: { column: { id: string; title: string; tasks: Task[] } }) {
    const { setNodeRef } = useDroppable({
      id: column.id,
    })

    return (
      <div
        ref={setNodeRef}
        className={`rounded-lg border-2 border-gray-200 min-h-[400px] w-80 flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-gray-700`}>
              {column.title}
            </h3>
            <Badge variant="secondary" className="bg-white">
              {column.tasks.length}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <SortableContext
            items={column.tasks.map((task: Task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.map((task: Task) => (
              <DraggableTaskCard key={task.id} task={task} />
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
  const [showSubtasks, setShowSubtasks] = useState(true)
  const [expandSubtasksByDefault, setExpandSubtasksByDefault] = useState(false)
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)
  const [taskFilters, setTaskFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    assignee: [] as string[]
  })
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: ''
  })

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && projectId) {
      fetchProjectDetails()
      fetchTeamMembers()
    }
  }, [session, projectId])

  const fetchProjectDetails = async () => {
    if (!projectId) return

    try {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))

      const projectData = getMockProjectById(projectId)
      const projectTasks = getMockTasksByProjectId(projectId)

      if (!projectData) {
        router.push('/projects')
        return
      }

      setProject(projectData as unknown as Project)
      setTasks(projectTasks as unknown as Task[])

      // Load subtasks for all tasks in the project
      const allSubtasks = projectTasks.flatMap(task => getMockSubtasksByTaskId(task.id))
      setSubtasks(allSubtasks as unknown as Task[])

      // Initialize project configuration
      const config = getDefaultProjectConfig(projectId)
      setProjectConfig(config)
    } catch (error) {
      console.error('Error fetching project details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const projectMembers = await response.json()
        const users = projectMembers.map((member: ProjectMember) => member.user)
        setTeamMembers(users)
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !project || !projectId) {
    return null
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completada'
      case 'IN_PROGRESS': return 'En Progreso'
      case 'PENDING': return 'Pendiente'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Alta'
      case 'MEDIUM': return 'Media'
      case 'LOW': return 'Baja'
      default: return priority
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completada'
      case 'IN_PROGRESS': return 'En Progreso'
      case 'PENDING': return 'Pendiente'
      default: return status
    }
  }

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const pendingTasks = tasks.filter(t => t.status === 'PENDING').length
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'COMPLETED') return false
    return new Date(t.dueDate) < new Date()
  }).length

  const assigneeIds = new Set(tasks.map(t => t.assigneeId).filter(Boolean))
  const teamMembersCount = assigneeIds.size

  const handleNewTask = () => {
    setIsNewTaskModalOpen(true)
  }

  const handleEditTask = (taskId: string) => {
    // First try to find it in main tasks
    let task = tasks.find(t => t.id === taskId)

    // If not found, search in subtasks
    if (!task) {
      // Search through all subtasks
      const subtask = subtasks.find(st => st.id === taskId)
      if (subtask) {
        const mainTask = tasks.find(t => t.id === (subtask as unknown as { taskId?: string }).taskId)
        if (mainTask) {
          // Convert subtask to task-like object for the modal
          task = {
            ...subtask,
            // Add missing properties that tasks have but subtasks don't
            priority: subtask.priority || 'MEDIUM',
            assigneeId: subtask.assigneeId || undefined,
            assignee: subtask.assignee || undefined,
            dueDate: subtask.dueDate || undefined,
            projectId: mainTask.projectId
          }
        }
      }
    }

    if (task) {
      setTaskToEdit(task)
      setShowEditTaskModal(true)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) return

    try {
      // TODO: Implement actual API call to create task
      console.log('Creating task:', newTaskForm)

      // For now, we'll simulate the creation
      const newTask = {
        id: `task-${Date.now()}`,
        title: newTaskForm.title,
        description: newTaskForm.description,
        status: 'PENDING',
        priority: newTaskForm.priority,
        projectId: projectId,
        assigneeId: newTaskForm.assigneeId || null,
        assignee: newTaskForm.assigneeId ? { id: newTaskForm.assigneeId, name: 'Usuario Asignado' } : null,
        dueDate: newTaskForm.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Add to current tasks
      setTasks(prev => [...prev, newTask as unknown as Task])

      // Close modal and reset form
      setIsNewTaskModalOpen(false)
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: ''
      })
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleCreateSubtask = (parentTaskId: string) => {
    // Create a new subtask for the parent task
    const newSubtask = {
      id: `subtask-${Date.now()}`,
      title: 'Nueva subtarea',
      description: '',
      status: 'PENDING',
      order: subtasks.filter(s => (s as unknown as { taskId?: string }).taskId === parentTaskId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add to subtasks state
    setSubtasks(prev => [...prev, newSubtask as unknown as Task])

    // Open edit modal for the new subtask
    const taskForModal = {
      ...newSubtask,
      priority: 'MEDIUM',
      assigneeId: null,
      assignee: null,
      dueDate: null,
      projectId: projectId,
      isSubtask: true,
      parentTaskId: parentTaskId
    }

    setTaskToEdit(taskForModal as unknown as Task)
    setShowEditTaskModal(true)
  }

  const handleFormChange = (field: string, value: string) => {
    setNewTaskForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    if ((updatedTask as unknown as { isSubtask?: boolean }).isSubtask) {
      // Handle subtask updates differently - we'll implement this with mock data updates
      console.log('Subtask updated:', updatedTask)
      // For now, just close the modal since subtasks are from mock data
      // In a real app, this would update the backend and refresh the data
      setTaskToEdit(null)
    } else {
      // Handle main task updates
      setTasks(prev => prev.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      ))
      setTaskToEdit(null)
    }
  }

  // New function to handle subtask inline updates
  const handleSubtaskUpdate = (subtaskId: string, field: string, value: string | Date | null) => {
    setSubtasks(prevSubtasks =>
      prevSubtasks.map(subtask => {
        if (subtask.id === subtaskId) {
          const updatedSubtask = { ...subtask }

          switch (field) {
            case 'status':
              (updatedSubtask as unknown as { status: string }).status = value as string
              break
            case 'priority':
              (updatedSubtask as unknown as { priority: string }).priority = value as string
              break
            case 'assignee':
              updatedSubtask.assigneeId = value === 'unassigned' ? undefined : value as string
              updatedSubtask.assignee = (value === 'unassigned' ? null :
                teamMembers.find(member => member.id === value)) as unknown as User | undefined
              break
            case 'dueDate':
              (updatedSubtask as unknown as { dueDate: string | null }).dueDate = value ? (value instanceof Date ? value.toISOString() : value as string) : null
              break
          }

          (updatedSubtask as unknown as { updatedAt: string }).updatedAt = new Date().toISOString()
          return updatedSubtask
        }
        return subtask
      })
    )

    console.log(`Updated subtask ${subtaskId}: ${field} = ${value}`)
  }

  const handleConfigUpdated = (updatedConfig: ProjectConfig) => {
    setProjectConfig(updatedConfig)
    // Reset collapsed groups when changing grouping method
    if (updatedConfig.gridGroupBy !== projectConfig?.gridGroupBy) {
      setCollapsedGroups(new Set())
    }
  }

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey)
      } else {
        newSet.add(groupKey)
      }
      return newSet
    })
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  // Organize tasks for kanban view based on project configuration
  const getKanbanColumns = () => {
    if (!projectConfig) return []

    if (projectConfig.kanbanLayout === 'status') {
      // Group by custom statuses
      const tasksByStatus: Record<string, Task[]> = {}

      projectConfig.statuses.forEach(status => {
        tasksByStatus[status.id] = tasks.filter(task =>
          task.status.toLowerCase() === status.id.toLowerCase() ||
          task.status === status.name.toUpperCase() ||
          task.status === status.id.toUpperCase()
        )
      })

      return projectConfig.statuses
        .sort((a, b) => a.order - b.order)
        .map(status => ({
          id: status.id,
          title: status.name,
          color: getColumnColorFromStatus(status.color),
          headerColor: getHeaderColorFromStatus(status.color),
          tasks: tasksByStatus[status.id] || []
        }))
    } else {
      // Group by priority (original behavior)
      const tasksByPriority = {
        HIGH: tasks.filter(task => task.priority === 'HIGH'),
        MEDIUM: tasks.filter(task => task.priority === 'MEDIUM'),
        LOW: tasks.filter(task => task.priority === 'LOW'),
        URGENT: tasks.filter(task => task.priority === 'URGENT')
      }

      return [
        {
          id: 'URGENT',
          title: 'Urgente',
          color: 'bg-red-50 border-red-200',
          headerColor: 'text-red-700',
          tasks: tasksByPriority.URGENT || []
        },
        {
          id: 'HIGH',
          title: 'Alta',
          color: 'bg-orange-50 border-orange-200',
          headerColor: 'text-orange-700',
          tasks: tasksByPriority.HIGH || []
        },
        {
          id: 'MEDIUM',
          title: 'Media',
          color: 'bg-yellow-50 border-yellow-200',
          headerColor: 'text-yellow-700',
          tasks: tasksByPriority.MEDIUM || []
        },
        {
          id: 'LOW',
          title: 'Baja',
          color: 'bg-green-50 border-green-200',
          headerColor: 'text-green-700',
          tasks: tasksByPriority.LOW || []
        }
      ]
    }
  }

  const getColumnColorFromStatus = (statusColor: string) => {
    if (statusColor.includes('gray')) return 'bg-gray-50 border-gray-200'
    if (statusColor.includes('blue')) return 'bg-blue-50 border-blue-200'
    if (statusColor.includes('green')) return 'bg-green-50 border-green-200'
    if (statusColor.includes('yellow')) return 'bg-yellow-50 border-yellow-200'
    if (statusColor.includes('red')) return 'bg-red-50 border-red-200'
    if (statusColor.includes('purple')) return 'bg-purple-50 border-purple-200'
    if (statusColor.includes('orange')) return 'bg-orange-50 border-orange-200'
    return 'bg-gray-50 border-gray-200'
  }

  const getHeaderColorFromStatus = (statusColor: string) => {
    if (statusColor.includes('gray')) return 'text-gray-700'
    if (statusColor.includes('blue')) return 'text-blue-700'
    if (statusColor.includes('green')) return 'text-green-700'
    if (statusColor.includes('yellow')) return 'text-yellow-700'
    if (statusColor.includes('red')) return 'text-red-700'
    if (statusColor.includes('purple')) return 'text-purple-700'
    if (statusColor.includes('orange')) return 'text-orange-700'
    return 'text-gray-700'
  }

  const columnConfig = getKanbanColumns()

  // Handle task status change in kanban view
  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus as unknown as TaskStatus } : task
    ) as unknown as Task[])
  }

  return (
    <MainLayout
      title={project.name}
      description={project.description || 'Detalles del proyecto y gestión de tareas'}
    >
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Proyectos
        </Link>
      </div>

      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Creado: {formatDate(project.createdAt as unknown as string)}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Actualizado: {formatDate(project.updatedAt as unknown as string)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleNewTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManageMembersModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Gestionar Miembros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditProjectData({
                  name: project.name,
                  description: project.description || ''
                })
                setShowEditProjectModal(true)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Project Description - Full Width */}
        {project.description && (
          <div className="mb-6">
            <p className="text-gray-600 text-lg leading-relaxed">{project.description}</p>
          </div>
        )}

      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tareas del Proyecto</CardTitle>
              <CardDescription>
                {tasks.length > 0
                  ? `Gestiona las ${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} de este proyecto`
                  : 'Crea la primera tarea para comenzar a organizar el trabajo'
                }
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {/* View Toggle Buttons */}
              <div className="flex items-center border border-gray-200 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Lista
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
              </div>


              {viewMode === 'grid' && (
                <Button
                  variant="outline"
                  onClick={() => setShowConfigPanel(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Personalizar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay tareas aún
              </h3>
              <p className="text-gray-500 mb-6">
                Comienza creando tu primera tarea. Puedes organizar el trabajo,
                establecer prioridades y hacer seguimiento del progreso.
              </p>
              <Button onClick={handleNewTask}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Tarea
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View (Table-like structure with grouping)
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {(() => {
                  const enabledColumns = projectConfig?.gridColumns
                    .filter(col => col.enabled)
                    .sort((a, b) => a.order - b.order) || []

                  const gridTemplateColumns = enabledColumns
                    .map(col => col.width || 'auto')
                    .join(' ')

                  const renderColumnContent = (task: Task, columnId: string) => {
                    switch (columnId) {
                      case 'title':
                        {
                          const taskSubtasks = subtasks.filter(s => (s as unknown as { taskId?: string }).taskId === task.id)
                          const completedSubtasks = taskSubtasks.filter(s => s.status === 'COMPLETED').length

                          // Lógica corregida para las dos opciones del panel
                          let shouldShowSubtasks = false
                          if (showSubtasks && taskSubtasks.length > 0) {
                            // Si "Mostrar subtareas" está activado, decidir basado en configuración y estado del usuario
                            if (expandSubtasksByDefault) {
                              // Expandir por defecto: mostrar a menos que el usuario las haya colapsado
                              shouldShowSubtasks = !expandedTasks.has(task.id)
                            } else {
                              // Contraer por defecto: mostrar solo si el usuario las ha expandido
                              shouldShowSubtasks = expandedTasks.has(task.id)
                            }
                          }

                          const isUserExpanded = expandSubtasksByDefault ? !expandedTasks.has(task.id) : expandedTasks.has(task.id)

                          return (
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                {taskSubtasks.length > 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleTaskExpansion(task.id)
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                  >
                                    {isUserExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm line-clamp-1 flex-1">
                                    {task.title}
                                  </h3>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditTask(task.id)
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 text-gray-400 hover:scale-110 flex-shrink-0"
                                    title="Editar tarea"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCreateSubtask(task.id)
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-green-100 hover:text-green-600 text-gray-400 hover:scale-110 flex-shrink-0"
                                    title="Añadir subtarea"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                {taskSubtasks.length > 0 && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>{completedSubtasks}/{taskSubtasks.length}</span>
                                    </div>
                                    <div className="w-16 bg-gray-200 rounded-full h-1">
                                      <div
                                        className="bg-green-500 h-1 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${taskSubtasks.length > 0 ? (completedSubtasks / taskSubtasks.length) * 100 : 0}%`
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }
                      case 'status':
                        return (
                          <div>
                            <Select
                              value={task.status}
                              onValueChange={(newStatus) => {
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id ? { ...t, status: newStatus as unknown as TaskStatus } : t
                                ) as unknown as Task[])
                              }}
                            >
                              <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0">
                                <Badge
                                  variant="outline"
                                  className={`text-xs cursor-pointer ${getStatusColor(task.status)}`}
                                >
                                  {getStatusText(task.status)}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusColor('PENDING')}`}
                                  >
                                    {getStatusText('PENDING')}
                                  </Badge>
                                </SelectItem>
                                <SelectItem value="IN_PROGRESS">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusColor('IN_PROGRESS')}`}
                                  >
                                    {getStatusText('IN_PROGRESS')}
                                  </Badge>
                                </SelectItem>
                                <SelectItem value="COMPLETED">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getStatusColor('COMPLETED')}`}
                                  >
                                    {getStatusText('COMPLETED')}
                                  </Badge>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      case 'priority':
                        return (
                          <div>
                            <Select
                              value={task.priority}
                              onValueChange={(newPriority) => {
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id ? { ...t, priority: newPriority as unknown as TaskPriority } : t
                                ) as unknown as Task[])
                              }}
                            >
                              <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0">
                                <Badge
                                  variant="outline"
                                  className={`text-xs cursor-pointer ${getPriorityColor(task.priority)}`}
                                >
                                  {getPriorityText(task.priority)}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
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
                          </div>
                        )
                      case 'assignee':
                        return (
                          <div>
                            <Select
                              value={task.assigneeId || 'unassigned'}
                              onValueChange={(newAssigneeId) => {
                                const assignee = teamMembers.find(m => m.id === newAssigneeId)
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id
                                    ? {
                                        ...t,
                                        assigneeId: newAssigneeId === 'unassigned' ? undefined : newAssigneeId,
                                        assignee: newAssigneeId === 'unassigned' ? undefined : assignee as unknown as User
                                      } as unknown as Task
                                    : t
                                ) as unknown as Task[])
                              }}
                            >
                              <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0 justify-start">
                                <div className="flex items-center gap-1 text-sm">
                                  <Users className="h-3 w-3 text-gray-400" />
                                  <span className="truncate text-xs">
                                    {task.assignee ? task.assignee.name : 'Sin asignar'}
                                  </span>
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs">Sin asignar</span>
                                  </div>
                                </SelectItem>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs">{(member as unknown as User).name || (member as unknown as User).email}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      case 'createdBy':
                        return (
                          <div>
                            <span className="text-xs text-gray-600">
                              {task.createdBy?.name || 'Usuario'}
                            </span>
                          </div>
                        )
                      case 'createdAt':
                        return (
                          <div>
                            <span className="text-xs text-gray-500">
                              {formatDate(task.createdAt as unknown as string)}
                            </span>
                          </div>
                        )
                      case 'updatedAt':
                        return (
                          <div>
                            <span className="text-xs text-gray-500">
                              {formatDate(task.updatedAt as unknown as string)}
                            </span>
                          </div>
                        )
                      case 'dueDate':
                        return (
                          <div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0 justify-start"
                                >
                                  <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>{task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}</span>
                                  </div>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                  onSelect={(date) => {
                                    setTasks(prev => prev.map(t =>
                                      t.id === task.id
                                        ? { ...t, dueDate: date ? date.toISOString().split('T')[0] : undefined } as unknown as Task
                                        : t
                                    ) as unknown as Task[])
                                  }}
                                  initialFocus
                                />
                                <div className="p-2 border-t">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-xs text-gray-500"
                                    onClick={() => {
                                      setTasks(prev => prev.map(t =>
                                        t.id === task.id ? { ...t, dueDate: undefined } as unknown as Task : t
                                      ) as unknown as Task[])
                                    }}
                                  >
                                    Limpiar fecha
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )
                      case 'description':
                        return (
                          <div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {task.description || 'Sin descripción'}
                            </p>
                          </div>
                        )
                      default:
                        return <div></div>
                    }
                  }

                  const renderSubtaskRow = (subtask: Task, enabledColumns: string[], gridTemplateColumns: string) => {
                    const getSubtaskStatusColor = (status: string) => {
                      switch (status) {
                        case 'COMPLETED': return 'bg-green-100 text-green-800'
                        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
                        case 'PENDING': return 'bg-gray-100 text-gray-800'
                        default: return 'bg-gray-100 text-gray-800'
                      }
                    }

                    const getSubtaskStatusText = (status: string) => {
                      switch (status) {
                        case 'COMPLETED': return 'Completada'
                        case 'IN_PROGRESS': return 'En Progreso'
                        case 'PENDING': return 'Pendiente'
                        default: return status
                      }
                    }

                    const renderSubtaskColumnContent = (subtask: Task, columnId: string) => {
                      switch (columnId) {
                        case 'title':
                          return (
                            <div className="flex items-center gap-2 ml-8">
                              {subtask.status === 'COMPLETED' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className={`text-sm flex-1 ${
                                  subtask.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-700'
                                }`}>
                                  {subtask.title}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditTask(subtask.id)
                                  }}
                                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 text-gray-400 hover:scale-110 flex-shrink-0"
                                  title="Editar subtarea"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        case 'status':
                          return (
                            <div>
                              <Select
                                value={subtask.status}
                                onValueChange={(newStatus) => {
                                  handleSubtaskUpdate(subtask.id, 'status', newStatus)
                                }}
                              >
                                <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs cursor-pointer ${getSubtaskStatusColor(subtask.status)}`}
                                  >
                                    {getSubtaskStatusText(subtask.status)}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getSubtaskStatusColor('PENDING')}`}
                                    >
                                      {getSubtaskStatusText('PENDING')}
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="IN_PROGRESS">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getSubtaskStatusColor('IN_PROGRESS')}`}
                                    >
                                      {getSubtaskStatusText('IN_PROGRESS')}
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="COMPLETED">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getSubtaskStatusColor('COMPLETED')}`}
                                    >
                                      {getSubtaskStatusText('COMPLETED')}
                                    </Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        case 'priority':
                          return (
                            <div>
                              <Select
                                value={subtask.priority || 'MEDIUM'}
                                onValueChange={(newPriority) => {
                                  handleSubtaskUpdate(subtask.id, 'priority', newPriority)
                                }}
                              >
                                <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs cursor-pointer ${getPriorityColor(subtask.priority || 'MEDIUM')}`}
                                  >
                                    {getPriorityText(subtask.priority || 'MEDIUM')}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent>
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
                            </div>
                          )
                        case 'assignee':
                          return (
                            <div>
                              <Select
                                value={subtask.assigneeId || 'unassigned'}
                                onValueChange={(newAssigneeId) => {
                                  handleSubtaskUpdate(subtask.id, 'assignee', newAssigneeId)
                                }}
                              >
                                <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0 justify-start">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Users className="h-3 w-3 text-gray-400" />
                                    <span className="truncate text-xs">
                                      {subtask.assignee ? subtask.assignee.name : 'Sin asignar'}
                                    </span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs">Sin asignar</span>
                                    </div>
                                  </SelectItem>
                                  {teamMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs">{(member as unknown as User).name || (member as unknown as User).email}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )
                        case 'dueDate':
                          return (
                            <div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0 justify-start"
                                  >
                                    <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span>{subtask.dueDate ? format(new Date(subtask.dueDate), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}</span>
                                    </div>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                                    onSelect={(date) => {
                                      handleSubtaskUpdate(subtask.id, 'dueDate', date || null)
                                    }}
                                    initialFocus
                                  />
                                  <div className="p-2 border-t">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs text-gray-500"
                                      onClick={() => {
                                        handleSubtaskUpdate(subtask.id, 'dueDate', null)
                                      }}
                                    >
                                      Limpiar fecha
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )
                        case 'createdBy':
                          return (
                            <div>
                              <span className="text-xs text-gray-600">
                                {subtask.createdBy?.name || 'Usuario'}
                              </span>
                            </div>
                          )
                        case 'createdAt':
                          return (
                            <div>
                              <span className="text-xs text-gray-500">
                                {subtask.createdAt ? formatDate(subtask.createdAt as unknown as string) : '-'}
                              </span>
                            </div>
                          )
                        case 'updatedAt':
                          return (
                            <div>
                              <span className="text-xs text-gray-500">
                                {subtask.updatedAt ? formatDate(subtask.updatedAt as unknown as string) : '-'}
                              </span>
                            </div>
                          )
                        case 'description':
                          return (
                            <div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {subtask.description || 'Sin descripción'}
                              </p>
                            </div>
                          )
                        default:
                          return <div></div>
                      }
                    }

                    return (
                      <div
                        key={`subtask-${subtask.id}`}
                        className="group grid gap-4 p-2 items-center bg-gray-50/50 hover:bg-blue-50 cursor-pointer transition-colors border-l-2 border-blue-200"
                        style={{gridTemplateColumns}}
                        onDoubleClick={() => handleEditTask(subtask.id)}
                        title="Doble clic para editar subtarea"
                      >
                        {enabledColumns.map(column => (
                          <div key={column}>
                            {renderSubtaskColumnContent(subtask, column)}
                          </div>
                        ))}
                      </div>
                    )
                  }

                  // Group tasks based on groupBy setting
                  const getGroupedTasks = () => {
                    const groupBy = projectConfig?.gridGroupBy || 'none'

                    if (groupBy === 'none') {
                      return [{ group: '', tasks: tasks }]
                    }

                    const grouped: Record<string, Task[]> = {}

                    tasks.forEach(task => {
                      let groupKey = ''

                      switch (groupBy) {
                        case 'status':
                          groupKey = getStatusText(task.status)
                          break
                        case 'priority':
                          groupKey = getPriorityText(task.priority)
                          break
                        case 'assignee':
                          groupKey = task.assignee ? (task.assignee as unknown as User).name || 'Sin asignar' : 'Sin asignar'
                          break
                        default:
                          groupKey = 'Todas las tareas'
                      }

                      if (!grouped[groupKey]) {
                        grouped[groupKey] = []
                      }
                      grouped[groupKey].push(task)
                    })

                    return Object.entries(grouped).map(([group, tasks]) => ({
                      group,
                      tasks
                    }))
                  }

                  const groupedTasks = getGroupedTasks()

                  return (
                    <div className="space-y-6">
                      {groupedTasks.map((group, groupIndex) => (
                        <div key={group.group || 'all'} className="space-y-2">
                          {/* Group Header */}
                          {group.group && (
                            <div className="flex items-center justify-between py-3 border-b border-gray-200">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleGroupCollapse(group.group)}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                >
                                  {collapsedGroups.has(group.group) ? (
                                    <ChevronRight className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                                <h3 className="font-semibold text-lg text-gray-800">
                                  {group.group}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {group.tasks.length} tarea{group.tasks.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Column Headers and Rows - Only show if not collapsed */}
                          {!collapsedGroups.has(group.group) && (
                            <>
                              {/* Column Headers */}
                              <div
                                className="grid gap-4 p-3 bg-gray-50 border-b font-semibold text-sm text-gray-700 rounded-t-lg"
                                style={{gridTemplateColumns}}
                              >
                                {enabledColumns.map(column => (
                                  <div key={column.id}>
                                    {column.name}
                                  </div>
                                ))}
                              </div>

                              {/* Group Rows */}
                              <div className="border border-gray-200 rounded-b-lg">
                                {group.tasks.map((task, index) => {
                                  const taskSubtasks = subtasks.filter(s => (s as unknown as { taskId?: string }).taskId === task.id)

                                  // Lógica corregida para las dos opciones del panel (misma que arriba)
                                  let shouldShowSubtasks = false
                                  if (showSubtasks && taskSubtasks.length > 0) {
                                    if (expandSubtasksByDefault) {
                                      shouldShowSubtasks = !expandedTasks.has(task.id)
                                    } else {
                                      shouldShowSubtasks = expandedTasks.has(task.id)
                                    }
                                  }

                                  const isLastTask = index === group.tasks.length - 1

                                  return (
                                    <React.Fragment key={task.id}>
                                      {/* Main Task Row */}
                                      <div
                                        className={`group grid gap-4 p-3 items-center hover:bg-blue-50 cursor-pointer transition-colors ${
                                          !isLastTask || shouldShowSubtasks ? 'border-b border-gray-100' : ''
                                        }`}
                                        style={{gridTemplateColumns}}
                                        onDoubleClick={() => handleEditTask(task.id)}
                                        title="Doble clic para editar tarea"
                                      >
                                        {enabledColumns.map(column => (
                                          <div key={column.id}>
                                            {renderColumnContent(task, column.id)}
                                          </div>
                                        ))}
                                      </div>

                                      {/* Subtasks Rows - Show by default unless collapsed */}
                                      {shouldShowSubtasks && (
                                        <>
                                          {taskSubtasks.map((subtask, subtaskIndex) => (
                                            <React.Fragment key={subtask.id}>
                                              {renderSubtaskRow(subtask, enabledColumns as unknown as string[], gridTemplateColumns)}
                                            </React.Fragment>
                                          ))}
                                          {/* Add border after subtasks if not the last task */}
                                          {!isLastTask && (
                                            <div className="border-b border-gray-100"></div>
                                          )}
                                        </>
                                      )}
                                    </React.Fragment>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            // Kanban View
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {columnConfig.map((column) => (
                  <DroppableColumn key={column.id} column={column} />
                ))}
                </div>
              </div>

              <DragOverlay>
                {activeTask && <DraggableTaskCard task={activeTask} />}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* New Task Modal */}
      <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Crea una nueva tarea para el proyecto {project.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título *
              </Label>
              <Input
                id="title"
                value={newTaskForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className="col-span-3"
                placeholder="Título de la tarea"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={newTaskForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="col-span-3"
                placeholder="Descripción de la tarea"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Prioridad
              </Label>
              <Select value={newTaskForm.priority} onValueChange={(value) => handleFormChange('priority', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Fecha de Vencimiento
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={newTaskForm.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskForm.title.trim()}>
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Members Modal */}
      <ManageProjectMembersModal
        projectId={projectId!}
        projectName={project.name}
        open={showManageMembersModal}
        onOpenChange={setShowManageMembersModal}
        onMembersUpdated={() => {
          // Refresh project data if needed
          fetchProjectDetails()
        }}
      />

      {/* Project Configuration Modal */}
      <ProjectConfigModal
        projectId={projectId!}
        projectName={project.name}
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        currentConfig={projectConfig}
        onConfigUpdated={handleConfigUpdated}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={taskToEdit as unknown as any}
        projectId={projectId!}
        open={showEditTaskModal}
        onOpenChange={setShowEditTaskModal}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Configuration Side Panel */}
      <div className={`fixed inset-y-0 right-0 z-30 w-80 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ${
        showConfigPanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-black">Configuración</h2>
          </div>
          <button
            onClick={() => setShowConfigPanel(false)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-full">
          {/* Campos Personalizados */}
          <div>
            <h3 className="font-medium text-black mb-3 flex items-center gap-2">
              <Columns className="h-4 w-4 text-gray-700" />
              Campos Personalizados
            </h3>
            <div className="space-y-2">
              {projectConfig?.gridColumns
                .sort((a, b) => a.order - b.order)
                .map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-4 bg-gray-300 rounded cursor-move"></div>
                      <span className="text-sm text-black font-medium">{column.name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={column.enabled}
                      onChange={(e) => {
                        if (projectConfig) {
                          const updatedConfig = {
                            ...projectConfig,
                            gridColumns: projectConfig.gridColumns.map(col =>
                              col.id === column.id ? { ...col, enabled: e.target.checked } : col
                            )
                          }
                          handleConfigUpdated(updatedConfig)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Agrupación y Vista */}
          <div>
            <h3 className="font-medium text-black mb-3 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-gray-700" />
              Vista General
            </h3>
            <div className="space-y-4">
              {/* Agrupar por */}
              <div>
                <Label className="text-sm font-medium text-black">Agrupar por</Label>
                <Select
                  value={projectConfig?.gridGroupBy || 'none'}
                  onValueChange={(value) => {
                    if (projectConfig) {
                      handleConfigUpdated({
                        ...projectConfig,
                        gridGroupBy: value as ProjectConfig['gridGroupBy']
                      })
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin Agrupar</SelectItem>
                    <SelectItem value="status">Estados</SelectItem>
                    <SelectItem value="priority">Prioridad</SelectItem>
                    <SelectItem value="assignee">Usuario Asignado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resaltar tareas vencidas */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-black">Resaltar tareas vencidas</span>
                  <p className="text-xs text-gray-600">Destacar tareas con fecha vencida</p>
                </div>
                <input
                  type="checkbox"
                  checked={showOverdueTasks}
                  onChange={(e) => setShowOverdueTasks(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Mostrar Subtareas */}
          <div>
            <h3 className="font-medium text-black mb-3 flex items-center gap-2">
              <List className="h-4 w-4 text-gray-700" />
              Vista de Subtareas
            </h3>
            <div className="space-y-3">

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div>
                  <span className="text-sm font-medium text-black">Expandir por defecto</span>
                  <p className="text-xs text-gray-600">Mostrar subtareas expandidas al cargar la página</p>
                </div>
                <input
                  type="checkbox"
                  checked={expandSubtasksByDefault}
                  onChange={(e) => {
                    setExpandSubtasksByDefault(e.target.checked)
                    // Limpiar el estado de expansión manual cuando se cambia el comportamiento por defecto
                    setExpandedTasks(new Set())
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Filtros Avanzados */}
          <div>
            <h3 className="font-medium text-black mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-700" />
              Filtros
            </h3>
            <div className="space-y-4">
              {/* Filtro por Estado */}
              <div>
                <Label className="text-sm font-medium text-black">Estados</Label>
                <div className="mt-2 space-y-2">
                  {projectConfig?.statuses.map((status) => (
                    <div key={status.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`status-${status.id}`}
                        checked={taskFilters.status.includes(status.id)}
                        onChange={(e) => {
                          const newFilters = { ...taskFilters }
                          if (e.target.checked) {
                            newFilters.status = [...newFilters.status, status.id]
                          } else {
                            newFilters.status = newFilters.status.filter(s => s !== status.id)
                          }
                          setTaskFilters(newFilters)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 text-xs"
                      />
                      <label htmlFor={`status-${status.id}`} className="text-xs text-gray-600">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${status.color}`}>
                          {status.name}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtro por Prioridad */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Prioridad</Label>
                <div className="mt-2 space-y-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                    <div key={priority} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`priority-${priority}`}
                        checked={taskFilters.priority.includes(priority)}
                        onChange={(e) => {
                          const newFilters = { ...taskFilters }
                          if (e.target.checked) {
                            newFilters.priority = [...newFilters.priority, priority]
                          } else {
                            newFilters.priority = newFilters.priority.filter(p => p !== priority)
                          }
                          setTaskFilters(newFilters)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 text-xs"
                      />
                      <label htmlFor={`priority-${priority}`} className="text-xs text-gray-600">
                        {priority}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>



          {/* Opciones Adicionales */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Funciones Avanzadas
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                Exportar tareas a CSV
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                Plantillas de tareas
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
                Configurar notificaciones
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTaskFilters({ status: [], priority: [], assignee: [] })
                setShowSubtasks(true)
                setExpandSubtasksByDefault(false)
                setShowOverdueTasks(false)
                setExpandedTasks(new Set())
                if (projectConfig) {
                  const resetConfig = {
                    ...projectConfig,
                    gridGroupBy: 'none' as ProjectConfig['gridGroupBy']
                  }
                  handleConfigUpdated(resetConfig)
                }
              }}
              className="w-full"
            >
              Restablecer configuración
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      <Dialog open={showEditProjectModal} onOpenChange={setShowEditProjectModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
            <DialogDescription>
              Modifica la información básica del proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Nombre del proyecto</Label>
              <Input
                id="project-name"
                value={editProjectData.name}
                onChange={(e) => setEditProjectData({
                  ...editProjectData,
                  name: e.target.value
                })}
                placeholder="Nombre del proyecto"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Descripción</Label>
              <Textarea
                id="project-description"
                value={editProjectData.description}
                onChange={(e) => setEditProjectData({
                  ...editProjectData,
                  description: e.target.value
                })}
                placeholder="Descripción del proyecto"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProjectModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Aquí se actualizarían los datos del proyecto
                // Por ahora solo cerramos el modal
                console.log('Actualizando proyecto:', editProjectData)
                setShowEditProjectModal(false)
              }}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  )
}