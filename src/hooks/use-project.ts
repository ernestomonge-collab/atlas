'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  organizationId: string
  totalTasks: number
  completedTasks: number
  progress: number
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId, fetchProject])

  return {
    project,
    isLoading,
    error,
    refreshProject: fetchProject,
  }
}