import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templateId = parseInt(params.id)

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId },
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

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Verify access (system templates or organization templates)
    if (!template.isDefault && template.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PATCH /api/templates/[id] - Update a template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templateId = parseInt(params.id)

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    // Verify template exists and user has access
    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Cannot modify system templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot modify system templates' },
        { status: 403 }
      )
    }

    // Verify organization access
    if (template.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Cannot modify templates that are in use
    if (template.usageCount > 0) {
      return NextResponse.json(
        { error: 'Cannot modify a template that is already in use' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, category, icon, color, states } = body

    // Update template
    const updatedTemplate = await prisma.projectTemplate.update({
      where: { id: templateId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category !== undefined && { category }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        // If states are provided, replace them
        ...(states && {
          states: {
            deleteMany: {},
            create: states.map((state: any, index: number) => ({
              name: state.name.trim(),
              color: state.color || '#9CA3AF',
              order: state.order !== undefined ? state.order : index,
              isDefault: state.isDefault || false
            }))
          }
        })
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

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templateId = parseInt(params.id)

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    // Verify template exists and user has access
    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Cannot delete system templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete system templates' },
        { status: 403 }
      )
    }

    // Verify organization access
    if (template.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Cannot delete templates that are in use
    if (template.usageCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a template that is already in use' },
        { status: 403 }
      )
    }

    await prisma.projectTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
