import { getRouteApi } from '@tanstack/react-router'
import { ProjectedScreen } from '@/components/projection/projected-screen'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { PresentControls } from '@/features/present/components/present-controls'
import { useIdle } from '@/features/present/hooks/use-idle'
import { useProjectedView } from '@/features/present/hooks/use-projected-view'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { useReloadOnUpdate } from '@/lib/pwa/hooks'
import { cn } from '@/lib/utils'

const IDLE_DELAY_MS = 3000

const route = getRouteApi('/present/$sessionId')

/** Vue projetée (F14) : n'affiche que la `ProjectedView`, jamais la session. */
export function PresentPage() {
  const { sessionId } = route.useParams()
  const view = useProjectedView(sessionId)
  const status = useDbStatus()
  const ui = useUi()
  const idle = useIdle(IDLE_DELAY_MS)
  // Avant les retours anticipés (règle des hooks) : la vue projetée se recharge seule (D72).
  useReloadOnUpdate(status === 'outdated')
  if (status !== 'open')
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <DbStatusBanner ui={ui} status={status} />
      </main>
    )
  if (view === undefined) return <SessionFallback ui={ui} kind="loading" />
  if (view === null) return <SessionFallback ui={ui} kind="not-found" />
  return (
    <SessionAppearance sessionId={sessionId} view="present" config={view.appearance}>
      <main className={cn('relative', idle && 'cursor-none')}>
        <PresentControls idle={idle} />
        <ProjectedScreen view={view} className="min-h-svh" />
      </main>
    </SessionAppearance>
  )
}
