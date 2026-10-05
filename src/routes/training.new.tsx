import { createFileRoute } from '@tanstack/react-router'
import { TrainingSetupPage } from '@/features/training-setup/training-setup-page'

export const Route = createFileRoute('/training/new')({
  component: TrainingSetupPage,
})
