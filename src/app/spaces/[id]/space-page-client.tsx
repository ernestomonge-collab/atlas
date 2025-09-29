'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { AddMemberModal } from '@/components/spaces/add-member-modal'
import { MainLayout } from '@/components/layout/main-layout'
import { getMockSpaceById, getMockProjectsBySpaceId, getMockSpaceAnalytics, MOCK_USER } from '@/lib/mock-data'
import { SpaceMember } from '@/types'
import * as LucideIcons from 'lucide-react'
import { Building2, Plus, Home, ChevronRight, BarChart3, Users, Clock, CheckCircle, UserPlus } from 'lucide-react'

export function SpacePageClient({ spaceId }: { spaceId: string }) {
  // Use mock user for demo
  const session = { user: MOCK_USER }
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  const space = getMockSpaceById(spaceId)
  const [spaceMembers, setSpaceMembers] = useState(space?.members || [])
  const projects = getMockProjectsBySpaceId(spaceId)
  const analytics = getMockSpaceAnalytics(spaceId)

  // Remove auth redirect - using mock data

  if (!space) {
    notFound()
  }

  const handleProjectCreated = () => {
    // In a real app, this would refresh the projects
    console.log('Project created for space:', space.id)
  }

  const handleMemberAdded = (newMember: SpaceMember) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSpaceMembers(prevMembers => [...prevMembers, newMember as any])
    console.log('Member added to space:', newMember)
  }

  // Dynamically get Lucide icon
  const IconComponent = LucideIcons[space.icon as keyof typeof LucideIcons] || LucideIcons.Folder

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <MainLayout
      title={space.name}
      description={space.description || 'Space overview and projects'}
    >
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{space.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
              <CardTitle className="text-2xl">{space.name}</CardTitle>
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
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </CardHeader>
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
            <Button onClick={() => setShowAddMemberModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
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
                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Added {new Date(member.addedAt).toLocaleDateString()}
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

      {/* Projects Section */}
      <Card>
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
              <p className="text-gray-500 mb-6">
                Get started by creating your first project in the {space.name} space.
                You can organize tasks, manage sprints, and collaborate with your team.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Project
              </Button>
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
                        {project.totalTasks} tasks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{project.completedTasks} completed</span>
                        <span>{project.totalTasks - project.completedTasks} remaining</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />

      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        onMemberAdded={handleMemberAdded}
        spaceName={space.name}
      />
    </MainLayout>
  )
}