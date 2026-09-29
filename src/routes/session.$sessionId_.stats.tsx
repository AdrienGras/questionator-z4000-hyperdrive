import { createFileRoute } from '@tanstack/react-router'
import { StatsError } from '@/features/stats/stats-error'
import { StatsPage } from '@/features/stats/stats-page'

export const Route = createFileRoute('/session/$sessionId_/stats')({
  // Seul le composant (et Recharts derrière lui) part dans un chunk paresseux : l'errorComponent
  // reste dans le fichier de route chargé d'emblée, sinon il ne pourrait pas s'afficher quand le
  // chunk des statistiques échoue à se charger (hors ligne, après un redéploiement).
  codeSplitGroupings: [['component']],
  component: StatsPage,
  errorComponent: StatsError,
})
