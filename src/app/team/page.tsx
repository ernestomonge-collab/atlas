'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InviteUserModal } from '@/components/team/invite-user-modal'
import { MainLayout } from '@/components/layout/main-layout'
import { useInvitations } from '@/hooks/use-invitations'
import { MOCK_TEAM_MEMBERS } from '@/lib/mock-data'
import { UserPlus, Users, Mail, Clock, CheckCircle, XCircle, Building2 } from 'lucide-react'
import { UserRole, InvitationStatus } from '@prisma/client'
import { User } from '@/types'

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { invitations, isLoading, refreshInvitations } = useInvitations()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [membersLoading, setMembersLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchTeamMembers()
    }
  }, [session])

  const fetchTeamMembers = async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600))

      // Use mock team members data
      setTeamMembers(MOCK_TEAM_MEMBERS)
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user.role === 'ADMIN'

  const handleUserInvited = () => {
    refreshInvitations()
  }

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'DECLINED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-3 w-3" />
      case 'ACCEPTED': return <CheckCircle className="h-3 w-3" />
      case 'DECLINED': return <XCircle className="h-3 w-3" />
      case 'EXPIRED': return <XCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'MEMBER': return 'Miembro'
      case 'READ_ONLY': return 'Solo lectura'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'MEMBER': return 'bg-blue-100 text-blue-800'
      case 'READ_ONLY': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING')
  const totalMembers = teamMembers.length
  const activeInvitations = pendingInvitations.length

  return (
    <MainLayout
      title="Gestión de Equipo"
      description="Administra miembros e invitaciones"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Miembros del Equipo</h2>
          <p className="text-gray-600">Gestiona usuarios e invitaciones de tu organización</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar Miembro
          </Button>
        )}
      </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Miembros Totales
              </CardTitle>
              <Users className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
              <p className="text-xs text-gray-500">Miembros activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Invitaciones Pendientes
              </CardTitle>
              <Mail className="h-4 w-4 ml-auto text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeInvitations}</div>
              <p className="text-xs text-gray-500">Esperando respuesta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Invitaciones
              </CardTitle>
              <Building2 className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invitations.length}</div>
              <p className="text-xs text-gray-500">Todas las invitaciones</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Miembros del Equipo</CardTitle>
              <CardDescription>
                {totalMembers > 0
                  ? `${totalMembers} miembro${totalMembers !== 1 ? 's' : ''} en tu organización`
                  : 'No hay miembros en tu organización'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando miembros...</p>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay miembros
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Invita a personas para empezar a colaborar.
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invitar Primer Miembro
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(member.name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invitations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invitaciones</CardTitle>
                  <CardDescription>
                    {invitations.length > 0
                      ? `${invitations.length} invitación${invitations.length !== 1 ? 'es' : ''} enviada${invitations.length !== 1 ? 's' : ''}`
                      : 'No hay invitaciones enviadas'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando invitaciones...</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay invitaciones
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Las invitaciones enviadas aparecerán aquí.
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enviar Primera Invitación
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleBadgeColor(invitation.role)} variant="secondary">
                            {getRoleLabel(invitation.role)}
                          </Badge>
                          <Badge className={getStatusColor(invitation.status)} variant="secondary">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(invitation.status)}
                              {invitation.status.toLowerCase()}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enviada el {new Date(invitation.createdAt).toLocaleDateString()}
                          {invitation.status === 'PENDING' && (
                            <> • Expira el {new Date(invitation.expiresAt).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {isAdmin && (
        <InviteUserModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          onUserInvited={handleUserInvited}
        />
      )}
    </MainLayout>
  )
}