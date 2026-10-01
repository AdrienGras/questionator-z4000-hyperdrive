import { Dexie } from 'dexie'
import type { Session } from '@/domain/session/types'
import { db } from './db'
import { isDamaged, readStored, type StoredSession } from './damaged-session'
import { SessionDamagedError, SessionExistsError, SessionNotFoundError } from './errors'

/** Crée une session construite par F06 ; refuse un id existant (D46). */
export async function createSession(session: Session): Promise<void> {
  try {
    await db.sessions.add(session)
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) throw new SessionExistsError(session.id)
    throw error
  }
}

/** Session validée, forme endommagée si l'enregistrement est incohérent (F31), `null` si absente. */
export async function getSession(id: string): Promise<StoredSession | null> {
  const raw = await db.sessions.get(id)
  return raw === undefined ? null : readStored(raw, id)
}

/**
 * Sessions de la plus récemment modifiée à la plus ancienne, chacune validée (F31). Un
 * enregistrement sans `updatedAt` n'est pas dans l'index : il est lu à part et ajouté en fin.
 */
export async function listSessions(): Promise<StoredSession[]> {
  // oxlint-disable-next-line unicorn/no-array-reverse -- `Collection#reverse()` de Dexie, pas `Array#reverse()` : ne mute rien, aucune collection ordinaire n'existe encore à cet endroit.
  const indexed = await db.sessions.orderBy('updatedAt').reverse().toArray()
  const seen = new Set(indexed.map((record) => record.id))
  const unindexed = (await db.sessions.toArray()).filter((record) => !seen.has(record.id))
  return [...indexed, ...unindexed].map((record) => readStored(record, record.id))
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
 * seule transaction `rw` : deux onglets examinateur ne perdent aucune écriture. La session lue est
 * validée : endommagée, `SessionDamagedError` est levée avant le mutator (F31). Le mutator est
 * synchrone et reçoit la session fraîche et validée : c'est là que se font les
 * contrôles métier. S'il lève, rien n'est écrit et l'erreur remonte telle quelle. Le mutator est
 * immuable (il renvoie une nouvelle session) ; s'il renvoie la session reçue, rien n'a changé :
 * pas d'écriture, `updatedAt` intact, la session lue est renvoyée.
 */
export function updateSession(
  id: string,
  mutator: (session: Session) => Session,
): Promise<Session> {
  return db.transaction('rw', db.sessions, async () => {
    const raw = await db.sessions.get(id)
    if (raw === undefined) throw new SessionNotFoundError(id)
    const current = readStored(raw, id)
    if (isDamaged(current)) throw new SessionDamagedError(id)
    const next = mutator(current)
    if (next.id !== id) {
      throw new Error(
        `Un mutator ne peut pas changer l'id de la session (« ${id} » → « ${next.id} »).`,
      )
    }
    if (next === current) return current
    const written = { ...next, updatedAt: new Date().toISOString() }
    await db.sessions.put(written)
    return written
  })
}
