import type { ControllerSource } from '@/lib/pwa/pwa-update'

export type FakeContainer = ControllerSource & { dispatchEvent: (event: Event) => boolean }

/** Faux `navigator.serviceWorker` : `controller` fixé, événements via un `EventTarget`. */
export function makeFakeContainer(hasController: boolean): FakeContainer {
  const target = new EventTarget()
  return {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- un ServiceWorker factice suffit : seul `!== null` est lu.
    controller: hasController ? ({} as ServiceWorker) : null,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      target.addEventListener(type, listener)
    },
    dispatchEvent: (event) => target.dispatchEvent(event),
  }
}
