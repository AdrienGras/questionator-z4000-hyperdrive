import type { Session } from '@/domain/session/types'
import { isDamaged, type StoredSession } from '@/lib/db/damaged-session'
import { getSession } from '@/lib/db/sessions'

/** Écarte la forme endommagée (F31) : un test qui attend une session saine échoue net sinon. */
export function healthy<T extends null | undefined>(value: StoredSession | T): Session | T {
  if (value !== null && value !== undefined && isDamaged(value)) {
    throw new Error(
      `Session « ${value.id} » endommagée, saine attendue : ${JSON.stringify(value.issues)}`,
    )
  }
  return value
}

/** `getSession` pour un test qui n'attend qu'une session saine ou absente. */
export async function getHealthySession(id: string): Promise<Session | null> {
  return healthy(await getSession(id))
}
