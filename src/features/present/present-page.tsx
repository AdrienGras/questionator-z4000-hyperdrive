import { getRouteApi } from '@tanstack/react-router'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { WaitingScreen } from '@/features/present/components/waiting-screen'
import { usePresentedConfig } from '@/features/present/hooks/use-presented-config'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'

const route = getRouteApi('/present/$sessionId')

/** Vue projetée provisoire (F07, D60) : écran d'attente thémé ; F14 en fait la vraie vue. */
export function PresentPage() {
  const { sessionId } = route.useParams()
  const config = usePresentedConfig(sessionId)
  const status = useDbStatus()
  const ui = useUi()
  if (status !== 'open')
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <DbStatusBanner ui={ui} status={status} />
      </main>
    )
  if (config === undefined) return <SessionFallback ui={ui} kind="loading" />
  if (config === null) return <SessionFallback ui={ui} kind="not-found" />
  return (
    <SessionAppearance sessionId={sessionId} view="present" config={config}>
      <WaitingScreen title={config.exam.title} />
    </SessionAppearance>
  )
}
