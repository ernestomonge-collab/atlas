'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, CheckCircle, Users, BarChart3, Zap } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect directly to dashboard for demo purposes
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Lilab Ops v1.2</h1>
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Project Management
            <span className="text-blue-600"> Simplified</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for your organization&apos;s workflows. Streamline project management,
            enhance team collaboration, and deliver results faster with Lilab Ops v1.2.
          </p>
          <div className="mt-10">
            <Link href="/register">
              <Button size="lg" className="mr-4">
                Start Your Organization
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything you need to manage projects effectively
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Replace expensive external tools with a custom solution designed for your team
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-green-600" />
                <CardTitle>Kanban Boards</CardTitle>
                <CardDescription>
                  Visualize your workflow with interactive drag-and-drop task boards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Comments, file attachments, and real-time updates keep everyone aligned
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <CardTitle>Sprint Planning</CardTitle>
                <CardDescription>
                  Organize work in focused cycles with clear goals and deadlines
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-orange-600" />
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Real-time dashboards and analytics to monitor project health
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Building2 className="h-8 w-8 text-indigo-600" />
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure permissions system with admin, member, and read-only roles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <CardTitle>Cost Effective</CardTitle>
                <CardDescription>
                  Reduce software licensing costs by up to 70% with our internal solution
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to streamline your project management?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join teams who have already improved their productivity with Lilab Ops v1.2
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">Create Your Organization</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Lilab Ops v1.2. Built for efficient team collaboration.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
