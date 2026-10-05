import { createFileRoute } from '@tanstack/react-router'
import { TrainingSetupPage } from '@/features/training-setup/training-setup-page'

export const Route = createFileRoute('/training/$trainingId_/update')({
  component: TrainingUpdateRoute,
})

/** Mise à jour de la config (F43.4) : l'écran de mise en place, sur cet entraînement. */
function TrainingUpdateRoute() {
  const { trainingId } = Route.useParams()
  return <TrainingSetupPage trainingId={trainingId} />
}
