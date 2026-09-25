import { getRouteApi } from '@tanstack/react-router'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { useDbStatus, useSession } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'
import { ExaminerView } from '@/features/session/components/examiner-view'

const route = getRouteApi('/session/$sessionId')

/**
 * Vue examinateur (F07 : layout provisoire, D60 ; F09 remplace le corps). `useUi()` ici ne sert
 * qu'aux états sans session ; sous `SessionAppearance`, `ExaminerView` prend la langue de la config.
 */
export function SessionPage() {
  const { sessionId } = route.useParams()
  const session = useSession(sessionId)
  const status = useDbStatus()
  const ui = useUi()
  if (status !== 'open') return <DbStatusBanner ui={ui} status={status} />
  if (session === undefined) return <SessionFallback ui={ui} kind="loading" />
  if (session === null) return <SessionFallback ui={ui} kind="not-found" />
  return (
    <SessionAppearance sessionId={session.id} view="examiner" config={session.config}>
      <ExaminerView session={session} />
    </SessionAppearance>
  )
}
