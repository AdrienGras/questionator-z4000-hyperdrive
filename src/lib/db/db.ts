import { Dexie, type DexieOptions, type EntityTable } from 'dexie'
import type { Session } from '@/domain/session/types'

/**
 * `outdated` : un autre onglet a monté le schéma, cette connexion est fermée (D45).
 * `unavailable` : l'ouverture a échoué (IndexedDB bloqué ou absent — politique navigateur,
 * Safari « bloquer tous les cookies », etc.) (D47).
 */
export type DbStatus = 'open' | 'outdated' | 'unavailable'

/** Un document par session, étudiants et attempts imbriqués (D22). */
export class QuestionatorDb extends Dexie {
  declare readonly sessions: EntityTable<Session, 'id'>

  #status: DbStatus = 'open'
  readonly #listeners = new Set<() => void>()

  constructor(name: string, options?: DexieOptions) {
    super(name, options)
    // Toute évolution passe par version(n).stores(...).upgrade(...).
    this.version(1).stores({ sessions: 'id, updatedAt' })
    // Remplace le traitement par défaut de Dexie (fermeture + log console) : l'onglet qui
    // monte de version n'est jamais bloqué, et celui-ci expose un état observable.
    this.on('versionchange', () => {
      // Sans argument, close() vaut { disableAutoOpen: true } : la réouverture automatique est
      // désactivée, donc les opérations suivantes rejettent avec la DatabaseClosedError de Dexie
      // au lieu de rouvrir silencieusement sur un schéma périmé (close({ disableAutoOpen: false })
      // rouvrirait sans que l'utilisateur ne recharge la page).
      this.close()
      this.#setStatus('outdated')
      return false
    })
    // Ouverture anticipée (D47) : un échec (IndexedDB bloqué ou absent) ne doit jamais rester un
    // rejet non géré. `versionchange` ne peut se produire qu'après une ouverture réussie, donc si
    // ce catch s'exécute le statut est forcément encore 'open' ; le garde reste là pour ne jamais
    // écraser un 'outdated' déjà posé, sans complexifier plus que nécessaire.
    this.open().catch(() => {
      if (this.#status === 'open') this.#setStatus('unavailable')
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

export function createDb(name: string, options?: DexieOptions): QuestionatorDb {
  return new QuestionatorDb(name, options)
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
