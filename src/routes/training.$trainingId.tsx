import { createFileRoute } from '@tanstack/react-router'
import { TrainingPage } from '@/features/training/training-page'

export const Route = createFileRoute('/training/$trainingId')({
  component: TrainingPage,
})
