import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

// POST /api/notifications/test - Create test notifications for current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Create various types of test notifications
    const notifications = await Promise.all([
      createNotification({
        userId,
        title: 'Nueva tarea asignada',
        message: 'Se te ha asignado la tarea: Implementar sistema de notificaciones',
        type: 'TASK_ASSIGNED',
        link: '/projects/1',
      }),
      createNotification({
        userId,
        title: 'Nuevo comentario',
        message: 'Juan Pérez comentó en la tarea: Revisar diseño del dashboard',
        type: 'COMMENT_ADDED',
        link: '/projects/1',
      }),
      createNotification({
        userId,
        title: 'Tarea actualizada',
        message: 'María García actualizó la tarea: Corregir bug en login',
        type: 'TASK_UPDATED',
        link: '/projects/1',
      }),
      createNotification({
        userId,
        title: 'Agregado a proyecto',
        message: 'Carlos López te agregó al proyecto: Sistema de Gestión',
        type: 'PROJECT_UPDATED',
        link: '/projects/2',
      }),
      createNotification({
        userId,
        title: 'Te mencionaron',
        message: 'Ana Martínez te mencionó en un comentario',
        type: 'COMMENT_ADDED',
        link: '/projects/1',
      }),
    ])

    return NextResponse.json({
      message: 'Test notifications created successfully',
      count: notifications.length,
      notifications: notifications.filter(n => n !== null),
    })
  } catch (error) {
    console.error('Error creating test notifications:', error)
    return NextResponse.json(
      { error: 'Failed to create test notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/test - Delete all notifications for current user (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')
    const userId = parseInt(session.user.id)

    const result = await prisma.notification.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      message: 'All notifications deleted',
      count: result.count,
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
