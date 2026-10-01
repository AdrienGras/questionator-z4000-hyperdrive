import { DbStatusBanner } from '@/components/db-status-banner'
import type { DbStatus } from '@/lib/db/db'
import type { Session } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { EmptyState } from './empty-state'
import { SessionCard } from './session-card'

type SessionListProps = Readonly<{
  ui: Ui
  status: DbStatus
  sessions: Session[] | undefined
}>

/** États de la liste par priorité : outdated, unavailable, chargement, vide, cartes. */
export function SessionList({ ui, status, sessions }: SessionListProps) {
  if (status !== 'open') return <DbStatusBanner ui={ui} status={status} />
  if (sessions === undefined) return null
  if (sessions.length === 0) return <EmptyState ui={ui} />
  return (
    <ul className="grid gap-4 2xl:grid-cols-2">
      {sessions.map((session) => (
        <li key={session.id}>
          <SessionCard ui={ui} session={session} />
        </li>
      ))}
    </ul>
  )
}
