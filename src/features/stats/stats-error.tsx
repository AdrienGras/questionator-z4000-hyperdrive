import { getRouteApi, Link } from '@tanstack/react-router'
import { useUi } from '@/lib/i18n/use-ui'
import { TEXT_LINK_CLASS } from '@/components/text-link'

const route = getRouteApi('/session/$sessionId_/stats')

/**
 * Erreur de la route des statistiques (chunk introuvable, hors ligne avant F17) : hors de
 * `SessionAppearance`, donc dans la langue du navigateur ; propose le retour au passage.
 */
export function StatsError() {
  const { text } = useUi()
  const { sessionId } = route.useParams()
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">{text('stats_error', {})}</h1>
      <Link to="/session/$sessionId" params={{ sessionId }} className={TEXT_LINK_CLASS}>
        {text('stats_back', {})}
      </Link>
    </main>
  )
}
