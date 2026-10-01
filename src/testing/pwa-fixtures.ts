import type { ControllerSource } from '@/lib/pwa/pwa-update'

export type FakeContainer = ControllerSource & { dispatchEvent: (event: Event) => boolean }

/**
 * Faux `navigator.serviceWorker` : `controller` fixé, événements via un `EventTarget`.
 * `activeBefore` : un worker était déjà actif au chargement (vrai par défaut avec un contrôleur ;
 * sans contrôleur, vrai simule un Shift+Reload, faux un premier chargement).
 */
export function makeFakeContainer(
  hasController: boolean,
  activeBefore: boolean = hasController,
): FakeContainer {
  const target = new EventTarget()
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- seul `active` est lu.
  const registration = { active: {} } as ServiceWorkerRegistration
  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- un ServiceWorker factice suffit : seul `!== null` est lu.
    controller: hasController ? ({} as ServiceWorker) : null,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      target.addEventListener(type, listener)
    },
    getRegistration: () => Promise.resolve(activeBefore ? registration : undefined),
    dispatchEvent: (event) => target.dispatchEvent(event),
  }
}
