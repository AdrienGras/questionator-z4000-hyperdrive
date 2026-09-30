/**
 * Mise à jour du service worker (D72). Même patron que `QuestionatorDb` (D45) : un état
 * observable, consommé par `useSyncExternalStore`, qui ne dépend d'aucun module virtuel.
 */

/**
 * `waiting` : une nouvelle version est installée et attend ; rien n'a changé pour cet onglet.
 * `activated` : une nouvelle version a pris le contrôle depuis un autre onglet ; l'ancien pré-cache
 * est supprimé. Les confondre fait boucler la vue projetée : après rechargement, la version attend
 * toujours et `onNeedRefresh` est réémis.
 */
export type PwaStatus = 'current' | 'waiting' | 'activated'

/** Forme compatible avec `registerSW` de `virtual:pwa-register`, sans l'importer. */
export type RegisterSW = (options: {
  onNeedRefresh?: () => void
  onNeedReload?: () => void
  onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void
  onRegisterError?: (error: unknown) => void
}) => (reloadPage?: boolean) => Promise<void>

export type ControllerSource = Pick<ServiceWorkerContainer, 'controller' | 'addEventListener'>

function reloadPage(): void {
  window.location.reload()
}

export class PwaUpdate {
  #status: PwaStatus = 'current'
  readonly #listeners = new Set<() => void>()
  readonly #reload: () => void
  #started = false
  #updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
  #registration: ServiceWorkerRegistration | undefined
  // Cet onglet a cliqué « Recharger » : le `controllerchange` qui suit doit le recharger.
  #applying = false

  constructor(reload: () => void = reloadPage) {
    this.#reload = reload
  }

  get status(): PwaStatus {
    return this.#status
  }

  onStatusChange(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  start(register: RegisterSW, container: ControllerSource = navigator.serviceWorker): void {
    // Un second appel doublerait l'écouteur et l'enregistrement.
    if (this.#started) return
    this.#started = true
    // Lu avant tout : au premier chargement, clientsClaim déclenche un `controllerchange` qui
    // n'annonce aucune nouvelle version. Il est ignoré, une seule fois.
    let ignoreNextControllerChange = container.controller === null
    container.addEventListener('controllerchange', () => {
      const ignored = ignoreNextControllerChange
      ignoreNextControllerChange = false
      // L'onglet qui a demandé l'activation se recharge, quel que soit son passé.
      if (this.#applying) {
        this.#reload()
        return
      }
      if (!ignored) this.#setStatus('activated')
    })
    this.#updateSW = register({
      onNeedRefresh: () => {
        if (this.#status !== 'activated') this.#setStatus('waiting')
      },
      // Obligatoire : sans lui, `registerSW` en mode `prompt` recharge d'office chaque onglet au
      // changement de contrôleur, examinateurs compris.
      onNeedReload: () => {},
      onRegisteredSW: (_swUrl, registration) => {
        this.#registration = registration
      },
      onRegisterError: (error) => {
        console.warn('Service worker indisponible', error)
      },
    })
  }

  async applyUpdate(): Promise<void> {
    // `updateSW(true)` ne recharge jamais lui-même : il envoie `skipWaiting` au worker en attente,
    // s'il y en a un. Sans worker en attente, aucun `controllerchange` ne viendra : on recharge.
    const nothingWaiting = this.#registration !== undefined && this.#registration.waiting === null
    if (this.#status === 'waiting' && this.#updateSW && !nothingWaiting) {
      this.#applying = true
      await this.#updateSW(true)
      return
    }
    // Version déjà activée (par un autre onglet) ou aucun enregistrement : un rechargement suffit.
    this.#reload()
  }

  #setStatus(status: PwaStatus): void {
    if (this.#status === status) return
    this.#status = status
    for (const listener of this.#listeners) listener()
  }
}

export const pwaUpdate = new PwaUpdate()
