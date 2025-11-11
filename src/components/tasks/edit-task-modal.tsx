'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MentionTextarea } from '@/components/ui/mention-textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
// Define local types to match mock data
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
import { Comment, Attachment } from '@/types'
import { AttachmentList } from '@/components/attachments/attachment-list'
import { toast } from 'sonner'

interface User {
  id: string;
  email: string;
  name?: string;
}
import { Loader2, Edit3, MessageSquare, Clock, Send, User as UserIcon, Paperclip, Upload, FileText, Download, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react'

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
  epicId: z.string().optional(),
})

type EditTaskInput = z.infer<typeof editTaskSchema>

interface Subtask {
  id: string
  title: string
  description?: string
  status: string
  priority: TaskPriority
  dueDate?: string
  order: number
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    name?: string
    email: string
  }
  _count?: {
    comments: number
    attachments: number
    subtasks: number
  }
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: TaskPriority
  dueDate?: string
  assigneeId?: string
  createdAt: string
  updatedAt: string
  projectId: string
}

interface ProjectStatus {
  id: string
  name: string
  color: string
  order: number
}

interface EditTaskModalProps {
  task: Task | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: (task: Task) => void
  statuses?: ProjectStatus[]
  isSubtask?: boolean
  onEditSubtask?: (subtask: Subtask) => void
}

interface User {
  id: string
  name?: string
  email: string
}

export function EditTaskModal({
  task,
  projectId,
  open,
  onOpenChange,
  onTaskUpdated,
  statuses = [],
  isSubtask = false,
  onEditSubtask
}: EditTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [sprints, setSprints] = useState<{ id: string; name: string; startDate: string; endDate: string }[]>([])
  const [epics, setEpics] = useState<{ id: string; name: string; color?: string }[]>([])
  const [activeTab, setActiveTab] = useState('details')
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [attachmentCount, setAttachmentCount] = useState(0)
  const [auditTrail, setAuditTrail] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditTaskInput>({
    resolver: zodResolver(editTaskSchema),
  })

  const status = watch('status')
  const priority = watch('priority')
  const assigneeId = watch('assigneeId')
  const sprintId = watch('sprintId')

  useEffect(() => {
    if (open && task) {
      // Populate form with task data
      setValue('title', task.title)
      setValue('description', task.description || '')
      setValue('status', task.status)
      setValue('priority', task.priority)
      setValue('dueDate', task.dueDate ? task.dueDate.split('T')[0] : '')
      setValue('assigneeId', task.assigneeId ? String(task.assigneeId) : undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('sprintId', (task as any).sprintId ? String((task as any).sprintId) : undefined)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue('epicId', (task as any).epicId ? String((task as any).epicId) : undefined)

      // Load all data in parallel
      loadAllData()
    } else if (!open) {
      // Clear state when modal closes to prevent showing stale data
      setComments([])
      setAttachments([])
      setSubtasks([])
      setAuditTrail([])
      setAttachmentCount(0)
      setNewComment('')
      setNewSubtaskTitle('')
      setActiveTab('details')
      setError(null)
      reset()
    }
  }, [open, task, setValue, isSubtask, reset])

  const loadAllData = async () => {
    setIsLoadingData(true)
    try {
      // Only load essential data for the Details tab
      await Promise.all([
        fetchTeamMembers(),
        fetchSprints(),
        fetchEpics()
      ])

      // Load secondary data in background (non-blocking)
      Promise.all([
        fetchComments(),
        fetchAttachments(),
        fetchAuditLogs(),
        !isSubtask ? fetchSubtasks() : Promise.resolve()
      ]).catch(error => {
        console.error('Error loading secondary data:', error)
      })
    } catch (error) {
      console.error('Error loading task data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const projectMembers = await response.json()
        // Extract user data from ProjectMember objects
        const users = projectMembers.map((pm: any) => pm.user)
        setTeamMembers(users)
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error)
    }
  }

  const fetchSprints = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sprints`)
      if (response.ok) {
        const sprintsData = await response.json()
        // Show all sprints for editing (user can move tasks between sprints)
        setSprints(sprintsData)
      } else {
        // Mock data as fallback
        setSprints([
          { id: 'sprint-1', name: 'Sprint 1', startDate: '2024-03-01', endDate: '2024-03-14' },
          { id: 'sprint-2', name: 'Sprint 2', startDate: '2024-03-15', endDate: '2024-03-28' },
          { id: 'sprint-3', name: 'Sprint 3', startDate: '2024-03-29', endDate: '2024-04-11' }
        ])
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error)
      // Mock data as fallback
      setSprints([
        { id: 'sprint-1', name: 'Sprint 1', startDate: '2024-03-01', endDate: '2024-03-14' },
        { id: 'sprint-2', name: 'Sprint 2', startDate: '2024-03-15', endDate: '2024-03-28' },
        { id: 'sprint-3', name: 'Sprint 3', startDate: '2024-03-29', endDate: '2024-04-11' }
      ])
    }
  }

  const fetchEpics = async () => {
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

  const fetchComments = async () => {
    try {
      if (!task?.id) return
      const url = isSubtask
        ? `/api/tasks/${(task as any).taskId}/subtasks/${task.id}/comments`
        : `/api/tasks/${task.id}/comments`
      console.log('[EditTaskModal] Fetching comments from:', url, 'isSubtask:', isSubtask)
      const response = await fetch(url)
      console.log('[EditTaskModal] Comments response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('[EditTaskModal] Comments data received:', data)
        setComments(data)
      } else {
        const error = await response.json()
        console.error('[EditTaskModal] Failed to fetch comments:', error)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const fetchAttachments = async () => {
    try {
      if (!task?.id) return
      const url = isSubtask
        ? `/api/tasks/${(task as any).taskId}/subtasks/${task.id}/attachments`
        : `/api/tasks/${task.id}/attachments`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
        setAttachmentCount(data.length)
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    }
  }

  const handleAttachmentUpdate = () => {
    fetchAttachments()
  }

  const fetchSubtasks = async () => {
    try {
      if (!task?.id) return
      const response = await fetch(`/api/tasks/${task.id}/subtasks`)
      if (response.ok) {
        const data = await response.json()
        setSubtasks(data)
      }
    } catch (error) {
      console.error('Failed to fetch subtasks:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task?.id) return

    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          // Status will be set by the API to the first template state
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add subtask')
      }

      const newSubtask = await response.json()
      toast.success('Subtarea agregada')
      setSubtasks([...subtasks, newSubtask])
      setNewSubtaskTitle('')
    } catch (error) {
      console.error('Failed to add subtask:', error)
      toast.error('Error al agregar subtarea')
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task?.id) return

    try {
      const subtask = subtasks.find(s => s.id === parseInt(subtaskId))
      if (!subtask) return

      const newStatus = subtask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'

      const response = await fetch(`/api/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle subtask')
      }

      const updatedSubtask = await response.json()
      setSubtasks(subtasks.map(s =>
        s.id === parseInt(subtaskId) ? updatedSubtask : s
      ))
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
      toast.error('Error al actualizar subtarea')
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task?.id) return

    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete subtask')
      }

      toast.success('Subtarea eliminada')
      setSubtasks(subtasks.filter(subtask => subtask.id !== parseInt(subtaskId)))
    } catch (error) {
      console.error('Failed to delete subtask:', error)
      toast.error('Error al eliminar subtarea')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return

    setIsSubmittingComment(true)
    try {
      const url = isSubtask
        ? `/api/tasks/${(task as any).taskId}/subtasks/${task.id}/comments`
        : `/api/tasks/${task.id}/comments`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const newCommentData = await response.json()
      toast.success('Comentario agregado')
      setComments([...comments, newCommentData])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast.error('Error al agregar comentario')
    } finally {
      setIsSubmittingComment(false)
    }
  }


  const onSubmit = async (data: EditTaskInput) => {
    if (!task) return

    setIsLoading(true)
    setError(null)

    try {
      // Si es una subtarea, usar el endpoint de subtareas
      const url = isSubtask
        ? `/api/tasks/${(task as any).taskId}/subtasks/${task.id}`
        : `/api/tasks/${task.id}`

      // Fix timezone issue: if dueDate is provided, set it to noon local time
      const requestData = { ...data }
      if (requestData.dueDate) {
        // Convert "YYYY-MM-DD" to ISO string with noon local time
        const [year, month, day] = requestData.dueDate.split('-').map(Number)
        const localDate = new Date(year, month - 1, day, 12, 0, 0, 0)
        requestData.dueDate = localDate.toISOString()
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const updatedTask = await response.json()

      // If this is a subtask, add the isSubtask flag and parent taskId
      if (isSubtask) {
        updatedTask.isSubtask = true
        updatedTask.taskId = (task as any).taskId
      }

      toast.success('Tarea actualizada exitosamente')
      onTaskUpdated(updatedTask)
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
      setActiveTab('details')
    }
    onOpenChange(newOpen)
  }

  const getStatusLabel = (status: string) => {
    // Try to find in custom statuses first
    const customStatus = statuses.find(s => s.id === status)
    if (customStatus) return customStatus.name

    // Fallback to default labels
    switch (status) {
      case 'PENDING': return 'Pendiente'
      case 'IN_PROGRESS': return 'En Progreso'
      case 'COMPLETED': return 'Completada'
      default: return status
    }
  }

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'LOW': return 'Baja'
      case 'MEDIUM': return 'Media'
      case 'HIGH': return 'Alta'
      case 'URGENT': return 'Urgente'
      default: return priority
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const fetchAuditLogs = async () => {
    try {
      if (!task?.id) return
      const url = isSubtask
        ? `/api/tasks/${(task as any).taskId}/subtasks/${task.id}/audit-logs`
        : `/api/tasks/${task.id}/audit-logs`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAuditTrail(data)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <DialogTitle>
              {isSubtask ? 'Editar Subtarea' : 'Editar Tarea'}
              {task && (
                <span className="text-gray-600 font-normal"> - {task.title}</span>
              )}
            </DialogTitle>
          </div>
          <DialogDescription>
            Modifica los detalles de la {isSubtask ? 'subtarea' : 'tarea'}, agrega comentarios o revisa su trazabilidad.
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-500">Cargando datos de la tarea...</p>
          </div>
        ) : task && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {isSubtask ? (
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="font-medium">Detalles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Comentarios</span>
                    {comments.length > 0 && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                        {comments.length}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <Paperclip className="h-4 w-4" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Archivos</span>
                    {attachmentCount > 0 && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                        {attachmentCount}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Trazabilidad</span>
                </TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="font-medium">Detalles</span>
                </TabsTrigger>
                <TabsTrigger
                  value="subtasks"
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Subtareas</span>
                    {subtasks.length > 0 && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                        {subtasks.filter(s => s.status === 'COMPLETED').length}/{subtasks.length}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <MessageSquare className="h-4 w-4" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Comentarios</span>
                    {comments.length > 0 && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                        {comments.length}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <Paperclip className="h-4 w-4" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Archivos</span>
                    {attachmentCount > 0 && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                        {attachmentCount}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all py-2.5"
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Trazabilidad</span>
                </TabsTrigger>
              </TabsList>
            )}

            {/* Tab Content: Detalles */}
            <TabsContent value="details" className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título de la Tarea *</Label>
                  <Input
                    id="title"
                    placeholder="Ingresa el título de la tarea"
                    {...register('title')}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe los detalles de la tarea"
                    rows={3}
                    {...register('description')}
                    disabled={isLoading}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.length > 0 ? (
                              statuses.map((status) => (
                                <SelectItem key={status.id} value={status.id}>
                                  {status.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="PENDING">Pendiente</SelectItem>
                                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                <SelectItem value="COMPLETED">Completada</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Baja</SelectItem>
                            <SelectItem value="MEDIUM">Media</SelectItem>
                            <SelectItem value="HIGH">Alta</SelectItem>
                            <SelectItem value="URGENT">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...register('dueDate')}
                      disabled={isLoading}
                      className="max-w-[200px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignee">Asignado a</Label>
                    <Controller
                      name="assigneeId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || 'unassigned'}
                          onValueChange={(value) => field.onChange(value === 'unassigned' ? undefined : value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar asignado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={String(member.id)}>
                                {member.name || member.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sprint">Sprint</Label>
                    <Controller
                      name="sprintId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || 'no-sprint'}
                          onValueChange={(value) => field.onChange(value === 'no-sprint' ? undefined : value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar sprint" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-sprint">Sin sprint</SelectItem>
                            {sprints.map((sprint) => (
                              <SelectItem key={sprint.id} value={String(sprint.id)}>
                                {sprint.name} ({new Date(sprint.startDate).toLocaleDateString('es-ES')} - {new Date(sprint.endDate).toLocaleDateString('es-ES')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="epic">Épica</Label>
                    <Controller
                      name="epicId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || 'no-epic'}
                          onValueChange={(value) => field.onChange(value === 'no-epic' ? undefined : value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar épica" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-epic">Sin épica</SelectItem>
                            {epics.map((epic) => (
                              <SelectItem key={epic.id} value={String(epic.id)}>
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
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Tab Content: Subtareas */}
            <TabsContent value="subtasks" className="space-y-4">
              <div className="space-y-4">
                {/* Add new subtask */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar nueva subtarea..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>

                {/* Subtasks list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subtasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay subtareas aún</p>
                      <p className="text-sm">Divide esta tarea en partes más pequeñas</p>
                    </div>
                  ) : (
                    subtasks.map((subtask) => {
                      // Find the status configuration for this subtask
                      const statusConfig = statuses.find(s => s.id === subtask.status)

                      // Check if this is the last status (highest order) in the template
                      const maxOrder = Math.max(...statuses.map(s => s.order))
                      const isCompleted = statusConfig?.order === maxOrder

                      return (
                        <div key={subtask.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${
                                isCompleted
                                  ? 'line-through text-gray-500'
                                  : 'text-gray-900'
                              }`}>
                                {subtask.title}
                              </p>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                                style={{
                                  backgroundColor: statusConfig?.color ? `${statusConfig.color}20` : '#f3f4f6',
                                  color: statusConfig?.color || '#6b7280',
                                  border: `1px solid ${statusConfig?.color || '#d1d5db'}`
                                }}
                              >
                                {statusConfig?.name || subtask.status}
                              </span>
                            </div>
                          {subtask.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {subtask.description}
                            </p>
                          )}
                          {subtask.assignee && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <UserIcon className="h-3 w-3" />
                              {subtask.assignee.name || subtask.assignee.email}
                            </p>
                          )}
                        </div>
                      </div>
                      )
                    })
                  )}
                </div>

                {/* Progress indicator */}
                {subtasks.length > 0 && (() => {
                  // Calculate completed subtasks (those in the last status)
                  const maxOrder = Math.max(...statuses.map(s => s.order))
                  const completedCount = subtasks.filter(subtask => {
                    const statusConfig = statuses.find(s => s.id === subtask.status)
                    return statusConfig?.order === maxOrder
                  }).length

                  return (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Progreso</span>
                        <span>
                          {completedCount} de {subtasks.length} completadas
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${subtasks.length > 0
                              ? (completedCount / subtasks.length) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </TabsContent>

            {/* Tab Content: Comentarios */}
            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay comentarios aún</p>
                    <p className="text-sm">Sé el primero en comentar esta tarea</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <span className="font-medium text-sm">{(comment as any).author?.name || 'Usuario'}</span>
                          <span className="text-xs text-gray-500">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(comment as any).createdAt && formatDate((comment as any).createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label>Agregar comentario</Label>
                <MentionTextarea
                  placeholder="Escribe tu comentario... (Usa @ para mencionar usuarios)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                  projectId={projectId}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    size="sm"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Comentar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab Content: Archivos */}
            <TabsContent value="attachments" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-sm text-gray-700">
                    Archivos Adjuntos
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const fileInput = document.getElementById(`file-upload-${task?.id}`) as HTMLInputElement
                      fileInput?.click()
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Adjuntar Archivo
                  </Button>
                </div>

                {task && (
                  <AttachmentList
                    taskId={parseInt(task.id)}
                    initialAttachments={attachments}
                    onAttachmentsChange={handleAttachmentUpdate}
                  />
                )}
              </div>
            </TabsContent>

            {/* Tab Content: Trazabilidad */}
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditTrail.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay historial disponible</p>
                  </div>
                ) : (
                  auditTrail.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        {index !== auditTrail.length - 1 && (
                          <div className="w-px h-12 bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{entry.action}</span>
                          <span className="text-xs text-gray-500">
                            por {entry.user?.name || entry.user?.email || 'Usuario'}
                          </span>
                        </div>
                        {entry.details && <p className="text-sm text-gray-600 mb-1">{entry.details}</p>}
                        {entry.field && entry.oldValue && entry.newValue && (
                          <p className="text-sm text-gray-600 mb-1">
                            {entry.field}: {entry.oldValue} → {entry.newValue}
                          </p>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
        {!isLoadingData && !task && (
          <div className="text-center py-8 text-gray-500">
            No se pudo cargar la tarea
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}