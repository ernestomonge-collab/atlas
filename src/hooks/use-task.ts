'use client'

import { useState, useEffect, useCallback } from 'react'
import { TaskStatus, TaskPriority } from '@prisma/client'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  projectId: string
  sprintId?: string
  assigneeId?: string
  createdById: string
  assignee?: {
    id: string
    name?: string
    email: string
  }
  createdBy: {
    id: string
    name?: string
    email: string
  }
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  assigneeId?: string
}

export function useTask(projectId: string, taskId: string) {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch task')
      }

      const data = await response.json()
      setTask(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, taskId])

  const updateTask = async (updates: UpdateTaskInput) => {
    try {
      setError(null)
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const updatedTask = await response.json()
      setTask(updatedTask)

      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteTask = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshTask = () => {
    setIsLoading(true)
    fetchTask()
  }

  useEffect(() => {
    if (projectId && taskId) {
      fetchTask()
    }
  }, [projectId, taskId, fetchTask])

  return {
    task,
    isLoading,
    error,
    updateTask,
    deleteTask,
    refreshTask,
  }
}