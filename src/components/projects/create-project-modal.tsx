'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectTemplate } from '@/types'
import { Loader2, Building2, Calendar, Plus, Trash2, Folder } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

interface Space {
  id: number
  name: string
  description?: string
  color?: string
  icon?: string
  templateId?: number | null
}

interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  order: number
}

interface Project {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  sprints?: Sprint[]
  createdAt: string
  updatedAt: string
  organizationId: string
}

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: (project: Project) => void
  spaceId?: number // Optional spaceId, pre-selects the space
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
  spaceId
}: CreateProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaceId?.toString() || '')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sprintDuration, setSprintDuration] = useState('2') // weeks
  const [sprints, setSprints] = useState<Sprint[]>([])

  // Fetch templates and spaces from API
  useEffect(() => {
    if (open) {
      fetchTemplates()
      fetchSpaces()
    }
  }, [open])

  // Auto-select template when space is selected
  useEffect(() => {
    if (selectedSpaceId && spaces.length > 0) {
      const selectedSpace = spaces.find(s => s.id.toString() === selectedSpaceId)
      if (selectedSpace?.templateId) {
        // Auto-select the space's template whenever space changes
        setSelectedTemplateId(selectedSpace.templateId.toString())
      }
    }
  }, [selectedSpaceId, spaces])

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const response = await fetch('/api/templates')

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError('Error al cargar plantillas')
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const fetchSpaces = async () => {
    try {
      setIsLoadingSpaces(true)
      const response = await fetch('/api/spaces')

      if (!response.ok) {
        throw new Error('Failed to fetch spaces')
      }

      const data = await response.json()
      setSpaces(data)
    } catch (error) {
      console.error('Error fetching spaces:', error)
    } finally {
      setIsLoadingSpaces(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSpaceId) {
      setError('Debes seleccionar un espacio')
      return
    }

    if (!projectName.trim()) {
      setError('El nombre del proyecto es requerido')
      return
    }

    if (!selectedTemplateId) {
      setError('Debes seleccionar una plantilla')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim() || null,
          spaceId: parseInt(selectedSpaceId),
          templateId: selectedTemplateId ? parseInt(selectedTemplateId) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const newProject = await response.json()

      // If sprints were configured, create them
      if (sprints.length > 0) {
        for (const sprint of sprints) {
          await fetch(`/api/projects/${newProject.id}/sprints`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: sprint.name,
              startDate: sprint.startDate ? new Date(sprint.startDate).toISOString() : null,
              endDate: sprint.endDate ? new Date(sprint.endDate).toISOString() : null,
              status: 'PLANNING',
            }),
          })
        }
      }

      toast.success('Proyecto creado exitosamente')
      onProjectCreated(newProject)
      handleReset()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setProjectName('')
    setProjectDescription('')
    setSelectedTemplateId('')
    setSelectedSpaceId(spaceId?.toString() || '')
    setStartDate('')
    setEndDate('')
    setSprintDuration('2')
    setSprints([])
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset()
    }
    onOpenChange(newOpen)
  }

  const generateSprints = () => {
    if (!startDate || !endDate || !sprintDuration) return

    const start = new Date(startDate)
    const end = new Date(endDate)
    const durationWeeks = parseInt(sprintDuration)
    const durationMs = durationWeeks * 7 * 24 * 60 * 60 * 1000

    const newSprints: Sprint[] = []
    let currentStart = new Date(start)
    let sprintNumber = 1

    while (currentStart < end) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + durationMs,
        end.getTime()
      ))

      newSprints.push({
        id: `sprint-${Date.now()}-${sprintNumber}`,
        name: `Sprint ${sprintNumber}`,
        startDate: currentStart.toISOString().split('T')[0],
        endDate: currentEnd.toISOString().split('T')[0],
        order: sprintNumber
      })

      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000) // +1 day
      sprintNumber++
    }

    setSprints(newSprints)
  }

  const handleRemoveSprint = (sprintId: string) => {
    const updated = sprints.filter(s => s.id !== sprintId)
    // Reorder
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1, name: `Sprint ${idx + 1}` }))
    setSprints(reordered)
  }

  const handleUpdateSprint = (sprintId: string, field: 'startDate' | 'endDate', value: string) => {
    setSprints(sprints.map(s =>
      s.id === sprintId ? { ...s, [field]: value } : s
    ))
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'DESARROLLO_SOFTWARE': 'Desarrollo',
      'MARKETING': 'Marketing',
      'DISENO': 'Diseño',
      'VENTAS': 'Ventas',
      'OPERACIONES': 'Operaciones',
      'RECURSOS_HUMANOS': 'RRHH',
      'GENERAL': 'General',
      'PERSONALIZADO': 'Personalizado'
    }
    return labels[category] || category
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          </div>
          <DialogDescription>
            Crea un proyecto seleccionando una plantilla de estados predefinida
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Información Básica</TabsTrigger>
              <TabsTrigger value="sprints" disabled={!startDate || !endDate}>
                Configuración de Sprints
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Space Selection - FIRST AND REQUIRED */}
              <div className="space-y-2">
                <Label htmlFor="space">Espacio *</Label>
                <Select
                  value={selectedSpaceId}
                  onValueChange={(value) => setSelectedSpaceId(value)}
                  disabled={isLoading || isLoadingSpaces || (spaceId !== undefined)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingSpaces ? "Cargando espacios..." : "Selecciona un espacio"} />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map(space => {
                      const IconComponent = space.icon
                        ? LucideIcons[space.icon as keyof typeof LucideIcons] || LucideIcons.Folder
                        : LucideIcons.Folder
                      return (
                        <SelectItem key={space.id} value={space.id.toString()}>
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {IconComponent && <IconComponent className="h-4 w-4" style={{ color: space.color }} />}
                            <span>{space.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {spaceId !== undefined && (
                  <p className="text-xs text-gray-500">El espacio está preseleccionado</p>
                )}
              </div>

              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Rediseño de la Plataforma Web"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el proyecto (opcional)"
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Project Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isLoading}
                      min={startDate}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Plantilla de Estados *</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={isLoading || isLoadingTemplates}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingTemplates ? "Cargando plantillas..." : "Selecciona una plantilla"} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => {
                      const IconComponent = LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.Folder
                      return (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex items-center gap-2 w-full">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {IconComponent && <IconComponent className="h-4 w-4 flex-shrink-0" style={{ color: template.color }} />}
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{template.name}</span>
                                {template.isDefault ? (
                                  <Badge variant="secondary" className="text-xs">Sistema</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Mía</Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {getCategoryLabel(template.category)} • {template.states.length} estados
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Vista Previa de Estados</CardTitle>
                    <CardDescription className="text-xs">
                      {selectedTemplate.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.states.map((state, idx) => (
                        <Badge
                          key={state.id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: state.color,
                            color: state.color
                          }}
                        >
                          {state.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sprints" className="space-y-4 mt-4">
              {/* Sprint Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sprintDuration">Duración del Sprint (semanas)</Label>
                    <Select value={sprintDuration} onValueChange={setSprintDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 semana</SelectItem>
                        <SelectItem value="2">2 semanas</SelectItem>
                        <SelectItem value="3">3 semanas</SelectItem>
                        <SelectItem value="4">4 semanas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={generateSprints}
                      disabled={!startDate || !endDate || !sprintDuration}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generar Sprints
                    </Button>
                  </div>
                </div>

                {/* Sprints List */}
                {sprints.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Sprints Configurados ({sprints.length})</CardTitle>
                      <CardDescription className="text-xs">
                        Ajusta las fechas de cada sprint si es necesario
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {sprints.map((sprint, index) => (
                          <div key={sprint.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-700">{index + 1}</span>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Inicio</Label>
                                <Input
                                  type="date"
                                  value={sprint.startDate}
                                  onChange={(e) => handleUpdateSprint(sprint.id, 'startDate', e.target.value)}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Fin</Label>
                                <Input
                                  type="date"
                                  value={sprint.endDate}
                                  onChange={(e) => handleUpdateSprint(sprint.id, 'endDate', e.target.value)}
                                  className="h-8 text-xs"
                                  min={sprint.startDate}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSprint(sprint.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {sprints.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm border rounded-lg bg-gray-50">
                    Configura la duración y genera sprints automáticamente
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedSpaceId || !projectName.trim() || !selectedTemplateId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Proyecto'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
