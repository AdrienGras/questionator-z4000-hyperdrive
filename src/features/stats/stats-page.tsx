import { getRouteApi } from '@tanstack/react-router'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { isDamaged } from '@/lib/db/damaged-session'
import { useDbStatus, useSession } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { StatsView } from '@/features/stats/components/stats-view'

const route = getRouteApi('/session/$sessionId_/stats')

/**
 * Statistiques d'une session (F15, D70). `useUi()` ici ne sert qu'aux états sans session ; sous
 * `SessionAppearance`, `StatsView` prend la langue de la config. `useSession` reste vivant : les
 * chiffres suivent un passage mené dans une autre fenêtre.
 */
export function StatsPage() {
  const { sessionId } = route.useParams()
  const session = useSession(sessionId)
  const status = useDbStatus()
  const ui = useUi()
  if (status !== 'open')
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <DbStatusBanner ui={ui} status={status} />
      </main>
    )
  if (session === undefined) return <SessionFallback ui={ui} kind="loading" />
  if (session === null) return <SessionFallback ui={ui} kind="not-found" />
  // Provisoire (F31) : l'écran « session endommagée » remplace cette branche.
  if (isDamaged(session)) return <SessionFallback ui={ui} kind="not-found" />
  return (
    <SessionAppearance sessionId={session.id} view="examiner" config={session.config}>
      <StatsView session={session} />
    </SessionAppearance>
  )
}
