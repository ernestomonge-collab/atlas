'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddMemberModal } from '@/components/spaces/add-member-modal'
import { MainLayout } from '@/components/layout/main-layout'
import { SpaceMember } from '@/types'
import * as LucideIcons from 'lucide-react'
import { Building2, ArrowLeft, Loader2, Users, UserPlus, Layout, Lock, Globe } from 'lucide-react'

interface SpaceData {
  id: number
  name: string
  description?: string
  color?: string
  icon?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  members: SpaceMember[]
  template?: {
    id: number
    name: string
    description?: string
    icon: string
    color: string
    category: string
    states: Array<{
      id: number
      name: string
      color: string
      order: number
    }>
  } | null
  projects: Array<{
    id: number
    name: string
    description?: string
    _count: {
      tasks: number
      members: number
    }
  }>
}

export function SpacePageClient({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [space, setSpace] = useState<SpaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([])
  const [mounted, setMounted] = useState(false)

  // Check if current user is owner or admin of this space
  const isSpaceOwnerOrAdmin = spaceMembers?.some(
    member => member.userId === parseInt(session?.user?.id || '0') &&
              (member.role === 'OWNER' || member.role === 'ADMIN')
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchSpaceData()
  }, [spaceId])

  const fetchSpaceData = async () => {
    try {
      setIsLoading(true)

      // First load: Get space info WITHOUT projects (faster)
      const response = await fetch(`/api/spaces/${spaceId}?includeProjects=false`)

      if (!response.ok) {
        if (response.status === 404) {
          notFound()
        }
        throw new Error('Failed to fetch space')
      }

      const data = await response.json()
      setSpace(data)
      setSpaceMembers(data.members || [])
      setIsLoading(false)

      // Second load: Get projects in background (lazy)
      const projectsResponse = await fetch(`/api/spaces/${spaceId}`)
      if (projectsResponse.ok) {
        const fullData = await projectsResponse.json()
        setSpace(fullData)
      }
    } catch (error) {
      console.error('Error fetching space:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout title="Loading..." description="Loading space details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  if (!space) {
    notFound()
  }

  const handleMemberAdded = (newMember: SpaceMember) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSpaceMembers(prevMembers => [...prevMembers, newMember as any])
    // Refresh space data
    fetchSpaceData()
  }

  // Dynamically get Lucide icon
  const IconComponent = LucideIcons[(space.icon || 'Folder') as keyof typeof LucideIcons] || LucideIcons.Folder
  const projects = space.projects || []

  return (
    <MainLayout
      title={space.name}
      description={space.description || 'Space overview and projects'}
    >
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/spaces"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Espacios
        </Link>
      </div>

      {/* Space Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div
              className="p-4 rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${space.color}20` }}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {React.createElement(IconComponent as any, {
                className: "h-8 w-8",
                style: { color: space.color }
              })}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{space.name}</CardTitle>
                {space.isPublic ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                    <Globe className="h-3 w-3 mr-1" />
                    Público
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    <Lock className="h-3 w-3 mr-1" />
                    Privado
                  </Badge>
                )}
              </div>
              {space.description && (
                <CardDescription className="mt-2 text-base">
                  {space.description}
                </CardDescription>
              )}
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span>Created {new Date(space.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Updated {new Date(space.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Template Section - Integrated */}
        {space.template && (
          <CardContent className="pt-0">
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-lg">Plantilla del Espacio</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Plantilla por defecto para nuevos proyectos en este espacio
              </p>

              {/* Template Info */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="p-4 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${space.template.color}20` }}
                  >
                    {(() => {
                      const TemplateIcon = LucideIcons[space.template.icon as keyof typeof LucideIcons] || LucideIcons.Folder
                      return React.createElement(TemplateIcon as any, {
                        className: "h-6 w-6",
                        style: { color: space.template.color }
                      })
                    })()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{space.template.name}</h4>
                    {space.template.description && (
                      <p className="text-sm text-gray-600 mt-1">{space.template.description}</p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {space.template.category}
                    </Badge>
                  </div>
                </div>

                {/* Template States - Inside gray section */}
                {space.template.states && space.template.states.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {space.template.states.map((state) => (
                      <Badge
                        key={state.id}
                        variant="outline"
                        className="px-3 py-1.5"
                        style={{
                          borderColor: state.color,
                          color: state.color,
                          backgroundColor: `${state.color}10`
                        }}
                      >
                        {state.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Projects Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projects in {space.name}</CardTitle>
              <CardDescription>
                {projects.length > 0
                  ? `${projects.length} project${projects.length !== 1 ? 's' : ''} in this space`
                  : `No projects yet in this space`
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects in this space yet
              </h3>
              <p className="text-gray-500">
                Projects in this space can be created from the Projects page.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          <Link
                            href={`/projects/${project.id}`}
                            className="hover:text-blue-600"
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
                      <Badge variant="secondary">
                        {project._count.tasks} tasks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tasks</span>
                        <span className="font-medium">{project._count.tasks}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Members</span>
                        <span className="font-medium">{project._count.members}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Space Members
              </CardTitle>
              <CardDescription>
                {spaceMembers?.length > 0
                  ? `${spaceMembers.length} member${spaceMembers.length !== 1 ? 's' : ''} with access to this space`
                  : 'No members in this space'
                }
              </CardDescription>
            </div>
            {/* Only show "Add Member" for private spaces */}
            {isSpaceOwnerOrAdmin && !space?.isPublic && (
              <Button
                onClick={() => setShowAddMemberModal(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {spaceMembers && spaceMembers.length > 0 ? (
            <div className="space-y-3">
              {spaceMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user.name}</p>
                      <p className="text-sm text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={member.role === 'ADMIN' || member.role === 'OWNER' ? 'default' : 'secondary'}>
                      {member.role === 'OWNER' ? 'Owner' : member.role === 'ADMIN' ? 'Admin' : 'Miembro'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Added {new Date(member.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No members in this space yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {mounted && (
        <AddMemberModal
          open={showAddMemberModal}
          onOpenChange={setShowAddMemberModal}
          onMemberAdded={handleMemberAdded}
          spaceName={space.name}
          spaceId={spaceId}
          existingMembers={spaceMembers}
        />
      )}
    </MainLayout>
  )
}