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
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

const addSubtaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'Título muy largo'),
  description: z.string().optional(),
})

type AddSubtaskInput = z.infer<typeof addSubtaskSchema>

interface AddSubtaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  taskTitle: string
  onSubtaskAdded: () => void
}

export function AddSubtaskModal({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  onSubtaskAdded
}: AddSubtaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddSubtaskInput>({
    resolver: zodResolver(addSubtaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const onSubmit = async (data: AddSubtaskInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          // Status will be set by the API to the first template state
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la subtarea')
      }

      toast.success('Subtarea creada exitosamente')
      onSubtaskAdded()
      handleOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error'
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            <DialogTitle>Agregar Subtarea</DialogTitle>
          </div>
          <DialogDescription>
            Crear una nueva subtarea para &quot;{taskTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título de la Subtarea *</Label>
            <Input
              id="title"
              placeholder="Ej: Configurar base de datos"
              {...register('title')}
              disabled={isLoading}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe los detalles de la subtarea (opcional)"
              rows={3}
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
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
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Subtarea
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
