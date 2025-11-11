import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim().toLowerCase()
    const userId = parseInt(session.user.id)

    // Parallel search across different entities with access control
    const [spaces, projects, tasks] = await Promise.all([
      // Search spaces - Only spaces where user is a member OR public spaces
      prisma.space.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            {
              OR: [
                { isPublic: true },
                { members: { some: { userId } } }
              ]
            }
          ]
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),

      // Search projects - Only projects where user is a member
      prisma.project.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            {
              members: { some: { userId } }
            }
          ]
        },
        include: {
          space: {
            select: { name: true },
          },
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      }),

      // Search tasks - Only tasks from projects where user is a member
      prisma.task.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
            {
              project: {
                members: { some: { userId } }
              }
            }
          ]
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { name: true, email: true },
          },
        },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    // Format results
    const results = [
      // Spaces
      ...spaces.map((space) => ({
        id: space.id.toString(),
        type: 'space' as const,
        title: space.name,
        description: space.description || undefined,
        url: `/spaces/${space.id}`,
      })),

      // Projects
      ...projects.map((project) => ({
        id: project.id.toString(),
        type: 'project' as const,
        title: project.name,
        description: project.description || undefined,
        metadata: {
          spaceName: project.space.name,
        },
        url: `/projects/${project.id}`,
      })),

      // Tasks
      ...tasks.map((task) => ({
        id: task.id.toString(),
        type: 'task' as const,
        title: task.title,
        description: task.description || undefined,
        metadata: {
          projectName: task.project.name,
          projectId: task.projectId.toString(),
          status: task.status,
          priority: task.priority,
          assignee: task.assignee?.name || task.assignee?.email || undefined,
          dueDate: task.dueDate?.toISOString() || undefined,
        },
        url: `/projects/${task.projectId}/tasks/${task.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Error en la búsqueda' },
      { status: 500 }
    )
  }
}
