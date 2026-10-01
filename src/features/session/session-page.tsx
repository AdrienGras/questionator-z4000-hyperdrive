import { getRouteApi } from '@tanstack/react-router'
import { DamagedSessionScreen } from '@/components/damaged-session'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { isDamaged } from '@/lib/db/damaged-session'
import { useDbStatus, useSession } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { ExaminerView } from '@/features/session/components/examiner-view'

const route = getRouteApi('/session/$sessionId')

/**
 * Vue examinateur (F07 : layout provisoire, D60 ; F09 remplace le corps). `useUi()` ici ne sert
 * qu'aux états sans session lisible ; sous `SessionAppearance`, `ExaminerView` prend la langue de la config.
 */
export function SessionPage() {
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
  if (isDamaged(session))
    return <DamagedSessionScreen ui={ui} damaged={session} variant="examiner" />
  return (
    <SessionAppearance sessionId={session.id} view="examiner" config={session.config}>
      <ExaminerView session={session} />
    </SessionAppearance>
  )
}
