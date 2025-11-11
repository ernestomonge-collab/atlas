'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ProjectTemplate } from '@/types'
import * as LucideIcons from 'lucide-react'

interface TemplateDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: ProjectTemplate | null
}

export function TemplateDetailModal({ open, onOpenChange, template }: TemplateDetailModalProps) {
  if (!template) return null

  const IconComponent = LucideIcons[template.icon as keyof typeof LucideIcons] || LucideIcons.Folder

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'DESARROLLO_SOFTWARE': 'Desarrollo de Software',
      'MARKETING': 'Marketing',
      'DISENO': 'Diseño',
      'VENTAS': 'Ventas',
      'OPERACIONES': 'Operaciones',
      'RECURSOS_HUMANOS': 'Recursos Humanos',
      'GENERAL': 'General',
      'PERSONALIZADO': 'Personalizado'
    }
    return labels[category] || category
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${template.color}20` }}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {IconComponent && <IconComponent className="h-8 w-8" style={{ color: template.color }} />}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <Badge variant="outline" className="mt-2">
                {getCategoryLabel(template.category)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {template.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h3>
              <p className="text-gray-600">{template.description}</p>
            </div>
          )}

          {/* States */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Estados del Flujo de Trabajo ({template.states.length})
            </h3>
            <div className="space-y-2">
              {template.states.map((state, index) => (
                <div
                  key={state.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-500 w-8">
                    {index + 1}.
                  </div>
                  <div
                    className="h-8 w-8 rounded border flex-shrink-0"
                    style={{ backgroundColor: state.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{state.name}</div>
                    {state.isDefault && (
                      <div className="text-xs text-gray-500 mt-1">
                        Estado predeterminado para nuevas tareas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Stats */}
          {template.usageCount !== undefined && (
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                Esta plantilla ha sido utilizada <span className="font-semibold">{template.usageCount}</span> {template.usageCount === 1 ? 'vez' : 'veces'}
              </div>
            </div>
          )}

          {/* System Template Notice */}
          {template.isDefault && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-0.5">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">Plantilla del Sistema</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Esta es una plantilla predefinida que puedes usar como base para tus proyectos.
                    Puedes duplicarla y personalizarla creando tu propia plantilla.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
