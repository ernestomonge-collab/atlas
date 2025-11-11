'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ProjectTemplate, TemplateCategory, TemplateState } from '@/types'
import { Plus, X, GripVertical, Palette } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

interface CreateTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTemplateCreated: (template: ProjectTemplate) => void
  template?: ProjectTemplate // For edit mode
}

const ICON_OPTIONS = [
  'Code', 'Megaphone', 'Palette', 'TrendingUp', 'Settings', 'Users',
  'Zap', 'Target', 'Briefcase', 'Package', 'ShoppingCart', 'Coffee',
  'Folder', 'FileText', 'Layers', 'Database'
]

const COLOR_OPTIONS = [
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Púrpura', value: '#8B5CF6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Gris', value: '#6B7280' },
  { name: 'Índigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Naranja', value: '#F97316' }
]

const STATE_COLOR_OPTIONS = [
  '#9CA3AF', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#6B7280', '#14B8A6', '#F97316'
]

export function CreateTemplateModal({ open, onOpenChange, onTemplateCreated, template }: CreateTemplateModalProps) {
  const isEditMode = !!template

  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || TemplateCategory.GENERAL,
    icon: template?.icon || 'Folder',
    color: template?.color || '#3B82F6'
  })

  const [states, setStates] = useState<TemplateState[]>(
    template?.states || [
      { id: 'state-1', name: 'Por Hacer', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-2', name: 'En Progreso', color: '#3B82F6', order: 2 },
      { id: 'state-3', name: 'Completado', color: '#10B981', order: 3 }
    ]
  )

  const [newStateName, setNewStateName] = useState('')
  const [newStateColor, setNewStateColor] = useState('#9CA3AF')

  const [isSaving, setIsSaving] = useState(false)

  // Update form data when template prop changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        icon: template.icon || 'Folder',
        color: template.color || '#3B82F6'
      })
      setStates(template.states || [])
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Por favor ingresa un nombre para la plantilla')
      return
    }

    if (states.length === 0) {
      toast.error('Debes agregar al menos un estado')
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        icon: formData.icon,
        color: formData.color,
        states: states.map(s => ({
          name: s.name,
          color: s.color,
          order: s.order,
          isDefault: s.isDefault || false
        }))
      }

      const url = isEditMode ? `/api/templates/${template.id}` : '/api/templates'
      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      const savedTemplate = await response.json()
      toast.success(isEditMode ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente')
      onTemplateCreated(savedTemplate)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Error al guardar plantilla')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: TemplateCategory.GENERAL,
      icon: 'Folder',
      color: '#3B82F6'
    })
    setStates([
      { id: 'state-1', name: 'Por Hacer', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-2', name: 'En Progreso', color: '#3B82F6', order: 2 },
      { id: 'state-3', name: 'Completado', color: '#10B981', order: 3 }
    ])
    setNewStateName('')
    setNewStateColor('#9CA3AF')
  }

  const handleAddState = () => {
    if (!newStateName.trim()) return

    const newState: TemplateState = {
      id: `state-${Date.now()}`,
      name: newStateName.trim(),
      color: newStateColor,
      order: states.length + 1
    }

    setStates([...states, newState])
    setNewStateName('')
    setNewStateColor('#9CA3AF')
  }

  const handleRemoveState = (stateId: string) => {
    const updatedStates = states.filter(s => s.id !== stateId)
    // Reorder
    const reordered = updatedStates.map((s, idx) => ({ ...s, order: idx + 1 }))
    setStates(reordered)
  }

  const handleSetDefaultState = (stateId: string) => {
    const updated = states.map(s => ({
      ...s,
      isDefault: s.id === stateId
    }))
    setStates(updated)
  }

  // Get icon component
  const IconComponent = LucideIcons[formData.icon as keyof typeof LucideIcons] || LucideIcons.Folder

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los detalles y estados de tu plantilla'
              : 'Crea una plantilla personalizada con tus propios estados de flujo de trabajo'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre de la Plantilla *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Mi Flujo de Desarrollo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as TemplateCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe para qué sirve esta plantilla..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icono</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => {
                        const Icon = LucideIcons[icon as keyof typeof LucideIcons]
                        return (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {Icon && <Icon className="h-4 w-4" />}
                              {icon}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((colorOption) => (
                        <SelectItem key={colorOption.value} value={colorOption.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded border"
                              style={{ backgroundColor: colorOption.value }}
                            />
                            {colorOption.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* States Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Estados del Proyecto *</Label>
                <span className="text-xs text-gray-500">{states.length} estado(s)</span>
              </div>

              {/* States List */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {states.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No hay estados agregados. Agrega al menos uno.
                  </div>
                ) : (
                  states.map((state) => (
                    <div
                      key={state.id}
                      className="flex items-center justify-between gap-3 p-3 bg-white border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div
                          className="h-6 w-6 rounded border flex-shrink-0"
                          style={{ backgroundColor: state.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{state.name}</div>
                          {state.isDefault && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Estado predeterminado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!state.isDefault && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultState(state.id)}
                            className="text-xs"
                          >
                            Predeterminado
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveState(state.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New State */}
              <div className="border rounded-lg p-4 space-y-3 bg-blue-50 border-blue-200">
                <Label className="text-sm font-medium">Agregar Nuevo Estado</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={newStateName}
                      onChange={(e) => setNewStateName(e.target.value)}
                      placeholder="Nombre del estado"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddState()
                        }
                      }}
                    />
                  </div>
                  <Select value={newStateColor} onValueChange={setNewStateColor}>
                    <SelectTrigger className="w-[140px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: newStateColor }}
                        />
                        <Palette className="h-4 w-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_COLOR_OPTIONS.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded border"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddState} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                if (!isEditMode) resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Plantilla')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
