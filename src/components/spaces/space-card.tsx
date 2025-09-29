'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as LucideIcons from 'lucide-react'
import { Space, SpaceMember } from '@/types'
import { EditSpaceModal } from './edit-space-modal'
import { AddMemberModal } from './add-member-modal'

interface SpaceCardProps {
  space: Space & {
    projects: Array<{
      id: string
      name: string
      totalTasks: number
      completedTasks: number
      progress: number
    }>
    analytics: {
      totalProjects: number
      totalTasks: number
      completedTasks: number
      inProgressTasks: number
      pendingTasks: number
      overallProgress: number
    }
  }
}

export function SpaceCard({ space }: SpaceCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  // Dynamically get Lucide icon
  const IconComponent = LucideIcons[space.icon as keyof typeof LucideIcons] || LucideIcons.Folder

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handleMembers = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMembersModal(true)
  }

  const handleSpaceUpdated = (updatedSpace: Space) => {
    console.log('Space updated:', updatedSpace)
    // TODO: Update space in parent component or refresh data
  }

  const handleMemberAdded = (newMember: SpaceMember) => {
    console.log('Member added:', newMember)
    // TODO: Update space members or refresh data
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on the card itself, not the dropdown
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]')) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div
              className="p-3 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${space.color}20` }}
            >
              <IconComponent
                className="h-6 w-6"
                style={{ color: space.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                <Link href={`/spaces/${space.id}`}>
                  {space.name}
                </Link>
              </CardTitle>
              {space.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {space.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {space.analytics.totalProjects} {space.analytics.totalProjects === 1 ? 'project' : 'projects'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-dropdown-trigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <LucideIcons.MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEdit}>
                  <LucideIcons.Edit className="mr-2 h-4 w-4" />
                  Editar espacio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMembers}>
                  <LucideIcons.Users className="mr-2 h-4 w-4" />
                  Gestionar miembros
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LucideIcons.Trash2 className="mr-2 h-4 w-4" />
                  Eliminar espacio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Projects List Preview */}
          {space.projects.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Recent Projects:</div>
              <div className="space-y-1">
                {space.projects.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block text-xs text-gray-600 hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    • {project.name}
                  </Link>
                ))}
                {space.projects.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{space.projects.length - 3} more projects
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Modals */}
      <EditSpaceModal
        space={space}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSpaceUpdated={handleSpaceUpdated}
      />

      <AddMemberModal
        open={showMembersModal}
        onOpenChange={setShowMembersModal}
        onMemberAdded={handleMemberAdded}
        spaceName={space.name}
      />
    </Card>
  )
}