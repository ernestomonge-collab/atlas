'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import { SpaceCard } from '@/components/spaces/space-card'
import { CreateSpaceModal } from '@/components/spaces/create-space-modal'
import { getMockSpacesWithProjects } from '@/lib/mock-data'
import { Space } from '@/types'
import { Layers, Plus, Building2, BarChart3, Users, Clock } from 'lucide-react'

export default function SpacesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [spaces, setSpaces] = useState(getMockSpacesWithProjects())

  // TEMP: Skip auth for demo
  // if (status === 'loading') {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  //     </div>
  //   )
  // }

  // if (!session) {
  //   router.push('/login')
  //   return null
  // }

  // Temp mock session for demo
  const mockSession = { user: { name: 'Juan Pérez' } }

  // Calculate overall stats
  const totalProjects = spaces.reduce((sum, space) => sum + space.analytics.totalProjects, 0)
  const totalTasks = spaces.reduce((sum, space) => sum + space.analytics.totalTasks, 0)
  const completedTasks = spaces.reduce((sum, space) => sum + space.analytics.completedTasks, 0)
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const handleSpaceCreated = (newSpace: Space) => {
    // Add the new space to the local state
    setSpaces(prevSpaces => [...prevSpaces, newSpace])
    console.log('Space created:', newSpace)
  }

  return (
    <MainLayout
      title="Espacios"
      description="Organiza tu trabajo en espacios temáticos con proyectos relacionados"
    >

      {/* Spaces Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Spaces</CardTitle>
              <CardDescription>
                {spaces.length > 0
                  ? `Browse all ${spaces.length} space${spaces.length !== 1 ? 's' : ''} in your organization`
                  : 'No spaces created yet'
                }
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Space
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

      <CreateSpaceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSpaceCreated={handleSpaceCreated}
      />
    </MainLayout>
  )
}