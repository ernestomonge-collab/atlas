'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Mail, Loader2 } from 'lucide-react'

interface SendInvitationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'ORGANIZATION' | 'SPACE' | 'PROJECT'
  targetId?: number // spaceId or projectId
  targetName?: string // space name or project name
  onInvitationSent: () => void
}

export function SendInvitationModal({
  open,
  onOpenChange,
  type,
  targetId,
  targetName,
  onInvitationSent
}: SendInvitationModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !email.trim()) {
      setError('Por favor ingresa un email')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un email válido')
      return
    }

    setIsSubmitting(true)

    try {
      const body: any = {
        email: email.trim().toLowerCase(),
        type,
        role
      }

      if (type === 'SPACE' && targetId) {
        body.spaceId = targetId
      } else if (type === 'PROJECT' && targetId) {
        body.projectId = targetId
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar la invitación')
      }

      // Reset form
      setEmail('')
      setRole('MEMBER')

      onInvitationSent()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la invitación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'ORGANIZATION':
        return 'Invitar a la Organización'
      case 'SPACE':
        return `Invitar al Espacio${targetName ? `: ${targetName}` : ''}`
      case 'PROJECT':
        return `Invitar al Proyecto${targetName ? `: ${targetName}` : ''}`
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'ORGANIZATION':
        return 'Invita a un nuevo miembro a unirse a tu organización. Recibirán un email con un enlace para aceptar la invitación.'
      case 'SPACE':
        return 'Invita a un miembro a colaborar en este espacio. Tendrán acceso a todos los proyectos dentro del espacio.'
      case 'PROJECT':
        return 'Invita a un miembro a colaborar en este proyecto. Podrán ver y gestionar las tareas del proyecto.'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as 'ADMIN' | 'MEMBER')}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Miembro</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Los administradores pueden gestionar miembros e invitaciones
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
