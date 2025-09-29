'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MainLayout } from '@/components/layout/main-layout'
import { getMockTeamAnalytics, getMockProjectAnalytics } from '@/lib/mock-data'
import {
  Building2,
  Users,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Target
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

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics[]>([])
  const [teamAnalytics, setTeamAnalytics] = useState<TeamAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchAnalytics()
    }
  }, [session])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Use mock analytics data
      const projectsData = getMockProjectAnalytics()
      const teamData = getMockTeamAnalytics()

      setProjectAnalytics(projectsData)
      setTeamAnalytics(teamData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analíticas')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
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
            {/* Team Overview Stats */}
            {teamAnalytics && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen del Equipo</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
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
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
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
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
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
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
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

            {/* Project Analytics */}
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
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge
                            variant="secondary"
                            className={getProgressColor(project.progress)}
                          >
                            {project.progress}% completo
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
                        <div className="grid grid-cols-3 gap-4 text-center">
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
                        </div>

                        {/* Additional Metrics */}
                        <div className="pt-4 border-t space-y-2">
                          {project.overdueTasks > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-red-500" />
                                Tareas vencidas
                              </span>
                              <span className="text-sm font-medium text-red-600">
                                {project.overdueTasks}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Miembros del equipo
                            </span>
                            <span className="text-sm font-medium">
                              {project.teamMembersCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Actividad reciente
                            </span>
                            <span className="text-sm font-medium">
                              {project.recentActivity} esta semana
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