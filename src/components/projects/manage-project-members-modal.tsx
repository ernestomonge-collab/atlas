'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, UserPlus, Users, Trash2, Crown, Shield, Eye, User, Mail } from 'lucide-react'
import { SendInvitationModal } from '@/components/invitations/send-invitation-modal'
import { toast } from 'sonner'

const addMemberSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
})

type AddMemberInput = z.infer<typeof addMemberSchema>

interface ProjectMember {
  id: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
  user: {
    id: string
    name?: string
    email: string
  }
}

interface User {
  id: string
  name?: string
  email: string
}

interface ManageProjectMembersModalProps {
  projectId: string
  projectName: string
  spaceId: number | null
  isSpacePublic?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onMembersUpdated: () => void
}

export function ManageProjectMembersModal({
  projectId,
  projectName,
  spaceId,
  isSpacePublic = true,
  open,
  onOpenChange,
  onMembersUpdated
}: ManageProjectMembersModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  })

  const selectedUserId = watch('userId')
  const selectedRole = watch('role')

  useEffect(() => {
    if (open) {
      fetchProjectMembers()
      fetchAvailableUsers()
    }
  }, [open])

  const fetchProjectMembers = async () => {
    try {
      setMembersLoading(true)
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const members = await response.json()
        console.log('[DEBUG] Project members:', members)
        setProjectMembers(members)
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      // Logic for fetching users:
      // - Public spaces: Fetch all organization users (everyone can be added to projects)
      // - Private spaces: Fetch only space members (only members of the space can be added)
      const endpoint = spaceId && !isSpacePublic
        ? `/api/spaces/${spaceId}/members`
        : '/api/users'

      console.log('[DEBUG] Fetching users from:', endpoint)
      console.log('[DEBUG] Space ID:', spaceId)
      console.log('[DEBUG] Is Space Public:', isSpacePublic)

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        console.log('[DEBUG] Raw data from API:', data)

        // If fetching space members, extract user from member object
        // Space members endpoint returns: { id, role, user: { id, name, email } }
        // Users endpoint returns: { id, name, email }
        const users = spaceId && !isSpacePublic
          ? data.map((member: any) => member.user)
          : data

        console.log('[DEBUG] Extracted users:', users)
        setAvailableUsers(users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const onSubmit = async (data: AddMemberInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }

      toast.success('Miembro agregado al proyecto exitosamente')
      await fetchProjectMembers()
      reset()
      onMembersUpdated()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      toast.success('Miembro eliminado del proyecto exitosamente')
      await fetchProjectMembers()
      onMembersUpdated()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Error al eliminar miembro')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4" />
      case 'ADMIN': return <Shield className="h-4 w-4" />
      case 'MEMBER': return <User className="h-4 w-4" />
      case 'VIEWER': return <Eye className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Propietario'
      case 'ADMIN': return 'Administrador'
      case 'MEMBER': return 'Miembro'
      case 'VIEWER': return 'Visualizador'
      default: return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-100 text-purple-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'MEMBER': return 'bg-blue-100 text-blue-800'
      case 'VIEWER': return 'bg-gray-100 text-gray-800'
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

  // Filter available users (exclude those already in project)
  const usersToShow = availableUsers.filter(user =>
    !projectMembers.some(member => member.user.id === user.id)
  )

  console.log('[DEBUG] Available users:', availableUsers)
  console.log('[DEBUG] Project members:', projectMembers)
  console.log('[DEBUG] Users to show (filtered):', usersToShow)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <DialogTitle>Gestionar Miembros del Proyecto</DialogTitle>
          </div>
          <DialogDescription>
            Administra quién tiene acceso al proyecto &quot;{projectName}&quot; y sus permisos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Member Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agregar Miembro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="userId">Usuario</Label>
                    <Select
                      value={selectedUserId || ''}
                      onValueChange={(value) => setValue('userId', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersToShow.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            Todos los usuarios ya son miembros
                          </div>
                        ) : (
                          usersToShow.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name ? `${user.name} (${user.email})` : user.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.userId && (
                      <p className="text-sm text-red-600">{errors.userId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) => setValue('role', value as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER')}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Miembro</div>
                              <div className="text-xs text-gray-500">Crear y editar tareas</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Administrador</div>
                              <div className="text-xs text-gray-500">Gestionar proyecto y miembros</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="VIEWER">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Visualizador</div>
                              <div className="text-xs text-gray-500">Solo ver tareas</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || usersToShow.length === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Agregar Miembro
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Miembros Actuales ({projectMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-gray-500 mt-2">Cargando miembros...</p>
                </div>
              ) : projectMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay miembros asignados
                  </h3>
                  <p className="text-gray-500">
                    Agrega miembros para que puedan acceder a este proyecto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(member.user.name, member.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.user.name || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                          <p className="text-xs text-gray-500">
                            Se unió el {new Date(member.joinedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            <span>{getRoleLabel(member.role)}</span>
                          </div>
                        </Badge>
                        {member.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>

      {/* Send Invitation Modal */}
      <SendInvitationModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        type="PROJECT"
        targetId={parseInt(projectId)}
        targetName={projectName}
        onInvitationSent={() => {
          setShowInviteModal(false)
          // Could show a success message here
        }}
      />
    </Dialog>
  )
}