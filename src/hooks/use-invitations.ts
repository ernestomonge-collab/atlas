'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRole, InvitationStatus } from '@prisma/client'
import { MOCK_INVITATIONS, MOCK_USER } from '@/lib/mock-data'

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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 700))

      // Use mock data with added properties
      const data = MOCK_INVITATIONS.map(invitation => ({
        ...invitation,
        invitedById: MOCK_USER.id,
        invitedBy: {
          id: MOCK_USER.id,
          name: MOCK_USER.name,
          email: MOCK_USER.email
        },
        updatedAt: invitation.createdAt,
        invitationUrl: `http://localhost:3030/invitations/accept/${invitation.token}`
      }))

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

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create new invitation with mock data
      const newInvitation = {
        id: `inv-${Date.now()}`,
        email: data.email,
        role: data.role || 'MEMBER' as UserRole,
        status: 'PENDING' as InvitationStatus,
        token: Math.random().toString(36).substr(2, 9),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        organizationId: 'org-1',
        invitedById: MOCK_USER.id,
        invitedBy: {
          id: MOCK_USER.id,
          name: MOCK_USER.name,
          email: MOCK_USER.email
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        invitationUrl: `http://localhost:3030/invitations/accept/${Math.random().toString(36).substr(2, 9)}`
      }

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