'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MainLayout } from '@/components/layout/main-layout'
import { getMockProjectById, getMockTasksByProjectId, MOCK_SPRINTS } from '@/lib/mock-data'
import { Project, Task, Sprint, TaskPriority } from '@/types'
import {
  ArrowLeft,
  Filter,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  Target,
  List,
  Plus
} from 'lucide-react'

interface KanbanPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectKanbanPage({ params }: KanbanPageProps) {
  const { id } = await params
  return <KanbanPageClient projectId={id} />
}

function KanbanPageClient({ projectId }: { projectId: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sprintFilter, setSprintFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session, projectId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Get project by ID from mock data
      const projectData = getMockProjectById(projectId)

      if (!projectData) {
        router.push('/projects')
        return
      }

      setProject(projectData as unknown as Project)

      // Get tasks for this project
      const projectTasks = getMockTasksByProjectId(projectId)
      setTasks(projectTasks as unknown as Task[])

      // Get sprints for this project
      const projectSprints = MOCK_SPRINTS.filter(sprint =>
        sprint.projectId === projectId ||
        sprint.name.toLowerCase().includes(projectData.name.toLowerCase().split(' ')[0])
      )
      setSprints(projectSprints as unknown as Sprint[])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePriorityChange = async (taskId: string, newPriority: string) => {
    try {
      // TODO: Implement API call to update task priority
      console.log('Updating task priority:', taskId, newPriority)

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, priority: newPriority as unknown as TaskPriority } : task
      ) as unknown as Task[])
    } catch (error) {
      console.error('Error updating task priority:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const getTaskSprint = (taskId: string) => {
    for (const sprint of sprints) {
      if (sprint.tasks.some((t: Task) => t.id === taskId)) {
        return sprint
      }
    }
    return null
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || !project) {
    return null
  }

  // Filter tasks based on sprint selection
  let filteredTasks = tasks
  if (sprintFilter !== 'all') {
    if (sprintFilter === 'unassigned') {
      filteredTasks = tasks.filter(task => !getTaskSprint(task.id))
    } else {
      const selectedSprint = sprints.find(s => s.id === sprintFilter)
      if (selectedSprint) {
        const sprintTaskIds = selectedSprint.tasks.map((t: Task) => t.id)
        filteredTasks = tasks.filter(task => sprintTaskIds.includes(task.id))
      }
    }
  }

  // Group tasks by priority
  const highPriorityTasks = filteredTasks.filter(task => task.priority === 'HIGH')
  const mediumPriorityTasks = filteredTasks.filter(task => task.priority === 'MEDIUM')
  const lowPriorityTasks = filteredTasks.filter(task => task.priority === 'LOW')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const taskSprint = getTaskSprint(task.id)

    return (
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-move">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm">{task.title}</h3>
            <Select
              value={task.priority}
              onValueChange={(value) => handlePriorityChange(task.id, value)}
            >
              <SelectTrigger className="w-20 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="MEDIUM">Media</SelectItem>
                <SelectItem value="LOW">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 mb-3">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="secondary"
              className={getStatusColor(task.status)}
            >
              {getStatusText(task.status)}
            </Badge>
            {taskSprint && (
              <Badge variant="outline" className="text-xs">
                {taskSprint.name}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const PriorityColumn = ({ title, tasks, priority, color }: {
    title: string
    tasks: Task[]
    priority: TaskPriority
    color: string
  }) => (
    <div className="flex-1">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className={`text-sm font-medium flex items-center gap-2 ${color}`}>
            <AlertTriangle className="h-4 w-4" />
            {title}
            <Badge variant="secondary" className="ml-auto">
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 min-h-96">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Sin tareas</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <MainLayout
      title={`Kanban - ${project.name}`}
      description="Vista Kanban para gestión de backlog y prioridades"
    >
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Proyecto
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vista Kanban - Backlog
          </h1>
          <p className="text-gray-600">
            Proyecto: <span className="font-medium">{project.name}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las tareas</SelectItem>
              <SelectItem value="unassigned">Sin asignar a sprint</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline">
              <List className="mr-2 h-4 w-4" />
              Vista Lista
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Vista de Gestión de Backlog</h3>
              <p className="text-sm text-blue-700">
                En esta vista puedes <strong>cambiar prioridades</strong> de las tareas y <strong>organizarlas por sprint</strong>.
                Los estados de las tareas se actualizan desde las vistas Kanban de cada sprint durante la ejecución.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PriorityColumn
          title="Prioridad Alta"
          tasks={highPriorityTasks}
          priority="HIGH"
          color="text-red-700"
        />
        <PriorityColumn
          title="Prioridad Media"
          tasks={mediumPriorityTasks}
          priority="MEDIUM"
          color="text-yellow-700"
        />
        <PriorityColumn
          title="Prioridad Baja"
          tasks={lowPriorityTasks}
          priority="LOW"
          color="text-green-700"
        />
      </div>
    </MainLayout>
  )
}