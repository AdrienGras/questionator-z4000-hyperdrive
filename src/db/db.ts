// oxlint-disable-next-line import/no-named-as-default -- le seul export par défaut du module ; l'export nommé "Dexie" n'est que le namespace de types fusionné dessus.
import Dexie, { type EntityTable } from 'dexie'
import type { Session } from '@/domain/types'

/** `outdated` : un autre onglet a monté le schéma, cette connexion est fermée (D45). */
export type DbStatus = 'open' | 'outdated'

/** Un document par session, étudiants et attempts imbriqués (D22). */
export class QuestionatorDb extends Dexie {
  declare readonly sessions: EntityTable<Session, 'id'>

  #status: DbStatus = 'open'
  readonly #listeners = new Set<() => void>()

  constructor(name: string) {
    super(name)
    // Toute évolution passe par version(n).stores(...).upgrade(...).
    this.version(1).stores({ sessions: 'id, updatedAt' })
    // Remplace le traitement par défaut de Dexie (fermeture + log console) : l'onglet qui
    // monte de version n'est jamais bloqué, et celui-ci expose un état observable.
    this.on('versionchange', () => {
      this.close()
      this.#setStatus('outdated')
      return false
    })
  }

  get status(): DbStatus {
    return this.#status
  }

  onStatusChange(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #setStatus(status: DbStatus): void {
    this.#status = status
    for (const listener of this.#listeners) listener()
  }
}

export function createDb(name: string): QuestionatorDb {
  return new QuestionatorDb(name)
}

export const db = createDb('questionator')

declare global {
  interface Window {
    /** Dev uniquement (D23) : vérification manuelle de la réactivité entre fenêtres. */
    __questionatorDb?: QuestionatorDb
  }
}

// oxlint-disable-next-line no-underscore-dangle -- convention de nommage historique pour un hook dev global (D23).
if (import.meta.env.DEV) window.__questionatorDb = db
