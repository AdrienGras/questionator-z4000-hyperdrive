import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useSyncExternalStore } from 'react'
import type { TrainingDraw } from '@/domain/training/types'
import type { StoredSession } from './damaged-session'
import type { StoredTraining } from './damaged-training'
import { db, type DbStatus, type QuestionatorDb } from './db'
import { getSession, listSessions } from './sessions'
import { getTraining, getTrainingDraws, listTrainings } from './trainings'

/**
 * Toutes les sessions, de la plus récemment modifiée à la plus ancienne ; `undefined` pendant le
 * chargement, endommagées comprises (F31). `useLiveQuery` suit aussi les écritures des autres
 * fenêtres (D12).
 */
export function useSessions(): StoredSession[] | undefined {
  return useLiveQuery(() => listSessions(), [])
}

/**
 * `undefined` pendant le chargement, `null` si la session est absente ou supprimée, forme
 * endommagée si l'enregistrement ne passe pas la validation (F31).
 */
export function useSession(id: string): StoredSession | null | undefined {
  const result = useLiveQuery(async () => ({ id, session: await getSession(id) }), [id])
  // useLiveQuery garde le dernier résultat quand `id` change : on masque celui d'un autre id.
  return result?.id === id ? result.session : undefined
}

/** Tous les entraînements, du plus récemment modifié au plus ancien ; `undefined` pendant le chargement. */
export function useTrainings(): StoredTraining[] | undefined {
  return useLiveQuery(() => listTrainings(), [])
}

/** `undefined` pendant le chargement, `null` si l'entraînement est absent, forme endommagée si invalide. */
export function useTraining(id: string): StoredTraining | null | undefined {
  const result = useLiveQuery(async () => ({ id, training: await getTraining(id) }), [id])
  // useLiveQuery garde le dernier résultat quand `id` change : on masque celui d'un autre id.
  return result?.id === id ? result.training : undefined
}

/** Journal des tirages d'un entraînement, dans l'ordre d'insertion ; `undefined` pendant le chargement. */
export function useTrainingDraws(trainingId: string): TrainingDraw[] | undefined {
  const result = useLiveQuery(
    async () => ({ trainingId, draws: await getTrainingDraws(trainingId) }),
    [trainingId],
  )
  return result?.trainingId === trainingId ? result.draws : undefined
}

/** `outdated` quand un autre onglet a monté le schéma (D45) : la page doit être rechargée. */
export function useDbStatus(database: QuestionatorDb = db): DbStatus {
  const subscribe = useCallback(
    (listener: () => void) => database.onStatusChange(listener),
    [database],
  )
  return useSyncExternalStore(subscribe, () => database.status)
}
