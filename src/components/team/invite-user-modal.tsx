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
import { UserRole } from '@prisma/client'
import { Loader2, UserPlus, Copy, Check } from 'lucide-react'

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
})

type InviteUserInput = z.infer<typeof inviteUserSchema>

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserInvited: (invitation: any) => void
}

export function InviteUserModal({
  open,
  onOpenChange,
  onUserInvited
}: InviteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationSent, setInvitationSent] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteUserInput>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      role: UserRole.MEMBER,
    },
  })

  const role = watch('role')

  const onSubmit = async (data: InviteUserInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      const invitation = await response.json()
      setInvitationSent(invitation)
      onUserInvited(invitation)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
      setInvitationSent(null)
      setCopied(false)
    }
    onOpenChange(newOpen)
  }

  const copyInvitationLink = async () => {
    if (invitationSent?.invitationUrl) {
      await navigator.clipboard.writeText(invitationSent.invitationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <DialogTitle>
              {invitationSent ? 'Invitación Enviada' : 'Invitar Miembro del Equipo'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {invitationSent
              ? 'La invitación ha sido creada. Comparte el enlace con el nuevo miembro.'
              : 'Invita a una nueva persona a unirse a tu organización.'
            }
          </DialogDescription>
        </DialogHeader>

        {invitationSent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Invitación enviada exitosamente
                </span>
              </div>
              <p className="text-sm text-green-700">
                Se ha enviado una invitación a <strong>{invitationSent.email}</strong> como{' '}
                <strong>{getRoleLabel(invitationSent.role)}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Enlace de invitación:</Label>
              <div className="flex gap-2">
                <Input
                  value={invitationSent.invitationUrl || ''}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyInvitationLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Este enlace expira en 7 días. Compártelo de forma segura con el nuevo miembro.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cerrar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setInvitationSent(null)
                  reset()
                }}
              >
                Enviar Otra Invitación
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Dirección de correo *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={role}
                onValueChange={(value) => setValue('role', value as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">
                    <div>
                      <div className="font-medium">Miembro</div>
                      <div className="text-xs text-gray-500">Puede crear y gestionar tareas</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div>
                      <div className="font-medium">Administrador</div>
                      <div className="text-xs text-gray-500">Acceso completo a la organización</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="READ_ONLY">
                    <div>
                      <div className="font-medium">Solo lectura</div>
                      <div className="text-xs text-gray-500">Solo puede ver proyectos y tareas</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Invitación'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}