'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MainLayout } from '@/components/layout/main-layout'
import { SpaceCard } from '@/components/spaces/space-card'
import { CreateSpaceModal } from '@/components/spaces/create-space-modal'
import { EditSpaceModal } from '@/components/spaces/edit-space-modal'
import { useSpaces } from '@/hooks/use-spaces'
import { useConfirm } from '@/hooks/use-confirm'
import { Space } from '@/types'
import { toast } from 'sonner'
import { Layers, Plus, Building2, BarChart3, Users, Clock, Search, X, LayoutGrid, List, Copy, Edit, Trash2, MoreVertical, Lock, Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function SpacesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { spaces, isLoading, refreshSpaces } = useSpaces()
  const { confirm, ConfirmationDialog } = useConfirm()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  // Session is guaranteed by middleware, but add safety check
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Filter spaces by search query
  const filteredSpaces = spaces.filter(space => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return space.name.toLowerCase().includes(query) ||
           space.description?.toLowerCase().includes(query)
  })

  // Helper to check if user is owner/admin of a space
  const isSpaceOwnerOrAdmin = (space: Space) => {
    const currentUserId = parseInt(session?.user?.id || '0')
    const hasAccess = space.members?.some(
      member => member.userId === currentUserId &&
                (member.role === 'OWNER' || member.role === 'ADMIN')
    )

    // Debug logging
    console.log(`[isSpaceOwnerOrAdmin] Space: ${space.name}`)
    console.log(`  Current User ID: ${currentUserId}`)
    console.log(`  Space Members:`, space.members)
    console.log(`  Has Access: ${hasAccess}`)

    return hasAccess
  }

  // Helper to get the space owner/admin
  const getSpaceOwnerOrAdmin = (space: Space) => {
    // First try to find OWNER
    const owner = space.members?.find(member => member.role === 'OWNER')
    if (owner) return owner.user

    // If no owner, find first ADMIN
    const admin = space.members?.find(member => member.role === 'ADMIN')
    if (admin) return admin.user

    return null
  }

  const handleSpaceCreated = () => {
    refreshSpaces()
  }

  const handleDuplicateSpace = async (space: Space) => {
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${space.name} (Copia)`,
          description: space.description,
          color: space.color,
          icon: space.icon,
        }),
      })

      if (response.ok) {
        toast.success('Espacio duplicado exitosamente')
        refreshSpaces()
      } else {
        console.error('Failed to duplicate space')
        toast.error('Error al duplicar el espacio. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error duplicating space:', error)
      toast.error('Error al duplicar el espacio. Por favor intenta de nuevo.')
    }
  }

  const handleDeleteSpace = async (space: Space) => {
    const confirmed = await confirm({
      title: 'Eliminar espacio',
      description: `¿Estás seguro de que quieres eliminar el espacio "${space.name}"? Esta acción no se puede deshacer y eliminará todos los proyectos asociados.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/spaces/${space.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Espacio eliminado exitosamente')
        refreshSpaces()
      } else {
        console.error('Failed to delete space')
        toast.error('Error al eliminar el espacio. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('Error deleting space:', error)
      toast.error('Error al eliminar el espacio. Por favor intenta de nuevo.')
    }
  }

  return (
    <MainLayout
      title="Espacios"
      description="Organiza tu trabajo en espacios temáticos con proyectos relacionados"
    >

      {/* Spaces Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todos los Espacios</CardTitle>
                <CardDescription>
                  {filteredSpaces.length > 0
                    ? `${filteredSpaces.length} espacio${filteredSpaces.length !== 1 ? 's' : ''} ${searchQuery ? 'encontrado(s)' : 'en tu organización'}`
                    : searchQuery ? 'No se encontraron espacios' : 'No hay espacios creados'
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
                  Nuevo Espacio
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar espacios por nombre..."
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando espacios...</p>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No se encontraron espacios' : 'No hay espacios todavía'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? 'Intenta con otro término de búsqueda'
                  : 'Comienza creando tu primer espacio. Los espacios te ayudan a organizar proyectos por equipos, departamentos o como mejor funcione para tu organización.'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Tu Primer Espacio
                </Button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  space={space as any}
                  onDuplicate={() => handleDuplicateSpace(space)}
                  onDelete={() => handleDeleteSpace(space)}
                  onSpaceUpdated={refreshSpaces}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-sm text-gray-700">Espacio</th>
                    <th className="text-left p-4 font-semibold text-sm text-gray-700">Descripción</th>
                    <th className="text-left p-4 font-semibold text-sm text-gray-700">Administrador</th>
                    <th className="text-center p-4 font-semibold text-sm text-gray-700">Proyectos</th>
                    <th className="text-center p-4 font-semibold text-sm text-gray-700">Miembros</th>
                    <th className="text-center p-4 font-semibold text-sm text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpaces.map((space) => (
                    <tr
                      key={space.id}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/spaces/${space.id}`)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `${space.color}20` }}
                          >
                            <Layers className="h-5 w-5" style={{ color: space.color }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{space.name}</h3>
                            {space.isPublic ? (
                              <Globe className="h-3.5 w-3.5 text-green-600" title="Espacio público" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-orange-600" title="Espacio privado" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {space.description || 'Sin descripción'}
                        </p>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const admin = getSpaceOwnerOrAdmin(space)
                          return admin ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-blue-600">
                                  {admin.name?.charAt(0) || admin.email?.charAt(0)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700">{admin.name || admin.email}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin administrador</span>
                          )
                        })()}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">{space._count?.projects || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">{space._count?.members || 0}</span>
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
                              {isSpaceOwnerOrAdmin(space) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedSpace(space)
                                      setShowEditModal(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar espacio
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDuplicateSpace(space)
                                    }}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicar espacio
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSpace(space)
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar espacio
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

      <CreateSpaceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSpaceCreated={handleSpaceCreated}
      />

      {selectedSpace && (
        <EditSpaceModal
          space={selectedSpace}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSpaceUpdated={refreshSpaces}
        />
      )}

      <ConfirmationDialog />
    </MainLayout>
  )
}