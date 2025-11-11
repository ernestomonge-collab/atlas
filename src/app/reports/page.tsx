'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MainLayout } from '@/components/layout/main-layout'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Target,
  Filter,
  Lightbulb,
  AlertCircle,
  Zap,
  Award
} from 'lucide-react'

interface ProjectAnalytics {
  id: string
  name: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  progress: number
  overdueTasks: number
  averageCompletionTime?: number
  recentActivity: number
  teamMembersCount: number
  blockedTasks?: number
  estimatedHours?: number
  actualHours?: number
  onTimeCompletionRate?: number
  methodology?: string
  spaceId?: string
}

interface TeamAnalytics {
  totalUsers: number
  totalProjects: number
  totalTasks: number
  completedTasksThisWeek: number
  productivityTrend: 'up' | 'down' | 'stable'
  averageTasksPerUser: number
  completionRate: number
}

interface MemberProductivity {
  id: string
  name: string
  tasksCompleted: number
  tasksInProgress: number
  productivity: number
  trend: 'up' | 'down' | 'stable'
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics[]>([])
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null)
  const [spaces, setSpaces] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedUser, setSelectedUser] = useState('all')
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [selectedMethodology, setSelectedMethodology] = useState('all')

  // Fetch initial data (spaces and team members)
  useEffect(() => {
    if (session) {
      fetchSpacesAndMembers()
    }
  }, [session])

  // State for additional data
  const [burndownData, setBurndownData] = useState<any[]>([])
  const [velocityData, setVelocityData] = useState<any[]>([])
  const [memberProductivity, setMemberProductivity] = useState<MemberProductivity[]>([])

  // Fetch analytics when filters change
  useEffect(() => {
    if (session) {
      fetchAnalytics()
      fetchChartData()
    }
  }, [session, selectedPeriod, selectedUser, selectedSpace, selectedMethodology])

  const fetchSpacesAndMembers = async () => {
    try {
      const [spacesRes, membersRes] = await Promise.all([
        fetch('/api/spaces'),
        fetch('/api/users')
      ])

      if (spacesRes.ok) {
        const spacesData = await spacesRes.json()
        setSpaces(spacesData)
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setTeamMembers(membersData)
      }
    } catch (error) {
      console.error('Error fetching spaces and members:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)

      // Build query params
      const params = new URLSearchParams({
        period: selectedPeriod
      })

      if (selectedSpace !== 'all') {
        params.append('spaceId', selectedSpace)
      }

      // Fetch team and project analytics
      const [teamRes, projectsRes] = await Promise.all([
        fetch(`/api/analytics/team?${params}`),
        fetch(`/api/analytics/projects?${params}`)
      ])

      if (!teamRes.ok || !projectsRes.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const teamData = await teamRes.json()
      let projectsData = await projectsRes.json()

      // Apply methodology filter on client side
      if (selectedMethodology !== 'all') {
        projectsData = projectsData.filter((p: ProjectAnalytics) => p.methodology === selectedMethodology)
      }

      setTeamAnalytics(teamData)
      setProjectAnalytics(projectsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analíticas')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      // Build params
      const params = new URLSearchParams({
        period: selectedPeriod
      })

      if (selectedSpace !== 'all') {
        params.append('spaceId', selectedSpace)
      }

      // Fetch productivity data
      const productivityRes = await fetch(`/api/analytics/productivity?${params}`)
      if (productivityRes.ok) {
        const productivityData = await productivityRes.json()
        setMemberProductivity(productivityData)
      }

      // Fetch burndown data (for first active project)
      if (projectAnalytics.length > 0) {
        const firstProject = projectAnalytics[0]
        const burndownRes = await fetch(`/api/analytics/burndown?projectId=${firstProject.id}`)
        if (burndownRes.ok) {
          const burndownDataRes = await burndownRes.json()
          setBurndownData(burndownDataRes.length > 0 ? burndownDataRes : [
            { day: 'Lun', ideal: 0, real: 0 },
            { day: 'Mar', ideal: 0, real: 0 },
            { day: 'Mié', ideal: 0, real: 0 },
            { day: 'Jue', ideal: 0, real: 0 },
            { day: 'Vie', ideal: 0, real: 0 }
          ])
        }

        // Fetch velocity data
        const velocityRes = await fetch(`/api/analytics/velocity?projectId=${firstProject.id}&limit=5`)
        if (velocityRes.ok) {
          const velocityDataRes = await velocityRes.json()
          setVelocityData(velocityDataRes.length > 0 ? velocityDataRes : [])
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Set empty defaults
      setBurndownData([])
      setVelocityData([])
    }
  }

  // Generate automatic insights
  const generateInsights = () => {
    const insights = []

    if (teamAnalytics) {
      if (teamAnalytics.completedTasksThisWeek > 50) {
        insights.push({
          type: 'positive',
          message: `Tu equipo completó ${teamAnalytics.completedTasksThisWeek} tareas esta semana, ¡15% más que la semana pasada!`
        })
      }

      if (teamAnalytics.completionRate > 80) {
        insights.push({
          type: 'positive',
          message: `Excelente tasa de completitud del ${teamAnalytics.completionRate}%. El equipo está manteniendo un ritmo constante.`
        })
      }
    }

    const totalBlocked = projectAnalytics.reduce((sum, p) => sum + (p.blockedTasks || 0), 0)
    if (totalBlocked > 10) {
      insights.push({
        type: 'warning',
        message: `Hay ${totalBlocked} tareas bloqueadas. Considera revisar las dependencias y blockers.`
      })
    }

    const avgOnTime = projectAnalytics.reduce((sum, p) => sum + (p.onTimeCompletionRate || 0), 0) / projectAnalytics.length
    if (avgOnTime < 70) {
      insights.push({
        type: 'warning',
        message: `El ${Math.floor(100 - avgOnTime)}% de las tareas se están completando fuera de tiempo. Revisa las estimaciones.`
      })
    }

    return insights
  }

  const insights = generateInsights()

  // Session is guaranteed by middleware, but add safety check
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600'
    if (progress >= 60) return 'text-blue-600'
    if (progress >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <MainLayout
      title="Reportes y Analíticas"
      description="Visualiza el rendimiento del equipo y proyectos"
    >
      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">Filtros Inteligentes</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 3 meses</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Usuario</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Espacio</label>
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id.toString()}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Metodología</label>
              <Select value={selectedMethodology} onValueChange={setSelectedMethodology}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="SCRUM">Scrum</SelectItem>
                  <SelectItem value="KANBAN">Kanban</SelectItem>
                  <SelectItem value="HYBRID">Híbrida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando analíticas...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Insights Automáticos */}
          {insights.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900">Insights Automáticos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                  <Card key={index} className={insight.type === 'positive' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {insight.type === 'positive' ? (
                          <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        )}
                        <p className="text-sm text-gray-700">{insight.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Team Overview Stats */}
          {teamAnalytics && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Equipo</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Productividad
                    </CardTitle>
                    {getTrendIcon(teamAnalytics.productivityTrend)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamAnalytics.completedTasksThisWeek}</div>
                    <p className="text-xs text-gray-500">Tareas completadas esta semana</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Tasa de Completitud
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamAnalytics.completionRate}%</div>
                    <p className="text-xs text-gray-500">De todas las tareas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Promedio por Usuario
                    </CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamAnalytics.averageTasksPerUser}</div>
                    <p className="text-xs text-gray-500">Tareas por persona</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Proyectos
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-indigo-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamAnalytics.totalProjects}</div>
                    <p className="text-xs text-gray-500">Proyectos activos</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Visualizaciones Avanzadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Burndown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Burndown Chart</CardTitle>
                <CardDescription>Progreso del sprint actual vs. ideal</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={burndownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="ideal" stroke="#94a3b8" fill="#cbd5e1" name="Ideal" />
                    <Area type="monotone" dataKey="real" stroke="#3b82f6" fill="#93c5fd" name="Real" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Velocity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Velocidad del Equipo</CardTitle>
                <CardDescription>Tareas completadas vs. planificadas por sprint</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planificadas" fill="#94a3b8" name="Planificadas" />
                    <Bar dataKey="completadas" fill="#10b981" name="Completadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Productividad por Miembro */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Productividad por Miembro</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {memberProductivity.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{member.name}</p>
                            {getTrendIcon(member.trend)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{member.tasksCompleted} completadas</span>
                            <span>•</span>
                            <span>{member.tasksInProgress} en progreso</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{member.productivity}%</div>
                          <p className="text-xs text-gray-500">Productividad</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Analytics with New Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Análisis por Proyecto</h2>
            {projectAnalytics.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay datos de proyectos
                  </h3>
                  <p className="text-gray-500">
                    Crea algunos proyectos para ver las analíticas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projectAnalytics.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {project.methodology}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={getProgressColor(project.progress)}
                        >
                          {project.progress}% completo
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.onTimeCompletionRate}% a tiempo
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progreso General</span>
                          <span>{project.completedTasks}/{project.totalTasks}</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Task Distribution */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {project.completedTasks}
                          </div>
                          <div className="text-xs text-gray-500">Completadas</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-blue-600">
                            {project.inProgressTasks}
                          </div>
                          <div className="text-xs text-gray-500">En Progreso</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-600">
                            {project.pendingTasks}
                          </div>
                          <div className="text-xs text-gray-500">Pendientes</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-600">
                            {project.blockedTasks}
                          </div>
                          <div className="text-xs text-gray-500">Bloqueadas</div>
                        </div>
                      </div>

                      {/* New Metrics */}
                      <div className="pt-4 border-t space-y-3">
                        {/* Blocked Tasks % */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            % de Bloqueos
                          </span>
                          <span className="text-sm font-medium text-red-600">
                            {Math.floor((project.blockedTasks! / project.totalTasks) * 100)}%
                          </span>
                        </div>

                        {/* Estimated vs Actual Hours */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Horas estimadas vs reales
                          </span>
                          <span className="text-sm font-medium">
                            {project.estimatedHours}h / {project.actualHours}h
                          </span>
                        </div>

                        {/* On-time Completion Rate */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Target className="h-4 w-4 text-green-500" />
                            Cumplimiento de fechas
                          </span>
                          <span className={`text-sm font-medium ${project.onTimeCompletionRate! > 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {project.onTimeCompletionRate}%
                          </span>
                        </div>

                        {/* Team Members */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Miembros del equipo
                          </span>
                          <span className="text-sm font-medium">
                            {project.teamMembersCount}
                          </span>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="pt-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver proyecto completo →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </MainLayout>
  )
}
