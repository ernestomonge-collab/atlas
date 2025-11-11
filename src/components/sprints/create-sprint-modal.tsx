'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar, Target, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Sprint {
  id: number
  name: string
  goal?: string | null
  startDate: string
  endDate: string
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED'
}

interface CreateSprintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number
  onSprintCreated: () => void
  sprint?: Sprint | null // Optional sprint for editing
}

export function CreateSprintModal({ open, onOpenChange, projectId, onSprintCreated, sprint }: CreateSprintModalProps) {
  const isEditing = !!sprint

  const [formData, setFormData] = useState({
    name: sprint?.name || '',
    goal: sprint?.goal || '',
    startDate: sprint?.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
    endDate: sprint?.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
    status: (sprint?.status || 'PLANNING') as 'PLANNING' | 'ACTIVE' | 'COMPLETED'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form data when sprint prop changes
  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        goal: sprint.goal || '',
        startDate: new Date(sprint.startDate).toISOString().split('T')[0],
        endDate: new Date(sprint.endDate).toISOString().split('T')[0],
        status: sprint.status
      })
    } else {
      setFormData({
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        status: 'PLANNING'
      })
    }
  }, [sprint])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    setIsSubmitting(true)

    try {
      const url = isEditing
        ? `/api/sprints/${sprint.id}`
        : `/api/projects/${projectId}/sprints`

      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          goal: formData.goal || null,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          status: formData.status
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el sprint`)
      }

      // Reset form
      setFormData({
        name: '',
        goal: '',
        startDate: '',
        endDate: '',
        status: 'PLANNING'
      })

      toast.success(`Sprint ${isEditing ? 'actualizado' : 'creado'} exitosamente`)
      onSprintCreated()
      onOpenChange(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error al ${isEditing ? 'actualizar' : 'crear'} el sprint`
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {isEditing ? 'Editar Sprint' : 'Crear Nuevo Sprint'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la información del sprint'
              : 'Crea un nuevo sprint para organizar y planificar las tareas de tu proyecto'}
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
              <Label htmlFor="name">Nombre del Sprint *</Label>
              <Input
                id="name"
                placeholder="ej. Sprint 1, Sprint Q1 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="goal">Objetivo del Sprint</Label>
              <Textarea
                id="goal"
                placeholder="¿Qué objetivo quieres lograr en este sprint?"
                rows={3}
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="startDate"
                    type="date"
                    className="pl-10"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Fecha de Fin *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="endDate"
                    type="date"
                    className="pl-10"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Estado Inicial</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planificación</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                </SelectContent>
              </Select>
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
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  {isEditing ? 'Actualizar Sprint' : 'Crear Sprint'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
