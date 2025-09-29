'use client'

import { useState, useEffect } from 'react'
import { MOCK_PROJECTS } from '@/lib/mock-data'

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
  _count: {
    tasks: number
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      // Simulate API call delay for realistic demo
      await new Promise(resolve => setTimeout(resolve, 800))

      // Use mock data instead of API call
      const data = MOCK_PROJECTS.map(project => ({
        ...project,
        _count: { tasks: project.totalTasks }
      }))
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async (data: { name: string; description?: string }) => {
    try {
      setError(null)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Create new project with mock data structure
      const newProject = {
        id: `project-${Date.now()}`,
        name: data.name,
        description: data.description,
        organizationId: 'org-1',
        totalTasks: 0,
        completedTasks: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { tasks: 0 }
      }

      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshProjects = () => {
    setIsLoading(true)
    fetchProjects()
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    isLoading,
    error,
    createProject,
    refreshProjects,
  }
}