'use client'

import { useState, useEffect } from 'react'

export interface Space {
  id: number
  name: string
  description?: string | null
  color: string
  icon: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  organizationId: number
  members?: Array<{
    id: number
    userId: number
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
    user: {
      id: number
      name?: string | null
      email: string
    }
  }>
  _count?: {
    projects: number
    members: number
  }
}

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSpaces = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/spaces')

      if (!response.ok) {
        throw new Error('Failed to fetch spaces')
      }

      const data = await response.json()
      setSpaces(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching spaces:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createSpace = async (data: {
    name: string
    description?: string
    color?: string
    icon?: string
  }) => {
    try {
      setError(null)

      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create space')
      }

      const newSpace = await response.json()
      setSpaces(prev => [newSpace, ...prev])
      return newSpace
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshSpaces = () => {
    fetchSpaces()
  }

  useEffect(() => {
    fetchSpaces()
  }, [])

  return {
    spaces,
    isLoading,
    error,
    createSpace,
    refreshSpaces,
  }
}
