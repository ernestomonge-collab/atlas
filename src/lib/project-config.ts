export interface ProjectStatus {
  id: string
  name: string
  color: string
  order: number
}

export interface GridColumn {
  id: string
  name: string
  enabled: boolean
  order: number
  width?: string
}

export interface ProjectConfig {
  id: string
  projectId: string
  statuses: ProjectStatus[]
  gridColumns: GridColumn[]
  kanbanLayout: 'status' | 'priority'
  gridGroupBy: 'none' | 'status' | 'priority' | 'assignee'
  createdAt: string
  updatedAt: string
}

export const DEFAULT_STATUSES: Record<string, ProjectStatus[]> = {
  'Desarrollo de Software': [
    { id: 'backlog', name: 'Backlog', color: 'bg-gray-100 text-gray-800', order: 0 },
    { id: 'in_development', name: 'En Desarrollo', color: 'bg-blue-100 text-blue-800', order: 1 },
    { id: 'testing', name: 'Testing', color: 'bg-yellow-100 text-yellow-800', order: 2 },
    { id: 'review', name: 'Review', color: 'bg-purple-100 text-purple-800', order: 3 },
    { id: 'completed', name: 'Completado', color: 'bg-green-100 text-green-800', order: 4 }
  ],
  'Marketing': [
    { id: 'ideas', name: 'Ideas', color: 'bg-gray-100 text-gray-800', order: 0 },
    { id: 'planning', name: 'Planificación', color: 'bg-blue-100 text-blue-800', order: 1 },
    { id: 'execution', name: 'Ejecución', color: 'bg-yellow-100 text-yellow-800', order: 2 },
    { id: 'review', name: 'Review', color: 'bg-purple-100 text-purple-800', order: 3 },
    { id: 'published', name: 'Publicado', color: 'bg-green-100 text-green-800', order: 4 }
  ],
  'Diseño': [
    { id: 'concept', name: 'Concepto', color: 'bg-gray-100 text-gray-800', order: 0 },
    { id: 'wireframe', name: 'Wireframe', color: 'bg-blue-100 text-blue-800', order: 1 },
    { id: 'design', name: 'Diseño', color: 'bg-yellow-100 text-yellow-800', order: 2 },
    { id: 'review', name: 'Review', color: 'bg-purple-100 text-purple-800', order: 3 },
    { id: 'approved', name: 'Aprobado', color: 'bg-green-100 text-green-800', order: 4 }
  ],
  'General': [
    { id: 'pending', name: 'Por Hacer', color: 'bg-gray-100 text-gray-800', order: 0 },
    { id: 'in_progress', name: 'En Progreso', color: 'bg-blue-100 text-blue-800', order: 1 },
    { id: 'completed', name: 'Completado', color: 'bg-green-100 text-green-800', order: 2 }
  ]
}

export const DEFAULT_GRID_COLUMNS: GridColumn[] = [
  { id: 'title', name: 'Tarea', enabled: true, order: 0, width: '2fr' },
  { id: 'status', name: 'Estado', enabled: true, order: 1, width: '1fr' },
  { id: 'priority', name: 'Prioridad', enabled: true, order: 2, width: '0.8fr' },
  { id: 'assignee', name: 'Asignado', enabled: true, order: 3, width: '1fr' },
  { id: 'dueDate', name: 'Vencimiento', enabled: true, order: 4, width: '1fr' }
]

export const AVAILABLE_GRID_COLUMNS: GridColumn[] = [
  { id: 'title', name: 'Tarea', enabled: true, order: 0, width: '2fr' },
  { id: 'status', name: 'Estado', enabled: true, order: 1, width: '1fr' },
  { id: 'priority', name: 'Prioridad', enabled: true, order: 2, width: '0.8fr' },
  { id: 'assignee', name: 'Asignado', enabled: true, order: 3, width: '1fr' },
  { id: 'createdBy', name: 'Creado por', enabled: false, order: 4, width: '1fr' },
  { id: 'createdAt', name: 'Fecha creación', enabled: false, order: 5, width: '1fr' },
  { id: 'updatedAt', name: 'Última actualización', enabled: false, order: 6, width: '1fr' },
  { id: 'dueDate', name: 'Vencimiento', enabled: true, order: 7, width: '1fr' },
  { id: 'description', name: 'Descripción', enabled: false, order: 8, width: '2fr' }
]

export const PROJECT_TYPES = [
  'Desarrollo de Software',
  'Marketing',
  'Diseño',
  'General'
]

export function getDefaultProjectConfig(projectId: string, projectType: string = 'General'): ProjectConfig {
  return {
    id: `config-${projectId}`,
    projectId,
    statuses: DEFAULT_STATUSES[projectType] || DEFAULT_STATUSES['General'],
    gridColumns: DEFAULT_GRID_COLUMNS,
    kanbanLayout: 'status',
    gridGroupBy: 'none',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}