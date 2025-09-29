'use client'

import { useState, useEffect } from 'react'
import { NotificationType } from '@prisma/client'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  task?: {
    id: string
    title: string
  }
  project?: {
    id: string
    name: string
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setIsLoading(true)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600))

      // Use mock data
      let data = [...MOCK_NOTIFICATIONS]

      if (unreadOnly) {
        data = data.filter(n => !n.isRead)
      }

      setNotifications(data)

      // Update unread count
      const unread = data.filter((n: Notification) => !n.isRead).length
      setUnreadCount(unread)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update local state immediately for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      )

      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const markAllAsRead = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 400))

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Update local state
      const notification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const refreshNotifications = () => {
    fetchNotifications()
  }

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  }
}