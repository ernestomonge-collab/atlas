'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskPriority } from '@prisma/client'
import { User, ProjectMember, Sprint } from '@/types'
import { Loader2, ListTodo } from 'lucide-react'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
})

type TaskInput = z.infer<typeof taskSchema>

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: TaskPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  projectId: string
}

interface CreateTaskModalProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: (task: Task) => void
}

interface User {
  id: string
  name?: string
  email: string
}

interface Sprint {
  id: string
  name: string
  status: string
}

export function CreateTaskModal({
  projectId,
  open,
  onOpenChange,
  onTaskCreated
}: CreateTaskModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: TaskPriority.MEDIUM,
    },
  })

  const priority = watch('priority')
  const assigneeId = watch('assigneeId')
  const sprintId = watch('sprintId')

  useEffect(() => {
    if (open) {
      fetchTeamMembers()
      fetchSprints()
    }
  }, [open])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const projectMembers = await response.json()
        // Extract user data from project members
        const users = projectMembers.map((member: ProjectMember) => member.user)
        setTeamMembers(users)
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error)
    }
  }

  const fetchSprints = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sprints`)
      if (response.ok) {
        const sprintsData = await response.json()
        // Only show active and planning sprints
        const availableSprints = sprintsData.filter((sprint: Sprint) =>
          sprint.status === 'PLANNING' || sprint.status === 'ACTIVE'
        )
        setSprints(availableSprints)
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error)
    }
  }

  const onSubmit = async (data: TaskInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const task = await response.json()
      onTaskCreated(task)
      reset()
      onOpenChange(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-600" />
            <DialogTitle>Create New Task</DialogTitle>
          </div>
          <DialogDescription>
            Add a new task to organize and track work in your project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              {...register('title')}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the task (optional)"
              rows={3}
              {...register('description')}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="text-gray-600">Low</span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="text-yellow-600">Medium</span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="text-orange-600">High</span>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <span className="text-red-600">Urgent</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={assigneeId || ''}
                onValueChange={(value) => setValue('assigneeId', value || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No assignee</SelectItem>
                  {teamMembers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint">Sprint</Label>
              <Select
                value={sprintId || ''}
                onValueChange={(value) => setValue('sprintId', value || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No sprint</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status.toLowerCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}