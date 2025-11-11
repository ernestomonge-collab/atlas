// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  organizationId: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  READ_ONLY = 'READ_ONLY'
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Space Types (NEW LEVEL)
export interface Space {
  id: string;
  name: string;
  description?: string;
  color?: string; // Corporate blue default
  icon?: string; // Lucide icon name
  tags?: string[]; // Tags/labels for the space
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  projects: Project[];
  members: SpaceMember[];
}

export interface SpaceMember {
  id: string;
  role: SpaceRole;
  joinedAt: Date;
  updatedAt: Date;
  spaceId: string;
  userId: string;
  user: User;
}

export enum SpaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

// Project Types (Updated to include spaceId)
export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  spaceId: string; // NEW: Projects now belong to Spaces
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
  members: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  role: ProjectRole;
  joinedAt: Date;
  updatedAt: Date;
  projectId: string;
  userId: string;
  user: User;
}

export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}


// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId: string;
  sprintId?: string;
  epicId?: string;
  assigneeId?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: User;
  createdBy: User;
  epic?: Epic;
  comments: Comment[];
  attachments: Attachment[];
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}

// Attachment Types
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size?: number;
  mimeType?: string;
  taskId: string;
  uploadedById: string;
  uploadedBy: User;
  createdAt: Date;
}

// Invitation Types
export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  organizationId: string;
  invitedById: string;
  invitedBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED'
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  userId: string;
  user: User;
  taskId?: string;
  projectId?: string;
  task?: Task;
  project?: Project;
  createdAt: Date;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED'
}

// Progress Calculation Types
export interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  percentage: number;
}

// Sprint Types
export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  projectId: string;
  tasks: Task[];
}

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Epic Types
export interface Epic {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: EpicStatus;
  startDate?: Date;
  targetDate?: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: Task[];
}

export enum EpicStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

// Calendar Types
export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectName: string;
  assignee?: User;
}

// Dashboard Types
export interface DashboardData {
  spaces: Space[];
  recentProjects: Project[];
  recentTasks: Task[];
  notifications: Notification[];
  progressStats: ProgressStats;
}

// Template Types
export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  icon?: string; // Lucide icon name
  color?: string;
  isDefault: boolean; // System templates vs custom templates
  organizationId?: string; // null for system templates
  states: TemplateState[];
  createdById?: string;
  createdBy?: User;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number; // How many times this template has been used
}

export interface TemplateState {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean; // Default state for new tasks
}

export enum TemplateCategory {
  DESARROLLO_SOFTWARE = 'DESARROLLO_SOFTWARE',
  MARKETING = 'MARKETING',
  DISENO = 'DISENO',
  VENTAS = 'VENTAS',
  OPERACIONES = 'OPERACIONES',
  RECURSOS_HUMANOS = 'RECURSOS_HUMANOS',
  GENERAL = 'GENERAL',
  PERSONALIZADO = 'PERSONALIZADO'
}