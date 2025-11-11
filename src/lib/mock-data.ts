// Mock data service for demo purposes with SPACES hierarchy
import { TaskStatus, TaskPriority, ProjectTemplate, TemplateCategory, TemplateState } from '@/types'
export const MOCK_USER = {
  id: 'user-1',
  name: 'Juan Pérez',
  email: 'juan.perez@empresa.com',
  role: 'ADMIN' as const,
  organizationId: 'org-1',
  organization: {
    id: 'org-1',
    name: 'Mi Empresa Tech',
    createdAt: '2024-01-15T10:00:00Z'
  }
}

// MOCK SPACES - NEW HIERARCHY LEVEL
export const MOCK_SPACES = [
  {
    id: 'space-1',
    name: 'Desarrollo de Producto',
    description: 'Espacio dedicado al desarrollo de todas las funcionalidades principales de la empresa',
    color: '#3B82F6',
    icon: 'Code',
    tags: ['Backend', 'Frontend', 'Mobile'],
    organizationId: 'org-1',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-03-12T14:30:00Z',
    members: [
      {
        id: 'member-1',
        userId: 'user-1',
        spaceId: 'space-1',
        role: 'ADMIN' as const,
        user: {
          id: 'user-1',
          name: 'Juan Pérez',
          email: 'juan.perez@empresa.com',
          avatar: null
        },
        addedAt: '2024-01-10T08:00:00Z'
      },
      {
        id: 'member-2',
        userId: 'user-2',
        spaceId: 'space-1',
        role: 'MEMBER' as const,
        user: {
          id: 'user-2',
          name: 'María García',
          email: 'maria.garcia@empresa.com',
          avatar: null
        },
        addedAt: '2024-01-12T10:15:00Z'
      },
      {
        id: 'member-3',
        userId: 'user-3',
        spaceId: 'space-1',
        role: 'MEMBER' as const,
        user: {
          id: 'user-3',
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@empresa.com',
          avatar: null
        },
        addedAt: '2024-01-15T14:30:00Z'
      }
    ]
  },
  {
    id: 'space-2',
    name: 'Operaciones',
    description: 'Gestión de procesos internos, herramientas y sistemas operativos',
    color: '#10B981',
    icon: 'Settings',
    tags: ['DevOps', 'Infraestructura'],
    organizationId: 'org-1',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-03-08T11:20:00Z',
    members: [
      {
        id: 'member-4',
        userId: 'user-1',
        spaceId: 'space-2',
        role: 'ADMIN' as const,
        user: {
          id: 'user-1',
          name: 'Juan Pérez',
          email: 'juan.perez@empresa.com',
          avatar: null
        },
        addedAt: '2024-01-15T09:30:00Z'
      },
      {
        id: 'member-5',
        userId: 'user-4',
        spaceId: 'space-2',
        role: 'MEMBER' as const,
        user: {
          id: 'user-4',
          name: 'Ana López',
          email: 'ana.lopez@empresa.com',
          avatar: null
        },
        addedAt: '2024-01-16T11:00:00Z'
      }
    ]
  },
  {
    id: 'space-3',
    name: 'Marketing Digital',
    description: 'Campañas, contenido y estrategias de marketing digital',
    color: '#F59E0B',
    icon: 'Megaphone',
    tags: ['SEO', 'Social Media', 'Content'],
    organizationId: 'org-1',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-03-10T16:45:00Z',
    members: [
      {
        id: 'member-6',
        userId: 'user-1',
        spaceId: 'space-3',
        role: 'ADMIN' as const,
        user: {
          id: 'user-1',
          name: 'Juan Pérez',
          email: 'juan.perez@empresa.com',
          avatar: null
        },
        addedAt: '2024-02-01T10:00:00Z'
      },
      {
        id: 'member-7',
        userId: 'user-5',
        spaceId: 'space-3',
        role: 'MEMBER' as const,
        user: {
          id: 'user-5',
          name: 'Diego Morales',
          email: 'diego.morales@empresa.com',
          avatar: null
        },
        addedAt: '2024-02-03T09:15:00Z'
      },
      {
        id: 'member-8',
        userId: 'user-6',
        spaceId: 'space-3',
        role: 'MEMBER' as const,
        user: {
          id: 'user-6',
          name: 'Laura Fernández',
          email: 'laura.fernandez@empresa.com',
          avatar: null
        },
        addedAt: '2024-02-05T15:45:00Z'
      }
    ]
  }
]

export const MOCK_PROJECTS = [
  // Projects in "Desarrollo de Producto" space
  {
    id: 'project-1',
    name: 'Desarrollo E-commerce',
    description: 'Plataforma de comercio electrónico con integración de pagos y gestión de inventario',
    organizationId: 'org-1',
    spaceId: 'space-1', // Desarrollo de Producto
    totalTasks: 24,
    completedTasks: 18,
    progress: 75,
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-03-10T15:30:00Z'
  },
  {
    id: 'project-2',
    name: 'App Móvil CRM',
    description: 'Aplicación móvil para gestión de relaciones con clientes',
    organizationId: 'org-1',
    spaceId: 'space-1', // Desarrollo de Producto
    totalTasks: 16,
    completedTasks: 8,
    progress: 50,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-08T11:20:00Z'
  },
  {
    id: 'project-3',
    name: 'Dashboard Analytics',
    description: 'Panel de control para visualización de métricas y KPIs empresariales',
    organizationId: 'org-1',
    spaceId: 'space-1', // Desarrollo de Producto
    totalTasks: 12,
    completedTasks: 12,
    progress: 100,
    createdAt: '2024-01-10T07:00:00Z',
    updatedAt: '2024-02-28T16:45:00Z'
  },
  // Projects in "Operaciones" space
  {
    id: 'project-4',
    name: 'Sistema de Inventario',
    description: 'Sistema para control y seguimiento de inventario en tiempo real',
    organizationId: 'org-1',
    spaceId: 'space-2', // Operaciones
    totalTasks: 20,
    completedTasks: 5,
    progress: 25,
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-03-12T09:15:00Z'
  },
  {
    id: 'project-5',
    name: 'Automatización DevOps',
    description: 'Implementación de pipelines CI/CD y automatización de despliegues',
    organizationId: 'org-1',
    spaceId: 'space-2', // Operaciones
    totalTasks: 14,
    completedTasks: 9,
    progress: 64,
    createdAt: '2024-02-20T11:00:00Z',
    updatedAt: '2024-03-11T13:45:00Z'
  },
  // Projects in "Marketing Digital" space
  {
    id: 'project-6',
    name: 'Campaña Q2 2024',
    description: 'Estrategia de marketing digital para el segundo trimestre',
    organizationId: 'org-1',
    spaceId: 'space-3', // Marketing Digital
    totalTasks: 8,
    completedTasks: 3,
    progress: 38,
    createdAt: '2024-03-01T09:30:00Z',
    updatedAt: '2024-03-12T16:20:00Z'
  }
]

export const MOCK_TASKS = [
  // Proyecto E-commerce
  {
    id: 'task-1',
    title: 'Implementar carrito de compras',
    description: 'Desarrollar funcionalidad completa del carrito con persistencia y validaciones',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-1',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-03-05T23:59:59Z',
    createdAt: '2024-02-20T08:00:00Z',
    updatedAt: '2024-03-05T14:30:00Z'
  },
  {
    id: 'task-2',
    title: 'Integración pasarela de pago',
    description: 'Integrar Stripe y PayPal como métodos de pago',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'project-1',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-03-15T23:59:59Z',
    createdAt: '2024-02-25T09:00:00Z',
    updatedAt: '2024-03-10T16:20:00Z'
  },
  {
    id: 'task-3',
    title: 'Diseño responsive checkout',
    description: 'Optimizar diseño del proceso de checkout para móviles',
    status: 'PENDING' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-1',
    assigneeId: 'user-4',
    assignee: { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com' },
    dueDate: '2024-03-20T23:59:59Z',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z'
  },
  // Proyecto CRM
  {
    id: 'task-4',
    title: 'Login y autenticación',
    description: 'Sistema de login con biometría y tokens JWT',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-2',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-03-01T23:59:59Z',
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: '2024-02-28T17:45:00Z'
  },
  {
    id: 'task-5',
    title: 'Lista de contactos',
    description: 'Pantalla principal con lista de contactos y búsqueda',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'project-2',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-03-18T23:59:59Z',
    createdAt: '2024-02-15T09:30:00Z',
    updatedAt: '2024-03-12T11:15:00Z'
  },
  // Más tareas para Proyecto E-commerce (project-1)
  {
    id: 'task-6',
    title: 'Sistema de notificaciones',
    description: 'Implementar notificaciones push para pedidos y promociones',
    status: 'PENDING' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-1',
    assigneeId: 'user-1',
    assignee: { id: 'user-1', name: 'Juan Pérez', email: 'juan.perez@empresa.com' },
    dueDate: '2024-03-25T23:59:59Z',
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-03-10T08:00:00Z'
  },
  {
    id: 'task-7',
    title: 'Dashboard de administración',
    description: 'Panel para gestión de productos, pedidos y usuarios',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'project-1',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-03-22T23:59:59Z',
    createdAt: '2024-03-05T09:00:00Z',
    updatedAt: '2024-03-12T15:30:00Z'
  },
  {
    id: 'task-8',
    title: 'Optimización SEO',
    description: 'Optimizar meta tags, estructura HTML y velocidad de carga',
    status: 'COMPLETED' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-1',
    assigneeId: 'user-4',
    assignee: { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com' },
    dueDate: '2024-03-08T23:59:59Z',
    createdAt: '2024-02-28T10:00:00Z',
    updatedAt: '2024-03-08T16:45:00Z'
  },
  {
    id: 'task-9',
    title: 'Integración con inventario',
    description: 'Conectar el e-commerce con el sistema de gestión de inventario',
    status: 'PENDING' as const,
    priority: 'HIGH' as const,
    projectId: 'project-1',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-03-30T23:59:59Z',
    createdAt: '2024-03-12T11:00:00Z',
    updatedAt: '2024-03-12T11:00:00Z'
  },
  {
    id: 'task-10',
    title: 'Sistema de cupones y descuentos',
    description: 'Funcionalidad para crear y aplicar códigos de descuento',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-1',
    assigneeId: 'user-5',
    assignee: { id: 'user-5', name: 'Roberto Silva', email: 'roberto@empresa.com' },
    dueDate: '2024-03-28T23:59:59Z',
    createdAt: '2024-03-08T14:30:00Z',
    updatedAt: '2024-03-11T09:15:00Z'
  },
  // Más tareas para App Móvil CRM (project-2)
  {
    id: 'task-11',
    title: 'Sincronización offline',
    description: 'Permitir uso de la app sin conexión con sincronización posterior',
    status: 'PENDING' as const,
    priority: 'HIGH' as const,
    projectId: 'project-2',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-03-26T23:59:59Z',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z'
  },
  {
    id: 'task-12',
    title: 'Reportes y analytics',
    description: 'Generar reportes de ventas y métricas de contactos',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-2',
    assigneeId: 'user-1',
    assignee: { id: 'user-1', name: 'Juan Pérez', email: 'juan.perez@empresa.com' },
    dueDate: '2024-03-24T23:59:59Z',
    createdAt: '2024-02-20T11:30:00Z',
    updatedAt: '2024-03-10T14:20:00Z'
  },
  {
    id: 'task-13',
    title: 'Integración con calendario',
    description: 'Sincronizar reuniones y tareas con Google Calendar',
    status: 'COMPLETED' as const,
    priority: 'LOW' as const,
    projectId: 'project-2',
    assigneeId: 'user-4',
    assignee: { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com' },
    dueDate: '2024-03-10T23:59:59Z',
    createdAt: '2024-02-25T09:00:00Z',
    updatedAt: '2024-03-09T17:30:00Z'
  },
  {
    id: 'task-14',
    title: 'Chat interno',
    description: 'Sistema de mensajería interna entre miembros del equipo',
    status: 'PENDING' as const,
    priority: 'LOW' as const,
    projectId: 'project-2',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-04-05T23:59:59Z',
    createdAt: '2024-03-12T16:00:00Z',
    updatedAt: '2024-03-12T16:00:00Z'
  },
  // Tareas para Dashboard Analytics (project-3)
  {
    id: 'task-15',
    title: 'Configuración inicial',
    description: 'Setup básico del entorno de desarrollo y base de datos',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-3',
    assigneeId: 'user-1',
    assignee: { id: 'user-1', name: 'Juan Pérez', email: 'juan.perez@empresa.com' },
    dueDate: '2024-01-15T23:59:59Z',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'task-16',
    title: 'Gráficos interactivos',
    description: 'Implementar charts con D3.js para visualización de datos',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-3',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-02-01T23:59:59Z',
    createdAt: '2024-01-20T09:30:00Z',
    updatedAt: '2024-01-30T14:15:00Z'
  },
  {
    id: 'task-17',
    title: 'API de métricas',
    description: 'Endpoints para obtener KPIs y datos de rendimiento',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-3',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-02-10T23:59:59Z',
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-02-08T16:45:00Z'
  },
  // Tareas para Sistema de Inventario (project-4)
  {
    id: 'task-18',
    title: 'Diseño de base de datos',
    description: 'Modelado de entidades y relaciones para el inventario',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-4',
    assigneeId: 'user-1',
    assignee: { id: 'user-1', name: 'Juan Pérez', email: 'juan.perez@empresa.com' },
    dueDate: '2024-02-20T23:59:59Z',
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-02-19T15:20:00Z'
  },
  {
    id: 'task-19',
    title: 'CRUD de productos',
    description: 'Funcionalidades básicas para crear, leer, actualizar y eliminar productos',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'project-4',
    assigneeId: 'user-4',
    assignee: { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com' },
    dueDate: '2024-03-18T23:59:59Z',
    createdAt: '2024-02-25T09:00:00Z',
    updatedAt: '2024-03-12T13:30:00Z'
  },
  {
    id: 'task-20',
    title: 'Sistema de alertas',
    description: 'Notificaciones automáticas para stock bajo y productos vencidos',
    status: 'PENDING' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-4',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-03-25T23:59:59Z',
    createdAt: '2024-03-01T14:00:00Z',
    updatedAt: '2024-03-01T14:00:00Z'
  },
  {
    id: 'task-21',
    title: 'Integración con código de barras',
    description: 'Scanner QR/Código de barras para facilitar la gestión',
    status: 'PENDING' as const,
    priority: 'LOW' as const,
    projectId: 'project-4',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-04-01T23:59:59Z',
    createdAt: '2024-03-05T11:30:00Z',
    updatedAt: '2024-03-05T11:30:00Z'
  },
  // Tareas para Automatización DevOps (project-5)
  {
    id: 'task-22',
    title: 'Pipeline CI/CD',
    description: 'Configurar Jenkins/GitHub Actions para deploy automático',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-5',
    assigneeId: 'user-1',
    assignee: { id: 'user-1', name: 'Juan Pérez', email: 'juan.perez@empresa.com' },
    dueDate: '2024-02-28T23:59:59Z',
    createdAt: '2024-02-20T11:00:00Z',
    updatedAt: '2024-02-27T16:30:00Z'
  },
  {
    id: 'task-23',
    title: 'Contenedorización Docker',
    description: 'Dockerizar todas las aplicaciones para deployment consistente',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'project-5',
    assigneeId: 'user-3',
    assignee: { id: 'user-3', name: 'Carlos López', email: 'carlos@empresa.com' },
    dueDate: '2024-03-20T23:59:59Z',
    createdAt: '2024-02-25T10:30:00Z',
    updatedAt: '2024-03-12T14:45:00Z'
  },
  {
    id: 'task-24',
    title: 'Monitoreo y logs',
    description: 'Implementar ELK Stack para monitoreo y análisis de logs',
    status: 'IN_PROGRESS' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-5',
    assigneeId: 'user-4',
    assignee: { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com' },
    dueDate: '2024-03-25T23:59:59Z',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-11T11:20:00Z'
  },
  // Tareas para Campaña Q2 2024 (project-6)
  {
    id: 'task-25',
    title: 'Estrategia de contenido',
    description: 'Planificar calendario editorial para redes sociales y blog',
    status: 'COMPLETED' as const,
    priority: 'HIGH' as const,
    projectId: 'project-6',
    assigneeId: 'user-5',
    assignee: { id: 'user-5', name: 'Roberto Silva', email: 'roberto@empresa.com' },
    dueDate: '2024-03-08T23:59:59Z',
    createdAt: '2024-03-01T09:30:00Z',
    updatedAt: '2024-03-07T15:45:00Z'
  },
  {
    id: 'task-26',
    title: 'Diseño de creatividades',
    description: 'Crear banners, posts y material gráfico para la campaña',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
    projectId: 'project-6',
    assigneeId: 'user-4',
    assignee: { id: 'user-4', name: 'Ana Martínez', email: 'ana@empresa.com' },
    dueDate: '2024-03-20T23:59:59Z',
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-12T16:30:00Z'
  },
  {
    id: 'task-27',
    title: 'Setup Google Ads',
    description: 'Configurar campañas publicitarias en Google Ads y Facebook',
    status: 'PENDING' as const,
    priority: 'MEDIUM' as const,
    projectId: 'project-6',
    assigneeId: 'user-2',
    assignee: { id: 'user-2', name: 'María García', email: 'maria@empresa.com' },
    dueDate: '2024-03-22T23:59:59Z',
    createdAt: '2024-03-10T11:15:00Z',
    updatedAt: '2024-03-10T11:15:00Z'
  }
]

// MOCK SUBTASKS
export const MOCK_SUBTASKS = [
  // Subtareas para "Implementar carrito de compras" (task-1)
  {
    id: 'subtask-1',
    title: 'Diseñar estructura de datos del carrito',
    description: 'Definir el schema para almacenar productos en el carrito',
    status: 'COMPLETED' as const,
    taskId: 'task-1',
    order: 0,
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-02-21T14:30:00Z'
  },
  {
    id: 'subtask-2',
    title: 'Crear componente visual del carrito',
    description: 'Desarrollar la interfaz para mostrar productos agregados',
    status: 'COMPLETED' as const,
    taskId: 'task-1',
    order: 1,
    createdAt: '2024-02-21T10:00:00Z',
    updatedAt: '2024-02-25T16:15:00Z'
  },
  {
    id: 'subtask-3',
    title: 'Implementar persistencia local',
    description: 'Guardar carrito en localStorage para mantener sesión',
    status: 'COMPLETED' as const,
    taskId: 'task-1',
    order: 2,
    createdAt: '2024-02-25T11:30:00Z',
    updatedAt: '2024-03-01T13:45:00Z'
  },
  // Subtareas para "Integración pasarela de pago" (task-2)
  {
    id: 'subtask-4',
    title: 'Configurar cuenta Stripe',
    description: 'Setup inicial de la cuenta y obtener API keys',
    status: 'COMPLETED' as const,
    taskId: 'task-2',
    order: 0,
    createdAt: '2024-02-25T14:00:00Z',
    updatedAt: '2024-02-26T10:20:00Z'
  },
  {
    id: 'subtask-5',
    title: 'Implementar webhook de confirmación',
    description: 'Endpoint para recibir confirmaciones de pago de Stripe',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-2',
    order: 1,
    createdAt: '2024-02-26T15:30:00Z',
    updatedAt: '2024-03-12T11:45:00Z'
  },
  {
    id: 'subtask-6',
    title: 'Agregar soporte para PayPal',
    description: 'Integrar PayPal como método alternativo de pago',
    status: 'PENDING' as const,
    taskId: 'task-2',
    order: 2,
    createdAt: '2024-03-01T09:15:00Z',
    updatedAt: '2024-03-01T09:15:00Z'
  },
  // Subtareas para "Dashboard de administración" (task-7)
  {
    id: 'subtask-7',
    title: 'Crear layout base del dashboard',
    description: 'Estructura general con sidebar y área de contenido',
    status: 'COMPLETED' as const,
    taskId: 'task-7',
    order: 0,
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-08T14:30:00Z'
  },
  {
    id: 'subtask-8',
    title: 'Implementar gestión de productos',
    description: 'CRUD completo para productos del e-commerce',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-7',
    order: 1,
    createdAt: '2024-03-08T11:15:00Z',
    updatedAt: '2024-03-12T16:20:00Z'
  },
  {
    id: 'subtask-9',
    title: 'Módulo de gestión de pedidos',
    description: 'Ver, editar estado y generar reportes de pedidos',
    status: 'PENDING' as const,
    taskId: 'task-7',
    order: 2,
    createdAt: '2024-03-10T13:45:00Z',
    updatedAt: '2024-03-10T13:45:00Z'
  },
  {
    id: 'subtask-10',
    title: 'Panel de usuarios y permisos',
    description: 'Administrar usuarios del sistema y sus roles',
    status: 'PENDING' as const,
    taskId: 'task-7',
    order: 3,
    createdAt: '2024-03-10T14:00:00Z',
    updatedAt: '2024-03-10T14:00:00Z'
  },
  // Subtareas para "Lista de contactos" (task-5)
  {
    id: 'subtask-11',
    title: 'Diseñar API de contactos',
    description: 'Endpoints para CRUD de contactos con filtros',
    status: 'COMPLETED' as const,
    taskId: 'task-5',
    order: 0,
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-20T15:30:00Z'
  },
  {
    id: 'subtask-12',
    title: 'Implementar búsqueda y filtros',
    description: 'Búsqueda por nombre, empresa y tags con autocomplete',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-5',
    order: 1,
    createdAt: '2024-02-20T11:45:00Z',
    updatedAt: '2024-03-12T12:30:00Z'
  },
  {
    id: 'subtask-13',
    title: 'Añadir vista de detalles del contacto',
    description: 'Modal/página con información completa y historial',
    status: 'PENDING' as const,
    taskId: 'task-5',
    order: 2,
    createdAt: '2024-03-01T14:20:00Z',
    updatedAt: '2024-03-01T14:20:00Z'
  },
  // Subtareas para "Pipeline CI/CD" (task-22)
  {
    id: 'subtask-14',
    title: 'Configurar GitHub Actions',
    description: 'Workflow para build automático en push a main',
    status: 'COMPLETED' as const,
    taskId: 'task-22',
    order: 0,
    createdAt: '2024-02-20T12:00:00Z',
    updatedAt: '2024-02-22T10:15:00Z'
  },
  {
    id: 'subtask-15',
    title: 'Setup de testing automático',
    description: 'Ejecutar tests unitarios y de integración en el pipeline',
    status: 'COMPLETED' as const,
    taskId: 'task-22',
    order: 1,
    createdAt: '2024-02-22T13:30:00Z',
    updatedAt: '2024-02-25T16:45:00Z'
  },
  {
    id: 'subtask-16',
    title: 'Deploy automático a staging',
    description: 'Despliegue automático al ambiente de staging',
    status: 'COMPLETED' as const,
    taskId: 'task-22',
    order: 2,
    createdAt: '2024-02-25T09:20:00Z',
    updatedAt: '2024-02-27T14:30:00Z'
  },
  // Más subtareas para "Sistema de notificaciones" (task-6)
  {
    id: 'subtask-17',
    title: 'Configurar Firebase Cloud Messaging',
    description: 'Setup básico de FCM para push notifications',
    status: 'COMPLETED' as const,
    taskId: 'task-6',
    order: 0,
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-11T16:30:00Z'
  },
  {
    id: 'subtask-18',
    title: 'Crear templates de notificaciones',
    description: 'Plantillas para diferentes tipos de notificaciones',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-6',
    order: 1,
    createdAt: '2024-03-11T09:15:00Z',
    updatedAt: '2024-03-13T14:20:00Z'
  },
  {
    id: 'subtask-19',
    title: 'Implementar notificaciones de pedidos',
    description: 'Alertas cuando se realiza un pedido o cambia su estado',
    status: 'PENDING' as const,
    taskId: 'task-6',
    order: 2,
    createdAt: '2024-03-12T11:30:00Z',
    updatedAt: '2024-03-12T11:30:00Z'
  },
  {
    id: 'subtask-20',
    title: 'Notificaciones push para promociones',
    description: 'Sistema para enviar ofertas y descuentos especiales',
    status: 'PENDING' as const,
    taskId: 'task-6',
    order: 3,
    createdAt: '2024-03-12T14:45:00Z',
    updatedAt: '2024-03-12T14:45:00Z'
  },
  // Subtareas para "Sistema de cupones y descuentos" (task-10)
  {
    id: 'subtask-21',
    title: 'Base de datos de cupones',
    description: 'Diseñar tablas para cupones y reglas de validación',
    status: 'COMPLETED' as const,
    taskId: 'task-10',
    order: 0,
    createdAt: '2024-03-08T15:00:00Z',
    updatedAt: '2024-03-09T12:15:00Z'
  },
  {
    id: 'subtask-22',
    title: 'API de validación de cupones',
    description: 'Endpoint para validar códigos y aplicar descuentos',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-10',
    order: 1,
    createdAt: '2024-03-09T14:30:00Z',
    updatedAt: '2024-03-13T10:45:00Z'
  },
  {
    id: 'subtask-23',
    title: 'Interfaz de creación de cupones',
    description: 'Panel admin para crear y gestionar códigos de descuento',
    status: 'PENDING' as const,
    taskId: 'task-10',
    order: 2,
    createdAt: '2024-03-11T16:00:00Z',
    updatedAt: '2024-03-11T16:00:00Z'
  },
  // Subtareas para "Sincronización offline" (task-11)
  {
    id: 'subtask-24',
    title: 'Implementar Redux Persist',
    description: 'Configurar persistencia de estado para modo offline',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-11',
    order: 0,
    createdAt: '2024-03-01T11:00:00Z',
    updatedAt: '2024-03-13T09:30:00Z'
  },
  {
    id: 'subtask-25',
    title: 'Cola de sincronización',
    description: 'Sistema para procesar acciones cuando vuelve la conexión',
    status: 'PENDING' as const,
    taskId: 'task-11',
    order: 1,
    createdAt: '2024-03-05T10:15:00Z',
    updatedAt: '2024-03-05T10:15:00Z'
  },
  {
    id: 'subtask-26',
    title: 'Indicadores de estado de conexión',
    description: 'UI para mostrar cuando la app está offline/online',
    status: 'PENDING' as const,
    taskId: 'task-11',
    order: 2,
    createdAt: '2024-03-08T14:20:00Z',
    updatedAt: '2024-03-08T14:20:00Z'
  },
  // Subtareas para "CRUD de productos" (task-19)
  {
    id: 'subtask-27',
    title: 'Formulario de creación de productos',
    description: 'Form con validaciones para agregar nuevos productos',
    status: 'COMPLETED' as const,
    taskId: 'task-19',
    order: 0,
    createdAt: '2024-02-25T10:30:00Z',
    updatedAt: '2024-03-02T16:45:00Z'
  },
  {
    id: 'subtask-28',
    title: 'Lista y filtros de productos',
    description: 'Vista de tabla con búsqueda y filtros avanzados',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-19',
    order: 1,
    createdAt: '2024-03-02T09:15:00Z',
    updatedAt: '2024-03-13T11:20:00Z'
  },
  {
    id: 'subtask-29',
    title: 'Edición en línea de productos',
    description: 'Permitir editar campos directamente en la tabla',
    status: 'PENDING' as const,
    taskId: 'task-19',
    order: 2,
    createdAt: '2024-03-08T13:40:00Z',
    updatedAt: '2024-03-08T13:40:00Z'
  },
  {
    id: 'subtask-30',
    title: 'Manejo de imágenes de productos',
    description: 'Upload y gestión de múltiples imágenes por producto',
    status: 'PENDING' as const,
    taskId: 'task-19',
    order: 3,
    createdAt: '2024-03-10T15:00:00Z',
    updatedAt: '2024-03-10T15:00:00Z'
  },
  // Subtareas para "Contenedorización Docker" (task-23)
  {
    id: 'subtask-31',
    title: 'Dockerfile para aplicación web',
    description: 'Containerizar el frontend y configurar nginx',
    status: 'COMPLETED' as const,
    taskId: 'task-23',
    order: 0,
    createdAt: '2024-02-25T11:15:00Z',
    updatedAt: '2024-03-01T14:30:00Z'
  },
  {
    id: 'subtask-32',
    title: 'Dockerfile para API backend',
    description: 'Containerizar el servidor Node.js/Express',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-23',
    order: 1,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-13T15:45:00Z'
  },
  {
    id: 'subtask-33',
    title: 'Docker Compose para desarrollo',
    description: 'Orquestar todos los servicios en desarrollo',
    status: 'IN_PROGRESS' as const,
    taskId: 'task-23',
    order: 2,
    createdAt: '2024-03-05T09:30:00Z',
    updatedAt: '2024-03-12T16:15:00Z'
  },
  {
    id: 'subtask-34',
    title: 'Optimización de imágenes Docker',
    description: 'Multi-stage builds y reducir tamaño de contenedores',
    status: 'PENDING' as const,
    taskId: 'task-23',
    order: 3,
    createdAt: '2024-03-10T11:45:00Z',
    updatedAt: '2024-03-10T11:45:00Z'
  }
]


export const MOCK_TEAM_MEMBERS = [
  {
    id: 'user-1',
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    role: 'ADMIN' as const,
    organizationId: 'org-1',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'user-2',
    name: 'María García',
    email: 'maria@empresa.com',
    role: 'MEMBER' as const,
    organizationId: 'org-1',
    createdAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'user-3',
    name: 'Carlos López',
    email: 'carlos@empresa.com',
    role: 'MEMBER' as const,
    organizationId: 'org-1',
    createdAt: '2024-01-25T09:15:00Z'
  },
  {
    id: 'user-4',
    name: 'Ana Martínez',
    email: 'ana@empresa.com',
    role: 'MEMBER' as const,
    organizationId: 'org-1',
    createdAt: '2024-02-01T11:45:00Z'
  },
  {
    id: 'user-5',
    name: 'Roberto Silva',
    email: 'roberto@empresa.com',
    role: 'READ_ONLY' as const,
    organizationId: 'org-1',
    createdAt: '2024-02-10T08:30:00Z'
  }
]

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Nueva tarea asignada',
    message: 'Se te ha asignado la tarea: Integración pasarela de pago',
    type: 'TASK_ASSIGNED' as const,
    isRead: false,
    userId: 'user-1',
    taskId: 'task-2',
    projectId: 'project-1',
    task: MOCK_TASKS.find(t => t.id === 'task-2'),
    project: MOCK_PROJECTS.find(p => p.id === 'project-1'),
    createdAt: '2024-03-12T14:30:00Z'
  },
  {
    id: 'notif-2',
    title: 'Tarea completada',
    message: 'María García ha completado: Implementar carrito de compras',
    type: 'TASK_UPDATED' as const,
    isRead: false,
    userId: 'user-1',
    taskId: 'task-1',
    projectId: 'project-1',
    task: MOCK_TASKS.find(t => t.id === 'task-1'),
    project: MOCK_PROJECTS.find(p => p.id === 'project-1'),
    createdAt: '2024-03-11T16:45:00Z'
  },
  {
    id: 'notif-3',
    title: 'Nuevo comentario',
    message: 'Carlos López ha comentado en: Lista de contactos',
    type: 'COMMENT_ADDED' as const,
    isRead: true,
    userId: 'user-1',
    taskId: 'task-5',
    projectId: 'project-2',
    task: MOCK_TASKS.find(t => t.id === 'task-5'),
    project: MOCK_PROJECTS.find(p => p.id === 'project-2'),
    createdAt: '2024-03-10T10:20:00Z'
  },
  {
    id: 'notif-4',
    title: 'Tarea completada',
    message: 'Se ha completado exitosamente una tarea importante',
    type: 'SUCCESS' as const,
    isRead: true,
    userId: 'user-1',
    projectId: 'project-1',
    project: MOCK_PROJECTS.find(p => p.id === 'project-1'),
    createdAt: '2024-03-09T18:00:00Z'
  },
  {
    id: 'notif-5',
    title: 'Tarea próxima a vencer',
    message: 'La tarea "Diseño responsive checkout" vence en 2 días',
    type: 'WARNING' as const,
    isRead: false,
    userId: 'user-1',
    taskId: 'task-3',
    projectId: 'project-1',
    task: MOCK_TASKS.find(t => t.id === 'task-3'),
    project: MOCK_PROJECTS.find(p => p.id === 'project-1'),
    createdAt: '2024-03-08T09:00:00Z'
  }
]

export const MOCK_INVITATIONS = [
  {
    id: 'inv-1',
    email: 'nuevo.dev@empresa.com',
    role: 'MEMBER' as const,
    status: 'PENDING' as const,
    token: 'abc123',
    expiresAt: '2024-03-25T23:59:59Z',
    organizationId: 'org-1',
    invitedBy: 'user-1',
    createdAt: '2024-03-12T10:00:00Z'
  },
  {
    id: 'inv-2',
    email: 'designer@empresa.com',
    role: 'MEMBER' as const,
    status: 'ACCEPTED' as const,
    token: 'def456',
    expiresAt: '2024-03-20T23:59:59Z',
    organizationId: 'org-1',
    invitedBy: 'user-1',
    createdAt: '2024-03-05T14:30:00Z',
    acceptedAt: '2024-03-06T09:15:00Z'
  },
  {
    id: 'inv-3',
    email: 'old.invite@empresa.com',
    role: 'READ_ONLY' as const,
    status: 'EXPIRED' as const,
    token: 'ghi789',
    expiresAt: '2024-03-10T23:59:59Z',
    organizationId: 'org-1',
    invitedBy: 'user-1',
    createdAt: '2024-02-25T16:00:00Z'
  }
]

export const MOCK_COMMENTS = [
  {
    id: 'comment-1',
    content: 'Ya terminé la integración básica, necesito revisar los webhooks de Stripe',
    taskId: 'task-2',
    authorId: 'user-3',
    author: MOCK_TEAM_MEMBERS.find(u => u.id === 'user-3'),
    createdAt: '2024-03-12T11:30:00Z'
  },
  {
    id: 'comment-2',
    content: 'Perfecto! También podríamos agregar PayPal como alternativa',
    taskId: 'task-2',
    authorId: 'user-1',
    author: MOCK_TEAM_MEMBERS.find(u => u.id === 'user-1'),
    createdAt: '2024-03-12T11:45:00Z'
  },
  {
    id: 'comment-3',
    content: 'El diseño móvil necesita algunos ajustes en la pantalla de checkout',
    taskId: 'task-3',
    authorId: 'user-4',
    author: MOCK_TEAM_MEMBERS.find(u => u.id === 'user-4'),
    createdAt: '2024-03-11T15:20:00Z'
  },
  {
    id: 'comment-4',
    content: 'He completado todas las pruebas unitarias para el módulo de contactos',
    taskId: 'task-5',
    authorId: 'user-3',
    author: MOCK_TEAM_MEMBERS.find(u => u.id === 'user-3'),
    createdAt: '2024-03-10T10:15:00Z'
  }
]

// Utility functions for mock data with SPACES support
export const getMockSpaceById = (id: string) => {
  return MOCK_SPACES.find(s => s.id === id)
}

export const getMockProjectById = (id: string) => {
  return MOCK_PROJECTS.find(p => p.id === id)
}

export const getMockProjectsBySpaceId = (spaceId: string) => {
  return MOCK_PROJECTS.filter(p => p.spaceId === spaceId)
}

export const getMockTaskById = (id: string) => {
  return MOCK_TASKS.find(t => t.id === id)
}

export const getMockTasksByProjectId = (projectId: string) => {
  return MOCK_TASKS.filter(t => t.projectId === projectId)
}

export const getMockTasksBySpaceId = (spaceId: string) => {
  const spaceProjects = getMockProjectsBySpaceId(spaceId)
  const spaceProjectIds = spaceProjects.map(p => p.id)
  return MOCK_TASKS.filter(t => spaceProjectIds.includes(t.projectId))
}


export const getMockCommentsByTaskId = (taskId: string) => {
  return MOCK_COMMENTS.filter(c => c.taskId === taskId)
}

export const getMockSubtasksByTaskId = (taskId: string) => {
  return MOCK_SUBTASKS.filter(s => s.taskId === taskId).sort((a, b) => a.order - b.order)
}

export const getMockUserById = (id: string) => {
  return MOCK_TEAM_MEMBERS.find(u => u.id === id)
}

// NEW: Space-specific analytics functions
export const getMockSpaceAnalytics = (spaceId: string) => {
  const spaceProjects = getMockProjectsBySpaceId(spaceId)
  const spaceTasks = getMockTasksBySpaceId(spaceId)

  const totalProjects = spaceProjects.length
  const totalTasks = spaceTasks.length
  const completedTasks = spaceTasks.filter(t => t.status === 'COMPLETED').length
  const inProgressTasks = spaceTasks.filter(t => t.status === 'IN_PROGRESS').length
  const pendingTasks = spaceTasks.filter(t => t.status === 'PENDING').length

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overallProgress
  }
}

export const getMockSpacesWithProjects = () => {
  return MOCK_SPACES.map(space => ({
    ...space,
    projects: getMockProjectsBySpaceId(space.id),
    analytics: getMockSpaceAnalytics(space.id)
  }))
}

// Team analytics mock data
export const getMockTeamAnalytics = () => {
  const totalUsers = MOCK_TEAM_MEMBERS.length
  const totalProjects = MOCK_PROJECTS.length
  const totalTasks = MOCK_TASKS.length
  const completedTasks = MOCK_TASKS.filter(t => t.status === 'COMPLETED').length
  const completedTasksThisWeek = Math.floor(completedTasks * 0.3) // Mock: 30% completed this week
  const completedTasksPreviousWeek = Math.floor(completedTasks * 0.2) // Mock: 20% previous week

  let productivityTrend: 'up' | 'down' | 'stable' = 'up'
  if (completedTasksThisWeek < completedTasksPreviousWeek) {
    productivityTrend = 'down'
  } else if (completedTasksThisWeek === completedTasksPreviousWeek) {
    productivityTrend = 'stable'
  }

  return {
    totalUsers,
    totalProjects,
    totalTasks,
    completedTasksThisWeek,
    productivityTrend,
    averageTasksPerUser: Math.round(totalTasks / totalUsers),
    completionRate: Math.round((completedTasks / totalTasks) * 100)
  }
}

// Project analytics mock data
export const getMockProjectAnalytics = () => {
  return MOCK_PROJECTS.map(project => {
    const tasks = getMockTasksByProjectId(project.id)
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length

    // Mock overdue tasks
    const overdueTasks = Math.floor(Math.random() * 3) // 0-2 overdue tasks

    // Mock recent activity
    const recentActivity = Math.floor(Math.random() * 5) + 1 // 1-5 recent activities

    // Mock team members
    const assigneeIds = new Set(tasks.map(t => t.assigneeId))
    const teamMembersCount = assigneeIds.size

    // Mock average completion time
    const averageCompletionTime = Math.floor(Math.random() * 5) + 3 // 3-7 days

    return {
      id: project.id,
      name: project.name,
      totalTasks: tasks.length,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      progress: project.progress,
      overdueTasks,
      recentActivity,
      teamMembersCount,
      averageCompletionTime
    }
  })
}

// Calendar tasks mock data
export const getMockTasksForCalendar = () => {
  const today = new Date()
  const tasks = []

  // Generate tasks for the current month with various due dates
  for (let i = 0; i < 30; i++) {
    const dueDate = new Date(today.getFullYear(), today.getMonth(), Math.floor(Math.random() * 28) + 1)
    const randomTask = MOCK_TASKS[Math.floor(Math.random() * MOCK_TASKS.length)]
    const randomProject = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)]

    if (Math.random() > 0.6) { // 40% chance to add a task for each day
      tasks.push({
        id: `calendar-task-${i}`,
        title: randomTask.title,
        description: randomTask.description,
        dueDate: dueDate.toISOString(),
        status: randomTask.status as TaskStatus,
        priority: randomTask.priority as TaskPriority,
        projectName: randomProject.name,
        assignee: randomTask.assignee
      })
    }
  }

  // Add some specific tasks for the next few days
  const specificTasks = [
    {
      id: 'calendar-task-specific-1',
      title: 'Reunión de Planning Semanal',
      description: 'Planificación semanal con el equipo de desarrollo',
      dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'PENDING' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      projectName: 'Desarrollo E-commerce',
      assignee: MOCK_TEAM_MEMBERS[0]
    },
    {
      id: 'calendar-task-specific-2',
      title: 'Review de Código',
      description: 'Revisión de pull requests pendientes',
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      status: 'IN_PROGRESS' as TaskStatus,
      priority: 'MEDIUM' as TaskPriority,
      projectName: 'App Móvil CRM',
      assignee: MOCK_TEAM_MEMBERS[1]
    },
    {
      id: 'calendar-task-specific-3',
      title: 'Presentación a Cliente',
      description: 'Demostración del prototipo al cliente principal',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      status: 'PENDING' as TaskStatus,
      priority: 'HIGH' as TaskPriority,
      projectName: 'Dashboard Analytics',
      assignee: MOCK_TEAM_MEMBERS[2]
    }
  ]

  return [...tasks, ...specificTasks]
}

// MOCK SPRINTS for Kanban filtering
export const MOCK_SPRINTS = [
  {
    id: 'sprint-1',
    name: 'Sprint 1 - MVP Core',
    description: 'Funcionalidades básicas del MVP',
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2024-03-15T00:00:00Z',
    status: 'COMPLETED' as const,
    projectId: 'project-1'
  },
  {
    id: 'sprint-2',
    name: 'Sprint 2 - E-commerce',
    description: 'Completar funcionalidades de e-commerce',
    startDate: '2024-03-16T00:00:00Z',
    endDate: '2024-03-30T00:00:00Z',
    status: 'ACTIVE' as const,
    projectId: 'project-1'
  },
  {
    id: 'sprint-3',
    name: 'Sprint 1 - CRM Mobile',
    description: 'Primera iteración de la app móvil',
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2024-03-14T00:00:00Z',
    status: 'COMPLETED' as const,
    projectId: 'project-2'
  },
  {
    id: 'sprint-4',
    name: 'Sprint 2 - Integraciones',
    description: 'Integración con sistemas externos',
    startDate: '2024-03-15T00:00:00Z',
    endDate: '2024-03-29T00:00:00Z',
    status: 'ACTIVE' as const,
    projectId: 'project-2'
  }
]

// MOCK EPICS - High-level groupings of tasks
export const MOCK_EPICS = [
  {
    id: 'epic-1',
    name: 'Sistema de Autenticación',
    description: 'Implementar sistema completo de autenticación y autorización con OAuth2, JWT y gestión de sesiones',
    color: '#8B5CF6',
    status: 'IN_PROGRESS' as const,
    startDate: '2024-03-01T00:00:00Z',
    targetDate: '2024-04-15T00:00:00Z',
    projectId: 'project-1',
    createdAt: '2024-02-28T10:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
    tasks: [
      {
        id: 'task-1',
        title: 'Diseñar arquitectura de autenticación',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-2',
        title: 'Implementar login con email/password',
        status: 'COMPLETED' as const,
        priority: 'URGENT' as const
      },
      {
        id: 'task-3',
        title: 'Integrar OAuth2 (Google, GitHub)',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-4',
        title: 'Implementar refresh tokens',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const
      }
    ]
  },
  {
    id: 'epic-2',
    name: 'Carrito de Compras',
    description: 'Desarrollo completo del flujo de carrito de compras, incluyendo persistencia, descuentos y checkout',
    color: '#3B82F6',
    status: 'IN_PROGRESS' as const,
    startDate: '2024-03-10T00:00:00Z',
    targetDate: '2024-04-30T00:00:00Z',
    projectId: 'project-1',
    createdAt: '2024-03-05T09:15:00Z',
    updatedAt: '2024-03-18T16:20:00Z',
    tasks: [
      {
        id: 'task-5',
        title: 'Diseñar base de datos para carrito',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-6',
        title: 'Crear API de gestión de carrito',
        status: 'IN_PROGRESS' as const,
        priority: 'URGENT' as const
      },
      {
        id: 'task-7',
        title: 'Implementar UI del carrito',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-8',
        title: 'Sistema de cupones y descuentos',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const
      },
      {
        id: 'task-9',
        title: 'Integrar pasarela de pagos',
        status: 'PENDING' as const,
        priority: 'URGENT' as const
      }
    ]
  },
  {
    id: 'epic-3',
    name: 'Panel de Administración',
    description: 'Crear panel completo de administración con dashboards, reportes y gestión de usuarios',
    color: '#10B981',
    status: 'TODO' as const,
    startDate: '2024-04-01T00:00:00Z',
    targetDate: '2024-05-15T00:00:00Z',
    projectId: 'project-1',
    createdAt: '2024-03-12T11:30:00Z',
    updatedAt: '2024-03-12T11:30:00Z',
    tasks: [
      {
        id: 'task-10',
        title: 'Diseñar wireframes del panel',
        status: 'PENDING' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-11',
        title: 'Implementar sistema de roles',
        status: 'PENDING' as const,
        priority: 'URGENT' as const
      },
      {
        id: 'task-12',
        title: 'Crear dashboard con métricas',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const
      }
    ]
  },
  {
    id: 'epic-4',
    name: 'Optimización de Performance',
    description: 'Mejorar el rendimiento general de la aplicación mediante caching, lazy loading y optimización de queries',
    color: '#F59E0B',
    status: 'DONE' as const,
    startDate: '2024-02-01T00:00:00Z',
    targetDate: '2024-03-01T00:00:00Z',
    projectId: 'project-1',
    createdAt: '2024-01-28T08:00:00Z',
    updatedAt: '2024-03-01T17:45:00Z',
    tasks: [
      {
        id: 'task-13',
        title: 'Implementar Redis caching',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-14',
        title: 'Optimizar queries SQL',
        status: 'COMPLETED' as const,
        priority: 'URGENT' as const
      },
      {
        id: 'task-15',
        title: 'Implementar lazy loading de imágenes',
        status: 'COMPLETED' as const,
        priority: 'MEDIUM' as const
      },
      {
        id: 'task-16',
        title: 'Code splitting y tree shaking',
        status: 'COMPLETED' as const,
        priority: 'MEDIUM' as const
      }
    ]
  },
  {
    id: 'epic-5',
    name: 'App Móvil CRM',
    description: 'Desarrollo de aplicación móvil nativa para iOS y Android con funcionalidades principales del CRM',
    color: '#EC4899',
    status: 'IN_PROGRESS' as const,
    startDate: '2024-03-01T00:00:00Z',
    targetDate: '2024-06-01T00:00:00Z',
    projectId: 'project-2',
    createdAt: '2024-02-25T13:00:00Z',
    updatedAt: '2024-03-19T10:15:00Z',
    tasks: [
      {
        id: 'task-17',
        title: 'Setup React Native project',
        status: 'COMPLETED' as const,
        priority: 'URGENT' as const
      },
      {
        id: 'task-18',
        title: 'Implementar navegación principal',
        status: 'COMPLETED' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-19',
        title: 'Pantalla de lista de clientes',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const
      },
      {
        id: 'task-20',
        title: 'Detalle y edición de clientes',
        status: 'IN_PROGRESS' as const,
        priority: 'MEDIUM' as const
      },
      {
        id: 'task-21',
        title: 'Sincronización offline',
        status: 'PENDING' as const,
        priority: 'URGENT' as const
      },
      {
        id: 'task-22',
        title: 'Notificaciones push',
        status: 'PENDING' as const,
        priority: 'MEDIUM' as const
      }
    ]
  },
  {
    id: 'epic-6',
    name: 'Migración a Microservicios',
    description: 'Refactorizar arquitectura monolítica a microservicios con Docker y Kubernetes',
    color: '#6366F1',
    status: 'TODO' as const,
    startDate: '2024-05-01T00:00:00Z',
    targetDate: '2024-08-31T00:00:00Z',
    projectId: 'project-3',
    createdAt: '2024-03-20T15:30:00Z',
    updatedAt: '2024-03-20T15:30:00Z',
    tasks: []
  }
]

// MOCK TEMPLATES - System and Custom Project Templates
export const MOCK_PROJECT_TEMPLATES: ProjectTemplate[] = [
  // System Templates (isDefault: true)
  {
    id: 'template-1',
    name: 'Desarrollo de Software',
    description: 'Plantilla para proyectos de desarrollo con metodología ágil',
    category: TemplateCategory.DESARROLLO_SOFTWARE,
    icon: 'Code',
    color: '#3B82F6',
    isDefault: true,
    organizationId: undefined,
    states: [
      { id: 'state-1-1', name: 'Por Hacer', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-1-2', name: 'En Progreso', color: '#3B82F6', order: 2 },
      { id: 'state-1-3', name: 'En Revisión', color: '#F59E0B', order: 3 },
      { id: 'state-1-4', name: 'Testing', color: '#8B5CF6', order: 4 },
      { id: 'state-1-5', name: 'Completado', color: '#10B981', order: 5 }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    usageCount: 45
  },
  {
    id: 'template-2',
    name: 'Marketing',
    description: 'Gestión de campañas y contenido de marketing',
    category: TemplateCategory.MARKETING,
    icon: 'Megaphone',
    color: '#EC4899',
    isDefault: true,
    organizationId: undefined,
    states: [
      { id: 'state-2-1', name: 'Idea', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-2-2', name: 'Planificación', color: '#3B82F6', order: 2 },
      { id: 'state-2-3', name: 'En Producción', color: '#F59E0B', order: 3 },
      { id: 'state-2-4', name: 'Publicado', color: '#10B981', order: 4 },
      { id: 'state-2-5', name: 'Archivado', color: '#6B7280', order: 5 }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    usageCount: 28
  },
  {
    id: 'template-3',
    name: 'Diseño',
    description: 'Flujo de trabajo para proyectos de diseño y creatividad',
    category: TemplateCategory.DISENO,
    icon: 'Palette',
    color: '#8B5CF6',
    isDefault: true,
    organizationId: undefined,
    states: [
      { id: 'state-3-1', name: 'Briefing', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-3-2', name: 'Boceto', color: '#3B82F6', order: 2 },
      { id: 'state-3-3', name: 'Diseño', color: '#8B5CF6', order: 3 },
      { id: 'state-3-4', name: 'Revisión', color: '#F59E0B', order: 4 },
      { id: 'state-3-5', name: 'Aprobado', color: '#10B981', order: 5 }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    usageCount: 32
  },
  {
    id: 'template-4',
    name: 'Ventas',
    description: 'Pipeline de ventas y gestión de oportunidades',
    category: TemplateCategory.VENTAS,
    icon: 'TrendingUp',
    color: '#10B981',
    isDefault: true,
    organizationId: undefined,
    states: [
      { id: 'state-4-1', name: 'Lead', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-4-2', name: 'Contactado', color: '#3B82F6', order: 2 },
      { id: 'state-4-3', name: 'Calificado', color: '#8B5CF6', order: 3 },
      { id: 'state-4-4', name: 'Propuesta', color: '#F59E0B', order: 4 },
      { id: 'state-4-5', name: 'Negociación', color: '#EF4444', order: 5 },
      { id: 'state-4-6', name: 'Ganado', color: '#10B981', order: 6 },
      { id: 'state-4-7', name: 'Perdido', color: '#6B7280', order: 7 }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    usageCount: 19
  },
  {
    id: 'template-5',
    name: 'General',
    description: 'Plantilla simple para cualquier tipo de proyecto',
    category: TemplateCategory.GENERAL,
    icon: 'Folder',
    color: '#6B7280',
    isDefault: true,
    organizationId: undefined,
    states: [
      { id: 'state-5-1', name: 'Por Hacer', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-5-2', name: 'En Progreso', color: '#3B82F6', order: 2 },
      { id: 'state-5-3', name: 'Completado', color: '#10B981', order: 3 }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    usageCount: 67
  },
  // Custom Templates (created by users)
  {
    id: 'template-custom-1',
    name: 'Sprint Scrum Personalizado',
    description: 'Mi flujo personalizado de scrum con estados extras',
    category: TemplateCategory.PERSONALIZADO,
    icon: 'Zap',
    color: '#F59E0B',
    isDefault: false,
    organizationId: 'org-1',
    states: [
      { id: 'state-c1-1', name: 'Backlog', color: '#9CA3AF', order: 1, isDefault: true },
      { id: 'state-c1-2', name: 'Sprint Planning', color: '#3B82F6', order: 2 },
      { id: 'state-c1-3', name: 'En Desarrollo', color: '#8B5CF6', order: 3 },
      { id: 'state-c1-4', name: 'Code Review', color: '#F59E0B', order: 4 },
      { id: 'state-c1-5', name: 'QA Testing', color: '#EC4899', order: 5 },
      { id: 'state-c1-6', name: 'UAT', color: '#EF4444', order: 6 },
      { id: 'state-c1-7', name: 'Done', color: '#10B981', order: 7 }
    ],
    createdById: 'user-1',
    createdBy: MOCK_USER,
    createdAt: new Date('2024-02-15T10:30:00Z'),
    updatedAt: new Date('2024-02-15T10:30:00Z'),
    usageCount: 5
  }
]

export function getMockTemplates(): ProjectTemplate[] {
  return MOCK_PROJECT_TEMPLATES
}

export function getMockTemplateById(id: string): ProjectTemplate | undefined {
  return MOCK_PROJECT_TEMPLATES.find(template => template.id === id)
}

export function getMockTemplatesByCategory(category: TemplateCategory): ProjectTemplate[] {
  return MOCK_PROJECT_TEMPLATES.filter(template => template.category === category)
}