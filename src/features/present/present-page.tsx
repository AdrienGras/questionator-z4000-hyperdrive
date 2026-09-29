import { getRouteApi } from '@tanstack/react-router'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { PresentControls } from '@/features/present/components/present-controls'
import { StudentScreen } from '@/features/present/components/student-screen'
import { WaitingScreen } from '@/features/present/components/waiting-screen'
import { useProjectedView } from '@/features/present/hooks/use-projected-view'
import { useDbStatus } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'

const route = getRouteApi('/present/$sessionId')

/** Vue projetée (F14) : n'affiche que la `ProjectedView`, jamais la session. */
export function PresentPage() {
  const { sessionId } = route.useParams()
  const view = useProjectedView(sessionId)
  const status = useDbStatus()
  const ui = useUi()
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
      <main className="relative">
        <PresentControls />
        {view.mode === 'student' ? (
          // `key` : un autre étudiant projeté repart d'un premier rendu (pas d'animation, Task 3).
          <StudentScreen
            key={`${view.student.lastName}\u0000${view.student.firstName}`}
            view={view}
          />
        ) : (
          <WaitingScreen title={view.examTitle} />
        )}
      </main>
    </SessionAppearance>
  )
}
