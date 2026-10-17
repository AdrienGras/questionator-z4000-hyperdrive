import { createFileRoute } from '@tanstack/react-router'
import { TrainingsPage } from '@/features/trainings/trainings-page'

export const Route = createFileRoute('/trainings')({
  component: TrainingsPage,
})
