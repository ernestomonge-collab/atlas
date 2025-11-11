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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Epic, EpicStatus } from '@/types'
import { Loader2, Layers } from 'lucide-react'
import { toast } from 'sonner'

const epicSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  color: z.string().optional(),
})

type EpicInput = z.infer<typeof epicSchema>

interface CreateEpicModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEpicCreated: (epic: Epic) => void
}

const epicColors = [
  { value: '#8B5CF6', label: 'Morado', color: 'bg-purple-500' },
  { value: '#3B82F6', label: 'Azul', color: 'bg-blue-500' },
  { value: '#10B981', label: 'Verde', color: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amarillo', color: 'bg-yellow-500' },
  { value: '#EF4444', label: 'Rojo', color: 'bg-red-500' },
  { value: '#EC4899', label: 'Rosa', color: 'bg-pink-500' },
  { value: '#6366F1', label: 'Índigo', color: 'bg-indigo-500' },
]

export function CreateEpicModal({
  projectId,
  open,
  onOpenChange,
  onEpicCreated
}: CreateEpicModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EpicInput>({
    resolver: zodResolver(epicSchema),
    defaultValues: {
      color: '#8B5CF6',
    },
  })

  const color = watch('color')

  const onSubmit = async (data: EpicInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/epics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create epic')
      }

      const epic = await response.json()
      toast.success('Épica creada exitosamente')
      onEpicCreated(epic)
      reset()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            <DialogTitle>Crear Nueva Épica</DialogTitle>
          </div>
          <DialogDescription>
            Crea una épica para agrupar tareas relacionadas y rastrear objetivos de alto nivel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Épica *</Label>
            <Input
              id="name"
              placeholder="Ej: Sistema de Pagos, Migración a AWS..."
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el objetivo y alcance de esta épica..."
              rows={3}
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select
              value={color}
              onValueChange={(value) => setValue('color', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un color" />
              </SelectTrigger>
              <SelectContent>
                {epicColors.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${c.color}`} />
                      <span>{c.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
                  Creando...
                </>
              ) : (
                'Crear Épica'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
