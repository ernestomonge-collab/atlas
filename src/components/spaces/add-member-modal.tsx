'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, Shield } from 'lucide-react'

interface AddMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberAdded: (member: any) => void
  spaceName: string
}

// Mock users available in the organization
const AVAILABLE_USERS = [
  {
    id: 'user-7',
    name: 'Patricia Sánchez',
    email: 'patricia.sanchez@empresa.com'
  },
  {
    id: 'user-8',
    name: 'Roberto Silva',
    email: 'roberto.silva@empresa.com'
  },
  {
    id: 'user-9',
    name: 'Carmen Torres',
    email: 'carmen.torres@empresa.com'
  },
  {
    id: 'user-10',
    name: 'Miguel Herrera',
    email: 'miguel.herrera@empresa.com'
  }
]

export function AddMemberModal({ open, onOpenChange, onMemberAdded, spaceName }: AddMemberModalProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const user = AVAILABLE_USERS.find(u => u.id === selectedUser)
      if (user) {
        const newMember = {
          id: `member-${Date.now()}`,
          userId: user.id,
          spaceId: 'current-space',
          role: selectedRole as 'ADMIN' | 'MEMBER',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: null
          },
          addedAt: new Date().toISOString()
        }

        onMemberAdded(newMember)
      }

      // Reset form
      setSelectedUser('')
      setSelectedRole('MEMBER')
      onOpenChange(false)

    } catch (error) {
      console.error('Error adding member:', error)
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
            {/* User Selection */}
            <div className="grid gap-2">
              <Label>Seleccionar Usuario *</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un usuario de tu organización" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_USERS.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
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
            {selectedUser && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <Label className="text-sm font-medium">Vista Previa:</Label>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
                        {AVAILABLE_USERS.find(u => u.id === selectedUser)?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {AVAILABLE_USERS.find(u => u.id === selectedUser)?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {AVAILABLE_USERS.find(u => u.id === selectedUser)?.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedRole === 'ADMIN' ? 'default' : 'secondary'}>
                    {selectedRole === 'ADMIN' ? 'Admin' : 'Miembro'}
                  </Badge>
                </div>
              </div>
            )}
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