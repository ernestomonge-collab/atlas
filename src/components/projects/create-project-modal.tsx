'use client'

import { useState } from 'react'
import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { projectSchema, type ProjectInput } from '@/lib/validations'
import {
  ProjectStatus,
  DEFAULT_STATUSES,
  PROJECT_TYPES
} from '@/lib/project-config'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Building2, Users, Briefcase, UserCheck, Plus, Zap, Layers, GitBranch, Workflow, Settings, Palette, Trash2, GripVertical } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  organizationId: string
}

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: (project: Project) => void
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated
}: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProjectType, setSelectedProjectType] = useState<string>('General')
  const [customStatuses, setCustomStatuses] = useState<ProjectStatus[]>([])
  const [newStatusName, setNewStatusName] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('bg-gray-100 text-gray-800')

  const statusColorOptions = [
    { value: 'bg-gray-100 text-gray-800', label: 'Gris', color: 'bg-gray-100' },
    { value: 'bg-blue-100 text-blue-800', label: 'Azul', color: 'bg-blue-100' },
    { value: 'bg-green-100 text-green-800', label: 'Verde', color: 'bg-green-100' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarillo', color: 'bg-yellow-100' },
    { value: 'bg-red-100 text-red-800', label: 'Rojo', color: 'bg-red-100' },
    { value: 'bg-purple-100 text-purple-800', label: 'Morado', color: 'bg-purple-100' },
    { value: 'bg-orange-100 text-orange-800', label: 'Naranja', color: 'bg-orange-100' },
  ]

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
  })

  const selectedType = watch('type')
  const selectedTargetEntity = watch('targetEntity')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Lista de departamentos/áreas disponibles
  const departments = [
    'Desarrollo',
    'Diseño',
    'Marketing',
    'Ventas',
    'Recursos Humanos',
    'Finanzas',
    'Operaciones',
    'Soporte Técnico',
    'Calidad',
    'Investigación y Desarrollo'
  ]

  // Lista de clientes disponibles (esto podría venir de una API en el futuro)
  const clients = [
    'Empresa ABC S.A.',
    'Corporación XYZ',
    'Grupo Innovación',
    'Tecnologías del Futuro',
    'Soluciones Digitales Ltda.',
    'Consultoría Estratégica',
    'Desarrollo Sostenible S.A.',
    'Sistemas Avanzados'
  ]

  // Metodologías de proyecto disponibles
  const methodologies = [
    {
      value: 'SCRUM',
      label: 'Scrum',
      description: 'Framework ágil con sprints y ceremonias',
      icon: Zap
    },
    {
      value: 'KANBAN',
      label: 'Kanban',
      description: 'Flujo continuo con tablero visual',
      icon: Layers
    },
    {
      value: 'HYBRID',
      label: 'Híbrida',
      description: 'Combinación de metodologías ágiles',
      icon: GitBranch
    },
    {
      value: 'WATERFALL',
      label: 'Waterfall',
      description: 'Desarrollo secuencial tradicional',
      icon: Workflow
    },
    {
      value: 'OTHER',
      label: 'Otra',
      description: 'Metodología personalizada',
      icon: Settings
    }
  ]

  const onSubmit = async (data: ProjectInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const projectData = {
        ...data,
        projectType: selectedProjectType,
        customStatuses: customStatuses
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const project = await response.json()
      onProjectCreated(project)
      reset()
      setSelectedProjectType('General')
      setCustomStatuses([])
      setNewStatusName('')
      onOpenChange(false)
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
      setShowCustomInput(false)
      setSelectedProjectType('General')
      setCustomStatuses([])
      setNewStatusName('')
    }
    onOpenChange(newOpen)
  }

  // Initialize custom statuses when project type changes
  React.useEffect(() => {
    const defaultStatuses = DEFAULT_STATUSES[selectedProjectType] || DEFAULT_STATUSES['General']
    setCustomStatuses(defaultStatuses.map(status => ({ ...status })))
  }, [selectedProjectType])

  // Reset custom input when project type changes
  React.useEffect(() => {
    setShowCustomInput(false)
  }, [selectedType])

  const handleApplyTemplate = (templateName: string) => {
    const templateStatuses = DEFAULT_STATUSES[templateName]
    if (templateStatuses) {
      setCustomStatuses(templateStatuses.map(status => ({ ...status })))
    }
  }

  const handleAddStatus = () => {
    if (!newStatusName.trim()) return

    const newStatus: ProjectStatus = {
      id: `status-${Date.now()}`,
      name: newStatusName.trim(),
      color: newStatusColor,
      order: customStatuses.length
    }

    setCustomStatuses([...customStatuses, newStatus])
    setNewStatusName('')
  }

  const handleRemoveStatus = (statusId: string) => {
    setCustomStatuses(customStatuses.filter(s => s.id !== statusId))
  }

  const handleUpdateStatus = (statusId: string, updates: Partial<ProjectStatus>) => {
    setCustomStatuses(customStatuses.map(s =>
      s.id === statusId ? { ...s, ...updates } : s
    ))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <DialogTitle>Create New Project</DialogTitle>
          </div>
          <DialogDescription>
            Create a new project to organize your team&apos;s work and tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="states">Estados Personalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>


          <div className="space-y-2">
            <Label>Project Methodology *</Label>
            <Controller
              name="methodology"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project methodology" />
                  </SelectTrigger>
                  <SelectContent>
                    {methodologies.map((methodology) => (
                      <SelectItem key={methodology.value} value={methodology.value}>
                        <div className="flex items-center gap-2">
                          <methodology.icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{methodology.label}</span>
                            <span className="text-xs text-gray-500">{methodology.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.methodology && (
              <p className="text-sm text-red-600">{errors.methodology.message}</p>
            )}
          </div>

          {/* Conditional field based on project type */}
          {selectedType && selectedType !== 'INTERNAL' && (
            <div className="space-y-2">
              <Label>
                {selectedType === 'DEPARTMENT' ? 'Department/Area Name *' : 'Client Name *'}
              </Label>
              <Controller
                name="targetEntity"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowCustomInput(true)
                        field.onChange('')
                      } else {
                        setShowCustomInput(false)
                        field.onChange(value)
                      }
                    }}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedType === 'DEPARTMENT'
                          ? "Select department or area"
                          : "Select client"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedType === 'DEPARTMENT' ? (
                        <>
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{department}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span>Otro departamento...</span>
                            </div>
                          </SelectItem>
                        </>
                      ) : (
                        <>
                          {clients.map((client) => (
                            <SelectItem key={client} value={client}>
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{client}</span>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span>Otro cliente...</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {showCustomInput && (
                <Input
                  placeholder={
                    selectedType === 'DEPARTMENT'
                      ? "Escribir nombre del departamento"
                      : "Escribir nombre del cliente"
                  }
                  {...register('targetEntity')}
                  disabled={isLoading}
                />
              )}
              {errors.targetEntity && (
                <p className="text-sm text-red-600">{errors.targetEntity.message}</p>
              )}
            </div>
          )}

          {selectedType === 'INTERNAL' && (
            <div className="space-y-2">
              <Label htmlFor="internalUserId">Internal User (Optional)</Label>
              <Input
                id="internalUserId"
                placeholder="Enter user ID or leave empty"
                {...register('internalUserId')}
                disabled={isLoading}
              />
              {errors.internalUserId && (
                <p className="text-sm text-red-600">{errors.internalUserId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your project (optional)"
              rows={3}
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          </TabsContent>

          <TabsContent value="states" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plantillas de Estados</CardTitle>
                <DialogDescription>
                  Selecciona el tipo de proyecto para aplicar una plantilla de estados predefinida
                </DialogDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label>Tipo de proyecto:</Label>
                  <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => handleApplyTemplate(selectedProjectType)}
                    variant="outline"
                  >
                    Aplicar Plantilla
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Vista previa:</strong> {DEFAULT_STATUSES[selectedProjectType]?.map(s => s.name).join(' → ')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estados del Proyecto</CardTitle>
                <DialogDescription>
                  Personaliza los estados que usará este proyecto
                </DialogDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Statuses */}
                <div className="space-y-2">
                  {customStatuses.map((status, index) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{index + 1}.</span>
                        <Badge className={status.color}>
                          {status.name}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={status.color}
                          onValueChange={(value) => handleUpdateStatus(status.id, { color: value })}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusColorOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStatus(status.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Status */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Nombre del nuevo estado"
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                      <SelectTrigger className="w-[120px]">
                        <Palette className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusColorOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${option.color}`} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleAddStatus}
                      disabled={!newStatusName.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}