'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { SpaceCard } from '@/components/spaces/space-card'
import { CreateSpaceModal } from '@/components/spaces/create-space-modal'
import { MainLayout } from '@/components/layout/main-layout'
import { useProjects } from '@/hooks/use-projects'
import { useSpaces } from '@/hooks/use-spaces'
import { Building2, Plus, Users, BarChart3, CheckCircle, Layers, Clock, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { projects, isLoading: projectsLoading, refreshProjects } = useProjects()
  const { spaces, isLoading: spacesLoading, refreshSpaces } = useSpaces()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false)
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false)
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [quickTaskForm, setQuickTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    projectId: '',
    sprintId: ''
  })
  const [availableSprints, setAvailableSprints] = useState<any[]>([])

  const isLoading = projectsLoading || spacesLoading

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Fetch recent tasks when projects are loaded
    const fetchRecentTasks = async () => {
      try {
        const tasksPromises = projects.slice(0, 5).map(async (project) => {
          const response = await fetch(`/api/projects/${project.id}/tasks`)
          if (response.ok) {
            const tasks = await response.json()
            return tasks.slice(0, 2) // Get first 2 tasks from each project
          }
          return []
        })

        const allTasks = await Promise.all(tasksPromises)
        const flatTasks = allTasks.flat()
        // Sort by updatedAt and take the 5 most recent
        const sortedTasks = flatTasks.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ).slice(0, 5)

        setRecentTasks(sortedTasks)
      } catch (error) {
        console.error('Error fetching recent tasks:', error)
      }
    }

    if (projects.length > 0) {
      fetchRecentTasks()
    }
  }, [projects])

  // Fetch sprints when project is selected
  useEffect(() => {
    const fetchSprints = async () => {
      if (quickTaskForm.projectId) {
        try {
          const response = await fetch(`/api/projects/${quickTaskForm.projectId}/sprints`)
          if (response.ok) {
            const sprints = await response.json()
            setAvailableSprints(sprints)
          }
        } catch (error) {
          console.error('Error fetching sprints:', error)
        }
      } else {
        setAvailableSprints([])
      }
    }
    fetchSprints()
  }, [quickTaskForm.projectId])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated, the useEffect above will redirect
  if (!session) {
    return null
  }

  const handleProjectCreated = () => {
    refreshProjects()
  }

  const handleSpaceCreated = () => {
    refreshSpaces()
  }

  // Calculate totals from projects
  const totalSpaces = spaces.length
  const totalProjects = projects.length
  const totalTasks = projects.reduce((sum, project) => sum + project.totalTasks, 0)
  const completedTasks = projects.reduce((sum, project) => sum + project.completedTasks, 0)
  const inProgressTasks = projects.reduce((sum, project) => {
    // Estimate: tasks that are not completed and not pending
    const estimated = project.totalTasks - project.completedTasks
    return sum + Math.floor(estimated / 2)
  }, 0)
  const pendingTasks = totalTasks - completedTasks - inProgressTasks

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
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

  const handleQuickTask = () => {
    setShowQuickTaskModal(true)
  }

  const handleCreateQuickTask = async () => {
    if (!quickTaskForm.title.trim() || !quickTaskForm.projectId) return

    try {
      const response = await fetch(`/api/projects/${quickTaskForm.projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quickTaskForm.title,
          description: quickTaskForm.description || null,
          priority: quickTaskForm.priority,
          status: 'PENDING',
          sprintId: quickTaskForm.sprintId || null
        }),
      })

      if (response.ok) {
        toast.success('Tarea rápida creada exitosamente')
        // Reset form and close modal
        setQuickTaskForm({
          title: '',
          description: '',
          priority: 'MEDIUM',
          projectId: '',
          sprintId: ''
        })
        setShowQuickTaskModal(false)
        // Refresh projects to update task counts
        refreshProjects()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to create task'
        console.error('Failed to create task')
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('Error creating quick task:', error)
      toast.error('Error al crear la tarea rápida')
    }
  }

  return (
    <MainLayout
      title="Dashboard"
      description={`Bienvenido de vuelta, ${session.user.name || session.user.email}`}
    >

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Spaces
              </CardTitle>
              <Layers className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSpaces}</div>
              <p className="text-xs text-gray-500">Active spaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Projects
              </CardTitle>
              <Building2 className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-gray-500">Total projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Tasks
              </CardTitle>
              <BarChart3 className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-gray-500">All tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 ml-auto text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-gray-500">Finished tasks</p>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowCreateSpaceModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Espacio
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Proyecto
              </Button>
              <Button variant="outline" onClick={handleQuickTask}>
                <Zap className="mr-2 h-4 w-4" />
                + Tarea Rápida
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente del Equipo</CardTitle>
                <CardDescription>Últimas actualizaciones en tareas y proyectos</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay actividad reciente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {task.title}
                            </h4>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {task.assignee?.name || 'Sin asignar'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(task.updatedAt), "d MMM, HH:mm", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Task Summary with Tooltips */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Tareas</CardTitle>
                <CardDescription>Conteo total por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Completadas</p>
                        <p className="text-xs text-gray-500">
                          {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% del total
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{completedTasks}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">En Progreso</p>
                        <p className="text-xs text-gray-500">Trabajando actualmente</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {inProgressTasks}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pendientes</p>
                        <p className="text-xs text-gray-500">Por iniciar</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-600">
                      {pendingTasks}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />

      <CreateSpaceModal
        open={showCreateSpaceModal}
        onOpenChange={setShowCreateSpaceModal}
        onSpaceCreated={handleSpaceCreated}
      />

      {/* Quick Task Modal */}
      <Dialog open={showQuickTaskModal} onOpenChange={setShowQuickTaskModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Tarea Rápida</DialogTitle>
            <DialogDescription>
              Crea una tarea rápida y asígnala a un proyecto específico
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quick-task-project">Proyecto *</Label>
              <Select
                value={quickTaskForm.projectId}
                onValueChange={(value) => setQuickTaskForm({ ...quickTaskForm, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.space?.name || 'Sin espacio'} / {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-task-title">Título *</Label>
              <Input
                id="quick-task-title"
                placeholder="Título de la tarea"
                value={quickTaskForm.title}
                onChange={(e) => setQuickTaskForm({ ...quickTaskForm, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-task-priority">Prioridad</Label>
              <Select
                value={quickTaskForm.priority}
                onValueChange={(value) => setQuickTaskForm({ ...quickTaskForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-task-sprint">Sprint</Label>
              <Select
                value={quickTaskForm.sprintId || 'no-sprint'}
                onValueChange={(value) => setQuickTaskForm({ ...quickTaskForm, sprintId: value === 'no-sprint' ? '' : value })}
                disabled={!quickTaskForm.projectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!quickTaskForm.projectId ? "Primero selecciona un proyecto" : "Selecciona un sprint"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-sprint">Sin sprint</SelectItem>
                  {availableSprints.map(sprint => (
                    <SelectItem key={sprint.id} value={sprint.id.toString()}>
                      {sprint.name} ({sprint.status === 'ACTIVE' ? 'activo' : sprint.status === 'PLANNING' ? 'planificación' : 'completado'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quick-task-description">Descripción</Label>
              <Textarea
                id="quick-task-description"
                placeholder="Descripción de la tarea (opcional)"
                rows={3}
                value={quickTaskForm.description}
                onChange={(e) => setQuickTaskForm({ ...quickTaskForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickTaskModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateQuickTask}
              disabled={!quickTaskForm.title.trim() || !quickTaskForm.projectId}
            >
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}