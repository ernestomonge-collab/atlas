'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Shield, User, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@prisma/client'

const editUserSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'READ_ONLY']),
})

type EditUserInput = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string | null
    email: string
    role: UserRole
  } | null
  onUserUpdated: () => void
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
  onUserUpdated
}: EditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      role: user?.role || 'MEMBER',
    },
  })

  const selectedRole = watch('role')

  // Update form when user changes
  useState(() => {
    if (user) {
      setValue('role', user.role)
    }
  })

  const onSubmit = async (data: EditUserInput) => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar usuario')
      }

      toast.success('Rol de usuario actualizado exitosamente')
      onUserUpdated()
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setError(null)
    onOpenChange(false)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'MEMBER': return 'Miembro'
      case 'READ_ONLY': return 'Solo lectura'
      default: return role
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Cambia el rol de {user.name || user.email} en la organización
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* User Info */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{user.name || 'Sin nombre'}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Rol en la Organización</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value as 'ADMIN' | 'MEMBER' | 'READ_ONLY')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Administrador</div>
                      <div className="text-xs text-gray-500">Acceso completo a toda la organización</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="MEMBER">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Miembro</div>
                      <div className="text-xs text-gray-500">Puede crear y gestionar proyectos</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Current vs New Role Comparison */}
          {user.role !== selectedRole && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Cambio:</strong> {getRoleLabel(user.role)} → {getRoleLabel(selectedRole)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || user.role === selectedRole}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
