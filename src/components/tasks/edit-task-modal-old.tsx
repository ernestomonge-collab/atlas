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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { Loader2, Edit3, MessageSquare, Clock } from 'lucide-react'

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

type EditTaskInput = z.infer<typeof editTaskSchema>

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  assigneeId?: string
  createdAt: string
  updatedAt: string
  projectId: string
}

interface EditTaskModalProps {
  task: Task | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: (task: Task) => void
}

interface User {
  id: string
  name?: string
  email: string
}

interface Sprint {
  id: string
  name: string
  status: string
}

export function EditTaskModal({
  task,
  projectId,
  open,
  onOpenChange,
  onTaskUpdated
}: EditTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState('details')
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

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

  useEffect(() => {
    if (open && task) {
      // Populate form with task data
      setValue('title', task.title)
      setValue('description', task.description || '')
      setValue('status', task.status)
      setValue('priority', task.priority)
      setValue('dueDate', task.dueDate ? task.dueDate.split('T')[0] : '')
      setValue('assigneeId', task.assigneeId || '')

      fetchTeamMembers()
      fetchComments()
    }
  }, [open, task, setValue])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const projectMembers = await response.json()
        const users = projectMembers.map((member: any) => member.user)
        setTeamMembers(users)
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error)
    }
  }

  const fetchComments = async () => {
    try {
      // Mock comments data for now
      const mockComments = [
        {
          id: 1,
          content: 'Esta tarea necesita revisión de los requisitos',
          author: { name: 'Juan Pérez', avatar: null },
          createdAt: '2024-03-10T10:30:00Z'
        },
        {
          id: 2,
          content: 'He actualizado la descripción con más detalles',
          author: { name: 'María García', avatar: null },
          createdAt: '2024-03-10T14:15:00Z'
        }
      ]
      setComments(mockComments)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const comment = {
        id: comments.length + 1,
        content: newComment.trim(),
        author: { name: 'Usuario Actual', avatar: null },
        createdAt: new Date().toISOString()
      }

      setComments([...comments, comment])
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const onSubmit = async (data: EditTaskInput) => {
    if (!task) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const updatedTask = await response.json()
      onTaskUpdated(updatedTask)
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  const getStatusLabel = (status: TaskStatus) => {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <DialogTitle>Editar Tarea</DialogTitle>
          </div>
          <DialogDescription>
            Modifica los detalles de la tarea.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Trazabilidad
            </TabsTrigger>
          </TabsList>

        {task && (
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
                placeholder="Describe la tarea (opcional)"
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">
                          <span className="text-gray-600">{getStatusLabel('PENDING')}</span>
                        </SelectItem>
                        <SelectItem value="IN_PROGRESS">
                          <span className="text-blue-600">{getStatusLabel('IN_PROGRESS')}</span>
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                          <span className="text-green-600">{getStatusLabel('COMPLETED')}</span>
                        </SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">
                          <span className="text-gray-600">{getPriorityLabel('LOW')}</span>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <span className="text-yellow-600">{getPriorityLabel('MEDIUM')}</span>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <span className="text-orange-600">{getPriorityLabel('HIGH')}</span>
                        </SelectItem>
                        <SelectItem value="URGENT">
                          <span className="text-red-600">{getPriorityLabel('URGENT')}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        {teamMembers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

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
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name} ({sprint.status.toLowerCase()})
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
        )}
      </DialogContent>
    </Dialog>
  )
}