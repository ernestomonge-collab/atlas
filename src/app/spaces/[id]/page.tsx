import { notFound } from 'next/navigation'
import { getMockSpaceById } from '@/lib/mock-data'
import { SpacePageClient } from './space-page-client'

interface SpacePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SpacePage({ params }: SpacePageProps) {
  const { id } = await params
  const space = getMockSpaceById(id)

  if (!space) {
    notFound()
  }

  return <SpacePageClient spaceId={id} />
}