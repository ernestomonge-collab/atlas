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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  ProjectConfig,
  GridColumn,
  AVAILABLE_GRID_COLUMNS
} from '@/lib/project-config'
import { toast } from 'sonner'
import {
  Settings,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react'

interface ProjectConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  currentConfig: ProjectConfig | null
  onConfigUpdated: (config: ProjectConfig) => void
}

export function ProjectConfigModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  currentConfig,
  onConfigUpdated
}: ProjectConfigModalProps) {
  const [config, setConfig] = useState<ProjectConfig | null>(currentConfig)

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig)
    }
  }, [currentConfig])


  const handleToggleColumn = (columnId: string) => {
    if (!config) return

    const existingColumn = config.gridColumns.find(c => c.id === columnId)

    if (existingColumn) {
      // Toggle existing column
      setConfig({
        ...config,
        gridColumns: config.gridColumns.map(c =>
          c.id === columnId ? { ...c, enabled: !c.enabled } : c
        )
      })
    } else {
      // Add new column from available columns
      const availableColumn = AVAILABLE_GRID_COLUMNS.find(c => c.id === columnId)
      if (availableColumn) {
        setConfig({
          ...config,
          gridColumns: [...config.gridColumns, {
            ...availableColumn,
            enabled: true,
            order: config.gridColumns.length
          }]
        })
      }
    }
  }

  const handleSaveConfig = () => {
    if (!config) return

    try {
      const updatedConfig = {
        ...config,
        updatedAt: new Date().toISOString()
      }

      // Save to localStorage for persistence across sessions
      localStorage.setItem(`project-config-${projectId}`, JSON.stringify(updatedConfig))

      toast.success('Configuración guardada exitosamente')
      onConfigUpdated(updatedConfig)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save configuration:', error)
      toast.error('Error al guardar la configuración')
    }
  }

  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <DialogTitle>Configurar Proyecto</DialogTitle>
          </div>
          <DialogDescription>
            Personaliza las columnas visibles para el proyecto &quot;{projectName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">

          <Card>
              <CardHeader>
                <CardTitle className="text-lg">Columnas Visibles</CardTitle>
                <DialogDescription>
                  Selecciona qué columnas quieres mostrar en la vista de grilla
                </DialogDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {AVAILABLE_GRID_COLUMNS.map((column) => {
                  const isEnabled = config.gridColumns.find(c => c.id === column.id)?.enabled ?? false

                  return (
                    <div key={column.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div>
                          <Label className="font-medium">{column.name}</Label>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isEnabled ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggleColumn(column.id)}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveConfig}>
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}