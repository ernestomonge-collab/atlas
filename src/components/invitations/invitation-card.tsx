'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Building2, Layers, FolderKanban, Clock, CheckCircle, XCircle, User } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'

interface InvitationCardProps {
  invitation: {
    id: number
    email: string
    type: 'ORGANIZATION' | 'SPACE' | 'PROJECT'
    role: string
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
    createdAt: string
    expiresAt: string | null
    invitedBy: {
      id: string
      name: string | null
      email: string
    }
    organization: {
      id: number
      name: string
    }
    space?: {
      id: number
      name: string
      color: string
    } | null
    project?: {
      id: number
      name: string
    } | null
  }
  onAccept: (invitationId: number) => Promise<void>
  onDecline: (invitationId: number) => Promise<void>
}

export function InvitationCard({ invitation, onAccept, onDecline }: InvitationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const getInvitationIcon = () => {
    switch (invitation.type) {
      case 'ORGANIZATION':
        return <Building2 className="h-5 w-5" />
      case 'SPACE':
        return <Layers className="h-5 w-5" style={{ color: invitation.space?.color }} />
      case 'PROJECT':
        return <FolderKanban className="h-5 w-5" />
    }
  }

  const getInvitationTitle = () => {
    switch (invitation.type) {
      case 'ORGANIZATION':
        return `Invitación a ${invitation.organization.name}`
      case 'SPACE':
        return `Invitación al espacio ${invitation.space?.name}`
      case 'PROJECT':
        return `Invitación al proyecto ${invitation.project?.name}`
    }
  }

  const getStatusBadge = () => {
    switch (invitation.status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )
      case 'ACCEPTED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aceptada
          </Badge>
        )
      case 'DECLINED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazada
          </Badge>
        )
    }
  }

  const isExpired = invitation.expiresAt && new Date(invitation.expiresAt) < new Date()

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      await onAccept(invitation.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    setIsProcessing(true)
    try {
      await onDecline(invitation.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${isExpired ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-blue-50">
              {getInvitationIcon()}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{getInvitationTitle()}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3" />
                Invitado por {invitation.invitedBy.name || invitation.invitedBy.email}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Invitation Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Rol:</span>
              <span className="ml-2 font-medium">{invitation.role}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{invitation.email}</span>
            </div>
            <div>
              <span className="text-gray-500">Enviada:</span>
              <span className="ml-2">
                {format(new Date(invitation.createdAt), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
            {invitation.expiresAt && (
              <div>
                <span className="text-gray-500">Expira:</span>
                <span className={`ml-2 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                  {format(new Date(invitation.expiresAt), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {invitation.status === 'PENDING' && !isExpired && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceptar
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </div>
          )}

          {isExpired && invitation.status === 'PENDING' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              Esta invitación ha expirado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
