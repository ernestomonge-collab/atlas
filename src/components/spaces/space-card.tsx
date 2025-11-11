'use client'

import React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
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
  space: Space
  onDuplicate?: () => void
  onDelete?: () => void
  onSpaceUpdated?: () => void
}

export function SpaceCard({ space, onDuplicate, onDelete, onSpaceUpdated }: SpaceCardProps) {
  const { data: session } = useSession()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  // Check if current user is owner or admin of this space
  const isSpaceOwnerOrAdmin = space.members?.some(
    member => member.userId === parseInt(session?.user?.id || '0') &&
              (member.role === 'OWNER' || member.role === 'ADMIN')
  )

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
    onSpaceUpdated?.()
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {React.createElement(IconComponent as any, {
                className: "h-6 w-6",
                style: { color: space.color }
              })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                  <Link href={`/spaces/${space.id}`}>
                    {space.name}
                  </Link>
                </CardTitle>
                {space.isPublic ? (
                  <LucideIcons.Globe className="h-3.5 w-3.5 text-green-600 flex-shrink-0" title="Espacio público" />
                ) : (
                  <LucideIcons.Lock className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" title="Espacio privado" />
                )}
              </div>
              {space.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {space.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
                {isSpaceOwnerOrAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={handleEdit}
                    >
                      <LucideIcons.Edit className="mr-2 h-4 w-4" />
                      Editar espacio
                    </DropdownMenuItem>
                    {onDuplicate && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDuplicate()
                        }}
                      >
                        <LucideIcons.Copy className="mr-2 h-4 w-4" />
                        Duplicar espacio
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onDelete()
                        }}
                      >
                        <LucideIcons.Trash2 className="mr-2 h-4 w-4" />
                        Eliminar espacio
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Space Stats */}
          <div className="grid grid-cols-2 gap-4 text-center py-2">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {space._count?.projects || 0}
              </div>
              <div className="text-xs text-gray-500">Proyectos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {space._count?.members || 0}
              </div>
              <div className="text-xs text-gray-500">Miembros</div>
            </div>
          </div>

          {/* Space Admin */}
          {(() => {
            // First try to find OWNER
            const owner = space.members?.find(member => member.role === 'OWNER')
            const admin = owner || space.members?.find(member => member.role === 'ADMIN')
            const user = admin?.user

            return user ? (
              <div className="pt-3 border-t">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-green-700">
                      {user.name?.charAt(0) || user.email?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-500">Administrador</p>
                  </div>
                </div>
              </div>
            ) : null
          })()}
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
        spaceId={space.id.toString()}
        existingMembers={space.members || []}
      />
    </Card>
  )
}