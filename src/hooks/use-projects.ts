'use client'

import { useState, useEffect } from 'react'

export interface Project {
  id: number
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
  organizationId: number
  spaceId: number | null
  totalTasks: number
  completedTasks: number
  progress: number
  _count: {
    tasks: number
    members: number
    sprints: number
    epics: number
  }
  space?: {
    id: number
    name: string
    color: string
    icon: string
    isPublic: boolean
  }
}

export function useProjects(spaceId?: number) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const url = spaceId
        ? `/api/projects?spaceId=${spaceId}`
        : '/api/projects'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async (data: {
    name: string
    description?: string
    spaceId: number
  }) => {
    try {
      setError(null)

      const response = await fetch(`/api/spaces/${data.spaceId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const newProject = await response.json()
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshProjects = () => {
    fetchProjects()
  }

  useEffect(() => {
    fetchProjects()

    // Cleanup function to prevent unnecessary refetches
    return () => {
      // Cleanup if needed
    }
  }, [spaceId]) // spaceId is properly in dependency array

  return {
    projects,
    isLoading,
    error,
    createProject,
    refreshProjects,
  }
}