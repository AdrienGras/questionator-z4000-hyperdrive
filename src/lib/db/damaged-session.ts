import type { BackupIssue } from '@/domain/backup/issues'
import type { Session } from '@/domain/session/types'

/**
 * Enregistrement lu en base qui ne passe pas la validation (F31, D81). `id` est la clé primaire
 * Dexie, toujours lisible ; `raw` est l'enregistrement tel quel, jamais réécrit.
 */
export type DamagedSession = { id: string; damaged: true; raw: unknown; issues: BackupIssue[] }

export type StoredSession = Session | DamagedSession

export function isDamaged(value: StoredSession): value is DamagedSession {
  return 'damaged' in value
}

/** Valide un enregistrement lu en base ; ne lève jamais. */
export type ReadStored = (raw: unknown, id: string) => StoredSession

/** Appel paresseux : `CSS.supports` absent (jsdom) → tout est accepté. */
function cssSupports(property: string, value: string): boolean {
  return typeof CSS === 'undefined' || typeof CSS.supports !== 'function'
    ? true
    : CSS.supports(property, value)
}

let loading: Promise<ReadStored> | undefined

/**
 * Validateur des enregistrements lus, chargé à la demande et mémoïsé (F31, D81) : il embarque
 * toute la validation de config (schémas, noms d'icônes), trop lourde pour le bundle initial.
 * Un échec de chargement n'est pas mémoïsé : l'appel suivant retente l'import.
 */
export function loadReadStored(): Promise<ReadStored> {
  loading ??= import('@/domain/backup/stored-session').then(
    ({ checkStoredSession }) =>
      (raw, id) => {
        const result = checkStoredSession(raw, { cssSupports })
        return result.ok ? result.session : { id, damaged: true, raw, issues: result.issues }
      },
    (error: unknown) => {
      loading = undefined
      throw error
    },
  )
  return loading
}

/** Nom lisible d'une session endommagée : le `name` du brut s'il est une chaîne non vide, sinon l'`id`. */
export function damagedName(damaged: DamagedSession): string {
  const { raw } = damaged
  if (typeof raw === 'object' && raw !== null && 'name' in raw) {
    const { name } = raw
    if (typeof name === 'string' && name !== '') return name
  }
  return damaged.id
}
