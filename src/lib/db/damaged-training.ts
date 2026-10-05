import type { ConfigIssue } from '@/domain/config/issues'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { cssSupports, rawName } from './damaged-session'

/**
 * Entraînement lu en base qui ne passe pas la validation. `id` est la clé primaire Dexie, toujours
 * lisible ; `raw` est l'enregistrement tel quel, jamais réécrit.
 */
export type DamagedTraining = { id: string; damaged: true; raw: unknown; issues: ConfigIssue[] }

export type StoredTraining = Training | DamagedTraining

export function isDamagedTraining(value: StoredTraining): value is DamagedTraining {
  return 'damaged' in value
}

/** Validateurs des enregistrements lus ; ne lèvent jamais. */
export type ReadStoredTraining = {
  /** Entraînement validé, ou sa forme endommagée. */
  training: (raw: unknown, id: string) => StoredTraining
  /** Lignes de journal valides, dans l'ordre reçu ; les lignes invalides sont écartées. */
  draws: (raw: readonly unknown[]) => TrainingDraw[]
}

let loading: Promise<ReadStoredTraining> | undefined

/**
 * Validateurs chargés à la demande et mémoïsés, comme `loadReadStored` : ils embarquent la
 * validation de config, trop lourde pour le bundle initial. Un échec de chargement n'est pas
 * mémoïsé : l'appel suivant retente l'import.
 */
export function loadReadStoredTraining(): Promise<ReadStoredTraining> {
  loading ??= import('@/domain/training/stored-training').then(
    ({ checkStoredTraining, parseStoredDraws }) => ({
      training: (raw, id) => {
        const result = checkStoredTraining(raw, { cssSupports })
        return result.ok ? result.training : { id, damaged: true, raw, issues: result.issues }
      },
      draws: parseStoredDraws,
    }),
    (error: unknown) => {
      loading = undefined
      throw error
    },
  )
  return loading
}

/** Nom lisible d'un entraînement endommagé : le `name` du brut s'il est lisible, sinon l'`id`. */
export function damagedTrainingName(damaged: DamagedTraining): string {
  return rawName(damaged.raw, damaged.id)
}
