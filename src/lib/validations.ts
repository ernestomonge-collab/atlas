import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const statusSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  order: z.number()
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  type: z.enum(['INTERNAL', 'DEPARTMENT', 'CLIENT'], {
    required_error: 'Project type is required',
  }),
  methodology: z.enum(['SCRUM', 'KANBAN', 'HYBRID', 'WATERFALL', 'OTHER'], {
    required_error: 'Project methodology is required',
  }),
  projectType: z.enum(['Desarrollo de Software', 'Marketing', 'Diseño', 'General']).optional(),
  customStatuses: z.array(statusSchema).optional(),
  targetEntity: z.string().optional(), // For department name or client name
  internalUserId: z.string().optional(), // For internal user projects
}).refine((data) => {
  // If type is DEPARTMENT or CLIENT, targetEntity is required
  if ((data.type === 'DEPARTMENT' || data.type === 'CLIENT') && !data.targetEntity?.trim()) {
    return false;
  }
  return true;
}, {
  message: 'This field is required for the selected project type',
  path: ['targetEntity'],
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type TaskInput = z.infer<typeof taskSchema>