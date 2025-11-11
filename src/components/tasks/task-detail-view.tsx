'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
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
import { Task, Project, User, Sprint } from '@/types'
import { ArrowLeft, Loader2, Save, X } from 'lucide-react'

// Define enums locally to avoid Prisma client import issues in client components
const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
})

type EditTaskInput = z.infer<typeof editTaskSchema>

interface TaskDetailViewProps {
  project: Project
  task: Task
  onSave: (updates: Partial<Task>) => Promise<void>
  onCancel: () => void
  isEditing: boolean
}


interface LocalSprint {
  id: string
  name: string
  status: string
}

export function TaskDetailView({
  project,
  task,
  onSave,
  onCancel,
  isEditing
}: TaskDetailViewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [sprints, setSprints] = useState<LocalSprint[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditTaskInput>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: task.assignee?.id || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sprintId: (task as any).sprint?.id || '',
    },
  })

  const status = watch('status')
  const priority = watch('priority')
  const assigneeId = watch('assigneeId')
  const sprintId = watch('sprintId')

  useEffect(() => {
    if (isEditing) {
      fetchTeamMembers()
      fetchSprints()
    }
  }, [isEditing])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const users = await response.json()
        setTeamMembers(users)
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    }
  }

  const fetchSprints = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/sprints`)
      if (response.ok) {
        const sprintsData = await response.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const availableSprints = sprintsData.filter((sprint: any) =>
          sprint.status === 'PLANNING' || sprint.status === 'ACTIVE'
        )
        setSprints(availableSprints as unknown as LocalSprint[])
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error)
    }
  }

  const onSubmit = async (data: EditTaskInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const updates = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        assigneeId: data.assigneeId || undefined,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await onSave(updates as any)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href={`/projects/${project.id}/tasks/${task.id}`}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Editar Tarea</h1>
                <p className="text-sm text-gray-500">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={onCancel} variant="outline" disabled={isLoading}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                type="submit"
                form="edit-task-form"
                disabled={isLoading || !isDirty}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="edit-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título de la tarea *</Label>
              <Input
                id="title"
                placeholder="Ingresa el título de la tarea"
                {...register('title')}
                disabled={isLoading}
                className="text-lg"
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe la tarea en detalle (opcional)"
                rows={6}
                {...register('description')}
                disabled={isLoading}
                className="min-h-32"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue('status', value as TaskStatus, { shouldDirty: true })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                        {getStatusLabel('PENDING')}
                      </div>
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        {getStatusLabel('IN_PROGRESS')}
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        {getStatusLabel('COMPLETED')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={priority}
                  onValueChange={(value) => setValue('priority', value as TaskPriority, { shouldDirty: true })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                        {getPriorityLabel('LOW')}
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                        {getPriorityLabel('MEDIUM')}
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                        {getPriorityLabel('HIGH')}
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        {getPriorityLabel('URGENT')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee, Due Date, and Sprint Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assignee">Asignado a</Label>
                <Select
                  value={assigneeId}
                  onValueChange={(value) => setValue('assigneeId', value, { shouldDirty: true })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {teamMembers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de vencimiento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint">Sprint</Label>
                <Select
                  value={sprintId}
                  onValueChange={(value) => setValue('sprintId', value, { shouldDirty: true })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin sprint</SelectItem>
                    {sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name} ({sprint.status.toLowerCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Task Metadata */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                <div>
                  <p><strong>Creada por:</strong> {task.createdBy.name || task.createdBy.email}</p>
                  <p><strong>Fecha de creación:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p><strong>Última actualización:</strong> {new Date(task.updatedAt).toLocaleDateString()}</p>
                  <p><strong>ID:</strong> {task.id}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}