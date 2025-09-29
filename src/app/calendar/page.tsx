'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import { getMockTasksForCalendar, MOCK_USER } from '@/lib/mock-data'
import { CalendarTask } from '@/types'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Filter
} from 'lucide-react'


export default function CalendarPage() {
  // Use mock user for demo
  const session = { user: MOCK_USER }
  const router = useRouter()
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar')
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    project: 'all'
  })

  // Remove auth redirect - using mock data

  useEffect(() => {
    fetchCalendarData()
  }, [])

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const calendarTasks = getMockTasksForCalendar()
      setTasks(calendarTasks as CalendarTask[])
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Remove auth check - using mock data

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    })
  }

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return getFilteredTasks().filter(task => task.dueDate.startsWith(dateString))
  }

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filters.status !== 'all' && task.status !== filters.status) return false
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false
      if (filters.project !== 'all' && task.projectName !== filters.project) return false
      return true
    })
  }

  const getUniqueProjects = () => {
    return [...new Set(tasks.map(task => task.projectName))]
  }

  const handleNewTask = () => {
    console.log('Creating new task...')
    setShowNewTaskModal(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'border-l-red-500'
      case 'MEDIUM': return 'border-l-yellow-500'
      case 'LOW': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const today = new Date()

  const isToday = (day: number) => {
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return selectedDate.getFullYear() === currentDate.getFullYear() &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getDate() === day
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : []
  const filteredTasks = getFilteredTasks()
  const uniqueProjects = getUniqueProjects()

  return (
    <MainLayout
      title="Calendar"
      description="Visualiza y gestiona tareas por fechas"
    >
      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completadas</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Prioridad</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="all">Todas</option>
                  <option value="HIGH">Alta</option>
                  <option value="MEDIUM">Media</option>
                  <option value="LOW">Baja</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Proyecto</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.project}
                  onChange={(e) => setFilters({...filters, project: e.target.value})}
                >
                  <option value="all">Todos</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar/Agenda View */}
        <div className="lg:col-span-2">
          {viewMode === 'calendar' ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {formatDate(currentDate)}
                    </CardTitle>
                    <CardDescription>
                      Haz clic en una fecha para ver las tareas programadas
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Hoy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="h-24 p-1"></div>
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const dayTasks = getTasksForDate(date)

                    return (
                      <div
                        key={day}
                        className={`
                          h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                          ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
                          ${isSelected(day) ? 'bg-blue-100 border-blue-300' : ''}
                        `}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, 2).map(task => (
                            <div
                              key={task.id}
                              className={`text-xs p-1 rounded border-l-2 bg-white ${getPriorityColor(task.priority)}`}
                              title={task.title}
                            >
                              <div className="truncate">{task.title}</div>
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayTasks.length - 2} más
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Agenda View */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Vista Agenda - {formatDate(currentDate)}
                    </CardTitle>
                    <CardDescription>
                      Lista cronológica de tareas del mes
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                      Hoy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay tareas para mostrar
                    </h3>
                    <p className="text-gray-500">
                      Ajusta los filtros o crea nuevas tareas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map((task) => {
                        const taskDate = new Date(task.dueDate)
                        const isOverdue = taskDate < today && task.status !== 'COMPLETED'
                        const isToday = taskDate.toDateString() === today.toDateString()

                        return (
                          <div key={task.id} className={`border-l-4 pl-4 py-3 rounded-r-lg ${
                            isOverdue ? 'bg-red-50 border-l-red-500' :
                            isToday ? 'bg-blue-50 border-l-blue-500' :
                            getPriorityColor(task.priority) + ' bg-white'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{task.title}</h4>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status === 'COMPLETED' ? 'Completada' :
                                     task.status === 'IN_PROGRESS' ? 'En Progreso' : 'Pendiente'}
                                  </Badge>
                                  {isOverdue && (
                                    <Badge variant="destructive">Vencida</Badge>
                                  )}
                                  {isToday && (
                                    <Badge variant="secondary">Hoy</Badge>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="font-medium">{task.projectName}</span>
                                  {task.assignee && (
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      <span>{task.assignee.name}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>
                                      {taskDate.toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Task Details Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? `Tareas para ${selectedDate.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}`
                  : 'Selecciona una fecha'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateTasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateTasks.map(task => (
                      <div key={task.id} className={`border-l-4 pl-3 py-2 ${getPriorityColor(task.priority)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status === 'COMPLETED' ? 'Completada' :
                             task.status === 'IN_PROGRESS' ? 'En Progreso' : 'Pendiente'}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{task.projectName}</span>
                          {task.assignee && (
                            <>
                              <Users className="h-3 w-3" />
                              <span>{task.assignee.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay tareas programadas para esta fecha
                  </p>
                )
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Haz clic en una fecha del calendario para ver las tareas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => setShowNewTaskModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setViewMode(viewMode === 'calendar' ? 'agenda' : 'calendar')}
              >
                <Clock className="mr-2 h-4 w-4" />
                {viewMode === 'calendar' ? 'Vista Agenda' : 'Vista Calendario'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total tareas</span>
                  <span className="font-medium">{filteredTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completadas</span>
                  <span className="font-medium text-green-600">
                    {filteredTasks.filter(t => t.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">En progreso</span>
                  <span className="font-medium text-blue-600">
                    {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pendientes</span>
                  <span className="font-medium text-gray-600">
                    {filteredTasks.filter(t => t.status === 'PENDING').length}
                  </span>
                </div>
                {filters.status !== 'all' || filters.priority !== 'all' || filters.project !== 'all' ? (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setFilters({status: 'all', priority: 'all', project: 'all'})}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nueva Tarea</h3>
            <p className="text-gray-600 mb-6">
              Funcionalidad de creación de tareas pendiente de implementar con base de datos.
              Por ahora, esta es una demostración del modal.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTaskModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleNewTask}>
                Simular Creación
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}