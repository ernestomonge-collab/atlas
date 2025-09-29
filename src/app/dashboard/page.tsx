'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { SpaceCard } from '@/components/spaces/space-card'
import { CreateSpaceModal } from '@/components/spaces/create-space-modal'
import { MainLayout } from '@/components/layout/main-layout'
import { useProjects } from '@/hooks/use-projects'
import { getMockSpacesWithProjects } from '@/lib/mock-data'
import { Space } from '@/types'
import { Building2, Plus, Users, BarChart3, CheckCircle, Layers } from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { projects, isLoading, refreshProjects } = useProjects()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false)

  // NEW: Get spaces with projects and analytics
  const [spaces, setSpaces] = useState(getMockSpacesWithProjects())

  // TEMP: Skip auth for demo
  // useEffect(() => {
  //   if (status === 'unauthenticated') {
  //     router.push('/login')
  //   }
  // }, [status, router])

  // if (status === 'loading') {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  //     </div>
  //   )
  // }

  // if (!session) {
  //   return null
  // }

  // Temp mock session for demo
  const mockSession = { user: { name: 'Juan Pérez' } }

  const handleProjectCreated = () => {
    refreshProjects()
  }

  const handleSpaceCreated = (newSpace: Space) => {
    // Create the extended space with default analytics and empty projects
    const extendedSpace = {
      ...newSpace,
      projects: [],
      analytics: {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        overallProgress: 0
      }
    }
    setSpaces(prevSpaces => [...prevSpaces, extendedSpace])
    console.log('Space created:', newSpace)
  }

  // NEW: Calculate totals from spaces
  const totalSpaces = spaces.length
  const totalProjects = spaces.reduce((sum, space) => sum + space.analytics.totalProjects, 0)
  const totalTasks = spaces.reduce((sum, space) => sum + space.analytics.totalTasks, 0)
  const completedTasks = spaces.reduce((sum, space) => sum + space.analytics.completedTasks, 0)

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <MainLayout
      title="Dashboard"
      description={`Bienvenido de vuelta, ${mockSession.user.name}`}
    >

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Spaces
              </CardTitle>
              <Layers className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSpaces}</div>
              <p className="text-xs text-gray-500">Active spaces</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Projects
              </CardTitle>
              <Building2 className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-gray-500">Total projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Tasks
              </CardTitle>
              <BarChart3 className="h-4 w-4 ml-auto text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <p className="text-xs text-gray-500">All tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 ml-auto text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-gray-500">Finished tasks</p>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowCreateSpaceModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Space
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
              <Link href="/team">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Gestionar Equipo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Spaces Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Spaces</CardTitle>
                <CardDescription>
                  {spaces.length > 0
                    ? `Organize work across ${spaces.length} space${spaces.length !== 1 ? 's' : ''} with ${totalProjects} total projects`
                    : 'Create your first space to organize projects and collaborate with your team'
                  }
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {spaces.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No spaces yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first space. Spaces help you organize
                  projects by teams, departments, or any way that works for your organization.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Space
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={handleProjectCreated}
      />

      <CreateSpaceModal
        open={showCreateSpaceModal}
        onOpenChange={setShowCreateSpaceModal}
        onSpaceCreated={handleSpaceCreated}
      />
    </MainLayout>
  )
}