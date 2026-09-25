import { createFileRoute } from '@tanstack/react-router'
import { CreateSessionPage } from '@/create/CreateSessionPage'

export const Route = createFileRoute('/new')({
  component: CreateSessionPage,
})
