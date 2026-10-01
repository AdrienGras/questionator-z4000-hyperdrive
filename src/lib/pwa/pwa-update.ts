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
  onOfflineReady?: () => void
  onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void
  onRegisterError?: (error: unknown) => void
}) => (reloadPage?: boolean) => Promise<void>

export type ControllerSource = Pick<
  ServiceWorkerContainer,
  'controller' | 'addEventListener' | 'getRegistration'
>

/** Déclencheurs de la vérification des mises à jour (F36, D86), injectables pour les tests. */
export type UpdateTriggers = {
  now: () => number
  every: (ms: number, run: () => void) => void
  onVisible: (run: () => void) => void
  onOnline: (run: () => void) => void
}

const CHECK_INTERVAL_MS = 60 * 60_000
// Retour sur l'onglet ou du réseau : pas plus d'une vérification par tranche de 5 minutes.
const CHECK_THROTTLE_MS = 5 * 60_000

export const browserTriggers: UpdateTriggers = {
  now: () => Date.now(),
  every: (ms, run) => {
    setInterval(run, ms)
  },
  onVisible: (run) => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') run()
    })
  },
  onOnline: (run) => {
    window.addEventListener('online', run)
  },
}

function reloadPage(): void {
  window.location.reload()
}

/**
 * Vrai si aucun worker n'était actif avant cet enregistrement : premier chargement, dont le
 * `controllerchange` vient de clientsClaim. Faux après un Shift+Reload (page sans contrôleur, worker
 * déjà actif) : aucun clientsClaim ne viendra, le premier `controllerchange` est une vraie activation.
 * Lu avant `register` ; même lu après, `active` reste nul tant que le pré-cache n'est pas fini.
 */
async function isFirstInstall(container: ControllerSource): Promise<boolean> {
  try {
    const registration = await container.getRegistration()
    return !registration?.active
  } catch {
    // Comportement d'avant F36 : ignorer le premier `controllerchange`.
    return true
  }
}

export class PwaUpdate {
  #status: PwaStatus = 'current'
  #offlineReady = false
  readonly #listeners = new Set<() => void>()
  readonly #reload: () => void
  readonly #triggers: UpdateTriggers
  #started = false
  #updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
  #registration: ServiceWorkerRegistration | undefined
  // Cet onglet a cliqué « Recharger » : le `controllerchange` qui suit doit le recharger.
  #applying = false

  constructor(reload: () => void = reloadPage, triggers: UpdateTriggers = browserTriggers) {
    this.#reload = reload
    this.#triggers = triggers
  }

  get status(): PwaStatus {
    return this.#status
  }

  /** Pré-cache terminé à la première installation (F36), jusqu'à ce que l'examinateur ferme le message. */
  get offlineReady(): boolean {
    return this.#offlineReady
  }

  dismissOfflineReady(): void {
    this.#setOfflineReady(false)
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
    // n'annonce aucune nouvelle version. Il est ignoré, une seule fois. Sans contrôleur, il faut
    // encore savoir si c'est un premier chargement ou un Shift+Reload (F36) : réponse asynchrone.
    const uncontrolled = container.controller === null
    const firstInstall = uncontrolled ? isFirstInstall(container) : Promise.resolve(false)
    let firstChangePending = uncontrolled
    container.addEventListener('controllerchange', () => {
      const first = firstChangePending
      firstChangePending = false
      // L'onglet qui a demandé l'activation se recharge, quel que soit son passé.
      if (this.#applying) {
        this.#reload()
        return
      }
      if (!first) {
        this.#setStatus('activated')
        return
      }
      void firstInstall.then((ignored) => {
        if (!ignored) this.#setStatus('activated')
      })
    })
    this.#updateSW = register({
      onNeedRefresh: () => {
        if (this.#status !== 'activated') this.#setStatus('waiting')
      },
      // Obligatoire : sans lui, `registerSW` en mode `prompt` recharge d'office chaque onglet au
      // changement de contrôleur, examinateurs compris.
      onNeedReload: () => {},
      // Après un Shift+Reload qui trouve une version, workbox-window prend l'installation de cette
      // version pour une première installation (pas de contrôleur) : filtrée par `firstInstall`.
      onOfflineReady: () => {
        void firstInstall.then((first) => {
          if (first) this.#setOfflineReady(true)
        })
      },
      onRegisteredSW: (_swUrl, registration) => {
        if (!this.#registration && registration) this.#watchForUpdates(registration)
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

  /**
   * Vérifie la présence d'une nouvelle version pendant que l'app est ouverte (F36, D86). Une version
   * trouvée passe par `onNeedRefresh` (`waiting`) : jamais appliquée d'office.
   */
  #watchForUpdates(registration: ServiceWorkerRegistration): void {
    const triggers = this.#triggers
    // L'enregistrement vient de vérifier lui-même.
    let lastCheck = triggers.now()
    const check = () => {
      lastCheck = triggers.now()
      registration.update().catch(() => {
        // Hors ligne ou serveur injoignable : le prochain retour du réseau réessaie sans attendre.
        lastCheck = Number.NEGATIVE_INFINITY
      })
    }
    const throttledCheck = () => {
      if (triggers.now() - lastCheck >= CHECK_THROTTLE_MS) check()
    }
    triggers.every(CHECK_INTERVAL_MS, check)
    triggers.onVisible(throttledCheck)
    triggers.onOnline(throttledCheck)
  }

  #setStatus(status: PwaStatus): void {
    if (this.#status === status) return
    this.#status = status
    this.#notify()
  }

  #setOfflineReady(offlineReady: boolean): void {
    if (this.#offlineReady === offlineReady) return
    this.#offlineReady = offlineReady
    this.#notify()
  }

  #notify(): void {
    for (const listener of this.#listeners) listener()
  }
}

export const pwaUpdate = new PwaUpdate()
