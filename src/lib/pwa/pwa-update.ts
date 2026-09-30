/**
 * Mise à jour du service worker (D72). Même patron que `QuestionatorDb` (D45) : un état
 * observable, consommé par `useSyncExternalStore`, qui ne dépend d'aucun module virtuel.
 */

/** `update-ready` : une nouvelle version est prête, la page doit être rechargée pour l'activer. */
export type PwaStatus = 'current' | 'update-ready'

/** Forme compatible avec `registerSW` de `virtual:pwa-register`, sans l'importer. */
export type RegisterSW = (options: {
  onNeedRefresh?: () => void
  onRegisterError?: (error: unknown) => void
}) => (reloadPage?: boolean) => Promise<void>

export type ControllerSource = Pick<ServiceWorkerContainer, 'controller' | 'addEventListener'>

export class PwaUpdate {
  #status: PwaStatus = 'current'
  readonly #listeners = new Set<() => void>()
  readonly #reload: () => void
  #updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
  // Une version attend l'activation (onNeedRefresh reçu) et aucun changement de contrôleur depuis.
  #waiting = false

  constructor(reload: () => void = () => window.location.reload()) {
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
    // Lu avant tout : au premier chargement, clientsClaim déclenche aussi `controllerchange`.
    const hadController = container.controller !== null
    container.addEventListener('controllerchange', () => {
      if (!hadController) return
      this.#waiting = false
      this.#setStatus('update-ready')
    })
    this.#updateSW = register({
      onNeedRefresh: () => {
        this.#waiting = true
        this.#setStatus('update-ready')
      },
      onRegisterError: (error) => {
        console.warn('Service worker indisponible', error)
      },
    })
  }

  async applyUpdate(): Promise<void> {
    if (this.#waiting && this.#updateSW) {
      await this.#updateSW(true)
      return
    }
    // Version déjà activée (par un autre onglet) ou aucun enregistrement : un rechargement suffit.
    this.#reload()
  }

  #setStatus(status: PwaStatus): void {
    this.#status = status
    for (const listener of this.#listeners) listener()
  }
}

export const pwaUpdate = new PwaUpdate()
