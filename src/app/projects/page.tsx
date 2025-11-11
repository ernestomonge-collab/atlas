'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { EditProjectModal } from '@/components/projects/edit-project-modal'
import { ManageProjectMembersModal } from '@/components/projects/manage-project-members-modal'
import { MainLayout } from '@/components/layout/main-layout'
import { useProjects } from '@/hooks/use-projects'
import { useSpaces } from '@/hooks/use-spaces'
import { useConfirm } from '@/hooks/use-confirm'
import { Project } from '@/types'
import { toast } from 'sonner'
import {
  Building2, Plus, Users, Edit, Trash2, Lock,
  LayoutGrid, List, Search, X, CheckCircle, AlertTriangle, BarChart3, MoreVertical, Folder
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

type ViewMode = 'cards' | 'list'

export default function ProjectsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { projects, isLoading, refreshProjects } = useProjects()
  const { spaces } = useSpaces()
  const { confirm, ConfirmationDialog } = useConfirm()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [spaceFilter, setSpaceFilter] = useState('all')

  // Session is guaranteed by middleware, but add safety check
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Helper to check if user is owner or admin of a project
  const isProjectOwnerOrAdmin = (project: Project) => {
    return project.members?.some(
      member => member.userId === parseInt(session?.user?.id || '0')
        && (member.role === 'OWNER' || member.role === 'ADMIN')
    )
  }

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery.trim() ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'at-risk' && project.progress < 50) ||
      (statusFilter === 'on-track' && project.progress >= 50 && project.progress < 100) ||
      (statusFilter === 'completed' && project.progress === 100)

    const matchesSpace = spaceFilter === 'all' ||
      (project.spaceId && project.spaceId.toString() === spaceFilter)

    return matchesSearch && matchesStatus && matchesSpace
  })

  const handleProjectCreated = () => {
    refreshProjects()
  }

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProject(project)
    setShowEditModal(true)
  }

  const handleMembers = (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProject(project)
    setShowMembersModal(true)
  }

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmed = await confirm({
      title: 'Eliminar proyecto',
      description: `¿Estás seguro de que quieres eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Proyecto eliminado exitosamente')
        refreshProjects()
      } else {
        console.error('Failed to delete project')
        toast.error('Error al eliminar el proyecto. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Error al eliminar el proyecto. Por favor intenta de nuevo.')
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <MainLayout
      title="Proyectos"
      description="Gestiona todos tus proyectos y su progreso"
    >
      {/* Projects Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todos los Proyectos</CardTitle>
                <CardDescription>
                  {filteredProjects.length > 0
                    ? `${filteredProjects.length} proyecto${filteredProjects.length !== 1 ? 's' : ''} ${searchQuery ? 'encontrado(s)' : 'en tu organización'}`
                    : searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos creados'
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Proyecto
                </Button>
              </div>
            </div>

            {/* Search Bar and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar proyectos por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select value={spaceFilter} onValueChange={setSpaceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los espacios</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id.toString()}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="on-track">En curso</SelectItem>
                  <SelectItem value="at-risk">En riesgo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando proyectos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos todavía'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Intenta con otro término de búsqueda'
                  : 'Comienza creando tu primer proyecto para organizar tareas y colaborar con tu equipo.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Tu Primer Proyecto
                </Button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          <Link
                            href={`/projects/${project.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {project.name}
                          </Link>
                        </CardTitle>

                        {/* Space Badge */}
                        {project.space && (
                          <div className="mt-2">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `${project.space.color}15`,
                                color: project.space.color,
                                borderColor: `${project.space.color}30`
                              }}
                            >
                              {(() => {
                                const IconComponent = project.space.icon
                                  ? (LucideIcons as any)[project.space.icon] || Folder
                                  : Folder
                                return (
                                  <>
                                    <IconComponent className="h-3 w-3 mr-1" style={{ color: project.space.color }} />
                                    {project.space.name}
                                  </>
                                )
                              })()}
                            </Badge>
                          </div>
                        )}

                        <CardDescription className="mt-1 line-clamp-2">
                          {project.description || 'Sin descripción'}
                        </CardDescription>

                        {/* Owner Info */}
                        {(() => {
                          const owner = project.members?.find(m => m.role === 'OWNER')
                          return owner ? (
                            <div className="flex items-center gap-1.5 mt-3 text-xs text-green-700">
                              <Users className="h-3.5 w-3.5" />
                              <span className="font-semibold">Propietario:</span>
                              <span className="font-medium">{owner.user.name || owner.user.email}</span>
                            </div>
                          ) : null
                        })()}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {isProjectOwnerOrAdmin(project as any) && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => handleEdit(e, project as any)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar proyecto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleMembers(e, project as any)}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Gestionar miembros
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => handleDelete(e, project as any)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar proyecto
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div>
                      {/* Tasks and Progress */}
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">
                          Tareas {project.completedTasks}/{project.totalTasks}
                        </span>
                        <span className="text-gray-600">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-sm text-gray-700">Proyecto</th>
                    <th className="text-left p-4 font-semibold text-sm text-gray-700">Espacio</th>
                    <th className="text-left p-4 font-semibold text-sm text-gray-700">Propietario</th>
                    <th className="text-center p-4 font-semibold text-sm text-gray-700">Progreso</th>
                    <th className="text-center p-4 font-semibold text-sm text-gray-700">Tareas</th>
                    <th className="text-center p-4 font-semibold text-sm text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <td className="p-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {project.description || 'Sin descripción'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {project.space ? (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${project.space.color}15`,
                              color: project.space.color,
                              borderColor: `${project.space.color}30`
                            }}
                          >
                            {(() => {
                              const IconComponent = project.space.icon
                                ? (LucideIcons as any)[project.space.icon] || Folder
                                : Folder
                              return (
                                <>
                                  <IconComponent className="h-3 w-3 mr-1" style={{ color: project.space.color }} />
                                  {project.space.name}
                                </>
                              )
                            })()}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">Sin espacio</span>
                        )}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const owner = project.members?.find(m => m.role === 'OWNER')
                          return owner ? (
                            <span className="text-sm text-gray-600">
                              {owner.user.name || owner.user.email}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Sin propietario</span>
                          )
                        })()}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">{project.progress}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">{project.totalTasks}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                              {isProjectOwnerOrAdmin(project as any) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={(e) => handleEdit(e, project as any)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar proyecto
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => handleMembers(e, project as any)}
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    Gestionar miembros
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => handleDelete(e, project as any)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar proyecto
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />

      {selectedProject && (
        <>
          <EditProjectModal
            project={selectedProject as any}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onProjectUpdated={(updatedProject) => {
              console.log('Project updated:', updatedProject)
              refreshProjects()
            }}
          />

          <ManageProjectMembersModal
            open={showMembersModal}
            onOpenChange={setShowMembersModal}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            spaceId={selectedProject.spaceId}
            isSpacePublic={selectedProject.space?.isPublic}
            onMembersUpdated={() => {
              console.log('Project members updated')
            }}
          />
        </>
      )}

      <ConfirmationDialog />
    </MainLayout>
  )
}
