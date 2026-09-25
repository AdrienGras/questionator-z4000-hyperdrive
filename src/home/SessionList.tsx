import { Button } from '@/components/ui/button'
import type { DbStatus } from '@/db'
import type { Session } from '@/domain/types'
import type { Ui } from '@/i18n/use-ui'
import { EmptyState } from './EmptyState'
import { SessionCard } from './SessionCard'

type SessionListProps = {
  ui: Ui
  status: DbStatus
  sessions: Session[] | undefined
  onImport: () => void
}

/** États de la liste par priorité : outdated, unavailable, chargement, vide, cartes. */
export function SessionList({ ui, status, sessions, onImport }: SessionListProps) {
  const { text } = ui
  if (status === 'outdated') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border p-4">
        <p>{text('db_outdated', {})}</p>
        <Button onClick={() => window.location.reload()}>{text('db_reload', {})}</Button>
      </div>
    )
  }
  if (status === 'unavailable') {
    return (
      <p role="alert" className="rounded-lg border p-4 text-destructive">
        {text('db_unavailable', {})}
      </p>
    )
  }
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
