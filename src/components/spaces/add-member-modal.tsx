'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { SpaceMember } from '@/types'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, Shield, Loader2, Eye, Trash2 } from 'lucide-react'

interface User {
  id: string
  name?: string
  email: string
}

interface AddMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberAdded: (member: SpaceMember) => void
  spaceName: string
  spaceId: string
  existingMembers?: SpaceMember[]
}

export function AddMemberModal({ open, onOpenChange, onMemberAdded, spaceName, spaceId, existingMembers = [] }: AddMemberModalProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  const handleUserChange = (value: string) => {
    console.log('Usuario seleccionado:', value)
    setSelectedUser(value)
  }

  // Filter out users who are already members
  const filteredUsers = availableUsers.filter(user => {
    const existingMemberIds = existingMembers.map(m => m.userId.toString())
    return !existingMemberIds.includes(user.id)
  })

  // Helper function to get user display text
  const getUserDisplayText = (user: User) => {
    if (user.name) {
      return `${user.name} (${user.email})`
    }
    return user.email
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este miembro del espacio?')) {
      return
    }

    try {
      setRemovingMemberId(memberId)
      const response = await fetch(`/api/spaces/${spaceId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }

      toast.success('Miembro eliminado exitosamente')
      // Refresh the page or update parent component
      window.location.reload()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Error al eliminar miembro')
    } finally {
      setRemovingMemberId(null)
    }
  }

  useEffect(() => {
    if (open) {
      fetchAvailableUsers()
    }
  }, [open])

  const fetchAvailableUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const users = await response.json()
        console.log('Usuarios cargados:', users)
        setAvailableUsers(users)
      } else {
        console.error('Error al cargar usuarios:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/spaces/${spaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }

      const newMember = await response.json()
      onMemberAdded(newMember)

      // Reset form
      setSelectedUser('')
      setSelectedRole('MEMBER')
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding member:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedUser('')
    setSelectedRole('MEMBER')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Agregar Miembro a {spaceName}
          </DialogTitle>
          <DialogDescription>
            Agrega un miembro existente a este espacio. Tendrá acceso a todos los proyectos dentro de este espacio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Current Members Section */}
            {existingMembers.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <Label className="text-sm font-medium mb-3 block">
                  Miembros Actuales ({existingMembers.length})
                </Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {existingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-white border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {member.user.name || member.user.email}
                          </p>
                          {member.user.name && (
                            <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={member.role === 'ADMIN' || member.role === 'OWNER' ? 'default' : member.role === 'VIEWER' ? 'outline' : 'secondary'} className="text-xs">
                          {member.role === 'OWNER' ? 'Owner' : member.role === 'ADMIN' ? 'Admin' : member.role === 'VIEWER' ? 'Invitado' : 'Miembro'}
                        </Badge>
                        {member.role !== 'OWNER' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingMemberId === member.id}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {removingMemberId === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Selection */}
            <div className="grid gap-2">
              <Label>Seleccionar Usuario *</Label>
              <Select value={selectedUser} onValueChange={handleUserChange} disabled={isLoading || isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {availableUsers.length === 0
                        ? 'No hay usuarios disponibles'
                        : 'Todos los usuarios ya son miembros de este espacio'
                      }
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{user.name || user.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Role Selection */}
            <div className="grid gap-2">
              <Label>Rol *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>Miembro</span>
                        <span className="text-xs text-gray-500">Puede ver y contribuir a proyectos</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>Admin</span>
                        <span className="text-xs text-gray-500">Acceso completo a configuración del espacio</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedUser && (() => {
              const user = filteredUsers.find(u => u.id === selectedUser)
              return user ? (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <Label className="text-sm font-medium">Vista Previa:</Label>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-xs">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-gray-500">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={selectedRole === 'ADMIN' ? 'default' : 'secondary'}>
                      {selectedRole === 'ADMIN' ? 'Admin' : selectedRole === 'VIEWER' ? 'Invitado' : 'Miembro'}
                    </Badge>
                  </div>
                </div>
              ) : null
            })()}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUser}
            >
              {isSubmitting ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4 animate-pulse" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar Miembro
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}