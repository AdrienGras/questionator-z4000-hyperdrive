import { useSyncExternalStore } from 'react'

/** `best-effort` : le navigateur peut effacer la base en cas de manque d'espace (F05 l'indique). */
export type PersistenceStatus = 'persisted' | 'best-effort' | 'unsupported'

let status: PersistenceStatus | undefined
let firstRead: Promise<void> | undefined
const listeners = new Set<() => void>()

function storageManager(): StorageManager | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.storage
}

async function readStatus(): Promise<PersistenceStatus> {
  const storage = storageManager()
  if (typeof storage?.persisted !== 'function') return 'unsupported'
  try {
    return (await storage.persisted()) ? 'persisted' : 'best-effort'
  } catch {
    // Impossible de savoir : on suppose le pire, F05 recommandera les backups.
    return 'best-effort'
  }
}

async function refresh(): Promise<void> {
  status = await readStatus()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  firstRead ??= refresh()
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Demande au navigateur de ne pas effacer la base (appelée par F06 à la première création de
 * session). Idempotente ; renvoie `true` si le stockage est persistant.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = storageManager()
  if (typeof storage?.persist !== 'function') {
    await refresh()
    return false
  }
  let granted: boolean
  try {
    granted = await storage.persist()
  } catch {
    granted = false
  }
  await refresh()
  return granted
}

/** `undefined` tant que la première lecture n'a pas répondu. */
export function usePersistenceStatus(): PersistenceStatus | undefined {
  return useSyncExternalStore(subscribe, () => status)
}
