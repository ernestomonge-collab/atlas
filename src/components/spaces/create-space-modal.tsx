'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Space } from '@/types'
import { Badge } from '@/components/ui/badge'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateSpaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSpaceCreated: (space: Space) => void
}

// Predefined colors for spaces
const SPACE_COLORS = [
  { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Yellow', value: '#F59E0B', bg: 'bg-yellow-500' },
  { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Red', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
  { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
  { name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
]

// Predefined icons for spaces
const SPACE_ICONS = [
  'Folder', 'Code', 'Settings', 'Megaphone', 'Users', 'Building2',
  'Layers', 'Target', 'BarChart3', 'Zap', 'Heart', 'Star',
  'Briefcase', 'Globe', 'Palette', 'Database', 'Shield', 'Lightbulb',
  'Rocket', 'Camera', 'Music', 'GameController2', 'Book', 'Coffee'
]

export function CreateSpaceModal({ open, onOpenChange, onSpaceCreated }: CreateSpaceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6', // Default blue
    icon: 'Folder'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create new space object
      const newSpace = {
        id: `space-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon,
        organizationId: 'org-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projects: [],
        members: [],
        analytics: {
          totalProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          overallProgress: 0
        }
      }

      // Call the callback function
      onSpaceCreated(newSpace)

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        icon: 'Folder'
      })

      // Close modal
      onOpenChange(false)

    } catch (error) {
      console.error('Error creating space:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'Folder'
    })
    onOpenChange(false)
  }

  // Get the selected icon component
  const SelectedIcon = LucideIcons[formData.icon as keyof typeof LucideIcons] || LucideIcons.Folder

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Create a new space to organize related projects and collaborate with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Space Preview */}
            <div className="flex items-center space-x-4 p-4 border rounded-lg bg-gray-50">
              <div
                className="p-3 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                <SelectedIcon
                  className="h-6 w-6"
                  style={{ color: formData.color }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {formData.name || 'Space Name'}
                </h3>
                <p className="text-sm text-gray-500">
                  {formData.description || 'Space description will appear here'}
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Space Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter space name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this space"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="grid gap-3">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-5 gap-3">
                {SPACE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      "relative p-3 rounded-lg border-2 transition-all hover:scale-105",
                      formData.color === color.value
                        ? "border-gray-900 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                  >
                    <div className={cn("w-full h-8 rounded", color.bg)} />
                    <span className="text-xs text-gray-600 mt-1 block">{color.name}</span>
                    {formData.color === color.value && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="default" className="h-5 w-5 p-0 rounded-full">
                          ✓
                        </Badge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="grid gap-3">
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {SPACE_ICONS.map((iconName) => {
                  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons]
                  return (
                    <button
                      key={iconName}
                      type="button"
                      className={cn(
                        "p-2 rounded border transition-all hover:bg-gray-50",
                        formData.icon === iconName
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      )}
                      onClick={() => setFormData({ ...formData, icon: iconName })}
                      title={iconName}
                    >
                      {IconComponent && <IconComponent className="h-4 w-4 mx-auto" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <LucideIcons.Plus className="mr-2 h-4 w-4" />
                  Create Space
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}