'use client'

import { useState } from 'react'
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
import { Edit } from 'lucide-react'

const editProjectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
})

type EditProjectFormData = z.infer<typeof editProjectSchema>

interface Project {
  id: string
  name: string
  description?: string
  totalTasks: number
  completedTasks: number
  progress: number
}

interface EditProjectModalProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectUpdated?: (updatedProject: Project) => void
}

export function EditProjectModal({ project, open, onOpenChange, onProjectUpdated }: EditProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
    },
  })

  const onSubmit = async (data: EditProjectFormData) => {
    setIsLoading(true)
    try {
      // TODO: Implement API call to update project
      console.log('Updating project:', { ...project, ...data })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock updated project
      const updatedProject = { ...project, ...data }
      onProjectUpdated?.(updatedProject)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error updating project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Editar Proyecto
          </DialogTitle>
          <DialogDescription>
            Modifica la información del proyecto. Los cambios se aplicarán inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del proyecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Desarrollo E-commerce" {...field} />
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
                        placeholder="Describe el propósito y alcance del proyecto..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project stats preview */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-700 mb-2">Estadísticas del proyecto:</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{project.totalTasks}</div>
                    <div className="text-xs text-gray-500">Total tareas</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-600">{project.completedTasks}</div>
                    <div className="text-xs text-gray-500">Completadas</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-600">{project.progress}%</div>
                    <div className="text-xs text-gray-500">Progreso</div>
                  </div>
                </div>
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
    </Dialog>
  )
}