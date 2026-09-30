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

/**
 * Recharge la page une seule fois dès qu'une nouvelle version est prête ou que la base est
 * `outdated` ; les deux signaux peuvent arriver ensemble (D72).
 */
export function useReloadOnUpdate(
  dbOutdated: boolean,
  update: PwaUpdate = pwaUpdate,
  reload: () => void = () => window.location.reload(),
): void {
  const { status } = usePwaUpdate(update)
  const reloaded = useRef(false)
  useEffect(() => {
    if (reloaded.current || (status !== 'update-ready' && !dbOutdated)) return
    reloaded.current = true
    reload()
  }, [status, dbOutdated, reload])
}
