'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MainLayout } from '@/components/layout/main-layout'
import { EditUserModal } from '@/components/team/edit-user-modal'
import { ChangePasswordModal } from '@/components/team/change-password-modal'
import { Users, MoreVertical, Edit, Lock, ShieldAlert } from 'lucide-react'
import { UserRole } from '@prisma/client'

interface TeamMember {
  id: string
  name: string | null
  email: string
  role: UserRole
  createdAt: string
}

export default function TeamPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/projects')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchTeamMembers()
    }
  }, [session])

  const fetchTeamMembers = async () => {
    setMembersLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const users = await response.json()
        setTeamMembers(users)
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  const handleEditUser = (member: TeamMember) => {
    setSelectedUser(member)
    setShowEditModal(true)
  }

  const handleChangePassword = (member: TeamMember) => {
    setSelectedUser(member)
    setShowPasswordModal(true)
  }

  const handleUserUpdated = () => {
    fetchTeamMembers()
  }

  // Check if current user is admin
  const isAdmin = session?.user?.role === 'ADMIN'

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Access denied for non-admin users
  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <MainLayout
        title="Acceso Denegado"
        description="No tienes permisos para acceder a esta página"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <ShieldAlert className="h-24 w-24 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 text-center mb-6">
            Solo los administradores pueden acceder a la gestión de equipo.
          </p>
          <Button onClick={() => router.push('/projects')}>
            Ir a Proyectos
          </Button>
        </div>
      </MainLayout>
    )
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

  const totalMembers = teamMembers.length

  return (
    <MainLayout
      title="Gestión de Equipo"
      description="Administra los miembros de tu organización"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Miembros del Equipo</h2>
        <p className="text-gray-600">Gestiona los usuarios de tu organización</p>
      </div>

      {/* Stats Card */}
      <div className="mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Miembros Totales
            </CardTitle>
            <Users className="h-4 w-4 ml-auto text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-gray-500">Miembros activos en la organización</p>
          </CardContent>
        </Card>
      </div>

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
              <p className="text-gray-500">
                Los usuarios registrados aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
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
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    {/* Only show actions if current user is admin and not editing themselves */}
                    {isAdmin && member.id !== session.user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(member)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Cambiar Rol
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangePassword(member)}>
                            <Lock className="mr-2 h-4 w-4" />
                            Cambiar Contraseña
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        user={selectedUser}
      />
    </MainLayout>
  )
}
