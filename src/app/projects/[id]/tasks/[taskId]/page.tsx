'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TaskDetailView } from '@/components/tasks/task-detail-view'
import { TaskComments } from '@/components/tasks/task-comments'
import { useProject } from '@/hooks/use-project'
import { useTask } from '@/hooks/use-task'
import { ArrowLeft, Edit, Trash2, User, Calendar, Flag } from 'lucide-react'
import { TaskStatus, TaskPriority } from '@prisma/client'
import { Task } from '@/types'

export default async function TaskDetailPage({
  params
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: projectId, taskId } = await params

  return <TaskDetailClient projectId={projectId} taskId={taskId} />
}

function TaskDetailClient({ projectId, taskId }: { projectId: string; taskId: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { project, isLoading: projectLoading } = useProject(projectId)
  const { task, isLoading: taskLoading, updateTask, deleteTask } = useTask(projectId, taskId)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || projectLoading || taskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !project || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tarea no encontrada</h1>
          <p className="text-gray-600 mb-4">La tarea que buscas no existe o no tienes permisos para verla.</p>
          <Link href={`/projects/${projectId}`}>
            <Button>Volver al Proyecto</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleTaskUpdate = async (updates: Partial<Task>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateTask(updates as any)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleTaskDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')) {
      try {
        await deleteTask()
        router.push(`/projects/${projectId}`)
      } catch (error) {
        console.error('Failed to delete task:', error)
      }
    }
  }

  const canEdit = session.user.role === 'ADMIN' || session.user.role === 'MEMBER'
  const canDelete = session.user.role === 'ADMIN' || task.createdBy.id === session.user.id

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  if (isEditing) {
    return (
      /* eslint-disable @typescript-eslint/no-explicit-any */
      <TaskDetailView
        project={project as any}
        task={task as any}
        onSave={handleTaskUpdate}
        onCancel={() => setIsEditing(false)}
        isEditing={true}
      />
      /* eslint-enable @typescript-eslint/no-explicit-any */
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href={`/projects/${projectId}`}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">{task.title}</h1>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ').toLowerCase()}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                    <Flag className="mr-1 h-3 w-3" />
                    {task.priority.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {project.name} • Creada el {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
              {canDelete && (
                <Button onClick={handleTaskDelete} variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Task Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                {task.description ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">{task.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Sin descripción</p>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad</CardTitle>
                <CardDescription>Historial de cambios y comentarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{task.createdBy.name || task.createdBy.email}</span>
                        {' '}creó esta tarea
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString()} a las {new Date(task.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {task.updatedAt !== task.createdAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Edit className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">Tarea actualizada</p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.updatedAt).toLocaleDateString()} a las {new Date(task.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardContent className="pt-6">
                <TaskComments taskId={taskId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assignee */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Asignado a</label>
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {getInitials(task.assignee.name, task.assignee.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{task.assignee.name || 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500">{task.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin asignar</p>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Fecha de vencimiento</label>
                  {task.dueDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sin fecha límite</p>
                  )}
                </div>

                {/* Created By */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Creado por</label>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {getInitials(task.createdBy.name, task.createdBy.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{task.createdBy.name || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{task.createdBy.email}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="pt-2 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Creada</span>
                      <span className="text-xs text-gray-700">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Actualizada</span>
                      <span className="text-xs text-gray-700">{new Date(task.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleTaskUpdate({ status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } as any)}
                  >
                    {task.status === 'COMPLETED' ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleTaskUpdate({
                      status: task.status === 'IN_PROGRESS' ? 'PENDING' : 'IN_PROGRESS'
                    })}
                  >
                    {task.status === 'IN_PROGRESS' ? 'Pausar' : 'Comenzar Trabajo'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}