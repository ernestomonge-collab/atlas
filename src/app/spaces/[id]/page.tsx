import { SpacePageClient } from './space-page-client'

interface SpacePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SpacePage({ params }: SpacePageProps) {
  const { id } = await params
  return <SpacePageClient spaceId={id} />
}