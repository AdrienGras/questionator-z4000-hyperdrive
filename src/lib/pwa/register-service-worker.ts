import { pwaUpdate } from './pwa-update'

/**
 * Enregistre le service worker et branche le store de mise à jour (D72). Import dynamique :
 * l'enregistrement (workbox-window) reste hors du bundle initial. Appelé sans `await` depuis
 * `main.tsx` : un `await` de haut niveau dans l'entrée fait découper l'appli en chunks supplémentaires.
 */
export async function registerServiceWorker(): Promise<void> {
  const { registerSW } = await import('virtual:pwa-register')
  pwaUpdate.start(registerSW)
}
