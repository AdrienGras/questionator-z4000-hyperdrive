import { getRouteApi, Link } from '@tanstack/react-router'
import { TEXT_LINK_CLASS } from '@/components/text-link'
import { useUi } from '@/lib/i18n/use-ui'

const route = getRouteApi('/training/$trainingId_/stats')

/**
 * Erreur de la route des stats d'entraînement (chunk introuvable, hors ligne) : hors de
 * `SessionAppearance`, donc dans la langue du navigateur ; propose le retour à l'entraînement.
 */
export function TrainingStatsError() {
  const { text } = useUi()
  const { trainingId } = route.useParams()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{text('training_stats_error', {})}</h1>
      <Link to="/training/$trainingId" params={{ trainingId }} className={TEXT_LINK_CLASS}>
        {text('training_stats_back', {})}
      </Link>
    </main>
  )
}
