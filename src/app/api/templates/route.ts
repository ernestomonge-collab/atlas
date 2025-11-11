import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/templates - Get all templates (system + organization custom)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizationId = session.user.organizationId

    // Get system templates (isDefault: true) and organization custom templates
    const templates = await prisma.projectTemplate.findMany({
      where: {
        OR: [
          { isDefault: true, organizationId: null },
          { organizationId }
        ]
      },
      include: {
        states: {
          orderBy: { order: 'asc' }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create a new custom template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, category, icon, color, states } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    if (!states || !Array.isArray(states) || states.length === 0) {
      return NextResponse.json(
        { error: 'At least one state is required' },
        { status: 400 }
      )
    }

    const organizationId = session.user.organizationId

    // Create template with states
    const template = await prisma.projectTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'PERSONALIZADO',
        icon: icon || 'Folder',
        color: color || '#6B7280',
        isDefault: false,
        organizationId,
        createdById: parseInt(session.user.id),
        states: {
          create: states.map((state: any, index: number) => ({
            name: state.name.trim(),
            color: state.color || '#9CA3AF',
            order: state.order !== undefined ? state.order : index,
            isDefault: state.isDefault || false
          }))
        }
      },
      include: {
        states: {
          orderBy: { order: 'asc' }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
