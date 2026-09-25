import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useSyncExternalStore } from 'react'
import type { Session } from '@/domain/session/types'
import { db, type DbStatus, type QuestionatorDb } from './db'
import { getSession, listSessions } from './sessions'

/**
 * Toutes les sessions, de la plus récemment modifiée à la plus ancienne ; `undefined` pendant le
 * chargement. `useLiveQuery` suit aussi les écritures des autres fenêtres (D12).
 */
export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => listSessions(), [])
}

/** `undefined` pendant le chargement, `null` si la session est absente ou supprimée. */
export function useSession(id: string): Session | null | undefined {
  const result = useLiveQuery(async () => ({ id, session: await getSession(id) }), [id])
  // useLiveQuery garde le dernier résultat quand `id` change : on masque celui d'un autre id.
  return result?.id === id ? result.session : undefined
}

/** `outdated` quand un autre onglet a monté le schéma (D45) : la page doit être rechargée. */
export function useDbStatus(database: QuestionatorDb = db): DbStatus {
  const subscribe = useCallback(
    (listener: () => void) => database.onStatusChange(listener),
    [database],
  )
  return useSyncExternalStore(subscribe, () => database.status)
}
