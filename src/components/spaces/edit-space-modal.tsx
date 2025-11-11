'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Space } from '@/types'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'
import { AlertTriangle } from 'lucide-react'

const editSpaceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  icon: z.string().min(1, 'Selecciona un ícono'),
  color: z.string().min(1, 'Selecciona un color'),
  isPublic: z.boolean(),
})

type EditSpaceFormData = z.infer<typeof editSpaceSchema>

interface EditSpaceModalProps {
  space: Space
  open: boolean
  onOpenChange: (open: boolean) => void
  onSpaceUpdated?: (updatedSpace: Space) => void
}

const iconOptions = [
  { value: 'Code', label: 'Código', icon: LucideIcons.Code },
  { value: 'Briefcase', label: 'Trabajo', icon: LucideIcons.Briefcase },
  { value: 'Folder', label: 'Carpeta', icon: LucideIcons.Folder },
  { value: 'Layers', label: 'Capas', icon: LucideIcons.Layers },
  { value: 'Target', label: 'Objetivo', icon: LucideIcons.Target },
  { value: 'Zap', label: 'Energía', icon: LucideIcons.Zap },
  { value: 'Users', label: 'Usuarios', icon: LucideIcons.Users },
  { value: 'Settings', label: 'Configuración', icon: LucideIcons.Settings },
]

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarillo' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Morado' },
  { value: '#06B6D4', label: 'Cian' },
  { value: '#F97316', label: 'Naranja' },
  { value: '#84CC16', label: 'Lima' },
]

export function EditSpaceModal({ space, open, onOpenChange, onSpaceUpdated }: EditSpaceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { confirm, ConfirmationDialog } = useConfirm()

  const form = useForm<EditSpaceFormData>({
    resolver: zodResolver(editSpaceSchema),
    defaultValues: {
      name: space.name,
      description: space.description || '',
      icon: space.icon,
      color: space.color,
      isPublic: space.isPublic ?? true,
    },
  })

  const onSubmit = async (data: EditSpaceFormData) => {
    // Check if converting from private to public
    if (!space.isPublic && data.isPublic) {
      const confirmed = await confirm({
        title: 'Convertir espacio a público',
        description: '⚠️ Al convertir este espacio a público, todos los miembros actuales (excepto el propietario) serán removidos automáticamente. El espacio será visible para toda la organización. ¿Deseas continuar?',
        confirmText: 'Sí, convertir a público',
        cancelText: 'Cancelar',
        variant: 'default'
      })

      if (!confirmed) {
        return
      }
    }

    setIsLoading(true)
    try {
      // Call API to update space
      const response = await fetch(`/api/spaces/${space.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          icon: data.icon,
          color: data.color,
          isPublic: data.isPublic,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update space')
      }

      const updatedSpace = await response.json()
      toast.success('Espacio actualizado exitosamente')
      onSpaceUpdated?.(updatedSpace)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error updating space:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el espacio')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedIcon = form.watch('icon')
  const selectedColor = form.watch('color')
  const SelectedIconComponent = LucideIcons[selectedIcon as keyof typeof LucideIcons] || LucideIcons.Folder

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar espacio</DialogTitle>
          <DialogDescription>
            Modifica la información del espacio. Los cambios se aplicarán inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Preview */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg bg-gray-50">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${selectedColor}20` }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {React.createElement(SelectedIconComponent as any, {
                    className: "h-6 w-6",
                    style: { color: selectedColor }
                  })}
                </div>
                <div>
                  <div className="font-medium">{form.watch('name') || 'Nombre del espacio'}</div>
                  <div className="text-sm text-gray-500">
                    {form.watch('description') || 'Descripción del espacio'}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del espacio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Desarrollo de productos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el propósito de este espacio..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Espacio Público</FormLabel>
                        <div className="text-sm text-gray-500">
                          {field.value
                            ? 'Visible para todos los miembros de la organización'
                            : 'Solo visible para miembros específicos del espacio'
                          }
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    {!space.isPublic && field.value && (
                      <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">
                          Al convertir a público, los miembros actuales (excepto el propietario) serán removidos.
                        </p>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícono</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un ícono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iconOptions.map((option) => {
                            const IconComponent = option.icon
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {React.createElement(IconComponent as any, { className: "h-4 w-4" })}
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: option.value }}
                                />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <ConfirmationDialog />
    </Dialog>
  )
}