import { DbStatusBanner } from '@/components/DbStatusBanner'
import type { DbStatus } from '@/db'
import type { Session } from '@/domain/types'
import type { Ui } from '@/i18n/use-ui'
import { EmptyState } from './EmptyState'
import { SessionCard } from './SessionCard'

type SessionListProps = Readonly<{
  ui: Ui
  status: DbStatus
  sessions: Session[] | undefined
  onImport: () => void
}>

/** États de la liste par priorité : outdated, unavailable, chargement, vide, cartes. */
export function SessionList({ ui, status, sessions, onImport }: SessionListProps) {
  if (status !== 'open') return <DbStatusBanner ui={ui} status={status} />
  if (sessions === undefined) return null
  if (sessions.length === 0) return <EmptyState ui={ui} onImport={onImport} />
  return (
    <ul className="flex flex-col gap-4">
      {sessions.map((session) => (
        <li key={session.id}>
          <SessionCard ui={ui} session={session} />
        </li>
      ))}
    </ul>
  )
}
