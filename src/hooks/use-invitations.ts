'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRole, InvitationStatus } from '@prisma/client'

export interface Invitation {
  id: string
  email: string
  role: UserRole
  status: InvitationStatus
  token: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  organizationId: string
  invitedById: string
  invitedBy: {
    id: string
    name?: string
    email: string
  }
  invitationUrl?: string
}

export interface InviteUserInput {
  email: string
  role?: UserRole
}

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch('/api/invitations')

      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const data = await response.json()
      setInvitations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const inviteUser = async (data: InviteUserInput) => {
    try {
      setError(null)

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invitation')
      }

      const newInvitation = await response.json()
      setInvitations(prev => [newInvitation, ...prev])
      return newInvitation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshInvitations = () => {
    setIsLoading(true)
    fetchInvitations()
  }

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  return {
    invitations,
    isLoading,
    error,
    inviteUser,
    refreshInvitations,
  }
}