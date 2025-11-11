'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { MainLayout } from '@/components/layout/main-layout'
import {
  Bell,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink,
  MoreVertical,
  Settings,
  Filter,
} from 'lucide-react'

interface Notification {
  id: number
  userId: number
  title: string
  message: string | null
  type: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'none' | 'type'>('none')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'comments' | 'system'>('all')
  const [digestEnabled, setDigestEnabled] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        )
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.filter(n => n.id !== notificationId)
        )
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'TASK_ASSIGNED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'TASK_UPDATED':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'COMMENT_ADDED':
        return <MessageSquare className="h-5 w-5 text-purple-600" />
      case 'PROJECT_UPDATED':
        return <Info className="h-5 w-5 text-indigo-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'bg-green-50 border-l-green-500'
      case 'WARNING':
        return 'bg-yellow-50 border-l-yellow-500'
      case 'ERROR':
        return 'bg-red-50 border-l-red-500'
      case 'TASK_ASSIGNED':
        return 'bg-blue-50 border-l-blue-500'
      case 'TASK_UPDATED':
        return 'bg-blue-50 border-l-blue-500'
      case 'COMMENT_ADDED':
        return 'bg-purple-50 border-l-purple-500'
      case 'PROJECT_UPDATED':
        return 'bg-indigo-50 border-l-indigo-500'
      default:
        return 'bg-gray-50 border-l-gray-500'
    }
  }

  const getNotificationLink = (notification: Notification) => {
    return notification.link || '#'
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`
    }
    if (hours < 24) {
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`
    }

    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    // Filter by type
    if (filterType === 'unread' && n.isRead) return false
    if (filterType === 'comments' && n.type !== 'COMMENT_ADDED') return false
    if (filterType === 'system' && !['SUCCESS', 'WARNING', 'ERROR', 'INFO'].includes(n.type)) return false

    return true
  })

  // Group notifications
  const groupedNotifications = () => {
    if (groupBy === 'none') {
      return { 'all': filteredNotifications }
    }

    if (groupBy === 'type') {
      const groups: Record<string, Notification[]> = {}
      const typeNames: Record<string, string> = {
        'TASK_ASSIGNED': 'Tareas Asignadas',
        'TASK_UPDATED': 'Tareas Actualizadas',
        'COMMENT_ADDED': 'Comentarios',
        'PROJECT_UPDATED': 'Proyectos',
        'SUCCESS': 'Éxito',
        'WARNING': 'Advertencias',
        'ERROR': 'Errores',
        'INFO': 'Información'
      }

      filteredNotifications.forEach(n => {
        const key = typeNames[n.type] || 'Otros'
        if (!groups[key]) groups[key] = []
        groups[key].push(n)
      })
      return groups
    }

    return { 'all': filteredNotifications }
  }

  const groups = groupedNotifications()

  const renderNotification = (notification: Notification) => (
    <Card
      key={notification.id}
      className={`border-l-4 ${getNotificationBgColor(notification.type)} ${
        !notification.isRead ? 'shadow-md' : 'opacity-75'
      } hover:shadow-lg transition-shadow`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <Badge variant="secondary" className="text-xs">
                      Nueva
                    </Badge>
                  )}
                </div>

                {notification.message && (
                  <p className="text-sm text-gray-700 mb-2">
                    {notification.message}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{formatDate(notification.createdAt)}</span>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {notification.link && (
                    <Link href={notification.link}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver detalles
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.isRead && (
                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como leída
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <MainLayout
      title="Notificaciones"
      description="Gestiona tus notificaciones"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
            <p className="text-gray-600">
              {unreadCount > 0
                ? `${unreadCount} sin leer`
                : 'Todas leídas'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas leídas
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Preferencias</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="digest" className="text-sm font-medium">
                        Digest Diario
                      </Label>
                      <p className="text-xs text-gray-500">
                        Recibe un resumen por email
                      </p>
                    </div>
                    <Switch
                      id="digest"
                      checked={digestEnabled}
                      onCheckedChange={setDigestEnabled}
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters & Grouping */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                </div>
                <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)} className="flex-1">
                  <TabsList>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="unread">
                      No leídas {unreadCount > 0 && `(${unreadCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="comments">Comentarios</TabsTrigger>
                    <TabsTrigger value="system">Sistema</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Agrupar:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {groupBy === 'none' && 'Ninguno'}
                      {groupBy === 'type' && 'Por Tipo'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setGroupBy('none')}>
                      Ninguno
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGroupBy('type')}>
                      Por Tipo de Evento
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando notificaciones...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-500">
                {filterType !== 'all'
                  ? 'Cambia el filtro para ver más notificaciones'
                  : 'Cuando recibas notificaciones, aparecerán aquí.'
                }
              </p>
            </CardContent>
          </Card>
        ) : groupBy === 'none' ? (
          <div className="space-y-3">
            {filteredNotifications.map(renderNotification)}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([groupName, groupNotifications]) => (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                  <Badge variant="secondary">{groupNotifications.length}</Badge>
                </div>
                <div className="space-y-3">
                  {groupNotifications.map(renderNotification)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
