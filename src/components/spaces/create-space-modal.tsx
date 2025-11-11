'use client'

import React, { useState, useEffect } from 'react'
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
import { Space, ProjectTemplate } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateSpaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSpaceCreated: (space: Space) => void
}

// Predefined colors for spaces
const SPACE_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
  { name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
]

// Predefined icons for spaces
const SPACE_ICONS = [
  'Folder', 'Code', 'Settings', 'Megaphone', 'Users', 'Building2',
  'Layers', 'Target', 'BarChart3', 'Zap', 'Heart', 'Star',
  'Briefcase', 'Globe', 'Palette', 'Database', 'Shield', 'Lightbulb',
  'Rocket', 'Camera', 'Music', 'GameController2', 'Book', 'Coffee'
]

export function CreateSpaceModal({ open, onOpenChange, onSpaceCreated }: CreateSpaceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6', // Default blue
    icon: 'Folder',
    isPublic: true, // Default to public
    tags: [] as string[],
    templateId: ''
  })
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)

  const selectedTemplate = templates.find(t => t.id.toString() === formData.templateId)

  // Fetch templates when modal opens
  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

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
      toast.error('Error al cargar plantillas')
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.templateId) {
      return
    }

    setIsSubmitting(true)

    try {
      // Call API to create space
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
          icon: formData.icon,
          isPublic: formData.isPublic,
          templateId: formData.templateId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create space')
      }

      const newSpace = await response.json()

      toast.success('Espacio creado exitosamente')

      // Call the callback function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSpaceCreated(newSpace as any)

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'Folder',
        isPublic: true,
        tags: [],
        templateId: ''
      })
      setTagInput('')

      // Close modal
      onOpenChange(false)

    } catch (error) {
      console.error('Error creating space:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el espacio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'Folder',
      isPublic: true,
      tags: [],
      templateId: ''
    })
    setTagInput('')
    onOpenChange(false)
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

  // Get the selected icon component
  const SelectedIcon = LucideIcons[formData.icon as keyof typeof LucideIcons] || LucideIcons.Folder

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Create a new space to organize related projects and collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="template">Plantilla</TabsTrigger>
              <TabsTrigger value="style">Estilo</TabsTrigger>
            </TabsList>

            {/* Tab: Basic Information */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Space Preview */}
              <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
                <div
                  className="p-3 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${formData.color}20` }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {React.createElement(SelectedIcon as any, {
                    className: "h-6 w-6",
                    style: { color: formData.color }
                  })}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {formData.name || 'Nombre del Espacio'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formData.description || 'La descripción aparecerá aquí'}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Espacio *</Label>
                <Input
                  id="name"
                  placeholder="Ingresa el nombre del espacio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe el propósito de este espacio"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between space-x-4">
                <div className="space-y-0.5">
                  <Label htmlFor="public-space">Espacio Público</Label>
                  <p className="text-sm text-gray-500">
                    Visible para todos los miembros de la organización
                  </p>
                </div>
                <Switch
                  id="public-space"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>

              {/* Tags */}
              <div className="grid gap-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Agregar etiqueta (presiona Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
                    <LucideIcons.Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <LucideIcons.X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Template */}
            <TabsContent value="template" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Plantilla de Estados *</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                  disabled={isLoadingTemplates}
                >
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
                            {IconComponent && React.createElement(IconComponent as any, {
                              className: "h-4 w-4 flex-shrink-0",
                              style: { color: template.color }
                            })}
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
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.states.map((state) => (
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

            {/* Tab: Style */}
            <TabsContent value="style" className="space-y-4 mt-4">
              {/* Color Selection */}
              <div className="grid gap-3">
                <Label>Color del Espacio</Label>
                <div className="grid grid-cols-5 gap-3">
                  {SPACE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                        formData.color === color.value
                          ? "border-gray-900 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                    >
                      <div className={cn("w-full h-8 rounded", color.bg)} />
                      <span className="text-xs text-gray-600 mt-1 block">{color.name}</span>
                      {formData.color === color.value && (
                        <div className="absolute -top-1 -right-1">
                          <Badge variant="default" className="h-5 w-5 p-0 rounded-full">
                            ✓
                          </Badge>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selection */}
              <div className="grid gap-3">
                <Label>Icono del Espacio</Label>
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {SPACE_ICONS.map((iconName) => {
                    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons]
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={cn(
                          "p-2 rounded border transition-all hover:bg-gray-50",
                          formData.icon === iconName
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        )}
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        title={iconName}
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {IconComponent && React.createElement(IconComponent as any, { className: "h-4 w-4 mx-auto" })}
                      </button>
                    )
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim() || !formData.templateId}>
              {isSubmitting ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <LucideIcons.Plus className="mr-2 h-4 w-4" />
                  Create Space
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}