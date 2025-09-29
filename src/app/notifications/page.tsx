'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import { Notification } from '@/types'
import { useNotifications } from '@/hooks/use-notifications'
import {
  Building2,
  Users,
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { NotificationType } from '@prisma/client'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

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

  const getNotificationIcon = (type: NotificationType) => {
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
        return <Info className="h-5 w-5 text-purple-600" />
      case 'PROJECT_UPDATED':
        return <Info className="h-5 w-5 text-indigo-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBgColor = (type: NotificationType) => {
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
    if (notification.task) {
      return `/projects/${notification.project?.id || 'unknown'}/tasks/${notification.task.id}`
    }
    if (notification.project) {
      return `/projects/${notification.project.id}`
    }
    return '#'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
  }

  return (
    <MainLayout
      title="Notificaciones"
      description="Gestiona tus notificaciones"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Todas las Notificaciones</h2>
            <p className="text-gray-600">
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                : 'Todas las notificaciones están marcadas como leídas'
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando notificaciones...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay notificaciones
              </h3>
              <p className="text-gray-500">
                Cuando recibas notificaciones, aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-l-4 ${getNotificationBgColor(notification.type)} ${
                  !notification.isRead ? 'shadow-md' : 'opacity-75'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {notification.title}
                            {!notification.isRead && (
                              <Badge variant="secondary" className="ml-2">
                                Nueva
                              </Badge>
                            )}
                          </h3>
                          <p className="text-gray-700 mb-3">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              {formatDate(notification.createdAt)}
                            </p>
                            {(notification.task || notification.project) && (
                              <Link
                                href={getNotificationLink(notification as unknown as Notification)}
                                onClick={() => handleNotificationClick(notification as unknown as Notification)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Ver detalles →
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-auto p-2"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-auto p-2 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}