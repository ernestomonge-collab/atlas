'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Project } from '@/types'
import { Building2, Plus, Users, Calendar, CheckCircle, Clock, MoreVertical, Edit, Trash2 } from 'lucide-react'

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { projects, isLoading, refreshProjects } = useProjects()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

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

  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement delete confirmation modal
    console.log('Delete project:', project.id)
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
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Todos los Proyectos</h2>
          <p className="text-gray-600">
            {projects.length > 0
              ? `Tienes ${projects.length} proyecto${projects.length !== 1 ? 's' : ''} activo${projects.length !== 1 ? 's' : ''}`
              : 'Aún no tienes proyectos creados'
            }
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando proyectos...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes proyectos aún
            </h3>
            <p className="text-gray-500 mb-6">
              Crea tu primer proyecto para empezar a organizar tareas y colaborar con tu equipo.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Tu Primer Proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
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
                    {project.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {project.totalTasks} tareas
                    </Badge>
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
                        <DropdownMenuItem onClick={(e) => handleEdit(e, project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar proyecto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleMembers(e, project)}>
                          <Users className="mr-2 h-4 w-4" />
                          Gestionar miembros
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => handleDelete(e, project)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar proyecto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Section */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(project.progress)}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {project.completedTasks}
                      </div>
                      <div className="text-xs text-gray-500">Completadas</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-600">
                        {project.totalTasks - project.completedTasks}
                      </div>
                      <div className="text-xs text-gray-500">Pendientes</div>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />

      {selectedProject && (
        <>
          <EditProjectModal
            project={selectedProject}
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
          />
        </>
      )}
    </MainLayout>
  )
}