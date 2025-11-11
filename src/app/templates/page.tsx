'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateTemplateModal } from '@/components/templates/create-template-modal'
import { TemplateDetailModal } from '@/components/templates/template-detail-modal'
import { ProjectTemplate, TemplateCategory } from '@/types'
import { Plus, Search, Sparkles, User, Edit, Trash2, Loader2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/hooks/use-confirm'

export default function TemplatesPage() {
  const { data: session } = useSession()
  const { confirm, ConfirmationDialog } = useConfirm()
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | undefined>(undefined)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)

  // Fetch templates from API
  useEffect(() => {
    if (session) {
      fetchTemplates()
    }
  }, [session])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/templates')

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error al cargar plantillas')
    } finally {
      setIsLoading(false)
    }
  }

  // Session is guaranteed by middleware, but add safety check
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery.trim() ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const systemTemplates = filteredTemplates.filter(t => t.isDefault)
  const customTemplates = filteredTemplates.filter(t => !t.isDefault)

  const getCategoryLabel = (category: TemplateCategory) => {
    const labels = {
      [TemplateCategory.DESARROLLO_SOFTWARE]: 'Desarrollo',
      [TemplateCategory.MARKETING]: 'Marketing',
      [TemplateCategory.DISENO]: 'Diseño',
      [TemplateCategory.VENTAS]: 'Ventas',
      [TemplateCategory.OPERACIONES]: 'Operaciones',
      [TemplateCategory.RECURSOS_HUMANOS]: 'RRHH',
      [TemplateCategory.GENERAL]: 'General',
      [TemplateCategory.PERSONALIZADO]: 'Personalizado'
    }
    return labels[category] || category
  }

  const handleTemplateCreated = async (template: ProjectTemplate) => {
    // Refresh templates list
    await fetchTemplates()
    setEditingTemplate(undefined)
  }

  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplate(template)
    setShowCreateModal(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmed = await confirm({
      title: 'Eliminar plantilla',
      description: '¿Estás seguro de que deseas eliminar esta plantilla? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      toast.success('Plantilla eliminada exitosamente')
      // Refresh templates list
      await fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar plantilla')
    }
  }

  const handleModalClose = (open: boolean) => {
    setShowCreateModal(open)
    if (!open) {
      setEditingTemplate(undefined)
    }
  }

  const handleViewDetails = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    setShowDetailModal(true)
  }

  return (
    <MainLayout
      title="Plantillas de Proyectos"
      description="Gestiona plantillas para crear proyectos más rápido"
    >
      {/* Header Actions */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Plantillas</h2>
            <p className="text-gray-600">
              {filteredTemplates.length} plantilla{filteredTemplates.length !== 1 ? 's' : ''} disponible{filteredTemplates.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar plantillas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue>
                {categoryFilter === 'all' ? 'Todas las categorías' :
                  categoryFilter === TemplateCategory.DESARROLLO_SOFTWARE ? 'Desarrollo de Software' :
                  categoryFilter === TemplateCategory.MARKETING ? 'Marketing' :
                  categoryFilter === TemplateCategory.DISENO ? 'Diseño' :
                  categoryFilter === TemplateCategory.VENTAS ? 'Ventas' :
                  categoryFilter === TemplateCategory.OPERACIONES ? 'Operaciones' :
                  categoryFilter === TemplateCategory.RECURSOS_HUMANOS ? 'Recursos Humanos' :
                  categoryFilter === TemplateCategory.GENERAL ? 'General' :
                  categoryFilter === TemplateCategory.PERSONALIZADO ? 'Personalizado' :
                  'Filtrar por categoría'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value={TemplateCategory.DESARROLLO_SOFTWARE}>Desarrollo de Software</SelectItem>
              <SelectItem value={TemplateCategory.MARKETING}>Marketing</SelectItem>
              <SelectItem value={TemplateCategory.DISENO}>Diseño</SelectItem>
              <SelectItem value={TemplateCategory.VENTAS}>Ventas</SelectItem>
              <SelectItem value={TemplateCategory.OPERACIONES}>Operaciones</SelectItem>
              <SelectItem value={TemplateCategory.RECURSOS_HUMANOS}>Recursos Humanos</SelectItem>
              <SelectItem value={TemplateCategory.GENERAL}>General</SelectItem>
              <SelectItem value={TemplateCategory.PERSONALIZADO}>Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500">Cargando plantillas...</p>
        </div>
      ) : (
        /* Templates Tabs */
        <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Plantillas del Sistema ({systemTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Mis Plantillas ({customTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          {systemTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron plantillas del sistema
                </h3>
                <p className="text-gray-500">
                  Intenta con otro término de búsqueda o filtro
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemTemplates.map(template => {
                const IconComponent = LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.Folder
                return <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleViewDetails(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: `${template.color}20` }}
                        >
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {IconComponent && <IconComponent className="h-6 w-6" style={{ color: template.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1">
                            {template.name}
                          </CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription className="mt-3 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* States Preview */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2">
                          Estados ({template.states.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.states.slice(0, 4).map(state => (
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
                          {template.states.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.states.length - 4} más
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Usage Stats */}
                      {template.usageCount !== undefined && (
                        <div className="pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            Usado {template.usageCount} {template.usageCount === 1 ? 'vez' : 'veces'}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2">
                        <div className="text-xs text-gray-500 text-center">
                          Plantilla del sistema
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {customTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'No se encontraron plantillas personalizadas'
                    : 'No tienes plantillas personalizadas'
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Intenta con otro término de búsqueda o filtro'
                    : 'Crea tu primera plantilla personalizada para reutilizar flujos de trabajo'
                  }
                </p>
                {!searchQuery && categoryFilter === 'all' && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Tu Primera Plantilla
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customTemplates.map(template => {
                const IconComponent = LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.Folder
                return <Card
                  key={template.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleViewDetails(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: `${template.color}20` }}
                        >
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {IconComponent && <IconComponent className="h-6 w-6" style={{ color: template.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1">
                            {template.name}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {getCategoryLabel(template.category)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {template.description && (
                      <CardDescription className="mt-3 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* States Preview */}
                      <div>
                        <div className="text-xs text-gray-500 mb-2">
                          Estados ({template.states.length}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {template.states.slice(0, 4).map(state => (
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
                          {template.states.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.states.length - 4} más
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Usage Stats */}
                      {template.usageCount !== undefined && (
                        <div className="pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            Usado {template.usageCount} {template.usageCount === 1 ? 'vez' : 'veces'}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={template.usageCount > 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTemplate(template)
                          }}
                          title={template.usageCount > 0 ? 'No se puede editar una plantilla que ya está en uso' : 'Editar plantilla'}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={template.usageCount > 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                          title={template.usageCount > 0 ? 'No se puede eliminar una plantilla que ya está en uso' : 'Eliminar plantilla'}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}

      {/* Create/Edit Template Modal */}
      <CreateTemplateModal
        open={showCreateModal}
        onOpenChange={handleModalClose}
        onTemplateCreated={handleTemplateCreated}
        template={editingTemplate}
      />

      {/* Template Detail Modal */}
      <TemplateDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        template={selectedTemplate}
      />
      <ConfirmationDialog />
    </MainLayout>
  )
}
