import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean database (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning database...')
  await prisma.notification.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.epic.deleteMany()
  await prisma.sprint.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.spaceMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.space.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()

  // Create organization
  console.log('🏢 Creating organization...')
  const organization = await prisma.organization.create({
    data: {
      name: 'Atlas'
    }
  })

  // Create users
  console.log('👥 Creating users...')
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@atlas.com',
      passwordHash,
      role: 'ADMIN',
      organizationId: organization.id
    }
  })

  const user1 = await prisma.user.create({
    data: {
      name: 'María García',
      email: 'maria@atlas.com',
      passwordHash,
      role: 'MEMBER',
      organizationId: organization.id
    }
  })

  const user2 = await prisma.user.create({
    data: {
      name: 'Carlos Rodríguez',
      email: 'carlos@atlas.com',
      passwordHash,
      role: 'MEMBER',
      organizationId: organization.id
    }
  })

  const user3 = await prisma.user.create({
    data: {
      name: 'Ana López',
      email: 'ana@atlas.com',
      passwordHash,
      role: 'READ_ONLY',
      organizationId: organization.id
    }
  })

  // Create spaces
  console.log('📁 Creating spaces...')
  const space1 = await prisma.space.create({
    data: {
      name: 'Desarrollo de Producto',
      description: 'Espacio dedicado al desarrollo de software',
      color: '#3B82F6',
      icon: 'Code',
      organizationId: organization.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: user1.id, role: 'MEMBER' },
          { userId: user2.id, role: 'MEMBER' }
        ]
      }
    }
  })

  const space2 = await prisma.space.create({
    data: {
      name: 'Marketing Digital',
      description: 'Campañas y estrategias de marketing',
      color: '#EC4899',
      icon: 'Megaphone',
      organizationId: organization.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: user1.id, role: 'MEMBER' }
        ]
      }
    }
  })

  const space3 = await prisma.space.create({
    data: {
      name: 'Operaciones',
      description: 'Gestión de procesos internos y DevOps',
      color: '#10B981',
      icon: 'Settings',
      organizationId: organization.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: user2.id, role: 'MEMBER' }
        ]
      }
    }
  })

  // Create projects
  console.log('📊 Creating projects...')
  const project1 = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      description: 'Plataforma de comercio electrónico con integración de pagos',
      organizationId: organization.id,
      spaceId: space1.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user1.id, role: 'MEMBER' },
          { userId: user2.id, role: 'MEMBER' }
        ]
      }
    }
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App CRM',
      description: 'Aplicación móvil para gestión de clientes',
      organizationId: organization.id,
      spaceId: space1.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user2.id, role: 'MEMBER' }
        ]
      }
    }
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Campaña Q2 2024',
      description: 'Estrategia de marketing para el segundo trimestre',
      organizationId: organization.id,
      spaceId: space2.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user1.id, role: 'MEMBER' }
        ]
      }
    }
  })

  const project4 = await prisma.project.create({
    data: {
      name: 'CI/CD Pipeline',
      description: 'Automatización de deployments y testing',
      organizationId: organization.id,
      spaceId: space3.id,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: user2.id, role: 'ADMIN' }
        ]
      }
    }
  })

  // Create Epics
  console.log('🎯 Creating epics...')
  const epic1 = await prisma.epic.create({
    data: {
      name: 'User Authentication',
      description: 'Implementar sistema completo de autenticación y autorización',
      color: '#3B82F6',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      startDate: new Date('2024-01-01'),
      targetDate: new Date('2024-02-15')
    }
  })

  const epic2 = await prisma.epic.create({
    data: {
      name: 'Payment Integration',
      description: 'Integración con pasarelas de pago',
      color: '#10B981',
      status: 'IN_PROGRESS',
      projectId: project1.id,
      startDate: new Date('2024-02-01'),
      targetDate: new Date('2024-03-15')
    }
  })

  const epic3 = await prisma.epic.create({
    data: {
      name: 'Mobile UI',
      description: 'Diseño e implementación de la interfaz móvil',
      color: '#8B5CF6',
      status: 'TODO',
      projectId: project2.id
    }
  })

  const epic4 = await prisma.epic.create({
    data: {
      name: 'Social Media Campaign',
      description: 'Campaña en redes sociales para Q2',
      color: '#EC4899',
      status: 'IN_PROGRESS',
      projectId: project3.id,
      startDate: new Date('2024-04-01'),
      targetDate: new Date('2024-06-30')
    }
  })

  // Create Sprints
  console.log('🏃 Creating sprints...')
  const sprint1 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - Auth Foundation',
      status: 'ACTIVE',
      projectId: project1.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-29')
    }
  })

  const sprint2 = await prisma.sprint.create({
    data: {
      name: 'Sprint 2 - Payment Setup',
      status: 'PLANNING',
      projectId: project1.id,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-15')
    }
  })

  const sprint3 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - Mobile Foundations',
      status: 'ACTIVE',
      projectId: project2.id,
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-01-22')
    }
  })

  const sprint4 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - Campaign Launch',
      status: 'ACTIVE',
      projectId: project3.id,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-04-15')
    }
  })

  // Create Tasks
  console.log('✅ Creating tasks...')

  // Project 1 Tasks
  await prisma.task.create({
    data: {
      title: 'Implementar registro de usuarios',
      description: 'Crear formulario y endpoint para registro de nuevos usuarios',
      status: 'COMPLETED',
      priority: 'HIGH',
      projectId: project1.id,
      epicId: epic1.id,
      sprintId: sprint1.id,
      assigneeId: user1.id,
      createdById: admin.id,
      dueDate: new Date('2024-01-20')
    }
  })

  await prisma.task.create({
    data: {
      title: 'Implementar login con JWT',
      description: 'Sistema de autenticación usando tokens JWT',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project1.id,
      epicId: epic1.id,
      sprintId: sprint1.id,
      assigneeId: user2.id,
      createdById: admin.id,
      dueDate: new Date('2024-01-25')
    }
  })

  await prisma.task.create({
    data: {
      title: 'Agregar recuperación de contraseña',
      description: 'Flujo completo de reset de password',
      status: 'PENDING',
      priority: 'MEDIUM',
      projectId: project1.id,
      epicId: epic1.id,
      sprintId: sprint1.id,
      assigneeId: user1.id,
      createdById: admin.id,
      dueDate: new Date('2024-01-28')
    }
  })

  await prisma.task.create({
    data: {
      title: 'Integrar Stripe API',
      description: 'Configurar SDK de Stripe y endpoints básicos',
      status: 'PENDING',
      priority: 'HIGH',
      projectId: project1.id,
      epicId: epic2.id,
      sprintId: sprint2.id,
      assigneeId: user2.id,
      createdById: admin.id
    }
  })

  await prisma.task.create({
    data: {
      title: 'Crear flujo de checkout',
      description: 'Interfaz de usuario para proceso de pago',
      status: 'PENDING',
      priority: 'HIGH',
      projectId: project1.id,
      epicId: epic2.id,
      assigneeId: user1.id,
      createdById: admin.id
    }
  })

  // Project 2 Tasks
  await prisma.task.create({
    data: {
      title: 'Diseñar pantallas principales',
      description: 'Mockups de las 5 pantallas principales de la app',
      status: 'COMPLETED',
      priority: 'HIGH',
      projectId: project2.id,
      epicId: epic3.id,
      sprintId: sprint3.id,
      assigneeId: user2.id,
      createdById: admin.id,
      dueDate: new Date('2024-01-15')
    }
  })

  await prisma.task.create({
    data: {
      title: 'Configurar React Native',
      description: 'Setup inicial del proyecto móvil',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project2.id,
      epicId: epic3.id,
      sprintId: sprint3.id,
      assigneeId: user2.id,
      createdById: admin.id,
      dueDate: new Date('2024-01-20')
    }
  })

  await prisma.task.create({
    data: {
      title: 'Implementar navegación',
      description: 'Sistema de navegación entre pantallas',
      status: 'PENDING',
      priority: 'MEDIUM',
      projectId: project2.id,
      epicId: epic3.id,
      sprintId: sprint3.id,
      assigneeId: user2.id,
      createdById: admin.id
    }
  })

  // Project 3 Tasks
  await prisma.task.create({
    data: {
      title: 'Crear contenido para Instagram',
      description: '10 posts programados para el mes',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project3.id,
      epicId: epic4.id,
      sprintId: sprint4.id,
      assigneeId: user1.id,
      createdById: admin.id,
      dueDate: new Date('2024-04-10')
    }
  })

  await prisma.task.create({
    data: {
      title: 'Diseñar campaña de email',
      description: 'Template y copy para campaña de email marketing',
      status: 'PENDING',
      priority: 'MEDIUM',
      projectId: project3.id,
      epicId: epic4.id,
      sprintId: sprint4.id,
      assigneeId: user1.id,
      createdById: admin.id,
      dueDate: new Date('2024-04-12')
    }
  })

  // Project 4 Tasks
  await prisma.task.create({
    data: {
      title: 'Configurar GitHub Actions',
      description: 'Pipeline de CI/CD para testing y deployment',
      status: 'COMPLETED',
      priority: 'HIGH',
      projectId: project4.id,
      assigneeId: user2.id,
      createdById: admin.id
    }
  })

  await prisma.task.create({
    data: {
      title: 'Dockerizar aplicación',
      description: 'Crear Dockerfiles y docker-compose',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      projectId: project4.id,
      assigneeId: user2.id,
      createdById: admin.id
    }
  })

  // Get task IDs for comments
  const tasks = await prisma.task.findMany({
    where: { projectId: project1.id },
    take: 2
  })

  // Create Comments
  console.log('💬 Creating comments...')
  if (tasks.length > 0) {
    await prisma.comment.create({
      data: {
        content: 'Ya terminé el formulario de registro, ¿podrías revisarlo?',
        taskId: tasks[0].id,
        userId: user1.id
      }
    })

    await prisma.comment.create({
      data: {
        content: 'Perfecto! Lo reviso en un momento y te doy feedback.',
        taskId: tasks[0].id,
        userId: admin.id
      }
    })

    if (tasks.length > 1) {
      await prisma.comment.create({
        data: {
          content: 'Necesito ayuda con la validación del token. ¿Alguien tiene experiencia con JWT?',
          taskId: tasks[1].id,
          userId: user2.id
        }
      })

      await prisma.comment.create({
        data: {
          content: 'Claro! Te puedo ayudar. Revisa la documentación de jsonwebtoken.',
          taskId: tasks[1].id,
          userId: user1.id
        }
      })
    }
  }

  // Create Notifications
  console.log('🔔 Creating notifications...')
  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Nueva tarea asignada',
      message: 'Se te asignó la tarea "Agregar recuperación de contraseña"',
      type: 'TASK_ASSIGNED',
      isRead: false
    }
  })

  await prisma.notification.create({
    data: {
      userId: user2.id,
      title: 'Comentario en tu tarea',
      message: 'Admin User comentó en "Implementar login con JWT"',
      type: 'INFO',
      isRead: false
    }
  })

  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'Tarea completada',
      message: 'María García completó la tarea "Implementar registro de usuarios"',
      type: 'SUCCESS',
      isRead: true
    }
  })

  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Nueva tarea asignada',
      message: 'Se te asignó la tarea "Crear contenido para Instagram"',
      type: 'TASK_ASSIGNED',
      isRead: false
    }
  })

  console.log('✅ Seed completed successfully!')
  console.log('\n📧 Login credentials:')
  console.log('Admin: admin@atlas.com / password123')
  console.log('User 1 (María): maria@atlas.com / password123')
  console.log('User 2 (Carlos): carlos@atlas.com / password123')
  console.log('User 3 (Ana): ana@atlas.com / password123')
  console.log(`\n🏢 Organization: ${organization.name} (ID: ${organization.id})`)
  console.log(`\n📁 Spaces created: ${space1.name}, ${space2.name}, ${space3.name}`)
  console.log(`📊 Projects created: ${project1.name}, ${project2.name}, ${project3.name}, ${project4.name}`)
  console.log(`🎯 Epics created: ${epic1.name}, ${epic2.name}, ${epic3.name}, ${epic4.name}`)
  console.log(`🏃 Sprints created: ${sprint1.name}, ${sprint2.name}, ${sprint3.name}, ${sprint4.name}`)
  console.log(`✅ Tasks created: 13 tasks across all projects`)
  console.log(`💬 Comments created: 4 comments`)
  console.log(`🔔 Notifications created: 4 notifications`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
