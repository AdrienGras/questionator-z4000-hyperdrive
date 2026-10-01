import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { pwaUpdate, type PwaStatus, type PwaUpdate } from './pwa-update'

export function usePwaUpdate(update: PwaUpdate = pwaUpdate): {
  status: PwaStatus
  applyUpdate: () => Promise<void>
} {
  const subscribe = useCallback((listener: () => void) => update.onStatusChange(listener), [update])
  const status = useSyncExternalStore(subscribe, () => update.status)
  const applyUpdate = useCallback(() => update.applyUpdate(), [update])
  return { status, applyUpdate }
}

/** Message « Prête pour le hors ligne » (F36) : levé à la fin du premier pré-cache. */
export function useOfflineReady(update: PwaUpdate = pwaUpdate): {
  offlineReady: boolean
  dismiss: () => void
} {
  const subscribe = useCallback((listener: () => void) => update.onStatusChange(listener), [update])
  const offlineReady = useSyncExternalStore(subscribe, () => update.offlineReady)
  const dismiss = useCallback(() => {
    update.dismissOfflineReady()
  }, [update])
  return { offlineReady, dismiss }
}

function reloadPage(): void {
  window.location.reload()
}

/**
 * Recharge la page une seule fois dès qu'une nouvelle version a pris le contrôle (`activated`) ou
 * que la base est `outdated` ; les deux signaux peuvent arriver ensemble (D72). Jamais sur
 * `waiting` : la version attend toujours après rechargement, la page bouclerait.
 */
export function useReloadOnUpdate(
  dbOutdated: boolean,
  update: PwaUpdate = pwaUpdate,
  reload: () => void = reloadPage,
): void {
  const { status } = usePwaUpdate(update)
  const reloaded = useRef(false)
  useEffect(() => {
    if (reloaded.current || (status !== 'activated' && !dbOutdated)) return
    reloaded.current = true
    reload()
  }, [status, dbOutdated, reload])
}
