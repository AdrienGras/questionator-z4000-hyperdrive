import { createFileRoute } from '@tanstack/react-router'
import { CreateSessionPage } from '@/features/create-session/create-session-page'

export const Route = createFileRoute('/new')({
  component: CreateSessionPage,
})
