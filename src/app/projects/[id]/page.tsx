'use client'

import { useRouter, useSearchParams } from 'next/navigation'
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
import { EditProjectModal } from '@/components/projects/edit-project-modal'
import { ProjectConfigModal } from '@/components/projects/project-config-modal'
import { EditTaskModal } from '@/components/tasks/edit-task-modal'
import { AddSubtaskModal } from '@/components/tasks/add-subtask-modal'
import { EpicsList } from '@/components/epics/epics-list'
import { Epic } from '@/types'
import { CreateSprintModal } from '@/components/sprints/create-sprint-modal'
import { SprintList } from '@/components/sprints/sprint-list'
import { DraggableTaskCard } from '@/components/tasks/draggable-task-card'
import { DroppableColumn } from '@/components/tasks/droppable-column'
import { DroppableBacklogColumn } from '@/components/sprints/droppable-backlog-column'
import { DroppableSprintColumn } from '@/components/sprints/droppable-sprint-column'
import { useSession } from 'next-auth/react'
import { useConfirm } from '@/hooks/use-confirm'
import { ProjectConfig, getDefaultProjectConfig, getProjectConfigFromTemplate } from '@/lib/project-config'
import { Project, Task, User, ProjectMember } from '@/types'
import { TaskPriority } from '@prisma/client'
import { toast } from 'sonner'
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
  Zap,
  Search
} from 'lucide-react'

// Helper function to safely parse dates and avoid timezone issues
const parseDate = (dateString: string | undefined): Date | undefined => {
  if (!dateString) return undefined
  try {
    // If the date string is just YYYY-MM-DD, append time to avoid timezone conversion
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return new Date(dateString + 'T00:00:00')
    }
    return new Date(dateString)
  } catch {
    return undefined
  }
}

// Helper function to format date safely
const formatDateSafe = (dateString: string | undefined): string => {
  if (!dateString) return 'Sin fecha'
  const date = parseDate(dateString)
  if (!date || isNaN(date.getTime())) return 'Sin fecha'
  return format(date, 'dd MMM yyyy', { locale: es })
}

// Helper function to convert Date to YYYY-MM-DD string without timezone conversion
const dateToString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirm, ConfirmationDialog } = useConfirm()
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
  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false)
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<{ id: string; title: string } | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'sprints'>('grid')
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([])
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<any[]>([])
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false)
  const [sprintToEdit, setSprintToEdit] = useState<any | null>(null)
  const [epics, setEpics] = useState<Epic[]>([])
  const [showCreateEpicModal, setShowCreateEpicModal] = useState(false)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [activeTab, setActiveTab] = useState<'tasks' | 'epics' | 'sprints'>('tasks')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [showSubtasks, setShowSubtasks] = useState(true)
  const [expandSubtasksByDefault, setExpandSubtasksByDefault] = useState(false)
  const [showOverdueTasks, setShowOverdueTasks] = useState(false)
  const [taskFilters, setTaskFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    assignee: [] as string[]
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    sprintId: '',
    epicId: ''
  })
  // Calendar popover state management
  const [openCalendarTaskId, setOpenCalendarTaskId] = useState<string | null>(null)
  const [openCalendarSubtaskId, setOpenCalendarSubtaskId] = useState<string | null>(null)

  // Helper to check if current user is owner or admin of this project
  const isProjectOwnerOrAdmin = project?.members?.some(
    member => member.userId === parseInt(session?.user?.id || '0')
      && (member.role === 'OWNER' || member.role === 'ADMIN')
  )

  // Helper to check if current user can edit (not a VIEWER)
  const canEdit = project?.members?.some(
    member => member.userId === parseInt(session?.user?.id || '0') && member.role !== 'VIEWER'
  )

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
    // Check both tasks and subtasks
    const task = tasks.find((t) => t.id === active.id) || subtasks.find((s) => s.id === active.id)
    setActiveTask(task as unknown as Task | null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    console.log('[DRAG END]', { active: active.id, over: over?.id })

    if (!over) {
      console.log('[DRAG END] No over target')
      setActiveTask(null)
      return
    }

    const taskId = String(active.id)
    let dropZoneId = String(over.id)

    console.log('[DRAG END] Task:', taskId, 'Drop zone:', dropZoneId, 'Type:', typeof dropZoneId)

    // Check if the dragged item is a subtask
    const draggedSubtask = subtasks.find(s => String(s.id) === taskId)
    const isSubtask = !!draggedSubtask

    // Determine if we're dropping on a status column or a sprint
    let isSprintDrop = dropZoneId.startsWith('sprint-')

    // Check if dropZoneId matches any of the configured statuses from the template
    const validStatusIds = projectConfig?.statuses.map(s => s.id) || []
    let isStatusDrop = validStatusIds.includes(dropZoneId)

    // If we're dropping on another task (not a column), find that task's status
    if (!isSprintDrop && !isStatusDrop) {
      const targetTask = tasks.find(t => String(t.id) === dropZoneId)
      const targetSubtask = subtasks.find(s => String(s.id) === dropZoneId)
      const target = targetTask || targetSubtask
      if (target) {
        console.log('[DRAG END] Dropped on task', dropZoneId, 'with status:', target.status)
        dropZoneId = target.status
        isStatusDrop = true
      }
    }

    console.log('[DRAG END] isSprintDrop:', isSprintDrop, 'isStatusDrop:', isStatusDrop, 'isSubtask:', isSubtask)

    if (!isSprintDrop && !isStatusDrop) {
      console.log('[DRAG END] Invalid drop zone, ignoring')
      setActiveTask(null)
      return
    }

    let updatePayload: any = {}

    if (isSprintDrop) {
      // Extract sprint ID from dropZoneId (e.g., "sprint-1" -> "1")
      const sprintId = dropZoneId.replace('sprint-', '')

      console.log('[DRAG END] Sprint drop, sprintId:', sprintId)

      // Optimistically update UI
      if (isSubtask) {
        setSubtasks(prev => prev.map(subtask =>
          subtask.id === taskId
            ? { ...subtask, sprintId: sprintId === 'backlog' ? null : sprintId }
            : subtask
        ) as unknown as Task[])
      } else {
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? { ...task, sprintId: sprintId === 'backlog' ? null : sprintId }
            : task
        ) as unknown as Task[])
      }

      updatePayload = { sprintId: sprintId === 'backlog' ? null : sprintId }
    } else if (isStatusDrop) {
      console.log('[DRAG END] Status drop, new status:', dropZoneId)

      // Optimistically update UI
      if (isSubtask) {
        setSubtasks(prev => prev.map(subtask =>
          subtask.id === taskId
            ? { ...subtask, status: dropZoneId }
            : subtask
        ) as unknown as Task[])
      } else {
        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? { ...task, status: dropZoneId }
            : task
        ) as unknown as Task[])
      }

      updatePayload = { status: dropZoneId }
    }

    setActiveTask(null)

    // Determine the correct API endpoint
    let apiUrl = `/api/tasks/${taskId}`
    if (isSubtask && draggedSubtask) {
      const parentTaskId = (draggedSubtask as any).taskId
      apiUrl = `/api/tasks/${parentTaskId}/subtasks/${taskId}`
    }

    // Persist to database
    try {
      console.log('[DRAG END] Sending PATCH request to', apiUrl, updatePayload)
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      console.log('[DRAG END] Response status:', response.status, response.ok)

      if (!response.ok) {
        // Revert on error
        const errorData = await response.json()
        console.error('[DRAG END] Failed to update task:', errorData)
        if (isSubtask) {
          const originalSubtask = subtasks.find(s => s.id === taskId)
          setSubtasks(prev => prev.map(subtask =>
            subtask.id === taskId ? (originalSubtask as Task) : subtask
          ) as unknown as Task[])
        } else {
          const originalTask = tasks.find(t => t.id === taskId)
          setTasks(prev => prev.map(task =>
            task.id === taskId ? (originalTask as Task) : task
          ) as unknown as Task[])
        }
      } else {
        const updatedTask = await response.json()
        console.log('[DRAG END] Task updated successfully:', updatedTask)
        // Update the task in the state with the server response
        if (isSubtask) {
          setSubtasks(prev => prev.map(subtask =>
            String(subtask.id) === String(taskId) ? { ...updatedTask, taskId: (draggedSubtask as any).taskId } : subtask
          ) as unknown as Task[])
        } else {
          setTasks(prev => prev.map(task =>
            String(task.id) === String(taskId) ? updatedTask : task
          ) as unknown as Task[])
        }
      }
    } catch (error) {
      // Revert on error
      console.error('[DRAG END] Error updating task:', error)
      if (isSubtask) {
        const originalSubtask = subtasks.find(s => s.id === taskId)
        setSubtasks(prev => prev.map(subtask =>
          subtask.id === taskId ? (originalSubtask as Task) : subtask
        ) as unknown as Task[])
      } else {
        const originalTask = tasks.find(t => t.id === taskId)
        setTasks(prev => prev.map(task =>
          task.id === taskId ? (originalTask as Task) : task
        ) as unknown as Task[])
      }
    }
  }

  // Handler para actualizar tareas desde el DraggableTaskCard
  const handleTaskUpdateFromCard = (taskId: string, updates: Partial<Task>) => {
    // Check if it's a subtask
    const isSubtask = subtasks.some(s => s.id === taskId)

    if (isSubtask) {
      setSubtasks(prev => prev.map(s => s.id === taskId ? { ...s, ...updates } : s))
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
    }
  }

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params
      setProjectId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (projectId && session?.user?.id) {
      // Load critical data first (blocking)
      Promise.all([
        fetchProjectDetails()
      ]).then(() => {
        // Load secondary data in background (non-blocking)
        Promise.all([
          fetchTeamMembers(),
          fetchEpics(),
          fetchSprints(),
          fetchSubtasks()
        ]).catch(error => {
          console.error('Error loading secondary project data:', error)
        })
      }).catch(error => {
        console.error('Error loading project data:', error)
      })
    }
  }, [projectId, session?.user?.id])

  // Check for taskId in URL parameters (from global search)
  useEffect(() => {
    const taskId = searchParams.get('taskId')

    if (taskId && tasks.length > 0 && !isLoading) {
      // Find the task in the loaded tasks
      const task = tasks.find(t => String(t.id) === taskId)

      if (task) {
        // Open the modal with this task
        setTaskToEdit(task)
        setShowEditTaskModal(true)

        // Remove the taskId from the URL (clean up)
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [searchParams, tasks, isLoading])

  // Session is guaranteed by middleware, but add safety check
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const fetchProjectDetails = async () => {
    if (!projectId) return

    try {
      setIsLoading(true)

      // Fetch project and tasks in parallel
      const [projectRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`)
      ])

      if (!projectRes.ok) {
        // Handle 403 Forbidden - User is not a member
        if (projectRes.status === 403) {
          const errorData = await projectRes.json()
          toast.error(errorData.error || 'No tienes acceso a este proyecto', {
            description: 'Solicita al propietario que te agregue como miembro.'
          })
        } else {
          toast.error('No se pudo cargar el proyecto')
        }
        router.push('/projects')
        return
      }

      const projectData = await projectRes.json()
      setProject(projectData as unknown as Project)

      if (tasksRes.ok) {
        const projectTasks = await tasksRes.json()
        setTasks(projectTasks as unknown as Task[])
      }

      // Initialize project configuration from template if available
      let config: ProjectConfig
      if (projectData.template?.states && projectData.template.states.length > 0) {
        config = getProjectConfigFromTemplate(projectId, projectData.template.states)
      } else {
        config = getDefaultProjectConfig(projectId)
      }
      setProjectConfig(config)
    } catch (error) {
      console.error('Error fetching project details:', error)
      toast.error('Error al cargar el proyecto')
      router.push('/projects')
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

  const fetchEpics = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/epics`)
      if (response.ok) {
        const epicsData = await response.json()
        setEpics(epicsData)
      }
    } catch (error) {
      console.error('Failed to fetch epics:', error)
    }
  }

  const fetchSubtasks = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/subtasks`)
      if (response.ok) {
        const subtasksData = await response.json()
        // Add taskId property for compatibility
        const formattedSubtasks = subtasksData.map((subtask: any) => ({
          ...subtask,
          taskId: subtask.parentTaskId?.toString()
        }))
        setSubtasks(formattedSubtasks)
      }
    } catch (error) {
      console.error('Failed to fetch subtasks:', error)
    }
  }

  const fetchSprints = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/sprints`)
      if (response.ok) {
        const sprintsData = await response.json()
        // Sort sprints chronologically by start date (oldest first)
        const sortedSprints = sprintsData.sort((a: any, b: any) => {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        })
        setSprints(sortedSprints)
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error)
    }
  }

  // Sprint handlers
  const handleSprintCreated = () => {
    fetchSprints()
    setShowCreateSprintModal(false)
    setSprintToEdit(null)
  }

  const handleCloseSprintModal = (open: boolean) => {
    setShowCreateSprintModal(open)
    if (!open) {
      setSprintToEdit(null)
    }
  }

  const handleEditSprint = (sprint: any) => {
    setSprintToEdit(sprint)
    setShowCreateSprintModal(true)
  }

  const handleDeleteSprint = async (sprint: any) => {
    const confirmed = await confirm({
      title: 'Eliminar sprint',
      description: `¿Estás seguro de que quieres eliminar el sprint "${sprint.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/sprints/${sprint.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Sprint eliminado exitosamente')
        fetchSprints()
      } else {
        console.error('Failed to delete sprint')
        toast.error('Error al eliminar el sprint.')
      }
    } catch (error) {
      console.error('Error deleting sprint:', error)
      toast.error('Error al eliminar el sprint.')
    }
  }

  const handleSprintStatusChange = async (sprintId: number, newStatus: 'PLANNING' | 'ACTIVE' | 'COMPLETED') => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Estado del sprint actualizado')
        fetchSprints()
      } else {
        console.error('Failed to update sprint status')
        toast.error('Error al actualizar el estado del sprint.')
      }
    } catch (error) {
      console.error('Error updating sprint status:', error)
      toast.error('Error al actualizar el estado del sprint.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project || !projectId) {
    return null
  }


  const formatDate = (dateString: string) => {
    // If the date is in ISO format (with time), use it directly
    // If it's YYYY-MM-DD, parse it as local date to avoid timezone issues
    const date = dateString.includes('T')
      ? new Date(dateString)
      : new Date(dateString + 'T12:00:00')

    return date.toLocaleDateString('es-ES', {
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
    let task = tasks.find(t => t.id.toString() === taskId.toString())

    // If not found, search in subtasks
    if (!task) {
      // Search through all subtasks
      const subtask = subtasks.find(st => st.id.toString() === taskId.toString())
      if (subtask) {
        const mainTask = tasks.find(t => t.id.toString() === (subtask as unknown as { taskId?: string }).taskId)
        if (mainTask) {
          // Convert subtask to task-like object for the modal
          task = {
            ...subtask,
            // Add missing properties that tasks have but subtasks don't
            priority: subtask.priority || 'MEDIUM',
            assigneeId: subtask.assigneeId || undefined,
            assignee: subtask.assignee || undefined,
            dueDate: subtask.dueDate || undefined,
            projectId: mainTask.projectId,
            isSubtask: true
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
    if (!newTaskForm.title.trim() || !projectId) return

    // Get the first status from the template (sorted by order)
    const firstStatus = projectConfig?.statuses.sort((a, b) => a.order - b.order)[0]
    const defaultStatus = firstStatus?.id || 'PENDING'

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskForm.title,
          description: newTaskForm.description,
          priority: newTaskForm.priority,
          assigneeId: newTaskForm.assigneeId || undefined,
          dueDate: newTaskForm.dueDate || undefined,
          sprintId: newTaskForm.sprintId || undefined,
          epicId: newTaskForm.epicId || undefined,
          status: defaultStatus
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to create task:', errorData)
        return
      }

      const newTask = await response.json()

      // Add to current tasks
      setTasks(prev => [...prev, newTask as unknown as Task])

      // Close modal and reset form
      setIsNewTaskModalOpen(false)
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: '',
        sprintId: '',
        epicId: ''
      })
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleCreateSubtask = (parentTaskId: string) => {
    // Find the parent task
    const parentTask = tasks.find(t => t.id === parentTaskId)
    if (!parentTask) return

    // Set parent task info and open modal
    setParentTaskForSubtask({
      id: parentTaskId,
      title: parentTask.title
    })
    setShowAddSubtaskModal(true)
  }

  const handleSubtaskAdded = async () => {
    // Reload all tasks to get updated data including subtasks
    if (!projectId) return

    try {
      const tasksRes = await fetch(`/api/projects/${projectId}/tasks`)
      if (tasksRes.ok) {
        const projectTasks = await tasksRes.json()
        setTasks(projectTasks as unknown as Task[])

        // Extract subtasks from tasks
        const allSubtasks: Task[] = []
        projectTasks.forEach((task: any) => {
          if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach((subtask: any) => {
              allSubtasks.push({
                ...subtask,
                taskId: task.id.toString()
              } as unknown as Task)
            })
          }
        })
        setSubtasks(allSubtasks)
      }
    } catch (error) {
      console.error('Failed to reload tasks:', error)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setNewTaskForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTaskUpdated = async (updatedTask: Task) => {
    console.log('[handleTaskUpdated] Called with:', updatedTask)
    console.log('[handleTaskUpdated] isSubtask?', (updatedTask as unknown as { isSubtask?: boolean }).isSubtask)

    if ((updatedTask as unknown as { isSubtask?: boolean }).isSubtask) {
      // Handle subtask updates - reload all tasks to refresh the grid
      console.log('[handleTaskUpdated] Reloading tasks for subtask update')

      // Reload all tasks and subtasks
      if (projectId) {
        try {
          const tasksRes = await fetch(`/api/projects/${projectId}/tasks`)
          if (tasksRes.ok) {
            const projectTasks = await tasksRes.json()
            setTasks(projectTasks as unknown as Task[])

            // Extract subtasks from tasks
            const allSubtasks: Task[] = []
            projectTasks.forEach((task: any) => {
              if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach((subtask: any) => {
                  allSubtasks.push({
                    ...subtask,
                    taskId: task.id.toString()
                  } as unknown as Task)
                })
              }
            })
            setSubtasks(allSubtasks)
          }
        } catch (error) {
          console.error('Failed to reload tasks:', error)
        }
      }

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
  const handleSubtaskUpdate = async (subtaskId: string, field: string, value: string | Date | null) => {
    // Find the subtask to get its taskId
    const subtask = subtasks.find(s => s.id === subtaskId)
    if (!subtask) return

    const taskId = (subtask as any).taskId

    // Optimistically update UI
    setSubtasks(prevSubtasks =>
      prevSubtasks.map(st => {
        if (st.id === subtaskId) {
          const updatedSubtask = { ...st }

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
              (updatedSubtask as unknown as { dueDate: string | null }).dueDate = value ? (value instanceof Date ? dateToString(value) : value as string) : null
              break
          }

          (updatedSubtask as unknown as { updatedAt: string }).updatedAt = new Date().toISOString()
          return updatedSubtask
        }
        return st
      })
    )

    // Persist to API
    try {
      const updateData: any = {}

      switch (field) {
        case 'status':
          updateData.status = value
          break
        case 'priority':
          updateData.priority = value
          break
        case 'assignee':
          updateData.assigneeId = value === 'unassigned' ? null : value
          break
        case 'dueDate':
          updateData.dueDate = value ? (value instanceof Date ? dateToString(value) : value) : null
          break
      }

      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        // Revert on error
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to update subtask:', {
          status: response.status,
          error: errorData,
          subtaskId,
          taskId,
          field,
          value,
          updateData
        })
        setSubtasks(prevSubtasks =>
          prevSubtasks.map(st => st.id === subtaskId ? subtask : st)
        )
      } else {
        // Refresh parent task to update subtask count/progress
        const parentResponse = await fetch(`/api/tasks/${taskId}`)
        if (parentResponse.ok) {
          const refreshedParentTask = await parentResponse.json()
          setTasks(prev => prev.map(task =>
            task.id.toString() === taskId.toString() ? refreshedParentTask : task
          ))
        }
      }
    } catch (error) {
      // Revert on error
      console.error('Error updating subtask:', error)
      setSubtasks(prevSubtasks =>
        prevSubtasks.map(st => st.id === subtaskId ? subtask : st)
      )
    }
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

  // Filter tasks by search query for Kanban
  const getFilteredTasksForKanban = () => {
    let filtered = tasks

    // Helper function to check if a task matches the filter criteria
    const taskMatchesFilters = (task: Task) => {
      // Check search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assignee?.name?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Check status filter
      if (taskFilters.status.length > 0) {
        if (!taskFilters.status.includes(task.status)) return false
      }

      // Check priority filter
      if (taskFilters.priority.length > 0) {
        if (!taskFilters.priority.includes(task.priority)) return false
      }

      // Check assignee filter
      if (taskFilters.assignee.length > 0) {
        if (!task.assigneeId || !taskFilters.assignee.includes(task.assigneeId.toString())) return false
      }

      return true
    }

    // Filter tasks considering subtasks
    filtered = tasks.filter(task => {
      // Check if the parent task itself matches the filters
      if (taskMatchesFilters(task)) {
        return true
      }

      // Check if any subtask matches the filters
      const taskSubtasks = subtasks.filter(st => (st as any).taskId === task.id.toString())
      const hasMatchingSubtask = taskSubtasks.some(subtask => taskMatchesFilters(subtask))

      return hasMatchingSubtask
    })

    return filtered
  }

  // Organize tasks for kanban view based on project configuration
  const getKanbanColumns = () => {
    if (!projectConfig) return []

    const filteredTasks = getFilteredTasksForKanban()

    // Collect all tasks including subtasks if showSubtasks is enabled
    let allTasksToDisplay = [...filteredTasks]

    if (showSubtasks) {
      // Add subtasks to the list
      filteredTasks.forEach(task => {
        const taskSubtasks = subtasks.filter(s => s.taskId === task.id.toString())
        allTasksToDisplay = [...allTasksToDisplay, ...taskSubtasks]
      })
    }

    if (projectConfig.kanbanLayout === 'status') {
      // Group by custom statuses
      const tasksByStatus: Record<string, Task[]> = {}

      projectConfig.statuses.forEach(status => {
        tasksByStatus[status.id] = allTasksToDisplay.filter(task =>
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
        HIGH: allTasksToDisplay.filter(task => task.priority === 'HIGH'),
        MEDIUM: allTasksToDisplay.filter(task => task.priority === 'MEDIUM'),
        LOW: allTasksToDisplay.filter(task => task.priority === 'LOW'),
        URGENT: allTasksToDisplay.filter(task => task.priority === 'URGENT')
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
      task.id === taskId ? { ...task, status: newStatus } : task
    ) as unknown as Task[])
  }

  return (
    <MainLayout
      title={project.name}
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
      <div className="mb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                size="sm"
                onClick={handleNewTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            )}
            {isProjectOwnerOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageMembersModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Gestionar Miembros
              </Button>
            )}
            {isProjectOwnerOrAdmin && (
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
            )}
          </div>
        </div>

        {/* Tabs: Tareas / Épicas / Sprints */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                }
              `}
            >
              <CheckCircle2 className="h-5 w-5" />
              Tareas
            </button>
            <button
              onClick={() => setActiveTab('epics')}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'epics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-purple-500 hover:border-purple-300'
                }
              `}
            >
              <Layers className="h-5 w-5" />
              Épicas
            </button>
            <button
              onClick={() => setActiveTab('sprints')}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'sprints'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-green-500 hover:border-green-300'
                }
              `}
            >
              <Target className="h-5 w-5" />
              Sprints
            </button>
          </nav>
        </div>

      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {activeTab === 'tasks' ? 'Tareas del Proyecto' :
                 activeTab === 'epics' ? 'Épicas del Proyecto' :
                 'Sprints del Proyecto'}
              </CardTitle>
              {activeTab === 'tasks' && (
                <CardDescription className="mt-1">
                  {tasks.length > 0
                    ? `Gestiona las ${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} de este proyecto`
                    : 'Crea la primera tarea para comenzar a organizar el trabajo'
                  }
                </CardDescription>
              )}
              {activeTab === 'epics' && (
                <CardDescription className="mt-1">
                  {epics.length > 0
                    ? `Gestiona las ${epics.length} épica${epics.length !== 1 ? 's' : ''} de este proyecto`
                    : 'Crea la primera épica para comenzar a organizar objetivos de alto nivel'
                  }
                </CardDescription>
              )}
              {activeTab === 'sprints' && (
                <CardDescription className="mt-1">
                  {sprints.length > 0
                    ? `Gestiona los ${sprints.length} sprint${sprints.length !== 1 ? 's' : ''} de este proyecto`
                    : 'Crea el primer sprint para comenzar a planificar iteraciones'
                  }
                </CardDescription>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Search Box - Only for tasks */}
              {activeTab === 'tasks' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar tareas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* View Toggle Buttons - Only for tasks */}
              {activeTab === 'tasks' && (
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
              )}

              {activeTab === 'tasks' && viewMode === 'grid' && (
                <Button
                  variant="outline"
                  onClick={() => setShowConfigPanel(true)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Personalizar
                </Button>
              )}

              {activeTab === 'epics' && canEdit && (
                <Button
                  onClick={() => setShowCreateEpicModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Épica
                </Button>
              )}

              {activeTab === 'sprints' && canEdit && (
                <Button
                  onClick={() => setShowCreateSprintModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Sprint
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'epics' ? (
            <EpicsList
              projectId={projectId || ''}
              projectConfig={projectConfig}
              showCreateModal={showCreateEpicModal}
              onCreateModalChange={setShowCreateEpicModal}
              onEpicCreated={fetchEpics}
              canEdit={canEdit}
              epics={epics}
            />
          ) : activeTab === 'sprints' ? (
            <SprintList
              sprints={sprints}
              onEdit={handleEditSprint}
              onDelete={handleDeleteSprint}
              onStatusChange={handleSprintStatusChange}
              onSprintUpdated={fetchSprints}
              projectId={projectId}
              projectConfig={projectConfig}
              canEdit={canEdit}
            />
          ) : tasks.length === 0 ? (
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
                          const taskSubtasks = subtasks.filter(s => (s as unknown as { taskId?: string }).taskId === task.id.toString())
                          const completedSubtasks = taskSubtasks.filter(s => {
                            // Use template-based completion logic
                            if (projectConfig && projectConfig.statuses.length > 0) {
                              const maxOrder = Math.max(...projectConfig.statuses.map(st => st.order))
                              const statusConfig = projectConfig.statuses.find(st => st.id === s.status)
                              return statusConfig?.order === maxOrder
                            }
                            // Fallback to status === 'COMPLETED' if no projectConfig
                            return s.status === 'COMPLETED'
                          }).length

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
                                  {canEdit && (
                                    <>
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
                                    </>
                                  )}
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
                            {canEdit ? (
                              <Select
                                value={task.status}
                                onValueChange={async (newStatus) => {
                                // Optimistically update UI
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id ? { ...t, status: newStatus } : t
                                ) as unknown as Task[])

                                // Call API to persist
                                try {
                                  const response = await fetch(`/api/tasks/${task.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  })

                                  if (!response.ok) {
                                    // Revert on error
                                    setTasks(prev => prev.map(t =>
                                      t.id === task.id ? { ...t, status: task.status } : t
                                    ) as unknown as Task[])
                                    console.error('Failed to update task status')
                                  }
                                } catch (error) {
                                  // Revert on error
                                  console.error('Error updating task status:', error)
                                  setTasks(prev => prev.map(t =>
                                    t.id === task.id ? { ...t, status: task.status } : t
                                  ) as unknown as Task[])
                                }
                              }}
                            >
                              <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0">
                                {(() => {
                                  const statusConfig = projectConfig?.statuses.find(s => String(s.id) === String(task.status))
                                  return (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs cursor-pointer ${statusConfig ? '' : getStatusColor(task.status)}`}
                                      style={statusConfig ? {
                                        borderColor: statusConfig.color,
                                        color: statusConfig.color,
                                        backgroundColor: `${statusConfig.color}10`
                                      } : {}}
                                    >
                                      {statusConfig ? statusConfig.name : getStatusText(task.status)}
                                    </Badge>
                                  )
                                })()}
                              </SelectTrigger>
                              <SelectContent>
                                {projectConfig?.statuses.map((status) => (
                                  <SelectItem key={status.id} value={String(status.id)}>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        borderColor: status.color,
                                        color: status.color,
                                        backgroundColor: `${status.color}10`
                                      }}
                                    >
                                      {status.name}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                              </Select>
                            ) : (
                              (() => {
                                const statusConfig = projectConfig?.statuses.find(s => String(s.id) === String(task.status))
                                return (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${statusConfig ? '' : getStatusColor(task.status)}`}
                                    style={statusConfig ? {
                                      borderColor: statusConfig.color,
                                      color: statusConfig.color,
                                      backgroundColor: `${statusConfig.color}10`
                                    } : {}}
                                  >
                                    {statusConfig ? statusConfig.name : getStatusText(task.status)}
                                  </Badge>
                                )
                              })()
                            )}
                          </div>
                        )
                      case 'priority':
                        return (
                          <div>
                            {canEdit ? (
                              <Select
                                value={task.priority}
                                onValueChange={async (newPriority) => {
                                // Optimistically update UI
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id ? { ...t, priority: newPriority as unknown as TaskPriority } : t
                                ) as unknown as Task[])

                                // Call API to persist
                                try {
                                  const response = await fetch(`/api/tasks/${task.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ priority: newPriority })
                                  })

                                  if (!response.ok) {
                                    // Revert on error
                                    setTasks(prev => prev.map(t =>
                                      t.id === task.id ? { ...t, priority: task.priority } : t
                                    ) as unknown as Task[])
                                    console.error('Failed to update task priority')
                                  }
                                } catch (error) {
                                  // Revert on error
                                  console.error('Error updating task priority:', error)
                                  setTasks(prev => prev.map(t =>
                                    t.id === task.id ? { ...t, priority: task.priority } : t
                                  ) as unknown as Task[])
                                }
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
                            ) : (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(task.priority)}`}
                              >
                                {getPriorityText(task.priority)}
                              </Badge>
                            )}
                          </div>
                        )
                      case 'assignee':
                        return (
                          <div>
                            {canEdit ? (
                              <Select
                                value={task.assigneeId || 'unassigned'}
                                onValueChange={async (newAssigneeId) => {
                                const assignee = teamMembers.find(m => m.id === newAssigneeId)
                                const oldAssigneeId = task.assigneeId
                                const oldAssignee = task.assignee

                                // Optimistically update UI
                                setTasks(prev => prev.map(t =>
                                  t.id === task.id
                                    ? {
                                        ...t,
                                        assigneeId: newAssigneeId === 'unassigned' ? undefined : newAssigneeId,
                                        assignee: newAssigneeId === 'unassigned' ? undefined : assignee as unknown as User
                                      } as unknown as Task
                                    : t
                                ) as unknown as Task[])

                                // Call API to persist
                                try {
                                  const response = await fetch(`/api/tasks/${task.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      assigneeId: newAssigneeId === 'unassigned' ? null : newAssigneeId
                                    })
                                  })

                                  if (!response.ok) {
                                    // Revert on error
                                    setTasks(prev => prev.map(t =>
                                      t.id === task.id
                                        ? { ...t, assigneeId: oldAssigneeId, assignee: oldAssignee } as unknown as Task
                                        : t
                                    ) as unknown as Task[])
                                    console.error('Failed to update task assignee')
                                  }
                                } catch (error) {
                                  // Revert on error
                                  console.error('Error updating task assignee:', error)
                                  setTasks(prev => prev.map(t =>
                                    t.id === task.id
                                      ? { ...t, assigneeId: oldAssigneeId, assignee: oldAssignee } as unknown as Task
                                      : t
                                  ) as unknown as Task[])
                                }
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
                            ) : (
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span className="truncate text-xs">
                                  {task.assignee ? task.assignee.name : 'Sin asignar'}
                                </span>
                              </div>
                            )}
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
                            {canEdit ? (
                              <Popover
                                open={openCalendarTaskId === task.id}
                                onOpenChange={(open) => setOpenCalendarTaskId(open ? task.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0 justify-start"
                                  >
                                    <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                      <CalendarIcon className="h-3 w-3" />
                                      <span>{formatDateSafe(task.dueDate)}</span>
                                    </div>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={parseDate(task.dueDate)}
                                    onSelect={async (date) => {
                                      const oldDueDate = task.dueDate
                                      const newDueDate = date ? dateToString(date) : undefined

                                      // Close the popover
                                      setOpenCalendarTaskId(null)

                                      // Optimistically update UI
                                      setTasks(prev => prev.map(t =>
                                        t.id === task.id
                                          ? { ...t, dueDate: newDueDate } as unknown as Task
                                          : t
                                      ) as unknown as Task[])

                                      // Call API to persist
                                      try {
                                        const response = await fetch(`/api/tasks/${task.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ dueDate: newDueDate || null })
                                        })

                                        if (!response.ok) {
                                          // Revert on error
                                          setTasks(prev => prev.map(t =>
                                            t.id === task.id ? { ...t, dueDate: oldDueDate } as unknown as Task : t
                                          ) as unknown as Task[])
                                          console.error('Failed to update task due date')
                                        }
                                      } catch (error) {
                                        // Revert on error
                                        console.error('Error updating task due date:', error)
                                        setTasks(prev => prev.map(t =>
                                          t.id === task.id ? { ...t, dueDate: oldDueDate } as unknown as Task : t
                                        ) as unknown as Task[])
                                      }
                                    }}
                                    initialFocus
                                  />
                                  <div className="p-2 border-t">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full text-xs text-gray-500"
                                      onClick={async () => {
                                        const oldDueDate = task.dueDate

                                        // Close the popover
                                        setOpenCalendarTaskId(null)

                                        // Optimistically update UI
                                        setTasks(prev => prev.map(t =>
                                          t.id === task.id ? { ...t, dueDate: undefined } as unknown as Task : t
                                        ) as unknown as Task[])

                                        // Call API to persist
                                        try {
                                          const response = await fetch(`/api/tasks/${task.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ dueDate: null })
                                          })

                                          if (!response.ok) {
                                            // Revert on error
                                            setTasks(prev => prev.map(t =>
                                              t.id === task.id ? { ...t, dueDate: oldDueDate } as unknown as Task : t
                                            ) as unknown as Task[])
                                            console.error('Failed to clear task due date')
                                          }
                                        } catch (error) {
                                          // Revert on error
                                          console.error('Error clearing task due date:', error)
                                          setTasks(prev => prev.map(t =>
                                            t.id === task.id ? { ...t, dueDate: oldDueDate } as unknown as Task : t
                                          ) as unknown as Task[])
                                        }
                                      }}
                                    >
                                      Limpiar fecha
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{formatDateSafe(task.dueDate)}</span>
                              </div>
                            )}
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
                      // Try to find the status in project config first
                      const statusConfig = projectConfig?.statuses.find(s => s.id === status)
                      if (statusConfig) {
                        // Return empty string to let inline styles handle the color
                        return ''
                      }
                      // Fallback for legacy statuses
                      switch (status) {
                        case 'COMPLETED': return 'bg-green-100 text-green-800'
                        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
                        case 'PENDING': return 'bg-gray-100 text-gray-800'
                        default: return 'bg-gray-100 text-gray-800'
                      }
                    }

                    const getSubtaskStatusText = (status: string) => {
                      // Try to find the status in project config first
                      const statusConfig = projectConfig?.statuses.find(s => s.id === status)
                      if (statusConfig) {
                        return statusConfig.name
                      }
                      // Fallback for legacy statuses
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
                        {
                          // Check if subtask is completed using project config
                          const isSubtaskCompleted = (() => {
                            if (projectConfig && projectConfig.statuses.length > 0) {
                              const maxOrder = Math.max(...projectConfig.statuses.map(st => st.order))
                              const statusConfig = projectConfig.statuses.find(st => st.id === subtask.status)
                              return statusConfig?.order === maxOrder
                            }
                            return subtask.status === 'COMPLETED'
                          })()

                          return (
                            <div className="flex items-center gap-2 ml-8">
                              {canEdit ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Toggle between first and last status
                                    if (projectConfig && projectConfig.statuses.length > 0) {
                                      const sortedStatuses = [...projectConfig.statuses].sort((a, b) => a.order - b.order)
                                      const newStatus = isSubtaskCompleted
                                        ? sortedStatuses[0].id // Move to first status
                                        : sortedStatuses[sortedStatuses.length - 1].id // Move to last status
                                      handleSubtaskUpdate(subtask.id, 'status', newStatus)
                                    } else {
                                      // Fallback for non-configured projects
                                      const newStatus = subtask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                                      handleSubtaskUpdate(subtask.id, 'status', newStatus)
                                    }
                                  }}
                                  className="hover:scale-110 transition-transform cursor-pointer"
                                  title={isSubtaskCompleted ? "Marcar como no completada" : "Marcar como completada"}
                                >
                                  {isSubtaskCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0 hover:text-gray-600" />
                                  )}
                                </button>
                              ) : (
                                <>
                                  {isSubtaskCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </>
                              )}
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className={`text-sm flex-1 ${
                                  isSubtaskCompleted ? 'line-through text-gray-500' : 'text-gray-700'
                                }`}>
                                  {subtask.title}
                                </span>
                                {canEdit && (
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
                                )}
                              </div>
                            </div>
                          )
                        }
                        case 'status':
                          return (
                            <div>
                              {canEdit ? (
                                <Select
                                  value={subtask.status}
                                  onValueChange={(newStatus) => {
                                    handleSubtaskUpdate(subtask.id, 'status', newStatus)
                                  }}
                                >
                                  <SelectTrigger className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0">
                                    {(() => {
                                      const statusConfig = projectConfig?.statuses.find(s => String(s.id) === String(subtask.status))
                                      return (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs cursor-pointer ${statusConfig ? '' : getSubtaskStatusColor(subtask.status)}`}
                                          style={statusConfig ? {
                                            borderColor: statusConfig.color,
                                            color: statusConfig.color,
                                            backgroundColor: `${statusConfig.color}10`
                                          } : {}}
                                        >
                                          {statusConfig ? statusConfig.name : getSubtaskStatusText(subtask.status)}
                                        </Badge>
                                      )
                                    })()}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projectConfig?.statuses.map((status) => (
                                      <SelectItem key={status.id} value={String(status.id)}>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                          style={{
                                            borderColor: status.color,
                                            color: status.color,
                                            backgroundColor: `${status.color}10`
                                          }}
                                        >
                                          {status.name}
                                        </Badge>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                (() => {
                                  const statusConfig = projectConfig?.statuses.find(s => String(s.id) === String(subtask.status))
                                  return (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${statusConfig ? '' : getSubtaskStatusColor(subtask.status)}`}
                                      style={statusConfig ? {
                                        borderColor: statusConfig.color,
                                        color: statusConfig.color,
                                        backgroundColor: `${statusConfig.color}10`
                                      } : {}}
                                    >
                                      {statusConfig ? statusConfig.name : getSubtaskStatusText(subtask.status)}
                                    </Badge>
                                  )
                                })()
                              )}
                            </div>
                          )
                        case 'priority':
                          return (
                            <div>
                              {canEdit ? (
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
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(subtask.priority || 'MEDIUM')}`}
                                >
                                  {getPriorityText(subtask.priority || 'MEDIUM')}
                                </Badge>
                              )}
                            </div>
                          )
                        case 'assignee':
                          return (
                            <div>
                              {canEdit ? (
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
                              ) : (
                                <div className="flex items-center gap-1 text-sm">
                                  <Users className="h-3 w-3 text-gray-400" />
                                  <span className="truncate text-xs">
                                    {subtask.assignee ? subtask.assignee.name : 'Sin asignar'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        case 'dueDate':
                          return (
                            <div>
                              {canEdit ? (
                                <Popover
                                  open={openCalendarSubtaskId === subtask.id}
                                  onOpenChange={(open) => setOpenCalendarSubtaskId(open ? subtask.id : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-6 border-0 p-0 hover:bg-gray-100 focus:ring-0 justify-start"
                                    >
                                      <div className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                        <CalendarIcon className="h-3 w-3" />
                                        <span>{formatDateSafe(subtask.dueDate)}</span>
                                      </div>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={parseDate(subtask.dueDate)}
                                      onSelect={(date) => {
                                        // Close the popover
                                        setOpenCalendarSubtaskId(null)
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
                                          // Close the popover
                                          setOpenCalendarSubtaskId(null)
                                          handleSubtaskUpdate(subtask.id, 'dueDate', null)
                                        }}
                                      >
                                        Limpiar fecha
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{formatDateSafe(subtask.dueDate)}</span>
                                </div>
                              )}
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

                    // Check if subtask is overdue
                    const isSubtaskOverdue = subtask.dueDate && (() => {
                      const dueDate = new Date(subtask.dueDate)
                      const today = new Date()
                      today.setHours(23, 59, 59, 999) // End of today
                      return dueDate < today
                    })()

                    return (
                      <div
                        key={`subtask-${subtask.id}`}
                        className={`group grid gap-4 p-2 items-center bg-gray-50/50 hover:bg-blue-50 ${canEdit ? 'cursor-pointer' : 'cursor-default'} transition-colors border-l-2 border-blue-200 ${
                          showOverdueTasks && isSubtaskOverdue ? 'bg-red-50' : ''
                        }`}
                        style={{gridTemplateColumns}}
                        onDoubleClick={() => canEdit && handleEditTask(subtask.id)}
                        title={canEdit ? "Doble clic para editar subtarea" : ""}
                      >
                        {enabledColumns.map(column => (
                          <div key={column}>
                            {renderSubtaskColumnContent(subtask, column)}
                          </div>
                        ))}
                      </div>
                    )
                  }

                  // Filter tasks by search query
                  const getFilteredTasks = () => {
                    let filtered = tasks

                    // Helper function to check if a task matches the filter criteria
                    const taskMatchesFilters = (task: Task) => {
                      // Check search query
                      if (searchQuery.trim()) {
                        const query = searchQuery.toLowerCase()
                        const matchesSearch =
                          task.title.toLowerCase().includes(query) ||
                          task.description?.toLowerCase().includes(query) ||
                          task.assignee?.name?.toLowerCase().includes(query)
                        if (!matchesSearch) return false
                      }

                      // Check status filter
                      if (taskFilters.status.length > 0) {
                        if (!taskFilters.status.includes(task.status)) return false
                      }

                      // Check priority filter
                      if (taskFilters.priority.length > 0) {
                        if (!taskFilters.priority.includes(task.priority)) return false
                      }

                      // Check assignee filter
                      if (taskFilters.assignee.length > 0) {
                        if (!task.assigneeId || !taskFilters.assignee.includes(task.assigneeId.toString())) return false
                      }

                      return true
                    }

                    // Filter tasks considering subtasks
                    filtered = tasks.filter(task => {
                      // Check if the parent task itself matches the filters
                      if (taskMatchesFilters(task)) {
                        return true
                      }

                      // Check if any subtask matches the filters
                      const taskSubtasks = subtasks.filter(st => (st as any).taskId === task.id.toString())
                      const hasMatchingSubtask = taskSubtasks.some(subtask => taskMatchesFilters(subtask))

                      return hasMatchingSubtask
                    })

                    return filtered
                  }

                  // Group tasks based on groupBy setting
                  const getGroupedTasks = () => {
                    const filteredTasks = getFilteredTasks()
                    const groupBy = projectConfig?.gridGroupBy || 'none'

                    if (groupBy === 'none') {
                      return [{ group: '', tasks: filteredTasks }]
                    }

                    const grouped: Record<string, Task[]> = {}

                    filteredTasks.forEach(task => {
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
                                  const taskSubtasks = subtasks.filter(s => (s as unknown as { taskId?: string }).taskId === task.id.toString())

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

                                  // Check if task is overdue
                                  const isTaskOverdue = task.dueDate && (() => {
                                    const dueDate = new Date(task.dueDate)
                                    const today = new Date()
                                    today.setHours(23, 59, 59, 999) // End of today
                                    return dueDate < today
                                  })()

                                  return (
                                    <React.Fragment key={task.id}>
                                      {/* Main Task Row */}
                                      <div
                                        className={`group grid gap-4 p-3 items-center hover:bg-blue-50 ${canEdit ? 'cursor-pointer' : 'cursor-default'} transition-colors ${
                                          !isLastTask || shouldShowSubtasks ? 'border-b border-gray-100' : ''
                                        } ${
                                          showOverdueTasks && isTaskOverdue ? 'bg-red-50' : ''
                                        }`}
                                        style={{gridTemplateColumns}}
                                        onDoubleClick={() => canEdit && handleEditTask(task.id)}
                                        title={canEdit ? "Doble clic para editar tarea" : ""}
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
                                              {renderSubtaskRow(subtask, enabledColumns.map(col => col.id), gridTemplateColumns)}
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
          ) : viewMode === 'kanban' ? (
            // Kanban View (Status Columns)
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                {columnConfig.map((column) => (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    teamMembers={teamMembers}
                    onTaskUpdate={handleTaskUpdateFromCard}
                    formatDate={formatDate}
                    getPriorityColor={getPriorityColor}
                    getPriorityText={getPriorityText}
                    canEdit={canEdit}
                  />
                ))}
                </div>
              </div>

              <DragOverlay>
                {activeTask && (
                  <DraggableTaskCard
                    task={activeTask}
                    teamMembers={teamMembers}
                    onTaskUpdate={handleTaskUpdateFromCard}
                    formatDate={formatDate}
                    getPriorityColor={getPriorityColor}
                    getPriorityText={getPriorityText}
                    canEdit={canEdit}
                    highlightOverdue={showOverdueTasks}
                  />
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            // Sprints View (Sprint Columns)
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>
                    Arrastra las tareas entre sprints para reorganizar tu planificación. Las tareas sin sprint aparecen en "Backlog".
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
                  {/* Backlog Column */}
                  <DroppableBacklogColumn
                    tasks={tasks.filter(t => !t.sprintId)}
                    teamMembers={teamMembers}
                    onTaskUpdate={handleTaskUpdateFromCard}
                    formatDate={formatDate}
                    getPriorityColor={getPriorityColor}
                    getPriorityText={getPriorityText}
                    canEdit={canEdit}
                  />

                  {/* Sprint Columns */}
                  {sprints.map((sprint) => {
                    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id.toString())
                    return (
                      <DroppableSprintColumn
                        key={sprint.id}
                        sprint={sprint}
                        tasks={sprintTasks}
                        teamMembers={teamMembers}
                        onTaskUpdate={handleTaskUpdateFromCard}
                        formatDate={formatDate}
                        getPriorityColor={getPriorityColor}
                        getPriorityText={getPriorityText}
                        canEdit={canEdit}
                      />
                    )
                  })}

                  {/* Create Sprint Prompt */}
                  {sprints.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 min-h-[500px] w-80 flex-shrink-0 flex items-center justify-center">
                      <div className="text-center p-6">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">
                          No hay sprints creados
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Crea tu primer sprint en la pestaña de Sprints
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('sprints')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ir a Sprints
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DragOverlay>
                {activeTask && (
                  <DraggableTaskCard
                    task={activeTask}
                    teamMembers={teamMembers}
                    onTaskUpdate={handleTaskUpdateFromCard}
                    formatDate={formatDate}
                    getPriorityColor={getPriorityColor}
                    getPriorityText={getPriorityText}
                    canEdit={canEdit}
                    highlightOverdue={showOverdueTasks}
                  />
                )}
              </DragOverlay>
            </DndContext>
          )
          }
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sprint" className="text-right">
                Sprint
              </Label>
              <Select
                value={newTaskForm.sprintId || 'no-sprint'}
                onValueChange={(value) => handleFormChange('sprintId', value === 'no-sprint' ? '' : value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-sprint">Sin sprint</SelectItem>
                  {sprints
                    .filter((sprint: any) => sprint.status === 'PLANNING' || sprint.status === 'ACTIVE')
                    .map((sprint: any) => (
                      <SelectItem key={sprint.id} value={sprint.id.toString()}>
                        {sprint.name} ({sprint.status === 'ACTIVE' ? 'activo' : 'planificación'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="epic" className="text-right">
                Épica
              </Label>
              <Select
                value={newTaskForm.epicId || 'no-epic'}
                onValueChange={(value) => handleFormChange('epicId', value === 'no-epic' ? '' : value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una épica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-epic">Sin épica</SelectItem>
                  {epics.map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      <div className="flex items-center gap-2">
                        {epic.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: epic.color }}
                          />
                        )}
                        <span>{epic.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        spaceId={project.spaceId}
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
      {/* eslint-disable @typescript-eslint/no-explicit-any */}
      <EditTaskModal
        task={taskToEdit as any}
        projectId={projectId!}
        open={showEditTaskModal}
        onOpenChange={setShowEditTaskModal}
        onTaskUpdated={handleTaskUpdated as any}
        statuses={projectConfig?.statuses || []}
        isSubtask={(taskToEdit as any)?.isSubtask || false}
        onEditSubtask={(subtask: any) => {
          // Convert subtask to task format and open edit modal
          setTaskToEdit({
            ...subtask,
            isSubtask: true
          } as any)
          setShowEditTaskModal(true)
        }}
      />
      {/* eslint-enable @typescript-eslint/no-explicit-any */}

      {/* Add Subtask Modal */}
      {parentTaskForSubtask && (
        <AddSubtaskModal
          open={showAddSubtaskModal}
          onOpenChange={setShowAddSubtaskModal}
          taskId={parentTaskForSubtask.id}
          taskTitle={parentTaskForSubtask.title}
          onSubtaskAdded={handleSubtaskAdded}
        />
      )}

      {/* Create/Edit Sprint Modal */}
      <CreateSprintModal
        open={showCreateSprintModal}
        onOpenChange={handleCloseSprintModal}
        projectId={parseInt(projectId || '0')}
        onSprintCreated={handleSprintCreated}
        sprint={sprintToEdit}
      />

      {/* Configuration Side Panel Overlay */}
      {showConfigPanel && (
        <div
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-20 transition-all duration-300"
          onClick={() => setShowConfigPanel(false)}
        />
      )}

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
      {project && projectConfig && (() => {
        // Calculate correct completed tasks based on template final state
        const maxOrder = projectConfig.statuses.length > 0
          ? Math.max(...projectConfig.statuses.map(s => s.order))
          : -1

        const completedTasks = tasks.filter(task => {
          const statusConfig = projectConfig.statuses.find(s => s.id === task.status)
          return statusConfig?.order === maxOrder
        }).length

        const totalTasks = tasks.length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return (
          <EditProjectModal
            project={{
              ...project,
              totalTasks,
              completedTasks,
              progress
            } as any}
            open={showEditProjectModal}
            onOpenChange={setShowEditProjectModal}
            onProjectUpdated={async (updatedProject) => {
              setProject(updatedProject as any)
              await fetchProjectDetails()
            }}
          />
        )
      })()}

      <ConfirmationDialog />
    </MainLayout>
  )
}