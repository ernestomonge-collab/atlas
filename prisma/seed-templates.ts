import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const systemTemplates = [
  {
    name: 'Desarrollo de Software',
    description: 'Plantilla para proyectos de desarrollo con metodología ágil',
    category: 'DESARROLLO_SOFTWARE',
    icon: 'Code',
    color: '#3B82F6',
    isDefault: true,
    states: [
      { name: 'Por Hacer', color: '#9CA3AF', order: 0, isDefault: true },
      { name: 'En Progreso', color: '#3B82F6', order: 1 },
      { name: 'En Revisión', color: '#F59E0B', order: 2 },
      { name: 'Testing', color: '#8B5CF6', order: 3 },
      { name: 'Completado', color: '#10B981', order: 4 }
    ]
  },
  {
    name: 'Marketing',
    description: 'Gestión de campañas y contenido de marketing',
    category: 'MARKETING',
    icon: 'Megaphone',
    color: '#EC4899',
    isDefault: true,
    states: [
      { name: 'Idea', color: '#9CA3AF', order: 0, isDefault: true },
      { name: 'Planificación', color: '#3B82F6', order: 1 },
      { name: 'En Producción', color: '#F59E0B', order: 2 },
      { name: 'Publicado', color: '#10B981', order: 3 },
      { name: 'Archivado', color: '#6B7280', order: 4 }
    ]
  },
  {
    name: 'Diseño',
    description: 'Flujo de trabajo para proyectos de diseño y creatividad',
    category: 'DISENO',
    icon: 'Palette',
    color: '#8B5CF6',
    isDefault: true,
    states: [
      { name: 'Briefing', color: '#9CA3AF', order: 0, isDefault: true },
      { name: 'Boceto', color: '#3B82F6', order: 1 },
      { name: 'Diseño', color: '#8B5CF6', order: 2 },
      { name: 'Revisión', color: '#F59E0B', order: 3 },
      { name: 'Aprobado', color: '#10B981', order: 4 }
    ]
  },
  {
    name: 'Ventas',
    description: 'Pipeline de ventas y gestión de oportunidades',
    category: 'VENTAS',
    icon: 'TrendingUp',
    color: '#10B981',
    isDefault: true,
    states: [
      { name: 'Lead', color: '#9CA3AF', order: 0, isDefault: true },
      { name: 'Contactado', color: '#3B82F6', order: 1 },
      { name: 'Calificado', color: '#8B5CF6', order: 2 },
      { name: 'Propuesta', color: '#F59E0B', order: 3 },
      { name: 'Negociación', color: '#EF4444', order: 4 },
      { name: 'Ganado', color: '#10B981', order: 5 },
      { name: 'Perdido', color: '#6B7280', order: 6 }
    ]
  },
  {
    name: 'General',
    description: 'Plantilla simple para cualquier tipo de proyecto',
    category: 'GENERAL',
    icon: 'Folder',
    color: '#6B7280',
    isDefault: true,
    states: [
      { name: 'Por Hacer', color: '#9CA3AF', order: 0, isDefault: true },
      { name: 'En Progreso', color: '#3B82F6', order: 1 },
      { name: 'Completado', color: '#10B981', order: 2 }
    ]
  }
]

async function seedTemplates() {
  console.log('🌱 Seeding system templates...')

  // Check if templates already exist
  const existingTemplates = await prisma.projectTemplate.count({
    where: { isDefault: true }
  })

  if (existingTemplates > 0) {
    console.log(`✅ System templates already exist (${existingTemplates} templates)`)
    return
  }

  // Create system templates
  for (const template of systemTemplates) {
    const created = await prisma.projectTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        category: template.category as any,
        icon: template.icon,
        color: template.color,
        isDefault: template.isDefault,
        states: {
          create: template.states
        }
      },
      include: {
        states: true
      }
    })

    console.log(`✅ Created template: ${created.name} (${created.states.length} states)`)
  }

  console.log('✨ System templates seeded successfully!')
}

seedTemplates()
  .catch((e) => {
    console.error('Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
