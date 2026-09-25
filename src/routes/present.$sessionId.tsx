import { createFileRoute } from '@tanstack/react-router'
import { PresentPage } from '@/features/present/present-page'

export const Route = createFileRoute('/present/$sessionId')({
  component: PresentPage,
})
