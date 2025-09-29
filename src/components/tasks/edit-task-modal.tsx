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
import { Checkbox } from '@/components/ui/checkbox'
// Define local types to match mock data
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
import { getMockSubtasksByTaskId } from '@/lib/mock-data'
import { Loader2, Edit3, MessageSquare, Clock, Send, User, Paperclip, Upload, FileText, Download, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react'

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

type EditTaskInput = z.infer<typeof editTaskSchema>

interface Subtask {
  id: string
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  taskId: string
  order: number
  createdAt: string
  updatedAt: string
}

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
  const [attachments, setAttachments] = useState<any[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

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
      setValue('assigneeId', task.assigneeId || undefined)

      fetchTeamMembers()
      fetchComments()
      fetchAttachments()
      fetchSubtasks()
    }
  }, [open, task, setValue])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const members = await response.json()
        setTeamMembers(members)
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
          content: 'Esta tarea necesita revisión de los requisitos técnicos.',
          author: { name: 'Juan Pérez', avatar: null },
          createdAt: '2024-03-10T10:30:00Z'
        },
        {
          id: 2,
          content: 'He actualizado la descripción con más detalles sobre la implementación.',
          author: { name: 'María García', avatar: null },
          createdAt: '2024-03-10T14:15:00Z'
        }
      ]
      setComments(mockComments)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const fetchAttachments = async () => {
    try {
      // Mock attachments data for now
      const mockAttachments = [
        {
          id: 1,
          name: 'requirements.pdf',
          size: 2.5,
          type: 'application/pdf',
          uploadedBy: 'Juan Pérez',
          uploadedAt: '2024-03-09T16:20:00Z',
          url: '/mock/requirements.pdf'
        },
        {
          id: 2,
          name: 'design-mockups.png',
          size: 1.8,
          type: 'image/png',
          uploadedBy: 'María García',
          uploadedAt: '2024-03-10T09:45:00Z',
          url: '/mock/design-mockups.png'
        },
        {
          id: 3,
          name: 'implementation-notes.docx',
          size: 0.9,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          uploadedBy: 'Carlos López',
          uploadedAt: '2024-03-10T11:30:00Z',
          url: '/mock/implementation-notes.docx'
        }
      ]
      setAttachments(mockAttachments)
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    }
  }

  const fetchSubtasks = async () => {
    try {
      if (!task?.id) return
      const taskSubtasks = getMockSubtasksByTaskId(task.id)
      setSubtasks(taskSubtasks)
    } catch (error) {
      console.error('Failed to fetch subtasks:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task?.id) return

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))

      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        status: 'PENDING',
        taskId: task.id,
        order: subtasks.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setSubtasks([...subtasks, newSubtask])
      setNewSubtaskTitle('')
    } catch (error) {
      console.error('Failed to add subtask:', error)
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))

      setSubtasks(subtasks.map(subtask =>
        subtask.id === subtaskId
          ? {
              ...subtask,
              status: subtask.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
              updatedAt: new Date().toISOString()
            }
          : subtask
      ))
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))

      setSubtasks(subtasks.filter(subtask => subtask.id !== subtaskId))
    } catch (error) {
      console.error('Failed to delete subtask:', error)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploadingFile(true)
    try {
      // Mock file upload
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newAttachments = Array.from(files).map((file, index) => ({
        id: attachments.length + index + 1,
        name: file.name,
        size: file.size / (1024 * 1024), // Convert to MB
        type: file.type,
        uploadedBy: 'Usuario Actual',
        uploadedAt: new Date().toISOString(),
        url: `/mock/${file.name}`
      }))

      setAttachments([...attachments, ...newAttachments])
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setIsUploadingFile(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300))

      setAttachments(attachments.filter(att => att.id !== attachmentId))
    } catch (error) {
      console.error('Failed to delete attachment:', error)
    }
  }

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`
    }
    return `${sizeInMB.toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️'
    } else if (fileType.includes('pdf')) {
      return '📄'
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return '📝'
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return '📊'
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return '📋'
    }
    return '📎'
  }

  const onSubmit = async (data: EditTaskInput) => {
    if (!task) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      setActiveTab('details')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Mock trazabilidad data
  const auditTrail = [
    {
      id: 1,
      action: 'Tarea creada',
      user: 'Juan Pérez',
      timestamp: '2024-03-08T09:15:00Z',
      details: 'Tarea creada con prioridad Media'
    },
    {
      id: 2,
      action: 'Estado cambiado',
      user: 'María García',
      timestamp: '2024-03-09T11:30:00Z',
      details: 'Estado cambiado de Pendiente a En Progreso'
    },
    {
      id: 3,
      action: 'Prioridad actualizada',
      user: 'Carlos López',
      timestamp: '2024-03-10T08:45:00Z',
      details: 'Prioridad cambiada de Media a Alta'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <DialogTitle>Editar Tarea</DialogTitle>
          </div>
          <DialogDescription>
            Modifica los detalles de la tarea, agrega comentarios o revisa su trazabilidad.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="subtasks" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Subtareas ({subtasks.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Archivos ({attachments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Trazabilidad
              </TabsTrigger>
            </TabsList>

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
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                            <SelectItem value="COMPLETED">Completada</SelectItem>
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
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                              <SelectItem key={member.id} value={member.id}>
                                {member.name || member.email}
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
                    subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(subtask.id)}
                          className="flex-shrink-0"
                        >
                          {subtask.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            subtask.status === 'COMPLETED'
                              ? 'line-through text-gray-500'
                              : 'text-gray-900'
                          }`}>
                            {subtask.title}
                          </p>
                          {subtask.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {subtask.description}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Progress indicator */}
                {subtasks.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progreso</span>
                      <span>
                        {subtasks.filter(s => s.status === 'COMPLETED').length} de {subtasks.length} completadas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${subtasks.length > 0
                            ? (subtasks.filter(s => s.status === 'COMPLETED').length / subtasks.length) * 100
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}
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
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
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
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe tu comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="flex-1"
                  />
                </div>
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
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Subir archivos</p>
                      <p className="text-sm text-gray-500">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </p>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button type="button" disabled={isUploadingFile} asChild>
                          <span>
                            {isUploadingFile ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Seleccionar archivos
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploadingFile}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Máximo 10MB por archivo. Formatos soportados: PDF, DOC, XLS, PPT, imágenes
                    </p>
                  </div>
                </div>

                {/* Attachments List */}
                <div className="space-y-3">
                  {attachments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Paperclip className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay archivos adjuntos</p>
                      <p className="text-sm">Los archivos que subas aparecerán aquí</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm text-gray-700">
                          Archivos adjuntos ({attachments.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-2xl">
                                {getFileIcon(attachment.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {attachment.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{formatFileSize(attachment.size)}</span>
                                  <span>•</span>
                                  <span>por {attachment.uploadedBy}</span>
                                  <span>•</span>
                                  <span>{formatDate(attachment.uploadedAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Descargar archivo"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                title="Eliminar archivo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
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
                            por {entry.user}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{entry.details}</p>
                        <span className="text-xs text-gray-400">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}