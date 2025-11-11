'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainLayout } from '@/components/layout/main-layout'
import { InvitationCard } from '@/components/invitations/invitation-card'
import { useConfirm } from '@/hooks/use-confirm'
import { Mail, Inbox, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Invitation {
  id: number
  email: string
  type: 'ORGANIZATION' | 'SPACE' | 'PROJECT'
  role: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
  expiresAt: string | null
  invitedBy: {
    id: string
    name: string | null
    email: string
  }
  organization: {
    id: number
    name: string
  }
  space?: {
    id: number
    name: string
    color: string
  } | null
  project?: {
    id: number
    name: string
  } | null
}

export default function InvitationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { confirm, ConfirmationDialog } = useConfirm()
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [isLoadingReceived, setIsLoadingReceived] = useState(true)
  const [isLoadingSent, setIsLoadingSent] = useState(true)
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch invitations
  useEffect(() => {
    if (session?.user) {
      fetchReceivedInvitations()
      fetchSentInvitations()
    }
  }, [session])

  const fetchReceivedInvitations = async () => {
    setIsLoadingReceived(true)
    try {
      const response = await fetch('/api/invitations?type=received')
      if (response.ok) {
        const data = await response.json()
        setReceivedInvitations(data)
      }
    } catch (error) {
      console.error('Failed to fetch received invitations:', error)
    } finally {
      setIsLoadingReceived(false)
    }
  }

  const fetchSentInvitations = async () => {
    setIsLoadingSent(true)
    try {
      const response = await fetch('/api/invitations?type=sent')
      if (response.ok) {
        const data = await response.json()
        setSentInvitations(data)
      }
    } catch (error) {
      console.error('Failed to fetch sent invitations:', error)
    } finally {
      setIsLoadingSent(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al aceptar la invitación')
        return
      }

      // Refresh invitations
      await fetchReceivedInvitations()

      // Show success message
      toast.success('¡Invitación aceptada exitosamente!')

      // Redirect to dashboard to refresh data
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('Error al aceptar la invitación')
    }
  }

  const handleDeclineInvitation = async (invitationId: number) => {
    const confirmed = await confirm({
      title: 'Rechazar invitación',
      description: '¿Estás seguro de que quieres rechazar esta invitación?',
      confirmText: 'Rechazar',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al rechazar la invitación')
        return
      }

      toast.success('Invitación rechazada')
      // Refresh invitations
      await fetchReceivedInvitations()
    } catch (error) {
      console.error('Error declining invitation:', error)
      toast.error('Error al rechazar la invitación')
    }
  }

  const handleCancelInvitation = async (invitationId: number) => {
    const confirmed = await confirm({
      title: 'Cancelar invitación',
      description: '¿Estás seguro de que quieres cancelar esta invitación?',
      confirmText: 'Cancelar invitación',
      cancelText: 'Volver',
      variant: 'destructive'
    })

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al cancelar la invitación')
        return
      }

      toast.success('Invitación cancelada')
      // Refresh invitations
      await fetchSentInvitations()
    } catch (error) {
      console.error('Error canceling invitation:', error)
      toast.error('Error al cancelar la invitación')
    }
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Return null while redirecting
  if (!session) {
    return null
  }

  const pendingReceivedCount = receivedInvitations.filter(inv => inv.status === 'PENDING').length
  const pendingSentCount = sentInvitations.filter(inv => inv.status === 'PENDING').length

  return (
    <MainLayout
      title="Invitaciones"
      description="Gestiona tus invitaciones pendientes y enviadas"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                Invitaciones
              </CardTitle>
              <CardDescription className="mt-1">
                Revisa y gestiona las invitaciones a proyectos y espacios
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'received' | 'sent')}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Recibidas
                {pendingReceivedCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {pendingReceivedCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Enviadas
                {pendingSentCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-600 text-white text-xs rounded-full">
                    {pendingSentCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-6">
              {isLoadingReceived ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Cargando invitaciones...</p>
                </div>
              ) : receivedInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes invitaciones
                  </h3>
                  <p className="text-gray-500">
                    Cuando alguien te invite a un proyecto o espacio, aparecerá aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={handleAcceptInvitation}
                      onDecline={handleDeclineInvitation}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-6">
              {isLoadingSent ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Cargando invitaciones...</p>
                </div>
              ) : sentInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No has enviado invitaciones
                  </h3>
                  <p className="text-gray-500">
                    Las invitaciones que envíes a otros usuarios aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentInvitations.map((invitation) => (
                    <InvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={async () => {}}
                      onDecline={handleCancelInvitation}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ConfirmationDialog />
    </MainLayout>
  )
}
