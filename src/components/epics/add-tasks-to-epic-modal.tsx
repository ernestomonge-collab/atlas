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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Search, Plus, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Epic {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  epicId?: string
  epic?: Epic
}

interface AddTasksToEpicModalProps {
  epicId: string
  epicName: string
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTasksAdded: () => void
}

export function AddTasksToEpicModal({
  epicId,
  epicName,
  projectId,
  open,
  onOpenChange,
  onTasksAdded
}: AddTasksToEpicModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchAvailableTasks()
      setSelectedTasks(new Set())
      setSearchQuery('')
    }
  }, [open, projectId])

  const fetchAvailableTasks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch all tasks from the project
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (response.ok) {
        const allTasks = await response.json()
        // Show all tasks (including those in other epics)
        setTasks(allTasks)
      } else {
        setError('Error al cargar las tareas')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Error al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    if (selectedTasks.size === 0) return

    setIsSaving(true)
    setError(null)

    try {
      // Update each selected task to add the epicId
      const updatePromises = Array.from(selectedTasks).map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ epicId })
        })
      )

      const results = await Promise.all(updatePromises)
      const allSuccessful = results.every(r => r.ok)

      if (allSuccessful) {
        toast.success(`${selectedTasks.size} tarea(s) agregada(s) a la épica exitosamente`)
        onTasksAdded()
        onOpenChange(false)
      } else {
        const errorMsg = 'Error al agregar algunas tareas'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Error adding tasks to epic:', error)
      const errorMsg = 'Error al agregar las tareas'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTasks = tasks
    .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // First: tasks already in this epic
      const aInThisEpic = a.epicId === epicId
      const bInThisEpic = b.epicId === epicId
      if (aInThisEpic && !bInThisEpic) return -1
      if (!aInThisEpic && bInThisEpic) return 1

      // Second: tasks without epic
      const aNoEpic = !a.epicId
      const bNoEpic = !b.epicId
      if (aNoEpic && !bNoEpic) return -1
      if (!aNoEpic && bNoEpic) return 1

      // Third: tasks in other epics (last)
      return 0
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700'
      case 'PENDING':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      case 'LOW':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'IN_PROGRESS':
        return 'En Progreso'
      case 'COMPLETED':
        return 'Completada'
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Agregar Tareas a Épica</DialogTitle>
          <DialogDescription>
            Selecciona las tareas que quieres agregar a "{epicName}"
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar tareas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tasks List */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? 'No se encontraron tareas'
                  : 'No hay tareas disponibles para agregar'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => {
                const isSelected = selectedTasks.has(task.id)
                const isAlreadyInEpic = task.epicId === epicId
                const isInOtherEpic = task.epicId && task.epicId !== epicId

                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isAlreadyInEpic
                        ? 'border-green-200 bg-green-50'
                        : isInOtherEpic
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={task.id}
                      checked={isSelected || isAlreadyInEpic}
                      disabled={isAlreadyInEpic}
                      onCheckedChange={() => !isAlreadyInEpic && toggleTask(task.id)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={task.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusColor(task.status)}`}
                            >
                              {getStatusText(task.status)}
                            </Badge>
                            <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {isInOtherEpic && task.epic && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-700">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Actualmente en: {task.epic.name}</span>
                            </div>
                          )}
                        </div>
                        {isAlreadyInEpic && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                        {isInOtherEpic && isSelected && (
                          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                        )}
                      </div>
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedTasks.size > 0 && (
              <span className="font-medium">
                {selectedTasks.size} tarea{selectedTasks.size !== 1 ? 's' : ''} seleccionada{selectedTasks.size !== 1 ? 's' : ''}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedTasks.size === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar {selectedTasks.size > 0 && `(${selectedTasks.size})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
