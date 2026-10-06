import { createFileRoute } from '@tanstack/react-router'
import { TrainingStatsError } from '@/features/training-stats/training-stats-error'
import { TrainingStatsPage } from '@/features/training-stats/training-stats-page'

export const Route = createFileRoute('/training/$trainingId_/stats')({
  // Seul le composant part dans un chunk paresseux : l'errorComponent reste dans le fichier de
  // route chargé d'emblée, pour s'afficher quand le chunk des stats échoue à se charger.
  codeSplitGroupings: [['component']],
  component: TrainingStatsPage,
  errorComponent: TrainingStatsError,
})
