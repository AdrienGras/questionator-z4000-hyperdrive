import { DbStatusBanner } from '@/components/db-status-banner'
import { isDamaged, type StoredSession } from '@/lib/db/damaged-session'
import type { DbStatus } from '@/lib/db/db'
import type { Ui } from '@/lib/i18n/use-ui'
import { DamagedSessionCard } from './damaged-session-card'
import { EmptyState } from './empty-state'
import { SessionCard } from './session-card'

type SessionListProps = Readonly<{
  ui: Ui
  status: DbStatus
  sessions: StoredSession[] | undefined
}>

/** États de la liste par priorité : outdated, unavailable, chargement, vide, compteur et cartes. */
export function SessionList({ ui, status, sessions }: SessionListProps) {
  if (status !== 'open') return <DbStatusBanner ui={ui} status={status} />
  if (sessions === undefined) return null
  if (sessions.length === 0) return <EmptyState ui={ui} />
  return (
    <>
      <p className="text-[13px] leading-[18px] text-muted-foreground tabular-nums">
        {ui.text('sessions_count', { count: sessions.length })}
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] gap-4">
        {sessions.map((session) => (
          <li key={session.id} className="flex">
            {isDamaged(session) ? (
              <DamagedSessionCard ui={ui} damaged={session} />
            ) : (
              <SessionCard ui={ui} session={session} />
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
