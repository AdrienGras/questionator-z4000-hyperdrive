import { Dexie } from 'dexie'
import type { Session } from '@/domain/types'
import { db } from './db'
import { SessionExistsError, SessionNotFoundError } from './errors'

/** Crée une session construite par F06 ; refuse un id existant (D46). */
export async function createSession(session: Session): Promise<void> {
  try {
    await db.sessions.add(session)
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) throw new SessionExistsError(session.id)
    throw error
  }
}

export async function getSession(id: string): Promise<Session | null> {
  return (await db.sessions.get(id)) ?? null
}

/** Sessions de la plus récemment modifiée à la plus ancienne. */
export function listSessions(): Promise<Session[]> {
  // oxlint-disable-next-line unicorn/no-array-reverse -- `Collection#reverse()` de Dexie, pas `Array#reverse()` : ne mute rien, aucune collection ordinaire n'existe encore à cet endroit.
  return db.sessions.orderBy('updatedAt').reverse().toArray()
}

/** Écrase la session de même id (import F05, après confirmation de l'utilisateur). */
export async function putSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export function deleteSession(id: string): Promise<void> {
  return db.sessions.delete(id)
}

/**
 * Seule voie d'écriture des mutations métier (D22, D46). Lecture, mutation et écriture dans une
 * seule transaction `rw` : deux onglets examinateur ne perdent aucune écriture. Le mutator est
 * synchrone et reçoit la session fraîche (copie issue d'IndexedDB) : c'est là que se font les
 * contrôles métier. S'il lève, rien n'est écrit et l'erreur remonte telle quelle.
 */
export function updateSession(
  id: string,
  mutator: (session: Session) => Session,
): Promise<Session> {
  return db.transaction('rw', db.sessions, async () => {
    const current = await db.sessions.get(id)
    if (current === undefined) throw new SessionNotFoundError(id)
    const next = mutator(current)
    if (next.id !== id) {
      throw new Error(
        `Un mutator ne peut pas changer l'id de la session (« ${id} » → « ${next.id} »).`,
      )
    }
    const written = { ...next, updatedAt: new Date().toISOString() }
    await db.sessions.put(written)
    return written
  })
}
