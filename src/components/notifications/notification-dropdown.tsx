'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

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

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications on mount and setup polling
  useEffect(() => {
    // Initial fetch
    fetchNotifications()

    // Setup polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications()
    }, 30000) // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Refresh when dropdown opens (with loading indicator)
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(true)
    }
  }, [isOpen])

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
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
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'TASK_ASSIGNED':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'TASK_UPDATED':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'COMMENT_ADDED':
        return <Info className="h-4 w-4 text-purple-600" />
      case 'PROJECT_UPDATED':
        return <Info className="h-4 w-4 text-indigo-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }


  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return minutes <= 1 ? 'hace un momento' : `hace ${minutes}m`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `hace ${hours}h`
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24)
      return `hace ${days}d`
    } else {
      return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1"
            >
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Cargando notificaciones...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No hay notificaciones
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-0 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="w-full p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="h-auto p-1"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-auto p-1 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver detalles
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link
                href="/notifications"
                className="block w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                onClick={() => setIsOpen(false)}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}